import { test } from "node:test";
import assert from "node:assert/strict";
import { loadAll, DataLoadError, errorMessage } from "../js/loader.js";

const FILES = ["films", "people", "planets", "species", "starships", "vehicles"];

// A fake fetch that serves the given bodies by file name; missing files get 404.
function fakeFetch(bodies) {
  const calls = [];
  const fn = async (url) => {
    calls.push(url);
    const name = url.split("/").pop().replace(".json", "");
    if (!(name in bodies)) return { ok: false, status: 404, text: async () => "" };
    return { ok: true, status: 200, text: async () => bodies[name] };
  };
  fn.calls = calls;
  return fn;
}
const allGood = Object.fromEntries(FILES.map((f) => [f, JSON.stringify([{ name: f, url: "x" }])]));

test("R2: loadAll reads all six files from the local data folder", async () => {
  const f = fakeFetch(allGood);
  const raw = await loadAll(f);
  assert.deepEqual(Object.keys(raw).sort(), FILES);
  assert.deepEqual(f.calls.sort(), FILES.map((n) => `data/${n}.json`).sort());
});

test("R7: a missing file fails with an error naming that file", async () => {
  const { planets, ...rest } = allGood;
  await assert.rejects(loadAll(fakeFetch(rest)), (err) => {
    assert.ok(err instanceof DataLoadError);
    assert.equal(err.file, "planets.json");
    assert.match(err.reason, /404/);
    return true;
  });
});

test("R7: a file that is not valid JSON fails with an error naming it", async () => {
  await assert.rejects(loadAll(fakeFetch({ ...allGood, species: "{oops" })),
    (err) => err instanceof DataLoadError && err.file === "species.json" && /JSON/i.test(err.reason));
});

test("R7: a file holding JSON that is not a list fails", async () => {
  await assert.rejects(loadAll(fakeFetch({ ...allGood, films: '{"a":1}' })),
    (err) => err instanceof DataLoadError && err.file === "films.json");
});

test("R7: a network failure is reported as a load error", async () => {
  const f = async () => { throw new TypeError("Failed to fetch"); };
  await assert.rejects(loadAll(f), (err) => err instanceof DataLoadError && /Failed to fetch/.test(err.reason));
});

test("R7: errorMessage gives a clear sentence naming the file", () => {
  const msg = errorMessage(new DataLoadError("people.json", "HTTP 404"));
  assert.equal(msg, "Could not load the Star Wars data (people.json): HTTP 404.");
});
