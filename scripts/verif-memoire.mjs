// Budget de mémoire graphique de la page d'accueil sur iPhone (22/11, demande de Loan : « une solution stable, applicable à toute
// sorte de scénario »). Garde-fou à lancer avant chaque mise en ligne : la mémoire des calques est estimée sur TOUTE la page (un
// endroit tous les demi-écrans, au repos), puis image par image pendant les gestes qui ont fait planter l'iPhone (vitrine
// « See pricing » puis « See full details », descente rapide jusqu'aux cartes, remontée rapide des cartes vers l'étude). Le
// script échoue si un endroit ou un instant dépasse le budget (BUDGET, en Mo) : une nouvelle page ou un nouvel effet trop lourd
// est vu avant d'arriver sur l'iPhone, au lieu d'un plantage de plus.
// Modèle (Chromium au format iPhone 393 × 852, ×3, navigateur présenté comme un iPhone) :
//  - calques selon les règles de WebKit (3D, will-change, filtre, fixe / épinglé, animation, toile ; voir verif-calques-webkit.mjs) ;
//  - seuls les calques qui DESSINENT comptent : un conteneur sans fond ni contenu propre n'a pas d'image dans Safari (mesure faite
//    dans Safari le 08/10 : « les conteneurs div.vfp-*.vfp-compact occupent 0 o ») ; un élément non composité dessine dans le
//    calque composité le plus proche au-dessus de lui ; un pseudo-élément composité est un calque à sa propre taille ;
//  - mémoire : l × h × 3² × 4 octets (une seule image ; Safari en garde une 2e pendant qu'un calque se redessine), partie visible.
//  Ce n'est pas une mesure de Safari : c'est une estimation stable qui permet de comparer deux versions et de voir un pic.
//  Ordre de grandeur (22/11, après « finesse » et « nuitcompacte ») : 24 à 104 Mo au repos, ≈ 105 Mo au plus pendant les gestes.
// Usage : npm run construire && node scripts/verif-memoire.mjs [dossier construit, défaut public]   (BUDGET=130 par défaut)
import fs from "node:fs"; import http from "node:http"; import path from "node:path";
import { chromium } from "playwright-core";
const T = { html: "text/html", js: "text/javascript", css: "text/css", svg: "image/svg+xml", png: "image/png", webp: "image/webp", jpg: "image/jpeg", woff2: "font/woff2", ico: "image/x-icon" };
const serve = (dos) => new Promise((ok) => { const s = http.createServer((q, r) => { let p = decodeURIComponent(new URL(q.url, "http://x").pathname); if (p === "/") p = "/index.html"; const f = path.join(dos, p); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200, { "content-type": T[path.extname(f).slice(1)] || "application/octet-stream" }); fs.createReadStream(f).pipe(r); }); s.listen(0, "127.0.0.1", () => ok(`http://127.0.0.1:${s.address().port}`)); });
const dos = path.resolve(process.argv[2] || "public"), base = await serve(dos), BUDGET = +(process.env.BUDGET || 130);
const UA_IOS = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";

