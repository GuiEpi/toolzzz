/*
 * Point de passage unique pour `sessionStorage`.
 *
 * Six drapeaux « une fois, dans cet onglet, jusqu'à la prochaine navigation »
 * (flood → replacer, échec d'annulation, tentative d'affectation, dédoublonnage
 * de toast, restauration du scroll). Ils restent sur `sessionStorage` pour de
 * bon : l'aire `session:` de WXT est partagée par toute l'extension, pas
 * limitée à l'onglet, elle ne peut pas les remplacer. La Phase 4 ne touche pas
 * à ce fichier.
 */

export function getRaw(key: string): string | null {
  return sessionStorage.getItem(key);
}

export function setRaw(key: string, value: string): void {
  sessionStorage.setItem(key, value);
}

export function getJSON<T = any>(key: string): T | null {
  return JSON.parse(sessionStorage.getItem(key) as string);
}

export function setJSON(key: string, value: unknown): void {
  sessionStorage.setItem(key, JSON.stringify(value));
}

export function remove(key: string): void {
  sessionStorage.removeItem(key);
}
