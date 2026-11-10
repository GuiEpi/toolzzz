/*
 * FloodPartage.js
 **********************************************************************/

/**
 * Partage des floods en cours avec l'alliance, via la section cachée
 * Toolzzz_Flood du forum : un sujet par joueur (titre = pseudo), un message
 * par flood lancé, et un message d'annulation quand le flood est annulé dans
 * le délai du jeu.
 *
 * Seuls les floods capturés par AttaqueLancee sont partagés (lancés depuis ce
 * navigateur), et seulement sur terrain de chasse. Le message est publié une
 * fois l'attaque liée à son id d'attaque, pour pouvoir l'annuler ensuite.
 *
 * Chaque message porte une ligne lisible et une ligne technique, relue par
 * l'onglet Floods :
 *   TZF1|id|cible|arrivée (ms)|terrain avant|terrain après|unités
 *   TZF1-ANNULE|id
 *
 * @class FloodPartage
 */
const CLE_FLOOD_SUJET = "outiiil_floodSujet";
const MARQUEUR_FLOOD = "TZF1";
const MARQUEUR_FLOOD_ANNULE = "TZF1-ANNULE";
// dernière recherche de la section quand son id n'est pas connu
const CLE_FLOOD_DETECTION = "outiiil_floodDetection";
// délai (ms) entre deux recherches de la section
const DELAI_DETECTION_FLOOD = 6 * 3600 * 1000;
// durée (ms) pendant laquelle les floods lus sur le forum sont réutilisés
const DUREE_CACHE_FLOODS = 90 * 1000;
// part maximale du terrain de la cible prise par une attaque
const PRISE_MAX_FLOOD = 0.2;

