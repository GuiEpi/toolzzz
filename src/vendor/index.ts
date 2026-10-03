/*
 * Bundle des bibliothèques tierces.
 *
 * Les 18 fichiers de `lib/` sont exactement ceux que l'extension chargeait
 * comme content scripts séparés avant la migration WXT (mêmes versions, mêmes
 * octets, même ordre). Aucun n'est un module ES : ce sont des scripts UMD ou
 * des IIFE qui se posent sur `window` (jQuery, moment, numeral, Highcharts…)
 * ou étendent `jQuery.fn`. Le plugin Vite `toolzzz:vendor-scripts`
 * (wxt.config.ts) enveloppe chacun d'eux pour qu'il s'exécute comme un script
 * classique : `module` / `exports` / `require` / `define` masqués, `this`
 * = `window`. Sans cela rolldown les traite comme du CommonJS — et le combo
 * DataTables (6 wrappers UMD dans un seul fichier) ne s'exécuterait jamais.
 *
 * L'ordre des imports EST l'ordre de chargement : jQuery avant ses plugins,
 * moment avant sa locale, etc. Ne pas trier.
 *
 * Le reste du code n'accède jamais à `window.*` : il importe `$`, `moment`,
 * `numeral`, `Highcharts`, `Clipboard` depuis ce module.
 */
import "~/vendor/lib/jquery_3.2.1.js";
import "~/vendor/lib/jquery-ui_1.12.1.js";
import "~/vendor/lib/jquery-ui-touch-punch_0.2.3.js";
import "~/vendor/lib/jquery-datetimepicker_1.6.3.js";
import "~/vendor/lib/jquery-toast_1.3.1.js";
import "~/vendor/lib/globalize_0.1.1.js";
import "~/vendor/lib/globalize-locale-fr.js";
import "~/vendor/lib/clipboard_1.7.1.js";
import "~/vendor/lib/highcharts_6.0.7.js";
import "~/vendor/lib/highcharts-more.js";
import "~/vendor/lib/highcharts-data.js";
import "~/vendor/lib/highcharts-stock.js";
import "~/vendor/lib/datatables_1.10.16.js";
import "~/vendor/lib/numeral_2.0.6.js";
import "~/vendor/lib/numeral-locale-fr.js";
import "~/vendor/lib/moment_2.19.1.js";
import "~/vendor/lib/moment-locale-fr.js";
import "~/vendor/lib/moment-duration-format.js";

const w = window as any;

export const $ = w.jQuery;
export const jQuery = w.jQuery;
export const moment = w.moment;
export const numeral = w.numeral;
export const Highcharts = w.Highcharts;
export const Clipboard = w.Clipboard;
