/*
 * Storage items, one per thing Toolzzz persists.
 *
 * `browser.storage.local` belongs to the extension, not to a web origin, so
 * the isolation that page `localStorage` gave for free has to be spelled out:
 * every per-account item carries the server in its key. The server segment is
 * lower-case (`serverKey()`), unlike `Utils.server`, which is upper-case
 * because it also builds request URLs.
 *
 *   local:<server>:<name>          per account
 *   local:<server>:<name>:<tag>    per account and alliance
 *   local:global:<name>            extension-wide
 *
 * The stored shapes are exactly the ones 3.9.1 wrote to localStorage, French
 * field names included (`niveauConstruction`, `ordreRadar`…). Renaming those
 * is a separate migration — see .claude/plans/wxt-migration-followups.md.
 */
import { storage } from "#imports";

/** Server segment of a key, e.g. `s4`. Storage keys only. */
export function serverKey(): string {
  return location.hostname.split(".")[0]!.toLowerCase();
}

export interface PlayerData {
  id?: number;
  x?: number;
  y?: number;
  niveauConstruction?: number[];
  niveauRecherche?: number[];
}

/** Running upgrades, hunts, attacks and convoys shown by the ComptePlus box. */
export type UpgradesData = Record<string, any>;

export interface RadarData {
  joueurs?: Record<string, any>;
  alliances?: Record<string, any>;
  separateurs?: any[];
}

export interface AllianceMapData {
  timestamp?: number;
  members?: any[];
}

const V = { version: 1 } as const;

/** Items scoped to one server (i.e. one account). */
export function serverItems(server: string) {
  const at = (name: string) => `local:${server}:${name}` as const;
  return {
    settings: storage.defineItem<Record<string, any>>(at("settings"), { fallback: {}, ...V }),
    player: storage.defineItem<PlayerData>(at("player"), { fallback: {}, ...V }),
    upgrades: storage.defineItem<UpgradesData>(at("upgrades"), { fallback: {}, ...V }),
    radar: storage.defineItem<RadarData>(at("radar"), { fallback: {}, ...V }),
    /** Which of the ComptePlus ("C") / radar ("R") box is shown. */
    activeBox: storage.defineItem<string | null>(at("activeBox"), { fallback: null, ...V }),
    sentAttacks: storage.defineItem<any[]>(at("sentAttacks"), { fallback: [], ...V }),
    quickMenu: storage.defineItem<Record<string, boolean>>(at("quickMenu"), { fallback: {}, ...V }),
  };
}

/** Items scoped to one alliance of one server. */
export function allianceItems(server: string, tag: string) {
  const at = (name: string) => `local:${server}:${name}:${tag}` as const;
  return {
    allianceMap: storage.defineItem<AllianceMapData>(at("allianceMap"), { fallback: {}, ...V }),
    allianceMapFilters: storage.defineItem<Record<string, boolean>>(at("allianceMapFilters"), {
      fallback: {},
      ...V,
    }),
  };
}

/** Extension-wide, not tied to an account. */
export const globalItems = {
  lastSeenVersion: storage.defineItem<string | null>("local:global:lastSeenVersion", {
    fallback: null,
    ...V,
  }),
};

export type ServerItems = ReturnType<typeof serverItems>;
export type AllianceItems = ReturnType<typeof allianceItems>;
