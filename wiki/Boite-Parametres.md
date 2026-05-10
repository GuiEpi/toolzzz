## Boîte Paramètres

La **Boîte Paramètres** s'ouvre depuis la quatrième icône de la toolbar (engrenage). Elle regroupe en un seul endroit tous les réglages personnalisables de Toolzzz, organisés en quatre onglets.

> 📸 **À capturer :** vue de la boîte Paramètres ouverte sur l'onglet Apparence, avec les sélecteurs de couleur visibles.

## Onglet _Général_

Les options qui touchent au comportement de l'extension :

- **Méthode de flood par défaut** — choix de l'algorithme utilisé par défaut dans la [boîte Multi-flood](Outils-d-attaque#onglet-multi-flood) et le formulaire flood injecté sur la page Attaquer. Quatre méthodes : Standard, Optimisée, Uniforme, Dégressive.
- **Affectation des ressources** — comportement par défaut au clic sur les boutons "arrondir" en commerce.
- **Unités anti-sonde (terrain / dôme)** — la composition d'armée que Toolzzz suggère automatiquement quand on attaque depuis un terrain de chasse, contre une sonde adverse. Configurable séparément pour terrain et pour dôme parce que les contraintes de placement diffèrent.
- **Unité de sonde** — quelle unité tu envoies par défaut quand tu sondes (typiquement la Sonde, mais certains joueurs préfèrent les Sondes élites).

## Onglet _Utilitaire_

Cet onglet expose deux champs : les **identifiants des sections cachées du forum d'alliance** que Toolzzz utilise comme stockage partagé pour les fonctionnalités d'utilitaire d'alliance (commandes, infos membres, rangs, coordonnées).

Tu n'as **pas besoin de remplir ces champs à la main** dans la majorité des cas — Toolzzz les auto-détecte quand tu visites le forum de ton alliance, à condition que les sections existent. Les sections sont créées par le chef d'alliance via le bouton **Préparer le forum pour un SDC** sur la page forum d'alliance (voir [Enrichissements de pages](Enrichissements-de-pages#forum)).

Modifie ici uniquement si :

- L'auto-détection a échoué
- Ton chef t'a communiqué les IDs directement

L'extension supporte les noms `Toolzzz_Commande` / `Toolzzz_Membre` ainsi que les anciens noms `Outiiil_Commande` / `Outiiil_Membre` pour les alliances qui ont préparé leur forum à l'époque d'Outiiil.

## Onglet _Apparence_

C'est l'onglet le plus visuel — il personnalise les couleurs et la position de l'interface.

- **Couleur 1 / 2 / 3** — la palette de fond et d'accents des boîtes flottantes. La couleur 2 est notamment utilisée pour les lignes paires des tableaux (effet zébré).
- **Couleur titre** — bandeau supérieur des boîtes.
- **Couleur texte** — couleur principale du texte et des liens dans les boîtes Toolzzz.
- **Position du dock** — _Droite_ (par défaut) ou _Bas_. Sur écran étroit, _Bas_ est forcé automatiquement.
- **Toolbar visible** — _Affichée_ (toujours visible) ou _Auto-cacher_ (apparaît au survol du bord).
- **Animation apparition / disparition** — durée en ms du fade des boîtes. Mets à 0 pour désactiver.

Les changements sont appliqués en temps réel : tu peux ouvrir une autre boîte en parallèle et voir les couleurs se mettre à jour pendant que tu joues avec les sélecteurs.

## Onglet _À propos_

Affiche la version courante de Toolzzz, un lien vers le code source GitHub, deux liens pour signaler un bug ou proposer une fonctionnalité, et la mention du projet original Outiiil (Hraesvelg / Freddy) sous licence GPL-3.0. Pas de réglages dans cet onglet — c'est un récap pratique pour retrouver les bons liens.
