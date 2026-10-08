/* Diagnostic TEMPORAIRE v2 — adresse de test uniquement (inséré par scripts/construire.mjs avec ESSAI=1 ;
   la construction normale échoue si ce fichier est référencé). Aucune donnée personnelle : tailles d'écran,
   positions de défilement, états de la page, durées d'images, erreurs. Rien n'est envoyé ailleurs que
   l'adresse de test (/__diag).
   Mesure sans fausser : durées d'images en mémoire (histogrammes) ; relevé d'état en mémoire toutes les 200 ms ;
   écriture dans localStorage une fois par seconde seulement (fil d'Ariane compact) ; panneau rafraîchi 1×/s.
   ?nodiag=1 diagnostic entièrement inactif (mesure de son surcoût)      ?diag=1 panneau      ?panneau=0 sans panneau
   ?auto=1   parcours automatiques (P1 défilement, P2 « See pricing »)    ?banc=1 enchaîne les versions (parcours)
   ?stress=1 endurance : allers-retours rapides projecteur blanc ↔ étude, 60 s, 3 passes par version, ordre alterné
   Séries BORNÉES (05/10) : une seule tentative par passe, au plus 2 chargements par page de la liste et 25 min,
   bouton « Arrêter le test ». Lecture des résultats gardés dans le navigateur : resultats.html (lecture seule).
   ?v=filtre,lvh,dvh,nuit,affiche  variantes à l'essai (affiche : will-change: filter sur le seul bouton See pricing)
   ?sans=faisceaux,rayons,halo,nuit,poussiere,flous,etude,lumiere  calques retirés (affichage seulement, géométrie inchangée :
     etude = les deux caméras de l'étude ; lumiere = tous les calques de lumière du projecteur, figure et textes gardés ;
     lumiere = mobiles + effets : mobiles = lumières qui se déplacent (textures de la proposition), effets = plein écran)
   ?stress=sans  tri : proposition, -etude, -lumiere, -etude-lumiere, 2 passes chacune, ordre alterné, sans témoin
   ?stress=lumiere  tri : proposition, -mobiles, -effets, 2 passes chacune, ordre alterné
   ?stress=mobiles  tri : proposition, -faisceaux, -rayons, -halo (halo, brume, éclat), -sol (sol, flaque, ombre)
   ?banc=bouton  contrôle de la vitrine See pricing, sans défilement rapide : proposition / variante en ordre ABBA
                 (&variante=nom, par défaut proposition+affiche ; ex. proposition-mobiles)
   ?banc=valide  validation de la correction « sousblanc » (corrige.html) : endurance 3 passes et vitrine 2 passes,
                 proposition / corrige en ordre alterné, une seule série
   ?pose=75|jonction|vitrine  pose fixe pour mesurer (inspecteur web de Safari, onglet Calques) : la page se place
                 (P 0,75 ; bas du projecteur à mi-écran ; See pricing ouvert) puis ne bouge plus, sans panneau */
