// Round 4: R19. Each section can be filtered by its own fields, combined with
// each other and with the name search (R4), and cleared with one button.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildIndex, filterValues, filterOptions, applyFilters, searchEntries, countText } from "../js/logic.js";
import { FILTERS, SECTION_IDS } from "../js/sections.js";

const root = new URL("../", import.meta.url);
const read = (name) => readFile(new URL(name, root), "utf8");
const app = await read("js/app.js");
const css = await read("styles.css");
const raw = {};
for (const s of SECTION_IDS) raw[s] = JSON.parse(await read(`data/${s}.json`));
const real = buildIndex(raw);

const filterFor = (section, field) => FILTERS[section].find((f) => f.field === field);

// A small fixture shaped like SWAPI records.
const U = "https://swapi.info/api/";
const fixture = buildIndex({
  films: [], starships: [], vehicles: [],
  people: [
    { name: "Luke Skywalker", gender: "male", species: [], homeworld: U + "planets/1", url: U + "people/1" },
    { name: "Leia Organa", gender: "female", species: [], homeworld: U + "planets/2", url: U + "people/5" },
    { name: "Yoda", gender: "Male", species: [U + "species/6"], homeworld: U + "planets/3", url: U + "people/20" },
  ],
  planets: [
    { name: "Tatooine", climate: "arid", terrain: "desert", url: U + "planets/1" },
    { name: "Alderaan", climate: "temperate", terrain: "grasslands, mountains", url: U + "planets/2" },
    { name: "Dagobah", climate: "murky", terrain: "swamp, jungles", url: U + "planets/3" },
    { name: "Naboo", climate: "temperate ", terrain: "grassy hills, swamps, forests, mountains", url: U + "planets/8" },
  ],
  species: [{ name: "Yoda's species", url: U + "species/6" }],
});
const people = fixture.sections.people;
const planets = fixture.sections.planets;

// ---- the fields

test("R19: every section has filters, each on a field the data really has", () => {
  for (const s of SECTION_IDS) {
    assert.ok(FILTERS[s]?.length >= 2, `${s} has at least two filters`);
    for (const f of FILTERS[s]) {
      assert.ok(f.label, `${s}.${f.field} has a label`);
      assert.ok(raw[s].every((r) => f.field in r), `every ${s} record has ${f.field}`);
    }
  }
});

test("R19: the filters asked for are there", () => {
  assert.ok(filterFor("people", "gender"));
  assert.ok(filterFor("people", "species"));
  assert.ok(filterFor("planets", "climate"));
  assert.ok(filterFor("planets", "terrain"));
  assert.ok(filterFor("starships", "starship_class"));
  assert.ok(filterFor("vehicles", "vehicle_class"));
  assert.equal(filterFor("films", "release_date").label, "Release year");
});

// ---- values of one entry

test("R19: a field with several values counts as each of them", () => {
  const alderaan = planets[1];
  assert.deepEqual(filterValues(alderaan, filterFor("planets", "terrain"), fixture), ["grasslands", "mountains"]);
});

test("R19: values are trimmed and compared ignoring upper/lower case", () => {
  assert.deepEqual(filterValues(planets[3], filterFor("planets", "climate"), fixture), ["temperate"]);
  assert.deepEqual(filterValues(people[2], filterFor("people", "gender"), fixture), ["male"]);
});

test("R19: a reference field gives the names it points to, or its missing option ('Unknown species' since R23)", () => {
  const species = filterFor("people", "species");
  assert.deepEqual(filterValues(people[2], species, fixture), ["yoda's species"]);
  assert.deepEqual(filterValues(people[0], species, fixture), ["unknown species"]);
  assert.deepEqual(filterValues(people[0], filterFor("people", "homeworld"), fixture), ["tatooine"]);
});

test("R19: films are filtered by the year they were released", () => {
  const hope = real.get("films", "1");
  assert.deepEqual(filterValues(hope, filterFor("films", "release_date"), real), ["1977"]);
});

test("R19: a company suffix such as 'Inc.' stays with the manufacturer's name", () => {
  const manufacturer = filterFor("starships", "manufacturer");
  const all = real.sections.starships.flatMap((e) => filterValues(e, manufacturer, real));
  assert.ok(all.includes("gallofree yards, inc."), "Gallofree Yards, Inc. is one manufacturer");
  for (const v of all) assert.doesNotMatch(v, /^(inc\.?|incorporated)$/, `'${v}' is not a manufacturer on its own`);
});

