---
name: ui-primitives
description: Toolzzz UI conventions — CSS utility classes, table/form/button patterns, jQuery UI widgets, toast helpers, available globals (monProfil, Utils, Joueur.rechercher, BoiteRadar, Armee). Use when adding HTML/CSS to a Boite (`public/js/boite/*.js`) or a Page (`public/js/page/*.js`), when designing new UI components, or when refactoring existing markup. Read before introducing new classes/components — most things you'd want to add already exist in `public/css/outiiil.css` or as a global.
---

# Toolzzz UI primitives

Inventaire des classes CSS et patterns réutilisables pour rester cohérent visuellement avec le reste de l'extension. **À consulter avant d'écrire du HTML/CSS dans une Boite ou une Page**.

## Classes utilitaires (dans `public/css/outiiil.css`)

### Couleurs (color)

`.black` `.green` `.green_light` `.red` `.red_light` `.red_xlight` `.blue` `.blue_light` `.orange` `.violet` `.marron` `.marron_dark`

→ S'utilisent sur `<span>`, `<td>`, `<input>`. Préfèrent `!important`, donc surchargent les styles natifs Fourmizzz.

### Texte

- `.centre` `.left` `.right` — alignement
- `.gras` — bold
- `.small` — 0.8em (vraiment petit)
- `.reduce` — 0.9em (légèrement réduit, idéal pour notes/footnotes)
- `.souligne:hover` — soulignement au survol

### Layout

- `.o_maxWidth` — `width: 100%` (utile sur tables et inputs pour étirer)
- `.o_marginT0` / `.o_marginT15` — espace vertical au-dessus
- `.cursor` — `cursor: pointer` (à mettre sur tout élément cliquable non-bouton)
- `.cursor_copy` — `cursor: copy`
- `.clear` — clearfix

### Game-specific (du natif Fourmizzz, à éviter sauf si vraiment nécessaire)

- `.ligne_paire` — fond alterné natif
- `.boite_amelioration` `.simulateur` `.centre` — wrappers de boîtes natives

## Tableaux — pattern recommandé

Suivre le style de `BoiteCombat.calculatrice()` (onglet « Temps de trajet ») :

```html
<table id="o_<feature>" class="o_maxWidth centre" cellspacing="0">
  <thead>
    <tr>
      <th>Col1</th>
      <th>Col2</th>
      …
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>val1</td>
      <td>val2</td>
      …
    </tr>
    …
    <tr class="reduce">
      <td colspan="N"><em>Note de bas de tableau</em></td>
    </tr>
  </tbody>
</table>
```

### Alternance de lignes (couleur2)

Dans la méthode `css()` de la Boite, ajouter le sélecteur :

```js
$("#o_<feature> tr:even, …").css("background-color", monProfil.parametre["couleur2"].valeur);
```

→ Convention : `tr:even` (jQuery 0-indexé) sur la table entière colore le `<thead>` (index 0) et les lignes paires d'index, donc `<thead>` foncé puis ligne 1 claire / ligne 2 foncée / ligne 3 claire... Ne pas inverser — c'est le pattern de toute l'extension.
→ La `couleur2` est paramétrable par l'utilisateur via la BoiteParametres.

### Tableaux complexes (recherche/tri/export)

Utiliser **DataTables** comme `BoiteCombat.afficherTemps()` :

```js
$("#o_<feature>").DataTable({ bInfo: false, dom: "Bfrtip", buttons: ["copyHtml5", "csvHtml5", "excelHtml5"], pageLength: 15, … });
```

Toujours fournir des `language` traduits FR (cf. exemple existant). DataTables est déjà bundlé.

## Boutons

- `<button>` plain — pour les actions secondaires inline (cf. calculatrice)
- `<button class="o_button">` — bouton stylé Toolzzz
- `<button class="o_button f_success">` — bouton vert (action principale ; ex. Lancer/Envoyer)
- `<button … disabled>` — automatiquement grisé (cf. CSS `button[disabled]`)

