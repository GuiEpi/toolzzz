/*
 * AttaqueLancee.ts
 **********************************************************************/

import { $, Clipboard, moment, numeral } from "~/vendor";
import { TOAST_ERROR, TOAST_SUCCESS, TOAST_WARNING } from "~/constants";
import { Utils } from "~/lib/Utils";
// Cycle d'import volontaire (usage dans les méthodes uniquement, jamais au niveau module) : AttaqueLancee ↔ Armee.
import { Army } from "~/models/Army";
import * as storage from "~/storage";
import * as session from "~/storage/session";

/**
 * Capture des attaques au moment de leur lancement (page Attaquer) pour
 * afficher un récapitulatif par cible (lieu, troupes, arrivée, terrain estimé
 * de la cible à l'arrivée) avec export texte pour le forum.
 *
 * Le serveur n'envoie ni le lieu visé ni la composition des troupes aux
 * comptes gratuits : on les mémorise donc en localStorage à l'envoi, puis on
 * les lie à la ligne que le jeu affiche. La liaison ne s'appuie pas sur un
 * temps de trajet estimé (la formule peut diverger du jeu) mais sur l'id
 * d'attaque : une attaque fraîchement lancée porte toujours l'id le plus
 * élevé de la liste pour sa cible. En flood la réponse du POST contient déjà
 * la liste, on lie immédiatement ; en envoi de formulaire on lie au premier
 * rendu de la page suivante. Une attaque lancée hors de ce navigateur reste
 * sans capture — seule l'heure d'arrivée, calculée depuis le compte à
 * rebours du jeu, est affichée pour toutes (non-C+, le C+ l'a nativement).
 *
 * @class AttaqueLancee
 */
const KEY_SENT_ATTACKS = "outiiil_attaquesLancees";
// délai (s) au-delà duquel une capture jamais retrouvée dans la liste du jeu
// est abandonnée (envoi refusé par le serveur, page jamais rechargée…)
const CAPTURE_TTL = 600;
// fenêtre (s) pendant laquelle le jeu accepte d'annuler une attaque après son lancement
const CANCEL_WINDOW = 120;
// nombre d'attaques qu'un « Tout annuler » n'a pas pu annuler, affiché après rechargement
const KEY_CANCEL_FAILURES = "outiiil_annulationEchec";

