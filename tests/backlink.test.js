// Round 6: R22. Going back from a detail page to its section list (the
// "← Section" link) keeps the filters and name search the visitor had before.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildIndex, rememberList, backHref } from "../js/logic.js";
import { SECTION_IDS } from "../js/sections.js";

const root = new URL("../", import.meta.url);
const read = (name) => readFile(new URL(name, root), "utf8");
const app = await read("js/app.js");
const raw = {};
for (const s of SECTION_IDS) raw[s] = JSON.parse(await read(`data/${s}.json`));
const index = buildIndex(raw);

test("R22: with no list remembered, the back link opens the plain section", () => {
  assert.equal(backHref({}, "planets"), "#/planets");
  assert.equal(backHref(undefined, "people"), "#/people");
});

test("R22: a list's address, with its filters and name box, is remembered under its section", () => {
  const memory = rememberList({}, "#/planets?climate=arid&q=tat", index);
  assert.equal(backHref(memory, "planets"), "#/planets?climate=arid&q=tat");
});

test("R22: each section keeps its own last list", () => {
  let memory = rememberList({}, "#/planets?climate=arid", index);
  memory = rememberList(memory, "#/people?gender=female", index);
  assert.equal(backHref(memory, "planets"), "#/planets?climate=arid");
  assert.equal(backHref(memory, "people"), "#/people?gender=female");
  assert.equal(backHref(memory, "films"), "#/films");
});

test("R22: the last list shown wins, even when it has no filters", () => {
  let memory = rememberList({}, "#/planets?climate=arid", index);
  memory = rememberList(memory, "#/planets", index);
  assert.equal(backHref(memory, "planets"), "#/planets");
});

test("R22: detail, search, favorites and unknown addresses leave the memory as it is", () => {
  const memory = rememberList({}, "#/planets?climate=arid", index);
  for (const hash of ["#/planets/1", "#/people/1?climate=arid", "#/search/luke", "#/favorites", "#/nowhere"]) {
    assert.deepEqual(rememberList(memory, hash, index), memory, hash);
  }
});

test("R22: fields and values the section does not have are not remembered", () => {
  const memory = rememberList({}, "#/planets?climate=lava&gender=male&terrain=deserts&q=tat", index);
  assert.equal(backHref(memory, "planets"), "#/planets?terrain=deserts&q=tat");
});

test("R22: remembering does not change the memory passed in", () => {
  const memory = Object.freeze({});
  const next = rememberList(memory, "#/planets?climate=arid", index);
  assert.deepEqual(memory, {});
  assert.notEqual(next, memory);
});

test("R22: the detail page's back link uses the remembered list, and every list shown is remembered", () => {
  assert.match(app, /class: "back", href: backHref\(listMemory, entry\.section\)/);
  assert.match(app, /listMemory = rememberList\(listMemory, /);
});
