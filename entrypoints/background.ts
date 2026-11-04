export default defineBackground(() => {
  // Firefox : envoyer la recherche GIF à Giphy demande l'accord du joueur
  // (collecte optionnelle). Les content scripts n'ont pas l'API permissions.
  const collecte = { data_collection: ["searchTerms"] } as Browser.permissions.Permissions;
  browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.gif == "autorise") {
      if (!import.meta.env.FIREFOX) sendResponse(true);
      else browser.permissions.contains(collecte).then(sendResponse, () => sendResponse(false));
      return true;
    }
    // la demande d'accord doit venir d'un clic sur une page de l'extension
    if (message?.gif == "autoriser")
      browser.tabs.create({ url: browser.runtime.getURL("/gif-autorisation.html") });
  });
});
