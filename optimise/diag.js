/* Diagnostic TEMPORAIRE — adresse de test uniquement (inséré par scripts/construire.mjs avec ESSAI=1 ;
   la construction normale échoue si ce fichier est référencé). Aucune donnée personnelle : tailles d'écran,
   positions de défilement, états de la page, durées d'images, erreurs. Rien n'est envoyé ailleurs que
   l'adresse de test (/__diag).
   ?diag=1  panneau        ?auto=1  parcours automatiques (P1 défilement, P2 « See pricing »)
   ?banc=1  enchaîne les versions (actuel, textures, proposition…) et affiche un tableau final
   ?v=filtre,lvh,dvh,nuit,fig  variantes CSS à l'essai      ?sans=faisceaux,rayons,halo,nuit,poussiere,flous  calques retirés */
(() => {
  if (window.__ldDiag) return; window.__ldDiag = 1;
  const Q = new URLSearchParams(location.search), h = document.documentElement, T0 = performance.now();
  const CLE = "ld-diag", CLE_INC = "ld-diag-incidents", CLE_BANC = "ld-diag-banc";
  const lire = (k) => { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } };
  const ecrire = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const fichier = decodeURIComponent(location.pathname.split("/").pop() || "");
  const PAGE = { "actuel.html": "actuel", "textures.html": "textures" }[fichier] || "proposition";
  const V = (Q.get("v") || "").split(",").filter(Boolean), SANS = (Q.get("sans") || "").split(",").filter(Boolean);
  const NOM = PAGE + (V.length ? "+" + V.join("+") : "") + (SANS.length ? "-" + SANS.join("-") : "");
  V.forEach((v) => h.classList.add("ldv-" + v)); SANS.forEach((s) => h.classList.add("lds-" + s));
  const AUTO = Q.has("auto") || Q.get("banc") === "suite", PANNEAU = AUTO || Q.has("diag") || Q.has("banc");

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
.ldv-nuit.ld-couvert .vf-nuit { visibility: hidden; }
.ldv-nuit.ld-couvert .vf-nuit i { animation-play-state: paused; }
.lds-faisceaux .vfp-faisceau, .lds-rayons .vfp-rayons, .lds-halo :is(.vfp-halo, .vfp-brume, .vfp-eclat), .lds-nuit .vf-nuit, .lds-poussiere .vfp-poussiere { display: none !important; }
.lds-flous :is(.vfp-affiche, .vfp-texte, .vfp-c, .vfp-reman img, .vfa-taiji, [data-vfa-eclat]) { filter: none !important; }
#ld-diag-p { position: fixed; right: 4px; top: 4px; z-index: 2147483600; max-width: min(380px, 72vw); padding: 4px 6px; border-radius: 6px; background: rgba(0,0,0,.72); color: #e8f5e0; font: 9px/1.3 ui-monospace, Menlo, monospace; white-space: pre-wrap; pointer-events: none; -webkit-text-size-adjust: none; }
#ld-diag-p b { color: #ffd479; font-weight: 600; }
#ld-diag-t { position: fixed; inset: 8px; z-index: 2147483601; overflow: auto; padding: 10px; border-radius: 8px; background: rgba(8,8,8,.94); color: #f2f2f2; font: clamp(8.5px, 2.45vw, 12px)/1.4 ui-monospace, Menlo, monospace; white-space: pre-wrap; -webkit-text-size-adjust: none; }
#ld-diag-t b { color: #ffd479; } #ld-diag-t .ko { color: #ff8080; } #ld-diag-t .ok { color: #9be58f; }`;
  (document.head || h).appendChild(st);

  /* --- Mesures ------------------------------------------------------------------------------- */
  const $ = (q) => document.querySelector(q);
  const sondes = {};
  const poserSondes = () => {
    for (const u of ["svh", "lvh", "dvh", "vh"]) { const d = document.createElement("i"); d.setAttribute("aria-hidden", "true"); d.style.cssText = `position:absolute;left:0;top:0;width:1px;height:100${u};visibility:hidden;pointer-events:none`; h.appendChild(d); sondes[u] = d; }
  };
  const vv = () => (window.visualViewport ? Math.round(window.visualViewport.height) : null);
  const ua = (() => { const u = navigator.userAgent, m = u.match(/Version\/([\d.]+)/), c = u.match(/(?:Chrome|CriOS)\/(\d+)/);
    return (/iPhone|iPad/.test(u) ? "iOS " : /Mac OS X/.test(u) ? "Mac " : "") + (c ? "Chrome " + c[1] : m ? "Safari " + m[1] : "autre"); })();
  const info = () => ({ ua, dpr: window.devicePixelRatio, ecran: screen.width + "×" + screen.height, ih: innerHeight, iw: innerWidth, vv: vv(),
    svh: sondes.svh && sondes.svh.offsetHeight, lvh: sondes.lvh && sondes.lvh.offsetHeight, dvh: sondes.dvh && sondes.dvh.offsetHeight,
    entete: ($(".ld-header") || {}).offsetHeight, jeton: getComputedStyle($(".vf") || h).getPropertyValue("--hauteur-header").trim() });

  // Progression du projecteur : même formule que maj() dans Video Feedback (P plafonné à 0,8 ; Rp continue).
  const projecteur = () => {
    const sec = $("#hero"), sc = sec && sec.querySelector(".vfp-scene");
    if (!sc) return null;
    const H = sc.clientHeight, r = sec.getBoundingClientRect(), tenue = 1.25 * H, plage = Math.max(1, sec.offsetHeight - tenue - H - 0.8 * H), s0 = 0.198 * plage, s1 = -r.top;
    const s = s1 < s0 ? s1 : s1 < s0 + tenue ? s0 + (s1 - s0) * 0.006 : s1 - tenue * 0.994, Rp = Math.min(1, Math.max(0, s / plage));
    return { P: Math.min(0.8, Rp / 0.6), Rp, r, sc };
  };
  let phase = "chargement", dernierMvt = 0, ecartMax = { hero: 0, etude: 0 }, journal = [], erreurs = [], etape = "";
  const CALQUES = [[".vfp-brume", "brume"], [".vfp-rayons", "rayons"], [".vfp-expo", "expo"], [".vfp-eclat", "eclat"], [".vfp-blanc", "blanc"], [".vfp-reman", "reman"], [".vfa-noir", "noir"], [".vf-modale", "paiement"]];
  const calquesVisibles = () => CALQUES.filter(([q]) => { const e = $(q); return e && e.style.visibility !== "hidden" && (e.style.opacity === "" || parseFloat(e.style.opacity) > 0.01) && (q !== ".vfa-noir" || e.style.visibility === "visible"); }).map((c) => c[1]);
  const calculerPhase = () => {
    if ($("#ld-chargement")) return "chargement";
    const ih = innerHeight, mi = ih / 2, p = projecteur();
    if (p && p.sc.hasAttribute("data-vitrine")) return "vitrine";
    const pied = $(".vf > footer"), form = $("#formules"), etu = $("#analysis");
    if (pied && pied.getBoundingClientRect().top < mi) return "pied";
    if (form && form.getBoundingClientRect().top < mi) return "planche";
    if (p && p.r.bottom > mi) return p.P < 0.08 ? "ouverture" : p.P < 0.34 ? "texte" : p.P < 0.54 ? "lumiere" : p.P < 0.8 ? "eblouissement" : "blanc";
    return etu && etu.getBoundingClientRect().top < mi ? "etude" : "autre";
  };
  const PHASES = ["ouverture", "texte", "lumiere", "eblouissement", "blanc", "vitrine", "etude", "planche", "pied"];
  // Durées d'images par phase (histogramme 1 ms, 0–250 ms), comptées seulement pendant un mouvement.
  const hist = {}; let tPrec = 0;
  const image = (t) => {
    if (tPrec && t - dernierMvt < 450 && !document.hidden) { const d = Math.min(250, Math.round(t - tPrec)); (hist[phase] || (hist[phase] = new Array(251).fill(0)))[d]++; }
    tPrec = t; requestAnimationFrame(image);
  };
  const stats = (H) => { if (!H) return null; const n = H.reduce((a, b) => a + b, 0); if (n < 10) return null; const q = (f) => { let c = 0; for (let i = 0; i <= 250; i++) { c += H[i]; if (c >= f * n) return i; } return 250; };
    let l25 = 0, l50 = 0; for (let i = 26; i <= 250; i++) l25 += H[i]; for (let i = 51; i <= 250; i++) l50 += H[i];
    return { n, p50: q(0.5), p95: q(0.95), pc25: Math.round(100 * l25 / n), pc50: Math.round(100 * l50 / n) }; };
  const bilan = () => Object.fromEntries(PHASES.map((p) => [p, stats(hist[p])]).filter(([, s]) => s));
  addEventListener("scroll", () => { dernierMvt = performance.now(); }, { passive: true, capture: true });
  addEventListener("error", (e) => { const t = e.target; erreurs.push((t && t !== window && (t.src || t.href) ? "ressource " + String(t.src || t.href).replace(/^https?:\/\//, "").replace(/\?.*/, "").slice(-60) : "js " + (e.message || "")).slice(0, 120)); }, true);
  addEventListener("unhandledrejection", (e) => { erreurs.push(("promesse " + (e.reason && e.reason.message || e.reason)).slice(0, 120)); });

  /* --- Fil d'Ariane : survit à l'arrêt brutal du processus (localStorage) ----------------------- */
  const sid = Math.random().toString(36).slice(2, 8), debut = Date.now();
  let etatPage = "en-cours", arrivee = null;
  const enregistrer = () => ecrire(CLE, { sid, page: NOM, debut, dernier: Date.now(), etat: etatPage, etape, phase, journal: journal.slice(-12), info: info(), erreurs: erreurs.slice(-5) });
  const prec = lire(CLE);
  let incident = null;
  if (prec && prec.etat === "en-cours" && Date.now() - prec.dernier < 180000) {
    incident = { quand: new Date(prec.dernier).toISOString().slice(11, 19), page: prec.page, apres: Math.round((prec.dernier - prec.debut) / 1000) + " s", etape: prec.etape, phase: prec.phase, dernier: prec.journal.slice(-4), erreurs: prec.erreurs };
    const l = lire(CLE_INC) || []; l.push(incident); ecrire(CLE_INC, l.slice(-10));
    envoyer({ type: "interruption", incident });
  }
  function envoyer(o) { try { navigator.sendBeacon && navigator.sendBeacon("/__diag", JSON.stringify(Object.assign({ sid, page: NOM }, o))); } catch (e) {} }
  addEventListener("pagehide", () => { etatPage = "fermee"; enregistrer(); });
  document.addEventListener("visibilitychange", () => { etatPage = document.hidden ? "cachee" : "en-cours"; enregistrer(); });

  let tick = 0, couvert = false;
  const battre = () => {
    try {
      phase = calculerPhase();
      const p = projecteur(), hd = $(".ld-header");
      if (p) { // écart sous la scène épinglée (hauteur visible > hauteur de la scène)
        const rs = p.sc.getBoundingClientRect(), vis = window.visualViewport ? window.visualViewport.height : innerHeight;
        if (Math.abs(rs.top) <= 1 && p.sc.style.visibility !== "hidden") ecartMax.hero = Math.max(ecartMax.hero, Math.round(Math.max(innerHeight, vis) - rs.bottom));
      }
      const as = $(".vfa-scene");
      if (as) { const ra = as.getBoundingClientRect(); if (Math.abs(ra.top) <= 1 && phase === "etude") ecartMax.etude = Math.max(ecartMax.etude, Math.round(innerHeight - ra.bottom)); }
      if (h.classList.contains("ldv-nuit")) { // variante « nuit » : fond fixe caché quand une scène opaque couvre l'écran
        const sc = p && p.sc, rs = sc && sc.getBoundingClientRect(), c = !!(sc && rs.top <= 0 && rs.bottom >= innerHeight - 1 && sc.style.visibility !== "hidden");
        if (c !== couvert) { couvert = c; h.classList.toggle("ld-couvert", c); }
      }
      if (++tick % 5 === 0 || !journal.length) {
        journal.push({ t: Math.round((performance.now() - T0) / 100) / 10, y: Math.round(scrollY), ph: phase, P: p ? Math.round(p.P * 100) / 100 : null, Rp: p ? Math.round(p.Rp * 100) / 100 : null,
          ih: innerHeight, ton: hd && hd.dataset.ton, diff: !!(hd && hd.classList.contains("vf-diff")), cal: calquesVisibles().join(","), e: etape });
        if (journal.length > 60) journal.splice(0, journal.length - 60);
        enregistrer();
      }
      if (PANNEAU && tick % 3 === 0) dessinerPanneau(p);
    } catch (e) {}
  };

  /* --- Panneau ----------------------------------------------------------------------------- */
  let pan = null, ferme = false;
  function dessinerPanneau(p) {
    if (ferme || !document.body) return;
    if (!pan) { pan = document.createElement("div"); pan.id = "ld-diag-p"; h.appendChild(pan); }
    const i = info(), s = stats(hist[phase]);
    pan.innerHTML = `<b>${NOM}</b> ${ua} dpr ${i.dpr}\n` +
      `ih ${i.ih} vv ${i.vv} svh ${i.svh} lvh ${i.lvh} dvh ${i.dvh} · en-tête ${i.entete} (jeton ${i.jeton})\n` +
      `y ${Math.round(scrollY)} · ${phase}${p ? " P " + p.P.toFixed(2) + " Rp " + p.Rp.toFixed(2) : ""} · arrivée ${arrivee === null ? "…" : arrivee}\n` +
      `images ${s ? "p50 " + s.p50 + " p95 " + s.p95 + " ms, >25 ms " + s.pc25 + " %" : "—"} · écart bas ${ecartMax.hero}/${ecartMax.etude}\n` +
      `calques ${calquesVisibles().join(",") || "—"}${etape ? "\n<b>" + etape + "</b>" : ""}` +
      (incident ? `\n<b>Interruption détectée</b> (${incident.page}, ${incident.apres}, ${incident.etape || "-"}, phase ${incident.phase})` : "") +
      (erreurs.length ? `\nerreurs ${erreurs.length} : ${erreurs[erreurs.length - 1]}` : "");
  }

  /* --- Parcours automatiques ------------------------------------------------------------------ */
  const dormir = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const attendreVisible = async () => { while (document.hidden) await dormir(300); };
  const defiler = (cible, vitesse, maxMs) => new Promise((ok) => { // vitesse en hauteurs d'écran par seconde
    let tp = 0, tBloque = performance.now(), yPrec = scrollY; const t0 = performance.now();
    const pas = (t) => {
      const dt = tp ? Math.min(0.05, (t - tp) / 1000) : 1 / 60; tp = t; dernierMvt = performance.now();
      const y = scrollY, dir = Math.sign(cible - y), v = vitesse * innerHeight * dt;
      if (Math.abs(cible - y) < 2 || t - t0 > maxMs) return ok();
      if (Math.abs(y - yPrec) > 0.5) { tBloque = t; yPrec = y; } else if (t - tBloque > 4000) return ok(); // verrou du retournement : on attend, puis on renonce
      window.scrollTo(0, dir > 0 ? Math.min(cible, y + v) : Math.max(cible, y - v));
      requestAnimationFrame(pas);
    };
    requestAnimationFrame(pas);
  });
  const finHero = () => { const s = $("#hero"); return s ? s.getBoundingClientRect().bottom + scrollY - innerHeight : 0; };
  const basPage = () => document.documentElement.scrollHeight - innerHeight;
  const centre = (el) => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
  const pointer = (el, x, y) => el.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: x, clientY: y, pointerType: "mouse" }));
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
    etape = "P2 Back to Loan"; const b = $(".vfp-voir-f a, .vfp-voir-f button, .vfp-voir-f [role=button]"); if (b) b.click(); else if (window.dispatchEvent) window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await dormir(2200); clearInterval(garder);
    etape = "P2 reprise"; await defiler(1.5 * innerHeight, 0.5, 20000); await defiler(0, 2, 20000); await dormir(600);
  }
  async function lancerAuto() {
    while ($("#ld-chargement")) await dormir(200);
    await dormir(1500); arrivee = Math.round(scrollY);
    h.style.scrollBehavior = "auto";
    try { if (navigator.wakeLock) await navigator.wakeLock.request("screen"); } catch (e) {}
    for (let k = 1; k <= 2; k++) { await attendreVisible(); await parcours1(); }
    for (let k = 1; k <= 2; k++) { await attendreVisible(); await parcours2(); }
    h.style.scrollBehavior = ""; etape = "terminé";
    return { nom: NOM, arrivee, phases: bilan(), ecart: ecartMax, erreurs: erreurs.slice(-5), info: info(), plantage: null };
  }

  /* --- Banc : enchaîne les versions, résultats gardés d'une page à l'autre ----------------------- */
  const LISTE = (Q.get("liste") || "actuel,textures,proposition,proposition+filtre,proposition+nuit").split(",");
  const adresse = (nom) => { const [p, ...v] = nom.split("+"); return ({ actuel: "actuel.html", textures: "textures.html" }[p] || "./") + "?banc=suite" + (v.length ? "&v=" + v.join(",") : ""); };
  async function banc() {
    let b = lire(CLE_BANC);
    if (Q.get("banc") !== "suite") { b = { liste: LISTE, i: 0, res: [], debut: Date.now() }; ecrire(CLE_BANC, b); ecrire(CLE, null); location.replace(adresse(b.liste[0])); return; }
    if (!b) return;
    if (incident && b.i < b.liste.length && incident.page === b.liste[b.i]) { // la page précédente s'est arrêtée : on note et on passe à la suivante
      b.res.push({ nom: b.liste[b.i], plantage: incident, phases: {}, info: info() }); b.i++; ecrire(CLE_BANC, b);
      if (b.i < b.liste.length) { await dormir(1500); location.replace(adresse(b.liste[b.i])); return; }
    }
    if (b.i < b.liste.length && b.liste[b.i] === NOM) {
      const r = await lancerAuto(); b = lire(CLE_BANC) || b; b.res.push(r); b.i++; ecrire(CLE_BANC, b); envoyer({ type: "banc", resultat: r });
      if (b.i < b.liste.length) { etatPage = "fermee"; enregistrer(); location.replace(adresse(b.liste[b.i])); return; }
    }
    b.fini = true; ecrire(CLE_BANC, b); envoyer({ type: "banc-fini", banc: b }); tableau(b);
  }
  function tableau(b) {
    const t = document.createElement("div"); t.id = "ld-diag-t";
    const COURT = { actuel: "actuel", textures: "textur.", proposition: "prop", "proposition+filtre": "p+filtre", "proposition+nuit": "p+nuit" };
    const LIB = { ouverture: "ouverture", texte: "texte", lumiere: "lumière", eblouissement: "éblouiss.", blanc: "blanc", vitrine: "vitrine", etude: "étude", planche: "planche", pied: "pied" };
    const col = b.res.map((r) => COURT[r.nom] || r.nom), w = 9, pad = (s, n) => String(s).slice(0, n).padEnd(n);
    const c = (r, ph) => { if (r.plantage) return "—"; const s = r.phases && r.phases[ph]; return s ? s.p95 + "/" + s.pc25 + "%" : "·"; };
    let txt = `<b>Banc terminé</b> — ${new Date().toLocaleString()}\n${ua} · dpr ${devicePixelRatio} · écran ${screen.width}×${screen.height}\n`;
    const i0 = info(); txt += `ih ${i0.ih} vv ${i0.vv} · svh ${i0.svh} lvh ${i0.lvh} dvh ${i0.dvh} · en-tête ${i0.entete}\n\n`;
    txt += "Images : p95 (ms) / % > 25 ms, pendant le mouvement\n" + pad("", 10) + col.map((n) => pad(n, w)).join("") + "\n";
    txt += pad("plantage", 10) + b.res.map((r) => r.plantage ? `<span class="ko">${pad("OUI", w)}</span>` : `<span class="ok">${pad("non", w)}</span>`).join("") + "\n";
    txt += pad("arrivée y", 10) + b.res.map((r) => pad(r.arrivee == null ? "—" : r.arrivee, w)).join("") + "\n";
    for (const ph of PHASES) txt += pad(LIB[ph], 10) + b.res.map((r) => pad(c(r, ph), w)).join("") + "\n";
    txt += pad("écart bas", 10) + b.res.map((r) => pad(r.ecart ? r.ecart.hero + "/" + r.ecart.etude : "—", w)).join("") + "\n";
    txt += pad("erreurs", 10) + b.res.map((r) => pad(r.erreurs ? r.erreurs.length : "—", w)).join("") + "\n";
    for (const r of b.res) if (r.plantage) txt += `\n<span class="ko">${r.nom} : arrêt après ${r.plantage.apres}, ${r.plantage.etape || ""}, phase ${r.plantage.phase}</span>\n  ` + (r.plantage.dernier || []).map((j) => `${j.t}s y${j.y} ${j.ph} P${j.P} [${j.cal}]`).join("\n  ");
    t.innerHTML = txt + "\n\n(toucher pour fermer)";
    t.addEventListener("click", () => t.remove());
    h.appendChild(t);
  }

  const demarrer = () => {
    poserSondes();
    setInterval(battre, 100); requestAnimationFrame(image);
    if (Q.has("banc")) banc();
    else if (AUTO) lancerAuto().then((r) => { ecrire("ld-diag-auto", r); envoyer({ type: "auto", resultat: r }); tableau({ res: [r] }); });
    else { (async () => { while ($("#ld-chargement")) await dormir(200); await dormir(800); arrivee = Math.round(scrollY); })(); }
    const fin = lire(CLE_BANC); if (Q.has("diag") && fin && fin.fini && !Q.has("banc")) { /* dernier banc consultable */ const bt = document.createElement("button"); bt.textContent = "dernier banc"; bt.style.cssText = "position:fixed;right:6px;bottom:6px;z-index:2147483600;font:11px ui-monospace,monospace"; bt.onclick = () => { tableau(fin); bt.remove(); }; h.appendChild(bt); }
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", demarrer); else demarrer();
})();
