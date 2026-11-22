# Handoff — end of round 7

Read this with `problem.md`, `spec.md`, `CLAUDE.md` and `docs/decisions/` before starting round 8.

## State

- Round 7 was built on branch `round-7-stars-photos`: 11 commits on top of `main` at `2c3ad04`, where the owner finished writing the round 7 requirements. It was pushed as pull request #6 (https://github.com/Samuel2808/swdatabank/pull/6), and the owner merged it into `main` (merge commit `70905bb`) with no review comments.
- **The local checkout was still on `round-7-stars-photos` when this handoff was written,** and local `main` had not been updated. Run `git switch main && git pull` before branching for round 8.
- `npm test` runs 223 tests and all pass: 204 from rounds 1–6 and 19 new (R24 9 in `tests/stars.test.js`, R25 10 in `tests/viewphotos.test.js`). Every test name starts with the requirement ID it checks.
- **No earlier test was changed in round 7.**
- Two test-first commits fail on purpose at that commit, because the functions they import did not exist yet:
  - `0f95609` (R24);
  - `3f542d2` (R25).
- The repository has no CI, so nothing runs on a pull request. Run `npm test` yourself.

## Run and test

- Run: `python3 -m http.server 8000`, then open http://localhost:8000 (`npm start` does the same). In this round the server ran on port 8127 (`--bind 127.0.0.1`) from a background shell, not a committed launch config.
- Test: `npm test` (Node 18 or newer, nothing to install). This round used Node 26.
- **The intro plays only on a first visit.** To see it again, either:
  - press "Play intro" at the bottom of the menu, or
  - run `localStorage.removeItem("swdatabank.introSeen")` in the console and reload.

  The in-app browser used for the round 7 check has this key set.
- **To see the stars,** add favorites with "☆ Add to favorites" on entries, or set them in the console:

  ```js
  localStorage.setItem("swdatabank.favorites", JSON.stringify(["people/1", "planets/1"])); location.reload()
  ```

  Round 7's check did this and then removed the key. **Any favorites saved in the in-app browser before round 7 were overwritten and are gone.**
- To see the reduced-motion version without changing system settings, use the console snippet in `handoff-round-6.md`.

## What round 7 delivered

| Req | What was built | Where |
|-----|----------------|-------|
| R24 | **A star on favorite cards in every list.**<br><br>Every card list (section lists, also when filtered; search results; the Favorites page) is drawn by `cards()`. It asks `markFavorites(entries, favorites.list())` which entries are favorites.<br><br>A favorite's card gets:<br>• a white "★" in an `aria-hidden` span (`class="star"`), placed 10 px from the top-right corner;<br>• a visually hidden " (favorite)", so a screen reader hears e.g. "Luke Skywalker 19BBY (favorite)".<br><br>Every card keeps `padding-right: 28px`, so a long name never runs under the star (R8). Cards that are not favorites show nothing. The star is only a mark, not a button. | `js/logic.js` (`FAVORITE_MARK`, `markFavorites`), `js/app.js` (`cards`), `styles.css` (`.card`, `.card .star`), decision 0012 |
| R25 | **Own photos for search and Favorites.**<br><br>`PHOTOS` has two more keys:<br>• `search`: `img/photos/search.jpg`, Wadi Rum, Jordan (filmed as Jedha), by Peter Chisholm, CC0, 1280 × 960, 354 KB;<br>• `favorites`: `img/photos/favorites.jpg`, Plaza de España, Seville, Spain (filmed as Naboo), by NACLE, CC0, 1280 × 508, 213 KB.<br><br>Both are the photographers' own works on Wikimedia Commons, tagged CC0. The Wadi Rum photo is a Commons Quality image. Each is listed in `js/photos.js`, `CREDITS.md` (with its Commons page) and `scripts/fetch-photos.mjs`.<br><br>`photoFor(route)` gives the key: `search`, `favorites`, or the route's section for list, detail and not-found views. `render()` uses it for the backdrop. `renderSearch` and `renderFavorites` name their own banners.<br><br>A detail page opened from search or Favorites keeps its section's photo. While the data loads, the backdrop is still the Films photo. | `js/photos.js`, `img/photos/`, `CREDITS.md`, `scripts/fetch-photos.mjs`, `js/logic.js` (`photoFor`), `js/app.js` (`render`, `renderSearch`, `renderFavorites`), decision 0013 |

