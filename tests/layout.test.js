// Round 4: R8 (changed) is now checked by tests. Node has no browser, so these
// read index.html and styles.css instead of measuring a rendered page (decision
// 0006). Every view is styled by the same styles.css, so they cover every view.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = (name) => readFile(new URL(name, root), "utf8");
const html = await read("index.html");
const css = await read("styles.css");

const PHONE = 375; // px
const REM = 16;    // the root font size at 375 px: clamp(16px, 0.4vw + 13px, 20px)

// styles.css without comments and without the blocks that only apply to wide
// screens (@media (min-width: …)), which a 375 px screen never uses.
function phoneCss() {
  let text = css.replace(/\/\*[\s\S]*?\*\//g, "");
  let out = "";
  let i = 0;
  while (i < text.length) {
    const at = text.indexOf("@media", i);
    if (at === -1) { out += text.slice(i); break; }
    out += text.slice(i, at);
    const open = text.indexOf("{", at);
    let depth = 1, j = open + 1;
    while (depth > 0 && j < text.length) { if (text[j] === "{") depth++; else if (text[j] === "}") depth--; j++; }
    const query = text.slice(at, open);
    if (!/min-width/.test(query)) out += text.slice(open + 1, j - 1);
    i = j;
  }
  return out;
}

// Splits "a, min(b, c), d" on top-level commas.
function args(text) {
  const parts = [];
  let depth = 0, start = 0;
  for (let k = 0; k < text.length; k++) {
    if (text[k] === "(") depth++;
    else if (text[k] === ")") depth--;
    else if (text[k] === "," && depth === 0) { parts.push(text.slice(start, k)); start = k + 1; }
  }
  parts.push(text.slice(start));
  return parts.map((p) => p.trim());
}

// The smallest width, in px, that a CSS length can force on a 375 px screen.
// 0 means fluid (it depends on % or vw, or is auto). Custom properties are looked up.
function smallestPx(value) {
  const v = value.trim();
  let m;
  if ((m = v.match(/^var\(--([\w-]+)\)$/))) {
    const def = css.match(new RegExp(`--${m[1]}:\\s*([^;]+);`));
    return def ? smallestPx(def[1]) : 0;
  }
  if ((m = v.match(/^clamp\((.*)\)$/))) return smallestPx(args(m[1])[0]);
  if ((m = v.match(/^min\((.*)\)$/))) return Math.min(...args(m[1]).map(smallestPx));
  if ((m = v.match(/^max\((.*)\)$/))) return Math.max(...args(m[1]).map(smallestPx));
  if (/%|vw|auto|fit-content|calc/.test(v)) return 0;
  if ((m = v.match(/^(-?[\d.]+)px$/))) return +m[1];
  if ((m = v.match(/^(-?[\d.]+)r?em$/))) return +m[1] * REM;
  if ((m = v.match(/^(-?[\d.]+)ch$/))) return +m[1] * 8;
  return 0;
}

test("R8: the page declares a device-width viewport", () => {
  assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1">/);
});

test("R8: the size rules of the layout can tell a fixed width from a fluid one", () => {
  assert.equal(smallestPx("200px"), 200);
  assert.equal(smallestPx("15rem"), 240);
  assert.equal(smallestPx("100%"), 0);
  assert.equal(smallestPx("calc(100% - 48px)"), 0);
  assert.equal(smallestPx("clamp(300px, 66vw, 1500px)"), 300);
  assert.equal(smallestPx("min(100%, 400px)"), 0);
  assert.equal(smallestPx("min(80vw, var(--sidebar))"), 0);
  assert.equal(smallestPx("var(--sidebar)"), 240);
  assert.ok(!/min-width: 768px/.test(phoneCss()), "wide-screen blocks are left out");
});

test("R8: no width, min-width or flex-basis forces anything wider than 375 px", () => {
  const rules = phoneCss();
  const found = [];
  for (const m of rules.matchAll(/(?:^|[;{\s])(width|min-width|flex-basis|flex):\s*([^;}]+)/g)) {
    let value = m[2].trim();
    if (m[1] === "flex") { const parts = value.split(/\s+/); if (parts.length < 3) continue; value = parts[2]; }
    const px = smallestPx(value);
    if (px > PHONE) found.push(`${m[1]}: ${value} (${px}px)`);
  }
  assert.deepEqual(found, [], "fixed widths wider than a phone");
});

test("R8: every grid column can shrink to the width of a 375 px screen", () => {
  const rules = phoneCss();
  const grids = [...rules.matchAll(/minmax\(((?:[^()]|\([^()]*\))*)\)/g)];
  assert.ok(grids.length >= 2, "the cards and facts grids use minmax()");
  for (const g of grids) {
    const min = args(g[1])[0];
    assert.ok(smallestPx(min) <= PHONE, `minmax(${g[1]}) has a column wider than a phone`);
  }
});

test("R8: long names and words wrap instead of overflowing", () => {
  assert.match(css, /\nbody \{[^}]*overflow-wrap: anywhere/);
  const nowrap = [...css.matchAll(/\n\s*([^{}\n]+)\{[^}]*white-space: nowrap/g)].map((m) => m[1].trim());
  assert.deepEqual(nowrap, [".visually-hidden"], "only visually hidden text may refuse to wrap");
});

test("R8: the animation layers clip the silhouettes that start and end off screen", () => {
  assert.match(css, /\n\.sky \{[^}]*position: fixed;[^}]*overflow: hidden/);
  assert.match(css, /\n\.ground \{[^}]*position: fixed;[^}]*overflow: hidden/);
});

test("R8: dropdowns and buttons in the filters and favorites never grow past the screen", () => {
  assert.match(css, /\n\.filters select \{[^}]*max-width: 100%/);
  assert.match(css, /\n\.filters \{[^}]*flex-wrap: wrap/);
  assert.match(css, /\n\.fav \{[^}]*max-width: 100%/);
});
