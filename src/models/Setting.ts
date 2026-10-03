/*
 * Parametre.ts
 * Hraesvelg
 **********************************************************************/

import { $ } from "~/vendor";
import { getProfile } from "~/models/currentPlayer";
import * as storage from "~/storage";

/**
 * Classe permettant la gestion de parametre
 *
 * @class Page
 */
export class Setting {
  // Champs déclarés pour TypeScript (Phase 2 : conversion telle quelle, le
  // typage fin est reporté — cf. .claude/plans/wxt-migration-followups.md).
  _id: any;
  _label: any;
  _type: any;
  _value: any;
  _allowedValues: any;
  constructor(id, label, type = "", valeur: any = "", valueAllowed: any = []) {
    /**
     * id du parametre
     */
    this._id = id;
    /**
     * nom du parametre
     */
    this._label = label;
    /**
     * type du parametre : input ou select
     */
    this._type = type;
    /**
     * valeur du parametre
     */
    this._value = valeur;
    /**
     * dans le cas d'un select les valeurs possibles
     */
    this._allowedValues = valueAllowed;
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
  get label() {
    return this._label;
  }
  /**
   *
   */
  set label(newLabel) {
    this._label = newLabel;
  }
  /**
   *
   */
  get type() {
    return this._type;
  }
  /**
   *
   */
  set type(newType) {
    this._type = newType;
  }
  /**
   *
   */
  get valeur() {
    return this._value;
  }
  /**
   *
   */
  set valeur(newValue) {
    this._value = newValue;
  }
  /**
   *
   */
  get valueAllowed() {
    return this._allowedValues;
  }
  /**
   *
   */
  set valueAllowed(newAllowed) {
    this._allowedValues = newAllowed;
  }
  /**
   * override JSON
   */
  toJSON() {
    return this._value;
  }
  /**
   *
   */
  save() {
    storage.setJSON("outiiil_parametre", getProfile().parametre);
    return this;
  }
  /**
   *
   */
  getForm() {
    let html = `<div class="group">`;
    switch (this._type) {
      case "color":
        html += `<input id="${this._id}" class="o_input" type="text" value="${this._value}" required/><input id="${this._id}Picker" class="o_inputColor" type="color" value="${this._value}"/>`;
        break;
      case "number":
        html += `<input class="o_input" type="text" value="0" style="display:none;" required/><input id="${this._id}" value="${this._value}" />`;
        break;
      case "input":
        html += `<input id="${this._id}" class="o_input" type="text" value="${this._value}" required/>`;
        break;
      case "checkbox":
        return `<div class="group left"><label for="${this._id}">${this._label}</label><input id="${this._id}" class="o_checkbox" type="checkbox" ${this._value ? "checked" : ""}/></div>`;
        break;
      case "slider":
        // valeurPossible = { min, max, step, unite } ; la valeur courante est
        // aussi saisissable au clavier dans un champ synchronisé avec le
        // curseur, posé dans ajouterEvent
        return `<div id="${this._id}Groupe" class="group left"><label for="${this._id}Valeur">${this._label} : <input id="${this._id}Valeur" class="o_sliderValeur" type="text" value="${this._value}"/>${this._allowedValues.unite || ""}</label><div id="${this._id}" class="slider" style="margin:6px 12px 0 3px;"></div></div>`;
      case "select":
        html += `<select id="${this._id}" class="o_input" required>`;
        this._allowedValues.forEach((item, index, array) => {
          html += `<option value="${index}" ${index == this._value ? "selected" : ""}>${item}</option>`;
        });
        html += `</select>`;
        break;
      default:
        break;
    }
    html += `<span class="o_inputHighlight"></span><span class="o_inputBar"></span><label class='o_label'>${this._label}</label></div>`;
    return html;
  }
  /**
   *
   */
  addEvent() {
    switch (this._type) {
      case "number":
        $("#" + this._id).spinner({
          min: 0,
          classes: { "ui-spinner": "o_number ui-corner-all" },
          numberFormat: "i",
        });
        $("#" + this._id).on("spinchange spinstop", (e) => {
          this._value = $(e.currentTarget).spinner("value") ?? 0;
          this.save();
        });
        break;
      case "color":
        $("#" + this._id).on("input", (e) => {
          this._value = e.currentTarget.value.padEnd(7, "0");
          $("#" + this._id + "Picker").val(this._value);
          this.save();
        });
        $("#" + this._id + "Picker").on("change", (e) => {
          this._value = e.currentTarget.value;
          $("#" + this._id).val(this._value);
          this.save();
        });
        break;
      case "checkbox":
        $("#" + this._id).on("change", (e) => {
          this._value = e.currentTarget.checked;
          this.save();
        });
        break;
      case "slider": {
        let min = this._allowedValues.min,
          max = this._allowedValues.max,
          pas = this._allowedValues.step || 1,
          champ = $("#" + this._id + "Valeur"),
          record = (v) => {
            this._value = v;
            champ.spinner("value", v);
            this.save();
          };
        // Le pas jQuery UI reste à 1 : avec un pas de `pas`, une valeur fine
        // posée depuis le champ serait arrondie. Le glissement à la souris
        // est filtré sur les multiples de `pas` pour garder un curseur rapide ;
        // le clavier sur la poignée garde la précision.
        $("#" + this._id).slider({
          min: min,
          max: max,
          step: 1,
          value: parseInt(this._value),
          slide: (e, ui) => {
            if ((ui.value - min) % pas && !(e.originalEvent && e.originalEvent.type == "keydown"))
              return false;
            champ.spinner("value", ui.value);
          },
          // seulement sur action de l'utilisateur : une valeur posée depuis le
          // champ est enregistrée par le champ
          change: (e, ui) => {
            if (e.originalEvent) record(ui.value);
          },
        });
        champ.spinner({ min: min, max: max, numberFormat: "i" });
        champ.on("spinstop change", () => {
          let v = Math.min(max, Math.max(min, parseInt(champ.val()) || 0));
          $("#" + this._id).slider("value", v);
          record(v);
        });
        break;
      }
      default:
        $("#" + this._id).on("input", (e) => {
          this._value = e.currentTarget.value;
          this.save();
        });
        break;
    }
    return this;
  }
}
