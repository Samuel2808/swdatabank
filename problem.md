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

## Round 3 requirements

- R15: Every time the site is loaded, a full-screen intro plays before the main page:
  1. A black background with a field of stars in the style of the space backgrounds of the Star Wars films. The stars are drawn for this project (no images from the films).
  2. The title "Welcome to the Wiki of Star Wars" appears with a motion animation: it starts large and shrinks back into the stars.
  3. Then a short opening text scrolls up and away in perspective, in yellow, in the style of the opening of a Star Wars film. The text is original wording written for this site and introduces the wiki.
  4. A visible "Skip" button (and the Escape or Enter key) ends the intro at any time, and the intro ends by itself after the text, showing the main page.
  5. When the visitor's system asks for reduced motion, the title and text are shown without movement.
- R16: A search bar is always visible at the top of the page. Typing a word searches every section (films, characters, planets, species, starships, vehicles) by name or title, ignoring upper/lower case and accents, and shows the results grouped by section, each linking to its detail page. If nothing matches, it says so clearly. The matching rules are a pure function with their own tests.
- R9 (changed in round 3): The section menu is a full-height vertical bar on the left side of the screen. On every screen size the bar can be hidden and shown again with a clearly visible button, and when it is hidden the content uses the freed width. On wide screens the bar starts open; on narrow screens (below 768 pixels, such as a 375-pixel phone) it starts closed, so R8 still holds.
  - Before (round 2): "The section menu is a full-height vertical bar on the left side of the screen, replacing the row of buttons at the top. On narrow screens (such as a 375-pixel phone) the bar is hidden when a page loads and is opened with a menu button, so R8 still holds." On wide screens the bar was always visible and could not be hidden.
  - Why it changed: on wide screens the bar took 220 pixels that could not be given back to the content, and the menu worked differently on phones and computers. The owner asked for one button that hides and shows the bar on every screen. See decision 0004.
- R4 (changed in round 3): The section search box also ignores accents and punctuation, using the same matching rules as R16, so "padme" finds "Padmé Amidala" in both places.
  - Before (round 1): "Typing in the search box filters the current section's cards by name, ignoring case."
  - Why it changed: two search boxes with different rules would be confusing; the owner agreed to one set of rules.

## Round 4 requirements

- R8 (changed in round 4): The page is usable at a width of 375 pixels with no horizontal scrolling, and this is checked by automated tests: no part of the layout is wider than 375 pixels, and long names and words wrap instead of overflowing.
  - Before (round 1): "The page is usable at a width of 375 pixels with no horizontal scrolling."
  - Why it changed: R8 was only checked by hand, so no test named it. Now it can be checked every time the tests run.
- R17: The silhouette animations of R13 (the X-wing and R2-D2 and C-3PO) no longer play all the time. They play once, then wait about 5 minutes before playing again, so they do not distract while reading.
- R18: The user can mark any entry (a film, character, planet, species, starship or vehicle) as a favorite with a visible button on its page, and unmark it the same way. A "Favorites" section in the menu lists every favorite, grouped by section. Favorites are kept in the browser, so they are still there after closing or reloading the page.
- R19: Each section can be filtered by its own fields, not only by name, to make finding things easier. For example: characters by gender or species, planets by climate or terrain, starships and vehicles by class, films by release year. Filters can be combined with each other and with the name search, and can be cleared with one button.
