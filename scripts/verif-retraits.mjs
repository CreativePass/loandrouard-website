// Vérification LOCALE (Chromium) des retraits ?sans= du diagnostic et de la variante ?v=affiche (adresse de test) :
//  1. géométrie : un retrait ne doit enlever que des éléments visuels. Position et hauteur de l'étude, hauteur de la
//     page, hauteur de la scène, bornes du test de stress (yA, yB) : identiques à la référence, à la page chargée
//     puis pendant un parcours de stress raccourci (yA ↔ yB, deux allers-retours) ;
//  2. retrait effectif : éléments visés non affichés, figure et scènes toujours affichées ;
//  3. affiche : will-change: filter sur le seul bouton See pricing.
// Usage (après ESSAI=1 node scripts/construire.mjs) : node scripts/verif-retraits.mjs   → captures dans mesures/retraits/
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright-core";

const RACINE = path.resolve(import.meta.dirname, ".."), PUBLIC = path.join(RACINE, "public"), SORTIE = path.join(RACINE, "mesures/retraits");
if (!fs.existsSync(path.join(PUBLIC, "diag.js"))) { console.error("Construire d'abord avec ESSAI=1 node scripts/construire.mjs"); process.exit(1); }
fs.mkdirSync(SORTIE, { recursive: true });
const TYPES = { html: "text/html", js: "text/javascript", css: "text/css", png: "image/png", webp: "image/webp", jpg: "image/jpeg", svg: "image/svg+xml", woff2: "font/woff2", json: "application/json" };
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p === "/") p = "/index.html";
  if (req.method === "POST") { res.writeHead(204); return res.end(); }
  const f = path.join(PUBLIC, p);
  if (!f.startsWith(PUBLIC) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": TYPES[path.extname(f).slice(1)] || "application/octet-stream", "cache-control": "no-cache" });
  fs.createReadStream(f).pipe(res);
});
await new Promise((ok) => srv.listen(0, "127.0.0.1", ok));
const BASE = `http://127.0.0.1:${srv.address().port}`;
const nav = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const PROFILS = {
  mobile: { viewport: { width: 393, height: 852 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  bureau: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
};
const RETRAITS = ["", "etude", "lumiere", "etude,lumiere"];
const LUMIERE = [".vfp-faisceau", ".vfp-rayons", ".vfp-halo", ".vfp-brume", ".vfp-eclat", ".vfp-expo", ".vfp-blanc", ".vfp-reman", ".vfp-poussiere", ".vfp-sol", ".vfp-flaque", ".vfp-ombre"];

// Mêmes formules que lancerStress() dans optimise/diag.js.
const geometrie = () => {
  const abs = (el) => Math.round((el.getBoundingClientRect().top + scrollY) * 10) / 10;
  const sec = document.getElementById("hero"), sc = sec.querySelector(".vfp-scene"), etu = document.getElementById("analysis");
  const H = sc.clientHeight, tenue = 1.25 * H, plage = Math.max(1, sec.offsetHeight - tenue - H - 0.8 * H);
  const r = (x) => Math.round(x * 10) / 10;
  return { etudeHaut: abs(etu), etudeHauteur: etu.offsetHeight, page: document.documentElement.scrollHeight, sceneEtude: document.querySelector(".vfa-scene").clientHeight,
    hero: sec.offsetHeight, formules: abs(document.getElementById("formules")), yA: r(abs(sec) + 0.42 * plage + tenue * 0.994), yB: r(abs(etu) + 1.2 * innerHeight) };
};
const affiche = (sel) => [...document.querySelectorAll(sel)].map((e) => getComputedStyle(e).display !== "none");

let echecs = 0;
const verifier = (nom, cond, info) => { console.log(`${cond ? "OK  " : "ÉCHEC"} ${nom}${info ? " — " + info : ""}`); if (!cond) echecs++; };
const resume = {};
for (const [profil, opts] of Object.entries(PROFILS)) {
  const ref = {};
  for (const sans of RETRAITS) {
    const ctx = await nav.newContext(opts); await ctx.route(/loan-api|stripe|cloudflareinsights|jsdelivr/, (r) => r.abort());
    const page = await ctx.newPage();
    await page.goto(BASE + "/" + (sans ? "?sans=" + sans : ""), { waitUntil: "load", timeout: 120000 });
    await page.waitForFunction(() => !document.getElementById("ld-chargement"), null, { timeout: 60000 });
    await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(1500);
    const mesures = [await page.evaluate(geometrie)];
    // Parcours de stress raccourci : yA ↔ yB deux fois, par pas de 1/3 d'écran, une image entre chaque pas.
    await page.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; });
    for (let k = 0; k < 4; k++) {
      const g = mesures[mesures.length - 1], cible = k % 2 === 0 ? g.yA : g.yB;
      await page.evaluate(async (cible) => { const pas = innerHeight / 3; for (let i = 0; i < 400 && Math.abs(scrollY - cible) > 2; i++) { scrollTo(0, scrollY + Math.sign(cible - scrollY) * Math.min(pas, Math.abs(cible - scrollY))); await new Promise((ok) => requestAnimationFrame(ok)); } }, cible);
      await page.waitForTimeout(400);
      mesures.push(await page.evaluate(geometrie));
      if (profil === "mobile") await page.screenshot({ path: path.join(SORTIE, `${profil}-${sans.replace(",", "-") || "reference"}-${k % 2 === 0 ? "yA" : "yB"}.png`) });
    }
    const vis = await page.evaluate(({ LUMIERE, affiche }) => {
      const f = new Function("sel", "return (" + affiche + ")(sel)");
      return { cams: f(".vfa-cam"), lumiere: LUMIERE.map((s) => f(s)).flat(), fig: f(".vfp-fig"), scenes: f(".vfp-scene, .vfa-scene"), classes: document.documentElement.className };
    }, { LUMIERE, affiche: affiche.toString() });
    await ctx.close();
    const nom = `${profil} ${sans || "référence"}`;
    if (!sans) { ref.mesures = mesures; resume[nom] = mesures[0]; }
    else {
      const ecart = Math.max(...mesures.flatMap((m, i) => Object.keys(m).map((k) => Math.abs(m[k] - ref.mesures[i][k]))));
      verifier(`${nom} : géométrie identique à la référence (chargée + 4 bornes du parcours)`, ecart <= 0.5, `écart max ${ecart} px`);
    }
    const veutCams = !sans.includes("etude"), veutLum = !sans.includes("lumiere");
    verifier(`${nom} : caméras de l'étude ${veutCams ? "affichées" : "retirées"}`, vis.cams.length === 2 && vis.cams.every((x) => x === veutCams));
    verifier(`${nom} : calques de lumière ${veutLum ? "affichés" : "retirés"}`, vis.lumiere.length >= LUMIERE.length && vis.lumiere.every((x) => x === veutLum), `${vis.lumiere.length} éléments`);
    verifier(`${nom} : figure et scènes affichées`, vis.fig.every(Boolean) && vis.scenes.length === 2 && vis.scenes.every(Boolean));
  }
}
console.log("Référence (page chargée) :", JSON.stringify(resume));

// Variante « affiche » : will-change: filter sur le seul bouton.
{
  const ctx = await nav.newContext(PROFILS.mobile); await ctx.route(/loan-api|stripe|cloudflareinsights|jsdelivr/, (r) => r.abort());
  const page = await ctx.newPage(); await page.goto(BASE + "/?v=affiche", { waitUntil: "load", timeout: 120000 });
  await page.waitForFunction(() => !document.getElementById("ld-chargement"), null, { timeout: 60000 });
  const wc = await page.evaluate(() => ({ affiche: getComputedStyle(document.querySelector(".vfp-affiche")).willChange,
    autres: [...document.querySelectorAll(".vfp-texte, .vfp-c, .vfa-taiji")].map((e) => getComputedStyle(e).willChange).filter((w) => w.includes("filter")).length }));
  verifier("affiche : will-change: filter sur le bouton See pricing seulement", wc.affiche === "filter" && wc.autres === 0, JSON.stringify(wc));
  await ctx.close();
}
await nav.close(); srv.close();
console.log(echecs ? `${echecs} échec(s)` : "Tous les contrôles sont OK");
process.exit(echecs ? 1 : 0);
