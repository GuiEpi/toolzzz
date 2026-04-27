/*
 * RapportChasse.js
 * Hraesvelg
 **********************************************************************/

/**
 * Classe de fonction pour l'analyse d'un rapport de chasse, herite des fonctions de la classe Rapport.
 *
 * @class Chasse
 * @constructor
 * @extends Rapport
 */
class Chasse {
  constructor(rc) {
    /**
     *
     */
    this._rc = rc;
    /**
     *
     */
    this._armeeAv = new Armee();
    /**
     *
     */
    this._armeePe = new Armee();
    /**
     *
     */
    this._armeeAp = new Armee();
  }
  /**
   *
   */
  get armeeAv() {
    return this._armeeAv;
  }
  /**
   *
   */
  get armeePe() {
    return this._armeePe;
  }
  /**
   *
   */
  get armeeAp() {
    return this._armeeAp;
  }
  /**
   * Calcule le niveau d'armes en fonction des degats.
   *
   * @private
   * @method getArmes
   * @param {Integer} fdf de base
   * @param {Integer} fdf avec bonus
   * @return {Integer} le niveau d'armes
   */
  calculArmes(base, bonus) {
    return Math.round((bonus / base) * 10);
  }
  /**
   * Calcule le niveau du bouclier.
   *
   * @private
   * @method getBouclier
   * @param {Integer} degat
   * @param {Object} armee1
   * @param {Object} armee2
   * @return {Integer} le niveau de bouclier
   */
  calculBouclier(degat, armee1, armee2) {
    let viePerdue = armee1.getBaseVie() - armee2.getBaseVie();
    return Math.round(((degat - viePerdue) / viePerdue) * 10);
  }
  /**
   * Retourne l'armée en retirant d'aprés le rapport les unités perdues suivant le texte.
   *
   * @private
   * @method retirePerte
   * @param {Object} armee
   * @return {Object} armee perdue
   */
  retirePerte(armee) {
    let res = new Armee(),
      tmp = this._rc.split("et en tue"),
      total = 0;
    res.unite = armee.unite.slice(0);
    // Si le rc à plusieurs tours on additionne d'abords les pertes.
    for (let i = 1; i < tmp.length; total += parseInt(tmp[i++].split(".")[0].replace(/ /g, "")));
    // Tant que le total n'est pas 0 on retire les unités
    for (let i = 0; i < 14; i++) {
      if (res.unite[i] >= total) {
        res.unite[i] -= total;
        break;
      } else {
        total -= res.unite[i];
        res.unite[i] = 0;
      }
    }
    return res;
  }
  /**
   * Retourne l'armée en ajoutant l'xp.
   *
   * @private
   * @method ajouteXP
   * @param {Object} armee
   * @return {Object} armee avec XP
   */
  ajouteXP(armee) {
    let res = new Armee(),
      tmp = this._rc.split("- "),
      tableXP = [-1, 1, 2, -1, 4, 9, 6, -1, 8, -1, -1, 11, -1, 13, -1];
    res.unite = armee.unite.slice(0);
    // Pour chaques types d'unitées qui ont XP.
    for (let i = 1, l = tmp.length; i < l; i++) {
      let uniteXP = NOM_UNITE.indexOf(
          tmp[i].replace(/[0-9]/g, "").split("sont")[0].replace(/s /g, " ").trim(),
        ),
        qteXP = parseInt(tmp[i].replace(/ /g, ""));
      res.unite[uniteXP - 1] -= qteXP;
      res.unite[tableXP[uniteXP]] += qteXP;
    }
    return res;
  }
  /**
   * Récupére l'armée, les pertes et l'xp d'un rapport de chasse.
   *
   * @private
   * @method analyse
   */
  analyse() {
    let motCle = new Array("Troupes en attaque : ", "et en tue");
    if (
      motCle.some((substring) => {
        return this._rc.includes(substring);
      })
    ) {
      this._armeeAv.parseArmee(this._rc.split("Troupes en attaque : ")[1].split(".")[0]);
      this._armeePe = this.retirePerte(this._armeeAv);
      this._armeeAp = this.ajouteXP(this._armeePe);
      return true;
    }
    return false;
  }
  /**
   * Ajoute les données des chasses pour faire un bilan.
   *
   * @private
   * @method ajoute
   * @param {Object} chasse
   */
  ajoute(chasse) {
    for (let i = 0; i < 14; i++) {
      this._armeeAv.unite[i] += chasse.armeeAv.unite[i];
      this._armeePe.unite[i] += chasse.armeePe.unite[i];
      this._armeeAp.unite[i] += chasse.armeeAp.unite[i];
    }
    return this;
  }
  /**
   *
   */
  toHTMLMessagerie() {
    let tdp = monProfil.getTDP(),
      sommeUnite = this._armeePe.getSommeUnite() - this._armeeAv.getSommeUnite(),
      baseAtt = this._armeeAp.getBaseAtt() - this._armeeAv.getBaseAtt(),
      baseDef = this._armeeAp.getBaseDef() - this._armeeAv.getBaseDef(),
      baseVie = this._armeeAp.getBaseVie() - this._armeeAv.getBaseVie(),
      bonusAtt =
        this._armeeAp.getTotalAtt(monProfil.niveauRecherche[2]) -
        this._armeeAv.getTotalAtt(monProfil.niveauRecherche[2]),
      bonusDef =
        this._armeeAp.getTotalDef(monProfil.niveauRecherche[2]) -
        this._armeeAv.getTotalDef(monProfil.niveauRecherche[2]),
      bonusVie =
        this._armeeAp.getTotalVie(monProfil.niveauRecherche[1]) -
        this._armeeAv.getTotalVie(monProfil.niveauRecherche[1]),
      pAtt = ((baseAtt * 100) / this._armeeAv.getBaseAtt()).toFixed(2),
      pDef = ((baseDef * 100) / this._armeeAv.getBaseDef()).toFixed(2),
      pVie = ((baseVie * 100) / this._armeeAv.getBaseVie()).toFixed(2);
    return `<p class='retour'>Perte HOF : ${Utils.intToTime(this._armeeAv.getTemps(0) - this._armeePe.getTemps(0))} - Perte (TDP ${tdp}) : ${Utils.intToTime(this._armeeAv.getTemps(tdp) - this._armeePe.getTemps(tdp))}</p>
            <table class='o_tabAnalyse right' cellspacing='0'>
			<tr><td><img width='35' src='images/icone/icone_ouvriere.png' alt='nb_unite'/></td><td colspan='2' style='padding-left:10px'>${numeral(sommeUnite).format()}</td><td style='padding-left:10px'>${((sommeUnite * 100) / this._armeeAv.getSommeUnite()).toFixed(2)}%</td></tr>
			<tr><td>${IMG_VIE}</td><td class='right'>${(baseVie > 0 ? "+" : "") + numeral(baseVie).format()}(HB)</td><td class='right'>${(bonusVie > 0 ? "+" : "") + numeral(bonusVie).format()}(AB)</td><td style='padding-left:10px'>${(pVie > 0 ? "+" : "") + pVie}%</td></tr>
			<tr><td>${IMG_ATT}</td><td style='padding-left:10px' class='right'>${(baseAtt > 0 ? "+" : "") + numeral(baseAtt).format()}(HB)</td><td style='padding-left:10px' class='right'>${(bonusAtt > 0 ? "+" : "") + numeral(bonusAtt).format()}(AB)</td><td style='padding-left:10px'>${(pAtt > 0 ? "+" : "") + pAtt}%</td></tr>
			<tr><td>${IMG_DEF}</td><td class='right'>${(baseDef > 0 ? "+" : "") + numeral(baseDef).format()}(HB)</td><td class='right'>${(bonusDef > 0 ? "+" : "") + numeral(bonusDef).format()}(AB)</td></td><td style='padding-left:10px'>${(pDef > 0 ? "+" : "") + pDef}%</td></tr>
			</table>`;
  }
  /**
   *
   */
  toHTMLBoite(bVisible) {
    let diffNbr = this._armeeAp.getSommeUnite() - this._armeeAv.getSommeUnite(),
      diffVie = this._armeeAp.getBaseVie() - this._armeeAv.getBaseVie(),
      diffAtt = this._armeeAp.getBaseAtt() - this._armeeAv.getBaseAtt(),
      diffDef = this._armeeAp.getBaseDef() - this._armeeAv.getBaseDef();
    let html = `<tr ${bVisible ? "" : "style='display:none'"}><td><img height='20' src='images/icone/fourmi.png'/></td><td>${numeral(this._armeeAv.getSommeUnite()).format()}</td><td><img height='20' src='images/icone/fourmi.png'/></td><td>${numeral(diffNbr).format("+0,0")} (${numeral(diffNbr / this._armeeAv.getSommeUnite()).format("+0.00%")})</td><td><img height='20' src='images/icone/fourmi.png'/></td><td>${numeral(this._armeeAp.getSommeUnite()).format()}</td></tr>
            <tr ${bVisible ? "" : "style='display:none'"}><td>${IMG_VIE}</td><td>${numeral(this._armeeAv.getBaseVie()).format()}</td><td>${IMG_VIE}</td><td>${numeral(diffVie).format("+0,0")} (${numeral(diffVie / this._armeeAv.getBaseVie()).format("+0.00%")})</td><td>${IMG_VIE}</td><td>${numeral(this._armeeAp.getBaseVie()).format()}</td></tr>
			<tr ${bVisible ? "" : "style='display:none'"}><td>${IMG_ATT}</td><td>${numeral(this._armeeAv.getBaseAtt()).format()}</td><td>${IMG_ATT}</td><td>${numeral(diffAtt).format("+0,0")} (${numeral(diffAtt / this._armeeAv.getBaseAtt()).format("+0.00%")})</td><td>${IMG_ATT}</td><td>${numeral(this._armeeAp.getBaseAtt()).format()}</td></tr>
			<tr ${bVisible ? "" : "style='display:none'"}><td>${IMG_DEF}</td><td>${numeral(this._armeeAv.getBaseDef()).format()}</td><td>${IMG_DEF}</td><td>${numeral(diffDef).format("+0,0")} (${numeral(diffDef / this._armeeAv.getBaseDef()).format("+0.00%")})</td><td>${IMG_DEF}</td><td>${numeral(this._armeeAp.getBaseDef()).format()}</td></tr>`;
    return html;
  }

