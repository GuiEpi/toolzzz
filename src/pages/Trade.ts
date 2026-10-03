/*
 * Commerce.ts
 * Hraesvelg
 **********************************************************************/

import { $, moment, numeral } from "~/vendor";
import { ORDER_STATUS, IMG_MATERIALS, IMG_FOOD, TOAST_ERROR, TOAST_SUCCESS } from "~/constants";
import { Utils } from "~/lib/Utils";
import { getProfile } from "~/models/currentPlayer";
import { OrderBox } from "~/boxes/Order";
import { Order } from "~/models/Order";
import { Convoy } from "~/models/Convoy";
import { Player } from "~/models/Player";
import { ForumPage } from "~/pages/Forum";

/**
 * Classe de fonction pour la page /commerce.php.
 *
 * @class PageCommerce
 * @constructor
 */
export class TradePage {
  // Champs déclarés pour TypeScript (Phase 2 : conversion telle quelle, le
  // typage fin est reporté — cf. .claude/plans/wxt-migration-followups.md).
  _comptePlusBox: any;
  _tools: any;
  constructor(boxComptePlus) {
    /**
     * Accés à la boite compte+
     */
    this._comptePlusBox = boxComptePlus;
    /**
     * Connexion à l'utilitaire.
     */
    this._tools = new ForumPage();
  }
  /**
   *
   */
  run() {
    // ajout d'information
    $("form table").append(
      `<tr class='centre'><td colspan=6>Info : Niveau d'étable <strong>${getProfile().niveauConstruction[11]}</strong>, 1 ouvrière peut transporter : <strong>${10 + getProfile().niveauConstruction[11] / 2}</strong> ressources.</td></tr>`,
    );
    // ajout des boutons pour arrondir les quantités
    $("#bouton_nourriture_max").html(
      `Nourriture donnée <span id="o_arrondirNou" class="gras small">arrondir...</span>`,
    );
    $("#o_arrondirNou").click((e) => {
      e.preventDefault();
      let value = Math.floor($("#nbNourriture").val()),
        countMaterials = Math.floor($("#nbMateriaux").val()),
        newValue = Utils.roundQuantity(value);
      $("#input_nbNourriture").val(numeral(newValue).format());
      $("#nbNourriture").val(newValue);
      // mise à jour des ouvrieres
      $("#input_nbOuvriere").val(
        numeral(
          Math.floor((newValue + countMaterials) / (10 + getProfile().niveauConstruction[11] / 2)),
        ).format(),
      );
      $("#nbOuvriere").val(
        Math.floor((newValue + countMaterials) / (10 + getProfile().niveauConstruction[11] / 2)),
      );
      return false;
    });
    // materiaux
    $("#bouton_materiaux_max").html(
      `Matériaux donnés <span id="o_arrondirMat" class="gras small">arrondir...</span>`,
    );
    $("#o_arrondirMat").click((e) => {
      e.preventDefault();
      let value = Math.floor($("#nbMateriaux").val()),
        countNou = Math.floor($("#nbNourriture").val()),
        newValue = Utils.roundQuantity(value);
      $("#input_nbMateriaux").val(numeral(newValue).format());
      $("#nbMateriaux").val(newValue);
      // mise à jour des ouvrieres
      $("#input_nbOuvriere").val(
        numeral(
          Math.floor((newValue + countNou) / (10 + getProfile().niveauConstruction[11] / 2)),
        ).format(),
      );
      $("#nbOuvriere").val(
        Math.floor((newValue + countNou) / (10 + getProfile().niveauConstruction[11] / 2)),
      );
      return false;
    });
    // option c+
    if (!Utils.comptePlus) this.plus();
    // Si on dispose d'un utilitaire pour le commerce on affiche les outils
    if (getProfile().parametre["forumCommande"].valeur) {
      // recuperation des commandes sur l'utilitaire
      this._tools.viewSection(getProfile().parametre["forumCommande"].valeur).then(
        (data) => {
          if (this._tools.loadOrder(data)) this.renderOrder();
        },
        (jqXHR, textStatus, errorThrown) => {
          $.toast({
            ...TOAST_ERROR,
            text: "Une erreur réseau a été rencontrée lors de la récupération des commandes.",
          });
        },
      );
      this.convoyForm();
    }
    return this;
  }
  /**
   * Affiche les retours, et sauvegarde les convois en cours pour la boite compte plus.
   *
   * @private
   * @method plus
   */
  plus() {
    // autocomplete sur le champs pseudo
    $("#pseudo_convoi").autocomplete({
      source: (request, response) => {
        // requete pour autocomplete
        Player.search(request.term).then((data) => {
          response(Utils.extractResearch(data, true, false));
        });
      },
      position: { my: "left top-5", at: "left bottom" },
      delay: 0,
      minLength: 3,
    });
    // sauvegarde des convois
    let listConvoy = new Array(),
      nombres = new Array();
    $("#centre > strong").each((i, elt) => {
      // Affichage du retour des convois
      if ($(elt).next().text().indexOf("Retour") == -1)
        $(elt).after(
          `<span class='small'>- Retour le ${Utils.roundMinute(Utils.timeToInt($(elt).text().split("dans")[1].trim())).format("D MMM YYYY à HH[h]mm")}</span>`,
        );
      nombres = $(elt)
        .text()
        .replace(/ /g, "")
        .split("dans")[0]
        .match(/^\d+|\d+\b|\d+(?=\w)/g);
      listConvoy.push({
        cible: $(elt).find("a").text(),
        sens: $(elt).text().includes("livrer"),
        nou: nombres[0],
        mat: nombres[1],
        exp: moment().add(Utils.timeToInt($(elt).text().split("dans")[1].trim()), "s"),
      });
    });
    // tri les convois par ordre d'arrivée
    listConvoy.sort((a, b) => {
      return moment(a.exp).diff(moment(b.exp));
    });
    // Verification si les données sont deja enregistrées
    if (listConvoy.length) this.saveConvoys(listConvoy);
    return this;
  }
  /**
   * Sauvegarde les convois en cours.
   *
   * @private
   * @method saveConvoi
   * @param {Array} list des convois en cours.
   */
  saveConvoys(list) {
    if (
      !this._comptePlusBox.hasOwnProperty("convoi") ||
      this._comptePlusBox.convoi.length != list.length ||
      this._comptePlusBox.convoi[0]["cible"] != list[0]["cible"] ||
      (list[0]["exp"].diff(this._comptePlusBox.convoi[0]["exp"], "s") > 1 &&
        !Utils.comptePlus &&
        $("#boiteComptePlus").length)
    ) {
      this._comptePlusBox.convoi = list;
      this._comptePlusBox.startConvoi = moment();
      this._comptePlusBox.save().updateConvoy();
    }
    return this;
  }
  /**
   * Affiche les commandes en cours issu de l'utilitaire.
   *
   * @private
   * @method afficherCommande
   * @param {Object} liste des lignes de commandes.
   */
  renderOrder() {
    let total = 0,
      totalRouge = 0,
      tabOrderAff = new Array(),
      tabOrderPersoInCours = new Array(),
      contenu = `<div id="o_listeCommande" class="simulateur centre o_marginT15"><h2>Commandes</h2><table id='o_tableListeCommande' class="o_maxWidth" cellspacing=0>
            <thead><tr class="ligne_paire"><th>Pseudo</th><th>${IMG_FOOD}</th><th>${IMG_MATERIALS}</th><th>Echéance</th><th>Status</th><th>État</th><th>Temps de trajet</th><th>Livrer</th><th>Options</th></tr></thead>`;
    for (let id in this._tools.commande) {
      if (this._tools.commande[id].isADo()) {
        contenu += this._tools.commande[id].toHtml();
        total += parseInt(this._tools.commande[id].materiaux);
        if (this._tools.commande[id].isOutLate())
          totalRouge += parseInt(this._tools.commande[id].materiaux);
        tabOrderAff.push(id);
      }
      // ajout des commandes à verifier pour vois les convois
      // on affiche les convois pour nos commandes en cours
      // on affiche les conboi pour les commandes terminés de moins de 1 jour
      if (this._tools.commande[id].demandeur.pseudo == getProfile().pseudo)
        if (
          this._tools.commande[id].etat == ORDER_STATUS["En cours"] ||
          (this._tools.commande[id].etat == ORDER_STATUS["Terminée"] &&
            this._tools.commande[id].isRecentlyDone())
        )
          tabOrderPersoInCours.push(id);
    }
    contenu += `<tfoot><tr class='gras ${tabOrderAff.length % 2 ? "ligne_paire" : ""}'><td colspan='9'>${tabOrderAff.length} commande(s) : ${numeral(total).format("0.00 a")} ~ <span class='red'>${numeral(totalRouge).format("0.00 a")}</span> en retard !</td></tr></tfoot></table></div><br/>`;
    $("#centre .Bas").before(contenu);
    // event
    for (let id of tabOrderAff) this._tools.commande[id].addEvent(this, this._tools);
    $("#o_tableListeCommande").DataTable({
      bInfo: false,
      bPaginate: false,
      bAutoWidth: false,
      dom: "Bfrti",
      buttons: ["colvis", "copyHtml5", "csvHtml5", "excelHtml5"],
      order: [[5, "desc"]],
      stripeClasses: ["", "ligne_paire"],
      responsive: true,
      language: {
        zeroRecords: "Aucune commande trouvée",
        infoEmpty: "Aucun enregistrement",
        infoFiltered: "(Filtré par _MAX_ enregistrements)",
        search: "Rechercher : ",
        buttons: { colvis: "Colonne" },
      },
      columnDefs: [
        { type: "quantite-grade", targets: [1, 2] },
        { type: "moment-D MMM YYYY", targets: 3 },
        { type: "time-unformat", targets: 6 },
        { sortable: false, targets: [7, 8] },
      ],
    });
    $("#o_tableListeCommande_wrapper .dt-buttons").prepend(
      `<a id="o_ajouterCommande" class="dt-button" href="#"><span>Commander</span></a>`,
    );
    $("#o_ajouterCommande").click((e) => {
      let boxOrder = new OrderBox(new Order(), this._tools, this);
      boxOrder.render();
    });
    // récuperation des convois sur l'utilitaire
    this.renderConvoy(tabOrderPersoInCours);
    return this;
  }
  /**
   *
   */
  refreshOrder() {
    let data = new Array(),
      total = 0,
      totalRouge = 0,
      tabOrderAff = new Array(); // current table data
    for (let id in this._tools.commande) {
      if (this._tools.commande[id].isADo()) {
        data.push($(this._tools.commande[id].toHtml())[0]);
        total += parseInt(this._tools.commande[id].materiaux);
        if (this._tools.commande[id].isOutLate())
          totalRouge += parseInt(this._tools.commande[id].materiaux);
        tabOrderAff.push(id);
      }
    }
    $("#o_tableListeCommande").DataTable().clear().rows.add(data).draw();
    for (let id of tabOrderAff) this._tools.commande[id].addEvent(this, this._tools);
    // mise à jour du tfoot
    $("#o_tableListeCommande tfoot").html(
      `<tr class='gras ${tabOrderAff.length % 2 ? "ligne_paire" : ""}'><td colspan='9'>${tabOrderAff.length} commande(s) : ${numeral(total).format("0.00 a")} ~ <span class='red'>${numeral(totalRouge).format("0.00 a")}</span> en retard !</td></tr>`,
    );
    return this;
  }
  /**
   * Afficher les convois en cours.
   *
   * @private
   * @method afficherConvoi
   */
  renderConvoy(tabOrder) {
    if (!Utils.comptePlus) {
      for (let id of tabOrder) {
        this._tools.viewTopic(id).then(
          (data) => {
            let response = $(data).find("cmd:eq(1)").text();
            if (response.includes("Vous n'avez pas accès à ce forum."))
              $.toast({
                ...TOAST_ERROR,
                text: "L'identifiant du sujet pour les convois est érroné.",
              });
            else {
              let convoy = null,
                message = "",
                nombres = new Array();
              $("<div/>")
                .append(response)
                .find(".messageForum")
                .each((i, elt) => {
                  message = $(elt).text();
                  if (message.trim()) {
                    nombres = message
                      .replace(/ /g, "")
                      .split("dans")[0]
                      .match(/^\d+|\d+\b|\d+(?=\w)/g);
                    convoy = new Convoy({
                      expediteur: $(elt).prev().find("a").text(),
                      destinataire: getProfile().pseudo,
                      nourriture: nombres[0],
                      materiaux: nombres[1],
                      idCommande: id,
                      dateArrivee: moment(message.split("Retour le ")[1], "D MMM YYYY à HH[h]mm"),
                    });
                    // si la commande est toujours en cours et que je suis le destinaitaire et que le convoi est n'est pas encore arrivée
                    if (!convoy.isDone())
                      convoy.toHtml(
                        $("h3:contains('Convois en cours:')").length ? "h3" : ".simulateur:first",
                        convoy.type,
                      );
                  }
                });
            }
          },
          (jqXHR, textStatus, errorThrown) => {
            $.toast({
              ...TOAST_ERROR,
              text: "Une erreur réseau a été rencontrée lors de la récupération des convois.",
            });
          },
        );
      }
      this.plus();
    }
    return this;
  }
  /**
   * Modifie le bouton d'envoie des convois pour prendre ne compte l'utilitaire.
   *
   * @private
   * @method formulaireConvoi
   */
  convoyForm() {
    $("input[name='convoi']")
      .before("<input id='o_idCommande' type='hidden' value='-1' name='o_idCommande'/>")
      .after(` <button id='o_resetConvoi'>Effacer</button>`)
      .click((e) => {
        let idOrder = $("#o_idCommande").val();
        if (idOrder != -1) {
          // Enrengistrement du convoi
          e.preventDefault();
          let monConvoy = new Convoy({
            expediteur: getProfile().pseudo,
            destinataire: $("#pseudo_convoi").val(),
            materiaux: numeral($("#nbMateriaux").val()).value(),
            nourriture: numeral($("#nbNourriture").val()).value(),
            idCommande: numeral(idOrder).value(),
            dateArrivee: moment().add(
              getProfile().getTravelTimeTo(this._tools.commande[idOrder].demandeur),
              "s",
            ),
          });
          // enregistrement
          this._tools.sendMessage(idOrder, monConvoy.toToolsFormat()).then(
            (data) => {
              // Mise a jour des commandes
              this._tools.commande[idOrder].addConvoy(monConvoy);
              this._tools
                .editTopic(this._tools.commande[idOrder].toToolsFormat(), " ", idOrder)
                .then(
                  (data) => {
                    // si la commande est terminé on passe la suivante en attente en cours si il n'y a pas d'autres en cours
                    let cmdNext: any = 99999999999999999;
                    for (let id in this._tools.commande) {
                      if (this._tools.commande[id].etat == ORDER_STATUS["En cours"]) {
                        cmdNext = 99999999999999999;
                        break;
                      }
                      if (
                        this._tools.commande[id].etat == ORDER_STATUS["En attente"] &&
                        id < cmdNext
                      )
                        cmdNext = id;
                    }
                    if (cmdNext != 99999999999999999) {
                      this._tools.commande[cmdNext].etat = ORDER_STATUS["En cours"];
                      this._tools
                        .editTopic(this._tools.commande[cmdNext].toToolsFormat(), " ", cmdNext)
                        .then(
                          (data) => {
                            $.toast({
                              ...TOAST_SUCCESS,
                              text: "Nouvelle commande en cours à jour.",
                            });
                          },
                          (jqXHR, textStatus, errorThrown) => {
                            $.toast({
                              ...TOAST_ERROR,
                              text: "Une erreur réseau a été rencontrée lors de la mise à jour des commandes.",
                            });
                          },
                        );
                    }
                    // Lancement du convoi dans fourmizzz
                    $("input[name='convoi']").trigger("click");
                  },
                  (jqXHR, textStatus, errorThrown) => {
                    $.toast({
                      ...TOAST_ERROR,
                      text: "Une erreur réseau a été rencontrée lors de la mise à jour des commandes.",
                    });
                  },
                );
            },
            (jqXHR, textStatus, errorThrown) => {
              $.toast({
                ...TOAST_ERROR,
                text: "Une erreur réseau a été rencontrée lors de l'enregistrement de votre convoi.",
              });
            },
          );
          $("#o_idCommande").val("-1");
        }
      });
    $("#o_resetConvoi").click((e) => {
      e.preventDefault();
      $(
        "#pseudo_convoi, #input_nbNourriture, #input_nbMateriaux, #input_nbOuvriere, #o_idCommande",
      ).val("");
      return false;
    });
    return this;
  }
}
