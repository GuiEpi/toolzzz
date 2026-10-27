/*
 * Chat.js
 * Hraesvelg
 **********************************************************************/

/**
 * Classe de fonction pour les chats.
 *
 * @class PageChat
 * @constructor
 */
class PageChat {
  constructor() {
    /**
     * Compteur pour l'autoactualisation
     */
    this._timeoutChat = -1;
  }
  /**
   *
   */
  executer() {
    // fonction plus
    if (!Utils.comptePlus) this.plus();
    // Couleur du texte
    this.couleur();
    // Sélecteur de GIF, en Compte+ aussi
    this.gif();
    // Reaffichage message
    this.afficheMessage();
    // Modification pour l'envoie du formulaire
    $("#message").on("keypress", (e) => {
      let code = e.keyCode || e.which;
      if (code == 13) this.parserMessage();
    });
    $("input[name='Envoyer']").click((e) => {
      this.parserMessage();
    });
    return this;
  }
  /**
   * Change l'apparance de l'affichage des messages, "Pseudo (datetime) :" au lieu de "datetime pseudo :"
   *
   * @private
   * @method afficheMessage
   */
  afficheMessage() {
    // ajoute du cite sur les anciens messages
    $("#anciensMessages p, #nouveauxMessages p").each((i, elt) => {
      $(elt).html((i, html) => {
        let nth = 0;
        return html.replace(/:/g, (match, j) => {
          nth++;
          return nth == 3
            ? ` <span id="o_cite${$(elt).attr("id")}" class="reduce souligne cursor">citer</span> :`
            : match;
        });
      });
    });
    // event sur les anciens message
    $("span[id^='o_cite']").click((e) => {
      let texte = this.citerMessage(e);
      texte.length && $("#message").val(`[i]${texte}[/i] // `).focus();
    });
    // ajotu du cite pour les nouveaux messages
    $("#nouveauxMessages").on("DOMNodeInserted", (e) => {
      let element = $(e.target);
      if (element.is("p") && !element.hasClass("o_parsed")) {
        $(element).addClass("o_parsed");
        element.html((i, html) => {
          let nth = 0;
          return html.replace(/:/g, (match, i) => {
            nth++;
            return nth == 3
              ? ` <span id="o_cite${element.attr("id")}" class="reduce souligne cursor">citer</span> :`
              : match;
          });
        });
        $(`#o_cite${element.attr("id")}`).click((e) => {
          let texte = this.citerMessage(e);
          texte.length && $("#message").val(`[i]${texte}[/i] // `).focus();
        });
      }
    });
    // ajout de l'event lorsqu'on actualise et que les nouveaux messages passent en anciens messages
    $("#anciensMessages").on("DOMNodeInserted", (e) => {
      $("span[id^='o_cite']")
        .off()
        .click((e) => {
          let texte = this.citerMessage(e);
          texte.length && $("#message").val(`[i]${texte}[/i] // `).focus();
        });
    });
    return this;
  }
  /**
   *
   */
  getMessage() {
    return $.ajax({
      url: "appelAjax.php",
      data:
        "actualiserChat=" +
        ($(".titre:first").text().includes("Alliance") ? "alliance" : "general"),
    });
  }
  /**
   * Ajoute la Couleur, options de chat.
   *
   * @private
   * @method plus
   */
  plus() {
    // ajout de l'auto actualisation
    $("#actualiser").after(
      " --- <label><input id='o_autoActualiser' type='checkbox' name='autoActualiser'/>auto</label> ",
    );
    $("#o_autoActualiser").change(() => {
      if ($("#o_autoActualiser").prop("checked")) this.actualiserMessage();
      else clearTimeout(this._timeoutChat);
    });
    // Ajout des fonctions de mise en forme
    $("#formulaireChat")
      .append(`<div class='o_group_bouton o_group_bouton_chat'><span id='o_msgUp' class='option_gestion'>aA</span><span id='o_msgDown' class='option_gestion'>Aa</span></div>
            <div class='o_group_bouton o_group_bouton_chat'><span id='o_msgB' class='option_gestion gras' onclick="miseEnForme('message','gras');">B</span><span id='o_msgI' class='option_gestion' onclick="miseEnForme('message','italic');"><em>I</em></span><span id='o_msgU' class='option_gestion' onclick="miseEnForme('message','souligne');" style='text-decoration:underline'>U</span></div>
            <div class='o_group_bouton o_group_bouton_chat'><span id='o_msgImg' class='option_gestion' onclick="miseEnForme('message','img');"><img height='12' src='images/BBCode/picture.png' title='Image' /></span><span id='o_msgLink' class='option_gestion' class='btn' onclick="miseEnForme('message','url');"><img height='12' src='images/BBCode/link.png' title='Lien' /></span><span id='o_msgPlay' class='option_gestion' onclick="miseEnForme('message','player');"><img height='12' src='images/BBCode/membre.gif' title='Pseudo'/></span><span id='o_msgAlly' class='option_gestion' onclick="miseEnForme('message','ally');"><img height='12' src='images/BBCode/groupe.gif' title='Alliance'/></span></div>`);
    $(".o_group_bouton span").css("background-color", monProfil.couleur1);

    $("#o_msgUp").click((e) => {
      e.preventDefault();
      $("#message").val("[size=4]" + $("#message").val() + "[/size]");
      $("#message")[0].selectionStart += 8;
      $("#message")[0].selectionEnd -= 7;
      $("#message").focus();
    });
    $("#o_msgDown").click((e) => {
      e.preventDefault();
      $("#message").val("[size=2]" + $("#message").val() + "[/size]");
      $("#message")[0].selectionStart += 8;
      $("#message")[0].selectionEnd -= 7;
      $("#message").focus();
    });
    $("#o_msgB, #o_msgI, #o_msgU, #o_msgImg, #o_msgLink, #o_msgPlay, #o_msgAlly").click((e) => {
      e.preventDefault();
    });
    // Ajout des emoticone
    $("#listeSmiley20").html(LISTESMILEY1);
    $("#listeSmiley30").html(LISTESMILEY2);
    $("#listeSmiley40").html(LISTESMILEY3);
    $("#listeSmiley50").html(LISTESMILEY4);
    $("#listeSmiley60").html(LISTESMILEY5);
    $("#listeSmiley70").html(LISTESMILEY6);
    // Flèches pour passer d'un pack à l'autre : présentes mais vides hors
    // Compte+ (changerCookiePack est réservé au C+)
    $("#smileyPrecedent0")
      .html(`<img title='Précédent' class='cursor' src='images/bouton/fleche-champs-gauche.gif'/>`)
      .css({ position: "relative", top: "2px" })
      .click((e) => {
        let div = $("#tousLesSmiley0 div:visible");
        div.hide();
        div.prev().length ? div.prev().show() : $("#tousLesSmiley0 div:last").show();
      });
    $("#smileySuivant0")
      .html(`<img title='Suivant' class='cursor' src='images/bouton/fleche-champs-droite.gif'/>`)
      .css({ position: "relative", top: "2px" })
      .click((e) => {
        let div = $("#tousLesSmiley0 div:visible");
        div.hide();
        div.next().length ? div.next().show() : $("#tousLesSmiley0 div:first").show();
      });
  }
  /**
   *
   */
  actualiserMessage(nbTour = 40) {
    if (nbTour) {
      this.getMessage().then(
        (data) => {
          $("#anciensMessages").prepend($("#nouveauxMessages").html());
          $("#nouveauxMessages").html(data.message);
          $("#NonLuMess").html(data.NonLuMess);
          $("#NonLuRapComb").html(data.NonLuRapComb);
          $("#NonLuRapChass").html(data.NonLuRapChass);
        },
        (jqXHR, textStatus, errorThrown) => {
          $.toast({ ...TOAST_ERROR, text: "Mise à jour des messages impossible." });
        },
      );
      this._timeoutChat = setTimeout(() => {
        this.actualiserMessage(--nbTour);
      }, 5000);
    } else $("#o_autoActualiser").prop("checked", false);
    return this;
  }
  /**
   *
   */
  citerMessage(e) {
    let clone = $(e.currentTarget).parent().clone();
    $("span", clone).remove();
    let texte = clone.text();
    if (texte.length > 80) texte = texte.substring(0, 80) + "...";
    return texte;
  }
  /**
   * Parse le message pour convertir les smiley par le bbcode correspondant.
   *
   * @private
   * @method parserMessage
   */
  parserMessage() {
    let color = $("#inputCouleur").val();
    if (color != "000000" && color != "0000000")
      $("#message").val("[color=#" + color + "]" + $("#message").val() + "[/color]");
    return this;
  }
  /**
   * Ajoute/modifie le color picker.
   *
   * @private
   * @method couleur
   */
  couleur() {
    $("#inputCouleur").val(monProfil.parametre["couleurChat"].valeur.substring(1));
    $("#boutonCouleur").remove();
    $("#smileySuivant0").after(
      `<span><input id='color' type='color' name='couleur' value='${monProfil.parametre["couleurChat"].valeur}'/></span>`,
    );
    $("#color").change((e) => {
      let color = e.currentTarget.value;
      $("#inputCouleur").val(color.substring(1));
      monProfil.parametre["couleurChat"].valeur = color;
      monProfil.parametre["couleurChat"].sauvegarde();
    });
  }
  /**
   * Ajoute un bouton GIF qui ouvre un sélecteur Giphy : la recherche part chez
   * Giphy, et le GIF choisi est inséré en [img] pour que tout le monde le voie,
   * extension ou pas.
   *
   * @private
   * @method gif
   */
  gif() {
    if (!GIPHY_API_KEY) return this;
    $("#formulaireChat").append(
      `<div class='o_group_bouton o_group_bouton_chat'><span id='o_msgGif' class='option_gestion gras' title='GIF'>GIF</span></div>
      <div id='o_gif' style='display:none'>
        <input id='o_gifRecherche' type='text' placeholder='Rechercher un GIF…' autocomplete='off'/>
        <div id='o_gifResultats'></div>
        <div class='right'><img src='${chrome.runtime.getURL("images/giphy-powered-by.png")}' alt='Powered by GIPHY' height='21'/></div>
      </div>`,
    );
    $("#o_msgGif").css("background-color", monProfil.couleur1);
    let delai = -1,
      requete = 0;
    // La clé Giphy est partagée par tous les joueurs et limitée en requêtes :
    // les résultats sont gardés une heure, par recherche, dans le navigateur.
    const lireCache = () => {
        try {
          return JSON.parse(localStorage.getItem("outiiil_gifCache")) || {};
        } catch (e) {
          return {};
        }
      },
      afficher = (gifs) =>
        $("#o_gifResultats").html(
          gifs.length
            ? gifs
                .map(
                  (g) =>
                    `<img class='cursor' data-id='${g.id}' src='${g.url}' title='${$("<div>").text(g.titre).html()}'/>`,
                )
                .join("")
            : "<span class='reduce'>Aucun GIF trouvé.</span>",
        ),
      chercher = () => {
        let q = $("#o_gifRecherche").val().trim().toLowerCase(),
          n = ++requete,
          cache = lireCache(),
          params = new URLSearchParams({ api_key: GIPHY_API_KEY, limit: 24, rating: "pg-13" });
        // une ou deux lettres : pas assez pour une recherche utile
        if (q.length && q.length < 3) return;
        if (cache[q] && Date.now() - cache[q].date < 3600000) return afficher(cache[q].gifs);
        if (q) (params.set("q", q), params.set("lang", "fr"));
        fetch(`https://api.giphy.com/v1/gifs/${q ? "search" : "trending"}?${params}`)
          .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
          .then(({ data }) => {
            let gifs = data.map((g) => ({
              id: g.id,
              url: g.images.fixed_height_small.url,
              titre: g.title,
            }));
            cache = lireCache();
            cache[q] = { date: Date.now(), gifs: gifs };
            // on ne garde que les 30 recherches les plus récentes
            Object.keys(cache)
              .sort((x, y) => cache[y].date - cache[x].date)
              .slice(30)
              .forEach((k) => delete cache[k]);
            try {
              localStorage.setItem("outiiil_gifCache", JSON.stringify(cache));
            } catch (e) {}
            // une frappe plus récente a déjà relancé une recherche
            if (n == requete) afficher(gifs);
          })
          .catch((statut) =>
            $.toast({
              ...TOAST_ERROR,
              text:
                statut == 429
                  ? "Trop de recherches de GIF pour le moment, réessaie dans un moment."
                  : "Recherche de GIF impossible.",
            }),
          );
      };
    $("#o_msgGif").click((e) => {
      e.preventDefault();
      $("#o_gif").toggle();
      if ($("#o_gif").is(":visible")) {
        if (!$("#o_gifResultats").children().length) chercher();
        $("#o_gifRecherche").focus();
      }
    });
    $("#o_gifRecherche").on("input", () => {
      clearTimeout(delai);
      delai = setTimeout(chercher, 700);
    });
    // Entrée enverrait le formulaire du chat
    $("#o_gifRecherche").on("keypress", (e) => {
      if ((e.keyCode || e.which) == 13) e.preventDefault();
    });
    $("#o_gifResultats").on("click", "img", (e) => {
      // lien court : les URL de l'API traînent des paramètres de suivi
      let bbcode = `[img]https://media.giphy.com/media/${$(e.currentTarget).data("id")}/200.gif[/img]`,
        message = $("#message")[0],
        debut = message.selectionStart,
        fin = message.selectionEnd;
      message.value = message.value.slice(0, debut) + bbcode + message.value.slice(fin);
      message.selectionStart = message.selectionEnd = debut + bbcode.length;
      $("#o_gif").hide();
      message.focus();
    });
    return this;
  }
  /**
   * Ajoute les emoticones de base pour les non compte+.
   *
   * @private
   * @method emoticone
   */
}
