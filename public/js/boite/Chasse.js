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
      `<div id='o_tabsChasse' class='o_tabs'><ul><li><a href='#o_tabsChasse1'>Analyser</a></li><li><a href='#o_tabsChasse2'>Simuler</a></li></ul><div id='o_tabsChasse1'/><div id='o_tabsChasse2'/></div>`,
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
      this.analyse().simuler().css().event();
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
      "#o_resultatChasse tr:even, .o_tabs .ui-widget-header .ui-tabs-anchor, #o_simuChasseTable tr:even",
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
   * Comparateur de scénarios de chasse (onglet "Simuler" — `o_tabsChasse2`).
   * Inspiré du `RefreshOtherHF` de CalysteneHuntingSimulator (lines 3562-3743) :
   * l'utilisateur saisit plusieurs cibles de "terrain à conquérir", on affiche
   * en parallèle pour chacune le nombre de chasses, cm²/chasse, pertes (AVG/MAX),
   * temps requis et rentabilité — pour comparer rapidement plusieurs plans avant
   * de lancer.
   *
   * @private
   * @method simuler
   */
  simuler() {
    let diffOptions = RATIO_CHASSE.map(
      (r) => `<option value="${r}"${r === 9 ? " selected" : ""}>${r.toFixed(1)}</option>`,
    ).join("");
    $("#o_tabsChasse2").append(`
        <div class="centre">
            <p class="reduce"><em>Saisis plusieurs cibles pour comparer pertes, temps et rentabilité.</em></p>
            <table class="o_maxWidth centre" cellspacing="0">
                <tbody>
                    <tr><td class="right">Difficulté commune :</td><td><select id="o_simuChasseDiff">${diffOptions}</select></td></tr>
                </tbody>
            </table>
            <table id="o_simuChasseTable" class="o_maxWidth centre o_marginT15" cellspacing="0">
                <thead>
                    <tr><th>#</th><th>Terrain à conquérir</th><th>Nb</th><th>cm²/chasse</th><th>Pertes AVG</th><th>Pertes MAX</th><th>Temps</th><th>cm²/jour</th><th></th></tr>
                </thead>
                <tbody id="o_simuChasseRows"></tbody>
            </table>
            <button id="o_simuChasseAdd" class="o_button o_marginT15" type="button">+ Ajouter un scénario</button>
        </div>`);
    // État interne — scénarios par défaut basés sur le terrain courant
    let base = Math.max(Utils.terrain || 100000, 100000);
    this._simuChasseScenarios = [
      { tdcDep: Math.round(base * 1.5) },
      { tdcDep: Math.round(base * 2) },
      { tdcDep: Math.round(base * 3) },
    ];
    this._simuArmee = new Armee();
    // Bind events (délégation — les rows sont re-rendues à chaque changement)
    $("#o_simuChasseDiff").change(() => this._simuChasseRender());
    $("#o_simuChasseAdd").click(() => {
      this._simuChasseScenarios.push({ tdcDep: Math.round(base * 1.5) });
      this._simuChasseRender();
    });
    $("#o_simuChasseRows")
      .on("change spin", ".o_simuChasseTdc", (e, ui) => {
        let i = parseInt($(e.currentTarget).data("i"));
        let val = ui ? ui.value : parseInt($(e.currentTarget).val()) || 0;
        this._simuChasseScenarios[i].tdcDep = val;
        this._simuChasseRender();
      })
      .on("click", ".o_simuChasseRm", (e) => {
        let i = parseInt($(e.currentTarget).data("i"));
        this._simuChasseScenarios.splice(i, 1);
        if (!this._simuChasseScenarios.length)
          this._simuChasseScenarios.push({ tdcDep: Math.round(base * 1.5) });
        this._simuChasseRender();
      });
    // Charge l'armée (nécessaire pour calculRatio → calculChasse)
    this._simuArmee.getArmee().then((data) => {
      this._simuArmee.chargeData(data);
      this._simuChasseRender();
    });
    return this;
  }
  /**
   *
   */
  _simuChasseRender() {
    let armeePrete = this._simuArmee && this._simuArmee.unite.some((u) => u > 0);
    if (!armeePrete) {
      $("#o_simuChasseRows").html(
        `<tr><td colspan="9" class="centre reduce"><em>Chargement de l'armée…</em></td></tr>`,
      );
      return;
    }
    let diff = parseFloat($("#o_simuChasseDiff").val()),
      html = "";
    this._simuChasseScenarios.forEach((s, i) => {
      html += `<tr><td>${i + 1}</td>`;
      html += `<td><input type="text" class="o_simuChasseTdc" data-i="${i}" value="${s.tdcDep || 0}" size="12"/></td>`;
      if (s.tdcDep > 0) {
        let r = this._simuChasseCompute(s.tdcDep, diff);
        html += `<td>${r.NB}</td>`;
        html += `<td class="right">${numeral(r.HF).format()}</td>`;
        html += `<td class="right">${numeral(Math.round(r.pertes.AVG)).format()}</td>`;
        html += `<td class="right red">${numeral(Math.round(r.pertes.MAX)).format()}</td>`;
        html += `<td>${Utils.intToTime(r.temps)}</td>`;
        html += `<td class="right green">${numeral(r.rentab).format()}</td>`;
      } else {
        html += `<td colspan="6" class="centre reduce"><em>—</em></td>`;
      }
      html += `<td><span class="cursor o_simuChasseRm" data-i="${i}" title="Retirer">✕</span></td>`;
      html += `</tr>`;
    });
    $("#o_simuChasseRows").html(html);
    $("#o_simuChasseRows input.o_simuChasseTdc").spinner({ min: 0, numberFormat: "i" });
    this.css();
  }
  /**
   *
   */
  _simuChasseCompute(tdcDep, diff) {
    let armee = this._simuArmee,
      reste = monProfil.niveauRecherche[5] + 2,
      res = armee.calculChasse(tdcDep, diff, 0, 0, reste),
      dDiff = armee.calculDifficulte(tdcDep, res.NB, res.HF),
      pertes = armee.calculPerte(RATIO_CHASSE.indexOf(parseFloat(diff)), dDiff),
      temps = Math.round((Utils.terrain + res.HF) * Math.pow(0.9, monProfil.niveauRecherche[5])),
      rentab = temps > 0 ? Math.round(((res.NB * res.HF) / temps) * 86400) : 0;
    return { NB: res.NB, HF: res.HF, dDiff, pertes, temps, rentab };
  }
}
