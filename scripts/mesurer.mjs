// Mesures de performance : sert un dossier construit (public/ ou une copie) comme en production,
// puis mesure dans Chromium le chargement, le défilement, le repos, les interactions, la mémoire
// et les clignotements. Outil d'audit : ne modifie rien, aucun paiement (POST bloqués).
// Usage :
//   node scripts/mesurer.mjs <dossier> <nom> [scénarios] [profils]
//     scénarios : charge,defile,repos,interactions,legal,fuites,calques,film (défaut : tous)
//     profils   : bureau,mobile (défaut : les deux)
//   node scripts/mesurer.mjs --servir <dossier> [port]   → sert le dossier (Lighthouse), Ctrl+C pour arrêter
//   node scripts/mesurer.mjs --comparer <nomA> <nomB>    → tableau AVANT → APRÈS des deux séries de mesures
// Résultats : mesures/<nom>/resultats.json (+ images du film de chargement).
// MESURE_PAGES=vf,cgv limite le scénario « charge » à ces pages ; MESURE_VITESSES=normal, le défilement.
// Réseau simulé : « bonne connexion » (bureau : 30 ms aller-retour, 50 Mbit/s ; mobile : 60 ms, 15 Mbit/s,
// processeur ×4 plus lent). Chaque nouvelle connexion à un domaine coûte 3 allers-retours (DNS, TCP, TLS).
// Les ressources tierces (unpkg, Google Fonts, loan-api /places) sont téléchargées une fois (curl, proxy
// compris) puis rejouées à l'identique depuis mesures/cache-tiers/.
import fs from "node:fs";
import http2 from "node:http2";
import path from "node:path";
import zlib from "node:zlib";
import crypto from "node:crypto";
import { execFileSync, execFile } from "node:child_process";
import { promisify } from "node:util";
import { chromium } from "playwright-core";
import { PNG } from "pngjs";

const RACINE = path.resolve(import.meta.dirname, "..");
const MESURES = path.join(RACINE, "mesures");
const CACHE = path.join(MESURES, "cache-tiers");
const SITE = "loandrouard.com";
const CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";
const UA_MOBILE = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36";
const PROFILS = {
  bureau: { rtt: 30, debit: 50e6, cpu: 1, ctx: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, userAgent: UA } },
  mobile: { rtt: 60, debit: 15e6, cpu: 4, ctx: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: UA_MOBILE } },
};
const PAGES = { vf: "/", cgv: "/CGV.dc.html?lang=fr", privacy: "/Privacy.dc.html", legal: "/Legal.dc.html" };
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : null; };
const quantile = (a, q) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(q * s.length))] : null; };
const arr = (v, n = 1) => (v == null ? null : Math.round(v * 10 ** n) / 10 ** n);

// --- Serveur local « comme en production » ---------------------------------------------------------
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".woff2": "font/woff2", ".json": "application/json" };
const TEXTE = /^(text\/|application\/(javascript|json)|image\/svg)/;

function certificat() {
  const dir = path.join(MESURES, "cert"), cle = path.join(dir, "cle.pem"), crt = path.join(dir, "cert.pem");
  if (!fs.existsSync(crt)) {
    fs.mkdirSync(dir, { recursive: true });
    execFileSync("openssl", ["req", "-x509", "-newkey", "rsa:2048", "-nodes", "-keyout", cle, "-out", crt, "-days", "365", "-subj", "/CN=local"], { stdio: "ignore" });
  }
  return { key: fs.readFileSync(cle), cert: fs.readFileSync(crt) };
}

function empreinteCertificat() {
  const pem = fs.readFileSync(path.join(MESURES, "cert", "cert.pem"), "utf8");
  return crypto.createHash("sha256").update(new crypto.X509Certificate(pem).publicKey.export({ type: "spki", format: "der" })).digest("base64");
}

