/*
 * Box.ts
 * Hraesvelg
 **********************************************************************/

import { $ } from "~/vendor";
import { EFFECTS } from "~/constants";
import { getProfile } from "~/models/currentPlayer";

/**
 * Base class for the floating boxes.
 *
 * @class Box
 * @constructor
 */
export class Box {
  // Fields declared for TypeScript (Phase 2 was a straight conversion; real
  // typing is deferred — see .claude/plans/wxt-migration-followups.md).
  _id: any;
  _title: any;
  _content: any;
  constructor(idBox, title, content = "") {
    /**
     * box id.
     *
     * @private
     * @property titre
     * @type string
     */
    this._id = idBox;
    /**
     * box title.
     *
     * @private
     * @property titre
     * @type string
     */
    this._title = title;
    /**
     * box HTML content.
     *
     * @private
     * @property content
     * @type string
     */
    this._content = content;
  }
  /**
   * Removes the box.
   *
   * @private
   * @method desctructor
   */
  destructor() {
    $("#" + this._id).remove();
  }
  /**
   * Renders the box.
   *
   * @private
   * @method render
   */
  // Return type is deliberately `any`: the base returns a boolean (was the box
  // created?) while subclasses return `this` or nothing.
  render(): any {
    let bCreate = false;
    if (!$("#" + this._id).length) {
      $("body").append(
        `<div id='${this._id}' class='o_content'><span class='o_titre'>${this._title}</span><div id="${this._id}Close" class='o_close'><b/><b/><b/><b/></div>${this._content}</div>`,
      );
      $("#" + this._id)
        .css({ top: Math.random() * 100 + 50 + "px", left: Math.random() * 250 + 100 + "px" })
        .draggable({ handle: ".o_titre", stack: "div", containment: "window" });
      bCreate = true;
    }
    $("#" + this._id).show(
      EFFECTS[getProfile().parametre["boiteShow"].valeur].toLowerCase(),
      () => {
        $(".o_content").css({
          "background-color": getProfile().parametre["couleur1"].valeur,
          "border-color": getProfile().parametre["couleur3"].valeur,
        });
        if (bCreate) {
          // On first display, if the random top/left put the box outside the
          // viewport (mobile or small screen), move it back into view.
          const $box = $("#" + this._id);
          const rect = $box[0].getBoundingClientRect();
          if (rect.right > window.innerWidth) {
            $box.css("left", Math.max(0, window.innerWidth - rect.width - 10) + "px");
          }
          if (rect.bottom > window.innerHeight) {
            $box.css("top", Math.max(0, window.innerHeight - rect.height - 10) + "px");
          }
        }
      },
    );
    return bCreate;
  }
  /**
   * Hides the box with a slide effect.
   *
   * @private
   * @method hide
   */
  hide() {
    $("#" + this._id).hide(EFFECTS[getProfile().parametre["boiteHide"].valeur].toLowerCase());
    return this;
  }
  /**
   * Applies the box's own styling.
   *
   * @private
   * @method css
   */
  css() {
    $(".o_titre").css("color", getProfile().parametre["couleurTitre"].valeur);
    $(".o_content").css({
      "background-color": getProfile().parametre["couleur1"].valeur,
      "border-color": getProfile().parametre["couleur3"].valeur,
    });
    $(".o_close b:nth-child(1)").css("border-top-color", getProfile().parametre["couleur1"].valeur);
    $(".o_close b:nth-child(2)").css(
      "border-left-color",
      getProfile().parametre["couleur1"].valeur,
    );
    $(".o_close b:nth-child(3)").css(
      "border-bottom-color",
      getProfile().parametre["couleur1"].valeur,
    );
    $(".o_close b:nth-child(4)").css(
      "border-right-color",
      getProfile().parametre["couleur1"].valeur,
    );
    $(".o_close")
      .css("background-color", getProfile().parametre["couleur2"].valeur)
      .hover(
        (e) => {
          $(e.currentTarget).animate({ "background-color": "#bb3333" }, 400);
        },
        (e) => {
          $(e.currentTarget).animate(
            { "background-color": getProfile().parametre["couleur2"].valeur },
            400,
          );
        },
      );
    $(".o_tabs > .ui-widget-header").css(
      "border-bottom-color",
      getProfile().parametre["couleur2"].valeur,
    );
    $(".o_content p, .o_content .o_label, .o_content label, .o_content table").css(
      "color",
      getProfile().parametre["couleurTexte"].valeur,
    );
    return this;
  }
  /**
   * Wires up the box's own events.
   *
   * @private
   * @method event
   */
  event() {
    $("#" + this._id + "Close").click((e) => {
      this.hide();
    });
    return this;
  }
}
