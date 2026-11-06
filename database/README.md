# Data model

## Core tables

### 1. users

Stores learner information and theme preference.

| Column | Constraints / Notes |
| :--- | :--- |
| id | PK |
| name | — |
| email | unique |
| theme_preference | `light`, `dark`, `system` |
| created_at | — |
| updated_at | — |

### 2. programs

Represents a course or learning program.

| Column | Constraints / Notes |
| :--- | :--- |
| id | PK |
| title | — |
| description | — |
| status | `draft`, `published`, `archived` |
| created_at | — |
| updated_at | — |

### 3. modules

A program contains multiple ordered modules.

| Column | Constraints / Notes |
| :--- | :--- |
| id | PK |
| program_id | FK → `programs.id` |
| title | — |
| description | — |
| position | positive integer; unique within program |
| created_at | — |
| updated_at | — |

Constraints:

- Unique `(program_id, position)`.
- Unique `(id, program_id)` — required so `lessons` can reference both columns.

### 4. lessons

A module contains multiple lessons.

| Column | Constraints / Notes |
| :--- | :--- |
| id | PK |
| module_id | FK → `modules.id` |
| program_id | FK → `programs.id`; denormalized for integrity |
| title | — |
| content_type | `video`, `article`, `quiz` |
| position | positive integer; unique within module |
| duration_minutes | — |
| created_at | — |
| updated_at | — |

Constraints:

- Unique `(module_id, position)`.
- Unique `(id, program_id)` — required so `lesson_progress` can reference both columns.
- Composite FK `(module_id, program_id)` → `modules(id, program_id)`, so a lesson cannot point at a module in another program.

### 5. enrollments

Connects users to programs. This supports users joining multiple programs and programs having multiple learners.

| Column | Constraints / Notes |
| :--- | :--- |
| id | PK |
| user_id | FK → `users.id` |
| program_id | FK → `programs.id` |
| enrolled_at | — |
| started_at | — |
| completed_at | — |
| status | `enrolled`, `active`, `completed`, `withdrawn` |

Constraints:

- Unique `(user_id, program_id)`.
- Unique `(id, program_id)` — required so `lesson_progress` can reference both columns.

### 6. lesson_progress

Tracks each learner's progress through individual lessons.

| Column | Constraints / Notes |
| :--- | :--- |
| id | PK |
| enrollment_id | FK → `enrollments.id` |
| lesson_id | FK → `lessons.id` |
| program_id | FK → `programs.id`; denormalized for integrity |
| status | `not_started`, `in_progress`, `completed` |
| progress_percent | integer 0–100, not null, default 0 |
| started_at | — |
| completed_at | — |
| last_accessed_at | — |

Constraints:

- Unique `(enrollment_id, lesson_id)`.
- Composite FK `(enrollment_id, program_id)` → `enrollments(id, program_id)`.
- Composite FK `(lesson_id, program_id)` → `lessons(id, program_id)`.

Because both composite FKs point at the same `program_id`, an enrollment and a lesson from
different programs cannot be paired.

## Relationships

| Entity | Relationship | Related entity | Foreign key |
| :--- | :--- | :--- | :--- |
| users | one-to-many | enrollments | `enrollments.user_id` → `users.id` |
| programs | one-to-many | enrollments | `enrollments.program_id` → `programs.id` |
| programs | one-to-many | modules | `modules.program_id` → `programs.id` |
| modules | one-to-many | lessons | `lessons.module_id` → `modules.id` |
| enrollments | one-to-many | lesson_progress | `lesson_progress.enrollment_id` → `enrollments.id` |
| lessons | one-to-many | lesson_progress | `lesson_progress.lesson_id` → `lessons.id` |

Every relationship is one-to-many; the "many" side holds the foreign key. The extra
`program_id` columns on `lessons` and `lesson_progress` exist only to enforce same-program
integrity; they are not separate conceptual relationships.

## Progress consistency

`status` is authoritative for completion. `progress_percent` must agree with it:

| status | progress_percent | completed_at |
| :--- | :--- | :--- |
| `not_started` | `0` | `null` |
| `in_progress` | `> 0` and `< 100` | `null` |
| `completed` | `100` | not null |

Enforce with check constraints:

- `progress_percent BETWEEN 0 AND 100`
- `(status = 'not_started' AND progress_percent = 0)`
- `(status = 'in_progress' AND progress_percent > 0 AND progress_percent < 100)`
- `(status = 'completed' AND progress_percent = 100 AND completed_at IS NOT NULL)`
- `(status <> 'completed' AND completed_at IS NULL)`

Application code should update `status`, `progress_percent`, and `completed_at` in the same
statement/transaction.

## Calculating dashboard progress

You usually do not need a separate overall-progress table.

**Lessons completed**

Count `lesson_progress` where `enrollment_id = current enrollment` and `status = completed`.

**Total lessons**

Count `lessons` belonging to the enrollment's program.

**Overall percentage**

`completed lessons / total lessons × 100`, rounded to the nearest integer.

**Modules completed**

A module is complete when it has at least one lesson and every lesson in it has a completed
`lesson_progress` record.

`completed modules / total modules`

**Edge cases**

- Program with zero lessons: overall percentage is `0`, not `100` and not `NaN`.
- Module with zero lessons: not complete, and excluded from the `total modules` denominator.
- No modules with lessons: `0%`.
- Division by zero always returns `0`.

## Curriculum edits

Progress is derived from the current curriculum, so editing it changes historical percentages:

- Adding a lesson lowers the percentage until that lesson is completed.
- Removing a lesson removes its progress row via cascade and removes it from the denominator.
- Reordering does not change progress.
- If historical accuracy is required, snapshot the curriculum per enrollment or archive
  lessons instead of deleting them. That is out of scope for this model.

## Ordering

- `modules.position` is unique within a program.
- `lessons.position` is unique within a module.
- Positions start at 1 and are contiguous.
- Reordering needs a transaction and temporary positions (for example, negative values)
  because the unique constraints apply immediately. SQLite does not support deferrable
  constraints.

## Recommended minimal model

- users
- programs
- modules
- lessons
- enrollments
- lesson_progress
