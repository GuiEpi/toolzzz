/*
 * Rank.ts
 * Hraesvelg
 **********************************************************************/

import { $ } from "~/vendor";
import { TOAST_ERROR, TOAST_INFO } from "~/constants";
import { Box } from "~/boxes/Box";

/**
 * Lets a member's rank be changed in the alliance tools.
 *
 * @class RankBox
 * @constructor
 * @extends Box
 */
export class RankBox extends Box {
  // Fields declared for TypeScript (Phase 2 was a straight conversion; real
  // typing is deferred — see .claude/plans/wxt-migration-followups.md).
  _player: any;
  _tools: any;
  _page: any;
  override hide: any;
  constructor(player, tools, page) {
    super(
      "o_boiteRang" + player.id,
      "Attribuer un rang",
      `<form id="o_form${player.id}" class="o_rangForm">
            <div class="group"><input id="o_libRang${player.id}" name="o_rang" type="text" class="o_input" value="${player.rang}" required/><span class="o_inputHighlight"></span><span class="o_inputBar"></span><label class='o_label'>Rang de ${player.pseudo}</label></div>
            <div class="group"><input id="o_ordRang${player.id}" name="o_ordre" class="o_input" type="text" value="${player.ordreRang}" required/><span class="o_inputHighlight"></span><span class="o_inputBar"></span><label class='o_label'>Prioritè du rang</label></div><br/>
            <button name="o_btnRang" class="o_button f_success">Valider</button>
            </form>`,
    );
    /**
     *
     */
    this._player = player;
    /**
     *
     */
    this._tools = tools;
    /**
     *
     */
    this._page = page;
  }
  /**
   * Renders the box.
   *
   * @private
   * @method render
   */
  override render() {
    if (super.render()) this.css().event();
    return this;
  }
  /**
   * Applies the box's own styling.
   *
   * @private
   * @method css
   */
  override css() {
    super.css();
    return this;
  }
  /**
   * Wires up the box's own events.
   *
   * @private
   * @method event
   */
  override event() {
    super.event();
    $("#o_form" + this._player.id + " button[name='o_btnRang']").click((e) => {
      e.preventDefault();
      // save the player's rank
      this._player.rang = $("#o_libRang" + this._player.id).val();
      this._player.ordreRang = $("#o_ordRang" + this._player.id).val();
      this._tools.alliance.joueurs[this._player.pseudo] = this._player;
      // mise a jour de forum
      this._tools.editTopic(this._player.toToolsFormat(), " ", this._player.sujetForum).then(
        (data) => {
          $.toast({ ...TOAST_INFO, text: "Mise à jour correctement effectuée." });
          this._page.refreshMember();
        },
        (jqXHR, textStatus, errorThrown) => {
          $.toast({
            ...TOAST_ERROR,
            text: "Une erreur réseau a été rencontrée lors de la mise à jour des membres de l'alliance.",
          });
        },
      );
      this.hide();
      return false;
    });
    return this;
  }
}
