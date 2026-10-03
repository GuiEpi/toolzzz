// Images : celles du jeu (balises HTML prêtes à insérer) et celles de l'extension (URLs).
import { browser } from "#imports";

// Image diverses de fourmizzz
export const IMG_ARROW =
  "<img src='images/icone/fleche-bas-claire.png' style='vertical-align:1px;' alt='changer' height='8'>";
export const IMG_FOOD =
  "<img src='images/icone/icone_pomme.gif' alt='Nourriture' class='o_vAlign' height='18' title='Consommation Journalière' />";
export const IMG_MATERIALS = "<img src='images/icone/icone_bois.gif' alt='Materiaux' height='18'/>";
export const IMG_HP =
  "<img src='images/icone/icone_coeur.gif' class='o_vAlign' height='18' width='18'/>";
export const IMG_ATT =
  "<img src='images/icone/icone_degat_attaque.gif'  alt='Dégâts en attaque :' class='o_vAlign'height='18' title='Dégâts en attaque :' />";
export const IMG_DEF =
  "<img src='images/icone/icone_degat_defense.gif' alt='Dégâts en défense :' class='o_vAlign' height='18' title='Dégâts en défense :' />";
export const IMG_LEFT =
  "<img src='images/bouton/fleche-champs-gauche.gif' width='9' height='15' class='o_vAlign'/>";
export const IMG_RIGHT =
  "<img src='images/bouton/fleche-champs-droite.gif' width='9' height='15' class='o_vAlign'/>";
export const IMG_COPY_ARMY =
  "<img src='images/icone/feuille.gif' class='cliquable' title='Copier/Coller une armée' style='position:relative;top:3px' width='14' height='17'>";
// Image pour l'extension
export const IMG_CHANGE = browser.runtime.getURL("/images/change.png");
export const IMG_REFRESH = browser.runtime.getURL("/images/actualize_on_01.png");
export const IMG_PENCIL = browser.runtime.getURL("/images/crayon.gif");
export const IMG_CROSS = browser.runtime.getURL("/images/croix.png");
export const IMG_COPY = browser.runtime.getURL("/images/copy.png");
export const IMG_HISTORY = browser.runtime.getURL("/images/historique.png");
export const IMG_DELIVERY = browser.runtime.getURL("/images/livraison.png");
export const IMG_RADAR = browser.runtime.getURL("/images/radar.png");
export const IMG_SPRITE_MENU = browser.runtime.getURL("/images/sprite_menu.png");
export const IMG_UTILITY = browser.runtime.getURL("/images/utility.png");
export const IMG_DOWN = browser.runtime.getURL("/images/down.png");
export const IMG_UP = browser.runtime.getURL("/images/up.png");
export const IMG_TOOLZZZ = browser.runtime.getURL("/images/toolzzz.png");