/* Exécuté dans la page : calques qui dessinent, partie visible. */
const mesure = () => {
  const v = visualViewport, vis = [v.offsetLeft, v.offsetTop, v.offsetLeft + v.width, v.offsetTop + v.height];
  const css = new Map(), raisons = new Map(), cache = new Map(), pseudos = [];
  const cs = (e) => { let c = css.get(e); if (!c) { c = getComputedStyle(e); css.set(e, c); } return c; };
  const tous = [...document.querySelectorAll(".vf, .vf *, footer, footer *")];
  const cache0 = (e) => { if (cache.has(e)) return cache.get(e); const c = cs(e); let r = c.display === "none" || c.visibility === "hidden" || +c.opacity < 0.001;
    if (!r && e.parentElement && e.parentElement !== document.body && e.parentElement !== document.documentElement) { const p = e.parentElement, pc = cs(p); if (pc.display === "none" || +pc.opacity < 0.001) r = true; else if (cache.has(p) && cache.get(p) && c.visibility !== "visible") r = true; }
    cache.set(e, r); return r; };
  const troisD = (e, c) => /matrix3d|perspective/.test(c.transform) || /3d\(|translateZ|rotate[XY]|perspective\(/.test(e.style ? e.style.transform : "");
  for (const e of tous) {
    if (cache0(e)) continue; const c = cs(e), r = [];
    if (c.filter && c.filter !== "none") r.push("filtre");
    if (c.position === "fixed" || c.position === "sticky") r.push(c.position === "fixed" ? "fixe" : "épinglé");
    if (/transform|opacity|filter|translate|scale|rotate/.test(c.willChange)) r.push("will-change");
    if (troisD(e, c)) r.push("3D");
    if (c.transformStyle === "preserve-3d" || (e.parentElement && cs(e.parentElement).transformStyle === "preserve-3d" && c.transform !== "none")) r.push("contexte 3D");
    if (e.tagName === "CANVAS") r.push("toile");
    if (e.getAnimations) for (const a of e.getAnimations()) { if (a.playState !== "running" || !a.effect || !a.effect.getKeyframes) continue;
      if (a.effect.getKeyframes().some((k) => "transform" in k || "opacity" in k || "filter" in k)) { r.push("animation"); break; } }
    if (r.length) raisons.set(e, r);
  }
  const propre = (e) => { const c = cs(e); if (c.visibility === "hidden") return false;
    if (/^(IMG|CANVAS|VIDEO|svg|IFRAME)$/.test(e.tagName)) return true;
    if (e instanceof SVGElement) return false;
    if (c.backgroundImage !== "none" || !/rgba\(0, 0, 0, 0\)|transparent/.test(c.backgroundColor)) return true;
    if (c.boxShadow !== "none" || (parseFloat(c.borderTopWidth) + parseFloat(c.borderBottomWidth) + parseFloat(c.borderLeftWidth) + parseFloat(c.borderRightWidth) > 0 && !/rgba\(0, 0, 0, 0\)/.test(c.borderTopColor))) return true;
    for (const n of e.childNodes) if (n.nodeType === 3 && n.textContent.trim()) return true;
    let r = false;
    for (const p of ["::before", "::after"]) { const pc = getComputedStyle(e, p);
      if (!pc.content || pc.content === "none" || pc.content === "normal") continue;
      if (!(pc.backgroundImage !== "none" || !/rgba\(0, 0, 0, 0\)/.test(pc.backgroundColor) || pc.content.length > 2 || pc.borderTopWidth !== "0px" || pc.boxShadow !== "none")) continue;
      if (/transform|opacity|filter/.test(pc.willChange) || /matrix3d/.test(pc.transform) || (pc.filter && pc.filter !== "none")) { pseudos.push({ e, p, w: parseFloat(pc.width) || 0, h: parseFloat(pc.height) || 0 }); continue; }
      r = true; }
    return r; };
  const dessine = new Set();
  for (const e of tous) { if (cache0(e) || !propre(e)) continue;
    for (let a = e; a; a = a.parentElement) { if (raisons.has(a)) { dessine.add(a); break; } if (a.matches && a.matches(".vf, footer")) break; } }
  const res = [];
  const opacite = (e) => { let op = 1; for (let a = e; a && a !== document.documentElement; a = a.parentElement) op *= +cs(a).opacity; return op; };
  for (const [e, r] of raisons) {
    if (!dessine.has(e) || (opacite(e) < 0.001 && !r.includes("toile"))) continue;
    const b = e.getBoundingClientRect(), w = e.offsetWidth || e.clientWidth || (e.getBBox ? e.getBBox().width : 0), h = e.offsetHeight || e.clientHeight || (e.getBBox ? e.getBBox().height : 0);
    if (!w || !h) continue;
    const ix = Math.min(b.right, vis[2]) - Math.max(b.left, vis[0]), iy = Math.min(b.bottom, vis[3]) - Math.max(b.top, vis[1]); if (ix <= 0 || iy <= 0) continue;
    const sx = Math.max(0.05, b.width / w), sy = Math.max(0.05, b.height / h);
    const dpr = e.tagName === "CANVAS" ? Math.sqrt((e.width * e.height) / Math.max(1, w * h)) : 3, k = dpr * dpr * 4;
    const mo = (Math.max(w, h) <= 1280 ? w * h * k : Math.min(156 * 1048576, Math.min(w * h, 1.2 * ix * iy / (sx * sy)) * k)) / 1048576;
    res.push({ n: e.tagName.toLowerCase() + (typeof e.className === "string" && e.className ? "." + e.className.trim().split(/\s+/).slice(0, 2).join(".") : ""), w: Math.round(w), h: Math.round(h), mo });
  }
  for (const x of pseudos) { const b = x.e.getBoundingClientRect(); if (b.bottom < vis[1] || b.top > vis[3] || cache0(x.e) || opacite(x.e) < 0.001) continue;
    res.push({ n: x.e.tagName.toLowerCase() + x.p, w: Math.round(x.w), h: Math.round(x.h), mo: x.w * x.h * 36 / 1048576 }); }
  return { y: Math.round(scrollY), tot: res.reduce((s, x) => s + x.mo, 0), res };
};

const nav = await chromium.launch();
const ouvrir = async () => {
  const ctx = await nav.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: UA_IOS });
  const page = await ctx.newPage(), erreurs = [];
  page.on("pageerror", (e) => erreurs.push(e.message));
  await page.route(/fonts\.googleapis|fonts\.gstatic|stripe|cloudflareinsights|loan-api/, (r) => r.abort());
  await page.goto(base + "/?nodiag=1"); await page.waitForFunction(() => !document.getElementById("ld-chargement"), null, { timeout: 60000 }).catch(() => {}); await page.waitForTimeout(3000);
  await page.evaluate(`window.__mesure = ${mesure.toString()}; document.documentElement.style.scrollBehavior = "auto";`);
  return { ctx, page, erreurs };
};
const detail = (m) => m.res.sort((a, b) => b.mo - a.mo).slice(0, 6).map((x) => `${x.n.slice(0, 26)} ${x.mo.toFixed(0)}`).join(", ");
let echecs = 0; const pics = [];
const noter = (nom, m) => { pics.push({ nom, m }); if (m.tot > BUDGET) echecs++; };

