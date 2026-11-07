# ADR-0002: No authentication in v1

- **Status:** Accepted (revisit after the demo)
- **Date:** 2026-11-07
- **Supersedes:** none
- **Related:** `docs/decisions/ADR-0001-data-model.md`

## Context

The product brief's user flow starts with "Sign in / Resume Session," but the v1 goal is a
demoable learner progress dashboard. Authentication, registration, and password reset would
add sessions, credential storage, email delivery, token rotation, and several screens, none of
which demonstrate learner progress. The data model already supports multiple users and
enrollments, so auth can be added later without redesigning the core tables.

The plan already defers auth; this ADR records the decision and defines the demo substitute so
the lack of auth does not become an implicit, undocumented shortcut.

## Decision

v1 has no authentication, registration, password reset, sessions, or tokens.

- One learner, one program, and partial lesson progress are seeded.
- The dashboard loads the seeded learner directly; there is no login screen.
- The API exposes a read-only demo entry point, `GET /api/demo/learner`, plus read-only
  progress and module endpoints. The demo endpoint is the seam that authentication replaces
  later: it becomes "current session user."
- The demo is read-only in v1. Progress is seeded rather than written from the UI. If the demo
  later needs "mark lesson complete," allow it only for the seeded learner and document that
  there is no data isolation.
- Do not deploy write endpoints publicly without authentication.

## Consequences

**Positive**

- Much smaller v1: no credential handling, session storage, email, or protected-route
  middleware.
- The dashboard user flow is reachable in one step, which is better for a demo.
- The core schema is already auth-ready: `users`, `enrollments`, and `lesson_progress` do not
  need to change.

**Negative / trade-offs**

- No per-user data isolation. Every client that can reach the API sees the same demo learner.
- No real "resume session" behavior; reloading simply reloads the seeded learner.
- Theme cannot sync across devices, so it stays in `localStorage` (see ADR-0001).
- Adding auth later will touch the API boundary and client bootstrapping, though not the data
  model.

## Alternatives considered

- **Full auth now** — correct for production, disproportionate for a demo.
- **Hard-coded session/cookie** — mimics login without security, adds complexity for no
  benefit.
- **HTTP basic auth on the demo** — protects a public deployment but does not model learner
  identity, and still needs credential management.
- **No endpoint at all (client-only mock data)** — fastest, but skips the API and database,
  which are part of the deliverable.

## Follow-ups

- [x] Remove "Sign in / Resume Session" from the v1 user flow or label it post-MVP.
      **Done:** `README.md` now documents a read-only v1 flow and a separate post-MVP flow.
- [ ] When auth is added, introduce session middleware and replace `/api/demo/learner` with
      the current-user endpoint; keep the response shape stable.
- [ ] Revisit theme syncing at the same time, since it depends on a stable identity.
