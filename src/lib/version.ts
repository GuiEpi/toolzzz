import { browser } from "#imports";

// Version affichée dans l'UI (boîte Toolzzz, À propos, toast de mise à jour).
// Lue dans le manifest : package.json reste la source unique du numéro.
export const VERSION = browser.runtime.getManifest().version;
