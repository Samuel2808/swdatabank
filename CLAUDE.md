# CLAUDE.md — standing rules for every session

## Project
Star Wars Databank: a static, browser-only Star Wars encyclopedia over a bundled SWAPI snapshot. Read `problem.md` (requirements R1…), `spec.md` (design), `docs/decisions/` (decision records), and the latest `handoff-round-<N>.md` before changing anything.

## Commands
- Run: `python3 -m http.server 8000`, then open http://localhost:8000 (if the port is taken, any free port works, e.g. `python3 -m http.server 8124`)
- Test: `npm test` (Node's built-in `node --test`; no dependencies to install)
- Refresh data (developer only, needs network): `node scripts/fetch-data.mjs`
- Refresh photos (developer only, needs network): `node scripts/fetch-photos.mjs`

## Rules
- No runtime dependencies, no build step, no backend. The site must make no request to any external host (R2): only files bundled in this repository (`data/`, `img/`).
- Keep logic in `js/logic.js` / `js/loader.js` (pure, testable). `js/app.js` only renders and routes. Anything that touches the browser (fetch, storage) is passed in as an argument, as `loadAll(fetch)` and `createFavoriteStore(storage)` in `js/store.js` do, so tests can pass a fake.
- Every test name starts with the requirement ID it checks, e.g. `test("R4: search ignores case", …)`.
- Requirement IDs in `problem.md` are never reused. A changed requirement keeps its ID and says what changed; a removed one stays, marked removed.
- Decision records go in `docs/decisions/NNNN-title.md` as Y-statements, numbered 0001, 0002, …
- One change per commit; messages say what changed and why. Never undo or amend a commit. Never commit `.jsonl`, `.venv`, `node_modules`, secrets or personal info.
- Browser storage (since round 4, R18): only `localStorage`, under keys starting with `swdatabank.`, and never sent anywhere (R2). Code must keep working when storage throws.
- Layout (R8, tested since round 4): no fixed width wider than 375 px outside `@media (min-width: …)`; use `min(100%, …)`, `%` or `max-width`. Form controls get `max-width: 100%`. Do not turn off wrapping (`white-space: nowrap`) except for visually hidden text.
- Animations stay CSS-only (decisions 0003, 0005, 0007); no JavaScript animation loops or timers.
- Some tests read `styles.css` and `js/app.js` with regular expressions. In `styles.css` keep one rule per block, a two-space indent inside `@media`, the closing `}` of a media block at column 0, and `@keyframes` stops as numeric percentages ending in a `…, 100%` stop. If you rename something a test looks for, update the test in the same commit and say why.
- Each round: list the round's requirements from `problem.md` and ask about anything unclear before writing code; commit the `spec.md` update first; commit failing tests (named by requirement ID) before the code that makes them pass; record at least one decision with real alternatives; work on a branch named for the round and merge it through a pull request after the owner reviews it. Write `handoff-round-<N>.md` only when the owner asks.
- Images (since round 2, R11/R12): only bundled photos that are public domain or CC0, each listed in `js/photos.js` and `CREDITS.md`, plus icons and silhouettes drawn for this project as inline SVG. No official artwork, logos (e.g. Rebel or Imperial insignia) or film stills. Keep the "unofficial fan project" notice in the footer.
