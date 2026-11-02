// Construit public/ (le dossier mis en ligne) par COPIE des fichiers de l'export.
// Les originaux ne sont jamais modifiés. Liste blanche : PASSATION-CLAUDE-CODE.md § 1.
// Usage : npm run construire
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { OPTIMISATIONS, FICHIERS } from "./optimisations.mjs";
import { SAFARI, SAFARI_IDS, SAFARI_TOUTES, VARIANTES_ESSAI, fichiersSafari, controleTextures } from "./safari.mjs";
import { TRADUCTION, BOUTONS } from "./traduction-fr.mjs";

const RACINE = path.resolve(import.meta.dirname, "..");
const PUBLIC = path.join(RACINE, "public");
// ESSAI=1 : adresse de test seulement (npm run publier:essai) — diagnostic temporaire et pages de comparaison.
const ESSAI = process.env.ESSAI === "1";
const DS = "_ds/loan-drouard-design-system-06a79c98-aed9-4ca8-8b81-69bb72fcc98a";

// --- Liste blanche (§ 1) ---------------------------------------------------
const PAGES = [
  "Video Feedback.dc.html",
  "CGV.dc.html",
  "Privacy.dc.html",
  "Legal.dc.html",
  "Sponsors.dc.html",
];
const SCRIPTS = ["support.js", "chargement.js", "header-flottant.js", "poussiere-or.js", "blueprint.js"];
const DOSSIERS = ["_ds", "assets"];
// Icône du site (silhouette envoyée par Loan le 20/10, recadrée en carré) : lue d'office par les navigateurs à la racine.
const ICONES = ["favicon.ico", "apple-touch-icon.png"];
const EXCLUS = ["assets/photos/press-hd"]; // photos HD de Press, pas encore publique
const IGNORES = [".DS_Store", "Thumbs.db"];

// --- Corrections validées par Loan, appliquées sur la COPIE ------------------
// n = nombre d'occurrences attendues dans l'export. Si l'export contient déjà le texte corrigé,
// la correction ne fait rien ; si le passage d'origine a changé, la construction s'arrête.
// À reporter aussi dans l'outil de design (Claude Design).
const VF = ["Video Feedback.dc.html"];
const LEGALES = ["CGV.dc.html", "Privacy.dc.html", "Legal.dc.html"];
const DELAI = (cond, txt) => `<sc-if value="{{ ${cond} }}" hint-placeholder-val="{{ true }}"><p class="vfk-delai">${txt}</p></sc-if>`;
// Cartes des formules sur mobile (retour de Loan du 08/10) : repères dans la page, styles et script.
// Menu hamburger de l'en-tête sur mobile (retour de Loan du 15/10) : Home, Video Feedback, The Journey et Press / Contact
// passent dans un menu ouvert par un bouton à droite, sous les langues. Même script sur Video Feedback et les pages légales.
const BURGER = '<button class="ld-burger" type="button" aria-label="Menu" aria-expanded="false"><i></i><i></i><i></i></button>\n';
const MENU_JS = `<script>/* Correction du 15/10 (scripts/construire.mjs) : menu hamburger de l'en-tête sur mobile. */
(() => { if (window.__ldMenu) return; window.__ldMenu = 1;
  const ouverts = () => document.querySelectorAll(".ld-header.ld-menu-ouvert");
  const fermer = (h) => { h.classList.remove("ld-menu-ouvert"); const b = h.querySelector(".ld-burger"); if (b) b.setAttribute("aria-expanded", "false"); };
  document.addEventListener("click", (e) => {
    const b = e.target && e.target.closest ? e.target.closest(".ld-burger") : null;
    ouverts().forEach((h) => { if (!b || !h.contains(b)) fermer(h); });
    if (!b) return;
    const h = b.closest(".ld-header"), o = !h.classList.contains("ld-menu-ouvert");
    h.classList.toggle("ld-menu-ouvert", o); b.setAttribute("aria-expanded", o ? "true" : "false");
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") ouverts().forEach(fermer); });
  let y0 = 0; addEventListener("scroll", () => { const l = ouverts(); if (!l.length) { y0 = scrollY; return; } if (Math.abs(scrollY - y0) > 40) l.forEach(fermer); }, { passive: true });
})();
</script>
`;
// Styles communs : bouton à trois traits (croix une fois ouvert) et menu déroulant sombre, aligné à droite.
const MENU_CSS = (entete, nav) => `.ld-burger { display: none; }
@media (max-width: 1040px) {
  ${entete}::after { content: ''; order: 2; flex-basis: 100%; height: 0; }
  .ld-burger { order: 3; margin: -6px -9px -6px auto; display: flex; flex-direction: column; justify-content: center; gap: 5px; width: 40px; height: 30px; padding: 6px 9px; border: 0; background: none; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
  .ld-burger i { display: block; height: 1px; background: currentColor; transition: transform .3s ease, opacity .3s ease; }
  .ld-menu-ouvert .ld-burger i:nth-child(1) { transform: translateY(6px) rotate(45deg); }
  .ld-menu-ouvert .ld-burger i:nth-child(2) { opacity: 0; }
  .ld-menu-ouvert .ld-burger i:nth-child(3) { transform: translateY(-6px) rotate(-45deg); }
  .ld-burger:focus-visible { outline: 1px solid #A9814A; outline-offset: 2px; }
  ${nav} { position: absolute; top: calc(100% - 4px); right: 12px; width: auto !important; display: flex; flex-direction: column; align-items: flex-end; gap: 16px !important; padding: 18px 22px; border: 1px solid rgba(246,245,241,.14); border-radius: 14px; background: #111; box-shadow: 0 18px 40px rgba(0,0,0,.45); color: #F6F5F1; font-size: 11px !important; text-align: right; opacity: 0; visibility: hidden; transform: translateY(-6px); transition: opacity .25s ease, transform .25s ease, visibility 0s linear .25s; }
  .ld-menu-ouvert ${nav} { opacity: 1; visibility: visible; transform: none; transition: opacity .25s ease, transform .25s ease; }
}
@media (max-width: 1040px) and (prefers-reduced-motion: reduce) { .ld-burger i, ${nav} { transition: none !important; } }
`;
const VFK_MOUV = "@media (prefers-reduced-motion: reduce) { .vfk-ecrit, .vfk-svg .c, .vfk-svg .t, .vfk-svg .l, .vfk-svg .pc, .vfk-g, .vfk-note { transition: none !important; } }\n";
const VFK_REFAIRE = "    const refaire = () => { C.forEach((k) => { k.vu = null; }); mesurer(); C.forEach(peindre); maj(); lancer(); };\n";
const ENDUIT = "_ds/loan-drouard-design-system-06a79c98-aed9-4ca8-8b81-69bb72fcc98a/assets/textures/enduit-noir.jpg";
const MINI = ".vfk-c:not([data-grand])";
const CARTES_CSS = `/* Corrections du 08 et du 15/10 (scripts/construire.mjs) : sur mobile, cartes compactes empilées comme celles de la vitrine
   « See pricing » (nom, prix, Pay) ; un toucher ailleurs que sur Pay ouvre la carte en grand. */
@media (max-width: 999px) {
  .vfk-rang { gap: 12px; }
  .vfk-c[data-k="0"] { grid-row: 1; } .vfk-c[data-k="1"] { grid-row: 2; } .vfk-c[data-k="2"] { grid-row: 3; }
  ${MINI} .vf-carte { padding: 18px 20px; }
  ${MINI} .vf-carte__tete { min-height: 0; flex-direction: row; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 6px 14px; }
  ${MINI} .vf-nom { font-size: 24px; } ${MINI} .vf-prix { font-size: 15px; }
  ${MINI} :is(.vf-liste, .vf-tier, .vf-places, .vfk-delai) { display: none; }
  ${MINI} .vf-deverrou { gap: 10px; animation: none; }
  ${MINI} .vf-deverrou > :not(.vf-verrou):not(.vf-nom) { display: none; }
  ${MINI} .vf-deverrou .vf-nom { font-size: 24px; }
  /* Invitation à ouvrir : un « + » cerclé à droite, sur la ligne du bouton Pay (ou sous le titre d'une carte payée). */
  ${MINI} :is(.vf-carte__tete, .vf-deverrou)::after { content: ''; flex: none; align-self: center; margin-left: auto; width: 30px; height: 30px; box-sizing: border-box; border-radius: 50%; border: 1px solid rgba(246,245,241,.42); background: linear-gradient(rgba(246,245,241,.85), rgba(246,245,241,.85)) 50% 50% / 11px 1px no-repeat, linear-gradient(rgba(246,245,241,.85), rgba(246,245,241,.85)) 50% 50% / 1px 11px no-repeat; }
  ${MINI} .vf-deverrou::after { align-self: flex-end; margin-top: -40px; }
  /* Carte ouverte : elle quitte sa place (les autres ne bougent pas : rangées figées) et couvre l'écran, sur le papier sombre de la planche. */
  .vf > .vfk[data-grand] { z-index: 45; }
  .vfk-cam { will-change: auto; } /* sur mobile, la planche ne bouge pas : pas de calque (et la carte ouverte reste fixée à l'écran) */
  .vfk-c[data-grand] { position: fixed; inset: 0; z-index: 2; display: flex; flex-direction: column; align-items: center; overflow-y: auto; overscroll-behavior: contain; padding: calc(env(safe-area-inset-top, 0px) + 72px) 16px calc(env(safe-area-inset-bottom, 0px) + 36px); perspective: none; container-type: normal; } /* 18/10 : plus de conteneur de taille (container-type de l'export), sinon Safari 16 à 18.3 et Chrome 105 à 128 y accrochent Close et le fond sombre, qui défileraient avec le texte de la carte */
  .vfk-c[data-grand]::before { content: ''; position: fixed; inset: 0; z-index: -1; background: linear-gradient(rgba(8,8,8,.4), rgba(8,8,8,.4)), #101010 url("${ENDUIT}") 50% 50% / 620px; opacity: 0; transition: opacity .45s ease; }
  .vfk-c[data-grand]::after { content: ''; flex: none; margin-top: auto; }
  .vfk-c[data-grand="on"]::before { opacity: 1; }
  .vfk-c[data-grand="ferme"] { opacity: 0; transition: opacity .25s ease; } /* fermeture : tout s'efface d'un fondu, la petite carte réapparaît à sa place */
  .vfk-c[data-grand] > .vfk-ombre, .vfk-c[data-grand] .vfk-dos { display: none; }
  .vfk-c[data-grand] > .vfk-flip { flex: none; width: min(460px, 100%); margin-top: auto; transform: none !important; will-change: auto; }
  .vfk-c[data-grand] .vf-carte { transform: none !important; } /* vue de lecture à plat : pas d'inclinaison au toucher */
  .vfk-c[data-grand] .vfk-delai { flex: none; margin: 18px 0 0; opacity: 0; transition: opacity .4s ease .25s; }
  .vfk-c[data-grand="on"] .vfk-delai { opacity: 1; }
  .vfk-fermer { position: fixed; z-index: 3; top: calc(env(safe-area-inset-top, 0px) + 16px); right: 16px; display: flex; align-items: center; gap: 10px; padding: 10px 14px 10px 16px; border: 1px solid rgba(246,245,241,.3); border-radius: 999px; background: rgba(16,16,16,.6); color: #F6F5F1; font: 500 10.5px/1 'Cinzel', Georgia, serif; letter-spacing: .14em; text-transform: uppercase; cursor: pointer; opacity: 0; transition: opacity .3s ease .2s; -webkit-tap-highlight-color: transparent; }
  .vfk-fermer i { position: relative; width: 10px; height: 10px; }
  .vfk-fermer i::before, .vfk-fermer i::after { content: ''; position: absolute; left: -2px; right: -2px; top: 50%; height: 1px; background: currentColor; transform: rotate(45deg); }
  .vfk-fermer i::after { transform: rotate(-45deg); }
  .vfk-fermer:focus-visible { outline: 1px solid #A9814A; outline-offset: 3px; }
  .vfk-c[data-grand="on"] .vfk-fermer { opacity: 1; }
}
html.vfk-ouverte { overflow: hidden; }
html.vfk-ouverte.vfk-barre { scrollbar-gutter: stable; } /* 18/10 : la place de la barre de défilement classique (ordinateur, fenêtre étroite ; vfk-barre seulement si elle prend de la place) est gardée : la page derrière ne bouge pas et les traits ne sont pas redessinés à la fermeture */
/* 17/10 (mobile) : tant que les cartes n'ont pas été vues, la page se termine provisoirement juste sous elles (classe vfk-borne et
   --vfk-sous, posées par le script ; coupe relative à la section des cartes, pour suivre la mise en page, rotation comprise) : un lancer, même très fort ou enchaîné, s'y arrête comme en bas de page, avec le freinage et le
   rebond du navigateur ; la suite (bas de page) réapparaît dessous à la fin du retournement + 0,5 s. Ni aimantation ni script pendant le
   défilement : un script qui ramenait la page se battait contre l'élan de Safari (secousses), l'aimantation sautait si l'on touchait l'écran. */
@supports (overflow-y: clip) { /* navigateurs qui ne savent pas couper (Safari < 16) : pas d'arrêt plutôt qu'un bas de page qui déborderait */
  html.vfk-borne .vf { overflow-y: clip; }
  html.vfk-borne .vf > footer { height: 0; }
  html.vfk-borne .vf > .vfk { margin-bottom: calc(-1 * var(--vfk-sous, 0px)); }
}
/* 18/10 (retour de Loan : « une courbe smooth », ralentir avant les cartes quand on va vite) : iPhone / iPad seulement (vfk-frein). Dans
   les 2 écrans qui précèdent l'arrêt, un point d'aimantation existe en haut de page (le cran du projecteur, prévu par le design,
   ≈ 1 300 px, jamais visé d'ici ; pas l'en-tête, collant, que Chrome suivrait) : Safari donne alors
   à chaque lancer sa glissade courte (freinage ≈ 5 fois plus rapide, choisi au début du geste, rien à chaque image). Aucun point visé :
   sur iPhone, un toucher pendant une glissade aimantée fait sauter la page. Chrome n'a pas de glissade courte, et sa glissade aimantée
   commence par un bond d'une image (mesuré : 163 px au lieu de ≈ 50) : sur Android, l'arrêt reste celui du bas de page. */
html.vfk-frein { scroll-snap-type: y proximity; }
`;
const CARTES_JS = `    /* Correction du 08/10 (scripts/construire.mjs) : sur mobile, un toucher ouvre la petite carte en grand, par-dessus la page ;
       Close, Échap ou un toucher hors de la carte la referme. La carte glisse et grandit depuis sa place (translate / scale). */
    const petit = window.matchMedia("(max-width: 999px)"), racine = document.documentElement;
    let grand = null, rGrand = null, tGrand = 0, remesurer = false, finAttente = null, clavier = false;
    const fermerBtn = document.createElement("button");
    fermerBtn.type = "button"; fermerBtn.className = "vfk-fermer"; fermerBtn.innerHTML = "<span>Close</span><i aria-hidden=\\"true\\"></i>";
    const poser = (a, de, vers) => { const s = de.width / Math.max(1, vers.width); a.style.transformOrigin = "50% 0";
      a.style.translate = (de.left + de.width / 2 - vers.left - vers.width / 2).toFixed(1) + "px " + (de.top - vers.top).toFixed(1) + "px"; a.style.scale = s.toFixed(4); };
    const nettoyer = (a) => { a.style.transition = a.style.translate = a.style.scale = a.style.transformOrigin = ""; };
    const ouvrirCarte = (k, auto) => {
      if (grand || !petit.matches || !k.vu) return;
      if (finAttente) { clearTimeout(tGrand); const f = finAttente; finAttente = null; f(); } /* une carte qui se refermait est rangée d'abord */
      const a = k.front; clearTimeout(tGrand); k.c.style.transition = k.c.style.opacity = ""; rGrand = a.getBoundingClientRect(); grand = k;
      const rang = k.c.parentNode; rang.style.gridTemplateRows = C.map((x) => x.c.getBoundingClientRect().height + "px").join(" "); const barre = window.innerWidth > racine.clientWidth; /* rangées figées à leur hauteur exacte : les autres cartes ne remontent pas (getComputedStyle arrondit, et le dessin était refait pour rien à la fermeture) */
      sec.setAttribute("data-grand", ""); k.c.setAttribute("data-grand", ""); racine.classList.toggle("vfk-barre", barre); racine.classList.add("vfk-ouverte"); k.c.appendChild(fermerBtn); k.c.scrollTop = 0;
      if (!auto) fermerBtn.focus({ preventScroll: true });
      if (calme) { k.c.setAttribute("data-grand", "on"); return; }
      a.style.transition = "none"; poser(a, rGrand, a.getBoundingClientRect()); a.getBoundingClientRect();
      requestAnimationFrame(() => { if (grand !== k) return; k.c.setAttribute("data-grand", "on");
        a.style.transition = "translate .5s cubic-bezier(.2,.7,.2,1), scale .5s cubic-bezier(.2,.7,.2,1)"; a.style.translate = "0px 0px"; a.style.scale = "1"; });
      tGrand = setTimeout(() => { if (grand === k) nettoyer(a); }, 560);
    };
    /* Fermeture (15/10, retour de Loan : « quand je les ferme, c'est saccadé ») : la grande carte ne glisse plus vers la place de la
       petite (elle passait par-dessus les autres cartes puis changeait d'un coup) ; tout s'efface d'un fondu, en rétrécissant à peine,
       puis la petite carte réapparaît à sa place d'un fondu. Opacité et échelle seulement : rien à redessiner pendant l'animation. */
    const fermerCarte = (immediat) => {
      const k = grand; if (!k) return; grand = null; clearTimeout(tGrand);
      const a = k.front, fin = (fondu) => { nettoyer(a); k.c.removeAttribute("data-grand"); if (clavier) { clavier = false; k.front.focus({ preventScroll: true }); } fermerBtn.remove();
        if (!grand) { k.c.parentNode.style.gridTemplateRows = ""; sec.removeAttribute("data-grand"); racine.classList.remove("vfk-ouverte", "vfk-barre"); if (remesurer || derive()) { remesurer = false; refaire(); cle = cleDims(); } }
        if (fondu === true) { const c = k.c; c.style.transition = "none"; c.style.opacity = "0"; c.getBoundingClientRect(); c.style.transition = "opacity .24s ease"; c.style.opacity = "1";
          setTimeout(() => { if (!c.hasAttribute("data-grand")) c.style.transition = c.style.opacity = ""; }, 280); } };
      if (immediat === true || calme) { fin(); return; }
      k.c.setAttribute("data-grand", "ferme");
      a.style.transition = "scale .25s ease"; a.style.transformOrigin = "50% 40%"; a.style.scale = "0.96";
      finAttente = fin; tGrand = setTimeout(() => { finAttente = null; fin(true); }, 260);
    };
    const onClicGrand = (e) => {
      if (grand) { if (e.target === grand.c || e.target.closest(".vfk-fermer")) { e.preventDefault(); if (e.detail === 0) clavier = true; fermerCarte(); } return; }
      if (!petit.matches) return;
      const c = e.target.closest(".vfk-c"), k = c && C.find((x) => x.c === c);
      if (k && k.vu && e.target.closest(".vf-carte") && !e.target.closest(".vf-payer, a[href], button")) ouvrirCarte(k);
    };
    const onToucheGrand = (e) => {
      /* Carte ouverte : Échap la referme ; Tab reste dans la carte (carte, liens et boutons, Close), la page cachée ne défile pas. */
      if (grand) { if (document.querySelector(".vf-modale")) return;
        if (e.key === "Escape") { clavier = true; fermerCarte(); }
        else if (e.key === "Tab") { const f = [grand.front, ...grand.front.querySelectorAll("a[href], button"), fermerBtn].filter((x) => x.getClientRects().length), i = f.indexOf(document.activeElement);
          if (i < 0 || (e.shiftKey ? i === 0 : i === f.length - 1)) { e.preventDefault(); f[e.shiftKey ? f.length - 1 : 0].focus({ preventScroll: true }); } }
        return; }
      if (petit.matches && (e.key === "Enter" || e.key === " ") && e.target && e.target.matches && e.target.matches(".vfk-c[data-vu] .vf-carte")) {
        const k = C.find((x) => x.front === e.target); if (k) { e.preventDefault(); clavier = true; ouvrirCarte(k); } }
    };
    const onPetit = () => { if (!petit.matches) { fermerCarte(true); libre(); } };
    /* Correction du 15/10 (retour de Loan : « quand je les ferme, les lignes sont décalées par rapport aux cartes ») : le dessin au
       crayon n'était refait que si la largeur, la hauteur d'écran ou celle d'une carte changeait. Si ce qui est au-dessus des cartes
       change de hauteur (en-tête, texte), les cartes bougeaient sans leurs traits. Sur mobile, leur place est revérifiée à la
       fermeture d'une carte et au défilement ; le dessin est refait si elles ont bougé. */
    const derive = () => { if (!G || G.rang || sec.hasAttribute("data-grand")) return false; const p0 = pin.getBoundingClientRect().top;
      return C.some((k, i) => G.R[i] && Math.abs(k.c.getBoundingClientRect().top - p0 - G.R[i].y) > 1.5); };
    let tRecal = 0;
    const recaler = () => { if (!tRecal) tRecal = setTimeout(() => { tRecal = 0; if (derive()) { refaire(); cle = cleDims(); } }, 120); };
    /* Corrections du 15 et du 17/10 (retour de Loan : en défilant vite, on arrivait en bas de la page sans passer par les cartes ; puis
       « le blocage n'est pas fluide, ça secoue en boucle ») : sur mobile, une fois par visite, la page se termine provisoirement juste sous
       les cartes (centrées sous l'en-tête ; si elles ne tiennent pas à l'écran, la dernière en entier en bas) jusqu'à la fin de leur
       retournement + 0,5 s. L'arrêt est celui du bas de page : freinage et rebond du navigateur, quel que soit l'élan, sans script pendant
       le défilement. On peut toujours remonter. Ensuite le bas de page réapparaît dessous, sans que rien ne bouge à l'écran. */
    const PAUSE = 500, ZONE = 2, vf = sec.closest(".vf");
    /* Ralentissement avant les cartes (18/10) : iPhone / iPad seulement (tous leurs navigateurs sont Safari ; Firefox en « site pour
       ordinateur » ne change que l'agent utilisateur, d'où navigator.platform). */
    const IOS = /iP(hone|ad|od)/.test(navigator.userAgent + " " + navigator.platform) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    /* Écran tactile en mise en page ordinateur (tablette en paysage) : même fin provisoire, au point de retournement de la planche ;
       le verrou d'ordinateur n'y ramène plus la page (sur iPad, il se battait contre l'élan comme sur iPhone). */
    const mqDoigt = window.matchMedia ? window.matchMedia("(any-pointer: coarse)") : null, doigtLarge = () => !!(mqDoigt && mqDoigt.matches);
    let tenue = false, finPage = 0, tLibre = 0, yF = 0, desc = true;
    const libre = () => { clearTimeout(tLibre); tLibre = 0; finPage = 0; racine.classList.remove("vfk-borne", "vfk-frein"); };
    /* Hauteur visible barre déployée (stable quand la barre de Safari se replie). */
    const hautVue = () => (typeof hautVisible === "function" && hautVisible(racine)) || window.innerHeight;
    /* Fin de page provisoire, relevée avec le dessin ; jamais au-dessus de l'écran (la page ne raccourcit pas sous le lecteur). */
    const poserBorne = () => {
      if (tenue || calme || !vf || !G || (G.rang ? deja || !doigtLarge() : !petit.matches) || window.__vfkPayee !== undefined || !(window.CSS && CSS.supports && CSS.supports("overflow-y", "clip"))) { if (!tenue && finPage) libre(); return; }
      const vh = hautVue(), hd = document.querySelector(".vf > .ld-header"), hh = hd ? hd.offsetHeight : 0, y = window.scrollY;
      let fin;
      if (G.rang) fin = y + sec.getBoundingClientRect().top + Math.ceil((0.16 / RT) * course.offsetHeight) + 2 + window.innerHeight; /* point de retournement (yVerrou) */
      else { const a = C[0].c.getBoundingClientRect(), b = C[C.length - 1].c.getBoundingClientRect();
        fin = y + Math.max(Math.min((a.top + b.bottom - hh - vh) / 2, a.top - hh - 14) + vh, b.bottom + 14); }
      if (y + window.innerHeight > fin - 1) return;
      finPage = Math.round(fin); racine.style.setProperty("--vfk-sous", Math.max(0, Math.round(sec.getBoundingClientRect().bottom + y - fin)) + "px"); racine.classList.add("vfk-borne");
    };
    /* À chaque défilement (début de maj) : arrivé en bas provisoire avant le départ de la dernière carte (petit écran), la cascade part ;
       dès que la dernière carte est partie, la fin provisoire est retirée à la fin de son retournement + 0,5 s. */
    const tenir = () => {
      /* Freinage seulement en descendant (en remontant, la glissade reste normale). */
      if (IOS && finPage) { const y = window.scrollY, arret = racine.scrollHeight - window.innerHeight; if (y !== yF) { desc = y > yF; yF = y; }
        racine.classList.toggle("vfk-frein", desc && y > arret - ZONE * window.innerHeight && y < arret - 2); }
      if (tenue || !finPage) return;
      if (window.__vfkPayee !== undefined || calme || (G.rang ? !doigtLarge() : !petit.matches)) { tenue = true; libre(); return; }
      const d = C[C.length - 1], now = performance.now();
      if (G.rang) { /* planche d'ordinateur : arrivé au point de retournement, la donne part (maj) ; fin provisoire retirée à sa fin + 0,5 s */
        if (deja || window.scrollY + window.innerHeight >= racine.scrollHeight - 2) {
          tenue = true; tLibre = setTimeout(libre, (deja && finVerrou ? Math.max(0, finVerrou - now) : ((3.8 + (C.length - 1) * LAG) / VIT) * 1000 + 150) + PAUSE); }
        return; }
      if (!d.t0 && window.scrollY + window.innerHeight >= racine.scrollHeight - 2) {
        C.forEach((k, i) => { if (!k.t0) k.t0 = Math.max(now, i && C[i - 1].t0 ? C[i - 1].t0 + LAG / VIT * 1000 : 0); });
        lancer();
      }
      if (!d.t0) return;
      tenue = true; tLibre = setTimeout(libre, Math.max(0, d.t0 + 3.8 / VIT * 1000 + PAUSE - now));
    };
    /* Clavier : un élément caché sous la fin provisoire (liens du bas de page) qui prend le focus libère la page. */
    const onFocBorne = (e) => { const t = e.target; if (finPage && t && t.getBoundingClientRect && t.getBoundingClientRect().top + window.scrollY > finPage) { tenue = true; libre(); t.scrollIntoView({ block: "nearest" }); } }; /* le navigateur a voulu montrer l'élément pendant que la page était encore coupée : on le montre une fois la page rendue */
    document.addEventListener("focusin", onFocBorne);
    sec.addEventListener("click", onClicGrand);
    window.addEventListener("keydown", onToucheGrand, true);
    if (petit.addEventListener) petit.addEventListener("change", onPetit);
    const offGrand = () => { fermerCarte(true); libre(); document.removeEventListener("focusin", onFocBorne); clearTimeout(tRecal); sec.removeEventListener("click", onClicGrand); window.removeEventListener("keydown", onToucheGrand, true); if (petit.removeEventListener) petit.removeEventListener("change", onPetit); };
`;
// --- Retour de Loan du 27/10 -------------------------------------------------------------------------------------
// Textes ajoutés : français dans scripts/traduction-fr.mjs. Tailles « à la mesure de l'écran » : clamp(minimum, part de la
// largeur, maximum), pour que les textes grandissent avec les très grands écrans au lieu d'y paraître minuscules.
const SOMMAIRE_STYLE_FIN = "@media (prefers-reduced-motion: reduce) { .vf-sommaire a, .vf-sommaire a::before { transition: none; } }\n";
// Home, The Journey et Press / Contact : pages en construction. Un petit ruban doré en biais sur le mot (« Coming soon »,
// « Bientôt » si la page est en français : attribut lang de <html>), posé sur le haut du mot, qui reste lisible et grisé dessous.
const BIENTOT_CSS = (nav) => `/* Correction du 27/10 (scripts/construire.mjs) : pages en construction, ruban « Coming soon » / « Bientôt » sur le mot. */
${nav} > span[aria-disabled="true"] { position: relative; display: inline-block; white-space: nowrap; }
@supports (color: color-mix(in srgb, red 50%, transparent)) { ${nav} > span[aria-disabled="true"] { opacity: 1 !important; color: color-mix(in srgb, currentColor 28%, transparent) !important; } }
${nav} > span[aria-disabled="true"]::after { content: "Coming soon"; position: absolute; left: 50%; top: 0; z-index: 1; padding: .36em .75em .3em; transform: translate(-50%, -78%) rotate(-6deg); background: linear-gradient(100deg, #93703C, #CFAE72 40%, #E9D5A8 52%, #B48D52 70%, #93703C); color: #16130E; font-family: 'Cinzel', Georgia, serif; font-weight: 600; font-size: max(8.5px, .6em); line-height: 1; letter-spacing: .12em; text-transform: uppercase; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,.35); pointer-events: none; }
html[lang="fr"] ${nav} > span[aria-disabled="true"]::after { content: "Bientôt"; }
/* Menu mobile : liens un peu plus espacés, ruban plus petit, au-dessus du mot et calé à droite comme lui. */
@media (max-width: 1040px) { ${nav} { gap: 26px !important; } ${nav} > span[aria-disabled="true"]::after { left: auto; right: -.2em; font-size: 7.5px; transform: translateY(-92%) rotate(-5deg); } }
`;
// En-tête et sommaire plus lisibles sur ordinateur (au-delà de 1 040 px ; en dessous, menu mobile inchangé).
const ENTETE_GRAND_CSS = (entete, nav) => `/* Correction du 27/10 (scripts/construire.mjs) : sur ordinateur, en-tête plus lisible, à la mesure de l'écran. */
@media (min-width: 1041px) {
  ${entete} > div:first-child > span { font-size: clamp(21px, .4vw + 16px, 26px) !important; }
  ${nav} { font-size: clamp(13.5px, .3vw + 10px, 17px) !important; gap: clamp(28px, 2.2vw, 46px) !important; }
  ${entete} .ld-langues { font-size: clamp(14px, .25vw + 10.5px, 17px); }
}
`;
const VF_CSS_27 = BIENTOT_CSS(".vf-entete > nav:not(.vf-sommaire)") + ENTETE_GRAND_CSS(".vf-entete", ".vf-entete > nav:not(.vf-sommaire)") +
  `@media (min-width: 1041px) {
  .vf-sommaire { font-size: clamp(12.5px, .25vw + 9px, 15.5px); }
  .vf-sommaire:hover a, .vf-sommaire[data-ouvert] a, .vf-sommaire a[data-actif="oui"] { max-height: 2.4em; }
  .vf-sommaire:has(a:focus-visible) a { max-height: 2.4em; }
}
/* « The plan » et « The result » plus visibles face à « On paper. » et « On the carpet. ». */
.vfa-mot-l { font-size: clamp(15px, 1.2vw + 4px, 26px); }
.vfa-yin .vfa-mot-l { color: rgba(246,245,241,.8); } .vfa-yang .vfa-mot-l { color: rgba(246,245,241,.88); }
/* Netteté sur grand écran (caméra de l'étude, voir le script) : grain du crayon et lueur des corrections en or suivent la taille
   de pose de la feuille (--b), pour rester identiques à l'écran. */
.vfa-svg--trait { -webkit-mask-size: calc(192px * var(--b, 1)) calc(192px * var(--b, 1)); mask-size: calc(192px * var(--b, 1)) calc(192px * var(--b, 1)); }
.vfa-svg--or { filter: drop-shadow(0 0 calc(3px * var(--b, 1)) rgba(222,190,125,.85)) drop-shadow(0 0 calc(14px * var(--b, 1)) rgba(169,129,74,.55)); }
/* « See full details » sous chaque carte de la vitrine (sur mobile, en haut à droite de la carte compacte, sur deux lignes). */
.vfp-details { position: absolute; z-index: 3; left: 50%; top: calc(100% + 16px); transform: translateX(-50%); display: inline-flex; align-items: center; gap: 9px; padding: 7px 2px 6px; border: 0; border-bottom: 1px solid rgba(246,245,241,.32); background: none; color: rgba(246,245,241,.74); font-family: 'Cinzel', Georgia, serif; font-weight: 500; font-size: clamp(11px, .2vw + 8.5px, 13.5px); letter-spacing: .16em; text-transform: uppercase; white-space: nowrap; cursor: pointer; transition: color .3s ease, border-color .3s ease; -webkit-tap-highlight-color: transparent; }
.vfp-details::after { content: ""; width: .45em; height: .45em; margin-top: -.3em; border: solid currentColor; border-width: 0 1px 1px 0; transform: rotate(45deg); }
.vfp-details:hover, .vfp-details:focus-visible { color: #F6F5F1; border-bottom-color: #A9814A; outline: none; }
/* « See the options » / « Voir les options » : tient dans l'écran jusqu'à 320 px (inchangé à partir de 390 px). */
@media (max-width: 899px) { .vfp-affiche { padding-left: min(40px, 9.8vw); padding-right: min(40px, 9.8vw); } .vfp-affiche-mot { font-size: min(26px, 7vw); } }
@media (max-width: 899px) { .vfp-details { display: block; left: auto; right: 22px; top: 20px; transform: none; max-width: 11.8em; padding: 4px 0 5px; line-height: 1.55; white-space: normal; text-wrap: balance; text-align: right; }
  .vfp-details::after { display: inline-block; margin: 0 0 0 .55em; vertical-align: .3em; }
  .vfp-c .vf-prix { flex-basis: 100%; } /* le prix toujours sous le nom : le lien occupe la droite du nom */ }
`;
// Boutons des cartes : un texte par formule à la place de « Pay 49 € » (BOUTONS, scripts/traduction-fr.mjs).
const BOUTON_FORMULE = BOUTONS.map(([prix, en]) => [`Pay ${prix}&nbsp;€`, en]);
const DETAILS = '<button type="button" class="vfp-details" onClick="{{ voirDetails }}">See full details</button>';
// Nouveaux prix et offre de lancement (demande de Loan du 29/10). Prix normaux : 99, 249 et 990 €. Dès la mise en ligne du 29/10
// (Loan), les prix d'avant deviennent l'offre de lancement : prix normal barré, réduction en %. Sans date de fin, et aucune date
// affichée (Loan : offre valable « le temps que le site est en construction ») ; pour la terminer, mettre la date dans fin (ici et
// dans cloudflare/api-worker.js), renseigner LIENS_PRIX_NORMAUX, puis republier : la page affichera alors les prix normaux seuls.
// Avant debut, l'affichage d'origine. La page bascule d'elle-même (horloge du visiteur) ; le prix payé est fixé par le Worker API,
// aux mêmes dates. Les prix de l'offre sont ceux de toutes les promos de Loan (CLAUDE.md, « Promotions »). Réduction arrondie à l'inférieur, pour ne jamais annoncer plus que la vraie : −50 %, −48 %, −49 %.
const OFFRE = { debut: "2026-10-29T00:00:00+01:00", fin: null }; // fin : null = pas de fin
const TARIFS = { single: [49, 99], pack: [129, 249], prog: [499, 990] }; // [offre de lancement, prix normal], en euros
// Liens de paiement de secours aux prix normaux (utilisés après la fin de l'offre) : à créer chez Stripe, puis à renseigner ici.
const LIENS_PRIX_NORMAUX = {};
if (OFFRE.fin && Object.keys(LIENS_PRIX_NORMAUX).length < 3) console.warn("Attention : liens de paiement de secours aux prix normaux (LIENS_PRIX_NORMAUX) pas encore renseignés : après la fin de l'offre, le secours ouvrirait les liens aux anciens prix.");
const OFFRE_JS = `/* Correction du 29/10 (scripts/construire.mjs) : nouveaux prix et offre de lancement, dès le 29 octobre 2026. */
const OFFRE = { debut: Date.parse("${OFFRE.debut}"), fin: ${OFFRE.fin ? `Date.parse("${OFFRE.fin}")` : "Infinity"} };
const TARIFS = ${JSON.stringify(TARIFS)}; /* [offre de lancement, prix normal] */
const PHASE = Date.now() < OFFRE.debut ? "avant" : Date.now() < OFFRE.fin ? "offre" : "apres";
const EUROS = (n) => n + "\\u00A0\\u20AC";
const REMISE = (k) => "\\u2212" + Math.floor((1 - TARIFS[k][0] / TARIFS[k][1]) * 100) + (document.documentElement.lang === "fr" ? "\\u00A0%" : "%");
for (const k in TARIFS) FORMULES[k].prix = EUROS(TARIFS[k][PHASE === "apres" ? 1 : 0]);
`;
const OFFRE_LIENS_JS = `/* Correction du 29/10 : après l'offre, liens de secours aux prix normaux. */
if (PHASE === "apres") Object.assign(STRIPE, ${JSON.stringify(LIENS_PRIX_NORMAUX)});
`;
const OFFRE_VALS = "      offre: PHASE === \"offre\", horsOffre: PHASE !== \"offre\", prixMin: FORMULES.single.prix, /* Correction du 29/10 : offre de lancement. */\n" +
  "      prixSingle: FORMULES.single.prix, prixPack: FORMULES.pack.prix, prixProg: FORMULES.prog.prix,\n" +
  "      normalSingle: EUROS(TARIFS.single[1]), normalPack: EUROS(TARIFS.pack[1]), normalProg: EUROS(TARIFS.prog[1]),\n" +
  "      remiseSingle: REMISE(\"single\"), remisePack: REMISE(\"pack\"), remiseProg: REMISE(\"prog\"),\n";
