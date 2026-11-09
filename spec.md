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
- `scripts/fetch-photos.mjs` downloads the photos again from Wikimedia Commons, 1600 px wide. Only a developer runs it; the site never does (R2).
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

## Code layout

```
index.html          page shell
styles.css          styling
js/sections.js      section table and the reference-field mapping
js/icons.js         one inline SVG icon per section (R10)
js/photos.js        one photo per section, with place and credits (R11, R12)
img/photos/*.jpg    the bundled photos
CREDITS.md          source page, author and licence of each photo
js/logic.js         pure functions: parse references, build the index, search, facts and related lists, routes
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
