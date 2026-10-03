/*
 * Third-party library bundle.
 *
 * The 18 files in `lib/` are exactly the ones the extension used to load as
 * separate content scripts before the WXT migration (same versions, same bytes,
 * same order). None of them is an ES module: they are UMD scripts or IIFEs that
 * put themselves on `window` (jQuery, moment, numeral, Highcharts…) or extend
 * `jQuery.fn`. The `toolzzz:vendor-scripts` Vite plugin (wxt.config.ts) wraps
 * each one so it runs like a plain script: `module` / `exports` / `require` /
 * `define` shadowed, `this` = `window`. Without it rolldown treats them as
 * CommonJS — and the DataTables combo (six UMD wrappers in one file) would never
 * run at all.
 *
 * The import order IS the load order: jQuery before its plugins, moment before
 * its locale, and so on. Do not sort them.
 *
 * The rest of the code never touches `window.*`: it imports `$`, `moment`,
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
