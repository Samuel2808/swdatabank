// Round 2 (R9-R14): the fan-page look. These check the shipped files; how the
// page actually looks (blur, motion, 375 px layout) is checked by hand.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { SECTION_IDS } from "../js/sections.js";
import { ICONS } from "../js/icons.js";
import { PHOTOS } from "../js/photos.js";

const root = new URL("../", import.meta.url);
const read = (name) => readFile(new URL(name, root), "utf8");
const html = await read("index.html");
const css = await read("styles.css");

// "--panel: rgba(0, 0, 0, 0.78);" -> "rgba(0, 0, 0, 0.78)"
function cssVar(name) {
  const m = css.match(new RegExp(`--${name}:\\s*([^;]+);`));
  assert.ok(m, `styles.css defines --${name}`);
  return m[1].trim();
}

// "#fff", "#ffe81f", "rgb(1, 2, 3)", "rgba(1, 2, 3, 0.5)" -> { r, g, b, a }
function parseColor(text) {
  let m = text.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (m) {
    const h = m[1].length === 3 ? [...m[1]].map((c) => c + c).join("") : m[1];
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16), a: 1 };
  }
  m = text.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/);
  if (m) return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] };
  throw new Error(`cannot read colour ${text}`);
}

function luminance({ r, g, b }) {
  const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// A see-through colour laid over a solid one.
function over(top, under) {
  const mix = (k) => Math.round(top[k] * top.a + under[k] * (1 - top.a));
  return { r: mix("r"), g: mix("g"), b: mix("b"), a: 1 };
}

// ---- R9: sidebar menu

test("R9: the page has a sidebar menu and no row of tabs at the top", () => {
  assert.match(html, /<nav[^>]*id="sidebar"/);
  assert.doesNotMatch(html, /id="tabs"/);
});

test("R9: the menu button controls the sidebar and starts closed", () => {
  const button = html.match(/<button[^>]*id="menu-button"[^>]*>/);
  assert.ok(button, "index.html has a #menu-button");
  assert.match(button[0], /aria-controls="sidebar"/);
  assert.match(button[0], /aria-expanded="false"/);
});

// R9 changed in round 3. Replaces the round 2 test "below 768 px the sidebar is
// hidden until opened": the sidebar can now be hidden at every width.

test("R9: the menu button sits in the top bar with a visible text label", () => {
  const header = html.match(/<header class="topbar"[\s\S]*?<\/header>/);
  assert.ok(header, "index.html has a top bar");
  assert.match(header[0], /id="menu-button"/);
  assert.match(header[0], /<span id="menu-label">Menu<\/span>/);
});

test("R9: at every width a closed sidebar is hidden and an open one is shown", () => {
  assert.match(css, /\n#sidebar \{[^}]*transform: translateX\(-100%\)[^}]*visibility: hidden/);
  assert.match(css, /\nbody\.menu-open #sidebar \{[^}]*transform: none;[^}]*visibility: visible/);
  assert.doesNotMatch(css, /\n {2}#sidebar \{[^}]*transform: translateX\(-100%\)/, "not only inside a media block");
});

test("R9: on wide screens the open sidebar pushes the content and a closed one gives the width back", () => {
  assert.match(css, /\n\.page \{[^}]*margin-left: 0/);
  const wide = css.match(/@media \(min-width: 768px\) \{([\s\S]*?)\n\}/);
  assert.ok(wide, "styles.css has a min-width: 768px block");
  assert.match(wide[1], /body\.menu-open \.page \{[^}]*margin-left: var\(--sidebar\)/);
  const max = css.match(/\nmain \{[^}]*max-width: (\d+)px/);
  assert.ok(max && +max[1] >= 1200, "the content panel can grow into the freed width");
});

// ---- R10: icons

test("R10: every section has its own inline SVG icon", () => {
  const seen = new Set();
  for (const id of SECTION_IDS) {
    const svg = ICONS[id];
    assert.ok(typeof svg === "string" && svg.startsWith("<svg"), `${id} has an SVG icon`);
    assert.match(svg, /viewBox="0 0 24 24"/);
    assert.match(svg, /aria-hidden="true"/);
    assert.ok(!seen.has(svg), `${id} reuses another section's icon`);
    seen.add(svg);
  }
});

// ---- R11, R12: photos

test("R11: every section has a background photo bundled as a JPEG", async () => {
  for (const id of SECTION_IDS) {
    const p = PHOTOS[id];
    assert.ok(p, `${id} has a photo`);
    assert.equal(p.file, `img/photos/${id}.jpg`);
    const bytes = await readFile(new URL(p.file, root));
    assert.deepEqual([...bytes.subarray(0, 3)], [0xff, 0xd8, 0xff], `${p.file} is a JPEG`);
    assert.ok(bytes.length < 600_000, `${p.file} is under 600 KB`);
  }
});

test("R11: every photo is a freely licensed photo of a real filming location, with credits", async () => {
  const credits = await read("CREDITS.md");
  for (const id of SECTION_IDS) {
    const p = PHOTOS[id];
    for (const field of ["place", "filmedAs", "author", "alt"]) assert.ok(p[field], `${id} photo has ${field}`);
    assert.ok(["Public domain", "CC0"].includes(p.license), `${id} photo licence is ${p.license}`);
    assert.ok(credits.includes(p.file), `CREDITS.md lists ${p.file}`);
  }
});

test("R11: white text on the page's panels stays readable over any photo", () => {
  const text = parseColor(cssVar("text"));
  const panel = parseColor(cssVar("panel"));
  // Worst case: the panel lies over a pure white part of the photo.
  const onWhite = over(panel, { r: 255, g: 255, b: 255, a: 1 });
  assert.ok(contrast(text, onWhite) >= 7, `contrast is ${contrast(text, onWhite).toFixed(2)}`);
});

test("R12: list and detail views show a banner photo with a caption", async () => {
  const app = await read("js/app.js");
  assert.match(app, /class: "banner"/);
  assert.match(app, /figcaption/);
  assert.match(css, /\.banner img \{[^}]*object-fit: cover/);
});

// ---- R13: animations

test("R13: the page has an X-wing, R2-D2 and C-3PO silhouette, hidden from screen readers", () => {
  for (const id of ["xwing", "r2d2", "c3po"]) {
    const tag = html.match(new RegExp(`<svg[^>]*id="${id}"[^>]*>`));
    assert.ok(tag, `index.html has #${id}`);
    assert.match(tag[0], /aria-hidden="true"/);
  }
  assert.match(html, /class="laser/, "the X-wing fires laser bolts");
});

test("R13: the X-wing flies and fires, and the droids walk together", () => {
  assert.match(css, /#xwing \{[^}]*animation: fly /);
  assert.match(css, /\.laser \{[^}]*animation: fire /);
  assert.match(css, /\.droids \{[^}]*animation: walk /);
  for (const name of ["fly", "fire", "walk"]) assert.match(css, new RegExp(`@keyframes ${name} \\{`));
});

// Changed in round 6: the silhouettes stand still instead of being hidden (R13, changed).
test("R13: there is no animation when the visitor asks for reduced motion", () => {
  const block = css.match(/@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?)\n\}/);
  assert.ok(block, "styles.css has a reduced-motion block");
  for (const sel of ["#xwing", "\\.droids", "#r2d2", "\\.leg"]) {
    assert.match(block[1], new RegExp(`${sel} \\{[^}]*animation: none`), sel);
  }
  assert.match(block[1], /\.laser \{[^}]*display: none/);
});

// ---- R14: colours

test("R14: every colour in the styles is black, white, grey or a Star Wars accent", () => {
  const accents = ["#ffe81f", "#4dc3ff", "#ff3b30"];
  const colours = css.match(/#[0-9a-f]{3,6}\b|rgba?\([^)]*\)/gi) || [];
  assert.ok(colours.length > 0);
  for (const c of colours) {
    if (accents.includes(c.toLowerCase())) continue;
    const { r, g, b } = parseColor(c);
    assert.ok(r === g && g === b, `${c} is not black, white, grey or an accent`);
  }
});

test("R14: the page background is black and the text is white", () => {
  assert.deepEqual(parseColor(cssVar("bg")), { r: 0, g: 0, b: 0, a: 1 });
  assert.deepEqual(parseColor(cssVar("text")), { r: 255, g: 255, b: 255, a: 1 });
});
