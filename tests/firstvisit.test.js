// Round 5: R15 (changed). The intro plays only on a visitor's first visit; a
// "Play intro" button plays it again.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { introShouldPlay } from "../js/logic.js";
import { createIntroMemory, INTRO_SEEN_KEY } from "../js/store.js";

const root = new URL("../", import.meta.url);
const read = (name) => readFile(new URL(name, root), "utf8");
const app = await read("js/app.js");
const css = await read("styles.css");
const { ICONS } = await import("../js/icons.js");

// A fake localStorage, as in favorites.test.js.
function fakeStorage(initial = {}) {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v); },
  };
}
const throwing = {
  getItem() { throw new Error("SecurityError"); },
  setItem() { throw new Error("SecurityError"); },
};

test("R15: the intro still has to play when nothing is stored, and not once it was seen", () => {
  assert.equal(introShouldPlay(null), true);
  assert.equal(introShouldPlay(undefined), true);
  assert.equal(introShouldPlay("1"), false);
});

test("R15: a stored value that is not the 'seen' mark plays the intro", () => {
  for (const v of ["", "0", "true", "yes", "{}"]) assert.equal(introShouldPlay(v), true, JSON.stringify(v));
});

test("R15: the intro memory key is a swdatabank. localStorage key", () => {
  assert.match(INTRO_SEEN_KEY, /^swdatabank\./);
});

test("R15: a first visit plays the intro", () => {
  assert.equal(createIntroMemory(fakeStorage()).shouldPlay(), true);
});

test("R15: after the intro is seen, a later visit (a new memory on the same storage) does not play it", () => {
  const storage = fakeStorage();
  createIntroMemory(storage).markSeen();
  assert.equal(storage.data[INTRO_SEEN_KEY], "1");
  assert.equal(createIntroMemory(storage).shouldPlay(), false);
});

test("R15: when storage throws, the intro plays and nothing throws", () => {
  const memory = createIntroMemory(throwing);
  assert.equal(memory.shouldPlay(), true);
  assert.doesNotThrow(() => memory.markSeen());
});

test("R15: with no storage at all, the intro plays", () => {
  const memory = createIntroMemory(undefined);
  assert.equal(memory.shouldPlay(), true);
  assert.doesNotThrow(() => memory.markSeen());
});

test("R15: the page plays the intro only when the memory says so, and remembers it when it ends", () => {
  assert.match(app, /createIntroMemory\(/);
  assert.match(app, /\.shouldPlay\(\)/);
  assert.match(app, /\.markSeen\(\)/);
});

test("R15: the menu has a 'Play intro' button with its own icon", () => {
  assert.match(app, /Play intro/);
  assert.match(app, /el\("button", \{[^}]*class: "play-intro"/);
  assert.ok(ICONS.intro && ICONS.intro.includes("<svg"), "an icon for Play intro");
  assert.notEqual(ICONS.intro, ICONS.favorites);
  assert.match(css, /\n\.play-intro \{/);
});
