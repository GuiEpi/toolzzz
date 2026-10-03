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
 * Noms des sections cachées du forum d'alliance utilisées comme stockage
 * partagé. Ordre = priorité de lecture : on essaie le nom Toolzzz d'abord,
 * puis on retombe sur l'ancien Outiiil pour les alliances qui ont préparé
 * leur forum à l'époque d'Outiiil v2 (ou d'une version pré-3.x de Toolzzz).
 *
 * À la création (Préparer le forum pour un SDC), on n'écrit que le nouveau
 * nom — et seulement si aucun des deux n'existe déjà — pour éviter les
 * doublons dans une alliance qui a hérité des anciennes sections.
 */
const FORUM_SECTION_ORDERS = ["Toolzzz_Commande", "Outiiil_Commande"];
const FORUM_SECTION_MEMBERS = ["Toolzzz_Membre", "Outiiil_Membre"];

/**
 * Classe de fonction pour la page /alliance.php?forum_menu.
 *
 * @class PageForum
 * @constructor
 */
export class ForumPage {
  // Champs déclarés pour TypeScript (Phase 2 : conversion telle quelle, le
  // typage fin est reporté — cf. .claude/plans/wxt-migration-followups.md).
  _order: any;
  _monAlliance: any;
  constructor() {
    /**
     * liste des commandes.
     */
    this._order = {};
    /**
     * liste des joueurs.
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
      url: "http://" + Utils.serveur + ".fourmizzz.fr/alliance.php?forum_menu",
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
      url: "http://" + Utils.serveur + ".fourmizzz.fr/alliance.php?forum_menu",
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
      url: "http://" + Utils.serveur + ".fourmizzz.fr/alliance.php?forum_menu",
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
      url: "http://" + Utils.serveur + ".fourmizzz.fr/alliance.php?forum_menu",
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
      url: "http://" + Utils.serveur + ".fourmizzz.fr/alliance.php?forum_menu",
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
      url: "http://" + Utils.serveur + ".fourmizzz.fr/alliance.php?forum_menu",
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
      url: "http://" + Utils.serveur + ".fourmizzz.fr/alliance.php?forum_menu",
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
    // si le forum est deja chargé lance le traitement
    if ($("#cat_forum").length) this.processSection("#alliance");
    // Récupération des données du forum pour communiquer.
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
    // ajoute les options pour outiiil
    if ($(element).find("div.simulateur").length) this.optionAdmin();
    // on enregistre les id des topic si on utilise l'utilitaire
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
    // selon la section ACTIVE on ajoute les outils necessaires
    let actif = $(element).find("span[class^='forum'][class$='ligne_paire']").html();
    if (FORUM_SECTION_ORDERS.includes(actif)) {
      // on verifie si on n'est dans un sujet mais bien sur la liste des topics
      if ($("#form_cat").length && !$("#o_afficherEtat").length) this.adminOrderOption();
    }
    return this;
  }
  /**
   * Cherche la première section du forum dont le nom appartient à `noms`,
   * dans l'ordre. Renvoie le `<span>` jQuery (vide si aucune trouvée).
   *
   * @static
   * @method trouverSectionForum
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
          // les lignes des commandes ont 3 td et du contenu
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
          // les lignes des commandes ont 3 td et du contenu
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
    // il faut etre chef pour preparer le fofo
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
      // ajout de l'input pour la selection du tag alliance
      $("#alliance .simulateur").append(
        `<div id="o_formGuerre" style="display:none;"><input id="o_tagGuerre" type="text"/> <button id="o_creerSectionGuerre">Créer section</button></div>`,
      );
      // Creation de l'utilitaire
      $("#o_creerUtilitaire").click((e) => {
        // On ne crée la nouvelle section Toolzzz que si ni Toolzzz_* ni Outiiil_*
        // n'existent déjà — pour ne pas dédoubler le stockage dans une alliance
        // qui a déjà ses sections sous l'ancien nom.
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
              // on ne peut pas creer directement une section caché donc on cache aprés
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
        // creation de la section membre pour les membres de l'alliance
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
              // on ne peut pas creer directement une section caché donc on cache aprés
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
      // Preparation d'une guerre
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
      // event sur le bouton guerre
      $("#o_creerSectionGuerre").click((e) => {
        let alliance = new Alliance({ tag: $("#o_tagGuerre").val() }),
          titleSection = "Guerre " + alliance.tag;
        if (
          !$("#cat_forum span[class^='forum']")
            .text()
            .toUpperCase()
            .includes(titleSection.toUpperCase())
        ) {
          // on créer la section "Guerre " + tag
          this.createSection(titleSection).then(
            (data) => {
              // on recup la section pour ajouter les sujets des joueurs
              let response = Utils.parseHtml(Utils.parseHtml(data).find("cmd:eq(1)").html() || "");
              let idCat = $(response)
                .find(`input[value='${titleSection}']`)
                .parent()
                .attr("id")
                .match(/\d+/)[0];
              alliance.getDescription().then(
                (data) => {
                  // on construit les appels de creation des sujets
                  let promisePlayer = new Array();
                  $(data)
                    .find("#tabMembresAlliance tr:gt(0)")
                    .each((i, elt) => {
                      let pseudo = $(elt).find("td:eq(2)").text();
                      promisePlayer.push(
                        this.createTopic(pseudo, `[player]${pseudo}[/player]`, idCat),
                      );
                    });
                  // on creer les sujets
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
          // si la commande est selectionné
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
