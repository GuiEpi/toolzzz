/*
 * Util.js
 * Hraesvelg
 **********************************************************************/

/**
 * Comptes à rebours en cours (cf. Utils.decreaseTime) : id de l'élément →
 * {fin (timestamp ms), format, chaqueSeconde, aZero}.
 */
const COMPTES_A_REBOURS = {};
let intervalleComptesARebours = null;

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
   * AntLeaks ne référence que le serveur s4 : ailleurs, ses liens mèneraient
   * à des joueurs/alliances homonymes d'un autre serveur.
   *
   * @static
   * @method antleaksDisponible
   * @return {Boolean}
   */
  static get antleaksDisponible() {
    return Utils.serveur === "S4";
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
   * Formate un nombre en version courte : 950, 12,3k, 1,5M, 2G, 3,2T, puis P et
   * E, que numeral ne connaît pas (il afficherait 1000T).
   *
   * @static
   * @method nombreCourt
   * @param {Number} val
   * @return {String} La chaine formatée.
   */
  static nombreCourt(val) {
    if (Math.abs(val) >= 1e18) return numeral(val / 1e18).format("0.[0]") + "E";
    if (Math.abs(val) >= 1e15) return numeral(val / 1e15).format("0.[0]") + "P";
    return numeral(val).format("0.[0]a");
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
    if (!val) return "0 sec";
    let temps = moment
      .duration(val, "s")
      .format("Y[A ]d[J ]h[h ]m[m ]s[s]")
      .split(" ")
      .filter((elt) => {
        return parseInt(elt);
      })
      .join(" ");
    // Sous la seconde (une unité rapide avec un haut niveau de ponte) tous les
    // morceaux valent 0 et sont filtrés, ce qui laissait le temps de ponte vide.
    return temps || numeral(val).format("0.[00]") + "s";
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
    let toastErrors = [],
      validRows = 0;
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
        secMatch = scriptText.match(/reste\((\d+),/);
      $cloneText.children().remove();
      // Pas de chrono `reste(N, …)` = ce n'est pas une évolution réelle mais
      // un message d'erreur du jeu (ex. "Prerequis non valide." quand la file
      // d'attente C+ tente de lancer une construction dont les prérequis ne
      // sont pas remplis). On évite la ligne 0s/maintenant dans le tableau,
      // on relaye le texte en toast à la fin.
      if (!secMatch) {
        let errText = $cloneText
          .text()
          .replace(/^\s*-\s*/, "")
          .trim();
        if (errText) toastErrors.push(errText);
        return;
      }
      let seconds = parseInt(secMatch[1]),
        endDate = Utils.roundMinute(seconds).format("D MMM YYYY à HH[h]mm");
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
      // Native `appendChild` (au lieu de jQuery `.append()`) pour bypass
      // `domManip` qui collecte les `<script>` descendants et les passe à
      // `DOMEval` → bloqué par la CSP MV3 de l'extension. Le `<a>Annuler</a>`
      // natif est juste déplacé, son flag HTML "already-started" est préservé.
      if ($link.length) $row.find("td:last")[0].appendChild($link[0]);
      $table.find("tbody")[0].appendChild($row[0]);
      validRows++;
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
    // Cas "que des erreurs" (typique : file d'attente C+ qui échoue alors qu'il
    // n'y a rien en construction) → pas de h2 ni de tableau vide, juste le toast.
    if (validRows) {
      if (sectionH2) $first.before(`<h2 class='o_marginT15 o_evolutionH2'>${sectionH2}</h2>`);
      // Native `insertBefore` : $table contient le `<a>Annuler</a>` natif déplacé
      // ; un append jQuery scanne ses descendants pour `DOMEval` → bloqué par CSP.
      $first[0].parentNode.insertBefore($table[0], $first[0]);
    }
    // Cleanup : retire les <strong>, <small> et <br> entre la table et le
    // séparateur natif `.Bas` (qui marque la fin de la zone évolutions).
    $first.nextUntil(".Bas").addBack().filter("strong, small, br").remove();
    // Dedup du toast : le serveur garde le message d'erreur ~2 min sur la page.
    // Sur un simple reload (F5) on évite de re-spam le toast tant que le même
    // message est encore là. En revanche pour toute autre navigation (clic
    // "Construire", clic dans le menu…), on considère que l'utilisateur a
    // agi et qu'il faut le notifier à nouveau si l'erreur persiste.
    let toastKey = "o_evoErrSeen_" + location.pathname;
    if (toastErrors.length) {
      let signature = toastErrors.join("|"),
        navType = performance.getEntriesByType("navigation")[0]?.type,
        skip = navType === "reload" && sessionStorage.getItem(toastKey) === signature;
      sessionStorage.setItem(toastKey, signature);
      if (!skip) $.toast({ ...TOAST_WARNING, text: toastErrors.join("<br>") });
    } else {
      sessionStorage.removeItem(toastKey);
    }
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
      if ($confAnnuler.length) {
        $warning[0].appendChild(document.createTextNode(" "));
        $warning[0].appendChild($confAnnuler[0]);
        $warning[0].appendChild(document.createTextNode(" "));
        $warning[0].appendChild($retour[0]);
      }
      $wrapper[0].appendChild($warning[0]);
      // Native insertion : $wrapper porte le `<strong>` natif qui contient un
      // `<script>reste(…)>` inline → un append jQuery déclencherait `DOMEval`,
      // bloqué par CSP MV3.
      $table[0].parentNode.insertBefore($wrapper[0], $table[0].nextSibling);
    }
  }
  /**
   * Préserve le scrollY à travers une navigation aller-retour sur la même page
   * (ex: clic "Construire" prereq invalide → POST → 302 → on revient en haut).
   * Pose un listener `pagehide` pour sauver la position, et retourne la
   * position à restaurer si elle est récente (< 5s).
   *
   * Le caller doit appeler `window.scrollTo(0, y)` APRÈS ses manipulations DOM
   * (tableauEvolution insère un tableau au début de #centre et décale le
   * contenu) — d'où le pattern : on récupère la valeur tôt, on l'applique tard.
   *
   * @static
   * @method preserveScroll
   * @param {String} key Clé sessionStorage unique pour la page (ex. "o_constructionScroll").
   * @returns {Number|null} ScrollY à restaurer, ou null si rien à restaurer.
   */
  static preserveScroll(key) {
    let saved = sessionStorage.getItem(key);
    sessionStorage.removeItem(key);
    let y = null;
    if (saved) {
      let parsed = JSON.parse(saved);
      if (Date.now() - parsed.t < 5000) y = parsed.y;
    }
    window.addEventListener("pagehide", () => {
      sessionStorage.setItem(key, JSON.stringify({ y: window.scrollY, t: Date.now() }));
    });
    return y;
  }
  /**
   * Production par jour, lue dans le tooltip du terrain de la boite info
   * (ligne « Total par Jour ») : le jeu l'écrit dans un script de la page.
   *
   * @static
   * @method productionParJour
   * @return {Object|null} {nourriture, materiaux}, null si introuvable
   */
  static productionParJour() {
    let script = $("script")
        .toArray()
        .map((s) => s.textContent)
        .find((t) => t.includes("#boite_info_tdc") && t.includes("Total par Jour")),
      contenu = script && script.match(/content:\s*"((?:[^"\\]|\\.)*)"/);
    if (!contenu) return null;
    let ligne = $("<div>")
        .html(JSON.parse(`"${contenu[1]}"`).replace(/<img\b[^>]*>/gi, ""))
        .find("tr")
        .filter((i, tr) => $(tr).text().includes("Total par Jour")),
      valeur = (i) =>
        parseInt(
          ligne
            .find(`td:eq(${i})`)
            .text()
            .replace(/[^\d-]/g, ""),
        ) || 0;
    return ligne.length ? { nourriture: valeur(1), materiaux: valeur(2) } : null;
  }
  /**
   * Sous le coût des constructions et recherches trop chères, indique dans
   * combien de temps les ressources suffiront au rythme de production actuel.
   *
   * @static
   * @method delaiRessources
   */
  static delaiRessources() {
    // le Compte+ affiche déjà ce délai
    if (Utils.comptePlus) return;
    let production = Utils.productionParJour();
    if (production) Utils._afficherDelais(production);
    // sur mobile, le jeu n'envoie pas le tooltip : on lit la page Ressources
    else
      $.ajax({ url: location.origin + "/Ressources.php" }).then((html) => {
        let p = Utils.productionRessources(html);
        if (p) Utils._afficherDelais(p);
      });
  }
  /**
   * Production par jour calculée depuis la page Ressources, comme son script
   * le fait dans le navigateur (le serveur envoie des 0 à la place des
   * récoltes) : ouvrières des champs « Récoltes » × rendement, plus la
   * champignonnière, moins la consommation de l'armée et le pillage d'un
   * éventuel maître.
   *
   * @static
   * @method productionRessources
   * @param {String} html page Ressources.php
   * @return {Object|null} {nourriture, materiaux}, null si introuvable
   */
  static productionRessources(html) {
    // les séparateurs de milliers varient (espace, insécable…) : on ne garde que les chiffres
    let entier = (t) => parseInt(String(t).replace(/\D/g, "")) || 0,
      variable = (regex) => {
        let m = html.match(regex);
        return m ? parseFloat(m[1]) : null;
      },
      page = Utils.parseHtml(html),
      rendement = variable(/sommeN\s*=\s*sommeN\s*\*\s*([\d.]+)/),
      consommation = page
        .find("#nbNourriture")
        .closest("p")
        .text()
        .match(/armée consomme\s*(\d[\d\s]*)/);
    if (!rendement || !page.find("#RecolteNourriture").length) return null;
    let nourriture = entier(page.find("#RecolteNourriture").val()) * rendement,
      materiaux = entier(page.find("#RecolteMateriaux").val()) * rendement,
      champi = variable(/var champi\s*=\s*([\d.]+)/) || 0,
      pillage = variable(/var pourcentagePillage\s*=\s*([\d.]+)/) || 0;
    return {
      nourriture:
        nourriture +
        champi -
        (consommation ? entier(consommation[1]) : 0) -
        Math.floor((pillage * (nourriture + champi)) / 100),
      materiaux: materiaux - Math.floor((pillage * materiaux) / 100),
    };
  }
  /**
   * Affiche les délais, une fois la production connue.
   *
   * @private
   * @static
   * @method _afficherDelais
   * @param {Object} production {nourriture, materiaux} par jour
   */
  static _afficherDelais(production) {
    let stock = (icone) =>
        numeral(
          $(`#tableau_boite_info .${icone}`).siblings(".texte_ligne_boite_info").text(),
        ).value(),
      ressources = {
        nourriture: {
          stock: stock("icone_nourriture_boite_info"),
          capacite: coutsCapaEntrepot(monProfil.niveauConstruction[1]),
        },
        materiaux: {
          stock: stock("icone_materiaux_boite_info"),
          capacite: coutsCapaEntrepot(monProfil.niveauConstruction[2]),
        },
      },
      // au Laboratoire, les icônes du jeu sont décalées dans leur cellule : le
      // bloc s'aligne sur la première plutôt que sur le bord du tableau
      aligner = (cellule) => {
        let bloc = cellule.find(".o_delaiRessources"),
          icone = cellule.find("table img").first();
        if (icone.length)
          bloc.css("margin-left", Math.max(0, icone.offset().left - bloc.offset().left));
        return bloc;
      };
    $(".ligneAmelioration .cout_amelioration").each((i, elt) => {
      // un prérequis manque : les ressources ne suffiront pas à la lancer
      if ($(elt).closest(".ligneAmelioration").find(".verificationNonOK").length) return;
      let secondes = 0,
        message = "",
        manques = [];
      for (let nom in ressources) {
        let cout = numeral($(elt).find(`.${nom}`).text()).value(),
          r = ressources[nom];
        if (!cout || r.stock == null || cout <= r.stock) continue;
        if (monProfil.niveauConstruction[nom == "nourriture" ? 1 : 2] >= 0 && cout > r.capacite)
          message = `Entrepôt de ${nom == "nourriture" ? "nourriture" : "matériaux"} trop petit`;
        else if (production[nom] <= 0) message ||= "Jamais au rythme de production actuel";
        else {
          let attente = ((cout - r.stock) / production[nom]) * 86400;
          manques.push({ nom: nom, cout: cout, stock: r.stock, prod: production[nom], attente });
          secondes = Math.max(secondes, attente);
        }
      }
      if (message) {
        $(elt)
          .find("table")
          .first()
          .append(
            `<tr><td colspan='2'><div class='o_delaiRessources o_delaiBloque reduce'>${message}</div></td></tr>`,
          );
        aligner($(elt));
        return;
      }
      if (!secondes) return;
      let id = `o_delaiRessources${i}`,
        jauges = manques
          .map(
            (m) =>
              `<tr class='${m.attente == secondes ? "gras" : ""}'><td>${m.nom == "nourriture" ? IMG_POMME : IMG_MAT}</td><td><div class='o_delaiJauge'><div class='o_delaiJauge_${m.nom}'></div></div></td><td class='o_delaiPct right'></td></tr>`,
          )
          .join("");
      $(elt)
        .find("table")
        .first()
        .append(
          `<tr><td colspan='2'><div class='o_delaiRessources reduce' title='Estimation selon la production du jour (tooltip du terrain), qui varie avec le terrain et l’armée'>
          <table>${jauges}</table>
          <div><img src='/images/icone/horloge.png' alt='Délai :' class='o_vAlign'/> <span id='${id}'></span></div>
          <div class='o_delaiDate'>${Utils.roundMinute(secondes).format("D MMM HH[h]mm")}</div>
        </div></td></tr>`,
        );
      let debut = Date.now(),
        bloc = aligner($(elt));
      // les jauges se remplissent au rythme de la production
      const remplir = () => {
        let ecoule = (Date.now() - debut) / 1000;
        bloc.find("tr").each((j, tr) => {
          let m = manques[j],
            pct = Math.min(100, ((m.stock + (m.prod * ecoule) / 86400) / m.cout) * 100);
          $(tr).find(".o_delaiJauge div").css("width", `${pct}%`);
          $(tr)
            .find(".o_delaiPct")
            .text(`${Math.floor(pct)} %`);
        });
      };
      remplir();
      Utils.decreaseTime(Math.ceil(secondes), id, {
        format: (reste) => Utils.intToTime(reste > 3600 ? Math.ceil(reste / 60) * 60 : reste),
        chaqueSeconde: remplir,
        aZero: () => bloc.addClass("o_delaiPret").html("✔ Ressources disponibles"),
      });
    });
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
   * Compte à rebours dans l'élément id. Le temps restant est recalculé depuis
   * l'heure de fin à chaque tick (et au retour sur l'onglet) : un onglet en
   * arrière-plan, où le navigateur espace les timers, ou une mise en veille
   * ne le font pas dériver. Un seul intervalle sert tous les comptes, et
   * relancer un compte sur le même id remplace le précédent au lieu de
   * l'empiler.
   *
   * @static
   * @method decreaseTime
   * @param {Number} time secondes restantes
   * @param {String} id
   * @param {Object} options
   *   - format(secondes) : texte affiché, Utils.intToTime par défaut
   *   - chaqueSeconde(secondes) : appelé à chaque mise à jour
   *   - aZero() : appelé une fois le compte arrivé à 0 (s'il ne l'était pas au départ)
   */
  static decreaseTime(time, id, options = {}) {
    COMPTES_A_REBOURS[id] = { ...options, fin: Date.now() + time * 1000 };
    if (time <= 0) delete COMPTES_A_REBOURS[id].aZero;
    if (intervalleComptesARebours === null) {
      intervalleComptesARebours = setInterval(Utils.majComptesARebours, 1000);
      document.addEventListener("visibilitychange", () => {
        if (!document.hidden) Utils.majComptesARebours();
      });
    }
    Utils.majComptesARebours();
  }
  /**
   * Arrête le compte à rebours de l'élément id (le texte reste en place).
   *
   * @static
   * @method arreterTime
   * @param {String} id
   */
  static arreterTime(id) {
    delete COMPTES_A_REBOURS[id];
  }
  /**
   * Met à jour tous les comptes à rebours ; ceux à 0 ou dont l'élément a
   * disparu sont retirés.
   *
   * @static
   * @method majComptesARebours
   */
  static majComptesARebours() {
    for (let id in COMPTES_A_REBOURS) {
      let compte = COMPTES_A_REBOURS[id],
        elt = document.getElementById(id);
      if (!elt) {
        delete COMPTES_A_REBOURS[id];
        continue;
      }
      let reste = Math.max(0, Math.ceil((compte.fin - Date.now()) / 1000));
      elt.textContent = compte.format ? compte.format(reste) : Utils.intToTime(reste);
      if (compte.chaqueSeconde) compte.chaqueSeconde(reste);
      if (!reste) {
        delete COMPTES_A_REBOURS[id];
        if (compte.aZero) compte.aZero();
      }
    }
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
   * Coordonnées d'un joueur lues sur sa page de profil (lien « x=.. et y=.. »
   * vers la carte). Le lien mène à carte2.php sur s4 mais à carte.php sur s5 :
   * on accepte les deux.
   *
   * @static
   * @method coordonnees
   * @param {jQuery} page la page de profil, ou un conteneur qui la contient
   * @return {Object} {x, y}, -1 / -1 si le lien est introuvable
   */
  static coordonnees(page) {
    let m = $(page)
      .find("a[href^='carte2.php?'], a[href^='carte.php?']")
      .first()
      .text()
      .match(/x=(\d+) et y=(\d+)/);
    return m ? { x: parseInt(m[1]), y: parseInt(m[2]) } : { x: -1, y: -1 };
  }
  /**
   * Page de la carte sur le serveur courant, lue dans le menu du jeu :
   * carte2.php sur s4, carte.php sur s5.
   *
   * @static
   * @method pageCarte
   * @return {String}
   */
  static get pageCarte() {
    return $("a[href='carte.php']").length && !$("a[href='carte2.php']").length
      ? "carte.php"
      : "carte2.php";
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
