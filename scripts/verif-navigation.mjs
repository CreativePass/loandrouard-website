// Contrôles des corrections du 21/11 (scripts/safari.mjs) : « glisse » (défilement doux), « inclinaison » (cartes au survol),
// « images » (images tenues pendant leur téléchargement, redemandées sans « ? » si elles échouent). Chromium seulement : la courbe attendue est celle de Chrome, que la page reproduit.
// Usage : npm run construire && node scripts/verif-navigation.mjs [dossier construit, défaut public]
import fs from "node:fs"; import http from "node:http"; import path from "node:path";
import { chromium } from "playwright-core";
const T = { html: "text/html", js: "text/javascript", css: "text/css", svg: "image/svg+xml", png: "image/png", webp: "image/webp", jpg: "image/jpeg", woff2: "font/woff2", ico: "image/x-icon" };
const demandes = [];
const serve = (dos) => new Promise((ok) => { const s = http.createServer((q, r) => { demandes.push(q.url); let p = decodeURIComponent(new URL(q.url, "http://x").pathname); if (p === "/") p = "/index.html"; const f = path.join(dos, p); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200, { "content-type": T[path.extname(f).slice(1)] || "application/octet-stream" }); fs.createReadStream(f).pipe(r); }); s.listen(0, "127.0.0.1", () => ok(`http://127.0.0.1:${s.address().port}`)); });
const base = await serve(path.resolve(process.argv[2] || "public"));
const nav = await chromium.launch();
let echecs = 0; const verdict = (ok, txt) => { if (!ok) echecs++; console.log(`  ${ok ? "ok " : "ÉCHEC"} ${txt}`); };
const ouvrir = async (opts, avant) => { const ctx = await nav.newContext(opts), page = await ctx.newPage(), erreurs = [];
  page.on("pageerror", (e) => erreurs.push(e.message));
  await page.route(/fonts\.googleapis|fonts\.gstatic|stripe|cloudflareinsights|loan-api/, (r) => r.abort());
  if (avant) await avant(page);
  await page.goto(base + "/"); await page.waitForFunction(() => !document.getElementById("ld-chargement"), null, { timeout: 60000 }).catch(() => {}); await page.waitForTimeout(1500);
  return { ctx, page, erreurs }; };
/* Position de la page à chaque image pendant fn() (durée d) : [[t ms, y], …] */
const suivre = (page, d, fn) => page.evaluate(async ([d, fn]) => { const out = [], t0 = performance.now();
  await new Promise((fin) => { const pas = (now) => { setTimeout(() => out.push([Math.round(now - t0), Math.round(scrollY)]), 0); if (now - t0 < d) requestAnimationFrame(pas); else setTimeout(fin, 0); }; /* lu après toutes les fonctions de l'image */ requestAnimationFrame(pas); (0, eval)(fn)(); });
  return out; }, [d, fn]);

