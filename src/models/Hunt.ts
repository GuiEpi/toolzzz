/*
 * Chasse.ts
 * Hraesvelg
 **********************************************************************/

import { numeral } from "~/vendor";
import { IMG_ATT, IMG_DEF, IMG_HP, UNIT_NAMES } from "~/constants";
import { Utils } from "~/lib/Utils";
import { getProfile } from "~/models/currentPlayer";
import { Army } from "~/models/Army";

/**
 * Classe de fonction pour l'analyse d'un rapport de chasse, herite des fonctions de la classe Rapport.
 *
 * @class Chasse
 * @constructor
 * @extends Rapport
 */
export class Hunt {
  // Champs déclarés pour TypeScript (Phase 2 : conversion telle quelle, le
  // typage fin est reporté — cf. .claude/plans/wxt-migration-followups.md).
  _battleReport: any;
  _armyBefore: any;
  _armyLost: any;
  _armyAfter: any;
  constructor(battleReport) {
    /**
     *
     */
    this._battleReport = battleReport;
    /**
     *
     */
    this._armyBefore = new Army();
    /**
     *
     */
    this._armyLost = new Army();
    /**
     *
     */
    this._armyAfter = new Army();
  }
  /**
   *
   */
  get armeeAv() {
    return this._armyBefore;
  }
  /**
   *
   */
  get armeePe() {
    return this._armyLost;
  }
  /**
   *
   */
  get armeeAp() {
    return this._armyAfter;
  }
  /**
   * Calcule le niveau d'armes en fonction des degats.
   *
   * @private
   * @method getArmes
   * @param {Integer} fdf de base
   * @param {Integer} fdf avec bonus
   * @return {Integer} le niveau d'armes
   */
  computeWeapons(base, bonus) {
    return Math.round((bonus / base) * 10);
  }
  /**
   * Calcule le niveau du bouclier.
   *
   * @private
   * @method getBouclier
   * @param {Integer} degat
   * @param {Object} armee1
   * @param {Object} armee2
   * @return {Integer} le niveau de bouclier
   */
  computeShield(degat, armee1, armee2) {
    let hpPerdue = armee1.getBaseHp() - armee2.getBaseHp();
    return Math.round(((degat - hpPerdue) / hpPerdue) * 10);
  }
  /**
   * Retourne l'armée en retirant d'aprés le rapport les unités perdues suivant le texte.
   *
   * @private
   * @method retirePerte
   * @param {Object} army
   * @return {Object} armee perdue
   */
  removeLoss(army) {
    let res = new Army(),
      tmp = this._battleReport.split("et en tue"),
      total = 0;
    res.unite = army.unite.slice(0);
    // Si le rc à plusieurs tours on additionne d'abords les pertes.
    for (let i = 1; i < tmp.length; total += parseInt(tmp[i++].split(".")[0].replace(/ /g, "")));
    // Tant que le total n'est pas 0 on retire les unités
    for (let i = 0; i < 14; i++) {
      if (res.unite[i] >= total) {
        res.unite[i] -= total;
        break;
      } else {
        total -= res.unite[i];
        res.unite[i] = 0;
      }
    }
    return res;
  }
  /**
   * Retourne l'armée en ajoutant l'xp.
   *
   * @private
   * @method ajouteXP
   * @param {Object} army
   * @return {Object} armee avec XP
   */
  addXp(army) {
    let res = new Army(),
      tmp = this._battleReport.split("- "),
      tableXp = [-1, 1, 2, -1, 4, 9, 6, -1, 8, -1, -1, 11, -1, 13, -1];
    res.unite = army.unite.slice(0);
    // Pour chaques types d'unitées qui ont XP.
    for (let i = 1, l = tmp.length; i < l; i++) {
      let unitXp = UNIT_NAMES.indexOf(
          tmp[i].replace(/[0-9]/g, "").split("sont")[0].replace(/s /g, " ").trim(),
        ),
        qteXp = parseInt(tmp[i].replace(/ /g, ""));
      res.unite[unitXp - 1] -= qteXp;
      res.unite[tableXp[unitXp]] += qteXp;
    }
    return res;
  }
  /**
   * Récupére l'armée, les pertes et l'xp d'un rapport de chasse.
   *
   * @private
   * @method analyse
   */
  analyze() {
    let motKey = new Array("Troupes en attaque : ", "et en tue");
    if (
      motKey.some((substring) => {
        return this._battleReport.includes(substring);
      })
    ) {
      this._armyBefore.parseArmy(
        this._battleReport.split("Troupes en attaque : ")[1].split(".")[0],
      );
      this._armyLost = this.removeLoss(this._armyBefore);
      this._armyAfter = this.addXp(this._armyLost);
      return true;
    }
    return false;
  }
  /**
   * Ajoute les données des chasses pour faire un bilan.
   *
   * @private
   * @method ajoute
   * @param {Object} hunt
   */
  add(hunt) {
    for (let i = 0; i < 14; i++) {
      this._armyBefore.unite[i] += hunt.armeeAv.unite[i];
      this._armyLost.unite[i] += hunt.armeePe.unite[i];
      this._armyAfter.unite[i] += hunt.armeeAp.unite[i];
    }
    return this;
  }
  /**
   *
   */
  toMessagesHtml() {
    let spawnTech = getProfile().getSpawnTech(),
      totalUnit = this._armyLost.getTotalUnits() - this._armyBefore.getTotalUnits(),
      baseAtt = this._armyAfter.getBaseAtt() - this._armyBefore.getBaseAtt(),
      baseDef = this._armyAfter.getBaseDef() - this._armyBefore.getBaseDef(),
      baseHp = this._armyAfter.getBaseHp() - this._armyBefore.getBaseHp(),
      bonusAtt =
        this._armyAfter.getTotalAtt(getProfile().niveauRecherche[2]) -
        this._armyBefore.getTotalAtt(getProfile().niveauRecherche[2]),
      bonusDef =
        this._armyAfter.getTotalDef(getProfile().niveauRecherche[2]) -
        this._armyBefore.getTotalDef(getProfile().niveauRecherche[2]),
      bonusHp =
        this._armyAfter.getTotalHp(getProfile().niveauRecherche[1]) -
        this._armyBefore.getTotalHp(getProfile().niveauRecherche[1]),
      pAtt = ((baseAtt * 100) / this._armyBefore.getBaseAtt()).toFixed(2),
      pDef = ((baseDef * 100) / this._armyBefore.getBaseDef()).toFixed(2),
      pHp = ((baseHp * 100) / this._armyBefore.getBaseHp()).toFixed(2);
    return `<p class='retour'>Perte HOF : ${Utils.intToTime(this._armyBefore.getTime(0) - this._armyLost.getTime(0))} - Perte (TDP ${spawnTech}) : ${Utils.intToTime(this._armyBefore.getTime(spawnTech) - this._armyLost.getTime(spawnTech))}</p>
            <table class='o_tabAnalyse right' cellspacing='0'>
			<tr><td><img width='35' src='images/icone/icone_ouvriere.png' alt='nb_unite'/></td><td colspan='2' style='padding-left:10px'>${numeral(totalUnit).format()}</td><td style='padding-left:10px'>${((totalUnit * 100) / this._armyBefore.getTotalUnits()).toFixed(2)}%</td></tr>
			<tr><td>${IMG_HP}</td><td class='right'>${(baseHp > 0 ? "+" : "") + numeral(baseHp).format()}(HB)</td><td class='right'>${(bonusHp > 0 ? "+" : "") + numeral(bonusHp).format()}(AB)</td><td style='padding-left:10px'>${(Number(pHp) > 0 ? "+" : "") + pHp}%</td></tr>
			<tr><td>${IMG_ATT}</td><td style='padding-left:10px' class='right'>${(baseAtt > 0 ? "+" : "") + numeral(baseAtt).format()}(HB)</td><td style='padding-left:10px' class='right'>${(bonusAtt > 0 ? "+" : "") + numeral(bonusAtt).format()}(AB)</td><td style='padding-left:10px'>${(Number(pAtt) > 0 ? "+" : "") + pAtt}%</td></tr>
			<tr><td>${IMG_DEF}</td><td class='right'>${(baseDef > 0 ? "+" : "") + numeral(baseDef).format()}(HB)</td><td class='right'>${(bonusDef > 0 ? "+" : "") + numeral(bonusDef).format()}(AB)</td></td><td style='padding-left:10px'>${(Number(pDef) > 0 ? "+" : "") + pDef}%</td></tr>
			</table>`;
  }
  /**
   *
   */
  toBoxHtml(bVisible) {
    let diffCount = this._armyAfter.getTotalUnits() - this._armyBefore.getTotalUnits(),
      diffHp = this._armyAfter.getBaseHp() - this._armyBefore.getBaseHp(),
      diffAtt = this._armyAfter.getBaseAtt() - this._armyBefore.getBaseAtt(),
      diffDef = this._armyAfter.getBaseDef() - this._armyBefore.getBaseDef();
    let html = `<tr ${bVisible ? "" : "style='display:none'"}><td><img height='20' src='images/icone/fourmi.png'/></td><td>${numeral(this._armyBefore.getTotalUnits()).format()}</td><td><img height='20' src='images/icone/fourmi.png'/></td><td>${numeral(diffCount).format("+0,0")} (${numeral(diffCount / this._armyBefore.getTotalUnits()).format("+0.00%")})</td><td><img height='20' src='images/icone/fourmi.png'/></td><td>${numeral(this._armyAfter.getTotalUnits()).format()}</td></tr>
            <tr ${bVisible ? "" : "style='display:none'"}><td>${IMG_HP}</td><td>${numeral(this._armyBefore.getBaseHp()).format()}</td><td>${IMG_HP}</td><td>${numeral(diffHp).format("+0,0")} (${numeral(diffHp / this._armyBefore.getBaseHp()).format("+0.00%")})</td><td>${IMG_HP}</td><td>${numeral(this._armyAfter.getBaseHp()).format()}</td></tr>
			<tr ${bVisible ? "" : "style='display:none'"}><td>${IMG_ATT}</td><td>${numeral(this._armyBefore.getBaseAtt()).format()}</td><td>${IMG_ATT}</td><td>${numeral(diffAtt).format("+0,0")} (${numeral(diffAtt / this._armyBefore.getBaseAtt()).format("+0.00%")})</td><td>${IMG_ATT}</td><td>${numeral(this._armyAfter.getBaseAtt()).format()}</td></tr>
			<tr ${bVisible ? "" : "style='display:none'"}><td>${IMG_DEF}</td><td>${numeral(this._armyBefore.getBaseDef()).format()}</td><td>${IMG_DEF}</td><td>${numeral(diffDef).format("+0,0")} (${numeral(diffDef / this._armyBefore.getBaseDef()).format("+0.00%")})</td><td>${IMG_DEF}</td><td>${numeral(this._armyAfter.getBaseDef()).format()}</td></tr>`;
    return html;
  }
}
