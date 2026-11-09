# Star Wars Databank — Specification

This spec turns the requirements in `problem.md` into a design. Requirement IDs (R1, R2, …) refer to `problem.md`.

## Overview

A static site of plain HTML, CSS and JavaScript ES modules, with no build step and no dependencies. It is served from the project folder by any static file server; the README uses `python3 -m http.server`. All data comes from JSON files in `data/`, which are a snapshot of SWAPI taken from `https://swapi.info/api/`.

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

- A row of six section tabs, then a search box, then the cards.
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

- One column on narrow screens. Cards sit in a CSS grid that wraps (`repeat(auto-fill, minmax(…))`).
- Long values wrap (`overflow-wrap: anywhere`). At 375 px wide there is no horizontal scrolling.
- R8 is checked by hand in the browser at 375 px. It is layout, so there is no automated test.
- The footer says this is an unofficial fan project, not affiliated with Lucasfilm or Disney, with data from SWAPI.

## Code layout

```
index.html          page shell
styles.css          styling
js/sections.js      section table and the reference-field mapping
js/logic.js         pure functions: parse references, build the index, search, facts and related lists, routes
js/loader.js        loads the six JSON files; takes a fetch function so tests can pass a fake one
js/app.js           DOM rendering and hash routing (not unit tested)
scripts/fetch-data.mjs  refreshes data/ from SWAPI (developer only)
tests/*.test.js     node:test tests; each test name starts with the requirement ID it checks
```

## Tests

- Run them with `npm test`, which runs `node --test`. They use Node's built-in test runner, with no dependencies.
- Tests cover the logic: references, search, facts, related links, routes, loading and errors, and that the bundled data has every section and every reference resolves.
- Rendering and layout (R8) are not unit tested.