  /* ------------------------------------------------------------------ */
  /* ---- Combat sim chasse (joueur vs faune) ------------------------- */
  /* ------------------------------------------------------------------ */

  /**
   * Simule un combat de chasse joueur vs composition de faune, round par round.
   *
   * Modèle vérifié sur captures réelles du simulateur natif (cf.
   * docs/scenarios/simulateur-chasse) :
   * - Les deux côtés calculent leur attaque **avant** que les pertes du round
   *   soient appliquées (ex. run 1 rd1 enemy fdf = 12×13+30×30+140+2×230 = 1656 ✓).
   * - Pertes joueur ordre tier-bas-d'abord (confirmé par les transitions JSN/SN).
   * - Pertes faune : meilleure approximation = espèces faibles (faible Vie) tuées
   *   en premier ; documenté comme heuristique car le natif n'expose pas l'ordre exact.
   * - Bonus armes/bouclier appliqués via `(1 + niveauRecherche/10)` (cf. Armee.getTotalAtt).
   *
   * @static
   * @method simulerCombat
   * @param {Armee} armee — armée du joueur (lit `unite[]` 14 entries)
   * @param {Array<{slug,count}>} faune — composition rencontrée (slug = clé FAUNE)
   * @param {Object} bonus — { armes, bouclier } niveaux de recherche du joueur
   * @return {Object} { rounds:[…], issue:'victoire'|'defaite'|'egalite', survivantsJ, survivantsE }
   */
  static simulerCombat(armee, faune, bonus = { armes: 0, bouclier: 0 }) {
    const MAX_ROUNDS = 10;
    // Joueur : on suit l'HP cumulé par tier (les unités blessées contribuent
    // proportionnellement à l'attaque suivante — vérifié sur capture-2 round 2).
    let playerTiers = armee.unite.map((count, i) => {
      let baseVie = VIE_UNITE[i + 1],
        vie = baseVie + Math.round((baseVie * bonus.bouclier) / 10);
      return { idx: i, count, vie, totalHP: count * vie };
    });
    // Faune : pareil, HP cumulé par espèce.
    let enemies = faune
      .map((f) => {
        let s = FAUNE.find((x) => x.slug === f.slug);
        return s ? { ...s, count: f.count, totalHP: f.count * s.vie } : null;
      })
      .filter((e) => e && e.count > 0);
    // Speed-kill malus : le natif applique un multiplicateur sur l'attaque ennemie
    // selon la rapidité de la victoire (vérifié sur Fights 4 ×0.5, 8 ×0.1, 1 ×1.0).
    let baseAttForRatio = playerTiers.reduce((s, t) => s + t.count * ATT_UNITE[t.idx + 1], 0),
      totalAttForRatio = baseAttForRatio + Math.round((baseAttForRatio * bonus.armes) / 10),
      enemyHPInit = enemies.reduce((s, e) => s + e.totalHP, 0),
      killRatio = enemyHPInit > 0 ? totalAttForRatio / enemyHPInit : 0,
      enemyMul = killRatio >= 10 ? 0.1 : killRatio >= 1.5 ? 0.5 : 1.0,
      speedTier = enemyMul === 0.1 ? "ecrasante" : enemyMul === 0.5 ? "belle" : "normal";
    let rounds = [];
    for (let r = 0; r < MAX_ROUNDS; r++) {
      let pAlive = playerTiers.reduce((s, t) => s + t.count, 0),
        eAlive = enemies.reduce((s, e) => s + e.count, 0);
      if (pAlive === 0 || eAlive === 0) break;
      // Attaques basées sur HP courant (les blessés contribuent proportionnellement)
      let myBaseAtt = Math.ceil(
          playerTiers.reduce((s, t) => s + (t.totalHP / t.vie) * ATT_UNITE[t.idx + 1], 0),
        ),
        myAttBonus = Math.round((myBaseAtt * bonus.armes) / 10),
        myTotalAtt = myBaseAtt + myAttBonus,
        enemyBaseAtt = Math.ceil(enemies.reduce((s, e) => s + (e.totalHP / e.vie) * e.fdf, 0)),
        enemyTotalAtt = Math.round(enemyBaseAtt * enemyMul);
      // Pertes faune : weakest-vie first
      let dmgLeft = myTotalAtt,
        killed = 0,
        sortedEnemies = [...enemies].sort((a, b) => a.vie - b.vie);
      for (let e of sortedEnemies) {
        if (dmgLeft <= 0 || e.totalHP <= 0) continue;
        let absorbed = Math.min(dmgLeft, e.totalHP),
          newHP = e.totalHP - absorbed,
          newCount = newHP > 0 ? Math.ceil(newHP / e.vie) : 0;
        killed += e.count - newCount;
        e.totalHP = newHP;
        e.count = newCount;
        dmgLeft -= absorbed;
      }
      enemies = enemies.filter((e) => e.count > 0);
      // Pertes joueur : lowest-tier first (confirmé)
      let myDmgLeft = enemyTotalAtt,
        myLost = 0;
      for (let t of playerTiers) {
        if (myDmgLeft <= 0 || t.totalHP <= 0) continue;
        let absorbed = Math.min(myDmgLeft, t.totalHP),
          newHP = t.totalHP - absorbed,
          newCount = newHP > 0 ? Math.ceil(newHP / t.vie) : 0;
        myLost += t.count - newCount;
        t.totalHP = newHP;
        t.count = newCount;
        myDmgLeft -= absorbed;
      }
      rounds.push({
        playerAtt: myTotalAtt,
        playerAttBonus: myAttBonus,
        playerKills: killed,
        enemyAtt: enemyTotalAtt,
        enemyAttBonus: 0,
        playerLost: myLost,
      });
    }
    let myAlive = playerTiers.some((t) => t.count > 0),
      enemyAlive = enemies.length > 0,
      issue = !myAlive ? "defaite" : !enemyAlive ? "victoire" : "egalite";
    return {
      rounds,
      issue,
      speedTier, // "ecrasante" | "belle" | "normal" — relevant only when issue==="victoire"
      survivantsJ: playerTiers.map((t) => t.count),
      survivantsE: enemies,
    };
  }

