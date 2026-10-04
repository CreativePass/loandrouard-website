// Banc de comparaison LOCAL (Chromium) des versions de l'adresse de test : mêmes parcours automatiques que sur
// l'iPhone (optimise/diag.js, ?auto=1), mêmes dimensions, mêmes états. Sert à décider quels candidats de
// scripts/safari.mjs méritent l'essai sur Safari réel ; il ne remplace pas ce test (pas de WebKit ici, et pas de
// carte graphique : chiffres pessimistes, seules les comparaisons comptent).
// Usage (après ESSAI=1 node scripts/construire.mjs) :
//   node scripts/banc.mjs parcours [bureau|mobile] [actuel,textures,proposition,proposition+filtre] [répétitions]
//   node scripts/banc.mjs captures [bureau|mobile] [actuel,textures]   → captures/<profil>/… + écarts au pixel
//   node scripts/banc.mjs calques  [bureau|mobile] [actuel,textures]   → surface des calques par étape du projecteur
// Résultats : mesures/banc-<scénario>-<profil>.json (dossier non publié).
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright-core";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

const RACINE = path.resolve(import.meta.dirname, ".."), PUBLIC = path.join(RACINE, "public"), MESURES = path.join(RACINE, "mesures");
const [scenario = "parcours", profilNom = "bureau", listeArg, repArg] = process.argv.slice(2);
const PROFILS = {
  bureau: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, cpu: 1 },
  mobile: { viewport: { width: 393, height: 852 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, cpu: 4 },
};
const P = PROFILS[profilNom];
const LISTE = (listeArg || (scenario === "parcours" ? "actuel,textures,proposition" : "actuel,textures")).split(",");
const REP = +(repArg || 1);
// Nom : page[+variante…][-calque retiré…][@param=valeur…], ex. « proposition@nodiag=1 » (page sans diagnostic).
const chemin = (nom) => { const [corps, ...extra] = nom.split("@"), [avant, ...sans] = corps.split("-"), [p, ...v] = avant.split("+"), q = [...extra];
  if (v.length) q.push("v=" + v.join(",")); if (sans.length) q.push("sans=" + sans.join(","));
  return "/" + ({ actuel: "actuel.html", textures: "textures.html" }[p] || "") + (q.length ? "?" + q.join("&") : ""); };

if (!fs.existsSync(path.join(PUBLIC, "diag.js"))) { console.error("Construire d'abord avec ESSAI=1 node scripts/construire.mjs"); process.exit(1); }
const TYPES = { html: "text/html", js: "text/javascript", css: "text/css", png: "image/png", webp: "image/webp", jpg: "image/jpeg", svg: "image/svg+xml", woff2: "font/woff2", json: "application/json" };
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p === "/") p = "/index.html";
  const f = path.join(PUBLIC, p);
  if (!f.startsWith(PUBLIC) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": TYPES[path.extname(f).slice(1)] || "application/octet-stream", "cache-control": "no-cache" });
  fs.createReadStream(f).pipe(res);
});
await new Promise((ok) => srv.listen(0, "127.0.0.1", ok));
const BASE = `http://127.0.0.1:${srv.address().port}`;
const nav = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: "127.0.0.1,localhost" } : undefined });

async function ouvrir(nom, suffixe = "") {
  const { cpu, ...opts } = P; const ctx = await nav.newContext({ ...opts, ignoreHTTPSErrors: true, reducedMotion: "no-preference" });
  const page = await ctx.newPage(), cdp = await ctx.newCDPSession(page), erreurs = [];
  page.on("pageerror", (e) => erreurs.push(e.message.slice(0, 160)));
  await page.route(/loan-api|stripe|cloudflareinsights|jsdelivr/, (r) => r.abort());
  if (P.cpu > 1) await cdp.send("Emulation.setCPUThrottlingRate", { rate: P.cpu });
  const url = BASE + chemin(nom) + (suffixe ? (chemin(nom).includes("?") ? "&" : "?") + suffixe : "");
  await page.goto(url, { waitUntil: "load", timeout: 120000 });
  return { ctx, page, cdp, erreurs };
}
const attendreChargement = (page) => page.waitForFunction(() => !document.getElementById("ld-chargement"), null, { timeout: 60000 });
// Position de défilement donnant la progression P du projecteur (même formule que maj()).
const allerP = (page, p) => page.evaluate((p) => { const sec = document.getElementById("hero"), H = sec.querySelector(".vfp-scene").clientHeight, tenue = 1.25 * H, plage = sec.offsetHeight - tenue - H - 0.8 * H, s0 = 0.198 * plage, s = 0.6 * p * plage;
  document.documentElement.style.scrollBehavior = "auto"; window.scrollTo(0, sec.getBoundingClientRect().top + scrollY + (s < s0 ? s : s + tenue * 0.994)); }, p);
