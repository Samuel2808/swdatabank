// Round 4: R17. The R13 silhouettes play once, then rest about 5 minutes
// (one long CSS cycle, decision 0007).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const css = await readFile(new URL("styles.css", root), "utf8");

// "#xwing { … animation: fly 330s linear 1s infinite; }" -> { seconds: 330, infinite: true }
function animationOf(selector, name) {
  const block = css.match(new RegExp(`\\n${selector} \\{[^}]*animation: ${name} ([^;]+);`));
  assert.ok(block, `${selector} runs the ${name} animation`);
  const seconds = block[1].match(/^([\d.]+)s\b/);
  assert.ok(seconds, `${name} gives its duration in seconds first`);
  return { seconds: +seconds[1], infinite: /\binfinite\b/.test(block[1]) };
}

// The stops of "@keyframes name { … }" as [{ at: [percent…], body }].
function keyframes(name) {
  const m = css.match(new RegExp(`@keyframes ${name} \\{([\\s\\S]*?)\\n\\}`));
  assert.ok(m, `styles.css has @keyframes ${name}`);
  return [...m[1].matchAll(/([\d.%,\sfromto]+)\{([^}]*)\}/g)].map((s) => ({
    at: s[1].split(",").map((p) => p.trim()).map((p) => (p === "from" ? 0 : p === "to" ? 100 : parseFloat(p))),
    body: s[2].trim(),
  }));
}

test("R17: the X-wing, its laser bolts and the droids share one cycle of about 5.5 minutes, repeated", () => {
  const cycles = [animationOf("#xwing", "fly"), animationOf("\\.laser", "fire"), animationOf("\\.droids", "walk")];
  for (const c of cycles) {
    assert.ok(c.seconds >= 300 && c.seconds <= 360, `cycle of ${c.seconds}s is not about 5 minutes plus the play`);
    assert.ok(c.infinite, "the cycle repeats");
  }
  assert.equal(new Set(cycles.map((c) => c.seconds)).size, 1, "all three use the same cycle");
});

test("R17: the X-wing crosses once at the start of the cycle, then rests off screen", () => {
  const stops = keyframes("fly");
  const last = stops.at(-1);
  assert.ok(last.at.includes(100), "the last stop reaches 100%");
  const arrive = Math.min(...last.at);
  assert.ok(arrive > 0 && arrive <= 2, `the flight ends at ${arrive}%, within the first 2% of the cycle`);
  assert.match(last.body, /translateX\(calc\(100vw \+ \d+px\)\)/, "it rests past the right edge");
});

test("R17: the laser bolts only fire while the X-wing crosses", () => {
  const stops = keyframes("fire");
  const lit = stops.filter((s) => /opacity: 1/.test(s.body)).flatMap((s) => s.at);
  assert.ok(lit.length >= 2, "the bolts are shown at some point");
  assert.ok(Math.max(...lit) <= 2, "every shot falls within the X-wing's crossing");
  const last = stops.at(-1);
  assert.ok(last.at.includes(100) && /opacity: 0/.test(last.body), "the bolts stay hidden for the rest of the cycle");
});

test("R17: the droids walk across once at the start of the cycle, then rest off screen", () => {
  const stops = keyframes("walk");
  const last = stops.at(-1);
  assert.ok(last.at.includes(100), "the last stop reaches 100%");
  const arrive = Math.min(...last.at);
  assert.ok(arrive > 0 && arrive <= 10, `the walk ends at ${arrive}%, within the first 10% of the cycle`);
  assert.match(last.body, /translateX\(-\d+px\)/, "they rest past the left edge");
});

// Changed in round 6: with reduced motion the silhouettes no longer hide; they
// stand still (R13, changed), so the cycle does not run at all.
test("R17: the cycle starts when the intro ends, and does not run with reduced motion", () => {
  assert.match(css, /body\.intro-active \.sky \{[^}]*display: none/);
  assert.match(css, /body\.intro-active \.ground \{[^}]*display: none/);
  const reduced = css.match(/@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?)\n\}/);
  assert.match(reduced[1], /#xwing \{[^}]*animation: none/);
  assert.match(reduced[1], /\.droids \{[^}]*animation: none/);
});
