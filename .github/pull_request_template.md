<!--
PR title: Conventional Commits with a scope, for example:
  feat(api): add learner progress endpoint
  fix(web): correct progress bar overflow
  docs(db): clarify enrollment constraints
Keep each commit buildable and testable.
-->

## Summary

<!-- What this change does and why, in a few sentences. Link the related ADR or issue. -->

## What changed

<!-- The main parts of the change, and any decisions or trade-offs you made. -->

- **Database:**
- **API:**
- **Frontend:**

## How to test

<!-- Steps a reviewer can follow to run and check the change. -->

1.
2.

Then confirm the checks pass:

- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm test`
- [ ] `npm run build`

## Screenshots

<!-- For UI changes, include the card in the light and dark themes. Remove this section if not applicable. -->

| Light theme | Dark theme |
| :--- | :--- |
| | |

## AI notes

<!-- Which AI tools you used, what for, and at least one thing they got wrong and how you noticed and fixed it. -->

- **Tools used:**
- **Used for:**
- **Got wrong, noticed, and fixed:**

## Known limitations and next steps

<!-- What you left out or would improve with more time. -->

## Related

<!-- Closes #123, or the ADR this implements. -->

## Checklist

- [ ] Change follows the conventions in `AGENTS.md`
- [ ] Tests added or updated, and they fail without the change
- [ ] Docs updated if behavior or architecture changed
      (`README.md`, `database/README.md`, `docs/decisions/`)
- [ ] Schema change has a generated migration; no applied migration was edited
- [ ] New dependency is explained above
- [ ] API request/response types and validation live in `shared/`
- [ ] No secrets, `.env` files, `node_modules`, or database files committed
