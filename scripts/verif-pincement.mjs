// Vérification LOCALE (Chromium) des corrections du 09/11 (scripts/safari.mjs : « pincement », « eteints », « lueur »).
// Retour de Loan : « sur mobile, dès que je zoome avec mes deux doigts le site crash instantanément ».
// Chromium n'est pas Safari : il ne s'arrête pas au zoom (tuiles) et ne dessine pas les calques comme lui. Ce script contrôle
// ce qui se vérifie ici ; le comportement réel se voit sur l'iPhone (adresse de test).
//   1. Pincement à deux doigts simulé (vrais événements tactiles) : la page d'accueil ne s'agrandit plus sur écran tactile ;
//      les pages légales s'agrandissent toujours ; page déjà agrandie (état rendu par le navigateur) : on peut dézoomer.
//   2. touch-action sur tous les éléments (y compris dans les blocs qui défilent), seulement sur écran tactile.
//   3. Vitrine : cartes et mur visibles dès l'ouverture, libérés après la fermeture (fondu terminé).
//   4. Captures AVANT / APRÈS identiques (animations figées au même instant), le long de toute la page ; témoin AVANT / AVANT.
//   5. Calques dessinés (Chromium) et mémoire estimée selon le modèle de WebKit iOS (GraphicsLayerCA), zoom ×1.
// Usage : node scripts/verif-pincement.mjs <dossier AVANT> [dossier APRÈS = public]
//   (AVANT : par ex. SAFARI=entete,textures,compact,affiche,lvh,camera npm run construire, puis copie de public/)
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright-core";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

const RACINE = path.resolve(import.meta.dirname, ".."), MESURES = path.join(RACINE, "mesures", "pincement");
const [avantArg, apresArg = "public"] = process.argv.slice(2);
if (!avantArg) { console.error("Usage : node scripts/verif-pincement.mjs <dossier AVANT> [dossier APRÈS]"); process.exit(1); }
const DOSSIERS = { avant: path.resolve(avantArg), apres: path.resolve(RACINE, apresArg) };
fs.mkdirSync(MESURES, { recursive: true });

const TYPES = { html: "text/html", js: "text/javascript", css: "text/css", png: "image/png", webp: "image/webp", jpg: "image/jpeg", svg: "image/svg+xml", woff2: "font/woff2", json: "application/json", ico: "image/x-icon" };
const serveur = (dos) => { const s = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p === "/") p = "/index.html";
    const f = path.join(dos, p);
    if (!f.startsWith(dos) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { "content-type": TYPES[path.extname(f).slice(1)] || "application/octet-stream", "cache-control": "no-cache" });
    fs.createReadStream(f).pipe(res); });
  return new Promise((ok) => s.listen(0, "127.0.0.1", () => ok(`http://127.0.0.1:${s.address().port}`))); };
