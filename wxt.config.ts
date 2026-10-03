import { defineConfig } from "wxt";
import type { Plugin } from "vite";

/**
 * Fait exécuter les bibliothèques tierces de `src/vendor/lib/` comme des
 * scripts classiques, pas comme des modules.
 *
 * Ce sont des UMD / IIFE d'époque (jQuery 3.2, jQuery UI 1.12, Highcharts 6,
 * un combo DataTables généré par le download builder…) qui sondent
 * `typeof module` / `exports` / `define` / `require` et se rabattent sur
 * `window` (souvent via `this` au niveau module). rolldown y voit du
 * CommonJS : il tente de résoudre les `require('../moment')` et, pour le
 * combo DataTables (6 wrappers UMD dans un fichier), ne garde que le dernier
 * `module.exports` sans jamais appeler les factories → `$.fn.dataTable`
 * n'existe pas. L'enveloppe ci-dessous masque ces quatre identifiants par
 * des paramètres (donc plus de détection CJS ni de résolution), donne
 * `this === window` au code d'origine et marque le fichier comme ESM. Les
 * fichiers restent identiques à l'octet sur le disque — c'est ce que les
 * relecteurs d'AMO reçoivent dans le zip des sources.
 *
 * Vérifié par `bun run test:vendor` (scripts/test-vendor.mjs).
 */
function vendorScripts(): Plugin {
  return {
    name: "toolzzz:vendor-scripts",
    enforce: "pre",
    transform(code, id) {
      if (!/\/src\/vendor\/lib\/[^/]+\.js$/.test(id)) return null;
      return {
        code: `(function (module, exports, require, define) {\n${code}\n}).call(window);\nexport {};\n`,
        map: null,
      };
    },
  };
}

// https://wxt.dev/api/reference/wxt/interfaces/InlineConfig.html
export default defineConfig({
  srcDir: "src",
  // Pas d'auto-imports : chaque dépendance est un `import` explicite, les
  // API WXT viennent de `#imports`. Toute la migration consiste à tuer les
  // globales implicites — les auto-imports les réintroduiraient sous un
  // autre nom.
  imports: false,
  manifestVersion: 3,
  vite: () => ({
    plugins: [vendorScripts()],
    build: {
      // Les `url(images/…)` du thème jQuery UI (src/assets/jquery-ui-humanity.css)
      // doivent finir en data: URI : un chemin dans une feuille de content
      // script se résout contre l'origine de la page, pas de l'extension.
      // Les icônes font ≤ 7 Ko ; le reste des CSS est déjà en data: URI.
      assetsInlineLimit: 16384,
    },
    css: {
      // datatables.css contient un hack IE (`*cursor: hand`) que lightningcss
      // refuse de minifier. errorRecovery le retire — il est ignoré par tous
      // les navigateurs ciblés, donc aucun changement de rendu.
      lightningcss: { errorRecovery: true },
    },
  }),
  zip: {
    // Depuis WXT 0.21 le zip sources (AMO) est une allowlist stricte : tout ce
    // qui n'est pas listé ici n'est pas envoyé au reviewer. AMO doit pouvoir
    // rebuilder à l'identique → sources + lockfile + config + README (commandes).
    includeSources: [
      "public/**",
      "src/**",
      "package.json",
      "bun.lock",
      "tsconfig.json",
      "wxt.config.ts",
      "README.md",
      "LICENSE",
    ],
  },
  manifest: {
    name: "Toolzzz",
    description: "Extension pour www.fourmizzz.fr.",
    // version : pas déclarée ici — WXT reprend celle de package.json (source unique,
    // le bump de release ne doit toucher qu'un seul fichier).
    // @ts-expect-error AMO refuse la forme objet; Chrome accepte la string. On s'aligne sur Firefox.
    author: "Hraesvelg",
    homepage_url: "https://github.com/GuiEpi/toolzzz",
    browser_specific_settings: {
      gecko: {
        id: "toolzzz@guiepi.github.io",
        strict_min_version: "142.0",
        data_collection_permissions: {
          required: ["none"],
        },
      },
      // Déclare la compatibilité Firefox for Android pour qu'AMO marque
      // automatiquement chaque nouvelle version comme dispo sur Android,
      // sans avoir à cocher la case à la main à chaque upload.
      gecko_android: {
        strict_min_version: "142.0",
      },
    },
    icons: {
      48: "images/icons/48.png",
      96: "images/icons/96.png",
      128: "images/icons/128.png",
    },
    action: {
      default_icon: "images/icons/48.png",
    },
    // `storage` : persistance des réglages, du radar et des caches dans
    // browser.storage.local (les données restent locales, aucune collecte).
    permissions: ["storage"],
    host_permissions: ["http://*.fourmizzz.fr/*"],
    web_accessible_resources: [
      {
        resources: ["images/*", "images/**"],
        matches: ["http://*.fourmizzz.fr/*"],
      },
    ],
  },
});
