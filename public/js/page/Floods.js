/*
 * Floods.js
 **********************************************************************/

/**
 * Onglet « Floods » du menu d'alliance (alliance.php?Membres#floods) : tableau
 * des floods en cours de l'alliance, lus dans la section Toolzzz_Flood du
 * forum où chaque membre équipé de Toolzzz note les siens (cf. FloodPartage).
 *
 * @class PageFloods
 * @constructor
 */
class PageFloods {
  constructor() {
    this._charge = false;
  }
  /**
   * Injecte la section (masquée) et branche l'onglet.
   *
   * @method executer
   */
  executer() {
    if (!$("#o_ongletFloods").length || $("#o_floodsAlliance").length) return this;
    $("#alliance").after(`
      <div id='o_floodsAlliance' class='boite_amelioration simulateur centre' style='display:none;'>
        <h2>Floods en cours</h2>
        <p class='reduce'>Floods sur terrain de chasse lancés par les membres de l'alliance, tels que Toolzzz les a notés dans la section <b>Toolzzz_Flood</b> du forum. Seuls les floods lancés depuis un navigateur équipé de Toolzzz y figurent. Le terrain de la cible est estimé en enchaînant tous ces floods par ordre d'arrivée, à partir du terrain relevé au lancement du premier.</p>
        <div class='centre o_marginT15'>
          <button id='o_floodsActualiser' class='o_button f_info'>Actualiser</button>
          <span id='o_floodsStatut' class='reduce' style='margin-left:12px;'></span>
        </div>
        <table id='o_floodsListe' class='o_maxWidth centre o_marginT15' cellspacing='0'></table>
      </div>
    `);
    $("#o_floodsActualiser").click(() => this.charger());
    $("#o_ongletFloods").click((e) => {
      e.preventDefault();
      this.afficher();
    });
    if (location.hash === "#floods") this.afficher();
    return this;
  }
  /**
   * Affiche l'onglet à la place de la page (et de la carte), et charge les
   * floods à la première ouverture.
   *
   * @method afficher
   */
  afficher() {
    $("#alliance, #o_carteAlliance").hide();
    $("#o_floodsAlliance").show();
    if (!this._charge) this.charger();
    return this;
  }
  /**
   * Lit la section puis le sujet de chaque membre.
   *
   * @method charger
   */
  charger() {
    this._charge = true;
    let statut = $("#o_floodsStatut"),
      bouton = $("#o_floodsActualiser");
    bouton.prop("disabled", true);
    statut.text("Chargement…");
    FloodPartage.chargerAlliance(true, (faits, total) =>
      statut.text(`Lecture des sujets… (${faits}/${total})`),
    )
      .then((r) => {
        if (!r.section) {
          statut.text("");
          $("#o_floodsListe").html(
            `<tr><td><em>Ton alliance n'a pas encore de section <b>Toolzzz_Flood</b>. Un chef peut la créer depuis le forum d'alliance : icône Toolzzz, puis <b>Préparer le forum pour un SDC</b>.</em></td></tr>`,
          );
          return;
        }
        this._afficherTableau(FloodPartage.enchainer(r.floods));
        statut.text(
          `Mis à jour à ${moment().format("HH[h]mm")}` +
            (r.erreurs
              ? ` · ${r.erreurs} sujet${r.erreurs > 1 ? "s" : ""} illisible${r.erreurs > 1 ? "s" : ""}`
              : ""),
        );
      })
      .catch(() => {
        statut.text("");
        $.toast({
          ...TOAST_ERROR,
          text: "Impossible de lire la section Toolzzz_Flood du forum.",
        });
      })
      .then(() => bouton.prop("disabled", false));
    return this;
  }
  /**
   * @private
   * @method _afficherTableau
   */
  _afficherTableau(floods) {
    let esc = (t) => $("<div>").text(t).html(),
      lien = (p) => `<a href='Membre.php?Pseudo=${encodeURIComponent(p)}'>${esc(p)}</a>`;
    if (!floods.length) {
      $("#o_floodsListe").html("<tr><td><em>Aucun flood en cours.</em></td></tr>");
      return;
    }
    let cibles = new Set(floods.map((f) => f.cible)).size,
      lignes = floods.map((f, k) => {
        let terrain =
          f.tdcAvant != null
            ? `${numeral(f.tdcAvant).format()} → ${numeral(f.tdcApres).format()}`
            : "?";
        return `<tr class='${f.lanceur == monProfil.pseudo ? "gras" : ""}'>
          <td>${moment(f.arrivee).format("D MMM HH[h]mm[m]ss[s]")}</td>
          <td><span id='o_floodReste${k}'></span></td>
          <td>${lien(f.lanceur)}</td><td>${lien(f.cible)}</td>
          <td class='right'>${f.unites != null ? numeral(f.unites).format() : "?"}</td>
          <td class='right'>${terrain}</td></tr>`;
      });
    $("#o_floodsListe").html(
      `<thead><tr><th>Arrivée</th><th>Dans</th><th>Lanceur</th><th>Cible</th><th>Unités</th><th>TdC de la cible (estimé)</th></tr></thead>
      <tbody>${lignes.join("")}
        <tr class='reduce'><td colspan='6'><em>${floods.length} flood${floods.length > 1 ? "s" : ""} en cours sur ${cibles} cible${cibles > 1 ? "s" : ""}</em></td></tr>
      </tbody>`,
    );
    $("#o_floodsListe tr:even").css("background-color", monProfil.parametre["couleur2"].valeur);
    floods.forEach((f, k) =>
      Utils.decreaseTime(Math.round((f.arrivee - Date.now()) / 1000), "o_floodReste" + k, {
        aZero: () => $("#o_floodReste" + k).text("arrivé"),
      }),
    );
  }
}
