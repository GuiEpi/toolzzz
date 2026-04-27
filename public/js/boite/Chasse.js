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
   * Reproduit le comportement du simulateur natif `simulateurChasse.php` :
   * le joueur saisit son armée + terrain de chasse actuel + terrain à conquérir,
   * et la faune est **auto-générée** (composition aléatoire d'espèces dont la
   * difficulté cumulée matche celle du natif via `Armee.calculDifficulte`).
   * Sur victoire : pertes appliquées, JSN promues en SN, terrain mis à jour ;
   * sur défaite : on garde le form intact pour permettre un nouveau Fight!
   *
   * @private
   * @method simuler
   */
  simuler() {
    let armeeRows = "";
    for (let i = 1; i <= 14; i++) {
      armeeRows += `<tr><td class="right reduce">${NOM_UNITE[i]}</td><td><input type="text" class="o_simuChasseUnit" data-i="${i - 1}" value="0" size="10"/></td></tr>`;
    }
    $("#o_tabsChasse2").append(`
        <div class="centre">
            <p class="reduce"><em>Simule un combat type natif : ton armée vs une faune auto-générée à partir du terrain à conquérir. Stats issues du <a href="http://alliancead2.free.fr/Bestiaire.html" target="_blank">Bestiaire</a>.</em></p>
            <table class="o_maxWidth centre o_marginT15" cellspacing="0"><tr>
                <td valign="top" style="width:55%">
                    <table id="o_simuChasseArmee" class="o_maxWidth centre" cellspacing="0">
                        <thead><tr><th colspan="2">Chasseurs <span id="o_simuChasseLoadArmee" class="reduce souligne cursor">[charger mon armée]</span></th></tr></thead>
                        <tbody>${armeeRows}</tbody>
                    </table>
                </td>
                <td valign="top" style="width:45%">
                    <table id="o_simuChasseTdc" class="o_maxWidth centre" cellspacing="0">
                        <thead><tr><th colspan="2">Quantités de terrain de chasse</th></tr></thead>
                        <tbody>
                            <tr><td class="right reduce">Terrain de chasse actuel</td><td><input type="text" id="o_simuChasseTdcAct" value="0" size="10"/> cm²</td></tr>
                            <tr><td class="right reduce">Terrain à conquérir</td><td><input type="text" id="o_simuChasseTdcVeut" value="0" size="10"/> cm²</td></tr>
                        </tbody>
                    </table>
                </td>
            </tr></table>
            <button id="o_simuChasseGo" class="o_button f_success o_marginT15" type="button">Fight !</button>
            <div id="o_simuChasseResult" class="o_marginT15"></div>
        </div>`);
    $("#o_simuChasseArmee input.o_simuChasseUnit, #o_simuChasseTdc input").spinner({
      min: 0,
      numberFormat: "i",
    });
    $("#o_simuChasseTdcAct").spinner("value", Utils.terrain || 0);
    $("#o_simuChasseLoadArmee").click(() => {
      let armee = new Armee();
      armee.getArmee().then((data) => {
        armee.chargeData(data);
        for (let i = 0; i < 14; i++)
          $(`#o_simuChasseArmee input[data-i="${i}"]`).spinner("value", armee.unite[i] || 0);
      });
    });
    $("#o_simuChasseGo").click(() => this._simuChasseLancer());
    return this;
  }
  /**
   *
   */
  _simuChasseLancer() {
    let armee = new Armee(),
      tdcAct = parseInt($("#o_simuChasseTdcAct").spinner("value")) || 0,
      tdcVeut = parseInt($("#o_simuChasseTdcVeut").spinner("value")) || 0;
    $("#o_simuChasseArmee input.o_simuChasseUnit").each((_, el) => {
      armee.unite[parseInt($(el).data("i"))] = parseInt($(el).val()) || 0;
    });
    if (!armee.unite.some((n) => n > 0)) {
      $.toast({ ...TOAST_WARNING, text: "Saisis au moins une unité dans Chasseurs." });
      return;
    }
    let armeeAvant = armee.unite.slice(),
      // q=0 → minimum 1 cm² conquis comme le natif
      q = tdcVeut > 0 ? tdcVeut : 1,
      // calculDifficulte donne ~5% près de la valeur natif
      targetDiff = armee.calculDifficulte(tdcAct, 1, q),
      faune = this._simuChasseGenererFaune(targetDiff),
      res = Chasse.simulerCombat(armee, faune, {
        armes: monProfil.niveauRecherche[2],
        bouclier: monProfil.niveauRecherche[1],
      }),
      cm2Conquis = res.issue === "victoire" ? q : 0,
      // Heuristique calibrée sur 2 datapoints (1cm² → 20 promo, 1000cm² → 189 promo)
      promotions =
        res.issue === "victoire"
          ? Math.min(res.survivantsJ[0], Math.max(20, Math.round(cm2Conquis * 0.19)))
          : 0;
    this._simuChasseAfficherResultat({ armeeAvant, faune, res, cm2Conquis, promotions });
    if (res.issue === "victoire") {
      let nouvelleArmee = res.survivantsJ.slice();
      nouvelleArmee[0] -= promotions;
      nouvelleArmee[1] += promotions;
      for (let i = 0; i < 14; i++)
        $(`#o_simuChasseArmee input[data-i="${i}"]`).spinner("value", nouvelleArmee[i] || 0);
      $("#o_simuChasseTdcAct").spinner("value", tdcAct + cm2Conquis);
      // Le terrain à conquérir reste — l'utilisateur peut Fight! à nouveau
    }
  }
  /**
   * Heuristique de génération de faune : pioche aléatoirement des espèces
   * en visant une difficulté cumulée ≈ targetDiff. Reproduit la variance
   * observée sur le natif (3 captures à mêmes inputs → 3 compositions
   * différentes mais sommes de difficulté ~identiques à 2-3% près).
   *
   * @private
   * @method _simuChasseGenererFaune
   */
  _simuChasseGenererFaune(targetDiff) {
    let composition = {},
      remaining = targetDiff,
      maxIter = 20;
    while (remaining > FAUNE[0].diff && maxIter-- > 0) {
      let viable = FAUNE.filter((s) => s.diff <= remaining);
      if (!viable.length) break;
      // Biais vers les petites espèces : poids ~ 1/diff
      let totalWeight = viable.reduce((s, x) => s + 1 / x.diff, 0),
        roll = Math.random() * totalWeight,
        cumul = 0,
        chosen = viable[0];
      for (let s of viable) {
        cumul += 1 / s.diff;
        if (roll <= cumul) {
          chosen = s;
          break;
        }
      }
      let maxFit = Math.floor(remaining / chosen.diff),
        count = 1 + Math.floor(Math.random() * maxFit);
      composition[chosen.slug] = (composition[chosen.slug] || 0) + count;
      remaining -= count * chosen.diff;
    }
    return Object.keys(composition).map((slug) => ({ slug, count: composition[slug] }));
  }
  /**
   *
   */
  _simuChasseAfficherResultat({ armeeAvant, faune, res, cm2Conquis, promotions }) {
    let armeeStr = armeeAvant
      .map((n, i) =>
        n > 0 ? `${numeral(n).format()} ${n > 1 ? NOM_UNITES[i + 1] : NOM_UNITE[i + 1]}` : null,
      )
      .filter(Boolean)
      .join(", ");
    let fauneStr = faune
      .map((f) => {
        let s = FAUNE.find((x) => x.slug === f.slug);
        return `${numeral(f.count).format()} ${f.count > 1 ? s.nom + (s.nom.endsWith("s") ? "" : "s") : s.nom}`;
      })
      .join(", ");
    let issueColor =
        res.issue === "victoire" ? "green" : res.issue === "defaite" ? "red" : "orange",
      issueText =
        res.issue === "victoire"
          ? "Vous avez gagné cette bataille !"
          : res.issue === "defaite"
            ? "Vos chasseuses sont mortes, l'expédition a échoué."
            : "Match nul — combat interrompu.";
    let html = `<table id="o_simuChasseRounds" class="o_maxWidth centre" cellspacing="0">
            <thead><tr><th>Message que recevrait le chasseur :</th></tr></thead>
            <tbody>
                <tr><td class="left reduce"><b>Troupes en attaque :</b> ${armeeStr || "—"}.</td></tr>
                <tr><td class="left reduce"><b>Troupes en défense :</b> ${fauneStr || "—"}.</td></tr>`;
    res.rounds.forEach((r) => {
      html += `<tr><td class="left reduce">Vous infligez <b>${numeral(r.playerAtt).format()}</b> (+ ${numeral(r.playerAttBonus).format()}) dégâts et tuez <b class="green">${numeral(r.playerKills).format()}</b> ennemies.</td></tr>`;
      html += `<tr><td class="left reduce">L'ennemie inflige <b>${numeral(r.enemyAtt).format()}</b> (+ 0) dégâts à vos fourmis et en tue <b class="red">${numeral(r.playerLost).format()}</b>.</td></tr>`;
    });
    html += `<tr><td class="centre gras ${issueColor}">${issueText}</td></tr>`;
    if (res.issue === "victoire" && promotions > 0) {
      html += `<tr><td class="left reduce"><em>Les unités survivantes ont appris de cette bataille :<br/>− ${numeral(promotions).format()} ${promotions > 1 ? "Jeunes Soldates Naines sont devenues des" : "Jeune Soldate Naine est devenue une"} <b>${promotions > 1 ? "Soldates Naines" : "Soldate Naine"}</b></em></td></tr>`;
    }
    if (cm2Conquis > 0) {
      html += `<tr><td class="left reduce">Vos chasseuses ont conquis <b class="green">${numeral(cm2Conquis).format()}</b> cm². <em class="reduce">(Nourriture : non calculée — heuristique non implémentée.)</em></td></tr>`;
    }
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
