// Rendering and routing only. All logic lives in logic.js and loader.js.
import { SECTIONS, FILTERS } from "./sections.js";
import {
  buildIndex, searchEntries, searchAll, normalizeText, factsOf, relatedOf, parseRoute,
  nextMenuState, menuStartsOpen, nextFocusIndex,
  starField, introStartState, nextIntroState, introKeyEnds,
  titleFor, countText, paragraphsOf,
  favoriteKey, favoriteGroups, favoriteButtonText,
  filterOptions, applyFilters,
} from "./logic.js";
import { loadAll, errorMessage } from "./loader.js";
import { createFavoriteStore } from "./store.js";
import { ICONS } from "./icons.js";
import { PHOTOS } from "./photos.js";
import { INTRO } from "./intro.js";

const main = document.getElementById("main");
const menu = document.getElementById("menu");
const menuButton = document.getElementById("menu-button");
const menuLabel = document.getElementById("menu-label");
const scrim = document.getElementById("scrim");
const backdrop = document.getElementById("backdrop");
const globalSearch = document.getElementById("global-search");
const announcer = document.getElementById("announcer");
const intro = document.getElementById("intro");
const introCrawl = document.getElementById("intro-crawl");
const introSkip = document.getElementById("intro-skip");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let introState = "done";

// R9: 768 px and wider counts as a wide screen.
const wideScreen = window.matchMedia("(min-width: 768px)");
let index = null;
let menuOpen = menuStartsOpen(wideScreen.matches);

// R18: favorites live in localStorage. Even reading window.localStorage can throw
// when the browser blocks storage; the store then keeps them in memory.
function browserStorage() {
  try { return window.localStorage; } catch { return undefined; }
}
const favorites = createFavoriteStore(browserStorage());
const NOT_SAVED = "Favorites can't be saved in this browser and will be lost when you close the page.";

// R15: while the intro shows, everything behind it is inert (no clicks, no Tab).
function setPageInert(inert) {
  for (const node of document.querySelectorAll("body > :not(#intro)")) node.inert = inert;
}

// R15: draw the stars, fill in the text, and start the intro.
function startIntro() {
  document.getElementById("intro-stars").innerHTML = starField(260, 7)
    .map((s, i) => `<circle cx="${s.x}" cy="${s.y}" r="${s.r}" opacity="${s.o}"${i % 9 === 0 ? ' class="twinkle"' : ""}/>`)
    .join(""); // numbers only, from starField
  document.getElementById("intro-title").textContent = INTRO.title;
  introCrawl.replaceChildren(el("h2", { text: INTRO.heading }), ...INTRO.paragraphs.map((p) => el("p", { text: p })));
  introState = introStartState(reducedMotion.matches);
  setPageInert(true);
  introSkip.addEventListener("click", () => introEvent("skip"));
  introCrawl.addEventListener("animationend", (e) => { if (e.target === introCrawl) introEvent("end"); });
  introSkip.focus();
}

// R15: apply nextIntroState; when it says "done", show the page.
function introEvent(event) {
  if (introState === "done") return;
  introState = nextIntroState(introState, event);
  if (introState !== "done") return;
  intro.hidden = true;
  document.body.classList.remove("intro-active");
  setPageInert(false);
  focusHeading();
}

// Move focus to the current view's main heading (or the content if there is none).
function focusHeading() {
  const target = main.querySelector("h1") || main;
  target.setAttribute("tabindex", "-1");
  target.focus({ preventScroll: true });
}

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

function iconFor(id) {
  const icon = el("span", { class: "icon" });
  icon.innerHTML = ICONS[id]; // static markup from icons.js, never user input
  return icon;
}

// R9, R10: the sidebar menu, one link with an icon per section,
// then Favorites (R18).
function renderMenu(current) {
  const item = (id, a) => {
    if (id === current) a.setAttribute("aria-current", "page");
    return el("li", {}, a);
  };
  menu.replaceChildren(
    ...SECTIONS.map((s) => item(s.id, el("a", { href: `#/${s.id}` }, iconFor(s.id), s.label))),
    item("favorites", el("a", { href: "#/favorites", class: "menu-favorites" }, iconFor("favorites"), "Favorites")),
  );
}

// R9: show the open/closed state. The scrim only exists on narrow screens.
function applyMenu() {
  document.body.classList.toggle("menu-open", menuOpen);
  menuButton.setAttribute("aria-expanded", String(menuOpen));
  menuLabel.textContent = menuOpen ? "Hide menu" : "Menu";
  scrim.hidden = !(menuOpen && !wideScreen.matches);
}

// The narrow menu lies over the page, so it behaves like a dialog (U1):
// focus moves into it when it opens and back to the button when it closes.
const overlayMenu = () => menuOpen && !wideScreen.matches;

