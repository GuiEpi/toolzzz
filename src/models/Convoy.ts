/*
 * Convoi.ts
 * Hraesvelg
 **********************************************************************/

import { $, moment, numeral } from "~/vendor";
import { IMG_MATERIALS, IMG_FOOD } from "~/constants";
import { Utils } from "~/lib/Utils";
import { getProfile } from "~/models/currentPlayer";

/**
 * Classe pour creer et gérer un convoi
 *
 * @class Convoi
 */
export class Convoy {
  // Champs déclarés pour TypeScript (Phase 2 : conversion telle quelle, le
  // typage fin est reporté — cf. .claude/plans/wxt-migration-followups.md).
  _id: any;
  _sender: any;
  _recipient: any;
  _food: any;
  _materials: any;
  _orderId: any;
  _arrivalDate: any;
  constructor(settings) {
    /**
     * id du convoi
     */
    this._id = settings["id"] || moment().valueOf();
    /**
     * qui envoie le convoi
     */
    this._sender = settings["expediteur"];
    /**
     * qui recoit les ressources
     */
    this._recipient = settings["destinataire"];
    /**
     * quantité livrée
     */
    this._food = settings["nourriture"] || 0;
    /**
     * quantité livrée
     */
    this._materials = settings["materiaux"] || 0;
    /**
     * id de la commande pour le convoi
     */
    this._orderId = settings["idCommande"] || -1;
    /**
     * date d'arrivée du convoi
     */
    this._arrivalDate = settings["dateArrivee"];
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
  get sender() {
    return this._sender;
  }
  /**
   *
   */
  set sender(newSender) {
    this._sender = newSender;
  }
  /**
   *
   */
  get recipient() {
    return this._recipient;
  }
  /**
   *
   */
  set recipient(newRecipient) {
    this._recipient = newRecipient;
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
  get idOrder() {
    return this._orderId;
  }
  /**
   *
   */
  set idOrder(newIdOrder) {
    this._orderId = newIdOrder;
  }
  /**
   *
   */
  get dateArrival() {
    return this._arrivalDate;
  }
  /**
   *
   */
  set dateArrival(newArrival) {
    this._arrivalDate = newArrival;
  }
  /**
   *
   */
  isRecipient() {
    return this._recipient == getProfile().pseudo;
  }
  /**
   *
   */
  isDone() {
    return moment(this._arrivalDate).diff(moment()) < 0;
  }
  /**
   *
   */
  toToolsFormat() {
    let timeRestant = moment(this._arrivalDate).diff(moment()) / 1000;
    return `- Vous allez livrer ${numeral(this._food).format()} nourritures et ${numeral(this._materials).format()} materiaux à ${this._recipient} dans ${Utils.intToTime(timeRestant)} - Retour le ${Utils.roundMinute(timeRestant).format("D MMM YYYY à HH[h]mm")}`;
  }
  /**
   *
   */
  toHtml(id) {
    // Si le convoi m'est destiné et que le datetime d'arrivée n'est pas dépassé
    let timeRestant = moment(this._arrivalDate).diff(moment()) / 1000;
    $(id).after(
      `<strong>- Vous allez recevoir ${numeral(this._food).format()} ${IMG_FOOD} et ${numeral(this._materials).format()} ${IMG_MATERIALS} de <a href="Membre.php?Pseudo=${this._sender}">${this._sender}</a> dans <span id='convoi_${this._id}'>${Utils.intToTime(timeRestant)}</span></strong> - <small>Retour le ${Utils.roundMinute(timeRestant).format("D MMM YYYY à HH[h]mm")}</small><br/>`,
    );
    Utils.decreaseTime(moment(this._arrivalDate).diff(moment()) / 1000, "convoi_" + this._id);
    return this;
  }
}
