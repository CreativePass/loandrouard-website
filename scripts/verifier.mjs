// Vérifications du § 8 : compare le site construit (ou en ligne) à l'export brut, pixel par pixel.
// Usage :
//   npm run verifier                         → compare http://localhost:8788 (npm run apercu) à l'export brut
//   npm run verifier -- https://loandrouard.com   → compare le site en ligne à l'export brut
// Résultats : verification/<largeur>/<page>-<hauteur>-{ref,site,diff}.png + rapport.txt
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright-core";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

const RACINE = path.resolve(import.meta.dirname, "..");
const SORTIE = path.join(RACINE, "verification");
const SITE = (process.argv[2] || "http://localhost:8788").replace(/\/$/, "");
const LARGEURS = process.env.VERIF_LARGEURS ? process.env.VERIF_LARGEURS.split(",").map(Number) : [1440, 1280, 390];
const HAUTEURS = [0, 0.15, 0.3, 0.5, 0.7, 1]; // fractions de la hauteur de page
const TOUTES = [
  ["accueil", "/"],
  ["video-feedback", "/Video%20Feedback.dc.html"],
  ["cgv-en", "/CGV.dc.html"],
  ["cgv-fr", "/CGV.dc.html?lang=fr"],
  ["privacy-en", "/Privacy.dc.html"],
  ["privacy-fr", "/Privacy.dc.html?lang=fr"],
  ["legal-en", "/Legal.dc.html"],
  ["legal-fr", "/Legal.dc.html?lang=fr"],
];
const PAGES = process.env.VERIF_PAGES ? TOUTES.filter(([n]) => process.env.VERIF_PAGES.split(",").includes(n)) : TOUTES;

// Référence : l'export brut servi tel quel (équivalent de « python3 -m http.server » à la racine).
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp",
  ".woff2": "font/woff2", ".json": "application/json", ".mp4": "video/mp4" };
const ref = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p === "/") p = "/index.html";
  const f = path.join(RACINE, p);
  if (!f.startsWith(RACINE) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": TYPES[path.extname(f)] || "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
}).listen(0);
const REF = `http://localhost:${ref.address().port}`;

// Les CDN (unpkg, jsdelivr) peuvent être injoignables depuis la machine de test : on sert alors
// les mêmes fichiers depuis node_modules (identiques octet pour octet, l'empreinte SRI le garantit).
const CDN_LOCAL = {
  "https://unpkg.com/react@18.3.1/umd/react.production.min.js": "react/umd/react.production.min.js",
  "https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js": "react-dom/umd/react-dom.production.min.js",
  "https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js": "qrcode-generator/qrcode.js",
};
const cdnJoignable = await fetch("https://unpkg.com/react@18.3.1/package.json").then((r) => r.ok, () => false);

const navigateur = await chromium.launch({
  executablePath: fs.existsSync("/opt/pw-browsers/chromium-1194/chrome-linux/chrome")
    ? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" : undefined,
  channel: fs.existsSync("/opt/pw-browsers") ? undefined : "chrome",
});

const rapport = [];
const log = (s) => { console.log(s); rapport.push(s); };

const T0 = new Date("2026-10-01T10:00:00Z").getTime();
// Laisse le réseau et le décodage d'images finir (temps réel), puis fait avancer l'horloge figée.
async function avancer(page, ms) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.evaluate(() => Promise.all([...document.images].map((i) => i.decode().catch(() => {}))));
  await page.clock.runFor(ms);
  await page.waitForTimeout(200);
}

