// Appelé uniquement quand aucun fichier de public/ ne correspond à l'adresse demandée.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    // https://loandrouard.com/ → index.html (copie de Video Feedback), sans redirection.
    if (url.pathname === "/") {
      url.pathname = "/index.html";
      return env.ASSETS.fetch(new Request(url, request));
    }
    return new Response("404 — page introuvable", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  },
};
