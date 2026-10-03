/*
 * Rapport.ts
 * Hraesvelg
 **********************************************************************/

import { Box } from "~/boxes/Box";

/**
 * Classe permettant d'afficher un RC.
 *
 * @class BoiteRang
 * @constructor
 * @extends Boite
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
   * Affiche la boite.
   *
   * @private
   * @method afficher
   */
  override render() {
    if (super.render()) {
      this.css().event();
    }
    return this;
  }
  /**
   * Applique le style propre à la boite.
   *
   * @private
   * @method css
   */
  override css() {
    super.css();
    return this;
  }
  /**
   * Ajoute les evenements propres à la boite.
   *
   * @private
   * @method event
   */
  override event() {
    super.event();
    return this;
  }
}