const SI_OFFRE = (html) => `<sc-if value="{{ offre }}" hint-placeholder-val="{{ false }}">${html}</sc-if>`;
// Au-dessus du nom : « Launch offer » ; au-dessus du prix : prix normal barré et réduction (aucune date affichée).
const OFFRE_TITRE = SI_OFFRE('<div class="vf-offre">Launch offer</div>') + "\n";
const OFFRE_PRIX = (k) => SI_OFFRE(`<span class="vf-remise"><s>{{ normal${k} }}</s><b>{{ remise${k} }}</b></span>`);
const OFFRE_CSS = `/* Correction du 29/10 (scripts/construire.mjs) : offre de lancement (dès le 29 octobre 2026). Filet et lettres d'or, prix
   normal en ivoire éteint barré d'un trait d'or, réduction dans un fin cadre d'or. */
.vf-offre { display: flex; align-items: center; gap: 10px; margin-bottom: -6px; font-family: 'Cinzel', Georgia, serif; font-weight: 500; font-size: 10.5px; letter-spacing: .22em; text-transform: uppercase; color: #C6A05E; }
.vf-offre::before { content: ''; flex: none; width: 22px; height: 1px; background: linear-gradient(90deg, rgba(198,160,94,0), #C6A05E); }
.vf-remise { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 12px; margin-bottom: 9px; font-size: 18px; line-height: 1.3; letter-spacing: .04em; }
.vf-remise s { position: relative; text-decoration: none; color: rgba(246,245,241,.55); }
.vf-remise s::after { content: ''; position: absolute; left: -3px; right: -3px; top: 47%; height: 1px; background: rgba(198,160,94,.95); } /* trait dessiné : celui de la police tombait sous les chiffres de Cinzel */
.vf-remise b { font-weight: 500; font-size: 12px; line-height: 1; letter-spacing: .1em; color: #C6A05E; padding: 4px 7px 3px; border: 1px solid rgba(198,160,94,.45); border-radius: 2px; }
/* Cartes en colonne (ordinateur, carte ouverte sur mobile) : l'en-tête grandit d'autant que les deux lignes ajoutées (17 + 16 − 6 et 23 + 9 px, mesuré), la liste garde sa place sous le bouton. */
.vf-carte__tete:has(> .vf-offre) { min-height: calc(216px + 59px); }
/* Vitrine sur mobile : la hauteur des cartes est comptée (réduction à 0,78 au plus, puis débordement sur les petits écrans). Pendant
   l'offre, une seule ligne : prix normal barré, prix de lancement, réduction (« Launch offer » est sous See the options ; le détail de
   la formule, sur les cartes de la planche II). Navigateurs sans :has (iOS < 15.4) : prix barré sur sa ligne, au-dessus. */
@media (max-width: 899px) { .vfp-c .vf-carte__tete:has(> .vf-offre) { min-height: 0; } .vfp-c .vf-offre { display: none; }
  .vfp-c .vf-remise { margin-bottom: 4px; font-size: 13px; }
  .vfp-c .vf-prix:has(> .vf-remise) { display: flex; align-items: center; gap: 10px; } .vfp-c .vf-prix:has(> .vf-remise) .vf-remise { display: contents; }
  .vfp-c .vf-prix:has(> .vf-remise) .vf-remise b { order: 1; } .vfp-c .vf-prix:has(> .vf-remise) .vf-prix-d { display: none; } }
@media (max-width: 999px) { .vfk-c:not([data-grand]) .vf-offre { flex-basis: 100%; margin-bottom: -2px; } .vfk-c:not([data-grand]) .vf-remise { margin-bottom: 4px; font-size: 15px; } }
`;
// Descente animée jusqu'aux cartes de la planche II (bouton « See full details »).
const DESCENTE_JS = `  /* Correction du 27/10 (scripts/construire.mjs) : « See full details », sous les cartes de la vitrine, descend jusqu'aux cartes
     de la planche II à vitesse régulière (ECRANS_S hauteurs d'écran par seconde, élan au départ, freinage à l'arrivée) : le
     projecteur, l'étude et le yin-yang s'animent au passage, sans effet d'accélération. Un geste du visiteur (molette, doigt,
     clic, touche) arrête la descente là où elle est ; il peut ensuite remonter ou descendre librement.
     28/10 (« clairement trop long ») : 7 écrans par seconde au lieu de 2,4, élan et freinage plus courts : ≈ 4 s au lieu de 10. */
  descendreFormules() {
    const el = document.getElementById("formules");
    if (!el) return;
    if (this._finDescente) this._finDescente();
    const ECRANS_S = 7, ELAN = 0.7, FREIN = 1.2;
    const y0 = window.scrollY, vh = window.innerHeight, max = document.documentElement.scrollHeight - vh;
    let y1;
    if (window.matchMedia("(max-width: 999px)").matches) {
      /* Mobile : cartes centrées sous l'en-tête (la première en haut si elles ne tiennent pas), comme l'arrêt sur les cartes. */
      const c = el.querySelectorAll(".vfk-c"), hd = document.querySelector(".vf > .ld-header"), hh = hd ? hd.offsetHeight : 0;
      if (!c.length) return;
      const a = c[0].getBoundingClientRect(), b = c[c.length - 1].getBoundingClientRect();
      y1 = y0 + Math.min((a.top + b.bottom - hh - vh) / 2, a.top - hh - 14);
    } else {
      /* Ordinateur : au déclenchement du retournement des cartes, comme le lien « Pricing » du sommaire. */
      y1 = el.getBoundingClientRect().top + y0;
      const co = el.querySelector(".vfk-course");
      if (co && co.offsetHeight > 0) y1 += Math.ceil((0.16 / RT) * co.offsetHeight) + 2;
    }
    y1 = Math.round(Math.max(0, Math.min(y1, max)));
    const d = y1 - y0;
    if (Math.abs(d) < 2) return;
    if (d < 0 || calmeMQ()) { window.scrollTo({ top: y1, behavior: d < 0 && !calmeMQ() ? "smooth" : "instant" }); return; }
    /* Vitesse en croisière v (px/s), atteinte et quittée en douceur (demi-cosinus) ; trajet court : pas de croisière. */
    let v = ECRANS_S * vh, ta = ELAN, tf = FREIN, tc = d / v - (ta + tf) / 2;
    if (tc < 0) { tc = 0; v = 2 * d / (ta + tf); }
    const T = ta + tc + tf, PI = Math.PI;
    const pos = (t) => t < ta ? v * (t / 2 - ta / (2 * PI) * Math.sin(PI * t / ta))
      : t < ta + tc ? v * (ta / 2 + t - ta)
      : v * (ta / 2 + tc + (t - ta - tc) / 2 + tf / (2 * PI) * Math.sin(PI * (t - ta - tc) / tf));
    const GESTES = ["wheel", "touchstart", "pointerdown", "keydown"];
    let raf = 0;
    const fin = () => { cancelAnimationFrame(raf); GESTES.forEach((g) => window.removeEventListener(g, fin, true)); if (this._finDescente === fin) this._finDescente = null; };
    GESTES.forEach((g) => window.addEventListener(g, fin, { capture: true, passive: true }));
    this._finDescente = fin;
    const t0 = performance.now();
    const pas = (now) => { const t = Math.max(0, (now - t0) / 1000);
      window.scrollTo({ top: t >= T ? y1 : Math.round(y0 + pos(t)), behavior: "instant" });
      if (t < T) raf = requestAnimationFrame(pas); else fin(); };
    raf = requestAnimationFrame(pas);
  }

`;
// Netteté de l'étude sur grand écran (retour de Loan du 27/10, photos d'un très grand écran : textes « pixelisés »).
const ETUDE_NETTE_DECL = `    /* Correction du 27/10 (scripts/construire.mjs) : sur un très grand écran, la caméra agrandit la feuille (1200 × 800) jusqu'à
       4,4 fois (2560 px de large). Safari peint un calque à sa taille propre puis l'agrandit : textes et traits de l'étude
       devenaient flous et crénelés. À l'arrêt, la feuille est donc posée à sa taille d'affichage (B = zoom de la caméra) et la
       caméra ne l'agrandit plus : tout est redessiné net, quel que soit le navigateur. En mouvement, rien ne change (B reste celui
       du dernier arrêt) ; si la caméra recule bien en dessous de B, la feuille reprend sa taille d'origine (mémoire graphique).
       Zoom de 1,15 ou moins (téléphones) : B = 1, comme avant. */
    let B = 1, tB = 0, camS = 1, camX = 0, camY = 0;
    const poserB = (b) => { B = b; const w = (SW * b).toFixed(2) + "px", h = (SH * b).toFixed(2) + "px";
      [cam, cam2].forEach((c) => { c.style.width = w; c.style.height = h; c.style.setProperty("--b", b.toFixed(4)); }); };
    const nette = () => { const b = camS > 1.15 ? Math.min(camS, 5) : 1; if (Math.abs(b / B - 1) < 0.01) return; poserB(b);
      cam.style.transform = cam2.style.transform = "translate3d(" + camX.toFixed(2) + "px," + camY.toFixed(2) + "px,0) scale(" + (camS / B).toFixed(4) + ")"; };
`;
const ETUDE_TR_AVANT = '      const tr = "translate3d(" + tx.toFixed(2) + "px," + ty.toFixed(2) + "px,0) scale(" + s.toFixed(4) + ")", k = Math.pow(s, -0.65).toFixed(4);\n';
const ETUDE_TR_APRES = "      /* Correction du 27/10 : feuille posée à B fois sa taille, agrandie de s / B ; redessinée nette 0,2 s après le dernier mouvement. */\n" +
  "      if (B > 1 && s < B * 0.75) poserB(1);\n" +
  "      camS = s; camX = tx; camY = ty; clearTimeout(tB); tB = setTimeout(nette, 200);\n" +
  ETUDE_TR_AVANT.replace('scale(" + s.toFixed(4) + ")"', 'scale(" + (s / B).toFixed(4) + ")"');

// --- Retour de Loan du 28/10 -------------------------------------------------------------------------------------
// En haut de page (40 px au plus, comme l'arrivée « en cours de page » du projecteur), html n'a pas la classe vf-defile :
// sommaire déplié et liens de l'en-tête visibles. Dès qu'on descend, vf-defile : sommaire replié (section courante seule,
// dépliée au survol comme avant) et liens de l'en-tête effacés (Home, The Journey et Press sont « Coming soon »).
// Sans script (avant le premier calcul), la page est « en haut » : rien ne clignote à l'ouverture.
const HAUT_JS = '      document.documentElement.classList.toggle("vf-defile", window.scrollY > 40); /* Correction du 28/10 (scripts/construire.mjs) : en haut de page, sommaire déplié et liens de l\'en-tête visibles. */\n';
const VF_CSS_28 = `/* Corrections du 28/10 (scripts/construire.mjs). Sommaire déplié en haut de page (ordinateur ; caché sur mobile). */
html:not(.vf-defile) .vf-sommaire a { max-height: 2.4em; padding-block: 4.5px; opacity: .38; visibility: visible; transition: opacity .35s ease, max-height .35s ease, padding .35s ease; }
html:not(.vf-defile) .vf-sommaire a:is(:hover, :focus-visible) { opacity: .8; }
html:not(.vf-defile) .vf-sommaire a[data-actif="oui"] { opacity: .9; }
/* Liens de l'en-tête (ordinateur) : effacés dès qu'on descend, de retour tout en haut. Leur place reste : rien ne bouge. */
@media (min-width: 1041px) {
  .vf-entete > nav:not(.vf-sommaire) { transition: opacity .45s ease, visibility 0s; }
  html.vf-defile .vf-entete > nav:not(.vf-sommaire) { opacity: 0; visibility: hidden; transition: opacity .45s ease, visibility 0s linear .45s; }
}
@media (prefers-reduced-motion: reduce) { html:not(.vf-defile) .vf-sommaire a, .vf-entete > nav:not(.vf-sommaire) { transition: none !important; } }
/* Planche II (ordinateur) : une fois les cartes retournées, la planche reste posée et glisse comme un calque au-dessus de l'étude
   quand on remonte puis redescend ; son bord haut coupait net la photo. Un fondu la précède : même papier, même tuile (calée
   comme lui sur son bas), de transparent à plein sur --vfk-fondu. Caché tant que les cartes n'ont pas été jouées (data-posee) :
   la première fois, la planche apparaît déjà en fondu, sans bord. */
@media (min-width: 1000px) {
  .vf > .vfk { --vfk-fondu: clamp(140px, 24svh, 260px); }
  .vf > .vfk[data-posee]::before { content: ""; position: absolute; left: 0; right: 0; top: calc(-1 * var(--vfk-fondu)); bottom: var(--vfk-tenue); pointer-events: none; background: #101010 url("${ENDUIT}") 50% 100% / 620px;
    -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,.05) calc(var(--vfk-fondu) * .2), rgba(0,0,0,.2) calc(var(--vfk-fondu) * .4), rgba(0,0,0,.48) calc(var(--vfk-fondu) * .6), rgba(0,0,0,.8) calc(var(--vfk-fondu) * .8), #000 var(--vfk-fondu));
    mask-image: linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,.05) calc(var(--vfk-fondu) * .2), rgba(0,0,0,.2) calc(var(--vfk-fondu) * .4), rgba(0,0,0,.48) calc(var(--vfk-fondu) * .6), rgba(0,0,0,.8) calc(var(--vfk-fondu) * .8), #000 var(--vfk-fondu)); }
}
`;
const PAPIER_AVANT = "        papier.style.opacity = vP.toFixed(3);\n";
const PAPIER_APRES = PAPIER_AVANT + '        sec.toggleAttribute("data-posee", deja); /* Correction du 28/10 : fondu au-dessus de la planche posée. */\n';
// Sommaire à l'ouverture (ordinateur) : son premier calcul passe avant que le projecteur place les ancres II et III (toutes
// encore en haut de page) : « III For Who » restait marqué jusqu'au premier défilement, et repassait sur « Opening » au retrait
// de l'écran de chargement. Recalcul dès que ces ancres bougent (placement, redimensionnement).
const SOMMAIRE_INIT_AVANT = '    window.addEventListener("scroll", surS, { passive: true });\n    setTimeout(suivre, 0);\n' +
  '    this._offSom = () => { window.removeEventListener("scroll", surS); if (rafS) cancelAnimationFrame(rafS); };\n';
const SOMMAIRE_INIT_APRES = '    window.addEventListener("scroll", surS, { passive: true });\n    setTimeout(suivre, 0);\n' +
  "    /* Correction du 28/10 (scripts/construire.mjs) : les ancres II et III sont placées par le projecteur après ce premier calcul ; recalcul quand elles bougent. */\n" +
  '    const moS = window.MutationObserver ? new MutationObserver(surS) : null;\n' +
  '    if (moS) ["what-is-it", "for-who"].forEach((id) => { const el = document.getElementById(id); if (el) moS.observe(el, { attributes: true, attributeFilter: ["style"] }); });\n' +
  '    this._offSom = () => { window.removeEventListener("scroll", surS); if (rafS) cancelAnimationFrame(rafS); if (moS) moS.disconnect(); };\n';
// Titre de l'onglet (aucun dans l'export : le navigateur affichait l'adresse). Pages légales : dans la langue de la page
// (?lang=fr à l'ouverture, puis sélecteur EN / FR, qui change l'attribut lang de <html> sans recharger).
const TITRES = {
  "Video Feedback.dc.html": ["Video Feedback | LOAN DROUARD"],
  "CGV.dc.html": ["Terms of Sale | LOAN DROUARD", "Conditions générales de vente | LOAN DROUARD"],
  "Privacy.dc.html": ["Privacy Policy | LOAN DROUARD", "Politique de confidentialité | LOAN DROUARD"],
  "Legal.dc.html": ["Legal Notice | LOAN DROUARD", "Mentions légales | LOAN DROUARD"],
};
const VIEWPORT = '<meta name="viewport" content="width=device-width, initial-scale=1">\n';
const TITRE_HTML = ([en, fr]) => `${VIEWPORT}<title>${en}</title>\n` + (!fr ? "" :
  `<script>/* Correction du 28/10 (scripts/construire.mjs) : titre de l'onglet dans la langue de la page. */\n` +
  `(() => { const h = document.documentElement, T = { en: ${JSON.stringify(en)}, fr: ${JSON.stringify(fr)} };\n` +
  `  const maj = () => { const fr = h.lang ? h.lang === "fr" : /[?&]lang=fr(&|$)/.test(location.search), t = fr ? T.fr : T.en; if (document.title !== t) document.title = t; };\n` +
  `  maj(); if (window.MutationObserver) new MutationObserver(maj).observe(h, { attributes: true, attributeFilter: ["lang"] }); })();</script>\n`);
// Inclinaison des cartes au survol (vitrine et planche II) : 6,5 → 9 (± 4,5° aux bords au lieu de ± 3,25°).
const INCLINE_AVANT = 'rotateY(" + (px * 6.5).toFixed(2) + "deg) rotateX(" + (-py * 6.5).toFixed(2) + "deg)';
const INCLINE_APRES = 'rotateY(" + (px * 9).toFixed(2) + "deg) rotateX(" + (-py * 9).toFixed(2) + "deg)';
// Troisième retour de Loan du 28/10 : textes « trop petits, pas lisibles sur ordinateur » (projecteur : « Your » et « You film.
// You send… » ; haut de la planche II : plaque, surtitre et phrase sous le titre). Tailles à la mesure de l'écran, comme le
// 27/10 ; mobile inchangé. La descente « See full details » et « Voir les options » : DESCENTE_JS et scripts/traduction-fr.mjs.
const VF_CSS_28C = `/* Correction du 28/10, 3e retour (scripts/construire.mjs) : textes plus lisibles sur ordinateur. */
@media (min-width: 900px) {
  /* Projecteur : « Your » (.26 → .4 de la ligne) et « You film. You send… » (19 px → 24 à 32 px). Texte coupé aux mêmes endroits
     qu'à 19 px (3 lignes, en anglais comme en français) : largeur du texte gardée en em (26ch moins le trait de 15 px, à 19 px).
     Le bloc garde son haut (déjà près de l'en-tête sur un écran bas) et grandit vers le bas : décalé de la moitié de ce qu'il
     gagne (« Your » : .14 × 1,18 × 1,5 ligne ; phrase : 3 lignes de 1,55 + marge de 3,2). */
  .vfp-texte { --vfp-h1: clamp(26px, 2.7vw, 46px); --vfp-lede: clamp(24px, 1.2vw + 8px, 32px); transform: translateY(calc(-50% + .1239 * var(--vfp-h1) + 3.925 * (var(--vfp-lede) - 19px))); }
  .vfp-texte .vfp-h1-p { font-size: .4em; }
  .vfp-texte .vfp-lede { font-size: var(--vfp-lede); max-width: calc(10.597em + 15px); }
}
@media (min-width: 1000px) {
  /* Planche II. Surtitre (--vfk-eb) : une ligne en anglais, deux en français (37em au plus) ; la plaque, à sa hauteur, s'arrête
     avant lui (sa largeur en dépend). Phrase sous le titre sur une ligne. Le titre garde sa largeur ; surtitre, titre et phrase
     restent dans le bloc des cartes, réduit d'ensemble si la hauteur manque. */
  .vfk { --vfk-eb: clamp(13px, .65vw + 7px, 20px); }
  .vfk-plaque { max-width: max(150px, calc(46vw - 18.5 * var(--vfk-eb) - 65px)); }
  .vfk-plaque b { font-size: clamp(11px, .4vw + 8px, 17px); }
  .vfk-plaque span { font-size: clamp(19px, .5vw + 13.5px, 25px); }
  .vfk-tete .vf-eyebrow { margin-inline: -120px; font-size: var(--vfk-eb); }
  .vfk-tete .vf-eyebrow > span { max-width: 37em; }
  .vfk-tete .vf-lede { max-width: none; margin-inline: -160px !important; font-size: clamp(24px, .7vw + 15px, 30px); }
}
`;
// Retour de Loan du 29/10 : mêmes textes plus grands sur mobile aussi, et « For everyone / From beginner / To pro » plus grand,
// « surtout sur mobile où c'est vraiment trop petit ». Ce dernier est réduit par ecarter() tant qu'il touche la silhouette de
// Loan : sur mobile, la place à côté de la jambe le ramenait à 0,4–0,6 fois sa taille (10 à 14 px). Il descend donc là où la
// jambe est plus fine, ce qui lui laisse la place de grandir (écart entre les lignes gardé : resserré, « trop serré » pour Loan).
const VF_CSS_29 = `/* Correction du 29/10 (scripts/construire.mjs) : textes plus lisibles sur mobile, « For everyone… » plus grand. */
.vfp-mot--feedback.vfp-pour { font-size: clamp(28px, 3vw, 54px); }
@media (max-width: 899px) {
  /* Plus bas (la jambe y est plus fine) ; + 100lvh − 100svh comme la correction Safari « lvh », qu'il remplace ici. */
  .vfp-mot--feedback.vfp-pour { font-size: clamp(26px, 8vw, 32px); }
  .vfp-scene .vfp-mot--feedback.vfp-pour { bottom: calc(max(24px, 8svh) + 100lvh - 100svh) !important; }
  .vfp-texte .vfp-h1-p { font-size: .4em; }
  .vfp-texte .vfp-lede { font-size: 20px; }
}
@media (max-width: 999px) {
  /* Planche II : plaque sur toute la largeur (elle est centrée au-dessus du titre), textes plus grands. */
  .vfk-plaque { max-width: none; }
  .vfk-plaque b { font-size: 12.5px; }
  .vfk-plaque span { font-size: 19px; }
  .vfk-tete .vf-eyebrow { font-size: 14px; }
  .vfk-tete .vf-lede { font-size: 22px; }
}
`;

// Retour de Loan du 29/10 (« plusieurs personnes m'ont dit qu'elles pensaient que c'était la fin de la page ») : en défilant, l'image
// ne s'arrête plus jamais net, sauf sur les cartes de paiement en fin de page. Là où elle se figeait, elle continue au ralenti, comme
// un super ralenti de cinéma : toujours un micro-mouvement.
// Projecteur, tenue du cran (1,25 écran où la scène n'avançait qu'à 0,6 % du défilement) : la scène ralentit jusqu'à 7 % du
// défilement, jamais à zéro, puis repart. Même retard total (0,994 × tenue) et même point au cran (ancre « What is it », P = 0,33) :
// après la tenue, tout est exactement à la même place qu'avant.
// Retour de Loan du 30/10 (« ça zoome vite et d'un coup gros freinage », « mouvement organique / naturel de caméra ») : le freinage
// commence dès le haut de la page et s'étale sur ≈ 1,8 écran au lieu de 0,6 (vitesse en courbe douce, freinage le plus fort 3 fois
// moins fort). La vitesse du zoom décroît régulièrement (≈ 62, 41, 26, 16, 9, 5 puis 3 % par écran, tous les 0,2 écran, au lieu de
// 76, 44, 16 puis 3).
// Second retour de Loan du 30/10 (« sur portable Safari c'est nickel » ; « sur ordinateur, il faut faire pareil juste après le gros
// freinage, ça repart trop vite ») : sur ordinateur (≥ 900 px), la reprise est le miroir du freinage, ≈ 1,8 écran au lieu de 0,6.
// Elle allonge le retard total (1,8 écran au lieu de 1,24) : l'éblouissement arrive ≈ 0,55 écran plus tard et la page blanche
// « Video Feedback » dure d'autant moins (≈ 2,75 écrans) ; l'ancre « For who » suit (même progression qu'avant). Mobile inchangé.
const RALENTI_AVANT = "const lisse = (a, b, v) => { const t = borne((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };\n";
const RALENTI_APRES = RALENTI_AVANT +
  "/* Corrections du 29 et 30/10 (scripts/construire.mjs) : progression s de la scène pour un défilement x, tenue de longueur T au cran\n" +
  "   (milieu c = s0 + T / 2). Vitesse en courbe douce : freinage du haut de la page (x = 0) jusqu'à D, puis 7 % du défilement, jamais\n" +
  "   zéro, jusqu'à P, puis reprise sur E (T / 2 sur mobile, D sur ordinateur) ; ensuite s = x − R (R, retard total). Au cran, s est\n" +
  "   celui d'avant ; sur mobile, R = 0,994 × T comme avant. */\n" +
  "const ralentiP = (s0, T, mob) => { const k = 0.07, Q = 0.994 * T / (1 - k), F = (Q - 0.5 * T) / 2, c = s0 + T / 2, D = Math.min(c + F, Math.max(1, 2 * c - Q)), P = c + F, E = mob ? 0.5 * T : D;\n" +
  "  return { k, D, P, E, R: (1 - k) * (P - D / 2 + E / 2) }; };\n" +
  "const ralenti = (x, s0, T, mob) => { const { k, D, P, E, R } = ralentiP(s0, T, mob);\n" +
  "  if (x <= 0) return x;\n" +
  "  if (x < D) { const u = x / D; return x - (1 - k) * D * u * u * u * (1 - u / 2); }\n" +
  "  if (x < P) return D * (1 + k) / 2 + k * (x - D);\n" +
  "  if (x < P + E) { const u = (x - P) / E; return D * (1 + k) / 2 + k * (x - D) + (1 - k) * E * u * u * u * (1 - u / 2); }\n" +
  "  return x - R; };\n" +
  "/* Correction du 30/10 (scripts/construire.mjs) : écran tactile (téléphone, tablette), pour l'inertie de la caméra. */\n" +
  "let mqTactile = null;\n" +
  "const tactile = () => { if (mqTactile === null) mqTactile = window.matchMedia ? window.matchMedia(\"(pointer: coarse)\") : false; return !!(mqTactile && mqTactile.matches); };\n" +
  "/* Corrections du 02/11 (scripts/construire.mjs) : sur mobile, bascule yin-yang au ralenti. Défilement xr → progression x de l'étude,\n" +
  "   vitesse en courbe douce : 80 % pendant le tour, la séparation et le vol des moitiés (u 6,9 → 7,4), 33 % quand tout est posé\n" +
  "   (u 7,4 → 7,56), 100 % pendant que les titres s'écartent, 55 % pendant l'effacement des lignes dorées (u 7,94 → 8,42), 20 % pendant\n" +
  "   que la photo redevient croquis, puis retour à 100 %. Segments [vitesse au début, à la fin, longueur] ; un plateau (longueur 0)\n" +
  "   finit au repère x donné. E : défilement ajouté (section de l'étude allongée d'autant sur mobile). */\n" +
  "const basculeLente = (() => { const vc = 0.8, vp = 0.33, ve = 0.55, vt = 0.2, X = depuisU, XL = XS[XS.length - 1];\n" +
  "  const S = [[1, vc, 0.8], [vc, vc, 0, X(7.4) - 0.3 * (vc + vp)], [vc, vp, 0.6], [vp, vp, 0, X(7.56)], [vp, 1, 0.8], [1, 1, 0, X(7.94) - 0.3 * (1 + ve)],\n" +
  "    [1, ve, 0.6], [ve, ve, 0, X(8.42) - 0.2 * (ve + vt)], [ve, vt, 0.4], [vt, vt, 0, XL + 0.3 * 110 / 90], [vt, 1, 1]];\n" +
  "  const A = X(6.9) - 0.4 * (1 + vc);\n" +
  "  let x = A, y = A; const P = S.map(([a, b, L, m]) => { if (m !== undefined) L = Math.max(0, (m - y) / a); const p = { x, y, L, a, b }; x += L; y += L * (a + b) / 2; return p; });\n" +
  "  return { E: x - y, f: (xr) => { if (xr <= A) return xr; for (const p of P) if (xr < p.x + p.L) { const t = (xr - p.x) / p.L; return p.y + p.L * (p.a * t + (p.b - p.a) * t * t * t * (1 - t / 2)); } return xr - (x - y); } };\n" +
  "})();\n";
