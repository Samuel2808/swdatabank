# Star Wars Databank — Specification

This spec turns the requirements in `problem.md` into a design. Requirement IDs (R1, R2, …) refer to `problem.md`.

## Overview

A static site of plain HTML, CSS and JavaScript ES modules, with no build step and no dependencies. It is served from the project folder by any static file server; the README uses `python3 -m http.server`. All data comes from JSON files in `data/`, which are a snapshot of SWAPI taken from `https://swapi.info/api/`. Since round 2 the site also bundles photos in `img/photos/`; icons and animated silhouettes are inline SVG drawn for this project. Nothing is loaded from another host (R2).

## Data

- `data/films.json`, `data/people.json`, `data/planets.json`, `data/species.json`, `data/starships.json`, `data/vehicles.json`: each is the full SWAPI collection, an array of records, saved unchanged.
- `scripts/fetch-data.mjs` downloads the snapshot again. Only a developer runs it (`node scripts/fetch-data.mjs`); the site never does (R2).
- SWAPI calls characters `people`. The site shows the section as **Characters** but keeps the file name `people.json`.

Snapshot sizes when taken (2026-11-09): films 6, people 82, planets 60, species 37, starships 36, vehicles 39.

### References between records

SWAPI links records with URLs such as `https://swapi.info/api/planets/1`. At load time each URL is turned into a reference `{ section, id }`, for example `{ section: "planets", id: "1" }`. The host part is thrown away, so the site never uses it to make a request (R2). SWAPI already stores links in both directions (a character lists its films, and a film lists its characters), so no reverse index is needed.

## Sections (R1)

| Section id  | Label      | Data file        | Name field |
|-------------|------------|------------------|------------|
| films       | Films      | films.json       | `title`    |
| people      | Characters | people.json      | `name`     |
| planets     | Planets    | planets.json     | `name`     |
| species     | Species    | species.json     | `name`     |
| starships   | Starships  | starships.json   | `name`     |
| vehicles    | Vehicles   | vehicles.json    | `name`     |

Films are listed in episode order. All other sections are listed in the dataset's order.

## Routing

The page state lives in the URL hash, so links and the browser's back button work:

- `#/people`: the Characters section list.
- `#/people/1`: the detail view for character 1.
- An empty or unknown hash shows the Films section.
- A hash naming an unknown entry, such as `#/people/999`, shows a "not found" message with a link back to the section.

## List view (R3, R4)

- A banner photo (R12), the section title, a search box, then the cards. The section menu is in the sidebar (R9).
- Each card shows the entry's name (R3) and links to its detail view.
- Search (R4): an entry matches when its name contains the typed text, ignoring case and leading and trailing spaces. Empty text matches everything. The list updates on every keystroke. When nothing matches, a "No matches" message appears.
- The search text is cleared when the user switches section.

## Detail view (R5, R6)

- The title is the entry's name.
- **Facts (R5):** every field of the record, with the field name made readable (`birth_year` becomes "Birth year"). Fields shown elsewhere are left out:
  - `url`, `created` and `edited` are SWAPI bookkeeping, not facts about the entry.
  - Fields holding references are shown under Related instead.
  - Values such as `"unknown"` and `"n/a"` are shown as they are.
- **Related (R6):** each reference field gets a group heading (for example "Films", "Homeworld", "Residents") and a list of links. Each link shows the target entry's name and points to `#/<section>/<id>`. A reference whose target is not in the snapshot is shown as plain text, "Unknown entry", with no link.
- Field-to-section mapping for references: `homeworld`, `planets` → planets; `films` → films; `species` → species; `starships` → starships; `vehicles` → vehicles; `people`, `characters`, `residents`, `pilots` → people.

## Errors (R7)

- All six files are loaded at startup. If any file cannot be fetched (a network error or a non-200 status) or does not hold a JSON array, loading fails with an error that names the file.
- The page then replaces its content with a visible message: "Could not load the Star Wars data (`<file>`): `<reason>`." It never shows a blank screen.

## Layout (R8)

