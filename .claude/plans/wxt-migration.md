# Migrate Toolzzz to idiomatic WXT

## Context override

Read `CLAUDE.md`, then note that its **Architecture** section describes the
_current_ unconventional setup, which this task replaces. The following
statements in `CLAUDE.md` are obsolete for this task and must not constrain you:

- "Do not assume standard WXT conventions apply"
- "Manifest is hand-written, not generated from entrypoints"
- "`entrypoints/background.ts` is a required no-op stub — Do not delete it"
- "Content script load order matters (files are concatenated)"

You will rewrite that section in Phase 5. Everything else in `CLAUDE.md`
(Firefox/AMO constraints, MV3 CSP patches, commit convention, formatting rules,
release pipeline) still applies.

The `.claude/skills/wxt/` skill contains the WXT rules that matter for this
project. Read it before touching `wxt.config.ts` or any entrypoint. For anything
it does not cover, fetch https://wxt.dev/llms-full.txt (relevant sections:
Project Structure, Entrypoints, Content Scripts, Assets, Manifest, Vite,
Storage, Publishing) and https://wxt.dev/guide/resources/upgrading for the
0.20 → 0.21 breaking changes. The target is the **latest WXT 0.21.x**; the
upgrade is its own phase (0.5) so that breakage is attributable.

## Decisions already made — do not re-litigate

**Architecture**

- `srcDir` becomes `"src"` (remove `srcDir: "."`).
- Two content scripts, both matching `http://*.fourmizzz.fr/*`:
  - `src/entrypoints/bootstrap.content.ts` — `runAt: "document_start"`, no
    imports, keeps its inline `<style>` injection and `hashchange` listener
    exactly as today (use `ctx.addEventListener(window, "hashchange", …)`).
  - `src/entrypoints/game.content/index.ts` — default `runAt`, imports the
    vendor bundle first, then the stylesheets, then the app.
- Delete `entrypoints/background.ts` once the content scripts exist; it was
  only a workaround for "No entrypoints found".
- Auto-imports are **disabled** (`imports: false` in `wxt.config.ts`). Every
  dependency is an explicit `import`; WXT APIs come from `#imports`. The whole
  point of this migration is to kill implicit globals — auto-imports would
  reintroduce them under another name.
- Content script UI mode: **integrated**, direct DOM manipulation as today.
  The extension mutates the game's own DOM (adds `<li>` to `#menuAlliance`,
  attaches tooltips to `.tooltip_boite_info`, runs DataTables on native
  tables, positions jQuery UI widgets with `offset()` against page elements,
  reuses the game's CSS classes). A shadow root breaks all of that. Do not use
  `createShadowRootUi`. `createIntegratedUi` is optional and not required.
- Manifest: keep `manifestVersion: 3`, `browser_specific_settings` (gecko id,
  `strict_min_version`, `data_collection_permissions`, `gecko_android`),
  `icons`, `action`, `host_permissions`, `homepage_url`, and the `author`
  string with its `@ts-expect-error` **exactly as they are**. Remove the manual
  `content_scripts` block — WXT generates it from the entrypoints.
  `web_accessible_resources` keeps `images/*` and `images/**` only; drop
  `js/*` and `css/*` (they no longer exist as static files).
- Replace every `chrome.*` call with WXT's `browser` (from `#imports`).
  `chrome.runtime.getURL("images/x.png")` → `browser.runtime.getURL("/images/x.png")`.

**Vendored libraries**

- Keep the **exact same versions**. No bumps of any runtime dependency. The
  only upgrades in this task are WXT itself and its peer dependencies
  (`vite`, `typescript`, `web-ext`), done in Phase 0.5.
- Prefer npm packages pinned to the current versions: `jquery@3.2.1`,
  `jquery-ui@1.12.1`, `highcharts@6.0.7` (+ `highcharts/highcharts-more`,
  `highcharts/modules/data`, `highcharts/modules/stock`), `datatables.net@1.10.16`,
  `moment@2.19.1`, `moment-duration-format`, `numeral@2.0.6`,
  `clipboard@1.7.1`, `globalize@0.1.1`. If a package is not published at that
  exact version, or its npm build differs from the vendored file, keep the
  vendored copy under `src/vendor/` instead — parity beats purity.