## Inputs et widgets jQuery UI

Disponibles partout via `jquery-ui_1.12.1.js` (tout le bundle est chargé).

### Inputs numériques — TOUJOURS via `.spinner()`

⚠️ **Ne jamais utiliser `<input type="number">`**. Convention partout dans Toolzzz : input texte simple + appel `.spinner({ min, max, numberFormat: "i" })`. Donne les flèches haut/bas customisées qui matchent visuellement le reste de l'extension (cf. Lanceur de Chasses, Lanceur de Flood, Multi-flood, Calculatrice combat).

```html
<input type="text" id="o_truc" value="0" size="12" />
```

```js
$("#o_truc").spinner({ min: 0, numberFormat: "i" });
// ou max: 50 pour des niveaux, etc.
```

À appeler **après** que le HTML soit dans le DOM. Pour des inputs re-rendus dynamiquement (genre `_mfBindForm` du multi-flood), réappliquer `.spinner()` après chaque render — sinon les nouveaux inputs sont des champs texte plats.

### Autres widgets

- `$("#x").autocomplete({ source, select, … })` — autocomplete (cf. `Joueur.rechercher` + `Utils.extraitRecherche`)
- `$("#x").datetimepicker(DATEPICKER_OPTION)` — date/heure
- `$("#x").slider({ min, max, change })` — slider 0/1
- `$("#x").tooltip({ position, content })` — tooltips

## Toasts (feedback utilisateur)

Constantes globales dans `content.js` :

- `TOAST_INFO` `TOAST_SUCCESS` `TOAST_WARNING` `TOAST_ERROR`

Utilisation :

```js
$.toast({ ...TOAST_WARNING, text: "message" });
```

## Sources de données pré-existantes

Avant de fetch quoi que ce soit, vérifier qu'on n'a pas déjà la donnée :

- `monProfil` — Joueur courant (pseudo, x/y, niveauRecherche, niveauConstruction, parametre)
- `Utils.serveur` — sous-domaine du serveur (uppercase)
- `Utils.terrain` — terrain courant en cm² (depuis le DOM)
- `Utils.ouvrieres` `Utils.nourriture` `Utils.materiaux` — stocks
- `Utils.comptePlus` — booléen
- `Utils.alliance` — tag alliance
- `Joueur.rechercher(term)` — POST `classementAlliance.php` (autocomplete pseudo+alliance, page-agnostique)
- `Alliance.rechercher(term)` — idem mais priorité alliance
- `Utils.extraitRecherche(html, joueur=true, alliance=true)` — parse résultat de la recherche
- `BoiteRadar` — instance créée à demande, lit `localStorage` (`outiiil_radar`)
- `Armee.getArmee()` — Promise qui fetch l'armée du joueur (via la page Armée appropriée)

## Constantes globales utiles

Dans `public/js/content.js` :

- `NOM_UNITE` — noms des 14 unités, indexé 1-14
- `ATT_UNITE` `DEF_UNITE` `VIE_UNITE` — stats par unité
- `RATIO_CHASSE` `PERTE_*_CHASSE` `REPLIQUE_CHASSE` — constantes calibrage chasse
- `IMG_FLECHE` `IMG_VIE` `IMG_ATT` `IMG_DEF` `IMG_COPY` `IMG_GAUCHE` `IMG_DROITE` — icônes inline (chaînes HTML)
- `LIEU.TERRAIN` `LIEU.DOME` `LIEU.LOGE` — enums lieux d'attaque
- `DATEPICKER_OPTION` — options par défaut pour datetimepicker

## Règle d'or

**Avant d'ajouter une nouvelle classe CSS ou un nouveau composant JS** : `Grep` dans `public/js/` et `public/css/outiiil.css` pour voir si quelque chose d'équivalent existe déjà. La leçon retenue dans le skill `analyze-fourmizzz` (« Lire avant de proposer un remplacement ») s'applique aussi aux primitives UI.