// R9: apply the state decided by nextMenuState.
function menuAction(action) {
  const wasOverlay = overlayMenu();
  menuOpen = nextMenuState(menuOpen, action, wideScreen.matches);
  applyMenu();
  if (!wasOverlay && overlayMenu()) menu.querySelector("a")?.focus();
  else if (wasOverlay && !menuOpen && action !== "navigate") menuButton.focus();
}

// U1: Tab and Shift+Tab cycle through the menu button and the menu's links.
function trapMenuFocus(e) {
  if (e.key !== "Tab" || !overlayMenu()) return;
  const items = [menuButton, ...menu.querySelectorAll("a")];
  const next = nextFocusIndex(items.indexOf(document.activeElement), items.length, e.shiftKey);
  e.preventDefault();
  items[next].focus();
}

// R11: the section's photo behind the page; R12: the same photo as a banner.
function setBackdrop(section) {
  backdrop.style.backgroundImage = `url("${PHOTOS[section].file}")`;
}

function banner(section) {
  const p = PHOTOS[section];
  return el("figure", { class: "banner" },
    el("img", { src: p.file, alt: p.alt }),
    el("figcaption", { text: `${p.place} · filmed as ${p.filmedAs} · Photo: ${p.author} (${p.license})` }));
}

function subtitle(entry) {
  const r = entry.record;
  if (entry.section === "films") return `Episode ${r.episode_id} · ${r.release_date}`;
  return r.model || r.classification || r.climate || r.birth_year || "";
}

function cards(entries) {
  return el("ul", { class: "cards" }, ...entries.map((e) =>
    el("li", {}, el("a", { class: "card", href: `#/${e.section}/${e.id}` }, e.name, el("small", { text: subtitle(e) })))));
}

function renderList(section) {
  const all = index.sections[section];
  const input = el("input", {
    class: "search", type: "search",
    placeholder: `Filter ${labelOf(section).toLowerCase()} by name…`,
    "aria-label": `Filter ${labelOf(section).toLowerCase()} by name`,
  });
  const count = el("p", { class: "count" });
  const list = el("ul", { class: "cards" });

  // R19: one dropdown per field of this section, "Any" first, then the values with their counts.
  const selects = FILTERS[section].map((f) => {
    const select = el("select", { "data-field": f.field },
      el("option", { value: "", text: "Any" }),
      ...filterOptions(all, f, index).map((o) => el("option", { value: o.value, text: `${o.label} (${o.count})` })));
    select.addEventListener("change", update);
    return { field: f.field, select, label: el("label", {}, el("span", { text: f.label }), select) };
  });
  const clear = el("button", { type: "button", class: "clear-filters", text: "Clear filters" });
  clear.addEventListener("click", () => {
    for (const s of selects) s.select.value = "";
    input.value = "";
    update();
  });
  const filters = el("fieldset", { class: "filters" }, el("legend", { text: "Filter by" }),
    ...selects.map((s) => s.label), clear);

  function update() {
    const chosen = Object.fromEntries(selects.map((s) => [s.field, s.select.value]));
    const filtered = selects.some((s) => s.select.value);
    const found = searchEntries(applyFilters(all, chosen, section, index), input.value);
    count.textContent = countText(found.length, all.length, labelOf(section), input.value, filtered);
    list.replaceChildren(...cards(found).children);
  }
  input.addEventListener("input", update);
  update();
  main.replaceChildren(banner(section), el("h1", { text: labelOf(section) }), input, filters, count, list);
}

function renderDetail(entry) {
  const facts = el("dl", { class: "facts" });
  for (const f of factsOf(entry)) {
    const paras = paragraphsOf(f.value);
    if (paras.length > 1 || f.value.length > 120) {
      // U10: long text gets the full width, as real paragraphs.
      facts.append(el("div", { class: "fact long" }, el("dt", { text: f.label }),
        el("dd", {}, ...paras.map((p) => el("p", { text: p })))));
    } else {
      // U12: each fact is a small box of label and value.
      facts.append(el("div", { class: "fact" }, el("dt", { text: f.label }), el("dd", { text: f.value })));
    }
  }

  const related = relatedOf(entry, index).flatMap((g) => [
    el("h2", { text: g.label }),
    el("ul", { class: "links" }, ...g.links.map((l) =>
      el("li", {}, l.href ? el("a", { href: l.href, text: l.name }) : el("span", { text: l.name })))),
  ]);

  main.replaceChildren(
    banner(entry.section),
    el("a", { class: "back", href: `#/${entry.section}`, text: `← ${labelOf(entry.section)}` }),
    el("h1", { text: entry.name }),
    favoriteButton(entry),
    el("h2", { text: "Facts" }), facts,
    ...related,
  );
}

// R18: "☆ Add to favorites" / "★ In favorites" under the entry's title.
function favoriteButton(entry) {
  const key = favoriteKey(entry.section, entry.id);
  const button = el("button", { class: "fav", type: "button", text: favoriteButtonText(favorites.has(key)) });
  const note = el("p", { class: "hint fav-note", text: NOT_SAVED });
  note.hidden = favorites.persistent;
  button.addEventListener("click", () => {
    const on = favorites.toggle(key);
    button.textContent = favoriteButtonText(on);
    note.hidden = favorites.persistent;
    announcer.textContent = on ? "Added to favorites" : "Removed from favorites";
  });
  return el("div", { class: "fav-bar" }, button, note);
}

