/*
 * Content script principal : bibliothèques, feuilles de style, puis l'appli.
 *
 * L'ordre des trois blocs d'import est significatif :
 *  1. `~/vendor` — jQuery et ses plugins, moment, numeral, Highcharts,
 *     DataTables… posés sur `window` dans l'ordre historique du manifest ;
 *  2. les CSS — WXT les regroupe dans l'entrée `css` du content script.
 *     Le thème jQuery UI (ex-<link> vers code.jquery.com) passe en premier
 *     pour que les correctifs d'outiiil.css continuent de l'emporter à
 *     spécificité égale, comme aujourd'hui ;
 *  3. l'appli (`./main`).
 *
 * Tout ce qui est importé ici ne doit servir que dans `main()` : WXT retire
 * `main` puis les imports devenus inutiles avant d'évaluer ce fichier sous
 * Node pour lire `matches`/`runAt`. Un import utilisé au niveau module
 * ferait tourner jQuery & co. dans Node au build.
 */
import "~/vendor";

import "~/assets/jquery-ui-humanity.css";
import "~/assets/outiiil.css";
import "~/assets/toasts.css";
import "~/assets/datatables.css";

import { defineContentScript } from "#imports";
import { main } from "./main";

export default defineContentScript({
  matches: ["http://*.fourmizzz.fr/*"],
  main(ctx) {
    main(ctx);
  },
});
