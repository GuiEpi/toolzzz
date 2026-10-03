/*
 * Smoke test de Toolzzz dans un vrai Chromium, sur un compte Fourmizzz réel.
 *
 * Complète `test:vendor` (jsdom, sans réseau ni rendu) : ici le CSS s'applique,
 * Highcharts dessine, les widgets jQuery UI s'initialisent, le jeu répond
 * vraiment. Le script NAVIGUE seulement, il ne clique jamais, et refuse de
 * passer si l'extension déclenche une écriture côté jeu.
 *
 * Préparer :
 *   bun run build
 *   chromium-browser --no-sandbox --remote-debugging-port=9222 \
 *     --user-data-dir=/tmp/toolzzz-smoke \
 *     --load-extension=$PWD/.output/chrome-mv3
 *   puis se connecter au jeu dans cette fenêtre.
 *
 * Lancer :  node scripts/browser-smoke.mjs [serveur]      (défaut : s4)
 *
 * Deux pages n'écrivent côté jeu que si le réglage correspondant est actif :
 * Ressources.php (affectation automatique des ouvrières) et Armee.php
 * (replacer l'armée). Le script lit les réglages et saute ces pages si besoin.
 */
const PORT = process.env.CDP_PORT || 9222;
const SERVER = process.argv[2] || process.env.SERVER || "s4";
const BASE = `http://${SERVER}.fourmizzz.fr`;

// GET qui écrivent côté jeu
const GET_ECRITURE =
  /(Ressources\.php\?annuler|ennemie\.php\?(Attaquer|annuler)|Armee\.php\?(Transferer|deplacement)|AcquerirTerrain|confAnnuler)/i;
// le forum du jeu se consulte en POST : ces verbes xajax sont des lectures
const XAJAX_LECTURE = /xajax=(callGetForum|membre|afficherForum|getTopic)\b/;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class Session {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.handlers = [];
  }
  static async attach(wsUrl) {
    const ws = new WebSocket(wsUrl);
    const s = new Session(ws);
    await new Promise((res, rej) => {
      ws.onopen = res;
      ws.onerror = () => rej(new Error("websocket: " + wsUrl));
    });
    ws.onmessage = (m) => {
      const msg = JSON.parse(m.data);
      if (msg.id && s.pending.has(msg.id)) {
        const { res, rej } = s.pending.get(msg.id);
        s.pending.delete(msg.id);
        msg.error ? rej(new Error(msg.error.message)) : res(msg.result);
      } else if (msg.method) {
        for (const h of s.handlers) h(msg);
      }
    };
    return s;
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((res, rej) => {
      this.pending.set(id, { res, rej });
      this.ws.send(JSON.stringify({ id, method, params }));
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          rej(new Error("timeout " + method));
        }
      }, 30000);
    });
  }
  on(h) {
    this.handlers.push(h);
  }
  async eval(expression) {
    const r = await this.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text);
    return r.result.value;
  }
}

/*
 * Pour chaque page : les enrichissements attendus.
 * `conditionnel: true` → dépend de l'état du compte (une recherche en cours,
 * une conversation ouverte…) : son absence n'est pas un échec, juste un
 * « non vérifié ».
 */
