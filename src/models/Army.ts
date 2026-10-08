/*
 * Army.ts
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
  UNIT_TIME,
  UNIT_HP,
} from "~/constants";
import { Utils } from "~/lib/Utils";
import { getProfile } from "~/models/currentPlayer";
import { simulateHunts, type HuntInput } from "~/models/HuntSimulation";
// Deliberate import cycle (used inside methods only, never at module level): Army ↔ SentAttack.
import { SentAttack } from "~/models/SentAttack";
import * as session from "~/storage/session";

/**
 * Holds and manipulates an army.
 *
 * @class Army
 * @constructor
 */
export class Army {
  // Fields declared for TypeScript (Phase 2 was a straight conversion; real
  // typing is deferred — see .claude/plans/wxt-migration-followups.md).
  _unit: any;
  _jsnCount: any;
  _floods: any;
  _distribution: any;
  constructor(settings: any = {}) {
    /**
     * Unit counts, indexed by unit type.
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
     * Saved JSN count, used when launching hunts.
     *
     * @private
     * @property nbrJSN
     * @type integer
     */
    this._jsnCount = 0;
    /**
     * per-flood distribution table.
     *
     * @private
     * @property floods
     * @type array
     */
    this._floods = new Array();
    /**
     * Army split across the floods or the hunts.
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
   * Fetches the player's army with an ajax call.
   *
   * @private
   * @method getArmy
   */
  getArmy() {
    return $.ajax({ url: location.origin + "/Armee.php" });
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
   * Returns a summary of the army.
   *
   * @private
   * @method function toString() { [native code] }
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
   * Parses an army written as text into an Army.
   *
   * @private
   * @method function toString() { [native code] }
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
    // Order matters: without it, Top soldiers gets replaced by Top unite5, which is the soldier.
    let ordre = new Array(0, 2, 1, 3, 9, 4, 8, 7, 6, 5, 11, 10, 13, 12);
    // initialise the unit counts
    this._unit = new Array(14).fill(0);
    // match the incoming text
    texte = texte.replace(interdit, "");
    for (let i = 0; i < unite.length; i++)
      texte = texte.replace(unite[ordre[i]], "{separateur}unite" + ordre[i] + "{separateur}");
    texte = texte.replace(kilo, "$1 000");
    texte = texte.replace(mega, "$1 000 000");
    texte = texte.replace(giga, "$1 000 000 000");
    texte = texte.replace(tera, "$1 000 000 000 000");

    let textSplit = texte.split("{separateur}");
    // check whether the first split holds digits
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
   * Computes the army's total unit count.
   *
   * @private
   * @method getTotalUnits
   * @return {Integer} la somme des unités
   */
  getTotalUnits() {
    return this._unit.reduce((acc, val) => {
      return acc + Math.ceil(val);
    }, 0);
  }
  /**
   * Computes the army's spawn time from the spawn speed.
   *
   * @private
   * @method getTime
   * @param {Integer} vitesse de ponte
   * @return {Integer} nombre de secondes
   */
  getTime(spawnTech) {
    return this._unit.reduce((acc, val, i) => {
      return acc + val * UNIT_TIME[i + 1] * Math.pow(0.9, spawnTech);
    }, 0);
  }
  /**
   * Computes the base hit points.
   *
   * @private
   * @method getBaseHp
   * @return {Integer} Points de vie hors bonus.
   */
  getBaseHp() {
    return this._unit.reduce((acc, val, i) => {
      return acc + val * UNIT_HP[i + 1];
    }, 0);
  }
  /**
   * Computes the bonus hit points.
   *
   * @private
   * @method getHpBonus
   * @param {Integer} bonus
   * @return {Integer} Points de vie avec bonus bouclier
   */
  getHpBonus(bonus) {
    return Math.round((this.getBaseHp() * bonus) / 10);
  }
  /**
   * Computes the hit points bonus granted by the place.
   *
   * @private
   * @method getPlaceHpBonus
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
   * Computes the army's total hit points.
   *
   * @private
   * @method getTotalHp
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
   * Computes the base attack points.
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
   * Computes the attack points including the bonus.
   *
   * @private
   * @method getAttackBonus
   * @param {Integer} bonus
   * @return {Integer} Points de combat avec bonus.
   */
  getAttackBonus(bonus) {
    return Math.round((this.getBaseAtt() * bonus) / 10);
  }
  /**
   * Computes the army's total attack points.
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
   * Computes the base defense points.
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
   * Computes the defense points including the bonus.
   *
   * @private
   * @method getDefenseBonus
   * @param {Integer} bonus
   * @return {Integer} Points de défense avec bonus.
   */
  getDefenseBonus(bonus) {
    return Math.round((this.getBaseDef() * bonus) / 10);
  }
  /**
   * Computes the army's total defense points.
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
   * Computes the army's food consumption.
   *
   * @private
   * @method getConsumption
   * @param {Integer} lieu
   * @return {Integer} Consommation de l'armée.
   */
  getConsumption(place) {
    return this._unit.reduce((acc, val, i) => {
      return acc + val * UNIT_COST[i + 1] * 0.05 * place;
    }, 0);
  }
  /**
   * Sets the army's JSN count.
   *
   * @private
   * @method setJsn
   * @param {Integer} count
   * @return
   */
  setJsn(count) {
    this._unit[0] = this._jsnCount - count;
  }

  /* ------------------------------------------------------------------ */
  /* ---- Hunting ----------------------------------------------------- */
  /* ------------------------------------------------------------------ */

  /**
   * Runs the hunt simulator on this army and keeps the unit split for
   * sendHunt. See models/HuntSimulation.ts.
   *
   * @private
   * @method simulateHunt
   * @param {Object} input everything simulateHunts needs but the army and levels
   * @return {Object} the simulation result
   */
  simulateHunt(input: Omit<HuntInput, "units" | "weapons" | "shield">) {
    let result = simulateHunts({
      ...input,
      units: this._unit,
      weapons: getProfile().niveauRecherche[2],
      shield: getProfile().niveauRecherche[1],
    });
    this._distribution = result.hunts.map((h) => h.units);
    return result;
  }
  /**
   * Form fields of AcquerirTerrain.php for one hunt. The game numbers its units
   * in its own order, not the UNIT_NAMES one used by Army.unite.
   *
   * @static
   * @method huntPayload
   * @param {Integer} terrainHunt
   * @param {Array} units unit counts, Army.unite order
   * @param {String} securite the form's token, as "name=value"
   * @return {Object}
   */
  static huntPayload(terrainHunt, units, securite) {
    let donnees = {};
    donnees["" + securite.split("=")[0]] = securite.split("=")[1];
    donnees["ChoixArmee"] = "1";
    donnees["AcquerirTerrain"] = terrainHunt;
    [0, 1, 2, 3, 4, 5, 7, 8, 9, 10, 12, 13, 11, 6].forEach(
      (u, i) => (donnees["unite" + (i + 1)] = units[u]),
    );
    return donnees;
  }
  /**
   * Sends a hunt.
   *
   * @private
   * @method sendHunt
   * @param {Integer} indice
   * @param {String} securite
   */
  sendHunt(terrainHunt, countHunt, indice, intervalle, securite) {
    if (indice < countHunt) {
      let donnees = Army.huntPayload(terrainHunt, this._distribution[indice], securite);
      // Requete
      $.post(location.origin + "/AcquerirTerrain.php", donnees, (data) => {
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
  /* ---- Flooding ---------------------------------------------------- */
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
    // the anti-probe is still placed, to keep the order
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
   * Maximises the terrain captured from a target, given the unit count and the number of attacks.
   *
   * @private
   * @method optimizeFlood
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
   * Spreads the army across the requested floods.
   *
   * @private
   * @method distributeFloodUnits
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
   * Simulates how units are placed for the chosen flood method.
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
    // Reserve: these units are taken out of the available pool before simulating.
    // distributeFloodUnits() leaves them untouched in this._unit.
    // When "Suivre antisondes" is ticked, the reserve follows the anti-probes
    // (ground + dome); otherwise the value entered by the player is used.
    let reserve = getProfile().parametre["reserveFloodAuto"].valeur
      ? getProfile().parametre["uniteAntisondeTerrain"].valeur +
        getProfile().parametre["uniteAntisondeDome"].valeur
      : getProfile().parametre["reserveFlood"].valeur;
    // an object is needed to pass this around the various functions
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
    // Place according to the chosen method
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
    // Place every remaining unit
    if (indSupp != -1 && data.unite > 0) this._floods[indSupp] += data.unite;
    // simulating also prepares the unit split used at launch
    this.distributeFloodUnits();
    return this._floods;
  }
  /**
   * Sends a flood.
   *
   * @private
   * @method sendFlood
   * @param {Integer} indice
   * @param {String} securite
   */
  sendFlood(idTarget, indice, securite) {
    // more attacks left to send
    if (indice < this._floods.length) {
      // attack is not empty
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
        $.post(location.origin + "/ennemie.php?Attaquer=" + idTarget, donnees, (data) => {
          let res = Utils.parseHtml(data).find("center:last").text();
          $("#o_simulationFlood tr:eq(" + (indice + 2) + ")").addClass(
            res.indexOf("Vos troupes sont en marche") == -1 ? "red" : "green",
          );
          // record the confirmed attack for the per-target summary
          // (the place is always the ground: a flood sends lieu=1)
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
        });
      } else // move on to the next attack
      this.sendFlood(idTarget, ++indice, securite);
    } else {
      // End of the flood: go to Armee.php to put the anti-probe back
      // (ArmyPage picks this flag up and calls repositionArmy() by itself).
      session.setRaw("outiiil_floodPuisReplacer", "1");
      window.location.href = "/Armee.php";
    }
  }

  /* ------------------------------------------------------------------ */
  /* ---- Battles ----------------------------------------------------- */
  /* ------------------------------------------------------------------ */

  /**
   *
   */
  removeLoss(countUnit) {
    // Remove units until the total reaches 0
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
