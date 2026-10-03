/*
 * Forum.ts
 * Hraesvelg
 **********************************************************************/

import { $, moment } from "~/vendor";
import {
  ORDER_STATUS,
  IMG_CHANGE,
  IMG_TOOLZZZ,
  TOAST_ERROR,
  TOAST_SUCCESS,
  TOAST_WARNING,
} from "~/constants";
import { Utils } from "~/lib/Utils";
import { getProfile } from "~/models/currentPlayer";
import { Alliance } from "~/models/Alliance";
import { Order } from "~/models/Order";

/**
 * Names of the hidden alliance-forum sections used as shared storage. The order
 * is the read priority: the Toolzzz name is tried first, then the older Outiiil
 * one for alliances that set their forum up in the Outiiil v2 days (or with a
 * pre-3.x Toolzzz).
 *
 * At creation time ("Préparer le forum pour un SDC") only the new name is
 * written, and only when neither already exists, so an alliance that inherited
 * the old sections does not end up with duplicates.
 */
const FORUM_SECTION_ORDERS = ["Toolzzz_Commande", "Outiiil_Commande"];
const FORUM_SECTION_MEMBERS = ["Toolzzz_Membre", "Outiiil_Membre"];

/**
 * Enriches the /alliance.php?forum_menu page.
 *
 * @class ForumPage
 * @constructor
 */
