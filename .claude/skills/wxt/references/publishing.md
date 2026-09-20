# Building, zipping, submitting

## Commands

| Command                                                                                      | Effect                                                        |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | --------------------------------------------- |
| `wxt` / `wxt -b firefox`                                                                     | dev mode; launches a browser via `web-ext`, reloads on change |
| `wxt build [-b <browser>] [--mv2                                                             | --mv3] [--mode x]`                                            | production build → `.output/<browser>-mv<N>/` |
| `wxt zip [-b <browser>]`                                                                     | build + `.output/<name>-<version>-<browser>.zip`              |
| `wxt zip -b firefox`                                                                         | additionally `.output/<name>-<version>-sources.zip`           |
| `wxt submit [--dry-run] --chrome-zip … --firefox-zip … --firefox-sources-zip … --edge-zip …` | upload via `publish-extension`                                |
| `wxt submit init` (0.21+) / `bunx publish-extension init` (0.20)                             | interactive credentials → `.env.submit` (gitignored)          |
| `wxt prepare` / `wxt clean`                                                                  | regenerate / delete `.wxt` and `.output`                      |

Default target is `chrome`. `-b edge` reuses the Chrome build.

## Chrome Web Store

`wxt zip` → upload the zip. Two auth generations for `wxt submit`:

- **v1 (legacy, stops working 15 October 2026)**: `CHROME_EXTENSION_ID`,
  `CHROME_CLIENT_ID`, `CHROME_CLIENT_SECRET`, `CHROME_REFRESH_TOKEN`
  (OAuth desktop client + refresh-token flow).
- **v2 (0.21+, `publish-browser-extension` v5)**: a Google service account
  that never expires. Run `wxt submit init` and pick v2 when prompted; it
  writes `.env.submit` with the new variable names — copy them into CI
  secrets and drop the v1 ones.

## Firefox / AMO

- AMO requires a **sources zip** when the shipped code is bundled or
  minified. Reviewers rebuild it and diff against the uploaded extension.
  `wxt zip -b firefox` generates it and (0.21+) prints every file included.
- 0.21 semantics: `zipped = includeSources − excludeSources` (a normal
  allowlist; on 0.20 it was `everything − exclude + include`). Hidden files
  need `zip.dotSources: true`. Declare the list explicitly:

  ```ts
  zip: {
    includeSources: ["src", "public", "package.json", "bun.lock",
                     "tsconfig.json", "wxt.config.ts", "README.md", "LICENSE"],
    excludeSources: ["**/__fixtures__"],
  }
  ```

  Then unzip and check: lockfile, config, sources, vendored libs, and a
  README with **exact** build steps (runtime + package-manager versions,
  `bun install && bun run build:firefox`) must be inside.

- Zip names (0.21 defaults): `{{name}}-{{packageVersion}}-{{browser}}{{modeSuffix}}.zip`
  and `…-sources{{modeSuffix}}.zip`. Production names equal the old
  `{{version}}` ones; dev/custom modes get a suffix. `{{version}}` now means
  `manifest.version` only; `{{versionName}}` is the old behaviour.
- Private npm packages can be bundled into the sources zip
  (`zip.downloadPackages`).
- `browser_specific_settings.gecko.id` must never change once published.
- `data_collection_permissions` is mandatory on AMO uploads (since late
  2025); `required: ["none"]` is only truthful if nothing leaves the browser.
- Firefox builds default to MV2 unless `manifestVersion: 3`.
- Credentials: `FIREFOX_EXTENSION_ID`, `FIREFOX_JWT_ISSUER`,
  `FIREFOX_JWT_SECRET` (from the AMO API keys page).

## Minification and readability

WXT ships Vite defaults meant to pass store review. If a reviewer needs
readable code and you'd rather not rely on the sources rebuild, set
`vite: () => ({ build: { minify: false } })` (optionally only when
`env.mode === "production" && process.env.WXT_BROWSER === "firefox"` or via
the `manifest`/`vite` function's browser argument). Check the actual output
file in `.output/firefox-mv3/content-scripts/` before deciding.

## CI pattern

Two independent workflows on `v*.*.*` tags, one per store, each doing
`bun install` → `bun run zip[:firefox]` → `wxt submit --<store>-zip …`
with secrets as env vars, then attaching the zips to the same GitHub
Release (upsert). A failure in one store never blocks the other.

## Testing an update before publishing

Load `.output/<browser>-mv<N>/` as an unpacked extension over the
installed store version in a throwaway profile to exercise
`runtime.onInstalled` / storage migrations with real data. For Firefox use
`about:debugging` → "Load Temporary Add-on".
