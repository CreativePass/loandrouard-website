// Worker Cloudflare « API » — à coller tel quel dans l'éditeur du Worker (Dashboard).
// Secrets (Settings > Variables and Secrets, type « Secret ») :
//   STRIPE_SECRET_KEY  — clé secrète Stripe (sk_live_…)
//   WHATSAPP_NUMBER    — 33772041266 (sans + ni espaces)
// Variable (type « Text ») :
//   SITE_ORIGIN        — adresses du site séparées par des virgules, sans / final :
//                        https://loandrouard.com,https://www.loandrouard.com
// Prérequis Stripe : Settings > Business > Public details > « Terms of service URL » renseignée
// (sinon Stripe refuse la case CGV et la session ne se crée pas).

// Formules = produits du compte Stripe (vérifiés le 01/10). Les prix vivent chez Stripe, pas dans le navigateur.
const FORMULES = {
  single: { prix: "price_1UGFgoEAanq7mbbHqvWu58xR", montant: 4900, mode: "payment" },
  pack: { prix: "price_1UGFgpEAanq7mbbHusj9753Q", montant: 12900, mode: "payment" },
  prog: { prix: "price_1UGFgrEAanq7mbbHWFKnOkTv", montant: 49900, mode: "subscription" }, // 499 € tous les 3 mois
};
// Textes du paiement, en français pour un navigateur en français, en anglais sinon (Accept-Language).
// Case à cocher obligatoire : renonciation au droit de rétractation (mêmes termes que les CGV).
const RENONCIATION = {
  fr: "En cochant cette case, je demande expressément que la prestation commence avant la fin du délai de rétractation de 14 jours et je reconnais que je perdrai ce droit une fois la prestation pleinement exécutée (art. L221-25 et L221-28, 1° du code de la consommation).",
  en: "By ticking this box, I expressly request that the service start before the end of the 14-day withdrawal period, and I acknowledge that I will lose this right once the service has been fully performed (French Consumer Code, art. L221-25 and L221-28 1°).",
};
const CASE = {
  fr: {
    single: RENONCIATION.fr,
    pack: RENONCIATION.fr + " Les 3 retours du pack sont valables 6 mois à compter du premier envoi.",
    prog: "Abonnement : 499 € tous les 3 mois, reconduit automatiquement jusqu'à résiliation, résiliable à tout moment avec effet à la fin de la période en cours. " + RENONCIATION.fr,
  },
  en: {
    single: RENONCIATION.en,
    pack: RENONCIATION.en + " The pack's 3 analyses are valid for 6 months from your first video.",
    prog: "Subscription: €499 every 3 months, renewed automatically until cancelled; you can cancel at any time, effective at the end of the current period. " + RENONCIATION.en,
  },
};
const PRELEVEMENT = {
  fr: "Vous serez prélevé de 499 € aujourd'hui, puis tous les 3 mois jusqu'à résiliation.",
  en: "You will be charged €499 today, then every 3 months until you cancel.",
};
const VALIDE_JOURS = 180; // accès WhatsApp d'un achat unique
const ABO_ACTIF = ["active", "trialing", "past_due"];
// Places simultanées. Pack : achats des 180 derniers jours. Programme : abonnements en cours.
const PLACES = { pack: { total: 6, jours: 180 }, prog: { total: 2 } };

// E-mail de confirmation (option A) : Stripe joint une facture dont le mémo contient un lien d'accès
// personnel, loandrouard.com/acces/<jeton>, qui rouvre la carte payée (bouton WhatsApp + QR code)
// sur n'importe quel appareil. Le jeton est rangé dans les métadonnées de la session (route /acces).
const SITE = "https://loandrouard.com";
const jeton = () => {
  const a = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  return [...crypto.getRandomValues(new Uint8Array(10))].map((x) => a[x % a.length]).join("");
};
// 33772041266 → +33 7 72 04 12 66
const lisible = (n) => n.length === 11 && n.startsWith("33") ? "+33 " + n[2] + n.slice(3).replace(/(\d\d)/g, " $1") : "+" + n;
const MEMO = {
  fr: (lien, numero) => "Merci ! Prochaine étape : envoyez votre vidéo à Loan sur WhatsApp.\n\n" +
    "Ouvrir votre accès (bouton WhatsApp + QR code) :\n" + lien + "\n\nWhatsApp : " + lisible(numero),
  en: (lien, numero) => "Thank you! Next step: send your video to Loan on WhatsApp.\n\n" +
    "Open your access (WhatsApp button + QR code):\n" + lien + "\n\nWhatsApp: " + lisible(numero),
};

