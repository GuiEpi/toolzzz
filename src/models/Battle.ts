/*
 * Combat.ts
 * Hraesvelg
 **********************************************************************/

import { moment, numeral } from "~/vendor";
import { IMG_ATT, IMG_DEF, IMG_HP, PLACE_LABELS, PLACE, UNIT_NAMES, UNIT_HP } from "~/constants";
import { Utils } from "~/lib/Utils";
import { getProfile } from "~/models/currentPlayer";
import { ReportBox } from "~/boxes/Report";
import { Army } from "~/models/Army";
import { Player } from "~/models/Player";

/**
 * Classe de fonction pour l'analyse d'un rapport de combat, herite des fonctions de la classe Rapport.
 *
 * @class Combat
 * @constructor
 * @extends Rapport
 */
export class Battle {
  // Champs déclarés pour TypeScript (Phase 2 : conversion telle quelle, le
  // typage fin est reporté — cf. .claude/plans/wxt-migration-followups.md).
  _id: any;
  _battleReport: any;
  _place: any;
  _dateTime: any;
  _pointOfView: any;
  _attacker: any;
  _attackerPlaceBonus: any;
  _armyBefore: any;
  _armyLost: any;
  _armyAfter: any;
  _defender: any;
  _defenderPlaceBonus: any;
  _defenderSpawnTech: any;
  _enemyArmyBefore: any;
  _enemyArmyAfter: any;
  _turn: any;
  constructor(settings: any = {}) {
    /**
     * id du RC dans la messagerie sinon un datetime pour l'analyse dans la boite ou la simulation
     */
    this._id = settings["id"] || -1;
    /**
     * texte correspondant au RC pour l'analyse
     */
    this._battleReport = settings["RC"] || "";
    /**
     * lieu du combat
     */
    this._place = settings["lieu"] || 0;
    /**
     * dateheure du RC seulement pour l'analyse dans la messagerie
     */
    this._dateTime = settings["dateHeure"] || -1;
    /**
     * si on est attaquant ou defenseur
     * 0 : attaquant
     * 1 : defenseur
     */
    this._pointOfView = settings["pointDeVue"] || 0;
    /**
     * attaquant dans le combat
     */
    this._attacker = new Player({ pseudo: "Attaquant" });
    /*
     * pour l'analyse on peut calculer plusieurs solutions de bonus
     */
    this._attackerPlaceBonus = new Array();
    /**
     * armée du joueur 1 correspondant au vous
     */
    this._armyBefore = settings["attaquant"] || new Army();
    /**
     * armee du joueur 1 aprés combat
     */
    this._armyLost = null;
    /**
     * armée du joueur 1 aprés combat avec xp
     */
    this._armyAfter = null;
    /**
     * defenseur dans le combat
     */
    this._defender = new Player({ pseudo: "Défenseur" });
    /*
     * pour l'analyse on peut calculer plusieurs solutions de bonus
     */
    this._defenderPlaceBonus = new Array();
    /**
     *
     */
    this._defenderSpawnTech = new Array();
    /**
     * arméee du joueur 2 avant combat
     */
    this._enemyArmyBefore = settings["defenseur"] || new Army();
    /**
     * armée du joueur 2 aprés combat
     */
    this._enemyArmyAfter = null;
    /**
     *
     */
    this._turn = new Array();
  }
  /**
   *
   */
  get place() {
    return this._place;
  }
  /**
   *
   */
  set place(newPlace) {
    this._place = newPlace;
  }
  /**
   *
   */
  get position() {
    return this._pointOfView;
  }
  /**
   *
   */
  set position(newPosition) {
    this._pointOfView = newPosition;
  }
  /**
   *
   */
  get attaquant() {
    return this._attacker;
  }
  /**
   *
   */
  set attaquant(newPlayer) {
    this._attacker = newPlayer;
  }
  /**
   *
   */
  get defenseur() {
    return this._defender;
  }
  /**
   *
   */
  set defenseur(newPlayer) {
    this._defender = newPlayer;
  }
  /**
   *
   */
  get armee1() {
    return this._armyBefore;
  }
  /**
   *
   */
  set armee1(newArmy) {
    this._armyBefore = newArmy;
  }
  /**
   *
   */
  get armee1Ap() {
    return this._armyAfter;
  }
  /**
   *
   */
  set armee1Ap(newArmy) {
    this._armyAfter = newArmy;
  }
  /**
   *
   */
  get armee2() {
    return this._enemyArmyBefore;
  }
  /**
   *
   */
  set armee2(newArmy) {
    this._enemyArmyBefore = newArmy;
  }
  /**
   *
   */
  get armee2Ap() {
    return this._enemyArmyAfter;
  }
  /**
   *
   */
  set armee2Ap(newArmy) {
    this._enemyArmyAfter = newArmy;
  }
  /**
   *
   */
  get bonusAttacker() {
    return this._attackerPlaceBonus;
  }
  /**
   *
   */
  set bonusAttacker(newBonus) {
    this._attackerPlaceBonus = newBonus;
  }
  /**
   *
   */
  get bonusDefenseur() {
    return this._defenderPlaceBonus;
  }
  /**
   *
   */
  set bonusDefenseur(newBonus) {
    this._defenderPlaceBonus = newBonus;
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
    return hpPerdue ? Math.round(((degat - hpPerdue) / hpPerdue) * 10) : -1;
  }
  /**
   * Calcule le bonus vie selon le lieu.
   *
   * @private
   * @method getBouclierLieu
   * @param {Integer} degat
   * @param {Object} armee1
   * @param {Object} armee2
   * @param {Integer} weapons
   * @return {String} les solutions possibles.
   */
  computePlaceShield(place, degat, armee1, armee2, weapons) {
    let solution = new Array(),
      hpPerdue = armee1.getBaseHp() - armee2.getBaseHp(),
      tmpPlace = -1;
    switch (place) {
      case 1:
        for (let shield = weapons - 3; shield <= weapons + 2; shield++) {
          tmpPlace = ((degat - hpPerdue) / hpPerdue) * 20 - 2 - 2 * shield;
          if (tmpPlace <= 45 && tmpPlace >= 0) solution.push(shield + "/" + Math.round(tmpPlace));
        }
        break;
      case 2:
        for (let shield = weapons - 3; shield <= weapons + 2; shield++) {
          tmpPlace = (((degat - hpPerdue) / hpPerdue) * 20) / 3 - 2 - (2 * shield) / 3;
          if (Math.abs(tmpPlace - Math.round(tmpPlace)) < 0.2 && tmpPlace <= 45 && tmpPlace >= 0)
            solution.push(shield + "/" + Math.round(tmpPlace));
        }
        break;
      default:
        break;
    }
    return solution;
  }
  /**
   *
   */
  computeSpawnTech(army) {
    let tmpSpawnTech = new Array();
    for (let i = 0; i < 140; i++) {
      let timeSpawn = army.getTime(i) % 60;
      // si le nombre est trés proche de 60 ou de 0
      if (Math.abs(timeSpawn - 60) < 0.01 || timeSpawn < 0.01) tmpSpawnTech.push(i);
    }
    return tmpSpawnTech;
  }
  /**
   * Analyse un rapport sous forme de string.
   *
   * @private
   * @method analyse
   */
  analyze() {
    let motKey = new Array(
      "Troupes en défense : ",
      "Troupes en attaque : ",
      "Vous infligez",
      "ennemie inflige",
      "et en tue",
      "et tuez",
      "dégâts",
    );
    // si le RC contient bien les mots clés
    if (
      motKey.some((substring) => {
        return this._battleReport.includes(substring);
      })
    ) {
      let tmpPseudo = new Array();
      // recup du lieu
      this._place = this._battleReport.includes("Loge")
        ? 2
        : this._battleReport.includes("fourmilière")
          ? 1
          : 0;
      this._attacker.pseudo = "Vous";
      // Récuperation des armées si on nous attaque on est en défense
      if (
        this._battleReport.includes("attaque votre") ||
        this._battleReport.includes("attaque une de vos colonies")
      ) {
        this._pointOfView = 1;
        this._armyBefore.parseArmy(
          this._battleReport.split("Troupes en défense : ")[1].split(".")[0],
        );
        this._enemyArmyBefore.parseArmy(
          this._battleReport.split("Troupes en attaque : ")[1].split(".")[0],
        );
        tmpPseudo = this._battleReport.split(" attaque")[0].split(" ");
        this._defender.pseudo =
          tmpPseudo.length > 1 ? tmpPseudo[tmpPseudo.length - 1] : tmpPseudo[0];
      } else {
        // sinon en attaque
        this._armyBefore.parseArmy(
          this._battleReport.split("Troupes en attaque : ")[1].split(".")[0],
        );
        this._enemyArmyBefore.parseArmy(
          this._battleReport.split("Troupes en défense : ")[1].split(".")[0],
        );
        // attaque attaque sur colonisateur
        if (this._battleReport.includes("mais une armée d'occupation est déjà présente")) {
          this._defender.pseudo = this._battleReport.split("e de ")[1].split(",")[0];
          // attaque normale
        } else if (this._battleReport.includes("Vous attaquez l")) {
          this._defender.pseudo = this._battleReport.split("e de ")[1].split("\nTroupes")[0];
          this._defenderSpawnTech = this.computeSpawnTech(this._enemyArmyBefore);
          // rebellion
        } else {
          this._defender.pseudo = this._battleReport.split("contre ")[1].split("\nTroupes")[0];
        }
      }
      // On calcule l'armée du joueur 1 en sortie
      this._armyLost = this.removeLoss(this._armyBefore, "et en tue");
      this._armyAfter = this.addXp(this._armyLost);
      // On calcule l'armée du joueur 2 en sortie
      this._enemyArmyAfter = this.removeLoss(this._enemyArmyBefore, "et tuez");
      // Calcule du niveau d'arme du "Vous"
      if (this._pointOfView == 1) {
        let tmp1 = this._battleReport.split("Vous infligez")[1].split("dégâts")[0],
          base1 = parseInt(tmp1.split("(")[0].replace(/ /g, "")),
          bonus1 = parseInt(tmp1.split("+")[1].split(")")[0].replace(/ /g, ""));
        this._defender.niveauRecherche[2] = this.computeWeapons(base1, bonus1);
        // Calcule du niveau d'arme de "l'ennemie"
        let tmp2 = this._battleReport.split("ennemie inflige")[1].split("dégâts")[0],
          base2 = parseInt(tmp2.split("(")[0].replace(/ /g, "")),
          bonus2 = parseInt(tmp2.split("+")[1].split(")")[0].replace(/ /g, ""));
        this._attacker.niveauRecherche[2] = this.computeWeapons(base2, bonus2);
        // On peut calculer le bouclier du joueur 2 ("ennemie") si on n'est pas en OS ou qu'on à perdu
        if (
          this._battleReport.split("et tuez").length > 2 ||
          this._battleReport.indexOf("Vous avez gagné") == -1
        ) {
          if (this._battleReport.includes("attaque votre") || this._place == PLACE.TERRAIN)
            this._attacker.niveauRecherche[1] = this.computeShield(
              base1 + bonus1,
              this._enemyArmyBefore,
              this.removeLoss(this._enemyArmyBefore, "et tuez", 2),
            );
          else
            this._attackerPlaceBonus = this.computePlaceShield(
              this._place,
              base1 + bonus1,
              this._enemyArmyBefore,
              this.removeLoss(this._enemyArmyBefore, "et tuez", 2),
              this._defender.niveauRecherche[2],
            );
        }
        // On peut calculer le bouclier du joueur 1 ("vous") si on n'est pas en OS ou qu'on à gagner
        if (
          this._battleReport.split("et en tue").length > 2 ||
          this._battleReport.includes("Vous avez gagné")
        ) {
          if (!this._battleReport.includes("attaque votre") || this._place == PLACE.TERRAIN)
            this._defender.niveauRecherche[1] = this.computeShield(
              base2 + bonus2,
              this._armyBefore,
              this.removeLoss(this._armyBefore, "et en tue", 2),
            );
          else
            this._defenderPlaceBonus = this.computePlaceShield(
              this._place,
              base2 + bonus2,
              this._armyBefore,
              this.removeLoss(this._armyBefore, "et en tue", 2),
              this._attacker.niveauRecherche[2],
            );
        }
      } else {
        let tmp1 = this._battleReport.split("Vous infligez")[1].split("dégâts")[0],
          base1 = parseInt(tmp1.split("(")[0].replace(/ /g, "")),
          bonus1 = parseInt(tmp1.split("+")[1].split(")")[0].replace(/ /g, ""));
        this._attacker.niveauRecherche[2] = this.computeWeapons(base1, bonus1);
        // Calcule du niveau d'arme de "l'ennemie"
        let tmp2 = this._battleReport.split("ennemie inflige")[1].split("dégâts")[0],
          base2 = parseInt(tmp2.split("(")[0].replace(/ /g, "")),
          bonus2 = parseInt(tmp2.split("+")[1].split(")")[0].replace(/ /g, ""));
        this._defender.niveauRecherche[2] = this.computeWeapons(base2, bonus2);
        // On peut calculer le bouclier du joueur 2 ("ennemie") si on n'est pas en OS ou qu'on à perdu
        if (
          this._battleReport.split("et tuez").length > 2 ||
          this._battleReport.indexOf("Vous avez gagné") == -1
        ) {
          if (this._battleReport.includes("attaque votre") || this._place == PLACE.TERRAIN)
            this._defender.niveauRecherche[1] = this.computeShield(
              base1 + bonus1,
              this._enemyArmyBefore,
              this.removeLoss(this._enemyArmyBefore, "et tuez", 2),
            );
          else
            this._defenderPlaceBonus = this.computePlaceShield(
              this._place,
              base1 + bonus1,
              this._enemyArmyBefore,
              this.removeLoss(this._enemyArmyBefore, "et tuez", 2),
              this._defender.niveauRecherche[2],
            );
        }
        // On peut calculer le bouclier du joueur 1 ("vous") si on n'est pas en OS ou qu'on à gagner
        if (
          this._battleReport.split("et en tue").length > 2 ||
          this._battleReport.includes("Vous avez gagné")
        ) {
          if (!this._battleReport.includes("attaque votre") || this._place == PLACE.TERRAIN)
            this._attacker.niveauRecherche[1] = this.computeShield(
              base2 + bonus2,
              this._armyBefore,
              this.removeLoss(this._armyBefore, "et en tue", 2),
            );
          else
            this._attackerPlaceBonus = this.computePlaceShield(
              this._place,
              base2 + bonus2,
              this._armyBefore,
              this.removeLoss(this._armyBefore, "et en tue", 2),
              this._attacker.niveauRecherche[2],
            );
        }
      }
      return true;
    }
    return false;
  }
  /**
   * Analyse un RC d'attaque pour en déduire le multiplicateur de vie effectif
   * du défenseur (lieu + bouclier combinés) et la FdF nécessaire pour one-shot
   * en encaissant la réplique 10%. Inspiré du tableur Calystene XP v1.04
   * (feuille "Auto sur sonde", zone B26-K31).
   *
   * @private
   * @method analyseSonde
   * @return {Object|null} { multiplicateur, vieHB, vieHBx3, vieAB, fdfNecessaire,
   *                         armesEnnemi, defenseAB, repliqueDef10 } ou null si non applicable
   */
  analyzeProbe() {
    if (this._pointOfView !== 0) return null;
    if (!this._enemyArmyBefore || !this._enemyArmyAfter) return null;
    if (this._enemyArmyBefore.getBaseHp() === 0) return null;
    if (this._enemyArmyAfter.getTotalUnits() === 0) return null;
    if (this._battleReport.split("Vous infligez").length < 2) return null;
    if (this._battleReport.split("ennemie inflige").length < 2) return null;
    let tmp1 = this._battleReport.split("Vous infligez")[1].split("dégâts")[0],
      degatBase = parseInt(tmp1.split("(")[0].replace(/ /g, "")),
      degatBonus = parseInt(tmp1.split("+")[1].split(")")[0].replace(/ /g, "")),
      degatTotal = degatBase + degatBonus;
    let hpKilled = 0;
    for (let i = 0; i < 14; i++)
      hpKilled += (this._enemyArmyBefore.unite[i] - this._enemyArmyAfter.unite[i]) * UNIT_HP[i + 1];
    if (hpKilled <= 0) return null;
    let multiplicateur = Math.round((degatTotal / hpKilled) * 2000) / 2000,
      hpHB = this._enemyArmyBefore.getBaseHp(),
      hpHBx3 = hpHB * 3,
      hpAB = hpHB * multiplicateur,
      fdfNecessaire = Math.max(hpHBx3, hpAB);
    let tmp2 = this._battleReport.split("ennemie inflige")[1].split("dégâts")[0],
      defBase = parseInt(tmp2.split("(")[0].replace(/ /g, "")),
      defBonus = parseInt(tmp2.split("+")[1].split(")")[0].replace(/ /g, "")),
      defenseAB = defBase + defBonus,
      weaponsEnnemi = this.computeWeapons(defBase, defBonus),
      retaliationDef10 = defenseAB / 10;
    let mPlace = this._battleReport.match(/Vous attaquez\s+(.+?)\s+de\s+/),
      placeTxt = mPlace ? mPlace[1] : "";
    return {
      multiplicateur,
      hpHB,
      hpHBx3,
      hpAB,
      fdfNecessaire,
      weaponsEnnemi,
      defenseAB,
      retaliationDef10,
      placeTxt,
    };
  }
  /**
   * Retourne l'armée en retirant d'aprés le rapport les unités perdues suivant le texte.
   *
   * @private
   * @method retirerPerte
   * @param {Object} army
   * @param {String} separator
   * @param {String} countTurn on peut choisir de retirer les pertes sur 1 tour ou plusieurs
   * @return {Object} armee perdue
   */
  removeLoss(army, separator, countTurn = 100000) {
    let res = new Army(),
      total = 0;
    res.unite = army.unite.slice(0);
    // Si le rc à plusieurs tours on additionne d'abords les pertes.
    for (
      let i = 1, tmp = this._battleReport.split(separator);
      i < Math.min(tmp.length, countTurn);
      total += parseInt(tmp[i++].split(".")[0].replace(/ /g, ""))
    );
    // Tant que le total n'est pas 0 on retire les unités
    return res.removeLoss(total);
  }
  /**
   * Retourne l'armée en ajoutant l'xp.
   *
   * @private
   * @method ajouterXP
   * @param {Object} army
   * @return {Object} armee avec XP
   */
  addXp(army) {
    let res = new Army();
    res.unite = army.unite.slice(0);
    // Pour chaques types d'unitées qui ont XP.
    for (
      let i = 1,
        tmp = this._battleReport.split("- "),
        tableXp = [-1, 1, 2, -1, 4, 9, 6, -1, 8, -1, -1, 11, -1, 13, -1];
      i < tmp.length;
      i++
    ) {
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
   *
   */
  toMessagesHtml() {
    let bonusEnemy = "";
    if (this._pointOfView == 1)
      bonusEnemy = `${this._attackerPlaceBonus.length ? "Bouclier (/ " + PLACE_LABELS[this._place] + ") : " + this._attackerPlaceBonus.join(" - ") + " | " : this._attacker.niveauRecherche[1] != -1 ? "Bouclier : " + this._attacker.niveauRecherche[1] + " | " : ""}Armes : ${this._attacker.niveauRecherche[2]}`;
    else
      bonusEnemy = `${this._defenderPlaceBonus.length ? "Bouclier (/ " + PLACE_LABELS[this._place] + ") : " + this._defenderPlaceBonus.join(" - ") + " | " : this._defender.niveauRecherche[1] != -1 ? "Bouclier : " + this._defender.niveauRecherche[1] + " | " : ""}Armes : ${this._defender.niveauRecherche[2]}`;
    let html = `<p class='small'>HoF : <span id="temps_hof_total_${this._id}">${Utils.intToTime(this._armyBefore.getTime(0) - this._armyLost.getTime(0) + (this._enemyArmyBefore.getTime(0) - this._enemyArmyAfter.getTime(0)))}</span><br/>Ennemie : <span id="temps_hof_ennemie_${this._id}">${Utils.intToTime(this._enemyArmyBefore.getTime(0) - this._enemyArmyAfter.getTime(0))}</span> - Vous : <span id="temps_hof_vous_${this._id}">${Utils.intToTime(this._armyBefore.getTime(0) - this._armyLost.getTime(0))}</span></p>
            <span style='text-decoration:underline;' class='gras'>Niveau(x)</span><br/>
            <p id="bonus_ennemie_${this._id}">${bonusEnemy}`;
    if (this._armyBefore.getTotalUnits() < 1000 || this._enemyArmyBefore.getTotalUnits() < 1000)
      html += ` <img src='images/attention.gif' alt='attention' title='les unitées sont peut être insuffisantes pour être sur' class='o_vAlign'/> `;
    html += `</p>`;
    // Affichage des TDP possibles
    if (this._defenderSpawnTech.length) {
      html += `<table class='o_tabTDP centre' cellspacing="0"><tr class="gras"><td>TDP</td><td>Temps ponte</td><td>Heure de départ</td></tr>`;
      for (let i = 0; i < this._defenderSpawnTech.length; i++) {
        let timeSpawn = Math.round(this._enemyArmyBefore.getTime(this._defenderSpawnTech[i]));
        html += `<tr><td>${this._defenderSpawnTech[i]}</td><td class="right">${Utils.intToTime(timeSpawn)}</td><td>${moment(this._dateTime, "D[/]M[/]YY[ à ]HH[h]mm").subtract(timeSpawn, "s").format("D MMM YYYY à HH[h]mm")}</td></tr>`;
      }
      html += `</table><br/>`;
    }
    // Affichage des infos sur l'armée restante de l'ennemie
    if (this._enemyArmyAfter.getTotalUnits()) {
      html += `<span style='text-decoration:underline;' class='gras'>Armee (après combat, sans XP)</span><br/><table class='o_tabAnalyse' cellspacing='0'>
				<tr><td><img width='35' src='images/icone/icone_ouvriere.png' alt='nb_unite' class='o_vAlign'/></td><td class='right'>${numeral(this._enemyArmyAfter.getTotalUnits()).format()}</td>
				<td class='right' style='width:30px;'>${IMG_HP}</td><td class='right'>${numeral(this._enemyArmyAfter.getBaseHp()).format()} (HB)</td>`;
      if (this._defender.niveauRecherche[1] != -1)
        html += `<td class='right'>${numeral(this._enemyArmyAfter.getTotalHp(this._defender.niveauRecherche[1])).format()} (AB)<img src='images/attention.gif' alt='attention' title='Vie sans le bonus lieu !' class='o_vAlign'/></td></tr>`;
      else if (this._defenderPlaceBonus.length)
        html += `<td class='right'>${numeral(this._enemyArmyAfter.getTotalHp(parseInt(this._defenderPlaceBonus[0].split("/")[0]), this._place, parseInt(this._defenderPlaceBonus[0].split("/")[1]))).format()} (AB) <img src='images/attention.gif' alt='attention' title='vie en ${PLACE_LABELS[this._place]}' class='o_vAlign'/></td></tr>`;
      else html += `<td></td></tr>`;
      html += `<tr><td><img width='18' height='18' src='images/icone/horloge.png' class='o_vAlign'/></td><td class='right'>${Utils.intToTime(this._enemyArmyAfter.getTime(0))}</td>
                <td class='right' style='width:30px;'>${IMG_ATT}</td><td class='right'>${numeral(this._enemyArmyAfter.getBaseAtt()).format()} (HB)</td><td class='right'>${numeral(this._enemyArmyAfter.getTotalAtt(this._defender.niveauRecherche[2])).format()} (AB)</td></tr>
				<tr><td>Perte JSN 10%</td><td class='right'>${numeral(Math.round(this._enemyArmyAfter.getTotalDef(this._defender.niveauRecherche[2]) / 10 / (8 + (8 * getProfile().niveauRecherche[1]) / 10))).format()} <img src='images/attention.gif' alt='attention' title='Avec votre bonus Bouclier de : ${getProfile().niveauRecherche[1]}' class='o_vAlign'/></td>
				<td class='right' style='width:30px;'>${IMG_DEF}</td><td class='right'>${numeral(this._enemyArmyAfter.getBaseDef()).format()} (HB)</td><td class='right'>${numeral(this._enemyArmyAfter.getTotalDef(this._defender.niveauRecherche[2])).format()} (AB)</td></tr>
				</table><br/>`;
    }
    // Affichage des infos sur "votre" armée avec l'XP
    if (this._armyLost.getTotalUnits()) {
      let countUnit = this._armyAfter.getTotalUnits() - this._armyBefore.getTotalUnits(),
        attHB = this._armyAfter.getBaseAtt() - this._armyBefore.getBaseAtt(),
        defHB = this._armyAfter.getBaseDef() - this._armyBefore.getBaseDef(),
        hpHB = this._armyAfter.getBaseHp() - this._armyBefore.getBaseHp();
      html += `<span style='text-decoration:underline;' class='gras'>Bilan après combat</span><br/><table class='o_tabAnalyse right' cellspacing='0'>
				<tr><td><img width='35' src='images/icone/icone_ouvriere.png' alt='nb_unite' class='o_vAlign'/></td><td colspan='2' style='padding-left:10px'>${numeral(countUnit).format()}</td><td style='padding-left:10px'>${((countUnit * 100) / this._armyBefore.getTotalUnits()).toFixed(2)}%</td></tr>
				<tr><td>${IMG_HP}</td><td class='right'>${(hpHB > 0 ? "+" : "") + numeral(hpHB).format()}(HB)</td><td class='right'>${(hpHB > 0 ? "+" : "") + numeral(this._armyAfter.getTotalHp(getProfile().niveauRecherche[1]) - this._armyBefore.getTotalHp(getProfile().niveauRecherche[1])).format()}(AB)</td><td style='padding-left:10px'>${(hpHB > 0 ? "+" : "") + ((hpHB * 100) / this._armyBefore.getBaseHp()).toFixed(2)}%</td></tr>
				<tr><td>${IMG_ATT}</td><td style='padding-left:10px' class='right'>${(attHB > 0 ? "+" : "") + numeral(attHB).format()}(HB)</td><td style='padding-left:10px' class='right'>${(attHB > 0 ? "+" : "") + numeral(this._armyAfter.getTotalAtt(getProfile().niveauRecherche[2]) - this._armyBefore.getTotalAtt(getProfile().niveauRecherche[2])).format()}(AB)</td><td style='padding-left:10px'>${(attHB > 0 ? "+" : "") + ((attHB * 100) / this._armyBefore.getBaseAtt()).toFixed(2)}%</td></tr>
				<tr><td>${IMG_DEF}</td><td class='right'>${(defHB > 0 ? "+" : "") + numeral(defHB).format()}(HB)</td><td class='right'>${(defHB > 0 ? "+" : "") + numeral(this._armyAfter.getTotalDef(getProfile().niveauRecherche[2]) - this._armyBefore.getTotalDef(getProfile().niveauRecherche[2])).format()}(AB)</td></td><td style='padding-left:10px'>${(defHB > 0 ? "+" : "") + ((defHB * 100) / this._armyBefore.getBaseDef()).toFixed(2)}%</td></tr>
				</table><br/>`;
    }
    html += "</div>";
    return html;
  }
  /**
   *
   */
  toBoxHtml() {
    let bonusAtt = "",
      bonusDef = "";
    if (this._pointOfView == 0) {
      bonusAtt = `${this._attackerPlaceBonus.length ? this._attackerPlaceBonus.join(" - ") : this._attacker.niveauRecherche[1] != -1 ? this._attacker.niveauRecherche[1] : "N/A"}`;
      bonusDef = `${this._defenderPlaceBonus.length ? this._defenderPlaceBonus.join(" - ") : this._defender.niveauRecherche[1] != -1 ? this._defender.niveauRecherche[1] : "N/A"}`;
    } else {
      bonusAtt = `${this._defenderPlaceBonus.length ? this._defenderPlaceBonus.join(" - ") : this._defender.niveauRecherche[1] != -1 ? this._defender.niveauRecherche[1] : "N/A"}`;
      bonusDef = `${this._attackerPlaceBonus.length ? this._attackerPlaceBonus.join(" - ") : this._attacker.niveauRecherche[1] != -1 ? this._attacker.niveauRecherche[1] : "N/A"}`;
    }
    let html = `<tr class='gras'><td></td><td style='width:38%'>${this._attacker.pseudo}</td><td style='width:38%'>${this._defender.getGameLink()}</td></tr>
			<tr><td>Bouclier (/ ${PLACE_LABELS[this._place]})</td><td>${bonusAtt}</td><td>${bonusDef}</td></tr>
			<tr><td>Armes</td><td>${this._pointOfView == 0 ? this._attacker.niveauRecherche[2] : this._defender.niveauRecherche[2]}</td><td>${this._pointOfView == 0 ? this._defender.niveauRecherche[2] : this._attacker.niveauRecherche[2]}</td></tr>
			<tr><td></td><td colspan='2' class='gras'>Bilan unités</td></tr>`;
    for (let i = 0; i < 14; i++) {
      if (this._armyBefore.unite[i] || this._enemyArmyBefore.unite[i] || this._armyAfter.unite[i]) {
        let diff1 = this._armyAfter.unite[i] - this._armyBefore.unite[i];
        html += `<tr><td>${UNIT_NAMES[i + 1]}</td><td>${numeral(this._armyAfter.unite[i]).format()} (${(diff1 > 0 ? "+" : "") + numeral(diff1).format()})</td><td>${numeral(this._enemyArmyAfter.unite[i]).format()} (${numeral(this._enemyArmyAfter.unite[i] - this._enemyArmyBefore.unite[i]).format()})</td></tr>`;
      }
    }
    html += `<tr><td></td><td colspan='2' class='gras'>Bilan Perte</td></tr>
			<tr><td><img width='35' class='o_vAlign' src='images/icone/icone_ouvriere.png' alt='nb_unite'/></td><td>${numeral(this._armyLost.getTotalUnits()).format()} (${numeral(this._armyLost.getTotalUnits() - this._armyBefore.getTotalUnits()).format()})</td><td>${numeral(this._enemyArmyAfter.getTotalUnits()).format()} (${numeral(this._enemyArmyAfter.getTotalUnits() - this._enemyArmyBefore.getTotalUnits()).format()})</td></tr>
			<tr><td>${IMG_HP}</td><td>${numeral(this._armyLost.getBaseHp()).format()} (${numeral(this._armyLost.getBaseHp() - this._armyBefore.getBaseHp()).format()})</td><td>${numeral(this._enemyArmyAfter.getBaseHp()).format()} (${numeral(this._enemyArmyAfter.getBaseHp() - this._enemyArmyBefore.getBaseHp()).format()})</td></tr>
			<tr><td>${IMG_ATT}</td><td>${numeral(this._armyLost.getBaseAtt()).format()} (${numeral(this._armyLost.getBaseAtt() - this._armyBefore.getBaseAtt()).format()})</td><td>${numeral(this._enemyArmyAfter.getBaseAtt()).format()} (${numeral(this._enemyArmyAfter.getBaseAtt() - this._enemyArmyBefore.getBaseAtt()).format()})</td></tr>
			<tr><td>${IMG_DEF}</td><td>${numeral(this._armyLost.getBaseDef()).format()} (${numeral(this._armyLost.getBaseDef() - this._armyBefore.getBaseDef()).format()})</td><td>${numeral(this._enemyArmyAfter.getBaseDef()).format()} (${numeral(this._enemyArmyAfter.getBaseDef() - this._enemyArmyBefore.getBaseDef()).format()})</td></tr>
			<tr><td><img width='18' class='o_vAlign' src='images/icone/horloge.png'/></td><td>${Utils.intToTime(this._armyBefore.getTime(0) - this._armyLost.getTime(0))}</td><td>${Utils.intToTime(this._enemyArmyBefore.getTime(0) - this._enemyArmyAfter.getTime(0))}</td></tr>
			<tr><td>Temps HOF</td><td colspan='2'>${Utils.intToTime(this._armyBefore.getTime(0) - this._armyLost.getTime(0) + (this._enemyArmyBefore.getTime(0) - this._enemyArmyAfter.getTime(0)))}</td></tr>`;
    if (this._armyLost.getBaseAtt() != this._armyAfter.getBaseAtt()) {
      let diff1 = this._armyAfter.getBaseHp() - this._armyBefore.getBaseHp(),
        diff2 = this._armyAfter.getBaseAtt() - this._armyBefore.getBaseAtt(),
        diff3 = this._armyAfter.getBaseDef() - this._armyBefore.getBaseDef();
      html += `<tr><td colspan='3' class='gras'>Bilan XP</td></tr>
				<tr><td colspan='3'>${IMG_HP} ${(diff1 > 0 ? "+" : "") + numeral(diff1).format()}</td></tr>
				<tr><td colspan='3'>${IMG_ATT} ${(diff2 > 0 ? "+" : "") + numeral(diff2).format()}</td></tr>
				<tr><td colspan='3'>${IMG_DEF} ${(diff3 > 0 ? "+" : "") + numeral(diff3).format()}</td></tr>`;
    }
    return html;
  }
  /**
   * Simule un combat
   *
   * @private
   * @method simuler
   */
  simulate() {
    let baseDegatAtt = 0,
      bonusDegatAtt = 0,
      baseDegatDef = 0,
      bonusDegatDef = 0,
      returnHpTmp = null,
      armyAttTmp = null,
      armyDefTmp = null;
    // initialisation des armées pour le combat
    this._armyAfter = new Army();
    this._armyAfter.unite = this._armyBefore.unite.slice(0);
    this._enemyArmyAfter = new Army();
    this._enemyArmyAfter.unite = this._enemyArmyBefore.unite.slice(0);
    // variable de vie du combat
    let hpAttacker = new Array().fill(0),
      hpDefender = new Array().fill(0);
    this._armyBefore.unite.forEach((elt, i) => {
      hpAttacker[i] = this.computeUnitHp(elt, i + 1, this._attacker.niveauRecherche[1], 0, 0);
    });
    this._enemyArmyBefore.unite.forEach((elt, i) => {
      hpDefender[i] = this.computeUnitHp(
        elt,
        i + 1,
        this._defender.niveauRecherche[1],
        this._place,
        this._place == PLACE.TERRAIN
          ? 0
          : this._place == PLACE.DOME
            ? this._defender.niveauConstruction[9]
            : this._defender.niveauConstruction[10],
      );
    });
    // on repique à 10% si l'attaque est strictement supérieur à la vie en def
    let retaliation = this.computeRetaliation(
      this._armyBefore.getTotalAtt(this._attacker.niveauRecherche[2]),
      hpDefender,
    );
    // tant qu'il rete de la vie sur la defense ou l'attaque on enchaine les tours
    while (
      hpAttacker.reduce((acc, val) => {
        return acc + val;
      }, 0) > 0 &&
      hpDefender.reduce((acc, val) => {
        return acc + val;
      }, 0) > 0
    ) {
      baseDegatAtt = this._attacker.niveauRecherche[2]
        ? this._armyAfter.getBaseAtt()
        : Math.ceil(this._armyAfter.getBaseAtt());
      bonusDegatAtt = (baseDegatAtt * this._attacker.niveauRecherche[2]) / 10;
      // le defenseur replique à 10% si l'attauant inglige suffisament de degat
      baseDegatDef = this._defender.niveauRecherche[2]
        ? this._enemyArmyAfter.getBaseDef() * retaliation
        : Math.ceil(this._enemyArmyAfter.getBaseDef() * retaliation);
      bonusDegatDef = (baseDegatDef * this._defender.niveauRecherche[2]) / 10;
      // l'attaquant inflige les degats en premier, on calcule l'armée aprés les degats et on met à jour la vie restante
      returnHpTmp = this.removeHp(this._enemyArmyAfter, hpDefender, baseDegatAtt + bonusDegatAtt);
      armyDefTmp = returnHpTmp.armeeFinale;
      hpDefender = returnHpTmp.vieFinale;
      // le defenseur inflige les degats on calcule l'armée de l'attaquant puis on met a jour sa vie restante
      returnHpTmp = this.removeHp(this._armyAfter, hpAttacker, baseDegatDef + bonusDegatDef);
      armyAttTmp = returnHpTmp.armeeFinale;
      hpAttacker = returnHpTmp.vieFinale;
      // ajoute des infos sur le tour pour le rapport
      this._turn.push([
        Math.ceil(baseDegatAtt),
        Math.ceil(bonusDegatAtt),
        this._enemyArmyAfter.getTotalUnits() - armyDefTmp.getTotalUnits(),
        Math.ceil(baseDegatDef),
        Math.ceil(bonusDegatDef),
        this._armyAfter.getTotalUnits() - armyAttTmp.getTotalUnits(),
      ]);
      // mise à jour des armées finales
      this._armyAfter = armyAttTmp;
      this._enemyArmyAfter = armyDefTmp;
    }
    // le combat est terminé on remet le nombre d'unité sous forme d'entier
    for (let i = 0; i < 14; i++) {
      this._armyAfter.unite[i] = Math.ceil(this._armyAfter.unite[i]);
      this._enemyArmyAfter.unite[i] = Math.ceil(this._enemyArmyAfter.unite[i]);
    }
    //alert(this.calculeUniteXP(this._armeeAp, this.calculeRatioXPAttaquant()).unite);
    return this;
  }
  /**
   *
   */
  computeRetaliation(pointAtt, pointHp) {
    if (pointAtt > pointHp) return 0.1;
    return 1;
  }
  /**
   *
   */
  removeHp(army, hpUnit, degatInflige) {
    let armyPerdu = new Army();
    armyPerdu.unite = army.unite.slice(0);
    for (let i = 0; i < armyPerdu.unite.length; i++) {
      if (armyPerdu.unite[i]) {
        // si on a des unités
        if (hpUnit[i] >= degatInflige) {
          // est ce que la vie de cette unité suffit pour couvrir les degat
          armyPerdu.unite[i] = (army.unite[i] * (hpUnit[i] - degatInflige)) / hpUnit[i];
          hpUnit[i] -= degatInflige;
          break;
        } else {
          armyPerdu.unite[i] = 0;
          degatInflige -= hpUnit[i];
          hpUnit[i] = 0;
        }
      }
    }
    return { armeeFinale: armyPerdu, vieFinale: hpUnit };
  }
  /**
   *
   */
  computeUnitHp(count, unite, bonusShield, place, bonusPlace) {
    let hp = count * UNIT_HP[unite] + Math.round((count * UNIT_HP[unite] * bonusShield) / 10);
    switch (parseInt(place)) {
      case PLACE.DOME:
        hp += Math.round(count * UNIT_HP[unite] * ((bonusPlace + 2) / 20));
        break;
      case PLACE.LOGE:
        hp += Math.round(count * UNIT_HP[unite] * (((bonusPlace + 2) * 3) / 20));
        break;
      default:
        break;
    }
    return hp;
  }
  /**
   *
   */
  computeAttackerXpRatio() {
    //let coeff = new Array(0, 0.05, 0.15);
    //return Math.pow(this._armeeEnnemieAv.getPotentielXP() / this._armeeAv.getPotentielXP() * 0.66, 2) * (1 + 0.1 * EtableATT) * 1 / (1 + 0.1 * armesATT) * (1 + armesDef * 0.1) * 1 / (1 + 0.1 * bouclierAtt) * (1 + bouclierDef * 0.1 + (niveauLieuDef + 2) * coeff[this._lieu]);
    return 0;
  }
  /**
   *
   */
  //    calculeRatioXPDefenseur()
  //    {
  //        let coef = new Array(0, 0.05, 0.15);
  //        return Math.pow(this._armeeAv.getPotentielXP() / this._armeeEnnemieAv.getPotentielXP() * 0.66, 2) * (1 + 0.1 * etableDef) * 1 / (1 + 0.1 * armesDef) * (1 + armesAtt * 0.1) * 1 / (1 + 0.1 * niveauBouclier + (niveauLieu + 2) * coef[this._lieu]) *  (1 + ennemieBouclier * 0.1);
  //    }
  //    $nous = $this->defenseur_RC;
  //    $lui = $this->attaquant_RC;
  //    $this->ratio_XP = pow($lui->get_PuissanceXP()/$nous->get_PuissanceXP()*0.66,2);
  // $this->ratio_XP *= 1/(1 + 0.1*$nous->niveaux['bouclier'] + ($this->defenseur->niveaux['niveau_lieu'] + 2)*$coeffs[$this->defenseur->niveaux['lieu']]) *  (1 + $lui->niveaux['bouclier']*0.1);
  /**
   *
   */
  computeXpUnits(army, ratio) {
    let orderXp = new Array(0, 1, 3, 4, 5, 7, 10, 12),
      armyXp = new Army();
    // @ts-expect-error bug historique conservé : `ordreXP` n'existe pas (cf. followups)
    ordreXP.forEach((val, i) => {
      armyXp.unite[val] = Math.round(army.unite[val] * ratio);
    });
    return army;
  }
  /**
   *
   */
  generateBattleReport() {
    let boxBattleReport = new ReportBox(
      this._id,
      this._pointOfView == 0
        ? this.generateAttackerBattleReport()
        : this.generateDefenderBattleReport(),
    );
    boxBattleReport.render();
    return this;
  }
  /**
   *
   */
  generateAttackerBattleReport() {
    this._battleReport = `<span class="gras">Vous attaquez ${this._place ? "la " + PLACE_LABELS[this._place] : "le " + PLACE_LABELS[this._place]} de Inconnu :</span><br/><br/>`;
    // troupe en attaques
    this._battleReport += `Troupes en attaque : ${this._armyBefore.toString()}<br/>`;
    // troupe en défenses
    this._battleReport += `Troupes en défense : ${this._enemyArmyBefore.toString()}<br/><br/>`;
    // on affiche les tours
    for (let i = 0; i < this._turn.length; i++) {
      this._battleReport += `Vous infligez <span class="gras">${numeral(this._turn[i][0]).format()} (+${numeral(this._turn[i][1]).format()})</span> dégats et tuez <span class="gras">${numeral(this._turn[i][2]).format()}</span> ennemies.<br/>`;
      this._battleReport += `L'ennemie inflige <span class="gras">${numeral(this._turn[i][3]).format()} (+${numeral(this._turn[i][4]).format()})</span> dégats à vos fourmis et en tue <span class="gras">${numeral(this._turn[i][5]).format()}</span>.<br/><br/>`;
    }
    // j'ai gagné
    if (this._armyAfter.getBaseHp()) {
      if (this._turn.length > 1)
        this._battleReport += `L’adversaire y a cru, mais vous sortez victorieux de ce combat acharné.<br/>Vous avez gagné cette bataille !<br/>`;
      else
        this._battleReport += `Ecrasante victoire !<br/>A peine le temps de se dégourdir les pattes qu'ils étaient tous morts ...<br/>Vous avez gagné cette bataille !<br/>`;
      // j'ai perdu
    } else {
      if (this._turn.length > 1)
        this._battleReport += `Vos troupes ont été courageuses et combattantes, mais pas assez. L’ennemi se souviendra toutefois de votre passage.<br/>Vos troupes ont échoué.<br/>`;
      else
        this._battleReport += `Vous avez infiltré l’ennemi. Les informations sont bien rentrées ... mais pas vos soldates !<br/>Vos troupes ont échoué.<br/>`;
    }
    return this._battleReport;
  }
  /**
   *
   */
  generateDefenderBattleReport() {
    this._battleReport = `<span class="gras">Inconnu attaque votre ${PLACE_LABELS[this._place]} :</span><br/><br/>`;
    // troupe en attaques
    this._battleReport += `Troupes en attaque : ${this._armyBefore.toString()}<br/>`;
    // troupe en défenses
    this._battleReport += `Troupes en défense : ${this._enemyArmyBefore.toString()}<br/><br/>`;
    // on affiche les tours
    for (let i = 0; i < this._turn.length; i++) {
      this._battleReport += `L'ennemie inflige <span class="gras">${numeral(this._turn[i][0]).format()} (+${numeral(this._turn[i][1]).format()})</span> dégats à vos fourmis et en tue <span class="gras">${numeral(this._turn[i][2]).format()}</span>.<br/><br/>`;
      this._battleReport += `Vous infligez <span class="gras">${numeral(this._turn[i][3]).format()} (+${numeral(this._turn[i][4]).format()})</span> dégats et tuez <span class="gras">${numeral(this._turn[i][5]).format()}</span> ennemies.<br/>`;
    }
    // j'ai perdu
    if (this._armyAfter.getBaseHp()) {
      if (this._turn.length > 1)
        this._battleReport += `Les troupes étaient de force égale, cependant il manqua aux nôtres ce petit plus qui fait gagner la bataille.<br/>Vos troupes ont échoué, l’ennemi pénètre vos défenses.<br/>`;
      else
        this._battleReport += `Vous venez de subir une cuisante défaite.<br/>Vos troupes ont échoué, l’ennemi pénètre vos défenses.<br/>`;
      // j'ai gagné
    } else {
      if (this._turn.length > 1)
        this._battleReport += `Le combat était difficile, l’ennemi était résistant, mais votre stratégie l’a emporté.<br/>Vous avez gagné cette bataille ! L’ennemie est repoussé.<br/>`;
      else
        this._battleReport += `Vous n’avez fait qu’une bouchée des espions de l’ennemi ... Restez vigilant, le gros de ses troupes est sûrement déjà en route.<br/>Vous avez gagné cette bataille ! L’ennemie est repoussé.<br/>`;
    }
    return this._battleReport;
  }
}