// Troisième retour de Loan du 30/10 (« en fait sur mobile je ne vois pas les courbes, il y a toujours ces arrêts nets ») : sur
// téléphone, un coup de doigt fait défiler 1 à 2 écrans en une demi-seconde ; les courbes, tracées sur ≈ 1,8 écran de défilement,
// passaient en un instant (simulé : vitesse du zoom 323 → 91 → 33 → 14 % par seconde en 0,6 s, puis à-coup au coup de doigt
// suivant). Sur écran tactile, la caméra a maintenant de l'inertie : la progression de la scène suit le défilement avec un retard
// en douceur (constante de temps 0,45 s), comme une caméra qui a du poids. Elle continue de glisser un instant quand le doigt
// s'arrête et ne change jamais de vitesse d'un coup (simulé : 56, 110, 82, 52, 33, 21, 15… sans à-coup). Même chose pour la
// bascule yin-yang de l'étude (amorti 0,45 s au lieu de 0,07 s). Ordinateur (souris, pavé) : inchangé. Mouvement réduit : rien.
const INERTIE_AVANT = "    const maj = () => {\n      raf = 0;\n      if (!G.W || !G.H) { mesurer();";
const INERTIE_APRES = "    /* Correction du 30/10 (scripts/construire.mjs) : sur écran tactile, inertie de la caméra (la scène suit le défilement en douceur). */\n" +
  "    let sL = null, tL = 0, rafL = 0;\n" +
  "    const inertie = (sC) => { const now = performance.now(), dt = tL ? Math.min(0.1, (now - tL) / 1000) : 0; tL = now;\n" +
  "      if (sL === null || calme || !tactile()) { sL = sC; return sC; }\n" +
  "      sL += (sC - sL) * (1 - Math.exp(-dt / 0.45));\n" +
  "      if (Math.abs(sC - sL) < 0.5) sL = sC; else if (!rafL) rafL = requestAnimationFrame(() => { rafL = 0; if (!raf) maj(); });\n" +
  "      return sL; };\n" + INERTIE_AVANT;
const INERTIE_FIN_AVANT = "cancelAnimationFrame(vmRaf); cancelAnimationFrame(raf); cancelAnimationFrame(anim); cancelAnimationFrame(rafP); };";
const INERTIE_FIN_APRES = "cancelAnimationFrame(vmRaf); cancelAnimationFrame(raf); cancelAnimationFrame(anim); cancelAnimationFrame(rafP); cancelAnimationFrame(rafL); };";
const BASCULE_AMORTI_AVANT = "      else uL += (uC - uL) * (1 - Math.exp(-dt * 14));\n";
const BASCULE_AMORTI_APRES = "      else uL += (uC - uL) * (1 - Math.exp(-dt * (tactile() ? 1 / 0.3 : 14))); /* Corrections du 30/10 et du 02/11 (scripts/construire.mjs) : inertie sur écran tactile (0,3 s). */\n";
// Retour de Loan du 02/11 (« sur mobile, tout va très bien sauf la partie yin yang : avec un défilement constant, j'ai même pas le
// temps de le voir, ça passe super vite et ça va direct sur les cartes de paiement ») : sur mobile (< 900 px), la bascule est au
// ralenti, comme le projecteur : le tour du taiji, la séparation et le vol des moitiés défilent 1,25 fois plus lentement, le moment où
// tout est posé 3 fois plus lentement (jamais d'arrêt, et la caméra continue d'avancer au rythme du défilement).
// Second retour du 02/11 (« le yin-yang est désormais correct, mais juste après ça passe directement aux cartes, on n'a pas le temps
// de voir la partie où les lignes dorées disparaissent ») : mesuré, sur mobile, tout l'effacement (écrans 22,0 → 23,2) se faisait
// pendant que la planche II montait par-dessus (elle entre un écran avant la tenue). Effacement à 55 % (≈ 2,5 écrans au lieu de
// 1,1), photo → croquis à 20 %, puis retour à 100 % : l'effacement finit ≈ 0,5 écran avant que la planche n'entre. Vitesse ≥ 20 %.
// Section de l'étude allongée d'autant sur mobile (+ 497svh ≈ 5 écrans au total) : les points du croquis gardent leur rythme.
// Ordinateur inchangé.
const LENTE_CSS_AVANT = ".vfa { position: relative; height: calc(1455svh + var(--vfk-tenue)); }";
const LENTE_CSS_APRES = LENTE_CSS_AVANT + " @media (max-width: 899px) { .vfa { height: calc(2009svh + var(--vfk-tenue)); } } /* Correction du 02/11 (scripts/construire.mjs) : bascule yin-yang au ralenti sur mobile. */";
const LENTE_UR_AVANT = "V.UR = XS[XS.length - 1] * crs / Math.max(1, crs - tenue); }";
const LENTE_UR_APRES = "V.E = V.mobile ? basculeLente.E : 0; V.UR = (XS[XS.length - 1] + V.E) * crs / Math.max(1, crs - tenue); } /* Correction du 02/11 : défilement ajouté sur mobile. */";
const LENTE_XR_AVANT = "xr = borne(-r.top / course, 0, 1) * V.UR, uC = versU(xr);";
const LENTE_XR_APRES = "xr0 = borne(-r.top / course, 0, 1) * V.UR, xr = V.E ? basculeLente.f(xr0) : xr0, uC = versU(xr); /* Correction du 02/11 : ralenti du yin-yang sur mobile. */";
const LENTE_H_AVANT = "h0 = borne((xr - XL) / Math.max(1e-6, V.UR - XL), 0, 1)";
const LENTE_H_APRES = "h0 = borne((xr - XL) / Math.max(1e-6, V.UR - V.E - XL), 0, 1)";
const LENTE_X17_AVANT = "x17 = XL + (V.mobile ? 0.17 : 0.17 / RT) * (V.UR - XL);";
const LENTE_X17_APRES = "x17 = XL + (V.mobile ? 0.17 : 0.17 / RT) * (V.UR - V.E - XL);";
// Même retour du 02/11 (ordinateur : « quand les cartes se retournent de nouveau, ça clignote beaucoup », « quelques clignotements »
// sur loandrouard.com, « beaucoup plus » sur l'adresse de test) : la feuille de l'étude est redessinée nette (largeur et hauteur
// changées, tout repeint) 0,2 s après chaque arrêt de la caméra si son zoom a changé de plus de 1 % (correction du 27/10, grands
// écrans). L'avancée lente de la caméra (29/10) changeait ce zoom pendant toute la bascule : la feuille était repeinte à chaque
// pause de la molette. Elle est désormais exclue de ce calcul : la feuille n'est repeinte que comme sur loandrouard.com, et
// l'avancée (≤ 9 %) agrandit la feuille déjà nette.
// Troisième retour du 02/11 (« sur mobile, j'ai toujours pas le temps de voir les lignes dorées qui disparaissent, ça reste
// instantané, la descente ») : sur iPhone, un coup de doigt parcourt 3 à 5 écrans, et l'étude (amortie 0,45 s) n'affichait pas encore
// l'effacement quand la planche arrivait. Amorti de la bascule 0,45 → 0,3 s ; photo → croquis lent jusqu'au début du fondu de la
// scène (h = 0,3 au lieu de 0,17 : ≈ 1 écran de marge avant la planche au lieu de 0,5) ; freinage d'iPhone / iPad (18/10, glissade
// courte de Safari, validé par Loan) sur les 5 écrans qui précèdent les cartes au lieu de 2 en mise en page mobile : il couvre
// l'effacement des lignes dorées. Ordinateur et tablette en paysage inchangés.
const FREIN_AVANT = 'racine.classList.toggle("vfk-frein", desc && y > arret - ZONE * window.innerHeight && y < arret - 2);';
const FREIN_APRES = 'racine.classList.toggle("vfk-frein", desc && y > arret - (G && !G.rang ? 5 : ZONE) * window.innerHeight && y < arret - 2); /* Correction du 02/11 (scripts/construire.mjs) : 5 écrans en mise en page mobile. */';
const NETTE_AVANT = "      camS = s; camX = tx; camY = ty;";
const NETTE_APRES = "      camS = s / (V.p || 1); camX = tx; camY = ty; /* Correction du 02/11 (scripts/construire.mjs) : l'avancée lente ne redessine pas la feuille. */";
const ANCRE_FOR_WHO_AVANT = "tF = Math.round(0.9 * plage + tenue * 0.994);";
const ANCRE_FOR_WHO_APRES = "tF = Math.round(0.9 * plage + ralentiP(s0, tenue, mob).R); /* Correction du 30/10 (scripts/construire.mjs) : retard total de ralenti(). */";
// Projecteur, après l'éblouissement (P plafonné à 0,8 : page blanche « Video Feedback / For everyone… » immobile sur près de
// 3 écrans, seuls les mots apparaissaient) : la caméra continue d'avancer très lentement sur toute l'affiche (≈ 1,7 % par écran,
// 5,5 % le temps de la page blanche), prise en douceur dès la fin de l'approche (P = 0,6), sans à-coup. Loan et le titre grandissent
// ensemble autour du même point : les écarts entre les mots et la silhouette (ecarter(), mesuré sans cette avancée) restent ceux
// d'avant, à l'échelle ; plafonnée une fois la scène sortie de l'écran. Mouvement réduit : rien.
const POUSSEE_AVANT = "const t = borne(P / 0.7, 0, 1), z = 1 + (Zm - 1) * (1 - Math.pow(1 - t, 2.1));";
const POUSSEE_APRES = "const t = borne(P / 0.7, 0, 1), pz = calme ? 0 : borne(s / plage - 0.36, 0, 1.2), pf = 1 + 0.08 * (pz < 0.12 ? pz * pz / 0.24 : pz - 0.06), z = (1 + (Zm - 1) * (1 - Math.pow(1 - t, 2.1))) * pf; /* Correction du 29/10 (scripts/construire.mjs) : la caméra ne s'arrête jamais, lente avancée sur la page blanche. */";
// 02/11 (photo de Loan, iPhone) : sur la page blanche, « VIDEO FEEDBACK » et « For everyone… » s'affichaient en grand sur la
// silhouette (réduction d'ecarter() perdue). Safari n'appliquait plus la réduction des mots (propriété scale) sous le bloc du titre
// agrandi (transform). Le bloc n'est plus transformé : chaque mot avance avec la caméra par ses propres propriétés translate et
// scale (réduction d'ecarter() × avancée), autour du même point que Loan. Mêmes écarts qu'avant, à l'échelle.
const TITRE_POUSSEE_AVANT = "      fig.style.transform = reman.style.transform = tFig;\n";
const TITRE_POUSSEE_APRES = TITRE_POUSSEE_AVANT +
  "      { const mots = G.mots || (G.mots = [\".vfp-mot--video\", \".vfp-mot--feedback\"].map((q) => sec.querySelector(q)).filter(Boolean)), av = pf > 1.0005;\n" +
  "        mots.forEach((el) => { if (el.__k === undefined) return; const k = el.__k, t = av ? ((pf - 1) * (el.__ax - Sx)).toFixed(1) + \"px \" + ((pf - 1) * (el.__ay - Sy)).toFixed(1) + \"px\" : \"\", sc = av ? (k * pf).toFixed(4) : k < 1 ? k.toFixed(3) : \"\";\n" +
  "          if (el.__v !== t + \"|\" + sc) { el.__v = t + \"|\" + sc; el.style.translate = t; el.style.scale = sc; } }); } /* Correction du 29/10 et du 02/11 (scripts/construire.mjs) : les mots avancent avec Loan. */\n";
const ECARTER_DEBUT_AVANT = "const el = sec.querySelector(q); if (!el) return; el.style.scale = \"\"; el.style.transformOrigin = (ox * 100) + \"% \" + (oy * 100) + \"%\";";
const ECARTER_DEBUT_APRES = ECARTER_DEBUT_AVANT + " el.style.translate = \"\"; el.__v = \"\"; /* Correction du 02/11 : mesuré sans l'avancée de la caméra. */";
const ECARTER_FIN_AVANT = "        if (k < 1) el.style.scale = k.toFixed(3);\n";
const ECARTER_FIN_APRES = ECARTER_FIN_AVANT + "        el.__k = k; el.__ax = px0; el.__ay = py0; /* Correction du 02/11 : réduction et coin d'ancrage, pour l'avancée de la caméra. */\n";
// Étude, bascule yin-yang et photo en couleur (u ≥ 6,9) : la caméra est fixe et chaque étape finit en douceur, d'où des presque-arrêts
// (début du tour du taiji, arrivée des moitiés, pause 7,4 → 7,56 « tout est posé, rien ne bouge », photo immobile pendant que les
// corrections en or s'effacent). La caméra avance très lentement vers Loan pendant tout ce passage (≈ 1,5 % par écran, prise en
// douceur), puis continue pendant le recul de la tenue. Les étapes du croquis (u < 6,2) bougeaient déjà (zoom de 3,5 % par point).
const DERIVE_AVANT = "      cible = { fx: pl.f[0] + (0.42 - pl.f[0]) * V.m, fy: pl.f[1] + (0.395 - pl.f[1]) * V.m, z: pl.z * z * (1 - 0.06 * V.m) * (1 - 0.3 * lisse(0.05, 0.4, h)) };\n";
const DERIVE_APRES = "      /* Correction du 29/10 (scripts/construire.mjs) : lente avancée de la caméra dès la bascule, jamais d'arrêt. */\n" +
  "      const xd = calme ? 0 : Math.max(0, xr0 - depuisU(6.9)), pousse = 0.014 * (xd < 0.5 ? xd * xd : xd - 0.25); V.p = 1 + pousse;\n" +
  "      cible = { fx: pl.f[0] + (0.42 - pl.f[0]) * V.m, fy: pl.f[1] + (0.395 - pl.f[1]) * V.m, z: pl.z * z * (1 - 0.06 * V.m) * (1 - 0.3 * lisse(0.05, 0.4, h)) * (1 + pousse) };\n";
// --- Retour de Loan du 30/10 -------------------------------------------------------------------------------------
// « J'aimerais que ce message s'affiche quand ils ouvrent la page » : le texte de Loan sur le fonctionnement de WhatsApp
// s'ouvre dans une fenêtre juste après le paiement (et au retour par le lien de l'e-mail, /acces/…), par-dessus la carte
// payée ; un lien de la carte la rouvre. Un texte par formule (délais du site, une vidéo / trois / une par semaine) et par
// langue (anglais traduit par Claude). Écrit pour convenir aussi à un client qui reprend une formule (« vos vidéos »,
// pas « votre première vidéo ») ; 2 vidéos par analyse, partout (Loan, 30/10). Section : texte commun, ou { single, pack, prog } ; {delai} = délai de la formule (FORMULES).
// Version d'essai, à faire valider par Loan sur l'adresse de test (aperçu : ?apercu=single, pack ou prog).
const GUIDE = {
  fr: {
    titre: "Il est l’heure de passer au niveau supérieur 🤸‍♂️",
    intro: "Je suis heureux de vous accompagner dans votre progression. Voici comment nous allons travailler ensemble sur WhatsApp :",
    sections: [
      { icone: "🎥", titre: "Vos vidéos", texte: {
        single: "Envoyez-moi vos 2 vidéos. Je vous transmettrai une analyse personnalisée et des exercices ciblés, en fonction de vos priorités.",
        pack: "Envoyez-moi 2 vidéos pour chacune de vos 3 analyses, valables 6 mois à partir de la première. Je vous transmettrai à chaque fois une analyse personnalisée et des exercices ciblés, en fonction de vos priorités.",
        prog: "Envoyez-moi 2 vidéos par semaine. Je vous transmettrai une analyse personnalisée et des exercices ciblés, en fonction de vos priorités." } },
      { icone: "💬", titre: "Vos questions", texte: {
        single: "Après l’analyse, un échange de questions-réponses est inclus pour vous aider à appliquer mes conseils. Merci de regrouper vos questions dans un seul message afin que je puisse vous apporter une réponse complète.",
        pack: "Après chaque analyse, un échange de questions-réponses est inclus pour vous aider à appliquer mes conseils. Merci de regrouper vos questions dans un seul message afin que je puisse vous apporter une réponse complète.",
        prog: "Après chaque analyse, un échange de questions-réponses est inclus pour vous aider à appliquer mes conseils. Merci de regrouper vos questions dans un seul message afin que je puisse vous apporter une réponse complète." } },
      { icone: "⏳", titre: "Mes réponses",
        texte: "Je consulte WhatsApp sur des créneaux dédiés et vous réponds sous {delai}, du lundi au dimanche. Vous pouvez m’écrire au moment qui vous convient ; les échanges se font en différé." },
      { icone: "📈", titre: { single: "Après l’analyse", pack: "Entre deux analyses", prog: "Entre deux analyses" }, texte: {
        single: "Prenez le temps de pratiquer les exercices et de noter vos observations. Pour faire analyser de nouvelles vidéos, il vous suffira de reprendre une formule sur le site.",
        pack: "Prenez le temps de pratiquer les exercices et de noter vos observations. Les nouvelles vidéos et les sujets nécessitant une analyse complémentaire seront traités lors de votre prochaine analyse.",
        prog: "Prenez le temps de pratiquer les exercices et de noter vos observations. Les nouvelles vidéos et les sujets nécessitant une analyse complémentaire seront traités lors du prochain rendez-vous hebdomadaire." } },
    ],
    fin: "Ce fonctionnement me permet de consacrer toute l’attention nécessaire à votre progression.",
    bientot: "À très bientôt pour vos vidéos !",
    signature: "Loan ☀️",
    lien: "Comment nous allons travailler", fermer: "Fermer", whatsapp: "Ouvrir WhatsApp",
  },
  en: {
    titre: "Time to level up 🤸‍♂️",
    intro: "I’m happy to support you in your progress. Here’s how we’ll work together on WhatsApp:",
    sections: [
      { icone: "🎥", titre: "Your videos", texte: {
        single: "Send me your 2 videos. I’ll send you a personalized analysis and targeted exercises, based on your priorities.",
        pack: "Send me 2 videos for each of your 3 analyses, valid for 6 months from the first one. Each time, I’ll send you a personalized analysis and targeted exercises, based on your priorities.",
        prog: "Send me 2 videos a week. I’ll send you a personalized analysis and targeted exercises, based on your priorities." } },
      { icone: "💬", titre: "Your questions", texte: {
        single: "After the analysis, a round of questions and answers is included to help you put my advice into practice. Please group your questions in a single message so I can give you a complete answer.",
        pack: "After each analysis, a round of questions and answers is included to help you put my advice into practice. Please group your questions in a single message so I can give you a complete answer.",
        prog: "After each analysis, a round of questions and answers is included to help you put my advice into practice. Please group your questions in a single message so I can give you a complete answer." } },
      { icone: "⏳", titre: "My replies",
        texte: "I check WhatsApp at set times and reply within {delai}, Monday to Sunday. You can write to me whenever suits you; we don’t need to be online at the same time." },
      { icone: "📈", titre: { single: "After the analysis", pack: "Between analyses", prog: "Between analyses" }, texte: {
        single: "Take the time to practice the exercises and note what you observe. To have new videos analyzed, simply get another package on the site.",
        pack: "Take the time to practice the exercises and note what you observe. New videos and topics that need further analysis will be covered in your next analysis.",
        prog: "Take the time to practice the exercises and note what you observe. New videos and topics that need further analysis will be covered at our next weekly session." } },
    ],
    fin: "Working this way lets me give your progress all the attention it deserves.",
    bientot: "Looking forward to your videos!",
    signature: "Loan ☀️",
    lien: "How we’ll work together", fermer: "Close", whatsapp: "Open WhatsApp",
  },
};
const GUIDE_CSS = `/* Correction du 30/10 (scripts/construire.mjs) : fenêtre « How we'll work together » / « Comment nous allons travailler »,
   ouverte après le paiement, même habillage que la fenêtre de paiement ; lien de la carte payée qui la rouvre. */
/* Bento (demandé par Loan le 30/10 : « qu'ils flottent dans le vide », pas dans un plus gros rectangle) : pas de cadre autour,
   les rectangles flottent sur le fond assombri de la page ; le texte défile si la hauteur manque. Marges ≥ 30 px : la lueur
   dorée d'un rectangle survolé n'est pas coupée. */
.vf-modale.vf-guide { background: rgba(10,10,10,.9); } /* fond plus sombre que la fenêtre de paiement (.82) : la page se voit moins entre les rectangles */
.vf-guide .vf-modale__panneau { display: flex; flex-direction: column; width: min(600px, 100%); max-height: calc(100vh - 16px); max-height: calc(100dvh - 16px); overflow: hidden; padding: 0; border: 0; border-radius: 0; background: none; }
.vf-guide__defile { min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: 8px 32px 32px; outline: none; }
.vf-guide .vf-modale__tete { margin-bottom: 14px; }
.vf-guide__etiquette { font-family: 'Cinzel', Georgia, serif; font-size: 11px; letter-spacing: .14em; text-transform: uppercase; color: #C6A05E; }
.vf-guide__titre { margin: 0; font-family: 'Cormorant SC', Georgia, serif; font-weight: 600; font-size: clamp(28px, 4vw, 36px); line-height: 1.1; letter-spacing: .01em; text-wrap: balance; }
.vf-guide__intro { margin: 14px 0 0; font-size: 19px; line-height: 1.55; color: rgba(246,245,241,.8); }
/* Rectangles (demandés par Loan le 30/10, « plus facile à lire ») : l'introduction et chacune des quatre parties dans son cadre,
   avec l'effet des cartes au survol, mêmes valeurs : inclinaison (incliner / relacher), reflet doré (.vf-carte::after) et bord
   doré (.vf-carte:hover). Souris seulement : sur écran tactile, un toucher laisserait un cadre penché pendant la lecture. */
.vf-guide__carte { position: relative; overflow: hidden; border: 1px solid rgba(246,245,241,.14); border-radius: 18px; background: #1e1d1c; padding: 20px 22px 22px; transition: border-color .35s ease, box-shadow .35s ease; }
.vf-guide__carte::after { content: ''; position: absolute; inset: -1px; border-radius: 18px; pointer-events: none; opacity: 0; transition: opacity .35s ease; background: radial-gradient(240px circle at var(--mx, 50%) var(--my, 0%), rgba(169,129,74,.16), transparent 70%); }
@media (hover: hover) and (pointer: fine) {
  .vf-guide__carte:hover::after { opacity: 1; }
  .vf-guide__carte:hover { border-color: rgba(169,129,74,.4); box-shadow: 0 0 40px -10px rgba(169,129,74,.4); }
}
@media (hover: none), (pointer: coarse) { .vf-guide__carte { transform: none !important; } }
.vf-guide__blocs { display: grid; gap: 12px; margin-top: 12px; }
.vf-guide__bloc h3 { display: flex; align-items: center; gap: 10px; margin: 0; font-family: 'Cinzel', Georgia, serif; font-weight: 500; font-size: 12.5px; letter-spacing: .12em; text-transform: uppercase; color: #E3D5B8; }
.vf-guide__bloc h3 span { font-size: 18px; letter-spacing: 0; }
.vf-guide__bloc p, .vf-guide__fin { margin: 8px 0 0; font-size: 18px; line-height: 1.55; color: rgba(246,245,241,.86); }
.vf-guide__pied { margin-top: 12px; }
.vf-guide__fin { margin-top: 0; }
.vf-guide__fin + .vf-guide__fin { margin-top: 6px; }
.vf-guide__signature { margin: 6px 0 0; font-style: italic; font-size: 20px; }
.vf-guide__actions { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 14px 24px; margin-top: 24px; }
.vf-guide-lien { align-self: flex-start; padding: 0; border: 0; background: none; color: #C6A05E; font: 500 11px/1.5 'Cinzel', Georgia, serif; letter-spacing: .12em; text-transform: uppercase; text-decoration: underline; text-underline-offset: 4px; cursor: pointer; }
.vf-guide-lien:focus-visible { outline: 1px solid #A9814A; outline-offset: 3px; }
/* Téléphone et tablette en portrait : fond opaque (la grande carte payée, ouverte dessous, et son bouton Fermer se voyaient entre les rectangles). */
@media (max-width: 899px) { .vf-modale.vf-guide { background: #0a0a0a; } }
@media (max-width: 599px) { .vf-modale.vf-guide { padding: 8px 0; } .vf-guide__defile { padding: 12px 16px 24px; } .vf-guide__carte { padding: 18px 18px 20px; } }
/* Format paysage sur ordinateur et tablette en paysage (demandé par Loan le 30/10 : « pour qu'on puisse tout voir d'un coup ») :
   à gauche le rectangle d'introduction (vertical), à droite les quatre parties (2 × 2), dessous la fin du message et les boutons.
   Ordre du texte inchangé (lecteurs d'écran, téléphone). Si la hauteur manque, le texte défile encore. */
@media (min-width: 900px) {
  .vf-guide .vf-modale__panneau { width: min(1120px, 100%); }
  .vf-guide__defile { display: grid; grid-template-columns: minmax(0, .85fr) minmax(0, 2fr); grid-template-areas: "tete tete" "accueil blocs" "pied pied"; column-gap: 16px; padding: 24px 32px 28px; }
  .vf-guide__defile > .vf-modale__tete { grid-area: tete; }
  .vf-guide__accueil { grid-area: accueil; }
  .vf-guide__blocs { grid-area: blocs; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-top: 0; }
  .vf-guide__bloc p { font-size: 17.5px; line-height: 1.5; }
  /* « Ouvrir WhatsApp » centré horizontalement dans le rectangle du bas (Loan, 30/10), en bas, à hauteur de la signature ;
     le texte garde toute la largeur (ses deux dernières lignes sont courtes : le bouton ne les touche pas). */
  .vf-guide__pied { grid-area: pied; display: grid; grid-template-columns: 1fr auto 1fr; align-items: end; margin-top: 16px; }
  .vf-guide__mot { grid-area: 1 / 1 / 2 / 4; }
  .vf-guide__actions { grid-area: 1 / 2 / 2 / 3; margin-top: 0; }
  /* Plus serré, pour que tout tienne sans défiler jusqu'à 1280 × 720 et 1024 × 768 (iPad en paysage), en français aussi. */
  .vf-guide__defile { padding: 8px 32px 32px; }
  .vf-guide .vf-modale__tete { margin-bottom: 12px; }
  .vf-guide__carte { padding: 18px 20px 20px; }
  .vf-guide__bloc p { margin-top: 6px; }
}
@media (min-width: 900px) and (max-width: 1199px) {
  .vf-guide__defile { grid-template-columns: minmax(0, .75fr) minmax(0, 2fr); padding-left: 30px; padding-right: 30px; }
  .vf-guide__bloc p { font-size: 16.5px; }
}
`;
const GUIDE_HTML = `
<sc-if value="{{ guideOuvert }}" hint-placeholder-val="{{ false }}">
<div class="vf-modale vf-guide" role="dialog" aria-modal="true" aria-label="{{ guideLien }}" onClick="{{ fermerFondGuide }}">
<div class="vf-modale__panneau">
<div class="vf-guide__defile" tabindex="-1" ref="{{ refGuide }}">
<div class="vf-modale__tete">
<span class="vf-guide__etiquette">{{ formuleNom }}</span>
<x-import component-from-global-scope="LoanDrouardDesignSystem_06a79c.LienTrait" ton="sombre" onClick="{{ fermerGuide }}" hint-size="70px,30px">{{ guideFermer }}</x-import>
</div>
<div class="vf-guide__accueil vf-guide__carte" onMouseMove="{{ incliner }}" onMouseLeave="{{ relacher }}">
<h2 class="vf-guide__titre">{{ guideTitre }}</h2>
<p class="vf-guide__intro">{{ guideIntro }}</p>
</div>
<div class="vf-guide__blocs">
<sc-for list="{{ guideSections }}" as="s" hint-placeholder-count="4">
<div class="vf-guide__bloc vf-guide__carte" onMouseMove="{{ incliner }}" onMouseLeave="{{ relacher }}"><h3><span aria-hidden="true">{{ s.icone }}</span>{{ s.titre }}</h3><p>{{ s.texte }}</p></div>
</sc-for>
</div>
<div class="vf-guide__pied vf-guide__carte" onMouseMove="{{ incliner }}" onMouseLeave="{{ relacher }}">
<div class="vf-guide__mot">
<p class="vf-guide__fin">{{ guideFin }}</p>
<p class="vf-guide__fin">{{ guideBientot }}</p>
<p class="vf-guide__signature">{{ guideSignature }}</p>
</div>
<div class="vf-guide__actions">
<x-import component-from-global-scope="LoanDrouardDesignSystem_06a79c.Bouton" ton="sombre" taille="md" href="{{ lienWhatsApp }}" target="_blank" rel="noreferrer" hint-size="170px,44px">{{ guideWhatsApp }}</x-import>
</div>
</div>
</div>
</div>
</div>
</sc-if>
`;
const GUIDE_JS = `/* Correction du 30/10 (scripts/construire.mjs) : texte de Loan « Comment nous allons travailler », par formule et par langue. */
const GUIDE = ${JSON.stringify(GUIDE)};
const guideTextes = (cle) => {
  const g = GUIDE[document.documentElement.lang === "fr" ? "fr" : "en"], par = (v) => (typeof v === "string" ? v : v[cle]);
  return { ...g, sections: g.sections.map((s) => ({ icone: s.icone, titre: par(s.titre), texte: par(s.texte).replace("{delai}", FORMULES[cle].delai.replace(/ /g, "\u00A0")) })) };
};

`;
const GUIDE_METHODES = `  /* Correction du 30/10 (scripts/construire.mjs) : fenêtre « Comment nous allons travailler », ouverte après le paiement
     (et depuis le lien de la carte payée) ; Close, Échap ou un clic hors de la fenêtre la referme. */
  refGuide = (el) => { if (el) el.focus({ preventScroll: true }); };
  ouvrirGuide() {
    if (this.state.guide) return;
    this._focusGuide = document.activeElement;
    document.body.style.overflow = "hidden";
    this.setState({ guide: true });
    if (!this._offGuide) {
      const esc = (e) => { if (e.key === "Escape" && this.state.guide && !this.state.paiement) this.fermerGuide(); };
      window.addEventListener("keydown", esc);
      this._offGuide = () => window.removeEventListener("keydown", esc);
    }
  }

  fermerGuide() {
    if (!this.state.guide) return;
    document.body.style.overflow = "";
    this.setState({ guide: false });
    const f = this._focusGuide; this._focusGuide = null;
    if (f && f !== document.body && f.focus && document.contains(f)) f.focus({ preventScroll: true });
  }

`;
const GUIDE_VALS = `      /* Correction du 30/10 (scripts/construire.mjs) : fenêtre « Comment nous allons travailler ». */
      ...(() => { const g = guideTextes(FORMULES[clePayee] ? clePayee : "single"); return {
        guideOuvert: !!(this.state.guide && clePayee), guideTitre: g.titre, guideIntro: g.intro, guideSections: g.sections,
        guideFin: g.fin, guideBientot: g.bientot, guideSignature: g.signature, guideLien: g.lien, guideFermer: g.fermer, guideWhatsApp: g.whatsapp }; })(),
      refGuide: this.refGuide,
      voirGuide: (e) => { e.stopPropagation(); this.ouvrirGuide(); },
      fermerGuide: () => this.fermerGuide(),
      fermerFondGuide: (e) => { const t = e.target; if (t === e.currentTarget || (t.matches && t.matches(".vf-modale__panneau, .vf-guide__defile, .vf-guide__blocs"))) this.fermerGuide(); }, /* fond ou vide entre les rectangles */
`;
// --- Retour de Loan du 30/10 : textes et structure des cartes de la planche II ------------------------------------
// Ordre demandé par Loan : nom, prix et sa phrase, texte, puces, bouton, puis des « bento » (petits rectangles : paiement,
// délai, format, langue, envoi…). Le délai est dans un rectangle : plus de « Reply in … » sous les cartes. « Launch offer »
// une seule fois, sous « Three ways to work together. » (plus au-dessus de chaque carte de la planche). Noms des formules
// changés partout (vitrine, fenêtre de paiement, carte payée, message WhatsApp). Français : scripts/traduction-fr.mjs.
// ⓘ (« le ⓘ à la fin du texte ») : bulle d'information au survol à la souris, au toucher ou au clavier (INFO_JS). Texte de
// chaque bulle : INFOS ; il est dans la page, caché (lecteurs d'écran : aria-describedby), et recopié dans la bulle.
const INFOS = {
  notes: { genre: "notes", lignes: [["A score", "Quality of the technical movements."], ["B score", "Overall performance (power, rhythm, style)."], ["C score", "Jumps and difficulty."]] },
  validite: { lignes: [["Validity", "Your 3 feedback rounds can be used within 6 months of your first video. Each round is delivered within 3 to 5 days."]] },
  abonnement: { lignes: [["Keep progressing", "Your subscription renews automatically at the end of each quarter. You can cancel at any time by simply sending us a message or an email before the next billing date. At the end of the 12 weeks, we review your progress and your goals for the next quarter together."]] },
  semaines: { lignes: [["Unused weeks", "Up to 2 weeks can be carried over to another week of the quarter."]] },
};
// Rectangles : [icône (PICTOS), titre (vide : texte seul), texte, ⓘ, sur toute la largeur (carte ouverte sur mobile)]. Puces : texte, ou [texte, ⓘ].
const ENVOI = "2 videos, 2 minutes max each or 3 videos, 45 seconds max each";
const FICHES = {
  Single: { ancien: ["Single<br>feedback", "one full analysis", "170px,44px"], nom: "Technical <br>analysis",
    accroche: "2 videos analyzed so you know what to improve and how.",
    textes: ["Send your taolu, your jumps or a specific section for more detail on particular elements.", "I analyze your videos based on your level and your goals:"],
    puces: ["Your strengths and your priority corrections.", "Specific advice on technique, jumps, rhythm or transitions, depending on your needs.",
      ["Advice mainly focused on the A and C scores", "notes"]],
    bento: [["paiement", "", "One-time payment"], ["delai", "Turnaround", "4 to 6 days"], ["format", "Feedback format", "Written or voice message"],
      ["langue", "Feedback language", "French or English"], ["envoi", "Submission", ENVOI, null, true]] },
  Pack: { ancien: ["3× feedback<br>pack", "3 full analyses", "180px,44px"], nom: "Progression <br>pack",
    accroche: "6 videos analyzed across 3 feedback rounds, so you can practice, adjust and improve.",
    textes: ["Develop your taolu, specific sections or jumps with three personalized feedback rounds on 2 videos each, spaced out to fit your pace."],
    puces: ["A detailed technical analysis of each of your videos.", "Specific advice on technique, jumps, speed, presence, rhythm, style or transitions, depending on your needs.",
      "Tracking of your progress from one feedback round to the next.", "Explained corrections and targeted drills after each round.",
      ["Advice and focus on the B score, in addition to the A and C scores", "notes"],
      // Prix de l'Analyse technique au moment de l'achat : 49 € pendant l'offre de lancement, 99 € ensuite.
      "Already had a Technical Analysis? Its {{ prixSingle }} is deducted from the Pack if you get it within 30 days."],
    bento: [["paiement", "", "One-time payment"], ["delai", "Turnaround", "3 to 5 days per feedback round", "validite"], ["format", "Feedback format", "Written or voice message"],
      ["langue", "Feedback language", "French or English"], ["envoi", "Submission", ENVOI + ", per round", null, true]] },
  Prog: { ancien: ["Quarterly<br>program", "weekly coaching", "180px,44px"], nom: "The way of <br>performance", par: " / quarter",
    accroche: "24 videos analyzed over 12 weeks, to develop your practice effectively.",
    textes: ["One-on-one coaching, week after week, to work on everything you want to improve and progress as effectively as possible."],
    puces: ["24 personalized analyses: 2 videos per week.", "Key areas to work on, defined at the start of the quarter.", "Ongoing support and weekly tracking of your corrections and progress.",
      "Training priorities and technical details set each week.", "Q&amp;A on WhatsApp after each feedback session.", "Final review with recommendations for what comes next."],
    bento: [["abonnement", "", "Quarterly subscription", "abonnement"], ["places", "Limited spots", "3 per quarter"], ["delai", "Turnaround", "Priority handling, within 48 to 72 hours", null, true],
      ["format", "Feedback format", "Written, voice or video"], ["langue", "Feedback language", "French or English"], ["envoi", "Submission", ENVOI + ", per feedback session", "semaines", true]] },
};
// Noms des formules dans le texte (fenêtre de paiement, carte payée, fenêtre du 30/10, message WhatsApp : achat).
const NOMS = {
  single: ["Single feedback", "Technical Analysis", "the Technical Analysis"],
  pack: ["3\\u00D7 feedback pack", "Progression Pack", "the Progression Pack"],
  prog: ["Quarterly program", "The Way of Performance", "The Way of Performance"],
};
let nInfo = 0;
const INFO = (cle) => { const i = INFOS[cle], id = "vf-i-" + ++nInfo;
  return `<span class="vf-i" role="button" tabindex="0" aria-label="More information" aria-expanded="false" aria-describedby="${id}"><span class="vf-i-o">i</span></span>` +
    `<span class="vf-i-txt" id="${id}"${i.genre ? ` data-genre="${i.genre}"` : ""}>${i.lignes.map(([l, t]) => `<span class="vf-i-l"><b>${l}</b><span>${t}</span></span>`).join("")}</span>`; };