// _headers de Cloudflare : motifs avec *, règles cumulées.
function lireHeaders(dossier) {
  const f = path.join(dossier, "_headers"), regles = [];
  if (!fs.existsSync(f)) return regles;
  let cur = null;
  for (const l of fs.readFileSync(f, "utf8").split("\n")) {
    if (!l.trim() || l.trim().startsWith("#")) continue;
    if (!/^\s/.test(l)) { cur = { re: new RegExp("^" + l.trim().replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$"), h: {} }; regles.push(cur); }
    else if (cur) { const i = l.indexOf(":"); cur.h[l.slice(0, i).trim().toLowerCase()] = l.slice(i + 1).trim(); }
  }
  return regles;
}

// Seuls les domaines tiers utilisés par le site sont téléchargés ; le reste (services de Chromium…) reçoit 404.
const TIERS = /^https:\/\/(unpkg\.com|fonts\.googleapis\.com|fonts\.gstatic\.com|loan-api\.loandrouard-website\.workers\.dev|cdn\.jsdelivr\.net)\//;
async function telechargerTiers(url) {
  const id = crypto.createHash("sha1").update(url).digest("hex"), meta = path.join(CACHE, id + ".json"), corps = path.join(CACHE, id + ".bin");
  if (fs.existsSync(meta)) return { ...JSON.parse(fs.readFileSync(meta, "utf8")), corps: fs.readFileSync(corps) };
  fs.mkdirSync(CACHE, { recursive: true });
  const hdr = path.join(CACHE, id + ".hdr");
  const args = ["-sS", "--compressed", "--max-time", "40", "-D", hdr, "-o", corps, "-A", UA];
  if (url.includes("loan-api")) args.push("-H", "Origin: https://" + SITE);
  try { await promisify(execFile)("curl", [...args, url]); } catch { return null; }
  const blocs = fs.readFileSync(hdr, "utf8").trim().split(/\r?\n\r?\n/);
  const lignes = blocs[blocs.length - 1].split(/\r?\n/);
  const status = +lignes[0].split(" ")[1], headers = {};
  for (const l of lignes.slice(1)) { const i = l.indexOf(":"); if (i > 0) headers[l.slice(0, i).trim().toLowerCase()] = l.slice(i + 1).trim(); }
  const garde = {};
  for (const k of ["content-type", "cache-control", "access-control-allow-origin", "timing-allow-origin", "etag", "last-modified"]) if (headers[k]) garde[k] = headers[k];
  fs.writeFileSync(meta, JSON.stringify({ url, status, headers: garde }));
  fs.rmSync(hdr);
  return { url, status, headers: garde, corps: fs.readFileSync(corps) };
}

function demarrerServeur(dossier, port = 0) {
  const regles = lireHeaders(dossier), compresse = new Map(), vus = new WeakMap();
  const etat = { rtt: 0, journal: [] };
  const br = (cle, buf) => { if (!compresse.has(cle)) compresse.set(cle, zlib.brotliCompressSync(buf, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 5 } })); return compresse.get(cle); };
  const srv = http2.createSecureServer({ ...certificat(), allowHTTP1: true }, async (req, res) => {
    const hote = (req.headers[":authority"] || req.headers.host || "").replace(/:\d+$/, "");
    const cnx = req.stream ? req.stream.session : req.socket;
    let deja = vus.get(cnx); if (!deja) vus.set(cnx, (deja = new Set()));
    let delai = etat.rtt; if (!deja.has(hote)) { deja.add(hote); delai += 3 * etat.rtt; }
    if (delai) await dormir(delai);
    const accepte = /\bbr\b/.test(req.headers["accept-encoding"] || "");
    const envoyer = (status, headers, corps, cle) => {
      if (corps && accepte && TEXTE.test(headers["content-type"] || "") && status === 200) { corps = br(cle, corps); headers["content-encoding"] = "br"; }
      res.writeHead(status, headers); res.end(corps || undefined);
    };
    if (hote === SITE) {
      let p; try { p = decodeURIComponent(new URL(req.url, "https://x").pathname); } catch { p = "/"; }
      if (p === "/") p = "/index.html";
      const f = path.join(dossier, p);
      if (!f.startsWith(dossier) || p === "/_headers" || !fs.existsSync(f) || fs.statSync(f).isDirectory())
        return envoyer(404, { "content-type": "text/plain; charset=utf-8" }, Buffer.from("404 — page introuvable"), "404");
      const corps = fs.readFileSync(f), type = TYPES[path.extname(f)] || "application/octet-stream", headers = { "content-type": type };
      // Comme Cloudflare (constaté le 02/10) : HTML sans cache-control ni ETag ; le reste revalidé par ETag sauf règle _headers.
      if (type !== "text/html") {
        headers["cache-control"] = "public, max-age=0, must-revalidate";
        for (const r of regles) if (r.re.test(p)) Object.assign(headers, r.h);
        headers.etag = 'W/"' + crypto.createHash("md5").update(corps).digest("hex") + '"';
        if (req.headers["if-none-match"] === headers.etag) { res.writeHead(304, headers); return res.end(); }
      }
      etat.journal.push(p);
      return envoyer(200, headers, corps, f + fs.statSync(f).mtimeMs);
    }
    const url = "https://" + hote + req.url;
    if (req.method !== "GET") return envoyer(503, { "content-type": "text/plain", "access-control-allow-origin": "*" }, Buffer.from("bloqué (mesure)"), "503");
    if (!TIERS.test(url)) return envoyer(404, { "content-type": "text/plain" }, Buffer.from("hors mesure"), "404");
    const t = await telechargerTiers(url);
    if (!t) return envoyer(502, { "content-type": "text/plain" }, Buffer.from("injoignable"), "502");
    etat.journal.push(url);
    return envoyer(t.status, { ...t.headers }, t.corps, url);
  });
  return new Promise((ok) => srv.listen(port, "127.0.0.1", () => ok({ srv, port: srv.address().port, etat })));
}

// --- Instrumentation injectée dans chaque page ----------------------------------------------------
function instrumenter() {
  const M = (window.__mesure = { t: {}, ls: [], lt: [], loaf: [], ev: [], mut: {}, recrees: 0, polices: [], images: [], raf: 0, to: 0, pile: {}, frames: null, tard: [] });
  const now = () => performance.now();
  const desc = (n) => { if (!n || !n.tagName) return n && n.nodeName ? n.nodeName : "?"; const c = typeof n.className === "string" ? n.className.trim().split(/\s+/).slice(0, 2).join(".") : ""; return n.tagName.toLowerCase() + (n.id ? "#" + n.id : "") + (c ? "." + c : ""); };
  const po = (type, cb, o) => { try { new PerformanceObserver((l) => l.getEntries().forEach(cb)).observe(Object.assign({ type, buffered: true }, o || {})); } catch (e) {} };
  po("paint", (e) => { M.t[e.name] = e.startTime; });
  po("largest-contentful-paint", (e) => { M.t.lcp = e.startTime; M.t.lcpEl = desc(e.element); });
  po("layout-shift", (e) => { if (!e.hadRecentInput) M.ls.push({ t: e.startTime, v: e.value, src: (e.sources || []).map((s) => desc(s.node)) }); });
  po("longtask", (e) => M.lt.push({ t: e.startTime, d: e.duration }));
  po("long-animation-frame", (e) => M.loaf.push({ t: e.startTime, d: e.duration, bloc: e.blockingDuration,
    sl: e.styleAndLayoutStart ? e.startTime + e.duration - e.styleAndLayoutStart : 0,
    s: e.scripts.map((s) => ({ f: (s.sourceURL || "").split("/").pop().split("?")[0] + ":" + (s.sourceFunctionName || "?") + " (" + s.invokerType + ")", d: s.duration, fl: s.forcedStyleAndLayoutDuration })) }));
  const cible = (n) => { let x = n; while (x && x.nodeType === 1 && !(typeof x.className === "string" && x.className.trim()) && x.parentElement) x = x.parentElement; return desc(x); };
  po("event", (e) => { if (e.interactionId) M.ev.push({ n: e.name, d: e.duration, t: e.startTime, c: cible(e.target), att: e.processingStart - e.startTime, trait: e.processingEnd - e.processingStart }); }, { durationThreshold: 16 });
  // Pile d'appel échantillonnée : qui relance requestAnimationFrame / setTimeout.
  const qui = () => { const l = (new Error().stack || "").split("\n")[3] || ""; return l.trim().replace(/\(?https?:\/\/[^/]+\//, "").replace(/\)$/, "").slice(0, 90); };
  const raf0 = window.requestAnimationFrame.bind(window), to0 = window.setTimeout.bind(window);
  M.raf0 = raf0;
  window.requestAnimationFrame = (cb) => { if (M.raf++ % 25 === 0) { const k = qui(); M.pile["raf " + k] = (M.pile["raf " + k] || 0) + 1; } return raf0(cb); };
  window.setTimeout = (cb, ms, ...a) => { if (M.to++ % 10 === 0) { const k = qui(); M.pile["timeout " + k] = (M.pile["timeout " + k] || 0) + 1; } return to0(cb, ms, ...a); };
  window.open = () => null; // aucun onglet Stripe pendant les mesures
  // « Prête » : début de la dernière période où les conditions de l'écran de chargement (chargement.js : rendu,
  // polices, feuilles, scripts, images visibles) sont toutes remplies, avant le fondu. Plus précis que « révélée »,
  // qui ajoute les délais fixes de l'écran (300 ms de stabilité, seuil de 650 ms, fondu).
  { let debut = 0;
    const vue = (n) => { const r = n.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight * 1.1; };
    const recu = (u) => /^(blob|data):/.test(u) || performance.getEntriesByName(new URL(u, location.href).href).length > 0;
    const sonde = () => {
      if (M.t.revele) { M.t.pret = debut || M.t.revele; return; }
      const d = document, lu = d.readyState !== "loading";
      const rendu = lu && [...d.querySelectorAll("body section, body header")].some((n) => n.offsetHeight > 0);
      let ok = rendu && (!d.fonts || d.fonts.status === "loaded");
      if (ok) for (const l of d.querySelectorAll('link[rel="stylesheet"][href]')) if (!(l.sheet || recu(l.href))) { ok = false; break; }
      if (ok) for (const s of d.querySelectorAll("script[src]")) if (!recu(s.src)) { ok = false; break; }
      if (ok) for (const i of d.images) if (i.loading !== "lazy" && vue(i) && !i.complete) { ok = false; break; }
      debut = ok ? (debut || now()) : 0;
      to0(sonde, 25);
    };
    to0(sonde, 25);
  }
  // Premier rendu du moteur : #dc-root reçoit son contenu.
  new MutationObserver((ms, o) => { const r = document.getElementById("dc-root"); if (r && r.firstElementChild) { M.t.rendu = now(); o.disconnect(); } }).observe(document, { childList: true, subtree: true });
  // Écran de chargement : début du fondu (page révélée) et retrait.
  new MutationObserver((ms, o) => {
    const el = document.getElementById("ld-chargement");
    if (!el) return;
    o.disconnect();
    new MutationObserver(() => { if (!M.t.revele && el.classList.contains("is-fin")) M.t.revele = now(); }).observe(el, { attributes: true });
    new MutationObserver(() => { if (!M.t.fin && !el.isConnected) { M.t.fin = now(); if (!M.t.revele) M.t.revele = M.t.fin; } }).observe(document.documentElement, { childList: true });
  }).observe(document, { childList: true, subtree: true });
  // Éléments ajoutés / retirés après la révélation de la page (recréations = clignotements possibles).
  const retires = new Map();
  new MutationObserver((ms) => {
    if (!M.t.revele) return;
    for (const m of ms) {
      if (m.type !== "childList") continue;
      for (const n of m.removedNodes) if (n.nodeType === 1) { const k = "−" + desc(n) + " ⊂ " + desc(m.target); M.mut[k] = (M.mut[k] || 0) + 1; retires.set(desc(n), now()); }
      for (const n of m.addedNodes) if (n.nodeType === 1) { const k = "+" + desc(n) + " ⊂ " + desc(m.target); M.mut[k] = (M.mut[k] || 0) + 1; const r = retires.get(desc(n)); if (r != null && now() - r < 100 && n.getBoundingClientRect().height > 0) M.recrees++; }
    }
  }).observe(document, { childList: true, subtree: true });
  document.fonts.addEventListener("loadingdone", (e) => e.fontfaces.forEach((f) => M.polices.push({ t: now(), f: f.family + " " + f.weight + " " + f.style })));
  document.addEventListener("load", (e) => {
    const i = e.target;
    if (i.tagName !== "IMG") return;
    const r = i.getBoundingClientRect();
    M.images.push({ t: now(), src: (i.currentSrc || i.src).split("/").pop(), vue: r.bottom > 0 && r.top < innerHeight && r.width > 0 });
  }, true);
  // Images qui entrent à l'écran avant d'être chargées et décodées (apparitions tardives).
  M.surveiller = () => {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      const i = e.target;
      if (e.isIntersecting && !(i.complete && i.naturalWidth)) M.tard.push({ t: now(), src: (i.currentSrc || i.src).split("/").pop(), y: Math.round(scrollY) });
    }));
    document.querySelectorAll("img").forEach((i) => io.observe(i));
  };
  M.echantillonner = (on) => {
    if (!on) { M.on = false; return; }
    M.frames = []; M.on = true;
    M.ys = [];
    const f = (t) => { if (!M.on) return; M.frames.push(t); M.ys.push(scrollY); raf0(f); };
    raf0(f);
  };
}

// --- Navigateur ---------------------------------------------------------------------------------------
async function navigateur(port) {
  return chromium.launch({
    executablePath: fs.existsSync(CHROME) ? CHROME : undefined,
    // Certificat local accepté par son empreinte : sans erreur de certificat, Chromium garde son cache HTTP.
    args: [`--host-resolver-rules=MAP * 127.0.0.1:${port}`, "--no-proxy-server", "--disable-background-networking", "--disable-component-update", "--ignore-certificate-errors-spki-list=" + empreinteCertificat()],
  });
}

async function contexte(nav, profil, srv) {
  const P = PROFILS[profil];
  srv.etat.rtt = P.rtt;
  const ctx = await nav.newContext({ ...P.ctx, reducedMotion: "no-preference" });
  await ctx.addInitScript(instrumenter);
  // Diagnostic par ablation : MESURE_CSS / MESURE_JS ajoutent du CSS ou du JS à chaque page mesurée.
  if (process.env.MESURE_CSS) await ctx.addInitScript((css) => { document.addEventListener("DOMContentLoaded", () => { const s = document.createElement("style"); s.textContent = css; document.documentElement.appendChild(s); }); }, process.env.MESURE_CSS);
  if (process.env.MESURE_JS) await ctx.addInitScript({ content: process.env.MESURE_JS });
  return ctx;
}

async function ouvrir(ctx, profil, chemin, opts = {}) {
  const P = PROFILS[profil];
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: P.debit / 8, uploadThroughput: P.debit / 32 });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: P.cpu });
  await cdp.send("Performance.enable");
  const req = new Map(), journal = [], debuts = new Map();
  cdp.on("Network.requestWillBeSent", (e) => { if (!debuts.has(e.requestId)) debuts.set(e.requestId, e.timestamp); });
  cdp.on("Network.responseReceived", (e) => req.set(e.requestId, { url: e.response.url, type: e.type, status: e.response.status, cache: e.response.fromDiskCache || e.response.fromMemoryCache || e.response.status === 304, octets: 0, debut: debuts.get(e.requestId), t: e.timestamp }));
  cdp.on("Network.requestServedFromCache", (e) => { const r = req.get(e.requestId); if (r) r.cache = true; });
  cdp.on("Network.loadingFinished", (e) => { const r = req.get(e.requestId); if (r) { r.octets = e.encodedDataLength; r.fin = e.timestamp; } });
  page.on("console", (m) => { if (["error", "warning"].includes(m.type())) journal.push(m.type() + " : " + m.text().slice(0, 200)); });
  page.on("pageerror", (e) => journal.push("erreur JS : " + e.message.slice(0, 200)));
  page.on("response", (r) => { if (r.status() >= 400) journal.push(r.status() + " " + r.url()); });
  let film = null;
  if (opts.film) {
    film = [];
    cdp.on("Page.screencastFrame", (f) => { film.push({ t: f.metadata.timestamp, png: f.data }); cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }).catch(() => {}); });
    await cdp.send("Page.startScreencast", { format: "png", maxWidth: 360, maxHeight: 360, everyNthFrame: 1 });
  }
  const t0 = Date.now();
  await page.goto("https://" + SITE + chemin, { waitUntil: "load", timeout: 90000 });
  // Attente de la fin de l'écran de chargement (s'il existe), puis stabilisation.
  for (let i = 0; i < 300; i++) { if (await page.evaluate(() => !document.getElementById("ld-chargement") || !!window.__mesure.t.fin)) break; await dormir(100); }
  await dormir(opts.stabiliser ?? 2500);
  if (film) await cdp.send("Page.stopScreencast");
  return { page, cdp, req, journal, film, duree: Date.now() - t0 };
}