/* 1. Toute la page au repos, un endroit tous les demi-écrans (fin de page provisoire levée : cartes vues). */
{ const { ctx, page, erreurs } = await ouvrir();
  await page.evaluate(() => scrollTo(0, 1e6)); await page.waitForTimeout(6000);
  const fin = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  let max = { tot: 0 }, n = 0;
  for (let y = 0; y <= fin; y += 426) { await page.evaluate((y) => scrollTo(0, y), y); await page.waitForTimeout(700); const m = await page.evaluate(() => window.__mesure()); n++; if (m.tot > max.tot) max = m; if (m.tot > BUDGET) { echecs++; console.log(`  au repos y = ${m.y} : ${m.tot.toFixed(0)} Mo > ${BUDGET}  (${detail(m)})`); } }
  console.log(`Toute la page au repos (${n} endroits) : au plus ${max.tot.toFixed(0)} Mo à y = ${max.y}  (${detail(max)})`);
  pics.push({ nom: "repos", m: max });
  if (erreurs.length) { echecs++; console.log("  ERREURS JS :", erreurs.join(" | ")); }
  await ctx.close(); }

/* 2. Gestes, mesurés image par image pendant qu'ils se déroulent. */
const suivre = async (page, ms) => { const t0 = Date.now(); let max = { tot: 0 }; while (Date.now() - t0 < ms) { const m = await page.evaluate(() => window.__mesure()); if (m.tot > max.tot) max = m; } return max; };
{ const { ctx, page, erreurs } = await ouvrir();
  await page.evaluate(() => document.querySelector(".vfp-affiche").click()); await page.waitForTimeout(2600);
  const v = await page.evaluate(() => window.__mesure()); noter("vitrine ouverte", v);
  await page.evaluate(() => document.querySelectorAll(".vfp-details")[0].click());
  const d = await suivre(page, 6000); noter("See full details (descente)", d);
  if (erreurs.length) { echecs++; console.log("  ERREURS JS :", erreurs.join(" | ")); }
  await ctx.close(); }
{ const { ctx, page, erreurs } = await ouvrir();
  /* Descente éclair jusqu'aux cartes (≈ 20 écrans/s), puis remontée rapide des cartes vers l'étude (≈ 7 écrans/s, relevé du 22/11). */
  const geste = (y0, y1, ms) => page.evaluate(([y0, y1, ms]) => new Promise((ok) => { const t0 = performance.now(); const pas = () => { const u = Math.min(1, (performance.now() - t0) / ms); scrollTo(0, y0 + (y1 - y0) * u); if (u < 1) requestAnimationFrame(pas); else ok(); }; requestAnimationFrame(pas); }), [y0, y1, ms]);
  const fin = await page.evaluate(() => { const f = document.getElementById("formules"); return f.getBoundingClientRect().top + scrollY; });
  const p1 = suivre(page, 2200); await geste(0, fin, 1200); noter("descente éclair jusqu'aux cartes", await p1);
  await page.waitForTimeout(5000); /* cartes retournées : bas de page débloqué */
  const p2 = suivre(page, 3200); await geste(fin + 400, fin - 9000, 1500); noter("remontée rapide des cartes vers l'étude", await p2);
  if (erreurs.length) { echecs++; console.log("  ERREURS JS :", erreurs.join(" | ")); }
  await ctx.close(); }
for (const { nom, m } of pics.slice(1)) console.log(`${nom} : au plus ${m.tot.toFixed(0)} Mo à y = ${m.y}${m.tot > BUDGET ? `  ← AU-DESSUS DU BUDGET (${BUDGET} Mo)` : ""}  (${detail(m)})`);
await nav.close();
console.log(echecs ? `\n${echecs} dépassement(s) du budget de ${BUDGET} Mo ou erreur(s)` : `\nBudget de ${BUDGET} Mo respecté partout.`);
process.exit(echecs ? 1 : 0);