async function ouvrir(ctx, url, journal) {
  const page = await ctx.newPage();
  // Même tirage aléatoire des deux côtés (poussière d'or…), pour comparer à l'identique.
  await page.addInitScript(() => {
    let s = 42; Math.random = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  });
  if (!cdnJoignable) {
    await page.route(/unpkg\.com|cdn\.jsdelivr\.net/, (route) => {
      const local = CDN_LOCAL[route.request().url()];
      if (local) return route.fulfill({ path: path.join(RACINE, "node_modules", local),
        contentType: "text/javascript", headers: { "access-control-allow-origin": "*" } });
      return route.abort();
    });
  }
  if (journal) {
    page.on("console", (m) => { if (m.type() === "error") journal.push(`console : ${m.text()}`); });
    page.on("pageerror", (e) => journal.push(`erreur JS : ${e.message}`));
    page.on("response", (r) => { if (r.status() >= 400) journal.push(`${r.status()} ${r.url()}`); });
    page.on("requestfailed", (r) => journal.push(`échec ${r.url()} (${r.failure()?.errorText})`));
  }
  // Horloge figée : les animations pilotées par le temps (zoom lent, lumière…) avancent exactement
  // du même temps des deux côtés ; seule une différence d'hébergement peut alors créer un écart.
  await page.clock.install({ time: T0 });
  await page.clock.pauseAt(T0 + 10);
  await page.goto(url, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  for (let i = 0; i < 120 && await page.evaluate(() => !!document.getElementById("ld-chargement")); i++) {
    await page.waitForTimeout(100);
    await page.clock.runFor(250);
  }
  await avancer(page, 3000);
  return page;
}

async function capture(page, fraction) {
  // Défilement instantané (la page peut avoir scroll-behavior: smooth), puis attente que tout soit posé.
  await page.evaluate((f) => window.scrollTo({ top: Math.round((document.documentElement.scrollHeight - innerHeight) * f), behavior: "instant" }), fraction);
  let y = -1;
  for (let i = 0; i < 40; i++) {
    await avancer(page, 500);
    await page.waitForTimeout(300);
    const ny = await page.evaluate(() => scrollY);
    if (ny === y) break;
    y = ny;
  }
  await avancer(page, 3000);
  return PNG.sync.read(await page.screenshot({ animations: "disabled", caret: "hide" }));
}

let totalEcarts = 0;
for (const largeur of LARGEURS) {
  const dossier = path.join(SORTIE, String(largeur));
  fs.mkdirSync(dossier, { recursive: true });
  const ctx = await navigateur.newContext({ viewport: { width: largeur, height: largeur > 500 ? 900 : 844 },
    deviceScaleFactor: 1, reducedMotion: "no-preference", ignoreHTTPSErrors: !cdnJoignable });
  for (const [nom, chemin] of PAGES) {
    const journal = [];
    const pr = await ouvrir(ctx, REF + chemin);
    const ps = await ouvrir(ctx, SITE + chemin, journal);
    for (const f of HAUTEURS) {
      const a = await capture(pr, f), b = await capture(ps, f);
      const etiquette = `${largeur}px ${nom} @${Math.round(f * 100)}%`;
      if (a.width !== b.width || a.height !== b.height) { log(`ÉCART TAILLE ${etiquette}`); totalEcarts++; continue; }
      const diff = new PNG({ width: a.width, height: a.height });
      const n = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0.1 });
      const pct = (100 * n / (a.width * a.height)).toFixed(3);
      const base = path.join(dossier, `${nom}-${Math.round(f * 100)}`);
      if (n) {
        fs.writeFileSync(base + "-ref.png", PNG.sync.write(a));
        fs.writeFileSync(base + "-site.png", PNG.sync.write(b));
        fs.writeFileSync(base + "-diff.png", PNG.sync.write(diff));
        totalEcarts++;
      } else if (f === 0) fs.writeFileSync(base + "-site.png", PNG.sync.write(b));
      log(`${n ? "DIFF " : "ok   "} ${etiquette} : ${n} px (${pct} %)`);
    }
    // En-tête : Home / The Journey / Press grisés et inatteignables au clavier.
    const entete = await ps.evaluate(() => {
      const noms = ["Home", "The Journey", "Press / Contact"];
      const els = [...document.querySelectorAll("header a, header span, nav a, nav span")]
        .filter((e) => noms.includes(e.textContent.trim()));
      return els.map((e) => `${e.textContent.trim()}:${e.tagName}:${e.getAttribute("aria-disabled")}:${e.tabIndex}`);
    });
    const focus = [];
    for (let i = 0; i < 25; i++) {
      await ps.keyboard.press("Tab");
      focus.push(await ps.evaluate(() => document.activeElement?.textContent?.trim().slice(0, 30)));
    }
    if (entete.some((e) => !e.includes(":SPAN:true:-1")) || focus.some((t) => ["Home", "The Journey", "Press / Contact"].includes(t)))
      journal.push(`en-tête : ${entete.join(" | ")} ; focus clavier : ${focus.join(" > ")}`);
    const sponsors = await ps.evaluate(() => /Powered by/i.test(document.body.innerText));
    if (!sponsors) journal.push("bloc « Powered by » absent");
    for (const j of journal.filter((j) => !/js\.stripe\.com/.test(j))) log(`  ${nom} (${largeur}px) ${j}`);
    await pr.close(); await ps.close();
  }
  await ctx.close();
}

fs.writeFileSync(path.join(SORTIE, "rapport.txt"), rapport.join("\n") + "\n");
log(`\n${totalEcarts} capture(s) avec écart. CDN ${cdnJoignable ? "en ligne" : "servis localement (CDN injoignable)"}.`);
await navigateur.close();
ref.close();
