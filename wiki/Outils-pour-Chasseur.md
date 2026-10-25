## Outils pour Chasseur

La boîte **Outils pour Chasseur** s'ouvre depuis la deuxième icône de la toolbar. Elle est organisée en quatre onglets : _Analyser_ pour disséquer un rapport de chasse, _Simuler_ pour préparer et lancer des chasses, _Par pertes_ pour les régler sur les pertes que tu acceptes, et _Bestiaire_ pour consulter les stats de toutes les espèces.

> 📸 **À capturer :** vue de la boîte Outils pour Chasseur, onglet _Analyser_, avec un rapport de chasse collé et le tableau de résultats affiché en dessous.

## Onglet _Analyser_

Colle un rapport de chasse complet (ou plusieurs à la suite) dans le grand champ texte, et Toolzzz extrait automatiquement :

- **Les unités** envoyées et celles qui sont rentrées (donc tes pertes).
- **L'XP** gagnée par la chasse — total, et détaillée si plusieurs espèces.
- **Le terrain conquis** (en cases) si applicable.
- **Le temps de chasse** total.

Si tu colles plusieurs rapports d'affilée (par exemple en sélectionnant tout le contenu d'une conversation Messagerie qui contient une suite de retours de chasse), Toolzzz fait automatiquement un **bilan cumulé** : total XP, total pertes par unité, total terrain.

C'est l'outil typique pour faire ton bilan de session de chasse en fin de soirée sans recompter à la main.

## Onglet _Simuler_

Le simulateur de chasse de Calystene (révision 2.00.38), avec un lanceur. Tu saisis une armée (la flèche la remplit avec la tienne), tes niveaux, ton TdC au lancement et à l'arrivée, et la **difficulté** voulue (le ratio attaque / difficulté, avec la probabilité de réplique à 10 %). Toolzzz calcule le nombre de chasses et le terrain par chasse (ou tu les fixes à la main), puis affiche :

- le TdC total chassé, la durée, l'heure de retour et la rentabilité en cm² par jour ;
- l'**estimation des pertes** (min, moyenne, max), aussi en temps de ponte ;
- la **répartition des unités** par chasse ;
- les pertes si ton TdC à l'arrivée est différent de celui prévu (flood pendant la chasse…).

Un champ **Retour souhaité** calcule le terrain par chasse pour rentrer à une heure donnée. **Copier le résumé** prépare un texte pour le forum.

**Lancer les chasses** n'est possible que si l'armée, les niveaux et le TdC au lancement sont bien les tiens, et que tes places de chasse libres suffisent. Une chasse part toutes les 2 secondes.

## Onglet _Par pertes_

Les chasses réglées sur les **pertes que tu acceptes**, plutôt que sur la réplique à 10 %. Tu indiques un nombre de JSN, **en moyenne** (les pertes tournent autour, parfois plus) ou **au pire** (elles ne le dépassent pas), et ton TdC à l'arrivée. Toolzzz prend ton armée, tes niveaux, ton terrain et tes places de chasse libres.

Pour chaque nombre de chasses possible, le tableau donne le plus grand terrain qui respecte tes pertes, la durée, les pertes moyennes et max, et la rentabilité. La plus rentable est en gras et sélectionnée, mais tu peux en choisir une autre ; la répartition des unités suit, et **Lancer les chasses** les envoie.

Avec une limite de pertes, la meilleure option est souvent **une seule grosse chasse** : chaque chasse ajoute sa propre difficulté de base, donc découper coûte plus de pertes.

> Les pertes viennent des tables du simulateur de Calystene, qui donnent un minimum, une moyenne et un maximum. Une probabilité du type « 2 000 JSN ou moins dans 80 % des cas » n'est pas disponible faute de données pour la calculer.

## Onglet _Bestiaire_

Le Bestiaire est une **table de référence** des 17 espèces de faune du jeu. Pour chaque espèce, tu vois :

- L'image de l'espèce
- **FdF** (Force de Frappe, c'est-à-dire l'attaque)
- **Vie**
- **Difficulté** (utile pour estimer si une chasse va donner beaucoup d'XP ou non)

Le tableau est zébré pour la lisibilité. Pratique quand tu veux comparer rapidement ce que vaut un Termite face à une Araignée géante avant d'envoyer une chasse de masse.

> Stats issues du [Bestiaire](http://alliancead2.free.fr/Bestiaire.html) de Calystène (2017). Les valeurs n'ont pas changé depuis et sont restées la référence de la communauté Fourmizzz.

## Lien avec la Messagerie

Tu n'es pas obligé·e de copier-coller pour utiliser l'analyseur. Sur la page **Messagerie**, Toolzzz parse aussi les rapports de chasse au clic — voir [Enrichissements de pages](Enrichissements-de-pages#messagerie). La boîte _Analyser_ reste utile pour les rapports collés depuis ailleurs (Discord, forum d'alliance, copies récentes, etc.).
