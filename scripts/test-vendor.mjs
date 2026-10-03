/*
 * Vérifie que le bundle du content script principal expose bien les
 * bibliothèques tierces comme avant la migration WXT.
 *
 * Le bundle (.output/chrome-mv3/content-scripts/game.js, produit par
 * `wxt build`) est exécuté dans jsdom sur une fausse page de connexion : le
 * `main()` de l'appli s'arrête à la garde « Connexion », il ne reste que
 * l'évaluation des modules — donc l'exécution des 18 scripts vendorisés à
 * travers le plugin `toolzzz:vendor-scripts`. On sonde ensuite `window`
 * (jQuery, jQuery UI, DataTables + extensions, Highcharts + modules, moment,
 * numeral, Globalize, Clipboard…) avec les mêmes attentes que les fichiers
 * chargés en scripts séparés. Une deuxième passe charge le bundle sur une
 * fausse page de jeu (réseau coupé) pour attraper une ReferenceError au
 * démarrage de `main()`.
 *
 * Usage : bun run test:vendor  (lance `wxt build` puis ce script)
 */
import { JSDOM, VirtualConsole } from "jsdom";
import fs from "node:fs";
import path from "node:path";

const bundle = path.resolve(".output/chrome-mv3/content-scripts/game.js");
if (!fs.existsSync(bundle)) {
  console.error(`Bundle introuvable : ${bundle} — lancer \`bun run build\` d'abord.`);
  process.exit(2);
}
const code = fs.readFileSync(bundle, "utf8");

function load(html, url) {
  // jsdom ne sait pas parser tout le CSS injecté (hacks IE de datatables.css…)
  // et le signale bruyamment : on ne garde que nos propres captures d'erreurs.
  const virtualConsole = new VirtualConsole();
  const dom = new JSDOM(html, {
    runScripts: "outside-only",
    url,
    pretendToBeVisual: true,
    virtualConsole,
  });
  const w = dom.window;
  const errors = [];
  // storage.local en mémoire : depuis la Phase 4, main() hydrate la couche de
  // persistance avant tout le reste, donc l'API doit répondre.
  const memoire = {};
  w.chrome = {
    runtime: {
      id: "fake",
      getURL: (p) => "chrome-extension://fake" + p,
      getManifest: () => ({ version: "0.0.0-test" }),
      onMessage: { addListener() {} },
      lastError: undefined,
    },
    storage: {
      local: {
        get: (keys) => {
          const demande = keys == null ? Object.keys(memoire) : Array.isArray(keys) ? keys : [keys];
          return Promise.resolve(
            Object.fromEntries(demande.filter((k) => k in memoire).map((k) => [k, memoire[k]])),
          );
        },
        set: (entrees) => Object.assign(memoire, entrees) && Promise.resolve(),
        remove: (keys) => {
          for (const k of Array.isArray(keys) ? keys : [keys]) delete memoire[k];
          return Promise.resolve();
        },
        onChanged: { addListener() {}, removeListener() {} },
      },
      onChanged: { addListener() {}, removeListener() {} },
    },
  };
  w.matchMedia = () => ({ matches: false, addEventListener() {}, addListener() {} });
  // Réseau coupé : les $.ajax restent en attente, le Promise.all du démarrage
  // ne résout jamais — on ne teste que l'évaluation des modules et le début
  // de main().
  w.XMLHttpRequest.prototype.send = function () {};
  w.addEventListener("error", (e) => errors.push(e.error?.stack || e.message));
  w.console.error = (...a) => errors.push(a.map(String).join(" "));
  try {
    w.eval(code);
  } catch (e) {
    errors.push("throw au chargement : " + e.stack);
  }
  return { w, errors };
}

process.on("unhandledRejection", (e) => {
  console.log("FAIL rejet non géré :", e?.stack || e);
  process.exitCode = 1;
});

