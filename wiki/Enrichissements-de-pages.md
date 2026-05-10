## Enrichissements de pages

En plus des boîtes flottantes accessibles depuis la toolbar, Toolzzz **modifie ou enrichit la plupart des pages** de Fourmizzz pour y intégrer des informations utiles, des raccourcis, et des outils contextuels. Voici la liste complète des pages enrichies et ce que Toolzzz y apporte.

## Reine

Sur la page de la Reine (où tu lances tes pontes) :

- Une colonne **Terminé le** est ajoutée au tableau des pondes en cours, affichant la **date et l'heure exacte de fin** de chaque pond (au lieu du compteur relatif natif).
- Au clic sur l'icône d'une unité, ses **stats avec bonus de recherche** s'affichent (vie ajustée Bouclier, dégâts attaque/défense ajustés Armes).
- Les inputs et le slider du formulaire de ponte sont **corrigés** pour les comptes non-C+ (chez qui le natif est buggé).

## Laboratoire

- **Tooltip Bouclier** : au survol d'une recherche Bouclier, comparaison de la vie de l'AB actuelle vs celle au niveau supérieur — pour décider si la prochaine recherche en vaut le coup.
- **Tooltip Armes** : pareil pour les recherches d'Armes, comparaison des pertes estimées avant et après upgrade.
- Les niveaux de recherche sont sync vers `localStorage` à chaque visite de la page (utilisé par d'autres outils de l'extension).

## Ressources (Chasse)

Page `Ressources.php`, l'onglet où tu lances tes chasses :

- **Lanceur de chasse intégré** : formulaire avec sélection de terrain et type de chasse, à côté du natif.
- **Bouton "Annuler toutes les chasses"** ajouté dans le bloc des chasses en cours, pour rappeler tout le monde en un clic.

## Armée

- Les **stats de l'armée totale** sont affichées avec bonus de recherche (HP total, dégâts attaque, dégâts défense).
- Une fonction **Sauvegarde par lieu** : tu peux sauvegarder la composition de ton armée par terrain de chasse, dôme ou loge, et la recharger plus tard. Utile quand tu jongles entre plusieurs configs (chasse / défense / attaque).
- Boutons **Copier / Coller armée** pour dupliquer rapidement une composition d'un endroit à un autre.

## Ennemie (page Attaquer)

C'est l'une des pages les plus enrichies par Toolzzz.

- **Formulaire de flood avancé** à côté du formulaire natif d'attaque : nombre d'attaques, délai entre chaque, méthode (Standard / Optimisée / Uniforme / Dégressive).
- **Stats armée live** : à mesure que tu modifies les unités envoyées, les stats totales (HP, attaque, défense) sont mises à jour en temps réel.
- **Sonde-killer** : si la cible est une sonde adverse, Toolzzz suggère automatiquement la composition d'armée anti-sonde que tu as configurée dans _Paramètres → Général_.
- **Tooltip temps de trajet** vers cette cible.

## Ennemie (listes ennemies)

Sur la liste des ennemis (les fourmilières que tu as scannées), une colonne **Temps** est ajoutée affichant le temps d'attaque estimé vers chaque ennemi. Pratique pour identifier rapidement les cibles "à portée" sans avoir à cliquer dans chaque profil.

## Membre (profil joueur)

- **Temps de trajet** vers la cible avec date et heure d'arrivée live (mise à jour seconde par seconde).
- Bouton **Surveiller ce joueur** pour ajouter / retirer du [Radar](Boite-Radar).

## Messagerie

- **Parsing au clic** des rapports de chasse et de combat directement dans la conversation — plus besoin de copier-coller dans la boîte d'analyse.
- **Bilan multi-rapports cumulé** si une conversation contient plusieurs RC d'affilée.
- **Coloration des messages** des joueurs surveillés via le Radar.

## Commerce (Convoi)

- **Info capacité d'étable** : affiche combien de ressources peut transporter une ouvrière à ton niveau d'Étable.
- Boutons **Arrondir** sur les champs Nourriture et Matériaux : arrondit la quantité au multiple exact de la capacité d'ouvrière, pour éviter de gaspiller la place du convoi.
- **Recalcul automatique** du nombre d'ouvrières quand tu modifies les ressources.

## Chat

- Format **"Pseudo (datetime) :"** au lieu du natif inversé "datetime Pseudo :" — plus naturel à lire en survolant.
- Bouton **Citer** sur chaque message (insère une citation propre dans le champ de saisie).
- Coloration personnalisable selon ta palette d'apparence.

## Forum

- Bouton **Préparer le forum pour un SDC** (Système de Commandement) : crée automatiquement les sections cachées `Toolzzz_Commande` et `Toolzzz_Membre` qui servent de stockage partagé pour les fonctionnalités d'utilitaire d'alliance. **Réservé aux chefs d'alliance**.
- Voir [Boîte Paramètres → Utilitaire](Boite-Parametres#onglet-utilitaire) pour le contexte.

## Alliance Membres

- L'onglet **Carte** est injecté dans le menu — voir page dédiée [Carte d'alliance](Carte-d-alliance).
- Sur le tableau des membres, des colonnes Tdt (Temps de trajet) / Retour / Coordonnées sont ajoutées si l'utilitaire d'alliance est en place.

## Alliance Forum (forum_menu)

- **Système utilitaire d'alliance** complet :
  - **Gestion des commandements** : ressources avec date cible, assignation par membre.
  - **Gestion des infos membres** : rangs, temps de trajet / retour, coordonnées partagées.
- Les chefs / officiers peuvent **assigner les rangs** des membres depuis cette interface.
- Toutes les données sont stockées dans les sections cachées du forum (donc partagées avec toute l'alliance qui a Toolzzz).

## ClassementAlliance (fiche d'une alliance)

- **Indicateurs attaquable / attaquant** pour les non-C+ (fonctionnalité native uniquement chez les C+).
- **Totaux cumulés** de l'alliance : terrain, fourmilière, technologie.

## Cross-page (visible partout)

- L'onglet **Carte** dans le menu d'alliance.
- L'onglet **Coûts** dans le menu colonie.
- **Tooltip enrichi** sur le bandeau de ressources Nourriture / Matériaux : capacité maximale et place libre au survol.
- **Toast "Toolzzz mis à jour"** au premier chargement après une mise à jour de version.
- **Initialisation locale française** : moment.js, numeral.js, Highcharts, datepicker, sorts DataTables — tous les outils intégrés affichent les nombres et dates au format FR.
