/*
 * BoiteCombat.js
 * Hraesvelg
 **********************************************************************/

/**
 * Classe permettant d'analyser simuler et lancer des attaques.
 *
 * @class BoiteCombat
 * @constructor
 * @extends Boite
 */
class BoiteCombat extends Boite {
  constructor() {
    super(
      "o_boiteCombat",
      "Outils d'Attaque",
      `<div id='o_tabsCombat' class='o_tabs'><ul><li><a href='#o_tabsCombat1'>Analyser</a></li><li><a href='#o_tabsCombat2'>Simuler</a></li><li><a href='#o_tabsCombat3'>Multi-flood</a></li><li><a href='#o_tabsCombat4'>Temps de trajet</a></li></ul><div id='o_tabsCombat1'/><div id='o_tabsCombat2'/><div id='o_tabsCombat3'/><div id='o_tabsCombat4'/></div>`,
    );
    /**
     *
     */
    this._armee = null;
  }
  /**
   * Affiche la boite.
   *
   * @private
   * @method afficher
   */
  afficher() {
    if (super.afficher()) {
      $("#o_tabsCombat")
        .tabs({
          activate: (e, ui) => {
            this.css();
          },
        })
        .removeClass("ui-widget");
      this.analyser().simuler().multiFlood().calculatrice().css().event();
    }
    return this;
  }
  /**
   * Applique le style propre à la boite.
   *
   * @private
   * @method css
   */
  css() {
    super.css();
    $(
      "#o_resultatCombat tr:even, .o_tabs .ui-widget-header .ui-tabs-anchor, #o_calculatriceCombat tr:even, .o_mfResultatCible tr:even, #o_calcSondeRecap tbody tr:even, #o_calcAttaque tbody tr:even, #o_calcAttaque thead tr",
    ).css("background-color", monProfil.parametre["couleur2"].valeur);
    $(".o_tabs .ui-widget-header .ui-tabs-anchor").css(
      "background-color",
      monProfil.parametre["couleur2"].valeur,
    );
    $(".o_content a")
      .unbind("mouseenter mouseleave")
      .css("color", monProfil.parametre["couleurTexte"].valeur);
    $(".o_content li:not(.ui-state-active) a").css("color", "inherit");
    let matches = monProfil.parametre["couleurTexte"].valeur.match(
      /#([\da-f]{2})([\da-f]{2})([\da-f]{2})/i,
    );
    $(".o_content li:not(.ui-state-active):not(.ui-state-disabled) a").hover(
      (e) => {
        $(e.currentTarget).css(
          "color",
          "rgba(" +
            matches
              .slice(1)
              .map((m) => {
                return parseInt(m, 16);
              })
              .concat("0.5") +
            ")",
        );
      },
      (e) => {
        $(e.currentTarget).css("color", "inherit");
      },
    );
    $(".o_content .ui-state-disabled a").css({
      cursor: "not-allowed",
      "pointer-events": "all",
    });
    return this;
  }
  /**
   * Ajoute les evenements propres à la boite.
   *
   * @private
   * @method event
   */
  event() {
    super.event();
    return this;
  }
  /**
   * Formulaire pour analyser une rapport de combat.
   *
   * @private
   * @method analyse
   */
  analyser() {
    $("#o_tabsCombat1")
      .css({ "max-height": "70vh", "overflow-y": "auto" })
      .append(
        "<textarea id='o_rcCombat' class='o_maxWidth' placeholder='Rapport de combat/sonde...'></textarea><div class='o_marginT15'><table id='o_resultatCombat' class='o_maxWidth'></table></div><div id='o_calcSonde' class='o_marginT15' style='display:none'></div>",
      );
    return this.eventAnalyser();
  }
  /**
   *
   */
  eventAnalyser() {
    // event Analyse
    $("#o_rcCombat").on("input", (e) => {
      let combat = new Combat({ RC: e.currentTarget.value });
      if (combat.analyse()) {
        $("#o_resultatCombat").html(combat.toHTMLBoite());
        let sonde = combat.analyseSonde();
        if (sonde) this.afficherCalcAttaque(sonde);
        else $("#o_calcSonde").hide().empty();
        this.css();
      } else
        $.toast({
          ...TOAST_WARNING,
          text: "Le rapport de combat ne peut pas être analysé.",
        });
    });
    return this;
  }
  /**
   * Construit la section "Calcul attaque à lancer" sous le RC analysé.
   * Reproduit la zone B26-K54 du tableur Calystene XP v1.04 (feuille "Auto sur sonde") :
   * récap multiplicateur/vie/FdF/armes ennemi/défense/réplique + formulaire
   * d'attaque interactif avec colonne "Nb à ajouter pour FdF" et check JSN réplique.
   *
   * @private
   * @method afficherCalcAttaque
   * @param {Object} sonde résultat de Combat.analyseSonde()
   */
  afficherCalcAttaque(sonde) {
    let armes = monProfil.niveauRecherche[2],
      bouclier = monProfil.niveauRecherche[1],
      html = `<hr class='o_calcSepar'/>
            <div class='centre gras o_marginT15'>Analyse de la sonde</div>
            <table id='o_calcSondeRecap' class='o_maxWidth o_marginT15' cellspacing='0'>
              <tbody>
                <tr>
                  <td class='left'>Multiplicateur de vie ennemi</td>
                  <td class='right'>×${sonde.multiplicateur.toFixed(4)}</td>
                  <td class='left'>Vie HB × 3</td>
                  <td class='right'>${numeral(sonde.vieHBx3).format()}</td>
                </tr>
                <tr>
                  <td class='left small'>${sonde.lieuTxt ? "(" + sonde.lieuTxt + ")" : ""}</td>
                  <td></td>
                  <td class='left'>Vie AB (lieu de la sonde)</td>
                  <td class='right'>${numeral(Math.round(sonde.vieAB)).format()}</td>
                </tr>
                <tr class='gras'>
                  <td></td>
                  <td></td>
                  <td class='left'>FdF AB nécessaire pour réplique 10%</td>
                  <td class='right'>${numeral(Math.round(sonde.fdfNecessaire)).format()}</td>
                </tr>
                <tr>
                  <td class='left'>Armes de l'ennemi</td>
                  <td class='right'>${sonde.armesEnnemi}</td>
                  <td class='left'>Défense AB</td>
                  <td class='right'>${numeral(sonde.defenseAB).format()}</td>
                </tr>
                <tr>
                  <td></td>
                  <td></td>
                  <td class='left'>Réplique 10%</td>
                  <td class='right'>${numeral(Math.round(sonde.repliqueDef10)).format()}</td>
                </tr>
              </tbody>
            </table>
            <div class='o_marginT15 centre gras'>Calcul attaque à lancer</div>
            <div class='centre o_marginT15'>
              Niveau Armes <input id='o_calcArmes' value='${armes}' size='3'/>
              &nbsp;&nbsp;
              Niveau Bouclier <input id='o_calcBouclier' value='${bouclier}' size='3'/>
            </div>
            <table id='o_calcAttaque' class='o_maxWidth o_marginT15' cellspacing='0'>
              <thead>
                <tr>
                  <th class='left'>Type d'unité</th>
                  <th class='right'><span id='o_calcPlacementArmee' class='cursor'>${IMG_FLECHE} Nb à envoyer ${IMG_FLECHE}</span></th>
                  <th class='right'>Att AB</th>
                  <th class='right'>Nb à ajouter pour FdF</th>
                </tr>
              </thead>
              <tbody>`;
    for (let i = 1; i <= 14; i++)
      html += `<tr>
                <td class='left'>${NOM_UNITE[i]}</td>
                <td class='right'><input class='o_calcUnite right' data-idx='${i}' value='0' size='10'/></td>
                <td class='right o_calcAtt' data-idx='${i}'>0</td>
                <td class='right o_calcAjout' data-idx='${i}'>—</td>
              </tr>`;
    html += `</tbody>
              <tfoot>
                <tr class='gras'>
                  <td class='left'>TOTAUX</td>
                  <td class='right' id='o_calcNbTotal'>0</td>
                  <td class='right' id='o_calcAttTotal'>0</td>
                  <td></td>
                </tr>
                <tr>
                  <td class='left' colspan='2'>FdF AB nécessaire (réplique 10%)</td>
                  <td class='right gras' id='o_calcFdfNec'>${numeral(Math.round(sonde.fdfNecessaire)).format()}</td>
                  <td class='right' id='o_calcStatusAtt'>—</td>
                </tr>
                <tr>
                  <td class='left' colspan='2'>JSN nécessaires (réplique 10%)</td>
                  <td class='right gras' id='o_calcJsnNec'>0</td>
                  <td class='right' id='o_calcStatusJsn'>—</td>
                </tr>
                <tr><td colspan='4' class='reduce' style='padding-top:15px;'><em>Calculs basés sur le tableur <a href='http://alliancead2.free.fr/Outils/Repository/XP%20v1.04.xls' target='_blank' rel='noopener'>XP v1.04</a> de Calystène.</em></td></tr>
              </tfoot>
            </table>`;
    $("#o_calcSonde").html(html).data("sonde", sonde).show();
    $("#o_calcArmes, #o_calcBouclier").spinner({
      min: 0,
      max: 50,
      numberFormat: "d",
    });
    $(".o_calcUnite").spinner({ min: 0, numberFormat: "i" });
    $("#o_calcSonde input").on("input spin", () => this.actualiserCalcAttaque());
    $("#o_calcPlacementArmee").click((e) => {
      if (this._armee) this.placerArmeeCalc();
      else {
        this._armee = new Armee();
        this._armee.getArmee().then((data) => {
          this._armee.chargeData(data);
          this.placerArmeeCalc();
        });
      }
      return false;
    });
    return this.actualiserCalcAttaque();
  }
  /**
   * Remplit les inputs "Nb à envoyer" du calc avec l'armée courante du joueur,
   * ou les vide si elles correspondent déjà à l'armée chargée (toggle).
   *
   * @private
   * @method placerArmeeCalc
   */
  placerArmeeCalc() {
    let armeeTmp = new Array();
    for (let i = 1; i <= 14; i++)
      armeeTmp.push(numeral($(`.o_calcUnite[data-idx='${i}']`).val()).value() || 0);
    let allMatch = this._armee.unite.every((elt, i) => {
      return elt === armeeTmp[i];
    });
    for (let i = 1; i <= 14; i++)
      $(`.o_calcUnite[data-idx='${i}']`).spinner("value", allMatch ? 0 : this._armee.unite[i - 1]);
    return this.actualiserCalcAttaque();
  }
  /**
   * Recalcule en direct l'attaque par unité, l'attaque totale, la colonne
   * "Nb à ajouter pour FdF" et le check JSN nécessaires en cas de réplique 10%.
   *
   * @private
   * @method actualiserCalcAttaque
   */
  actualiserCalcAttaque() {
    let sonde = $("#o_calcSonde").data("sonde");
    if (!sonde) return this;
    let armes = numeral($("#o_calcArmes").val()).value() || 0,
      bouclier = numeral($("#o_calcBouclier").val()).value() || 0,
      bonusAtt = 1 + armes / 10,
      bonusVie = 1 + bouclier / 10,
      totalAtt = 0,
      totalNb = 0,
      qtyJsn = 0;
    for (let i = 1; i <= 14; i++) {
      let qty = numeral($(`.o_calcUnite[data-idx='${i}']`).val()).value() || 0,
        att = qty * ATT_UNITE[i] * bonusAtt;
      $(`.o_calcAtt[data-idx='${i}']`).text(numeral(Math.round(att)).format());
      totalAtt += att;
      totalNb += qty;
      if (i === 1) qtyJsn = qty;
    }
    $("#o_calcNbTotal").text(numeral(totalNb).format());
    $("#o_calcAttTotal").text(numeral(Math.round(totalAtt)).format());
    let manqueAtt = sonde.fdfNecessaire - totalAtt;
    for (let i = 1; i <= 14; i++) {
      let cell = $(`.o_calcAjout[data-idx='${i}']`);
      if (manqueAtt <= 0) cell.html("<span class='green'>FdF suffisante</span>");
      else cell.text(numeral(Math.ceil(manqueAtt / (ATT_UNITE[i] * bonusAtt))).format());
    }
    $("#o_calcStatusAtt").html(
      manqueAtt <= 0 ? "<span class='green'>OK</span>" : "<span class='red'>Alerte !</span>",
    );
    let jsnNec = Math.ceil(sonde.repliqueDef10 / (VIE_UNITE[1] * bonusVie));
    $("#o_calcJsnNec").text(numeral(jsnNec).format());
    $("#o_calcStatusJsn").html(
      qtyJsn >= jsnNec ? "<span class='green'>OK</span>" : "<span class='red'>Alerte !</span>",
    );
    return this;
  }
  /**
   *
   */
  simuler() {
    let html = `<table id="o_simulateur">
            <tr><td valign="top">
                <table id="o_simulateurArmee">
                <tr style="display:none"><td id="o_switchAvantApres" colspan="5" class="centre">Avant combat / Après combat</td></td></tr>
                <tr class="gras"><td><span id="o_placementAtt" class="cursor">${IMG_FLECHE} Attaquant ${IMG_FLECHE}</span> <span id="o_copierAtt">${IMG_COPY}</span></td><td colspan="3"><span id="o_switchArmee" class="cursor">${IMG_GAUCHE}  ${IMG_DROITE}</span></td><td><span id="o_copierDef">${IMG_COPY}</span> <span id="o_placementDef" class="cursor">${IMG_FLECHE} Défenseur ${IMG_FLECHE}</span></td>
                <tr><td><input value='0' size='12' name='o_unite1_1'/></td><td colspan="3">${NOM_UNITE[1]}</td><td><input value='0' size='12' name='o_unite2_1'/></td></tr>
                <tr><td><input value='0' size='12' name='o_unite1_2'/></td><td colspan="3">${NOM_UNITE[2]}</td><td><input value='0' size='12' name='o_unite2_2'/></td></tr>
                <tr><td><input value='0' size='12' name='o_unite1_3'/></td><td colspan="3">${NOM_UNITE[3]}</td><td><input value='0' size='12' name='o_unite2_3'/></td></tr>
                <tr><td><input value='0' size='12' name='o_unite1_4'/></td><td colspan="3">${NOM_UNITE[4]}</td><td><input value='0' size='12' name='o_unite2_4'/></td></tr>
                <tr><td><input value='0' size='12' name='o_unite1_5'/></td><td colspan="3">${NOM_UNITE[5]}</td><td><input value='0' size='12' name='o_unite2_5'/></td></tr>
                <tr><td><input value='0' size='12' name='o_unite1_6'/></td><td colspan="3">${NOM_UNITE[6]}</td><td><input value='0' size='12' name='o_unite2_6'/></td></tr>
                <tr><td><input value='0' size='12' name='o_unite1_7'/></td><td colspan="3">${NOM_UNITE[7]}</td><td><input value='0' size='12' name='o_unite2_7'/></td></tr>
                <tr><td><input value='0' size='12' name='o_unite1_8'/></td><td colspan="3">${NOM_UNITE[8]}</td><td><input value='0' size='12' name='o_unite2_8'/></td></tr>
                <tr><td><input value='0' size='12' name='o_unite1_9'/></td><td colspan="3">${NOM_UNITE[9]}</td><td><input value='0' size='12' name='o_unite2_9'/></td></tr>
                <tr><td><input value='0' size='12' name='o_unite1_10'/></td><td colspan="3">${NOM_UNITE[10]}</td><td><input value='0' size='12' name='o_unite2_10'/></td></tr>
                <tr><td><input value='0' size='12' name='o_unite1_11'/></td><td colspan="3">${NOM_UNITE[11]}</td><td><input value='0' size='12' name='o_unite2_11'/></td></tr>
                <tr><td><input value='0' size='12' name='o_unite1_12'/></td><td colspan="3">${NOM_UNITE[12]}</td><td><input value='0' size='12' name='o_unite2_12'/></td></tr>
                <tr><td><input value='0' size='12' name='o_unite1_13'/></td><td colspan="3">${NOM_UNITE[13]}</td><td><input value='0' size='12' name='o_unite2_13'/></td></tr>
                <tr><td><input value='0' size='12' name='o_unite1_14'/></td><td colspan="3">${NOM_UNITE[14]}</td><td><input value='0' size='12' name='o_unite2_14'/></td></tr>
                <tr><td id="o_vieAtt" class="right">0</td><td>${IMG_VIE}</td><td>Vie</td><td>${IMG_VIE}</td><td id="o_vieDef" class="right">0</td></tr>
                <tr><td id="o_degatAtt" class="right">0</td><td>${IMG_ATT}</td><td>Dégât</td><td>${IMG_DEF}</td><td id="o_degatDef" class="right">0</td></tr>
                </table>
            </td><td valign="top">
                <table id="o_simulateurNiveau">
                <tr class="gras entete"><td id="o_bonusAtt" class="cursor">${IMG_FLECHE} Attaquant ${IMG_FLECHE}</td><td colspan="2"></td><td id="o_bonusDef" class="cursor">${IMG_FLECHE} Défenseur ${IMG_FLECHE}</td>
                <tr><td><input id="o_bouclier1" value='${monProfil.niveauRecherche[1]}' size='6' name='o_bouclier1'/></td><td colspan="2">Bouclier</td><td><input id="o_bouclier2" value='${monProfil.niveauRecherche[1]}' size='6' name='o_bouclier2'/></td></tr>
                <tr><td><input id="o_armes1" value='${monProfil.niveauRecherche[2]}' size='6' name='o_armes1'/></td><td colspan="2">Armes</td><td><input id="o_armes2" value='${monProfil.niveauRecherche[2]}' size='6' name='o_armes2'/></td></tr>
                <tr><td><input id="o_etable1" value='${monProfil.niveauConstruction[12]}' size='6' name='o_etable1'/></td><td colspan="2">Etable à cochenilles</td><td><input id="o_etable2" value='${monProfil.niveauConstruction[12]}' size='6' name='o_etable2'/></td></tr>
                <tr><td colspan="4" height="20"></td></tr>
                <tr class="gras entete centre"><td id="o_bonusLieu" colspan="4" class="cursor">${IMG_FLECHE} Lieu ${IMG_FLECHE}</td></tr>
                <tr><td></td><td class="right"><input id="o_terrain" type="radio" name="o_lieu" value="${LIEU.TERRAIN}" checked></td><td class="left">Terrain</td><td></td></tr>
                <tr><td></td><td class="right"><input id="o_dome" type="radio" value="${LIEU.DOME}" name="o_lieu"></td><td class="left">Dome</td><td><input id="o_domeNiveau" value='${monProfil.niveauConstruction[9]}' size='6' name='o_dome'/></td></tr>
                <tr><td></td><td class="right"><input id="o_loge" type="radio" value="${LIEU.LOGE}" name="o_lieu"></td><td class="left">Loge</td><td><input id="o_logeNiveau" value='${monProfil.niveauConstruction[10]}' size='6' name='o_loge'/></td></tr>
                <tr><td colspan="4" height="20"></td></td></tr>
                <tr class="gras entete centre"><td colspan="5">Position</td></tr>
                <tr><td id="o_positionAtt" class="gras">Attaquant</td><td colspan="2"><div id="o_positionJoueur"></div></td><td id="o_positionDef">Défenseur</td></tr>
                <tr><td colspan="4" height="20"></td></td></tr>
                <tr><td colspan="4" class="centre"><button id="o_simuler" class="o_button">Simuler</button></td></td></tr>
                </table>
            </td></tr>
            </table>`;
    $("#o_tabsCombat2").append(html);
    // spinner
    $("#o_simulateurArmee input").spinner({ min: 0, numberFormat: "i" });
    $("#o_bouclier1, #o_armes1, #o_bouclier2, #o_armes2, #o_etable1, #o_etable2").spinner({
      min: 0,
      max: 50,
      numberFormat: "d2",
    });
    $("#o_logeNiveau, #o_domeNiveau").spinner({
      min: 0,
      max: 50,
      numberFormat: "d2",
    });
    $("#o_positionJoueur").slider({
      min: 0,
      max: 1,
      change: (e, ui) => {
        if (ui.value) {
          // si != 0 alors on est defenseur
          $("#o_positionAtt").removeClass("gras");
          $("#o_positionDef").addClass("gras");
        } else {
          // sinon on est attaquant
          $("#o_positionDef").removeClass("gras");
          $("#o_positionAtt").addClass("gras");
        }
      },
    });
    return this.eventSimulateur();
  }
  /**
   *
   */
  eventSimulateur() {
    $("#o_simulateurArmee input").on("input spin", (e, ui) => {
      let nombre = numeral(ui ? ui.value : e.currentTarget.value).value();
      let name = $(e.currentTarget).attr("name"),
        armee = new Armee();
      // si le name contient 1 c'est l'attaquant sinon la defense
      if (name.includes("1_")) this.actualiserStatistique(name, nombre);
      else this.actualiserStatistique("", 0, name, nombre);
      $(e.currentTarget).spinner("value", nombre);
    });
    $("#o_placementAtt").click((e) => {
      if (this._armee) this.placerArmee(1).actualiserStatistique();
      else {
        this._armee = new Armee();
        this._armee.getArmee().then((data) => {
          this._armee.chargeData(data);
          this.placerArmee(1).actualiserStatistique();
        });
      }
      return false;
    });
    $("#o_placementDef").click((e) => {
      if (this._armee) this.placerArmee(0).actualiserStatistique();
      else {
        this._armee = new Armee();
        this._armee.getArmee().then((data) => {
          this._armee.chargeData(data);
          this.placerArmee(0).actualiserStatistique();
        });
      }
      return false;
    });
    $("#o_switchArmee").click((e) => {
      this.permuterArmee().actualiserStatistique();
      return false;
    });
    $("#o_copierAtt").click((e) => {
      this.copierCollerArmee("ATT");
    });
    $("#o_copierDef").click((e) => {
      this.copierCollerArmee("DEF");
    });
    // event sur les bonus joueurs
    $("#o_bonusAtt").click((e) => {
      $("#o_armes1").spinner(
        "value",
        $("#o_armes1").spinner("value") == monProfil.niveauRecherche[2]
          ? 0
          : monProfil.niveauRecherche[2],
      );
      $("#o_bouclier1").spinner(
        "value",
        $("#o_bouclier1").spinner("value") == monProfil.niveauRecherche[1]
          ? 0
          : monProfil.niveauRecherche[1],
      );
      $("#o_etable1").spinner(
        "value",
        $("#o_etable1").spinner("value") == monProfil.niveauConstruction[12]
          ? 0
          : monProfil.niveauConstruction[12],
      );
      this.actualiserStatistique();
      return false;
    });
    $("#o_bonusDef").click((e) => {
      $("#o_armes2").spinner(
        "value",
        $("#o_armes2").spinner("value") == monProfil.niveauRecherche[2]
          ? 0
          : monProfil.niveauRecherche[2],
      );
      $("#o_bouclier2").spinner(
        "value",
        $("#o_bouclier2").spinner("value") == monProfil.niveauRecherche[1]
          ? 0
          : monProfil.niveauRecherche[1],
      );
      $("#o_etable2").spinner(
        "value",
        $("#o_etable2").spinner("value") == monProfil.niveauConstruction[12]
          ? 0
          : monProfil.niveauConstruction[12],
      );
      this.actualiserStatistique();
      return false;
    });
    $("#o_bouclier1").on("input spin", (e, ui) => {
      this.actualiserStatistique(
        "",
        0,
        "",
        0,
        numeral(ui ? ui.value : e.currentTarget.value).value(),
      );
    });
    $("#o_armes1").on("input spin", (e, ui) => {
      this.actualiserStatistique(
        "",
        0,
        "",
        0,
        -1,
        numeral(ui ? ui.value : e.currentTarget.value).value(),
      );
    });
    $("#o_bouclier2").on("input spin", (e, ui) => {
      this.actualiserStatistique(
        "",
        0,
        "",
        0,
        -1,
        -1,
        numeral(ui ? ui.value : e.currentTarget.value).value(),
      );
    });
    $("#o_armes2").on("input spin", (e, ui) => {
      this.actualiserStatistique(
        "",
        0,
        "",
        0,
        -1,
        -1,
        -1,
        numeral(ui ? ui.value : e.currentTarget.value).value(),
      );
    });
    // event bonus lieu
    $("#o_simulateurNiveau input[name='o_lieu']").change((e) => {
      this.actualiserStatistique();
    });
    $("#o_bonusLieu").click((e) => {
      $("#o_domeNiveau").spinner(
        "value",
        $("#o_domeNiveau").spinner("value") == monProfil.niveauConstruction[9]
          ? 0
          : monProfil.niveauConstruction[9],
      );
      $("#o_logeNiveau").spinner(
        "value",
        $("#o_logeNiveau").spinner("value") == monProfil.niveauConstruction[10]
          ? 0
          : monProfil.niveauConstruction[10],
      );
      this.actualiserStatistique();
      return false;
    });
    $("#o_domeNiveau").on("input spin", (e, ui) => {
      this.actualiserStatistique(
        "",
        0,
        "",
        0,
        -1,
        -1,
        -1,
        -1,
        numeral(ui ? ui.value : e.currentTarget.value).value(),
      );
    });
    $("#o_logeNiveau").on("input spin", (e, ui) => {
      this.actualiserStatistique(
        "",
        0,
        "",
        0,
        -1,
        -1,
        -1,
        -1,
        -1,
        numeral(ui ? ui.value : e.currentTarget.value).value(),
      );
    });
    $("#o_simuler").click((e) => {
      this.lancerSimulation();
      return false;
    });
    return this;
  }
  /**
   *
   */
  lancerSimulation() {
    let uniteATT = {},
      uniteDef = {};
    // données attaquant
    $("#o_simulateurArmee tr:gt(1)")
      .find("input:eq(0)")
      .each((i, elt) => {
        uniteATT[NOM_UNITE[i + 1]] = $(elt).spinner("value");
      });
    // données defenseur
    $("#o_simulateurArmee tr:gt(1)")
      .find("input:eq(1)")
      .each((i, elt) => {
        uniteDef[NOM_UNITE[i + 1]] = $(elt).spinner("value");
      });
    // preparation du combat
    let combat = new Combat({
      id: moment().valueOf(),
      lieu: $("input[name='o_lieu']:checked").val(),
      attaquant: new Armee({ unite: uniteATT }),
      defenseur: new Armee({ unite: uniteDef }),
      pointDeVue: $("#o_positionJoueur").slider("value"),
    });
    // modification des niveaux des joueurs
    combat.attaquant.niveauRecherche[1] = $("#o_bouclier1").spinner("value");
    combat.attaquant.niveauRecherche[2] = $("#o_armes1").spinner("value");
    combat.defenseur.niveauRecherche[1] = $("#o_bouclier2").spinner("value");
    combat.defenseur.niveauRecherche[2] = $("#o_armes2").spinner("value");
    combat.defenseur.niveauConstruction[9] = $("#o_domeNiveau").spinner("value");
    combat.defenseur.niveauConstruction[10] = $("#o_logeNiveau").spinner("value");
    // lancement du combat
    if (combat.armee1.getSommeUnite() && combat.armee2.getSommeUnite()) {
      combat.simuler().genererRC();
      // affichage des armées retours dans le formulaire
      for (let i = 0; i < 14; i++) {
        $("input[name='o_unite1_" + (i + 1) + "']").spinner("value", combat.armee1Ap.unite[i]);
        $("input[name='o_unite2_" + (i + 1) + "']").spinner("value", combat.armee2Ap.unite[i]);
      }
      this.actualiserStatistique();
      // ajout de l'event pour switch les armées avant et aprés combat
      $("#o_switchAvantApres")
        .off()
        .click((e) => {
          let armeeAttTmp = new Array(),
            armeeDefTmp = new Array();
          for (let i = 0; i < 14; i++) {
            armeeAttTmp.push($("input[name='o_unite1_" + (i + 1) + "']").spinner("value"));
            armeeDefTmp.push($("input[name='o_unite2_" + (i + 1) + "']").spinner("value"));
          }
          // si dans le formulaire on a l'armée aprés on plalce l'armée avant sinon l'armée aprés
          if (
            combat.armee1Ap.unite.every((elt, i) => {
              return elt == armeeAttTmp[i];
            }) &&
            combat.armee2Ap.unite.every((elt, i) => {
              return elt == armeeDefTmp[i];
            })
          ) {
            for (let i = 0; i < 14; i++) {
              $("input[name='o_unite1_" + (i + 1) + "']").spinner("value", combat.armee1.unite[i]);
              $("input[name='o_unite2_" + (i + 1) + "']").spinner("value", combat.armee2.unite[i]);
            }
          } else {
            for (let i = 0; i < 14; i++) {
              $("input[name='o_unite1_" + (i + 1) + "']").spinner(
                "value",
                combat.armee1Ap.unite[i],
              );
              $("input[name='o_unite2_" + (i + 1) + "']").spinner(
                "value",
                combat.armee2Ap.unite[i],
              );
            }
          }
          this.actualiserStatistique();
        })
        .parent()
        .show();
    } else
      $.toast({
        ...TOAST_ERROR,
        text: "Le combat ne peut pas etre simulé : aucune unité.",
      });
    return this;
  }
  /**
   *
   */
  placerArmee(position) {
    let armeeTmp = new Array();
    if (position) {
      // on prepare un tableau des unités pour savoir si on renseigne l'armée ou on vide des champs
      for (let i = 0; i < this._armee.unite.length; i++)
        armeeTmp.push($(`#o_simulateurArmee tr:eq(${i + 1}) input:eq(0)`).spinner("value"));
      if (
        this._armee.unite.every((elt, i) => {
          return elt == armeeTmp[i];
        })
      ) {
        for (let i = 0; i < this._armee.unite.length; i++)
          $(`#o_simulateurArmee tr:eq(${i + 2}) input:eq(0)`).spinner("value", 0);
      } else {
        for (let i = 0; i < this._armee.unite.length; i++)
          $(`#o_simulateurArmee tr:eq(${i + 2}) input:eq(0)`).spinner(
            "value",
            this._armee.unite[i],
          );
      }
    } else {
      for (let i = 0; i < this._armee.unite.length; i++)
        armeeTmp.push($(`#o_simulateurArmee tr:eq(${i + 1}) input:eq(1)`).spinner("value"));
      if (
        this._armee.unite.every((elt, i) => {
          return elt == armeeTmp[i];
        })
      ) {
        for (let i = 0; i < this._armee.unite.length; i++)
          $(`#o_simulateurArmee tr:eq(${i + 2}) input:eq(1)`).spinner("value", 0);
      } else {
        for (let i = 0; i < this._armee.unite.length; i++)
          $(`#o_simulateurArmee tr:eq(${i + 2}) input:eq(1)`).spinner(
            "value",
            this._armee.unite[i],
          );
      }
    }
    return this;
  }
  /**
   *
   */
  permuterArmee() {
    // switch des armées
    for (let i = 0; i < 14; i++) {
      let valueTmp = $("input[name='o_unite1_" + (i + 1) + "']").spinner("value");
      $("input[name='o_unite1_" + (i + 1) + "']").spinner(
        "value",
        $("input[name='o_unite2_" + (i + 1) + "']").spinner("value"),
      );
      $("input[name='o_unite2_" + (i + 1) + "']").spinner("value", valueTmp);
    }
    // switch des bonus
    let tmpBonusArme = $("#o_armes1").spinner("value"),
      tmpBonusBouclier = $("#o_bouclier1").spinner("value");
    $("#o_armes1").spinner("value", $("#o_armes2").spinner("value"));
    $("#o_bouclier1").spinner("value", $("#o_bouclier2").spinner("value"));
    $("#o_armes2").spinner("value", tmpBonusArme);
    $("#o_bouclier2").spinner("value", tmpBonusBouclier);
    // switch de la position
    let tmpPosition = $("#o_positionJoueur").slider("option", "value");
    $("#o_positionJoueur").slider("option", "value", 1 - tmpPosition);
    return this;
  }
  /**
   *
   */
  actualiserStatistique(
    nameAtt = "",
    valueAtt = 0,
    nameDef = "",
    valueDef = 0,
    bouclier1 = -1,
    armes1 = -1,
    bouclier2 = -1,
    armes2 = -1,
    niveauDome = -1,
    niveauLoge = -1,
  ) {
    let armesAtt = armes1 != -1 ? armes1 : $("#o_armes1").spinner("value"),
      bouclierAtt = bouclier1 != -1 ? bouclier1 : $("#o_bouclier1").spinner("value");
    let armesDef = armes2 != -1 ? armes2 : $("#o_armes2").spinner("value"),
      bouclierDef = bouclier2 != -1 ? bouclier2 : $("#o_bouclier2").spinner("value");
    let lieu = parseInt($("#o_simulateurNiveau input[name='o_lieu']:checked").val()),
      bonusLieu = 0;
    switch (lieu) {
      case LIEU.DOME:
        bonusLieu = niveauDome != -1 ? niveauDome : $("#o_domeNiveau").spinner("value");
        break;
      case LIEU.LOGE:
        bonusLieu = niveauLoge != -1 ? niveauLoge : $("#o_logeNiveau").spinner("value");
        break;
      default:
        break;
    }
    let armee = new Armee();
    // données attaquant
    $("#o_simulateurArmee tr:gt(1)")
      .find("input:eq(0)")
      .each((i, elt) => {
        armee.unite[i] = $(elt).attr("name") == nameAtt ? valueAtt : $(elt).spinner("value");
      });
    $("#o_vieAtt").text(numeral(armee.getTotalVie(bouclierAtt)).format());
    $("#o_degatAtt").text(numeral(armee.getTotalAtt(armesAtt)).format());
    // données defenseur
    armee = new Armee();
    $("#o_simulateurArmee tr:gt(1)")
      .find("input:eq(1)")
      .each((i, elt) => {
        armee.unite[i] = $(elt).attr("name") == nameDef ? valueDef : $(elt).spinner("value");
      });
    $("#o_vieDef").text(numeral(armee.getTotalVie(bouclierDef, lieu, bonusLieu)).format());
    $("#o_degatDef").text(numeral(armee.getTotalDef(armesDef)).format());
    return this;
  }
  /**
   *
   */
  copierCollerArmee(position) {
    let camp = position == "ATT" ? 1 : 2;
    ouvrirImportArmee((armee) => {
      for (let i = 0; i < armee.unite.length; i++)
        $("input[name='o_unite" + camp + "_" + (i + 1) + "']").spinner("value", armee.unite[i]);
      this.actualiserStatistique();
    });
  }
  /**
   * Onglet Multi-flood : un flood optimisé sur plusieurs cibles, calculé avec
   * l'armée disponible et les créneaux d'attaque libres (VA + 1 au total).
   *
   * @private
   * @method multiFlood
   */
  multiFlood() {
    $("#o_tabsCombat3").append(`<div id="o_multiFlood" class="centre">
            <div id="o_mfFormWrap"></div>
            <p class="o_marginT15"><label title="Les unités qui ne servent pas à prendre du terrain partent avec la dernière attaque, la plus longue : toute l'armée est à l'abri pendant le flood"><input type="checkbox" id="o_mfToutEnvoyer"/> Envoyer toute l'armée (le surplus part avec la dernière attaque)</label></p>
            <div id="o_mfResultats" class="o_marginT15"></div>
            <p id="o_mfRecap" class="o_marginT15"></p>
            <button id="o_mfLancer" class="o_button f_success o_marginT15" type="button" disabled>Lancer ces attaques</button>
        </div>`);
    /**
     * Cibles sélectionnées. Chaque entrée :
     * { pseudo, id, terrain, terrainImpact, type, x, y, tempsParcours }
     */
    this._mfCibles = [];
    // mon terrain quand les attaques arriveront, si saisi (null = actuel)
    this._mfTerrainAtt = null;
    // armée et attaques en cours chargées depuis Armee.php
    this._mfDisponible = null;
    this._mfEnCours = 0;
    this._mfRenderForm();
    $("#o_mfToutEnvoyer").change(() => this.simulerMultiFlood());
    this._mfCharger();
    return this;
  }
  /**
   * (Re)charge l'armée et les attaques en cours depuis Armee.php, puis recalcule.
   *
   * @private
   * @method _mfCharger
   */
  _mfCharger() {
    this._mfArmee = new Armee();
    // niveaux relus : la Vitesse d'attaque fixe les créneaux et les temps de trajet
    return Promise.all([
      this._mfArmee.getArmee(),
      $.ajax({ url: location.origin + "/laboratoire.php" }),
      this._mfCompterEnCours(),
    ]).then(([data, laboratoire]) => {
      this._mfArmee.chargeData(data);
      monProfil.chargerRecherche(laboratoire);
      this._mfCibles.forEach((c) => (c.tempsParcours = monProfil.getTempsParcours2(c)));
      this._mfDisponible = Math.max(0, this._mfArmee.getSommeUnite() - Armee.reserveFlood());
      this._mfRenderForm();
      this.simulerMultiFlood();
    });
  }
  /**
   * Attaques en cours, comptées sur la page d'attaque de la première cible
   * comme le fait le lanceur de flood (attaques et renforts). Sans cible, on
   * garde le compte précédent : il ne sert qu'une fois une cible ajoutée.
   *
   * @private
   * @method _mfCompterEnCours
   */
  _mfCompterEnCours() {
    let cible = this._mfCibles.find((c) => c.id > 0);
    if (!cible) return Promise.resolve();
    return $.get(`${location.origin}/ennemie.php?Attaquer=${cible.id}`).then(
      (html) => {
        this._mfEnCours =
          Utils.parseHtml(html)
            .text()
            .split(/- Vous allez attaquer|- Des renforts arrivent/g).length - 1;
      },
      () => {},
    );
  }
  /**
   * Fin du lancement (complet ou interrompu) : l'armée et les créneaux ont
   * changé, le plan est recalculé.
   *
   * @private
   * @method _mfFinLancement
   */
  _mfFinLancement() {
    $("#o_mfLancer").text("Lancer ces attaques");
    $("#o_mfToutEnvoyer").prop("disabled", false);
    // laisse au jeu le temps d'enregistrer la dernière attaque
    setTimeout(() => this._mfCharger(), 1500);
  }
  /**
   * Créneaux d'attaque encore libres : VA + 1 au total, moins les attaques en cours.
   *
   * @private
   * @method _mfCreneaux
   */
  _mfCreneaux() {
    return Math.max(0, monProfil.niveauRecherche[6] + 1 - this._mfEnCours);
  }
  /**
   * Terrain de la cible quand les attaques arriveront : celui saisi (flood
   * d'un collègue qui la touche avant), sinon celui de son profil.
   *
   * @private
   * @method _mfTerrainCible
   */
  _mfTerrainCible(cible) {
    return cible.terrainImpact ?? cible.terrain;
  }
  /**
   * Rend le tableau-formulaire au look natif :
   * Attaquant | label | cible1 | cible2 | cible3.
   * Re-rend complètement à chaque ajout/retrait → re-bind derrière.
   *
   * @private
   * @method _mfRenderForm
   */
  _mfRenderForm() {
    let cibles = [...this._mfCibles].sort((a, b) => a.tempsParcours - b.tempsParcours),
      placeholder = `<td><input type="text" disabled placeholder="—"/></td>`,
      ligne = (render) =>
        [0, 1, 2].map((i) => (i < cibles.length ? render(cibles[i]) : placeholder)),
      pseudoRow = [0, 1, 2]
        .map((i) =>
          i < cibles.length
            ? `<td><input type="text" class="o_mfPseudoCell cursor" data-pseudo="${cibles[i].pseudo}" value="${cibles[i].pseudo}" readonly title="Cliquer pour retirer"/></td>`
            : i === cibles.length
              ? `<td><input type="text" id="o_mfPseudoCible" placeholder="Pseudo…"/></td>`
              : placeholder,
        )
        .join(""),
      terrainRow = ligne(
        (c) =>
          `<td><input type="text" class="o_mfTerrain" data-pseudo="${c.pseudo}" value="${this._mfTerrainCible(c)}" title="Terrain de ${c.pseudo} quand vos attaques arriveront (profil : ${numeral(c.terrain).format()} cm²). À baisser si un collègue la floode avant vous."/></td>`,
      ).join(""),
      trajetRow = ligne(
        (c) => `<td><input type="text" value="${Utils.intToTime(c.tempsParcours)}" disabled/></td>`,
      ).join(""),
      disponible = this._mfDisponible == null ? "…" : numeral(this._mfDisponible).format(),
      creneaux = this._mfCreneaux();
    $("#o_mfFormWrap").html(`
        <table id="o_mfForm" class="o_maxWidth centre" cellspacing="0">
          <thead>
            <tr>
              <th>Attaquant</th>
              <th></th>
              <th colspan="3">Cibles</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><input type="text" value="${monProfil.pseudo}" disabled/></td>
              <td class="right">Pseudo</td>
              ${pseudoRow}
            </tr>
            <tr>
              <td><input type="text" id="o_mfTerrainAtt" value="${this._mfTerrainAtt ?? Utils.terrain}" title="Votre terrain quand vos attaques arriveront (actuel : ${numeral(Utils.terrain).format()} cm²). À changer si vous savez qu'on vous touche avant."/></td>
              <td class="right">Terrain</td>
              ${terrainRow}
            </tr>
            <tr>
              <td><input type="text" value="${disponible}" disabled title="Armée moins la réserve des paramètres de flood"/></td>
              <td class="right reduce">Armée / Trajet</td>
              ${trajetRow}
            </tr>
          </tbody>
        </table>
        <p class="reduce">${creneaux} créneau${creneaux > 1 ? "x" : ""} d'attaque libre${creneaux > 1 ? "s" : ""} sur ${monProfil.niveauRecherche[6] + 1}</p>`);
    this._mfBindForm();
  }
  /**
   *
   */
  _mfBindForm() {
    $("#o_mfPseudoCible")
      .autocomplete({
        minLength: 1,
        source: (request, response) => {
          Joueur.rechercher(request.term).then(
            (data) => {
              let items = Utils.extraitRecherche(data, true, false);
              response(
                items.map((it) => ({
                  label: it.value_avec_html,
                  value: it.value,
                })),
              );
            },
            () => response([]),
          );
        },
        select: (event, ui) => {
          this._mfAjouterParPseudo(ui.item.value);
          return false;
        },
      })
      .on("keydown", (e) => {
        if (e.key === "Enter") {
          let pseudo = $("#o_mfPseudoCible").val().trim();
          if (pseudo) this._mfAjouterParPseudo(pseudo);
          e.preventDefault();
        }
      });
    $("#o_mfForm .o_mfPseudoCell").click((e) => {
      let pseudo = $(e.currentTarget).data("pseudo");
      this._mfCibles = this._mfCibles.filter((c) => c.pseudo !== pseudo);
      this._mfRenderForm();
      this.simulerMultiFlood();
    });
    $("#o_mfTerrainAtt")
      .spinner({ min: 0, numberFormat: "i" })
      .on("change spinstop", (e) => {
        let valeur = numeral($(e.currentTarget).val()).value();
        this._mfTerrainAtt = valeur > 0 && valeur != Utils.terrain ? valeur : null;
        this.simulerMultiFlood();
      });
    // terrain de la cible à l'arrivée des attaques — recalcul à chaque changement
    $("#o_mfForm input.o_mfTerrain")
      .spinner({ min: 0, numberFormat: "i" })
      .on("change spinstop", (e) => {
        let $el = $(e.currentTarget),
          cible = this._mfCibles.find((c) => c.pseudo === $el.data("pseudo")),
          valeur = numeral($el.val()).value();
        if (!cible) return;
        cible.terrainImpact = valeur > 0 && valeur != cible.terrain ? valeur : null;
        this.simulerMultiFlood();
      });
  }
  /**
   * Pipeline d'ajout d'une cible par son pseudo :
   * 1. Tente d'abord de la trouver dans le radar local (immédiat, pas de réseau).
   * 2. Sinon, fetch `Membre.php?Pseudo=...` pour extraire id/terrain/x/y.
   * `classementAlliance.php` (utilisé pour l'autocomplete) ne renvoie que
   * `{value, url}` — pas assez pour la simulation, d'où l'enrichissement.
   *
   * @private
   * @method _mfAjouterParPseudo
   * @param {String} pseudo
   */
  _mfAjouterParPseudo(pseudo) {
    if (!this._mfRadar) this._mfRadar = new BoiteRadar();
    let local = this._mfRadar.joueurs[pseudo];
    if (local) {
      this.ajouterCibleMultiFlood({
        pseudo: local.pseudo,
        id: local.id,
        terrain: local.terrain,
        type: "radar",
        x: local.x,
        y: local.y,
      });
      return;
    }
    this._mfFetchProfil(pseudo).then(
      (cible) => this.ajouterCibleMultiFlood(cible),
      (err) => {
        console.error("[multiFlood] enrichissement profil échoué", err);
        $.toast({
          ...TOAST_WARNING,
          text: `Impossible de récupérer les infos de ${pseudo}.`,
        });
      },
    );
  }
  /**
   * Fetch et parse la page profil pour extraire les champs nécessaires à la
   * simulation. Sélecteurs alignés sur ce que fait déjà `Profil.js:30-39` —
   * cf. docs/scenarios/consulter-profil/report.md.
   *
   * @private
   * @method _mfFetchProfil
   * @param {String} pseudo
   * @return {Promise<Object>}
   */
  _mfFetchProfil(pseudo) {
    let url = `${location.origin}/Membre.php?Pseudo=${encodeURIComponent(pseudo)}`;
    return $.get(url).then((html) => {
      let $page = Utils.parseHtml(html),
        coords = Utils.coordonnees($page.find(".boite_membre")),
        idLink = $page.find("a[href^='commerce.php?ID=']").attr("href") || "",
        idMatch = idLink.match(/\d+/);
      return {
        pseudo,
        id: idMatch ? parseInt(idMatch[0]) : 0,
        terrain: numeral($page.find(".tableau_score tr:eq(1) td:eq(1)").text()).value() || 0,
        type: "profil",
        // 0 / 0 si introuvables, comme avant
        x: Math.max(0, coords.x),
        y: Math.max(0, coords.y),
      };
    });
  }
  /**
   *
   */
  _mfNormaliserCible(d) {
    return {
      pseudo: d.value,
      id: parseInt(d.id),
      terrain: parseInt(d.terrain),
      type: d.type,
      x: parseInt(d.x),
      y: parseInt(d.y),
    };
  }
  /**
   *
   */
  ajouterCibleMultiFlood(cible) {
    if (this._mfCibles.some((c) => c.pseudo === cible.pseudo)) {
      $.toast({
        ...TOAST_WARNING,
        text: `${cible.pseudo} est déjà dans la liste.`,
      });
      return;
    }
    cible.tempsParcours = monProfil.getTempsParcours2(cible);
    this._mfCibles.push(cible);
    this._mfRenderForm();
    this.simulerMultiFlood();
    // première cible : on peut maintenant compter les attaques en cours comme le jeu
    if (this._mfCibles.length == 1)
      this._mfCompterEnCours().then(() => {
        this._mfRenderForm();
        this.simulerMultiFlood();
      });
  }
  /**
   * Plan du multi-flood : les cibles dans l'ordre d'arrivée (temps de
   * trajet), chacune floodée de façon optimale avec ce qui reste d'unités et
   * de créneaux, à partir de mon terrain (saisi, sinon l'actuel) après les
   * cibles précédentes. Les
   * unités en trop restent à la maison, sauf si « Envoyer toute l'armée » est
   * coché : elles partent alors avec la dernière attaque.
   *
   * @private
   * @method simulerMultiFlood
   */
  simulerMultiFlood() {
    if (!this._mfArmee) this._mfArmee = new Armee();
    let cibles = [...this._mfCibles].sort((a, b) => a.tempsParcours - b.tempsParcours),
      mfTerrain = this._mfTerrainAtt ?? Utils.terrain,
      unites = this._mfDisponible ?? 0,
      creneaux = this._mfCreneaux(),
      resultats = [];
    cibles.forEach((cible) => {
      let terrainCible = this._mfTerrainCible(cible),
        r = { cible, terrainCible, attaques: [], tdcAttDebut: mfTerrain, tdcAttFin: mfTerrain };
      resultats.push(r);
      // portée vérifiée par le jeu au lancement, avec les terrains de ce
      // moment-là : terrain de la cible entre la moitié et le triple du mien
      if (cible.terrain > Utils.terrain * 3) return (r.tropHaute = true);
      if (cible.terrain < Utils.terrain * 0.5) return (r.tropBasse = true);
      if (!unites || !creneaux) return;
      this._mfArmee.floods = [];
      let donneesFlood = {
        tdcAtt: mfTerrain,
        tdcCible: terrainCible,
        unite: unites,
        reste: creneaux,
        attaques: [],
      };
      this._mfArmee.optimiserFlood(donneesFlood);
      let tdcAtt = mfTerrain,
        tdcCible = terrainCible;
      this._mfArmee.floods
        .filter((p) => p > 0)
        .forEach((p) => {
          r.attaques.push({
            troupes: p,
            prise: p,
            tdcAttAvant: tdcAtt,
            tdcCibleAvant: tdcCible,
            pct: tdcCible > 0 ? Math.round((p / tdcCible) * 100) : 0,
          });
          tdcAtt += p;
          tdcCible -= p;
          unites -= p;
          creneaux--;
        });
      r.tdcAttFin = tdcAtt;
      r.tdcCibleFin = tdcCible;
      mfTerrain = tdcAtt;
    });
    // le surplus voyage avec la dernière attaque, sans rien prendre de plus
    let derniere = resultats.flatMap((r) => r.attaques).slice(-1)[0];
    if (derniere && unites > 0 && $("#o_mfToutEnvoyer").is(":checked")) {
      derniere.troupes += unites;
      unites = 0;
    }
    this._mfResultats = resultats;
    this.afficherResultatsMultiFlood(resultats);
  }
  /**
   * Rend le tableau des résultats (un sous-tableau par cible).
   *
   * @private
   * @method afficherResultatsMultiFlood
   * @param {Array} resultats
   */
  afficherResultatsMultiFlood(resultats) {
    let html = "";
    resultats.forEach((r) => {
      html += `<table class="o_mfResultatCible o_maxWidth o_marginT15 centre" cellspacing="0">
                <thead>
                    <tr><th>${r.cible.pseudo} <span class="reduce">(${Utils.intToTime(r.cible.tempsParcours)})</span></th><th class="right">Troupes</th><th class="right">Mon Terrain</th><th class="right">Terrain de ${r.cible.pseudo}</th><th class="right">Prise</th></tr>
                </thead>
                <tbody>`;
      if (r.tropHaute)
        html += `<tr><td colspan="5" class="centre red"><em>Le terrain de la cible est trop haut</em></td></tr>`;
      else if (r.tropBasse)
        html += `<tr><td colspan="5" class="centre red"><em>Le terrain de la cible est trop bas</em></td></tr>`;
      else if (!r.attaques.length)
        html += `<tr><td colspan="5" class="centre"><em>Plus d'unités ou de créneaux d'attaque disponibles</em></td></tr>`;
      else {
        r.attaques.forEach((a, i) => {
          html += `<tr data-pseudo="${r.cible.pseudo}" data-i="${i}">
                    <td class="left">Attaque ${i + 1} <span class="reduce">(${a.pct}%)</span></td>
                    <td class="right">${numeral(a.troupes).format()}</td>
                    <td class="right">${numeral(a.tdcAttAvant).format()}</td>
                    <td class="right">${numeral(a.tdcCibleAvant).format()}</td>
                    <td class="right">${numeral(a.prise).format()}</td>
                </tr>`;
        });
        let totalPrise = r.attaques.reduce((s, a) => s + a.prise, 0);
        html += `<tr class="gras">
                    <td class="left">Résultat</td>
                    <td></td>
                    <td class="right">${numeral(r.tdcAttFin).format()}</td>
                    <td class="right">${numeral(r.tdcCibleFin).format()}</td>
                    <td class="right green">+${numeral(totalPrise).format()}</td>
                </tr>`;
      }
      html += `</tbody></table>`;
    });
    $("#o_mfResultats").html(html);
    this.afficherRecapMultiFlood(resultats);
    this.css(); // ré-applique couleur2 sur les nouvelles tables
  }
  /**
   * Récap global : attaques, troupes envoyées sur l'armée disponible, prise totale.
   *
   * @private
   * @method afficherRecapMultiFlood
   * @param {Array} resultats
   */
  afficherRecapMultiFlood(resultats) {
    let attaques = resultats.flatMap((r) => r.attaques),
      cibles = resultats.filter((r) => r.attaques.length).length,
      troupes = attaques.reduce((s, a) => s + a.troupes, 0),
      prise = attaques.reduce((s, a) => s + a.prise, 0);
    $("#o_mfLancer").prop("disabled", !attaques.length);
    if (!attaques.length) {
      let msg = "";
      if (this._mfDisponible == null) msg = "Chargement de votre armée…";
      else if (resultats.length && resultats.every((r) => r.tropHaute || r.tropBasse))
        msg = "Aucune attaque possible : toutes les cibles sont hors de portée.";
      else if (resultats.length && !this._mfDisponible)
        msg = "Aucune unité disponible (armée vide ou entièrement en réserve).";
      else if (resultats.length && !this._mfCreneaux()) msg = "Aucun créneau d'attaque libre.";
      $("#o_mfRecap").html(msg ? `<em>${msg}</em>` : "");
      return;
    }
    $("#o_mfRecap").html(
      `Ce flood demande <span class="gras">${attaques.length} attaque${attaques.length > 1 ? "s" : ""}</span> sur ${cibles} cible${cibles > 1 ? "s" : ""} et <span class="gras">${numeral(troupes).format()}</span> de vos ${numeral(this._mfDisponible).format()} unités disponibles pour <span class="gras green">+${numeral(prise).format()} cm²</span>.`,
    );
    $("#o_mfLancer")
      .off("click")
      .one("click", () => this._mfLancer());
  }
  /**
   * Lance la séquence multi-flood : pour chaque cible (dans l'ordre d'arrivée),
   * GET `ennemie.php?Attaquer=<id>` pour récupérer le token de sécurité, puis POST
   * chaque attaque séquentiellement avec 1s d'intervalle.
   * Implémentation parallèle à `Armee.envoyerFlood` parce que celui-ci finit par
   * `location.reload()` (incompatible multi-cible) et lit `pseudoCible` depuis le
   * DOM de `ennemie.php` (que nous n'avons pas dans la BoiteCombat).
   *
   * @private
   * @method _mfLancer
   */
  _mfLancer() {
    let aLancer = this._mfResultats
        .filter((r) => r.attaques.length)
        .map((r) => ({
          cible: r.cible,
          terrain: r.terrainCible,
          prises: r.attaques.map((a) => a.troupes),
          indices: r.attaques.map((a, i) => i),
        })),
      totalAttaques = aLancer.reduce((s, l) => s + l.prises.length, 0);
    if (!totalAttaques) return;
    if (
      !confirm(
        `Lancer ${totalAttaques} attaque(s) sur ${aLancer.length} cible(s) ? Cette action est irréversible.`,
      )
    )
      return this.afficherRecapMultiFlood(this._mfResultats);
    $("#o_mfLancer").prop("disabled", true).text("Lancement…");
    $("#o_mfToutEnvoyer, #o_mfForm input").prop("disabled", true);
    this._mfLancerCibleSuivante(aLancer, 0);
  }
  /**
   *
   */
  _mfLancerCibleSuivante(aLancer, idx) {
    if (idx >= aLancer.length) {
      $.toast({ ...TOAST_SUCCESS, text: "Multi-flood terminé." });
      return this._mfFinLancement();
    }
    let { cible, prises, indices } = aLancer[idx];
    $.get(`${location.origin}/ennemie.php?Attaquer=${cible.id}`)
      .then((html) => {
        let $page = Utils.parseHtml(html),
          tInput = $page.find("input#t").last();
        if (!tInput.length) {
          $.toast({
            ...TOAST_ERROR,
            text: `Token introuvable pour ${cible.pseudo}, séquence stoppée.`,
          });
          return this._mfFinLancement();
        }
        let securite = tInput.attr("name") + "=" + tInput.attr("value");
        // Répartition des unités sur les attaques de cette cible
        this._mfArmee.floods = prises.slice();
        this._mfArmee.repartirUniteFlood();
        this._mfEnvoyerAttaqueSuivante(cible, securite, indices, 0, () => {
          // Décompte local des unités envoyées (pour les cibles suivantes)
          this._mfArmee.repartition.forEach((rep) => {
            rep.forEach((n, j) => {
              this._mfArmee.unite[j] = Math.max(0, this._mfArmee.unite[j] - n);
            });
          });
          this._mfLancerCibleSuivante(aLancer, idx + 1);
        });
      })
      .fail(() => {
        $.toast({
          ...TOAST_ERROR,
          text: `Échec récupération page ennemie pour ${cible.pseudo}, séquence stoppée.`,
        });
        this._mfFinLancement();
      });
  }
  /**
   *
   */
  _mfEnvoyerAttaqueSuivante(cible, securite, indices, k, onComplete) {
    if (k >= indices.length) {
      onComplete();
      return;
    }
    let i = indices[k],
      donnees = this._mfBuildPayload(securite, this._mfArmee.repartition[k], cible.pseudo);
    $.post(`${location.origin}/ennemie.php?Attaquer=${cible.id}`, donnees, (data) => {
      let txt = Utils.parseHtml(data).find("center:last").text(),
        ok = txt.indexOf("Vos troupes sont en marche") !== -1;
      this._mfMarquerAttaque(cible.pseudo, i, ok);
      // capture pour le récapitulatif par cible et le compte des troupes
      // dehors (lieu toujours le terrain : le payload envoie lieu=1)
      if (ok) {
        let unite = {};
        this._mfArmee.repartition[k].forEach((nb, ind) => {
          if (nb) unite[NOM_UNITE[ind + 1]] = nb;
        });
        AttaqueLancee.enregistrer(cible.pseudo, "Terrain de chasse", unite, {
          html: data,
          terrain: this._mfTerrainCible(cible),
        });
      }
      setTimeout(
        () => this._mfEnvoyerAttaqueSuivante(cible, securite, indices, k + 1, onComplete),
        1000,
      );
    });
  }
  /**
   * Construit le payload `application/x-www-form-urlencoded` attendu par `ennemie.php`.
   * Le mapping unite11/12/13/14 ↔ index 12/13/11/6 du tableau `repartition` reproduit
   * exactement celui de `Armee.envoyerFlood:1010-1023` (ordre non-séquentiel hérité du
   * jeu, où Concierge d'élite/Tank d'élite/Tueuse[E] ont été ajoutés a posteriori).
   *
   * @private
   * @method _mfBuildPayload
   */
  _mfBuildPayload(securite, repartition, pseudoCible) {
    let donnees = {},
      [name, value] = securite.split("=");
    donnees[name] = value;
    donnees["ChoixArmee"] = "1";
    donnees["lieu"] = "1";
    donnees["pseudoCible"] = pseudoCible;
    donnees["unite1"] = repartition[0];
    donnees["unite2"] = repartition[1];
    donnees["unite3"] = repartition[2];
    donnees["unite4"] = repartition[3];
    donnees["unite5"] = repartition[4];
    donnees["unite6"] = repartition[5];
    donnees["unite7"] = repartition[7];
    donnees["unite8"] = repartition[8];
    donnees["unite9"] = repartition[9];
    donnees["unite10"] = repartition[10];
    donnees["unite11"] = repartition[12];
    donnees["unite12"] = repartition[13];
    donnees["unite13"] = repartition[11];
    donnees["unite14"] = repartition[6];
    return donnees;
  }
  /**
   *
   */
  _mfMarquerAttaque(pseudo, i, ok) {
    $(`.o_mfResultatCible tr[data-pseudo="${pseudo}"][data-i="${i}"]`)
      .removeClass("red green")
      .addClass(ok ? "green" : "red");
  }
  /**
   * Affiche une calculatrice pour calculer les temps de trajets, les horraires.
   *
   * @private
   * @method calculatrice
   */
  calculatrice() {
    let html = `<table id="o_calculatriceCombat" class="centre">
            <thead><tr><th id="o_placementJ" class="cursor" colspan="2">${IMG_FLECHE} Joueur 1 ${IMG_FLECHE}</th><th></th><th>Joueur(s)</th></tr></thead>
            <tr><td></td><td><input type="text" id="o_pseudoTemps" placeholder="Pseudo"/></td><td>→</td><td><input type="text" id="o_cibleJoueurTemps" placeholder="Pseudo1, Pseudo2..."/></td></tr>
            <tr><td>Vitesse d'attaque</td><td><input type="text" id="o_vaTemps" value="0" size="5"/></td><td></td><td></td></tr>
            <tr><td>Dernier mouvement</td><td><input id="o_dernierMvt" placeholder="JJ-MM-AAAA HH:mm"/></td><td></td><td><button id="o_calculerTemps">Calculer</button></td></tr>
            <tr><td>Délai capture (min)</td><td><input id="o_delaiCapture" value="1" size="5"/></td><td></td><td></td></tr>
            <tr class="reduce"><td colspan="4"><em>Le temps maximal d'un trajet est de <span id="o_indicationTemps">${this.calculerLimiteTemps(0)}</span>.</em></td></tr>
            </table>
            <hr class='o_calcSepar'/>
            <table id="o_estimateurVa" class="centre">
            <thead><tr><th colspan="4">Estimer la vitesse d'attaque (via 2 attaques consécutives)</th></tr></thead>
            <tr><td>Ennemi</td><td><input type="text" id="o_estVaEnnemi" placeholder="Pseudo"/></td><td></td><td></td></tr>
            <tr><td>1ère cible touchée</td><td><input type="text" id="o_estVaCible1" placeholder="Pseudo"/></td><td>à</td><td><input id="o_estVaHeure1" placeholder="JJ-MM-AAAA HH:mm"/></td></tr>
            <tr><td>2ème cible touchée</td><td><input type="text" id="o_estVaCible2" placeholder="Pseudo"/></td><td>à</td><td><input id="o_estVaHeure2" placeholder="JJ-MM-AAAA HH:mm"/></td></tr>
            <tr><td>Temps en loge (s)</td><td><input id="o_estVaLoge" value="0" size="5"/></td><td></td><td><button id="o_estVaEstimer">Estimer</button></td></tr>
            <tr id="o_estVaResultatRow" class="reduce" style="display:none;"><td colspan="4" class="centre"><span id="o_estVaResultatText"></span> <button id="o_estVaUtiliser" style="display:none;">Utiliser cette va</button></td></tr>
            </table>`;
    $("#o_tabsCombat4").append(html);
    return this.eventCalculatrice();
  }
  /**
   *
   */
  eventCalculatrice() {
    $("#o_placementJ").click(() => {
      // si les infos sont deja renseigné on vide
      if ($("#o_pseudoTemps").val() == monProfil.pseudo) {
        $("#o_pseudoTemps").val("");
        $("#o_vaTemps").spinner("value", 0);
        $("#o_indicationTemps").text(this.calculerLimiteTemps(0));
      } else {
        $("#o_pseudoTemps").val(monProfil.pseudo);
        $("#o_vaTemps").spinner("value", monProfil.niveauRecherche[6]);
        $("#o_indicationTemps").text(this.calculerLimiteTemps(monProfil.niveauRecherche[6]));
      }
    });
    $("#o_pseudoTemps").autocomplete({
      source: (request, response) => {
        Joueur.rechercher(request.term).then((data) => {
          response(Utils.extraitRecherche(data, true, false));
        });
      },
      position: { my: "left top-5", at: "left bottom" },
      minLength: 3,
    });
    $("#o_cibleJoueurTemps").autocomplete({
      source: (request, response) => {
        Alliance.rechercher(request.term.split(/,\s*/g).pop()).then((data) => {
          response(Utils.extraitRecherche(data, true, false));
        });
      },
      position: { my: "left top-6", at: "left bottom" },
      minLength: 2,
      focus: function () {
        return false;
      },
      select: function (event, ui) {
        let terms = this.value.split(/,\s*/g);
        terms.pop();
        terms.push(ui.item.value);
        terms.push("");
        this.value = terms.join(", ");
        return false;
      },
    });
    $("#o_dernierMvt").datetimepicker({
      ...DATEPICKER_OPTION,
      dateFormat: "dd-mm-yy",
      timeFormat: "HH:mm",
      timeText: "Horaire",
      hourText: "Heure",
      minuteText: "Minute",
    });
    $("#o_vaTemps").spinner({ min: 0, max: 50, numberFormat: "i" });
    $("#o_vaTemps").on("input spin", (e, ui) => {
      let nombre = ui ? ui.value : $(e.currentTarget).spinner("value");
      $("#o_indicationTemps").text(this.calculerLimiteTemps(nombre));
    });
    $("#o_delaiCapture").spinner({ min: 0, max: 60, numberFormat: "i" });
    $("#o_calculerTemps").click(() => {
      let ref = new Joueur({ pseudo: $("#o_pseudoTemps").val() });
      ref.niveauRecherche[6] = $("#o_vaTemps").val();
      // si pas de referentiel on ne peut rien calculer
      if (!ref.pseudo) {
        $.toast({
          ...TOAST_ERROR,
          text: "Le joueur 1 n'est pas renseigné.",
        });
        return false;
      }
      // preparation des joueurs
      let joueurs = new Array();
      for (let i = 0, tmp = $("#o_cibleJoueurTemps").val().split(", "); i < tmp.length; i++)
        if (tmp[i]) joueurs.push(new Joueur({ pseudo: tmp[i] }));

      if (!joueurs.length) {
        $.toast({
          ...TOAST_ERROR,
          text: "Vous n'avez pas renseigné de joueur pour lancer le calcul.",
        });
      } else {
        if (!$("#o_infosTemps").length) this.afficherTemps();
        let delaiMin = parseInt($("#o_delaiCapture").val(), 10);
        if (isNaN(delaiMin) || delaiMin < 0) delaiMin = 1;
        this.calculerTemps(ref, joueurs, $("#o_dernierMvt").val(), delaiMin * 60);
      }
      return false;
    });
    // Estimateur de vitesse d'attaque
    for (let id of ["#o_estVaEnnemi", "#o_estVaCible1", "#o_estVaCible2"]) {
      $(id).autocomplete({
        source: (request, response) => {
          Joueur.rechercher(request.term).then((data) => {
            response(Utils.extraitRecherche(data, true, false));
          });
        },
        position: { my: "left top-5", at: "left bottom" },
        minLength: 3,
      });
    }
    for (let id of ["#o_estVaHeure1", "#o_estVaHeure2"]) {
      $(id).datetimepicker({
        ...DATEPICKER_OPTION,
        dateFormat: "dd-mm-yy",
        timeFormat: "HH:mm",
        timeText: "Horaire",
        hourText: "Heure",
        minuteText: "Minute",
      });
    }
    $("#o_estVaLoge").spinner({ min: 0, max: 600, numberFormat: "i" });
    $("#o_estVaEstimer").click(() => {
      let pseudoEnn = $("#o_estVaEnnemi").val();
      let pseudoC1 = $("#o_estVaCible1").val();
      let pseudoC2 = $("#o_estVaCible2").val();
      let t1 = $("#o_estVaHeure1").val();
      let t2 = $("#o_estVaHeure2").val();
      let tempsLoge = parseInt($("#o_estVaLoge").val(), 10);
      if (isNaN(tempsLoge) || tempsLoge < 0) tempsLoge = 0;
      if (!pseudoEnn || !pseudoC1 || !pseudoC2 || !t1 || !t2) {
        $.toast({
          ...TOAST_ERROR,
          text: "Pseudo de l'ennemi, des 2 cibles et leurs heures de touche sont requis.",
        });
        return false;
      }
      this.estimerVitesseAttaque(pseudoEnn, pseudoC1, pseudoC2, t1, t2, tempsLoge);
      return false;
    });
    $("#o_estVaUtiliser").click(() => {
      let va = $("#o_estVaUtiliser").data("va");
      let ennemi = $("#o_estVaUtiliser").data("ennemi");
      if (va === undefined) return false;
      $("#o_vaTemps").spinner("value", va);
      $("#o_indicationTemps").text(this.calculerLimiteTemps(va));
      if (ennemi && !$("#o_pseudoTemps").val()) $("#o_pseudoTemps").val(ennemi);
      return false;
    });
    return this;
  }
  /**
   *
   */
  calculerLimiteTemps(va) {
    return Utils.intToTime(Math.pow(0.9, va) * 637200);
  }
  /**
   * Estime la vitesse d'attaque d'un joueur via 2 attaques successives.
   * Hypothèse : entre l'arrivée sur cible 1 et l'arrivée sur cible 2, le joueur fait
   * le retour cible1→loge puis loge→cible2, soit T2−T1 = t(va,d1) + tempsLoge + t(va,d2).
   */
  estimerVitesseAttaque(pseudoEnn, pseudoC1, pseudoC2, t1, t2, tempsLoge) {
    let ennemi = new Joueur({ pseudo: pseudoEnn });
    let c1 = new Joueur({ pseudo: pseudoC1 });
    let c2 = new Joueur({ pseudo: pseudoC2 });
    Promise.all([ennemi.getProfil(), c1.getProfil(), c2.getProfil()]).then((values) => {
      ennemi.chargerProfil(values[0]);
      c1.chargerProfil(values[1]);
      c2.chargerProfil(values[2]);
      let dt =
        moment(t2, "DD-MM-YYYY HH:mm").diff(moment(t1, "DD-MM-YYYY HH:mm"), "seconds") - tempsLoge;
      if (dt <= 0) {
        this._afficherResultatVa(null, null, "L'écart entre les 2 attaques doit être positif.");
        return;
      }
      let d1 = Math.sqrt(Math.pow(ennemi.x - c1.x, 2) + Math.pow(ennemi.y - c1.y, 2));
      let d2 = Math.sqrt(Math.pow(ennemi.x - c2.x, 2) + Math.pow(ennemi.y - c2.y, 2));
      let facteur = 1 - Math.exp(-d1 / 350) + (1 - Math.exp(-d2 / 350));
      let k = dt / (637200 * facteur);
      if (k <= 0 || k > 1) {
        this._afficherResultatVa(
          null,
          null,
          "Estimation impossible : données incohérentes (vérifiez les coordonnées et les heures).",
        );
        return;
      }
      let va = Math.log(k) / Math.log(0.9);
      let arrondi = Math.round(va);
      let hors = va < 0 || va > 50;
      this._afficherResultatVa(
        va,
        hors ? null : arrondi,
        hors ? `VA estimée hors plage [0..50] : ${va.toFixed(2)}` : null,
        ennemi.pseudo,
      );
    });
    return this;
  }
  /**
   *
   */
  _afficherResultatVa(va, arrondi, erreur, pseudoEnn) {
    let row = $("#o_estVaResultatRow");
    let text = $("#o_estVaResultatText");
    let btn = $("#o_estVaUtiliser");
    if (erreur) {
      text.html(`<span class="red">${erreur}</span>`);
      btn.hide();
    } else {
      text.html(
        `Vitesse d'attaque estimée : <strong>${va.toFixed(2)}</strong> (arrondi : <strong>${arrondi}</strong>) `,
      );
      btn
        .data("va", arrondi)
        .data("ennemi", pseudoEnn || "")
        .show();
    }
    row.show();
  }
  /**
   *
   */
  calculerTemps(ref, joueurs, dernierMvt = "", delaiCaptureSec = 60) {
    let promise = new Array();
    // promise qui recup le profil du ref
    if (!ref.estJoueurCourant()) promise.push(ref.getProfil());
    // promise pour recup les joueurs
    for (let joueur of joueurs) promise.push(joueur.getProfil());
    // Execution des requetes
    Promise.all(promise).then((values) => {
      let rows = new Array(),
        ind = 0;
      // charge les donnes du ref
      if (!ref.estJoueurCourant()) {
        ref.chargerProfil(values[ind]);
        ind++;
      }
      // si on peut calculer une heure de lancement (ref = ennemi à chopper, pas moi)
      const capturePossible = dernierMvt && !ref.estJoueurCourant();
      const tempsMoiVersRef = capturePossible ? monProfil.getTempsParcours2(ref) : 0;
      const maintenant = moment();
      // on calcule les temps de trajet vers les joueurs
      for (let i = 0; i < joueurs.length; i++) {
        joueurs[i].chargerProfil(values[i + ind]);
        let tempsP = ref.getTempsParcours2(joueurs[i]);
        let retour = dernierMvt ? moment(dernierMvt, "DD-MM-YYYY HH:mm").add(tempsP, "s") : null;
        let cellRetour = retour ? retour.format("D MMM à HH[h]mm[m]ss[s]") : "";
        let cellLancer = "";
        let rowClass = "";
        if (capturePossible && retour) {
          let lancerLe = retour.clone().add(delaiCaptureSec, "s").subtract(tempsMoiVersRef, "s");
          let faisable = lancerLe.isAfter(maintenant);
          cellLancer = lancerLe.format("D MMM à HH[h]mm[m]ss[s]");
          rowClass = faisable ? "o_capFaisable" : "o_capTropTard";
        }
        rows.push(
          $(
            `<tr${rowClass ? ` class="${rowClass}"` : ""}><td>${joueurs[i].pseudo}</td><td>${numeral(joueurs[i].terrain).format()}</td><td>${Utils.intToTime(tempsP)}</td><td>${cellRetour}</td><td>${cellLancer}</td></tr>`,
          )[0],
        );
      }
      // affichage du tableau des distances
      $("#o_infosTemps").DataTable().clear().rows.add(rows).draw();
    });
    return this;
  }
  /**
   *
   */
  afficherTemps() {
    $("#o_calculatriceCombat").after(
      `<br/><table id='o_infosTemps'><thead style="background-color:${monProfil.parametre["couleur2"].valeur}"><tr><th>Pseudo</th><th>Terrain</th><th>Temps de trajet</th><th>Retour le</th><th>Lancer à</th></tr></thead></table>`,
    );
    $("#o_infosTemps").DataTable({
      bInfo: false,
      bAutoWidth: false,
      dom: "Bfrtip",
      buttons: ["copyHtml5", "csvHtml5", "excelHtml5"],
      pageLength: 15,
      responsive: true,
      order: [[1, "desc"]],
      language: {
        zeroRecords: "Aucune information trouvée",
        infoEmpty: "Aucun enregistrement",
        infoFiltered: "(Filtré par _MAX_ enregistrements)",
        search: "Rechercher : ",
        paginate: {
          previous: "Préc.",
          next: "Suiv.",
        },
      },
      columnDefs: [
        { type: "quantite-grade", targets: 1, visible: false },
        { type: "moment-D MMM YYYY", targets: 3 },
        { type: "moment-D MMM YYYY", targets: 4 },
        { type: "time-unformat", targets: 2 },
      ],
      rowCallback: (row, data, index) => {
        let bg = index % 2 == 0 ? "inherit" : monProfil.parametre["couleur2"].valeur;
        if ($(row).hasClass("o_capFaisable")) bg = "#d6f5d6";
        else if ($(row).hasClass("o_capTropTard")) bg = "#f5d6d6";
        $(row).css("background-color", bg);
      },
      drawCallback: (settings) => {
        $(".o_content a, .o_content table, .o_content label").css(
          "color",
          monProfil.parametre["couleurTexte"].valeur,
        );
      },
    });
    return this;
  }
}
