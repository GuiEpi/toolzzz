/*
 * Hunt.ts
 * Hraesvelg
 **********************************************************************/

import { browser } from "#imports";
import type { PublicPath } from "wxt/browser";

import { $, moment, numeral } from "~/vendor";
import {
  DATEPICKER_OPTIONS,
  HUNT_RATIO,
  HUNT_RETALIATION,
  IMG_ARROW,
  IMG_ATT,
  IMG_COPY_ARMY,
  TOAST_ERROR,
  TOAST_SUCCESS,
  TOAST_WARNING,
  UNIT_NAMES,
  UNIT_NAMES_PLURAL,
  UNIT_SHORT_NAMES,
  UNIT_TIME,
  WILDLIFE,
} from "~/constants";
import { Utils } from "~/lib/Utils";
import { getProfile } from "~/models/currentPlayer";
import { Box } from "~/boxes/Box";
import { openArmyImport } from "~/boxes/armyImport";
import { Army } from "~/models/Army";
import { Hunt } from "~/models/Hunt";
import {
  armyAttack,
  huntDuration,
  otherHFLosses,
  ratioPreviews,
  simulateHunts,
} from "~/models/HuntSimulation";

// Terrains of the "Pertes selon le TdC à l'arrivée" table, after the planned one.
const OTHER_HF = [
  1000000, 5000000, 10000000, 15000000, 20000000, 30000000, 40000000, 50000000, 75000000, 100000000,
];

/**
 * Analyses, simulates and launches hunts.
 *
 * @class HuntBox
 * @constructor
 * @extends Box
 */
