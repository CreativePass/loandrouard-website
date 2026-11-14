// Vérification LOCALE (Chromium) des corrections des 09 et 14/11 (scripts/safari.mjs : « loupe », « eteints », « lueur »).
// Retour de Loan : « sur mobile, dès que je zoome avec mes deux doigts le site crash instantanément ».
// Chromium n'est pas Safari : il ne s'arrête pas au zoom (tuiles) et ne dessine pas les calques comme lui. Ce script contrôle
// ce qui se vérifie ici ; le comportement réel se voit sur l'iPhone (adresse de test).
//   1. Loupe (14/11), vrais événements tactiles : zoom de Safari bloqué sur l'accueil et remplacé par la loupe ; image agrandie
//      fidèle (fond fixe, en-tête, point sous les doigts, cible d'un toucher) ; glissé d'un doigt ; scènes en pause ; retour à ×1 ;
//      un doigt sans loupe défile ; ordinateur et pages légales inchangés.
//   3. Vitrine : cartes et mur visibles dès l'ouverture, libérés après la fermeture (fondu terminé).
//   4. Captures AVANT / APRÈS identiques sans zoom (animations figées au même instant), le long de toute la page ; témoin
//      AVANT / AVANT. Loupe ×2,5 : même image que l'écran d'origine agrandi.
//   5. Mémoire estimée selon le modèle de WebKit iOS (GraphicsLayerCA) : zoom de Safari (origine) contre loupe.
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

// ——— 1. Loupe (14/11) ———
// État de la loupe : active, échelle et déplacement lus sur .vf, échelle du zoom de Safari, éléments en 3D.
const etatLoupe = (page) => page.evaluate(() => { const v = document.querySelector(".vf"), m = v && getComputedStyle(v).transform !== "none" ? new DOMMatrix(getComputedStyle(v).transform) : null;
  return { loupe: document.documentElement.classList.contains("vf-loupe"), s: m ? m.a : 1, vv: visualViewport.scale, y: scrollY,
    t3: v ? [...v.querySelectorAll("*")].filter((e) => e.style && /translate3d\(/.test(e.style.transform)).length : 0 }; });
// Deux doigts qui s'écartent (ou se rapprochent) autour de (cx, cy).
const pincerEn = async (o, cx, cy, d0, d1) => { const tp = (d) => [{ x: cx - d, y: cy, id: 1 }, { x: cx + d, y: cy, id: 2 }];
  await o.cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: tp(d0) });
  for (let i = 1; i <= 20; i++) { await o.cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: tp(d0 + (d1 - d0) * i / 20) }); await o.page.waitForTimeout(16); }
  await o.cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await o.page.waitForTimeout(600); };
const glisserDoigt = async (o, x0, y0, dx, dy) => { await o.cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: x0, y: y0, id: 1 }] });
  for (let i = 1; i <= 12; i++) { await o.cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x0 + dx * i / 12, y: y0 + dy * i / 12, id: 1 }] }); await o.page.waitForTimeout(16); }
  await o.page.waitForTimeout(150); await o.cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await o.page.waitForTimeout(500); };
