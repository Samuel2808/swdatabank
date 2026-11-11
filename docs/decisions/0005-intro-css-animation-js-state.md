# 0005 — Play the intro with CSS animations, drawn stars and a small JS state machine

Status: accepted (round 3)

In the context of R15, a full-screen intro on every load (a star field, a title that shrinks into the stars, and a yellow opening text that scrolls away in perspective) that can be skipped with a button, Enter or Escape, ends by itself, and stands still for reduced motion, in a site with no dependencies, no build step and no requests to other hosts (R2),
facing the choice between a NASA public-domain space photo and stars drawn for the project; between CSS keyframes, a canvas animation loop and a video; and between a fixed timer and the animation's own end to close the intro,
we decided for stars drawn as SVG circles from a seeded, tested pure function (`starField`), the title and text moved only by CSS `@keyframes` (consistent with decision 0003), the intro layer written into `index.html` so the page never flashes first, the intro closed by the crawl's `animationend` event or by Skip/Enter/Escape, and the rules in the pure function `nextIntroState(state, event)`,
and neglected a NASA photo (more weight in the repository and a licence entry for a picture that a few hundred dots imitate well), a canvas loop (more JavaScript in `app.js`, harder to test, and it would not follow `prefers-reduced-motion` through CSS alone), a video (heavy, not stylable, cannot use the R14 palette), and a fixed `setTimeout` (it could drift from the CSS timing; listening for the end of the animation keeps the two in one place),
to achieve an intro that costs no downloads, keeps its timing in `styles.css` only, can be skipped from the first moment, and whose rules are covered by unit tests,
accepting that the intro plays on every load (as R15 asks) and so adds up to 30 s for visitors who do not skip it, that with reduced motion it waits for the visitor instead of closing itself, and that how it looks is checked by hand, not by tests.
