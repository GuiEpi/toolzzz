<h1>
  <img src="public/images/icons/full.svg" alt="toolzzz" height="48" align="left">
  Toolzzz
</h1>

![Version](https://img.shields.io/github/v/tag/GuiEpi/toolzzz?sort=semver&label=Version)
![Release](https://github.com/GuiEpi/toolzzz/actions/workflows/release.yml/badge.svg)
[![wxt](https://img.shields.io/badge/wxt-ff0?logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgdmlld0JveD0iMCAwIDUxMiA1MTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxnIGNsaXAtcGF0aD0idXJsKCNjbGlwMF8zMDVfNDkwKSI+CjxwYXRoIGQ9Ik0zNDguNjA4IDQ5MkMzODQuOTA1IDQ5MiA0MTQuMzI5IDQ2Mi41NzYgNDE0LjMyOSA0MjYuMjc5VjM2MC41NTdINDI2LjI3OUM0NjIuNTc2IDM2MC41NTcgNDkyIDMzMS4xMzIgNDkyIDI5NC44MzVDNDkyIDI1OC41MzggNDYyLjU3NiAyMjkuMTE0IDQyNi4yNzkgMjI5LjExNEg0MTQuMzI5VjE2My4zOTJDNDE0LjMyOSAxMjcuMDk1IDM4NC45MDUgOTcuNjcwOSAzNDguNjA4IDk3LjY3MDlIMjgyLjg4NlY4NS43MjE1QzI4Mi44ODYgNDkuNDI0NSAyNTMuNDYyIDIwIDIxNy4xNjUgMjBDMTgwLjg2OCAyMCAxNTEuNDQzIDQ5LjQyNDUgMTUxLjQ0MyA4NS43MjE1Vjk3LjY3MDlIODUuNzIxNUM0OS40MjQ1IDk3LjY3MDkgMjAgMTI3LjA5NSAyMCAxNjMuMzkyVjIyOS4xMTRIMzEuOTQ5NEM2OC4yNDY0IDIyOS4xMTQgOTcuNjcwOSAyNTguNTM4IDk3LjY3MDkgMjk0LjgzNUM5Ny42NzA5IDMzMS4xMzIgNjguMjQ2NCAzNjAuNTU3IDMxLjk0OTQgMzYwLjU1N0gyMFY0OTJIMTUxLjQ0M1Y0ODAuMDUxQzE1MS40NDMgNDQzLjc1NCAxODAuODY4IDQxNC4zMjkgMjE3LjE2NSA0MTQuMzI5QzI1My40NjIgNDE0LjMyOSAyODIuODg2IDQ0My43NTQgMjgyLjg4NiA0ODAuMDUxVjQ5MkgzNDguNjA4WiIgc3Ryb2tlPSIjNjdENTVFIiBzdHJva2Utd2lkdGg9IjQwIi8+CjwvZz4KPGRlZnM+CjxjbGlwUGF0aCBpZD0iY2xpcDBfMzA1XzQ5MCI+CjxyZWN0IHdpZHRoPSI1MTIiIGhlaWdodD0iNTEyIiBmaWxsPSJ3aGl0ZSIvPgo8L2NsaXBQYXRoPgo8L2RlZnM+Cjwvc3ZnPgo=&labelColor=grey&color=%2367D55E)](https://wxt.dev)

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