if (section(1)) {
console.log("\n1. Loupe au pincement (format iPhone 393 × 852)");
for (const [nom, aller] of [["haut de page", null], ["projecteur P 0,75", (p) => allerP(p, 0.75)], ["étude", (p) => allerEl(p, "#analysis", 0.6)], ["étude, bascule", (p) => allerEl(p, "#analysis", 8)], ["cartes", (p) => allerEl(p, ".vfk", 1.2)], ["pied de page", allerBas]]) {
  const o = await ouvrir("apres"); if (aller) { await aller(o.page); await o.page.waitForTimeout(2500); }
  /* Repères avant la loupe : en-tête (épinglé), fond « nuit » (fixe), point sous les doigts. */
  const avant = await o.page.evaluate(() => { const r = (q) => { const e = document.querySelector(q); if (!e) return null; const b = e.getBoundingClientRect(); return [b.left, b.top, b.width, b.height]; };
    const e = document.elementFromPoint(150, 300); return { tete: r(".vf > .ld-header"), nuit: r(".vf-nuit"), sous: e ? e.tagName + "." + (e.className || "").toString().split(" ")[0] : "" }; });
  await pincerEn(o, 196, 420, 30, 75); /* ×2,5 autour du centre */
  const e = await etatLoupe(o.page);
  const apres = await o.page.evaluate(() => { const r = (q) => { const e = document.querySelector(q); if (!e) return null; const b = e.getBoundingClientRect(); return [b.left, b.top, b.width, b.height]; };
    const v = document.querySelector(".vf"), m = new DOMMatrix(getComputedStyle(v).transform), s = m.a;
    /* (x, y) vu sans loupe → (s·x + tx, s·y + ty) : on retrouve t à partir de la place de .vf. */
    return { tete: r(".vf > .ld-header"), nuit: r(".vf-nuit"), s }; });
  /* t déduit du fond « nuit » (fixe en 0, 0 sans loupe) : il doit être agrandi de s et placé en (tx, ty). */
  const s1 = apres.s, tx = apres.nuit ? apres.nuit[0] : 0, ty = apres.nuit ? apres.nuit[1] : 0;
  const attendu = (r) => r && [s1 * r[0] + tx, s1 * r[1] + ty, s1 * r[2], s1 * r[3]];
  const ecartR = (a, b) => (a && b ? Math.max(...a.map((x, i) => Math.abs(x - b[i]))) : 0);
  const sous = await o.page.evaluate(([x, y]) => { const e = document.elementFromPoint(x, y); return e ? e.tagName + "." + (e.className || "").toString().split(" ")[0] : ""; }, [s1 * 150 + tx, s1 * 300 + ty]);
  const centre = [(196 - tx) / s1, (420 - ty) / s1];
  ok(e.loupe && Math.abs(e.vv - 1) < 0.01 && s1 > 2.3 && s1 < 2.7 && ecartR(apres.nuit, attendu(avant.nuit)) < 1.5 && ecartR(apres.tete, attendu(avant.tete)) < 1.5 && Math.hypot(centre[0] - 196, centre[1] - 420) < 3 && sous === avant.sous,
    `${nom} : loupe ×${s1.toFixed(2)}, zoom de Safari ×${e.vv.toFixed(2)} ; fond fixe et en-tête à leur place agrandie (écarts ${ecartR(apres.nuit, attendu(avant.nuit)).toFixed(1)} et ${ecartR(apres.tete, attendu(avant.tete)).toFixed(1)} px) ; point sous les doigts resté sous les doigts (${centre.map((x) => x.toFixed(0)).join(", ")}) ; toucher visant « ${sous} » comme avant`);
  ok(!o.erreurs.length, `${nom} : aucune erreur JS` + (o.erreurs.length ? " : " + o.erreurs.join(" / ") : "")); await o.ctx.close();
}
{ // Déplacement d'un doigt, pause des scènes, retour à ×1.
  const o = await ouvrir("apres"); await allerP(o.page, 0.45); await o.page.waitForTimeout(2500);
  await pincerEn(o, 196, 420, 30, 90); const e1 = await etatLoupe(o.page);
  const fig0 = await o.page.evaluate(() => document.querySelector(".vfp-fig").style.transform); /* relevé loupe active (la caméra du projecteur a pu finir de se poser avant) */
  const nuit1 = await o.page.evaluate(() => { const b = document.querySelector(".vf-nuit").getBoundingClientRect(); return [b.left, b.top]; });
  await glisserDoigt(o, 200, 600, -60, -160); await o.page.waitForTimeout(800);
  const e2 = await etatLoupe(o.page), nuit2 = await o.page.evaluate(() => { const b = document.querySelector(".vf-nuit").getBoundingClientRect(); return [b.left, b.top, b.right, b.bottom]; });
  ok(e2.loupe && Math.abs(e2.y - e1.y) < 1 && nuit2[1] < nuit1[1] - 100 && nuit2[0] <= 0.5 && nuit2[1] <= 0.5 && nuit2[2] >= 392.5 && nuit2[3] >= 851.5,
    `Glissé d'un doigt agrandi : vue déplacée (${(nuit2[0] - nuit1[0]).toFixed(0)}, ${(nuit2[1] - nuit1[1]).toFixed(0)} px, élan compris), page non défilée (${e1.y} → ${e2.y}), l'écran agrandi couvre toujours l'écran`);
  await o.page.evaluate(() => window.dispatchEvent(new Event("scroll"))); await o.page.waitForTimeout(500);
  const fig1 = await o.page.evaluate(() => document.querySelector(".vfp-fig").style.transform);
  ok(fig1 === fig0, `Scènes en pause pendant la loupe (silhouette de Loan inchangée)`);
  await pincerEn(o, 196, 420, 120, 20); await o.page.waitForTimeout(500); const e3 = await etatLoupe(o.page);
  await o.page.evaluate(() => window.scrollBy(0, 300)); await o.page.waitForTimeout(1500);
  const fig2 = await o.page.evaluate(() => document.querySelector(".vfp-fig").style.transform), y3 = await o.page.evaluate(() => scrollY);
  ok(!e3.loupe && e3.s === 1 && fig2 !== fig0 && y3 > e1.y, `Pincement inverse : retour à ×1 (loupe ${e3.loupe ? "active" : "finie"}), page de nouveau défilable et animée (silhouette déplacée au défilement)`);
  ok(!o.erreurs.length, "Aucune erreur JS" + (o.erreurs.length ? " : " + o.erreurs.join(" / ") : "")); await o.ctx.close();
}
{ // Un seul doigt sans loupe : défilement normal, pas de loupe.
  const o = await ouvrir("apres"); const y0 = await o.page.evaluate(() => scrollY); await glisserDoigt(o, 196, 700, 0, -400); const e = await etatLoupe(o.page);
  ok(!e.loupe && e.y > y0 + 200, `Un doigt sans loupe : la page défile (${Math.round(e.y - y0)} px), pas de loupe`); await o.ctx.close();
}
{ // Ordinateur : rien ne change (pas d'écran tactile).
  const o = await ouvrir("apres", "/", BUREAU); const r = await o.page.evaluate(() => ({ ta: getComputedStyle(document.body).touchAction, l: document.documentElement.classList.contains("vf-loupe") }));
  ok(r.ta === "auto" && !r.l, `Ordinateur : touch-action « ${r.ta} », pas de loupe`); await o.ctx.close();
}
for (const chemin of ["/CGV.dc.html", "/Privacy.dc.html", "/Legal.dc.html", "/Sponsors.dc.html"]) {
  const o = await ouvrir("apres", chemin); const sc = await pincer(o); ok(sc > 1.5 && !o.erreurs.length, `${chemin} : zoom de Safari gardé (×${sc.toFixed(2)}), aucune erreur JS`); await o.ctx.close();
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
// Loupe ×2,5 (format iPhone) : l'image agrandie doit être celle de l'écran d'origine, agrandie autour des doigts (centre de
// l'écran). On compare la FORME (niveaux de gris floutés de 3 px, écart > 24/255) entre la capture pendant la loupe et la capture
// sans loupe, découpée et agrandie de 2,5 (la loupe agrandit l'image : grain et netteté diffèrent, pas la forme).
const ZPOSES = [["P0", (p) => allerP(p, 0)], ["P0,75", (p) => allerP(p, 0.75)], ["étude 0,6", (p) => allerEl(p, "#analysis", 0.6)], ["étude 8", (p) => allerEl(p, "#analysis", 8)], ["cartes", (p) => allerEl(p, ".vfk", 1.2)]];
const agrandir = (fichier, cx, cy, k, sortie) => { const A = PNG.sync.read(fs.readFileSync(fichier)), W = A.width, H = A.height, B = new PNG({ width: W, height: H }), x0 = cx - cx / k, y0 = cy - cy / k;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const sx = Math.min(W - 1.001, x0 + x / k), sy = Math.min(H - 1.001, y0 + y / k), ix = Math.floor(sx), iy = Math.floor(sy), fx = sx - ix, fy = sy - iy;
    for (let c = 0; c < 4; c++) { const v = (1 - fx) * (1 - fy) * A.data[4 * (iy * W + ix) + c] + fx * (1 - fy) * A.data[4 * (iy * W + ix + 1) + c] + (1 - fx) * fy * A.data[4 * ((iy + 1) * W + ix) + c] + fx * fy * A.data[4 * ((iy + 1) * W + ix + 1) + c]; B.data[4 * (y * W + x) + c] = v; } }
  fs.writeFileSync(sortie, PNG.sync.write(B)); return sortie; };
const forme = (a, b) => { const A = PNG.sync.read(fs.readFileSync(a)), B = PNG.sync.read(fs.readFileSync(b)), W = A.width, H = A.height;
  const gris = (P) => { let g = new Float32Array(W * H); for (let i = 0; i < W * H; i++) g[i] = 0.299 * P.data[4 * i] + 0.587 * P.data[4 * i + 1] + 0.114 * P.data[4 * i + 2];
    for (let passe = 0; passe < 2; passe++) { const h = new Float32Array(W * H), v = new Float32Array(W * H), r = 3;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let s = 0, n = 0; for (let k = -r; k <= r; k++) { const xx = x + k; if (xx >= 0 && xx < W) { s += g[y * W + xx]; n++; } } h[y * W + x] = s / n; }
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let s = 0, n = 0; for (let k = -r; k <= r; k++) { const yy = y + k; if (yy >= 0 && yy < H) { s += h[yy * W + x]; n++; } } v[y * W + x] = s / n; }
      g = v; } return g; };
  const ga = gris(A), gb = gris(B); let n = 0; for (let i = 0; i < W * H; i++) if (Math.abs(ga[i] - gb[i]) > 24) n++; return +(100 * n / (W * H)).toFixed(2); };
{ const err = [];
  for (const [nom, aller] of ZPOSES) { const o = await ouvrir("apres", "/", MOBILE, { polices: false }); await o.page.waitForTimeout(3000); await aller(o.page); await o.page.waitForTimeout(/^étude/.test(nom) ? 4500 : 3500);
    const figer = () => o.page.evaluate(() => { document.getAnimations().forEach((a) => { try { a.pause(); a.currentTime = 6000; } catch (e) {} }); document.querySelectorAll("canvas").forEach((c) => (c.style.visibility = "hidden")); });
    await figer(); await o.page.waitForTimeout(400); const fa = path.join(MESURES, `loupe-sans-${nom.replace(/[ ,]/g, "_")}.png`); await o.page.screenshot({ path: fa });
    await o.page.evaluate(() => document.getAnimations().forEach((a) => { try { a.play(); } catch (e) {} }));
    await pincerEn(o, 196, 426, 30, 75); await figer(); await o.page.waitForTimeout(600);
    const s1 = await o.page.evaluate(() => new DOMMatrix(getComputedStyle(document.querySelector(".vf")).transform).a);
    const fb = path.join(MESURES, `loupe-avec-${nom.replace(/[ ,]/g, "_")}.png`); await o.page.screenshot({ path: fb });
    const fr = agrandir(fa, 196 * 3, 426 * 3, s1, path.join(MESURES, `loupe-attendu-${nom.replace(/[ ,]/g, "_")}.png`));
    const f = forme(fr, fb); ok(f <= 2.5, `Loupe ×${s1.toFixed(2)}, ${nom} : forme de l'image agrandie ${f} % de pixels différents de l'écran d'origine agrandi`);
    err.push(...o.erreurs); await o.ctx.close(); }
  ok(!err.length, "Loupe : aucune erreur JS" + (err.length ? " : " + err.join(" / ") : "")); }
}
// ——— 5. Calques ———
// Modèle de WebKit iOS (GraphicsLayerCA) : calque de moins de 1 280 px CSS × zoom → une image entière, l × h × (3 × zoom)² × 4
// octets ; au-delà, tuiles sur la partie visible (agrandie si le calque est réduit par une transformation), 156 Mo au plus.
// « zoom » = zoom de Safari (visualViewport.scale) : la loupe ne le change pas.
const memoire = (w, h, r, vis, z) => { if (!w || !h) return 0; let inter = (vis[2] - vis[0]) * (vis[3] - vis[1]), sx = 1, sy = 1;
  if (r) { const ix = Math.min(r[2], vis[2]) - Math.max(r[0], vis[0]), iy = Math.min(r[3], vis[3]) - Math.max(r[1], vis[1]); if (ix <= 0 || iy <= 0) return 0;
    inter = ix * iy; sx = Math.max(0.05, (r[2] - r[0]) / w); sy = Math.max(0.05, (r[3] - r[1]) / h); }
  if (Math.max(w, h) * z <= 1280) return w * h * 36 * z * z;
  return Math.min(156 * 1048576, Math.min(w * h, 1.2 * inter / (sx * sy)) * 36 * z * z); };
