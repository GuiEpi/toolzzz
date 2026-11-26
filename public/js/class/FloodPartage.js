/*
 * FloodPartage.js
 **********************************************************************/

/**
 * Partage des floods en cours avec l'alliance, via la section cachée
 * Toolzzz_Flood du forum (ou celle que l'alliance tenait déjà à la main) : un
 * sujet par cible (titre = le pseudo floodé), où chacun note ses floods sur
 * elle. Les floods lancés ensemble sur une même cible partent dans un seul
 * message, et leur annulation dans le délai du jeu dans un message
 * d'annulation.
 *
 * Seuls les floods capturés par AttaqueLancee sont partagés (lancés depuis ce
 * navigateur), et seulement sur terrain de chasse. Le message est publié une
 * fois l'attaque liée à son id d'attaque, pour pouvoir l'annuler ensuite.
 *
 * Chaque message porte une ligne lisible et une ligne technique, relue par
 * l'onglet Floods :
 *   TZF1|id|cible|arrivée (ms)|terrain avant|terrain après|unités
 *   TZF1-ANNULE|id
 * Un message groupé porte une ligne technique par flood. Le lanceur est
 * l'auteur du message : les anciens sujets par lanceur (titre = son pseudo,
 * Toolzzz 3.19 et avant) se lisent de la même façon.
 *
 * @class FloodPartage
 */
