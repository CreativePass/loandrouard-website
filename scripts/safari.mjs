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
];

// Fichiers ajoutés par une correction (copiés seulement si une page construite l'utilise).
const FICHIERS_PAR_ID = {
  textures: TEXTURES.map((t) => ({ de: `optimise/assets/lumiere/${t.nom}.png`, vers: `${TEX}${t.nom}.png` })),
};

const choix = process.env.SAFARI;
// Retenues pour la page publiée. Les candidats n'y entrent qu'après mesure (voir PERFORMANCE.md).
// « compact » et « affiche » : retenus le 08/10 après la validation sur l'iPhone de Loan (endurance : 0 arrêt sur 3 avec
// « compact », 3 sur 3 sans ; mémoire graphique 490 → 215 Mo ; ligne rose disparue avec « affiche »).
export const SAFARI_IDS = choix === "aucune" ? [] : choix ? choix.split(",") : ["entete", "textures", "compact", "affiche"];
export const SAFARI_TOUTES = TOUTES;
export const SAFARI = TOUTES.filter((c) => SAFARI_IDS.includes(c.id));
// Adresse de test : pages de comparaison (mêmes corrections de contenu et optimisations que la page publiée).
//   actuel.html   = version c9bb055 (aucune correction Safari)    textures.html = actuel + prototype de textures, rien d'autre
//   corrige.html  = entete + textures + compact : page de la validation du 08/10 (la proposition y ajoute « affiche »)
export const VARIANTES_ESSAI = { "actuel.html": [], "textures.html": ["textures"], "corrige.html": ["entete", "textures", "compact"] };
export const fichiersSafari = (ids) => [...new Set(ids)].flatMap((id) => FICHIERS_PAR_ID[id] || []);

// Les textures doivent avoir été calculées à partir des règles CSS actuelles de l'export.
export function controleTextures(racine) {
  const html = fs.readFileSync(path.join(racine, "Video Feedback.dc.html"), "utf8");
  const man = JSON.parse(fs.readFileSync(path.join(racine, "optimise/assets/lumiere/textures.json"), "utf8"));
  return TEXTURES.filter((t) => man[t.nom] !== empreinte(html, t)).map((t) => t.nom);
}
