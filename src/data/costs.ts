/*
 * costs.ts
 *
 * Costs, times and effects of the Fourmizzz buildings and researches.
 *
 * Formula-based: only the **level 1** values are stored and every other level
 * is derived through constant geometric ratios — checked on s1/s2/s3/test (the
 * balance is identical on every server).
 *
 * Bonus utilisateur :
 * - Architecture (labo3) niveau N → temps construction × 0.9^N
 * - Salle d'analyse (cons8) niveau N → temps recherche × 0.9^N
 * - No bonus affects the cost (checked against toolzzz.fr/couts.php).
 *
 * Source : extraction depuis https://www.toolzzz.fr/couts.php — 2026-05-07.
 **********************************************************************/

const COSTS_RATIO_BUILDING_TIME = 1.6;
const COSTS_RATIO_RESEARCH_TIME = 1.7;
const COSTS_RATIO_COST = 2.0;
const COSTS_RATIO_MUSHROOM_PRODUCTION = 1.7;
const COSTS_RATIO_BONUS = 0.9;

/**
 * Buildings. `id` is the Fourmizzz key (consN).
 * - `t` : temps niveau 1 (s)
 * - `m`: materials cost at level 1
 * - `max` : niveau max accessible
 * - `prod`: production at level 1 (mushroom farm only)
 * - `mR`: custom materials cost ratio (the mushroom farm uses 1.85, not 2.0)
 */
export const COSTS_BUILDINGS = {
  cons5: { nom: "Champignonnière", t: 120, m: 90, max: 50, prod: 122, mR: 1.85 },
  cons3: { nom: "Entrepôt de Nourriture", t: 180, m: 600, max: 50 },
  cons4: { nom: "Entrepôt de Matériaux", t: 180, m: 600, max: 50 },
  cons2: { nom: "Couveuse", t: 180, m: 600, max: 50 },
  cons7: { nom: "Solarium", t: 1000, m: 2000, max: 50 },
  cons6: { nom: "Laboratoire", t: 300, m: 1400, max: 50 },
  cons8: { nom: "Salle d'analyse", t: 300, m: 1400, max: 50 },
  cons9: { nom: "Salle de combat", t: 120, m: 300, max: 50 },
  cons10: { nom: "Caserne", t: 200, m: 800, max: 50 },
  cons11: { nom: "Dôme", t: 400, m: 3500, max: 50 },
  cons12: { nom: "Loge Impériale", t: 500, m: 5000, max: 50 },
  cons0: { nom: "Étable à pucerons", t: 500, m: 1500, max: 50 },
  cons1: { nom: "Étable à cochenilles", t: 150, m: 10000, max: 36 },
};

/**
 * Researches. `id` is the Fourmizzz key (laboN).
 * - `t` : temps niveau 1 (s)
 * - `o`: workers cost at level 1 (absent for researches with no cost in
 *        fourmis — TDP, Architecture, Vitesse d'attaque)
 * - `p` : coût pommes niveau 1
 * - `m`: materials cost at level 1
 * - `max` : niveau max
 */
export const COSTS_RESEARCHES = {
  labo0: { nom: "Technique de ponte", t: 120, p: 120, m: 120, max: 50 },
  labo1: { nom: "Bouclier Thoracique", t: 120, o: 80, p: 200, m: 300, max: 50 },
  labo2: { nom: "Armes", t: 120, o: 80, p: 300, m: 200, max: 50 },
  labo3: { nom: "Architecture", t: 200, p: 100, m: 200, max: 50 },
  labo4: { nom: "Communication avec les animaux", t: 120, o: 80, p: 200, m: 500, max: 50 },
  labo5: { nom: "Vitesse de chasse", t: 200, o: 50, p: 4000, m: 2500, max: 50 },
  labo6: { nom: "Vitesse d'attaque", t: 200, p: 3000, m: 1000, max: 50 },
  labo7: { nom: "Génétique", t: 180, o: 1000, p: 3000, m: 10000, max: 50 },
  labo8: { nom: "Acide", t: 2800, o: 5000, p: 100000, m: 300000, max: 30 },
  labo9: { nom: "Poison", t: 3200, o: 250000, p: 40000000, m: 15000000, max: 20 },
};

/**
 * Computes the build time (s) for a level, optionally applying the
 * Architecture bonus.
 */
export function buildingTime(item, level, archi = 0) {
  let base = item.t * Math.pow(COSTS_RATIO_BUILDING_TIME, level - 1);
  return Math.round(base * Math.pow(COSTS_RATIO_BONUS, archi));
}

/** Research time (s), with the Salle d'analyse bonus applied when given. */
export function researchTime(item, level, sa = 0) {
  let base = item.t * Math.pow(COSTS_RATIO_RESEARCH_TIME, level - 1);
  return Math.round(base * Math.pow(COSTS_RATIO_BONUS, sa));
}

/** Materials cost per level. Default ratio 2.0, overridden for the mushroom farm. */
export function materialsCost(item, level) {
  let ratio = item.mR || COSTS_RATIO_COST;
  return Math.round(item.m * Math.pow(ratio, level - 1));
}

/** Coût pommes (recherches uniquement). */
export function foodCost(item, level) {
  return Math.round(item.p * Math.pow(COSTS_RATIO_COST, level - 1));
}

/** Workers cost, for the researches that need some. Returns 0 when there is none. */
export function workersCost(item, level) {
  if (!item.o) return 0;
  return Math.round(item.o * Math.pow(COSTS_RATIO_COST, level - 1));
}

/** Warehouse capacity at level N (same formula for food and materials). */
export function warehouseCapacity(level) {
  return 500 + 1200 * Math.pow(2, level);
}

/** Mushroom farm production at level N (food per day). */
export function mushroomProduction(item, level) {
  return Math.round(item.prod * Math.pow(COSTS_RATIO_MUSHROOM_PRODUCTION, level - 1));
}
