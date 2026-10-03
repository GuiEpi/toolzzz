/*
 * The libraries in `lib/` are not modules: they are UMD/IIFE scripts vendored
 * as they are, imported purely for their side effects (they put themselves on
 * `window` or extend `jQuery.fn`). `allowJs` is false, so tsc must not try to
 * read them — this blanket declaration covers
 * couvre toutes.
 */
declare module "~/vendor/lib/*";
