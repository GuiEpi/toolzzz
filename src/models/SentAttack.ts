/*
 * SentAttack.ts
 **********************************************************************/

import { $, Clipboard, moment, numeral } from "~/vendor";
import { TOAST_ERROR, TOAST_SUCCESS, TOAST_WARNING } from "~/constants";
import { Utils } from "~/lib/Utils";
// Deliberate import cycle (used inside methods only, never at module level): SentAttack ↔ Army.
import { Army } from "~/models/Army";
import * as storage from "~/storage";
import * as session from "~/storage/session";

/**
 * Records attacks as they are sent (Attaquer page) so a per-target summary can
 * be shown — place, troops, arrival, estimated terrain of the target on
 * arrival — with a text export for the forum.
 *
 * The server tells free accounts neither the targeted place nor the troop
 * composition, so both are kept in localStorage when the attack is sent and
 * then tied to the row the game displays. The matching does not rely on an
 * estimated travel time (the formula can drift from the game's) but on the
 * attack id: a freshly sent attack always carries the highest id of the list
 * for its target. During a flood the POST response already contains the list
 * and the match happens immediately; for a form submission it happens on the
 * first render of the next page. An attack sent from another browser stays
 * unmatched — only the arrival time, derived from the game's countdown, is
 * shown for every attack (free accounts; ComptePlus has it natively).
 *
 * @class SentAttack
 */
const KEY_SENT_ATTACKS = "outiiil_attaquesLancees";
// delay (s) after which a record never found in the game's list is dropped
// (send refused by the server, page never reloaded…)
const CAPTURE_TTL = 600;
// window (s) during which the game still accepts cancelling an attack
const CANCEL_WINDOW = 120;
// how many attacks a "Tout annuler" failed to cancel, reported after reload
const KEY_CANCEL_FAILURES = "outiiil_annulationEchec";

