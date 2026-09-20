---
name: wxt
description: Rules, conventions and gotchas for building browser extensions with the WXT framework (wxt.dev). Use this whenever a task touches wxt.config.ts, anything under entrypoints/, content scripts, the generated manifest, browser.* extension APIs, wxt/utils/storage, public/ or assets/ handling, `wxt build` / `wxt zip` / `wxt submit`, or Firefox/Chrome dual-target builds — even if the user just says "the extension", "the manifest" or "the content script" without naming WXT. Also use it before answering any question about how WXT works.
---

# WXT

WXT is a Vite-based framework for web extensions. It generates `manifest.json`
from your config and your entrypoint files, bundles each entrypoint with Vite,
and provides a cross-browser `browser` global plus a few utilities (storage,
content-script UI helpers, script injection).

Distilled from https://wxt.dev for **WXT 0.21.x** (current: 0.21.4). WXT
is pre-1.0, so every `0.X` bump is a breaking release; check `package.json`
and read `references/upgrading.md` before assuming a project is on 0.21.
Requirements on 0.21: Node >= 22, Vite ^6.3.4 | ^7 | ^8 as an explicit
devDependency, TypeScript >= 5.4; `web-ext` only if you want the dev
browser to auto-open.

When something here is not enough, fetch `https://wxt.dev/llms-full.txt` and
read the relevant section rather than guessing.

## Mental model

1. **There is no `manifest.json` in source.** It is generated from three
   sources merged in this order: `manifest` in `wxt.config.ts` → options
   declared inside each entrypoint (`matches`, `runAt`, …) → `hooks` /
   modules. Output lands in `.output/<browser>-mv<N>/manifest.json`.
2. **A file directly under `entrypoints/` IS an entrypoint.** Its name decides
   its type (`background.ts`, `popup.html`, `*.content.ts`, …). Helper files
   must live in a directory entrypoint (`entrypoints/foo.content/index.ts` +
   siblings), never loose in `entrypoints/`. Only one level of nesting.
3. **Entrypoints are imported in Node at build time** to read their options.
   Anything outside `main()` runs in Node with a fake `browser` and a fake
   DOM. Touching the DOM or `browser.*` at module top level breaks the build
   (`Browser.X not implemented`) or silently does nothing.
4. **`browser` is the API.** `import { browser } from "wxt/browser"` (or via
   `#imports`). It is `globalThis.browser ?? globalThis.chrome`, promise-style
   on every browser. Never use the `chrome` global directly. Types come from
   `@types/chrome`; APIs absent at runtime are `undefined`, so feature-detect
   (`browser.x?.y`), the types won't save you.
5. **Auto-imports are on by default** for WXT APIs and for `components/`,
   `composables/`, `hooks/`, `utils/` under `srcDir`. `imports: false` turns
   them off; then import WXT APIs from `#imports`. Run `wxt prepare`
   (`postinstall`) so `.wxt/` types exist.

## Project layout

```
<root>/
  wxt.config.ts         main config
  web-ext.config.ts     dev browser launch config (gitignored)
  public/               copied verbatim to output (icons, static images)
  modules/              local WXT modules (auto-loaded)
  <srcDir>/             "." by default; set srcDir: "src" to move it
    entrypoints/
    assets/             processed by Vite (import from "~/assets/x.png")
    utils/ components/  auto-imported unless imports: false
    app.config.ts       runtime config (defineAppConfig)
  .output/              build artefacts
  .wxt/                 generated tsconfig + types (do not edit)
```

Path aliases provided by WXT: `~`/`@` → srcDir, `~~`/`@@` → rootDir. Add
custom aliases via `alias` in `wxt.config.ts`, never in `tsconfig.json`.
`tsconfig.json` must `extends: "./.wxt/tsconfig.json"`.

## Entrypoint cheat-sheet

| File under `entrypoints/`       | Type            | Definer                     |
| ------------------------------- | --------------- | --------------------------- |
| `background.ts`                 | background      | `defineBackground()`        |
| `<name>.content.ts`             | content script  | `defineContentScript()`     |
| `popup.html`, `options.html`    | listed HTML     | `<meta name="manifest.*">`  |
| `sidepanel.html`, `newtab.html` | listed HTML     | idem                        |
| `<name>.html`                   | unlisted page   | — (`/name.html` at runtime) |
| `<name>.ts`                     | unlisted script | `defineUnlistedScript()`    |
| `<name>.css`                    | unlisted CSS    | —                           |

Every JS entrypoint accepts `include` / `exclude` (browser lists) to drop it
from some builds. Content-script options can be per-browser objects
(`runAt: { chrome: "document_start", firefox: "document_end" }`).

```ts
export default defineContentScript({
  matches: ["*://*.example.com/*"],
  runAt: "document_idle", // or document_start / document_end
  cssInjectionMode: "manifest", // manifest (default) | manual | ui
  registration: "manifest", // or "runtime" (executeScript)
  world: "ISOLATED", // "MAIN" is Chromium-only — prefer injectScript
  main(ctx) {
    /* may be async */
  },
});
```

Background `main()` cannot be async. Background is IIFE unless
`type: "module"` (MV3 only). Content scripts are always bundled as a single
IIFE per entrypoint — no code-splitting, no ESM, no HMR.

See `references/content-scripts.md` for CSS, UI modes, `ctx`, `injectScript`,
SPA handling.

## Manifest and config rules

- Write manifest keys in **MV3 form**; WXT downgrades for MV2 targets.
- `name` defaults to `package.json` name, `version` to `package.json`
  version (suffixes stripped into `version_name`). Don't duplicate them.