- One column of content on narrow screens. Cards sit in a CSS grid that wraps (`repeat(auto-fill, minmax(…))`).
- Long values wrap (`overflow-wrap: anywhere`). At 375 px wide there is no horizontal scrolling.
- R8 is checked by hand in the browser at 375 px. It is layout, so there is no automated test.
- The footer says this is an unofficial fan project, not affiliated with Lucasfilm or Disney, with data from SWAPI.

## Round 2: fan-page look (R9–R14)

### Sidebar menu (R9, R10)

- The six section links move out of the top bar into `<nav id="sidebar">`, a full-height bar fixed to the left edge, 220 px wide. The brand ("Databank") sits at its top.
- Each link has an icon (R10) before its label: an original inline SVG drawn for this project, defined in `js/icons.js`, one per section:

  | Section   | Icon |
  |-----------|------|
  | Films     | the opening crawl: lines of text receding into the stars |
  | Characters| a lightsaber |
  | Planets   | a planet with twin suns |
  | Species   | an alien head with long ears |
  | Starships | a TIE-style fighter seen head-on |
  | Vehicles  | a four-legged walker |

> **Changed in round 3.** The two bullets below describe round 2 and are kept for the record. They are replaced by "Sidebar toggle on every screen (R9, changed)" in the round 3 section: the sidebar can now be hidden on wide screens too.

- **Wide screens (768 px and wider):** the sidebar is always shown and the content sits to its right.
- **Narrow screens (below 768 px):** a slim top bar holds a menu button (`#menu-button`, three lines, `aria-controls="sidebar"`, `aria-expanded`) and the brand. The sidebar starts hidden on every page load and slides in over the content when the button is pressed, with a dark scrim behind it. It closes when the button is pressed again, when a section link is followed, when the scrim is clicked, or when Escape is pressed. Nothing is wider than the screen, so R8 still holds.
- The open/closed state is a pure function `nextMenuState(open, action)` in `js/logic.js` with the actions `toggle`, `navigate`, `escape` and `scrim`; `app.js` only applies its result.

### Photos (R11, R12)

- Six freely licensed photos of real Star Wars filming locations, one per section, in `img/photos/<section>.jpg`. Only photos released into the public domain or under CC0 are used, so no licence conditions follow the site; credits are given anyway.

  | Section   | Place (filmed as) |
  |-----------|-------------------|
  | Films     | Mesquite Flat dunes, Death Valley, USA (Tatooine) |
  | Characters| Matmata, Tunisia (Tatooine, the Lars homestead) |
  | Planets   | Skellig Michael, Ireland (Ahch-To) |
  | Species   | Redwood National Park, USA (Endor) |
  | Starships | Tikal, Guatemala (Yavin 4) |
  | Vehicles  | Hardangerjøkulen glacier, Finse, Norway (Hoth) |

- `js/photos.js` lists each photo: section, file, place, the planet it was filmed as, author and licence. It holds no URLs. `CREDITS.md` gives the full source page for each photo.
- `scripts/fetch-photos.mjs` downloads the photos again from Wikimedia Commons as 1280 px wide JPEGs (900 px for the Matmata photo, whose original is only 1080 px wide). Only a developer runs it; the site never does (R2).
- **Background (R11):** a fixed layer behind the page shows the current section's photo (a detail view uses its section's photo), blurred (`filter: blur(6px)`) and darkened. Text never sits directly on the photo: the content sits on panels of near-black (`rgba(0, 0, 0, 0.78)`), so white text keeps a contrast ratio of at least 7:1 whatever the photo shows.
- **Banner (R12):** the top of every list and detail view shows the same photo unblurred, 160 px tall (120 px on narrow screens), cropped to fill, with a caption: "<place> · filmed as <planet>".
- The footer lists the photo credits in one line ("Photos: … public domain / CC0, see CREDITS.md").

### Animations (R13)

- Silhouettes are inline SVG in `index.html`, drawn for this project, in solid black or white. They are decoration only (`aria-hidden="true"`) and never catch clicks (`pointer-events: none`).
- **X-wing:** flies left to right across the upper part of the screen in about 4 s, then waits; the cycle repeats every 14 s. While it crosses it fires two short red laser bolts forward.
- **R2-D2 and C-3PO:** walk together along the bottom of the screen from right to left, taking about 30 s to cross, on a loop. R2-D2 rocks side to side; C-3PO's legs swing.
- Visitors whose system asks for reduced motion (`prefers-reduced-motion: reduce`) see no animation: the silhouettes are hidden.
- Animations are pure CSS (`@keyframes`); no JavaScript runs for them.

