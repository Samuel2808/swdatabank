# Handoff — end of round 2

Read this with `problem.md`, `spec.md`, `CLAUDE.md` and `docs/decisions/` before starting round 3. (There was no `handoff-round-1.md`; round 2 started from the files alone.)

## State

- `main` holds all of rounds 1 and 2. Round 2 was built on branch `round-2-fan-page` and merged as pull request #1 (merge commit `ebe49a3`), keeping its 10 commits.
- `npm test`: 45 tests, all passing (29 from round 1, 16 new). Each test name starts with the requirement ID it checks.
- Commit `caf3954` added the round 2 tests before the code, so the suite fails at that one commit on purpose.
- Run: `python3 -m http.server 8000`, then open http://localhost:8000. Any static server works.

## What round 2 delivered (R9–R14)

| Req | What was built | Where |
|-----|----------------|-------|
| R9 | Fixed, full-height left sidebar (220 px). Below 768 px it starts hidden behind `#menu-button`, opens over a scrim, and closes on following a link, Escape or a click on the scrim. The rules are the pure function `nextMenuState(open, action)`. | `index.html`, `styles.css`, `js/logic.js`, `js/app.js` |
| R10 | One original line-art SVG icon per section: crawl, lightsaber, twin-sun planet, long-eared alien, TIE-style fighter, walker. | `js/icons.js` |
| R11 | The section's photo, blurred (6 px) and darkened, fixed behind the page. Content sits on near-black panels (`rgba(0, 0, 0, 0.78)`), so white text keeps a contrast of 7:1 or better over any photo. | `styles.css` (`.backdrop`), `js/app.js` (`setBackdrop`) |
| R12 | A sharp banner of the same photo at the top of every list, detail and not-found view, captioned with the place, the planet it was filmed as, the author and the licence. | `js/app.js` (`banner`), `styles.css` |
| R13 | Inline SVG X-wing (crosses every 14 s, fires two pairs of red bolts) and R2-D2 with C-3PO (cross the bottom every 30 s; R2 rocks, 3PO's legs swing). CSS only. The layer is clipped and ignores clicks. Hidden for `prefers-reduced-motion`. | `index.html` (`.sky`), `styles.css` |
| R14 | Black and white, plus crawl yellow `#ffe81f` (links, current item, focus, brand), lightsaber blue `#4dc3ff` (card hover) and lightsaber red `#ff3b30` (laser bolts, errors). Greys only otherwise. | `styles.css` `:root` |

The photos are six public-domain or CC0 pictures of filming locations from Wikimedia Commons, one per section, in `img/photos/<section>.jpg` (1.7 MB in all, each under 600 KB):

- films: Death Valley (Tatooine)
- people: Matmata (Tatooine, the Lars homestead)
- planets: Skellig Michael (Ahch-To)
- species: Redwood National Park (Endor)
- starships: Tikal (Yavin 4)
- vehicles: Hardangerjøkulen (Hoth)

The credits are in `js/photos.js` (no URLs, for R2) and `CREDITS.md` (with source pages). `node scripts/fetch-photos.mjs` downloads them again.

## Answers the owner gave at the start of round 2

1. Photos: find ones without copyright, so public domain or CC0 only.
2. CLAUDE.md may change to allow images. It now allows only bundled PD/CC0 photos and SVG drawn for the project; logos and official art stay banned.
3. "Images" (R12) means the backgrounds, banners, icons and silhouettes together.
4. Icons and silhouettes are drawn for the project as simple SVG.
5. Animation timing as above, with reduced motion turned off.
6. Colours: "the colors of Star Wars" on top of black and white, hence the three accents.
7. The sidebar breakpoint is 768 px, and the menu closes after picking a section.
8. Testing: unit-test the wiring, and check the look by hand.

## Decisions made without being asked

These were reported to the owner at the end of round 2. Revisit any of them freely:

- Work on a branch and merge with a merge commit.
- PD/CC0 only (not CC BY or BY-SA). See decision 0002.
- Which photo goes with which section.
- One job per accent colour.
- The animation timings.
- The not-found page also gets a banner.
- The animation layer sits above the sidebar.
- The footer mentions the photos, and each caption credits its photographer.
- Photo width is about 1280 px (900 px for Matmata), and a test enforces the 600 KB limit.
- The R2 URL test now also scans `styles.css`.
- Decision record 0003 (CSS-only animations) was added.
- The README was updated.
- Tests were committed before the code.

## How the visual requirements are checked

- **Unit tests** (`tests/look.test.js`) read `index.html`, `styles.css` and `js/app.js`:
  - the sidebar and menu-button markup;
  - the 767 px media rule;
  - icons that are present and distinct;
  - photo files that are JPEGs under 600 KB, with a PD/CC0 licence and an entry in `CREDITS.md`;
  - text contrast against the panel of 7:1 or better;
  - banner markup;
  - silhouette markup, animation names and the reduced-motion rule;
  - every CSS colour being black, white, grey or one of the three accents.
- These tests use regular expressions on the CSS source, so they expect the current formatting: one rule per block, a two-space indent inside `@media`, and the closing `}` of a media block at column 0. Reformatting `styles.css` can break them without any change in behaviour.
- **By hand** (in the browser at 375 × 812 and on desktop): no horizontal scroll at 375 px; the sidebar starts hidden and closes on navigation; the photos, blur and readability; and the silhouettes, which look right when paused mid-animation. The checks used a browser's mobile emulation, not a real phone.

## Known limitations and open points

- The narrow-screen menu does not move keyboard focus into the sidebar when it opens, and does not trap focus. Escape closes it. Worth fixing for accessibility.
- The droids walk over the bottom of the screen and briefly cover whatever text is there. The footer has extra bottom padding, but text in the middle of the page can still be passed over for a moment.
- On desktop the panel covers most of the blurred photo, which shows mainly at the sides and around the panel.
- Some photos are older scans or modest in quality (Skellig Michael 1987, the NPS redwoods). Choices were limited by the PD/CC0 rule.
- Wikimedia Commons rate-limits bursts. `scripts/fetch-photos.mjs` waits between files and retries on 429 and 5xx, but it may still need a second run.
- The X-wing's bolt timing is set by percentages of the same 14 s cycle in two `@keyframes` blocks (`fly` and `fire`). Change both together.
- When the visitor asks for reduced motion, the silhouettes are hidden entirely rather than shown standing still.

## Where things are

```
index.html              page shell: top bar + menu button, #sidebar, #main, footer, .sky silhouettes
styles.css              palette, layout, sidebar, banner, backdrop, animations
js/app.js               rendering, routing, menu wiring, backdrop and banner
js/logic.js             pure logic, now including nextMenuState (R9)
js/icons.js             section icons (R10)
js/photos.js            photo per section with place, author, licence (R11, R12)
img/photos/*.jpg        bundled photos
CREDITS.md              photo sources
scripts/fetch-photos.mjs  re-downloads the photos (developer only)
tests/look.test.js      R9–R14 checks
docs/decisions/0002-…   PD/CC0 bundled photos
docs/decisions/0003-…   CSS-only SVG animations
```
