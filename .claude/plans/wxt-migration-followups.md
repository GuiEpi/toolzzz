# Migration WXT — suivis différés

Tout ce qui a été volontairement laissé de côté pendant la migration, avec la
phase où le traiter. Complété au fil des phases ; la Phase 5 en fait la revue.

Versionné (et non dans `docs/`, qui est gitignoré) parce que la section
« bugs latents » et les décisions de parité doivent survivre à la migration :
on y revient quand la 4.0 est stable.

## Phase 1 — décisions à confirmer au smoke test

- **Cascade CSS du thème jQuery UI.** Le thème humanity était un `<link>`
  ajouté au `<head>` au runtime ; il est maintenant dans le CSS du content
  script, **avant** `outiiil.css`, pour que les « Correctif jquerui pour
  outiiil » gagnent à spécificité égale (`.ui-button-icon-only` :
  `text-indent: -9999px` dans outiiil vs `0` dans humanity). C'est ce que
  fait Chromium aujourd'hui (feuilles injectées après celles du document).
  Si Firefox rendait différemment avant, c'est le rendu Chrome qui est
  conservé. À vérifier visuellement : boutons icône-only des spinners /
  datepicker.
- **lightningcss `errorRecovery: true`** (wxt.config.ts) : retire les hacks
  IE `*cursor: hand` / `*zoom: 1` / `*margin-top` de datatables.css au
  minify. Ignorés par tous les navigateurs ciblés → aucun changement attendu.
- **`Dock._mql = window.matchMedia(...)`** reste un effet de bord au niveau
  module (src/boxes/Dock.js). Inoffensif dans le navigateur, jamais évalué
  sous Node (imports retirés avec `main()`). À rapatrier dans un getter
  paresseux si un jour l'entrypoint importe quelque chose au niveau module.
- **`browser.runtime.getURL` / `getManifest` au niveau module**
  (src/constants/images.js, src/lib/version.js) : même remarque — ne tient
  que parce que rien n'est utilisé hors `main()` dans les entrypoints. Un
  build qui casse avec « Browser.runtime… not implemented » signale qu'un
  import a fui au niveau module.

## Phase 2 — fait, avec ces réserves

- `main.d.ts` supprimé (`main.js` → `main.ts`), comme prévu.
- `ctx` (ContentScriptContext) est passé à `main(ctx)` mais toujours inutilisé ;
  les `setInterval`/`setTimeout` de l'appli pourraient passer par
  `ctx.setInterval` pour être nettoyés à l'invalidation du script. Pas fait :
  changement de comportement potentiel.
- **`useDefineForClassFields: false`** dans `tsconfig.json`. Les ~230
  déclarations de champs ajoutées (`_x: any;`) sont purement déclaratives :
  avec la valeur par défaut (`true` en target ESNext) elles seraient émises
  comme de vrais champs définis à `undefined` avant le corps du constructeur,
  donc visibles de `for…in` / `Object.keys` sur les instances. À `false` elles
  disparaissent à la compilation. Vérifié : le bundle ne diffère de celui de
  la Phase 1 que par les 18 coercitions explicites listées ci-dessous.
  Repasser à `true` demanderait d'auditer chaque champ (Phase 5 au plus tôt).
- **Champs typés `any`.** Toutes les déclarations ajoutées sont `any`, posées
  mécaniquement depuis les `this._x = …`. Les typer réellement est le travail
  de la Phase 5 (`"strict": true`), classe par classe.
- **`declare module "~/vendor/lib/*"`** (src/vendor/types.d.ts) couvre les 18
  bibliothèques d'un coup. Revers : une faute de frappe dans un chemin
  `~/vendor/lib/...` ne serait pas signalée par tsc (elle casserait le build
  Vite, lui, tout de suite). Acceptable ; une déclaration par fichier serait
  plus sûre mais 18 fois plus bruyante.

### Coercitions explicites ajoutées en Phase 2 (seules différences de bundle)

Chacune rend explicite une conversion que JavaScript faisait implicitement ;
comportement identique, vérifié au niveau du bundle généré.

