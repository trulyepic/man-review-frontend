# Frontend CI Rollout TODO

This checklist is split into small branches so each phase can be reviewed and merged independently.

## Phase 1: Lint Baseline

Branch: `frontend-ci-phase-1-lint-baseline`

- [x] Fix current ESLint errors without broad refactors.
- [x] Keep existing warnings visible for later cleanup.
- [x] Confirm `npm run lint` exits successfully.
- [x] Confirm `npm run build` still passes.

## Phase 2: Test Foundation

Suggested branch: `frontend-ci-phase-2-test-foundation`

- [x] Add Vitest, React Testing Library, jsdom, and jest-dom.
- [x] Add `test` and `test:run` npm scripts.
- [x] Add test setup config.
- [x] Add first smoke/component tests for stable public surfaces.
- [x] Confirm tests, lint, and build pass locally.

## Phase 3: GitHub Actions CI

Suggested branch: `frontend-ci-phase-3-github-actions`

- [x] Add `.github/workflows/frontend-ci.yml`.
- [x] Run on pull requests to `main`.
- [x] Run on pushes to `main`.
- [x] Use Node 20 and `npm ci`.
- [x] Gate on lint, tests, and build.

## Phase 4: Browser Smoke Tests

Suggested branch: `frontend-ci-phase-4-browser-smoke`

- [x] Add Playwright after the unit/component test foundation is stable.
- [x] Smoke test public routes: `/`, `/about`, `/contact`, `/terms`, `/privacy`, `/how-rankings-work`.
- [x] Check that pages render non-empty content and no obvious route fallback failures occur.
- [x] Decide whether browser tests should block every PR or run on selected branches.

## Later

- [ ] Consider coverage thresholds after tests cover meaningful logic.
- [ ] Consider lint warning cleanup for hook dependency and Fast Refresh warnings.
- [ ] Consider bundle size monitoring if the Vite chunk warning becomes a release concern.
