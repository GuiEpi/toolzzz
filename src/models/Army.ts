/*
 * Armee.ts
 * Hraesvelg
 **********************************************************************/

import { $, numeral } from "~/vendor";
import {
  UNIT_ATTACK,
  UNIT_COST,
  UNIT_DEFENSE,
  PLACE,
  UNIT_NAMES,
  UNIT_NAMES_PLURAL,
  HUNT_UNIT_ORDER,
  HUNT_XP_ORDER,
  HUNT_LOSS_MAX,
  HUNT_LOSS_MIN,
  HUNT_LOSS_AVG,
  HUNT_RATIO,
  UNIT_TIME,
  UNIT_HP,
} from "~/constants";
import { Utils } from "~/lib/Utils";
import { getProfile } from "~/models/currentPlayer";
// Cycle d'import volontaire (usage dans les méthodes uniquement, jamais au niveau module) : Armee ↔ AttaqueLancee.
import { SentAttack } from "~/models/SentAttack";
import * as session from "~/storage/session";

/**
 * Classe de gestion de l'armée.
 *
 * @class Armee
 * @constructor
 */
export class Army {
  // Champs déclarés pour TypeScript (Phase 2 : conversion telle quelle, le
  // typage fin est reporté — cf. .claude/plans/wxt-migration-followups.md).
  _unit: any;
  _jsnCount: any;
  _floods: any;
  _distribution: any;
  constructor(settings: any = {}) {
    /**
     * Tableau du nombre des unités.
     *
     * @private
     * @property unite
     * @type array
     */
    this._unit = new Array(14).fill(0);
    if (settings.hasOwnProperty("unite"))
      for (let i = 0; i < 14; i++)
        if (settings.unite.hasOwnProperty(UNIT_NAMES[i + 1]))
          this._unit[i] = settings.unite[UNIT_NAMES[i + 1]];
    /**
     * Sauvegarde du nombre de JSN pour le lancement des chasses.
     *
     * @private
     * @property nbrJSN
     * @type integer
     */
    this._jsnCount = 0;
    /**
     * tableau de la repartition des floods.
     *
     * @private
     * @property floods
     * @type array
     */
    this._floods = new Array();
    /**
     * Repartition de l'armée en fonction des floods ou des chasses.
     *
     * @private
     * @property repartition
     * @type array
     */
    this._distribution = new Array();
  }
  /**
   *
   */
  get unite() {
    return this._unit;
  }
  /**
   *
   */
  set unite(newUnit) {
    this._unit = newUnit;
  }
  /**
   *
   */
  get nbrJSN() {
    return this._jsnCount;
  }
  /**
   *
   */
  set nbrJSN(count) {
    this._jsnCount = count;
  }
  /**
   *
   */
  get floods() {
    return this._floods;
  }
  /**
   *
   */
  set floods(newFloods) {
    this._floods = newFloods;
  }
  /**
   *
   */
  get repartition() {
    return this._distribution;
  }
  /**
   * Récupére l'armée du joueur via un appel ajax.
   *
   * @private
   * @method getArmee
   */
  getArmy() {
    return $.ajax({ url: "http://" + Utils.serveur + ".fourmizzz.fr/Armee.php" });
  }
  /**
   *
   */
  loadData(html) {
    $(html)
      .find(".simulateur tr[align='center']:lt(14)")
      .each((i, elt) => {
        let label = $(elt).find(".pas_sur_telephone").text();
        if (label)
          $(elt)
            .find("td span")
            .each((i2, elt2) => {
              this._unit[UNIT_NAMES.indexOf(label) - 1] += parseInt(
                $(elt2)
                  .text()
                  .replace(/[^0-9]/g, ""),
              );
            });
      });
    this._jsnCount = this._unit[0];
    return this;
  }
  /**
   * Donne le compte rendu de l'armée.
   *
   * @private
   * @method toString
   * @return {String} description
   */
  toString() {
    let s = "";
    this._unit.forEach((elt, ind) => {
      return (s += elt
        ? numeral(elt).format() +
          " " +
          (elt > 1 ? UNIT_NAMES_PLURAL[ind + 1] : UNIT_NAMES[ind + 1]) +
          ", "
        : "");
    });
    return s.slice(0, -2) + ".";
  }
  /**
   * Convertie une armée sous forme de chaine de caractére en l'objet Armee.
   *
   * @private
   * @method toString
   * @param {String} armee au format string.
   */
  parseArmy(texte) {
    let RegExpiryAllSaufChiffre = new RegExp("[^0-9]", "g"); //Capture tout sauf les chiffres
    let unite0 = new RegExp(
      "(\\bgs\\b)|(Goules? Sauvages?)|(\\bjsn\\b)|(Jeunes? Soldates? Naines?)|(Young dwarf)|(Young dwarves)",
      "gi",
    );
    let unite1 = new RegExp(
      "(\\bg\\b)|(Goules?)|(\\bsn\\b)|(Soldates? Naines?)|(Dwarf)|(Dwarves)",
      "gi",
    );
    let unite2 = new RegExp(
      "(\\bcd?g\\b)|(Chefs? des Goules?)|(\\bne\\b)|(Naines? d')|(Naines? d’)|(Top dwarf)|(Top dwarves)",
      "gi",
    );
    let unite3 = new RegExp(
      "(\\bmer?\\b)|(Mercenaires?)|(\\bjs\\b)|(Jeunes? Soldates?)|(Young soldiers?)",
      "gi",
    );
    let unite4 = new RegExp("(\\bpil?\\b)|(Pillards?)|(\\bs\\b)|(Soldates?)|(Soldiers?)", "gi");
    let unite5 = new RegExp(
      "(\\pro?\\b)|(Protectrons?)|(\\bc\\b)|(Concierges?)|(doorkeepers?)",
      "gi",
    );
    let unite6 = new RegExp(
      "(\\bce\\b)|(Concierges? d')|(Concierges? d’)|(Top doorkeepers?)",
      "gi",
    );
    let unite7 = new RegExp("(\\bmut?\\b)|(Mutants?)|(\\ba\\b)|(Artilleuses?)|(Fire ants?)", "gi");
    let unite8 = new RegExp(
      "(\\bsm\\b)|(\\bsmut?\\b)|(Supers? Mutants?)|(\\bae\\b)|(Artilleuses? d')|(Artilleuses? d’)|(Top fire ants?)",
      "gi",
    );
    let unite9 = new RegExp(
      "(\\bcom?\\b)|(Commandos?)|(\\bse\\b)|(Soldates? d')|(Soldates? d’)|(Top soldiers?)",
      "gi",
    );
    let unite10 = new RegExp("(\\bnu?\\b)|(Nucleotrons?)|(\\bta\\b)|(\\btk\\b)|(Tanks?)", "gi");
    let unite11 = new RegExp("(\\btae\\b)|(\\btke\\b)|(Tanks? d')|(Tanks? d’)|(Top tanks?)", "gi");
    let unite12 = new RegExp("(\\bche?\\b)|(Chevaliers?)(\\btu\\b)|(Tueuses?)|(Killers?)", "gi");
    let unite13 = new RegExp(
      "(\\bpa?\\b)|(Paladins?)|(\\btue\\b)|(Tueuses? d'?)|(Tueuses? d’?)|(Top killers?)",
      "gi",
    );
    let unite = new Array(
      unite0,
      unite1,
      unite2,
      unite3,
      unite4,
      unite5,
      unite6,
      unite7,
      unite8,
      unite9,
      unite10,
      unite11,
      unite12,
      unite13,
    );
    let interdit = new RegExp(
      "(Vos raiders.*secondes?)|(Vos chasseuses.*secondes?)|(Vous allez attaquer.*secondes?)|(inflige.*\.)|(Arriv.*[0-9]{2}h[0-9]{2})|(\\(s\\))",
      "gi",
    );
    let kilo = new RegExp("([0-9]+)k\\b|(kilos?)", "gi");
    let mega = new RegExp("([0-9]+)m\\b|(megas?)", "gi");
    let giga = new RegExp("([0-9]+)g\\b|(gigas?)", "gi");
    let tera = new RegExp("([0-9]+)t\\b|(teras?)", "gi");
    // L'ordre est important car sans lui �a va remplacer Top soldiers par Top unite5 qui est le soldier.
    let ordre = new Array(0, 2, 1, 3, 9, 4, 8, 7, 6, 5, 11, 10, 13, 12);
    // initialistion du nombre d'unité
    this._unit = new Array(14).fill(0);
    // on match le texte d'entrée
    texte = texte.replace(interdit, "");
    for (let i = 0; i < unite.length; i++)
      texte = texte.replace(unite[ordre[i]], "{separateur}unite" + ordre[i] + "{separateur}");
    texte = texte.replace(kilo, "$1 000");
    texte = texte.replace(mega, "$1 000 000");
    texte = texte.replace(giga, "$1 000 000 000");
    texte = texte.replace(tera, "$1 000 000 000 000");

    let textSplit = texte.split("{separateur}");
    // On regarde si il y a des chiffres dans le premier split
    let decalage = textSplit[0].replace(RegExpiryAllSaufChiffre, "").length > 0 ? -1 : 1;

    let temp: any = "";
    for (let i = 0; i < textSplit.length; i++) {
      for (let j = unite.length - 1; j >= 0; j--) {
        if (textSplit[i].indexOf("unite" + j) >= 0) {
          if (textSplit[i + decalage].indexOf("\t") < 0) {
            temp = parseInt(textSplit[i + decalage].replace(RegExpiryAllSaufChiffre, ""));
            if (isNaN(temp)) temp = 0;
            this._unit[j] += temp;
          } else {
            let splitQuantity = textSplit[i + decalage].split("\t");
            for (let k = 0; k < splitQuantity.length; k++) {
              temp = parseInt(splitQuantity[k].replace(RegExpiryAllSaufChiffre, ""), 10);
              if (isNaN(temp)) temp = 0;
              this._unit[j] += temp;
            }
          }
          break;
        }
      }
    }
    return this;
  }
  /**
   * calcul le nombre d'unité de l'armee.
   *
   * @private
   * @method getSommeUnite
   * @return {Integer} la somme des unités
   */
  getTotalUnits() {
    return this._unit.reduce((acc, val) => {
      return acc + Math.ceil(val);
    }, 0);
  }
  /**
   * calcul le temps de ponte de l'armée en fonction de la vitesse de ponte.
   *
   * @private
   * @method getTemps
   * @param {Integer} vitesse de ponte
   * @return {Integer} nombre de secondes
   */
  getTime(spawnTech) {
    return this._unit.reduce((acc, val, i) => {
      return acc + val * UNIT_TIME[i + 1] * Math.pow(0.9, spawnTech);
    }, 0);
  }
  /**
   * calcul le nombre de point de vie de base.
   *
   * @private
   * @method getBaseVie
   * @return {Integer} Points de vie hors bonus.
   */
  getBaseHp() {
    return this._unit.reduce((acc, val, i) => {
      return acc + val * UNIT_HP[i + 1];
    }, 0);
  }
  /**
   * calcul le nombre de point de vie bonus.
   *
   * @private
   * @method getBonusVie
   * @param {Integer} bonus
   * @return {Integer} Points de vie avec bonus bouclier
   */
  getHpBonus(bonus) {
    return Math.round((this.getBaseHp() * bonus) / 10);
  }
  /**
   * calcul le nombre de point de vie bonus du lieu.
   *
   * @private
   * @method getBonusLieuVie
   * @param {Integer} bonus
   * @param {Integer} lieu
   * @return {Integer} Points de vie avec bonus bouclier et dome ou loge.
   */
  getPlaceHpBonus(bonus, place) {
    if (place == PLACE.DOME) return Math.round(this.getBaseHp() * ((bonus + 2) / 20));
    if (place == PLACE.LOGE) return Math.round(this.getBaseHp() * (((bonus + 2) * 3) / 20));
    else return 0;
  }
  /**
   * calcul le nombre de point de vie total de l'armée.
   *
   * @private
   * @method getTotalVie
   * @param {Integer} bonus
   * @param {Integer} lieu
   * @param {Integer} bonusPlace
   * @return {Integer} Somme des points de vie de l'armée.
   */
  getTotalHp(bonus, place = PLACE.TERRAIN, bonusPlace = 0) {
    return this.getBaseHp() + this.getHpBonus(bonus) + this.getPlaceHpBonus(bonusPlace, place);
  }
  /**
   *
   */
  getNonXpBaseHp() {
    let tabNonXp = [1, 2, 4, 5, 6, 8, 11, 13];
    return this._unit.reduce((acc, val, i) => {
      return tabNonXp.includes(i + 1) ? acc + val * UNIT_HP[i + 1] : acc;
    }, 0);
  }
  /**
   *
   */
  getNonXpHpBonus(bonus) {
    return Math.round((this.getNonXpBaseHp() * bonus) / 10);
  }
  /**
   *
   */
  getNonXpTotalHp(bonus) {
    return this.getNonXpBaseHp() + this.getNonXpHpBonus(bonus);
  }
  /**
   * calcul le nombre de point d'attaque de base.
   *
   * @private
   * @method getBaseAtt
   * @return {Integer} Points de combat hors bonus.
   */
  getBaseAtt() {
    return this._unit.reduce((acc, val, i) => {
      return acc + val * UNIT_ATTACK[i + 1];
    }, 0);
  }
  /**
   * calcul le nombre de point d'attaque avec bonus.
   *
   * @private
   * @method getBonusAtt
   * @param {Integer} bonus
   * @return {Integer} Points de combat avec bonus.
   */
  getAttackBonus(bonus) {
    return Math.round((this.getBaseAtt() * bonus) / 10);
  }
  /**
   * calcul le nombre de point d'attaque total de l'armée.
   *
   * @private
   * @method getTotalAtt
   * @param {Integer} bonus
   * @return {Integer} Somme des points de combat de l'armée.
   */
  getTotalAtt(bonus) {
    return this.getBaseAtt() + this.getAttackBonus(bonus);
  }
  /**
   *
   */
  getNonXpBaseAtt() {
    let tabNonXp = [1, 2, 4, 5, 6, 8, 11, 13];
    return this._unit.reduce((acc, val, i) => {
      return tabNonXp.includes(i + 1) ? acc + val * UNIT_ATTACK[i + 1] : acc;
    }, 0);
  }
  /**
   *
   */
  getNonXpAttackBonus(bonus) {
    return Math.round((this.getNonXpBaseAtt() * bonus) / 10);
  }
  /**
   *
   */
  getNonXpTotalAtt(bonus) {
    return this.getNonXpBaseAtt() + this.getNonXpAttackBonus(bonus);
  }
  /**
   * calcul le nombre de point en défense de base.
   *
   * @private
   * @method getBaseDef
   * @return {Integer} Points de défense hors bonus.
   */
  getBaseDef() {
    return this._unit.reduce((acc, val, i) => {
      return acc + val * UNIT_DEFENSE[i + 1];
    }, 0);
  }
  /**
   * calcul le nombre de point en défense avec bonus.
   *
   * @private
   * @method getBonusDef
   * @param {Integer} bonus
   * @return {Integer} Points de défense avec bonus.
   */
  getDefenseBonus(bonus) {
    return Math.round((this.getBaseDef() * bonus) / 10);
  }
  /**
   * calcul le nombre de point en défense total de l'armée.
   *
   * @private
   * @method getTotalDef
   * @param {Integer} bonus
   * @return {Integer} Somme des points de défense de l'armée.
   */
  getTotalDef(bonus) {
    return this.getBaseDef() + this.getDefenseBonus(bonus);
  }
  /**
   *
   */
  getNonXpBaseDef() {
    let tabNonXp = [1, 2, 4, 5, 6, 8, 11, 13];
    return this._unit.reduce((acc, val, i) => {
      return tabNonXp.includes(i + 1) ? acc + val * UNIT_DEFENSE[i + 1] : acc;
    }, 0);
  }
  /**
   *
   */
  getNonXpDefenseBonus(bonus) {
    return Math.round((this.getNonXpBaseDef() * bonus) / 10);
  }
  /**
   *
   */
  getNonXpTotalDef(bonus) {
    return this.getNonXpBaseDef() + this.getNonXpDefenseBonus(bonus);
  }
  /**
   * calcul la consommation en nourriture de l'armée.
   *
   * @private
   * @method getConsommation
   * @param {Integer} lieu
   * @return {Integer} Consommation de l'armée.
   */
  getConsumption(place) {
    return this._unit.reduce((acc, val, i) => {
      return acc + val * UNIT_COST[i + 1] * 0.05 * place;
    }, 0);
  }
  /**
   * Modifier le nombre de JSN de l'armée.
   *
   * @private
   * @method setJSN
   * @param {Integer} count
   * @return
   */
  setJsn(count) {
    this._unit[0] = this._jsnCount - count;
  }

