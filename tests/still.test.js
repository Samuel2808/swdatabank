// Round 6: R13 (changed). When the visitor's system asks for reduced motion,
// the silhouettes (the X-wing and R2-D2 and C-3PO) stand still instead of
// being hidden. Checked by reading styles.css, like the R8 and R21 tests.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const css = await readFile(new URL("styles.css", root), "utf8");
const m = css.match(/@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?)\n\}/);
const reduced = m ? m[1] : "";
const inReduced = (selector) => {
  const r = reduced.match(new RegExp(`\\n  ${selector} \\{([^}]*)\\}`));
  return r ? r[1] : "";
};

test("R13: styles.css has a reduced-motion block", () => {
  assert.ok(m, "@media (prefers-reduced-motion: reduce) is there");
});

test("R13: with reduced motion the X-wing's strip and the droids' strip are shown", () => {
  assert.doesNotMatch(reduced, /\.sky \{[^}]*display: none/);
  assert.doesNotMatch(reduced, /\.ground \{[^}]*display: none/);
  assert.doesNotMatch(reduced, /--sky: 0/);
  assert.doesNotMatch(reduced, /--ground: 0/);
});

test("R13: with reduced motion the page still leaves room for both strips", () => {
  assert.doesNotMatch(reduced, /\.page \{[^}]*padding-bottom: 0/);
  assert.doesNotMatch(reduced, /\.page \{[^}]*margin-top: 0/);
});

test("R13: with reduced motion the X-wing stands still in the middle of its strip, without laser bolts", () => {
  const xwing = inReduced("#xwing");
  assert.match(xwing, /animation: none/);
  assert.match(xwing, /left: 50%/);
  assert.match(xwing, /transform: translateX\(-50%\)/);
  assert.match(inReduced("\\.laser"), /display: none/);
});

test("R13: with reduced motion R2-D2 and C-3PO stand still near the right end of the ground strip", () => {
  const droids = inReduced("\\.droids");
  assert.match(droids, /animation: none/);
  assert.match(droids, /transform: none/);
  assert.match(droids, /left: auto/);
  assert.match(droids, /right: 16px/);
  assert.match(inReduced("#r2d2"), /animation: none/);
  assert.match(inReduced("\\.leg"), /animation: none/);
});

test("R13: the silhouettes and their strips are still hidden during the intro", () => {
  assert.match(css, /\nbody\.intro-active \.sky \{[^}]*display: none/);
  assert.match(css, /\nbody\.intro-active \.ground \{[^}]*display: none/);
});
