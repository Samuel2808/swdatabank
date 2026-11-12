# 0007 — Make the silhouettes rest with one long CSS cycle, not a JavaScript timer

Status: accepted (round 4)

In the context of R17, which asks that the X-wing and R2-D2 and C-3PO play once and then wait about 5 minutes before playing again, so they do not distract while reading, and of decision 0003, which keeps these animations in CSS only,
facing the options of stretching each animation to one shared 330 s cycle whose keyframes move only in the first ~30 s; keeping the short animations and having `app.js` add and remove a class on a `setTimeout` every 5 minutes; and `animation-delay` with a fixed number of repeats,
we decided for one 330 s `@keyframes` cycle for `fly`, `fire` and `walk`, with the X-wing's crossing in the first 1.3 %, the laser shots converted to the same seconds as before, and the droids' walk in the first 9.1 %, after which every silhouette holds its off-screen position to 100 %,
and neglected a JavaScript timer (precise and easy to change, but it puts animation logic back into `app.js`, which should only render and route, keeps running on a hidden tab, and would have to restart CSS animations by forcing a reflow) and `animation-delay` with repeats (CSS has no pause between iterations, so a delay only waits once, before the first play),
to achieve resting animations that still cost no JavaScript, start by themselves when the intro ends (the layers are shown then, which starts their animations), are not restarted by moving between pages, and can be checked by the tests reading `styles.css`,
accepting that the play time is written as percentages of 330 s, so changing the rest or the speed means recomputing the stops of three keyframes together (the comment above them gives the seconds), and that the droids' rocking and leg swings keep looping off screen while they rest, which costs little but is not free.
