/*
 * Profil.ts
 * Hraesvelg
 **********************************************************************/

import { $, moment, numeral } from "~/vendor";
import { Utils } from "~/lib/Utils";
import { getProfile } from "~/models/currentPlayer";
import { Player } from "~/models/Player";

/**
 * Classe de fonction pour la page /Membre.php?Pseudo=?.
 *
 * @class PageProfil
 * @constructor
 */
export class PlayerProfilePage {
  // Champs déclarés pour TypeScript (Phase 2 : conversion telle quelle, le
  // typage fin est reporté — cf. .claude/plans/wxt-migration-followups.md).
  _profile: any;
  _radarBox: any;
  /**
   *
   */
  constructor(boxRadar) {
    /**
     * Creation du modele profil
     */
    this._profile = null;
    /**
     * Acces à la boite radar
     */
    this._radarBox = boxRadar;
  }
  /**
   *
   */
  run() {
    // Sélecteur scopé `center > h2` : la toast "Toolzzz mis à jour" utilise
    // aussi un <h2> (cf. jquery-toast `.jq-toast-heading`) qu'un `$("h2")` global
    // concaténerait avec le pseudo de la page et corromprait la clé de
    // surveillance dans `_joueurs`.
    this._profile = new Player({ pseudo: $("center > h2").text() });
    let regexp = new RegExp("x=(\\d*) et y=(\\d*)"),
      row = $(".boite_membre").find("a[href^='carte2.php?']").text();
    this._profile.x = ~~row.replace(regexp, "$1");
    this._profile.y = ~~row.replace(regexp, "$2");
    this._profile.mv = $(".boite_membre table:eq(0) tr:eq(0) td:eq(0)")
      .text()
      .includes("Joueur en vacances");
    this._profile.id = $("a[href^='commerce.php?ID=']").attr("href").match(/\d+/g)[0];
    this._profile.terrain = numeral($(".tableau_score tr:eq(1) td:eq(1)").text()).value();
    // si on consulte un profil différent du sien
    if (!this._profile.isCurrentPlayer()) {
      // si on a pas de compte+ on affiche le temps de trajet
      !Utils.comptePlus && this.plus();
      // Affichage du retour dynamique
      $(".boite_membre:first div:first table").append(
        `<tr><td class='right'>Retour le :</td><td id='o_tempsRetour'>${moment().add(getProfile().getTravelTimeTo(this._profile), "s").format("D MMM à HH[h]mm[m]ss[s]")}</td></tr><tr><td class='right'>Rapport :</td><td id='o_tempsRetourRapport'>${Utils.roundMinute(getProfile().getTravelTimeTo(this._profile)).format("D MMM à HH[h]mm")}</td></tr>`,
      );
      Utils.incrementTime(
        getProfile().getTravelTimeTo(this._profile),
        "o_tempsRetour",
        "o_tempsRetourRapport",
      );
    }

    // Ajout de l'option pour ajouter au radar + un lien vers AntLeaks
    // (https://antleaks.guics.st) avec le pseudo dans le chemin — outil community
    // pour consulter l'historique public d'un joueur Fourmizzz.
    let antleaksUrl = `https://antleaks.guics.st/player/${encodeURIComponent(this._profile.pseudo)}`;
    $(".boite_membre:eq(1) table tr td:eq(0)").append(
      `${Utils.comptePlus ? "<br/>" : ""}- <span id='o_surveiller' class='cursor gras'>${this._radarBox.joueurs.hasOwnProperty(this._profile.pseudo) ? "Supprimer la surveillance" : "Surveiller ce joueur"}</span><br/>- <a class='gras' href='${antleaksUrl}' target='_blank' rel='noopener'>Voir sur AntLeaks</a>`,
    );

    $("#o_surveiller").click((e) => {
      if (!this._radarBox.joueurs.hasOwnProperty(this._profile.pseudo)) {
        $(e.currentTarget).text("Supprimer la surveillance");
        this._radarBox.addPlayer(this._profile);
      } else {
        $(e.currentTarget).text("Surveiller ce joueur");
        this._radarBox.removePlayer(this._profile);
      }
      this._radarBox.save().refresh();
    });
    return this;
  }
  /**
   *
   */
  plus() {
    // Affichage du temps de trajet
    $(".boite_membre:first div:first table").append(
      `<tr><td style='text-align:right'>Temps de trajet :</td><td>${Utils.intToTime(getProfile().getTravelTimeTo(this._profile))}</td></tr>`,
    );
    return this;
  }
}
