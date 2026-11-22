// Contrôle des corrections « finesse » et « nuitcompacte » (22/11, scripts/safari.mjs), iPhone / iPad seulement.
// 1. Image : à chaque endroit de l'étude et à l'entrée de l'étude, la page est capturée telle quelle (feuille posée au niveau B,
//    lueurs du fond « nuit » compactes), puis comme avant (feuille remise à 1200 × 800, réduite par la caméra ; lueurs à leur
//    taille) : les deux images doivent être identiques (à l'écart près de deux captures sans rien changer).
//    Captures en ×3 (comme un iPhone). Critère : la forme (images floutées de 2 px, écart > 24/255 sur au plus 0,05 % des pixels) ;
//    l'anticrénelage des traits fins, lui, diffère sur toute la feuille (jusqu'à ≈ 1,5 % des pixels bruts, à l'œil identique).
//    Avec SAFARI=1, la feuille garde will-change: transform pendant les deux captures (Chromium la dessine alors à sa taille CSS,
//    comme Safari, au lieu de la redessiner à l'échelle de l'écran) : l'écart restant est celui que verra l'iPhone.
// 2. Niveaux : B ≥ zoom de la caméra au repos (jamais agrandie après coup), B ≤ 0,8 pendant un défilement rapide, retour à
//    l'arrêt ; loupe : B = 1 ; ordinateur et Android : rien ne change (B = 1, pas de classe vf-ios).
// 3. Aucune erreur JavaScript.
// Usage : npm run construire && node scripts/verif-finesse.mjs [dossier construit, défaut public]
import fs from "node:fs"; import http from "node:http"; import path from "node:path";
import { chromium } from "playwright-core";
import { PNG } from "pngjs"; import pixelmatch from "pixelmatch";
const T = { html: "text/html", js: "text/javascript", css: "text/css", svg: "image/svg+xml", png: "image/png", webp: "image/webp", jpg: "image/jpeg", woff2: "font/woff2", ico: "image/x-icon" };
const serve = (dos) => new Promise((ok) => { const s = http.createServer((q, r) => { let p = decodeURIComponent(new URL(q.url, "http://x").pathname); if (p === "/") p = "/index.html"; const f = path.join(dos, p); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200, { "content-type": T[path.extname(f).slice(1)] || "application/octet-stream" }); fs.createReadStream(f).pipe(r); }); s.listen(0, "127.0.0.1", () => ok(`http://127.0.0.1:${s.address().port}`)); });
const dos = path.resolve(process.argv[2] || "public"), base = await serve(dos);
const UA_IOS = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const ECRANS = (process.env.ECRANS || "393x852,375x667,430x932,852x393").split(",").map((e) => e.split("x").map(Number));
const SAFARI = !!process.env.SAFARI, SORTIE = process.env.SORTIE || "";
const nav = await chromium.launch();
let echecs = 0;
const ouvrir = async (w, h, ios) => {
  const mobile = w < 1000;
  const ctx = await nav.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: mobile ? 3 : 1, /* ×3 comme un iPhone : en ×1, Chromium réduit la photo d'un coup et crée un moiré absent de l'iPhone */ isMobile: mobile, hasTouch: mobile, ...(ios ? { userAgent: UA_IOS } : {}) });
  const page = await ctx.newPage(); const erreurs = [];
  page.on("pageerror", (e) => erreurs.push(e.message));
  await page.route(/fonts\.googleapis|fonts\.gstatic|stripe|cloudflareinsights|loan-api/, (r) => r.abort());
  await page.goto(base + "/?nodiag=1"); await page.waitForFunction(() => !document.getElementById("ld-chargement"), null, { timeout: 60000 }).catch(() => {}); await page.waitForTimeout(2000);
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; });
  return { ctx, page, erreurs };
};
/* État de la feuille : niveau B (--b), échelle affichée réelle (échelle du transform × B), taille CSS. */
const etat = (page) => page.evaluate(() => { const c = document.querySelector(".vfa-scene > .vfa-cam"), m = (c.style.transform.match(/scale\(([\d.]+)\)/) || [])[1];
  const b = +(c.style.getPropertyValue("--b") || 1); return { b, s: m ? +m * b : null, w: c.offsetWidth, ios: document.documentElement.classList.contains("vf-ios") }; });