// ---- the options of a dropdown

test("R19: the options are every value found, sorted, each with its count", () => {
  const climate = filterOptions(planets, filterFor("planets", "climate"), fixture);
  assert.deepEqual(climate, [
    { value: "arid", label: "arid", count: 1 },
    { value: "murky", label: "murky", count: 1 },
    { value: "temperate", label: "temperate", count: 2 },
  ]);
});

test("R19: an option shows the spelling found first and merges other cases", () => {
  const gender = filterOptions(people, filterFor("people", "gender"), fixture);
  assert.deepEqual(gender, [
    { value: "female", label: "female", count: 1 },
    { value: "male", label: "male", count: 2 },
  ]);
});

test("R19: the missing option ('Unknown species' since R23) comes last", () => {
  const species = filterOptions(people, filterFor("people", "species"), fixture);
  assert.deepEqual(species.map((o) => o.label), ["Yoda's species", "Unknown species"]);
  assert.equal(species.at(-1).count, 2);
});

test("R19: with the real data, release years are in order and classes are merged across case", () => {
  const years = filterOptions(real.sections.films, filterFor("films", "release_date"), real).map((o) => o.label);
  assert.deepEqual(years, ["1977", "1980", "1983", "1999", "2002", "2005"]);
  const classes = filterOptions(real.sections.starships, filterFor("starships", "starship_class"), real);
  const values = classes.map((o) => o.value);
  assert.equal(values.length, new Set(values).size);
  assert.equal(values.filter((v) => v === "starfighter").length, 1);
  const species = filterOptions(real.sections.people, filterFor("people", "species"), real);
  assert.equal(species.at(-1).label, "Unknown species");
  assert.equal(species.at(-1).count, 32);
});

// ---- applying and combining

test("R19: choosing a value keeps only the entries that have it", () => {
  const found = applyFilters(planets, { climate: "temperate" }, "planets", fixture);
  assert.deepEqual(found.map((e) => e.name), ["Alderaan", "Naboo"]);
});

test("R19: filters on different fields are combined: all must hold", () => {
  const found = applyFilters(planets, { climate: "temperate", terrain: "swamps" }, "planets", fixture);
  assert.deepEqual(found.map((e) => e.name), ["Naboo"]);
  assert.deepEqual(applyFilters(planets, { climate: "arid", terrain: "swamps" }, "planets", fixture), []);
});

test("R19: 'Any' (an empty choice) or no choice keeps everything", () => {
  assert.equal(applyFilters(planets, {}, "planets", fixture).length, 4);
  assert.equal(applyFilters(planets, { climate: "", terrain: "" }, "planets", fixture).length, 4);
});

test("R19: filters combine with the name search", () => {
  const filtered = applyFilters(planets, { terrain: "mountains" }, "planets", fixture);
  assert.deepEqual(searchEntries(filtered, "naboo").map((e) => e.name), ["Naboo"]);
  assert.deepEqual(searchEntries(filtered, "tatooine"), []);
});

test("R19: with the real data, droids from Tatooine can be found", () => {
  const chosen = { species: "droid", homeworld: "tatooine" };
  const names = applyFilters(real.sections.people, chosen, "people", real).map((e) => e.name);
  assert.deepEqual(names, ["C-3PO", "R5-D4"]);
  const men = applyFilters(real.sections.people, { gender: "male", homeworld: "tatooine" }, "people", real);
  assert.ok(men.some((e) => e.name === "Luke Skywalker"));
  assert.ok(men.every((e) => e.record.gender === "male"));
});

// ---- the count line

test("R19: the count line says when the filters leave nothing", () => {
  assert.equal(countText(0, 60, "Planets", "", true), "No planets match these filters.");
  assert.equal(countText(0, 60, "Planets", "hoth", true), "No planets match “hoth” with these filters.");
  assert.equal(countText(2, 60, "Planets", "", true), "Showing 2 of 60 planets");
  assert.equal(countText(0, 60, "Planets", "hoth"), "No planets match “hoth”.", "without filters, as in round 3");
});

// ---- the page

test("R19: the section view has a dropdown per filter and one button that clears them", () => {
  assert.match(app, /FILTERS\[section\]/);
  assert.match(app, /el\("select"/);
  assert.match(app, /"Any"/);
  assert.match(app, /Clear filters/);
  assert.match(app, /applyFilters\(/);
  assert.match(css, /\n\.filters \{/);
});