if (section(5)) {
console.log("\n5. Mémoire estimée (Chromium, iPhone, modèle de WebKit iOS) : zoom de Safari ×2,5 (version d'origine) contre loupe ×2,5");
const POS = [["haut", (p) => allerP(p, 0)], ["P0,75", (p) => allerP(p, 0.75)], ["étude 0,6", (p) => allerEl(p, "#analysis", 0.6)], ["étude 8", (p) => allerEl(p, "#analysis", 8)], ["cartes", (p) => allerEl(p, ".vfk", 1.2)]];
const calques = async (version, mode) => { const res = {};
  for (const [nom, aller] of POS) { const o = await ouvrir(version); await o.page.waitForTimeout(2000); let L = [];
    o.cdp.on("LayerTree.layerTreeDidChange", (e) => { if (e.layers) L = e.layers; }); await o.cdp.send("LayerTree.enable"); await o.cdp.send("DOM.enable");
    await aller(o.page); await o.page.waitForTimeout(/^étude/.test(nom) ? 4000 : 1500);
    if (mode === "zoom") await zoomer(o, 2.5); else if (mode === "loupe") await pincerEn(o, 196, 420, 30, 75);
    await o.page.waitForTimeout(1500);
    const z = await echelle(o.page), vis = await o.page.evaluate(() => { const v = visualViewport; return [v.offsetLeft, v.offsetTop, v.offsetLeft + v.width, v.offsetTop + v.height]; });
    let mo = 0, n = 0;
    for (const l of L.filter((l) => l.drawsContent)) { let r = null;
      if (l.backendNodeId) try { const { object } = await o.cdp.send("DOM.resolveNode", { backendNodeId: l.backendNodeId });
        const { result } = await o.cdp.send("Runtime.callFunctionOn", { objectId: object.objectId, returnByValue: true, functionDeclaration: "function(){ const e = this.nodeType === 1 ? this : this.parentElement; if (e === document.documentElement || e === document.body) return null; const b = e.getBoundingClientRect(); return [b.left, b.top, b.right, b.bottom, e.tagName]; }" });
        r = result.value || null; } catch (e) {}
      /* Pendant la loupe, les rectangles mesurés sont agrandis : on les ramène à l'écran d'origine pour le modèle. */
      const m = memoire(l.width, l.height, r, mode === "loupe" ? [0, 0, 393, 852] : vis, r && r[4] === "CANVAS" ? 1 : z); if (m > 0) { mo += m; n++; } }
    res[nom] = { n, mo: Math.round(mo / 1048576), z }; await o.ctx.close(); }
  return res; };
const r0 = await calques("avant", "sans"), r1 = await calques("avant", "zoom"), r2 = await calques("apres", "sans"), r3 = await calques("apres", "loupe");
for (const nom in r0) console.log(`  ${nom.padEnd(10)} origine sans zoom ${String(r0[nom].mo).padStart(4)} Mo | origine, zoom de Safari ×${r1[nom].z.toFixed(1)} : ${String(r1[nom].mo).padStart(4)} Mo | nouvelle sans zoom ${String(r2[nom].mo).padStart(4)} Mo | nouvelle, loupe ×2,5 (Safari ×${r3[nom].z.toFixed(1)}) : ${String(r3[nom].mo).padStart(4)} Mo`);
}

console.log(echecs ? `\n${echecs} contrôle(s) en échec.` : "\nTous les contrôles passent.");
await nav.close(); process.exit(echecs ? 1 : 0);
