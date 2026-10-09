# simple_react_static — instructions for AI agents

> SDLC agents read this before touching the repo. Keep it short.

## What this repo is
A minimal static React 18 single-page app (currently a single `HelloWorld` component), owned by the Payments team. Built with Vite 6, unit-tested with Jest 30 + React Testing Library, and end-to-end tested with Playwright (Chromium). Runtime: Node.js 18.16 (`.nvmrc`; see "Known pitfalls").

## Commands
| Purpose | Command |
|---|---|
| Build | `npm run build` |
| Lint | `npm run lint` |
| Unit tests | `npm test -- --watchAll=false` |
| E2E tests | `npm run e2e` |
| Coverage | `npm test -- --coverage --watchAll=false --coverageReporters=text-summary` |

These must match the `commands` entry in `sdlc.config.yaml`. First-time setup: `npm ci` then `npx playwright install chromium`.

## Conventions
- Language/style: JavaScript (ES modules) + JSX, function components only; ESLint (`eslint:recommended`, `react`, `react-hooks`) in `.eslintrc.cjs`. Declare `propTypes` for component props.
- Layering: `src/main.jsx` (entry, mounts `App`) → `src/App.jsx` (composition) → `src/components/<Name>.jsx` (one component per file, default export).
- Error handling: no remote calls yet; when added, keep data fetching out of presentational components and render an explicit error state.
- Logging: no `console.*` in committed code; never log PII, tokens, or payment data.
- Tests:
  - Unit: co-located `src/**/<Name>.test.jsx`, React Testing Library, query by role/text (not CSS classes). `@testing-library/jest-dom` is loaded in `jest.setup.js`. Babel config (`babel.config.cjs`) is used by Jest only.
  - E2E: `e2e/*.spec.js`, Playwright. `playwright.config.js` builds the app and serves it with `vite preview` on port 4173.
  - New code needs >= 80% coverage (`coverage_min_new_code`).
- Commits: conventional commits with the Jira key, e.g. `feat(refund): add refund endpoint [PROJ-123]`

## Do-not-touch areas
- `package-lock.json` — change only via `npm install`/`npm uninstall`, never hand-edit.
- `node_modules/`, `dist/`, `coverage/`, `playwright-report/`, `test-results/` — generated, git-ignored.
- `.env*` — never create or commit; secrets come from environment variables only.

## Domain glossary
| Term | Meaning |
|---|---|
| HelloWorld | Placeholder greeting component; `name` prop defaults to `World`. |

## Known pitfalls
- The toolchain is pinned to the newest releases that still support Node 18. Do not bump these until Node is upgraded:
  - `@playwright/test` 1.61.1 (1.62+ needs Node 20)
  - `vite` 6.4.4 (Vite 7+ needs Node 20.19+)
  - `jest`, `babel-jest`, `jest-environment-jsdom` 30.4.1 (30.5+ pulls in `glob@13`, which needs Node 20)
  - ESLint 8 (ESLint 9 needs Node 18.18+)
- `.npmrc` sets `engine-strict=true`, so `npm install` fails with `EBADENGINE` instead of silently installing a Node 20-only package. Do not remove it, and never run `npm audit fix --force`: it jumps to Node 20-only majors.
- Jest must not pick up Playwright specs: unit tests are matched only under `src/`; e2e specs live in `e2e/`.
- Vite ports are `strictPort` (5173 dev, 4173 preview); e2e fails if 4173 is already in use by something other than this app.
