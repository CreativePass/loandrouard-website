# Loan Drouard — Design System

Direction artistique de **Loan Drouard**, athlète français de wushu taolu : quatorze fois
champion de France, cinq fois champion d'Europe, vice-champion du monde 2025, deuxième de la
Coupe du Monde 2026. La marque est une marque personnelle d'athlète — pas un produit logiciel :
un site vitrine en trois langues (anglais principal, français, chinois) qui raconte un parcours,
présente une analyse technique du geste et vend trois formules d'accompagnement
(49 € · 129 € · 499 €).

Le système tient en une phrase : **noir, blanc, or** — et l'or ne touche jamais le fond d'un texte.

## Sources

| Source | Chemin | Ce qu'elle apporte |
| --- | --- | --- |
| **Fichier source du guide (HTML)** | `uploads/design-system-loan-clean.html` | **La référence** : toutes les valeurs exactes (couleurs, tailles, interlettrages, géométries, grain, animation) sont relevées ici |
| Design System Guide (8 planches, PDF) | `guidelines/Design System Guide.pdf` | Export imprimé du même document — utile pour la prose et les règles |
| Sceau — version noire | `assets/sceau-noir.svg` (fourni : `Sceau Loan Refined Black.svg`) | La marque, pour fond clair |
| Sceau — version blanche | `assets/sceau-blanc.svg` (fourni : `Sceau Loan Refined White.svg`) | La marque, pour fond sombre |
| Motifs de toiture | `assets/roofline-motif.svg`, `assets/roof-transition.svg` | Extraits **verbatim** du HTML source (tracés inchangés) |

Aucun dépôt Git, aucun fichier Figma, aucune capture du site en production n'a été communiqué.
Rien n'a été ajouté « parce qu'un design system en contient d'habitude ».

## Index

| Fichier / dossier | Contenu |
| --- | --- |
| `styles.css` | Point d'entrée unique — n'est qu'une liste d'`@import` |
| `tokens/fonts.css` | `@font-face` Cormorant, Cormorant SC, Cinzel (auto-hébergés) + import CDN des deux familles chinoises |
| `tokens/colors.css` | Les cinq valeurs de base, les encres secondaires, les alias par fond |
| `tokens/typography.css` | Familles, échelle fluide, interlignes, les neuf interlettrages |
| `tokens/spacing.css` | Échelle 4 → 72px, rythme de section, largeurs |
| `tokens/effects.css` | Filets, rayons, coin coupé, lueurs, grain, transitions |
| `tokens/base.css` | Réinitialisations partagées |
| `components/loan.css` | Habillage des primitives (états de survol et de pression) |
| `components/actions/` | `Bouton`, `LienTrait`, `Sceau` |
| `components/typographie/` | `TitreSection`, `Lettrine`, `CitationsEmpilees`, `Etiquette`, `Note`, `Emphase`, `TexteChinois` |
| `components/navigation/` | `SelecteurLangue` |
| `components/contenu/` | `ChiffresCles`, `CadreMedia`, `Annotation`, `Chrono`, `Formule`, `Silhouette`, `Roofline` |
| `components/icones/` | `Icone` — le jeu « équerre », dix glyphes |
| `components/reseaux/` | `IconeReseau`, `BarreReseaux` — les dix marques du bloc contact |
| `components/layout/` | `Section` |
| `templates/page-site/` | Template « Page site » — ouverture claire, transition roofline, sections sombres, pied de page |
| `templates/page-formules/` | Template « Page formules » — trois formules, un seul CTA primaire, formulaire de réservation |
| `ui_kits/site/` | Recréation cliquable du site (accueil, parcours, analyse, formules, réservation) — voir son `README.md` |
| `guidelines/*.card.html` | Cartes de fondations affichées dans l'onglet Design System |
| `guidelines/propositions-icones/` | **Trois directions d'iconographie proposées, en attente d'arbitrage** |
| `assets/` | Sceaux, motifs de toiture, fichiers woff2 |
| `SKILL.md` | Enveloppe Agent Skills pour usage hors de ce projet |

### Composants

Vingt-deux primitives, toutes tirées du HTML source — sauf `Icone`, dessiné pour la marque, et les marques de réseaux fournies par Loan (voir ICONOGRAPHY) :

