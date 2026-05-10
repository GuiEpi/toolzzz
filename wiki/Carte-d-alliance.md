## Carte d'alliance

Toolzzz injecte une **carte interactive** dans le menu d'alliance pour visualiser les positions de tous tes membres en un seul écran.

> ![Carte d'alliance](assets/wiki/carte-d-alliance.png)

## Comment l'ouvrir

Quand tu as une alliance, Toolzzz ajoute un onglet **Carte** dans le menu d'alliance (à côté de Forum, Membres, Diplomatie, etc.). Clique dessus pour ouvrir la carte.

> ![Onglet Carte dans le menu d'alliance](assets/wiki/carte-d-alliance-menu.png)

Tu peux aussi y accéder via le hash `#carte` dans l'URL de la page Membres : Toolzzz détecte le hash au chargement et déplie automatiquement le widget Carte. Pratique pour partager un lien direct dans le chat d'alliance.

## Charger / actualiser les données

Au premier ouvrage, la carte est vide — clique sur **Charger / Actualiser** pour récupérer les positions et stats de tous les membres. Cette opération prend quelques secondes (Toolzzz doit visiter le profil de chaque membre pour récupérer ses coordonnées et ses ressources).

Les données sont **mises en cache localement** : la prochaine fois que tu ouvres la carte, elle s'affiche instantanément depuis le cache. Re-clique sur Actualiser quand tu veux remettre à jour (par exemple après l'arrivée de nouveaux membres ou un déménagement).

## Interaction

La carte est interactive (basée sur Highcharts) :

- **Survol** d'un point membre — affiche un tooltip avec son pseudo, ses coordonnées et le **temps de trajet** depuis ta fourmilière (calculé pour chaque type d'unité).
- **Drag** pour zoomer sur une zone — sélectionne un rectangle pour zoomer dessus.
- **Clic** sur un point — zoom 4× centré sur ce point. Très utile dans les clusters denses où plusieurs membres sont voisins.
- **Bouton Reset zoom** (apparaît après le premier zoom) — revient à la vue d'ensemble.

## Terrain de chasse collectif

La carte affiche aussi le **terrain de chasse collectif** de l'alliance, coloré pour distinguer les zones contrôlées par les membres. Pratique pour visualiser l'emprise territoriale et identifier les zones non couvertes.

## Totaux d'alliance

À côté de la carte, Toolzzz affiche les **totaux cumulés** de l'alliance :

- Total terrain de chasse
- Total fourmilière
- Total ressources / technologie

Ces chiffres permettent de situer ton alliance par rapport à d'autres alliances comparables (à croiser avec le classement officiel pour le contexte).

## Exporter pour le forum

Le bouton **Exporter pour le forum** génère un PNG de la carte zoomée comme tu la vois actuellement, prêt à être partagé sur le forum d'alliance ou un Discord. C'est une capture simple, sans interactivité — pour discuter de stratégie collective sans demander à chaque membre de venir voir la carte sur son écran.

## Cache et confidentialité

Le cache de la carte est stocké dans le `localStorage` de ton navigateur, par couple `(serveur, alliance)`. Si tu changes d'alliance, l'ancien cache reste mais n'est plus affiché.

**Aucune donnée n'est envoyée à un serveur externe.** Toutes les positions et stats viennent des pages Fourmizzz que tu visites toi-même via l'extension, et restent sur ta machine.
