/*
 * menuRapide.js
 *
 * Liste des entrées du « menu rapide » Compte+ (configurable via compte.php),
 * répliquée pour les non-C+ : `PageCompte` capture les checkboxes côté form,
 * `BoiteComptePlus` rend les <a> raccourcis dans la boîte flottante en bas.
 *
 * Section "Compte+" volontairement omise — les fonctions concernées
 * (simulateurs, bloc note, etc.) ne sont accessibles qu'aux Compte+.
 *
 * Les URLs marquées /* TODO */ /*sont mes meilleures hypothèses ; à corriger
 * après vérification sur un compte C+ qui a tout coché.
 **********************************************************************/

const MENU_RAPIDE = [
  // Fourmilière (URLs sûres : utilisées dans le menuFourmiliere natif).
  { name: "menuRapideReine", label: "Reine", url: "Reine.php" },
  { name: "menuRapideRessources", label: "Ressources", url: "Ressources.php" },
  { name: "menuRapideConstruction", label: "Construction", url: "construction.php" },
  { name: "menuRapideLaboratoire", label: "Laboratoire", url: "laboratoire.php" },
  { name: "menuRapideArmee", label: "Armée", url: "Armee.php" },
  { name: "menuRapideEnnemies", label: "Ennemies", url: "ennemie.php" },
  { name: "menuRapideColonies", label: "Colonies", url: "colonies.php" },
  { name: "menuRapideCarte", label: "Carte", url: "carte2.php" },
  { name: "menuRapideCommerce", label: "Convois", url: "commerce.php" },
  { name: "menuRapideMessagerie", label: "Messagerie", url: "messagerie.php" },
  { name: "menuRapideMaFourmiliere", label: "Ma Fourmilière", url: "Fourmiliere.php" /* TODO */ },
  // Alliance.
  { name: "menuRapideChatAlliance", label: "Chat (alliance)", url: "alliance.php" },
  {
    name: "menuRapideForumExterne",
    label: "Forum Externe",
    url: "forum_externe.php" /* TODO */,
  },
  { name: "menuRapideForumAlliance", label: "Forum", url: "alliance.php?forum_menu" },
  { name: "menuRapideMembres", label: "Membres", url: "alliance.php?Membres" },
  {
    name: "menuRapideCandidatures",
    label: "Candidatures",
    url: "alliance.php?Candidatures" /* TODO */,
  },
  {
    name: "menuRapideMessageCollectif",
    label: "Message Collectif",
    url: "alliance.php?Messages" /* TODO */,
  },
  {
    name: "menuRapideDiplomatie",
    label: "Diplomatie",
    url: "alliance.php?Diplomatie" /* TODO */,
  },
  { name: "menuRapideDescription", label: "Description", url: "alliance.php?Description" },
  { name: "menuRapideOptions", label: "Options", url: "alliance.php?Options" /* TODO */ },
  // Communauté.
  { name: "menuRapideChat", label: "Chat", url: "chat.php" },
  { name: "menuRapideEchange", label: "Échange", url: "echange.php" /* TODO */ },
  { name: "menuRapidePropositions", label: "Propositions", url: "propositions.php" /* TODO */ },
  {
    name: "menuRapideClassementJoueurs",
    label: "Classement Joueurs",
    url: "classementJoueur.php" /* TODO */,
  },
  {
    name: "menuRapideClassementAlliances",
    label: "Classement Alliances",
    url: "classementAlliance.php",
  },
  { name: "menuRapideMonProfil", label: "Mon Profil", url: "monprofil.php" /* TODO */ },
  { name: "menuRapideMonCompte", label: "Mon Compte", url: "compte.php" },
  { name: "menuRapideParrainage", label: "Parrainage", url: "parrainage.php" /* TODO */ },
  { name: "menuRapideInviterAmis", label: "Inviter mes Amis", url: "invitation.php" /* TODO */ },
  { name: "menuRapideForum", label: "Forum (communauté)", url: "forum.php" /* TODO */ },
];

const MENU_RAPIDE_KEY = "outiiil_menuRapide";