const BASES = { avant: await serveur(DOSSIERS.avant), apres: await serveur(DOSSIERS.apres) };
const nav = await chromium.launch({ proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: "127.0.0.1,localhost" } : undefined });
const MOBILE = { viewport: { width: 393, height: 852 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true };
const BUREAU = { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 };

// SECTIONS=4,5 : seulement ces contrôles.
const SECTIONS = (process.env.SECTIONS || "1,2,3,4,5").split(",").map(Number), section = (n) => SECTIONS.includes(n);
// Ouvrir / fermer la vitrine par le bouton lui-même (un clic à la souris peut tomber sur la scène encore en mouvement).
const ouvrirVitrine = (p) => p.evaluate(() => document.querySelector(".vfp-affiche").click());
const fermerVitrine = (p) => p.evaluate(() => { const b = document.querySelector(".vfp-voir-f button, .vfp-voir-f a, .vfp-voir-f [role=button]"); if (b) b.click(); });
let echecs = 0;
const ok = (cond, msg) => { console.log((cond ? "  ok   " : "  ÉCHEC ") + msg); if (!cond) echecs++; };

async function ouvrir(version, chemin = "/", profil = MOBILE, { polices = true } = {}) {
  const ctx = await nav.newContext({ ...profil, reducedMotion: "no-preference" });
  const page = await ctx.newPage(), cdp = await ctx.newCDPSession(page), erreurs = [];
  page.on("pageerror", (e) => erreurs.push(e.message.slice(0, 200)));
  await page.route(/loan-api|stripe|cloudflareinsights|jsdelivr/, (r) => r.abort());
  if (!polices) await page.route(/fonts\.googleapis\.com|fonts\.gstatic\.com/, (r) => r.abort());
  await page.goto(BASES[version] + chemin, { waitUntil: "load", timeout: 120000 });
  await page.waitForFunction(() => !document.getElementById("ld-chargement"), null, { timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(2500);
  return { ctx, page, cdp, erreurs };
}
const echelle = (page) => page.evaluate(() => (window.visualViewport ? visualViewport.scale : 1));
// Pincement à deux doigts : deux points de contact qui s'écartent (ou se rapprochent), comme de vrais doigts (soumis à
// touch-action). Input.synthesizePinchGesture ne convient pas ici : en « touch », il ne zoome jamais (même sans la correction) ;
// en « default », il passe outre touch-action (il sert seulement à simuler une page déjà agrandie).
const pincer = async (o, ecarter = true) => { const tp = (d) => [{ x: 196 - d, y: 420, id: 1 }, { x: 196 + d, y: 420, id: 2 }], [d0, d1] = ecarter ? [20, 140] : [140, 20];
  await o.cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: tp(d0) });
  for (let i = 1; i <= 20; i++) { await o.cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: tp(d0 + (d1 - d0) * i / 20) }); await o.page.waitForTimeout(16); }
  await o.cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await o.page.waitForTimeout(800); return echelle(o.page); };
const allerP = (page, p) => page.evaluate((p) => { const sec = document.getElementById("hero"), H = sec.querySelector(".vfp-scene").clientHeight, tenue = 1.25 * H, plage = sec.offsetHeight - tenue - H - 0.8 * H, s0 = 0.198 * plage, s = 0.6 * p * plage;
  document.documentElement.style.scrollBehavior = "auto"; window.scrollTo(0, sec.getBoundingClientRect().top + scrollY + (s < s0 ? s : s + tenue * 0.994)); }, p);
const allerEl = (page, sel, f) => page.evaluate(([sel, f]) => { document.documentElement.style.scrollBehavior = "auto"; const e = document.querySelector(sel);
  window.scrollTo(0, e.getBoundingClientRect().top + scrollY + f * innerHeight); }, [sel, f]);
const allerBas = (page) => page.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; window.scrollTo(0, document.documentElement.scrollHeight); });

