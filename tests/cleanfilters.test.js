// Round 6: R23. Filter options are clean: spelling variants in the data are one
// option, and characters with no species are "Unknown species", with a note.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildIndex, filterValues, filterOptions, applyFilters, parseListState, canonicalValue, filterNotes, factsOf } from "../js/logic.js";
import { FILTERS, SECTION_IDS } from "../js/sections.js";

const root = new URL("../", import.meta.url);
const read = (name) => readFile(new URL(name, root), "utf8");
const app = await read("js/app.js");
const raw = {};
for (const s of SECTION_IDS) raw[s] = JSON.parse(await read(`data/${s}.json`));
const real = buildIndex(raw);
const filterFor = (section, field) => FILTERS[section].find((f) => f.field === field);
const lower = (v) => v.toLowerCase();

// Every filter that has a table of spellings, as [section, filter].
const withSame = SECTION_IDS.flatMap((s) => FILTERS[s].filter((f) => f.same?.length).map((f) => [s, f]));
// The options as they would be without the table: one per spelling.
const unmerged = (section, filter) => filterOptions(real.sections[section], { ...filter, same: undefined }, real);

// ---- the table of spellings

test("R23: the spelling variants agreed with the owner are in the table", () => {
  const groups = (s, field) => (filterFor(s, field).same || []).map((g) => g.join(" | "));
  assert.ok(groups("species", "language").includes("Galactic Basic | Galatic Basic"));
  assert.ok(groups("starships", "manufacturer").includes("Hoersch-Kessel Drive, Inc. | Hoersch-Kessel Drive, Inc"));
  assert.ok(groups("starships", "manufacturer").includes("Nubia Star Drives | Nubia Star Drives, Incorporated"));
  assert.ok(groups("vehicles", "vehicle_class").includes("airspeeder | air speeder"));
  assert.ok(groups("species", "classification").includes("mammal | mammals"));
  for (const g of ["deserts | desert", "jungles | jungle", "mountains | mountain", "oceans | ocean", "swamps | swamp", "savannas | savanna | savannahs"]) {
    assert.ok(groups("planets", "terrain").includes(g), g);
  }
});

test("R23: different words are not merged", () => {
  const all = withSame.flatMap(([, f]) => f.same.flat().map(lower));
  for (const word of ["reptilian", "grasslands", "space cruiser", "star cruiser", "ubrikkian industries custom vehicle division", "artic"]) {
    assert.ok(!all.includes(word), `${word} is not in any group`);
  }
});

test("R23: every spelling in the table is really in the data", () => {
  for (const [s, f] of withSame) {
    const found = unmerged(s, f).map((o) => o.value);
    for (const spelling of f.same.flat()) assert.ok(found.includes(lower(spelling)), `${s}.${f.field}: ${spelling}`);
  }
});

// ---- merged options

test("R23: each group of spellings is one option, and the other spellings are gone", () => {
  for (const [s, f] of withSame) {
    const values = filterOptions(real.sections[s], f, real).map((o) => o.value);
    for (const [first, ...others] of f.same) {
      assert.equal(values.filter((v) => v === lower(first)).length, 1, `${s}.${f.field}: ${first}`);
      for (const o of others) assert.ok(!values.includes(lower(o)), `${s}.${f.field}: ${o} is merged`);
    }
  }
});

test("R23: 'Galatic Basic' is listed as 'Galactic Basic', counted with it", () => {
  const language = filterOptions(real.sections.species, filterFor("species", "language"), real);
  assert.deepEqual(language.find((o) => o.value === "galactic basic"), { value: "galactic basic", label: "Galactic Basic", count: 3 });
  assert.ok(!language.some((o) => /galatic/i.test(o.label)));
});

test("R23: a merged option's count is the entries with any of its spellings", () => {
  for (const [s, f] of withSame) {
    const options = filterOptions(real.sections[s], f, real);
    for (const [first] of f.same) {
      const expected = real.sections[s].filter((e) => filterValues(e, f, real).includes(lower(first))).length;
      assert.equal(options.find((o) => o.value === lower(first)).count, expected, `${s}.${f.field}: ${first}`);
    }
  }
});

