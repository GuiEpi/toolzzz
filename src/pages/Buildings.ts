/*
 * Buildings.ts
 * Hraesvelg
 **********************************************************************/

import { $, Highcharts, moment, numeral } from "~/vendor";
import { Utils } from "~/lib/Utils";
import { getProfile } from "~/models/currentPlayer";
import {
  COSTS_BUILDINGS,
  COSTS_RESEARCHES,
  warehouseCapacity,
  materialsCost,
  workersCost,
  foodCost,
  mushroomProduction,
  buildingTime,
  researchTime,
} from "~/data/costs";

/**
 * Enriches the /construction.php page.
 *
 * @class BuildingsPage
 * @constructor
 */
export class BuildingsPage {
  // Fields declared for TypeScript (Phase 2 was a straight conversion; real
  // typing is deferred — see .claude/plans/wxt-migration-followups.md).
  _comptePlusBox: any;
  constructor(boxComptePlus) {
    /**
     * access to the ComptePlus box
     */
    this._comptePlusBox = boxComptePlus;
  }
  /**
   *
   */
  run() {
    // Preserve the scroll across the "Construire prereq invalide" redirects —
    // restored at the end of run(), once the DOM work is done.
    let scrollY = Utils.preserveScroll("o_constructionScroll");
    // check the levels
    let level = new Array(13);
    $(".ligneAmelioration").each((i, elt) => {
      level[i] = parseInt($(elt).find(".niveau_amelioration").text().split(" ")[1]);
    });
    if (level.join(",") != getProfile().niveauConstruction.join(",")) {
      getProfile().niveauConstruction = level;
      getProfile().save();
    }
    // show the payback
    if (!$(".desciption_amelioration:eq(11) table").find(".verificationOK").length)
      this.stableTitle();
    // save the building BEFORE the replacement (saveBuildings reads the strong)
    if (!Utils.comptePlus) this.plus();
    // ⚠️ Order matters: cancelConfirmation BEFORE upgradesTable — the first adds
    // the <a>Retour</a> right after "Je confirme", and the second moves it along
    // with the warning under the summary table. Otherwise, on ComptePlus, Retour
    // would be left behind at its injection point.
    Utils.cancelConfirmation("construction.php");
    Utils.upgradesTable("Construction", "Construction");
    // cost and time charts per level
    this.costs();
    // Restore the scroll AFTER all the DOM work, otherwise the upgrades table
    // and the costs widget shift the layout afterwards.
    if (scrollY !== null) requestAnimationFrame(() => window.scrollTo(0, scrollY));
    return this;
  }
  /**
   * Injects a widget charting cost and time per level for the game's 13
   * buildings and 10 researches, plus a trigger in the page header (styled with
   * the game's own `boutonDescription`). Clickable
   * via l'ancre `#cout`.
   *
   * @method costs
   */
  costs() {
    if ($("#o_couts").length) return this;
    let optionsBuilding = Object.entries(COSTS_BUILDINGS)
      .map(([id, c]) => `<option value='${id}'>${c.nom}</option>`)
      .join("");
    let optionsResearch = Object.entries(COSTS_RESEARCHES)
      .map(([id, r]) => `<option value='${id}'>${r.nom}</option>`)
      .join("");
    let archiLevel = getProfile().niveauRecherche[3] || 0;
    let saLevel = getProfile().niveauConstruction[6] || 0;
    // No <a id='cout'> anchor: the hash is kept for the toggle (a hashchange
    // listener) but the browser's scroll-to-anchor is avoided — pointless since
    // the game's simulation is hidden and the widget already sits alone at the
    // top of the viewport.
    $("#cadre, #centre").last().append(`
        <div id='o_couts' class='boite_amelioration simulateur centre' style='display:none;'>
          <h2>Coûts & temps de développement</h2>
          <p class='reduce'>Choisis un item dans chaque liste ; les courbes affichent le temps de construction/recherche, le coût en matériaux, en pommes et en ouvrières (selon la recherche), ainsi que la capacité ou production quand applicable. Les niveaux d'Architecture et de Salle d'analyse sont pré-remplis avec les tiens — modifie-les pour simuler un autre profil (-10%/niv de temps).</p>
          <table class='o_maxWidth o_marginT15' id='o_coutsControls'>
            <tr>
              <td><b>Construction</b></td>
              <td><select id='o_coutsConstru'>${optionsBuilding}</select></td>
              <td><b>Recherche</b></td>
              <td><select id='o_coutsRecherche'>${optionsResearch}</select></td>
            </tr>
            <tr>
              <td>Plage de niveaux</td>
              <td colspan='3'>
                <div id='o_coutsSlider' style='margin:8px 12px;'></div>
                <span id='o_coutsSliderLabel' class='reduce'>1 – 20</span>
              </td>
            </tr>
            <tr>
              <td>Architecture</td>
              <td><input type='text' id='o_coutsArchi' value='${archiLevel}' size='3'/></td>
              <td>Salle d'analyse</td>
              <td><input type='text' id='o_coutsSa' value='${saLevel}' size='3'/></td>
            </tr>
          </table>
          <div id='o_coutsChartConstru' style='height:380px;margin-top:15px;'></div>
          <div id='o_coutsChartRecherche' style='height:380px;margin-top:15px;'></div>
        </div>
      `);
    $("#o_coutsSlider").slider({
      range: true,
      min: 1,
      max: 50,
      values: [1, 20],
      slide: (event, ui) => {
        $("#o_coutsSliderLabel").text(`${ui.values[0]} – ${ui.values[1]}`);
        this._renderCostsCharts();
      },
    });
    $("#o_coutsArchi, #o_coutsSa").spinner({ min: 0, max: 45, numberFormat: "i" });
    $("#o_coutsConstru, #o_coutsRecherche").on("change", () => this._renderCostsCharts());
    $("#o_coutsArchi, #o_coutsSa").on("input spin", () => this._renderCostsCharts());
    // Toggles between the game's view and the widget from the hash: on #cout the
    // game's simulation (build queue, upgrade rows) is hidden to show only the
    // courbes. Sans hash, comportement habituel. hashchange permet de
    // switching without a page reload (from another menu entry).
    // Highcharts.render is only called once the widget becomes visible,
    // otherwise it measures zero dimensions.
    this._applyCostsHash();
    $(window).on("hashchange.couts", () => this._applyCostsHash());
    return this;
  }
  /**
   * @private
   * @method _applyCostsHash
   */
  _applyCostsHash() {
    // Hiding the game's simulation is handled in CSS (`.toolzzz-mode-couts`, put
    // on <html> by the bootstrap content script at document_start), so only our
    // widget has to be toggled from JS.
    let surCosts = location.hash === "#cout";
    if (surCosts) {
      $("#o_couts").show();
      this._renderCostsCharts();
    } else {
      $("#o_couts").hide();
    }
  }
  /**
   * (Re)draws both charts from the current selections. Costs grow
   * exponentially, hence a log right-hand Y axis, with a linear axis (formatted
   * as a duration) on the left for the time.
   *
   * @private
   * @method _renderCostsCharts
   */
  _renderCostsCharts() {
    let [niveauMin, niveauMax] = $("#o_coutsSlider").slider("values"),
      archi = parseInt($("#o_coutsArchi").spinner("value")) || 0,
      sa = parseInt($("#o_coutsSa").spinner("value")) || 0,
      buildingId = $("#o_coutsConstru").val(),
      buildingItem = COSTS_BUILDINGS[buildingId],
      labId = $("#o_coutsRecherche").val(),
      labItem = COSTS_RESEARCHES[labId];
    // Construction chart
    if (buildingItem) {
      let max = Math.min(niveauMax, buildingItem.max),
        levels = [],
        timeData = [],
        materialsData = [],
        extraData = [],
        extraName = buildingId === "cons5" ? "Production / jour" : "Capacité";
      for (let n = niveauMin; n <= max; n++) {
        levels.push(n);
        timeData.push(buildingTime(buildingItem, n, archi));
        materialsData.push(materialsCost(buildingItem, n));
        if (buildingId === "cons3" || buildingId === "cons4") {
          extraData.push(warehouseCapacity(n));
        } else if (buildingId === "cons5") {
          extraData.push(mushroomProduction(buildingItem, n));
        }
      }
      let series = [
        { name: "Temps", data: timeData, yAxis: 0, color: "#3498db" },
        { name: "Matériaux", data: materialsData, yAxis: 1, color: "#e67e22" },
      ];
      if (extraData.length) {
        series.push({ name: extraName, data: extraData, yAxis: 1, color: "#27ae60" });
      }
      this._renderCostsChart("o_coutsChartConstru", buildingItem.nom, levels, series);
    }
    // Recherche chart
    if (labItem) {
      let max = Math.min(niveauMax, labItem.max),
        levels = [],
        timeData = [],
        workersData = [],
        foodData = [],
        materialsData = [];
      for (let n = niveauMin; n <= max; n++) {
        levels.push(n);
        timeData.push(researchTime(labItem, n, sa));
        if (labItem.o) workersData.push(workersCost(labItem, n));
        foodData.push(foodCost(labItem, n));
        materialsData.push(materialsCost(labItem, n));
      }
      let series = [{ name: "Temps", data: timeData, yAxis: 0, color: "#3498db" }];
      if (workersData.length) {
        series.push({ name: "Ouvrières", data: workersData, yAxis: 1, color: "#9b59b6" });
      }
      series.push({ name: "Pommes", data: foodData, yAxis: 1, color: "#e74c3c" });
      series.push({ name: "Matériaux", data: materialsData, yAxis: 1, color: "#e67e22" });
      this._renderCostsChart("o_coutsChartRecherche", labItem.nom, levels, series);
    }
  }
  /**
   * @private
   * @method _renderCostsChart
   */
  _renderCostsChart(containerId, titre, levels, series) {
    Highcharts.chart(containerId, {
      chart: { backgroundColor: "transparent" },
      title: { text: titre },
      xAxis: { categories: levels, title: { text: "Niveau" } },
      yAxis: [
        {
          title: { text: "Temps", style: { color: "#3498db" } },
          labels: {
            formatter: function () {
              return this.value > 0 ? Utils.intToTime(this.value) : "0";
            },
            style: { color: "#3498db" },
          },
        },
        {
          title: { text: "Coût / Capacité", style: { color: "#e67e22" } },
          type: "logarithmic",
          opposite: true,
          labels: {
            formatter: function () {
              return numeral(this.value).format("0a");
            },
            style: { color: "#e67e22" },
          },
        },
      ],
      tooltip: {
        shared: true,
        formatter: function () {
          let html = `<b>Niveau ${this.x}</b><br/>`;
          this.points.forEach((p) => {
            let val = p.series.name === "Temps" ? Utils.intToTime(p.y) : numeral(p.y).format();
            html += `<span style="color:${p.series.color}">●</span> ${p.series.name} : <b>${val}</b><br/>`;
          });
          return html;
        },
      },
      plotOptions: {
        series: { marker: { enabled: levels.length <= 25 } },
      },
      series: series,
      credits: { enabled: false },
      legend: { itemStyle: { fontSize: "12px" } },
    });
  }
  /**
   * Adds a detailed title showing the payback of the aphid stable.
   *
   * @private
   * @method stableTitle
   */
  stableTitle() {
    let workersDispo = Utils.ouvrieres - Utils.terrain,
      loss = 80 * Math.pow(2, getProfile().niveauRecherche[4]);
    let title = `<table>
            <tr><td>Ouvrières</td><td class='right'>${numeral(Utils.ouvrieres).format()}</td></tr>
            <tr><td>Disponible</td><td class='right'>${numeral(workersDispo).format()}</td></tr>
            <tr><td>Capacité de livraison actuelle</td><td class='right'>${numeral(workersDispo * (10 + getProfile().niveauConstruction[11] / 2)).format()}</td></tr>
            <tr><td>Perte ouvrières pour niveau ${getProfile().niveauConstruction[11] + 1}</td><td class='right'>${numeral(loss).format()}</td></tr>
            <tr><td>Capacité de livraison niveau suivant</td><td class='right' style='padding-left:10px'>${numeral((workersDispo - loss) * (10 + (getProfile().niveauConstruction[11] + 1) / 2)).format()}</td></tr>
            <tr><td>Seuil rentabilité ouvrière</td><td class='right gras' style='padding-left:10px'>${numeral((21 + getProfile().niveauConstruction[11]) * 40 * Math.pow(2, getProfile().niveauConstruction[11] + 3)).format()}</td></tr>
            </table>`;
    $(".cout_amelioration:eq(11) table").prepend(
      "<tr class='centre'><td colspan='2' id='o_rentabiliteEtable' title=''>Rentabilité</td></tr>",
    );
    $("#o_rentabiliteEtable").tooltip({
      position: { my: "right+15 center", at: "left center" },
      content: title,
      tooltipClass: "ui-tooltip-brown ui-tooltip-lightBrown",
    });
    return this;
  }
  /**
   * Saves the running building.
   *
   * @private
   * @method plus
   */
  plus() {
    // The "Terminé le X" line is now rendered by `Utils.upgradesTable()` for
    // everyone (ComptePlus and free alike), so there is no need to duplicate it
    // here.
    // save the running building
    this.saveBuildings();
    // drop the running building when it is cancelled
    if ($("a:contains('Annuler')").length)
      $("a:contains('Annuler')").click((e) => {
        this._comptePlusBox.expConstruction = 0;
        this._comptePlusBox.construction = "";
        this._comptePlusBox.startConstruction = 0;
        this._comptePlusBox.save();
      });
    return this;
  }
  /**
   * Saves the running building.
   *
   * @private
   * @method saveBuildings
   */
  saveBuildings() {
    let str = $("#centre > strong").text();
    let building = str.substring(2, str.indexOf("se termine") - 1);
    if (
      building &&
      (!this._comptePlusBox.construction ||
        moment().diff(moment(this._comptePlusBox.expConstruction), "s") > 0) &&
      !Utils.comptePlus &&
      $("#boiteComptePlus").length
    ) {
      this._comptePlusBox.construction = building.substr(0, 1).toUpperCase() + building.substr(1);
      this._comptePlusBox.expConstruction = moment().add(
        parseInt(str.split(",")[0].split("(")[1]),
        "s",
      );
      this._comptePlusBox.startConstruction = moment();
      this._comptePlusBox.save().updateBuilding();
    }
    return this;
  }
}
