/*
 * Spawn.ts
 * Hraesvelg
 **********************************************************************/

import { $, numeral } from "~/vendor";
import { UNIT_SHORT_NAMES, UNIT_TIME, TOAST_SUCCESS } from "~/constants";
import { Utils } from "~/lib/Utils";
import { getProfile } from "~/models/currentPlayer";
import { Box } from "~/boxes/Box";

/**
 * Builds and drives the spawn launcher.
 *
 * @class SpawnBox
 * @constructor
 * @extends Box
 */
export class SpawnBox extends Box {
  constructor() {
    let spawnTech = getProfile().getSpawnTech();
    super(
      "o_boitePonte",
      "Lanceur de Ponte",
      `<div id='o_ponteContent'><table class='o_maxWidth'>
                <tr class='gras'><td>Unité</td><td><img width='17' height='18' src='images/icone/icone_sablier.gif' alt='Durée :'/></td><td>Nombre</td><td>Jour</td><td>Heure</td><td>Minute</td><td>Seconde</td><td></td></tr>
                <tr><td>${UNIT_SHORT_NAMES[0]}</td><td>${SpawnBox.roundTime(UNIT_TIME[0] * Math.pow(0.9, spawnTech))}</td><td><input value='0' size='15' name='o_nombre0'/></td><td><input name='o_jour0' value='0' size='3'/></td><td><input name='o_heure0' value='0' size='2'/></td><td><input name='o_minute0' value='0' size='2'/></td><td><input name='o_seconde0' value='0' size='2'/></td><td class='cursor'><img id='o_lancer0' height='20' src='images/icone/fourmi.png' alt='Lancer'></td></tr>
                <tr><td>${UNIT_SHORT_NAMES[1]}</td><td>${SpawnBox.roundTime(UNIT_TIME[1] * Math.pow(0.9, spawnTech))}</td><td><input value='0' size='15' name='o_nombre1'/></td><td><input name='o_jour1' value='0' size='3'/></td><td><input name='o_heure1' value='0' size='2'/></td><td><input name='o_minute1' value='0' size='2'/></td><td><input name='o_seconde1' value='0' size='2'/></td><td class='cursor'>${getProfile().niveauConstruction[7] >= 1 ? "<img id='o_lancer1' height='20' src='images/icone/fourmi.png' alt='Lancer'>" : ""}</td></tr>
                <tr><td>${UNIT_SHORT_NAMES[2]}</td><td>${SpawnBox.roundTime(UNIT_TIME[2] * Math.pow(0.9, spawnTech))}</td><td><input value='0' size='15' name='o_nombre2'/></td><td><input name='o_jour2' value='0' size='3'/></td><td><input name='o_heure2' value='0' size='2'/></td><td><input name='o_minute2' value='0' size='2'/></td><td><input name='o_seconde2' value='0' size='2'/></td><td class='cursor'>${getProfile().niveauConstruction[7] >= 3 ? "<img id='o_lancer2' height='20' src='images/icone/fourmi.png' alt='Lancer'>" : ""}</td></tr>
                <tr><td>${UNIT_SHORT_NAMES[3]}</td><td>${SpawnBox.roundTime(UNIT_TIME[3] * Math.pow(0.9, spawnTech))}</td><td><input value='0' size='15' name='o_nombre3'/></td><td><input name='o_jour3' value='0' size='3'/></td><td><input name='o_heure3' value='0' size='2'/></td><td><input name='o_minute3' value='0' size='2'/></td><td><input name='o_seconde3' value='0' size='2'/></td><td class='cursor'>${getProfile().niveauConstruction[8] >= 4 ? "<img id='o_lancer3' height='20' src='images/icone/fourmi.png' alt='Lancer'>" : ""}</td></tr>
                <tr><td>${UNIT_SHORT_NAMES[4]}</td><td>${SpawnBox.roundTime(UNIT_TIME[4] * Math.pow(0.9, spawnTech))}</td><td><input value='0' size='15' name='o_nombre4'/></td><td><input name='o_jour4' value='0' size='3'/></td><td><input name='o_heure4' value='0' size='2'/></td><td><input name='o_minute4' value='0' size='2'/></td><td><input name='o_seconde4' value='0' size='2'/></td><td class='cursor'>${getProfile().niveauConstruction[7] >= 7 ? "<img id='o_lancer4' height='20' src='images/icone/fourmi.png' alt='Lancer'>" : ""}</td></tr>
                <tr><td>${UNIT_SHORT_NAMES[5]}</td><td>${SpawnBox.roundTime(UNIT_TIME[5] * Math.pow(0.9, spawnTech))}</td><td><input value='0' size='15' name='o_nombre5'/></td><td><input name='o_jour5' value='0' size='3'/></td><td><input name='o_heure5' value='0' size='2'/></td><td><input name='o_minute5' value='0' size='2'/></td><td><input name='o_seconde5' value='0' size='2'/></td><td class='cursor'>${getProfile().niveauConstruction[8] >= 9 ? "<img id='o_lancer5' height='20' src='images/icone/fourmi.png' alt='Lancer'>" : ""}</td></tr>
                <tr><td>${UNIT_SHORT_NAMES[6]}</td><td>${SpawnBox.roundTime(UNIT_TIME[6] * Math.pow(0.9, spawnTech))}</td><td><input value='0' size='15' name='o_nombre6'/></td><td><input name='o_jour6' value='0' size='3'/></td><td><input name='o_heure6' value='0' size='2'/></td><td><input name='o_minute6' value='0' size='2'/></td><td><input name='o_seconde6' value='0' size='2'/></td><td class='cursor'>${getProfile().niveauConstruction[7] >= 10 && getProfile().niveauRecherche[7] >= 5 ? "<img id='o_lancer6' height='20' src='images/icone/fourmi.png' alt='Lancer'>" : ""}</td></tr>
                <tr><td>${UNIT_SHORT_NAMES[8]}</td><td>${SpawnBox.roundTime(UNIT_TIME[8] * Math.pow(0.9, spawnTech))}</td><td><input value='0' size='15' name='o_nombre8'/></td><td><input name='o_jour8' value='0' size='3'/></td><td><input name='o_heure8' value='0' size='2'/></td><td><input name='o_minute8' value='0' size='2'/></td><td><input name='o_seconde8' value='0' size='2'/></td><td class='cursor'>${getProfile().niveauConstruction[7] >= 11 && getProfile().niveauRecherche[8] >= 1 ? "<img id='o_lancer8' height='20' src='images/icone/fourmi.png' alt='Lancer'>" : ""}</td></tr>
                <tr><td>${UNIT_SHORT_NAMES[9]}</td><td>${SpawnBox.roundTime(UNIT_TIME[9] * Math.pow(0.9, spawnTech))}</td><td><input value='0' size='15' name='o_nombre9'/></td><td><input name='o_jour9' value='0' size='3'/></td><td><input name='o_heure9' value='0' size='2'/></td><td><input name='o_minute9' value='0'  size='2'/></td><td><input name='o_seconde9' value='0' size='2'/></td><td class='cursor'>${getProfile().niveauConstruction[8] >= 13 && getProfile().niveauRecherche[8] >= 5 ? "<img id='o_lancer9' height='20' src='images/icone/fourmi.png' alt='Lancer'>" : ""}</td></tr>
                <tr><td>${UNIT_SHORT_NAMES[10]}</td><td>${SpawnBox.roundTime(UNIT_TIME[10] * Math.pow(0.9, spawnTech))}</td><td><input value='0' size='15' name='o_nombre10'/></td><td><input name='o_jour10' value='0' size='3'/></td><td><input name='o_heure10' value='0' size='2'/></td><td><input name='o_minute10' value='0' size='2'/></td><td><input name='o_seconde10' value='0' size='2'/></td><td class='cursor'>${getProfile().niveauConstruction[8] >= 17 ? "<img id='o_lancer10' height='20' src='images/icone/fourmi.png' alt='Lancer'>" : ""}</td></tr>
                <tr><td>${UNIT_SHORT_NAMES[11]}</td><td>${SpawnBox.roundTime(UNIT_TIME[11] * Math.pow(0.9, spawnTech))}</td><td><input value='0' size='15' name='o_nombre11'/></td><td><input name='o_jour11' value='0' size='3'/></td><td><input name='o_heure11' value='0' size='2'/></td><td><input name='o_minute11' value='0' size='2'/></td><td><input name='o_seconde11' value='0' size='2'/></td><td class='cursor'>${getProfile().niveauConstruction[8] >= 23 && getProfile().niveauRecherche[7] >= 15 ? "<img id='o_lancer11' height='20' src='images/icone/fourmi.png' alt='Lancer'>" : ""}</td></tr>
                <tr><td>${UNIT_SHORT_NAMES[13]}</td><td>${SpawnBox.roundTime(UNIT_TIME[13] * Math.pow(0.9, spawnTech))}</td><td><input value='0' size='15' name='o_nombre13'/></td><td><input name='o_jour13' value='0' size='3'/></td><td><input name='o_heure13' value='0' size='2'/></td><td><input name='o_minute13' value='0' size='2'/></td><td><input name='o_seconde13' value='0' size='2'/></td><td class='cursor'>${getProfile().niveauConstruction[7] >= 25 && getProfile().niveauRecherche[9] >= 4 ? "<img id='o_lancer13' height='20' src='images/icone/fourmi.png' alt='Lancer'>" : ""}</td></tr>
                <tr><td>${UNIT_SHORT_NAMES[14]}</td><td>${SpawnBox.roundTime(UNIT_TIME[14] * Math.pow(0.9, spawnTech))}</td><td><input value='0' size='15' name='o_nombre14'/></td><td><input name='o_jour14' value='0' size='3'/></td><td><input name='o_heure14' value='0' size='2'/></td><td><input name='o_minute14' value='0' size='2'/></td><td><input name='o_seconde14' value='0' size='2'/></td><td class='cursor'>${getProfile().niveauConstruction[8] >= 28 && getProfile().niveauRecherche[9] >= 7 ? "<img id='o_lancer14' height='20' src='images/icone/fourmi.png' alt='Lancer'>" : ""}</td></tr>
                <tr><td colspan='8' class='centre'>Destination : <label><input type='radio' name='o_destination' value='1'/> Terrain</label> <label><input type='radio' name='o_destination' value='2' checked/> Fourmilière</label> <label><input type='radio' name='o_destination' value='3'/> Loge</label></td></tr>
                <tr><td colspan='8'>Temps de ponte : <input id='o_niveauTDP' value='${spawnTech}' size='3'/></td></tr>
            </table></div>`,
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
      // Spinner formatting
      $("input[name^='o_nombre'], input[name^='o_jour']").spinner({ min: 0, numberFormat: "i" });
      $("input[name^='o_heure'], input[name^='o_minute'], input[name^='o_seconde']").spinner({
        min: 0,
        numberFormat: "d2",
      });
      $("#o_niveauTDP").spinner({ min: 0, max: 150 });
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
    $("#o_ponteContent table tr:even").css(
      "background-color",
      getProfile().parametre["couleur2"].valeur,
    );
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
    $("input[name^='o_nombre']").on("input spin", (e, ui) => {
      let count = numeral(ui ? ui.value : e.currentTarget.value).value();
      // update the time
      this.updateTime(
        parseInt($(e.currentTarget).attr("name").replace("o_nombre", "")),
        count *
          (UNIT_TIME[
            UNIT_SHORT_NAMES.indexOf($(e.currentTarget).closest("tr").find("td:first").text())
          ] *
            Math.pow(0.9, ~~$("#o_niveauTDP").spinner("value"))),
      );
      $(e.currentTarget).spinner("value", count);
    });
    $("input[name^='o_seconde']").on("input spin", (e, ui) => {
      let unite = parseInt($(e.currentTarget).attr("name").replace("o_seconde", ""));
      let seconde = ui ? ui.value : $(e.currentTarget).spinner("value");
      if (seconde >= 60) {
        $(e.currentTarget).spinner("value", seconde - 60);
        $("input[name='o_minute" + unite + "']").spinner("stepUp");
        return false;
      }
      // update the count
      this.updateCount(unite, -1, -1, -1, seconde);
    });
    $("input[name^='o_minute']").on("input spin", (e, ui) => {
      let unite = parseInt($(e.currentTarget).attr("name").replace("o_minute", ""));
      let minute = ui ? ui.value : $(e.currentTarget).spinner("value");
      if (minute >= 60) {
        $(e.currentTarget).spinner("value", minute - 60);
        $("input[name='o_heure" + unite + "']").spinner("stepUp");
        return false;
      }
      // update the count
      this.updateCount(unite, -1, -1, minute, -1);
    });
    $("input[name^='o_heure']").on("input spin", (e, ui) => {
      let unite = parseInt($(e.currentTarget).attr("name").replace("o_heure", ""));
      let hour = ui ? ui.value : $(e.currentTarget).spinner("value");
      if (hour >= 24) {
        $(e.currentTarget).spinner("value", hour - 24);
        $("input[name='o_jour" + unite + "']").spinner("stepUp");
        return false;
      }
      // update the count
      this.updateCount(unite, -1, hour, -1, -1);
    });
    $("input[name^='o_jour']").on("input spin", (e, ui) => {
      let day = ui ? ui.value : $(e.currentTarget).spinner("value");
      // update the count
      this.updateCount(
        parseInt($(e.currentTarget).attr("name").replace("o_jour", "")),
        day,
        -1,
        -1,
        -1,
      );
      $(e.currentTarget).spinner("value", day);
    });
    // spawn time events
    $("#o_niveauTDP").on("input spin", (e, ui) => {
      let spawnTech = ui ? ui.value : $(e.currentTarget).spinner("value");
      $("input[name^='o_nombre']").each((i, elt) => {
        // Update the time for every unit
        let unite = parseInt($(elt).attr("name").replace("o_nombre", ""));
        $(elt)
          .parent()
          .parent()
          .prev()
          .text(SpawnBox.roundTime(UNIT_TIME[unite] * Math.pow(0.9, spawnTech)));
        let count = $(elt).spinner("value");
        // update the time
        if (count) this.updateTime(unite, count * (UNIT_TIME[unite] * Math.pow(0.9, spawnTech)));
      });
    });
    // Launch the spawns
    $("img[id^=o_lancer]").click((e) => {
      let unite = ~~$(e.currentTarget).attr("id").replace("o_lancer", ""),
        count = $("input[name='o_nombre" + unite + "']").spinner("value"),
        securite = "";
      let correspondanceFzzz = new Array<any>("", 1, 2, 3, 4, 5, 6, -1, 7, 8, 9, 10, -1, 11, 12);
      if (count) {
        // grab a token
        $.ajax({ url: location.origin + "/Reine.php" }).then((data) => {
          let parsed = Utils.parseHtml(data);
          securite = parsed.find("#t").attr("name") + "=" + parsed.find("#t").attr("value");
          // prepare and launch the spawn
          let donnees = {};
          donnees["destination"] = $("input[name='o_destination']:checked").val();
          donnees["unePonte"] = "oui";
          donnees["typeUnite"] = unite ? "unite" + correspondanceFzzz[unite] : "ouvriere";
          donnees["input_cout_nombre" + (unite ? correspondanceFzzz[unite] : "")] = count;
          donnees["nombre_de_ponte"] = count;
          donnees["" + securite.split("=")[0]] = securite.split("=")[1];
          $.post(location.origin + "/Reine.php", donnees, (data) => {
            let parsed = Utils.parseHtml(data);
            $("#boiteInfo").fadeOut("slow").html(parsed.find("#boiteInfo").html()).fadeIn("slow");
            if (Utils.comptePlus)
              $("#boiteComptePlus")
                .fadeOut("slow")
                .html(parsed.find("#boiteComptePlus").html())
                .fadeIn("slow");
            $.toast({ ...TOAST_SUCCESS, text: "La ponte a été correctement lancée." });
            $("input[name='o_nombre" + unite + "']").spinner("value", 0);
          });
        });
      }
      return false;
    });
    return this;
  }
  /**
   * Updates the unit count after the time changed.
   *
   * @private
   * @method updateCount
   * @param {String} unite
   * @param {Integer} day
   * @param {Integer} hour
   * @param {Integer} minute
   * @param {Integer} seconde
   */
  updateCount(unite, day, hour, minute, seconde) {
    let countDay = day < 0 ? $("input[name='o_jour" + unite + "']").spinner("value") : day;
    let countHour = hour < 0 ? $("input[name='o_heure" + unite + "']").spinner("value") : hour;
    let countMinute =
      minute < 0 ? $("input[name='o_minute" + unite + "']").spinner("value") : minute;
    let countSeconde =
      seconde < 0 ? $("input[name='o_seconde" + unite + "']").spinner("value") : seconde;
    let time = countDay * 86400 + countHour * 3600 + countMinute * 60 + countSeconde;
    $("input[name='o_nombre" + unite + "']").spinner(
      "value",
      Math.round(time / (UNIT_TIME[unite] * Math.pow(0.9, ~~$("#o_niveauTDP").val()))),
    );
    return this;
  }
  /**
   * Updates the spinners after a unit's spawn changed.
   *
   * @private
   * @method updateTime
   * @param {String} i
   * @param {Integer} time
   */
  updateTime(i, time) {
    // count the days
    $("input[name='o_jour" + i + "']").spinner("value", (time - (time % 86400)) / 86400);
    time %= 86400;
    // count the remaining hours
    $("input[name='o_heure" + i + "']").spinner("value", (time - (time % 3600)) / 3600);
    time %= 3600;
    // count the remaining minutes
    $("input[name='o_minute" + i + "']").spinner("value", (time - (time % 60)) / 60);
    time = Math.round(time % 60);
    // only seconds left
    $("input[name='o_seconde" + i + "']").spinner("value", time);
    return this;
  }
  /**
   *
   */
  static roundTime(time) {
    if (time < 0.05) return time.toPrecision(3);
    if (time < 1) return time.toPrecision(2);
    if (time < 10) return time.toPrecision(3);
    return Math.round(time);
  }
}
