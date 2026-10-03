/*
 * Report.ts
 * Hraesvelg
 **********************************************************************/

import { Box } from "~/boxes/Box";

/**
 * Displays a battle report.
 *
 * @class RankBox
 * @constructor
 * @extends Box
 */
export class ReportBox extends Box {
  constructor(id, contenu) {
    super(
      "o_boiteRapport" + id,
      "Rapport de combat",
      "<div class='o_contentRapport'>" + contenu + "</div>",
    );
  }
  /**
   * Renders the box.
   *
   * @private
   * @method render
   */
  override render() {
    if (super.render()) {
      this.css().event();
    }
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
    return this;
  }
}
