// Pure functions: no DOM, no network. Everything here is unit tested.
import { SECTIONS, SECTION_IDS, REF_FIELDS, HIDDEN_FIELDS } from "./sections.js";

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

// R4: case-insensitive substring match on the name; blank text matches everything.
export function searchEntries(entries, query) {
  const q = String(query ?? "").trim().toLowerCase();
  if (!q) return entries;
  return entries.filter((e) => e.name.toLowerCase().includes(q));
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

// "#/people/1" -> detail; "#/people" -> list; anything unknown -> the films list.
export function parseRoute(hash, index) {
  const [section, id] = String(hash ?? "").replace(/^#\/?/, "").split("/");
  if (!SECTION_IDS.includes(section)) return { view: "list", section: "films" };
  if (!id) return { view: "list", section };
  const entry = index.get(section, id);
  return entry ? { view: "detail", section, id, entry } : { view: "notfound", section };
}

// R9: whether the narrow-screen menu is open after an action.
// "toggle" flips it; following a link, Escape and a click on the scrim close it.
export function nextMenuState(open, action) {
  if (action === "toggle") return !open;
  if (action === "navigate" || action === "escape" || action === "scrim") return false;
  return open;
}