const PAGES = [
  {
    chemin: "/Reine.php",
    tests: [
      [
        "colonne « Terminé le »",
        `[...document.querySelectorAll("td,th")].some(t => /Terminé le/.test(t.textContent))`,
      ],
      [
        "dates de fin de ponte absolues",
        `[...document.querySelectorAll("td")].filter(t => /\\d{1,2} \\w+\\.? 20\\d\\d à \\d/.test(t.textContent)).length`,
        { conditionnel: true },
      ],
      ["stats des unités avec bonus", `document.querySelectorAll("table.tab_stat").length`],
    ],
  },
  {
    chemin: "/construction.php",
    tests: [
      [
        "récap des évolutions en cours",
        `!!document.querySelector("#o_evolutionEnCours, .o_evolutionH2")`,
        { conditionnel: true },
      ],
      ["onglet Coûts dans le menu colonie", `!!document.querySelector("#o_ongletCouts")`],
    ],
  },
  {
    chemin: "/construction.php#cout",
    tests: [
      ["graphiques Highcharts rendus", `document.querySelectorAll("svg.highcharts-root").length`],
      [
        "mode coûts actif (natif masqué)",
        `document.documentElement.classList.contains("toolzzz-mode-couts")`,
      ],
      ["sélecteurs de la simulation", `document.querySelectorAll("select[id^='o_']").length`],
    ],
  },
  {
    chemin: "/laboratoire.php",
    tests: [
      [
        "récap des recherches en cours",
        `!!document.querySelector("#o_evolutionEnCours, .o_evolutionH2")`,
        { conditionnel: true },
      ],
    ],
  },
  {
    chemin: "/Ressources.php",
    risque: "affectationRessource",
    tests: [
      [
        "lanceur de chasse intégré",
        `document.querySelectorAll("#o_chasseNbr, #o_chasseInt, #o_chasseTDCDep").length`,
      ],
      ["spinners jQuery UI initialisés", `document.querySelectorAll(".ui-spinner").length`],
      ["ligne de répartition des ouvrières", `!!document.querySelector("#o_ratioRecolte")`],
    ],
  },
  {
    chemin: "/Armee.php",
    risque: "replacerArmeeAuto",
    tests: [
      ["bouton Replacer l'armée", `!!document.querySelector("#o_replaceArmee")`],
      [
        "temps HOF de l'armée",
        `[...document.querySelectorAll("td")].some(t => /Temps\\s*HOF/.test(t.textContent))`,
      ],
      [
        "attaques restantes",
        `[...document.querySelectorAll("h3")].some(t => /reste\\s*:/.test(t.textContent))`,
      ],
    ],
  },
  {
    chemin: "/commerce.php",
    tests: [
      ["boutons Arrondir", `document.querySelectorAll("[id^='o_arrondir']").length`],
      [
        "SDC : tableau des commandes",
        `!!document.querySelector("#o_tableListeCommande")`,
        { conditionnel: true },
      ],
    ],
  },
  {
    chemin: "/compte.php",
    tests: [
      [
        "préférences du menu rapide",
        `!!document.querySelector("#o_menuRapideForm, input[id^='menuRapide']")`,
      ],
    ],
  },
  {
    chemin: "/chat.php",
    tests: [
      [
        "boutons Citer",
        `document.querySelectorAll("[id^='o_cite']").length`,
        { conditionnel: true },
      ],
      ["barre de mise en forme", `document.querySelectorAll("#o_msgB, #o_msgI, #o_msgU").length`],
    ],
  },
  {
    chemin: "/messagerie.php",
    tests: [
      [
        "coloration des joueurs surveillés",
        `document.querySelectorAll("[id^='o_colorMess']").length`,
        { conditionnel: true },
      ],
    ],
  },
  {
    chemin: "/ennemie.php",
    tests: [
      [
        "colonne Temps ajoutée",
        `[...document.querySelectorAll("#tabEnnemie th,#tabEnnemie td")].some(t => /^Temps$/.test(t.textContent.trim()))`,
      ],
    ],
  },
  {
    chemin: "/alliance.php?Membres",
    tests: [
      ["onglet Carte injecté", `!!document.querySelector("#o_ongletCarte")`],
      ["DataTables sur les membres", `document.querySelectorAll(".dataTables_wrapper").length`],
    ],
  },
  {
    // profil d'un autre joueur : sur son propre profil, le temps de trajet
    // n'a pas de sens et n'est pas affiché
    chemin: "AUTRE_JOUEUR",
    tests: [
      ["temps de trajet live", `!!document.querySelector("#o_tempsRetour")`],
      ["heure d'arrivée du rapport", `!!document.querySelector("#o_tempsRetourRapport")`],
      ["bouton surveiller (radar)", `!!document.querySelector("#o_surveiller")`],
    ],
  },
];

const targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const cible = targets.find((t) => t.type === "page");
if (!cible) {
  console.error(
    `Aucun onglet sur le port ${PORT} — Chromium est-il lancé avec --remote-debugging-port ?`,
  );
  process.exit(2);
}
const s = await Session.attach(cible.webSocketDebuggerUrl);

const etat = { logs: [], requetes: [] };
s.on((msg) => {
  const p = msg.params;
  if (msg.method === "Runtime.exceptionThrown") {
    etat.logs.push({
      type: "exception",
      texte: (p.exceptionDetails.exception?.description || p.exceptionDetails.text || "")
        .split("\n")
        .slice(0, 3)
        .join(" | "),
    });
  } else if (msg.method === "Runtime.consoleAPICalled" && p.type === "error") {
    etat.logs.push({
      type: "console.error",
      texte: p.args.map((a) => a.value ?? a.description ?? a.type).join(" "),
    });
  } else if (msg.method === "Network.requestWillBeSent") {
    etat.requetes.push({
      method: p.request.method,
      url: p.request.url,
      body: p.request.postData || "",
      // la pile d'initiateur porte l'URL des scripts : chrome-extension:// = nous
      parNous: JSON.stringify(p.initiator || {}).includes("chrome-extension://"),
    });
  }
});
await s.send("Page.enable");
await s.send("Runtime.enable");
await s.send("Network.enable");

