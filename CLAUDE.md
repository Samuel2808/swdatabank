# CLAUDE.md — standing rules for every session

## Project
Star Wars Databank: a static, browser-only Star Wars encyclopedia over a bundled SWAPI snapshot. Read `problem.md` (requirements R1…), `spec.md` (design), `docs/decisions/` (decision records), and the latest `handoff-round-<N>.md` before changing anything.

## Commands
- Run: `python3 -m http.server 8000`, then open http://localhost:8000
- Test: `npm test` (Node's built-in `node --test`; no dependencies to install)
- Refresh data (developer only, needs network): `node scripts/fetch-data.mjs`

## Rules
- No runtime dependencies, no build step, no backend. The site must make no request to any external host (R2): only files under `data/`.
- Keep logic in `js/logic.js` / `js/loader.js` (pure, testable). `js/app.js` only renders and routes.
- Every test name starts with the requirement ID it checks, e.g. `test("R4: search ignores case", …)`.
- Requirement IDs in `problem.md` are never reused. A changed requirement keeps its ID and says what changed; a removed one stays, marked removed.
- Decision records go in `docs/decisions/NNNN-title.md` as Y-statements, numbered 0001, 0002, …
- One change per commit; messages say what changed and why. Never undo or amend a commit. Never commit `.jsonl`, `.venv`, `node_modules`, secrets or personal info.
- No images, logos or official artwork — text and original styling only. Keep the "unofficial fan project" notice in the footer.
