# Star Wars Databank

## Problem

Star Wars fans who want to look up a fact, or follow a thread from one thing to the next ("who else is from this planet?", "which films is this ship in?"), usually end up on large wiki pages that are slow to scan. There is no small, fast page for browsing the core facts about films, characters, planets, species, starships and vehicles and hopping between related entries.

## Initial requirements

- R1: The site has six sections: films, characters, planets, species, starships and vehicles, and each section lists all of its entries.
- R2: The data is bundled with the site as JSON files; the site makes no requests to any external service when it runs.
- R3: Each entry in a section is shown as a card with the entry's name.
- R4: Typing in the search box filters the current section's cards by name, ignoring case.
- R5: Opening a card shows a detail view with every fact the data holds for that entry.
- R6: A detail view links to the entry's related entries in other sections, and following a link opens the correct entry.
- R7: If a JSON file is missing or cannot be parsed, the page shows a clear error message instead of a blank screen.
- R8: The page is usable at a width of 375 pixels with no horizontal scrolling.

### Out of scope

Films and series the dataset does not cover, images and official artwork, accounts or saved progress, and any backend.

## Round 2 requirements

- R9: The section menu is a full-height vertical bar on the left side of the screen, replacing the row of buttons at the top. On narrow screens (such as a 375-pixel phone) the bar is hidden when a page loads and is opened with a menu button, so R8 still holds.
- R10: Each item in the menu has a Star Wars-themed icon.
- R11: Pages have blurred Star Wars landscape photos as their background, and all text on top of them stays easy to read. The photos are freely licensed pictures of real filming locations.
- R12: Pages include images, so the site looks and feels like a fan page.
- R13: The site has simple silhouette animations: an X-wing that flies across the screen and fires, and R2-D2 and C-3PO walking together.
- R14: Black and white are the main colors of the site.
- Changed: "images" is no longer out of scope (see R11 and R12). Images are bundled with the site, so R2 still holds. Official artwork and film stills stay out of scope.
