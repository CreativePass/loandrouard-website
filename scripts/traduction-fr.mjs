// Version française de Video Feedback (adresse ?lang=fr ou bouton FR de l'en-tête), validée par Loan le 19/10.
// Appliquée par scripts/construire.mjs sur la COPIE public/, après toutes les autres corrections (jamais sur l'export).
// La version anglaise ne change pas : chaque texte anglais reste tel quel dans un bloc <sc-if value="{{ en }}">, le
// français est posé à côté dans <sc-if value="{{ fr }}"> (même principe que les pages légales, aucun élément ajouté).
// La langue est fixée à l'ouverture de la page : le bouton FR la recharge avec ?lang=fr. Les scripts de la page mesurent
// et retouchent le dessin une fois pour toutes (étude, cartes) : une bascule en direct les laisserait dans l'autre langue.
// Même garde-fou que les corrections : n = nombre d'occurrences attendues ; si un texte anglais change dans l'export, la
// construction s'arrête (traduction à mettre à jour). À reporter aussi dans Claude Design.
// Le pied de page (Sponsors.dc.html) et l'écran de chargement (chargement.js), communs à toutes les pages, suivent la
// langue de la page : les pages légales en français (?lang=fr) les affichent donc aussi en français.

const VF = ["Video Feedback.dc.html"];
const LEGALES = ["CGV.dc.html", "Privacy.dc.html", "Legal.dc.html"];
const PAGES_PUBLIEES = [...VF, ...LEGALES];
const SI = (en, fr) => `<sc-if value="{{ en }}" hint-placeholder-val="{{ true }}">${en}</sc-if><sc-if value="{{ fr }}" hint-placeholder-val="{{ false }}">${fr}</sc-if>`;
const NB = "&nbsp;"; // espace insécable (avant « : », dans « », entre un nombre et son unité)
// Groupe de mots gardé sur une même ligne (pas de mot seul en fin de puce sur les cartes).
const INSECABLE = (t) => t.replace(/ /g, NB);
// Langue lue dans l'adresse, avant tout affichage (page et écran de chargement).
const LIRE_FR = '(() => { try { return new URLSearchParams(location.search).get("lang") === "fr"; } catch (e) { return false; } })()';

