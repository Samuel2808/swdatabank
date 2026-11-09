// Rendering and routing only. All logic lives in logic.js and loader.js.
import { SECTIONS } from "./sections.js";
import { buildIndex, searchEntries, factsOf, relatedOf, parseRoute } from "./logic.js";
import { loadAll, errorMessage } from "./loader.js";

const main = document.getElementById("main");
const tabs = document.getElementById("tabs");
let index = null;

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "text") node.textContent = v;
    else node.setAttribute(k, v);
  }
  node.append(...children);
  return node;
}

const labelOf = (id) => SECTIONS.find((s) => s.id === id).label;

function renderTabs(current) {
  tabs.replaceChildren(...SECTIONS.map((s) => {
    const a = el("a", { href: `#/${s.id}`, text: s.label });
    if (s.id === current) a.setAttribute("aria-current", "page");
    return a;
  }));
}

function subtitle(entry) {
  const r = entry.record;
  if (entry.section === "films") return `Episode ${r.episode_id} · ${r.release_date}`;
  return r.model || r.classification || r.climate || r.birth_year || "";
}

function renderList(section) {
  const all = index.sections[section];
  const input = el("input", { class: "search", type: "search", placeholder: `Search ${labelOf(section).toLowerCase()}…`, "aria-label": "Search by name" });
  const count = el("p", { class: "count" });
  const list = el("ul", { class: "cards" });

  function update() {
    const found = searchEntries(all, input.value);
    count.textContent = found.length ? `${found.length} of ${all.length}` : "No matches";
    list.replaceChildren(...found.map((e) =>
      el("li", {}, el("a", { class: "card", href: `#/${e.section}/${e.id}` }, e.name, el("small", { text: subtitle(e) })))));
  }
  input.addEventListener("input", update);
  update();
  main.replaceChildren(el("h1", { text: labelOf(section) }), input, count, list);
}

function renderDetail(entry) {
  const facts = el("dl", { class: "facts" });
  for (const f of factsOf(entry)) facts.append(el("dt", { text: f.label }), el("dd", { text: f.value }));

  const related = relatedOf(entry, index).flatMap((g) => [
    el("h2", { text: g.label }),
    el("ul", { class: "links" }, ...g.links.map((l) =>
      el("li", {}, l.href ? el("a", { href: l.href, text: l.name }) : el("span", { text: l.name })))),
  ]);

  main.replaceChildren(
    el("a", { class: "back", href: `#/${entry.section}`, text: `← ${labelOf(entry.section)}` }),
    el("h1", { text: entry.name }),
    el("h2", { text: "Facts" }), facts,
    ...related,
  );
}

function renderNotFound(section) {
  main.replaceChildren(
    el("h1", { text: "Not found" }),
    el("p", {}, "There is no such entry. ", el("a", { href: `#/${section}`, text: `Back to ${labelOf(section)}` })),
  );
}

function render() {
  const route = parseRoute(location.hash, index);
  renderTabs(route.section);
  if (route.view === "detail") {
    renderDetail(route.entry);
    document.title = `${route.entry.name} · Star Wars Databank`;
  } else if (route.view === "notfound") {
    renderNotFound(route.section);
  } else {
    renderList(route.section);
    document.title = `${labelOf(route.section)} · Star Wars Databank`;
  }
  window.scrollTo(0, 0);
}

async function start() {
  try {
    index = buildIndex(await loadAll((url) => fetch(url)));
  } catch (err) {
    main.replaceChildren(el("p", { class: "error", role: "alert", text: errorMessage(err) }));
    return;
  }
  window.addEventListener("hashchange", render);
  render();
}

start();
