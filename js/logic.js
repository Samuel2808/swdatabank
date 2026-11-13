// Pure functions: no DOM, no network. Everything here is unit tested.
import { SECTIONS, SECTION_IDS, REF_FIELDS, HIDDEN_FIELDS, FILTERS } from "./sections.js";

// A SWAPI URL ending in "/api/planets/1" -> { section: "planets", id: "1" }; anything else -> null.
export function parseRef(value) {
  if (typeof value !== "string") return null;
  const m = value.match(/\/api\/([a-z]+)\/(\d+)\/?$/);
  if (!m || !SECTION_IDS.includes(m[1])) return null;
  return { section: m[1], id: m[2] };
}

export function hrefFor(section, id) {
  return `#/${section}/${id}`;
}

// Turns the raw SWAPI arrays into entries { section, id, name, record } (R1, R3).
export function buildIndex(raw) {
  const sections = {};
  const byKey = new Map();
  for (const s of SECTIONS) {
    const entries = (raw[s.id] || []).map((record) => ({
      section: s.id,
      id: parseRef(record.url)?.id ?? "",
      name: String(record[s.nameField] ?? ""),
      record,
    }));
    if (s.id === "films") entries.sort((a, b) => a.record.episode_id - b.record.episode_id);
    for (const e of entries) byKey.set(`${e.section}/${e.id}`, e);
    sections[s.id] = entries;
  }
  return { sections, get: (section, id) => byKey.get(`${section}/${id}`) };
}

// R16: "Padmé A-1" -> "padmea1": lower case, no accents, letters and digits only.
export function normalizeText(text) {
  return String(text ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, "");
}

// R16: every word of the query (normalised) occurs somewhere in the normalised name.
// A query with no words left matches everything.
export function matchesQuery(name, query) {
  const words = String(query ?? "").split(/\s+/).map(normalizeText).filter(Boolean);
  const target = normalizeText(name);
  return words.every((w) => target.includes(w));
}

// R4 (changed in round 3): the section filter uses the R16 matching rules.
export function searchEntries(entries, query) {
  return entries.filter((e) => matchesQuery(e.name, query));
}

// R16: matches in every section, grouped in menu order; blank text gives no groups.
export function searchAll(index, query) {
  if (!normalizeText(query)) return [];
  return SECTIONS
    .map((s) => ({ section: s.id, label: s.label, entries: searchEntries(index.sections[s.id] || [], query) }))
    .filter((g) => g.entries.length > 0);
}

