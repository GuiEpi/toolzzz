/*
 * quickMenu.ts
 *
 * The entries of the ComptePlus "menu rapide" (configured on compte.php),
 * replicated for free accounts: `AccountPage` captures the checkboxes on the
 * form (or injects its own copy for free accounts, which do not get the game's
 * one) and `ComptePlusBox` renders the shortcut <a> elements in the floating box
 * at the bottom.
 *
 * The "Compte+" section is deliberately left out — the features it points at
 * (simulators, notepad, …) are only reachable with a ComptePlus account.
 *
 * URLs and labels match the game's own ComptePlus rendering (extracted from a
 * ComptePlus box with every option ticked). A few URLs are odd in the game's
 * HTML (`invitation.php.php`, `.php` suffixes after `?`) and are kept exactly as
 * they are, since the Fourmizzz router accepts them.
 **********************************************************************/

export const QUICK_MENU = [
  // Colony.
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
  { section: "Fourmilière", name: "menuRapideCommerce", label: "Commerce", url: "commerce.php" },
  {
    section: "Fourmilière",
    name: "menuRapideMessagerie",
    label: "Messagerie",
    url: "messagerie.php",
  },
  {
    section: "Fourmilière",
    name: "menuRapideMaFourmiliere",
    label: "Vue",
    url: "fourmiliere.php",
  },
  // Alliance.
  { section: "Alliance", name: "menuRapideChatAlliance", label: "CA", url: "alliance.php" },
  {
    section: "Alliance",
    name: "menuRapideForumExterne",
    label: "Forum Externe",
    url: "http://fourmizzz.cforum.info/index.php",
    target: "_blank",
  },
  {
    section: "Alliance",
    name: "menuRapideForumAlliance",
    label: "Forum Alliance",
    url: "alliance.php?forum_menu",
  },
  { section: "Alliance", name: "menuRapideMembres", label: "Membres", url: "alliance.php?Membres" },
  {
    section: "Alliance",
    name: "menuRapideCandidatures",
    label: "Candidatures",
    url: "alliance.php?voirCandidature",
  },
  {
    section: "Alliance",
    name: "menuRapideMessageCollectif",
    label: "Message Collectif",
    url: "alliance.php?messCollectif.php",
  },
  {
    section: "Alliance",
    name: "menuRapideDiplomatie",
    label: "Diplomatie",
    url: "alliance.php?Diplomatie.php",
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
    url: "alliance.php?Options",
  },
  // Community.
  { section: "Communauté", name: "menuRapideChat", label: "Chat", url: "chat.php" },
  { section: "Communauté", name: "menuRapideEchange", label: "Echange", url: "echange.php" },
  {
    section: "Communauté",
    name: "menuRapidePropositions",
    label: "Propositions",
    url: "propositions.php",
  },
  {
    section: "Communauté",
    name: "menuRapideClassementJoueurs",
    label: "Classement Joueurs",
    url: "classement2.php",
  },
  {
    section: "Communauté",
    name: "menuRapideClassementAlliances",
    label: "Classement Alliances",
    url: "classement2.php?type_classement=alliance_total",
  },
  { section: "Communauté", name: "menuRapideMonProfil", label: "Mon Profil", url: "Membre.php" },
  { section: "Communauté", name: "menuRapideMonCompte", label: "Mon Compte", url: "compte.php" },
  {
    section: "Communauté",
    name: "menuRapideParrainage",
    label: "Parrainage",
    url: "FourmilieresFilles.php",
  },
  {
    section: "Communauté",
    name: "menuRapideInviterAmis",
    label: "Inviter mes Amis",
    // typo in the game's own markup, kept as is so it matches.
    url: "invitation.php.php",
  },
  {
    section: "Communauté",
    name: "menuRapideForum",
    label: "Forum",
    url: "http://fourmizzz.cforum.info/index.php",
    target: "_blank",
  },
];

export const QUICK_MENU_KEY = "outiiil_menuRapide";
