// Construit public/ (le dossier mis en ligne) par COPIE des fichiers de l'export.
// Les originaux ne sont jamais modifiés. Liste blanche : PASSATION-CLAUDE-CODE.md § 1.
// Usage : npm run construire
import fs from "node:fs";
import path from "node:path";

const RACINE = path.resolve(import.meta.dirname, "..");
const PUBLIC = path.join(RACINE, "public");
const DS = "_ds/loan-drouard-design-system-06a79c98-aed9-4ca8-8b81-69bb72fcc98a";

// --- Liste blanche (§ 1) ---------------------------------------------------
const PAGES = [
  "Video Feedback.dc.html",
  "CGV.dc.html",
  "Privacy.dc.html",
  "Legal.dc.html",
  "Sponsors.dc.html",
];
const SCRIPTS = ["support.js", "chargement.js", "header-flottant.js", "poussiere-or.js", "blueprint.js"];
const DOSSIERS = ["_ds", "assets"];
const EXCLUS = ["assets/photos/press-hd"]; // photos HD de Press, pas encore publique
const IGNORES = [".DS_Store", "Thumbs.db"];

// --- Corrections validées par Loan (§ 7), appliquées sur la COPIE ------------
// Si un futur export contient déjà la bonne valeur, la correction ne fait rien.
const CORRECTIONS = [
  {
    quoi: "E-mail de contact provisoire (§ 7.1)",
    fichiers: ["CGV.dc.html", "Privacy.dc.html", "Legal.dc.html"],
    avant: "contact@loandrouard.com",
    apres: "loandrouard@gmail.com",
  },
  {
    quoi: "Crédits photo des mentions légales (§ 7.3)",
    fichiers: ["Legal.dc.html"],
    avant: '<mark class="lg-todo">[À COMPLÉTER : photographes]</mark>',
    apres: "David GROUARD",
  },
];

// --- Cache HTTP (§ 3) : fichier lu par Cloudflare, jamais servi --------------
// Par défaut Cloudflare demande au navigateur de revalider chaque fichier (HTML, CSS,
// support.js, _ds_bundle.js…). On allonge seulement ce qui est sûr.
const HEADERS = `# Généré par scripts/construire.mjs — ne pas modifier à la main.
# Scripts versionnés par ?v= dans les pages : cache long.
/chargement.js
  Cache-Control: public, max-age=31536000, immutable
/header-flottant.js
  Cache-Control: public, max-age=31536000, immutable
/poussiere-or.js
  Cache-Control: public, max-age=31536000, immutable
/blueprint.js
  Cache-Control: public, max-age=31536000, immutable
# Images et polices non versionnées : cache modéré (1 jour).
/assets/*
  Cache-Control: public, max-age=86400
/${DS}/assets/*
  Cache-Control: public, max-age=86400
`;

// ---------------------------------------------------------------------------
const erreurs = [];
const avert = [];
const rel = (p) => path.relative(RACINE, p).split(path.sep).join("/");

function copier(src, dst) {
  const st = fs.statSync(src);
  if (st.isDirectory()) {
    if (EXCLUS.includes(rel(src))) return;
    fs.mkdirSync(dst, { recursive: true });
    for (const nom of fs.readdirSync(src)) {
      if (IGNORES.includes(nom)) continue;
      copier(path.join(src, nom), path.join(dst, nom));
    }
  } else {
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
  }
}

fs.rmSync(PUBLIC, { recursive: true, force: true });
fs.mkdirSync(PUBLIC);

for (const f of [...PAGES, ...SCRIPTS, ...DOSSIERS]) {
  const src = path.join(RACINE, f);
  if (!fs.existsSync(src)) erreurs.push(`Fichier manquant dans l'export : ${f}`);
  else copier(src, path.join(PUBLIC, f));
}

// index.html = copie octet pour octet de Video Feedback (avant corrections, qui ne la touchent pas).
fs.copyFileSync(path.join(RACINE, "Video Feedback.dc.html"), path.join(PUBLIC, "index.html"));
const indexExport = path.join(RACINE, "index.html");
if (fs.existsSync(indexExport) &&
    !fs.readFileSync(indexExport).equals(fs.readFileSync(path.join(PUBLIC, "index.html")))) {
  avert.push("index.html de l'export différait de Video Feedback.dc.html : remplacé par la copie exacte.");
}

