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
export const SAFARI_IDS = choix === "aucune" ? [] : choix ? choix.split(",") : ["entete", "textures", "compact", "affiche", "lvh", "camera"];
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
