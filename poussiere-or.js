/* Poussière d'or : quand le pointeur quitte une cible cliquable, l'or du balayage s'envole
   en particules depuis chaque lettre. Neutralisé sous prefers-reduced-motion. */
(() => {
  if (window.__poussiereOr) return; window.__poussiereOr = "v19";
  const CIBLES = ".ld-bouton, .ld-lien, .ld-langues__item, .ld-balaie, .ld-reseau";
  const TEXTE = ".ld-bouton__texte, .ld-lien__texte";
  const TEINTES = ["222,188,128", "240,218,168", "250,234,196", "232,204,150"];
  const calme = matchMedia("(prefers-reduced-motion: reduce)");
  let cv, cx, parts = [], raf = 0, dpr = 1;
  const entrees = new WeakMap();

  function toile() {
    if (cv) return;
    cv = document.createElement("canvas");
    cv.setAttribute("aria-hidden", "true");
    cv.style.cssText = "position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:2147483000";
    document.body.appendChild(cv);
    cx = cv.getContext("2d");
    taille(); addEventListener("resize", taille);
  }
  function taille() {
    dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
  }
  function lettres(el) {
    const out = [], w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), r = document.createRange();
    let n;
    while ((n = w.nextNode())) {
      const t = n.textContent;
      for (let i = 0; i < t.length && out.length < 60; i++) {
        if (/\s/.test(t[i])) continue;
        r.setStart(n, i); r.setEnd(n, i + 1);
        const b = r.getBoundingClientRect();
        if (b.width && b.height) out.push(b);
      }
    }
    return out;
  }
  /* Logo image : points tirés des pixels opaques, pour que l'or parte du dessin et non de la boîte. */
  const masques = new Map();
  function masque(img) {
    const cle = img.currentSrc || img.src;
    if (masques.has(cle)) return masques.get(cle);
    let pts = null;
    try {
      const W = 120, H = Math.max(1, Math.round(W * img.naturalHeight / img.naturalWidth));
      const c = document.createElement("canvas"); c.width = W; c.height = H;
      const g = c.getContext("2d"); g.drawImage(img, 0, 0, W, H);
      const d = g.getImageData(0, 0, W, H).data; pts = [];
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 90) pts.push([(x + 0.5) / W, (y + 0.5) / H]);
      if (!pts.length) pts = null;
    } catch (e) { pts = null; }
    masques.set(cle, pts); return pts;
  }
  function envolerImage(img, wx, wy, force) {
    if (!img.complete || !img.naturalWidth) return false;
    const pts = masque(img); if (!pts) return false;
    const b = img.getBoundingClientRect(); if (!b.width) return false;
    const iw = img.naturalWidth, ih = img.naturalHeight, s = Math.min(b.width / iw, b.height / ih);
    const w = iw * s, h = ih * s, l = b.left + (b.width - w) / 2, t = b.top + (b.height - h) / 2;
    toile();
    const now = performance.now(), n = 380;
    for (let k = 0; k < n; k++) {
      const [u, v] = pts[(Math.random() * pts.length) | 0];
      const x = scrollX + l + u * w + (Math.random() - 0.5) * 3, y = scrollY + t + v * h + (Math.random() - 0.5) * 3;
      const f = (10 + Math.random() * 60) * force;
      parts.push({
        x, y, vx: 0, vy: 0, dem: 0.9 + Math.random() * 0.3, wx: wx * f + (Math.random() - 0.5) * 40, wy: wy * f - 3 + (Math.random() - 0.6) * 44,
        r: 0.28 + Math.random() * 0.38, c: TEINTES[(Math.random() * TEINTES.length) | 0],
        t0: now + Math.random() * 110 + Math.random() ** 1.8 * 240, vie: 800 + Math.random() * 800,
        ph: Math.random() * 6.28, fr: 1.5 + Math.random() * 2.5, brille: Math.random() < 0.05,
        a0: 0.7 + Math.random() * 0.3
      });
    }
    if (!raf) { prev = now; raf = requestAnimationFrame(boucle); }
    return true;
  }
  function envoler(cible, wx, wy, force) {
    const txt = cible.matches(TEXTE) ? cible : cible.querySelector(TEXTE) || cible;
    let ls = lettres(txt);
    const img = !ls.length && cible.querySelector("img");
    if (img && envolerImage(img, wx, wy, force)) return;
    if (!ls.length) { const b = (cible.querySelector("svg") || cible).getBoundingClientRect(); if (!b.width) return; ls = [b]; }
    toile();
    const parLettre = Math.max(10, Math.min(22, Math.round(420 / ls.length)));
    const now = performance.now();
    const g = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
    for (const b of ls) {
      const dl = Math.random() * 180, n = Math.round(parLettre * (0.6 + Math.random() * 0.8));
      for (let k = 0; k < n; k++) {
        const x = scrollX + b.left + b.width / 2 + g() * b.width * 1.15;
        const y = scrollY + b.top + b.height * 0.55 + g() * b.height * 0.8;
        const f = (10 + Math.random() * 60) * force;
        parts.push({
          x, y, vx: 0, vy: 0, dem: 0.9 + Math.random() * 0.3, wx: wx * f + (Math.random() - 0.5) * 40, wy: wy * f - 3 + (Math.random() - 0.6) * 44,
          r: 0.28 + Math.random() * 0.38, c: TEINTES[(Math.random() * TEINTES.length) | 0],
          t0: now + dl * 0.6 + Math.random() ** 1.8 * 240, vie: 800 + Math.random() * 800,
          ph: Math.random() * 6.28, fr: 1.5 + Math.random() * 2.5, brille: Math.random() < 0.05,
          a0: 0.7 + Math.random() * 0.3
        });
      }
    }
    if (!raf) { prev = now; raf = requestAnimationFrame(boucle); }
  }
  let prev = 0;
  function boucle(now) {
    const dt = Math.min(0.05, (now - prev) / 1000); prev = now;
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx.clearRect(0, 0, innerWidth, innerHeight);
    cx.setTransform(dpr, 0, 0, dpr, -scrollX * dpr, -scrollY * dpr);
    cx.globalCompositeOperation = "lighter";
    parts = parts.filter(p => now - p.t0 < p.vie);
    for (const p of parts) {
      const age = now - p.t0; if (age < 0) continue;
      if (p.dem) { p.vx = p.wx * p.dem; p.vy = p.wy * p.dem; p.dem = 0; }
      const k = age / p.vie, s = age / 1000;
      const rafale = 0.75 + 0.25 * Math.sin(s * 5 + p.ph);
      const kv = p.doux && now - p.doux < 700 ? 3 + 6 * ((now - p.doux) / 700) ** 2 : 9;
      p.vx += (p.wx * rafale - p.vx) * kv * dt; p.vy += (p.wy * rafale - p.vy) * kv * dt;
      p.x += p.vx * dt; p.y += (p.vy + Math.sin(p.ph + s * p.fr * 6) * 3) * dt;
      const a = p.a0 * (k < 0.1 ? k / 0.1 : 1 - (k - 0.1) / 0.9) ** 1.6;
      const sc = 0.55 + 0.45 * Math.sin(p.ph * 3 + s * p.fr * 7);
      const r = p.r * (1 - k * 0.5);
      if (p.brille) {
        cx.fillStyle = `rgba(${p.c},${a * sc * 0.4})`;
        cx.beginPath(); cx.arc(p.x, p.y, r * 3.6, 0, 6.283); cx.fill();
      }
      cx.fillStyle = `rgba(${p.c},${Math.min(1, a * (p.brille ? 0.7 + 0.6 * sc : 0.9))})`;
      cx.beginPath(); cx.arc(p.x, p.y, r, 0, 6.283); cx.fill();
    }
    raf = parts.length ? requestAnimationFrame(boucle) : (cx.setTransform(1, 0, 0, 1, 0, 0), cx.clearRect(0, 0, cv.width, cv.height), 0);
  }
  let mx = 0, my = 0, mt = 0, svx = 0, svy = 0;
  addEventListener("pointermove", e => {
    const t = performance.now(), d = Math.max(8, t - mt) / 1000;
    if (mt) { const k = Math.min(1, d * 12); svx += ((e.clientX - mx) / d - svx) * k; svy += ((e.clientY - my) / d - svy) * k; }
    mx = e.clientX; my = e.clientY; mt = t;
    souffler(e.clientX + scrollX, e.clientY + scrollY);
  }, { passive: true });
  /* La main repasse dans la poussière : les grains proches prennent le nouveau vent, sans changer leur durée de vie. */
  function souffler(px, py) {
    if (!parts.length) return;
    const vit = Math.hypot(svx, svy); if (vit < 150) return;
    const R = 70, now = performance.now(), m = Math.min(1, (vit - 150) / 1500);
    const tx = svx * 0.17, ty = svy * 0.17;
    for (const p of parts) {
      if (now < p.t0) continue;
      const d = Math.hypot(p.x - px, p.y - py); if (d > R) continue;
      const w = (1 - d / R) ** 2 * (0.18 + 0.37 * m);
      p.wx += (tx - p.wx) * w; p.wy += (ty - p.wy) * w;
      p.vx += (tx - p.vx) * w * 0.12; p.vy += (ty - p.vy) * w * 0.12; p.doux = now;
    }
  }
  document.addEventListener("pointerover", e => {
    if (e.pointerType === "touch") return;
    const c = e.target.closest && e.target.closest(CIBLES);
    if (c && !(e.relatedTarget && c.contains(e.relatedTarget))) entrees.set(c, performance.now());
  });
  document.addEventListener("pointerout", e => {
    if (e.pointerType === "touch" || calme.matches) return;
    const c = e.target.closest && e.target.closest(CIBLES);
    if (!c || (e.relatedTarget && c.contains(e.relatedTarget))) return;
    if (c.disabled || c.getAttribute("aria-disabled") === "true") return;
    const t = entrees.get(c); entrees.delete(c);
    if (!t || performance.now() - t <= 120) return;
    const bb = c.getBoundingClientRect();
    let dx = (e.clientX - (bb.left + bb.width / 2)) / Math.max(1, bb.width / 2), dy = (e.clientY - (bb.top + bb.height / 2)) / Math.max(1, bb.height / 2);
    let n = Math.hypot(dx, dy); if (n < 0.01) { dx = 1; dy = 0; n = 1; }
    const vit = Math.hypot(svx, svy);
    if (vit > 120) { const m = Math.min(1, (vit - 120) / 400); dx = dx / n * (1 - m) + svx / vit * m; dy = dy / n * (1 - m) + svy / vit * m; n = Math.hypot(dx, dy) || 1; }
    const tv = Math.min(1, vit / 2300);
    const force = 0.15 + 4.35 * (Math.exp(1.3 * tv) - 1) / (Math.exp(1.3) - 1);
    envoler(c, dx / n, dy / n * 0.6, force);
  });
})();
