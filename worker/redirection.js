// www.loandrouard.com, loandrouard.fr et www.loandrouard.fr → https://loandrouard.com (301),
// chemin et paramètres conservés (?lang=, ?session_id=…). Déploiement : npm run publier:redirection
export default {
  fetch(request) {
    const url = new URL(request.url);
    return Response.redirect("https://loandrouard.com" + url.pathname + url.search, 301);
  },
};