- `public/js/lib/jquery-datetimepicker_1.6.3.js` is `jquery-ui-timepicker-addon`
  with the MV3 anti-`eval` patch (`__outiiil_safeParseAttr`). It stays vendored
  as-is under `src/vendor/`. Bundling does not lift the CSP restriction.
- The locale files (`numeral-locale-fr`, `moment-locale-fr`,
  `globalize-locale-fr`) and `jquery-ui-touch-punch`, `jquery-toast` stay
  vendored if their npm equivalents are not byte-identical.
- jQuery plugins expect `window.jQuery`. Create `src/vendor/index.ts` that does
  `import $ from "jquery"; (window as any).jQuery = (window as any).$ = $;`
  first, then side-effect-imports every plugin **in the same order as the
  current manifest**. This file is the first import of `game.content/index.ts`.
- `content.js` currently appends a `<link>` to
  `http://code.jquery.com/ui/1.12.1/themes/humanity/jquery-ui.min.css` at
  runtime. Remove that; vendor the CSS file into `src/assets/` and import it
  with the other stylesheets. Fix any `url(images/…)` paths inside it.
- Vendored files are excluded from oxfmt (`.oxfmtrc.json`) — update the
  exclusion glob to the new path.

**Naming**

- Final target is **full English** identifiers, file names and comments, with
  a `GLOSSARY.md` (FR → EN) written and approved _before_ the rename (Phase 3).
- User-facing French strings, regexes that match game text, game URLs
  (`/Reine.php`, `/laboratoire.php`…), DOM ids/classes `o_*`, and CSS
  selectors are never renamed. They are data, not identifiers.
- A route table in `src/pages/index.ts` (`"/Reine.php" → QueenPage`) is the
  only place where game URLs meet module names.

**Persistence**

- Final backend is `wxt/utils/storage` (Phase 4). Phases 1–3 keep
  `localStorage` behind `src/storage/index.ts`, a synchronous wrapper and the
  single call site for all persistence.
- Storage keys `outiiil_*` are frozen through Phase 3. Phase 4 defines the new
  key scheme: `local:<server>:<name>` for server-scoped items,
  `local:global:<name>` for extension-wide ones. No `toolzzz_`/`outiiil_`
  prefix — `browser.storage.local` is already extension-private.
