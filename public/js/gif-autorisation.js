document.getElementById("autoriser").addEventListener("click", () =>
  browser.permissions.request({ data_collection: ["searchTerms"] }).then((ok) => {
    document.getElementById("resultat").textContent = ok
      ? "C'est bon ! Tu peux revenir au chat et rouvrir le bouton GIF."
      : "Pas d'accord donné : le bouton GIF restera désactivé.";
    if (ok) setTimeout(() => window.close(), 2000);
  }),
);
