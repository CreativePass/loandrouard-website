// Construit public/ (le dossier mis en ligne) par COPIE des fichiers de l'export.
// Les originaux ne sont jamais modifiés. Liste blanche : PASSATION-CLAUDE-CODE.md § 1.
// Usage : npm run construire
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { OPTIMISATIONS, FICHIERS } from "./optimisations.mjs";
import { SAFARI, SAFARI_IDS, SAFARI_TOUTES, VARIANTES_ESSAI, fichiersSafari, controleTextures } from "./safari.mjs";

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
  .vfk-c[data-grand] { position: fixed; inset: 0; z-index: 2; display: flex; flex-direction: column; align-items: center; overflow-y: auto; overscroll-behavior: contain; padding: calc(env(safe-area-inset-top, 0px) + 72px) 16px calc(env(safe-area-inset-bottom, 0px) + 36px); perspective: none; }
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
/* 17/10 (mobile) : tant que les cartes n'ont pas été vues, la page se termine provisoirement juste sous elles (classe vfk-borne, hauteur
   --vfk-borne, posées par le script) : un lancer, même très fort ou enchaîné, s'y arrête comme en bas de page, avec le freinage et le
   rebond du navigateur ; la suite (bas de page) réapparaît dessous à la fin du retournement + 0,5 s. Ni aimantation ni script pendant le
   défilement : un script qui ramenait la page se battait contre l'élan de Safari (secousses), l'aimantation sautait si l'on touchait l'écran. */
html.vfk-borne .vf { max-height: var(--vfk-borne); overflow-y: clip; }
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
      const rang = k.c.parentNode; rang.style.gridTemplateRows = C.map((x) => x.c.getBoundingClientRect().height + "px").join(" "); /* rangées figées à leur hauteur exacte : les autres cartes ne remontent pas (getComputedStyle arrondit, et le dessin était refait pour rien à la fermeture) */
      sec.setAttribute("data-grand", ""); k.c.setAttribute("data-grand", ""); racine.classList.add("vfk-ouverte"); k.c.appendChild(fermerBtn); k.c.scrollTop = 0;
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
        if (!grand) { k.c.parentNode.style.gridTemplateRows = ""; sec.removeAttribute("data-grand"); racine.classList.remove("vfk-ouverte"); if (remesurer || derive()) { remesurer = false; refaire(); cle = cleDims(); } }
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
    const PAUSE = 500, vf = sec.closest(".vf");
    let tenue = false, finPage = 0, tLibre = 0;
    const libre = () => { clearTimeout(tLibre); tLibre = 0; finPage = 0; racine.classList.remove("vfk-borne"); };
    /* Hauteur visible barre déployée (stable quand la barre de Safari se replie). */
    const hautVue = () => (typeof hautVisible === "function" && hautVisible(racine)) || window.innerHeight;
    /* Fin de page provisoire, relevée avec le dessin ; jamais au-dessus de l'écran (la page ne raccourcit pas sous le lecteur). */
    const poserBorne = () => {
      if (tenue || calme || !vf || !G || G.rang || !petit.matches || window.__vfkPayee !== undefined) { if (!tenue && finPage) libre(); return; }
      const vh = hautVue(), hd = document.querySelector(".vf > .ld-header"), hh = hd ? hd.offsetHeight : 0, y = window.scrollY;
      const a = C[0].c.getBoundingClientRect(), b = C[C.length - 1].c.getBoundingClientRect();
      const fin = y + Math.max(Math.min((a.top + b.bottom - hh - vh) / 2, a.top - hh - 14) + vh, b.bottom + 14);
      if (y + window.innerHeight > fin - 1) return;
      finPage = Math.round(fin); racine.style.setProperty("--vfk-borne", Math.round(fin - (vf.getBoundingClientRect().top + y)) + "px"); racine.classList.add("vfk-borne");
    };
    /* À chaque défilement (début de maj) : arrivé en bas provisoire avant le départ de la dernière carte (petit écran), la cascade part ;
       dès que la dernière carte est partie, la fin provisoire est retirée à la fin de son retournement + 0,5 s. */
    const tenir = () => {
      if (tenue || !finPage) return;
      if (window.__vfkPayee !== undefined || calme || !petit.matches) { tenue = true; libre(); return; }
      const d = C[C.length - 1], now = performance.now();
      if (!d.t0 && window.scrollY + window.innerHeight >= finPage - 2) {
        C.forEach((k, i) => { if (!k.t0) k.t0 = Math.max(now, i && C[i - 1].t0 ? C[i - 1].t0 + LAG / VIT * 1000 : 0); });
        lancer();
      }
      if (!d.t0) return;
      tenue = true; tLibre = setTimeout(libre, Math.max(0, d.t0 + 3.8 / VIT * 1000 + PAUSE - now));
    };
    sec.addEventListener("click", onClicGrand);
    window.addEventListener("keydown", onToucheGrand, true);
    if (petit.addEventListener) petit.addEventListener("change", onPetit);
    const offGrand = () => { fermerCarte(true); libre(); clearTimeout(tRecal); sec.removeEventListener("click", onClicGrand); window.removeEventListener("keydown", onToucheGrand, true); if (petit.removeEventListener) petit.removeEventListener("change", onPetit); };
