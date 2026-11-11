// Vérification LOCALE (Chromium) des corrections du 09/11 (scripts/safari.mjs : « zoomplat », « eteints », « lueur »).
// Retour de Loan : « sur mobile, dès que je zoome avec mes deux doigts le site crash instantanément ».
// Chromium n'est pas Safari : il ne s'arrête pas au zoom (tuiles) et ne dessine pas les calques comme lui. Ce script contrôle
// ce qui se vérifie ici ; le comportement réel se voit sur l'iPhone (adresse de test).
//   1. Zoom à deux doigts simulé (vrais événements tactiles) : il marche partout ; pendant le zoom, la page d'accueil se
//      dessine à plat (plus de translate3d, de will-change ni de toile) ; défilement au doigt pendant le zoom ; dézoom : tout
//      redevient comme avant ; ordinateur et pages légales inchangés.
//   3. Vitrine : cartes et mur visibles dès l'ouverture, libérés après la fermeture (fondu terminé).
//   4. Captures AVANT / APRÈS identiques (animations figées au même instant), le long de toute la page, sans zoom et au zoom ×2,5 ;
//      témoin AVANT / AVANT.
//   5. Calques dessinés (Chromium) et mémoire estimée selon le modèle de WebKit iOS (GraphicsLayerCA), sans zoom et au zoom.
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
const SECTIONS = (process.env.SECTIONS || "1,3,4,5").split(",").map(Number), section = (n) => SECTIONS.includes(n);
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
// Pincement à deux doigts : deux points de contact qui s'écartent (ou se rapprochent), comme de vrais doigts.
// Input.synthesizePinchGesture en « touch » ne zoome jamais ici ; en « default » (zoomer() plus bas), il donne un zoom précis.
const pincer = async (o, ecarter = true) => { const tp = (d) => [{ x: 196 - d, y: 420, id: 1 }, { x: 196 + d, y: 420, id: 2 }], [d0, d1] = ecarter ? [20, 140] : [140, 20];
  await o.cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: tp(d0) });
  for (let i = 1; i <= 20; i++) { await o.cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: tp(d0 + (d1 - d0) * i / 20) }); await o.page.waitForTimeout(16); }
  await o.cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await o.page.waitForTimeout(800); return echelle(o.page); };
const allerP = (page, p) => page.evaluate((p) => { const sec = document.getElementById("hero"), H = sec.querySelector(".vfp-scene").clientHeight, tenue = 1.25 * H, plage = sec.offsetHeight - tenue - H - 0.8 * H, s0 = 0.198 * plage, s = 0.6 * p * plage;
  document.documentElement.style.scrollBehavior = "auto"; window.scrollTo(0, sec.getBoundingClientRect().top + scrollY + (s < s0 ? s : s + tenue * 0.994)); }, p);
const allerEl = (page, sel, f) => page.evaluate(([sel, f]) => { document.documentElement.style.scrollBehavior = "auto"; const e = document.querySelector(sel);
  window.scrollTo(0, e.getBoundingClientRect().top + scrollY + f * innerHeight); }, [sel, f]);
const allerBas = (page) => page.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; window.scrollTo(0, document.documentElement.scrollHeight); });

// État de la page pendant le zoom : mode « à plat », éléments encore en translate3d, will-change restants, toiles visibles.
const etatPlat = (page) => page.evaluate(() => { const v = document.querySelector(".vf"), tous = v ? [...v.querySelectorAll("*")] : [];
  return { zoom: document.documentElement.classList.contains("vf-zoom"), plat: document.documentElement.classList.contains("vf-zoom-plat"),
    t3: tous.filter((e) => e.style && /translate3d\(/.test(e.style.transform)).length,
    wc: tous.filter((e) => !e.classList.contains("vfp-affiche") && getComputedStyle(e).willChange !== "auto").length,
    toiles: tous.filter((e) => e.tagName === "CANVAS" && getComputedStyle(e).visibility !== "hidden").length }; });
// Zoom précis (simulé, pour les mesures) : Input.synthesizePinchGesture en « default ».
const zoomer = async (o, f) => { await o.cdp.send("Input.synthesizePinchGesture", { x: 196, y: 420, scaleFactor: f, relativeSpeed: 800, gestureSourceType: "default" }); await o.page.waitForTimeout(900); return echelle(o.page); };
const glisser = async (o, dy) => { await o.cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 196, y: 600, id: 1 }] });
  for (let i = 1; i <= 15; i++) { await o.cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: 196, y: 600 - i * dy / 15, id: 1 }] }); await o.page.waitForTimeout(16); }
  await o.cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await o.page.waitForTimeout(1200); };

