# Fiche à transmettre à Claude Design — loandrouard.com

Fiche préparée par Claude Code le 15/11/2026, d'après le dépôt (site en ligne sur la branche `main`).
À coller au début de la conversation Claude Design (ou à joindre en fichier), **avec le design system**.
Ce fichier n'est pas publié sur le site.

> **Date limite** : la version autonome de Claude Design (claude.ai/design) ferme le **14 décembre 2026**. Claude Design fonctionne
> désormais dans Claude. Avant cette date, récupérer tout le projet (pages et design system complet) :
> le dépôt n'en contient que la partie exportée pour le site (`_ds/` : styles, polices, sceaux, textures, `_ds_bundle.js`),
> pas les fichiers sources des composants, les cartes, les modèles de page, le kit UI ni le guide d'origine
> (`uploads/design-system-loan-clean.html`, `guidelines/Design System Guide.pdf`).

---

## 0. La nouvelle partie (à compléter par Loan)

- Page concernée : … (Home, The Journey, Press / Contact, ou autre)
- Ce qu'elle doit raconter / vendre : …
- Contenus disponibles (textes, photos, vidéos) : …

## 1. Comment le site est fabriqué : contraintes à respecter

- Le site en ligne est **l'export de Claude Design**, recopié tel quel (pages `*.dc.html`, dossiers `_ds/` et `assets/`, scripts).
  Claude Code applique ensuite une liste de corrections sur la copie (contenu, mobile, version française, performance).
  Ces corrections cherchent des **passages exacts** du fichier exporté.
- Donc : faire la nouvelle partie dans un **nouveau fichier de page**. **Ne pas modifier** dans Claude Design les pages
  existantes (Video Feedback, CGV, Privacy, Legal, Sponsors) : leur version dans Claude Design est en retard sur le site
  en ligne, et toute modification casse les corrections.
- Ne pas renommer le dossier `_ds/loan-drouard-design-system-06a79c98-aed9-4ca8-8b81-69bb72fcc98a`.
- Aucun cookie, outil de statistiques, traceur, bannière, ni nouveau service extérieur (vidéo YouTube ou Vimeo intégrée,
  police en ligne, script tiers…) sans accord de Loan. Seule exception déjà en place : Cloudflare Web Analytics (sans cookie).
- **Mobile dès le départ** : iPhone et Safari en priorité, de 320 px à 2 560 px de large. Pas d'aimantation du défilement
  (« scroll snap ») : retirée à la demande de Loan.
- Images légères (WebP ou JPEG compressé). La texture `enduit-noir.jpg` (518 Ko) gagnerait à être réexportée plus légère (~250 Ko).

## 2. Ce qui a changé sur le site depuis le dernier export

**En-tête**
- Ordinateur (plus de 1 040 px) : nom 21–26 px, liens 13,5–17 px, langues 14–17 px (proportionnels à la largeur).
  Tout en haut de la page, liens visibles ; ils s'effacent en fondu dès qu'on descend (sur Video Feedback).
- Mobile : langues EN / FR / 中文 sur la même ligne que le nom ; menu « hamburger » (Home, Video Feedback, The Journey,
  Press / Contact) sous les langues.
- Sa hauteur réelle varie selon l'écran : ne pas compter sur `--hauteur-header: 68px`.
- Home, The Journey et Press / Contact portent un petit ruban doré en biais « Coming soon » / « Bientôt » :
  la nouvelle partie le remplacera par un vrai lien.

**Pied de page** : réseaux plus grands (texte 14–16,5 px, icônes 24–28 px) ; sous 770 px de large, Meta et Global côte à côte,
China en dessous.

**Langues** : anglais principal ; français avec `?lang=fr` (loandrouard.fr y mène) ; chinois (中文) annoncé mais pas encore fait.
Prévoir les textes **en anglais et en français**.

**Formules et prix** (décision de Loan du 29/10, noms du 30/10)
- Technical Analysis / Progression Pack / The Way of Performance — en français : Analyse Technique / Pack Évolution / Suivi Performance.
- Prix normaux : 99 €, 249 €, 990 € tous les 3 mois. Pendant une promotion, toujours 49 €, 129 €, 499 € tous les 3 mois
  (prix normal barré ; −50 %, −48 %, −49 %). Offre de lancement en cours, sans date de fin.