// R16, R18: entries grouped by section, each group with its icon, label and count.
function sectionGroups(groups) {
  return groups.map((g) => el("section", { class: "result-group", "aria-label": g.label },
    el("h2", {}, iconFor(g.section), g.label, el("span", { text: `(${g.entries.length})` })),
    cards(g.entries)));
}

// R18: every favorite, grouped by section.
function renderFavorites() {
  const groups = favoriteGroups(index, favorites.list());
  const body = groups.length
    ? sectionGroups(groups)
    : [el("p", { class: "empty", text: "No favorites yet." }),
      el("p", { class: "hint", text: "Open any entry and press “☆ Add to favorites” to keep it here." })];
  if (!favorites.persistent) body.push(el("p", { class: "hint fav-note", text: NOT_SAVED }));
  main.replaceChildren(banner("films"), el("h1", { text: "Favorites" }), ...body);
}

function renderNotFound(section) {
  main.replaceChildren(
    banner(section),
    el("h1", { text: "Not found" }),
    el("p", {}, "There is no such entry. ", el("a", { href: `#/${section}`, text: `Back to ${labelOf(section)}` })),
  );
}

// R16: results from every section, grouped by section.
function renderSearch(query) {
  const groups = searchAll(index, query);
  const total = groups.reduce((n, g) => n + g.entries.length, 0);
  let summary;
  const body = [];
  if (!normalizeText(query)) {
    summary = "Type a name in the search bar to search every section.";
    body.push(el("p", { class: "hint", text: summary }));
  } else if (total === 0) {
    summary = `Nothing matches “${query.trim()}” in any section.`;
    body.push(el("p", { class: "empty", text: summary }),
      el("p", { class: "hint", text: "Check the spelling, or try part of a name, such as “sky” for Skywalker." }));
  } else {
    summary = `${total} ${total === 1 ? "result" : "results"} for “${query.trim()}”`;
    body.push(el("p", { class: "count", text: summary }), ...sectionGroups(groups));
  }
  announcer.textContent = summary;
  main.replaceChildren(banner("films"), el("h1", { text: "Search" }), ...body);
}

// R16: typing goes to #/search/<text>. The first keystroke adds a history entry;
// the rest replace it, so Back leaves the search in one step.
function onSearchInput() {
  const target = `#/search/${encodeURIComponent(globalSearch.value)}`;
  if (location.hash.startsWith("#/search")) {
    history.replaceState(null, "", target);
    render();
  } else {
    location.hash = target;
  }
}

function render() {
  const route = parseRoute(location.hash, index);
  const own = route.view === "search" || route.view === "favorites"; // views with no section
  renderMenu(route.view === "favorites" ? "favorites" : own ? null : route.section);
  setBackdrop(own ? "films" : route.section);
  if (route.view !== "search") globalSearch.value = "";
  else if (globalSearch.value !== route.query) globalSearch.value = route.query;
  if (route.view === "search") renderSearch(route.query);
  else if (route.view === "favorites") renderFavorites();
  else if (route.view === "detail") renderDetail(route.entry);
  else if (route.view === "notfound") renderNotFound(route.section);
  else renderList(route.section);
  document.title = titleFor(route);
  window.scrollTo(0, 0);
  // U4: start keyboard and screen-reader users at the top of the new view,
  // unless they are typing in the search bar or the intro is still showing.
  if (introState === "done" && document.activeElement !== globalSearch) focusHeading();
}

async function start() {
  startIntro();
  setBackdrop("films");
  applyMenu();
  document.querySelector(".skip-link").addEventListener("click", focusHeading);
  menuButton.addEventListener("click", () => menuAction("toggle"));
  scrim.addEventListener("click", () => menuAction("scrim"));
  menu.addEventListener("click", (e) => { if (e.target.closest("a")) menuAction("navigate"); });
  document.addEventListener("keydown", (e) => {
    if (introState !== "done") {
      if (introKeyEnds(e.key)) { e.preventDefault(); introEvent("skip"); }
      return;
    }
    if (e.key === "Escape") menuAction("escape");
    trapMenuFocus(e);
  });
  // R9: crossing 768 px starts over with the default for the new width.
  wideScreen.addEventListener("change", () => {
    menuOpen = menuStartsOpen(wideScreen.matches);
    applyMenu();
  });
  try {
    index = buildIndex(await loadAll((url) => fetch(url)));
  } catch (err) {
    main.replaceChildren(el("p", { class: "error", role: "alert", text: errorMessage(err) }));
    return;
  }
  globalSearch.addEventListener("input", onSearchInput);
  globalSearch.form.addEventListener("submit", (e) => e.preventDefault());
  window.addEventListener("hashchange", render);
  render();
}

start();
