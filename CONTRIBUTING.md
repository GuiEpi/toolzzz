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

| Commande                | Description                                            |
| ----------------------- | ------------------------------------------------------ |
| `bun run dev`           | Mode dev avec auto-reload (Chrome)                     |
| `bun run dev:firefox`   | Mode dev avec auto-reload (Firefox)                    |
| `bun run build`         | Build de production (Chrome)                           |
| `bun run build:firefox` | Build de production (Firefox)                          |
| `bun run zip`           | Génère le zip à distribuer pour Chrome                 |
| `bun run zip:firefox`   | Génère le zip à signer sur AMO                         |
| `bun run compile`       | Vérification TypeScript                                |
| `bun run format`        | Formate tous les fichiers avec [oxfmt](https://oxc.rs) |
| `bun run format:check`  | Vérifie le formatage sans modifier les fichiers        |

## Formatage

Le projet utilise [oxfmt](https://oxc.rs) pour le formatage. La config est dans `.oxfmtrc.json` et les libs vendorées (`public/js/lib/`) sont exclues.

**Hook pre-commit** : [husky](https://typicode.github.io/husky/) + [lint-staged](https://github.com/lint-staged/lint-staged) formatent automatiquement les fichiers stagés à chaque `git commit`. Rien à installer manuellement — le hook est posé à l'exécution de `bun install` (via le script `prepare`).

Pour le formatage à la sauvegarde dans ton éditeur, consulte la [doc officielle d'oxfmt](https://oxc.rs/docs/guide/usage/formatter/editors.html). Sinon, lance `bun run format` manuellement.

Côté CI, chaque push et PR sur `master` lance `bun run format:check` — un PR non formaté échoue.

## Assistants IA

Le projet est annoté pour [Claude Code](https://docs.claude.com/claude-code) :

- **`CLAUDE.md`** à la racine — instructions générales du projet (architecture WXT, convention de commit, pipeline release, etc.).
- **`.claude/skills/`** — skills déclenchés conditionnellement (`analyze-fourmizzz`, `ui-primitives`, `release-notes`).

Si tu utilises un autre assistant IA (Codex, GitHub Copilot, Cursor, Windsurf...), tu peux pointer son fichier d'instructions vers `CLAUDE.md` via un symlink local — pas besoin de dupliquer le contenu :

```bash
# OpenAI Codex CLI / standard agents.md
ln -s CLAUDE.md AGENTS.md

# GitHub Copilot (instructions custom du repo)
mkdir -p .github && ln -s ../CLAUDE.md .github/copilot-instructions.md

# Cursor (format legacy, toujours supporté)
ln -s CLAUDE.md .cursorrules

# Windsurf
ln -s CLAUDE.md .windsurfrules
```

Pour les skills (`.claude/skills/`), le mécanisme de chargement conditionnel est spécifique à Claude — les autres outils ne sauront pas les déclencher. En revanche, leur contenu reste lisible : ton outil les trouvera s'il scanne les `.md` du repo, ou tu peux symlinker un skill précis vers le fichier d'instructions de ton outil si tu veux qu'il soit toujours en contexte.

Ces symlinks sont **personnels** — ne les commit pas (le projet ne ship aucun fichier d'instruction non-Claude officiellement). Si tu veux les masquer de `git status`, ajoute-les à `.git/info/exclude` (local, jamais commit), pas au `.gitignore` versionné.

## Tester un build de production

`bun run dev` charge toujours le build de développement. Pour valider un build de production avant une release (ou reproduire un bug qui n'apparaît qu'en prod), fais un build puis charge-le manuellement.

```bash
bun run build            # Chrome  →  .output/chrome-mv3/
bun run build:firefox    # Firefox →  .output/firefox-mv3/
```

**Chrome** : `chrome://extensions` → activer le mode développeur → _Charger l'extension non empaquetée_ → sélectionner `.output/chrome-mv3/`.

**Firefox** : `about:debugging#/runtime/this-firefox` → _Charger un module complémentaire temporaire_ → sélectionner `.output/firefox-mv3/manifest.json`.
