# 0003 — Animate inline SVG silhouettes with CSS only

Status: accepted (round 2)

In the context of R13, which asks for an X-wing that flies across the screen and fires and for R2-D2 and C-3PO walking together, in a site with no dependencies or build step,
facing the options of CSS keyframes on inline SVG, a JavaScript loop (requestAnimationFrame or a canvas), and animated image files (GIF, APNG or video),
we decided for silhouettes drawn as inline SVG in `index.html` and animated only with CSS `@keyframes` on a fixed, clipped, click-through layer, switched off by `prefers-reduced-motion`,
and neglected a JavaScript animation loop (finer control, but more code in `app.js`, which should only render and route, and it keeps running on a hidden tab), a canvas (the shapes would not be stylable from the palette in `styles.css`), and GIF or video files (they could not use the R14 palette, would add weight and could not be tested by reading the source),
to achieve animations that cost no JavaScript, follow the site's colours, never block clicks or widen the page (R8), respect visitors who ask for less motion, and can be checked by the tests reading `index.html` and `styles.css`,
accepting that the timing (the laser bolts are keyed to the X-wing's path by percentages of the same 14 s cycle) must be changed in two places together, and that the tests check that the animation is wired up, not how it looks.
