// R18: keeps the favorites in a storage object (localStorage in the browser).
// The storage is passed in, the way loader.js takes a fetch function, so tests
// can pass a fake. Storage that throws (some private windows) is survived:
// favorites then live in memory until the page closes, and `persistent` is false.
import { parseFavorites, toggleFavorite, introShouldPlay, INTRO_SEEN } from "./logic.js";

export const FAVORITES_KEY = "swdatabank.favorites";

export function createFavoriteStore(storage) {
  let persistent = Boolean(storage);
  let list = [];
  if (storage) {
    try { list = parseFavorites(storage.getItem(FAVORITES_KEY)); } catch { persistent = false; }
  }

  function save() {
    if (!persistent) return;
    try { storage.setItem(FAVORITES_KEY, JSON.stringify(list)); } catch { persistent = false; }
  }

  return {
    get persistent() { return persistent; },
    list: () => [...list],
    has: (key) => list.includes(key),
    // Adds or removes `key`; returns whether it is a favorite afterwards.
    toggle(key) {
      list = toggleFavorite(list, key);
      save();
      return list.includes(key);
    },
  };
}

// R15 (changed in round 5): remembers that the visitor has seen the intro, so it
// plays on the first visit only. Storage that throws counts as a first visit
// every time (the intro plays, as in round 3); nothing here ever throws.
export const INTRO_SEEN_KEY = "swdatabank.introSeen";

export function createIntroMemory(storage) {
  return {
    shouldPlay() {
      try { return introShouldPlay(storage ? storage.getItem(INTRO_SEEN_KEY) : null); } catch { return true; }
    },
    markSeen() {
      try { storage?.setItem(INTRO_SEEN_KEY, INTRO_SEEN); } catch { /* not kept: the intro plays next time */ }
    },
  };
}