// Textes de Video Feedback : [anglais, français, occurrences], entre deux balises, HTML compris (<br>, <em>, &nbsp;).
const TEXTES = [
  // En-tête (Home, The Journey et Press restent grisés et non cliquables).
  ["Home", "Accueil", 1],
  ["The Journey", "L’histoire", 1],
  ["Press / Contact", "Presse / Contact", 1],
  // Projecteur.
  ["For everyone", "Pour tous", 1],
  ["From beginner", "De débutant", 1],
  ["To pro", "À professionnel", 1],
  ["Your", "Votre", 1],
  ["routine,", "enchaînement,", 1],
  ["broken down", "décortiqué", 1],
  ["move by move", "geste par geste", 1],
  ["You film. You send. We analyze your problem together.", "Vous filmez. Vous envoyez. On analyse ensemble ce qui bloque.", 1],
  ["See pricing", "Voir les tarifs", 1],
  ["Three packages · from 49&nbsp;€", "Trois formules · dès 49&nbsp;€", 1],
  ["Scroll for everything included", "Faites défiler pour tout le détail", 1],
  ["Back to Loan", "Retour à Loan", 1],
  ["Scroll", "Défiler", 1],
  // Cartes (vitrine du projecteur et planche II).
  ["Single<br>feedback", "Analyse<br>unique", 2],
  ["3× feedback<br>pack", "Pack<br>3 analyses", 2],
  ["Quarterly<br>program", "Programme<br>trimestriel", 2],
  ["49&nbsp;€ · one full analysis", "49&nbsp;€ · analyse complète", 2],
  ["129&nbsp;€ · 3 full analyses", "129&nbsp;€ · trois analyses", 2],
  ["499&nbsp;€ · weekly coaching", "499&nbsp;€ · coaching hebdo", 2],
  ["Pay 49&nbsp;€", "Payer 49&nbsp;€", 2],
  ["Pay 129&nbsp;€", "Payer 129&nbsp;€", 2],
  ["Pay 499&nbsp;€", "Payer 499&nbsp;€", 2],
  ["Spots left", "Places restantes", 4],
  ["Written or voice feedback", "Retour écrit ou vocal", 4],
  ["Three analyses, progress tracked between them", "Trois analyses, avec le suivi de vos progrès de l’une à l’autre", 1],
  ["One analysis every week, priorities set together", "Une analyse chaque semaine, des priorités définies ensemble", 1],
  ["Renews automatically, cancel anytime", `Renouvelé automatiquement, ${INSECABLE("résiliable à tout moment")}`, 1],
  // Étude : dessin.
  ["CENTRE OF MASS", "CENTRE DE GRAVITÉ", 1],
  ["PL. I — STUDY OF A JUMP", "PL. I — ÉTUDE D’UN SAUT", 1],
  ["read at 0.25×, forty-two frames", "lue à 0,25×, quarante-deux images", 1],
  ["0.5", "0,5", 1],
  ["STUDY NO. 93", "ÉTUDE N° 93", 1],
  ["SCALE 1 : 12", "ÉCHELLE 1 : 12", 1],
  ["SHEET 1 / 1", "FEUILLE 1 / 1", 1],
  ["GAZE — THE INTENTION", "REGARD — L’INTENTION", 1],
  ["ahead of the blade, not at it", "au-delà de la lame, sans la fixer", 1],
  ["intention point", "point d’intention", 1],
  ["RIGHT SHOULDER — THE SUSPENSION", "ÉPAULE DROITE — LA SUSPENSION", 1],
  ["cut ahead, hold the arms", "couper devant, tenir les bras", 1],
  ["HIP AXIS — THE REACH", "AXE DES HANCHES — L’ALLONGE", 1],
  ["the chest leans off the pelvis", "le buste sort de l’axe du bassin", 1],
  ["HIP — HEEL · FULL EXTENSION", "HANCHE — TALON · EXTENSION COMPLÈTE", 1],
  ["ANKLE — THE DETAILS", "CHEVILLE — LES DÉTAILS", 1],
  ["point the foot", "pointer le pied", 1],
  ["force point", "point de force", 1],
  ["HIP LINE", "LIGNE DES HANCHES", 1],
  ["KNEE — THE ILLUSION", "GENOU — L’ILLUSION", 1],
  ["higher: more time in the air", `plus haut${NB}: plus de temps en l’air`, 1],
  ["The plan", "Le plan", 1],
  ["On paper.", "Sur le papier.", 1],
  ["The result", "Le résultat", 1],
  ["On the carpet.", "Sur le tapis.", 1],
  // Étude : textes (le surtitre « Sample analysis » est ensuite réécrit par le script de la page, voir SCRIPT).
  ["What to expect · ", "À quoi s’attendre · ", 1],
  ["Sample analysis", "Analyse type", 1],
  ["One jump. 42 frames.", "Un saut. 42 images.", 1],
  ["Barely a second in real time. Slowed to a quarter, it is read frame by frame, point by point.", "À peine une seconde en temps réel. Ralenti quatre fois, il se lit image par image, point par point.", 1],
  ["Scroll to see the analysis", "Faites défiler pour voir l’analyse", 1],
  ["The eyes lead the movement.", "Le regard guide le mouvement.", 1],
  ["The gaze pierces ahead of the blade, not at it.", "Le regard porte au-delà de la lame, sans la fixer.", 1],
  ["Gaze · the intention", "Regard · l’intention", 1],
  ["The arms make the pose.", "Les bras dessinent la pose.", 1],
  ["Cutting clearly ahead and holding the arms in place — that is what creates the flying effect.", `Couper franchement vers l’avant et tenir les bras en place${NB}: c’est ce qui donne l’impression de voler.`, 1],
  ["Right shoulder · the suspension", "Épaule droite · la suspension", 1],
  ["The hip makes the extension.", "La hanche crée l’extension.", 1],
  ["The chest should lean off the axis of the pelvis. This is where you reach for the intended cut.", "Le buste doit sortir de l’axe du bassin. C’est là que vous allez chercher la coupe visée.", 1],
  ["Axis · the reach", "Axe · l’allonge", 1],
  ["The movement ends at the toes.", "Tout finit au bout du pied.", 1],
  ["Full extension from hip to heel, then the ankle flexes and the line breaks. A pointed foot finishes the whole movement and shows care for detail.", "L’extension est complète de la hanche au talon, puis la cheville fléchit et la ligne se casse. Un pied pointé achève le mouvement entier et montre le souci du détail.", 1],
  ["Ankle · the details", "Cheville · les détails", 1],
  ["Tuck as high as you can.", "Le genou, au plus haut.", 1],
  ["The front knee sits under the hip line. Drawn higher, it lifts the whole silhouette and creates the impression of “time in the air”.", `Le genou avant est sous la ligne des hanches. Monté plus haut, il soulève toute la silhouette et donne l’impression de «${NB}rester en l’air${NB}».`, 1],
  ["Knee · the “illusion”", `Genou · l’«${NB}illusion${NB}»`, 1],
  ["Putting the pieces together.", "Tout rassembler.", 1],
  ["Step by step, the mechanics are stitched together, each with its exercise and what to watch for. Your full routine gets the same reading, section by section.", "Étape par étape, les mécaniques s’assemblent, chacune avec son exercice et ses points de vigilance. Votre enchaînement complet bénéficie de la même lecture, partie par partie.", 1],
  ["Priority", "Priorité", 1],
  ["Rear leg", "Jambe arrière", 2],
  ["Focus", "À travailler", 1],
  ["The arms", "Les bras", 1],
  ["Keep in mind", "À retenir", 1],
  ["The intention through the toes", "L’intention jusqu’aux orteils", 1],
  ["Frame ", "Image ", 1],
  ["Full frame", "Plan large", 1],
  ["Gaze", "Regard", 1],
  ["Arm line", "Ligne des bras", 1],
  ["Hip axis", "Axe des hanches", 1],
  ["Front knee", "Genou avant", 1],
  ["The whole", "L’ensemble", 1],
  ["0.25× · slow motion", "0,25× · ralenti", 1],
  // Planche II.
  ["Pl. II — The packages", "Pl. II — Les formules", 1],
  ["All exchanges take place on WhatsApp.", "Tous les échanges se font sur WhatsApp.", 1],
  ["Choose · send · receive professional feedback", "Choisissez · envoyez · recevez l’avis d’un pro", 1],
  ["Three ways to work together.", "Trois façons de travailler ensemble.", 1],
  ["The same analysis for all levels: beginner, intermediate, professional.", `Une même analyse pour tous${NB}: débutant, intermédiaire, professionnel.`, 1],
  ["Technique, rhythm, jumps, transitions", "Technique, rythme, sauts, transitions", 3],
  ["Grade A and C corrections", "Corrections des notes A et C", 3],
  ["Reply in 4 to 6 days", `Réponse sous 4 à 6${NB}jours`, 1],
  ["Reply in 3 to 5 days", `Réponse sous 3 à 5${NB}jours`, 1],
  ["Reply in 2 to 3 days", `Réponse sous 2 à 3${NB}jours`, 1],
  ["In the pack", "Dans le pack", 1],
  ["Three analyses, whenever you need them", "Trois analyses, quand vous le souhaitez", 1],
  ["Targeted exercises after each video", "Exercices ciblés après chaque vidéo", 2],
  ["Progress tracked from one video to the next", `Suivi de vos progrès d’une vidéo ${INSECABLE("à l’autre")}`, 2],
  ["Grade B suggestions on top", "Suggestions note B en plus", 2],
  ["Valid 6 months from your first video", `Valable 6${NB}mois dès votre première vidéo`, 1],
  ["Renews every 3 months, cancel anytime", `Renouvelé tous les 3${NB}mois, ${INSECABLE("résiliable à tout moment")}`, 1],
  ["Also included", "Également inclus", 1],
  ["In the program", "Dans le programme", 1],
  ["One analysis every single week", "Une analyse chaque semaine, sans faute", 1],
  ["Priorities set together each week", `Priorités définies ensemble ${INSECABLE("chaque semaine")}`, 1],
  ["Written check-ins whenever you need", "Échanges écrits à la demande", 1],
  ["Final review, and a plan going forward", "Bilan final et plan pour la suite", 1],
  ["Secure payment · receipt by email · exchanges on WhatsApp · <a href=\"CGV.dc.html\" style=\"color:inherit;text-decoration:underline;text-underline-offset:3px\">Terms of sale</a>",
    "Paiement sécurisé · reçu par e-mail · échanges sur WhatsApp · <a href=\"CGV.dc.html?lang=fr\" style=\"color:inherit;text-decoration:underline;text-underline-offset:3px\">CGV</a>", 1],
  // Face « après paiement » (nom et délai de la formule : voir SCRIPT).
  ["{{ formuleNom }} · unlocked", "{{ formuleNom }} · {{ formuleDebloque }}", 3],
  ["Send your video<br>on WhatsApp", "Envoyez votre vidéo<br>sur WhatsApp", 3],
  ["Open WhatsApp", "Ouvrir WhatsApp", 3],
  ["Or scan it with your phone", "Ou scannez-le avec votre téléphone", 3],
  ["Attach your video as a <em>document</em>, not from your gallery — the quality stays intact.", `Joignez votre vidéo comme <em>document</em>, et non depuis votre galerie${NB}: sa qualité reste intacte.`, 3],
  ["Send your videos for analysis.", "Envoyez vos vidéos pour analyse.", 3],
  ["3 videos under 30 s, or 2 under 2 minutes.", `3 vidéos de moins de 30${NB}s, ou 2 de moins de 2${NB}minutes.`, 3],
  ["{{ delaiTexte }} · Link also in your confirmation email", "{{ delaiTexte }} · Lien aussi dans votre e-mail de confirmation", 3],
  ["Manage or cancel your subscription", "Gérer ou résilier votre abonnement", 1],
  // Fenêtre de paiement (le bouton Close de la carte ouverte sur mobile est dans le script : voir SCRIPT).
  ["Close", "Fermer", 1],
];

