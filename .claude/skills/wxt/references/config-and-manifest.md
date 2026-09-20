# `wxt.config.ts`, manifest generation, TypeScript, Vite, hooks

## `defineConfig` fields you actually use

```ts
import { defineConfig } from "wxt";

export default defineConfig({
  srcDir: "src",                 // default "."
  entrypointsDir: "entrypoints", // relative to srcDir
  publicDir: "public",           // relative to root
  outDir: ".output",
  modulesDir: "modules",
  manifestVersion: 3,            // default: 3 everywhere except Firefox/Safari → 2
  targetBrowsers: ["chrome", "firefox"],   // narrows import.meta.env.BROWSER type
  imports: false,                // disable auto-imports (then use "#imports")
  alias: { strings: resolve("src/lib/strings.ts") },
  manifest: { … } | (({ browser, manifestVersion, mode, command }) => ({ … })),
  vite: (env) => ({ /* vite.config.ts contents */ }),
  hooks: { "build:manifestGenerated": (wxt, manifest) => { … } },
  modules: ["@wxt-dev/auto-icons"],
  zip: { includeSources: [], excludeSources: [], zipSources: false },
  webExt: { … },                 // dev browser launch; prefer web-ext.config.ts
  filterEntrypoints: ["popup", "background"],
});
```

## How the manifest is assembled

1. Defaults: `manifest_version`, `name` (package.json), `version` /
   `version_name` (package.json, invalid suffix stripped), `description`,
   icons discovered in `public/`.
2. `manifest` from config (merged).
3. Per-entrypoint options: `content_scripts` from every `*.content.*`
   (grouped by identical `matches`/`runAt`/…), `background`, `action` +
   `default_popup` from `popup.html`, `options_ui`, `side_panel` /
   `sidebar_action`, `chrome_url_overrides`, devtools, sandbox.
4. WXT modules' hooks, then local `modules/` (alphabetical, prefix with
   numbers to order), then `hooks` in `wxt.config.ts`.
5. MV2 downgrade if targeting MV2 (`action` → `browser_action`, WAR object
   list → string list, etc.).
6. Dev mode only: `tabs` + `scripting` permissions, dev-server CSP.

Write keys in MV3 form and let WXT downgrade. Keys only valid for one
manifest version are dropped for the other.

Firefox specifics you must add yourself:

```ts
browser_specific_settings: {
  gecko: {
    id: "ext@example.org",            // stable forever once published
    strict_min_version: "142.0",
    data_collection_permissions: { required: ["none"] },  // AMO requirement
  },
  gecko_android: { strict_min_version: "142.0" },
}
```

`manifest.author` must be a plain string for AMO; WXT's types expect an
object — keep a targeted `// @ts-expect-error`.

Permissions are never inferred. `web_accessible_resources` is never added
for you (even `_favicon/*` needs an explicit entry).

`url:` imports (bundling remote code by URL) were removed in 0.21 — vendor
the file or use the npm package.

## Environment

`.env`, `.env.local`, `.env.<mode>`, `.env.<browser>` and combinations, Vite
semantics. Only `WXT_*` and `VITE_*` are exposed. Built-ins:

| `import.meta.env.…`                                | value                                                              |
| -------------------------------------------------- | ------------------------------------------------------------------ |
| `BROWSER`                                          | `"chrome"`, `"firefox"`, `"edge"`, …                               |
| `MANIFEST_VERSION`                                 | `2` \| `3`                                                         |
| `CHROME` / `FIREFOX` / `SAFARI` / `EDGE` / `OPERA` | booleans                                                           |
| `MODE`                                             | `development` for `wxt`, `production` for build/zip, or `--mode x` |
| `DEV` / `PROD`                                     | booleans                                                           |

Inside `manifest: ({ mode }) => …` use `mode`, not `import.meta.env.DEV`.

`app.config.ts` + `defineAppConfig` + `getAppConfig()` for typed runtime
config (committed — no secrets).

## TypeScript

- `wxt prepare` writes `.wxt/tsconfig.json` and type declarations
  (auto-imports, env, aliases). Root `tsconfig.json`:
  `{ "extends": "./.wxt/tsconfig.json", "compilerOptions": { … } }`.
- 0.21 generated base (needs TS >= 5.4): `target/module` ESNext with
  `module: "Preserve"`, `moduleResolution: "Bundler"`, `strict: true`,
  `verbatimModuleSyntax`, `noUncheckedIndexedAccess`, `noImplicitOverride`,
  `noFallthroughCasesInSwitch`, `allowImportingTsExtensions`,
  `moduleDetection: "force"`, `lib: ["ESNext","DOM","DOM.Iterable"]`.
  Override individual flags in the root tsconfig when migrating legacy
  code (`noUncheckedIndexedAccess: false` is the usual first casualty);
  a `prepare:tsconfig` hook can revert the whole set to 0.20 defaults.
- Override simple flags in root tsconfig; merge complex ones via
  `hooks["prepare:tsconfig"]`.
- Never add `paths` yourself — use `alias`.
- Browser API types: `import type { Browser } from "wxt/browser"`
  (`Browser.runtime.MessageSender`, …). Firefox-only APIs need augmentation.

## Vite

On 0.21 `vite` is a **required peer dependency** — add it to
`devDependencies` yourself (^6.3.4, ^7 or ^8 pre). `web-ext` and
`typescript` are optional peers. The dev server runs on Vite's
ModuleRunner/Environment API (no more `vite-node`).

`vite: (configEnv) => ({ plugins: [...], build: { minify: false } })`.
WXT runs Vite once per entrypoint group and mixes dev-server and build
during `wxt` dev, so plugins keyed on `vite build` may need
`configEnv.mode === "production"` guards. Don't change build output
options unless you have a store-review reason (readable Firefox bundle,
for instance).

## Hooks (most useful)

| Hook                                         | Use                                                 |
| -------------------------------------------- | --------------------------------------------------- |
| `config:resolved`                            | patch resolved config                               |
| `entrypoints:found` / `entrypoints:resolved` | add or inspect entrypoints                          |
| `build:manifestGenerated`                    | last-minute manifest edits                          |
| `build:publicAssets`                         | copy extra files (WASM, generated text) into output |
| `prepare:tsconfig` / `prepare:types`         | tsconfig / `.d.ts` generation                       |

Local module = `modules/<name>.ts` exporting `defineWxtModule({ setup(wxt, options) })`.
Prefer a module over a pile of inline hooks.

## Dev browser (`web-ext.config.ts`, gitignored)

```ts
import { defineWebExtConfig } from "wxt";
export default defineWebExtConfig({
  binaries: { chrome: "/path/to/chrome", firefox: "firefoxdeveloperedition" },
  chromiumArgs: ["--user-data-dir=./.wxt/chrome-data"], // persistent profile
  disabled: true, // don't launch a browser
});
```
