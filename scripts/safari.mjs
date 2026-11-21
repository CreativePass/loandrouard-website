// Corrections Safari / iPhone (octobre 2026, retour de Loan sur un vrai iPhone) — appliquées par scripts/construire.mjs
// sur la COPIE public/, jamais sur l'export. Même format et mêmes garde-fous que optimisations.mjs : n = nombre
// d'occurrences attendues ; si le passage d'origine a changé, la construction s'arrête (à revoir).
// Détail, preuves et mesures : PERFORMANCE.md, section « Safari / iPhone ».
//
// Chaque correction a un identifiant. Seuls ceux de SAFARI_IDS vont dans la page publiée (index.html) ; les autres
// restent des CANDIDATS, essayés seulement sur l'adresse de test (ESSAI=1, pages de VARIANTES_ESSAI) et gardés
// uniquement si les mesures (banc sur Safari réel) le justifient sans différence visuelle.
//   SAFARI=aucune npm run construire        → sans aucune correction Safari
//   SAFARI=entete,textures npm run construire → seulement celles-ci
import fs from "node:fs";
import path from "node:path";
import { TEXTURES, empreinte } from "./textures.mjs";

const VF = ["Video Feedback.dc.html"];
const SAF = "/* Correction Safari (scripts/safari.mjs) : ";
const TEX = "assets/lumiere/";
const img = (cls, nom, extra = "") => `<img class="${cls}" src="${TEX}${nom}.png" alt="" aria-hidden="true" decoding="async"${extra}>`;

// Filet de sécurité quand Safari zoome lui-même (correction « filet », 14/11, réduite le 18/11 ; voir le commentaire de la correction plus bas).
const FILET_CSS = `${SAF}filet : page à plat (sans calques séparés) quand Safari a zoomé lui-même. */
/* Niveau léger (image identique) : will-change retiré, faces arrière visibles dans le projecteur et l'étude (rien n'y tourne en 3D). */
html.vf-zoom-plat .vf *:not(.vfp-affiche), html.vf-zoom-plat .vf *::before, html.vf-zoom-plat .vf *::after { will-change: auto !important; }
html.vf-zoom-plat .vfp *, html.vf-zoom-plat .vfa * { -webkit-backface-visibility: visible !important; backface-visibility: visible !important; }
/* Niveau complet, seulement si Safari a vraiment zoomé : poussière, sable d'or et grain cachés ; halos décoratifs retirés (un filtre
   donne toujours un calque dans Safari) ; cartes de la planche sans 3D (la bonne face reste affichée). */
html.vf-zoom-natif .vf canvas, html.vf-zoom-natif .vf-nuit u, html.vf-zoom-natif .vfp-grain, html.vf-zoom-natif .vfa-papier u, html.vf-zoom-natif .vfa-noir u { visibility: hidden !important; }
html.vf-zoom-natif .vfa-svg--or, html.vf-zoom-natif .vfa-taiji, html.vf-zoom-natif .vfa-taiji img, html.vf-zoom-natif .vfk-eclat { filter: none !important; }
html.vf-zoom-natif .vfk * { -webkit-backface-visibility: visible !important; backface-visibility: visible !important; }
html.vf-zoom-natif .vfk-flip, html.vf-zoom-natif .vfk-dos { transform: none !important; -webkit-transform-style: flat !important; transform-style: flat !important; }
`;
const FILET_JS = `<script>${SAF}filet de sécurité quand Safari zoome lui-même (14/11, réduit le 18/11). Des doigts posés pendant l'élan d'un
   défilement ne sont pas transmis à la page (WebKit : isInterruptingMomentumScrollingWithEvent) : ni touch-action ni la loupe ne les
   voient, et Safari zoome en redessinant toute la page. La page passe à plat complet dès que Safari a zoomé (visualViewport.scale > 1,01,
   connu pendant le pincement, avant que Safari ne redessine au relâcher des doigts), jusqu'au dézoom.
   18/11 (retour de Loan : « quand je descends tout en bas et que je remonte, le site crashe ») : la page ne passe plus à plat quand un
   élan s'arrête net. Chaque coup de doigt qui relance un défilement rapide rattrape l'élan sans être transmis non plus : la page passait
   à plat pendant toute une remontée (projecteur et étude redessinés à chaque image), puis revenait d'un coup en haut de page. */
(() => {
  const R = document.documentElement, tactile = window.matchMedia ? window.matchMedia("(any-pointer: coarse)") : { matches: false }, vv = window.visualViewport;
  /* translate3d(x, y, z) → translate(x, y) : même position, sans calque séparé (valeurs avec calc() comprises). */
  const deux = (t) => { let i = t.indexOf("translate3d("); while (i >= 0) { let j = i + 12, p = 1; const a = []; let d = j;
      for (; j < t.length && p; j++) { const c = t[j]; if (c === "(") p++; else if (c === ")") { if (!--p) break; } else if (c === "," && p === 1) { a.push(t.slice(d, j)); d = j + 1; } }
      if (p) return t; a.push(t.slice(d, j)); if (a.length !== 3) return t;
      t = t.slice(0, i) + "translate(" + a[0].trim() + ", " + a[1].trim() + ")" + t.slice(j + 1); i = t.indexOf("translate3d(", i + 10); }
    return t; };
  const plat = (el) => { const t = el.style && el.style.transform; if (t && t.indexOf("translate3d(") >= 0) { const n = deux(t); if (n !== t) el.style.transform = n; } };
  let obs = null;
  const natif = () => (!!vv && vv.scale > 1.01) || R.classList.contains("vf-zoom");
  const suivre = () => { const z = natif() && tactile.matches;
    if (R.classList.contains("vf-zoom-natif") !== z) R.classList.toggle("vf-zoom-natif", z);
    if (z && !obs) { R.classList.add("vf-zoom-plat"); document.querySelectorAll('.vf [style*="translate3d"]').forEach(plat);
      /* Apparitions du projecteur terminées (elles finissent sur l'état normal) : arrêtées, sinon gardées en calques. */
      (document.getAnimations ? document.getAnimations() : []).forEach((a) => { if (/^vfp-(frappe|chauffe|apparait)$/.test(a.animationName || "") && a.playState === "finished") try { a.cancel(); } catch (e) {} });
      obs = new MutationObserver((l) => { for (const r of l) plat(r.target); }); /* chaque image du script : remis à plat avant d'être dessiné */
      obs.observe(document.body, { attributes: true, attributeFilter: ["style"], subtree: true }); }
    else if (!z && obs) { obs.disconnect(); obs = null; R.classList.remove("vf-zoom-plat"); window.dispatchEvent(new Event("scroll")); } };
  new MutationObserver(suivre).observe(R, { attributes: true, attributeFilter: ["class"] }); suivre();
  if (vv) vv.addEventListener("resize", suivre);
})();
</script>
`;

// Loupe de la page d'accueil sur écran tactile (correction « loupe », 14/11 ; voir le commentaire de la correction plus bas).
const LOUPE_CSS = `${SAF}loupe au pincement (écran tactile) : le zoom de Safari est remplacé par une loupe qui agrandit l'écran sans le redessiner. */
@media (any-pointer: coarse) { html:not(.vf-zoom), html:not(.vf-zoom) * { touch-action: pan-x pan-y; } }
html.vf-loupe { overflow: hidden !important; }
html.vf-loupe body { overflow: clip !important; } /* la page agrandie déborde de l'écran : débordement coupé, sinon le navigateur agrandit la zone de mise en page (vu dans Chrome) ou dézoome */
html.vf-loupe, html.vf-loupe * { touch-action: none !important; }
html.vf-loupe .vf { transform-origin: 0 0; will-change: transform; }
html.vf-loupe .vf-nuit, html.vf-loupe .vfk-c[data-grand], html.vf-loupe .vf-modale { translate: var(--loupe-x, 0px) var(--loupe-y, 0px) !important;
  right: auto !important; bottom: auto !important; box-sizing: border-box !important; width: var(--loupe-l, 100vw) !important; height: var(--loupe-h, 100vh) !important; } /* .vf devient leur repère : taille de l'écran gardée */
`;
const LOUPE_JS = `<script>${SAF}loupe au pincement sur écran tactile (14/11, retour de Loan : « que je puisse zoomer comme si je zoomais sur l'écran »). */
(() => {
  const R = document.documentElement, tactile = window.matchMedia ? window.matchMedia("(any-pointer: coarse)") : { matches: false }, vv = window.visualViewport;
  const SMAX = 4, SEUIL = 1.06;
  let s = 1, tx = 0, ty = 0, actif = false, raf = 0, geste = null, anim = 0, ox = 0, oy = 0;
  const vf = () => document.querySelector(".vf");
  const largeur = () => R.clientWidth, hauteur = () => window.innerHeight;
  const borner = () => { tx = Math.min(0, Math.max(largeur() * (1 - s), tx)); ty = Math.min(0, Math.max(hauteur() * (1 - s), ty)); };
  /* Un point vu en (x, y) sans loupe est affiché en (s·x + tx, s·y + ty). .vf (origine 0 0) est déplacé d'autant, compte tenu de sa
     place dans l'écran ; ses éléments fixes (fond « nuit », carte ouverte, fenêtre de paiement), dont .vf devient le repère, sont
     remis à leur place d'écran (--loupe-x, --loupe-y). Une transformation n'est jamais redessinée par Safari : les calques déjà
     dessinés sont simplement agrandis, comme une loupe sur l'écran. Mémoire graphique inchangée, mouvement fluide. */
  const appliquer = () => { raf = 0; const v = vf(); if (!v || !actif) return;
    const px = ox - window.scrollX, py = oy - window.scrollY;
    v.style.transform = "translate(" + (tx + (s - 1) * px).toFixed(2) + "px," + (ty + (s - 1) * py).toFixed(2) + "px) scale(" + s.toFixed(4) + ")";
    R.style.setProperty("--loupe-x", (-px).toFixed(2) + "px"); R.style.setProperty("--loupe-y", (-py).toFixed(2) + "px");
    R.style.setProperty("--loupe-l", largeur() + "px"); R.style.setProperty("--loupe-h", hauteur() + "px"); };
  const planifier = () => { if (!raf) raf = requestAnimationFrame(appliquer); };
  const activer = () => { if (actif) return true; const v = vf(); if (!v) return false;
    const b = v.getBoundingClientRect(); ox = b.left + window.scrollX; oy = b.top + window.scrollY;
    actif = true; window.__ldLoupeTactile = true; window.__ldZoom = true; R.classList.add("vf-loupe"); appliquer(); return true; };
  const desactiver = () => { cancelAnimationFrame(anim); anim = 0; cancelAnimationFrame(raf); raf = 0; actif = false; geste = null; s = 1; tx = ty = 0;
    const v = vf(); if (v) v.style.transform = ""; ["--loupe-x", "--loupe-y", "--loupe-l", "--loupe-h"].forEach((k) => R.style.removeProperty(k)); R.classList.remove("vf-loupe");
    window.__ldLoupeTactile = false; window.__ldZoom = false; requestAnimationFrame(() => window.dispatchEvent(new Event("scroll"))); };
  /* Retour à la taille normale en douceur (0,2 s). */
  const revenir = () => { cancelAnimationFrame(anim); const s0 = s, x0 = tx, y0 = ty, t0 = performance.now();
    const pas = (now) => { const k = Math.min(1, (now - t0) / 200), e = 1 - Math.pow(1 - k, 3); s = s0 + (1 - s0) * e; tx = x0 * (1 - e); ty = y0 * (1 - e); appliquer();
      if (k < 1) anim = requestAnimationFrame(pas); else desactiver(); };
    anim = requestAnimationFrame(pas); };
  /* Élan après un glissé d'un doigt, freiné, arrêté au bord. */
  const lancer = (vx, vy) => { cancelAnimationFrame(anim); let t0 = performance.now();
    const pas = (now) => { const dt = Math.min(40, now - t0); t0 = now; tx += vx * dt; ty += vy * dt; const f = Math.pow(0.94, dt / 16); vx *= f; vy *= f;
      const x = tx, y = ty; borner(); if (x !== tx) vx = 0;
      if (y !== ty) { const c = document.querySelector(".vfk-c[data-grand]"), av = c ? c.scrollTop : 0; if (c) c.scrollTop -= (y - ty) / s; if (!c || c.scrollTop === av) vy = 0; } /* élan transmis à la carte ouverte */
      appliquer();
      anim = Math.abs(vx) + Math.abs(vy) > 0.02 ? requestAnimationFrame(pas) : 0; };
    anim = requestAnimationFrame(pas); };
  const dist = (a, b) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  const glisse = (t) => ({ type: "glisse", x: t.clientX, y: t.clientY, x0: tx, y0: ty, vx: 0, vy: 0, tp: performance.now(), px: t.clientX, py: t.clientY });
  const debut = (e) => { const t = e.touches; if (!tactile.matches || (vv && vv.scale > 1.01)) return;
    if (t.length === 2) { if (!activer()) return; cancelAnimationFrame(anim); anim = 0;
      geste = { type: "pince", d0: Math.max(10, dist(t[0], t[1])), mx: (t[0].clientX + t[1].clientX) / 2, my: (t[0].clientY + t[1].clientY) / 2, s0: s, x0: tx, y0: ty, sy: window.scrollY }; }
    else if (t.length === 1 && actif) { cancelAnimationFrame(anim); anim = 0; geste = glisse(t[0]); }
    else geste = null; };
  const bouge = (e) => { const t = e.touches; if (!geste || !actif) return;
    if (geste.type === "pince" && t.length >= 2) { const mx = (t[0].clientX + t[1].clientX) / 2, my = (t[0].clientY + t[1].clientY) / 2;
      s = Math.min(SMAX, Math.max(1, geste.s0 * dist(t[0], t[1]) / geste.d0));
      /* Point de la page sous les doigts au début du geste (corrigé d'un éventuel défilement du tout début), qui suit les doigts. */
      const qx = (geste.mx - geste.x0) / geste.s0, qy = (geste.my - geste.y0) / geste.s0 - (window.scrollY - geste.sy);
      tx = mx - s * qx; ty = my - s * qy; borner(); planifier(); }
    else if (geste.type === "glisse" && t.length === 1) { const now = performance.now(), dt = Math.max(1, now - geste.tp);
      geste.vx = 0.6 * geste.vx + 0.4 * (t[0].clientX - geste.px) / dt; geste.vy = 0.6 * geste.vy + 0.4 * (t[0].clientY - geste.py) / dt;
      geste.px = t[0].clientX; geste.py = t[0].clientY; geste.tp = now;
      tx = geste.x0 + t[0].clientX - geste.x; const brut = geste.y0 + t[0].clientY - geste.y; ty = brut; borner(); planifier();
      /* Au bord de la vue agrandie, la carte ouverte (qui défile seule) continue de défiler dessous : on la lit en entier sans dézoomer. */
      const deb = brut - ty, c = document.querySelector(".vfk-c[data-grand]"); if (c && deb !== geste.deb) c.scrollTop -= (deb - (geste.deb || 0)) / s; geste.deb = deb; } };
  const finir = (e) => { const t = e.touches; if (!geste || !actif) return;
    if (geste.type === "pince") { if (t.length >= 2) return; if (s < SEUIL) { geste = null; revenir(); return; } geste = t.length === 1 ? glisse(t[0]) : null; return; }
    if (geste.type === "glisse" && !t.length) { const g = geste; geste = null; if (performance.now() - g.tp < 80) lancer(g.vx, g.vy); } };
  /* Écouteurs passifs : le défilement normal (un doigt, sans loupe) n'attend jamais le script. */
  document.addEventListener("touchstart", debut, { passive: true, capture: true });
  document.addEventListener("touchmove", bouge, { passive: true, capture: true });
  document.addEventListener("touchend", finir, { passive: true, capture: true });
  document.addEventListener("touchcancel", finir, { passive: true, capture: true });
  window.addEventListener("scroll", () => { if (actif) planifier(); }, { passive: true });
  window.addEventListener("resize", () => { if (actif && !geste) desactiver(); });
  window.addEventListener("orientationchange", () => { if (actif) desactiver(); });
})();
</script>
`;