const PUCE = (p) => (Array.isArray(p) ? `<div class="vf-pt"><i></i><span>${p[0]}${INFO(p[1])}</span></div>\n` : `<div class="vf-pt"><i></i><span>${p}</span></div>\n`);
const BENTO = ([icone, titre, texte, info, large]) => `<div class="vf-bento__b${large ? " vf-bento__b--l" : ""}${titre ? "" : " vf-bento__b--seul"}" data-ic="${icone}">` +
  (titre ? `<b>${titre}</b>` : "") + `<span>${texte}${info ? INFO(info) : ""}</span></div>\n`;
const PLACES = (k) => (k === "Single" ? "" : `<div class="vf-places"><span>Spots left</span><b>{{ places${k} }}</b></div>`);
const PAYER = (k, bouton, taille) => `<div class="vf-payer" onPointerEnter="{{ armer${k} }}">\n` +
  `<x-import component-from-global-scope="LoanDrouardDesignSystem_06a79c.Bouton" ton="sombre" taille="md" onClick="{{ pay${k} }}" hint-size="${taille}">${bouton}</x-import>\n</div>\n`;
const LIBRE = (k) => `<sc-if value="{{ libre${k} }}" hint-placeholder-val="{{ true }}">`;
// Carte de la planche II avant ce retour (après les corrections précédentes) : garde-fou, comme toute correction.
const ANCIENNES_PUCES = {
  Single: ["Written or voice feedback", "Technique, rhythm, jumps, transitions", "Grade A and C corrections"],
  Pack: ["Written or voice feedback", "Technique, rhythm, jumps, transitions", "Grade A and C corrections"],
  Prog: ["Renews every 3 months, cancel anytime", "Written or voice feedback", "Technique, rhythm, jumps, transitions", "Grade A and C corrections"],
};
const ANCIENS_TIERS = {
  Single: "",
  Pack: '<div class="vf-tier vf-tier--pack">\n<b>In the pack</b>\n' + ["Three analyses, whenever you need them", "Targeted exercises after each video",
    "Progress tracked from one video to the next", "Grade B suggestions on top", "Valid 6 months from your first video"].map(PUCE).join("") + "</div>\n",
  Prog: '<div class="vf-tier">\n<b>Also included</b>\n' + ["Targeted exercises after each video", "Progress tracked from one video to the next", "Grade B suggestions on top"].map(PUCE).join("") +
    '</div>\n<div class="vf-tier vf-tier--prog">\n<b>In the program</b>\n' + ["One analysis every single week", "Priorities set together each week",
    "Written check-ins whenever you need", "Final review, and a plan going forward"].map(PUCE).join("") + "</div>\n",
};
const ANCIENS_DELAIS = { Single: "Reply in 4 to 6 days", Pack: "Reply in 3 to 5 days", Prog: "Reply in 2 to 3 days" };
const CARTE_AVANT = (k, i) => { const [nom, quoi, taille] = FICHES[k].ancien;
  return LIBRE(k) + PLACES(k) + '\n<div class="vf-carte__tete">\n' + OFFRE_TITRE + `<div class="vf-nom">${nom}</div>\n` +
    `<div class="vf-prix">${OFFRE_PRIX(k)}<span class="vf-prix-t">{{ prix${k} }}<span class="vf-prix-d"> · ${quoi}</span></span></div>\n` +
    PAYER(k, BOUTONS[i][1], taille) + "</div>\n" + '<div class="vf-liste">\n' + ANCIENNES_PUCES[k].map(PUCE).join("") + "</div>\n" + ANCIENS_TIERS[k] +
    "</sc-if>\n</article>\n</div>\n" + DELAI(`libre${k}`, ANCIENS_DELAIS[k]); };
// 31/10 (Loan) : même structure et même ordre que les cartes du haut (nom, prix, bouton centré), puis la phrase d'accroche, une
// fine ligne de séparation et les puces. Version « épurée » choisie par Loan : sur ordinateur, ni paragraphe (il est sur les cartes
// du haut) ni rectangles dans la carte ; les rectangles sont à l'extérieur (à gauche de l'Analyse Technique, à droite du Suivi
// Performance ; Pack Évolution : place à décider, rien sur ordinateur). Carte ouverte sur mobile : tout, rectangles dessous.
const CARTE_APRES = (k, i) => { const f = FICHES[k];
  return LIBRE(k) + PLACES(k) + '\n<div class="vf-carte__tete">\n' + `<div class="vf-nom">${f.nom}</div>\n` +
    `<div class="vf-prix">${OFFRE_PRIX(k)}<span class="vf-prix-t">{{ prix${k} }}${f.par ? `<span class="vf-prix-d">${f.par}</span>` : ""}</span></div>\n</div>\n` +
    '<div class="vf-agir">\n' + PAYER(k, BOUTONS[i][1], f.ancien[2]) + "</div>\n" +
    '<div class="vf-details">\n' + `<p class="vf-accroche">${f.accroche}</p>\n` + '<div class="vf-sep" aria-hidden="true"></div>\n' +
    '<div class="vf-texte">\n' + f.textes.map((t) => `<p>${t}</p>\n`).join("") + "</div>\n" +
    '<div class="vf-liste">\n' + f.puces.map(PUCE).join("") + "</div>\n" +
    "</div>\n</sc-if>\n</article>\n</div>\n" +
    LIBRE(k) + `<div class="vf-bento" data-choisi="{{ choisi${k} }}">\n` + f.bento.map(BENTO).join("") + "</div></sc-if>\n"; };
// Cartes du haut (vitrine, 31/10) : les puces sont remplacées par le paragraphe de la formule, en bas de la carte.
const VITRINE_PUCES = {
  Single: ["Written or voice feedback"],
  Pack: ["Three analyses, progress tracked between them"],
  Prog: ["One analysis every week, priorities set together", "Renews automatically, cancel anytime"],
};
const VITRINE_PHRASE = { Single: FICHES.Single.textes[0], Pack: FICHES.Pack.textes[0], Prog: FICHES.Prog.textes[0] };
// « Tous les échanges se font sur WhatsApp » : sous les cartes (Loan, 31/10), au lieu d'en haut à gauche (ordinateur).
const WHATSAPP_AVANT = '</div>\n</div>\n<p class="vfk-note">';
const WHATSAPP_APRES = '</div>\n</div>\n<p class="vfk-whatsapp">All exchanges take place on WhatsApp.</p>\n<p class="vfk-note">';
const TITRE_PLANCHE = '<h2 class="vf-titre vfk-ecrit" style="transition-delay:.3s;font-size:clamp(32px,4.2vw,56px)">Three ways to work together.</h2>\n';
const LEDE_PLANCHE = (t) => `<p class="vf-lede vfk-ecrit" style="transition-delay:.7s;margin-inline:auto;text-align:center">${t}</p>`;
// Planche II sur ordinateur : les cartes entières à l'écran, sans défiler (Loan, 30/10). Les textes des cartes (--vfk-k, de 1 à
// 0,75) sont réduits juste assez (recherche par dichotomie : 7 essais, à chaque mesure) ; s'il manque encore de la place, réduction
// d'ensemble de la planche (jusqu'à 0,8, au lieu de 0,68). Au-delà, la page défile comme avant.
const ECHELLE_AVANT = "      /* Comme avant : tout tient sur un écran jusqu'au bas du 3× pack ; réduction d'ensemble si la hauteur manque. */\n" +
  "      if (enRang) {\n" +
  "        const pr = pin.getBoundingClientRect(), br = bloc.getBoundingClientRect(), bas = C[1].c.getBoundingClientRect().bottom;\n" +
  "        const s = borne((window.innerHeight - (br.top - pr.top) - 18) / Math.max(1, bas - br.top), 0.68, 1);\n";
const ECHELLE_APRES = "      /* Correction du 30/10 (scripts/construire.mjs) : les cartes entières à l'écran ; textes des cartes réduits juste assez\n" +
  "         (--vfk-k, 1 à 0,75), puis réduction d'ensemble si la hauteur manque encore (jusqu'à 0,8). 31/10 : avec les rectangles et la\n" +
  "         phrase « Tous les échanges se font sur WhatsApp » sous les cartes. */\n" +
  "      /* 31/10 (Loan : « tous les textes au même niveau ») : nom, prix, bouton et phrase d'accroche de même hauteur dans les 3 cartes (la plus\n" +
  "         haute), pour que bouton, ligne et puces commencent au même niveau ; recalculé à chaque taille de texte essayée. */\n" +
  "      const egaliser = () => { [\".vf-carte__tete .vf-nom\", \".vf-carte__tete .vf-prix\", \".vf-agir\", \".vf-details .vf-accroche\"].forEach((q) => {\n" +
  "        const g = C.map((k) => k.front.querySelector(q)).filter(Boolean); g.forEach((e) => { e.style.minHeight = \"\"; });\n" +
  "        if (enRang && g.length > 1) { const h = Math.max.apply(null, g.map((e) => e.offsetHeight)); g.forEach((e) => { e.style.minHeight = h + \"px\"; }); } });\n" +
  "        /* 01/11 (Loan) : rectangles du Pack Évolution au-dessus de la carte, dans sa largeur. Quand ils s'affichent, le titre et sa\n" +
  "           phrase remontent autant qu'il faut (--vfk-monte), même hors de l'écran : aucune place réservée, la taille du texte des\n" +
  "           cartes passe avant (Loan, 01/11). Seule exception, sur les petits écrans : si les rectangles sortaient par le haut de\n" +
  "           l'écran, les cartes descendent juste assez (bande au-dessus des cartes, souvent 0). 12 px d'air sous la phrase, 10 sur la carte. */\n" +
  "        const pb = C[1] && C[1].c.querySelector(\":scope > .vf-bento\"), rg = C[0] && C[0].c.parentNode;\n" +
  "        bloc.style.setProperty(\"--vfk-monte\", \"0px\"); if (rg) rg.style.marginTop = \"\";\n" +
  "        if (enRang && pb && rg) { const haut = C[1].c.getBoundingClientRect().top - pin.getBoundingClientRect().top - 10 - pb.offsetHeight;\n" +
  "          if (haut < 16) rg.style.marginTop = Math.ceil(16 - haut) + \"px\"; /* 16 : le léger zoom de la caméra (≈ 1,4 %) remonte les rectangles de quelques px */\n" +
  "          const besoin = pb.offsetHeight + 22, libre = C[1].c.getBoundingClientRect().top - tete.getBoundingClientRect().bottom;\n" +
  "          const monte = Math.max(0, Math.round(besoin - libre)); bloc.style.setProperty(\"--vfk-monte\", monte + \"px\");\n" +
  "          /* Une ligne qui sortirait en partie de l'écran s'efface en fondu (une ligne coupée ne fait pas soigné). */\n" +
  "          tete.querySelectorAll(\":scope > .vf-titre, :scope > .vf-lede\").forEach((e) => { const op = e.offsetParent;\n" +
  "            e.toggleAttribute(\"data-sort\", !!op && op.getBoundingClientRect().top + e.offsetTop - pin.getBoundingClientRect().top - monte < 28); }); } /* 28 : marge pour le zoom de la caméra */\n" +
  "        else tete.querySelectorAll(\"[data-sort]\").forEach((e) => e.removeAttribute(\"data-sort\")); };\n" +
  "      egaliser();\n" +
  "      if (enRang) {\n" +
  "        const pr = pin.getBoundingClientRect(), dispo = window.innerHeight - 16, wa = sec.querySelector(\".vfk-whatsapp\");\n" +
  "        const basC = () => { egaliser(); return Math.max.apply(null, C.map((k) => { const b = k.c.querySelector(\".vf-bento\"); return Math.max(k.c.getBoundingClientRect().bottom, b ? b.getBoundingClientRect().bottom : 0); }).concat(wa ? [wa.getBoundingClientRect().bottom] : [])) - pr.top; }; /* cartes, rectangles, phrase WhatsApp */\n" +
  '        let lo = 0.75, hi = 1; bloc.style.setProperty("--vfk-k", "1");\n' +
  '        if (basC() > dispo) { for (let i = 0; i < 7; i++) { const m = (lo + hi) / 2; bloc.style.setProperty("--vfk-k", m.toFixed(4)); if (basC() > dispo) hi = m; else lo = m; } bloc.style.setProperty("--vfk-k", lo.toFixed(4)); egaliser(); }\n' +
  "        const br = bloc.getBoundingClientRect(), bas = basC() + pr.top;\n" +
  "        const s = borne((dispo - (br.top - pr.top)) / Math.max(1, bas - br.top), 0.75, 1); /* 0,75 au plus (petits écrans, rectangles du Pack) */\n";