// 1) Défilement doux : sommaire (ordinateur), durée √distance / 60 s et courbe ease-in-out, arrêt par la molette.
console.log("Défilement doux (ordinateur 1440 × 900)");
{ const { ctx, page, erreurs } = await ouvrir({ viewport: { width: 1440, height: 900 } });
  const liens = await page.evaluate(() => [...document.querySelectorAll(".vf-sommaire a")].map((a) => a.getAttribute("href")));
  console.log("  liens du sommaire :", liens.join(" "));
  const cible = liens.find((h) => h === "#formules") || liens[liens.length - 1];
  const pts = await suivre(page, 4500, `() => document.querySelector('.vf-sommaire a[href="${cible}"]').click()`);
  const y0 = pts[0][1], y1 = pts[pts.length - 1][1], d = y1 - y0, Tatt = Math.min(Math.sqrt(Math.abs(d)), 90) / 60 * 1000;
  const debut = pts.find((p) => p[1] !== y0), fin = pts.find((p) => Math.abs(p[1] - y1) <= 3); /* ≤ 3 px : verrou des cartes */
  /* Les images de la machine de mesure (sans carte graphique) peuvent être espacées de 100 à 170 ms : la fin se situe entre la
     dernière image avant l'arrivée et la première image à l'arrivée. */
  const t0 = debut ? debut[0] - 17 : 0, avantFin = pts.filter((p) => p[0] < fin[0] && Math.abs(p[1] - y1) > 3).pop()[0] - t0, aFin = fin[0] - t0;
  if (process.env.DETAIL) console.log(JSON.stringify(pts));
  verdict(Math.abs(d) > 2000, `parcours de ${d} px`);
  verdict(avantFin <= Tatt + 60 && aFin >= Tatt - 60, `durée entre ${avantFin} et ${aFin} ms (attendue ≈ ${Math.round(Tatt)} ms, comme Chrome : √distance / 60 s, 1,5 s au plus)`);
  /* Courbe de Chrome mesurée le 21/11 (page simple, défilement natif) : cubic-bezier(.42, 0, 0, 1), écart moyen 0,4 %. */
  const chrome = (x) => { let lo = 0, hi = 1, t = x; for (let i = 0; i < 40; i++) { t = (lo + hi) / 2; const u = 1 - t; if (3 * u * u * t * 0.42 + t * t * t < x) lo = t; else hi = t; } const u = 1 - t; return 3 * u * t * t + t * t * t; };
  let ecartMax = 0; for (const p of pts) { const ft = (p[0] - t0) / Tatt; if (ft <= 0.03 || ft >= 1) continue; ecartMax = Math.max(ecartMax, Math.abs((p[1] - y0) / d - chrome(ft))); }
  verdict(ecartMax < 0.08, `courbe de Chrome suivie à chaque image (écart maximal ${Math.round(ecartMax * 100)} % du trajet, images espacées de 17 à 170 ms ici)`);
  let recul = 0; for (let i = 1; i < pts.length; i++) if ((pts[i][1] - pts[i - 1][1]) * Math.sign(d) < -3) recul++; /* ≤ 3 px : verrou du retournement des cartes (cible du sommaire 2 px après lui) */
  verdict(recul === 0, `aucun retour en arrière de plus de 3 px (${recul}${recul ? " : " + pts.filter((p, i) => i && (p[1] - pts[i - 1][1]) * Math.sign(d) < -3).map((p) => p.join("/")).join(" ") : ""})`);
  // Arrêt par la molette
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; scrollTo(0, 0); document.documentElement.style.scrollBehavior = ""; }); await page.waitForTimeout(800);
  await page.evaluate((c) => document.querySelector(`.vf-sommaire a[href="${c}"]`).click(), cible); await page.waitForTimeout(600);
  await page.mouse.move(700, 450); await page.mouse.wheel(0, 1); const yA = await page.evaluate(() => scrollY); await page.waitForTimeout(700); const yB = await page.evaluate(() => scrollY);
  verdict(Math.abs(yB - yA) < 40 && yB < y1 - 200, `molette pendant le glissé : arrêt (${yA} → ${yB})`);
  // Lien interne « move by move »
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; scrollTo(0, 0); document.documentElement.style.scrollBehavior = ""; }); await page.waitForTimeout(800);
  const p2 = await suivre(page, 2500, `() => { const a = document.querySelector('a[href="#analysis"]'); a && a.click(); }`);
  const att = await page.evaluate(() => Math.round(document.getElementById("analysis").getBoundingClientRect().top + scrollY));
  const n2 = new Set(p2.map((p) => p[1])).size;
  verdict(Math.abs(p2[p2.length - 1][1] - att) < 3 && n2 > 10, `lien « move by move » : arrivée ${p2[p2.length - 1][1]} (attendu ${att}), ${n2} positions intermédiaires, adresse ${await page.evaluate(() => location.hash)}`);
  verdict(!erreurs.length, `aucune erreur JS ${erreurs.join(" | ")}`);
  await ctx.close(); }

// 2) Inclinaison des cartes (ordinateur) : angle atteint, sans aller-retour, retour à plat.
console.log("Inclinaison des cartes (ordinateur 1440 × 900)");
{ const { ctx, page, erreurs } = await ouvrir({ viewport: { width: 1440, height: 900 } });
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; scrollTo(0, 1e6); }); await page.waitForTimeout(500);
  await page.evaluate(() => { const c = document.querySelector(".vfk-c .vf-carte"); c.scrollIntoView({ block: "center" }); }); await page.waitForTimeout(5000);
  const r = await page.evaluate(() => { const b = document.querySelector(".vfk-c .vf-carte").getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; });
  const angles = () => page.evaluate(() => { const c = document.querySelector(".vfk-c .vf-carte"), t = c.style.transform, m = t.match(/rotateY\(([-\d.]+)deg\) rotateX\(([-\d.]+)deg\)/); return m ? [+m[1], +m[2], t] : [0, 0, t]; });
  await page.mouse.move(r.x + r.w / 2, r.y + r.h / 2); await page.waitForTimeout(100);
  const serie = [];
  for (let i = 0; i <= 20; i++) { await page.mouse.move(r.x + r.w / 2 + (r.w * 0.45) * i / 20, r.y + r.h / 2 - (r.h * 0.45) * i / 20); serie.push((await angles())[0]); }
  await page.waitForTimeout(400); const [ry, rx] = await angles();
  verdict(Math.abs(ry - 0.45 * 9) < 0.3 && Math.abs(rx - 0.45 * 9) < 0.3, `coin haut droit : rotateY ${ry}°, rotateX ${rx}° (attendu ≈ ±4,05°)`);
  let osc = 0; for (let i = 2; i < serie.length; i++) if ((serie[i] - serie[i - 1]) * (serie[i - 1] - serie[i - 2]) < -1e-4) osc++;
  verdict(osc === 0, `aucun aller-retour pendant le mouvement (${osc}) ; angles : ${serie.map((v) => v.toFixed(1)).join(" ")}`);
  await page.mouse.move(5, 5); await page.waitForTimeout(900);
  const [, , t] = await angles(), tr = await page.evaluate(() => document.querySelector(".vfk-c .vf-carte").style.transition);
  verdict(t === "", `revenue à plat (transform « ${t} »), transition « ${tr} »`);
  verdict(!erreurs.length, `aucune erreur JS ${erreurs.join(" | ")}`);
  await ctx.close(); }

