/* @ds-bundle: {"format":4,"namespace":"LoanDrouardDesignSystem_06a79c","components":[{"name":"Bouton","sourcePath":"components/actions/Bouton.jsx"},{"name":"LienTrait","sourcePath":"components/actions/LienTrait.jsx"},{"name":"Sceau","sourcePath":"components/actions/Sceau.jsx"},{"name":"Annotation","sourcePath":"components/contenu/CadreMedia.jsx"},{"name":"CadreMedia","sourcePath":"components/contenu/CadreMedia.jsx"},{"name":"ChiffresCles","sourcePath":"components/contenu/ChiffresCles.jsx"},{"name":"Chrono","sourcePath":"components/contenu/Chrono.jsx"},{"name":"Formule","sourcePath":"components/contenu/Formule.jsx"},{"name":"Roofline","sourcePath":"components/contenu/Roofline.jsx"},{"name":"Silhouette","sourcePath":"components/contenu/Silhouette.jsx"},{"name":"GLYPHES","sourcePath":"components/icones/Icone.jsx"},{"name":"Icone","sourcePath":"components/icones/Icone.jsx"},{"name":"Section","sourcePath":"components/layout/Section.jsx"},{"name":"SelecteurLangue","sourcePath":"components/navigation/SelecteurLangue.jsx"},{"name":"COMPTES","sourcePath":"components/reseaux/BarreReseaux.jsx"},{"name":"BarreReseaux","sourcePath":"components/reseaux/BarreReseaux.jsx"},{"name":"RESEAUX","sourcePath":"components/reseaux/IconeReseau.jsx"},{"name":"CADRES","sourcePath":"components/reseaux/IconeReseau.jsx"},{"name":"NOMS_RESEAUX","sourcePath":"components/reseaux/IconeReseau.jsx"},{"name":"IconeReseau","sourcePath":"components/reseaux/IconeReseau.jsx"},{"name":"CitationsEmpilees","sourcePath":"components/typographie/CitationsEmpilees.jsx"},{"name":"Emphase","sourcePath":"components/typographie/Emphase.jsx"},{"name":"Etiquette","sourcePath":"components/typographie/Etiquette.jsx"},{"name":"Lettrine","sourcePath":"components/typographie/Lettrine.jsx"},{"name":"Note","sourcePath":"components/typographie/Note.jsx"},{"name":"TexteChinois","sourcePath":"components/typographie/TexteChinois.jsx"},{"name":"TitreSection","sourcePath":"components/typographie/TitreSection.jsx"}],"sourceHashes":{"components/actions/Bouton.jsx":"c2c8b890d98c","components/actions/LienTrait.jsx":"c0bf31a36037","components/actions/Sceau.jsx":"7332f772342c","components/asset-base.js":"656735facb64","components/contenu/CadreMedia.jsx":"d486e8146587","components/contenu/ChiffresCles.jsx":"32ecb46363de","components/contenu/Chrono.jsx":"c4287e8dc465","components/contenu/Formule.jsx":"c8e3fed39568","components/contenu/Roofline.jsx":"c7d7dab46b71","components/contenu/Silhouette.jsx":"75dc39517963","components/icones/Icone.jsx":"867bb0a59018","components/layout/Section.jsx":"e09bab9eab99","components/navigation/SelecteurLangue.jsx":"ccdc426fb085","components/reseaux/BarreReseaux.jsx":"8438340f2d33","components/reseaux/IconeReseau.jsx":"f82142bd8953","components/ton.js":"4bed8a540037","components/typographie/CitationsEmpilees.jsx":"922803751875","components/typographie/Emphase.jsx":"fc13e0fd3e37","components/typographie/Etiquette.jsx":"160461df1ad5","components/typographie/Lettrine.jsx":"37f6420cfde4","components/typographie/Note.jsx":"a83055a2125a","components/typographie/TexteChinois.jsx":"cc353694341c","components/typographie/TitreSection.jsx":"e5805c338052","header-flottant.js":"edf08ad19117","ui_kits/site/Accueil.jsx":"1805d11e9c7f","ui_kits/site/Analyse.jsx":"d913ce0e7bbe","ui_kits/site/Chrome.jsx":"27a7a33b7c44","ui_kits/site/Formules.jsx":"1f2c94c57200","ui_kits/site/Parcours.jsx":"6cafc11f2dee"},"inlinedExternals":[],"unexposedExports":[{"name":"assetUrl","sourcePath":"components/asset-base.js"},{"name":"remplissageVars","sourcePath":"components/ton.js"},{"name":"tonVars","sourcePath":"components/ton.js"}]} */