  /**
   * Calcule les promotions multi-tiers après une victoire. Heuristique calibrée
   * sur les datapoints de capture (cf. docs/scenarios/simulateur-chasse-calibration) :
   * - Victoire normale : ~13% du tier promu (Fight 1 : 5115 JSN → 654 = 12.8%)
   * - Belle/Écrasante : ~2.5% avec cap ~2400 (Fight 4-8 : ~2400 cap observé)
   * - Le même TAUX est appliqué à chaque tier consécutif (Fight 5/6 : SN→NE rate
   *   ≈ JSN→SN rate ≈ 2.5%).
   *
   * @static
   * @method computePromotions
   * @param {Array} survivants — survivantsJ (14 entries)
   * @param {String} issue — "victoire" | "defaite" | "egalite"
   * @param {String} speedTier — "ecrasante" | "belle" | "normal"
   * @return {Array<number>} promos par tier (14 entries) : promos[i] = combien
   *   d'unités du tier i deviennent tier i+1.
   */
  static computePromotions(survivants, issue, speedTier) {
    let promos = new Array(14).fill(0);
    if (issue !== "victoire") return promos;
    let rate = speedTier === "normal" ? 0.13 : 0.025,
      cap = speedTier === "normal" ? Infinity : 2400;
    for (let i = 0; i < 13; i++) {
      let count = survivants[i];
      if (count <= 0) continue;
      promos[i] = Math.min(cap, Math.round(count * rate));
    }
    return promos;
  }
}
