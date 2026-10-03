/**
 * Builds the radar box used to watch players and alliances.
 *
 * @class RadarBox
 * @constructor
 * @extends Box
 */
import { $ } from "~/vendor";
import { IMG_REFRESH, IMG_ARROW, TOAST_WARNING } from "~/constants";
import { VERSION } from "~/lib/version";
import { Utils } from "~/lib/Utils";
// Deliberate import cycle (used inside methods only, never at module level): see ~/models/Alliance.
import { Alliance } from "~/models/Alliance";
// Deliberate import cycle (used inside methods only, never at module level): see ~/models/Player.
import { Player } from "~/models/Player";
import * as storage from "~/storage";

export class RadarBox {
  // Fields declared for TypeScript (Phase 2 was a straight conversion; real
  // typing is deferred — see .claude/plans/wxt-migration-followups.md).
  _players: any;
  _alliances: any;
  _separators: any;
  _editMode: any;
  constructor() {
    /**
     * list of players
     */
    this._players = {};
    /**
     * list of alliances
     */
    this._alliances = {};
    /**
     * List of separators (grouping sections, e.g. "--- Amis ---").
     * Each entry is { id, texte, ordreRadar }. `id` is generated client-side
     * (a timestamp) since a separator has no natural key the way a nickname or
     * an alliance tag does.
     */
    this._separators = [];
    /**
     * Edit-mode state (toggled by the ⚙ in the toolbar). In edit mode a `×`
     * appears on every row for deletion and separator text becomes
     * `contenteditable`. Volatile state, never persisted.
     */
    this._editMode = false;
    // read the stored data
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
   * Appends a separator to the list.
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
   * Removes a separator by id.
   */
  removeSeparator(id) {
    this._separators = this._separators.filter((s) => s.id !== id);
    return this;
  }
  /**
   * Renames a separator, falling back to "Section" when the text is empty.
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
   * Reads the data about the watched players.
   *
   * @method getRadar
   */
  getData() {
    let data = storage.getJSON("outiiil_radar") || {};
    // Load the stored data when it is present and still fresh
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
    // add the watched players when there are any
    if (Object.keys(players).length) json["joueurs"] = players;
    // add the watched alliances when there are any
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
   * Renders the box.
   *
   * @private
   * @method render
   */
  render() {
    // only render the box when something is watched
    if (
      Object.keys(this._players).length ||
      Object.keys(this._alliances).length ||
      this._separators.length
    ) {
      // adjust the ComptePlus box so the radar box can show
      $("#boiteComptePlus .titre_colonne_cliquable").replaceWith(() => {
        return `<div class='titre_colonne_cliquable'>${IMG_ARROW} <span class='titre_compte_plus'>Toolzzz ${VERSION.substring(0, 2)}<span class='reduce'>${VERSION.substring(2)}</span></span> ${IMG_ARROW}</div>`;
      });
      // title events, when the radar is in use
      $("#boiteComptePlus .titre_colonne_cliquable").click((e) => {
        if ($(e.currentTarget).next().find("table:visible").attr("id"))
          storage.setRaw("outiiil_boiteActive", "C");
        else storage.setRaw("outiiil_boiteActive", "R");
        $("#boiteComptePlus .contenu_boite_compte_plus table").toggle();
      });
      // fill the box
      this.refresh();
    }
    return this;
  }
  /**
   * Refreshes the radar box when an entry is added or removed.
   *
   * @private
   * @method actualiseBoite
   */
  refresh() {
    let show = storage.getRaw("outiiil_boiteActive"),
      // On ComptePlus the game's #requete field lives in a <tr><td> of
      // table:eq(0), which radar mode hides — so it is unreachable. A twin row is
      // inserted here in #o_radar's tfoot (id `o_requete` to avoid clashing with
      // the original left in the hidden table). Wired to the autocomplete
      // Toolzzz (`Player.search`) comme #recherche en non-C+.
      searchRow = Utils.comptePlus
        ? `<tr id='o_radarSearchRow'><td colspan='3'><form method='post' action='classementAlliance.php' style='text-align:center;'><input type='text' name='requete' id='o_requete' placeholder='Rechercher Joueur ou Alliance' autocomplete='off' style='text-align:center;width:95%;'/></form></td></tr>`
        : "",
      html = `<table id='o_radar' ${!show || show == "C" ? `style="display:none"` : ""}><colgroup><col><col><col></colgroup><tbody></tbody><tfoot><tr id='o_radarToolbar'><td colspan='3' class='right'><div id='o_radarToolbarInner'><a id='o_radarRefreshAll' class='o_actualiser' href='' title='Tout actualiser'><img src="${IMG_REFRESH}" alt="Tout actualiser" height="14"/></a><span id='o_radarAddSep' class='cursor' title='Ajouter une section'>+</span><span id='o_radarToggleEdit' class='cursor' title='Mode édition'>✎</span></div></td></tr>${searchRow}</tfoot></table>`;
    // replace the content, or add it
    if ($("#o_radar").length) $("#o_radar").replaceWith(html);
    else $("#boiteComptePlus .contenu_boite_compte_plus table").after(html);
    // Autocomplete on the search field injected for ComptePlus, wired to the
    // same backend as the free-account `#recherche` (Player.search →
    // Utils.extractResearch). It must be re-initialised on every rebuild because
    // the previous DOM is replaced.
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
    // `sortable` has to be (re)initialised on every rebuild of the table: a
    // `replaceWith` swaps the tbody for a new DOM node that carries no jQuery UI
    // sortable instance. Without this line, adding a player through "Surveiller"
    // silently broke drag-and-drop until the next page reload.
    $("#o_radar tbody").sortable({
      placeholder: "o_radarPlaceholder",
      // `cancel` stops a drag from starting on the listed elements;
      // `[contenteditable="true"]` is added so editing a separator's text in edit
      // mode does not start a drag by accident.
      cancel: 'input, textarea, button, select, option, [contenteditable="true"]',
      // Drag-and-drop is only active in edit mode (the iOS/Linear/Notion
      // pattern: edit, then reorder). In the normal view the list is read-only,
      // which avoids mis-drags.
      disabled: !this._editMode,
      update: (e, ui) => {
        this.computeOrder($("#o_radar tbody").sortable("serialize"));
      },
    });
    // event that refreshes a player's or an alliance's data
    $("#o_radar").off();
    // All three collections rendered together, ordered by ascending `ordreRadar`.
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
    // Player and alliance rows get two wrapped cells:
    //  - the first td in `<div.o_radarFirstCell>` (flex) — otherwise edit mode's
    //    `≡` lines up under the refresh icon, because a Fourmizzz rule forces
    //    `display: block` on the `<a>` elements of the ComptePlus panel.
    //  - the third td (terrain) in `<span.o_radarTerrainNum>` — so only the
    //    number is ellipsised in edit mode, without eating the `×`.
    // The wrappers are applied regardless of edit mode (visually identical
    // without the `≡` and without the ellipsis). `.detach()` keeps the handlers
    // already bound (notably the `.o_actualiser` click and the `<a>` of an
    // attackable terrain).
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
      // In edit mode, focus and select the new separator's text so a name can
      // be typed straight away (the default `Section` is replaced as soon as the
      // player types, since the text is selected).
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
    // Re-apply edit mode after every rebuild: the row DOM has been regenerated,
    // so the × and `contenteditable` need re-attaching.
    if (this._editMode) this._applyEdit();
    return this;
  }
  /**
   * Renders a separator row in the tbody. The inner `<div>` wrapper exists
   * because putting `display: flex` straight on a `<td>` breaks the table layout
   * (the cell shrinks to its content instead of filling the colspan). The
   * `data-id` lets computeOrder / removeSeparator / renameSeparator find the
   * entry again.
   */
  _renderSeparator(sep, index) {
    $("#o_radar tbody").append(
      `<tr id='o_item_${index}' class='o_radarSep' data-id='${sep.id}'><td colspan='3'><div class='o_radarSepInner'><span class='o_radarSepText'>${RadarBox._escapeHtml(sep.texte)}</span></div></td></tr>`,
    );
  }
  /**
   * Minimal escaping for user-supplied values injected as HTML.
   */
  static _escapeHtml(s) {
    return String(s).replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );
  }
  /**
   * Refreshes every watched entry (players and alliances) in parallel through
   * Promise.all. The browser caps itself at about 6 simultaneous connections per
   * origin, so 30 entries finish in a few waves without an explicit pool.
   * Deletions (players gone from the game) are applied afterwards to avoid a DOM
   * rebuild in the middle of the batch, which would break the highlights and the
   * refreshes still running.
   *
   * @private
   * @method _refreshAll
   */
  _refreshAll() {
    let entries = [...Object.values(this._players), ...Object.values(this._alliances)];
    if (!entries.length) return;
    let $btn = $("#o_radarRefreshAll");
    // Spin the button — the same 600ms as a per-row icon. No counter and no
    // disabling: the batch is too quick (1-2s in practice) for either to help.
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
   * Toggles edit mode.
   */
  _toggleEdit() {
    this._editMode = !this._editMode;
    this._applyEdit();
  }
  /**
   * Applies (or removes) the edit-mode affordances:
   *  - a clickable × on the right of every row (player, alliance or separator)
   *  - `contenteditable` separators for inline renaming
   */
  _applyEdit() {
    let on = this._editMode;
    $("#o_radar").toggleClass("o_radarEditMode", on);
    // Clear the affordances before re-applying: refresh() can be called while
    // _editMode is already true (for instance when adding a separator).
    $("#o_radar .o_radarDelete, #o_radar .o_radarDragHandle").remove();
    $(".o_radarSepText")
      .off("blur.radarSep keydown.radarSep input.radarSep")
      .removeAttr("contenteditable");
    $("#o_radar").off("click.radarDel");

    // Drag-and-drop follows the edit-mode state.
    if ($("#o_radar tbody").sortable("instance"))
      $("#o_radar tbody").sortable(on ? "enable" : "disable");

    if (!on) return;
    // Every row (player, alliance, separator) gets:
    //  - a `≡` on the left to advertise drag-and-drop
    //  - a `×` on the right for deletion
    // For players and alliances they go in the first and last `<td>`. For
    // separators they go inside `.o_radarSepInner` (the flex container), so they
    // become flex items and stay aligned around the text.
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
    // Separators: contenteditable, saved on blur, Enter to confirm, and a hard
    // cap of 16 characters (the ComptePlus panel is narrow; beyond that the text
    // would be visually clipped by the flex ellipsis). Truncating as the player
    // types is simpler than blocking input — replacing a selection, pasting and
    // so on are all handled in the same place.
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
    // Deletion is delegated on #o_radar: the × are spans added dynamically, and
    // delegation avoids re-binding on every rebuild.
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