- Icons are auto-discovered from `public/icon-<size>.png` or
  `public/icon(s)/<size>.png`; otherwise set `manifest.icons` explicitly.
- Permissions are **not** inferred (except `sidepanel`, and `tabs`+`scripting`
  in dev). `wxt/utils/storage` needs `permissions: ["storage"]`.
- `manifest` may be a function `({ browser, manifestVersion, mode, command })`
  for per-target values. Required for `.env` values (files load after config).
- Firefox defaults to **MV2**; set `manifestVersion: 3` to force MV3.
- `web_accessible_resources` is never added for you — content scripts cannot
  load `public/` files without it.
- Vite overrides go in `vite: (env) => ({ ... })`. Rarely needed; WXT's
  defaults produce store-valid output.
- `hooks["build:manifestGenerated"](wxt, manifest)` is the escape hatch for
  anything the generator can't express (e.g. a CSS-only content script).

See `references/config-and-manifest.md`.

## Assets

- `public/x.png` → import path `"/x.png"`, copied as-is. In a content script
  wrap with `browser.runtime.getURL("/x.png")`, otherwise the browser resolves
  it against the _page's_ origin. Also needs `web_accessible_resources`.
- `<srcDir>/assets/x.png` → `import url from "~/assets/x.png"`, hashed by
  Vite. Same `getURL` caveat in content scripts.
- CSS: `import "./style.css"` inside a content script entrypoint puts the
  bundled CSS into that content script's manifest `css` array
  (`cssInjectionMode: "manifest"`). Vite processes it (imports, `url()`).

## Storage

`import { storage } from "#imports"` (or `wxt/utils/storage`; standalone
package `@wxt-dev/storage`). Async only. Keys are prefixed with the area:
`local:` | `session:` | `sync:` | `managed:` — an unprefixed key throws.
`browser.storage.local` is scoped to the extension, shared by every context
(background, popup, all tabs' content scripts) and **not** per-origin.

```ts
export const theme = storage.defineItem<"light" | "dark">("local:theme", {
  fallback: "dark", // returned when nothing is stored (nothing written)
  version: 1, // enables migrations; bump + add migrations[n]
});
await theme.getValue();
await theme.setValue("light");
theme.watch(cb);
```

Use `init` instead of `fallback` for values that must be persisted once
(ids, install dates). Bulk: `getItems` / `setItems` / `removeItems`.
Migrations run when `defineItem` is evaluated; reads/writes await them.

See `references/storage.md`.

## Build, dev, publish

```
wxt                 dev, Chrome          wxt -b firefox     dev, Firefox
wxt build [-b x]    → .output/x-mvN/    wxt zip [-b x]     → .output/*.zip
wxt prepare         regenerate .wxt/    wxt clean
wxt submit --chrome-zip … --firefox-zip … --firefox-sources-zip …
```

- `wxt zip -b firefox` also produces `*-sources.zip` for AMO review (config
  files, hidden files and tests excluded; tune with `zip.includeSources` /
  `zip.excludeSources`). AMO rebuilds from it — the README must state the
  package manager version and the exact commands.
- Dev mode adds `tabs`/`scripting` permissions and opens a fresh browser
  profile via `web-ext`; persist a Chromium profile with
  `chromiumArgs: ["--user-data-dir=./.wxt/chrome-data"]` in
  `web-ext.config.ts`, or `disabled: true` to not launch a browser.
- Runtime constants: `import.meta.env.BROWSER`, `.MANIFEST_VERSION`,
  `.CHROME` / `.FIREFOX`, `.MODE`, `.DEV` / `.PROD`. Env vars must start
  with `WXT_` or `VITE_`.
- Unit tests: `WxtVitest()` plugin in `vitest.config.ts`; `fakeBrowser`
  from `wxt/testing/fake-browser` implements `browser.storage` in memory.

See `references/publishing.md`. For version bumps see `references/upgrading.md`.

## Gotchas checklist (read before every build)

- [ ] Nothing DOM- or `browser`-related outside `main()` in any entrypoint.
- [ ] No loose helper files directly under `entrypoints/`.
- [ ] `permissions` lists everything you use (`storage`!).
- [ ] Content-script asset URLs go through `browser.runtime.getURL` and are
      in `web_accessible_resources`.
- [ ] jQuery-style plugins that expect a global: assign `window.jQuery =
window.$ = $` in a module imported **before** the plugins; ESM import
      order is per-file and deterministic, so make that module the first
      import of the entrypoint.
- [ ] Strict mode is on inside the bundle: assignments to undeclared
      variables throw `ReferenceError` at runtime, not at build time.
- [ ] `eval` / `new Function` still blocked by MV3 CSP even after bundling.
- [ ] Firefox MV3 needs `browser_specific_settings.gecko.id` and, for AMO
      since late 2025, `gecko.data_collection_permissions`.
- [ ] Changing `manifestVersion`, `gecko.id` or `srcDir` are not "just
      config" — each changes store identity or every import path.
- [ ] On 0.21 the sources zip is an **allowlist**: `zip.includeSources`
      must name every top-level dir/file AMO needs; `wxt zip -b firefox`
      prints what went in — read that list.
- [ ] `bun run wxt` runs the `wxt` bin under Node (shebang), so CI needs
      Node 22 even in a Bun project.
- [ ] Chrome Web Store v1 API (refresh-token auth) dies **15 Oct 2026**;
      `wxt submit init` sets up v2 (service account).
