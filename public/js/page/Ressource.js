/*
 * Ressource.js
 * Hraesvelg
 **********************************************************************/

/**
 * Classe de fonction pour la page /Ressource.php.
 *
 * @class PageRessource
 * @constructor
 * @extends Page
 */
class PageRessource {
  constructor(boiteComptePlus) {
    /**
     * Accés à la boite compte+
     */
    this._boiteComptePlus = boiteComptePlus;
    /**
     * Nombre de chasse restante
     */
    this._nbChasse =
      monProfil.niveauRecherche[5] +
      2 -
      $("#boite_tdc")
        .text()
        .split(/- Vos chasseuses vont conquérir/g).length;
    /**
     * Armée du joueur pour envoyer des chasses
     */
    this._armee = new Armee();
  }
  /**
   *
   */
  executer() {
    this._armee.getArmee().then((data) => {
      this._armee.chargeData(data);
      // Ajout du lanceur de chasse
      this.lanceur();
    });
    // Sauvegarde les chasses en cours et ajoute les boutons max recolte
    if (!Utils.comptePlus) this.plus();
    // Bouton "Annuler toutes les chasses" si au moins une est en cours
    this.boutonAnnulerChasses();
    return this;
  }
  /**
   * Ajoute un bouton "Annuler toutes les chasses" dans la boîte de chasse en cours.
   * Le serveur expose `Ressources.php?annuler=<chasseId>` pour annuler une chasse —
   * on itère sur tous les spans `chasse_<id>` présents dans `#boite_tdc`.
   *
   * @private
   * @method boutonAnnulerChasses
   */
  boutonAnnulerChasses() {
    let chasses = $("#boite_tdc span[id^='chasse_']");
    if (!chasses.length) return;
    $("#boite_tdc").append(
      `<div class="o_marginT15 centre"><button id="o_annulerChasses" class="o_button f_error" type="button">Annuler toutes les chasses (${chasses.length})</button></div>`,
    );
    $("#o_annulerChasses").click(() => {
      if (!confirm(`Annuler les ${chasses.length} chasse(s) en cours ? Action irréversible.`))
        return;
      $("#o_annulerChasses").prop("disabled", true).text("Annulation…");
      let promesses = chasses
        .map((_, span) => $(span).attr("id").replace("chasse_", ""))
        .get()
        .map((id) => $.get(`http://${Utils.serveur}.fourmizzz.fr/Ressources.php?annuler=${id}`));
      Promise.all(promesses).then(
        () => {
          location.reload();
        },
        () => {
          $.toast({
            ...TOAST_ERROR,
            text: "Au moins une annulation a échoué — rechargement quand même.",
          });
          setTimeout(() => location.reload(), 1500);
        },
      );
    });
  }
  /**
   * Formulaire de lancement pour les chasses.
   *
   * @private
   * @method lanceur
   */
  lanceur() {
    $("#boite_tdc")
      .after(`<br/><div id='o_prepaChasse' class='boite_amelioration simulateur centre'><h2>Lanceur de Chasses</h2>
            <table id='o_lanceurChasse' class='o_maxWidth o_marginT15' cellspacing=0>
			<tr class='ligne_paire'><td>Terrain à l'arrivée</td><td><input value='${Utils.terrain > 1000000 ? 1000000 : Utils.terrain}' size='21' id='o_chasseTDCDep'/></td><td></td></tr>
			<tr><td>Nombre de chasse</td><td><input value='0' size='21' id='o_chasseNbr'/></td><td><input id='o_chasseNbrAuto' type='checkbox' checked='checked' name='optionAuto'/><label for='o_chasseNbrAuto'>Auto</label></td></tr>
			<tr class='ligne_paire'><td>Terrain par chasse</td><td><input value='0' size='21' id='o_chasseTDCRep'/></td><td><input id='o_chasseTDCRepAuto' type='checkbox' checked='checked' name='optionAuto'/><label for='o_chasseTDCRepAuto'>Auto</label></td></tr>
			<tr><td>Difficulté</td><td><select id='o_chasseDiff' title='Ratio (Attaque de votre Armée) / (Difficulté de chasse) : détermine les pertes et taux de réplique de votre chasse...'><option value='1' class='black'>${RATIO_CHASSE[0].toFixed(1)} → Rep10% : ${REPLIQUE_CHASSE[0] >= 0.2 ? (100 * REPLIQUE_CHASSE[0]).toFixed(2) + "%" : "< 20%"}</option><option value='2' class='black'>${RATIO_CHASSE[1].toFixed(1)} → Rep10% : ${REPLIQUE_CHASSE[1] >= 0.2 ? (100 * REPLIQUE_CHASSE[1]).toFixed(2) + "%" : "< 20%"}</option><option value='3' class='black'>${RATIO_CHASSE[2].toFixed(1)} → Rep10% : ${REPLIQUE_CHASSE[2] >= 0.2 ? (100 * REPLIQUE_CHASSE[2]).toFixed(2) + "%" : "< 20%"}</option><option value='4' class='black'>${RATIO_CHASSE[3].toFixed(1)} → Rep10% : ${REPLIQUE_CHASSE[3] >= 0.2 ? (100 * REPLIQUE_CHASSE[3]).toFixed(2) + "%" : "< 20%"}</option><option value='5' class='red'>${RATIO_CHASSE[4].toFixed(1)} → Rep10% : ${REPLIQUE_CHASSE[4] >= 0.2 ? (100 * REPLIQUE_CHASSE[4]).toFixed(2) + "%" : "< 20%"}</option><option value='6' class='red'>${RATIO_CHASSE[5].toFixed(1)} → Rep10% : ${REPLIQUE_CHASSE[5] >= 0.2 ? (100 * REPLIQUE_CHASSE[5]).toFixed(2) + "%" : "< 20%"}</option><option value='6.5' class='orange'>${RATIO_CHASSE[6].toFixed(1)} → Rep10% : ${REPLIQUE_CHASSE[6] >= 0.2 ? (100 * REPLIQUE_CHASSE[6]).toFixed(2) + "%" : "< 20%"}</option><option value='7' class='orange'>${RATIO_CHASSE[7].toFixed(1)} → Rep10% : ${REPLIQUE_CHASSE[7] >= 0.2 ? (100 * REPLIQUE_CHASSE[7]).toFixed(2) + "%" : "< 20%"}</option><option value='7.5' class='orange'>${RATIO_CHASSE[8].toFixed(1)} → Rep10% : ${REPLIQUE_CHASSE[8] >= 0.2 ? (100 * REPLIQUE_CHASSE[8]).toFixed(2) + "%" : "< 20%"}</option><option value='8' class='green'>${RATIO_CHASSE[9].toFixed(1)} → Rep10% : ${REPLIQUE_CHASSE[9] >= 0.2 ? (100 * REPLIQUE_CHASSE[9]).toFixed(2) + "%" : "< 20%"}</option><option value='8.5' class='green'>${RATIO_CHASSE[10].toFixed(1)} → Rep10% : ${REPLIQUE_CHASSE[10] >= 0.2 ? (100 * REPLIQUE_CHASSE[10]).toFixed(2) + "%" : "< 20%"}</option><option value='9' class='green' selected>${RATIO_CHASSE[11].toFixed(1)} → Rep10% : ${REPLIQUE_CHASSE[11] >= 0.2 ? (100 * REPLIQUE_CHASSE[11]).toFixed(2) + "%" : "< 20%"}</option><option value='10' class='green'>${RATIO_CHASSE[12].toFixed(1)} → Rep10% : ${REPLIQUE_CHASSE[12] >= 0.2 ? (100 * REPLIQUE_CHASSE[12]).toFixed(2) + "%" : "< 20%"}</option></select></td><td></td></tr>
			<tr class='ligne_paire'><td>Garder des JSN</td><td><input value='0' size='21' id='o_chasseJSN'/></td><td>max : ${numeral(this._armee.nbrJSN).format()}</td></tr>
			<tr><td>Intervalle entre les chasses</td><td><select id='o_chasseInt' title='Intervalle entre les chasses'><option value='2' selected>2 secondes</option><option value='30'>30 secondes</option><option value='60'>1 minute</option><option value='120'>2 minutes</option></select></td><td></td></tr>
			<tr class='ligne_paire'><td>Date d'arrivée souhaitée</td><td><input value='' size='21' id='o_chasseDateArrivee' placeholder='—'/></td><td>Terrain par chasse suggéré : <span id='o_chasseDateArriveeTdc' class='gras'>—</span> <button type='button' id='o_chasseDateArriveeApply' disabled>Appliquer</button></td></tr>
			<tr><td colspan='3'><em>Basé sur le lanceur de <a href='http://alliancead2.free.fr/Outils/Repository/HuntSimv2.00/Simulator_2.00.00.html' class='violet'>Calystene</a></em></td></tr>
			</table>
            <br/><div id='o_simuChasse'><table id='o_simulationChasse' cellspacing=0 class='o_maxWidth'></table></div>
            <button class='o_button o_marginT15 f_success' type='button' id='o_chasseEnvoyer'>Envoyer</button>
            <p class='o_marginT0'><em class='small'>Veuillez rester sur cette page le temps du lancement !</em></p>
            <table id='o_recapChasse' cellspacing=0>
			<tr class='ligne_paire'><td colspan='3' class='gras'>Récapitulatif</td></tr>
			<tr><td>Chasse(s)</td><td>:</td><td id='o_chasseTotal'></td><td></td></tr>
			<tr class='ligne_paire'><td>Temps requis</td><td>:</td><td id='o_chasseTemps'></td></tr>
			<tr><td>Retour</td><td>:</td><td id='o_chasseRetour'></td></tr>
			<tr class='ligne_paire'><td>Rentabilité</td><td>:</td><td id='o_chasseRentabilite'></td></tr>
			<tr><td>Difficulté</td><td>:</td><td id='o_chasseRefDiff'></td></tr>
			<tr class='ligne_paire'><td>Perte estimé</td><td>:</td><td id='o_chassePerte'></td></tr>
			</table>
            <div class='o_marginT15'>
              <a id='o_chassePertesTdcToggle' class='cursor souligne'>▼ Pertes selon le niveau de TdC à l'arrivée</a>
              <div id='o_chassePertesTdc' style='display:none' class='o_marginT15'>
                <table id='o_chassePertesTdcTable' class='o_maxWidth' cellspacing='0'>
                  <thead>
                    <tr class='gras'>
                      <td>TdC à l'arrivée</td>
                      <td class='right'>Pertes Min</td>
                      <td class='right'>Pertes Avg</td>
                      <td class='right'>Pertes Max</td>
                      <td class='right'>Variation moy.</td>
                    </tr>
                  </thead>
                  <tbody>
                    <tr class='gras'><td><span id='o_otherHfRefValue'>—</span> cm² <span class='small'>(Terrain à l'arrivée)</span></td><td class='right o_otherHfMin' data-idx='0'>—</td><td class='right o_otherHfAvg' data-idx='0'>—</td><td class='right o_otherHfMax' data-idx='0'>—</td><td class='right'>—</td></tr>
                    ${[
                      1000000, 5000000, 10000000, 15000000, 20000000, 30000000, 40000000, 50000000,
                      75000000, 100000000,
                    ]
                      .map((v, k) => {
                        let i = k + 1;
                        return `<tr ${i % 2 ? "" : "class='ligne_paire'"}><td><input class='o_otherHfInputAlt' data-idx='${i}' value='${v}' size='15'/> cm²</td><td class='right o_otherHfMin' data-idx='${i}'>—</td><td class='right o_otherHfAvg' data-idx='${i}'>—</td><td class='right o_otherHfMax' data-idx='${i}'>—</td><td class='right o_otherHfVar' data-idx='${i}'>—</td></tr>`;
                      })
                      .join("")}
                  </tbody>
                </table>
              </div>
            </div></div>`);
    $("#o_chasseTDCDep").spinner({ min: 0, numberFormat: "i" });
    $("#o_chasseJSN").spinner({
      min: 0,
      max: this._armee.nbrJSN,
      numberFormat: "i",
    });
    $("#o_chasseTDCRep").spinner({
      min: 1,
      numberFormat: "i",
      disabled: true,
    });
    $("#o_chasseNbr").spinner({
      min: 1,
      max: this._nbChasse,
      numberFormat: "i",
      disabled: true,
    });
    $("#o_chasseDiff, #o_chasseInt").outerWidth($("#o_chasseTDCDep").parent().width() + 4);
    $("#o_chasseDiff, #o_chasseInt").outerHeight($("#o_chasseTDCDep").parent().height());
    $("#o_chasseDiff").css("color", "green");
    $("#o_chasseDateArrivee").datetimepicker({
      ...DATEPICKER_OPTION,
      dateFormat: "dd-mm-yy",
      timeFormat: "HH:mm",
      timeText: "Horaire",
      hourText: "Heure",
      minuteText: "Minute",
      minDate: 0,
    });
    $(".o_otherHfInputAlt").spinner({ min: 0, numberFormat: "i" });
    // Completion des valeurs
    this.preparerChasse();
    // Event
    $("#o_chasseTDCDep, #o_chasseNbr, #o_chasseTDCRep").on("input spin", (e, ui) => {
      let nombre = ui ? ui.value : $(e.currentTarget).spinner("value");
      $(e.currentTarget).spinner("value", nombre);
      this.preparerChasse();
    });
    $("#o_chasseNbrAuto").click((e) => {
      if (!$(e.currentTarget).is(":checked")) $("#o_chasseNbr").spinner("enable");
      else {
        $("#o_chasseNbr").spinner("disable");
        this.preparerChasse();
      }
    });
    $("#o_chasseTDCRepAuto").click((e) => {
      if (!$(e.currentTarget).is(":checked")) $("#o_chasseTDCRep").spinner("enable");
      else {
        $("#o_chasseTDCRep").spinner("disable");
        this.preparerChasse();
      }
    });
    $("#o_chasseDiff").change(() => {
      this._majCouleurDiff();
      this.preparerChasse();
    });
    $("#o_chasseJSN").on("input spin", (e, ui) => {
      let nombre = ui ? ui.value : $(e.currentTarget).spinner("value");
      $(e.currentTarget).spinner("value", nombre);
      this._armee.setJSN(nombre);
      this.preparerChasse();
    });
    $("#o_chasseDateArrivee").on("change", () => this.calculerTdcDate());
    $("#o_chasseDateArriveeApply").click(() => {
      let tdc = $("#o_chasseDateArrivee").data("tdc");
      if (tdc == null) return;
      if ($("#o_chasseTDCRepAuto").is(":checked")) {
        $("#o_chasseTDCRepAuto").prop("checked", false);
        $("#o_chasseTDCRep").spinner("enable");
      }
      $("#o_chasseTDCRep").spinner("value", tdc);
      this.preparerChasse();
    });
    $("#o_chassePertesTdcToggle").click(() => {
      let $div = $("#o_chassePertesTdc");
      $div.toggle();
      $("#o_chassePertesTdcToggle").text(
        ($div.is(":visible") ? "▲" : "▼") + " Pertes selon le niveau de TdC à l'arrivée",
      );
    });
    $(".o_otherHfInputAlt").on("input spin", () => this.mettreAjourPertesTdc());
    // Lancement des chasses
    $("#o_chasseEnvoyer").click((e) => {
      if (this._armee.getSommeUnite()) {
        let terrainChasse = $("#o_chasseTDCRep").spinner("value"),
          nbChasse = $("#o_chasseNbr").spinner("value"),
          intervalle = $("#o_chasseInt").val() * 1000;
        $.ajax({
          url: "http://" + Utils.serveur + ".fourmizzz.fr/AcquerirTerrain.php",
        }).then((data) => {
          let parsed = Utils.parseHtml(data);
          this._armee.envoyerChasse(
            terrainChasse,
            nbChasse,
            0,
            intervalle,
            parsed.find("#t:last").attr("name") + "=" + parsed.find("#t:last").attr("value"),
          );
        });
      } else
        $.toast({
          ...TOAST_ERROR,
          text: "Vous n'avez pas d'armée à envoyer.",
        });
      return false;
    });
    return this;
  }
  /**
   * Calcule les données de la chasse en fonction des valeurs souhaitées par le joueur.
   *
   * @private
   * @method preparerChasse
   */
  preparerChasse() {
    let tdcDep = $("#o_chasseTDCDep").spinner("value"),
      diffChasse = $("#o_chasseDiff").val(),
      nbChasse = $("#o_chasseNbr").spinner("value"),
      fixNB = nbChasse && !$("#o_chasseNbrAuto").is(":checked") ? nbChasse : 0,
      terrainChasse = $("#o_chasseTDCRep").spinner("value"),
      fixHF = terrainChasse && !$("#o_chasseTDCRepAuto").is(":checked") ? terrainChasse : 0;
    // Si une chasse peut être calculer
    if (tdcDep) {
      let simu = this._armee.simulerChasse(
        tdcDep,
        nbChasse,
        terrainChasse,
        diffChasse,
        fixNB,
        fixHF,
        this._nbChasse,
      );
      this.majSimulation(simu.repartition);
      this.majRecapitulatif(
        simu.nbChasse,
        simu.terrainChasse,
        simu.ratio,
        simu.ratioRef,
        simu.iTabPerte,
      );
      // Sync la dropdown Difficulté sur le ratio réellement atteignable
      // (calculRefRatio peut renvoyer un ratio plus bas si l'armée ne peut
      // pas tenir celui sélectionné par l'utilisateur).
      let computed = parseFloat(simu.ratioRef).toString();
      if ($("#o_chasseDiff").val() !== computed) {
        $("#o_chasseDiff").val(computed);
        this._majCouleurDiff();
      }
      this.mettreAjourPertesTdc();
    }
  }
  /**
   * Met à jour la couleur de la dropdown Difficulté selon le seuil de ratio.
   *
   * @private
   * @method _majCouleurDiff
   */
  _majCouleurDiff() {
    let value = parseFloat($("#o_chasseDiff").val()),
      color = value <= 4 ? "black" : value <= 6 ? "red" : value <= 7.5 ? "orange" : "green";
    $("#o_chasseDiff").css("color", color);
  }
  /**
   * Calcule le terrain par chasse suggéré pour qu'une chasse parte maintenant et
   * revienne à la date saisie. Inverse de `temps = (Utils.terrain + tdc) × 0.9^niveau`
   * (ligne 286 de majRecapitulatif).
   *
   * @private
   * @method calculerTdcDate
   */
  calculerTdcDate() {
    let raw = $("#o_chasseDateArrivee").val(),
      reset = (msg) => {
        $("#o_chasseDateArrivee").removeData("tdc");
        $("#o_chasseDateArriveeTdc").text(msg || "—");
        $("#o_chasseDateArriveeApply").prop("disabled", true);
      };
    if (!raw) return reset();
    let target = moment(raw, "DD-MM-YYYY HH:mm");
    if (!target.isValid()) return reset();
    let secondsLeft = target.diff(moment(), "seconds");
    if (secondsLeft <= 0) return reset("date passée");
    let niveau = monProfil.niveauRecherche[5],
      tdc = Math.round(secondsLeft / Math.pow(0.9, niveau) - Utils.terrain);
    if (tdc <= 0) return reset("trop court");
    $("#o_chasseDateArrivee").data("tdc", tdc);
    $("#o_chasseDateArriveeTdc").text(numeral(tdc).format() + " cm²");
    $("#o_chasseDateArriveeApply").prop("disabled", false);
  }
  /**
   * Met à jour la table "Pertes selon TdC à l'arrivée" en réutilisant les paramètres
   * courants (nb chasses, terrain par chasse, difficulté) mais en faisant varier
   * uniquement le tdcDep sur les valeurs saisies par l'utilisateur. Affiche aussi
   * la variation moyenne par rapport au tdcDep courant.
   *
   * @private
   * @method mettreAjourPertesTdc
   */
  mettreAjourPertesTdc() {
    let nb = $("#o_chasseNbr").spinner("value"),
      hf = $("#o_chasseTDCRep").spinner("value"),
      diff = parseFloat($("#o_chasseDiff").val()),
      tdcCourant = $("#o_chasseTDCDep").spinner("value"),
      ratioIdx = RATIO_CHASSE.indexOf(diff);
    if (!nb || !hf || ratioIdx < 0) return;
    let curDDiff = this._armee.calculDifficulte(tdcCourant, nb, hf),
      curPertes = this._armee.calculPerte(ratioIdx, curDDiff);
    // Ligne 0 = référence (TdC courant, miroir live de #o_chasseTDCDep)
    $("#o_otherHfRefValue").text(numeral(tdcCourant).format());
    $(".o_otherHfMin[data-idx='0']").text(numeral(Math.round(curPertes.MIN)).format());
    $(".o_otherHfAvg[data-idx='0']").text(numeral(Math.round(curPertes.AVG)).format());
    $(".o_otherHfMax[data-idx='0']").text(numeral(Math.round(curPertes.MAX)).format());
    // Lignes 1..10 = alternatives, variation calculée vs ligne 0
    $(".o_otherHfInputAlt").each((_, el) => {
      let $el = $(el),
        i = $el.data("idx"),
        tdc = $el.spinner("value") || 0,
        dDiff = this._armee.calculDifficulte(tdc, nb, hf),
        p = this._armee.calculPerte(ratioIdx, dDiff);
      $(`.o_otherHfMin[data-idx='${i}']`).text(numeral(Math.round(p.MIN)).format());
      $(`.o_otherHfAvg[data-idx='${i}']`).text(numeral(Math.round(p.AVG)).format());
      $(`.o_otherHfMax[data-idx='${i}']`).text(numeral(Math.round(p.MAX)).format());
      let varAvg = curPertes.AVG > 0 ? ((p.AVG - curPertes.AVG) / curPertes.AVG) * 100 : 0,
        sign = varAvg >= 0 ? "+" : "",
        cls = varAvg > 0.5 ? "red" : varAvg < -0.5 ? "green" : "";
      $(`.o_otherHfVar[data-idx='${i}']`).html(
        `<span class='${cls}'>${sign}${varAvg.toFixed(1)} %</span>`,
      );
    });
  }
  /**
   * Affiche la répartition des unités pour les chasses.
   *
   * @private
   * @method majSimulation
   * @param {Array} repartition
   */
  majSimulation(repartition) {
    let simulation = `<tr class='gras'><td>Chasse</td>
            ${this._armee.unite[0] ? "<td>JSN</td>" : ""}
            ${this._armee.unite[1] ? "<td>SN</td>" : ""}
            ${this._armee.unite[2] ? "<td>NE</td>" : ""}
            ${this._armee.unite[3] ? "<td>JS</td>" : ""}
            ${this._armee.unite[4] ? "<td>S</td>" : ""}
            ${this._armee.unite[5] ? "<td>C</td>" : ""}
            ${this._armee.unite[6] ? "<td>CE</td>" : ""}
            ${this._armee.unite[7] ? "<td>A</td>" : ""}
            ${this._armee.unite[8] ? "<td>AE</td>" : ""}
            ${this._armee.unite[9] ? "<td>SE</td>" : ""}
            ${this._armee.unite[10] ? "<td>Tk</td>" : ""}
            ${this._armee.unite[11] ? "<td>TkE</td>" : ""}
            ${this._armee.unite[12] ? "<td>Tu</td>" : ""}
            ${this._armee.unite[13] ? "<td>TuE</td>" : ""}
            </tr>`;
    for (let i = 0, l = repartition.length; i < l; i++) {
      simulation += `<tr><td>${i + 1}</td>`;
      for (
        let j = -1;
        ++j < 14;
        simulation += this._armee.unite[j]
          ? "<td class='small' nowrap>" +
            (repartition[i][j] ? numeral(repartition[i][j]).format() : "") +
            "</td>"
          : ""
      );
      simulation += `</tr>`;
    }
    $("#o_simulationChasse").html(simulation);
    $("#o_simulationChasse tr:even").addClass("ligne_paire");
  }
  /**
   * Affiche le compte rendu de la simulation.
   *
   * @private
   * @method majRecapitulatif
   * @param {Integer} nbChasse
   * @param {Integer} terrainChasse
   * @param {Float} ratio
   * @param {Float} ratioRef
   * @param {Array} iTabPerte
   */
  majRecapitulatif(nbChasse, terrainChasse, ratio, ratioRef, iTabPerte) {
    $("#o_chasseTotal").html(
      nbChasse +
        " x " +
        numeral(terrainChasse).format() +
        " = <span class='green'>" +
        numeral(nbChasse * terrainChasse).format() +
        "</span> cm²",
    );
    let temps = Math.round(
      (Utils.terrain + terrainChasse) * Math.pow(0.9, monProfil.niveauRecherche[5]),
    );
    $("#o_chasseTemps").text(Utils.intToTime(temps));
    let dateLong = Utils.roundMinute(temps).format("dddd D MMM YYYY [à] HH[h]mm");
    $("#o_chasseRetour").text(dateLong.charAt(0).toUpperCase() + dateLong.slice(1));
    $("#o_chasseRentabilite").text(
      numeral(Math.round(((nbChasse * terrainChasse) / temps) * 86400)).format() + " cm² / jour",
    );
    $("#o_chasseRefDiff").text(ratio.toFixed(1) + " ~ " + ratioRef);
    $("#o_chassePerte").text(
      numeral(Math.round(iTabPerte["AVG"])).format() +
        " JSN (max : " +
        numeral(Math.round(iTabPerte["MAX"])).format() +
        ")",
    );
  }
  /**
   * Ajoute les boutons "max", sauvegarde la chasse en cours.
   *
   * @private
   * @method plus
   */
  plus() {
    // Ajout des boutons pour l'affectation max
    $("#RecolteNourriture").after(
      "<a title='Affecter un maximum d’ouvrière à la nourriture' class='button_max' onclick='javascript:maxNourriture();' href='#max'><img class='o_vAlign' width='23' height='23' src='images/bouton/fleche_haut.gif'/></a>",
    );
    $("#RecolteMateriaux").after(
      "<a title='Affecter un maximum d’ouvrière aux matériaux' class='button_max' onclick='javascript:maxMateriaux();' href='#max'><img class='o_vAlign' width='23' height='23' src='images/bouton/fleche_haut.gif'/></a>",
    );
    // Affichage du retour des chasses
    let listeChasse = new Array();
    $("span[id^=chasse_]").each((i, elt) => {
      listeChasse.push({
        quantite: numeral($(elt).parent().text().split("conquérir")[1].split("cm²")[0]).value(),
        exp: moment().add($(elt).parent().next().text().split("reste(")[1].split(",")[0], "s"),
      });
      $(elt)
        .parent()
        .next()
        .after(
          "<span class='small'> Retour le " +
            Utils.roundMinute($(elt).parent().next().text().split(",")[0].split("(")[1]).format(
              "D MMM YYYY à HH[h]mm",
            ) +
            "</span>",
        );
    });
    // Sauvegarde de la chasse en cours
    if (listeChasse.length) this.saveChasse(listeChasse);
    let affection = parseInt(monProfil.parametre["affectationRessource"].valeur);
    // Ajout de la pref pour l'affectation auto
    $("#ChangeRessource").parent().parent().before(`<tr>
            <td><span class="text"><img src="images/icone/favicon.gif" height="16"> Affectation des ouvrières lors de la consultation de la page : </span></td>
            <td style="white-space:nowrap;"><label><input type="radio" name="choixOuvriere" value="nourriture" ${affection == 2 ? 'checked="checked"' : ""}><img alt="nourritures" src="images/icone/icone_pomme.png" height="18" title="Nourriture"></label>
            <label><input type="radio" name="choixOuvriere" value="materiaux" ${affection == 1 ? 'checked="checked"' : ""}> <img alt="materiaux" src="images/icone/icone_bois.png" height="17" title="Materiaux"></label>
            <label><input type="radio" name="choixOuvriere" value="rien" ${affection == 0 ? 'checked="checked"' : ""}> <img alt="rien" src="http:images/croix.gif" height="23" title="Pas d'affectation automatique"></label>
        </td></tr>`);
    $("input[name=choixOuvriere]").change(() => {
      switch ($("input[name=choixOuvriere]:checked").val()) {
        case "nourriture":
          monProfil.parametre["affectationRessource"].valeur = 2;
          break;
        case "materiaux":
          monProfil.parametre["affectationRessource"].valeur = 1;
          break;
        default:
          monProfil.parametre["affectationRessource"].valeur = 0;
          break;
      }
      monProfil.parametre["affectationRessource"].sauvegarde();
      return false;
    });
    // Affectation des ouvriéres inutilisé si on a la pref
    if (affection) {
      let RecolteMateriaux = numeral($("#RecolteMateriaux").val()).value(),
        RecolteNourriture = numeral($("#RecolteMRecolteNourritureateriaux").val()).value();
      // si on ne couvre pas le terrain et qu'on a assez d'ouvriére
      if (
        RecolteMateriaux + RecolteNourriture < Utils.terrain &&
        RecolteMateriaux + RecolteNourriture < Utils.ouvrieres
      ) {
        switch (affection) {
          case 1:
            $("#RecolteMateriaux").val(
              Math.min(Utils.ouvrieres - RecolteNourriture, Utils.terrain - RecolteNourriture),
            );
            break;
          case 2:
            $("#RecolteNourriture").val(
              Math.min(Utils.ouvrieres - RecolteMateriaux, Utils.terrain - RecolteMateriaux),
            );
            break;
          default:
            break;
        }
        $("#ChangeRessource").click();
      }
    }
  }
  /**
   * Sauvegarde la chasse en cours.
   *
   * @private
   * @method saveChasse
   */
  saveChasse(listeChasse) {
    if (
      !this._boiteComptePlus.hasOwnProperty("chasse") ||
      this._boiteComptePlus.chasse.length != listeChasse.length ||
      this._boiteComptePlus.chasse[0]["quantite"] != listeChasse[0]["quantite"] ||
      (listeChasse[0]["exp"].diff(this._boiteComptePlus.chasse[0]["exp"], "s") > 1 &&
        !Utils.comptePlus &&
        $("#boiteComptePlus").length)
    ) {
      this._boiteComptePlus.chasse = listeChasse;
      this._boiteComptePlus.startChasse = moment();
      this._boiteComptePlus.sauvegarder().majChasse();
    }
    return this;
  }
}
