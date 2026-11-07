# ADR-0002: No authentication in v1

- **Status:** Accepted (read-only demo implemented)
- **Date:** 2026-11-07
- **Supersedes:** none
- **Related:** `docs/decisions/ADR-0001-data-model.md`,
  `docs/decisions/ADR-0004-frontend-styling-and-preview.md`, `server/routes/learners.ts`,
  `client/src/learnerApi.ts`

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

- One program with five demo learners at different progress stages is seeded.
- The dashboard offers a dropdown to select an available demo learner without signing in.
- The API exposes read-only endpoints for listing demo learners and retrieving the selected
  learner's profile and progress. Progress is calculated on the server.
- Last activity is the latest non-null `lesson_progress.last_accessed_at` across the selected
  learner's progress records. If none exists, the API returns `null` and the dashboard displays
  "No activity yet".
- The demo is read-only in v1. Progress is seeded rather than written from the UI. If the demo
  later needs "mark lesson complete," allow it only for the seeded learners and document that
  there is no data isolation.
- The dashboard loads the learner list and progress from the API (`client/src/learnerApi.ts`);
  the temporary preview-data scaffold has been removed. The API remains the source of truth and
  responses are validated at the client boundary. See ADR-0004.
- Do not deploy write endpoints publicly without authentication.

## Consequences

**Positive**

- Much smaller v1: no credential handling, session storage, email, or protected-route
  middleware.
- The dashboard can show multiple seeded progress states without signing in.
- The core schema is already auth-ready: `users`, `enrollments`, and `lesson_progress` do not
  need to change.

**Negative / trade-offs**

- No per-user data isolation. Any client that can reach the API can view the available demo
  learners and their progress.
- No real "resume session" behavior or authenticated account switching.
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
- [x] Implement the read-only demo learner and progress endpoints. **Done:**
      `server/routes/learners.ts`.
- [x] Connect the dashboard to those endpoints and remove the preview data. **Done:**
      `client/src/learnerApi.ts`; preview data was removed in `a2d5b2b`.
- [ ] When auth is added, introduce session middleware and replace unrestricted demo learner
      selection with authorized access to learner data.
- [ ] Revisit theme syncing at the same time, since it depends on a stable identity.
