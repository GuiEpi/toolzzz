/*
 * Table de routage : associe une URL du jeu à la Page Toolzzz qui l'enrichit.
 *
 * C'est le seul endroit où les URLs de Fourmizzz rencontrent des noms de
 * modules. Transcription fidèle du `switch (true)` de l'ancien content.js :
 * même ordre, mêmes conditions, première route qui matche gagne.
 */

import { $ } from "~/vendor";
import { Utils } from "~/lib/Utils";
import { getProfile } from "~/models/monProfil";
import { PageAlliance } from "~/pages/Alliance";
import { PageArmee } from "~/pages/Armee";
import { PageAttaquer } from "~/pages/Attaquer";
import { PageChat } from "~/pages/Chat";
import { PageCommerce } from "~/pages/Commerce";
import { PageCompte } from "~/pages/Compte";
import { PageConstruction } from "~/pages/Construction";
import { PageDescription } from "~/pages/Description";
import { PageForum } from "~/pages/Forum";
import { PageLaboratoire } from "~/pages/Laboratoire";
import { PageMessagerie } from "~/pages/Messagerie";
import { PageProfil } from "~/pages/Profil";
import { PageReine } from "~/pages/Reine";
import { PageRessource } from "~/pages/Ressource";

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
      const page = new PageReine(boiteComptePlus);
      if (!Utils.comptePlus) page.plus();
    },
  },
  {
    test: (uri) => uri == "/construction.php",
    run: ({ boiteComptePlus }) => new PageConstruction(boiteComptePlus).executer(),
  },
  {
    test: (uri) => uri == "/laboratoire.php",
    run: ({ boiteComptePlus }) => new PageLaboratoire(boiteComptePlus).executer(),
  },
  {
    test: (uri) => uri == "/Ressources.php",
    run: ({ boiteComptePlus }) => new PageRessource(boiteComptePlus).executer(),
  },
  {
    test: (uri) => uri == "/Armee.php",
    run: ({ boiteComptePlus }) => new PageArmee(boiteComptePlus).executer(),
  },
  {
    test: (uri) => uri == "/commerce.php",
    run: ({ boiteComptePlus }) => new PageCommerce(boiteComptePlus).executer(),
  },
  {
    test: (uri) => uri == "/compte.php",
    run: ({ boiteComptePlus }) => new PageCompte(boiteComptePlus).executer(),
  },
  {
    test: (uri) => uri == "/messagerie.php",
    run: () => new PageMessagerie().executer(),
  },
  {
    test: (uri) => (uri == "/alliance.php" && location.search == "") || uri == "/chat.php",
    run: () => new PageChat().executer(),
  },
  {
    test: () => location.href.indexOf("/alliance.php?forum_menu") > 0,
    run: () => new PageForum().executer(),
  },
  {
    test: () => location.href.indexOf("/alliance.php?Membres") > 0,
    run: () => new PageAlliance().executer(),
  },
  {
    test: (uri) => location.href.indexOf("/Membre.php?Pseudo") > 0 || uri == "/Membre.php",
    run: ({ boiteRadar }) => new PageProfil(boiteRadar).executer(),
  },
  {
    test: (uri) =>
      uri == "/classementAlliance.php" &&
      Utils.extractUrlParams()["alliance"] != "" &&
      Utils.extractUrlParams()["alliance"] != undefined,
    run: ({ boiteRadar }) => new PageDescription(boiteRadar).executer(),
  },
  {
    test: () =>
      location.href.indexOf("/ennemie.php?Attaquer") > 0 ||
      location.href.indexOf("/ennemie.php?annuler") > 0,
    run: ({ boiteComptePlus }) => new PageAttaquer(boiteComptePlus).executer(),
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