const metriques = async (cdp) => Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map((m) => [m.name, m.value]));
function cpuNavigateur() {
  let total = 0;
  for (const pid of fs.readdirSync("/proc").filter((d) => /^\d+$/.test(d))) {
    try {
      if (!fs.readFileSync(`/proc/${pid}/cmdline`, "utf8").includes("chrome-linux/chrome")) continue;
      const s = fs.readFileSync(`/proc/${pid}/stat`, "utf8").split(") ")[1].split(" ");
      total += +s[11] + +s[12];
    } catch {}
  }
  return total / 100; // secondes de processeur (CLK_TCK = 100)
}

function bilanReseau(req) {
  const parType = {}; let n = 0, octets = 0, depuisCache = 0;
  for (const r of req.values()) {
    if (r.url.startsWith("data:")) continue;
    n++; octets += r.octets; if (r.cache) depuisCache++;
    const ty = r.type || "Other";
    parType[ty] = parType[ty] || { n: 0, ko: 0 }; parType[ty].n++; parType[ty].ko += r.octets / 1024;
  }
  for (const k in parType) parType[k].ko = arr(parType[k].ko);
  const gros = [...req.values()].filter((r) => r.octets > 30 * 1024).sort((a, b) => b.octets - a.octets).slice(0, 12)
    .map((r) => `${arr(r.octets / 1024, 0)} Ko ${decodeURIComponent(r.url.replace("https://" + SITE, "")).slice(0, 90)}`);
  // Cascade : début → fin de chaque requête, en ms depuis la première (le document).
  const liste = [...req.values()].filter((r) => r.debut && !r.url.startsWith("data:")).sort((a, b) => a.debut - b.debut);
  const t0 = liste.length ? liste[0].debut : 0;
  const cascade = liste.map((r) => `${arr((r.debut - t0) * 1000, 0)}→${arr(((r.fin || r.t) - t0) * 1000, 0)} ${r.cache ? "(cache) " : ""}${arr(r.octets / 1024, 0)} Ko ${decodeURIComponent(r.url.replace("https://" + SITE, "")).replace(/_ds\/loan-drouard-design-system-[^/]+\//, "_ds/").slice(0, 80)}`);
  return { requetes: n, depuisCache, ko: arr(octets / 1024), parType, gros, cascade };
}

