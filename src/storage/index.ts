/*
 * Point de passage unique pour la persistance `localStorage`.
 *
 * Phase 1–3 de la migration WXT : simple façade synchrone, sémantique
 * identique aux appels directs qu'elle remplace (mêmes clés `outiiil_*`,
 * même `JSON.parse` qui renvoie `null` si la clé est absente et lève si le
 * contenu est corrompu — les appelants qui s'en protégeaient gardent leur
 * try/catch). La Phase 4 remplacera le backend par `browser.storage.local`
 * sans toucher aux appelants.
 */

/** Lit une valeur JSON. `null` si absente ; lève si le JSON est invalide. */
export function getJSON<T = any>(key: string): T | null {
  return JSON.parse(localStorage.getItem(key) as string);
}

/** Écrit une valeur en JSON. `replacer` est passé tel quel à `JSON.stringify`. */
export function setJSON(key: string, value: unknown, reposition?: (string | number)[]): void {
  localStorage.setItem(key, JSON.stringify(value, reposition));
}

/** Lit une chaîne brute (clés non JSON : `outiiil_boiteActive`, `outiiil_lastSeenVersion`). */
export function getRaw(key: string): string | null {
  return localStorage.getItem(key);
}

/** Écrit une chaîne brute. */
export function setRaw(key: string, value: string): void {
  localStorage.setItem(key, value);
}

export function remove(key: string): void {
  localStorage.removeItem(key);
}

/**
 * Segment « serveur » des futures clés `browser.storage.local`
 * (`local:<server>:<name>`, Phase 4). Minuscule, contrairement à
 * `Utils.serveur` (majuscule) qui sert aussi à construire des URLs et ne
 * doit pas changer avant la Phase 4. Réservé aux clés de stockage.
 */
export function serverKey(): string {
  return location.hostname.split(".")[0]!.toLowerCase();
}
