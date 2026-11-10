// Round 3 UX and UI fixes (U1-U9 in spec.md). Each test is named after the
// requirement the fix improves. U1 (menu focus) is tested with R9 in logic.test.js.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildIndex, titleFor, countText, paragraphsOf } from "../js/logic.js";

const root = new URL("../", import.meta.url);
const read = (name) => readFile(new URL(name, root), "utf8");
const html = await read("index.html");
const css = await read("styles.css");
const app = await read("js/app.js");

const U = "https://swapi.info/api/";
const index = buildIndex({
  films: [], planets: [], species: [], starships: [], vehicles: [],
  people: [{ name: "Luke Skywalker", url: U + "people/1" }],
});

// ---- U2: the droids walk on their own strip and never cross text (R13)

test("R13: the droids walk on a ground strip fixed to the bottom of the screen", () => {
  const ground = html.match(/<div class="ground" aria-hidden="true">[\s\S]*?<\/svg>\s*<\/div>\s*<\/div>/);
  assert.ok(ground, "index.html has a .ground strip holding the droids");
  assert.match(ground[0], /class="droids"/);
  assert.match(ground[0], /id="r2d2"/);
  assert.match(ground[0], /id="c3po"/);
  assert.match(css, /\n\.ground \{[^}]*position: fixed;[^}]*bottom: 0;[^}]*height: var\(--ground\);[^}]*background: var\(--bg\)/);
});

test("R13: the page leaves room for the ground strip so text scrolls above it", () => {
  assert.match(css, /--ground: \d+px;/);
  assert.match(css, /\n\.page \{[^}]*padding-bottom: var\(--ground\)/);
});

test("R13: the ground strip goes away with reduced motion and during the intro", () => {
  const block = css.match(/@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?)\n\}/);
  assert.match(block[1], /\.ground \{[^}]*display: none/);
  assert.match(block[1], /\.page \{[^}]*padding-bottom: 0/);
  assert.match(css, /body\.intro-active \.ground \{[^}]*display: none/);
});

// ---- U3: skip link (R9: lets keyboard users jump past the menu)

test("R9: a 'Skip to content' control comes before the menu and shows when focused", () => {
  const skip = html.indexOf('class="skip-link"');
  assert.ok(skip > 0, "index.html has a skip link");
  assert.ok(skip < html.indexOf('id="sidebar"'), "it comes before the sidebar");
  assert.match(html, /<button class="skip-link" type="button">Skip to content<\/button>/);
  assert.match(css, /\.skip-link:focus \{/);
});

// ---- U4: focus follows navigation (R6)

test("R6: after following a link, focus moves to the new view's heading", () => {
  assert.match(app, /function focusHeading\(/);
  assert.match(app, /function render\(\) \{[\s\S]*?focusHeading\(\)/);
});

// ---- U5: every view sets the browser tab title (R5)

test("R5: titleFor names the view in the browser tab, including not found and search", () => {
  assert.equal(titleFor({ view: "list", section: "people" }), "Characters · Star Wars Databank");
  assert.equal(titleFor({ view: "detail", section: "people", entry: index.get("people", "1") }), "Luke Skywalker · Star Wars Databank");
  assert.equal(titleFor({ view: "notfound", section: "people" }), "Not found · Star Wars Databank");
  assert.equal(titleFor({ view: "search", query: "x" }), "Search · Star Wars Databank");
});

// ---- U6, U7: clearer section filter (R4)

test("R4: the count says what is shown, out of how many, and names the section", () => {
  assert.equal(countText(82, 82, "Characters", ""), "Showing all 82 characters");
  assert.equal(countText(3, 82, "Characters", "sky"), "Showing 3 of 82 characters");
  assert.equal(countText(1, 6, "Films", "hope"), "Showing 1 of 6 films");
});

test("R4: when nothing matches, the message names the section and the text", () => {
  assert.equal(countText(0, 82, "Characters", " vader2 "), "No characters match “vader2”.");
});

test("R4: the section box is worded as a filter, not as the site-wide search", () => {
  assert.match(app, /placeholder: `Filter \$\{/);
  assert.match(app, /"aria-label": `Filter \$\{/);
});

// ---- U8: credits link (R11)

test("R11: the footer links to the photo credits", () => {
  assert.match(html, /<footer>[\s\S]*<a href="CREDITS\.md">CREDITS\.md<\/a>[\s\S]*<\/footer>/);
});

// ---- U10: long text facts read as full-width paragraphs (R5)

test("R5: paragraphsOf joins hard-wrapped lines and keeps blank-line paragraphs", () => {
  const crawl = "Turmoil has engulfed the\r\nGalactic Republic.\r\n\r\nHoping to resolve\r\nthe matter.";
  assert.deepEqual(paragraphsOf(crawl), ["Turmoil has engulfed the Galactic Republic.", "Hoping to resolve the matter."]);
});

test("R5: paragraphsOf leaves short values as one paragraph and drops empty ones", () => {
  assert.deepEqual(paragraphsOf("172"), ["172"]);
  assert.deepEqual(paragraphsOf("a\n\n\n\nb\n"), ["a", "b"]);
  assert.deepEqual(paragraphsOf("  spaced   out \n line "), ["spaced out line"]);
});

test("R5: a long text fact spans the whole width of the facts list", () => {
  assert.match(app, /paragraphsOf\(/);
  assert.match(css, /\.facts \.long \{[^}]*grid-column: 1 \/ -1/);
  assert.doesNotMatch(css, /\.facts dd \{[^}]*white-space: pre-line/, "line breaks from the data are no longer kept");
});