function bilanPage(M) {
  const cls = M.ls.reduce((s, e) => s + e.v, 0);
  const apres = (l) => l.filter((x) => M.t.revele && x.t > M.t.revele);
  return {
    dcl: arr(M.dcl, 0), rendu: arr(M.t.rendu, 0), pret: arr(M.t.pret, 0), fcp: arr(M.t["first-contentful-paint"], 0), lcp: arr(M.t.lcp, 0), lcpEl: M.t.lcpEl, revele: arr(M.t.revele, 0), fin: arr(M.t.fin, 0),
    cls: arr(cls, 4), decalages: M.ls.filter((e) => e.v > 0.001).slice(0, 8),
    longues: M.lt.length, bloquant: arr(M.lt.reduce((s, e) => s + Math.max(0, e.d - 50), 0), 0),
    loafTop: topScripts(M.loaf, 8),
    policesApres: apres(M.polices).map((p) => `${arr(p.t - M.t.revele, 0)} ms ${p.f}`),
    imagesApres: apres(M.images).map((i) => `${arr(i.t - M.t.revele, 0)} ms ${i.src}${i.vue ? " (à l'écran)" : ""}`),
    mutationsApres: Object.entries(M.mut).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([k, v]) => `${v}× ${k}`),
    recrees: M.recrees,
  };
}

function topScripts(loaf, n) {
  const agg = {};
  for (const f of loaf) for (const s of f.s) { agg[s.f] = agg[s.f] || { d: 0, fl: 0, n: 0 }; agg[s.f].d += s.d; agg[s.f].fl += s.fl; agg[s.f].n++; }
  return Object.entries(agg).sort((a, b) => b[1].d - a[1].d).slice(0, n).map(([k, v]) => `${arr(v.d, 0)} ms (dont mise en page forcée ${arr(v.fl, 0)}) ×${v.n} ${k}`);
}

// --- Scénarios ----------------------------------------------------------------------------------------
async function scenarioCharge(nav, srv, profil, R) {
  R.charge = R.charge || {};
  const choix = process.env.MESURE_PAGES ? process.env.MESURE_PAGES.split(",") : Object.keys(PAGES);
  for (const [nom, chemin] of Object.entries(PAGES).filter(([n]) => choix.includes(n))) {
    const essais = [];
    let chaud = null;
    for (let k = 0; k < +(process.env.MESURE_ESSAIS || 3); k++) {
      const ctx = await contexte(nav, profil, srv);
      const o = await ouvrir(ctx, profil, chemin);
      const M = await o.page.evaluate(() => { const m = window.__mesure; return { ...m, dcl: performance.getEntriesByType("navigation")[0]?.domContentLoadedEventStart, raf0: undefined, surveiller: undefined, echantillonner: undefined }; });
      const met = await metriques(o.cdp);
      essais.push({ page: bilanPage(M), reseau: bilanReseau(o.req), journal: o.journal, tas: arr(met.JSHeapUsedSize / 1048576), noeuds: met.Nodes, script: arr(met.ScriptDuration * 1000, 0), style: arr(met.RecalcStyleDuration * 1000, 0), layout: arr(met.LayoutDuration * 1000, 0), tache: arr(met.TaskDuration * 1000, 0) });
      if (k === 0) {
        // Visite avec cache : même contexte, nouvel onglet.
        await o.page.close();
        const c = await ouvrir(ctx, profil, chemin);
        const Mc = await c.page.evaluate(() => { const m = window.__mesure; return { ...m, dcl: performance.getEntriesByType("navigation")[0]?.domContentLoadedEventStart, raf0: undefined, surveiller: undefined, echantillonner: undefined }; });
        chaud = { page: bilanPage(Mc), reseau: bilanReseau(c.req) };
      }
      await ctx.close();
    }
    const m = (f) => med(essais.map(f).filter((v) => v != null));
    R.charge[nom] = {
      dcl: m((e) => e.page.dcl), rendu: m((e) => e.page.rendu), pret: m((e) => e.page.pret), fcp: m((e) => e.page.fcp), lcp: m((e) => e.page.lcp), revele: m((e) => e.page.revele), fin: m((e) => e.page.fin), cls: m((e) => e.page.cls),
      bloquant: m((e) => e.page.bloquant), script: m((e) => e.script), style: m((e) => e.style), layout: m((e) => e.layout), tache: m((e) => e.tache),
      tas: m((e) => e.tas), noeuds: m((e) => e.noeuds),
      essai: essais[0], chaud,
    };
    console.log(`  charge ${profil} ${nom} : prête ${R.charge[nom].pret} ms (avec cache ${chaud.page.pret}), révélée ${R.charge[nom].revele} ms, LCP ${R.charge[nom].lcp}, ${essais[0].reseau.requetes} req ${essais[0].reseau.ko} Ko ; cache : révélée ${chaud.page.revele} ms, ${chaud.reseau.ko} Ko`);
  }
}

async function defiler(o, profil, vitesse) {
  const { page, cdp } = o;
  const vp = PROFILS[profil].ctx.viewport, acks = [];
  const pas = vitesse === "rapide" ? 260 : 110, periode = vitesse === "rapide" ? 30 : 40;
  let y = -1, immobile = 0;
  for (let i = 0; i < 4000 && immobile < 60; i++) {
    const t = Date.now();
    if (profil === "mobile") {
      // Glissé du doigt (événements tactiles bruts) : 10 mouvements de 16 ms ; on relève l'attente de chaque mouvement.
      const x = Math.round(vp.width / 2), y0 = Math.round(vp.height * 0.8), dy = (pas * 4) / 10;
      await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y: y0 }] });
      for (let k = 1; k <= 10; k++) {
        const tm = Date.now();
        await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: Math.round(y0 - k * dy) }] });
        acks.push(Date.now() - tm);
        await dormir(16);
      }
      await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await dormir(periode * 2);
    } else {
      await cdp.send("Input.dispatchMouseEvent", { type: "mouseWheel", x: vp.width / 2, y: vp.height / 2, deltaX: 0, deltaY: pas });
      acks.push(Date.now() - t);
      const reste = periode - (Date.now() - t); if (reste > 0) await dormir(reste);
    }
    if (i % 5 === 0) {
      const [ny, bas] = await page.evaluate(() => [Math.round(scrollY), scrollY + innerHeight >= document.documentElement.scrollHeight - 2]);
      if (bas) { immobile += 30; }
      immobile = ny === y ? immobile + 5 : 0; y = ny;
    }
  }
  return acks;
}