// ——— 1. Zoom à deux doigts ———
if (section(1)) {
console.log("\n1. Zoom à deux doigts (format iPhone 393 × 852) : il marche, et la page se dessine à plat tant qu'elle est agrandie");
for (const [nom, aller] of [["haut de page", null], ["projecteur P 0,45", (p) => allerP(p, 0.45)], ["projecteur P 0,75", (p) => allerP(p, 0.75)], ["étude", (p) => allerEl(p, "#analysis", 0.6)], ["étude, bascule", (p) => allerEl(p, "#analysis", 8)], ["cartes", (p) => allerEl(p, ".vfk", 1.2)], ["pied de page", allerBas]]) {
  const r = {};
  for (const v of ["avant", "apres"]) { const o = await ouvrir(v); if (aller) { await aller(o.page); await o.page.waitForTimeout(1500); }
    r[v] = await pincer(o); await o.page.evaluate(() => window.scrollBy(0, 4)); await o.page.waitForTimeout(600); r[v + "E"] = await etatPlat(o.page); r[v + "err"] = o.erreurs; await o.ctx.close(); }
  const e = r.apresE;
  ok(r.avant > 1.5 && r.apres > 1.5 && e.zoom && e.plat && !e.t3 && !e.wc && !e.toiles && !r.apreserr.length,
    `Accueil, ${nom} : zoom ×${r.apres.toFixed(2)} (avant ×${r.avant.toFixed(2)}) ; à plat ${e.plat ? "oui" : "NON"}, translate3d ${e.t3} (avant ${r.avantE.t3}), will-change ${e.wc} (avant ${r.avantE.wc}), toiles visibles ${e.toiles} (avant ${r.avantE.toiles})` + (r.apreserr.length ? " ; ERREURS " + r.apreserr.join(" / ") : ""));
}
{ // Défilement au doigt pendant le zoom, puis dézoom : tout redevient comme avant.
  const o = await ouvrir("apres"); await allerP(o.page, 0.45); await o.page.waitForTimeout(1500); await pincer(o);
  /* Position affichée (visualViewport.pageTop) : au zoom, un glissé déplace d'abord la partie agrandie dans l'écran, puis la page. */
  const t0 = await o.page.evaluate(() => document.querySelector(".vfp-fig").style.transform), y0 = await o.page.evaluate(() => [visualViewport.pageTop, scrollY]);
  for (let k = 0; k < 8; k++) await glisser(o, 300);
  const t1 = await o.page.evaluate(() => document.querySelector(".vfp-fig").style.transform), y1 = await o.page.evaluate(() => [visualViewport.pageTop, scrollY]), e1 = await etatPlat(o.page);
  ok(y1[0] - y0[0] > 100 && y1[1] > y0[1] && t1 !== t0 && /^translate\(/.test(t1) && !e1.t3, `Glissé d'un doigt pendant le zoom : vue descendue de ${Math.round(y1[0] - y0[0])} px (page ${Math.round(y1[1] - y0[1])} px), Loan suit le défilement (${t1.slice(0, 34)}…), translate3d ${e1.t3}`);
  const s = await pincer(o, false); await o.page.evaluate(() => window.scrollBy(0, 2)); await o.page.waitForTimeout(800); const e2 = await etatPlat(o.page);
  ok(s < 1.01 && !e2.zoom && !e2.plat && e2.t3 > 0 && e2.wc > 0 && e2.toiles > 0, `Dézoom aux deux doigts → ×${s.toFixed(2)} : mode zoom ${e2.zoom ? "actif" : "fini"}, à plat ${e2.plat ? "oui" : "non"}, translate3d ${e2.t3}, will-change ${e2.wc}, toiles visibles ${e2.toiles} (comme avant le zoom)`);
  ok(!o.erreurs.length, "Aucune erreur JS" + (o.erreurs.length ? " : " + o.erreurs.join(" / ") : "")); await o.ctx.close();
}
{ // 11/11 : à plat dès que deux doigts touchent l'écran (avant tout zoom) ; doigts relevés sans zoom : retour à la normale.
  // Un seul doigt (défilement) : jamais à plat.
  const o = await ouvrir("apres"); await allerP(o.page, 0.45); await o.page.waitForTimeout(1500);
  await o.cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 196, y: 600, id: 1 }] });
  await o.page.waitForTimeout(150); const e0 = await etatPlat(o.page);
  await o.cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await o.page.waitForTimeout(300);
  ok(!e0.plat, `Un doigt posé : à plat ${e0.plat ? "OUI" : "non"}`);
  await o.cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 150, y: 420, id: 1 }, { x: 240, y: 420, id: 2 }] });
  await o.page.waitForTimeout(60); const e1 = await etatPlat(o.page);
  ok(e1.plat && !e1.t3 && !e1.wc, `Deux doigts posés, avant tout mouvement (60 ms) : à plat ${e1.plat ? "oui" : "NON"}, translate3d ${e1.t3}, will-change ${e1.wc}, échelle ×${(await echelle(o.page)).toFixed(2)}`);
  await o.cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await o.page.waitForTimeout(900);
  await o.page.evaluate(() => window.scrollBy(0, 2)); await o.page.waitForTimeout(700); const e2 = await etatPlat(o.page);
  ok(!e2.plat && e2.t3 > 0 && e2.wc > 0, `Deux doigts relevés sans zoom : à plat ${e2.plat ? "OUI" : "non"}, translate3d ${e2.t3}, will-change ${e2.wc} (état normal)`);
  ok(!o.erreurs.length, "Aucune erreur JS" + (o.erreurs.length ? " : " + o.erreurs.join(" / ") : "")); await o.ctx.close();
}
{ // Ordinateur (zoom au trackpad) : mode zoom du 03/11 seulement, pas de dessin à plat.
  const o = await ouvrir("apres", "/", BUREAU); const s = await zoomer(o, 2); const e = await etatPlat(o.page);
  ok(s > 1.5 && e.zoom && !e.plat && e.t3 > 0, `Ordinateur, zoom ×${s.toFixed(2)} : mode zoom ${e.zoom ? "actif" : "inactif"}, à plat ${e.plat ? "OUI" : "non"} (inchangé)`); await o.ctx.close();
}
for (const chemin of ["/CGV.dc.html", "/Privacy.dc.html", "/Legal.dc.html", "/Sponsors.dc.html"]) {
  const o = await ouvrir("apres", chemin); const s = await pincer(o); ok(s > 1.5 && !o.erreurs.length, `${chemin} : zoom ×${s.toFixed(2)}, aucune erreur JS`); await o.ctx.close();
}
{ // Sans zoom : rien ne change (aucun reste de la correction écartée « pincement »).
  const o = await ouvrir("apres"); const r = await o.page.evaluate(() => ({ ta: getComputedStyle(document.body).touchAction, plat: document.documentElement.classList.contains("vf-zoom-plat") }));
  ok(r.ta === "auto" && !r.plat, `Sans zoom : touch-action « ${r.ta} », à plat ${r.plat ? "OUI" : "non"}`); await o.ctx.close();
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
  for (const [nom, aller] of POSES) { await aller(o.page); await o.page.waitForTimeout(/^étude/.test(nom) ? 4500 : 3500); /* caméras posées (amorti du projecteur et de l'étude) */
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
// Au zoom ×2,5 (format iPhone) : page dessinée à plat contre page d'origine, même zoom, mêmes animations figées.
const ZPOSES = [["P0", (p) => allerP(p, 0)], ["P0,45", (p) => allerP(p, 0.45)], ["P0,75", (p) => allerP(p, 0.75)], ["étude 0,6", (p) => allerEl(p, "#analysis", 0.6)], ["étude 8", (p) => allerEl(p, "#analysis", 8)], ["cartes", (p) => allerEl(p, ".vfk", 1.2)]];
const capturerZoom = async (version, tag) => { const f = {}, err = [];
  for (const [nom, aller] of ZPOSES) { const o = await ouvrir(version, "/", MOBILE, { polices: false }); await o.page.waitForTimeout(3000); await aller(o.page); await o.page.waitForTimeout(/^étude/.test(nom) ? 4500 : 3500);
    await zoomer(o, 2.5); await o.page.waitForTimeout(1200);
    await o.page.evaluate(() => { document.getAnimations().forEach((a) => { try { a.pause(); a.currentTime = 6000; } catch (e) {} }); document.querySelectorAll("canvas").forEach((c) => (c.style.visibility = "hidden")); });
    await o.page.waitForTimeout(500); const { data } = await o.cdp.send("Page.captureScreenshot", { format: "png" });
    f[nom] = path.join(MESURES, `zoom-${tag}-${nom.replace(/[ ,]/g, "_")}.png`); fs.writeFileSync(f[nom], Buffer.from(data, "base64")); err.push(...o.erreurs); await o.ctx.close(); }
  return { f, err }; };
// Au zoom, la page à plat est dessinée directement à la résolution du zoom (avant : calques agrandis après coup) : grain de la
// photo rééchantillonné, contours décalés de moins d'un pixel. On compare donc la FORME : niveaux de gris floutés (rayon 3 px),
// part des pixels qui diffèrent de plus de 24 niveaux sur 255.
const forme = (a, b) => { const A = PNG.sync.read(fs.readFileSync(a)), B = PNG.sync.read(fs.readFileSync(b)), W = A.width, H = A.height;
  const gris = (P) => { let g = new Float32Array(W * H); for (let i = 0; i < W * H; i++) g[i] = 0.299 * P.data[4 * i] + 0.587 * P.data[4 * i + 1] + 0.114 * P.data[4 * i + 2];
    for (let passe = 0; passe < 2; passe++) { const h = new Float32Array(W * H), v = new Float32Array(W * H), r = 3;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let s = 0, n = 0; for (let k = -r; k <= r; k++) { const xx = x + k; if (xx >= 0 && xx < W) { s += g[y * W + xx]; n++; } } h[y * W + x] = s / n; }
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let s = 0, n = 0; for (let k = -r; k <= r; k++) { const yy = y + k; if (yy >= 0 && yy < H) { s += h[yy * W + x]; n++; } } v[y * W + x] = s / n; }
      g = v; } return g; };
  const ga = gris(A), gb = gris(B); let n = 0; for (let i = 0; i < W * H; i++) if (Math.abs(ga[i] - gb[i]) > 24) n++; return +(100 * n / (W * H)).toFixed(2); };
{ const a = await capturerZoom("avant", "avant-a"), b = await capturerZoom("avant", "avant-b"), c = await capturerZoom("apres", "apres");
  for (const [nom] of ZPOSES) { const t = ecart(a.f[nom], b.f[nom]), d = ecart(a.f[nom], c.f[nom]), ft = forme(a.f[nom], b.f[nom]), fd = forme(a.f[nom], c.f[nom]);
    ok(fd <= ft + 2.5, `iPhone zoom ×2,5, ${nom} : forme ${fd} % (témoin ${ft} %) ; au pixel ${d.visible} % (témoin ${t.visible} %)`); }
  ok(!a.err.length && !c.err.length, "Zoom : aucune erreur JS" + ([...a.err, ...c.err].length ? " : " + [...a.err, ...c.err].join(" / ") : "")); }
}
// ——— 5. Calques ———
// Modèle de WebKit iOS (GraphicsLayerCA) : calque de moins de 1 280 px CSS × zoom → une image entière, l × h × (3 × zoom)² × 4
// octets ; au-delà, tuiles sur la partie visible (agrandie si le calque est réduit par une transformation), 156 Mo au plus.
const memoire = (w, h, r, vis, z) => { if (!w || !h) return 0; let inter = (vis[2] - vis[0]) * (vis[3] - vis[1]), sx = 1, sy = 1;
  if (r) { const ix = Math.min(r[2], vis[2]) - Math.max(r[0], vis[0]), iy = Math.min(r[3], vis[3]) - Math.max(r[1], vis[1]); if (ix <= 0 || iy <= 0) return 0;
    inter = ix * iy; sx = Math.max(0.05, (r[2] - r[0]) / w); sy = Math.max(0.05, (r[3] - r[1]) / h); }
  if (Math.max(w, h) * z <= 1280) return w * h * 36 * z * z;
  return Math.min(156 * 1048576, Math.min(w * h, 1.2 * inter / (sx * sy)) * 36 * z * z); };
