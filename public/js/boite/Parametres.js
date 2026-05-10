/*
 * BoiteParametre.js
 * Hraesvelg
 **********************************************************************/

/**
 * Classe permettant de choisir ses préférences.
 *
 * @class BoiteParametre
 * @constructor
 * @extends Boite
 */
class BoiteParametre extends Boite {
  /**
   *
   */
  constructor() {
    super(
      "o_boiteParametre",
      "Paramètres",
      `<div id='o_tabsParametre' class='o_tabs'><ul><li><a href='#o_tabsParametre1'>Général</a></li><li><a href='#o_tabsParametre2'>Utilitaire</a></li><li><a href='#o_tabsParametre3'>Apparence</a></li><li><a href='#o_tabsParametre4'>À propos</a></li></ul><div id='o_tabsParametre1'/><div id='o_tabsParametre2'/><div id='o_tabsParametre3'/><div id='o_tabsParametre4'/></div>`,
    );
    /**
     *
     */
    this._paramStyle = [
      "couleurTitre",
      "couleur1",
      "couleur2",
      "couleur3",
      "couleurTexte",
      "dockPosition",
      "dockVisible",
      "boiteShow",
      "boiteHide",
    ];
    /**
     *
     */
    this._paramUtilitaire = ["forumCommande", "forumMembre"];
    /**
     *
     */
    this._paramGeneral = [
      "affectationRessource",
      "methodeFlood",
      "uniteAntisondeTerrain",
      "uniteAntisondeDome",
      "uniteSonde",
    ];
  }
  /**
   * Affiche la boite.
   *
   * @private
   * @method afficher
   */
  afficher() {
    if (super.afficher()) {
      $("#o_tabsParametre")
        .tabs({
          activate: (e, ui) => {
            this.css();
          },
        })
        .removeClass("ui-widget");
      this.parametreStyle().parametreUtilitaire().parametreGeneral().apropos().css().event();
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
    for (let param of this._paramStyle) monProfil.parametre[param].ajouterEvent();
    for (let param of this._paramUtilitaire) monProfil.parametre[param].ajouterEvent();
    for (let param of this._paramGeneral) monProfil.parametre[param].ajouterEvent();
    $("#dockPosition").on("change", () => Dock.appliquerPosition());
    return this;
  }
  /**
   *
   */
  parametreStyle() {
    let content = ``;
    for (let param of this._paramStyle) content += monProfil.parametre[param].getForm();
    $("#o_tabsParametre3").append(`<form>${content}</form>`);
    return this;
  }
  /**
   *
   */
  parametreUtilitaire() {
    let content = ``;
    for (let param of this._paramUtilitaire) content += monProfil.parametre[param].getForm();
    // max-width sur le bloc texte : sans ça, le long paragraphe pousse la boîte à grandir
    // pendant le drag (la boîte n'a pas de max-width et son layout est recalculé en
    // continu, ce qui déclenche un effet "s'agrandit sans cesse").
    $("#o_tabsParametre2").append(`
      <p class='left reduce gras' style='margin-left:10px;'>Saisissez les identifiants des sujets de votre utilitaire<span class="cliquable2" style="font-size:0.8em; font-weight:normal;" onclick="spoilerId('o_paramUtilitaireInfo');"> En savoir plus ?</span></p>
      <div id='o_paramUtilitaireInfo' class='o_marginT15 left reduce' style='display:none; max-width:500px; word-wrap:break-word; margin-left:auto; margin-right:auto;'>
        <p>Ces deux champs pointent vers les sections cachées du forum d'alliance (<b>Toolzzz_Commande</b> et <b>Toolzzz_Membre</b>, ou les anciens noms <b>Outiiil_Commande</b>/<b>Outiiil_Membre</b> si l'alliance a préparé son forum à l'époque d'Outiiil) qui servent de stockage partagé pour les fonctionnalités d'utilitaire d'alliance : assignations d'attaques, ordres collectifs, et coordonnées des membres (colonnes Tdt / Retour dans la liste des membres).</p>
        <p>Tu n'as <b>pas besoin de les remplir à la main</b> dans la majorité des cas. L'extension les auto-détecte quand tu visites le forum de ton alliance, à condition que les sections existent. C'est le chef d'alliance qui les crée via le bouton <em>Préparer le forum pour un SDC</em> dans le forum.</p>
        <p>Modifie ici <b>uniquement si</b> l'auto-détection a échoué, après un reset des paramètres, ou si ton chef t'a communiqué les IDs directement.</p>
      </div>
      <form>${content}</form>
    `);
    return this;
  }
  /**
   *
   */
  parametreGeneral() {
    // L'affectation auto Toolzzz vit dans PageRessource.plus(), gated non-C+.
    // En C+ l'option ne fait rien (et le jeu propose sa propre affectation auto
    // côté serveur), donc on la masque pour éviter la confusion.
    let blocAffectation = Utils.comptePlus
      ? ""
      : `<p class='left reduce gras'>L'affectation sera automatique lors de la consultation de la page ressource</p>
         ${monProfil.parametre[this._paramGeneral[0]].getForm()}`;
    $("#o_tabsParametre1").append(`<form>
            ${blocAffectation}
            <p class='left reduce gras'>La méthode sera sélectionnée par défaut dans le lanceur de flood</p>
            ${monProfil.parametre[this._paramGeneral[1]].getForm()}
            <p class='left reduce gras'>Indiquez le nombre d'unité selon l'objectif</p>
            <p class='left small'><em>Le nombre est choisi aléatoirement entre 90% du max et le max.</em></p>
            ${monProfil.parametre[this._paramGeneral[2]].getForm() + monProfil.parametre[this._paramGeneral[3]].getForm() + monProfil.parametre[this._paramGeneral[4]].getForm()}
        </form>`);
    return this;
  }
  /**
   *
   */
  apropos() {
    const repo = "https://github.com/GuiEpi/toolzzz";
    $("#o_tabsParametre4").append(`
      <p class='left reduce gras'>Toolzzz v${VERSION}</p>
      <p class='left reduce'>Extension open source pour Fourmizzz.fr.</p>
      <ul class='left reduce'>
        <li><a href='${repo}/wiki' target='_blank' rel='noopener'>Wiki</a></li>
        <li><a href='${repo}' target='_blank' rel='noopener'>Code source (GitHub)</a></li>
        <li><a href='${repo}/issues/new?template=bug_report.yml' target='_blank' rel='noopener'>Signaler un bug</a></li>
        <li><a href='${repo}/issues/new?template=feature_request.yml' target='_blank' rel='noopener'>Proposer une fonctionnalité</a></li>
      </ul>
      <p class='left reduce'>Fork de <a href='https://github.com/Hraesvelg/Outiiil' target='_blank' rel='noopener'>Outiiil</a> par Hraesvelg, sous licence <a href='${repo}/blob/master/LICENSE' target='_blank' rel='noopener'>GPL-3.0</a>.</p>
    `);
    return this;
  }
}
