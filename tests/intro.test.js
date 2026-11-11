// Round 3: the opening intro (R15). The rules are pure functions; the look and
// motion are checked by hand, so these tests check the wiring in the shipped files.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { starField, introStartState, nextIntroState, introKeyEnds } from "../js/logic.js";
import { INTRO } from "../js/intro.js";

const root = new URL("../", import.meta.url);
const read = (name) => readFile(new URL(name, root), "utf8");
const html = await read("index.html");
const css = await read("styles.css");
const app = await read("js/app.js");

// ---- R15.1: stars drawn for the project

test("R15: starField gives the asked number of stars inside a 1000 x 1000 box", () => {
  const stars = starField(260, 7);
  assert.equal(stars.length, 260);
  for (const s of stars) {
    assert.ok(s.x >= 0 && s.x <= 1000 && s.y >= 0 && s.y <= 1000, "position inside the box");
    assert.ok(s.r >= 0.4 && s.r <= 1.8, `radius ${s.r}`);
    assert.ok(s.o >= 0.3 && s.o <= 1, `opacity ${s.o}`);
  }
});

test("R15: the same seed always draws the same sky, another seed a different one", () => {
  assert.deepEqual(starField(50, 7), starField(50, 7));
  assert.notDeepEqual(starField(50, 7), starField(50, 8));
});

test("R15: the stars are spread over the whole sky, not bunched in one corner", () => {
  const stars = starField(260, 7);
  for (const [xMin, yMin] of [[0, 0], [500, 0], [0, 500], [500, 500]]) {
    const n = stars.filter((s) => s.x >= xMin && s.x < xMin + 500 && s.y >= yMin && s.y < yMin + 500).length;
    assert.ok(n > 30, `quarter at ${xMin},${yMin} has ${n} stars`);
  }
});

test("R15: the intro draws its stars as SVG and uses no image file", () => {
  assert.match(html, /<svg[^>]*id="intro-stars"/);
  assert.match(app, /starField\(/);
  assert.doesNotMatch(html.match(/<div id="intro"[\s\S]*?<\/div>\n {2}<!-- end intro -->/)?.[0] ?? "", /<img/);
});

// ---- R15.2, R15.3: title and opening text

test("R15: the intro title is exactly 'Welcome to the Wiki of Star Wars'", () => {
  assert.equal(INTRO.title, "Welcome to the Wiki of Star Wars");
});

test("R15: the opening text has a heading and paragraphs that introduce the wiki", () => {
  assert.ok(INTRO.heading.trim().length > 0);
  assert.ok(INTRO.paragraphs.length >= 2);
  for (const p of INTRO.paragraphs) assert.ok(p.trim().length > 20, "each paragraph says something");
  assert.match(INTRO.paragraphs.join(" "), /\bwiki\b/i);
});

test("R15: the opening text does not reuse the films' famous opening lines", () => {
  const all = [INTRO.heading, ...INTRO.paragraphs].join(" ").toLowerCase();
  for (const phrase of ["a long time ago", "far, far away", "it is a period of civil war", "episode iv"]) {
    assert.ok(!all.includes(phrase), `uses "${phrase}"`);
  }
});

test("R15: the title shrinks into the stars and the text scrolls away in perspective, in yellow", () => {
  assert.match(css, /\.intro-title \{[^}]*animation: intro-title /);
  assert.match(css, /@keyframes intro-title \{/);
  assert.match(css, /\.crawl-view \{[^}]*perspective: /);
  assert.match(css, /\.crawl \{[^}]*color: var\(--accent\)/);
  assert.match(css, /\.crawl \{[^}]*animation: intro-crawl /);
  assert.match(css, /@keyframes intro-crawl \{[\s\S]*?rotateX\(/);
});

// ---- R15.4: skipping and ending

test("R15: the intro is a full-screen dialog in the page, with a Skip button", () => {
  const intro = html.match(/<div id="intro"[^>]*>/);
  assert.ok(intro, "index.html has #intro");
  assert.match(intro[0], /role="dialog"/);
  assert.match(intro[0], /aria-modal="true"/);
  assert.match(html, /<button id="intro-skip" type="button">Skip<\/button>/);
  assert.match(css, /\.intro \{[^}]*position: fixed;[^}]*inset: 0/);
  assert.ok(html.indexOf('id="intro"') < html.indexOf('class="page"'), "the intro comes before the page");
});

test("R15: the intro starts moving, or still when reduced motion is asked for", () => {
  assert.equal(introStartState(false), "playing");
  assert.equal(introStartState(true), "still");
});

test("R15: Skip ends the intro at any time", () => {
  assert.equal(nextIntroState("playing", "skip"), "done");
  assert.equal(nextIntroState("still", "skip"), "done");
});

test("R15: the intro ends by itself after the text, but only when it moves", () => {
  assert.equal(nextIntroState("playing", "end"), "done");
  assert.equal(nextIntroState("still", "end"), "still");
});

test("R15: an ended intro stays ended, and unknown events change nothing", () => {
  assert.equal(nextIntroState("done", "skip"), "done");
  assert.equal(nextIntroState("done", "end"), "done");
  assert.equal(nextIntroState("playing", "click"), "playing");
});

test("R15: Enter and Escape end the intro; other keys do not", () => {
  assert.ok(introKeyEnds("Enter"));
  assert.ok(introKeyEnds("Escape"));
  for (const key of [" ", "Tab", "a", "ArrowDown", undefined]) assert.ok(!introKeyEnds(key), String(key));
});

test("R15: the page listens for the end of the text's animation and hides the silhouettes meanwhile", () => {
  assert.match(app, /animationend/);
  assert.match(css, /body\.intro-active \.sky \{[^}]*display: none/);
});

// ---- R15.5: reduced motion

test("R15: with reduced motion the title and text stand still", () => {
  const block = css.match(/@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?)\n\}/);
  assert.ok(block, "styles.css has a reduced-motion block");
  assert.match(block[1], /\.intro-title \{[^}]*animation: none/);
  assert.match(block[1], /\.crawl \{[^}]*transform: none;[^}]*animation: none/);
  assert.match(block[1], /\.stars \.twinkle \{[^}]*animation: none/);
});
