// Optimisations de performance, appliquées par scripts/construire.mjs sur la COPIE public/ (jamais sur l'export).
// Même format que les corrections : n = nombre d'occurrences attendues dans l'export ; si l'export contient déjà
// le texte optimisé, rien n'est fait ; si le passage d'origine a changé, la construction s'arrête (à revoir).
// Chacune est justifiée par une mesure (scripts/mesurer.mjs) : voir PERFORMANCE.md.
// Elles ne changent ni le contenu ni le rendu : seulement la manière de calculer ou de charger. Seule exception,
// « aimantation » : correction de navigation validée par Loan (02/10), à reporter aussi dans Claude Design.
// Pour mesurer l'effet d'une seule : OPTIMISATIONS=id1,id2 npm run construire (ou OPTIMISATIONS=aucune).

import fs from "node:fs";
import path from "node:path";

const VF = ["Video Feedback.dc.html"];
const PAGES_PUBLIEES = ["Video Feedback.dc.html", "CGV.dc.html", "Privacy.dc.html", "Legal.dc.html"];
const DS = "_ds/loan-drouard-design-system-06a79c98-aed9-4ca8-8b81-69bb72fcc98a";
// Images loin sous la ligne de flottaison (yin-yang, revers des cartes, logo du pied de page). Les images de
// l'étude restent en chargement immédiat : différées, elles arrivaient en retard lors d'un défilement très rapide
// sur mobile (mesuré).
const IMAGES_DIFFEREES = [
  ["Video Feedback.dc.html", '<img src="assets/yin-yang-noir.png"', 1],
  ["Video Feedback.dc.html", '<img src="assets/yin-yang-blanc.png"', 1],
  ["Video Feedback.dc.html", '<img class="vfk-dos-motif" src="assets/blueprint/dos-carte-1.webp"', 1],
  ["Video Feedback.dc.html", '<img class="vfk-dos-motif" src="assets/blueprint/dos-carte-2.webp"', 1],
  ["Video Feedback.dc.html", '<img class="vfk-dos-motif" src="assets/blueprint/dos-carte.webp"', 1],
  ["Video Feedback.dc.html", `<img class="vfk-dos-sceau" src="${DS}/assets/sceau-blanc.svg"`, 3],
  ["Sponsors.dc.html", '<img src="{{ s.logo }}"', 1],
];
// Polices du premier écran de chaque page (relevées par scripts/mesurer.mjs, cascade des requêtes).
const PRECHARGES = {
  "Video Feedback.dc.html": ["cormorant-300-700-italic-latin", "cormorant-sc-600-latin", "cormorant-300-700-latin"],
  "CGV.dc.html": ["cormorant-sc-600-latin", "cormorant-300-700-latin", "cormorant-300-700-italic-latin"],
  "Privacy.dc.html": ["cormorant-sc-600-latin", "cormorant-300-700-latin"],
  "Legal.dc.html": ["cormorant-sc-600-latin", "cormorant-300-700-latin", "cormorant-300-700-italic-latin"],
};
const REACT = [
  { nom: "REACT_URL", url: "https://unpkg.com/react@18.3.1/umd/react.production.min.js", de: "node_modules/react/umd/react.production.min.js", vers: "vendor/react-18.3.1/react.production.min.js", sri: "REACT_SRI" },
  { nom: "REACT_DOM_URL", url: "https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js", de: "node_modules/react-dom/umd/react-dom.production.min.js", vers: "vendor/react-18.3.1/react-dom.production.min.js", sri: "REACT_DOM_SRI" },
];
// Empreinte SRI inscrite dans support.js (le préchargement doit porter la même, sinon il n'est pas réutilisé).
const SUPPORT = fs.readFileSync(path.join(import.meta.dirname, "..", "support.js"), "utf8");
const sri = (nom) => SUPPORT.match(new RegExp(`var ${nom} = "([^"]+)"`))?.[1] ?? "";
const OPTIM = "/* Optimisation (scripts/optimisations.mjs) : ";