### Colours (R14)

- Black and white are the main colours: near-black page and panels, white text.
- The project owner asked for "the colors of Star Wars" on top of that, so three accents are allowed, each for one job:
  - crawl yellow `#ffe81f`: links, the current menu item, keyboard focus and the brand;
  - lightsaber blue `#4dc3ff`: card hover borders;
  - lightsaber red `#ff3b30`: X-wing laser bolts and error messages.
- Greys are allowed for borders and muted text. `styles.css` uses no other colours; a test checks this.

### Testing round 2

- R9: `nextMenuState`; the page has a sidebar and a menu button wired to it; the CSS hides the sidebar below 768 px.
- R10: every section has a distinct, non-empty icon.
- R11, R12: every section has a photo; every photo file exists in `img/photos/` and is a JPEG; every photo has a place, an author and a public-domain or CC0 licence; `CREDITS.md` names every photo; white text on the panel colour has a contrast ratio of at least 7:1.
- R13: the page has the X-wing, R2-D2 and C-3PO silhouettes; the CSS animates them and turns animation off for reduced motion.
- R14: every colour in `styles.css` is black, white, a grey or one of the three accents.
- R2: the no-external-URL check now also covers `styles.css`.
- How it looks (blur, readability, the animations, the 375 px layout) is checked by hand in the browser.

## Round 3: intro, site-wide search, sidebar toggle (R15, R16, R9, R4)

### Opening intro (R15)

- `index.html` starts with `<div id="intro" role="dialog" aria-modal="true" aria-label="Introduction">`, a fixed, opaque black layer above everything. It is in the HTML (not added by JavaScript), so the main page never flashes before it. While it is shown the body has the class `intro-active`, the rest of the page is `inert` (it cannot be clicked or reached with Tab), and the R13 silhouettes are hidden.
- **Stars (R15.1):** drawn for this project, no photo. `starField(count, seed)` in `js/logic.js` returns `count` stars `{ x, y, r, o }` (position in a 1000 × 1000 box, radius 0.4–1.8, opacity 0.3–1) from a small seeded random generator, so the same seed always gives the same sky and the function can be tested. `app.js` draws 260 of them as white `<circle>`s in an SVG that covers the screen (`preserveAspectRatio="xMidYMid slice"`). A few of the brighter stars twinkle with CSS.
- **Title (R15.2):** "Welcome to the Wiki of Star Wars" in crawl yellow, bold, upper case. CSS `@keyframes intro-title` (4 s): it fades in at three times its size, then shrinks to almost nothing and fades out, as if it falls back into the stars.
- **Opening text (R15.3):** a heading and three short paragraphs written for this site, kept in `js/intro.js` (`INTRO`). The text is crawl yellow on black, justified, inside a box with `perspective` and `rotateX(25deg)`, so it leans back into the distance. CSS `@keyframes intro-crawl` (26 s, starting 3.5 s after load) moves it up from below the screen until it has vanished at the top; a mask fades it out near the top.
- **Ending (R15.4):** a "Skip" button sits in the bottom-right corner with the hint "or press Enter / Esc". It gets keyboard focus when the intro starts. Pressing it, Enter or Escape ends the intro. The intro also ends by itself when the text's animation finishes (`animationend` on the crawl, about 30 s after load). Ending removes the layer, takes `inert` off the page, and moves focus to the page's main heading.
- The state is a pure function `nextIntroState(state, event)` in `js/logic.js`. States: `playing`, `still` (reduced motion) and `done`. Events: `skip` (button, Enter, Escape) ends both `playing` and `still`; `end` (the crawl finished) ends `playing` only. `introKeyEnds(key)` says whether a key ends the intro (Enter and Escape). `app.js` only applies the result.
- **Reduced motion (R15.5):** with `prefers-reduced-motion: reduce` there is no movement: no twinkling, the title sits still above the text, and the text is shown flat (no perspective), on screen, scrollable if the screen is short. Because nothing moves, the intro does not end by itself (state `still`): the visitor reads it and presses Skip, Enter or Escape.
- The intro plays on every page load, including a reload and a direct link such as `#/people/1`; when it ends, the page the link names is showing. It is not remembered between visits. It plays no sound.
- It works the same at 375 px: the title and text use sizes in `vw` with limits (`clamp`) so they never overflow (R8).

