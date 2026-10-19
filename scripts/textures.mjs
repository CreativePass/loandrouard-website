// Prototype « lumière en textures » (scripts/safari.mjs, page textures.html de l'adresse de test) :
// calcule, une fois pour toutes, les dégradés de la lumière du projecteur en images PNG, à partir des
// règles CSS EXACTES de l'export (relues dans Video Feedback.dc.html). Le navigateur n'a plus qu'à déplacer
// ces images (transform / opacity) au lieu de redessiner des dégradés masqués à chaque image.
// Usage : node scripts/textures.mjs   → optimise/assets/lumiere/*.png + textures.json (empreintes des règles)
// scripts/safari.mjs vérifie à chaque construction que les règles n'ont pas changé depuis la génération.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { PNG } from "pngjs";

const RACINE = path.resolve(import.meta.dirname, "..");
const SORTIE = path.join(RACINE, "optimise/assets/lumiere");

// Texture → règle CSS d'origine, dimensions de l'élément (px CSS) et de l'image produite.
export const TEXTURES = [
  { nom: "faisceau", regle: ".vfp-faisceau", w: 1000, h: 1000, tw: 512, th: 512 },
  { nom: "faisceau-coeur", regle: ".vfp-faisceau--coeur", herite: ".vfp-faisceau", w: 1000, h: 1000, tw: 512, th: 512 },
  { nom: "faisceau-stries", regle: ".vfp-faisceau--stries", herite: ".vfp-faisceau", w: 1000, h: 1000, tw: 1024, th: 1024 },
  { nom: "rayons", regle: ".vfp-rayons", w: 1200, h: 1200, tw: 1024, th: 1024 },
  { nom: "halo", regle: ".vfp-halo", cercle: true, tw: 512, th: 512 },
  { nom: "brume", regle: ".vfp-brume i", cercle: true, tw: 512, th: 512 },
  { nom: "eclat", regle: ".vfp-eclat", cercle: true, tw: 512, th: 512 },
  { nom: "sol", regle: ".vfp-sol", w: 1000, h: 200, tw: 520, th: 104 },
  { nom: "flaque", regle: ".vfp-flaque", w: 1000, h: 200, tw: 520, th: 104 },
  { nom: "ombre", regle: ".vfp-ombre", w: 1000, h: 200, tw: 520, th: 104 },
];

// --- Lecture des règles de l'export -------------------------------------------------------------
export function lireRegle(html, selecteur) {
  const debut = html.indexOf("\n" + selecteur + " {");
  if (debut < 0) throw new Error(`Règle introuvable : ${selecteur}`);
  const fin = html.indexOf("}\n", debut);
  return html.slice(debut + 1, fin + 1);
}
const decls = (regle) => {
  const corps = regle.slice(regle.indexOf("{") + 1, regle.lastIndexOf("}"));
  const res = {};
  for (const d of decouper(corps, ";")) { const i = d.indexOf(":"); if (i > 0) res[d.slice(0, i).trim()] = d.slice(i + 1).trim(); }
  return res;
};
function decouper(s, sep) {
  const out = []; let prof = 0, cur = "";
  for (const c of s) {
    if (c === "(") prof++; else if (c === ")") prof--;
    if (c === sep && prof === 0) { out.push(cur); cur = ""; } else cur += c;
  }
  if (cur.trim()) out.push(cur);
  return out.map((x) => x.trim()).filter(Boolean);
}