test("R23: an entry with two spellings of one value counts once", () => {
  const U = "https://swapi.info/api/";
  const fixture = buildIndex({
    films: [], people: [], species: [], starships: [], vehicles: [],
    planets: [{ name: "Dune", climate: "arid", terrain: "desert, deserts, dunes", url: U + "planets/1" }],
  });
  const terrain = filterFor("planets", "terrain");
  assert.deepEqual(filterValues(fixture.sections.planets[0], terrain, fixture), ["deserts", "dunes"]);
  assert.deepEqual(filterOptions(fixture.sections.planets, terrain, fixture).find((o) => o.value === "deserts").count, 1);
});

test("R23: the label is the spelling most entries use", () => {
  for (const [s, f] of withSame) {
    const counts = Object.fromEntries(unmerged(s, f).map((o) => [o.value, o.count]));
    for (const [first, ...others] of f.same) {
      for (const o of others) assert.ok(counts[lower(first)] >= counts[lower(o)], `${s}.${f.field}: ${first} vs ${o}`);
    }
  }
});

test("R23: choosing a merged option keeps the entries with any of its spellings", () => {
  const found = applyFilters(real.sections.species, { language: "galactic basic" }, "species", real);
  // The data also writes "Galactic basic", which R19 already merged by case.
  assert.deepEqual(found.map((e) => lower(e.record.language)).sort(), ["galactic basic", "galactic basic", "galatic basic"]);
});

// ---- unknown species

test("R23: characters with no species are listed as 'Unknown species', last", () => {
  const species = filterOptions(real.sections.people, filterFor("people", "species"), real);
  assert.deepEqual(species.at(-1), { value: "unknown species", label: "Unknown species", count: 32 });
  assert.ok(!species.some((o) => o.value === "not listed"));
  const luke = real.get("people", "1");
  assert.deepEqual(filterValues(luke, filterFor("people", "species"), real), ["unknown species"]);
});

test("R23: a note under the Characters filters says how many have no species, and why", () => {
  assert.deepEqual(filterNotes(real.sections.people, "people", real), [
    "Unknown species: the source data gives no species for 32 characters, many of them human, such as Luke Skywalker.",
  ]);
});

test("R23: no note when no entry is missing, or in a section without one", () => {
  const yoda = real.sections.people.filter((e) => e.name === "Yoda");
  assert.deepEqual(filterNotes(yoda, "people", real), []);
  assert.deepEqual(filterNotes(real.sections.planets, "planets", real), []);
});

test("R23: the Characters list shows the notes under its filters", () => {
  assert.match(app, /filterNotes\(all, section, index\)/);
  assert.match(app, /class: "hint filter-note"/);
});

// ---- what does not change

test("R23: a detail page still shows the data's own spelling", () => {
  const rodian = real.sections.species.find((e) => e.name === "Rodian");
  assert.ok(factsOf(rodian).some((f) => f.value === "Galatic Basic"));
});

// ---- links shared before this round (R20)

test("R23: any spelling, or an old value, turns into the option's value", () => {
  const language = filterFor("species", "language");
  assert.equal(canonicalValue(language, "Galatic Basic"), "galactic basic");
  assert.equal(canonicalValue(language, "galactic basic"), "galactic basic");
  assert.equal(canonicalValue(language, "Huttese"), "huttese");
  assert.equal(canonicalValue(filterFor("people", "species"), "not listed"), "unknown species");
  assert.equal(canonicalValue(filterFor("people", "homeworld"), "not listed"), "not listed");
});

test("R23: links shared before this round still select the merged option", () => {
  assert.deepEqual(parseListState("#/species?language=galatic+basic", "species", real).filters, { language: "galactic basic" });
  assert.deepEqual(parseListState("#/people?species=not+listed", "people", real).filters, { species: "unknown species" });
  assert.deepEqual(parseListState("#/starships?manufacturer=nubia+star+drives%2C+incorporated", "starships", real).filters,
    { manufacturer: "nubia star drives" });
  assert.deepEqual(parseListState("#/planets?terrain=desert", "planets", real).filters, { terrain: "deserts" });
});