async function scenarioDefile(nav, srv, profil, R) {
  R.defile = R.defile || {};
  for (const vitesse of (process.env.MESURE_VITESSES || "normal,rapide").split(",")) {
    const ctx = await contexte(nav, profil, srv);
    const o = await ouvrir(ctx, profil, "/");
    await o.page.mouse.move(PROFILS[profil].ctx.viewport.width / 2, PROFILS[profil].ctx.viewport.height / 2);
    await o.page.evaluate(() => { window.__mesure.loaf = []; window.__mesure.surveiller(); window.__mesure.echantillonner(true); });
    const avant = await metriques(o.cdp), cpu0 = cpuNavigateur(), t0 = Date.now();
    const trace = vitesse === "normal";
    if (trace) await nav.startTracing(o.page, { categories: ["devtools.timeline", "disabled-by-default-devtools.timeline"] });
    const acks = await defiler(o, profil, vitesse);
    const tr = trace ? await nav.stopTracing() : null;
    const duree = (Date.now() - t0) / 1000, cpu = cpuNavigateur() - cpu0, apres = await metriques(o.cdp);
    const M = await o.page.evaluate(() => { const m = window.__mesure; m.echantillonner(false);
      const bas = (id) => { const e = document.getElementById(id); return e ? e.offsetTop + e.offsetHeight - innerHeight : 0; };
      return { frames: m.frames, ys: m.ys, loaf: m.loaf, tard: m.tard, h: document.documentElement.scrollHeight, bornes: { projecteur: bas("hero"), etude: bas("analysis"), planche: bas("formules") } }; });
    const iv = M.frames.slice(1).map((t, i) => t - M.frames[i]);
    // Régularité par partie de la page (projecteur, étude, planche II, pied de page).
    const parties = {};
    iv.forEach((d, i) => { const y = M.ys[i + 1], b = M.bornes; const k = y <= b.projecteur ? "projecteur" : y <= b.etude ? "etude" : y <= b.planche ? "planche" : "pied"; (parties[k] = parties[k] || []).push(d); });
    const parPartie = Object.fromEntries(Object.entries(parties).map(([k, l]) => [k, { n: l.length, p50: arr(med(l)), p95: arr(quantile(l, 0.95)), pct25: arr(100 * l.filter((d) => d > 25).length / l.length) }]));
    R.defile[vitesse] = {
      duree: arr(duree), hauteur: M.h, images: iv.length, parPartie,
      intervalle: { p50: arr(med(iv)), p95: arr(quantile(iv, 0.95)), p99: arr(quantile(iv, 0.99)), max: arr(Math.max(...iv)) },
      lentes: { plus25ms: iv.filter((d) => d > 25).length, plus50ms: iv.filter((d) => d > 50).length, pct25: arr(100 * iv.filter((d) => d > 25).length / iv.length) },
      acquittement: { p50: med(acks), p95: quantile(acks, 0.95), max: Math.max(...acks) },
      filPrincipal: { tache: arr((apres.TaskDuration - avant.TaskDuration) * 1000, 0), script: arr((apres.ScriptDuration - avant.ScriptDuration) * 1000, 0), style: arr((apres.RecalcStyleDuration - avant.RecalcStyleDuration) * 1000, 0), layout: arr((apres.LayoutDuration - avant.LayoutDuration) * 1000, 0), nbStyle: apres.RecalcStyleCount - avant.RecalcStyleCount, nbLayout: apres.LayoutCount - avant.LayoutCount },
      cpuNavigateur: arr(cpu), cpuPct: arr(100 * cpu / duree),
      loaf: { n: M.loaf.length, total: arr(M.loaf.reduce((s, f) => s + f.d, 0), 0), top: topScripts(M.loaf, 10) },
      tard: M.tard.slice(0, 20), trace: tr ? resumerTrace(tr) : null, journal: o.journal,
    };
    const d = R.defile[vitesse];
    console.log(`  défilement ${profil} ${vitesse} : ${d.duree} s, images p95 ${d.intervalle.p95} ms, >25 ms ${d.lentes.pct25} %, acquittement p95 ${d.acquittement.p95} ms, CPU ${d.cpuPct} %, tardives ${d.tard.length} ; ` +
      Object.entries(parPartie).map(([k, v]) => `${k} p95 ${v.p95}`).join(", "));
    await ctx.close();
  }
}

function resumerTrace(buf) {
  const ev = JSON.parse(buf.toString()).traceEvents || JSON.parse(buf.toString());
  const fils = {};
  for (const e of ev) if (e.ph === "M" && e.name === "thread_name") fils[e.pid + ":" + e.tid] = e.args.name;
  const agg = {};
  for (const e of ev) {
    if (e.ph !== "X" || !e.dur) continue;
    const fil = (fils[e.pid + ":" + e.tid] || "?").replace(/\d+$/, "");
    if (!["CrRendererMain", "Compositor", "CompositorTileWorker", "VizCompositorThread", "CrGpuMain"].includes(fil)) continue;
    if (!["RunTask", "ThreadControllerImpl::RunTask", "FunctionCall", "UpdateLayoutTree", "Layout", "PrePaint", "Paint", "Layerize", "Commit", "RasterTask", "ImageDecodeTask", "DecodeImage", "HitTest", "EventDispatch", "FireAnimationFrame", "UpdateLayer"].includes(e.name)) continue;
    const k = fil + " " + e.name;
    agg[k] = agg[k] || { ms: 0, n: 0 }; agg[k].ms += e.dur / 1000; agg[k].n++;
  }
  return Object.fromEntries(Object.entries(agg).sort((a, b) => b[1].ms - a[1].ms).map(([k, v]) => [k, `${arr(v.ms, 0)} ms ×${v.n}`]));
}