`;
const CORRECTIONS = [
  {
    quoi: "Crédits photo des mentions légales (01/10)",
    fichiers: ["Legal.dc.html"], n: 2,
    avant: '<mark class="lg-todo">[À COMPLÉTER : photographes]</mark>',
    apres: "David GROUARD",
  },
  // Cartes des formules (02/10).
  { quoi: "Prix Single : one full analysis", fichiers: VF, n: 2,
    avant: "49&nbsp;€ · one routine", apres: "49&nbsp;€ · one full analysis" },
  { quoi: "Prix Pack : 3 full analyses", fichiers: VF, n: 2,
    avant: "129&nbsp;€ · six months", apres: "129&nbsp;€ · 3 full analyses" },
  { quoi: "Prix Programme : weekly coaching", fichiers: VF, n: 2,
    avant: "499&nbsp;€ · every 3 months", apres: "499&nbsp;€ · weekly coaching" },
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
    apres: '  allerFormules() {\n    if (document.querySelector("#formules .vfk-c[data-grand]")) return; /* Correction du 08/10 : paiement fait depuis la carte ouverte, elle montre déjà WhatsApp. */\n    window.__vfkPayee = true; /* Correction du 08/10 : sur mobile, la petite carte payée s\'ouvrira en grand une fois retournée. */\n    document.documentElement.classList.remove("vfk-borne"); /* Correction du 17/10 : pas d\'arrêt sur les cartes au retour du paiement. */\n    const el = document.getElementById("formules");\n' },
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
    apres: "      if (!G.rang) tenir(); /* Corrections du 15 et du 17/10 (scripts/construire.mjs) : sur mobile, arrêt sur les cartes. */\n" +
      "      const vh = window.innerHeight, r = sec.getBoundingClientRect();\n      if (r.top > vh * 2.5 || r.bottom < -vh * 0.5) return;\n" },
  // « See pricing » plus tôt (retour de Loan du 17/10 : « il faut qu'il s'affiche un petit peu plus rapidement ») : départ à 4,2 s au
  // lieu de 5,2 s, montée en 2,2 s au lieu de 2,6 s (lisible vers 5 s, à la fin de l'allumage du projecteur, au lieu de 6,3 s).
  { quoi: "See pricing affiché plus tôt (17/10)", fichiers: VF, n: 1,
    avant: "animation: vfp-affiche-in 2.6s cubic-bezier(.16,.6,.2,1) 5.2s both;",
    apres: "animation: vfp-affiche-in 2.2s cubic-bezier(.16,.6,.2,1) 4.2s both;" },
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

for (const f of [...PAGES, ...SCRIPTS, ...DOSSIERS]) {
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

// Corrections de contenu, optimisations de performance (scripts/optimisations.mjs), puis corrections Safari retenues
// (scripts/safari.mjs).
for (const c of [...CORRECTIONS, ...OPTIMISATIONS, ...SAFARI]) {
  for (const f of c.fichiers) {
    const p = path.join(PUBLIC, f);
    if (!fs.existsSync(p)) continue;
    const t = fs.readFileSync(p, "utf8"), u = corriger(t, c, f);
    if (u !== t) fs.writeFileSync(p, u);
  }
}

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
    // Les liens d'en-tête Home / The Journey / Press doivent rester des <span> désactivés.
    for (const m of t.matchAll(/<a\b[^>]*>\s*(Home|The Journey|Press[^<]*)\s*<\/a>/g))
      erreurs.push(`${nom} : « ${m[1]} » est un lien actif`);
  }
}

// Les corrections ne doivent pas déséquilibrer la structure de la page (balises ouvertes / fermées).
const solde = (t) => ["div", "sc-if", "article", "section"].map((b) =>
  (t.match(new RegExp("<" + b + "\\b", "g")) || []).length - t.split("</" + b + ">").length + 1).join(",");
for (const f of new Set([...CORRECTIONS, ...OPTIMISATIONS, ...SAFARI].flatMap((c) => c.fichiers))) {
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
  const refs = [...t.matchAll(/(?:src|href)="([^"#{}]+)"|url\(\s*['"]?([^'")#{}]+)['"]?\s*\)/g)]
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
