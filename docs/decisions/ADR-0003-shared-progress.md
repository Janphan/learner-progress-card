# ADR-0003: Single shared progress calculation

- **Status:** Accepted (shared implementation pending)
- **Date:** 2026-11-07
- **Supersedes:** none
- **Related:** `database/README.md`, `docs/decisions/ADR-0001-data-model.md`,
  `docs/decisions/ADR-0002-no-auth-v1.md`,
  `docs/decisions/ADR-0004-frontend-styling-and-preview.md`, `shared/src/progress.ts` (planned),
  `server/learners/progress.ts` (temporary)

## Context

Overall progress appears in several places: the dashboard, the module list, and API
responses. `database/README.md` defines the progress semantics, but not where the calculation
should live. Computing it separately in SQL for the API and in the client for rendering would
let the two definitions drift, and a learner would see different numbers depending on which
layer produced them.

The local plan already requires progress to be computed in one place (`shared/`). We need a
small, typed, testable implementation that both the server and the client can import without
depending on Drizzle or database row shapes.

> **Implementation status:** Phase 4 is still pending. `shared/src/progress.ts` and its tests
> have not been implemented. The server currently calculates progress in
> `server/learners/progress.ts` and returns it from `GET /api/learners/:id/progress`; the client
> renders those API values and does not calculate progress. That keeps a single runtime
> calculation, but it is not the shared location required by this decision. Moving the
> calculation into `shared/` remains the next step.

## Decision

`computeProgress()` in `shared/src/progress.ts` will be the **single** progress implementation. It
will be exported from the package entry point (`shared/src/index.ts`) together with its
`LessonStatus` and `ProgressModule` types.

### Input

The function will accept a narrow structural type rather than a database row:

```ts
type ProgressModule = {
  lessons: Array<{ status: LessonStatus | null }>
}
```

`status: null` means the learner has no `lesson_progress` record for that lesson. It is treated
as not completed.

### Output and rules

```ts
{
  percent: number
  completedLessons: number
  totalLessons: number
  completedModules: number
  totalModules: number
}
```

- Only lessons with `status === 'completed'` count as completed.
- A module is complete when it has at least one lesson and every lesson is completed.
- A module with zero lessons is never complete and is excluded from both module totals.
- `percent` is `completedLessons / totalLessons * 100`, rounded to the nearest integer.
- Zero total lessons returns `0`, never `NaN`.

### Integration

- The server will map database rows into `ProgressModule[]` and call `computeProgress()` instead
  of keeping progress rules in the route layer.
- The client renders the progress values returned by the API. If a future flow computes
  progress locally (for example, optimistic updates), it must import the same function.
- The function stays free of database, Express, and React imports so both workspaces can use
  it.

Unit tests in `shared/src/progress.test.ts` will cover normal completion, rounding, and empty
modules.

## Consequences

**Positive**

- One definition of progress, so API and UI values cannot disagree.
- The calculation is unit-tested without a database or running server.
- The structural input type keeps `shared/` independent of Drizzle row types.

**Negative / trade-offs**

- The server currently computes progress in a temporary module, so the planned shared function has
  not yet eliminated duplication by location. The calculation is tested and client-independent in
  the meantime.
- The server loads lesson statuses and computes in application code instead of a single SQL
  aggregate. That is fine at demo scale but may need revisiting for large programs.
- Callers must map database rows into `ProgressModule[]`; the mapping is another place to get
  null handling wrong, so it should be tested at the API boundary.
- Adding a progress rule means changing the shared function and its tests, not just a query.

## Alternatives considered

- **SQL aggregate in the API** — fast and compact, but the client would still need its own
  implementation or stale values, and the rules would live in two languages.
- **Client-only calculation** — gives the UI flexibility, but the API could not return an
  authoritative progress value and every consumer would need the rules.
- **Duplicate implementations in client and server** — simple in the short term, but the two
  copies will drift and produce inconsistent numbers.

## Follow-ups

- [ ] Implement `computeProgress()` and its unit tests in `shared/`.
- [ ] Move the server's temporary `calculateProgress()` into `shared/` and import it from the
      learner progress endpoint instead of `server/learners/progress.ts`.
- [ ] Map database rows into `ProgressModule[]` in the server repository and return
      `computeProgress()` output from the learner progress endpoint.
- [ ] Add shared Zod schemas for the progress request/response contract; validate at the server
      boundary and replace the client's hand-written response checks.
- [x] Use API-provided progress in the client; preview data was removed in `a2d5b2b`.
- [ ] Revisit SQL aggregation only if program sizes make in-process calculation too expensive.
