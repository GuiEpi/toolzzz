/*
 * Route table: maps a game URL to the Toolzzz page that enriches it.
 *
 * This is the only place where Fourmizzz URLs meet module names. A faithful
 * transcription of the old content.js `switch (true)`: same order, same
 * conditions, first matching route wins.
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
import type { ComptePlusBox } from "~/boxes/ComptePlus";
import type { RadarBox } from "~/boxes/Radar";

/**
 * The boxes a page may need. Typed for real rather than with JSDoc: in a .ts
 * file JSDoc types are ignored, and that is how a rename once changed these
 * property names on one side only without tsc noticing.
 */
export interface Boxes {
  comptePlusBox: ComptePlusBox;
  radarBox: RadarBox;
}

export interface Route {
  test: (uri: string) => boolean;
  run: (boxes: Boxes) => void;
}

export const routes: Route[] = [
  {
    test: (uri) => uri == "/Reine.php",
    run: ({ comptePlusBox }) => {
      const page = new QueenPage(comptePlusBox);
      if (!Utils.comptePlus) page.plus();
    },
  },
  {
    test: (uri) => uri == "/construction.php",
    run: ({ comptePlusBox }) => new BuildingsPage(comptePlusBox).run(),
  },
  {
    test: (uri) => uri == "/laboratoire.php",
    run: ({ comptePlusBox }) => new LabPage(comptePlusBox).run(),
  },
  {
    test: (uri) => uri == "/Ressources.php",
    run: ({ comptePlusBox }) => new ResourcesPage(comptePlusBox).run(),
  },
  {
    test: (uri) => uri == "/Armee.php",
    run: ({ comptePlusBox }) => new ArmyPage(comptePlusBox).run(),
  },
  {
    test: (uri) => uri == "/commerce.php",
    run: ({ comptePlusBox }) => new TradePage(comptePlusBox).run(),
  },
  {
    test: (uri) => uri == "/compte.php",
    run: ({ comptePlusBox }) => new AccountPage(comptePlusBox).run(),
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
    run: ({ radarBox }) => new PlayerProfilePage(radarBox).run(),
  },
  {
    test: (uri) =>
      uri == "/classementAlliance.php" &&
      Utils.extractUrlParams()["alliance"] != "" &&
      Utils.extractUrlParams()["alliance"] != undefined,
    run: ({ radarBox }) => new AllianceProfilePage(radarBox).run(),
  },
  {
    test: () =>
      location.href.indexOf("/ennemie.php?Attaquer") > 0 ||
      location.href.indexOf("/ennemie.php?annuler") > 0,
    run: ({ comptePlusBox }) => new AttackPage(comptePlusBox).run(),
  },
  {
    test: (uri) => uri == "/ennemie.php" && location.search == "",
    run: () => {
      // show the travel times
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
 * Runs the first route matching the current URL (none → nothing happens).
 */
export function router(boxes: Boxes) {
  const uri = location.pathname;
  const route = routes.find((r) => r.test(uri));
  if (route) route.run(boxes);
}
