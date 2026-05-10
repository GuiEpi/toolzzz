## Outils d'attaque

La boîte **Outils d'Attaque** s'ouvre depuis la troisième icône de la toolbar. C'est l'outil le plus complet de Toolzzz : il regroupe quatre onglets couvrant l'analyse de rapport, la simulation de combat, la préparation d'attaques multiples et le calcul de temps de trajet.

## Onglet _Analyser_

> ![Onglet Analyser](assets/wiki/outils-d-attaque-analyser.png)

Colle un **rapport de combat** ou un **rapport de sonde** dans le champ texte. Toolzzz extrait :

- Le résultat (victoire / défaite / égalité)
- Les **pertes** côté attaquant et défenseur
- Les **survivants** envoyés en retour
- Un **bilan multi-combat** cumulé si tu colles plusieurs rapports d'affilée

### Cas spécial : le rapport de sonde

Quand tu colles un rapport de sonde (et pas un RC complet), un panneau supplémentaire **Analyse de la sonde** apparaît sous le tableau. Il calcule le multiplicateur de vie effectif du défenseur (combinaison du lieu et du bouclier ennemi) et la **FdF nécessaire** pour one-shot la cible en encaissant la réplique 10%.

Le panneau te propose un formulaire interactif où tu saisis ton armée d'attaque envisagée, et il te dit :

- Combien d'unités il manque pour atteindre la FdF cible
- Si ta JSN (réplique) tient le coup contre la défense ennemie

> Calculs basés sur le tableur [XP v1.04](http://alliancead2.free.fr/Outils/Repository/XP%20v1.04.xls) de Calystène (zone B26-K54 de la feuille _Auto sur sonde_). C'est la référence de la communauté pour les calculs anti-sonde — Toolzzz reprend exactement la même logique.

> ![Calcul d'attaque à lancer sur sonde](assets/wiki/outils-d-attaque-sonde.png)

## Onglet _Simuler_

> ![Onglet Simuler](assets/wiki/outils-d-attaque-simuler.png)

Calcule les **dégâts théoriques** d'un combat sans avoir à l'envoyer. Tu saisis :

- Ton armée d'**attaquant** (par unité)
- L'armée du **défenseur**
- Tes niveaux de **recherche** (Bouclier, Armes, etc.) et ceux du défenseur

Toolzzz applique les formules du jeu (mêmes que celles utilisées par le serveur) et te donne un aperçu de l'issue probable. Utile pour évaluer un raid avant de mobiliser tes troupes.

## Onglet _Multi-flood_

> ![Onglet Multi-flood](assets/wiki/outils-d-attaque-multi-flood.png)

Le générateur d'**attaques groupées sur plusieurs cibles**. Tu saisis une liste de pseudos cibles et le nombre d'attaques que tu veux envoyer sur chacun, et Toolzzz prépare le plan complet : ordre d'envoi, délais, choix de méthode.

Quatre **méthodes de flood** sont disponibles (configurable par défaut dans _Paramètres → Général_) :

- **Standard** — délais réguliers entre chaque attaque
- **Optimisée** — concentre les attaques pour un débordement rapide
- **Uniforme** — étale uniformément sur la fenêtre de temps
- **Dégressive** — démarre serré puis espace progressivement

## Onglet _Temps de trajet_

> ![Onglet Temps de trajet](assets/wiki/outils-d-attaque-temps-de-trajet.png)

Calculatrice toute simple : tu donnes les **coordonnées** de la cible (ou son pseudo, et Toolzzz récupère la position depuis son profil), et tu obtiens le temps de trajet exact pour chaque type d'unité, en tenant compte de tes recherches (Vitesse, Cartographie).

Pratique pour planifier un AR (Aller-Retour) ou un convoi vers un membre d'alliance qu'on connaît mal.

## Lien avec les autres pages

Une grande partie de cette logique est aussi exposée **directement dans le jeu** :

- Sur la page **Attaquer** d'un ennemi, le formulaire de flood et les stats d'armée live sont injectés à côté du formulaire natif. Voir [Enrichissements de pages](Enrichissements-de-pages#ennemiephp-page-attaquer).
- Sur la **Messagerie**, les RC sont parsés au clic.
- Sur le **profil** d'un joueur, le temps de trajet vers cette cible est affiché en permanence.

La boîte d'attaque reste utile pour les analyses libres, les simulations exploratoires, et les multi-floods.
