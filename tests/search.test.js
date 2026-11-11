// Round 3: the site-wide search bar (R16) and the section search that now
// shares its matching rules (R4, changed).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildIndex, normalizeText, matchesQuery, searchAll, searchEntries, parseRoute } from "../js/logic.js";

const root = new URL("../", import.meta.url);
const read = (name) => readFile(new URL(name, root), "utf8");
const FILES = ["films", "people", "planets", "species", "starships", "vehicles"];
const raw = {};
for (const f of FILES) raw[f] = JSON.parse(await read(`data/${f}.json`));
const index = buildIndex(raw);
const html = await read("index.html");
const css = await read("styles.css");

// ---- R16: matching rules (pure)

test("R16: normalizeText lowers case, removes accents and drops punctuation", () => {
  assert.equal(normalizeText("Padmé Amidala"), "padmeamidala");
  assert.equal(normalizeText("R2-D2"), "r2d2");
  assert.equal(normalizeText("  CORDÉ  "), "corde");
  assert.equal(normalizeText("Ric Olié"), "ricolie");
  assert.equal(normalizeText(""), "");
  assert.equal(normalizeText(null), "");
});

test("R16: a word matches any part of a name, ignoring case", () => {
  assert.ok(matchesQuery("Luke Skywalker", "sky"));
  assert.ok(matchesQuery("Luke Skywalker", "SKYWALKER"));
  assert.ok(!matchesQuery("Luke Skywalker", "vader"));
});

test("R16: matching ignores accents in the name and in the typed text", () => {
  assert.ok(matchesQuery("Padmé Amidala", "padme"));
  assert.ok(matchesQuery("Padme Amidala", "padmé"));
  assert.ok(matchesQuery("Dormé", "DORME"));
});

test("R16: matching ignores punctuation, so r2d2 finds R2-D2", () => {
  assert.ok(matchesQuery("R2-D2", "r2d2"));
  assert.ok(matchesQuery("R2-D2", "r2-d2"));
  assert.ok(matchesQuery("R2-D2", "R2 D2"));
  assert.ok(matchesQuery("C-3PO", "c3po"));
});

test("R16: with several words, every word must appear, in any order", () => {
  assert.ok(matchesQuery("Luke Skywalker", "skywalker luke"));
  assert.ok(!matchesQuery("Luke Skywalker", "luke vader"));
});

test("R16: blank text or text with only punctuation matches everything", () => {
  assert.ok(matchesQuery("Yoda", ""));
  assert.ok(matchesQuery("Yoda", "   "));
  assert.ok(matchesQuery("Yoda", " - "));
});

// ---- R16: searching all sections

test("R16: searchAll groups the matches by section, in menu order", () => {
  const groups = searchAll(index, "sky");
  assert.deepEqual(groups.map((g) => g.section), ["people", "vehicles"]);
  assert.equal(groups[0].label, "Characters");
  assert.deepEqual(groups[0].entries.map((e) => e.name), ["Luke Skywalker", "Anakin Skywalker", "Shmi Skywalker"]);
  assert.deepEqual(groups[1].entries.map((e) => e.name), ["T-16 skyhopper"]);

  const star = searchAll(index, "star");
  const order = ["films", "people", "planets", "species", "starships", "vehicles"];
  const seen = star.map((g) => g.section);
  assert.deepEqual(seen, order.filter((s) => seen.includes(s)), "groups follow menu order");
  assert.ok(seen.includes("starships"), "Death Star is found");
});

test("R16: searchAll looks at film titles too", () => {
  const groups = searchAll(index, "hope");
  assert.equal(groups[0].section, "films");
  assert.deepEqual(groups[0].entries.map((e) => e.name), ["A New Hope"]);
});

test("R16: searchAll finds accented names without the accent", () => {
  const people = searchAll(index, "padme").find((g) => g.section === "people");
  assert.deepEqual(people.entries.map((e) => e.name), ["Padmé Amidala"]);
});

test("R16: searchAll keeps each section's list order and leaves out empty sections", () => {
  const groups = searchAll(index, "a");
  for (const g of groups) {
    assert.ok(g.entries.length > 0, `${g.section} group is not empty`);
    const listOrder = index.sections[g.section].filter((e) => g.entries.includes(e));
    assert.deepEqual(g.entries, listOrder);
  }
});

test("R16: searchAll returns no groups for blank text or no match", () => {
  assert.deepEqual(searchAll(index, ""), []);
  assert.deepEqual(searchAll(index, "   "), []);
  assert.deepEqual(searchAll(index, "zzzzqqq"), []);
});

// ---- R16: route

test("R16: a search hash routes to the search view with the decoded text", () => {
  assert.deepEqual(parseRoute("#/search/luke", index), { view: "search", query: "luke" });
  assert.deepEqual(parseRoute("#/search/Padm%C3%A9%20A", index), { view: "search", query: "Padmé A" });
  assert.deepEqual(parseRoute("#/search/a%2Fb", index), { view: "search", query: "a/b" });
  assert.deepEqual(parseRoute("#/search", index), { view: "search", query: "" });
  assert.deepEqual(parseRoute("#/search/", index), { view: "search", query: "" });
});

test("R16: a badly encoded search hash still routes to search", () => {
  assert.deepEqual(parseRoute("#/search/%E0%A4%A", index), { view: "search", query: "%E0%A4%A" });
});

// ---- R16: page

test("R16: the top bar holds a labelled site-wide search form", () => {
  const header = html.match(/<header class="topbar"[\s\S]*?<\/header>/);
  assert.ok(header, "index.html has a top bar");
  assert.match(header[0], /<form[^>]*role="search"/);
  const input = header[0].match(/<input[^>]*id="global-search"[^>]*>/);
  assert.ok(input, "the top bar has #global-search");
  assert.match(input[0], /type="search"/);
  assert.match(input[0], /aria-label="Search all sections"/);
});

test("R16: the top bar is shown on every screen size and stays at the top", () => {
  assert.match(css, /\n\.topbar \{[^}]*position: sticky;[^}]*top: 0/);
  assert.doesNotMatch(css, /\n\.topbar \{ display: none; \}/);
});

// ---- R4 (changed): the section search shares the R16 rules

test("R4: section search ignores accents and punctuation", () => {
  const people = index.sections.people;
  assert.deepEqual(searchEntries(people, "padme").map((e) => e.name), ["Padmé Amidala"]);
  assert.deepEqual(searchEntries(people, "r2d2").map((e) => e.name), ["R2-D2"]);
});