// Textes lus par les lecteurs d'écran : [attribut, anglais, français, occurrences]. Le gabarit lit tr['anglais'] ;
// en anglais, tr renvoie le texte d'origine.
const ATTRIBUTS = [
  ["aria-label", "On this page", "Sur cette page", 1],
  ["aria-label", "Packages and pricing", "Formules et tarifs", 1],
  ["alt", "Loan Drouard, high kick, alone in a spotlight", "Loan Drouard, coup de pied haut, dans le faisceau d’un projecteur", 1],
  ["alt", "Pencil study of a jump, read frame by frame", "Étude au crayon d’un saut, lue image par image", 1],
  ["aria-label", "Full frame", "Plan large", 1],
  ["aria-label", "Gaze", "Regard", 1],
  ["aria-label", "Arm line", "Ligne des bras", 1],
  ["aria-label", "Hip axis", "Axe des hanches", 1],
  ["aria-label", "Rear leg", "Jambe arrière", 1],
  ["aria-label", "Front knee", "Genou avant", 1],
  ["aria-label", "The whole", "L’ensemble", 1],
  ["aria-label", "QR code that opens WhatsApp", "QR code pour ouvrir WhatsApp", 3],
  ["aria-label", "Payment", "Paiement", 1],
];
for (const [, en] of ATTRIBUTS) if (/['"]/.test(en)) throw new Error(`traduction-fr.mjs : guillemet dans « ${en} » (clé de tr)`);
const TR = Object.fromEntries(ATTRIBUTS.map(([, en, fr]) => [en, fr]));

// Script de Video Feedback : langue, sommaire, formules, textes écrits par le script, bouton de langue.
const SCRIPT = [
  { quoi: "langue de la page et textes des attributs", n: 1,
    avant: 'const API = "https://loan-api.loandrouard-website.workers.dev";\n',
    apres: 'const API = "https://loan-api.loandrouard-website.workers.dev";\n' +
      "/* Version française (scripts/traduction-fr.mjs) : ?lang=fr, lue une fois à l'ouverture (le bouton FR recharge la page). */\n" +
      `const FR = ${LIRE_FR};\n` +
      'if (FR) document.documentElement.lang = "fr";\n' +
      `const TRAD = Object.fromEntries(Object.entries(${JSON.stringify(TR)}).map(([en, fr]) => [en, FR ? fr : en]));\n` },
  { quoi: "sommaire", n: 1,
    avant: '  { id: "hero", num: "I", nom: "Opening" },\n  { id: "what-is-it", num: "II", nom: "What is It" },\n  { id: "for-who", num: "III", nom: "For Who" },\n' +
      '  { id: "analysis", num: "IV", nom: "What to Expect" },\n  { id: "formules", num: "V", nom: "Pricing" },\n',
    apres: '  { id: "hero", num: "I", nom: FR ? "Ouverture" : "Opening" },\n  { id: "what-is-it", num: "II", nom: FR ? "Qu\\u2019est-ce que c\\u2019est\\u202F?" : "What is It" },\n' +
      '  { id: "for-who", num: "III", nom: FR ? "Pour qui\\u202F?" : "For Who" },\n' +
      '  { id: "analysis", num: "IV", nom: FR ? "\\u00C0 quoi s\\u2019attendre" : "What to Expect" },\n  { id: "formules", num: "V", nom: FR ? "Tarifs" : "Pricing" },\n' },
  // achat : la formule dans le message WhatsApp ; debloque : « … · débloqué(e) » (accord avec le nom).
  { quoi: "noms et délais des formules", n: 1,
    avant: '  single: { nom: "Single feedback", prix: "49\\u00A0\\u20AC", delai: "4 to 6 days" },\n' +
      '  pack: { nom: "3\\u00D7 feedback pack", prix: "129\\u00A0\\u20AC", delai: "3 to 5 days" },\n' +
      '  prog: { nom: "Quarterly program", prix: "499\\u00A0\\u20AC", delai: "2 to 3 days" },\n',
    apres: '  single: { nom: FR ? "Analyse unique" : "Single feedback", prix: "49\\u00A0\\u20AC", delai: FR ? "4 \\u00E0 6\\u00A0jours" : "4 to 6 days", achat: "l\\u2019Analyse unique", debloque: "d\\u00E9bloqu\\u00E9e" },\n' +
      '  pack: { nom: FR ? "Pack 3 analyses" : "3\\u00D7 feedback pack", prix: "129\\u00A0\\u20AC", delai: FR ? "3 \\u00E0 5\\u00A0jours" : "3 to 5 days", achat: "le Pack 3 analyses", debloque: "d\\u00E9bloqu\\u00E9" },\n' +
      '  prog: { nom: FR ? "Programme trimestriel" : "Quarterly program", prix: "499\\u00A0\\u20AC", delai: FR ? "2 \\u00E0 3\\u00A0jours" : "2 to 3 days", achat: "le Programme trimestriel", debloque: "d\\u00E9bloqu\\u00E9" },\n' },
  { quoi: "surtitre de l'étude écrit au défilement", n: 1,
    avant: 'num.textContent = i === 0 ? "Sample analysis" : ',
    apres: 'num.textContent = i === 0 ? (FR ? "Analyse type" : "Sample analysis") : ' },
  // Avant le texte « Close » de la fenêtre de paiement (TEXTES) : ce bouton-ci est écrit par le script.
  { quoi: "bouton Close de la carte ouverte (mobile)", n: 1,
    avant: 'fermerBtn.innerHTML = "<span>Close</span>',
    apres: 'fermerBtn.innerHTML = "<span>" + (FR ? "Fermer" : "Close") + "</span>' },
  { quoi: "message WhatsApp pré-rempli", n: 1,
    avant: '    const message = "Hi Loan, I just purchased the " + f.nom + ". Here\\u2019s my video for the analysis.";\n',
    apres: '    const message = FR ? "Bonjour Loan, je viens d\\u2019acheter " + f.achat + ". Voici ma vid\\u00E9o pour l\\u2019analyse."\n' +
      '      : "Hi Loan, I just purchased the " + f.nom + ". Here\\u2019s my video for the analysis.";\n' },
  { quoi: "guillemets du message WhatsApp", n: 1,
    avant: '      messageWhatsApp: "\\u201C" + message + "\\u201D",\n',
    apres: '      messageWhatsApp: FR ? "\\u00AB\\u00A0" + message + "\\u00A0\\u00BB" : "\\u201C" + message + "\\u201D",\n' },
  { quoi: "délai de réponse de la carte payée", n: 1,
    avant: '      delaiTexte: "Reply in " + f.delai,\n',
    apres: '      delaiTexte: (FR ? "R\\u00E9ponse sous " : "Reply in ") + f.delai,\n' },
  { quoi: "valeurs de langue du gabarit", n: 1,
    avant: "      vrai: true,\n",
    apres: "      vrai: true,\n" +
      '      en: !FR, fr: FR, tr: TRAD, langue: FR ? "fr" : "en", suffixeLangue: FR ? "?lang=fr" : "", formuleDebloque: f.debloque,\n' +
      "      /* EN / FR : la page est rechargée dans l'autre langue (中文 : à venir). */\n" +
      '      changerLangue: (code) => { if ((code !== "fr" && code !== "en") || code === (FR ? "fr" : "en")) return;\n' +
      '        try { const u = new URL(location.href); if (code === "fr") u.searchParams.set("lang", "fr"); else u.searchParams.delete("lang"); u.hash = ""; location.assign(u.href); } catch (e) {} },\n' },
  { quoi: "bouton de langue de l'en-tête", n: 1,
    avant: '<x-import component-from-global-scope="LoanDrouardDesignSystem_06a79c.SelecteurLangue" ton="sombre" langue="en" hint-size="150px,20px">',
    apres: '<x-import component-from-global-scope="LoanDrouardDesignSystem_06a79c.SelecteurLangue" ton="sombre" langue="{{ langue }}" onChange="{{ changerLangue }}" hint-size="150px,20px">' },
  { quoi: "lien Video Feedback de l'en-tête dans la langue de la page", n: 1,
    avant: '<a class="ld-balaie" href="Video Feedback.dc.html" style="color:inherit;text-decoration:none;border:0">',
    apres: '<a class="ld-balaie" href="Video Feedback.dc.html{{ suffixeLangue }}" style="color:inherit;text-decoration:none;border:0">' },
];

// Pied de page commun (Sponsors.dc.html) : langue de la page hôte (attribut lang de <html>, ou ?lang= avant qu'il soit posé).
// Sur les pages légales, la langue change sans recharger : le pied de page suit l'attribut lang.
const PIED = [
  { quoi: "langue de la page hôte suivie", n: 1,
    avant: "  componentDidMount() {\n    setTimeout(() => this.init(), 0);\n",
    apres: "  componentDidMount() {\n    setTimeout(() => this.init(), 0);\n" +
      "    /* Version française (scripts/traduction-fr.mjs) : le pied de page suit la langue de la page (attribut lang de <html>). */\n" +
      '    if (window.MutationObserver) { this._lang = new MutationObserver(() => this.forceUpdate()); this._lang.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] }); }\n' },
  { quoi: "observation de la langue arrêtée au démontage", n: 1,
    avant: "  componentWillUnmount() { if (this._off) this._off(); clearInterval(this._attente); }",
    apres: "  componentWillUnmount() { if (this._off) this._off(); clearInterval(this._attente); if (this._lang) this._lang.disconnect(); }" },
  { quoi: "langue lue au rendu", n: 1,
    avant: "    const C = this.comptes() || [];\n",
    apres: "    const C = this.comptes() || [];\n" +
      '    let fr = false; try { fr = (document.documentElement.lang || new URLSearchParams(location.search).get("lang")) === "fr"; } catch (e) {}\n' },
  // data-famille garde le nom anglais (repère des styles du pied de page mobile, scripts/construire.mjs) ; seul l'affichage change.
  { quoi: "noms des familles de réseaux", n: 1,
    avant: "const familles = FAMILLES.map((f) => ({ titre: f.titre, hanzi: f.hanzi, ",
    apres: 'const familles = FAMILLES.map((f) => ({ titre: f.titre, nom: (fr && { China: "Chine", Global: "International" }[f.titre]) || f.titre, hanzi: f.hanzi, ' },
  { quoi: "nom de famille affiché", n: 1,
    avant: 'text-transform:uppercase">{{ f.titre }}</span>', apres: 'text-transform:uppercase">{{ f.nom }}</span>' },
  { quoi: "surtitre et valeurs de langue", n: 1,
    avant: '      surtitre: this.props.surtitre ?? "Powered by",\n',
    apres: '      surtitre: fr ? "Avec le soutien de" : this.props.surtitre ?? "Powered by",\n' +
      '      en: !fr, fr, suffixeLangue: fr ? "?lang=fr" : "", ariaLegal: fr ? "Informations l\\u00E9gales" : "Legal",\n' },
  { quoi: "navigation légale (lecteurs d'écran)", n: 1,
    avant: '<nav aria-label="Legal" ', apres: '<nav aria-label="{{ ariaLegal }}" ' },
  ...[["CGV", "Terms of sale", "CGV"], ["Privacy", "Privacy", "Confidentialité"], ["Legal", "Legal notice", "Mentions légales"]].map(([p, en, fr]) => ({
    quoi: `lien ${en}`, n: 1,
    avant: `<a class="ld-balaie" href="${p}.dc.html" style="color:#A9A59A;text-decoration:none;border:0">${en}</a>`,
    apres: `<a class="ld-balaie" href="${p}.dc.html{{ suffixeLangue }}" style="color:#A9A59A;text-decoration:none;border:0">${SI(en, fr)}</a>` })),
];

// Écran de chargement (chargement.js, toutes les pages) : mots et libellé en français sur ?lang=fr ; nouvelle version (cache d'un an).
const CHARGEMENT = [
  { quoi: "mots de l'écran de chargement", fichiers: ["chargement.js"], n: 1,
    avant: '  const MOTS = ["Wushu", "Discipline", "Precision", "Performance", "Vision", "Heritage", "Journey"];\n',
    apres: "  /* Version française (scripts/traduction-fr.mjs) : mots et libellé en français sur ?lang=fr. */\n" +
      `  const FR = ${LIRE_FR};\n` +
      '  const MOTS = FR ? ["Wushu", "Discipline", "Pr\\u00E9cision", "Performance", "Vision", "H\\u00E9ritage", "Parcours"]\n' +
      '    : ["Wushu", "Discipline", "Precision", "Performance", "Vision", "Heritage", "Journey"];\n' },
  { quoi: "libellé de l'écran de chargement (lecteurs d'écran)", fichiers: ["chargement.js"], n: 1,
    avant: 'aria-label="Loading"', apres: 'aria-label="${FR ? "Chargement" : "Loading"}"' },
  // Préfixe ajouté au numéro de version, quel qu'il soit (7p avec les optimisations, 7 sans).
  ...PAGES_PUBLIEES.map((f) => ({ quoi: "écran de chargement : nouvelle version (cache)", fichiers: [f], n: 1,
    avant: "chargement.js?v=", apres: "chargement.js?v=fr" })),
];

// Pages légales : le lien Video Feedback de l'en-tête ouvre la page dans la langue choisie.
const LIENS_LEGALES = LEGALES.flatMap((f) => [
  { quoi: "lien Video Feedback dans la langue de la page", fichiers: [f], n: 1,
    avant: '<a class="ld-balaie" href="Video Feedback.dc.html" style="color:inherit;opacity:.64;text-decoration:none;border:0">',
    apres: '<a class="ld-balaie" href="Video Feedback.dc.html{{ suffixeLangue }}" style="color:inherit;opacity:.64;text-decoration:none;border:0">' },
  { quoi: "suffixe de langue des liens", fichiers: [f], n: 1,
    avant: '      versEn: () => this.changerLangue("en"),\n',
    apres: '      versEn: () => this.changerLangue("en"),\n      suffixeLangue: l === "fr" ? "?lang=fr" : "", /* Version française (scripts/traduction-fr.mjs). */\n' },
]);

const fr = (c, fichiers) => ({ ...c, quoi: "Version française : " + c.quoi, fichiers: c.fichiers || fichiers });
export const TRADUCTION = [
  ...SCRIPT.map((c) => fr(c, VF)),
  ...TEXTES.map(([en, t, n]) => fr({ quoi: en.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(), n, avant: `>${en}<`, apres: `>${SI(en, t)}<` }, VF)),
  ...ATTRIBUTS.map(([a, en, , n]) => fr({ quoi: `${a} « ${en} »`, n, avant: `${a}="${en}"`, apres: `${a}="{{ tr['${en}'] }}"` }, VF)),
  ...PIED.map((c) => fr(c, ["Sponsors.dc.html"])),
  ...CHARGEMENT.map((c) => fr(c)),
  ...LIENS_LEGALES.map((c) => fr(c)),
];
// Textes anglais de la page, pour le contrôle de la version française (aucun ne doit rester affiché).
export const TEXTES_ANGLAIS = [...TEXTES.map(([en]) => en), ...ATTRIBUTS.map(([, en]) => en)];
