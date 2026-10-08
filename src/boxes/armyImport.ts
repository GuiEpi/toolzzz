/*
 * armyImport.ts
 * "Importer une Armée" dialog, shared by the boxes that take an army as input.
 **********************************************************************/

import { $ } from "~/vendor";
import { Army } from "~/models/Army";

// The dialog is built once; each opening says where the parsed army goes.
let onImport: ((army: Army) => void) | null = null;

/**
 * Opens the dialog and hands the parsed army to `callback` on "Valider".
 *
 * @method openArmyImport
 * @param {Function} callback
 */
export function openArmyImport(callback: (army: Army) => void) {
  onImport = callback;
  if ($("#o_divccarmee").length) {
    $("#o_divccarmee").show();
    return;
  }
  $("body").append(`<div class="voile" id="o_divccarmee">
            <div class="message_voile">
                Importer une Armée
                <textarea id="o_textAreaArmee" name="textAreaArmee" rows="9" cols="50" style="width:100%;"></textarea>
                <p>
                    <input id="o_annulerCopie" type="button" value="Annuler"/>
                    <input id="o_afficherAide" type="button" value="Aide"/>
                    <input id="o_importerArmee" type="button" value="Valider" />
                </p>
                <p id="o_aideCopierArmee" style="text-align:left; font-size: 0.8em;display:none">
                    Vous pouvez importer une armée de plusieurs façons :
                    <br/>- Ecrire directement une phrase : je veux 30 jsn et 27 artilleuses et encore 50 jeunes soldates naines.
                    <br/>- Copiez une armée de Fourmizzz (Rapport de combat, Page Armée, Armée en attaque...).
                    <br/>- Copiez un fichier Excel.
                    <br/><br/>Vous pouvez utiliser certaines abréviations :
                    <br/>- Pour les armées : jsn, sn, ne, js, s, c, ce, a, ae, se, ta ou tk, tae ou tke, tu, tue.
                    <br/>- Pour les nombres : k ou kilo, M ou mega, G ou giga, T ou tera.
                </p>
            </div>
        </div>`);
  $("#o_annulerCopie").click(() => {
    $("#o_divccarmee").hide();
    $("#o_textAreaArmee").val("");
    return false;
  });
  $("#o_afficherAide").click(() => {
    $("#o_aideCopierArmee").toggle();
    return false;
  });
  $("#o_importerArmee").click(() => {
    let army = new Army();
    army.parseArmy(String($("#o_textAreaArmee").val()));
    $("#o_divccarmee").hide();
    $("#o_textAreaArmee").val("");
    if (onImport) onImport(army);
    return false;
  });
}
