// Developer-only: refresh the bundled SWAPI snapshot in data/.
// The site itself never runs this and never contacts SWAPI (R2).
// Usage: node scripts/fetch-data.mjs
import { writeFile } from "node:fs/promises";

const BASE = "https://swapi.info/api/";
const FILES = ["films", "people", "planets", "species", "starships", "vehicles"];

for (const name of FILES) {
  const res = await fetch(BASE + name);
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
  const records = await res.json();
  if (!Array.isArray(records)) throw new Error(`${name}: expected an array`);
  await writeFile(new URL(`../data/${name}.json`, import.meta.url), JSON.stringify(records, null, 2) + "\n");
  console.log(`${name}: ${records.length} records`);
}
