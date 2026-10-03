/*
 * PlayerProfile.ts
 * Hraesvelg
 **********************************************************************/

import { $, moment, numeral } from "~/vendor";
import { Utils } from "~/lib/Utils";
import { getProfile } from "~/models/currentPlayer";
import { Player } from "~/models/Player";

/**
 * Enriches the /Membre.php?Pseudo= page.
 *
 * @class PlayerProfilePage
 * @constructor
 */
export class PlayerProfilePage {
  // Fields declared for TypeScript (Phase 2 was a straight conversion; real
  // typing is deferred — see .claude/plans/wxt-migration-followups.md).
  _profile: any;
  _radarBox: any;
  /**
   *
   */
  constructor(boxRadar) {
    /**
     * builds the profile model
     */
    this._profile = null;
    /**
     * access to the radar box
     */
    this._radarBox = boxRadar;
  }
  /**
   *
   */
  run() {
    // The selector is scoped to `center > h2` because the "Toolzzz mis à jour"
    // toast also uses an <h2> (jquery-toast's `.jq-toast-heading`); a global
    // `$("h2")` would concatenate it with the page's nickname and corrupt the
    // watch key in `_players`.
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
    // looking at someone else's profile
    if (!this._profile.isCurrentPlayer()) {
      // without ComptePlus, show the travel time
      !Utils.comptePlus && this.plus();
      // show the live return time
      $(".boite_membre:first div:first table").append(
        `<tr><td class='right'>Retour le :</td><td id='o_tempsRetour'>${moment().add(getProfile().getTravelTimeTo(this._profile), "s").format("D MMM à HH[h]mm[m]ss[s]")}</td></tr><tr><td class='right'>Rapport :</td><td id='o_tempsRetourRapport'>${Utils.roundMinute(getProfile().getTravelTimeTo(this._profile)).format("D MMM à HH[h]mm")}</td></tr>`,
      );
      Utils.incrementTime(
        getProfile().getTravelTimeTo(this._profile),
        "o_tempsRetour",
        "o_tempsRetourRapport",
      );
    }

    // Adds the "watch on the radar" option plus a link to AntLeaks
    // (https://antleaks.guics.st) with the nickname in the path — a community
    // tool for browsing a Fourmizzz player's public history. s4 only: AntLeaks
    // indexes no other server.
    let antleaksUrl = `https://antleaks.guics.st/player/${encodeURIComponent(this._profile.pseudo)}`;
    $(".boite_membre:eq(1) table tr td:eq(0)").append(
      `${Utils.comptePlus ? "<br/>" : ""}- <span id='o_surveiller' class='cursor gras'>${this._radarBox.joueurs.hasOwnProperty(this._profile.pseudo) ? "Supprimer la surveillance" : "Surveiller ce joueur"}</span>${Utils.antleaksAvailable ? `<br/>- <a class='gras' href='${antleaksUrl}' target='_blank' rel='noopener'>Voir sur AntLeaks</a>` : ""}`,
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
    // show the travel time
    $(".boite_membre:first div:first table").append(
      `<tr><td style='text-align:right'>Temps de trajet :</td><td>${Utils.intToTime(getProfile().getTravelTimeTo(this._profile))}</td></tr>`,
    );
    return this;
  }
}
