/*
 * Util.js
 * Hraesvelg
 **********************************************************************/

/**
 * Données globales du projet, de fourmizzz et des fonctions utilisables partout dans le code.
 *
 * @class Utils
 */
class Utils {
  /**
   * Renvoie le serveur sur lequel joue le joueur.
   *
   * @static
   * @method serveur
   * @return {String} le serveur en cours.
   */
  static get serveur() {
    return location.hostname.split(".")[0].toUpperCase();
  }
  /**
   *
   */
  static get alliance() {
    return $("#tag_alliance").text();
  }
  /**
   * Renvoie si le joueur à du compte plus.
   *
   * @static
   * @method comptePlus
   * @return {Boolean} Vrai si le joueur a du compte plus, faux sinon.
   */
  static get comptePlus() {
    return $("#menuComptePlus a.boutonStatJoueur").length &&
      $("#menuComptePlus a.boutonStatJoueur").text() == "Stat"
      ? true
      : false;
  }
  /**
   * Renvoie le terrain du joueur en cm².
   *
   * @static
   * @method tag
   * @return {Integer} le de nombre de cm².
   */
  static get terrain() {
    return parseInt($("#quantite_tdc").text());
  }
  /**
   * Renvoie le nombre d'ouvrières.
   *
   * @static
   * @method ouvrieres
   * @return {Integer} le nombre d'ouvriére.
   */
  static get ouvrieres() {
    return parseInt($("#nb_ouvrieres").text());
  }
  /**
   * Renvoie le nombre de nourritures en stock dans l'entrepot.
   *
   * @static
   * @method nourriture
   * @return {Integer} le quantité de nourritures.
   */
  static get nourriture() {
    return parseInt($("#nb_nourriture").text());
  }
  /**
   * Renvoie le nombre de materiaux en stock dans l'entrepot.
   *
   * @static
   * @method materiaux
   * @return {Integer} le quantité de materiaux.
   */
  static get materiaux() {
    return parseInt($("#nb_materiaux").text());
  }
  /**
   * Calcul des quantités de ressources commandées - fdthierry
   */
  static calculQuantite(evo_commande) {
    switch (true) {
      // cas Champi
      case evo_commande == 0:
        return [
          0,
          COUT_CONSTUCTION[evo_commande] *
            Math.pow(1.85, monProfil.niveauConstruction[evo_commande]),
        ];
      // cas construction
      case evo_commande > 0 && evo_commande < 13:
        return [
          0,
          COUT_CONSTUCTION[evo_commande] * Math.pow(2, monProfil.niveauConstruction[evo_commande]),
        ];
      // cas recherche
      case evo_commande >= 13 && evo_commande < 23:
        return [
          COUT_RECHERCHE_POM[evo_commande - 13] *
            Math.pow(2, monProfil.niveauRecherche[evo_commande - 13]),
          COUT_RECHERCHE_BOI[evo_commande - 13] *
            Math.pow(2, monProfil.niveauRecherche[evo_commande - 13]),
        ];
      default:
        return [0, 0];
    }
  }
  /**
   *
   */
  static arrondiQuantite(val) {
    if (val > 10000000000) return Math.floor(val / 1000000000) * 1000000000;
    if (val > 10000000) return Math.floor(val / 1000000) * 1000000;
    if (val > 1000) return Math.floor(val / 1000) * 1000;
    return val;
  }
  /**
   * Formate un nombre entier en temps.
   *
   * @static
   * @method intToTime
   * @param {Integer} val
   * @return {String} La chaine formatée.
   */
  static intToTime(val) {
    return val
      ? moment
          .duration(val, "s")
          .format("Y[A ]d[J ]h[h ]m[m ]s[s]")
          .split(" ")
          .filter((elt) => {
            return parseInt(elt);
          })
          .join(" ")
      : "0 sec";
  }
  /**
   * Convertit une chaine de caractere en entier.
   *
   * @static
   * @method timeToInt
   * @param {String} val
   * @return {Integer} le nombre de seconde correspondant la chaine.
   */
  static timeToInt(val) {
    let regexp = new RegExp("((\\d+)J ?)?\s*((\\d+)h ?)?\s*((\\d+)m ?)?\s*((\\d+)s)?\s*", "i"),
      duree = 0,
      sec,
      minute,
      heure,
      jour;
    if ((sec = val.replace(regexp, "$8"))) duree += ~~sec;
    if ((minute = val.replace(regexp, "$6"))) duree += ~~minute * 60;
    if ((heure = val.replace(regexp, "$4"))) duree += ~~heure * 3600;
    if ((jour = val.replace(regexp, "$2"))) duree += ~~jour * 86400;
    return duree;
  }
  /**
   * Arrondie un temps à la minute.
   *
   * @static
   * @method roundMinute
   * @param {Object} temps
   * @return {Object} temps à arrondi a la minute supérieur.
   */
  static roundMinute(temps) {
    return moment().add(temps, "s").add(1, "minute").startOf("minute");
  }
  /**
   * Sur construction.php / laboratoire.php, remplace les blocs natifs
   * `<strong>…</strong><br><small>…</small>` qui annoncent les évolutions
   * en cours par un petit tableau récap (Nom / Temps restant / Terminé le
   * / Annuler).
   *
   * Le span de countdown natif est *déplacé* dans la nouvelle cellule, pas
   * recréé, pour que le `setTimeout` natif de Fourmizzz (cf. fonction `reste()`
   * du jeu) continue à mettre l'élément à jour en temps réel — il accède le
   * span par son ID, qui reste valide tant qu'il est dans le DOM.
   *
   * @static
   * @method tableauEvolution
   * @param {String} typeLabel Texte de l'entête de la 1re colonne (ex. "Recherche").
   * @param {String} [sectionH2] Texte du h2 affiché au-dessus du tableau
   *                             (ex. "Construction" / "Laboratoire"). Omis = pas de h2.
   */
  static tableauEvolution(typeLabel, sectionH2) {
    let $strongs = $("#centre > strong");
    if (!$strongs.length) return;
    // `tableau_leger` = classe native Fourmizzz utilisée par le tableau des
    // pontes sur Reine.php — donne le même look visuel que le récap ponte.
    let $table = $(
      `<table id='o_evolutionEnCours' class='tableau_leger o_maxWidth' cellspacing='0'>
        <caption class='gras left'>${typeLabel}(s) en cours:</caption>
        <thead><tr>
          <th class='left'>${typeLabel}</th>
          <th>Temps restant</th>
          <th>Terminé le</th>
          <th></th>
        </tr></thead>
        <tbody></tbody>
      </table>`,
    );
    // Container caché pour les spans natifs : la chaîne setTimeout du jeu
    // les met à jour via getElementById, on les déplace ici pour qu'elle
    // continue à tourner sans erreur (au lieu de les supprimer avec le strong
    // → null.innerHTML → throw). Le contenu de ces spans n'est plus affiché.
    let $hidden = $("#o_resteHidden");
    if (!$hidden.length)
      $hidden = $("<div id='o_resteHidden' style='display:none'></div>").appendTo("body");
    $strongs.each((_, elt) => {
      let $strong = $(elt),
        $nativeSpan = $strong.children("span").first(),
        $link = $strong.children("a").last(),
        // `.clone()` puis `.children().remove()` pour récupérer le préfixe
        // "- Name level (terminé|se termine) dans:" sans contaminer avec le
        // contenu du <script> inline (sinon `.text()` récursif renvoie le
        // body du script, ex. `reste(22, "batiment_…");`)
        $cloneText = $strong.clone(),
        scriptText = $strong.children("script").text(),
        secMatch = scriptText.match(/reste\((\d+),/),
        seconds = secMatch ? parseInt(secMatch[1]) : 0,
        endDate = Utils.roundMinute(seconds).format("D MMM YYYY à HH[h]mm");
      $cloneText.children().remove();
      // Construction = "...se termine dans :" ; Recherche = "...terminé dans:".
      let name = $cloneText
        .text()
        .replace(/^\s*-\s*/, "")
        .replace(/\s+(?:terminé|se\s+termine).*$/i, "")
        .trim();
      // On déplace le span natif dans le container caché (préserve l'ID) et
      // on monte notre propre span avec un format compact via Utils.intToTime.
      $nativeSpan.appendTo($hidden);
      let toolzzzId = "o_evoTime_" + ($nativeSpan.attr("id") || Date.now());
      let $row = $(
        `<tr>
          <td class='left'>${name}</td>
          <td><span id='${toolzzzId}'>${Utils.intToTime(seconds)}</span></td>
          <td class='reduce'>${endDate}</td>
          <td></td>
        </tr>`,
      );
      if ($link.length) $row.find("td:last").append($link);
      $table.find("tbody").append($row);
      // Countdown isolated-world, basé sur `Date.now()` pour ne pas dériver.
      let start = Date.now();
      let intervalId = setInterval(() => {
        let $el = $("#" + toolzzzId);
        if (!$el.length) {
          clearInterval(intervalId);
          return;
        }
        let remaining = seconds - Math.floor((Date.now() - start) / 1000);
        if (remaining <= 0) {
          $el.text("0s");
          clearInterval(intervalId);
          return;
        }
        $el.text(Utils.intToTime(remaining));
      }, 1000);
    });
    let $first = $strongs.first();
    if (sectionH2) $first.before(`<h2 class='o_marginT15 o_evolutionH2'>${sectionH2}</h2>`);
    $first.before($table);
    // Cleanup : retire les <strong>, <small> et <br> entre la table et le
    // séparateur natif `.Bas` (qui marque la fin de la zone évolutions).
    $first.nextUntil(".Bas").addBack().filter("strong, small, br").remove();
    // Sur la page de confirmation d'annulation, Fourmizzz ajoute :
    //  - non-C+ : un `<p>` contenant strong+Je confirme (tout dans le même p).
    //  - C+ : un `<p>` contenant juste strong, et `<a>Je confirme</a>` en
    //    sibling direct de #centre. Notre `<a>Retour</a>` (cf. confirmationAnnuler)
    //    est ajouté juste après "Je confirme", donc aussi sibling en C+.
    // On déplace le tout sous le tableau. DocumentFragment pour préserver
    // l'ordre DOM (jQuery `.after()` avec une collection insère en reverse).
    let $warning = $("#centre > p").has("strong");
    if ($warning.length) {
      let $confAnnuler = $("#centre > a[href*='confAnnuler']"),
        $retour = $confAnnuler.next("a"),
        $wrapper = $("<div class='o_annulationGroup'></div>");
      // En C+, "Je confirme" + "Retour" sont siblings du `<p>` (qui ne contient
      // que le `<strong>` + un `<br>`). On les déplace DANS le `<p>` pour
      // qu'ils restent collés au texte — sinon le `margin-bottom` natif du
      // `<p>` crée un gap entre le warning et les liens. En non-C+, les liens
      // sont déjà dans le `<p>`, donc $confAnnuler.length = 0 → no-op.
      if ($confAnnuler.length) $warning.append(" ", $confAnnuler[0], " ", $retour[0]);
      $wrapper[0].appendChild($warning[0]);
      $table.after($wrapper);
    }
  }
  /**
   * Sur la page de confirmation d'annulation d'une recherche ou construction
   * (`?confAnnuler=ID&t=TOKEN`), ajoute un lien "Retour" à côté du "Je confirme"
   * natif (sinon l'utilisateur n'a aucun moyen évident de revenir en arrière)
   * et nettoie l'URL via `history.replaceState` pour qu'un Ctrl+R ramène sur
   * la page normale au lieu de re-afficher la confirmation.
   *
   * @static
   * @method confirmationAnnuler
   * @param {String} retourUrl URL de retour (ex. "construction.php").
   */
  static confirmationAnnuler(retourUrl) {
    let $confirmer = $("a:contains('Je confirme')");
    if (!$confirmer.length) return;
    $confirmer.after(
      ` <a href='${retourUrl}' class='o_retourAnnuler' style='margin-left:12px;'>Retour</a>`,
    );
    if (location.search.includes("confAnnuler")) history.replaceState({}, "", retourUrl);
  }
  /**
   * Decremente un chrono dynamique toutes les secondes.
   *
   * @static
   * @method decreaseTime
   * @param {Integer} time
   * @param {String} id
   * @return L'affichage du contenue de l'id est decrementé d'une seconde.
   */
  static decreaseTime(time, id) {
    $("#" + id).text(this.intToTime(time));
    if (time > 0)
      setTimeout(() => {
        Utils.decreaseTime(time - 1, id);
      }, 1000);
  }
  /**
   * Incremente un chrono dynamique toutes les secondes.
   *
   * @static
   * @method incrementTime
   * @param {Integer} time
   * @param {String} id
   * @param {String} idRound
   * @return L'affichage du contenue de l'id est incrementé d'une seconde.
   */
  static incrementTime(time, id, idRound = "") {
    let retour = moment().add(time, "s");
    $("#" + id).text(retour.format("D MMM à HH[h]mm[m]ss[s]"));
    if (idRound && retour.seconds() % 60 == 0)
      $("#" + idRound).text(Utils.roundMinute(time).format("D MMM à HH[h]mm"));
    setTimeout(() => {
      Utils.incrementTime(time, id, idRound);
    }, 1000);
  }
  /**
   * Réduit la taille d'une chaine de caractére qui représente une durée.
   *
   * @static
   * @method shortcutTime
   * @param {String} time
   * @return {String} La chaine coupée.
   */
  static shortcutTime(time) {
    let tmp = this.intToTime(time).split(" ");
    if (tmp.length > 4) return tmp.splice(0, tmp.length - 3).join(" ");
    else if (tmp.length > 3) return tmp.splice(0, tmp.length - 2).join(" ");
    else if (tmp.length > 2) return tmp.splice(0, tmp.length - 1).join(" ");
    else return tmp.join(" ");
  }
  /**
   * Extrait les paramétres d'une URL.
   *
   * @static
   * @method extractUrlParams
   * @return {Array} La liste associatives des paramétres.
   */
  static extractUrlParams() {
    let f = new Array(),
      t = location.search.substring(1).split("&");
    if (t != "") {
      for (let elt of t) {
        let x = elt.split("=");
        f["" + x[0]] = "" + x[1];
      }
    }
    return f;
  }
  /**
   *
   */
  static extraitRecherche(data, joueur = true, alliance = true) {
    let element = new Array(),
      cptJ = alliance ? 3 : 6,
      cptA = joueur ? 3 : 6;
    // si la recherche renvoi ne renvoi qu'un resultat on tombe sur un profil de joueur
    if ($(data).find("h2").length) {
      let pseudo = $(data).find("h2").text();
      element.push({ value: pseudo, value_avec_html: pseudo, url: "Membre.php?Pseudo=" + pseudo });
    } else {
      $(data)
        .find(".simulateur:eq(0) tr")
        .each((i, elt) => {
          // les joueurs et les alli ont 6 cellules
          if ($(elt).find("td").length == 6) {
            let cellule = $(elt).find("td:eq(1) a"),
              lien = cellule.attr("href"),
              nom = cellule.text();
            // c'est un joueur si on trouve un lien de profil cellule 2
            if (joueur && lien.includes("Membre.php") && cptJ) {
              element.push({ value: nom, value_avec_html: nom, url: "Membre.php?Pseudo=" + nom });
              cptJ--;
            }
            // c'est une alliance
            if (alliance && lien.includes("classementAlliance.php") && cptA) {
              let tag = $(elt).find("td:eq(0)").text();
              element.push({
                value: nom,
                value_avec_html: `<span style="white-space:nowrap;"><strong>${tag}</strong> ${nom}</span>`,
                tag: tag,
                url: "classementAlliance.php?alliance=" + tag,
              });
              cptA--;
            }
          }
        });
    }
    return element;
  }
  /**
   * Parse une chaîne HTML reçue d'une page Fourmizzz sans exécuter ses scripts
   * inline. À utiliser à la place de `$("<div/>").append(html)` qui, sur Chrome,
   * exécute les `<script>` du HTML reçu et propage leurs ReferenceError jusqu'à
   * casser la suite du callback (cf. `envoyerFlood` / `_mfEnvoyerAttaqueSuivante`).
   *
   * @static
   * @method parseHtml
   * @param {String} html
   * @return {jQuery} wrapper jQuery du `<body>` parsé, prêt pour `.find()`.
   */
  static parseHtml(html) {
    return $(new DOMParser().parseFromString(html, "text/html").body);
  }
}