async function aller(url) {
  etat.logs.length = 0;
  etat.requetes.length = 0;
  await s.send("Page.navigate", { url });
  await sleep(1500);
  for (let i = 0; i < 20; i++) {
    if ((await s.eval("document.readyState").catch(() => null)) === "complete") break;
    await sleep(500);
  }
  // l'extension attend ses propres requêtes (profil, construction, labo)
  await sleep(5000);
}

await aller(BASE + "/Reine.php");
if (!(await s.eval(`!!document.querySelector("#pseudo")`))) {
  console.error("Pas connecté au jeu dans cette fenêtre — se connecter puis relancer.");
  process.exit(2);
}
const pseudo = await s.eval(`document.querySelector("#pseudo").textContent`);
const reglages = JSON.parse((await s.eval(`localStorage.getItem("outiiil_parametre")`)) || "{}");
console.log(`compte : ${pseudo} sur ${SERVER}`);
console.log(
  `réglages à effet de bord : affectationRessource=${JSON.stringify(reglages.affectationRessource)}` +
    ` replacerArmeeAuto=${JSON.stringify(reglages.replacerArmeeAuto)}\n`,
);

// un autre joueur que soi, pour la page profil
await aller(BASE + "/alliance.php?Membres");
const autre = await s.eval(
  `[...document.querySelectorAll('a[href*="Membre.php?Pseudo="]')]
     .map(a => a.textContent.trim()).filter(p => p && p !== ${JSON.stringify(pseudo)})[0] || null`,
);

let echecs = 0;
let nonVerifies = 0;
for (const page of PAGES) {
  let chemin = page.chemin;
  if (chemin === "AUTRE_JOUEUR") {
    if (!autre) {
      console.log("\n/Membre.php — ignorée : aucun autre joueur trouvé dans l'alliance");
      continue;
    }
    chemin = `/Membre.php?Pseudo=${encodeURIComponent(autre)}`;
  }
  if (page.risque && reglages[page.risque]) {
    console.log(`\n${chemin} — IGNORÉE : « ${page.risque} » est actif, la page écrirait côté jeu`);
    continue;
  }

  await aller(BASE + chemin);
  console.log(`\n${chemin}`);

  for (const [libelle, expr, opts = {}] of page.tests) {
    let v;
    try {
      v = await s.eval(expr);
    } catch (e) {
      v = "ERREUR " + e.message.slice(0, 60);
    }
    const ok = v === true || (typeof v === "number" && v > 0);
    const marque = ok ? "✓" : opts.conditionnel ? "–" : "✗";
    if (!ok) opts.conditionnel ? nonVerifies++ : echecs++;
    console.log(
      `   ${marque} ${libelle}${typeof v === "number" ? ` (${v})` : ""}` +
        (!ok && opts.conditionnel ? " — dépend de l'état du compte" : ""),
    );
  }

  const erreurs = etat.logs.filter((l) => l.type === "exception");
  for (const e of erreurs) console.log(`   ✗ exception JS : ${e.texte.slice(0, 180)}`);
  echecs += erreurs.length;

  const versJeu = etat.requetes.filter((r) => /\/\/[a-z0-9-]*\.?fourmizzz\.fr\//.test(r.url));
  const ecritures = versJeu.filter(
    (r) =>
      r.parNous &&
      ((r.method === "POST" && !XAJAX_LECTURE.test(r.body)) || GET_ECRITURE.test(r.url)),
  );
  if (ecritures.length) {
    echecs += ecritures.length;
    console.log("   ✗ l'extension a écrit côté jeu :");
    for (const e of ecritures) console.log(`      ${e.method} ${e.url.slice(0, 100)}`);
  }
}

console.log(
  `\n${echecs ? `${echecs} échec(s)` : "aucun échec"}` +
    (nonVerifies ? `, ${nonVerifies} vérification(s) non concluante(s) (état du compte)` : ""),
);
process.exit(echecs ? 1 : 0);
