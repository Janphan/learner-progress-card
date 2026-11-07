# ADR-0001: Data model conventions and v1 integrity rules

- **Status:** Accepted
- **Date:** 2026-11-07
- **Supersedes:** none
- **Related:** `database/README.md`, `docs/decisions/ADR-0002-no-auth-v1.md`

## Context

`database/README.md` describes the entities, relationships, and progress semantics, but it
left several implementation choices open: identifier type, timestamp handling, nullability,
email matching, enrollment consistency, theme storage, and the SQLite driver. These choices
affect every table, the API contract, seed data, and migrations, so they need to be settled
before the first schema is written.

This is an MVP for a demo: one seeded learner, one enrolled program, SQLite, Drizzle, and
TypeScript. The goal is a schema that is small, strictly typed, and enforced by the database
rather than only by application code.

## Decision

### 1. Identifiers

Use `integer primary key autoincrement` for every table. Expose IDs as integers in the API and
URLs.

`INTEGER PRIMARY KEY` is SQLite's rowid alias and would already autoincrement; `AUTOINCREMENT`
adds the guarantee that IDs are never reused, which keeps seed and fixture data stable. The
cost is a small `sqlite_sequence` bookkeeping table.

### 2. Timestamps

Store timestamps as UTC ISO-8601 `text`, for example `2026-11-07T10:15:30.000Z`.

- `created_at` is set by application code on insert.
- `updated_at` is set by application code on every update through one shared helper.
- No trigger maintains `updated_at` in v1. SQLite has no automatic updated-at behavior, and an
  application-level helper is easier to test and keeps the schema portable.

ISO-8601 text sorts lexicographically and is unambiguous in JSON, so no integer-epoch
conversion is needed at the API boundary.

### 3. Nullability

Every column is `NOT NULL` unless it is explicitly optional. The optional columns are:

- `programs.description`, `modules.description`
- `enrollments.started_at`, `enrollments.completed_at`
- `lesson_progress.started_at`, `lesson_progress.completed_at`,
  `lesson_progress.last_accessed_at`

`lessons.duration_minutes` is `NOT NULL` with a `>= 0` check; 0 means "no fixed duration."

### 4. Email matching

`users.email` is `text NOT NULL UNIQUE COLLATE NOCASE` so `A@example.com` and
`a@example.com` cannot both be created.

### 5. Enrollment consistency

Mirror the `lesson_progress` pattern: `status` is authoritative, and `started_at` /
`completed_at` must agree with it.

| status | started_at | completed_at |
| :--- | :--- | :--- |
| `enrolled` | `null` | `null` |
| `active` | not null | `null` |
| `completed` | not null | not null |
| `withdrawn` | either | `null` |

Also enforce `completed_at >= started_at` when both are present.

### 6. Theme storage

Theme is a per-device preference, not learner data. v1 stores it in `localStorage` and does
**not** include `users.theme_preference`. This avoids a column that the server never reads and
that cannot be meaningfully scoped without accounts.

If theme later needs to follow a learner across devices, reintroduce it with authentication,
not before.

### 7. Persistence driver

Use `better-sqlite3` with `drizzle-orm/better-sqlite3` for v1.

- Synchronous API, which is simple with Express.
- Runs migrations and constraint tests in-process.
- Makes `PRAGMA foreign_keys = ON` explicit on every connection.

Revisit `libsql` only if the project moves to a remote or edge database.

### 8. Where integrity lives

Enforce integrity in the database (foreign keys, unique indexes, check constraints) **and**
validate at the API boundary with Zod. Application code may not be the only guard.

Note that SQLite enforces foreign keys per connection: every connection, including tests and
CLI scripts, must run `PRAGMA foreign_keys = ON`.

## Consequences

**Positive**

- One obvious type and timestamp format across schema, API, and tests.
- Composite foreign keys remain enforceable because the documented unique parent keys exist.
- No dead `theme_preference` column.
- Constraint behavior is testable without a running server.

**Negative / trade-offs**

- Integer IDs expose record counts and are less friendly to merging datasets than UUIDs.
- Application code must remember to set `updated_at`; a forgotten helper silently leaves it
  stale.
- `COLLATE NOCASE` is ASCII-only; non-ASCII case folding is not handled.
- Dropping `theme_preference` means theme will not sync until auth exists.

## Alternatives considered

- **UUID/text IDs** — better for distributed systems and non-enumerable URLs, but unnecessary
  for a single local SQLite demo and noisier in seed data.
- **Integer epoch timestamps** — smaller and fast to compare, but less readable in the
  database and require conversion at the API boundary.
- **Trigger-maintained `updated_at`** — removes a class of application bugs, but adds
  migration and debugging complexity for a small MVP.
- **Keep `theme_preference` nullable** — harmless but dead; removing it keeps the schema
  honest.
- **`libsql` / Turso** — useful for remote or edge deployments, out of scope for a local demo.

## Follow-ups

- [ ] Reflect these conventions in the Drizzle schema (`database/schema.ts`).
- [ ] Add constraint tests that assert composite FKs, checks, and unique indexes fire with
      `PRAGMA foreign_keys = ON`.
- [ ] Keep `database/README.md` aligned when the schema changes.
