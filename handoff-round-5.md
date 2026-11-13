# Handoff — end of round 5

Read this with `problem.md`, `spec.md`, `CLAUDE.md` and `docs/decisions/` before starting round 6.

## State

- Round 5 was built on branch `round-5-intro-address-sky`: 14 commits on top of `main` at `ccfec06`, where the owner finished writing the round 5 requirements. It was pushed as pull request #4 (https://github.com/Samuel2808/swdatabank/pull/4), and the owner reviewed and merged it into `main` (merge commit `470e19c`).
- `npm test` runs 173 tests and all pass: 142 from rounds 1–4 and 31 new (R15 9, R20 15, R21 7). Every test name starts with the requirement ID it checks. No earlier test had to change.
- Some test-first commits fail on purpose at that commit:
  - `d19dde6` (R15) and `33abcd9` (R20) fail because the functions they import do not exist yet;
  - `a4fe268` (R21) fails because the CSS strip is not there yet.
- The repository has no CI, so nothing runs on a pull request. Run `npm test` yourself.

## Run and test

- Run: `python3 -m http.server 8000`, then open http://localhost:8000 (`npm start` does the same). In this round, ports 8000 and 8123 were already in use, and port 8125 worked.
- Test: `npm test` (Node 18 or newer, nothing to install).
- **The intro now plays only on a first visit.** To see it again, either:
  - press "Play intro" at the bottom of the menu, or
  - run `localStorage.removeItem("swdatabank.introSeen")` in the console and reload.

  The in-app browser used for the round 5 check has this key set.

## What round 5 delivered

| Req | What was built | Where |
|-----|----------------|-------|
| R15 (changed) | **The intro plays on a first visit only.** It is marked seen when it ends in any way (Skip, Enter, Escape, or the text finishes), by storing `"1"` under `swdatabank.introSeen`. If storage throws, the intro plays every time, as in round 3.<br><br>**"Play intro"** is a button at the bottom of the menu, after Favorites and set apart by a line, with a new play icon. It closes the phone menu and replays the same intro over the current page. Focus returns to that page's heading. | `js/logic.js` (`INTRO_SEEN`, `introShouldPlay`), `js/store.js` (`createIntroMemory(storage)`, `INTRO_SEEN_KEY`), `js/icons.js` (`intro`), `js/app.js` (`prepareIntro`, `playIntro`, `hideIntro`, `playIntroButton`), `styles.css` (`.play-intro`) |
| R20 | **Address format:** a list's filters and name box are kept after a `?` in the hash, e.g. `#/planets?climate=arid&terrain=desert&q=tat`. Fields follow `FILTERS` order and values are the lower-case option values of R19; the name box is `q`. "Any" and a blank name box are left out. Unknown fields and values are ignored, and the address is left as it is.<br><br>**History:** each dropdown change and each "Clear filters" adds a history entry. Typing in the name box adds one, then replaces it.<br><br>**Updating:** a change of address within the same section's list (Back, Forward, a link, the section's menu link) updates the list in place, so focus and scroll stay. | `js/logic.js` (`listHash`, `parseListState`, `historyMode`; `parseRoute` ignores `?…` after a section or entry), `js/app.js` (`renderList`'s `commit` and `apply`, `listView`, `ownHash`, the start of `render`), decision 0009 |
| R21 | **The strip:** `.sky` is now an opaque black strip fixed under the top bar, `--sky` tall (40 px, 32 px below 768 px), with a grey bottom line. `.page` (`margin-top`) and `#sidebar` (`top`) start below it.<br><br>**The X-wing:** drawn 112 × 32 px (84 × 24 px on phones), 4 px from the top of the strip. The R17 timing is unchanged.<br><br>**Reduced motion:** sets `--sky: 0px` and hides the strip. | `styles.css`, `index.html` (comments only), decision 0008 |

Also:
- `spec.md` has a round 5 section and notes where the round 2–4 text it replaces is (R13 X-wing, R15 "every load", R19 "not in the URL").
- `README.md` describes the new behaviour.
- The decision records are 0008 (X-wing strip) and 0009 (filters as a query inside the hash).

## How the round went, and the answers the owner gave

- `problem.md` already had the round 5 requirements (`8c7ac19`, `ccfec06`).
- I asked eleven questions before coding, and the owner answered "Accept all defaults". In short:
  - **R15:**
    - remember the intro in `localStorage` under `swdatabank.introSeen`;
    - count it as seen when it ends in any way;
    - if storage is blocked, play it every time;
    - put "Play intro" in the sidebar under Favorites;
    - a replay is the same full intro, returns to the same page, and is not counted as a new visit.
  - **R20:**
    - the address format is `#/section?field=value&q=text`;
    - each dropdown change or clear pushes a history entry, and the name box pushes once, then replaces;
    - unknown values are ignored and the address is left alone;
    - the "← Section" link on a detail page opens the plain section.
  - **R21:** a dedicated strip under the top bar, not a taller ground strip.
  - **Process:** work on branch `round-5-intro-address-sky`; push and open the pull request only when the owner says so. The owner did, and merged it.
