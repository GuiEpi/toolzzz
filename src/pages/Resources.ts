/*
 * Ressource.ts
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
import * as session from "~/storage/session";

/**
 * Classe de fonction pour la page /Ressource.php.
 *
 * @class PageRessource
 * @constructor
 * @extends Page
 */
export class ResourcesPage {
  // Champs déclarés pour TypeScript (Phase 2 : conversion telle quelle, le
  // typage fin est reporté — cf. .claude/plans/wxt-migration-followups.md).
  _comptePlusBox: any;
  _huntCount: any;
  _army: any;
  constructor(boxComptePlus) {
    /**
     * Accés à la boite compte+
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
     * Armée du joueur pour envoyer des chasses
     */
    this._army = new Army();
  }
  /**
   *
   */
  run() {
    this._army.getArmy().then((data) => {
      this._army.loadData(data);
      // Ajout du lanceur de chasse
      this.launcher();
    });
    // Sauvegarde les chasses en cours et ajoute les boutons max recolte
    if (!Utils.comptePlus) this.plus();
    // Affectation automatique des ouvrières (tous comptes)
    this.assignment();
    // Bouton "Annuler toutes les chasses" si au moins une est en cours
    this.cancelHuntsButton();
    return this;
  }
  /**
   * Ajoute un bouton "Annuler toutes les chasses" dans la boîte de chasse en cours.
   * Le serveur expose `Ressources.php?annuler=<chasseId>` pour annuler une chasse —
   * on itère sur tous les spans `chasse_<id>` présents dans `#boite_tdc`.
   *
   * @private
   * @method boutonAnnulerChasses
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
        .map((id) => $.get(`http://${Utils.serveur}.fourmizzz.fr/Ressources.php?annuler=${id}`));
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
   * Formulaire de lancement pour les chasses.
   *
   * @private
   * @method lanceur
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
    // Completion des valeurs
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
    // Lancement des chasses
    $("#o_chasseEnvoyer").click((e) => {
      if (this._army.getTotalUnits()) {
        let terrainHunt = $("#o_chasseTDCRep").spinner("value"),
          countHunt = $("#o_chasseNbr").spinner("value"),
          intervalle = $("#o_chasseInt").val() * 1000;
        $.ajax({
          url: "http://" + Utils.serveur + ".fourmizzz.fr/AcquerirTerrain.php",
        }).then((data) => {
          let parsed = Utils.parseHtml(data);
          // AcquerirTerrain.php a un id="t" sur la <table> principale ET sur l'<input> du token CSRF.
          // find("#t:last") matche aussi la table (qui n'a ni name ni value), donc on cible
          // explicitement l'input via [name='t'] pour récupérer le bon token.
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
   * Calcule les données de la chasse en fonction des valeurs souhaitées par le joueur.
   *
   * @private
   * @method preparerChasse
   */
  prepareHunt() {
    let huntingGroundDep = $("#o_chasseTDCDep").spinner("value"),
      diffHunt = $("#o_chasseDiff").val(),
      countHunt = $("#o_chasseNbr").spinner("value"),
      fixCount = countHunt && !$("#o_chasseNbrAuto").is(":checked") ? countHunt : 0,
      terrainHunt = $("#o_chasseTDCRep").spinner("value"),
      fixHF = terrainHunt && !$("#o_chasseTDCRepAuto").is(":checked") ? terrainHunt : 0;
    // Si une chasse peut être calculer
    if (huntingGroundDep) {
      let simu = this._army.simulateHunt(
        huntingGroundDep,
        countHunt,
        terrainHunt,
        diffHunt,
        fixCount,
        fixHF,
        this._huntCount,
      );
      this.updateSimulation(simu.repartition);
      this.updateSummary(
        simu.nbChasse,
        simu.terrainChasse,
        simu.ratio,
        simu.ratioRef,
        simu.iTabPerte,
      );
      // Sync la dropdown Difficulté sur le ratio réellement atteignable
      // (calculRefRatio peut renvoyer un ratio plus bas si l'armée ne peut
      // pas tenir celui sélectionné par l'utilisateur).
      let computed = parseFloat(simu.ratioRef).toString();
      if ($("#o_chasseDiff").val() !== computed) {
        $("#o_chasseDiff").val(computed);
        this._updateDiffColor();
      }
      this.updateHuntingGroundLosses();
    }
  }
  /**
   * Met à jour la couleur de la dropdown Difficulté selon le seuil de ratio.
   *
   * @private
   * @method _majCouleurDiff
   */
  _updateDiffColor() {
    let value = parseFloat($("#o_chasseDiff").val()),
      color = value <= 4 ? "black" : value <= 6 ? "red" : value <= 7.5 ? "orange" : "green";
    $("#o_chasseDiff").css("color", color);
  }
  /**
   * Calcule le terrain par chasse suggéré pour qu'une chasse parte maintenant et
   * revienne à la date saisie. Inverse de `temps = (Utils.terrain + tdc) × 0.9^niveau`
   * (ligne 286 de majRecapitulatif).
   *
   * @private
   * @method calculerTdcDate
   */
  computeHuntingGroundDate() {
    let raw = $("#o_chasseDateArrivee").val(),
      reset = (msg?) => {
        $("#o_chasseDateArrivee").removeData("tdc").removeData("tdcRaw");
        $("#o_chasseDateArriveeTdc").text(msg || "—");
        $("#o_chasseDateArriveeApply").prop("disabled", true);
      };
    if (!raw) return reset();
    // datetimepicker redéclenche `change` au blur avec la même valeur — sans ce
    // garde-fou le tdc dérive d'~1 unité à chaque firing (diff vs moment() avance)
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
   * Met à jour la table "Pertes selon TdC à l'arrivée" en réutilisant les paramètres
   * courants (nb chasses, terrain par chasse, difficulté) mais en faisant varier
   * uniquement le tdcDep sur les valeurs saisies par l'utilisateur. Affiche aussi
   * la variation moyenne par rapport au tdcDep courant.
   *
   * @private
   * @method mettreAjourPertesTdc
   */
  updateHuntingGroundLosses() {
    let count = $("#o_chasseNbr").spinner("value"),
      hf = $("#o_chasseTDCRep").spinner("value"),
      diff = parseFloat($("#o_chasseDiff").val()),
      huntingGroundCurrent = $("#o_chasseTDCDep").spinner("value"),
      ratioIdx = HUNT_RATIO.indexOf(diff);
    if (!count || !hf || ratioIdx < 0) return;
    let curDDiff = this._army.computeDifficulty(huntingGroundCurrent, count, hf),
      curLosses = this._army.computeLoss(ratioIdx, curDDiff);
    // Ligne 0 = référence (TdC courant, miroir live de #o_chasseTDCDep)
    $("#o_otherHfRefValue").text(numeral(huntingGroundCurrent).format());
    $(".o_otherHfMin[data-idx='0']").text(numeral(Math.round(curLosses.MIN)).format());
    $(".o_otherHfAvg[data-idx='0']").text(numeral(Math.round(curLosses.AVG)).format());
    $(".o_otherHfMax[data-idx='0']").text(numeral(Math.round(curLosses.MAX)).format());
    // Lignes 1..10 = alternatives, variation calculée vs ligne 0
    $(".o_otherHfInputAlt").each((_, el) => {
      let $el = $(el),
        i = $el.data("idx"),
        huntingGround = $el.spinner("value") || 0,
        dDiff = this._army.computeDifficulty(huntingGround, count, hf),
        p = this._army.computeLoss(ratioIdx, dDiff);
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
   * Affiche la répartition des unités pour les chasses.
   *
   * @private
   * @method majSimulation
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
   * Affiche le compte rendu de la simulation.
   *
   * @private
   * @method majRecapitulatif
   * @param {Integer} countHunt
   * @param {Integer} terrainHunt
   * @param {Float} ratio
   * @param {Float} ratioRef
   * @param {Array} iTabLoss
   */
  updateSummary(countHunt, terrainHunt, ratio, ratioRef, iTabLoss) {
    $("#o_chasseTotal").html(
      countHunt +
        " x " +
        numeral(terrainHunt).format() +
        " = <span class='green'>" +
        numeral(countHunt * terrainHunt).format() +
        "</span> cm²",
    );
    let time = Math.round(
      (Utils.terrain + terrainHunt) * Math.pow(0.9, getProfile().niveauRecherche[5]),
    );
    $("#o_chasseTemps").text(Utils.intToTime(time));
    let dateLong = Utils.roundMinute(time).format("dddd D MMM YYYY [à] HH[h]mm");
    $("#o_chasseRetour").text(dateLong.charAt(0).toUpperCase() + dateLong.slice(1));
    $("#o_chasseRentabilite").text(
      numeral(Math.round(((countHunt * terrainHunt) / time) * 86400)).format() + " cm² / jour",
    );
    $("#o_chasseRefDiff").text(ratio.toFixed(1) + " ~ " + ratioRef);
    $("#o_chassePerte").text(
      numeral(Math.round(iTabLoss["AVG"])).format() +
        " JSN (max : " +
        numeral(Math.round(iTabLoss["MAX"])).format() +
        ")",
    );
  }
  /**
   * Ajoute les boutons "max", sauvegarde la chasse en cours.
   *
   * @private
   * @method plus
   */
  plus() {
    // Ajout des boutons pour l'affectation max
    $("#RecolteNourriture").after(
      "<a title='Affecter un maximum d’ouvrière à la nourriture' class='button_max' onclick='javascript:maxNourriture();' href='#max'><img class='o_vAlign' width='23' height='23' src='images/bouton/fleche_haut.gif'/></a>",
    );
    $("#RecolteMateriaux").after(
      "<a title='Affecter un maximum d’ouvrière aux matériaux' class='button_max' onclick='javascript:maxMateriaux();' href='#max'><img class='o_vAlign' width='23' height='23' src='images/bouton/fleche_haut.gif'/></a>",
    );
    // Affichage du retour des chasses
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
    // Sauvegarde de la chasse en cours
    if (listHunt.length) this.saveHunts(listHunt);
  }
  /**
   * Choix du mode d'affectation automatique des ouvrières sur la page, et
   * application du mode enregistré. Pour tous les comptes : en C+ le jeu
   * propose nativement Matériaux / Nourriture, mais pas le ratio.
   *
   * @private
   * @method affectation
   */
  assignment() {
    let affection = parseInt(getProfile().parametre["affectationRessource"].valeur),
      ratio = parseInt(getProfile().parametre["ratioRecolte"].valeur),
      // la part en nourriture est saisissable au clavier, celle en matériaux
      // en découle ; les deux suivent le curseur
      labelRatio = (r) =>
        `<input id="o_ratioRecoltePart" class="o_sliderValeur" type="text" value="${r}"/> % <img alt="nourriture" src="images/icone/icone_pomme.png" height="14" class="o_vAlign"/> nourriture, <span id="o_ratioRecolteReste" class="gras">${100 - r} %</span> <img alt="matériaux" src="images/icone/icone_bois.png" height="13" class="o_vAlign"/> matériaux`,
      updateRatio = (r) => {
        $("#o_ratioRecoltePart").spinner("value", r);
        $("#o_ratioRecolteReste").text(`${100 - r} %`);
      };
    // Ajout de la pref pour l'affectation auto.
    // C+ : le jeu a déjà sa rangée « Affectation automatique des ouvrières »
    // (radios choixOuvriere, envoyées au serveur). On y ajoute un choix
    // « Ratio » dans le même groupe pour garder une seule sélection. Sa valeur
    // est « rien », comme la croix : le jeu enregistre « pas d'affectation
    // automatique » (sinon il replacerait les ouvrières libres d'un seul côté
    // entre deux visites) et Toolzzz garde le mode Ratio de son côté. Le
    // radio est reconnu par son id, pas par sa valeur.
    // Non-C+ : rangée Toolzzz complète, avec un nom de groupe qui lui est propre.
    let rowRatio = `<tr id="o_ratioRecolte" style="display:none;">
            <td><span class="text"><img src="images/icone/favicon.gif" height="16"> Répartition : <span id="o_ratioRecolteValeur">${labelRatio(ratio)}</span></span></td>
            <td><div id="o_ratioRecolteCurseur" class="slider" style="width:150px;margin:6px 0;"></div></td>
        </tr>`;
    if (Utils.comptePlus) {
      // état enregistré côté serveur, lu avant d'ajouter notre radio
      let nativeCoche = $("input[name=choixOuvriere]:checked").val();
      $("input[name=choixOuvriere][value=rien]")
        .closest("label")
        .before(
          `<label title="Répartir les ouvrières entre nourriture et matériaux selon une part fixe, refaite à chaque consultation de la page (Toolzzz)"><input type="radio" name="choixOuvriere" value="rien" id="o_ratioRadio"> Ratio</label> `,
        );
      // L'exclusion mutuelle des radios se fait par formulaire propriétaire, pas
      // par position dans le DOM : inséré dynamiquement, notre radio n'en a
      // aucun (le HTML du jeu ferme son <form> avant cette cellule) et forme
      // donc un groupe à part, où il reste coché en même temps qu'un choix
      // natif. On le rattache explicitement au formulaire des radios du jeu,
      // ce qui rétablit l'exclusion et l'envoi de sa valeur (« rien »).
      let formNative = $("input[name=choixOuvriere]").not("#o_ratioRadio")[0].form;
      if (formNative) {
        if (!formNative.id) formNative.id = "o_formRessource";
        $("#o_ratioRadio").attr("form", formNative.id);
      }
      // Le mode Ratio soumet toujours « rien » au jeu : si le serveur a
      // enregistré autre chose, c'est que l'affectation native a été choisie
      // depuis, on abandonne le ratio. Sans ce recalage, un ratio mémorisé
      // recocherait Ratio à chaque chargement et rendrait les autres choix
      // impossibles à conserver.
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
    // Le pas jQuery UI reste à 1 : avec un pas de 10, une valeur fine posée
    // depuis le champ serait arrondie. Le glissement à la souris est filtré
    // sur les multiples de 10 pour garder un curseur rapide ; le clavier sur
    // la poignée garde la précision.
    $("#o_ratioRecolteCurseur").slider({
      min: 0,
      max: 100,
      step: 1,
      value: ratio,
      slide: (e, ui) => {
        if (ui.value % 10 && !(e.originalEvent && e.originalEvent.type == "keydown")) return false;
        updateRatio(ui.value);
      },
      // seulement sur action de l'utilisateur : une valeur posée depuis le
      // champ est appliquée par le champ
      change: (e, ui) => {
        if (e.originalEvent) applyRatio(ui.value);
      },
    });
    // saisie au clavier : validée à la sortie du champ ou avec les flèches,
    // pas à chaque frappe (un « 5 » tapé avant « 0 » lancerait une affectation)
    $("#o_ratioRecoltePart").on("spinstop change", (e) => {
      let v = Math.min(100, Math.max(0, parseInt($(e.currentTarget).val()) || 0));
      $("#o_ratioRecolteCurseur").slider("value", v);
      applyRatio(v);
    });
    if (Utils.comptePlus)
      // sur "click" et non "change" : le jeu peut réagir au changement en
      // rechargeant la page, l'écriture du paramètre doit être faite avant.
      // On identifie notre radio par son id, sa valeur étant « rien » comme
      // celle de la croix native.
      $("input[name=choixOuvriere]").on("click", (e) => {
        let actif = e.currentTarget.id == "o_ratioRadio";
        // un choix natif (nourriture, matériaux, rien) désactive le ratio Toolzzz
        getProfile().parametre["affectationRessource"].valeur = actif ? 3 : 0;
        getProfile().parametre["affectationRessource"].save();
        $("#o_ratioRecolte").toggle(actif);
        // soumission même si la répartition est déjà bonne : le jeu doit
        // enregistrer « rien » pour son affectation automatique
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
        // le ratio se voit tout de suite, les autres modes agissent à la prochaine consultation
        if (getProfile().parametre["affectationRessource"].valeur == 3)
          this.assignWorkers(3, ratio);
        return false;
      });
    // Affectation des ouvriéres inutilisé si on a la pref
    if (affection) this.assignWorkers(affection, ratio);
  }
  /**
   * Affecte les ouvrières selon le mode choisi et soumet le formulaire du jeu
   * si quelque chose change. Matériaux / Nourriture complètent seulement les
   * ouvrières inutilisées ; Ratio impose la répartition.
   *
   * @private
   * @method affecterOuvrieres
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
      // si on ne couvre pas le terrain et qu'on a assez d'ouvrières
      if (mode == 1) nouveauMaterials = affectables - food;
      else if (mode == 2) nouvelleFood = affectables - materials;
    }
    if (nouveauMaterials == materials && nouvelleFood == food && !forcer) {
      session.remove(KEY_TENTATIVE);
      return;
    }
    // la soumission recharge la page : si le jeu n'a pas appliqué la valeur
    // demandée on ne retente pas, sinon la page rechargerait en boucle
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
   * Sauvegarde la chasse en cours.
   *
   * @private
   * @method saveChasse
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
