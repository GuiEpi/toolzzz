## Boîte Radar

Le **Radar** te permet de surveiller une liste de joueurs et d'alliances qui t'intéressent : un ennemi historique, un voisin de coordonnées, une alliance rivale… Toolzzz garde leur trace localement et met en avant leurs interactions avec toi dans plusieurs endroits du jeu.

> ![Radar](assets/wiki/boite-radar.png)

## Ouvrir le Radar

Le Radar n'a pas d'icône dédiée dans la toolbar : il vit **à l'intérieur du panneau de droite Toolzzz** (l'[Overlay Compte+](Overlay-Compte-Plus)), côté à côté des barres ponte / construction / recherche / chasse / attaque / convoi.

Pour basculer entre la vue Compte+ et la vue Radar, **clique sur le titre du panneau** (▼ Toolzzz X.x.x ▼). Le choix est mémorisé entre les sessions.

> ![Bandeau-titre du panneau](assets/wiki/overlay-compte-plus-navigation-titre.png)

Tant que tu n'as ajouté aucun joueur ou alliance au Radar, le panneau reste sur la vue Compte+ par défaut.

## Ajouter quelqu'un au radar

Deux manières d'ajouter une cible :

- **Depuis le profil d'un joueur** (page Membre) : un bouton **Surveiller ce joueur** apparaît à côté de son pseudo. Clique pour ajouter / retirer du radar (toggle).

  > ![Bouton Surveiller ce joueur](assets/wiki/boite-radar-surveiller-joueur.png)

- **Depuis la fiche d'une alliance** (`classementAlliance.php`) : pareillement, un bouton **Surveiller** est injecté pour suivre l'alliance entière.

  > ![Bouton Surveiller sur la fiche d'alliance](assets/wiki/boite-radar-surveiller-alliance.png)

Ajouter une alliance ne suit pas individuellement chacun de ses membres — elle marque l'alliance comme entité, et toute interaction (attaque entrante, message…) provenant d'un joueur de cette alliance est mise en valeur.

## Organisation

Les joueurs et alliances ajoutés peuvent être réordonnés par glisser-déposer dans la liste du panneau Radar. Cela te permet de prioriser visuellement certains ennemis ou alliés à surveiller de près.

## Effet sur le reste du jeu

Une fois un joueur ajouté au radar :

- Sur la **Messagerie**, ses messages sont **colorés** différemment, ce qui te permet de repérer rapidement un retour d'attaque ou un échange tendu dans une boîte de réception chargée.
- Le profil de ce joueur reste un clic plus accessible via la liste de la boîte Radar.

Les couleurs de mise en valeur reprennent la palette définie dans tes paramètres d'apparence.

## Persistance

Les listes de joueurs et d'alliances surveillés sont stockées dans le `localStorage` de ton navigateur, par serveur Fourmizzz. Elles restent disponibles entre tes sessions, et survivent aux mises à jour de l'extension.

Si tu changes de navigateur ou nettoies tes données de site, la liste sera réinitialisée — Toolzzz n'a pas de synchronisation cloud (tout reste local par design).

## Retirer quelqu'un

Joueur :

- Cliquer sur le bouton **Supprimer la surveillance** depuis le profil (toggle off)

  > ![Bouton Supprimer la surveillance](assets/wiki/boite-radar-supprimer-surveillance.png)

Alliance :

- Cliquer sur le bouton **Ignorer** depuis la fiche de l'alliance (toggle off)

  > ![Bouton Ignorer sur la fiche d'alliance](assets/wiki/boite-radar-ignorer.png)
