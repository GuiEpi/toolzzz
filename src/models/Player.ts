/*
 * Joueur.ts
 * Hraesvelg
 **********************************************************************/

import { $, moment, numeral } from "~/vendor";
import { EFFECTS, IMG_REFRESH, FLOOD_METHODS, TOAST_WARNING } from "~/constants";
import { Utils } from "~/lib/Utils";
import { getProfile } from "~/models/currentPlayer";
// Cycle d'import volontaire (usage dans les méthodes uniquement, jamais au niveau module) : Joueur ↔ BoiteRadar.
import { RadarBox } from "~/boxes/Radar";
import { Setting } from "~/models/Setting";
import * as storage from "~/storage";

/**
 * Classe pour creer et gérer un joueur
 *
 * @class Joueur
 */
export class Player {
  // Champs déclarés pour TypeScript (Phase 2 : conversion telle quelle, le
  // typage fin est reporté — cf. .claude/plans/wxt-migration-followups.md).
  _id: any;
  _pseudo: any;
  _x: any;
  _y: any;
  _terrain: any;
  _researchLevels: any;
  _technology: any;
  _buildingLevels: any;
  _colony: any;
  _mv: any;
  _radarOrder: any;
  _forumTopic: any;
  _rank: any;
  _rankOrder: any;
  _setting: any;
  constructor(settings) {
    /**
     * id du joueur
     */
    this._id = settings["id"] || -1;
    /**
     * pseudo du joueur
     */
    this._pseudo = settings["pseudo"];
    /**
     * abscisse du joueur
     */
    this._x = settings["x"] || -1;
    /**
     * ordonnée du joueur
     */
    this._y = settings["y"] || -1;
    /**
     *
     */
    this._terrain = settings["terrain"] || -1;
    /**
     *
     */
    this._researchLevels = settings["niveauRecherche"] || new Array(10).fill(-1);
    /**
     *
     */
    this._technology = settings["technologie"] || -1;
    /**
     *
     */
    this._buildingLevels = settings["niveauConstruction"] || new Array(13).fill(-1);
    /**
     *
     */
    this._colony = settings["fourmiliere"] || -1;
    /**
     *
     */
    this._mv = settings["mv"] || false;
    /**
     *
     */
    this._radarOrder = settings["ordreRadar"] || 0;
    /**
     *
     */
    this._forumTopic = settings["sujetForum"] || 0;
    /**
     *
     */
    this._rank = settings["rang"] || "";
    /**
     *
     */
    this._rankOrder = settings["ordreRang"] || 0;
    /**
     * Préférence du joueur.
     *
     * @private
     * @property _parametre
     * @type Object
     */
    this._setting = {};
    // parametres style des boites
    this._setting["couleur1"] = new Setting("couleur1", "Couleur de fond", "color", "#d7c384");
    this._setting["couleur2"] = new Setting("couleur2", "Couleur secondaire", "color", "#c9ad63");
    this._setting["couleur3"] = new Setting("couleur3", "Couleur bordure", "color", "#bd8d46");
    this._setting["couleurTexte"] = new Setting(
      "couleurTexte",
      "Couleur du texte",
      "color",
      "#000000",
    );
    this._setting["couleurTitre"] = new Setting(
      "couleurTitre",
      "Couleur des titres",
      "color",
      "#787423",
    );
    this._setting["dockPosition"] = new Setting(
      "dockPosition",
      "Position des outils",
      "select",
      0,
      ["Droite", "Bas"],
    );
    this._setting["dockVisible"] = new Setting(
      "dockVisible",
      "Outils toujours visible ?",
      "checkbox",
      true,
    );
    this._setting["boiteShow"] = new Setting(
      "boiteShow",
      "Effet appariation des boites",
      "select",
      0,
      EFFECTS,
    );
    this._setting["boiteHide"] = new Setting(
      "boiteHide",
      "Effet disparition des boites",
      "select",
      0,
      EFFECTS,
    );
    // parametres utilitaires
    this._setting["forumCommande"] = new Setting("forumCommande", "Commande", "input");
    this._setting["forumMembre"] = new Setting("forumMembre", "Membre", "input");
    // parametres armée
    this._setting["methodeFlood"] = new Setting(
      "methodeFlood",
      "Méthode de flood",
      "select",
      1,
      FLOOD_METHODS,
    );
    this._setting["uniteAntisondeTerrain"] = new Setting(
      "uniteAntisondeTerrain",
      "Antisonde max en terrain",
      "number",
      1,
    );
    this._setting["uniteAntisondeDome"] = new Setting(
      "uniteAntisondeDome",
      "Antisonde max en dôme",
      "number",
      0,
    );
    this._setting["uniteSonde"] = new Setting("uniteSonde", "Sonde vers l'ennemi", "number", 0);
    this._setting["reserveFlood"] = new Setting(
      "reserveFlood",
      "Réserve d'unités au flood",
      "number",
      0,
    );
    this._setting["reserveFloodAuto"] = new Setting(
      "reserveFloodAuto",
      "Suivre antisondes",
      "checkbox",
      true,
    );
    this._setting["replacerArmeeAuto"] = new Setting(
      "replacerArmeeAuto",
      "Replacer l'armée automatiquement",
      "checkbox",
      false,
    );
    // parametre divers
    this._setting["couleurChat"] = new Setting("couleurChat", "Couleur chat", "color", "#000000");
    this._setting["couleurMessagerie"] = new Setting(
      "couleurMessagerie",
      "Couleur messagerie",
      "color",
      "#000000",
    );
    this._setting["affectationRessource"] = new Setting(
      "affectationRessource",
      "Affectation des ressources",
      "select",
      0,
      ["Non", "Materiaux", "Nourriture", "Ratio"],
    );
    // part des ouvrières affectée à la nourriture en mode Ratio (le reste va
    // aux matériaux) : curseur de 10 en 10, champ au pourcent près
    this._setting["ratioRecolte"] = new Setting(
      "ratioRecolte",
      "Part en nourriture",
      "slider",
      50,
      {
        min: 0,
        max: 100,
        step: 10,
        unite: " %",
      },
    );
    return this;
  }
  /**
   *
   */
  get id() {
    return this._id;
  }
  /**
   *
   */
  set id(newId) {
    this._id = newId;
  }
  /**
   *
   */
  get pseudo() {
    return this._pseudo;
  }
  /**
   *
   */
  set pseudo(newPseudo) {
    this._pseudo = newPseudo;
  }
  /**
   *
   */
  get x() {
    return this._x;
  }
  /**
   *
   */
  set x(newX) {
    this._x = newX;
  }
  /**
   *
   */
  get y() {
    return this._y;
  }
  /**
   *
   */
  set y(newY) {
    this._y = newY;
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
  get niveauRecherche() {
    return this._researchLevels;
  }
  /**
   *
   */
  set niveauRecherche(newLevel) {
    this._researchLevels = newLevel;
  }
  /**
   *
   */
  get technologie() {
    return this._technology;
  }
  /**
   *
   */
  set technologie(newTechnology) {
    this._technology = newTechnology;
  }
  /**
   *
   */
  get niveauConstruction() {
    return this._buildingLevels;
  }
  /**
   *
   */
  set niveauConstruction(newLevel) {
    this._buildingLevels = newLevel;
  }
  /**
   *
   */
  get fourmiliere() {
    return this._colony;
  }
  /**
   *
   */
  set fourmiliere(newColony) {
    this._colony = newColony;
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
  get mv() {
    return this._mv;
  }
  /**
   *
   */
  set mv(newMV) {
    this._mv = newMV;
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
  get rang() {
    return this._rank;
  }
  /**
   *
   */
  set rang(newRank) {
    this._rank = newRank;
  }
  /**
   *
   */
  get ordreRang() {
    return this._rankOrder;
  }
  /**
   *
   */
  set ordreRang(newOrder) {
    this._rankOrder = newOrder;
  }
  /**
   * Renvoie les joueurs et les alliances sous surveillance.
   *
   * @method Radar
   * @return {Object} les joueurs et alliances format JSON.
   */
  get parametre() {
    return this._setting;
  }
  /**
   *
   */
  toToolsFormat() {
    return (
      this._pseudo +
      " / " +
      this._id +
      " / " +
      this._x +
      " / " +
      this._y +
      (this._rank ? " / " + this._rank + " / " + this._rankOrder : "")
    );
  }
  /**
   *
   */
  toJSON() {
    return {
      id: this._id,
      pseudo: this._pseudo,
      x: this._x,
      y: this._y,
      terrain: this._terrain,
      mv: this._mv,
      ordreRadar: this._radarOrder,
      rang: this._rank,
      niveauConstruction: this._buildingLevels,
      niveauRecherche: this._researchLevels,
    };
  }
  /**
   *
   */
  isCurrentPlayer() {
    return this._pseudo == getProfile().pseudo;
  }
  /**
   *
   */
  isAttackable() {
    return this._terrain >= Utils.terrain * 0.5 + 1 && this._terrain <= Utils.terrain * 3 - 1;
  }
  /**
   *
   */
  isAttacker() {
    return this._terrain * 0.5 + 1 <= Utils.terrain && this._terrain * 3 - 1 >= Utils.terrain;
  }
  /**
   *
   */
  getSpawnTech() {
    return this._buildingLevels[3] + this._buildingLevels[4] + this._researchLevels[0];
  }
  /**
   *
   */
  getTravelTime(x = getProfile().x, y = getProfile().y) {
    return Math.ceil(
      Math.pow(0.9, this._researchLevels[6]) *
        637200 *
        (1 - Math.exp(-(Math.sqrt(Math.pow(x - this._x, 2) + Math.pow(y - this._y, 2)) / 350))),
    );
  }
  /**
   *
   */
  getTravelTimeTo(player) {
    return Math.ceil(
      Math.pow(0.9, this._researchLevels[6]) *
        637200 *
        (1 -
          Math.exp(
            -(Math.sqrt(Math.pow(player.x - this._x, 2) + Math.pow(player.y - this._y, 2)) / 350),
          )),
    );
  }
  /**
   *
   */
  getGameLink() {
    return this._pseudo != "Vous" || this._pseudo != "Ennemie"
      ? `<a href="Membre.php?Pseudo=${this._pseudo}" class='o_lien'>${this._pseudo}</a>`
      : this._pseudo;
  }
  /**
   *
   */
  waitSync() {
    return 60 - (moment().add(this.getTravelTime(), "s").seconds() % 60);
  }
  /**
   *
   */
  getSetting() {
    let data = storage.getJSON("outiiil_parametre") || {};
    // Si des données sont deja presente et à jour on les charges
    for (let key in data) if (this._setting[key]) this._setting[key].valeur = data[key];
    return this;
  }
  /**
   *
   */
  save() {
    return storage.setJSON("outiiil_joueur", this, [
      "id",
      "x",
      "y",
      "niveauConstruction",
      "niveauRecherche",
    ]);
  }
  /**
   *
   */
  getProfile() {
    return $.ajax({
      url: "http://" + Utils.serveur + ".fourmizzz.fr/Membre.php?Pseudo=" + this._pseudo,
    });
  }
  /**
   *
   */
  getCurrentProfile() {
    // si on est le joueur courant on a peut etre les infos dans le storage
    if (getProfile().pseudo == this._pseudo) {
      // si on est le joueur courant on regarde dans le localstorage
      let data = storage.getJSON("outiiil_joueur") || {};
      // Si des données sont deja presente et à jour on les charges
      if (data.hasOwnProperty("id") && data.hasOwnProperty("x") && data.hasOwnProperty("y")) {
        this._id = data.id;
        this._x = data.x;
        this._y = data.y;
      }
    }
    // sinon
    if (this._x == -1 || this._y == -1 || this._id == -1) return this.getProfile();
    return null;
  }
  /**
   *
   */
  loadProfile(html) {
    if (html.includes("Aucun joueurs avec le pseudo")) return false;
    else {
      // Strip `<img>` avant le parseHTML de jQuery — sinon `$(html)` crée un
      // fragment où le navigateur tente de charger toutes les images du profil
      // (avatars, signatures), dont des hôtes morts type skyrock.net qui
      // spamment `ERR_NAME_NOT_RESOLVED` dans la console. On lit que du texte
      // et de la structure ici, jamais les images.
      let stripped = html.replace(/<img\b[^>]*>/gi, ""),
        regexp = new RegExp("x=(\\d*) et y=(\\d*)"),
        row = $(stripped).find(".boite_membre a[href^='carte2.php?']").text();
      this._id = $(stripped).find("a[href^='commerce.php?ID=']").attr("href").match(/\d+/g)[0];
      this._x = ~~row.replace(regexp, "$1");
      this._y = ~~row.replace(regexp, "$2");
      this._mv = $(stripped)
        .find("table:eq(0) tr:eq(0) td:eq(0)")
        .text()
        .includes("Joueur en vacances");
      this._terrain = numeral($(stripped).find(".tableau_score tr:eq(1) td:eq(1)").text()).value();
      if (getProfile().pseudo == this._pseudo) this.save();
    }
    return true;
  }
  /**
   * Récupére les niveaux des constructions du joueur ainsi que la construction en cours.
   *
   * @method getConstruction
   */
  getBuildings() {
    // si on est le joueur courant on regarde dans le localstorage
    let data = storage.getJSON("outiiil_joueur") || {};
    // Si des données sont deja presente et à jour on les charges
    if (data.hasOwnProperty("niveauConstruction")) this._buildingLevels = data.niveauConstruction;
    // si on pas les infos en localstorage
    if (
      this._buildingLevels.every((elt) => {
        return elt == -1;
      })
    )
      return $.ajax({ url: "http://" + Utils.serveur + ".fourmizzz.fr/construction.php" });
    return null;
  }
  /**
   *
   */
  loadBuildings(html) {
    let parsed = Utils.parseHtml(html);
    // Niveau des batiments
    parsed.find(".ligneAmelioration").each((i, elt) => {
      this._buildingLevels[i] = parseInt($(elt).find(".niveau_amelioration").text().split(" ")[1]);
    });
    // Construction en cours ?!
    let row = parsed.find("#centre strong").text(),
      building = row.substring(2, row.indexOf("se termine") - 1),
      time = parseInt(row.split(",")[0].split("(")[1]);
    // si il y a une construction en cours les données expirent à la fin de cette construction
    if (building) {
      let dataEvo = storage.getJSON("outiiil_evolution") || {};
      // si on a pas de donné ou que la consutrction n'est pas deja enregistré
      if (!dataEvo.hasOwnProperty("construction")) {
        // si on pas les infos en localstorage
        dataEvo.construction = building.substr(0, 1).toUpperCase() + building.substr(1);
        dataEvo.expConstruction = moment().add(time, "s");
        dataEvo.startConstruction = moment();
        storage.setJSON("outiiil_evolution", dataEvo);
      }
    }
    this.save();
    return this;
  }
  /**
   * Récupére les niveaux des recherches du joueur ainsi que la recherche en cours.
   *
   * @method getLaboratoire
   */
  getResearches() {
    // si on est le joueur courant on regarde dans le localstorage
    let data = storage.getJSON("outiiil_joueur") || {};
    // Si des données sont deja presente et à jour on les charges
    if (data.hasOwnProperty("niveauRecherche")) this._researchLevels = data.niveauRecherche;
    // si on pas les infos en localstorage
    if (
      this._researchLevels.every((elt) => {
        return elt == -1;
      })
    )
      return $.ajax({ url: "http://" + Utils.serveur + ".fourmizzz.fr/laboratoire.php" });
    return null;
  }
  /**
   *
   */
  loadResearches(html) {
    let parsed = Utils.parseHtml(html);
    // Niveau des recherches
    parsed.find(".ligneAmelioration").each((i, elt) => {
      this._researchLevels[i] = parseInt($(elt).find(".niveau_amelioration").text().split(" ")[1]);
    });
    // Recherche en cours ?!
    let row = parsed.find("#centre strong").text();
    let research = row.substring(2, row.indexOf("termin") - 1),
      time = parseInt(row.split(",")[0].split("(")[1]);
    // si il y a une recherche en cours les données expirent à la fin de cette construction
    if (research) {
      let dataEvo = storage.getJSON("outiiil_evolution") || {};
      // si on a pas de donné ou que la recherche n'est pas deja enregistré
      if (!dataEvo.hasOwnProperty("recherche")) {
        // si on pas les infos en localstorage
        dataEvo.recherche = research;
        dataEvo.expRecherche = moment().add(time, "s");
        dataEvo.startRecherche = moment();
        storage.setJSON("outiiil_evolution", dataEvo);
      }
    }
    this.save();
    return this;
  }
  /**
   *
   */
  getRadarRow(radar, id, index) {
    let cellTerrain = this.isAttackable()
      ? `<a class="gras ${this._mv ? "blue_light" : ""} href="/ennemie.php?Attaquer=${this._id}&lieu=1">${numeral(this._terrain).format()}</a>`
      : `<span ${this._mv ? `class="blue_light" title="En vacances"` : ""}>${numeral(this._terrain).format()}</span>`;
    $(id).append(
      `<tr id="o_item_${index}" class="lien"><td><a id="o_maj_${this._id}" class='o_actualiser' href=""><img src="${IMG_REFRESH}" alt="rang" height="20"/></a></td><td id="o_nom_${this._id}" class="left" title=""><a class="gras ${this._mv ? "blue_light" : ""}" href="Membre.php?Pseudo=${this._pseudo}">${this._pseudo}</a></td><td id="o_terrain_${this._id}" class="right reduce" title="">${cellTerrain}</td></tr>`,
    );
    // event
    $("#o_maj_" + this._id).click((e) => {
      this.refreshInRadar(radar).then((res) => {
        if (res.removed) {
          $.toast({ ...TOAST_WARNING, text: `Le joueur ${this._pseudo} n'existe plus.` });
          radar.removePlayer(this).save().refresh();
        } else if (res.changed) {
          radar.save();
        }
      });
      return false;
    });
    // tooltip vacance...
    $("#o_terrain_" + this._id).tooltip({
      position: { my: "left+10 center", at: "right center" },
      tooltipClass: "warning-tooltip",
    });
    // creation du tooltip sur les joueurs pour avoir le temps de trajet
    $("#o_nom_" + this._id).tooltip({
      position: { my: "left+10 bottom", at: "right center" },
      content: "NC",
      open: (e, ui) => {
        if (radar.joueurs.hasOwnProperty(this._pseudo)) {
          $(e.currentTarget).tooltip({
            position: { my: "left+10 center", at: "right center" },
            content: `<table><tr><td>Temps de trajet</td><td class="right">${Utils.intToTime(getProfile().getTravelTimeTo(radar.joueurs[this._pseudo]))}</td></tr><td>Retour le</td><td class="right">${moment().add(getProfile().getTravelTimeTo(radar.joueurs[this._pseudo]), "s").format("D MMM à HH[h]mm[m]ss[s]")}</td><tr></tr></table>`,
            hide: { effect: "fade", duration: 10 },
            tooltipClass: "warning-tooltip ui-tooltip-right",
          });
        }
      },
      hide: { effect: "fade", duration: 10 },
      tooltipClass: "warning-tooltip ui-tooltip-right",
    });
  }
  /**
   * Rafraîchit le joueur dans le contexte de la boite radar : spin de l'icône,
   * fetch du profil, mise à jour du terrain et de l'état MV, highlight du diff.
   * Ne sauvegarde pas et ne touche pas la collection du radar — c'est au caller
   * (click single, ou batch "Tout actualiser") de décider quoi faire selon le
   * résultat ({ removed, changed }).
   *
   * @method refreshDansRadar
   * @param {BoiteRadar} radar
   * @return {Promise<{ removed: boolean, changed: boolean }>}
   */
  refreshInRadar(radar) {
    let oldTerrain = numeral($("#o_terrain_" + this._id).text()).value(),
      oldMV = this._mv,
      $icon = $("#o_maj_" + this._id);
    $({ deg: 0 }).animate(
      { deg: 360 },
      {
        duration: 600,
        step: (now) => $icon.find("img").css({ transform: "rotate(" + now + "deg)" }),
      },
    );
    return this.getProfile().then((data) => {
      if (!this.loadProfile(data)) return { removed: true, changed: false };
      let diff = this._terrain - oldTerrain,
        changed = false,
        cellTerrain = this.isAttackable()
          ? `<a class="gras ${this._mv ? "blue_light" : ""} href="/ennemie.php?Attaquer=${this._id}&lieu=1">${numeral(this._terrain).format()}</a>`
          : `<span ${this._mv ? `class="blue_light" title="En vacances"` : ""}>${numeral(this._terrain).format()}</span>`;
      if (oldMV != this._mv) {
        $("#o_terrain_" + this._id).html(cellTerrain);
        if (this._mv) $("#o_nom_" + this._id + " a").addClass("blue_light");
        else $("#o_nom_" + this._id + " a").removeClass("blue_light");
        changed = true;
      }
      if (diff) {
        $("#o_terrain_" + this._id)
          .html(cellTerrain)
          .effect("highlight", { color: diff > 0 ? "#458D58" : "#8D4545" }, 1000)
          .attr("title", numeral(diff).format())
          .tooltip({
            position: { my: "left+10 center", at: "right center" },
            content: `<span class='${diff > 0 ? "green_light" : "red_xlight"}'>${diff > 0 ? "+ " + $("#o_terrain_" + this._id).attr("title") : $("#o_terrain_" + this._id).attr("title")} cm²</span>`,
            hide: { effect: "fade", duration: 10 },
            tooltipClass: "warning-tooltip ui-tooltip-right",
          })
          .tooltip("open");
        changed = true;
      }
      return { removed: false, changed };
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
        prioriteRecherche: "joueur",
      },
    });
  }
}
