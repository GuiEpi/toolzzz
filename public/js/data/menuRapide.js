/*
 * menuRapide.js
 *
 * Liste des entrées du « menu rapide » Compte+ (configurable via compte.php),
 * répliquée pour les non-C+ : `PageCompte` capture les checkboxes côté form
 * (ou injecte sa propre copie pour les non-C+ qui n'ont pas le natif),
 * `BoiteComptePlus` rend les <a> raccourcis dans la boîte flottante en bas.
 *
 * Section "Compte+" volontairement omise — les fonctions concernées
 * (simulateurs, bloc note, etc.) ne sont accessibles qu'aux Compte+.
 *
 * Les URLs marquées /* TODO *\/ sont mes meilleures hypothèses ; à corriger
 * après vérification sur un compte C+ qui a tout coché.
 **********************************************************************/

const MENU_RAPIDE = [
  // Fourmilière (URLs sûres : utilisées dans le menuFourmiliere natif).
  { section: "Fourmilière", name: "menuRapideReine", label: "Reine", url: "Reine.php" },
  {
    section: "Fourmilière",
    name: "menuRapideRessources",
    label: "Ressources",
    url: "Ressources.php",
  },
  {
    section: "Fourmilière",
    name: "menuRapideConstruction",
    label: "Construction",
    url: "construction.php",
  },
  {
    section: "Fourmilière",
    name: "menuRapideLaboratoire",
    label: "Laboratoire",
    url: "laboratoire.php",
  },
  { section: "Fourmilière", name: "menuRapideArmee", label: "Armée", url: "Armee.php" },
  { section: "Fourmilière", name: "menuRapideEnnemies", label: "Ennemies", url: "ennemie.php" },
  { section: "Fourmilière", name: "menuRapideColonies", label: "Colonies", url: "colonies.php" },
  { section: "Fourmilière", name: "menuRapideCarte", label: "Carte", url: "carte2.php" },
  { section: "Fourmilière", name: "menuRapideCommerce", label: "Convois", url: "commerce.php" },
  {
    section: "Fourmilière",
    name: "menuRapideMessagerie",
    label: "Messagerie",
    url: "messagerie.php",
  },
  {
    section: "Fourmilière",
    name: "menuRapideMaFourmiliere",
    label: "Ma Fourmilière",
    url: "Fourmiliere.php" /* TODO */,
  },
  // Alliance.
  {
    section: "Alliance",
    name: "menuRapideChatAlliance",
    label: "Chat (alliance)",
    url: "alliance.php",
  },
  {
    section: "Alliance",
    name: "menuRapideForumExterne",
    label: "Forum Externe",
    url: "forum_externe.php" /* TODO */,
  },
  {
    section: "Alliance",
    name: "menuRapideForumAlliance",
    label: "Forum",
    url: "alliance.php?forum_menu",
  },
  { section: "Alliance", name: "menuRapideMembres", label: "Membres", url: "alliance.php?Membres" },
  {
    section: "Alliance",
    name: "menuRapideCandidatures",
    label: "Candidatures",
    url: "alliance.php?Candidatures" /* TODO */,
  },
  {
    section: "Alliance",
    name: "menuRapideMessageCollectif",
    label: "Message Collectif",
    url: "alliance.php?Messages" /* TODO */,
  },
  {
    section: "Alliance",
    name: "menuRapideDiplomatie",
    label: "Diplomatie",
    url: "alliance.php?Diplomatie" /* TODO */,
  },
  {
    section: "Alliance",
    name: "menuRapideDescription",
    label: "Description",
    url: "alliance.php?Description",
  },
  {
    section: "Alliance",
    name: "menuRapideOptions",
    label: "Options",
    url: "alliance.php?Options" /* TODO */,
  },
  // Communauté.
  { section: "Communauté", name: "menuRapideChat", label: "Chat", url: "chat.php" },
  {
    section: "Communauté",
    name: "menuRapideEchange",
    label: "Échange",
    url: "echange.php" /* TODO */,
  },
  {
    section: "Communauté",
    name: "menuRapidePropositions",
    label: "Propositions",
    url: "propositions.php" /* TODO */,
  },
  {
    section: "Communauté",
    name: "menuRapideClassementJoueurs",
    label: "Classement Joueurs",
    url: "classementJoueur.php" /* TODO */,
  },
  {
    section: "Communauté",
    name: "menuRapideClassementAlliances",
    label: "Classement Alliances",
    url: "classementAlliance.php",
  },
  {
    section: "Communauté",
    name: "menuRapideMonProfil",
    label: "Mon Profil",
    url: "monprofil.php" /* TODO */,
  },
  {
    section: "Communauté",
    name: "menuRapideMonCompte",
    label: "Mon Compte",
    url: "compte.php",
  },
  {
    section: "Communauté",
    name: "menuRapideParrainage",
    label: "Parrainage",
    url: "parrainage.php" /* TODO */,
  },
  {
    section: "Communauté",
    name: "menuRapideInviterAmis",
    label: "Inviter mes Amis",
    url: "invitation.php" /* TODO */,
  },
  {
    section: "Communauté",
    name: "menuRapideForum",
    label: "Forum (communauté)",
    url: "forum.php" /* TODO */,
  },
];

const MENU_RAPIDE_KEY = "outiiil_menuRapide";