  /* ------------------------------------------------------------------ */
  /* ---- Méthode pour chasser ---------------------------------------- */
  /* ------------------------------------------------------------------ */

  /**
   * calcul le nombre de chasse et le terrain par chasse en fonction de la difficulté du terrain de depart et du nombre de chasse restante.
   *
   * @private
   * @method calculChasse
   * @param {Integer} huntingGroundDep
   * @param {Float} diffHunt
   * @param {Integer} fixCount
   * @param {Integer} fixHF
   * @param {Integer} reste
   * @return {Object} Objet avec le nombre de chasse et le terrain par chasse.
   */
  computeHunt(huntingGroundDep, diffHunt, fixCount, fixHF, reste) {
    let iHuntCm2 = fixHF ? fixHF : Math.round((huntingGroundDep * 3) / 10);
    let iHuntCount = fixCount ? fixCount : 1;
    // Try to set the number of hunt.
    if (!fixCount)
      while (
        this.computeRatio(huntingGroundDep, iHuntCount + 1, iHuntCm2) >= diffHunt &&
        iHuntCount < reste
      )
        iHuntCount += 1;
    // If the hunt is too difficult, try to reduce hunted amount.
    if (!fixHF) {
      let bBoucle = iHuntCm2 > 5000000000000;
      for (let j = 5000000000000; j > 4; j = j / 10) {
        bBoucle = iHuntCm2 > j;
        if (bBoucle)
          bBoucle =
            this.computeRatio(huntingGroundDep, iHuntCount, iHuntCm2 - j) < diffHunt &&
            iHuntCm2 > 1;
        while (bBoucle) {
          iHuntCm2 -= j;
          bBoucle = iHuntCm2 > j;
          if (bBoucle)
            bBoucle =
              this.computeRatio(huntingGroundDep, iHuntCount, iHuntCm2 - j) < diffHunt &&
              iHuntCm2 > 1;
        }
      }
      bBoucle = iHuntCm2 > 1;
      if (bBoucle)
        bBoucle =
          this.computeRatio(huntingGroundDep, iHuntCount, iHuntCm2 - 1) < diffHunt && iHuntCm2 > 1;
      while (bBoucle) {
        iHuntCm2 -= 1;
        bBoucle = iHuntCm2 > 1;
        if (bBoucle)
          bBoucle =
            this.computeRatio(huntingGroundDep, iHuntCount, iHuntCm2 - 1) < diffHunt &&
            iHuntCm2 > 1;
      }
      // if the hunt is easier than specified, try to increase hunt amount.
      for (let j = 5000000000000; j > 4; j = j / 10)
        while (this.computeRatio(huntingGroundDep, iHuntCount, iHuntCm2 + j) >= diffHunt)
          iHuntCm2 += j;
      while (this.computeRatio(huntingGroundDep, iHuntCount, iHuntCm2 + 1) >= diffHunt)
        iHuntCm2 += 1;
    }
    return { NB: iHuntCount, HF: iHuntCm2 };
  }
  /**
   * calcul le rapport entre la force de frappe et la difficulté
   *
   * @private
   * @method calculRatio
   * @param {Integer} huntingGroundDep
   * @param {Integer} countHunt
   * @param {Integer} terrainHunt
   * @return {Float} ratio de la chasse
   */
  computeRatio(huntingGroundDep, countHunt, terrainHunt) {
    return (
      this.getTotalAtt(getProfile().niveauRecherche[2]) /
      this.computeDifficulty(huntingGroundDep, countHunt, terrainHunt)
    );
  }
  /**
   * calcul la référence du ratio donné en paramétre si la chasse est paramétre manuellement.
   *
   * @private
   * @method calculRefRatio
   * @param {Float} ratio
   * @return {Float} indice du ratio
   */
  computeRatioRef(ratio) {
    return HUNT_RATIO.reduce((prev, curr) => {
      return Math.abs(curr - ratio) < Math.abs(prev - ratio) ? curr : prev;
    });
  }
  /**
   * calcul la difficulté de la chasse.
   *
   * @private
   * @method calculDifficulte
   * @param {Integer} huntingGroundDep
   * @param {Integer} countHunt
   * @param {Integer} terrainHunt
   * @return {Float} Difficulté de la chasse.
   */
  computeDifficulty(huntingGroundDep, countHunt, terrainHunt) {
    let dDiff = 0,
      dStart;
    for (let iIter = 0; iIter < countHunt; iIter++) {
      dStart = huntingGroundDep + terrainHunt * iIter;
      dDiff +=
        (terrainHunt + dStart * 0.01) *
        Math.pow(1.04, Math.round(Math.log(dStart / 50) / Math.log(Math.pow(10, 0.1)))) *
        3;
    }
    return dDiff;
  }
  /**
   * calcul la difficulté par chasse.
   *
   * @private
   * @method calculDifficultes
   * @param {Integer} huntingGroundDep
   * @param {Integer} countHunt
   * @param {Integer} terrainHunt
   * @return {Array}
   */
  computeDifficulties(huntingGroundDep, countHunt, terrainHunt) {
    let dTabDiff = new Array(),
      dStart;
    for (let iIter = 0; iIter < countHunt; iIter++) {
      dStart = huntingGroundDep + terrainHunt * iIter;
      dTabDiff[iIter] =
        (terrainHunt + dStart * 0.01) *
        Math.pow(1.04, Math.round(Math.log(dStart / 50) / Math.log(Math.pow(10, 0.1)))) *
        3;
    }
    return dTabDiff;
  }
  /**
   * calcul les pertes minimales, maximales et moyennes en fonction de la difficulté de la chasse.
   *
   * @private
   * @method calculPerte
   * @param {Float} ratioIndex
   * @param {Float} diff
   * @return {Object} les pertes MIN, MAX et AVG
   */
  computeLoss(ratioIndex, diff) {
    return {
      MIN: ((HUNT_LOSS_MIN[ratioIndex] * diff) / (10 + getProfile().niveauRecherche[1])) * 10,
      MAX: ((HUNT_LOSS_MAX[ratioIndex] * diff) / (10 + getProfile().niveauRecherche[1])) * 10,
      AVG: ((HUNT_LOSS_AVG[ratioIndex] * diff) / (10 + getProfile().niveauRecherche[1])) * 10,
    };
  }
  /**
   * Répartie l'armée sur les chasses souhaitées.
   *
   * @private
   * @method repartirUniteChasse
   * @param {Integer} countHunt
   * @param {Float} diff
   * @param {Array} tabDiff
   * @param {Float} refMaxLoss
   * @param {Float} securityFactor
   * @return
   */
  distributeHuntUnits(countHunt, diff, tabDiff, refMaxLoss, securityFactor) {
    this._distribution = new Array();
    // Available units.
    let iTabAvailableUnits = this._unit.slice();

    for (let iHuntNum = countHunt - 1; iHuntNum >= 0; iHuntNum--) {
      // Initialise unit array for this hunt.
      this._distribution[iHuntNum] = new Array(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
      // Base attack of units to send for this hunt.
      let iHuntBaseAtt = (tabDiff[iHuntNum] / diff) * this.getBaseAtt();
      // Check for available Xp-able units.
      let bXp = false;
      for (let j = 0; j < HUNT_XP_ORDER.length; j++)
        bXp = bXp || iTabAvailableUnits[HUNT_XP_ORDER[j]] > 0;
      // compute YD number. If Xp : Max * factor, Else dispatch
      // between lasting hunts according to difficulty.
      if (bXp)
        this._distribution[iHuntNum][0] = Math.round(
          ((refMaxLoss * tabDiff[iHuntNum]) / (10 + getProfile().niveauRecherche[1])) *
            10 *
            securityFactor,
        );
      else {
        let iDiffLet = tabDiff[iHuntNum];
        for (let iHL = iHuntNum - 1; iHL >= 0; iHL--) iDiffLet += tabDiff[iHL];
        this._distribution[iHuntNum][0] = Math.round(
          (iTabAvailableUnits[0] * tabDiff[iHuntNum]) / iDiffLet,
        );
      }
      // Deal with last hunt and check the round do not give more unit
      // than available.
      if (
        !iHuntNum ||
        this._distribution[iHuntNum][0] > iTabAvailableUnits[0] ||
        this._distribution[iHuntNum][0] < 0
      )
        this._distribution[iHuntNum][0] = iTabAvailableUnits[0];
      // Decrease lasting YD by the amount allocated to this hunt.
      iTabAvailableUnits[0] -= this._distribution[iHuntNum][0];
      // Decrease also required Att for this hunt
      iHuntBaseAtt -= this._distribution[iHuntNum][0] * UNIT_ATTACK[1];
      // Dispatch other units.
      for (let j = 0; j < 13; j++) {
        // Get unit index in dispatch order.
        let u = HUNT_UNIT_ORDER[j];
        if (iTabAvailableUnits[u] > 0 && iHuntBaseAtt > 0) {
          if (iTabAvailableUnits[u] * UNIT_ATTACK[u + 1] > iHuntBaseAtt)
            this._distribution[iHuntNum][u] = Math.round(iHuntBaseAtt / UNIT_ATTACK[u + 1]);
          else this._distribution[iHuntNum][u] = iTabAvailableUnits[u];
          // Deal with last hunt and check the round do not give
          // more unit than available.
          if (
            !iHuntNum ||
            this._distribution[iHuntNum][u] > iTabAvailableUnits[u] ||
            this._distribution[iHuntNum][u] < 0
          )
            this._distribution[iHuntNum][u] = iTabAvailableUnits[u];
          // Decrease lasting units
          iTabAvailableUnits[u] -= this._distribution[iHuntNum][u];
          // Decrease also required Att for this hunt
          iHuntBaseAtt -= this._distribution[iHuntNum][u] * UNIT_ATTACK[u + 1];
        }
      }
      // Si il maque de la force de frappe, malgré le placement des unités on utilise des JSN
      //			if(iHuntBaseAtt > 0){
      //				this._repartition[iHuntNum][0] += Math.round(iHuntBaseAtt / ATT_UNITE[1]);
      //                if(!iHuntNum || this._repartition[iHuntNum][0] > iTabAvailableUnits[0] || this._repartition[iHuntNum][0] < 0)
      //				    this._repartition[iHuntNum][0] = iTabAvailableUnits[0];
      //				iTabAvailableUnits[0] -= this._repartition[iHuntNum][0];
      //			}
    }
  }
  /**
   * Retourne la repartition des unités pour la chasse demandée.
   *
   * @private
   * @method simulerChasse
   * @param {Integer} huntingGroundDep
   * @param {Integer} countHunt
   * @param {Integer} terrainHunt
   * @param {Float} diffHunt
   * @param {Integer} fixCount
   * @param {Integer} fixHF
   * @param {Integer} reste
   * @return
   */
  simulateHunt(huntingGroundDep, countHunt, terrainHunt, diffHunt, fixCount, fixHF, reste) {
    let iTabHunt = this.computeHunt(huntingGroundDep, diffHunt, fixCount, fixHF, reste),
      dDiff = this.computeDifficulty(huntingGroundDep, iTabHunt["NB"], iTabHunt["HF"]),
      iTabLoss = this.computeLoss(HUNT_RATIO.indexOf(parseFloat(diffHunt)), dDiff);
    if ($("#o_chasseNbrAuto").is(":checked")) {
      $("#o_chasseNbr").spinner("value", iTabHunt["NB"]);
      countHunt = iTabHunt["NB"];
    }
    if ($("#o_chasseTDCRepAuto").is(":checked")) {
      $("#o_chasseTDCRep").spinner("value", iTabHunt["HF"]);
      terrainHunt = iTabHunt["HF"];
    }
    let ratio = this.computeRatio(huntingGroundDep, countHunt, terrainHunt);
    this.distributeHuntUnits(
      countHunt,
      this.computeDifficulty(huntingGroundDep, countHunt, terrainHunt),
      this.computeDifficulties(huntingGroundDep, countHunt, terrainHunt),
      HUNT_LOSS_MAX[HUNT_RATIO.indexOf(this.computeRatioRef(ratio))],
      1.0,
    );
    return {
      repartition: this._distribution,
      nbChasse: countHunt,
      terrainChasse: terrainHunt,
      ratio: ratio,
      ratioRef: this.computeRatioRef(ratio).toFixed(1),
      iTabPerte: iTabLoss,
    };
  }
  /**
   * Envoie une chasse.
   *
   * @private
   * @method envoyerChasse
   * @param {Integer} indice
   * @param {String} securite
   */
  sendHunt(terrainHunt, countHunt, indice, intervalle, securite) {
    if (indice < countHunt) {
      let donnees = {};
      donnees["" + securite.split("=")[0]] = securite.split("=")[1];
      donnees["ChoixArmee"] = "1";
      donnees["AcquerirTerrain"] = terrainHunt;
      donnees["unite1"] = this._distribution[indice][0];
      donnees["unite2"] = this._distribution[indice][1];
      donnees["unite3"] = this._distribution[indice][2];
      donnees["unite4"] = this._distribution[indice][3];
      donnees["unite5"] = this._distribution[indice][4];
      donnees["unite6"] = this._distribution[indice][5];
      donnees["unite7"] = this._distribution[indice][7];
      donnees["unite8"] = this._distribution[indice][8];
      donnees["unite9"] = this._distribution[indice][9];
      donnees["unite10"] = this._distribution[indice][10];
      donnees["unite11"] = this._distribution[indice][12];
      donnees["unite12"] = this._distribution[indice][13];
      donnees["unite13"] = this._distribution[indice][11];
      donnees["unite14"] = this._distribution[indice][6];
      // Requete
      $.post("http://" + Utils.serveur + ".fourmizzz.fr/AcquerirTerrain.php", donnees, (data) => {
        if (data.indexOf("La chasse est lancée.") > -1)
          $("#o_simulationChasse tr:eq(" + (indice + 1) + ")").html(
            `<td class='green'>${indice + 1}</td><td colspan='14' class='green'>La chasse est lancée.</td>`,
          );
        else
          $("#o_simulationChasse tr:eq(" + (indice + 1) + ")").html(
            `<td class='red'>${indice + 1}</td><td colspan='14' class='red'>La chasse n'a pas pu être lancée.</td>`,
          );
        setTimeout(() => {
          this.sendHunt(terrainHunt, countHunt, ++indice, intervalle, securite);
        }, intervalle);
      });
    } else // on a fini, on recharge la page
    location.reload();
  }

  /* ------------------------------------------------------------------ */
  /* ---- Méthode pour Flooder ---------------------------------------- */
  /* ------------------------------------------------------------------ */

  /**
   *
   */
  placeAntiProbe(dataFlood) {
    if (dataFlood.attaques[0]) {
      let captureMax = Math.floor(dataFlood.tdcCible * 0.2);
      captureMax = dataFlood.attaques[0] > captureMax ? captureMax : dataFlood.attaques[0];
      dataFlood.tdcAtt += captureMax;
      dataFlood.tdcCible -= captureMax;
      dataFlood.unite -= dataFlood.attaques[0];
      dataFlood.reste--;
    }
    // on place l'antisonde quand même pour garder l'ordre
    this._floods.push(dataFlood.attaques[0]);
  }
  /**
   *
   */
  standardFlood(dataFlood) {
    let prise = 0,
      captureMax = 0;
    for (let i = 1; i < dataFlood.attaques.length; i++) {
      prise = dataFlood.unite >= dataFlood.attaques[i] ? dataFlood.attaques[i] : dataFlood.unite;
      captureMax = Math.floor(dataFlood.tdcCible * 0.2);
      captureMax = prise > captureMax ? captureMax : prise;
      this._floods.push(prise);
      dataFlood.tdcAtt += captureMax;
      dataFlood.tdcCible -= captureMax;
      dataFlood.unite -= prise;
      dataFlood.reste--;
      if (dataFlood.unite <= 0 || dataFlood.reste == 0) break;
    }
  }
  /**
   * Optimisation de la prise de terrain sur une cible en fonction du nombre d'unité et du nombre d'attaque.
   *
   * @private
   * @method optimiserFlood
   * @param {Integer} tdcAtt
   * @param {Integer} tdcCible
   * @param {Integer} unite
   * @param {Integer} reste
   */
  optimizeFlood(dataFlood) {
    let prise = 0;
    // -20% -20% -20%
    while (dataFlood.tdcAtt < Math.floor(dataFlood.tdcCible * 1.4) && dataFlood.reste > 0) {
      prise = Math.floor(dataFlood.tdcCible * 0.2);
      prise = dataFlood.unite >= prise ? prise : dataFlood.unite;
      this._floods.push(prise);
      dataFlood.tdcAtt += prise;
      dataFlood.tdcCible -= prise;
      dataFlood.unite -= prise;
      dataFlood.reste--;
      if (dataFlood.unite <= 0) return;
    }
    if (dataFlood.reste > 1) {
      // limite
      let limit = Math.floor((dataFlood.tdcCible * 2 - dataFlood.tdcAtt) / 3) - 1;
      limit = limit && dataFlood.unite >= limit ? limit : dataFlood.unite;
      this._floods.push(limit);
      dataFlood.tdcAtt += limit;
      dataFlood.tdcCible -= limit;
      dataFlood.unite -= limit;
      dataFlood.reste--;
      if (dataFlood.unite <= 0) return;
    }
    if (dataFlood.reste > 0) {
      // dernier
      prise = Math.floor(dataFlood.tdcCible * 0.2);
      prise = dataFlood.unite >= prise ? prise : dataFlood.unite;
      this._floods.push(prise);
      dataFlood.tdcAtt += prise;
      dataFlood.tdcCible -= prise;
      dataFlood.unite -= prise;
      dataFlood.reste--;
    }
  }
  /**
   *
   */
  decreasingFlood(dataFlood) {
    let prise = 0,
      countFlood = dataFlood.reste;
    for (let i = 0; i < countFlood; i++) {
      prise = Math.floor(dataFlood.tdcCible * 0.2);
      prise = dataFlood.unite >= prise ? prise : dataFlood.unite;
      this._floods.push(prise);
      dataFlood.tdcAtt += prise;
      dataFlood.tdcCible -= prise;
      dataFlood.unite -= prise;
      dataFlood.reste--;
      if (dataFlood.unite <= 0) break;
    }
  }
  /**
   *
   */
  uniformFlood(dataFlood) {
    let prise = 0,
      captureMax = 0,
      countFlood = dataFlood.reste;
    for (let i = 0; i < countFlood; i++) {
      prise = dataFlood.unite >= dataFlood.tdcUniforme ? dataFlood.tdcUniforme : dataFlood.unite;
      captureMax = Math.floor(dataFlood.tdcCible * 0.2);
      captureMax = prise > captureMax ? captureMax : prise;
      this._floods.push(prise);
      dataFlood.tdcAtt += captureMax;
      dataFlood.tdcCible -= captureMax;
      dataFlood.unite -= prise;
      dataFlood.reste--;
      if (dataFlood.unite <= 0) break;
    }
  }
  /**
   * Répartie l'armée sur les floods souhaitées.
   *
   * @private
   * @method repartirUniteFlood
   */
  distributeFloodUnits() {
    this._distribution = new Array();
    // Available units.
    let iTabAvailableUnits = this._unit.slice(),
      floods = this._floods.slice();
    floods.forEach((f, i, tabFloods) => {
      this._distribution[i] = new Array(14).fill(0);
      iTabAvailableUnits.forEach((unite, j, tabUnit) => {
        if (unite) {
          this._distribution[i][j] = tabUnit[j] >= tabFloods[i] ? tabFloods[i] : tabUnit[j];
          tabFloods[i] -= this._distribution[i][j];
          tabUnit[j] -= this._distribution[i][j];
          if (!tabFloods[i]) return false;
        }
      });
    });
  }
  /**
   * Simule le placement des unités pour une methode de flood choisie.
   *
   * @private
   * @method calculeFlood
   */
  simulateFlood(
    huntingGroundAtt,
    huntingGroundTarget,
    methode,
    attacks,
    huntingGroundUniform,
    reste,
    indSupp,
  ) {
    this._floods = new Array();
    // Réserve : on retire ces unités du pool dispo avant simulation.
    // repartirUniteFlood() les laissera intactes dans this._unite.
    // Si « Suivre antisondes » est coché, la réserve s'aligne dynamiquement sur les antisondes
    // (terrain + dôme) — sinon on prend la valeur saisie par l'utilisateur.
    let reserve = getProfile().parametre["reserveFloodAuto"].valeur
      ? getProfile().parametre["uniteAntisondeTerrain"].valeur +
        getProfile().parametre["uniteAntisondeDome"].valeur
      : getProfile().parametre["reserveFlood"].valeur;
    // on a besoin d'un objet pour le passer au différentes fonctions
    let data = {
      attaques: attacks,
      tdcUniforme: huntingGroundUniform,
      tdcAtt: huntingGroundAtt,
      tdcCible: huntingGroundTarget,
      unite: Math.max(0, this.getTotalUnits() - reserve),
      reste: reste,
    };
    // Placement de l'antisonde
    this.placeAntiProbe(data);
    if (data.unite <= 0) return this._floods;
    // Placement selon la méthode
    switch (methode) {
      case "0": // defini manuellement
        this.standardFlood(data);
        break;
      case "1": // Opti
        this.optimizeFlood(data);
        break;
      case "2": // uniforme
        this.uniformFlood(data);
        break;
      case "3": // Degressive
        this.decreasingFlood(data);
        break;
      default:
        break;
    }
    // Placement de toute les unités si il en reste
    if (indSupp != -1 && data.unite > 0) this._floods[indSupp] += data.unite;
    // des qu'on simule on prepare la repartition des unités pour le lancement
    this.distributeFloodUnits();
    return this._floods;
  }
  /**
   * Envoie un flood.
   *
   * @private
   * @method envoyerFlood
   * @param {Integer} indice
   * @param {String} securite
   */
  sendFlood(idTarget, indice, securite) {
    // si on a encore des attaques à lancer
    if (indice < this._floods.length) {
      // si l'attaque est différente de 0
      if (this._floods[indice]) {
        let donnees = {};
        donnees["" + securite.split("=")[0]] = securite.split("=")[1];
        donnees["ChoixArmee"] = "1";
        donnees["lieu"] = "1"; //$("input[name=o_domeFlood]:checked").val() == "Oui" ? "2" : "1";
        donnees["pseudoCible"] = $("input[name=pseudoCible]").val();
        donnees["unite1"] = this._distribution[indice][0];
        donnees["unite2"] = this._distribution[indice][1];
        donnees["unite3"] = this._distribution[indice][2];
        donnees["unite4"] = this._distribution[indice][3];
        donnees["unite5"] = this._distribution[indice][4];
        donnees["unite6"] = this._distribution[indice][5];
        donnees["unite7"] = this._distribution[indice][7];
        donnees["unite8"] = this._distribution[indice][8];
        donnees["unite9"] = this._distribution[indice][9];
        donnees["unite10"] = this._distribution[indice][10];
        donnees["unite11"] = this._distribution[indice][12];
        donnees["unite12"] = this._distribution[indice][13];
        donnees["unite13"] = this._distribution[indice][11];
        donnees["unite14"] = this._distribution[indice][6];
        // Requete
        $.post(
          "http://" + Utils.serveur + ".fourmizzz.fr/ennemie.php?Attaquer=" + idTarget,
          donnees,
          (data) => {
            let res = Utils.parseHtml(data).find("center:last").text();
            $("#o_simulationFlood tr:eq(" + (indice + 2) + ")").addClass(
              res.indexOf("Vos troupes sont en marche") == -1 ? "red" : "green",
            );
            // capture de l'attaque confirmée pour le récapitulatif par cible
            // (lieu toujours le terrain : le flood envoie lieu=1)
            if (res.indexOf("Vos troupes sont en marche") != -1 && SentAttack.contexteFlood) {
              let unite = {};
              this._distribution[indice].forEach((count, ind) => {
                if (count) unite[UNIT_NAMES[ind + 1]] = count;
              });
              SentAttack.record(SentAttack.contexteFlood.cible, "Terrain de chasse", unite, {
                html: data,
                terrain: SentAttack.contexteFlood.terrain,
              });
            }
            setTimeout(() => {
              this.sendFlood(idTarget, ++indice, securite);
            }, 1000);
          },
        );
      } else // on passe à l'attaque suivante
      this.sendFlood(idTarget, ++indice, securite);
    } else {
      // Fin du flood : on enchaîne sur Armee.php pour replacer l'antisonde
      // (PageArmee détecte ce flag et appelle replacerArmee() automatiquement).
      session.setRaw("outiiil_floodPuisReplacer", "1");
      window.location.href = "/Armee.php";
    }
  }

  /* ------------------------------------------------------------------ */
  /* ---- Méthode pour les combats ------------------------------------ */
  /* ------------------------------------------------------------------ */

  /**
   *
   */
  removeLoss(countUnit) {
    // Tant que le total n'est pas 0 on retire les unites
    this._unit.every((elt, ind) => {
      if (elt >= countUnit) {
        this._unit[ind] -= countUnit;
        return false;
      } else {
        countUnit -= elt;
        this._unit[ind] = 0;
        return true;
      }
    });
    return this;
  }
}
