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

import crypto from "node:crypto";

const VF = ["Video Feedback.dc.html"];
const LEGALES = ["CGV.dc.html", "Privacy.dc.html", "Legal.dc.html"];
const PAGES_PUBLIEES = [...VF, ...LEGALES];
const SI = (en, fr) => `<sc-if value="{{ en }}" hint-placeholder-val="{{ true }}">${en}</sc-if><sc-if value="{{ fr }}" hint-placeholder-val="{{ false }}">${fr}</sc-if>`;
const NB = "&nbsp;"; // espace insécable (avant « : », dans « », entre un nombre et son unité)
// Groupe de mots gardé sur une même ligne (pas de mot seul en fin de puce sur les cartes).
const INSECABLE = (t) => t.replace(/ /g, NB);
// Langue lue dans l'adresse, avant tout affichage (page et écran de chargement).
const LIRE_FR = '(() => { try { return new URLSearchParams(location.search).get("lang") === "fr"; } catch (e) { return false; } })()';

// Bouton des cartes (retour de Loan des 27 et 28/10 : « Pay » va trop droit au but) : un texte par formule, choisi par Loan,
// en français naturel et engageant (première personne, comme sur la plupart des sites français) : [prix, anglais, français].
// Textes courts : sur mobile, le bouton tient à côté du « + » de la petite carte dès 360 px de large (« Recevoir mon analyse »
// ou « Commencer le programme » n'y tenaient qu'à partir de 390 px). Essais écartés : « Select · 49 € », « Choose this package ».
// (« Get a feedback » demandé : « Get feedback », feedback ne prenant pas d'article en anglais.)
// 30/10, nouveaux textes des cartes (Loan) : « Analyser mes vidéos », « Obtenir le Pack », « Commencer mon Suivi » (31/10) ;
// sur les petites cartes mobiles, le texte passe sur deux lignes s'il ne tient pas à côté du « + ».
export const BOUTONS = [
  ["49", "Analyze My Videos", "Analyser mes vidéos"],
  ["129", "Get the Pack", "Obtenir le Pack"],
  ["499", "Start My Coaching", "Commencer mon Suivi"], // 31/10 : « Commencer mon Suivi Performance » faisait un bouton trop gros
];
// Envoi des vidéos (cartes et carte payée, 30/10).
const ENVOI_FR = `2 vidéos de 2${NB}minutes maximum chacune ou 3 vidéos de 45${NB}secondes maximum chacune`;
const ENVOI_EN = "2 videos, 2 minutes max each or 3 videos, 45 seconds max each";