- I checked by hand in the in-app browser at desktop width and 375 × 812:
  - the first visit plays the intro, and a reload skips it;
  - a filtered link opens with the dropdowns and name box set;
  - a dropdown change, then typing, then Back twice steps back through the filters (typing added one history entry);
  - "Play intro" plays the intro, and Escape returns to the same filtered page;
  - the X-wing stays inside the strip at both widths (paused mid-flight with the Web Animations API, for the check only);
  - the sidebar starts below the strip;
  - the page has no horizontal scrolling at 375 px.

## Decisions made in this round, and why

- **0008: the X-wing flies in its own strip under the top bar.** It is the only option that is free of text on every page and at every width while staying CSS-only.
  - A taller ground strip would put the X-wing on the ground beside the droids.
  - The top bar has no free space at 375 px.
  - Finding an empty band would need JavaScript measuring the layout.
  - Cost: 40 px of height (32 px on a phone) on every view.
- **0009: the filters are a query inside the hash.** Every view keeps one routing mechanism (`hashchange`).
  - Path segments would clash with entry ids and with values that contain `/`.
  - A real query string would split the page state across two parts of the address.
  - `history.state` alone cannot be shared as a link.
  - Cost: long addresses, and `FILTERS` field names and option values are now part of shared links.
- Smaller choices made without being asked (also listed to the owner at the end of round 5):
  - The stored value is `"1"`; any other value plays the intro.
  - "Play intro" is shown on a first visit too; it closes the phone menu first, and a replay changes nothing stored.
  - The Play intro icon (a play triangle in a circle with two stars) was drawn for this project.
  - The intro layer stays in `index.html`, and `app.js` hides it on later visits, so a returning visitor may see a black frame. An inline `<head>` script would avoid that frame but would copy the storage logic out of `js/`.
  - The name box text is kept in the address exactly as typed (spaces included) when it is not blank.
  - The section's own menu link, followed while that list is filtered, clears the filters in place (no re-render, no scroll to top).
  - The X-wing is smaller than before (150 px down to 112 / 84 px) so it fits the strip; the strip has a grey line, like the ground strip.
  - With reduced motion `--sky` is 0, so no empty band is left.
  - A second decision record (0009) was written, and the README and `index.html` comments were updated.

## Unresolved and open points

- **Not checked by hand:**
  - watching the X-wing cross on its own (it was only paused in place);
  - a full 330 s cycle;
  - a browser that blocks storage (that case is covered only by the fake-storage test);
  - the reduced-motion layout with `--sky: 0px`.
- **Possible flash:** on a later visit the intro's black layer may show for a frame before `app.js` hides it. This was not seen in the in-app browser, and on slow connections it could last longer.
- **The "← Section" link** on a detail page drops the filters, as the owner agreed. Only the browser's Back button returns to the filtered list.
- **Old links can lose a filter quietly:** renaming a field in `FILTERS`, or changing how R19 lower-cases or splits values, would drop that filter from links people have already shared, without any message.
- **The X-wing strip is empty most of the time:** about 5 of every 5.5 minutes, while the X-wing rests (R17).
- **Still open from round 4:**
  - with reduced motion the silhouettes are hidden rather than shown still;
  - the search and favorites views always use the Films photo;
  - "Galatic Basic" is listed separately from "Galactic Basic";
  - favorites are not in the site-wide search, and list cards show no star.
- **CLAUDE.md was not updated this round.** Its storage rule names only R18. `swdatabank.introSeen` (R15) now follows the same rule, and the owner may want that written down.

## Warnings for the next session

- **Two keys now hold data in visitors' browsers:** `swdatabank.favorites` (round 4) and `swdatabank.introSeen` (value `"1"`). Changing either format needs the code to keep reading the old one.
- **Shared links depend on R19 values.** The field names in `FILTERS` and the R19 option values (lower case, split lists, "Not listed") now appear in addresses people share. `parseListState` ignores anything it does not recognise, so a change breaks old links silently, not loudly.
- **`render()` in `js/app.js` starts with an in-place path.** When the route is the same section's list, it calls `listView.apply(...)` and returns before the menu, backdrop, title and focus code. If something must happen on every route change, put it before that early return.
- **`ownHash` tells the page's own address changes apart from Back and Forward.** It works because the addresses come from `URLSearchParams`, which the browser does not re-encode. Building addresses another way (for example with raw spaces) could make every keystroke push a history entry.
- **The strip's height is the `--sky` variable**, used by `.sky`, `.page` (`margin-top`, `min-height`) and `#sidebar` (`top`). The R21 tests read `--sky` from `:root` and from the `(max-width: 767px)` block, and the X-wing's `top` and `width` in px, and check that the X-wing fits. If you resize the X-wing or the strip, keep both in px or update `tests/sky.test.js`.
- **The R8 rules still apply:** no fixed width over 375 px outside `@media (min-width: …)`, and `max-width: 100%` on form controls (`.play-intro` has it).
- **Replays depend on the layer being hidden.** The intro's CSS animations restart because `playIntro` takes `hidden` off the layer. If the intro is ever hidden another way (for example `visibility`), replays will not restart.