export class SentAttack {
  // Champs déclarés pour TypeScript (Phase 2 : conversion telle quelle, le
  // typage fin est reporté — cf. .claude/plans/wxt-migration-followups.md).
  // Posé par PageAttaquer au lancement d'un flood, lu par Armee.
  static contexteFlood: any;
  /**
   * Charge la liste des captures en purgeant les attaques déjà arrivées et
   * les captures jamais liées à une ligne du jeu.
   */
  static load() {
    let list;
    try {
      list = storage.getJSON(KEY_SENT_ATTACKS) || [];
    } catch (e) {
      list = [];
    }
    return list.filter((a) =>
      a.id
        ? moment(a.arrivee).isAfter(moment())
        : a.lancee && moment().diff(a.lancee, "s") < CAPTURE_TTL,
    );
  }
  /**
   *
   */
  static save(list) {
    storage.setJSON(KEY_SENT_ATTACKS, list);
  }
  /**
   * Mémorise une attaque au moment de l'envoi.
   *
   * @param {String} target pseudo du joueur attaqué
   * @param {String} lieu libellé du lieu visé (tel qu'affiché dans le formulaire)
   * @param {Object} unite composition {nom d'unité: nombre}
   * @param {Object} options
   *   - html : réponse du serveur si l'envoi est fait en AJAX (flood), permet
   *            de lier tout de suite l'id et l'arrivée exacte
   *   - terrain : terrain de la cible connu au lancement, pour estimer celui
   *               qu'elle aura à l'arrivée
   */
  static record(target, place, unite, options: any = {}) {
    // clic à vide (aucune unité) : le jeu refusera l'envoi, rien à mémoriser
    if (!Object.values(unite).some((count) => count)) return;
    let list = SentAttack.load(),
      capture = {
        id: null,
        cible: target,
        lieu: place,
        unite: unite,
        lancee: moment().valueOf(),
        arrivee: null,
        // terrain de la cible avant cette attaque puis estimé après : on
        // repart de l'estimation de la dernière attaque encore en vol sur
        // cette cible s'il y en a une — le terrain du profil ne les reflète
        // pas encore — sinon du terrain connu au lancement
        terrainDepart: null,
        terrainCible: null,
      },
      precedente = list
        .filter((a) => a.cible == target && a.terrainCible != null)
        .sort((a, b) => a.lancee - b.lancee)
        .pop();
    capture.terrainDepart = precedente
      ? precedente.terrainCible
      : options.terrain > 0
        ? options.terrain
        : null;
    SentAttack.estimateTerrain(capture, capture.terrainDepart);
    if (options.html) {
      let row = SentAttack.extractRows(Utils.parseHtml(options.html))
        .filter((l) => l.cible == target)
        .pop();
      if (row) {
        capture.id = row.id;
        capture.arrivee = row.arrivee.valueOf();
      }
    }
    list.push(capture);
    SentAttack.save(list);
  }
  /**
   * Extrait les lignes « Vous allez attaquer » / « Des renforts arrivent »
   * d'un document, triées par id d'attaque croissant (= ordre de lancement).
   *
   * @param {jQuery} racine document (ou fragment) à parcourir
   * @return {Array} liste {elt, id, cible (null pour un renfort), cibleHtml, secondes, arrivee}
   */
  static extractRows(racine = $(document)) {
    let rows: any[] = [];
    racine.find("span[id^='attaque_']").each((i, elt) => {
      // le compteur du jeu est alimenté par un script voisin : reste(secondes, "attaque_<id>")
      let secondes = parseInt($(elt).nextAll("script").first().text().split("(")[1]);
      if (isNaN(secondes)) return;
      // C+ : le jeu écrit le lieu entre parenthèses après le pseudo et les
      // troupes dans un bloc après le lien Annuler — on les lit pour les
      // attaques qu'on n'a pas capturées (lancées ailleurs)
      let native = SentAttack.rowNodes(elt),
        texte = native.map((n) => n.textContent).join(" "),
        place = texte.match(/\((terrain de chasse|fourmilière|loge impériale)\)/i),
        troops = texte.match(/Troupes en attaques?\s*:\s*(.+?)\s*(?:Arrivée|$)/i);
      rows.push({
        elt: elt,
        id: parseInt($(elt).attr("id").split("_")[1]),
        // attaque normale (la cible est un lien) — un renfort n'a pas de cible
        cible: $(elt).prev().find("a").length ? $(elt).prev().find("a:first").text() : null,
        // HTML natif du bloc cible (lien vers le profil, et vers l'alliance
        // entre parenthèses quand le jeu l'affiche), réutilisé tel quel dans
        // le titre du tableau pour garder les pseudos cliquables (issue #25)
        cibleHtml: $(elt).prev().find("a").length ? $(elt).prev().html() : null,
        secondes: secondes,
        arrivee: moment().add(secondes, "s"),
        lieuNatif: place ? place[1] : null,
        troupesNatif: troops ? troops[1] : null,
      });
    });
    return rows.sort((a, b) => a.id - b.id);
  }
  /**
   * Lie les captures encore orphelines aux lignes affichées : pour une cible
   * donnée, les N captures les plus récentes correspondent aux N lignes aux
   * ids les plus élevés qui ne sont pas déjà liées.
   *
   * @param {Array} list captures chargées
   * @param {Array} rows lignes extraites de la page
   * @return {Boolean} true si au moins une liaison a été faite
   */
  static link(list, rows) {
    let modifie = false,
      idsLies = list.filter((a) => a.id).map((a) => a.id);
    new Set(list.filter((a) => !a.id).map((a) => a.cible)).forEach((target) => {
      let captures = list
          .filter((a) => !a.id && a.cible == target)
          .sort((a, b) => a.lancee - b.lancee),
        candidates = rows.filter((l) => l.cible == target && idsLies.indexOf(l.id) == -1),
        count = Math.min(captures.length, candidates.length);
      captures.slice(-count).forEach((capture, i) => {
        let row = candidates[candidates.length - count + i];
        capture.id = row.id;
        capture.arrivee = row.arrivee.valueOf();
        modifie = true;
      });
    });
    return modifie;
  }
  /**
   * Terrain estimé de la cible après une attaque : même règle que la
   * simulation de flood, une unité prend 1 de terrain, plafonné à 20 % du
   * terrain de la cible avant l'attaque.
   *
   * @param {Object} capture
   * @param {Integer|null} base terrain de la cible avant l'attaque
   * @return {Integer|null} terrain après, aussi écrit dans la capture
   */
  static estimateTerrain(capture: any, base) {
    capture.terrainDepart = base > 0 ? base : null;
    if (capture.terrainDepart === null) return (capture.terrainCible = null);
    let count: any = Object.values(capture.unite).reduce(
      (total: number, n: any) => total + (n || 0),
      0,
    );
    return (capture.terrainCible = base - Math.min(count, Math.floor(base * 0.2)));
  }
  /**
   * Recalcule la chaîne des terrains estimés d'une cible à partir de la plus
   * ancienne capture encore en vol : nécessaire quand une attaque du milieu
   * de la chaîne disparaît (annulation).
   *
   * @param {Array} list captures
   * @return {Boolean} true si une estimation a changé
   */
  static recomputeTerrains(list) {
    let modifie = false;
    new Set(list.map((a) => a.cible)).forEach((target) => {
      let base = null;
      list
        .filter((a) => a.cible == target)
        .sort((a, b) => a.lancee - b.lancee)
        .forEach((a) => {
          if (base === null) base = a.terrainDepart;
          let avant = a.terrainCible;
          base = SentAttack.estimateTerrain(a, base);
          if (a.terrainCible !== avant) modifie = true;
        });
    });
    return modifie;
  }
  /**
   * Met les captures en phase avec les lignes affichées : liaison des
   * orphelines, purge de celles dont l'attaque a été annulée, recalcul des
   * terrains estimés.
   *
   * @param {Array} rows lignes extraites de la page
   * @return {Array} captures à jour
   */
  static sync(rows) {
    let list = SentAttack.load(),
      modifie = SentAttack.link(list, rows);
    // les pages qui listent les attaques en cours les listent toutes : une
    // capture liée dont la ligne a disparu correspond à une attaque annulée.
    // Elle rend le terrain qu'elle aurait pris aux attaques lancées après elle.
    list
      .filter((a) => a.id && !rows.some((l) => l.id == a.id))
      .forEach((annulee) => {
        let prise = annulee.terrainDepart - annulee.terrainCible;
        if (prise > 0)
          list
            .filter(
              (a) =>
                a.cible == annulee.cible && a.lancee > annulee.lancee && a.terrainDepart != null,
            )
            .forEach((a) => (a.terrainDepart += prise));
        modifie = true;
      });
    list = list.filter((a) => !a.id || rows.some((l) => l.id == a.id));
    if (SentAttack.recomputeTerrains(list)) modifie = true;
    if (modifie) SentAttack.save(list);
    return list;
  }
  /**
   * Heure d'arrivée arrondie à la minute, avec la date si ce n'est pas
   * aujourd'hui (rendu calqué sur le natif C+).
   */
  static formatArrival(secondes) {
    let rArrival = Utils.roundMinute(secondes);
    return `${rArrival.isSame(moment(), "day") ? "à" : "le " + rArrival.format("D MMM à")} ${rArrival.format("HH[h]mm")}`;
  }
  /**
   * Non-C+ : ajoute l'heure d'arrivée sous chaque ligne « Des renforts
   * arrivent » (les attaques, elles, passent dans les tableaux par cible).
   *
   * @return {Array} liste {cible, exp} des attaques normales, pour la boite C+
   */
  static enrichRows() {
    let listAttack = [];
    SentAttack.extractRows().forEach((row) => {
      if (row.cible) {
        listAttack.push({ cible: row.cible, exp: row.arrivee });
        return;
      }
      $(row.elt)
        .nextAll("script")
        .first()
        .after(`<br/><small><em>Arrivée ${SentAttack.formatArrival(row.secondes)}</em></small>`);
    });
    return listAttack;
  }
  /**
   * Un tableau récapitulatif par cible : lieu, troupes, temps restant,
   * arrivée, terrain estimé, annulation unitaire ou groupée, et copie au
   * format texte du jeu pour le forum.
   *
   * Les tableaux remplacent les lignes natives « Vous allez attaquer »
   * (toutes les attaques, capturées ou non). Le span du compte à rebours et
   * le lien Annuler du jeu sont déplacés dans le tableau, pas recréés : le
   * compteur natif (fonction reste() du jeu) retrouve le span par son id et
   * continue de le mettre à jour. Pour une attaque non capturée, lieu et
   * troupes viennent du texte du jeu quand il les donne (C+), sinon « ? ».
   */
  static renderTables() {
    let echecs = session.getRaw(KEY_CANCEL_FAILURES);
    if (echecs) {
      session.remove(KEY_CANCEL_FAILURES);
      $.toast({
        ...TOAST_WARNING,
        text: `${echecs} attaque${Number(echecs) > 1 ? "s" : ""} n'${Number(echecs) > 1 ? "ont" : "a"} pas pu être annulée${Number(echecs) > 1 ? "s" : ""} : le délai d'annulation du jeu est dépassé.`,
      });
    }
    let rows = SentAttack.extractRows(),
      list = SentAttack.sync(rows),
      attacks = rows
        .filter((l) => l.cible)
        .map((l) => ({
          ligne: l,
          capture: list.find((a) => a.id == l.id) || null,
          annuler: $(l.elt).nextAll(`a[href$='annuler=${l.id}']`).first(),
        }));
    if (!attacks.length) return;
    let conteneur = $(rows[rows.length - 1].elt).parent();
    Array.from(new Set(attacks.map((a) => a.ligne.cible))).forEach((target, index) => {
      let groupe: any[] = attacks
          .filter((a) => a.ligne.cible == target)
          .sort((a, b) => a.ligne.arrivee - b.ligne.arrivee),
        id = `o_attaquesLancees${index}`,
        annulables = groupe.filter((a) => a.annuler.length),
        html = `<br/><div id="${id}" class="boite_amelioration simulateur centre">
          <h2>Attaques sur ${groupe[0].ligne.cibleHtml || target}</h2>
          <table class="o_attaquesLancees o_maxWidth centre" cellspacing="0">
          <thead><tr><th>#</th><th>Lieu</th><th>Troupes</th><th>Reste</th><th>Arrivée</th><th>Terrain de ${target}*</th><th></th></tr></thead>
          <tbody>`;
      groupe.forEach((a, i) => {
        let c = a.capture;
        html += `<tr${i % 2 ? " class='ligne_paire'" : ""}><td>${i + 1}</td>
          <td>${SentAttack.place(a) || "?"}</td>
          <td>${SentAttack.troops(a) || "?"}</td>
          <td id="${id}Reste${i}"></td>
          <td>${SentAttack.formatArrival(a.ligne.secondes)}</td>
          <td>${c && c.terrainCible != null ? numeral(c.terrainCible).format() : "?"}</td>
          <td id="${id}Annuler${i}"></td></tr>`;
      });
      // type="button" obligatoire : sur la page Attaquer ce bloc est dans le
      // formulaire de lancement du jeu, un <button> nu le soumettrait
      html += `<tr class="reduce"><td colspan="7"><em>* : terrain estimé après l'attaque, si elle réussit et que rien d'autre ne le fait varier entre-temps.${groupe.some((a) => !SentAttack.troops(a)) ? " « ? » : attaque lancée depuis un autre navigateur, détails inconnus." : ""}</em></td></tr>
          </tbody></table>
          <button type="button" id="${id}Copier" class="o_marginT15 o_button">Copier pour le forum</button>
          ${annulables.length > 1 ? `<button type="button" id="${id}ToutAnnuler" class="o_marginT15 o_button f_error">Tout annuler</button>` : ""}
          </div>`;
      conteneur.append(html);
      // compteur et lien Annuler : déplacés dans le tableau (natif conservé).
      // Pour une attaque capturée on connaît l'heure de lancement : le lien
      // est retiré dès que la fenêtre d'annulation du jeu est passée, même
      // si la page reste ouverte.
      let updateAllCancel = () => {
        if (groupe.filter((a) => $(a.cellule).find("a").length).length < 2)
          $(`#${id}ToutAnnuler`).hide();
      };
      groupe.forEach((a, i) => {
        let native = SentAttack.rowNodes(a.ligne.elt),
          restant = a.capture ? a.capture.lancee + CANCEL_WINDOW * 1000 - Date.now() : null;
        a.cellule = `#${id}Annuler${i}`;
        $(a.ligne.elt).appendTo(`#${id}Reste${i}`);
        if (a.annuler.length) {
          if (restant !== null && restant <= 0) a.annuler.remove();
          else {
            a.annuler.appendTo(a.cellule);
            if (restant !== null)
              setTimeout(() => {
                $(a.cellule).empty();
                updateAllCancel();
              }, restant);
          }
        }
        native.forEach((n) => n.parentNode && n.parentNode.removeChild(n));
      });
      updateAllCancel();
      // copie pour le forum
      let clipboard = new Clipboard(`#${id}Copier`, {
        text: () => SentAttack.formatForum(target, groupe),
      });
      clipboard.on("success", () => {
        $.toast({ ...TOAST_SUCCESS, text: "Les attaques ont été copiées dans le presse papier." });
      });
      clipboard.on("error", () => {
        $.toast({ ...TOAST_ERROR, text: "Une erreur a été rencontrée, la copie a échoué." });
      });
      // annulation groupée : les liens Annuler du jeu, appelés l'un après
      // l'autre. Le jeu n'autorise l'annulation que peu de temps après le
      // lancement : la dernière réponse (page complète) dit quelles attaques
      // sont encore là, le compte est signalé après rechargement.
      $(`#${id}ToutAnnuler`).click(() => {
        let encore = groupe.filter((a) => $(a.cellule).find("a").length);
        if (!encore.length || !confirm(`Annuler les ${encore.length} attaques sur ${target} ?`))
          return;
        encore
          .reduce(
            (suite, a) => suite.then(() => $.get($(a.cellule).find("a").attr("href"))),
            Promise.resolve(),
          )
          .then((html) => {
            let restantes = SentAttack.extractRows(Utils.parseHtml(html)).map((l) => l.id),
              echecs = encore.filter((a) => restantes.indexOf(a.ligne.id) != -1).length;
            if (echecs) session.setRaw(KEY_CANCEL_FAILURES, String(echecs));
          })
          // navigation GET et non reload() : sur la page Attaquer, la page
          // courante est la réponse du POST de lancement, un reload le rejouerait
          .finally(() => location.replace(location.pathname + location.search));
      });
    });
  }
  /**
   * Nœuds natifs d'une ligne « Vous allez attaquer » (lus pour le C+, puis
   * retirés une fois le contenu déplacé dans un tableau) : les frères du span
   * de compte à rebours, jusqu'au saut de ligne précédent (ou au titre) et
   * jusqu'au saut de ligne suivant inclus — plus, en C+, le bloc de détail
   * (troupes, arrivée) qui suit ce saut de ligne jusqu'au suivant. Le span
   * lui-même et le lien Annuler sont exclus (déplacés, pas supprimés).
   *
   * @param {Element} elt span du compte à rebours
   * @return {Array} nœuds à supprimer
   */
  static rowNodes(elt) {
    let nodes = [],
      isArret = (n) => n.nodeType == 1 && ["BR", "H3"].indexOf(n.tagName) != -1,
      n = elt.previousSibling;
    while (n && !isArret(n)) {
      nodes.push(n);
      n = n.previousSibling;
    }
    n = elt.nextSibling;
    let detailVu = false;
    while (n) {
      if (!(n.nodeType == 1 && n.tagName == "A" && /annuler=/.test(n.getAttribute("href") || "")))
        nodes.push(n);
      if (isArret(n)) {
        let suivant = n.nextSibling;
        if (detailVu || !(suivant && suivant.nodeType == 1 && suivant.tagName == "SMALL")) break;
        detailVu = true;
      }
      n = n.nextSibling;
    }
    return nodes;
  }
  /**
   * Lieu visé d'une attaque : capture, sinon texte du jeu (C+), sinon null.
   */
  static place(a) {
    return a.capture ? a.capture.place : a.ligne.lieuNatif;
  }
  /**
   * Troupes d'une attaque : capture, sinon texte du jeu (C+), sinon null.
   */
  static troops(a) {
    return a.capture ? new Army({ unite: a.capture.unite }).toString() : a.ligne.troupesNatif;
  }
  /**
   * Texte à coller sur le forum : une entrée par attaque au format des lignes
   * du jeu, puis le terrain estimé de la cible après la dernière.
   */
  static formatForum(target, groupe) {
    let texte = groupe
        .map((a) => {
          let secondes = Math.max(0, a.ligne.arrivee.diff(moment(), "s")),
            place = SentAttack.place(a),
            troops = SentAttack.troops(a),
            rows = [
              `- Vous allez attaquer ${target}${place ? ` (${place})` : ""} dans ${Utils.intToTime(secondes)}`,
            ];
          if (troops) rows.push(`Troupes en attaques : ${troops}`);
          rows.push(`Arrivée ${SentAttack.formatArrival(secondes)}`);
          return rows.join("\n");
        })
        .join("\n\n"),
      last = groupe
        .filter((a) => a.capture && a.capture.terrainCible != null)
        .sort((a, b) => a.capture.lancee - b.capture.lancee)
        .pop();
    if (last)
      texte += `\n\nTerrain estimé de ${target} à l'arrivée : ${numeral(last.capture.terrainCible).format()}`;
    return texte;
  }
}
