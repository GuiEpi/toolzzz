/*
 * Army.ts
 * Hraesvelg
 **********************************************************************/

import { $, moment, numeral } from "~/vendor";
import { IMG_ATT, IMG_DEF, IMG_FOOD, IMG_HP, PLACE, TOAST_ERROR, TOAST_INFO } from "~/constants";
import { Utils } from "~/lib/Utils";
import { getProfile } from "~/models/currentPlayer";
import { Army } from "~/models/Army";
import { SentAttack } from "~/models/SentAttack";
import * as session from "~/storage/session";

/**
 * Enriches the /Armee.php page.
 *
 * @class ArmyPage
 * @constructor
 */
export class ArmyPage {
  // Fields declared for TypeScript (Phase 2 was a straight conversion; real
  // typing is deferred — see .claude/plans/wxt-migration-followups.md).
  _comptePlusBox: any;
  _huntingGroundArmy: any;
  _domeArmy: any;
  _lodgeArmy: any;
  _attackCount: any;
  constructor(boxComptePlus) {
    /**
     * access to the ComptePlus box
     */
    this._comptePlusBox = boxComptePlus;
    /**
     * army on the hunting ground
     *
     * @private
     * @property armeeTdc
     * @type Class
     */
    this._huntingGroundArmy = null;
    /**
     * army in the dome
     *
     * @private
     * @property armeeDome
     * @type Class
     */
    this._domeArmy = null;
    /**
     * army in the lodge
     *
     * @private
     * @property armeeLoge
     * @type Class
     */
    this._lodgeArmy = null;
    /**
     * Nombre d'attaque en cours.
     *
     * @private
     * @property nbAttaque
     * @type Integer
     */
    this._attackCount =
      $("#centre")
        .text()
        .split(/- Vous allez attaquer|- Des renforts arrivent/g).length - 1;
  }
  /**
   *
   */
  run() {
    this.fetchHuntingGroundArmy();
    this.fetchDomeArmy();
    this.fetchLodgeArmy();
    // show how many attacks are left
    $("h3:eq(2)").append(
      ` ${this._attackCount}, reste : ${getProfile().niveauRecherche[6] + 1 - this._attackCount}.</p>`,
    );
    // show the total unit count
    $("h3:first").append(
      ` (${numeral(this._huntingGroundArmy.getTotalUnits() + this._domeArmy.getTotalUnits() + this._lodgeArmy.getTotalUnits()).format()})</p>`,
    );
    // Bouton antisonde
    $(".simulateur:eq(0) tr:eq(0)").after(
      `<tr><td colspan="10" class='right'><button id='o_replaceArmee' class='o_button f_success'>Replacer l'armée</button></td></tr>`,
    );
    $("#o_replaceArmee").click(() => {
      this.repositionArmy();
      return false;
    });

    if (!Utils.comptePlus) this.plus();
    SentAttack.renderTables();
    // show your army's HOF time
    $(".simulateur:first").append(
      "<tr><td colspan=10>Temps <span class='gras' title='Hall Of Fame' >HOF : " +
        Utils.shortcutTime(
          this._huntingGroundArmy.getTime(0) +
            this._domeArmy.getTime(0) +
            this._lodgeArmy.getTime(0),
        ) +
        "</span>, Temps relatif : <span class='gras'>" +
        Utils.shortcutTime(
          this._huntingGroundArmy.getTime(getProfile().getSpawnTech()) +
            this._domeArmy.getTime(getProfile().getSpawnTech()) +
            this._lodgeArmy.getTime(getProfile().getSpawnTech()),
        ) +
        "</span></td></tr>",
    );
    // show the detailed stats
    this.renderStats();
    // Auto-reposition: triggered when a flood ends (sessionStorage flag) or by the player's setting.
    let floodFlag = session.getRaw("outiiil_floodPuisReplacer") === "1";
    if (floodFlag) session.remove("outiiil_floodPuisReplacer");
    if (floodFlag || getProfile().parametre["replacerArmeeAuto"].valeur) this.repositionArmy(true);
    return this;
  }
  /**
   * Sets up the army on the hunting ground.
   *
   * @private
   * @method getArmeeTdc
   */
  fetchHuntingGroundArmy() {
    let units = {};
    $(".simulateur tr[align=center]:lt(14)").each((i, elt) => {
      let unite = $(elt).find(".pas_sur_telephone").text(),
        count = numeral($(elt).find("td:nth-child(3) span").text()).value();
      if (unite && count) units[unite] = count;
    });
    this._huntingGroundArmy = new Army({ unite: units });
  }
  /**
   * Sets up the army in the dome.
   *
   * @private
   * @method getArmeeDome
   */
  fetchDomeArmy() {
    let units = {};
    $(".simulateur tr[align=center]:lt(14)").each((i, elt) => {
      let unite = $(elt).find(".pas_sur_telephone").text();
      $(elt)
        .find("td")
        .slice(3, $(elt).find("td").length - 2)
        .each((i2, elt2) => {
          let count = numeral($(elt2).text()).value();
          if (unite && count) units[unite] = count;
        });
    });
    this._domeArmy = new Army({ unite: units });
  }
  /**
   * Sets up the army in the lodge.
   *
   * @private
   * @method getArmeeLoge
   */
  fetchLodgeArmy() {
    let units = {};
    $(".simulateur tr[align=center]:lt(14)").each((i, elt) => {
      let unite = $(elt).find(".pas_sur_telephone").text(),
        count = numeral($(elt).find("td:nth-last-child(2)").text()).value();
      if (unite && count) units[unite] = count;
    });
    this._lodgeArmy = new Army({ unite: units });
  }
  /**
   * Repositions the army within the anti-probe bounds from the settings.
   * With auto=true (triggered by the auto-reposition setting or at the end of a
   * flood) the informational toasts are suppressed, to avoid spamming on every
   * visit.
   */
  repositionArmy(auto = false) {
    if (
      this._lodgeArmy.getTotalUnits() +
      this._domeArmy.getTotalUnits() +
      this._huntingGroundArmy.getTotalUnits()
    ) {
      let firstUnit = this.firstUnitIndex();
      let countUnitDispo =
        this._lodgeArmy.unite[firstUnit] +
        this._domeArmy.unite[firstUnit] +
        this._huntingGroundArmy.unite[firstUnit];
      // enough units to place the anti-probes from the settings
      if (
        countUnitDispo >=
        getProfile().parametre["uniteAntisondeDome"].valeur +
          getProfile().parametre["uniteAntisondeTerrain"].valeur
      ) {
        // units outside the anti-probe bounds on the ground and in the dome mean everything is repositioned
        if (
          !this.isPlacedForAntiProbe(
            firstUnit,
            getProfile().parametre["uniteAntisondeTerrain"].valeur,
            getProfile().parametre["uniteAntisondeDome"].valeur,
          )
        )
          this.placeAntiProbeEnough(firstUnit, countUnitDispo);
        else if (!auto)
          $.toast({ ...TOAST_INFO, text: "Votre armée est déjà placée correctement." });
      } else {
        if (!this.isPlacedForAntiProbe(firstUnit, 1, countUnitDispo * 0.3))
          this.placeAntiProbeNotEnough(firstUnit, countUnitDispo);
        else if (!auto)
          $.toast({ ...TOAST_INFO, text: "Votre armée est déjà placée correctement." });
      }
    } else if (!auto) $.toast({ ...TOAST_ERROR, text: "Aucune unité n'est transférable." });
    return this;
  }
  /**
   *
   */
  firstUnitIndex() {
    // the first available unit is the one used as the anti-probe
    for (let i = 0; i < this._huntingGroundArmy.unite.length; i++)
      if (this._huntingGroundArmy.unite[i] + this._domeArmy.unite[i] + this._lodgeArmy.unite[i])
        return i;
    return -1;
  }
  /**
   *
   */
  isPlacedForAntiProbe(indUnit, countUnitTerrain, countUnitDome) {
    if (indUnit != -1) {
      // units other than the first on the ground or in the dome mean a bad placement
      for (let i = 0; i < this._huntingGroundArmy.unite.length; i++) {
        if (this._huntingGroundArmy.unite[i] > 0 && i != indUnit) return false;
        if (this._domeArmy.unite[i] > 0 && i != indUnit) return false;
      }
      // with enough units the bounds must be honoured
      if (
        this._huntingGroundArmy.unite[indUnit] +
          this._domeArmy.unite[indUnit] +
          this._lodgeArmy.unite[indUnit] >
        countUnitTerrain + countUnitDome
      ) {
        // the first unit outside the bounds means a bad placement
        if (
          this._domeArmy.unite[indUnit] > countUnitDome ||
          this._domeArmy.unite[indUnit] < countUnitDome * 0.9 ||
          this._huntingGroundArmy.unite[indUnit] > countUnitTerrain ||
          this._huntingGroundArmy.unite[indUnit] < countUnitTerrain * 0.9
        )
          return false;
      }
      return true;
    } else return false;
  }
  /**
   *
   */
  placeAntiProbeEnough(indUnit, countTroupeDispo) {
    let securite = $("#t").attr("name") + "=" + $("#t").val();
    $.post(
      "http://" + Utils.server + ".fourmizzz.fr/Armee.php?deplacement=3&" + securite,
      (data) => {
        let correspondanceUnit = [1, 2, 3, 4, 5, 6, 14, 7, 8, 9, 10, 13, 11, 12];
        // not enough troops: pick a random amount
        let countTroops = Math.round(
          Math.random() *
            (getProfile().parametre["uniteAntisondeDome"].valeur -
              getProfile().parametre["uniteAntisondeDome"].valeur * 0.9) +
            getProfile().parametre["uniteAntisondeDome"].valeur * 0.9,
        );
        if (countTroupeDispo < countTroops)
          countTroops = Math.round(
            Math.random() * (countTroupeDispo - countTroupeDispo * 0.9) + countTroupeDispo * 0.9,
          );
        // on place l'antisonde en dome
        $.post(
          "http://" +
            Utils.server +
            ".fourmizzz.fr/Armee.php?Transferer=Envoyer&LieuOrigine=3&LieuDestination=2&ChoixUnite=unite" +
            correspondanceUnit[indUnit] +
            "&nbTroupes=" +
            countTroops +
            "&" +
            securite,
          (data) => {
            countTroupeDispo -= countTroops;
            countTroops = Math.round(
              Math.random() *
                (getProfile().parametre["uniteAntisondeTerrain"].valeur -
                  getProfile().parametre["uniteAntisondeTerrain"].valeur * 0.9) +
                getProfile().parametre["uniteAntisondeTerrain"].valeur * 0.9,
            );
            // not enough troops: pick a random amount
            if (countTroupeDispo < countTroops)
              countTroops = Math.round(
                Math.random() * (countTroupeDispo - countTroupeDispo * 0.9) +
                  countTroupeDispo * 0.9,
              );
            $.post(
              "http://" +
                Utils.server +
                ".fourmizzz.fr/Armee.php?Transferer=Envoyer&LieuOrigine=3&LieuDestination=1&ChoixUnite=unite" +
                correspondanceUnit[indUnit] +
                "&nbTroupes=" +
                countTroops +
                "&" +
                securite,
              (data) => {
                window.location.href = "/Armee.php";
              },
            );
          },
        );
      },
    );
    return this;
  }
  /**
   *
   */
  placeAntiProbeNotEnough(indUnit, countTroupeDispo) {
    let securite = $("#t").attr("name") + "=" + $("#t").val();
    $.post(
      "http://" + Utils.server + ".fourmizzz.fr/Armee.php?deplacement=3&" + securite,
      (data) => {
        let correspondanceUnit = [1, 2, 3, 4, 5, 6, 14, 7, 8, 9, 10, 13, 11, 12];
        // on place l'antisonde en dome
        $.post(
          "http://" +
            Utils.server +
            ".fourmizzz.fr/Armee.php?Transferer=Envoyer&LieuOrigine=3&LieuDestination=2&ChoixUnite=unite" +
            correspondanceUnit[indUnit] +
            "&nbTroupes=" +
            Math.round(countTroupeDispo * 0.3) +
            "&" +
            securite,
          (data) => {
            $.post(
              "http://" +
                Utils.server +
                ".fourmizzz.fr/Armee.php?Transferer=Envoyer&LieuOrigine=3&LieuDestination=1&ChoixUnite=unite" +
                correspondanceUnit[indUnit] +
                "&nbTroupes=1&" +
                securite,
              (data) => {
                window.location.href = "/Armee.php";
              },
            );
          },
        );
      },
    );
    return this;
  }
  /**
   * Adds the ComptePlus features: army figures and the arrows in the unit table.
   *
   * @private
   * @method plus
   */
  plus() {
    // show the unit-move arrows
    $(".simulateur td").each((i, elt) => {
      if (/^[0-9,]+$/.test($(elt).text().replace(/ /g, ""))) {
        let info = $(elt).find("span").attr("id").replace(/\(|\)/g, "");
        let countUnit = info.split(",")[0],
          nameUnit = info.split(",")[1].replace(/\'/g, ""),
          placeDep = info.split(",")[2];
        if (placeDep != 3) {
          let link =
            "Armee.php?Transferer&nbTroupes=" +
            countUnit +
            "&ChoixUnite=" +
            nameUnit +
            "&LieuOrigine=" +
            placeDep +
            "&LieuDestination=" +
            (~~placeDep + 1) +
            "&" +
            $("#t").attr("name") +
            "=" +
            $("#t").attr("value");
          $(elt)
            .next()
            .html(
              `<a href="${link}" class='cursor'><img width='9' height='15' src='http://img2.fourmizzz.fr/images/bouton/fleche-champs-droite.gif'/></a>`,
            );
        }
        if (placeDep != 1) {
          let link =
            "Armee.php?Transferer&nbTroupes=" +
            countUnit +
            "&ChoixUnite=" +
            nameUnit +
            "&LieuOrigine=" +
            placeDep +
            "&LieuDestination=" +
            (~~placeDep - 1) +
            "&" +
            $("#t").attr("name") +
            "=" +
            $("#t").attr("value");
          $(elt)
            .prev()
            .html(
              `<a href="${link}" class='cursor'><img width='9' height='15' src='http://img2.fourmizzz.fr/images/bouton/fleche-champs-gauche.gif'/></a>`,
            );
        }
      }
    });
    // show the army figures for each placement
    this.renderHpRow();
    this.renderAttackRow();
    this.renderDefenseRow();
    this.renderConsumptionRow();
    // show the arrival and save the running attacks
    let listAttack = SentAttack.enrichRows();
    // check whether the data is already recorded
    this.saveAttacks(listAttack);
  }
  /**
   * Shows the extra hit-point figures for the armies.
   *
   * @private
   * @method renderHpRow
   */
  renderHpRow() {
    let shield = getProfile().niveauRecherche[1];
    let line = `<tr align='center' class='vie cursor'>
			 <td>Vie (AB)</td>
			 <td colspan=3>${IMG_HP} ${numeral(this._huntingGroundArmy.getTotalHp(shield)).format()}</td>
			 <td colspan=3>${IMG_HP} ${numeral(this._domeArmy.getTotalHp(shield, PLACE.DOME, ~~$('span:contains("Dôme")').text().replace(/\D/g, ""))).format()}</td>
			 <td colspan=3>${IMG_HP} ${numeral(this._lodgeArmy.getTotalHp(shield, PLACE.LOGE, ~~$('span:contains("Loge")').text().replace(/\D/g, ""))).format()}</td>
			 </tr>
			 <tr align='center' class='vie cursor' style='display:none;'>
			 <td>Vie (HB)</td>
			 <td colspan=3>${IMG_HP} ${numeral(this._huntingGroundArmy.getBaseHp()).format()}</td>
			 <td colspan=3>${IMG_HP} ${numeral(this._domeArmy.getBaseHp()).format()}</td>
			 <td colspan=3>${IMG_HP} ${numeral(this._lodgeArmy.getBaseHp()).format()}</td>
			 </tr>`;
    $(".simulateur tr[align=center]:last").after(line);
    $(".vie").click(() => {
      $(".vie").toggle();
    });
  }
  /**
   * Shows the extra attack figures for the armies.
   *
   * @private
   * @method renderAttackRow
   */
  renderAttackRow() {
    let weapons = getProfile().niveauRecherche[2];
    let line = `<tr align="center" class="att ligne_paire cursor">
			 <td>Dégâts en Attaque (AB)</td>
			 <td colspan=3>${IMG_ATT} ${numeral(this._huntingGroundArmy.getTotalAtt(weapons)).format()}</td>
			 <td colspan=3>${IMG_ATT} ${numeral(this._domeArmy.getTotalAtt(weapons)).format()}</td>
			 <td colspan=3>${IMG_ATT} ${numeral(this._lodgeArmy.getTotalAtt(weapons)).format()}</td>
			 </tr>
			 <tr align="center" class="att ligne_paire cursor" style="display:none;">
			 <td>Dégâts en Attaque (HB)</td>
			 <td colspan=3>${IMG_ATT} ${numeral(this._huntingGroundArmy.getBaseAtt()).format()}</td>
			 <td colspan=3>${IMG_ATT} ${numeral(this._domeArmy.getBaseAtt()).format()}</td>
			 <td colspan=3>${IMG_ATT} ${numeral(this._lodgeArmy.getBaseAtt()).format()}</td>
			 </tr>`;
    $(".simulateur tr[align=center]:last").after(line);
    $(".att").click(() => {
      $(".att").toggle();
    });
  }
  /**
   * Shows the extra defense figures for the armies.
   *
   * @private
   * @method renderDefenseRow
   */
  renderDefenseRow() {
    let weapons = getProfile().niveauRecherche[2];
    let line = `<tr align="center" class="def cursor">
			 <td>Dégâts en Défense (AB)</td>
			 <td colspan=3>${IMG_DEF} ${numeral(this._huntingGroundArmy.getTotalDef(weapons)).format()}</td>
			 <td colspan=3>${IMG_DEF} ${numeral(this._domeArmy.getTotalDef(weapons)).format()}</td>
			 <td colspan=3>${IMG_DEF} ${numeral(this._lodgeArmy.getTotalDef(weapons)).format()}</td>
			 </tr>
			 <tr align="center" class="def cursor" style="display:none;">
			 <td>Dégâts en Défense (HB)</td>
			 <td colspan=3>${IMG_DEF} ${numeral(this._huntingGroundArmy.getBaseDef()).format()}</td>
			 <td colspan=3>${IMG_DEF} ${numeral(this._domeArmy.getBaseDef()).format()}</td>
			 <td colspan=3>${IMG_DEF} ${numeral(this._lodgeArmy.getBaseDef()).format()}</td>
			 </tr>`;
    $(".simulateur tr[align=center]:last").after(line);
    $(".def").click(() => {
      $(".def").toggle();
    });
  }
  /**
   * Shows the extra consumption figures for the armies.
   *
   * @private
   * @method renderConsumptionRow
   */
  renderConsumptionRow() {
    let line = `<tr align='center' class='ligne_paire'>
			 <td>Consommation Journalière</td>
			 <td colspan=3>${IMG_FOOD} ${numeral(this._huntingGroundArmy.getConsumption(1)).format()}</td>
			 <td colspan=3>${IMG_FOOD} ${numeral(this._domeArmy.getConsumption(2)).format()}</td>
			 <td colspan=3>${IMG_FOOD} ${numeral(this._lodgeArmy.getConsumption(3)).format()}</td>
			 </tr>`;
    $(".simulateur tr[align=center]:last").after(line);
  }
  /**
   *
   */
  renderStats() {
    let shield = getProfile().niveauRecherche[1],
      weapons = getProfile().niveauRecherche[2];
    $(".simulateur:first").after(`<br/><div id="o_statArmee" class="simulateur">
            <h3>Statistiques</h3>
            <table class="centre o_maxWidth" cellspacing=0>
                <tr class="ligne_paire gras"><td></td><td colspan="2">Non XP</td><td colspan="2">Total</td></tr>
                <tr class="gras"><td></td><td>HB</td><td>AB</td><td>HB</td><td>AB</td></tr>
                <tr class="ligne_paire"><td class="left">${IMG_HP} Vie</td><td>${numeral(this._huntingGroundArmy.getNonXpBaseHp() + this._domeArmy.getNonXpBaseHp() + this._lodgeArmy.getNonXpBaseHp()).format()}</td><td>${numeral(this._huntingGroundArmy.getNonXpTotalHp(shield) + this._domeArmy.getNonXpTotalHp(shield) + this._lodgeArmy.getNonXpTotalHp(shield)).format()}</td><td>${numeral(this._huntingGroundArmy.getBaseHp() + this._domeArmy.getBaseHp() + this._lodgeArmy.getBaseHp()).format()}</td><td>${numeral(this._huntingGroundArmy.getTotalHp(shield) + this._domeArmy.getTotalHp(shield) + this._lodgeArmy.getTotalHp(shield)).format()}</td></tr>
                <tr><td class="left">${IMG_ATT} Attaque</td><td>${numeral(this._huntingGroundArmy.getNonXpBaseAtt() + this._domeArmy.getNonXpBaseAtt() + this._lodgeArmy.getNonXpBaseAtt()).format()}</td><td>${numeral(this._huntingGroundArmy.getNonXpTotalAtt(weapons) + this._domeArmy.getNonXpTotalAtt(weapons) + this._lodgeArmy.getNonXpTotalAtt(weapons)).format()}</td><td>${numeral(this._huntingGroundArmy.getBaseAtt() + this._domeArmy.getBaseAtt() + this._lodgeArmy.getBaseAtt()).format()}</td><td>${numeral(this._huntingGroundArmy.getTotalAtt(weapons) + this._domeArmy.getTotalAtt(weapons) + this._lodgeArmy.getTotalAtt(weapons)).format()}</td></tr>
                <tr class="ligne_paire"><td class="left">${IMG_DEF} Défense</td><td>${numeral(this._huntingGroundArmy.getNonXpBaseDef() + this._domeArmy.getNonXpBaseDef() + this._lodgeArmy.getNonXpBaseDef()).format()}</td><td>${numeral(this._huntingGroundArmy.getNonXpTotalDef(weapons) + this._domeArmy.getNonXpTotalDef(weapons) + this._lodgeArmy.getNonXpTotalDef(weapons)).format()}</td><td>${numeral(this._huntingGroundArmy.getBaseDef() + this._domeArmy.getBaseDef() + this._lodgeArmy.getBaseDef()).format()}</td><td>${numeral(this._huntingGroundArmy.getTotalDef(weapons) + this._domeArmy.getTotalDef(weapons) + this._lodgeArmy.getTotalDef(weapons)).format()}</td></tr>
            </table>
        </div>`);
    $("#o_statArmee").width($(".simulateur:first").width());
  }
  /**
   * Checks the running attacks against what was saved.
   *
   * @private
   * @method saveAttacks
   */
  saveAttacks(listAttack) {
    if (
      !this._comptePlusBox.hasOwnProperty("attaque") ||
      this._comptePlusBox.attaque.length != listAttack.length ||
      (listAttack.length &&
        (this._comptePlusBox.attaque[0]["cible"] != listAttack[0]["cible"] ||
          (listAttack[0]["exp"].diff(this._comptePlusBox.attaque[0]["exp"], "s") > 1 &&
            !Utils.comptePlus &&
            $("#boiteComptePlus").length)))
    ) {
      this._comptePlusBox.attaque = listAttack;
      this._comptePlusBox.startAttaque = moment();
      this._comptePlusBox.save().updateAttack();
    }
    return this;
  }
}
