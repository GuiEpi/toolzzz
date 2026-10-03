/*
 * Account.ts
 **********************************************************************/

import { $ } from "~/vendor";
import { Utils } from "~/lib/Utils";
import { QUICK_MENU } from "~/data/quickMenu";
import { store } from "~/storage";

/**
 * Hooks into /compte.php to capture and configure the preferences of the
 * « menu rapide » (checkboxes `menuRapide*`).
 *
 * - ComptePlus: the game's own form is captured and a snapshot is saved to
 *   localStorage on every submit. The game keeps saving server-side in
 *   parallel.
 * - free accounts: the game does not render that form at all, so a copy is
 *   injected (Fourmilière / Alliance / Communauté sections) with its own
 *   handlers, reading and writing localStorage.
 *
 * @class AccountPage
 * @constructor
 */
export class AccountPage {
  // Fields declared for TypeScript (Phase 2 was a straight conversion; real
  // typing is deferred — see .claude/plans/wxt-migration-followups.md).
  _comptePlusBox: any;
  constructor(boxComptePlus) {
    this._comptePlusBox = boxComptePlus;
  }
  /**
   * @method run
   */
  run() {
    if (Utils.comptePlus) this._hookNative();
    else this._injectForm();
    return this;
  }
  /**
   * Pre-ticks the game's checkboxes from the saved preferences and snapshots
   * the state on submit.
   *
   * @private
   * @method _hookNative
   */
  _hookNative() {
    let prefs = this._readPrefs();
    if (Object.keys(prefs).length) {
      QUICK_MENU.forEach((item) => {
        if (prefs[item.name] !== undefined) {
          $("#" + item.name).prop("checked", prefs[item.name]);
        }
      });
    }
    $("input[name='submitMenuRapide']")
      .closest("form")
      .on("submit", () => this._savePrefs());
  }
  /**
   * Injects a Toolzzz "menu rapide" form for free accounts, which do not get
   * the game's own. Persisted to localStorage only.
   *
   * @private
   * @method _injectForm
   */
  _injectForm() {
    if ($("#o_menuRapideForm").length) return;
    let prefs = this._readPrefs();
    let sections: any = {};
    QUICK_MENU.forEach((item) => {
      (sections[item.section] = sections[item.section] || []).push(item);
    });
    let cols = Object.entries(sections)
      .map(([nom, items]: [string, any]) => {
        let cases = items
          .map(
            (item) =>
              `<label style='display:block;'><input type='checkbox' id='${item.name}' ${prefs[item.name] ? "checked" : ""}/> ${item.label}</label>`,
          )
          .join("");
        return `<td style='vertical-align:top;padding:0 12px;'><b>${nom}</b><br/>${cases}</td>`;
      })
      .join("");
    let html = `
      <br/>
      <div id='o_menuRapideForm' class='boite_amelioration simulateur centre'>
        <h2>Menu rapide</h2>
        <p class='reduce'>Choisis les raccourcis qui s'afficheront en bas de la boîte Toolzzz. Préférences sauvegardées localement (localStorage), partagées avec ton compte si tu repasses Compte+ un jour.</p>
        <table style='margin:0 auto;'><tr>${cols}</tr></table>
        <button type='button' id='o_menuRapideValider' class='o_button f_success o_marginT15'>Valider</button>
        <span id='o_menuRapideStatus' class='reduce' style='margin-left:12px;'></span>
      </div>`;
    let target = $("#cadre, #centre").last();
    if (target.length) target.append(html);
    else $("body").append(html);
    $("#o_menuRapideValider").click(() => {
      this._savePrefs();
      if (this._comptePlusBox) this._comptePlusBox.updateQuickMenuShortcuts();
      $("#o_menuRapideStatus").text("Préférences sauvegardées.");
      setTimeout(() => $("#o_menuRapideStatus").text(""), 2500);
    });
  }
  /**
   * @private
   * @method _readPrefs
   * @returns {Object}
   */
  _readPrefs() {
    try {
      return store.quickMenu.get();
    } catch (e) {
      return {};
    }
  }
  /**
   * @private
   * @method _savePrefs
   */
  _savePrefs() {
    let snapshot = {};
    QUICK_MENU.forEach((item) => {
      snapshot[item.name] = $("#" + item.name).is(":checked");
    });
    try {
      store.quickMenu.set(snapshot);
    } catch (e) {}
  }
}