// Sous la planche II, sur mobile (correction « sousplanche », 21/11 ; voir le commentaire de la correction plus bas).
const SOUSPLANCHE_CSS = `${SAF}sousplanche : sous la planche II (mobile), caméras de l'étude et fond « nuit » non dessinés quand le papier opaque recouvre la figure. */
html.vf-cache-cams .vfa-cam, html.vf-cache-cams .vfa-cam *, html.vf-cache-cams .vf-nuit, html.vf-cache-cams .vf-nuit * { visibility: hidden !important; }
`;
const SOUSPLANCHE_AIDES = `  /* ${SAF.slice(3)}sousplanche (21/11) : une zone entièrement hors de l'écran, marge comprise, n'est pas dessinée ; sous la
     planche II (mobile), les caméras de l'étude et le fond « nuit » ne le sont pas non plus quand le papier opaque recouvre la figure. */
  const horsVue = (f, M) => { if (!f) return false; const H = Math.max(window.innerHeight, R.clientHeight), y = window.scrollY, ymax = R.scrollHeight - H;
    const d0 = -Math.min(M, y), d1 = Math.min(M, Math.max(0, ymax - y));
    for (let i = 0; i <= 16; i++) { const d = d0 + (d1 - d0) * i / 16, iv = f(d, 0); if (iv[1] > -1 && iv[0] < H + 1) return false; }
    return true; };
  /* Lignes de la feuille de l'étude (1200 × 800) où la figure détourée (etude-detoure-v3.webp) a des pixels : 0 à 688 (mesuré le 21/11). */
  const FIG = [0, 690];
  const sousPlanche = (scA, vfa, zs, M) => { const noir = scA && scA.querySelector(".vfa-noir"), cam = noir && noir.querySelector(":scope > .vfa-cam"), z = zs.filter(Boolean);
    if (!cam || !vfa || !z.length || !plein(noir, scA)) return false; /* étude noire opaque : la caméra de l'étude blanche est dessous */
    const fz = zone(scA, vfa, 0), r = cam.getBoundingClientRect(); if (!fz || r.height <= 0) return false;
    let a = FIG[0], b = FIG[1];
    const ng = cam.querySelector(".vfa-negatif"); if (ng && +getComputedStyle(ng).opacity > 0) { a = 0; b = 800; }
    const so = cam.querySelector(".vfa-svg--or"); if (so && so.getBBox) try { const bb = so.getBBox(); if (bb.height > 0) { a = Math.min(a, bb.y); b = Math.max(b, bb.y + bb.height); } } catch (e) {}
    let t0 = r.top + a * r.height / 800 - 16, t1 = r.top + b * r.height / 800 + 16;
    const tr = getComputedStyle(cam).transform; /* caméra tournée : toute sa surface compte */
    if (tr && tr !== "none") try { const x = new DOMMatrix(tr); if (Math.abs(x.b) > 1e-3 || Math.abs(x.c) > 1e-3) { t0 = r.top; t1 = r.bottom; } } catch (e) { t0 = r.top; t1 = r.bottom; }
    const H = Math.max(window.innerHeight, R.clientHeight), y = window.scrollY, ymax = R.scrollHeight - H, d0 = -Math.min(M, y), d1 = Math.min(M, Math.max(0, ymax - y)), base = fz(0, 0)[1];
    for (let i = 0; i <= 16; i++) { const d = d0 + (d1 - d0) * i / 16, s = fz(d, 0)[1] - base, h0 = Math.max(0, t0 + s), h1 = Math.min(H, t1 + s); if (h1 <= h0) continue;
      const iv = z.map((f) => f(d, 0)).sort((p, q) => p[0] - q[0]); let bas = h0;
      for (const [p, q] of iv) { if (q <= bas) continue; if (p > bas + 0.5) break; bas = q; }
      if (bas < h1 - 0.5) return false; }
    return true; };
`;
const SOUSPLANCHE_FIN = `    const hors = { "vf-cache-proj": scP && vfp ? zone(scP, vfp, 0) : null }; ${SAF}sousplanche (21/11) : projecteur hors de l'écran (au-dessus) jamais dessiné ; l'étude garde la règle d'origine (jonction projecteur / étude inchangée). */
    for (const c in zones) { const deja = R.classList.contains(c), v = (deja ? couvert(zones[c], M / 2, -24) : couvert(zones[c], M, 10)) || horsVue(hors[c], deja ? M / 2 : M);
      if (v !== deja) R.classList.toggle(c, v); }
    const dejaS = R.classList.contains("vf-cache-cams"), sous = mob && sousPlanche(scA, vfa, [zK, zF], dejaS ? M / 2 : M);
    if (sous !== dejaS) R.classList.toggle("vf-cache-cams", sous); };`;

// Défilement doux identique dans tous les navigateurs (correction « glisse », 21/11 ; voir le commentaire de la correction plus bas).
const GLISSE_JS = `<script>${SAF}défilement doux identique dans tous les navigateurs (21/11, retour de Loan : sur Safari, les liens du sommaire
   arrivent d'un coup, sans glisser). Safari anime scrollTo({ behavior: "smooth" }) en un temps très court quelle que soit la distance :
   sur cette page très haute, cela ressemble à un saut. Chrome (mesuré le 21/11) anime en √(distance) images à 60 i/s, 1,5 s au plus,
   départ doux puis long freinage : courbe cubic-bezier(.42, 0, 0, 1) (écart moyen 0,4 % avec la mesure). Tous les défilements doux de
   la page (sommaire, liens internes, frise de l'étude, retour au paiement,
   « See full details » en remontant, retour en haut à l'ouverture) suivent maintenant cette courbe, calculée par la page, dans tous les
   navigateurs. Un geste du visiteur (molette, doigt, touche de défilement) l'arrête là où elle est ; mouvement réduit : arrivée directe. */
(() => {
  const R = document.documentElement, natif = window.scrollTo.bind(window), calme = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  const courbe = (x) => { let lo = 0, hi = 1, t = x; /* cubic-bezier(.42, 0, 0, 1) */
    for (let i = 0; i < 30; i++) { t = (lo + hi) / 2; const u = 1 - t, xt = 3 * u * u * t * 0.42 + t * t * t; if (xt < x) lo = t; else hi = t; }
    const u = 1 - t; return 3 * u * t * t + t * t * t; };
  let anim = null;
  const arreter = () => { if (anim) { cancelAnimationFrame(anim.raf); anim = null; } };
  const glisser = (top) => { arreter();
    const y0 = window.scrollY, y1 = Math.max(0, Math.min(+top || 0, R.scrollHeight - window.innerHeight)), d = y1 - y0;
    if (Math.abs(d) < 1 || calme.matches) { natif({ top: y1, behavior: "instant" }); return; }
    const T = Math.min(Math.sqrt(Math.abs(d)), 90) / 60 * 1000, t0 = performance.now(), dpr = window.devicePixelRatio || 1, a = { raf: 0 };
    const pas = (now) => { if (anim !== a) return; const p = Math.min(1, (now - t0) / T);
      natif({ top: Math.round((y0 + d * courbe(p)) * dpr) / dpr, behavior: "instant" });
      if (p < 1) a.raf = requestAnimationFrame(pas); else anim = null; };
    anim = a; a.raf = requestAnimationFrame(pas); };
  const doux = (o) => { const b = o && o.behavior; return b === "smooth" || (b !== "instant" && getComputedStyle(R).scrollBehavior === "smooth"); };
  window.scrollTo = function (a, b) {
    if (a && typeof a === "object") { if (doux(a)) { glisser(a.top != null ? a.top : window.scrollY); return; } arreter(); return natif(a); }
    if (arguments.length >= 2 && doux(null)) { glisser(b); return; }
    arreter(); return natif.apply(window, arguments); };
  /* Comme Chrome : la molette, le doigt ou une touche de défilement arrêtent le glissé (un clic non) ; rien pendant l'écran de chargement. */
  const TOUCHES = /^( |PageUp|PageDown|ArrowUp|ArrowDown|Home|End)$/;
  ["wheel", "touchstart", "keydown"].forEach((g) => window.addEventListener(g, (e) => {
    if (anim && !document.getElementById("ld-chargement") && (g !== "keydown" || TOUCHES.test(e.key))) arreter(); }, { capture: true, passive: true }));
  /* Liens vers une partie de la page (« move by move »…) : même glissé ; les liens déjà gérés par la page (sommaire) ne sont pas touchés. */
  document.addEventListener("click", (e) => { if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || !e.target.closest) return;
    const l = e.target.closest('a[href^="#"]'), id = l && decodeURIComponent(l.getAttribute("href").slice(1)), el = id && document.getElementById(id);
    if (!el || !doux(null)) return;
    e.preventDefault();
    glisser(el.getBoundingClientRect().top + window.scrollY - (parseFloat(getComputedStyle(el).scrollMarginTop) || 0) - (parseFloat(getComputedStyle(R).scrollPaddingTop) || 0));
    if (location.hash !== "#" + id) try { history.pushState(null, "", "#" + id); } catch (er) {} });
})();
</script>
`;