### Site-wide search (R16)

- **Bar:** the top bar (`<header class="topbar">`) is now shown on every screen size and is sticky at the top of the page. It holds the sidebar button (R9), the brand, and a search form (`role="search"`) with one input, `#global-search`, labelled "Search all sections". The bar is 56 px tall.
- **Route:** typing in the bar goes to `#/search/<text>` (the text URI-encoded). The first keystroke adds one history entry; later keystrokes replace it, so Back returns to the page you were on before searching. Pressing Enter does nothing more (the results are already showing). Opening `#/search/luke` directly fills the bar with "luke". On any other route the bar is emptied. `parseRoute` returns `{ view: "search", query }` for these hashes.
- **Matching rules (pure, tested):**
  - `normalizeText(text)` lowers the case, removes accents (Unicode NFD, then drop combining marks), and drops everything that is not a letter or digit, so "Padmé" → "padme" and "R2-D2" → "r2d2".
  - `matchesQuery(name, query)` splits the query on spaces into words, normalises each, ignores words that become empty, and is true when every remaining word occurs somewhere in the normalised name, in any order. A query with no words matches everything. So "sky" and "skywalker luke" both find "Luke Skywalker", "padme" finds "Padmé Amidala", "r2d2" and "R2 D2" find "R2-D2".
  - `searchAll(index, query)` returns one group `{ section, label, entries }` per section that has a match, in menu order (Films, Characters, Planets, Species, Starships, Vehicles), each group in that section's list order. A blank query returns no groups.
- **Results view:** heading "Search", the summary "N results for “text”" (or a prompt "Type a name in the search bar to search every section." when the bar is empty), then a group per section: the section's icon, label and number of matches, and its entries as the usual cards linking to their detail pages. The summary is a polite live region, so screen readers hear the count as it changes.
- **No match:** "Nothing matches “text” in any section." and a hint: "Check the spelling, or try part of a name, such as “sky” for Skywalker."
- One letter is enough to search; nothing is hidden behind a minimum length.
- The search view uses the Films photo as its backdrop and banner, and no menu item is marked current.

### Section search uses the same rules (R4, changed)

- `searchEntries(entries, query)` now keeps the entries for which `matchesQuery(entry.name, query)` is true. Case, surrounding spaces and empty text behave as before; accents and punctuation are now ignored too.
- The section box is now labelled and worded as a filter ("Filter characters by name…") so it is not confused with the site-wide bar.

### Sidebar toggle on every screen (R9, changed)

- **Before (round 2):** at 768 px and wider the sidebar was always shown and the content always sat to its right; only below 768 px could it be hidden, behind a menu button in a top bar that existed only on narrow screens.
- **Now:** the top bar, and the button in it, are shown on every screen size. The button shows three lines and a text label, "Menu" when the sidebar is closed and "Hide menu" when it is open. It keeps `aria-controls="sidebar"` and `aria-expanded`.
- The sidebar sits below the top bar, full height, 220 px wide. When closed it slides out to the left and is `visibility: hidden`, so its links cannot be reached with Tab.
- **Wide screens (768 px and wider):** it starts open. Opening pushes the content right (`body.menu-open .page { margin-left: 220px }`); closing gives the width back. No scrim. Only the button opens or closes it: following a link or pressing Escape leaves it as it is.
- **Narrow screens (below 768 px):** it starts closed and opens over the content with a scrim, as in round 2. It closes on the button, a followed link, Escape or a click on the scrim.
- To let the content use the freed width, the content panel is now up to 1400 px wide (it was 960 px).
- `nextMenuState(open, action, wide)` gains a third argument. Narrow (`wide` false or missing) behaves as before; wide changes only on `toggle`. `menuStartsOpen(wide)` gives the starting state. When the window crosses 768 px, the state is reset to `menuStartsOpen` for the new width. The choice is not remembered between visits.
- Recorded in decision 0004.

### UX and UI fixes (round 3)

