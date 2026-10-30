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

// --- Retour de Loan du 30/10 -------------------------------------------------------------------------------------
// « J'aimerais que ce message s'affiche quand ils ouvrent la page » : le texte de Loan sur le fonctionnement de WhatsApp
// s'ouvre dans une fenêtre juste après le paiement (et au retour par le lien de l'e-mail, /acces/…), par-dessus la carte
// payée ; un lien de la carte la rouvre. Un texte par formule (délais du site, une vidéo / trois / une par semaine) et par
// langue (anglais traduit par Claude). Écrit pour convenir aussi à un client qui reprend une formule (« votre vidéo »,
// pas « votre première vidéo »). Section : texte commun, ou { single, pack, prog } ; {delai} = délai de la formule (FORMULES).
// Version d'essai, à faire valider par Loan sur l'adresse de test (aperçu : ?apercu=single, pack ou prog).
const GUIDE = {
  fr: {
    titre: "Il est l’heure de passer au niveau supérieur 🤸‍♂️",
    intro: "Je suis heureux de vous accompagner dans votre progression. Voici comment nous allons travailler ensemble sur WhatsApp :",
    sections: [
      { icone: "🎥", titre: "Votre vidéo", texte: {
        single: "Envoyez-moi votre vidéo. Je vous transmettrai une analyse personnalisée et des exercices ciblés, en fonction de vos priorités.",
        pack: "Envoyez-moi une vidéo pour chacune de vos 3 analyses, valables 6 mois à partir de la première. Je vous transmettrai à chaque fois une analyse personnalisée et des exercices ciblés, en fonction de vos priorités.",
        prog: "Envoyez-moi une vidéo par semaine. Je vous transmettrai une analyse personnalisée et des exercices ciblés, en fonction de vos priorités." } },
      { icone: "💬", titre: "Vos questions", texte: {
        single: "Après l’analyse, un échange de questions-réponses est inclus pour vous aider à appliquer mes conseils. Merci de regrouper vos questions dans un seul message afin que je puisse vous apporter une réponse complète.",
        pack: "Après chaque analyse, un échange de questions-réponses est inclus pour vous aider à appliquer mes conseils. Merci de regrouper vos questions dans un seul message afin que je puisse vous apporter une réponse complète.",
        prog: "Après chaque analyse, un échange de questions-réponses est inclus pour vous aider à appliquer mes conseils. Merci de regrouper vos questions dans un seul message afin que je puisse vous apporter une réponse complète." } },
      { icone: "⏳", titre: "Mes réponses",
        texte: "Je consulte WhatsApp sur des créneaux dédiés et vous réponds sous {delai}, du lundi au dimanche. Vous pouvez m’écrire au moment qui vous convient ; les échanges se font en différé." },
      { icone: "📈", titre: { single: "Après l’analyse", pack: "Entre deux analyses", prog: "Entre deux analyses" }, texte: {
        single: "Prenez le temps de pratiquer les exercices et de noter vos observations. Pour faire analyser une nouvelle vidéo, il vous suffira de reprendre une formule sur le site.",
        pack: "Prenez le temps de pratiquer les exercices et de noter vos observations. Les nouvelles vidéos et les sujets nécessitant une analyse complémentaire seront traités lors de votre prochaine analyse.",
        prog: "Prenez le temps de pratiquer les exercices et de noter vos observations. Les nouvelles vidéos et les sujets nécessitant une analyse complémentaire seront traités lors du prochain rendez-vous hebdomadaire." } },
    ],
    fin: "Ce fonctionnement me permet de consacrer toute l’attention nécessaire à votre progression.",
    bientot: "À très bientôt pour votre vidéo !",
    signature: "Loan ☀️",
    lien: "Comment nous allons travailler", fermer: "Fermer", whatsapp: "Ouvrir WhatsApp",
  },
  en: {
    titre: "Time to level up 🤸‍♂️",
    intro: "I’m happy to support you in your progress. Here’s how we’ll work together on WhatsApp:",
    sections: [
      { icone: "🎥", titre: "Your video", texte: {
        single: "Send me your video. I’ll send you a personalized analysis and targeted exercises, based on your priorities.",
        pack: "Send me one video for each of your 3 analyses, valid for 6 months from the first one. Each time, I’ll send you a personalized analysis and targeted exercises, based on your priorities.",
        prog: "Send me one video a week. I’ll send you a personalized analysis and targeted exercises, based on your priorities." } },
      { icone: "💬", titre: "Your questions", texte: {
        single: "After the analysis, a round of questions and answers is included to help you put my advice into practice. Please group your questions in a single message so I can give you a complete answer.",
        pack: "After each analysis, a round of questions and answers is included to help you put my advice into practice. Please group your questions in a single message so I can give you a complete answer.",
        prog: "After each analysis, a round of questions and answers is included to help you put my advice into practice. Please group your questions in a single message so I can give you a complete answer." } },
      { icone: "⏳", titre: "My replies",
        texte: "I check WhatsApp at set times and reply within {delai}, Monday to Sunday. You can write to me whenever suits you; we don’t need to be online at the same time." },
      { icone: "📈", titre: { single: "After the analysis", pack: "Between analyses", prog: "Between analyses" }, texte: {
        single: "Take the time to practice the exercises and note what you observe. To have a new video analyzed, simply get another package on the site.",
        pack: "Take the time to practice the exercises and note what you observe. New videos and topics that need further analysis will be covered in your next analysis.",
        prog: "Take the time to practice the exercises and note what you observe. New videos and topics that need further analysis will be covered at our next weekly session." } },
    ],
    fin: "Working this way lets me give your progress all the attention it deserves.",
    bientot: "Looking forward to your video!",
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
.vf-guide__actions { display: flex; flex-wrap: wrap; align-items: center; gap: 14px 24px; margin-top: 24px; }
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
  .vf-guide__pied { grid-area: pied; display: flex; align-items: flex-end; justify-content: space-between; gap: 16px 40px; margin-top: 16px; }
  .vf-guide__actions { flex: none; margin-top: 0; }
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
