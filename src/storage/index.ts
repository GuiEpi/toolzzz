/*
 * The single entry point for persistence, backed by `browser.storage.local`.
 *
 * That API is asynchronous while the rest of the extension reads settings in
 * the middle of rendering, so everything is hydrated once at start-up
 * (`hydrate()`, awaited before anything else in `main()`) and kept in memory.
 * Reads then answer from that snapshot synchronously, exactly as the
 * localStorage calls they replaced did; writes update the snapshot and are
 * forwarded to storage.
 *
 * Values go through `JSON.parse(JSON.stringify(value))` before being stored.
 * That keeps the stored shapes identical to what 3.9.1 wrote — `toJSON()` is
 * honoured (RadarBox and ComptePlusBox rely on it) and class instances are
 * flattened, which the structured clone used by the storage API would not do.
 *
 * Nothing outside this folder imports `#imports` storage directly.
 */
import { allianceItems, globalItems, serverItems, serverKey } from "~/storage/items";
import type { AllianceItems, ServerItems } from "~/storage/items";
import { importLegacyData } from "~/storage/legacy-import";

export { serverKey };

type Replacer = (string | number)[];

/** One stored value, readable synchronously once hydrated. */
export interface Entry<T> {
  get(): T;
  set(value: T, replacer?: Replacer): void;
  remove(): void;
}

function entry<T>(item: {
  getValue(): Promise<T>;
  setValue(v: T): Promise<void>;
  removeValue(): Promise<void>;
  fallback: T;
}): Entry<T> & { hydrate(): Promise<void> } {
  let current: T = item.fallback;
  const report = (what: string) => (e: unknown) =>
    console.warn(`toolzzz: storage ${what} failed`, e);
  return {
    get: () => current,
    set(value, replacer) {
      const plain = JSON.parse(JSON.stringify(value, replacer as any)) as T;
      current = plain;
      item.setValue(plain).catch(report("write"));
    },
    remove() {
      current = item.fallback;
      item.removeValue().catch(report("remove"));
    },
    async hydrate() {
      try {
        current = await item.getValue();
      } catch (e) {
        report("read")(e);
      }
    },
  };
}

type Store = {
  [K in keyof ServerItems]: Entry<Awaited<ReturnType<ServerItems[K]["getValue"]>>>;
} & {
  [K in keyof AllianceItems]: Entry<Awaited<ReturnType<AllianceItems[K]["getValue"]>>>;
} & {
  lastSeenVersion: Entry<string | null>;
};

let entries: Record<string, ReturnType<typeof entry>> | null = null;

/**
 * Reads everything this account needs into memory, importing the data of a
 * previous version on first run. Must be awaited before any `store` access.
 *
 * @param allianceTag alliance of the signed-in player, when they have one;
 *                    its items are the only alliance-scoped data a page reads.
 */
export async function hydrate(allianceTag?: string): Promise<void> {
  const server = serverKey();
  const items: Record<string, any> = {
    ...serverItems(server),
    ...(allianceTag ? allianceItems(server, allianceTag) : {}),
    ...globalItems,
  };
  entries = Object.fromEntries(
    Object.entries(items).map(([name, item]) => [name, entry(item as any)]),
  );
  await Promise.all(Object.values(entries).map((e) => e.hydrate()));
  if (await importLegacyData(server, allianceTag)) {
    // the import wrote straight to storage, so re-read what it left
    await Promise.all(Object.values(entries).map((e) => e.hydrate()));
  }
}

/**
 * The stored values. Reading before `hydrate()` has resolved is a programming
 * error and throws rather than silently handing back a default.
 */
export const store = new Proxy({} as Store, {
  get(_target, name: string) {
    if (!entries) throw new Error(`toolzzz: storage read before hydrate() (${name})`);
    const found = entries[name];
    if (!found) throw new Error(`toolzzz: no storage item named ${name}`);
    return found;
  },
});

/** True when the alliance-scoped items were hydrated (the player has an alliance). */
export function hasAllianceItems(): boolean {
  return !!entries && "allianceMap" in entries;
}
