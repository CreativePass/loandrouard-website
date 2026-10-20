// www.loandrouard.com, loandrouard.fr et www.loandrouard.fr → https://loandrouard.com (301),
// chemin et paramètres conservés (?lang=, ?session_id=…). Déploiement : npm run publier:redirection
// loandrouard.fr ouvre la version française (?lang=fr ajouté, sauf si l'adresse choisit déjà une langue).
export default {
  fetch(request) {
    const url = new URL(request.url);
    if (url.hostname.endsWith("loandrouard.fr") && !url.searchParams.has("lang")) url.searchParams.set("lang", "fr");
    return Response.redirect("https://loandrouard.com" + url.pathname + url.search, 301);
  },
};