if (section(5)) {
console.log("\n5. Calques dessinés (Chromium, iPhone) et mémoire estimée avec le modèle de WebKit iOS, sans zoom puis au zoom");
const POS = [["haut", (p) => allerP(p, 0)], ["P0,45", (p) => allerP(p, 0.45)], ["P0,75", (p) => allerP(p, 0.75)], ["étude 0,6", (p) => allerEl(p, "#analysis", 0.6)], ["étude 8", (p) => allerEl(p, "#analysis", 8)], ["cartes", (p) => allerEl(p, ".vfk", 1.2)], ["pied", allerBas]];
const calques = async (version, z) => { const res = {};
  for (const [nom, aller] of POS) { const o = await ouvrir(version); await o.page.waitForTimeout(2000); let L = [];
    o.cdp.on("LayerTree.layerTreeDidChange", (e) => { if (e.layers) L = e.layers; }); await o.cdp.send("LayerTree.enable"); await o.cdp.send("DOM.enable");
    await aller(o.page); await o.page.waitForTimeout(/^étude/.test(nom) ? 4000 : 1500); const ze = z > 1 ? await zoomer(o, z) : 1;
    await o.page.evaluate(() => window.scrollBy(0, 2)); await o.page.waitForTimeout(1500);
    const vis = await o.page.evaluate(() => { const v = visualViewport; return [v.offsetLeft, v.offsetTop, v.offsetLeft + v.width, v.offsetTop + v.height]; });
    let mo = 0, n = 0;
    for (const l of L.filter((l) => l.drawsContent)) { let r = null;
      if (l.backendNodeId) try { const { object } = await o.cdp.send("DOM.resolveNode", { backendNodeId: l.backendNodeId });
        const { result } = await o.cdp.send("Runtime.callFunctionOn", { objectId: object.objectId, returnByValue: true, functionDeclaration: "function(){ const e = this.nodeType === 1 ? this : this.parentElement; if (e === document.documentElement || e === document.body) return null; const b = e.getBoundingClientRect(); return [b.left, b.top, b.right, b.bottom, e.tagName]; }" });
        r = result.value || null; } catch (e) {}
      const m = memoire(l.width, l.height, r, vis, r && r[4] === "CANVAS" ? 1 : ze); if (m > 0) { mo += m; n++; } }
    res[nom] = { n, mo: Math.round(mo / 1048576), z: ze }; await o.ctx.close(); }
  return res; };
for (const z of [1, 2, 3, 5]) { const ca = await calques("avant", z), cb = await calques("apres", z);
  console.log(`  zoom ×${z}`); for (const nom in ca) console.log(`    ${nom.padEnd(10)} avant ${String(ca[nom].n).padStart(3)} calques visibles ≈ ${String(ca[nom].mo).padStart(4)} Mo   après ${String(cb[nom].n).padStart(3)} calques ≈ ${String(cb[nom].mo).padStart(4)} Mo` + (z > 1 ? `   (zoom obtenu ×${ca[nom].z.toFixed(2)} / ×${cb[nom].z.toFixed(2)})` : "")); }
}

console.log(echecs ? `\n${echecs} contrôle(s) en échec.` : "\nTous les contrôles passent.");
await nav.close(); process.exit(echecs ? 1 : 0);
