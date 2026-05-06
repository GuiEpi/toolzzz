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
  let appliquer = () => {
    document.documentElement.classList.toggle("toolzzz-mode-couts", location.hash === "#cout");
  };
  appliquer();
  window.addEventListener("hashchange", appliquer);
})();
