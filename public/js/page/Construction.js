/*
 * Construction.js
 * Hraesvelg
 **********************************************************************/

/**
 * Classe de fonction pour la page /construction.php.
 *
 * @class PageConstruction
 * @constructor
 */
class PageConstruction {
  constructor(boiteComptePlus) {
    /**
     * Accés à la boite compte+
     */
    this._boiteComptePlus = boiteComptePlus;
  }
  /**
   *
   */
  executer() {
    // verification des niveaux
    let niveau = new Array(13);
    $(".ligneAmelioration").each((i, elt) => {
      niveau[i] = parseInt($(elt).find(".niveau_amelioration").text().split(" ")[1]);
    });
    if (niveau.join(",") != monProfil.niveauConstruction.join(",")) {
      monProfil.niveauConstruction = niveau;
      monProfil.sauvegarder();
    }
    // Affichage de la rentabilité
    if (!$(".desciption_amelioration:eq(11) table").find(".verificationOK").length)
      this.titleEtable();
    // Sauvegarde construction
    if (!Utils.comptePlus) this.plus();
    // Visualisation des coûts/temps par niveau
    this.couts();
    return this;
  }
  /**
   * Injecte un widget de visualisation graphique des coûts/temps par niveau,
   * pour les 13 constructions et 10 recherches du jeu, ainsi qu'un trigger
   * dans l'en-tête de la page (style natif `boutonDescription`). Cliquable
   * via l'ancre `#cout`.
   *
   * @method couts
   */
  couts() {
    if ($("#o_couts").length) return this;
    // Trigger : on s'aligne sur le pattern natif Fourmizzz (`boutonDescription`)
    // qu'on retrouve par exemple sur la page Alliance pour ouvrir « Description ».
    if (!$("#o_coutsBouton").length) {
      $(".simulateur:first").before(
        `<a id='o_coutsBouton' class='boutonDescription' href='#cout' title='Visualiser les coûts et temps par niveau'><span></span>Coûts</a>`,
      );
    }
    let optionsConstru = Object.entries(COUTS_CONSTRUCTIONS)
      .map(([id, c]) => `<option value='${id}'>${c.nom}</option>`)
      .join("");
    let optionsRecherche = Object.entries(COUTS_RECHERCHES)
      .map(([id, r]) => `<option value='${id}'>${r.nom}</option>`)
      .join("");
    let archiNiveau = monProfil.niveauRecherche[3] || 0;
    let saNiveau = monProfil.niveauConstruction[6] || 0;
    $("#cadre, #centre").last().append(`
        <a id='cout'></a>
        <div id='o_couts' class='boite_amelioration simulateur centre'>
          <h2>Coûts & temps de développement</h2>
          <p class='reduce'>Choisis un item dans chaque liste ; les courbes affichent le temps de construction/recherche, le coût en matériaux (et pommes pour les recherches), et la capacité ou production quand applicable. Tenir compte de tes améliorations applique le bonus Architecture (-10%/niv sur le temps de construction) et Salle d'analyse (-10%/niv sur le temps de recherche).</p>
          <table class='o_maxWidth o_marginT15' id='o_coutsControls'>
            <tr>
              <td><b>Construction</b></td>
              <td><select id='o_coutsConstru'>${optionsConstru}</select></td>
              <td><b>Recherche</b></td>
              <td><select id='o_coutsRecherche'>${optionsRecherche}</select></td>
            </tr>
            <tr>
              <td>Plage de niveaux</td>
              <td colspan='3'>
                <div id='o_coutsSlider' style='margin:8px 12px;'></div>
                <span id='o_coutsSliderLabel' class='reduce'>1 – 20</span>
              </td>
            </tr>
            <tr>
              <td colspan='4' class='left'>
                <label><input type='checkbox' id='o_coutsBonus' checked/> Tenir compte de mes améliorations (Architecture <b>${archiNiveau}</b>, Salle d'analyse <b>${saNiveau}</b>)</label>
              </td>
            </tr>
          </table>
          <div id='o_coutsChartConstru' style='height:380px;margin-top:15px;'></div>
          <div id='o_coutsChartRecherche' style='height:380px;margin-top:15px;'></div>
        </div>
      `);
    $("#o_coutsSlider").slider({
      range: true,
      min: 1,
      max: 45,
      values: [1, 20],
      slide: (event, ui) => {
        $("#o_coutsSliderLabel").text(`${ui.values[0]} – ${ui.values[1]}`);
        this._renderCoutsCharts();
      },
    });
    $("#o_coutsConstru, #o_coutsRecherche, #o_coutsBonus").on("change", () =>
      this._renderCoutsCharts(),
    );
    this._renderCoutsCharts();
    return this;
  }
  /**
   * (Re)dessine les deux charts en fonction des sélections actuelles.
   * Stub pour l'instant : sera complété au commit suivant avec Highcharts.
   *
   * @private
   * @method _renderCoutsCharts
   */
  _renderCoutsCharts() {
    let [niveauMin, niveauMax] = $("#o_coutsSlider").slider("values");
    $("#o_coutsChartConstru").html(
      `<em class='reduce'>Construction ${$("#o_coutsConstru").val()} de N${niveauMin} à N${niveauMax} — chart à venir</em>`,
    );
    $("#o_coutsChartRecherche").html(
      `<em class='reduce'>Recherche ${$("#o_coutsRecherche").val()} de N${niveauMin} à N${niveauMax} — chart à venir</em>`,
    );
  }
  /**
   * Ajoute un title detaillé pour connaitre la rentabilité de la construction : etable à pucerons.
   *
   * @private
   * @method titleEtable
   */
  titleEtable() {
    let ouvDispo = Utils.ouvrieres - Utils.terrain,
      perte = 80 * Math.pow(2, monProfil.niveauRecherche[4]);
    let title = `<table>
            <tr><td>Ouvrières</td><td class='right'>${numeral(Utils.ouvrieres).format()}</td></tr>
            <tr><td>Disponible</td><td class='right'>${numeral(ouvDispo).format()}</td></tr>
            <tr><td>Capacité de livraison actuelle</td><td class='right'>${numeral(ouvDispo * (10 + monProfil.niveauConstruction[11] / 2)).format()}</td></tr>
            <tr><td>Perte ouvrières pour niveau ${monProfil.niveauConstruction[11] + 1}</td><td class='right'>${numeral(perte).format()}</td></tr>
            <tr><td>Capacité de livraison niveau suivant</td><td class='right' style='padding-left:10px'>${numeral((ouvDispo - perte) * (10 + (monProfil.niveauConstruction[11] + 1) / 2)).format()}</td></tr>
            <tr><td>Seuil rentabilité ouvrière</td><td class='right gras' style='padding-left:10px'>${numeral((21 + monProfil.niveauConstruction[11]) * 40 * Math.pow(2, monProfil.niveauConstruction[11] + 3)).format()}</td></tr>
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
   * Sauvegarde la construction en cours.
   *
   * @private
   * @method plus
   */
  plus() {
    // Affichage de la fin de la construction
    if ($("#centre > strong").length)
      $("#centre > strong").after(
        `<span class='small'> Terminé le ${Utils.roundMinute($("#centre > strong").text().split(",")[0].split("(")[1]).format("D MMM YYYY à HH[h]mm")}</span>`,
      );
    // Sauvegarde de la construction en cours
    this.saveConstruction();
    // Suppresion de la construction en cours si on annule
    if ($("a:contains('Annuler')").length)
      $("a:contains('Annuler')").click((e) => {
        this._boiteComptePlus.expConstruction = 0;
        this._boiteComptePlus.construction = "";
        this._boiteComptePlus.startConstruction = 0;
        this._boiteComptePlus.sauvegarder();
      });
    return this;
  }
  /**
   * Sauvegarde la construction en cours.
   *
   * @private
   * @method saveConstruction
   */
  saveConstruction() {
    let str = $("#centre > strong").text();
    let construction = str.substring(2, str.indexOf("se termine") - 1);
    if (
      construction &&
      (!this._boiteComptePlus.construction ||
        moment().diff(moment(this._boiteComptePlus.expConstruction), "s") > 0) &&
      !Utils.comptePlus &&
      $("#boiteComptePlus").length
    ) {
      this._boiteComptePlus.construction =
        construction.substr(0, 1).toUpperCase() + construction.substr(1);
      this._boiteComptePlus.expConstruction = moment().add(
        parseInt(str.split(",")[0].split("(")[1]),
        "s",
      );
      this._boiteComptePlus.startConstruction = moment();
      this._boiteComptePlus.sauvegarder().majConstruction();
    }
    return this;
  }
}
