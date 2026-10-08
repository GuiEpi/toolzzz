/*
 * Resources.ts
 * Hraesvelg
 **********************************************************************/

import { $, moment, numeral } from "~/vendor";
import {
  DATEPICKER_OPTIONS,
  HUNT_RATIO,
  HUNT_RETALIATION,
  TOAST_ERROR,
  TOAST_WARNING,
} from "~/constants";
import { Utils } from "~/lib/Utils";
import { getProfile } from "~/models/currentPlayer";
import { Army } from "~/models/Army";
import { huntDuration, otherHFLosses } from "~/models/HuntSimulation";
import * as session from "~/storage/session";

/**
 * Enriches the /Ressources.php page.
 *
 * @class ResourcesPage
 * @constructor
 * @extends Page
 */
export class ResourcesPage {
  // Fields declared for TypeScript (Phase 2 was a straight conversion; real
  // typing is deferred — see .claude/plans/wxt-migration-followups.md).
  _comptePlusBox: any;
  _huntCount: any;
  _army: any;
  _simu: any;
  constructor(boxComptePlus) {
    /**
     * access to the ComptePlus box
     */
    this._comptePlusBox = boxComptePlus;
    /**
     * Nombre de chasse restante
     */
    this._huntCount =
      getProfile().niveauRecherche[5] +
      2 -
      $("#boite_tdc")
        .text()
        .split(/- Vos chasseuses vont conquérir/g).length;
    /**
     * the player's army, used to send hunts
     */
    this._army = new Army();
  }
  /**
   *
   */
  run() {
    this._army.getArmy().then((data) => {
      this._army.loadData(data);
      // add the hunt launcher
      this.launcher();
    });
    // save the running hunts and add the max-harvest buttons
    if (!Utils.comptePlus) this.plus();
    // automatic worker assignment (every account)
    this.assignment();
    // "Annuler toutes les chasses" button when at least one hunt is running
    this.cancelHuntsButton();
    return this;
  }
  /**
   * Adds an "Annuler toutes les chasses" button to the running-hunts box.
   * The server exposes `Ressources.php?annuler=<chasseId>` to cancel one hunt, so
   * this iterates over every `chasse_<id>` span found in `#boite_tdc`.
   *
   * @private
   * @method cancelHuntsButton
   */
  cancelHuntsButton() {
    let hunts = $("#boite_tdc span[id^='chasse_']");
    if (!hunts.length) return;
    $("#boite_tdc").append(
      `<div class="o_marginT15 centre"><button id="o_annulerChasses" class="o_button f_error" type="button">Annuler toutes les chasses (${hunts.length})</button></div>`,
    );
    $("#o_annulerChasses").click(() => {
      if (!confirm(`Annuler les ${hunts.length} chasse(s) en cours ? Action irréversible.`)) return;
      $("#o_annulerChasses").prop("disabled", true).text("Annulation…");
      let promesses = hunts
        .map((_, span) => $(span).attr("id").replace("chasse_", ""))
        .get()
        .map((id) => $.get(`${location.origin}/Ressources.php?annuler=${id}`));
      Promise.all(promesses).then(
        () => {
          location.reload();
        },
        () => {
          $.toast({
            ...TOAST_ERROR,
            text: "Au moins une annulation a échoué — rechargement quand même.",
          });
          setTimeout(() => location.reload(), 1500);
        },
      );
    });
  }
  /**
   * Hunt launch form.
   *
   * @private
   * @method launcher
   */
  launcher() {
    $("#boite_tdc")
      .after(`<br/><div id='o_prepaChasse' class='boite_amelioration simulateur centre'><h2>Lanceur de Chasses</h2>
            <table id='o_lanceurChasse' class='o_maxWidth o_marginT15' cellspacing=0>
			<tr class='ligne_paire'><td>Terrain à l'arrivée</td><td><input value='${Utils.terrain > 1000000 ? 1000000 : Utils.terrain}' size='21' id='o_chasseTDCDep'/></td><td></td></tr>
			<tr><td>Nombre de chasse</td><td><input value='0' size='21' id='o_chasseNbr'/></td><td><input id='o_chasseNbrAuto' type='checkbox' checked='checked' name='optionAuto'/><label for='o_chasseNbrAuto'>Auto</label></td></tr>
			<tr class='ligne_paire'><td>Terrain par chasse</td><td><input value='0' size='21' id='o_chasseTDCRep'/></td><td><input id='o_chasseTDCRepAuto' type='checkbox' checked='checked' name='optionAuto'/><label for='o_chasseTDCRepAuto'>Auto</label></td></tr>
			<tr><td>Difficulté</td><td><select id='o_chasseDiff' title='Ratio (Attaque de votre Armée) / (Difficulté de chasse) : détermine les pertes et taux de réplique de votre chasse...'><option value='1' class='black'>${HUNT_RATIO[0].toFixed(1)} → Rep10% : ${HUNT_RETALIATION[0] >= 0.2 ? (100 * HUNT_RETALIATION[0]).toFixed(2) + "%" : "< 20%"}</option><option value='2' class='black'>${HUNT_RATIO[1].toFixed(1)} → Rep10% : ${HUNT_RETALIATION[1] >= 0.2 ? (100 * HUNT_RETALIATION[1]).toFixed(2) + "%" : "< 20%"}</option><option value='3' class='black'>${HUNT_RATIO[2].toFixed(1)} → Rep10% : ${HUNT_RETALIATION[2] >= 0.2 ? (100 * HUNT_RETALIATION[2]).toFixed(2) + "%" : "< 20%"}</option><option value='4' class='black'>${HUNT_RATIO[3].toFixed(1)} → Rep10% : ${HUNT_RETALIATION[3] >= 0.2 ? (100 * HUNT_RETALIATION[3]).toFixed(2) + "%" : "< 20%"}</option><option value='5' class='red'>${HUNT_RATIO[4].toFixed(1)} → Rep10% : ${HUNT_RETALIATION[4] >= 0.2 ? (100 * HUNT_RETALIATION[4]).toFixed(2) + "%" : "< 20%"}</option><option value='6' class='red'>${HUNT_RATIO[5].toFixed(1)} → Rep10% : ${HUNT_RETALIATION[5] >= 0.2 ? (100 * HUNT_RETALIATION[5]).toFixed(2) + "%" : "< 20%"}</option><option value='6.5' class='orange'>${HUNT_RATIO[6].toFixed(1)} → Rep10% : ${HUNT_RETALIATION[6] >= 0.2 ? (100 * HUNT_RETALIATION[6]).toFixed(2) + "%" : "< 20%"}</option><option value='7' class='orange'>${HUNT_RATIO[7].toFixed(1)} → Rep10% : ${HUNT_RETALIATION[7] >= 0.2 ? (100 * HUNT_RETALIATION[7]).toFixed(2) + "%" : "< 20%"}</option><option value='7.5' class='orange'>${HUNT_RATIO[8].toFixed(1)} → Rep10% : ${HUNT_RETALIATION[8] >= 0.2 ? (100 * HUNT_RETALIATION[8]).toFixed(2) + "%" : "< 20%"}</option><option value='8' class='green'>${HUNT_RATIO[9].toFixed(1)} → Rep10% : ${HUNT_RETALIATION[9] >= 0.2 ? (100 * HUNT_RETALIATION[9]).toFixed(2) + "%" : "< 20%"}</option><option value='8.5' class='green'>${HUNT_RATIO[10].toFixed(1)} → Rep10% : ${HUNT_RETALIATION[10] >= 0.2 ? (100 * HUNT_RETALIATION[10]).toFixed(2) + "%" : "< 20%"}</option><option value='9' class='green' selected>${HUNT_RATIO[11].toFixed(1)} → Rep10% : ${HUNT_RETALIATION[11] >= 0.2 ? (100 * HUNT_RETALIATION[11]).toFixed(2) + "%" : "< 20%"}</option><option value='10' class='green'>${HUNT_RATIO[12].toFixed(1)} → Rep10% : ${HUNT_RETALIATION[12] >= 0.2 ? (100 * HUNT_RETALIATION[12]).toFixed(2) + "%" : "< 20%"}</option></select></td><td></td></tr>
			<tr class='ligne_paire'><td>Garder des JSN</td><td><input value='0' size='21' id='o_chasseJSN'/></td><td>max : ${numeral(this._army.nbrJSN).format()}</td></tr>
			<tr><td>Intervalle entre les chasses</td><td><select id='o_chasseInt' title='Intervalle entre les chasses'><option value='2' selected>2 secondes</option><option value='30'>30 secondes</option><option value='60'>1 minute</option><option value='120'>2 minutes</option></select></td><td></td></tr>
			<tr class='ligne_paire'><td>Date d'arrivée souhaitée</td><td><input value='' size='21' id='o_chasseDateArrivee' placeholder='JJ-MM-AAAA HH:mm'/></td><td>Terrain par chasse suggéré : <span id='o_chasseDateArriveeTdc' class='gras'>—</span> <button type='button' id='o_chasseDateArriveeApply' disabled>Appliquer</button></td></tr>
			<tr><td colspan='3'><em>Basé sur le lanceur de <a href='http://alliancead2.free.fr/Outils/Repository/HuntSimv2.00/Simulator_2.00.00.html' class='violet' target='_blank' rel='noopener'>Calystene</a></em></td></tr>
			</table>
            <br/><div id='o_simuChasse'><table id='o_simulationChasse' cellspacing=0 class='o_maxWidth'></table></div>
            <button class='o_button o_marginT15 f_success' type='button' id='o_chasseEnvoyer'>Envoyer</button>
            <p class='o_marginT0'><em class='small'>Veuillez rester sur cette page le temps du lancement !</em></p>
            <table id='o_recapChasse' cellspacing=0>
			<tr class='ligne_paire'><td colspan='3' class='gras'>Récapitulatif</td></tr>
			<tr><td>Chasse(s)</td><td>:</td><td id='o_chasseTotal'></td><td></td></tr>
			<tr class='ligne_paire'><td>Temps requis</td><td>:</td><td id='o_chasseTemps'></td></tr>
			<tr><td>Retour</td><td>:</td><td id='o_chasseRetour'></td></tr>
			<tr class='ligne_paire'><td>Rentabilité</td><td>:</td><td id='o_chasseRentabilite'></td></tr>
			<tr><td>Difficulté</td><td>:</td><td id='o_chasseRefDiff'></td></tr>
			<tr class='ligne_paire'><td>Perte estimé</td><td>:</td><td id='o_chassePerte'></td></tr>
			</table>
            <div class='o_marginT15'>
              <a id='o_chassePertesTdcToggle' class='cursor souligne'>▼ Pertes selon le niveau de TdC à l'arrivée ▼</a>
              <div id='o_chassePertesTdc' style='display:none' class='o_marginT15'>
                <table id='o_chassePertesTdcTable' class='o_maxWidth' cellspacing='0'>
                  <thead>
                    <tr class='gras ligne_paire'>
                      <td>TdC à l'arrivée</td>
                      <td class='right'>Pertes Min</td>
                      <td class='right'>Pertes Avg</td>
                      <td class='right'>Pertes Max</td>
                      <td class='right'>Variation moy.</td>
                    </tr>
                  </thead>
                  <tbody>
                    <tr class='gras'><td><span id='o_otherHfRefValue'>—</span> cm² <span class='small'>(Terrain à l'arrivée)</span></td><td class='right o_otherHfMin' data-idx='0'>—</td><td class='right o_otherHfAvg' data-idx='0'>—</td><td class='right o_otherHfMax' data-idx='0'>—</td><td class='right'>—</td></tr>
                    ${[
                      1000000, 5000000, 10000000, 15000000, 20000000, 30000000, 40000000, 50000000,
                      75000000, 100000000,
                    ]
                      .map((v, k) => {
                        let i = k + 1;
                        return `<tr ${i % 2 ? "class='ligne_paire'" : ""}><td><input class='o_otherHfInputAlt' data-idx='${i}' value='${v}' size='15'/> cm²</td><td class='right o_otherHfMin' data-idx='${i}'>—</td><td class='right o_otherHfAvg' data-idx='${i}'>—</td><td class='right o_otherHfMax' data-idx='${i}'>—</td><td class='right o_otherHfVar' data-idx='${i}'>—</td></tr>`;
                      })
                      .join("")}
                  </tbody>
                </table>
              </div>
            </div></div>`);
    $("#o_chasseTDCDep").spinner({ min: 0, numberFormat: "i" });
    $("#o_chasseJSN").spinner({
      min: 0,
      max: this._army.nbrJSN,
      numberFormat: "i",
    });
    $("#o_chasseTDCRep").spinner({
      min: 1,
      numberFormat: "i",
      disabled: true,
    });
    $("#o_chasseNbr").spinner({
      min: 1,
      max: this._huntCount,
      numberFormat: "i",
      disabled: true,
    });
    $("#o_chasseDiff, #o_chasseInt").outerWidth($("#o_chasseTDCDep").parent().width() + 4);
    $("#o_chasseDiff, #o_chasseInt").outerHeight($("#o_chasseTDCDep").parent().height());
    $("#o_chasseDiff").css("color", "green");
    $("#o_chasseDateArrivee").datetimepicker({
      ...DATEPICKER_OPTIONS,
      dateFormat: "dd-mm-yy",
      timeFormat: "HH:mm",
      timeText: "Horaire",
      hourText: "Heure",
      minuteText: "Minute",
      minDate: 0,
    });
    $(".o_otherHfInputAlt").spinner({ min: 0, numberFormat: "i" });
    // fill the values in
    this.prepareHunt();
    // Event
    $("#o_chasseTDCDep, #o_chasseNbr, #o_chasseTDCRep").on("input spin", (e, ui) => {
      let count = ui ? ui.value : $(e.currentTarget).spinner("value");
      $(e.currentTarget).spinner("value", count);
      this.prepareHunt();
    });
    $("#o_chasseNbrAuto").click((e) => {
      if (!$(e.currentTarget).is(":checked")) $("#o_chasseNbr").spinner("enable");
      else {
        $("#o_chasseNbr").spinner("disable");
        this.prepareHunt();
      }
    });
    $("#o_chasseTDCRepAuto").click((e) => {
      if (!$(e.currentTarget).is(":checked")) $("#o_chasseTDCRep").spinner("enable");
      else {
        $("#o_chasseTDCRep").spinner("disable");
        this.prepareHunt();
      }
    });
    $("#o_chasseDiff").change(() => {
      this._updateDiffColor();
      this.prepareHunt();
    });
    $("#o_chasseJSN").on("input spin", (e, ui) => {
      let count = ui ? ui.value : $(e.currentTarget).spinner("value");
      $(e.currentTarget).spinner("value", count);
      this._army.setJsn(count);
      this.prepareHunt();
    });
    $("#o_chasseDateArrivee").on("change", () => this.computeHuntingGroundDate());
    $("#o_chasseDateArriveeApply").click(() => {
      let huntingGround = $("#o_chasseDateArrivee").data("tdc");
      if (huntingGround == null) return;
      if ($("#o_chasseTDCRepAuto").is(":checked")) {
        $("#o_chasseTDCRepAuto").prop("checked", false);
        $("#o_chasseTDCRep").spinner("enable");
      }
      $("#o_chasseTDCRep").spinner("value", huntingGround);
      this.prepareHunt();
    });
    $("#o_chassePertesTdcToggle").click(() => {
      let $div = $("#o_chassePertesTdc");
      $div.toggle();
      let arrow = $div.is(":visible") ? "▲" : "▼";
      $("#o_chassePertesTdcToggle").text(
        `${arrow} Pertes selon le niveau de TdC à l'arrivée ${arrow}`,
      );
    });
    $(".o_otherHfInputAlt").on("input spin", () => this.updateHuntingGroundLosses());
    // launch the hunts
    $("#o_chasseEnvoyer").click((e) => {
      if (this._army.getTotalUnits()) {
        let terrainHunt = $("#o_chasseTDCRep").spinner("value"),
          countHunt = $("#o_chasseNbr").spinner("value"),
          intervalle = $("#o_chasseInt").val() * 1000;
        $.ajax({
          url: location.origin + "/AcquerirTerrain.php",
        }).then((data) => {
          let parsed = Utils.parseHtml(data);
          // AcquerirTerrain.php uses id="t" both on the main <table> and on the
          // CSRF token <input>. find("#t:last") also matches the table (which has
          // neither name nor value), so the input is targeted explicitly through
          // [name='t'] to read the right token.
          let tokenInput = parsed.find("input[name='t']");
          this._army.sendHunt(
            terrainHunt,
            countHunt,
            0,
            intervalle,
            tokenInput.attr("name") + "=" + tokenInput.attr("value"),
          );
        });
      } else
        $.toast({
          ...TOAST_ERROR,
          text: "Vous n'avez pas d'armée à envoyer.",
        });
      return false;
    });
    return this;
  }
  /**
   * Computes the hunt data from the values the player asked for.
   *
   * @private
   * @method prepareHunt
   */
  prepareHunt() {
    let endHF = $("#o_chasseTDCDep").spinner("value"),
      countHunt = $("#o_chasseNbr").spinner("value"),
      terrainHunt = $("#o_chasseTDCRep").spinner("value"),
      autoCount = $("#o_chasseNbrAuto").is(":checked"),
      autoAmount = $("#o_chasseTDCRepAuto").is(":checked");
    // a hunt can be computed
    if (endHF) {
      let simu = this._army.simulateHunt({
        launchHF: Utils.terrain,
        endHF: endHF,
        ratio: parseFloat($("#o_chasseDiff").val()),
        maxCount: this._huntCount,
        fixedCount: autoCount ? 0 : countHunt,
        fixedAmount: autoAmount ? 0 : terrainHunt,
      });
      if (autoCount) $("#o_chasseNbr").spinner("value", simu.count);
      if (autoAmount) $("#o_chasseTDCRep").spinner("value", simu.amount);
      this._simu = simu;
      this.updateSimulation(this._army.repartition);
      this.updateSummary(simu);
      // Sync the Difficulté dropdown with the reference ratio actually reached
      // (lower than the selected one when the army cannot sustain it, or when
      // the count and amount are set by hand).
      let computed = String(HUNT_RATIO[simu.refIndex]);
      if ($("#o_chasseDiff").val() !== computed) {
        $("#o_chasseDiff").val(computed);
        this._updateDiffColor();
      }
      this.updateHuntingGroundLosses();
    }
  }
  /**
   * Updates the Difficulté dropdown's colour from the ratio threshold.
   *
   * @private
   * @method _updateDiffColor
   */
  _updateDiffColor() {
    let value = parseFloat($("#o_chasseDiff").val()),
      color = value <= 4 ? "black" : value <= 6 ? "red" : value <= 7.5 ? "orange" : "green";
    $("#o_chasseDiff").css("color", color);
  }
  /**
   * Computes the suggested terrain per hunt so a hunt leaving now returns at the
   * date entered. The inverse of `time = (Utils.terrain + tdc) × 0.9^level`
   * (ligne 286 de majRecapitulatif).
   *
   * @private
   * @method computeHuntingGroundDate
   */
  computeHuntingGroundDate() {
    let raw = $("#o_chasseDateArrivee").val(),
      reset = (msg?) => {
        $("#o_chasseDateArrivee").removeData("tdc").removeData("tdcRaw");
        $("#o_chasseDateArriveeTdc").text(msg || "—");
        $("#o_chasseDateArriveeApply").prop("disabled", true);
      };
    if (!raw) return reset();
    // the datetimepicker fires `change` again on blur with the same value, and
    // without this guard the tdc drifts by about 1 unit each time (the diff
    // against moment() keeps moving)
    if ($("#o_chasseDateArrivee").data("tdcRaw") === raw) return;
    let target = moment(raw, "DD-MM-YYYY HH:mm");
    if (!target.isValid()) return reset();
    let secondsLeft = target.diff(moment(), "seconds");
    if (secondsLeft <= 0) return reset("date passée");
    let level = getProfile().niveauRecherche[5],
      huntingGround = Math.round(secondsLeft / Math.pow(0.9, level) - Utils.terrain);
    if (huntingGround <= 0) return reset("trop court");
    $("#o_chasseDateArrivee").data("tdc", huntingGround).data("tdcRaw", raw);
    $("#o_chasseDateArriveeTdc").text(numeral(huntingGround).format() + " cm²");
    $("#o_chasseDateArriveeApply").prop("disabled", false);
  }
  /**
   * Updates the "Pertes selon TdC à l'arrivée" table, reusing the current
   * parameters (hunt count, terrain per hunt, difficulty) and varying only
   * tdcDep over the values the player entered. It also shows the average change
   * relative to the current tdcDep.
   *
   * @private
   * @method updateHuntingGroundLosses
   */
  updateHuntingGroundLosses() {
    let simu = this._simu,
      huntingGroundCurrent = $("#o_chasseTDCDep").spinner("value");
    if (!simu) return;
    let lossesAt = (hf) =>
        otherHFLosses(
          simu.armyAtt,
          huntingGroundCurrent,
          hf,
          simu.amount,
          simu.count,
          simu.refIndex,
          getProfile().niveauRecherche[1],
        ),
      curLosses = simu.losses;
    // Row 0 is the reference (current TdC, mirroring #o_chasseTDCDep live)
    $("#o_otherHfRefValue").text(numeral(huntingGroundCurrent).format());
    $(".o_otherHfMin[data-idx='0']").text(numeral(Math.round(curLosses.MIN)).format());
    $(".o_otherHfAvg[data-idx='0']").text(numeral(Math.round(curLosses.AVG)).format());
    $(".o_otherHfMax[data-idx='0']").text(numeral(Math.round(curLosses.MAX)).format());
    // Rows 1..10 are alternatives, their change computed against row 0
    $(".o_otherHfInputAlt").each((_, el) => {
      let $el = $(el),
        i = $el.data("idx"),
        p = lossesAt($el.spinner("value") || 0);
      $(`.o_otherHfMin[data-idx='${i}']`).text(numeral(Math.round(p.MIN)).format());
      $(`.o_otherHfAvg[data-idx='${i}']`).text(numeral(Math.round(p.AVG)).format());
      $(`.o_otherHfMax[data-idx='${i}']`).text(numeral(Math.round(p.MAX)).format());
      let varAvg = curLosses.AVG > 0 ? ((p.AVG - curLosses.AVG) / curLosses.AVG) * 100 : 0,
        sign = varAvg >= 0 ? "+" : "",
        cls = varAvg > 0.5 ? "red" : varAvg < -0.5 ? "green" : "";
      $(`.o_otherHfVar[data-idx='${i}']`).html(
        `<span class='${cls}'>${sign}${varAvg.toFixed(1)} %</span>`,
      );
    });
  }
  /**
   * Renders how the units are spread across the hunts.
   *
   * @private
   * @method updateSimulation
   * @param {Array} distribution
   */
  updateSimulation(distribution) {
    let simulation = `<tr class='gras'><td>Chasse</td>
            ${this._army.unite[0] ? "<td>JSN</td>" : ""}
            ${this._army.unite[1] ? "<td>SN</td>" : ""}
            ${this._army.unite[2] ? "<td>NE</td>" : ""}
            ${this._army.unite[3] ? "<td>JS</td>" : ""}
            ${this._army.unite[4] ? "<td>S</td>" : ""}
            ${this._army.unite[5] ? "<td>C</td>" : ""}
            ${this._army.unite[6] ? "<td>CE</td>" : ""}
            ${this._army.unite[7] ? "<td>A</td>" : ""}
            ${this._army.unite[8] ? "<td>AE</td>" : ""}
            ${this._army.unite[9] ? "<td>SE</td>" : ""}
            ${this._army.unite[10] ? "<td>Tk</td>" : ""}
            ${this._army.unite[11] ? "<td>TkE</td>" : ""}
            ${this._army.unite[12] ? "<td>Tu</td>" : ""}
            ${this._army.unite[13] ? "<td>TuE</td>" : ""}
            </tr>`;
    for (let i = 0, l = distribution.length; i < l; i++) {
      simulation += `<tr><td>${i + 1}</td>`;
      for (
        let j = -1;
        ++j < 14;
        simulation += this._army.unite[j]
          ? "<td class='small' nowrap>" +
            (distribution[i][j] ? numeral(distribution[i][j]).format() : "") +
            "</td>"
          : ""
      );
      simulation += `</tr>`;
    }
    $("#o_simulationChasse").html(simulation);
    $("#o_simulationChasse tr:even").addClass("ligne_paire");
  }
  /**
   * Renders the simulation summary.
   *
   * @private
   * @method updateSummary
   * @param {Object} simu result of Army.simulateHunt
   */
  updateSummary(simu) {
    let countHunt = simu.count,
      terrainHunt = simu.amount;
    $("#o_chasseTotal").html(
      countHunt +
        " x " +
        numeral(terrainHunt).format() +
        " = <span class='green'>" +
        numeral(countHunt * terrainHunt).format() +
        "</span> cm²",
    );
    let time = huntDuration(Utils.terrain, terrainHunt, getProfile().niveauRecherche[5]);
    $("#o_chasseTemps").text(Utils.intToTime(time));
    let dateLong = Utils.roundMinute(time).format("dddd D MMM YYYY [à] HH[h]mm");
    $("#o_chasseRetour").text(dateLong.charAt(0).toUpperCase() + dateLong.slice(1));
    $("#o_chasseRentabilite").text(
      numeral(Math.round(((countHunt * terrainHunt) / time) * 86400)).format() + " cm² / jour",
    );
    $("#o_chasseRefDiff").text(
      numeral(simu.ratio).format("0.00") + " ~ " + HUNT_RATIO[simu.refIndex].toFixed(1),
    );
    $("#o_chassePerte").text(
      numeral(Math.round(simu.losses.AVG)).format() +
        " JSN (max : " +
        numeral(Math.round(simu.losses.MAX)).format() +
        ")",
    );
  }
  /**
   * Adds the "max" buttons and saves the running hunt.
   *
   * @private
   * @method plus
   */
  plus() {
    // add the max-assignment buttons
    $("#RecolteNourriture").after(
      "<a title='Affecter un maximum d’ouvrière à la nourriture' class='button_max' onclick='javascript:maxNourriture();' href='#max'><img class='o_vAlign' width='23' height='23' src='images/bouton/fleche_haut.gif'/></a>",
    );
    $("#RecolteMateriaux").after(
      "<a title='Affecter un maximum d’ouvrière aux matériaux' class='button_max' onclick='javascript:maxMateriaux();' href='#max'><img class='o_vAlign' width='23' height='23' src='images/bouton/fleche_haut.gif'/></a>",
    );
    // show when the hunts come back
    let listHunt = new Array();
    $("span[id^=chasse_]").each((i, elt) => {
      listHunt.push({
        quantite: numeral($(elt).parent().text().split("conquérir")[1].split("cm²")[0]).value(),
        exp: moment().add($(elt).parent().next().text().split("reste(")[1].split(",")[0], "s"),
      });
      $(elt)
        .parent()
        .next()
        .after(
          "<span class='small'> Retour le " +
            Utils.roundMinute($(elt).parent().next().text().split(",")[0].split("(")[1]).format(
              "D MMM YYYY à HH[h]mm",
            ) +
            "</span>",
        );
    });
    // save the running hunt
    if (listHunt.length) this.saveHunts(listHunt);
  }
  /**
   * Picks the automatic worker assignment mode on the page and applies the saved
   * one. For every account: on ComptePlus the game offers Matériaux / Nourriture
   * natively, but not the ratio.
   *
   * @private
   * @method assignment
   */
  assignment() {
    let affection = parseInt(getProfile().parametre["affectationRessource"].valeur),
      ratio = parseInt(getProfile().parametre["ratioRecolte"].valeur),
      // the food share can be typed in and the materials share follows from it;
      // both track the slider
      labelRatio = (r) =>
        `<input id="o_ratioRecoltePart" class="o_sliderValeur" type="text" value="${r}"/> % <img alt="nourriture" src="images/icone/icone_pomme.png" height="14" class="o_vAlign"/> nourriture, <span id="o_ratioRecolteReste" class="gras">${100 - r} %</span> <img alt="matériaux" src="images/icone/icone_bois.png" height="13" class="o_vAlign"/> matériaux`,
      updateRatio = (r) => {
        $("#o_ratioRecoltePart").spinner("value", r);
        $("#o_ratioRecolteReste").text(`${100 - r} %`);
      };
    // Add the preference for automatic assignment.
    // ComptePlus: the game already has its « Affectation automatique des
    // ouvrières » row (the choixOuvriere radios, sent to the server). A
    // « Ratio » choice is added to the same group so only one stays selected.
    // Its value is « rien », like the cross: the game records "no automatic
    // assignment" (otherwise it would move the free workers all to one side
    // between visits) while Toolzzz keeps Ratio mode on its side. The radio is
    // recognised by its id, not by its value.
    // Free accounts: a full Toolzzz row, with a group name of its own.
    let rowRatio = `<tr id="o_ratioRecolte" style="display:none;">
            <td><span class="text"><img src="images/icone/favicon.gif" height="16"> Répartition : <span id="o_ratioRecolteValeur">${labelRatio(ratio)}</span></span></td>
            <td><div id="o_ratioRecolteCurseur" class="slider" style="width:150px;margin:6px 0;"></div></td>
        </tr>`;
    if (Utils.comptePlus) {
      // the state saved server-side, read before our radio is added
      let nativeCoche = $("input[name=choixOuvriere]:checked").val();
      $("input[name=choixOuvriere][value=rien]")
        .closest("label")
        .before(
          `<label title="Répartir les ouvrières entre nourriture et matériaux selon une part fixe, refaite à chaque consultation de la page (Toolzzz)"><input type="radio" name="choixOuvriere" value="rien" id="o_ratioRadio"> Ratio</label> `,
        );
      // Radio buttons are mutually exclusive per owning form, not by position in
      // the DOM: inserted dynamically, our radio has no owner (the game's HTML
      // closes its <form> before this cell) and therefore forms a group of its
      // own, where it stays ticked alongside one of the game's choices. It is
      // attached explicitly to the form of the game's radios, which restores the
      // exclusivity and makes its value (« rien ») be submitted.
      let formNative = $("input[name=choixOuvriere]").not("#o_ratioRadio")[0].form;
      if (formNative) {
        if (!formNative.id) formNative.id = "o_formRessource";
        $("#o_ratioRadio").attr("form", formNative.id);
      }
      // Ratio mode always submits « rien » to the game, so if the server has
      // recorded anything else the native assignment was chosen since and the
      // ratio is dropped. Without this resync a saved ratio would re-tick Ratio
      // on every load and make the other choices impossible to keep.
      if (affection == 3 && nativeCoche && nativeCoche != "rien") {
        affection = 0;
        getProfile().parametre["affectationRessource"].valeur = 0;
        getProfile().parametre["affectationRessource"].save();
      }
      if (affection == 3) $("#o_ratioRadio").prop("checked", true);
      $("input[name=choixOuvriere]").closest("tr").after(rowRatio);
    } else
      $("#ChangeRessource").parent().parent().before(`<tr>
            <td><span class="text"><img src="images/icone/favicon.gif" height="16"> Affectation des ouvrières lors de la consultation de la page : </span></td>
            <td style="white-space:nowrap;"><label><input type="radio" name="o_choixOuvriere" value="nourriture" ${affection == 2 ? 'checked="checked"' : ""}><img alt="nourritures" src="images/icone/icone_pomme.png" height="18" title="Nourriture"></label>
            <label><input type="radio" name="o_choixOuvriere" value="materiaux" ${affection == 1 ? 'checked="checked"' : ""}> <img alt="materiaux" src="images/icone/icone_bois.png" height="17" title="Materiaux"></label>
            <label title="Répartir les ouvrières entre nourriture et matériaux selon une part fixe, conservée après une chasse ou un flood"><input type="radio" name="o_choixOuvriere" value="ratio" ${affection == 3 ? 'checked="checked"' : ""}> Ratio</label>
            <label><input type="radio" name="o_choixOuvriere" value="rien" ${affection == 0 ? 'checked="checked"' : ""}> <img alt="rien" src="http:images/croix.gif" height="23" title="Pas d'affectation automatique"></label>
        </td></tr>${rowRatio}`);
    $("#o_ratioRecolte").toggle(affection == 3);
    $("#o_ratioRecoltePart").spinner({ min: 0, max: 100, numberFormat: "i" });
    let applyRatio = (r) => {
      ratio = r;
      updateRatio(ratio);
      getProfile().parametre["ratioRecolte"].valeur = ratio;
      getProfile().parametre["ratioRecolte"].save();
      this.assignWorkers(3, ratio);
    };
    // The jQuery UI step stays at 1: with a step of 10, a precise value typed
    // into the field would be rounded. Mouse dragging is filtered to multiples
    // of 10 to keep the slider snappy, while the keyboard on the handle keeps
    // full precision.
    $("#o_ratioRecolteCurseur").slider({
      min: 0,
      max: 100,
      step: 1,
      value: ratio,
      slide: (e, ui) => {
        if (ui.value % 10 && !(e.originalEvent && e.originalEvent.type == "keydown")) return false;
        updateRatio(ui.value);
      },
      // only on user action: a value set from the field is applied by the field
      // itself
      change: (e, ui) => {
        if (e.originalEvent) applyRatio(ui.value);
      },
    });
    // typed input: applied when the field is left or with the arrows, not on
    // every keystroke (a « 5 » typed before « 0 » would trigger an assignment)
    $("#o_ratioRecoltePart").on("spinstop change", (e) => {
      let v = Math.min(100, Math.max(0, parseInt($(e.currentTarget).val()) || 0));
      $("#o_ratioRecolteCurseur").slider("value", v);
      applyRatio(v);
    });
    if (Utils.comptePlus)
      // on "click" rather than "change": the game may react to the change by
      // reloading the page, so the setting must be written first. Our radio is
      // identified by its id, since its value is « rien », like the game's own
      // cross.
      $("input[name=choixOuvriere]").on("click", (e) => {
        let actif = e.currentTarget.id == "o_ratioRadio";
        // one of the game's choices (food, materials, none) turns Toolzzz's ratio off
        getProfile().parametre["affectationRessource"].valeur = actif ? 3 : 0;
        getProfile().parametre["affectationRessource"].save();
        $("#o_ratioRecolte").toggle(actif);
        // submit even when the split is already right: the game has to record
        // « rien » for its own automatic assignment
        if (actif) this.assignWorkers(3, ratio, true);
      });
    else
      $("input[name=o_choixOuvriere]").change(() => {
        switch ($("input[name=o_choixOuvriere]:checked").val()) {
          case "nourriture":
            getProfile().parametre["affectationRessource"].valeur = 2;
            break;
          case "materiaux":
            getProfile().parametre["affectationRessource"].valeur = 1;
            break;
          case "ratio":
            getProfile().parametre["affectationRessource"].valeur = 3;
            break;
          default:
            getProfile().parametre["affectationRessource"].valeur = 0;
            break;
        }
        getProfile().parametre["affectationRessource"].save();
        $("#o_ratioRecolte").toggle(getProfile().parametre["affectationRessource"].valeur == 3);
        // the ratio shows immediately, the other modes act on the next visit
        if (getProfile().parametre["affectationRessource"].valeur == 3)
          this.assignWorkers(3, ratio);
        return false;
      });
    // assign the idle workers when the preference is set
    if (affection) this.assignWorkers(affection, ratio);
  }
  /**
   * Assigns the workers according to the chosen mode and submits the game's form
   * when something changes. Matériaux / Nourriture only top up the idle workers;
   * Ratio enforces the whole split.
   *
   * @private
   * @method assignWorkers
   * @param {Integer} mode 1 matériaux, 2 nourriture, 3 ratio
   * @param {Integer} ratio part en nourriture (%) pour le mode 3
   * @param {Boolean} forcer soumettre même si la répartition ne change pas
   */
  assignWorkers(mode, ratio, forcer = false) {
    const KEY_TENTATIVE = "outiiil_affectationTentee";
    let materials = numeral($("#RecolteMateriaux").val()).value(),
      food = numeral($("#RecolteNourriture").val()).value(),
      affectables = Math.min(Utils.ouvrieres, Utils.terrain),
      nouveauMaterials = materials,
      nouvelleFood = food;
    if (mode == 3) {
      nouvelleFood = Math.round((affectables * ratio) / 100);
      nouveauMaterials = affectables - nouvelleFood;
    } else if (materials + food < affectables) {
      // the terrain is not covered and there are enough workers
      if (mode == 1) nouveauMaterials = affectables - food;
      else if (mode == 2) nouvelleFood = affectables - materials;
    }
    if (nouveauMaterials == materials && nouvelleFood == food && !forcer) {
      session.remove(KEY_TENTATIVE);
      return;
    }
    // submitting reloads the page: if the game did not apply the requested value
    // there is no retry, otherwise the page would reload forever
    if (session.getRaw(KEY_TENTATIVE)) {
      session.remove(KEY_TENTATIVE);
      $.toast({
        ...TOAST_WARNING,
        text: "L'affectation automatique des ouvrières n'a pas été appliquée par le jeu.",
      });
      return;
    }
    session.setRaw(KEY_TENTATIVE, "1");
    $("#RecolteMateriaux").val(nouveauMaterials);
    $("#RecolteNourriture").val(nouvelleFood);
    $("#ChangeRessource").click();
  }
  /**
   * Saves the running hunt.
   *
   * @private
   * @method saveHunts
   */
  saveHunts(listHunt) {
    if (
      !this._comptePlusBox.hasOwnProperty("chasse") ||
      this._comptePlusBox.chasse.length != listHunt.length ||
      this._comptePlusBox.chasse[0]["quantite"] != listHunt[0]["quantite"] ||
      (listHunt[0]["exp"].diff(this._comptePlusBox.chasse[0]["exp"], "s") > 1 &&
        !Utils.comptePlus &&
        $("#boiteComptePlus").length)
    ) {
      this._comptePlusBox.chasse = listHunt;
      this._comptePlusBox.startChasse = moment();
      this._comptePlusBox.save().updateHunt();
    }
    return this;
  }
}