const ETAPES = [0, 0.2, 0.45, 0.6, 0.7, 0.75, 0.8];

const R = { profil: profilNom, scenario, date: new Date().toISOString(), res: {} };
if (scenario === "parcours") {
  for (let k = 0; k < REP; k++) for (const nom of LISTE) {
    const o = await ouvrir(nom, "auto=1");
    await o.page.waitForFunction(() => localStorage.getItem("ld-diag-auto"), null, { timeout: 900000, polling: 2000 });
    const r = JSON.parse(await o.page.evaluate(() => localStorage.getItem("ld-diag-auto")));
    r.erreursPage = o.erreurs; (R.res[nom] = R.res[nom] || []).push(r);
    console.log(nom, "arrivée", r.arrivee, Object.entries(r.phases).map(([ph, s]) => `${ph} p95 ${s.p95} >25 ${s.pc25}%`).join(" | "), o.erreurs.length ? "ERREURS " + o.erreurs.join(" / ") : "");
    await o.ctx.close();
  }
} else if (scenario === "captures") {
  const dos = path.join(MESURES, "captures", profilNom); fs.mkdirSync(dos, { recursive: true });
  const prendre = async (nom, tag) => {
    const o = await ouvrir(nom); await attendreChargement(o.page); await o.page.waitForTimeout(7000);
    for (const p of ETAPES) {
      await allerP(o.page, p); await o.page.waitForTimeout(1500);
      // Images figées pour comparer : animations CSS posées au même instant, poussière (tirage aléatoire) masquée.
      await o.page.evaluate(() => { document.getAnimations().forEach((a) => { a.pause(); a.currentTime = 6000; }); document.querySelectorAll(".vfp-poussiere").forEach((c) => (c.style.visibility = "hidden")); });
      await o.page.waitForTimeout(300);
      await o.page.screenshot({ path: path.join(dos, `${tag}-P${p}.png`) });
      await o.page.evaluate(() => { document.getAnimations().forEach((a) => a.play()); document.querySelectorAll(".vfp-poussiere").forEach((c) => (c.style.visibility = "")); });
    }
    await o.ctx.close();
  };
  await prendre(LISTE[0], LISTE[0] + "-a"); await prendre(LISTE[0], LISTE[0] + "-b");
  for (const nom of LISTE.slice(1)) await prendre(nom, nom);
  const ecart = (a, b, d) => { const A = PNG.sync.read(fs.readFileSync(a)), B = PNG.sync.read(fs.readFileSync(b)), D = new PNG({ width: A.width, height: A.height });
    const N = A.width * A.height, n = pixelmatch(A.data, B.data, D.data, A.width, A.height, { threshold: 0.06 }); fs.writeFileSync(d, PNG.sync.write(D));
    const f = pixelmatch(A.data, B.data, null, A.width, A.height, { threshold: 0.02 });
    let somme = 0, max = 0; for (let i = 0; i < A.data.length; i += 4) for (let k = 0; k < 3; k++) { const e = Math.abs(A.data[i + k] - B.data[i + k]); somme += e; if (e > max) max = e; }
    // visible : % de pixels au seuil 0,06 ; fin : seuil 0,02 ; moyen / max : écart par canal (0–255).
    return { visible: +(100 * n / N).toFixed(3), fin: +(100 * f / N).toFixed(3), moyen: +(somme / (3 * N)).toFixed(3), max }; };
  for (const p of ETAPES) {
    const ref = path.join(dos, `${LISTE[0]}-a-P${p}.png`), ligne = { temoin: ecart(ref, path.join(dos, `${LISTE[0]}-b-P${p}.png`), path.join(dos, `diff-temoin-P${p}.png`)) };
    for (const nom of LISTE.slice(1)) ligne[nom] = ecart(ref, path.join(dos, `${nom}-P${p}.png`), path.join(dos, `diff-${nom}-P${p}.png`));
    R.res["P" + p] = ligne; console.log("P" + p, "% de pixels différents :", JSON.stringify(ligne));
  }
} else if (scenario === "calques") {
  for (const nom of LISTE) {
    const o = await ouvrir(nom); await attendreChargement(o.page); await o.page.waitForTimeout(6000);
    let calques = []; o.cdp.on("LayerTree.layerTreeDidChange", (e) => { if (e.layers) calques = e.layers; });
    await o.cdp.send("LayerTree.enable");
    const res = {};
    const etat = async (etiquette) => { await o.page.waitForTimeout(1500);
      const dessin = calques.filter((l) => l.drawsContent);
      const px = dessin.reduce((s, l) => s + l.width * l.height, 0), grands = dessin.filter((l) => l.width * l.height > 0.5e6).length;
      res[etiquette] = { calques: calques.length, dessines: dessin.length, mpxCss: +(px / 1e6).toFixed(1), mpxAppareil: +(px * P.deviceScaleFactor ** 2 / 1e6).toFixed(1), grands }; };
    for (const p of ETAPES) { await allerP(o.page, p); await etat("P" + p); }
    await allerP(o.page, 0); await o.page.waitForTimeout(800); await o.page.evaluate(() => document.querySelector(".vfp-affiche").click()); await etat("vitrine");
    R.res[nom] = res; console.log(nom, JSON.stringify(res));
    await o.ctx.close();
  }
}
if (scenario === "trace") {
  // Traversée du projecteur à vitesse constante (P 0 → 0,8 en 14 s), trace du navigateur : temps de dessin
  // (Paint, rastérisation) et de composition, qui ne dépendent pas de la même façon de la carte graphique.
  const FILS = ["CrRendererMain", "Compositor", "ThreadPoolForegroundWorker", "VizCompositorThread", "CrGpuMain"];
  const NOMS = ["Paint", "PrePaint", "Layerize", "Commit", "UpdateLayoutTree", "Layout", "RasterTask", "ImageDecodeTask", "FunctionCall", "FireAnimationFrame", "HitTest", "Display::DrawAndSwap", "SkiaOutputSurfaceImplOnGpu::SwapBuffers", "DirectRenderer::DrawFrame"];
  for (let k = 0; k < REP; k++) for (const nom of LISTE) {
    const o = await ouvrir(nom); await attendreChargement(o.page); await o.page.waitForTimeout(6500);
    let calques = []; const avantPeints = {};
    if (process.env.BANC_PEINTS) { o.cdp.on("LayerTree.layerTreeDidChange", (e) => { if (e.layers) calques = e.layers; }); await o.cdp.send("LayerTree.enable"); await o.page.waitForTimeout(500); for (const l of calques) avantPeints[l.layerId] = l.paintCount || 0; }
    await nav.startTracing(o.page, { categories: ["devtools.timeline", "disabled-by-default-devtools.timeline", "cc", "viz", "gpu", "benchmark"] });
    const images = process.env.BANC_GESTE === "vitrine" ? await o.page.evaluate(() => new Promise(async (ok) => {
      // Parcours 2 : See pricing, survol des cartes (ordinateur), Back to Loan — mêmes gestes que diag.js.
      const d = [], dormir = (ms) => new Promise((r) => setTimeout(r, ms)); let prec = 0, fin = false;
      const boucle = (t) => { if (prec) d.push(t - prec); prec = t; if (!fin) requestAnimationFrame(boucle); }; requestAnimationFrame(boucle);
      document.querySelector(".vfp-affiche").click(); await dormir(2600);
      if (innerWidth >= 900) for (const c of document.querySelectorAll(".vfp-cartes > .vfp-c")) { const r = c.getBoundingClientRect(); for (let k = 0; k <= 10; k++) { c.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: r.left + r.width / 2 - 60 + 12 * k, clientY: r.top + r.height / 2, pointerType: "mouse" })); await dormir(90); } await dormir(300); }
      document.querySelector(".vfp-voir-f button").click(); await dormir(2200); fin = true;
      d.sort((a, b) => a - b); ok({ n: d.length, p50: Math.round(d[d.length >> 1]), p95: Math.round(d[Math.floor(d.length * 0.95)]), pc25: Math.round(100 * d.filter((x) => x > 25).length / d.length) }); })) : await o.page.evaluate(() => new Promise((ok) => {
      const sec = document.getElementById("hero"), H = sec.querySelector(".vfp-scene").clientHeight, tenue = 1.25 * H, plage = sec.offsetHeight - tenue - H - 0.8 * H, s0 = 0.198 * plage;
      const y0 = sec.getBoundingClientRect().top + scrollY, y1 = y0 + 0.48 * plage + tenue * 0.994, D = 14000; let t0 = 0, n = 0, prec = 0; const d = [];
      document.documentElement.style.scrollBehavior = "auto";
      const pas = (t) => { if (!t0) t0 = t; if (prec) d.push(t - prec); prec = t; n++; const u = Math.min(1, (t - t0) / D); window.scrollTo(0, y0 + (y1 - y0) * u); if (u < 1) requestAnimationFrame(pas); else { d.sort((a, b) => a - b); ok({ n, p50: Math.round(d[d.length >> 1]), p95: Math.round(d[Math.floor(d.length * 0.95)]), pc25: Math.round(100 * d.filter((x) => x > 25).length / d.length) }); } };
      requestAnimationFrame(pas); }));
    if (process.env.BANC_PEINTS) {
      await o.page.waitForTimeout(500); const lignes = [];
      for (const l of calques) { const d = (l.paintCount || 0) - (avantPeints[l.layerId] || 0); if (d < 5) continue;
        let qui = l.backendNodeId ? "" : "(sans nœud)"; if (l.backendNodeId) { try { const n = (await o.cdp.send("DOM.describeNode", { backendNodeId: l.backendNodeId })).node; qui = n.localName + "." + ((n.attributes || []).filter((a, i, A) => i % 2 === 1 && A[i - 1] === "class")[0] || "").split(" ").join("."); } catch (e) { qui = "?"; } }
        lignes.push([d, `${d} peints  ${Math.round(l.width)}×${Math.round(l.height)}  ${qui}`]); }
      console.log(lignes.sort((a, b) => b[0] - a[0]).slice(0, 15).map((x) => x[1]).join("\n"));
    }
    const buf = await nav.stopTracing(), ev = JSON.parse(buf.toString()).traceEvents, fils = {}, agg = {};
    for (const e of ev) if (e.ph === "M" && e.name === "thread_name") fils[e.pid + ":" + e.tid] = e.args.name;
    for (const e of ev) { if (e.ph !== "X" || !e.dur) continue; const fil = (fils[e.pid + ":" + e.tid] || "?").replace(/\d+$/, ""); if (!FILS.includes(fil) || !NOMS.includes(e.name)) continue; const c = fil + " " + e.name; agg[c] = (agg[c] || 0) + e.dur / 1000; }
    if (process.env.BANC_NOMS) { const t = {}; for (const e of ev) { if (e.ph !== "X" || !e.dur) continue; const f = (fils[e.pid + ":" + e.tid] || "?").replace(/\d+$/, ""); const c = f + " " + e.name; t[c] = (t[c] || 0) + e.dur / 1000; } console.log(Object.entries(t).sort((a, b) => b[1] - a[1]).slice(0, 40).map(([c, v]) => c + " " + Math.round(v)).join("\n")); }
    const r = { images, ms: Object.fromEntries(Object.entries(agg).sort((a, b) => b[1] - a[1]).map(([c, v]) => [c, Math.round(v)])) };
    (R.res[nom] = R.res[nom] || []).push(r);
    console.log(nom, JSON.stringify(images), JSON.stringify(r.ms));
    await o.ctx.close();
  }
}
fs.mkdirSync(MESURES, { recursive: true });
fs.writeFileSync(path.join(MESURES, `banc-${scenario}-${profilNom}.json`), JSON.stringify(R, null, 1));
await nav.close(); srv.close();
