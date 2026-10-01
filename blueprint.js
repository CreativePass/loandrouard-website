/* Blueprint — fond de tracés qui se dessinent au défilement, en trois profondeurs de parallaxe.
   Usage : un conteneur [data-blueprint] (fixe, derrière le contenu). Images optionnelles en enfants :
   <img class="bp-img" data-ancre="#id" data-cote="gauche|droite" data-largeur="34" data-profondeur=".3">
   data-traces="non" : images seules, sans tracés générés.
   Parallaxe d'élément : [data-parallax="0.2"] (positif = plus lent que la page). */
(function () {
  if (window.__blueprint) return;
  window.__blueprint = true;
  const NS = "http://www.w3.org/2000/svg";
  const calme = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const st = document.createElement("style");
  st.textContent = `
.bp-couche{position:absolute;inset:0;pointer-events:none}
.bp-couche>svg{position:absolute;left:0;top:0;display:block}
.bp-imgs{position:absolute;left:0;top:0;width:100%;height:0;will-change:transform}
.bp-t{fill:none;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1 2;stroke-dashoffset:1}
.bp-c{fill:none;stroke-linecap:round;opacity:0;transition:opacity 1.2s ease}
.bp-c[data-on]{opacity:1}
.bp-luit{animation:bp-luit 3.8s ease-in-out infinite alternate}
@keyframes bp-luit{from{opacity:.12}to{opacity:.9}}
.bp-img{position:absolute;display:block;height:auto;pointer-events:none;-webkit-mask-image:radial-gradient(closest-side,#000 50%,transparent 100%);mask-image:radial-gradient(closest-side,#000 50%,transparent 100%)}
@media (prefers-reduced-motion:reduce){.bp-luit{animation:none}.bp-c{display:none}}`;
  document.head.appendChild(st);

  const f = (v) => Math.round(v * 10) / 10;
  const borne = (v, a, b) => Math.min(b, Math.max(a, v));
  const mk = (tag, a, p) => { const e = document.createElementNS(NS, tag); for (const k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; };
  const rng = (s) => () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  function arrondi(pts, r) {
    let d = "M" + f(pts[0][0]) + " " + f(pts[0][1]);
    for (let i = 1; i < pts.length - 1; i++) {
      const [a, b] = pts[i - 1], [x, y] = pts[i], [c, e] = pts[i + 1];
      const l1 = Math.hypot(x - a, y - b) || 1, l2 = Math.hypot(c - x, e - y) || 1, rr = Math.min(r, l1 / 2, l2 / 2);
      d += " L" + f(x - (x - a) / l1 * rr) + " " + f(y - (y - b) / l1 * rr) + " Q" + f(x) + " " + f(y) + " " + f(x + (c - x) / l2 * rr) + " " + f(y + (e - y) / l2 * rr);
    }
    const l = pts[pts.length - 1];
    return d + " L" + f(l[0]) + " " + f(l[1]);
  }

  function Blueprint(root) {
    const imgs = Array.from(root.querySelectorAll("img.bp-img"));
    imgs.forEach((i) => i.remove());
    let couches = [], W = 0, H = 0, vh = 0, raf = 0;

    function construire() {
      W = Math.max(320, window.innerWidth); vh = Math.max(480, window.innerHeight);
      H = Math.max(document.documentElement.scrollHeight, vh);
      root.innerHTML = "";
      const mobile = W < 760;
      const R = rng(W < 760 ? 7 : 19);
      const col = Math.min(W, 1180) / 2 - (mobile ? 24 : 72);
      const marge = Math.max(W * 0.04, W / 2 - col);
      const defs = [
        { d: 0.22, ton: "rgba(246,245,241,.075)", w: 0.8 },
        { d: 0.5, ton: "rgba(246,245,241,.15)", w: 1 },
        { d: 0.82, ton: "rgba(246,245,241,.2)", w: 1 },
      ];
      couches = defs.map((c, n) => {
        const h = vh + (H - vh) * c.d + vh;
        const div = document.createElement("div");
        div.className = "bp-couche";
        root.appendChild(div);
        const imgs = document.createElement("div");
        imgs.className = "bp-imgs";
        div.appendChild(imgs);
        const svg = mk("svg", { width: W, height: vh, viewBox: "0 0 " + W + " " + vh }, div);
        return { ...c, n, h, div, imgs, svg, traces: [], cometes: [] };
      });
      const versCouche = (y, d) => vh / 2 + (y - vh / 2) * d;
      const trace = (C, d, extra) => {
        const p = mk("path", Object.assign({ d, class: "bp-t", pathLength: 1, stroke: C.ton, "stroke-width": C.w }, extra || {}), C.svg);
        if (extra && extra.class === "bp-fixe") { p.setAttribute("fill", "none"); return p; }
        C.traces.push({ el: p, top: 0, bot: 0, p: -1, dec: 0 });
        return p;
      };
      const cote = (gauche, largeur) => gauche ? R() * Math.max(10, marge - largeur) + W * 0.015 : W - W * 0.015 - largeur - R() * Math.max(10, marge - largeur);

      if (root.dataset.traces !== "non") {
      /* — Lointain : lignes de construction, compas — */
      const L = couches[0];
      [0.06, 0.94, mobile ? null : 0.5 - col / W - 0.01, mobile ? null : 0.5 + col / W + 0.01].forEach((x) => {
        if (x == null) return;
        trace(L, "M" + f(W * x) + " 0 L" + f(W * x) + " " + f(L.h), { "stroke-dasharray": "0.004 0.006", "stroke-dashoffset": 0, class: "bp-fixe" });
      });
      for (let y = vh * 0.8, k = 0; y < L.h - vh * 0.6; y += vh * (mobile ? 2.2 : 1.5), k++) {
        const g = k % 2 === 0, r = (mobile ? 70 : 110) + R() * 110;
        const cx = g ? marge * 0.35 + R() * 40 : W - marge * 0.35 - R() * 40, cy = y + R() * vh * 0.4;
        trace(L, `M${f(cx + r)} ${f(cy)} A${f(r)} ${f(r)} 0 1 1 ${f(cx - r)} ${f(cy)} A${f(r)} ${f(r)} 0 1 1 ${f(cx + r)} ${f(cy)}`);
        trace(L, `M${f(cx + r * 0.42)} ${f(cy)} A${f(r * 0.42)} ${f(r * 0.42)} 0 1 1 ${f(cx - r * 0.42)} ${f(cy)} A${f(r * 0.42)} ${f(r * 0.42)} 0 1 1 ${f(cx + r * 0.42)} ${f(cy)}`);
        trace(L, `M${f(cx - r * 1.3)} ${f(cy)} L${f(cx + r * 1.3)} ${f(cy)} M${f(cx)} ${f(cy - r * 1.3)} L${f(cx)} ${f(cy + r * 1.3)}`);
        const a = -Math.PI / 4 * (g ? 1 : 3);
        trace(L, `M${f(cx)} ${f(cy)} L${f(cx + Math.cos(a) * r * 1.6)} ${f(cy + Math.sin(a) * r * 1.6)}`);
      }

      /* — Médian : faisceaux à 45°, nids de cadres, losanges — */
      const M = couches[1];
      const pas = vh * (mobile ? 1.25 : 0.85);
      for (let y = vh * 0.35, k = 0; y < M.h - vh * 0.5; y += pas, k++) {
        const g = k % 2 === 0;
        const n = 3 + Math.floor(R() * (mobile ? 2 : 4)), s = 7 + R() * 5, larg = (n - 1) * s;
        const x0 = cote(g, larg + 40) + (g ? 0 : 40);
        const dir = g ? -1 : 1;
        const v1 = vh * (0.12 + R() * 0.25), dl = 40 + R() * Math.min(160, marge * 0.9), v2 = vh * (0.18 + R() * 0.35);
        const retour = R() < 0.5;
        for (let i = 0; i < n; i++) {
          const xi = x0 + i * s;
          const d1 = y + v1 + (dir > 0 ? -0.414 * i * s : 0.414 * i * s);
          const pts = [[xi, y - i * 6], [xi, d1], [xi + dir * dl, d1 + dl], [xi + dir * dl, d1 + dl + v2]];
          if (retour) { const d2 = d1 + dl + v2; pts.push([xi, d2 + dl], [xi, d2 + dl + vh * 0.15]); }
          const p = trace(M, arrondi(pts, 7));
          M.traces[M.traces.length - 1].dec = i * 0.05;
          if (i === Math.floor(n / 2) && R() < 0.7) M.cometes.push({ d: p.getAttribute("d"), t: M.traces[M.traces.length - 1] });
          if (i === n - 1) {
            const c = mk("circle", { cx: f(xi + dir * dl), cy: f(d1 + dl), r: 1.6, fill: "#F6F5F1", class: "bp-luit" }, M.svg);
            c.style.animationDelay = (-R() * 4).toFixed(2) + "s";
          }
        }
        const y2 = y + pas * 0.5, g2 = !g;
        if (R() < 0.5) {
          const w = 60 + R() * 90, h = 40 + R() * 80, x = cote(g2, w + 20);
          for (let j = 0; j < 3; j++) {
            const o = j * 9, rr = 6;
            trace(M, `M${f(x + o + rr)} ${f(y2 + o)} H${f(x + w - o - rr)} Q${f(x + w - o)} ${f(y2 + o)} ${f(x + w - o)} ${f(y2 + o + rr)} V${f(y2 + h - o - rr)} Q${f(x + w - o)} ${f(y2 + h - o)} ${f(x + w - o - rr)} ${f(y2 + h - o)} H${f(x + o + rr)} Q${f(x + o)} ${f(y2 + h - o)} ${f(x + o)} ${f(y2 + h - o - rr)} V${f(y2 + o + rr)} Q${f(x + o)} ${f(y2 + o)} ${f(x + o + rr)} ${f(y2 + o)}`);
          }
        } else {
          const t = 22 + R() * 26, cx = cote(g2, t * 2) + t, cy = y2 + t;
          [1, 0.55].forEach((q) => trace(M, `M${f(cx)} ${f(cy - t * q)} L${f(cx + t * q)} ${f(cy)} L${f(cx)} ${f(cy + t * q)} L${f(cx - t * q)} ${f(cy)} Z`));
          trace(M, `M${f(cx)} ${f(cy - t * 2.4)} L${f(cx)} ${f(cy + t * 2.6)}`);
          mk("circle", { cx: f(cx), cy: f(cy - t * 2.4 - 6), r: 2, fill: "none", stroke: M.ton }, M.svg);
        }
      }

      /* — Proche : cotes et repères — */
      const P = couches[2];
      const cotes = ["R 24", "45°", "A — 03", "1 : 20", "0.25×", "Ø 112", "B — 07", "16°"];
      for (let y = vh * 0.6, k = 0; y < P.h - vh * 0.4; y += vh * (mobile ? 1.6 : 1.05), k++) {
        const g = k % 2 === 1, w = 60 + R() * 90, x = cote(g, w + 20);
        trace(P, `M${f(x)} ${f(y)} L${f(x + w)} ${f(y)} M${f(x)} ${f(y - 5)} L${f(x)} ${f(y + 5)} M${f(x + w)} ${f(y - 5)} L${f(x + w)} ${f(y + 5)}`);
        const t = mk("text", { x: f(x + w / 2), y: f(y - 9), "text-anchor": "middle", fill: "rgba(246,245,241,.3)", "font-family": "Cinzel, Georgia, serif", "font-size": 9, "letter-spacing": "1.4" }, P.svg);
        t.textContent = cotes[k % cotes.length];
        const cx = cote(!g, 20) + 10, cy = y + vh * 0.45;
        trace(P, `M${f(cx - 7)} ${f(cy)} L${f(cx + 7)} ${f(cy)} M${f(cx)} ${f(cy - 7)} L${f(cx)} ${f(cy + 7)}`);
      }

      }

      /* — Images de la marque, posées sur leur ancre — */
      imgs.forEach((im) => {
        const a = document.querySelector(im.dataset.ancre || "body");
        if (!a || (mobile && im.dataset.mobile === "non")) return;
        const d = +(im.dataset.profondeur || 0.3);
        const C = couches.reduce((m, c) => (Math.abs(c.d - d) < Math.abs(m.d - d) ? c : m));
        const r = a.getBoundingClientRect(), yPage = r.top + window.scrollY + r.height * (+(im.dataset.hauteur || 0.5));
        const w = Math.min(W * (+(im.dataset.largeur || 30)) / 100, 620);
        const c = im.cloneNode();
        c.style.width = w + "px";
        c.style.top = f(versCouche(yPage, C.d) - w * 0.7) + "px";
        if ((im.dataset.cote || "droite") === "gauche") c.style.left = f(-w * 0.12) + "px"; else c.style.right = f(-w * 0.12) + "px";
        C.imgs.appendChild(c);
      });

      couches.forEach((C) => C.traces.forEach((tr) => { const b = tr.el.getBBox(); tr.top = b.y; tr.bot = b.y + b.height; }));
      /* — Comètes de lumière le long des faisceaux — */
      const Mc = couches[1];
      const mesures = Mc.cometes.map((c) => { const p = document.createElementNS(NS, "path"); p.setAttribute("d", c.d); try { return p.getTotalLength() || 800; } catch (e) { return 800; } });
      if (!calme) Mc.cometes.forEach((c, k) => {
        const g = mk("g", { class: "bp-c" }, Mc.svg);
        const halo = mk("path", { d: c.d, stroke: "rgba(169,129,74,.45)", "stroke-width": 5 }, g);
        const coeur = mk("path", { d: c.d, stroke: "#F6F5F1", "stroke-width": 1.3 }, g);
        const len = mesures[k], Lc = Math.min(110, len * 0.22), dur = len * 6 + 2600, del = -((k * 0.37) % 1) * dur;
        [halo, coeur].forEach((e, j) => {
          e.style.strokeDasharray = f(Lc * (j ? 0.7 : 1)) + " " + f(len + Lc * 2);
          const a = e.animate([{ strokeDashoffset: Lc }, { strokeDashoffset: -len, offset: 0.72 }, { strokeDashoffset: -len }], { duration: dur, iterations: Infinity, delay: del, easing: "ease-in-out" });
          a.pause();
          (c.anims = c.anims || []).push(a);
        });
        c.g = g; c.joue = false;
      });
      raf = 0; maj();
    }

    function maj() {
      raf = 0;
      const S = window.scrollY;
      couches.forEach((C) => {
        const off = calme ? 0 : S * C.d;
        C.svg.setAttribute("viewBox", "0 " + f(off) + " " + W + " " + vh);
        C.imgs.style.transform = "translate3d(0," + f(-off) + "px,0)";
        C.traces.forEach((t) => {
          const top = t.top - off;
          if (!calme && t.p >= 0 && (top > vh * 1.6 || t.bot - off < -vh * 0.6) ) return;
          let p = calme ? 1 : borne((vh * 1.02 - top) / ((t.bot - t.top) + vh * 0.5) - t.dec, 0, 1);
          if (Math.abs(p - t.p) < 0.002) return;
          t.p = p;
          t.el.style.strokeDashoffset = (1 - p).toFixed(4);
        });
        C.cometes.forEach((c) => {
          if (!c.g) return;
          const vu = c.t.top - off < vh && c.t.bot - off > 0, on = vu && c.t.p > 0.97;
          if (on) c.g.setAttribute("data-on", ""); else c.g.removeAttribute("data-on");
          if (vu !== c.joue) { c.joue = vu; c.anims.forEach((a) => (vu ? a.play() : a.pause())); }
        });
      });
      parallaxe(S);
    }
    const planifier = () => { if (!raf) raf = requestAnimationFrame(maj); };
    let minuteur = 0, dernierW = 0, dernierH = 0;
    const reconstruire = () => {
      clearTimeout(minuteur);
      minuteur = setTimeout(() => {
        const w = window.innerWidth, h = document.documentElement.scrollHeight;
        if (w === dernierW && Math.abs(h - dernierH) < 80) return;
        dernierW = w; dernierH = h; construire();
      }, 180);
    };
    window.addEventListener("scroll", planifier, { passive: true });
    window.addEventListener("resize", reconstruire);
    if (window.ResizeObserver) new ResizeObserver(reconstruire).observe(document.body);
    dernierW = window.innerWidth; dernierH = document.documentElement.scrollHeight;
    construire();
  }

  function parallaxe(S) {
    if (calme) return;
    const vh = Math.max(480, window.innerHeight);
    document.querySelectorAll("[data-parallax]").forEach((el) => {
      const k = parseFloat(el.getAttribute("data-parallax")) || 0;
      if (el._bpRef == null) {
        const r = el.getBoundingClientRect();
        el._bpRef = Math.max(0, r.top + window.scrollY + r.height / 2 - vh / 2);
      }
      el.style.transform = "translate3d(0," + ((S - el._bpRef) * k).toFixed(1) + "px,0)";
    });
  }
  window.addEventListener("resize", () => document.querySelectorAll("[data-parallax]").forEach((el) => { el.style.transform = ""; el._bpRef = null; }));

  function lancer() {
    const roots = document.querySelectorAll("[data-blueprint]");
    if (!roots.length) return false;
    roots.forEach((r) => { if (!r._bp) { r._bp = 1; Blueprint(r); } });
    return true;
  }
  const essai = () => { if (!lancer()) setTimeout(essai, 120); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", essai); else essai();
  window.addEventListener("scroll", () => { if (!document.querySelector("[data-blueprint]")) parallaxe(window.scrollY); }, { passive: true });
})();
