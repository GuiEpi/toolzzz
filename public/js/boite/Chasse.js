/*
 * BoiteChasse.js
 * Hraesvelg
 **********************************************************************/

/**
 * Classe permettant d'analyser simuler et lancer des chasses.
 *
 * @class BoiteChasse
 * @constructor
 * @extends Boite
 */
class BoiteChasse extends Boite {
  constructor() {
    super(
      "o_boiteChasse",
      "Outils pour Chasseur",
      `<div id='o_tabsChasse' class='o_tabs'><ul><li><a href='#o_tabsChasse1'>Analyser</a></li><li><a href='#o_tabsChasse2'>Simuler</a></li><li><a href='#o_tabsChasse3'>Bestiaire</a></li></ul><div id='o_tabsChasse1'/><div id='o_tabsChasse2'/><div id='o_tabsChasse3'/></div>`,
    );
  }
  /**
   * Affiche la boite.
   *
   * @private
   * @method afficher
   */
  afficher() {
    if (super.afficher()) {
      $("#o_tabsChasse")
        .tabs({
          activate: (event, ui) => {
            this.css();
          },
        })
        .removeClass("ui-widget");
      this.analyse().simuler().bestiaire().css().event();
    }
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
      "#o_resultatChasse tr:even, .o_tabs .ui-widget-header .ui-tabs-anchor, #o_simuChasseFaune tr:even, #o_simuChasseRounds tr:even, #o_bestiaireTable tr:even",
    ).css("background-color", monProfil.parametre["couleur2"].valeur);
    $(".o_content a").css("color", monProfil.parametre["couleurTexte"].valeur);
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
    $(".o_content .ui-state-disabled a").css({ cursor: "not-allowed", "pointer-events": "all" });
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
   * Formulaire pour analyser une ou plusieurs chasse(s).
   *
   * @private
   * @method analyse
   */
  analyse() {
    $("#o_tabsChasse1").append(
      "<textarea id='o_rcChasse' class='o_maxWidth' placeholder='Rapport(s) de chasse(s)...'></textarea><div class='o_marginT15'><table  id='o_resultatChasse' class='o_maxWidth'></table></div>",
    );

    $("#o_rcChasse").on("input", (e) => {
      // on recup les chasses à analyser
      let chasses = e.currentTarget.value.split("nourriture"),
        bilan = new Chasse(""),
        chasse = null,
        erreur = false,
        html =
          "<tr class='gras'><td colspan='2'>Avant</td><td colspan='2'>Evolution</td><td colspan='2'>Résultat</td></tr>";
      // on nettoie l'ancien affichage
      $("#o_resultatChasse").html("");
      for (let i = 0; i < chasses.length; i++) {
        if (chasses[i]) {
          chasse = new Chasse(chasses[i]);
          if (chasse.analyse()) {
            html += chasse.toHTMLBoite(false);
            bilan.ajoute(chasse);
          } else {
            $.toast({ ...TOAST_WARNING, text: "Le rapport de chasse ne peut pas être analysé." });
            erreur = true;
          }
        }
      }
      if (!erreur) {
        $("#o_resultatChasse").append(html);
        this.afficherBilan(bilan);
      }
    });
    return this;
  }
  /**
   * Affiche les données issue d'un rapport de chasse.
   *
   * @private
   * @method afficherAnalyse
   * @param {Object} chasse
   * @param {Boolean} bilan
   */
  afficherBilan(chasse) {
    let i = 0,
      html = "<tr><td colspan='6'><select id='o_choixChasse' class='o_marginT15'>";
    for (
      ;
      i < Math.floor($("#o_resultatChasse tr").length / 4);
      html += "<option value='" + i + "'>Chasse " + (i + 1) + "</option>", i++
    );
    html += "<option value='" + i + "' selected>Bilan</option></select></td></tr>";
    $("#o_resultatChasse").append(chasse.toHTMLBoite(true) + html);
    // Style
    $("#o_resultatChasse tr:even").css("background-color", monProfil.parametre["couleur2"].valeur);
    $("#o_choixChasse").change((e) => {
      let selection = e.currentTarget.value;
      $("#o_resultatChasse tr:gt(0):lt(-1):visible").toggle();
      $(
        "#o_resultatChasse tr:eq(" +
          (selection * 4 + 1) +
          "), #o_resultatChasse tr:eq(" +
          (selection * 4 + 2) +
          "), #o_resultatChasse tr:eq(" +
          (selection * 4 + 3) +
          "), #o_resultatChasse tr:eq(" +
          (selection * 4 + 4) +
          ")",
      ).toggle();
    });
  }
  /**
   * Simulateur de combat de chasse (onglet "Simuler" — `o_tabsChasse2`).
   * Le joueur saisit l'armée envoyée et la composition de faune rencontrée ;
   * on simule round-by-round en s'appuyant sur `Chasse.simulerCombat` (cf.
   * docs des stats de faune dans la table FAUNE de content.js) et on rend
   * le narratif type natif (« Vous infligez X dégâts et tuez Y ennemies »).
   *
   * @private
   * @method simuler
   */
  simuler() {
    // Inputs armée joueur : 1 ligne par unité (14 unités, ATT_UNITE/VIE_UNITE)
    let armeeRows = "";
    for (let i = 1; i <= 14; i++) {
      armeeRows += `<tr><td class="right reduce">${NOM_UNITE[i]}</td><td><input type="text" class="o_simuChasseUnit" data-i="${i - 1}" value="0" size="10"/></td></tr>`;
    }
    // Inputs faune : 1 ligne par espèce
    let fauneRows = FAUNE.map(
      (f) =>
        `<tr><td><img src="${chrome.runtime.getURL("images/faune/" + f.slug + ".png")}" height="22" alt="${f.nom}"/></td><td class="right reduce">${f.nom}</td><td><input type="text" class="o_simuChasseFauneN" data-slug="${f.slug}" value="0" size="10"/></td></tr>`,
    ).join("");
    $("#o_tabsChasse2").append(`
        <div class="centre">
            <p class="reduce"><em>Simule un combat tour-par-tour : ton armée vs une composition de faune. Stats issues du <a href="http://alliancead2.free.fr/Bestiaire.html" target="_blank">Bestiaire</a>.</em></p>
            <table class="o_maxWidth centre o_marginT15" cellspacing="0"><tr>
                <td valign="top" style="width:50%">
                    <table id="o_simuChasseArmee" class="o_maxWidth centre" cellspacing="0">
                        <thead><tr><th colspan="2">Mon armée <span id="o_simuChasseLoadArmee" class="reduce souligne cursor">[charger]</span></th></tr></thead>
                        <tbody>${armeeRows}</tbody>
                    </table>
                </td>
                <td valign="top" style="width:50%">
                    <table id="o_simuChasseFaune" class="o_maxWidth centre" cellspacing="0">
                        <thead><tr><th colspan="3">Faune rencontrée</th></tr></thead>
                        <tbody>${fauneRows}</tbody>
                    </table>
                </td>
            </tr></table>
            <button id="o_simuChasseGo" class="o_button f_success o_marginT15" type="button">Simuler</button>
            <div id="o_simuChasseResult" class="o_marginT15"></div>
        </div>`);
    $(
      "#o_simuChasseArmee input.o_simuChasseUnit, #o_simuChasseFaune input.o_simuChasseFauneN",
    ).spinner({
      min: 0,
      numberFormat: "i",
    });
    // Charge l'armée du joueur dans les inputs sur clic
    $("#o_simuChasseLoadArmee").click(() => {
      let armee = new Armee();
      armee.getArmee().then((data) => {
        armee.chargeData(data);
        for (let i = 0; i < 14; i++)
          $(`#o_simuChasseArmee input[data-i="${i}"]`).spinner("value", armee.unite[i] || 0);
      });
    });
    // Lance la simu
    $("#o_simuChasseGo").click(() => {
      let armee = new Armee();
      $("#o_simuChasseArmee input.o_simuChasseUnit").each((_, el) => {
        armee.unite[parseInt($(el).data("i"))] = parseInt($(el).val()) || 0;
      });
      let faune = $("#o_simuChasseFaune input.o_simuChasseFauneN")
        .map((_, el) => ({ slug: $(el).data("slug"), count: parseInt($(el).val()) || 0 }))
        .get()
        .filter((f) => f.count > 0);
      if (!armee.unite.some((n) => n > 0)) {
        $.toast({ ...TOAST_WARNING, text: "Saisis au moins une unité de ton armée." });
        return;
      }
      if (!faune.length) {
        $.toast({ ...TOAST_WARNING, text: "Saisis au moins une espèce de faune." });
        return;
      }
      let res = Chasse.simulerCombat(armee, faune, {
        armes: monProfil.niveauRecherche[2],
        bouclier: monProfil.niveauRecherche[1],
      });
      this._simuChasseAfficherResultat(armee, faune, res);
    });
    return this;
  }
  /**
   *
   */
  _simuChasseAfficherResultat(armeeInit, fauneInit, res) {
    let armeeStr = armeeInit.unite
      .map((n, i) => (n > 0 ? `${numeral(n).format()} ${NOM_UNITE[i + 1]}` : null))
      .filter(Boolean)
      .join(", ");
    let fauneStr = fauneInit
      .map((f) => `${numeral(f.count).format()} ${FAUNE.find((x) => x.slug === f.slug).nom}`)
      .join(", ");
    let html = `<table id="o_simuChasseRounds" class="o_maxWidth centre" cellspacing="0">
            <thead><tr><th colspan="4">Résultat du combat</th></tr></thead>
            <tbody>
                <tr><td colspan="4" class="left reduce"><b>Troupes en attaque :</b> ${armeeStr || "—"}.</td></tr>
                <tr><td colspan="4" class="left reduce"><b>Troupes en défense :</b> ${fauneStr || "—"}.</td></tr>`;
    res.rounds.forEach((r) => {
      html += `<tr><td colspan="4" class="left reduce">Vous infligez <b>${numeral(r.playerAtt).format()}</b> (+ ${numeral(r.playerAttBonus).format()}) dégâts et tuez <b class="green">${numeral(r.playerKills).format()}</b> ennemies.</td></tr>`;
      html += `<tr><td colspan="4" class="left reduce">L'ennemie inflige <b>${numeral(r.enemyAtt).format()}</b> (+ 0) dégâts à vos fourmis et en tue <b class="red">${numeral(r.playerLost).format()}</b>.</td></tr>`;
    });
    let issueColor =
        res.issue === "victoire" ? "green" : res.issue === "defaite" ? "red" : "orange",
      issueText =
        res.issue === "victoire"
          ? "Vous avez gagné cette bataille !"
          : res.issue === "defaite"
            ? "Vos chasseuses sont mortes, l'expédition a échoué."
            : "Match nul — combat interrompu.";
    html += `<tr><td colspan="4" class="centre gras ${issueColor}">${issueText}</td></tr>`;
    let survivantsJ = res.survivantsJ
      .map((n, i) => (n > 0 ? `${numeral(n).format()} ${NOM_UNITE[i + 1]}` : null))
      .filter(Boolean)
      .join(", ");
    let survivantsE = res.survivantsE
      .map((e) => `${numeral(e.count).format()} ${e.nom}`)
      .join(", ");
    html += `<tr><td colspan="4" class="left reduce"><b>Survivants joueur :</b> ${survivantsJ || "aucun"}.</td></tr>`;
    html += `<tr><td colspan="4" class="left reduce"><b>Survivants faune :</b> ${survivantsE || "aucun"}.</td></tr>`;
    html += `</tbody></table>`;
    $("#o_simuChasseResult").html(html);
    this.css();
  }
  /**
   * Onglet "Bestiaire" — liste des 17 espèces de faune avec image et stats.
   * Source de la table : http://alliancead2.free.fr/Bestiaire.html (constants
   * FAUNE dans content.js, images bundlées dans public/images/faune/).
   *
   * @private
   * @method bestiaire
   */
  bestiaire() {
    let rows = FAUNE.map(
      (f) =>
        `<tr><td><img src="${chrome.runtime.getURL("images/faune/" + f.slug + ".png")}" height="32" alt="${f.nom}"/></td><td class="left">${f.nom}</td><td class="right">${numeral(f.fdf).format()}</td><td class="right">${numeral(f.vie).format()}</td><td class="right">${numeral(f.diff).format()}</td></tr>`,
    ).join("");
    $("#o_tabsChasse3").append(`
        <table id="o_bestiaireTable" class="o_maxWidth centre" cellspacing="0">
            <thead><tr><th></th><th>Espèce</th><th class="right">FdF</th><th class="right">Vie</th><th class="right">Difficulté</th></tr></thead>
            <tbody>${rows}</tbody>
            <tfoot><tr><td colspan="5" class="reduce"><em>Stats issues du <a href="http://alliancead2.free.fr/Bestiaire.html" target="_blank">Bestiaire</a> de Calystène (2017).</em></td></tr></tfoot>
        </table>`);
    return this;
  }
}
