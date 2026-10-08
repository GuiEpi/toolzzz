/*
 * Queen.ts
 * Hraesvelg
 **********************************************************************/

import { $, moment, numeral } from "~/vendor";
import {
  UNIT_ATTACK,
  UNIT_COST,
  UNIT_DEFENSE,
  IMG_ATT,
  IMG_DEF,
  IMG_HP,
  UNIT_NAMES,
  UNIT_NAMES_PLURAL,
  UNIT_TIME,
  UNIT_HP,
} from "~/constants";
import { Utils } from "~/lib/Utils";
import { getProfile } from "~/models/currentPlayer";
import { Army } from "~/models/Army";

/**
 * Enriches the /Reine.php page.
 *
 * @class QueenPage
 * @constructor
 * @extends Page
 */
export class QueenPage {
  // Fields declared for TypeScript (Phase 2 was a straight conversion; real
  // typing is deferred — see .claude/plans/wxt-migration-followups.md).
  _comptePlusBox: any;
  constructor(boxComptePlus) {
    /**
     * access to the ComptePlus box
     */
    this._comptePlusBox = boxComptePlus;
  }
  /**
   * Reworks the input fields and saves the running spawn.
   * @method plus
   */
  plus() {
    // show when the spawns end
    $(".tableau_leger tr:eq(0)").append("<td><strong>Terminé le</strong></td>");
    $(".tableau_leger tr:gt(0)").each((i, elt) => {
      $(elt).append(
        `<td>${Utils.roundMinute($(elt).next().text().split(",")[0].split("(")[1]).format("D MMM YYYY à HH[h]mm")}</td>`,
      );
    });
    $(
      "span[id^='bouton_cout_nombre'], span[id^='bouton_cout_temps'], span[id^='bouton_cout_nourriture'], .icones_unite",
    ).addClass("cliquable3");
    $(".icones_unite").attr("onclick", "$('.tab_stat').toggle();");
    // add the unit stats including bonuses
    $(".icones_unite").each((i, elt) => {
      let index = UNIT_NAMES.indexOf($(elt).parent().find("h2").text());
      $(elt).append(
        `<table class="tab_stat" style="display: none;"><tbody><tr><td style="text-align:center;font-size:0.8em;height:30px;" colspan="2"> Avec Bonus</td></tr><tr title="Vie avec Bouclier niveau ${getProfile().niveauRecherche[1]}"><td class="icone_vie" style="position:relative; top:4px">${IMG_HP}</td><td class="vie" style="white-space:nowrap">${UNIT_HP[index] + Number(((UNIT_HP[index] / 10) * getProfile().niveauRecherche[1]).toFixed(1))}</td></tr><tr title="Dégâts en Attaque avec Armes niveau ${getProfile().niveauRecherche[2]}"><td class="icone_degat_attaque" style="position:relative;top:3px">${IMG_ATT}</td><td class="degat_defense" style="white-space:nowrap">${UNIT_ATTACK[index] + Number(((UNIT_ATTACK[index] / 10) * getProfile().niveauRecherche[2]).toFixed(1))}</td></tr><tr title="Dégâts en Défense avec Armes niveau ${getProfile().niveauRecherche[2]}"><td class="icone_degat_defense" style="position:relative;top:3px">${IMG_DEF}</td><td class="degat_defense" style="white-space:nowrap">${UNIT_DEFENSE[index] + Number(((UNIT_DEFENSE[index] / 10) * getProfile().niveauRecherche[2]).toFixed(1))}</td></tr><tr><td style="height:30px;" colspan="2"></td></tr></tbody></table>`,
      );
    });
    // Switching between inputs: clicking a span-button opens its input and
    // closes the others. The game's own markup calls `ouvrir_input` /
    // `fermer_input` through inline `onclick` / `onblur`,
    // mais ces fonctions semblent C+-only — chez nous elles peuvent throw
    // silently and block the rest. The inline attributes are removed so only our
    // own jQuery handlers (below) are in charge.
    $(
      "span[id^='bouton_cout_nombre'], span[id^='bouton_cout_temps'], span[id^='bouton_cout_nourriture']",
    ).removeAttr("onclick");
    $(
      "input[id^='input_cout_nombre'], input[id^='input_cout_temps'], input[id^='input_cout_nourriture']",
    )
      .removeAttr("onblur")
      .removeAttr("onkeyup");
    // The game's free-account HTML forgets height/width on #cout_nombre while
    // cout_temps and cout_nourriture have them, so the ant span resizes to its
    // content and breaks the visual alignment with the other two
    // autres. On aligne ici.
    $("span[id^='cout_nombre']").css({ height: "20px", width: "85px" });
    // Forced initial state: every span visible, every input hidden. Without it,
    // the game's number input can show up already open on load instead of the
    // compact display used on ComptePlus.
    $("span[id^='cout_nombre'], span[id^='cout_temps'], span[id^='cout_nourriture']").css(
      "display",
      "inline-block",
    );
    $(
      "input[id^='input_cout_nombre'], input[id^='input_cout_temps'], input[id^='input_cout_nourriture']",
    ).hide();
    let element = ["cout_nombre", "cout_temps", "cout_nourriture"];
    for (let i = 0; i < 3; i++) {
      $("span[id^='bouton_" + element[i] + "']").click((e) => {
        let j = $(e.currentTarget).attr("id").match(/\d+/)
          ? $(e.currentTarget).attr("id").match(/\d+/)
          : "";

        $("#input_" + element[i] + j).val($("#" + element[i] + j).text());
        $("#input_" + element[i] + j)
          .show()
          .focus();

        $("#" + element[(i + 1) % 3] + j + ", #" + element[(i + 2) % 3] + j).css(
          "display",
          "inline-block",
        );
        $(
          "#" +
            element[i] +
            j +
            ", #input_" +
            element[(i + 1) % 3] +
            j +
            ", #input_" +
            element[(i + 2) % 3] +
            j,
        ).hide();
      });
    }
    // Blur handler: closes the input and restores the span when the player
    // leaves the field (clicking elsewhere, Tab, …). Delegated on document so it
    // also covers the inputs created dynamically below (cout_temps /
    // cout_nourriture).
    $(document).on(
      "blur",
      "input[id^='input_cout_nombre'], input[id^='input_cout_temps'], input[id^='input_cout_nourriture']",
      (e) => {
        let id = $(e.currentTarget).attr("id"),
          m = id.match(/^input_(cout_(?:nombre|temps|nourriture))(\d*)$/);
        if (!m) return;
        $(e.currentTarget).hide();
        $("#" + m[1] + m[2]).css("display", "inline-block");
      },
    );
    // spawn time handling
    $("span[id^='bouton_cout_temps']").each((i, elt) => {
      $(elt).append(
        `<input id="input_cout_temps${i == 0 ? "" : i}" class="tooltip_droite" type="text" style="height: 20px; width: 85px;display:none;" title="Ex: 1.5 jour, 1j 12h, 36h" value="${$(elt).find("span[id^='cout_temps']").text()}"/>`,
      );
    });
    $("input[id^='input_cout_temps']").on("input", (e) => {
      let i = $(e.currentTarget).attr("id").match(/\d+/)
          ? $(e.currentTarget).attr("id").match(/\d+/)
          : "",
        count = parseInt(
          String(
            Utils.timeToInt(e.currentTarget.value) /
              (UNIT_TIME[i == "" ? 0 : i] * Math.pow(0.9, getProfile().getSpawnTech())),
          ),
        );
      $("#cout_nombre" + i).text(numeral(count).format());
      $("#nombre_de_ponte" + i).attr("value", count);
      $("#cout_temps" + i).text(e.currentTarget.value);
      $("#cout_nourriture" + i).text(numeral(count * UNIT_COST[i == "" ? 0 : i]).format("0 a"));
    });
    // spawn consumption handling
    $("span[id^='bouton_cout_nourriture']").each((i, elt) => {
      $(elt).append(
        `<input id="input_cout_nourriture${i == 0 ? "" : i}" class="tooltip_droite" type="tel" style="height: 20px; width: 85px; display: none;" title="Ex: 100 000, 100k, 0.1M" value="${$(elt).find("span[id^='cout_nourriture']").text()}"/>`,
      );
    });
    $("input[id^='input_cout_nourriture']").on("input", (e) => {
      let i = $(e.currentTarget).attr("id").match(/\d+/)
          ? $(e.currentTarget).attr("id").match(/\d+/)
          : "",
        count = Math.floor(numeral(e.currentTarget.value).value() / UNIT_COST[i == "" ? 0 : i]);
      $("#cout_nombre" + i).text(numeral(count).format());
      $("#nombre_de_ponte" + i).attr("value", count);
      $("#cout_temps" + i).text(
        Utils.intToTime(
          (count * (UNIT_TIME[i == "" ? 0 : i] * Math.pow(0.9, getProfile().getSpawnTech())),
          count),
        ),
      );
      $("#cout_nourriture" + i).text(e.currentTarget.value);
    });
    // Spawn slider (the equivalent of the ComptePlus one) — only for unlocked
    // units, recognised by the presence of the input_cout_nombre field. Range 1 →
    // the 7-day maximum, as on ComptePlus.
    const SECONDES_7J = 7 * 24 * 3600;
    $("input[id^='input_cout_nombre']").each((idx, input) => {
      let suffix = $(input).attr("id").replace("input_cout_nombre", ""),
        iUnit = suffix === "" ? 0 : parseInt(suffix),
        timeByUnit = UNIT_TIME[iUnit] * Math.pow(0.9, getProfile().getSpawnTech()),
        max7j = Math.floor(SECONDES_7J / timeByUnit),
        sliderId = "o_sliderPonte" + suffix,
        step = 0,
        slidMax = 0;
      // Updates the displays and the hidden field the game submits. The input is
      // only rewritten when the value did not come from it (while typing).
      let sync = (count, depuisSaisie = false) => {
        $("#cout_nombre" + suffix).text(numeral(count).format());
        if (!depuisSaisie) $("#input_cout_nombre" + suffix).val(count);
        $("#nombre_de_ponte" + suffix)
          .val(count)
          .attr("value", count);
        $("#cout_temps" + suffix).text(Utils.intToTime(count * timeByUnit));
        $("#cout_nourriture" + suffix).text(numeral(count * UNIT_COST[iUnit]).format("0 a"));
      };
      // Typing the number: the game's onkeyup was removed above, and without
      // this relay the hidden field would keep the slider's value and the game
      // would spawn that number (issue #24). Accepts 30 000, 30k, 0.5M.
      $(input).on("input", (e) => {
        let count = Math.max(0, Math.floor(numeral(e.currentTarget.value).value() || 0));
        sync(count, true);
        if (slidMax)
          $("#" + sliderId).slider("value", count >= max7j ? slidMax : Math.max(1, count));
      });
      if (max7j < 1) return;
      $(input)
        .closest("form")
        .find("table:first tbody")
        .prepend(
          `<tr><td colspan="2"><div id="${sliderId}" class="slider tooltip_haut" title="Vous pouvez aussi cliquer sur les nombres." style="margin:3px;margin-right:12px;"></div></td></tr>`,
        );
      // 20 visible stops along the track. jQuery UI needs (max - min) to be an
      // exact multiple of step to snap cleanly, so `slidMax` is aligned on
      // `1 + 20*step` and the last position is remapped to `max7j` to land on
      // exactly 7 days.
      const PALIERS = 20;
      step = Math.max(1, Math.floor((max7j - 1) / PALIERS));
      slidMax = 1 + PALIERS * step;
      $("#" + sliderId).slider({
        min: 1,
        max: slidMax,
        value: 1,
        step: step,
        // Snap to max7j as soon as the handle is in the last notch, not only on
        // the exact value: on Firefox the bar sometimes stops one stop short of
        // slidMax, which stopped the strict equality from matching and showed
        // ~6d instead of 7d on the last notch.
        slide: (event, ui) => sync(ui.value >= slidMax - step ? max7j : ui.value),
      });
      // Initial sync: without this call the number/time/food displays keep the
      // game's state (typically 0, or the running spawn's value) while the slider
      // sits at 1 — a visual inconsistency.
      sync(1);
    });
    // save the running spawn
    let listSpawn = new Array();
    for (let i = 1, l = $(".tableau_leger:eq(0) tr").length; i < l; i++) {
      let unite = $(".tableau_leger:eq(0) tr:eq(" + i + ") td:eq(0)")
          .text()
          .replace(/[0-9]+/g, "")
          .trim(),
        count = parseInt(
          $(".tableau_leger:eq(0) tr:eq(" + i + ") td:eq(0)")
            .text()
            .replace(/\D+/g, ""),
        ),
        time = Utils.timeToInt($(".tableau_leger:eq(0) tr:eq(" + i + ") td:eq(3)").text());
      listSpawn.push({
        unite: unite.substr(0, 1).toUpperCase() + unite.substr(1),
        nombre: count,
        exp: moment().add(time, "s"),
      });
    }
    // check whether the data is already recorded
    if (listSpawn.length) this.saveSpawns(listSpawn);
    return this;
  }
  /**
   * Shows how many of each unit the player owns next to its name (in a span
   * after the <h2>, not inside, so it stays small), shortened
   * (12,3k, 1,5M, 2G… see Utils.shortNumber) with the exact count on hover. The workers come from
   * the header, the army from Armee.php.
   * @method unitCounts
   */
  unitCounts() {
    let show = (index, count) => {
      $("h2")
        .filter((i, elt) => $(elt).text().trim() == UNIT_NAMES[index])
        .after(
          `<span class="o_nbUnite" title="${numeral(count).format()} ${count > 1 ? UNIT_NAMES_PLURAL[index] : UNIT_NAMES[index]}">${Utils.shortNumber(count)}</span>`,
        );
    };
    show(0, Utils.ouvrieres || 0);
    let army = new Army();
    army.getArmy().then((data) => {
      army.loadData(data);
      army.unite.forEach((count, i) => show(i + 1, count));
    });
    return this;
  }
  /**
   * Saves the running spawn.
   * @method saveSpawns
   */
  saveSpawns(listSpawn) {
    if (
      !this._comptePlusBox.ponte ||
      this._comptePlusBox.ponte.length != listSpawn.length ||
      (listSpawn[0]["exp"].diff(this._comptePlusBox.ponte[0]["exp"], "s") > 1 &&
        !Utils.comptePlus &&
        $("#boiteComptePlus").length)
    ) {
      this._comptePlusBox.ponte = listSpawn;
      this._comptePlusBox.startPonte = moment();
      this._comptePlusBox.save().updateSpawn();
    }
    return this;
  }
}