Each fix is listed separately so it can be reviewed on its own. Where a fix has a test, the test is named after the requirement it improves.

- **U1 — Menu focus (R9).** When the narrow-screen sidebar opens, focus moves to its first link; Tab and Shift+Tab cycle inside it; when it closes by Escape, the scrim or the button, focus goes back to the button. The cycling is the pure function `nextFocusIndex(current, count, back)`.
- **U2 — Droids no longer cross text (R13).** R2-D2 and C-3PO walk on a black "ground" strip fixed to the bottom of the screen (64 px, 48 px below 768 px, with a grey line on top). The page has bottom padding of the same height, so text scrolls above the strip and the droids never pass over it. The droids are drawn smaller on narrow screens to fit.
- **U3 — Skip link.** A "Skip to content" link is the first thing Tab reaches on the page (after the intro); it is hidden until focused.
- **U4 — Focus follows navigation.** After a route change, focus moves to the new view's main heading (`tabindex="-1"`), so keyboard and screen-reader users start at the top of the new view instead of on a link that has just disappeared. Typing in the search bar keeps focus in the bar.
- **U5 — Page title on "not found".** The not-found view now sets the browser tab title ("Not found · Star Wars Databank"); before, it kept the previous page's title. The search view sets "Search · Star Wars Databank".
- **U6 — Clearer count.** The section count reads "Showing 12 of 82 characters" instead of "12 of 82", and "No characters match “text”." instead of "No matches".
- **U7 — Section filter wording.** See R4 above: the box says "Filter … by name" and is labelled for screen readers by section.
- **U8 — Credits link.** "see CREDITS.md" in the footer is now a link to the bundled `CREDITS.md`.
- **U9 — Menu button label.** The button has a visible text label (see R9) instead of an icon alone.

### Testing round 3

- R15: `starField` (count, bounds, same seed gives same stars, different seeds differ); `nextIntroState` and `introKeyEnds`; the intro text has the exact title, a heading and paragraphs and mentions the wiki; `index.html` has the intro dialog with a Skip button; `styles.css` animates the title and the crawl, uses crawl yellow and perspective, and stops the intro's movement for reduced motion.
- R16: `normalizeText`, `matchesQuery` and `searchAll` with the test fixture and with the real data (accented names, "R2-D2"); `parseRoute` for search hashes; `index.html` has the search form in the top bar; `styles.css` makes the top bar sticky.
- R9 (changed): the old R9 tests for "the menu always closes" and "hidden only below 768 px" are replaced: `nextMenuState` for narrow and wide, `menuStartsOpen`, `nextFocusIndex` (U1), and the CSS hides the closed sidebar at every width and gives the content its width back.
- R4 (changed): the section search ignores accents and punctuation.
- R13 (U2): the droids walk inside the ground strip and the page leaves room for it.
- How the intro looks and moves, the search results page and the sidebar toggle are checked by hand in the browser at 375 × 812 and at desktop width.

## Code layout

```
index.html          page shell
styles.css          styling
js/sections.js      section table and the reference-field mapping
js/icons.js         one inline SVG icon per section (R10)
js/photos.js        one photo per section, with place and credits (R11, R12)
js/intro.js         the intro's title and opening text (R15)
img/photos/*.jpg    the bundled photos
CREDITS.md          source page, author and licence of each photo
js/logic.js         pure functions: parse references, build the index, search (R4, R16), facts and related lists, routes, menu, focus and intro state, star field
js/loader.js        loads the six JSON files; takes a fetch function so tests can pass a fake one
js/app.js           DOM rendering and hash routing (not unit tested)
scripts/fetch-data.mjs  refreshes data/ from SWAPI (developer only)
scripts/fetch-photos.mjs  refreshes img/photos/ from Wikimedia Commons (developer only)
tests/*.test.js     node:test tests; each test name starts with the requirement ID it checks
```

## Tests

- Run them with `npm test`, which runs `node --test`. They use Node's built-in test runner, with no dependencies.
- Tests cover the logic: references, search, facts, related links, routes, loading and errors, and that the bundled data has every section and every reference resolves.
- Rendering, layout (R8) and how the round 2 visuals look are not unit tested; see "Testing round 2".