export class ForumPage {
  // Fields declared for TypeScript (Phase 2 was a straight conversion; real
  // typing is deferred — see .claude/plans/wxt-migration-followups.md).
  _order: any;
  _monAlliance: any;
  constructor() {
    /**
     * list of orders
     */
    this._order = {};
    /**
     * list of players
     */
    this._monAlliance = null;
  }
  /**
   *
   */
  get commande() {
    return this._order;
  }
  /*
   *
   */
  set commande(newOrder) {
    this._order = newOrder;
  }
  /*
   *
   */
  get alliance() {
    return this._monAlliance;
  }
  /*
   *
   */
  set alliance(newAlliance) {
    this._monAlliance = newAlliance;
  }
  /**
   *
   */
  createSection(nameSection) {
    return $.ajax({
      type: "post",
      url: location.origin + "/alliance.php?forum_menu",
      data: {
        xajax: "ajoutCategorie",
        "xajaxargs[]": `<xjxquery><q>nom=${nameSection}</q></xjxquery>`,
        xajaxr: moment().valueOf(),
      },
    });
  }
  /**
   *
   */
  editSection(nameSection, id, categorie) {
    return $.ajax({
      type: "post",
      url: location.origin + "/alliance.php?forum_menu",
      data: {
        xajax: "renommerCategorie",
        "xajaxargs[]": `<xjxquery><q>nom=${nameSection}&type=${categorie}&ID_cat=${id}&del=Supprimer</q></xjxquery>`,
        xajaxr: moment().valueOf(),
      },
    });
  }
  /**
   *
   */
  viewSection(id) {
    return $.ajax({
      type: "post",
      url: location.origin + "/alliance.php?forum_menu",
      data: {
        xajax: "callGetForum",
        "xajaxargs[]": id,
        xajaxr: moment().valueOf(),
      },
    });
  }
  /**
   *
   */
  createTopic(nameTopic, contenu, id, type = "normal") {
    return $.ajax({
      type: "post",
      url: location.origin + "/alliance.php?forum_menu",
      data: {
        xajax: "envoiNouveauSujet",
        "xajaxargs[]": `<xjxquery><q>cat=${id}&sujet=${nameTopic}&message=${encodeURIComponent(contenu)}&type=${type}&modifiable=envoyer&send=Envoyer&question=&reponse[]=&reponse[]=&reponse[]=</q></xjxquery>`,
        xajaxr: moment().valueOf(),
      },
    });
  }
  /**
   *
   */
  editTopic(nameTopic, contenu, id) {
    return $.ajax({
      type: "post",
      url: location.origin + "/alliance.php?forum_menu",
      data: {
        xajax: "envoiEditTopic",
        "xajaxargs[]": `<xjxquery><q>IDTopic=${id}&sujet=${nameTopic}&message=${encodeURIComponent(contenu)}&modifiable=envoyer&send=Envoyer</q></xjxquery>`,
        xajaxr: moment().valueOf(),
      },
    });
  }
  /**
   *
   */
  viewTopic(id) {
    return $.ajax({
      type: "post",
      url: location.origin + "/alliance.php?forum_menu",
      data: {
        xajax: "callGetTopic",
        "xajaxargs[]": id,
        xajaxr: moment().valueOf(),
      },
    });
  }
  /**
   *
   */
  sendMessage(id, message) {
    return $.ajax({
      type: "post",
      url: location.origin + "/alliance.php?forum_menu",
      data: {
        xajax: "envoiNouveauMessage",
        "xajaxargs[]": `<xjxquery><q>topic=${id}&message=${message}&send=Envoyer</q></xjxquery>`,
        xajaxr: moment().valueOf(),
      },
    });
  }
  /**
   *
   */
  run() {
    let $alliance = $("#alliance");
    if (!$alliance.length) return this;
    // the forum is already loaded: process it
    if ($("#cat_forum").length) this.processSection("#alliance");
    // read the forum data used to communicate
    let observer = new MutationObserver((mutationsList) => {
      mutationsList.forEach((mutation) => {
        this.processSection(mutation.target);
      });
    });
    observer.observe($alliance[0], { childList: true });
    return this;
  }
  /**
   *
   */
  processSection(element) {
    // add the Toolzzz options
    if ($(element).find("div.simulateur").length) this.optionAdmin();
    // record the topic ids when the alliance tools are in use
    let $cmdSpan = ForumPage.findForumSection(element, FORUM_SECTION_ORDERS);
    if (!getProfile().parametre["forumCommande"].valeur && $cmdSpan.length) {
      getProfile().parametre["forumCommande"].valeur = $cmdSpan.attr("class").match(/\d+/)[0];
      getProfile().parametre["forumCommande"].save();
    }
    let $memSpan = ForumPage.findForumSection(element, FORUM_SECTION_MEMBERS);
    if (!getProfile().parametre["forumMembre"].valeur && $memSpan.length) {
      getProfile().parametre["forumMembre"].valeur = $memSpan.attr("class").match(/\d+/)[0];
      getProfile().parametre["forumMembre"].save();
    }
    // add the tools matching the ACTIVE section
    let actif = $(element).find("span[class^='forum'][class$='ligne_paire']").html();
    if (FORUM_SECTION_ORDERS.includes(actif)) {
      // make sure this is the topic list and not a topic itself
      if ($("#form_cat").length && !$("#o_afficherEtat").length) this.adminOrderOption();
    }
    return this;
  }
  /**
   * Finds the first forum section whose name is in `names`, in order. Returns
   * the jQuery `<span>`, empty when none matches.
   *
   * @static
   * @method findForumSection
   */
  static findForumSection(element, noms) {
    for (let nom of noms) {
      let $span = $(element).find(`span[class^='forum']:contains('${nom}')`);
      if ($span.length) return $span;
    }
    return $();
  }
  /**
   *
   */
  loadOrder(data) {
    let response = $(data).find("cmd:eq(1)").text();
    if (response.includes("Vous n'avez pas accès à ce forum."))
      $.toast({ ...TOAST_ERROR, text: "L'identifiant du sujet pour les commandes est érroné." });
    else {
      let order = null;
      $("<div/>")
        .append(response)
        .find("#form_cat tr:gt(0)")
        .each((i, elt) => {
          let titleTopic = $(elt).find("td:eq(1)").text().trim(),
            id = -1;
          // order rows have three tds and some content
          if (titleTopic) {
            id = $(elt).find("a.topic_forum").attr("onclick").match(/\d+/)[0];
            order = new Order();
            this._order[id] = order.parseToolsFormat(
              id,
              $(elt).next().find("a").text(),
              titleTopic.split("] ")[0].split("[")[1],
              titleTopic.split("] ")[1].split(" / "),
              $(elt)
                .find("td:last :not(a)")
                .contents()
                .filter(function () {
                  return this.nodeType === 3;
                })
                .text(),
            );
          }
        });
      return true;
    }
    return false;
  }
  /**
   *
   */
  loadPlayer(data) {
    let response = $(data).find("cmd:eq(1)").text();
    if (response.includes("Vous n'avez pas accès à ce forum."))
      $.toast({ ...TOAST_ERROR, text: "L'identifiant du sujet pour les membres est érroné." });
    else {
      let players = {};
      $("<div/>")
        .append(response)
        .find("#form_cat tr:gt(0)")
        .each((i, elt) => {
          let titleTopic = $(elt).find("td:eq(1)").text().trim(),
            id = $(elt).find("input[name='topic[]']").val();
          // order rows have three tds and some content
          if (titleTopic) {
            let infos = titleTopic.split(" / ");
            players[infos[0]] = {
              id: infos[1],
              pseudo: infos[0],
              x: infos[2],
              y: infos[3],
              sujetForum: id,
            };
            if (infos.length > 4) {
              players[infos[0]].rang = infos[4];
              players[infos[0]].ordreRang = infos[5];
            }
          }
        });
      this._monAlliance = new Alliance({ tag: Utils.alliance, joueurs: players });
      return true;
    }
    return false;
  }
  /**
   *
   */
  optionAdmin() {
    // only a leader can prepare the forum
    if ($("img[src='images/icone/outil.gif']").length && !$("#o_afficheMenuUtilitaire").length) {
      $("#cat_forum")
        .prepend(`<span id="o_afficheMenuUtilitaire" class="o_forumOption categorie_forum"><img src="${IMG_TOOLZZZ}" alt="toolzzz"/></span>
                <span id="o_menuUtilitaire" class="ligne_paire o_prepareUtilitaire">
                    <a href="#" id="o_creerUtilitaire">» Préparer le forum pour un SDC</a><br/>
                    <a href="#" id="o_preparerGuerre">» Préparer une section pour une guerre</a>
            </span>`);
      $("#o_afficheMenuUtilitaire").click((e) => {
        $("#o_menuUtilitaire").toggle();
        return false;
      });
      // add the input for picking the alliance tag
      $("#alliance .simulateur").append(
        `<div id="o_formGuerre" style="display:none;"><input id="o_tagGuerre" type="text"/> <button id="o_creerSectionGuerre">Créer section</button></div>`,
      );
      // Creation de l'utilitaire
      $("#o_creerUtilitaire").click((e) => {
        // The new Toolzzz section is only created when neither Toolzzz_* nor
        // Outiiil_* already exists, so storage is not duplicated in an alliance
        // that already has its sections under the old name.
        let cmdExiste = FORUM_SECTION_ORDERS.some(
          (n) => $(`#cat_forum span:contains(${n})`).length,
        );
        if (!cmdExiste) {
          let nameCmd = FORUM_SECTION_ORDERS[0];
          this.createSection(nameCmd).then(
            (data) => {
              let response = Utils.parseHtml(Utils.parseHtml(data).find("cmd:eq(1)").html() || "");
              let idCat = $(response)
                .find(`input[value='${nameCmd}']`)
                .parent()
                .attr("id")
                .match(/\d+/)[0];
              // a section cannot be created hidden, so it is hidden afterwards
              this.editSection(nameCmd, idCat, "cache").then(
                (data) => {
                  $.toast({
                    ...TOAST_SUCCESS,
                    text: "La section commande a été correctement créée.",
                  });
                },
                (jqXHR, textStatus, errorThrown) => {
                  $.toast({
                    ...TOAST_ERROR,
                    text: "Une erreur réseau a été rencontrée lors de la protection de la section commande.",
                  });
                },
              );
            },
            (jqXHR, textStatus, errorThrown) => {
              $.toast({
                ...TOAST_ERROR,
                text: "Une erreur réseau a été rencontrée lors de la création de la section commande.",
              });
            },
          );
        } else $.toast({ ...TOAST_WARNING, text: "Section commande est déjà créée !" });
        // create the member section for the alliance's members
        let memExiste = FORUM_SECTION_MEMBERS.some(
          (n) => $(`#cat_forum span:contains(${n})`).length,
        );
        if (!memExiste) {
          let nameMem = FORUM_SECTION_MEMBERS[0];
          this.createSection(nameMem).then(
            (data) => {
              let response = Utils.parseHtml(Utils.parseHtml(data).find("cmd:eq(1)").html() || "");
              let idCat = $(response)
                .find(`input[value='${nameMem}']`)
                .parent()
                .attr("id")
                .match(/\d+/)[0];
              // a section cannot be created hidden, so it is hidden afterwards
              this.editSection(nameMem, idCat, "cache").then(
                (data) => {
                  $.toast({
                    ...TOAST_SUCCESS,
                    text: "La section membre a été correctement créée.",
                  });
                },
                (jqXHR, textStatus, errorThrown) => {
                  $.toast({
                    ...TOAST_ERROR,
                    text: "Une erreur réseau a été rencontrée lors de la protection de la section membre.",
                  });
                },
              );
            },
            (jqXHR, textStatus, errorThrown) => {
              $.toast({
                ...TOAST_ERROR,
                text: "Une erreur réseau a été rencontrée lors de la création de la section membre.",
              });
            },
          );
        } else $.toast({ ...TOAST_WARNING, text: "Section membre est déjà créée !" });
        return false;
      });
      // war preparation
      $("#o_preparerGuerre").click((e) => {
        $("#o_formGuerre").toggle();
      });
      $("#o_tagGuerre")
        .autocomplete({
          source: (request, response) => {
            Alliance.search(request.term).then((data) => {
              response(Utils.extractResearch(data, false, true));
            });
          },
          position: { my: "left top-6", at: "left bottom" },
          delay: 0,
          minLength: 1,
          select: (e, ui) => {
            $("#o_tagGuerre").val(ui.item.tag);
            return false;
          },
        })
        .data("ui-autocomplete")._renderItem = (ul, item) => {
        let style = "";
        return $("<li>").append(`<a style="${style}">${item.value_avec_html}</a>`).appendTo(ul);
      };
      // events on the war button
      $("#o_creerSectionGuerre").click((e) => {
        let alliance = new Alliance({ tag: $("#o_tagGuerre").val() }),
          titleSection = "Guerre " + alliance.tag;
        if (
          !$("#cat_forum span[class^='forum']")
            .text()
            .toUpperCase()
            .includes(titleSection.toUpperCase())
        ) {
          // create the "Guerre " + tag section
          this.createSection(titleSection).then(
            (data) => {
              // read the section back to add the players' topics
              let response = Utils.parseHtml(Utils.parseHtml(data).find("cmd:eq(1)").html() || "");
              let idCat = $(response)
                .find(`input[value='${titleSection}']`)
                .parent()
                .attr("id")
                .match(/\d+/)[0];
              alliance.getDescription().then(
                (data) => {
                  // build the topic-creation calls
                  let promisePlayer = new Array();
                  $(data)
                    .find("#tabMembresAlliance tr:gt(0)")
                    .each((i, elt) => {
                      let pseudo = $(elt).find("td:eq(2)").text();
                      promisePlayer.push(
                        this.createTopic(pseudo, `[player]${pseudo}[/player]`, idCat),
                      );
                    });
                  // create the topics
                  Promise.all(promisePlayer).then((values) => {
                    location.reload();
                  });
                },
                (jqXHR, textStatus, errorThrown) => {
                  $.toast({
                    ...TOAST_ERROR,
                    text: "Une erreur réseau a été rencontrée lors de la récupération de la desciption.",
                  });
                },
              );
            },
            (jqXHR, textStatus, errorThrown) => {
              $.toast({
                ...TOAST_ERROR,
                text: "Une erreur réseau a été rencontrée lors de la création de la section guerre.",
              });
            },
          );
        } else
          $.toast({ ...TOAST_WARNING, text: `La section "Guerre ${alliance.tag}" existe déjà !` });
      });
    }
    return this;
  }
  /**
   *
   */
  adminOrderOption() {
    if ($("img[src='images/icone/outil.gif']").length) {
      let options = "";
      for (let status in ORDER_STATUS)
        options += `<option value="${ORDER_STATUS[status]}">${status}</option>`;
      $("#form_cat td:last")
        .prepend(
          `<img class="cursor" id="o_afficherEtat" src="${IMG_CHANGE}" height="16" alt="changer" title="Changer l'etat des commandes selectionnées"/>`,
        )
        .append(
          `<select id="o_selectEtatCommande" style="display:none;">${options}</select> <button id="o_changerEtat" style="display:none;">Modifier l'état</button>`,
        );
      $("#o_afficherEtat").click((e) => {
        $("#o_changerEtat, #o_selectEtatCommande").toggle();
      });
      $("#o_changerEtat").click((e) => {
        let promiseCmdModif = new Array();
        $("#form_cat tr:gt(0)").each((i, elt) => {
          // the order is selected
          if ($(elt).find("input[name='topic[]']:checked").length) {
            let titleTopic = $(elt).find("td:eq(1)").text().trim(),
              id = $(elt).find("input[name='topic[]']").val();
            if (titleTopic) {
              let order = new Order();
              order.parseToolsFormat(
                id,
                $(elt).next().find("a").text(),
                titleTopic.split("] ")[0].split("[")[1],
                titleTopic.split("] ")[1].split(" / "),
              );
              order.etat = $("#o_selectEtatCommande").val();
              promiseCmdModif.push(this.editTopic(order.toToolsFormat(), " ", id));
            }
          }
        });
        Promise.all(promiseCmdModif).then((values) => {
          $.toast({
            ...TOAST_SUCCESS,
            text:
              promiseCmdModif.length > 1
                ? "Commandes mises à jour avec succès."
                : "Commande mise à jour avec succès.",
          });
          location.reload();
        });
        return false;
      });
    }
    return this;
  }
}