const TOUTES = [
  // Défilement : la molette et le glissé du doigt ne passent par le script que pendant le verrou du
  // retournement des cartes (~2 s) ; le reste du temps, le navigateur défile sans attendre le script.
  { id: "defilement", quoi: "Molette et glissé non bloquants hors du verrou du retournement", fichiers: VF, n: 1,
    avant: '    window.addEventListener("wheel", onWheel, { passive: false });\n    window.addEventListener("touchstart", onTS, { passive: true });\n    window.addEventListener("touchmove", onTM, { passive: false });\n',
    apres: '    window.addEventListener("touchstart", onTS, { passive: true });\n' +
      '    ' + OPTIM + "molette et glissé ne bloquent le défilement que pendant le verrou du retournement. */\n" +
      "    let tVerrou = 0;\n" +
      '    const armerVerrou = () => {\n      window.addEventListener("wheel", onWheel, { passive: false }); window.addEventListener("touchmove", onTM, { passive: false });\n' +
      '      clearTimeout(tVerrou); tVerrou = setTimeout(() => { window.removeEventListener("wheel", onWheel); window.removeEventListener("touchmove", onTM); }, Math.max(0, finVerrou - performance.now()) + 100);\n    };\n' },
  { id: "defilement", quoi: "Molette et glissé : armés au début du verrou", fichiers: VF, n: 1,
    avant: "finVerrou = t0 + ((3.8 + (C.length - 1) * LAG) / VIT) * 1000 + 150; }",
    apres: "finVerrou = t0 + ((3.8 + (C.length - 1) * LAG) / VIT) * 1000 + 150; armerVerrou(); }" },

  // Aimantation (validée par Loan le 02/10, à reporter dans Claude Design) : scroll-snap « proximity » ramenait la
  // page au cran du projecteur après chaque cran de molette (molette lente bloquée, mesuré). Seule l'aimantation est
  // retirée : la page s'ouvre en haut, comme le prévoit le code d'origine (enHaut → scrollTo(0, 0)). L'aimantation
  // l'emmenait parfois au cran pendant le chargement (course, selon le navigateur et la largeur) ; l'ouverture au cran
  // un temps forcée ici déclenchait le mode « vite » (séquence d'ouverture écourtée) et plaçait le titre sous l'en-tête
  // sur mobile (retour de Loan, 03/10).
  { id: "aimantation", quoi: "Aimantation au cran du projecteur retirée", fichiers: VF, n: 1,
    avant: "html { scroll-snap-type: y proximity; }", apres: "/* Aimantation retirée (scripts/optimisations.mjs, validé par Loan le 02/10) : la molette n'est plus ramenée au cran. */" },

  // Poussière du projecteur : la boucle d'animation s'arrête quand le projecteur est hors écran.
  { id: "poussiere", quoi: "Poussière du projecteur : boucle arrêtée hors écran", fichiers: VF, n: 1,
    avant: "    const dessiner = (now) => {\n      rafP = requestAnimationFrame(dessiner);\n",
    apres: "    const dessiner = (now) => {\n      " + OPTIM + "hors écran, la boucle s'arrête ; maj() la relance au retour. */\n      if (C && !C.vis) { rafP = 0; tPrev = 0; return; }\n      rafP = requestAnimationFrame(dessiner);\n" },
  { id: "poussiere", quoi: "Poussière du projecteur : relance au retour à l'écran", fichiers: VF, n: 1,
    avant: "      C = { z, Sx, Sy, Ls, len, wb, ux: dx / len, uy: dy / len, I, P, vis: r.bottom > 0 && r.top < H };\n",
    apres: "      C = { z, Sx, Sy, Ls, len, wb, ux: dx / len, uy: dy / len, I, P, vis: r.bottom > 0 && r.top < H };\n      if (C.vis && !rafP) rafP = requestAnimationFrame(dessiner);\n" },
  { id: "poussiere", quoi: "Poussière du projecteur : un seul départ de boucle", fichiers: VF, n: 1,
    avant: '    rafP = requestAnimationFrame(dessiner);\n    window.addEventListener("scroll", onScroll, { passive: true });',
    apres: '    if (!rafP) rafP = requestAnimationFrame(dessiner);\n    window.addEventListener("scroll", onScroll, { passive: true });' },

  // Parallaxe au pointeur : projecteur hors écran, rien à recalculer (la position est reprise telle quelle au retour).
  { id: "parallaxe", quoi: "Parallaxe du projecteur ignorée hors écran", fichiers: VF, n: 1,
    avant: "    const suivre = () => { sx += (px - sx) * 0.07; sy += (py - sy) * 0.07; maj();",
    apres: "    const suivre = () => { if (C && !C.vis) { sx = px; sy = py; anim = 0; return; } " + OPTIM + "projecteur hors écran, rien à recalculer. */ sx += (px - sx) * 0.07; sy += (py - sy) * 0.07; maj();" },

  // Sable d'or du pied de page : --flux n'est utilisé que par le nom ; posé sur toute la section, il faisait
  // recalculer le style de tout le pied de page à chaque image.
  { id: "sable", quoi: "Sable d'or : --flux posé sur le nom seul", fichiers: ["Sponsors.dc.html"], n: 1,
    avant: '      sec.style.setProperty("--flux", (f * o.lit).toFixed(3));',
    apres: '      (nom || sec).style.setProperty("--flux", (f * o.lit).toFixed(3)); ' + OPTIM + "seul le nom l'utilise. */" },

  // React servi par le site (accord de Loan, 02/10) : mêmes fichiers que unpkg.com. Le moteur les charge toujours
  // avec leur empreinte (SRI) : le navigateur refuse un fichier différent ; construire.mjs vérifie aussi l'empreinte.
  // Pas de window.__resources : il dispenserait aussi le moteur de relire la page, relecture nécessaire (le DOM met
  // les attributs en minuscules : onChange devenait onchange et le sélecteur de langue ne répondait plus).
  ...REACT.map((r) => ({ id: "react", quoi: "React servi par le site (support.js)", fichiers: ["support.js"], n: 1,
    avant: `var ${r.nom} = "${r.url}";`, apres: `var ${r.nom} = "${r.vers}"; ` + OPTIM + `même fichier que ${r.url} */` })),
  ...PAGES_PUBLIEES.map((f) => ({ id: "react", quoi: "React servi par le site (préchargement)", fichiers: [f], n: 1,
    avant: '<script src="./support.js"></script>',
    apres: REACT.map((r) => `<link rel="preload" as="script" href="${r.vers}" integrity="${sri(r.sri)}" crossorigin>\n`).join("") +
      '<script src="./support.js"></script>' })),

  // Préchargements : ce que chaque page demande de toute façon, mais seulement après le démarrage du moteur
  // (pied de page Sponsors, polices du premier écran) ; connexion anticipée au serveur des polices Google.
  ...Object.entries(PRECHARGES).map(([f, polices]) => ({ id: "precharges", quoi: "Préchargement du pied de page et des polices", fichiers: [f], n: 1,
    avant: '<script src="./support.js"></script>',
    apres: '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
      '<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Long+Cang&family=Ma+Shan+Zheng&display=swap">\n' +
      '<link rel="preload" as="fetch" href="Sponsors.dc.html" crossorigin>\n' +
      polices.map((p) => `<link rel="preload" as="font" type="font/woff2" href="${DS}/assets/fonts/${p}.woff2" crossorigin>\n`).join("") +
      '<script src="./support.js"></script>' })),

  // Écran de chargement : retirer sa feuille de style (et sa police) forçait à recalculer le style et les polices
  // de toute la page au moment où elle apparaît. La feuille reste, inerte (elle ne vise que l'écran retiré).
  { id: "chargement", quoi: "Écran de chargement : feuille de style laissée en place", fichiers: ["chargement.js"], n: 1,
    avant: "    el.remove(); st.remove();", apres: "    el.remove(); " + OPTIM + "la feuille, inerte, reste en place. */" },
  // Ressource en échec (ex. balise Cloudflare Web Analytics bloquée par Safari ou un bloqueur) : elle n'arrivera jamais.
  // Safari ne laisse alors aucune trace (Resource Timing) : l'écran restait à 96 % jusqu'à sa limite de 20 s (retour
  // de Loan, 03/10). Un échec compte désormais comme terminé.
  { id: "chargement", quoi: "Écran de chargement : une ressource en échec ne bloque plus", fichiers: ["chargement.js"], n: 1,
    avant: "  const recu = u => /^(blob|data):/.test(u) || performance.getEntriesByName(abs(u)).length > 0;",
    apres: "  const echecs = new Set(); " + OPTIM + "une ressource en échec n'arrivera jamais (Safari n'en garde aucune trace). */\n" +
      "  addEventListener(\"error\", e => { const t = e.target; if (t && t !== window && (t.src || t.href)) echecs.add(abs(t.src || t.href)); }, true);\n" +
      "  const recu = u => /^(blob|data):/.test(u) || echecs.has(abs(u)) || performance.getEntriesByName(abs(u)).length > 0;" },
  // Version 7p : le contenu a encore changé depuis la 7o publiée le 03/10 (cache d'un an chez les visiteurs).
  ...PAGES_PUBLIEES.map((f) => ({ id: "chargement", quoi: "Écran de chargement : nouvelle version (cache)", fichiers: [f], n: 1,
    avant: "chargement.js?v=7", apres: "chargement.js?v=7p" })),

  // Scripts exécutés deux fois (par la page, puis par le moteur) : une seule installation suffit.
  { id: "doublons", quoi: "Header flottant installé une seule fois", fichiers: ["header-flottant.js"], n: 1,
    avant: "(() => {\n  const SELECTEUR_FOND", apres: "(() => {\n  if (window.__ldHeaderFlottant) return; window.__ldHeaderFlottant = 1; " + OPTIM + "script chargé deux fois, installé une fois. */\n  const SELECTEUR_FOND" },
  // Le design system contient une copie plus ancienne du header flottant (sans le cas vf-diff). En ligne, sa
  // seconde exécution passe en dernier et décide du ton ; une fois chacun, header-flottant.js passerait en dernier
  // et garderait « sombre » après un saut hors du projecteur (texte blanc sur fond clair, vu au pixel).
  // header-flottant.js est donc placé avant le design system : même ordre de décision qu'en ligne.
  ...PAGES_PUBLIEES.map((f) => ({ id: "doublons", quoi: "Header flottant : nouvelle version (cache), avant le design system", fichiers: [f], n: 1,
    avant: `<script src="${DS}/_ds_bundle.js"></script>\n<script src="header-flottant.js?v=4"></script>`,
    apres: `<script src="header-flottant.js?v=4o"></script>\n<script src="${DS}/_ds_bundle.js"></script>` })),
  { id: "doublons", quoi: "Design system exécuté une seule fois", fichiers: [DS + "/_ds_bundle.js"], n: 1,
    avant: "(() => {\n\nconst __ds_ns = (window.LoanDrouardDesignSystem_06a79c",
    apres: "(() => {\nif (window.__dsBundle06a79c) return; window.__dsBundle06a79c = 1; " + OPTIM + "chargé deux fois, exécuté une fois (mêmes composants pour React). */\nconst __ds_ns = (window.LoanDrouardDesignSystem_06a79c" },

  // blueprint.js n'a rien à animer sur Video Feedback (aucun data-blueprint ni data-parallax) mais interrogeait
  // la page toutes les 120 ms. construire.mjs vérifie que la page ne s'en sert toujours pas.
  { id: "blueprint", quoi: "blueprint.js retiré de Video Feedback (inutilisé)", fichiers: VF, n: 1,
    avant: '<script src="blueprint.js?v=7"></script>\n', apres: "" },

  // styles.css réimporte les 8 feuilles déjà liées une à une : chaque règle était appliquée deux fois.
  ...[...PAGES_PUBLIEES, "Sponsors.dc.html"].map((f) => ({ id: "css", quoi: "Lien redondant vers styles.css retiré", fichiers: [f], n: 1,
    avant: `<link rel="stylesheet" href="${DS}/styles.css">\n`, apres: "" })),

  // Images loin sous la ligne de flottaison : chargement différé (loading="lazy"). Mesuré contre « priorité basse »
  // (aucun octet économisé) et l'actuel : −0,8 Mo au premier chargement, aucune apparition tardive mesurée.
  ...IMAGES_DIFFEREES.map(([f, avant, n]) => ({ id: "images", quoi: 'Image loin sous la ligne de flottaison : loading="lazy"', fichiers: [f], n,
    avant, apres: avant.replace("<img ", '<img loading="lazy" ') })),
];

