// Loads the bundled JSON files (R2) and reports failures clearly (R7).
import { SECTIONS } from "./sections.js";

export class DataLoadError extends Error {
  constructor(file, reason) {
    super(`${file}: ${reason}`);
    this.name = "DataLoadError";
    this.file = file;
    this.reason = reason;
  }
}

async function loadOne(fetchFn, base, file) {
  let res;
  try {
    res = await fetchFn(base + file);
  } catch (err) {
    throw new DataLoadError(file, err.message || "network error");
  }
  if (!res.ok) throw new DataLoadError(file, `HTTP ${res.status}`);
  let data;
  try {
    data = JSON.parse(await res.text());
  } catch {
    throw new DataLoadError(file, "the file is not valid JSON");
  }
  if (!Array.isArray(data)) throw new DataLoadError(file, "expected a list of entries");
  return data;
}

// fetchFn is passed in so tests can supply a fake one.
export async function loadAll(fetchFn, base = "data/") {
  const lists = await Promise.all(SECTIONS.map((s) => loadOne(fetchFn, base, s.file)));
  return Object.fromEntries(SECTIONS.map((s, i) => [s.id, lists[i]]));
}

export function errorMessage(err) {
  if (err instanceof DataLoadError) return `Could not load the Star Wars data (${err.file}): ${err.reason}.`;
  return `Could not load the Star Wars data: ${err.message}.`;
}
