/**
 * Creer une boite radar pour la surveillance des joueurs/alliances.
 *
 * @class BoiteRadar
 * @constructor
 * @extends Boite
 */
import { $ } from "~/vendor";
import { IMG_REFRESH, IMG_ARROW, TOAST_WARNING } from "~/constants";
import { VERSION } from "~/lib/version";
import { Utils } from "~/lib/Utils";
// Cycle d'import volontaire (usage dans les méthodes uniquement, jamais au niveau module) : voir ~/models/Alliance.
import { Alliance } from "~/models/Alliance";
// Cycle d'import volontaire (usage dans les méthodes uniquement, jamais au niveau module) : voir ~/models/Joueur.
import { Player } from "~/models/Player";
import * as storage from "~/storage";

export class RadarBox {
  // Champs déclarés pour TypeScript (Phase 2 : conversion telle quelle, le
  // typage fin est reporté — cf. .claude/plans/wxt-migration-followups.md).
  _players: any;
  _alliances: any;
  _separators: any;
  _editMode: any;
  constructor() {
    /**
     * liste des joueurs
     */
    this._players = {};
    /**
     * liste des alliances
     */
    this._alliances = {};
    /**
     * Liste des séparateurs (sections de regroupement, ex. "--- Amis ---").
     * Chaque entrée : { id, texte, ordreRadar }. `id` est généré côté client
     * (timestamp) puisqu'un séparateur n'a pas de clé naturelle comme un
     * pseudo ou un tag d'alliance.
     */
    this._separators = [];
    /**
     * État du mode édition (toggle via ⚙ du toolbar). En mode édition :
     * un `×` apparait sur chaque ligne pour supprimer, et le texte des
     * séparateurs devient `contenteditable`. État volatile (pas persisté).
     */
    this._editMode = false;
    // on recupére les données
    this.getData();
  }
  /**
   *
   */
  get joueurs() {
    return this._players;
  }
  /**
   *
   */
  set joueurs(newPlayers) {
    this._players = newPlayers;
  }
  /**
   *
   */
  get alliances() {
    return this._alliances;
  }
  /**
   *
   */
  set alliances(newAlliances) {
    this._alliances = newAlliances;
  }
  /**
   *
   */
  get separateurs() {
    return this._separators;
  }
  /**
   *
   */
  addPlayer(player) {
    this._players[player.pseudo] = player;
    this._players[player.pseudo].ordreRadar = this.getMaxOrder() + 1;
    return this;
  }
  /**
   *
   */
  removePlayer(player) {
    delete this._players[player.pseudo];
    return this;
  }
  /**
   *
   */
  addAlliance(alliance) {
    this._alliances[alliance.tag] = alliance;
    this._alliances[alliance.tag].ordreRadar = this.getMaxOrder() + 1;
    return this;
  }
  /**
   *
   */
  removeAlliance(alliance) {
    delete this._alliances[alliance.tag];
    return this;
  }
  /**
   * Ajoute un séparateur à la fin de la liste.
   */
  addSeparator(texte = "Section") {
    this._separators.push({
      id: "sep_" + Date.now(),
      texte: texte,
      ordreRadar: this.getMaxOrder() + 1,
    });
    return this;
  }
  /**
   * Supprime un séparateur par son id.
   */
  removeSeparator(id) {
    this._separators = this._separators.filter((s) => s.id !== id);
    return this;
  }
  /**
   * Renomme un séparateur. Repli sur "Section" si le texte fourni est vide.
   */
  renameSeparator(id, texte) {
    let sep = this._separators.find((s) => s.id === id);
    if (sep) sep.texte = ((texte || "").trim() || "Section").substring(0, 16);
    return this;
  }
  /**
   *
   */
  getMaxOrder() {
    let max = 0;
    for (let j in this._players)
      if (this._players[j].ordreRadar > max) max = this._players[j].ordreRadar;
    for (let a in this._alliances)
      if (this._alliances[a].ordreRadar > max) max = this._alliances[a].ordreRadar;
    for (let s of this._separators) if (s.ordreRadar > max) max = s.ordreRadar;
    return max;
  }
  /**
   *
   */
  computeOrder(serie) {
    let newOrder = serie.split("&");
    for (let i = 0; i < newOrder.length; i++) {
      let item = newOrder[i].split("=");
      let $row = $("#o_item_" + item[1]);
      if ($row.hasClass("o_radarSep")) {
        let sep = this._separators.find((s) => s.id === $row.attr("data-id"));
        if (sep) sep.ordreRadar = i;
      } else {
        let link = $row.find("a:eq(1)"),
          href = link.attr("href") || "",
          key = link.text();
        if (href.includes("Membre.php")) {
          if (this._players[key]) this._players[key].ordreRadar = i;
        } else if (this._alliances[key]) {
          this._alliances[key].ordreRadar = i;
        }
      }
    }
    return this.save();
  }
  /**
   * Récupére les données sur les joueurs sous surveillance.
   *
   * @method getRadar
   */
  getData() {
    let data = storage.getJSON("outiiil_radar") || {};
    // Si des données sont deja presente et à jour on les charges
    if (data.hasOwnProperty("joueurs"))
      for (let item in data.joueurs) this._players[item] = new Player(data.joueurs[item]);
    if (data.hasOwnProperty("alliances"))
      for (let item in data.alliances) this._alliances[item] = new Alliance(data.alliances[item]);
    if (Array.isArray(data.separateurs)) this._separators = data.separateurs;
  }
  /**
   *
   */
  toJSON() {
    let json: any = {},
      players = {},
      alliances = {};
    for (let j in this._players)
      players[j] = JSON.parse(
        JSON.stringify(this._players[j], ["pseudo", "id", "x", "y", "mv", "terrain", "ordreRadar"]),
      );
    for (let a in this._alliances)
      alliances[a] = JSON.parse(
        JSON.stringify(this._alliances[a], ["tag", "terrain", "ordreRadar"]),
      );
    // si on a des joueurs sous surveillance on ajoute à l'objet
    if (Object.keys(players).length) json["joueurs"] = players;
    // si on a des alliances sous surveillance on ajoute à l'objet
    if (Object.keys(alliances).length) json["alliances"] = alliances;
    if (this._separators.length) json["separateurs"] = this._separators;
    return json;
  }
  /**
   *
   */
  save() {
    storage.setJSON("outiiil_radar", this);
    return this;
  }
  /**
   * Affiche la boie.
   *
   * @private
   * @method afficher
   */
  render() {
    // si il y a des joueurs, alliances ou séparateurs surveillés on affiche la boite
    if (
      Object.keys(this._players).length ||
      Object.keys(this._alliances).length ||
      this._separators.length
    ) {
      // Modification de la boite compte plus pour faire apparaitre la boite radar
      $("#boiteComptePlus .titre_colonne_cliquable").replaceWith(() => {
        return `<div class='titre_colonne_cliquable'>${IMG_ARROW} <span class='titre_compte_plus'>Toolzzz ${VERSION.substring(0, 2)}<span class='reduce'>${VERSION.substring(2)}</span></span> ${IMG_ARROW}</div>`;
      });
      // Event sur le titre si on utilise le radar
      $("#boiteComptePlus .titre_colonne_cliquable").click((e) => {
        if ($(e.currentTarget).next().find("table:visible").attr("id"))
          storage.setRaw("outiiil_boiteActive", "C");
        else storage.setRaw("outiiil_boiteActive", "R");
        $("#boiteComptePlus .contenu_boite_compte_plus table").toggle();
      });
      // Remplissage de la boite
      this.refresh();
    }
    return this;
  }
  /**
   * Rafraichie la boite radar quand un element est inséré ou retiré.
   *
   * @private
   * @method actualiseBoite
   */
  refresh() {
    let show = storage.getRaw("outiiil_boiteActive"),
      // En Compte+, le champ #requete natif vit dans une <tr><td> du table:eq(0)
      // qui est masqué en mode radar — donc inaccessible. On insère ici une row
      // jumelle dans le tfoot d'#o_radar (id `o_requete` pour éviter le duplicate
      // ID avec le natif resté en place côté table caché). Wiré sur l'autocomplete
      // Toolzzz (`Joueur.rechercher`) comme #recherche en non-C+.
      searchRow = Utils.comptePlus
        ? `<tr id='o_radarSearchRow'><td colspan='3'><form method='post' action='classementAlliance.php' style='text-align:center;'><input type='text' name='requete' id='o_requete' placeholder='Rechercher Joueur ou Alliance' autocomplete='off' style='text-align:center;width:95%;'/></form></td></tr>`
        : "",
      html = `<table id='o_radar' ${!show || show == "C" ? `style="display:none"` : ""}><colgroup><col><col><col></colgroup><tbody></tbody><tfoot><tr id='o_radarToolbar'><td colspan='3' class='right'><div id='o_radarToolbarInner'><a id='o_radarRefreshAll' class='o_actualiser' href='' title='Tout actualiser'><img src="${IMG_REFRESH}" alt="Tout actualiser" height="14"/></a><span id='o_radarAddSep' class='cursor' title='Ajouter une section'>+</span><span id='o_radarToggleEdit' class='cursor' title='Mode édition'>✎</span></div></td></tr>${searchRow}</tfoot></table>`;
    // on remplace le contenu ou l'ajoute
    if ($("#o_radar").length) $("#o_radar").replaceWith(html);
    else $("#boiteComptePlus .contenu_boite_compte_plus table").after(html);
    // Autocomplete sur le champ de recherche injecté en C+, branché sur le même
    // backend que `#recherche` non-C+ (Joueur.rechercher → Utils.extraitRecherche).
    // Réinit nécessaire à chaque rebuild car le DOM précédent est remplacé.
    if (Utils.comptePlus)
      $("#o_requete").autocomplete({
        source: (request, response) => {
          Player.search(request.term).then((data) => response(Utils.extractResearch(data)));
        },
        position: { my: "left top-5", at: "left bottom" },
        delay: 0,
        minLength: 3,
        select: (event, ui) => {
          window.location.replace(ui.item.url);
        },
      });
    // Le `sortable` doit être (ré)initialisé à chaque rebuild de la table :
    // un `replaceWith` remplace le tbody par un nouveau noeud DOM qui n'a pas
    // l'instance jQuery UI sortable. Sans cette ligne, ajouter un joueur via
    // "Surveiller" cassait silencieusement le drag-and-drop jusqu'au prochain
    // reload de la page.
    $("#o_radar tbody").sortable({
      placeholder: "o_radarPlaceholder",
      // `cancel` empêche le drag de démarrer quand on clique sur un élément
      // listé : on ajoute `[contenteditable="true"]` pour qu'éditer un texte
      // de séparateur (mode édition) ne lance pas un drag par accident.
      cancel: 'input, textarea, button, select, option, [contenteditable="true"]',
      // Le drag-and-drop n'est actif qu'en mode édition (cf. UX iOS/Linear/
      // Notion : "Edit puis réordonne"). En vue normale, la liste est en
      // lecture seule pour éviter les mismanipulations.
      disabled: !this._editMode,
      update: (e, ui) => {
        this.computeOrder($("#o_radar tbody").sortable("serialize"));
      },
    });
    // Event pour mettre à jour les données d'un joueur ou une alliance
    $("#o_radar").off();
    // Rendu unifié des 3 collections, ordonnées par `ordreRadar` croissant.
    let entries = [];
    for (let p in this._players)
      entries.push({ type: "joueur", obj: this._players[p], ordre: this._players[p].ordreRadar });
    for (let t in this._alliances)
      entries.push({
        type: "alliance",
        obj: this._alliances[t],
        ordre: this._alliances[t].ordreRadar,
      });
    for (let s of this._separators)
      entries.push({ type: "separateur", obj: s, ordre: s.ordreRadar });
    entries.sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0));
    let index = 1;
    for (let e of entries) {
      if (e.type === "separateur") this._renderSeparator(e.obj, index++);
      else e.obj.getRadarRow(this, "#o_radar tbody", index++);
    }
    // Pour les rows joueur/alliance, on wrappe deux cellules :
    //  - 1re td dans `<div.o_radarFirstCell>` (flex) — le `≡` du mode édition
    //    s'alignait sinon sous l'icône refresh à cause d'une règle native
    //    Fourmizzz qui force `display: block` sur les `<a>` du panneau Compte+.
    //  - 3e td (terrain) dans `<span.o_radarTerrainNum>` — permet d'ellipsizer
    //    juste le nombre en mode édition sans manger le `×`.
    // Les wrappers sont posés indépendamment du mode édition (cosmétiquement
    // identiques sans le `≡` / sans l'ellipsis). `.detach()` préserve les
    // event handlers déjà bindés (notamment le click du `.o_actualiser`
    // et le `<a>` du terrain attaquable).
    $("#o_radar tbody tr:not(.o_radarSep)").each((_, tr) => {
      let $td1 = $(tr).find("td:first");
      if (!$td1.find(".o_radarFirstCell").length) {
        let $children = $td1.children().detach();
        $td1.append($("<div class='o_radarFirstCell'></div>").append($children));
      }
      let $td3 = $(tr).find("td:last");
      if (!$td3.find(".o_radarTerrainNum").length) {
        let $contents = $td3.contents().detach();
        $td3.append($("<span class='o_radarTerrainNum'></span>").append($contents));
      }
    });
    // Toolbar
    $("#o_radarRefreshAll").click((e) => {
      this._refreshAll();
      return false;
    });
    $("#o_radarAddSep").click((e) => {
      e.stopPropagation();
      this.addSeparator().save().refresh();
      // En mode édition, focus + sélection du texte du nouveau séparateur
      // pour permettre de taper son nom directement (les `Section` par défaut
      // sont remplacés par la frappe vu que la sélection est active).
      if (this._editMode) {
        let nodes = $("#o_radar tbody .o_radarSep").last().find(".o_radarSepText");
        if (nodes.length) {
          let node = nodes[0];
          node.focus();
          let range = document.createRange();
          range.selectNodeContents(node);
          let sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }
    });
    $("#o_radarToggleEdit").click((e) => {
      e.stopPropagation();
      this._toggleEdit();
    });
    // Ré-applique le mode édition après chaque rebuild (le DOM des rows a
    // été régénéré, les × et `contenteditable` doivent être ré-attachés).
    if (this._editMode) this._applyEdit();
    return this;
  }
  /**
   * Rend une ligne séparateur dans le tbody. Wrapper `<div>` intérieur :
   * mettre `display: flex` directement sur un `<td>` casse le rendu table
   * (la cellule shrink à la largeur du contenu au lieu de remplir colspan),
   * d'où ce niveau d'indirection. Le `data-id` permet à calculeOrdre /
   * supprimeSeparateur / renommeSeparateur de retrouver l'entrée.
   */
  _renderSeparator(sep, index) {
    $("#o_radar tbody").append(
      `<tr id='o_item_${index}' class='o_radarSep' data-id='${sep.id}'><td colspan='3'><div class='o_radarSepInner'><span class='o_radarSepText'>${RadarBox._escapeHtml(sep.texte)}</span></div></td></tr>`,
    );
  }
  /**
   * Échappement minimal pour les valeurs user-supplied injectées en HTML.
   */
  static _escapeHtml(s) {
    return String(s).replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );
  }
  /**
   * Refresh batch de toutes les entrées surveillées (joueurs + alliances) en
   * parallèle via Promise.all. Le navigateur cap naturellement à ~6 connexions
   * simultanées sur l'origine, donc 30 entrées finissent en quelques vagues
   * sans pool explicite. Les suppressions (joueurs disparus du jeu) sont
   * appliquées en différé pour éviter un rebuild DOM en plein batch — qui
   * casserait les highlights et les refresh en cours.
   *
   * @private
   * @method _actualiserTout
   */
  _refreshAll() {
    let entries = [...Object.values(this._players), ...Object.values(this._alliances)];
    if (!entries.length) return;
    let $btn = $("#o_radarRefreshAll");
    // Spin du bouton — même 600ms qu'une icône per-ligne. Pas de compteur ni de
    // disable : le batch va trop vite (~1-2s en pratique) pour que ça serve.
    $({ deg: 0 }).animate(
      { deg: 360 },
      {
        duration: 600,
        step: (now) => $btn.find("img").css({ transform: "rotate(" + now + "deg)" }),
      },
    );
    let refreshOne = (entry) =>
      entry
        .refreshInRadar(this)
        .then((r) => ({ entry, ...r }))
        .catch(() => ({ entry, failed: true }));
    Promise.all(entries.map(refreshOne)).then((results) => {
      let removed = results.filter((r) => r.removed),
        changed = results.filter((r) => r.changed).length,
        failed = results.filter((r) => r.failed).length;
      removed.forEach((r) => {
        $.toast({ ...TOAST_WARNING, text: `Le joueur ${r.entry._pseudo} n'existe plus.` });
        this.removePlayer(r.entry);
      });
      if (removed.length || changed) this.save();
      if (failed) {
        $.toast({ ...TOAST_WARNING, text: `${failed} actualisation(s) échouée(s).` });
      }
      if (removed.length) this.refresh();
    });
  }
  /**
   * Toggle du mode édition.
   */
  _toggleEdit() {
    this._editMode = !this._editMode;
    this._applyEdit();
  }
  /**
   * Applique (ou retire) les affordances du mode édition :
   *  - × cliquable à droite de chaque ligne (joueur, alliance ou séparateur)
   *  - séparateurs `contenteditable` pour rename inline
   */
  _applyEdit() {
    let on = this._editMode;
    $("#o_radar").toggleClass("o_radarEditMode", on);
    // Reset des affordances avant ré-application — actualiser() peut être
    // appelée alors que _modeEdition est déjà true (cas : ajout séparateur).
    $("#o_radar .o_radarDelete, #o_radar .o_radarDragHandle").remove();
    $(".o_radarSepText")
      .off("blur.radarSep keydown.radarSep input.radarSep")
      .removeAttr("contenteditable");
    $("#o_radar").off("click.radarDel");

    // Le drag-and-drop suit l'état du mode édition.
    if ($("#o_radar tbody").sortable("instance"))
      $("#o_radar tbody").sortable(on ? "enable" : "disable");

    if (!on) return;
    // Pour chaque ligne (joueur, alliance, séparateur) on injecte :
    //  - `≡` à gauche pour signaler le drag-and-drop
    //  - `×` à droite pour la suppression
    // Pour joueur/alliance, on les met dans la 1re et la dernière `<td>`.
    // Pour séparateur, on les met dans `.o_radarSepInner` (le flex container),
    // pour qu'ils deviennent flex items et restent alignés autour du texte.
    $("#o_radar tbody tr").each((i, tr) => {
      let $tr = $(tr);
      if ($tr.hasClass("o_radarSep")) {
        $tr
          .find(".o_radarSepInner")
          .prepend(`<span class='o_radarDragHandle' title='Glisser pour réordonner'>≡</span>`)
          .append(` <span class='o_radarDelete cursor red gras' title='Retirer'>×</span>`);
      } else {
        $tr
          .find(".o_radarFirstCell")
          .prepend(`<span class='o_radarDragHandle' title='Glisser pour réordonner'>≡</span>`);
        $tr
          .find("td:last")
          .append(` <span class='o_radarDelete cursor red gras' title='Retirer'>×</span>`);
      }
    });
    // Séparateurs : contenteditable + save on blur, Enter pour valider, et
    // cap dur à 16 caractères (le panneau Compte+ est étroit, au-delà le
    // texte serait tronqué visuellement par les pointillés du flex). On
    // tronque dynamiquement au lieu de bloquer l'input pour rester simple
    // (replace selection, paste, etc. sont tous gérés au même endroit).
    $(".o_radarSepText")
      .attr("contenteditable", "true")
      .on("blur.radarSep", (e) => {
        let id = $(e.currentTarget).closest("tr").attr("data-id");
        this.renameSeparator(id, $(e.currentTarget).text()).save();
      })
      .on("keydown.radarSep", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          $(e.currentTarget).blur();
        }
      })
      .on("input.radarSep", (e) => {
        let node = e.currentTarget,
          text = $(node).text();
        if (text.length > 16) {
          $(node).text(text.substring(0, 16));
          let range = document.createRange();
          range.selectNodeContents(node);
          range.collapse(false);
          let sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        }
      });
    // Délégation sur #o_radar pour la suppression — les × sont des spans
    // ajoutés dynamiquement, et la délégation évite de re-bind à chaque rebuild.
    $("#o_radar").on("click.radarDel", ".o_radarDelete", (e) => {
      e.stopPropagation();
      let $tr = $(e.currentTarget).closest("tr");
      if ($tr.hasClass("o_radarSep")) {
        this.removeSeparator($tr.attr("data-id"));
      } else {
        let link = $tr.find("a:eq(1)"),
          href = link.attr("href") || "",
          key = link.text();
        if (href.includes("Membre.php")) delete this._players[key];
        else delete this._alliances[key];
      }
      this.save().refresh();
    });
  }
}
