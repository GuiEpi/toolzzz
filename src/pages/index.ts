/*
 * Table de routage : associe une URL du jeu à la Page Toolzzz qui l'enrichit.
 *
 * C'est le seul endroit où les URLs de Fourmizzz rencontrent des noms de
 * modules. Transcription fidèle du `switch (true)` de l'ancien content.js :
 * même ordre, mêmes conditions, première route qui matche gagne.
 */

import { $ } from "~/vendor";
import { Utils } from "~/lib/Utils";
import { getProfile } from "~/models/currentPlayer";
import { AllianceMembersPage } from "~/pages/AllianceMembers";
import { ArmyPage } from "~/pages/Army";
import { AttackPage } from "~/pages/Attack";
import { ChatPage } from "~/pages/Chat";
import { TradePage } from "~/pages/Trade";
import { AccountPage } from "~/pages/Account";
import { BuildingsPage } from "~/pages/Buildings";
import { AllianceProfilePage } from "~/pages/AllianceProfile";
import { ForumPage } from "~/pages/Forum";
import { LabPage } from "~/pages/Lab";
import { MessagesPage } from "~/pages/Messages";
import { PlayerProfilePage } from "~/pages/PlayerProfile";
import { QueenPage } from "~/pages/Queen";
import { ResourcesPage } from "~/pages/Resources";

/**
 * @typedef {{ boiteComptePlus: import("~/boxes/ComptePlus").BoiteComptePlus,
 *             boiteRadar: import("~/boxes/Radar").BoiteRadar }} Boites
 * @typedef {{ test: (uri: string) => boolean, run: (boites: Boites) => void }} Route
 */

/** @type {Route[]} */
export const routes = [
  {
    test: (uri) => uri == "/Reine.php",
    run: ({ boiteComptePlus }) => {
      const page = new QueenPage(boiteComptePlus);
      if (!Utils.comptePlus) page.plus();
    },
  },
  {
    test: (uri) => uri == "/construction.php",
    run: ({ boiteComptePlus }) => new BuildingsPage(boiteComptePlus).run(),
  },
  {
    test: (uri) => uri == "/laboratoire.php",
    run: ({ boiteComptePlus }) => new LabPage(boiteComptePlus).run(),
  },
  {
    test: (uri) => uri == "/Ressources.php",
    run: ({ boiteComptePlus }) => new ResourcesPage(boiteComptePlus).run(),
  },
  {
    test: (uri) => uri == "/Armee.php",
    run: ({ boiteComptePlus }) => new ArmyPage(boiteComptePlus).run(),
  },
  {
    test: (uri) => uri == "/commerce.php",
    run: ({ boiteComptePlus }) => new TradePage(boiteComptePlus).run(),
  },
  {
    test: (uri) => uri == "/compte.php",
    run: ({ boiteComptePlus }) => new AccountPage(boiteComptePlus).run(),
  },
  {
    test: (uri) => uri == "/messagerie.php",
    run: () => new MessagesPage().run(),
  },
  {
    test: (uri) => (uri == "/alliance.php" && location.search == "") || uri == "/chat.php",
    run: () => new ChatPage().run(),
  },
  {
    test: () => location.href.indexOf("/alliance.php?forum_menu") > 0,
    run: () => new ForumPage().run(),
  },
  {
    test: () => location.href.indexOf("/alliance.php?Membres") > 0,
    run: () => new AllianceMembersPage().run(),
  },
  {
    test: (uri) => location.href.indexOf("/Membre.php?Pseudo") > 0 || uri == "/Membre.php",
    run: ({ boiteRadar }) => new PlayerProfilePage(boiteRadar).run(),
  },
  {
    test: (uri) =>
      uri == "/classementAlliance.php" &&
      Utils.extractUrlParams()["alliance"] != "" &&
      Utils.extractUrlParams()["alliance"] != undefined,
    run: ({ boiteRadar }) => new AllianceProfilePage(boiteRadar).run(),
  },
  {
    test: () =>
      location.href.indexOf("/ennemie.php?Attaquer") > 0 ||
      location.href.indexOf("/ennemie.php?annuler") > 0,
    run: ({ boiteComptePlus }) => new AttackPage(boiteComptePlus).run(),
  },
  {
    test: (uri) => uri == "/ennemie.php" && location.search == "",
    run: () => {
      // Affichage des temps de trajet
      $("#tabEnnemie tr:eq(0) th:eq(5)").after("<th class='centre'>Temps</th>");
      $("#tabEnnemie tr:gt(0)").each((i, elt) => {
        let distance = parseInt($(elt).find("td:eq(5)").text());
        $(elt)
          .find("td:eq(5)")
          .after(
            `<td class='centre'>${Utils.intToTime(Math.ceil(Math.pow(0.9, getProfile().niveauRecherche[6]) * 637200 * (1 - Math.exp(-(distance / 350)))))}</td>`,
          );
      });
    },
  },
];

/**
 * Exécute la première route qui correspond à l'URL courante (aucune → rien).
 *
 * @param {Boites} boites
 */
export function router(boites) {
  const uri = location.pathname;
  const route = routes.find((r) => r.test(uri));
  if (route) route.run(boites);
}