// "birth_year" -> "Birth year"; all-caps names such as "MGLT" are kept as they are.
export function labelFor(field) {
  if (field === field.toUpperCase()) return field;
  const words = field.replace(/_/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

// R5: every plain field of the record, in the record's order.
export function factsOf(entry) {
  return Object.entries(entry.record)
    .filter(([key]) => !HIDDEN_FIELDS.has(key) && !(key in REF_FIELDS))
    .map(([key, value]) => ({ label: labelFor(key), value: Array.isArray(value) ? value.join(", ") : String(value) }));
}

// R6: one group per non-empty reference field, each link pointing at the target entry.
export function relatedOf(entry, index) {
  const groups = [];
  for (const [key, value] of Object.entries(entry.record)) {
    if (!(key in REF_FIELDS) || value == null) continue;
    const urls = Array.isArray(value) ? value : [value];
    if (urls.length === 0) continue;
    const links = urls.map((url) => {
      const ref = parseRef(url);
      const target = ref && index.get(ref.section, ref.id);
      return target ? { name: target.name, href: hrefFor(target.section, target.id) } : { name: "Unknown entry", href: null };
    });
    groups.push({ label: labelFor(key), links });
  }
  return groups;
}

function decodeSafely(text) {
  try { return decodeURIComponent(text); } catch { return text; }
}

// "#/people/1" -> detail; "#/people" -> list; anything unknown -> the films list.
export function parseRoute(hash, index) {
  const path = String(hash ?? "").replace(/^#\/?/, "");
  // R16: "#/search/<text>" -> the search view; the text may itself contain "/".
  const search = path.match(/^search(?:\/(.*))?$/);
  if (search) return { view: "search", query: decodeSafely(search[1] ?? "") };
  // R18: "#/favorites" -> the favorites view.
  if (path === "favorites") return { view: "favorites" };
  const [section, id] = path.split("/");
  if (!SECTION_IDS.includes(section)) return { view: "list", section: "films" };
  if (!id) return { view: "list", section };
  const entry = index.get(section, id);
  return entry ? { view: "detail", section, id, entry } : { view: "notfound", section };
}

// R9 (changed in round 3): whether the sidebar is open after an action.
// "toggle" (the menu button) flips it on any screen. On narrow screens following
// a link, Escape and a click on the scrim close it; on wide screens they leave it
// alone. `wide` missing means narrow, as in round 2.
export function nextMenuState(open, action, wide = false) {
  if (action === "toggle") return !open;
  if (action === "navigate" || action === "escape" || action === "scrim") return wide ? open : false;
  return open;
}

// R9: open on wide screens (768 px and more), closed on narrow ones.
export function menuStartsOpen(wide) {
  return Boolean(wide);
}

// U1: the index Tab (or Shift+Tab when `back`) moves to inside a menu of `count`
// links, wrapping at both ends; -1 means focus is outside the menu.
export function nextFocusIndex(current, count, back) {
  if (count <= 0) return -1;
  if (current < 0 || current >= count) return back ? count - 1 : 0;
  return (current + (back ? count - 1 : 1)) % count;
}

// R15: a sky of `count` stars in a 1000 x 1000 box, the same for the same seed.
// Each star is { x, y, r (radius 0.4-1.8), o (opacity 0.3-1) }.
export function starField(count, seed) {
  let state = (seed >>> 0) || 1;
  const random = () => { // xorshift32: small, fast and repeatable
    state ^= state << 13; state >>>= 0;
    state ^= state >>> 17;
    state ^= state << 5; state >>>= 0;
    return state / 4294967296;
  };
  const round = (v) => Math.round(v * 10) / 10;
  return Array.from({ length: count }, () => {
    const size = random() ** 3; // mostly small stars, a few bright ones
    return { x: round(random() * 1000), y: round(random() * 1000), r: round(0.4 + size * 1.4), o: round(0.3 + random() * 0.7) };
  });
}

// R15: the intro moves unless the visitor asks for reduced motion.
export function introStartState(reducedMotion) {
  return reducedMotion ? "still" : "playing";
}

// R15: "skip" (the button, Enter, Escape) ends the intro at any time; "end" (the
// text has scrolled away) ends it only when it moves. "done" is final.
export function nextIntroState(state, event) {
  if (state === "done") return "done";
  if (event === "skip") return "done";
  if (event === "end" && state === "playing") return "done";
  return state;
}

// R15 (changed in round 5): the value stored once the intro has been seen.
export const INTRO_SEEN = "1";

// R15 (changed in round 5): whether the intro still has to play, given the value
// stored for it (null when nothing is stored). Only the "seen" mark skips it.
export function introShouldPlay(stored) {
  return stored !== INTRO_SEEN;
}

// R15: the keys that end the intro.
export function introKeyEnds(key) {
  return key === "Enter" || key === "Escape";
}

const SITE = "Star Wars Databank";

// U5: the browser tab title for a route from parseRoute.
export function titleFor(route) {
  if (route.view === "detail") return `${route.entry.name} · ${SITE}`;
  if (route.view === "notfound") return `Not found · ${SITE}`;
  if (route.view === "search") return `Search · ${SITE}`;
  if (route.view === "favorites") return `Favorites · ${SITE}`;
  const section = SECTIONS.find((s) => s.id === route.section);
  return `${section ? section.label : "Films"} · ${SITE}`;
}

// U6: the line under the section filter, e.g. "Showing 3 of 82 characters".
// R19: `filtered` says whether any filter is set, so an empty result can say why.
export function countText(shown, total, label, query, filtered = false) {
  const noun = label.toLowerCase();
  const text = String(query ?? "").trim();
  if (shown === 0 && filtered) return text ? `No ${noun} match “${text}” with these filters.` : `No ${noun} match these filters.`;
  if (shown === 0) return `No ${noun} match “${text}”.`;
  if (shown === total) return `Showing all ${total} ${noun}`;
  return `Showing ${shown} of ${total} ${noun}`;
}

// U10: "line one\r\nline two\r\n\r\nnext" -> ["line one line two", "next"].
// SWAPI hard-wraps long text every ~35 characters; blank lines separate paragraphs.
export function paragraphsOf(text) {
  return String(text ?? "")
    .split(/\r?\n\s*\r?\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

// R18: a favorite is stored as "section/id", e.g. "people/1".
export function favoriteKey(section, id) {
  return `${section}/${id}`;
}

// R18: the favorites read back from stored text. Anything that is not a list of
// "section/id" keys with a known section is dropped; duplicates are kept once.
export function parseFavorites(text) {
  let value;
  try { value = JSON.parse(text); } catch { return []; }
  if (!Array.isArray(value)) return [];
  const keys = value.filter((k) => typeof k === "string" && /^[a-z]+\/\d+$/.test(k) && SECTION_IDS.includes(k.split("/")[0]));
  return [...new Set(keys)];
}

// R18: a new list with `key` added at the end, or removed if it was there.
export function toggleFavorite(list, key) {
  return list.includes(key) ? list.filter((k) => k !== key) : [...list, key];
}

// R18: the favorites grouped by section in menu order, each group in the
// section's list order; keys with no entry in the snapshot are skipped.
export function favoriteGroups(index, list) {
  const keys = new Set(list);
  return SECTIONS
    .map((s) => ({
      section: s.id,
      label: s.label,
      entries: (index.sections[s.id] || []).filter((e) => keys.has(favoriteKey(e.section, e.id))),
    }))
    .filter((g) => g.entries.length > 0);
}

// R18: the text of the button on a detail page.
export function favoriteButtonText(on) {
  return on ? "★ In favorites" : "☆ Add to favorites";
}

// R19: the option shown for an entry with no reference, e.g. a character with no species.
export const NOT_LISTED = "Not listed";
const COMPANY_SUFFIX = /^(inc\.?|incorporated|ltd\.?)$/i;

// R19: the values an entry has for one filter, as written in the data (trimmed).
function filterLabels(entry, filter, index) {
  const value = entry.record[filter.field];
  if (filter.kind === "ref") {
    const urls = Array.isArray(value) ? value : value ? [value] : [];
    const names = urls.map((url) => {
      const ref = parseRef(url);
      return ref && index.get(ref.section, ref.id)?.name;
    }).filter(Boolean);
    return names.length ? names : [NOT_LISTED];
  }
  const text = String(value ?? "").trim();
  if (filter.kind === "year") return [text.slice(0, 4)];
  if (filter.kind !== "list") return [text];
  const separators = new RegExp(`[,${filter.split ?? ""}]`);
  const parts = [];
  for (const piece of text.split(separators).map((p) => p.trim()).filter(Boolean)) {
    // "Gallofree Yards, Inc." is one company, not two.
    if (COMPANY_SUFFIX.test(piece) && parts.length) parts[parts.length - 1] += `, ${piece}`;
    else parts.push(piece);
  }
  return parts;
}

// R19: the option values (lower case, no duplicates) an entry has for a filter.
export function filterValues(entry, filter, index) {
  return [...new Set(filterLabels(entry, filter, index).map((v) => v.toLowerCase()))];
}

// R19: the options of one filter's dropdown: { value, label, count }, sorted by
// label (numbers in order, "Not listed" last). The label is the spelling found
// first; the count is how many entries have the value.
export function filterOptions(entries, filter, index) {
  const options = new Map();
  for (const entry of entries) {
    const seen = new Set();
    for (const label of filterLabels(entry, filter, index)) {
      const value = label.toLowerCase();
      if (seen.has(value)) continue;
      seen.add(value);
      if (!options.has(value)) options.set(value, { value, label, count: 0 });
      options.get(value).count++;
    }
  }
  const last = NOT_LISTED.toLowerCase();
  return [...options.values()].sort((a, b) =>
    (a.value === last) - (b.value === last) ||
    a.label.localeCompare(b.label, "en", { sensitivity: "base", numeric: true }));
}

// R19: the entries that have the chosen value of every filter. `chosen` maps a
// field to an option value; "" or a missing field means "Any".
export function applyFilters(entries, chosen, section, index) {
  const active = (FILTERS[section] || []).filter((f) => chosen[f.field]);
  return entries.filter((e) => active.every((f) => filterValues(e, f, index).includes(chosen[f.field])));
}