const MARQUEUR_FLOOD = "TZF1";
const MARQUEUR_FLOOD_ANNULE = "TZF1-ANNULE";
// dernière recherche de la section quand son id n'est pas connu
const CLE_FLOOD_DETECTION = "outiiil_floodDetection";
// délai (ms) entre deux recherches de la section
const DELAI_DETECTION_FLOOD = 6 * 3600 * 1000;
// durée (ms) pendant laquelle les floods lus sur le forum sont réutilisés
const DUREE_CACHE_FLOODS = 90 * 1000;
// floods en vol déjà lus, par sujet : un sujet dont la cellule « Dernier
// message » n'a pas changé n'est pas rouvert
const CLE_FLOOD_SUJETS_LUS = "outiiil_floodSujetsLus";
// part maximale du terrain de la cible prise par une attaque
const PRISE_MAX_FLOOD = 0.2;
// écart maximal (ms) entre deux lancements sur une même cible pour les noter
// dans un même message (le flood optimisé envoie ses attaques à ~1 s d'écart)
const ECART_GROUPE_FLOOD = 20 * 1000;
// attente (ms) après le dernier lancement d'un groupe avant de le publier,
// pour que les attaques suivantes du même flood le rejoignent
const ATTENTE_GROUPE_FLOOD = 6 * 1000;

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
   * Lit la section et renvoie les sujets {id, titre, cible, dernier, nonLu} :
   * - cible : le pseudo en tête du titre, avant un éventuel « / » (une section
   *   tenue à la main ajoute des infos : « Ragnar / 592 / 52 / ⇄ / 5 ») ;
   * - dernier : le texte de la cellule « Dernier message », qui change à
   *   chaque nouveau message du sujet ;
   * - nonLu : le jeu marque le sujet « Non lu » pour ce joueur.
   *
   * @param {Object} data réponse xajax de callGetForum
   * @return {Array|null} null si la section est inaccessible
   */
  static lireSection(data) {
    let reponse = $(data).find("cmd:eq(1)").text();
    if (!reponse || reponse.includes("Vous n'avez pas accès à ce forum.")) return null;
    let sujets = [];
    // DOMParser (Utils.parseHtml) plutôt qu'un append dans la page : le HTML
    // reste inerte, sans charger les images ni exécuter les scripts
    Utils.parseHtml(reponse)
      .find("#form_cat tr:gt(0)")
      .each((i, elt) => {
        let titre = $(elt).find("td:eq(1)").text().trim(),
          // la case à cocher n'existe que pour les chefs : le lien du sujet
          // porte aussi son id
          id =
            $(elt).find("input[name='topic[]']").val() ||
            ($(elt).find("a.topic_forum").attr("onclick") || "").match(/\d+/)?.[0];
        if (titre && id)
          sujets.push({
            id: id,
            titre: titre,
            cible: FloodPartage.cibleSujet(titre),
            dernier: $(elt).find("td").last().text().trim(),
            nonLu: $(elt)
              .find("img[alt]")
              .is((i, img) => /non lu/i.test(img.alt)),
          });
      });
    return sujets;
  }
  /**
   * Pseudo en tête d'un titre de sujet, en minuscules pour comparer.
   */
  static cibleSujet(titre) {
    return titre.split("/")[0].trim().toLowerCase();
  }
  /**
   * Id du sujet intitulé `titre` dans la section, ou null s'il n'existe pas
   * encore. Seul le pseudo en tête du titre compte, sans la casse : une
   * section tenue à la main les écrit à sa façon (« Ragnar / 592 / ⇄ »). Relu à chaque publication,
   * sans mémoriser l'id : un chef a pu supprimer le sujet entre-temps (le
   * message partirait alors dans le vide).
   */
  static _trouverSujet(forum, titre) {
    return Promise.resolve(forum.consulterSection(monProfil.parametre["forumFlood"].valeur)).then(
      (data) => {
        let sujets = FloodPartage.lireSection(data);
        if (sujets === null) throw new Error("section flood inaccessible");
        let sujet = sujets.find((s) => s.cible == FloodPartage.cibleSujet(titre));
        return sujet ? sujet.id : null;
      },
    );
  }
  /**
   * Publie un message dans le sujet `titre`, en le créant au besoin (le
   * message devient alors son premier message).
   */
  static _poster(message, titre) {
    let forum = new PageForum();
    return FloodPartage._trouverSujet(forum, titre).then((id) => {
      if (id) return forum.envoyerMessage(id, encodeURIComponent(message));
      return forum.creerSujet(titre, message, monProfil.parametre["forumFlood"].valeur);
    });
  }
  /**
   * Range des captures en groupes de floods lancés ensemble sur une même
   * cible : par cible, en ordre de lancement, un écart de plus de
   * ECART_GROUPE_FLOOD entre deux lancements ouvre un nouveau groupe. Un
   * flood relancé plus tard sur la même cible a donc son propre message.
   *
   * @param {Array} captures
   * @return {Array} groupes (tableaux de captures)
   */
  static grouper(captures) {
    let groupes = [];
    [...captures]
      .sort((a, b) => (a.lancee || 0) - (b.lancee || 0))
      .forEach((c) => {
        let groupe = groupes.find(
          (g) =>
            g[0].cible == c.cible &&
            (c.lancee || 0) - (g[g.length - 1].lancee || 0) <= ECART_GROUPE_FLOOD,
        );
        if (groupe) groupe.push(c);
        else groupes.push([c]);
      });
    return groupes;
  }
  /**
   * Texte du message d'un groupe de floods sur une même cible : une ligne
   * lisible pour tout le groupe, puis une ligne technique par flood.
   *
   * @param {Array|Object} captures groupe (ou une seule capture)
   */
  static message(captures) {
    let groupe = [].concat(captures).sort((a, b) => a.arrivee - b.arrivee),
      nbUnites = (c) => Object.values(c.unite).reduce((s, n) => s + (n || 0), 0),
      nb = groupe.reduce((s, c) => s + nbUnites(c), 0),
      premier = groupe[0],
      dernier = groupe[groupe.length - 1],
      heure = (c) => moment(c.arrivee).format("D MMM à HH[h]mm[m]ss[s]"),
      arrivee =
        groupe.length > 1
          ? `${groupe.length} attaques, arrivées du ${heure(premier)} au ${
              moment(dernier.arrivee).isSame(premier.arrivee, "day")
                ? moment(dernier.arrivee).format("HH[h]mm[m]ss[s]")
                : heure(dernier)
            }`
          : `arrivée le ${heure(premier)}`,
      // terrain avant la première et après la dernière (estimation enchaînée)
      terrain =
        premier.terrainDepart != null && dernier.terrainCible != null
          ? `, TdC de la cible ~${numeral(premier.terrainDepart).format()} → ~${numeral(dernier.terrainCible).format()} cm²`
          : "";
    return (
      `Flood de ${numeral(nb).format()} unités sur [player]${premier.cible}[/player], ${arrivee}${terrain}\n` +
      groupe
        .map((c) =>
          [
            MARQUEUR_FLOOD,
            c.id,
            c.cible,
            c.arrivee,
            c.terrainDepart ?? "",
            c.terrainCible ?? "",
            nbUnites(c),
          ].join("|"),
        )
        .join("\n")
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
   * Relance de la publication quand un groupe attend la fin de son flood.
   */
  static _minuterie = null;
  /**
   * @private
   */
  static _publierEnAttente() {
    let maintenant = Date.now(),
      enAttente = AttaqueLancee.charger().filter(
        (a) => a.id && !a.partage && FloodPartage.estFlood(a) && a.arrivee > maintenant,
      ),
      // un groupe dont le dernier lancement est trop récent attend : les
      // attaques suivantes du même flood vont le rejoindre
      recent = (g) => maintenant - (g[g.length - 1].lancee || 0) < ATTENTE_GROUPE_FLOOD,
      groupes = FloodPartage.grouper(enAttente);
    if (groupes.some(recent)) {
      clearTimeout(FloodPartage._minuterie);
      FloodPartage._minuterie = setTimeout(() => FloodPartage.publier(), ATTENTE_GROUPE_FLOOD);
    }
    return groupes
      .filter((g) => !recent(g))
      .reduce(
        (suite, groupe) =>
          suite.then(() => {
            let ids = groupe.map((c) => c.id);
            // marqués avant l'envoi : un autre onglet qui synchronise en même
            // temps ne les publie pas une seconde fois
            FloodPartage._marquer(ids, true);
            return Promise.resolve(
              FloodPartage._poster(FloodPartage.message(groupe), groupe[0].cible),
            ).catch((e) => {
              FloodPartage._marquer(ids, false);
              throw e;
            });
          }),
        Promise.resolve(),
      );
  }
  /**
   * Signale l'annulation de floods déjà partagés, un message par sujet.
   *
   * @param {Array} captures captures des attaques annulées
   */
  static annuler(captures) {
    if (!captures.length || !FloodPartage.actif()) return;
    let parSujet = {};
    captures.forEach((c) => (parSujet[c.cible] = parSujet[c.cible] || []).push(c));
    return FloodPartage._enFile(() =>
      Object.entries(parSujet).reduce(
        (suite, [titre, liste]) =>
          suite.then(() =>
            FloodPartage._poster(
              `${liste.length > 1 ? `${liste.length} floods annulés` : "Flood annulé"} sur [player]${liste[0].cible}[/player].\n` +
                liste.map((c) => `${MARQUEUR_FLOOD_ANNULE}|${c.id}`).join("\n"),
              titre,
            ),
          ),
        Promise.resolve(),
      ),
    );
  }
  /**
   * Note dans les captures qu'elles ont été partagées.
   *
   * @param {Array} ids ids d'attaque
   */
  static _marquer(ids, partage) {
    let liste = AttaqueLancee.charger(),
      captures = liste.filter((a) => ids.some((id) => a.id == id));
    if (!captures.length) return;
    captures.forEach((c) => (c.partage = partage));
    AttaqueLancee.sauvegarder(liste);
  }
  /**
   * Extrait les floods d'un sujet (réponse xajax de callGetTopic).
   *
   * @param {Object} data
   * @param {String} titre titre du sujet (pseudo) : le lanceur quand l'auteur
   *   d'un message est illisible, sauf si le flood vise ce pseudo (sujet par cible)
   * @return {Object} {floods: [{id, lanceur, cible, arrivee, terrainDepart, terrainCible, unites}], annules: Set}
   */
  static lireSujet(data, titre) {
    let reponse = $(data).find("cmd:eq(1)").text(),
      floods = [],
      annules = new Set();
    Utils.parseHtml(reponse)
      .find(".messageForum")
      .each((i, elt) => {
        let texte = $(elt).text(),
          auteur = $(elt).prev().find("a").first().text().trim();
        for (let m of texte.matchAll(/TZF1-ANNULE\|(\d+)/g))
          annules.add((auteur || titre) + "#" + m[1]);
        for (let m of texte.matchAll(/TZF1\|(\d+)\|([^|\n]+)\|(\d+)\|(\d*)\|(\d*)\|(\d*)/g)) {
          let cible = m[2].trim(),
            lanceur =
              auteur || (cible.toLowerCase() == FloodPartage.cibleSujet(titre) ? "" : titre);
          if (!lanceur) continue;
          floods.push({
            id: m[1],
            lanceur: lanceur,
            cible: cible,
            arrivee: parseInt(m[3]),
            terrainDepart: m[4] ? parseInt(m[4]) : null,
            terrainCible: m[5] ? parseInt(m[5]) : null,
            unites: m[6] ? parseInt(m[6]) : null,
          });
        }
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
          if (sujets === null) throw new Error("section flood inaccessible");
          // seuls les sujets qui ont un nouveau message depuis la dernière
          // lecture sont rouverts (« Dernier message » changé, ou « Non lu ») :
          // les autres reprennent ce qui en avait été lu. Le « Non lu » seul ne
          // suffit pas : il s'éteint quand le joueur ouvre le sujet au forum.
          let lus = FloodPartage._sujetsLus(),
            aOuvrir = sujets.filter(
              (s) => s.nonLu || !lus[s.id] || lus[s.id].dernier != s.dernier || !s.dernier,
            );
          progres(0, aOuvrir.length);
          return Promise.all(
            sujets.map((s) =>
              !aOuvrir.includes(s)
                ? {
                    sujet: s,
                    floods: lus[s.id].floods,
                    annules: new Set(lus[s.id].annules),
                  }
                : Promise.resolve(forum.consulterSujet(s.id))
                    .then((d) => ({ sujet: s, ...FloodPartage.lireSujet(d, s.titre) }))
                    .catch(() => ({ sujet: s, floods: [], annules: new Set(), erreur: true }))
                    .then((r) => {
                      progres(++faits, aOuvrir.length);
                      return r;
                    }),
            ),
          ).then((resultats) => {
            let annules = new Set(resultats.flatMap((r) => [...r.annules]));
            FloodPartage._memoriserSujetsLus(resultats);
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
   * Clé des sujets lus : par serveur, alliance et section.
   */
  static _cleSujetsLus() {
    return `${CLE_FLOOD_SUJETS_LUS}_${Utils.serveur}_${Utils.alliance}_${monProfil.parametre["forumFlood"].valeur}`;
  }
  /**
   * Sujets déjà lus : {id: {dernier, floods, annules}}.
   */
  static _sujetsLus() {
    try {
      return JSON.parse(localStorage.getItem(FloodPartage._cleSujetsLus())) || {};
    } catch (e) {
      return {};
    }
  }
  /**
   * Mémorise ce qui a été lu de chaque sujet, réduit aux floods encore en vol
   * et à leurs annulations : la mémoire ne grossit pas avec les sujets. Un
   * sujet illisible n'est pas mémorisé, il sera rouvert.
   *
   * @param {Array} resultats [{sujet, floods, annules, erreur}]
   */
  static _memoriserSujetsLus(resultats) {
    let maintenant = Date.now(),
      enVol = (floods) => floods.filter((f) => f.arrivee > maintenant),
      // une annulation peut être notée dans un autre sujet que son flood
      // (lanceur passé de la 3.19 au rangement par cible entre les deux) :
      // on garde celles d'un flood en vol de n'importe quel sujet
      clesEnVol = new Set(
        resultats.flatMap((r) => enVol(r.floods).map((f) => f.lanceur + "#" + f.id)),
      ),
      lus = {};
    resultats
      .filter((r) => !r.erreur)
      .forEach(
        (r) =>
          (lus[r.sujet.id] = {
            dernier: r.sujet.dernier,
            floods: enVol(r.floods),
            annules: [...r.annules].filter((a) => clesEnVol.has(a)),
          }),
      );
    localStorage.setItem(FloodPartage._cleSujetsLus(), JSON.stringify(lus));
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
   * @return {Object} {cible, moi, surCible: [{lanceur, prise}], gainsCible: [{cible, prise}], pourMoi: [{lanceur, cible, prise}]}
   */
  static terrainsAImpact(floods, cible, terrainCible, arrivee) {
    let moi = monProfil.pseudo,
      r = { cible: terrainCible, moi: Utils.terrain, surCible: [], gainsCible: [], pourMoi: [] };
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
        if (f.lanceur == cible && f.cible != cible) {
          let gain = FloodPartage.priseEstimee(f);
          r.cible += gain;
          if (gain) r.gainsCible.push({ cible: f.cible, prise: gain });
        }
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
      if (t.gainsCible.length)
        parties.push(
          `${esc(cible)} ${signe(somme(t.gainsCible))} (${floods(t.gainsCible.length)} de ${esc(cible)} sur ${[...new Set(t.gainsCible.map((x) => esc(x.cible)))].join(", ")})`,
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
