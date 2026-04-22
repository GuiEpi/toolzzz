# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project context

Toolzzz is a browser extension for the French browser game [Fourmizzz.fr](http://www.fourmizzz.fr), fork of [Hraesvelg/Outiiil](https://github.com/Hraesvelg/Outiiil) (GPL-3.0). This is the 3.0 release, migrated from MV2 to MV3 and bundled with [WXT](https://wxt.dev) for dual Chrome + Firefox publication.

All user-facing strings are in French (game domain vocabulary: ponte, chasse, convoi, alliance, etc.).

## Commands

```bash
bun install               # postinstall runs `wxt prepare`
bun run dev               # dev mode, Chrome
bun run dev:firefox       # dev mode, Firefox
bun run build             # production build → .output/chrome-mv3/
bun run build:firefox     # production build → .output/firefox-mv3/
bun run zip               # zip for Chrome Web Store
bun run zip:firefox       # zip for Firefox AMO
bun run compile           # tsc --noEmit (typecheck only, no emitted files)
```

There is no test suite and no linter configured.

## Architecture — read this before touching WXT or the manifest

This project uses WXT unconventionally. **Do not assume standard WXT conventions apply.**

### srcDir is the repo root, not `src/`

`wxt.config.ts` sets `srcDir: "."`. The actual extension source lives in `public/` (served verbatim by WXT as static assets) and `entrypoints/`.

### Manifest is hand-written, not generated from entrypoints

The standard WXT workflow is to put `entrypoints/content.ts` + `defineContentScript()` and let WXT build the manifest. This project does the opposite: the entire `content_scripts` block (40+ libraries and modules) is declared manually in `wxt.config.ts` under `manifest.content_scripts`. When adding/removing a script, edit `wxt.config.ts` — there is no entrypoint file to update.

### `entrypoints/background.ts` is a required no-op stub

WXT refuses to build without at least one entrypoint (`ERROR No entrypoints found`). Since the real content scripts are declared in the manifest directly, `entrypoints/background.ts` exists only as `defineBackground(() => {})` to satisfy WXT. **Do not delete it** — the build breaks. Deleting it and migrating to entrypoint-style content scripts would be a sizable refactor given the strict load order of the 40+ libs.

### Content script load order matters

Files under `public/js/` are concatenated in the order listed in `wxt.config.ts`. The order is:

1. `js/lib/*` — vendored libraries (jQuery, Highcharts, DataTables, moment, numeral, globalize, clipboard — all loaded as non-module globals)
2. `js/class/*` — domain model classes (`Joueur`, `Alliance`, `Armee`, `Combat`, `Convoi`, `Utils`, etc.)
3. `js/boite/*` — UI widget ("boîte") modules that render the in-game panels
4. `js/page/*` — per-page entry points that hook into specific Fourmizzz URLs (`Attaquer.js`, `Messagerie.js`, `Profil.js`, etc.)
5. `js/content.js` — final bootstrap, declares game-wide constants and wires everything together

Each tier depends on everything above it being present as globals. Reordering will break runtime references.

### Single domain

`http://*.fourmizzz.fr/*` is the only host in both `host_permissions` and `content_scripts.matches`. The upstream Outiiil v2 also relied on a companion backend at `outiiil.fr` (crowdsourced map data, player/alliance historique, Traceur POST endpoint). That backend is dead — the fork removes all of it in 3.0. If you see mentions of outiiil.fr in old branches, PRs, or issue history, they are stale and should not be re-introduced.

The `data_collection_permissions.required: ["none"]` declaration in the manifest depends on this: the extension no longer transmits any data anywhere, only reads fourmizzz.fr pages locally.

## MV3 CSP constraints

The migration from MV2 to MV3 tightened CSP. Two non-obvious patches exist:

- **`public/js/lib/jquery-datetimepicker_1.6.3.js`** replaces the library's original `eval(attrValue)` call with a local `__outiiil_safeParseAttr()` helper (JSON.parse with raw-string fallback). Any future update of this vendored lib must re-apply the patch.
- **`public/js/content.js`** uses `chrome.runtime.getURL` (not the MV2 `chrome.extension.getURL`) and reads `VERSION` dynamically from `chrome.runtime.getManifest().version` instead of hardcoding it.

Firefox exposes `chrome.*` as an alias for `browser.*`, so `chrome.runtime.*` works on both targets without polyfill.

## Firefox publication specifics

- `browser_specific_settings.gecko.id` is `toolzzz@guiepi.github.io` — this ID must stay stable across uploads to AMO (changing it breaks updates for installed users).
- `strict_min_version: "140.0"` — aligned with the Firefox version that introduced `data_collection_permissions`. Lower values trigger an AMO warning saying the privacy declaration is ignored on older Firefox.
- AMO requires non-minified sources for review — keep the vendored libs in `public/js/lib/` readable (they currently are).
- AMO requires `browser_specific_settings.gecko.data_collection_permissions` since November 2025 (will be enforced for all extensions in 2026). Currently declared as `required: ["none"]` which is accurate — the extension only reads fourmizzz.fr pages locally. If you add a feature that transmits data to an external server, you MUST update this declaration (values like `websiteContent`, `websiteActivity`, etc.) or AMO will reject the submission.
- `manifest.author` must be a **string** on AMO (not the `{ email: string }` object form that Chrome accepts). WXT's TS types enforce the object form, so the config has a targeted `@ts-expect-error` directive on that line.

## Commit Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/).

Format: `<type>(<optional scope>): <description>`

**Types:** `feat` (new feature), `fix` (bug fix), `refactor`, `perf`, `style`, `test`, `docs`, `build`, `ops`, `chore`

**Rules:**
- Use imperative present tense: "add" not "added"
- Do not capitalize first letter
- No period at the end
- Breaking changes: add `!` before `:` (e.g., `feat!: remove endpoint`) and `BREAKING CHANGE:` in footer

**Examples:**
- `feat: add email notifications on new direct messages`
- `fix(popup): prevent save when not connected`
- `build: update dependencies`
- `chore: init`
- `build(release): bump version to 0.2.2`

## License

GPL-3.0, inherited from upstream. Any derivative work (including further forks) must remain GPL-3.0 and preserve attribution to the original author (Hraesvelg / Freddy) in the manifest's `author` field and in the README credits.