// Petites icônes des rectangles (provisoires : Loan les choisira plus tard) : traits fins, couleur or (masque CSS).
const PICTOS = {
  paiement: "<rect x='3' y='5.5' width='18' height='13' rx='2'/><path d='M3 10h18M7 15h3'/>",
  abonnement: "<path d='M19.5 10.5A7.5 7.5 0 0 0 6 7M4.5 13.5A7.5 7.5 0 0 0 18 17'/><path d='M5.5 3.5V7.5H9.5M18.5 20.5v-4h-4'/>",
  places: "<circle cx='12' cy='8' r='3.5'/><path d='M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5'/>",
  delai: "<circle cx='12' cy='12' r='8.5'/><path d='M12 7.5V12l3 2'/>",
  format: "<path d='M4.5 5.5h15v10h-8l-4.5 3.5v-3.5h-2.5z'/>",
  langue: "<circle cx='12' cy='12' r='8.5'/><path d='M3.5 12h17M12 3.5c2.4 2.4 3.6 5.3 3.6 8.5s-1.2 6.1-3.6 8.5c-2.4-2.4-3.6-5.3-3.6-8.5s1.2-6.1 3.6-8.5z'/>",
  envoi: "<rect x='3' y='6.5' width='12.5' height='11' rx='2'/><path d='M15.5 10.5l5-3v9l-5-3z'/>",
};
const ICONE_CSS = Object.entries(PICTOS).map(([k, d]) => `.vf-bento__b[data-ic="${k}"] { --ic: url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'>${d}</svg>`)}"); }`).join("\n");
const APERCU_DELAI = 0.45; // 01/11 : attente (s) avant l'aperçu des rectangles du Pack Évolution (non choisi) au survol
const K = (v) => `calc(var(--vfk-k, 1) * ${v})`; // taille ajustée pour que les cartes tiennent à l'écran (ECHELLE_APRES)
const CARTES_CSS_30 = `/* Corrections des 30 et 31/10 (scripts/construire.mjs) : cartes de la planche II avec la structure des cartes du haut (nom,
   prix, bouton centré), phrase d'accroche, fine ligne, puces ; rectangles « bento » à l'extérieur ; ⓘ ; « Launch offer » à côté de
   la réduction ; cartes du haut : paragraphe de la formule en bas, bouton centré. */
.vfk-tete .vf-lede { text-wrap: balance; }
.vf-remise-o { font-family: 'Cinzel', Georgia, serif; font-weight: 500; font-size: 10.5px; line-height: 1.2; letter-spacing: .2em; text-transform: uppercase; color: #C6A05E; }
@media (max-width: 899px) { .vfp-c .vf-remise-o { display: none; } } /* vitrine sur mobile : l'offre est sous « See the options » */
/* Cartes du haut : bouton centré, paragraphe de la formule en bas (caché sur mobile, comme les puces qu'il remplace). */
.vfp-c .vf-payer { align-self: center; }
.vfp-phrase { margin: 0; font-size: 18px; line-height: 1.45; color: rgba(246,245,241,.86); text-wrap: pretty; }
@media (max-width: 899px) { .vfp-c .vf-payer { flex-basis: 100%; justify-content: center; } }
/* Cartes du bas. */
.vfk-c .vf-carte__tete { min-height: 0; gap: 14px; }
.vfk-c .vf-remise { margin-bottom: 6px; }
.vf-agir { display: flex; justify-content: center; align-items: center; padding-top: 22px; } /* boutons centrés aussi en hauteur (hauteurs égalisées) */
.vf-agir .vf-payer { max-width: 100%; }
.vf-agir .ld-bouton { max-width: 100%; text-align: left; }
/* Phrase d'accroche : Cormorant SC (police des titres du design system), droite (pas d'italique : Loan, 31/10). */
.vf-accroche { margin: 22px 0 0; font-family: 'Cormorant SC', Georgia, serif; font-weight: 500; font-size: 19px; line-height: 1.35; letter-spacing: .01em; color: rgba(246,245,241,.94); text-wrap: pretty; }
/* Fine ligne de séparation, discrète, entre la phrase d'accroche et le contenu. */
.vf-sep { height: 1px; margin: 16px 6% 16px; background: linear-gradient(90deg, rgba(246,245,241,0), rgba(246,245,241,.22), rgba(246,245,241,0)); }
.vf-texte { display: grid; gap: 8px; margin-bottom: 14px; }
.vf-texte p { margin: 0; font-size: 17.5px; line-height: 1.5; color: rgba(246,245,241,.72); text-wrap: pretty; }
.vfk-c .vf-liste { gap: 14px; } /* plus d'espace entre les puces (Loan, 31/10) */
/* Bento : petites précisions, les unes sous les autres ; petite icône (provisoire) à côté du titre, texte dessous. */
.vf-bento { display: flex; flex-direction: column; gap: 6px; }
.vf-bento__b { display: grid; grid-template-columns: 15px minmax(0, 1fr); align-items: center; gap: 3px 7px; min-width: 0; padding: 9px 11px 10px; border: 1px solid rgba(246,245,241,.15); border-radius: 11px; background: rgba(24,23,21,.94); font-size: 14.5px; line-height: 1.3; color: rgba(246,245,241,.9); }
.vf-bento__b::before { content: ''; grid-row: 1; grid-column: 1; width: 15px; height: 15px; background: #C6A05E; -webkit-mask: var(--ic) 50% 50% / contain no-repeat; mask: var(--ic) 50% 50% / contain no-repeat; }
.vf-bento__b > b { grid-row: 1; grid-column: 2; font-family: 'Cinzel', Georgia, serif; font-weight: 500; font-size: 9px; line-height: 1.3; letter-spacing: .13em; text-transform: uppercase; color: rgba(246,245,241,.52); }
.vf-bento__b > span { grid-column: 1 / -1; }
.vf-bento__b--seul > span { grid-row: 1; grid-column: 2; font-family: 'Cinzel', Georgia, serif; font-weight: 500; font-size: 9.5px; line-height: 1.45; letter-spacing: .12em; text-transform: uppercase; color: #C6A05E; }
${ICONE_CSS}
/* « Tous les échanges se font sur WhatsApp » sous les cartes (ordinateur), quand les cartes sont retournées (comme la note). */
.vfk-whatsapp { display: none; }
/* ⓘ à la fin du texte, collé au dernier mot sans espace (élément en ligne : il ne passe jamais seul à la ligne ; écart = marge). */
.vf-i { cursor: pointer; outline: none; white-space: nowrap; -webkit-tap-highlight-color: transparent; }
.vf-i-o { position: relative; top: -.1em; margin-left: .3em; padding: 0 .4em; border: 1px solid rgba(198,160,94,.7); border-radius: 1em; font: italic 600 .78em/1 'Cormorant', Georgia, serif; letter-spacing: 0; text-transform: none; color: #C6A05E; transition: background-color .2s ease, color .2s ease; }
.vf-i:hover .vf-i-o, .vf-i[aria-expanded="true"] .vf-i-o { background: rgba(198,160,94,.22); color: #EBD3A0; }
.vf-i:focus-visible .vf-i-o { outline: 1px solid #A9814A; outline-offset: 2px; }
.vf-i-txt { display: none; }
/* La bulle est posée sur la page (INFO_JS), au-dessus de la ⓘ (dessous s'il n'y a pas la place). */
.vf-bulle-i { position: fixed; z-index: 1000; left: 0; top: 0; box-sizing: border-box; width: max-content; max-width: min(330px, calc(100vw - 24px)); padding: 12px 15px 13px; border: 1px solid rgba(198,160,94,.45); border-radius: 12px; background: #171614; box-shadow: 0 14px 36px rgba(0,0,0,.6), 0 0 30px -12px rgba(169,129,74,.5); color: rgba(246,245,241,.92); font: 400 16.5px/1.45 'Cormorant', Georgia, serif; text-align: left; pointer-events: none; opacity: 0; transform: translateY(4px); transition: opacity .18s ease, transform .18s ease; }
.vf-bulle-i[data-on] { opacity: 1; transform: none; }
.vf-bulle-i .vf-i-l { display: block; }
.vf-bulle-i .vf-i-l + .vf-i-l { margin-top: 8px; }
.vf-bulle-i b { display: block; margin-bottom: 3px; font: 500 10px/1.3 'Cinzel', Georgia, serif; letter-spacing: .14em; text-transform: uppercase; color: #C6A05E; }
.vf-bulle-i[data-notes] .vf-i-l { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: baseline; gap: 12px; }
.vf-bulle-i[data-notes] .vf-i-l + .vf-i-l { margin-top: 5px; }
.vf-bulle-i[data-notes] b { margin: 0; white-space: nowrap; }
@media (prefers-reduced-motion: reduce) { .vf-bulle-i, .vf-i-o, .vfk-c > .vf-bento, .vfk-whatsapp, .vfk-tete > :is(.vf-titre, .vf-lede) { transition: none !important; } }
/* Tailles des cartes, à la mesure de l'écran (Loan, 31/10) : les mêmes en haut (vitrine) et en bas (planche II) ; égales aux
   anciennes tailles fixes à 1440 px de large, plus grandes au-delà. */
@media (min-width: 900px) {
  .vf { --c-nom: clamp(28px, 2.7vw, 40px); --c-prix: clamp(20px, .25vw + 18.4px, 22.5px); /* prix plafonné : « 49 € · analyse complète » tient sur une ligne en haut */ --c-remise: clamp(16px, .4vw + 12.2px, 20px);
    --c-texte: clamp(16.5px, .55vw + 9.6px, 21px); --c-accroche: clamp(17.5px, .6vw + 10.4px, 22.5px); --c-bento: clamp(13.5px, .35vw + 9.5px, 16px); }
  .vfp-c .vf-nom { font-size: var(--c-nom); }
  .vfp-c .vf-prix { font-size: var(--c-prix); }
  .vfp-c .vf-remise { font-size: var(--c-remise); }
  .vfp-phrase { font-size: var(--c-texte); }
}
/* Ordinateur : titre sur une ligne, remonté ; surtitre à la verticale, à gauche de l'écran (Loan, 31/10) ; cartes au centre, de même
   hauteur ; une colonne de rectangles de chaque côté (place réservée) ; textes à la taille des cartes du haut, réduits juste assez
   pour que tout tienne à l'écran (--vfk-k : ECHELLE_APRES). */
@media (min-width: 1000px) {
  .vfk-bloc { position: relative; --vfk-w: clamp(118px, 8.6vw, 190px); --vfk-bord: max(60px, 3.9vw); }
  .vfk-contenu { padding-top: calc(var(--hauteur-header, 72px) + clamp(2px, 1svh, 14px)); }
  .vfk-tete { max-width: none; margin-bottom: clamp(12px, 2.2svh, 28px); }
  .vfk-tete .vf-titre { white-space: nowrap; font-size: clamp(30px, 3.3vw, 54px) !important; }
  .vfk-tete .vf-eyebrow { position: absolute; left: max(30px, 2.3vw); top: 58%; margin: 0 !important; font-size: clamp(11px, .2vw + 8.5px, 13.5px); white-space: nowrap; transform-origin: 0 0; transform: rotate(-90deg) translateX(-50%); }
  .vfk-tete .vf-eyebrow > span { max-width: none; white-space: nowrap; }
  .vfk-plaque span { display: none; } /* « Tous les échanges se font sur WhatsApp » : sous les cartes */
  .vfk-plaque { max-width: calc(18vw - 16px); }
  .vfk-whatsapp { display: block; margin: ${K("18px")} 0 0; text-align: center; font-style: italic; font-weight: 500; font-size: clamp(17px, .5vw + 10px, 21px); color: rgba(246,245,241,.7); opacity: 0; transition: opacity 1.2s ease; }
  .vfk-bloc:has(.vfk-note[data-on]) .vfk-whatsapp { opacity: 1; }
  @supports not selector(:has(*)) { .vfk-whatsapp { opacity: 1; } }
  .vfk-rang { --vfk-gap: clamp(28px, 2.6vw, 52px); width: min(1320px, 100vw - 2 * (var(--vfk-bord) + var(--vfk-w) + 16px)); gap: var(--vfk-gap); align-items: stretch; }
  .vfk-c { display: flex; flex-direction: column; }
  .vfk-flip { flex: 1 0 auto; display: flex; flex-direction: column; }
  .vfk-c .vf-carte { flex: 1 0 auto; display: flex; flex-direction: column; padding: max(${K("30px")}, 7cqw) max(26px, 8.6cqw) max(${K("26px")}, 6.4cqw); } /* marges à la mesure de la carte : les ornements du cadre grandissent avec elle */
  .vfk-c .vf-nom { font-size: ${K("var(--c-nom)")}; }
  .vfk-c .vf-carte__tete { gap: ${K("12px")}; }
  .vfk-c .vf-remise { margin-bottom: ${K("4px")}; font-size: ${K("var(--c-remise)")}; }
  .vfk-c .vf-prix { font-size: ${K("var(--c-prix)")}; }
  .vfk-c .vf-agir { padding-top: ${K("20px")}; }
  .vfk-c .vf-texte { display: none; } /* version épurée : le paragraphe est sur les cartes du haut */
  .vfk-c .vf-accroche { margin-top: ${K("22px")}; font-size: ${K("var(--c-accroche)")}; }
  .vfk-c .vf-sep { margin-top: ${K("16px")}; margin-bottom: ${K("16px")}; }
  .vfk-c .vf-liste { margin-top: 0; gap: ${K("14px")}; }
  .vfk-c .vf-pt { font-size: ${K("var(--c-texte)")}; line-height: 1.38; }
  .vfk-c .vf-pt i { margin-top: .7em; }
  /* Rectangles à l'extérieur : à gauche de l'Analyse Technique, à droite du Suivi Performance (Pack Évolution : à décider), seulement
     pour la carte choisie ; au survol d'une autre carte, les siens apparaissent presque transparents (un clic les affiche). */
  .vfk-c > .vf-bento { position: absolute; z-index: 2; top: 0; width: var(--vfk-w); opacity: 0; visibility: hidden; pointer-events: none; transition: opacity .35s ease, transform .35s ease, visibility 0s .35s; } /* cachés : ni clic ni clavier */
  .vfk-c[data-k="0"] > .vf-bento { right: calc(100% + 16px); transform: translateX(6px); }
  .vfk-c[data-k="2"] > .vf-bento { left: calc(100% + 16px); transform: translateX(-6px); }
  /* Pack Évolution (Loan, 31/10 et 01/11) : au-dessus de la carte, jamais plus large qu'elle ; compacts (icône et texte, deux par
     ligne, l'envoi sur toute la largeur ; le titre de chaque rectangle reste lu par les lecteurs d'écran). Quand ils s'affichent (clic,
     ou aperçu au survol), le titre et sa phrase remontent autant qu'il faut, même hors de l'écran (--vfk-monte : ECHELLE_APRES). */
  .vfk-c[data-k="1"] > .vf-bento { top: auto; bottom: calc(100% + 10px); left: 0; width: 100%; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 4px; align-items: stretch; transform: translateY(6px); }
  .vfk-c[data-k="1"] > .vf-bento .vf-bento__b { position: relative; padding: 4px 8px 5px; column-gap: 6px; font-size: 12px; line-height: 1.2; } /* compacts : ils tiennent au-dessus de la carte sans réduire le texte des cartes (Loan, 01/11) */
  .vfk-c[data-k="1"] > .vf-bento .vf-bento__b > b { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  .vfk-c[data-k="1"] > .vf-bento .vf-bento__b > span { grid-row: 1; grid-column: 2; }
  .vfk-c[data-k="1"] > .vf-bento .vf-bento__b--l { grid-column: 1 / -1; }
  .vfk-tete > .vf-titre { transition: -webkit-mask-position 1.8s cubic-bezier(.3,.6,.2,1), mask-position 1.8s cubic-bezier(.3,.6,.2,1), opacity .4s ease, transform .45s cubic-bezier(.2,.7,.2,1); transition-delay: .3s, .3s, 0s, 0s !important; }
  .vfk-tete > .vf-lede { transition: -webkit-mask-position 1.8s cubic-bezier(.3,.6,.2,1), mask-position 1.8s cubic-bezier(.3,.6,.2,1), opacity .4s ease, transform .45s cubic-bezier(.2,.7,.2,1); transition-delay: .7s, .7s, 0s, 0s !important; }
  .vfk-bloc:has(.vfk-c[data-k="1"][data-vu] > .vf-bento[data-choisi="oui"]) .vfk-tete > :is(.vf-titre, .vf-lede) { transform: translateY(calc(-1 * var(--vfk-monte, 0px))); }
  .vfk-bloc:has(.vfk-c[data-k="1"][data-vu] > .vf-bento[data-choisi="oui"]) .vfk-tete > [data-sort] { opacity: 0; }
  .vfk-c[data-vu] > .vf-bento[data-choisi="oui"] { opacity: 1; visibility: visible; pointer-events: auto; transform: none; transition-delay: 0s; }
  .vfk-c .vf-bento__b { font-size: max(12.5px, ${K("var(--c-bento)")}); }
}
/* 01/11 (Loan : « quand je passe la souris rapidement sur le Pack, on pourrait croire que ça bugue ») : l'aperçu du Pack Évolution au
   survol attend ${APERCU_DELAI} s que la souris reste sur la carte (rectangles et titre qui remonte) ; il disparaît sans attendre. Cartes de
   gauche et de droite : aperçu instantané, comme avant (Loan, 01/11). */
@media (min-width: 1000px) and (hover: hover) { .vfk-c[data-vu]:hover > .vf-bento[data-choisi="non"] { opacity: .55; visibility: visible; transform: none; transition-delay: 0s; } /* 31/10 : 20 % → 55 % (Loan : « on ne voit rien ») */
  .vfk-c[data-k="1"][data-vu]:hover > .vf-bento[data-choisi="non"] { transition-delay: ${APERCU_DELAI}s; }
  .vfk-bloc:has(.vfk-c[data-k="1"][data-vu]:hover > .vf-bento) .vfk-tete > :is(.vf-titre, .vf-lede) { transform: translateY(calc(-1 * var(--vfk-monte, 0px))); }
  .vfk-bloc:has(.vfk-c[data-k="1"][data-vu]:hover > .vf-bento[data-choisi="non"]) .vfk-tete > .vf-titre { transition-delay: .3s, .3s, ${APERCU_DELAI}s, ${APERCU_DELAI}s !important; }
  .vfk-bloc:has(.vfk-c[data-k="1"][data-vu]:hover > .vf-bento[data-choisi="non"]) .vfk-tete > .vf-lede { transition-delay: .7s, .7s, ${APERCU_DELAI}s, ${APERCU_DELAI}s !important; }
  .vfk-bloc:has(.vfk-c[data-k="1"][data-vu]:hover > .vf-bento) .vfk-tete > [data-sort] { opacity: 0; } }
/* Grands écrans : le titre monte dans la bande de l'en-tête (ses liens sont effacés dès qu'on descend ; le nom et les langues sont
   sur les côtés). En dessous de 1 100 px, il reste sous l'en-tête (il toucherait le nom). */
@media (min-width: 1100px) { .vfk-contenu { padding-top: clamp(16px, 2.6svh, 30px); } }
/* Mobile : petites cartes (nom et prix, bouton centré comme sur les autres cartes, « + » en haut à droite) ; tout le reste, et les
   rectangles dessous, dans la carte ouverte. */
@media (max-width: 999px) {
  .vfk .vfk-c:not([data-grand]) .vf-carte__tete::after { position: absolute; top: 18px; right: 18px; margin: 0; }
  ${MINI} .vf-details { display: none; }
  ${MINI} .vf-agir { padding-top: 14px; }
  .vfk-c:not([data-grand]) > .vf-bento { display: none; }
  .vfk-c[data-grand] > .vf-bento { flex: none; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; width: min(460px, 100%); margin-top: 14px; opacity: 0; transition: opacity .4s ease .25s; }
  .vfk-c[data-grand="on"] > .vf-bento { opacity: 1; }
  .vfk-c[data-grand] .vf-bento__b--l { grid-column: 1 / -1; }
}
@media (max-width: 359px) { .vfk-c[data-grand] > .vf-bento { grid-template-columns: minmax(0, 1fr); } }
/* Carte ouverte (mobile, Loan, 31/10 : « on voit un bout de l'autre bouton en fond ») : sous la barre flottante de Safari (iOS 26), la
   page derrière restait visible. Les autres cartes et les traits sont cachés une fois le fond sombre posé (0,5 s), et réapparaissent
   dès la fermeture ; le fond sombre déborde de l'écran. */
@media (max-width: 999px) {
  .vfk[data-grand] .vfk-cam { visibility: hidden; transition: visibility 0s .5s; }
  .vfk[data-grand] .vfk-c[data-grand] { visibility: visible; }
  .vfk:has(.vfk-c[data-grand="ferme"]) .vfk-cam { visibility: visible; transition: none; }
  .vfk .vfk-c[data-grand]::before { inset: -30vh 0; }
}
/* Moins de 375 px (vitrine et petites cartes) : noms et boutons un peu resserrés ; « Performance » ne touche plus « Voir tous les
   détails », et les cartes de la vitrine grandissent moins. */
@media (max-width: 374px) {
  :is(.vfp-c, ${MINI}) .vf-nom { font-size: 21px; }
  :is(.vfp-c, ${MINI}) .ld-bouton { padding-left: 16px; padding-right: 18px; letter-spacing: .05em; }
}
`;
const EGALISER_JS = `<script>/* Correction du 31/10 (scripts/construire.mjs) : cartes du haut (vitrine), sur ordinateur : nom, prix et paragraphe de
   même hauteur dans les 3 cartes (la plus haute), pour que tous les textes soient au même niveau. Recalculé quand une carte change de
   taille (fenêtre, polices). */
(() => { if (window.__ldEgal) return; window.__ldEgal = 1;
  const mq = window.matchMedia("(min-width: 900px)"), GROUPES = [".vfp-c .vf-carte__tete .vf-nom", ".vfp-c .vf-carte__tete .vf-prix", ".vfp-c .vfp-phrase"];
  const egaliser = () => GROUPES.forEach((q) => { const g = [...document.querySelectorAll(q)]; g.forEach((e) => { e.style.minHeight = ""; });
    if (mq.matches && g.length > 1) { const h = Math.max(...g.map((e) => e.offsetHeight)); g.forEach((e) => { e.style.minHeight = h + "px"; }); } });
  /* Chaque élément est observé (taille) ; les cartes aussi (contenu recréé par le moteur de la page) : égalisation à l'image suivante. */
  let ro = null, raf = 0;
  const plus_tard = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; egaliser(); if (ro) GROUPES.forEach((q) => document.querySelectorAll(q).forEach((e) => ro.observe(e))); }); };
  /* Toute la page est surveillée (et pas seulement les cartes du haut) : le moteur peut recréer tout le bloc des cartes. */
  const brancher = () => { if (!document.body) return false;
    if (window.ResizeObserver) ro = new ResizeObserver(plus_tard);
    const vitrine = (n) => { const e = n && (n.nodeType === 1 ? n : n.parentElement); return !!e && (!!e.closest(".vfp-cartes") || (e.querySelector && !!e.querySelector(".vfp-c"))); };
    if (window.MutationObserver) new MutationObserver((l) => { if (l.some((r) => vitrine(r.target) || [...r.addedNodes].some(vitrine))) plus_tard(); })
      .observe(document.body, { childList: true, subtree: true, characterData: true }); /* seulement ce qui touche les cartes du haut */
    plus_tard(); return true; };
  if (!brancher()) document.addEventListener("DOMContentLoaded", brancher);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(plus_tard);
  if (mq.addEventListener) mq.addEventListener("change", plus_tard);
  addEventListener("resize", plus_tard);
  document.addEventListener("click", plus_tard, true); /* « See the options » : cartes affichées */
})();
</script>
`;
const INFO_JS = `<script>/* Correction du 30/10 (scripts/construire.mjs) : bulles ⓘ des cartes. Souris : au survol (un clic la garde ouverte) ;
   toucher : un toucher l'ouvre ou la ferme ; clavier : au focus, Entrée ou Espace. Échap ou un clic ailleurs la ferme ; elle suit
   la ⓘ quand la page défile (fermée si la ⓘ sort de l'écran). La bulle est posée sur la page, hors des cartes (elles coupent ce
   qui dépasse, s'inclinent et sont parfois réduites). */
(() => { if (window.__ldInfo) return; window.__ldInfo = 1;
  let bulle = null, cible = null, doigt = false, tPointeur = 0, raf = 0;
  const trouver = (e) => (e.target && e.target.closest ? e.target.closest(".vf-i") : null);
  const placer = () => {
    const o = cible.querySelector(".vf-i-o") || cible, q = o.getBoundingClientRect(), b = bulle.getBoundingClientRect(), m = 12;
    let y = q.top - b.height - 10; if (y < m) y = q.bottom + 10;
    bulle.style.left = Math.round(Math.max(m, Math.min(innerWidth - b.width - m, q.left + q.width / 2 - b.width / 2))) + "px";
    bulle.style.top = Math.round(y) + "px";
  };
  const ouvrir = (b) => {
    const src = document.getElementById(b.getAttribute("aria-describedby")); if (!src) return;
    if (cible && cible !== b) cible.setAttribute("aria-expanded", "false");
    if (!bulle) { bulle = document.createElement("div"); bulle.className = "vf-bulle-i"; bulle.setAttribute("aria-hidden", "true"); document.body.appendChild(bulle); }
    cible = b; b.setAttribute("aria-expanded", "true");
    bulle.innerHTML = src.innerHTML; bulle.toggleAttribute("data-notes", src.getAttribute("data-genre") === "notes");
    bulle.style.left = bulle.style.top = "0px"; placer(); bulle.setAttribute("data-on", "");
  };
  const fermer = () => { if (!cible) return; cible.setAttribute("aria-expanded", "false"); cible = null; if (bulle) bulle.removeAttribute("data-on"); };
  document.addEventListener("pointerdown", (e) => { doigt = e.pointerType !== "mouse"; tPointeur = performance.now(); }, true);
  document.addEventListener("click", (e) => {
    const b = trouver(e);
    if (!b) { fermer(); return; }
    if (!doigt && e.detail) { if (cible !== b) ouvrir(b); return; }
    if (cible === b) fermer(); else ouvrir(b);
  });
  document.addEventListener("pointerover", (e) => { if (e.pointerType !== "mouse") return; const b = trouver(e); if (b && b !== cible) ouvrir(b); });
  document.addEventListener("pointerout", (e) => { if (e.pointerType !== "mouse") return; const b = trouver(e); if (b && b === cible && !b.contains(e.relatedTarget) && document.activeElement !== b) fermer(); });
  document.addEventListener("focusin", (e) => { const b = trouver(e); if (b && (b.matches(":focus-visible") || performance.now() - tPointeur > 500)) ouvrir(b); });
  document.addEventListener("focusout", (e) => { const b = trouver(e); if (b && b === cible) fermer(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { fermer(); return; }
    const b = trouver(e); if (b && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); if (cible === b) fermer(); else ouvrir(b); }
  });
  const suivre = () => { if (!cible || raf) return; raf = requestAnimationFrame(() => { raf = 0; if (!cible) return; const q = cible.getBoundingClientRect();
    if (!document.contains(cible) || !q.width || q.bottom < 0 || q.top > innerHeight) fermer(); else placer(); }); };
  addEventListener("scroll", suivre, { passive: true, capture: true });
  addEventListener("resize", suivre);
  document.addEventListener("ld-loupe", suivre); /* 01/11 : la bulle suit sa ⓘ pendant que la ligne grossit (LOUPE_JS) */
})();
</script>
`;
// 01/11 (Loan) : effet « Dock de macOS » sur les puces des cartes de la planche II (ordinateur, souris), pour rendre le texte des
// cartes, assez petit, plus lisible : la ligne sous la souris grossit et pousse les autres, ses voisines grossissent un peu.
// Second retour du 01/11 : le texte grossit sans changer de lignes (zoom, pas de nouvelle mise en page) ; même agrandissement dans les
// 3 cartes ; le texte peut sortir de sa place habituelle tant qu'il reste dans la carte. Une ligne qui garde ses retours à la ligne
// s'élargit d'autant : la largeur de la carte décide de l'agrandissement (≈ ×1,17 : les lignes les plus longues occupent déjà toute
// la largeur ; marges de la carte utilisées jusqu'à 6 px du bord). Troisième retour du 01/11 (« comme le Dock, grossissement et
// rétrécissement continus entre les lignes ») : la taille de chaque puce dépend en continu de la distance entre la souris et la puce
// (pleine taille sur toutes ses lignes, puis décroissance douce sur ≈ 3 lignes de texte). Quatrième retour du 01/11 (« des petits
// haut-bas en permanence sur tout le texte ») : le haut de la liste reste fixe, seules les lignes sous la partie agrandie sont poussées
// vers le bas. Rien ne bouge dans la mise en page (cartes, bas de page) : seulement des zooms et des déplacements, à chaque image.
const LOUPE = { max: 1.3, portee: 3, tau: 55, lacher: 150, bord: 6 }; // ×1,3 au plus ; portée : 3 lignes de texte ; amorti 55 ms (150 ms quand la souris s'en va) ; 6 px du bord
const LOUPE_CSS = `/* Correction du 01/11 (scripts/construire.mjs) : effet loupe des puces des cartes (LOUPE_JS). */
.vfk-c .vf-liste[data-loupe] > .vf-pt { position: relative; z-index: 1; } /* devant le cadre de la carte */
/* Le cadre garde tout son éclat (Loan, 01/11 : « la carte perd de sa brillance » quand il s'atténuait) ; là où une ligne agrandie passe
   sur ses petits médaillons (haut de la liste), un léger halo sombre autour des lettres les garde lisibles (invisible sur le fond). */
.vfk-c .vf-liste[data-loupe] > .vf-pt { text-shadow: 0 0 3px rgba(20,19,17,.95), 0 0 7px rgba(20,19,17,.8); }
`;
const LOUPE_JS = `<script>/* Correction du 01/11 (scripts/construire.mjs) : effet loupe façon Dock de macOS sur les puces des cartes de la planche II
   (ordinateur, souris). La taille de chaque puce suit en continu la distance à la souris ; le haut de la liste reste fixe, les lignes
   sous la partie agrandie sont poussées vers le bas. Zoom sans nouvelle mise en page : chaque puce garde ses retours à la
   ligne, la carte et la page ne bougent pas. Même agrandissement dans les 3 cartes : le plus grand qui garde toutes les lignes dans la
   carte (${LOUPE.bord} px du bord au moins), ×${LOUPE.max} au plus. */
(() => { if (window.__ldLoupe) return; window.__ldLoupe = 1;
  const mq = matchMedia("(min-width: 1000px) and (hover: hover) and (pointer: fine)"), calme = matchMedia("(prefers-reduced-motion: reduce)");
  const MAX = ${LOUPE.max}, PORTEE = ${LOUPE.portee}, TAU = ${LOUPE.tau}, TAU_LACHER = ${LOUPE.lacher}, BORD = ${LOUPE.bord}, LISTES = ".vfk-c .vf-details .vf-liste";
  const etats = new Map(); /* liste → { f (mesures), c (zoom actuel de chaque puce), y (point sous la souris), g (décalage d'ensemble) } */
  let commun = null, active = null, py = 0, raf = 0, tPrec = 0;
  const puces = (l) => Array.prototype.filter.call(l.children, (e) => e.classList.contains("vf-pt"));
  /* Effet (1 à 0) d'une puce selon la distance (px) entre la souris et ses lignes : décroissance douce (cos²) sur R px. */
  const effet = (d, R) => (d >= R ? 0 : Math.pow(Math.cos(Math.PI / 2 * d / R), 2));
  const distance = (f, j, y) => Math.max(0, f.top[j] + f.a[j] - y, y - (f.top[j] + f.h[j] - f.a[j]));
  const zoom = (f, j, y) => 1 + (commun.S - 1) * effet(distance(f, j, y), f.R);
  const croissance = (f, y) => f.p.reduce((t, _, j) => t + f.h[j] * (zoom(f, j, y) - 1), 0);
  /* Mesures au repos, en px de mise en page, des 3 listes ensemble (même agrandissement partout) ; refaites si la largeur ou la taille
     du texte change. Ligne la plus large de chaque puce : rectangles du texte, ramenés en px de mise en page (zoom de la caméra). */
  const mesurer = () => {
    const ls = Array.prototype.slice.call(document.querySelectorAll(LISTES)).filter((l) => puces(l).length && l.offsetWidth);
    if (!ls.length) return null;
    const cle = ls.map((l) => l.clientWidth + "|" + getComputedStyle(puces(l)[0]).fontSize + "|" + puces(l).length).join(";");
    if (commun && commun.cle === cle && commun.ls.every((l, i) => l === ls[i]) && Array.from(commun.fiches.values()).every((f) => f.p.every((e) => e.isConnected))) return commun;
    let S = MAX; const fiches = new Map();
    ls.forEach((l) => {
      const carte = l.closest(".vf-carte"); if (!carte) return;
      const p = puces(l), W = l.clientWidth, cc = getComputedStyle(carte), pg = parseFloat(cc.paddingLeft) || 0, pd = parseFloat(cc.paddingRight) || 0, pb = parseFloat(cc.paddingBottom) || 0;
      const lr = l.getBoundingClientRect(), k = lr.width / (l.offsetWidth || 1) || 1;
      const larg = p.map((e) => { let d = 0, n; const tw = document.createTreeWalker(e, NodeFilter.SHOW_TEXT);
        while ((n = tw.nextNode())) { if (!n.textContent.trim() || n.parentElement.closest(".vf-i-txt")) continue;
          const r = document.createRange(); r.selectNodeContents(n); const q = r.getClientRects(); for (let i = 0; i < q.length; i++) d = Math.max(d, q[i].right - lr.left); }
        const io = e.querySelector(".vf-i-o"); if (io) d = Math.max(d, io.getBoundingClientRect().right - lr.left);
        return Math.min(W, Math.max(1, d / k)); });
      /* Place de chaque côté : marges de la carte jusqu'à BORD px du bord ; à droite, aussi ce que la ligne la plus large laisse libre. */
      const G = Math.max(0, pg - BORD), D = (x) => Math.max(0, W - x + pd - BORD);
      larg.forEach((x) => { S = Math.min(S, 1 + (G + D(x)) / x); });
      let haut = 0; for (let e = l; e && e !== carte; e = e.offsetParent) haut += e.offsetTop;
      let prec = l.previousElementSibling; while (prec && !prec.getClientRects().length) prec = prec.previousElementSibling; /* élément affiché au-dessus (le paragraphe est caché sur ordinateur) */
      const H0 = l.offsetHeight, L = parseFloat(getComputedStyle(p[0]).lineHeight) || 20;
      const h = p.map((e) => e.offsetHeight), top = p.map((e) => e.offsetTop - l.offsetTop);
      fiches.set(l, { l, carte, p, h, top, H0, R: PORTEE * L, g0: p.length > 1 ? top[1] - top[0] - h[0] : 0,
        a: h.map((x) => Math.min(x / 2, L / 2)), /* pleine taille tant que la souris est sur une des lignes de la puce */
        ox: larg.map((x) => { const g = G, d = D(x); return g + d > 0 ? x * g / (g + d) : x / 2; }), /* la place est partagée à gauche et à droite */
        bas: Math.max(0, carte.clientHeight - haut - H0 - Math.max(BORD, pb * 0.3)), /* place sous la liste, jusqu'à la marge du bas */
        dessus: prec ? Math.max(0, l.offsetTop - prec.offsetTop - prec.offsetHeight - 7) : 0 });
    });
    commun = { cle, ls, S: Math.max(1, S), fiches };
    /* Croissance moyenne de chaque liste quand la souris la parcourt : les lignes éloignées sont poussées de cette valeur, fixe. */
    fiches.forEach((f) => { const n = f.p.length, y0 = f.top[0] + f.a[0], y1 = f.top[n - 1] + f.h[n - 1] - f.a[n - 1]; let somme = 0, nb = 0;
      for (let y = y0; y <= y1; y += 2) { somme += croissance(f, y); nb++; } f.Gm = nb ? somme / nb : 0; f.y0 = y0; f.y1 = y1; });
    return commun;
  };
  /* Position de chaque puce : le haut de la liste ne bouge pas ; chaque puce est poussée vers le bas par l'agrandissement de celles du
     dessus (4e retour du 01/11 : avec le point sous la souris fixe, tout le texte montait et descendait sans cesse en déplaçant la souris). */
  const positions = (s) => { const f = s.f, t = []; let bas = 0; f.p.forEach((_, j) => { t[j] = bas + s.g; bas += f.h[j] * (s.c[j] - 1) + (s.e[j] || 0); }); return { t, croissance: bas - (s.e[f.p.length - 1] || 0) }; };
  const appliquer = (s) => {
    const f = s.f;
    /* Décalage d'ensemble, seulement si la place manque sous la liste (bas de la carte) : la liste remonte juste assez, sans toucher la
       ligne fine au-dessus. */
    s.g = 0; const { croissance } = positions(s); s.g = Math.max(-f.dessus, Math.min(0, f.bas - croissance));
    const { t } = positions(s);
    f.p.forEach((e, j) => { const c = s.c[j];
      if (Math.abs(c - 1) < 0.0005 && Math.abs(t[j]) < 0.05) { e.style.transform = ""; return; }
      e.style.transformOrigin = f.ox[j].toFixed(1) + "px 0";
      e.style.transform = "translateY(" + t[j].toFixed(2) + "px) scale(" + c.toFixed(4) + ")"; });
  };
  /* Point de la liste au repos qui est affiché sous la souris (Y : px de mise en page depuis le haut de la liste) : dans une puce agrandie,
     on divise par son zoom ; entre deux puces, l'espace n'est pas agrandi. Ainsi la puce sous la souris est bien celle qui grossit. */
  const auRepos = (s, Y) => {
    const f = s.f, n = f.p.length, { t } = positions(s);
    if (Y < f.top[0] + t[0]) return Y - t[0];
    for (let j = 0; j < n; j++) { const haut = f.top[j] + t[j], hauteur = f.h[j] * s.c[j];
      if (Y <= haut + hauteur) return f.top[j] + Math.max(0, Y - haut) / s.c[j];
      if (j === n - 1) return f.top[j] + f.h[j] + (Y - haut - hauteur);
      if (Y < f.top[j + 1] + t[j + 1]) { const e = f.top[j + 1] + t[j + 1] - haut - hauteur; return f.top[j] + f.h[j] + (e > 0.01 ? (Y - haut - hauteur) * f.g0 / e : 0); } }
    return Y;
  };
  const finir = (l, s) => { s.f.p.forEach((e) => { e.style.transform = e.style.transformOrigin = ""; }); l.removeAttribute("data-loupe");
    etats.delete(l); };
  const image = (t) => {
    raf = 0; const dt = tPrec ? Math.min(250, t - tPrec) : 16; tPrec = t;
    if (active && commun && commun.fiches.has(active) && !etats.has(active)) { const f = commun.fiches.get(active);
      etats.set(active, { f, c: f.p.map(() => 1), e: f.p.map(() => 0), y: 0, g: 0 }); active.setAttribute("data-loupe", ""); }
    let encore = false;
    etats.forEach((s, l) => { const f = s.f;
      if (l === active) { const r = l.getBoundingClientRect(), kY = r.height / (f.H0 || 1) || 1; s.y = auRepos(s, (py - r.top) / kY); } /* point de la liste (au repos) sous la souris */
      const vise = f.p.map((_, j) => (l === active ? zoom(f, j, s.y) : 1));
      /* Écarts entre puces sous la souris : ils absorbent la différence entre la croissance réelle et la croissance moyenne, pour que les
         lignes éloignées restent immobiles pendant qu'on parcourt la liste (sans cela, elles montaient et descendaient à chaque puce,
         les puces n'ayant pas toutes la même hauteur). L'écart d'une puce agrandie n'est pas touché ; 40 % à 200 % de l'écart normal. */
      const ecarts = f.p.map(() => 0);
      if (l === active && f.g0 > 0) { const n = f.p.length, A = effet(Math.max(0, f.y0 - s.y, s.y - f.y1), f.R);
        const reste = A * f.Gm - vise.reduce((t, c, j) => t + f.h[j] * (c - 1), 0), poids = f.p.map((_, j) => (j < n - 1 && f.top[j + 1] > s.y ? 1 - effet(distance(f, j + 1, s.y), f.R) : 0));
        const W = Math.max(1, poids.reduce((t, x) => t + x, 0)); /* moins d'un écart libre sous la souris (bas de la liste) : compensation partielle, qui s'éteint en douceur */
        poids.forEach((w, j) => { ecarts[j] = Math.max(-0.6 * f.g0, Math.min(f.g0, reste * w / W)); }); }
      const a = calme.matches ? 1 : 1 - Math.exp(-dt / (l === active ? TAU : TAU_LACHER));
      let bouge = false; s.c = s.c.map((c, j) => { const e = vise[j] - c; if (Math.abs(e) < 0.0015) return vise[j]; bouge = true; return c + e * a; });
      s.e = s.e.map((x, j) => { const e = ecarts[j] - x; if (Math.abs(e) < 0.05) return ecarts[j]; bouge = true; return x + e * a; });
      appliquer(s); if (bouge) encore = true; else if (l !== active && vise.every((x) => x === 1)) finir(l, s); });
    document.dispatchEvent(new Event("ld-loupe")); /* la bulle ⓘ suit sa ligne */
    if (encore) raf = requestAnimationFrame(image); else tPrec = 0; /* tout est arrivé : on attend le prochain mouvement de la souris */
  };
  const relancer = () => { if (!raf) raf = requestAnimationFrame(image); };
  const lacher = () => { if (active) { active = null; relancer(); } };
  /* Liste active : celle de la carte où se trouve la souris (en largeur), quand la souris est à moins de la portée de ses lignes (en
     hauteur, même un peu sous la carte) : l'effet commence et finit en douceur, sans dépendre du bord de la carte (qui s'incline). */
  document.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    if (!mq.matches) { if (active) lacher(); return; }
    if (!etats.size && e.target && e.target.closest && e.target.closest(".vfk-c .vf-carte")) mesurer(); /* au repos seulement : les mesures lisent la mise en page sans zoom */
    let n = null;
    if (commun) commun.fiches.forEach((f, l) => { if (n) return; const cr = f.carte.getBoundingClientRect(); if (e.clientX < cr.left || e.clientX > cr.right) return;
      const r = l.getBoundingClientRect(), m = f.R * r.height / (f.H0 || 1); if (e.clientY > r.top - m && e.clientY < r.bottom + m) n = l; });
    if (n !== active || n) { active = n; py = e.clientY; relancer(); }
  }, { passive: true });
  addEventListener("scroll", () => { if (active) relancer(); }, { passive: true, capture: true }); /* la page défile sous la souris immobile */
  document.addEventListener("pointerout", (e) => { if (e.pointerType === "mouse" && !e.relatedTarget) lacher(); }); /* sortie de la fenêtre */
  addEventListener("blur", lacher);
  /* Changement de taille de la fenêtre : retour immédiat à la normale, mesures à refaire. */
  addEventListener("resize", () => { active = null; etats.forEach((s, l) => finir(l, s)); commun = null; });
})();
</script>
`;
// 01/11 (Loan : « la ⓘ de Quarterly subscription sort ») : aucun texte des rectangles (bento) ne dépasse de son rectangle. Un texte trop
// large (mot long et sa ⓘ, toujours collée au dernier mot) se réduit juste assez ; s'il fallait le réduire de plus de 12 %, le texte
// doré seul passe d'abord sous l'icône à partir de sa 2e ligne (« Quarterly subscription » entre 1000 et 1600 px de large). Même chose
// pour les titres des rectangles (« Turnaround » dépassait de 7 px entre 1000 et 1370 px).
const BENTO_CSS = `/* Correction du 01/11 (scripts/construire.mjs) : texte doré seul trop large : 2e ligne sous l'icône (BENTO_JS). */
.vf-bento__b--seul[data-flottant] { display: flow-root; }
.vf-bento__b--seul[data-flottant]::before { display: block; float: left; margin: 0 7px -2px 0; }
`;
const BENTO_JS = `<script>/* Correction du 01/11 (scripts/construire.mjs) : un texte de rectangle (titre ou texte doré) plus large que son rectangle
   (mot long et sa ⓘ) se réduit juste assez ; au-delà de 12 %, le texte doré seul passe d'abord sous l'icône dès sa 2e ligne. Refait quand
   un rectangle change de taille (fenêtre, polices, carte ouverte sur mobile). */
(() => { if (window.__ldBento) return; window.__ldBento = 1;
  const suivis = new WeakSet();
  const droite = (e) => { let d = -Infinity, n; const tw = document.createTreeWalker(e, NodeFilter.SHOW_TEXT);
    while ((n = tw.nextNode())) { if (!n.textContent.trim() || n.parentElement.closest(".vf-i-txt")) continue;
      const g = document.createRange(); g.selectNodeContents(n); const q = g.getClientRects(); for (let i = 0; i < q.length; i++) d = Math.max(d, q[i].right); }
    const io = e.querySelector(".vf-i-o"); if (io) d = Math.max(d, io.getBoundingClientRect().right); return d; };
  /* Largeur nécessaire (droite du texte) et début de l'élément, depuis le bord gauche du contenu du rectangle, en px de mise en page. */
  const mesure = (r, e, pg) => { const rr = r.getBoundingClientRect(), k = rr.width / r.offsetWidth || 1;
    return { b: (droite(e) - rr.left) / k - pg, off: Math.max(0, (e.getBoundingClientRect().left - rr.left) / k - pg) }; };
  const ajuster = (r) => {
    if (!r.offsetWidth) return;
    const cs = getComputedStyle(r), pg = parseFloat(cs.paddingLeft) + parseFloat(cs.borderLeftWidth), dispo = r.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const seul = r.classList.contains("vf-bento__b--seul");
    Array.prototype.forEach.call(r.children, (e) => {
      if (e.tagName !== "B" && !(e.tagName === "SPAN" && seul)) return;
      e.style.fontSize = ""; if (getComputedStyle(e).position === "absolute") return; /* titres lus seulement par les lecteurs d'écran */
      if (seul) { r.removeAttribute("data-flottant"); const m = mesure(r, e, pg);
        if (m.b > dispo + 0.3 && (dispo - m.off) / (m.b - m.off) < 0.88) r.setAttribute("data-flottant", ""); }
      for (let i = 0; i < 4; i++) { const m = mesure(r, e, pg); if (!(m.b > dispo + 0.3)) break;
        e.style.fontSize = parseFloat(getComputedStyle(e).fontSize) * Math.max(0.8, (dispo - m.off) / Math.max(1, m.b - m.off)) * 0.99 + "px"; }
    });
  };
  const ro = window.ResizeObserver ? new ResizeObserver((l) => l.forEach((x) => ajuster(x.target))) : null;
  const tous = () => document.querySelectorAll(".vf-bento__b").forEach((r) => { if (ro && !suivis.has(r)) { suivis.add(r); ro.observe(r); } else if (!ro) ajuster(r); });
  let attente = 0; const plus_tard = () => { if (!attente) attente = requestAnimationFrame(() => { attente = 0; if (document.querySelector(".vf-bento__b")) tous(); }); };
  new MutationObserver(plus_tard).observe(document.documentElement, { childList: true, subtree: true });
  const refaire = () => document.querySelectorAll(".vf-bento__b").forEach(ajuster);
  if (document.fonts) { document.fonts.ready.then(refaire); if (document.fonts.addEventListener) document.fonts.addEventListener("loadingdone", refaire); }
  if (!ro) addEventListener("resize", refaire);
  plus_tard();
})();
</script>
`;

