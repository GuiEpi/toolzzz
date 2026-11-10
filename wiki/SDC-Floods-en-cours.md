## SDC — Floods en cours

L'onglet **Floods** du menu d'alliance affiche les floods que les membres de l'alliance ont en cours : qui floode qui, quand le flood arrive, et combien de terrain la cible devrait avoir après. Pratique pour éviter de flooder à plusieurs la même cible sans le savoir, ou pour voir d'un coup d'œil qui est déjà parti.

Comme le reste du SDC, tout est stocké dans une **section cachée du forum d'alliance** (`Toolzzz_Flood`). Rien ne sort du jeu, et les droits d'accès sont ceux du forum de ton alliance.

## Mise en place (une fois par alliance)

Un **chef d'alliance** clique sur l'icône Toolzzz en haut des catégories du forum d'alliance, puis sur **Préparer le forum pour un SDC**. La section `Toolzzz_Flood` est créée et cachée en même temps que `Toolzzz_Commande` et `Toolzzz_Membre`. Si ton alliance avait déjà son SDC, le même bouton ajoute seulement la section qui manque : Toolzzz relit la liste des sections du forum avant de créer quoi que ce soit, et ne recrée jamais une section existante, même sous son ancien nom Outiiil.

Les membres n'ont rien à faire : Toolzzz trouve la section tout seul, au passage sur le forum ou au premier flood.

## Ce qui est noté

Chaque flood que tu lances **sur un terrain de chasse** est noté dans **ton sujet** de la section `Toolzzz_Flood`, dont le titre est ton pseudo. Toolzzz le crée à ton premier flood, puis ajoute un message par flood : la cible, le nombre d'unités, l'heure d'arrivée et le terrain estimé de la cible avant et après.

- Les floods envoyés depuis la page **Attaquer**, le **Lanceur de flood** et le [Multi-flood](Outils-d-attaque#onglet-multi-flood) sont tous notés.
- Les attaques sur une fourmilière ou une loge ne sont **pas** partagées.
- Si tu **annules** un flood dans les deux minutes que laisse le jeu, Toolzzz ajoute un message d'annulation au prochain passage sur une page qui liste tes attaques (Armée, Attaquer). Le flood disparaît alors de l'onglet.
- Seuls les floods lancés depuis un navigateur équipé de Toolzzz sont notés. Ceux qu'un membre lance sans l'extension n'apparaissent pas.

Pour ne plus rien partager, décoche **Partager mes floods avec l'alliance** dans [Boîte Paramètres → Utilitaire](Boite-Parametres#onglet-utilitaire).

## L'onglet Floods

L'onglet **Floods**, à côté de **Carte** dans le menu d'alliance, lit le sujet de chaque membre et affiche les floods qui ne sont pas encore arrivés, triés par heure d'arrivée :

- **Arrivée** et **Dans** — l'heure d'arrivée et le compte à rebours.
- **Lanceur** et **Cible** — avec un lien vers leur profil. Tes propres floods sont en gras.
- **Unités** — le nombre d'unités envoyées.
- **TdC de la cible (estimé)** — le terrain de la cible avant et après chaque flood. Toolzzz enchaîne tous les floods de l'alliance sur une même cible par ordre d'arrivée, en partant du terrain relevé au lancement du premier : chaque flood prend son nombre d'unités, dans la limite de 20 % du terrain qu'il reste à la cible.

Le tableau est chargé à l'ouverture de l'onglet. Le bouton **Actualiser** le recharge.

## Dans les lanceurs de flood

Le **Lanceur de flood** de la page Attaquer et le [Multi-flood](Outils-d-attaque#onglet-multi-flood) se servent de ces floods en vol pour pré-remplir les terrains **à l'arrivée** de tes attaques, au lieu des terrains actuels :

- **Le terrain de la cible** — son terrain de profil, moins ce que vont lui prendre les floods de l'alliance qui la touchent avant toi.
- **Ton terrain** — ton terrain actuel, plus ce que vont te rapporter tes floods déjà en vol (lancés depuis n'importe quel navigateur équipé de Toolzzz), moins ce que te prennent les floods d'alliés sur toi.

Le calcul optimisé part donc des bonnes valeurs. Un résumé sous le formulaire indique ce qui a été compté, par exemple « Cible −640 000 (2 floods de Pierre, Paul) · toi +50 000 (1 flood à toi) ». Les champs restent modifiables : une valeur saisie à la main n'est jamais écrasée.

Les floods des joueurs sans Toolzzz et les attaques ennemies ne sont pas connus, et ne sont donc pas comptés. Tes propres floods sont pris en compte même si la section `Toolzzz_Flood` n'existe pas, tant qu'ils sont partis depuis ce navigateur.
