/*
 * Chat.ts
 * Hraesvelg
 **********************************************************************/

import { $ } from "~/vendor";
import {
  SMILEYS_1,
  SMILEYS_2,
  SMILEYS_3,
  SMILEYS_4,
  SMILEYS_5,
  SMILEYS_6,
  TOAST_ERROR,
} from "~/constants";
import { Utils } from "~/lib/Utils";
import { getProfile } from "~/models/currentPlayer";

/**
 * Enriches the chat pages.
 *
 * @class ChatPage
 * @constructor
 */
export class ChatPage {
  // Fields declared for TypeScript (Phase 2 was a straight conversion; real
  // typing is deferred — see .claude/plans/wxt-migration-followups.md).
  _timeoutChat: any;
  constructor() {
    /**
     * auto-refresh counter
     */
    this._timeoutChat = -1;
  }
  /**
   *
   */
  run() {
    // extra features
    if (!Utils.comptePlus) this.plus();
    // text colour
    this.color();
    // Reaffichage message
    this.showMessage();
    // tweak the form submission
    $("#message").on("keypress", (e) => {
      let code = e.keyCode || e.which;
      if (code == 13) this.parseMessage();
    });
    $("input[name='Envoyer']").click((e) => {
      this.parseMessage();
    });
    return this;
  }
  /**
   * Changes how messages read: "Pseudo (datetime) :" instead of "datetime pseudo :"
   *
   * @private
   * @method showMessage
   */
  showMessage() {
    // add the quote button to the older messages
    $("#anciensMessages p, #nouveauxMessages p").each((i, elt) => {
      $(elt).html((i, html) => {
        let nth = 0;
        return html.replace(/:/g, (match, j) => {
          nth++;
          return nth == 3
            ? ` <span id="o_cite${$(elt).attr("id")}" class="reduce souligne cursor">citer</span> :`
            : match;
        });
      });
    });
    // events on the older messages
    $("span[id^='o_cite']").click((e) => {
      let texte = this.quoteMessage(e);
      texte.length && $("#message").val(`[i]${texte}[/i] // `).focus();
    });
    // add the quote button to the new messages
    $("#nouveauxMessages").on("DOMNodeInserted", (e) => {
      let element = $(e.target);
      if (element.is("p") && !element.hasClass("o_parsed")) {
        $(element).addClass("o_parsed");
        element.html((i, html) => {
          let nth = 0;
          return html.replace(/:/g, (match, i) => {
            nth++;
            return nth == 3
              ? ` <span id="o_cite${element.attr("id")}" class="reduce souligne cursor">citer</span> :`
              : match;
          });
        });
        $(`#o_cite${element.attr("id")}`).click((e) => {
          let texte = this.quoteMessage(e);
          texte.length && $("#message").val(`[i]${texte}[/i] // `).focus();
        });
      }
    });
    // event for when a refresh turns new messages into old ones
    $("#anciensMessages").on("DOMNodeInserted", (e) => {
      $("span[id^='o_cite']")
        .off()
        .click((e) => {
          let texte = this.quoteMessage(e);
          texte.length && $("#message").val(`[i]${texte}[/i] // `).focus();
        });
    });
    return this;
  }
  /**
   *
   */
  getMessage() {
    return $.ajax({
      url: "appelAjax.php",
      data:
        "actualiserChat=" +
        ($(".titre:first").text().includes("Alliance") ? "alliance" : "general"),
    });
  }
  /**
   * Adds the colour and the chat options.
   *
   * @private
   * @method plus
   */
  plus() {
    // ajout de l'auto actualisation
    $("#actualiser").after(
      " --- <label><input id='o_autoActualiser' type='checkbox' name='autoActualiser'/>auto</label> ",
    );
    $("#o_autoActualiser").change(() => {
      if ($("#o_autoActualiser").prop("checked")) this.refreshMessage();
      else clearTimeout(this._timeoutChat);
    });
    // add the formatting buttons
    $("#formulaireChat")
      .append(`<div class='o_group_bouton o_group_bouton_chat'><span id='o_msgUp' class='option_gestion'>aA</span><span id='o_msgDown' class='option_gestion'>Aa</span></div>
            <div class='o_group_bouton o_group_bouton_chat'><span id='o_msgB' class='option_gestion gras' onclick="miseEnForme('message','gras');">B</span><span id='o_msgI' class='option_gestion' onclick="miseEnForme('message','italic');"><em>I</em></span><span id='o_msgU' class='option_gestion' onclick="miseEnForme('message','souligne');" style='text-decoration:underline'>U</span></div>
            <div class='o_group_bouton o_group_bouton_chat'><span id='o_msgImg' class='option_gestion' onclick="miseEnForme('message','img');"><img height='12' src='images/BBCode/picture.png' title='Image' /></span><span id='o_msgLink' class='option_gestion' class='btn' onclick="miseEnForme('message','url');"><img height='12' src='images/BBCode/link.png' title='Lien' /></span><span id='o_msgPlay' class='option_gestion' onclick="miseEnForme('message','player');"><img height='12' src='images/BBCode/membre.gif' title='Pseudo'/></span><span id='o_msgAlly' class='option_gestion' onclick="miseEnForme('message','ally');"><img height='12' src='images/BBCode/groupe.gif' title='Alliance'/></span></div>`);
    $(".o_group_bouton span").css("background-color", getProfile().couleur1);

    $("#o_msgUp").click((e) => {
      e.preventDefault();
      $("#message").val("[size=4]" + $("#message").val() + "[/size]");
      $("#message")[0].selectionStart += 8;
      $("#message")[0].selectionEnd -= 7;
      $("#message").focus();
    });
    $("#o_msgDown").click((e) => {
      e.preventDefault();
      $("#message").val("[size=2]" + $("#message").val() + "[/size]");
      $("#message")[0].selectionStart += 8;
      $("#message")[0].selectionEnd -= 7;
      $("#message").focus();
    });
    $("#o_msgB, #o_msgI, #o_msgU, #o_msgImg, #o_msgLink, #o_msgPlay, #o_msgAlly").click((e) => {
      e.preventDefault();
    });
    // add the smileys
    $("#listeSmiley20").html(SMILEYS_1);
    $("#listeSmiley30").html(SMILEYS_2);
    $("#listeSmiley40").html(SMILEYS_3);
    $("#listeSmiley50").html(SMILEYS_4);
    $("#listeSmiley60").html(SMILEYS_5);
    $("#listeSmiley70").html(SMILEYS_6);
  }
  /**
   *
   */
  refreshMessage(countTurn = 40) {
    if (countTurn) {
      this.getMessage().then(
        (data) => {
          $("#anciensMessages").prepend($("#nouveauxMessages").html());
          $("#nouveauxMessages").html(data.message);
          $("#NonLuMess").html(data.NonLuMess);
          $("#NonLuRapComb").html(data.NonLuRapComb);
          $("#NonLuRapChass").html(data.NonLuRapChass);
        },
        (jqXHR, textStatus, errorThrown) => {
          $.toast({ ...TOAST_ERROR, text: "Mise à jour des messages impossible." });
        },
      );
      this._timeoutChat = setTimeout(() => {
        this.refreshMessage(--countTurn);
      }, 5000);
    } else $("#o_autoActualiser").prop("checked", false);
    return this;
  }
  /**
   *
   */
  quoteMessage(e) {
    let clone = $(e.currentTarget).parent().clone();
    $("span", clone).remove();
    let texte = clone.text();
    if (texte.length > 80) texte = texte.substring(0, 80) + "...";
    return texte;
  }
  /**
   * Parses the message to turn smileys into their bbcode.
   *
   * @private
   * @method parseMessage
   */
  parseMessage() {
    let color = $("#inputCouleur").val();
    if (color != "000000" && color != "0000000")
      $("#message").val("[color=#" + color + "]" + $("#message").val() + "[/color]");
    return this;
  }
  /**
   * Adds or updates the colour picker.
   *
   * @private
   * @method color
   */
  color() {
    $("#inputCouleur").val(getProfile().parametre["couleurChat"].valeur.substring(1));
    $("#boutonCouleur").remove();
    $("#smileySuivant0").after(
      `<span><input id='color' type='color' name='couleur' value='${getProfile().parametre["couleurChat"].valeur}'/></span>`,
    );
    $("#color").change((e) => {
      let color = e.currentTarget.value;
      $("#inputCouleur").val(color.substring(1));
      getProfile().parametre["couleurChat"].valeur = color;
      getProfile().parametre["couleurChat"].save();
    });
  }
  /**
   * Adds the basic smileys for free accounts.
   *
   * @private
   * @method emoticone
   */
}
