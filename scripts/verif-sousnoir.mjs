// Contrôle de la correction « sousnoir » (22/11, scripts/safari.mjs) : à la fin de l'étude et au passage aux cartes, ce qui n'est
// plus dessiné (sous le fond noir, photo et négatif à opacité 0) est vraiment invisible. Pour chaque
// écran, de la fin de l'étude jusqu'aux cartes, la page est capturée telle quelle, puis avec tout redessiné : les deux images
// doivent être identiques (à l'écart près de deux captures sans rien changer : lueurs animées). Mémoire estimée (règles de
// WebKit, outil de verif-calques-webkit.mjs) avec et sans la correction.
// IOS=1 : navigateur présenté comme un iPhone (corrections en or effacées cachées aussi, iPhone / iPad seulement) ; elles sont
// contrôlées à part, photo et négatif cachés (Chrome dessine le négatif autrement quand ce calque est caché, pas Safari).
// Usage : npm run construire && [IOS=1] node scripts/verif-sousnoir.mjs [dossier construit, défaut public]
import fs from "node:fs"; import http from "node:http"; import path from "node:path";
import { chromium } from "playwright-core";
import { PNG } from "pngjs"; import pixelmatch from "pixelmatch";
const T = { html: "text/html", js: "text/javascript", css: "text/css", svg: "image/svg+xml", png: "image/png", webp: "image/webp", jpg: "image/jpeg", woff2: "font/woff2", ico: "image/x-icon" };
const serve = (dos) => new Promise((ok) => { const s = http.createServer((q, r) => { let p = decodeURIComponent(new URL(q.url, "http://x").pathname); if (p === "/") p = "/index.html"; const f = path.join(dos, p); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200, { "content-type": T[path.extname(f).slice(1)] || "application/octet-stream" }); fs.createReadStream(f).pipe(r); }); s.listen(0, "127.0.0.1", () => ok(`http://127.0.0.1:${s.address().port}`)); });
const dos = path.resolve(process.argv[2] || "public"), base = await serve(dos);
const mesure = fs.readFileSync(path.join(import.meta.dirname, "verif-calques-webkit.mjs"), "utf8").match(/const mesure = (\(\) => \{[\s\S]*?\n\};)/)[1].slice(0, -1);
const ECRANS = (process.env.ECRANS || "393x852,393x695,375x667,430x932,852x393,768x1024,1440x900").split(",").map((e) => e.split("x").map(Number));
const nav = await chromium.launch();
let echecs = 0;
for (const [w, h] of ECRANS) {
  const mobile = w < 1000;
  const ctx = await nav.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile,
    ...(process.env.IOS ? { userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1" } : {}) });
  const page = await ctx.newPage(); const erreurs = [];
  page.on("pageerror", (e) => erreurs.push(e.message));
  await page.route(/fonts\.googleapis|fonts\.gstatic|stripe|cloudflareinsights|loan-api/, (r) => r.abort());
  await page.goto(base + "/?nodiag=1"); await page.waitForFunction(() => !document.getElementById("ld-chargement"), null, { timeout: 60000 }).catch(() => {}); await page.waitForTimeout(2000);
  await page.evaluate(`window.__mesure = ${mesure}`);
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; });
  const shot = async () => PNG.sync.read(await page.screenshot({ animations: "disabled" }));
  const mo = () => page.evaluate(() => Math.round(window.__mesure().res.reduce((s, x) => s + x.mo, 0)));
  /* Tout redessiné : classe et visibilités de la correction retirées (rien ne les remet tant que la page ne défile pas). */
  const montrer = () => page.evaluate(() => { const sc = document.querySelector(".vfa-scene"), c = [];
    if (sc.classList.contains("vfa-sous-noir")) { sc.classList.remove("vfa-sous-noir"); c.push("noir"); }
    for (const [q, n] of [[".vfa-noir .vfa-cam > img:not(.vfa-negatif)", "photo"], [".vfa-negatif", "négatif"]]) { const e = document.querySelector(q); if (e && e.style.visibility === "hidden") { e.style.visibility = ""; c.push(n); } }
    return c; });
  /* Positions : de 600 px avant le recouvrement complet par le fond noir jusqu'à l'arrêt sur les cartes, puis le retour. */
  await page.evaluate(() => scrollTo(0, 1e6)); await page.waitForTimeout(5000); /* cartes vues : bas de page débloqué */
  const [y0, y1] = await page.evaluate(async () => { const sc = document.querySelector(".vfa-scene"), f = document.querySelector("#formules"), fin = f.getBoundingClientRect().top + scrollY;
    let a = null; for (let y = fin - 6000; y < fin; y += 100) { scrollTo(0, y); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); await new Promise((r) => setTimeout(r, 30)); if (a === null && sc.classList.contains("vfa-sous-noir")) a = y; }
    return [Math.max(0, (a === null ? fin - 2000 : a) - 600), Math.min(document.documentElement.scrollHeight - innerHeight, fin + innerHeight)]; });
  console.log(`\n${w} × ${h} : de ${y0} à ${y1}`);
  const ys = []; for (let y = y0; y <= y1; y += Math.max(120, Math.round((y1 - y0) / 22))) ys.push(y);
  for (const sens of ["descente", "remontée"]) {
    for (const y of sens === "descente" ? ys : [...ys].reverse()) {
      await page.evaluate((y) => scrollTo(0, y), y); await page.waitForTimeout(2500); /* caméra posée : elle se redessine nette 220 ms après son dernier mouvement */
      /* Étude déjà non dessinée par une autre règle (sous la planche, au pied de page) : rien à comparer ici. */
      if (await page.evaluate(() => document.documentElement.classList.contains("vf-cache-etude"))) continue;
      const a = await shot(); await page.waitForTimeout(250); const t0 = await shot();
      const temoin = pixelmatch(a.data, t0.data, null, a.width, a.height, { threshold: 0.03 });
      const avec = await mo(); const c = await montrer(); await page.waitForTimeout(250); const b = await shot(); const sans = await mo();
      const n = pixelmatch(t0.data, b.data, null, a.width, a.height, { threshold: 0.03 }); let max = 0;
      for (let i = 0; i < b.data.length; i += 4) for (let k = 0; k < 3; k++) max = Math.max(max, Math.abs(t0.data[i + k] - b.data[i + k]));
      await page.evaluate(() => dispatchEvent(new Event("scroll"))); await page.waitForTimeout(100); /* correction remise */
      let ok = !c.length || (n <= 2 && max <= 8) || n <= 1.5 * temoin, or = "";
      /* Corrections en or cachées (iPhone) : seules dans la caméra noire (photo et négatif cachés), cachées puis montrées. */
      if (await page.evaluate(() => { const o = document.querySelector(".vfa-noir .vfa-svg--or"); return !!o && o.style.visibility === "hidden"; })) {
        await page.evaluate(() => document.querySelectorAll(".vfa-noir .vfa-cam > img").forEach((e) => { e.style.visibility = "hidden"; })); await page.waitForTimeout(250); const x = await shot(); const o0 = await mo();
        await page.evaluate(() => { document.querySelector(".vfa-noir .vfa-svg--or").style.visibility = ""; }); await page.waitForTimeout(250); const z = await shot(); const o1 = await mo();
        const m = pixelmatch(x.data, z.data, null, x.width, x.height, { threshold: 0.03 }); const okOr = m <= 2 || m <= 1.5 * temoin; ok = ok && okOr;
        await page.evaluate(() => dispatchEvent(new Event("scroll"))); await page.waitForTimeout(100);
        or = `  ; or effacé caché : −${o1 - o0} Mo, écart ${m} px${okOr ? "" : " ← DIFFÉRENCE"}`; }
      if (!ok) echecs++;
      if (c.length || !ok || or) console.log(`  ${sens.padEnd(8)} y = ${String(y).padStart(5)} : ${String(avec).padStart(3)} Mo au lieu de ${String(sans).padStart(3)}  non dessinés [${c.join(" ")}]  écart ${n} px (max ${max})${temoin ? ` ; témoin ${temoin} px` : ""}${or}${ok ? "" : "  ← DIFFÉRENCE"}`);
    }
  }
  if (erreurs.length) { echecs++; console.log("  ERREURS JS :", erreurs.join(" | ")); }
  await ctx.close();
}
await nav.close();
console.log(echecs ? `\n${echecs} écart(s) ou erreur(s)` : "\nAucune différence : ce qui n'est plus dessiné est invisible.");
process.exit(echecs ? 1 : 0);
