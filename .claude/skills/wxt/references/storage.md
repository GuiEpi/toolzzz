# `wxt/utils/storage`

Wrapper over `browser.storage.*`. Built into WXT (`import { storage } from
"#imports"` — auto-imported if auto-imports are on); standalone as
`@wxt-dev/storage`. Requires `permissions: ["storage"]`.

## Scope model (know this before designing keys)

- `browser.storage.local` belongs to the **extension**, not to a web origin.
  Every context of the extension (background, popup, options, every tab's
  content script on every site) reads the same store.
- Page `localStorage` in a content script belongs to the **page's origin**
  and is shared with the site's own JS. Only a content script can read it.
- Consequence: data that must differ per site/subdomain/account must carry
  that discriminator in the key (`local:<host>:<name>`); `localStorage`
  gave you that isolation for free, `storage.local` does not.
- Migrating from page `localStorage` therefore has to happen **inside the
  content script**, reading `localStorage` and writing `storage.local`.

## Keys and areas

Every key is `"<area>:<name>"` with area `local` | `session` | `sync` |
`managed`. A key without the prefix throws.

```ts
await storage.getItem<number>("local:count");
await storage.setItem("local:count", 1);
await storage.removeItem("local:count");
await storage.getItems(["local:a", "local:b"]);
await storage.setItems([{ key: "local:a", value: 1 }, { item: someItem, value: 2 }]);
await storage.removeItems([...]);
storage.watch<number>("local:count", (newV, oldV) => …);   // returns unwatch()
```

`sync` has small quotas; `session` is cleared when the browser closes;
`managed` is read-only enterprise policy.

## Defined items (recommended)

```ts
// storage/items.ts
export const settings = storage.defineItem<Settings>("local:settings", {
  fallback: DEFAULT_SETTINGS,   // returned by getValue when null; NOT written
  version: 1,
});
export const installDate = storage.defineItem<number>("local:installDate", {
  init: () => Date.now(),       // written immediately if absent
});

await settings.getValue();
await settings.setValue({ ... });
await settings.removeValue();
const unwatch = settings.watch((newV, oldV) => …);
await settings.getMeta() / setMeta({ … }) / removeMeta();
```

- `fallback` vs `init`: `fallback` is a read-time default (nothing
  persisted); `init` persists once. Use `fallback` for settings, `init` for
  ids/dates. `defaultValue` is the deprecated name of `fallback`.
- `TValue` is a compile-time promise only — nothing validates what is in
  storage. Data written by older versions or imported from elsewhere must be
  normalised by you (or by a migration).
- Dynamic keys (per server, per user): wrap `defineItem` in a factory and
  memoise per key; every `defineItem` call schedules a migration check.

## Versioning

```ts
export const list = storage.defineItem<ItemV2[]>("local:list", {
  fallback: [],
  version: 2,
  migrations: {
    2: (old: ItemV1[]): ItemV2[] => old.map(x => ({ id: uid(), value: x })),
  },
  onMigrationComplete(value, toVersion) { … },   // optional
  debug: false,
});
```

- Version is stored in the item's metadata (`key$` → `{ v }`). Missing
  version is treated as 1, so an unversioned item can become `version: 2`
  with a single `migrations[2]`.
- Migrations run as soon as `defineItem` executes; `getValue`/`setValue`/
  meta calls wait for them. A failing migration throws `MigrationError`.
- Migrations chain: 1→2→3 each run in order for a stale value.

## Metadata

Arbitrary object stored beside the value at `key + "$"`. `setMeta` merges
properties; `removeMeta(key, prop | prop[])` removes selectively. Versioning
uses the `v` property — don't overwrite it.

## Sync/async boundary pattern

Code written against synchronous `localStorage` cannot be switched to
`storage.local` call-for-call. Standard approach:

1. Keep a tiny module as the single persistence API of the app.
2. At startup, `await Promise.all(items.map(i => i.getValue()))` once, put
   results in an in-memory snapshot, then let the rest of the app read the
   snapshot synchronously.
3. Writes update the snapshot and call `setValue` (fire-and-forget or
   awaited where ordering matters).
4. If other tabs must see changes, `watch()` each item and refresh the
   snapshot — otherwise don't add `watch`, it's behaviour you didn't have.

## Testing

`WxtVitest()` + `fakeBrowser` from `wxt/testing/fake-browser` give an
in-memory `browser.storage`; call `fakeBrowser.reset()` in `beforeEach`. No
mocking of `wxt/utils/storage` is needed.
