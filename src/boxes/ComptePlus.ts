/**
 * Builds the ComptePlus box.
 *
 * @class ComptePlusBox
 * @constructor
 * @extends Box
 */
import { $, moment, numeral } from "~/vendor";
import {
  BUILDINGS,
  IMG_DOWN,
  IMG_UP,
  UNIT_NAMES,
  UNIT_NAMES_PLURAL,
  RESEARCHES,
  UNIT_TIME,
} from "~/constants";
import { VERSION } from "~/lib/version";
import { Utils } from "~/lib/Utils";
import { getProfile } from "~/models/currentPlayer";
import { QUICK_MENU, QUICK_MENU_KEY } from "~/data/quickMenu";
import { Player } from "~/models/Player";
import * as storage from "~/storage";

export class ComptePlusBox {
  // Fields declared for TypeScript (Phase 2 was a straight conversion; real
  // typing is deferred — see .claude/plans/wxt-migration-followups.md).
  _spawn: any;
  _spawnStart: any;
  _building: any;
  _buildingExpiry: any;
  _buildingStart: any;
  _research: any;
  _researchExpiry: any;
  _researchStart: any;
  _attack: any;
  _attackStart: any;
  _convoy: any;
  _convoyStart: any;
  _hunt: any;
  _huntStart: any;
  constructor() {
    // class attributes
    this._spawn = [];
    this._spawnStart = 0;
    this._building = "";
    this._buildingExpiry = 0;
    this._buildingStart = 0;
    this._research = "";
    this._researchExpiry = 0;
    this._researchStart = 0;
    this._attack = [];
    this._attackStart = 0;
    this._convoy = [];
    this._convoyStart = 0;
    this._hunt = [];
    this._huntStart = 0;
    // load the data from storage
    this.getData();
  }
  /**
   *
   */
  get ponte() {
    return this._spawn;
  }
  /**
   *
   */
  set ponte(newSpawn) {
    this._spawn = newSpawn;
  }
  /**
   *
   */
  get startPonte() {
    return this._spawnStart;
  }
  /**
   *
   */
  set startPonte(newStart) {
    this._spawnStart = newStart;
  }
  /**
   *
   */
  get construction() {
    return this._building;
  }
  /**
   *
   */
  set construction(newBuilding) {
    this._building = newBuilding;
  }
  /**
   *
   */
  get expConstruction() {
    return this._buildingExpiry;
  }
  /**
   *
   */
  set expConstruction(newExpiry) {
    this._buildingExpiry = newExpiry;
  }
  /**
   *
   */
  get startConstruction() {
    return this._buildingStart;
  }
  /**
   *
   */
  set startConstruction(newStart) {
    this._buildingStart = newStart;
  }
  /**
   *
   */
  get recherche() {
    return this._research;
  }
  /**
   *
   */
  set recherche(newResearch) {
    this._research = newResearch;
  }
  /**
   *
   */
  get expRecherche() {
    return this._researchExpiry;
  }
  /**
   *
   */
  set expRecherche(newExpiry) {
    this._researchExpiry = newExpiry;
  }
  /**
   *
   */
  get startRecherche() {
    return this._researchStart;
  }
  /**
   *
   */
  set startRecherche(newStart) {
    this._researchStart = newStart;
  }
  /**
   *
   */
  get convoi() {
    return this._convoy;
  }
  /**
   *
   */
  set convoi(newConvoy) {
    this._convoy = newConvoy;
  }
  /**
   *
   */
  get startConvoi() {
    return this._convoyStart;
  }
  /**
   *
   */
  set startConvoi(newStart) {
    this._convoyStart = newStart;
  }
  /**
   *
   */
  get attaque() {
    return this._attack;
  }
  /**
   *
   */
  set attaque(newAttack) {
    this._attack = newAttack;
  }
  /**
   *
   */
  get startAttaque() {
    return this._attackStart;
  }
  /**
   *
   */
  set startAttaque(newStart) {
    this._attackStart = newStart;
  }
  /**
   *
   */
  get chasse() {
    return this._hunt;
  }
  /**
   *
   */
  set chasse(newHunt) {
    this._hunt = newHunt;
  }
  /**
   *
   */
  get startChasse() {
    return this._huntStart;
  }
  /**
   *
   */
  set startChasse(newStart) {
    this._huntStart = newStart;
  }
  /**
   * Reads the data about the watched players.
   *
   * @method getRadar
   */
  getData() {
    let data = storage.getJSON("outiiil_evolution") || {};
    if (data.ponte) this._spawn = data.ponte;
    if (data.startPonte) this._spawnStart = data.startPonte;
    if (data.construction) this._building = data.construction;
    if (data.expConstruction) this._buildingExpiry = data.expConstruction;
    if (data.startConstruction) this._buildingStart = data.startConstruction;
    if (data.recherche) this._research = data.recherche;
    if (data.expRecherche) this._researchExpiry = data.expRecherche;
    if (data.startRecherche) this._researchStart = data.startRecherche;
    if (data.attaque) this._attack = data.attaque;
    if (data.startAttaque) this._attackStart = data.startAttaque;
    if (data.convoi) this._convoy = data.convoi;
    if (data.startConvoi) this._convoyStart = data.startConvoi;
    if (data.chasse) this._hunt = data.chasse;
    if (data.startChasse) this._huntStart = data.startChasse;
    return this;
  }
  /**
   *
   */
  toJSON() {
    let data: any = {};
    if (this._spawn.length) data.ponte = this._spawn;
    if (this._spawnStart) data.startPonte = this._spawnStart;
    if (this._building) data.construction = this._building;
    if (this._buildingExpiry) data.expConstruction = this._buildingExpiry;
    if (this._buildingStart) data.startConstruction = this._buildingStart;
    if (this._research) data.recherche = this._research;
    if (this._researchExpiry) data.expRecherche = this._researchExpiry;
    if (this._researchStart) data.startRecherche = this._researchStart;
    if (this._attack.length) data.attaque = this._attack;
    if (this._attackStart) data.startAttaque = this._attackStart;
    if (this._convoy.length) data.convoi = this._convoy;
    if (this._convoyStart) data.startConvoi = this._convoyStart;
    if (this._hunt.length) data.chasse = this._hunt;
    if (this._huntStart) data.startChasse = this._huntStart;
    return data;
  }
  /**
   *
   */
  save() {
    storage.setJSON("outiiil_evolution", this);
    return this;
  }
  /**
   *
   */
  checkData() {
    // building finished
    if (this._building && moment(this._buildingExpiry).diff(moment()) < 0) {
      // bump the building level
      let index = BUILDINGS.findIndex((elt) => {
        return this._building.toLowerCase().includes(elt.toLowerCase());
      });
      getProfile().niveauConstruction[index]++;
      getProfile().save();
      // a building that affects spawning also refreshes the spawns
      if (this._building.includes("Couveuse") || this._building.includes("Solarium"))
        this.recomputeSpawnTime();
      this._buildingStart = 0;
      this._buildingExpiry = 0;
      this._building = "";
    }
    // research finished
    if (this._research && moment(this._researchExpiry).diff(moment()) < 0) {
      // bump the research level
      let index = RESEARCHES.findIndex((elt) => {
        return this._research.toLowerCase().includes(elt.toLowerCase());
      });
      getProfile().niveauRecherche[index]++;
      getProfile().save();
      // a research that affects spawning also refreshes the spawns
      if (this._research.includes("Technique de ponte")) this.recomputeSpawnTime();
      this._researchExpiry = 0;
      this._researchStart = 0;
      this._research = "";
    }
    // spawns finished
    for (let i = this._spawn.length; i--; )
      if (moment(this._spawn[i].exp).diff(moment()) < 0) this._spawn.splice(i, 1);
    if (!this._spawn.length) this._spawnStart = 0;
    // convoys finished
    for (let i = this._convoy.length; i--; )
      if (moment(this._convoy[i].exp).diff(moment()) < 0) this._convoy.splice(i, 1);
    if (!this._convoy.length) this._convoyStart = 0;
    // attacks finished
    for (let i = this._attack.length; i--; )
      if (moment(this._attack[i].exp).diff(moment()) < 0) this._attack.splice(i, 1);
    if (!this._attack.length) this._attackStart = 0;
    // hunts finished
    for (let i = this._hunt.length; i--; )
      if (moment(this._hunt[i].exp).diff(moment()) < 0) this._hunt.splice(i, 1);
    if (!this._hunt.length) this._huntStart = 0;
    return this.save();
  }
  /**
   *
   */
  recomputeSpawnTime() {
    this._spawn.forEach((spawn) => {
      spawn.exp = moment().add(Math.round((moment(spawn.exp).diff(moment()) / 1000) * 0.9), "s");
    });
  }
  /**
   * Builds the "menu rapide" shortcut block (see QUICK_MENU) from the
   * preferences saved by `AccountPage`. Returns an empty string when nothing
   * is ticked, so no empty block is rendered.
   *
   * Reuses the game's own `lien_rapide` class, the one Fourmizzz uses in its
   * ComptePlus box, so the styling comes for free instead of being
   * reinvented.
   *
   * @private
   * @method _quickMenuShortcutsHtml
   * @returns {string}
   */
  _quickMenuShortcutsHtml() {
    let prefs = {};
    try {
      prefs = storage.getJSON(QUICK_MENU_KEY) || {};
    } catch (e) {
      return "";
    }
    let actifs = QUICK_MENU.filter((item) => prefs[item.name]);
    if (!actifs.length) return "";
    let liens = actifs
      .map((item) => {
        let target = item.target ? ` target='${item.target}' rel='noopener'` : "";
        return `<a href='${item.url}'${target}>${item.label}</a>`;
      })
      .join("");
    return `<div class='lien_rapide'>${liens}</div>`;
  }
  /**
   * Re-renders the shortcut block from localStorage. Called by AccountPage
   * once the player saves their preferences on compte.php, which avoids a
   * full page reload for what is only a display preference.
   *
   * @method updateQuickMenuShortcuts
   */
  updateQuickMenuShortcuts() {
    if (Utils.comptePlus) return this; // natif gère pour les C+
    let $box = $("#boiteComptePlus .contenu_boite_compte_plus");
    if (!$box.length) return this;
    $box.find(".lien_rapide").remove();
    let html = this._quickMenuShortcutsHtml();
    if (html) $box.append(html);
    return this;
  }
  /**
   * Renders the box.
   *
   * @private
   * @method render
   */
  render() {
    let visible = storage.getRaw("outiiil_boiteActive");
    if (!Utils.comptePlus) {
      // Add the content
      $("#boiteComptePlus").replaceWith(
        "<div id='boiteComptePlus' class='boite_compte_plus'><div class='titre_colonne_cliquable'><span class='titre_compte_plus'>Toolzzz " +
          VERSION.substring(0, 2) +
          "<span class='reduce'>" +
          VERSION.substring(2) +
          "</span></span></div><div class='contenu_boite_compte_plus'><table " +
          (visible == null || visible == "C" ? "" : "style='display:none'") +
          ">" +
          // Spawn row
          "<tr class='lien' title='Aller sur Reine'><td><a href='Reine.php'><div style='position:relative;height:27px;padding-left:5px;'><div class='mini_icone_ponte'/><div id='o_resteUnite' class='o_labelBoite'></div><div id='o_tempsUnite' class='o_labelTempsBoite'></div><div id='o_progressUnite'/></div></a></td></tr>" +
          // Building row
          "<tr class='lien' title='Aller sur Construction'><td><a href='construction.php'><div style='position:relative;height:27px;padding-left:5px;'><div class='mini_icone_construction'/><div id='o_resteConstruction' class='o_labelBoite'>Aucune construction</div><div id='o_tempsConstruction' class='o_labelTempsBoite'></div><div id='o_progressConstruction'/></div></a></td></tr>" +
          // Research row
          "<tr class='lien' title='Aller sur Laboratoire'><td><a href='laboratoire.php'><div style='position:relative;height:27px;padding-left:5px;'><div class='mini_icone_recherche'/><div id='o_resteRecherche' class='o_labelBoite'>Aucune recherche</div><div id='o_tempsRecherche' class='o_labelTempsBoite'></div><div id='o_progressRecherche'/></div></a></td></tr>" +
          // Hunt row
          "<tr class='lien' title='Aller sur Ressource'><td><a href='Ressources.php'><div style='position:relative;height:27px;padding-left:5px;'><div class='mini_icone_chasse'/><div id='o_resteChasse' class='o_labelBoite'></div><div id='o_tempsChasse' class='o_labelTempsBoite'></div><div id='o_progressChasse'/></div></a></td></tr>" +
          // Attack row
          "<tr class='lien' title='Aller sur Armée'><td><a href='Armee.php'><div style='position:relative;height:27px;padding-left:5px;'><div class='mini_icone_attaque'/><div id='o_resteAttaque' class='o_labelBoite'></div><div id='o_tempsAttaque' class='o_labelTempsBoite'></div><div id='o_progressAttaque'/></div></a></td></tr>" +
          // Convoy row
          "<tr class='lien' title='Aller sur Convoi'><td><a href='commerce.php'><div style='position:relative;height:27px;padding-left:5px;'><div class='mini_icone_convoi'/><div id='o_resteConvoi' class='o_labelBoite'></div><div id='o_tempsConvoi' class='o_labelTempsBoite'></div><div id='o_progressConvoi'/></div></a></td></tr>" +
          // Search form
          "</table>" +
          "<form method='post' action='classementAlliance.php' style='text-align:center;margin-top:5px;'><input type='text' name='requete' id='recherche' placeholder='Joueur ou Alliance'/></form>" +
          this._quickMenuShortcutsHtml() +
          "</div></div>",
      );
      // Fill in the fields
      this.checkData()
        .updateSpawn()
        .updateBuilding()
        .updateResearch()
        .updateAttack()
        .updateConvoy()
        .updateHunt();
      // Format the title
      $("#boiteComptePlus table tr").tooltip({
        tooltipClass: "warning-tooltip",
        content: function () {
          return $(this).prop("title");
        },
        position: { my: "left+10 center", at: "right center" },
        hide: { effect: "fade", duration: 10 },
      });
      // autocomplete on the search field
      $("#recherche")
        .autocomplete({
          source: (request, response) => {
            // autocomplete request
            Player.search(request.term).then((data) => {
              response(Utils.extractResearch(data));
            });
          },
          position: { my: "left top-5", at: "left bottom" },
          delay: 0,
          minLength: 3,
          select: (event, ui) => {
            window.location.replace(ui.item.url);
          },
        })
        .data("ui-autocomplete");
    } else
      visible == null || visible == "C"
        ? ""
        : $("#boiteComptePlus .contenu_boite_compte_plus table:eq(0)").css("display", "none");
    // Highlight effect when new terrain is discovered: parses a tooltip the
    // game injects in a script tag next to #tableau_boite_info (shaped like
    // `content: ... })`). On mobile that native banner can be missing or
    // rendered differently; without the guard, `.split("content:")[1]` returns
    // undefined and the following `.split("})")` throws, which used to break
    // the whole init chain (RadarBox, Reine.php / compte.php routing, etc.).
    let tooltipRaw = $("#tableau_boite_info").next().text();
    if (tooltipRaw.includes("content:")) {
      let tooltipConso = Utils.parseHtml(tooltipRaw.split("content:")[1].split("})")[0]);
      if (
        Utils.terrain * 48 !=
          numeral(tooltipConso.find("td:eq(7)").text()).value() +
            numeral(tooltipConso.find("td:eq(8)").text()).value() &&
        Utils.ouvrieres > Utils.terrain
      )
        $("#boite_info_tdc .jauge").addClass("highlight_error");
    }
  }
  /**
   * Updates the spawns when they no longer match.
   *
   * @private
   * @method updateSpawn
   */
  updateSpawn() {
    if (this._spawn.length) {
      $("#o_resteUnite").text(this._spawn[0].unite).css({
        "max-width": "110px",
        "text-overflow": "ellipsis",
        overflow: "hidden",
        "white-space": "nowrap",
      });
      $("#o_progressUnite").progressbar({
        value:
          ((moment().valueOf() - moment(this._spawnStart).valueOf()) * 100) /
          (moment(this._spawn[0].exp).valueOf() - moment(this._spawnStart).valueOf()),
      });
      // Add the title
      let table = "<table>",
        tmpExpiry = moment(this._spawn[0].exp),
        countU,
        timeU;
      for (let i = 0; i < this._spawn.length; i++) {
        countU = this._spawn[i]["nombre"];
        timeU =
          countU > 1
            ? UNIT_TIME[UNIT_NAMES_PLURAL.indexOf(this._spawn[i].unite)]
            : UNIT_TIME[UNIT_NAMES.indexOf(this._spawn[i].unite)];
        if (i == 0)
          countU = Math.ceil(
            moment(this._spawn[i].exp).diff(moment()) /
              1000 /
              (timeU * Math.pow(0.9, getProfile().getSpawnTech())),
          );
        table += `<tr><td class='gras right'>${countU < 1000 ? countU : numeral(countU).format("0[.]00a")}</td><td>${this._spawn[i].unite}</td><td>${moment(this._spawn[i].exp).add(1, "minute").startOf("minute").format("D MMM YYYY à HH[h]mm")}</td></tr>`;
      }
      table += "</table>";
      $("#boiteComptePlus table tr:eq(0)").attr("title", table);
      // Under an hour left (seconds are visible): animate the countdown
      let timeR = moment(this._spawn[0].exp).diff(moment()) / 1000;
      $("#o_tempsUnite").text(Utils.shortcutTime(timeR));
      if (timeR <= 3600) Utils.decreaseTime(timeR, "o_tempsUnite");
      if (timeR <= 600) $("#o_progressUnite").addClass("highlight_success");
    } else {
      $("#o_resteUnite").html("<span class='red_light'>Aucune ponte</span>");
      $("#o_tempsUnite").text("");
      $("#o_progressUnite").progressbar({ value: 0 });
    }
    return this;
  }
  /**
   * Updates the running building when it changes.
   *
   * @private
   * @method updateBuilding
   */
  updateBuilding() {
    if (this._building) {
      $("#o_resteConstruction").text(this._building).css({
        "max-width": "110px",
        "text-overflow": "ellipsis",
        overflow: "hidden",
        "white-space": "nowrap",
      });
      $("#o_progressConstruction").progressbar({
        value:
          ((moment().valueOf() - moment(this._buildingStart).valueOf()) * 100) /
          (moment(this._buildingExpiry).valueOf() - moment(this._buildingStart).valueOf()),
      });
      let timeR = moment(this._buildingExpiry).diff(moment()) / 1000;
      $("#o_resteConstruction").after(
        `<div id='o_tempsConstruction' class='o_labelTempsBoite'>${Utils.shortcutTime(timeR)}</div>`,
      );
      if (timeR <= 3600) Utils.decreaseTime(timeR, "o_tempsConstruction");
      if (timeR <= 600) $("#o_progressConstruction").addClass("highlight_success");
    }
    return this;
  }
  /**
   * Updates the running research when it changes.
   *
   * @private
   * @method updateResearch
   */
  updateResearch() {
    if (this._research) {
      $("#o_resteRecherche").text(this._research).css({
        "max-width": "110px",
        "text-overflow": "ellipsis",
        overflow: "hidden",
        "white-space": "nowrap",
      });
      $("#o_progressRecherche").progressbar({
        value:
          ((moment().valueOf() - moment(this._researchStart).valueOf()) * 100) /
          (moment(this._researchExpiry).valueOf() - moment(this._researchStart).valueOf()),
      });
      let timeR = moment(this._researchExpiry).diff(moment()) / 1000;
      $("#o_resteRecherche").after(
        `<div id='o_tempsRecherche' class='o_labelTempsBoite'>${Utils.shortcutTime(timeR)}</div>`,
      );
      if (timeR <= 3600) Utils.decreaseTime(timeR, "o_tempsRecherche");
      if (timeR <= 600) $("#o_progressRecherche").addClass("highlight_success");
    }
    return this;
  }
  /**
   * Updates the attacks when they no longer match.
   *
   * @private
   * @method updateAttack
   */
  updateAttack() {
    if (this._attack.length) {
      $("#o_resteAttaque").text(this._attack[0].cible).css({
        "max-width": "110px",
        "text-overflow": "ellipsis",
        overflow: "hidden",
        "white-space": "nowrap",
      });
      $("#o_progressAttaque").progressbar({
        value:
          ((moment().valueOf() - moment(this._attackStart).valueOf()) * 100) /
          (moment(this._attack[0].exp).valueOf() - moment(this._attackStart).valueOf()),
      });
      // Add the title
      let table = "<table>";
      for (let i = 0, l = this._attack.length; i < l; i++)
        table += `<tr><td class='gras'>${this._attack[i].cible}</td><td>&nbsp;</td><td>Retour le ${moment(this._attack[i].exp).add(1, "minute").startOf("minute").format("D MMM YYYY à HH[h]mm")}</td></tr>`;
      table += "</table>";
      $("#boiteComptePlus table tr:eq(4)").attr("title", table);
      let timeR = moment(this._attack[0].exp).diff(moment()) / 1000;
      $("#o_tempsAttaque").text(Utils.shortcutTime(timeR));
      if (timeR <= 3600) Utils.decreaseTime(timeR, "o_tempsAttaque");
      if (timeR <= 600) $("#o_progressAttaque").addClass("highlight_success");
    } else {
      $("#o_resteAttaque").text("Aucune attaque");
      $("#o_tempsAttaque").text("");
      $("#o_progressAttaque").progressbar({ value: 0 });
    }
    return this;
  }
  /**
   * Updates the convoys when they no longer match.
   *
   * @private
   * @method updateConvoy
   */
  updateConvoy() {
    if (this._convoy.length) {
      $("#o_resteConvoi").text(this._convoy[0].cible).css({
        "max-width": "110px",
        "text-overflow": "ellipsis",
        overflow: "hidden",
        "white-space": "nowrap",
      });
      $("#o_progressConvoi").progressbar({
        value:
          ((moment().valueOf() - moment(this._convoyStart).valueOf()) * 100) /
          (moment(this._convoy[0].exp).valueOf() - moment(this._convoyStart).valueOf()),
      });
      // Add the title
      let table = "<table id='o_titleConvoi'>";
      for (let i = 0, l = this._convoy.length; i < l; i++)
        table += `<tr><td>${this._convoy[i].sens ? "<img src='" + IMG_DOWN + "' alt='reception'/>" : "<img src='" + IMG_UP + "' alt='livraison'/>"}</td><td class='gras'>${this._convoy[i].cible}</td><td>&nbsp;</td><td class="right">${numeral(this._convoy[i].nou).format("0[.]00a")} <img alt="nourritures" src="images/icone/icone_pomme.png" height="17"></td><td class="right">${numeral(this._convoy[i].mat).format("0[.]00a")} <img alt="materiaux" src="images/icone/icone_bois.png" height="17"/></td><td>Retour le ${moment(this._convoy[i].exp).add(1, "minute").startOf("minute").format("D MMM YYYY à HH[h]mm")}</td></tr>`;
      table += "</table>";
      $("#boiteComptePlus table tr:eq(5)").attr("title", table);
      let timeR = moment(this._convoy[0].exp).diff(moment()) / 1000;
      $("#o_tempsConvoi").text(Utils.shortcutTime(timeR));
      if (timeR <= 3600) Utils.decreaseTime(timeR, "o_tempsConvoi");
      if (timeR <= 600) $("#o_progressConvoi").addClass("highlight_success");
    } else {
      $("#o_resteConvoi").text("Aucune convoi");
      $("#o_tempsConvoi").text("");
      $("#o_progressConvoi").progressbar({ value: 0 });
    }
    return this;
  }
  /**
   * Updates the hunts when they no longer match.
   *
   * @private
   * @method updateHunt
   */
  updateHunt() {
    if (this._hunt.length) {
      // build the title
      let table = "<table>",
        total = 0;
      for (let i = 0, l = this._hunt.length; i < l; i++) {
        total += this._hunt[i].quantite;
        table += `<tr><td><span class="gras">${numeral(this._hunt[i].quantite).format()}</span> cm²</td><td>Retour le ${moment(this._hunt[i].exp).add(1, "minute").startOf("minute").format("D MMM YYYY à HH[h]mm")}</td></tr>`;
      }
      table += "</table>";
      $("#o_resteChasse")
        .text(numeral(total).format() + " cm²")
        .css({
          "max-width": "110px",
          "text-overflow": "ellipsis",
          overflow: "hidden",
          "white-space": "nowrap",
        });
      $("#o_progressChasse").progressbar({
        value:
          ((moment().valueOf() - moment(this._huntStart).valueOf()) * 100) /
          (moment(this._hunt[0].exp).valueOf() - moment(this._huntStart).valueOf()),
      });
      // Add the title
      $("#boiteComptePlus table tr:eq(3)").attr("title", table);
      let timeR = moment(this._hunt[0].exp).diff(moment()) / 1000;
      $("#o_tempsChasse").text(Utils.shortcutTime(timeR));
      if (timeR <= 3600) Utils.decreaseTime(timeR, "o_tempsChasse");
      if (timeR <= 600) $("#o_progressChasse").addClass("highlight_success");
    } else {
      $("#o_resteChasse").text("Aucune chasse");
      $("#o_tempsChasse").text("");
      $("#o_progressChasse").progressbar({ value: 0 });
    }
    return this;
  }
}
