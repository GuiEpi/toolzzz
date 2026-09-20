// Fourmilière : bâtiments, recherches et leurs coûts de base.
export const CONSTRUCTION = [
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
export const RECHERCHE = [
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
export const COUT_CONSTUCTION = [
  90, 600, 600, 600, 2000, 1400, 1400, 300, 800, 3500, 5000, 1500, 10000,
];
export const COUT_RECHERCHE_POM = [120, 200, 300, 100, 200, 4000, 3000, 3000, 100000, 40000000];
export const COUT_RECHERCHE_BOI = [120, 300, 200, 200, 500, 2500, 1000, 10000, 300000, 15000000];

export const EVOLUTION = [...CONSTRUCTION, ...RECHERCHE, "Nourriture", "Materiaux"];
export const LIEU = { TERRAIN: 0, DOME: 1, LOGE: 2 };
export const LIBELLE_LIEU = ["Terrain de Chasse", "fourmilière", "Loge Impériale"];
