/*
 * Hunt.ts
 * Hraesvelg
 **********************************************************************/

import { browser } from "#imports";
import type { PublicPath } from "wxt/browser";

import { $, numeral } from "~/vendor";
import { WILDLIFE, TOAST_WARNING } from "~/constants";
import { getProfile } from "~/models/currentPlayer";
import { Box } from "~/boxes/Box";
import { Hunt } from "~/models/Hunt";

/**
 * Analyses, simulates and launches hunts.
 *
 * @class HuntBox
 * @constructor
 * @extends Box
 */
export class HuntBox extends Box {
  constructor() {
    super(
      "o_boiteChasse",
      "Outils pour Chasseur",
      `<div id='o_tabsChasse' class='o_tabs'><ul><li><a href='#o_tabsChasse1'>Analyser</a></li><li><a href='#o_tabsChasse2'>Bestiaire</a></li></ul><div id='o_tabsChasse1'/><div id='o_tabsChasse2'/></div>`,
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
      $("#o_tabsChasse")
        .tabs({
          activate: (event, ui) => {
            this.css();
          },
        })
        .removeClass("ui-widget");
      this.analyze().bestiary().css().event();
    }
  }
  /**
   * Applies the box's own styling.
   *
   * @private
   * @method css
   */
  override css() {
    super.css();
    $(
      "#o_resultatChasse tr:even, .o_tabs .ui-widget-header .ui-tabs-anchor, #o_bestiaireTable tr:even",
    ).css("background-color", getProfile().parametre["couleur2"].valeur);
    $(".o_tabs .ui-widget-header .ui-tabs-anchor").css(
      "background-color",
      getProfile().parametre["couleur2"].valeur,
    );
    $(".o_content a")
      .unbind("mouseenter mouseleave")
      .css("color", getProfile().parametre["couleurTexte"].valeur);
    $(".o_content li:not(.ui-state-active) a").css("color", "inherit");
    let matches = getProfile().parametre["couleurTexte"].valeur.match(
      /#([\da-f]{2})([\da-f]{2})([\da-f]{2})/i,
    );
    $(".o_content li:not(.ui-state-active):not(.ui-state-disabled) a").hover(
      (e) => {
        $(e.currentTarget).css(
          "color",
          "rgba(" +
            matches
              .slice(1)
              .map((m) => {
                return parseInt(m, 16);
              })
              .concat("0.5") +
            ")",
        );
      },
      (e) => {
        $(e.currentTarget).css("color", "inherit");
      },
    );
    $(".o_content .ui-state-disabled a").css({ cursor: "not-allowed", "pointer-events": "all" });
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
  /**
   * Form to analyse one or more hunts.
   *
   * @private
   * @method analyze
   */
  analyze() {
    $("#o_tabsChasse1").append(
      "<textarea id='o_rcChasse' class='o_maxWidth' placeholder='Rapport(s) de chasse(s)...'></textarea><div class='o_marginT15'><table  id='o_resultatChasse' class='o_maxWidth'></table></div>",
    );

    $("#o_rcChasse").on("input", (e) => {
      // collect the hunts to analyse
      let hunts = e.currentTarget.value.split("nourriture"),
        summary = new Hunt(""),
        hunt = null,
        erreur = false,
        html =
          "<tr class='gras'><td colspan='2'>Avant</td><td colspan='2'>Evolution</td><td colspan='2'>Résultat</td></tr>";
      // clear the previous output
      $("#o_resultatChasse").html("");
      for (let i = 0; i < hunts.length; i++) {
        if (hunts[i]) {
          hunt = new Hunt(hunts[i]);
          if (hunt.analyze()) {
            html += hunt.toBoxHtml(false);
            summary.add(hunt);
          } else {
            $.toast({ ...TOAST_WARNING, text: "Le rapport de chasse ne peut pas être analysé." });
            erreur = true;
          }
        }
      }
      if (!erreur) {
        $("#o_resultatChasse").append(html);
        this.renderSummary(summary);
      }
    });
    return this;
  }
  /**
   * Renders the data read from a hunt report.
   *
   * @private
   * @method afficherAnalyse
   * @param {Object} hunt
   * @param {Boolean} bilan
   */
  renderSummary(hunt) {
    let i = 0,
      html = "<tr><td colspan='6'><select id='o_choixChasse' class='o_marginT15'>";
    for (
      ;
      i < Math.floor($("#o_resultatChasse tr").length / 4);
      html += "<option value='" + i + "'>Chasse " + (i + 1) + "</option>", i++
    );
    html += "<option value='" + i + "' selected>Bilan</option></select></td></tr>";
    $("#o_resultatChasse").append(hunt.toBoxHtml(true) + html);
    // Styling
    $("#o_resultatChasse tr:even").css(
      "background-color",
      getProfile().parametre["couleur2"].valeur,
    );
    $("#o_choixChasse").change((e) => {
      let selection = e.currentTarget.value;
      $("#o_resultatChasse tr:gt(0):lt(-1):visible").toggle();
      $(
        "#o_resultatChasse tr:eq(" +
          (selection * 4 + 1) +
          "), #o_resultatChasse tr:eq(" +
          (selection * 4 + 2) +
          "), #o_resultatChasse tr:eq(" +
          (selection * 4 + 3) +
          "), #o_resultatChasse tr:eq(" +
          (selection * 4 + 4) +
          ")",
      ).toggle();
    });
  }
  /**
   * "Bestiaire" tab — the 17 wildlife species with their image and stats.
   * Table source: http://alliancead2.free.fr/Bestiaire.html (the WILDLIFE
   * constant, images bundled in public/images/faune/).
   *
   * @private
   * @method bestiary
   */
  bestiary() {
    let rows = WILDLIFE.map(
      (f) =>
        `<tr><td><img src="${browser.runtime.getURL(("/images/faune/" + f.slug + ".png") as PublicPath)}" height="32" alt="${f.nom}"/></td><td class="left">${f.nom}</td><td class="right">${numeral(f.fdf).format()}</td><td class="right">${numeral(f.vie).format()}</td><td class="right">${numeral(f.diff).format()}</td></tr>`,
    ).join("");
    $("#o_tabsChasse2").append(`
        <table id="o_bestiaireTable" class="o_maxWidth centre" cellspacing="0">
            <thead><tr><th></th><th>Espèce</th><th class="right">FdF</th><th class="right">Vie</th><th class="right">Difficulté</th></tr></thead>
            <tbody>${rows}</tbody>
            <tfoot><tr><td colspan="5" class="reduce"><em>Stats issues du <a href="http://alliancead2.free.fr/Bestiaire.html" target="_blank">Bestiaire</a> de Calystène (2017).</em></td></tr></tfoot>
        </table>`);
    return this;
  }
}