// ——— 1. Pincement ———
if (section(1)) {
console.log("\n1. Pincement à deux doigts (format iPhone 393 × 852)");
for (const [nom, aller] of [["haut de page", null], ["projecteur P 0,75", (p) => allerP(p, 0.75)], ["étude", (p) => allerEl(p, "#analysis", 0.6)], ["cartes", (p) => allerEl(p, ".vfk", 1.2)], ["pied de page", allerBas]]) {
  const r = {};
  for (const v of ["avant", "apres"]) { const o = await ouvrir(v); if (aller) { await aller(o.page); await o.page.waitForTimeout(1200); } r[v] = await pincer(o); await o.ctx.close(); }
  ok(r.avant > 1.5 && Math.abs(r.apres - 1) < 0.01, `Accueil, ${nom} : échelle après pincement — avant ×${r.avant.toFixed(2)}, après ×${r.apres.toFixed(2)}`);
}
for (const chemin of ["/CGV.dc.html", "/Privacy.dc.html", "/Legal.dc.html", "/Sponsors.dc.html"]) {
  const o = await ouvrir("apres", chemin); const s = await pincer(o); ok(s > 1.5, `${chemin} : le zoom reste possible (×${s.toFixed(2)})`); await o.ctx.close();
}
{ // Page déjà agrandie (état rendu par le navigateur, simulé par un pincement qui passe outre touch-action) : le pincement
  // revient pour dézoomer, puis la protection reprend.
  const o = await ouvrir("apres");
  await o.cdp.send("Input.synthesizePinchGesture", { x: 196, y: 420, scaleFactor: 2.5, relativeSpeed: 600, gestureSourceType: "default" }); await o.page.waitForTimeout(800);
  const zoomee = await o.page.evaluate(() => ({ s: visualViewport.scale, z: document.documentElement.classList.contains("vf-zoom"), ta: getComputedStyle(document.body).touchAction }));
  ok(zoomee.s > 1.9 && zoomee.z && zoomee.ta === "auto", `Page agrandie ×${zoomee.s.toFixed(2)} : mode zoom ${zoomee.z ? "actif" : "inactif"}, touch-action « ${zoomee.ta} » (pincement permis)`);
  const s = await pincer(o, false), s2 = await pincer(o);
  const fin = await o.page.evaluate(() => ({ z: document.documentElement.classList.contains("vf-zoom"), ta: getComputedStyle(document.body).touchAction }));
  ok(Math.abs(s - 1) < 0.01 && Math.abs(s2 - 1) < 0.01 && !fin.z && fin.ta === "pan-x pan-y", `Dézoom aux deux doigts → ×${s.toFixed(2)} ; mode zoom ${fin.z ? "actif" : "inactif"}, touch-action « ${fin.ta} », nouveau pincement → ×${s2.toFixed(2)}`);
  ok(!o.erreurs.length, "Aucune erreur JS" + (o.erreurs.length ? " : " + o.erreurs.join(" / ") : "")); await o.ctx.close();
}
{ // Défilement au doigt inchangé (glissé vertical d'un doigt).
  for (const v of ["avant", "apres"]) { const o = await ouvrir(v); const y0 = await o.page.evaluate(() => scrollY);
    await o.cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 196, y: 700, id: 1 }] });
    for (let i = 1; i <= 15; i++) { await o.cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: 196, y: 700 - i * 30, id: 1 }] }); await o.page.waitForTimeout(16); }
    await o.cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await o.page.waitForTimeout(1500);
    const y1 = await o.page.evaluate(() => scrollY); ok(y1 - y0 > 200, `${v === "avant" ? "Avant" : "Après"} : glissé d'un doigt vers le haut → page descendue de ${Math.round(y1 - y0)} px`); await o.ctx.close(); }
}

}
// ——— 2. touch-action ———
if (section(2)) {
console.log("\n2. touch-action");
for (const [profil, P, attendu] of [["iPhone", MOBILE, "pan-x pan-y"], ["ordinateur", BUREAU, "auto"]]) {
  const o = await ouvrir("apres", "/", P);
  const r = await o.page.evaluate(() => { const vals = new Set(); let n = 0; document.querySelectorAll("*").forEach((e) => { vals.add(getComputedStyle(e).touchAction); n++; });
    vals.add(getComputedStyle(document.documentElement).touchAction); return { vals: [...vals], n }; });
  ok(r.vals.length === 1 && r.vals[0] === attendu, `${profil} : ${r.n} éléments, touch-action ${r.vals.map((v) => "« " + v + " »").join(", ")} (attendu « ${attendu} »)`);
  await o.ctx.close();
}

}
// ——— 3. Vitrine ———
if (section(3)) {
console.log("\n3. Vitrine (See pricing), format iPhone puis ordinateur");
for (const [profil, P] of [["iPhone", MOBILE], ["ordinateur", BUREAU]]) {
  const o = await ouvrir("apres", "/", P); const p = o.page;
  const etat = () => p.evaluate(() => { const c = document.querySelector(".vfp-cartes"), m = document.querySelector(".vfp-mur"), cs = getComputedStyle(c);
    return { cartes: cs.visibility, inerte: c.inert, op: getComputedStyle(c.querySelector(".vfp-c")).opacity, mur: getComputedStyle(m).visibility, murOp: +m.style.opacity || 0 }; });
  const e0 = await etat();
  ok(e0.cartes === "hidden" && e0.mur === "hidden" && e0.inerte, `${profil}, fermée : cartes ${e0.cartes}, mur ${e0.mur}, inertes ${e0.inerte}`);
  await ouvrirVitrine(p); await p.waitForTimeout(120); const e1 = await etat();
  ok(e1.cartes === "visible" && !e1.inerte, `${profil}, 0,1 s après l'ouverture : cartes ${e1.cartes} (opacité ${(+e1.op).toFixed(2)}), mur ${e1.mur} (opacité ${e1.murOp})`);
  await p.waitForTimeout(3000); const e2 = await etat();
  ok(e2.cartes === "visible" && +e2.op > 0.99 && e2.mur === "visible" && e2.murOp > 0.99, `${profil}, ouverte : cartes ${e2.cartes} (opacité ${(+e2.op).toFixed(2)}), mur ${e2.mur} (opacité ${e2.murOp})`);
  await fermerVitrine(p);
  await p.waitForTimeout(500); const e3 = await etat();
  ok(e3.cartes === "visible", `${profil}, 0,5 s après la fermeture (fondu en cours) : cartes ${e3.cartes} (opacité ${(+e3.op).toFixed(2)})`);
  await p.waitForTimeout(2500); const e4 = await etat();
  ok(e4.cartes === "hidden" && e4.mur === "hidden" && e4.inerte, `${profil}, 3 s après la fermeture : cartes ${e4.cartes} (opacité ${(+e4.op).toFixed(2)}), mur ${e4.mur} (opacité ${e4.murOp})`);
  ok(!o.erreurs.length, `${profil} : aucune erreur JS` + (o.erreurs.length ? " : " + o.erreurs.join(" / ") : "")); await o.ctx.close();
}

}
// ——— 4. Captures AVANT / APRÈS ———
if (section(4)) {
console.log("\n4. Captures (animations figées au même instant, poussière masquée, polices chinoises bloquées)");
const POSES = [["P0", (p) => allerP(p, 0)], ["P0,45", (p) => allerP(p, 0.45)], ["P0,75", (p) => allerP(p, 0.75)], ["P0,8", (p) => allerP(p, 0.8)],
  ["vitrine", async (p) => { await allerP(p, 0); await p.waitForTimeout(1500); await ouvrirVitrine(p); await p.waitForTimeout(3500); }],
  ["vitrine refermée", async (p) => { await fermerVitrine(p); await p.waitForTimeout(3000); }],
  ["étude 0,6", (p) => allerEl(p, "#analysis", 0.6)], ["étude 3", (p) => allerEl(p, "#analysis", 3)], ["étude 8", (p) => allerEl(p, "#analysis", 8)],
  ["étude 14", (p) => allerEl(p, "#analysis", 14)], ["cartes", (p) => allerEl(p, ".vfk", 1.2)], ["pied de page", allerBas]];
const capturer = async (version, tag, P) => { const o = await ouvrir(version, "/", P, { polices: false }); await o.page.waitForTimeout(5000); const f = {};
  for (const [nom, aller] of POSES) { await aller(o.page); await o.page.waitForTimeout(/^étude/.test(nom) ? 4500 : 1500); /* caméra de l étude posée (amorti) */
    await o.page.evaluate(() => { document.getAnimations().forEach((a) => { try { a.pause(); a.currentTime = 6000; } catch (e) {} }); document.querySelectorAll(".vfp-poussiere, canvas").forEach((c) => (c.style.visibility = "hidden")); });
    await o.page.waitForTimeout(400); f[nom] = path.join(MESURES, `${tag}-${nom.replace(/[ ,]/g, "_")}.png`); await o.page.screenshot({ path: f[nom] });
    await o.page.evaluate(() => { document.getAnimations().forEach((a) => { try { a.play(); } catch (e) {} }); document.querySelectorAll(".vfp-poussiere, canvas").forEach((c) => (c.style.visibility = "")); }); }
  const err = o.erreurs; await o.ctx.close(); return { f, err }; };
const ecart = (a, b) => { const A = PNG.sync.read(fs.readFileSync(a)), B = PNG.sync.read(fs.readFileSync(b)); if (A.width !== B.width || A.height !== B.height) return { visible: 100, max: 255 };
  const n = pixelmatch(A.data, B.data, null, A.width, A.height, { threshold: 0.06 }); let max = 0, somme = 0;
  for (let i = 0; i < A.data.length; i += 4) for (let k = 0; k < 3; k++) { const e = Math.abs(A.data[i + k] - B.data[i + k]); somme += e; if (e > max) max = e; }
  return { visible: +(100 * n / (A.width * A.height)).toFixed(3), moyen: +(somme / (3 * A.width * A.height)).toFixed(3), max }; };
for (const [profil, P] of [["iPhone", MOBILE], ["ordinateur", BUREAU]]) {
  const a = await capturer("avant", `${profil}-avant-a`, P), b = await capturer("avant", `${profil}-avant-b`, P), c = await capturer("apres", `${profil}-apres`, P);
  for (const [nom] of POSES) { const t = ecart(a.f[nom], b.f[nom]), d = ecart(a.f[nom], c.f[nom]);
    ok(d.visible <= Math.max(0.05, t.visible * 1.5 + 0.02), `${profil}, ${nom} : pixels différents ${d.visible} % (moyen ${d.moyen}, max ${d.max}) ; témoin avant/avant ${t.visible} % (max ${t.max})`); }
  ok(!a.err.length && !c.err.length, `${profil} : aucune erreur JS` + ([...a.err, ...c.err].length ? " : " + [...a.err, ...c.err].join(" / ") : ""));
}

}
// ——— 5. Calques ———
if (section(5)) {
console.log("\n5. Calques dessinés (Chromium, iPhone) et mémoire estimée, modèle WebKit iOS à zoom ×1 (calque < 1 280 px : l × h × 3² × 4 octets)");
const calques = async (version) => { const o = await ouvrir(version); await o.page.waitForTimeout(4000); let L = []; o.cdp.on("LayerTree.layerTreeDidChange", (e) => { if (e.layers) L = e.layers; });
  await o.cdp.send("LayerTree.enable"); const res = {};
  const releve = async (nom) => { await o.page.waitForTimeout(1500); const d = L.filter((l) => l.drawsContent && l.width * l.height < 2e6); /* sans la page entière */
    res[nom] = { dessines: d.length, mo: Math.round(d.reduce((s, l) => s + (Math.max(l.width, l.height) <= 1280 ? l.width * l.height * 36 : 393 * 852 * 36 * 1.2), 0) / 1048576) }; };
  for (const [nom, aller] of [["P0", (p) => allerP(p, 0)], ["P0,45", (p) => allerP(p, 0.45)], ["P0,75", (p) => allerP(p, 0.75)]]) { await aller(o.page); await releve(nom); }
  await allerP(o.page, 0); await o.page.waitForTimeout(1500); await ouvrirVitrine(o.page); await o.page.waitForTimeout(2500); await releve("vitrine");
  await fermerVitrine(o.page); await o.page.waitForTimeout(2500); await releve("vitrine refermée");
  for (const [nom, f] of [["étude 0,6", 0.6], ["étude 8", 8]]) { await allerEl(o.page, "#analysis", f); await releve(nom); }
  await o.ctx.close(); return res; };
const ca = await calques("avant"), cb = await calques("apres");
for (const nom in ca) console.log(`  ${nom.padEnd(17)} avant ${String(ca[nom].dessines).padStart(3)} calques ≈ ${String(ca[nom].mo).padStart(4)} Mo   après ${String(cb[nom].dessines).padStart(3)} calques ≈ ${String(cb[nom].mo).padStart(4)} Mo`);
}

console.log(echecs ? `\n${echecs} contrôle(s) en échec.` : "\nTous les contrôles passent.");
await nav.close(); process.exit(echecs ? 1 : 0);
