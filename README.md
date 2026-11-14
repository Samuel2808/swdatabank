# Star Wars Databank

A small, fast, browser-only Star Wars encyclopedia. Browse six sections (films, characters, planets, species, starships, vehicles), search each by name, open any entry to see all its facts, and hop between related entries: a character's homeworld, a planet's residents, a ship's pilots, and so on.

Your first visit opens with a short intro: a star field, the title "Welcome to the Wiki of Star Wars", and a yellow opening text written for this site that scrolls away into the stars. Press Skip, Enter or Escape to go straight to the site. Later visits open the site directly; "Play intro" at the bottom of the menu plays it again. If your system asks for reduced motion, the title and text are shown still.

A search bar at the top searches every section at once, ignoring upper/lower case, accents and punctuation ("padme" finds Padmé Amidala, "r2d2" finds R2-D2), and lists the results by section.

Each section can also be filtered by its own fields (characters by gender, species or homeworld, planets by climate or terrain, starships and vehicles by class or manufacturer, films by release year or director); the filters combine with each other and with the name box, and "Clear filters" resets them. The filters are kept in the page address, so a filtered list can be shared as a link and the Back button returns to the previous filters. The "← Section" link on an entry's page returns to that section's list as you last left it. Spelling variants in the data are listed as one option, and characters the data gives no species are listed as "Unknown species". Press "☆ Add to favorites" on any entry to keep it in the Favorites menu item; favorites are saved in your browser only.

It looks like a fan page: a black-and-white design with Star Wars accents, a sidebar menu with an icon per section that the Menu / Hide menu button shows and hides on any screen, blurred photos of real filming locations behind each section, and small X-wing and R2-D2/C-3PO silhouettes that play once and then rest for about 5 minutes (the X-wing flies in its own strip under the top bar and the droids walk on theirs at the bottom, so neither crosses text; if your system asks for reduced motion they stand still).

The data is a snapshot of [SWAPI](https://swapi.info) bundled in `data/`, so the site works offline and needs no API key or account. Unofficial fan project, not affiliated with Lucasfilm or Disney.

## Run

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000. (`npm start` does the same.)

## Test

```bash
npm test
```

Uses Node's built-in test runner (Node 18 or newer); there is nothing to install. Tests cover the logic (search, facts, cross-links, routing, data loading and errors, menu, intro and focus rules) and check the bundled data and the wiring of the page and styles, including that nothing in the layout is wider than a 375 px phone. How the page looks and moves is also checked by hand.

## Refresh the data (optional, needs internet)

```bash
node scripts/fetch-data.mjs
```

## Refresh the photos (optional, needs internet)

```bash
node scripts/fetch-photos.mjs
```

The six photos are public domain or CC0, from Wikimedia Commons; see `CREDITS.md`.

## Project files

- `problem.md`: the problem and the requirements (R1, R2, …)
- `spec.md`: the design
- `docs/decisions/`: decision records
- `CREDITS.md`: where each photo comes from
- `CLAUDE.md`: standing rules for coding sessions
