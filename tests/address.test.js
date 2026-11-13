// Round 5: R20. Each section's filters (R19) and name box are kept in the page
// address, so a filtered list can be shared as a link and Back returns to the
// previous filters.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildIndex, listHash, parseListState, parseRoute, historyMode, filterOptions, applyFilters } from "../js/logic.js";
import { FILTERS, SECTION_IDS } from "../js/sections.js";

const root = new URL("../", import.meta.url);
const read = (name) => readFile(new URL(name, root), "utf8");
const app = await read("js/app.js");
const raw = {};
for (const s of SECTION_IDS) raw[s] = JSON.parse(await read(`data/${s}.json`));
const index = buildIndex(raw);

// ---- building the address

test("R20: an unfiltered list is just the section's address", () => {
  assert.equal(listHash("planets", {}, ""), "#/planets");
  assert.equal(listHash("planets", { climate: "", terrain: "" }, "  "), "#/planets");
});

test("R20: filters go after a '?' in FILTERS order, then the name box as q", () => {
  assert.equal(listHash("planets", { terrain: "desert", climate: "arid" }, "tat"), "#/planets?climate=arid&terrain=desert&q=tat");
  assert.equal(listHash("planets", { climate: "", terrain: "desert" }, ""), "#/planets?terrain=desert");
});

test("R20: fields the section does not have are left out of the address", () => {
  assert.equal(listHash("planets", { gender: "male", climate: "arid" }, ""), "#/planets?climate=arid");
});

test("R20: spaces, commas, slashes and '&' are encoded", () => {
  const hash = listHash("starships", { manufacturer: "gallofree yards, inc." }, "a&b/c");
  assert.doesNotMatch(hash.split("?")[1], /[ /,]|&b/);
});

// ---- reading it back

test("R20: a filtered address is read back as the same filters and name text", () => {
  const state = parseListState("#/planets?climate=arid&terrain=desert&q=tat", "planets", index);
  assert.deepEqual(state, { filters: { climate: "arid", terrain: "desert" }, query: "tat" });
});

test("R20: an address with no '?' has no filters and no name text", () => {
  assert.deepEqual(parseListState("#/planets", "planets", index), { filters: {}, query: "" });
});

test("R20: every option of every filter survives a trip through the address", () => {
  for (const section of SECTION_IDS) {
    for (const f of FILTERS[section]) {
      for (const o of filterOptions(index.sections[section], f, index)) {
        const hash = listHash(section, { [f.field]: o.value }, "R2-D2 & co/ 50%");
        assert.deepEqual(parseListState(hash, section, index),
          { filters: { [f.field]: o.value }, query: "R2-D2 & co/ 50%" }, `${section} ${f.field} ${o.value}`);
      }
    }
  }
});

test("R20: unknown fields and values that are not options are ignored", () => {
  const state = parseListState("#/planets?climate=lava&gender=male&terrain=desert&zzz=1", "planets", index);
  assert.deepEqual(state, { filters: { terrain: "desert" }, query: "" });
});

test("R20: a broken address does not throw", () => {
  assert.deepEqual(parseListState("#/planets?climate=%E0%A4%A&q=%", "planets", index).filters, {});
});

test("R20: a shared link shows the same list as the filters that made it", () => {
  const chosen = { gender: "male", homeworld: "tatooine" };
  const hash = listHash("people", chosen, "");
  const state = parseListState(hash, "people", index);
  const names = (c) => applyFilters(index.sections.people, c, "people", index).map((e) => e.name);
  assert.deepEqual(names(state.filters), names(chosen));
  assert.ok(names(chosen).includes("Luke Skywalker"));
});

// ---- routes

test("R20: a filtered address routes to its section's list", () => {
  assert.deepEqual(parseRoute("#/planets?climate=arid", index), { view: "list", section: "planets" });
  assert.deepEqual(parseRoute("#/films?release_date=1977", index), { view: "list", section: "films" });
  assert.equal(parseRoute("#/people/1?x=1", index).entry.name, "Luke Skywalker");
});

test("R20: the search route keeps a '?' as part of the searched text", () => {
  assert.deepEqual(parseRoute("#/search/who%3F", index), { view: "search", query: "who?" });
  assert.deepEqual(parseRoute("#/search/who?", index), { view: "search", query: "who?" });
});

// ---- history

test("R20: each dropdown change or clear adds a history entry", () => {
  assert.equal(historyMode(null, "filter"), "push");
  assert.equal(historyMode("filter", "filter"), "push");
  assert.equal(historyMode("name", "filter"), "push");
  assert.equal(historyMode("name", "clear"), "push");
});

test("R20: typing in the name box adds one entry, then replaces it", () => {
  assert.equal(historyMode(null, "name"), "push");
  assert.equal(historyMode("filter", "name"), "push");
  assert.equal(historyMode("name", "name"), "replace");
});

// ---- the page

test("R20: the section view writes its filters into the address and reads them back", () => {
  assert.match(app, /listHash\(/);
  assert.match(app, /parseListState\(/);
  assert.match(app, /historyMode\(/);
  assert.match(app, /history\.replaceState\(/);
});