- **Actions** — `Bouton` (CTA primaire), `LienTrait` (seule action secondaire), `Sceau`
- **Typographie** — `TitreSection`, `Lettrine`, `CitationsEmpilees`, `Etiquette`, `Note`, `Emphase`, `TexteChinois`
- **Navigation** — `SelecteurLangue`
- **Contenu** — `ChiffresCles`, `CadreMedia`, `Annotation`, `Chrono`, `Formule`, `Silhouette`, `Roofline`
- **Icônes** — `Icone` (jeu « équerre », dix glyphes)
- **Réseaux** — `IconeReseau` (dix marques de tiers), `BarreReseaux` (la rangée du bloc contact)
- **Mise en page** — `Section`

Chaque dossier porte un `<Nom>.prompt.md` : quoi, quand, et les pièges.

#### Ajouts assumés

Le source décrit des conventions en CSS, pas une bibliothèque de composants. Deux entrées ne
portent pas de nom dans le fichier mais y sont entièrement décrites :

- `Formule` — le bloc d'offre, composé des conventions éditoriales (`.label-tag` + `.quotes-stack`)
  et des tarifs de la section 02. Nécessaire pour la page Formules.
- `Silhouette` — la `.composition-box` de la section 06.

Rien d'autre n'a été inventé : pas de Toast, pas d'Avatar, pas d'Onglets, pas de Modale.

---

## CONTENT FUNDAMENTALS

**Langue.** Le français est la langue d'écriture de la marque ; le site existe en trois langues,
l'anglais en principale, puis le français, puis le chinois. Le chinois n'est jamais une traduction
décorative : il porte le nom du sponsor et les réseaux sociaux chinois (小红书, 抖音).

**La phrase courte, affirmative, sans emphase commerciale.** Le guide s'écrit lui-même comme le
site : des phrases nominales, un verbe quand il faut, un point. Exemples réels :

> Quatre couleurs, une hiérarchie stricte.
> Un seul CTA primaire à l'écran — et plusieurs façons de le dessiner.
> Un site en trois langues, sans drapeaux.
> La forme, jamais le symbole.

**Le tiret cadratin et le deux-points portent le raisonnement.** La construction la plus fréquente
est « affirmation — nuance » : « Accent rare, en dernier — jamais en fond sous du texte ». Le
deux-points introduit la conséquence : « Trois annotations, une seule en or : l'accent marque le
point le plus important. »

**Vous, jamais tu ; il, jamais je.** L'athlète est décrit à la troisième personne (« Loan Drouard
est un athlète français de wushu taolu… »), le visiteur est vouvoyé et possède son geste :
« **Votre** enchaînement, décortiqué point par point », « Un trimestre entier à **vos** côtés ».
La marque ne dit jamais « je », ni « nous ».

**Les promesses s'empilent, elles ne s'enchaînent pas.** Une offre se décrit en trois lignes
courtes, chacune dans son propre bloc en italique : « Votre enchaînement complet, passé au crible. /
Corriger, ajuster, progresser. / Un trimestre entier à vos côtés. » Trois infinitifs valent mieux
qu'une subordonnée.

**Casse.** Les titres sont en capitales-et-bas-de-casse normales, la ponctuation française
complète. TOUT CE QUI EST EN CAPITALES est du texte tertiaire (Cinzel) : eyebrows de section
(« 04 — Geste signature n°1 »), étiquettes (« Retour vidéo »), rôles de spécimen, annotations. Les
capitales sont toujours interlettrées. Dans le code on écrit la casse normale : c'est le composant
qui met en capitales.