export class SentAttack {
  // Fields declared for TypeScript (Phase 2 was a straight conversion; real
  // typing is deferred — see .claude/plans/wxt-migration-followups.md).
  // Set by AttackPage when a flood starts, read by Army.
  static contexteFlood: any;
  /**
   * Loads the records, dropping attacks that already landed and records never
   * tied to a row of the game.
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
   * Records an attack as it is sent.
   *
   * @param {String} target pseudo du joueur attaqué
   * @param {String} lieu libellé du lieu visé (tel qu'affiché dans le formulaire)
   * @param {Object} unite composition {nom d'unité: nombre}
   * @param {Object} options
   *   - html: server response when sent over AJAX (flood), which allows the id
   *           and the exact arrival to be matched right away
   *   - terrain: the target's terrain known at launch, used to estimate what it
   *              will be on arrival
   */
  static record(target, place, unite, options: any = {}) {
    // empty click (no unit): the game will refuse the send, nothing to record
    if (!Object.values(unite).some((count) => count)) return;
    let list = SentAttack.load(),
      capture = {
        id: null,
        cible: target,
        lieu: place,
        unite: unite,
        lancee: moment().valueOf(),
        arrivee: null,
        // the target's terrain before this attack, then estimated after: start
        // from the estimate of the last attack still in flight on that target
        // when there is one — the profile's terrain does not reflect those yet
        // — otherwise from the terrain known at launch
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
   * Extracts the « Vous allez attaquer » / « Des renforts arrivent » rows from
   * a document, sorted by ascending attack id (i.e. order of sending).
   *
   * @param {jQuery} racine document (ou fragment) à parcourir
   * @return {Array} liste {elt, id, cible (null pour un renfort), cibleHtml, secondes, arrivee}
   */
  static extractRows(racine = $(document)) {
    let rows: any[] = [];
    racine.find("span[id^='attaque_']").each((i, elt) => {
      // the game's countdown is driven by a neighbouring script: reste(seconds, "attaque_<id>")
      let secondes = parseInt($(elt).nextAll("script").first().text().split("(")[1]);
      if (isNaN(secondes)) return;
      // ComptePlus: the game writes the place in brackets after the nickname
      // and the troops in a block after the Annuler link — both are read for
      // attacks we did not record (sent from somewhere else)
      let native = SentAttack.rowNodes(elt),
        texte = native.map((n) => n.textContent).join(" "),
        place = texte.match(/\((terrain de chasse|fourmilière|loge impériale)\)/i),
        troops = texte.match(/Troupes en attaques?\s*:\s*(.+?)\s*(?:Arrivée|$)/i);
      rows.push({
        elt: elt,
        id: parseInt($(elt).attr("id").split("_")[1]),
        // regular attack (the target is a link) — reinforcements have no target
        cible: $(elt).prev().find("a").length ? $(elt).prev().find("a:first").text() : null,
        // the game's own HTML for the target block (link to the profile, and to
        // the alliance in brackets when shown), reused as is in the table title
        // so nicknames stay clickable (issue #25)
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
   * Ties the still-unmatched records to the displayed rows: for a given target,
   * the N most recent records correspond to the N highest-id rows that are not
   * already tied.
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
   * The target's estimated terrain after an attack: same rule as the flood
   * simulation — one unit takes 1 terrain, capped at 20 % of the target's
   * terrain before the attack.
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
   * Recomputes a target's chain of estimated terrains from the oldest record
   * still in flight: needed when an attack in the middle of the chain goes
   * away (cancelled).
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
   * Brings the records back in step with the displayed rows: ties the
   * unmatched ones, drops those whose attack was cancelled, recomputes the
   * estimated terrains.
   *
   * @param {Array} rows lignes extraites de la page
   * @return {Array} captures à jour
   */
  static sync(rows) {
    let list = SentAttack.load(),
      modifie = SentAttack.link(list, rows);
    // pages that list running attacks list them all: a tied record whose row
    // has disappeared means the attack was cancelled.
    // It gives back the terrain it would have taken to the attacks sent after it.
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
   * Arrival time rounded to the minute, with the date when it is not today
   * (rendered like the ComptePlus original).
   */
  static formatArrival(secondes) {
    let rArrival = Utils.roundMinute(secondes);
    return `${rArrival.isSame(moment(), "day") ? "à" : "le " + rArrival.format("D MMM à")} ${rArrival.format("HH[h]mm")}`;
  }
  /**
   * Free accounts: adds the arrival time under every « Des renforts arrivent »
   * row (attacks themselves go into the per-target tables).
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
   * One summary table per target: place, troops, time left, arrival, estimated
   * terrain, single or grouped cancellation, and a copy in the game's text
   * format for the forum.
   *
   * The tables replace the game's « Vous allez attaquer » rows (every attack,
   * recorded or not). The countdown span and the game's Annuler link are moved
   * into the table rather than recreated: the game's own counter (its reste()
   * function) finds the span by its id and keeps updating it. For an attack we
   * did not record, place and troops come from the game's text when it provides
   * them (ComptePlus), otherwise « ? ».
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
      // type="button" is required: on the Attaquer page this block sits inside
      // the game's launch form, and a bare <button> would submit it
      html += `<tr class="reduce"><td colspan="7"><em>* : terrain estimé après l'attaque, si elle réussit et que rien d'autre ne le fait varier entre-temps.${groupe.some((a) => !SentAttack.troops(a)) ? " « ? » : attaque lancée depuis un autre navigateur, détails inconnus." : ""}</em></td></tr>
          </tbody></table>
          <button type="button" id="${id}Copier" class="o_marginT15 o_button">Copier pour le forum</button>
          ${annulables.length > 1 ? `<button type="button" id="${id}ToutAnnuler" class="o_marginT15 o_button f_error">Tout annuler</button>` : ""}
          </div>`;
      conteneur.append(html);
      // counter and Annuler link: moved into the table, the game's own kept.
      // For a recorded attack the launch time is known, so the link is removed
      // as soon as the game's cancellation window has passed, even if the page
      // stays open.
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
      // copy for the forum
      let clipboard = new Clipboard(`#${id}Copier`, {
        text: () => SentAttack.formatForum(target, groupe),
      });
      clipboard.on("success", () => {
        $.toast({ ...TOAST_SUCCESS, text: "Les attaques ont été copiées dans le presse papier." });
      });
      clipboard.on("error", () => {
        $.toast({ ...TOAST_ERROR, text: "Une erreur a été rencontrée, la copie a échoué." });
      });
      // grouped cancellation: the game's Annuler links, called one after the
      // other. The game only allows cancelling shortly after launch; the last
      // response (a full page) says which attacks are still there, and the
      // count is reported after the reload.
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
          // a GET navigation rather than reload(): on the Attaquer page the
          // current page is the response to the launch POST, and reloading
          // would replay it
          .finally(() => location.replace(location.pathname + location.search));
      });
    });
  }
  /**
   * The game's own nodes for a « Vous allez attaquer » row (read for
   * ComptePlus, then removed once the content has moved into a table): the
   * siblings of the countdown span, back to the previous line break (or the
   * title) and up to and including the next one — plus, on ComptePlus, the
   * detail block (troops, arrival) that follows that break up to the next one.
   * The span itself and the Annuler link are excluded (moved, not deleted).
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
   * An attack's targeted place: from our record, else the game's text (ComptePlus), else null.
   */
  static place(a) {
    return a.capture ? a.capture.place : a.ligne.lieuNatif;
  }
  /**
   * An attack's troops: from our record, else the game's text (ComptePlus), else null.
   */
  static troops(a) {
    return a.capture ? new Army({ unite: a.capture.unite }).toString() : a.ligne.troupesNatif;
  }
  /**
   * Text to paste on the forum: one entry per attack in the format of the
   * game's own rows, then the target's estimated terrain after the last one.
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
