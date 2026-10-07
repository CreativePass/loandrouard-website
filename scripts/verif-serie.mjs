// Vérification LOCALE (Chromium) du protocole borné des séries (optimise/diag.js) et de resultats.html, avec des
// arrêts brutaux provoqués (CDP Page.crash) : la série doit toujours se terminer, chaque arrêt compté une fois.
// Usage (après ESSAI=1 node scripts/construire.mjs) : node scripts/verif-serie.mjs [a,b,c,c2,d,e,f,g,h,i,j,k]
//   a sans arrêt · b arrêt sur la dernière page · c arrêt à chaque passe · c2 arrêt à chaque chargement
//   d rechargement tardif (4 min) · e bouton « Arrêter le test » · f limite de 25 min · g ancienne série intacte
//   h resultats.html (résumé, copie, lecture seule, clés du diagnostic seulement)
//   i tri ?stress=sans : chaque page ouverte porte la variante et les retraits attendus, série terminée
//   j contrôle du bouton ?banc=bouton : proposition / +affiche en ordre ABBA, images comptées au repos, série terminée
//   k tri ?stress=lumiere : 6 pages préparées (référence, -mobiles, -effets × 2, ordre alterné), 1re page conforme
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright-core";
const RACINE = path.resolve(import.meta.dirname, ".."), PUBLIC = path.join(RACINE, "public");
if (!fs.existsSync(path.join(PUBLIC, "resultats.html"))) { console.error("Construire d'abord avec ESSAI=1 node scripts/construire.mjs"); process.exit(1); }

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
const dormir = (ms) => new Promise((ok) => setTimeout(ok, ms));
const DEPART = "/?stress=1&versions=actuel,proposition&passes=1&duree=4";

async function contexte() {
  const ctx = await nav.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.route(/loan-api|stripe|cloudflareinsights|jsdelivr/, (r) => r.abort());
  let chargements = 0;
  ctx.on("request", (r) => { if (r.resourceType() === "document" && /serie=/.test(r.url())) chargements++; });
  return { ctx, n: () => chargements };
}
// Lecture du stockage depuis une page neutre du même site (resultats.html ne modifie rien).
async function stockage(ctx) {
  const p = await ctx.newPage(); await p.goto(BASE + "/resultats.html");
  const o = await p.evaluate(() => { const r = {}; for (let k = 0; k < localStorage.length; k++) { const c = localStorage.key(k); r[c] = localStorage.getItem(c); } return r; });
  await p.close(); return o;
}
const serie = async (ctx) => JSON.parse((await stockage(ctx))["ld-diag-serie"] || "null");
async function modifier(ctx, f) { // modifie le stockage (harnais de test seulement)
  const p = await ctx.newPage(); await p.goto(BASE + "/resultats.html");
  await p.evaluate(f); await p.close();
}
async function demarrer(ctx, depart = DEPART) {
  const page = await ctx.newPage(); page.on("pageerror", (e) => console.log("  erreur page :", e.message.slice(0, 120)));
  await page.goto(BASE + depart); await page.waitForSelector("#ld-diag-go"); await page.click("#ld-diag-go");
  return page;
}
// Attend qu'une passe donnée soit en cours (enCours.i === i) dans la page affichée.
async function attendrePasse(page, i, ms = 120000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    try { if (await page.evaluate((i) => { const s = JSON.parse(localStorage.getItem("ld-diag-serie")); return !!(s && s.enCours && s.enCours.i === i && document.getElementById("ld-diag-stop")); }, i)) return; } catch (e) {}
    await dormir(200);
  }
  throw new Error("passe " + i + " jamais lancée");
}
// Arrêt brutal du processus de la page (comme le WebContent de Safari) : pas de pagehide, rien d'enregistré en plus.
// Page.crash ne répond jamais (la page meurt) : on n'attend pas sa réponse.
const avant = (pr, ms) => Promise.race([pr.catch(() => {}), dormir(ms)]);
async function planter(ctx, page) { const url = page.url(); const cdp = await ctx.newCDPSession(page); cdp.send("Page.crash").catch(() => {}); await dormir(1500); await avant(page.close(), 3000); return url; }
async function rouvrir(ctx, url) { const page = await ctx.newPage(); page.on("pageerror", (e) => console.log("  erreur page :", e.message.slice(0, 120))); await page.goto(url); return page; }
async function attendreFin(ctx, ms = 240000) { const t0 = Date.now(); while (Date.now() - t0 < ms) { const s = await serie(ctx); if (s && s.fini) return s; await dormir(1000); } return serie(ctx); }
const resume = (s) => s ? `fini ${!!s.fini} arret ${s.arret} i ${s.i}/${s.liste.length} chargements ${s.chargements} res [${s.res.map((r) => r.nom + ":" + (r.plantage ? "ARRÊT " + r.plantage.type + " délai " + r.plantage.delai + " s" : r.interrompu ? "interrompu" : "ok")).join(", ")}]` : "aucune série";
let echecs = 0;
const verifier = (nom, cond, info) => { console.log(`${cond ? "OK  " : "ÉCHEC"} ${nom}${info ? " — " + info : ""}`); if (!cond) echecs++; };