// Inclinaison des cartes au survol calculée image par image (correction « inclinaison », 21/11 ; voir le commentaire plus bas).
const INCLINAISON_JS = `<script>${SAF}inclinaison des cartes au survol calculée par la page, image par image (21/11, retour de Loan : sur Safari
   (Mac), « ça tilte pas beaucoup et quand ça tilte un peu, ça bug, ça jitter »). Avant : chaque mouvement de la souris relançait une
   transition CSS de 0,18 s, mesurée sur la carte déjà inclinée ; Safari reprend une transition relancée à partir d'une valeur en retard
   sur l'écran (animations accélérées) : la carte tremblait et n'atteignait pas son angle. Maintenant : mêmes angles (9° d'un bord à
   l'autre), même soulèvement (5 px), même reflet, mêmes durées (≈ 0,18 s pour suivre la souris, 0,6 s pour revenir à plat), dans tous
   les navigateurs. */
(() => {
  const SUIT = "border-color .35s ease, box-shadow .35s ease, background-color .35s ease", RETOUR = "transform .6s cubic-bezier(.16,.6,.2,1), " + SUIT;
  const cartes = new Map(); let raf = 0, tPrec = 0;
  const ecrire = (c, s) => { c.style.transform = "perspective(1500px) rotateY(" + s.ry.toFixed(2) + "deg) rotateX(" + s.rx.toFixed(2) + "deg) translateY(" + (-s.l).toFixed(2) + "px)"; };
  const pas = (now) => { raf = 0; const dt = tPrec ? Math.min(0.1, Math.max(0.001, (now - tPrec) / 1000)) : 1 / 60; tPrec = now; let encore = false;
    cartes.forEach((s, c) => { const k = 1 - Math.exp(-dt / (s.dedans ? 0.06 : 0.14)), v = s.dedans ? s.v : { rx: 0, ry: 0, l: 0 };
      s.rx += (v.rx - s.rx) * k; s.ry += (v.ry - s.ry) * k; s.l += (v.l - s.l) * k;
      const fini = Math.abs(v.rx - s.rx) < 0.01 && Math.abs(v.ry - s.ry) < 0.01 && Math.abs(v.l - s.l) < 0.02;
      if (fini) { s.rx = v.rx; s.ry = v.ry; s.l = v.l; }
      if (fini && !s.dedans) { c.style.transform = ""; cartes.delete(c); requestAnimationFrame(() => { if (!cartes.has(c)) c.style.transition = RETOUR; }); }
      else { ecrire(c, s); if (!fini) encore = true; } });
    if (encore) raf = requestAnimationFrame(pas); else tPrec = 0; };
  const lancer = () => { if (!raf) raf = requestAnimationFrame(pas); };
  window.__ldIncline = {
    suivre(c, x, y) { const r = c.getBoundingClientRect(); if (!r.width || !r.height) return;
      let s = cartes.get(c); if (!s) { s = { rx: 0, ry: 0, l: 0, v: null, dedans: true }; cartes.set(c, s); }
      s.dedans = true; c.style.transition = SUIT; /* la page tient la transformation : pas de transition CSS dessus */
      const w = c.offsetWidth || r.width, h = c.offsetHeight || r.height, ky = r.height / h;
      const px = Math.max(-0.5, Math.min(0.5, (x - r.left - r.width / 2) / r.width)), py = Math.max(-0.5, Math.min(0.5, (y - r.top - r.height / 2 - s.l * ky) / r.height));
      s.v = { rx: -py * 9, ry: px * 9, l: 5 };
      c.style.setProperty("--mx", ((x - r.left) / r.width * w).toFixed(0) + "px");
      c.style.setProperty("--my", ((y - r.top) / r.height * h).toFixed(0) + "px");
      lancer(); },
    lacher(c) { const s = cartes.get(c); if (s) { s.dedans = false; lancer(); } else { c.style.transition = RETOUR; c.style.transform = ""; } } };
})();
</script>
`;

// Images de la page qui n'arrivent pas (correction « images », 21/11 ; voir le commentaire de la correction plus bas).
const IMAGES_HTML = `<style>${SAF}images : image en échec cachée le temps d'être redemandée (ni « ? » ni cadre gris de Safari). */
img[data-ld-reessai] { visibility: hidden !important; }
</style>
<script>${SAF}images de la page protégées pendant leur téléchargement et redemandées si elles échouent (21/11, deux retours de Loan
   sur Safari : le dessin de l'étude, puis le halo de Loan au projecteur — « ? » et cadre gris de Safari — et le yin-yang, absents au
   premier chargement, présents au rechargement ou un moment après). Le moteur de la page (support.js) remplace toute la page lue par
   le navigateur par sa version React (et la recrée une seconde fois après avoir relu la page) pendant que les images se téléchargent ;
   sur Safari, une image dont l'élément disparaît en cours de route peut finir en échec. Le premier correctif (préchargement des deux
   images de l'étude) avait seulement déplacé le problème : en passant devant, elles retardaient les autres, qui se retrouvaient à leur
   tour en cours de route. Maintenant :
   1) chaque image encore en téléchargement au moment où le moteur démarre est aussi tenue par un objet Image de la page, jusqu'à son
      arrivée (même adresse : rien de plus à télécharger ; ordre d'origine des téléchargements, sans préchargement) ;
   2) une image en échec est cachée (ni « ? » ni cadre) et redemandée aussitôt à une adresse neuve (4 fois au plus), puis affichée ;
   3) l'écran de chargement attend une image du premier écran tant qu'elle est redemandée (avant : une image en échec comptait comme
      arrivée, réglage du 03/10 pour qu'il ne reste pas bloqué à 96 %) ; après 4 échecs, elle reste cachée et l'écran s'en va. */
(() => {
  const SAUF = /^(data|blob):|\\.svg(\\?|$)/i, abs = (s) => { try { return new URL(s, location.href).href; } catch (e) { return ""; } };
  const gardes = new Map();
  const garder = (u) => { if (!u || SAUF.test(u) || gardes.has(u)) return; const g = new Image(); g.decoding = "async";
    g.onload = () => setTimeout(() => gardes.delete(u), 15000); g.onerror = () => gardes.delete(u); gardes.set(u, g); g.src = u; };
  /* Avant le démarrage du moteur de la page (son écouteur est posé après celui-ci, ou il attend React). Images différées : non touchées. */
  document.addEventListener("DOMContentLoaded", () => { for (const im of document.images) { const s = im.getAttribute("src");
    if (s && im.loading !== "lazy" && !(im.complete && im.naturalWidth > 0)) garder(abs(s)); } });
  const essais = new WeakMap();
  const reessayer = (im) => { const s0 = im.getAttribute("src"); if (!s0 || SAUF.test(s0) || !im.isConnected) return;
    const n = (essais.get(im) || 0) + 1; if (n > 4) { im.setAttribute("data-ld-reessai", "abandon"); return; } essais.set(im, n); im.setAttribute("data-ld-reessai", "");
    let u; try { u = new URL(s0, location.href); u.searchParams.set("r", String(n)); } catch (e) { return; }
    const g = new Image(); g.decoding = "async";
    g.onload = () => { if (!im.isConnected) return; const fini = () => im.removeAttribute("data-ld-reessai");
      if (im.getAttribute("src") !== s0) { fini(); return; }
      im.addEventListener("load", fini, { once: true }); im.src = u.href; };
    g.onerror = () => setTimeout(() => { if (im.getAttribute("src") === s0) reessayer(im); }, 500 * n);
    g.src = u.href; };
  addEventListener("error", (e) => { const t = e.target; if (t && t.tagName === "IMG") reessayer(t); }, true);
  /* Image en échec sans événement (recréée par le moteur après son échec) : vérifiée plusieurs fois au début. */
  const balayer = () => { for (const im of document.images) if (im.loading !== "lazy" && im.complete && im.naturalWidth === 0 && !im.hasAttribute("data-ld-reessai")) reessayer(im); };
  addEventListener("load", () => { balayer(); setTimeout(balayer, 1000); setTimeout(balayer, 4000); });
})();
</script>
`;

