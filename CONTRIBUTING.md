# Contribuer à Toolzzz

Merci de l'intérêt que tu portes au projet. Ce document décrit comment mettre en place l'environnement de développement.

## Prérequis

[Bun](https://bun.sh)

```bash
bun install
```

## Démarrage

```bash
bun run dev            # Chrome
bun run dev:firefox    # Firefox
```

Cette commande build l'extension, lance un navigateur avec l'extension déjà chargée, et surveille les fichiers sources. À chaque modification, elle rebuild automatiquement — il suffit de rafraîchir la page du jeu (F5) pour voir tes changements.

## Scripts

| Commande                | Description                                        |
| ----------------------- | -------------------------------------------------- |
| `bun run dev`           | Mode dev avec auto-reload (Chrome)                 |
| `bun run dev:firefox`   | Mode dev avec auto-reload (Firefox)                |
| `bun run build`         | Build de production (Chrome)                       |
| `bun run build:firefox` | Build de production (Firefox)                      |
| `bun run zip`           | Génère le zip à distribuer pour Chrome             |
| `bun run zip:firefox`   | Génère le zip à signer sur AMO                     |
| `bun run compile`       | Vérification TypeScript                            |

## Tester un build de production

`bun run dev` charge toujours le build de développement. Pour valider un build de production avant une release (ou reproduire un bug qui n'apparaît qu'en prod), fais un build puis charge-le manuellement.

```bash
bun run build            # Chrome  →  .output/chrome-mv3/
bun run build:firefox    # Firefox →  .output/firefox-mv3/
```

**Chrome** : `chrome://extensions` → activer le mode développeur → *Charger l'extension non empaquetée* → sélectionner `.output/chrome-mv3/`.

**Firefox** : `about:debugging#/runtime/this-firefox` → *Charger un module complémentaire temporaire* → sélectionner `.output/firefox-mv3/manifest.json`.
