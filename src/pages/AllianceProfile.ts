/*
 * Description.ts
 * Hraesvelg
 **********************************************************************/

import { $, numeral } from "~/vendor";
import { IMG_ATT, IMG_DEF, IMG_HISTORY, IMG_RADAR } from "~/constants";
import { Utils } from "~/lib/Utils";
import { Alliance } from "~/models/Alliance";
import { Player } from "~/models/Player";

/**
 * Classe de fonction pour la page /classementAlliance.php?alliance=?.
 *
 * @class PageDescription
 * @constructor
 */
export class AllianceProfilePage {
  // Champs déclarés pour TypeScript (Phase 2 : conversion telle quelle, le
  // typage fin est reporté — cf. .claude/plans/wxt-migration-followups.md).
  _alliance: any;
  _radarBox: any;
  constructor(boxRadar) {
    /**
     * Creation de la classe modele d'une alliance
     */
    this._alliance = new Alliance({ tag: Utils.extractUrlParams()["alliance"] });
    /**
     * Accés au radar
     */
    this._radarBox = boxRadar;
  }
  /**
   *
   * @private
   * @method initialize
   * @return
   */
  run() {
    // Suppression du cadre classement
    $("#centre center:first").remove();
    // construction de l'alliance
    let tmpPlayers = {};
    $("#tabMembresAlliance tr:gt(0)").each((i, elt) => {
      let pseudo = $(elt).find("td:eq(2)").text(),
        terrain = numeral($(elt).find("td:eq(4)").text()).value();
      tmpPlayers[pseudo] = new Player({
        pseudo: pseudo,
        terrain: terrain,
        fourmiliere: ~~$(elt).find("td:eq(7)").text(),
        technologie: ~~$(elt).find("td:eq(6)").text(),
      });
      if (!Utils.comptePlus && !tmpPlayers[pseudo].isCurrentPlayer()) {
        if (tmpPlayers[pseudo].isAttackable()) $(elt).find("td:eq(5)").html(IMG_ATT);
        if (tmpPlayers[pseudo].isAttacker()) $(elt).find("td:eq(3)").html(IMG_DEF);
      }
    });
    this._alliance.joueurs = tmpPlayers;

    $("#tabMembresAlliance tr:first").remove();
    $("#tabMembresAlliance")
      .append(
        `<tfoot><tr class='gras centre'><td colspan='8'>Terrain : <span id='totalTerrain'>${numeral(this._alliance.computeTerrain()).format()}</span> cm² | Fourmilière : ${numeral(this._alliance.computeColony()).format()} | Technologie : ${numeral(this._alliance.computeTechnology()).format()}.</td></tr></tfoot>`,
      )
      .wrap("<div class='simulateur'>")
      .css({ border: "0px", width: "100%", padding: "0px" })
      .prepend(
        `<thead><tr class='alt'><th></th><th>Rang</th><th>Pseudo</th><th></th><th>Terrain</th><th></th><th><span style='padding-right:10px'>Technologie</span></th><th><span style='padding-right:10px'>Fourmiliere</span></th></tr></thead>`,
      )
      .after(
        `<div id='o_bouton_alliance' class='o_group_bouton'><span id='o_surveiller' class='option_gestion'><img src="${IMG_RADAR}" alt="surveiller"/>${this._radarBox.alliances.hasOwnProperty(this._alliance.tag) ? " Ignorer" : " Surveiller"}</span><span id='o_antleaks' class='option_gestion cursor' title='Voir sur AntLeaks'><img src="${IMG_HISTORY}" alt="AntLeaks"/> Voir sur AntLeaks</span></div><div id='o_separation_graph' class='clear'></div>`,
      );
    this.table();

    $("#o_antleaks").click(() => {
      let url = `https://antleaks.guics.st/alliance/${encodeURIComponent(this._alliance.tag)}`;
      window.open(url, "_blank", "noopener");
    });

    $("#o_surveiller").click((e) => {
      if (!this._radarBox.alliances.hasOwnProperty(this._alliance.tag)) {
        $(e.currentTarget).html(
          $(e.currentTarget)
            .html()
            .replace(/Surveiller/, "Ignorer"),
        );
        this._radarBox.addAlliance(this._alliance);
      } else {
        $(e.currentTarget).html(
          $(e.currentTarget)
            .html()
            .replace(/Ignorer/, "Surveiller"),
        );
        this._radarBox.removeAlliance(this._alliance);
      }
      this._radarBox.save().refresh();
    });
    return this;
  }
  /**
   * Ajoute le tri sur le tableau des membres.
   *
   * @private
   * @method tableau
   */
  table() {
    $("#tabMembresAlliance").DataTable({
      bInfo: false,
      bPaginate: false,
      bAutoWidth: false,
      dom: "Bfrti",
      order: [],
      buttons: ["colvis", "copyHtml5", "csvHtml5", "excelHtml5"],
      responsive: true,
      language: {
        zeroRecords: "Aucun joueur trouvé",
        info: "Page _PAGE_ de _PAGES_",
        infoEmpty: "Aucun enregistrement",
        infoFiltered: "(Filtré par _MAX_ enregistrements)",
        search: "Rechercher : ",
        buttons: { colvis: "Colonne" },
      },
      columnDefs: [
        { type: "quantite-grade", targets: 4 },
        { sortable: false, targets: [0, 3, 5] },
      ],
    });
    return this;
  }
}
