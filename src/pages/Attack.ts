/*
 * Attaquer.ts
 * Hraesvelg
 **********************************************************************/

import { $, moment, numeral } from "~/vendor";
import { IMG_ATT, IMG_DEF, IMG_HP, FLOOD_METHODS, TOAST_WARNING } from "~/constants";
import { Utils } from "~/lib/Utils";
import { getProfile } from "~/models/currentPlayer";
import { Army } from "~/models/Army";
import { SentAttack } from "~/models/SentAttack";
import { Player } from "~/models/Player";
import * as storage from "~/storage";

/**
 * Classe de fonction pour les pages d'attaques.
 *
 * @class PageAttaquer
 * @constructor
 */
export class AttackPage {
  // Champs déclarés pour TypeScript (Phase 2 : conversion telle quelle, le
  // typage fin est reporté — cf. .claude/plans/wxt-migration-followups.md).
  _comptePlusBox: any;
  _attackCount: any;
  _target: any;
  _army: any;
  constructor(boxComptePlus) {
    /**
     * Accés à la boite compte+
     */
    this._comptePlusBox = boxComptePlus;
    /**
     *
     */
    this._attackCount =
      getProfile().niveauRecherche[6] +
      2 -
      $("#centre")
        .text()
        .split(/- Vous allez attaquer|- Des renforts arrivent/g).length;
    /**
     *
     */
    this._target = new Player({ pseudo: $("input[name=pseudoCible]").val() });
    /**
     * Armee.
     */
    this._army = null;
  }
  /**
   *
   */
  run() {
    if ($("#tabChoixArmee").length) {
      // récupération de l'armée
      this._army = new Army({ unite: this.extractArmy() });
      this.updateStats(this._army);
      // ajoute event
      $("input[id^=unite]").on("input", (e) => {
        this.updateStats();
      });
      // on recupére le profil du joueur pour les coordonnées
      this._target.getProfile().then((data) => {
        this._target.loadProfile(data);
        // affichage des options avancées de lancement de l'armée
        this.addOption();
        // ajoute des outils de floods
        this.floodForm();
      });
    }
    if (!Utils.comptePlus) this.plus();
    SentAttack.renderTables();
    return this;
  }
  /**
   *
   */
  extractArmy() {
    let units = {};
    $("input[id^='unite']").each((i, elt) => {
      units[$(elt).parent().parent().find("td:first").text()] = numeral($(elt).val()).value();
    });
    return units;
  }
  /**
   * Affiche les données de l'armée selectionné.
   *
   * @private
   * @method majStatistique
   */
  updateStats(army = null) {
    let tmp = army ? army : new Army({ unite: this.extractArmy() }),
      html = `<table id="o_tableStatArmee" cellspacing=0>
            <tr class="gras centre"><td></td><td>HB</td><td>AB</td></tr>
            <tr><td>${IMG_HP}</td><td>${numeral(tmp.getBaseHp()).format()}</td><td>${numeral(tmp.getTotalHp(getProfile().niveauRecherche[1])).format()}</td></tr>
            <tr><td>${IMG_ATT}</td><td>${numeral(tmp.getBaseAtt()).format()}</td><td>${numeral(tmp.getTotalAtt(getProfile().niveauRecherche[2])).format()}</td></tr>
            <tr><td>${IMG_DEF}</td><td>${numeral(tmp.getBaseDef()).format()}</td><td>${numeral(tmp.getTotalDef(getProfile().niveauRecherche[2])).format()}</td></tr>
            <tr><td><img alt="Nombre" src="images/icone/fourmi.png" height="18"/></td><td colspan="2" class="centre">${numeral(tmp.getTotalUnits()).format()}</td></tr>
            </table>`;
    $("#formulaireChoixArmee fieldset:eq(1)")
      .tooltip({
        position: { my: "left+10", at: "right center" },
        content: html,
        items: "fieldset",
        hide: { effect: "fade", duration: 10 },
        tooltipClass: "ui-tooltip-right ui-tooltip-brown ui-tooltip-lightBrown",
      })
      .tooltip("open");
    $("#formulaireChoixArmee fieldset:eq(1)").on("mouseout focusout", (e) => {
      e.stopImmediatePropagation();
    });
  }
  /**
   *
   */
  addOption() {
    // on deplace le bouton standarf à droite
    $("input[name='ChoixArmee']").unwrap().wrap("<div id='o_btnLancer' class='right'></div>");
    // Capture de l'attaque au moment de l'envoi pour le récapitulatif par
    // cible. Hook sur le submit du formulaire : couvre le clic sur le bouton,
    // la touche Entrée, et les lancements programmés (Synchroniser / Sonder).
    $("input[name='ChoixArmee']")
      .closest("form")
      .on("submit", () => {
        SentAttack.record(
          this._target.pseudo,
          $("#lieu option:selected").text().trim(),
          this.extractArmy(),
          { terrain: this._target.terrain },
        );
      });
    // Ajout du bouton pour la synchro simple
    // Ajout du temps de trajet
    const countProbe = getProfile().parametre["uniteSonde"].valeur;
    const titleSync = `Attend automatiquement le temps nécessaire pour que l'attaque arrive sur une minute pleine (utile pour synchroniser plusieurs attaques avec des alliés).`;
    const titleProbe = `Envoie ${countProbe} unité${countProbe > 1 ? "s" : ""} de la première espèce disponible (configurable dans Paramètres → Général) en attaque synchronisée — révèle le nombre de défenseurs ennemis sans engager toute l'armée.`;
    const titleProbeDirect = `Comme Sonder mais sans attendre la minute pleine — envoi immédiat. Utile quand le timing n'a pas d'importance.`;
    $("#o_btnLancer")
      .before(
        `<div id="o_btnSynchro"><button id='o_synchro' class="o_button f_info" title="${titleSync}">Synchroniser</button><button id='o_sonder' class="o_button f_error" title="${titleProbe}">Sonder</button><button id='o_sonderDirect' class="o_button f_error" title="${titleProbeDirect}">Sonder direct</button></div>`,
      )
      .after(
        `<p class="centre reduce ligne_paire">Votre armée rentrera le <span id="o_retourArmee" class="gras">${moment().add(getProfile().getTravelTimeTo(this._target), "s").format("D MMM à HH[h]mm[m]ss[s]")}</span> (RC : <span id="o_retourArmeeRC" class="gras">${Utils.roundMinute(getProfile().getTravelTimeTo(this._target)).format("D MMM à HH[h]mm")}</span>).</p>`,
      );
    $("#o_synchro").click((e) => {
      e.preventDefault();
      this.launchSync(this._target.waitSync());
      return false;
    });
    // Remplit le formulaire avec une sonde (1ʳᵉ espèce dispo × paramètre uniteSonde)
    const remplirFormProbe = () => {
      let firstUnit = true;
      $("#lieu").val(3);
      for (let i = 1; i < 15; i++)
        if ($("#unite" + i).length) {
          $("#unite" + i).val(firstUnit ? getProfile().parametre["uniteSonde"].valeur : 0);
          firstUnit = false;
        }
    };
    // Sonde synchronisée (arrive sur la minute pleine)
    $("#o_sonder").click((e) => {
      e.preventDefault();
      remplirFormProbe();
      this.launchSync(this._target.waitSync());
      return false;
    });
    // Sonde directe (envoi immédiat, pas de synchro)
    $("#o_sonderDirect").click((e) => {
      e.preventDefault();
      remplirFormProbe();
      $("input[name='ChoixArmee']").click();
      return false;
    });
    Utils.incrementTime(
      getProfile().getTravelTimeTo(this._target),
      "o_retourArmee",
      "o_retourArmeeRC",
    );
  }
  /**
   *
   */
  launchSync(wait) {
    // Affichage du compte à rebours
    $("#formulaireChoixArmee fieldset:eq(1)").append(
      `<p class="centre">Synchronisation en cours, veuillez attendre : <span id='o_decSyncA'></span>.</p>`,
    );
    Utils.decreaseTime(wait, "o_decSyncA");
    setTimeout(() => {
      $("input[name='ChoixArmee']").click();
    }, wait * 1000);
  }
  /**
   * Formulaire de lancemenet de flood.
   *
   * @private
   * @method formulaireFlood
   */
  floodForm() {
    let methode = getProfile().parametre["methodeFlood"].valeur,
      // créneaux d'attaques simultanées encore libres (VA + 1 au total)
      creneaux = Math.max(0, this._attackCount);
    $(".simulateur:eq(0)")
      .append(`<fieldset id='o_prepaFlood' class='centre'><legend><span class='titre'>Lanceur de Flood</span> <span class='reduce'>(${creneaux} créneau${creneaux > 1 ? "x" : ""} libre${creneaux > 1 ? "s" : ""} sur ${getProfile().niveauRecherche[6] + 1})</span></legend>
            <table id='o_simulationFlood' class='o_maxWidth' cellspacing=0>
			<tr class='gras'><td>Etape</td><td>Troupes</td><td>Supp.*</td><td>Mon Terrain</td><td>${this._target.pseudo} (${Utils.intToTime(getProfile().getTravelTimeTo(this._target))})</td></tr>
			<tr><td><select id='o_methodeFlood'><option value='0' ${methode == 0 ? "selected" : ""}>${FLOOD_METHODS[0]}</option><option value='1' ${methode == 1 ? "selected" : ""}>${FLOOD_METHODS[1]}</option><option value='2' ${methode == 2 ? "selected" : ""}>${FLOOD_METHODS[2]}</option><option value='3' ${methode == 3 ? "selected" : ""}>${FLOOD_METHODS[3]}</option></select></td><td colspan="2"></td><td><input value='${Utils.terrain}' size='12' id='o_floodTDCA'/></td><td><input value='${this._target.terrain}' size='12' id='o_floodTDCB'/></td></tr>
			<tr><td>Antisonde (<span id="o_pourcentAttaque0">0</span>%)</td><td><input value='0' size='12' id='o_floodAntiSonde'/></td><td></td><td>${numeral(Utils.terrain).format()}</td><td>${numeral(this._target.terrain).format()}</td></tr>
            <tr class="gras reduce"><td colspan="3"></td><td><span id="o_supprimeAttaque" class="souligne cursor" ${methode == 1 ? "style=display:none;" : ""}>Supprimer une attaque</span></td><td><span id="o_ajouteAttaque" class="souligne cursor" ${methode == 1 ? "style=display:none;" : ""}>Ajouter une attaque</span></td></tr>
            </table>
            <button id='o_lanceFlood' class='o_marginT15 o_button f_success'>Flooder</button>
            <p class="reduce left">* : place les unités restantes sur l'attaque selectionnée.</p>
            </fieldset>`);
    $("#o_floodTDCA, #o_floodTDCB, #o_floodAntiSonde, input[id^='o_attaque']").spinner({
      min: 0,
      numberFormat: "i",
    });
    $("#o_simulationFlood tr:even").addClass("ligne_paire");
    for (let i = 1; i < Math.min(4, this._attackCount); i++) this.addAttack();
    // Si la methode par defaut est par standard on prepare
    if (methode)
      this.prepareFlood($("#o_floodTDCA").spinner("value"), $("#o_floodTDCB").spinner("value"));
    // event
    $("#o_methodeFlood").change((e) => {
      this.prepareFlood($("#o_floodTDCA").spinner("value"), $("#o_floodTDCB").spinner("value"));
      if (e.currentTarget.value == "1")
        // en optimisee on peut ni ajouter ni supprimer d'attaques
        $("#o_ajouteAttaque, #o_supprimeAttaque").hide();
      else $("#o_ajouteAttaque, #o_supprimeAttaque").show();
    });
    $("#o_floodTDCA").on("input spin", (e, ui) => {
      let count = ui ? ui.value : $(e.currentTarget).spinner("value");
      $(e.currentTarget).spinner("value", count);
      this.prepareFlood(
        ui ? ui.value : $(e.currentTarget).spinner("value"),
        $("#o_floodTDCB").spinner("value"),
      );
    });
    $("#o_floodTDCB").on("input spin", (e, ui) => {
      let count = ui ? ui.value : $(e.currentTarget).spinner("value");
      $(e.currentTarget).spinner("value", count);
      this.prepareFlood(
        $("#o_floodTDCA").spinner("value"),
        ui ? ui.value : $(e.currentTarget).spinner("value"),
      );
    });
    $("#o_floodAntiSonde").on("input spin", (e, ui) => {
      let count = ui ? ui.value : $(e.currentTarget).spinner("value");
      $(e.currentTarget).spinner("value", count);
      this.prepareFlood($("#o_floodTDCA").spinner("value"), $("#o_floodTDCB").spinner("value"));
    });
    $("#o_lanceFlood").click((e) => {
      // contexte pour que envoyerFlood capture chaque attaque confirmée. Le
      // terrain de départ est celui saisi dans la simulation (par défaut celui
      // du profil, modifiable si on connaît une valeur plus fraîche)
      SentAttack.contexteFlood = {
        cible: this._target.pseudo,
        terrain: $("#o_floodTDCB").spinner("value"),
      };
      this._army.sendFlood(
        this._target.id,
        0,
        $("#t:last").attr("name") + "=" + $("#t:last").attr("value"),
      );
    });
    $("#o_ajouteAttaque").click((e) => {
      this.addAttack();
    });
    $("#o_supprimeAttaque").click((e) => {
      this.deleteAttack();
    });
  }
  /**
   * Lance une simulation si les données saisies sont correctes.
   *
   * @private
   * @method compileDataFlood
   */
  prepareFlood(huntingGroundAtt, huntingGroundTarget, bRecup = false) {
    // Si la cible est à porter
    if (
      huntingGroundTarget >= huntingGroundAtt * 0.5 &&
      huntingGroundTarget <= huntingGroundAtt * 3
    ) {
      let methode = $("#o_methodeFlood").val();
      // on recup les attaques manuellement
      let attacks = new Array();
      // on push au moins l'antisonde quelque soit le cas !
      attacks.push($("#o_floodAntiSonde").spinner("value"));
      if (bRecup || methode == "0") {
        for (let i = 1; i < this._attackCount; i++)
          if ($("#o_attaque" + i).length) attacks.push($("#o_attaque" + i).spinner("value"));
      }
      // si attaques n'est pas vide c'est qu'on parametre soit meme les floods
      // si la methode est uniforme ou degressive on utilise que le nbAttaque dans le tableau
      let indSupp = $("input[name='o_suppAttaque']:checked").length
        ? $("input[name='o_suppAttaque']:checked").attr("id").replace("o_suppAttaque", "")
        : -1;
      let simulation = this._army.simulateFlood(
        huntingGroundAtt,
        huntingGroundTarget,
        methode,
        attacks,
        $("#o_attaque1").spinner("value"),
        methode == "2" || methode == "3"
          ? Math.min($("input[id^='o_attaque']").length, this._attackCount)
          : this._attackCount,
        indSupp,
      );
      // mise a jour de l'antisonde
      let captureMax = Math.floor(huntingGroundTarget * 0.2),
        pourcent = 0;
      if (simulation[0]) {
        captureMax = simulation[0] > captureMax ? captureMax : simulation[0];
        pourcent = Math.round((captureMax * 100) / huntingGroundTarget);
        huntingGroundAtt += captureMax;
        huntingGroundTarget -= captureMax;
        $("#o_pourcentAttaque" + 0).text(pourcent);
        $("#o_simulationFlood tr:eq(2) td:eq(3)").text(numeral(huntingGroundAtt).format());
        $("#o_simulationFlood tr:eq(2) td:eq(4)").text(numeral(huntingGroundTarget).format());
      }
      // mise à jour des attaques
      for (let i = 1; i < simulation.length; i++) {
        if (!$("#o_attaque" + i).length) this.addAttack(true);
        $("#o_attaque" + i).spinner("value", simulation[i]);
        // Calcule des terrains
        if (huntingGroundTarget >= huntingGroundAtt * 0.5) {
          captureMax = Math.floor(huntingGroundTarget * 0.2);
          captureMax = simulation[i] > captureMax ? captureMax : simulation[i];
          pourcent = Math.round((captureMax * 100) / huntingGroundTarget);
          huntingGroundAtt += captureMax;
          huntingGroundTarget -= captureMax;
        }
        $("#o_pourcentAttaque" + i).text(pourcent);
        $("#o_simulationFlood tr:eq(" + (i + 2) + ") td:eq(3)").text(
          numeral(huntingGroundAtt).format(),
        );
        $("#o_simulationFlood tr:eq(" + (i + 2) + ") td:eq(4)").text(
          numeral(huntingGroundTarget).format(),
        );
      }
      // supprime les attaques en trop si besoin
      for (let i = simulation.length; i < $("#o_simulationFlood tr").length - 3; i++)
        this.deleteAttack();
    }
  }
  /**
   *
   */
  addAttack(silencieux = false) {
    let countAttack = $("input[id^='o_attaque']").length + 1,
      // l'antisonde occupe un créneau d'attaque seulement si elle est envoyée :
      // à 0 la simulation place une attaque de plus, la ligne doit exister
      // sinon elle est envoyée sans être affichée
      creneaux = this._attackCount - ($("#o_floodAntiSonde").spinner("value") ? 1 : 0);
    // si le nombre d'attaque depasse la VA
    if (countAttack > creneaux) {
      // Toast seulement sur clic manuel : en pré-remplissage auto (preparerFlood),
      // l'utilisateur n'a rien fait, l'avertissement est trompeur.
      if (!silencieux)
        $.toast({
          ...TOAST_WARNING,
          text: "Votre vitesse d'attaque ne vous permet d'envoyer plus d'attaques",
        });
    } else {
      $("#o_simulationFlood tr:last").before(
        `<tr class='ligne_paire'><td>Attaque ${countAttack} (<span id="o_pourcentAttaque${countAttack}">0</span>%)</td><td><input value='0' size='12' id='o_attaque${countAttack}'/></td><td><input type="checkbox" id="o_suppAttaque${countAttack}" name="o_suppAttaque"/></td><td>${numeral(Utils.terrain).format()}</td><td>${numeral(this._target.terrain).format()}</td></tr>`,
      );
      $("#o_attaque" + countAttack).spinner({ min: 0, numberFormat: "i" });
      $("#o_simulationFlood tr").removeClass("ligne_paire");
      $("#o_simulationFlood tr:even").addClass("ligne_paire");
      // Event
      $("#o_attaque" + countAttack).on("input spin", (e, ui) => {
        this.prepareFlood(
          $("#o_floodTDCA").spinner("value"),
          $("#o_floodTDCB").spinner("value"),
          true,
        );
      });
      $("input[name='o_suppAttaque']").on("change", (e) => {
        // une seule checkbox peut etre cocher
        $("input[name='o_suppAttaque']").not(e.currentTarget).prop("checked", false);
        this.prepareFlood($("#o_floodTDCA").spinner("value"), $("#o_floodTDCB").spinner("value"));
      });
      // si la methode est uniforme ou degressive on utilise autocomplete la valeur de l'attaque
      let methode = $("#o_methodeFlood").val();
      if (methode == "2" || methode == "3")
        this.prepareFlood($("#o_floodTDCA").spinner("value"), $("#o_floodTDCB").spinner("value"));
    }
  }
  /**
   *
   */
  deleteAttack() {
    // si le nombre d'attaque est de 0
    let countAttack = $("input[id^='o_attaque']").length + 1;
    if (countAttack == 1)
      $.toast({ ...TOAST_WARNING, text: "Vous ne pouvez plus supprimer d'attaque" });
    else {
      $("#o_attaque" + (countAttack - 1)).off();
      $("#o_simulationFlood tr:eq(" + (countAttack + 1) + ")").remove();
      $("#o_simulationFlood tr").removeClass("ligne_paire");
      $("#o_simulationFlood tr:even").addClass("ligne_paire");
    }
  }
  /**
   * Ajoute les fonctionnalités du compte+. Affiche les infos sur l'armée et les fléches dans le tableau des unités.
   *
   * @private
   * @method plus
   */
  plus() {
    // Affichage de l'arrivée + sauvegarde des attaques en cours
    let listAttack = SentAttack.enrichRows();
    // Verification si les données sont deja enregistré
    this.saveAttacks(listAttack);
  }
  /**
   * Verifie les attaques en cours avec ce qui est sauvegarder.
   *
   * @private
   * @method saveAttaque
   */
  saveAttacks(listAttack) {
    let dataEvo = storage.getJSON("outiiil_evolution") || {};
    if (
      !dataEvo.hasOwnProperty("attaque") ||
      dataEvo.attaque.length != listAttack.length ||
      (listAttack.length &&
        (dataEvo.attaque[0]["cible"] != listAttack[0]["cible"] ||
          listAttack[0]["exp"].diff(dataEvo.attaque[0]["exp"], "s") > 1))
    ) {
      dataEvo.attaque = listAttack;
      dataEvo.startAttaque = moment();
      storage.setJSON("outiiil_evolution", dataEvo);
      if (!Utils.comptePlus && $("#boiteComptePlus").length) {
        this._comptePlusBox.attaque = dataEvo.attaque;
        this._comptePlusBox.startAttaque = dataEvo.startAttaque;
        this._comptePlusBox.updateAttack();
      }
    }
  }
}
