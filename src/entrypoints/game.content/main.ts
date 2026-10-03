/*
 * main.ts — start-up of the main content script (formerly content.js).
 *
 * Everything that used to run when content.js loaded (locales, DataTables sort
 * plugins, the login-page guard, the player profile, the Promise.all, the
 * routing) lives here in `main(ctx)`, which WXT calls once the DOM is ready.
 * Nothing may touch the DOM or `browser.*` at module level: WXT imports the
 * entrypoint under Node at build time to read its options.
 */

import { $, Highcharts, moment, numeral } from "~/vendor";
import { DAYS_FR, MONTHS_FR, MONTHS_SHORT_FR } from "~/constants";
import { VERSION } from "~/lib/version";
import { Utils } from "~/lib/Utils";
import { setProfile } from "~/models/currentPlayer";
import { Player } from "~/models/Player";
import { Dock } from "~/boxes/Dock";
import { ComptePlusBox } from "~/boxes/ComptePlus";
import { RadarBox } from "~/boxes/Radar";
import { router } from "~/pages";
import * as storage from "~/storage";

/**
 * @param {import("#imports").ContentScriptContext} ctx
 */
export function main(ctx) {
  // The `o_chrome` class on <html> scopes the CSS rules that must only apply
  // under Chromium (see the ComptePlus radar — Firefox and Chrome disagree on
  // how width is distributed with `table-layout: auto`).
  if (!navigator.userAgent.includes("Firefox")) document.documentElement.classList.add("o_chrome");

  // the player is signed in
  if ($(".boite_connexion_titre:first").text() != "Connexion") {
    // The jQuery UI "humanity" theme is no longer fetched from code.jquery.com:
    // it is vendored (src/assets/jquery-ui-humanity.css) and injected by the
    // manifest alongside the extension's other stylesheets.
    // load the French locale
    numeral.locale("fr");
    moment.locale("fr");
    Highcharts.setOptions({
      lang: {
        months: MONTHS_FR,
        shortMonths: MONTHS_SHORT_FR,
        weekdays: DAYS_FR,
        decimalPoint: ",",
        thousandsSep: " ",
      },
    });
    // add number sorting
    $.fn.dataTable.ext.type.order["quantite-grade-pre"] = (d) => {
      return parseInt(d.replace(/\s/g, ""));
    };
    $.fn.dataTable.ext.type.order["moment-D MMM YYYY-pre"] = (d) => {
      return moment(d.replace(".", ""), "D MMM YYYY", "fr", true).unix();
    };
    $.fn.dataTable.ext.type.order["time-unformat-pre"] = (d) => {
      return Utils.timeToInt(d);
    };

    // set up the current player's profile
    const monProfile = new Player({ pseudo: $("#pseudo").text() });
    setProfile(monProfile);
    // load the settings
    monProfile.getSetting();
    // once buildings, researches and profile are known, show the tools
    Promise.all([
      monProfile.getBuildings(),
      monProfile.getResearches(),
      monProfile.getCurrentProfile(),
    ]).then((values) => {
      // load the player's data
      if (values[0]) monProfile.loadBuildings(values[0]);
      if (values[1]) monProfile.loadResearches(values[1]);
      if (values[2]) monProfile.loadProfile(values[2]);

      // add the tools
      let box = new Dock();
      box.render();
      // ComptePlus box
      let boxComptePlus = new ComptePlusBox();
      boxComptePlus.render();
      // Boite radar
      let boxRadar = new RadarBox();
      boxRadar.render();

      // "Carte" tab in the alliance menu — injected on every page as long as the
      // player has an alliance (the Membres link proves it). It is a real link to
      // ?Membres#carte: on that page AllianceMembersPage intercepts the click for
      // a client-side toggle, from anywhere else it is a normal navigation.
      if ($("#menuAlliance .boutonMembres").length) {
        $("#menuAlliance .boutonMembres")
          .parent()
          .after(
            `<li><a id='o_ongletCarte' class='boutonCarte' href='alliance.php?Membres#carte'><span></span>Carte</a></li>`,
          );
      }

      // "Coûts" tab in the colony menu (Fourmilière) — appended at the end of the
      // list on every page where the menu exists. The feature itself lives on
      // construction.php (#cout), where BuildingsPage intercepts the hash to hide
      // the game's own simulation and show only the curves. The
      // `boutonDescription` class is reused so it looks consistent.
      if ($("#menuFourmiliere").length && !$("#o_ongletCouts").length) {
        $("#menuFourmiliere").append(
          `<li><a id='o_ongletCouts' class='boutonDescription' href='construction.php#cout'><span></span>Coûts</a></li>`,
        );
      }

      // "Nouveautés" notice — a sticky toast on the first load after an update.
      // hideAfter: false keeps it up until the player closes it or clicks the
      // link. The version is marked as seen either way (close X or link click) so
      // it does not come back. When the key is missing (installed before this
      // feature existed) it is shown anyway: a new user also benefits from seeing
      // the changelog once.
      const LAST_SEEN_VERSION_KEY = "outiiil_lastSeenVersion";
      if (storage.getRaw(LAST_SEEN_VERSION_KEY) !== VERSION) {
        // Points at the releases page (the latest is on top) so the player can
        // also browse the previous versions they may have missed.
        const releaseUrl = `https://github.com/GuiEpi/toolzzz/releases`;
        const markSeen = () => storage.setRaw(LAST_SEEN_VERSION_KEY, VERSION);
        $.toast({
          heading: "Toolzzz mis à jour",
          text: `Nouvelle version <b>v${VERSION}</b>. <a href='${releaseUrl}' target='_blank' rel='noopener' id='o_changelogLink'>Voir les nouveautés</a>`,
          hideAfter: false,
          allowToastClose: true,
          showHideTransition: "slide",
          position: { top: 30, right: 100 },
          icon: "info",
          afterHidden: markSeen,
        });
        $(document).on("click", "#o_changelogLink", markSeen);
      }

      // Enriches the Nourriture / Matériaux tooltips of the info banner with the
      // estimated maximum capacity and the free space — which answers "how much
      // room is left for a convoy". The server only exposes the fill percentage
      // (rounded to an integer) and the current value, so the maximum is derived
      // from current / (percent/100), accurate to ±0.5%.
      //
      // How: the td's `title` is emptied (the page's own tooltip reads that title
      // through a default content function, which then returns an empty string, so
      // nothing is rendered by the page) and our own popover is attached on
      // mouseenter to show the rich HTML. Everything stays in the isolated world,
      // with no injection
      // de script main-world.
      // The page's jQuery UI tooltip and warning-tooltip classes are reused so the
      // styling (colour, border, shadow) comes for free.
      const $tip = $(
        `<div id='o_boiteInfoTooltip' class='ui-tooltip ui-corner-all ui-widget-shadow ui-widget ui-widget-content warning-tooltip' role='tooltip' style='position:absolute;display:none;z-index:99999;pointer-events:none;'><div class='ui-tooltip-content'></div></div>`,
      ).appendTo("body");
      // Warehouse capacity = 500 + 1200 × 2^level (the same formula for
      // Nourriture and Matériaux, checked on s1/s2/s3/test against the reference
      // table at toolzzz.fr/couts.php). The formula is preferred over the
      // current/percent ratio, which is unusable at a displayed 0% and imprecise
      // bas niveau de remplissage.
      const maxWarehouse = (level) => 500 + 1200 * Math.pow(2, level);
      const levelWarehouse = (type) => {
        if (type === "Nourriture") return monProfile.niveauConstruction[1];
        if (type === "Matériaux") return monProfile.niveauConstruction[2];
        return undefined;
      };
      $(".tooltip_boite_info").each(function () {
        const $td = $(this);
        const original = $td.attr("title") || $td.attr("data-tooltip-original-title");
        if (!original || !/rempli à \d+\s*%/.test(original)) return;
        const $val = $td.find(".texte_ligne_boite_info");
        if (!$val.length) return;
        const value = numeral($val.text().trim()).value() ?? 0;
        const match = original.match(/rempli à (\d+)\s*%/);
        if (!match) return;
        const percentShow = parseInt(match[1], 10);
        const type = /nourriture/i.test(original)
          ? "Nourriture"
          : /matériaux|materiaux/i.test(original)
            ? "Matériaux"
            : "Stock";
        const level = levelWarehouse(type);
        let html;
        if (level !== undefined) {
          const max = maxWarehouse(level);
          const restant = Math.max(0, max - value);
          const percentReel = max > 0 ? Math.round((value / max) * 1000) / 10 : 0;
          html = `<b>${type}</b><br/>Actuel : ${numeral(value).format()}<br/>Maximum : ${numeral(max).format()} (${percentReel}%)<br/><b style="color:#27ae60">Place libre : ${numeral(restant).format()}</b>`;
        } else if (percentShow > 0 && value > 0) {
          // Fallback: unrecognised type (neither Nourriture nor Matériaux) or
          // building levels not loaded. Back to the old ratio.
          const max = Math.round(value / (percentShow / 100));
          const restant = Math.max(0, max - value);
          html = `<b>${type}</b><br/>Actuel : ${numeral(value).format()}<br/>Maximum : ${numeral(max).format()} (${percentShow}%)<br/><b style="color:#27ae60">Place libre : ${numeral(restant).format()}</b>`;
        } else {
          html = `<b>${type}</b><br/>Actuel : ${numeral(value).format()}`;
        }
        // Empty the title to neutralise the page's jQuery UI tooltip (its default
        // content function then returns attr("title") = "" → nothing rendered).
        $td.attr("title", "");
        $td.attr("data-tooltip-original-title", "");
        $td
          .on("mouseenter.toolzzzInfo", () => {
            $tip.find(".ui-tooltip-content").html(html);
            $tip.show();
            const offset = $td.offset();
            $tip.css({
              top: offset.top + $td.outerHeight() / 2 - $tip.outerHeight() / 2,
              left: offset.left + $td.outerWidth() + 10,
            });
          })
          .on("mouseleave.toolzzzInfo", () => {
            $tip.hide();
          });
      });

      router({ boxComptePlus, boxRadar });
    });
  }
}
