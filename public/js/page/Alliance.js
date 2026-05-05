/*
 * Alliance.js
 * Hraesvelg
 **********************************************************************/

/**
 * Classe de fonction pour la page /alliance.php.
 *
 * @class PageAlliance
 * @constructor
 */
class PageAlliance {
  constructor() {
    /**
     * Creation du modele Alliance
     */
    this._alliance = new Alliance({ tag: Utils.alliance });
    /**
     * Connexion à l'utilitaire.
     */
    this._utilitaire = new PageForum();
  }
  /**
   *
   */
  executer() {
    // si les membres sont deja chargé on peux executé la fonction sinon on observe
    if ($("#tabMembresAlliance").length) {
      this.traitementMembre();
      this.carte();
      this.ongletCarte();
    } else {
      // Ajout des infos sur le tableau des membres
      let observer = new MutationObserver((mutationsList) => {
        this.traitementMembre();
        this.carte();
        this.ongletCarte();
        observer.disconnect();
      });
      observer.observe($("#alliance")[0], { childList: true });
    }
    return this;
  }
  /**
   * Affiche les modifications du tableau des membres.
   *
   * @private
   * @method traitementMembre
   */
  traitementMembre() {
    $("#tabMembresAlliance td:eq(5)").css("white-space", "nowrap");
    $(".simulateur table[class='ligne_paire'] tr:eq(0) td:eq(1)").append(
      ` (${$("img[alt='Actif']").length})`,
    );
    $(".simulateur table[class='ligne_paire'] tr:eq(0) td:eq(3)").append(
      ` (${$("img[alt='Vacances']").length})`,
    );
    $(".simulateur table[class='ligne_paire'] tr:eq(1) td:eq(1)").append(
      ` (${$("img[alt='Inactif depuis 3 jours']").length})`,
    );
    $(".simulateur table[class='ligne_paire'] tr:eq(1) td:eq(3)").append(
      ` (${$("img[alt='Bannie']").length})`,
    );
    $(".simulateur table[class='ligne_paire'] tr:eq(2) td:eq(1)").append(
      ` (${$("img[alt='Inactif depuis 10 jours']").length})`,
    );
    $(".simulateur table[class='ligne_paire'] tr:eq(2) td:eq(3)").append(
      ` (${$("img[alt='Colonisé']").length})`,
    );
    // ajout des totaux de l'alliance
    let tmpJoueurs = {};
    $("#tabMembresAlliance tr:gt(0)").each((i, elt) => {
      let pseudo = $(elt).find("td:eq(3)").text(),
        terrain = numeral($(elt).find("td:eq(5)").text()).value();
      tmpJoueurs[pseudo] = new Joueur({
        pseudo: pseudo,
        terrain: terrain,
        fourmiliere: ~~$(elt).find("td:eq(8)").text(),
        technologie: ~~$(elt).find("td:eq(7)").text(),
      });
      if (!Utils.comptePlus && !tmpJoueurs[pseudo].estJoueurCourant()) {
        if (tmpJoueurs[pseudo].estAttaquable()) $(elt).find("td:eq(6)").html(IMG_ATT);
        if (tmpJoueurs[pseudo].estAttaquant()) $(elt).find("td:eq(4)").html(IMG_DEF);
      }
    });
    this._alliance.joueurs = tmpJoueurs;

    $("#tabMembresAlliance").append(
      `<tfoot class='${Object.keys(this._alliance.joueurs).length % 2 ? "ligne_paire" : ""}'><tr class='gras centre'><td colspan='12'>Terrain : <span id='totalTerrain'>${numeral(this._alliance.calculTerrain()).format()}</span> cm² | Fourmilière : ${numeral(this._alliance.calculFourmiliere()).format()} | Technologie : ${numeral(this._alliance.calculTechnologie()).format()}.</td></tr></tfoot>`,
    );
    // Recupération des données de l'utilitaire sinon on met en forme le tableau directement
    $("#tabMembresAlliance tr:first").remove();
    $("#tabMembresAlliance").prepend(
      `<thead><tr class='alt'><th></th><th></th><th>Rang</th><th>Pseudo</th><th></th><th>Terrain</th><th></th><th><span style='padding-right:10px'>Technologie</span></th><th><span style='padding-right:10px'>Fourmiliere</span></th><th colspan='2'>Etat</th><th></th></tr></thead>`,
    );

    // Si on dispose d'un utilitaire pour la gestion des membres
    if (monProfil.parametre["forumMembre"].valeur) {
      // recuperation des commandes sur l'utilitaire
      this._utilitaire.consulterSection(monProfil.parametre["forumMembre"].valeur).then(
        (data) => {
          if (this._utilitaire.chargerJoueur(data)) this.traitementUtilitaire();
        },
        (jqXHR, textStatus, errorThrown) => {
          $.toast({
            ...TOAST_ERROR,
            text: "Une erreur réseau a été rencontrée lors de la récupération des membres.",
          });
        },
      );
    } else this.tableauAvecCarteCache();
    return this;
  }
  /**
   * Variante de tableau() qui utilise le cache local de la Carte de l'alliance
   * (rempli via le bouton "Charger / Actualiser") pour ajouter les colonnes
   * Tdt + Retour aux alliances qui n'ont pas le SDC chef-bootstrappé.
   * Si pas de cache → fallback sur tableau() basique.
   *
   * @method tableauAvecCarteCache
   */
  tableauAvecCarteCache() {
    const cacheKey = `outiiil_carteAlliance_${Utils.serveur}_${Utils.alliance}`;
    let cached = null;
    try {
      cached = JSON.parse(localStorage.getItem(cacheKey));
    } catch (e) {
      cached = null;
    }
    const hasCache = cached && cached.members && cached.members.length;
    if (hasCache) {
      // Hydrate les coords depuis le cache
      const coordsByPseudo = new Map();
      cached.members.forEach((m) => coordsByPseudo.set(m.pseudo, { x: m.x, y: m.y }));
      for (const pseudo in this._alliance.joueurs) {
        if (coordsByPseudo.has(pseudo)) {
          Object.assign(this._alliance.joueurs[pseudo], coordsByPseudo.get(pseudo));
        }
      }
      // Ajoute les colonnes Tdt + Retour entre Fourmilière et Etat
      $("#tabMembresAlliance th:eq(8)").after(`<th>Tdt</th><th>Retour</th>`);
      $("#tabMembresAlliance tfoot td:eq(0)").attr("colspan", 14);
      $("#tabMembresAlliance tr:gt(0):lt(-1)").each((i, elt) => {
        const pseudo = $(elt).find("td:eq(3)").text();
        const j = this._alliance.joueurs[pseudo];
        const has = j && j.x !== -1 && j.y !== -1;
        let tdHtml;
        if (has) {
          const tdt = monProfil.getTempsParcours2(j);
          const retour = Utils.roundMinute(tdt);
          // data-order : DataTable trie sur l'attribut (entier brut) plutôt que sur
          // le texte affiché ("22h 31m" sinon trié en alphabétique).
          tdHtml = `<td data-order='${tdt}'>${Utils.intToTime(tdt)}</td><td data-order='${retour.unix()}'>${retour.format("D MMM à HH[h]mm")}</td>`;
        } else {
          tdHtml = `<td data-order='-1'>N/C</td><td data-order='-1'>N/C</td>`;
        }
        $(elt).find("td:eq(8)").after(tdHtml);
      });
      // DataTable — targets ajustés vs tableau() : Etat-2 et last passent de 10/11 à 12/13
      $("#tabMembresAlliance th:eq(7), #tabMembresAlliance th:eq(8)").css({
        maxWidth: "50px",
        textOverflow: "ellipsis",
        overflow: "hidden",
      });
      $("#tabMembresAlliance").DataTable({
        bInfo: false,
        bPaginate: false,
        bAutoWidth: false,
        dom: "Bfrti",
        buttons: ["colvis", "copyHtml5", "csvHtml5", "excelHtml5"],
        order: [],
        stripeClasses: ["", "alt"],
        responsive: true,
        language: {
          zeroRecords: "Aucun joueur trouvé",
          infoEmpty: "Aucun enregistrement",
          infoFiltered: "(Filtré par _MAX_ enregistrements)",
          search: "Rechercher : ",
          buttons: { colvis: "Colonne" },
        },
        columnDefs: [
          { type: "quantite-grade", targets: 5 },
          { sortable: false, targets: [0, 1, 4, 6, 12, 13] },
        ],
      });
    } else {
      this.tableau();
    }
    // Bouton Synchroniser — disponible dans tous les cas (bootstrap si pas de cache,
    // refresh sinon). Recharge la page après sync pour que le tableau pick up les coords.
    $("#tabMembresAlliance_wrapper .dt-buttons").prepend(
      `<a id='o_syncCarteAlliance' class='dt-button' href='#'><span>Synchroniser</span></a>`,
    );
    $("#o_syncCarteAlliance").click((e) => {
      e.preventDefault();
      const $btn = $("#o_syncCarteAlliance");
      $btn.addClass("disabled").find("span").text("Synchronisation...");
      this._fetchAndCacheCoords()
        .then(() => location.reload())
        .catch((err) => {
          $btn.removeClass("disabled").find("span").text("Synchroniser");
          $.toast({
            ...TOAST_ERROR,
            text: err.message || "Erreur de synchronisation.",
          });
        });
      return false;
    });
    return this;
  }
  /**
   * Ajoute le tri.
   *
   * @private
   * @method tableau
   */
  tableau() {
    $("#tabMembresAlliance th:eq(7), #tabMembresAlliance th:eq(8)").css({
      maxWidth: "50px",
      textOverflow: "ellipsis",
      overflow: "hidden",
    });
    $("#tabMembresAlliance").DataTable({
      bInfo: false,
      bPaginate: false,
      bAutoWidth: false,
      dom: "Bfrti",
      buttons: ["colvis", "copyHtml5", "csvHtml5", "excelHtml5"],
      order: [],
      stripeClasses: ["", "alt"],
      responsive: true,
      language: {
        zeroRecords: "Aucun joueur trouvé",
        infoEmpty: "Aucun enregistrement",
        infoFiltered: "(Filtré par _MAX_ enregistrements)",
        search: "Rechercher : ",
        buttons: { colvis: "Colonne" },
      },
      columnDefs: [
        { type: "quantite-grade", targets: 5 },
        { sortable: false, targets: [0, 1, 4, 6, 10, 11] },
      ],
    });
    return this;
  }
  /**
   * Ajout des infos du SDC.
   *
   * @private
   * @method traitementUtilitaire
   */
  traitementUtilitaire() {
    for (let pseudo in this._utilitaire.alliance.joueurs) {
      // si la clé est une clé du tableau des memres
      if (this._alliance.joueurs.hasOwnProperty(pseudo)) {
        this._alliance.joueurs[pseudo].x = this._utilitaire.alliance.joueurs[pseudo].x;
        this._alliance.joueurs[pseudo].y = this._utilitaire.alliance.joueurs[pseudo].y;
        this._alliance.joueurs[pseudo].id = this._utilitaire.alliance.joueurs[pseudo].id;
        this._alliance.joueurs[pseudo].sujetForum =
          this._utilitaire.alliance.joueurs[pseudo].sujetForum;
        this._alliance.joueurs[pseudo].rang = this._utilitaire.alliance.joueurs[pseudo].rang;
        this._alliance.joueurs[pseudo].ordreRang =
          this._utilitaire.alliance.joueurs[pseudo].ordreRang;
      }
    }
    // On retraicie les colonnes des niveaux
    $("#tabMembresAlliance th:eq(1)").after(`<th>Grade</th>`);
    $("#tabMembresAlliance th:eq(9)").after(`<th>Tdt</th><th>Retour</th>`);
    $("#tabMembresAlliance tfoot td:eq(0)").attr("colspan", 15);
    // On compléte les données
    $("#tabMembresAlliance tr:gt(0):lt(-1)").each((i, elt) => {
      let pseudo = $(elt).find("td:eq(3)").text();
      // si nous avons les coordonnées on affiche les tempts de trajet
      $(elt)
        .find("td:eq(1)")
        .after(
          `<td align="center">${this._alliance.joueurs.hasOwnProperty(pseudo) ? this._alliance.joueurs[pseudo].rang : Utils.alliance}</td>`,
        );
      $(elt)
        .find("td:eq(9)")
        .after(
          this._alliance.joueurs[pseudo].x != -1 && this._alliance.joueurs[pseudo].y != -1
            ? `<td>${Utils.intToTime(monProfil.getTempsParcours2(this._alliance.joueurs[pseudo]))}</td><td>${Utils.roundMinute(monProfil.getTempsParcours2(this._alliance.joueurs[pseudo])).format("D MMM à HH[h]mm")}</td>`
            : `<td>N/C</td><td>N/C</td>`,
        );
      // si on est chef de l'alliance on peut modifier les rangs et que le joueur est dans l'utilitaire
      if (
        $("img[src='images/crayon.gif']").length &&
        this._alliance.joueurs.hasOwnProperty(pseudo)
      ) {
        $(elt)
          .find("td:eq(0)")
          .append(
            `<a id="o_rang${this._alliance.joueurs[pseudo].id}" href=""><img src="${IMG_UTILITY}" alt="rang"/></a>`,
          );
        $("#o_rang" + this._alliance.joueurs[pseudo].id).click((e) => {
          let boiteForm = new BoiteRang(this._alliance.joueurs[pseudo], this._utilitaire, this);
          boiteForm.afficher();
          return false;
        });
      }
    });
    this.tableauUtilitaire().optionAdmin();
    return this;
  }
  /**
   *
   */
  optionAdmin() {
    // si on est chef de l'alliance on peut mettre à jour les membres
    if ($("img[src='images/crayon.gif']").length) {
      $("#tabMembresAlliance_wrapper .dt-buttons").prepend(
        `<a id="o_actualiserAlliance" class="dt-button" href="#"><span>Actualiser l'alliance</span></a>`,
      );
      $("#o_actualiserAlliance").click((e) => {
        let promiseJoueur = new Array(),
          pseudoJoueur = new Array();
        // si coordonnée inconnu on va les chercher
        for (let joueur in this._alliance.joueurs) {
          // si le joueur n'est pas connu dans l'utilitaire
          if (!this._utilitaire.alliance.joueurs.hasOwnProperty(joueur))
            this._utilitaire.alliance.joueurs[joueur] = this._alliance.joueurs[joueur];
          // si ses coordonnées ne sont pas connu
          if (
            this._utilitaire.alliance.joueurs[joueur].x == -1 &&
            this._utilitaire.alliance.joueurs[joueur].y == -1
          ) {
            promiseJoueur.push(this._utilitaire.alliance.joueurs[joueur].getProfil());
            pseudoJoueur.push(joueur);
          }
        }
        // on recup les profils de tout les joueurs
        Promise.all(promiseJoueur).then((values) => {
          let promiseForum = new Array(),
            joueur = null;
          for (let i = 0; i < values.length; i++) {
            joueur = this._utilitaire.alliance.joueurs[pseudoJoueur[i]];
            joueur.chargerProfil(values[i]);
            // on enregistre
            if (!joueur.sujetForum)
              promiseForum.push(
                this._utilitaire.creerSujet(
                  joueur.toUtilitaire(),
                  " ",
                  monProfil.parametre["forumMembre"].valeur,
                ),
              );
          }
          // on creer les sujets pour les membres qui n'en disposent pas
          Promise.all(promiseForum).then((values) => {
            $.toast({ ...TOAST_SUCCESS, text: "la mise à jour c'est correctement effectuée." });
            this.actualiserMembre();
          });
        });
        return false;
      });
    }
    return this;
  }
  /**
   *
   */
  actualiserMembre() {
    $("#tabMembresAlliance").DataTable().destroy();
    // mise à jour de l'alliance
    for (let pseudo in this._utilitaire.alliance.joueurs) {
      // si la clé est une clé du tableau des membres
      if (this._alliance.joueurs.hasOwnProperty(pseudo)) {
        this._alliance.joueurs[pseudo].x = this._utilitaire.alliance.joueurs[pseudo].x;
        this._alliance.joueurs[pseudo].y = this._utilitaire.alliance.joueurs[pseudo].y;
        this._alliance.joueurs[pseudo].id = this._utilitaire.alliance.joueurs[pseudo].id;
        this._alliance.joueurs[pseudo].rang = this._utilitaire.alliance.joueurs[pseudo].rang;
        this._alliance.joueurs[pseudo].ordreRang =
          this._utilitaire.alliance.joueurs[pseudo].ordreRang;
      }
    }
    $("#tabMembresAlliance tr:gt(0):lt(-1)").each((i, elt) => {
      let pseudo = $(elt).find("td:eq(4)").text();
      $(elt)
        .find("td:eq(2)")
        .text(
          this._alliance.joueurs.hasOwnProperty(pseudo)
            ? this._alliance.joueurs[pseudo].rang
            : Utils.alliance,
        );
      $(elt)
        .find("td:eq(10)")
        .text(Utils.intToTime(monProfil.getTempsParcours2(this._alliance.joueurs[pseudo])));
      $(elt)
        .find("td:eq(11)")
        .text(
          Utils.roundMinute(monProfil.getTempsParcours2(this._alliance.joueurs[pseudo])).format(
            "D MMM à HH[h]mm",
          ),
        );
    });
    this.tableauUtilitaire().optionAdmin();
    return this;
  }
  /**
   * Ajoute le tri.
   *
   * @private
   * @method tableauUtilitaire
   */
  tableauUtilitaire() {
    $("#tabMembresAlliance th:eq(8), #tabMembresAlliance th:eq(9)").css({
      maxWidth: "50px",
      textOverflow: "ellipsis",
      overflow: "hidden",
    });
    $("#tabMembresAlliance").DataTable({
      bInfo: false,
      bPaginate: false,
      bAutoWidth: false,
      dom: "Bfrti",
      order: [],
      stripeClasses: ["", "alt"],
      buttons: ["colvis", "copyHtml5", "csvHtml5", "excelHtml5"],
      responsive: true,
      language: {
        zeroRecords: "Aucun joueur trouvé",
        info: "Page _PAGE_ de _PAGES_",
        infoEmpty: "Aucun enregistrement",
        infoFiltered: "(Filtré par _MAX_ enregistrements)",
        search: "Rechercher : ",
        buttons: { colvis: "Colonne" },
      },
      columnDefs: [
        { type: "quantite-grade", targets: 6 },
        { visible: false, targets: [3, 8, 9] },
        { sortable: false, targets: [0, 1, 5, 7, 12, 13, 14] },
      ],
    });
    return this;
  }
  /**
   * Injecte la section "Carte de l'alliance" en bas de la page.
   * Charge depuis localStorage si dispo ; refresh manuel via bouton.
   *
   * @method carte
   */
  carte() {
    if ($("#o_carteAlliance").length) return this; // déjà rendue
    const cacheKey = `outiiil_carteAlliance_${Utils.serveur}_${Utils.alliance}`;
    $("#alliance").after(`
      <div id='o_carteAlliance' class='boite_amelioration simulateur centre' style='display:none;'>
        <h2>Carte de l'alliance</h2>
        <p class='reduce'>Carte interactive des positions des membres. <b>Survole</b> un point pour voir les temps de trajet depuis ta fourmilière. <b>Drag</b> pour zoomer sur une zone, <b>clic</b> sur un point pour zoomer 4× dessus (utile dans les clusters denses). Données chargées à la demande puis mises en cache localement.</p>
        <div class='centre o_marginT15'>
          <button id='o_carteAllianceRefresh' class='o_button f_info'>Charger / Actualiser</button>
          <span id='o_carteAllianceStatus' class='reduce' style='margin-left:12px;color:#666;'></span>
        </div>
        <div id='o_carteAllianceChart' style='height:800px;margin-top:15px;display:none;'></div>
      </div>
    `);
    let cached = null;
    try {
      cached = JSON.parse(localStorage.getItem(cacheKey));
    } catch (e) {
      cached = null;
    }
    if (cached && cached.members && cached.members.length) {
      this._renderCarte(cached.members);
      this._afficherAge(cached.timestamp);
    }
    $("#o_carteAllianceRefresh").click(() => this._actualiserCarte());
    return this;
  }
  /**
   * Active l'onglet "Carte" du menu Alliance (injecté par content.js sur toutes
   * les pages) : intercepte le clic pour un toggle client-side, et bascule
   * automatiquement si la page est chargée avec le hash #carte (cas où on
   * arrive depuis une autre page d'alliance).
   *
   * @method ongletCarte
   */
  ongletCarte() {
    if (!$("#o_ongletCarte").length) return this;
    const showCarte = () => {
      $("#alliance").hide();
      $("#o_carteAlliance").show();
    };
    $("#o_ongletCarte").click((e) => {
      e.preventDefault();
      showCarte();
    });
    if (location.hash === "#carte") showCarte();
    return this;
  }
  /**
   * Fetch des coords pour tous les membres + persistance localStorage.
   * Ne touche pas à l'UI — résolveurs (Carte / tableau Membres) gèrent leur propre feedback.
   *
   * @private
   * @method _fetchAndCacheCoords
   * @returns {Promise<{members, timestamp}>}
   */
  _fetchAndCacheCoords() {
    const pseudos = Object.keys(this._alliance.joueurs);
    if (!pseudos.length) {
      return Promise.reject(new Error("Aucun membre détecté dans l'alliance."));
    }
    const cacheKey = `outiiil_carteAlliance_${Utils.serveur}_${Utils.alliance}`;
    const promises = pseudos.map((pseudo) => {
      const joueur = this._alliance.joueurs[pseudo];
      return joueur
        .getProfil()
        .then((html) => {
          joueur.chargerProfil(html);
          return joueur;
        })
        .catch(() => null);
    });
    return Promise.all(promises).then((joueurs) => {
      const members = joueurs
        .filter((j) => j && j.x !== -1 && j.y !== -1)
        .map((j) => ({
          pseudo: j.pseudo,
          x: j.x,
          y: j.y,
          terrain: j.terrain || 0,
        }));
      if (!members.length) throw new Error("Aucune coordonnée récupérée.");
      const timestamp = Date.now();
      try {
        localStorage.setItem(cacheKey, JSON.stringify({ timestamp, members }));
      } catch (e) {
        console.warn("outiiil: localStorage write failed", e);
      }
      return { members, timestamp };
    });
  }
  /**
   * Refresh de la Carte (UI Carte + render Highcharts).
   *
   * @private
   * @method _actualiserCarte
   */
  _actualiserCarte() {
    const pseudos = Object.keys(this._alliance.joueurs);
    $("#o_carteAllianceRefresh")
      .prop("disabled", true)
      .text(`Chargement de ${pseudos.length} profils...`);
    $("#o_carteAllianceStatus").text("");
    this._fetchAndCacheCoords()
      .then(({ members, timestamp }) => {
        $("#o_carteAllianceRefresh").prop("disabled", false).text("Charger / Actualiser");
        $.toast({
          ...TOAST_SUCCESS,
          text: `Carte mise à jour : ${members.length} membres positionnés.`,
        });
        this._afficherAge(timestamp);
        this._renderCarte(members);
      })
      .catch((err) => {
        $("#o_carteAllianceRefresh").prop("disabled", false).text("Charger / Actualiser");
        $.toast({
          ...TOAST_ERROR,
          text: err.message || "Erreur lors du chargement des profils.",
        });
      });
  }
  /**
   * Affiche le timestamp en texte humain à côté du bouton.
   *
   * @private
   * @method _afficherAge
   */
  _afficherAge(timestamp) {
    const minutes = Math.floor((Date.now() - timestamp) / 60000);
    let age;
    if (minutes < 1) age = "à l'instant";
    else if (minutes < 60) age = `il y a ${minutes} min`;
    else if (minutes < 1440) age = `il y a ${Math.floor(minutes / 60)}h`;
    else age = `il y a ${Math.floor(minutes / 1440)}j`;
    $("#o_carteAllianceStatus").text(`Données ${age}`);
  }
  /**
   * Render Highcharts dans #o_carteAllianceChart.
   * Regroupe les membres par case (x,y), trace les liens en-dessous d'un seuil,
   * affiche le tooltip avec temps de trajet (sans / avec bonus Vitesse d'attaque).
   *
   * @private
   * @method _renderCarte
   */
  _renderCarte(members) {
    $("#o_carteAllianceChart").show();
    // Désactive le warning Highcharts #15 : nos séries `line` représentent des arêtes
    // arbitraires entre cases (a→b dans n'importe quelle direction), donc les x ne
    // sont pas monotonement croissants. Le rendu marche, c'est juste un warning console.
    Highcharts.seriesTypes.line.prototype.requireSorting = false;
    const K_NEIGHBORS = 3; // chaque case reliée à ses K cases les plus proches
    const niveauVitesseAttaque = monProfil.niveauRecherche[6] || 0;
    members.forEach((m) => {
      m.isMe = m.pseudo === monProfil.pseudo;
    });
    const me = members.find((m) => m.isMe) || { x: monProfil.x, y: monProfil.y };
    const tempsParcours = (target, niveauVit) =>
      Math.ceil(
        Math.pow(0.9, niveauVit) *
          637200 *
          (1 - Math.exp(-Math.hypot(target.x - me.x, target.y - me.y) / 350)),
      );
    // Regroupement par case (x, y)
    const spotMap = new Map();
    for (const m of members) {
      const key = `${m.x},${m.y}`;
      if (!spotMap.has(key)) spotMap.set(key, { x: m.x, y: m.y, members: [] });
      spotMap.get(key).members.push(m);
    }
    const spots = [...spotMap.values()].map((s) => ({
      ...s,
      isMyGroup: s.members.some((m) => m.isMe),
    }));
    // Liens : K plus proches voisins (s'adapte à l'étalement de l'alliance)
    const edgeSet = new Set();
    for (let i = 0; i < spots.length; i++) {
      const others = spots
        .map((s, j) => ({ idx: j, d: Math.hypot(s.x - spots[i].x, s.y - spots[i].y) }))
        .filter((o) => o.idx !== i)
        .sort((a, b) => a.d - b.d)
        .slice(0, K_NEIGHBORS);
      others.forEach((o) => {
        const key = i < o.idx ? `${i}-${o.idx}` : `${o.idx}-${i}`;
        edgeSet.add(key);
      });
    }
    const edges = [...edgeSet].map((key) => {
      const [i, j] = key.split("-").map(Number);
      return [spots[i], spots[j]];
    });
    // Split en deux séries : liens vers moi (vert) vs entre autres membres (gris)
    const myLineData = [];
    const otherLineData = [];
    edges.forEach(([a, b]) => {
      const target = a.isMyGroup || b.isMyGroup ? myLineData : otherLineData;
      target.push([a.x, a.y]);
      target.push([b.x, b.y]);
      target.push([null, null]);
    });
    // Stats
    const allDists = [];
    for (let i = 0; i < spots.length; i++) {
      for (let j = i + 1; j < spots.length; j++) {
        allDists.push(Math.hypot(spots[i].x - spots[j].x, spots[i].y - spots[j].y));
      }
    }
    const dMin = allDists.length ? Math.min(...allDists) : 0;
    const dMax = allDists.length ? Math.max(...allDists) : 0;
    const dAvg = allDists.length ? allDists.reduce((s, v) => s + v, 0) / allDists.length : 0;
    Highcharts.chart("o_carteAllianceChart", {
      chart: {
        type: "scatter",
        zoomType: "xy",
        panKey: "shift",
        backgroundColor: "#fff",
        spacingTop: 25,
      },
      title: {
        text: `${members.length} membres sur ${spots.length} cases • ${edges.length} liens (${K_NEIGHBORS} plus proches voisins)`,
        style: { fontSize: "14px", fontWeight: "600" },
      },
      subtitle: {
        text: allDists.length
          ? `Distance min ${dMin.toFixed(0)} • max ${dMax.toFixed(0)} • moyenne ${dAvg.toFixed(0)}`
          : "",
        style: { fontSize: "11px", color: "#888" },
      },
      xAxis: {
        title: { text: "X (coord monde)" },
        gridLineWidth: 1,
        gridLineColor: "#f0f0f0",
      },
      yAxis: { title: { text: "Y (coord monde)" }, gridLineColor: "#f0f0f0" },
      credits: { enabled: false },
      legend: { enabled: false },
      tooltip: {
        // Semi-transparent pour ne pas masquer le rectangle de drag-zoom derrière
        backgroundColor: "rgba(255,255,255,0.7)",
        borderColor: "#888",
        useHTML: true,
        formatter: function () {
          const spot = this.point.spot;
          const pos = `(${spot.x.toFixed(0)}, ${spot.y.toFixed(0)})`;
          let html = "";
          if (spot.members.length === 1) {
            const m = spot.members[0];
            html += `<b>${m.pseudo}</b><br/>`;
            html += `Terrain : ${numeral(m.terrain).format()} cm²<br/>`;
            html += `Position : ${pos}`;
            if (m.isMe) {
              html += `<br/><em style="color:#27ae60">C'est toi</em>`;
            } else {
              const tSans = tempsParcours(m, 0);
              const tAvec = tempsParcours(m, niveauVitesseAttaque);
              html += `<br/><br/><b>Temps de trajet</b><br/>`;
              html += `&nbsp;&nbsp;Sans amélioration : ${Utils.intToTime(tSans)}<br/>`;
              html += `&nbsp;&nbsp;Avec ton bonus (Vit. att. ${niveauVitesseAttaque}) : ${Utils.intToTime(tAvec)}`;
            }
          } else {
            html += `<b>${spot.members.length} membres sur cette case</b><br/>`;
            html += `Position : ${pos}`;
            if (spot.isMyGroup) {
              html += `<br/><em style="color:#27ae60">Tu es ici, avec :</em>`;
              spot.members
                .filter((m) => !m.isMe)
                .forEach((m) => {
                  html += `<br/>&nbsp;&nbsp;• ${m.pseudo} (${numeral(m.terrain).format()} cm²)`;
                });
            } else {
              html += `<br/><br/>`;
              spot.members.forEach((m) => {
                html += `&nbsp;&nbsp;• <b>${m.pseudo}</b> (${numeral(m.terrain).format()} cm²)<br/>`;
              });
              const tSans = tempsParcours(spot, 0);
              const tAvec = tempsParcours(spot, niveauVitesseAttaque);
              html += `<br/><b>Temps de trajet</b> (commun, même case)<br/>`;
              html += `&nbsp;&nbsp;Sans amélioration : ${Utils.intToTime(tSans)}<br/>`;
              html += `&nbsp;&nbsp;Avec ton bonus (Vit. att. ${niveauVitesseAttaque}) : ${Utils.intToTime(tAvec)}`;
            }
          }
          return html;
        },
      },
      plotOptions: {
        scatter: {
          marker: {
            symbol: "circle",
            states: { hover: { lineColor: "#000", lineWidth: 2 } },
          },
          point: {
            events: {
              click: function () {
                // Clic sur un point → zoom 4× autour (utile pour explorer les clusters denses).
                // Cap : on stop si le viewport descendrait sous 1 unité de jeu (sinon clic infini).
                const chart = this.series.chart;
                const xExt = chart.xAxis[0].getExtremes();
                const yExt = chart.yAxis[0].getExtremes();
                const xR = (xExt.max - xExt.min) / 4;
                const yR = (yExt.max - yExt.min) / 4;
                if (xR < 1 || yR < 1) return;
                chart.xAxis[0].setExtremes(this.x - xR / 2, this.x + xR / 2);
                chart.yAxis[0].setExtremes(this.y - yR / 2, this.y + yR / 2);
                // Force l'apparition du bouton natif "Reset zoom" (sinon il n'apparaît
                // que quand le zoom est déclenché par drag-select, pas via setExtremes).
                chart.showResetZoom();
              },
            },
          },
        },
      },
      series: [
        // Liens entre autres membres (gris discret, en arrière-plan)
        {
          type: "line",
          name: "Liens",
          data: otherLineData,
          color: "rgba(120, 140, 160, 0.35)",
          lineWidth: 1,
          marker: { enabled: false },
          enableMouseTracking: false,
          states: { hover: { enabled: false } },
          showInLegend: false,
          animation: false,
        },
        // Liens vers moi (vert plus marqué, par-dessus les autres)
        {
          type: "line",
          name: "Liens vers toi",
          data: myLineData,
          color: "rgba(39, 174, 96, 0.7)",
          lineWidth: 1.5,
          marker: { enabled: false },
          enableMouseTracking: false,
          states: { hover: { enabled: false } },
          showInLegend: false,
          animation: false,
        },
        {
          type: "scatter",
          name: "Membres",
          data: spots.map((s) => {
            const n = s.members.length;
            const terrainMax = Math.max(...s.members.map((m) => m.terrain || 0));
            let fill, line;
            if (s.isMyGroup) {
              fill = "#27ae60";
              line = "#196f3d";
            } else if (n > 1) {
              fill = "#f39c12";
              line = "#b9770e";
            } else {
              fill = "#c0392b";
              line = "#fff";
            }
            let label;
            if (n === 1) label = s.members[0].pseudo;
            else if (s.isMyGroup) label = `Toi +${n - 1}`;
            else label = `${[...s.members].map((m) => m.pseudo).sort()[0]} +${n - 1}`;
            // Radius modeste : log(terrain) compressé pour limiter le stack visuel dans
            // les clusters denses (alliances de 30+ membres souvent groupés).
            const radiusBase = terrainMax > 0 ? 2 + Math.log10(terrainMax) / 2 : 4;
            return {
              x: s.x,
              y: s.y,
              spot: s,
              name: label,
              marker: {
                radius: n > 1 ? 5 + Math.min(n - 1, 3) : Math.max(3, Math.min(radiusBase, 6)),
                fillColor: fill,
                lineColor: line,
                lineWidth: n > 1 ? 2 : 1.5,
              },
            };
          }),
          dataLabels: {
            enabled: true,
            format: "{point.name}",
            allowOverlap: false,
            style: {
              fontSize: "10px",
              fontWeight: "normal",
              color: "#222",
              textOutline: "2px contrast",
            },
            y: -14,
          },
        },
      ],
    });
  }
}