(() => {

const __ds_ns = (window.LoanDrouardDesignSystem_06a79c = window.LoanDrouardDesignSystem_06a79c || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/asset-base.js
try { (() => {
/* Résout une URL d'asset de la marque depuis n'importe quelle page qui charge
   `_ds_bundle.js`. Toujours surchargeable via la prop `src`. */
function assetUrl(chemin) {
  const s = typeof document !== "undefined" && document.querySelector('script[src*="_ds_bundle.js"]');
  const base = s ? s.getAttribute("src").replace(/_ds_bundle\.js.*$/, "") : "";
  return base + "assets/" + chemin;
}
Object.assign(__ds_scope, { assetUrl });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/asset-base.js", error: String((e && e.message) || e) }); }

// components/actions/Sceau.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Le sceau : une lame et son petit fanion. La marque, jamais redessinée. */
function Sceau({
  taille = 24,
  couleur = "blanc",
  src,
  titre = "Loan Drouard",
  style,
  className = "",
  ...rest
}) {
  const fichier = couleur === "noir" ? "sceau-noir.svg" : "sceau-blanc.svg";
  return /*#__PURE__*/React.createElement("img", _extends({
    className: `ld-sceau ${className}`,
    src: src || __ds_scope.assetUrl(fichier),
    alt: titre,
    width: taille,
    height: taille,
    style: {
      width: taille,
      height: taille,
      objectFit: "contain",
      ...style
    }
  }, rest));
}
Object.assign(__ds_scope, { Sceau });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/actions/Sceau.jsx", error: String((e && e.message) || e) }); }

// components/contenu/Roofline.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Le motif de toiture, redessiné en gris clair — jamais en or.
 * `variante="motif"` : la ligne seule (héritage).
 * `variante="transition"` : la bascule d'une section claire vers le fond sombre — le SVG sert de
 * masque, la vague est donc le fond sombre lui-même et ne peut jamais en dériver.
 * occurrence unique sur une page — tracé large et peu accidenté, amplitude faible.
 */
function Roofline({
  variante = "motif",
  legende,
  src,
  style,
  className = "",
  ...rest
}) {
  const fichier = variante === "transition" ? "roof-transition.svg" : "roofline-motif.svg";
  if (variante === "transition") {
    const masque = `url("${src || __ds_scope.assetUrl(fichier)}")`;
    return /*#__PURE__*/React.createElement("div", _extends({
      className: "ld-roof-bloc ld-on-noir"
    }, rest), /*#__PURE__*/React.createElement("div", {
      className: `ld-roof ${className}`,
      style: {
        WebkitMaskImage: masque,
        maskImage: masque,
        ...style
      }
    }), legende && /*#__PURE__*/React.createElement("p", {
      className: "ld-roof__legende"
    }, legende));
  }
  return /*#__PURE__*/React.createElement("img", _extends({
    className: `ld-roofline ${className}`,
    src: src || __ds_scope.assetUrl(fichier),
    alt: "",
    style: style
  }, rest));
}
Object.assign(__ds_scope, { Roofline });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/contenu/Roofline.jsx", error: String((e && e.message) || e) }); }

// components/icones/Icone.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Jeu d'icônes « équerre adoucie » : grille 24, trait 1px, angles droits mais congés de 2
 * (0.6 à 0.8 sur les petites formes) — la géométrie reste franche, plus aucun coin ne pique.
 * Le même vocabulaire que les coins d'équerre du cadre d'analyse et les filets d'annotation.
 */
const GLYPHES = {
  menu: "M3.5 7h17M3.5 12h11M3.5 17h17",
  fermer: "M5 5l14 14M19 5L5 19",
  lecture: "M8.5 5.6v12.8a1 1 0 001.53.85l9.3-6.4a1 1 0 000-1.7L10.03 4.75A1 1 0 008.5 5.6z",
  message: "M5 7.5h14a2 2 0 012 2v5.6a2 2 0 01-2 2H5a2 2 0 01-2-2V9.5a2 2 0 012-2zM3.4 8.3l8.6 5.9 8.6-5.9",
  suivant: "M3.5 12h15.5M14 7l5 5-5 5",
  precedent: "M20.5 12H5M10 7l-5 5 5 5",
  delai: "M8.6 5.5h6.8a1.6 1.6 0 011.13.47l2.5 2.5A1.6 1.6 0 0119.5 9.6v6.8a1.6 1.6 0 01-.47 1.13l-2.5 2.5a1.6 1.6 0 01-1.13.47H8.6a1.6 1.6 0 01-1.13-.47l-2.5-2.5A1.6 1.6 0 014.5 16.4V9.6a1.6 1.6 0 01.47-1.13l2.5-2.5A1.6 1.6 0 018.6 5.5zM12 9.5v3.4l2.8 1.8M10 2.5h4",
  reseaux: "M6.5 4.5h11a2 2 0 012 2v7a2 2 0 01-2 2h-6.7l-4.3 4v-4H6.5a2 2 0 01-2-2v-7a2 2 0 012-2zM8 8.5h8M8 11.5h5",
  lieu: "M7 4.5h10a2 2 0 012 2v6.5a2 2 0 01-2 2h-3.3L12 20.5l-1.7-5.5H7a2 2 0 01-2-2V6.5a2 2 0 012-2zM10.8 8h2.4a.8.8 0 01.8.8v2.4a.8.8 0 01-.8.8h-2.4a.8.8 0 01-.8-.8V8.8a.8.8 0 01.8-.8z",
  podium: "M10.5 8.5h3A1.5 1.5 0 0115 10v10.5H9V10a1.5 1.5 0 011.5-1.5zM5 13.5h4v7H3.5V15A1.5 1.5 0 015 13.5zM15 11h4a1.5 1.5 0 011.5 1.5v8H15zM10.9 4.5h2.2a.6.6 0 01.58.75l-.48 1.85h-1.4l-.48-1.85a.6.6 0 01.58-.75z"
};
function Icone({
  nom = "menu",
  taille = 24,
  accent = false,
  titre,
  style,
  className = "",
  ...rest
}) {
  const d = GLYPHES[nom];
  if (!d) return null;
  return /*#__PURE__*/React.createElement("svg", _extends({
    className: `ld-icone ${className}`,
    width: taille,
    height: taille,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    role: titre ? "img" : undefined,
    "aria-hidden": titre ? undefined : true,
    style: {
      display: "block",
      flex: "none",
      color: accent ? "var(--or)" : undefined,
      ...style
    }
  }, rest), titre && /*#__PURE__*/React.createElement("title", null, titre), /*#__PURE__*/React.createElement("path", {
    d: d
  }));
}
Object.assign(__ds_scope, { GLYPHES, Icone });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/icones/Icone.jsx", error: String((e && e.message) || e) }); }

// components/layout/Section.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Section de page : fond noir, blanc ou texturé, grain, enveloppe centrée à 1180px. */
function Section({
  children,
  ton = "sombre",
  texture,
  grain = true,
  cover = false,
  largeur = true,
  style,
  className = "",
  ...rest
}) {
  // "lin" comme ton est l'écriture historique du premier fond texturé.
  const mat = texture || (ton === "lin" ? "lin" : null);
  const clair = ton === "clair" || mat === "lin";
  const classes = ["ld-section", clair ? "ld-on-blanc" : "ld-on-noir", mat ? `ld-texture ld-texture--${mat}` : "", grain && !mat ? "ld-grain" : "", grain && !mat && clair ? "ld-grain--clair" : "", className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("section", _extends({
    className: classes,
    style: cover ? {
      paddingBlock: "var(--cover-y-haut-large) var(--cover-y-bas-large)",
      ...style
    } : style
  }, rest), largeur ? /*#__PURE__*/React.createElement("div", {
    className: "ld-wrap"
  }, children) : children);
}
Object.assign(__ds_scope, { Section });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/layout/Section.jsx", error: String((e && e.message) || e) }); }

// components/reseaux/IconeReseau.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Marques des réseaux — bloc contact uniquement.
 * Ce sont des logos de tiers : tracés pleins, jamais redessinés ni retracés au trait 1px
 * du jeu « équerre adoucie ». Ils vivent en monochrome (currentColor) sur la grille 24.
 */
const RESEAUX = {
  instagram: "M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077",
  tiktok: "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z",
  xiaohongshu: "M289.44,256H477.67c17.93,0,33.86,15.57,34.33,33.48V477.72A35.09,35.09,0,0,1,477.66,512H289.5A35.14,35.14,0,0,1,256,477.64V289.56C256.43,271.93,271.81,256.5,289.44,256Zm16.73,91.44c-.13,19.87-.06,39.75-.16,59.63a2.1,2.1,0,0,1-2.13,2.6c-2.39.14-4.79.06-7.19.08,1.61,4,3.35,7.86,5.15,11.73,4.52-.15,9.68.79,13.54-2.17,3.47-2.58,4.58-7.17,4.51-11.3,0-20.19,0-40.39-.09-60.58C315.26,347.41,310.71,347.4,306.17,347.44Zm56.08-.9q-5.08,11.67-10.36,23.24c-1,2.31-2.21,5.37-.11,7.46,2.69,2.44,6.64,1.5,9.94,1.72-2.29,5.78-5.3,11.27-7.23,17.19-1.07,2.92,1.6,5.89,4.52,5.92,5.29.36,10.6,0,15.9.14,1.73-3.87,3.47-7.73,5.17-11.62-3.09,0-6.21.22-9.25-.39,3.29-8.26,7.19-16.25,10.68-24.41-4.27-.5-9.1.89-13-.77,1.9-6.4,5.36-12.27,7.8-18.5C371.61,346.5,366.93,346.47,362.25,346.54Zm72.75.05,0,5.21c-3.06,0-6.12,0-9.18,0q0,7,0,13.93c3.07,0,6.13,0,9.19.06q.12,6,0,12.08c-4.6.09-9.21,0-13.81.07-.06,4.64-.05,9.27,0,13.9,4.61.05,9.23,0,13.84,0,0,9.86,0,19.73,0,29.59,4.62,0,9.23,0,13.85,0q0-14.79,0-29.57c6.74,0,13.47-.1,20.21,0,2.37-.2,5.08,1.46,5,4.07a110.67,110.67,0,0,1,0,11.08,2.26,2.26,0,0,1-2.12,2.39c-3.85.28-7.71,0-11.57.13,1.7,4,3.35,8,5.28,11.95,6.35-.33,14.11,1.27,18.95-4,4.6-4.26,3.22-11,3.41-16.56-.29-5.85,1.14-12.46-2.49-17.58-3.09-4.34-8.66-5.52-13.68-5.61-.3-7,1.37-15.19-3.78-20.88-4.8-5.38-12.53-5.4-19.17-5.14l0-5.2C444.23,346.56,439.61,346.57,435,346.59Zm-49.42,5.22q0,7,0,13.92c2.9,0,5.79,0,8.69,0,0,13.91,0,27.83,0,41.74-4.15.07-8.31,0-12.46.05-2.15,4.62-4.25,9.26-6.34,13.9,15.48.06,31,0,46.44,0q0-6.94,0-13.9c-4.45,0-8.91,0-13.36-.05q0-20.88,0-41.77c2.91,0,5.81,0,8.72,0,0-4.64,0-9.29,0-13.93C406.73,351.79,396.16,351.77,385.58,351.81Zm91.35,1.28c-3.88,2.94-2.61,8.32-2.78,12.51,2.59,0,5.19.14,7.78-.09,4.16-.38,7.29-5.23,5.62-9.15C486.24,352.06,480.43,350.19,476.93,353.09ZM283,365.72c-.7,9.12-1.41,18.23-2.07,27.35a22.12,22.12,0,0,1-1.32,6.06c2.34,5.35,4.68,10.7,7.18,16,5.6-7.49,7.68-16.93,8.26-26.1.49-7.8,1.36-15.59,1.64-23.4C292.1,365.79,287.54,365.68,283,365.72Zm46.13,0q1,12.69,2,25.37c.73,8.48,2.92,17.12,8.1,24,2.47-5.29,4.83-10.63,7.17-16A21.67,21.67,0,0,1,345,393c-.66-9.09-1.38-18.18-2.08-27.27Q336,365.69,329.1,365.72Zm17.16,54.69c7.08,2.09,14.58.66,21.85,1.05,2.14-4.63,4.27-9.27,6.35-13.93-7.27-.28-14.67.76-21.8-1.07Q349.42,413.41,346.26,420.41Z",
  threads: "M18.263 11.097c-.03-3.486-1.92-5.586-5.111-5.586-2.13 0-3.922.963-4.863 2.499l2.062 1.438c.535-.843 1.272-1.543 2.628-1.543 1.528 0 2.318.85 2.544 2.431a15 15 0 0 0-2.236-.173c-4.125 0-6.068 1.867-6.068 4.336s1.943 3.99 4.804 3.99c3.139 0 5.013-2.115 5.781-4.735.798.361 1.348 1.204 1.348 2.47 0 3.387-3.907 5.232-7.22 5.232-4.885 0-8.077-3.207-8.077-8.424 0-6.392 4.223-10.487 9.9-10.487 3.808 0 5.69 1.671 6.97 3.914l2.108-1.475C21.44 2.078 18.331 0 13.663 0 6.227 0 1.168 5.277 1.168 12.934c0 7 4.953 11.066 10.856 11.066 4.878 0 9.809-2.846 9.809-7.716 0-2.545-1.46-4.231-3.569-5.187m-6.33 4.855c-1.077 0-2.026-.512-2.026-1.453 0-1.483 1.822-1.934 3.606-1.934.678 0 1.34.045 1.927.173-.422 1.927-1.671 3.215-3.508 3.214Z",
  facebook: "M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z",
  x: "M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z",
  whatsapp: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z",
  linkedin: "M695.53,695.54H618.29v-121c0-28.85-.52-66-40.18-66-40.23,0-46.39,31.43-46.39,63.88V695.53H454.48V446.77h74.15v34h1a81.27,81.27,0,0,1,73.17-40.18c78.29,0,92.73,51.5,92.73,118.49ZM367.32,412.76a44.83,44.83,0,1,1,44.82-44.83,44.83,44.83,0,0,1-44.82,44.83h0m38.62,282.77H328.62V446.77h77.33ZM734,251.38H289.8A38,38,0,0,0,251.34,289V735a38.07,38.07,0,0,0,38.47,37.62H734A38.15,38.15,0,0,0,772.66,735V288.92A38.12,38.12,0,0,0,734,251.35",
  douyin: "M325.82,396.19v-26.5A31.09,31.09,0,0,0,344,375.54V365.39a18.4,18.4,0,0,1-9.9-5.85,18,18,0,0,1-7.94-11.9h-9.56V399.9a11,11,0,0,1-10.93,10.54,10.84,10.84,0,0,1-8.88-4.57,10.94,10.94,0,0,1,5.08-20.65,10.33,10.33,0,0,1,3.24.51V375.5a24,24,0,0,0-23.44,24,23.77,23.77,0,0,0,6.45,16.34,24,24,0,0,0,37.74-19.63Z",
  linktree: "m13.73635 5.85251 4.00467-4.11665 2.3248 2.3808-4.20064 4.00466h5.9085v3.30473h-5.9365l4.22865 4.10766-2.3248 2.3338L12.0005 12.099l-5.74052 5.76852-2.3248-2.3248 4.22864-4.10766h-5.9375V8.12132h5.9085L3.93417 4.11666l2.3248-2.3808 4.00468 4.11665V0h3.4727zm-3.4727 10.30614h3.4727V24h-3.4727z"
};

/**
 * Deux marques arrivent dans leur grille d'origine, pas sur la grille 24 : on ne les retrace pas,
 * on les cadre. `preserveAspectRatio` les centre, le glyphe reste optiquement du même poids.
 */
const CADRES = {
  // Marque en pastille pleine : on l'aère dans son cadre pour que sa masse optique
  // égale celle des silhouettes voisines, au lieu de faire un bloc blanc dans la rangée.
  xiaohongshu: {
    viewBox: "-22 -22 300 300",
    transform: "translate(-256 -256)"
  },
  linkedin: {
    viewBox: "0 0 521.33 521.31",
    transform: "translate(-251.34 -251.34)"
  },
  douyin: {
    viewBox: "3.91 3.33 62.33 72.52",
    transform: "translate(-277.76 -344.31)"
  }
};

/** Nom d'usage de chaque plateforme — le seul libellé autorisé. */
const NOMS_RESEAUX = {
  instagram: "Instagram",
  tiktok: "TikTok",
  xiaohongshu: "小红书",
  douyin: "抖音",
  threads: "Threads",
  facebook: "Facebook",
  x: "X",
  linkedin: "LinkedIn",
  whatsapp: "WhatsApp",
  linktree: "Linktree"
};
function IconeReseau({
  reseau = "instagram",
  taille = 20,
  titre,
  style,
  className = "",
  ...rest
}) {
  const d = RESEAUX[reseau];
  if (!d) return null;
  const cadre = CADRES[reseau];
  const label = titre === undefined ? NOMS_RESEAUX[reseau] : titre;
  return /*#__PURE__*/React.createElement("svg", _extends({
    className: `ld-reseau__glyphe ${className}`,
    width: taille,
    height: taille,
    viewBox: cadre ? cadre.viewBox : "0 0 24 24",
    preserveAspectRatio: "xMidYMid meet",
    fill: "currentColor",
    role: label ? "img" : undefined,
    "aria-hidden": label ? undefined : true,
    style: {
      display: "block",
      flex: "none",
      ...style
    }
  }, rest), label && /*#__PURE__*/React.createElement("title", null, label), /*#__PURE__*/React.createElement("path", {
    d: d,
    transform: cadre ? cadre.transform : undefined
  }));
}
Object.assign(__ds_scope, { RESEAUX, CADRES, NOMS_RESEAUX, IconeReseau });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/reseaux/IconeReseau.jsx", error: String((e && e.message) || e) }); }

// components/ton.js
try { (() => {
/* Jeux de variables locales selon le fond sur lequel le composant est posé.
   `ton` = le fond, pas le composant : "sombre" (dominante du site) ou "clair". */
function tonVars(ton = "sombre") {
  return ton === "clair" ? {
    "--ld-encre": "var(--noir)",
    "--ld-secondaire": "var(--noir-sec)",
    "--ld-filet": "var(--gris)"
  } : {
    "--ld-encre": "var(--blanc)",
    "--ld-secondaire": "var(--blanc-sec)",
    "--ld-filet": "var(--filet-blanc)"
  };
}

/* Remplissage du CTA primaire : noir sur fond clair, blanc sur fond sombre. Jamais l'or. */
function remplissageVars(ton = "sombre") {
  return ton === "clair" ? {
    "--ld-fond": "var(--noir)",
    "--ld-encre": "var(--blanc)"
  } : {
    "--ld-fond": "var(--blanc)",
    "--ld-encre": "var(--noir)"
  };
}
Object.assign(__ds_scope, { tonVars, remplissageVars });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/ton.js", error: String((e && e.message) || e) }); }

// components/actions/Bouton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * CTA primaire. Un seul à l'écran.
 * Fond plein (noir sur fond clair, blanc sur fond sombre — jamais l'or au repos),
 * le coin inférieur gauche coupé net (16px) et les trois autres largement arrondis (12px),
 * le sceau posé devant le texte. Au survol, le sceau et le texte s'éclairent d'une lueur
 * dorée et l'or balaie le texte de gauche à droite. Le contour, lui, ne bouge pas.
 */
function Bouton({
  children,
  ton = "sombre",
  taille = "lg",
  coinCoupe = "bg",
  avecSceau = true,
  href,
  onClick,
  disabled = false,
  type = "button",
  style,
  className = "",
  ...rest
}) {
  const Tag = href && !disabled ? "a" : "button";
  const props = Tag === "a" ? {
    href
  } : {
    type,
    disabled
  };
  return /*#__PURE__*/React.createElement(Tag, _extends({
    className: `ld-bouton ld-bouton--${taille} ld-bouton--${coinCoupe} ${className}`,
    style: {
      ...__ds_scope.remplissageVars(ton),
      ...style
    },
    onClick: disabled ? undefined : onClick,
    "aria-disabled": disabled || undefined
  }, props, rest), avecSceau && /*#__PURE__*/React.createElement(__ds_scope.Sceau, {
    taille: taille === "lg" ? 24 : 19,
    couleur: ton === "clair" ? "blanc" : "noir"
  }), /*#__PURE__*/React.createElement("span", {
    className: "ld-bouton__texte"
  }, children));
}
Object.assign(__ds_scope, { Bouton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/actions/Bouton.jsx", error: String((e && e.message) || e) }); }

// components/actions/LienTrait.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Usages secondaires : plus de boîte du tout — un mot et un fin trait dessous. Le trait est
    de l'encre atténuée ; `accent` le passe en or (au plus une occurrence d'or par page). */
function LienTrait({
  children,
  ton = "sombre",
  taille = "lg",
  accent = false,
  href,
  onClick,
  style,
  className = "",
  ...rest
}) {
  const Tag = href ? "a" : "button";
  return /*#__PURE__*/React.createElement(Tag, _extends({
    className: `ld-lien ld-lien--${taille}${accent ? " ld-lien--or" : ""} ${className}`,
    style: {
      ...__ds_scope.tonVars(ton),
      ...style
    },
    href: href,
    onClick: onClick,
    type: Tag === "button" ? "button" : undefined
  }, rest), /*#__PURE__*/React.createElement("span", {
    className: "ld-lien__texte"
  }, children));
}
Object.assign(__ds_scope, { LienTrait });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/actions/LienTrait.jsx", error: String((e && e.message) || e) }); }

// components/contenu/CadreMedia.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Annotation technique : point, filet de 28px, étiquette sur voile. Une seule en or par visuel. */
function Annotation({
  children,
  accent = false,
  pose,
  inverse = false,
  style,
  className = "",
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    className: `ld-leader ${accent ? "ld-leader--or" : ""} ${pose ? "ld-leader--pose" : ""} ${inverse ? "ld-leader--inverse" : ""} ${className}`,
    style: {
      ...pose,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    className: "ld-leader__dot",
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("span", {
    className: "ld-leader__line",
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("span", {
    className: "ld-leader__label"
  }, children));
}

/* Les trois positions du guide : haut-gauche, milieu-droite (inversée), bas-gauche. */
const POSES = [{
  top: "24%",
  left: "6%"
}, {
  top: "54%",
  right: "6%"
}, {
  bottom: "14%",
  left: "9%"
}];

/** Emplacement photo / vidéo du mouvement : coins d'équerre, filigrane, annotations posées. */
function CadreMedia({
  filigrane = "emplacement photo / vidéo du mouvement",
  legende,
  annotations = [],
  ratio,
  ton = "sombre",
  children,
  style,
  className = "",
  ...rest
}) {
  return /*#__PURE__*/React.createElement("figure", _extends({
    style: {
      ...__ds_scope.tonVars(ton),
      margin: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    className: `ld-media ${className}`,
    style: ratio ? {
      aspectRatio: ratio
    } : undefined
  }, /*#__PURE__*/React.createElement("span", {
    className: "ld-media__coin ld-media__coin--tl"
  }), /*#__PURE__*/React.createElement("span", {
    className: "ld-media__coin ld-media__coin--tr"
  }), /*#__PURE__*/React.createElement("span", {
    className: "ld-media__coin ld-media__coin--bl"
  }), /*#__PURE__*/React.createElement("span", {
    className: "ld-media__coin ld-media__coin--br"
  }), children || /*#__PURE__*/React.createElement("div", {
    className: "ld-media__filigrane"
  }, filigrane), annotations.map((a, i) => /*#__PURE__*/React.createElement(Annotation, {
    key: i,
    accent: a.accent,
    inverse: !!(a.pose || POSES[i % 3]).right,
    pose: a.pose || POSES[i % 3]
  }, a.texte))), legende && /*#__PURE__*/React.createElement("figcaption", {
    className: "ld-media__legende"
  }, legende));
}
Object.assign(__ds_scope, { Annotation, CadreMedia });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/contenu/CadreMedia.jsx", error: String((e && e.message) || e) }); }

// components/contenu/ChiffresCles.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Bandeau de palmarès en Cinzel, séparé par le filet à deux points de la marque. */
function ChiffresCles({
  items = [],
  ton = "sombre",
  style,
  className = "",
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    className: `ld-stat ${className}`,
    style: {
      ...__ds_scope.tonVars(ton),
      color: "var(--ld-encre)",
      ...style
    }
  }, rest), items.map((item, i) => i === 0 ? /*#__PURE__*/React.createElement("span", {
    key: i
  }, item) : /*#__PURE__*/React.createElement("span", {
    key: i,
    className: "ld-stat__groupe"
  }, /*#__PURE__*/React.createElement("i", {
    className: "ld-stat__sep",
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("span", null, item))));
}
Object.assign(__ds_scope, { ChiffresCles });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/contenu/ChiffresCles.jsx", error: String((e && e.message) || e) }); }

// components/contenu/Chrono.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Le fil du parcours : filet vertical, points blancs, sommets en or, et la lueur qui voyage. */
function Chrono({
  etapes = [],
  lueur = true,
  ton = "sombre",
  style,
  className = "",
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    className: `ld-chrono ${className}`,
    style: {
      ...__ds_scope.tonVars(ton),
      color: "var(--ld-encre)",
      ...style
    }
  }, rest), lueur && /*#__PURE__*/React.createElement("div", {
    className: "ld-chrono__lueur",
    "aria-hidden": "true"
  }), etapes.map((e, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: `ld-chrono__item ${e.sommet ? "ld-chrono__item--sommet" : ""}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "ld-chrono__spine"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ld-chrono__dot"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "ld-chrono__annee"
  }, e.annee), /*#__PURE__*/React.createElement("h4", {
    className: "ld-chrono__titre"
  }, e.titre), e.detail && /*#__PURE__*/React.createElement("p", {
    className: "ld-chrono__detail"
  }, e.detail)))));
}
Object.assign(__ds_scope, { Chrono });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/contenu/Chrono.jsx", error: String((e && e.message) || e) }); }

// components/contenu/Silhouette.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Encadré clair sur fond sombre, avec une marque minuscule décentrée :
 * « figure minuscule, grand espace vide ». Jamais d'or ici.
 */
function Silhouette({
  legende,
  marque = {
    bottom: "20%",
    left: "68%"
  },
  ton = "sombre",
  children,
  style,
  className = "",
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      ...__ds_scope.tonVars(ton),
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    className: `ld-composition ${className}`
  }, children || /*#__PURE__*/React.createElement("span", {
    className: "ld-composition__marque",
    style: marque
  })), legende && /*#__PURE__*/React.createElement("p", {
    className: "ld-composition__legende"
  }, legende));
}
Object.assign(__ds_scope, { Silhouette });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/contenu/Silhouette.jsx", error: String((e && e.message) || e) }); }

// components/navigation/SelecteurLangue.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Sélecteur de langue — aucun drapeau : la langue active passe en or, et chaque langue
 *  porte au survol le balayage d'or du CTA primaire. */
function SelecteurLangue({
  langue = "en",
  langues = ["en", "fr", "zh"],
  onChange,
  ton = "sombre",
  style,
  className = "",
  ...rest
}) {
  const libelles = {
    en: "EN",
    fr: "FR",
    zh: "中文"
  };
  return /*#__PURE__*/React.createElement("nav", _extends({
    className: `ld-stat ld-langues ${className}`,
    style: {
      ...__ds_scope.tonVars(ton),
      color: "var(--ld-encre)",
      ...style
    },
    "aria-label": "Langue"
  }, rest), langues.map((code, i) => {
    const bouton = /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: `ld-langues__item ${code === "zh" ? "ld-langues__item--zh" : ""}`,
      "aria-current": code === langue,
      onClick: () => onChange && onChange(code)
    }, libelles[code] || code.toUpperCase());
    return i === 0 ? /*#__PURE__*/React.createElement(React.Fragment, {
      key: code
    }, bouton) : /*#__PURE__*/React.createElement("span", {
      key: code,
      className: "ld-stat__groupe"
    }, /*#__PURE__*/React.createElement("i", {
      className: "ld-stat__sep",
      "aria-hidden": "true"
    }), bouton);
  }));
}
Object.assign(__ds_scope, { SelecteurLangue });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/SelecteurLangue.jsx", error: String((e && e.message) || e) }); }

// components/reseaux/BarreReseaux.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Les comptes de Loan, dans l'ordre d'usage. C'est la source unique : une URL ne se
 * recopie pas dans une page, elle se lit ici.
 */
const COMPTES = [{
  reseau: "instagram",
  href: "https://www.instagram.com/loandrouard/"
}, {
  reseau: "xiaohongshu",
  href: "https://www.xiaohongshu.com/user/profile/69abe172000000003401b441"
}, {
  reseau: "tiktok",
  href: "https://www.tiktok.com/@loan.drouard"
}, {
  reseau: "douyin",
  href: "https://www.douyin.com/user/self"
}, {
  reseau: "threads",
  href: "https://www.threads.com/@loandrouard"
}, {
  reseau: "facebook",
  href: "https://www.facebook.com/loandrouard/"
}, {
  reseau: "x",
  href: "https://x.com/loandrouard"
}, {
  reseau: "linkedin",
  href: "https://www.linkedin.com/in/loandrouard/"
}];

/**
 * La rangée de réseaux du bloc contact. Cible de 44px, glyphe de 20px,
 * or au survol seulement — au repos, la rangée reste entièrement dans l'encre.
 */
function BarreReseaux({
  liens = COMPTES,
  ton = "sombre",
  libelles = false,
  taille = 20,
  style,
  className = "",
  ...rest
}) {
  return /*#__PURE__*/React.createElement("ul", _extends({
    className: `ld-reseaux ${libelles ? "ld-reseaux--libelles" : ""} ${className}`,
    style: {
      ...__ds_scope.tonVars(ton),
      ...style
    }
  }, rest), liens.map(({
    reseau,
    href,
    nom
  }) => /*#__PURE__*/React.createElement("li", {
    key: reseau
  }, /*#__PURE__*/React.createElement("a", {
    className: "ld-reseau",
    href: href,
    target: "_blank",
    rel: "noreferrer noopener",
    "aria-label": libelles ? undefined : nom || __ds_scope.NOMS_RESEAUX[reseau]
  }, /*#__PURE__*/React.createElement(__ds_scope.IconeReseau, {
    reseau: reseau,
    taille: taille,
    titre: ""
  }), libelles && /*#__PURE__*/React.createElement("span", {
    className: "ld-reseau__nom"
  }, nom || __ds_scope.NOMS_RESEAUX[reseau])))));
}
Object.assign(__ds_scope, { COMPTES, BarreReseaux });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/reseaux/BarreReseaux.jsx", error: String((e && e.message) || e) }); }

// components/typographie/CitationsEmpilees.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Citations empilées : trois courtes lignes, la première pleine, les suivantes en retrait d'opacité. */
function CitationsEmpilees({
  lignes = [],
  style,
  className = "",
  ...rest
}) {
  return /*#__PURE__*/React.createElement("ul", _extends({
    className: `ld-empilees ${className}`,
    style: style
  }, rest), lignes.map((l, i) => /*#__PURE__*/React.createElement("li", {
    key: i
  }, l)));
}
Object.assign(__ds_scope, { CitationsEmpilees });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/typographie/CitationsEmpilees.jsx", error: String((e && e.message) || e) }); }

// components/typographie/Emphase.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Mise en valeur. En français : bascule vers l'italique de Cormorant, en or.
 * En chinois seulement : Ma Shan Zheng, à l'usage rare.
 */
function Emphase({
  children,
  langue = "fr",
  style,
  className = "",
  ...rest
}) {
  return /*#__PURE__*/React.createElement("em", _extends({
    className: `ld-emphase ${langue === "zh" ? "ld-emphase--zh" : ""} ${className}`,
    style: style
  }, rest), children);
}
Object.assign(__ds_scope, { Emphase });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/typographie/Emphase.jsx", error: String((e && e.message) || e) }); }

// components/typographie/Etiquette.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Étiquette Cinzel en capitales.
 * `variante="tag"` : 12px, 0.14em, graisse 600 (nom d'une prestation).
 * `variante="role"` : 11px, 0.1em, en or (rôle d'un spécimen, en-tête de groupe).
 */
function Etiquette({
  children,
  description,
  variante = "tag",
  ton = "sombre",
  as: Tag = "div",
  style,
  className = "",
  ...rest
}) {
  return /*#__PURE__*/React.createElement(Tag, _extends({
    className: `ld-etiquette ${variante === "role" ? "ld-etiquette--role" : ""} ${className}`,
    style: {
      ...__ds_scope.tonVars(ton),
      ...style
    }
  }, rest), children, description && /*#__PURE__*/React.createElement("div", {
    className: "ld-etiquette__desc"
  }, description));
}
Object.assign(__ds_scope, { Etiquette });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/typographie/Etiquette.jsx", error: String((e && e.message) || e) }); }

// components/contenu/Formule.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Une formule : étiquette, promesse empilée, prix en Cinzel, action. */
function Formule({
  etiquette,
  lignes = [],
  prix,
  detail,
  action,
  miseEnAvant = false,
  ton = "sombre",
  style,
  className = "",
  ...rest
}) {
  return /*#__PURE__*/React.createElement("article", _extends({
    className: `ld-formule ${miseEnAvant ? "ld-formule--mise-en-avant" : ""} ${className}`,
    style: {
      ...__ds_scope.tonVars(ton),
      color: "var(--ld-encre)",
      ...style
    }
  }, rest), etiquette && /*#__PURE__*/React.createElement(__ds_scope.Etiquette, {
    variante: miseEnAvant ? "role" : "tag"
  }, etiquette), lignes.length > 0 && /*#__PURE__*/React.createElement(__ds_scope.CitationsEmpilees, {
    lignes: lignes
  }), prix && /*#__PURE__*/React.createElement("div", {
    className: "ld-formule__prix"
  }, prix), detail && /*#__PURE__*/React.createElement("p", {
    className: "ld-formule__detail"
  }, detail), action && /*#__PURE__*/React.createElement("div", {
    className: "ld-formule__pied"
  }, action));
}
Object.assign(__ds_scope, { Formule });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/contenu/Formule.jsx", error: String((e && e.message) || e) }); }

// components/typographie/Lettrine.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Paragraphe d'ouverture à lettrine. Une seule lettrine par page. */
function Lettrine({
  children,
  style,
  className = "",
  ...rest
}) {
  return /*#__PURE__*/React.createElement("p", _extends({
    className: `ld-lettrine ${className}`,
    style: style
  }, rest), children);
}
Object.assign(__ds_scope, { Lettrine });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/typographie/Lettrine.jsx", error: String((e && e.message) || e) }); }

// components/typographie/Note.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Note de bas de section : un filet vertical à gauche, texte 14.5px secondaire. */
function Note({
  children,
  accent = false,
  ton = "sombre",
  style,
  className = "",
  ...rest
}) {
  return /*#__PURE__*/React.createElement("p", _extends({
    className: `ld-note ${accent ? "ld-note--or" : ""} ${className}`,
    style: {
      ...__ds_scope.tonVars(ton),
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Note });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/typographie/Note.jsx", error: String((e && e.message) || e) }); }

// components/typographie/TexteChinois.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Texte chinois courant — Long Cang. Nom du sponsor et réseaux sociaux chinois. */
function TexteChinois({
  children,
  taille = 28,
  style,
  className = "",
  as: Tag = "span",
  ...rest
}) {
  return /*#__PURE__*/React.createElement(Tag, _extends({
    className: `ld-chinois ${className}`,
    style: {
      fontSize: taille,
      lineHeight: 1.35,
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { TexteChinois });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/typographie/TexteChinois.jsx", error: String((e && e.message) || e) }); }

// components/typographie/TitreSection.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** En-tête de section : eyebrow « 01 — Couleurs » en gris, titre Cormorant SC, chapeau optionnel.
    `accent` passe l'eyebrow en or — au plus une fois par page. */
function TitreSection({
  numero,
  surtitre,
  titre,
  chapeau,
  accent = false,
  ton = "sombre",
  style,
  className = "",
  ...rest
}) {
  const eyebrow = [numero, surtitre].filter(Boolean).join(" — ");
  return /*#__PURE__*/React.createElement("header", _extends({
    className: `ld-titre-section ${className}`,
    style: {
      ...__ds_scope.tonVars(ton),
      ...style
    }
  }, rest), eyebrow && /*#__PURE__*/React.createElement("p", {
    className: `ld-eyebrow${accent ? " ld-eyebrow--or" : ""}`
  }, eyebrow), titre && /*#__PURE__*/React.createElement("h2", {
    className: "ld-titre-section__titre"
  }, titre), chapeau && /*#__PURE__*/React.createElement("p", {
    className: "ld-titre-section__chapeau"
  }, chapeau));
}
Object.assign(__ds_scope, { TitreSection });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/typographie/TitreSection.jsx", error: String((e && e.message) || e) }); }

// header-flottant.js
try { (() => {
/* Header flottant : transparent et hors flux, il passe par-dessus le contenu. Son encre ne
   peut donc pas être fixée dans le markup — elle est relue au défilement sur le fond
   réellement peint sous lui, et posée en data-ton (les valeurs sont dans styles.css).
   Repli : "sombre" — le fond de page est noir, un fond non identifié n'est jamais clair. */
(() => {
  const SELECTEUR_FOND = ".ld-on-blanc, .ld-on-noir";
  let planifie = null;
  function lire() {
    planifie = null;
    for (const header of document.querySelectorAll(".ld-header")) {
      const r = header.getBoundingClientRect();
      if (!r.width) continue;
      const sous = document.elementFromPoint(Math.round(r.left + r.width / 2), Math.round(r.bottom + 4));
      const fond = sous && sous.closest(SELECTEUR_FOND);
      header.dataset.ton = fond && fond.classList.contains("ld-on-blanc") ? "clair" : "sombre";
    }
  }
  const planifier = () => {
    if (planifie === null) planifie = requestAnimationFrame(lire);
  };
  addEventListener("scroll", planifier, {
    passive: true
  });
  addEventListener("resize", planifier);
  addEventListener("load", planifier);
  if (document.readyState === "loading") addEventListener("DOMContentLoaded", planifier);else planifier();
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "header-flottant.js", error: String((e && e.message) || e) }); }

// ui_kits/site/Accueil.jsx
try { (() => {
const {
  Section,
  Bouton,
  LienTrait,
  ChiffresCles,
  Lettrine,
  TitreSection,
  Silhouette,
  CadreMedia,
  Roofline,
  Note,
  Emphase
} = window.LoanDrouardDesignSystem_06a79c;
function Accueil({
  setPage
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Section, {
    ton: "clair",
    cover: true
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: "var(--font-titre)",
      fontWeight: 600,
      fontSize: "var(--titre-cover)",
      lineHeight: "var(--lh-cover)",
      letterSpacing: "var(--ls-titre)"
    }
  }, "Le geste, d\xE9cortiqu\xE9 ", /*#__PURE__*/React.createElement(Emphase, null, "point par point"), "."), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 22,
      fontSize: 19,
      lineHeight: 1.7,
      maxWidth: 620,
      color: "var(--noir-sec)"
    }
  }, "Analyse technique du wushu taolu : votre encha\xEEnement pass\xE9 au crible, appui par appui. Un retour \xE9crit, comment\xE9, sous quatre \xE0 six jours."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 40
    }
  }, /*#__PURE__*/React.createElement(ChiffresCles, {
    ton: "clair",
    items: ["14× Champion de France", "5× Champion d'Europe", "Vice-champion du Monde 2025", "2e Coupe du Monde 2026"]
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 20,
      marginTop: 40
    }
  }, /*#__PURE__*/React.createElement(Bouton, {
    ton: "clair",
    onClick: () => setPage("formules")
  }, "R\xE9server une analyse"), /*#__PURE__*/React.createElement(LienTrait, {
    ton: "clair",
    onClick: () => setPage("parcours")
  }, "D\xE9couvrir le parcours"))), /*#__PURE__*/React.createElement(Section, {
    ton: "clair",
    style: {
      paddingTop: 0
    }
  }, /*#__PURE__*/React.createElement(TitreSection, {
    ton: "clair",
    numero: "01",
    surtitre: "Le parcours",
    titre: "Du Henan aux podiums europ\xE9ens."
  }), /*#__PURE__*/React.createElement(Lettrine, null, "Loan Drouard est un athl\xE8te fran\xE7ais de wushu taolu, quatorze fois champion de France, cinq fois champion d'Europe et vice-champion du monde 2025. Initi\xE9 au kung-fu \xE0 sept ans, il s'entra\xEEne d\xE8s neuf ans dans une \xE9cole traditionnelle du Henan, en Chine."), /*#__PURE__*/React.createElement(Note, {
    ton: "clair"
  }, "Le r\xE9cit reste \xE0 la troisi\xE8me personne ; les formules, elles, s'adressent \xE0 vous.")), /*#__PURE__*/React.createElement(Roofline, {
    variante: "transition",
    legende: "Occurrence unique sur la page : trac\xE9 large et peu accident\xE9, amplitude faible."
  }), /*#__PURE__*/React.createElement(Section, {
    ton: "sombre"
  }, /*#__PURE__*/React.createElement(TitreSection, {
    numero: "02",
    surtitre: "Geste signature n\xB01",
    titre: /*#__PURE__*/React.createElement(React.Fragment, null, "Analyse technique ", /*#__PURE__*/React.createElement("span", {
      style: {
        color: "var(--blanc-sec)",
        fontWeight: 400,
        fontStyle: "italic"
      }
    }, "\u2014 un contexte r\xE9serv\xE9, pas partout"))
  }), /*#__PURE__*/React.createElement(CadreMedia, {
    legende: "Trois annotations, une seule en or : l'accent marque le point le plus important, le reste reste en gris clair.",
    annotations: [{
      texte: "Appui stable"
    }, {
      texte: "Axe du bassin",
      accent: true
    }, {
      texte: "Relâchement épaules"
    }]
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "center",
      marginTop: 32
    }
  }, /*#__PURE__*/React.createElement(LienTrait, {
    ton: "sombre",
    onClick: () => setPage("analyse")
  }, "Voir une analyse"))), /*#__PURE__*/React.createElement(Section, {
    ton: "sombre",
    style: {
      paddingTop: 0
    }
  }, /*#__PURE__*/React.createElement(TitreSection, {
    numero: "03",
    surtitre: "H\xE9ritage, en silhouette",
    titre: "La forme, jamais le symbole."
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
      gap: 56
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Roofline, null), /*#__PURE__*/React.createElement("p", {
    className: "ld-composition__legende",
    style: {
      color: "var(--blanc-sec)"
    }
  }, "Motif redessin\xE9 en gris clair sur fond sombre, jamais en or : la silhouette reste discr\xE8te sans avoir besoin de couleur pour se faire remarquer.")), /*#__PURE__*/React.createElement(Silhouette, {
    legende: "Le principe \xAB figure minuscule, grand espace vide \xBB garde tout son sens sur fond sombre : l'encadr\xE9 clair se d\xE9tache du noir."
  }))));
}
Object.assign(window, {
  Accueil
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/site/Accueil.jsx", error: String((e && e.message) || e) }); }

// ui_kits/site/Analyse.jsx
try { (() => {
const {
  Section,
  CadreMedia,
  Annotation,
  TitreSection,
  Etiquette,
  LienTrait,
  CitationsEmpilees,
  Note
} = window.LoanDrouardDesignSystem_06a79c;
const VUES = [{
  id: "profil",
  nom: "Vue de profil",
  filigrane: "emplacement photo / vidéo du mouvement",
  annotations: [{
    texte: "Appui stable"
  }, {
    texte: "Axe du bassin",
    accent: true
  }, {
    texte: "Relâchement épaules"
  }]
}, {
  id: "face",
  nom: "Vue de face",
  filigrane: "emplacement photo / vidéo — face",
  annotations: [{
    texte: "Alignement des épaules"
  }, {
    texte: "Ouverture de hanche",
    accent: true
  }, {
    texte: "Regard dans l'axe"
  }]
}, {
  id: "arme",
  nom: "Trajectoire de l'arme",
  filigrane: "emplacement photo / vidéo — dao",
  annotations: [{
    texte: "Amplitude du tracé"
  }, {
    texte: "Point de bascule",
    accent: true
  }, {
    texte: "Reprise en main"
  }]
}];
function Analyse({
  setPage
}) {
  const [vue, setVue] = React.useState("profil");
  const v = VUES.find(x => x.id === vue);
  return /*#__PURE__*/React.createElement(Section, {
    ton: "sombre"
  }, /*#__PURE__*/React.createElement(TitreSection, {
    numero: "04",
    surtitre: "Geste signature n\xB01",
    titre: /*#__PURE__*/React.createElement(React.Fragment, null, "Analyse technique ", /*#__PURE__*/React.createElement("span", {
      style: {
        color: "var(--blanc-sec)",
        fontWeight: 400,
        fontStyle: "italic"
      }
    }, "\u2014 un contexte r\xE9serv\xE9, pas partout"))
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
      gap: 56,
      alignItems: "start"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 24,
      marginBottom: 24
    }
  }, VUES.map(x => /*#__PURE__*/React.createElement("button", {
    key: x.id,
    onClick: () => setVue(x.id),
    style: {
      background: "none",
      border: 0,
      padding: 0,
      cursor: "pointer",
      fontFamily: "var(--font-tertiaire)",
      fontWeight: 500,
      fontSize: 11,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      color: vue === x.id ? "var(--blanc)" : "var(--blanc-sec)",
      textDecoration: vue === x.id ? "underline" : "none",
      textUnderlineOffset: 5
    }
  }, x.nom))), /*#__PURE__*/React.createElement(CadreMedia, {
    key: v.id,
    filigrane: v.filigrane,
    annotations: v.annotations
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 32
    }
  }, /*#__PURE__*/React.createElement(CitationsEmpilees, {
    lignes: ["Votre enchaînement complet, passé au crible.", "Corriger, ajuster, progresser."]
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Etiquette, {
    variante: "role"
  }, "Lecture du trac\xE9"), /*#__PURE__*/React.createElement(Annotation, null, "Trac\xE9 large et peu accident\xE9, amplitude faible")), /*#__PURE__*/React.createElement(Note, {
    ton: "sombre"
  }, "Une seule annotation en or par visuel : elle marque le point \xE0 corriger en priorit\xE9."), /*#__PURE__*/React.createElement(LienTrait, {
    ton: "sombre",
    onClick: () => setPage("formules")
  }, "R\xE9server ce type d'analyse"))));
}
Object.assign(window, {
  Analyse
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/site/Analyse.jsx", error: String((e && e.message) || e) }); }

// ui_kits/site/Chrome.jsx
try { (() => {
const {
  Sceau,
  SelecteurLangue,
  Etiquette,
  TexteChinois
} = window.LoanDrouardDesignSystem_06a79c;
function Header({
  page,
  setPage,
  langue,
  setLangue,
  ton = "sombre"
}) {
  const liens = [["accueil", "Accueil"], ["parcours", "Parcours"], ["analyse", "Analyse"], ["formules", "Formules"]];
  /* Le header est transparent et posé PAR-DESSUS le contenu (marge négative = il ne prend
     aucune bande dans le flux). Son encre ne peut donc pas être fixée une fois pour toutes :
     elle est relue au défilement sur le fond réellement présent sous lui. */
  const ref = React.useRef(null);
  const [tonFond, setTonFond] = React.useState(ton);
  React.useEffect(() => {
    let brut = null;
    const lire = () => {
      brut = null;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const sous = document.elementFromPoint(Math.round(r.left + r.width / 2), Math.round(r.bottom + 4));
      const fond = sous && sous.closest(".ld-on-blanc, .ld-on-noir");
      /* Repli sur "sombre" : le fond de page est noir, un fond non identifié n'est jamais clair. */
      setTonFond(fond ? fond.classList.contains("ld-on-blanc") ? "clair" : "sombre" : "sombre");
    };
    const planifier = () => {
      if (brut === null) brut = requestAnimationFrame(lire);
    };
    lire();
    window.addEventListener("scroll", planifier, {
      passive: true
    });
    window.addEventListener("resize", planifier);
    return () => {
      window.removeEventListener("scroll", planifier);
      window.removeEventListener("resize", planifier);
      if (brut) cancelAnimationFrame(brut);
    };
  }, [page]);
  const encre = tonFond === "clair" ? "var(--noir)" : "var(--blanc)";
  const inactif = tonFond === "clair" ? "var(--noir-sec)" : "var(--blanc-sec)";
  return /*#__PURE__*/React.createElement("header", {
    ref: ref,
    className: "ld-header",
    "data-ton": tonFond
  }, /*#__PURE__*/React.createElement("div", {
    className: "ld-wrap",
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 32,
      paddingBlock: 18
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setPage("accueil"),
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      background: "none",
      border: 0,
      padding: 0,
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement(Sceau, {
    taille: 26,
    couleur: tonFond === "clair" ? "noir" : "blanc"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-titre)",
      fontWeight: 600,
      fontSize: 19,
      letterSpacing: "0.01em",
      color: encre
    }
  }, "Loan Drouard")), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: "flex",
      gap: 26
    }
  }, liens.map(([id, label]) => /*#__PURE__*/React.createElement("button", {
    key: id,
    onClick: () => setPage(id),
    style: {
      background: "none",
      border: 0,
      padding: 0,
      cursor: "pointer",
      fontFamily: "var(--font-tertiaire)",
      fontWeight: 500,
      fontSize: 12,
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      color: page === id ? encre : inactif
    }
  }, label))), /*#__PURE__*/React.createElement(SelecteurLangue, {
    ton: tonFond,
    langue: langue,
    onChange: setLangue
  })));
}
function Pied() {
  return /*#__PURE__*/React.createElement("footer", {
    className: "ld-on-noir ld-grain",
    style: {
      paddingBlock: "56px 40px",
      borderTop: "1px solid var(--filet-blanc)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "ld-wrap",
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-end",
      gap: 48
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Sceau, {
    taille: 40,
    couleur: "blanc"
  }), /*#__PURE__*/React.createElement(Etiquette, {
    variante: "role",
    style: {
      color: "var(--gris-fonce)"
    }
  }, "Loan Drouard \u2014 Wushu taolu")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      textAlign: "right"
    }
  }, /*#__PURE__*/React.createElement(Etiquette, {
    variante: "role",
    style: {
      color: "var(--gris-fonce)"
    }
  }, "Sponsor"), /*#__PURE__*/React.createElement(TexteChinois, {
    taille: 28
  }, "\u6B66\u5FC5\u884C"), /*#__PURE__*/React.createElement(TexteChinois, {
    taille: 20,
    style: {
      color: "var(--blanc-sec)"
    }
  }, "\u5C0F\u7EA2\u4E66\u3000\xB7\u3000\u6296\u97F3"))));
}
Object.assign(window, {
  Header,
  Pied
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/site/Chrome.jsx", error: String((e && e.message) || e) }); }

// ui_kits/site/Formules.jsx
try { (() => {
const {
  Section,
  Formule,
  LienTrait,
  Bouton,
  TitreSection,
  Etiquette,
  CitationsEmpilees,
  Note
} = window.LoanDrouardDesignSystem_06a79c;
const FORMULES = [{
  id: "retour",
  etiquette: "Retour vidéo",
  prix: /*#__PURE__*/React.createElement(React.Fragment, null, "49\xA0\u20AC"),
  detail: "Analyse détaillée, retour sous 4 à 6 jours.",
  lignes: ["Votre enchaînement, décortiqué point par point.", "Un retour écrit et commenté."]
}, {
  id: "analyse",
  etiquette: "Analyse complète",
  prix: /*#__PURE__*/React.createElement(React.Fragment, null, "129\xA0\u20AC"),
  detail: "Analyse image par image, retour sous 4 à 6 jours.",
  lignes: ["Votre enchaînement complet, passé au crible.", "Corriger, ajuster, progresser."]
}, {
  id: "suivi",
  etiquette: "Suivi trimestriel",
  prix: /*#__PURE__*/React.createElement(React.Fragment, null, "499\xA0\u20AC"),
  detail: "Quatre analyses, un plan de travail, un point mensuel.",
  lignes: ["Un trimestre entier à vos côtés.", "Le geste retravaillé, séance après séance."]
}];
function Formules({
  choix,
  setChoix,
  onReserver
}) {
  return /*#__PURE__*/React.createElement(Section, {
    ton: "sombre"
  }, /*#__PURE__*/React.createElement(TitreSection, {
    numero: "06",
    surtitre: "Formules",
    titre: "Trois fa\xE7ons de travailler le geste.",
    chapeau: "49 \u20AC \xB7 129 \u20AC \xB7 499 \u20AC \u2014 un seul CTA primaire \xE0 l'\xE9cran : les formules se choisissent en trait seul."
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
      gap: 16,
      alignItems: "stretch"
    }
  }, FORMULES.map(f => /*#__PURE__*/React.createElement(Formule, {
    key: f.id,
    etiquette: f.etiquette,
    lignes: f.lignes,
    prix: f.prix,
    detail: f.detail,
    miseEnAvant: choix === f.id,
    onClick: () => setChoix(f.id),
    style: {
      cursor: "pointer"
    },
    action: /*#__PURE__*/React.createElement(LienTrait, {
      ton: "sombre"
    }, choix === f.id ? "Formule choisie" : "Choisir")
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 32,
      marginTop: 48,
      paddingTop: 48,
      borderTop: "1px solid var(--filet-blanc)"
    }
  }, /*#__PURE__*/React.createElement(Bouton, {
    ton: "sombre",
    onClick: onReserver
  }, "R\xE9server une analyse"), /*#__PURE__*/React.createElement(Note, {
    ton: "sombre",
    style: {
      marginTop: 0
    }
  }, "Le tarif s'\xE9crit en Cinzel, avec une espace ins\xE9cable avant le signe \u20AC.")));
}
function Reservation({
  formule,
  onRetour
}) {
  const f = FORMULES.find(x => x.id === formule) || FORMULES[1];
  const [envoye, setEnvoye] = React.useState(false);
  const champ = {
    background: "transparent",
    border: 0,
    borderBottom: "1px solid var(--filet-blanc)",
    color: "var(--blanc)",
    fontFamily: "var(--font-corps)",
    fontSize: 19,
    padding: "10px 0",
    outline: "none"
  };
  return /*#__PURE__*/React.createElement(Section, {
    ton: "sombre"
  }, /*#__PURE__*/React.createElement(TitreSection, {
    numero: "07",
    surtitre: "R\xE9servation",
    titre: envoye ? "Demande reçue." : "Envoyez votre enchaînement.",
    chapeau: envoye ? "Retour sous 4 à 6 jours." : "Une vidéo, un objectif, une date."
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
      gap: 56,
      alignItems: "start"
    }
  }, /*#__PURE__*/React.createElement("div", null, !envoye && /*#__PURE__*/React.createElement("form", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 20,
      maxWidth: 420
    },
    onSubmit: e => {
      e.preventDefault();
      setEnvoye(true);
    }
  }, /*#__PURE__*/React.createElement("input", {
    style: champ,
    placeholder: "Nom et pr\xE9nom"
  }), /*#__PURE__*/React.createElement("input", {
    style: champ,
    placeholder: "Adresse e-mail",
    type: "email"
  }), /*#__PURE__*/React.createElement("input", {
    style: champ,
    placeholder: "Lien vers la vid\xE9o"
  }), /*#__PURE__*/React.createElement(Bouton, {
    ton: "sombre",
    type: "submit",
    style: {
      marginTop: 16,
      alignSelf: "flex-start"
    }
  }, "Envoyer la demande")), envoye && /*#__PURE__*/React.createElement(LienTrait, {
    ton: "sombre",
    onClick: onRetour
  }, "Revenir aux formules")), /*#__PURE__*/React.createElement("aside", {
    style: {
      border: "1px solid var(--filet-blanc)",
      borderRadius: "var(--rayon-cadre)",
      padding: "28px 26px",
      display: "flex",
      flexDirection: "column",
      gap: 20
    }
  }, /*#__PURE__*/React.createElement(Etiquette, null, f.etiquette), /*#__PURE__*/React.createElement(CitationsEmpilees, {
    lignes: f.lignes
  }), /*#__PURE__*/React.createElement("div", {
    className: "ld-formule__prix"
  }, f.prix), /*#__PURE__*/React.createElement("p", {
    className: "ld-formule__detail",
    style: {
      color: "var(--blanc-sec)"
    }
  }, f.detail))));
}
Object.assign(window, {
  Formules,
  Reservation,
  FORMULES
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/site/Formules.jsx", error: String((e && e.message) || e) }); }

// ui_kits/site/Parcours.jsx
try { (() => {
const {
  Section,
  Chrono,
  TitreSection,
  LienTrait,
  ChiffresCles,
  Note
} = window.LoanDrouardDesignSystem_06a79c;
const ETAPES = [{
  annee: "2017",
  titre: "Champion du monde — kung-fu traditionnel",
  detail: "Or en shaolinquan, World Kungfu Championships."
}, {
  annee: "2022",
  titre: /*#__PURE__*/React.createElement(React.Fragment, null, "3", /*#__PURE__*/React.createElement("sup", null, "e"), " aux Jeux Mondiaux"),
  detail: "Bronze en daoshu / gunshu combinés, Birmingham."
}, {
  annee: "2024",
  titre: "Champion d'Europe",
  detail: "Or en changquan et gunshu, argent en daoshu — Stockholm."
}, {
  annee: "2025",
  titre: "Vice-champion du monde",
  detail: "Argent en gunshu, World Wushu Championships, Brasília."
}, {
  annee: "2026",
  titre: /*#__PURE__*/React.createElement(React.Fragment, null, "Cinqui\xE8me titre europ\xE9en, 2", /*#__PURE__*/React.createElement("sup", null, "e"), " Coupe du Monde"),
  detail: "Nouveaux titres continentaux portant le total à cinq, puis dauphin à la Coupe du Monde.",
  sommet: true
}];
function Parcours({
  setPage
}) {
  return /*#__PURE__*/React.createElement(Section, {
    ton: "sombre"
  }, /*#__PURE__*/React.createElement(TitreSection, {
    numero: "05",
    surtitre: "Geste signature n\xB02",
    titre: "L'effet de lueur \u2014 le fil du parcours"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
      gap: 56,
      alignItems: "start"
    }
  }, /*#__PURE__*/React.createElement(Chrono, {
    etapes: ETAPES
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 32
    }
  }, /*#__PURE__*/React.createElement(ChiffresCles, {
    items: ["5× Europe", "1× Monde", "14× France"]
  }), /*#__PURE__*/React.createElement(Note, {
    ton: "sombre"
  }, "La lueur remonte et redescend le fil en six secondes. C'est le seul \xE9l\xE9ment anim\xE9 du site."), /*#__PURE__*/React.createElement(LienTrait, {
    ton: "sombre",
    onClick: () => setPage("formules")
  }, "Travailler ensemble"))));
}
Object.assign(window, {
  Parcours
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/site/Parcours.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Bouton = __ds_scope.Bouton;

__ds_ns.LienTrait = __ds_scope.LienTrait;

__ds_ns.Sceau = __ds_scope.Sceau;

__ds_ns.Annotation = __ds_scope.Annotation;

__ds_ns.CadreMedia = __ds_scope.CadreMedia;

__ds_ns.ChiffresCles = __ds_scope.ChiffresCles;

__ds_ns.Chrono = __ds_scope.Chrono;

__ds_ns.Formule = __ds_scope.Formule;

__ds_ns.Roofline = __ds_scope.Roofline;

__ds_ns.Silhouette = __ds_scope.Silhouette;

__ds_ns.GLYPHES = __ds_scope.GLYPHES;

__ds_ns.Icone = __ds_scope.Icone;

__ds_ns.Section = __ds_scope.Section;

__ds_ns.SelecteurLangue = __ds_scope.SelecteurLangue;

__ds_ns.COMPTES = __ds_scope.COMPTES;

__ds_ns.BarreReseaux = __ds_scope.BarreReseaux;

__ds_ns.RESEAUX = __ds_scope.RESEAUX;

__ds_ns.CADRES = __ds_scope.CADRES;

__ds_ns.NOMS_RESEAUX = __ds_scope.NOMS_RESEAUX;

__ds_ns.IconeReseau = __ds_scope.IconeReseau;

__ds_ns.CitationsEmpilees = __ds_scope.CitationsEmpilees;

__ds_ns.Emphase = __ds_scope.Emphase;

__ds_ns.Etiquette = __ds_scope.Etiquette;

__ds_ns.Lettrine = __ds_scope.Lettrine;

__ds_ns.Note = __ds_scope.Note;

__ds_ns.TexteChinois = __ds_scope.TexteChinois;

__ds_ns.TitreSection = __ds_scope.TitreSection;

})();
