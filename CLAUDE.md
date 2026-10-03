# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project context

Toolzzz is a browser extension for the French browser game [Fourmizzz.fr](http://www.fourmizzz.fr), fork of [Hraesvelg/Outiiil](https://github.com/Hraesvelg/Outiiil) (GPL-3.0). This is the 3.0 release, migrated from MV2 to MV3 and bundled with [WXT](https://wxt.dev) for dual Chrome + Firefox publication.

All user-facing strings are in French (game domain vocabulary: ponte, chasse, convoi, alliance, etc.).

## Commands

```bash
bun install               # postinstall runs `wxt prepare` + installs husky hook
bun run dev               # dev mode, Chrome
bun run dev:firefox       # dev mode, Firefox
bun run build             # production build → .output/chrome-mv3/
bun run build:firefox     # production build → .output/firefox-mv3/
bun run zip               # zip for Chrome Web Store
bun run zip:firefox       # zip for Firefox AMO
bun run compile           # tsc --noEmit (typecheck only, no emitted files)
bun run format            # oxfmt — writes changes in place
bun run format:check      # oxfmt --check — CI uses this
bun run test:vendor       # build + run the bundle in jsdom: the 18 vendored
                          # libraries expose what they should, main() starts
node scripts/test-storage.mjs   # migration of the 3.x data, per-server keys
bun run smoke:browser     # real Chromium on a real account (see the script's
                          # header for the setup; never runs in CI)
```

No unit test framework and no linter: the three scripts above are the test
suite, and formatting is oxfmt. CI runs `format:check`, `compile`,
`test:vendor` and the storage test.

`smoke:browser` drives Chromium over the DevTools Protocol, navigates (never
clicks) and fails if the extension writes anything to the game. It is the only
check that exercises the pages: the jsdom harnesses stop at the startup
`Promise.all`, which never resolves without network.

## Architecture — read this before touching WXT or the manifest

Standard WXT conventions apply: `srcDir` is `src/`, the manifest is generated
from the entrypoints, and the bundler builds ES modules. (Up to 3.9.1 none of
that was true — the manifest listed 58 concatenated scripts by hand. If you
find notes saying so, they describe the old layout.)

### Layout

```
src/
  entrypoints/
    bootstrap.content.ts      document_start: html classes, inline <style>
    game.content/
      index.ts                the entrypoint: vendor → stylesheets → app
      main.ts                 startup, moved out of index.ts so the entrypoint
                              stays importable by WXT under Node
  vendor/        index.ts + lib/ — the 18 third-party scripts, byte-identical
  assets/        the four stylesheets + the jQuery UI theme images
  constants/     game constants, split by domain, re-exported by index.ts
  data/          costs.ts, quickMenu.ts
  models/        domain classes (Player, Army, Battle, Hunt, Convoy, Order…)
  boxes/         the floating panels (Box and its subclasses, Dock, RadarBox…)
  pages/         one module per game page + index.ts, the route table
  lib/           Utils, version
  storage/       the persistence layer (see below)
```

`public/` holds only images now; they need `web_accessible_resources` and
`browser.runtime.getURL("/images/…")` to be reachable from a content script.

### Two content scripts

`bootstrap.content.ts` runs at `document_start` with no dependency: it puts
classes on `<html>` and injects a small inline stylesheet, so the game's own
markup never flashes before ours replaces it. `game.content/` runs at the
default time and imports, in this order: `~/vendor`, then the stylesheets,
then `./main`. The order is load-bearing — see `src/vendor/index.ts`.

Nothing may touch the DOM or `browser.*` at module level: WXT imports each
entrypoint under Node at build time to read its options, so anything outside
`main()` runs there too.

### Vendored libraries are plain scripts, not modules

The 18 files in `src/vendor/lib/` are UMD/IIFE scripts from 2016-2018 that put
themselves on `window`. A Vite plugin in `wxt.config.ts`
(`toolzzz:vendor-scripts`) wraps each one so it executes as a classic script;
without it rolldown treats them as CommonJS and the DataTables combo — six UMD
wrappers in one file — never runs. `bun run test:vendor` executes the built
bundle in jsdom and checks every global they are supposed to expose.

Keep them byte-identical to what AMO reviewers can diff against upstream, and
re-apply the `__outiiil_safeParseAttr` patch if the datetimepicker is updated.

### Persistence

`src/storage/` is the only place that talks to `browser.storage.local`. Keys
are `local:<server>:<name>`, `local:<server>:<name>:<tag>` for the
alliance-scoped ones and `local:global:<name>`; the server segment is
lower-case, unlike `Utils.server`, which is upper-case because it also built
request URLs. Everything is hydrated once at the top of `main()` and read
synchronously from that snapshot afterwards, because the rest of the code
reads settings while rendering.

`src/storage/legacy-import.ts` copies the `outiiil_*` data of 3.x once per
server and never deletes it. It is the only file allowed to name those keys,
and it goes away two releases after 4.0.

`sessionStorage` stays as it is (`src/storage/session.ts`): those six flags
are per-tab, and WXT's `session:` area is extension-wide.

### Single domain

`*://*.fourmizzz.fr/*` (http + https) is the only host in both `host_permissions` and `content_scripts.matches`. The upstream Outiiil v2 also relied on a companion backend at `outiiil.fr` (crowdsourced map data, player/alliance historique, Traceur POST endpoint). That backend is dead — the fork removes all of it in 3.0. If you see mentions of outiiil.fr in old branches, PRs, or issue history, they are stale and should not be re-introduced.

The `data_collection_permissions.required: ["none"]` declaration in the manifest depends on this: the extension no longer transmits any data anywhere, only reads fourmizzz.fr pages locally.

## MV3 CSP constraints

The migration from MV2 to MV3 tightened CSP. Two non-obvious patches exist:

- **`src/vendor/lib/jquery-datetimepicker_1.6.3.js`** replaces the library's original `eval(attrValue)` call with a local `__outiiil_safeParseAttr()` helper (JSON.parse with raw-string fallback). Any future update of this vendored lib must re-apply the patch.
- the extension uses WXT's `browser.*` (never the `chrome` global) and reads `VERSION` from `browser.runtime.getManifest().version` (`src/lib/version.ts`) rather than hardcoding it.

Firefox exposes `chrome.*` as an alias for `browser.*`, so `chrome.runtime.*` works on both targets without polyfill.

## Firefox publication specifics

- `browser_specific_settings.gecko.id` is `toolzzz@guiepi.github.io` — this ID must stay stable across uploads to AMO (changing it breaks updates for installed users).
- `strict_min_version: "142.0"` — Firefox **142** is when `data_collection_permissions` is honored on **Firefox for Android** (desktop got it earlier, but AMO's review surfaces an Android-specific warning if `strict_min_version` is below 142). Lower values let AMO accept the upload but warn that the privacy declaration is ignored on older Firefox/Android.
- AMO requires non-minified sources for review — keep the vendored libs in `src/vendor/lib/` readable (they currently are).
- AMO requires `browser_specific_settings.gecko.data_collection_permissions` since November 2025 (will be enforced for all extensions in 2026). Currently declared as `required: ["none"]` which is accurate — the extension only reads fourmizzz.fr pages locally. If you add a feature that transmits data to an external server, you MUST update this declaration (values like `websiteContent`, `websiteActivity`, etc.) or AMO will reject the submission.
- `manifest.author` must be a **string** on AMO (not the `{ email: string }` object form that Chrome accepts). WXT's TS types enforce the object form, so the config has a targeted `@ts-expect-error` directive on that line.

## Formatting

oxfmt (Rust-based, Prettier-compatible output) is configured via `.oxfmtrc.json`. Key points:

- **`src/vendor/lib/` is excluded** — vendored upstream code (jQuery, Highcharts, DataTables, etc.) must not be reformatted. This ties into the AMO requirement for non-minified, auditable sources and preserves the `__outiiil_safeParseAttr` patch in `jquery-datetimepicker_1.6.3.js`.
- **Pre-commit hook** (husky + lint-staged, config in `package.json`) auto-formats staged files on `git commit`. Installed automatically via the `prepare` script when contributors run `bun install`.
- **CI** (`.github/workflows/ci.yml`) runs `format:check` + `compile` on every push and PR to `master`. Unformatted code fails the check and blocks merge (if branch protection is enabled).

If you modify files that oxfmt would reformat, let the pre-commit hook handle it — don't skip it with `--no-verify`.

Note: oxfmt's `.ts` config loader used to break in CI on Node 20 (version-check bug: 20.20.2 read as not matching `^20.19.0`). CI now runs Node 22 (required by WXT 0.21) so that bug is moot, but there is no reason to switch — stay on `.oxfmtrc.json`.

## Release pipeline

Releasing is split into two independent workflows that both trigger on `v*.*.*` tag push (and `workflow_dispatch`):

- `.github/workflows/release-chrome.yml` builds the Chrome zip, submits it to the Chrome Web Store, and attaches the Chrome zip to the GitHub Release.
- `.github/workflows/release-firefox.yml` builds the Firefox zip, submits it (with the sources zip) to AMO, and attaches the Firefox zip + sources zip to the GitHub Release.

Both run in parallel and upload to the **same** GitHub Release for the tag (`softprops/action-gh-release@v2` upserts), so a failure in one store doesn't block the other and each can be re-run independently.

Submission uses **`wxt submit`** (a thin wrapper around the `publish-extension` package). Both extensions are published as **listed** store entries — users install from the official stores, not from GitHub Releases. The GitHub Release is kept as an archive of the exact artefacts uploaded to the stores (useful for audit and rollback context).

To regenerate credentials locally without committing them, run `bun run wxt submit init` — it walks through the OAuth/JWT flow and writes to `.env.submit` (gitignored). Then copy each value into the corresponding GitHub Secret.

Required GitHub Secrets:

**Chrome Web Store** — OAuth client of type "Desktop" in Google Cloud Console → APIs & Services → Credentials. The OAuth consent screen must have your developer Google account on the test users list (or the app published) for the refresh-token flow to succeed.

- `CHROME_EXTENSION_ID` — the public store ID (visible in the store URL)
- `CHROME_CLIENT_ID`
- `CHROME_CLIENT_SECRET`
- `CHROME_REFRESH_TOKEN`

**AMO** — from https://addons.mozilla.org/developers/addon/api/key/.

- `FIREFOX_EXTENSION_ID` — the gecko ID (`toolzzz@guiepi.github.io`)
- `FIREFOX_JWT_ISSUER`
- `FIREFOX_JWT_SECRET`

(Secret names match the env-var names that `publish-extension` expects, and what `wxt submit init` writes to `.env.submit`.)

Note: the Chrome secrets above are the CWS **v1** API (refresh-token flow). Google shuts v1 down on **15 October 2026**; `publish-extension` v5 (bundled with WXT 0.21) supports the v2 API (service account). Switching is a credential change — `wxt submit init`, choose v2, replace the `CHROME_*` secrets and the env block in `release-chrome.yml` — and must be done deliberately by the maintainer, not as a side effect of another change.

## Project-specific Claude skills

Quatre skills sont versionnés dans `.claude/skills/` et s'auto-chargent quand pertinent :

- **`analyze-fourmizzz`** — méthodologie pour analyser un scénario du jeu via capture HAR : guide la capture côté navigateur, puis génère un rapport structuré du protocole client/serveur. À déclencher quand tu veux comprendre comment une feature du jeu communique avec le backend.
- **`ui-primitives`** — inventaire des classes CSS et patterns réutilisables (tableaux, boutons, jQuery UI widgets, toasts, données globales `monProfil`/`Utils`/`Joueur.rechercher`). À consulter avant d'écrire du HTML/CSS dans une Boite ou une Page — la plupart des choses qu'on serait tenté d'ajouter existent déjà.
- **`release-notes`** — format et méthodologie pour rédiger les release notes Toolzzz (audience joueurs FR, pas devs). Structure 3 sections (Nouveautés / Corrections / Sous le capot), template footer avec liens stores. À consulter avant `gh release create` ou `gh release edit`.
- **`wxt`** — règles, conventions et pièges de WXT 0.21 (entrypoints, manifest généré, `browser.*`, `wxt/utils/storage`, assets, zip/submit, double cible Chrome + Firefox). À charger avant de toucher `wxt.config.ts`, un entrypoint ou le manifest. Le plan de migration vers la structure WXT idiomatique est dans `.claude/plans/wxt-migration.md`.

Le dossier `docs/` est gitignored (workspace personnel d'exploration : HAR, scenario reports). Tout ce qui a une valeur durable est promu en skill ou intégré ici.

## AI-assisted work on WXT

WXT publishes LLM-friendly documentation dumps:

- https://wxt.dev/llms.txt — indexed pointer file
- https://wxt.dev/llms-full.txt — full documentation in a single file, optimized for LLM context windows

When a WXT-specific question comes up (config options, CLI flags, lifecycle, module APIs), prefer fetching `llms-full.txt` over scraping individual doc pages — it's the authoritative source in one shot and avoids the cost of multiple fetches.

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

## Pull request body

Solo project — pas de section « Test plan » dans le body. Les vérifs se font de vive voix entre Claude et le mainteneur avant l'ouverture de la PR. Garder uniquement la section `## Summary` (2-3 bullets concis).

## License

GPL-3.0, inherited from upstream. Any derivative work (including further forks) must remain GPL-3.0 and preserve attribution to the original author (Hraesvelg / Freddy) in the manifest's `author` field and in the README credits.
