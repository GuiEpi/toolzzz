# Glossaire FR → EN

Vocabulaire de référence pour la Phase 3 de la migration WXT : passage des
identifiants, noms de fichiers et commentaires en anglais. Établi à partir des
identifiants réellement présents dans `src/` (extraction AST, triés par
fréquence), pas d'une liste théorique.

**À approuver avant tout renommage.** Les entrées marquées **?** demandent un
arbitrage : plusieurs traductions se défendent, ou le terme est déjà anglais.

## Ce qui n'est JAMAIS renommé

Ce sont des données, pas des identifiants :

- les chaînes affichées au joueur (toute l'UI reste en français) ;
- les clés de stockage `outiiil_*` (Phase 4 définit le nouveau schéma) ;
- les ids et classes DOM `o_*` (`#o_toolbarOutiiil`, `.o_button`…) ;
- les sélecteurs CSS et les classes du jeu (`.boite_connexion_titre`,
  `#menuAlliance`, `.ligneAmelioration`, `choixOuvriere`…) ;
- les URLs du jeu (`/Reine.php`, `/laboratoire.php`, `?forum_menu`…) et les
  paramètres de requête (`Pseudo=`, `xajax=callGetForum`) ;
- les expressions régulières qui reconnaissent du texte du jeu
  (`/rempli à (\d+)\s*%/`, `"Vos troupes sont en marche"`…) ;
- les noms des sections de forum (`Toolzzz_Commande`, `Toolzzz_Membre`) ;
- `Outiiil` dans les mentions d'origine et la licence.

## Vocabulaire du jeu

| FR                       | EN                       | Remarque                                                                                                                                             |
| ------------------------ | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| ponte                    | **laying** **?**         | production d'unités chez la Reine. `laying` est littéral ; `brood` ou `spawn` sonneraient plus naturel en anglais de jeu.                            |
| chasse                   | hunt                     |                                                                                                                                                      |
| convoi                   | convoy                   |                                                                                                                                                      |
| reine                    | queen                    |                                                                                                                                                      |
| armée                    | army                     |                                                                                                                                                      |
| combat                   | **battle** **?**         | `combat` est déjà un mot anglais : on peut aussi ne rien changer.                                                                                    |
| attaque / attaquer       | attack                   |                                                                                                                                                      |
| attaque lancée           | sent attack              | classe `AttaqueLancee` : attaque mémorisée à l'envoi pour la fenêtre d'annulation.                                                                   |
| flood                    | flood                    | déjà anglais, terme consacré des joueurs.                                                                                                            |
| sonde / sonder           | probe                    |                                                                                                                                                      |
| défenseur / attaquant    | defender / attacker      |                                                                                                                                                      |
| cible                    | target                   |                                                                                                                                                      |
| prise                    | **capture** **?**        | terrain gagné sur la cible. `gain` ou `loot` possibles.                                                                                              |
| terrain                  | **land** **?**           | compteur de territoire. `terrain` est aussi anglais ; `land` lève l'ambiguïté avec « terrain de chasse ».                                            |
| terrain de chasse (TDC)  | hunting ground           |                                                                                                                                                      |
| fourmilière              | colony                   |                                                                                                                                                      |
| dôme                     | dome                     |                                                                                                                                                      |
| loge (impériale)         | (imperial) lodge         |                                                                                                                                                      |
| lieu                     | **place** **?**          | `LIEU = {TERRAIN, DOME, LOGE}` = où stationne l'armée. **Ne pas traduire par `location`** : collision avec `window.location`. `place` ou `garrison`. |
| nourriture               | food                     |                                                                                                                                                      |
| pomme (POM)              | food                     | `COUT_RECHERCHE_POM` → coût en nourriture.                                                                                                           |
| matériaux (MAT, BOI)     | materials                | `COUT_RECHERCHE_BOI` (bois) désigne aussi les matériaux.                                                                                             |
| ouvrière                 | worker                   |                                                                                                                                                      |
| unité                    | unit                     |                                                                                                                                                      |
| faune                    | wildlife                 | cibles de chasse.                                                                                                                                    |
| réplique                 | **retaliation** **?**    | `REPLIQUE_CHASSE` : riposte de la faune.                                                                                                             |
| perte                    | loss                     |                                                                                                                                                      |
| ratio                    | ratio                    |                                                                                                                                                      |
| niveau                   | level                    |                                                                                                                                                      |
| construction             | building                 | le bâtiment ; `construction.php` reste.                                                                                                              |
| recherche                | research                 |                                                                                                                                                      |
| laboratoire              | lab                      |                                                                                                                                                      |
| évolution                | upgrade                  | construction ou recherche en cours.                                                                                                                  |
| coût                     | cost                     | `COUT_CONSTUCTION` contient une coquille (`CONSTUCTION`) à corriger au passage.                                                                      |
| technique de ponte (TDP) | **laying tech** **?**    | `getTDP()` → `getLayingTech()`. Garder l'abréviation `TDP` dans les identifiants est une autre option.                                               |
| alliance                 | alliance                 |                                                                                                                                                      |
| membre                   | member                   |                                                                                                                                                      |
| grade                    | grade                    | rang officiel du jeu dans l'alliance.                                                                                                                |
| rang                     | rank                     | rang Toolzzz attribué via la boîte Rang.                                                                                                             |
| classement               | leaderboard              | `classementAlliance.php` ; distinct de « rang ».                                                                                                     |
| utilitaire               | **alliance tools** **?** | le SDC (sections de forum partagées). `utility` serait trompeur.                                                                                     |
| commande                 | order                    | commande de ressources du SDC.                                                                                                                       |
| livraison / livrer       | delivery / deliver       |                                                                                                                                                      |
| échéance                 | deadline                 |                                                                                                                                                      |
| pseudo                   | **nickname** **?**       | `playerName` est plus explicite ; `pseudo` reste dans les URLs du jeu.                                                                               |
| serveur                  | server                   |                                                                                                                                                      |
| compte                   | account                  |                                                                                                                                                      |
| Compte+                  | **ComptePlus** **?**     | nom commercial de l'offre payante du jeu : à garder tel quel, comme une marque.                                                                      |
| messagerie               | messages                 |                                                                                                                                                      |
| commerce                 | trade                    |                                                                                                                                                      |
| forum                    | forum                    |                                                                                                                                                      |
| chat                     | chat                     |                                                                                                                                                      |
| profil                   | profile                  |                                                                                                                                                      |
| menu rapide              | quick menu               |                                                                                                                                                      |
| boîte                    | box                      | panneau flottant de l'extension.                                                                                                                     |
| dock / radar / toast     | dock / radar / toast     | déjà anglais.                                                                                                                                        |

## Verbes et préfixes de méthodes

| FR                        | EN                              |
| ------------------------- | ------------------------------- |
| afficher                  | render (UI) / show (visibilité) |
| cacher                    | hide                            |
| charger                   | load                            |
| récupérer / recup         | fetch                           |
| enregistrer / sauvegarder | save                            |
| créer                     | create                          |
| modifier                  | update                          |
| supprimer                 | delete                          |
| annuler                   | cancel                          |
| lancer                    | launch                          |
| envoyer                   | send                            |
| calculer / calcul         | compute                         |
| exécuter / executer       | run                             |
| ajouter                   | add                             |
| parser / parse            | parse                           |
| trouver                   | find                            |
| vérifier                  | check                           |
| appliquer                 | apply                           |
| rafraîchir / actualiser   | refresh                         |

## Noms communs

| FR                   | EN                             |
| -------------------- | ------------------------------ |
| valeur               | value                          |
| valeur possible      | allowed values                 |
| données              | data                           |
| liste                | list                           |
| ligne                | row (tableau) / line (texte)   |
| colonne              | column                         |
| indice               | index                          |
| nombre / nbr         | count                          |
| somme                | total                          |
| titre                | title                          |
| texte                | text                           |
| nom                  | name                           |
| libellé              | label                          |
| paramètre (réglage)  | setting                        |
| paramètre (argument) | options / params               |
| répartition          | distribution                   |
| méthode              | method                         |
| état                 | state (UI) / status (commande) |
| durée                | duration                       |
| temps                | time                           |
| temps de trajet      | travel time                    |
| retour               | return                         |
| arrivée              | arrival                        |
| début                | start                          |
| mois / jour          | months / days                  |

## Classes et fichiers

### `src/models/`

| Actuel               | Proposé         |
| -------------------- | --------------- |
| `Alliance`           | `Alliance`      |
| `Armee`              | `Army`          |
| `AttaqueLancee`      | `SentAttack`    |
| `Chasse`             | `Hunt`          |
| `Combat`             | `Battle` **?**  |
| `Commande`           | `Order`         |
| `Convoi`             | `Convoy`        |
| `Joueur`             | `Player`        |
| `Parametre`          | `Setting`       |
| `monProfil` (module) | `currentPlayer` |

### `src/boxes/`

| Actuel            | Proposé               |
| ----------------- | --------------------- |
| `Boite`           | `Box`                 |
| `BoiteChasse`     | `HuntBox`             |
| `BoiteCombat`     | `BattleBox` **?**     |
| `BoiteCommande`   | `OrderBox`            |
| `BoiteComptePlus` | `ComptePlusBox` **?** |
| `BoiteParametre`  | `SettingsBox`         |
| `BoitePonte`      | `LayingBox` **?**     |
| `BoiteRadar`      | `RadarBox`            |
| `BoiteRang`       | `RankBox`             |
| `BoiteRapport`    | `ReportBox`           |
| `Dock`            | `Dock`                |

### `src/pages/`

| Actuel             | Page du jeu                        | Proposé                     |
| ------------------ | ---------------------------------- | --------------------------- |
| `PageAlliance`     | `alliance.php?Membres`             | `AllianceMembersPage`       |
| `PageArmee`        | `Armee.php`                        | `ArmyPage`                  |
| `PageAttaquer`     | `ennemie.php?Attaquer`             | `AttackPage`                |
| `PageChat`         | `chat.php`                         | `ChatPage`                  |
| `PageCommerce`     | `commerce.php`                     | `TradePage`                 |
| `PageCompte`       | `compte.php`                       | `AccountPage`               |
| `PageConstruction` | `construction.php`                 | `BuildingsPage`             |
| `PageDescription`  | `classementAlliance.php?alliance=` | `AllianceProfilePage` **?** |
| `PageForum`        | `alliance.php?forum_menu`          | `ForumPage`                 |
| `PageLaboratoire`  | `laboratoire.php`                  | `LabPage`                   |
| `PageMessagerie`   | `messagerie.php`                   | `MessagesPage`              |
| `PageProfil`       | `Membre.php?Pseudo=`               | `PlayerProfilePage`         |
| `PageReine`        | `Reine.php`                        | `QueenPage`                 |
| `PageRessource`    | `Ressources.php`                   | `ResourcesPage`             |

Les fichiers prennent le nom de leur classe sans le suffixe (`pages/Queen.ts`,
`boxes/HuntBox.ts` → `boxes/Hunt.ts` ?). **?** À trancher : garder le suffixe
dans le nom de fichier (`pages/QueenPage.ts`) ou pas (`pages/Queen.ts`, comme
aujourd'hui).

### Autres fichiers

| Actuel                      | Proposé                       |
| --------------------------- | ----------------------------- |
| `src/lib/Utils.ts`          | `src/lib/Utils.ts` (inchangé) |
| `src/constants/colonie.ts`  | `constants/colony.ts`         |
| `src/constants/unites.ts`   | `constants/units.ts`          |
| `src/constants/chasse.ts`   | `constants/hunt.ts`           |
| `src/constants/smileys.ts`  | `constants/smileys.ts`        |
| `src/constants/images.ts`   | `constants/images.ts`         |
| `src/constants/toasts.ts`   | `constants/toasts.ts`         |
| `src/constants/ui.ts`       | `constants/ui.ts`             |
| `src/constants/commande.ts` | `constants/orders.ts`         |
| `src/constants/dates.ts`    | `constants/dates.ts`          |
| `src/data/couts.ts`         | `data/costs.ts`               |
| `src/data/menuRapide.ts`    | `data/quickMenu.ts`           |

## Constantes

| Actuel                                      | Proposé                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CONSTRUCTION`                              | `BUILDINGS`                                                                                                                                                                                                                                                                                                                                                                                                   |
| `RECHERCHE`                                 | `RESEARCHES`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `COUT_CONSTUCTION` _(sic)_                  | `BUILDING_COSTS`                                                                                                                                                                                                                                                                                                                                                                                              |
| `COUT_RECHERCHE_POM` / `_BOI`               | `RESEARCH_COST_FOOD` / `RESEARCH_COST_MATERIALS`                                                                                                                                                                                                                                                                                                                                                              |
| `NOM_UNITE` / `NOM_UNITES`                  | `UNIT_NAME` / `UNIT_NAMES`                                                                                                                                                                                                                                                                                                                                                                                    |
| `NOM_RAC_UNITE`                             | `UNIT_SHORT_NAMES`                                                                                                                                                                                                                                                                                                                                                                                            |
| `TEMPS_UNITE`                               | `UNIT_TIME`                                                                                                                                                                                                                                                                                                                                                                                                   |
| `COUT_UNITE`                                | `UNIT_COST`                                                                                                                                                                                                                                                                                                                                                                                                   |
| `VIE_UNITE` / `ATT_UNITE` / `DEF_UNITE`     | `UNIT_HP` / `UNIT_ATTACK` / `UNIT_DEFENSE`                                                                                                                                                                                                                                                                                                                                                                    |
| `RATIO_CHASSE`                              | `HUNT_RATIO`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `PERTE_MIN_CHASSE` / `_MOY_` / `_MAX_`      | `HUNT_LOSS_MIN` / `_AVG` / `_MAX`                                                                                                                                                                                                                                                                                                                                                                             |
| `ORDRE_UNITE_CHASSE`                        | `HUNT_UNIT_ORDER`                                                                                                                                                                                                                                                                                                                                                                                             |
| `ORDRE_XP_CHASSE`                           | `HUNT_XP_ORDER`                                                                                                                                                                                                                                                                                                                                                                                               |
| `FAUNE`                                     | `WILDLIFE`                                                                                                                                                                                                                                                                                                                                                                                                    |
| `REPLIQUE_CHASSE`                           | `HUNT_RETALIATION` **?**                                                                                                                                                                                                                                                                                                                                                                                      |
| `LISTESMILEY1…6`                            | `SMILEYS_1…6`                                                                                                                                                                                                                                                                                                                                                                                                 |
| `IMG_*`                                     | `IMG_*` (anglicisation des suffixes : `IMG_FLECHE` → `IMG_ARROW`, `IMG_POMME` → `IMG_FOOD`, `IMG_CROIX` → `IMG_CROSS`, `IMG_CRAYON` → `IMG_PENCIL`, `IMG_COPIER` → `IMG_COPY`, `IMG_LIVRAISON` → `IMG_DELIVERY`, `IMG_ACTUALISER` → `IMG_REFRESH`, `IMG_HISTORIQUE` → `IMG_HISTORY`, `IMG_GAUCHE`/`IMG_DROITE` → `IMG_LEFT`/`IMG_RIGHT`, `IMG_VIE`/`IMG_ATT`/`IMG_DEF` → `IMG_HP`/`IMG_ATTACK`/`IMG_DEFENSE`) |
| `TOAST_*`                                   | inchangé                                                                                                                                                                                                                                                                                                                                                                                                      |
| `EVOLUTION`                                 | `UPGRADES`                                                                                                                                                                                                                                                                                                                                                                                                    |
| `EFFET`                                     | `EFFECTS`                                                                                                                                                                                                                                                                                                                                                                                                     |
| `METHODE_FLOOD`                             | `FLOOD_METHODS`                                                                                                                                                                                                                                                                                                                                                                                               |
| `LIEU` / `LIBELLE_LIEU`                     | `PLACE` / `PLACE_LABELS` **?**                                                                                                                                                                                                                                                                                                                                                                                |
| `ETAT_COMMANDE`                             | `ORDER_STATUS`                                                                                                                                                                                                                                                                                                                                                                                                |
| `MOIS_FR` / `MOIS_RAC_FR` / `JOUR_FR`       | `MONTHS_FR` / `MONTHS_SHORT_FR` / `DAYS_FR` (suffixe `_FR` conservé : ce sont des libellés français)                                                                                                                                                                                                                                                                                                          |
| `DATEPICKER_OPTION`                         | `DATEPICKER_OPTIONS`                                                                                                                                                                                                                                                                                                                                                                                          |
| `MENU_RAPIDE` / `MENU_RAPIDE_KEY`           | `QUICK_MENU` / `QUICK_MENU_KEY`                                                                                                                                                                                                                                                                                                                                                                               |
| `COUTS_*` (data)                            | `COSTS_*`                                                                                                                                                                                                                                                                                                                                                                                                     |
| `coutsTempsConstru` / `coutsTempsRecherche` | `buildingTime` / `researchTime`                                                                                                                                                                                                                                                                                                                                                                               |
| `coutsMat` / `coutsPom` / `coutsOuv`        | `materialsCost` / `foodCost` / `workersCost`                                                                                                                                                                                                                                                                                                                                                                  |
| `coutsCapaEntrepot` / `coutsProdChampi`     | `warehouseCapacity` / `mushroomProduction`                                                                                                                                                                                                                                                                                                                                                                    |
| `CLE_ATTAQUES_LANCEES`                      | `KEY_SENT_ATTACKS`                                                                                                                                                                                                                                                                                                                                                                                            |
| `CLE_ANNULATION_ECHEC`                      | `KEY_CANCEL_FAILURES`                                                                                                                                                                                                                                                                                                                                                                                         |
| `DUREE_VIE_CAPTURE`                         | `CAPTURE_TTL`                                                                                                                                                                                                                                                                                                                                                                                                 |
| `DELAI_ANNULATION`                          | `CANCEL_WINDOW`                                                                                                                                                                                                                                                                                                                                                                                               |
| `FORUM_SECTION_COMMANDE` / `_MEMBRE`        | `FORUM_SECTION_ORDERS` / `_MEMBERS`                                                                                                                                                                                                                                                                                                                                                                           |

## Décisions

Arbitrées par le mainteneur le 2026-10-03 :

1. **`ponte` → `spawn`** (et non `laying`).
2. **`combat` → `battle`**.
3. **`lieu` → `place`**.
4. **`Compte+` → `ComptePlus`**, gardé tel quel : c'est le nom commercial de
   l'offre payante du jeu.
5. **Commentaires** : tous traduits en anglais, y compris ceux qui citent du
   texte du jeu (le texte cité, lui, reste en français entre guillemets).

Tranchées par défaut, réversibles :

6. **`terrain`** reste `terrain` — le mot existe en anglais et c'est aussi une
   clé de données du jeu (voir ci-dessous).
7. **`prise` → `capture`** pour les identifiants internes ; la clé de données
   `prise` ne bouge pas.
8. **`pseudo`** reste `pseudo` : c'est une clé de données et un paramètre
   d'URL du jeu (`Membre.php?Pseudo=`).
9. **`utilitaire` → `tools`** (le SDC) ; le sigle « SDC » reste tel quel.
10. **`TDP` → `spawnTech`**, **`TDC` → `huntingGround`** : développés, les
    ids DOM `o_chasseTDC*` gardant l'abréviation.
11. **Noms de fichiers** sans suffixe (`pages/Queen.ts` pour `QueenPage`),
    comme avant la migration.
12. **`PageDescription` → `AllianceProfilePage`** : vérifié, cette page est
    bien la fiche d'une alliance (`classementAlliance.php?alliance=`).

## Noms gelés : les données ne sont pas des identifiants

238 noms ne sont **pas** renommés parce qu'ils franchissent une frontière
sérialisée — les renommer changerait le format stocké ou le protocole du jeu :

- **clés JSON persistées** : elles sont produites par les `toJSON()` et les
  listes blanches de `JSON.stringify`, puis relues telles quelles
  (`niveauConstruction`, `niveauRecherche`, `ordreRadar`, `sujetForum`,
  `terrain`, `pseudo`, `rang`, `mv`, `x`, `y`, `id`, `tag`, `joueurs`,
  `alliances`, `separateurs`, `ponte`, `startPonte`, `expConstruction`,
  `attaque`, `convoi`, `chasse`, `members`, `timestamp`…) ;
- **champs de protocole du jeu** envoyés ou lus dans les requêtes
  (`unite`, `cible`, `lieu`, `prise`, `quantite`, `nourriture`, `materiaux`,
  `grades`, `rangs`, `section`, `xajax`…).

Le code interne qui les manipule est renommé (`this._niveauRecherche` est
devenu `this._researchLevels`) ; seule la **clé littérale** reste française,
dans le `toJSON()` qui la produit. C'est la Phase 4, qui réécrit la couche de
stockage avec des items typés, qui pourra introduire une correspondance
explicite et libérer ces noms.

## Ce que le renommage a touché

- 477 membres de classes, constantes et symboles de module (3 594 occurrences) ;
- 551 variables locales, paramètres et fonctions internes (renommés via le
  service de langage TypeScript, portée par portée) ;
- 35 fichiers renommés et leurs chemins d'import.

Invariant vérifié après coup : les **8 724 littéraux** de `src/` (chaînes,
gabarits, regex, nombres) sont identiques avant et après — aucun texte
affiché, sélecteur CSS, URL de jeu ni clé de stockage n'a bougé.
