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