// Formule d'une session : métadonnée (paiement intégré), sinon déduite du montant (liens de paiement).
const formuleDe = (s) => {
  const m = s.metadata && s.metadata.formule;
  if (FORMULES[m]) return m;
  return Object.keys(FORMULES).find((k) => FORMULES[k].montant === s.amount_total && s.currency === "eur");
};

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const autorise = !!origin && (env.SITE_ORIGIN || "").split(",").map((o) => o.trim()).includes(origin);
    const cors = autorise
      ? { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "GET, POST", "Access-Control-Allow-Headers": "Content-Type", "Vary": "Origin" }
      : {};
    const json = (data, status = 200) =>
      new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...cors } });

    if (request.method === "OPTIONS") return new Response(null, { status: autorise ? 204 : 403, headers: cors });
    if (!autorise) return json({ error: "origine" }, 403);

    const url = new URL(request.url);
    const stripe = (path, init = {}) =>
      fetch("https://api.stripe.com/v1/" + path, {
        ...init,
        headers: {
          Authorization: "Bearer " + env.STRIPE_SECRET_KEY,
          "Content-Type": "application/x-www-form-urlencoded",
          "Stripe-Version": "2025-03-31.basil",
        },
      });
    // Parcourt une liste Stripe (jusqu'à 2 000 objets) ; s'arrête si chaque() renvoie true.
    const parcourir = async (chemin, params, chaque) => {
      let apres = "";
      for (let page = 0; page < 20; page++) {
        const q = new URLSearchParams({ limit: "100", ...params });
        if (apres) q.set("starting_after", apres);
        const r = await stripe(chemin + "?" + q);
        if (!r.ok) throw new Error("stripe");
        const l = await r.json();
        for (const o of l.data) if (chaque(o)) return;
        if (!l.has_more || !l.data.length) return;
        apres = l.data[l.data.length - 1].id;
      }
    };
    const lister = async (chemin, params, garder) => {
      let n = 0;
      await parcourir(chemin, params, (o) => { if (garder(o)) n++; });
      return n;
    };
    const depuis = (jours) => String(Math.floor(Date.now() / 1000 - jours * 86400));

    const restantes = async () => {
      const [pack, prog] = await Promise.all([
        lister("checkout/sessions", { status: "complete", "created[gte]": depuis(PLACES.pack.jours) },
          (s) => s.payment_status === "paid" && formuleDe(s) === "pack"),
        lister("subscriptions", { price: FORMULES.prog.prix, status: "all" }, (a) => ABO_ACTIF.includes(a.status)),
      ]);
      return { pack: Math.max(0, PLACES.pack.total - pack), prog: Math.max(0, PLACES.prog.total - prog) };
    };

    // GET /places — { pack, prog } places restantes.
    if (url.pathname === "/places" && request.method === "GET") {
      try { return json(await restantes()); } catch (e) { return json({ error: "stripe" }, 502); }
    }

    // POST /checkout-session — session de paiement intégrée, alignée sur les liens de paiement Stripe.
    if (url.pathname === "/checkout-session" && request.method === "POST") {
      let formule = "";
      try { formule = (await request.json()).formule; } catch (e) { /* corps invalide */ }
      const f = FORMULES[formule];
      if (!f) return json({ error: "formule" }, 400);
      const langue = /^fr\b/i.test((request.headers.get("Accept-Language") || "").trim()) ? "fr" : "en";
      if (PLACES[formule]) {
        try { if ((await restantes())[formule] <= 0) return json({ error: "complet" }, 409); } catch (e) { /* Stripe indisponible : on n'empêche pas l'achat */ }
      }
      const corps = new URLSearchParams({
        ui_mode: "embedded",
        mode: f.mode,
        redirect_on_completion: "never",
        "line_items[0][price]": f.prix,
        "line_items[0][quantity]": "1",
        "metadata[formule]": formule,
        "phone_number_collection[enabled]": "true",
        "consent_collection[terms_of_service]": "required",
        "custom_text[terms_of_service_acceptance][message]": CASE[langue][formule],
      });
      if (f.mode === "subscription") {
        corps.set("subscription_data[metadata][formule]", formule);
        corps.set("custom_text[submit][message]", PRELEVEMENT[langue]);
        // Abonnement : Stripe crée lui-même la facture ; son mémo est le mémo par défaut du compte (tableau de bord).
      } else if (env.WHATSAPP_NUMBER) {
        const j = jeton();
        corps.set("metadata[acces]", j);
        corps.set("invoice_creation[enabled]", "true");
        corps.set("invoice_creation[invoice_data][description]", MEMO[langue](SITE + "/acces/" + j, env.WHATSAPP_NUMBER));
        corps.set("invoice_creation[invoice_data][metadata][formule]", formule);
      }
      const r = await stripe("checkout/sessions", { method: "POST", body: corps });
      const s = await r.json();
      if (!r.ok) return json({ error: "stripe", detail: s.error && s.error.message }, 502);
      return json({ clientSecret: s.client_secret, sessionId: s.id });
    }

    // GET /whatsapp?session_id=cs_… — numéro renvoyé UNIQUEMENT pour une session payée (et un abonnement encore actif).
    if (url.pathname === "/whatsapp" && request.method === "GET") {
      const sid = url.searchParams.get("session_id") || "";
      if (!/^cs_(live|test)_[A-Za-z0-9]{10,200}$/.test(sid)) return json({ error: "session" }, 400);
      const r = await stripe("checkout/sessions/" + sid);
      if (!r.ok) return json({ error: "session" }, 404);
      const s = await r.json();
      if (s.payment_status !== "paid" || s.status !== "complete") return json({ error: "non payée" }, 402);
      const formule = formuleDe(s);
      if (!formule) return json({ error: "produit" }, 402);
      if (s.subscription) {
        const a = await stripe("subscriptions/" + (typeof s.subscription === "string" ? s.subscription : s.subscription.id));
        if (!a.ok || !ABO_ACTIF.includes((await a.json()).status)) return json({ error: "abonnement terminé" }, 402);
      } else if (Date.now() / 1000 - s.created > VALIDE_JOURS * 86400) {
        return json({ error: "expirée" }, 402);
      } else if (s.payment_intent) {
        // Achat remboursé en totalité : l'accès se referme. Sans droit de lecture des paiements, on n'empêche rien.
        const p = await stripe("payment_intents/" + s.payment_intent + "?expand[]=latest_charge");
        if (p.ok) {
          const c = (await p.json()).latest_charge;
          if (c && c.refunded) return json({ error: "remboursée" }, 402);
        }
      }
      return json({ numero: env.WHATSAPP_NUMBER, formule });
    }

    // GET /acces?jeton=… — appelé par le site pour loandrouard.com/acces/<jeton> (lien de l'e-mail) :
    // renvoie la session payée qui porte ce jeton (achats des 180 derniers jours).
    if (url.pathname === "/acces" && request.method === "GET") {
      const j = url.searchParams.get("jeton") || "";
      if (!/^[A-Z0-9]{10}$/.test(j)) return json({ error: "jeton" }, 400);
      let trouvee = null;
      try {
        await parcourir("checkout/sessions", { status: "complete", "created[gte]": depuis(VALIDE_JOURS) },
          (s) => s.metadata && s.metadata.acces === j && (trouvee = s.id));
      } catch (e) { return json({ error: "stripe" }, 502); }
      return trouvee ? json({ session_id: trouvee }) : json({ error: "introuvable" }, 404);
    }

    return json({ error: "introuvable" }, 404);
  },
};
