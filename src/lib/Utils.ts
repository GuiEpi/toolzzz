/*
 * Utils.ts
 * Hraesvelg
 **********************************************************************/

import { $, moment } from "~/vendor";
import {
  BUILDING_COSTS,
  RESEARCH_MATERIALS_COST,
  RESEARCH_FOOD_COST,
  TOAST_WARNING,
} from "~/constants";
import { getProfile } from "~/models/currentPlayer";
import * as session from "~/storage/session";

/**
 * Project-wide data about Fourmizzz, plus helpers usable from anywhere.
 *
 * @class Utils
 */
export class Utils {
  /**
   * Returns the server the player is on.
   *
   * @static
   * @method serveur
   * @return {String} le serveur en cours.
   */
  static get serveur() {
    return location.hostname.split(".")[0].toUpperCase();
  }
  /**
   *
   */
  static get alliance() {
    return $("#tag_alliance").text();
  }
  /**
   * Whether the player has a ComptePlus account.
   *
   * @static
   * @method comptePlus
   * @return {Boolean} Vrai si le joueur a du compte plus, faux sinon.
   */
  static get comptePlus() {
    return $("#menuComptePlus a.boutonStatJoueur").length &&
      $("#menuComptePlus a.boutonStatJoueur").text() == "Stat"
      ? true
      : false;
  }
  /**
   * Returns the player's terrain in cm².
   *
   * @static
   * @method tag
   * @return {Integer} le de nombre de cm².
   */
  static get terrain() {
    return parseInt($("#quantite_tdc").text());
  }
  /**
   * Returns the number of workers.
   *
   * @static
   * @method ouvrieres
   * @return {Integer} le nombre d'ouvriére.
   */
  static get ouvrieres() {
    return parseInt($("#nb_ouvrieres").text());
  }
  /**
   * Returns the food held in the warehouse.
   *
   * @static
   * @method nourriture
   * @return {Integer} le quantité de nourritures.
   */
  static get nourriture() {
    return parseInt($("#nb_nourriture").text());
  }
  /**
   * Returns the materials held in the warehouse.
   *
   * @static
   * @method materiaux
   * @return {Integer} le quantité de materiaux.
   */
  static get materiaux() {
    return parseInt($("#nb_materiaux").text());
  }
  /**
   * Computes the ordered resource quantities — fdthierry
   */
  static computeQuantity(evoOrder) {
    switch (true) {
      // mushroom farm case
      case evoOrder == 0:
        return [
          0,
          BUILDING_COSTS[evoOrder] * Math.pow(1.85, getProfile().niveauConstruction[evoOrder]),
        ];
      // building case
      case evoOrder > 0 && evoOrder < 13:
        return [
          0,
          BUILDING_COSTS[evoOrder] * Math.pow(2, getProfile().niveauConstruction[evoOrder]),
        ];
      // research case
      case evoOrder >= 13 && evoOrder < 23:
        return [
          RESEARCH_FOOD_COST[evoOrder - 13] *
            Math.pow(2, getProfile().niveauRecherche[evoOrder - 13]),
          RESEARCH_MATERIALS_COST[evoOrder - 13] *
            Math.pow(2, getProfile().niveauRecherche[evoOrder - 13]),
        ];
      default:
        return [0, 0];
    }
  }
  /**
   *
   */
  static roundQuantity(val) {
    if (val > 10000000000) return Math.floor(val / 1000000000) * 1000000000;
    if (val > 10000000) return Math.floor(val / 1000000) * 1000000;
    if (val > 1000) return Math.floor(val / 1000) * 1000;
    return val;
  }
  /**
   * Formats an integer number of seconds as a duration.
   *
   * @static
   * @method intToTime
   * @param {Integer} val
   * @return {String} La chaine formatée.
   */
  static intToTime(val) {
    return val
      ? moment
          .duration(val, "s")
          .format("Y[A ]d[J ]h[h ]m[m ]s[s]")
          .split(" ")
          .filter((elt) => {
            return parseInt(elt);
          })
          .join(" ")
      : "0 sec";
  }
  /**
   * Converts a duration string into a number of seconds.
   *
   * @static
   * @method timeToInt
   * @param {String} val
   * @return {Integer} le nombre de seconde correspondant la chaine.
   */
  static timeToInt(val) {
    let regexp = new RegExp("((\\d+)J ?)?\s*((\\d+)h ?)?\s*((\\d+)m ?)?\s*((\\d+)s)?\s*", "i"),
      duree = 0,
      sec,
      minute,
      hour,
      day;
    if ((sec = val.replace(regexp, "$8"))) duree += ~~sec;
    if ((minute = val.replace(regexp, "$6"))) duree += ~~minute * 60;
    if ((hour = val.replace(regexp, "$4"))) duree += ~~hour * 3600;
    if ((day = val.replace(regexp, "$2"))) duree += ~~day * 86400;
    return duree;
  }
  /**
   * Rounds a time to the minute.
   *
   * @static
   * @method roundMinute
   * @param {Object} temps
   * @return {Object} temps à arrondi a la minute supérieur.
   */
  static roundMinute(temps) {
    return moment().add(temps, "s").add(1, "minute").startOf("minute");
  }
  /**
   * On construction.php / laboratoire.php, replaces the game's
   * `<strong>…</strong><br><small>…</small>` blocks announcing the running
   * upgrades with a small summary table (Nom / Temps restant / Terminé le /
   * Annuler).
   *
   * The game's countdown span is *moved* into the new cell rather than
   * recreated, so Fourmizzz's own `setTimeout` (its `reste()` function) keeps
   * updating it live — it looks the span up by id, which stays valid as long as
   * the span is in the DOM.
   *
   * @static
   * @method upgradesTable
   * @param {String} typeLabel Texte de l'entête de la 1re colonne (ex. "Recherche").
   * @param {String} [sectionH2] Texte du h2 affiché au-dessus du tableau
   *                             (e.g. "Construction" / "Laboratoire"). Omitted = no h2.
   */
  static upgradesTable(typeLabel, sectionH2) {
    let $strongs = $("#centre > strong");
    if (!$strongs.length) return;
    // `tableau_leger` is the game's own class, used by the spawn table on
    // Reine.php, so this matches the look of the spawn summary.
    let $table = $(
      `<table id='o_evolutionEnCours' class='tableau_leger o_maxWidth' cellspacing='0'>
        <caption class='gras left'>${typeLabel}(s) en cours:</caption>
        <thead><tr>
          <th class='left'>${typeLabel}</th>
          <th>Temps restant</th>
          <th>Terminé le</th>
          <th></th>
        </tr></thead>
        <tbody></tbody>
      </table>`,
    );
    // Hidden container for the game's spans: its setTimeout chain updates them
    // through getElementById, so they are moved here and the chain keeps
    // running without error (instead of being deleted along with the strong →
    // null.innerHTML → throw). Their content is no longer displayed.
    let $hidden = $("#o_resteHidden");
    if (!$hidden.length)
      $hidden = $("<div id='o_resteHidden' style='display:none'></div>").appendTo("body");
    let toastErrors = [],
      validRows = 0;
    $strongs.each((_, elt) => {
      let $strong = $(elt),
        $nativeSpan = $strong.children("span").first(),
        $link = $strong.children("a").last(),
        // `.clone()` then `.children().remove()` to read the
        // "- Name level (terminé|se termine) dans:" prefix without picking up
        // the inline <script> (a recursive `.text()` would return the script
        // body, e.g. `reste(22, "batiment_…");`)
        $cloneText = $strong.clone(),
        scriptText = $strong.children("script").text(),
        secMatch = scriptText.match(/reste\((\d+),/);
      $cloneText.children().remove();
      // No `reste(N, …)` countdown means this is not a real upgrade but one of
      // the game's error messages (e.g. "Prerequis non valide." when the
      // ComptePlus queue tries to start a building whose prerequisites are not
      // met). Rather than a 0s/now row in the table, the text is relayed as a
      // toast at the end.
      if (!secMatch) {
        let errText = $cloneText
          .text()
          .replace(/^\s*-\s*/, "")
          .trim();
        if (errText) toastErrors.push(errText);
        return;
      }
      let seconds = parseInt(secMatch[1]),
        endDate = Utils.roundMinute(seconds).format("D MMM YYYY à HH[h]mm");
      // Buildings say "...se termine dans :", researches "...terminé dans:".
      let name = $cloneText
        .text()
        .replace(/^\s*-\s*/, "")
        .replace(/\s+(?:terminé|se\s+termine).*$/i, "")
        .trim();
      // Move the game's span into the hidden container (keeping its id) and
      // mount our own with a compact format through Utils.intToTime.
      $nativeSpan.appendTo($hidden);
      let toolzzzId = "o_evoTime_" + ($nativeSpan.attr("id") || Date.now());
      let $row = $(
        `<tr>
          <td class='left'>${name}</td>
          <td><span id='${toolzzzId}'>${Utils.intToTime(seconds)}</span></td>
          <td class='reduce'>${endDate}</td>
          <td></td>
        </tr>`,
      );
      // Native `appendChild` rather than jQuery's `.append()`, to bypass
      // `domManip`, which collects descendant `<script>` tags and hands them to
      // `DOMEval` → blocked by the extension's MV3 CSP. The game's
      // `<a>Annuler</a>` is only moved, so its "already-started" flag survives.
      if ($link.length) $row.find("td:last")[0].appendChild($link[0]);
      $table.find("tbody")[0].appendChild($row[0]);
      validRows++;
      // Countdown in the isolated world, based on `Date.now()` so it cannot drift.
      let start = Date.now();
      let intervalId = setInterval(() => {
        let $el = $("#" + toolzzzId);
        if (!$el.length) {
          clearInterval(intervalId);
          return;
        }
        let remaining = seconds - Math.floor((Date.now() - start) / 1000);
        if (remaining <= 0) {
          $el.text("0s");
          clearInterval(intervalId);
          return;
        }
        $el.text(Utils.intToTime(remaining));
      }, 1000);
    });
    let $first = $strongs.first();
    // "Errors only" case (typically a failing ComptePlus queue while nothing is
    // being built) → no h2 and no empty table, just the toast.
    if (validRows) {
      if (sectionH2) $first.before(`<h2 class='o_marginT15 o_evolutionH2'>${sectionH2}</h2>`);
      // Native `insertBefore`: $table holds the game's moved `<a>Annuler</a>`,
      // and a jQuery append would scan its descendants for `DOMEval` → CSP.
      $first[0].parentNode.insertBefore($table[0], $first[0]);
    }
    // Cleanup: drop the <strong>, <small> and <br> between the table and the
    // game's `.Bas` separator, which marks the end of the upgrades area.
    $first.nextUntil(".Bas").addBack().filter("strong, small, br").remove();
    // Toast de-duplication: the server keeps the error message on the page for
    // about 2 minutes. On a plain reload (F5) the toast is not shown again while
    // the same message is still there. On any other navigation (clicking
    // "Construire", a menu entry…) the player has acted, so they are notified
    // again if the error persists.
    let toastKey = "o_evoErrSeen_" + location.pathname;
    if (toastErrors.length) {
      let signature = toastErrors.join("|"),
        // `type` only exists on PerformanceNavigationTiming, not on the generic PerformanceEntry.
        navType = (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming)
          ?.type,
        skip = navType === "reload" && session.getRaw(toastKey) === signature;
      session.setRaw(toastKey, signature);
      if (!skip) $.toast({ ...TOAST_WARNING, text: toastErrors.join("<br>") });
    } else {
      session.remove(toastKey);
    }
    // On the cancellation confirmation page, Fourmizzz adds:
    //  - free accounts: a `<p>` holding strong + Je confirme (all in one p).
    //  - ComptePlus: a `<p>` holding only strong, with `<a>Je confirme</a>` as a
    //    direct sibling of #centre. Our `<a>Retour</a>` (see cancelConfirmation)
    //    is added right after "Je confirme", so it is a sibling there too.
    // Everything is moved below the table. A DocumentFragment preserves DOM
    // order (jQuery's `.after()` inserts a collection in reverse).
    let $warning = $("#centre > p").has("strong");
    if ($warning.length) {
      let $confCancel = $("#centre > a[href*='confAnnuler']"),
        $retour = $confCancel.next("a"),
        $wrapper = $("<div class='o_annulationGroup'></div>");
      // On ComptePlus, "Je confirme" + "Retour" are siblings of the `<p>` (which
      // only holds the `<strong>` and a `<br>`). They are moved INTO the `<p>` so
      // they stay next to the text — otherwise the `<p>`'s own `margin-bottom`
      // leaves a gap between the warning and the links. On free accounts the
      // links already sit inside the `<p>`, so $confAnnuler.length = 0 → no-op.
      if ($confCancel.length) {
        $warning[0].appendChild(document.createTextNode(" "));
        $warning[0].appendChild($confCancel[0]);
        $warning[0].appendChild(document.createTextNode(" "));
        $warning[0].appendChild($retour[0]);
      }
      $wrapper[0].appendChild($warning[0]);
      // Native insertion: $wrapper carries the game's `<strong>`, which holds an
      // inline `<script>reste(…)>` → a jQuery append would trigger `DOMEval`,
      // blocked by the MV3 CSP.
      $table[0].parentNode.insertBefore($wrapper[0], $table[0].nextSibling);
    }
  }
  /**
   * Preserves scrollY across a round trip on the same page (e.g. clicking
   * "Construire" with unmet prerequisites → POST → 302 → back at the top).
   * Registers a `pagehide` listener to save the position and returns the
   * position to restore when it is recent (< 5s).
   *
   * The caller must call `window.scrollTo(0, y)` AFTER its DOM work
   * (upgradesTable inserts a table at the start of #centre and shifts the
   * content down) — hence the pattern: read the value early, apply it late.
   *
   * @static
   * @method preserveScroll
   * @param {String} key Clé sessionStorage unique pour la page (ex. "o_constructionScroll").
   * @returns {Number|null} ScrollY à restaurer, ou null si rien à restaurer.
   */
  static preserveScroll(key) {
    let saved = session.getRaw(key);
    session.remove(key);
    let y = null;
    if (saved) {
      let parsed = JSON.parse(saved);
      if (Date.now() - parsed.t < 5000) y = parsed.y;
    }
    window.addEventListener("pagehide", () => {
      session.setJSON(key, { y: window.scrollY, t: Date.now() });
    });
    return y;
  }
  /**
   * On the confirmation page for cancelling a research or a building
   * (`?confAnnuler=ID&t=TOKEN`), adds a "Retour" link next to the game's
   * "Je confirme" (otherwise there is no obvious way back) and cleans the URL
   * with `history.replaceState`, so Ctrl+R returns to the normal page instead
   * of showing the confirmation again.
   *
   * @static
   * @method cancelConfirmation
   * @param {String} returnUrl URL de retour (ex. "construction.php").
   */
  static cancelConfirmation(returnUrl) {
    let $confirmer = $("a:contains('Je confirme')");
    if (!$confirmer.length) return;
    $confirmer.after(
      ` <a href='${returnUrl}' class='o_retourAnnuler' style='margin-left:12px;'>Retour</a>`,
    );
    if (location.search.includes("confAnnuler")) history.replaceState({}, "", returnUrl);
  }
  /**
   * Ticks a live countdown down every second.
   *
   * @static
   * @method decreaseTime
   * @param {Integer} time
   * @param {String} id
   * @return L'affichage du contenue de l'id est decrementé d'une seconde.
   */
  static decreaseTime(time, id) {
    $("#" + id).text(this.intToTime(time));
    if (time > 0)
      setTimeout(() => {
        Utils.decreaseTime(time - 1, id);
      }, 1000);
  }
  /**
   * Ticks a live countdown up every second.
   *
   * @static
   * @method incrementTime
   * @param {Integer} time
   * @param {String} id
   * @param {String} idRound
   * @return L'affichage du contenue de l'id est incrementé d'une seconde.
   */
  static incrementTime(time, id, idRound = "") {
    let retour = moment().add(time, "s");
    $("#" + id).text(retour.format("D MMM à HH[h]mm[m]ss[s]"));
    if (idRound && retour.seconds() % 60 == 0)
      $("#" + idRound).text(Utils.roundMinute(time).format("D MMM à HH[h]mm"));
    setTimeout(() => {
      Utils.incrementTime(time, id, idRound);
    }, 1000);
  }
  /**
   * Shortens a string representing a duration.
   *
   * @static
   * @method shortcutTime
   * @param {String} time
   * @return {String} La chaine coupée.
   */
  static shortcutTime(time) {
    let tmp = this.intToTime(time).split(" ");
    if (tmp.length > 4) return tmp.splice(0, tmp.length - 3).join(" ");
    else if (tmp.length > 3) return tmp.splice(0, tmp.length - 2).join(" ");
    else if (tmp.length > 2) return tmp.splice(0, tmp.length - 1).join(" ");
    else return tmp.join(" ");
  }
  /**
   * Extracts the parameters of a URL.
   *
   * @static
   * @method extractUrlParams
   * @return {Array} La liste associatives des paramétres.
   */
  static extractUrlParams() {
    let f = new Array(),
      t = location.search.substring(1).split("&");
    if ((t as any) != "") {
      for (let elt of t) {
        let x = elt.split("=");
        f["" + x[0]] = "" + x[1];
      }
    }
    return f;
  }
  /**
   *
   */
  static extractResearch(data, player = true, alliance = true) {
    let element = new Array(),
      cptJ = alliance ? 3 : 6,
      cptA = player ? 3 : 6;
    // a search returning a single result lands straight on a player's profile
    if ($(data).find("h2").length) {
      let pseudo = $(data).find("h2").text();
      element.push({ value: pseudo, value_avec_html: pseudo, url: "Membre.php?Pseudo=" + pseudo });
    } else {
      $(data)
        .find(".simulateur:eq(0) tr")
        .each((i, elt) => {
          // players and alliances both have six cells
          if ($(elt).find("td").length == 6) {
            let cellule = $(elt).find("td:eq(1) a"),
              lien = cellule.attr("href"),
              nom = cellule.text();
            // a profile link in cell 2 means it is a player
            if (player && lien.includes("Membre.php") && cptJ) {
              element.push({ value: nom, value_avec_html: nom, url: "Membre.php?Pseudo=" + nom });
              cptJ--;
            }
            // it is an alliance
            if (alliance && lien.includes("classementAlliance.php") && cptA) {
              let tag = $(elt).find("td:eq(0)").text();
              element.push({
                value: nom,
                value_avec_html: `<span style="white-space:nowrap;"><strong>${tag}</strong> ${nom}</span>`,
                tag: tag,
                url: "classementAlliance.php?alliance=" + tag,
              });
              cptA--;
            }
          }
        });
    }
    return element;
  }
  /**
   * Parses an HTML string received from a Fourmizzz page without running its
   * inline scripts. Use it instead of `$("<div/>").append(html)`, which on Chrome
   * executes the `<script>` tags of the received HTML and lets their
   * ReferenceErrors break the rest of the callback (see `sendFlood` /
   * `_mfSendNextAttack`).
   *
   * @static
   * @method parseHtml
   * @param {String} html
   * @return {jQuery} wrapper jQuery du `<body>` parsé, prêt pour `.find()`.
   */
  static parseHtml(html) {
    return $(new DOMParser().parseFromString(html, "text/html").body);
  }
}
