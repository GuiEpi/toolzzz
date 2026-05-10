## Overlay Compte+

Si tu joues **sans Compte+**, Fourmizzz n'affiche pas le panneau de gauche qui montre l'état de tes pontes, constructions, recherches, attaques et convois en cours. Toolzzz comble ce manque avec un **panneau de remplacement** qui reproduit ce que les Comptes+ voient nativement, et y ajoute quelques tooltips utiles.

> Si tu as déjà un Compte+, ce panneau n'est **pas affiché** : Toolzzz détecte la présence du panneau natif et ne le double pas. Le reste de l'extension fonctionne identiquement quel que soit ton statut C+.

> ![Panneau Compte+ Toolzzz](assets/wiki/overlay-compte-plus.png)

## Les 6 barres

Le panneau affiche en permanence l'état de tes 6 activités principales. Chaque barre se met à jour en temps réel (la progress bar tourne, le temps restant décrémente).

### Ponte

- Unité actuellement en ponte
- Nombre d'unités restantes
- Progress bar du pond en cours
- Temps restant
- **Tooltip multi-pontes** au survol : si tu as enchaîné plusieurs pondes, le tooltip détaille la liste complète et les durées de chacune.

### Construction

- Bâtiment en cours de construction
- Progress bar
- Temps restant
- Tooltip avec détails (niveau cible, ressources investies)

### Recherche

- Technologie en cours de recherche
- Progress bar
- Temps restant
- Tooltip avec détails

### Chasse

- Terrain de chasse conquis (si chasse en cours)
- Retour dynamique : le timer du retour démarre dès que la chasse est terminée
- **Tooltip multi-chasses** : liste de toutes les chasses en cours / en retour, par terrain.

### Attaque

- Cible en cours
- Nombre total d'attaques envoyées (si flood)
- Retour
- **Tooltip détaillé** : liste des unités envoyées, ETA arrivée, ETA retour.

### Convoi

- **Sens** : envoi ou réception
- Cible (joueur source ou destinataire)
- Quantités (nourriture, matériaux)
- Retour (pour les envois)
- **Tooltip multi-convois** : tableau complet de tous les convois en cours, avec leurs cibles, contenus et ETAs.

Toutes ces données viennent du `localStorage` que Toolzzz alimente quand tu interagis avec les pages concernées (Reine, Construction, Laboratoire, Ressources, Attaquer, Commerce). Le panneau lui-même se contente de les afficher de manière lisible.

## Recherche joueur / alliance

Sous les barres, un **champ de recherche avec autocomplete** te permet de chercher un joueur ou une alliance par pseudo / tag et d'aller directement sur sa page. C'est une convenience qui évite de passer par le menu Communauté → Membres.

## Menu rapide

> ![Menu rapide dans le panneau](assets/wiki/menu-rapide-overlay-compte-plus.png)

Tout en bas du panneau, le **menu rapide** est une grille de raccourcis vers les pages principales du jeu, organisés en trois sections :

- **Fourmilière** — Reine, Ressources, Construction, Laboratoire, Armée, Ennemies, Colonies, Carte (la carte du jeu, pas la carte d'alliance), Commerce.
- **Alliance** — Chat alliance, Forum alliance, Forum externe, Membres, Candidatures, Message collectif, Diplomatie.
- **Communauté** — Description, Messagerie, Ma fourmilière.

Les raccourcis affichés sont **personnalisables** : pour activer / désactiver chaque lien, va sur la page **Mon compte** du jeu (`compte.php`). Toolzzz y injecte un formulaire _Menu rapide_ avec une case à cocher par raccourci, organisée selon les mêmes trois sections. Ta sélection est sauvegardée en `localStorage` et le panneau Compte+ se met à jour automatiquement.

> ![Formulaire de personnalisation du menu rapide](assets/wiki/menu-rapide.png)

> Cette personnalisation a été ajoutée dans Toolzzz 3.4 / 3.5 pour aligner le rendu non-C+ sur ce que les Comptes+ peuvent configurer nativement.
