/**
 * Manages the toolbar shared by every Fourmizzz page.
 *
 * @class Outil
 * @constructor
 * @extends Box
 */
import { $ } from "~/vendor";
import { IMG_SPRITE_MENU } from "~/constants";
import { getProfile } from "~/models/currentPlayer";
import { HuntBox } from "~/boxes/Hunt";
import { BattleBox } from "~/boxes/Battle";
import { SettingsBox } from "~/boxes/Settings";
import { SpawnBox } from "~/boxes/Spawn";

export class Dock {
  // Fields declared for TypeScript (Phase 2 was a straight conversion; real
  // typing is deferred — see .claude/plans/wxt-migration-followups.md).
  static _mql: any;
  _html: any;
  _spawnBox: any;
  _huntBox: any;
  _battleBox: any;
  _settingsBox: any;
  constructor() {
    /**
     *
     */
    this._html = `<div id="o_toolbarOutiiil" ${getProfile().parametre["dockVisible"].valeur == 1 ? "" : "style='display:none'"}>
            <div id="o_toolbarItem1" class="o_toolbarItem" title="Ponte"><span id="o_itemPonte" style="background-image: url(${IMG_SPRITE_MENU})"/></div>
            <div id="o_toolbarItem2" class="o_toolbarItem" title="Chasse"><span id="o_itemChasse" style="background-image: url(${IMG_SPRITE_MENU})"/></div>
            <div id="o_toolbarItem3" class="o_toolbarItem" title="Combat"><span id="o_itemCombat" style="background-image: url(${IMG_SPRITE_MENU})"/></div>
            <div id="o_toolbarItem6" class="o_toolbarItem" title="Préférence"><span id="o_itemParametre" style="background-image: url(${IMG_SPRITE_MENU})"/></div>
            </div>`;
    /**
     *
     */
    this._spawnBox = new SpawnBox();
    /**
     *
     */
    this._huntBox = new HuntBox();
    /**
     *
     */
    this._battleBox = new BattleBox();
    /**
     *
     */
    this._settingsBox = new SettingsBox();
  }
  /**
   * Renders the box.
   *
   * @private
   * @method render
   */
  render() {
    $("body").append(this._html);
    $("#o_toolbarOutiiil .o_toolbarItem").tooltip({
      tooltipClass: "warning-tooltip",
      content: function () {
        return $(this).prop("title");
      },
      hide: { effect: "fade", duration: 10 },
    });
    Dock.applyPosition();
    // On mobile (narrow screen) there is no room on the right, so the toolbar
    // moves to the bottom even when the saved preference says "right". The
    // media query is watched so crossing the breakpoint live is handled too.
    Dock._mql.addEventListener("change", () => Dock.applyPosition());
    // hide the element according to the preference
    if (getProfile().parametre["dockVisible"].valeur == "0") {
      $(document).mousemove((e) => {
        if (Dock.isInBottom()) {
          if ($(window).height() - e.pageY < 60) $("#o_toolbarOutiiil").slideDown(500);
          else $("#o_toolbarOutiiil").slideUp(500);
        } else {
          if ($(window).width() - e.pageX < 60)
            $("#o_toolbarOutiiil").show("slide", { direction: "right" }, 500);
          else $("#o_toolbarOutiiil").hide("slide", { direction: "right" }, 500);
        }
      });
    }
    // click handler for a toolbar item
    $(".o_toolbarItem").click((e) => {
      // show the box
      switch ($(e.currentTarget).find("span").attr("id")) {
        case "o_itemPonte":
          this._spawnBox.render();
          break;
        case "o_itemChasse":
          this._huntBox.render();
          break;
        case "o_itemCombat":
          this._battleBox.render();
          break;
        case "o_itemParametre":
          this._settingsBox.render();
          break;
        default:
          break;
      }
    });
  }
  /**
   * Applies the dock position (class plus tooltip placement) from the
   * "dockPosition" preference. Can be called live when the player changes the
   * setting from the SettingsBox.
   *
   * @static
   * @method applyPosition
   */
  static applyPosition() {
    let isBottom = Dock.isInBottom();
    let position = isBottom
      ? { my: "center top", at: "center bottom+10" }
      : { my: "left+10 center", at: "right center" };
    $("#o_toolbarOutiiil")
      .toggleClass("o_toolbarBas", isBottom)
      .toggleClass("o_toolbarDroite", !isBottom)
      .find(".o_toolbarItem")
      .each((i, el) => {
        if ($(el).tooltip("instance")) $(el).tooltip("option", "position", position);
      });
  }
  /**
   * The dock's effective position is the player's preference, except on mobile
   * where "bottom" is forced because the vertical row on the right is not usable
   * on a narrow screen. The saved preference is left untouched.
   *
   * @static
   * @method isInBottom
   */
  static isInBottom() {
    return Dock._mql.matches || getProfile().parametre["dockPosition"].valeur == "1";
  }
}
Dock._mql = window.matchMedia("(max-width: 768px)");
