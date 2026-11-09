// Checks the real bundled snapshot and the shipped source files.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { buildIndex, relatedOf } from "../js/logic.js";

const root = new URL("../", import.meta.url);
const FILES = ["films", "people", "planets", "species", "starships", "vehicles"];
const raw = {};
for (const f of FILES) raw[f] = JSON.parse(await readFile(new URL(`data/${f}.json`, root), "utf8"));
const index = buildIndex(raw);

test("R1: the bundled data has six non-empty sections", () => {
  for (const f of FILES) assert.ok(index.sections[f].length > 0, `${f} is empty`);
});

test("R3: every bundled entry has a non-empty name", () => {
  for (const f of FILES) for (const e of index.sections[f]) assert.ok(e.name, `${f}/${e.id} has no name`);
});

test("R6: every reference in the bundled data resolves to a real entry", () => {
  for (const f of FILES) {
    for (const e of index.sections[f]) {
      for (const group of relatedOf(e, index)) {
        for (const link of group.links) assert.ok(link.href, `${f}/${e.id} ${group.label} has a broken link`);
      }
    }
  }
});

test("R2: the site's code and page contain no external URLs", async () => {
  const files = ["index.html", ...(await readdir(new URL("js/", root))).map((n) => `js/${n}`)];
  for (const name of files) {
    const text = await readFile(new URL(name, root), "utf8");
    assert.doesNotMatch(text, /https?:\/\//, `${name} mentions an external URL`);
  }
});