// CGV du 30/10 (demandées par Loan : « adapte les CGV, ajoute ce qu'il faut ») : nouveaux noms et contenu des formules
// (textes des cartes), déduction de l'Analyse Technique sur le Pack (30 jours), Suivi Performance limité à 3, envoi de 2 vidéos de
// 2 min ou 3 de 45 s, jusqu'à 2 semaines reportables, réponse sous 48 à 72 h, résiliation aussi par message, conseils de
// tournage, retour par vidéo pour le Suivi Performance. [passage actuel, nouveau passage, occurrences].
const DEDUCTION_EN = "<p><strong>Technical Analysis deducted from the Pack.</strong> If you order the Progression Pack within 30 days of a Technical Analysis, the price you paid for that Technical Analysis is deducted: I refund it to you within 14 days of the Pack payment, using the payment method you used for the Technical Analysis.</p>";
const DEDUCTION_FR = "<p><strong>Analyse Technique déduite du Pack.</strong> Si vous prenez le Pack Évolution dans les 30 jours qui suivent une Analyse Technique, le prix payé pour cette Analyse Technique est déduit : je vous le rembourse dans les 14 jours suivant le paiement du Pack, sur le moyen de paiement utilisé pour l’Analyse Technique.</p>";
const CGV_30 = [
  // Anglais.
  ["I watch your video and reply with a full analysis, written or by voice message: technique, rhythm, jumps, transitions, with corrections ranked by priority.",
    "I analyze your videos based on your level and your goals, and reply in writing or by voice message (also by video for The Way of Performance): your strengths, technique, jumps, rhythm, transitions, with corrections ranked by priority."],
  ["<h3>Single feedback — 99&nbsp;€</h3>\n<p>A full analysis of one routine.</p>",
    "<h3>Technical Analysis — 99&nbsp;€</h3>\n<p>2 videos analyzed (your taolu, your jumps or a specific section): your strengths, your priority corrections and specific advice, mainly on the A and C scores.</p>"],
  ["<h3>3× feedback pack — 249&nbsp;€</h3>\n<p>Three analyses, sent whenever you need them, with targeted exercises after each video and progress tracked from one video to the next. Valid 6 months from your first video.</p>",
    "<h3>Progression Pack — 249&nbsp;€</h3>\n<p>6 videos analyzed across 3 feedback rounds of 2 videos each, spaced out to fit your pace: a detailed analysis of each video, explained corrections and targeted drills after each round, progress tracked from one round to the next, and advice on the B score in addition to the A and C scores. Valid 6 months from your first video.</p>\n" + DEDUCTION_EN],
  ["<h3>Quarterly program — 990&nbsp;€ every 3 months (subscription)</h3>\n<p>One analysis every week, priorities set together, written check-ins whenever you need them, then a final review with a plan going forward.",
    "<h3>The Way of Performance — 990&nbsp;€ every 3 months (subscription)</h3>\n<p>One-on-one coaching over 12 weeks: 24 personalized analyses (2 videos per week), key areas defined at the start of the quarter, weekly tracking of your corrections and progress, priorities set at each feedback, Q&amp;A on WhatsApp after each feedback, then a final review with recommendations for what comes next. Feedback in writing, by voice message or by video, with priority handling."],
  ["the pack is limited to 6 clients at the same time and the program to 2.", "the pack is limited to 6 clients at the same time and The Way of Performance to 3."],
  ["Per analysis: up to 3 videos under 30 seconds, or 2 videos under 2 minutes.", "Per feedback: 2 videos of up to 2 minutes each, or 3 videos of up to 45 seconds each."],
  ["I reply on WhatsApp, in writing or by voice message, within the time given in article 7.", "I reply on WhatsApp, in writing or by voice message (also by video for The Way of Performance), within the time given in article 7."],
  ["<li>Single feedback: 99&nbsp;€ · 3× feedback pack: 249&nbsp;€ · Quarterly program: 990&nbsp;€ per 3-month period.</li>",
    "<li>Technical Analysis: 99&nbsp;€ · Progression Pack: 249&nbsp;€ · The Way of Performance: 990&nbsp;€ per 3-month period.</li>"],
  ["Single feedback: 49&nbsp;€ · 3× feedback pack: 129&nbsp;€ · Quarterly program: 499&nbsp;€ per 3-month period. A program taken out",
    "Technical Analysis: 49&nbsp;€ · Progression Pack: 129&nbsp;€ · The Way of Performance: 499&nbsp;€ per 3-month period. A subscription taken out"],
  ["<li>Single feedback: 4 to 6 days</li>\n<li>3× feedback pack: 3 to 5 days</li>\n<li>Quarterly program: 2 to 3 days</li>",
    "<li>Technical Analysis: 4 to 6 days</li>\n<li>Progression Pack: 3 to 5 days per feedback round</li>\n<li>The Way of Performance: priority handling, within 48 to 72 hours</li>"],
  ["<li><strong>Single feedback:</strong> send your video within 6 months of payment.</li>",
    "<li><strong>Technical Analysis:</strong> send your videos within 6 months of payment.</li>"],
  ["<li><strong>3× feedback pack:</strong> send your first video within 6 months of payment. The three analyses are then valid 6 months from the date of that first video.</li>",
    "<li><strong>Progression Pack:</strong> send your first videos within 6 months of payment. The 3 feedback rounds are then valid 6 months from the date of your first video.</li>"],
  ["<li><strong>Quarterly program:</strong> one analysis per week of the current 3-month period. A week without a video can be made up later in the same period; unused analyses do not carry over to the next period.</li>",
    "<li><strong>The Way of Performance:</strong> one feedback (2 videos) per week, over 12 weeks of the current 3-month period. Up to 2 unused weeks can be carried over to another week of the same period; unused weeks do not carry over to the next period.</li>"],
  ["<li><strong>Single feedback received:</strong>", "<li><strong>Technical Analysis received:</strong>"],
  ["a third of the price paid per analysis received for the pack", "a third of the price paid per feedback round received for the pack"],
  ["the share of the price matching the analyses received, out of the 13 planned for the period", "the share of the price matching the weeks of feedback received, out of the 12 planned for the period"],
  ["the price paid for the single feedback, a third of the price paid per remaining analysis of the pack", "the price paid for the Technical Analysis, a third of the price paid per remaining feedback round of the pack"],
  ["Quarterly program: renewal and cancellation", "The Way of Performance: renewal and cancellation", 2],
  ["Stripe customer portal</a>, or by email.", "Stripe customer portal</a>, or simply by sending me a message (WhatsApp) or an email before the next renewal date."],
  ["<li>Send usable videos: the whole routine, filmed front on, full body in frame, with good light and a steady camera.</li>",
    "<li>Send usable videos: filmed horizontally, full body in frame, from the front or the side, with good light and a steady camera.</li>"],
  ["<li>Respect the format: per analysis, up to 3 videos under 30 seconds or 2 videos under 2 minutes.</li>",
    "<li>Respect the format: per feedback, 2 videos of up to 2 minutes each, or 3 videos of up to 45 seconds each.</li>"],
  ["If a video cannot be used, I ask you once to send a new one;", "If a video cannot be used, I ask you once to send a new one, at no cost;"],
  ["<span>Version of 29 October 2026</span>", "<span>Version of 30 October 2026</span>"],
  // Français.
  ["Je regarde votre vidéo et vous réponds par une analyse complète, écrite ou en message vocal : technique, rythme, sauts, transitions, avec des corrections classées par priorité.",
    "J’analyse vos vidéos selon votre niveau et vos objectifs, et vous réponds par écrit ou en message vocal (aussi en vidéo pour le Suivi Performance) : vos points forts, la technique, les sauts, le rythme, les transitions, avec des corrections classées par priorité."],
  ["<h3>Single feedback — 99&nbsp;€</h3>\n<p>L’analyse complète d’un enchaînement.</p>",
    "<h3>Analyse Technique — 99&nbsp;€</h3>\n<p>2 vidéos analysées (votre taolu, vos sauts ou une partie ciblée) : vos points forts, vos corrections prioritaires et des conseils précis, principalement axés sur les notes A et C.</p>"],
  ["<h3>3× feedback pack — 249&nbsp;€</h3>\n<p>Trois analyses, à envoyer quand vous le souhaitez, avec des exercices ciblés après chaque vidéo et un suivi de vos progrès d’une vidéo à l’autre. Valable 6 mois à compter de votre première vidéo.</p>",
    "<h3>Pack Évolution — 249&nbsp;€</h3>\n<p>6 vidéos analysées en 3 retours de 2 vidéos chacun, espacés selon votre rythme : une analyse détaillée de chaque vidéo, des corrections expliquées et des exercices ciblés après chaque retour, un suivi de vos progrès d’un retour à l’autre, et des conseils sur la note B en plus des notes A et C. Valable 6 mois à compter de votre première vidéo.</p>\n" + DEDUCTION_FR],
  ["<h3>Quarterly program — 990&nbsp;€ tous les 3 mois (abonnement)</h3>\n<p>Une analyse chaque semaine, des priorités fixées ensemble, des échanges écrits quand vous en avez besoin, puis un bilan final avec un plan pour la suite.",
    "<h3>Suivi Performance — 990&nbsp;€ tous les 3 mois (abonnement)</h3>\n<p>Un suivi individuel sur 12 semaines : 24 analyses personnalisées (2 vidéos par semaine), les axes à travailler définis au début du trimestre, un suivi continu de vos corrections et de votre progression chaque semaine, les points prioritaires à corriger identifiés à chaque retour, des questions-réponses sur WhatsApp après chaque retour, puis un bilan final avec des recommandations pour la suite. Retour écrit, vocal ou en vidéo, avec un traitement prioritaire."],
  ["le pack est limité à 6 clients en même temps et le programme à 2.", "le pack est limité à 6 clients en même temps et le Suivi Performance à 3."],
  ["Par analyse : jusqu’à 3 vidéos de moins de 30 secondes, ou 2 vidéos de moins de 2 minutes.", "Par retour : 2 vidéos de 2 minutes maximum chacune, ou 3 vidéos de 45 secondes maximum chacune."],
  ["Je vous réponds sur WhatsApp, par écrit ou en message vocal, dans le délai indiqué à l’article 7.", "Je vous réponds sur WhatsApp, par écrit ou en message vocal (aussi en vidéo pour le Suivi Performance), dans le délai indiqué à l’article 7."],
  ["<li>Single feedback : 99&nbsp;€ · 3× feedback pack : 249&nbsp;€ · Quarterly program : 990&nbsp;€ par période de 3 mois.</li>",
    "<li>Analyse Technique : 99&nbsp;€ · Pack Évolution : 249&nbsp;€ · Suivi Performance : 990&nbsp;€ par période de 3 mois.</li>"],
  ["Single feedback : 49&nbsp;€ · 3× feedback pack : 129&nbsp;€ · Quarterly program : 499&nbsp;€ par période de 3 mois. Un programme souscrit",
    "Analyse Technique : 49&nbsp;€ · Pack Évolution : 129&nbsp;€ · Suivi Performance : 499&nbsp;€ par période de 3 mois. Un abonnement souscrit"],
  ["<li>Single feedback : 4 à 6 jours</li>\n<li>3× feedback pack : 3 à 5 jours</li>\n<li>Quarterly program : 2 à 3 jours</li>",
    "<li>Analyse Technique : 4 à 6 jours</li>\n<li>Pack Évolution : 3 à 5 jours par retour</li>\n<li>Suivi Performance : traitement prioritaire, sous 48 à 72 heures</li>"],
  ["<li><strong>Single feedback :</strong> envoyez votre vidéo dans les 6 mois suivant le paiement.</li>",
    "<li><strong>Analyse Technique :</strong> envoyez vos vidéos dans les 6 mois suivant le paiement.</li>"],
  ["<li><strong>3× feedback pack :</strong> envoyez votre première vidéo dans les 6 mois suivant le paiement. Les trois analyses sont ensuite valables 6 mois à compter de la date de cette première vidéo.</li>",
    "<li><strong>Pack Évolution :</strong> envoyez vos premières vidéos dans les 6 mois suivant le paiement. Les 3 retours sont ensuite utilisables pendant 6 mois à compter de la date de votre première vidéo.</li>"],
  ["<li><strong>Quarterly program :</strong> une analyse par semaine pendant la période de 3 mois en cours. Une semaine sans vidéo peut être rattrapée plus tard dans la même période ; les analyses non utilisées ne sont pas reportées sur la période suivante.</li>",
    "<li><strong>Suivi Performance :</strong> un retour (2 vidéos) par semaine, sur 12 semaines de la période de 3 mois en cours. Jusqu’à 2 semaines non utilisées peuvent être reportées sur une autre semaine de la même période ; les semaines non utilisées ne sont pas reportées sur la période suivante.</li>"],
  ["<li><strong>Single feedback reçu :</strong>", "<li><strong>Analyse Technique reçue :</strong>"],
  ["un tiers du prix payé par analyse reçue pour le pack", "un tiers du prix payé par retour reçu pour le pack"],
  ["la part du prix correspondant aux analyses reçues, sur les 13 prévues dans la période", "la part du prix correspondant aux semaines de retour reçues, sur les 12 prévues dans la période"],
  ["le prix payé pour le single feedback, un tiers du prix payé par analyse restante du pack", "le prix payé pour l’Analyse Technique, un tiers du prix payé par retour restant du pack"],
  ["Programme trimestriel : reconduction et résiliation", "Suivi Performance : reconduction et résiliation", 2],
  ["espace client Stripe</a>, ou par e-mail.", "espace client Stripe</a>, ou simplement en m’envoyant un message (WhatsApp) ou un e-mail avant la prochaine échéance."],
  ["<li>Envoyer des vidéos exploitables : l’enchaînement complet, filmé de face, corps entier dans le cadre, avec une bonne lumière et une caméra stable.</li>",
    "<li>Envoyer des vidéos exploitables : filmées à l’horizontale, le corps entier dans le cadre, de face ou de côté, avec une bonne lumière et une caméra stable.</li>"],
  ["<li>Respecter le format : par analyse, jusqu’à 3 vidéos de moins de 30 secondes ou 2 vidéos de moins de 2 minutes.</li>",
    "<li>Respecter le format : par retour, 2 vidéos de 2 minutes maximum chacune, ou 3 vidéos de 45 secondes maximum chacune.</li>"],
  ["Si une vidéo est inexploitable, je vous demande une seule fois de la renvoyer ;", "Si une vidéo est inexploitable, je vous demande une seule fois de la renvoyer, sans frais ;"],
  ["<span>Version du 29 octobre 2026</span>", "<span>Version du 30 octobre 2026</span>"],
];

// Adresse de test seulement (ESSAI=1) : la carte payée ne s'y débloque pas (le Worker API n'accepte que loandrouard.com).
// ?apercu=single, pack ou prog l'affiche avec le faux numéro de l'aperçu de l'éditeur (apercuPaye), et ouvre la fenêtre.
const APERCU_ESSAI = [
  { quoi: "Adresse de test : aperçu de la carte payée et de la fenêtre du 30/10 (?apercu=single, pack ou prog)", fichiers: VF, n: 1,
    avant: "    if (sid) this.verifier(sid, retour);\n",
    apres: "    if (sid) this.verifier(sid, retour);\n" +
      "    /* ADRESSE DE TEST SEULEMENT (ESSAI=1, scripts/construire.mjs) : ?apercu=single|pack|prog, carte payée avec un faux numéro et fenêtre du 30/10. */\n" +
      '    else { let ap = null; try { ap = new URLSearchParams(location.search).get("apercu"); } catch (e) {} if (FORMULES[ap]) { this.setState({ paye: ap, choix: ap, numero: "33600000000" }); this.ouvrirGuide(); setTimeout(() => this.allerFormules(), 300); } }\n' },
];

