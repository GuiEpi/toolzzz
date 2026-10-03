# Smoke checklist — Phase 1 (WXT entrypoints + ES modules)

Objectif : comportement **identique** à la 3.9.1. Rien de nouveau à voir ;
tout ce qui est listé ci-dessous existait déjà et doit encore marcher.

## Mise en place

1. `bun run dev` (Chrome) ou `bun run dev:firefox` — `web-ext.config.ts`
   local (`disabled: true`) n'ouvre pas de navigateur.
2. Charger l'extension **non empaquetée** depuis Windows :
   - Chrome → `chrome://extensions` → mode développeur → « Charger
     l'extension non empaquetée » → `\\wsl$\…\toolzzz-fork\.output\chrome-mv3-dev`
   - Firefox → `about:debugging#/runtime/this-firefox` → « Charger un module
     temporaire » → `.output\firefox-mv3-dev\manifest.json`
     (le suffixe `-dev` est nouveau depuis WXT 0.21 ; les builds prod restent
     dans `.output/chrome-mv3` / `.output/firefox-mv3`.)
3. Ouvrir la console (F12) **avant** de charger la première page du jeu et
   la laisser ouverte : la cible est **zéro `ReferenceError`** et zéro
   `TypeError … is not a function` provenant de `content-scripts/game.js`.
   Les avertissements du jeu lui-même (`fourmizzz.fr`) ne comptent pas.
4. Faire la première passe avec un compte qui a déjà des données Toolzzz
   (radar, paramètres) : les clés `outiiil_*` n'ont pas bougé, tout doit se
   recharger tel quel.

## Points spécifiques à la migration (à vérifier en premier)

- [ ] **Thème jQuery UI** : le thème « humanity » n'est plus téléchargé
      depuis code.jquery.com mais embarqué. Ouvrir la boîte Ponte : le
      datepicker (icône calendrier), les spinners (flèches ▲▼) et les onglets
      des boîtes ont leur aspect orange/beige habituel. Icônes des boutons
      jQuery UI visibles (sprites `ui-icons_*.png` désormais en data: URI).
- [ ] **Images de faune** (chemin `getURL` dynamique) : Ressources → boîte
      Chasse (icône chasse de la toolbar) → tableau du bestiaire : les
      vignettes des espèces s'affichent (pas d'icône cassée).
- [ ] **Images de l'extension** (13 constantes `IMG_*`) : icônes ✎ / ✕ /
      actualiser dans le Radar, sprite du menu rapide, logo Toolzzz dans la
      boîte Compte+, flèches ▲▼ du dock.
- [ ] **Persistance** : changer un paramètre (Paramètres → Général), recharger
      → conservé. Ajouter un joueur au Radar, recharger → conservé.
      Basculer Compte+/Radar (flèches en haut de la boîte), recharger → l'état
      est mémorisé.
- [ ] **Toast « Toolzzz mis à jour »** : apparaît une fois (version de dev
      ≠ dernière vue), disparaît définitivement après fermeture ou clic.
- [ ] **`bootstrap` à document_start** : arriver directement sur
      `construction.php#cout` → pas de flash du tableau natif avant les
      courbes ; changer le hash `#cout` ↔ rien fait basculer sans recharger.
- [ ] **Firefox** : `o_chrome` absent de `<html>`, largeur des colonnes du
      radar correcte ; tout le reste identique à Chrome.

## Partout (cross-page)

- [ ] Toolbar / dock à droite avec ses 4 icônes ; position haut/bas selon le
      paramètre ; mode auto-cacher ; animation d'ouverture des boîtes.
- [ ] Boîte Compte+ (non-C+) : les 6 barres (ponte, construction, recherche,
      chasse, attaque, convoi) avec progress bars, timers et tooltips multi.
- [ ] Recherche joueur / alliance dans la boîte Compte+ (autocomplete).
- [ ] Menu rapide en bas de la boîte (raccourcis cochés dans compte.php).
- [ ] Onglet **Carte** dans le menu Alliance, onglet **Coûts** dans le menu
      Fourmilière.
- [ ] Tooltip enrichi Nourriture / Matériaux du bandeau (max + place libre).
- [ ] Nombres au format FR (`1 234`), dates en français.

## Reine (`/Reine.php`)

- [ ] Colonne **Terminé le** sur les pontes en cours.
- [ ] Clic sur l'icône d'une unité → stats avec bonus de recherche.
- [ ] Non-C+ : inputs et slider de ponte corrigés (`page.plus()`).
- [ ] Boîte **Ponte** (toolbar) : objectif, destination, slider TDP,
      datepicker + timepicker, bouton Lancer (requêtes `Reine.php`).

## Construction (`/construction.php`, `#cout`)

- [ ] Tableau récap des évolutions en cours (Utils.tableauEvolution),
      timers qui décomptent, toast sur erreur, bouton Retour sur la
      confirmation d'annulation.
- [ ] `#cout` : courbes Highcharts (temps, matériaux, pommes, ouvrières,
      capacité/production), sélecteurs construction / recherche, plage de
      niveaux, sliders Architecture / Salle d'analyse, rentabilité de
      l'Étable.