const TESTS = {
  async a() { // sans arrêt
    const { ctx, n } = await contexte(); await demarrer(ctx);
    const s = await attendreFin(ctx);
    verifier("(a) série sans arrêt terminée", s && s.fini && s.arret === "complet" && s.res.length === 2 && s.res.every((r) => !r.plantage && r.allersRetours > 0), resume(s) + ` · chargements vus ${n()}`);
    await ctx.close();
  },
  async b() { // arrêt brutal sur la DERNIÈRE page, puis rechargement
    const { ctx, n } = await contexte(); const page = await demarrer(ctx);
    await attendrePasse(page, 1); await page.waitForURL(/proposition|\/\?serie/); await dormir(4000);
    const url = await planter(ctx, page); const p2 = await rouvrir(ctx, url);
    const s = await attendreFin(ctx, 30000); await dormir(8000); const s2 = await serie(ctx);
    const relance = await p2.evaluate(() => scrollY);
    verifier("(b) arrêt sur la dernière page : compté une fois, pas relancé, série terminée", s && s.fini && s.arret === "complet" && s.res.length === 2 && s.res[1].plantage && s.res[1].plantage.type === "brutal" && JSON.stringify(s2) === JSON.stringify(s) && relance === 0, resume(s) + ` · chargements vus ${n()} · défilement après ${relance}`);
    await ctx.close();
  },
  async c() { // arrêt pendant CHAQUE passe
    const { ctx, n } = await contexte(); let page = await demarrer(ctx);
    for (let i = 0; i < 2; i++) { await attendrePasse(page, i); await dormir(2500); const url = await planter(ctx, page); page = await rouvrir(ctx, url); }
    const s = await attendreFin(ctx, 60000);
    verifier("(c) arrêt à chaque passe : série terminée, au plus 2 × N chargements", s && s.fini && s.res.length === 2 && s.res.every((r) => r.plantage) && s.chargements <= 4, resume(s) + ` · chargements vus ${n()}`);
    await ctx.close();
  },
  async c2() { // arrêt de CHAQUE page peu après son ouverture (même les pages de renvoi) : la limite de chargements doit finir la série
    const { ctx, n } = await contexte(); let page = await demarrer(ctx);
    for (let k = 0; k < 12; k++) {
      await page.waitForURL(/serie=/); await page.waitForLoadState("domcontentloaded"); await dormir(700);
      const s = await serie(ctx); if (s && s.fini) break;
      const url = await planter(ctx, page); page = await rouvrir(ctx, url);
    }
    const s = await attendreFin(ctx, 30000);
    verifier("(c2) arrêt à chaque chargement : série terminée quand même", s && s.fini && s.chargements <= 2 * s.liste.length + 1, resume(s) + ` · chargements vus ${n()}`);
    await ctx.close();
  },
  async d() { // rechargement TARDIF (4 min après l'arrêt)
    const { ctx, n } = await contexte(); const page = await demarrer(ctx);
    await attendrePasse(page, 0); await dormir(3000); const url = await planter(ctx, page);
    await modifier(ctx, () => { const r = (k) => JSON.parse(localStorage.getItem(k)), w = (k, v) => localStorage.setItem(k, JSON.stringify(v)), D = 240000;
      const d = r("ld-diag"); d.dernier -= D; d.debut -= D; w("ld-diag", d); const s = r("ld-diag-serie"); s.enCours.t -= D; s.debut -= D; w("ld-diag-serie", s); });
    await rouvrir(ctx, url);
    const s = await attendreFin(ctx);
    verifier("(d) rechargement tardif : arrêt compté, série poursuivie et terminée", s && s.fini && s.arret === "complet" && s.res.length === 2 && s.res[0].plantage && s.res[0].plantage.delai >= 240 && !s.res[1].plantage, resume(s) + ` · chargements vus ${n()}`);
    await ctx.close();
  },
  async e() { // bouton « Arrêter le test »
    const { ctx, n } = await contexte(); const page = await demarrer(ctx);
    await attendrePasse(page, 0); await page.waitForSelector("#ld-diag-stop"); await dormir(5000);
    await page.click("#ld-diag-stop"); const url = page.url(); await dormir(8000);
    const s = await serie(ctx), tableau = await page.$("#ld-diag-t");
    verifier("(e) bouton d'arrêt : tableau partiel, plus de navigation", s && s.fini && s.arret === "manuel" && s.res.length === 1 && s.res[0].interrompu && page.url() === url && !!tableau, resume(s) + ` · chargements vus ${n()}`);
    await ctx.close();
  },
  async f() { // limite de 25 min
    const { ctx } = await contexte(); const page = await demarrer(ctx);
    await attendrePasse(page, 0); await dormir(2000); const url = await planter(ctx, page);
    await modifier(ctx, () => { const s = JSON.parse(localStorage.getItem("ld-diag-serie")); s.debut -= 26 * 60000; localStorage.setItem("ld-diag-serie", JSON.stringify(s)); });
    await rouvrir(ctx, url);
    const s = await attendreFin(ctx, 30000);
    verifier("(f) limite de 25 min : fin avec résultats partiels", s && s.fini && s.arret === "durée" && s.res.length === 1 && s.res[0].plantage, resume(s));
    await ctx.close();
  },
  async g() { // ancienne série (format du 05/10) : rien n'est lancé ni modifié
    const { ctx } = await contexte(); await modifier(ctx, ANCIEN);
    const avant = await stockage(ctx);
    const page = await ctx.newPage(); await page.goto(BASE + "/?serie=stress&passe=t%C3%A9moin&panneau=0"); await dormir(9000);
    const apres = await stockage(ctx), avis = await page.evaluate(() => (document.getElementById("ld-diag-t") || {}).textContent || ""), y = await page.evaluate(() => scrollY);
    const memes = ["ld-diag-serie", "ld-diag-incidents"].every((k) => avant[k] === apres[k]);
    verifier("(g) ancienne série : série et arrêts intacts, rien lancé", memes && /Ancienne série/.test(avis) && y === 0, `avis « ${avis.slice(0, 60)} » · y ${y}`);
    await ctx.close();
  },
  async h() { // resultats.html : affichage, copie, lecture seule, clés du diagnostic seulement
    const { ctx } = await contexte(); await ctx.grantPermissions(["clipboard-read", "clipboard-write"], { origin: BASE });
    await modifier(ctx, ANCIEN); await modifier(ctx, () => localStorage.setItem("ld-vf-paye", "cs_test_NE_DOIT_PAS_SORTIR"));
    const avant = await stockage(ctx);
    const page = await ctx.newPage(); await page.goto(BASE + "/resultats.html");
    await page.click("#copier"); await dormir(500);
    const etat = await page.textContent("#etat"), copie = await page.evaluate(() => navigator.clipboard.readText()), texte = await page.textContent("#resume");
    const apres = await stockage(ctx);
    const o = JSON.parse(copie);
    verifier("(h) resultats.html : résumé affiché", /non terminée, page 10 sur 10/.test(texte) && (texte.match(/ARRÊT/g) || []).length === 3 && /Derniers arrêts détectés \(10\)/.test(texte), texte.slice(0, 120).replace(/\n/g, " "));
    verifier("(h) copie complète, clés du diagnostic seulement", /^Copié/.test(etat) && o.cles["ld-diag-serie"].res.length === 9 && o.cles["ld-diag-incidents"].length === 10 && !copie.includes("NE_DOIT_PAS_SORTIR") && !("ld-vf-paye" in o.cles), etat);
    verifier("(h) lecture seule : stockage identique", JSON.stringify(avant) === JSON.stringify(apres));
    await ctx.close();
  },
  async i() { // tri ?stress=sans : 4 versions × 2 passes, retraits transmis d'une page à l'autre
    const { ctx, n } = await contexte(); const vus = [];
    ctx.on("request", (r) => { if (r.resourceType() === "document" && /serie=/.test(r.url())) { const q = new URL(r.url()).searchParams; vus.push((q.get("sans") || "-") + "/" + q.get("passe")); } });
    await demarrer(ctx, "/?stress=sans&duree=3");
    const s = await attendreFin(ctx, 400000);
    const attendu = ["", "etude", "lumiere", "etude-lumiere"];
    const noms = s ? s.liste.map((it) => it.nom) : [];
    const bonsNoms = noms.length === 8 && noms.every((x) => x.startsWith("proposition")) && attendu.every((a) => noms.filter((x) => x === "proposition" + (a ? "-" + a : "")).length === 2);
    verifier("(i) tri ?stress=sans : 8 pages (4 versions × 2), ordre alterné, sans témoin", bonsNoms && noms[0] !== noms[4], noms.join(", "));
    verifier("(i) chaque page ouverte = l'élément attendu, série terminée sans renvoi", s && s.fini && s.arret === "complet" && s.res.length === 8 && s.res.every((r, k) => r.nom === noms[k] && !r.plantage) && s.chargements === 8,
      resume(s) + ` · adresses ${vus.join(" ")} · chargements vus ${n()}`);
    await ctx.close();
  },
  async j() { // contrôle du bouton ?banc=bouton : ABBA, sans défilement rapide
    const { ctx, n } = await contexte(); const vus = [];
    ctx.on("request", (r) => { if (r.resourceType() === "document" && /serie=/.test(r.url())) { const q = new URL(r.url()).searchParams; vus.push(q.get("serie") + ":" + (q.get("v") || "-") + "/" + q.get("passe")); } });
    await demarrer(ctx, "/?banc=bouton");
    const s = await attendreFin(ctx, 600000);
    const attendu = ["proposition p1", "proposition+affiche p1", "proposition+affiche p2", "proposition p2"];
    verifier("(j) contrôle du bouton : 4 pages en ordre ABBA, série terminée sans renvoi", s && s.type === "bouton" && s.fini && s.arret === "complet" && s.chargements === 4 && s.res.length === 4 && s.res.every((r, k) => r.nom + " " + r.passe === attendu[k] && !r.plantage),
      resume(s) + ` · adresses ${vus.join(" ")} · chargements vus ${n()}`);
    const ph = s ? s.res.map((r) => Object.keys(r.phases || {}).join("/")) : [];
    verifier("(j) images comptées au repos (ouverture) et dans la vitrine pour chaque page", s && s.res.every((r) => r.phases && r.phases.ouverture && r.phases.ouverture.n > 100 && r.phases.vitrine), ph.join(" | "));
    await ctx.close();
  },
  async k() { // tri ?stress=lumiere : liste préparée au départ, première page ouverte avec le bon retrait
    const { ctx } = await contexte(); const page = await demarrer(ctx, "/?stress=lumiere&duree=3");
    await page.waitForURL(/serie=stress/); await attendrePasse(page, 0);
    const s = await serie(ctx), noms = s ? s.liste.map((it) => it.nom + " " + it.passe) : [];
    const attendu = ["proposition p1", "proposition-mobiles p1", "proposition-effets p1", "proposition-mobiles p2", "proposition-effets p2", "proposition p2"];
    const classes = await page.evaluate(() => document.documentElement.className).catch(() => "");
    verifier("(k) tri ?stress=lumiere : 6 pages en ordre alterné, sans témoin", JSON.stringify(noms) === JSON.stringify(attendu), noms.join(", "));
    await page.click("#ld-diag-stop"); await dormir(1500);
    const p2 = await rouvrir(ctx, BASE + "/?serie=stress&passe=p1&sans=mobiles"); await dormir(2500);
    const cl2 = await p2.evaluate(() => document.documentElement.className);
    verifier("(k) adresse d'une page -mobiles : classe lds-mobiles posée", /\blds-mobiles\b/.test(cl2) && !/\blds-/.test(classes), cl2.slice(0, 80));
    await ctx.close();
  },
};