const CORRECTIONS = [
  {
    quoi: "Crédits photo des mentions légales (01/10)",
    fichiers: ["Legal.dc.html"], n: 2,
    avant: '<mark class="lg-todo">[À COMPLÉTER : photographes]</mark>',
    apres: "David GROUARD",
  },
  // Médiateur de la consommation (20/10) : CM2C au lieu de MED CONSO DEV (compte CM2C valable jusqu'au 20/10/2029).
  // Texte français repris de la mention fournie par CM2C dans l'espace professionnel de Loan ; version des CGV mise à jour.
  { quoi: "CGV : médiateur CM2C (20/10)", fichiers: ["CGV.dc.html"], n: 1,
    avant: "<li>Si nous ne trouvons pas de solution, vous pouvez saisir gratuitement, conformément aux articles L.616-1 et R.616-1 du code de la consommation, le médiateur de la consommation dont je relève : <b>MED CONSO DEV – Médiation Consommation Développement</b>, Centre d’Affaires Stéphanois SAS, Immeuble L’Horizon – Esplanade de France, 3 rue J. Constant Milleret, 42000 Saint-Étienne — <a href=\"https://www.medconsodev.eu/\" target=\"_blank\" rel=\"noopener\">medconsodev.eu</a> (demande en ligne ou par courrier). Vous devez d’abord m’avoir adressé une réclamation écrite, et saisir le médiateur dans l’année qui suit.</li>",
    apres: "<li>Conformément aux dispositions du Code de la consommation concernant « le processus de médiation des litiges de la consommation », après nous avoir sollicités et à défaut de réponse vous satisfaisant, vous avez la possibilité de recourir gratuitement à une procédure de médiation de la consommation auprès de : <b>CM2C</b>, 49 rue de Ponthieu, 75008&nbsp;Paris — tél.&nbsp;01&nbsp;89&nbsp;47&nbsp;00&nbsp;14 — site internet&nbsp;: <a href=\"https://www.cm2c.net/declarer-un-litige.php\" target=\"_blank\" rel=\"noopener\">www.cm2c.net/declarer-un-litige.php</a> — e-mail&nbsp;: <a href=\"mailto:litiges@cm2c.net\">litiges@cm2c.net</a>. Vous devez d’abord m’avoir adressé une réclamation écrite, et saisir le médiateur dans l’année qui suit.</li>" },
  { quoi: "CGV : médiateur CM2C, version anglaise (20/10)", fichiers: ["CGV.dc.html"], n: 1,
    avant: "<li>If we cannot find a solution, you can refer the dispute free of charge to the consumer mediator I have joined (articles L.616-1 and R.616-1 of the French Consumer Code): <b>MED CONSO DEV – Médiation Consommation Développement</b>, Centre d’Affaires Stéphanois SAS, Immeuble L’Horizon – Esplanade de France, 3 rue J. Constant Milleret, 42000 Saint-Étienne, France — <a href=\"https://www.medconsodev.eu/\" target=\"_blank\" rel=\"noopener\">medconsodev.eu</a>, where you can file your request online or by post. The procedure is conducted in French. You must first have sent me a written complaint, and contact the mediator within one year of it.</li>",
    apres: "<li>In accordance with the provisions of the French Consumer Code on “the consumer dispute mediation process”, if you have contacted us and our reply does not satisfy you, you can use a consumer mediation procedure free of charge with: <b>CM2C</b>, 49 rue de Ponthieu, 75008&nbsp;Paris, France — tel.&nbsp;+33&nbsp;1&nbsp;89&nbsp;47&nbsp;00&nbsp;14 — website: <a href=\"https://www.cm2c.net/declarer-un-litige.php\" target=\"_blank\" rel=\"noopener\">www.cm2c.net/declarer-un-litige.php</a> — email: <a href=\"mailto:litiges@cm2c.net\">litiges@cm2c.net</a>. The procedure is conducted in French. You must first have sent me a written complaint, and contact the mediator within one year of it.</li>" },
  { quoi: "CGV : version du 20 octobre 2026", fichiers: ["CGV.dc.html"], n: 1,
    avant: "<span>Version du 1er octobre 2026</span>", apres: "<span>Version du 20 octobre 2026</span>" },
  { quoi: "CGV : version of 20 October 2026", fichiers: ["CGV.dc.html"], n: 1,
    avant: "<span>Version of 1 October 2026</span>", apres: "<span>Version of 20 October 2026</span>" },
  // Nouveaux prix et offre de lancement (29/10, voir OFFRE) : prix normaux dans les titres et à l'article 05, offre de lancement
  // sans date (tant qu'elle est affichée sur le site) ; montants remboursés exprimés à partir du prix payé (49 ou 99 €, tiers du pack : 43 ou 83 €).
  // Texte à faire valider par Loan avant la mise en ligne.
  ...[["Single feedback — 49&nbsp;€", "Single feedback — 99&nbsp;€"], ["3× feedback pack — 129&nbsp;€", "3× feedback pack — 249&nbsp;€"],
    ["Quarterly program — 499&nbsp;€ every 3 months (subscription)", "Quarterly program — 990&nbsp;€ every 3 months (subscription)"],
    ["Quarterly program — 499&nbsp;€ tous les 3 mois (abonnement)", "Quarterly program — 990&nbsp;€ tous les 3 mois (abonnement)"]].map(([avant, apres]) => ({
    quoi: `CGV : ${apres.replace(/&nbsp;/g, " ")} (29/10)`, fichiers: ["CGV.dc.html"], n: avant.startsWith("Quarterly") ? 1 : 2, avant: `<h3>${avant}</h3>`, apres: `<h3>${apres}</h3>` })),
  { quoi: "CGV : prix et offre de lancement (29/10)", fichiers: ["CGV.dc.html"], n: 1,
    avant: "<li>Single feedback : 49&nbsp;€ · 3× feedback pack : 129&nbsp;€ · Quarterly program : 499&nbsp;€ par période de 3 mois.</li>",
    apres: "<li>Single feedback : 99&nbsp;€ · 3× feedback pack : 249&nbsp;€ · Quarterly program : 990&nbsp;€ par période de 3 mois.</li>\n" +
      "<li>Offre de lancement, pour toute commande passée tant qu’elle est affichée sur la page Video Feedback : Single feedback : 49&nbsp;€ · 3× feedback pack : 129&nbsp;€ · Quarterly program : 499&nbsp;€ par période de 3 mois. Un programme souscrit pendant l’offre reste à 499&nbsp;€ par période jusqu’à sa résiliation.</li>" },
  { quoi: "CGV : prices and launch offer (29/10)", fichiers: ["CGV.dc.html"], n: 1,
    avant: "<li>Single feedback: 49&nbsp;€ · 3× feedback pack: 129&nbsp;€ · Quarterly program: 499&nbsp;€ per 3-month period.</li>",
    apres: "<li>Single feedback: 99&nbsp;€ · 3× feedback pack: 249&nbsp;€ · Quarterly program: 990&nbsp;€ per 3-month period.</li>\n" +
      "<li>Launch offer, for any order placed while it is shown on the Video Feedback page: Single feedback: 49&nbsp;€ · 3× feedback pack: 129&nbsp;€ · Quarterly program: 499&nbsp;€ per 3-month period. A program taken out during the offer stays at 499&nbsp;€ per period until you cancel it.</li>" },
  { quoi: "CGV : prélèvement du programme (29/10)", fichiers: ["CGV.dc.html"], n: 1,
    avant: "<li>Programme : les 499&nbsp;€ sont prélevés automatiquement au début de chaque période de 3 mois, sur le moyen de paiement utilisé.</li>",
    apres: "<li>Programme : son prix est prélevé automatiquement au début de chaque période de 3 mois, sur le moyen de paiement utilisé.</li>" },
  { quoi: "CGV : program charge (29/10)", fichiers: ["CGV.dc.html"], n: 1,
    avant: "<li>Program: the 499&nbsp;€ are charged automatically at the start of each 3-month period, to the payment method you used.</li>",
    apres: "<li>Program: its price is charged automatically at the start of each 3-month period, to the payment method you used.</li>" },
  { quoi: "CGV : rétractation, pack en partie exécuté (29/10)", fichiers: ["CGV.dc.html"], n: 1,
    avant: "43&nbsp;€ par analyse reçue pour le pack ;",
    apres: "un tiers du prix payé par analyse reçue pour le pack (43&nbsp;€ pendant l’offre de lancement, 83&nbsp;€ au prix normal) ;" },
  { quoi: "CGV : withdrawal, pack partly performed (29/10)", fichiers: ["CGV.dc.html"], n: 1,
    avant: "43&nbsp;€ per analysis received for the pack;",
    apres: "a third of the price paid per analysis received for the pack (43&nbsp;€ during the launch offer, 83&nbsp;€ at the regular price);" },
  { quoi: "CGV : remboursement d'une analyse non fournie (29/10)", fichiers: ["CGV.dc.html"], n: 1,
    avant: "49&nbsp;€ pour le single feedback, 43&nbsp;€ par analyse restante du pack,",
    apres: "le prix payé pour le single feedback, un tiers du prix payé par analyse restante du pack," },
  { quoi: "CGV : refund of an analysis not provided (29/10)", fichiers: ["CGV.dc.html"], n: 1,
    avant: "49&nbsp;€ for the single feedback, 43&nbsp;€ per remaining analysis of the pack,",
    apres: "the price paid for the single feedback, a third of the price paid per remaining analysis of the pack," },
  { quoi: "CGV : version du 29 octobre 2026", fichiers: ["CGV.dc.html"], n: 1,
    avant: "<span>Version du 20 octobre 2026</span>", apres: "<span>Version du 29 octobre 2026</span>" },
  { quoi: "CGV : version of 29 October 2026", fichiers: ["CGV.dc.html"], n: 1,
    avant: "<span>Version of 20 October 2026</span>", apres: "<span>Version of 29 October 2026</span>" },
  // Cloudflare Web Analytics, actif depuis le 06/09 (balise ajoutée par Cloudflare) et gardé par Loan le 29/10 : la page Privacy
  // disait « ni mesure d'audience ». Décrit d'après Cloudflare : ni cookie ni stockage dans le navigateur, pas d'empreinte.
  { quoi: "Privacy : mesure d'audience Cloudflare Web Analytics (29/10)", fichiers: ["Privacy.dc.html"], n: 1,
    avant: "<li>Le site n’utilise ni cookie publicitaire ni mesure d’audience.</li>",
    apres: "<li>Le site n’utilise aucun cookie publicitaire. Il mesure son audience avec Cloudflare Web Analytics, qui n’utilise pas de cookie et ne vous suit pas d’un site à l’autre : il compte les visites et les pages vues (site d’origine, pays, type d’appareil et de navigateur) et mesure la vitesse de chargement, sous forme de statistiques globales.</li>" },
  { quoi: "Privacy: audience measurement Cloudflare Web Analytics (29/10)", fichiers: ["Privacy.dc.html"], n: 1,
    avant: "<li>The site uses no advertising cookies and no audience measurement.</li>",
    apres: "<li>The site uses no advertising cookies. It measures its audience with Cloudflare Web Analytics, which uses no cookies and does not follow you from one site to another: it counts visits and pages viewed (referring site, country, type of device and browser) and measures loading speed, as overall statistics.</li>" },
  { quoi: "Privacy : base légale des statistiques (29/10)", fichiers: ["Privacy.dc.html"], n: 1,
    avant: "<li><strong>Sécurité du site et lutte contre la fraude</strong> : intérêt légitime.</li>",
    apres: "<li><strong>Sécurité du site et lutte contre la fraude</strong> : intérêt légitime.</li>\n<li><strong>Statistiques de fréquentation</strong> (Cloudflare Web Analytics) : intérêt légitime (comprendre l’utilisation du site pour l’améliorer).</li>" },
  { quoi: "Privacy: legal basis of statistics (29/10)", fichiers: ["Privacy.dc.html"], n: 1,
    avant: "<li><strong>Site security and fraud prevention</strong>: legitimate interest.</li>",
    apres: "<li><strong>Site security and fraud prevention</strong>: legitimate interest.</li>\n<li><strong>Audience statistics</strong> (Cloudflare Web Analytics): legitimate interest (understanding how the site is used, to improve it).</li>" },
  { quoi: "Privacy : Cloudflare, statistiques de fréquentation (29/10)", fichiers: ["Privacy.dc.html"], n: 1,
    avant: "<li><strong>Cloudflare, Inc.</strong> : hébergement du site et du service de vérification des paiements.</li>",
    apres: "<li><strong>Cloudflare, Inc.</strong> : hébergement du site et du service de vérification des paiements, statistiques de fréquentation.</li>" },
  { quoi: "Privacy: Cloudflare, audience statistics (29/10)", fichiers: ["Privacy.dc.html"], n: 1,
    avant: "<li><strong>Cloudflare, Inc.</strong>: hosting of the site and of the payment-check service.</li>",
    apres: "<li><strong>Cloudflare, Inc.</strong>: hosting of the site and of the payment-check service, audience statistics.</li>" },
  { quoi: "Privacy : version du 29 octobre 2026", fichiers: ["Privacy.dc.html"], n: 1,
    avant: "<span>Version du 1er octobre 2026</span>", apres: "<span>Version du 29 octobre 2026</span>" },
  { quoi: "Privacy: version of 29 October 2026", fichiers: ["Privacy.dc.html"], n: 1,
    avant: "<span>Version of 1 October 2026</span>", apres: "<span>Version of 29 October 2026</span>" },
  // Cartes des formules (02/10).
  { quoi: "Prix Single : one full analysis", fichiers: VF, n: 2,
    avant: "49&nbsp;€ · one routine", apres: "49&nbsp;€ · one full analysis" },
  { quoi: "Prix Pack : 3 full analyses", fichiers: VF, n: 2,
    avant: "129&nbsp;€ · six months", apres: "129&nbsp;€ · 3 full analyses" },
  { quoi: "Prix Programme : weekly coaching", fichiers: VF, n: 2,
    avant: "499&nbsp;€ · every 3 months", apres: "499&nbsp;€ · weekly coaching" },
  // Nouveaux prix et offre de lancement (29/10) : voir OFFRE, plus haut.
  { quoi: "Offre de lancement : prix, phase et liens de secours (29/10)", fichiers: VF, n: 1,
    avant: "\n/* Liens de paiement Stripe de repli (vérifiés sur le compte le 01/10). */\n",
    apres: "\n" + OFFRE_JS + "\n/* Liens de paiement Stripe de repli (vérifiés sur le compte le 01/10). */\n" },
  { quoi: "Offre de lancement : liens de secours aux prix normaux (29/10)", fichiers: VF, n: 1,
    avant: '  prog: "https://buy.stripe.com/aFa8wPfcReatc1J8A74ko03",\n};\n',
    apres: '  prog: "https://buy.stripe.com/aFa8wPfcReatc1J8A74ko03",\n};\n' + OFFRE_LIENS_JS },
  { quoi: "Offre de lancement : valeurs du gabarit (29/10)", fichiers: VF, n: 1,
    avant: "      placesPack: String(pl.pack), placesProg: String(pl.prog),\n",
    apres: "      placesPack: String(pl.pack), placesProg: String(pl.prog),\n" + OFFRE_VALS },
  { quoi: "Offre de lancement : « Launch offer » au-dessus du nom (29/10)", fichiers: VF, n: 6,
    avant: '<div class="vf-carte__tete">\n<div class="vf-nom">', apres: '<div class="vf-carte__tete">\n' + OFFRE_TITRE + '<div class="vf-nom">' },
  ...[["Single", "one full analysis"], ["Pack", "3 full analyses"], ["Prog", "weekly coaching"]].map(([k, quoi], i) => ({
    quoi: `Offre de lancement : prix ${k} (29/10)`, fichiers: VF, n: 2,
    avant: `<div class="vf-prix">${Object.values(TARIFS)[i][0]}&nbsp;€ · ${quoi}</div>`,
    apres: `<div class="vf-prix">${OFFRE_PRIX(k)}<span class="vf-prix-t">{{ prix${k} }}<span class="vf-prix-d"> · ${quoi}</span></span></div>` })),
  { quoi: "Offre de lancement : « Launch offer · from 49 € » sous See the options (29/10)", fichiers: VF, n: 1,
    avant: '<span class="vfp-affiche-s">Three packages · from 49&nbsp;€</span>',
    apres: `<span class="vfp-affiche-s">${SI_OFFRE("Launch offer")}<sc-if value="{{ horsOffre }}" hint-placeholder-val="{{ true }}">Three packages</sc-if> · from {{ prixMin }}</span>` },
  { quoi: "Offre de lancement : styles (29/10)", fichiers: VF, n: 1,
    avant: ".vf-prix { font-family: 'Cinzel', Georgia, serif; font-size: 22px; letter-spacing: .03em; color: rgba(246,245,241,.7); }\n",
    apres: ".vf-prix { font-family: 'Cinzel', Georgia, serif; font-size: 22px; letter-spacing: .03em; color: rgba(246,245,241,.7); }\n" + OFFRE_CSS },
  { quoi: "Puce « Written or voice feedback » (cartes des formules)", fichiers: VF, n: 3,
    avant: "<span>One full analysis, written or voice</span>", apres: "<span>Written or voice feedback</span>" },
  { quoi: "Puce « Written or voice feedback » (cartes du projecteur)", fichiers: VF, n: 1,
    avant: "<span>One full analysis</span>", apres: "<span>Written or voice feedback</span>" },
  ...[["4 to 6"], ["3 to 5"], ["2 to 3"]].map(([d]) => ({ quoi: `Délai ${d} days retiré de la liste`, fichiers: VF, n: 1,
    avant: `<div class="vf-pt"><i></i><span>Reply in ${d} days</span></div>\n`, apres: "" })),
  { quoi: "Délai Single sous la carte", fichiers: VF, n: 1,
    avant: '</article>\n</div>\n</div>\n\n<div class="vfk-c" data-k="1">',
    apres: '</article>\n</div>\n' + DELAI("libreSingle", "Reply in 4 to 6 days") + '\n</div>\n\n<div class="vfk-c" data-k="1">' },
  { quoi: "Pack : validité 6 mois + délai sous la carte", fichiers: VF, n: 1,
    avant: '<div class="vf-pt"><i></i><span>Grade B suggestions on top</span></div>\n</div>\n</sc-if>\n</article>\n</div>\n</div>\n\n<div class="vfk-c" data-k="2">',
    apres: '<div class="vf-pt"><i></i><span>Grade B suggestions on top</span></div>\n<div class="vf-pt"><i></i><span>Valid 6 months from your first video</span></div>\n</div>\n</sc-if>\n</article>\n</div>\n' +
      DELAI("librePack", "Reply in 3 to 5 days") + '\n</div>\n\n<div class="vfk-c" data-k="2">' },
  { quoi: "Délai Programme sous la carte", fichiers: VF, n: 1,
    avant: '</article>\n</div>\n</div>\n</div>\n<p class="vfk-note">',
    apres: '</article>\n</div>\n' + DELAI("libreProg", "Reply in 2 to 3 days") + '\n</div>\n</div>\n<p class="vfk-note">' },
  { quoi: "Programme : « Also included » au lieu de « In the pack »", fichiers: VF, n: 1,
    avant: '<div class="vf-tier vf-tier--pack">\n<b>In the pack</b>\n<div class="vf-pt"><i></i><span>Targeted exercises after each video</span></div>',
    apres: '<div class="vf-tier">\n<b>Also included</b>\n<div class="vf-pt"><i></i><span>Targeted exercises after each video</span></div>' },
  { quoi: "Programme : « In the program » en or", fichiers: VF, n: 1,
    avant: ".vf-tier--prog { color: #E3D5B8; }", apres: ".vf-tier--prog { color: #C6A05E; }" },
  // Carte payée (19/10, demandé par Loan avec la version française) : la consigne de tournage, évidente, devient l'invitation à envoyer.
  { quoi: "Carte payée : « Send your videos for analysis. » (19/10)", fichiers: VF, n: 3,
    avant: "<span>Film the whole routine, front on, full body in frame.</span>", apres: "<span>Send your videos for analysis.</span>" },
  { quoi: "Styles : lien Terms of sale cliquable, délai sous les cartes, fond noir en haut de page", fichiers: VF, n: 1,
    avant: ".vfk-note[data-on] { opacity: 1; }",
    apres: ".vfk-note[data-on] { opacity: 1; }\n" +
      "/* Corrections du 02/10 (scripts/construire.mjs). */\n" +
      ".vfk-note[data-on] a { pointer-events: auto; }\n" +
      ".vfk-delai { position: absolute; left: 0; right: 0; top: 100%; margin: 16px 0 0; text-align: center; font-family: 'Cinzel', Georgia, serif; font-size: 10.5px; letter-spacing: .14em; text-transform: uppercase; color: rgba(246,245,241,.55); opacity: 0; transition: opacity 1s ease; pointer-events: none; }\n" +
      ".vfk-c[data-vu] .vfk-delai { opacity: 1; }\n" +
      "@media (max-width: 999px) { .vfk-delai { position: static; } }\n" +
      "html { background: #000; }" },
  { quoi: "Note sous les cartes : plus d'espace pour le délai", fichiers: VF, n: 1,
    avant: ".vfk-note { margin: 30px 0 0;", apres: ".vfk-note { margin: 52px 0 0;" },
  { quoi: "Retournement des cartes : la page reste sur la planche jusqu'à la fin", fichiers: VF, n: 1,
    avant: "const onScroll = () => { if (!rafS) rafS = requestAnimationFrame(maj); };",
    apres: "const onScroll = () => { if (verrou() && yVerrou && window.scrollY > yVerrou + 2) window.scrollTo({ top: yVerrou, behavior: \"instant\" }); if (!rafS) rafS = requestAnimationFrame(maj); };" },

  // Retour de Loan du 08/10 (iPhone).
  // En-tête mobile : les langues sur la ligne du nom, en haut à droite (sélecteur resserré) ; la navigation reste dessous.
  { quoi: "En-tête mobile : langues à droite du nom (08/10)", fichiers: VF, n: 1,
    avant: "@media (max-width: 1040px) { .vf-entete { flex-wrap: wrap; row-gap: 9px; padding: 12px 20px; } .vf-entete nav { order: 3; width: 100%; justify-content: space-between; gap: 14px !important; font-size: 10.5px !important; } }\n",
    apres: "@media (max-width: 1040px) { .vf-entete { flex-wrap: wrap; row-gap: 9px; padding: 12px 20px; } .vf-entete nav { order: 3; width: 100%; justify-content: space-between; gap: 14px !important; font-size: 10.5px !important; } }\n" +
      "/* Correction du 08/10 (scripts/construire.mjs) : sur mobile, les langues à droite du nom, sur la même ligne. */\n" +
      "@media (max-width: 1040px) { .vf-entete { column-gap: 12px; } .vf-entete nav.ld-langues { gap: 8px !important; } .vf-entete .ld-stat__groupe { gap: 8px; } .vf-entete .ld-stat__sep { width: 12px; } }\n" +
      "@media (max-width: 370px) { .vf-entete { padding-inline: 14px; column-gap: 10px; } .vf-entete > div:first-child > span { font-size: 17px !important; } .vf-entete nav.ld-langues, .vf-entete .ld-stat__groupe { gap: 5px !important; } .vf-entete .ld-stat__sep { width: 8px; } }\n" },
  // Menu hamburger (15/10) : bouton sous les langues, navigation dans un menu déroulant ; script commun aux 4 pages.
  { quoi: "Menu hamburger : bouton sous les langues (15/10)", fichiers: VF, n: 1,
    avant: '<div><x-import component-from-global-scope="LoanDrouardDesignSystem_06a79c.SelecteurLangue" ton="sombre" langue="en" hint-size="150px,20px"></x-import></div>\n',
    apres: '<div><x-import component-from-global-scope="LoanDrouardDesignSystem_06a79c.SelecteurLangue" ton="sombre" langue="en" hint-size="150px,20px"></x-import></div>\n' + BURGER },
  ...LEGALES.map((f) => ({ quoi: "Menu hamburger : bouton sous les langues (15/10)", fichiers: [f], n: 1,
    avant: '<x-import component-from-global-scope="LoanDrouardDesignSystem_06a79c.SelecteurLangue" ton="sombre" langue="{{ langue }}" langues="{{ langues }}" onChange="{{ changerLangue }}" hint-size="100px,20px"></x-import>\n',
    apres: '<x-import component-from-global-scope="LoanDrouardDesignSystem_06a79c.SelecteurLangue" ton="sombre" langue="{{ langue }}" langues="{{ langues }}" onChange="{{ changerLangue }}" hint-size="100px,20px"></x-import>\n' + BURGER })),
  ...[...VF, ...LEGALES].map((f) => ({ quoi: "Menu hamburger : script (15/10)", fichiers: [f], n: 1,
    avant: '<script src="./support.js"></script>', apres: MENU_JS + '<script src="./support.js"></script>' })),
  { quoi: "Menu hamburger : styles (15/10)", fichiers: VF, n: 1,
    avant: "@media (max-width: 370px) { .vf-entete {", apres: MENU_CSS(".vf-entete", ".vf-entete > nav:not(.vf-sommaire)") + "@media (max-width: 370px) { .vf-entete {" },
  // Pages légales : même en-tête mobile (il débordait de l'écran : navigation et langues hors champ).
  ...LEGALES.map((f) => ({ quoi: "En-tête mobile des pages légales : repère (08/10)", fichiers: [f], n: 1,
    avant: '<div style="max-width:none;margin:0;padding:18px 22px;display:flex;align-items:center;justify-content:space-between;gap:32px">',
    apres: '<div class="lg-entete" style="max-width:none;margin:0;padding:18px 22px;display:flex;align-items:center;justify-content:space-between;gap:32px">' })),
  ...LEGALES.map((f) => ({ quoi: "En-tête mobile des pages légales : langues à droite du nom (08/10)", fichiers: [f], n: 1,
    avant: ".lg-fin a:hover { color: #F6F5F1; }\n</style>",
    apres: ".lg-fin a:hover { color: #F6F5F1; }\n" +
      "/* Correction du 08/10 (scripts/construire.mjs) : sur mobile, nom et langues sur la première ligne, navigation dessous. */\n" +
      "@media (max-width: 1040px) {\n" +
      "  .lg-entete { flex-wrap: wrap; row-gap: 9px !important; column-gap: 12px !important; padding: 12px 20px !important; }\n" +
      "  .lg-entete > nav:not(.ld-langues) { order: 3; width: 100%; justify-content: space-between; gap: 14px !important; font-size: 10.5px !important; }\n" +
      "  .lg-entete .ld-langues, .lg-entete .ld-stat__groupe { gap: 8px; } .lg-entete .ld-stat__sep { width: 12px; }\n" +
      "  /* En-tête de 82 à 99 px (68 prévus par le design system) : la section et son fond remontent derrière lui, le texte ne bouge pas. */\n" +
      "  .ld-header { margin-bottom: -112px; } .ld-section { padding-top: calc(var(--section-y) + 44px); }\n" +
      "}\n" +
      "@media (min-width: 900px) and (max-width: 1040px) { .ld-section { padding-top: calc(var(--section-y-large) + 44px); } }\n" +
      "@media (max-width: 370px) { .lg-entete { padding-inline: 14px !important; } }\n" +
      "</style>" })),
  // Menu hamburger des pages légales : après leur correction d'en-tête (dont il suit les styles).
  ...LEGALES.map((f) => ({ quoi: "Menu hamburger : styles (15/10)", fichiers: [f], n: 1,
    avant: "@media (max-width: 370px) { .lg-entete {", apres: MENU_CSS(".lg-entete", ".lg-entete > nav:not(.ld-langues)") + "@media (max-width: 370px) { .lg-entete {" })),
  // Cartes des formules sur mobile (< 1000 px) : cartes compactes empilées comme la vitrine « See pricing » (nom, prix, Pay ;
  // choix de Loan le 15/10, après un essai de trois petites cartes côte à côte jugé « noyé dans le décor »), retournées en
  // cascade comme avant ; un toucher hors de Pay ouvre la carte en grand, par-dessus la page (fermeture : Close, Échap,
  // toucher hors de la carte). Le délai de réponse n'est plus sous la carte compacte : le trait de crayon suit à nouveau le
  // bord de la carte (il dépassait pour entourer ce délai). Ordinateur inchangé. Après un paiement, la carte payée s'ouvre.
  { quoi: "Cartes mobiles : styles des petites cartes et de la carte ouverte (08/10)", fichiers: VF, n: 1,
    avant: VFK_MOUV, apres: VFK_MOUV + CARTES_CSS },
  { quoi: "Cartes mobiles : ouverture en grand (08/10)", fichiers: VF, n: 1,
    avant: VFK_REFAIRE, apres: CARTES_JS + VFK_REFAIRE.replace("const refaire = () => { ", 'const refaire = () => { if (sec.hasAttribute("data-grand")) { remesurer = true; return; } /* carte ouverte : mesure reportée à la fermeture */ ').replace("mesurer(); C.forEach(peindre);", "mesurer(); poserBorne(); C.forEach(peindre);") },
  { quoi: "Cartes mobiles : arrêt de l'ouverture au démontage (08/10)", fichiers: VF, n: 1,
    avant: "    return () => { clearTimeout(tRo); if (ro) ro.disconnect(); ",
    apres: "    return () => { offGrand(); clearTimeout(tRo); if (ro) ro.disconnect(); " },
  { quoi: "Cartes mobiles : la carte payée s'ouvre d'elle-même au retour du paiement (08/10)", fichiers: VF, n: 1,
    avant: '      if (vu !== k.vu) { k.vu = vu; k.c.toggleAttribute("data-vu", vu); k.c.inert = !vu; k.flip.style.transformStyle = vu ? "flat" : ""; k.dos.style.visibility = vu ? "hidden" : ""; }\n',
    apres: '      if (vu !== k.vu) { k.vu = vu; k.c.toggleAttribute("data-vu", vu); k.c.inert = !vu; k.flip.style.transformStyle = vu ? "flat" : ""; k.dos.style.visibility = vu ? "hidden" : ""; if (vu && window.__vfkPayee && k.front.querySelector(".vf-deverrou")) { window.__vfkPayee = false; setTimeout(() => ouvrirCarte(k, true), 400); } }\n' },
  { quoi: "Cartes mobiles : retour du paiement, carte payée à ouvrir (08/10)", fichiers: VF, n: 1,
    avant: '  allerFormules() {\n    const el = document.getElementById("formules");\n',
    apres: '  allerFormules() {\n    if (document.querySelector("#formules .vfk-c[data-grand]")) return; /* Correction du 08/10 : paiement fait depuis la carte ouverte, elle montre déjà WhatsApp. */\n    window.__vfkPayee = true; /* Correction du 08/10 : sur mobile, la petite carte payée s\'ouvrira en grand une fois retournée. */\n    document.documentElement.classList.remove("vfk-borne", "vfk-frein"); /* Correction du 17/10 : pas d\'arrêt sur les cartes au retour du paiement. */\n    const el = document.getElementById("formules");\n' },
  // Retournement sur mobile en défilement rapide (retour de Loan du 15/10 : « quand je scrolle super vite, c'est un peu buggé »).
  // Démontré dans Chromium (iPhone simulé, défilement à 3 000–8 000 px/s, images relevées une à une, revue du 15/10) :
  // la séquence, minutée dès l'entrée, se jouait hors de vue au-dessus de l'écran (en revenant : cartes à moitié retournées,
  // de dos ou esquissées) ; et une carte se remettait à zéro dès qu'elle passait d'un pixel sous l'écran, puis se rembobinait
  // sous les yeux (y compris au seul redéploiement de la barre de Safari). Désormais : cascade comptée depuis la carte
  // précédente (cartes empilées), carte passée au-dessus de l'écran finie hors de vue, remise à zéro seulement loin sous
  // l'écran (1,5 hauteur), toutes ensemble et d'un coup. Vitesse normale : départs et animation inchangés.
  { quoi: "Cartes mobiles : cascade, défilement rapide sans carte à moitié retournée ni rembobinage visible (08 et 15/10)", fichiers: VF, n: 1,
    avant: "        C.forEach((k) => { const t = haut(k.c); if (t < vh * 0.85) { if (!k.t0) k.t0 = performance.now(); } else if (t > vh) k.t0 = 0; on(k.g, !!k.t0); });\n",
    apres: "        /* Corrections du 08 et du 15/10 (scripts/construire.mjs) : cascade comptée depuis la carte précédente ; carte passée au-dessus\n" +
      "           de l'écran finie hors de vue ; remise à zéro seulement loin sous l'écran, toutes ensemble et d'un coup. */\n" +
      "        const loin = haut(C[0].c) > vh * 1.5;\n" +
      "        C.forEach((k, i) => { const q = k.c.getBoundingClientRect(), t = q.top;\n" +
      "          if (t < vh * 0.85) { if (!k.t0) k.t0 = Math.max(performance.now(), i && C[i - 1].t0 ? C[i - 1].t0 + LAG / VIT * 1000 : 0); if (q.bottom < 0) k.t0 = Math.min(k.t0, performance.now() - 3.8 / VIT * 1000); }\n" +
      "          else if (loin && k.t0) { k.t0 = 0; k.p = 0; peindre(k); }\n" +
      "          on(k.g, !!k.t0); });\n" +
      "        if (derive()) recaler(); /* Correction du 15/10 : cartes déplacées sans leurs traits, dessin refait. */\n" },
  // Arrêt sur les cartes en défilement rapide (retour de Loan du 15/10 : « si on scrolle vite, on arrive tout en bas et on ne passe
  // pas par les cartes ») : la place d'arrêt est vérifiée avant tout le reste, même quand un élan a sauté toute la planche d'un coup.
  { quoi: "Cartes mobiles : la page s'arrête sur les cartes le temps du retournement (15/10)", fichiers: VF, n: 1,
    avant: "      const vh = window.innerHeight, r = sec.getBoundingClientRect();\n      if (r.top > vh * 2.5 || r.bottom < -vh * 0.5) return;\n",
    apres: "      tenir(); /* Corrections du 15, 17 et 18/10 (scripts/construire.mjs) : arrêt sur les cartes (mobile, et tablette en paysage). */\n" +
      "      const vh = window.innerHeight, r = sec.getBoundingClientRect();\n      if (r.top > vh * 2.5 || r.bottom < -vh * 0.5) return;\n" },
  { quoi: "Verrou de la planche : jamais de retour par script sur écran tactile ni pendant la fin provisoire (18/10)", fichiers: VF, n: 1,
    avant: "const onScroll = () => { if (verrou() && yVerrou && window.scrollY > yVerrou + 2) window.scrollTo",
    apres: "const onScroll = () => { if (verrou() && yVerrou && !finPage && !doigtLarge() && window.scrollY > yVerrou + 2) window.scrollTo" },
  // « See pricing » (« See the options » depuis le 27/10) plus tôt. Retour de Loan du 17/10 (« il faut qu'il s'affiche un petit
  // peu plus rapidement ») : départ à 4,2 s au lieu de 5,2 s, montée en 2,2 s au lieu de 2,6 s. Retour du 28/10 : d'abord sur mobile
  // (les visiteurs descendent avant de l'avoir vu), puis sur ordinateur « comme sur iPhone », montée en 1,4 s à toutes les largeurs.
  // Départ calé ensuite par Loan sur le premier flash du projecteur (vfp-frappe, 3,3 s) au lieu de 2,4 s.
  { quoi: "See the options : départ avec le premier flash du projecteur (17/10, puis 28/10 à toutes les largeurs)", fichiers: VF, n: 1,
    avant: "animation: vfp-affiche-in 2.6s cubic-bezier(.16,.6,.2,1) 5.2s both;",
    apres: "animation: vfp-affiche-in 1.4s cubic-bezier(.16,.6,.2,1) 3.3s both;" },
  { quoi: "Cartes : dessin refait quand les cartes changent de place (15/10)", fichiers: VF, n: 1,
    avant: '    const cleDims = () => pin.clientWidth + "x" + window.innerHeight + "x" + C.map((k) => k.front.offsetHeight).join(",");\n',
    apres: '    const cleDims = () => pin.clientWidth + "x" + window.innerHeight + "x" + C.map((k) => k.front.offsetHeight).join(",") + "x" + plaque.offsetHeight + "," + bloc.parentNode.offsetHeight; /* Correction du 15/10 : place des cartes comprise. */\n' },
  { quoi: "Cartes : bloc des cartes observé (15/10)", fichiers: VF, n: 1,
    avant: "}, 150); }); ro.observe(pin); }\n",
    apres: "}, 150); }); ro.observe(pin); ro.observe(bloc.parentNode); }\n" },
  // Retournement 3D : chaque face est aussi montrée / cachée à 90° (en plus de backface-visibility), pour éviter que Safari iOS
  // ne montre brièvement la mauvaise face d'un calque 3D recomposé pendant un défilement rapide. Identique au pixel (revue du
  // 15/10 : 0 pixel différent sur 40 comparaisons sur mobile et 13 sur ordinateur).
  { quoi: "Retournement des cartes : faces montrées / cachées à 90° (Safari) (15/10)", fichiers: VF, n: 1,
    avant: "    };\n\n    const etat = () => { const fini",
    apres: "      k.front.style.visibility = e < 0.5 ? \"hidden\" : \"\"; k.dos.style.visibility = e < 0.5 ? \"\" : \"hidden\"; /* Correction du 15/10 : faces à 90° (Safari). */\n    };\n\n    const etat = () => { const fini" },
  { quoi: "Cartes : congé du trait de crayon lu sur la carte (petites cartes moins arrondies) (08/10)", fichiers: VF, n: 1,
    avant: "      const rad = 24 * R[0].w / Math.max(1, C[0].c.offsetWidth);\n",
    apres: "      const rad = (parseFloat(getComputedStyle(C[0].front).borderTopLeftRadius) || 24) * R[0].w / Math.max(1, C[0].c.offsetWidth);\n" },
  // Pages légales à 320 px (iPhone en « texte plus grand ») : le sommaire imposait une colonne de 300 px (page plus large que l'écran).
  ...LEGALES.map((f) => ({ quoi: "Sommaire des pages légales : colonne jamais plus large que l'écran (09/10)", fichiers: [f], n: 1,
    avant: "grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); column-gap: 40px; }",
    apres: "grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr)); column-gap: 40px; }" })),
  // Pied de page (toutes les pages) : sur mobile, Meta et Global côte à côte, China dessous.
  { quoi: "Pied de page : repère de la grille des réseaux (08/10)", fichiers: ["Sponsors.dc.html"], n: 1,
    avant: '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));',
    apres: '<div class="ld-familles" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));' },
  { quoi: "Pied de page : nom de chaque famille de réseaux en repère (08/10)", fichiers: ["Sponsors.dc.html"], n: 1,
    avant: '<sc-for list="{{ familles }}" as="f" hint-placeholder-count="3">\n<div style="display:flex;flex-direction:column;gap:8px;min-width:0">',
    apres: '<sc-for list="{{ familles }}" as="f" hint-placeholder-count="3">\n<div data-famille="{{ f.titre }}" style="display:flex;flex-direction:column;gap:8px;min-width:0">' },
  { quoi: "Pied de page mobile : Meta et Global côte à côte, China dessous (08/10)", fichiers: ["Sponsors.dc.html"], n: 1,
    avant: "_ds_bundle.js\"></script>\n</helmet>",
    apres: "_ds_bundle.js\"></script>\n<style>\n" +
      "/* Correction du 08/10 (scripts/construire.mjs) : tant que les trois familles ne tiennent pas sur une ligne,\n" +
      "   Meta et Global côte à côte, China sur toute la largeur en dessous. */\n" +
      "@media (max-width: 769px) {\n" +
      "  .ld-familles { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; column-gap: 20px !important; }\n" +
      "  .ld-familles > [data-famille=\"China\"] { grid-column: 1 / -1; grid-row: 2; }\n" +
      "}\n" +
      "@media (min-width: 770px) { .ld-familles { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; } } /* jamais Meta | China puis Global, même avec une barre de défilement */\n" +
      "</style>\n</helmet>" },
  // Retour de Loan du 27/10 (constantes plus haut : BIENTOT_CSS, VF_CSS_27, DESCENTE_JS, ETUDE_NETTE_DECL…).
  { quoi: "Styles du 27/10 : ruban Coming soon, en-tête et sommaire, The plan / The result, netteté de l'étude, See full details", fichiers: VF, n: 1,
    avant: SOMMAIRE_STYLE_FIN, apres: VF_CSS_27 + SOMMAIRE_STYLE_FIN },
  ...LEGALES.map((f) => ({ quoi: "Pages légales : ruban Coming soon et en-tête plus lisible (27/10)", fichiers: [f], n: 1,
    avant: "</style>\n</helmet>",
    apres: BIENTOT_CSS(".lg-entete > nav:not(.ld-langues)") + ENTETE_GRAND_CSS(".lg-entete", ".lg-entete > nav:not(.ld-langues)") + "</style>\n</helmet>" })),
  { quoi: "Pied de page : réseaux sociaux un peu plus grands (27/10)", fichiers: ["Sponsors.dc.html"], n: 1,
    avant: "</style>\n</helmet>",
    apres: "/* Correction du 27/10 (scripts/construire.mjs) : réseaux sociaux un peu plus grands, à la mesure de l'écran. */\n" +
      ".ld-familles .ld-reseau__nom { font-size: clamp(14px, .25vw + 11px, 16.5px); }\n" +
      ".ld-familles .ld-reseau__glyphe { width: clamp(24px, .3vw + 20px, 28px); height: clamp(24px, .3vw + 20px, 28px); }\n" +
      "</style>\n</helmet>" },
  { quoi: "« See pricing » → « See the options » (27/10)", fichiers: VF, n: 1, avant: ">See pricing<", apres: ">See the options<" },
  ...BOUTON_FORMULE.map(([avant, apres]) => ({ quoi: `Bouton des cartes : « ${avant} » → « ${apres} » (27/10)`, fichiers: VF, n: 2,
    avant: `>${avant}<`, apres: `>${apres}<` })),
  { quoi: "Vitrine : bouton « See full details » sous chaque carte (27/10)", fichiers: VF, n: 3,
    avant: "</article></div>", apres: "</article>" + DETAILS + "</div>" },
  { quoi: "Vitrine : place du lien « See full details » sous les cartes, petits écrans d'ordinateur (27/10)", fichiers: VF, n: 1,
    avant: "(H - cartesV.offsetTop - (mob ? 110 : 150))", apres: "(H - cartesV.offsetTop - (mob ? 110 : 196)) /* 27/10 : + 46 px pour « See full details » */" },
  { quoi: "Vitrine : action du bouton « See full details » (27/10)", fichiers: VF, n: 1,
    avant: "      voirPrix: () => { if (this._vitrine) this._vitrine(true); },\n",
    apres: "      voirPrix: () => { if (this._vitrine) this._vitrine(true); },\n      voirDetails: () => this.descendreFormules(), /* Correction du 27/10 */\n" },
  { quoi: "Descente animée jusqu'aux cartes de la planche II (27/10)", fichiers: VF, n: 1,
    avant: "  aller(id) {\n", apres: DESCENTE_JS + "  aller(id) {\n" },
  { quoi: "Étude nette sur grand écran : taille de pose de la feuille (27/10)", fichiers: VF, n: 1,
    avant: "    let tNet = 0;\n    const peindre = () => {\n", apres: ETUDE_NETTE_DECL + "    let tNet = 0;\n    const peindre = () => {\n" },
  { quoi: "Étude nette sur grand écran : caméra (27/10)", fichiers: VF, n: 1,
    avant: ETUDE_TR_AVANT, apres: ETUDE_TR_APRES },
  // Retour de Loan du 28/10 (constantes plus haut : HAUT_JS, VF_CSS_28, PAPIER_APRES, INCLINE_APRES).
  { quoi: "Styles du 28/10 : sommaire déplié et liens de l'en-tête en haut de page et fondu de la planche II", fichiers: VF, n: 1,
    avant: SOMMAIRE_STYLE_FIN, apres: VF_CSS_28 + SOMMAIRE_STYLE_FIN },
  { quoi: "En haut de page : classe vf-defile (28/10)", fichiers: VF, n: 1,
    avant: "    const suivre = () => {\n      rafS = 0;\n", apres: "    const suivre = () => {\n      rafS = 0;\n" + HAUT_JS },
  { quoi: "Planche II : fondu au-dessus de la planche posée (28/10)", fichiers: VF, n: 1, avant: PAPIER_AVANT, apres: PAPIER_APRES },
  { quoi: "Cartes : inclinaison au survol un peu plus marquée (28/10)", fichiers: VF, n: 1, avant: INCLINE_AVANT, apres: INCLINE_APRES },
  { quoi: "Sommaire : « Opening » à l'ouverture, recalcul quand les ancres sont placées (28/10)", fichiers: VF, n: 1,
    avant: SOMMAIRE_INIT_AVANT, apres: SOMMAIRE_INIT_APRES },
  ...Object.entries(TITRES).map(([f, t]) => ({ quoi: `Titre de l'onglet : « ${t[0]} » (28/10)`, fichiers: [f], n: 1,
    avant: VIEWPORT, apres: TITRE_HTML(t) })),
  { quoi: "Styles du 28/10 (3e retour) : textes du projecteur et du haut de la planche II plus lisibles sur ordinateur", fichiers: VF, n: 1,
    avant: SOMMAIRE_STYLE_FIN, apres: VF_CSS_28C + SOMMAIRE_STYLE_FIN },
  { quoi: "Styles du 29/10 : textes plus lisibles sur mobile, « For everyone / From beginner / To pro » plus grand", fichiers: VF, n: 1,
    avant: SOMMAIRE_STYLE_FIN, apres: VF_CSS_29 + SOMMAIRE_STYLE_FIN },
  // Retour de Loan du 29/10 : jamais d'arrêt net en défilant (constantes plus haut : RALENTI_APRES, POUSSEE_APRES, TITRE_POUSSEE_APRES,
  // ECARTER_DEBUT_APRES, ECARTER_FIN_APRES, DERIVE_APRES, ANCRE_FOR_WHO_APRES, INERTIE_APRES,
  // INERTIE_FIN_APRES, BASCULE_AMORTI_APRES, LENTE_*_APRES, NETTE_APRES, FREIN_APRES).
  { quoi: "Défilement sans arrêt : fonction ralenti (29 et 30/10)", fichiers: VF, n: 1, avant: RALENTI_AVANT, apres: RALENTI_APRES },
  { quoi: "Défilement sans arrêt : projecteur au ralenti au lieu de la tenue du cran, freinage progressif (29 et 30/10)", fichiers: VF, n: 1,
    avant: "s = s1 < s0 ? s1 : s1 < s0 + tenue ? s0 + (s1 - s0) * 0.006 : s1 - tenue * 0.994",
    apres: "s = inertie(ralenti(s1, s0, tenue, mob)) /* Corrections du 29 et 30/10 (scripts/construire.mjs) : ralenti au lieu d'un arrêt, freinage et reprise progressifs, inertie sur écran tactile. */" },
  { quoi: "Défilement sans arrêt : ancre « For who » au retard total du ralenti (30/10)", fichiers: VF, n: 1,
    avant: ANCRE_FOR_WHO_AVANT, apres: ANCRE_FOR_WHO_APRES },
  { quoi: "Défilement sans arrêt : inertie de la caméra du projecteur sur écran tactile (30/10)", fichiers: VF, n: 1,
    avant: INERTIE_AVANT, apres: INERTIE_APRES },
  { quoi: "Défilement sans arrêt : inertie, arrêt de la boucle au démontage (30/10)", fichiers: VF, n: 1,
    avant: INERTIE_FIN_AVANT, apres: INERTIE_FIN_APRES },
  { quoi: "Défilement sans arrêt : bascule yin-yang amortie sur écran tactile (30/10)", fichiers: VF, n: 1,
    avant: BASCULE_AMORTI_AVANT, apres: BASCULE_AMORTI_APRES },
  { quoi: "Défilement sans arrêt : étude allongée sur mobile pour le ralenti du yin-yang (02/11)", fichiers: VF, n: 1, avant: LENTE_CSS_AVANT, apres: LENTE_CSS_APRES },
  { quoi: "Défilement sans arrêt : course de l'étude avec le défilement ajouté (02/11)", fichiers: VF, n: 1, avant: LENTE_UR_AVANT, apres: LENTE_UR_APRES },
  { quoi: "Défilement sans arrêt : yin-yang au ralenti sur mobile (02/11)", fichiers: VF, n: 1, avant: LENTE_XR_AVANT, apres: LENTE_XR_APRES },
  { quoi: "Défilement sans arrêt : tenue de l'étude après le défilement ajouté (02/11)", fichiers: VF, n: 1, avant: LENTE_H_AVANT, apres: LENTE_H_APRES },
  { quoi: "Défilement sans arrêt : photo → croquis après le défilement ajouté (02/11)", fichiers: VF, n: 1, avant: LENTE_X17_AVANT, apres: LENTE_X17_APRES },
  { quoi: "Défilement sans arrêt : l'avancée lente de la caméra ne redessine pas la feuille de l'étude (02/11)", fichiers: VF, n: 1, avant: NETTE_AVANT, apres: NETTE_APRES },
  { quoi: "Freinage d'iPhone / iPad sur 5 écrans avant les cartes en mise en page mobile (02/11)", fichiers: VF, n: 1, avant: FREIN_AVANT, apres: FREIN_APRES },
  { quoi: "Défilement sans arrêt : lente avancée de la caméra sur la page blanche du projecteur (29/10)", fichiers: VF, n: 1,
    avant: POUSSEE_AVANT, apres: POUSSEE_APRES },
  { quoi: "Défilement sans arrêt : les mots de la page blanche avancent avec Loan (29/10, 02/11)", fichiers: VF, n: 1,
    avant: TITRE_POUSSEE_AVANT, apres: TITRE_POUSSEE_APRES },
  { quoi: "Défilement sans arrêt : écart mots / silhouette mesuré sans l'avancée (29/10, 02/11)", fichiers: VF, n: 1,
    avant: ECARTER_DEBUT_AVANT, apres: ECARTER_DEBUT_APRES },
  { quoi: "Défilement sans arrêt : réduction et ancrage des mots gardés pour l'avancée (29/10, 02/11)", fichiers: VF, n: 1,
    avant: ECARTER_FIN_AVANT, apres: ECARTER_FIN_APRES },
  { quoi: "Défilement sans arrêt : lente avancée de la caméra de l'étude pendant la bascule (29/10)", fichiers: VF, n: 1,
    avant: DERIVE_AVANT, apres: DERIVE_APRES },
  // Retour de Loan du 30/10 (constantes plus haut : GUIDE, GUIDE_CSS, GUIDE_HTML, GUIDE_JS, GUIDE_METHODES, GUIDE_VALS).
  { quoi: "Styles du 30/10 : fenêtre « Comment nous allons travailler » et lien de la carte payée", fichiers: VF, n: 1,
    avant: SOMMAIRE_STYLE_FIN, apres: GUIDE_CSS + SOMMAIRE_STYLE_FIN },
  { quoi: "Fenêtre « Comment nous allons travailler » après la fenêtre de paiement (30/10)", fichiers: VF, n: 1,
    avant: '<div class="vf-modale__stripe" ref="{{ refPaiement }}"></div>\n</div>\n</div>\n</sc-if>\n',
    apres: '<div class="vf-modale__stripe" ref="{{ refPaiement }}"></div>\n</div>\n</div>\n</sc-if>\n' + GUIDE_HTML },
  { quoi: "Carte payée : lien « Comment nous allons travailler » (30/10)", fichiers: VF, n: 3,
    avant: '<span class="vf-wa__pied">', apres: '<button type="button" class="vf-guide-lien" onClick="{{ voirGuide }}">{{ guideLien }}</button>\n<span class="vf-wa__pied">' },
  { quoi: "Textes de la fenêtre du 30/10, par formule et par langue", fichiers: VF, n: 1,
    avant: "class Component extends DCLogic {\n", apres: GUIDE_JS + "class Component extends DCLogic {\n" },
  { quoi: "Fenêtre du 30/10 : ouverture et fermeture", fichiers: VF, n: 1,
    avant: "  fermerPaiement() {\n", apres: GUIDE_METHODES + "  fermerPaiement() {\n" },
  { quoi: "Fenêtre du 30/10 : ouverte juste après le paiement et au retour par le lien de l'e-mail", fichiers: VF, n: 1,
    avant: "      if (defiler) setTimeout(() => this.allerFormules(), 300);\n",
    apres: "      if (defiler) { this.ouvrirGuide(); setTimeout(() => this.allerFormules(), 300); } /* Correction du 30/10 : fenêtre « Comment nous allons travailler ». */\n" },
  { quoi: "Fenêtre du 30/10 : valeurs du gabarit", fichiers: VF, n: 1,
    avant: "      refQr: this.refQr,\n", apres: "      refQr: this.refQr,\n" + GUIDE_VALS },
  { quoi: "Fenêtre du 30/10 : touche Échap libérée au démontage", fichiers: VF, n: 1,
    avant: "    if (this._offF) this._offF();\n", apres: "    if (this._offF) this._offF();\n    if (this._offGuide) this._offGuide(); /* Correction du 30/10 */\n" },
  // Retour de Loan du 30/10 : textes et structure des cartes (constantes plus haut : INFOS, FICHES, NOMS, CARTES_CSS_30, INFO_JS).
  ...Object.keys(FICHES).map((k, i) => ({ quoi: `Planche II : nouvelle carte ${k} (30/10)`, fichiers: VF, n: 1, avant: CARTE_AVANT(k, i), apres: CARTE_APRES(k, i) })),
  // 02/11 (Loan : « enlève le Choose · send · receive professional feedback ») : surtitre de la planche II retiré (vertical à gauche
  // sur ordinateur, au-dessus du titre sur mobile). Ses styles (.vfk-tete .vf-eyebrow) restent, sans effet.
  { quoi: "Planche II : surtitre « Choose · send · receive » retiré (02/11)", fichiers: VF, n: 1,
    avant: '<div class="vf-eyebrow vfk-ecrit"><i></i><span>Choose · send · receive professional feedback</span><i></i></div>\n', apres: "" },
  { quoi: "Planche II : analyse adaptée au niveau et aux objectifs (30/10)", fichiers: VF, n: 1,
    avant: LEDE_PLANCHE("The same analysis for all levels: beginner, intermediate, professional."),
    apres: LEDE_PLANCHE("An analysis tailored to your level and your goals: beginner, intermediate or professional.") },
  // « Launch offer » : à côté de la réduction, sur les 6 cartes (vitrine et planche II), plus au-dessus du nom.
  { quoi: "Vitrine : « Launch offer » plus au-dessus du nom (30/10)", fichiers: VF, n: 3,
    avant: '<div class="vf-carte__tete">\n' + OFFRE_TITRE, apres: '<div class="vf-carte__tete">\n' },
  ...Object.keys(FICHES).map((k) => ({ quoi: `« Launch offer » à côté de la réduction, ${k} (30/10)`, fichiers: VF, n: 2,
    avant: `<b>{{ remise${k} }}</b></span>`, apres: `<b>{{ remise${k} }}</b><span class="vf-remise-o">Launch offer</span></span>` })),
  { quoi: "Planche II : cote réelle de l'écart entre deux cartes (30/10)", fichiers: VF, n: 1,
    avant: 'ecrire((xa + xb) / 2, yd - 6, "28", gCotes, { "text-anchor": "middle" });',
    apres: 'ecrire((xa + xb) / 2, yd - 6, String(Math.round(C[1].c.offsetLeft - C[0].c.offsetLeft - C[0].c.offsetWidth)), gCotes, { "text-anchor": "middle" }); /* Correction du 30/10 : écart réel */' },
  ...Object.keys(VITRINE_PUCES).map((k) => ({ quoi: `Vitrine : paragraphe de la formule au lieu des puces, ${k} (31/10)`, fichiers: VF, n: 1,
    avant: '<div class="vf-liste">\n' + VITRINE_PUCES[k].map(PUCE).join("") + "</div>", apres: `<div class="vf-liste">\n<p class="vfp-phrase">${VITRINE_PHRASE[k]}</p>\n</div>` })),
  ...Object.values(FICHES).map((f) => ({ quoi: `Vitrine : nom « ${f.nom.replace("<br>", " ")} » (30/10)`, fichiers: VF, n: 1,
    avant: `<div class="vf-nom">${f.ancien[0]}</div>`, apres: `<div class="vf-nom">${f.nom}</div>` })),
  ...Object.entries(NOMS).map(([k, [avant, nom, achat]]) => ({ quoi: `Nom de la formule ${k} : « ${nom} » (30/10)`, fichiers: VF, n: 1,
    avant: `  ${k}: { nom: "${avant}", prix:`, apres: `  ${k}: { nom: "${nom}", achatEn: "${achat}", prix:` })),
  { quoi: "Message WhatsApp : nom de la formule avec son article (30/10)", fichiers: VF, n: 1,
    avant: '"Hi Loan, I just purchased the " + f.nom + ".', apres: '"Hi Loan, I just purchased " + f.achatEn + ".' },
  { quoi: "Carte payée : 2 vidéos de 2 min ou 3 de 45 s, comme sur les cartes (30/10)", fichiers: VF, n: 3,
    avant: "<span>3 videos under 30 s, or 2 under 2 minutes.</span>", apres: `<span>${ENVOI}.</span>` },
  { quoi: "Planche II : cartes entières à l'écran, textes ajustés (30/10)", fichiers: VF, n: 1, avant: ECHELLE_AVANT, apres: ECHELLE_APRES },
  { quoi: "Styles du 30/10 : cartes de la planche II, bento et bulles ⓘ", fichiers: VF, n: 1,
    avant: SOMMAIRE_STYLE_FIN, apres: CARTES_CSS_30 + SOMMAIRE_STYLE_FIN },
  { quoi: "Bulles ⓘ des cartes : script (30/10)", fichiers: VF, n: 1,
    avant: '<script src="./support.js"></script>', apres: EGALISER_JS + INFO_JS + '<script src="./support.js"></script>' },
  { quoi: "Planche II : effet loupe des puces et textes des rectangles, styles (01/11)", fichiers: VF, n: 1, avant: SOMMAIRE_STYLE_FIN, apres: LOUPE_CSS + BENTO_CSS + SOMMAIRE_STYLE_FIN },
  { quoi: "Planche II : effet loupe des puces et textes des rectangles, scripts (01/11)", fichiers: VF, n: 1,
    avant: '<script src="./support.js"></script>', apres: LOUPE_JS + BENTO_JS + '<script src="./support.js"></script>' },
  { quoi: "« Tous les échanges se font sur WhatsApp » sous les cartes (31/10)", fichiers: VF, n: 1, avant: WHATSAPP_AVANT, apres: WHATSAPP_APRES },
  { quoi: "Suivi Performance : 3 places (capacité affichée avant la réponse de l'API, 30/10)", fichiers: VF, n: 1,
    avant: "const PLACES = { pack: 6, prog: 2 };", apres: "const PLACES = { pack: 6, prog: 3 }; /* Correction du 30/10 : 3 places (cloudflare/api-worker.js) */" },
  ...CGV_30.map(([avant, apres, n = 1]) => ({ quoi: `CGV du 30/10 : ${apres.replace(/<[^>]+>/g, "").slice(0, 70)}…`, fichiers: ["CGV.dc.html"], n, avant, apres })),
];