// Textes de Video Feedback : [anglais, français, occurrences], entre deux balises, HTML compris (<br>, <em>, &nbsp;).
// En-tête (Home, The Journey et Press restent grisés et non cliquables), aussi sur les pages légales.
const ENTETE = [
  ["Home", "Accueil", 1],
  ["The Journey", "L’histoire", 1],
  ["Press / Contact", "Presse / Contact", 1],
];
const TEXTES = [
  ...ENTETE,
  // Projecteur.
  ["For everyone", "Pour tous", 1],
  ["From beginner", "De débutant", 1],
  ["To pro", "À professionnel", 1],
  ["Your", "Votre", 1],
  ["routine,", "enchaînement,", 1],
  ["broken down", "décortiqué", 1],
  ["move by move", "geste par geste", 1],
  ["You film. You send. We analyze your problem together.", "Vous filmez. Vous envoyez. On analyse ensemble les points à améliorer.", 1],
  ["See the options", "Voir les options", 1], // 27/10 : « See pricing » / « Voir les tarifs », puis « Voir les formules » (28/10 : « Voir les options », demandé par Loan)
  // Offre de lancement (29/10, scripts/construire.mjs) : « Launch offer » sous See the options et, depuis le 30/10, à côté de la
  // réduction sur les 6 cartes (vitrine et planche II).
  ["Launch offer", "Offre de lancement", 7],
  ["Three packages", "Trois formules", 1],
  [" · from {{ prixMin }}", " · dès {{ prixMin }}", 1],
  ["Scroll for everything included", "Faites défiler pour tout le détail", 1],
  ["Back to Loan", "Retour à Loan", 1],
  ["Scroll", "Défiler", 1],
  // Cartes (vitrine du projecteur et planche II). Noms des formules du 30/10 (Loan).
  ["Technical <br>analysis", "Analyse <br>technique", 2],
  ["Progression <br>pack", "Pack <br>évolution", 2],
  ["The way of <br>performance", "Suivi <br>performance", 2],
  [" · one full analysis", " · analyse complète", 1],
  [" · 3 full analyses", " · trois analyses", 1],
  [" · weekly coaching", " · coaching hebdo", 1],
  // Boutons des cartes (27–28/10, « Pay » remplacé dans scripts/construire.mjs) : BOUTONS, ci-dessus.
  ...BOUTONS.map(([, en, fr]) => [en, fr, 2]), // vitrine et planche II
  ["See full details", "Voir tous les détails", 3], // 27/10 : sous les cartes de la vitrine
  ["Spots left", "Places restantes", 4],
  // Étude : dessin.
  ["CENTRE OF MASS", "CENTRE DE GRAVITÉ", 1],
  ["PL. I — STUDY OF A JUMP", "PL. I — ÉTUDE D’UN SAUT", 1],
  ["read at 0.25×, forty-two frames", "lue à 0,25×, 42 images", 1],
  ["0.5", "0,5", 1],
  ["STUDY NO. 93", "ÉTUDE N° 93", 1],
  ["SCALE 1 : 12", "ÉCHELLE 1 : 12", 1],
  ["SHEET 1 / 1", "FEUILLE 1 / 1", 1],
  ["GAZE — THE INTENTION", "REGARD — L’INTENTION", 1],
  ["ahead of the blade, not at it", "au-delà de la lame, sans la fixer", 1],
  ["intention point", "point d’intention", 1],
  ["RIGHT SHOULDER — THE SUSPENSION", "ÉPAULE DROITE — LA SUSPENSION", 1],
  ["cut ahead, hold the arms", "couper devant, tenir les bras", 1],
  ["HIP AXIS — THE REACH", "HANCHES — L’ALLONGE", 1],
  ["the chest leans off the pelvis", "le buste sort de l’axe du bassin", 1],
  ["HIP — HEEL · FULL EXTENSION", "HANCHE — TALON · EXTENSION", 1],
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
  ["What to expect · ", "Concrètement · ", 1],
  ["Sample analysis", "Analyse type", 1],
  ["One jump. 42 frames.", "Un saut. Plein de détails.", 1],
  ["Barely a second in real time. Slowed to a quarter, it is read frame by frame, point by point.", `À peine une seconde en temps réel. Ralenti quatre fois${NB}: une analyse image par image, point par point.`, 1],
  ["Scroll to see the analysis", "Faites défiler pour voir l’analyse", 1],
  ["The eyes lead the movement.", "Le regard guide le mouvement.", 1],
  ["The gaze pierces ahead of the blade, not at it.", "Le regard porte au-delà de la lame, sans la fixer.", 1],
  ["Gaze · the intention", "Regard · l’intention", 1],
  ["The arms make the pose.", "Les bras dessinent la pose.", 1],
  ["Cutting clearly ahead and holding the arms in place — that is what creates the flying effect.", `Couper franchement vers l’avant et maintenir les bras en place${NB}: c’est ce qui donne cette impression de flottement.`, 1],
  ["Right shoulder · the suspension", "Épaule droite · la suspension", 1],
  ["The hip makes the extension.", "La hanche crée l’extension.", 1],
  ["The chest should lean off the axis of the pelvis. This is where you reach for the intended cut.", "Le buste s’allonge dans l’axe du bassin. C’est là qu’on va chercher notre point de coupe.", 1],
  ["Axis · the reach", "Axe · l’allonge", 1],
  ["The movement ends at the toes.", "Le mouvement se termine au bout du pied.", 1],
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
  ["Choose · send · receive professional feedback", "Choisissez · envoyez · recevez un retour professionnel", 1],
  ["Three ways to work together.", "Trois façons de travailler ensemble.", 1],
  // 30/10 (Loan) : « Une analyse adaptée à votre niveau et à vos objectifs » au lieu de « Une même analyse pour tous ».
  ["An analysis tailored to your level and your goals: beginner, intermediate or professional.", `Une analyse adaptée à votre niveau et à vos objectifs${NB}: débutant, intermédiaire ou professionnel.`, 1],
  // Cartes de la planche II, textes de Loan du 30/10 (anglais de Loan ; structure : scripts/construire.mjs, FICHES).
  [" / quarter", " / trimestre", 1],
  ["2 videos analyzed so you know what to improve and how.", "2 vidéos analysées pour savoir quoi améliorer et comment.", 1],
  ["6 videos analyzed across 3 feedback rounds, so you can practice, adjust and improve.", "6 vidéos analysées en 3 retours, pour pratiquer, ajuster et progresser.", 2], // carte et vitrine (31/10)
  ["24 videos analyzed over 12 weeks, to develop your practice effectively.", `24 vidéos analysées en 12${NB}semaines, pour faire évoluer votre pratique efficacement.`, 2], // carte et vitrine (31/10)
  ["Send your taolu, your jumps or a specific section for more detail on particular elements.", "Envoyez votre taolu, vos sauts ou une partie ciblée pour plus de détails sur des éléments spécifiques.", 2], // carte et vitrine (31/10)
  ["I analyze your videos based on your level and your goals:", `J’analyse vos vidéos selon votre niveau et vos objectifs${NB}:`, 1],
  ["Your strengths and your priority corrections.", "Vos points forts et vos corrections prioritaires.", 1],
  ["Specific advice on technique, jumps, rhythm or transitions, depending on your needs.", "Des conseils précis sur la technique, les sauts, le rythme ou les transitions, selon vos besoins.", 1],
  ["Advice mainly focused on the A and C scores", "Conseils principalement axés sur les notes A et C", 1],
  ["Develop your taolu, specific sections or jumps with three personalized feedback rounds on 2 videos each, spaced out to fit your pace.",
    "Faites évoluer votre taolu, des parties ou des sauts ciblés grâce à trois retours personnalisés sur 2 vidéos chacun, espacés selon votre rythme.", 1],
  ["A detailed technical analysis of each of your videos.", "Une analyse technique détaillée de chacune de vos vidéos.", 1],
  ["Specific advice on technique, jumps, speed, presence, rhythm, style or transitions, depending on your needs.",
    "Des conseils précis sur la technique, les sauts, la vitesse, la présence, le rythme, le style ou les transitions, selon vos besoins.", 1],
  ["Tracking of your progress from one feedback round to the next.", "Un suivi de vos progrès d’un retour à l’autre.", 1],
  ["Explained corrections and targeted drills after each round.", "Des corrections expliquées et des exercices ciblés après chaque retour.", 1],
  ["Advice and focus on the B score, in addition to the A and C scores", "Conseils et focus sur la note B, en plus des notes A et C", 1],
  ["Already had a Technical Analysis? Its {{ prixSingle }} is deducted from the Pack if you get it within 30 days.",
    `Vous avez déjà pris une Analyse Technique${NB}? Ses {{ prixSingle }} sont déduits du Pack si vous le prenez dans les 30${NB}jours.`, 1],
  ["One-on-one coaching, week after week, to work on everything you want to improve and progress as effectively as possible.",
    "Un suivi individuel, semaine après semaine, pour travailler tout ce que vous souhaitez améliorer et faire progresser de manière optimale.", 1],
  ["24 personalized analyses: 2 videos per week.", `24 analyses personnalisées${NB}: 2 vidéos par semaine.`, 1],
  ["Key areas to work on, defined at the start of the quarter.", "Définition des axes à travailler au début du trimestre.", 1],
  ["Ongoing support and weekly tracking of your corrections and progress.", "Accompagnement &amp; suivi continu des corrections et de la progression chaque semaine.", 1],
  ["Training priorities and technical details set each week.", "Les points prioritaires à corriger, identifiés à chaque retour.", 1],
  ["Q&amp;A on WhatsApp after each feedback session.", "Questions-réponses sur WhatsApp après chaque retour.", 1],
  ["Final review with recommendations for what comes next.", "Bilan final avec des recommandations pour la suite.", 1],
  // Bento (petits rectangles sous le bouton).
  ["One-time payment", "Paiement unique", 2],
  ["Quarterly subscription", "Abonnement trimestriel", 1],
  ["Limited spots", "Places limitées", 1],
  ["3 per quarter", "3 par trimestre", 1],
  ["Turnaround", "Délai de réponse", 3],
  ["4 to 6 days", `4 à 6${NB}jours`, 1],
  ["3 to 5 days per feedback round", `3 à 5${NB}jours par retour`, 1],
  ["Priority handling, within 48 to 72 hours", `Traitement prioritaire, sous 48 à 72${NB}h`, 1],
  ["Feedback format", "Format de réponse", 3],
  ["Written or voice message", "Écrit ou vocal", 2],
  ["Written, voice or video", "Écrit, vocal ou vidéo", 1],
  ["Feedback language", "Langue du retour", 3],
  ["French or English", "Français ou anglais", 3],
  ["Submission", "Envoi", 3],
  [ENVOI_EN, ENVOI_FR, 1],
  [ENVOI_EN + ", per round", ENVOI_FR + ", par retour", 1],
  [ENVOI_EN + ", per feedback session", ENVOI_FR + ", par retour", 1],
  // Bulles ⓘ (INFOS, scripts/construire.mjs).
  ["A score", "Note A", 2],
  ["B score", "Note B", 2],
  ["C score", "Note C", 2],
  ["Quality of the technical movements.", "La qualité des mouvements techniques.", 2],
  ["Overall performance (power, rhythm, style).", "La performance d’ensemble (puissance, rythme, style).", 2],
  ["Jumps and difficulty.", "Les sauts et la difficulté.", 2],
  ["Validity", "Validité", 1],
  ["Your 3 feedback rounds can be used within 6 months of your first video. Each round is delivered within 3 to 5 days.",
    `Vos 3 retours sont utilisables pendant 6${NB}mois à compter de votre première vidéo. Chaque retour est transmis sous 3 à 5${NB}jours.`, 1],
  ["Keep progressing", "Poursuivre votre progression", 1],
  ["Your subscription renews automatically at the end of each quarter. You can cancel at any time by simply sending us a message or an email before the next billing date. At the end of the 12 weeks, we review your progress and your goals for the next quarter together.",
    `Votre abonnement est renouvelé automatiquement à la fin de chaque trimestre, vous pouvez le résilier à tout moment simplement en nous envoyant un message ou mail avant la prochaine échéance. À la fin des 12${NB}semaines, nous faisons le point ensemble sur vos progrès et vos objectifs pour le trimestre suivant.`, 1],
  ["Unused weeks", "Semaines non utilisées", 1],
  ["Up to 2 weeks can be carried over to another week of the quarter.", `Jusqu’à 2${NB}semaines peuvent être reportées sur une autre semaine du trimestre.`, 1],
  ["Secure payment · receipt by email · exchanges on WhatsApp · <a href=\"CGV.dc.html\" style=\"color:inherit;text-decoration:underline;text-underline-offset:3px\">Terms of sale</a>",
    "Paiement sécurisé · reçu par e-mail · échanges sur WhatsApp · <a href=\"CGV.dc.html?lang=fr\" style=\"color:inherit;text-decoration:underline;text-underline-offset:3px\">CGV</a>", 1],
  // Face « après paiement » (nom et délai de la formule : voir SCRIPT).
  ["{{ formuleNom }} · unlocked", "{{ formuleNom }} · {{ formuleEtat }}", 3],
  ["Send your video<br>on WhatsApp", "Votre vidéo<br>sur WhatsApp", 3],
  ["Open WhatsApp", "Ouvrir WhatsApp", 3],
  ["Or scan it with your phone", "Ou scannez-le avec votre mobile", 3],
  ["Attach your video as a <em>document</em>, not from your gallery — the quality stays intact.", `Joignez votre vidéo comme <em>document</em>, et non depuis votre galerie${NB}: sa qualité ${INSECABLE("reste intacte.")}`, 3],
  ["Send your videos for analysis.", "Envoyez vos vidéos pour analyse.", 3],
  [ENVOI_EN + ".", ENVOI_FR + ".", 3], // 30/10 : comme sur les cartes (avant : 3 vidéos de moins de 30 s, ou 2 de moins de 2 min)
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
  ["aria-label", "More information", "Plus d’informations", 5], // bulles ⓘ des cartes (30/10)
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
  // achat : la formule dans le message WhatsApp ; etat : « … · activé(e) » sur la carte payée (accord avec le nom ; « débloqué »
  // passait sur deux lignes dans la carte du programme, sur ordinateur).
  // Noms du 30/10 (Loan) : Analyse Technique, Pack Évolution, Suivi Performance (anglais : scripts/construire.mjs, NOMS).
  { quoi: "noms et délais des formules", n: 1,
    avant: '  single: { nom: "Technical Analysis", achatEn: "the Technical Analysis", prix: "49\\u00A0\\u20AC", delai: "4 to 6 days" },\n' +
      '  pack: { nom: "Progression Pack", achatEn: "the Progression Pack", prix: "129\\u00A0\\u20AC", delai: "3 to 5 days" },\n' +
      '  prog: { nom: "The Way of Performance", achatEn: "The Way of Performance", prix: "499\\u00A0\\u20AC", delai: "2 to 3 days" },\n',
    apres: '  single: { nom: FR ? "Analyse Technique" : "Technical Analysis", achatEn: "the Technical Analysis", prix: "49\\u00A0\\u20AC", delai: FR ? "4 \\u00E0 6\\u00A0jours" : "4 to 6 days", achat: "l\\u2019Analyse Technique", etat: "activ\\u00E9e" },\n' +
      '  pack: { nom: FR ? "Pack \\u00C9volution" : "Progression Pack", achatEn: "the Progression Pack", prix: "129\\u00A0\\u20AC", delai: FR ? "3 \\u00E0 5\\u00A0jours" : "3 to 5 days", achat: "le Pack \\u00C9volution", etat: "activ\\u00E9" },\n' +
      '  prog: { nom: FR ? "Suivi Performance" : "The Way of Performance", achatEn: "The Way of Performance", prix: "499\\u00A0\\u20AC", delai: FR ? "2 \\u00E0 3\\u00A0jours" : "2 to 3 days", achat: "le Suivi Performance", etat: "activ\\u00E9" },\n' },
  { quoi: "surtitre de l'étude écrit au défilement", n: 1,
    avant: 'num.textContent = i === 0 ? "Sample analysis" : ',
    apres: 'num.textContent = i === 0 ? (FR ? "Analyse type" : "Sample analysis") : ' },
  // Avant le texte « Close » de la fenêtre de paiement (TEXTES) : ce bouton-ci est écrit par le script.
  { quoi: "bouton Close de la carte ouverte (mobile)", n: 1,
    avant: 'fermerBtn.innerHTML = "<span>Close</span>',
    apres: 'fermerBtn.innerHTML = "<span>" + (FR ? "Fermer" : "Close") + "</span>' },
  { quoi: "message WhatsApp pré-rempli", n: 1,
    avant: '    const message = "Hi Loan, I just purchased " + f.achatEn + ". Here\\u2019s my video for the analysis.";\n',
    apres: '    const message = FR ? "Bonjour Loan, je viens d\\u2019acheter " + f.achat + ". Voici ma vid\\u00E9o pour l\\u2019analyse."\n' +
      '      : "Hi Loan, I just purchased " + f.achatEn + ". Here\\u2019s my video for the analysis.";\n' },
  { quoi: "guillemets du message WhatsApp", n: 1,
    avant: '      messageWhatsApp: "\\u201C" + message + "\\u201D",\n',
    apres: '      messageWhatsApp: FR ? "\\u00AB\\u00A0" + message + "\\u00A0\\u00BB" : "\\u201C" + message + "\\u201D",\n' },
  { quoi: "délai de réponse de la carte payée", n: 1,
    avant: '      delaiTexte: "Reply in " + f.delai,\n',
    apres: '      delaiTexte: (FR ? "R\\u00E9ponse sous " : "Reply in ") + f.delai,\n' },
  { quoi: "valeurs de langue du gabarit", n: 1,
    avant: "      vrai: true,\n",
    apres: "      vrai: true,\n" +
      '      en: !FR, fr: FR, tr: TRAD, langue: FR ? "fr" : "en", suffixeLangue: FR ? "?lang=fr" : "", formuleEtat: f.etat,\n' +
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
const TEXTES_CHARGEMENT = [
  { quoi: "mots de l'écran de chargement", fichiers: ["chargement.js"], n: 1,
    avant: '  const MOTS = ["Wushu", "Discipline", "Precision", "Performance", "Vision", "Heritage", "Journey"];\n',
    apres: "  /* Version française (scripts/traduction-fr.mjs) : mots et libellé en français sur ?lang=fr. */\n" +
      `  const FR = ${LIRE_FR};\n` +
      '  const MOTS = FR ? ["Wushu", "Discipline", "Pr\\u00E9cision", "Performance", "Vision", "H\\u00E9ritage", "Parcours"]\n' +
      '    : ["Wushu", "Discipline", "Precision", "Performance", "Vision", "Heritage", "Journey"];\n' },
  { quoi: "libellé de l'écran de chargement (lecteurs d'écran)", fichiers: ["chargement.js"], n: 1,
    avant: 'aria-label="Loading"', apres: 'aria-label="${FR ? "Chargement" : "Loading"}"' },
];
// Préfixe ajouté au numéro de version, quel qu'il soit (7q avec les optimisations, 7 sans), tiré du contenu des corrections
// ci-dessus : il change dès qu'elles changent (chargement.js est gardé un an en cache par les visiteurs).
const V_CHARGEMENT = "fr" + crypto.createHash("sha256").update(JSON.stringify(TEXTES_CHARGEMENT)).digest("hex").slice(0, 4) + "-";
const CHARGEMENT = [
  ...TEXTES_CHARGEMENT,
  ...PAGES_PUBLIEES.map((f) => ({ quoi: "écran de chargement : nouvelle version (cache)", fichiers: [f], n: 1,
    avant: "chargement.js?v=", apres: "chargement.js?v=" + V_CHARGEMENT })),
];

// Pages légales : en-tête comme sur Video Feedback (Home, The Journey, Press restent grisés) et lien Video Feedback dans la
// langue choisie. Ces pages changent de langue sans recharger : les blocs sc-if suivent.
const LIENS_LEGALES = LEGALES.flatMap((f) => [
  ...ENTETE.map(([en, t, n]) => ({ quoi: `en-tête : ${en}`, fichiers: [f], n, avant: `>${en}<`, apres: `>${SI(en, t)}<` })),
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
