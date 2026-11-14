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
  { id: "loupe", quoi: "Loupe : zones recouvertes en pause", fichiers: VF, n: 1,
    avant: "const verifier = () => { raf = 0; const v = vf(); if (!v) return;", apres: "const verifier = () => { raf = 0; const v = vf(); if (!v || window.__ldLoupeTactile) return; " + SAF + "en pause pendant la loupe. */" },
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
// (le zoom de Safari est remplacé par une loupe qui agrandit l'écran sans le redessiner). Voir PERFORMANCE.md, « 14/11 ».
export const SAFARI_IDS = choix === "aucune" ? [] : choix ? choix.split(",") : ["entete", "textures", "compact", "affiche", "lvh", "camera", "eteints", "lueur", "loupe"];
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
