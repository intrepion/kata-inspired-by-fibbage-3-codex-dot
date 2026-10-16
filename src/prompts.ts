export interface Prompt {
  id: string;
  category: string;
  text: string;
  answers: string[];
  aliases: string[][];
  decoys: string[][];
  source: string;
  note: string;
}
const venus = "https://science.nasa.gov/venus/venus-facts/";
const sea =
  "https://ocean.si.edu/ocean-life/invertebrates/octopuses-squids-and-relatives";
export const prompts: Prompt[] = [
  {
    id: "zoozve",
    category: "A celestial typo",
    text: "A poster artist misread his handwritten “2002 VE” on a children’s space poster. The resulting name, officially approved in 2024, was ____.",
    answers: ["Zoozve"],
    aliases: [[]],
    decoys: [
      [
        "Zovvia",
        "Vezora",
        "Twove",
        "Veezee",
        "Zezvo",
        "Zovve",
        "Vezu",
        "Zoova",
      ],
    ],
    source: venus,
    note: "NASA explains that the name Zoozve came from a misreading of handwritten 2002 VE.",
  },
  {
    id: "pancake",
    category: "Breakfast on Venus",
    text: "NASA describes broad, flat-topped Venusian volcanic features with a breakfast name: ____ domes.",
    answers: ["pancake"],
    aliases: [["pancakes"]],
    decoys: [
      [
        "waffle",
        "crumpet",
        "biscuit",
        "omelet",
        "muffin",
        "bagel",
        "toast",
        "porridge",
      ],
    ],
    source: venus,
    note: "NASA describes pancake domes as volcanic features with flat tops and steep sides.",
  },
  {
    id: "tick",
    category: "A planet with bugs",
    text: "Venusian volcanoes with radiating spurs have been nicknamed ____ domes after a blood-feeding creature.",
    answers: ["tick"],
    aliases: [["ticks"]],
    decoys: [
      [
        "mosquito",
        "flea",
        "leech",
        "bedbug",
        "mite",
        "gnat",
        "vampire bat",
        "horsefly",
      ],
    ],
    source: venus,
    note: "NASA calls these radiating volcanic structures tick domes.",
  },
  {
    id: "west",
    category: "Backward sunrise",
    text: "On the surface of Venus, the Sun would rise in the ____ because the planet rotates backward.",
    answers: ["west"],
    aliases: [["the west", "western sky"]],
    decoys: [
      [
        "east",
        "north",
        "south",
        "northeast",
        "southeast",
        "northwest",
        "southwest",
        "zenith",
      ],
    ],
    source: venus,
    note: "NASA explains that retrograde rotation makes the Sun rise in the west on Venus.",
  },
  {
    id: "snow",
    category: "Dinner in the dark",
    text: "The vampire squid feeds on drifting organic particles known as marine ____.",
    answers: ["snow"],
    aliases: [["marine snow"]],
    decoys: [
      ["dust", "confetti", "smoke", "ash", "pollen", "sand", "fog", "flour"],
    ],
    source: sea,
    note: "Smithsonian Ocean describes vampire squid feeding on marine snow.",
  },
  {
    id: "brain",
    category: "An awkward dinner route",
    text: "A cephalopod needs its food broken into small pieces: its esophagus passes through its ____.",
    answers: ["brain"],
    aliases: [["the brain"]],
    decoys: [
      ["heart", "eye", "liver", "gill", "kidney", "beak", "ink sac", "stomach"],
    ],
    source: sea,
    note: "Smithsonian explains that a cephalopod esophagus passes through its brain.",
  },
  {
    id: "copper",
    category: "Heavy metal bloodstream",
    text: "The oxygen-carrying molecule hemocyanin in cephalopod blood uses the metal ____.",
    answers: ["copper"],
    aliases: [["Cu"]],
    decoys: [
      ["iron", "silver", "gold", "zinc", "tin", "nickel", "cobalt", "lead"],
    ],
    source: sea,
    note: "Smithsonian describes copper-based hemocyanin in cephalopod circulation.",
  },
  {
    id: "bamboo",
    category: "The ancient kitchen drawer",
    text: "A historical account cited by Smithsonian says Roman cooks used ____ knives for octopus, claiming iron left a taste.",
    answers: ["bamboo"],
    aliases: [["bamboo wood"]],
    decoys: [
      [
        "ivory",
        "obsidian",
        "bone",
        "glass",
        "flint",
        "bronze",
        "cedar",
        "shell",
      ],
    ],
    source: sea,
    note: "Smithsonian recounts the use of bamboo knives and the cooks’ claim about iron; this is an attributed historical account.",
  },
  {
    id: "final",
    category: "The Double Take",
    text: "An octopus has ____ hearts, and its oxygenated blood is ____.",
    answers: ["three", "blue"],
    aliases: [["3"], ["blue blood"]],
    decoys: [
      ["two", "four", "five", "six", "seven", "eight", "one", "nine"],
      ["green", "red", "purple", "yellow", "orange", "pink", "white", "black"],
    ],
    source: sea,
    note: "Smithsonian describes two branchial hearts and one systemic heart, plus blue copper-based oxygenated blood.",
  },
];