Also:
- `spec.md` has a round 7 section. It also marks three lines of round 3 and 4 text as "Changed in round 7": the search view's photo, the Favorites view's photo, and "Not added: stars on list cards".
- `README.md` mentions the stars and says there are eight photos.
- The decision records are 0012 (the star) and 0013 (the photos).

## How the round went, and the answers the owner gave

- `problem.md` already had the round 7 requirements (`2c3ad04`).
- The session started without a project folder. The owner's message named `~/csc299/swdatabank`, and the session moved there.
- I asked four questions before coding, and the owner picked the suggested answer each time:
  - **Photos:** new photos may be downloaded from Wikimedia Commons, which goes beyond "use only what is in this repository", added to the script and credited.
  - **Star:** display-only "★" in the card's corner with hidden text for screen readers; nothing on cards that are not favorites.
  - **Places:** I pick any valid filming location not already used.
  - **Process:** work on `round-7-stars-photos` and push only when the owner says so. The owner later chose "Create PR", and then merged it.
- **How the photos were chosen:**
  - I searched Commons for CC0 or public-domain photos of Wadi Rum, Villa del Balbianello, the Plaza de España, the Salar de Uyuni and Puzzlewood.
  - Villa del Balbianello and Puzzlewood had none.
  - A first Wadi Rum candidate (from Unsplash, by Evan Qu wenhong) was dropped because Commons marks it "Images from Unsplash (review needed)".
- **How the photos were downloaded:** `node` `fetch` to Commons hung for over two minutes in this environment, while `curl` worked. So I downloaded the two files with `curl` from the same `Special:FilePath/<title>?width=1280` address the script uses. I did not run `scripts/fetch-photos.mjs`.
- **Checked by hand in the in-app browser:**
  - At 375 × 812, the Characters list showed stars on Luke Skywalker and R2-D2 only, with no horizontal scrolling.
  - At 375 × 812, "sky" search results showed the Wadi Rum backdrop, banner and caption, and a star on Luke only.
  - At desktop width (1024 px), Favorites showed the Plaza de España backdrop, banner and caption, and a star on all 4 cards.

## Decisions made in this round, and why

- **0012: the star is a "★" character drawn by the single `cards()` function, from a pure `markFavorites`.** One place builds every card, so the four kinds of list cannot drift apart. The rule is tested without a browser, and the star matches the detail page's "★ In favorites" button.
  - A CSS `::after` star has no reliable text for screen readers, and puts the rule in CSS where no test runs it.
  - A new SVG icon is more markup for a shape the font already draws.
  - A clickable star would be a button inside a link, which is invalid HTML. R24 does not ask for it, and the owner chose display-only.
  - Cost: the star's look depends on the visitor's font; every card keeps 28 px on the right even without a star; a list already on screen does not update if favorites change in another tab.
- **0013: the two views get their own keys in `PHOTOS`, chosen by `photoFor(route)`.** One table and one credit list hold every photo, and no view names a photo by hand.
  - A separate `VIEW_PHOTOS` table means two lookups and two credit lists for photos with the same rules.
  - Crops of the six existing photos show the same places again, so they are not really the views' own photos.
  - A photo chosen from the results would flicker while typing, and would still be a section's photo.
  - Cost: `PHOTOS` has keys that are not sections; about 570 KB more is bundled; the Favorites panorama is wide, so the backdrop crops its sides on tall screens.
- Smaller choices made without being asked (also listed to the owner at the end of round 7):
  - which two places and photos, and dropping the "review needed" Wadi Rum photo;
  - downloading with `curl` instead of running the script;
  - the star is white (R14), 1rem, 10 px from the corner;
  - every card keeps 28 px of right padding;
  - no "☆" on cards that are not favorites;
  - the names `markFavorites`, `FAVORITE_MARK` and `photoFor`;
  - a detail page keeps its section's photo, even when opened from search or Favorites;
  - the Films photo stays as the backdrop while the data loads;
  - the alt text, and "Jedha" and "Naboo" as the planets in the captions;
  - two decision records, where one was required;
  - the README was updated, and "Changed in round 7" notes were added to `spec.md`.

