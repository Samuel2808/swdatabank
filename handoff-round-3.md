# Handoff — end of round 3

Read this with `problem.md`, `spec.md`, `CLAUDE.md` and `docs/decisions/` before starting round 4.

## State

- Round 3 is on branch `round-3-intro-search`, opened as a pull request against `main` and **not merged**: the owner reviews it first.
- `npm test`: 99 tests, all passing. Each test name starts with the requirement ID it checks. The test-first commits (`02328b9`, `2b94e25`, `79b5591`, `dd45acb`, `decb120`, `1f51a2d`) fail on purpose at those commits.
- Run: `python3 -m http.server 8000`, then open http://localhost:8000.

## What round 3 delivered

| Req | What was built | Where |
|-----|----------------|-------|
| R15 | Intro on every load: 260 drawn SVG stars (`starField`, seeded), the title shrinking into the stars (4.5 s), then the yellow opening text scrolling away in perspective (26 s, starts at 4 s), about 30 s in all. Skip button, Enter or Escape end it at any time; it ends by itself on the text's `animationend`. The page behind is `inert`. Reduced motion: still title and text, waits for Skip. | `index.html` (`#intro`), `styles.css`, `js/intro.js`, `js/logic.js` (`starField`, `introStartState`, `nextIntroState`, `introKeyEnds`), `js/app.js` |
| R16 | Sticky top bar with a site-wide search. Typing goes to `#/search/<text>`; results grouped by section in menu order, with icon and count; prompt when empty; clear "Nothing matches" message with a hint. Matching ignores case, accents and punctuation; every typed word must appear. | `js/logic.js` (`normalizeText`, `matchesQuery`, `searchAll`, `parseRoute`), `js/app.js` (`renderSearch`) |
| R9 (changed) | The top bar and its Menu / Hide menu button show at every width. Wide: starts open, pushes the content, only the button changes it. Narrow: starts closed, overlay with scrim, as before. Resets when the window crosses 768 px. Content panel may grow to 1400 px. | `styles.css`, `js/logic.js` (`nextMenuState(open, action, wide)`, `menuStartsOpen`), decision 0004 |
| R4 (changed) | The section filter uses the R16 matching rules (accents, punctuation). | `js/logic.js` (`searchEntries`) |

## UX and UI fixes (listed one by one in `spec.md`, U1–U9)

- U1: the narrow menu moves focus in, keeps Tab inside and returns focus to the button (`nextFocusIndex`). This also needed the sidebar to become visible at once when it opens.
- U2: the droids walk on a ground strip at the bottom and never cross text.
- U3: a "Skip to content" button for keyboard users.
- U4: focus moves to the new heading after navigation.
- U5: every view sets the tab title (`titleFor`), including not found.
- U6: "Showing 3 of 82 characters" / "No characters match “x”." (`countText`).
- U7: the section box is worded as a filter.
- U8: the footer links `CREDITS.md`.
- U9: the menu button has a visible text label.
- U10: long facts (a film's opening crawl) are joined into full-width paragraphs (`paragraphsOf`).
- U11: text grows with the screen, 16 px on phones to 20 px on large screens (all sizes in rem).
- U12: facts are a grid of label/value boxes that fills the panel.
- Also: the intro text is left-aligned and smaller on phones, and on large screens its column and font grow with the screen.
- U10–U12 and the larger intro came from the owner's review in the same session ("the texts look very cramped, too much space, badly arranged").

## Answers the owner gave at the start of round 3

The owner replied "continue" to the 31 numbered questions, which was taken to mean that all the suggested defaults were accepted. In short: intro on every load including deep links, drawn stars, about 30 s, no sound, reduced motion waits for Skip, only the button and Enter/Escape skip, silhouettes hidden during the intro, the brand stays "Databank"; search bar sticky in one top bar, R4 box kept, results on their own route, every word must match, punctuation ignored, from one letter, R4 changed to match; sidebar state not remembered, push on wide and overlay on narrow, one labelled button, wide only closes by the button, reset on crossing 768 px; fixes within the current look, droids on a reserved strip, focus trap, no new photos; UX tests named after the requirement they improve; branch `round-3-intro-search`; `problem.md` and a handoff updated; CSS formatting kept for the regex tests.

## Known limitations and open points

- The X-wing still flies over the page for about 4 s every 14 s and can pass over text (the owner only asked about the droids).
- The intro plays on every load, as R15 asks, so it adds about 30 s for visitors who do not skip it.
- With reduced motion the R13 silhouettes are still hidden entirely rather than shown standing still.
- Reduced motion and the look of the intro are checked by hand: in the browser, the reduced-motion CSS was applied by hand to check the still layout, because the test browser could not emulate the setting.
- The tests still read `styles.css` with regular expressions; keep one rule per block, a two-space indent inside `@media`, and the closing `}` of a media block at column 0.
- Commit `39f2bc1` (U5) also added `countText`, which belongs to U6 (`87968fc`); it was noticed after committing and, since commits are never amended, is noted in the U6 commit message.
- The search view always uses the Films photo.