// Stockage au format réel du 05/10 (ancien protocole) : 9 passes enregistrées, la 10e (témoin) en boucle, 10 arrêts.
function ANCIEN() {
  const V = ["actuel", "proposition", "proposition+nuit"], liste = [];
  for (let k = 0; k < 3; k++) for (let j = 0; j < 3; j++) liste.push({ nom: V[(j + k) % 3], passe: "p" + (k + 1), mode: "stress" });
  liste.push({ nom: "proposition#sanspanneau", passe: "témoin", mode: "stress" });
  const info = { ua: "iOS Safari 27.0", dpr: 3, ih: 695, vv: 695, svh: 695, lvh: 735, dvh: 695, entete: 134 };
  const st = { eblouissement: { n: 300, p50: 17, p95: 40, pc25: 12 }, blanc: { n: 200, p50: 17, p95: 33, pc25: 8 }, etude: { n: 400, p50: 50, p95: 90, pc25: 67 } };
  const j = [[61.2, 9100, "et", 80, "E", "w", 2400, ""], [61.4, 8600, "bl", 80, "HE", "w", -2500, "BRXEWM"]];
  const inc = (q, p) => ({ quand: q, page: p.nom, passe: p.passe, apres: 41, etape: "S aller 7", ph: "et", j, st, ro: 0, res: [], err: [] });
  const res = liste.slice(0, 9).map((p, i) => i % 3 === 1 ? { nom: p.nom, passe: p.passe, plantage: inc("15:0" + i + ":00", p), phases: st, ro: 0, res: [], info }
    : { nom: p.nom, passe: p.passe, arrivee: 0, phases: st, ecart: { hero: 40, etude: 40 }, ro: 2, err: [], res: [], finEcran: null, vMax: 2600, info, plantage: null, allersRetours: 9 });
  localStorage.setItem("ld-diag-serie", JSON.stringify({ type: "stress", liste, i: 9, res, debut: Date.now() - 3 * 3600000 }));
  localStorage.setItem("ld-diag-incidents", JSON.stringify(Array.from({ length: 10 }, (_, k) => inc("17:" + (10 + k) + ":00", liste[9]))));
  localStorage.setItem("ld-diag", JSON.stringify({ sid: "abc123", page: "proposition#sanspanneau", passe: "témoin", debut: Date.now() - 3600000, dernier: Date.now() - 3590000, etat: "en-cours", etape: "S aller 6", ph: "et", j, st, ro: 0, err: [], res: [], finEcran: null, info }));
}

const choix = (process.argv[2] || Object.keys(TESTS).join(",")).split(",");
for (const t of choix) { const t0 = Date.now(); try { await TESTS[t](); } catch (e) { echecs++; console.log(`ÉCHEC (${t}) exception : ${e.message.split("\n")[0]}`); } console.log(`     (${Math.round((Date.now() - t0) / 1000)} s)`); }
await nav.close(); srv.close();
console.log(echecs ? `${echecs} échec(s)` : "Tous les tests sont OK");
process.exit(echecs ? 1 : 0);
