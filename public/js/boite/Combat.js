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
      "#o_resultatCombat tr:even, .o_tabs .ui-widget-header .ui-tabs-anchor, #o_calculatriceCombat tr:even, .o_mfResultatCible tr:even",
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
    $("#o_tabsCombat1").append(
      "<textarea id='o_rcCombat' class='o_maxWidth' placeholder='Rapport de combat...'></textarea><div class='o_marginT15' style='max-height:200px;overflow:auto'><table id='o_resultatCombat' class='o_maxWidth'></table></div>",
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
    if ($("#o_divccarmee").length) {
      $("#o_divccarmee").show();
      $("#o_camp").val(position);
    } else {
      $("body").append(`<div class="voile" id="o_divccarmee">
                <div class="message_voile">
                    <input type="hidden" id="o_camp" value="${position}"/>Importer une Armée
                    <textarea id="o_textAreaArmee" name="textAreaArmee" rows="9" cols="50" style="width:100%;"></textarea>
                    <p>
                        <input id="o_annulerCopie" type="button" value="Annuler"/>
                        <input id="o_afficherAide" type="button" value="Aide"/>
                        <input id="o_importerArmee" type="button" value="Valider" />
                    </p>
                    <p id="o_aideCopierArmee" style="text-align:left; font-size: 0.8em;display:none">
                        Vous pouvez importer une armée de plusieurs façons :
                        <br/>- Ecrire directement une phrase : je veux 30 jsn et 27 artilleuses et encore 50 jeunes soldates naines.
                        <br/>- Copiez une armée de Fourmizzz (Rapport de combat, Page Armée, Armée en attaque...).
                        <br/>- Copiez un fichier Excel.
                        <br/><br/>Vous pouvez utiliser certaines abréviations :
                        <br/>- Pour les armées : jsn, sn, ne, js, s, c, ce, a, ae, se, ta ou tk, tae ou tke, tu, tue.
                        <br/>- Pour les nombres : k ou kilo, M ou mega, G ou giga, T ou tera.
                    </p>
                </div>
            </div>`);
      // event
      $("#o_annulerCopie").click((e) => {
        $("#o_divccarmee").hide();
        $("#o_textAreaArmee").val("");
        return false;
      });
      $("#o_afficherAide").click((e) => {
        $("#o_aideCopierArmee").is(":visible")
          ? $("#o_aideCopierArmee").hide()
          : $("#o_aideCopierArmee").show();
        return false;
      });
      $("#o_importerArmee").click((e) => {
        let armee = new Armee(),
          camp = $("#o_camp").val() == "ATT" ? 1 : 2;
        armee.parseArmee($("#o_textAreaArmee").val());
        for (let i = 0; i < armee.unite.length; i++)
          $("input[name='o_unite" + camp + "_" + (i + 1) + "']").spinner("value", armee.unite[i]);
        $("#o_divccarmee").hide();
        $("#o_textAreaArmee").val("");
        this.actualiserStatistique();
        return false;
      });
    }
  }
  /**
   * Affiche le simulateur multi-flood (onglet 3).
   *
   * @private
   * @method multiFlood
   */
  multiFlood() {
    let unitOptions = NOM_UNITE.slice(1)
      .map((nom, i) => `<option value="${i + 1}">${nom}</option>`)
      .join("");
    $("#o_tabsCombat3").append(`<div id="o_multiFlood" class="centre">
            <div id="o_mfFormWrap"></div>
            <div id="o_mfResultats" class="o_marginT15"></div>
            <p id="o_mfRecap" class="o_marginT15"></p>
            <fieldset id="o_mfRedeployFs" class="o_marginT15"><legend><label><input type="checkbox" id="o_mfRedeployEnable"/> Redéployer après flood</label></legend>
                <table class="o_maxWidth centre" cellspacing="0">
                    <tbody>
                        <tr>
                            <td class="right reduce">Vers Terrain de chasse :</td>
                            <td><input type="text" id="o_mfRedeployTdcNb" value="0"/></td>
                            <td><select id="o_mfRedeployTdcUnit">${unitOptions}</select></td>
                        </tr>
                        <tr>
                            <td class="right reduce">Vers Dôme / Fourmilière :</td>
                            <td><input type="text" id="o_mfRedeployDomeNb" value="0"/></td>
                            <td><select id="o_mfRedeployDomeUnit">${unitOptions}</select></td>
                        </tr>
                    </tbody>
                </table>
                <p class="reduce"><em>Une fois le dernier flood lancé, les troupes restées en Loge Impériale sont redéployées automatiquement.</em></p>
            </fieldset>
            <button id="o_mfLancer" class="o_button f_success o_marginT15" type="button" disabled>Lancer ces attaques</button>
        </div>`);
    /**
     * Cibles sélectionnées par l'utilisateur. Chaque entrée :
     * { pseudo, id, terrain, type, x, y, tempsParcours }
     */
    this._mfCibles = [];
    this._mfAttaquantOpts = { terrainFinal: null, priseMax: null };
    this._mfTotalUnites = null; // chargé lazy via Armee.getArmee()
    this._mfChargerRedeployement();
    this._mfBindRedeployement();
    this._mfRenderForm();
    // Pré-charge l'armée pour le check garnison ; ne bloque pas l'UI
    if (!this._mfArmee) this._mfArmee = new Armee();
    this._mfArmee.getArmee().then((data) => {
      this._mfArmee.chargeData(data);
      this._mfTotalUnites = (this._mfArmee.unite || []).reduce((s, n) => s + (n || 0), 0);
      this.simulerMultiFlood();
    });
    return this;
  }
  /**
   * Rend le tableau-formulaire au look natif :
   * Attaquant | label | cible1 | cible2 | … | "+" (slot d'ajout).
   * Re-rend complètement à chaque add/remove → re-bind autocomplete derrière.
   *
   * @private
   * @method _mfRenderForm
   */
  _mfRenderForm() {
    let cibles = [...this._mfCibles].sort((a, b) => a.tempsParcours - b.tempsParcours),
      arrondirOptions = [0, 5, 10, 100, 1000],
      // Pour chaque cible : 5 cellules (une par ligne du form)
      pseudoRow = cibles
        .map(
          (c) =>
            `<td><input type="text" class="o_mfPseudoCell cursor" data-pseudo="${c.pseudo}" value="${c.pseudo}" readonly title="Cliquer pour retirer"/></td>`,
        )
        .join(""),
      terrainRow = cibles
        .map(
          (c) =>
            `<td><input type="text" value="${numeral(c.terrain).format()} cm²" disabled/></td>`,
        )
        .join(""),
      terrainFinalRow = cibles
        .map(
          (c) =>
            `<td><input type="text" class="o_mfOpt" data-pseudo="${c.pseudo}" data-opt="terrainFinal" value="${c.terrainFinal ?? ""}" placeholder="—"/></td>`,
        )
        .join(""),
      priseMaxRow = cibles
        .map(
          (c) =>
            `<td><input type="text" class="o_mfOpt" data-pseudo="${c.pseudo}" data-opt="priseMax" value="${c.priseMax ?? ""}" placeholder="—"/></td>`,
        )
        .join(""),
      arrondirRow = cibles
        .map((c) => {
          let opts = arrondirOptions
            .map(
              (v) =>
                `<option value="${v}"${(c.arrondir ?? 0) == v ? " selected" : ""}>${v === 0 ? "Aucun" : v}</option>`,
            )
            .join("");
          return `<td><select class="o_mfOpt" data-pseudo="${c.pseudo}" data-opt="arrondir">${opts}</select></td>`;
        })
        .join(""),
      // Cellule "vide" si aucune cible — pour que le tableau ait quand même la bonne forme
      empty = cibles.length ? "" : `<td></td>`;
    $("#o_mfFormWrap").html(`
        <table id="o_mfForm" class="o_maxWidth centre" cellspacing="0">
          <thead>
            <tr>
              <th>Attaquant</th>
              <th></th>
              <th colspan="${cibles.length || 1}">Cibles</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><input type="text" value="${monProfil.pseudo}" disabled/></td>
              <td class="right">Pseudo</td>
              ${pseudoRow}${empty}
              <td><input type="text" id="o_mfPseudoCible" placeholder="Pseudo…"/></td>
            </tr>
            <tr>
              <td><input type="text" value="${numeral(Utils.terrain).format()}" disabled/></td>
              <td class="right">Terrain</td>
              ${terrainRow}${empty}
              <td><input type="text" disabled placeholder="—"/></td>
            </tr>
            <tr>
              <td><input type="text" class="o_mfAttOpt" data-opt="terrainFinal" value="${this._mfAttaquantOpts?.terrainFinal ?? ""}" placeholder="—"/></td>
              <td class="right reduce">Terrain Final</td>
              ${terrainFinalRow}${empty}
              <td><input type="text" disabled placeholder="—"/></td>
            </tr>
            <tr>
              <td><input type="text" class="o_mfAttOpt" data-opt="priseMax" value="${this._mfAttaquantOpts?.priseMax ?? ""}" placeholder="—"/></td>
              <td class="right reduce">Prise Max</td>
              ${priseMaxRow}${empty}
              <td><input type="text" disabled placeholder="—"/></td>
            </tr>
            <tr>
              <td></td>
              <td class="right reduce">Arrondir</td>
              ${arrondirRow}${empty}
              <td><select disabled><option>Aucun</option></select></td>
            </tr>
          </tbody>
        </table>`);
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
    // Spinner sur tous les inputs numériques (Terrain Final / Prise Max par cible et attaquant) — convention Toolzzz
    $("#o_mfForm input.o_mfOpt, #o_mfForm input.o_mfAttOpt").spinner({ min: 0, numberFormat: "i" });
    // Options par cible (Terrain Final / Prise Max / Arrondir) — re-simu sur change
    $("#o_mfForm .o_mfOpt").on("change", (e) => {
      let $el = $(e.currentTarget),
        pseudo = $el.data("pseudo"),
        opt = $el.data("opt"),
        cible = this._mfCibles.find((c) => c.pseudo === pseudo);
      if (!cible) return;
      let raw = $el.val();
      cible[opt] = raw === "" || raw === "0" ? null : parseInt(raw);
      this.simulerMultiFlood();
    });
    // Options globales attaquant (Terrain Final / Prise Max) — re-simu sur change
    $("#o_mfForm .o_mfAttOpt").on("change", (e) => {
      let $el = $(e.currentTarget),
        opt = $el.data("opt"),
        raw = $el.val();
      this._mfAttaquantOpts[opt] = raw === "" || raw === "0" ? null : parseInt(raw);
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
    let url = `http://${Utils.serveur}.fourmizzz.fr/Membre.php?Pseudo=${encodeURIComponent(pseudo)}`;
    return $.get(url).then((html) => {
      let $page = Utils.parseHtml(html),
        coords = $page.find(".boite_membre a[href^='carte2.php?']").text(),
        m = coords.match(/x=(\d+) et y=(\d+)/),
        idLink = $page.find("a[href^='commerce.php?ID=']").attr("href") || "",
        idMatch = idLink.match(/\d+/);
      return {
        pseudo,
        id: idMatch ? parseInt(idMatch[0]) : 0,
        terrain: numeral($page.find(".tableau_score tr:eq(1) td:eq(1)").text()).value() || 0,
        type: "profil",
        x: m ? parseInt(m[1]) : 0,
        y: m ? parseInt(m[2]) : 0,
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
  }
  /**
   * Orchestre la simulation multi-cibles : chaîne `Armee.optimiserFlood`
   * sur chaque cible (triée par distance) en propageant `tdcAtt`.
   * Détecte les cibles "trop hautes" (terrain > mon terrain × SEUIL_TROP_HAUT).
   *
   * @private
   * @method simulerMultiFlood
   */
  simulerMultiFlood() {
    if (!this._mfArmee) this._mfArmee = new Armee();
    // Seuils alignés sur le natif (Attaquer.js:231 → tdcCible ∈ [tdcAtt × 0.5, tdcAtt × 3])
    const SEUIL_TROP_HAUT = 3;
    const SEUIL_TROP_BAS = 2;
    const MAX_ATTAQUES_PAR_CIBLE = 10;
    const UNITE_INFINIE = 1e9; // simu purement terrain — la contrainte d'armée est appliquée globalement (recap) pas par cible
    let cibles = [...this._mfCibles].sort((a, b) => a.tempsParcours - b.tempsParcours),
      mfTerrain = Utils.terrain,
      // map des états cochés précédents (par pseudo+i) pour préserver les choix utilisateur
      previous = {};
    (this._mfResultats || []).forEach((r) => {
      r.attaques?.forEach((a, i) => {
        previous[r.cible.pseudo + ":" + i] = a.checked !== false;
      });
    });
    let resultats = [];
    cibles.forEach((cible) => {
      if (cible.terrain > mfTerrain * SEUIL_TROP_HAUT) {
        resultats.push({
          cible,
          tropHaute: true,
          tdcAttDebut: mfTerrain,
          tdcAttFin: mfTerrain,
        });
        return;
      }
      if (mfTerrain > cible.terrain * SEUIL_TROP_BAS) {
        resultats.push({
          cible,
          tropBasse: true,
          tdcAttDebut: mfTerrain,
          tdcAttFin: mfTerrain,
        });
        return;
      }
      this._mfArmee.floods = [];
      let donneesFlood = {
        tdcAtt: mfTerrain,
        tdcCible: cible.terrain,
        unite: UNITE_INFINIE,
        reste: MAX_ATTAQUES_PAR_CIBLE,
        attaques: [],
      };
      this._mfArmee.optimiserFlood(donneesFlood);
      let prises = this._mfArmee.floods.slice();
      // Post-traitement avec les options (par cible + globales attaquant)
      // Prise Max : cap par attaque (cible OU attaquant, le plus restrictif)
      let priseMax = Math.min(
        cible.priseMax ?? Infinity,
        this._mfAttaquantOpts.priseMax ?? Infinity,
      );
      if (priseMax !== Infinity) prises = prises.map((p) => Math.min(p, priseMax));
      // Arrondir : sur la valeur (par cible)
      if (cible.arrondir)
        prises = prises.map((p) => Math.round(p / cible.arrondir) * cible.arrondir);
      // Terrain Final cible : faire tomber le terrain de la cible JUSQU'À cette valeur
      if (cible.terrainFinal != null) {
        let cumulCible = cible.terrain,
          tronquees = [];
        for (let p of prises) {
          if (cumulCible <= cible.terrainFinal) break;
          let allowed = cumulCible - cible.terrainFinal;
          let truncated = Math.min(p, allowed);
          tronquees.push(truncated);
          cumulCible -= truncated;
        }
        prises = tronquees.filter((p) => p > 0);
      }
      // Terrain Final attaquant : stoppe quand mon terrain a atteint le plafond
      if (this._mfAttaquantOpts.terrainFinal != null) {
        let cumulAtt = mfTerrain,
          plafond = this._mfAttaquantOpts.terrainFinal,
          tronquees = [];
        for (let p of prises) {
          if (cumulAtt >= plafond) break;
          let truncated = Math.min(p, plafond - cumulAtt);
          tronquees.push(truncated);
          cumulAtt += truncated;
        }
        prises = tronquees.filter((p) => p > 0);
      }
      let attaques = [],
        tdcAttC = mfTerrain,
        tdcCibleC = cible.terrain;
      prises.forEach((p, i) => {
        attaques.push({
          prise: p,
          tdcAttAvant: tdcAttC,
          tdcCibleAvant: tdcCibleC,
          pct: tdcCibleC > 0 ? Math.round((p / tdcCibleC) * 100) : 0,
          checked: previous[cible.pseudo + ":" + i] !== false,
        });
        tdcAttC += p;
        tdcCibleC -= p;
      });
      resultats.push({
        cible,
        attaques,
        tdcAttDebut: mfTerrain,
        tdcAttFin: tdcAttC,
        tdcCibleFin: tdcCibleC,
      });
      mfTerrain = tdcAttC;
    });
    this._mfResultats = resultats;
    this.afficherResultatsMultiFlood(resultats);
  }
  /**
   * Rend le tableau dynamique des résultats (un sous-tableau par cible).
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
                    <tr><th>${r.cible.pseudo} <span class="reduce">(${Utils.intToTime(r.cible.tempsParcours)})</span></th><th class="right">Mon Terrain</th><th class="right">Terrain de ${r.cible.pseudo}</th><th class="right">Prise</th></tr>
                </thead>
                <tbody>`;
      if (r.tropHaute) {
        html += `<tr><td colspan="4" class="centre red"><em>Le terrain de la cible est trop haut</em></td></tr>`;
      } else if (r.tropBasse) {
        html += `<tr><td colspan="4" class="centre red"><em>Le terrain de la cible est trop bas</em></td></tr>`;
      } else {
        r.attaques.forEach((a, i) => {
          html += `<tr>
                    <td class="left"><label><input type="checkbox" class="o_mfAttaqueCheck" data-pseudo="${r.cible.pseudo}" data-i="${i}"${a.checked ? " checked" : ""}/> Attaque ${i + 1} <span class="reduce">(${a.pct}%)</span></label></td>
                    <td class="right">${numeral(a.tdcAttAvant).format()}</td>
                    <td class="right">${numeral(a.tdcCibleAvant).format()}</td>
                    <td class="right">${numeral(a.prise).format()}</td>
                </tr>`;
        });
        let totalPrise = r.attaques.reduce((s, a) => s + a.prise, 0);
        html += `<tr class="gras">
                    <td class="left">Résultat</td>
                    <td class="right">${numeral(r.tdcAttFin).format()}</td>
                    <td class="right">${numeral(r.tdcCibleFin).format()}</td>
                    <td class="right green">+${numeral(totalPrise).format()}</td>
                </tr>`;
      }
      html += `</tbody></table>`;
    });
    $("#o_mfResultats").html(html);
    // Toggle checkbox → màj instantanée du récap (ne re-simule pas, garde l'état utilisateur)
    $("#o_mfResultats .o_mfAttaqueCheck").on("change", (e) => {
      let $el = $(e.currentTarget),
        pseudo = $el.data("pseudo"),
        i = parseInt($el.data("i")),
        r = this._mfResultats.find((x) => x.cible.pseudo === pseudo);
      if (r && r.attaques[i]) {
        r.attaques[i].checked = $el.is(":checked");
        this.afficherRecapMultiFlood(this._mfResultats);
      }
    });
    this.afficherRecapMultiFlood(resultats);
    this.css(); // ré-applique couleur2 sur les nouvelles tables
  }
  /**
   * Récap global : nombre d'attaques, total fourmis, prise totale.
   * Pas de % de capacité (vitesse d'attaque, garnison) tant qu'on n'a pas
   * de source fiable pour ces valeurs — à ajouter en v2.
   *
   * @private
   * @method afficherRecapMultiFlood
   * @param {Array} resultats
   */
  afficherRecapMultiFlood(resultats) {
    let totalAttaques = 0,
      totalFourmis = 0,
      totalPrise = 0,
      cibles = new Set();
    resultats.forEach((r) => {
      if (r.tropHaute || r.tropBasse) return;
      r.attaques.forEach((a) => {
        if (a.checked === false) return; // attaques décochées exclues
        cibles.add(r.cible.pseudo);
        totalAttaques++;
        totalFourmis += a.prise; // approximation 1cm² ≈ 1 unité (cohérent avec le natif sur JSN)
        totalPrise += a.prise;
      });
    });
    cibles = cibles.size;
    if (!totalAttaques) {
      let msg = "";
      if (resultats.length) {
        let allHaut = resultats.every((r) => r.tropHaute),
          allBas = resultats.every((r) => r.tropBasse),
          allOob = resultats.every((r) => r.tropHaute || r.tropBasse);
        if (allHaut) msg = "Aucune attaque possible — toutes les cibles sont trop hautes.";
        else if (allBas) msg = "Aucune attaque possible — toutes les cibles sont trop basses.";
        else if (allOob)
          msg =
            "Aucune attaque possible — toutes les cibles sont hors-portée (trop hautes ou trop basses).";
        else msg = "Aucune attaque planifiée (cibles bornées par les options ou décochées).";
      }
      $("#o_mfRecap").html(msg ? `<em>${msg}</em>` : "");
      $("#o_mfLancer").prop("disabled", true);
      return;
    }
    // Check capacité armée (garnison). 3 états :
    //   null  → armée pas encore chargée (Armee.getArmee en cours)
    //   0     → armée vide → flood impossible
    //   > 0   → calcul du % (peut largement dépasser 100% — le natif affiche 6595%, etc.)
    let pctGarnisonHtml = "",
      armeeOk = true;
    if (this._mfTotalUnites === 0) {
      pctGarnisonHtml = `, soit <span class="gras red">∞%</span> de votre armée (garnison vide)`;
      armeeOk = false;
    } else if (this._mfTotalUnites > 0) {
      let pct = Math.round((totalFourmis / this._mfTotalUnites) * 100);
      armeeOk = totalFourmis <= this._mfTotalUnites;
      pctGarnisonHtml = `, soit <span class="gras${armeeOk ? "" : " red"}">${pct}%</span> de votre armée en garnison`;
    }
    let fourmisCls = armeeOk ? "" : " red",
      recap = `Ce flood demande <span class="gras">${totalAttaques} attaque${totalAttaques > 1 ? "s" : ""}</span> sur ${cibles} cible${cibles > 1 ? "s" : ""} et <span class="gras${fourmisCls}">${numeral(totalFourmis).format()} fourmis</span>${pctGarnisonHtml} pour <span class="gras green">+${numeral(totalPrise).format()} cm²</span>.`;
    $("#o_mfRecap").html(recap);
    $("#o_mfLancer").prop("disabled", !armeeOk);
    $("#o_mfLancer")
      .off("click")
      .one("click", () => this._mfLancer());
  }
  /**
   * Lance la séquence multi-flood : pour chaque cible (dans l'ordre de distance),
   * GET `ennemie.php?Attaquer=<id>` pour récupérer le token de sécurité, puis POST
   * chaque attaque cochée séquentiellement avec 1s d'intervalle.
   * Implémentation parallèle à `Armee.envoyerFlood` parce que celui-ci finit par
   * `location.reload()` (incompatible multi-cible) et lit `pseudoCible` depuis le
   * DOM de `ennemie.php` (que nous n'avons pas dans la BoiteCombat).
   *
   * @private
   * @method _mfLancer
   */
  _mfLancer() {
    let totalAttaques = 0,
      aLancer = [];
    this._mfResultats.forEach((r) => {
      if (r.tropHaute || r.tropBasse) return;
      let prises = [],
        indices = [];
      r.attaques.forEach((a, i) => {
        if (a.checked !== false && a.prise > 0) {
          prises.push(a.prise);
          indices.push(i);
          totalAttaques++;
        }
      });
      if (prises.length) aLancer.push({ cible: r.cible, prises, indices });
    });
    if (!totalAttaques) return;
    if (
      !confirm(
        `Lancer ${totalAttaques} attaque(s) sur ${aLancer.length} cible(s) ? Cette action est irréversible.`,
      )
    )
      return;
    $("#o_mfLancer").prop("disabled", true).text("Lancement…");
    // S'assurer que l'armée est chargée (sinon `repartirUniteFlood` n'aura rien à distribuer)
    let prep =
      this._mfArmee && this._mfArmee.unite.some((u) => u > 0)
        ? Promise.resolve()
        : this._mfArmee.getArmee().then((d) => this._mfArmee.chargeData(d));
    prep.then(() => this._mfLancerCibleSuivante(aLancer, 0));
  }
  /**
   *
   */
  _mfLancerCibleSuivante(aLancer, idx) {
    if (idx >= aLancer.length) {
      let cfg = this._mfGetRedeployConfig();
      if (cfg) {
        $("#o_mfLancer").text("Redéploiement…");
        Armee.deplacerApresFlood(cfg).then(
          () => {
            $.toast({ ...TOAST_SUCCESS, text: "Multi-flood terminé. Troupes redéployées." });
            $("#o_mfLancer").text("Lancer ces attaques");
          },
          (err) => {
            console.error("[multiFlood] redéploiement échoué", err);
            $.toast({
              ...TOAST_WARNING,
              text: "Multi-flood terminé, mais le redéploiement a échoué (voir console).",
            });
            $("#o_mfLancer").text("Lancer ces attaques");
          },
        );
      } else {
        $.toast({ ...TOAST_SUCCESS, text: "Multi-flood terminé." });
        $("#o_mfLancer").text("Lancer ces attaques");
      }
      return;
    }
    let { cible, prises, indices } = aLancer[idx];
    $.get(`http://${Utils.serveur}.fourmizzz.fr/ennemie.php?Attaquer=${cible.id}`)
      .then((html) => {
        let $page = Utils.parseHtml(html),
          tInput = $page.find("input#t").last();
        if (!tInput.length) {
          $.toast({
            ...TOAST_ERROR,
            text: `Token introuvable pour ${cible.pseudo}, séquence stoppée.`,
          });
          $("#o_mfLancer").text("Lancer ces attaques");
          return;
        }
        let securite = tInput.attr("name") + "=" + tInput.attr("value");
        // Construit la répartition pour les SEULES attaques cochées de cette cible
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
        $("#o_mfLancer").text("Lancer ces attaques");
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
    $.post(
      `http://${Utils.serveur}.fourmizzz.fr/ennemie.php?Attaquer=${cible.id}`,
      donnees,
      (data) => {
        let txt = Utils.parseHtml(data).find("center:last").text(),
          ok = txt.indexOf("Vos troupes sont en marche") !== -1;
        this._mfMarquerAttaque(cible.pseudo, i, ok);
        setTimeout(
          () => this._mfEnvoyerAttaqueSuivante(cible, securite, indices, k + 1, onComplete),
          2000,
        );
      },
    );
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
    $(`.o_mfResultatCible .o_mfAttaqueCheck[data-pseudo="${pseudo}"][data-i="${i}"]`)
      .closest("tr")
      .removeClass("red green")
      .addClass(ok ? "green" : "red");
  }
  /**
   * Lit les paramètres de redéploiement post-flood depuis localStorage et
   * les applique aux inputs (idempotent, appelé au montage de la BoiteCombat).
   *
   * @private
   * @method _mfChargerRedeployement
   */
  _mfChargerRedeployement() {
    let cfg;
    try {
      cfg = JSON.parse(localStorage.getItem("outiiil_postFloodRedeploy")) || {};
    } catch (e) {
      cfg = {};
    }
    $("#o_mfRedeployEnable").prop("checked", !!cfg.enable);
    $("#o_mfRedeployTdcNb").val(cfg.tdc?.nbTroupes ?? "");
    $("#o_mfRedeployTdcUnit").val(cfg.tdc?.indUnite ?? 1);
    $("#o_mfRedeployDomeNb").val(cfg.dome?.nbTroupes ?? "");
    $("#o_mfRedeployDomeUnit").val(cfg.dome?.indUnite ?? 1);
  }
  /**
   *
   */
  _mfBindRedeployement() {
    $("#o_mfRedeployTdcNb, #o_mfRedeployDomeNb").spinner({ min: 0, numberFormat: "i" });
    $(
      "#o_mfRedeployEnable, #o_mfRedeployTdcNb, #o_mfRedeployTdcUnit, #o_mfRedeployDomeNb, #o_mfRedeployDomeUnit",
    ).on("change", () => this._mfSauverRedeployement());
  }
  /**
   *
   */
  _mfSauverRedeployement() {
    let cfg = {
      enable: $("#o_mfRedeployEnable").is(":checked"),
      tdc: {
        nbTroupes: parseInt($("#o_mfRedeployTdcNb").val()) || 0,
        indUnite: parseInt($("#o_mfRedeployTdcUnit").val()) || 1,
      },
      dome: {
        nbTroupes: parseInt($("#o_mfRedeployDomeNb").val()) || 0,
        indUnite: parseInt($("#o_mfRedeployDomeUnit").val()) || 1,
      },
    };
    localStorage.setItem("outiiil_postFloodRedeploy", JSON.stringify(cfg));
  }
  /**
   * Construit la config de déplacement à partir de l'état UI courant.
   * Retourne `null` si la case n'est pas cochée.
   *
   * @private
   * @method _mfGetRedeployConfig
   */
  _mfGetRedeployConfig() {
    if (!$("#o_mfRedeployEnable").is(":checked")) return null;
    return {
      tdc: {
        nbTroupes: parseInt($("#o_mfRedeployTdcNb").val()) || 0,
        indUnite: parseInt($("#o_mfRedeployTdcUnit").val()) || 1,
      },
      dome: {
        nbTroupes: parseInt($("#o_mfRedeployDomeNb").val()) || 0,
        indUnite: parseInt($("#o_mfRedeployDomeUnit").val()) || 1,
      },
    };
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
            <tr><td></td><td><input type="text" id="o_pseudoTemps" placeholder="Pseudo"/></td><td>-></td><td><input type="text" id="o_cibleJoueurTemps" placeholder="Pseudo1, Pseudo2..."/></td></tr>
            <tr><td>Vitesse d'attaque</td><td><input type="number" id="o_vaTemps" value="0" min="0" max="50"/></td><td></td><td></td></tr>
            <tr><td>Dernier mouvement</td><td><input id="o_dernierMvt" placeholder="JJ-MM-AAAA HH:mm"/></td><td></td><td><button id="o_calculerTemps">Calculer</button></td></tr>
            <tr class="reduce"><td colspan="4"><em>Le temps maximal d'un trajet est de <span id="o_indicationTemps">${this.calculerLimiteTemps(0)}</span>.</em></td></tr>
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
        $("#o_vaTemps").val(0);
        $("#o_indicationTemps").text(this.calculerLimiteTemps(0));
      } else {
        $("#o_pseudoTemps").val(monProfil.pseudo);
        $("#o_vaTemps").val(monProfil.niveauRecherche[6]);
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
    $("#o_vaTemps").on("input", (e) => {
      $("#o_indicationTemps").text(this.calculerLimiteTemps($(e.currentTarget).val()));
    });
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
        this.calculerTemps(ref, joueurs, $("#o_dernierMvt").val());
      }
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
   *
   */
  calculerTemps(ref, joueurs, dernierMvt = "") {
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
      // on calcule les temps de trajet vers les joueurs
      for (let i = 0; i < joueurs.length; i++) {
        joueurs[i].chargerProfil(values[i + ind]);
        let tempsP = ref.getTempsParcours2(joueurs[i]);
        rows.push(
          $(
            `<tr><td>${joueurs[i].pseudo}</td><td>${numeral(joueurs[i].terrain).format()}</td><td>${Utils.intToTime(tempsP)}</td><td>${dernierMvt ? moment(dernierMvt, "DD-MM-YYYY HH:mm").add(tempsP, "s").format("D MMM à HH[h]mm[m]ss[s]") : ""}</td></tr>`,
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
    $("#o_tabsCombat4").append(
      `<br/><table id='o_infosTemps'><thead style="background-color:${monProfil.parametre["couleur2"].valeur}"><tr><th>Pseudo</th><th>Terrain</th><th>Temps de trajet</th><th>Retour le</th></tr></thead></table>`,
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
        { type: "time-unformat", targets: 2 },
      ],
      rowCallback: (row, data, index) => {
        $(row).css(
          "background-color",
          index % 2 == 0 ? "inherit" : monProfil.parametre["couleur2"].valeur,
        );
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
