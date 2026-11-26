/*
 * Commerce.js
 * Hraesvelg
 **********************************************************************/

/**
 * Classe de fonction pour la page /commerce.php.
 *
 * @class PageCommerce
 * @constructor
 */
// nombre de convois que « Tout annuler » n'a pas pu annuler, signalé après
// rechargement
const CLE_CONVOI_ANNULATION_ECHEC = "outiiil_convoiAnnulationEchec";

class PageCommerce {
  constructor(boiteComptePlus) {
    /**
     * Accés à la boite compte+
     */
    this._boiteComptePlus = boiteComptePlus;
    /**
     * Connexion à l'utilitaire.
     */
    this._utilitaire = new PageForum();
  }
  /**
   *
   */
  executer() {
    // convois en cours, lus une fois avant toute modification de la page
    this._convois = PageCommerce.lireConvois();
    // ajout d'information
    let capacite = Convoi.capaciteOuvriere(),
      ouvrieres = PageCommerce.ouvrieresDisponibles(),
      dispo = ouvrieres
        ? `<br/>Ouvrières disponibles : <strong>${numeral(ouvrieres.disponibles).format()}</strong> (${numeral(ouvrieres.total).format()} − ${numeral(ouvrieres.terrain).format()} sur le terrain de chasse), soit <strong>${numeral(Math.floor(ouvrieres.disponibles * capacite)).format()}</strong> ressources transportables.`
        : "";
    $("form table").append(
      `<tr class='centre'><td colspan=6>Info : Niveau d'étable <strong>${monProfil.niveauConstruction[11]}</strong>, 1 ouvrière peut transporter : <strong>${numeral(capacite).format("0[.]0")}</strong> ressources.${dispo}</td></tr>`,
    );
    this.tableauConvois();
    // ajout des boutons pour arrondir les quantités
    $("#bouton_nourriture_max").html(
      `Nourriture donnée <span id="o_arrondirNou" class="gras small">arrondir...</span>`,
    );
    $("#o_arrondirNou").click((e) => {
      e.preventDefault();
      let value = Math.floor($("#nbNourriture").val()),
        nbMat = Math.floor($("#nbMateriaux").val()),
        newValue = Utils.arrondiQuantite(value);
      $("#input_nbNourriture").val(numeral(newValue).format());
      $("#nbNourriture").val(newValue);
      // mise à jour des ouvrieres
      $("#input_nbOuvriere").val(
        numeral(
          Math.floor((newValue + nbMat) / (10 + monProfil.niveauConstruction[11] / 2)),
        ).format(),
      );
      $("#nbOuvriere").val(
        Math.floor((newValue + nbMat) / (10 + monProfil.niveauConstruction[11] / 2)),
      );
      return false;
    });
    // materiaux
    $("#bouton_materiaux_max").html(
      `Matériaux donnés <span id="o_arrondirMat" class="gras small">arrondir...</span>`,
    );
    $("#o_arrondirMat").click((e) => {
      e.preventDefault();
      let value = Math.floor($("#nbMateriaux").val()),
        nbNou = Math.floor($("#nbNourriture").val()),
        newValue = Utils.arrondiQuantite(value);
      $("#input_nbMateriaux").val(numeral(newValue).format());
      $("#nbMateriaux").val(newValue);
      // mise à jour des ouvrieres
      $("#input_nbOuvriere").val(
        numeral(
          Math.floor((newValue + nbNou) / (10 + monProfil.niveauConstruction[11] / 2)),
        ).format(),
      );
      $("#nbOuvriere").val(
        Math.floor((newValue + nbNou) / (10 + monProfil.niveauConstruction[11] / 2)),
      );
      return false;
    });
    // option c+
    if (!Utils.comptePlus) this.plus();
    // Si on dispose d'un utilitaire pour le commerce on affiche les outils
    if (monProfil.parametre["forumCommande"].valeur) {
      // recuperation des commandes sur l'utilitaire
      this._utilitaire.consulterSection(monProfil.parametre["forumCommande"].valeur).then(
        (data) => {
          if (this._utilitaire.chargerCommande(data)) this.afficherCommande();
        },
        (jqXHR, textStatus, errorThrown) => {
          $.toast({
            ...TOAST_ERROR,
            text: "Une erreur réseau a été rencontrée lors de la récupération des commandes.",
          });
        },
      );
      this.formulaireConvoi();
    }
    return this;
  }
  /**
   * Affiche les retours, et sauvegarde les convois en cours pour la boite compte plus.
   *
   * @private
   * @method plus
   */
  plus() {
    // autocomplete sur le champs pseudo
    $("#pseudo_convoi").autocomplete({
      source: (request, response) => {
        // requete pour autocomplete
        Joueur.rechercher(request.term).then((data) => {
          response(Utils.extraitRecherche(data, true, false));
        });
      },
      position: { my: "left top-5", at: "left bottom" },
      delay: 0,
      minLength: 3,
    });
    // sauvegarde des convois (le retour est affiché dans le tableau)
    let listeConvoi = this._convois.map((c) => ({
      cible: c.joueur,
      sens: c.sens,
      nou: c.nourriture,
      mat: c.materiaux,
      exp: c.fin,
    }));
    // tri les convois par ordre d'arrivée
    listeConvoi.sort((a, b) => {
      return moment(a.exp).diff(moment(b.exp));
    });
    // la page liste tous les convois en cours : une liste vide (dernier
    // convoi annulé ou rentré) doit aussi être enregistrée
    this.saveConvoi(listeConvoi);
    return this;
  }
  /**
   * Ouvrières pouvant partir en convoi, d'après le script de la page
   * (max_ouvriere, terrain) : celles qui ne sont pas sur le terrain de
   * chasse. Celles déjà parties en convoi ne sont plus comptées par le jeu.
   *
   * @static
   * @method ouvrieresDisponibles
   * @return {Object|null} {total, terrain, disponibles}
   */
  static ouvrieresDisponibles() {
    let html =
        $("script")
          .toArray()
          .map((s) => s.textContent)
          .find((t) => t.includes("max_ouvriere")) || "",
      lire = (nom) => {
        let m = html.match(new RegExp(`var ${nom}\\s*=\\s*(\\d+)`));
        return m ? parseInt(m[1]) : null;
      },
      total = lire("max_ouvriere") ?? Utils.ouvrieres,
      terrain = lire("terrain") ?? Utils.terrain;
    if (isNaN(total) || isNaN(terrain)) return null;
    return { total: total, terrain: terrain, disponibles: Math.max(0, total - terrain) };
  }
  /**
   * Lignes « Convois en cours » du jeu :
   * `<strong>- Vous allez livrer N [img] et M [img] à <a>Pseudo</a> dans 9H 38m 20s</strong> - <a>Annuler</a><br/>`.
   * Pour un convoi envoyé, « dans » est le retour des ouvrières (aller-retour).
   *
   * @static
   * @method lireConvois
   * @return {Array} [{elt, envoi, sens, joueur, nourriture, materiaux, ouvrieres, secondes, fin}]
   */
  static lireConvois() {
    let entier = (t) => parseInt(String(t).replace(/\D/g, "")) || 0,
      capacite = Convoi.capaciteOuvriere();
    return $("#centre > strong")
      .toArray()
      .filter((elt) => $(elt).find("a").length && /dans/.test($(elt).text()))
      .map((elt) => {
        let texte = $(elt).text(),
          [charge, duree] = texte.split(/\bdans\b/),
          nombres = charge.replace(/\s/g, "").match(/\d+/g) || [],
          envoi = /Vous allez livrer/.test(texte),
          nourriture = entier(nombres[0]),
          materiaux = entier(nombres[1]),
          secondes = Utils.timeToInt(duree.trim());
        return {
          elt: elt,
          envoi: envoi,
          sens: texte.includes("livrer"),
          joueur: $(elt).find("a").first().text().trim(),
          nourriture: nourriture,
          materiaux: materiaux,
          ouvrieres: envoi ? Math.ceil((nourriture + materiaux) / capacite) : 0,
          secondes: secondes,
          fin: moment().add(secondes, "s"),
        };
      });
  }
  /**
   * Remplace les lignes « Convois en cours » du jeu par un tableau, avec une
   * copie pour le forum. Le lien Annuler du jeu est déplacé dans le tableau.
   *
   * @private
   * @method tableauConvois
   */
  tableauConvois() {
    let convois = [...this._convois].sort((a, b) => a.secondes - b.secondes);
    if (!convois.length) return this;
    let esc = (t) => $("<div>").text(t).html(),
      lien = (p) => `<a href='Membre.php?Pseudo=${encodeURIComponent(p)}'>${esc(p)}</a>`,
      somme = (cle) => convois.reduce((s, c) => s + c[cle], 0),
      html = `<div id='o_convoisEnCours' class='boite_amelioration simulateur centre'>
        <h2>Convois en cours</h2>
        <table class='o_attaquesLancees o_maxWidth centre' cellspacing='0'>
        <thead><tr><th></th><th>Joueur</th><th>${IMG_POMME}</th><th>${IMG_MAT}</th><th>Ouvrières</th><th>Dans</th><th>Le*</th><th></th></tr></thead>
        <tbody>`;
    convois.forEach((c, i) => {
      html += `<tr${i % 2 ? " class='ligne_paire'" : ""}>
        <td>${c.envoi ? "Envoi à" : "Reçu de"}</td><td>${lien(c.joueur)}</td>
        <td class='right'>${numeral(c.nourriture).format()}</td>
        <td class='right'>${numeral(c.materiaux).format()}</td>
        <td class='right'>${c.envoi ? numeral(c.ouvrieres).format() : "-"}</td>
        <td id='o_convoiReste${i}'></td>
        <td>${Utils.roundMinute(c.secondes).format("D MMM [à] HH[h]mm")}</td>
        <td id='o_convoiAnnuler${i}'></td></tr>`;
    });
    html += `<tr class='gras'><td colspan='2'>${convois.length} convoi${convois.length > 1 ? "s" : ""}</td>
        <td class='right'>${numeral(somme("nourriture")).format()}</td>
        <td class='right'>${numeral(somme("materiaux")).format()}</td>
        <td class='right'>${numeral(somme("ouvrieres")).format()}</td><td colspan='3'></td></tr>
        <tr class='reduce'><td colspan='8'><em>* : pour un envoi, retour de tes ouvrières (aller-retour). Les ouvrières sont déduites de la charge, le jeu ne les affiche pas.</em></td></tr>
        </tbody></table>
        <button type='button' id='o_convoisCopier' class='o_marginT15 o_button'>Copier pour le forum</button>
        <button type='button' id='o_convoisToutAnnuler' class='o_marginT15 o_button f_error' style='display:none;'>Tout annuler</button>
      </div>`;
    $("#centre > h3:contains('Convois en cours')").first().after(html);
    // lignes natives : le lien Annuler passe dans le tableau, le reste est
    // masqué (la ligne reste en place pour plus() et le C+)
    convois.forEach((c, i) => {
      let n = c.elt.nextSibling;
      while (n && !(n.nodeType == 1 && n.tagName == "BR")) {
        let suivant = n.nextSibling;
        if (n.nodeType == 1 && n.tagName == "A" && /annuler=/.test(n.getAttribute("href") || ""))
          $(n).appendTo(`#o_convoiAnnuler${i}`);
        else if (n.nodeType == 3) n.remove();
        else $(n).hide();
        n = suivant;
      }
      if (n) $(n).hide();
      $(c.elt).hide();
      Utils.decreaseTime(c.secondes, "o_convoiReste" + i, {
        aZero: () => $("#o_convoiReste" + i).text(c.envoi ? "rentré" : "arrivé"),
      });
    });
    this.toutAnnulerConvois();
    let clipboard = new Clipboard("#o_convoisCopier", {
      text: () => PageCommerce.formatForum(convois),
    });
    clipboard.on("success", () => {
      $.toast({ ...TOAST_SUCCESS, text: "Les convois ont été copiés dans le presse papier." });
    });
    clipboard.on("error", () => {
      $.toast({ ...TOAST_ERROR, text: "Une erreur a été rencontrée, la copie a échoué." });
    });
    return this;
  }
  /**
   * Bouton « Tout annuler » : appelle l'un après l'autre les liens Annuler
   * du jeu, chacun relu dans la réponse précédente (jeton renouvelé), puis
   * recharge la page. La dernière réponse dit quels convois sont encore là ;
   * leur nombre est signalé après rechargement.
   *
   * @private
   * @method toutAnnulerConvois
   */
  toutAnnulerConvois() {
    let liens = () => $("#o_convoisEnCours a[href*='annuler=']").toArray(),
      echecs = sessionStorage.getItem(CLE_CONVOI_ANNULATION_ECHEC);
    if (echecs) {
      sessionStorage.removeItem(CLE_CONVOI_ANNULATION_ECHEC);
      $.toast({
        ...TOAST_WARNING,
        text: `${echecs} convoi${echecs > 1 ? "s n'ont" : " n'a"} pas pu être annulé${echecs > 1 ? "s" : ""}.`,
      });
    }
    if (liens().length < 2) return this;
    $("#o_convoisToutAnnuler")
      .show()
      .click(() => {
        let encore = liens();
        if (!encore.length || !confirm(`Annuler les ${encore.length} convois en cours ?`)) return;
        $("#o_convoisToutAnnuler").prop("disabled", true).text("Annulation…");
        let id = (href) => (href.match(/annuler=(\d+)/) || [])[1];
        encore
          // le jeu change le jeton t= de ses liens après chaque annulation :
          // celui d'un lien de la page est refusé (sans message) dès la
          // deuxième. Chaque annulation prend le lien de la réponse précédente.
          .reduce(
            (suite, a) =>
              suite.then((html) => {
                let href = $(a).attr("href"),
                  frais = html
                    ? Utils.parseHtml(html)
                        .find(`a[href*='annuler=${id(href)}&']`)
                        .attr("href")
                    : null;
                return $.get(frais || href);
              }),
            Promise.resolve(null),
          )
          .then((html) => {
            let restants = new Set(
                Utils.parseHtml(html)
                  .find("a[href*='commerce.php?annuler=']")
                  .toArray()
                  .map((a) => id($(a).attr("href"))),
              ),
              nb = encore.filter((a) => restants.has(id($(a).attr("href")))).length;
            if (nb) sessionStorage.setItem(CLE_CONVOI_ANNULATION_ECHEC, nb);
          })
          // navigation GET et non reload() : la page peut être la réponse du
          // POST d'envoi d'un convoi, un reload le relancerait
          .finally(() => location.replace(location.pathname));
      });
    return this;
  }
  /**
   * Texte à coller sur le forum : un convoi par ligne, au format des lignes
   * du jeu.
   *
   * @static
   * @method formatForum
   */
  static formatForum(convois) {
    return convois
      .map((c) => {
        let secondes = Math.max(0, c.fin.diff(moment(), "s")),
          charge = `${numeral(c.nourriture).format()} nourritures et ${numeral(c.materiaux).format()} materiaux`,
          // durée comme le jeu : heures cumulées en majuscule (« 26H 5m 51s »)
          duree = [
            Math.floor(secondes / 3600) ? `${Math.floor(secondes / 3600)}H` : "",
            `${Math.floor((secondes % 3600) / 60)}m`,
            `${secondes % 60}s`,
          ]
            .filter(Boolean)
            .join(" "),
          fin = `dans ${duree} - Retour le ${Utils.roundMinute(secondes).format("D MMM [à] HH[h]mm")}`;
        return c.envoi
          ? `Vous allez livrer ${charge} à ${c.joueur} ${fin}`
          : `Vous allez recevoir ${charge} de ${c.joueur} ${fin}`;
      })
      .join("\n");
  }

