// Unités : noms, temps de ponte, coûts et caractéristiques de combat (index = type d'unité).
export const UNIT_NAMES = [
  "Ouvrière",
  "Jeune Soldate Naine",
  "Soldate Naine",
  "Naine d’Elite",
  "Jeune Soldate",
  "Soldate",
  "Concierge",
  "Concierge d’élite",
  "Artilleuse",
  "Artilleuse d’élite",
  "Soldate d’élite",
  "Tank",
  "Tank d’élite",
  "Tueuse",
  "Tueuse d’élite",
];
export const UNIT_NAMES_PLURAL = [
  "Ouvrières",
  "Jeunes Soldates Naines",
  "Soldates Naines",
  "Naines d’Elites",
  "Jeunes Soldates",
  "Soldates",
  "Concierges",
  "Concierges d’élites",
  "Artilleuses",
  "Artilleuses d’élites",
  "Soldates d’élites",
  "Tanks",
  "Tanks d’élites",
  "Tueuses",
  "Tueuses d’élites",
];
export const UNIT_SHORT_NAMES = [
  "Ouvrière",
  "JSN",
  "SN",
  "NE",
  "JS",
  "S",
  "C",
  "CE",
  "A",
  "AE",
  "SE",
  "Tk",
  "TkE",
  "Tu",
  "TuE",
];
export const UNIT_TIME = [
  60, 300, 450, 570, 740, 1000, 1410, 1410, 1440, 1520, 1450, 1860, 1860, 2740, 2740,
];
export const UNIT_COST = [5, 16, 20, 26, 30, 36, 70, 100, 30, 34, 44, 100, 150, 80, 90];
export const UNIT_HP = [-1, 8, 10, 13, 16, 20, 30, 40, 10, 12, 27, 35, 50, 50, 55];
export const UNIT_ATTACK = [-1, 3, 5, 7, 10, 15, 1, 1, 30, 35, 24, 55, 80, 50, 55];
export const UNIT_DEFENSE = [-1, 2, 4, 6, 9, 14, 25, 35, 15, 18, 23, 1, 1, 50, 55];
export const FLOOD_METHODS = ["Standard", "Optimisée", "Uniforme", "Dégressive"];