(() => {
  if (window.__ldDiag) return; window.__ldDiag = 1;
  const Q = new URLSearchParams(location.search);
  if (Q.has("nodiag")) return;
  const h = document.documentElement, T0 = performance.now();
  const CLE = "ld-diag", CLE_INC = "ld-diag-incidents", CLE_SERIE = "ld-diag-serie";
  const lire = (k) => { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } };
  const ecrire = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const fichier = decodeURIComponent(location.pathname.split("/").pop() || "");
  const PAGE = { "actuel.html": "actuel", "textures.html": "textures", "corrige.html": "corrige", "avant.html": "avant" }[fichier] || "proposition";
  const V = (Q.get("v") || "").split(",").filter(Boolean), SANS = (Q.get("sans") || "").split(",").filter(Boolean);
  const NOM = PAGE + (V.length ? "+" + V.join("+") : "") + (SANS.length ? "-" + SANS.join("-") : "") + (Q.get("panneau") === "0" ? "#sanspanneau" : "");
  V.forEach((v) => h.classList.add("ldv-" + v)); SANS.forEach((s) => h.classList.add("lds-" + s));
  const SERIE = Q.get("serie"), AUTO = Q.has("auto") || SERIE === "auto", STRESS = SERIE === "stress", BOUTON = SERIE === "bouton";
  const PANNEAU = Q.get("panneau") !== "0" && (AUTO || STRESS || BOUTON || Q.has("diag") || Q.has("banc") || Q.has("stress"));

  /* Variantes A/B (candidats, voir PERFORMANCE.md) et retraits de calques (isolement d'une cause). */
  const st = document.createElement("style"); st.id = "ld-diag-css";
  st.textContent = `
.ldv-filtre :is(.vfp-affiche, .vfp-texte, .vfp-c, .vfp-reman img, .vfa-taiji, [data-vfa-eclat]) { will-change: filter; }
.ldv-lvh :is(.vfp-scene, .vfa-scene) { height: 100lvh; }
.ldv-lvh .vfp-voir { bottom: calc(24px + 5svh + 100lvh - 100svh); }
.ldv-lvh .vfp-mot--feedback.vfp-pour { bottom: calc(var(--vfp-marge-y) + 9svh + 100lvh - 100svh) !important; }
.ldv-lvh .vfa-pied { bottom: calc(18px + 100lvh - 100svh); }
.ldv-lvh .vfa-yang { bottom: calc(11svh + 100lvh - 100svh); }
@media (max-width: 899px) { .ldv-lvh .vfp-voir { bottom: calc(18px + 3svh + 100lvh - 100svh); } .ldv-lvh .vfa-pied { bottom: calc(12px + 100lvh - 100svh); } .ldv-lvh .vfa-yang { bottom: calc(8svh + 100lvh - 100svh); } .ldv-lvh .vfa-texte { bottom: calc(78px + 100lvh - 100svh); } }
.ldv-dvh :is(.vfp-scene, .vfa-scene) { height: 100dvh; }
.ldv-fig .vfp-fig img { will-change: opacity; }
.ldv-affiche .vfp-affiche { will-change: filter; }
.ldv-nuit.ld-couvert .vf-nuit { visibility: hidden; }
.ldv-nuit.ld-couvert .vf-nuit i { animation-play-state: paused; }
.lds-faisceaux .vfp-faisceau, .lds-rayons .vfp-rayons, .lds-halo :is(.vfp-halo, .vfp-brume, .vfp-eclat), .lds-nuit .vf-nuit, .lds-poussiere .vfp-poussiere { display: none !important; }
.lds-etude .vfa-cam, .lds-lumiere :is(.vfp-faisceau, .vfp-rayons, .vfp-halo, .vfp-brume, .vfp-eclat, .vfp-expo, .vfp-blanc, .vfp-reman, .vfp-poussiere, .vfp-sol, .vfp-flaque, .vfp-ombre) { display: none !important; }
.lds-mobiles :is(.vfp-faisceau, .vfp-rayons, .vfp-halo, .vfp-brume, .vfp-eclat, .vfp-sol, .vfp-flaque, .vfp-ombre), .lds-effets :is(.vfp-expo, .vfp-blanc, .vfp-reman, .vfp-poussiere), .lds-sol :is(.vfp-sol, .vfp-flaque, .vfp-ombre) { display: none !important; }
.lds-flous :is(.vfp-affiche, .vfp-texte, .vfp-c, .vfp-reman img, .vfa-taiji, [data-vfa-eclat]) { filter: none !important; }
#ld-diag-p { position: fixed; right: 4px; top: 4px; z-index: 2147483600; max-width: min(380px, 72vw); padding: 4px 6px; border-radius: 6px; background: rgba(0,0,0,.72); color: #e8f5e0; font: 9px/1.3 ui-monospace, Menlo, monospace; white-space: pre-wrap; pointer-events: none; -webkit-text-size-adjust: none; }
#ld-diag-p b { color: #ffd479; font-weight: 600; }
#ld-diag-t { position: fixed; inset: 8px; z-index: 2147483601; overflow: auto; padding: 10px; border-radius: 8px; background: rgba(8,8,8,.94); color: #f2f2f2; font: clamp(8.5px, 2.45vw, 12px)/1.4 ui-monospace, Menlo, monospace; white-space: pre-wrap; -webkit-text-size-adjust: none; }
#ld-diag-t b { color: #ffd479; } #ld-diag-t .ko { color: #ff8080; } #ld-diag-t .ok { color: #9be58f; }
#ld-diag-go { position: fixed; left: 50%; top: 50%; transform: translate(-50%, -50%); z-index: 2147483602; padding: 18px 26px; border: 0; border-radius: 12px; background: #ffd479; color: #111; font: 600 17px/1.3 -apple-system, system-ui, sans-serif; text-align: center; }
#ld-diag-stop { position: fixed; left: 6px; bottom: 6px; z-index: 2147483602; padding: 9px 13px; border: 0; border-radius: 9px; background: rgba(0,0,0,.78); color: #ffd479; font: 600 13px/1.2 -apple-system, system-ui, sans-serif; }`;
  (document.head || h).appendChild(st);

  /* --- Mesures (en mémoire) ----------------------------------------------------------------------- */
  const $ = (q) => document.querySelector(q);
  const sondes = {};
  const poserSondes = () => {
    for (const u of ["svh", "lvh", "dvh"]) { const d = document.createElement("i"); d.setAttribute("aria-hidden", "true"); d.style.cssText = `position:absolute;left:0;top:0;width:1px;height:100${u};visibility:hidden;pointer-events:none`; h.appendChild(d); sondes[u] = d; }
  };
  const ua = (() => { const u = navigator.userAgent, m = u.match(/Version\/([\d.]+)/), c = u.match(/(?:Chrome|CriOS)\/(\d+)/);
    return (/iPhone|iPad/.test(u) ? "iOS " : /Mac OS X/.test(u) ? "Mac " : "") + (c ? "Chrome " + c[1] : m ? "Safari " + m[1] : "autre"); })();
  const info = () => ({ ua, dpr: window.devicePixelRatio, ih: innerHeight, vv: window.visualViewport ? Math.round(window.visualViewport.height) : null,
    svh: sondes.svh && sondes.svh.offsetHeight, lvh: sondes.lvh && sondes.lvh.offsetHeight, dvh: sondes.dvh && sondes.dvh.offsetHeight,
    entete: ($(".ld-header") || {}).offsetHeight });

  // Progression du projecteur : même formule que maj() dans Video Feedback (P plafonné à 0,8 ; Rp continue).
  const projecteur = () => {
    const sec = $("#hero"), sc = sec && sec.querySelector(".vfp-scene");
    if (!sc) return null;
    const H = sc.clientHeight, r = sec.getBoundingClientRect(), tenue = 1.25 * H, plage = Math.max(1, sec.offsetHeight - tenue - H - 0.8 * H), s0 = 0.198 * plage, s1 = -r.top;
    const s = s1 < s0 ? s1 : s1 < s0 + tenue ? s0 + (s1 - s0) * 0.006 : s1 - tenue * 0.994, Rp = Math.min(1, Math.max(0, s / plage));
    return { P: Math.min(0.8, Rp / 0.6), Rp, r, sc, sec, H, tenue, plage, s0 };
  };
  const ecran = (el) => { if (!el) return false; const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight && r.height > 0; };
  // Parties réellement à l'écran (et non l'état mémorisé du projecteur) :
  // H projecteur · E étude · N étude noire (yin-yang) · K planche des formules · F pied · M paiement ouvert.
  const surEcran = (p) => {
    let s = "";
    if (p && p.sc.style.visibility !== "hidden" && ecran(p.sc)) s += "H";
    const es = $(".vfa-scene"); if (es && ecran(es) && (es.style.opacity === "" || parseFloat(es.style.opacity) > 0.01)) { s += "E"; const n = $(".vfa-noir"); if (n && n.style.visibility === "visible") s += "N"; }
    const pin = $(".vfk-pin"), pa = $(".vfk-papier"); if (pin && ecran(pin) && pa && parseFloat(pa.style.opacity || "0") > 0.01) s += "K";
    if (ecran($(".vf > footer"))) s += "F";
    if ($(".vf-modale")) s += "M";
    return s;
  };
  // Calques lourds du projecteur actifs (seulement si le projecteur est à l'écran) : B brume R rayons X expo E éclat W blanc M rémanence.
  const CALQUES = [[".vfp-brume", "B"], [".vfp-rayons", "R"], [".vfp-expo", "X"], [".vfp-eclat", "E"], [".vfp-blanc", "W"], [".vfp-reman", "M"]];
  const calques = () => CALQUES.filter(([q]) => { const e = $(q); return e && e.offsetParent !== null && e.style.visibility !== "hidden" && (e.style.opacity === "" || parseFloat(e.style.opacity) > 0.01); }).map((c) => c[1]).join("");
  const PH = { chargement: "ch", ouverture: "ou", texte: "tx", lumiere: "lu", eblouissement: "eb", blanc: "bl", vitrine: "vi", etude: "et", planche: "pl", pied: "pi", autre: "--" };
  const calculerPhase = (p) => {
    if ($("#ld-chargement")) return "chargement";
    const mi = innerHeight / 2;
    if (p && p.sc.hasAttribute("data-vitrine")) return "vitrine";
    const pied = $(".vf > footer"), form = $("#formules"), etu = $("#analysis");
    if (pied && pied.getBoundingClientRect().top < mi) return "pied";
    if (form && form.getBoundingClientRect().top < mi) return "planche";
    if (p && p.r.bottom > mi) return p.P < 0.08 ? "ouverture" : p.P < 0.34 ? "texte" : p.P < 0.54 ? "lumiere" : p.P < 0.8 ? "eblouissement" : "blanc";
    return etu && etu.getBoundingClientRect().top < mi ? "etude" : "autre";
  };
  const PHASES = ["ouverture", "texte", "lumiere", "eblouissement", "blanc", "vitrine", "etude", "planche", "pied"];
  let phase = "chargement", dernierMvt = 0, etape = "", passe = "", arrivee = null, finEcran = null, ecartMax = { hero: 0, etude: 0 }, vMax = 0;
  // Durées d'images par phase : histogramme (1 ms, 0–250 ms) en mémoire, compté seulement pendant un mouvement.
  const hist = {}; let tPrec = 0;
  const image = (t) => {
    if (tPrec && t - dernierMvt < 450 && !document.hidden) { const d = Math.min(250, Math.round(t - tPrec)); (hist[phase] || (hist[phase] = new Array(251).fill(0)))[d]++; }
    tPrec = t; requestAnimationFrame(image);
  };
  const stats = (H) => { if (!H) return null; const n = H.reduce((a, b) => a + b, 0); if (n < 10) return null; const q = (f) => { let c = 0; for (let i = 0; i <= 250; i++) { c += H[i]; if (c >= f * n) return i; } return 250; };
    let l25 = 0; for (let i = 26; i <= 250; i++) l25 += H[i];
    return { n, p50: q(0.5), p95: q(0.95), pc25: Math.round(100 * l25 / n) }; };
  const bilan = () => Object.fromEntries(PHASES.map((p) => [p, stats(hist[p])]).filter(([, s]) => s));
  addEventListener("scroll", () => { dernierMvt = performance.now(); }, { passive: true, capture: true });
  // Erreurs : JS, « ResizeObserver loop » (compté à part), ressources en échec (liste complète, chemin seul).
  const erreurs = [], ressources = []; let ro = 0;
  addEventListener("error", (e) => {
    const t = e.target;
    if (t && t !== window && (t.src || t.href)) { const u = String(t.src || t.href).replace(/^https?:\/\/[^/]+/, "").replace(/\?.*/, ""); if (ressources.length < 20) ressources.push((t.tagName || "").toLowerCase() + " " + u.slice(-70)); return; }
    const m = String(e.message || ""); if (/ResizeObserver loop/.test(m)) { ro++; return; } if (erreurs.length < 10) erreurs.push(m.slice(0, 110));
  }, true);
  addEventListener("unhandledrejection", (e) => { if (erreurs.length < 10) erreurs.push(("promesse " + (e.reason && e.reason.message || e.reason)).slice(0, 110)); });

  /* --- Fil d'Ariane : relevé en mémoire / 200 ms, écrit dans localStorage / 1 s (survit à un arrêt brutal) --- */
  const sid = Math.random().toString(36).slice(2, 8), debut = Date.now();
  let etatPage = "en-cours";
  const releves = []; // [t (s), y, phase, P×100, à l'écran, caméras étude (w = will-change), vitesse px/s, calques du projecteur]
  const etatDisque = () => ({ sid, page: NOM, passe, debut, dernier: Date.now(), etat: etatPage, etape, ph: phase, j: releves.slice(-15), st: bilan(), ro, err: erreurs.slice(-5), res: ressources.slice(0, 10), finEcran, info: info() });
  const enregistrer = () => ecrire(CLE, etatDisque());
  const prec = lire(CLE);
  let incident = null;
  if (prec && prec.etat === "en-cours" && Date.now() - prec.dernier < 180000) {
    incident = { quand: new Date(prec.dernier).toISOString().slice(11, 19), page: prec.page, passe: prec.passe, apres: Math.round((prec.dernier - prec.debut) / 1000), etape: prec.etape, ph: prec.ph, j: (prec.j || []).slice(-8), st: prec.st || {}, ro: prec.ro, res: prec.res, err: prec.err };
    const l = lire(CLE_INC) || []; l.push(incident); ecrire(CLE_INC, l.slice(-10));
    envoyer({ type: "interruption", incident });
  }
  function envoyer(o) { try { navigator.sendBeacon && navigator.sendBeacon("/__diag", JSON.stringify(Object.assign({ sid, page: NOM }, o))); } catch (e) {} }
  addEventListener("pagehide", () => { etatPage = "fermee"; enregistrer(); });
  document.addEventListener("visibilitychange", () => { etatPage = document.hidden ? "cachee" : "en-cours"; enregistrer(); });

  let tick = 0, couvert = false, yPrec = 0, tReleve = 0, enEcran = !!$("#ld-chargement");
  const relever = () => {
    try {
      const p = projecteur(), now = performance.now();
      phase = calculerPhase(p);
      if (enEcran && !$("#ld-chargement")) { // fin de l'écran de chargement : feuilles de style non appliquées à cet instant ?
        enEcran = false; const nonAppl = [...document.querySelectorAll('link[rel="stylesheet"]')].filter((l) => !l.sheet).map((l) => (l.getAttribute("href") || "").split("/").pop().slice(0, 30));
        finEcran = { t: Math.round(now - T0), feuilles: nonAppl.length, noms: nonAppl.slice(0, 4), polices: document.fonts ? document.fonts.status : "?" };
      }
      if (p) { const rs = p.sc.getBoundingClientRect(); if (Math.abs(rs.top) <= 1 && p.sc.style.visibility !== "hidden") ecartMax.hero = Math.max(ecartMax.hero, Math.round(Math.max(innerHeight, window.visualViewport ? window.visualViewport.height : 0) - rs.bottom)); }
      const as = $(".vfa-scene"); if (as && phase === "etude") { const ra = as.getBoundingClientRect(); if (Math.abs(ra.top) <= 1) ecartMax.etude = Math.max(ecartMax.etude, Math.round(innerHeight - ra.bottom)); }
      if (h.classList.contains("ldv-nuit")) { // variante « nuit » : fond fixe caché quand une scène opaque couvre l'écran
        const sc = p && p.sc, rs = sc && sc.getBoundingClientRect(), c = !!(sc && rs.top <= 0 && rs.bottom >= innerHeight - 1 && sc.style.visibility !== "hidden");
        if (c !== couvert) { couvert = c; h.classList.toggle("ld-couvert", c); }
      }
      const y = Math.round(scrollY), v = tReleve ? Math.round((y - yPrec) / ((now - tReleve) / 1000)) : 0; yPrec = y; tReleve = now; vMax = Math.max(vMax, Math.abs(v));
      const ec = surEcran(p), cam = $(".vfa-scene > .vfa-cam");
      releves.push([Math.round((now - T0) / 100) / 10, y, PH[phase] || "--", p ? Math.round(p.P * 100) : -1, ec, cam && cam.style.willChange === "transform" ? "w" : "", v, ec.includes("H") ? calques() : ""]);
      if (releves.length > 40) releves.splice(0, releves.length - 40);
      if (++tick % 5 === 0) { enregistrer(); if (PANNEAU) dessinerPanneau(p); }
    } catch (e) {}
  };

  /* --- Panneau (1×/s) ----------------------------------------------------------------------------- */
  let pan = null;
  function dessinerPanneau(p) {
    if (!document.body) return;
    if (!pan) { pan = document.createElement("div"); pan.id = "ld-diag-p"; h.appendChild(pan); }
    const i = info(), s = stats(hist[phase]), r = releves[releves.length - 1] || [];
    pan.innerHTML = `<b>${NOM}</b>${passe ? " " + passe : ""} ${ua} dpr ${i.dpr}\n` +
      `ih ${i.ih} vv ${i.vv} svh ${i.svh} lvh ${i.lvh} dvh ${i.dvh} · en-tête ${i.entete}\n` +
      `y ${Math.round(scrollY)} · ${phase}${p ? " P " + p.P.toFixed(2) : ""} · écran ${r[4] || "—"}${r[5] ? " cam:w" : ""} · arrivée ${arrivee === null ? "…" : arrivee}\n` +
      `images ${s ? "p50 " + s.p50 + " p95 " + s.p95 + " ms, >25 ms " + s.pc25 + " %" : "—"} · écart bas ${ecartMax.hero}/${ecartMax.etude}` +
      (finEcran ? `\nécran de chargement fini à ${finEcran.t} ms, feuilles non appliquées ${finEcran.feuilles}` : "") +
      (etape ? "\n<b>" + etape + "</b>" : "") +
      (incident ? `\n<b>Interruption détectée</b> (${incident.page}${incident.passe ? " " + incident.passe : ""}, ${incident.apres} s, ${incident.etape || "-"}, ${incident.ph})` : "") +
      `\nRO ${ro} · erreurs ${erreurs.length} · ressources en échec ${ressources.length}${ressources.length ? " : " + ressources[ressources.length - 1] : ""}`;
  }

  /* --- Défilement automatique ------------------------------------------------------------------- */
  let ARRET = false; // bouton « Arrêter le test » (séries)
  const dormir = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const attendreVisible = async () => { while (document.hidden) await dormir(300); };
  const defiler = (cible, vitesse, maxMs) => new Promise((ok) => { // vitesse en hauteurs d'écran par seconde
    let tp = 0, tBloque = performance.now(), yP = scrollY; const t0 = performance.now();
    const pas = (t) => {
      const dt = tp ? Math.min(0.05, (t - tp) / 1000) : 1 / 60; tp = t; dernierMvt = performance.now();
      const y = scrollY, dir = Math.sign(cible - y), v = vitesse * innerHeight * dt;
      if (ARRET || Math.abs(cible - y) < 2 || t - t0 > maxMs) return ok();
      if (Math.abs(y - yP) > 0.5) { tBloque = t; yP = y; } else if (t - tBloque > 4000) return ok(); // verrou du retournement : on attend, puis on renonce
      window.scrollTo(0, dir > 0 ? Math.min(cible, y + v) : Math.max(cible, y - v));
      requestAnimationFrame(pas);
    };
    requestAnimationFrame(pas);
  });
  const finHero = () => { const s = $("#hero"); return s ? s.getBoundingClientRect().bottom + scrollY - innerHeight : 0; };
  const basPage = () => document.documentElement.scrollHeight - innerHeight;
  const centre = (el) => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
  const pointer = (el, x, y) => el.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: x, clientY: y, pointerType: "mouse" }));
  const pret = async () => { while ($("#ld-chargement")) await dormir(200); if (document.fonts && document.fonts.ready) await document.fonts.ready; };
  const garderEveil = async () => { try { if (navigator.wakeLock) await navigator.wakeLock.request("screen"); } catch (e) {} };
  const resultat = (extra) => Object.assign({ nom: NOM, passe, arrivee, phases: bilan(), ecart: ecartMax, ro, err: erreurs.slice(-5), res: ressources.slice(0, 10), finEcran, vMax, info: info(), plantage: null }, extra || {});
  async function parcours1() {
    etape = "P1 lent"; await defiler(finHero(), 0.5, 60000);
    etape = "P1 rapide"; await defiler(basPage(), 4, 40000);
    etape = "P1 remontée"; await defiler(0, 3, 40000);
    await dormir(800);
  }
  async function parcours2() {
    etape = "P2 See pricing"; await dormir(1200); dernierMvt = performance.now();
    const aff = $(".vfp-affiche"); if (aff) aff.click();
    const garder = setInterval(() => { dernierMvt = performance.now(); }, 200);
    await dormir(2600);
    if (innerWidth >= 900) { etape = "P2 cartes"; for (const c of document.querySelectorAll(".vfp-cartes > .vfp-c")) { const a = centre(c); for (let k = 0; k <= 10; k++) { pointer(c, a.x - 60 + 12 * k, a.y); await dormir(90); } await dormir(300); } }
    etape = "P2 Back to Loan"; const b = $(".vfp-voir-f button, .vfp-voir-f a"); if (b) b.click();
    await dormir(2200); clearInterval(garder);
    etape = "P2 reprise"; await defiler(1.5 * innerHeight, 0.5, 20000); await defiler(0, 2, 20000); await dormir(600);
  }
  async function lancerAuto() {
    await pret(); await dormir(1500); arrivee = Math.round(scrollY);
    h.style.scrollBehavior = "auto"; await garderEveil();
    for (let k = 1; k <= 2 && !ARRET; k++) { await attendreVisible(); await parcours1(); }
    for (let k = 1; k <= 2 && !ARRET; k++) { await attendreVisible(); await parcours2(); }
    h.style.scrollBehavior = ""; etape = "terminé";
    return resultat();
  }
  // Contrôle du bouton See pricing (variante affiche) : aucun défilement rapide, pour que des arrêts sans lien avec
  // le bouton ne brouillent pas la comparaison. Repos en haut (images comptées aussi au repos, bouton à l'écran),
  // See pricing × 2, puis descente et remontée lentes dans le projecteur.
  async function lancerBouton() {
    await pret(); arrivee = Math.round(scrollY);
    h.style.scrollBehavior = "auto"; await garderEveil();
    etape = "B repos"; const garder = setInterval(() => { dernierMvt = performance.now(); }, 200);
    await dormir(9000); clearInterval(garder);
    for (let k = 1; k <= 2 && !ARRET; k++) { await attendreVisible(); await parcours2(); }
    if (!ARRET) { etape = "B descente lente"; await defiler(finHero(), 0.5, 60000); etape = "B remontée lente"; await defiler(0, 0.5, 60000); }
    h.style.scrollBehavior = ""; etape = "terminé";
    return resultat();
  }
  // Pose fixe pour une mesure dans l'inspecteur web : la page se place une fois, puis plus rien ne bouge.
  async function poser(cible) {
    await pret(); h.style.scrollBehavior = "auto";
    if (cible === "vitrine") { await dormir(9000); const aff = $(".vfp-affiche"); if (aff) aff.click(); return; }
    const sec = $("#hero"); if (!sec) return;
    const abs = (el) => el.getBoundingClientRect().top + scrollY;
    if (cible === "jonction") { window.scrollTo(0, abs(sec) + sec.offsetHeight - 0.5 * innerHeight); return; }
    const P = parseFloat(cible) / 100, q = projecteur(); if (!q || !(P >= 0 && P <= 0.8)) return;
    const s = 0.6 * P * q.plage; window.scrollTo(0, abs(sec) + (s < q.s0 ? s : s + q.tenue * 0.994)); // même formule que maj()
  }
  // Endurance : depuis le haut (page neuve, pause de 3 s), allers-retours rapides entre le projecteur en
  // éblouissement (P 0,7) et l'étude (son début + 1,2 écran), 60 s, à 3,5 hauteurs d'écran par seconde.
  // duree : durée des allers-retours en secondes (60 ; plus court seulement pour les vérifications locales).
  async function lancerStress(duree) {
    await pret(); await dormir(3000); arrivee = Math.round(scrollY);
    h.style.scrollBehavior = "auto"; await garderEveil();
    const p = projecteur(), etu = $("#analysis");
    const yA = () => { const q = projecteur(); return q.sec.getBoundingClientRect().top + scrollY + 0.42 * q.plage + q.tenue * 0.994; };
    const yB = () => etu.getBoundingClientRect().top + scrollY + 1.2 * innerHeight;
    if (!p || !etu) return resultat({ erreurStress: "sections introuvables" });
    etape = "S descente"; await defiler(yA(), 3.5, 20000);
    const t0 = performance.now(); let n = 0;
    while (!ARRET && performance.now() - t0 < 1000 * (duree || 60)) { await attendreVisible(); etape = "S aller " + (++n); await defiler(yB(), 3.5, 15000); etape = "S retour " + n; await defiler(yA(), 3.5, 15000); }
    etape = "S fin"; await defiler(0, 3.5, 20000); h.style.scrollBehavior = ""; etape = "terminé";
    return resultat({ allersRetours: n });
  }

  /* --- Séries : versions enchaînées, résultats gardés d'une page à l'autre (et après un arrêt) ---------- */
  // Nom d'un élément : page[+variante…][-retrait…][#sanspanneau], ex. « proposition+nuit », « proposition-etude-lumiere ».
  const adresse = (it) => { const [corps, ...sans] = it.nom.split("#")[0].split("-"), [p, ...v] = corps.split("+"), q = new URLSearchParams();
    q.set("serie", it.mode); q.set("passe", it.passe || ""); if (v.length) q.set("v", v.join(",")); if (sans.length) q.set("sans", sans.join(",")); if (it.nom.includes("#sanspanneau")) q.set("panneau", "0");
    return ({ actuel: "actuel.html", textures: "textures.html", corrige: "corrige.html", avant: "avant.html" }[p] || "./") + "?" + q.toString(); };
  // Endurance : 3 passes par version, ordre alterné (carré latin), plus une passe sans panneau hors comparaison.
  // ?stress=sans : tri des retraits (2 passes par version suffisent à repérer une variante qui se distingue ; à confirmer ensuite).
  const PRESETS = { sans: "proposition,proposition-etude,proposition-lumiere,proposition-etude-lumiere", lumiere: "proposition,proposition-mobiles,proposition-effets",
    mobiles: "proposition,proposition-faisceaux,proposition-rayons,proposition-halo,proposition-sol" }, PRESET = PRESETS[Q.get("stress")];
  const VERSIONS = (Q.get("versions") || PRESET || "actuel,proposition,proposition+nuit").split(","), PASSES = +(Q.get("passes") || (PRESET ? 2 : 3));
  const planStress = () => { const l = []; for (let k = 0; k < PASSES; k++) for (let j = 0; j < VERSIONS.length; j++) l.push({ nom: VERSIONS[(j + k) % VERSIONS.length], passe: "p" + (k + 1), mode: "stress" });
    if (!Q.has("versions") && !PRESET) l.push({ nom: "proposition#sanspanneau", passe: "témoin", mode: "stress" }); return l; };
  const VARIANTE = Q.get("variante") || "proposition+affiche";
  const planBouton = () => [["proposition", "p1"], [VARIANTE, "p1"], [VARIANTE, "p2"], ["proposition", "p2"]].map(([nom, passe]) => ({ nom, passe, mode: "bouton" }));
  // Validation d'une correction : endurance (e1–e3) puis vitrine (v1–v2), référence et version corrigée en ordre alterné.
  const planValide = () => [["proposition", "e1"], ["corrige", "e1"], ["corrige", "e2"], ["proposition", "e2"], ["proposition", "e3"], ["corrige", "e3"]].map(([nom, passe]) => ({ nom, passe, mode: "stress" }))
    .concat([["corrige", "v1"], ["proposition", "v1"], ["proposition", "v2"], ["corrige", "v2"]].map(([nom, passe]) => ({ nom, passe, mode: "bouton" })));
  const planBanc = () => (Q.get("liste") || "actuel,textures,proposition,proposition+filtre,proposition+nuit").split(",").map((n) => ({ nom: n, passe: "", mode: "auto" }));
  // Série BORNÉE (format v: 2) : l'état est enregistré avant chaque passe (enCours) et aussitôt après chaque
  // chargement. Une passe qui ne va pas au bout (arrêt brutal, page en arrière-plan supprimée, rechargement), quel
  // que soit le délai avant le rechargement, est comptée UNE fois comme arrêt et jamais relancée. Fin garantie :
  // liste épuisée, 25 min, plus de 2 chargements par page de la liste, ou bouton « Arrêter le test ».
  const LIMITE_MS = 25 * 60000;
  const suivant = (s) => { ecrire(CLE_SERIE, s); etatPage = "fermee"; enregistrer(); location.replace(adresse(s.liste[s.i])); };
  const terminer = (s, cause) => { s.fini = true; s.arret = cause; s.enCours = null; s.fin = Date.now(); ecrire(CLE_SERIE, s); envoyer({ type: s.type + "-fini", serie: s }); tableau(s); };
  const avis = (txt) => { const t = document.createElement("div"); t.id = "ld-diag-t"; t.innerHTML = txt + "\n\n(toucher pour fermer)"; t.addEventListener("click", () => t.remove()); h.appendChild(t); };
  // Passe interrompue : dernier état enregistré par CETTE passe (même sid) — en cours = arrêt brutal du processus,
  // cachée = page en arrière-plan supprimée par le système, fermée = rechargement ou fermeture ordinaire.
  const interruption = (s) => {
    const it = s.liste[s.enCours.i], d = prec && prec.sid === s.enCours.sid ? prec : null, fin = d ? d.dernier : s.enCours.t;
    const pl = { type: !d ? "inconnu" : d.etat === "en-cours" ? "brutal" : d.etat === "cachee" ? "arrière-plan" : "fermée",
      quand: new Date(fin).toISOString().slice(11, 19), apres: d ? Math.round((d.dernier - d.debut) / 1000) : null, delai: Math.round((Date.now() - fin) / 1000),
      etape: d ? d.etape : "", ph: d ? d.ph : "?", j: d ? (d.j || []).slice(-8) : [], st: d ? d.st || {} : {}, ro: d ? d.ro : null, res: d ? d.res : null, err: d ? d.err : null };
    return { nom: it.nom, passe: it.passe, plantage: pl, phases: pl.st, ro: pl.ro, res: pl.res, info: info() };
  };
  const boutonArret = () => {
    const bt = document.createElement("button"); bt.id = "ld-diag-stop"; bt.type = "button"; bt.textContent = "Arrêter le test";
    bt.onclick = () => { if (ARRET) return; ARRET = true; bt.remove(); h.style.scrollBehavior = "";
      const s = lire(CLE_SERIE); if (!s || s.fini) return;
      if (s.enCours) { s.res.push(resultat({ interrompu: "manuel" })); s.i = s.enCours.i + 1; }
      terminer(s, "manuel"); };
    h.appendChild(bt);
  };
  async function serie() {
    let s = lire(CLE_SERIE);
    if (!SERIE) { // page de départ (?stress=1 ou ?banc=1) : un toucher pour démarrer (garde l'écran allumé)
      const stress = Q.has("stress"), bouton = !stress && Q.get("banc") === "bouton", valide = !stress && Q.get("banc") === "valide";
      const liste = stress ? planStress() : bouton ? planBouton() : valide ? planValide() : planBanc();
      const bt = document.createElement("button"); bt.id = "ld-diag-go";
      bt.innerHTML = (stress ? "Démarrer le test d'endurance" : bouton ? "Démarrer le contrôle du bouton" : valide ? "Démarrer la validation" : "Démarrer le banc") + `<br><small>${liste.length} pages · environ ${Math.round(liste.length * (stress || valide ? 1.25 : bouton ? 1.2 : 2))} min · 25 min au plus</small>` +
        (s && !s.fini ? "<br><small>(remplace la série précédente, non terminée : la lire d'abord avec resultats.html)</small>" : "");
      bt.onclick = async () => { await garderEveil(); ecrire(CLE, null);
        suivant({ v: 2, type: stress ? "stress" : bouton ? "bouton" : valide ? "validation" : "banc", liste, i: 0, res: [], debut: Date.now(), chargements: 0, enCours: null, duree: +Q.get("duree") || 60 }); };
      h.appendChild(bt); return;
    }
    if (!s || s.fini) return;
    if (s.v !== 2) { avis("<b>Ancienne série</b> (avant le protocole borné) : rien n'est lancé ni modifié.\nRésultats : resultats.html"); return; }
    s.chargements = (s.chargements || 0) + 1;
    if (s.enCours) { s.res.push(interruption(s)); s.i = s.enCours.i + 1; s.enCours = null; } // une seule tentative par passe
    if (s.i >= s.liste.length) return terminer(s, "complet");
    if (Date.now() - s.debut > LIMITE_MS) return terminer(s, "durée");
    if (s.chargements > 2 * s.liste.length) return terminer(s, "chargements");
    ecrire(CLE_SERIE, s); // enregistré tout de suite, avant toute autre action
    const it = s.liste[s.i];
    if (it.nom !== NOM || (it.passe || "") !== (Q.get("passe") || "")) { await dormir(1000); suivant(s); return; } // pas la bonne page : on y va
    passe = it.passe;
    s.enCours = { i: s.i, t: Date.now(), sid }; ecrire(CLE_SERIE, s); enregistrer(); // dernier état au nom de cette passe dès le départ
    boutonArret();
    const r = STRESS ? await lancerStress(s.duree) : BOUTON ? await lancerBouton() : await lancerAuto();
    if (ARRET) return; // arrêt manuel : déjà enregistré par le bouton
    s = lire(CLE_SERIE) || s; s.res.push(r); s.i++; s.enCours = null; envoyer({ type: s.type, resultat: r });
    if (s.i < s.liste.length) suivant(s); else terminer(s, "complet");
  }
  const COURT = (n) => n.replace("proposition", "prop").replace("#sanspanneau", " (sans panneau)");
  function tableau(s) {
    const t = document.createElement("div"); t.id = "ld-diag-t";
    const i0 = info();
    const CAUSE = { complet: "terminé", manuel: "arrêté avec le bouton (résultats partiels)", "durée": "arrêté : limite de 25 min atteinte (résultats partiels)", chargements: "arrêté : trop de rechargements (résultats partiels)" };
    let txt = `<b>${s.type === "stress" ? "Endurance" : s.type === "bouton" ? "Contrôle du bouton" : s.type === "validation" ? "Validation" : "Banc"} ${CAUSE[s.arret] || "terminé"}</b> — ${new Date().toLocaleString()}\n${ua} · dpr ${devicePixelRatio} · écran ${screen.width}×${screen.height}\nih ${i0.ih} vv ${i0.vv} · svh ${i0.svh} lvh ${i0.lvh} dvh ${i0.dvh} · en-tête ${i0.entete}\n`;
    if (s.liste) txt += `pages ${Math.min(s.i, s.liste.length)}/${s.liste.length} · chargements ${s.chargements || "?"} · durée ${s.debut ? Math.round(((s.fin || Date.now()) - s.debut) / 6000) / 10 + " min" : "?"}\n`;
    // Validation : regroupement par version ET par épreuve (endurance e…, vitrine v…).
    const vit = (r) => s.type === "bouton" || (s.type === "validation" && (r.passe || "")[0] === "v");
    const cle = (r) => r.nom + (s.type === "validation" ? (vit(r) ? " · vitrine" : " · endurance") : "");
    const noms = [...new Set(s.res.map(cle))];
    const f = (st) => (st ? st.p95 + "ms/" + st.pc25 + "%" : "—");
    for (const n of noms) {
      const rs = s.res.filter((r) => cle(r) === n), ko = rs.filter((r) => r.plantage);
      txt += `\n<b>${COURT(n)}</b> : arrêts ${ko.length}/${rs.length}\n`;
      for (const r of rs) {
        const ph = r.phases || {}, base = `  ${r.passe || "·"} `;
        if (r.plantage) { const pl = r.plantage, d = (pl.j || []).slice(-1)[0] || []; txt += `<span class="ko">${base}ARRÊT${pl.type ? " " + pl.type : ""} après ${pl.apres == null ? "?" : pl.apres} s, ${pl.etape || ""}, phase ${pl.ph}, écran ${d[4] || "?"}${d[5] ? " cam:w" : ""}, ${d[6] || 0} px/s${pl.delai != null ? ", rechargée " + pl.delai + " s plus tard" : ""}</span>\n`; }
        else if (r.interrompu) txt += `${base}interrompue (bouton)${r.allersRetours ? " · " + r.allersRetours + " allers-retours" : ""}\n`;
        else txt += `<span class="ok">${base}ok</span>${r.allersRetours ? " · " + r.allersRetours + " allers-retours" : ""}\n`;
        txt += `     images : ${vit(r) ? `repos/ouverture ${f(ph.ouverture)} · texte ${f(ph.texte)} · vitrine ${f(ph.vitrine)} · blanc ${f(ph.blanc)}` : `éblouiss. ${f(ph.eblouissement)} · blanc ${f(ph.blanc)} · étude ${f(ph.etude)}${s.type === "banc" ? " · planche " + f(ph.planche) : ""}`} · RO ${r.ro == null ? "—" : r.ro}${r.res && r.res.length ? " · ressources en échec " + r.res.length : ""}\n`;
      }
    }
    const ko = s.res.filter((r) => r.plantage);
    if (ko.length) {
      txt += "\nDerniers relevés avant chaque arrêt (t s, y, phase, P, à l'écran, cam, px/s, calques) :";
      for (const r of ko) txt += `\n<span class="ko">${COURT(r.nom)} ${r.passe || ""}</span>\n  ` + (r.plantage.j || []).slice(-4).map((j) => j.join(" ")).join("\n  ");
    }
    t.innerHTML = txt + "\n\n(toucher pour fermer)";
    t.addEventListener("click", () => t.remove());
    h.appendChild(t);
  }

  const demarrer = () => {
    poserSondes();
    setInterval(relever, 200); requestAnimationFrame(image);
    if (SERIE || Q.has("stress") || Q.has("banc")) serie();
    else if (Q.has("pose")) poser(Q.get("pose"));
    else if (Q.has("auto")) lancerAuto().then((r) => { ecrire("ld-diag-auto", r); envoyer({ type: "auto", resultat: r }); tableau({ type: "banc", res: [r] }); });
    else (async () => { await pret(); await dormir(800); arrivee = Math.round(scrollY); })();
    const fin = lire(CLE_SERIE); if (Q.has("diag") && fin && fin.fini && !SERIE) { const bt = document.createElement("button"); bt.textContent = "dernier test"; bt.style.cssText = "position:fixed;right:6px;bottom:6px;z-index:2147483600;font:11px ui-monospace,monospace"; bt.onclick = () => { tableau(fin); bt.remove(); }; h.appendChild(bt); }
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", demarrer); else demarrer();
})();
