/*
 * Alliance.ts
 * Hraesvelg
 **********************************************************************/

import { $, numeral } from "~/vendor";
import { IMG_REFRESH } from "~/constants";
import { Utils } from "~/lib/Utils";
// Cycle d'import volontaire (usage dans les méthodes uniquement, jamais au niveau module) : Alliance ↔ BoiteRadar.
import { RadarBox } from "~/boxes/Radar";
import { Player } from "~/models/Player";

/**
 * Classe pour creer et gérer une alliance
 *
 * @class Alliance
 */
export class Alliance {
  // Champs déclarés pour TypeScript (Phase 2 : conversion telle quelle, le
  // typage fin est reporté — cf. .claude/plans/wxt-migration-followups.md).
  _tag: any;
  _name: any;
  _terrain: any;
  _colony: any;
  _technology: any;
  _players: any;
  _radarOrder: any;
  _forumTopic: any;
  constructor(settings) {
    /**
     * tag de l'alliance
     */
    this._tag = settings["tag"];
    /**
     * nom de l'alliance
     */
    this._name = settings["nom"] || "";
    /**
     * terrain globale de l'alliance
     */
    this._terrain = settings["terrain"] || -1;
    /**
     *
     */
    this._colony = settings["fourmiliere"] || -1;
    /**
     *
     */
    this._technology = settings["technologie"] || -1;
    /**
     * liste des joueurs
     */
    this._players = {};
    if (settings.hasOwnProperty("joueurs"))
      for (let pseudo in settings["joueurs"])
        this._players[pseudo] = new Player(settings["joueurs"][pseudo]);
    /**
     *
     */
    this._radarOrder = settings["ordreRadar"] || 0;
    /**
     *
     */
    this._forumTopic = settings["sujetForum"] || -1;
  }
  /**
   *
   */
  get tag() {
    return this._tag;
  }
  /**
   *
   */
  set tag(newTag) {
    this._tag = newTag;
  }
  /**
   *
   */
  get nom() {
    return this._name;
  }
  /**
   *
   */
  set nom(newName) {
    this._name = newName;
  }
  /**
   *
   */
  get terrain() {
    return this._terrain;
  }
  /**
   *
   */
  set terrain(newTerrain) {
    this._terrain = newTerrain;
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
  get ordreRadar() {
    return this._radarOrder;
  }
  /**
   *
   */
  set ordreRadar(newOrder) {
    this._radarOrder = newOrder;
  }
  /**
   *
   */
  get sujetForum() {
    return this._forumTopic;
  }
  /**
   *
   */
  set sujetForum(newTopic) {
    this._forumTopic = newTopic;
  }
  /**
   *
   */
  computeTerrain() {
    this._terrain = Object.keys(this._players).reduce((acc, key) => {
      return acc + this._players[key].terrain;
    }, 0);
    return this._terrain;
  }
  /**
   *
   */
  computeTechnology() {
    this._technology = Object.keys(this._players).reduce((acc, key) => {
      return acc + this._players[key].technologie;
    }, 0);
    return this._technology;
  }
  /**
   *
   */
  computeColony() {
    this._colony = Object.keys(this._players).reduce((acc, key) => {
      return acc + this._players[key].fourmiliere;
    }, 0);
    return this._colony;
  }
  /**
   *
   */
  toJSON() {
    return {
      tag: this._tag,
      joueurs: this._players,
      terrain: this._terrain,
      technologie: this._technology,
      fourmiliere: this._colony,
      ordreRadar: this._radarOrder,
      sujetForum: this._forumTopic,
    };
  }
  /**
   * Récupére la description d'une alliance.
   *
   * @private
   * @method getDescription
   */
  getDescription() {
    return $.ajax({
      url: "http://" + Utils.serveur + ".fourmizzz.fr/classementAlliance.php?alliance=" + this._tag,
    });
  }
  /**
   *
   */
  getRadarRow(radar, id, index) {
    $(id).append(
      `<tr id="o_item_${index}" class="lien"><td><a id="o_maj_${this._tag}" class='o_actualiser' href=""><img src="${IMG_REFRESH}" alt="rang" height="20"/></a></td><td class="left"><a class="gras" href="classementAlliance.php?alliance=${this._tag}">${this._tag}</a><sup style="font-size:0.65em;margin-left:3px;opacity:0.7;">ALI</sup></td><td id="o_terrain_${this._tag}" class="right reduce" title="">${numeral(this._terrain).format()}</td></tr>`,
    );
    // event
    $("#o_maj_" + this._tag).click((e) => {
      this.refreshInRadar(radar).then((res) => {
        if (res.changed) radar.save();
      });
      return false;
    });
    return this;
  }
  /**
   * Rafraîchit l'alliance dans le contexte de la boite radar : spin de l'icône,
   * fetch de la description, somme du terrain des membres, highlight du diff.
   * Ne sauvegarde pas — c'est au caller (click single, ou batch "Tout actualiser")
   * de décider quoi faire selon le résultat ({ removed, changed }).
   *
   * @method refreshDansRadar
   * @param {BoiteRadar} radar
   * @return {Promise<{ removed: boolean, changed: boolean }>}
   */
  refreshInRadar(radar) {
    let oldTerrain = numeral($("#o_terrain_" + this._tag).text()).value(),
      $icon = $("#o_maj_" + this._tag);
    $({ deg: 0 }).animate(
      { deg: 360 },
      {
        duration: 600,
        step: (now) => $icon.find("img").css({ transform: "rotate(" + now + "deg)" }),
      },
    );
    return this.getDescription().then((data) => {
      this._terrain = 0;
      $(data)
        .find("#tabMembresAlliance tr:gt(0)")
        .each((i, elt) => {
          this._terrain += numeral($(elt).find("td:eq(4)").text()).value();
        });
      let diff = this._terrain - oldTerrain;
      if (!diff) return { removed: false, changed: false };
      $("#o_terrain_" + this._tag)
        .text(numeral(this._terrain).format())
        .effect("highlight", { color: diff > 0 ? "#458D58" : "#8D4545" }, 1000)
        .attr("title", numeral(diff).format())
        .tooltip({
          position: { my: "left+10 center", at: "right center" },
          content: `<span class='${diff > 0 ? "green_light" : "red_xlight"}'>${diff > 0 ? "+ " + $("#o_terrain_" + this._tag).attr("title") : $("#o_terrain_" + this._tag).attr("title")} cm²</span>`,
          hide: { effect: "fade", duration: 10 },
          tooltipClass: "warning-tooltip ui-tooltip-right",
        })
        .tooltip("open");
      return { removed: false, changed: true };
    });
  }
  /**
   *
   */
  static search(elt) {
    return $.ajax({
      type: "post",
      url: "http://" + Utils.serveur + ".fourmizzz.fr/classementAlliance.php",
      data: {
        requete: elt,
        recherche: 1,
        prioriteRecherche: "alliance",
      },
    });
  }
}
