// Developer-only: downloads the bundled background photos (R11, R12) from
// Wikimedia Commons into img/photos/. The site itself never runs this (R2).
// Usage: node scripts/fetch-photos.mjs
import { writeFile, mkdir } from "node:fs/promises";

const COMMONS = "https://commons.wikimedia.org";
const WIDTH = 1280;
const HEADERS = { "User-Agent": "swdatabank-course-project/1.0 (student project; static fan site)" };

// One public-domain or CC0 photo of a real filming location per section.
// Keep in step with js/photos.js and CREDITS.md.
export const SOURCES = {
  films: "Death Valley dunes (23802298723).jpg",
  people: "Matmata landscape.jpg", // only 1080 px wide, so see NARROWER below
  planets: "Feb1987. Great Skellig aka Sceilig Mhór aka Sceilg Mhíchíl 01.jpg",
  species: "Redwood National Park REDW9373.jpg",
  starships: "Tikal Temple IV & Mundo Perdido (9791210153).jpg",
  vehicles: "Hardangerjøkul2013.jpg",
};

// Files whose original is not wider than WIDTH: Commons would send the full-size
// original, so ask for a smaller thumbnail to keep each file small.
const NARROWER = { people: 900 };

const pause = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, { headers: HEADERS });
    if (res.ok) return res;
    if (attempt === 5 || (res.status !== 429 && res.status < 500)) throw new Error(`${res.status} for ${url}`);
    await pause(5000 * attempt); // Commons rate-limits bursts; back off and retry.
  }
}

// Prints author and licence for each file so js/photos.js and CREDITS.md can be checked.
async function printCredits() {
  const titles = Object.values(SOURCES).map((t) => `File:${t}`).join("|");
  const params = new URLSearchParams({ action: "query", format: "json", prop: "imageinfo", iiprop: "extmetadata", titles });
  const data = await (await get(`${COMMONS}/w/api.php?${params}`)).json();
  for (const page of Object.values(data.query.pages)) {
    const m = page.imageinfo?.[0]?.extmetadata ?? {};
    const plain = (k) => (m[k]?.value ?? "?").replace(/<[^>]+>/g, "").trim();
    console.log(`${page.title}\n  licence: ${plain("LicenseShortName")}\n  author:  ${plain("Artist")}`);
  }
}

await mkdir(new URL("../img/photos/", import.meta.url), { recursive: true });
for (const [section, title] of Object.entries(SOURCES)) {
  const url = `${COMMONS}/wiki/Special:FilePath/${encodeURIComponent(title)}?width=${NARROWER[section] ?? WIDTH}`;
  const bytes = Buffer.from(await (await get(url)).arrayBuffer());
  await writeFile(new URL(`../img/photos/${section}.jpg`, import.meta.url), bytes);
  console.log(`img/photos/${section}.jpg  ${Math.round(bytes.length / 1024)} KB  <- ${title}`);
  await pause(1500);
}
await printCredits();
