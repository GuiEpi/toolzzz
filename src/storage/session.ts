/*
 * The single entry point for `sessionStorage`.
 *
 * Six flags of the "once, in this tab, until the next navigation" kind (flood →
 * reposition, cancellation failure, assignment attempt, toast de-duplication,
 * scroll restore). They stay on `sessionStorage` for good: WXT's `session:`
 * area is shared by the whole extension rather than scoped to the tab, so it
 * cannot replace them. Phase 4 leaves this file alone.
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
