# Toolzzz

Extension navigateur pour [Fourmizzz.fr](http://www.fourmizzz.fr), fork et maintenance de [Outiiil](https://github.com/Hraesvelg/Outiiil).

L'objectif reste identique à celui du projet d'origine : intégrer directement dans le jeu des outils libres et transparents, sans stocker de données personnelles ailleurs que sur la machine du joueur. Le code source est lisible, auditable et modifiable par quiconque.

## Installation

- **Chrome / Chromium / Edge** : télécharger le zip `toolzzz-X.Y.Z-chrome.zip` depuis la page [Releases](https://github.com/GuiEpi/toolzzz/releases), le dézipper, puis dans `chrome://extensions` activer le mode développeur et cliquer sur *Charger l'extension non empaquetée* en sélectionnant le dossier dézippé.
- **Firefox** : télécharger le `.xpi` signé depuis la page [Releases](https://github.com/GuiEpi/toolzzz/releases) — un clic suffit pour installer.

## Développement

Prérequis : [Bun](https://bun.sh).

```bash
bun install
```

### Scripts

| Commande                | Description                                        |
| ----------------------- | -------------------------------------------------- |
| `bun run dev`           | Lance l'extension en mode dev (Chrome)             |
| `bun run dev:firefox`   | Lance l'extension en mode dev (Firefox)            |
| `bun run build`         | Build de production (Chrome)                       |
| `bun run build:firefox` | Build de production (Firefox)                      |
| `bun run zip`           | Génère le zip à distribuer pour Chrome             |
| `bun run zip:firefox`   | Génère le zip à signer sur AMO                     |
| `bun run compile`       | Vérification TypeScript                            |

### Charger l'extension en local depuis les sources

**Chrome** : `chrome://extensions` → activer le mode développeur → *Charger l'extension non empaquetée* → sélectionner `.output/chrome-mv3/`.

**Firefox** : `about:debugging#/runtime/this-firefox` → *Charger un module complémentaire temporaire* → sélectionner `.output/firefox-mv3/manifest.json`.

## Crédits

- **Projet original** : [Outiiil](https://github.com/Hraesvelg/Outiiil) par [Hraesvelg](https://github.com/Hraesvelg) (Freddy)
- **Mainteneur du fork** : [GuiEpi](https://github.com/GuiEpi)

## Licence

[GPL-3.0](./LICENSE) — conformément à la licence du projet d'origine.