async function scenarioRepos(nav, srv, profil, R) {
  R.repos = R.repos || {};
  const ctx = await contexte(nav, profil, srv);
  const o = await ouvrir(ctx, profil, "/");
  // « ouverture » : là où la page s'ouvre (cran du projecteur), identique avant et après l'optimisation « aimantation ».
  const endroits = { ouverture: () => { const c = document.querySelector(".vfp-cran"); return c ? c.getBoundingClientRect().top + scrollY : 0; },
    etude: () => document.getElementById("analysis").offsetTop + innerHeight * 3, pied: () => document.documentElement.scrollHeight };
  for (const [nom, f] of Object.entries(endroits)) {
    await o.page.evaluate(`window.scrollTo({ top: (${f.toString()})(), behavior: "instant" })`);
    await dormir(3000);
    const avant = await metriques(o.cdp), cpu0 = cpuNavigateur();
    const c0 = await o.page.evaluate(() => { window.__mesure.pile = {}; return [window.__mesure.raf, window.__mesure.to]; });
    await dormir(10000);
    const apres = await metriques(o.cdp), cpu = cpuNavigateur() - cpu0;
    const [raf, to, pile] = await o.page.evaluate(() => [window.__mesure.raf, window.__mesure.to, window.__mesure.pile]);
    // Pointeur qui bouge (5 s de cercles) sans défiler : coût des effets qui suivent la souris.
    const vp = PROFILS[profil].ctx.viewport, m0 = await metriques(o.cdp);
    if (profil === "bureau") for (let i = 0; i < 150; i++) { await o.page.mouse.move(vp.width / 2 + 300 * Math.cos(i / 8), vp.height / 2 + 200 * Math.sin(i / 8)); await dormir(33); }
    const m1 = await metriques(o.cdp);
    R.repos[nom] = {
      sourisFilPrincipalPct: profil === "bureau" ? arr((m1.TaskDuration - m0.TaskDuration) * 100 / 5) : null,
      filPrincipalPct: arr((apres.TaskDuration - avant.TaskDuration) * 10), cpuNavigateurPct: arr(cpu * 10),
      rafParSeconde: arr((raf - c0[0]) / 10), timeoutsParSeconde: arr((to - c0[1]) / 10),
      style: arr((apres.RecalcStyleDuration - avant.RecalcStyleDuration) * 1000, 0), layout: arr((apres.LayoutDuration - avant.LayoutDuration) * 1000, 0),
      sources: Object.entries(pile).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => `${v} ${k}`),
    };
    console.log(`  repos ${profil} ${nom} : fil principal ${R.repos[nom].filPrincipalPct} %, CPU navigateur ${R.repos[nom].cpuNavigateurPct} %, rAF/s ${R.repos[nom].rafParSeconde}, timeouts/s ${R.repos[nom].timeoutsParSeconde}, souris ${R.repos[nom].sourisFilPrincipalPct} %`);
  }
  await ctx.close();
}

async function cliquer(page, sel) { const el = page.locator(sel).first(); await el.scrollIntoViewIfNeeded({ timeout: 3000 }).catch(() => {}); const b = await el.boundingBox(); if (!b) return false; await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 4 }); await page.mouse.down(); await page.mouse.up(); return true; }
async function survoler(page, sel, pas = 12) { const b = await page.locator(sel).first().boundingBox().catch(() => null); if (!b) return false; for (let i = 0; i <= pas; i++) { await page.mouse.move(b.x + b.width * (0.1 + 0.8 * i / pas), b.y + b.height * (0.3 + 0.4 * Math.sin(i))); await dormir(30); } return true; }