- Server = `location.hostname.split(".")[0]` (today's `Utils.serveur`). Data
  today is isolated per server only because `localStorage` is per-origin;
  the new scheme must preserve that isolation explicitly.

## Phase 0 — baseline and inventory (no code changes)

1. Run `bun run build` and `bun run build:firefox` on the current code. Copy
   `.output/chrome-mv3/manifest.json` and `.output/firefox-mv3/manifest.json`
   to `/tmp/baseline/` for later diffing.
2. Write `docs/migration-inventory.md` (`docs/` is gitignored — fine) with:
   - every identifier assigned without `let`/`const`/`var` (implicit global),
     with `file:line` — grep `^\s*[A-Za-z_$][\w$]* = ` in `public/js`
     excluding `lib/`;
   - for each file, the cross-file symbols it depends on (classes, constants
     from `content.js`, `Utils` methods, `monProfil`);
   - every `localStorage` call site (~35 expected) with the key used, and a
     classification of each key as `server` or `global`. Default to `server`
     unless the key is clearly independent of the account
     (`outiiil_lastSeenVersion` is `global`; treat `outiiil_parametre` as
     `server` unless I say otherwise);
   - every place that listens to the `storage` DOM event or otherwise reacts
     to cross-tab changes (probably none — say so explicitly);
   - every `chrome.*` call site;
   - every runtime `fetch`/`$.ajax`/`$.get` and every external URL.
3. Show me the inventory and **STOP**. I will confirm before Phase 1.

## Phase 0.5 — upgrade WXT 0.20 → latest 0.21 (on the current code)

Do this **before** restructuring, so a build failure here is a WXT problem
and nothing else. Follow https://wxt.dev/guide/resources/upgrading, section
v0.20.0 → v0.21.0. Concretely:

- `bun add -D wxt@latest vite web-ext --ignore-scripts` (vite is now a
  required peer; web-ext is optional and only needed to auto-open the dev
  browser — install it, we use `bun run dev`). `typescript` ^6 already
  satisfies `>=5.4`. Then `bun run wxt prepare`.
- Node **>= 22** is now required. `bun run wxt` executes the `wxt` bin with
  Node, not Bun. Update `.github/workflows/*.yml` to add
  `actions/setup-node@v4` with `node-version: 22` (GitHub runners default
  to Node 20). Update the CLAUDE.md note about the oxfmt/Node 20.20.2 bug
  if it no longer applies.
- `.wxt/tsconfig.json` is now strict with `verbatimModuleSyntax`,
  `noUncheckedIndexedAccess`, `noImplicitOverride`, `module: "Preserve"`.
  Today's only TS file is `wxt.config.ts`; make `bun run compile` pass.
- Sources zip: `zip.includeSources` / `excludeSources` are now a plain
  allowlist. Set them explicitly in `wxt.config.ts` (`public`, `entrypoints`,
  `package.json`, `bun.lock`, `tsconfig.json`, `wxt.config.ts`, `README.md`,
  `LICENSE`; later `src` in Phase 1), run `bun run zip:firefox` and check the
  printed file list. AMO must be able to rebuild from it.
- Zip filenames: defaults changed to `{{packageVersion}}`; for production
  builds the names the release workflows expect
  (`toolzzz-<version>-chrome.zip`, `-firefox.zip`, `-sources.zip`) are
  unchanged — verify by running both zip scripts.
- `globalName` now defaults to `false` for content scripts — irrelevant
  for us, nothing reads a return value.
- `wxt submit init` now exists; the CLAUDE.md note saying to use
  `bunx publish-extension init` is obsolete.
- Verify: `bun run build`, `bun run build:firefox`, both zips, diff both
  manifests against `/tmp/baseline` (must be identical), `bun run dev` loads.
  Commit `build: upgrade wxt to 0.21`. **STOP**.

> Separate from this migration but time-critical: the Chrome release
> workflow uses the CWS v1 API (`CHROME_REFRESH_TOKEN`). Per the WXT 0.21
> notes, v1 stops working on **15 October 2026**. After Phase 0.5, run
> `bun run wxt submit init`, choose CWS **v2** (service account), and update
> the GitHub Secrets and `release-chrome.yml` accordingly. Flag this to me;
> do not silently change release credentials.

## Phase 1 — ESM modularisation (JS stays JS, names stay French)

Goal: identical behaviour, built by Vite through WXT entrypoints.

- Layout:
  ```
  src/
    entrypoints/bootstrap.content.ts
    entrypoints/game.content/index.ts
    vendor/            index.ts + any lib kept vendored
    assets/            outiiil.css, toasts.css, datatables.css, jquery-ui-humanity.css
    constants/         the constants at the top of content.js, split by domain
    data/              couts.js, menuRapide.js
    models/            class/*
    boxes/             boite/*
    pages/             page/* + index.ts route table
    lib/               Utils and helpers
    storage/index.ts   sync localStorage wrapper
  ```
  Nothing but entrypoints lives directly under `src/entrypoints/`.
- Convert every file to an ES module with explicit named imports/exports.
  Every implicit global from the inventory becomes a declared local or an
  explicit export. `monProfil` (read from ~29 files) becomes a module with
  `getProfile()` / `setProfile()`; do not export a mutable `let`.
- `src/storage/index.ts`: `getJSON<T>(key) / setJSON(key, value) / remove(key)`
  around `localStorage`, identical semantics (same keys, same `JSON.parse`
  fallbacks). Replace all direct calls. No behaviour change.
  Next to it, `serverKey()` = `location.hostname.split(".")[0].toLowerCase()`,
  used **only** for storage keys (Phase 4). Do not touch `Utils.serveur`
  (uppercase, also builds request URLs) before Phase 4.
- `src/storage/session.ts`: same shape (`getJSON / setJSON / remove` +
  raw `get / set`) around `sessionStorage`, single call site for the six
  tab-scoped flags (`outiiil_floodPuisReplacer`, `outiiil_annulationEchec`,
  `outiiil_affectationTentee`, toast dedup key, scroll-restore key).
  `sessionStorage` stays the backend forever: WXT's `session:` area is
  extension-wide, not tab-scoped, so it is not a substitute. Phase 4 never
  touches this file.
- Cycles found in the inventory (`Joueur/Alliance ↔ BoiteRadar`,
  `Armee ↔ AttaqueLancee`, `Combat → BoiteRapport`, `Commande →
BoiteCommande`) are method-body-only and tolerable. Put a one-line
  comment at each cycle edge so nobody "fixes" it into a top-level use.
- Watch for circular imports between models/boxes/pages. Vite tolerates most
  cycles, but `class X extends Y` across a cycle throws at evaluation time —
  move the shared base class into its own file when that happens.
- Everything that ran at top level in `content.js` (locale setup, DataTables
  sort plugins, the `if (not on login page)` guard, the `Promise.all`
  bootstrap, the route switch) moves inside `main(ctx)`. Nothing that touches
  the DOM or `browser.*` may run at module top level — WXT imports
  entrypoints in Node at build time.
- Verify:
  - `bun run build` and `bun run build:firefox` succeed;
  - diff both generated manifests against `/tmp/baseline`. Expected
    differences: `js`/`css` paths, removed `js/*`/`css/*` WAR entries. Anything
    else is a bug — fix it before continuing;
  - `bun run dev` → open the game → zero `ReferenceError` in the console;
  - hunt launcher (Ressource → boîte Chasse): fauna images
    (`browser.runtime.getURL("/images/faune/<slug>.png")`, dynamic path)
    render — confirms the `images/**` WAR entry still covers them;
  - write `.claude/plans/wxt-smoke-checklist.md`: one section per game page (Reine,
    Attaquer, Alliance incl. `#carte`, Messagerie, Commerce, Compte,
    Construction incl. `#cout`, Description, Forum, Chat, Laboratoire,
    Profil, Ressource, Armee) listing what Toolzzz adds there, so I can test.
- Commit `refactor!: migrate to WXT entrypoints and ES modules`. **STOP**.

## Phase 2 — TypeScript

- Rename `.js` → `.ts`. `tsconfig.json` extends `.wxt/tsconfig.json` with
  `"strict": false`, `"noImplicitAny": false`, `"noUncheckedIndexedAccess":
false`, `"allowJs": false`. Keep `verbatimModuleSyntax` on (use
  `import type` where tsc asks). Tightening is Phase 5.
- Add `@types/jquery`, `@types/jqueryui`, `@types/datatables.net`,
  `@types/numeral`; `moment` ships its own. Declare vendored plugins in
  `src/vendor/types.d.ts` (`declare module` stubs with `any`).
- Fix only what `bun run compile` reports. Use `any` where a real type would
  be a research project. Type the storage wrapper generically.
- Verify: `bun run compile` clean, both builds clean, smoke checklist on
  two pages. Commit `refactor: convert to TypeScript`. **STOP**.

## Phase 3 — English identifiers

1. Write `GLOSSARY.md` first: FR → EN for every class, method, variable,
   file name and directory you intend to rename. One line per term. Propose
   `Chasse → Hunt`, `Convoi → Convoy`, `Reine → Queen`, `Boite → Box`,
   `Ponte → Laying`, `Commande → Order`, `Rapport → Report`, `Joueur → Player`,
   `Parametre → Setting`, `Armee → Army`, `Combat → Battle`… and flag the
   ambiguous ones. Show me the glossary and **STOP** before renaming.
2. After approval: rename identifiers, file names, directories and comments
   only. Do **not** touch user-facing strings, storage keys, DOM ids/classes,
   CSS selectors, game URLs, or regexes that match game text.
3. Build the route table `src/pages/index.ts` if not done in Phase 1.
4. Verify: compile + build clean, `grep` for any remaining French identifier
   not in the glossary. Commit `refactor: rename identifiers to English`.
   **STOP**.

## Phase 4 — Storage on `wxt/utils/storage`

- Add `"storage"` to `manifest.permissions`. This does not change
  `data_collection_permissions` (data stays local).
- Replace the backend of `src/storage/`:
  - one `storage.defineItem` per key, `version: 1`, `fallback` matching the
    shape the code currently assumes, key built from the server at runtime;
  - server-scoped items are created through a factory that takes the server
    name; global items are plain constants;
  - reads become async: hydrate every item once at startup, **before** the
    existing `Promise.all` in `game.content/index.ts`, and expose the
    in-memory snapshot synchronously to the rest of the code. Writes go
    through `setValue`. Keep the public API of `src/storage/` as small as
    possible; the rest of the code must not import `#imports` storage directly.
- One-time import, `src/storage/legacy-import.ts`: on first run per server,
  if the new area has no data for that server and the page `localStorage` has
  `outiiil_*` keys, copy them over, normalising through each item's
  `fallback` (missing fields filled, unknown fields dropped). Log once what
  was imported. This runs in the content script — it is the only context that
  can read the page's `localStorage`. This file is the **only** one allowed
  to reference `outiiil_*` keys. It never deletes the old data. Leave a TODO
  to remove the file after two releases.
- `outiiil_carteAlliance_<SERVEUR>_<TAG>` and `outiiil_carteFiltres_<SERVEUR>_<TAG>`
  embed the server by hand today. The new scheme provides the server
  segment, so the item name drops it: `local:s1:allianceMapCache:<tag>`,
  **not** `local:s1:S1_allianceMapCache`. The legacy import must map both
  forms (uppercase `Utils.serveur` in the old key, lowercase `serverKey()`
  in the new one).
- `src/storage/session.ts` (sessionStorage) is out of scope — leave as is.
- `storage.watch`: the inventory found **no** cross-tab behaviour — do not
  add any.
- Add `unlimitedStorage` **only** if the inventory shows data that can
  plausibly exceed a few MB; justify in the commit body.
- Verify with a real account on two servers, and with a fresh profile (no
  legacy data → fallbacks only). Commit
  `feat!: move persistence to browser.storage.local`. **STOP**.

## Phase 5 — cleanup

- Rewrite the **Architecture** section of `CLAUDE.md` for the new layout
  (standard WXT conventions now apply; entrypoints generate the manifest;
  vendor bundle order; storage layout).
- Update `.claude/skills/ui-primitives` to reference modules instead of
  globals (`monProfil`, `Utils`).
- Update `README.md` / `CONTRIBUTING.md`: bun version, build commands, and a
  "Building from source" paragraph for AMO reviewers.
- Check `.github/workflows/release-*.yml` still work with `src/` (they call
  `wxt zip`; the sources zip must contain `src/`, `public/`, `bun.lock`,
  `package.json`, `wxt.config.ts`, `tsconfig.json` and the vendored libs
  unmodified — run `bun run zip:firefox` and inspect the zip).
- Tighten `tsconfig` to `"strict": true` only if it yields fewer than 50
  errors; otherwise leave a TODO with the count.
- Add `zip.includeSources` entries for `src` (and drop `entrypoints`) if
  not already done in Phase 1; re-check the printed sources list.
- Write `.claude/plans/wxt-migration-followups.md` with everything deferred, including:
  check whether the Firefox build is minified (`.output/firefox-mv3/
content-scripts/game.js`) and decide on `vite: () => ({ build: { minify:
false } })` before the first AMO submission; DOM id rename `o_*` → later;
  legacy-import removal date.

## Rules for the whole task

- One phase per commit, never mixed. Never bump a runtime dependency
  (WXT and its peers in Phase 0.5 are the only exception).
- Never run `git commit --no-verify`.
- If a change might alter behaviour and you are not sure, don't make it —
  list it in `.claude/plans/wxt-migration-followups.md`.
- If you hit a WXT question the skill does not answer, fetch
  `https://wxt.dev/llms-full.txt` and quote the relevant section back to me
  before deciding.
