# Handoff — end of round 4

Read this with `problem.md`, `spec.md`, `CLAUDE.md` and `docs/decisions/` before starting round 5.

## State

- Round 4 was built on branch `round-4-favorites-filters` (17 commits on top of `main` at `dc0796e`, the commit where the owner added the round 4 requirements). It is pushed and open as pull request #3 (https://github.com/Samuel2808/swdatabank/pull/3) against `main`. **When this handoff was written, the PR was not merged.** Check `gh pr view 3` first: if it is still open, ask the owner before building round 5 on `main`, or round 5 will not contain round 4.
- `npm test`: 142 tests, all passing (99 from rounds 1–3, 43 new). Every test name starts with the requirement ID it checks.
- Test-first commits that fail on purpose at those commits: `321bf9e` (R17), `d40715e` (R18), `1512338` (R19). `5339aca` (R8) passes except one test, the one for the filter and favorites controls, which passes from `6640dce` on.
- The repository has no CI. Nothing runs on a PR; run `npm test` yourself.

## Run and test

- Run: `python3 -m http.server 8000`, then open http://localhost:8000 (`npm start` does the same). In this round, ports 8000 and 8123 were already taken by servers from other sessions (`Address already in use`); any free port works, e.g. `python3 -m http.server 8124`.
- Test: `npm test` (Node's built-in runner, Node 18 or newer, nothing to install).
- The intro (R15) plays on every load; press Skip, Enter or Escape, or click `#intro-skip`, before checking the page.

## What round 4 delivered

| Req | What was built | Where |
|-----|----------------|-------|
| R8 (changed) | Automated layout tests that read `index.html` and `styles.css`: device-width viewport; no `width`, `min-width`, `flex-basis` or `minmax()` column outside `@media (min-width: …)` whose smallest size is over 375 px; `overflow-wrap: anywhere` on the body and `nowrap` only on visually hidden text; `.sky` and `.ground` clip; filter dropdowns and the favorites button have `max-width: 100%`. | `tests/layout.test.js`, decision 0006 |
| R17 | The X-wing, its laser bolts and the droids share one 330 s CSS cycle: the X-wing crosses in the first 1.3 %, the shots fire at the same seconds as before, the droids walk in the first 9.1 %, then all rest off screen to 100 %. The first play starts when the intro ends (the layers are `display: none` until then). | `styles.css` (`fly`, `fire`, `walk`), decision 0007 |
| R18 | "☆ Add to favorites" / "★ In favorites" button on every detail page; a Favorites menu item (new star icon) after the six sections; `#/favorites` grouped by section like the search results; saved in `localStorage` under `swdatabank.favorites` as a JSON list of `"section/id"`. If storage throws, favorites live in memory and a note says they will not be kept. | `js/logic.js` (`favoriteKey`, `parseFavorites`, `toggleFavorite`, `favoriteGroups`, `favoriteButtonText`, route and title), `js/store.js` (`createFavoriteStore(storage)`), `js/icons.js`, `js/app.js`, `styles.css` |
| R19 | A "Filter by" group on every section: one dropdown per field ("Any" plus the values with counts), ANDed together and with the name box, and "Clear filters" (also empties the name box). Fields: films release year, director; characters gender, species, homeworld; planets climate, terrain; species classification, language; starships and vehicles class, manufacturer. | `js/sections.js` (`FILTERS`), `js/logic.js` (`filterValues`, `filterOptions`, `applyFilters(entries, chosen, section, index)`, `countText` 5th argument), `js/app.js` (`renderList`), `styles.css` |

Also: `README.md` describes the new features; `spec.md` has a round 4 section and marks the round 1 (R8) and round 2 (R13 timings) text it replaces.

## How the round went, and the answers the owner gave

- At the start, `problem.md` had no round 4 section and the owner did not have the requirements. A first set of candidate requirements was drafted from the round 3 "known limitations" (X-wing off the text, still silhouettes for reduced motion, a shorter repeat intro); the owner then wrote the real round 4 requirements into `problem.md` (`dc0796e`) instead. **None of those drafted candidates were built or recorded**; they are still open points (see below).
- Twelve questions were asked before coding; the owner answered "Accept all defaults". In short:
  - R8: test by reading the CSS and HTML (no new dependencies); covers every view through the one stylesheet.
  - R17: the cycle starts when the intro ends; both silhouettes play together once; pure CSS; reduced motion still hides them.
  - R18: `localStorage`, no account; in-memory fallback with a note; toggle button with star text; star icon; `#/favorites`; empty state "No favorites yet"; no stars on cards, no "remove all", favorites not in the site-wide search.
  - R19: the fields above; list fields count as each value; case merged; "Not listed" for missing references; dropdowns ("Any" + values with counts), AND across fields; one "Clear filters"; reset on section switch, not kept in the URL.
  - Branch `round-4-favorites-filters`, merged by a PR after review.

## Decisions made in this round, and why

- **0006 — R8 is tested by reading the CSS, not with a headless browser.** `npm test` must need nothing installed and there is no browser in Node. Playwright/Puppeteer would add `node_modules` and a browser download; driving the local Chrome would fail on machines without it. Cost: the tests check the rules that cause sideways scrolling, not a rendered page.
- **0007 — R17 uses one long CSS cycle, not a JavaScript timer.** Keeps decision 0003 (animations in CSS only, `app.js` only renders and routes); `animation-delay` cannot pause between repeats. Cost: the timing is percentages of 330 s in three keyframes that must change together.
- Smaller choices made without being asked (also listed to the owner at the end of round 4):
  - The R8 helper counts `rem` as 16 px (the root size at 375 px), `ch` as 8 px, treats `%`, `vw` and `calc()` as fluid, `clamp()` as its minimum, and skips `@media (min-width: …)` blocks.
  - The droids' rocking and leg swings keep looping off screen while they rest.
  - The Favorites view uses the Films photo, like the search view; the menu item is set apart by a line.
  - Stored favorites that are not a JSON list of valid `section/id` keys are ignored; duplicates are kept once.
  - The search results' group layout was moved into a shared helper, `sectionGroups`, and the favorites view uses it.
  - Manufacturers are also split on `/`, and a piece that is only "Inc", "Inc." or "Incorporated" is joined back to the name before it ("Gallofree Yards, Inc.").
  - Options are sorted ignoring case, numbers in numeric order, "Not listed" last; the option label is the spelling found first in the data.
  - Option counts are for the whole section and do not change as other filters are set.
  - `applyFilters` takes the section as an argument; the spec first omitted it and was corrected in its own commit (`f2ef593`).
  - Empty-result wording with filters: "No planets match these filters." / "No planets match “text” with these filters."

## Unresolved and open points

- **PR #3 is not merged** (see State).
- Not checked by hand: watching a full 330 s cycle to see the silhouettes rest and come back. The R17 tests check the keyframes; the browser check covered filters, favorites and the 375 px width only.
- Carried over from round 3, still open: the X-wing can still pass over text (now only about 4 s every 5.5 minutes); with reduced motion the silhouettes are hidden rather than shown still; the intro adds about 30 s on every load; the search view (and now the favorites view) always use the Films photo.
- Data quirks the filters show as they are: "Galatic Basic" (a SWAPI typo) is a separate language option from "Galactic Basic"; values such as "unknown", "n/a" and "none" are ordinary options; 32 characters have no species in SWAPI, including most humans, so they appear under "Not listed", not "Human".
- Favorites are not in the site-wide search and list cards show no star (not asked for).
- Filters are not kept in the URL, so a filtered list cannot be linked or restored with Back.

## Warnings for the next session

- **Tests read source files with regular expressions.** Keep the existing `styles.css` formatting (see `CLAUDE.md`), keep `app.js` strings the tests look for (`class: "fav"`, `href: "#/favorites"`, `function renderFavorites(`, `el("select"`, `"Any"`, `Clear filters`, `FILTERS[section]`), and keep the `fly`, `fire` and `walk` keyframes with numeric percentages and a final `…, 100%` stop.
- **Any new fixed width over 375 px fails the R8 tests**, unless it is inside `@media (min-width: …)`. Use `min(100%, …)`, `%` or `max-width` instead. New form controls need `max-width: 100%`.
- **Changing the R17 timing** means recomputing the stops of `fly`, `fire` and `walk` together; the comment above them gives the seconds.
- **Favorites storage format** (`swdatabank.favorites`, a JSON array of `"section/id"`) is now data in visitors' browsers. Changing it needs `parseFavorites` to keep reading the old format.
- `FILTERS` fields must exist on every record of their section; a test checks this against the bundled data, so refreshing the data with `scripts/fetch-data.mjs` can break it if SWAPI changes.
- In the in-app browser, pressing Escape right after a reload did not always end the intro (the keypress may arrive before the page's script is listening); clicking `#intro-skip` always works. Not investigated as a bug.