// Fichiers ajoutés ou remplacés dans public/ (construire.mjs les contrôle avant de les copier) :
// - sri : le fichier doit avoir exactement l'empreinte inscrite dans le fichier indiqué (même octets que le CDN) ;
// - original : empreinte SHA-256 du fichier de l'export remplacé ; s'il a changé, la version optimisée est ignorée.
const FICHIERS_TOUS = [
  ...REACT.map((r) => ({ id: "react", quoi: "React servi par le site (" + r.vers.split("/").pop() + ")", de: r.de, vers: r.vers,
    sri: { fichier: "support.js", motif: new RegExp(`var ${r.sri} = "([^"]+)"`) }, exige: { fichier: "support.js", textes: [`var ${r.nom} = "${r.vers}";`] } })),
  { id: "logo", quoi: "Logo sponsor à la taille affichée (398 → 65 Ko)", de: "optimise/assets/sponsors/wushu-performance.png", vers: "assets/sponsors/wushu-performance.png",
    original: "a962b801020cb236c5645f412115d8381b0b618ad2c6635a974d90d220a5fd10" },
];

const choix = process.env.OPTIMISATIONS;
const garder = (o) => !choix || (choix !== "aucune" && choix.split(",").includes(o.id));
export const OPTIMISATIONS = TOUTES.filter(garder);
export const FICHIERS = FICHIERS_TOUS.filter(garder);