  /**
   * Sauvegarde les convois en cours.
   *
   * @private
   * @method saveConvoi
   * @param {Array} liste des convois en cours.
   */
  saveConvoi(liste) {
    let actuel = this._boiteComptePlus.convoi || [];
    if (
      actuel.length != liste.length ||
      (liste.length &&
        (actuel[0]["cible"] != liste[0]["cible"] ||
          (liste[0]["exp"].diff(actuel[0]["exp"], "s") > 1 &&
            !Utils.comptePlus &&
            $("#boiteComptePlus").length)))
    ) {
      this._boiteComptePlus.convoi = liste;
      this._boiteComptePlus.startConvoi = liste.length ? moment() : 0;
      this._boiteComptePlus.sauvegarder().majConvoi();
    }
    return this;
  }
  /**
   * Affiche les commandes en cours issu de l'utilitaire.
   *
   * @private
   * @method afficherCommande
   * @param {Object} liste des lignes de commandes.
   */
  afficherCommande() {
    let total = 0,
      totalRouge = 0,
      tabCommandeAff = new Array(),
      tabCommandePersoEnCours = new Array(),
      contenu = `<div id="o_listeCommande" class="simulateur centre o_marginT15"><h2>Commandes</h2><table id='o_tableListeCommande' class="o_maxWidth" cellspacing=0>
            <thead><tr class="ligne_paire"><th>Pseudo</th><th>${IMG_POMME}</th><th>${IMG_MAT}</th><th>Echéance</th><th>Status</th><th>État</th><th>Temps de trajet</th><th>Livrer</th><th>Options</th></tr></thead>`;
    for (let id in this._utilitaire.commande) {
      if (this._utilitaire.commande[id].estAFaire()) {
        contenu += this._utilitaire.commande[id].toHTML();
        total += parseInt(this._utilitaire.commande[id].materiaux);
        if (this._utilitaire.commande[id].estHorsTard())
          totalRouge += parseInt(this._utilitaire.commande[id].materiaux);
        tabCommandeAff.push(id);
      }
      // ajout des commandes à verifier pour vois les convois
      // on affiche les convois pour nos commandes en cours
      // on affiche les conboi pour les commandes terminés de moins de 1 jour
      if (this._utilitaire.commande[id].demandeur.pseudo == monProfil.pseudo)
        if (
          this._utilitaire.commande[id].etat == ETAT_COMMANDE["En cours"] ||
          (this._utilitaire.commande[id].etat == ETAT_COMMANDE["Terminée"] &&
            this._utilitaire.commande[id].estTermineRecent())
        )
          tabCommandePersoEnCours.push(id);
    }
    contenu += `<tfoot><tr class='gras ${tabCommandeAff.length % 2 ? "ligne_paire" : ""}'><td colspan='9'>${tabCommandeAff.length} commande(s) : ${numeral(total).format("0.00 a")} ~ <span class='red'>${numeral(totalRouge).format("0.00 a")}</span> en retard !</td></tr></tfoot></table></div><br/>`;
    $("#centre .Bas").before(contenu);
    // event
    for (let id of tabCommandeAff)
      this._utilitaire.commande[id].ajouterEvent(this, this._utilitaire);
    $("#o_tableListeCommande").DataTable({
      bInfo: false,
      bPaginate: false,
      bAutoWidth: false,
      dom: "Bfrti",
      buttons: ["colvis", "copyHtml5", "csvHtml5", "excelHtml5"],
      order: [[5, "desc"]],
      stripeClasses: ["", "ligne_paire"],
      responsive: true,
      language: {
        zeroRecords: "Aucune commande trouvée",
        infoEmpty: "Aucun enregistrement",
        infoFiltered: "(Filtré par _MAX_ enregistrements)",
        search: "Rechercher : ",
        buttons: { colvis: "Colonne" },
      },
      columnDefs: [
        { type: "quantite-grade", targets: [1, 2] },
        { type: "moment-D MMM YYYY", targets: 3 },
        { type: "time-unformat", targets: 6 },
        { sortable: false, targets: [7, 8] },
      ],
    });
    $("#o_tableListeCommande_wrapper .dt-buttons").prepend(
      `<a id="o_ajouterCommande" class="dt-button" href="#"><span>Commander</span></a>`,
    );
    $("#o_ajouterCommande").click((e) => {
      let boiteCommande = new BoiteCommande(new Commande(), this._utilitaire, this);
      boiteCommande.afficher();
    });
    // récuperation des convois sur l'utilitaire
    this.afficherConvoi(tabCommandePersoEnCours);
    return this;
  }
  /**
   *
   */
  actualiserCommande() {
    let data = new Array(),
      total = 0,
      totalRouge = 0,
      tabCommandeAff = new Array(); // current table data
    for (let id in this._utilitaire.commande) {
      if (this._utilitaire.commande[id].estAFaire()) {
        data.push($(this._utilitaire.commande[id].toHTML())[0]);
        total += parseInt(this._utilitaire.commande[id].materiaux);
        if (this._utilitaire.commande[id].estHorsTard())
          totalRouge += parseInt(this._utilitaire.commande[id].materiaux);
        tabCommandeAff.push(id);
      }
    }
    $("#o_tableListeCommande").DataTable().clear().rows.add(data).draw();
    for (let id of tabCommandeAff)
      this._utilitaire.commande[id].ajouterEvent(this, this._utilitaire);
    // mise à jour du tfoot
    $("#o_tableListeCommande tfoot").html(
      `<tr class='gras ${tabCommandeAff.length % 2 ? "ligne_paire" : ""}'><td colspan='9'>${tabCommandeAff.length} commande(s) : ${numeral(total).format("0.00 a")} ~ <span class='red'>${numeral(totalRouge).format("0.00 a")}</span> en retard !</td></tr>`,
    );
    return this;
  }
  /**
   * Afficher les convois en cours.
   *
   * @private
   * @method afficherConvoi
   */
  afficherConvoi(tabCommande) {
    if (!Utils.comptePlus) {
      for (let id of tabCommande) {
        this._utilitaire.consulterSujet(id).then(
          (data) => {
            let response = $(data).find("cmd:eq(1)").text();
            if (response.includes("Vous n'avez pas accès à ce forum."))
              $.toast({
                ...TOAST_ERROR,
                text: "L'identifiant du sujet pour les convois est érroné.",
              });
            else {
              let convoi = null,
                message = "",
                nombres = new Array();
              Utils.parseHtml(response)
                .find(".messageForum")
                .each((i, elt) => {
                  message = $(elt).text();
                  if (message.trim()) {
                    nombres = message
                      .replace(/ /g, "")
                      .split("dans")[0]
                      .match(/^\d+|\d+\b|\d+(?=\w)/g);
                    convoi = new Convoi({
                      expediteur: $(elt).prev().find("a").text(),
                      destinataire: monProfil.pseudo,
                      nourriture: nombres[0],
                      materiaux: nombres[1],
                      idCommande: id,
                      dateArrivee: moment(message.split("Retour le ")[1], "D MMM YYYY à HH[h]mm"),
                    });
                    // si la commande est toujours en cours et que je suis le destinaitaire et que le convoi est n'est pas encore arrivée
                    if (!convoi.estTermine())
                      convoi.toHTML(
                        $("h3:contains('Convois en cours:')").length ? "h3" : ".simulateur:first",
                        convoi.type,
                      );
                  }
                });
            }
          },
          (jqXHR, textStatus, errorThrown) => {
            $.toast({
              ...TOAST_ERROR,
              text: "Une erreur réseau a été rencontrée lors de la récupération des convois.",
            });
          },
        );
      }
      this.plus();
    }
    return this;
  }
  /**
   * Modifie le bouton d'envoie des convois pour prendre ne compte l'utilitaire.
   *
   * @private
   * @method formulaireConvoi
   */
  formulaireConvoi() {
    $("input[name='convoi']")
      .before("<input id='o_idCommande' type='hidden' value='-1' name='o_idCommande'/>")
      .after(` <button id='o_resetConvoi'>Effacer</button>`)
      .click((e) => {
        let idCommande = $("#o_idCommande").val();
        if (idCommande != -1) {
          // Enrengistrement du convoi
          e.preventDefault();
          let monConvoi = new Convoi({
            expediteur: monProfil.pseudo,
            destinataire: $("#pseudo_convoi").val(),
            materiaux: numeral($("#nbMateriaux").val()).value(),
            nourriture: numeral($("#nbNourriture").val()).value(),
            idCommande: numeral(idCommande).value(),
            dateArrivee: moment().add(
              monProfil.getTempsParcours2(this._utilitaire.commande[idCommande].demandeur),
              "s",
            ),
          });
          // enregistrement
          this._utilitaire.envoyerMessage(idCommande, monConvoi.toUtilitaire()).then(
            (data) => {
              // Mise a jour des commandes
              this._utilitaire.commande[idCommande].ajouteConvoi(monConvoi);
              this._utilitaire
                .modifierSujet(
                  this._utilitaire.commande[idCommande].toUtilitaire(),
                  " ",
                  idCommande,
                )
                .then(
                  (data) => {
                    // si la commande est terminé on passe la suivante en attente en cours si il n'y a pas d'autres en cours
                    let cmdSuivante = 99999999999999999;
                    for (let id in this._utilitaire.commande) {
                      if (this._utilitaire.commande[id].etat == ETAT_COMMANDE["En cours"]) {
                        cmdSuivante = 99999999999999999;
                        break;
                      }
                      if (
                        this._utilitaire.commande[id].etat == ETAT_COMMANDE["En attente"] &&
                        id < cmdSuivante
                      )
                        cmdSuivante = id;
                    }
                    if (cmdSuivante != 99999999999999999) {
                      this._utilitaire.commande[cmdSuivante].etat = ETAT_COMMANDE["En cours"];
                      this._utilitaire
                        .modifierSujet(
                          this._utilitaire.commande[cmdSuivante].toUtilitaire(),
                          " ",
                          cmdSuivante,
                        )
                        .then(
                          (data) => {
                            $.toast({
                              ...TOAST_SUCCESS,
                              text: "Nouvelle commande en cours à jour.",
                            });
                          },
                          (jqXHR, textStatus, errorThrown) => {
                            $.toast({
                              ...TOAST_ERROR,
                              text: "Une erreur réseau a été rencontrée lors de la mise à jour des commandes.",
                            });
                          },
                        );
                    }
                    // Lancement du convoi dans fourmizzz
                    $("input[name='convoi']").trigger("click");
                  },
                  (jqXHR, textStatus, errorThrown) => {
                    $.toast({
                      ...TOAST_ERROR,
                      text: "Une erreur réseau a été rencontrée lors de la mise à jour des commandes.",
                    });
                  },
                );
            },
            (jqXHR, textStatus, errorThrown) => {
              $.toast({
                ...TOAST_ERROR,
                text: "Une erreur réseau a été rencontrée lors de l'enregistrement de votre convoi.",
              });
            },
          );
          $("#o_idCommande").val("-1");
        }
      });
    $("#o_resetConvoi").click((e) => {
      e.preventDefault();
      $(
        "#pseudo_convoi, #input_nbNourriture, #input_nbMateriaux, #input_nbOuvriere, #o_idCommande",
      ).val("");
      return false;
    });
    return this;
  }
}
