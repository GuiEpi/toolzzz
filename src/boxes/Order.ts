/*
 * Order.ts
 * Hraesvelg
 **********************************************************************/

import { $, moment, numeral } from "~/vendor";
import {
  DATEPICKER_OPTIONS,
  UPGRADES,
  TOAST_ERROR,
  TOAST_INFO,
  TOAST_SUCCESS,
  TOAST_WARNING,
} from "~/constants";
import { Utils } from "~/lib/Utils";
import { getProfile } from "~/models/currentPlayer";
import { Box } from "~/boxes/Box";

/**
 * Adds and edits a resource order.
 *
 * @class OrderBox
 * @constructor
 * @extends Box
 */
export class OrderBox extends Box {
  // Fields declared for TypeScript (Phase 2 was a straight conversion; real
  // typing is deferred — see .claude/plans/wxt-migration-followups.md).
  _order: any;
  _tools: any;
  _page: any;
  override hide: any;
  constructor(order, tools, page) {
    super("o_boiteCommande" + order.id, "Commander des ressources");
    /**
     *
     */
    this._order = order;
    /**
     *
     */
    this._tools = tools;
    /**
     *
     */
    this._page = page;
  }
  /**
   * Renders the box.
   *
   * @private
   * @method render
   */
  override render() {
    if (super.render()) this.getForm().css().event();
    return this;
  }
  /**
   * Applies the box's own styling.
   *
   * @private
   * @method css
   */
  override css() {
    super.css();
    return this;
  }
  /**
   * Wires up the box's own events.
   *
   * @private
   * @method event
   */
  override event() {
    super.event();
    $("input[name='o_dateCommande'], input[name='o_dateApres']").datepicker({
      ...DATEPICKER_OPTIONS,
      minDate: new Date(),
      dateFormat: "dd-mm-yy",
    });
    // when adding an order, prefill the fields from the current upgrade
    if (!this._tools.commande.hasOwnProperty(this._order.id))
      $("#o_form" + this._order.id + " select[name='o_evolution']").change((e) => {
        let qte = Utils.computeQuantity(parseInt(e.currentTarget.value));
        $("#o_form" + this._order.id + " input[name='o_quantiteNou']").val(
          numeral(qte[0]).format(),
        );
        $("#o_form" + this._order.id + " input[name='o_quantiteMat']").val(
          numeral(qte[1]).format(),
        );
      });
    $("#o_form" + this._order.id + " input[name^='o_quantite']").on("input", (e) => {
      return $(e.currentTarget).val(numeral($(e.currentTarget).val()).format());
    });
    $("#o_commander" + this._order.id).click((e) => {
      e.preventDefault();
      this._order.evolution = $("#o_form" + this._order.id + " select[name='o_evolution']").val();
      this._order.nourriture = numeral(
        $("#o_form" + this._order.id + " input[name='o_quantiteNou']").val(),
      ).value();
      this._order.materiaux = numeral(
        $("#o_form" + this._order.id + " input[name='o_quantiteMat']").val(),
      ).value();
      this._order.dateSouhaite = moment(
        $("#o_form" + this._order.id + " input[name='o_dateCommande']").val(),
        "DD-MM-YYYY",
      );
      let dateAfter = $("#o_form" + this._order.id + " input[name='o_dateApres']").val();
      this._order.dateApres = dateAfter
        ? moment($("#o_form" + this._order.id + " input[name='o_dateApres']").val(), "DD-MM-YYYY")
        : null;
      let message = this._order.isValid();
      if (!message) {
        // an order missing from the alliance tools is a new one
        if (!this._tools.commande.hasOwnProperty(this._order.id)) {
          // an order missing from the alliance tools is a new one
          this._tools
            .createTopic(
              this._order.toToolsFormat(),
              " ",
              getProfile().parametre["forumCommande"].valeur,
            )
            .then(
              (data) => {
                let response = $(data).text();
                if (response.includes("Accès refusé."))
                  $.toast({
                    ...TOAST_WARNING,
                    text: response + " Vous n'avez pas les droits de créer de commandes.",
                  });
                else {
                  $.toast({ ...TOAST_SUCCESS, text: "Commande ajoutée avec succès." });
                  this._tools.commande[this._order.id] = this._order;
                  this._page.refreshOrder();
                }
              },
              (jqXHR, textStatus, errorThrown) => {
                $.toast({
                  ...TOAST_ERROR,
                  text: "Une erreur réseau a été rencontrée lors de l'ajout de votre commande.",
                });
              },
            );
        } else {
          // an order already in the alliance tools is being edited, otherwise added
          this._tools.editTopic(this._order.toToolsFormat(), " ", this._order.id).then(
            (data) => {
              $.toast({ ...TOAST_INFO, text: "Commande mise à jour avec succès." });
              this._tools.commande[this._order.id] = this._order;
              this._page.refreshOrder();
            },
            (jqXHR, textStatus, errorThrown) => {
              $.toast({
                ...TOAST_ERROR,
                text: "Une erreur réseau a été rencontrée lors de la mise à jour des commandes.",
              });
            },
          );
        }
        this.hide();
      } else $.toast({ ...TOAST_ERROR, text: message });
      return false;
    });
    return this;
  }
  /**
   *
   */
  getForm() {
    let select = "",
      qte = Utils.computeQuantity(0);
    for (
      let i = 0;
      i < UPGRADES.length;
      select += `<option value="${i}" ${i == this._order.evolution ? "selected" : ""}>${UPGRADES[i++]}</option>`
    );
    $("#" + this._id).append(`<div class="o_commandeForm"><form id="o_form${this._order.id}">
            <div class="group"><select name="o_evolution" class="o_input" required>${select}</select><span class="o_inputHighlight"></span><span class="o_inputBar"></span><label class='o_label'>Evolution</label></div>
            <div class="group"><input name="o_quantiteNou" class="o_input" type="text" value="${this._order.nourriture ? numeral(this._order.nourriture).format() : qte[0] ? numeral(qte[0]).format() : 0}" required/><span class="o_inputHighlight"></span><span class="o_inputBar"></span><label class='o_label'>Nourriture</label></div>
            <div class="group"><input name="o_quantiteMat" class="o_input" type="text" value="${this._order.materiaux ? numeral(this._order.materiaux).format() : qte[1] ? numeral(qte[1]).format() : 0}" required/><span class="o_inputHighlight"></span><span class="o_inputBar"></span><label class='o_label'>Materiaux</label></div>
            <div class="group"><input name="o_dateCommande" class="o_input" type="text" value="${this._order.dateSouhaite ? moment(this._order.dateSouhaite).format("DD-MM-YYYY") : ""}" required/><span class="o_inputHighlight"></span><span class="o_inputBar"></span><label class='o_label'>Pour le*</label></div>
            <div class="group"><input name="o_dateApres" class="o_input" type="text" value="${this._order.dateApres ? moment(this._order.dateApres).format("DD-MM-YYYY") : ""}" required/><span class="o_inputHighlight"></span><span class="o_inputBar"></span><label class='o_label'>&Agrave; Partir du</label></div>
            <br/><button id="o_commander${this._order.id}" name="o_btnCommande" class="o_button f_success">Commander</button>
            </form></div>`);
    return this;
  }
}
