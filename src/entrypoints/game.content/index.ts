/*
 * Main content script: libraries, stylesheets, then the app.
 *
 * The order of the three import blocks matters:
 *  1. `~/vendor` — jQuery and its plugins, moment, numeral, Highcharts,
 *     DataTables… put on `window` in the manifest's historical order;
 *  2. the stylesheets — WXT collects them into the content script's `css`
 *     entry. The jQuery UI theme (formerly a <link> to code.jquery.com) comes
 *     first so outiiil.css's overrides keep winning ties, as they do today;
 *  3. the app itself (`./main`).
 *
 * Everything imported here must only be used inside `main()`: WXT strips
 * `main` and then the imports that became unused before evaluating this file
 * under Node to read `matches`/`runAt`. An import used at module level would
 * run jQuery and friends inside Node at build time.
 */
import "~/vendor";

import "~/assets/jquery-ui-humanity.css";
import "~/assets/outiiil.css";
import "~/assets/toasts.css";
import "~/assets/datatables.css";

import { defineContentScript } from "#imports";
import { main } from "./main";

export default defineContentScript({
  matches: ["*://*.fourmizzz.fr/*"],
  async main(ctx) {
    await main(ctx);
  },
});
