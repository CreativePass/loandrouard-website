// Calques prévus selon les RÈGLES de WebKit (RenderLayerCompositor), et non le découpage de Chromium : 3D, will-change,
// filtre (FilterTrigger, permis par défaut), fixe / épinglé, animation en cours d'opacité / transformation / filtre, toile,
// participants d'un contexte 3D. Les calques « par recouvrement » (overlap) ne sont pas comptés (sous-estimation).
// Mémoire : modèle de GraphicsLayerCA (iOS) — calque de moins de 1 280 px CSS × zoom : l × h × (3 × zoom)² × 4 octets ; au-delà,
// tuiles sur la partie visible (agrandie si le calque est réduit par une transformation), 156 Mo au plus. Mesure dans Chromium
// (format iPhone 393 × 852, ×3), zoom simulé ; voir PERFORMANCE.md, « Retour de Loan du 11/11 ».
// Usage (11/11) :
//   node scripts/verif-calques-webkit.mjs <dossier>=<nom> [<dossier>=<nom> …]
//   ZOOMS=1,2,3 (croissants)   POS="cartes 0,4|bascule 8" (endroits)   DETAIL=150 (détail au-delà de 150 Mo, dernier zoom)
import fs from "node:fs"; import http from "node:http"; import path from "node:path";
import { chromium } from "playwright-core";
const T = { html: "text/html", js: "text/javascript", css: "text/css", svg: "image/svg+xml", png: "image/png", webp: "image/webp", jpg: "image/jpeg", woff2: "font/woff2", ico: "image/x-icon" };
const serve = (dos) => new Promise((ok) => { const s = http.createServer((q, r) => { let p = decodeURIComponent(new URL(q.url, "http://x").pathname); if (p === "/") p = "/index.html"; const f = path.join(dos, p); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200, { "content-type": T[path.extname(f).slice(1)] || "application/octet-stream" }); fs.createReadStream(f).pipe(r); }); s.listen(0, "127.0.0.1", () => ok(`http://127.0.0.1:${s.address().port}`)); });
const VERSIONS = process.argv.slice(2).map((a) => a.split("="));
const ZOOMS = (process.env.ZOOMS || "1,2,3").split(",").map(Number);
const POS0 = [
  ["projecteur P0,75", "p:0.75"], ["cartes 0,4", "e:.vfk:0.4"], ["cartes 0,8", "e:.vfk:0.8"], ["cartes 1,2", "e:.vfk:1.2"], ["cartes 1,6", "e:.vfk:1.6"], ["cartes 2,2", "e:.vfk:2.2"],
  ["bascule 6,5", "e:#analysis:6.5"], ["bascule 7", "e:#analysis:7"], ["bascule 7,5", "e:#analysis:7.5"], ["bascule 8", "e:#analysis:8"], ["bascule 8,5", "e:#analysis:8.5"], ["bascule 9", "e:#analysis:9"], ["bascule 10", "e:#analysis:10"]];
