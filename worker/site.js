// Appelé uniquement quand aucun fichier de public/ ne correspond à l'adresse demandée.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    // https://loandrouard.com/ → index.html (copie de Video Feedback), sans redirection.
    if (url.pathname === "/") {
      url.pathname = "/index.html";
      return env.ASSETS.fetch(new Request(url, request));
    }
    // Lien de l'e-mail de confirmation : /acces/<jeton> → la page avec la carte payée débloquée
    // (?session_id=…, déjà géré par la page). Jeton inconnu ou API indisponible → section des formules.
    const acces = url.pathname.match(/^\/acces\/([A-Z0-9]{10})$/);
    if (acces) {
      let cible = "/#formules";
      try {
        const r = await env.API.fetch(new Request("https://loan-api/acces?jeton=" + acces[1],
          { headers: { Origin: "https://loandrouard.com" } }));
        const d = await r.json();
        if (r.ok && d.session_id) cible = "/?session_id=" + encodeURIComponent(d.session_id);
      } catch (e) { /* voir plus haut */ }
      return Response.redirect(new URL(cible, url).href, 302);
    }
    return new Response("404 — page introuvable", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  },
};