## Corrections to what I told the owner in this round

- At the end of the round I said both features were checked at 375 px and at desktop width. That is not true of every view: the Favorites page was checked only at desktop width, and the search page only at 375 px (see the list above).
- The spec's "Testing round 7" says "checked by hand in the browser at 375 × 812 and at desktop width". It was written before the check and has the same gap.

## Unresolved and open points

- **Not checked by hand:**
  - the Favorites page at 375 px, including how the wide panorama crops as a narrow, tall backdrop;
  - the search page at desktop width;
  - a card with a very long name next to the star at 375 px (only the CSS is tested);
  - a star appearing or disappearing after pressing the favorite button and going back to a list;
  - a real screen reader reading "(favorite)";
  - a detail page opened from search or Favorites keeping its section's photo (covered only by the `photoFor` test).
- **`scripts/fetch-photos.mjs` has not been run since it gained the two new entries.** It should work (it loops over `SOURCES`, and both titles are exact Commons file names). If it hangs, `node`'s `fetch` may not be reaching the network from that machine, as in this round; `curl` worked.
- **The star on a list already on screen does not update** when favorites change in another tab. Nothing listens for the `storage` event.
- **Still open from earlier rounds:**
  - favorites are not in the site-wide search;
  - the intro's black layer may flash for a frame on later visits;
  - renaming a `FILTERS` field still drops it from old links without any message;
  - the X-wing strip is empty most of the time;
  - new spelling variants after a data refresh are not merged until someone adds them to `same`;
  - "artic" and "subartic" are still shown as written;
  - the round 6 checks not done by hand: a real reduced-motion setting, still silhouettes at desktop width, the back link after a reload.
- **Fixed in round 7:** the search and Favorites views no longer use the Films photo, and list cards show a star for favorites.

## Warnings for the next session

- **`PHOTOS` has keys that are not sections:** `search` and `favorites`. Code or tests that loop over `PHOTOS` must not take its keys for section ids; loop over `SECTION_IDS` for sections. Pick a view's photo with `photoFor(route)`, not by name.
- **Every card list must go through `cards()` in `js/app.js`.** An R24 test checks that `class: "card"` appears only once in `js/app.js`, and that `renderList` and `sectionGroups` call `cards(`. A new list built elsewhere would have no stars and would fail that test.
- **Some R24 and R25 tests read source text:**
  - `tests/stars.test.js` finds top-level functions in `js/app.js` by matching `\nfunction name(…) {` up to the next line that is only `}`. Keep those functions top-level, with their closing `}` at column 0.
  - `tests/stars.test.js` also looks for `\n.card {` and `\n.card .star {` in `styles.css`, with `position: relative`, `padding-right: 28px`, and `position: absolute; top; right`.
  - `tests/viewphotos.test.js` looks for `setBackdrop(photoFor(route))`, `banner("search")` and `banner("favorites")` in `js/app.js`, for no `banner("films")`, and for `\n  search: "` and `\n  favorites: "` in `scripts/fetch-photos.mjs`.
- **`CREDITS.md` rows for the two new photos have extra words in the File column** ("(search page, R25)"). The R25 test looks for the file name in backticks and the author's name, so keep both.
- **Two keys still hold data in visitors' browsers:** `swdatabank.favorites` and `swdatabank.introSeen`. Round 7 added none; the star reads the existing favorites.
- **The R8 rules still apply:** no fixed width over 375 px outside `@media (min-width: …)`, and `max-width: 100%` on form controls.
- **`CLAUDE.md` changes:** I proposed edits to `CLAUDE.md` at the end of round 7 (both storage keys, the three places a photo must be listed, `photoFor`, and `cards()`). They were left uncommitted for the owner to read. Check whether the owner kept them.
