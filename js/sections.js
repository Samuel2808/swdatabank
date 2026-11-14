// The six sections (R1) and how SWAPI fields map onto them.

export const SECTIONS = [
  { id: "films", label: "Films", file: "films.json", nameField: "title" },
  { id: "people", label: "Characters", file: "people.json", nameField: "name" },
  { id: "planets", label: "Planets", file: "planets.json", nameField: "name" },
  { id: "species", label: "Species", file: "species.json", nameField: "name" },
  { id: "starships", label: "Starships", file: "starships.json", nameField: "name" },
  { id: "vehicles", label: "Vehicles", file: "vehicles.json", nameField: "name" },
];

export const SECTION_IDS = SECTIONS.map((s) => s.id);

// Fields whose values are references to other entries (R6), and the section they point to.
export const REF_FIELDS = {
  homeworld: "planets",
  planets: "planets",
  films: "films",
  species: "species",
  starships: "starships",
  vehicles: "vehicles",
  people: "people",
  characters: "people",
  residents: "people",
  pilots: "people",
};

// SWAPI bookkeeping fields that are not facts about the entry (R5).
export const HIDDEN_FIELDS = new Set(["url", "created", "edited"]);

// R19: the fields each section can be filtered by. `kind` says how a record's
// value turns into options:
//   text — the value itself;
//   list — several values separated by commas (`split` adds more separators);
//   year — the year at the start of a date;
//   ref  — the names of the entries it refers to (R6), or "Not listed".
// R23: `same` lists groups of spellings of one value in the data; each group is
// one option, shown with its first spelling (the one most entries use). Nothing
// else is merged. `missing` renames the option of a ref field with no reference
// and gives the note shown under the filters ({count} is filled in).
export const FILTERS = {
  films: [
    { field: "release_date", label: "Release year", kind: "year" },
    { field: "director", label: "Director", kind: "text" },
  ],
  people: [
    { field: "gender", label: "Gender", kind: "text" },
    {
      field: "species", label: "Species", kind: "ref",
      missing: {
        label: "Unknown species",
        note: "the source data gives no species for {count} characters, many of them human, such as Luke Skywalker.",
      },
    },
    { field: "homeworld", label: "Homeworld", kind: "ref" },
  ],
  planets: [
    { field: "climate", label: "Climate", kind: "list" },
    {
      field: "terrain", label: "Terrain", kind: "list",
      same: [
        ["deserts", "desert"], ["jungles", "jungle"], ["mountains", "mountain"],
        ["oceans", "ocean"], ["swamps", "swamp"], ["savannas", "savanna", "savannahs"],
      ],
    },
  ],
  species: [
    { field: "classification", label: "Classification", kind: "text", same: [["mammal", "mammals"]] },
    { field: "language", label: "Language", kind: "text", same: [["Galactic Basic", "Galatic Basic"]] },
  ],
  starships: [
    { field: "starship_class", label: "Class", kind: "text" },
    {
      field: "manufacturer", label: "Manufacturer", kind: "list", split: "/",
      same: [
        ["Hoersch-Kessel Drive, Inc.", "Hoersch-Kessel Drive, Inc"],
        ["Nubia Star Drives", "Nubia Star Drives, Incorporated"],
      ],
    },
  ],
  vehicles: [
    { field: "vehicle_class", label: "Class", kind: "text", same: [["airspeeder", "air speeder"]] },
    { field: "manufacturer", label: "Manufacturer", kind: "list", split: "/" },
  ],
};