// 3) Images : premier téléchargement en échec (étude, halo de Loan au projecteur, yin-yang différé) → cachée pendant le nouvel
//    essai (jamais de « ? »), puis affichée ; sans échec : chaque image téléchargée une seule fois (les gardiens n'ajoutent rien).
console.log("Images (premier téléchargement en échec)");
for (const [nom, motif, aller] of [["étude", /etude-croquis-v5\.webp/, null], ["halo du projecteur", /vf-spot-bloom\.webp/, null],
  ["yin-yang (différé)", /yin-yang-noir\.png/, "() => { const a = document.getElementById('analysis'); document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, a.getBoundingClientRect().top + scrollY + 1.5 * innerHeight); }"]]) {
  const { ctx, page, erreurs } = await ouvrir({ viewport: { width: 1440, height: 900 } }, async (page) => {
    let n = 0; await page.route(motif, (r) => (n++ === 0 ? r.abort("failed") : r.continue())); });
  if (aller) { await page.evaluate(`(${aller})()`); }
  const vus = await page.evaluate(async (src) => { const vus = new Set(), t0 = performance.now(); /* état visible de l'image pendant 3 s */
    await new Promise((fin) => { const pas = () => { for (const i of document.images) if (i.getAttribute("src") && new RegExp(src).test(i.getAttribute("src"))) {
        let op = 1; for (let a = i; a && a !== document.documentElement; a = a.parentElement) op *= +getComputedStyle(a).opacity; /* transparente (yin-yang avant la bascule) : rien à l'écran */
        const casse = i.complete && i.naturalWidth === 0, cache = getComputedStyle(i).visibility === "hidden" || op < 0.01;
        vus.add(casse ? (cache ? "en échec, cachée" : "EN ÉCHEC VISIBLE") : i.complete ? "affichée" : "en cours"); }
      if (performance.now() - t0 < 3000) requestAnimationFrame(pas); else fin(); }; pas(); });
    return [...vus]; }, motif.source);
  const etat = await page.evaluate((src) => [...document.images].filter((i) => new RegExp(src).test(i.getAttribute("src") || "")).map((i) => [i.getAttribute("src"), i.complete && i.naturalWidth > 0, getComputedStyle(i).visibility, i.hasAttribute("data-ld-reessai")]), motif.source);
  verdict(etat.length && etat.every(([, ok, v, r]) => ok && !r) && !vus.includes("EN ÉCHEC VISIBLE"), `${nom} : ${JSON.stringify(etat)} ; états vus : ${vus.join(", ")}`);
  verdict(!erreurs.length, `${nom} : aucune erreur JS ${erreurs.join(" | ")}`);
  await ctx.close(); }
{ demandes.length = 0;
  const { ctx, page, erreurs } = await ouvrir({ viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true });
  await page.waitForTimeout(2500);
  const img = demandes.filter((u) => /\.(webp|png|jpg|svg)(\?|$)/.test(u)), double = img.filter((u, i) => img.indexOf(u) !== i);
  verdict(!double.length, `sans échec : ${img.length} images téléchargées, aucune en double ${double.join(" ")}`);
  verdict(!erreurs.length, `aucune erreur JS ${erreurs.join(" | ")}`);
  await ctx.close(); }

await nav.close();
console.log(echecs ? `\n${echecs} échec(s)` : "\nTout est conforme.");
process.exit(echecs ? 1 : 0);
