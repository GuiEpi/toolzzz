import { browser } from "#imports";

// Version shown in the UI (Toolzzz box, À propos tab, update toast). Read from
// the manifest, so package.json stays the single source for the number.
export const VERSION = browser.runtime.getManifest().version;
