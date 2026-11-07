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

> The client and server scaffolds are in place. Tailwind, the database layer, shared
> contracts, and the test tooling are still being wired up.

## Functions:

1. Show learner's name and program
2. Show overall progress bar with percentage
3. Show modules completed out of total
4. Light and Dark theme

## User flow
Open Learning Platform
        ↓
Open demo learner (no sign-in in v1)
        ↓
Open Learning Progress Dashboard
        ↓
View Learner Name + Enrolled Program
        ↓
View Overall Progress Percentage
        ↓
View Completed Modules / Total Modules
        ↓
Select a Module
        ↓
┌───────────────────────┐
│ Is module completed?  │
└───────────────────────┘
      ↓ Yes       ↓ No
Review module     Continue learning
      ↓                ↓
View results      Complete lessons
      └───────┬────────┘
              ↓
      Progress updates
              ↓
 Return to Progress Dashboard

## v1 scope

v1 is a read-only demo: one seeded learner and program, with no sign-in, registration, or
password reset. The "Continue learning" / "Complete lessons" branch above is the target flow,
not v1. See `docs/decisions/ADR-0002-no-auth-v1.md` and `local.plan.md` for the build plan.

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
npm run dev -w learning-progress
```

Open the URL printed by Vite. Its development proxy forwards `/api` requests
to the server on port 3000. The health endpoint is available at
`http://localhost:3000/api/health`.
