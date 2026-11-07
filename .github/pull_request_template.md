<!--
PR title: Conventional Commits with a scope, for example:
  feat(api): add learner progress endpoint
  fix(web): correct progress bar overflow
  docs(db): clarify enrollment constraints
Keep each commit buildable and testable.
-->

## Summary

<!-- What changed and why, in 2-4 bullets. Link the related ADR or issue. -->

-

## Related

<!-- Closes #123, or the ADR this implements. -->

## Testing

<!-- What you ran and what you verified. -->

- [ ] `typecheck` passes
- [ ] `lint` passes
- [ ] `test` passes
- [ ] `build` passes

## Checklist

- [ ] Change follows the conventions in `AGENTS.md`
- [ ] Tests added or updated, and they fail without the change
- [ ] Docs updated if behavior or architecture changed
      (`README.md`, `database/README.md`, `docs/decisions/`)
- [ ] Schema change has a generated migration; no applied migration was edited
- [ ] New dependency is explained above
- [ ] API request/response types and validation live in `shared/`
- [ ] No secrets, `.env` files, `node_modules`, or database files committed

## Screenshots / recordings

<!-- For UI changes, include light and dark theme. Remove this section if not applicable. -->

## Follow-ups

<!-- Known gaps intentionally left for later. -->
