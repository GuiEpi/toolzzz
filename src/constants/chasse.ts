// Chasse : ratios, pertes, ordres d'engagement et faune.
export const RATIO_CHASSE = [1, 2, 3, 4, 5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 10];
export const PERTE_MIN_CHASSE = [
  0.103971824, 0.066805442, 0.036854146, 0.014477073, 0.010067247, 0.008361713, 0.00751662,
  0.007060666, 0.006692853, 0.006402339, 0.006090569, 0.0057788, 0.005080623,
];
export const PERTE_MOY_CHASSE = [
  0.14183641, 0.089382202, 0.065595625, 0.037509208, 0.024982573, 0.018532185, 0.014281932,
  0.011725921, 0.010437083, 0.009834768, 0.009339662, 0.008844556, 0.008502895,
];
export const PERTE_MAX_CHASSE = [
  0.33333334, 0.176739357, 0.113191158, 0.08245817, 0.051342954, 0.036955988, 0.03395735,
  0.032083615, 0.026461955, 0.024588162, 0.021774264, 0.018960366, 0.017190797,
];
export const ORDRE_UNITE_CHASSE = [10, 3, 4, 1, 12, 7, 5, 13, 11, 9, 8, 6, 2];
export const ORDRE_XP_CHASSE = [10, 3, 4, 1, 12, 7, 5];
// Faune (cibles de chasse) — stats par espèce, source : http://alliancead2.free.fr/Bestiaire.html (2017).
// `slug` = nom de fichier image dans public/images/faune/, `fdf` = force de frappe (= attaque),
// `vie` = points de vie, `diff` = points de difficulté (cumul utilisé par le serveur pour
// composer la rencontre lors d'une chasse).
export const FAUNE = [
  { nom: "Petite araignée", slug: "petite_araignee", fdf: 13, vie: 50, diff: 23.2 },
  { nom: "Araignée", slug: "araignee", fdf: 19, vie: 75, diff: 34.3 },
  { nom: "Chenille", slug: "chenille", fdf: 30, vie: 100, diff: 49.8 },
  { nom: "Criquet", slug: "criquet", fdf: 42, vie: 100, diff: 58.9 },
  { nom: "Guèpe", slug: "guepe", fdf: 50, vie: 140, diff: 76.05 },
  { nom: "Cigale", slug: "cigale", fdf: 70, vie: 200, diff: 107.55 },
  { nom: "Abeille", slug: "abeille", fdf: 115, vie: 220, diff: 144.6 },
  { nom: "Dionée", slug: "dionee", fdf: 70, vie: 700, diff: 201.25 },
  { nom: "Hanneton", slug: "hanneton", fdf: 140, vie: 450, diff: 228.2 },
  { nom: "Scarabée", slug: "scarabee", fdf: 230, vie: 1000, diff: 436 },
  { nom: "Mante religieuse", slug: "mante_religieuse", fdf: 1200, vie: 800, diff: 890.7 },
  { nom: "Lézard", slug: "lezard", fdf: 700, vie: 5000, diff: 1700.75 },
  { nom: "Souris", slug: "souris", fdf: 1400, vie: 5000, diff: 2405.25 },
  { nom: "Mulot", slug: "mulot", fdf: 3000, vie: 8000, diff: 4453.6 },
  { nom: "Alouette", slug: "alouette", fdf: 10000, vie: 30000, diff: 15745.9 },
  { nom: "Rat", slug: "rat", fdf: 50000, vie: 100000, diff: 64282.5 },
  { nom: "Tamanoir", slug: "tamanoir", fdf: 1000000, vie: 5000000, diff: 2032789 },
];
export const REPLIQUE_CHASSE = [
  0, 0, 0, 0.016, 0.093, 0.345, 0.577777778, 0.753, 0.837, 0.874, 0.937, 0.96, 0.989,
];
// Image chat, messagerie de fourmizzz