// --- Couleurs et arrêts -------------------------------------------------------------------------
function couleur(s) {
  s = s.trim();
  if (s === "transparent") return [0, 0, 0, 0];
  let m = s.match(/^rgba?\(([^)]*)\)$/);
  if (m) { const p = m[1].split(",").map((x) => parseFloat(x)); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; }
  m = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (m) { let h = m[1]; if (h.length === 3) h = h.split("").map((c) => c + c).join(""); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).concat(1); }
  throw new Error(`Couleur non reconnue : ${s}`);
}
// Arrêts CSS → [{ c: [r,g,b,a], p: 0..1 }] avec les règles de position implicite (CSS Images 3 § 3.5.1).
function arrets(liste, unite) {
  const st = liste.map((s) => {
    s = s.trim();
    const fin = /^rgba?\(/.test(s) ? s.indexOf(")") + 1 : s.search(/\s|$/);
    const c = couleur(s.slice(0, fin)), reste = s.slice(fin).trim();
    let p = null;
    if (reste) {
      const m = reste.match(/^(-?[\d.]+)(%|deg)?$/);
      if (!m || (m[2] === undefined && parseFloat(m[1]) !== 0)) throw new Error(`Position non reconnue : ${s}`);
      if (m[2] && m[2] !== (unite === "deg" ? "deg" : "%")) throw new Error(`Unité inattendue : ${s}`);
      p = parseFloat(m[1]) / (m[2] === "deg" ? 360 : 100);
    }
    return { c, p };
  });
  if (st[0].p === null) st[0].p = 0;
  if (st[st.length - 1].p === null) st[st.length - 1].p = 1;
  for (let i = 1; i < st.length; i++) if (st[i].p !== null && st[i].p < st[i - 1].p) st[i].p = st[i - 1].p;
  for (let i = 1; i < st.length - 1; i++) if (st[i].p === null) {
    let j = i; while (st[j].p === null) j++;
    const a = st[i - 1].p, b = st[j].p;
    for (let k = i; k < j; k++) st[k].p = a + (b - a) * (k - i + 1) / (j - i + 1);
  }
  return st.map((s) => ({ p: s.p, c: [s.c[0] * s.c[3], s.c[1] * s.c[3], s.c[2] * s.c[3], s.c[3]] })); // prémultiplié
}
// Interpolation prémultipliée (comme les navigateurs).
function echantillon(st, t) {
  if (t <= st[0].p) return st[0].c;
  for (let i = 1; i < st.length; i++) if (t <= st[i].p) {
    const a = st[i - 1], b = st[i], u = b.p > a.p ? (t - a.p) / (b.p - a.p) : 1;
    return [0, 1, 2, 3].map((k) => a.c[k] + (b.c[k] - a.c[k]) * u);
  }
  return st[st.length - 1].c;
}

// --- Dégradés → fonction (x, y en px CSS de l'élément) → [r,g,b,a] prémultiplié -----------------
function degrade(val, w, h, cercle) {
  const m = val.match(/^(linear|radial|conic)-gradient\((.*)\)$/s);
  if (!m) throw new Error(`Dégradé non reconnu : ${val}`);
  const parts = decouper(m[2], ",");
  if (m[1] === "linear") {
    let dir = "to bottom";
    if (/^to /.test(parts[0])) dir = parts.shift();
    if (dir !== "to bottom") throw new Error(`Direction non prise en charge : ${dir}`);
    const st = arrets(parts, "%");
    return (x, y) => echantillon(st, y / h);
  }
  if (m[1] === "conic") {
    const tete = parts.shift(), fm = tete.match(/^from\s+(-?[\d.]+)deg(?:\s+at\s+(\S+)\s+(\S+))?$/);
    if (!fm) throw new Error(`Conique non reconnu : ${tete}`);
    const a0 = parseFloat(fm[1]), pos = (v, L) => (v === undefined ? L / 2 : v.endsWith("%") ? parseFloat(v) / 100 * L : v === "0" ? 0 : parseFloat(v));
    const cx = pos(fm[2], w), cy = pos(fm[3], h), st = arrets(parts, "deg");
    return (x, y) => { let ang = Math.atan2(x - cx, -(y - cy)) * 180 / Math.PI - a0; ang = ((ang % 360) + 360) % 360; return echantillon(st, ang / 360); };
  }
  // radial : « closest-side » (ellipse inscrite) ou « circle R at … » (cercle centré sur la texture).
  const tete = parts.shift();
  if (tete === "closest-side") { const st = arrets(parts, "%"); return (x, y) => echantillon(st, Math.hypot((x - w / 2) / (w / 2), (y - h / 2) / (h / 2))); }
  if (cercle && /^circle\s/.test(tete)) { const st = arrets(parts, "%"); return (x, y) => echantillon(st, Math.hypot(x - w / 2, y - h / 2) / (w / 2)); }
  throw new Error(`Radial non pris en charge : ${tete}`);
}

export function definition(html, t) {
  const d = decls(lireRegle(html, t.regle)), base = t.herite ? decls(lireRegle(html, t.herite)) : {};
  const fond = d.background || base.background, masque = d["mask-image"] || base["mask-image"] || null;
  return { fond, masque };
}

function generer(html, t) {
  const { fond, masque } = definition(html, t);
  const w = t.cercle ? 1000 : t.w, h = t.cercle ? 1000 : t.h;
  const F = degrade(fond, w, h, t.cercle), M = masque ? degrade(masque, w, h, t.cercle) : null;
  const png = new PNG({ width: t.tw, height: t.th }), S = 3;
  for (let j = 0; j < t.th; j++) for (let i = 0; i < t.tw; i++) {
    const acc = [0, 0, 0, 0];
    for (let sj = 0; sj < S; sj++) for (let si = 0; si < S; si++) {
      const x = (i + (si + 0.5) / S) / t.tw * w, y = (j + (sj + 0.5) / S) / t.th * h;
      const c = F(x, y), k = M ? M(x, y)[3] : 1;
      for (let q = 0; q < 4; q++) acc[q] += c[q] * k;
    }
    const a = acc[3] / (S * S), o = (j * t.tw + i) * 4;
    for (let q = 0; q < 3; q++) png.data[o + q] = a > 1e-6 ? Math.round(Math.min(255, acc[q] / (S * S) / a)) : 255;
    png.data[o + 3] = Math.round(Math.min(1, a) * 255);
  }
  return PNG.sync.write(png, { colorType: 6 });
}

export const empreinte = (html, t) => { const { fond, masque } = definition(html, t); return crypto.createHash("sha256").update(fond + "|" + (masque || "")).digest("hex").slice(0, 16); };

if (import.meta.url === `file://${process.argv[1]}`) {
  const html = fs.readFileSync(path.join(RACINE, "Video Feedback.dc.html"), "utf8");
  fs.mkdirSync(SORTIE, { recursive: true });
  const manifeste = {};
  for (const t of TEXTURES) {
    const buf = generer(html, t);
    fs.writeFileSync(path.join(SORTIE, t.nom + ".png"), buf);
    manifeste[t.nom] = empreinte(html, t);
    console.log(`${t.nom}.png ${t.tw}×${t.th} ${(buf.length / 1024).toFixed(0)} Ko`);
  }
  fs.writeFileSync(path.join(SORTIE, "textures.json"), JSON.stringify(manifeste, null, 1) + "\n");
}
