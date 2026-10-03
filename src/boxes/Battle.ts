/*
 * Battle.ts
 * Hraesvelg
 **********************************************************************/

import { $, moment, numeral } from "~/vendor";
import {
  UNIT_ATTACK,
  DATEPICKER_OPTIONS,
  IMG_ATT,
  IMG_COPY_ARMY,
  IMG_DEF,
  IMG_RIGHT,
  IMG_ARROW,
  IMG_LEFT,
  IMG_HP,
  PLACE,
  UNIT_NAMES,
  TOAST_ERROR,
  TOAST_SUCCESS,
  TOAST_WARNING,
  UNIT_HP,
} from "~/constants";
import { Utils } from "~/lib/Utils";
import { getProfile } from "~/models/currentPlayer";
import { Box } from "~/boxes/Box";
import { RadarBox } from "~/boxes/Radar";
import { Alliance } from "~/models/Alliance";
import { Army } from "~/models/Army";
import { Battle } from "~/models/Battle";
import { Player } from "~/models/Player";

/**
 * Analyses, simulates and launches attacks.
 *
 * @class BattleBox
 * @constructor
 * @extends Box
 */
export class BattleBox extends Box {
  // Fields declared for TypeScript (Phase 2 was a straight conversion; real
  // typing is deferred — see .claude/plans/wxt-migration-followups.md).
  _army: any;
  _mfTargets: any;
  _mfAttackerOpts: any;
  _mfTotalUnits: any;
  _mfArmy: any;
  _mfRadar: any;
  _mfResults: any;
  constructor() {
    super(
      "o_boiteCombat",
      "Outils d'Attaque",
      `<div id='o_tabsCombat' class='o_tabs'><ul><li><a href='#o_tabsCombat1'>Analyser</a></li><li><a href='#o_tabsCombat2'>Simuler</a></li><li><a href='#o_tabsCombat3'>Multi-flood</a></li><li><a href='#o_tabsCombat4'>Temps de trajet</a></li></ul><div id='o_tabsCombat1'/><div id='o_tabsCombat2'/><div id='o_tabsCombat3'/><div id='o_tabsCombat4'/></div>`,
    );
    /**
     *
     */
    this._army = null;
  }
  /**
   * Renders the box.
   *
   * @private
   * @method render
   */
  override render() {
    if (super.render()) {
      $("#o_tabsCombat")
        .tabs({
          activate: (e, ui) => {
            this.css();
          },
        })
        .removeClass("ui-widget");
      this.analyze().simulate().multiFlood().calculator().css().event();
    }
    return this;
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
      "#o_resultatCombat tr:even, .o_tabs .ui-widget-header .ui-tabs-anchor, #o_calculatriceCombat tr:even, .o_mfResultatCible tr:even, #o_calcSondeRecap tbody tr:even, #o_calcAttaque tbody tr:even, #o_calcAttaque thead tr",
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
    $(".o_content .ui-state-disabled a").css({
      cursor: "not-allowed",
      "pointer-events": "all",
    });
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
   * Form to analyse a battle report.
   *
   * @private
   * @method analyze
   */
  analyze() {
    $("#o_tabsCombat1")
      .css({ "max-height": "70vh", "overflow-y": "auto" })
      .append(
        "<textarea id='o_rcCombat' class='o_maxWidth' placeholder='Rapport de combat/sonde...'></textarea><div class='o_marginT15'><table id='o_resultatCombat' class='o_maxWidth'></table></div><div id='o_calcSonde' class='o_marginT15' style='display:none'></div>",
      );
    return this.analyzerEvents();
  }
  /**
   *
   */
  analyzerEvents() {
    // events Analyse
    $("#o_rcCombat").on("input", (e) => {
      let battle = new Battle({ RC: e.currentTarget.value });
      if (battle.analyze()) {
        $("#o_resultatCombat").html(battle.toBoxHtml());
        let probe = battle.analyzeProbe();
        if (probe) this.renderAttackCalc(probe);
        else $("#o_calcSonde").hide().empty();
        this.css();
      } else
        $.toast({
          ...TOAST_WARNING,
          text: "Le rapport de combat ne peut pas être analysé.",
        });
    });
    return this;
  }
  /**
   * Builds the "Calcul attaque à lancer" section under the analysed report.
   * Mirrors range B26-K54 of Calystene's XP v1.04 spreadsheet (sheet "Auto sur
   * sonde"): a multiplier / hit points / striking power / enemy weapons /
   * defense / retaliation summary, plus an interactive attack form with the
   * "Nb à ajouter pour FdF" column and the JSN retaliation check.
   *
   * @private
   * @method renderAttackCalc
   * @param {Object} probe résultat de Combat.analyseSonde()
   */
  renderAttackCalc(probe) {
    let weapons = getProfile().niveauRecherche[2],
      shield = getProfile().niveauRecherche[1],
      html = `<hr class='o_calcSepar'/>
            <div class='centre gras o_marginT15'>Analyse de la sonde</div>
            <table id='o_calcSondeRecap' class='o_maxWidth o_marginT15' cellspacing='0'>
              <tbody>
                <tr>
                  <td class='left'>Multiplicateur de vie ennemi</td>
                  <td class='right'>×${probe.multiplicateur.toFixed(4)}</td>
                  <td class='left'>Vie HB × 3</td>
                  <td class='right'>${numeral(probe.vieHBx3).format()}</td>
                </tr>
                <tr>
                  <td class='left small'>${probe.lieuTxt ? "(" + probe.lieuTxt + ")" : ""}</td>
                  <td></td>
                  <td class='left'>Vie AB (lieu de la sonde)</td>
                  <td class='right'>${numeral(Math.round(probe.vieAB)).format()}</td>
                </tr>
                <tr class='gras'>
                  <td></td>
                  <td></td>
                  <td class='left'>FdF AB nécessaire pour réplique 10%</td>
                  <td class='right'>${numeral(Math.round(probe.fdfNecessaire)).format()}</td>
                </tr>
                <tr>
                  <td class='left'>Armes de l'ennemi</td>
                  <td class='right'>${probe.armesEnnemi}</td>
                  <td class='left'>Défense AB</td>
                  <td class='right'>${numeral(probe.defenseAB).format()}</td>
                </tr>
                <tr>
                  <td></td>
                  <td></td>
                  <td class='left'>Réplique 10%</td>
                  <td class='right'>${numeral(Math.round(probe.repliqueDef10)).format()}</td>
                </tr>
              </tbody>
            </table>
            <div class='o_marginT15 centre gras'>Calcul attaque à lancer</div>
            <div class='centre o_marginT15'>
              Niveau Armes <input id='o_calcArmes' value='${weapons}' size='3'/>
              &nbsp;&nbsp;
              Niveau Bouclier <input id='o_calcBouclier' value='${shield}' size='3'/>
            </div>
            <table id='o_calcAttaque' class='o_maxWidth o_marginT15' cellspacing='0'>
              <thead>
                <tr>
                  <th class='left'>Type d'unité</th>
                  <th class='right'><span id='o_calcPlacementArmee' class='cursor'>${IMG_ARROW} Nb à envoyer ${IMG_ARROW}</span></th>
                  <th class='right'>Att AB</th>
                  <th class='right'>Nb à ajouter pour FdF</th>
                </tr>
              </thead>
              <tbody>`;
    for (let i = 1; i <= 14; i++)
      html += `<tr>
                <td class='left'>${UNIT_NAMES[i]}</td>
                <td class='right'><input class='o_calcUnite right' data-idx='${i}' value='0' size='10'/></td>
                <td class='right o_calcAtt' data-idx='${i}'>0</td>
                <td class='right o_calcAjout' data-idx='${i}'>—</td>
              </tr>`;
    html += `</tbody>
              <tfoot>
                <tr class='gras'>
                  <td class='left'>TOTAUX</td>
                  <td class='right' id='o_calcNbTotal'>0</td>
                  <td class='right' id='o_calcAttTotal'>0</td>
                  <td></td>
                </tr>
                <tr>
                  <td class='left' colspan='2'>FdF AB nécessaire (réplique 10%)</td>
                  <td class='right gras' id='o_calcFdfNec'>${numeral(Math.round(probe.fdfNecessaire)).format()}</td>
                  <td class='right' id='o_calcStatusAtt'>—</td>
                </tr>
                <tr>
                  <td class='left' colspan='2'>JSN nécessaires (réplique 10%)</td>
                  <td class='right gras' id='o_calcJsnNec'>0</td>
                  <td class='right' id='o_calcStatusJsn'>—</td>
                </tr>
                <tr><td colspan='4' class='reduce' style='padding-top:15px;'><em>Calculs basés sur le tableur <a href='http://alliancead2.free.fr/Outils/Repository/XP%20v1.04.xls' target='_blank' rel='noopener'>XP v1.04</a> de Calystène.</em></td></tr>
              </tfoot>
            </table>`;
    $("#o_calcSonde").html(html).data("sonde", probe).show();
    $("#o_calcArmes, #o_calcBouclier").spinner({
      min: 0,
      max: 50,
      numberFormat: "d",
    });
    $(".o_calcUnite").spinner({ min: 0, numberFormat: "i" });
    $("#o_calcSonde input").on("input spin", () => this.refreshAttackCalc());
    $("#o_calcPlacementArmee").click((e) => {
      if (this._army) this.placeArmyCalc();
      else {
        this._army = new Army();
        this._army.getArmy().then((data) => {
          this._army.loadData(data);
          this.placeArmyCalc();
        });
      }
      return false;
    });
    return this.refreshAttackCalc();
  }
  /**
   * Fills the calculator's "Nb à envoyer" inputs with the player's current army,
   * or clears them when they already match the loaded army (a toggle).
   *
   * @private
   * @method placeArmyCalc
   */
  placeArmyCalc() {
    let armyTmp = new Array();
    for (let i = 1; i <= 14; i++)
      armyTmp.push(numeral($(`.o_calcUnite[data-idx='${i}']`).val()).value() || 0);
    let allMatch = this._army.unite.every((elt, i) => {
      return elt === armyTmp[i];
    });
    for (let i = 1; i <= 14; i++)
      $(`.o_calcUnite[data-idx='${i}']`).spinner("value", allMatch ? 0 : this._army.unite[i - 1]);
    return this.refreshAttackCalc();
  }
  /**
   * Recomputes live the per-unit attack, the total attack, the "Nb à ajouter
   * pour FdF" column and the JSN needed to survive a 10% retaliation.
   *
   * @private
   * @method refreshAttackCalc
   */
  refreshAttackCalc() {
    let probe = $("#o_calcSonde").data("sonde");
    if (!probe) return this;
    let weapons = numeral($("#o_calcArmes").val()).value() || 0,
      shield = numeral($("#o_calcBouclier").val()).value() || 0,
      bonusAtt = 1 + weapons / 10,
      bonusHp = 1 + shield / 10,
      totalAtt = 0,
      totalCount = 0,
      qtyJsn = 0;
    for (let i = 1; i <= 14; i++) {
      let qty = numeral($(`.o_calcUnite[data-idx='${i}']`).val()).value() || 0,
        att = qty * UNIT_ATTACK[i] * bonusAtt;
      $(`.o_calcAtt[data-idx='${i}']`).text(numeral(Math.round(att)).format());
      totalAtt += att;
      totalCount += qty;
      if (i === 1) qtyJsn = qty;
    }
    $("#o_calcNbTotal").text(numeral(totalCount).format());
    $("#o_calcAttTotal").text(numeral(Math.round(totalAtt)).format());
    let manqueAtt = probe.fdfNecessaire - totalAtt;
    for (let i = 1; i <= 14; i++) {
      let cell = $(`.o_calcAjout[data-idx='${i}']`);
      if (manqueAtt <= 0) cell.html("<span class='green'>FdF suffisante</span>");
      else cell.text(numeral(Math.ceil(manqueAtt / (UNIT_ATTACK[i] * bonusAtt))).format());
    }
    $("#o_calcStatusAtt").html(
      manqueAtt <= 0 ? "<span class='green'>OK</span>" : "<span class='red'>Alerte !</span>",
    );
    let jsnNec = Math.ceil(probe.repliqueDef10 / (UNIT_HP[1] * bonusHp));
    $("#o_calcJsnNec").text(numeral(jsnNec).format());
    $("#o_calcStatusJsn").html(
      qtyJsn >= jsnNec ? "<span class='green'>OK</span>" : "<span class='red'>Alerte !</span>",
    );
    return this;
  }
  /**
   *
   */
  simulate() {
    let html = `<table id="o_simulateur">
            <tr><td valign="top">
                <table id="o_simulateurArmee">
                <tr style="display:none"><td id="o_switchAvantApres" colspan="5" class="centre">Avant combat / Après combat</td></td></tr>
                <tr class="gras"><td><span id="o_placementAtt" class="cursor">${IMG_ARROW} Attaquant ${IMG_ARROW}</span> <span id="o_copierAtt">${IMG_COPY_ARMY}</span></td><td colspan="3"><span id="o_switchArmee" class="cursor">${IMG_LEFT}  ${IMG_RIGHT}</span></td><td><span id="o_copierDef">${IMG_COPY_ARMY}</span> <span id="o_placementDef" class="cursor">${IMG_ARROW} Défenseur ${IMG_ARROW}</span></td>
                <tr><td><input value='0' size='12' name='o_unite1_1'/></td><td colspan="3">${UNIT_NAMES[1]}</td><td><input value='0' size='12' name='o_unite2_1'/></td></tr>
                <tr><td><input value='0' size='12' name='o_unite1_2'/></td><td colspan="3">${UNIT_NAMES[2]}</td><td><input value='0' size='12' name='o_unite2_2'/></td></tr>
                <tr><td><input value='0' size='12' name='o_unite1_3'/></td><td colspan="3">${UNIT_NAMES[3]}</td><td><input value='0' size='12' name='o_unite2_3'/></td></tr>
                <tr><td><input value='0' size='12' name='o_unite1_4'/></td><td colspan="3">${UNIT_NAMES[4]}</td><td><input value='0' size='12' name='o_unite2_4'/></td></tr>
                <tr><td><input value='0' size='12' name='o_unite1_5'/></td><td colspan="3">${UNIT_NAMES[5]}</td><td><input value='0' size='12' name='o_unite2_5'/></td></tr>
                <tr><td><input value='0' size='12' name='o_unite1_6'/></td><td colspan="3">${UNIT_NAMES[6]}</td><td><input value='0' size='12' name='o_unite2_6'/></td></tr>
                <tr><td><input value='0' size='12' name='o_unite1_7'/></td><td colspan="3">${UNIT_NAMES[7]}</td><td><input value='0' size='12' name='o_unite2_7'/></td></tr>
                <tr><td><input value='0' size='12' name='o_unite1_8'/></td><td colspan="3">${UNIT_NAMES[8]}</td><td><input value='0' size='12' name='o_unite2_8'/></td></tr>
                <tr><td><input value='0' size='12' name='o_unite1_9'/></td><td colspan="3">${UNIT_NAMES[9]}</td><td><input value='0' size='12' name='o_unite2_9'/></td></tr>
                <tr><td><input value='0' size='12' name='o_unite1_10'/></td><td colspan="3">${UNIT_NAMES[10]}</td><td><input value='0' size='12' name='o_unite2_10'/></td></tr>
                <tr><td><input value='0' size='12' name='o_unite1_11'/></td><td colspan="3">${UNIT_NAMES[11]}</td><td><input value='0' size='12' name='o_unite2_11'/></td></tr>
                <tr><td><input value='0' size='12' name='o_unite1_12'/></td><td colspan="3">${UNIT_NAMES[12]}</td><td><input value='0' size='12' name='o_unite2_12'/></td></tr>
                <tr><td><input value='0' size='12' name='o_unite1_13'/></td><td colspan="3">${UNIT_NAMES[13]}</td><td><input value='0' size='12' name='o_unite2_13'/></td></tr>
                <tr><td><input value='0' size='12' name='o_unite1_14'/></td><td colspan="3">${UNIT_NAMES[14]}</td><td><input value='0' size='12' name='o_unite2_14'/></td></tr>
                <tr><td id="o_vieAtt" class="right">0</td><td>${IMG_HP}</td><td>Vie</td><td>${IMG_HP}</td><td id="o_vieDef" class="right">0</td></tr>
                <tr><td id="o_degatAtt" class="right">0</td><td>${IMG_ATT}</td><td>Dégât</td><td>${IMG_DEF}</td><td id="o_degatDef" class="right">0</td></tr>
                </table>
            </td><td valign="top">
                <table id="o_simulateurNiveau">
                <tr class="gras entete"><td id="o_bonusAtt" class="cursor">${IMG_ARROW} Attaquant ${IMG_ARROW}</td><td colspan="2"></td><td id="o_bonusDef" class="cursor">${IMG_ARROW} Défenseur ${IMG_ARROW}</td>
                <tr><td><input id="o_bouclier1" value='${getProfile().niveauRecherche[1]}' size='6' name='o_bouclier1'/></td><td colspan="2">Bouclier</td><td><input id="o_bouclier2" value='${getProfile().niveauRecherche[1]}' size='6' name='o_bouclier2'/></td></tr>
                <tr><td><input id="o_armes1" value='${getProfile().niveauRecherche[2]}' size='6' name='o_armes1'/></td><td colspan="2">Armes</td><td><input id="o_armes2" value='${getProfile().niveauRecherche[2]}' size='6' name='o_armes2'/></td></tr>
                <tr><td><input id="o_etable1" value='${getProfile().niveauConstruction[12]}' size='6' name='o_etable1'/></td><td colspan="2">Etable à cochenilles</td><td><input id="o_etable2" value='${getProfile().niveauConstruction[12]}' size='6' name='o_etable2'/></td></tr>
                <tr><td colspan="4" height="20"></td></tr>
                <tr class="gras entete centre"><td id="o_bonusLieu" colspan="4" class="cursor">${IMG_ARROW} Lieu ${IMG_ARROW}</td></tr>
                <tr><td></td><td class="right"><input id="o_terrain" type="radio" name="o_lieu" value="${PLACE.TERRAIN}" checked></td><td class="left">Terrain</td><td></td></tr>
                <tr><td></td><td class="right"><input id="o_dome" type="radio" value="${PLACE.DOME}" name="o_lieu"></td><td class="left">Dome</td><td><input id="o_domeNiveau" value='${getProfile().niveauConstruction[9]}' size='6' name='o_dome'/></td></tr>
                <tr><td></td><td class="right"><input id="o_loge" type="radio" value="${PLACE.LOGE}" name="o_lieu"></td><td class="left">Loge</td><td><input id="o_logeNiveau" value='${getProfile().niveauConstruction[10]}' size='6' name='o_loge'/></td></tr>
                <tr><td colspan="4" height="20"></td></td></tr>
                <tr class="gras entete centre"><td colspan="5">Position</td></tr>
                <tr><td id="o_positionAtt" class="gras">Attaquant</td><td colspan="2"><div id="o_positionJoueur"></div></td><td id="o_positionDef">Défenseur</td></tr>
                <tr><td colspan="4" height="20"></td></td></tr>
                <tr><td colspan="4" class="centre"><button id="o_simuler" class="o_button">Simuler</button></td></td></tr>
                </table>
            </td></tr>
            </table>`;
    $("#o_tabsCombat2").append(html);
    // spinner
    $("#o_simulateurArmee input").spinner({ min: 0, numberFormat: "i" });
    $("#o_bouclier1, #o_armes1, #o_bouclier2, #o_armes2, #o_etable1, #o_etable2").spinner({
      min: 0,
      max: 50,
      numberFormat: "d2",
    });
    $("#o_logeNiveau, #o_domeNiveau").spinner({
      min: 0,
      max: 50,
      numberFormat: "d2",
    });
    $("#o_positionJoueur").slider({
      min: 0,
      max: 1,
      change: (e, ui) => {
        if (ui.value) {
          // non-zero means we are defending
          $("#o_positionAtt").removeClass("gras");
          $("#o_positionDef").addClass("gras");
        } else {
          // otherwise we are attacking
          $("#o_positionDef").removeClass("gras");
          $("#o_positionAtt").addClass("gras");
        }
      },
    });
    return this.simulatorEvents();
  }
  /**
   *
   */
  simulatorEvents() {
    $("#o_simulateurArmee input").on("input spin", (e, ui) => {
      let count = numeral(ui ? ui.value : e.currentTarget.value).value();
      let name = $(e.currentTarget).attr("name"),
        army = new Army();
      // a name containing 1 is the attacker, otherwise the defender
      if (name.includes("1_")) this.refreshStats(name, count);
      else this.refreshStats("", 0, name, count);
      $(e.currentTarget).spinner("value", count);
    });
    $("#o_placementAtt").click((e) => {
      if (this._army) this.placeArmy(1).refreshStats();
      else {
        this._army = new Army();
        this._army.getArmy().then((data) => {
          this._army.loadData(data);
          this.placeArmy(1).refreshStats();
        });
      }
      return false;
    });
    $("#o_placementDef").click((e) => {
      if (this._army) this.placeArmy(0).refreshStats();
      else {
        this._army = new Army();
        this._army.getArmy().then((data) => {
          this._army.loadData(data);
          this.placeArmy(0).refreshStats();
        });
      }
      return false;
    });
    $("#o_switchArmee").click((e) => {
      this.swapArmy().refreshStats();
      return false;
    });
    $("#o_copierAtt").click((e) => {
      this.copyPasteArmy("ATT");
    });
    $("#o_copierDef").click((e) => {
      this.copyPasteArmy("DEF");
    });
    // events on the player bonuses
    $("#o_bonusAtt").click((e) => {
      $("#o_armes1").spinner(
        "value",
        $("#o_armes1").spinner("value") == getProfile().niveauRecherche[2]
          ? 0
          : getProfile().niveauRecherche[2],
      );
      $("#o_bouclier1").spinner(
        "value",
        $("#o_bouclier1").spinner("value") == getProfile().niveauRecherche[1]
          ? 0
          : getProfile().niveauRecherche[1],
      );
      $("#o_etable1").spinner(
        "value",
        $("#o_etable1").spinner("value") == getProfile().niveauConstruction[12]
          ? 0
          : getProfile().niveauConstruction[12],
      );
      this.refreshStats();
      return false;
    });
    $("#o_bonusDef").click((e) => {
      $("#o_armes2").spinner(
        "value",
        $("#o_armes2").spinner("value") == getProfile().niveauRecherche[2]
          ? 0
          : getProfile().niveauRecherche[2],
      );
      $("#o_bouclier2").spinner(
        "value",
        $("#o_bouclier2").spinner("value") == getProfile().niveauRecherche[1]
          ? 0
          : getProfile().niveauRecherche[1],
      );
      $("#o_etable2").spinner(
        "value",
        $("#o_etable2").spinner("value") == getProfile().niveauConstruction[12]
          ? 0
          : getProfile().niveauConstruction[12],
      );
      this.refreshStats();
      return false;
    });
    $("#o_bouclier1").on("input spin", (e, ui) => {
      this.refreshStats("", 0, "", 0, numeral(ui ? ui.value : e.currentTarget.value).value());
    });
    $("#o_armes1").on("input spin", (e, ui) => {
      this.refreshStats("", 0, "", 0, -1, numeral(ui ? ui.value : e.currentTarget.value).value());
    });
    $("#o_bouclier2").on("input spin", (e, ui) => {
      this.refreshStats(
        "",
        0,
        "",
        0,
        -1,
        -1,
        numeral(ui ? ui.value : e.currentTarget.value).value(),
      );
    });
    $("#o_armes2").on("input spin", (e, ui) => {
      this.refreshStats(
        "",
        0,
        "",
        0,
        -1,
        -1,
        -1,
        numeral(ui ? ui.value : e.currentTarget.value).value(),
      );
    });
    // events bonus lieu
    $("#o_simulateurNiveau input[name='o_lieu']").change((e) => {
      this.refreshStats();
    });
    $("#o_bonusLieu").click((e) => {
      $("#o_domeNiveau").spinner(
        "value",
        $("#o_domeNiveau").spinner("value") == getProfile().niveauConstruction[9]
          ? 0
          : getProfile().niveauConstruction[9],
      );
      $("#o_logeNiveau").spinner(
        "value",
        $("#o_logeNiveau").spinner("value") == getProfile().niveauConstruction[10]
          ? 0
          : getProfile().niveauConstruction[10],
      );
      this.refreshStats();
      return false;
    });
    $("#o_domeNiveau").on("input spin", (e, ui) => {
      this.refreshStats(
        "",
        0,
        "",
        0,
        -1,
        -1,
        -1,
        -1,
        numeral(ui ? ui.value : e.currentTarget.value).value(),
      );
    });
    $("#o_logeNiveau").on("input spin", (e, ui) => {
      this.refreshStats(
        "",
        0,
        "",
        0,
        -1,
        -1,
        -1,
        -1,
        -1,
        numeral(ui ? ui.value : e.currentTarget.value).value(),
      );
    });
    $("#o_simuler").click((e) => {
      this.launchSimulation();
      return false;
    });
    return this;
  }
  /**
   *
   */
  launchSimulation() {
    let unitATT = {},
      unitDef = {};
    // attacker data
    $("#o_simulateurArmee tr:gt(1)")
      .find("input:eq(0)")
      .each((i, elt) => {
        unitATT[UNIT_NAMES[i + 1]] = $(elt).spinner("value");
      });
    // defender data
    $("#o_simulateurArmee tr:gt(1)")
      .find("input:eq(1)")
      .each((i, elt) => {
        unitDef[UNIT_NAMES[i + 1]] = $(elt).spinner("value");
      });
    // set the battle up
    let battle = new Battle({
      id: moment().valueOf(),
      lieu: $("input[name='o_lieu']:checked").val(),
      attaquant: new Army({ unite: unitATT }),
      defenseur: new Army({ unite: unitDef }),
      pointDeVue: $("#o_positionJoueur").slider("value"),
    });
    // adjust the players' levels
    battle.attaquant.niveauRecherche[1] = $("#o_bouclier1").spinner("value");
    battle.attaquant.niveauRecherche[2] = $("#o_armes1").spinner("value");
    battle.defenseur.niveauRecherche[1] = $("#o_bouclier2").spinner("value");
    battle.defenseur.niveauRecherche[2] = $("#o_armes2").spinner("value");
    battle.defenseur.niveauConstruction[9] = $("#o_domeNiveau").spinner("value");
    battle.defenseur.niveauConstruction[10] = $("#o_logeNiveau").spinner("value");
    // run the battle
    if (battle.armee1.getTotalUnits() && battle.armee2.getTotalUnits()) {
      battle.simulate().generateBattleReport();
      // show the resulting armies in the form
      for (let i = 0; i < 14; i++) {
        $("input[name='o_unite1_" + (i + 1) + "']").spinner("value", battle.armee1Ap.unite[i]);
        $("input[name='o_unite2_" + (i + 1) + "']").spinner("value", battle.armee2Ap.unite[i]);
      }
      this.refreshStats();
      // event that swaps the armies before and after the battle
      $("#o_switchAvantApres")
        .off()
        .click((e) => {
          let armyAttTmp = new Array(),
            armyDefTmp = new Array();
          for (let i = 0; i < 14; i++) {
            armyAttTmp.push($("input[name='o_unite1_" + (i + 1) + "']").spinner("value"));
            armyDefTmp.push($("input[name='o_unite2_" + (i + 1) + "']").spinner("value"));
          }
          // showing the after army swaps in the before army, and vice versa
          if (
            battle.armee1Ap.unite.every((elt, i) => {
              return elt == armyAttTmp[i];
            }) &&
            battle.armee2Ap.unite.every((elt, i) => {
              return elt == armyDefTmp[i];
            })
          ) {
            for (let i = 0; i < 14; i++) {
              $("input[name='o_unite1_" + (i + 1) + "']").spinner("value", battle.armee1.unite[i]);
              $("input[name='o_unite2_" + (i + 1) + "']").spinner("value", battle.armee2.unite[i]);
            }
          } else {
            for (let i = 0; i < 14; i++) {
              $("input[name='o_unite1_" + (i + 1) + "']").spinner(
                "value",
                battle.armee1Ap.unite[i],
              );
              $("input[name='o_unite2_" + (i + 1) + "']").spinner(
                "value",
                battle.armee2Ap.unite[i],
              );
            }
          }
          this.refreshStats();
        })
        .parent()
        .show();
    } else
      $.toast({
        ...TOAST_ERROR,
        text: "Le combat ne peut pas etre simulé : aucune unité.",
      });
    return this;
  }
  /**
   *
   */
  placeArmy(position) {
    let armyTmp = new Array();
    if (position) {
      // build a unit table to decide between filling the army in and clearing the fields
      for (let i = 0; i < this._army.unite.length; i++)
        armyTmp.push($(`#o_simulateurArmee tr:eq(${i + 1}) input:eq(0)`).spinner("value"));
      if (
        this._army.unite.every((elt, i) => {
          return elt == armyTmp[i];
        })
      ) {
        for (let i = 0; i < this._army.unite.length; i++)
          $(`#o_simulateurArmee tr:eq(${i + 2}) input:eq(0)`).spinner("value", 0);
      } else {
        for (let i = 0; i < this._army.unite.length; i++)
          $(`#o_simulateurArmee tr:eq(${i + 2}) input:eq(0)`).spinner("value", this._army.unite[i]);
      }
    } else {
      for (let i = 0; i < this._army.unite.length; i++)
        armyTmp.push($(`#o_simulateurArmee tr:eq(${i + 1}) input:eq(1)`).spinner("value"));
      if (
        this._army.unite.every((elt, i) => {
          return elt == armyTmp[i];
        })
      ) {
        for (let i = 0; i < this._army.unite.length; i++)
          $(`#o_simulateurArmee tr:eq(${i + 2}) input:eq(1)`).spinner("value", 0);
      } else {
        for (let i = 0; i < this._army.unite.length; i++)
          $(`#o_simulateurArmee tr:eq(${i + 2}) input:eq(1)`).spinner("value", this._army.unite[i]);
      }
    }
    return this;
  }
  /**
   *
   */
  swapArmy() {
    // swap the armies
    for (let i = 0; i < 14; i++) {
      let valueTmp = $("input[name='o_unite1_" + (i + 1) + "']").spinner("value");
      $("input[name='o_unite1_" + (i + 1) + "']").spinner(
        "value",
        $("input[name='o_unite2_" + (i + 1) + "']").spinner("value"),
      );
      $("input[name='o_unite2_" + (i + 1) + "']").spinner("value", valueTmp);
    }
    // swap the bonuses
    let tmpBonusArme = $("#o_armes1").spinner("value"),
      tmpBonusShield = $("#o_bouclier1").spinner("value");
    $("#o_armes1").spinner("value", $("#o_armes2").spinner("value"));
    $("#o_bouclier1").spinner("value", $("#o_bouclier2").spinner("value"));
    $("#o_armes2").spinner("value", tmpBonusArme);
    $("#o_bouclier2").spinner("value", tmpBonusShield);
    // swap the position
    let tmpPosition = $("#o_positionJoueur").slider("option", "value");
    $("#o_positionJoueur").slider("option", "value", 1 - tmpPosition);
    return this;
  }
  /**
   *
   */
  refreshStats(
    nameAtt = "",
    valueAtt = 0,
    nameDef = "",
    valueDef = 0,
    bouclier1 = -1,
    armes1 = -1,
    bouclier2 = -1,
    armes2 = -1,
    levelDome = -1,
    levelLodge = -1,
  ) {
    let weaponsAtt = armes1 != -1 ? armes1 : $("#o_armes1").spinner("value"),
      shieldAtt = bouclier1 != -1 ? bouclier1 : $("#o_bouclier1").spinner("value");
    let weaponsDef = armes2 != -1 ? armes2 : $("#o_armes2").spinner("value"),
      shieldDef = bouclier2 != -1 ? bouclier2 : $("#o_bouclier2").spinner("value");
    let place = parseInt($("#o_simulateurNiveau input[name='o_lieu']:checked").val()),
      bonusPlace = 0;
    switch (place) {
      case PLACE.DOME:
        bonusPlace = levelDome != -1 ? levelDome : $("#o_domeNiveau").spinner("value");
        break;
      case PLACE.LOGE:
        bonusPlace = levelLodge != -1 ? levelLodge : $("#o_logeNiveau").spinner("value");
        break;
      default:
        break;
    }
    let army = new Army();
    // attacker data
    $("#o_simulateurArmee tr:gt(1)")
      .find("input:eq(0)")
      .each((i, elt) => {
        army.unite[i] = $(elt).attr("name") == nameAtt ? valueAtt : $(elt).spinner("value");
      });
    $("#o_vieAtt").text(numeral(army.getTotalHp(shieldAtt)).format());
    $("#o_degatAtt").text(numeral(army.getTotalAtt(weaponsAtt)).format());
    // defender data
    army = new Army();
    $("#o_simulateurArmee tr:gt(1)")
      .find("input:eq(1)")
      .each((i, elt) => {
        army.unite[i] = $(elt).attr("name") == nameDef ? valueDef : $(elt).spinner("value");
      });
    $("#o_vieDef").text(numeral(army.getTotalHp(shieldDef, place, bonusPlace)).format());
    $("#o_degatDef").text(numeral(army.getTotalDef(weaponsDef)).format());
    return this;
  }
  /**
   *
   */
  copyPasteArmy(position) {
    if ($("#o_divccarmee").length) {
      $("#o_divccarmee").show();
      $("#o_camp").val(position);
    } else {
      $("body").append(`<div class="voile" id="o_divccarmee">
                <div class="message_voile">
                    <input type="hidden" id="o_camp" value="${position}"/>Importer une Armée
                    <textarea id="o_textAreaArmee" name="textAreaArmee" rows="9" cols="50" style="width:100%;"></textarea>
                    <p>
                        <input id="o_annulerCopie" type="button" value="Annuler"/>
                        <input id="o_afficherAide" type="button" value="Aide"/>
                        <input id="o_importerArmee" type="button" value="Valider" />
                    </p>
                    <p id="o_aideCopierArmee" style="text-align:left; font-size: 0.8em;display:none">
                        Vous pouvez importer une armée de plusieurs façons :
                        <br/>- Ecrire directement une phrase : je veux 30 jsn et 27 artilleuses et encore 50 jeunes soldates naines.
                        <br/>- Copiez une armée de Fourmizzz (Rapport de combat, Page Armée, Armée en attaque...).
                        <br/>- Copiez un fichier Excel.
                        <br/><br/>Vous pouvez utiliser certaines abréviations :
                        <br/>- Pour les armées : jsn, sn, ne, js, s, c, ce, a, ae, se, ta ou tk, tae ou tke, tu, tue.
                        <br/>- Pour les nombres : k ou kilo, M ou mega, G ou giga, T ou tera.
                    </p>
                </div>
            </div>`);
      // events
      $("#o_annulerCopie").click((e) => {
        $("#o_divccarmee").hide();
        $("#o_textAreaArmee").val("");
        return false;
      });
      $("#o_afficherAide").click((e) => {
        $("#o_aideCopierArmee").is(":visible")
          ? $("#o_aideCopierArmee").hide()
          : $("#o_aideCopierArmee").show();
        return false;
      });
      $("#o_importerArmee").click((e) => {
        let army = new Army(),
          camp = $("#o_camp").val() == "ATT" ? 1 : 2;
        army.parseArmy($("#o_textAreaArmee").val());
        for (let i = 0; i < army.unite.length; i++)
          $("input[name='o_unite" + camp + "_" + (i + 1) + "']").spinner("value", army.unite[i]);
        $("#o_divccarmee").hide();
        $("#o_textAreaArmee").val("");
        this.refreshStats();
        return false;
      });
    }
  }
  /**
   * Renders the multi-flood simulator (tab 3).
   *
   * @private
   * @method multiFlood
   */
  multiFlood() {
    $("#o_tabsCombat3").append(`<div id="o_multiFlood" class="centre">
            <div id="o_mfFormWrap"></div>
            <div id="o_mfResultats" class="o_marginT15"></div>
            <p id="o_mfRecap" class="o_marginT15"></p>
            <button id="o_mfLancer" class="o_button f_success o_marginT15" type="button" disabled>Lancer ces attaques</button>
        </div>`);
    /**
     * Targets picked by the player. Each entry:
     * { pseudo, id, terrain, type, x, y, tempsParcours }
     */
    this._mfTargets = [];
    this._mfAttackerOpts = { terrainFinal: null, priseMax: null };
    this._mfTotalUnits = null; // chargé lazy via Armee.getArmee()
    this._mfRenderForm();
    // preload the army for the garrison check; does not block the UI
    if (!this._mfArmy) this._mfArmy = new Army();
    this._mfArmy.getArmy().then((data) => {
      this._mfArmy.loadData(data);
      this._mfTotalUnits = (this._mfArmy.unite || []).reduce((s, n) => s + (n || 0), 0);
      this.simulateMultiFlood();
    });
    return this;
  }
  /**
   * Renders the form table in the game's own style:
   * Attaquant | label | cible1 | cible2 | … | "+" (slot d'ajout).
   * Fully re-rendered on every add/remove, so the autocomplete is re-bound after.
   *
   * @private
   * @method _mfRenderForm
   */
  _mfRenderForm() {
    let cibles = [...this._mfTargets].sort((a, b) => a.tempsParcours - b.tempsParcours),
      arrondirOptions = [0, 5, 10, 100, 1000],
      // Toujours 3 slots cibles : rempli / autocomplete (1er vide) / placeholder.
      slot = (i, render) =>
        i < cibles.length
          ? render(cibles[i])
          : i === cibles.length
            ? `<td><input type="text" id="o_mfPseudoCible" placeholder="Pseudo…"/></td>`
            : `<td><input type="text" disabled placeholder="—"/></td>`,
      placeholder = `<td><input type="text" disabled placeholder="—"/></td>`,
      arrondirPlaceholder = `<td><select disabled><option>Aucun</option></select></td>`,
      pseudoRow = [0, 1, 2]
        .map((i) =>
          slot(
            i,
            (c) =>
              `<td><input type="text" class="o_mfPseudoCell cursor" data-pseudo="${c.pseudo}" value="${c.pseudo}" readonly title="Cliquer pour retirer"/></td>`,
          ),
        )
        .join(""),
      terrainRow = [0, 1, 2]
        .map((i) =>
          i < cibles.length
            ? `<td><input type="text" value="${numeral(cibles[i].terrain).format()} cm²" disabled/></td>`
            : placeholder,
        )
        .join(""),
      terrainFinalRow = [0, 1, 2]
        .map((i) =>
          i < cibles.length
            ? `<td><input type="text" class="o_mfOpt" data-pseudo="${cibles[i].pseudo}" data-opt="terrainFinal" value="${cibles[i].terrainFinal ?? ""}" placeholder="—"/></td>`
            : placeholder,
        )
        .join(""),
      captureMaxRow = [0, 1, 2]
        .map((i) =>
          i < cibles.length
            ? `<td><input type="text" class="o_mfOpt" data-pseudo="${cibles[i].pseudo}" data-opt="priseMax" value="${cibles[i].priseMax ?? ""}" placeholder="—"/></td>`
            : placeholder,
        )
        .join(""),
      arrondirRow = [0, 1, 2]
        .map((i) => {
          if (i >= cibles.length) return arrondirPlaceholder;
          let c = cibles[i],
            opts = arrondirOptions
              .map(
                (v) =>
                  `<option value="${v}"${(c.arrondir ?? 0) == v ? " selected" : ""}>${v === 0 ? "Aucun" : v}</option>`,
              )
              .join("");
          return `<td><select class="o_mfOpt" data-pseudo="${c.pseudo}" data-opt="arrondir">${opts}</select></td>`;
        })
        .join("");
    $("#o_mfFormWrap").html(`
        <table id="o_mfForm" class="o_maxWidth centre" cellspacing="0">
          <thead>
            <tr>
              <th>Attaquant</th>
              <th></th>
              <th colspan="3">Cibles</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><input type="text" value="${getProfile().pseudo}" disabled/></td>
              <td class="right">Pseudo</td>
              ${pseudoRow}
            </tr>
            <tr>
              <td><input type="text" value="${numeral(Utils.terrain).format()}" disabled/></td>
              <td class="right">Terrain</td>
              ${terrainRow}
            </tr>
            <tr>
              <td><input type="text" class="o_mfAttOpt" data-opt="terrainFinal" value="${this._mfAttackerOpts?.terrainFinal ?? ""}" placeholder="—"/></td>
              <td class="right reduce">Terrain Final</td>
              ${terrainFinalRow}
            </tr>
            <tr>
              <td><input type="text" class="o_mfAttOpt" data-opt="priseMax" value="${this._mfAttackerOpts?.priseMax ?? ""}" placeholder="—"/></td>
              <td class="right reduce">Prise Max</td>
              ${captureMaxRow}
            </tr>
            <tr>
              <td></td>
              <td class="right reduce">Arrondir</td>
              ${arrondirRow}
            </tr>
          </tbody>
        </table>`);
    this._mfBindForm();
  }
  /**
   *
   */
  _mfBindForm() {
    $("#o_mfPseudoCible")
      .autocomplete({
        minLength: 1,
        source: (request, response) => {
          Player.search(request.term).then(
            (data) => {
              let items = Utils.extractResearch(data, true, false);
              response(
                items.map((it) => ({
                  label: it.value_avec_html,
                  value: it.value,
                })),
              );
            },
            () => response([]),
          );
        },
        select: (event, ui) => {
          this._mfAddByPseudo(ui.item.value);
          return false;
        },
      })
      .on("keydown", (e) => {
        if (e.key === "Enter") {
          let pseudo = $("#o_mfPseudoCible").val().trim();
          if (pseudo) this._mfAddByPseudo(pseudo);
          e.preventDefault();
        }
      });
    $("#o_mfForm .o_mfPseudoCell").click((e) => {
      let pseudo = $(e.currentTarget).data("pseudo");
      this._mfTargets = this._mfTargets.filter((c) => c.pseudo !== pseudo);
      this._mfRenderForm();
      this.simulateMultiFlood();
    });
    // Spinners on every numeric input (Terrain Final / Prise Max, per target and attacker) — Toolzzz convention
    $("#o_mfForm input.o_mfOpt, #o_mfForm input.o_mfAttOpt").spinner({
      min: 0,
      numberFormat: "i",
    });
    // Per-target options (Terrain Final / Prise Max / Arrondir) — re-simulate on change
    $("#o_mfForm .o_mfOpt").on("change", (e) => {
      let $el = $(e.currentTarget),
        pseudo = $el.data("pseudo"),
        opt = $el.data("opt"),
        cible = this._mfTargets.find((c) => c.pseudo === pseudo);
      if (!cible) return;
      let raw = $el.val();
      cible[opt] = raw === "" || raw === "0" ? null : parseInt(raw);
      this.simulateMultiFlood();
    });
    // Global attacker options (Terrain Final / Prise Max) — re-simulate on change
    $("#o_mfForm .o_mfAttOpt").on("change", (e) => {
      let $el = $(e.currentTarget),
        opt = $el.data("opt"),
        raw = $el.val();
      this._mfAttackerOpts[opt] = raw === "" || raw === "0" ? null : parseInt(raw);
      this.simulateMultiFlood();
    });
  }
  /**
   * How a target is added from its nickname:
   * 1. look it up in the local radar first (instant, no network);
   * 2. otherwise fetch `Membre.php?Pseudo=...` to read id/terrain/x/y.
   * `classementAlliance.php` (used by the autocomplete) only returns
   * `{value, url}`, which is not enough for the simulation — hence this step.
   *
   * @private
   * @method _mfAddByPseudo
   * @param {String} pseudo
   */
  _mfAddByPseudo(pseudo) {
    if (!this._mfRadar) this._mfRadar = new RadarBox();
    let local = this._mfRadar.joueurs[pseudo];
    if (local) {
      this.addMultiFloodTarget({
        pseudo: local.pseudo,
        id: local.id,
        terrain: local.terrain,
        type: "radar",
        x: local.x,
        y: local.y,
      });
      return;
    }
    this._mfFetchProfile(pseudo).then(
      (cible) => this.addMultiFloodTarget(cible),
      (err) => {
        console.error("[multiFlood] enrichissement profil échoué", err);
        $.toast({
          ...TOAST_WARNING,
          text: `Impossible de récupérer les infos de ${pseudo}.`,
        });
      },
    );
  }
  /**
   * Fetches and parses the profile page for the fields the simulation needs.
   * The selectors match what `PlayerProfile` already does —
   * cf. docs/scenarios/consulter-profil/report.md.
   *
   * @private
   * @method _mfFetchProfile
   * @param {String} pseudo
   * @return {Promise<Object>}
   */
  _mfFetchProfile(pseudo) {
    let url = `http://${Utils.server}.fourmizzz.fr/Membre.php?Pseudo=${encodeURIComponent(pseudo)}`;
    return $.get(url).then((html) => {
      let $page = Utils.parseHtml(html),
        coords = $page.find(".boite_membre a[href^='carte2.php?']").text(),
        m = coords.match(/x=(\d+) et y=(\d+)/),
        idLink = $page.find("a[href^='commerce.php?ID=']").attr("href") || "",
        idMatch = idLink.match(/\d+/);
      return {
        pseudo,
        id: idMatch ? parseInt(idMatch[0]) : 0,
        terrain: numeral($page.find(".tableau_score tr:eq(1) td:eq(1)").text()).value() || 0,
        type: "profil",
        x: m ? parseInt(m[1]) : 0,
        y: m ? parseInt(m[2]) : 0,
      };
    });
  }
  /**
   *
   */
  _mfNormalizeTarget(d) {
    return {
      pseudo: d.value,
      id: parseInt(d.id),
      terrain: parseInt(d.terrain),
      type: d.type,
      x: parseInt(d.x),
      y: parseInt(d.y),
    };
  }
  /**
   *
   */
  addMultiFloodTarget(cible) {
    if (this._mfTargets.some((c) => c.pseudo === cible.pseudo)) {
      $.toast({
        ...TOAST_WARNING,
        text: `${cible.pseudo} est déjà dans la liste.`,
      });
      return;
    }
    cible.tempsParcours = getProfile().getTravelTimeTo(cible);
    this._mfTargets.push(cible);
    this._mfRenderForm();
    this.simulateMultiFlood();
  }
  /**
   * Drives the multi-target simulation: chains `Army.optimizeFlood` over each
   * target (sorted by distance), carrying `tdcAtt` along.
   * Flags targets that are "too high" (terrain > my terrain × SEUIL_TROP_HAUT).
   *
   * @private
   * @method simulateMultiFlood
   */
  simulateMultiFlood() {
    if (!this._mfArmy) this._mfArmy = new Army();
    // Thresholds match the game's (tdcCible ∈ [tdcAtt × 0.5, tdcAtt × 3])
    const SEUIL_TROP_HAUT = 3;
    const SEUIL_TROP_BOTTOM = 2;
    const MAX_ATTACKS_BY_TARGET = 10;
    const UNIT_INFINIE = 1e9; // simu purement terrain — la contrainte d'armée est appliquée globalement (recap) pas par cible
    let cibles = [...this._mfTargets].sort((a, b) => a.tempsParcours - b.tempsParcours),
      mfTerrain = Utils.terrain,
      // map of the previously ticked states (by nickname+i) so the player's choices survive
      previous = {};
    (this._mfResults || []).forEach((r) => {
      r.attaques?.forEach((a, i) => {
        previous[r.cible.pseudo + ":" + i] = a.checked !== false;
      });
    });
    let results = [];
    cibles.forEach((cible) => {
      if (cible.terrain > mfTerrain * SEUIL_TROP_HAUT) {
        results.push({
          cible,
          tropHaute: true,
          tdcAttDebut: mfTerrain,
          tdcAttFin: mfTerrain,
        });
        return;
      }
      if (mfTerrain > cible.terrain * SEUIL_TROP_BOTTOM) {
        results.push({
          cible,
          tropBasse: true,
          tdcAttDebut: mfTerrain,
          tdcAttFin: mfTerrain,
        });
        return;
      }
      this._mfArmy.floods = [];
      let dataFlood = {
        tdcAtt: mfTerrain,
        tdcCible: cible.terrain,
        unite: UNIT_INFINIE,
        reste: MAX_ATTACKS_BY_TARGET,
        attaques: [],
      };
      this._mfArmy.optimizeFlood(dataFlood);
      let prises = this._mfArmy.floods.slice();
      // Post-processing with the options (per target plus the attacker's global ones)
      // Prise Max: a per-attack cap (target OR attacker, whichever is tighter)
      let captureMax = Math.min(
        cible.priseMax ?? Infinity,
        this._mfAttackerOpts.priseMax ?? Infinity,
      );
      if (captureMax !== Infinity) prises = prises.map((p) => Math.min(p, captureMax));
      // Arrondir: applied to the value, per target
      if (cible.arrondir)
        prises = prises.map((p) => Math.round(p / cible.arrondir) * cible.arrondir);
      // Target's Terrain Final: bring the target's terrain DOWN TO this value
      if (cible.terrainFinal != null) {
        let cumulTarget = cible.terrain,
          tronquees = [];
        for (let p of prises) {
          if (cumulTarget <= cible.terrainFinal) break;
          let allowed = cumulTarget - cible.terrainFinal;
          let truncated = Math.min(p, allowed);
          tronquees.push(truncated);
          cumulTarget -= truncated;
        }
        prises = tronquees.filter((p) => p > 0);
      }
      // Attacker's Terrain Final: stop once my terrain reaches the cap
      if (this._mfAttackerOpts.terrainFinal != null) {
        let cumulAtt = mfTerrain,
          plafond = this._mfAttackerOpts.terrainFinal,
          tronquees = [];
        for (let p of prises) {
          if (cumulAtt >= plafond) break;
          let truncated = Math.min(p, plafond - cumulAtt);
          tronquees.push(truncated);
          cumulAtt += truncated;
        }
        prises = tronquees.filter((p) => p > 0);
      }
      let attacks = [],
        huntingGroundAttC = mfTerrain,
        huntingGroundTargetC = cible.terrain;
      prises.forEach((p, i) => {
        attacks.push({
          prise: p,
          tdcAttAvant: huntingGroundAttC,
          tdcCibleAvant: huntingGroundTargetC,
          pct: huntingGroundTargetC > 0 ? Math.round((p / huntingGroundTargetC) * 100) : 0,
          checked: previous[cible.pseudo + ":" + i] !== false,
        });
        huntingGroundAttC += p;
        huntingGroundTargetC -= p;
      });
      results.push({
        cible,
        attacks,
        tdcAttDebut: mfTerrain,
        tdcAttFin: huntingGroundAttC,
        tdcCibleFin: huntingGroundTargetC,
      });
      mfTerrain = huntingGroundAttC;
    });
    this._mfResults = results;
    this.renderMultiFloodResults(results);
  }
  /**
   * Renders the live results table (one sub-table per target).
   *
   * @private
   * @method renderMultiFloodResults
   * @param {Array} results
   */
  renderMultiFloodResults(results) {
    let html = "";
    results.forEach((r) => {
      html += `<table class="o_mfResultatCible o_maxWidth o_marginT15 centre" cellspacing="0">
                <thead>
                    <tr><th>${r.cible.pseudo} <span class="reduce">(${Utils.intToTime(r.cible.tempsParcours)})</span></th><th class="right">Mon Terrain</th><th class="right">Terrain de ${r.cible.pseudo}</th><th class="right">Prise</th></tr>
                </thead>
                <tbody>`;
      if (r.tropHaute) {
        html += `<tr><td colspan="4" class="centre red"><em>Le terrain de la cible est trop haut</em></td></tr>`;
      } else if (r.tropBasse) {
        html += `<tr><td colspan="4" class="centre red"><em>Le terrain de la cible est trop bas</em></td></tr>`;
      } else {
        r.attaques.forEach((a, i) => {
          html += `<tr>
                    <td class="left"><label><input type="checkbox" class="o_mfAttaqueCheck" data-pseudo="${r.cible.pseudo}" data-i="${i}"${a.checked ? " checked" : ""}/> Attaque ${i + 1} <span class="reduce">(${a.pct}%)</span></label></td>
                    <td class="right">${numeral(a.tdcAttAvant).format()}</td>
                    <td class="right">${numeral(a.tdcCibleAvant).format()}</td>
                    <td class="right">${numeral(a.prise).format()}</td>
                </tr>`;
        });
        let totalCapture = r.attaques.reduce((s, a) => s + a.prise, 0);
        html += `<tr class="gras">
                    <td class="left">Résultat</td>
                    <td class="right">${numeral(r.tdcAttFin).format()}</td>
                    <td class="right">${numeral(r.tdcCibleFin).format()}</td>
                    <td class="right green">+${numeral(totalCapture).format()}</td>
                </tr>`;
      }
      html += `</tbody></table>`;
    });
    $("#o_mfResultats").html(html);
    // Ticking a checkbox updates the summary instantly (no re-simulation, the player's state is kept)
    $("#o_mfResultats .o_mfAttaqueCheck").on("change", (e) => {
      let $el = $(e.currentTarget),
        pseudo = $el.data("pseudo"),
        i = parseInt($el.data("i")),
        r = this._mfResults.find((x) => x.cible.pseudo === pseudo);
      if (r && r.attaques[i]) {
        r.attaques[i].checked = $el.is(":checked");
        this.renderMultiFloodRecap(this._mfResults);
      }
    });
    this.renderMultiFloodRecap(results);
    this.css(); // ré-applique couleur2 sur les nouvelles tables
  }
  /**
   * Overall summary: number of attacks, total ants, total capture.
   * No capacity percentage (attack speed, garrison) until there is a reliable
   * source for those values — to be added in v2.
   *
   * @private
   * @method renderMultiFloodRecap
   * @param {Array} results
   */
  renderMultiFloodRecap(results) {
    let totalAttacks = 0,
      totalFourmis = 0,
      totalCapture = 0,
      cibles: any = new Set();
    results.forEach((r) => {
      if (r.tropHaute || r.tropBasse) return;
      r.attaques.forEach((a) => {
        if (a.checked === false) return; // attaques décochées exclues
        cibles.add(r.cible.pseudo);
        totalAttacks++;
        totalFourmis += a.prise; // approximation 1cm² ≈ 1 unité (cohérent avec le natif sur JSN)
        totalCapture += a.prise;
      });
    });
    cibles = cibles.size;
    if (!totalAttacks) {
      let msg = "";
      if (results.length) {
        let allHaut = results.every((r) => r.tropHaute),
          allBottom = results.every((r) => r.tropBasse),
          allOob = results.every((r) => r.tropHaute || r.tropBasse);
        if (allHaut) msg = "Aucune attaque possible — toutes les cibles sont trop hautes.";
        else if (allBottom) msg = "Aucune attaque possible — toutes les cibles sont trop basses.";
        else if (allOob)
          msg =
            "Aucune attaque possible — toutes les cibles sont hors-portée (trop hautes ou trop basses).";
        else msg = "Aucune attaque planifiée (cibles bornées par les options ou décochées).";
      }
      $("#o_mfRecap").html(msg ? `<em>${msg}</em>` : "");
      $("#o_mfLancer").prop("disabled", true);
      return;
    }
    // Army capacity check (garrison). Three states:
    //   null  → army not loaded yet (Army.getArmy still running)
    //   0     → empty army → the flood is impossible
    //   > 0   → compute the percentage (it can far exceed 100% — the game itself
    //          shows 6595% and the like)
    let pctGarnisonHtml = "",
      armyOk = true;
    if (this._mfTotalUnits === 0) {
      pctGarnisonHtml = `, soit <span class="gras red">∞%</span> de votre armée (garnison vide)`;
      armyOk = false;
    } else if (this._mfTotalUnits > 0) {
      let pct = Math.round((totalFourmis / this._mfTotalUnits) * 100);
      armyOk = totalFourmis <= this._mfTotalUnits;
      pctGarnisonHtml = `, soit <span class="gras${armyOk ? "" : " red"}">${pct}%</span> de votre armée en garnison`;
    }
    let fourmisCls = armyOk ? "" : " red",
      recap = `Ce flood demande <span class="gras">${totalAttacks} attaque${totalAttacks > 1 ? "s" : ""}</span> sur ${cibles} cible${cibles > 1 ? "s" : ""} et <span class="gras${fourmisCls}">${numeral(totalFourmis).format()} fourmis</span>${pctGarnisonHtml} pour <span class="gras green">+${numeral(totalCapture).format()} cm²</span>.`;
    $("#o_mfRecap").html(recap);
    $("#o_mfLancer").prop("disabled", !armyOk);
    $("#o_mfLancer")
      .off("click")
      .one("click", () => this._mfLaunch());
  }
  /**
   * Runs the multi-flood sequence: for every target (in distance order), GET
   * `ennemie.php?Attaquer=<id>` to pick up the security token, then POST each
   * ticked attack one after the other, one second apart.
   * This exists alongside `Army.sendFlood` because that one ends with
   * `location.reload()` (incompatible with multiple targets) and reads
   * `pseudoCible` from the `ennemie.php` DOM, which the BattleBox does not have.
   *
   * @private
   * @method _mfLaunch
   */
  _mfLaunch() {
    let totalAttacks = 0,
      aLaunch = [];
    this._mfResults.forEach((r) => {
      if (r.tropHaute || r.tropBasse) return;
      let prises = [],
        indices = [];
      r.attaques.forEach((a, i) => {
        if (a.checked !== false && a.prise > 0) {
          prises.push(a.prise);
          indices.push(i);
          totalAttacks++;
        }
      });
      if (prises.length) aLaunch.push({ cible: r.cible, prises, indices });
    });
    if (!totalAttacks) return;
    if (
      !confirm(
        `Lancer ${totalAttacks} attaque(s) sur ${aLaunch.length} cible(s) ? Cette action est irréversible.`,
      )
    )
      return;
    $("#o_mfLancer").prop("disabled", true).text("Lancement…");
    // make sure the army is loaded, otherwise `distributeFloodUnits` has nothing to spread
    let prep =
      this._mfArmy && this._mfArmy.unite.some((u) => u > 0)
        ? Promise.resolve()
        : this._mfArmy.getArmy().then((d) => this._mfArmy.loadData(d));
    prep.then(() => this._mfLaunchNextTarget(aLaunch, 0));
  }
  /**
   *
   */
  _mfLaunchNextTarget(aLaunch, idx) {
    if (idx >= aLaunch.length) {
      $.toast({ ...TOAST_SUCCESS, text: "Multi-flood terminé." });
      $("#o_mfLancer").text("Lancer ces attaques");
      return;
    }
    let { cible, prises, indices } = aLaunch[idx];
    $.get(`http://${Utils.server}.fourmizzz.fr/ennemie.php?Attaquer=${cible.id}`)
      .then((html) => {
        let $page = Utils.parseHtml(html),
          tInput = $page.find("input#t").last();
        if (!tInput.length) {
          $.toast({
            ...TOAST_ERROR,
            text: `Token introuvable pour ${cible.pseudo}, séquence stoppée.`,
          });
          $("#o_mfLancer").text("Lancer ces attaques");
          return;
        }
        let securite = tInput.attr("name") + "=" + tInput.attr("value");
        // Build the split for ONLY the ticked attacks of this target
        this._mfArmy.floods = prises.slice();
        this._mfArmy.distributeFloodUnits();
        this._mfSendNextAttack(cible, securite, indices, 0, () => {
          // Local tally of the units sent, for the targets that follow
          this._mfArmy.repartition.forEach((rep) => {
            rep.forEach((n, j) => {
              this._mfArmy.unite[j] = Math.max(0, this._mfArmy.unite[j] - n);
            });
          });
          this._mfLaunchNextTarget(aLaunch, idx + 1);
        });
      })
      .fail(() => {
        $.toast({
          ...TOAST_ERROR,
          text: `Échec récupération page ennemie pour ${cible.pseudo}, séquence stoppée.`,
        });
        $("#o_mfLancer").text("Lancer ces attaques");
      });
  }
  /**
   *
   */
  _mfSendNextAttack(cible, securite, indices, k, onComplete) {
    if (k >= indices.length) {
      onComplete();
      return;
    }
    let i = indices[k],
      donnees = this._mfBuildPayload(securite, this._mfArmy.repartition[k], cible.pseudo);
    $.post(
      `http://${Utils.server}.fourmizzz.fr/ennemie.php?Attaquer=${cible.id}`,
      donnees,
      (data) => {
        let txt = Utils.parseHtml(data).find("center:last").text(),
          ok = txt.indexOf("Vos troupes sont en marche") !== -1;
        this._mfMarkAttack(cible.pseudo, i, ok);
        setTimeout(() => this._mfSendNextAttack(cible, securite, indices, k + 1, onComplete), 1000);
      },
    );
  }
  /**
   * Builds the `application/x-www-form-urlencoded` payload `ennemie.php` expects.
   * The unite11/12/13/14 ↔ index 12/13/11/6 mapping of the `repartition` array
   * reproduces `Army.sendFlood` exactly (a non-sequential order inherited from
   * the game, where Concierge d'élite / Tank d'élite / Tueuse[E] were added
   * later).
   *
   * @private
   * @method _mfBuildPayload
   */
  _mfBuildPayload(securite, distribution, pseudoTarget) {
    let donnees = {},
      [name, value] = securite.split("=");
    donnees[name] = value;
    donnees["ChoixArmee"] = "1";
    donnees["lieu"] = "1";
    donnees["pseudoCible"] = pseudoTarget;
    donnees["unite1"] = distribution[0];
    donnees["unite2"] = distribution[1];
    donnees["unite3"] = distribution[2];
    donnees["unite4"] = distribution[3];
    donnees["unite5"] = distribution[4];
    donnees["unite6"] = distribution[5];
    donnees["unite7"] = distribution[7];
    donnees["unite8"] = distribution[8];
    donnees["unite9"] = distribution[9];
    donnees["unite10"] = distribution[10];
    donnees["unite11"] = distribution[12];
    donnees["unite12"] = distribution[13];
    donnees["unite13"] = distribution[11];
    donnees["unite14"] = distribution[6];
    return donnees;
  }
  /**
   *
   */
  _mfMarkAttack(pseudo, i, ok) {
    $(`.o_mfResultatCible .o_mfAttaqueCheck[data-pseudo="${pseudo}"][data-i="${i}"]`)
      .closest("tr")
      .removeClass("red green")
      .addClass(ok ? "green" : "red");
  }
  /**
   * Renders a calculator for travel times and schedules.
   *
   * @private
   * @method calculator
   */
  calculator() {
    let html = `<table id="o_calculatriceCombat" class="centre">
            <thead><tr><th id="o_placementJ" class="cursor" colspan="2">${IMG_ARROW} Joueur 1 ${IMG_ARROW}</th><th></th><th>Joueur(s)</th></tr></thead>
            <tr><td></td><td><input type="text" id="o_pseudoTemps" placeholder="Pseudo"/></td><td>→</td><td><input type="text" id="o_cibleJoueurTemps" placeholder="Pseudo1, Pseudo2..."/></td></tr>
            <tr><td>Vitesse d'attaque</td><td><input type="text" id="o_vaTemps" value="0" size="5"/></td><td></td><td></td></tr>
            <tr><td>Dernier mouvement</td><td><input id="o_dernierMvt" placeholder="JJ-MM-AAAA HH:mm"/></td><td></td><td><button id="o_calculerTemps">Calculer</button></td></tr>
            <tr><td>Délai capture (min)</td><td><input id="o_delaiCapture" value="1" size="5"/></td><td></td><td></td></tr>
            <tr class="reduce"><td colspan="4"><em>Le temps maximal d'un trajet est de <span id="o_indicationTemps">${this.computeTimeLimit(0)}</span>.</em></td></tr>
            </table>
            <hr class='o_calcSepar'/>
            <table id="o_estimateurVa" class="centre">
            <thead><tr><th colspan="4">Estimer la vitesse d'attaque (via 2 attaques consécutives)</th></tr></thead>
            <tr><td>Ennemi</td><td><input type="text" id="o_estVaEnnemi" placeholder="Pseudo"/></td><td></td><td></td></tr>
            <tr><td>1ère cible touchée</td><td><input type="text" id="o_estVaCible1" placeholder="Pseudo"/></td><td>à</td><td><input id="o_estVaHeure1" placeholder="JJ-MM-AAAA HH:mm"/></td></tr>
            <tr><td>2ème cible touchée</td><td><input type="text" id="o_estVaCible2" placeholder="Pseudo"/></td><td>à</td><td><input id="o_estVaHeure2" placeholder="JJ-MM-AAAA HH:mm"/></td></tr>
            <tr><td>Temps en loge (s)</td><td><input id="o_estVaLoge" value="0" size="5"/></td><td></td><td><button id="o_estVaEstimer">Estimer</button></td></tr>
            <tr id="o_estVaResultatRow" class="reduce" style="display:none;"><td colspan="4" class="centre"><span id="o_estVaResultatText"></span> <button id="o_estVaUtiliser" style="display:none;">Utiliser cette va</button></td></tr>
            </table>`;
    $("#o_tabsCombat4").append(html);
    return this.calculatorEvents();
  }
  /**
   *
   */
  calculatorEvents() {
    $("#o_placementJ").click(() => {
      // already filled in: clear it
      if ($("#o_pseudoTemps").val() == getProfile().pseudo) {
        $("#o_pseudoTemps").val("");
        $("#o_vaTemps").spinner("value", 0);
        $("#o_indicationTemps").text(this.computeTimeLimit(0));
      } else {
        $("#o_pseudoTemps").val(getProfile().pseudo);
        $("#o_vaTemps").spinner("value", getProfile().niveauRecherche[6]);
        $("#o_indicationTemps").text(this.computeTimeLimit(getProfile().niveauRecherche[6]));
      }
    });
    $("#o_pseudoTemps").autocomplete({
      source: (request, response) => {
        Player.search(request.term).then((data) => {
          response(Utils.extractResearch(data, true, false));
        });
      },
      position: { my: "left top-5", at: "left bottom" },
      minLength: 3,
    });
    $("#o_cibleJoueurTemps").autocomplete({
      source: (request, response) => {
        Alliance.search(request.term.split(/,\s*/g).pop()).then((data) => {
          response(Utils.extractResearch(data, true, false));
        });
      },
      position: { my: "left top-6", at: "left bottom" },
      minLength: 2,
      focus: function () {
        return false;
      },
      select: function (event, ui) {
        let terms = this.value.split(/,\s*/g);
        terms.pop();
        terms.push(ui.item.value);
        terms.push("");
        this.value = terms.join(", ");
        return false;
      },
    });
    $("#o_dernierMvt").datetimepicker({
      ...DATEPICKER_OPTIONS,
      dateFormat: "dd-mm-yy",
      timeFormat: "HH:mm",
      timeText: "Horaire",
      hourText: "Heure",
      minuteText: "Minute",
    });
    $("#o_vaTemps").spinner({ min: 0, max: 50, numberFormat: "i" });
    $("#o_vaTemps").on("input spin", (e, ui) => {
      let count = ui ? ui.value : $(e.currentTarget).spinner("value");
      $("#o_indicationTemps").text(this.computeTimeLimit(count));
    });
    $("#o_delaiCapture").spinner({ min: 0, max: 60, numberFormat: "i" });
    $("#o_calculerTemps").click(() => {
      let ref = new Player({ pseudo: $("#o_pseudoTemps").val() });
      ref.niveauRecherche[6] = $("#o_vaTemps").val();
      // without a reference player nothing can be computed
      if (!ref.pseudo) {
        $.toast({
          ...TOAST_ERROR,
          text: "Le joueur 1 n'est pas renseigné.",
        });
        return false;
      }
      // prepare the players
      let players = new Array();
      for (let i = 0, tmp = $("#o_cibleJoueurTemps").val().split(", "); i < tmp.length; i++)
        if (tmp[i]) players.push(new Player({ pseudo: tmp[i] }));

      if (!players.length) {
        $.toast({
          ...TOAST_ERROR,
          text: "Vous n'avez pas renseigné de joueur pour lancer le calcul.",
        });
      } else {
        if (!$("#o_infosTemps").length) this.renderTime();
        let delayMin = parseInt($("#o_delaiCapture").val(), 10);
        if (isNaN(delayMin) || delayMin < 0) delayMin = 1;
        this.computeTime(ref, players, $("#o_dernierMvt").val(), delayMin * 60);
      }
      return false;
    });
    // Estimateur de vitesse d'attaque
    for (let id of ["#o_estVaEnnemi", "#o_estVaCible1", "#o_estVaCible2"]) {
      $(id).autocomplete({
        source: (request, response) => {
          Player.search(request.term).then((data) => {
            response(Utils.extractResearch(data, true, false));
          });
        },
        position: { my: "left top-5", at: "left bottom" },
        minLength: 3,
      });
    }
    for (let id of ["#o_estVaHeure1", "#o_estVaHeure2"]) {
      $(id).datetimepicker({
        ...DATEPICKER_OPTIONS,
        dateFormat: "dd-mm-yy",
        timeFormat: "HH:mm",
        timeText: "Horaire",
        hourText: "Heure",
        minuteText: "Minute",
      });
    }
    $("#o_estVaLoge").spinner({ min: 0, max: 600, numberFormat: "i" });
    $("#o_estVaEstimer").click(() => {
      let pseudoEnn = $("#o_estVaEnnemi").val();
      let pseudoC1 = $("#o_estVaCible1").val();
      let pseudoC2 = $("#o_estVaCible2").val();
      let t1 = $("#o_estVaHeure1").val();
      let t2 = $("#o_estVaHeure2").val();
      let timeLodge = parseInt($("#o_estVaLoge").val(), 10);
      if (isNaN(timeLodge) || timeLodge < 0) timeLodge = 0;
      if (!pseudoEnn || !pseudoC1 || !pseudoC2 || !t1 || !t2) {
        $.toast({
          ...TOAST_ERROR,
          text: "Pseudo de l'ennemi, des 2 cibles et leurs heures de touche sont requis.",
        });
        return false;
      }
      this.estimateAttackSpeed(pseudoEnn, pseudoC1, pseudoC2, t1, t2, timeLodge);
      return false;
    });
    $("#o_estVaUtiliser").click(() => {
      let attackSpeed = $("#o_estVaUtiliser").data("va");
      let ennemi = $("#o_estVaUtiliser").data("ennemi");
      if (attackSpeed === undefined) return false;
      $("#o_vaTemps").spinner("value", attackSpeed);
      $("#o_indicationTemps").text(this.computeTimeLimit(attackSpeed));
      if (ennemi && !$("#o_pseudoTemps").val()) $("#o_pseudoTemps").val(ennemi);
      return false;
    });
    return this;
  }
  /**
   *
   */
  computeTimeLimit(attackSpeed) {
    return Utils.intToTime(Math.pow(0.9, attackSpeed) * 637200);
  }
  /**
   * Estimates a player's attack speed from two successive attacks.
   * Assumption: between landing on target 1 and landing on target 2 the player
   * travels target1→lodge then lodge→target2, so T2−T1 = t(va,d1) + tempsLoge +
   * t(va,d2).
   */
  estimateAttackSpeed(pseudoEnn, pseudoC1, pseudoC2, t1, t2, timeLodge) {
    let ennemi = new Player({ pseudo: pseudoEnn });
    let c1 = new Player({ pseudo: pseudoC1 });
    let c2 = new Player({ pseudo: pseudoC2 });
    Promise.all([ennemi.getProfile(), c1.getProfile(), c2.getProfile()]).then((values) => {
      ennemi.loadProfile(values[0]);
      c1.loadProfile(values[1]);
      c2.loadProfile(values[2]);
      let dt =
        moment(t2, "DD-MM-YYYY HH:mm").diff(moment(t1, "DD-MM-YYYY HH:mm"), "seconds") - timeLodge;
      if (dt <= 0) {
        this._renderAttackSpeedResult(
          null,
          null,
          "L'écart entre les 2 attaques doit être positif.",
        );
        return;
      }
      let d1 = Math.sqrt(Math.pow(ennemi.x - c1.x, 2) + Math.pow(ennemi.y - c1.y, 2));
      let d2 = Math.sqrt(Math.pow(ennemi.x - c2.x, 2) + Math.pow(ennemi.y - c2.y, 2));
      let facteur = 1 - Math.exp(-d1 / 350) + (1 - Math.exp(-d2 / 350));
      let k = dt / (637200 * facteur);
      if (k <= 0 || k > 1) {
        this._renderAttackSpeedResult(
          null,
          null,
          "Estimation impossible : données incohérentes (vérifiez les coordonnées et les heures).",
        );
        return;
      }
      let attackSpeed = Math.log(k) / Math.log(0.9);
      let arrondi = Math.round(attackSpeed);
      let out = attackSpeed < 0 || attackSpeed > 50;
      this._renderAttackSpeedResult(
        attackSpeed,
        out ? null : arrondi,
        out ? `VA estimée hors plage [0..50] : ${attackSpeed.toFixed(2)}` : null,
        ennemi.pseudo,
      );
    });
    return this;
  }
  /**
   *
   */
  _renderAttackSpeedResult(attackSpeed, arrondi, erreur, pseudoEnn?) {
    let row = $("#o_estVaResultatRow");
    let text = $("#o_estVaResultatText");
    let btn = $("#o_estVaUtiliser");
    if (erreur) {
      text.html(`<span class="red">${erreur}</span>`);
      btn.hide();
    } else {
      text.html(
        `Vitesse d'attaque estimée : <strong>${attackSpeed.toFixed(2)}</strong> (arrondi : <strong>${arrondi}</strong>) `,
      );
      btn
        .data("va", arrondi)
        .data("ennemi", pseudoEnn || "")
        .show();
    }
    row.show();
  }
  /**
   *
   */
  computeTime(ref, players, lastMvt = "", delayCaptureSec = 60) {
    let promise = new Array();
    // promise fetching the reference player's profile
    if (!ref.isCurrentPlayer()) promise.push(ref.getProfile());
    // promise fetching the players
    for (let player of players) promise.push(player.getProfile());
    // run the requests
    Promise.all(promise).then((values) => {
      let rows = new Array(),
        ind = 0;
      // load the reference player's data
      if (!ref.isCurrentPlayer()) {
        ref.loadProfile(values[ind]);
        ind++;
      }
      // a launch time can be computed when the reference is the enemy to catch, not me
      const captureAllowed = lastMvt && !ref.isCurrentPlayer();
      const timeMoiVersRef = captureAllowed ? getProfile().getTravelTimeTo(ref) : 0;
      const maintenant = moment();
      // compute the travel times to the players
      for (let i = 0; i < players.length; i++) {
        players[i].loadProfile(values[i + ind]);
        let timeP = ref.getTravelTimeTo(players[i]);
        let retour = lastMvt ? moment(lastMvt, "DD-MM-YYYY HH:mm").add(timeP, "s") : null;
        let cellReturn = retour ? retour.format("D MMM à HH[h]mm[m]ss[s]") : "";
        let cellLaunch = "";
        let rowClass = "";
        if (captureAllowed && retour) {
          let launchLe = retour.clone().add(delayCaptureSec, "s").subtract(timeMoiVersRef, "s");
          let faisable = launchLe.isAfter(maintenant);
          cellLaunch = launchLe.format("D MMM à HH[h]mm[m]ss[s]");
          rowClass = faisable ? "o_capFaisable" : "o_capTropTard";
        }
        rows.push(
          $(
            `<tr${rowClass ? ` class="${rowClass}"` : ""}><td>${players[i].pseudo}</td><td>${numeral(players[i].terrain).format()}</td><td>${Utils.intToTime(timeP)}</td><td>${cellReturn}</td><td>${cellLaunch}</td></tr>`,
          )[0],
        );
      }
      // render the distance table
      $("#o_infosTemps").DataTable().clear().rows.add(rows).draw();
    });
    return this;
  }
  /**
   *
   */
  renderTime() {
    $("#o_calculatriceCombat").after(
      `<br/><table id='o_infosTemps'><thead style="background-color:${getProfile().parametre["couleur2"].valeur}"><tr><th>Pseudo</th><th>Terrain</th><th>Temps de trajet</th><th>Retour le</th><th>Lancer à</th></tr></thead></table>`,
    );
    $("#o_infosTemps").DataTable({
      bInfo: false,
      bAutoWidth: false,
      dom: "Bfrtip",
      buttons: ["copyHtml5", "csvHtml5", "excelHtml5"],
      pageLength: 15,
      responsive: true,
      order: [[1, "desc"]],
      language: {
        zeroRecords: "Aucune information trouvée",
        infoEmpty: "Aucun enregistrement",
        infoFiltered: "(Filtré par _MAX_ enregistrements)",
        search: "Rechercher : ",
        paginate: {
          previous: "Préc.",
          next: "Suiv.",
        },
      },
      columnDefs: [
        { type: "quantite-grade", targets: 1, visible: false },
        { type: "moment-D MMM YYYY", targets: 3 },
        { type: "moment-D MMM YYYY", targets: 4 },
        { type: "time-unformat", targets: 2 },
      ],
      rowCallback: (row, data, index) => {
        let bg = index % 2 == 0 ? "inherit" : getProfile().parametre["couleur2"].valeur;
        if ($(row).hasClass("o_capFaisable")) bg = "#d6f5d6";
        else if ($(row).hasClass("o_capTropTard")) bg = "#f5d6d6";
        $(row).css("background-color", bg);
      },
      drawCallback: (settings) => {
        $(".o_content a, .o_content table, .o_content label").css(
          "color",
          getProfile().parametre["couleurTexte"].valeur,
        );
      },
    });
    return this;
  }
}
