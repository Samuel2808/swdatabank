// Round 5: R21. The X-wing flies only through an empty strip of the screen and
// never passes over text. The strip is checked by reading styles.css and
// index.html, like the R8 layout tests (decision 0006).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = (name) => readFile(new URL(name, root), "utf8");
const css = await read("styles.css");
const html = await read("index.html");

// The body of the top-level rule "selector { … }" (not inside @media).
function rule(selector, text = css) {
  const m = text.match(new RegExp(`\\n${selector} \\{([^}]*)\\}`));
  assert.ok(m, `styles.css has a rule for ${selector}`);
  return m[1];
}
function block(query) {
  const m = css.match(new RegExp(`@media ${query} \\{([\\s\\S]*?)\\n\\}`));
  assert.ok(m, `styles.css has @media ${query}`);
  return m[1];
}
const px = (body, prop) => {
  const m = body.match(new RegExp(`(?:^|[\\s;])${prop}: ([\\d.]+)px`));
  return m ? +m[1] : undefined;
};
const XWING_RATIO = 40 / 140; // the X-wing's viewBox is 140 x 40

test("R21: the X-wing's layer is a strip under the top bar, not the whole screen", () => {
  const sky = rule("\\.sky");
  assert.match(sky, /position: fixed/);
  assert.match(sky, /top: var\(--topbar\)/);
  assert.match(sky, /height: var\(--sky\)/);
  assert.match(sky, /left: 0/);
  assert.match(sky, /right: 0/);
  assert.doesNotMatch(sky, /inset: 0|bottom: 0/);
  assert.match(sky, /overflow: hidden/);
});

test("R21: the strip is opaque, so text scrolling up passes behind it, never under the X-wing", () => {
  assert.match(rule("\\.sky"), /background: var\(--bg\)/);
});

test("R21: the strip holds only the X-wing: no text", () => {
  const strip = html.match(/<div class="sky"[^>]*>([\s\S]*?)<\/div>/);
  assert.ok(strip, "index.html has the sky strip");
  assert.equal((strip[1].match(/<svg/g) || []).length, 1);
  assert.match(strip[1], /id="xwing"/);
  assert.doesNotMatch(strip[1].replace(/<[^>]*>/g, ""), /\S/, "no text in the strip");
  assert.doesNotMatch(strip[1], /<text/);
});

test("R21: the X-wing fits inside the strip on wide screens", () => {
  const sky = px(rule(":root"), "--sky");
  const xwing = rule("#xwing");
  const top = px(xwing, "top");
  const width = px(xwing, "width");
  assert.ok(sky > 0 && top >= 0 && width > 0, "--sky, and the X-wing's top and width, are in px");
  assert.ok(top + width * XWING_RATIO <= sky, `X-wing ${top} + ${width * XWING_RATIO} px within ${sky} px`);
});

test("R21: the X-wing fits inside the narrower strip on narrow screens", () => {
  const narrow = block("\\(max-width: 767px\\)");
  const sky = px(narrow.match(/:root \{([^}]*)\}/)?.[1] ?? "", "--sky");
  const xwing = narrow.match(/#xwing \{([^}]*)\}/)?.[1] ?? "";
  const top = px(xwing, "top") ?? px(rule("#xwing"), "top");
  const width = px(xwing, "width");
  assert.ok(sky > 0 && width > 0, "narrow screens set --sky and the X-wing's width in px");
  assert.ok(top + width * XWING_RATIO <= sky, `X-wing ${top} + ${width * XWING_RATIO} px within ${sky} px`);
});

test("R21: the page and the sidebar start below the strip", () => {
  assert.match(rule("\\.page"), /margin-top: var\(--sky\)/);
  assert.match(rule("#sidebar"), /top: calc\(var\(--topbar\) \+ var\(--sky\)\)/);
});

// Changed in round 6: R13 now shows the X-wing standing still with reduced
// motion, so the strip stays and the page still starts below it.
test("R21: with reduced motion the strip stays, and the page still starts below it", () => {
  const reduced = block("\\(prefers-reduced-motion: reduce\\)");
  assert.doesNotMatch(reduced, /\.sky \{[^}]*display: none/);
  assert.doesNotMatch(reduced, /--sky: 0/);
  assert.doesNotMatch(reduced, /\.page \{[^}]*margin-top/);
});