for (const c of CORRECTIONS) {
  let total = 0;
  for (const f of c.fichiers) {
    const p = path.join(PUBLIC, f);
    if (!fs.existsSync(p)) continue;
    const t = fs.readFileSync(p, "utf8");
    const n = t.split(c.avant).length - 1;
    if (n) fs.writeFileSync(p, t.split(c.avant).join(c.apres));
    total += n;
  }
  console.log(`Correction « ${c.quoi} » : ${total} remplacement(s)`);
}

fs.writeFileSync(path.join(PUBLIC, "_headers"), HEADERS);

// --- Contrôles ---------------------------------------------------------------
function lister(d) {
  return fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? lister(path.join(d, e.name)) : [path.join(d, e.name)]);
}
const fichiers = lister(PUBLIC);
const textes = fichiers.filter((f) => /\.(html|js|css|svg)$/.test(f));

for (const f of textes) {
  const t = fs.readFileSync(f, "utf8");
  const nom = path.relative(PUBLIC, f);
  if (/(Home|Press)\.dc\.html/.test(t)) erreurs.push(`${nom} mentionne Home.dc.html ou Press.dc.html`);
  if (/press-hd|image-slot\.js|zip-photos\.js|uploads\//.test(t) && !nom.endsWith("support.js"))
    avert.push(`${nom} référence un fichier non publié (press-hd, image-slot, zip-photos ou uploads)`);
  if (/\.html$/.test(f)) {
    if (t.includes("contact@loandrouard.com")) erreurs.push(`${nom} contient encore contact@loandrouard.com`);
    if (t.includes("À COMPLÉTER")) erreurs.push(`${nom} contient encore « À COMPLÉTER »`);
    // Les liens d'en-tête Home / The Journey / Press doivent rester des <span> désactivés.
    for (const m of t.matchAll(/<a\b[^>]*>\s*(Home|The Journey|Press[^<]*)\s*<\/a>/g))
      erreurs.push(`${nom} : « ${m[1]} » est un lien actif`);
  }
}

// apercuPaye doit valoir "none" par défaut (sinon un faux numéro s'affiche).
for (const f of ["Video Feedback.dc.html", "index.html"]) {
  const t = fs.readFileSync(path.join(PUBLIC, f), "utf8");
  const m = t.match(/apercuPaye&quot;:\{[^}]*?&quot;default&quot;:&quot;([^&]*)&quot;/);
  if (!m) erreurs.push(`${f} : prop apercuPaye introuvable`);
  else if (m[1] !== "none") erreurs.push(`${f} : apercuPaye vaut "${m[1]}" au lieu de "none"`);
}

// Références locales statiques (src / href / url()) qui pointeraient vers un fichier absent.
for (const f of textes) {
  const t = fs.readFileSync(f, "utf8");
  const refs = [...t.matchAll(/(?:src|href)="([^"#{}]+)"|url\(\s*['"]?([^'")#{}]+)['"]?\s*\)/g)]
    .map((m) => m[1] || m[2]);
  for (const r of refs) {
    if (/^(https?:|mailto:|tel:|data:|blob:|\/\/|javascript:|%23)/.test(r) || r.includes("${")) continue;
    const chemin = decodeURIComponent(r.split(/[?#]/)[0]);
    if (!chemin) continue;
    const base = f.endsWith(".html") || f.endsWith(".js") ? PUBLIC : path.dirname(f);
    if (!fs.existsSync(path.resolve(base, chemin)))
      avert.push(`${path.relative(PUBLIC, f)} référence « ${r} » absent de public/`);
  }
}

const taille = fichiers.reduce((s, f) => s + fs.statSync(f).size, 0);
console.log(`public/ : ${fichiers.length} fichiers, ${(taille / 1e6).toFixed(1)} Mo`);
for (const a of [...new Set(avert)]) console.log("ATTENTION : " + a);
for (const e of erreurs) console.error("ERREUR : " + e);
if (erreurs.length) process.exit(1);
console.log("Construction OK.");
