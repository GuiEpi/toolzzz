/*
 * AllianceMembers.ts
 * Hraesvelg
 **********************************************************************/

import { $, Clipboard, Highcharts, numeral } from "~/vendor";
import {
  IMG_ATT,
  IMG_DEF,
  IMG_UTILITY,
  TOAST_ERROR,
  TOAST_SUCCESS,
  TOAST_WARNING,
} from "~/constants";
import { Utils } from "~/lib/Utils";
import { getProfile } from "~/models/currentPlayer";
import { RankBox } from "~/boxes/Rank";
import { Alliance } from "~/models/Alliance";
import { Player } from "~/models/Player";
import { ForumPage } from "~/pages/Forum";
import { hasAllianceItems, store } from "~/storage";

/**
/**
 * The members table's "Copie simple" DataTables button. It has no action of its
 * own: the copying is done by Clipboard, delegated on the class (see run()).
 */
const PLAIN_COPY_BUTTON = {
  text: "Copie simple",
  className: "o_copieMembresSimple",
  action: () => {},
};

/**
 * Enriches the /alliance.php page.
 *
 * @class AllianceMembersPage
 * @constructor
 */
export class AllianceMembersPage {
  // Fields declared for TypeScript (Phase 2 was a straight conversion; real
  // typing is deferred — see .claude/plans/wxt-migration-followups.md).
  _plainCopyRows: string[];
  _alliance: any;
  _tools: any;
  _nativeGrades: any;
  _memberMap: any;
  _filters: any;
  _filterValues: any;
  constructor() {
    /**
     * builds the Alliance model
     */
    this._alliance = new Alliance({ tag: Utils.alliance });
    /**
     * connection to the alliance tools
     */
    this._tools = new ForumPage();
    /**
     * the game's own grade per nickname, captured before any SDC rank overwrites
     * it: the map offers both as separate filters
     */
    this._nativeGrades = {};
    /**
     * last full member list handed to the map (before filtering)
     */
    this._memberMap = null;
  }
  /**
   *
   */
  run() {
    // Delegated on the document: DataTables creates the button later, sometimes
    // after the alliance tools have answered.
    let plainCopy = new Clipboard(".o_copieMembresSimple", {
      text: () => this.plainCopyText(),
    });
    plainCopy.on("success", () => {
      $.toast({ ...TOAST_SUCCESS, text: "Les membres ont été copiés dans le presse papier." });
    });
    plainCopy.on("error", () => {
      $.toast({ ...TOAST_ERROR, text: "Une erreur a été rencontrée, la copie a échoué." });
    });
    // When the member table is already rendered, enrich it straight away.
    // Otherwise watch `#alliance` and react as soon as the table shows up (it
    // renders asynchronously on some variants of the page). When neither
    // exists — a page without the alliance UI, mobile, or an unusual DOM —
    // skip cleanly rather than crash on `observe(undefined)`.
    if ($("#tabMembresAlliance").length) {
      this.processMember();
      this.map();
      this.mapTab();
    } else if ($("#alliance").length) {
      let observer = new MutationObserver((mutationsList) => {
        this.processMember();
        this.map();
        this.mapTab();
        observer.disconnect();
      });
      observer.observe($("#alliance")[0], { childList: true });
    }
    return this;
  }
  /**
   * Text behind "Copie simple": a title, a blank line, the header, then one
   * line per member, columns separated by tabs and lines by CRLF.
   *
   * @method plainCopyText
   * @return {String}
   */
  plainCopyText() {
    return [
      `${Utils.server} | Membres ${Utils.alliance}`,
      "",
      ["", "", "Rang", "Pseudo", "", "Terrain", "", "Technologie", "Fourmiliere", "", "", ""].join(
        "\t",
      ),
      ...this._plainCopyRows,
    ].join("\r\n");
  }
  /**
   * Renders the changes made to the member table.
   *
   * @private
   * @method processMember
   */
  processMember() {
    $("#tabMembresAlliance td:eq(5)").css("white-space", "nowrap");
    $(".simulateur table[class='ligne_paire'] tr:eq(0) td:eq(1)").append(
      ` (${$("img[alt='Actif']").length})`,
    );
    $(".simulateur table[class='ligne_paire'] tr:eq(0) td:eq(3)").append(
      ` (${$("img[alt='Vacances']").length})`,
    );
    $(".simulateur table[class='ligne_paire'] tr:eq(1) td:eq(1)").append(
      ` (${$("img[alt='Inactif depuis 3 jours']").length})`,
    );
    $(".simulateur table[class='ligne_paire'] tr:eq(1) td:eq(3)").append(
      ` (${$("img[alt='Bannie']").length})`,
    );
    $(".simulateur table[class='ligne_paire'] tr:eq(2) td:eq(1)").append(
      ` (${$("img[alt='Inactif depuis 10 jours']").length})`,
    );
    $(".simulateur table[class='ligne_paire'] tr:eq(2) td:eq(3)").append(
      ` (${$("img[alt='Colonisé']").length})`,
    );
    // Raw rows for "Copie simple", taken before the table is enriched (icons,
    // SDC rank, Tdt/Retour columns).
    this._plainCopyRows = $("#tabMembresAlliance tr:gt(0)")
      .map((i, elt) => {
        const cell = (n) =>
          $(elt)
            .find(`td:eq(${n})`)
            .text()
            .replace(/\u00a0/g, " ")
            .trim();
        return ["", cell(1), cell(2), cell(3), "", cell(5), "", cell(7), cell(8), "", "", ""].join(
          "\t",
        );
      })
      .get();
    // add the alliance totals
    let tmpPlayers = {};
    $("#tabMembresAlliance tr:gt(0)").each((i, elt) => {
      let pseudo = $(elt).find("td:eq(3)").text(),
        terrain = numeral($(elt).find("td:eq(5)").text()).value();
      tmpPlayers[pseudo] = new Player({
        pseudo: pseudo,
        terrain: terrain,
        fourmiliere: ~~$(elt).find("td:eq(8)").text(),
        technologie: ~~$(elt).find("td:eq(7)").text(),
        // the game's own grade — shown as a fallback until an SDC rank is set,
        // and backfilled into the topics created by « Actualiser l'alliance ».
        // "/" is replaced because the forum topic title is parsed on " / ".
        rang: $(elt).find("td:eq(2)").text().trim().replace(/\//g, "-"),
      });
      this._nativeGrades[pseudo] = tmpPlayers[pseudo].rang;
      if (!Utils.comptePlus && !tmpPlayers[pseudo].isCurrentPlayer()) {
        if (tmpPlayers[pseudo].isAttackable()) $(elt).find("td:eq(6)").html(IMG_ATT);
        if (tmpPlayers[pseudo].isAttacker()) $(elt).find("td:eq(4)").html(IMG_DEF);
      }
    });
    this._alliance.joueurs = tmpPlayers;

    $("#tabMembresAlliance").append(
      `<tfoot class='${Object.keys(this._alliance.joueurs).length % 2 ? "ligne_paire" : ""}'><tr class='gras centre'><td colspan='12'>Terrain : <span id='totalTerrain'>${numeral(this._alliance.computeTerrain()).format()}</span> cm² | Fourmilière : ${numeral(this._alliance.computeColony()).format()} | Technologie : ${numeral(this._alliance.computeTechnology()).format()}.</td></tr></tfoot>`,
    );
    // read the alliance tools data, otherwise format the table directly
    $("#tabMembresAlliance tr:first").remove();
    $("#tabMembresAlliance").prepend(
      `<thead><tr class='alt'><th></th><th></th><th>Rang</th><th>Pseudo</th><th></th><th>Terrain</th><th></th><th><span style='padding-right:10px'>Technologie</span></th><th><span style='padding-right:10px'>Fourmiliere</span></th><th colspan='2'>Etat</th><th></th></tr></thead>`,
    );

    // when the alliance tools handle members
    if (getProfile().parametre["forumMembre"].valeur) {
      // read the orders from the alliance tools
      this._tools.viewSection(getProfile().parametre["forumMembre"].valeur).then(
        (data) => {
          if (this._tools.loadPlayer(data)) this.processTools();
        },
        (jqXHR, textStatus, errorThrown) => {
          $.toast({
            ...TOAST_ERROR,
            text: "Une erreur réseau a été rencontrée lors de la récupération des membres.",
          });
        },
      );
    } else this.tableWithCachedMap();
    return this;
  }
  /**
   * Variant of table() that uses the alliance map's local cache (filled by the
   * "Charger / Actualiser" button) to add the Tdt + Retour columns for
   * alliances whose SDC has not been bootstrapped by a leader. With no cache it
   * falls back to the plain table().
   *
   * @method tableWithCachedMap
   */
  tableWithCachedMap() {
    let cached = null;
    try {
      cached = hasAllianceItems() ? store.allianceMap.get() : null;
    } catch (e) {
      cached = null;
    }
    const hasCache = cached && cached.members && cached.members.length;
    if (hasCache) {
      // hydrate the coordinates from the cache
      const coordsByPseudo = new Map();
      cached.members.forEach((m) => coordsByPseudo.set(m.pseudo, { x: m.x, y: m.y }));
      for (const pseudo in this._alliance.joueurs) {
        if (coordsByPseudo.has(pseudo)) {
          Object.assign(this._alliance.joueurs[pseudo], coordsByPseudo.get(pseudo));
        }
      }
      // add the Tdt + Retour columns between Fourmilière and Etat
      $("#tabMembresAlliance th:eq(8)").after(`<th>Tdt</th><th>Retour</th>`);
      $("#tabMembresAlliance tfoot td:eq(0)").attr("colspan", 14);
      $("#tabMembresAlliance tr:gt(0):lt(-1)").each((i, elt) => {
        const pseudo = $(elt).find("td:eq(3)").text();
        const j = this._alliance.joueurs[pseudo];
        const has = j && j.x !== -1 && j.y !== -1;
        let tdHtml;
        if (has) {
          const tdt = getProfile().getTravelTimeTo(j);
          const retour = Utils.roundMinute(tdt);
          // data-order: DataTables sorts on the attribute (a raw integer) rather
          // than on the displayed text ("22h 31m" would sort alphabetically).
          tdHtml = `<td data-order='${tdt}'>${Utils.intToTime(tdt)}</td><td data-order='${retour.unix()}'>${retour.format("D MMM à HH[h]mm")}</td>`;
        } else {
          tdHtml = `<td data-order='-1'>N/C</td><td data-order='-1'>N/C</td>`;
        }
        $(elt).find("td:eq(8)").after(tdHtml);
      });
      // DataTables — targets shifted vs table(): Etat-2 and last move from 10/11 to 12/13
      $("#tabMembresAlliance th:eq(7), #tabMembresAlliance th:eq(8)").css({
        maxWidth: "50px",
        textOverflow: "ellipsis",
        overflow: "hidden",
      });
      $("#tabMembresAlliance").DataTable({
        bInfo: false,
        bPaginate: false,
        bAutoWidth: false,
        dom: "Bfrti",
        buttons: ["colvis", "copyHtml5", PLAIN_COPY_BUTTON, "csvHtml5", "excelHtml5"],
        order: [],
        stripeClasses: ["", "alt"],
        responsive: true,
        language: {
          zeroRecords: "Aucun joueur trouvé",
          infoEmpty: "Aucun enregistrement",
          infoFiltered: "(Filtré par _MAX_ enregistrements)",
          search: "Rechercher : ",
          buttons: { colvis: "Colonne", copy: "Copier" },
        },
        columnDefs: [
          { type: "quantite-grade", targets: 5 },
          { sortable: false, targets: [0, 1, 4, 6, 12, 13] },
        ],
      });
    } else {
      this.table();
    }
    // Synchronise button — always available (bootstrap without a cache, refresh
    // otherwise). Reloads the page afterwards so the table picks the coordinates up.
    $("#tabMembresAlliance_wrapper .dt-buttons").prepend(
      `<a id='o_syncCarteAlliance' class='dt-button' href='#'><span>Synchroniser</span></a>`,
    );
    $("#o_syncCarteAlliance").click((e) => {
      e.preventDefault();
      const $btn = $("#o_syncCarteAlliance");
      $btn.addClass("disabled").find("span").text("Synchronisation...");
      this._fetchAndCacheCoords()
        .then(() => location.reload())
        .catch((err) => {
          $btn.removeClass("disabled").find("span").text("Synchroniser");
          $.toast({
            ...TOAST_ERROR,
            text: err.message || "Erreur de synchronisation.",
          });
        });
      return false;
    });
    return this;
  }
  /**
   * Adds sorting.
   *
   * @private
   * @method table
   */
  table() {
    $("#tabMembresAlliance th:eq(7), #tabMembresAlliance th:eq(8)").css({
      maxWidth: "50px",
      textOverflow: "ellipsis",
      overflow: "hidden",
    });
    $("#tabMembresAlliance").DataTable({
      bInfo: false,
      bPaginate: false,
      bAutoWidth: false,
      dom: "Bfrti",
      buttons: ["colvis", "copyHtml5", PLAIN_COPY_BUTTON, "csvHtml5", "excelHtml5"],
      order: [],
      stripeClasses: ["", "alt"],
      responsive: true,
      language: {
        zeroRecords: "Aucun joueur trouvé",
        infoEmpty: "Aucun enregistrement",
        infoFiltered: "(Filtré par _MAX_ enregistrements)",
        search: "Rechercher : ",
        buttons: { colvis: "Colonne", copy: "Copier" },
      },
      columnDefs: [
        { type: "quantite-grade", targets: 5 },
        { sortable: false, targets: [0, 1, 4, 6, 10, 11] },
      ],
    });
    return this;
  }
  /**
   * Adds the SDC information.
   *
   * @private
   * @method processTools
   */
  processTools() {
    for (let pseudo in this._tools.alliance.joueurs) {
      // the key belongs to the member table
      if (this._alliance.joueurs.hasOwnProperty(pseudo)) {
        this._alliance.joueurs[pseudo].x = this._tools.alliance.joueurs[pseudo].x;
        this._alliance.joueurs[pseudo].y = this._tools.alliance.joueurs[pseudo].y;
        this._alliance.joueurs[pseudo].id = this._tools.alliance.joueurs[pseudo].id;
        this._alliance.joueurs[pseudo].sujetForum = this._tools.alliance.joueurs[pseudo].sujetForum;
        // only override the game's grade when an SDC rank was actually set
        if (this._tools.alliance.joueurs[pseudo].rang) {
          this._alliance.joueurs[pseudo].rang = this._tools.alliance.joueurs[pseudo].rang;
          this._alliance.joueurs[pseudo].ordreRang = this._tools.alliance.joueurs[pseudo].ordreRang;
        }
      }
    }
    // redraw the level columns
    $("#tabMembresAlliance th:eq(1)").after(`<th>Grade</th>`);
    $("#tabMembresAlliance th:eq(9)").after(`<th>Tdt</th><th>Retour</th>`);
    $("#tabMembresAlliance tfoot td:eq(0)").attr("colspan", 15);
    // fill in the remaining data
    $("#tabMembresAlliance tr:gt(0):lt(-1)").each((i, elt) => {
      let pseudo = $(elt).find("td:eq(3)").text();
      // with coordinates known, show the travel times
      $(elt)
        .find("td:eq(1)")
        .after(
          `<td align="center">${this._alliance.joueurs.hasOwnProperty(pseudo) ? this._alliance.joueurs[pseudo].rang : Utils.alliance}</td>`,
        );
      $(elt)
        .find("td:eq(9)")
        .after(
          this._alliance.joueurs[pseudo].x != -1 && this._alliance.joueurs[pseudo].y != -1
            ? `<td>${Utils.intToTime(getProfile().getTravelTimeTo(this._alliance.joueurs[pseudo]))}</td><td>${Utils.roundMinute(getProfile().getTravelTimeTo(this._alliance.joueurs[pseudo])).format("D MMM à HH[h]mm")}</td>`
            : `<td>N/C</td><td>N/C</td>`,
        );
      // alliance leaders can edit the ranks of players known to the tools
      if (
        $("img[src='images/crayon.gif']").length &&
        this._alliance.joueurs.hasOwnProperty(pseudo)
      ) {
        $(elt)
          .find("td:eq(0)")
          .append(
            `<a id="o_rang${this._alliance.joueurs[pseudo].id}" href=""><img src="${IMG_UTILITY}" alt="rang"/></a>`,
          );
        $("#o_rang" + this._alliance.joueurs[pseudo].id).click((e) => {
          let boxForm = new RankBox(this._alliance.joueurs[pseudo], this._tools, this);
          boxForm.render();
          return false;
        });
      }
    });
    this.toolsTable().optionAdmin();
    return this;
  }
  /**
   *
   */
  optionAdmin() {
    // alliance leaders can refresh the members
    if ($("img[src='images/crayon.gif']").length) {
      $("#tabMembresAlliance_wrapper .dt-buttons").prepend(
        `<a id="o_actualiserAlliance" class="dt-button" href="#"><span>Actualiser l'alliance</span></a>`,
      );
      $("#o_actualiserAlliance").click((e) => {
        let promisePlayer = new Array(),
          pseudoPlayer = new Array();
        // fetch the coordinates when they are unknown
        for (let player in this._alliance.joueurs) {
          // player unknown to the alliance tools
          if (!this._tools.alliance.joueurs.hasOwnProperty(player))
            this._tools.alliance.joueurs[player] = this._alliance.joueurs[player];
          // coordinates still unknown
          if (
            this._tools.alliance.joueurs[player].x == -1 &&
            this._tools.alliance.joueurs[player].y == -1
          ) {
            promisePlayer.push(this._tools.alliance.joueurs[player].getProfile());
            pseudoPlayer.push(player);
          }
        }
        // fetch every player's profile
        Promise.all(promisePlayer).then((values) => {
          let promiseForum = new Array(),
            player = null;
          for (let i = 0; i < values.length; i++) {
            player = this._tools.alliance.joueurs[pseudoPlayer[i]];
            player.loadProfile(values[i]);
            // save
            if (!player.sujetForum)
              promiseForum.push(
                this._tools.createTopic(
                  player.toToolsFormat(),
                  " ",
                  getProfile().parametre["forumMembre"].valeur,
                ),
              );
          }
          // create topics for the members that have none
          Promise.all(promiseForum).then((values) => {
            $.toast({ ...TOAST_SUCCESS, text: "la mise à jour c'est correctement effectuée." });
            this.refreshMember();
          });
        });
        return false;
      });
    }
    return this;
  }
  /**
   *
   */
  refreshMember() {
    $("#tabMembresAlliance").DataTable().destroy();
    // update the alliance
    for (let pseudo in this._tools.alliance.joueurs) {
      // the key belongs to the member table
      if (this._alliance.joueurs.hasOwnProperty(pseudo)) {
        this._alliance.joueurs[pseudo].x = this._tools.alliance.joueurs[pseudo].x;
        this._alliance.joueurs[pseudo].y = this._tools.alliance.joueurs[pseudo].y;
        this._alliance.joueurs[pseudo].id = this._tools.alliance.joueurs[pseudo].id;
        // only override the game's grade when an SDC rank was actually set
        if (this._tools.alliance.joueurs[pseudo].rang) {
          this._alliance.joueurs[pseudo].rang = this._tools.alliance.joueurs[pseudo].rang;
          this._alliance.joueurs[pseudo].ordreRang = this._tools.alliance.joueurs[pseudo].ordreRang;
        }
      }
    }
    $("#tabMembresAlliance tr:gt(0):lt(-1)").each((i, elt) => {
      let pseudo = $(elt).find("td:eq(4)").text();
      $(elt)
        .find("td:eq(2)")
        .text(
          this._alliance.joueurs.hasOwnProperty(pseudo)
            ? this._alliance.joueurs[pseudo].rang
            : Utils.alliance,
        );
      $(elt)
        .find("td:eq(10)")
        .text(Utils.intToTime(getProfile().getTravelTimeTo(this._alliance.joueurs[pseudo])));
      $(elt)
        .find("td:eq(11)")
        .text(
          Utils.roundMinute(getProfile().getTravelTimeTo(this._alliance.joueurs[pseudo])).format(
            "D MMM à HH[h]mm",
          ),
        );
    });
    this.toolsTable().optionAdmin();
    return this;
  }
  /**
   * Adds sorting.
   *
   * @private
   * @method toolsTable
   */
  toolsTable() {
    $("#tabMembresAlliance th:eq(8), #tabMembresAlliance th:eq(9)").css({
      maxWidth: "50px",
      textOverflow: "ellipsis",
      overflow: "hidden",
    });
    $("#tabMembresAlliance").DataTable({
      bInfo: false,
      bPaginate: false,
      bAutoWidth: false,
      dom: "Bfrti",
      order: [],
      stripeClasses: ["", "alt"],
      buttons: ["colvis", "copyHtml5", PLAIN_COPY_BUTTON, "csvHtml5", "excelHtml5"],
      responsive: true,
      language: {
        zeroRecords: "Aucun joueur trouvé",
        info: "Page _PAGE_ de _PAGES_",
        infoEmpty: "Aucun enregistrement",
        infoFiltered: "(Filtré par _MAX_ enregistrements)",
        search: "Rechercher : ",
        buttons: { colvis: "Colonne", copy: "Copier" },
      },
      columnDefs: [
        { type: "quantite-grade", targets: 6 },
        { visible: false, targets: [3, 8, 9] },
        { sortable: false, targets: [0, 1, 5, 7, 12, 13, 14] },
      ],
    });
    return this;
  }
  /**
   * Injects the "Carte de l'alliance" section at the bottom of the page.
   * Loads from localStorage when available; refreshed manually by the button.
   *
   * @method map
   */
  map() {
    if ($("#o_carteAlliance").length) return this; // déjà rendue
    $("#alliance").after(`
      <div id='o_carteAlliance' class='boite_amelioration simulateur centre' style='display:none;'>
        <h2>Carte de l'alliance</h2>
        <p class='reduce'>Carte interactive des positions des membres. <b>Survole</b> un point pour voir les temps de trajet depuis ta fourmilière. <b>Drag</b> pour zoomer sur une zone, <b>clic</b> sur un point pour zoomer 4× dessus (utile dans les clusters denses). Données chargées à la demande puis mises en cache localement.</p>
        <div class='centre o_marginT15'>
          <button id='o_carteAllianceRefresh' class='o_button f_info'>Charger / Actualiser</button>
          <button id='o_carteAllianceExportForum' class='o_button f_success' style='margin-left:8px;'>Exporter pour le forum</button>
          <span id='o_carteAllianceStatus' class='reduce' style='margin-left:12px;color:#666;'></span>
        </div>
        <div id='o_carteFiltres' class='left o_marginT15' style='display:none;'></div>
        <div id='o_carteAllianceChart' style='height:800px;margin-top:15px;display:none;'></div>
      </div>
    `);
    let cached = null;
    try {
      cached = hasAllianceItems() ? store.allianceMap.get() : null;
    } catch (e) {
      cached = null;
    }
    if (cached && cached.members && cached.members.length) {
      this._renderMap(cached.members);
      this._renderAge(cached.timestamp);
    }
    $("#o_carteAllianceRefresh").click(() => this._refreshMap());
    $("#o_carteAllianceExportForum").click(() => this._exportMapForumPng());
    return this;
  }
  /**
   * Wires up the "Carte" tab of the Alliance menu (injected on every page by the
   * content script): intercepts the click for a client-side toggle, and switches
   * automatically when the page is loaded with the #carte hash (i.e. arriving
   * from another alliance page).
   *
   * @method mapTab
   */
  mapTab() {
    if (!$("#o_ongletCarte").length) return this;
    const showMap = () => {
      $("#alliance").hide();
      $("#o_carteAlliance").show();
    };
    $("#o_ongletCarte").click((e) => {
      e.preventDefault();
      showMap();
    });
    if (location.hash === "#carte") showMap();
    return this;
  }
  /**
   * Fetches every member's coordinates and persists them to localStorage.
   * Touches no UI — the callers (map / member table) handle their own feedback.
   *
   * @private
   * @method _fetchAndCacheCoords
   * @returns {Promise<{members, timestamp}>}
   */
  _fetchAndCacheCoords() {
    const pseudos = Object.keys(this._alliance.joueurs);
    if (!pseudos.length) {
      return Promise.reject(new Error("Aucun membre détecté dans l'alliance."));
    }
    const promises = pseudos.map((pseudo) => {
      const player = this._alliance.joueurs[pseudo];
      return player
        .getProfile()
        .then((html) => {
          player.loadProfile(html);
          return player;
        })
        .catch(() => null);
    });
    return Promise.all(promises).then((players) => {
      const members = players
        .filter((j) => j && j.x !== -1 && j.y !== -1)
        .map((j) => ({
          pseudo: j.pseudo,
          x: j.x,
          y: j.y,
          terrain: j.terrain || 0,
        }));
      if (!members.length) throw new Error("Aucune coordonnée récupérée.");
      const timestamp = Date.now();
      try {
        if (hasAllianceItems()) store.allianceMap.set({ timestamp, members });
      } catch (e) {
        console.warn("outiiil: localStorage write failed", e);
      }
      return { members, timestamp };
    });
  }
  /**
   * Refreshes the map (map UI plus the Highcharts render).
   *
   * @private
   * @method _refreshMap
   */
  _refreshMap() {
    const pseudos = Object.keys(this._alliance.joueurs);
    $("#o_carteAllianceRefresh")
      .prop("disabled", true)
      .text(`Chargement de ${pseudos.length} profils...`);
    $("#o_carteAllianceStatus").text("");
    this._fetchAndCacheCoords()
      .then(({ members, timestamp }) => {
        $("#o_carteAllianceRefresh").prop("disabled", false).text("Charger / Actualiser");
        $.toast({
          ...TOAST_SUCCESS,
          text: `Carte mise à jour : ${members.length} membres positionnés.`,
        });
        this._renderAge(timestamp);
        this._renderMap(members);
      })
      .catch((err) => {
        $("#o_carteAllianceRefresh").prop("disabled", false).text("Charger / Actualiser");
        $.toast({
          ...TOAST_ERROR,
          text: err.message || "Erreur lors du chargement des profils.",
        });
      });
  }
  /**
   * Draws a plain PNG on a canvas with the game's real proportions (one cell is
   * 5 X units by 50 Y units, hence pxPerY = pxPerX / 10). A tall, narrow image
   * without grid or axes, meant for sharing on the alliance forum. It reads the
   * coordinate cache directly (the Highcharts chart does not need to
   * soit rendu).
   *
   * @private
   * @method _exportMapForumPng
   */
  _exportMapForumPng() {
    let cached = null;
    try {
      cached = hasAllianceItems() ? store.allianceMap.get() : null;
    } catch (e) {
      cached = null;
    }
    if (!cached || !cached.members || !cached.members.length) {
      $.toast({
        ...TOAST_WARNING,
        text: "Charge d'abord la carte avant de pouvoir l'exporter pour le forum.",
      });
      return;
    }
    // same selection as the on-screen map
    if (!this._filters) this._filters = this._loadFilters();
    const members = this._filterMembers(this._memberMap || cached.members);
    if (!members.length) {
      $.toast({
        ...TOAST_WARNING,
        text: "Aucun membre affiché : élargis les filtres avant d'exporter.",
      });
      return;
    }
    const xs = members.map((m) => m.x);
    const ys = members.map((m) => m.y);
    const xMin = Math.min(...xs);
    const xMax = Math.max(...xs);
    const yMin = Math.min(...ys);
    const yMax = Math.max(...ys);
    // Scale: one game cell is 5 X by 50 Y → pxPerY = pxPerX / 10 so the cells
    // look square (the game's real proportions).
    const PX_PER_X = 14;
    const PX_PER_Y = PX_PER_X / 10;
    // enough padding for the axis ticks (X on top, Y on the left)
    const PAD_LEFT = 38;
    const PAD_TOP = 26;
    const PAD_BOTTOM = 16;
    const PAD_RIGHT_MIN = 16;
    const LABEL_LINE_H = 13;
    const LABEL_GAP = 8;
    // Measure label widths on a scratch canvas first, so collisions are known
    // before the real canvas is sized.
    const tmp = document.createElement("canvas").getContext("2d");
    tmp.font = "bold 11px sans-serif";
    // Sorted top→bottom, left→right: a greedy pass that pushes a label down as
    // soon as it would overlap one already placed.
    const sorted = [...members].sort((a, b) => a.y - b.y || a.x - b.x);
    const placed = [];
    const positions = sorted.map((m) => {
      const dotX = (m.x - xMin) * PX_PER_X + PAD_LEFT;
      const dotY = (m.y - yMin) * PX_PER_Y + PAD_TOP;
      const labelW = tmp.measureText(m.pseudo).width;
      const labelX = dotX + LABEL_GAP;
      let labelY = dotY;
      while (
        placed.some(
          (p) =>
            labelX < p.x + p.w + 4 &&
            labelX + labelW + 4 > p.x &&
            Math.abs(labelY - p.y) < LABEL_LINE_H,
        )
      ) {
        labelY += LABEL_LINE_H;
      }
      placed.push({ x: labelX, y: labelY, w: labelW });
      return { m, dotX, dotY, labelX, labelY, labelW };
    });
    // Canvas size from the final positions (labels may have been pushed down in
    // dense clusters). It is also extended to cover the rounded-up top tick, so
    // 50 / 1900 / etc. always remain visible.
    const maxRight = Math.max(...positions.map((p) => p.labelX + p.labelW));
    const maxBottom = Math.max(...positions.map((p) => Math.max(p.labelY + 6, p.dotY + 4)));
    const yRange = yMax - yMin;
    const yStep = yRange > 1500 ? 200 : yRange > 500 ? 100 : 50;
    const xStep = 5;
    const xTickEnd = Math.ceil(xMax / xStep) * xStep;
    const yTickEnd = Math.ceil(yMax / yStep) * yStep;
    const tickRight = (xTickEnd - xMin) * PX_PER_X + PAD_LEFT;
    const tickBottom = (yTickEnd - yMin) * PX_PER_Y + PAD_TOP;
    const W = Math.max(220, Math.max(maxRight, tickRight) + PAD_RIGHT_MIN);
    const H = Math.max(220, Math.max(maxBottom, tickBottom) + PAD_BOTTOM);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(W);
    canvas.height = Math.round(H);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Axis ticks — yStep and xStep were computed above.
    ctx.strokeStyle = "#eee";
    ctx.lineWidth = 0.5;
    ctx.fillStyle = "#888";
    ctx.font = "10px sans-serif";
    // Vertical grid (X) and labels on top. The upper bound is rounded up to include 50, etc.
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    const xGridStart = Math.floor(xMin / xStep) * xStep;
    for (let x = xGridStart; x <= xTickEnd; x += xStep) {
      if (x < xMin) continue;
      const px = (x - xMin) * PX_PER_X + PAD_LEFT;
      ctx.beginPath();
      ctx.moveTo(px, PAD_TOP);
      ctx.lineTo(px, canvas.height - PAD_BOTTOM);
      ctx.stroke();
      ctx.fillText(x.toString(), px, PAD_TOP - 6);
    }
    // Horizontal grid (Y) and labels on the left. Upper bound rounded up to include 1900, etc.
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    const yGridStart = Math.floor(yMin / yStep) * yStep;
    for (let y = yGridStart; y <= yTickEnd; y += yStep) {
      if (y < yMin) continue;
      const py = (y - yMin) * PX_PER_Y + PAD_TOP;
      ctx.beginPath();
      ctx.moveTo(PAD_LEFT, py);
      ctx.lineTo(canvas.width - PAD_RIGHT_MIN, py);
      ctx.stroke();
      ctx.fillText(y.toString(), PAD_LEFT - 4, py);
    }
    ctx.font = "bold 11px sans-serif";
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    for (const pos of positions) {
      const { m, dotX, dotY, labelX, labelY } = pos;
      // A thin grey connector when the label was moved to avoid a collision,
      // otherwise it is no longer clear which label belongs to which dot.
      if (Math.abs(labelY - dotY) > 1) {
        ctx.strokeStyle = "#bbb";
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(dotX + 4, dotY);
        ctx.lineTo(labelX - 1, labelY);
        ctx.stroke();
      }
      // Every colony in red: the image is meant for the forum, so there is no
      // reason to single the author out.
      ctx.fillStyle = "#c0392b";
      ctx.beginPath();
      ctx.arc(dotX, dotY, 4, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = "#000";
      ctx.fillText(m.pseudo, labelX, labelY);
    }
    canvas.toBlob((blob) => {
      if (!blob) {
        $.toast({ ...TOAST_ERROR, text: "Erreur lors de la génération du PNG forum." });
        return;
      }
      const date = new Date().toISOString().slice(0, 10);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `toolzzz-carte-forum-${Utils.alliance}-${date}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    }, "image/png");
  }
  /**
   * Shows the timestamp in plain words next to the button.
   *
   * @private
   * @method _renderAge
   */
  _renderAge(timestamp) {
    const minutes = Math.floor((Date.now() - timestamp) / 60000);
    let age;
    if (minutes < 1) age = "à l'instant";
    else if (minutes < 60) age = `il y a ${minutes} min`;
    else if (minutes < 1440) age = `il y a ${Math.floor(minutes / 60)}h`;
    else age = `il y a ${Math.floor(minutes / 1440)}j`;
    $("#o_carteAllianceStatus").text(`Données ${age}`);
  }
  /**
   * Current selection. What is stored is what is *hidden*, not what is shown: a
   * member or a grade that appeared since the last visit is visible by default
   * instead of being silently missing from the map.
   *
   * @private
   * @method _loadFilters
   */
  _loadFilters() {
    let f: any = {};
    try {
      f = hasAllianceItems() ? store.allianceMapFilters.get() : {};
    } catch (e) {
      f = {};
    }
    return {
      grades: f.grades || [],
      rangs: f.rangs || [],
      joueurs: f.joueurs || [],
    };
  }
  /**
   *
   * @private
   * @method _saveFilters
   */
  _saveFilters() {
    try {
      if (hasAllianceItems()) store.allianceMapFilters.set(this._filters);
    } catch (e) {
      console.warn("outiiil: localStorage write failed", e);
    }
    return this;
  }
  /**
   * A member's own grade, as the game gives it.
   *
   * @private
   * @method _gradeOf
   */
  _gradeOf(pseudo) {
    return this._nativeGrades[pseudo] || "Sans grade";
  }
  /**
   * A member's SDC rank, or an empty string when the alliance does not use the
   * SDC or nothing was entered for them.
   *
   * @private
   * @method _sdcRankOf
   */
  _sdcRankOf(pseudo) {
    // `alliance` stays null until the SDC section has loaded, and keeps that
    // value when the alliance does not use the tools
    let alliance = this._tools.alliance,
      player = alliance && alliance.joueurs ? alliance.joueurs[pseudo] : null;
    return (player && player.rang) || "";
  }
  /**
   * Applies the selection to a member list. A member without an SDC rank is
   * never hidden by the rank filter — otherwise every alliance not using the
   * SDC would see its map go empty.
   *
   * @private
   * @method _filterMembers
   */
  _filterMembers(membres) {
    let f = this._filters;
    return membres.filter((m) => {
      let rank = this._sdcRankOf(m.pseudo);
      return (
        f.grades.indexOf(this._gradeOf(m.pseudo)) == -1 &&
        (!rank || f.rangs.indexOf(rank) == -1) &&
        f.joueurs.indexOf(m.pseudo) == -1
      );
    });
  }
  /**
   * Builds the filter block: one checkbox per grade, one per SDC rank when the
   * alliance has them, and the collapsible list of players.
   *
   * @private
   * @method _buildFilters
   */
  _buildFilters(membres) {
    const esc = (t) => $("<div>").text(t).html();
    // An alliance grade is free text: every leader puts whatever they like in
    // it, often long and decorated. No attempt is made to guess its formatting;
    // only the invisible fillers (U+3164, non-breaking spaces…) that punch holes
    // in the list are stripped, and the text is truncated so the checkboxes stay
    // aligned. The full label lives in the tooltip and the filtered value stays
    // the raw grade.
    const lisible = (t) => {
      let net = t
        .replace(/[\u3164\u00a0\u200b\u2800]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      return esc(net.length > 34 ? net.slice(0, 34) + "…" : net || t);
    };
    // values passed by index: a grade may contain any character
    let account = (valeur, accesseur) =>
        membres.filter((m) => accesseur.call(this, m.pseudo) == valeur).length,
      // most-worn grades first: in many alliances every member has their own
      // decorative grade, and the few shared ones (VIP, passeurs…) are exactly
      // the ones worth filtering on
      byEffectif = (accesseur) => (a, b) =>
        account(b, accesseur) - account(a, accesseur) || a.localeCompare(b),
      grades = [...new Set(membres.map((m) => this._gradeOf(m.pseudo)))].sort(
        byEffectif(this._gradeOf),
      ),
      rangs = [...new Set(membres.map((m) => this._sdcRankOf(m.pseudo)).filter((r) => r))].sort(
        byEffectif(this._sdcRankOf),
      ),
      pseudos = membres.map((m) => m.pseudo).sort(),
      cases = (list, classe, accesseur) =>
        list
          .map(
            (v, i) =>
              `<label title='${esc(v)}'><input type='checkbox' class='${classe}' data-i='${i}'/> ${lisible(v)}${accesseur ? ` <span class='reduce'>(${account(v, accesseur)})</span>` : ""}</label>`,
          )
          .join("");
    this._filterValues = { grades: grades, rangs: rangs, joueurs: pseudos };
    // one unique grade per member groups nothing: say so rather than show a
    // grade list that merely duplicates the player list
    let partages = grades.filter((g) => account(g, this._gradeOf) > 1).length;
    // Every section is collapsed by default to keep the page light. The title
    // says how many entries are hidden, so an active filter stays visible even
    // when the section is closed.
    let section = (id, titre, contenu) =>
      `<p class='left reduce gras'>${titre} <span id='${id}Masques' class='reduce' style='font-weight:normal;'></span> <span class='o_filtreVoir cliquable2 cursor' data-cible='${id}' style='font-size:0.8em;font-weight:normal;'>Afficher la liste</span></p>
      <div id='${id}' style='display:none;'>${contenu}</div>`;
    let html = section(
      "o_filtreGrades",
      "Grades",
      `${partages ? "" : `<p class='left small'><em>Chaque membre a un grade différent dans cette alliance : la liste des joueurs sera sans doute plus pratique.</em></p>`}
        <div>${cases(grades, "o_filtreGrade", this._gradeOf)}</div>`,
    );
    if (rangs.length)
      html += section(
        "o_filtreRangs",
        "Rangs SDC",
        `<div>${cases(rangs, "o_filtreRang", this._sdcRankOf)}</div>`,
      );
    html += section(
      "o_filtreJoueurs",
      "Joueurs",
      `<p class='left small'><em><span id='o_filtreTout' class='souligne cursor'>Tout cocher</span> · <span id='o_filtreAucun' class='souligne cursor'>Tout décocher</span></em></p>
        <div>${cases(pseudos, "o_filtreJoueur", null)}</div>`,
    );
    $("#o_carteFiltres").html(html).show();
    // initial checkbox state from the stored selection
    let poser = (classe, valeurs, exclus) =>
      $("." + classe).each((i, elt) => {
        $(elt).prop("checked", exclus.indexOf(valeurs[$(elt).data("i")]) == -1);
      });
    poser("o_filtreGrade", grades, this._filters.grades);
    poser("o_filtreRang", rangs, this._filters.rangs);
    poser("o_filtreJoueur", pseudos, this._filters.joueurs);
    let renderMasques = () => {
      let label = (n) => (n ? `(${n} masqué${n > 1 ? "s" : ""})` : "");
      $("#o_filtreGradesMasques").text(label(this._filters.grades.length));
      $("#o_filtreRangsMasques").text(label(this._filters.rangs.length));
      $("#o_filtreJoueursMasques").text(label(this._filters.joueurs.length));
    };
    renderMasques();
    let apply = () => {
      let read = (classe, valeurs) =>
        $("." + classe)
          .filter((i, elt) => !elt.checked)
          .map((i, elt) => valeurs[$(elt).data("i")])
          .get();
      this._filters = {
        grades: read("o_filtreGrade", grades),
        rangs: read("o_filtreRang", rangs),
        joueurs: read("o_filtreJoueur", pseudos),
      };
      this._saveFilters();
      renderMasques();
      this._drawMap(this._filterMembers(this._memberMap), this._memberMap.length);
    };
    $("#o_carteFiltres input[type=checkbox]").on("change", apply);
    $("#o_carteFiltres .o_filtreVoir").click((e) => {
      let cible = $("#" + $(e.currentTarget).data("cible"));
      cible.toggle();
      $(e.currentTarget).text(cible.is(":visible") ? "Masquer la liste" : "Afficher la liste");
    });
    $("#o_filtreTout").click(() => {
      $(".o_filtreJoueur").prop("checked", true);
      apply();
    });
    $("#o_filtreAucun").click(() => {
      $(".o_filtreJoueur").prop("checked", false);
      apply();
    });
    return this;
  }
  /**
   * Map entry point: keeps the full list, (re)builds the filters, then draws the
   * filtered map.
   *
   * @private
   * @method _renderMap
   */
  _renderMap(membres) {
    this._memberMap = membres;
    this._filters = this._loadFilters();
    this._buildFilters(membres);
    return this._drawMap(this._filterMembers(membres), membres.length);
  }
  /**
   * Highcharts render into #o_carteAllianceChart.
   * Groups members by cell (x,y), draws the links below a threshold, and shows a
   * tooltip with the travel time (without / with the attack-speed bonus).
   *
   * @private
   * @method _drawMap
   * @param {Array} members membres à tracer (déjà filtrés)
   * @param {Integer} total effectif avant filtrage, pour le titre
   */
  _drawMap(members, total) {
    $("#o_carteAllianceChart").show();
    // Silences Highcharts warning #15: our `line` series are arbitrary edges
    // between cells (a→b in any direction), so the x values are not monotonically
    // increasing. The render is fine, it is only a console warning.
    Highcharts.seriesTypes.line.prototype.requireSorting = false;
    const K_NEIGHBORS = 3; // chaque case reliée à ses K cases les plus proches
    const levelSpeedAttack = getProfile().niveauRecherche[6] || 0;
    members.forEach((m) => {
      m.isMe = m.pseudo === getProfile().pseudo;
    });
    const me = members.find((m) => m.isMe) || { x: getProfile().x, y: getProfile().y };
    const timeTravel = (target, levelVit) =>
      Math.ceil(
        Math.pow(0.9, levelVit) *
          637200 *
          (1 - Math.exp(-Math.hypot(target.x - me.x, target.y - me.y) / 350)),
      );
    // Regroupement par case (x, y)
    const spotMap = new Map();
    for (const m of members) {
      const key = `${m.x},${m.y}`;
      if (!spotMap.has(key)) spotMap.set(key, { x: m.x, y: m.y, members: [] });
      spotMap.get(key).members.push(m);
    }
    const spots = [...spotMap.values()].map((s) => ({
      ...s,
      isMyGroup: s.members.some((m) => m.isMe),
    }));
    // Links: K nearest neighbours (adapts to how spread out the alliance is)
    const edgeSet = new Set<string>();
    for (let i = 0; i < spots.length; i++) {
      const others = spots
        .map((s, j) => ({ idx: j, d: Math.hypot(s.x - spots[i].x, s.y - spots[i].y) }))
        .filter((o) => o.idx !== i)
        .sort((a, b) => a.d - b.d)
        .slice(0, K_NEIGHBORS);
      others.forEach((o) => {
        const key = i < o.idx ? `${i}-${o.idx}` : `${o.idx}-${i}`;
        edgeSet.add(key);
      });
    }
    const edges = [...edgeSet].map((key) => {
      const [i, j] = key.split("-").map(Number);
      return [spots[i], spots[j]];
    });
    // Two series: links to me (green) versus links between other members (grey)
    const myLineData = [];
    const otherLineData = [];
    edges.forEach(([a, b]) => {
      const target = a.isMyGroup || b.isMyGroup ? myLineData : otherLineData;
      target.push([a.x, a.y]);
      target.push([b.x, b.y]);
      target.push([null, null]);
    });
    // Stats
    const allDists = [];
    for (let i = 0; i < spots.length; i++) {
      for (let j = i + 1; j < spots.length; j++) {
        allDists.push(Math.hypot(spots[i].x - spots[j].x, spots[i].y - spots[j].y));
      }
    }
    const dMin = allDists.length ? Math.min(...allDists) : 0;
    const dMax = allDists.length ? Math.max(...allDists) : 0;
    const dAvg = allDists.length ? allDists.reduce((s, v) => s + v, 0) / allDists.length : 0;
    Highcharts.chart("o_carteAllianceChart", {
      chart: {
        type: "scatter",
        zoomType: "xy",
        panKey: "shift",
        backgroundColor: "#fff",
        spacingTop: 25,
      },
      title: {
        text: `${total > members.length ? `${members.length} membres affichés sur ${total}` : `${members.length} membres`} • ${spots.length} cases • ${edges.length} liens (${K_NEIGHBORS} plus proches voisins)`,
        style: { fontSize: "14px", fontWeight: "600" },
      },
      subtitle: {
        text: allDists.length
          ? `Distance min ${dMin.toFixed(0)} • max ${dMax.toFixed(0)} • moyenne ${dAvg.toFixed(0)}`
          : "",
        style: { fontSize: "11px", color: "#888" },
      },
      xAxis: {
        title: { text: "X (coord monde)" },
        gridLineWidth: 1,
        gridLineColor: "#f0f0f0",
      },
      yAxis: { title: { text: "Y (coord monde)" }, gridLineColor: "#f0f0f0" },
      credits: { enabled: false },
      legend: { enabled: false },
      tooltip: {
        // Semi-transparent so the drag-zoom rectangle behind stays visible
        backgroundColor: "rgba(255,255,255,0.7)",
        borderColor: "#888",
        useHTML: true,
        formatter: function () {
          const spot = this.point.spot;
          const pos = `(${spot.x.toFixed(0)}, ${spot.y.toFixed(0)})`;
          let html = "";
          if (spot.members.length === 1) {
            const m = spot.members[0];
            html += `<b>${m.pseudo}</b><br/>`;
            html += `Terrain : ${numeral(m.terrain).format()} cm²<br/>`;
            html += `Position : ${pos}`;
            if (m.isMe) {
              html += `<br/><em style="color:#27ae60">C'est toi</em>`;
            } else {
              const tSans = timeTravel(m, 0);
              const tWith = timeTravel(m, levelSpeedAttack);
              html += `<br/><br/><b>Temps de trajet</b><br/>`;
              html += `&nbsp;&nbsp;Sans amélioration : ${Utils.intToTime(tSans)}<br/>`;
              html += `&nbsp;&nbsp;Avec ton bonus (Vit. att. ${levelSpeedAttack}) : ${Utils.intToTime(tWith)}`;
            }
          } else {
            html += `<b>${spot.members.length} membres sur cette case</b><br/>`;
            html += `Position : ${pos}`;
            if (spot.isMyGroup) {
              html += `<br/><em style="color:#27ae60">Tu es ici, avec :</em>`;
              spot.members
                .filter((m) => !m.isMe)
                .forEach((m) => {
                  html += `<br/>&nbsp;&nbsp;• ${m.pseudo} (${numeral(m.terrain).format()} cm²)`;
                });
            } else {
              html += `<br/><br/>`;
              spot.members.forEach((m) => {
                html += `&nbsp;&nbsp;• <b>${m.pseudo}</b> (${numeral(m.terrain).format()} cm²)<br/>`;
              });
              const tSans = timeTravel(spot, 0);
              const tWith = timeTravel(spot, levelSpeedAttack);
              html += `<br/><b>Temps de trajet</b> (commun, même case)<br/>`;
              html += `&nbsp;&nbsp;Sans amélioration : ${Utils.intToTime(tSans)}<br/>`;
              html += `&nbsp;&nbsp;Avec ton bonus (Vit. att. ${levelSpeedAttack}) : ${Utils.intToTime(tWith)}`;
            }
          }
          return html;
        },
      },
      plotOptions: {
        scatter: {
          marker: {
            symbol: "circle",
            states: { hover: { lineColor: "#000", lineWidth: 2 } },
          },
          point: {
            events: {
              click: function () {
                // Clicking a point zooms 4× around it (handy in dense clusters).
                // Capped: stop once the viewport would drop below 1 game unit,
                // otherwise clicking never ends.
                const chart = this.series.chart;
                const xExt = chart.xAxis[0].getExtremes();
                const yExt = chart.yAxis[0].getExtremes();
                const xR = (xExt.max - xExt.min) / 4;
                const yR = (yExt.max - yExt.min) / 4;
                if (xR < 1 || yR < 1) return;
                chart.xAxis[0].setExtremes(this.x - xR / 2, this.x + xR / 2);
                chart.yAxis[0].setExtremes(this.y - yR / 2, this.y + yR / 2);
                // Forces Highcharts' own "Reset zoom" button to appear (it only
                // shows up for drag-select zooms, not for setExtremes).
                chart.showResetZoom();
              },
            },
          },
        },
      },
      series: [
        // Links between other members (discreet grey, in the background)
        {
          type: "line",
          name: "Liens",
          data: otherLineData,
          color: "rgba(120, 140, 160, 0.35)",
          lineWidth: 1,
          marker: { enabled: false },
          enableMouseTracking: false,
          states: { hover: { enabled: false } },
          showInLegend: false,
          animation: false,
        },
        // Links to me (stronger green, drawn on top)
        {
          type: "line",
          name: "Liens vers toi",
          data: myLineData,
          color: "rgba(39, 174, 96, 0.7)",
          lineWidth: 1.5,
          marker: { enabled: false },
          enableMouseTracking: false,
          states: { hover: { enabled: false } },
          showInLegend: false,
          animation: false,
        },
        {
          type: "scatter",
          name: "Membres",
          data: spots.map((s) => {
            const n = s.members.length;
            const terrainMax = Math.max(...s.members.map((m) => m.terrain || 0));
            let fill, line;
            if (s.isMyGroup) {
              fill = "#27ae60";
              line = "#196f3d";
            } else if (n > 1) {
              fill = "#f39c12";
              line = "#b9770e";
            } else {
              fill = "#c0392b";
              line = "#fff";
            }
            let label;
            if (n === 1) label = s.members[0].pseudo;
            else if (s.isMyGroup) label = `Toi +${n - 1}`;
            else label = `${[...s.members].map((m) => m.pseudo).sort()[0]} +${n - 1}`;
            // Modest radius: log(terrain), compressed to limit visual stacking in
            // dense clusters (alliances of 30+ members are often grouped).
            const radiusBase = terrainMax > 0 ? 2 + Math.log10(terrainMax) / 2 : 4;
            return {
              x: s.x,
              y: s.y,
              spot: s,
              name: label,
              marker: {
                radius: n > 1 ? 5 + Math.min(n - 1, 3) : Math.max(3, Math.min(radiusBase, 6)),
                fillColor: fill,
                lineColor: line,
                lineWidth: n > 1 ? 2 : 1.5,
              },
            };
          }),
          dataLabels: {
            enabled: true,
            format: "{point.name}",
            allowOverlap: false,
            style: {
              fontSize: "10px",
              fontWeight: "normal",
              color: "#222",
              textOutline: "2px contrast",
            },
            y: -14,
          },
        },
      ],
    });
  }
}
