/*
 * Vérifie la bascule de persistance vers browser.storage.local (Phase 4) :
 *
 *  1. profil neuf       → aucune donnée héritée, les valeurs par défaut suffisent
 *  2. profil 3.x        → les clés `outiiil_*` du localStorage sont importées
 *                         sous `local:<serveur>:<nom>`, formes inchangées
 *  3. deuxième ouverture → pas de ré-import, et le localStorage d'origine est
 *                         toujours là (retour arrière possible)
 *
 * Le bundle réel (.output/chrome-mv3/content-scripts/game.js) est exécuté dans
 * jsdom, comme test:vendor — ce n'est pas une simulation de la couche storage,
 * c'est elle qui tourne.
 *
 * Usage : bun run test:storage  (lance `wxt build` puis ce script)
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

const PAGE =
  `<!doctype html><html><body><span id="pseudo">Testeur</span>` +
  `<span id="tag_alliance">ZZZ</span>` +
  `<div id="menuAlliance"><ul><li><a class="boutonMembres">Membres</a></li></ul></div>` +
  `<ul id="menuFourmiliere"></ul></body></html>`;

/** Ouvre une page de jeu avec un storage.local donné et un localStorage donné. */
async function ouvrir({ storage = {}, legacy = {}, serveur = "s4" } = {}) {
  const virtualConsole = new VirtualConsole();
  const dom = new JSDOM(PAGE, {
    runScripts: "outside-only",
    url: `http://${serveur}.fourmizzz.fr/Reine.php`,
    pretendToBeVisual: true,
    virtualConsole,
  });
  const w = dom.window;
  for (const [k, v] of Object.entries(legacy)) w.localStorage.setItem(k, v);
  const erreurs = [];
  const infos = [];
  w.console.error = (...a) => erreurs.push(a.map(String).join(" "));
  w.console.info = (...a) => infos.push(a.map(String).join(" "));
  w.chrome = {
    runtime: {
      id: "fake",
      getURL: (p) => "chrome-extension://fake" + p,
      getManifest: () => ({ version: "9.9.9-test" }),
      onMessage: { addListener() {} },
    },
    storage: {
      local: {
        get: (keys) => {
          const demande = keys == null ? Object.keys(storage) : Array.isArray(keys) ? keys : [keys];
          return Promise.resolve(
            Object.fromEntries(demande.filter((k) => k in storage).map((k) => [k, storage[k]])),
          );
        },
        set: (entrees) => {
          Object.assign(storage, entrees);
          return Promise.resolve();
        },
        remove: (keys) => {
          for (const k of Array.isArray(keys) ? keys : [keys]) delete storage[k];
          return Promise.resolve();
        },
        onChanged: { addListener() {}, removeListener() {} },
      },
      onChanged: { addListener() {}, removeListener() {} },
    },
  };
  w.matchMedia = () => ({ matches: false, addEventListener() {}, addListener() {} });
  w.XMLHttpRequest.prototype.send = function () {}; // pas de réseau
  try {
    w.eval(code);
  } catch (e) {
    erreurs.push("throw au chargement : " + e.stack);
  }
  await new Promise((r) => setTimeout(r, 600));
  return { w, storage, erreurs, infos };
}

const checks = {};
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// ---- 1. profil neuf -------------------------------------------------------
{
  const { storage, erreurs } = await ouvrir();
  checks["profil neuf : démarre sans erreur"] = erreurs.length === 0;
  // seul le marqueur « import déjà tenté » est écrit : aucune valeur par
  // défaut n'est persistée (c'est le rôle de `fallback`)
  checks["profil neuf : seul le marqueur d'import est écrit"] = eq(Object.keys(storage), [
    "s4:legacyImported",
  ]);
}