const TOUTES = [
  // En-tête : --hauteur-header vaut 68 px dans le design system, mais l'en-tête mesure 134 px sur iPhone (3 lignes) et
  // ~96 px dans Safari sur Mac. Son margin-bottom négatif (−68 px) laissait alors une bande vide au-dessus du
  // projecteur, et tout ce qui se place « sous l'en-tête » (titre Video Feedback, texte, cartes) passait dessous.
  // Choix de Loan (04/10) : garder l'en-tête tel quel et corriger le calcul.
  { id: "entete", quoi: "En-tête : --hauteur-header = hauteur réelle", fichiers: VF, n: 1,
    avant: "  componentDidMount() {\n",
    apres: "  componentDidMount() {\n" +
      "    " + SAF + "--hauteur-header suit la hauteur réelle de l'en-tête (3 lignes sur iPhone, plus haut dans Safari).\n" +
      "       Posée sur <html> : le moteur remplace .vf au démarrage. L'en-tête est relu à chaque fois (il peut être remplacé aussi). */\n" +
      "    { const racine = document.documentElement; let obs = null, vu = null, n = 0;\n" +
      "      const poser = () => { const hd = document.querySelector(\".vf > .ld-header\"); if (!hd) return;\n" +
      "        if (hd !== vu && window.ResizeObserver) { if (obs) obs.disconnect(); obs = new ResizeObserver(poser); obs.observe(hd); vu = hd; }\n" +
      "        const hh = Math.round(hd.offsetHeight); if (hh > 0 && hh !== racine.__hh) { racine.__hh = hh; racine.style.setProperty(\"--hauteur-header\", hh + \"px\"); if (n++) window.dispatchEvent(new Event(\"resize\")); } };\n" +
      "      poser(); window.addEventListener(\"load\", poser); window.addEventListener(\"resize\", poser); if (document.fonts && document.fonts.ready) document.fonts.ready.then(poser);\n" +
      "      this._offHh = () => { if (obs) obs.disconnect(); window.removeEventListener(\"resize\", poser); window.removeEventListener(\"load\", poser); }; }\n" },
  { id: "entete", quoi: "En-tête : arrêt de la mesure au démontage", fichiers: VF, n: 1,
    avant: "    if (this._offF) this._offF();\n", apres: "    if (this._offF) this._offF();\n    if (this._offHh) this._offHh();\n" },

  // « Lumière en textures » (retenue) : faisceaux, rayons, halo, brume, éclat, sol, flaque et ombre deviennent
  // des images calculées une fois (scripts/textures.mjs, mêmes dégradés que le CSS) que le navigateur se contente de
  // déplacer (transform / opacity). Plus de masque conique composé à chaque image, plus de dégradé plein écran redessiné
  // à chaque image (halo, brume, éclat pilotés par variables CSS).
  { id: "textures", quoi: "Textures : faisceaux", fichiers: VF, n: 1,
    avant: '<div class="vfp-faisceau" aria-hidden="true"></div><div class="vfp-faisceau vfp-faisceau--stries" aria-hidden="true"></div><div class="vfp-faisceau vfp-faisceau--coeur" aria-hidden="true"></div>',
    apres: img("vfp-faisceau vfp-tex", "faisceau") + img("vfp-faisceau vfp-faisceau--stries vfp-tex", "faisceau-stries") + img("vfp-faisceau vfp-faisceau--coeur vfp-tex", "faisceau-coeur") },
  ...["sol", "flaque", "ombre"].map((n) => ({ id: "textures", quoi: `Textures : ${n}`, fichiers: VF, n: 1,
    avant: `<div class="vfp-${n}" aria-hidden="true"></div>`, apres: img(`vfp-${n} vfp-tex`, n) })),
  { id: "textures", quoi: "Textures : rayons", fichiers: VF, n: 1,
    avant: '<i class="vfp-rayons"></i>', apres: img("vfp-rayons vfp-tex", "rayons") },
  { id: "textures", quoi: "Textures : halo", fichiers: VF, n: 1,
    avant: '<i class="vfp-halo" aria-hidden="true"></i>', apres: '<i class="vfp-halo" aria-hidden="true">' + img("vfp-tex", "halo") + "</i>" },
  { id: "textures", quoi: "Textures : brume", fichiers: VF, n: 1,
    avant: '<div class="vfp-brume" aria-hidden="true"><i></i></div>', apres: '<div class="vfp-brume" aria-hidden="true"><i>' + img("vfp-tex", "brume") + "</i></div>" },
  { id: "textures", quoi: "Textures : éclat", fichiers: VF, n: 1,
    avant: '<div class="vfp-eclat" aria-hidden="true"></div>', apres: '<div class="vfp-eclat" aria-hidden="true">' + img("vfp-tex", "eclat") + "</div>" },
  // Mêmes centres et rayons qu'avant, mais par transform (l'image fait 1000 px : échelle = rayon / 500).
  { id: "textures", quoi: "Textures : halo déplacé par transform", fichiers: VF, n: 1,
    avant: 'halo.style.setProperty("--hx", Ls.x.toFixed(1) + "px"); halo.style.setProperty("--hy", Ls.y.toFixed(1) + "px"); halo.style.setProperty("--hr", (100 * (3.2 + 16.8 * I * I)).toFixed(0) + "px");',
    apres: '{ const hr = Math.round(100 * (3.2 + 16.8 * I * I)); halo.firstChild.style.transform = "translate3d(" + (Ls.x - hr).toFixed(1) + "px," + (Ls.y - hr).toFixed(1) + "px,0) scale(" + (hr / 500).toFixed(4) + ")"; } ' + SAF + "texture déplacée, plus de dégradé plein écran redessiné. */" },
  { id: "textures", quoi: "Textures : brume déplacée par transform", fichiers: VF, n: 1,
    avant: 'brumeL.style.setProperty("--bx", Ls.x.toFixed(1) + "px"); brumeL.style.setProperty("--by", Ls.y.toFixed(1) + "px");',
    apres: 'brumeL.firstChild.style.transform = "translate3d(calc(" + Ls.x.toFixed(1) + "px - 90vmax),calc(" + Ls.y.toFixed(1) + "px - 90vmax),0)"; ' + SAF + "rayon 90vmax inchangé (taille CSS de l'image). */" },
  { id: "textures", quoi: "Textures : éclat déplacé par transform", fichiers: VF, n: 1,
    avant: 'eclat.style.setProperty("--ex", Ls.x.toFixed(1) + "px"); eclat.style.setProperty("--ey", Ls.y.toFixed(1) + "px"); eclat.style.setProperty("--er", (125 * (0.16 + 36 * Math.pow(w, 2.4))).toFixed(0) + "px");',
    apres: '{ const er = Math.round(125 * (0.16 + 36 * Math.pow(w, 2.4))); eclat.firstChild.style.transform = "translate3d(" + (Ls.x - er).toFixed(1) + "px," + (Ls.y - er).toFixed(1) + "px,0) scale(" + (er / 500).toFixed(4) + ")"; }' },
  { id: "textures", quoi: "Textures : styles", fichiers: VF, n: 1,
    avant: "@media (prefers-reduced-motion: reduce) { .vf-sommaire a, .vf-sommaire a::before { transition: none; } }\n</style>",
    apres: "@media (prefers-reduced-motion: reduce) { .vf-sommaire a, .vf-sommaire a::before { transition: none; } }\n" +
      SAF + "lumière en textures (mêmes dégradés, calculés une fois). */\n" +
      "img.vfp-tex { display: block; max-width: none; max-height: none; pointer-events: none; user-select: none; -webkit-user-drag: none; background: none; -webkit-mask-image: none; mask-image: none; border-radius: 0; }\n" +
      ".vfp-lampe-in > img.vfp-rayons { position: absolute; will-change: transform; }\n" +
      ".vfp-halo, .vfp-brume i, .vfp-eclat { background: none; }\n" +
      ".vfp-halo > .vfp-tex, .vfp-eclat > .vfp-tex { position: absolute; left: 0; top: 0; width: 1000px; height: 1000px; transform-origin: 0 0; will-change: transform; }\n" +
      ".vfp-brume i > .vfp-tex { position: absolute; left: 0; top: 0; width: 180vmax; height: 180vmax; will-change: transform; }\n" +
      "</style>" },

  // CANDIDAT ÉCARTÉ le 08/10 (validation sur l'iPhone : 3 arrêts sur 3) — « lumière cachée sous le blanc » : dès que le blanc papier
  // est strictement opaque (P ≥ 0,8 : blanc, jonction, étude), il recouvre toute la scène (overflow: hidden) ; la lumière
  // (faisceaux, sol, flaque, ombre, poussière, halo, lampe, rayons), la brume, l'exposition et l'éclat restaient pourtant
  // actifs dessous. Ils sont masqués comme les calques éteints que le code libère déjà : image identique, mémoire libérée.
  { id: "sousblanc", quoi: "Lumière masquée sous le blanc opaque", fichiers: VF, n: 1,
    avant: '      [brume, rayons, expo, eclat, blanc, reman].forEach((e) => { const v = parseFloat(e.style.opacity) > 0.001 ? "" : "hidden"; if (e.style.visibility !== v) e.style.visibility = v; });\n',
    apres: "      " + SAF + "sous le blanc opaque, rien n'est visible : lumière, brume, exposition et éclat masqués (mémoire libérée). */\n" +
      "      const sousBlanc = parseFloat(blanc.style.opacity) >= 1;\n" +
      '      [brume, rayons, expo, eclat, blanc, reman].forEach((e) => { const v = parseFloat(e.style.opacity) > 0.001 && !(sousBlanc && e !== blanc && e !== reman) ? "" : "hidden"; if (e.style.visibility !== v) e.style.visibility = v; });\n' +
      '      { const lu = fxs[0].parentNode, v = sousBlanc ? "hidden" : ""; if (lu.style.visibility !== v) lu.style.visibility = v; }\n' },

  // « Textures compactes » (retenue le 08/10, à appliquer APRÈS « textures ») : mesure dans l'inspecteur web de Safari sur l'iPhone
  // de Loan (08/10, P 0,75) : 490 Mo de mémoire graphique, dont ~300 Mo pour les lumières mobiles. Safari dessine chaque
  // texture à la taille de son cadre (1000 × 1000 px CSS → 3000 × 3000 px à l'écran, 45 Mo), alors que l'image ne fait que
  // 512 px. Chaque texture est donc posée dans un petit cadre (≥ sa résolution une fois multiplié par 3) puis agrandie par
  // transform (scale) : même géométrie, même image source, mémoire divisée par ~25. Le code du projecteur continue de
  // déplacer les mêmes éléments (classes inchangées) ; seuls le halo, l'éclat et la brume, déjà pilotés par « textures »,
  // voient leur échelle ajustée.
  ...[["vfp-faisceau", "faisceau", "i"], ["vfp-faisceau vfp-faisceau--stries", "faisceau-stries", "i2"], ["vfp-faisceau vfp-faisceau--coeur", "faisceau-coeur", "i"]].map(([cls, nom, k]) => ({
    id: "compact", quoi: `Textures compactes : ${nom}`, fichiers: VF, n: 1,
    avant: img(cls + " vfp-tex", nom), apres: `<div class="${cls} vfp-compact" aria-hidden="true">` + img("vfp-tex vfp-compact-" + k, nom) + "</div>" })),
  ...["sol", "flaque", "ombre"].map((n) => ({ id: "compact", quoi: `Textures compactes : ${n}`, fichiers: VF, n: 1,
    avant: img(`vfp-${n} vfp-tex`, n), apres: `<div class="vfp-${n} vfp-compact" aria-hidden="true">` + img("vfp-tex vfp-compact-s", n) + "</div>" })),
  { id: "compact", quoi: "Textures compactes : rayons", fichiers: VF, n: 1,
    avant: img("vfp-rayons vfp-tex", "rayons"), apres: '<i class="vfp-rayons vfp-compact">' + img("vfp-tex vfp-compact-r", "rayons") + "</i>" },
  { id: "compact", quoi: "Textures compactes : halo (échelle)", fichiers: VF, n: 1, avant: '"px,0) scale(" + (hr / 500).toFixed(4) + ")"', apres: '"px,0) scale(" + (hr / 100).toFixed(4) + ")"' },
  { id: "compact", quoi: "Textures compactes : éclat (échelle)", fichiers: VF, n: 1, avant: '"px,0) scale(" + (er / 500).toFixed(4) + ")"', apres: '"px,0) scale(" + (er / 100).toFixed(4) + ")"' },
  { id: "compact", quoi: "Textures compactes : brume (échelle)", fichiers: VF, n: 1,
    avant: '"px - 90vmax),0)"; ', apres: '"px - 90vmax),0) scale(5)"; ' },
  { id: "compact", quoi: "Textures compactes : styles", fichiers: VF, n: 1,
    avant: ".vfp-halo > .vfp-tex, .vfp-eclat > .vfp-tex { position: absolute; left: 0; top: 0; width: 1000px; height: 1000px; transform-origin: 0 0; will-change: transform; }\n" +
      ".vfp-brume i > .vfp-tex { position: absolute; left: 0; top: 0; width: 180vmax; height: 180vmax; will-change: transform; }\n",
    apres: ".vfp-halo > .vfp-tex, .vfp-eclat > .vfp-tex { position: absolute; left: 0; top: 0; width: 200px; height: 200px; transform-origin: 0 0; will-change: transform; }\n" +
      ".vfp-brume i > .vfp-tex { position: absolute; left: 0; top: 0; width: 36vmax; height: 36vmax; transform-origin: 0 0; will-change: transform; }\n" +
      SAF + "textures compactes : petit cadre agrandi par transform (image source inchangée, mémoire graphique ÷ ~25). */\n" +
      ".vfp-compact { background: none !important; -webkit-mask-image: none !important; mask-image: none !important; }\n" +
      ".vfp-compact > .vfp-tex { position: absolute; left: 0; top: 0; transform-origin: 0 0; will-change: transform; }\n" +
      ".vfp-compact > .vfp-compact-i { width: 200px; height: 200px; transform: scale(5); }\n" +
      ".vfp-compact > .vfp-compact-i2 { width: 400px; height: 400px; transform: scale(2.5); }\n" +
      ".vfp-compact > .vfp-compact-r { width: 400px; height: 400px; transform: scale(3); }\n" +
      ".vfp-compact > .vfp-compact-s { width: 200px; height: 40px; transform: scale(5); }\n" },

  // « Ligne rose » (retenue le 08/10) : sur l'iPhone, Safari 27 dessinait une ligne magenta au-dessus de « See pricing »,
  // dont le flou de repos (filter: blur) est calculé en logiciel. Un calque dédié au filtre la fait disparaître (vu sur
  // l'iPhone de Loan, variante ?v=affiche), sans arrêt ajouté sur le parcours de la vitrine.
  { id: "affiche", quoi: "See pricing : flou dans son propre calque", fichiers: VF, n: 1,
    avant: ".vfp-affiche:hover, .vfp-affiche:focus-visible { outline: none; color: #F6F5F1; filter: none; }\n",
    apres: ".vfp-affiche:hover, .vfp-affiche:focus-visible { outline: none; color: #F6F5F1; filter: none; }\n" +
      SAF + "flou de « See pricing » dans son propre calque (ligne magenta de Safari 27 sur iPhone). */\n" +
      ".vfp-affiche { will-change: filter; }\n" },

  // « Bande noire du bas » (retour de Loan, 08/10, capture de l'étude) : les deux scènes épinglées font 100svh, la hauteur
  // visible barre de Safari DÉPLOYÉE (695 px sur son iPhone). Barre repliée, l'écran fait 100lvh (735 px) : les 40 px du bas
  // montraient le fond noir de la page. Les scènes prennent donc 100lvh (le bas reste caché sous la barre quand elle est
  // déployée) et tout ce qui est posé contre leur bas remonte d'autant (100lvh − 100svh) : barre déployée, rien ne bouge
  // à l'écran. Sans barre mobile (ordinateur, Chromium), lvh = svh : aucun changement.
  { id: "lvh", quoi: "Scènes à la hauteur barre repliée (100lvh)", fichiers: VF, n: 1,
    avant: "</style>\n</helmet>",
    apres: SAF + "scènes épinglées à la hauteur barre repliée ; ce qui est posé contre leur bas remonte de la hauteur de la barre. */\n" +
      ":is(.vfp-scene, .vfa-scene) { height: 100lvh; }\n" +
      ".vfp-mot--feedback { bottom: calc(var(--vfp-marge-y) + 100lvh - 100svh) !important; }\n" +
      ".vfp-mot--feedback.vfp-pour { bottom: calc(var(--vfp-marge-y) + 9svh + 100lvh - 100svh) !important; }\n" +
      ".vfp-indice { bottom: calc(22px + 100lvh - 100svh); }\n" +
      ".vfp-voir { bottom: calc(24px + 5svh + 100lvh - 100svh); }\n" +
      ".vfa-pied { bottom: calc(18px + 100lvh - 100svh); }\n" +
      ".vfa-yang { bottom: calc(11svh + 100lvh - 100svh); }\n" +
      ".vfp-poussiere { height: 100svh; } /* toile dessinée sur la hauteur visible, comme la composition (sinon étirée) */\n" +
      "@media (max-width: 899px) { .vfp-voir { bottom: calc(18px + 3svh + 100lvh - 100svh); } .vfa-pied { bottom: calc(12px + 100lvh - 100svh); } .vfa-yang { bottom: calc(8svh + 100lvh - 100svh); } .vfa-texte { bottom: calc(78px + 100lvh - 100svh); }\n" +
      "  .vfa-marge { background: linear-gradient(to top, #F6F5F1 0, #F6F5F1 calc(100lvh - 60svh), rgba(246,245,241,.85) calc(100lvh - 53svh), rgba(246,245,241,0) calc(100lvh - 42svh)); } }\n" +
      "</style>\n</helmet>" },
  // La composition (Loan, lumière, cadrage de l'étude, diagonale du yin-yang) reste calculée sur la hauteur visible barre
  // déployée (100svh), comme avant : seul le fond s'étend dessous. Sinon, avec l'écart relevé sur l'iPhone de Loan le 08/10
  // (svh 647, lvh 768), Loan et son sol descendaient de 60 à 90 px, derrière « See pricing » (vu en simulation).
  { id: "lvh", quoi: "Hauteur visible (svh) pour la composition des scènes", fichiers: VF, n: 1,
    avant: 'const calmeMQ = () => !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);\n',
    apres: 'const calmeMQ = () => !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);\n' +
      SAF + "les scènes font 100lvh, leur composition se calcule sur la hauteur visible barre déployée (100svh). */\n" +
      "let sondeSvh = null;\n" +
      'const hautVisible = (sc) => { if (!sondeSvh || !sondeSvh.isConnected) { sondeSvh = document.createElement("i"); sondeSvh.setAttribute("aria-hidden", "true"); sondeSvh.style.cssText = "position:absolute;left:0;top:0;width:1px;height:100svh;visibility:hidden;pointer-events:none"; document.documentElement.appendChild(sondeSvh); }\n' +
      "  return Math.min(sc.clientHeight, sondeSvh.offsetHeight || Infinity); };\n" },
  { id: "lvh", quoi: "Projecteur : composition sur la hauteur visible", fichiers: VF, n: 1,
    avant: "      const W = scene.clientWidth, H = scene.clientHeight, mob = W < 900;\n",
    apres: "      const W = scene.clientWidth, H = hautVisible(scene), mob = W < 900;\n" },
  { id: "lvh", quoi: "Étude : composition sur la hauteur visible", fichiers: VF, n: 1,
    avant: "      const W = scene.clientWidth, H = scene.clientHeight, mobile = W < 900;\n",
    apres: "      const W = scene.clientWidth, H = hautVisible(scene), mobile = W < 900;\n" },
  // Diagonale du yin-yang : elle part du bas RÉEL de la scène (sinon, barre repliée, un triangle noir de toute la hauteur de la
  // barre apparaissait d'un coup au début de la bascule), fait sa pause au milieu de la zone visible, puis finit sa course.
  // Sur ordinateur (Hs = H), formule identique à l'origine. Relevé par la revue du 09/10 (simulation 393 × 768, svh 647).
  { id: "lvh", quoi: "Étude : hauteur réelle de la scène gardée pour la diagonale", fichiers: VF, n: 1,
    avant: "V = { W, H, mobile, s0, Tx0: mobile ? W / 2 : W * 0.31, Ty0: haut + ah / 2, m: V ? V.m : 0 };",
    apres: "V = { W, H, Hs: scene.clientHeight, mobile, s0, Tx0: mobile ? W / 2 : W * 0.31, Ty0: haut + ah / 2, m: V ? V.m : 0 };" },
  { id: "lvh", quoi: "Étude : la diagonale part du bas réel de la scène", fichiers: VF, n: 1,
    avant: "const t = 0.18 * V.W, yc = (V.H + t) - d * (V.H + 2 * t);",
    apres: "const t = 0.18 * V.W, yc = d <= 0.5 ? (V.Hs + t) - 2 * d * (V.Hs + t - V.H / 2) : V.H / 2 - (2 * d - 1) * (V.H / 2 + t);" },

  // « Caméra de l'étude » (retour de Loan, 08/10 : « la section du yin-yang qui se sépare est particulièrement lente »).
  // Mesuré (Chromium, format iPhone, processeur ×4, séparation u 6,95 → 7,4) : les deux caméras de l'étude (photo, dessin,
  // corrections en or et leurs ombres) étaient redessinées à chaque image (85 + 78 redessins en 3 s, 8,3 s de rastérisation).
  // Cause : la caméra rejoint son cadrage par un amorti compté en IMAGES (8 % par image) ; plus le téléphone est lent, plus
  // elle met de temps à arriver, et chaque micro-mouvement change l'échelle, donc l'épaisseur des traits (--k), donc
  // redessine tout. Correction 1 : même amorti, compté en TEMPS (identique à 60 images/s). Correction 2 : pendant le
  // mouvement, --k n'est réécrit que s'il change de plus de 2 % (écart d'épaisseur invisible) ; valeur exacte à l'arrêt, image
  // identique au repos. Les deux ensemble : 57 + 20 redessins, rastérisation 8,3 → 3,3 s, images médianes 67 → 33 ms (banc du
  // 08/10, PERFORMANCE.md, « Retour de Loan du 08/10 »).
  { id: "camera", quoi: "Étude : amorti de la caméra compté en temps", fichiers: VF, n: 1,
    avant: "    const suivre = () => {\n      anim = 0;\n      const a = calme ? 1 : 0.08;\n",
    apres: "    let tSuivre = 0; " + SAF + "amorti compté en temps (identique à 60 images/s), plus en images. */\n" +
      "    const suivre = (now) => {\n      anim = 0;\n" +
      "      const dt = tSuivre && now ? Math.min(0.1, (now - tSuivre) / 1000) : 1 / 60; tSuivre = now || 0;\n" +
      "      const a = calme ? 1 : 1 - Math.pow(0.92, dt * 60);\n" },
  { id: "camera", quoi: "Étude : fin de l'amorti", fichiers: VF, n: 1,
    avant: "Math.abs(cible.fy - cur.fy) > 0.0002) anim = requestAnimationFrame(suivre);\n",
    apres: "Math.abs(cible.fy - cur.fy) > 0.0002) anim = requestAnimationFrame(suivre); else tSuivre = 0;\n" },
  { id: "camera", quoi: "Étude : épaisseur des traits réécrite seulement si elle change vraiment", fichiers: VF, n: 1,
    avant: '      cam.style.transform = tr; cam.style.setProperty("--k", k);\n      cam2.style.transform = tr; cam2.style.setProperty("--k", k);\n',
    apres: "      cam.style.transform = tr; cam2.style.transform = tr;\n" +
      "      " + SAF + "en mouvement, --k n'est réécrit que s'il change de plus de 2 % ; valeur exacte à l'arrêt (ci-dessous). */\n" +
      '      kEx = k; if (!kPose || Math.abs(k / kPose - 1) > 0.02) { kPose = +k; cam.style.setProperty("--k", k); cam2.style.setProperty("--k", k); }\n' },
  { id: "camera", quoi: "Étude : épaisseur exacte à l'arrêt", fichiers: VF, n: 1,
    avant: '      clearTimeout(tNet); tNet = setTimeout(() => { cam.style.willChange = cam2.style.willChange = "auto"; }, 220);\n',
    apres: '      clearTimeout(tNet); tNet = setTimeout(() => { cam.style.willChange = cam2.style.willChange = "auto"; kPose = +kEx; cam.style.setProperty("--k", kEx); cam2.style.setProperty("--k", kEx); }, 220);\n' },
  { id: "camera", quoi: "Étude : mémoire de l'épaisseur posée", fichiers: VF, n: 1,
    avant: "    let tNet = 0;\n", apres: '    let tNet = 0, kPose = 0, kEx = "1";\n' },

  // « Zoom à deux doigts » (retour de Loan du 09/11 : « sur mobile, dès que je zoome avec mes deux doigts le site crash
  // instantanément »). Cause, lue dans le code de WebKit (GraphicsLayerCA.cpp) : au zoom, Safari redessine chaque calque à
  // l'échelle du zoom ; un calque de moins de 1 280 px CSS × zoom garde UNE image entière, dont la mémoire grandit comme le
  // carré du zoom (×4 à ×2, ×9 à ×3, jusqu'à ≈ 60 Mo par calque ; un calque réduit par la caméra de l'étude, jusqu'à 156 Mo).
  // La page d'accueil a ≈ 100 calques dans Safari (215 Mo au repos mesurés sur l'iPhone de Loan le 08/10 ; arrêts vers 490 Mo) :
  // au relâcher du zoom, tous sont redessinés en même temps et iOS arrête la page. CGV, Privacy, Legal et Sponsors (3 à 10
  // calques) ne sont pas concernées et gardent le zoom.
  // CANDIDAT ÉCARTÉ le 09/11 (Loan, sur l'adresse de test : « je ne peux même plus zoomer ») — pas de pincement sur cette page,
  // sur écran tactile (touch-action: pan-x pan-y, que Safari iOS respecte : WKTouchActionGestureRecognizer.mm). Remplacé par
  // « zoomplat » ci-dessous, qui garde le zoom.
  { id: "pincement", quoi: "Pas de zoom à deux doigts sur la page d'accueil (écrans tactiles)", fichiers: VF, n: 1,
    avant: "</style>\n</helmet>",
    apres: SAF + "pas de zoom à deux doigts sur écran tactile (au zoom, Safari redessinait tous les calques et arrêtait la page). */\n" +
      "@media (any-pointer: coarse) { html:not(.vf-zoom), html:not(.vf-zoom) * { touch-action: pan-x pan-y; } }\n" +
      "</style>\n</helmet>" },

  // Calques invisibles qui gardaient leur mémoire graphique (relevé Safari du 08/10 sur l'iPhone de Loan, « en réserve ») :
  // - mur de la vitrine (26,9 Mo) : transparent hors de la vitrine (opacité 0), mais gardé dessiné. Il est libéré comme les
  //   autres calques éteints du projecteur (code d'origine : brume, rayons, exposition, éclat, blanc, rémanence) ;
  // - cartes de la vitrine (13,4 Mo) : transparentes et inertes (ni clic ni clavier) tant que la vitrine est fermée. Cachées
  //   1,1 s après la fermeture (leur fondu dure 1 s au plus), visibles dès l'ouverture (leur fondu commence 0,4 s après).
  // Rien ne change à l'écran : ces éléments étaient déjà transparents.
  { id: "eteints", quoi: "Projecteur : mur de la vitrine libéré quand il est éteint", fichiers: VF, n: 1,
    avant: "[brume, rayons, expo, eclat, blanc, reman].forEach((e) => {",
    apres: "[brume, rayons, expo, eclat, blanc, reman, mur].forEach((e) => { " + SAF + "mur de la vitrine compris. */" },
  { id: "eteints", quoi: "Vitrine fermée : cartes non dessinées", fichiers: VF, n: 1,
    avant: "</style>\n</helmet>",
    apres: SAF + "vitrine fermée : cartes (transparentes, inertes) non dessinées, après leur fondu de fermeture. */\n" +
      ".vfp-cartes { visibility: hidden; transition: visibility 0s linear 1.1s; }\n" +
      ".vfp-scene[data-vitrine] .vfp-cartes { visibility: visible; transition: visibility 0s; }\n" +
      "</style>\n</helmet>" },

  // Lueur du papier de l'étude (cercle de 95vmax qui dérive en 44 s) : calque de 810 × 810 px sur iPhone, soit ≈ 23 Mo dans
  // Safari, pour un simple dégradé radial. Même principe que « compact » (validé sur l'iPhone le 08/10) : dessinée dans un
  // cadre 5 fois plus petit (19vmax), au même centre, puis agrandie ×5 par transform (×5,75 en fin de dérive au lieu de ×1,15).
  // Même géométrie à chaque instant ; « réduire les animations » : scale(5) fixe, comme l'original immobile. ≈ 1 Mo.
  { id: "lueur", quoi: "Étude : lueur du papier en texture compacte", fichiers: VF, n: 1,
    avant: "</style>\n</helmet>",
    apres: SAF + "lueur du papier de l'étude dessinée 5 fois plus petite puis agrandie (même centre, même taille à l'écran). */\n" +
      ".vfa-papier i { left: 13vmax; top: 3vmax; width: 19vmax; height: 19vmax; transform: scale(5); }\n" +
      "@keyframes vfa-jour { from { transform: translate3d(0,0,0) scale(5); } to { transform: translate3d(38vw, 22vh, 0) scale(5.75); } }\n" +
      "</style>\n</helmet>" },

  // CANDIDAT ÉCARTÉ le 14/11 (arrêts persistants sur les cartes, défilement saccadé pendant le zoom) : remplacé par « loupe ».
  // « Zoom à plat » (retour de Loan du 09/11, après « pincement » : « je ne peux même plus zoomer ») : le zoom à deux doigts
  // reste possible ; c'est la page qui change de manière de se dessiner tant qu'elle est agrandie, sur écran tactile.
  // Hors zoom, rien ne change. Pendant le zoom (html.vf-zoom, échelle > 1,05, posée par COUVERT_JS de scripts/construire.mjs,
  // qui fige déjà les lueurs d'ambiance en 2D), les calques séparés sont supprimés : les éléments déplacés par le script
  // (translate3d → translate, même position), will-change retiré, backface-visibility rendue « visible » dans le projecteur et
  // l'étude (rien n'y tourne en 3D), apparitions du projecteur terminées arrêtées (elles finissent sur l'état normal), toiles de
  // poussière et de sable d'or cachées (une toile fait passer en calques séparés tout ce qui est dessiné par-dessus). Tout se dessine alors dans quelques grandes zones
  // (scènes épinglées, en-tête), découpées en tuiles par Safari : leur mémoire suit la partie visible de l'écran et ne
  // grandit plus avec le zoom. Image identique ; le défilement pendant le zoom redessine davantage (plus lent, sans arrêt).
  // 11/11 (retour de Loan : « ça crash encore, particulièrement sur les cartes et pendant la séparation yin yang ») : dans Safari,
  // tout élément qui porte un filtre CSS a son calque (RenderLayerCompositor::requiresCompositingForFilters, FilterTrigger permis
  // par défaut), et les cartes qui se retournent sont en vraie 3D. Pendant le zoom : halos décoratifs retirés (lueur dorée des
  // corrections de l'étude, ombres du taiji et des titres, lueur de bordure des cartes), retournement des cartes sans 3D.
  // Gardés : « See pricing » (flou dans son calque, correction « affiche »), le négatif de l'étude (invert, indispensable), les
  // filtres des photos de Loan et du cadre doré de la carte choisie.
  // Au dézoom (échelle < 1,01), tout redevient comme avant au défilement suivant.
  // 11/11 : le passage à plat commence dès que deux doigts touchent l'écran (avant le zoom lui-même : la version du 09/11
  // attendait l'événement de zoom, peut-être trop tard pour Safari) ; grain généré (feTurbulence) masqué pendant le zoom.
  { id: "zoomplat", quoi: "Zoom à deux doigts : page dessinée à plat tant qu'elle est agrandie (styles)", fichiers: VF, n: 1,
    avant: "</style>\n</helmet>",
    apres: SAF + "page agrandie au pincement, écran tactile : plus de calques séparés (mémoire graphique bornée). */\n" +
      "html.vf-zoom-plat .vf *:not(.vfp-affiche), html.vf-zoom-plat .vf *::before, html.vf-zoom-plat .vf *::after { will-change: auto !important; }\n" +
      "html.vf-zoom-plat .vf canvas { visibility: hidden !important; }\n" +
      "/* 11/11 : grain généré (SVG feTurbulence, opacité 5 à 7 %) masqué pendant le zoom : Safari le recalcule à la taille du zoom. */\n" +
      "html.vf-zoom-plat .vf-nuit u, html.vf-zoom-plat .vfp-grain, html.vf-zoom-plat .vfa-papier u, html.vf-zoom-plat .vfa-noir u { visibility: hidden !important; }\n" +
      "html.vf-zoom-plat .vfp *, html.vf-zoom-plat .vfa *, html.vf-zoom-plat .vfk * { -webkit-backface-visibility: visible !important; backface-visibility: visible !important; } /* plus rien n'y tourne en 3D */\n" +
      "/* 11/11 : un filtre CSS donne toujours un calque séparé dans Safari (RenderLayerCompositor : FilterTrigger). Halos décoratifs retirés pendant le zoom :\n" +
      "   lueur dorée des corrections de l'étude, ombres du taiji et des titres yin / yang (aussi posées par le script), lueur de bordure des cartes. */\n" +
      "html.vf-zoom-plat .vfa-svg--or, html.vf-zoom-plat .vfa-taiji, html.vf-zoom-plat .vfa-taiji img, html.vf-zoom-plat .vfk-eclat { filter: none !important; }\n" +
      "/* Cartes de la planche : retournement sans 3D pendant le zoom (la bonne face reste affichée : le script cache l'autre à 90°). */\n" +
      "html.vf-zoom-plat .vfk-flip, html.vf-zoom-plat .vfk-dos { transform: none !important; -webkit-transform-style: flat !important; transform-style: flat !important; }\n" +
      "</style>\n</helmet>" },
  { id: "zoomplat", quoi: "Zoom à deux doigts : page dessinée à plat tant qu'elle est agrandie (script)", fichiers: VF, n: 1,
    avant: '<script src="./support.js"></script>',
    apres: "<script>" + SAF + "page agrandie au pincement sur écran tactile : dessinée à plat (voir les styles « vf-zoom-plat »). */\n" +
      "(() => {\n" +
      "  const R = document.documentElement, tactile = window.matchMedia ? window.matchMedia(\"(any-pointer: coarse)\") : { matches: false };\n" +
      "  /* translate3d(x, y, z) → translate(x, y) : même position, sans calque séparé (valeurs avec calc() comprises). */\n" +
      "  const deux = (t) => { let i = t.indexOf(\"translate3d(\"); while (i >= 0) { let j = i + 12, p = 1; const a = [], d0 = j; let d = d0;\n" +
      "      for (; j < t.length && p; j++) { const c = t[j]; if (c === \"(\") p++; else if (c === \")\") { if (!--p) break; } else if (c === \",\" && p === 1) { a.push(t.slice(d, j)); d = j + 1; } }\n" +
      "      if (p) return t; a.push(t.slice(d, j)); if (a.length !== 3) return t;\n" +
      "      t = t.slice(0, i) + \"translate(\" + a[0].trim() + \", \" + a[1].trim() + \")\" + t.slice(j + 1); i = t.indexOf(\"translate3d(\", i + 10); }\n" +
      "    return t; };\n" +
      "  const plat = (el) => { const t = el.style && el.style.transform; if (t && t.indexOf(\"translate3d(\") >= 0) { const n = deux(t); if (n !== t) el.style.transform = n; } };\n" +
      "  let obs = null, doigts = false;\n" +
      "  const vv = window.visualViewport;\n" +
      "  const suivre = () => { const z = (doigts || R.classList.contains(\"vf-zoom\") || (!!vv && vv.scale > 1.01)) && tactile.matches;\n" +
      "    if (z && !obs) { R.classList.add(\"vf-zoom-plat\"); document.querySelectorAll('.vf [style*=\"translate3d\"]').forEach(plat);\n" +
      "      /* Apparitions du projecteur terminées (elles finissent sur l'état normal : opacité 1, aucune transformation) : arrêtées, sinon\n" +
      "         gardées actives (et en calques) par le navigateur. */\n" +
      "      (document.getAnimations ? document.getAnimations() : []).forEach((a) => { if (/^vfp-(frappe|chauffe|apparait)$/.test(a.animationName || \"\") && a.playState === \"finished\") try { a.cancel(); } catch (e) {} });\n" +
      "      obs = new MutationObserver((l) => { for (const r of l) plat(r.target); }); /* chaque image du script : remis à plat avant d'être dessiné */\n" +
      "      obs.observe(document.body, { attributes: true, attributeFilter: [\"style\"], subtree: true }); }\n" +
      "    else if (!z && obs) { obs.disconnect(); obs = null; R.classList.remove(\"vf-zoom-plat\"); window.dispatchEvent(new Event(\"scroll\")); } };\n" +
      "  new MutationObserver(suivre).observe(R, { attributes: true, attributeFilter: [\"class\"] }); suivre(); /* page ouverte déjà agrandie */\n" +
      "  /* 11/11 : à plat dès que deux doigts touchent l'écran (début possible d'un zoom), donc AVANT que Safari ne redessine au nouveau\n" +
      "     zoom ; au lâcher, retour à la normale si l'échelle est restée à 1. Écouteurs passifs : le défilement n'attend jamais. */\n" +
      "  const poser = (e) => { if (e.touches && e.touches.length >= 2 && !doigts) { doigts = true; suivre(); } };\n" +
      "  const lacher = (e) => { if (doigts && (!e.touches || !e.touches.length)) { doigts = false; setTimeout(suivre, 450); } };\n" +
      "  document.addEventListener(\"touchstart\", poser, { passive: true, capture: true });\n" +
      "  document.addEventListener(\"touchend\", lacher, { passive: true, capture: true }); document.addEventListener(\"touchcancel\", lacher, { passive: true, capture: true });\n" +
      "  if (vv) vv.addEventListener(\"resize\", suivre);\n" +
      "})();\n" +
      "</script>\n" + '<script src="./support.js"></script>' },
  // Zones recouvertes (COUVERT_JS, 02 et 03/11) : sur iPhone, une page agrandie a une hauteur visible (innerHeight) plus petite
  // que l'écran de mise en page auquel se rapportent les positions des zones. La vérification couvre désormais tout cet écran
  // (le plus grand des deux) : une zone n'est jamais cachée alors qu'une partie agrandie la montre. Sans zoom, rien ne change.
  { id: "zoomplat", quoi: "Zones recouvertes : hauteur de l'écran de mise en page quand la page est agrandie", fichiers: VF, n: 1,
    avant: "const couvert = (zones, M, ajust) => { const z = zones.filter(Boolean), H = window.innerHeight,",
    apres: "const couvert = (zones, M, ajust) => { const z = zones.filter(Boolean), H = Math.max(window.innerHeight, R.clientHeight) /* Correction Safari (scripts/safari.mjs) : page agrandie */," },

  // « Loupe » (14/11, retour de Loan après « zoomplat » : « ça crashe toujours sur les cartes […] quand je zoome et que je scrolle,
  // ce n'est pas fluide du tout. Le but, c'est juste que je puisse zoomer comme si je me rapprochais, comme si je zoomais sur
  // l'écran »). Le zoom de Safari redessine TOUJOURS chaque calque à la nouvelle échelle (GraphicsLayerCA::updateContentsScale :
  // échelle de l'écran × zoom ; aucune exception par calque, RenderLayerBacking ne fournit pas customContentsScale) : c'est voulu
  // pour un texte net, et c'est ce qui sature la mémoire sur cette page. Une transformation CSS, elle, n'est jamais redessinée
  // (updateRootRelativeScale désactivé) : les calques déjà dessinés sont agrandis tels quels, comme une loupe sur l'écran.
  // Sur la page d'accueil, écran tactile : le pincement de Safari est désactivé (touch-action) et remplacé par cette loupe.
  // - Pincer : agrandit l'écran autour des doigts, jusqu'à ×4 ; relâcher sous ×1,06 : retour à la normale en douceur.
  // - Agrandi : un doigt déplace la vue dans l'écran agrandi (avec élan) ; la page ne défile pas et ses animations attendent ;
  //   un toucher reste un toucher (liens, cartes). Pour aller ailleurs dans la page : revenir à ×1, défiler, rezoomer.
  // - Mémoire graphique inchangée par rapport à la page sans zoom, mouvement fluide ; le texte agrandi est moins net que le zoom
  //   de Safari (c'est l'image de l'écran qui est agrandie).
  // CGV, Privacy, Legal et Sponsors (légères) gardent le zoom de Safari. Ordinateur inchangé.
  { id: "loupe", quoi: "Loupe au pincement sur la page d'accueil (styles)", fichiers: VF, n: 1,
    avant: "</style>\n</helmet>", apres: LOUPE_CSS + "</style>\n</helmet>" },
  { id: "loupe", quoi: "Loupe au pincement sur la page d'accueil (script)", fichiers: VF, n: 1,
    avant: '<script src="./support.js"></script>', apres: LOUPE_JS + '<script src="./support.js"></script>' },
  // Pendant la loupe, les scènes animées au défilement (projecteur, étude, cartes) et la vérification des zones recouvertes
  // attendent : elles lisent la position des éléments à l'écran, que la loupe agrandit. Elles reprennent au retour à ×1.
  { id: "loupe", quoi: "Loupe : projecteur et étude en pause", fichiers: VF, n: 2,
    avant: "    const maj = () => {\n      raf = 0;\n", apres: "    const maj = () => {\n      raf = 0; if (window.__ldLoupeTactile) return; " + SAF + "en pause pendant la loupe. */\n" },
  { id: "loupe", quoi: "Loupe : cartes en pause", fichiers: VF, n: 1,
    avant: "    const maj = () => {\n      rafS = 0;\n", apres: "    const maj = () => {\n      rafS = 0; if (window.__ldLoupeTactile) return; " + SAF + "en pause pendant la loupe. */\n" },
  // « Filet » (14/11, retour de Loan après « loupe » : « ça plante encore […] aussi en dehors des cartes quand je zoome pendant que ça
  // scroll »). Cause, lue dans WebKit (WKContentViewInteraction.mm, _shouldIgnoreTouchEvent → isInterruptingMomentumScrollingWithEvent) :
  // des doigts posés pendant l'élan d'un défilement ne sont pas transmis à la page ; touch-action ne s'applique pas (aucune règle
  // enregistrée pour ces doigts) et la loupe ne les voit pas : Safari fait son propre zoom et redessine toute la page en grand. Aux
  // cartes, la page arrive presque toujours sur sa lancée (freinage et rebond de l'arrêt sur les cartes). Ce zoom ne peut pas être
  // empêché ; la page doit y survivre : elle passe à plat (sans calques séparés) dès que le défilement s'arrête net en pleine lancée,
  // c'est-à-dire au moment où les doigts touchent l'écran, bien avant la fin du pincement (niveau léger, image identique) ; si Safari
  // a zoomé (visualViewport.scale > 1,01), niveau complet (halos, poussière, grain retirés ; cartes sans 3D) tant que dure le zoom.
  // Reprend « zoomplat » (09 et 11/11), sans son déclenchement à deux doigts (ces doigts-là, transmis, vont à la loupe).
  // Réduit le 18/11 (retour de Loan : « sur mobile, quand je descends tout en bas du site et que je remonte, le site crashe souvent ;
  // quand je remonte plus vite, ça crashe plus tôt ») : plus de passage à plat quand l'élan s'arrête net. Pour remonter vite, on enchaîne
  // les coups de doigt, et chacun rattrape l'élan du précédent : ces doigts-là ne sont pas transmis non plus, l'élan « s'arrête net »
  // et la page passait à plat dès le 2e coup de doigt, pour toute la remontée (simulé : 17,8 s sur 19,3 s), puis revenait d'un coup
  // en haut de page, au projecteur (le plus lourd). À plat, projecteur et étude sont redessinés à chaque image (Chromium : trame
  // +40 à +50 %, styles +35 %), un mode jamais essayé sur l'iPhone en défilement. Seul reste le niveau complet quand Safari a
  // vraiment zoomé (visualViewport.scale, connu pendant le pincement, avant que Safari ne redessine au relâcher des doigts).
  { id: "filet", quoi: "Filet : page à plat si Safari zoome lui-même (styles)", fichiers: VF, n: 1,
    avant: "</style>\n</helmet>", apres: FILET_CSS + "</style>\n</helmet>" },
  { id: "filet", quoi: "Filet : page à plat si Safari zoome lui-même (script)", fichiers: VF, n: 1,
    avant: '<script src="./support.js"></script>', apres: FILET_JS + '<script src="./support.js"></script>' },
  { id: "filet", quoi: "Filet : zones recouvertes sur l'écran de mise en page quand Safari a zoomé", fichiers: VF, n: 1,
    avant: "const couvert = (zones, M, ajust) => { const z = zones.filter(Boolean), H = window.innerHeight,",
    apres: "const couvert = (zones, M, ajust) => { const z = zones.filter(Boolean), H = Math.max(window.innerHeight, R.clientHeight) /* Correction Safari (scripts/safari.mjs) : page agrandie */," },
  { id: "loupe", quoi: "Loupe : zones recouvertes en pause", fichiers: VF, n: 1,
    avant: "const verifier = () => { raf = 0; const v = vf(); if (!v) return;", apres: "const verifier = () => { raf = 0; const v = vf(); if (!v || window.__ldLoupeTactile) return; " + SAF + "en pause pendant la loupe. */" },

  // « Sousplanche » (21/11, retour de Loan : « quand on scroll, tout va bien jusqu'à ce que de nouveau, au moment d'arriver sur les
  // cartes, le site crash sur mobile » ; « on en revient à un vieux bug »). Mesuré (Chromium, format iPhone, règles de WebKit) : en
  // arrivant sur les cartes, l'étude devient transparente (opacité 1 → 0,1, elle s'efface sous la planche) ; la vérification des zones
  // recouvertes (COUVERT_JS, 02-03/11) ne compte plus sur elle, et le haut de la planche est en fondu sur mobile : le projecteur (la
  // partie la plus lourde de la page, pourtant à 17 000 px au-dessus) et le fond « nuit » sont redessinés d'un coup, au moment même où
  // les cartes arrivent et se retournent en 3D. À l'arrêt, sous le papier opaque des cartes, restent aussi les deux caméras de l'étude,
  // son négatif et ses corrections dorées (≈ 4 × 33 Mo selon le modèle de WebKit) : invisibles.
  // Corrections : (1) le projecteur, entièrement hors de l'écran (marge comprise), n'est plus dessiné (pendant toute la planche ; l'étude garde
  // la règle d'origine, pour ne rien changer à la jonction projecteur / étude) ;
  // (2) sur mobile, caméras de l'étude et fond « nuit » non dessinés quand le papier opaque de la planche (ou le pied de page) recouvre
  // la figure de l'étude, marge comprise (la figure est sous le papier ; le reste de l'étude est le noir uni de l'étude noire).
  // Contrôle : 0 pixel de différence, de l'arrêt jusqu'à 320 px plus haut (scripts/verif-sousplanche.mjs). Entre le 15 et le 18/11,
  // le filet mettait la page à plat à chaque coup de doigt pendant les descentes rapides, ce qui allégeait aussi ce moment : retiré le
  // 18/11 (il causait les arrêts en remontant), d'où le retour de l'arrêt sur les cartes.
  { id: "sousplanche", quoi: "Sous la planche II : styles", fichiers: VF, n: 1,
    avant: "</style>\n</helmet>", apres: SOUSPLANCHE_CSS + "</style>\n</helmet>" },
  { id: "sousplanche", quoi: "Zones recouvertes : hors de l'écran, caméras de l'étude sous la planche (aides)", fichiers: VF, n: 1,
    avant: "  let raf = 0;\n  const verifier = () => {", apres: SOUSPLANCHE_AIDES + "  let raf = 0;\n  const verifier = () => {" },
  { id: "sousplanche", quoi: "Zones recouvertes : hors de l'écran, caméras de l'étude sous la planche", fichiers: VF, n: 1,
    avant: "    for (const c in zones) { const deja = R.classList.contains(c), v = deja ? couvert(zones[c], M / 2, -24) : couvert(zones[c], M, 10);\n      if (v !== deja) R.classList.toggle(c, v); } };",
    apres: SOUSPLANCHE_FIN },

  // « Glisse » (21/11, retour de Loan : « sur Safari Mac, quand on clique sur n'importe quel lien du sommaire ça scroll instantanément
  // à la section cliquée, no smooth at all, ça ne fonctionne pas comme sur Chromium […] Le site doit être uniforme peu importe le
  // navigateur »). Défilements doux calculés par la page avec la courbe de Chrome (voir GLISSE_JS).
  { id: "glisse", quoi: "Défilement doux identique dans tous les navigateurs", fichiers: VF, n: 1,
    avant: '<script src="./support.js"></script>', apres: GLISSE_JS + '<script src="./support.js"></script>' },

  // « Inclinaison » (21/11, retour de Loan sur Safari Mac : l'inclinaison des cartes de paiement est faible et tremble).
  { id: "inclinaison", quoi: "Inclinaison des cartes : script", fichiers: VF, n: 1,
    avant: '<script src="./support.js"></script>', apres: INCLINAISON_JS + '<script src="./support.js"></script>' },
  { id: "inclinaison", quoi: "Inclinaison des cartes : suivre la souris", fichiers: VF, n: 1,
    avant: "      incliner: (e) => {\n        const c = e.currentTarget;\n",
    apres: "      incliner: (e) => {\n        if (window.__ldIncline) { window.__ldIncline.suivre(e.currentTarget, e.clientX, e.clientY); return; } " + SAF + "inclinaison calculée image par image. */\n        const c = e.currentTarget;\n" },
  { id: "inclinaison", quoi: "Inclinaison des cartes : revenir à plat", fichiers: VF, n: 1,
    avant: "      relacher: (e) => {\n        const c = e.currentTarget;\n",
    apres: "      relacher: (e) => {\n        if (window.__ldIncline) { window.__ldIncline.lacher(e.currentTarget); return; } " + SAF + "inclinaison calculée image par image. */\n        const c = e.currentTarget;\n" },

  // « Titre » (21/11, retour de Loan sur Safari Mac : « en commençant à scroller, avant même que le chargement soit fini, le titre
  // Video Feedback devient super gros »). Les mots du titre ne sont réduits (ecarter) qu'après une lecture unique de la silhouette de
  // Loan dans la photo principale (img.lit, canvas 44 × 66), au chargement de la photo. Si la photo n'est pas lisible à cet instant
  // (échec puis nouvel essai, image remplacée par le moteur de la page, ou dessinée vide car pas encore décodée), la silhouette reste
  // vide ou absente et le titre garde sa taille d'origine pour toute la visite (reproduit dans Chromium avec un échec à la Safari :
  // titre de 403 px au lieu de 185). La silhouette est maintenant relue jusqu'à être lisible (au moins 150 cases opaques sur 2 904 ;
  // la photo en a 488), à chaque chargement d'une photo principale et toutes les 250 ms pendant 20 s au plus.
  { id: "titre", quoi: "Projecteur : silhouette relue jusqu'à ce que la photo soit lisible (titre réduit)", fichiers: VF, n: 1,
    avant: '    { const im = fig.querySelector("img.lit"), lire = () => { try { const c = document.createElement("canvas"); c.width = 44; c.height = 66; const g = c.getContext("2d"); g.drawImage(im, 0, 0, 44, 66); const d = g.getImageData(0, 0, 44, 66).data; A = []; for (let j = 0; j < 66; j++) for (let i = 0; i < 44; i++) if (d[(j * 44 + i) * 4 + 3] > 40) A.push(i, j); ecarter(); } catch (e) {} };\n      if (im.complete && im.naturalWidth) setTimeout(lire); else im.addEventListener("load", lire, { once: true }); }',
    apres: '    { ' + SAF + 'silhouette relue jusqu\'à ce que la photo soit vraiment lisible (21/11 : sinon le titre restait en grand). */\n' +
      '      let essais = 0;\n' +
      '      const lire = () => { const im = sec.querySelector("img.lit") || fig.querySelector("img.lit"); if (!im || !im.complete || !im.naturalWidth) return false;\n' +
      '        try { const c = document.createElement("canvas"); c.width = 44; c.height = 66; const g = c.getContext("2d"); g.drawImage(im, 0, 0, 44, 66); const d = g.getImageData(0, 0, 44, 66).data; const B = []; for (let j = 0; j < 66; j++) for (let i = 0; i < 44; i++) if (d[(j * 44 + i) * 4 + 3] > 40) B.push(i, j);\n' +
      '          if (B.length < 300) return false; A = B; ecarter(); return true; } catch (e) { return false; } };\n' +
      '      const essayer = () => { if (A || lire()) { document.removeEventListener("load", surCharge, true); return; } if (++essais < 80) setTimeout(essayer, 250); };\n' +
      '      const surCharge = (e) => { const t = e.target; if (t && t.matches && t.matches("img.lit")) setTimeout(essayer); };\n' +
      '      document.addEventListener("load", surCharge, true); /* les chargements d\'images ne remontent pas : écoutés à la descente */\n' +
      '      setTimeout(essayer); }' },

  // « Images » (21/11, deux retours de Loan sur Safari Mac : images absentes au premier chargement ; voir IMAGES_HTML).
  { id: "images", quoi: "Images tenues pendant leur téléchargement, image en échec cachée et redemandée", fichiers: VF, n: 1,
    avant: '<script src="./support.js"></script>', apres: IMAGES_HTML + '<script src="./support.js"></script>' },
  // L'écran de chargement attend les images du premier écran, mais une image en échec y comptait comme arrivée (img.complete est
  // vrai aussi pour une image cassée) : la page apparaissait avec le « ? » de Safari (second retour de Loan du 21/11 : « l'écran de
  // chargement sert justement à ce que tout soit chargé »). Une image en train d'être redemandée ne compte plus comme arrivée.
  { id: "images", quoi: "Écran de chargement : une image redemandée n'est pas encore arrivée", fichiers: ["chargement.js"], n: 1,
    avant: "if (i.complete) ok++; }",
    apres: "if (i.complete && i.getAttribute(\"data-ld-reessai\") !== \"\") ok++; } " + SAF + "image redemandée : pas encore arrivée. */" },
  ...["Video Feedback.dc.html", "CGV.dc.html", "Privacy.dc.html", "Legal.dc.html"].map((f) => ({ id: "images", quoi: "Écran de chargement : nouvelle version (cache)", fichiers: [f], n: 1,
    avant: "chargement.js?v=7q", apres: "chargement.js?v=7r" })),
];

