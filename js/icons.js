// R10: one Star Wars-themed menu icon per section. Original line drawings made
// for this project (no logos or official artwork). They draw in currentColor, so
// they follow the menu link's colour.

const svg = (body) =>
  `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

export const ICONS = {
  // The opening crawl: lines of text receding into the stars.
  films: svg(
    '<path d="M9.5 6h5M8 10h8M6.5 14h11M5 18h14M3.5 22h17"/>' +
    '<circle cx="3" cy="3" r=".9" fill="currentColor" stroke="none"/>' +
    '<circle cx="20" cy="5" r=".9" fill="currentColor" stroke="none"/>' +
    '<circle cx="14" cy="2" r=".7" fill="currentColor" stroke="none"/>',
  ),
  // A lightsaber: hilt, guard and blade.
  people: svg(
    '<path d="M10.5 13.5 21 3" stroke-width="2.2"/>' +
    '<path d="M3.5 20.5 8.5 15.5" stroke-width="3.4"/>' +
    '<path d="M7.5 12.5l4 4"/>',
  ),
  // A planet under twin suns.
  planets: svg(
    '<circle cx="9" cy="15" r="6.5"/>' +
    '<path d="M3 17.5c3 1 9 .5 12-2.5"/>' +
    '<circle cx="17.5" cy="4.5" r="2.3" fill="currentColor" stroke="none"/>' +
    '<circle cx="21.5" cy="8.5" r="1.5" fill="currentColor" stroke="none"/>',
  ),
  // An alien head with long ears.
  species: svg(
    '<ellipse cx="12" cy="13.5" rx="5" ry="6.5"/>' +
    '<path d="M7.2 11 1.5 7.5l5.3 6.5M16.8 11l5.7-3.5-5.3 6.5"/>' +
    '<circle cx="10" cy="12.5" r="1" fill="currentColor" stroke="none"/>' +
    '<circle cx="14" cy="12.5" r="1" fill="currentColor" stroke="none"/>' +
    '<path d="M10.5 17h3"/>',
  ),
  // A TIE-style fighter seen head-on: two flat wings and a round cockpit.
  starships: svg(
    '<path d="M3.5 3v18M20.5 3v18" stroke-width="2.4"/>' +
    '<path d="M3.5 12h5M15.5 12h5"/>' +
    '<circle cx="12" cy="12" r="3.5"/>' +
    '<circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/>',
  ),
  // A four-legged walker seen from the side.
  vehicles: svg(
    '<rect x="3" y="5" width="12" height="6.5" rx="1.5"/>' +
    '<path d="M15 8h2.5"/>' +
    '<rect x="17.5" y="6" width="4.5" height="4" rx="1"/>' +
    '<path d="M5 11.5v9.5M8 11.5l-1 9.5M11 11.5v9.5M13.5 11.5l1 9.5"/>' +
    '<path d="M3.8 21h2.4M6 21h2.4M9.8 21h2.4M13.3 21h2.4"/>',
  ),
  // R18: the Favorites menu item. A five-pointed star outline, with two small
  // stars beside it.
  favorites: svg(
    '<path d="M11 3.5l2.3 4.7 5.2.8-3.8 3.6.9 5.2L11 15.4l-4.6 2.4.9-5.2-3.8-3.6 5.2-.8z"/>' +
    '<circle cx="20.5" cy="18.5" r=".9" fill="currentColor" stroke="none"/>' +
    '<circle cx="18" cy="21.5" r=".7" fill="currentColor" stroke="none"/>',
  ),
  // R15 (round 5): the "Play intro" menu button. A play triangle in a circle,
  // with a few stars around it.
  intro: svg(
    '<circle cx="11" cy="13" r="8"/>' +
    '<path d="M9 9.5v7l5.5-3.5z" fill="currentColor"/>' +
    '<circle cx="20.5" cy="3.5" r=".9" fill="currentColor" stroke="none"/>' +
    '<circle cx="22" cy="7.5" r=".6" fill="currentColor" stroke="none"/>',
  ),
};
