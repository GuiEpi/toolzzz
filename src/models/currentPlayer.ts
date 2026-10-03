/*
 * The signed-in player's profile (a `Player` instance).
 *
 * Before the WXT migration this was the project's only implicit global
 * (`monProfil = new Joueur(...)` in content.js, read by 29 files). It is set
 * once at start-up (`setProfile`, from the content script's `main()`) and read
 * through `getProfile()` — never exported directly, since an exported `let`
 * would just be mutable global state again.
 */
let profile = null;

export function getProfile() {
  return profile;
}

export function setProfile(player) {
  profile = player;
}
