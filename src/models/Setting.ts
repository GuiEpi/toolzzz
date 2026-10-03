/*
 * Setting.ts
 * Hraesvelg
 **********************************************************************/

import { $ } from "~/vendor";
import { getProfile } from "~/models/currentPlayer";
import * as storage from "~/storage";

/**
 * Holds a single user setting.
 *
 * @class Page
 */
export class Setting {
  // Fields declared for TypeScript (Phase 2 was a straight conversion; real
  // typing is deferred — see .claude/plans/wxt-migration-followups.md).
  _id: any;
  _label: any;
  _type: any;
  _value: any;
  _allowedValues: any;
  constructor(id, label, type = "", valeur: any = "", valueAllowed: any = []) {
    /**
     * setting id
     */
    this._id = id;
    /**
     * setting name
     */
    this._label = label;
    /**
     * setting kind: input or select
     */
    this._type = type;
    /**
     * setting value
     */
    this._value = valeur;
    /**
     * for a select, the allowed values
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
   * JSON override
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
        // allowedValues = { min, max, step, unite }; the current value can also
        // be typed into a field kept in sync with the slider, wired up in
        // addEvent
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
        // The jQuery UI step stays at 1: with a step of `step`, a precise value
        // typed into the field would be rounded. Mouse dragging is filtered to
        // multiples of `step` to keep the slider snappy, while the keyboard on
        // the handle keeps full precision.
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
          // only on user action: a value set from the field is saved by the
          // field itself
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
