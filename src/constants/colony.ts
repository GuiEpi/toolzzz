// Fourmilière : bâtiments, recherches et leurs coûts de base.
export const BUILDINGS = [
  "Champignonnière",
  "Entrepôt de Nourriture",
  "Entrepôt de Matériaux",
  "Couveuse",
  "Solarium",
  "Laboratoire",
  "Salle d'analyse",
  "Salle de combat",
  "Caserne",
  "Dôme",
  "Loge Impériale",
  "Etable à pucerons",
  "Etable à cochenilles",
];
export const RESEARCHES = [
  "Technique de ponte",
  "Bouclier Thoracique",
  "Armes",
  "Architecture",
  "Communication avec les animaux",
  "Vitesse de chasse",
  "Vitesse d'attaque",
  "Génétique",
  "Acide",
  "Poison",
];
export const BUILDING_COSTS = [
  90, 600, 600, 600, 2000, 1400, 1400, 300, 800, 3500, 5000, 1500, 10000,
];
export const RESEARCH_FOOD_COST = [120, 200, 300, 100, 200, 4000, 3000, 3000, 100000, 40000000];
export const RESEARCH_MATERIALS_COST = [
  120, 300, 200, 200, 500, 2500, 1000, 10000, 300000, 15000000,
];

export const UPGRADES = [...BUILDINGS, ...RESEARCHES, "Nourriture", "Materiaux"];
export const PLACE = { TERRAIN: 0, DOME: 1, LOGE: 2 };
export const PLACE_LABELS = ["Terrain de Chasse", "fourmilière", "Loge Impériale"];