/* « Comme avant » : feuille à 1200 × 800 (B = 1) réduite d'autant par la caméra, lueurs de la nuit à leur taille. Rien ne remet la
   correction tant que la caméra ne bouge pas. */
const commeAvant = (page) => page.evaluate(() => {
  for (const c of document.querySelectorAll(".vfa-cam")) { const b = +(c.style.getPropertyValue("--b") || 1), t = c.style.transform;
    c.__verif = [c.style.width, c.style.height, c.style.getPropertyValue("--b"), t]; /* remis tel quel ensuite (remettre) */
    c.style.width = "1200px"; c.style.height = "800px"; c.style.setProperty("--b", "1");
    c.style.transform = t.replace(/scale\(([\d.]+)\)/, (x, s) => "scale(" + (+s * b).toFixed(6) + ")"); }
  let st = document.getElementById("verif-finesse"); if (!st) { st = document.createElement("style"); st.id = "verif-finesse"; document.head.appendChild(st); }
  st.textContent = "html.vf-ios .vf-nuit i { background: var(--vfn) !important; } html.vf-ios .vf-nuit i::before { display: none !important; }"; });
const remettre = (page) => page.evaluate(() => { const st = document.getElementById("verif-finesse"); if (st) st.remove();
  for (const c of document.querySelectorAll(".vfa-cam")) if (c.__verif) { const [w, h, b, t] = c.__verif; c.style.width = w; c.style.height = h; c.style.setProperty("--b", b); c.style.transform = t; c.__verif = null; }
  dispatchEvent(new Event("scroll")); });
const shot = async (page) => PNG.sync.read(await page.screenshot({ animations: "disabled" }));
/* Forme : niveaux de gris floutés (rayon 2 px, ≈ 0,7 px CSS en ×3) ; un écart d'anticrénelage des traits fins disparaît, un décalage
   ou un changement de taille reste. Renvoie le nombre de pixels dont le gris flouté diffère de plus de 24 / 255. */
const forme = (a, b) => { const W = a.width, H = a.height, R = 2, g = (img) => { const o = new Float32Array(W * H); for (let i = 0; i < W * H; i++) o[i] = 0.3 * img.data[4 * i] + 0.59 * img.data[4 * i + 1] + 0.11 * img.data[4 * i + 2]; return o; };
  const flou = (src) => { const t = new Float32Array(W * H), o = new Float32Array(W * H);
    for (let y = 0; y < H; y++) { let s = 0; for (let x = -R; x <= R; x++) s += src[y * W + Math.min(W - 1, Math.max(0, x))]; for (let x = 0; x < W; x++) { t[y * W + x] = s / (2 * R + 1); s += src[y * W + Math.min(W - 1, x + R + 1)] - src[y * W + Math.max(0, x - R)]; } }
    for (let x = 0; x < W; x++) { let s = 0; for (let y = -R; y <= R; y++) s += t[Math.min(H - 1, Math.max(0, y)) * W + x]; for (let y = 0; y < H; y++) { o[y * W + x] = s / (2 * R + 1); s += t[Math.min(H - 1, y + R + 1) * W + x] - t[Math.max(0, y - R) * W + x]; } }
    return o; };
  const fa = flou(g(a)), fb = flou(g(b)); let n = 0; for (let i = 0; i < W * H; i++) if (Math.abs(fa[i] - fb[i]) > 24) n++; return n; };

