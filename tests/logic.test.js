import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseRef, buildIndex, searchEntries, factsOf, relatedOf, labelFor, parseRoute, hrefFor, nextMenuState,
  menuStartsOpen, nextFocusIndex,
} from "../js/logic.js";

// A tiny fixture shaped like SWAPI records.
const U = "https://swapi.info/api/";
const raw = {
  films: [
    { title: "Return of the Jedi", episode_id: 6, characters: [U + "people/1"], planets: [], starships: [], vehicles: [], species: [], url: U + "films/3", created: "x", edited: "x" },
    { title: "A New Hope", episode_id: 4, characters: [U + "people/1", U + "people/2"], planets: [U + "planets/1"], starships: [], vehicles: [], species: [], url: U + "films/1", created: "x", edited: "x" },
  ],
  people: [
    { name: "Luke Skywalker", birth_year: "19BBY", height: "172", homeworld: U + "planets/1", films: [U + "films/1", U + "films/3"], species: [], starships: [U + "starships/12"], vehicles: [], url: U + "people/1", created: "x", edited: "x" },
    { name: "C-3PO", birth_year: "112BBY", height: "167", homeworld: U + "planets/1", films: [U + "films/1"], species: [], starships: [], vehicles: [], url: U + "people/2", created: "x", edited: "x" },
  ],
  planets: [
    { name: "Tatooine", climate: "arid", residents: [U + "people/1", U + "people/2"], films: [U + "films/1"], url: U + "planets/1", created: "x", edited: "x" },
  ],
  species: [
    { name: "Hutt", homeworld: null, people: [], films: [], url: U + "species/5", created: "x", edited: "x" },
  ],
  starships: [
    { name: "X-wing", model: "T-65 X-wing", pilots: [U + "people/1", U + "people/999"], films: [U + "films/1"], url: U + "starships/12", created: "x", edited: "x" },
  ],
  vehicles: [],
};
const index = buildIndex(raw);

test("R6: parseRef turns a SWAPI URL into a section and id", () => {
  assert.deepEqual(parseRef("https://swapi.info/api/planets/1"), { section: "planets", id: "1" });
  assert.deepEqual(parseRef("https://swapi.dev/api/people/42/"), { section: "people", id: "42" });
});

test("R6: parseRef rejects values that are not SWAPI references", () => {
  assert.equal(parseRef("19BBY"), null);
  assert.equal(parseRef(null), null);
  assert.equal(parseRef("https://swapi.info/api/robots/1"), null);
});

test("R1: buildIndex has all six sections, each listing every entry", () => {
  assert.deepEqual(Object.keys(index.sections).sort(),
    ["films", "people", "planets", "species", "starships", "vehicles"]);
  assert.equal(index.sections.people.length, 2);
  assert.equal(index.sections.vehicles.length, 0);
});

test("R1: films are listed in episode order", () => {
  assert.deepEqual(index.sections.films.map((e) => e.name), ["A New Hope", "Return of the Jedi"]);
});

test("R3: every entry has a name, taken from title for films", () => {
  assert.equal(index.get("films", "1").name, "A New Hope");
  assert.equal(index.get("people", "2").name, "C-3PO");
});

test("R4: search matches part of a name, ignoring case", () => {
  const names = searchEntries(index.sections.people, "SKY").map((e) => e.name);
  assert.deepEqual(names, ["Luke Skywalker"]);
});

test("R4: search ignores surrounding spaces and empty text matches all", () => {
  assert.equal(searchEntries(index.sections.people, "  luke ").length, 1);
  assert.equal(searchEntries(index.sections.people, "").length, 2);
  assert.equal(searchEntries(index.sections.people, "   ").length, 2);
});

test("R4: search with no match returns an empty list", () => {
  assert.deepEqual(searchEntries(index.sections.people, "vader"), []);
});

test("R5: facts include every plain field with readable labels", () => {
  const facts = factsOf(index.get("people", "1"));
  assert.deepEqual(facts, [
    { label: "Name", value: "Luke Skywalker" },
    { label: "Birth year", value: "19BBY" },
    { label: "Height", value: "172" },
  ]);
});

test("R5: facts leave out url, created, edited and reference fields", () => {
  const labels = factsOf(index.get("planets", "1")).map((f) => f.label);
  assert.deepEqual(labels, ["Name", "Climate"]);
});

