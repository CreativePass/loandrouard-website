/* Écran de chargement — posé dans le <head> AVANT support.js, sur chaque page.
   Couvre la page en blanc dès le premier rendu ; les mots et le pourcentage n'apparaissent que si
   le chargement dépasse SEUIL. Le pourcentage mesure ce que le premier écran attend réellement :
   rendu du contenu, polices, feuilles et scripts, images et vidéos visibles. La police est celle
   du site (même fichier, donc aucun octet de plus). Animations en opacité/transform uniquement :
   elles restent fluides même quand la page occupe le fil principal. */
(() => {
  if (window.__ldChargement) return; window.__ldChargement = 1;
  const d = document, h = d.documentElement, t0 = performance.now();
  const SEUIL = 650, MAX = 20000;
  const MOTS = ["Wushu", "Discipline", "Precision", "Performance", "Vision", "Heritage", "Journey"];
  const base = (d.currentScript && d.currentScript.src) || location.href;
  const police = new URL("_ds/loan-drouard-design-system-06a79c98-aed9-4ca8-8b81-69bb72fcc98a/assets/fonts/cinzel-400-700-latin.woff2", base).href;
  try { performance.setResourceTimingBufferSize(1500); } catch (e) {}

  const st = d.createElement("style");
  st.textContent = `@font-face{font-family:'LD Cinzel';font-weight:400 700;font-display:block;src:url("${police}") format("woff2")}
#ld-chargement{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;background:#F6F5F1;color:#161616;font-family:'LD Cinzel',Georgia,serif;-webkit-font-smoothing:antialiased;transition:opacity .5s ease}
#ld-chargement.is-fin{opacity:0;pointer-events:none}
#ld-chargement.is-lent{transition-duration:1.1s;transition-delay:.3s}
.ldc-scene{display:grid;justify-items:center;opacity:0;transition:opacity .9s cubic-bezier(.16,.6,.2,1)}
.is-visible .ldc-scene{opacity:1}
.is-fin .ldc-scene{opacity:0;transition-duration:.45s}
.ldc-mots{display:grid}
.ldc-mot{grid-area:1/1;justify-self:center;font-size:clamp(20px,3.4vw,44px);font-weight:500;letter-spacing:.5em;padding-left:.5em;text-transform:uppercase;white-space:nowrap;opacity:0}
@media (min-width:900px){.ldc-mot{letter-spacing:.8em;padding-left:.8em}}
.ldc-mot.on{animation:ldc-mot 2.4s linear}
@keyframes ldc-mot{0%{opacity:0;transform:scale(1.045)}31.5%,73.5%{opacity:1}100%{opacity:0;transform:scale(.995)}}
.ldc-trait{position:relative;width:132px;height:1px;margin:34px 0 18px;background:rgba(22,22,22,.12)}
.ldc-trait i{position:absolute;inset:0;background:#A9814A;box-shadow:0 0 6px rgba(169,129,74,.45);transform:scaleX(0);transition:transform .7s cubic-bezier(.16,.6,.2,1)}
.ldc-pct{min-width:7ch;text-align:center;font-size:11px;letter-spacing:.24em;padding-left:.24em;color:rgba(22,22,22,.64);font-variant-numeric:tabular-nums}
@media (prefers-reduced-motion:reduce){#ld-chargement,.ldc-scene,.ldc-trait i{transition:none!important}.ldc-mot.on{animation:none!important}.is-visible .ldc-mot:first-child{opacity:1}}`;
  d.head.appendChild(st);

  const el = d.createElement("div");
  el.id = "ld-chargement";
  el.innerHTML = `<div class="ldc-scene" role="progressbar" aria-label="Loading" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="ldc-mots" aria-hidden="true">${MOTS.map(m => `<span class="ldc-mot">${m}</span>`).join("")}</div><div class="ldc-trait"><i></i></div><div class="ldc-pct">0\u202F%</div></div>`;
  h.appendChild(el);
  const scene = el.firstChild, trait = el.querySelector("i"), pct = el.querySelector(".ldc-pct");
  const spans = el.querySelectorAll(".ldc-mot");
  let motMinuteur = 0, pile = [], dernier = -1;
  // Pioche sans remise : aucun mot ne revient avant que les sept soient passés ; nouveau tirage à chaque tour et à chaque chargement.
  const motSuivant = () => {
    if (!pile.length) {
      pile = [...spans.keys()];
      for (let i = pile.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pile[i], pile[j]] = [pile[j], pile[i]]; }
      if (pile[0] === dernier) [pile[0], pile[1]] = [pile[1], pile[0]];
    }
    dernier = pile.shift();
    const s = spans[dernier]; s.classList.remove("on"); void s.offsetWidth; s.classList.add("on");
  };

  // Pas de défilement ni de clic sur la page cachée tant que l'écran est là.
  const bloque = e => e.preventDefault();
  const TOUCHES = /^( |PageUp|PageDown|ArrowUp|ArrowDown|Home|End)$/;
  const clavier = e => { if (TOUCHES.test(e.key)) e.preventDefault(); };
  el.addEventListener("wheel", bloque, { passive: false });
  el.addEventListener("touchmove", bloque, { passive: false });
  addEventListener("keydown", clavier);

  const abs = u => { try { return new URL(u, location.href).href; } catch (e) { return u; } };
  const recu = u => /^(blob|data):/.test(u) || performance.getEntriesByName(abs(u)).length > 0;
  const vue = n => { const r = n.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight * 1.1; };

  function mesure() {
    const lu = d.readyState !== "loading";
    const rendu = lu && [...d.querySelectorAll("body section, body header")].some(n => n.offsetHeight > 0);
    const polices = !d.fonts || d.fonts.status === "loaded";
    let n = 0, ok = 0;
    for (const l of d.querySelectorAll('link[rel="stylesheet"][href]')) { n++; if (l.sheet || recu(l.href)) ok++; }
    for (const s of d.querySelectorAll("script[src]")) { n++; if (recu(s.src)) ok++; }
    if (rendu) {
      for (const i of d.images) if (i.loading !== "lazy" && vue(i)) { n++; if (i.complete) ok++; }
      for (const v of d.querySelectorAll("video")) if (vue(v)) { n++; if (v.readyState >= 2 || v.error || v.preload === "none") ok++; }
    }
    const res = n ? ok / n : (rendu ? 1 : 0);
    const reel = .06 + (lu ? .12 : 0) + (d.readyState === "complete" ? .08 : 0) + (rendu ? .18 : 0) + (rendu && polices ? .08 : 0) + .48 * res;
    return { reel, pret: rendu && polices && res === 1 };
  }

  let affiche = 0, cible = 0, tChange = t0, pretDepuis = 0, visible = false, fini = false;
  function peindre(p) {
    trait.style.transform = `scaleX(${p.toFixed(3)})`;
    const v = Math.floor(p * 100);
    pct.textContent = v + "\u202F%";
    scene.setAttribute("aria-valuenow", v);
  }
  function retirer() {
    if (!el.isConnected) return;
    el.remove(); st.remove();
    removeEventListener("keydown", clavier);
    dispatchEvent(new Event("scroll")); // le header flottant relit le fond sous lui
  }
  function finir() {
    fini = true; clearInterval(minuteur); clearInterval(motMinuteur); clearTimeout(filet);
    if (d.hidden) { retirer(); return; }
    if (visible) {
      peindre(1);
      setTimeout(() => { el.classList.add("is-lent", "is-fin"); setTimeout(retirer, 1500); }, 420);
    } else { el.classList.add("is-fin"); setTimeout(retirer, 550); }
  }
  function tick() {
    if (fini) return;
    const now = performance.now(), m = mesure();
    if (m.reel > cible + .001) { cible = m.reel; tChange = now; }
    // Tant que rien de neuf n'arrive, le chiffre avance à peine (≤ 8 points) : il reste vivant sans mentir.
    let but = m.pret ? 1 : Math.min(.97, cible + Math.min(.08, (now - tChange) / 9000));
    affiche += (Math.max(but, affiche) - affiche) * (m.pret ? .5 : .22);
    if (visible) peindre(affiche);
    pretDepuis = m.pret ? (pretDepuis || now) : 0;
    if ((pretDepuis && now - pretDepuis > 300) || now - t0 > MAX) finir();
    else if (!visible && now - t0 > SEUIL) { visible = true; peindre(affiche); el.classList.add("is-visible"); motSuivant(); motMinuteur = setInterval(motSuivant, 2400); }
  }
  const minuteur = setInterval(tick, 150);
  // Les minuteurs sont ralentis dans un onglet caché : les événements prennent le relais.
  const filet = setTimeout(() => { if (!fini) finir(); }, MAX + 500);
  const relance = () => { if (fini) return; if (d.hidden && d.readyState === "complete") finir(); else tick(); };
  addEventListener("load", relance);
  addEventListener("pageshow", relance);
  d.addEventListener("visibilitychange", relance);
})();
