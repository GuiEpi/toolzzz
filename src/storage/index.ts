/*
 * The single entry point for `localStorage` persistence.
 *
 * Phases 1–3 of the WXT migration: a plain synchronous façade with exactly the
 * semantics of the direct calls it replaces (same `outiiil_*` keys, the same
 * `JSON.parse` that returns `null` for a missing key and throws on corrupted
 * content — callers that guarded against it keep their try/catch). Phase 4
 * swaps the backend for `browser.storage.local` without touching callers.
 */

/** Reads a JSON value. `null` when absent; throws when the JSON is invalid. */
export function getJSON<T = any>(key: string): T | null {
  return JSON.parse(localStorage.getItem(key) as string);
}

/** Writes a value as JSON. `replacer` is passed straight to `JSON.stringify`. */
export function setJSON(key: string, value: unknown, reposition?: (string | number)[]): void {
  localStorage.setItem(key, JSON.stringify(value, reposition));
}

/** Reads a raw string (non-JSON keys: `outiiil_boiteActive`, `outiiil_lastSeenVersion`). */
export function getRaw(key: string): string | null {
  return localStorage.getItem(key);
}

/** Writes a raw string. */
export function setRaw(key: string, value: string): void {
  localStorage.setItem(key, value);
}

export function remove(key: string): void {
  localStorage.removeItem(key);
}

/**
 * The « server » segment of the future `browser.storage.local` keys
 * (`local:<server>:<name>`, Phase 4). Lower-case, unlike `Utils.server`
 * (upper-case), which also builds request URLs and must not change before
 * Phase 4. For storage keys only.
 */
export function serverKey(): string {
  return location.hostname.split(".")[0]!.toLowerCase();
}
