// Round 7: R24. In every list of entries (section lists, search results and the
// Favorites page), the cards of favorites show a star.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildIndex, markFavorites, FAVORITE_MARK, searchAll, favoriteGroups } from "../js/logic.js";

const root = new URL("../", import.meta.url);
const read = (name) => readFile(new URL(name, root), "utf8");
const app = await read("js/app.js");
const css = await read("styles.css");

const U = "https://swapi.info/api/";
const index = buildIndex({
  films: [{ title: "A New Hope", episode_id: 4, url: U + "films/1" }],
  people: [
    { name: "Luke Skywalker", url: U + "people/1" },
    { name: "C-3PO", url: U + "people/2" },
    { name: "R2-D2", url: U + "people/3" },
  ],
  planets: [{ name: "Tatooine", url: U + "planets/1" }],
  species: [], starships: [], vehicles: [],
});
const people = index.sections.people;

// The body of a top-level function in js/app.js, up to the next line that is just "}".
function body(name) {
  const m = app.match(new RegExp(`\\nfunction ${name}\\([^)]*\\) \\{\\n([\\s\\S]*?)\\n\\}\\n`));
  assert.ok(m, `js/app.js has function ${name}`);
  return m[1];
}

// ---- pure rule

test("R24: markFavorites marks exactly the entries that are favorites", () => {
  const marked = markFavorites(people, ["people/3", "people/1"]);
  assert.deepEqual(marked.map((m) => [m.entry.name, m.favorite]),
    [["Luke Skywalker", true], ["C-3PO", false], ["R2-D2", true]]);
});

test("R24: markFavorites keeps the list's own order and entries", () => {
  const marked = markFavorites(people, ["people/2"]);
  assert.deepEqual(marked.map((m) => m.entry), people);
});

test("R24: the same id in another section is not a favorite", () => {
  const marked = markFavorites(people, ["planets/1", "films/1"]);
  assert.ok(marked.every((m) => !m.favorite));
});

test("R24: with no favorites, or a missing list, nothing is marked", () => {
  assert.ok(markFavorites(people, []).every((m) => !m.favorite));
  assert.ok(markFavorites(people, undefined).every((m) => !m.favorite));
  assert.deepEqual(markFavorites([], ["people/1"]), []);
});

test("R24: search results and Favorites groups can be marked the same way", () => {
  const [group] = searchAll(index, "sky");
  assert.deepEqual(markFavorites(group.entries, ["people/1"]).map((m) => m.favorite), [true]);
  const favs = favoriteGroups(index, ["people/2", "planets/1"]);
  for (const g of favs) assert.ok(markFavorites(g.entries, ["people/2", "planets/1"]).every((m) => m.favorite));
});

test("R24: the mark is a star with text for screen readers", () => {
  assert.equal(FAVORITE_MARK.star, "★");
  assert.match(FAVORITE_MARK.label, /favorite/i);
});

// ---- the page

test("R24: every card list is drawn by cards(), which adds the star to favorites", () => {
  const cards = body("cards");
  assert.match(cards, /markFavorites\(/, "cards() asks which entries are favorites");
  assert.match(cards, /favorites\.list\(\)/, "from the favorites store");
  assert.match(cards, /class: "star"[^}]*"aria-hidden": "true"/, "the star itself is hidden from screen readers");
  assert.match(cards, /class: "visually-hidden"/, "with hidden text read instead");
  assert.match(cards, /FAVORITE_MARK\.star/);
  assert.match(cards, /FAVORITE_MARK\.label/);
});

test("R24: section lists, search results and the Favorites page all use cards()", () => {
  assert.match(body("renderList"), /cards\(found\)/, "section lists (also after filtering)");
  assert.match(body("sectionGroups"), /cards\(g\.entries\)/, "search results and Favorites groups");
  assert.match(body("renderSearch"), /sectionGroups\(groups\)/);
  assert.match(body("renderFavorites"), /sectionGroups\(groups\)/);
  assert.equal(app.match(/class: "card"/g)?.length, 1, "only one place builds a card");
});

test("R24: the star sits in the card's top-right corner, and long names keep clear of it (R8)", () => {
  assert.match(css, /\n\.card \{[^}]*position: relative/);
  assert.match(css, /\n\.card \{[^}]*padding-right: 28px/);
  assert.match(css, /\n\.card \.star \{[^}]*position: absolute/);
  assert.match(css, /\n\.card \.star \{[^}]*top: \d+px/);
  assert.match(css, /\n\.card \.star \{[^}]*right: \d+px/);
});
