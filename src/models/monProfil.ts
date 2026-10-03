/*
 * Profil du joueur connecté (instance de `Joueur`).
 *
 * Avant la migration WXT c'était la seule variable globale implicite du
 * projet (`monProfil = new Joueur(...)` dans content.js, lue par 29 fichiers).
 * Elle est posée une fois au démarrage (`setProfile`, dans le `main()` du
 * content script) et lue via `getProfile()` — jamais exportée directement,
 * un `let` exporté serait de nouveau un état global mutable.
 */
let profile = null;

export function getProfile() {
  return profile;
}

export function setProfile(joueur) {
  profile = joueur;
}