class FloodPartage {
  /**
   * Partage actif : section connue et option non décochée.
   */
  static actif() {
    return !!(
      Utils.alliance &&
      monProfil.parametre["forumFlood"].valeur &&
      monProfil.parametre["partageFlood"].valeur
    );
  }
  /**
   * Cherche l'id de la section Toolzzz_Flood sur la page du forum quand il
   * n'est pas encore connu : un membre qui ne passe jamais par le forum
   * partage quand même ses floods. Au plus une fois toutes les 6 heures.
   *
   * @param {Boolean} forcer ignorer le délai entre deux recherches
   * @return {Promise<Boolean>} true si la section est connue
   */
  static detecterSection(forcer = false) {
    if (monProfil.parametre["forumFlood"].valeur) return Promise.resolve(true);
    if (!Utils.alliance) return Promise.resolve(false);
    let derniere = parseInt(localStorage.getItem(CLE_FLOOD_DETECTION)) || 0;
    if (!forcer && Date.now() - derniere < DELAI_DETECTION_FLOOD) return Promise.resolve(false);
    localStorage.setItem(CLE_FLOOD_DETECTION, Date.now());
    return Promise.resolve($.get(location.origin + "/alliance.php?forum_menu")).then(
      (html) => {
        let $span = PageForum.trouverSectionForum(Utils.parseHtml(html), FORUM_SECTION_FLOOD);
        if (!$span.length) return false;
        monProfil.parametre["forumFlood"].valeur = $span.attr("class").match(/\d+/)[0];
        monProfil.parametre["forumFlood"].sauvegarde();
        return true;
      },
      () => false,
    );
  }
  /**
   * Un lieu de capture correspond-il au terrain de chasse ?
   */
  static estFlood(capture) {
    return /terrain/i.test(capture.lieu || "");
  }
  /**
   * File des écritures : une à la fois, pour que deux floods lancés coup sur
   * coup ne créent pas chacun un sujet.
   */
  static _file = Promise.resolve();
  static _enFile(tache) {
    FloodPartage._file = FloodPartage._file.then(tache).catch((e) => {
      console.warn("outiiil: partage du flood échoué", e);
    });
    return FloodPartage._file;
  }
  /**
   * Clé du sujet mémorisé : par serveur, alliance et section (une section
   * recréée a d'autres sujets).
   */
  static _cleSujet() {
    return `${CLE_FLOOD_SUJET}_${Utils.serveur}_${Utils.alliance}_${monProfil.parametre["forumFlood"].valeur}`;
  }
  /**
   * Lit la section et renvoie les sujets {id, titre}.
   *
   * @param {Object} data réponse xajax de callGetForum
   * @return {Array|null} null si la section est inaccessible
   */
  static lireSection(data) {
    let reponse = $(data).find("cmd:eq(1)").text();
    if (!reponse || reponse.includes("Vous n'avez pas accès à ce forum.")) return null;
    let sujets = [];
    $("<div/>")
      .append(reponse)
      .find("#form_cat tr:gt(0)")
      .each((i, elt) => {
        let titre = $(elt).find("td:eq(1)").text().trim(),
          // la case à cocher n'existe que pour les chefs : le lien du sujet
          // porte aussi son id
          id =
            $(elt).find("input[name='topic[]']").val() ||
            ($(elt).find("a.topic_forum").attr("onclick") || "").match(/\d+/)?.[0];
        if (titre && id) sujets.push({ id: id, titre: titre });
      });
    return sujets;
  }
  /**
   * Id du sujet du joueur dans la section, ou null s'il n'existe pas encore.
   */
  static _trouverSujet(forum) {
    let memo = localStorage.getItem(FloodPartage._cleSujet());
    if (memo) return Promise.resolve(memo);
    return Promise.resolve(forum.consulterSection(monProfil.parametre["forumFlood"].valeur)).then(
      (data) => {
        let sujets = FloodPartage.lireSection(data);
        if (sujets === null) throw new Error("section Toolzzz_Flood inaccessible");
        let sujet = sujets.find((s) => s.titre == monProfil.pseudo);
        if (sujet) localStorage.setItem(FloodPartage._cleSujet(), sujet.id);
        return sujet ? sujet.id : null;
      },
    );
  }
  /**
   * Publie un message dans le sujet du joueur, en créant le sujet au besoin
   * (le message devient alors son premier message).
   */
  static _poster(message) {
    let forum = new PageForum();
    return FloodPartage._trouverSujet(forum).then((id) => {
      if (id) return forum.envoyerMessage(id, encodeURIComponent(message));
      return Promise.resolve(
        forum.creerSujet(monProfil.pseudo, message, monProfil.parametre["forumFlood"].valeur),
      ).then(() => FloodPartage._trouverSujet(forum));
    });
  }
  /**
   * Texte du message d'un flood.
   */
  static message(capture) {
    let nb = Object.values(capture.unite).reduce((s, n) => s + (n || 0), 0),
      arrivee = moment(capture.arrivee),
      terrain =
        capture.terrainDepart != null
          ? `, TdC de la cible ~${numeral(capture.terrainDepart).format()} → ~${numeral(capture.terrainCible).format()} cm²`
          : "";
    return (
      `Flood de ${numeral(nb).format()} unités sur [player]${capture.cible}[/player], arrivée le ${arrivee.format("D MMM à HH[h]mm[m]ss[s]")}${terrain}\n` +
      [
        MARQUEUR_FLOOD,
        capture.id,
        capture.cible,
        capture.arrivee,
        capture.terrainDepart ?? "",
        capture.terrainCible ?? "",
        nb,
      ].join("|")
    );
  }
  /**
   * Publie les floods liés pas encore partagés. Appelé après chaque liaison
   * (lancement, passage sur une page qui liste les attaques).
   */
  static publier() {
    if (!monProfil.parametre["partageFlood"].valeur) return;
    return FloodPartage._enFile(() => {
      if (!FloodPartage.actif())
        return FloodPartage.detecterSection().then(
          (trouvee) => trouvee && FloodPartage._publierEnAttente(),
        );
      return FloodPartage._publierEnAttente();
    });
  }
  /**
   * @private
   */
  static _publierEnAttente() {
    let aPublier = AttaqueLancee.charger().filter(
      (a) => a.id && !a.partage && FloodPartage.estFlood(a) && a.arrivee > Date.now(),
    );
    return aPublier.reduce(
      (suite, capture) =>
        suite.then(() => {
          // marqué avant l'envoi : un autre onglet qui synchronise en même
          // temps ne le publie pas une seconde fois
          FloodPartage._marquer(capture.id, true);
          return Promise.resolve(FloodPartage._poster(FloodPartage.message(capture))).catch((e) => {
            FloodPartage._marquer(capture.id, false);
            throw e;
          });
        }),
      Promise.resolve(),
    );
  }
  /**
   * Signale l'annulation de floods déjà partagés.
   *
   * @param {Array} ids ids d'attaque annulés
   */
  static annuler(ids) {
    if (!ids.length || !FloodPartage.actif()) return;
    return FloodPartage._enFile(() =>
      ids.reduce(
        (suite, id) =>
          suite.then(() => FloodPartage._poster(`Flood annulé.\n${MARQUEUR_FLOOD_ANNULE}|${id}`)),
        Promise.resolve(),
      ),
    );
  }
  /**
   * Note dans la capture qu'elle a été partagée.
   */
  static _marquer(id, partage) {
    let liste = AttaqueLancee.charger(),
      capture = liste.find((a) => a.id == id);
    if (!capture) return;
    capture.partage = partage;
    AttaqueLancee.sauvegarder(liste);
  }
  /**
   * Extrait les floods d'un sujet (réponse xajax de callGetTopic).
   *
   * @param {Object} data
   * @param {String} titre titre du sujet (pseudo), lanceur par défaut
   * @return {Object} {floods: [{id, lanceur, cible, arrivee, terrainDepart, terrainCible, unites}], annules: Set}
   */
  static lireSujet(data, titre) {
    let reponse = $(data).find("cmd:eq(1)").text(),
      floods = [],
      annules = new Set();
    $("<div/>")
      .append(reponse)
      .find(".messageForum")
      .each((i, elt) => {
        let texte = $(elt).text(),
          auteur = $(elt).prev().find("a").first().text().trim() || titre;
        for (let m of texte.matchAll(/TZF1-ANNULE\|(\d+)/g)) annules.add(auteur + "#" + m[1]);
        for (let m of texte.matchAll(/TZF1\|(\d+)\|([^|\n]+)\|(\d+)\|(\d*)\|(\d*)\|(\d*)/g))
          floods.push({
            id: m[1],
            lanceur: auteur,
            cible: m[2].trim(),
            arrivee: parseInt(m[3]),
            terrainDepart: m[4] ? parseInt(m[4]) : null,
            terrainCible: m[5] ? parseInt(m[5]) : null,
            unites: m[6] ? parseInt(m[6]) : null,
          });
      });
    return { floods: floods, annules: annules };
  }
  /**
   * Dernière lecture des floods de l'alliance : {quand, promesse}.
   */
  static _cache = null;
  /**
   * Floods en vol de l'alliance : ceux du forum (Toolzzz_Flood) pas encore
   * arrivés ni annulés, complétés par les floods de ce navigateur qui n'y
   * sont pas encore (publication en cours, ou section absente). La lecture du
   * forum est réutilisée pendant 90 secondes.
   *
   * @param {Boolean} forcer relire le forum même si la lecture est récente
   * @param {Function} progres (faits, total) pendant la lecture des sujets
   * @return {Promise<Object>} {floods, section (connue ?), erreurs (sujets illisibles)}
   */
  static chargerAlliance(forcer = false, progres = () => {}) {
    let cache = FloodPartage._cache;
    if (forcer || !cache || Date.now() - cache.quand > DUREE_CACHE_FLOODS) {
      cache = FloodPartage._cache = {
        quand: Date.now(),
        promesse: FloodPartage._lireForum(progres).catch((e) => {
          // pas de cache sur un échec : la prochaine demande réessaie
          FloodPartage._cache = null;
          throw e;
        }),
      };
    }
    return cache.promesse.then((r) => {
      let maintenant = Date.now(),
        floods = r.floods.filter((f) => f.arrivee > maintenant),
        connus = new Set(floods.map((f) => f.lanceur + "#" + f.id));
      AttaqueLancee.charger()
        .filter(
          (a) =>
            a.id &&
            a.arrivee > maintenant &&
            FloodPartage.estFlood(a) &&
            !connus.has(monProfil.pseudo + "#" + a.id),
        )
        .forEach((a) =>
          floods.push({
            id: String(a.id),
            lanceur: monProfil.pseudo,
            cible: a.cible,
            arrivee: a.arrivee,
            terrainDepart: a.terrainDepart,
            terrainCible: a.terrainCible,
            unites: Object.values(a.unite).reduce((s, n) => s + (n || 0), 0),
          }),
        );
      return { ...r, floods: floods.sort((a, b) => a.arrivee - b.arrivee) };
    });
  }
  /**
   * @private
   */
  static _lireForum(progres) {
    return FloodPartage.detecterSection(true).then((connue) => {
      if (!connue) return { floods: [], section: false, erreurs: 0 };
      let forum = new PageForum();
      return Promise.resolve(forum.consulterSection(monProfil.parametre["forumFlood"].valeur)).then(
        (data) => {
          let sujets = FloodPartage.lireSection(data),
            faits = 0;
          if (sujets === null) throw new Error("section Toolzzz_Flood inaccessible");
          progres(0, sujets.length);
          return Promise.all(
            sujets.map((s) =>
              Promise.resolve(forum.consulterSujet(s.id))
                .then((d) => FloodPartage.lireSujet(d, s.titre))
                .catch(() => ({ floods: [], annules: new Set(), erreur: true }))
                .then((r) => {
                  progres(++faits, sujets.length);
                  return r;
                }),
            ),
          ).then((resultats) => {
            let annules = new Set(resultats.flatMap((r) => [...r.annules]));
            return {
              section: true,
              erreurs: resultats.filter((r) => r.erreur).length,
              floods: resultats
                .flatMap((r) => r.floods)
                .filter((f) => !annules.has(f.lanceur + "#" + f.id)),
            };
          });
        },
      );
    });
  }
  /**
   * Terrain pris par un flood sur une cible qui a `terrain` à son arrivée :
   * une unité prend 1, dans la limite de 20 % du terrain de la cible.
   */
  static prise(unites, terrain) {
    return Math.max(0, Math.min(unites, Math.floor(terrain * PRISE_MAX_FLOOD)));
  }
  /**
   * Prise d'un flood dont on ne connaît pas le terrain de la cible : celle
   * estimée par son lanceur, sinon son nombre d'unités.
   */
  static priseEstimee(f) {
    return f.terrainDepart != null && f.terrainCible != null
      ? f.terrainDepart - f.terrainCible
      : f.unites || 0;
  }
  /**
   * Terrains de la cible et le mien quand mon flood arrivera, d'après les
   * floods en vol qui arrivent avant lui :
   * - sur la cible, chacun prend selon son nombre d'unités et le terrain
   *   qu'il reste à la cible à son arrivée ;
   * - les miens, sur la cible ou ailleurs, me font gagner leur prise ;
   * - ceux d'alliés sur moi me font perdre la leur.
   *
   * @param {Array} floods floods en vol (chargerAlliance)
   * @param {String} cible pseudo de la cible
   * @param {Integer} terrainCible terrain actuel de la cible (profil)
   * @param {Integer} arrivee timestamp (ms) de l'arrivée de mon flood
   * @return {Object} {cible, moi, surCible: [{lanceur, prise}], pourMoi: [{lanceur, cible, prise}]}
   */
  static terrainsAImpact(floods, cible, terrainCible, arrivee) {
    let moi = monProfil.pseudo,
      r = { cible: terrainCible, moi: Utils.terrain, surCible: [], pourMoi: [] };
    floods
      .filter((f) => f.arrivee < arrivee)
      .sort((a, b) => a.arrivee - b.arrivee)
      .forEach((f) => {
        let prise = 0;
        if (f.cible == cible) {
          prise = FloodPartage.prise(f.unites ?? FloodPartage.priseEstimee(f), r.cible);
          r.cible -= prise;
          r.surCible.push({ lanceur: f.lanceur, prise: prise });
        } else if (f.cible == moi) {
          prise = -FloodPartage.prise(f.unites ?? FloodPartage.priseEstimee(f), r.moi);
        } else if (f.lanceur == moi) prise = FloodPartage.priseEstimee(f);
        // la cible floode elle aussi (membre de l'alliance) : elle gagne
        if (f.lanceur == cible && f.cible != cible) r.cible += FloodPartage.priseEstimee(f);
        if (f.lanceur == moi || f.cible == moi) {
          r.moi += prise;
          if (prise) r.pourMoi.push({ lanceur: f.lanceur, cible: f.cible, prise: prise });
        }
      });
    return r;
  }
  /**
   * Résumé d'un terrainsAImpact pour l'afficher sous un formulaire de flood,
   * ou "" si aucun flood en vol n'arrive avant.
   *
   * @param {Object} t résultat de terrainsAImpact
   * @param {String} cible pseudo de la cible
   */
  static texteImpact(t, cible) {
    return FloodPartage.texteImpacts([{ cible: cible, t: t }], t);
  }
  /**
   * Même résumé pour plusieurs cibles (Multi-flood).
   *
   * @param {Array} cibles [{cible (pseudo), t (terrainsAImpact pour elle)}]
   * @param {Object} moi terrainsAImpact dont on lit ce qui me touche
   */
  static texteImpacts(cibles, moi) {
    let esc = (v) => $("<div>").text(v).html(),
      somme = (l) => l.reduce((s, x) => s + x.prise, 0),
      signe = (n) => (n > 0 ? "+" : "−") + numeral(Math.abs(n)).format(),
      floods = (n) => `${n} flood${n > 1 ? "s" : ""}`,
      qui = (l) => [...new Set(l.map((x) => esc(x.lanceur)))].join(", "),
      gains = moi ? moi.pourMoi.filter((x) => x.prise > 0) : [],
      pertes = moi ? moi.pourMoi.filter((x) => x.prise < 0) : [],
      parties = [];
    cibles.forEach(({ cible, t }) => {
      if (t.surCible.length)
        parties.push(
          `${esc(cible)} ${signe(-somme(t.surCible))} (${floods(t.surCible.length)} de ${qui(t.surCible)})`,
        );
    });
    if (gains.length) parties.push(`toi ${signe(somme(gains))} (${floods(gains.length)} à toi)`);
    if (pertes.length)
      parties.push(
        `toi ${signe(somme(pertes))} (${floods(pertes.length)} de ${qui(pertes)} sur toi)`,
      );
    if (!parties.length) return "";
    return (
      `Terrains à l'arrivée, d'après les floods en vol qui arrivent avant : ${parties.join(" · ")}. ` +
      `<span class='small'><em>Les floods des joueurs sans Toolzzz et les attaques ennemies ne sont pas comptés.</em></span>`
    );
  }
  /**
   * Terrain estimé de chaque cible avant et après chaque flood, en
   * enchaînant tous les floods de l'alliance sur elle par ordre d'arrivée :
   * on part du terrain estimé par le lanceur du premier qui arrive.
   * Écrit tdcAvant / tdcApres dans chaque flood (null si inconnu).
   *
   * @param {Array} floods
   */
  static enchainer(floods) {
    let terrains = {};
    [...floods]
      .sort((a, b) => a.arrivee - b.arrivee)
      .forEach((f) => {
        if (!(f.cible in terrains)) terrains[f.cible] = f.terrainDepart;
        let avant = terrains[f.cible];
        f.tdcAvant = avant;
        f.tdcApres =
          avant == null
            ? null
            : avant - FloodPartage.prise(f.unites ?? FloodPartage.priseEstimee(f), avant);
        terrains[f.cible] = f.tdcApres;
      });
    return floods;
  }
}
