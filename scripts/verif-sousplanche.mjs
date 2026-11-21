// Contrôle de la correction « sousplanche » (21/11, scripts/safari.mjs) : ce qui est caché autour des cartes (classes vf-cache-*)
// est vraiment invisible. Pour chaque écran mobile, de l'arrêt sur les cartes jusqu'à 400 px plus haut (et après la libération),
// la page est capturée telle quelle, puis avec toutes les classes vf-cache-* retirées (tout dessiné) : les deux images doivent être
// identiques. Mémoire estimée (règles de WebKit, outil de verif-calques-webkit.mjs) sur le même parcours.
// Usage : npm run construire && node scripts/verif-sousplanche.mjs [dossier construit, défaut public]
import fs from "node:fs"; import http from "node:http"; import path from "node:path";
import { chromium } from "playwright-core";
import { PNG } from "pngjs"; import pixelmatch from "pixelmatch";
const T = { html: "text/html", js: "text/javascript", css: "text/css", svg: "image/svg+xml", png: "image/png", webp: "image/webp", jpg: "image/jpeg", woff2: "font/woff2", ico: "image/x-icon" };
const serve = (dos) => new Promise((ok) => { const s = http.createServer((q, r) => { let p = decodeURIComponent(new URL(q.url, "http://x").pathname); if (p === "/") p = "/index.html"; const f = path.join(dos, p); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200, { "content-type": T[path.extname(f).slice(1)] || "application/octet-stream" }); fs.createReadStream(f).pipe(r); }); s.listen(0, "127.0.0.1", () => ok(`http://127.0.0.1:${s.address().port}`)); });
const dos = path.resolve(process.argv[2] || "public"), base = await serve(dos);
const mesure = fs.readFileSync(path.join(import.meta.dirname, "verif-calques-webkit.mjs"), "utf8").match(/const mesure = (\(\) => \{[\s\S]*?\n\};)/)[1].slice(0, -1);
const ECRANS = (process.env.ECRANS || "393x852,375x667,430x932,393x695,852x393,768x1024").split(",").map((e) => e.split("x").map(Number));
const DS = [0, -40, -80, -128, -170, -210, -255, -320, -400];
const nav = await chromium.launch();
let echecs = 0;
for (const [w, h] of ECRANS) {
  const ctx = await nav.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const page = await ctx.newPage(); const erreurs = [];
  page.on("pageerror", (e) => erreurs.push(e.message));
  await page.route(/fonts\.googleapis|fonts\.gstatic|stripe|cloudflareinsights|loan-api/, (r) => r.abort());
  await page.goto(base + "/"); await page.waitForFunction(() => !document.getElementById("ld-chargement"), null, { timeout: 60000 }).catch(() => {}); await page.waitForTimeout(2000);
  await page.evaluate(`window.__mesure = ${mesure}`);
  const shot = async () => PNG.sync.read(await page.screenshot({ animations: "disabled" }));
  const temoin = async () => { const a = await shot(); await page.waitForTimeout(250); const b = await shot();
    return pixelmatch(a.data, b.data, null, a.width, a.height, { threshold: 0.03 }); };
  const comparer = async () => { const a = await shot();
    const cl = await page.evaluate(() => { const R = document.documentElement, c = [...R.classList].filter((x) => x.startsWith("vf-cache-")); c.forEach((x) => R.classList.remove(x)); return c; });
    await page.waitForTimeout(250); const b = await shot();
    await page.evaluate((c) => c.forEach((x) => document.documentElement.classList.add(x)), cl);
    const n = pixelmatch(a.data, b.data, null, a.width, a.height, { threshold: 0.03 }); let max = 0;
    for (let i = 0; i < a.data.length; i += 4) for (let k = 0; k < 3; k++) max = Math.max(max, Math.abs(a.data[i + k] - b.data[i + k]));
    return { n, max, cl }; };
  console.log(`\n${w} × ${h}`);
  for (const phase of ["arrêt (fin provisoire)", "après la libération"]) {
    await page.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; scrollTo(0, 1e6); });
    await page.waitForTimeout(phase.startsWith("arrêt") ? 300 : 4500); /* arrêt : les cartes se retournent encore (animées par script) */
    if (!phase.startsWith("arrêt")) await page.evaluate(() => scrollTo(0, document.querySelector("#formules").getBoundingClientRect().top + scrollY + 0.5 * (document.querySelector("#formules").offsetHeight - innerHeight)));
    await page.waitForTimeout(400);
    const y0 = await page.evaluate(() => scrollY);
    console.log(`  ${phase} (y = ${y0})`);
    for (const d of DS) {
      await page.evaluate((y) => scrollTo(0, y), y0 + d); await page.waitForTimeout(450);
      const mo = await page.evaluate(() => { const m = window.__mesure(); return Math.round(m.res.reduce((s, x) => s + x.mo, 0)); });
      const t = await temoin(), r = await comparer(); /* témoin : deux captures à 250 ms d'écart sans rien changer (animations, retournement) */
      const ok = (r.n <= 2 && r.max <= 8) || r.n <= 1.5 * t; if (!ok) echecs++; /* étude animée : l'écart varie d'une capture à l'autre */
      console.log(`    d = ${String(d).padStart(4)} : ${String(mo).padStart(3)} Mo  cachés [${r.cl.join(" ")}]  écart ${r.n} px (max ${r.max})${t ? ` ; témoin sans rien changer : ${t} px` : ""}${ok ? "" : "  ← DIFFÉRENCE"}`);
    }
  }
  if (erreurs.length) { echecs++; console.log("  ERREURS JS :", erreurs.join(" | ")); }
  await ctx.close();
}
await nav.close();
console.log(echecs ? `\n${echecs} écart(s) ou erreur(s)` : "\nAucune différence : ce qui est caché est invisible.");
process.exit(echecs ? 1 : 0);
