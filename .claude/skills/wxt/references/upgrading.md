# Upgrading WXT (what actually breaks)

WXT is pre-1.0: a `0.X` bump is a major. Procedure for any major:

1. `<pm> add -D wxt@latest --ignore-scripts` (skip `postinstall` → `wxt prepare`
   would fail on the old config).
2. Apply the breaking changes below.
3. `wxt prepare`, then test **both** dev mode and a production build.

Full list: https://wxt.dev/guide/resources/upgrading

## 0.20 → 0.21 (current)

| Change                                                                                                                                                                                     | What to do                                                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Node >= 22, TS >= 5.4, Vite >= 6.3.4                                                                                                                                                       | Bump CI runners (`actions/setup-node` 22). Bun projects are not exempt: the `wxt` bin runs under Node.                                                                           |
| `vite`, `web-ext`, `typescript` become peer deps                                                                                                                                           | `add -D vite`; `add -D web-ext` only if you want the browser auto-opened in dev; delete `webExt.enabled: false` if you don't install it.                                         |
| Generated tsconfig is strict (`verbatimModuleSyntax`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `module: "Preserve"`)                                                              | Fix or override per flag in root tsconfig; `prepare:tsconfig` hook can revert to 0.20 defaults.                                                                                  |
| `url:` imports removed                                                                                                                                                                     | Vendor or npm.                                                                                                                                                                   |
| Zip templates: `{{version}}` = `manifest.version`; new `{{versionName}}`, `{{packageVersion}}`, `{{modeSuffix}}`; defaults now `{{name}}-{{packageVersion}}-{{browser}}{{modeSuffix}}.zip` | Production filenames unchanged; custom templates using `{{version}}` should switch to `{{versionName}}`. Dev builds get their own suffix — reinstall the unpacked dev extension. |
| Sources zip is a true allowlist (`include − exclude`), `zip.dotSources` added                                                                                                              | Rebuild `includeSources`/`excludeSources` from scratch; read the printed file list from `wxt zip -b firefox`.                                                                    |
| `createShadowRootUi` DOM simplified (`<style>` + `<div>`, no `<html><body>`)                                                                                                               | Check UI; CSS should use `:root, :host`. Pin `@webext-core/isolated-element@^1` to keep the old tree temporarily.                                                                |
| `globalName` defaults to `false` for content/unlisted scripts                                                                                                                              | Set `globalName: true` if you read the script's return value.                                                                                                                    |
| `imports.eslintrc.enabled: true` now auto-detects ESLint version                                                                                                                           | Set `8` explicitly to keep the legacy format.                                                                                                                                    |
| Removed: `runner`/`defineRunnerConfig`, `dev.server.hostname`, `wxt/testing` barrel, `clean(root)`                                                                                         | Use `webExt`/`defineWebExtConfig`, `dev.server.host`, `wxt/testing/fake-browser` + `wxt/testing/vitest-plugin`, `clean({ root })`.                                               |
| `publish-browser-extension` v5 → Chrome Web Store **v2 API**                                                                                                                               | `wxt submit init`, choose v2 (service account). v1 refresh-token auth stops **15 Oct 2026**.                                                                                     |
| `fake-browser` v2 types follow `@wxt-dev/browser`                                                                                                                                          | `onMessage` listeners must use `sendResponse` + `return true`, not returned promises.                                                                                            |
| Deprecated: `useAppConfig`                                                                                                                                                                 | Use `getAppConfig`.                                                                                                                                                              |

## 0.19 → 0.20 (in case a project is older)

- `webextension-polyfill` dropped: `browser` is now `globalThis.browser ??
chrome`; `onMessage` listeners can't return promises. Opt back in with
  `@wxt-dev/webextension-polyfill` module if needed.
- `extensionApi` config removed. Types via `Browser` namespace from
  `wxt/browser` (based on `@types/chrome`).
- `public/` and `modules/` are relative to **rootDir**, not `srcDir`.
- `wxt/storage`, `wxt/client`, `wxt/sandbox` → `#imports` (or
  `wxt/utils/*`).
- `createShadowRootUi` resets inherited styles (`all: initial`);
  `inheritStyles: true` restores.
- Output dirs: dev builds go to `.output/<browser>-mv<N>-dev`.
- `transformManifest` → `hooks["build:manifestGenerated"]`;
  `entrypointLoader` removed (vite-node); `runner` → `webExt`.
