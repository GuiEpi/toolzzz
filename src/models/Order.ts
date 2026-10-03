/*
 * Order.ts
 * Hraesvelg
 **********************************************************************/

import { $, moment, numeral } from "~/vendor";
import {
  ORDER_STATUS,
  UPGRADES,
  IMG_PENCIL,
  IMG_CROSS,
  IMG_DELIVERY,
  TOAST_ERROR,
  TOAST_INFO,
} from "~/constants";
import { Utils } from "~/lib/Utils";
import { getProfile } from "~/models/currentPlayer";
import { OrderBox } from "~/boxes/Order";
import { Player } from "~/models/Player";

/**
 * Creates and manages a resource order.
 *
 * @class Order
 */
export class Order {
  // Fields declared for TypeScript (Phase 2 was a straight conversion; real
  // typing is deferred — see .claude/plans/wxt-migration-followups.md).
  _id: any;
  _orderDate: any;
  _wantedDate: any;
  _afterDate: any;
  _requester: any;
  _upgrade: any;
  _food: any;
  _materials: any;
  _status: any;
  _lastUpdate: any;
  _lastUpdateUnused: any;
  constructor(settings: any = {}) {
    /**
     * order id
     */
    this._id = settings["id"] || moment().valueOf();
    /**
     * order date
     */
    this._orderDate = settings["dateCommande"] || moment();
    /**
     * date the player wants delivery by
     */
    this._wantedDate = settings["dateSouhaite"] || null;
    /**
     * date from which delivery may start
     */
    this._afterDate = settings["dateApres"] || null;
    /**
     * who placed the order
     */
    this._requester = settings.hasOwnProperty("demandeur")
      ? new Player(settings["demandeur"])
      : getProfile();
    /**
     * requested building or research
     */
    this._upgrade = settings["evolution"] || -1;
    /**
     * materials or food
     */
    this._food = settings["nourriture"] || 0;
    /**
     * quantity still to deliver
     */
    this._materials = settings["materiaux"] || 0;
    /**
     * order status
     */
    this._status = settings["etat"] || ORDER_STATUS["Nouvelle"];
    /**
     * date of the last update
     */
    this._lastUpdate = settings["miseAJour"] || moment();
  }
  /**
   *
   */
  get id() {
    return this._id;
  }
  /**
   *
   */
  set id(newId) {
    this._id = newId;
  }
  /**
   *
   */
  get dateOrder() {
    return this._orderDate;
  }
  /**
   *
   */
  set dateOrder(newDate) {
    this._orderDate = newDate;
  }
  /**
   *
   */
  get dateSouhaite() {
    return this._wantedDate;
  }
  /**
   *
   */
  set dateSouhaite(newDate) {
    this._wantedDate = newDate;
  }
  /**
   *
   */
  get dateApres() {
    return this._afterDate;
  }
  /**
   *
   */
  set dateApres(newDate) {
    this._afterDate = newDate;
  }
  /**
   *
   */
  get demandeur() {
    return this._requester;
  }
  /**
   *
   */
  set demandeur(newPlayer) {
    this._requester = newPlayer;
  }
  /**
   *
   */
  get evolution() {
    return this._upgrade;
  }
  /**
   *
   */
  set evolution(newEvo) {
    this._upgrade = newEvo;
  }
  /**
   *
   */
  get nourriture() {
    return this._food;
  }
  /**
   *
   */
  set nourriture(newFood) {
    this._food = newFood;
  }
  /**
   *
   */
  get materiaux() {
    return this._materials;
  }
  /**
   *
   */
  set materiaux(newMaterials) {
    this._materials = newMaterials;
  }
  /**
   *
   */
  get etat() {
    return this._status;
  }
  /**
   *
   */
  set etat(newStatus) {
    this._status = newStatus;
  }
  /**
   *
   */
  get lastUpdateUnused() {
    return this._lastUpdateUnused;
  }
  /**
   *
   */
  set lastUpdateUnused(newLast) {
    this._lastUpdateUnused = newLast;
  }
  /**
   *
   */
  toToolsFormat() {
    return (
      "[" +
      Object.keys(ORDER_STATUS).find((key) => ORDER_STATUS[key] == this._status) +
      "] " +
      this._requester.x +
      " / " +
      this._requester.y +
      " / " +
      UPGRADES[this._upgrade] +
      " / " +
      this._materials +
      " / " +
      this._food +
      " / " +
      moment(this._wantedDate).format("D MMM YYYY") +
      (this._afterDate ? " / " + moment(this._afterDate).format("D MMM YYYY") : "")
    );
  }
  /**
   *
   */
  parseToolsFormat(id, requester, etat, infos, lastConvoy?) {
    this._id = id;
    this._wantedDate = moment(infos[5], "D MMM YYYY");
    this._afterDate = infos.length > 6 ? moment(infos[6], "D MMM YYYY") : "";
    this._requester = new Player({ pseudo: requester, x: infos[0], y: infos[1] });
    this._upgrade = UPGRADES.indexOf(infos[2]);
    this._food = infos[4];
    this._materials = infos[3];
    this._status = ORDER_STATUS[etat];
    this._lastUpdate = moment(lastConvoy, "D MMM [à] HH[h]mm");
    return this;
  }
  /**
   *
   */
  isOutLate() {
    return moment().diff(moment(this._wantedDate), "days") > 0;
  }
  /**
   *
   */
  getWait() {
    return moment().diff(moment(this._wantedDate), "days");
  }
  /**
   *
   */
  isDone() {
    return !this._food && !this._materials;
  }
  /**
   *
   */
  isRecentlyDone() {
    return this._lastUpdate.isAfter(moment().subtract(1, "days"));
  }
  /**
   *
   */
  isADo() {
    return !(
      this._status == ORDER_STATUS["Supprimée"] ||
      this._status == ORDER_STATUS["Annulée"] ||
      this._status == ORDER_STATUS["Terminée"] ||
      (this._status == ORDER_STATUS["Nouvelle"] && this._requester.pseudo != getProfile().pseudo)
    );
  }
  /**
   *
   */
  isValid() {
    if (this._food && this._food < 0) return "Quantité nourriture incorrecte.";
    if (this._materials && this._materials < 0) return "Quantité materiaux incorrecte.";
    if (!this._wantedDate.isValid()) return "Date de la demande invalide.";
    if (this._afterDate && !moment(this._afterDate, "YYYY-MM-DD").isValid())
      return "Date de commencement livraison invalide.";
    return "";
  }
  /**
   *
   */
  toHtml() {
    let after = !this._afterDate || moment().isSameOrAfter(moment(this._afterDate));
    let html = `<tr data="${this._id}">
            <td>${this._requester.getGameLink()}</a></td><td>${numeral(this._food).format()}</td><td class='right'>${numeral(this._materials).format()}</td>
            <td>${moment(this._wantedDate).format("D MMM YYYY")}</td>`;
    if (after) {
      let wait = this.getWait();
      switch (true) {
        case wait > 0:
          html += `<td><img src='images/icone/3rondrouge.gif'/></td>`;
          break;
        case wait > -3:
          html += `<td><img src='images/icone/2rondorange.gif'/></td>`;
          break;
        default:
          html += `<td><img src='images/icone/1rondvert.gif'/></td>`;
          break;
      }
    } else
      html += `<td><img src="${IMG_CROSS}" alt='supprimer' title='Ne pas livrer avant le ${moment(this._afterDate).format("DD-MM-YYYY")}'/></td>`;
    // Status
    html += `<td ${this._status == ORDER_STATUS.Nouvelle ? "title='Un chef doit valider cette commande.'" : ""}>${Object.keys(ORDER_STATUS).find((key) => ORDER_STATUS[key] === this._status)}</td>`;
    // Travel time
    html += `<td>${Utils.intToTime(getProfile().getTravelTimeTo(this._requester))}</td>
            ${after && this._status == ORDER_STATUS["En cours"] ? "<td><a id='o_commande" + this._id + "' href=''><img src='" + IMG_DELIVERY + "' alt='livrer'/></a></td>" : "<td></td>"}
            ${this._requester.pseudo == getProfile().pseudo ? "<td><a id='o_modifierCommande" + this._id + "' href=''><img src='" + IMG_PENCIL + "' alt='modifier'/></a> <a id='o_supprimerCommande" + this._id + "' href=''><img src='" + IMG_CROSS + "' alt='supprimer'/></a></td></tr>" : "<td></td></tr>"}`;
    return html;
  }
  /**
   *
   */
  addEvent(page, tools) {
    $("#o_commande" + this._id).click((e) => {
      let delivery = Math.floor(
          (Utils.ouvrieres - Utils.terrain) * (10 + getProfile().niveauConstruction[11] / 2),
        ),
        max = delivery && delivery > Utils.materiaux ? Utils.materiaux : delivery;
      if (this._materials < max) {
        $("#input_nbMateriaux").val(numeral(this._materials).format());
        $("#nbMateriaux").val(this._materials);
        max -= this._materials;
        $("#input_nbNourriture").val(numeral(this._food < max ? this._food : max).format());
        $("#nbNourriture").val(this._food < max ? this._food : max);
      } else {
        $("#input_nbMateriaux").val(numeral(max).format());
        $("#nbMateriaux").val(max);
      }
      $("#pseudo_convoi").val(this._requester.pseudo);
      $("#o_idCommande").val(this._id);
      $("html").animate({ scrollTop: 0 }, 600);
      return false;
    });
    $("#o_modifierCommande" + this._id).click((e) => {
      let boxOrder = new OrderBox(this, tools, page);
      boxOrder.render();
      return false;
    });
    $("#o_supprimerCommande" + this._id).click((e) => {
      if (confirm("Supprimer cette commande ?")) {
        this._status = ORDER_STATUS.Supprimée;
        tools.editTopic(this.toToolsFormat(), " ", this._id).then(
          (data) => {
            $.toast({ ...TOAST_INFO, text: "Commande supprimée avec succès." });
            page.refreshOrder();
          },
          (jqXHR, textStatus, errorThrown) => {
            $.toast({
              ...TOAST_ERROR,
              text: "Une erreur réseau a été rencontrée lors de la mise à jour des commandes.",
            });
          },
        );
      }
      return false;
    });
  }
  /**
   *
   */
  addConvoy(convoy) {
    // subtract the food
    this._food -= convoy.nourriture;
    if (this._food < 0) this._food = 0;
    // subtract the materials
    this._materials -= convoy.materiaux;
    if (this._materials < 0) this._materials = 0;
    // update the status
    if (!this._food && !this._materials) this._status = ORDER_STATUS.Terminée;
    return this;
  }
}