test("R5: labelFor makes field names readable", () => {
  assert.equal(labelFor("birth_year"), "Birth year");
  assert.equal(labelFor("MGLT"), "MGLT");
  assert.equal(labelFor("climate"), "Climate");
});

test("R6: related groups link a character to homeworld, films and starships", () => {
  const related = relatedOf(index.get("people", "1"), index);
  assert.deepEqual(related.map((g) => g.label), ["Homeworld", "Films", "Starships"]);
  assert.deepEqual(related[0].links, [{ name: "Tatooine", href: "#/planets/1" }]);
  assert.deepEqual(related[1].links.map((l) => l.href), ["#/films/1", "#/films/3"]);
});

test("R6: links go back the other way, from a planet to its residents", () => {
  const residents = relatedOf(index.get("planets", "1"), index).find((g) => g.label === "Residents");
  assert.deepEqual(residents.links.map((l) => l.name), ["Luke Skywalker", "C-3PO"]);
});

test("R6: a reference missing from the data is shown without a link", () => {
  const pilots = relatedOf(index.get("starships", "12"), index).find((g) => g.label === "Pilots");
  assert.deepEqual(pilots.links[1], { name: "Unknown entry", href: null });
});

test("R6: empty and null reference fields produce no group", () => {
  assert.deepEqual(relatedOf(index.get("species", "5"), index), []);
});

test("R6: following a link's href opens that same entry", () => {
  const link = relatedOf(index.get("people", "2"), index)[0].links[0];
  const route = parseRoute(link.href, index);
  assert.equal(route.view, "detail");
  assert.equal(route.entry.name, "Tatooine");
});

test("R1: routes to a section list, defaulting to films", () => {
  assert.deepEqual(parseRoute("#/planets", index), { view: "list", section: "planets" });
  assert.deepEqual(parseRoute("", index), { view: "list", section: "films" });
  assert.deepEqual(parseRoute("#/nonsense", index), { view: "list", section: "films" });
});

test("R5: an unknown entry id routes to not found", () => {
  assert.deepEqual(parseRoute("#/people/999", index), { view: "notfound", section: "people" });
});

test("R6: hrefFor builds the hash for an entry", () => {
  assert.equal(hrefFor("starships", "12"), "#/starships/12");
});

// R9 changed in round 3: the sidebar can be hidden on every screen size.
// The round 2 tests assumed a menu that only existed on narrow screens; they now
// name the screen width they check.

test("R9: on any screen the menu button opens a closed menu and closes an open one", () => {
  for (const wide of [false, true]) {
    assert.equal(nextMenuState(false, "toggle", wide), true, `wide=${wide}`);
    assert.equal(nextMenuState(true, "toggle", wide), false, `wide=${wide}`);
  }
});

test("R9: on narrow screens following a link, pressing Escape or clicking the scrim closes the menu", () => {
  for (const action of ["navigate", "escape", "scrim"]) {
    assert.equal(nextMenuState(true, action, false), false, action);
    assert.equal(nextMenuState(false, action, false), false, action);
    assert.equal(nextMenuState(true, action), false, `${action} with no width given means narrow`);
  }
});

test("R9: on wide screens only the menu button opens or closes the menu", () => {
  for (const action of ["navigate", "escape", "scrim"]) {
    assert.equal(nextMenuState(true, action, true), true, action);
    assert.equal(nextMenuState(false, action, true), false, action);
  }
});

test("R9: an unknown action leaves the menu as it was", () => {
  assert.equal(nextMenuState(true, "resize", false), true);
  assert.equal(nextMenuState(false, undefined, true), false);
});

test("R9: the menu starts open on wide screens and closed on narrow ones", () => {
  assert.equal(menuStartsOpen(true), true);
  assert.equal(menuStartsOpen(false), false);
});

test("R9: Tab moves through the open narrow menu and wraps around (U1)", () => {
  assert.equal(nextFocusIndex(0, 6, false), 1);
  assert.equal(nextFocusIndex(5, 6, false), 0, "Tab on the last link goes to the first");
  assert.equal(nextFocusIndex(0, 6, true), 5, "Shift+Tab on the first link goes to the last");
  assert.equal(nextFocusIndex(3, 6, true), 2);
});

test("R9: focus from outside the menu goes to its first or last link (U1)", () => {
  assert.equal(nextFocusIndex(-1, 6, false), 0);
  assert.equal(nextFocusIndex(-1, 6, true), 5);
  assert.equal(nextFocusIndex(-1, 0, false), -1, "an empty menu has nothing to focus");
});