export class HuntBox extends Box {
  // Fields declared for TypeScript (Phase 2 was a straight conversion; real
  // typing is deferred — see .claude/plans/wxt-migration-followups.md).
  _real: any;
  _simu: any;
  _launching: boolean;
  constructor() {
    super(
      "o_boiteChasse",
      "Outils pour Chasseur",
      `<div id='o_tabsChasse' class='o_tabs'><ul><li><a href='#o_tabsChasse1'>Analyser</a></li><li><a href='#o_tabsChasse3'>Simuler</a></li><li><a href='#o_tabsChasse2'>Bestiaire</a></li></ul><div id='o_tabsChasse1'/><div id='o_tabsChasse3'/><div id='o_tabsChasse2'/></div>`,
    );
    /**
     * what the player really has — army and free hunt slots — loaded when the
     * "Simuler" tab is first opened, to fill the army and to allow a launch
     */
    this._real = null;
    /**
     * last simulation, for the copy button
     */
    this._simu = null;
    /**
     * hunts being launched: the form is frozen meanwhile
     */
    this._launching = false;
  }
  /**
   * Renders the box.
   *
   * @private
   * @method render
   */
  override render() {
    if (super.render()) {
      $("#o_tabsChasse")
        .tabs({
          activate: (event, ui) => {
            this.css();
            if (ui.newPanel.attr("id") == "o_tabsChasse3" && !this._real) this._loadRealState();
          },
        })
        .removeClass("ui-widget");
      this.analyze().simulate().bestiary().css().event();
    }
  }
  /**
   * Applies the box's own styling.
   *
   * @private
   * @method css
   */
  override css() {
    super.css();
    $(
      "#o_resultatChasse tr:even, .o_tabs .ui-widget-header .ui-tabs-anchor, #o_bestiaireTable tr:even, #o_scDetails tr:even, #o_scPertes tr:even, #o_scRepartition tr:even, #o_scAutresTdc tr:even",
    ).css("background-color", getProfile().parametre["couleur2"].valeur);
    $(".o_tabs .ui-widget-header .ui-tabs-anchor").css(
      "background-color",
      getProfile().parametre["couleur2"].valeur,
    );
    $(".o_content a")
      .unbind("mouseenter mouseleave")
      .css("color", getProfile().parametre["couleurTexte"].valeur);
    $(".o_content li:not(.ui-state-active) a").css("color", "inherit");
    let matches = getProfile().parametre["couleurTexte"].valeur.match(
      /#([\da-f]{2})([\da-f]{2})([\da-f]{2})/i,
    );
    $(".o_content li:not(.ui-state-active):not(.ui-state-disabled) a").hover(
      (e) => {
        $(e.currentTarget).css(
          "color",
          "rgba(" +
            matches
              .slice(1)
              .map((m) => {
                return parseInt(m, 16);
              })
              .concat("0.5") +
            ")",
        );
      },
      (e) => {
        $(e.currentTarget).css("color", "inherit");
      },
    );
    $(".o_content .ui-state-disabled a").css({ cursor: "not-allowed", "pointer-events": "all" });
    return this;
  }
  /**
   * Wires up the box's own events.
   *
   * @private
   * @method event
   */
  override event() {
    super.event();
    return this;
  }
  /**
   * Form to analyse one or more hunts.
   *
   * @private
   * @method analyze
   */
  analyze() {
    $("#o_tabsChasse1").append(
      "<textarea id='o_rcChasse' class='o_maxWidth' placeholder='Rapport(s) de chasse(s)...'></textarea><div class='o_marginT15'><table  id='o_resultatChasse' class='o_maxWidth'></table></div>",
    );

    $("#o_rcChasse").on("input", (e) => {
      // collect the hunts to analyse
      let hunts = e.currentTarget.value.split("nourriture"),
        summary = new Hunt(""),
        hunt = null,
        erreur = false,
        html =
          "<tr class='gras'><td colspan='2'>Avant</td><td colspan='2'>Evolution</td><td colspan='2'>Résultat</td></tr>";
      // clear the previous output
      $("#o_resultatChasse").html("");
      for (let i = 0; i < hunts.length; i++) {
        if (hunts[i]) {
          hunt = new Hunt(hunts[i]);
          if (hunt.analyze()) {
            html += hunt.toBoxHtml(false);
            summary.add(hunt);
          } else {
            $.toast({ ...TOAST_WARNING, text: "Le rapport de chasse ne peut pas être analysé." });
            erreur = true;
          }
        }
      }
      if (!erreur) {
        $("#o_resultatChasse").append(html);
        this.renderSummary(summary);
      }
    });
    return this;
  }
  /**
   * Renders the data read from a hunt report.
   *
   * @private
   * @method afficherAnalyse
   * @param {Object} hunt
   * @param {Boolean} bilan
   */
  renderSummary(hunt) {
    let i = 0,
      html = "<tr><td colspan='6'><select id='o_choixChasse' class='o_marginT15'>";
    for (
      ;
      i < Math.floor($("#o_resultatChasse tr").length / 4);
      html += "<option value='" + i + "'>Chasse " + (i + 1) + "</option>", i++
    );
    html += "<option value='" + i + "' selected>Bilan</option></select></td></tr>";
    $("#o_resultatChasse").append(hunt.toBoxHtml(true) + html);
    // Styling
    $("#o_resultatChasse tr:even").css(
      "background-color",
      getProfile().parametre["couleur2"].valeur,
    );
    $("#o_choixChasse").change((e) => {
      let selection = e.currentTarget.value;
      $("#o_resultatChasse tr:gt(0):lt(-1):visible").toggle();
      $(
        "#o_resultatChasse tr:eq(" +
          (selection * 4 + 1) +
          "), #o_resultatChasse tr:eq(" +
          (selection * 4 + 2) +
          "), #o_resultatChasse tr:eq(" +
          (selection * 4 + 3) +
          "), #o_resultatChasse tr:eq(" +
          (selection * 4 + 4) +
          ")",
      ).toggle();
    });
  }
  /**
   * "Simuler" tab — the hunt simulator of the launcher (Ressources.php), fed
   * with whatever army, levels and terrain the player types in. Calystene's
   * simulator 2.00.38, see models/HuntSimulation.ts.
   *
   * @private
   * @method simulate
   */
  simulate() {
    let level = (id, label, value) =>
        `<tr><td><input id="${id}" value="${value}" size="6"/></td><td class="left">${label}</td></tr>`,
      units = UNIT_NAMES.slice(1)
        .map(
          (name, i) =>
            `<tr><td><input name="o_scUnite${i}" value="0" size="12"/></td><td class="left">${name}</td></tr>`,
        )
        .join(""),
      ratios = HUNT_RATIO.map(
        (r, i) =>
          `<option value="${r}" class="${this._ratioClass(r)}"${i == 9 ? " selected" : ""}>${r.toFixed(1)}</option>`,
      ).join("");
    $("#o_tabsChasse3").append(`
        <table id="o_scForm" class="o_maxWidth">
          <tr><td valign="top">
            <table id="o_scArmee">
              <tr class="gras entete"><td><span id="o_scPlacement" class="cursor" title="Remplir avec votre armée, ou vider">${IMG_ARROW} Armée ${IMG_ARROW}</span> <span id="o_scCopier" class="cursor" title="Importer une armée">${IMG_COPY_ARMY}</span></td><td></td></tr>
              ${units}
              <tr><td id="o_scAttaque" class="right">0</td><td class="left">${IMG_ATT} Attaque avec Armes</td></tr>
            </table>
          </td><td valign="top">
            <table id="o_scNiveau">
              <tr class="gras entete"><td colspan="2" id="o_scNiveauJoueur" class="cursor" title="Vos niveaux, ou 0">${IMG_ARROW} Niveaux ${IMG_ARROW}</td></tr>
              ${level("o_scArmes", "Armes", getProfile().niveauRecherche[2])}
              ${level("o_scBouclier", "Bouclier thoracique", getProfile().niveauRecherche[1])}
              ${level("o_scVitesse", "Vitesse de chasse", getProfile().niveauRecherche[5])}
              <tr class="gras entete"><td colspan="2" class="cursor" id="o_scPonteJoueur" title="Ne sert qu'à convertir les pertes en temps de ponte">${IMG_ARROW} Ponte (facultatif) ${IMG_ARROW}</td></tr>
              ${level("o_scCouveuse", "Couveuse", getProfile().niveauConstruction[3])}
              ${level("o_scSolarium", "Solarium", getProfile().niveauConstruction[4])}
              ${level("o_scPonte", "Technique de ponte", getProfile().niveauRecherche[0])}
              <tr class="gras entete"><td colspan="2">Chasse</td></tr>
              <tr><td><input id="o_scTdcLancement" value="${Utils.terrain || 0}" size="14" title="Fixe la durée des chasses"/></td><td class="left">TdC au lancement</td></tr>
              <tr><td><input id="o_scTdcArrivee" value="${Utils.terrain || 0}" size="14" title="Fixe la difficulté des chasses : à modifier si votre TdC doit bouger pendant la chasse (flood…)"/></td><td class="left">TdC à l'arrivée</td></tr>
              <tr><td colspan="2"><select id="o_scRatio" class="o_maxWidth" title="Ratio = attaque de votre armée / difficulté de la chasse. Plus il est faible, plus la chasse est risquée.">${ratios}</select></td></tr>
              <tr><td><input id="o_scNombre" value="1" size="14"/></td><td class="left">Nombre de chasses <input id="o_scNombreAuto" type="checkbox" checked/><label for="o_scNombreAuto">Auto</label></td></tr>
              <tr><td><input id="o_scTdcChasse" value="1" size="14"/></td><td class="left">TdC par chasse <input id="o_scTdcChasseAuto" type="checkbox" checked/><label for="o_scTdcChasseAuto">Auto</label></td></tr>
              <tr><td><input id="o_scRetour" value="" size="14" placeholder="JJ-MM-AAAA HH:mm" title="Calcule le TdC par chasse pour rentrer à cette heure, en partant maintenant"/></td><td class="left">Retour souhaité <button type="button" id="o_scRetourAppliquer" disabled>Appliquer</button></td></tr>
              <tr><td colspan="2" id="o_scRetourInfo" class="left reduce"></td></tr>
            </table>
          </td></tr>
        </table>
        <div id="o_scResultat"></div>
        <p class="reduce"><em>Basé sur le simulateur de chasse de <a href="http://alliancead2.free.fr" target="_blank" rel="noopener">Calystene</a> (rév. 2.00.38).</em></p>`);
    $("#o_tabsChasse3").css({ "max-height": "70vh", "overflow-y": "auto" });
    $("#o_scArmee input, #o_scTdcLancement, #o_scTdcArrivee").spinner({
      min: 0,
      numberFormat: "i",
    });
    $("#o_scNombre, #o_scTdcChasse").spinner({ min: 1, numberFormat: "i", disabled: true });
    $("#o_scArmes, #o_scBouclier, #o_scVitesse, #o_scCouveuse, #o_scSolarium, #o_scPonte").spinner({
      min: 0,
      max: 50,
      numberFormat: "d2",
    });
    $("#o_scRetour").datetimepicker({
      ...DATEPICKER_OPTIONS,
      dateFormat: "dd-mm-yy",
      timeFormat: "HH:mm",
      timeText: "Horaire",
      hourText: "Heure",
      minuteText: "Minute",
      minDate: 0,
    });
    return this.simulatorEvents().refreshSimulation();
  }
  /**
   * Events of the "Simuler" tab.
   *
   * @private
   * @method simulatorEvents
   */
  simulatorEvents() {
    $("#o_scForm input.ui-spinner-input").on("input spin", (e, ui) => {
      let value = numeral(ui ? ui.value : e.currentTarget.value).value() || 0;
      $(e.currentTarget).spinner("value", value);
      this.refreshSimulation();
    });
    $("#o_scRatio").change(() => this.refreshSimulation());
    $("#o_scNombreAuto, #o_scTdcChasseAuto").click((e) => {
      let input = e.currentTarget.id == "o_scNombreAuto" ? "#o_scNombre" : "#o_scTdcChasse";
      $(input).spinner($(e.currentTarget).is(":checked") ? "disable" : "enable");
      this.refreshSimulation();
    });
    $("#o_scPlacement").click(() => {
      if (this._real) this._placeArmy();
      else this._loadRealState().then(() => this._placeArmy());
      return false;
    });
    $("#o_scRetour").on("change", () => this._refreshReturnDate());
    $("#o_scRetourAppliquer").click(() => {
      let amount = $("#o_scRetour").data("tdc");
      if (!amount) return false;
      $("#o_scTdcChasseAuto").prop("checked", false);
      $("#o_scTdcChasse").spinner("enable").spinner("value", amount);
      this.refreshSimulation();
      return false;
    });
    $("#o_scCopier").click(() => {
      openArmyImport((army) => this._setArmy(army.unite));
      return false;
    });
    // toggles between the player's levels and 0, like the battle simulator
    let toggle = (ids, values) => {
      let mine = ids.every((id, i) => $(id).spinner("value") == values[i]);
      ids.forEach((id, i) => $(id).spinner("value", mine ? 0 : values[i]));
      this.refreshSimulation();
      return false;
    };
    $("#o_scNiveauJoueur").click(() =>
      toggle(
        ["#o_scArmes", "#o_scBouclier", "#o_scVitesse"],
        [2, 1, 5].map((i) => getProfile().niveauRecherche[i]),
      ),
    );
    $("#o_scPonteJoueur").click(() =>
      toggle(
        ["#o_scCouveuse", "#o_scSolarium", "#o_scPonte"],
        [
          getProfile().niveauConstruction[3],
          getProfile().niveauConstruction[4],
          getProfile().niveauRecherche[0],
        ],
      ),
    );
    $("#o_scResultat").on("click", "#o_scAutresTdcToggle", () => {
      $("#o_scAutresTdc").toggle();
      let arrow = $("#o_scAutresTdc").is(":visible") ? "▲" : "▼";
      $("#o_scAutresTdcToggle").text(`${arrow} Pertes selon le TdC à l'arrivée ${arrow}`);
    });
    $("#o_scResultat").on("click", "#o_scCopierDonnees", () => this._copySimulation());
    $("#o_scResultat").on("click", "#o_scLancer", () => this._launch());
    return this;
  }
  /**
   * Fills the army with the player's, or clears it when it already holds it.
   *
   * @private
   * @method _placeArmy
   */
  _placeArmy() {
    let current = $("#o_scArmee input")
      .map((i, elt) => $(elt).spinner("value"))
      .get();
    let army = this._real.army.unite,
      mine = army.every((n, i) => n == current[i]);
    this._setArmy(mine ? new Array(14).fill(0) : army);
  }
  /**
   * @private
   * @method _setArmy
   */
  _setArmy(units) {
    $("#o_scArmee input").each((i, elt) => {
      $(elt).spinner("value", units[i] || 0);
    });
    this.refreshSimulation();
  }
  /**
   * Text colour of a ratio, as in the launcher.
   *
   * @private
   * @method _ratioClass
   */
  _ratioClass(ratio) {
    return ratio <= 4 ? "black" : ratio <= 6 ? "red" : ratio <= 7.5 ? "orange" : "green";
  }
  /**
   * Reads the form, runs the simulator and renders the result.
   *
   * @private
   * @method refreshSimulation
   */
  refreshSimulation() {
    // a launch is running on the displayed split: leave it alone
    if (this._launching) return this;
    let val = (id) => $(id).spinner("value") || 0,
      units = $("#o_scArmee input")
        .map((i, elt) => $(elt).spinner("value") || 0)
        .get(),
      autoCount = $("#o_scNombreAuto").is(":checked"),
      autoAmount = $("#o_scTdcChasseAuto").is(":checked"),
      huntSpeed = val("#o_scVitesse"),
      input = {
        units: units,
        weapons: val("#o_scArmes"),
        shield: val("#o_scBouclier"),
        launchHF: val("#o_scTdcLancement"),
        endHF: val("#o_scTdcArrivee"),
        ratio: parseFloat(String($("#o_scRatio").val())),
        maxCount: huntSpeed + 1,
      };
    $("#o_scAttaque").text(numeral(Math.round(armyAttack(units, input.weapons))).format());
    this._refreshReturnDate();
    // what each ratio would give, in the options
    ratioPreviews(input).forEach((p, i) => {
      let r = HUNT_RATIO[i],
        text = `${r.toFixed(1)} → Rép. 10 % : ${Math.round(HUNT_RETALIATION[i] * 100)} %`;
      if (p)
        text += ` · Pertes moy. ${numeral(Math.round(p.losses.AVG)).format()} JSN · ${p.count} × ${numeral(p.amount).format()} cm²`;
      $(`#o_scRatio option:eq(${i})`).text(text);
    });
    if (!input.units.some((n) => n > 0) || !input.endHF) {
      this._simu = null;
      $("#o_scResultat").html(
        `<p class="o_marginT15"><em>Renseignez une armée et votre TdC pour lancer la simulation.</em></p>`,
      );
      return this;
    }
    let simu = simulateHunts({
      ...input,
      fixedCount: autoCount ? 0 : val("#o_scNombre"),
      fixedAmount: autoAmount ? 0 : val("#o_scTdcChasse"),
    });
    if (autoCount) $("#o_scNombre").spinner("value", simu.count);
    if (autoAmount) $("#o_scTdcChasse").spinner("value", simu.amount);
    // the list follows the reference ratio actually reached
    $("#o_scRatio")
      .val(String(HUNT_RATIO[simu.refIndex]))
      .css("color", this._ratioClass(HUNT_RATIO[simu.refIndex]));
    let duration = huntDuration(input.launchHF, simu.amount, huntSpeed),
      spawnLevel = val("#o_scCouveuse") + val("#o_scSolarium") + val("#o_scPonte");
    this._simu = { ...simu, input, huntSpeed, duration, spawnLevel };
    $("#o_scResultat").html(
      this._detailsHtml() +
        this._dispatchHtml() +
        this._otherHFHtml() +
        `<div class="o_marginT15"><button type="button" id="o_scLancer" class="o_button f_success" disabled>Lancer les chasses</button>
        <button type="button" id="o_scCopierDonnees" class="o_button">Copier le résumé</button></div>
        <p id="o_scLancerInfo" class="reduce"></p>`,
    );
    this._refreshLaunchState();
    $(
      "#o_scDetails tr:even, #o_scPertes tr:even, #o_scRepartition tr:even, #o_scAutresTdc tr:even",
    ).css("background-color", getProfile().parametre["couleur2"].valeur);
    return this;
  }
  /**
   * Fetches what the player really has: the army (Armee.php) and the free
   * hunt slots (Vitesse de chasse + 1, minus the hunts on Ressources.php).
   *
   * @private
   * @method _loadRealState
   * @return {Promise}
   */
  _loadRealState() {
    let army = new Army();
    return Promise.all([army.getArmy(), $.ajax({ url: location.origin + "/Ressources.php" })]).then(
      ([armyHtml, resourcesHtml]) => {
        army.loadData(armyHtml);
        let running =
          Utils.parseHtml(resourcesHtml)
            .find("#boite_tdc")
            .text()
            .split(/- Vos chasseuses vont conquérir/g).length - 1;
        this._real = { army, slots: getProfile().niveauRecherche[5] + 1 - running };
        this._refreshLaunchState();
      },
    );
  }
  /**
   * Terrain per hunt that brings the hunts back at the requested time when they
   * leave now (Calystene 2.00.33, same computation as the launcher's).
   *
   * @private
   * @method _refreshReturnDate
   */
  _refreshReturnDate() {
    let raw = String($("#o_scRetour").val() || ""),
      factor = Math.pow(0.9, $("#o_scVitesse").spinner("value") || 0),
      launchHF = $("#o_scTdcLancement").spinner("value") || 0,
      show = (html, amount = 0) => {
        $("#o_scRetour").data("tdc", amount);
        $("#o_scRetourInfo").html(html);
        $("#o_scRetourAppliquer").prop("disabled", !amount);
      };
    if (!raw) return show("");
    let target = moment(raw, "DD-MM-YYYY HH:mm");
    if (!target.isValid()) return show("<span class='red'>Date non valide.</span>");
    // even a 1 cm² hunt lasts as long as the launch terrain
    let earliest = moment().add(Math.ceil((launchHF + 1) * factor), "s"),
      amount = Math.floor(target.diff(moment(), "s") / factor - launchHF);
    if (amount < 1)
      return show(
        `<span class='red'>Pas de retour possible avant le ${earliest.format("DD/MM [à] HH[h]mm")}.</span>`,
      );
    show(`→ TdC par chasse : <span class='gras'>${numeral(amount).format()} cm²</span>`, amount);
  }
  /**
   * What stops the displayed simulation from being launched as it is: the army
   * and levels typed in must be the player's, and the hunts must fit in the
   * free slots. The terrain on arrival stays free (planning a flood).
   *
   * @private
   * @method _launchBlockers
   * @return {Array} reasons, empty when the launch is possible
   */
  _launchBlockers() {
    let s = this._simu,
      r = this._real,
      fmt = (n) => numeral(n).format(),
      reasons = [];
    if (!r) return ["Chargement de votre armée…"];
    s.input.units.forEach((n, u) => {
      if (n > r.army.unite[u])
        reasons.push(
          `${UNIT_NAMES_PLURAL[u + 1]} : ${fmt(n)} saisies, vous en avez ${fmt(r.army.unite[u])}.`,
        );
    });
    [
      ["Armes", s.input.weapons, getProfile().niveauRecherche[2]],
      ["Bouclier thoracique", s.input.shield, getProfile().niveauRecherche[1]],
      ["Vitesse de chasse", s.huntSpeed, getProfile().niveauRecherche[5]],
    ].forEach(([name, typed, mine]) => {
      if (typed != mine) reasons.push(`${name} : niveau ${typed} saisi, le vôtre est ${mine}.`);
    });
    if (s.input.launchHF != Utils.terrain)
      reasons.push(
        `TdC au lancement : ${fmt(s.input.launchHF)} saisi, votre terrain est de ${fmt(Utils.terrain)}.`,
      );
    if (r.slots <= 0) reasons.push("Aucune chasse possible : toutes vos places sont prises.");
    else if (s.count > r.slots)
      reasons.push(
        `Il ne vous reste que ${r.slots} chasse${r.slots > 1 ? "s" : ""} possible${r.slots > 1 ? "s" : ""}.`,
      );
    return reasons;
  }
  /**
   * Enables the launch button, or lists what prevents it.
   *
   * @private
   * @method _refreshLaunchState
   */
  _refreshLaunchState() {
    if (!this._simu || this._launching) return;
    let reasons = this._launchBlockers();
    $("#o_scLancer").prop("disabled", reasons.length > 0);
    $("#o_scLancerInfo").html(
      reasons.length
        ? `<span class="red">${reasons.join("<br/>")}</span>`
        : "<em>Une chasse part toutes les 2 secondes : restez sur la page pendant le lancement.</em>",
    );
  }
  /**
   * Launches the displayed hunts, one every 2 seconds, and stops at the first
   * one the game refuses.
   *
   * @private
   * @method _launch
   */
  _launch() {
    let s = this._simu;
    if (!s || this._launching || this._launchBlockers().length) return;
    if (
      !confirm(
        `Lancer ${s.count} chasse${s.count > 1 ? "s" : ""} de ${numeral(s.amount).format()} cm² ?`,
      )
    )
      return;
    this._launching = true;
    $("#o_scLancer").prop("disabled", true);
    $("#o_scForm").css({ opacity: 0.6, "pointer-events": "none" });
    $("#o_scLancerInfo").html("<em>Lancement en cours, restez sur la page…</em>");
    $.ajax({ url: location.origin + "/AcquerirTerrain.php" }).then(
      (data) => {
        // id="t" is both the main table and the token input: target the input
        let token = Utils.parseHtml(data).find("input[name='t']");
        this._sendHunt(s, 0, token.attr("name") + "=" + token.attr("value"));
      },
      () => this._launchDone(0, s.count),
    );
  }
  /**
   * @private
   * @method _sendHunt
   */
  _sendHunt(s, i, securite) {
    if (i >= s.count) return this._launchDone(i, s.count);
    let mark = (ok) => {
      $(`#o_scRepartition tbody tr:eq(${i})`)
        .addClass(ok ? "green" : "red")
        .find("td:first")
        .text(`${ok ? "✓" : "✗"} ${i + 1}`);
      if (ok) setTimeout(() => this._sendHunt(s, i + 1, securite), 2000);
      else this._launchDone(i, s.count);
    };
    $.post(
      location.origin + "/AcquerirTerrain.php",
      Army.huntPayload(s.amount, s.hunts[i].units, securite),
    ).then(
      (data) => mark(data.indexOf("La chasse est lancée.") > -1),
      () => mark(false),
    );
  }
  /**
   * End of a launch: report, then refresh what the player has, since the army
   * left. On Ressources.php the page itself is reloaded to show the hunts.
   *
   * @private
   * @method _launchDone
   */
  _launchDone(sent, count) {
    if (sent == count)
      $.toast({
        ...TOAST_SUCCESS,
        text: `${count} chasse${count > 1 ? "s lancées" : " lancée"}.`,
      });
    else
      $.toast({
        ...TOAST_ERROR,
        text: `${sent} chasse${sent > 1 ? "s lancées" : " lancée"} sur ${count} : le jeu a refusé la suivante.`,
      });
    if (location.pathname == "/Ressources.php") return location.reload();
    this._launching = false;
    $("#o_scForm").css({ opacity: "", "pointer-events": "" });
    this._loadRealState();
  }
  /**
   * Summary and loss estimates of the last simulation.
   *
   * @private
   * @method _detailsHtml
   */
  _detailsHtml() {
    let s = this._simu,
      total = s.count * s.amount,
      ret = Utils.roundMinute(s.duration).format("dddd D MMM YYYY [à] HH[h]mm"),
      lossRow = (label, f) =>
        `<tr><td class="left">${label}</td>${["MIN", "AVG", "MAX"].map((k) => `<td class="right${k == "AVG" ? " gras" : ""}">${f(s.losses[k])}</td>`).join("")}</tr>`,
      spawnTime = (losses) => Math.round(losses * UNIT_TIME[1] * Math.pow(0.9, s.spawnLevel));
    return `
        <hr class="o_scSepar"/>
        <table id="o_scDetails" class="o_maxWidth o_marginT15" cellspacing="0">
          <tr><td class="left">TdC total chassé</td><td class="right green">${numeral(total).format()} cm²</td><td class="left">Découpage</td><td class="right">${s.count} × ${numeral(s.amount).format()} cm²</td></tr>
          <tr><td class="left">Durée</td><td class="right">${Utils.intToTime(s.duration)}</td><td class="left">Retour</td><td class="right">${ret.charAt(0).toUpperCase() + ret.slice(1)}</td></tr>
          <tr><td class="left">Rentabilité</td><td class="right">${numeral(Math.round((total / s.duration) * 86400)).format()} cm² / jour</td><td class="left">Nourriture récoltée</td><td class="right">${numeral(Math.round(s.difficulty * 0.8)).format()}</td></tr>
          <tr><td class="left">Ratio réel</td><td class="right">${numeral(s.ratio).format("0.00")}</td><td class="left" title="Le ratio de la liste juste en dessous du ratio réel : c'est lui qui sert aux estimations de pertes">Ratio de référence</td><td class="right ${this._ratioClass(HUNT_RATIO[s.refIndex])}">${HUNT_RATIO[s.refIndex].toFixed(1)}</td></tr>
          <tr><td class="left">Difficulté</td><td class="right">${numeral(Math.round(s.difficulty)).format()}</td><td class="left">Réplique à 10 %</td><td class="right">${Math.round(HUNT_RETALIATION[s.refIndex] * 100)} %</td></tr>
        </table>
        <div class="centre gras o_marginT15">Estimation des pertes</div>
        <table id="o_scPertes" class="o_maxWidth" cellspacing="0">
          <thead><tr><th></th><th class="right">Min</th><th class="right">Moyenne</th><th class="right">Max</th></tr></thead>
          <tbody>
            ${lossRow("JSN tuées", (l) => numeral(Math.round(l)).format())}
            ${lossRow("Temps de ponte", (l) => Utils.intToTime(spawnTime(l)))}
            ${lossRow("Part de la durée de chasse", (l) => numeral((spawnTime(l) / s.duration) * 100).format("0.00") + " %")}
            <tr class="reduce"><td colspan="4"><em>Pertes en JSN, Bouclier compris, tirées de milliers de chasses du simulateur Compte+.</em></td></tr>
          </tbody>
        </table>`;
  }
  /**
   * Per-hunt unit split of the last simulation.
   *
   * @private
   * @method _dispatchHtml
   */
  _dispatchHtml() {
    let s = this._simu,
      used = s.input.units.map((n) => n > 0),
      sum = (f) => s.hunts.reduce((acc, h) => acc + f(h), 0),
      fmt = (n) => numeral(Math.round(n)).format(),
      head = UNIT_SHORT_NAMES.slice(1)
        .map((name, u) => (used[u] ? `<th class="right">${name}</th>` : ""))
        .join(""),
      rows = s.hunts
        .map(
          (h, i) =>
            `<tr><td>${i + 1}</td>${h.units.map((n, u) => (used[u] ? `<td class="right">${n ? fmt(n) : ""}</td>` : "")).join("")}<td class="right">${fmt(h.losses.AVG)}</td><td class="right">${fmt(h.losses.MAX)}</td><td class="right">${fmt(h.difficulty)}</td><td class="right">${fmt(h.att)}</td><td class="right">${numeral(h.ratio).format("0.00")}</td></tr>`,
        )
        .join(""),
      totalAtt = sum((h) => h.att);
    return `
        <div class="centre gras o_marginT15">Répartition des unités</div>
        <div class="o_scDefile">
        <table id="o_scRepartition" class="o_maxWidth" cellspacing="0">
          <thead><tr><th>N°</th>${head}<th class="right">Pertes moy.</th><th class="right">Pertes max</th><th class="right">Difficulté</th><th class="right">Attaque</th><th class="right">Ratio</th></tr></thead>
          <tbody>${rows}
            <tr class="gras"><td>Total</td>${used.map((u, i) => (u ? `<td class="right">${fmt(sum((h) => h.units[i]))}</td>` : "")).join("")}<td class="right">${fmt(s.losses.AVG)}</td><td class="right">${fmt(s.losses.MAX)}</td><td class="right">${fmt(s.difficulty)}</td><td class="right">${fmt(totalAtt)}</td><td class="right">${numeral(totalAtt / s.difficulty).format("0.00")}</td></tr>
          </tbody>
        </table>
        </div>`;
  }
  /**
   * Losses of the last simulation if the terrain differs from the planned one
   * when the hunts arrive.
   *
   * @private
   * @method _otherHFHtml
   */
  _otherHFHtml() {
    let s = this._simu,
      fmt = (n) => numeral(Math.round(n)).format(),
      rows = [s.input.endHF, ...OTHER_HF]
        .map((hf, i) => {
          let p = otherHFLosses(
              s.armyAtt,
              s.input.endHF,
              hf,
              s.amount,
              s.count,
              s.refIndex,
              s.input.shield,
            ),
            v = s.losses.AVG > 0 ? ((p.AVG - s.losses.AVG) / s.losses.AVG) * 100 : 0,
            cls = v > 0.5 ? "red" : v < -0.5 ? "green" : "";
          return `<tr${i ? "" : ' class="gras"'}><td class="left">${fmt(hf)} cm²${i ? "" : ' <span class="small">(prévu)</span>'}</td><td class="right">${fmt(p.MIN)}</td><td class="right">${fmt(p.AVG)}</td><td class="right">${fmt(p.MAX)}</td><td class="right">${i ? `<span class="${cls}">${v >= 0 ? "+" : ""}${v.toFixed(1)} %</span>` : "—"}</td><td class="right">${numeral(p.ratio).format("0.00")}</td></tr>`;
        })
        .join("");
    return `
        <div class="o_marginT15"><a id="o_scAutresTdcToggle" class="cursor souligne">▼ Pertes selon le TdC à l'arrivée ▼</a></div>
        <table id="o_scAutresTdc" class="o_maxWidth o_marginT15" cellspacing="0" style="display:none">
          <thead><tr><th class="left">TdC à l'arrivée</th><th class="right">Pertes min</th><th class="right">Pertes moy.</th><th class="right">Pertes max</th><th class="right">Variation moy.</th><th class="right">Ratio</th></tr></thead>
          <tbody>${rows}
            <tr class="reduce"><td colspan="6"><em>Les armées restent celles de la répartition : ce sont les premières chasses qui souffrent le plus d'une hausse du TdC.</em></td></tr>
          </tbody>
        </table>`;
  }
  /**
   * Copies a text summary of the last simulation (BBCode bold for the
   * forum), like the copy button of Calystene's 2.00.38.
   *
   * @private
   * @method _copySimulation
   */
  _copySimulation() {
    let s = this._simu;
    if (!s) return;
    let fmt = (n) => numeral(Math.round(n)).format(),
      ret = Utils.roundMinute(s.duration).format("dddd D MMM YYYY [à] HH[h]mm"),
      text =
        `TdC total chassé : ${fmt(s.count * s.amount)} cm² (${s.count} × ${fmt(s.amount)} cm²)\n` +
        `Durée : ${Utils.intToTime(s.duration)}, retour ${ret}\n` +
        `Rentabilité : ${fmt(((s.count * s.amount) / s.duration) * 86400)} cm² / jour\n\n` +
        `TdC au lancement : ${fmt(s.input.launchHF)} cm²\nTdC à l'arrivée : ${fmt(s.input.endHF)} cm²\n\n` +
        `Ratio réel : ${numeral(s.ratio).format("0.00")} (référence ${HUNT_RATIO[s.refIndex].toFixed(1)})\n` +
        `Difficulté : ${fmt(s.difficulty)}, nourriture récoltée : ${fmt(s.difficulty * 0.8)}\n\n` +
        `Estimation des pertes min / [b] moy [/b] / max : ${fmt(s.losses.MIN)} / [b] ${fmt(s.losses.AVG)} [/b] / ${fmt(s.losses.MAX)} JSN\n`,
      done = () => $.toast({ ...TOAST_SUCCESS, text: "Résumé copié." }),
      fallback = () => {
        // navigator.clipboard only exists on https pages, and most servers are http
        let area = $("<textarea/>")
          .val(text)
          .css({ position: "fixed", opacity: 0 })
          .appendTo("body");
        (area[0] as HTMLTextAreaElement).select();
        let ok = document.execCommand("copy");
        area.remove();
        ok ? done() : $.toast({ ...TOAST_ERROR, text: "La copie a échoué." });
      };
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, fallback);
    else fallback();
  }
  /**
   * "Bestiaire" tab — the 17 wildlife species with their image and stats.
   * Table source: http://alliancead2.free.fr/Bestiaire.html (the WILDLIFE
   * constant, images bundled in public/images/faune/).
   *
   * @private
   * @method bestiary
   */
  bestiary() {
    let rows = WILDLIFE.map(
      (f) =>
        `<tr><td><img src="${browser.runtime.getURL(("/images/faune/" + f.slug + ".png") as PublicPath)}" height="32" alt="${f.nom}"/></td><td class="left">${f.nom}</td><td class="right">${numeral(f.fdf).format()}</td><td class="right">${numeral(f.vie).format()}</td><td class="right">${numeral(f.diff).format()}</td></tr>`,
    ).join("");
    $("#o_tabsChasse2").append(`
        <table id="o_bestiaireTable" class="o_maxWidth centre" cellspacing="0">
            <thead><tr><th></th><th>Espèce</th><th class="right">FdF</th><th class="right">Vie</th><th class="right">Difficulté</th></tr></thead>
            <tbody>${rows}</tbody>
            <tfoot><tr><td colspan="5" class="reduce"><em>Stats issues du <a href="http://alliancead2.free.fr/Bestiaire.html" target="_blank">Bestiaire</a> de Calystène (2017).</em></td></tr></tfoot>
        </table>`);
    return this;
  }
}
