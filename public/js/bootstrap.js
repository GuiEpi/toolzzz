/*
 * bootstrap.js
 *
 * Mini-script chargé au plus tôt (`run_at: document_start`) pour poser des
 * classes CSS sur <html> avant que le navigateur ne parse le body. Permet à
 * outiiil.css d'appliquer des règles d'affichage conditionnelles (hide de la
 * simulation native quand on arrive sur construction.php#cout par exemple)
 * sans flash.
 *
 * Aucune dépendance, aucun accès jQuery — le DOM est encore vide à cet instant.
 **********************************************************************/

(function () {
  // Injection inline du CSS de masquage : le manifest content_scripts.css
  // suit le run_at du script (idle par défaut), Chrome est assez rapide pour
  // que le natif ne flashe pas mais Firefox laisse passer un coup d'œil.
  // L'injection inline depuis ce script document_start garantit que la
  // règle est posée avant le parse du body, sur les deux navigateurs.
  let style = document.createElement("style");
  style.textContent = `
    .toolzzz-mode-couts table:has(> tbody > tr.ligneAmelioration),
    .toolzzz-mode-couts table:has(> tr.ligneAmelioration),
    .toolzzz-mode-couts #centre > strong,
    .toolzzz-mode-couts #centre > br,
    .toolzzz-mode-couts #centre > small,
    .toolzzz-mode-couts #centre > span.small {
      display: none !important;
    }
  `;
  (document.head || document.documentElement).appendChild(style);

  let appliquer = () => {
    document.documentElement.classList.toggle("toolzzz-mode-couts", location.hash === "#cout");
  };
  appliquer();
  window.addEventListener("hashchange", appliquer);
})();
