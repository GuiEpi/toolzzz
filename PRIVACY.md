# Privacy Policy — Toolzzz

**Last updated:** October 2026

## Data Collection

Toolzzz does **not** collect or store any personal data on external servers. The only data that leaves your browser is the text you type in the chat GIF search, sent to GIPHY (see below).

## What the extension accesses

- **Fourmizzz game pages**: The extension reads the DOM of pages on `*.fourmizzz.fr` to display its in-game tools (chasse, combat, convoi, alliance, radar, etc.). All processing happens locally in your browser.
- **Local preferences and caches**: Toolzzz stores user settings and gameplay caches in the browser's `localStorage`, scoped to the `fourmizzz.fr` origin. Keys used:
  - `outiiil_parametre` — UI preferences (colors, dock position, toggles)
  - `outiiil_joueur` — local cache of player data viewed in-game
  - `outiiil_evolution` — local history of player stats over time
  - `outiiil_radar` — local radar tracking data
  - `outiiil_boiteActive` — which panel was last open
  - `outiiil_gifCache` — GIPHY results of your recent chat GIF searches, kept one hour
- **Network requests**: The only requests Toolzzz initiates are to `*.fourmizzz.fr` itself (e.g. `classementAlliance.php`), to fetch in-game data the user is already authenticated to access. The only other domain contacted is GIPHY, when you use the chat GIF button.

## Third-party services

Toolzzz does **not** use any analytics or telemetry.

The chat **GIF button** uses the [GIPHY API](https://developers.giphy.com/). When you open it, the trending GIFs are requested from `api.giphy.com`; when you type a search, the search text is sent to GIPHY. GIF previews and the GIFs posted in the chat are loaded from GIPHY's servers, which therefore see your IP address. Nothing is sent to GIPHY unless you open the GIF button. See [GIPHY's privacy policy](https://support.giphy.com/hc/en-us/articles/360032872931-GIPHY-Privacy-Policy).

## Data sharing

We do **not** sell, transfer, or share any user data with third parties. Apart from the GIF search described above, no data leaves your browser.

## Source code

Toolzzz is open source under GPL-3.0. The full source is available at <https://github.com/GuiEpi/toolzzz>.

## Contact

If you have questions about this privacy policy, please [open an issue](https://github.com/GuiEpi/toolzzz/issues).