async function scenarioInteractions(nav, srv, profil, R) {
  const ctx = await contexte(nav, profil, srv);
  const o = await ouvrir(ctx, profil, "/");
  const p = o.page, etapes = [];
  await p.evaluate(() => { window.__mesure.ev = []; window.__mesure.loaf = []; });
  const etape = async (nom, f, attente) => { const ok = await f(); await dormir(attente); etapes.push(nom + (ok === false ? " (introuvable)" : "")); };
  // « See pricing » n'est cliquable qu'en haut de page (avant l'allumage du projecteur). Les étapes clés vérifient
  // leur résultat : AVANT et APRÈS ne se comparent que si les mêmes gestes ont réellement eu le même effet.
  const enHaut = async () => { await p.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" })); await dormir(1200); };
  const controle = async (nom, f) => { etapes.push(`${nom} : ${(await p.evaluate(f)) ? "oui" : "NON"}`); };
  const vitrine = () => !!document.querySelector(".vfp-scene")?.hasAttribute("data-vitrine");
  if (profil === "bureau") {
    await etape("See pricing", async () => { await enHaut(); return cliquer(p, ".vfp-affiche"); }, 2000);
    await controle("vitrine ouverte", vitrine);
    for (let k = 1; k <= 3; k++) await etape("survol carte " + k, () => survoler(p, `.vfp-c:nth-child(${k}) .vf-carte`), 400);
    await etape("clic carte 2", () => cliquer(p, ".vfp-c:nth-child(2) .vf-carte"), 600);
    await etape("survol Pay", () => survoler(p, ".vfp-c:nth-child(2) .vf-payer", 4), 600);
    await etape("Échap (retour à Loan)", async () => { await p.keyboard.press("Escape"); }, 1500);
    await controle("vitrine fermée", () => !document.querySelector(".vfp-scene")?.hasAttribute("data-vitrine"));
    await etape("sommaire → Pricing", async () => {
      await p.evaluate(() => { const c = document.querySelector(".vfp-cran"); window.scrollTo({ top: c ? c.getBoundingClientRect().top + scrollY : 0, behavior: "instant" }); }); await dormir(800);
      await p.mouse.move(1380, 85, { steps: 4 }); await dormir(600); return cliquer(p, '.vf-sommaire a[href="#formules"]');
    }, 4500);
    await controle("arrivé aux formules", () => { const t = document.getElementById("formules").getBoundingClientRect().top; return t > -innerHeight && t < innerHeight; });
    for (let k = 1; k <= 3; k++) await etape("survol carte planche " + k, () => survoler(p, `.vfk-c:nth-child(${k}) .vf-carte`), 300);
    await etape("clic carte planche 1", () => cliquer(p, ".vfk-c .vf-carte"), 600);
  } else {
    await etape("See pricing", async () => { await enHaut(); return cliquer(p, ".vfp-affiche"); }, 2000);
    await controle("vitrine ouverte", vitrine);
    await etape("clic carte 1", () => cliquer(p, ".vfp-c:nth-child(1) .vf-carte"), 600);
    await etape("Back to Loan", () => cliquer(p, ".vfp-voir-f .ld-lien, .vfp-voir-f a, .vfp-voir-f button"), 1500);
    await controle("vitrine fermée", () => !document.querySelector(".vfp-scene")?.hasAttribute("data-vitrine"));
  }
  await etape("pied de page", async () => { await p.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" })); await dormir(1500); return survoler(p, "footer [data-screen-label=Footer] a, footer a", 20); }, 1000);
  const M = await p.evaluate(() => ({ ev: window.__mesure.ev, loaf: window.__mesure.loaf }));
  const parInteraction = {};
  for (const e of M.ev) parInteraction[e.t] = Math.max(parInteraction[e.t] || 0, e.d);
  const durees = Object.values(parInteraction);
  R.interactions = R.interactions || {};
  R.interactions[profil] = { etapes, n: durees.length, inp: durees.length ? Math.max(...durees) : 0, p75: quantile(durees, 0.75), pires: M.ev.sort((a, b) => b.d - a.d).slice(0, 8).map((e) => `${e.d} ms (attente ${arr(e.att, 0)}, traitement ${arr(e.trait, 0)}) ${e.n} ${e.c}`), loafTop: topScripts(M.loaf, 8), journal: o.journal };
  console.log(`  interactions ${profil} : ${durees.length} interactions, pire ${R.interactions[profil].inp} ms ; ${etapes.filter((e) => e.includes(" : ")).join(", ")}`);
  await ctx.close();
}

async function scenarioLegal(nav, srv, profil, R) {
  const ctx = await contexte(nav, profil, srv);
  const o = await ouvrir(ctx, profil, "/CGV.dc.html?lang=fr");
  await o.page.evaluate(() => { window.__mesure.ev = []; window.__mesure.surveiller(); window.__mesure.echantillonner(true); });
  const acks = await defiler(o, profil, "normal");
  await o.page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await dormir(500);
  await cliquer(o.page, ".ld-langues__item:not([aria-current=true])");
  await dormir(1000);
  const langueChangee = await o.page.evaluate(() => document.documentElement.lang === "en"); // la page s'ouvre en français
  const M = await o.page.evaluate(() => { const m = window.__mesure; m.echantillonner(false); return { frames: m.frames, ev: m.ev, tard: m.tard }; });
  const iv = M.frames.slice(1).map((t, i) => t - M.frames[i]);
  // Navigation Video Feedback → CGV (lien du pied de page) → retour.
  const v = await ouvrir(ctx, profil, "/");
  await v.page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
  await dormir(1500);
  const t0 = Date.now();
  const lien = v.page.locator('footer a[href="CGV.dc.html"]').last();
  let nav1 = null, nav2 = null;
  if (await lien.count()) {
    await lien.scrollIntoViewIfNeeded().catch(() => {});
    await Promise.all([v.page.waitForURL(/CGV/, { waitUntil: "load", timeout: 30000 }), lien.click()]);
    await v.page.waitForFunction(() => !document.getElementById("ld-chargement"), null, { timeout: 30000 }).catch(() => {});
    nav1 = Date.now() - t0;
    const t1 = Date.now();
    await v.page.goBack({ waitUntil: "load" });
    await v.page.waitForFunction(() => !document.getElementById("ld-chargement"), null, { timeout: 30000 }).catch(() => {});
    nav2 = Date.now() - t1;
  }
  R.legal = R.legal || {};
  R.legal[profil] = { defileP95: arr(quantile(iv, 0.95)), defilePct25: arr(100 * iv.filter((d) => d > 25).length / iv.length), acquittementP95: quantile(acks, 0.95),
    changementLangue: M.ev.length ? Math.max(...M.ev.map((e) => e.d)) : "< 16 ms", langueChangee, tard: M.tard.length, versCGV: nav1, retour: nav2, journal: [...o.journal, ...v.journal] };
  console.log(`  légal ${profil} : défilement p95 ${R.legal[profil].defileP95} ms, langue ${R.legal[profil].changementLangue} ms (${langueChangee ? "changée" : "NON changée"}), VF→CGV ${nav1} ms, retour ${nav2} ms`);
  await ctx.close();
}

async function scenarioFuites(nav, srv, profil, R) {
  const ctx = await contexte(nav, profil, srv);
  const o = await ouvrir(ctx, profil, "/");
  const serie = [];
  for (let c = 0; c <= 5; c++) {
    if (c) {
      await o.page.evaluate(async () => {
        const H = document.documentElement.scrollHeight;
        for (let y = 0; y <= H; y += 600) { window.scrollTo({ top: y, behavior: "instant" }); await new Promise((r) => setTimeout(r, 16)); }
        for (let y = H; y >= 0; y -= 1200) { window.scrollTo({ top: y, behavior: "instant" }); await new Promise((r) => setTimeout(r, 16)); }
      });
      await dormir(1500);
      if (profil === "bureau") { await cliquer(o.page, ".vfp-affiche"); await dormir(1500); await o.page.keyboard.press("Escape"); await dormir(1500); }
    }
    await o.cdp.send("HeapProfiler.collectGarbage");
    const m = await metriques(o.cdp);
    serie.push({ tasMo: arr(m.JSHeapUsedSize / 1048576, 2), noeuds: m.Nodes, ecouteurs: m.JSEventListeners, layoutObjets: m.LayoutObjects });
  }
  R.fuites = R.fuites || {};
  R.fuites[profil] = serie;
  console.log(`  fuites ${profil} : tas ${serie.map((s) => s.tasMo).join(" → ")} Mo ; nœuds ${serie.map((s) => s.noeuds).join(" → ")} ; écouteurs ${serie.map((s) => s.ecouteurs).join(" → ")}`);
  await ctx.close();
}

async function scenarioCalques(nav, srv, profil, R) {
  const ctx = await contexte(nav, profil, srv);
  const o = await ouvrir(ctx, profil, "/");
  let calques = [];
  o.cdp.on("LayerTree.layerTreeDidChange", (e) => { if (e.layers) calques = e.layers; });
  await o.cdp.send("DOM.enable");
  await o.cdp.send("LayerTree.enable");
  const decrire = async (l) => {
    try {
      const n = (await o.cdp.send("DOM.describeNode", { backendNodeId: l.backendNodeId })).node, a = {};
      for (let i = 0; i < (n.attributes || []).length; i += 2) a[n.attributes[i]] = n.attributes[i + 1];
      return n.localName + (a.id ? "#" + a.id : "") + (a.class ? "." + a.class.split(" ").slice(0, 2).join(".") : "");
    } catch { return "?"; }
  };
  const res = {};
  for (const f of [0, 0.05, 0.12, 0.25, 0.4, 0.55, 0.7, 0.85, 1]) {
    const docH = await o.page.evaluate((f) => { window.scrollTo({ top: Math.round((document.documentElement.scrollHeight - innerHeight) * f), behavior: "instant" }); return document.documentElement.scrollHeight; }, f);
    await dormir(1500);
    // Le calque du document entier (seule sa partie visible est dessinée) est exclu.
    const dessin = calques.filter((l) => l.drawsContent && l.height < docH * 0.9).sort((a, b) => b.width * b.height - a.width * a.height);
    const gros = [];
    for (const l of dessin.slice(0, 5)) gros.push(`${arr(l.width * l.height / 1e6, 1)} Mpx ${await decrire(l)}`);
    res[Math.round(f * 100) + " %"] = { calques: calques.length, dessines: dessin.length, megapixels: arr(dessin.reduce((s, l) => s + l.width * l.height, 0) / 1e6, 1), gros };
  }
  R.calques = R.calques || {};
  R.calques[profil] = res;
  console.log(`  calques ${profil} : ` + Object.entries(res).map(([k, v]) => `${k} ${v.dessines}/${v.megapixels} Mpx`).join(", "));
  await ctx.close();
}

// Film du chargement : repère les « éclairs » (une image qui diffère de la précédente et de la suivante,
// alors que la précédente et la suivante se ressemblent).
async function scenarioFilm(nav, srv, profil, R, sortie) {
  const ctx = await contexte(nav, profil, srv);
  const o = await ouvrir(ctx, profil, "/", { film: true, stabiliser: 5000 });
  const revele = await o.page.evaluate(() => window.__mesure.t.revele);
  const nav0 = await o.page.evaluate(() => performance.timeOrigin / 1000);
  const vignettes = o.film.map((f) => {
    const png = PNG.sync.read(Buffer.from(f.png, "base64")), g = [], W = 48, H = 30;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let s = 0, n = 0;
      for (let yy = Math.floor(y * png.height / H); yy < Math.floor((y + 1) * png.height / H); yy++)
        for (let xx = Math.floor(x * png.width / W); xx < Math.floor((x + 1) * png.width / W); xx++) { const i = (yy * png.width + xx) * 4; s += png.data[i] + png.data[i + 1] + png.data[i + 2]; n++; }
      g.push(n ? s / n / 3 : 0);
    }
    return { t: arr((f.t - nav0) * 1000, 0), g, png: f.png };
  });
  const d = (a, b) => a.g.reduce((s, v, i) => s + Math.abs(v - b.g[i]), 0) / a.g.length;
  const eclairs = [];
  for (let i = 1; i < vignettes.length - 1; i++) {
    const a = vignettes[i - 1], b = vignettes[i], c = vignettes[i + 1];
    if (c.t - a.t > 400) continue;
    const ab = d(a, b), bc = d(b, c), ac = d(a, c);
    if (ab > 6 && bc > 6 && ac < Math.min(ab, bc) / 3) {
      eclairs.push({ t: b.t, apresRevele: revele ? arr(b.t - revele, 0) : null, ecart: arr(Math.min(ab, bc)) });
      fs.mkdirSync(path.join(sortie, "eclairs"), { recursive: true });
      [a, b, c].forEach((v, k) => fs.writeFileSync(path.join(sortie, "eclairs", `${profil}-${b.t}-${k}.png`), Buffer.from(v.png, "base64")));
    }
  }
  R.film = R.film || {};
  R.film[profil] = { images: vignettes.length, revele: arr(revele, 0), eclairs };
  console.log(`  film ${profil} : ${vignettes.length} images, ${eclairs.length} éclair(s)` + eclairs.map((e) => ` @${e.t} ms (${e.apresRevele} ms après révélation)`).join(""));
  await ctx.close();
}

// --- Programme ------------------------------------------------------------------------------------------
function comparer(a, b) {
  const A = JSON.parse(fs.readFileSync(path.join(MESURES, a, "resultats.json"), "utf8"));
  const B = JSON.parse(fs.readFileSync(path.join(MESURES, b, "resultats.json"), "utf8"));
  const get = (o, p) => p.split(".").reduce((x, k) => (x == null ? x : x[k]), o);
  const lignes = [];
  for (const profil of ["bureau", "mobile"]) {
    const L = (titre, p, unite = "") => {
      const x = get(A[profil], p), y = get(B[profil], p);
      if (x == null && y == null) return;
      const ecart = typeof x === "number" && typeof y === "number" && x ? ` (${y - x > 0 ? "+" : ""}${Math.round((100 * (y - x)) / x)} %)` : "";
      lignes.push(`| ${profil} | ${titre} | ${x ?? "–"}${unite} | ${y ?? "–"}${unite}${ecart} |`);
    };
    for (const pg of Object.keys(PAGES)) {
      L(`${pg} : page prête (1re visite)`, `charge.${pg}.pret`, " ms");
      L(`${pg} : page prête (avec cache)`, `charge.${pg}.chaud.page.pret`, " ms");
      L(`${pg} : page révélée (1re visite)`, `charge.${pg}.revele`, " ms");
      L(`${pg} : page révélée (avec cache)`, `charge.${pg}.chaud.page.revele`, " ms");
      L(`${pg} : FCP`, `charge.${pg}.fcp`, " ms");
      L(`${pg} : LCP`, `charge.${pg}.lcp`, " ms");
      L(`${pg} : CLS`, `charge.${pg}.cls`);
      L(`${pg} : blocage (somme > 50 ms)`, `charge.${pg}.bloquant`, " ms");
      L(`${pg} : requêtes`, `charge.${pg}.essai.reseau.requetes`);
      L(`${pg} : poids transféré`, `charge.${pg}.essai.reseau.ko`, " Ko");
      L(`${pg} : poids transféré (avec cache)`, `charge.${pg}.chaud.reseau.ko`, " Ko");
    }
    for (const v of ["normal", "rapide"]) {
      L(`défilement ${v} : durée du parcours (mêmes gestes)`, `defile.${v}.duree`, " s");
      L(`défilement ${v} : image p95`, `defile.${v}.intervalle.p95`, " ms");
      L(`défilement ${v} : images > 25 ms`, `defile.${v}.lentes.pct25`, " %");
      L(`défilement ${v} : réaction molette/doigt p95`, `defile.${v}.acquittement.p95`, " ms");
      L(`défilement ${v} : fil principal occupé`, `defile.${v}.filPrincipal.tache`, " ms");
      L(`défilement ${v} : CPU navigateur`, `defile.${v}.cpuPct`, " %");
      L(`défilement ${v} : images apparues en retard`, `defile.${v}.tard.length`);
    }
    for (const e of ["ouverture", "etude", "pied"]) {
      L(`repos (${e}) : fil principal`, `repos.${e}.filPrincipalPct`, " %");
      L(`repos (${e}) : CPU navigateur`, `repos.${e}.cpuNavigateurPct`, " %");
      L(`repos (${e}) : rappels d'animation / s`, `repos.${e}.rafParSeconde`);
    }
    L("interactions : pire (≈ INP)", `interactions.${profil}.inp`, " ms");
    L("interactions : p75", `interactions.${profil}.p75`, " ms");
    L("CGV : défilement image p95", `legal.${profil}.defileP95`, " ms");
    L("CGV : changement de langue", `legal.${profil}.changementLangue`, " ms");
    L("navigation Video Feedback → CGV", `legal.${profil}.versCGV`, " ms");
    L("calques (haut de page) : Mpx", `calques.${profil}.0 %.megapixels`, " Mpx");
    L("calques (25 %) : Mpx", `calques.${profil}.25 %.megapixels`, " Mpx");
    L("tas JS après 5 cycles", `fuites.${profil}.5.tasMo`, " Mo");
    L("éclairs au chargement (film)", `film.${profil}.eclairs.length`);
  }
  console.log(`| Profil | Mesure | ${a} | ${b} |\n|---|---|---|---|\n` + lignes.join("\n"));
}

if (process.argv[2] === "--comparer") {
  comparer(process.argv[3], process.argv[4]);
} else if (process.argv[2] === "--servir") {
  const dossier = path.resolve(process.argv[3] || "public");
  const { port, etat } = await demarrerServeur(dossier, +(process.argv[4] || 8443));
  etat.rtt = +(process.env.RTT || 0);
  console.log(`Sert ${dossier} sur 127.0.0.1:${port} (tous les domaines ; ${SITE} = le dossier).`);
} else {
  const dossier = path.resolve(process.argv[2] || "public"), nom = process.argv[3] || "essai";
  const scenarios = (process.argv[4] || "charge,defile,repos,interactions,legal,fuites,calques,film").split(",");
  const profils = (process.argv[5] || "bureau,mobile").split(",");
  const sortie = path.join(MESURES, nom);
  fs.mkdirSync(sortie, { recursive: true });
  const serveur = await demarrerServeur(dossier);
  const nav = await navigateur(serveur.port);
  const fichier = path.join(sortie, "resultats.json");
  const tout = fs.existsSync(fichier) ? JSON.parse(fs.readFileSync(fichier, "utf8")) : {};
  const S = { charge: scenarioCharge, defile: scenarioDefile, repos: scenarioRepos, interactions: scenarioInteractions, legal: scenarioLegal, fuites: scenarioFuites, calques: scenarioCalques, film: scenarioFilm };
  for (const profil of profils) {
    tout[profil] = tout[profil] || {};
    for (const s of scenarios) {
      console.log(`[${nom}] ${profil} / ${s}`);
      try { await S[s](nav, serveur, profil, tout[profil], sortie); }
      catch (e) { console.log(`  ÉCHEC ${s} : ${e.message.split("\n")[0]}`); tout[profil]["echec_" + s] = e.message.slice(0, 300); }
      fs.writeFileSync(fichier, JSON.stringify(tout, null, 1));
    }
  }
  await nav.close();
  serveur.srv.close();
  console.log(`Résultats : ${path.relative(RACINE, fichier)}`);
}
