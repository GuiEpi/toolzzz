/*
 * Alliance.ts
 * Hraesvelg
 **********************************************************************/

import { $, Highcharts, numeral } from "~/vendor";
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
import * as storage from "~/storage";

/**
 * Classe de fonction pour la page /alliance.php.
 *
 * @class PageAlliance
 * @constructor
 */
export class AllianceMembersPage {
  // Champs déclarés pour TypeScript (Phase 2 : conversion telle quelle, le
  // typage fin est reporté — cf. .claude/plans/wxt-migration-followups.md).
  _alliance: any;
  _tools: any;
  _nativeGrades: any;
  _memberMap: any;
  _filters: any;
  _filterValues: any;
  constructor() {
    /**
     * Creation du modele Alliance
     */
    this._alliance = new Alliance({ tag: Utils.alliance });
    /**
     * Connexion à l'utilitaire.
     */
    this._tools = new ForumPage();
    /**
     * Grade natif du jeu par pseudo, relevé avant tout écrasement par un rang
     * SDC : la carte propose les deux comme filtres distincts.
     */
    this._nativeGrades = {};
    /**
     * Dernière liste complète de membres passée à la carte (avant filtrage).
     */
    this._memberMap = null;
  }
  /**
   *
   */
  run() {
    // Si le tableau des membres est déjà rendu, on enrichit directement.
    // Sinon, on observe `#alliance` pour réagir dès que le tableau apparaît
    // (rendu async sur certaines variantes de la page). Si aucun des deux
    // n'existe — page sans UI alliance, mobile, ou DOM atypique —, on skip
    // proprement plutôt que de crasher sur `observe(undefined)`.
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
   * Affiche les modifications du tableau des membres.
   *
   * @private
   * @method traitementMembre
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
    // ajout des totaux de l'alliance
    let tmpPlayers = {};
    $("#tabMembresAlliance tr:gt(0)").each((i, elt) => {
      let pseudo = $(elt).find("td:eq(3)").text(),
        terrain = numeral($(elt).find("td:eq(5)").text()).value();
      tmpPlayers[pseudo] = new Player({
        pseudo: pseudo,
        terrain: terrain,
        fourmiliere: ~~$(elt).find("td:eq(8)").text(),
        technologie: ~~$(elt).find("td:eq(7)").text(),
        // grade natif du jeu — fallback affiché tant qu'aucun rang SDC n'est saisi,
        // et backfillé dans les sujets créés par « Actualiser l'alliance ».
        // Les "/" sont remplacés : le titre du sujet forum est parsé avec " / ".
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
    // Recupération des données de l'utilitaire sinon on met en forme le tableau directement
    $("#tabMembresAlliance tr:first").remove();
    $("#tabMembresAlliance").prepend(
      `<thead><tr class='alt'><th></th><th></th><th>Rang</th><th>Pseudo</th><th></th><th>Terrain</th><th></th><th><span style='padding-right:10px'>Technologie</span></th><th><span style='padding-right:10px'>Fourmiliere</span></th><th colspan='2'>Etat</th><th></th></tr></thead>`,
    );

    // Si on dispose d'un utilitaire pour la gestion des membres
    if (getProfile().parametre["forumMembre"].valeur) {
      // recuperation des commandes sur l'utilitaire
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
   * Variante de tableau() qui utilise le cache local de la Carte de l'alliance
   * (rempli via le bouton "Charger / Actualiser") pour ajouter les colonnes
   * Tdt + Retour aux alliances qui n'ont pas le SDC chef-bootstrappé.
   * Si pas de cache → fallback sur tableau() basique.
   *
   * @method tableauAvecCarteCache
   */
  tableWithCachedMap() {
    const cacheKey = `outiiil_carteAlliance_${Utils.serveur}_${Utils.alliance}`;
    let cached = null;
    try {
      cached = storage.getJSON(cacheKey);
    } catch (e) {
      cached = null;
    }
    const hasCache = cached && cached.members && cached.members.length;
    if (hasCache) {
      // Hydrate les coords depuis le cache
      const coordsByPseudo = new Map();
      cached.members.forEach((m) => coordsByPseudo.set(m.pseudo, { x: m.x, y: m.y }));
      for (const pseudo in this._alliance.joueurs) {
        if (coordsByPseudo.has(pseudo)) {
          Object.assign(this._alliance.joueurs[pseudo], coordsByPseudo.get(pseudo));
        }
      }
      // Ajoute les colonnes Tdt + Retour entre Fourmilière et Etat
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
          // data-order : DataTable trie sur l'attribut (entier brut) plutôt que sur
          // le texte affiché ("22h 31m" sinon trié en alphabétique).
          tdHtml = `<td data-order='${tdt}'>${Utils.intToTime(tdt)}</td><td data-order='${retour.unix()}'>${retour.format("D MMM à HH[h]mm")}</td>`;
        } else {
          tdHtml = `<td data-order='-1'>N/C</td><td data-order='-1'>N/C</td>`;
        }
        $(elt).find("td:eq(8)").after(tdHtml);
      });
      // DataTable — targets ajustés vs tableau() : Etat-2 et last passent de 10/11 à 12/13
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
        buttons: ["colvis", "copyHtml5", "csvHtml5", "excelHtml5"],
        order: [],
        stripeClasses: ["", "alt"],
        responsive: true,
        language: {
          zeroRecords: "Aucun joueur trouvé",
          infoEmpty: "Aucun enregistrement",
          infoFiltered: "(Filtré par _MAX_ enregistrements)",
          search: "Rechercher : ",
          buttons: { colvis: "Colonne" },
        },
        columnDefs: [
          { type: "quantite-grade", targets: 5 },
          { sortable: false, targets: [0, 1, 4, 6, 12, 13] },
        ],
      });
    } else {
      this.table();
    }
    // Bouton Synchroniser — disponible dans tous les cas (bootstrap si pas de cache,
    // refresh sinon). Recharge la page après sync pour que le tableau pick up les coords.
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
   * Ajoute le tri.
   *
   * @private
   * @method tableau
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
      buttons: ["colvis", "copyHtml5", "csvHtml5", "excelHtml5"],
      order: [],
      stripeClasses: ["", "alt"],
      responsive: true,
      language: {
        zeroRecords: "Aucun joueur trouvé",
        infoEmpty: "Aucun enregistrement",
        infoFiltered: "(Filtré par _MAX_ enregistrements)",
        search: "Rechercher : ",
        buttons: { colvis: "Colonne" },
      },
      columnDefs: [
        { type: "quantite-grade", targets: 5 },
        { sortable: false, targets: [0, 1, 4, 6, 10, 11] },
      ],
    });
    return this;
  }
  /**
   * Ajout des infos du SDC.
   *
   * @private
   * @method traitementUtilitaire
   */
  processTools() {
    for (let pseudo in this._tools.alliance.joueurs) {
      // si la clé est une clé du tableau des memres
      if (this._alliance.joueurs.hasOwnProperty(pseudo)) {
        this._alliance.joueurs[pseudo].x = this._tools.alliance.joueurs[pseudo].x;
        this._alliance.joueurs[pseudo].y = this._tools.alliance.joueurs[pseudo].y;
        this._alliance.joueurs[pseudo].id = this._tools.alliance.joueurs[pseudo].id;
        this._alliance.joueurs[pseudo].sujetForum = this._tools.alliance.joueurs[pseudo].sujetForum;
        // on ne remplace le grade natif que si un rang SDC a réellement été saisi
        if (this._tools.alliance.joueurs[pseudo].rang) {
          this._alliance.joueurs[pseudo].rang = this._tools.alliance.joueurs[pseudo].rang;
          this._alliance.joueurs[pseudo].ordreRang = this._tools.alliance.joueurs[pseudo].ordreRang;
        }
      }
    }
    // On retraicie les colonnes des niveaux
    $("#tabMembresAlliance th:eq(1)").after(`<th>Grade</th>`);
    $("#tabMembresAlliance th:eq(9)").after(`<th>Tdt</th><th>Retour</th>`);
    $("#tabMembresAlliance tfoot td:eq(0)").attr("colspan", 15);
    // On compléte les données
    $("#tabMembresAlliance tr:gt(0):lt(-1)").each((i, elt) => {
      let pseudo = $(elt).find("td:eq(3)").text();
      // si nous avons les coordonnées on affiche les tempts de trajet
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
      // si on est chef de l'alliance on peut modifier les rangs et que le joueur est dans l'utilitaire
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
    // si on est chef de l'alliance on peut mettre à jour les membres
    if ($("img[src='images/crayon.gif']").length) {
      $("#tabMembresAlliance_wrapper .dt-buttons").prepend(
        `<a id="o_actualiserAlliance" class="dt-button" href="#"><span>Actualiser l'alliance</span></a>`,
      );
      $("#o_actualiserAlliance").click((e) => {
        let promisePlayer = new Array(),
          pseudoPlayer = new Array();
        // si coordonnée inconnu on va les chercher
        for (let player in this._alliance.joueurs) {
          // si le joueur n'est pas connu dans l'utilitaire
          if (!this._tools.alliance.joueurs.hasOwnProperty(player))
            this._tools.alliance.joueurs[player] = this._alliance.joueurs[player];
          // si ses coordonnées ne sont pas connu
          if (
            this._tools.alliance.joueurs[player].x == -1 &&
            this._tools.alliance.joueurs[player].y == -1
          ) {
            promisePlayer.push(this._tools.alliance.joueurs[player].getProfile());
            pseudoPlayer.push(player);
          }
        }
        // on recup les profils de tout les joueurs
        Promise.all(promisePlayer).then((values) => {
          let promiseForum = new Array(),
            player = null;
          for (let i = 0; i < values.length; i++) {
            player = this._tools.alliance.joueurs[pseudoPlayer[i]];
            player.loadProfile(values[i]);
            // on enregistre
            if (!player.sujetForum)
              promiseForum.push(
                this._tools.createTopic(
                  player.toToolsFormat(),
                  " ",
                  getProfile().parametre["forumMembre"].valeur,
                ),
              );
          }
          // on creer les sujets pour les membres qui n'en disposent pas
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
    // mise à jour de l'alliance
    for (let pseudo in this._tools.alliance.joueurs) {
      // si la clé est une clé du tableau des membres
      if (this._alliance.joueurs.hasOwnProperty(pseudo)) {
        this._alliance.joueurs[pseudo].x = this._tools.alliance.joueurs[pseudo].x;
        this._alliance.joueurs[pseudo].y = this._tools.alliance.joueurs[pseudo].y;
        this._alliance.joueurs[pseudo].id = this._tools.alliance.joueurs[pseudo].id;
        // on ne remplace le grade natif que si un rang SDC a réellement été saisi
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
   * Ajoute le tri.
   *
   * @private
   * @method tableauUtilitaire
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
      buttons: ["colvis", "copyHtml5", "csvHtml5", "excelHtml5"],
      responsive: true,
      language: {
        zeroRecords: "Aucun joueur trouvé",
        info: "Page _PAGE_ de _PAGES_",
        infoEmpty: "Aucun enregistrement",
        infoFiltered: "(Filtré par _MAX_ enregistrements)",
        search: "Rechercher : ",
        buttons: { colvis: "Colonne" },
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
   * Injecte la section "Carte de l'alliance" en bas de la page.
   * Charge depuis localStorage si dispo ; refresh manuel via bouton.
   *
   * @method carte
   */
  map() {
    if ($("#o_carteAlliance").length) return this; // déjà rendue
    const cacheKey = `outiiil_carteAlliance_${Utils.serveur}_${Utils.alliance}`;
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
      cached = storage.getJSON(cacheKey);
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
   * Active l'onglet "Carte" du menu Alliance (injecté par content.js sur toutes
   * les pages) : intercepte le clic pour un toggle client-side, et bascule
   * automatiquement si la page est chargée avec le hash #carte (cas où on
   * arrive depuis une autre page d'alliance).
   *
   * @method ongletCarte
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
   * Fetch des coords pour tous les membres + persistance localStorage.
   * Ne touche pas à l'UI — résolveurs (Carte / tableau Membres) gèrent leur propre feedback.
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
    const cacheKey = `outiiil_carteAlliance_${Utils.serveur}_${Utils.alliance}`;
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
        storage.setJSON(cacheKey, { timestamp, members });
      } catch (e) {
        console.warn("outiiil: localStorage write failed", e);
      }
      return { members, timestamp };
    });
  }
  /**
   * Refresh de la Carte (UI Carte + render Highcharts).
   *
   * @private
   * @method _actualiserCarte
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
   * Génère un PNG simple dessiné sur canvas, avec les vraies proportions du jeu
   * (1 case = 5 unités X × 50 unités Y, donc pxPerY = pxPerX / 10). Image étroite
   * et haute, sans grille ni axes — pensée pour partager dans le forum d'alliance.
   * Utilise directement le cache des coords (pas besoin que le chart Highcharts
   * soit rendu).
   *
   * @private
   * @method _exporterCarteForumPng
   */
  _exportMapForumPng() {
    const cacheKey = `outiiil_carteAlliance_${Utils.serveur}_${Utils.alliance}`;
    let cached = null;
    try {
      cached = storage.getJSON(cacheKey);
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
    // même sélection que la carte à l'écran
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
    // Échelle : 1 case du jeu = 5 X × 50 Y → pxPerY = pxPerX / 10 pour rendre les
    // cellules visuellement carrées (proportions réelles).
    const PX_PER_X = 14;
    const PX_PER_Y = PX_PER_X / 10;
    // Padding suffisant pour les graduations d'axes (X en haut, Y à gauche)
    const PAD_LEFT = 38;
    const PAD_TOP = 26;
    const PAD_BOTTOM = 16;
    const PAD_RIGHT_MIN = 16;
    const LABEL_LINE_H = 13;
    const LABEL_GAP = 8;
    // Pré-mesure des largeurs de label sur un canvas temporaire pour calculer les
    // collisions avant de dimensionner le vrai canvas.
    const tmp = document.createElement("canvas").getContext("2d");
    tmp.font = "bold 11px sans-serif";
    // Tri haut→bas, gauche→droite : algo glouton qui décale les labels vers le bas
    // dès qu'ils chevaucheraient un label déjà placé.
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
    // Dimensions du canvas en fonction des positions finales (labels potentiellement
    // décalés vers le bas en cas de cluster dense). On étend aussi pour couvrir le
    // tick supérieur arrondi (ceil) afin que le 50 / 1900 / etc. soit toujours visible.
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
    // Graduations d'axes — yStep et xStep déjà calculés plus haut.
    ctx.strokeStyle = "#eee";
    ctx.lineWidth = 0.5;
    ctx.fillStyle = "#888";
    ctx.font = "10px sans-serif";
    // Grille verticale (X) + labels en haut. Ceil sur la borne sup pour inclure 50, etc.
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
    // Grille horizontale (Y) + labels à gauche. Ceil sur la borne sup pour inclure 1900, etc.
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
      // Connecteur fin gris si le label a été décalé pour éviter une collision —
      // sinon on ne sait plus quel label appartient à quel dot.
      if (Math.abs(labelY - dotY) > 1) {
        ctx.strokeStyle = "#bbb";
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(dotX + 4, dotY);
        ctx.lineTo(labelX - 1, labelY);
        ctx.stroke();
      }
      // Toutes les fourmilières en rouge — l'image est destinée au forum (partage),
      // pas de raison de mettre en évidence l'auteur.
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
   * Affiche le timestamp en texte humain à côté du bouton.
   *
   * @private
   * @method _afficherAge
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
   * Clé de persistance de la sélection des filtres (par serveur et alliance).
   *
   * @private
   * @method _cleFiltres
   */
  _filtersKey() {
    return `outiiil_carteFiltres_${Utils.serveur}_${Utils.alliance}`;
  }
  /**
   * Sélection courante. On mémorise ce qui est *masqué* et non ce qui est
   * affiché : un membre ou un grade apparu depuis la dernière visite est
   * visible par défaut, au lieu d'être silencieusement absent de la carte.
   *
   * @private
   * @method _chargerFiltres
   */
  _loadFilters() {
    let f: any = {};
    try {
      f = storage.getJSON(this._filtersKey()) || {};
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
   * @method _sauverFiltres
   */
  _saveFilters() {
    try {
      storage.setJSON(this._filtersKey(), this._filters);
    } catch (e) {
      console.warn("outiiil: localStorage write failed", e);
    }
    return this;
  }
  /**
   * Grade natif du jeu d'un membre.
   *
   * @private
   * @method _gradeDe
   */
  _gradeOf(pseudo) {
    return this._nativeGrades[pseudo] || "Sans grade";
  }
  /**
   * Rang SDC d'un membre, ou une chaîne vide si l'alliance n'utilise pas le
   * SDC ou si rien n'a été saisi pour lui.
   *
   * @private
   * @method _rangSdcDe
   */
  _sdcRankOf(pseudo) {
    // `alliance` vaut null tant que la section SDC n'a pas été chargée, et le
    // reste si l'alliance n'utilise pas l'utilitaire
    let alliance = this._tools.alliance,
      player = alliance && alliance.joueurs ? alliance.joueurs[pseudo] : null;
    return (player && player.rang) || "";
  }
  /**
   * Applique la sélection à une liste de membres. Un membre sans rang SDC
   * n'est jamais masqué par le filtre des rangs — sinon toute alliance
   * n'utilisant pas le SDC verrait sa carte se vider.
   *
   * @private
   * @method _filtrerMembres
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
   * Construit le bloc de filtres : une case par grade, une par rang SDC quand
   * l'alliance en a, et la liste dépliable des joueurs.
   *
   * @private
   * @method _construireFiltres
   */
  _buildFilters(membres) {
    const esc = (t) => $("<div>").text(t).html();
    // Un grade d'alliance est du texte libre : chaque chef y met ce qu'il veut,
    // souvent long et décoré. On n'essaie pas de deviner sa mise en forme, on
    // se contente de retirer les remplisseurs invisibles (U+3164, espaces
    // insécables…) qui creusent des trous dans la liste, et de tronquer pour
    // que les cases restent alignées. Le libellé complet est en infobulle et
    // la valeur filtrée reste le grade brut.
    const lisible = (t) => {
      let net = t
        .replace(/[\u3164\u00a0\u200b\u2800]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      return esc(net.length > 34 ? net.slice(0, 34) + "…" : net || t);
    };
    // valeurs passées par index : un grade peut contenir n'importe quel caractère
    let account = (valeur, accesseur) =>
        membres.filter((m) => accesseur.call(this, m.pseudo) == valeur).length,
      // grades les plus portés en tête : dans beaucoup d'alliances chaque
      // membre a son grade décoratif à lui, et les rares grades partagés
      // (VIP, passeurs…) sont justement ceux sur lesquels on veut filtrer
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
    // un grade unique par membre ne regroupe rien : on le signale plutôt que
    // d'afficher une liste de grades qui double celle des joueurs
    let partages = grades.filter((g) => account(g, this._gradeOf) > 1).length;
    // Chaque section est repliée par défaut pour ne pas alourdir la page. Le
    // titre indique combien d'entrées sont masquées, pour qu'un filtre actif
    // reste visible même section fermée.
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
    // état initial des cases depuis la sélection mémorisée
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
   * Point d'entrée de la carte : mémorise la liste complète, (re)construit les
   * filtres, puis dessine la carte filtrée.
   *
   * @private
   * @method _renderCarte
   */
  _renderMap(membres) {
    this._memberMap = membres;
    this._filters = this._loadFilters();
    this._buildFilters(membres);
    return this._drawMap(this._filterMembers(membres), membres.length);
  }
  /**
   * Render Highcharts dans #o_carteAllianceChart.
   * Regroupe les membres par case (x,y), trace les liens en-dessous d'un seuil,
   * affiche le tooltip avec temps de trajet (sans / avec bonus Vitesse d'attaque).
   *
   * @private
   * @method _dessinerCarte
   * @param {Array} members membres à tracer (déjà filtrés)
   * @param {Integer} total effectif avant filtrage, pour le titre
   */
  _drawMap(members, total) {
    $("#o_carteAllianceChart").show();
    // Désactive le warning Highcharts #15 : nos séries `line` représentent des arêtes
    // arbitraires entre cases (a→b dans n'importe quelle direction), donc les x ne
    // sont pas monotonement croissants. Le rendu marche, c'est juste un warning console.
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
    // Liens : K plus proches voisins (s'adapte à l'étalement de l'alliance)
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
    // Split en deux séries : liens vers moi (vert) vs entre autres membres (gris)
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
        // Semi-transparent pour ne pas masquer le rectangle de drag-zoom derrière
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
                // Clic sur un point → zoom 4× autour (utile pour explorer les clusters denses).
                // Cap : on stop si le viewport descendrait sous 1 unité de jeu (sinon clic infini).
                const chart = this.series.chart;
                const xExt = chart.xAxis[0].getExtremes();
                const yExt = chart.yAxis[0].getExtremes();
                const xR = (xExt.max - xExt.min) / 4;
                const yR = (yExt.max - yExt.min) / 4;
                if (xR < 1 || yR < 1) return;
                chart.xAxis[0].setExtremes(this.x - xR / 2, this.x + xR / 2);
                chart.yAxis[0].setExtremes(this.y - yR / 2, this.y + yR / 2);
                // Force l'apparition du bouton natif "Reset zoom" (sinon il n'apparaît
                // que quand le zoom est déclenché par drag-select, pas via setExtremes).
                chart.showResetZoom();
              },
            },
          },
        },
      },
      series: [
        // Liens entre autres membres (gris discret, en arrière-plan)
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
        // Liens vers moi (vert plus marqué, par-dessus les autres)
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
            // Radius modeste : log(terrain) compressé pour limiter le stack visuel dans
            // les clusters denses (alliances de 30+ membres souvent groupés).
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
