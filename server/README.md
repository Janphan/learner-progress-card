# Server

The Express server reads learner data from SQLite and returns progress for
the dashboard. The API is read-only and currently has no authentication.

## Request flow

1. `index.ts` starts Express, opens SQLite, and registers the learner routes.
2. `routes/learners.ts` validates requests and returns HTTP responses.
3. `learners/repository.ts` queries SQLite.
4. `learners/progress.ts` calculates lesson and module totals and percentage.

```text
Request → route → repository → progress calculation → JSON response
```

## Endpoints

- `GET /api/health` — server health check.
- `GET /api/learners` — learners for the dropdown.
- `GET /api/learners/:id/progress` — learner profile, progress, last activity,
  and weekly completion counts.

An invalid ID returns `400`; a missing learner or enrollment returns `404`.
The progress endpoint currently uses the learner's first enrollment.

## Run

See the [root README](../README.md) for database setup and development commands.