- [ ] Niveaux de construction synchronisés (`outiiil_joueur`).

## Laboratoire (`/laboratoire.php`)

- [ ] Tableau récap des recherches en cours (idem construction).
- [ ] Tooltips **Bouclier** et **Armes** au survol des recherches.
- [ ] Niveaux de recherche synchronisés.

## Ressources / Chasse (`/Ressources.php`)

- [ ] Lanceur de chasse intégré (terrain, type, nb chasses, intervalle,
      TDC…) — spinners jQuery UI avec `numberFormat: "i"` (Globalize).
- [ ] Bouton **Annuler toutes les chasses**.
- [ ] Affectation automatique des ouvrières (compléter Mat / Pom, ratio au
      curseur, saisie du pourcentage), conservée après chasse / flood.
- [ ] Boîte **Chasse** (toolbar) : simulateur + bestiaire (images de faune).

## Armée (`/Armee.php`)

- [ ] Stats de l'armée totale avec bonus (terrain / dôme / loge).
- [ ] Déplacements d'unités (flèches ◄ ►, requêtes `Armee.php?deplacement=3`).
- [ ] Auto-replacer après flood (drapeau `outiiil_floodPuisReplacer`,
      sessionStorage).

## Attaquer (`/ennemie.php?Attaquer=…`, `?annuler=…`, liste `/ennemie.php`)

- [ ] Formulaire de flood (nombre, délai, méthode Standard / Optimisée /
      Uniforme / Dégressive).
- [ ] Stats armée live pendant la saisie.
- [ ] Boutons **Sonder** / **Sonder direct**.
- [ ] Tooltip temps de trajet ; résumé d'attaque avec le nom de la cible
      cliquable.
- [ ] Attaques lancées mémorisées (`outiiil_attaquesLancees`), fenêtre
      d'annulation de 2 min, bouton copier (Clipboard).
- [ ] Liste `/ennemie.php` sans paramètre : colonne **Temps** ajoutée.
- [ ] Boîte **Combat** (toolbar) : simulateur, analyse de rapport, recherche
      de cible, calcul XP.

## Profil joueur (`/Membre.php?Pseudo=…`)

- [ ] Temps de trajet + heure d'arrivée live (seconde par seconde).
- [ ] Bouton **Surveiller ce joueur** (ajout / retrait du Radar).
- [ ] Lien antleaks.

## Messagerie (`/messagerie.php`)

- [ ] Parsing au clic des rapports de chasse et de combat.
- [ ] Bilan cumulé multi-rapports.
- [ ] Boutons copier (Clipboard) : message, HOF, bonus.
- [ ] Coloration des joueurs surveillés ; palettes de smileys.

## Commerce (`/commerce.php`)

- [ ] Info capacité d'Étable, boutons **Arrondir**, recalcul auto des
      ouvrières.
- [ ] SDC : tableau des commandes + bouton **Commander** (si le forum est
      préparé) ; boîte **Commande**.

## Compte (`/compte.php`)

- [ ] Préférences du menu rapide : C+ = capture du formulaire natif ;
      non-C+ = formulaire injecté. Sauvegarde `outiiil_menuRapide`, la boîte
      Compte+ se met à jour.

## Chat (`/chat.php`, `/alliance.php` sans paramètre)

- [ ] Format « Pseudo (date) : », bouton **Citer**, coloration, smileys,
      rafraîchissement (`appelAjax.php`).

## Forum (`/alliance.php?forum_menu`)

- [ ] Bouton **Préparer le forum pour un SDC** (chefs).
- [ ] Section `Toolzzz_Commande` : sélecteur d'état des commandes.
- [ ] Infos membres : rangs, temps de trajet / retour.

## Alliance — Membres (`/alliance.php?Membres`, `#carte`)

- [ ] Colonnes Grade / Tdt / Retour (si SDC) ; DataTables (tri, boutons,
      export).
- [ ] `#carte` : carte Highcharts des membres, chargement / actualisation
      (cache `outiiil_carteAlliance_<SERVEUR>_<TAG>`), filtres
      (`outiiil_carteFiltres_…`), export PNG pour le forum.

## Fiche d'alliance (`/classementAlliance.php?alliance=…`)

- [ ] Indicateurs attaquable / attaquant (non-C+), totaux cumulés.
- [ ] Bouton surveiller l'alliance (Radar) ; lien antleaks.

## Boîtes (toolbar)

- [ ] **Radar** : ajout joueur / alliance, sections et tri (sortable +
      touch-punch), survol, actualiser tout, mode édition, persistance.
- [ ] **Paramètres** : onglets Général / Utilitaire / Apparence / À propos ;
      couleurs appliquées immédiatement ; reset complet (efface
      `outiiil_parametre` et recharge) ; version affichée = celle du
      manifest.
- [ ] **Rang**, **Rapport**, **Commande**, **Ponte**, **Chasse**, **Combat**
      s'ouvrent depuis le dock sans erreur console.