// ---- 2. données d'une version 3.x ----------------------------------------
const LEGACY = {
  outiiil_parametre: JSON.stringify({ dockPosition: 1, couleurChat: "#abcdef" }),
  outiiil_joueur: JSON.stringify({
    id: 42,
    x: 7,
    y: 1200,
    niveauConstruction: [1, 2, 3],
    niveauRecherche: [4, 5],
  }),
  outiiil_evolution: JSON.stringify({ ponte: ["Ouvrière"], startPonte: "2026-10-03T00:00:00Z" }),
  outiiil_radar: JSON.stringify({ joueurs: { Bob: { pseudo: "Bob", id: 1, x: 2, y: 3 } } }),
  outiiil_boiteActive: "R",
  outiiil_attaquesLancees: JSON.stringify([{ id: 9, arrivee: "2026-10-03T01:00:00Z" }]),
  outiiil_menuRapide: JSON.stringify({ menuRapideReine: true }),
  outiiil_carteAlliance_S4_ZZZ: JSON.stringify({ timestamp: 1234, members: [{ pseudo: "Bob" }] }),
  outiiil_carteFiltres_S4_ZZZ: JSON.stringify({ Bob: true }),
  outiiil_lastSeenVersion: "3.9.1",
};
let apresImport;
{
  const { storage, erreurs, infos } = await ouvrir({ legacy: { ...LEGACY } });
  if (process.env.DUMP) console.log(Object.keys(storage));
  apresImport = storage;
  checks["import : démarre sans erreur"] = erreurs.length === 0;
  checks["import : réglages copiés tels quels"] = eq(storage["s4:settings"], {
    dockPosition: 1,
    couleurChat: "#abcdef",
  });
  checks["import : profil joueur, noms de champs inchangés"] = eq(storage["s4:player"], {
    id: 42,
    x: 7,
    y: 1200,
    niveauConstruction: [1, 2, 3],
    niveauRecherche: [4, 5],
  });
  checks["import : évolutions en cours"] = eq(storage["s4:upgrades"], {
    ponte: ["Ouvrière"],
    startPonte: "2026-10-03T00:00:00Z",
  });
  checks["import : radar"] = eq(storage["s4:radar"], {
    joueurs: { Bob: { pseudo: "Bob", id: 1, x: 2, y: 3 } },
  });
  checks["import : boîte active (chaîne brute)"] = storage["s4:activeBox"] === "R";
  checks["import : attaques lancées"] = eq(storage["s4:sentAttacks"], [
    { id: 9, arrivee: "2026-10-03T01:00:00Z" },
  ]);
  checks["import : menu rapide"] = eq(storage["s4:quickMenu"], { menuRapideReine: true });
  checks["import : carte d'alliance, clé sans le préfixe serveur"] = eq(
    storage["s4:allianceMap:ZZZ"],
    { timestamp: 1234, members: [{ pseudo: "Bob" }] },
  );
  checks["import : filtres de la carte"] = eq(storage["s4:allianceMapFilters:ZZZ"], {
    Bob: true,
  });
  checks["import : dernière version vue (globale, pas par serveur)"] =
    storage["global:lastSeenVersion"] === "3.9.1";
  checks["import : marqueur posé"] = storage["s4:legacyImported"] === true;
  checks["import : annoncé une fois dans la console"] = infos.some((i) =>
    /imported \d+ item/.test(i),
  );
}

// ---- 3. réouverture : pas de ré-import, données d'origine intactes --------
{
  const legacy = { ...LEGACY, outiiil_parametre: JSON.stringify({ dockPosition: 0 }) };
  const { storage, w, infos } = await ouvrir({ storage: { ...apresImport }, legacy });
  checks["réouverture : pas de ré-import"] = !infos.some((i) => /imported \d+ item/.test(i));
  checks["réouverture : la valeur déjà migrée n'est pas écrasée"] = eq(storage["s4:settings"], {
    dockPosition: 1,
    couleurChat: "#abcdef",
  });
  checks["réouverture : le localStorage d'origine est conservé"] =
    w.localStorage.getItem("outiiil_joueur") === LEGACY.outiiil_joueur;
}

// ---- 4. deux serveurs : données isolées ----------------------------------
{
  const partage = { ...apresImport }; // storage.local est commun à toute l'extension
  const { storage } = await ouvrir({
    storage: partage,
    serveur: "s1",
    legacy: { outiiil_parametre: JSON.stringify({ dockPosition: 0 }) },
  });
  checks["deux serveurs : s1 écrit sous ses propres clés"] = eq(storage["s1:settings"], {
    dockPosition: 0,
  });
  checks["deux serveurs : les données de s4 sont intactes"] = eq(storage["s4:settings"], {
    dockPosition: 1,
    couleurChat: "#abcdef",
  });
  checks["deux serveurs : un marqueur d'import par serveur"] =
    storage["s1:legacyImported"] === true && storage["s4:legacyImported"] === true;
}

let echecs = 0;
for (const [nom, ok] of Object.entries(checks)) {
  console.log(ok ? "PASS" : "FAIL", nom);
  if (!ok) echecs++;
}
console.log(echecs ? `\n${echecs} échec(s)` : `\n${Object.keys(checks).length} vérifications OK`);
process.exit(echecs ? 1 : 0);
