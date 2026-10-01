/* Header flottant : transparent et hors flux, il passe par-dessus le contenu. Son encre ne
   peut donc pas être fixée dans le markup — elle est relue au défilement sur le fond
   réellement peint sous lui, et posée en data-ton (les valeurs sont dans styles.css).
   Repli : "sombre" — le fond de page est noir, un fond non identifié n'est jamais clair. */
(() => {
  const SELECTEUR_FOND = ".ld-on-blanc, .ld-on-noir";
  /* Les composants du header (langues, liens) posent leur ton en variables inline sur eux-mêmes :
     elles masquaient celles du header, d'où « FR · 中文 » blancs sur fond clair. On les fait hériter. */
  if (!document.getElementById("ld-header-ton")) {
    const st = document.createElement("style"); st.id = "ld-header-ton";
    st.textContent = ".ld-header[data-ton] .ld-langues, .ld-header[data-ton] .ld-lien { --ld-encre: inherit !important; --ld-secondaire: inherit !important; --ld-filet: inherit !important; }"
      /* Les langues lisent leur propre fond : une diagonale (bascule noir/blanc) peut séparer le centre du header de son coin droit. */
      + ".ld-header[data-ton-langues=clair] .ld-langues { color: #161616 !important; --ld-encre: #161616 !important; --ld-secondaire: rgba(22,22,22,.64) !important; --ld-filet: #C7C4BC !important; }"
      + ".ld-header[data-ton-langues=sombre] .ld-langues { color: #F6F5F1 !important; --ld-encre: #F6F5F1 !important; --ld-secondaire: rgba(246,245,241,.66) !important; --ld-filet: rgba(246,245,241,.18) !important; }";
    (document.head || document.documentElement).appendChild(st);
  }
  let planifie = null;
  function lire() {
    planifie = null;
    for (const header of document.querySelectorAll(".ld-header")) {
      const r = header.getBoundingClientRect();
      if (!r.width) continue;
      if (header.classList.contains("vf-diff")) { header.dataset.ton = "sombre"; delete header.dataset.tonLangues; continue; }
      const sous = document.elementFromPoint(Math.round(r.left + r.width / 2), Math.round(r.bottom + 4));
      const fond = sous && sous.closest(SELECTEUR_FOND);
      header.dataset.ton = fond && fond.classList.contains("ld-on-blanc") ? "clair" : "sombre";
      const lg = header.querySelector(".ld-langues");
      if (lg) {
        const q = lg.getBoundingClientRect(), sL = document.elementFromPoint(Math.round(q.left + q.width / 2), Math.round(r.bottom + 4));
        const fL = sL && sL.closest(SELECTEUR_FOND);
        header.dataset.tonLangues = fL && fL.classList.contains("ld-on-blanc") ? "clair" : "sombre";
      }
    }
  }
  const planifier = () => { if (planifie === null) planifie = requestAnimationFrame(lire); };
  addEventListener("scroll", planifier, { passive: true });
  addEventListener("resize", planifier);
  addEventListener("load", planifier);
  if (document.readyState === "loading") addEventListener("DOMContentLoaded", planifier);
  else planifier();
})();
