# Content scripts in WXT

## Definition and options

```ts
// entrypoints/example.content.ts   (or entrypoints/example.content/index.ts)
export default defineContentScript({
  matches: ["*://*.example.com/*"],   // required
  excludeMatches, includeGlobs, excludeGlobs,
  allFrames, matchAboutBlank, matchOriginAsFallback,
  runAt: "document_start" | "document_end" | "document_idle",
  world: "ISOLATED" | "MAIN",
  include: ["firefox"], exclude: ["chrome"],   // per-browser build filtering
  cssInjectionMode: "manifest" | "manual" | "ui",
  registration: "manifest" | "runtime",
  main(ctx) { … },                   // may be async
});
```

Any of `matches`, `runAt`, `world`, … can be an object keyed by browser
(`{ chrome: …, firefox: … }`).

Only code inside `main()` runs in the browser. WXT imports the file in Node
to read the options, strips `main`, and tree-shakes the rest — so module-level
side effects are either executed in Node or removed. Put setup in `main`.

## The context object `ctx`

Browsers do not stop content scripts when the extension is reloaded,
updated or disabled; orphaned scripts then throw
`Extension context invalidated`. `ctx` tracks that:

- `ctx.isValid` / `ctx.isInvalid`
- `ctx.addEventListener(target, event, cb)`, `ctx.setTimeout`,
  `ctx.setInterval`, `ctx.requestAnimationFrame`, … — all no-op once invalid.
- `ctx.onInvalidated(cb)` for cleanup.

Prefer these over the raw window APIs for anything long-lived.

## CSS

Import the stylesheet from the entrypoint:

```ts
import "./style.css";
export default defineContentScript({ … });
```

- `cssInjectionMode: "manifest"` (default): bundled CSS is added to this
  content script's `css` array in the manifest. Injected by the browser at
  the script's `run_at`.
- `"manual"`: nothing is injected; you load
  `browser.runtime.getURL("/content-scripts/<name>.css")` yourself.
- `"ui"`: CSS is fetched and injected inside the shadow root created by
  `createShadowRootUi`; required for that helper.

CSS-only content script (no JS): create `entrypoints/foo.content.css` and
push an entry in `hooks["build:manifestGenerated"]` with
`css: ["content-scripts/foo.css"]`.

## UI helpers — choosing a mode

| Mode        | Style isolation | Event isolation | HMR | Same JS context as page |
| ----------- | :-------------: | :-------------: | :-: | :---------------------: |
| Integrated  |       no        |       no        | no  |           yes           |
| Shadow Root |       yes       |    optional     | no  |           yes           |
| IFrame      |       yes       |       yes       | yes |           no            |

Decision rule:

- The script **modifies the host page** (injects rows into its tables,
  adds menu items with the site's classes, positions widgets relative to
  page elements, reads/writes its DOM) → **Integrated**, or plain DOM code
  with no helper at all. A shadow root would cut you off from the page's
  CSS and break `offset()`-style positioning and delegated events.
- The script adds a **self-contained panel** that must not inherit the
  page's CSS (and vice-versa) → **Shadow Root**.
- The panel is a full app that benefits from HMR and never needs the page's
  DOM → **IFrame** (needs the HTML page in `web_accessible_resources`).

```ts
const ui = createIntegratedUi(ctx, {
  position: "inline" | "overlay" | "modal",
  anchor: "#target",              // selector, element, or () => element
  append: "last" | "first" | "before" | "after" | "replace",
  onMount(container) { … return app },
  onRemove(app) { … },
});
ui.mount();        // or ui.autoMount() to (un)mount as the anchor appears/disappears
```

`createShadowRootUi(ctx, { name: "my-ui", … })` is async and needs
`cssInjectionMode: "ui"`. It resets inherited styles with `all: initial`
but not the root font size, so `rem`-based CSS scales with the host page.

## Main world

`world: "MAIN"` is Chromium-only and has no extension API. Preferred:
keep an isolated content script and `injectScript("/name.js", { keepInDom })`
an **unlisted script** (`entrypoints/name.ts` with `defineUnlistedScript`),
listed in `web_accessible_resources`. Communicate via `CustomEvent` on the
returned `<script>` element or `document.currentScript`. MV3 injection is
synchronous at `run_at`; MV2 is async (fetch + inline).

## SPAs / hash navigation

Content scripts run on full loads only. Listen for WXT's synthetic event:

```ts
ctx.addEventListener(window, "wxt:locationchange", ({ newUrl }) => {
  if (new MatchPattern("*://*.example.com/watch*").includes(newUrl)) …
});
```

Plain `hashchange` works too for `#fragment` routing.

## `registration: "runtime"`

Removes the script from `content_scripts` and lets the background inject it
with `browser.scripting.executeScript({ files: ["content-scripts/x.js"] })`.
The value returned from `main()` is the script result.

## Bundling facts

- One IIFE per content script entrypoint, every import inlined. No shared
  chunks between content scripts; two scripts importing the same lib ship
  it twice.
- 0.21: the IIFE is anonymous by default (`globalName: false`). If a
  script's `main()` return value must be read (e.g. via
  `scripting.executeScript` → `InjectionResult.result`), set
  `globalName: true` on that entrypoint.
- No HMR; dev mode reloads the extension and the tab.
- Module code is strict-mode ESM before bundling: implicit globals
  (`foo = 1` without a declaration) throw at runtime.
- Libraries that register on a global (`window.jQuery`) must see it before
  they execute: create `vendor/index.ts` that sets the global on line 1 and
  side-effect-imports the plugins in order; import that file first in the
  entrypoint.
