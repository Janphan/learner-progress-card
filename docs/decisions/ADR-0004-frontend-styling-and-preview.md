# ADR-0004: Frontend styling, theming, and preview data

- **Status:** Accepted (API connected; preview removed)
- **Date:** 2026-11-07
- **Supersedes:** none
- **Related:** `docs/decisions/ADR-0001-data-model.md`,
  `docs/decisions/ADR-0002-no-auth-v1.md`, `client/src/index.css`, `client/src/learnerApi.ts`

## Context

The dashboard shell is built with React, Vite, and TypeScript, and the visual design is defined
by the colour tokens in `client/src/index.css`. We needed to decide how to wire Tailwind and the
tokens, how light and dark themes are selected, and how to build and review the UI before the
learner API existed. Preview data was the temporary scaffold for that phase.

The learner API now exists, and the dashboard loads the learner list and selected learner's
progress from it. Shared contracts and the shared progress calculation are still future work.

## Decision

### 1. Tailwind v4 with CSS-first configuration

Use `@tailwindcss/vite` with Tailwind v4. Configuration lives in `client/src/index.css`; there is
no `tailwind.config.js`. The stylesheet imports the theme and utilities layers explicitly:

```css
@layer theme, utilities;
@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/utilities.css" layer(utilities);
```

Tailwind's preflight is intentionally omitted so base styles stay explicit and small.

### 2. Design tokens back the utilities

`client/src/index.css` is the source of truth for colours. Its `.app` and
`.app[data-theme='dark']` rules define the light and dark values, while `@theme inline` maps them
to `--color-dashboard-*` utilities (`bg-dashboard-bg`, `text-dashboard-muted`,
`bg-dashboard-accent`, and so on). Components use these Tailwind utilities rather than hard-coded
colours so token changes stay consistent across the dashboard.

Borders and the progress track use separate tokens. `--color-border` (mapped to
`border-dashboard-border`) is tuned for outline contrast on cards, inputs, and dividers, while
`--color-track` (`bg-dashboard-track`) stays subtle behind the progress fill. Sharing one token
made the outlines too faint, especially in the light theme.

### 3. Light and dark themes

- `.app` defines the light token values and sets `color-scheme: light`.
- `.app[data-theme='dark']` overrides the token values and sets `color-scheme: dark`.
- The initial theme comes from `localStorage` (`learner-progress-theme`); when nothing is stored,
  it follows `prefers-color-scheme`.
- The header toggle switches between light and dark and persists the choice.
- Theme stays client-side; there is no server column (see ADR-0001).

### 4. Precomputed preview data was a temporary scaffold (removed)

`client/src/previewData.ts` held five fixed learners spanning the seeded progress stages:
not started, early progress, mid-progress, nearly complete, and completed. It was deleted when
the learner API landed; the dashboard now loads `GET /api/learners` and
`GET /api/learners/:id/progress` through `client/src/learnerApi.ts`.

The scaffold's constraints still apply to the real data path:

- The API is the source of truth. The client validates responses and renders only API-provided
  values.
- Percentages must not become a second progress implementation. Real values come from the
  server's progress calculation, which ADR-0003 requires to move into `shared/`.
- Loading, empty, and retryable error states are part of the API-connected UI.

### 5. One page, no router

The v1 shell renders a single dashboard view. Learner selection is local state, not a route.
Routing can be added when the module detail view exists.

## Consequences

**Positive**

- Visual work proceeded without waiting for the API, and the preview scaffold was easy to remove.
- Tokens have one definition and one mapping, so theme changes are mechanical.
- The dashboard now renders API data with explicit loading, empty, and error states.
- Theme selection is per device and needs no authentication.

**Negative / trade-offs**

- The client's response validation is hand-written until shared Zod contracts exist (ADR-0003).
- API wiring added loading/error state and request-cancellation complexity to the dashboard.
- Tailwind v4's CSS-first configuration differs from older `tailwind.config.js` examples, which can
  confuse contributors.
- Only light and dark are toggleable; there is no explicit "system" option in the UI, though the
  first visit follows the system preference.

## Alternatives considered

- **`tailwind.config.js` with a custom palette** — familiar, but duplicates the token values in a
  second place and makes the CSS custom properties less direct.
- **Plain CSS or CSS modules** — workable, but Tailwind is already the chosen stack and provides
  responsive utilities with less bespoke CSS.
- **Inline mock data in `App.tsx`** — fastest to write, but untested and harder to remove cleanly.
- **Wait for the API before building the UI** — avoids throwaway data, but delays design feedback
  and leaves the shell unproven.

## Follow-ups

- [x] Wire Tailwind and the design tokens in `client/src/index.css`.
- [x] Add the light/dark toggle with `localStorage` persistence and a `prefers-color-scheme`
      default.
- [x] Add testable preview data for the five progress stages. **Done:** removed when the API
      landed.
- [x] Replace `previewData` with the learner API and remove the preview label. **Done:**
      `client/src/learnerApi.ts` (`a2d5b2b`).
- [x] Add loading, empty, and retryable error states for the learner list and progress.
- [x] Give borders their own token so outlines are more visible without strengthening the
      progress track. **Done:** `client/src/index.css` (`fb5f3bd`).
- [ ] Add the module list.
- [ ] Render the API's weekly completion data as a chart.
- [ ] Add Playwright e2e coverage for the dashboard and both themes.
- [ ] Decide whether to expose an explicit "system" theme option.
