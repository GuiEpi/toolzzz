/*
 * main.js — démarrage du content script principal (ex-content.js).
 *
 * Tout ce qui s'exécutait au chargement de content.js (locale, tris
 * DataTables, garde « page de connexion », profil du joueur, Promise.all,
 * routage) vit ici, dans `main(ctx)`, appelé par WXT une fois le DOM prêt.
 * Rien ne doit toucher au DOM ni à `browser.*` au niveau module : WXT
 * importe l'entrypoint sous Node au build pour lire ses options.
 */

import { $, Highcharts, moment, numeral } from "~/vendor";
import { JOUR_FR, MOIS_FR, MOIS_RAC_FR } from "~/constants";
import { VERSION } from "~/lib/version";
import { Utils } from "~/lib/Utils";
import { setProfile } from "~/models/monProfil";
import { Joueur } from "~/models/Joueur";
import { Dock } from "~/boxes/Dock";
import { BoiteComptePlus } from "~/boxes/ComptePlus";
import { BoiteRadar } from "~/boxes/Radar";
import { router } from "~/pages";
import * as storage from "~/storage";

/**
 * @param {import("#imports").ContentScriptContext} ctx
 */
export function main(ctx) {
  // Classe `o_chrome` posée sur <html> pour scoper les règles CSS qui doivent
  // uniquement s'appliquer sous Chromium (cf. radar du Compte+ — Firefox et
  // Chrome divergent sur la distribution de largeur en `table-layout: auto`).
  if (!navigator.userAgent.includes("Firefox")) document.documentElement.classList.add("o_chrome");

  // si l'utilisateur est identifié
  if ($(".boite_connexion_titre:first").text() != "Connexion") {
    // Le thème jQuery UI « humanity » n'est plus chargé depuis code.jquery.com :
    // il est embarqué (src/assets/jquery-ui-humanity.css) et injecté par le
    // manifest avec les autres feuilles de l'extension.
    // Chargement du language francais
    numeral.locale("fr");
    moment.locale("fr");
    Highcharts.setOptions({
      lang: {
        months: MOIS_FR,
        shortMonths: MOIS_RAC_FR,
        weekdays: JOUR_FR,
        decimalPoint: ",",
        thousandsSep: " ",
      },
    });
    // Ajout du tri pour les nombres
    $.fn.dataTable.ext.type.order["quantite-grade-pre"] = (d) => {
      return parseInt(d.replace(/\s/g, ""));
    };
    $.fn.dataTable.ext.type.order["moment-D MMM YYYY-pre"] = (d) => {
      return moment(d.replace(".", ""), "D MMM YYYY", "fr", true).unix();
    };
    $.fn.dataTable.ext.type.order["time-unformat-pre"] = (d) => {
      return Utils.timeToInt(d);
    };

    // Initialisation du profil du joueur en cours
    const monProfil = new Joueur({ pseudo: $("#pseudo").text() });
    setProfile(monProfil);
    // chargement des parametre
    monProfil.getParametre();
    // des qu'on les inos constructions/recherches et profil on affiches les outils
    Promise.all([
      monProfil.getConstruction(),
      monProfil.getLaboratoire(),
      monProfil.getProfilCourant(),
    ]).then((values) => {
      // chargement des données du joueur
      if (values[0]) monProfil.chargerConstruction(values[0]);
      if (values[1]) monProfil.chargerRecherche(values[1]);
      if (values[2]) monProfil.chargerProfil(values[2]);

      // Ajout des outils
      let boite = new Dock();
      boite.afficher();
      // boite compte plus
      let boiteComptePlus = new BoiteComptePlus();
      boiteComptePlus.afficher();
      // Boite radar
      let boiteRadar = new BoiteRadar();
      boiteRadar.afficher();

      // Onglet "Carte" dans le menu d'alliance — injecté sur toutes les pages
      // tant que le joueur a une alliance (présence du lien Membres = preuve).
      // Lien réel vers ?Membres#carte : sur cette page, PageAlliance intercepte
      // le clic pour un toggle client-side ; depuis ailleurs, navigation normale.
      if ($("#menuAlliance .boutonMembres").length) {
        $("#menuAlliance .boutonMembres")
          .parent()
          .after(
            `<li><a id='o_ongletCarte' class='boutonCarte' href='alliance.php?Membres#carte'><span></span>Carte</a></li>`,
          );
      }

      // Onglet "Coûts" dans le menu colonie (Fourmilière) — injecté en bout de
      // liste, sur toutes les pages où le menu existe. La feature vit sur
      // construction.php (#cout) ; PageConstruction intercepte le hash pour
      // masquer la simulation native et n'afficher que les courbes. Classe
      // `boutonDescription` réutilisée pour le look graphique cohérent.
      if ($("#menuFourmiliere").length && !$("#o_ongletCouts").length) {
        $("#menuFourmiliere").append(
          `<li><a id='o_ongletCouts' class='boutonDescription' href='construction.php#cout'><span></span>Coûts</a></li>`,
        );
      }

      // Notification "Nouveautés" — toast sticky au 1er chargement après une mise à jour.
      // hideAfter: false → reste visible tant que l'user ne ferme pas / ne clique pas le lien.
      // La version est marquée vue dans les deux cas (close X ou clic lien) pour ne pas
      // ré-apparaître. Si la clé est absente (install avant cette feature), on montre quand
      // même : un nouvel utilisateur a aussi intérêt à voir le changelog une fois.
      const LAST_SEEN_VERSION_KEY = "outiiil_lastSeenVersion";
      if (storage.getRaw(LAST_SEEN_VERSION_KEY) !== VERSION) {
        // Pointe sur la page des releases (la dernière est en haut), histoire que
        // l'utilisateur puisse aussi parcourir les versions précédentes qu'il aurait
        // potentiellement ratées.
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

      // Enrichit les tooltips Nourriture / Matériaux du bandeau d'info avec la capacité
      // max estimée et la place libre — répond directement à "il me reste combien pour
      // un convoi". Le serveur expose juste le % rempli (arrondi entier) et la valeur
      // courante ; on remonte le max via current / (percent/100), précis à ±0.5%.
      //
      // Approche : on vide le `title` du td (le tooltip natif de la page lit ce title
      // via une content function par défaut, qui retournera donc une chaîne vide → pas
      // de tooltip rendu côté page) et on attache notre propre popover sur mouseenter
      // pour afficher le HTML riche. Tout reste dans l'isolated world, pas d'injection
      // de script main-world.
      // On réutilise les classes du widget jQuery UI tooltip + warning-tooltip de la
      // page pour hériter automatiquement de leur style (couleur, bordure, ombre).
      const $tip = $(
        `<div id='o_boiteInfoTooltip' class='ui-tooltip ui-corner-all ui-widget-shadow ui-widget ui-widget-content warning-tooltip' role='tooltip' style='position:absolute;display:none;z-index:99999;pointer-events:none;'><div class='ui-tooltip-content'></div></div>`,
      ).appendTo("body");
      // Capacité d'entrepôt = 500 + 1200 × 2^niveau (formule identique pour
      // Nourriture et Matériaux, vérifiée sur s1/s2/s3/test via la table de
      // référence toolzzz.fr/couts.php). On préfère la formule au ratio
      // current/percent, qui est inutilisable à 0% affiché et imprécis à
      // bas niveau de remplissage.
      const maxEntrepot = (niveau) => 500 + 1200 * Math.pow(2, niveau);
      const niveauEntrepot = (type) => {
        if (type === "Nourriture") return monProfil.niveauConstruction[1];
        if (type === "Matériaux") return monProfil.niveauConstruction[2];
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
        const percentAffiche = parseInt(match[1], 10);
        const type = /nourriture/i.test(original)
          ? "Nourriture"
          : /matériaux|materiaux/i.test(original)
            ? "Matériaux"
            : "Stock";
        const niveau = niveauEntrepot(type);
        let html;
        if (niveau !== undefined) {
          const max = maxEntrepot(niveau);
          const restant = Math.max(0, max - value);
          const percentReel = max > 0 ? Math.round((value / max) * 1000) / 10 : 0;
          html = `<b>${type}</b><br/>Actuel : ${numeral(value).format()}<br/>Maximum : ${numeral(max).format()} (${percentReel}%)<br/><b style="color:#27ae60">Place libre : ${numeral(restant).format()}</b>`;
        } else if (percentAffiche > 0 && value > 0) {
          // Fallback : type non reconnu (ni Nourriture ni Matériaux) ou
          // niveauConstruction non chargé. On retombe sur l'ancien ratio.
          const max = Math.round(value / (percentAffiche / 100));
          const restant = Math.max(0, max - value);
          html = `<b>${type}</b><br/>Actuel : ${numeral(value).format()}<br/>Maximum : ${numeral(max).format()} (${percentAffiche}%)<br/><b style="color:#27ae60">Place libre : ${numeral(restant).format()}</b>`;
        } else {
          html = `<b>${type}</b><br/>Actuel : ${numeral(value).format()}`;
        }
        // Vide le title pour neutraliser le tooltip jQuery UI de la page (sa content
        // fn par défaut retourne attr("title") = "" → pas de rendu).
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

      router({ boiteComptePlus, boiteRadar });
    });
  }
}
