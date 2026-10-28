// Vérifie l'écran de chargement face aux extensions du navigateur (retour de Loan du 28/10 : 96 % pendant ~20 s sur
// ordinateur). Une extension de test pose son propre script dans la page, comme beaucoup d'extensions (bloqueur de
// pub, mots de passe, traduction) : il se charge sans laisser de trace (Resource Timing), et l'écran l'attendait
// jusqu'à sa limite de 20 s. Mesure le temps jusqu'au retrait de l'écran, avec et sans extension, ordinateur et
// mobile, anglais et français ; plus un témoin (chargement.js sans la correction) qui doit, lui, rester bloqué.
// Usage (après npm run construire) : node scripts/verif-chargement.mjs
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright-core";

const RACINE = path.resolve(import.meta.dirname, ".."), PUBLIC = path.join(RACINE, "public");
const CHROMIUM = process.env.CHROMIUM || "/opt/pw-browsers/chromium"; // Chromium complet : la coquille sans tête n'accepte pas les extensions
const LIMITE = 8000; // ms : au-delà, l'écran a attendu quelque chose qui n'arrive pas
const T = { html: "text/html", js: "text/javascript", css: "text/css", png: "image/png", webp: "image/webp", jpg: "image/jpeg", svg: "image/svg+xml", woff2: "font/woff2", ico: "image/x-icon", json: "application/json" };

// Ligne corrigée (scripts/optimisations.mjs) et ligne d'avant, pour le témoin.
const CORRIGE = "const recu = u => !/^https?:/.test(abs(u)) || echecs.has(abs(u))";
const AVANT = "const recu = u => /^(blob|data):/.test(u) || echecs.has(abs(u))";
const source = fs.readFileSync(path.join(PUBLIC, "chargement.js"), "utf8");
if (!source.includes(CORRIGE)) { console.error("public/chargement.js ne contient pas la correction : lancer npm run construire"); process.exit(1); }

// Extension de test : un script de l'extension posé dans la page dès le début, et laissé en place.
const EXT = fs.mkdtempSync(path.join(os.tmpdir(), "verif-chargement-ext-"));
fs.writeFileSync(path.join(EXT, "manifest.json"), JSON.stringify({ manifest_version: 3, name: "verif-chargement", version: "1",
  content_scripts: [{ matches: ["<all_urls>"], js: ["cs.js"], run_at: "document_start" }],
  web_accessible_resources: [{ resources: ["page.js"], matches: ["<all_urls>"] }] }));
fs.writeFileSync(path.join(EXT, "cs.js"), 'const s = document.createElement("script"); s.src = chrome.runtime.getURL("page.js"); (document.head || document.documentElement).appendChild(s);\n');
fs.writeFileSync(path.join(EXT, "page.js"), "window.__extension = 1;\n");

const srv = http.createServer((q, r) => { let p = decodeURIComponent(new URL(q.url, "http://x").pathname); if (p === "/") p = "/index.html"; const f = path.join(PUBLIC, p);
  if (!f.startsWith(PUBLIC) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { "content-type": T[path.extname(f).slice(1)] || "application/octet-stream" }); fs.createReadStream(f).pipe(r); });
await new Promise((ok) => srv.listen(0, "127.0.0.1", ok));
const BASE = `http://127.0.0.1:${srv.address().port}/`;

const PROFILS = { ordinateur: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }, mobile: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true } };
const CAS = [];
for (const profil of Object.keys(PROFILS)) for (const langue of ["", "?lang=fr"]) for (const extension of [true, false]) CAS.push({ profil, langue, extension, temoin: false });
CAS.push({ profil: "ordinateur", langue: "", extension: true, temoin: true });

async function mesurer(c) {
  const dossier = fs.mkdtempSync(path.join(os.tmpdir(), "verif-chargement-profil-"));
  const ctx = await chromium.launchPersistentContext(dossier, { executablePath: CHROMIUM, headless: true, ...PROFILS[c.profil],
    args: c.extension ? [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`] : [],
    proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: "127.0.0.1" } : undefined });
  try {
    const p = ctx.pages()[0] || await ctx.newPage();
    await p.route(/loan-api|stripe|cloudflareinsights/, (r) => r.abort()); // aucun appel à l'API ni à Stripe
    if (c.temoin) await p.route(/chargement\.js/, (r) => r.fulfill({ status: 200, contentType: "text/javascript", body: source.replace(CORRIGE, AVANT) }));
    // Instant du retrait de l'écran, compté depuis le début de la navigation.
    await p.addInitScript(() => { let vu = false; const o = new MutationObserver(() => { const e = document.getElementById("ld-chargement");
      if (e) vu = true; else if (vu) { window.__fin = performance.now(); o.disconnect(); } }); o.observe(document, { childList: true, subtree: true }); });
    await p.goto(BASE + c.langue, { waitUntil: "commit" });
    await p.waitForFunction(() => window.__fin, null, { timeout: 40000, polling: 100 });
    return await p.evaluate(() => ({ fin: Math.round(window.__fin), ext: !!document.querySelector('script[src^="chrome-extension:"]') }));
  } finally { await ctx.close(); fs.rmSync(dossier, { recursive: true, force: true }); }
}

let echec = false;
for (const c of CAS) {
  const r = await mesurer(c);
  const nom = `${c.temoin ? "témoin (sans la correction)" : "corrigé"}, ${c.profil}, ${c.langue ? "français" : "anglais"}, ${c.extension ? "avec" : "sans"} extension`;
  // Témoin : doit rester bloqué (sinon la vérification ne prouve rien) ; les autres : sous la limite.
  const ok = c.extension && !r.ext ? false : c.temoin ? r.fin > 15000 : r.fin < LIMITE;
  if (!ok) echec = true;
  console.log(`${ok ? "OK    " : "ÉCHEC "} ${nom.padEnd(64)} écran retiré à ${(r.fin / 1000).toFixed(1)} s${c.extension && !r.ext ? " (script d'extension absent de la page)" : ""}`);
}
srv.close(); fs.rmSync(EXT, { recursive: true, force: true });
process.exit(echec ? 1 : 0);
