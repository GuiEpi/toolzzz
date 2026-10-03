/*
 * One-time import of the data written by Toolzzz 3.x and Outiiil.
 *
 * Until 3.9.1 everything lived in the page's `localStorage` under `outiiil_*`
 * keys, which only a content script can read — hence this running here rather
 * than in a background context. It runs once per server, copies what it finds
 * into `browser.storage.local`, and never deletes the originals: a player who
 * rolls back to 3.x keeps their data.
 *
 * This is the only file allowed to mention `outiiil_*` keys.
 *
 * TODO: delete this file (and the `legacyImported` marker) two releases after
 * 4.0 ships — see .claude/plans/wxt-migration-followups.md.
 */
import { storage } from "#imports";

import { allianceItems, serverItems } from "~/storage/items";

/** Marks a server as imported, so a player who clears their data keeps it cleared. */
const marker = (server: string) =>
  storage.defineItem<boolean>(`local:${server}:legacyImported`, { fallback: false, version: 1 });

function readJson(key: string): any {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? undefined : JSON.parse(raw);
  } catch {
    return undefined; // corrupted entry: treat it as absent, like the old code did
  }
}

function readRaw(key: string): string | undefined {
  const raw = localStorage.getItem(key);
  return raw === null ? undefined : raw;
}

/**
 * Copies the legacy data of one server, if any, and reports whether anything
 * was written.
 *
 * @param server lower-case server segment used by the new keys (`s4`)
 * @param allianceTag alliance of the signed-in player, when they have one
 */
export async function importLegacyData(server: string, allianceTag?: string): Promise<boolean> {
  const imported = marker(server);
  if (await imported.getValue()) return false;

  const items = serverItems(server);
  // the old alliance keys carry the server in upper case, as `Utils.server` gives it
  const legacyServer = server.toUpperCase();

  const planned: { name: string; item: { setValue(v: any): Promise<void> }; value: any }[] = [];
  const take = (name: string, item: any, value: any) => {
    if (value !== undefined) planned.push({ name, item, value });
  };

  take("settings", items.settings, readJson("outiiil_parametre"));
  take("player", items.player, readJson("outiiil_joueur"));
  take("upgrades", items.upgrades, readJson("outiiil_evolution"));
  take("radar", items.radar, readJson("outiiil_radar"));
  take("activeBox", items.activeBox, readRaw("outiiil_boiteActive"));
  take("sentAttacks", items.sentAttacks, readJson("outiiil_attaquesLancees"));
  take("quickMenu", items.quickMenu, readJson("outiiil_menuRapide"));

  if (allianceTag) {
    const alliance = allianceItems(server, allianceTag);
    take(
      "allianceMap",
      alliance.allianceMap,
      readJson(`outiiil_carteAlliance_${legacyServer}_${allianceTag}`),
    );
    take(
      "allianceMapFilters",
      alliance.allianceMapFilters,
      readJson(`outiiil_carteFiltres_${legacyServer}_${allianceTag}`),
    );
  }

  // extension-wide, not per server: imported with the first server that runs
  const lastSeen = readRaw("outiiil_lastSeenVersion");
  if (lastSeen !== undefined) {
    const item = storage.defineItem<string | null>("local:global:lastSeenVersion", {
      fallback: null,
      version: 1,
    });
    if ((await item.getValue()) === null)
      planned.push({ name: "lastSeenVersion", item, value: lastSeen });
  }

  await Promise.all(planned.map((p) => p.item.setValue(p.value)));
  await imported.setValue(true);

  if (planned.length) {
    console.info(
      `Toolzzz: imported ${planned.length} item(s) saved by a previous version ` +
        `(${planned.map((p) => p.name).join(", ")}). The old data is left untouched.`,
    );
  }
  return planned.length > 0;
}