// Fichiers ajoutés par une correction (copiés seulement si une page construite l'utilise).
const FICHIERS_PAR_ID = {
  textures: TEXTURES.map((t) => ({ de: `optimise/assets/lumiere/${t.nom}.png`, vers: `${TEX}${t.nom}.png` })),
};

const choix = process.env.SAFARI;
// Retenues pour la page publiée. Les candidats n'y entrent qu'après mesure (voir PERFORMANCE.md).
// « compact » et « affiche » : retenus le 08/10 après la validation sur l'iPhone de Loan (endurance : 0 arrêt sur 3 avec
// « compact », 3 sur 3 sans ; mémoire graphique 490 → 215 Mo ; ligne rose disparue avec « affiche »).
// « lvh » et « camera » (retour de Loan du 08/10 : bande noire en bas, yin-yang lent) : proposés pour la page publiée ; sans effet
// visible sur ordinateur (lvh = svh ; caméra identique à 60 images/s, traits exacts au repos). À confirmer sur l'iPhone.
// « zoomplat », « eteints » et « lueur » (retour de Loan du 09/11 : arrêt de la page au zoom à deux doigts sur mobile) : voir
// PERFORMANCE.md, « Retour de Loan du 09/11 ». Image identique (Chromium) ; à confirmer sur l'iPhone (adresse de test).
// « pincement » (zoom bloqué) écarté : Loan veut garder le zoom.
// « zoomplat » écarté le 14/11 (arrêts persistants sur les cartes, défilement saccadé pendant le zoom) : remplacé par « loupe »
// (le zoom de Safari est remplacé par une loupe qui agrandit l'écran sans le redessiner). Voir PERFORMANCE.md, « Retour de Loan du 14/11 ».
// « filet » (14/11) : arrêts persistants avec la loupe quand on zoome pendant l'élan d'un défilement (doigts non transmis par Safari).
// Réduit le 18/11 au seul zoom réel de Safari (arrêts en remontant la page : voir le commentaire de la correction).
// « sousplanche », « glisse », « inclinaison », « images », « titre » (retours de Loan du 21/11) : voir les commentaires des corrections et journal/.
export const SAFARI_IDS = choix === "aucune" ? [] : choix ? choix.split(",") : ["entete", "textures", "compact", "affiche", "lvh", "camera", "eteints", "lueur", "loupe", "filet", "sousplanche", "glisse", "inclinaison", "images", "titre"];
export const SAFARI_TOUTES = TOUTES;
export const SAFARI = TOUTES.filter((c) => SAFARI_IDS.includes(c.id));
// Adresse de test : pages de comparaison (mêmes corrections de contenu et optimisations que la page publiée).
//   actuel.html   = version c9bb055 (aucune correction Safari)    textures.html = actuel + prototype de textures, rien d'autre
//   corrige.html  = entete + textures + compact (contenu actuel) : mêmes corrections Safari que la validation du 08/10
//   avant.html    = page publiée sans « lvh » ni « camera » (avec le contenu du 08/10 : en-tête, pied de page, petites cartes ;
//                   ce n'est pas la page du plantage du 08/10 à 15 h 18) : comparaison du yin-yang et du bas d'écran
export const VARIANTES_ESSAI = { "actuel.html": [], "textures.html": ["textures"], "corrige.html": ["entete", "textures", "compact"], "avant.html": ["entete", "textures", "compact", "affiche"] };
export const fichiersSafari = (ids) => [...new Set(ids)].flatMap((id) => FICHIERS_PAR_ID[id] || []);

// Les textures doivent avoir été calculées à partir des règles CSS actuelles de l'export.
export function controleTextures(racine) {
  const html = fs.readFileSync(path.join(racine, "Video Feedback.dc.html"), "utf8");
  const man = JSON.parse(fs.readFileSync(path.join(racine, "optimise/assets/lumiere/textures.json"), "utf8"));
  return TEXTURES.filter((t) => man[t.nom] !== empreinte(html, t)).map((t) => t.nom);
}
