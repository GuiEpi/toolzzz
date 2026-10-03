/*
 * Laboratoire.ts
 * Hraesvelg
 **********************************************************************/

import { $, moment, numeral } from "~/vendor";
import { UNIT_TIME } from "~/constants";
import { Utils } from "~/lib/Utils";
import { getProfile } from "~/models/currentPlayer";
import { Army } from "~/models/Army";

/**
 * Classe de fonction pour la page /laboratoire.php.
 *
 * @class PageLaboratoire
 * @constructor
 */
export class LabPage {
  // Champs déclarés pour TypeScript (Phase 2 : conversion telle quelle, le
  // typage fin est reporté — cf. .claude/plans/wxt-migration-followups.md).
  _comptePlusBox: any;
  _army: any;
  constructor(boxComptePlus) {
    /**
     * Accés à la boite compte+
     */
    this._comptePlusBox = boxComptePlus;
    /**
     * Armée du joueur pour calculer le rentabilité Armes et Bouclier
     */
    this._army = new Army();
  }
  /**
   *
   */
  run() {
    // Préservation du scroll à travers les redirects "Rechercher prereq invalide"
    // — la restauration se fait à la fin d'executer() (après les manipulations DOM).
    let scrollY = Utils.preserveScroll("o_laboratoireScroll");
    // verification des niveaux
    let level = new Array(10);
    $(".ligneAmelioration").each((i, elt) => {
      level[i] = parseInt($(elt).find(".niveau_amelioration").text().split(" ")[1]);
    });
    if (level.join(",") != getProfile().niveauRecherche.join(",")) {
      getProfile().niveauRecherche = level;
      getProfile().save();
    }
    // ajout title evolution
    this._army.getArmy().then((data) => {
      this._army.loadData(data);
      // Affichage de la rentabilité du bouclier et de la rentabilité de l'armes
      this.shieldTitle().weaponsTitle();
    });
    // Sauvegarde recherche AVANT le remplacement (saveRecherche lit $("#centre strong"))
    if (!Utils.comptePlus) this.plus();
    // ⚠️ Ordre : confirmationAnnuler AVANT tableauEvolution — la 1re ajoute le
    // <a>Retour</a> juste après "Je confirme", et la 2nde le déplace en même
    // temps que le warning sous le tableau récap. Sinon en C+ le Retour
    // resterait orphelin à sa position d'injection.
    Utils.cancelConfirmation("laboratoire.php");
    Utils.upgradesTable("Recherche", "Laboratoire");
    // Restauration du scroll APRÈS toutes les manipulations DOM (sinon le
    // tableau évolutions décale la mise en page après).
    if (scrollY !== null) requestAnimationFrame(() => window.scrollTo(0, scrollY));
    return this;
  }
  /**
   * Ajoute un title detaillé pour connaitre la rentabilité du niveau bouclier.
   *
   * @private
   * @method titleBouclier
   */
  shieldTitle() {
    let hpAB = this._army.getBaseHp() + this._army.getHpBonus(getProfile().niveauRecherche[1]);
    let tWorkers =
      numeral($(".ligneAmelioration:eq(1)").find(".ouvriere").text()).value() *
      (UNIT_TIME[0] * Math.pow(0.9, getProfile().getSpawnTech()));
    let apportSpawn = Math.round(
      parseInt(String(tWorkers / (UNIT_TIME[1] * Math.pow(0.9, getProfile().getSpawnTech())))) *
        (8 + (8 * getProfile().niveauRecherche[1]) / 10),
    );
    let hpABSupp =
      this._army.getBaseHp() + this._army.getHpBonus(getProfile().niveauRecherche[1] + 1);
    let bRowGras = hpAB + apportSpawn >= hpABSupp ? true : false;
    let title = `<table>
            <tr><td>Vie AB actuelle</td><td class='right'>${numeral(hpAB).format()}</td></tr>
            <tr${bRowGras ? " class='gras' " : ""}><td>Vie AB + ponte JSN</td><td class='right' style='padding-left:10px'>${numeral(hpAB + apportSpawn).format()} (+ ${numeral(apportSpawn).format()})</td></tr>
            <tr${!bRowGras ? " class='gras' " : ""}><td>Vie AB niveau ${getProfile().niveauRecherche[1] + 1}</td><td class='right'>${numeral(hpABSupp).format()} (+ ${numeral(hpABSupp - hpAB).format()})</td></tr>
            </table>`;
    $(".desciption_amelioration:eq(1) h2")
      .attr("title", title)
      .tooltip({
        position: { my: "left+5 top", at: "right top" },
        content: title,
        tooltipClass: "ui-tooltip-brown ui-tooltip-lightBrown",
      });
    return this;
  }
  /**
   * Ajoute un title detaillé pour connaitre la rentabilité du niveau d'armes.
   *
   * @private
   * @method titleArmes
   */
  weaponsTitle() {
    let attAB = this._army.getTotalAtt(getProfile().niveauRecherche[2]);
    let tWorkers =
      numeral($(".ligneAmelioration:eq(2)").find(".ouvriere").text()).value() *
      (UNIT_TIME[0] * Math.pow(0.9, getProfile().getSpawnTech()));
    let apportSpawnJS = Math.round(
      parseInt(String(tWorkers / (UNIT_TIME[4] * Math.pow(0.9, getProfile().getSpawnTech())))) *
        (10 + (10 * getProfile().niveauRecherche[1]) / 10),
    );
    let apportSpawnTk = Math.round(
      parseInt(String(tWorkers / (UNIT_TIME[11] * Math.pow(0.9, getProfile().getSpawnTech())))) *
        (55 + (55 * getProfile().niveauRecherche[1]) / 10),
    );
    let attABSupp = this._army.getTotalAtt(getProfile().niveauRecherche[2] + 1);
    let bRowGrasJS = attAB + apportSpawnJS >= attABSupp ? true : false;
    let bRowGrasTk = attAB + apportSpawnTk >= attABSupp ? true : false;

    let defAB = this._army.getTotalDef(getProfile().niveauRecherche[2]);
    let apportSpawnTuE = Math.round(
      parseInt(String(tWorkers / (UNIT_TIME[14] * Math.pow(0.9, getProfile().getSpawnTech())))) *
        (55 + (55 * getProfile().niveauRecherche[1]) / 10),
    );
    let defABSupp = this._army.getTotalDef(getProfile().niveauRecherche[2] + 1);
    let bRowGrasTuE = defAB + apportSpawnTuE >= defABSupp ? true : false;

    let title = `<table>
            <tr><td>Attaque AB actuelle</td><td class='right'>${numeral(attAB).format()}</td></tr>
            <tr${bRowGrasJS ? " class='gras' " : ""}><td>Attaque AB + ponte JS</td><td class='right' style='padding-left:10px'>${numeral(attAB + apportSpawnJS).format()} (+ ${numeral(apportSpawnJS).format()})</td></tr>
            <tr${bRowGrasTk ? " class='gras' " : ""}><td>Attaque AB + ponte Tank</td><td class='right' style='padding-left:10px'>${numeral(attAB + apportSpawnTk).format()} (+ ${numeral(apportSpawnTk).format()})</td></tr>
            <tr${!bRowGrasTk ? " class='gras' " : ""}><td>Attaque AB niveau ${getProfile().niveauRecherche[2] + 1}</td><td class='right'>${numeral(attABSupp).format()} (+ ${numeral(attABSupp - attAB).format()})</td></tr></table><hr/><table>
            <tr><td>Défense AB actuelle</td><td class='right'>${numeral(defAB).format()}</td></tr>
            <tr${bRowGrasTuE ? " class='gras' " : ""}><td>Défense AB + ponte TuE</td><td class='right' style='padding-left:10px'>${numeral(defAB + apportSpawnTuE).format()} (+ ${numeral(apportSpawnTuE).format()})</td></tr>
            <tr${!bRowGrasTuE ? " class='gras' " : ""}><td>Défense AB niveau ${getProfile().niveauRecherche[2] + 1}</td><td class='right'>${numeral(defABSupp).format()} (+ ${numeral(defABSupp - defAB).format()})</td></tr>
            </table>`;
    $(".desciption_amelioration:eq(2) h2")
      .attr("title", title)
      .tooltip({
        position: { my: "left+5 top", at: "right top" },
        content: title,
        tooltipClass: "ui-tooltip-brown ui-tooltip-lightBrown",
      });
    return this;
  }
  /**
   * Sauvegarde la recherche en cours.
   *
   * @private
   * @method plus
   */
  plus() {
    // La mention "Terminé le X" est désormais affichée par
    // `Utils.tableauEvolution()` pour tous (C+ comme non-C+), plus besoin de
    // la dupliquer ici.
    // Sauvegarde de la recherche en cours
    this.saveResearches();
    // Suppresion de la recherche en cours si on annule
    if ($("a:contains('Je confirme')").length)
      $("a:contains('Je confirme')").click((e) => {
        this._comptePlusBox.expRecherche = 0;
        this._comptePlusBox.recherche = "";
        this._comptePlusBox.startRecherche = 0;
        this._comptePlusBox.save();
      });
    return this;
  }
  /**
   * Sauvegarde la recherche en cours.
   *
   * @private
   * @method saveRecherche
   * @return
   */
  saveResearches() {
    let str = $("#centre strong").text();
    let research = str.substring(2, str.indexOf("termin") - 1);
    if (
      research &&
      (!this._comptePlusBox.recherche ||
        moment().diff(moment(this._comptePlusBox.expRecherche), "s") > 0) &&
      !Utils.comptePlus &&
      $("#boiteComptePlus").length
    ) {
      this._comptePlusBox.recherche = research.substr(0, 1).toUpperCase() + research.substr(1);
      this._comptePlusBox.expRecherche = moment().add(
        parseInt(str.split(",")[0].split("(")[1]),
        "s",
      );
      this._comptePlusBox.startRecherche = moment();
      this._comptePlusBox.save().updateResearch();
    }
    return this;
  }
}
