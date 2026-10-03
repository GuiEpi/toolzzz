/*
 * Messages.ts
 * Hraesvelg
 **********************************************************************/

import { $, Clipboard } from "~/vendor";
import {
  IMG_COPY,
  PLACE,
  SMILEYS_1,
  SMILEYS_2,
  SMILEYS_3,
  SMILEYS_4,
  SMILEYS_5,
  SMILEYS_6,
  TOAST_ERROR,
  TOAST_SUCCESS,
} from "~/constants";
import { Utils } from "~/lib/Utils";
import { getProfile } from "~/models/currentPlayer";
import { Hunt } from "~/models/Hunt";
import { Battle } from "~/models/Battle";
import { ForumPage } from "~/pages/Forum";

/**
 * Enriches the /messagerie.php page.
 *
 * @class MessagesPage
 * @constructor
 */
export class MessagesPage {
  // Fields declared for TypeScript (Phase 2 was a straight conversion; real
  // typing is deferred — see .claude/plans/wxt-migration-followups.md).
  _messagesOuvert: any;
  _tools: any;
  constructor() {
    /**
     * the analysed messages
     */
    this._messagesOuvert = {};
    /**
     * connection to the alliance tools
     */
    this._tools = new ForumPage();
  }
  /**
   *
   */
  run() {
    // add the buttons to the new messages
    if (!Utils.comptePlus) this.plus(0);
    // read the players from the alliance tools
    if (getProfile().parametre["forumMembre"].valeur) {
      // read the orders from the alliance tools
      this._tools.viewSection(getProfile().parametre["forumMembre"].valeur).then(
        (data) => {
          if (this._tools.loadPlayer(data)) this.toolsMessageColor();
        },
        (jqXHR, textStatus, errorThrown) => {
          $.toast({
            ...TOAST_ERROR,
            text: "Une erreur réseau a été rencontrée lors de la récupération des membres.",
          });
        },
      );
    } else this.messageColor();
    // event fired when new elements are displayed
    this.analyzeMessage();
    return this;
  }
  /**
   *
   */
  analyzeMessage() {
    // listener for opening battle or hunt reports
    $("#corps_messagerie").on("DOMNodeInserted", (e) => {
      // opening the message for the first time
      if ($(e.target).hasClass("contenu_conversation")) {
        // Chrome fix
        $(".message").removeAttr("colspan");
        let titleMess = $(e.target).prev().prev().find(".td_objet").text();
        // hunt reports
        if (titleMess.includes("chasseuses ont conquis")) {
          let conv = $(e.target).prev().prev().attr("id").split("_")[1];
          $(e.target)
            .find(".message")
            .each((i, elt) => {
              this.analyzeHunt(conv, $(elt).parent().attr("id"), $(elt).text());
            });
          // a summary is only shown for more than one hunt
          if ($(e.target).find(".message").length > 1) this.analyzeHunts(conv);
          // battle reports
        } else if (
          titleMess.includes("Attaque réussie") ||
          titleMess.includes("Attaque échouée") ||
          titleMess.includes("Invasion") ||
          titleMess.includes("Rebellion")
        ) {
          $(e.target)
            .find(".message")
            .each((i, elt) => {
              this.analyzeBattle($(elt).parent().attr("id"), $(elt).prev().text(), $(elt).text());
            });
          this.optionMessage($(e.target).find(".message:first").parent().attr("id"));
        }
        // add the formatting tags for writing messages
        if ($(e.target).find("div[id^='champ_bbcode_']").length && !Utils.comptePlus)
          this.plus($(e.target).find("div[id^='champ_bbcode_']").attr("id").match(/\d+$/));
      }
      // showing more messages
      else if ($(e.target).attr("id") && $(e.target).attr("id").includes("message_")) {
        // showing more messages d'un rapport de chasse
        if (
          $(e.target)
            .closest(".contenu_conversation")
            .prev()
            .prev()
            .find(".td_objet")
            .text()
            .includes("chasseuses ont conquis")
        ) {
          let conv = $(e.target).parents().eq(3).prevAll().eq(1).attr("id").split("_")[1];
          this.analyzeHunt(
            conv,
            $(e.target).find(".message").parent().attr("id"),
            $(e.target).find(".message").text(),
          ).analyzeHunts(conv);
        }
      }
      if ($(e.target).attr("id") && $(e.target).attr("id").includes("liste_conversations"))
        this.messageColor();
    });
  }
  /**
   *
   */
  plus(id) {
    let champsReponse = id != 0 ? "champ_reponse_" + id : "message_envoi";
    $("#smileySuivant" + id).after(` <span style='cursor:pointer;position:relative;top:3px;'>
            <span style="position:relative;top:-4px"><input id="o_colorMess${champsReponse}" type="color" name="couleur" value="${getProfile().parametre["couleurMessagerie"].valeur}"/></span>
            <img onclick='miseEnForme("${champsReponse}","gras");' title='Gras' src='images/BBCode/bold.png'>
            <img onclick='miseEnForme("${champsReponse}","italic");' title='Italique' src='images/BBCode/italic.png'>
            <img onclick='miseEnForme("${champsReponse}","souligne");' title='Souligné' src='images/BBCode/underline.png'>
            <img onclick='miseEnForme("${champsReponse}","img");' title='Image' src='images/BBCode/picture.png'>
            <img onclick='miseEnForme("${champsReponse}","url");' title='Lien' src='images/BBCode/link.png'>
            <img onclick='miseEnForme("${champsReponse}","player");' title='Pseudo' src='images/BBCode/membre.gif' height='15'>
            <img onclick='miseEnForme("${champsReponse}","ally");' title='Alliance' src='images/BBCode/groupe.gif' height='15'>
            </span>`);
    // colour-change events
    $("#o_colorMess" + champsReponse).change((e) => {
      let color = e.currentTarget.value;
      $(this).val(color.substring(1));
      getProfile().parametre["couleurMessagerie"].valeur = color;
      getProfile().parametre["couleurMessagerie"].save();
    });
    $(`#${id != 0 ? "repondre_tous_" + id : "bt_envoi_message"}`).click((e) => {
      let color = $("#o_colorMess" + champsReponse).val(),
        idChamps = `#${id != 0 ? "champ_reponse_" + id : "message_envoi"}`;
      if (color != "#000000")
        $(idChamps).val("[color=" + color + "]" + $(idChamps).val() + "[/color]");
    });
    // add the smileys
    $("#listeSmiley2" + id).html(SMILEYS_1.replace(/message/g, champsReponse));
    $("#listeSmiley3" + id).html(SMILEYS_2.replace(/message/g, champsReponse));
    $("#listeSmiley4" + id).html(SMILEYS_3.replace(/message/g, champsReponse));
    $("#listeSmiley5" + id).html(SMILEYS_4.replace(/message/g, champsReponse));
    $("#listeSmiley6" + id).html(SMILEYS_5.replace(/message/g, champsReponse));
    $("#listeSmiley7" + id).html(SMILEYS_6.replace(/message/g, champsReponse));
    // events to pick a smiley list
    if (id != 0) {
      if ($("#tousLesSmiley" + id).find("div:visible").length)
        $("#smileySuivant" + id + ", #smileyPrecedent" + id).toggle();
      $("#smileySuivant" + id)
        .prev()
        .click((e) => {
          $("#smileySuivant" + id + ", #smileyPrecedent" + id).toggle();
        });
    }
    // event for the previous list
    $("#smileyPrecedent" + id)
      .html(`<img title='Précédent' class='cursor' src='images/bouton/fleche-champs-gauche.gif'/>`)
      .removeAttr("onclick")
      .click((e) => {
        let div = $("#tousLesSmiley" + id + " div:visible");
        div.hide();
        div.prev().length ? div.prev().show() : $("#tousLesSmiley" + id + " div:last").show();
      });
    // event for the next list
    $("#smileySuivant" + id)
      .html(`<img title='Suivant' class='cursor' src='images/bouton/fleche-champs-droite.gif'/>`)
      .removeAttr("onclick")
      .click((e) => {
        let div = $("#tousLesSmiley" + id + " div:visible");
        div.hide();
        div.next().length ? div.next().show() : $("#tousLesSmiley" + id + " div:first").show();
      });
    return this;
  }
  /**
   *
   */
  analyzeBattle(id, dateHour, message) {
    let id_mess = id.split("_")[1],
      battle = new Battle({ id: id_mess, dateHeure: dateHour, RC: message });
    let simulation = message.includes("Vos troupes ont échoué")
      ? ` <span id="o_simuler_${id_mess}">Simuler</span>`
      : "";
    // preparation de l'analyse
    battle.analyze();
    // show the options
    $("#" + id + " td:eq(1)").append(
      `<p class="o_optionMessage gras cursor"><span id="show_info_${id_mess}">+</span>${simulation}</p><div id="o_analyse_${id_mess}" class="info_supp separateur_messages_meme_expe" style="display:none">${battle.toMessagesHtml()}</div>`,
    );
    $("#show_info_" + id_mess).click((e) => {
      $(e.currentTarget)
        .text($(e.currentTarget).text() == "+" ? "-" : "+")
        .parent()
        .next()
        .toggle("blind", 400);
    });
    $("#o_simuler_" + id_mess).click((e) => {
      // open the battle box on the simulation tab
      $("#o_itemCombat").parent().click();
      $("#o_tabsCombat").tabs("option", "active", 1);
      // autocomplete the enemy units
      for (let i = 0; i < 14; i++)
        $("input[name='o_unite2_" + (i + 1) + "']").spinner("value", battle.armee2Ap.unite[i]);
      // defending in the report autocompletes the attacker's data, and vice versa
      if (battle.position == 1) {
        $("#o_armes2").spinner("value", battle.attaquant.niveauRecherche[2]);
        $("#o_bouclier2").spinner(
          "value",
          battle.attaquant.niveauRecherche[1] != -1 ? battle.attaquant.niveauRecherche[1] : 0,
        );
      } else {
        $("#o_armes2").spinner("value", battle.defenseur.niveauRecherche[2]);
        $("#o_bouclier2").spinner(
          "value",
          battle.defenseur.niveauRecherche[1] != -1 ? battle.defenseur.niveauRecherche[1] : 0,
        );
        if (battle.place == PLACE.DOME) {
          $("#o_dome").prop("checked", true);
          if (battle.bonusDefenseur.length) {
            $("#o_bouclier2").spinner("value", battle.bonusDefenseur[0].split("/")[0]);
            $("#o_domeNiveau").spinner("value", battle.bonusDefenseur[0].split("/")[1]);
            $("#o_logeNiveau").spinner("value", 0);
          }
        }
        if (battle.place == PLACE.LOGE) {
          $("#o_loge").prop("checked", true);
          if (battle.bonusDefenseur.length) {
            $("#o_bouclier2").spinner("value", battle.bonusDefenseur[0].split("/")[0]);
            $("#o_logeNiveau").spinner("value", battle.bonusDefenseur[0].split("/")[1]);
            $("#o_domeNiveau").spinner("value", 0);
          }
        }
      }
      return false;
    });
    return this;
  }
  /**
   *
   */
  analyzeHunt(id_conv, id, message) {
    let id_mess = id.split("_")[1];
    if (!this._messagesOuvert.hasOwnProperty(id_mess)) {
      let hunt = new Hunt(message);
      hunt.analyze();
      $("#" + id + " td:eq(1)").append(
        `<p id="show_info_${id_mess}" class="gras cursor">+</p><div id="o_analyse_${id_mess}" class="info_supp separateur_messages_meme_expe" style="display:none">${hunt.toMessagesHtml()}</div>`,
      );
      $("#show_info_" + id_mess).click((e) => {
        $(e.currentTarget)
          .text($(e.currentTarget).text() == "+" ? "-" : "+")
          .next()
          .toggle("blind", 400);
      });
      // add the hunt to the analysed ones
      this._messagesOuvert[id_mess] = hunt;
      // add the hunt to the summary
      this._messagesOuvert["conv_" + id_conv] = this._messagesOuvert.hasOwnProperty(
        "conv_" + id_conv,
      )
        ? this._messagesOuvert["conv_" + id_conv].add(hunt)
        : hunt;
    }
    return this;
  }
  /**
   *
   */
  analyzeHunts(id_conv) {
    if (!$("#o_bilan_" + id_conv).length) {
      $("#conversation_" + id_conv)
        .next()
        .next()
        .find(".message:last")
        .append(
          `<p id="show_bilan_${id_conv}" class="gras cursor souligne">Bilan</p><div id="o_bilan_${id_conv}" class="info_supp separateur_messages_meme_expe" style="display:none">${this._messagesOuvert["conv_" + id_conv].toMessagesHtml()}</div>`,
        );
      $("#show_bilan_" + id_conv).click((e) => {
        $(e.currentTarget).next().toggle("blind", 400);
      });
    } else $("#o_bilan_" + id_conv).html(this._messagesOuvert["conv_" + id_conv].toMessagesHtml());
  }
  /**
   *
   */
  optionMessage(id_conv) {
    $("#" + id_conv + " td:eq(0)").append(`<div class="cursor_copy o_group_bouton_mess">
            <img id="copier_${id_conv}" src="${IMG_COPY}" height="16" alt="copy" title="copier dans le presse papier"/></span>
            <span id="copier_plus_${id_conv}"><img class="afficher_plus" src="images/icone/more_options.gif" title="Afficher les options" width="10" style="position:relative; top:-4px; margin-left:8px;"/>
            <div id="choix_supp_${id_conv}" class="choix_supplementaires_option" style="z-index: 3;display: none;">
                <div id="copier_hof_${id_conv}" class="choix_option option_deplacement" style="border-bottom:1px solid #B99D53;">
                    <span class="intitule_choix">Copier avec Temps HOF</span>
                </div>
                <div id="copier_bonus_${id_conv}" class="choix_option option_deplacement" style="border-bottom:1px solid #B99D53;">
                    <span class="intitule_choix">Copier avec Bonus</span>
                </div>
                <div id="copier_hof_bonus_${id_conv}" class="choix_option option_deplacement" style="border-bottom:1px solid #B99D53;">
                    <span class="intitule_choix">Copier avec Temps HOF + Bonus</span>
                </div>
			</div></div>`);
    // extra menu actions
    $("#copier_plus_" + id_conv).click((e) => {
      $("#choix_supp_" + id_conv).toggle();
    });
    // action bouton principale
    let messDefaut = new Clipboard("#copier_" + id_conv, {
      text: () => {
        return this.formatMessage(id_conv);
      },
    });
    messDefaut.on("success", (e) => {
      $.toast({
        ...TOAST_SUCCESS,
        text: "Le rapport a été correctement copié dans le presse papier.",
      });
    });
    messDefaut.on("error", (e) => {
      $.toast({ ...TOAST_ERROR, text: "Une erreur a été rencontrée, la copie a échoué." });
    });
    // action bouton supplementaire
    let messHOF = new Clipboard("#copier_hof_" + id_conv, {
      text: () => {
        return this.formatMessage(id_conv, true);
      },
    });
    messHOF.on("success", (e) => {
      $.toast({
        ...TOAST_SUCCESS,
        text: "Le rapport a été correctement copié dans le presse papier.",
      });
    });
    messHOF.on("error", (e) => {
      $.toast({ ...TOAST_ERROR, text: "Une erreur a été rencontrée, la copie a échoué." });
    });
    let messBonus = new Clipboard("#copier_bonus_" + id_conv, {
      text: () => {
        return this.formatMessage(id_conv, false, true);
      },
    });
    messBonus.on("success", (e) => {
      $.toast({
        ...TOAST_SUCCESS,
        text: "Le rapport a été correctement copié dans le presse papier.",
      });
    });
    messBonus.on("error", (e) => {
      $.toast({ ...TOAST_ERROR, text: "Une erreur a été rencontrée, la copie a échoué." });
    });
    let messHOFBonus = new Clipboard("#copier_hof_bonus_" + id_conv, {
      text: () => {
        return this.formatMessage(id_conv, true, true);
      },
    });
    messHOFBonus.on("success", (e) => {
      $.toast({
        ...TOAST_SUCCESS,
        text: "Le rapport a été correctement copié dans le presse papier.",
      });
    });
    messHOFBonus.on("error", (e) => {
      $.toast({ ...TOAST_ERROR, text: "Une erreur a été rencontrée, la copie a échoué." });
    });
  }
  /**
   * Colour-codes the messages by default.
   */
  messageColor() {
    $("tr[id^='conversation_']").each((i, elt) => {
      let titre = $(elt).find("td:eq(3) .intitule_message").text();
      if (
        titre.includes("Colonie perdue") ||
        titre.includes("conquis par") ||
        titre.includes("Vol par") ||
        titre.includes("Invasion") ||
        titre.includes("Attaque échouée contre") ||
        titre.includes("Rebellion échouée")
      )
        $(elt).find("td:eq(3)").children().addClass("red");
      if (
        titre.includes("Colonie conquise") ||
        titre.includes("Butin chez") ||
        titre.includes("Attaque réussie contre") ||
        titre.includes("Rebellion réussie")
      )
        $(elt).find("td:eq(3)").children().addClass("green");
    });
    return this;
  }
  /**
   *
   */
  toolsMessageColor() {
    $("tr[id^='conversation_']").each((i, elt) => {
      let titre = $(elt).find("td:eq(3) .intitule_message").text(),
        color = "";
      // a lost colony is always red
      // game text: "Attaque échouée contre xXx : votre armée..."
      if (
        titre.includes("Colonie perdue") ||
        titre.includes("conquis par") ||
        titre.includes("Attaque échouée contre") ||
        titre.includes("Rebellion échouée")
      )
        color = "red";
      // a conquered colony is always green
      // Butin chez Verratti : ...
      // game text: "Attaque réussie contre xXx : votre armée..."
      else if (
        titre.includes("Colonie conquise") ||
        titre.includes("Butin chez") ||
        titre.includes("Attaque réussie contre") ||
        titre.includes("Rebellion réussie")
      )
        color = "green";
      // Vol par XxX : .
      // game text: "Invasion de xXx: votre armée"
      else if (titre.includes("Vol par") || titre.includes("Invasion"))
        color = this._tools.alliance.joueurs.hasOwnProperty(titre.split(" ")[2]) ? "green" : "red";
      if (color) $(elt).find("td:eq(3)").children().addClass(color);
    });
    return this;
  }
  /**
   *
   */
  formatMessage(id_conv, hof = false, bonus = false) {
    let html = ``;
    // for every message of the conversation (terrain + dome + lodge attacks, say)
    $("#" + id_conv)
      .parent()
      .find("tr[id^='message_']")
      .each((i, elt) => {
        let message = $(elt).find(".message").clone(),
          pseudo = "",
          army = "",
          id = $(elt).attr("id").split("_")[1];
        // turn the <br> into line breaks
        message.find("br").replaceWith("\n");
        // drop the plus/minus
        let detail = $("div[id^='o_analyse']", message).remove();
        // drop the analysis
        $(".o_optionMessage", message).remove();
        // highlight the enemy according to the report
        let texte = message.text();
        if (texte.includes("Vous attaquez")) {
          pseudo = texte.split("e de ")[1].split("\nTroupes")[0].split(",")[0];
          // bold the army
          texte = texte.replace("Troupes en défense : ", "Troupes en défense : [b]");
          texte = texte.replace("Vous infligez", "[/b]Vous infligez");
        } else {
          pseudo = texte.split(" attaque")[0];
          // bold the army
          texte = texte.replace("Troupes en attaque : ", "Troupes en attaque : [b]");
          texte = texte.replace("Troupes en défense : ", "[/b]Troupes en défense : ");
        }
        // link the player
        texte = texte.replace(pseudo, "[player]" + pseudo + "[/player]");
        // bold the place
        texte = texte
          .replace(/Terrain de Chasse/gi, "[b]Terrain de Chasse[/b]")
          .replace(/fourmilière/gi, "[b]fourmilière[/b]")
          .replace(/Loge Impériale/gi, "[b]Loge Impériale[/b]");
        // add the report's time
        html += "[b]" + $(elt).find(".expe span > span").text() + "[/b] " + texte + "\n";
        // when the HOF time is wanted
        if (hof)
          html += `Perte ${getProfile().pseudo} : ${detail.find("#temps_hof_vous_" + id).text()}\nPerte ${pseudo} : ${detail.find("#temps_hof_ennemie_" + id).text()}\nPerte totale : ${detail.find("#temps_hof_total_" + id).text()}\n\n`;
        // when the bonuses are wanted
        if (bonus) html += `${detail.find("#bonus_ennemie_" + id).text()}\n`;
      });
    return html;
  }
}
