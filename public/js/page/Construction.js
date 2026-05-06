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
    let optionsConstru = Object.entries(COUTS_CONSTRUCTIONS)
      .map(([id, c]) => `<option value='${id}'>${c.nom}</option>`)
      .join("");
    let optionsRecherche = Object.entries(COUTS_RECHERCHES)
      .map(([id, r]) => `<option value='${id}'>${r.nom}</option>`)
      .join("");
    let archiNiveau = monProfil.niveauRecherche[3] || 0;
    let saNiveau = monProfil.niveauConstruction[6] || 0;
    // Pas d'ancre <a id='cout'> : on garde le hash pour le toggle (hashchange
    // listener) mais on évite le scroll-to-anchor du navigateur — devenu
    // inutile depuis qu'on masque la simulation native, le widget est déjà
    // tout seul en haut du viewport.
    $("#cadre, #centre").last().append(`
        <div id='o_couts' class='boite_amelioration simulateur centre' style='display:none;'>
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
    // Toggle natif <-> widget selon le hash : sur #cout on masque la simulation
    // native (build queue, lignes d'amélioration) pour ne montrer que les
    // courbes. Sans hash, comportement habituel. hashchange permet de
    // basculer sans recharger la page (depuis une autre entrée du menu).
    // Highcharts.render est appelé seulement quand le widget devient visible
    // (sinon il calcule des dimensions à 0).
    this._appliquerHashCouts();
    $(window).on("hashchange.couts", () => this._appliquerHashCouts());
    return this;
  }
  /**
   * @private
   * @method _appliquerHashCouts
   */
  _appliquerHashCouts() {
    let surCouts = location.hash === "#cout";
    // On cible la table parente des .ligneAmelioration (= toute la simulation
    // native) plutôt que `#centre > .simulateur` qui rate le DOM si la table
    // est wrappée dans un autre conteneur. On ajoute aussi le strong de la
    // construction en cours et les <br> séparateurs autour.
    let $natif = $(".ligneAmelioration")
      .closest("table")
      .add("#centre > strong, #centre > br, #centre > small, #centre > span.small");
    if (surCouts) {
      $natif.hide();
      $("#o_couts").show();
      this._renderCoutsCharts();
    } else {
      $natif.show();
      $("#o_couts").hide();
    }
  }
  /**
   * (Re)dessine les deux charts en fonction des sélections actuelles.
   * Croissance exponentielle des coûts → log sur l'axe Y de droite, axe linéaire
   * (formaté en durée) à gauche pour le temps.
   *
   * @private
   * @method _renderCoutsCharts
   */
  _renderCoutsCharts() {
    let [niveauMin, niveauMax] = $("#o_coutsSlider").slider("values"),
      withBonus = $("#o_coutsBonus").is(":checked"),
      archi = withBonus ? monProfil.niveauRecherche[3] || 0 : 0,
      sa = withBonus ? monProfil.niveauConstruction[6] || 0 : 0,
      construId = $("#o_coutsConstru").val(),
      construItem = COUTS_CONSTRUCTIONS[construId],
      labId = $("#o_coutsRecherche").val(),
      labItem = COUTS_RECHERCHES[labId];
    // Construction chart
    if (construItem) {
      let max = Math.min(niveauMax, construItem.max),
        levels = [],
        timeData = [],
        matData = [],
        extraData = [],
        extraName = construId === "cons5" ? "Production / jour" : "Capacité";
      for (let n = niveauMin; n <= max; n++) {
        levels.push(n);
        timeData.push(coutsTempsConstru(construItem, n, archi));
        matData.push(coutsMat(construItem, n));
        if (construId === "cons3" || construId === "cons4") {
          extraData.push(coutsCapaEntrepot(n));
        } else if (construId === "cons5") {
          extraData.push(coutsProdChampi(construItem, n));
        }
      }
      let series = [
        { name: "Temps", data: timeData, yAxis: 0, color: "#3498db" },
        { name: "Matériaux", data: matData, yAxis: 1, color: "#e67e22" },
      ];
      if (extraData.length) {
        series.push({ name: extraName, data: extraData, yAxis: 1, color: "#27ae60" });
      }
      this._renderCoutsChart("o_coutsChartConstru", construItem.nom, levels, series);
    }
    // Recherche chart
    if (labItem) {
      let max = Math.min(niveauMax, labItem.max),
        levels = [],
        timeData = [],
        pomData = [],
        matData = [];
      for (let n = niveauMin; n <= max; n++) {
        levels.push(n);
        timeData.push(coutsTempsRecherche(labItem, n, sa));
        pomData.push(coutsPom(labItem, n));
        matData.push(coutsMat(labItem, n));
      }
      let series = [
        { name: "Temps", data: timeData, yAxis: 0, color: "#3498db" },
        { name: "Pommes", data: pomData, yAxis: 1, color: "#e74c3c" },
        { name: "Matériaux", data: matData, yAxis: 1, color: "#e67e22" },
      ];
      this._renderCoutsChart("o_coutsChartRecherche", labItem.nom, levels, series);
    }
  }
  /**
   * @private
   * @method _renderCoutsChart
   */
  _renderCoutsChart(containerId, titre, levels, series) {
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
