# Data model

## Conventions

These apply to every table unless a column says otherwise.

- **IDs:** `integer primary key autoincrement`. IDs are integers in the API and URLs.
- **Timestamps:** stored as UTC ISO-8601 `text` (for example `2026-11-07T10:15:30.000Z`).
  `created_at` is set on insert; `updated_at` is set by application code on every update.
  SQLite has no automatic `updated_at`, so v1 uses no trigger.
- **Nullability:** every column is `NOT NULL` unless it is marked *nullable* below.
- **Email:** `text`, `NOT NULL`, `UNIQUE`, `COLLATE NOCASE`.
- **Enums:** stored as `text` with a check constraint listing the allowed values.
- **Foreign keys:** enforced per connection; every connection must run
  `PRAGMA foreign_keys = ON`.
- **Theme:** client-side only in v1 (`localStorage`); there is no `users.theme_preference`
  column. See `docs/decisions/ADR-0001-data-model.md`.

## Core tables

### 1. users

Stores learner identity.

| Column | Constraints / Notes |
| :--- | :--- |
| id | integer PK, autoincrement |
| name | text, NOT NULL |
| email | text, NOT NULL, UNIQUE, `COLLATE NOCASE` |
| created_at | text, NOT NULL, UTC ISO-8601 |
| updated_at | text, NOT NULL, UTC ISO-8601 |

Users do not store a theme preference; theme is per-device in v1.

### 2. programs

Represents a course or learning program.

| Column | Constraints / Notes |
| :--- | :--- |
| id | integer PK, autoincrement |
| title | text, NOT NULL |
| description | text, *nullable* |
| status | text, NOT NULL, check: `draft`, `published`, `archived` |
| created_at | text, NOT NULL, UTC ISO-8601 |
| updated_at | text, NOT NULL, UTC ISO-8601 |

### 3. modules

A program contains multiple ordered modules.

| Column | Constraints / Notes |
| :--- | :--- |
| id | integer PK, autoincrement |
| program_id | integer, NOT NULL, FK → `programs.id` |
| title | text, NOT NULL |
| description | text, *nullable* |
| position | integer, NOT NULL, `> 0`; unique within program |
| created_at | text, NOT NULL, UTC ISO-8601 |
| updated_at | text, NOT NULL, UTC ISO-8601 |

Constraints:

- Unique `(program_id, position)`.
- Unique `(id, program_id)` — required so `lessons` can reference both columns.

### 4. lessons

A module contains multiple lessons.

| Column | Constraints / Notes |
| :--- | :--- |
| id | integer PK, autoincrement |
| module_id | integer, NOT NULL, FK → `modules.id` |
| program_id | integer, NOT NULL, FK → `programs.id`; denormalized for integrity |
| title | text, NOT NULL |
| content_type | text, NOT NULL, check: `video`, `article`, `quiz` |
| position | integer, NOT NULL, `> 0`; unique within module |
| duration_minutes | integer, NOT NULL, `>= 0` |
| created_at | text, NOT NULL, UTC ISO-8601 |
| updated_at | text, NOT NULL, UTC ISO-8601 |

Constraints:

- Unique `(module_id, position)`.
- Unique `(id, program_id)` — required so `lesson_progress` can reference both columns.
- Composite FK `(module_id, program_id)` → `modules(id, program_id)`, so a lesson cannot point at a module in another program.

### 5. enrollments

Connects users to programs. This supports users joining multiple programs and programs having multiple learners.

| Column | Constraints / Notes |
| :--- | :--- |
| id | integer PK, autoincrement |
| user_id | integer, NOT NULL, FK → `users.id` |
| program_id | integer, NOT NULL, FK → `programs.id` |
| enrolled_at | text, NOT NULL, UTC ISO-8601 |
| started_at | text, *nullable*, UTC ISO-8601 |
| completed_at | text, *nullable*, UTC ISO-8601 |
| status | text, NOT NULL, check: `enrolled`, `active`, `completed`, `withdrawn` |

Constraints:

- Unique `(user_id, program_id)`.
- Unique `(id, program_id)` — required so `lesson_progress` can reference both columns.
- Check `(status = 'enrolled' AND started_at IS NULL AND completed_at IS NULL)`.
- Check `(status = 'active' AND started_at IS NOT NULL AND completed_at IS NULL)`.
- Check `(status = 'completed' AND started_at IS NOT NULL AND completed_at IS NOT NULL)`.
- Check `(status = 'withdrawn' AND completed_at IS NULL)`.
- Check `(completed_at IS NULL OR started_at IS NULL OR completed_at >= started_at)`.

### 6. lesson_progress

Tracks each learner's progress through individual lessons.

| Column | Constraints / Notes |
| :--- | :--- |
| id | integer PK, autoincrement |
| enrollment_id | integer, NOT NULL, FK → `enrollments.id` |
| lesson_id | integer, NOT NULL, FK → `lessons.id` |
| program_id | integer, NOT NULL, FK → `programs.id`; denormalized for integrity |
| status | text, NOT NULL, check: `not_started`, `in_progress`, `completed` |
| progress_percent | integer, NOT NULL, default `0`, check `0`–`100` |
| started_at | text, *nullable*, UTC ISO-8601 |
| completed_at | text, *nullable*, UTC ISO-8601 |
| last_accessed_at | text, *nullable*, UTC ISO-8601 |

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
