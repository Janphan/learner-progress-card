# learner-progress-card

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-C5F74F?style=for-the-badge&logo=drizzle&logoColor=black)
![Zod](https://img.shields.io/badge/Zod-3E67B1?style=for-the-badge&logo=zod&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)

## Tech Stack

| Layer | Technology | Role |
| :--- | :--- | :--- |
| Language | TypeScript (strict) | Shared types across client, server, and `shared/` |
| Client | React + Vite | Dashboard UI, dev server, and production build |
| Styling | Tailwind CSS + design tokens | Light/dark theming via CSS custom properties |
| Server | Express | REST API, health check, graceful shutdown |
| Database | SQLite + Drizzle ORM | Schema, migrations, and seed data |
| Contracts | Zod | Request/response validation shared by client and server |
| Testing | Vitest + Playwright | Unit/DB/API tests and end-to-end user flows |
| Runtime | Node.js | Server process and tooling |

> The dashboard currently displays labeled, precomputed preview data and is not connected to
> the learner API. Weekly activity, shared contracts, and Playwright e2e are still planned.
> Dashboard styling uses Tailwind utilities and light and dark color tokens defined in
> `client/src/index.css`.

## Planned v1 functions:

1. Select an available demo learner
2. Show learner's name and enrolled program
3. Show overall progress percentage and modules completed out of total
4. Show the most recent lesson activity, or "No activity yet"
5. Light and Dark theme

## User flow (v1)

```text
Open Learning Platform
        ↓
Select a demo learner (no sign-in)
        ↓
Open Learning Progress Dashboard
        ↓
View learner name + enrolled program
        ↓
View progress, modules completed / total, and last activity
        ↓
Select a module
        ↓
View module details and lesson statuses (read-only)
        ↓
Return to progress dashboard
```

## Post-MVP flow

Marking lessons complete and recalculating progress is deferred until after v1.

```text
Select a module
        ↓
┌───────────────────────┐
│ Is module completed?  │
└───────────────────────┘
      ↓ Yes        ↓ No
Review module    Continue learning
      ↓                ↓
View results     Complete lessons
      └───────┬────────┘
              ↓
      Progress updates
              ↓
 Return to progress dashboard
```

## v1 scope

v1 is a planned read-only demo: one seeded program with five learners at different progress
stages, and no sign-in, registration, or password reset. The dashboard will offer a dropdown
to select a demo learner. Anyone who can access the demo can view their data; selection is
not authentication. Progress is seeded, so the "Complete lessons" loop in the post-MVP flow
is not part of v1. Last activity will be the latest recorded lesson access across the
selected learner's progress records, or "No activity yet" when none exists. See
`docs/decisions/ADR-0002-no-auth-v1.md` and `local.plan.md` for the build plan.

## Future work

- Add weekly activity data for a line or bar chart. Activity events, time zones, and week
  boundaries will be defined before implementation.

## Development

The repository is an npm workspace monorepo. The `client`, `server`, and `shared`
packages are workspaces; run their scripts from the repository root.

From the repository root, install dependencies:

```bash
npm install
```

Start the Express server:

```bash
npm run dev:server
```

In a second terminal, start the Vite client:

```bash
npm run dev
```

Open the URL printed by Vite. Its development proxy forwards `/api` requests
to the server on port 3000. The health endpoint is available at
`http://localhost:3000/api/health`.

Run the workspace checks from the repository root:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Create or update the local SQLite database from the committed migrations:

```bash
npm run db:migrate
npm run db:seed
```

The seed command creates one demo program with three modules and nine lessons, plus five
learners at different stages: not started, early progress, mid-progress, nearly complete,
and completed. It is safe to run repeatedly.

After changing `database/schema.ts`, generate a new migration before applying it:

```bash
npm run db:generate
npm run db:migrate
```

Set `DATABASE_PATH` to use a different database file (see `.env.example`). Generated
migrations in `database/migrations/` are committed; the database file under `database/data/`
is ignored. `npm test` includes the database tests, which run the migrations against an
in-memory database and verify the schema constraints.

End-to-end commands will be added once Playwright is configured.