// --- Cache HTTP (§ 3) : fichier lu par Cloudflare, jamais servi --------------
// Par défaut Cloudflare demande au navigateur de revalider chaque fichier (HTML, CSS,
// support.js, _ds_bundle.js…). On allonge seulement ce qui est sûr.
const HEADERS = `# Généré par scripts/construire.mjs — ne pas modifier à la main.
# Scripts versionnés par ?v= dans les pages : cache long.
/chargement.js
  Cache-Control: public, max-age=31536000, immutable
/header-flottant.js
  Cache-Control: public, max-age=31536000, immutable
/poussiere-or.js
  Cache-Control: public, max-age=31536000, immutable
/blueprint.js
  Cache-Control: public, max-age=31536000, immutable
# Bibliothèques servies par le site, versionnées dans leur chemin (vendor/react-18.3.1/…) : cache long.
/vendor/*
  Cache-Control: public, max-age=31536000, immutable
# Images et polices non versionnées : cache modéré (1 jour).
/assets/*
  Cache-Control: public, max-age=86400
/${DS}/assets/*
  Cache-Control: public, max-age=86400
`;

// ---------------------------------------------------------------------------
const erreurs = [];
const avert = [];
const rel = (p) => path.relative(RACINE, p).split(path.sep).join("/");

function copier(src, dst) {
  const st = fs.statSync(src);
  if (st.isDirectory()) {
    if (EXCLUS.includes(rel(src))) return;
    fs.mkdirSync(dst, { recursive: true });
    for (const nom of fs.readdirSync(src)) {
      if (IGNORES.includes(nom)) continue;
      copier(path.join(src, nom), path.join(dst, nom));
    }
  } else {
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
  }
}

fs.rmSync(PUBLIC, { recursive: true, force: true });
fs.mkdirSync(PUBLIC);

for (const f of [...PAGES, ...SCRIPTS, ...ICONES, ...DOSSIERS]) {
  const src = path.join(RACINE, f);
  if (!fs.existsSync(src)) erreurs.push(`Fichier manquant dans l'export : ${f}`);
  else copier(src, path.join(PUBLIC, f));
}

const indexExport = path.join(RACINE, "index.html");
if (fs.existsSync(indexExport) &&
    !fs.readFileSync(indexExport).equals(fs.readFileSync(path.join(RACINE, "Video Feedback.dc.html")))) {
  avert.push("index.html de l'export différait de Video Feedback.dc.html : remplacé par la copie exacte.");
}

// Applique une correction à un texte ; renvoie le texte corrigé (inchangé en cas d'erreur, signalée).
function corriger(t, c, f, bavard = true) {
  const n = t.split(c.avant).length - 1;
  // Ajout (le texte corrigé contient l'original) déjà présent, ou original disparu au profit du texte corrigé.
  const deja = c.apres && t.includes(c.apres) && (c.apres.includes(c.avant) || n === 0);
  if (deja) { if (bavard) console.log(`Correction « ${c.quoi} » : déjà dans l'export`); return t; }
  if (n === c.n) { if (bavard) console.log(`Correction « ${c.quoi} » : ${n} remplacement(s)`); return t.split(c.avant).join(c.apres); }
  erreurs.push(`Correction « ${c.quoi} » : ${n} occurrence(s) dans ${f} au lieu de ${c.n} — l'export a changé, à revoir`);
  return t;
}

// Corrections de contenu, optimisations de performance (scripts/optimisations.mjs), corrections Safari retenues
// (scripts/safari.mjs), puis version française (scripts/traduction-fr.mjs, appliquée au texte final, sans un message par texte) ;
// sur l'adresse de test seulement, l'aperçu de la carte payée (APERCU_ESSAI).
for (const c of [...CORRECTIONS, ...OPTIMISATIONS, ...SAFARI, ...TRADUCTION, ...(ESSAI ? APERCU_ESSAI : [])]) {
  for (const f of c.fichiers) {
    const p = path.join(PUBLIC, f);
    if (!fs.existsSync(p)) continue;
    const t = fs.readFileSync(p, "utf8"), u = corriger(t, c, f, !TRADUCTION.includes(c));
    if (u !== t) fs.writeFileSync(p, u);
  }
}
console.log(`Version française : ${TRADUCTION.length} remplacements (scripts/traduction-fr.mjs)`);

// Adresse de test : pages de comparaison, construites depuis l'export avec les mêmes corrections de contenu et
// optimisations que la page publiée, plus seulement les corrections Safari indiquées (scripts/safari.mjs).
const VF_EXPORT = "Video Feedback.dc.html";
const idsUtilises = [...SAFARI_IDS, ...(ESSAI ? Object.values(VARIANTES_ESSAI).flat() : [])];
if (ESSAI) {
  for (const [nom, ids] of Object.entries(VARIANTES_ESSAI)) {
    let t = fs.readFileSync(path.join(RACINE, VF_EXPORT), "utf8");
    for (const c of [...CORRECTIONS, ...OPTIMISATIONS, ...SAFARI_TOUTES.filter((x) => ids.includes(x.id))])
      if (c.fichiers.includes(VF_EXPORT)) t = corriger(t, c, nom, false);
    fs.writeFileSync(path.join(PUBLIC, nom), t);
    console.log(`Essai : ${nom} (corrections Safari : ${ids.join(", ") || "aucune"})`);
  }
}
if (idsUtilises.includes("textures")) {
  const perimees = controleTextures(RACINE);
  if (perimees.length) erreurs.push(`Textures calculées sur d'anciennes règles CSS (${perimees.join(", ")}) : relancer node scripts/textures.mjs`);
}
for (const f of fichiersSafari(idsUtilises)) {
  const de = path.join(RACINE, f.de);
  if (!fs.existsSync(de)) { erreurs.push(`Correction Safari : ${f.de} introuvable (node scripts/textures.mjs)`); continue; }
  fs.mkdirSync(path.dirname(path.join(PUBLIC, f.vers)), { recursive: true });
  fs.copyFileSync(de, path.join(PUBLIC, f.vers));
}

// Fichiers ajoutés ou remplacés par les optimisations (scripts/optimisations.mjs), après contrôle.
const empreinte = (algo, f, enc = "hex") => crypto.createHash(algo).update(fs.readFileSync(f)).digest(enc);
for (const f of FICHIERS) {
  const de = path.join(RACINE, f.de), vers = path.join(PUBLIC, f.vers);
  if (!fs.existsSync(de)) { erreurs.push(`Optimisation « ${f.quoi} » : ${f.de} introuvable (npm install ?)`); continue; }
  if (f.exige) {
    const t = fs.readFileSync(path.join(PUBLIC, f.exige.fichier), "utf8"), manque = f.exige.textes.filter((x) => !t.includes(x));
    if (manque.length) { erreurs.push(`Optimisation « ${f.quoi} » : ${f.exige.fichier} ne contient plus ${manque.join(", ")} — le moteur a changé, à revoir`); continue; }
  }
  if (f.sri) {
    const m = fs.readFileSync(path.join(PUBLIC, f.sri.fichier), "utf8").match(f.sri.motif);
    if (!m) { erreurs.push(`Optimisation « ${f.quoi} » : empreinte introuvable dans ${f.sri.fichier} — le moteur a changé, à revoir`); continue; }
    if ("sha384-" + empreinte("sha384", de, "base64") !== m[1]) { erreurs.push(`Optimisation « ${f.quoi} » : ${f.de} diffère du fichier attendu par ${f.sri.fichier}`); continue; }
  }
  if (f.original) {
    if (!fs.existsSync(vers) || empreinte("sha256", vers) !== f.original) {
      avert.push(`Optimisation « ${f.quoi} » ignorée : ${f.vers} a changé dans l'export (version optimisée à refaire)`);
      continue;
    }
  }
  fs.mkdirSync(path.dirname(vers), { recursive: true });
  fs.copyFileSync(de, vers);
  console.log(`Optimisation « ${f.quoi} » : ${f.vers}`);
}

// index.html = copie octet pour octet de Video Feedback corrigée : https://loandrouard.com/ affiche la même page.
fs.copyFileSync(path.join(PUBLIC, "Video Feedback.dc.html"), path.join(PUBLIC, "index.html"));

// Diagnostic TEMPORAIRE de l'adresse de test (optimise/diag.js) : inséré juste après l'écran de chargement.
if (ESSAI) {
  const diag = fs.readFileSync(path.join(RACINE, "optimise/diag.js"));
  const v = crypto.createHash("sha256").update(diag).digest("hex").slice(0, 8);
  fs.writeFileSync(path.join(PUBLIC, "diag.js"), diag);
  for (const f of ["index.html", "Video Feedback.dc.html", ...Object.keys(VARIANTES_ESSAI)]) {
    const p = path.join(PUBLIC, f), t = fs.readFileSync(p, "utf8"), m = t.match(/<script src="chargement\.js\?v=[^"]*"><\/script>\n/);
    if (!m) { erreurs.push(`Essai : écran de chargement introuvable dans ${f}`); continue; }
    fs.writeFileSync(p, t.replace(m[0], m[0] + `<script src="diag.js?v=${v}"></script>\n`));
  }
  console.log(`Essai : diagnostic diag.js?v=${v} (adresse de test uniquement)`);
  // Lecture seule des résultats gardés dans le navigateur par le diagnostic (sans le site ni le diagnostic).
  fs.copyFileSync(path.join(RACINE, "optimise/resultats.html"), path.join(PUBLIC, "resultats.html"));
  console.log("Essai : resultats.html (lecture des résultats du diagnostic)");
}

fs.writeFileSync(path.join(PUBLIC, "_headers"), HEADERS);

// --- Contrôles ---------------------------------------------------------------
function lister(d) {
  return fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? lister(path.join(d, e.name)) : [path.join(d, e.name)]);
}
const fichiers = lister(PUBLIC);
const textes = fichiers.filter((f) => /\.(html|js|css|svg)$/.test(f));

for (const f of textes) {
  const t = fs.readFileSync(f, "utf8");
  const nom = path.relative(PUBLIC, f);
  if (/(Home|Press)\.dc\.html/.test(t)) erreurs.push(`${nom} mentionne Home.dc.html ou Press.dc.html`);
  if (/press-hd|image-slot\.js|zip-photos\.js|uploads\//.test(t) && !nom.endsWith("support.js"))
    avert.push(`${nom} référence un fichier non publié (press-hd, image-slot, zip-photos ou uploads)`);
  if (/\.html$/.test(f)) {
    if (t.includes("loandrouard@gmail.com")) erreurs.push(`${nom} contient l'adresse provisoire loandrouard@gmail.com`);
    if (t.includes("À COMPLÉTER")) erreurs.push(`${nom} contient encore « À COMPLÉTER »`);
    // Les liens d'en-tête Home / The Journey / Press (Accueil / L’histoire / Presse en français) doivent rester des <span>
    // désactivés ; le texte d'un lien est lu bloc de langue par bloc de langue (sc-if de scripts/traduction-fr.mjs).
    for (const m of t.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/g))
      for (const x of m[1].split(/<\/?sc-if\b[^>]*>/).map((s) => s.trim()))
        if (/^(Home|The Journey|Press.*|Accueil|L’histoire|Presse.*)$/.test(x)) erreurs.push(`${nom} : « ${x} » est un lien actif`);
  }
}

// Les corrections ne doivent pas déséquilibrer la structure de la page (balises ouvertes / fermées).
const solde = (t) => ["div", "sc-if", "article", "section"].map((b) =>
  (t.match(new RegExp("<" + b + "\\b", "g")) || []).length - t.split("</" + b + ">").length + 1).join(",");
for (const f of new Set([...CORRECTIONS, ...OPTIMISATIONS, ...SAFARI, ...TRADUCTION].flatMap((c) => c.fichiers))) {
  const avantC = solde(fs.readFileSync(path.join(RACINE, f), "utf8")), apresC = solde(fs.readFileSync(path.join(PUBLIC, f), "utf8"));
  if (avantC !== apresC) erreurs.push(`${f} : les corrections déséquilibrent les balises (${avantC} → ${apresC})`);
}
if (ESSAI) for (const f of Object.keys(VARIANTES_ESSAI)) {
  const avantC = solde(fs.readFileSync(path.join(RACINE, VF_EXPORT), "utf8")), apresC = solde(fs.readFileSync(path.join(PUBLIC, f), "utf8"));
  if (avantC !== apresC) erreurs.push(`${f} : les corrections déséquilibrent les balises (${avantC} → ${apresC})`);
}

// Le script de chaque page doit rester du JavaScript valide : une correction d'ajout (cartes, hautVisible…) appliquée sur un
// export qui contient déjà ce code sous une autre forme redéclarerait ses constantes, et le moteur n'afficherait plus que le
// gabarit (projecteur, étude, cartes et paiement inertes). Compilation seule, comme le moteur (new Function), sans exécution.
for (const f of [...PAGES, "index.html", ...(ESSAI ? Object.keys(VARIANTES_ESSAI) : [])]) {
  const t = fs.readFileSync(path.join(PUBLIC, f), "utf8"), blocs = [...t.matchAll(/<script type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/g)];
  if (blocs.length !== (t.match(/<script type="text\/x-dc"/g) || []).length) erreurs.push(`${f} : script de la page illisible par le contrôle`);
  for (const m of blocs) { try { new Function(m[1]); } catch (e) { erreurs.push(`${f} : JavaScript invalide après corrections (${e.message}) — correction appliquée deux fois ?`); } }
}

// Le diagnostic et les pages de comparaison ne doivent JAMAIS partir en production (construction sans ESSAI=1).
if (!ESSAI) {
  for (const f of fichiers) {
    const nom = path.relative(PUBLIC, f);
    if (nom === "diag.js" || nom === "resultats.html" || Object.keys(VARIANTES_ESSAI).includes(nom)) erreurs.push(`${nom} : fichier de l'adresse de test dans une construction normale`);
    if (/\.html$/.test(f) && fs.readFileSync(f, "utf8").includes("diag.js")) erreurs.push(`${nom} : référence au diagnostic de test (diag.js)`);
    if (/\.html$/.test(f) && fs.readFileSync(f, "utf8").includes('get("apercu")')) erreurs.push(`${nom} : aperçu de l'adresse de test (?apercu=)`);
  }
}

// Une page sans blueprint.js (retiré par une optimisation) ne doit pas utiliser ses effets.
for (const f of PAGES) {
  const t = fs.readFileSync(path.join(PUBLIC, f), "utf8");
  if (!t.includes("blueprint.js") && /data-blueprint|data-parallax|class="[^"]*\bbp-img\b/.test(t))
    erreurs.push(`${f} utilise blueprint.js (data-blueprint, data-parallax ou bp-img) mais ne le charge plus : retirer l'optimisation « blueprint »`);
}

// apercuPaye doit valoir "none" par défaut (sinon un faux numéro s'affiche).
for (const f of ["Video Feedback.dc.html", "index.html", ...(ESSAI ? Object.keys(VARIANTES_ESSAI) : [])]) {
  const t = fs.readFileSync(path.join(PUBLIC, f), "utf8");
  const m = t.match(/apercuPaye&quot;:\{[^}]*?&quot;default&quot;:&quot;([^&]*)&quot;/);
  if (!m) erreurs.push(`${f} : prop apercuPaye introuvable`);
  else if (m[1] !== "none") erreurs.push(`${f} : apercuPaye vaut "${m[1]}" au lieu de "none"`);
}

// Références locales statiques (src / href / url()) qui pointeraient vers un fichier absent.
for (const f of textes) {
  const t = fs.readFileSync(f, "utf8");
  // Liens dans la langue de la page (scripts/traduction-fr.mjs) : vérifiés sans leur suffixe ?lang=fr.
  const refs = [...t.replaceAll('{{ suffixeLangue }}"', '"').matchAll(/(?:src|href)="([^"#{}]+)"|url\(\s*['"]?([^'")#{}]+)['"]?\s*\)/g)]
    .map((m) => m[1] || m[2]);
  for (const r of refs) {
    if (/^(https?:|mailto:|tel:|data:|blob:|\/\/|javascript:|%23)/.test(r) || r.includes("${")) continue;
    const chemin = decodeURIComponent(r.split(/[?#]/)[0]);
    if (!chemin) continue;
    const base = f.endsWith(".html") || f.endsWith(".js") ? PUBLIC : path.dirname(f);
    if (!fs.existsSync(path.resolve(base, chemin)))
      avert.push(`${path.relative(PUBLIC, f)} référence « ${r} » absent de public/`);
  }
}

const taille = fichiers.reduce((s, f) => s + fs.statSync(f).size, 0);
console.log(`public/ : ${fichiers.length} fichiers, ${(taille / 1e6).toFixed(1)} Mo`);
for (const a of [...new Set(avert)]) console.log("ATTENTION : " + a);
for (const e of erreurs) console.error("ERREUR : " + e);
if (erreurs.length) process.exit(1);
console.log(ESSAI ? "Construction OK (ADRESSE DE TEST : diagnostic et pages de comparaison inclus, ne pas publier sur loandrouard.com)." : "Construction OK.");
// NE PAS importer ce fichier pour lire CORRECTIONS : il efface et reconstruit public/ dès son chargement.
export { CORRECTIONS };
