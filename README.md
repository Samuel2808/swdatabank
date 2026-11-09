# Star Wars Databank

A small, fast, browser-only Star Wars encyclopedia. Browse six sections (films, characters, planets, species, starships, vehicles), search each by name, open any entry to see all its facts, and hop between related entries: a character's homeworld, a planet's residents, a ship's pilots, and so on.

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

Uses Node's built-in test runner (Node 18 or newer); there is nothing to install. Tests cover the logic (search, facts, cross-links, routing, data loading and errors) and check the bundled data. Page layout is checked by hand.

## Refresh the data (optional, needs internet)

```bash
node scripts/fetch-data.mjs
```

## Project files

- `problem.md`: the problem and the requirements (R1, R2, …)
- `spec.md`: the design
- `docs/decisions/`: decision records
- `CLAUDE.md`: standing rules for coding sessions