const POS = process.env.POS ? POS0.filter(([n]) => process.env.POS.split("|").includes(n)) : POS0;
const nav = await chromium.launch();
const mesure = () => { /* exécuté dans la page */
  const v = visualViewport, z = v.scale, vis = [v.offsetLeft, v.offsetTop, v.offsetLeft + v.width, v.offsetTop + v.height], res = [];
  const troisD = (e, cs) => /matrix3d|perspective/.test(cs.transform) || /3d\(|translateZ|rotate[XY]|perspective\(/.test(e.style ? e.style.transform : "");
  for (const e of document.querySelectorAll(".vf, .vf *")) {
    const cs = getComputedStyle(e); if (cs.display === "none" || cs.visibility === "hidden") continue;
    const r = [];
    if (cs.filter && cs.filter !== "none") r.push("filtre");
    if (cs.position === "fixed" || cs.position === "sticky") r.push(cs.position === "fixed" ? "fixe" : "épinglé");
    if (/transform|opacity|filter|translate|scale|rotate/.test(cs.willChange)) r.push("will-change");
    if (troisD(e, cs)) r.push("3D");
    if (cs.transformStyle === "preserve-3d" || (e.parentElement && getComputedStyle(e.parentElement).transformStyle === "preserve-3d" && cs.transform !== "none")) r.push("contexte 3D");
    if (e.tagName === "CANVAS") r.push("toile");
    if (e.getAnimations) for (const a of e.getAnimations()) { if (a.playState !== "running" || !a.effect || !a.effect.getKeyframes) continue;
      if (a.effect.getKeyframes().some((k) => "transform" in k || "opacity" in k || "filter" in k)) { r.push("animation"); break; } }
    if (!r.length) continue;
    /* Rien à dessiner si l'opacité effective est nulle (ancêtres compris). */
    let op = 1; for (let a = e; a && a !== document.documentElement; a = a.parentElement) op *= +getComputedStyle(a).opacity; if (op < 0.001 && !r.includes("toile")) continue;
    const b = e.getBoundingClientRect(); const w = e.offsetWidth || e.clientWidth || (e.getBBox ? e.getBBox().width : 0), h = e.offsetHeight || e.clientHeight || (e.getBBox ? e.getBBox().height : 0);
    if (!w || !h) continue;
    const ix = Math.min(b.right, vis[2]) - Math.max(b.left, vis[0]), iy = Math.min(b.bottom, vis[3]) - Math.max(b.top, vis[1]); if (ix <= 0 || iy <= 0) continue;
    const sx = Math.max(0.05, b.width / w), sy = Math.max(0.05, b.height / h), zz = r.includes("toile") ? 1 : z;
    const mo = (Math.max(w, h) * zz <= 1280 ? w * h * 36 * zz * zz : Math.min(156 * 1048576, Math.min(w * h, 1.2 * ix * iy / (sx * sy)) * 36 * zz * zz)) / 1048576;
    res.push({ n: e.tagName.toLowerCase() + (typeof e.className === "string" && e.className ? "." + e.className.trim().split(/\s+/).slice(0, 2).join(".") : (e.className && e.className.baseVal ? "." + e.className.baseVal.split(" ").slice(0, 2).join(".") : "")), r: r.join("+"), w: Math.round(w), h: Math.round(h), mo });
  }
  return { z, res };
};
const resultats = {};
for (const [dos, nom] of VERSIONS) {
  const base = await serve(path.resolve(dos)); resultats[nom] = {};
  for (const [pnom, pos] of POS) {
    const ctx = await nav.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }); const page = await ctx.newPage(), cdp = await ctx.newCDPSession(page);
    await page.route(/fonts\.googleapis|fonts\.gstatic|stripe|cloudflareinsights|loan-api/, (r) => r.abort());
    await page.goto(base + "/"); await page.waitForFunction(() => !document.getElementById("ld-chargement"), null, { timeout: 60000 }).catch(() => {}); await page.waitForTimeout(2500);
    const [t, a, b] = pos.split(":");
    await page.evaluate(([t, a, b]) => { document.documentElement.style.scrollBehavior = "auto";
      if (t === "p") { const sec = document.getElementById("hero"), H = sec.querySelector(".vfp-scene").clientHeight, tenue = 1.25 * H, plage = sec.offsetHeight - tenue - H - 0.8 * H, s0 = 0.198 * plage, s = 0.6 * +a * plage; scrollTo(0, sec.getBoundingClientRect().top + scrollY + (s < s0 ? s : s + tenue * 0.994)); }
      else { const e = document.querySelector(a); scrollTo(0, e.getBoundingClientRect().top + scrollY + +b * innerHeight); } }, [t, a, b]);
    await page.waitForTimeout(3500);
    resultats[nom][pnom] = {};
    let actuel = 1; /* zooms croissants : on passe de l'un au suivant */
    for (const z of ZOOMS) {
      if (z > actuel) { await cdp.send("Input.synthesizePinchGesture", { x: 196, y: 420, scaleFactor: z / actuel, relativeSpeed: 800, gestureSourceType: "default" }); await page.waitForTimeout(900); await page.evaluate(() => scrollBy(0, 1)); await page.waitForTimeout(1200); }
      const m = await page.evaluate(mesure); resultats[nom][pnom][z] = m; actuel = m.z;
    }
    await ctx.close();
  }
}
const tot = (m) => m.res.reduce((s, x) => s + x.mo, 0);
console.log("Mémoire estimée (Mo) des calques prévus par les règles de WebKit, partie visible ; entre parenthèses : nombre de calques");
console.log("endroit".padEnd(18) + VERSIONS.map(([, n]) => ZOOMS.map((z) => `${n} ×${z}`.padStart(13)).join("")).join(" |"));
for (const [pnom] of POS) console.log(pnom.padEnd(18) + VERSIONS.map(([, n]) => ZOOMS.map((z) => { const m = resultats[n][pnom][z]; return `${Math.round(tot(m))} (${m.res.length})`.padStart(13); }).join("")).join(" |"));
if (process.env.DETAIL) for (const [pnom] of POS) for (const [, n] of VERSIONS) { const z = ZOOMS[ZOOMS.length - 1], m = resultats[n][pnom][z]; if (tot(m) < +process.env.DETAIL) continue;
  console.log(`\n${n} — ${pnom} ×${z} : ${Math.round(tot(m))} Mo`); m.res.sort((a, b) => b.mo - a.mo).slice(0, 10).forEach((x) => console.log(`   ${x.mo.toFixed(0).padStart(4)} Mo  ${(x.w + "×" + x.h).padEnd(10)} ${x.n.slice(0, 44).padEnd(44)} ${x.r}`)); }
await nav.close(); process.exit(0);