- `location = "/Armee.php"` → `window.location.href = "/Armee.php"`
  (`src/models/Armee.ts`, `src/pages/Armee.ts` ×2) — même opération, la
  première forme passe par le setter `href` de `Location`.
- `parseInt(<nombre>)` → `parseInt(String(<nombre>))`
  (`src/pages/Laboratoire.ts` ×4, `src/pages/Reine.ts`) — `parseInt` appelle
  déjà `ToString` sur son argument.
- `(…).toFixed(1) / 1` → `Number((…).toFixed(1))` (`src/pages/Reine.ts` ×3) —
  idiome « retirer le zéro final ».
- `pVie/pAtt/pDef > 0` → `Number(…) > 0` (`src/models/Chasse.ts` ×3) — ces
  variables viennent de `toFixed()`, donc des chaînes.
- `echecs > 1` → `Number(echecs) > 1` (`src/models/AttaqueLancee.ts` ×3) et
  `setRaw(CLE, echecs)` → `setRaw(CLE, String(echecs))` — `echecs` est lu en
  chaîne depuis `sessionStorage` et réécrit en nombre.

### Bugs latents trouvés par tsc, **conservés tels quels**

- **`src/models/Combat.ts` — `calculeUniteXP()`** : la variable déclarée est
  `ordreXp`, la boucle lit `ordreXP` (majuscule), un global qui n'existe pas.
  La méthode lève donc une `ReferenceError` à chaque appel — depuis au moins
  la migration MV3 (`d73b625`). C'est du code mort : le seul appel est
  commenté (`//alert(this.calculeUniteXP(...))`). Marqué
  `@ts-expect-error` pour préserver le comportement. Décider : supprimer la
  méthode, ou corriger la casse (et vérifier la logique — elle renvoie
  `armee` et non `armeeXP`, ce qui semble aussi faux).
- **`src/pages/Commerce.ts` — `cmdSuivante`** : initialisé à un nombre puis
  réassigné avec `id`, une **chaîne** (clé de `for…in`). Les comparaisons
  `id < cmdSuivante` qui suivent sont donc lexicographiques (`"10" < "9"`),
  pas numériques. Typé `any` pour ne rien changer. Si c'est un bug, le
  corriger est une décision fonctionnelle (quelle commande est « la
  suivante » ?), pas une conversion de types.
- **`src/lib/Utils.ts` — `extractUrlParams()`** : `if (t != "")` compare un
  **tableau** à une chaîne vide ; la coercition fait que ça marche par accident
  (`[""] == ""` → vrai pour une query vide). Écrit `(t as any) != ""` pour
  garder exactement cette sémantique ; `t.length` changerait le comportement
  sur une URL sans query.

## Phase 4

- `Utils.serveur` est en **majuscules** ; `serverKey()` (src/storage) en
  minuscules. Les deux clés `outiiil_carteAlliance_<SERVEUR>_<TAG>` et
  `outiiil_carteFiltres_…` embarquent la version majuscule : l'import legacy
  doit mapper les deux formes (cf. plan).
- Aucun `storage.watch` : l'inventaire n'a trouvé aucun comportement
  cross-onglet à préserver.

## Phase 5

- **Minification Firefox** : `.output/firefox-mv3/content-scripts/game.js`
  est minifié (1,3 Mo). AMO accepte si le zip des sources permet de
  rebuilder ; décider `vite: () => ({ build: { minify: false } })` avant la
  première soumission, et documenter la commande exacte dans le README.
- Le zip des sources contient bien `src/vendor/lib/**` (18 fichiers, octets
  identiques à ceux de la 3.9.1) — AMO voit le code lisible + le plugin
  d'enveloppe dans wxt.config.ts.
- `jsdom` ajouté en devDependency pour `bun run test:vendor` (CI).
- Renommage des ids DOM `o_*` : plus tard, hors migration.
- Suppression de `src/storage/legacy-import.ts` : deux versions après la
  Phase 4.