**Chiffres et données.** Toujours en Cinzel : « 49 € · 129 € · 499 € », « 14× Champion de France ».
Espace **insécable** avant le €, le signe `×` au lieu de « x », les ordinaux en exposant
(« 3ᵉ aux Jeux Mondiaux » s'écrit `3<sup>e</sup>`). Les palmarès se disent en chiffres, jamais en
superlatifs (« quatorze fois champion » dans un récit, « 14× » dans un bandeau).

**Vocabulaire.** Un lexique technique assumé et non traduit : taolu, changquan, gunshu, daoshu,
shaolinquan, Henan. Le geste se décrit par ses appuis (« appui stable », « axe du bassin »,
« relâchement épaules », « amplitude faible »). Les délais sont précis et modestes : « retour sous
4 à 6 jours », jamais « rapidement ».

**Interdits.** Aucun emoji, nulle part. Pas de point d'exclamation. Pas de gras ni de souligné
pour insister — l'emphase passe par l'italique de Cormorant en or, et par rien d'autre. Pas de
superlatif marketing. Pas de majuscule d'emphase (« Analyse Technique »). Pas de drapeau pour
dire une langue.

**Le vibe.** Un carnet d'entraînement relié, tenu par quelqu'un de méticuleux : sobre, technique,
un peu cérémonieux, jamais spectaculaire. Le luxe est dans le vide et la retenue, pas dans l'or.

---

## VISUAL FOUNDATIONS

### Couleurs

Cinq valeurs, une hiérarchie stricte, et des proportions voulues — dans le guide, la hauteur de
chaque bloc de palette **est** sa fréquence d'usage (noir 225px, blanc 195px, gris 140px, or 64px) :

| Token | Valeur | Rôle |
| --- | --- | --- |
| `--noir` | `#161616` | Couleur principale, dominante |
| `--blanc` | `#F6F5F1` | Deuxième couleur principale — ouverture + respiration « Héritage » |
| `--gris` | `#C7C4BC` | Bordures, séparateurs, filets |
| `--gris-fonce` | `#A9A59A` | Légendes, points du séparateur |
| `--or` | `#A9814A` | Accent **rare** : au plus une occurrence par page |

Encres secondaires : `--noir-sec` = noir à **64 %**, `--blanc-sec` = blanc à **66 %**. Filet sur
fond sombre : blanc à **18 %** (`--filet-blanc`) ; fil du chrono : blanc à **22 %**. Voile sous une
étiquette d'annotation : `rgba(20,18,15,0.55)`.

**La règle sans exception :** l'or ne sert **jamais** de fond derrière du texte, ni au repos ni au
survol — seulement en ligne, en contour, ou en couleur du texte lui-même. Le guide montre les deux
échecs qu'il refuse : texte noir sur or (« jugé pas assez élégant ») et texte blanc sur or
(« contraste insuffisant »). Le fond or plein est donc exclu de toute la marque.

Deux rouges briques (`#9B3A2E` sur clair, `#D98F7F` sur sombre) existent **uniquement** pour
signaler ces contre-exemples dans la documentation. Ce ne sont pas des couleurs d'interface.

**L'or est rare — au plus une occurrence par page, et elle se décide.** Il ne peut donc pas
vivre dans un élément qui se répète : les eyebrows de section, les traits des liens
secondaires, les étiquettes de rôle, les années de la chrono et les prix sont en gris ou en
encre. L'or ne revient que sur un porteur choisi explicitement — `accent` sur `TitreSection` ou
`LienTrait`, l'annotation accentuée d'un visuel, le point du sommet de la chrono, la formule mise
en avant — plus le survol du CTA, qui est transitoire et ne compte pas. Deux occurrences d'or
visibles en même temps sur un écran : c'est une de trop.

Aucune sixième teinte. Les niveaux intermédiaires s'obtiennent par transparence, jamais par un
nouveau hexadécimal. **Aucun dégradé décoratif** : les deux seuls dégradés du système sont
fonctionnels — le fond du cadre média (radial très faible + voiles de blanc à 3,5 % → 1,2 %) et l'encadré de
composition (blanc 95 % → gris 65 %). Pas de dégradé de protection sous du texte.

### Typographie

- **Titres — Cormorant SC, graisse 600**, interlettrage `0.01em`, `text-wrap: balance`.
  Couverture `clamp(36px, 7.4vw, 68px)` / interligne 1.08 ; spécimen `clamp(28px, 5.4vw, 50px)` /
  1.14 ; titre de section `clamp(27px, 4vw, 40px)`.
- **Paragraphes — Cormorant 400**, 19px, interligne 1.65 (chapeau 1.75, colonne longue 1.8,
  lettrine 1.85). Largeurs 600–640px.
- **Texte tertiaire — Cinzel**, cinq niveaux : eyebrow 12.5px/`0.16em`/500 **en or** ; rôle de
  spécimen 11px/`0.1em` **en or** ; étiquette 12px/`0.14em`/600 ; bouton 13px/`0.08em`/600 ;
  annotation 10.5px/`0.05em`. Chiffres et tarifs 19px/`0.03em`, palmarès 13px/`0.04em`,
  langues 13px/`0.12em`.
- **Chinois courant — Long Cang**, 28px, interligne 1.6, séparé par un idéogramme d'espacement
  (`　·　`).
- **Chinois d'exception — Ma Shan Zheng**, en or, uniquement pour isoler un caractère.
- **Emphase** : italique de Cormorant **graisse 500, en or**. Jamais de calligraphie pour insister
  en français, jamais de gras.
- Les titres d'étape du chrono sont en **italique de Cormorant 600**, pas en Cormorant SC.

Lettrine : `4.4em`, interligne 0.8, `float: left`, 10px à droite, 6px au-dessus. Une par page.

**L'initiale de chaque titre porte une lueur** (`--lueur-initiale`) : sur fond sombre, un halo
blanc franc doublé d'un voile d'or (`0 0 14px` blanc à 75 %, `0 0 34px` blanc à 40 %, `0 0 52px`
or à 40 %) ; sur fond clair, la même lueur mais retenue et uniquement dorée
(`--lueur-initiale-claire`). La lettrine reprend le même halo à son échelle. C'est la marque qui
s'allume sur sa première lettre — le reste du titre reste mat.

### Espacement et mise en page

Enveloppe `1180px`, marge interne **24px sous 900px de large, 72px au-delà**. Sections :
`padding-block` 64px puis **100px** au-delà de 900px ; ouverture 120px / 80px. En-tête de section :
48px de marge basse, 12px entre eyebrow et titre. Colonnes de texte 600–640px. Grille d'héritage à
deux colonnes au-delà de 800px. Le header est collant, le sélecteur de langue dans son coin
supérieur droit sur chaque page, avec repli mobile si l'espace manque.

**Le header est flottant.** Il est `position: sticky`, **intégralement transparent** (aucun aplat,
aucun filet) et hors flux — `.ld-header` lui retire sa bande par une marge négative de
`--hauteur-header`, donc la première section démarre à 0 et passe derrière lui. Son encre ne peut
pas être fixée dans le markup : `header-flottant.js` relit au défilement le fond réellement peint
sous lui et pose `data-ton`, qui bascule encre, sceau et composants du header. Un fond non
identifié est traité comme sombre.

### Fonds, textures et grain

**Le fond sombre n'est pas un aplat — mais il a la valeur du noir de base.** `--fond-sombre`
superpose quatre couches, et **aucune n'est un halo centré** : une nappe large qui monte en biais
de l'épaule haut-gauche (blanc à 2,2 %, très étirée), une seconde nappe plus étroite et deux fois
plus faible décalée à droite — les deux se recouvrant, la lumière n'a plus de centre lisible —, une
ombre douce déposée en bas de vue, et la base linéaire légèrement hors d'axe (194°) de `#161616`
vers `#121212`. La borne haute **est** `--noir` et rien ne
monte au-dessus : le dégradé ne peut donc jamais paraître plus clair qu'un aplat de `--noir` posé à
côté de lui — il descend, il ne s'éclaircit pas. Le tout est en `background-attachment: fixed` pour
qu'aucune couture n'apparaisse entre deux sections sombres consécutives.

`--noir #161616` est la valeur d'encre, de référence de la palette **et** la borne haute du fond ;
`--noir-chaud-bas` (sa descente) ne sert **que** de fond.

**Le grain est la texture de la marque** : un bruit fractal SVG (`feTurbulence`, `baseFrequency
0.85`, 2 octaves) en `mix-blend-mode: overlay`, **80 % sur le noir, 2.5 % sur le blanc**, appliqué
section par section. Une seule valeur par fond, sans exception : **les zones en dégradé (transition
roofline, bandeau de légende) prennent exactement le grain du noir** — même tuile de 180px, même
opacité, même mode de fusion — pour qu'aucune rupture de texture ni différence de densité
n'apparaisse à la jonction. Il n'y a aucun motif dessiné, aucune illustration.

**Les fonds texturés sont le troisième type de fond**, après l'aplat et le dégradé : une
photographie de matière posée en tuile, pour que le fond cesse d'être une surface calculée et
devienne une page. Trois matières, une par usage : le **lin** (`--texture-lin`, `.ld-texture--lin`, clair, encre
noire) pour la lecture longue — texte, citations, philosophie — là où l'on veut la chaleur du
papier ; l'**enduit noir** (`--texture-enduit`, `.ld-texture--enduit`, sombre, encre blanche),
minéral et large, pour les ouvertures et les sections de respiration ; le **métal noir**
(`--texture-metal`, `.ld-texture--metal`, sombre, encre blanche), trame fine et serrée, pour les
sections denses — cartes, formules. En composant : `<Section texture="lin|enduit|metal">`.

**Fabrication, identique pour les trois.** La photo d'origine est retuilée en **miroir quatre
côtés** : la tuile se répète donc sans couture. Une seule échelle pour tout le système, **620px**
(`--texture-taille`) — la taille réelle de la matière, jamais agrandie en motif — et
`background-attachment: fixed` pour qu'elle ne glisse pas d'une section à l'autre. Les couleurs de
repli (`--lin` #EFE8E0, `--enduit-noir` #101010, `--metal-noir` #1A1A1C) sont la moyenne exacte de
chaque tuile : sans l'image, le fond garde la même valeur.

**Règles.** Une texture ne change pas l'encre : elle suit le ton du fond qu'elle remplace. Le grain
n'est **jamais** cumulé — la matière le remplace. Deux matières différentes ne se touchent pas :
entre deux sections texturées, garder un aplat. Et jamais derrière une image, qui apporte déjà la
sienne.

Le seul motif graphique est la **ligne de toiture** (`Roofline`), en gris clair à 70 %, trait
1.1px, bouts arrondis : soit le motif seul (héritage), soit la bascule pleine d'une section claire
vers le noir — **occurrence unique sur une page**, « tracé large et peu accidenté, amplitude
faible ».

Le guide ne fournit **aucune photographie** : les emplacements restent des cadres en 4/5 avec
coins d'équerre et filigrane. Quand de vraies images arriveront, viser un monochrome très
désaturé, contrasté, grain léger — jamais de virage chaud, qui concurrencerait l'or.

### Bordures, rayons, cartes, ombres

Filet **1px** : gris clair sur fond clair, blanc à 18 % sur fond sombre. Rayons :
**2px** (étiquette d'annotation), **4px** (bouton secondaire), **6px** (blocs de palette),
**8px** (encadré de démonstration), **12px** (les trois coins arrondis du CTA primaire) et
**24px** (`--rayon-cadre`) — **tout cadre ou panneau** : formule de tarif, cadre média d'analyse,
encadré de composition. Un cadre n'est jamais à angle vif.

Le CTA primaire a sa géométrie propre : **coin inférieur gauche coupé net à 16px**
(`clip-path: polygon(0 0, 100% 0, 100% 100%, 16px 100%, 0 calc(100% - 16px))`) et les trois autres
**généreusement arrondis à 12px** (`--rayon-bouton`) — le contraste entre la coupure franche et les
courbes amples est la signature du bouton, bordure 1px de la couleur du fond du bouton, padding 15px/30px, sceau à 24px posé
devant le texte avec 10px d'écart.

Les cartes ne sont pas des cartes : un filet 1px, un rayon 24px (`--rayon-cadre`), pas de fond. **Aucune ombre portée
nulle part** — la profondeur vient de la lueur or. Aucun bord coloré à gauche, aucune capsule,
aucune pilule. Une précision ou une règle se pose derrière un **filet vertical** (`Note`), jamais
dans un encadré.

### États

- **Survol / focus du CTA primaire** : le sceau et le texte s'éclairent d'une lueur dorée
  (`drop-shadow`), et l'or **balaie le texte de gauche à droite** — un dégradé en
  `background-clip: text` dont la position s'anime en 0.9s. Le fond et la bordure ne bougent pas :
  l'or n'est jamais un aplat, il traverse la lettre.
- **Survol d'un lien trait seul** : le texte passe à l'or (0.2s), le trait d'or reste.
- **Langue active** : **en or**. Les inactives prennent l'encre secondaire du fond. Aucune boîte,
  aucun soulignement. Même logique pour la navigation du header.
- **Sommet de chrono** : point or + `0 0 9px 2px` en or à 55 %.
- **Annotation en or** : point avec `0 0 6px` en or à 80 %.
- **Survol d'une carte Formule** : bordure or à 40 % + lueur douce.
- **Inactif** : opacité 0.38, curseur interdit.
- Jamais de rétrécissement, jamais d'assombrissement du fond, jamais de déplacement.

### Animation

Deux animations dans tout le système. La **lueur qui voyage** le long du fil du parcours —
un radial blanc → or de 15px, `filter: blur(2px)`, 6s `ease-in-out infinite alternate`, neutralisée
sous `prefers-reduced-motion`. Et le **balayage d'or** du CTA primaire au survol : une bande d'or traverse le texte de gauche à
droite, l'encre revient, l'or repart — deux temps. **L'entrée** reprend les valeurs d'origine du CTA (0.9s `cubic-bezier(0.16, 0.6, 0.2, 1)`, `--balayage-entree` — l'or est déjà au bord du mot au premier frame, le feedback est immédiat puis décélère) : l'or vient de la gauche et couvre le mot
entier, puis s'y attarde 2s (`--balayage-pause`). **La boucle** prend ensuite le relais (3.4s
`linear infinite`, `--balayage-boucle`) : le dégradé est une tuile répétée décalée d'exactement une
tuile par cycle, donc sans couture, et l'or suivant entre par la gauche avant que l'encre ait fini
de remplir le mot qui ne
tourne **que** pendant le survol ou le focus, jamais au repos. Le lien-trait, le sélecteur de langue — **toute** cible cliquable porte le même balayage, dans une seule règle. La langue active, déjà en or, balaie un or éclairci plutôt qu'un retour à l'encre.
Tout le reste n'est que transition d'état : 0.35s `ease` pour les
couleurs et bordures, 0.2s pour une couleur de texte. Aucun rebond, aucun ressort, aucune
parallaxe, aucune apparition en cascade. `prefers-reduced-motion` coupe **toutes** les transitions.

### Transparence et flou

La transparence fabrique les encres et les filets, et le voile sous une étiquette d'annotation.
**Aucun `backdrop-filter`, aucun verre dépoli** ; le seul flou du système est celui de la lueur du
chrono. Le header collant est opaque, bordé d'un filet 1px.

### Le séparateur

Ce n'est pas un point médian isolé mais **un filet de 20px terminé par deux points de 4px** en gris
foncé, utilisé entre les langues, entre les titres de palmarès, partout où l'on énumère. Les tarifs,
eux, gardent le point médian typographique en or (`49 € · 129 € · 499 €`). Ni barre verticale, ni
puce, ni tiret.

---

## ICONOGRAPHY

**La marque n'a pas d'icônes — et c'est une décision, pas un oubli.** Le HTML source ne contient
aucune police d'icônes, aucun sprite, aucun pictogramme. Il ne contient que trois dessins : le
sceau, la ligne de toiture (deux variantes), et des primitives géométriques en CSS.

- **Le sceau** (`assets/sceau-noir.svg`, `assets/sceau-blanc.svg`) : une lame et son petit fanion,
  fins et nets, en silhouette pleine. Deux couleurs — noir sur fond clair, blanc sur fond sombre.
  Il n'existe **pas** en or. Il se pose devant le texte du CTA primaire (24 × 23px, où « la
  silhouette reste bien lisible ; seule la texture du fanion s'efface »), en signature de header,
  et en grand (112px) comme spécimen. Jamais redessiné, jamais recoloré, jamais dans un cercle.
- **La ligne de toiture** (`assets/roofline-motif.svg`) : trait 1.1px, gris clair, opacité 0.7,
  bouts arrondis. Le seul ornement de la marque.
- **Les coins d'équerre** du cadre média (16px, 1px, gris clair, insérés à 14px) : c'est ainsi que
  la marque « encadre » — pas avec une bordure complète.
- **Le filet d'annotation** (28 × 1px, gris clair ou or, point de 5px) tient le rôle de puce.
- **Le séparateur** (filet de 20px à deux points) tient le rôle que d'autres marques donnent à une
  icône.
- **Aucun emoji**, dans aucun contexte — y compris les réseaux sociaux chinois, nommés en Long Cang
  (小红书 · 抖音) plutôt qu'en logos.
- **Aucun chevron, aucune flèche, aucun drapeau** dans l'état actuel : la navigation se signale par
  la couleur (l'or) et rien d'autre.

### Le jeu « équerre » — direction retenue

Aucune bibliothèque tierce n'a été importée : le jeu est **dessiné à partir du vocabulaire
existant**. La direction retenue est l'**équerre adoucie** — trait **1px**, géométrie franche à angles droits,
mais **tous les coins portent un congé de 2** (0,6 à 0,8 sur les petites formes), extrémités et
jonctions arrondies : la langue des coins d'équerre du cadre d'analyse, sans la dureté du bout
carré. Grille 24 × 24, `currentColor`.

Composant : `components/icones/Icone.jsx`. **Dix glyphes, et pas un de plus** :

`menu` · `fermer` · `lecture` · `message` · `suivant` · `precedent` · `delai` · `reseaux` ·
`lieu` · `podium`

- **Taille** : 24px par défaut, **20px minimum**. En dessous, le trait de 1px se referme — mieux
  vaut retirer l'icône que la réduire.
- **L'or est un accent rare** : au plus une icône en or par écran (`accent`), jamais pour un simple
  survol ni pour marquer un état actif — l'état actif reste typographique.
- Le CTA primaire porte le **sceau**, jamais une icône : les deux ne se remplacent pas.
- `reseaux` désigne les réseaux sociaux de façon générique — c'est l'icône de la maison, elle ne
  remplace aucune marque et aucune marque ne la remplace.
- Aucun drapeau, aucun emoji : le sélecteur de langue reste purement typographique.

#### Les marques de réseaux — l'exception

Dix logos de tiers, fournis par Loan, dans `components/reseaux/IconeReseau.jsx` :

`instagram` · `xiaohongshu` · `tiktok` · `douyin` · `threads` · `facebook` · `x` · `linkedin` · `whatsapp` · `linktree`

Ce sont des marques déposées : elles obéissent à leurs chartes, pas à la nôtre. Tracés **pleins**
sur la grille 24 — on ne les retrace pas au trait de 1px du jeu « équerre », et on ne les repose pas
sur leur pastille de couleur d'origine.

- **Réservées au bloc contact** et au pied de page, via `BarreReseaux`. Ailleurs, un réseau se nomme
  en mots, jamais par son logo.
- **Taille** : 20px dans la barre, 24px maximum — une marque de tiers ne pèse pas plus lourd qu'un
  glyphe de la maison.
- **Couleur** : l'encre courante ; l'or n'arrive **qu'au survol**. Une marque en or au repos est une faute.
- 小红书 et 抖音 s'écrivent toujours **en Long Cang** quand ils sont *nommés* dans un texte ; le logo
  ne sert que dans la barre de liens.
- Les huit comptes de Loan vivent dans `COMPTES` (`BarreReseaux.jsx`) — une URL ne se recopie
  jamais dans une page. Les variantes couleur fournies par Loan restent dans `uploads/`, hors système.

Les deux directions écartées restent consultables pour mémoire :
`guidelines/propositions-icones/A-plein-sceau.html` (silhouettes pleines, tenaient à 16px) et
`B-trait-toiture.html` (trait 1.1px à bouts arrondis, tracé du motif d'héritage).

---

## Caveats

1. **Polices** — les cinq familles (Cormorant, Cormorant SC, Cinzel, Long Cang, Ma Shan Zheng) sont
   des Google Fonts, récupérées telles quelles. Cormorant, Cormorant SC et Cinzel sont
   auto-hébergées en woff2 (latin + latin-ext) dans `assets/fonts/` ; Long Cang et Ma Shan Zheng
   restent servies par le CDN Google (fichiers CJK découpés en une centaine de sous-ensembles). Pour
   un fonctionnement hors ligne en chinois, il faudra fournir ces deux binaires.
2. **Valeurs** — toutes les valeurs de `tokens/` et de `components/loan.css` sont désormais relevées
   dans `uploads/design-system-loan-clean.html`. Les seules valeurs non attestées sont celles des
   écrans que le guide ne dessine pas (page Formules, formulaire de réservation, navigation du
   header), déduites par cohérence.
3. **Aucun visuel photographique** fourni : tous les cadres média restent au filigrane.
4. **Pas de maquettes mobiles** dans les sources — seuls les points de rupture à 800 et 900px du
   CSS source sont respectés. Le kit UI est pensé desktop.
5. **Iconographie** — le jeu « équerre » est **une création pour cette marque**, pas un élément
   attesté dans les sources : le HTML source ne contient aucune icône. Il est volontairement limité
   à dix glyphes ; toute demande nouvelle doit être dessinée dans le même idiome plutôt que
   complétée depuis une bibliothèque tierce.
