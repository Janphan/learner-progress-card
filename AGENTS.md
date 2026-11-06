# AGENTS.md

Guidance for AI coding agents working in this repository.

## Project

A learner progress dashboard: shows a learner's name, program, overall progress, and
completed modules, with light and dark themes.

## Current state

The repo currently contains the product docs and the folder structure. The intended stack is:

- **Client:** React + Vite + TypeScript
- **Server:** Express + TypeScript
- **Database:** SQLite + Drizzle ORM
- **Shared:** TypeScript types and Zod schemas
- **Tests:** Vitest + Playwright

Do not assume a stack file exists until it has been scaffolded.

## Layout

```
client/      React app
server/      Express API
database/    Drizzle schema, migrations, seed
shared/      Types, Zod schemas, shared logic (planned, not yet created)
test/        End-to-end tests
docs/        Architecture and decision records
```

## Commands

See `README.md` for install, dev, database, and test commands. Treat it as the source of
truth for how to run the project rather than duplicating commands here.

## Conventions

- TypeScript strict mode; avoid `any`.
- Keep API request/response types in `shared/` and validate at the server boundary with Zod.
- Progress is computed in one place (`shared/`), not duplicated in client and server.
- Schema changes go through a generated migration; never edit an applied migration.
- Tests live next to the code; end-to-end tests live in `test/e2e/`.
- Use Conventional Commits with scopes: `feat(api):`, `feat(web):`, `test(db):`, `docs:`.
- Keep each commit buildable and testable.

## Boundaries

- Never commit secrets, `.env` files, `node_modules`, or database files.
- Do not add a dependency without explaining why in the PR/commit.
- Do not rewrite published history or force-push shared branches.
- Ask before changing a decision recorded in `docs/decisions/`.

## Definition of done

`typecheck`, `lint`, `test`, and `build` pass, and the change is reflected in the docs if it
changes behavior or architecture.
