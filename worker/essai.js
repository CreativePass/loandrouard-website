// Adresse de test UNIQUEMENT (wrangler.essai.jsonc, Worker « loandrouard-essai », sans domaine) : même site que
// worker/site.js, plus la réception du diagnostic temporaire (optimise/diag.js) en POST /__diag.
// Le contenu reçu (tailles d'écran, positions, durées d'images, erreurs ; aucune donnée personnelle) est seulement
// écrit dans le journal du Worker (npx wrangler tail --config wrangler.essai.jsonc).
import site from "./site.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/__diag") {
      if (request.method !== "POST") return new Response(null, { status: 405 });
      const texte = (await request.text()).slice(0, 60000);
      console.log("diag " + texte);
      return new Response(null, { status: 204 });
    }
    return site.fetch(request, env, ctx);
  },
};
