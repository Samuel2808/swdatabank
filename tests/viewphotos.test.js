// Round 7: R25. The search page and the Favorites page each have their own
// background photo and banner, following the R11 rules.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { buildIndex, parseRoute, photoFor } from "../js/logic.js";
import { SECTION_IDS } from "../js/sections.js";
import { PHOTOS } from "../js/photos.js";

const root = new URL("../", import.meta.url);
const read = (name) => readFile(new URL(name, root), "utf8");
const app = await read("js/app.js");
const credits = await read("CREDITS.md");
const fetcher = await read("scripts/fetch-photos.mjs");

const U = "https://swapi.info/api/";
const index = buildIndex({
  films: [{ title: "A New Hope", episode_id: 4, url: U + "films/1" }],
  people: [{ name: "Luke Skywalker", url: U + "people/1" }],
  planets: [], species: [], starships: [], vehicles: [],
});
const photoOf = (hash) => photoFor(parseRoute(hash, index));

// ---- which photo a view uses

test("R25: the search view uses its own photo", () => {
  assert.equal(photoOf("#/search/luke"), "search");
  assert.equal(photoOf("#/search/"), "search");
});

test("R25: the Favorites view uses its own photo", () => {
  assert.equal(photoOf("#/favorites"), "favorites");
});

test("R25: lists, detail pages and not-found pages keep their section's photo (R11)", () => {
  assert.equal(photoOf("#/people"), "people");
  assert.equal(photoOf("#/people?q=sky"), "people");
  assert.equal(photoOf("#/people/1"), "people");
  assert.equal(photoOf("#/people/999"), "people");
  assert.equal(photoOf(""), "films");
});

test("R25: every view's photo key names a bundled photo", () => {
  for (const hash of ["#/search/x", "#/favorites", ...SECTION_IDS.map((s) => `#/${s}`)]) {
    assert.ok(PHOTOS[photoOf(hash)], `${hash} has a photo`);
  }
});

// ---- the two new photos follow R11

for (const view of ["search", "favorites"]) {
  test(`R25: the ${view} photo is a bundled JPEG under 600 KB`, async () => {
    const p = PHOTOS[view];
    assert.ok(p, `PHOTOS has ${view}`);
    assert.equal(p.file, `img/photos/${view}.jpg`);
    const bytes = await readFile(new URL(p.file, root));
    assert.deepEqual([...bytes.subarray(0, 3)], [0xff, 0xd8, 0xff], `${p.file} is a JPEG`);
    assert.ok(bytes.length < 600_000, `${p.file} is under 600 KB`);
  });

  test(`R25: the ${view} photo is a freely licensed filming location, credited`, () => {
    const p = PHOTOS[view];
    for (const field of ["place", "filmedAs", "author", "alt"]) assert.ok(p[field], `${view} photo has ${field}`);
    assert.ok(["Public domain", "CC0"].includes(p.license), `${view} photo licence is ${p.license}`);
    assert.ok(credits.includes(`\`${p.file}\``), `CREDITS.md lists ${p.file}`);
    assert.ok(credits.includes(p.author), `CREDITS.md names ${p.author}`);
    assert.match(fetcher, new RegExp(`\\n  ${view}: "`), `fetch-photos.mjs can download the ${view} photo`);
  });
}

test("R25: the search and Favorites photos are new pictures, not copies of a section photo", async () => {
  const hash = async (file) => createHash("sha256").update(await readFile(new URL(file, root))).digest("hex");
  const sectionHashes = await Promise.all(SECTION_IDS.map((s) => hash(PHOTOS[s].file)));
  const search = await hash(PHOTOS.search.file);
  const favorites = await hash(PHOTOS.favorites.file);
  assert.notEqual(search, favorites);
  for (const h of [search, favorites]) assert.ok(!sectionHashes.includes(h));
  assert.ok(!SECTION_IDS.map((s) => PHOTOS[s].place).includes(PHOTOS.search.place));
  assert.ok(!SECTION_IDS.map((s) => PHOTOS[s].place).includes(PHOTOS.favorites.place));
});

// ---- the page

test("R25: the app picks the backdrop and banner with photoFor, not a fixed Films photo", () => {
  assert.match(app, /setBackdrop\(photoFor\(route\)\)/);
  assert.doesNotMatch(app, /banner\("films"\)/, "no view uses the Films banner by name");
  assert.match(app, /function renderSearch[\s\S]*?banner\("search"\)/);
  assert.match(app, /function renderFavorites[\s\S]*?banner\("favorites"\)/);
});
