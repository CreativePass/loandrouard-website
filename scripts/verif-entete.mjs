// Vérifie la correction « entete » (scripts/safari.mjs) : à chaque largeur, rien de ce qui doit être « sous l'en-tête »
// ne passe dessous, et la scène commence en haut de l'écran (plus de bande vide). Compare actuel.html et /.
// Usage (après ESSAI=1 node scripts/construire.mjs) : node scripts/verif-entete.mjs → mesures/entete/*.png + tableau
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright-core";

const RACINE = path.resolve(import.meta.dirname, ".."), PUBLIC = path.join(RACINE, "public"), SORTIE = path.join(RACINE, "mesures/entete");
fs.mkdirSync(SORTIE, { recursive: true });
const T = { html: "text/html", js: "text/javascript", css: "text/css", png: "image/png", webp: "image/webp", jpg: "image/jpeg", svg: "image/svg+xml", woff2: "font/woff2" };
const srv = http.createServer((q, r) => { let p = decodeURIComponent(new URL(q.url, "http://x").pathname); if (p === "/") p = "/index.html"; const f = path.join(PUBLIC, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200, { "content-type": T[path.extname(f).slice(1)] || "application/octet-stream" }); fs.createReadStream(f).pipe(r); });
await new Promise((ok) => srv.listen(0, "127.0.0.1", ok));
const nav = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: "127.0.0.1" } : undefined });
const TAILLES = [[375, 667], [390, 844], [393, 852], [402, 874], [430, 932], [1280, 800], [1440, 900]];
const lignes = [];
for (const [w, hgt] of TAILLES) for (const page of ["actuel.html", ""]) {
  const ctx = await nav.newContext({ viewport: { width: w, height: hgt }, deviceScaleFactor: 1, isMobile: w < 900, hasTouch: w < 900, ignoreHTTPSErrors: true });
  const p = await ctx.newPage(); await p.route(/loan-api|stripe|cloudflareinsights|jsdelivr/, (r) => r.abort());
  await p.goto(`http://127.0.0.1:${srv.address().port}/${page}`, { waitUntil: "load" });
  await p.waitForFunction(() => !document.getElementById("ld-chargement"), null, { timeout: 60000 }); await p.waitForTimeout(8500);
  const nom = (page || "proposition").replace(".html", "") + "-" + w;
  const aller = (rp) => p.evaluate((rp) => { const sec = document.getElementById("hero"), H = sec.querySelector(".vfp-scene").clientHeight, tenue = 1.25 * H, plage = sec.offsetHeight - tenue - H - 0.8 * H, s0 = 0.198 * plage, s = rp * plage;
    document.documentElement.style.scrollBehavior = "auto"; scrollTo(0, sec.getBoundingClientRect().top + scrollY + (s < s0 ? s : s + tenue * 0.994)); }, rp);
  const mesure = () => p.evaluate(() => { const b = (q) => { const e = document.querySelector(q); if (!e) return null; const r = e.getBoundingClientRect(); return r.width ? Math.round(r.top) : null; };
    const vis = (q) => { const e = document.querySelector(q); return e && getComputedStyle(e).opacity > 0.05 && getComputedStyle(e).visibility !== "hidden"; };
    return { entete: Math.round(document.querySelector(".ld-header").getBoundingClientRect().bottom), scene: Math.round(document.querySelector(".vfp-scene").getBoundingClientRect().top),
      texte: vis(".vfp-texte") ? b(".vfp-texte .vfp-h1") : null, titre: b(".vfp-mot--video .vfp-essai"), cartes: b(".vfp-cartes"), voir: b(".vfp-affiche"), bas: innerHeight }; });
  const r = {};
  r.haut = await mesure(); await p.screenshot({ path: path.join(SORTIE, nom + "-haut.png") });
  await aller(0.12); await p.waitForTimeout(1200); r.texte = await mesure(); await p.screenshot({ path: path.join(SORTIE, nom + "-texte.png") });
  await aller(0.7); await p.waitForTimeout(1500); r.titre = await mesure(); await p.screenshot({ path: path.join(SORTIE, nom + "-titre.png") });
  await aller(0); await p.waitForTimeout(1000); await p.evaluate(() => document.querySelector(".vfp-affiche").click()); await p.waitForTimeout(2600); r.vitrine = await mesure(); await p.screenshot({ path: path.join(SORTIE, nom + "-vitrine.png") });
  lignes.push(`${nom.padEnd(18)} bande ${r.haut.scene}px | entête ${r.haut.entete} | texte ${r.texte.texte} | titre ${r.titre.titre} | cartes ${r.vitrine.cartes} | See pricing ${r.haut.voir}/${r.haut.bas}`);
  console.log(lignes[lignes.length - 1]);
  await ctx.close();
}
await nav.close(); srv.close();