- Boutons : Analyze My Videos / Get the Pack / Start My Coaching — en français : Analyser mes vidéos / Obtenir le Pack / Commencer mon Suivi.
- Les prix sont gérés à un seul endroit par Claude Code : signaler tout prix écrit dans la nouvelle page.

**Ton** : le site parle désormais à la première personne (« Frame by frame, I break down your routine… »,
« Together, we look at what to improve »), alors que le design system dit « il, jamais je ; jamais nous ».

**Couleurs** : en plus de l'or de base `#A9814A`, le site utilise un **or clair `#C6A05E`** pour le texte doré sur fond sombre
(étiquette d'offre, remise, « unlocked », étiquettes du guide…). Le dessin de l'étude a ses propres encres
(`#1D1B18`, `#8A6936`, `#E0C088`, `#F3E3C0`).

**Photos** : le site a maintenant de vraies photos (crédit David GROUARD) et un dessin d'étude ; le design system dit encore
« aucune photographie fournie ».

## 3. Mises à jour à faire dans le design system

Écarts relevés entre le design system (readme, jetons, cartes) et le site en ligne. Les points marqués **[Loan]**
demandent d'abord une décision de Loan.

1. **Prix et noms des formules** : le readme annonce « 49 € · 129 € · 499 € » comme prix ; ce sont les prix de promotion.
   Mettre les noms et prix du § 2 (readme, composant `Formule`, modèle « Page formules »).
2. **En-tête** : décrire l'en-tête réel (ordinateur et mobile, menu hamburger, effacement des liens) ; corriger
   `--hauteur-header` ; retirer la phrase « Le header collant est opaque, bordé d'un filet 1px », qui contredit
   « intégralement transparent » ; mettre à jour la copie de `header-flottant.js` du design system (plus ancienne que celle du site).
3. **Pied de page mobile** (§ 2) à ajouter.
4. **Or clair `#C6A05E`** : l'ajouter comme jeton documenté (le readme dit « aucune sixième teinte »), ou revenir à `#A9814A` partout. **[Loan]**
5. **« Au plus un or par page »** : le site en montre plusieurs à la fois (offre, remise, formules, « unlocked »).
   Assouplir la règle ou revoir le site. **[Loan]**
6. **Ruban « Coming soon »** : fond dégradé doré sous du texte, contraire à la « règle sans exception » de l'or.
   L'inscrire comme exception, ou le redessiner. **[Loan]**
7. **Voix** : « il, jamais je ; jamais nous » contre le « I / we » du site. **[Loan]**
8. **Majuscules** : le readme cite « Analyse Technique » comme exemple de majuscule interdite ; c'est maintenant le nom
   d'une formule. Préciser que les noms de formules gardent leurs majuscules.
9. **Contradictions internes du readme** :
   - eyebrows « en or » (section Typographie) contre « en gris » (section Couleurs et carte « Eyebrows et étiquettes ») ;
   - « aucun chevron, aucune flèche » contre les icônes `suivant` et `precedent` ;
   - grain « 80 % sur le noir, 2,5 % sur le blanc » contre la carte « 80 % sur le noir comme sur le blanc » ;
   - commentaire de `--rayon-6` (« CTA primaire, cadre média ») alors que le CTA est à 12 px et les cadres à 24 px.
10. **Photos** : remplacer « aucun visuel photographique fourni » par les règles des vraies photos.
11. **Mobile** : le readme dit « pas de maquettes mobiles, kit pensé desktop » ; ajouter les règles mobiles du site
    (en-tête, menu, pied de page, cartes compactes des formules).
12. **Version française** de Video Feedback : textes validés par Loan dans `scripts/traduction-fr.mjs` (à reporter si Loan le souhaite).

Autres corrections du site jamais reportées dans Claude Design : liste « Reporter dans Claude Design » de `MISE-EN-LIGNE.md`.

## 4. Après l'export (travail de Claude Code)

Ajouter la nouvelle page à la liste des fichiers publiés (`scripts/construire.mjs`), activer son lien dans l'en-tête et le menu
(et retirer le ruban « Coming soon »), faire la version française, vérifier sur mobile, publier sur l'adresse de test,
puis sur loandrouard.com avec l'accord de Loan.
