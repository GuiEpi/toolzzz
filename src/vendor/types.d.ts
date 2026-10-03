/*
 * Les bibliothèques de `lib/` ne sont pas des modules : ce sont des scripts
 * UMD/IIFE vendorisés tels quels, importés uniquement pour leur effet de bord
 * (ils se posent sur `window` ou étendent `jQuery.fn`). `allowJs` est à false,
 * donc tsc ne doit pas chercher à les lire — cette déclaration générique les
 * couvre toutes.
 */
declare module "~/vendor/lib/*";
