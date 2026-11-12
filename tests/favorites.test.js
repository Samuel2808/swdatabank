// Round 4: R18. Favorites: pure rules in logic.js, storage in store.js.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  buildIndex, favoriteKey, parseFavorites, toggleFavorite, favoriteGroups, favoriteButtonText,
  parseRoute, titleFor,
} from "../js/logic.js";
import { createFavoriteStore, FAVORITES_KEY } from "../js/store.js";
import { ICONS } from "../js/icons.js";

const root = new URL("../", import.meta.url);
const read = (name) => readFile(new URL(name, root), "utf8");
const app = await read("js/app.js");

const U = "https://swapi.info/api/";
const index = buildIndex({
  films: [
    { title: "Return of the Jedi", episode_id: 6, url: U + "films/3" },
    { title: "A New Hope", episode_id: 4, url: U + "films/1" },
  ],
  people: [
    { name: "Luke Skywalker", url: U + "people/1" },
    { name: "C-3PO", url: U + "people/2" },
  ],
  planets: [{ name: "Tatooine", url: U + "planets/1" }],
  species: [], starships: [], vehicles: [],
});

// A storage object like localStorage, kept in a Map.
function fakeStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => { data.set(k, String(v)); },
    data,
  };
}

// ---- pure rules

test("R18: a favorite is keyed by its section and id", () => {
  assert.equal(favoriteKey("people", "1"), "people/1");
});

test("R18: toggling adds an entry at the end, or removes it, never twice", () => {
  assert.deepEqual(toggleFavorite([], "people/1"), ["people/1"]);
  assert.deepEqual(toggleFavorite(["films/1"], "people/1"), ["films/1", "people/1"]);
  assert.deepEqual(toggleFavorite(["films/1", "people/1"], "people/1"), ["films/1"]);
  const list = ["films/1"];
  toggleFavorite(list, "people/1");
  assert.deepEqual(list, ["films/1"], "the list passed in is not changed");
});

test("R18: stored favorites are read back, and anything broken is dropped", () => {
  assert.deepEqual(parseFavorites('["people/1","films/3"]'), ["people/1", "films/3"]);
  assert.deepEqual(parseFavorites(null), []);
  assert.deepEqual(parseFavorites(""), []);
  assert.deepEqual(parseFavorites("not json"), []);
  assert.deepEqual(parseFavorites('{"people/1":true}'), []);
  assert.deepEqual(parseFavorites('["people/1", 7, "jedi/1", "people", "people/1", "planets/x"]'), ["people/1"]);
});

test("R18: the favorites are grouped by section in menu order, each in list order", () => {
  const groups = favoriteGroups(index, ["planets/1", "people/2", "films/3", "people/1", "films/1"]);
  assert.deepEqual(groups.map((g) => g.label), ["Films", "Characters", "Planets"]);
  assert.deepEqual(groups[0].entries.map((e) => e.name), ["A New Hope", "Return of the Jedi"]);
  assert.deepEqual(groups[1].entries.map((e) => e.name), ["Luke Skywalker", "C-3PO"]);
  assert.equal(groups[0].section, "films");
});

test("R18: favorites whose entry is not in the data are skipped, and none gives no groups", () => {
  assert.deepEqual(favoriteGroups(index, ["people/999"]), []);
  assert.deepEqual(favoriteGroups(index, []), []);
});

test("R18: the button says whether the entry is a favorite", () => {
  assert.equal(favoriteButtonText(false), "☆ Add to favorites");
  assert.equal(favoriteButtonText(true), "★ In favorites");
});

test("R18: #/favorites opens the favorites view with its own tab title", () => {
  const route = parseRoute("#/favorites", index);
  assert.deepEqual(route, { view: "favorites" });
  assert.equal(titleFor(route), "Favorites · Star Wars Databank");
});

// ---- storage

test("R18: favorites are kept in storage and are still there after a reload", () => {
  const storage = fakeStorage();
  const store = createFavoriteStore(storage);
  assert.equal(store.persistent, true);
  assert.equal(store.has("people/1"), false);
  assert.equal(store.toggle("people/1"), true, "toggle says the entry is now a favorite");
  store.toggle("films/1");
  assert.equal(storage.data.get(FAVORITES_KEY), '["people/1","films/1"]');

  const reloaded = createFavoriteStore(storage);
  assert.deepEqual(reloaded.list(), ["people/1", "films/1"]);
  assert.equal(reloaded.toggle("people/1"), false, "toggle says the entry is no longer a favorite");
  assert.deepEqual(createFavoriteStore(storage).list(), ["films/1"]);
});

test("R18: the favorites are stored under one key as a JSON list", () => {
  assert.equal(FAVORITES_KEY, "swdatabank.favorites");
  const store = createFavoriteStore(fakeStorage({ [FAVORITES_KEY]: "broken" }));
  assert.deepEqual(store.list(), []);
});

test("R18: when storage cannot be used, favorites still work until the page closes", () => {
  const throwing = { getItem() { throw new Error("denied"); }, setItem() { throw new Error("denied"); } };
  const store = createFavoriteStore(throwing);
  assert.equal(store.persistent, false);
  store.toggle("people/1");
  assert.equal(store.has("people/1"), true);
  assert.equal(createFavoriteStore(undefined).persistent, false);
});

test("R18: storage that can be read but not written is reported as not saving", () => {
  const readOnly = { getItem: () => null, setItem() { throw new Error("quota"); } };
  const store = createFavoriteStore(readOnly);
  store.toggle("people/1");
  assert.equal(store.has("people/1"), true);
  assert.equal(store.persistent, false);
});

// ---- wiring

test("R18: the Favorites menu item has its own icon drawn for this project", () => {
  const svg = ICONS.favorites;
  assert.ok(typeof svg === "string" && svg.startsWith("<svg"));
  assert.match(svg, /aria-hidden="true"/);
  for (const [id, other] of Object.entries(ICONS)) if (id !== "favorites") assert.notEqual(svg, other);
});

test("R18: the app shows the favorites button, the menu item and the view, using localStorage", () => {
  assert.match(app, /createFavoriteStore\(/);
  assert.match(app, /localStorage/);
  assert.match(app, /favoriteButtonText\(/);
  assert.match(app, /class: "fav"/);
  assert.match(app, /href: "#\/favorites"/);
  assert.match(app, /function renderFavorites\(/);
  assert.match(app, /No favorites yet\./);
});