for (const [w, h] of ECRANS) {
  const { ctx, page, erreurs } = await ouvrir(w, h, true);
  if (SAFARI) await page.addStyleTag({ content: ".vfa-cam { will-change: transform !important; }" });
  const [a0, a1] = await page.evaluate(() => { const s = document.getElementById("analysis"); return [s.offsetTop - innerHeight, s.offsetTop + s.offsetHeight - innerHeight]; });
  const ys = []; for (let y = a0 + 200; y < a1; y += Math.round((a1 - a0) / 26)) ys.push(Math.round(y));
  console.log(`\n${w} × ${h} (iPhone${SAFARI ? ", feuille dessinée à sa taille CSS comme dans Safari, ×3" : ""}) : ${ys.length} endroits de l'étude`);
  let pire = 0;
  for (const [i, y] of ys.entries()) {
    await page.evaluate((y) => scrollTo(0, y), y); await page.waitForTimeout(2600); /* caméra posée, niveau B choisi (0,2 s après l'arrêt) */
    const e = await etat(page);
    if (await page.evaluate(() => document.documentElement.classList.contains("vf-cache-etude"))) continue;
    const okB = e.s === null || e.b >= Math.min(1, e.s) * 0.999 || e.s > 1.15; /* jamais agrandie après coup (au-delà de 1, comme avant) */
    const a = await shot(page); await page.waitForTimeout(250); const t0 = await shot(page);
    const temoin = pixelmatch(a.data, t0.data, null, a.width, a.height, { threshold: 0.03 });
    await commeAvant(page); await page.waitForTimeout(300); const b = await shot(page); await remettre(page); await page.waitForTimeout(150);
    const diff = new PNG({ width: a.width, height: a.height });
    const n = pixelmatch(t0.data, b.data, diff.data, a.width, a.height, { threshold: 0.03 }); let max = 0;
    for (let k = 0; k < b.data.length; k += 4) for (let c = 0; c < 3; c++) max = Math.max(max, Math.abs(t0.data[k + c] - b.data[k + c]));
    const pc = 100 * n / (a.width * a.height); pire = Math.max(pire, pc);
    /* L'anticrénelage des traits fins diffère sur toute la feuille (dessinée à la taille de l'écran au lieu de 3 fois plus grande puis
       réduite) : jusqu'à ≈ 1,5 % des pixels, à l'œil identique. Le critère est donc la FORME (images floutées de 2 px). */
    const nf = n ? forme(t0, b) : 0, pf = 100 * nf / (a.width * a.height);
    const ok = okB && (pf <= 0.05 || nf <= 1.5 * temoin); /* forme identique (un vrai décalage dépasse de loin 0,05 %) */
    if (SORTIE && n) { fs.mkdirSync(SORTIE, { recursive: true }); for (const [nom, img] of [["finesse", t0], ["avant", b], ["ecart", diff]]) fs.writeFileSync(path.join(SORTIE, `${w}x${h}-${i}-${nom}.png`), PNG.sync.write(img)); }
    if (!ok) echecs++;
    console.log(`  y = ${String(y).padStart(5)}  zoom ${e.s === null ? "—" : e.s.toFixed(3)}  B ${e.b.toFixed(2)} (feuille ${e.w} px)  écart ${n} px = ${pc.toFixed(3)} % (max ${max}), forme ${nf} px = ${pf.toFixed(3)} %${temoin ? ` ; témoin ${temoin} px` : ""}${okB ? "" : "  ← FEUILLE AGRANDIE"}${ok ? "" : "  ← DIFFÉRENCE"}`);
  }
  console.log(`  pire écart : ${pire.toFixed(3)} % des pixels${SAFARI ? " (rendu à la manière de Safari)" : ""}`);
  /* Défilement rapide au travers des plans de détail : B plafonné à 0,8, puis feuille nette (B ≥ zoom) après l'arrêt. */
  if (w < 1000) {
    const r = await page.evaluate(async () => { const s = document.getElementById("analysis"), y0 = s.offsetTop + 200, y1 = y0 + 4500, c = document.querySelector(".vfa-scene > .vfa-cam");
      scrollTo(0, y0 - 900); await new Promise((ok) => setTimeout(ok, 2500)); let maxB = 0; const t0 = performance.now();
      await new Promise((ok) => { const pas = () => { const u = Math.min(1, (performance.now() - t0) / 900); scrollTo(0, y0 + (y1 - y0) * u); if (performance.now() - t0 > 350) maxB = Math.max(maxB, +(c.style.getPropertyValue("--b") || 1)); if (u < 1) requestAnimationFrame(pas); else ok(); }; requestAnimationFrame(pas); });
      const vite = maxB; await new Promise((ok) => setTimeout(ok, 2600));
      const m = (c.style.transform.match(/scale\(([\d.]+)\)/) || [])[1], b = +(c.style.getPropertyValue("--b") || 1);
      return { vite, b, s: m * b }; });
    const ok = r.vite <= 0.8001 && r.b >= Math.min(1, r.s) * 0.999; if (!ok) echecs++;
    console.log(`  défilement rapide (5 écrans/s) : B ≤ ${r.vite.toFixed(2)} pendant (après 0,35 s) ; à l'arrêt B ${r.b.toFixed(2)} pour un zoom de ${r.s.toFixed(3)}${ok ? "" : "  ← ÉCHEC"}`);
    /* Loupe (pincement à deux doigts) : feuille remise à 1 pendant la loupe. */
    const cdp = await ctx.newCDPSession(page);
    const y = await page.evaluate(() => { const s = document.getElementById("analysis"); return s.offsetTop + s.offsetHeight * 0.45; });
    await page.evaluate((y) => scrollTo(0, y), y); await page.waitForTimeout(2600);
    const bAvant = (await etat(page)).b;
    const doigts = (d) => [{ x: w / 2 - d, y: h / 2 }, { x: w / 2 + d, y: h / 2 }];
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: doigts(30) });
    for (let k = 1; k <= 8; k++) { await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: doigts(30 + 12 * k) }); await page.waitForTimeout(30); }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await page.waitForTimeout(400);
    const pendant = await page.evaluate(() => ({ loupe: document.documentElement.classList.contains("vf-loupe"), b: +(document.querySelector(".vfa-scene > .vfa-cam").style.getPropertyValue("--b") || 1) }));
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: doigts(126) });
    for (let k = 1; k <= 8; k++) { await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: doigts(126 - 12 * k) }); await page.waitForTimeout(30); }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await page.waitForTimeout(3000);
    const apres = await page.evaluate(() => ({ loupe: document.documentElement.classList.contains("vf-loupe"), b: +(document.querySelector(".vfa-scene > .vfa-cam").style.getPropertyValue("--b") || 1) }));
    const okL = pendant.loupe && pendant.b === 1 && !apres.loupe && apres.b === bAvant; if (!okL) echecs++;
    console.log(`  loupe : B ${bAvant} → ${pendant.b} pendant la loupe (${pendant.loupe ? "active" : "INACTIVE"}) → ${apres.b} après${okL ? "" : "  ← ÉCHEC"}`);
  }
  if (erreurs.length) { echecs++; console.log("  ERREURS JS :", erreurs.join(" | ")); }
  await ctx.close();
}
/* Ordinateur et Android : rien ne change (pas de classe vf-ios, B = 1 au repos dans toute l'étude, sauf B > 1 au-delà de ×1,15). */
for (const [w, h, nom] of [[1440, 900, "ordinateur"], [393, 852, "Android"]]) {
  const { ctx, page, erreurs } = await ouvrir(w, h, false);
  const ys = await page.evaluate(() => { const s = document.getElementById("analysis"), r = []; for (let k = 1; k < 10; k++) r.push(Math.round(s.offsetTop + s.offsetHeight * k / 10 - innerHeight)); return r; });
  let ok = true, vus = [];
  for (const y of ys) { await page.evaluate((y) => scrollTo(0, y), y); await page.waitForTimeout(1500); const e = await etat(page); vus.push(e.b.toFixed(2)); if (e.ios || (e.b !== 1 && !(e.s > 1.15))) ok = false; }
  if (erreurs.length) { ok = false; console.log("  ERREURS JS :", erreurs.join(" | ")); }
  if (!ok) echecs++;
  console.log(`\n${nom} ${w} × ${h} : classe vf-ios absente, B = ${[...new Set(vus)].join(", ")}${ok ? " (inchangé)" : "  ← CHANGÉ"}`);
  await ctx.close();
}
await nav.close();
console.log(echecs ? `\n${echecs} écart(s) ou erreur(s)` : "\nAucune différence.");
process.exit(echecs ? 1 : 0);