// ---- Passe 1 : page de connexion, sondes vendor -------------------------
const { w, errors: loginErrors } = load(
  `<!doctype html><html><body><div class="boite_connexion_titre">Connexion</div>` +
    `<table id="t"><thead><tr><th>a</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table>` +
    `<input id="s"/></body></html>`,
  "http://s1.fourmizzz.fr/index.php",
);
const $ = w.jQuery;
const checks = {
  "window.jQuery === window.$": !!$ && $ === w.$,
  "jQuery 3.2.1": $?.fn?.jquery === "3.2.1",
  "jQuery UI 1.12.1": $?.ui?.version === "1.12.1",
  "spinner widget": typeof $?.fn?.spinner === "function",
  "datetimepicker addon": typeof $?.fn?.datetimepicker === "function" && !!$?.timepicker,
  "touch-punch ($.support.touch)": typeof $?.support?.touch === "boolean",
  "$.toast": typeof $?.toast === "function",
  "window.Globalize + culture fr-FR": !!w.Globalize && !!w.Globalize.cultures?.["fr-FR"],
  "spinner numberFormat 'i' via Globalize ('1 234' → 1234)": (() => {
    const s = $("#s").spinner({ numberFormat: "i" });
    s.spinner("value", "1 234");
    return s.spinner("value") === 1234;
  })(),
  "window.Clipboard": typeof w.Clipboard === "function",
  "Highcharts 6.0.7": w.Highcharts?.version === "6.0.7",
  "Highcharts more (bubble)": !!w.Highcharts?.seriesTypes?.bubble,
  "Highcharts data": !!w.Highcharts?.Data,
  "Highcharts stock (StockChart)": typeof w.Highcharts?.StockChart === "function",
  "DataTables 1.10.16": $?.fn?.dataTable?.version === "1.10.16",
  "DataTables Buttons": !!$?.fn?.dataTable?.Buttons,
  "DataTables Responsive": !!$?.fn?.dataTable?.Responsive,
  "window.JSZip (export html5)": typeof w.JSZip === "function",
  "DataTable() sur une table": !!$("#t").DataTable(),
  "numeral 2.0.6": w.numeral?.version === "2.0.6",
  "numeral fr : 1234567 → '1M', 1234.5 → '1 234,5'": (() => {
    w.numeral.locale("fr");
    return (
      w.numeral(1234567).format("0a") === "1M" && w.numeral(1234.5).format("0,0.0") === "1 234,5"
    );
  })(),
  "moment 2.19.1": w.moment?.version === "2.19.1",
  "moment fr : 20 septembre 2026": (() => {
    w.moment.locale("fr");
    return w.moment("2026-09-20").format("D MMMM YYYY") === "20 septembre 2026";
  })(),
  "moment-duration-format : 3661s → 1:01:01":
    w.moment?.duration(3661, "s").format?.("h:mm:ss") === "1:01:01",
  "aucune fuite module/exports/require/define sur window": [
    w.module,
    w.exports,
    w.require,
    w.define,
  ].every((x) => x === undefined),
  "aucune erreur au chargement (page de connexion)": loginErrors.length === 0,
};

// ---- Passe 2 : page de jeu, main() jusqu'au Promise.all ------------------
const game = load(
  `<!doctype html><html><body><span id="pseudo">Testeur</span>` +
    `<div id="menuAlliance"><ul><li><a class="boutonMembres">Membres</a></li></ul></div>` +
    `<ul id="menuFourmiliere"></ul></body></html>`,
  "http://s1.fourmizzz.fr/Reine.php",
);
await new Promise((r) => setTimeout(r, 500));
checks["aucune erreur au démarrage de main() (page de jeu)"] = game.errors.length === 0;
checks["main() : classe o_chrome posée (UA non Firefox)"] =
  game.w.document.documentElement.classList.contains("o_chrome");
checks["main() : locales fr actives"] =
  game.w.numeral.locale() === "fr" && game.w.moment.locale() === "fr";
checks["main() : tris DataTables enregistrés"] =
  typeof game.w.jQuery.fn.dataTable.ext.type.order["time-unformat-pre"] === "function";

let failed = 0;
for (const [name, ok] of Object.entries(checks)) {
  console.log(ok ? "PASS" : "FAIL", name);
  if (!ok) failed++;
}
for (const e of [...loginErrors, ...game.errors])
  console.log("  erreur :", String(e).split("\n").slice(0, 3).join("\n    "));
console.log(failed ? `\n${failed} échec(s)` : `\n${Object.keys(checks).length} vérifications OK`);
process.exit(failed || process.exitCode ? 1 : 0);
