/*
 * Compte.js
 **********************************************************************/

/**
 * Hook sur /compte.php pour capter les préférences du « menu rapide »
 * (configurées via les checkboxes `menuRapide*`) et les stocker en
 * localStorage. C'est ce stockage que `BoiteComptePlus` lira pour rendre
 * les raccourcis côté non-C+ — le natif Compte+ continue à gérer son
 * propre rendu serveur en parallèle.
 *
 * @class PageCompte
 * @constructor
 */
class PageCompte {
  constructor() {}
  /**
   * @method executer
   */
  executer() {
    // Pré-cocher selon les prefs sauvegardées : utile aux non-C+ qui
    // n'ont pas de save serveur, leur état reflète quand même leur choix
    // précédent.
    let prefs = {};
    try {
      prefs = JSON.parse(localStorage.getItem(MENU_RAPIDE_KEY)) || {};
    } catch (e) {
      prefs = {};
    }
    if (Object.keys(prefs).length) {
      MENU_RAPIDE.forEach((item) => {
        if (prefs[item.name] !== undefined) {
          $("#" + item.name).prop("checked", prefs[item.name]);
        }
      });
    }
    // À la soumission : on sauve l'état des checkboxes en localStorage,
    // puis on laisse le submit natif continuer (qui sauvera côté serveur
    // pour les C+, no-op pour les non-C+).
    $("input[name='submitMenuRapide']")
      .closest("form")
      .on("submit", () => {
        let snapshot = {};
        MENU_RAPIDE.forEach((item) => {
          snapshot[item.name] = $("#" + item.name).is(":checked");
        });
        try {
          localStorage.setItem(MENU_RAPIDE_KEY, JSON.stringify(snapshot));
        } catch (e) {}
      });
    return this;
  }
}
