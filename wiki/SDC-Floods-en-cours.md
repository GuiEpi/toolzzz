## SDC — Floods en cours

L'onglet **Floods** du menu d'alliance affiche les floods que les membres de l'alliance ont en cours : qui floode qui, quand le flood arrive, et combien de terrain la cible devrait avoir après. Pratique pour éviter de flooder à plusieurs la même cible sans le savoir, ou pour voir d'un coup d'œil qui est déjà parti.

Comme le reste du SDC, tout est stocké dans une **section cachée du forum d'alliance** (`Toolzzz_Flood`). Rien ne sort du jeu, et les droits d'accès sont ceux du forum de ton alliance.

## Mise en place (une fois par alliance)

Un **chef d'alliance** clique sur l'icône Toolzzz en haut des catégories du forum d'alliance, puis sur **Préparer le forum pour un SDC**. La section `Toolzzz_Flood` est créée et cachée en même temps que `Toolzzz_Commande` et `Toolzzz_Membre`. Si ton alliance avait déjà son SDC, le même bouton ajoute seulement la section qui manque : Toolzzz relit la liste des sections du forum avant de créer quoi que ce soit, et ne recrée jamais une section existante, même sous son ancien nom Outiiil.

Les membres n'ont rien à faire : Toolzzz trouve la section tout seul, au passage sur le forum ou au premier flood.

### Utiliser la section de floods de ton alliance

Si ton alliance tient déjà une section de floods à la main, avec **un sujet par joueur floodé**, Toolzzz peut y écrire directement : chaque membre saisit l'identifiant de cette section dans le champ **Flood** de [Boîte Paramètres → Utilitaire](Boite-Parametres#onglet-utilitaire). Toolzzz retrouve le sujet de la cible par le pseudo en tête de son titre (« Ragnar » comme « Ragnar / 592 / 52 »), et le crée s'il n'existe pas. Les membres sans Toolzzz continuent de lire et d'écrire dans la section comme avant.

## Ce qui est noté

Chaque flood que tu lances **sur un terrain de chasse** est noté dans le **sujet de sa cible**, dont le titre est le pseudo du joueur floodé. Toolzzz le crée au premier flood sur ce joueur, puis chacun y ajoute ses floods sur lui : le nombre d'unités, l'heure d'arrivée et le terrain estimé de la cible avant et après.

- Les attaques lancées **ensemble** sur une même cible (un flood optimisé, par exemple) sont notées dans **un seul message**. Un flood relancé plus tard sur la même cible a son propre message.
- Le message part quelques secondes après la dernière attaque du flood. Si tu changes de page avant, il part depuis la page suivante.

- Les floods envoyés depuis la page **Attaquer**, le **Lanceur de flood** et le [Multi-flood](Outils-d-attaque#onglet-multi-flood) sont tous notés.
- Les attaques sur une fourmilière ou une loge ne sont **pas** partagées.
- Si tu **annules** un flood dans les deux minutes que laisse le jeu, Toolzzz ajoute un message d'annulation dans le sujet de la cible au prochain passage sur une page qui liste tes attaques (Armée, Attaquer). Le flood disparaît alors de l'onglet.
- Seuls les floods lancés depuis un navigateur équipé de Toolzzz sont notés. Ceux qu'un membre lance sans l'extension n'apparaissent pas.

Pour ne plus rien partager, décoche **Partager mes floods avec l'alliance** dans [Boîte Paramètres → Utilitaire](Boite-Parametres#onglet-utilitaire).

## L'onglet Floods

L'onglet **Floods**, à côté de **Carte** dans le menu d'alliance, lit les sujets de la section et affiche les floods qui ne sont pas encore arrivés, triés par heure d'arrivée :

- **Arrivée** et **Dans** — l'heure d'arrivée et le compte à rebours.
- **Lanceur** et **Cible** — avec un lien vers leur profil. Tes propres floods sont en gras.
- **Unités** — le nombre d'unités envoyées.
- **TdC de la cible (estimé)** — le terrain de la cible avant et après chaque flood. Toolzzz enchaîne tous les floods de l'alliance sur une même cible par ordre d'arrivée, en partant du terrain relevé au lancement du premier : chaque flood prend son nombre d'unités, dans la limite de 20 % du terrain qu'il reste à la cible.

Le tableau est chargé à l'ouverture de l'onglet. Le bouton **Actualiser** le recharge. Toolzzz ne rouvre que les sujets qui ont reçu un message depuis sa dernière lecture, ce qui garde le chargement rapide même quand la section grossit. Les anciens sujets au pseudo du lanceur (Toolzzz 3.19 et avant) restent lus.

## Dans les lanceurs de flood

Le **Lanceur de flood** de la page Attaquer et le [Multi-flood](Outils-d-attaque#onglet-multi-flood) se servent de ces floods en vol pour pré-remplir les terrains **à l'arrivée** de tes attaques, au lieu des terrains actuels :

- **Le terrain de la cible** — son terrain de profil, moins ce que vont lui prendre les floods de l'alliance qui la touchent avant toi.
- **Ton terrain** — ton terrain actuel, plus ce que vont te rapporter tes floods déjà en vol (lancés depuis n'importe quel navigateur équipé de Toolzzz), moins ce que te prennent les floods d'alliés sur toi.

Le calcul optimisé part donc des bonnes valeurs. Pendant que Toolzzz lit les floods en vol, le bouton de lancement est grisé et un message « Chargement des floods en vol de l'alliance… » s'affiche : le flood ne peut pas partir sur un calcul qui va encore changer. Un résumé sous le formulaire indique ce qui a été compté, par exemple « Cible −640 000 (2 floods de Pierre, Paul) · toi +50 000 (1 flood à toi) ». Les champs restent modifiables : une valeur saisie à la main n'est jamais écrasée.

Les floods des joueurs sans Toolzzz et les attaques ennemies ne sont pas connus, et ne sont donc pas comptés. Tes propres floods sont pris en compte même si la section `Toolzzz_Flood` n'existe pas, tant qu'ils sont partis depuis ce navigateur.
