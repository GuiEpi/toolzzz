/*
 * bootstrap.content.ts
 *
 * A tiny script loaded as early as possible (`run_at: document_start`) to put
 * CSS classes on <html> before the browser parses the body. It lets outiiil.css
 * apply conditional display rules (hiding the game's own simulation when
 * arriving on construction.php#cout, for instance)
 * sans flash.
 *
 * No dependency and no jQuery: the DOM is still empty at this point.
 **********************************************************************/

import { defineContentScript } from "#imports";

export default defineContentScript({
  matches: ["http://*.fourmizzz.fr/*"],
  runAt: "document_start",
  main(ctx) {
    // The hiding CSS is injected inline: the manifest's content_scripts.css
    // follows the script's run_at (idle by default); Chrome is fast enough that
    // the game's own markup does not flash, but Firefox lets a glimpse through.
    // Injecting inline from this document_start script guarantees the rule is in
    // place before the body is parsed, on both browsers.
    let style = document.createElement("style");
    style.textContent = `
      .toolzzz-mode-couts table:has(> tbody > tr.ligneAmelioration),
      .toolzzz-mode-couts table:has(> tr.ligneAmelioration),
      .toolzzz-mode-couts #centre > strong,
      .toolzzz-mode-couts #centre > br,
      .toolzzz-mode-couts #centre > small,
      .toolzzz-mode-couts #centre > span.small,
      /* In #cout mode only the Coûts widget is shown; the running-upgrades
       * summary (upgradesTable) is hidden to keep the view clean. */
      .toolzzz-mode-couts #o_evolutionEnCours,
      .toolzzz-mode-couts .o_evolutionH2,
      .toolzzz-mode-couts .o_annulationGroup,
      .toolzzz-mode-evolution #centre > strong,
      .toolzzz-mode-evolution #centre > br,
      .toolzzz-mode-evolution #centre > small,
      /* Cancellation confirmation page: also hides the warning <p>, the game's
       * <a>Je confirme</a> (ComptePlus only, where it is a direct sibling) and
       * our own <a class='o_retourAnnuler'>Retour</a>. Otherwise they flash at
       * their original position before upgradesTable moves them under the
       * summary table. */
      .toolzzz-mode-evolution #centre > p:has(strong),
      .toolzzz-mode-evolution #centre > a[href*='confAnnuler'],
      .toolzzz-mode-evolution #centre > a.o_retourAnnuler {
        display: none !important;
      }
    `;
    (document.head || document.documentElement).appendChild(style);

    let apply = () => {
      document.documentElement.classList.toggle("toolzzz-mode-couts", location.hash === "#cout");
      // construction.php / laboratoire.php: the `<strong>` elements (running
      // upgrades) are hidden before the body is parsed, to avoid a flash between
      // the game's render and our summary table (see Utils.upgradesTable).
      let upgradePage =
        location.pathname === "/construction.php" || location.pathname === "/laboratoire.php";
      document.documentElement.classList.toggle("toolzzz-mode-evolution", upgradePage);
    };
    apply();
    ctx.addEventListener(window, "hashchange", apply);
  },
});
