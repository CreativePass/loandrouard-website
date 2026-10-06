# Performance — loandrouard.com

Optimisation d'octobre 2026 (02/10). Ce fichier n'est pas publié.

## Principe

- Les fichiers de l'export (`*.dc.html`, scripts, `_ds/`, `assets/`) ne sont jamais modifiés. Les optimisations sont des **corrections de construction** listées dans `scripts/optimisations.mjs`, appliquées par `npm run construire` sur la copie `public/`, comme les corrections de contenu.
- Chaque correction attend un nombre précis d'occurrences : si un nouvel export change le passage concerné, la construction s'arrête (à revoir) au lieu de casser quelque chose en silence.
- Les fichiers ajoutés ou remplacés sont contrôlés : React doit avoir exactement l'empreinte qu'exige `support.js` ; le logo allégé n'est utilisé que si l'image de l'export n'a pas changé (sinon avertissement et image d'origine).
- Une optimisation n'a été gardée que si une mesure montrait un gain sans régression ; les autres sont listées plus bas.

## Mesurer

`scripts/mesurer.mjs` sert un dossier construit comme Cloudflare (brotli, `_headers`, HTML sans cache) et simule une bonne connexion : bureau 1440×900, 30 ms d'aller-retour, 50 Mbit/s ; mobile 390×844 DPR 3, 60 ms, 15 Mbit/s, processeur ×4 plus lent. Les ressources tierces (unpkg, Google Fonts, `/places`) sont téléchargées une fois puis rejouées à l'identique ; aucun paiement n'est déclenché (les envois vers l'API sont bloqués).

```
npm run construire
node scripts/mesurer.mjs public apres                    # tous les scénarios, bureau + mobile (~1 h 30)
node scripts/mesurer.mjs public essai charge,repos bureau
node scripts/mesurer.mjs --comparer avant apres          # tableau AVANT → APRÈS (Markdown)
OPTIMISATIONS=aucune npm run construire                  # construire sans les optimisations
OPTIMISATIONS=sable,poussiere npm run construire         # seulement celles-ci (mesurer l'effet d'une seule)
VERIF_REF=<dossier> npm run verifier -- <adresse>        # comparaison au pixel avec une construction précédente
```

Scénarios : chargement (1re visite et avec cache, 5 essais, 4 pages), défilement complet (molette, ou vrais glissés du doigt sur mobile), repos 10 s (ouverture, étude, pied de page) et pointeur qui bouge, interactions (vitrine des prix, cartes, sommaire, pied de page ; l'effet de chaque geste est vérifié), pages légales (défilement, langue, navigation), fuites mémoire (5 cycles), calques, film du chargement (éclairs).

**Limite** : la machine de mesure n'a pas de carte graphique (rendu logiciel). La régularité image par image et la consommation totale du navigateur y sont dominées par la composition des calques, bien plus coûteuse qu'avec un vrai processeur graphique : ces chiffres-là sont pessimistes. Les comparaisons AVANT → APRÈS, faites dans les mêmes conditions, restent valables.

## Causes trouvées

**Critiques**
- **Molette piégée au cran du projecteur** : `html { scroll-snap-type: y proximity }` + `.vfp-cran` ramenait la page au cran après chaque cran de molette ; molette lente : on ne pouvait plus descendre (mesuré : 20 crans → toujours 1 418 px). Les écouteurs `wheel`/`touchmove` bloquants aggravaient : même une molette rapide restait coincée.
- **Défilement qui attend le script** : `wheel` et `touchmove` non passifs posés en permanence sur `window` (ils ne servent que pendant les ~2 s du retournement des cartes) : chaque cran de molette et chaque glissé attendait le fil principal.
- **Pied de page (sable d'or)** : `--flux` posé sur toute la section à chaque image → recalcul de style de tout le pied de page (≈ 0,55 s par 5 s sur ordinateur, 30 % du temps sur mobile). Présent sur toutes les pages.
- **Démarrage** : le design system et `header-flottant.js` s'exécutaient deux fois (composants recréés, 4 écouteurs au lieu de 2 qui forçaient une mise en page à chaque image de défilement) ; `styles.css` réimportait les 8 feuilles déjà liées (règles CSS en double, 9 requêtes de trop à chaque visite). Le moteur retélécharge aussi la page après l'avoir affichée : c'est nécessaire, voir « Écarté ».
- **Gel à l'apparition de la page** : en retirant sa feuille de style, l'écran de chargement forçait un recalcul complet du style et des polices (0,1 s sur ordinateur, 0,5 s sur mobile), au moment exact où la page devient visible.

**Importantes**
- Poussière du projecteur animée en permanence, même hors écran (mobile : 30 % du processeur principal pendant la lecture de l'étude).
- Polices et pied de page demandés seulement après le démarrage du moteur (chaîne de chargement).
- React chargé depuis un serveur tiers (unpkg.com).
- Images loin sous la ligne de flottaison chargées dès l'ouverture (≈ 0,8 Mo) ; logo sponsor de 398 Ko affiché sur ~104 px.

**Mineures**
- `blueprint.js` interrogeait la page 8 fois par seconde sur Video Feedback, qui ne s'en sert pas.
- La parallaxe du pointeur recalculait le projecteur même quand il était hors écran.

**Clignotements** : aucun éclair mesuré au chargement (film image par image, avant comme après) ni d'image apparue en retard pendant le défilement. Ce qui a été trouvé :
- recréation du sélecteur de langue (double exécution du design system), sous l'écran de chargement ;
- polices remises « en chargement » au retrait de l'écran, sans effet visible mesuré (largeur du texte inchangée) ;
- ton de l'en-tête parfois faux après un saut hors du projecteur (texte clair sur fond clair), selon le hasard du chargement : deux copies du même script se disputaient la décision. Ordre fixé APRÈS (voir « Vérifications ») ;
- deux clignotements **voulus**, conservés : l'allumage du projecteur (néon qui grésille) et le passage net/flou de la feuille d'étude pendant son mouvement (choix du design pour éviter un vrai clignotement).

## Optimisations retenues (`scripts/optimisations.mjs`)

| Identifiant | Ce qui change | Gain mesuré (seule) |
|---|---|---|
| `aimantation` | aimantation au cran retirée (**validé par Loan le 02/10, à reporter dans Claude Design**) ; la page s'ouvre en haut, comme le prévoit le code d'origine | molette lente : 20 crans → +2 000 px (avant : bloquée) |
| `defilement` | molette et glissé bloquants seulement pendant le verrou du retournement | réaction molette −26 %, glissé −16 % |
| `sable` | `--flux` posé sur le nom seul | style au pied de page −82 %, fil principal −23 % |
| `poussiere` | poussière du projecteur arrêtée hors écran | mobile, étude : fil principal 29 % → 2,5 % |
| `parallaxe` | parallaxe ignorée hors écran | souris dans l'étude : −37 % |
| `chargement` | feuille de l'écran de chargement laissée en place (inerte) ; une ressource en échec ne le retient plus | gel à l'apparition supprimé (0,1 s / 0,5 s) ; plus d'attente de 20 s à 96 % quand Safari bloque la balise Cloudflare |
| `doublons` | design system et en-tête exécutés une seule fois ; `header-flottant.js` placé avant le design system pour garder le même ordre de décision du ton de l'en-tête qu'en ligne | plus de recréation ; prête −8 % / −11 % |
| `css` | lien redondant vers `styles.css` retiré | −9 requêtes par visite ; démarrage mobile −13 à −24 % |
| `react` | React servi par le site (accord de Loan), préchargé ; `support.js` le charge toujours avec son empreinte (SRI) | prête −11 % (Video Feedback, ordinateur), −2 à −5 % ailleurs ; un serveur tiers de moins |
| `precharges` | préchargement du pied de page et des polices, connexion anticipée à Google Fonts | prête −22 % / −12 % |
| `images` | `loading="lazy"` : yin-yang, revers des cartes, sceaux, logo | −0,8 Mo au premier chargement, 0 apparition tardive |
| `logo` | logo sponsor à la taille affichée (`optimise/`) | 398 → 65 Ko |
| `blueprint` | `blueprint.js` retiré de Video Feedback | 8 interrogations/s → 0 |

Gains « seule » : chaque optimisation mesurée sur une construction qui ne contient qu'elle (mêmes scénarios, ordinateur / mobile).

## Écarté ou laissé tel quel

- **Second téléchargement de la page par le moteur** (~35 Ko, puis nouvelle compilation) : essayé (`window.__resources`), puis retiré. Le moteur relit la page parce que le navigateur met les noms d'attributs en minuscules (`onChange` devient `onchange`) : sans cette relecture, le sélecteur de langue des pages légales ne répondait plus. Trouvé par les parcours de vérification, avant toute mise en ligne.
- `fetchpriority="low"` sur les images : aucun octet économisé, aucun gain mesuré.
- Chargement différé des images de l'étude : la photo arrivait en retard lors d'un défilement très rapide sur mobile.
- Animations CSS infinies (nappes de lumière, grain, stries) : tant qu'une animation visible tourne, la page est recomposée à chaque image ; mettre en pause les invisibles n'apporte rien (mesuré). Les alléger changerait le rendu.
- Rayons du projecteur (calque redessiné jusqu'à 3 232 px de côté) : sans effet mesurable ici ; toute correction changerait le rendu.
- Bascule net/flou de la feuille d'étude : voulue par le design.
- Durée de l'écran de chargement (300 ms de stabilité, seuil de 650 ms, sortie lente de ~1,9 s au-delà) : choix de design ; le site est simplement prêt plus tôt, et passe désormais presque toujours sous le seuil sur ordinateur.
- Sable d'or sur mobile : le recalcul de style est corrigé, mais la toile reste grande (toute la section) ; voir les pistes.

## Pistes restantes (demandent l'accord de Loan)

- **Police chinoise Long Cang** : 4 tranches Google (≈ 215 Ko) pour une douzaine de caractères. Un sous-ensemble servi par le site pèserait ~10 Ko et retirerait Google Fonts du chargement, mais la page Privacy mentionne Google Fonts : à modifier en même temps.
- **Sable d'or** : réduire la toile à la zone du tracé (un grain soufflé très loin par la souris serait coupé au bord).
- **Images à réexporter** (voir ci-dessous).
- **Animations de fond** plus sobres (moins de calques plein écran) si Loan accepte un rendu légèrement différent.

## Images

Déjà fait automatiquement : `assets/sponsors/wushu-performance.png`, 398 Ko, 756×1016 px, affiché ~104 px de haut → 65 Ko, 232×312 px (`optimise/`).

À réexporter depuis Claude Design si possible (gain sans changer la taille d'affichage) :

| Fichier | Poids, dimensions | Usage | Recommandation |
|---|---|---|---|
| `_ds/…/textures/enduit-noir.jpg` | 518 Ko, 1240×2204, qualité 86 | fond de la planche, du pied de page, revers des cartes | JPEG qualité ~75 progressif ou WebP : ~250 Ko |
| `assets/photos/etude-croquis-v5.webp` | 332 Ko, 2400×1600, qualité 92 | étude (zoom ×2,25) | même taille, qualité ~82 : ~220 Ko |
| `assets/photos/vf-spot-loan.webp`, `vf-spot-contre.webp` | 243 + 233 Ko, 1100×1650, qualité 92 | projecteur (premier écran) | qualité ~82 : ~150 Ko chacune |
| `assets/blueprint/dos-carte*.webp` | 122 à 285 Ko, 700×1194, qualité 92 | revers des cartes (désormais différés) | qualité ~82 : −30 % |
| `assets/yin-yang-*.png` | 64 + 67 Ko | bascule yin-yang | WebP sans perte : ~40 Ko chacun |
| `assets/sponsors/wushu-performance.png` | — | logo | idéalement en SVG |

Les fichiers non référencés de `assets/` (~11 Mo, pour les futures pages Home et Press) ne sont jamais téléchargés par les visiteurs.

## AVANT → APRÈS

Mesures du 02/10 : AVANT = `main` (version en ligne), APRÈS = cette branche, mêmes scénarios, même machine (`mesures/`, non publié). Médianes de 5 essais pour les chargements.

**Chargement (1re visite)**

| Page | Prête, ordinateur | Prête, mobile | Poids transféré | Requêtes |
|---|---|---|---|---|
| Video Feedback | 1 340 → 1 057 ms (−21 %) | 3 801 → 3 000 ms (−21 %) | 3 343 → 2 209 Ko (−34 %) | 58 → 50 |
| CGV | 820 → 663 ms (−19 %) | 2 454 → 1 794 ms (−27 %) | 894 → 497 Ko (−44 %) | 45 → 36 |
| Privacy | 772 → 588 ms (−24 %) | 2 249 → 1 732 ms (−23 %) | 881 → 483 Ko (−45 %) | 47 → 36 |
| Legal | 733 → 559 ms (−24 %) | 2 181 → 1 542 ms (−29 %) | 839 → 542 Ko (−35 %) | 46 → 37 |

- Visite suivante (avec cache) : Video Feedback prête 891 → 710 ms (ordinateur), 3 135 → 2 347 ms (mobile). Poids inchangé (~100 Ko : la page elle-même, relue par le moteur).
- Premier affichage, mobile, Video Feedback : 1 980 → 1 448 ms (−27 %).
- Fil principal bloqué pendant le chargement (tâches > 50 ms) : Video Feedback 315 → 128 ms (ordinateur), 2 081 → 1 003 ms (mobile) ; pages légales sur mobile : −50 à −58 %.
- « Révélée » (écran de chargement parti) : l'écran ne montre ses mots et ne s'attarde (sortie de ~1,9 s au lieu de 0,5 s) que si la page n'est pas prête vers 650 ms. Sur ordinateur, les pages légales sont tout près de ce seuil : sans ralentissement réseau, l'écran s'attardait 10 fois sur 15 AVANT, jamais APRÈS (0 sur 15). Avec cache : −42 à −53 %.

**Défilement de Video Feedback, de haut en bas (mêmes gestes)**

| | Ordinateur (molette) | Mobile (doigt) |
|---|---|---|
| Temps pour faire les mêmes gestes | 43,9 → 33,5 s (−24 %) | 96,7 → 72,4 s (−25 %) |
| Fil principal occupé | 8,6 → 6,4 s (−26 %) | 72,4 → 50,6 s (−30 %) |
| Réaction au geste, p95 | 351 → 317 ms | 197 → 153 ms (−22 %) |
| Images de plus de 25 ms | 54 → 53 % | 75 → 64 % |
| Images apparues en retard | 0 → 0 | 0 → 0 |

Molette lente au cran du projecteur : bloquée AVANT, libre APRÈS. La régularité image par image sur ordinateur ne s'améliore pas sur cette machine : elle dépend surtout de la composition des calques (rendu logiciel) et varie de ±20 % d'une mesure à l'autre de la même version (défilement rapide : images p95 150 → 167 ms, réaction p95 403 → 478 ms, dans cette marge).

**Au repos (10 s sans toucher)**

| Endroit | Ordinateur, fil principal | Mobile, fil principal |
|---|---|---|
| Ouverture (projecteur) | 9,4 → 8,8 % | 22,9 → 26,1 % (bruit : 29 à 32 % sur des mesures répétées des deux versions) |
| Étude | 9,1 → 6,6 % ; rappels d'animation 29 → 4 /s | 31,6 → 1,8 % |
| Pied de page | 45,1 → 31,7 % | 99,9 → 98,3 % (toile du sable d'or, voir pistes) |

**Interactions**

| | Ordinateur | Mobile |
|---|---|---|
| Pire interaction (≈ INP) | 288 → 208 ms | 96 → 96 ms |
| p75 | 192 → 200 ms | 88 → 88 ms |

Mêmes gestes des deux côtés, avec leur effet vérifié (vitrine des prix ouverte puis fermée, sommaire → Pricing, cartes). Le script ne traite chaque geste qu'en 0 à 12 ms : le reste est l'affichage de l'image suivante, coûteux sur cette machine sans carte graphique. Une première mesure APRÈS cliquait à côté de « See pricing » (bouton cliquable seulement en haut de page) et montrait un faux gain : scénario corrigé, mesuré à nouveau des deux côtés.

**Pages légales** : changement de langue 64 → 72 ms (ordinateur), 208 → 176 ms (mobile), dans le bruit ; navigation Video Feedback → CGV 1 561 → 1 389 ms (ordinateur), 5 107 → 4 653 ms (mobile), un seul essai.

**Mémoire et calques** : tas JavaScript après 5 cycles 4,8 → 4,9 Mo (stable, pas de fuite) ; calques identiques ; aucun éclair dans le film du chargement.

**Lighthouse** (local, 1 essai par page, connexion simulée par Lighthouse)

| Page | Ordinateur | Mobile |
|---|---|---|
| Video Feedback | 84 → 89 (LCP 2,1 → 1,6 s) | 47 → 60 (LCP 11,5 → 9,3 s ; TBT 581 → 250 ms) |
| CGV | 97 → 97 | 71 → 93 |
| Privacy | 98 → 94 | 75 → 95 |
| Legal | 92 → 97 | 78 → 94 |

Lighthouse ne connaît pas l'écran de chargement. Deux effets en découlent, présents AVANT comme APRÈS :
- l'indice de vitesse (Speed Index) des pages légales sur ordinateur saute entre ~0,9 et ~1,9 s selon que l'écran s'attarde ou non, d'où des scores qui varient de quelques points d'un essai à l'autre. Sur 4 essais répétés de CGV : AVANT score 96 à 99, Speed Index 1,10 à 1,94 s ; APRÈS score 97 à 100, Speed Index 0,89 à 1,77 s ; premier affichage 670 → 465 ms et LCP 850–1 020 → 600–680 ms à chaque essai ;
- un décalage de mise en page (CLS ~0,12 à 0,25), survenu sous l'écran de chargement donc invisible, apparaît au hasard d'un essai (AVANT : Legal ordinateur 0,114, Privacy mobile 0,247 ; APRÈS : Privacy ordinateur 0,117).

Le LCP mesuré par l'outil sur Video Feedback (ordinateur) n'est pas fiable : l'élément le plus grand est la texture de grain plein écran, que le navigateur ne signale pas à chaque essai. Quand il le signale, il arrive plus tôt APRÈS (476 à 676 ms, au premier affichage) qu'AVANT (772 à 1 188 ms, photo du projecteur).

## Retour de Loan après publication (03/10)

La version publiée le 03/10 a été retirée le jour même (retour à la version Cloudflare `19d3f7be`, accord de Loan) après son test sur iPhone et ordinateur. Diagnostic sur la branche, version stable comparée à la version corrigée :

| Point | Cause | Correction |
|---|---|---|
| 1. Chargement bloqué à 96 % | Cloudflare insère sa balise Web Analytics (active depuis le 06/09) ; quand Safari ou un bloqueur la refuse, aucune trace n'en reste et l'écran attend sa limite de 20 s. Déjà présent avant les optimisations. | `chargement.js` : une ressource en échec compte comme terminée (22 s → 3 s, simulé). |
| 2. Arrivée au projecteur | Le code d'origine remonte en haut (`enHaut`), mais l'aimantation pouvait l'emmener au cran pendant le chargement (course, selon la vitesse de chargement) ; l'optimisation l'y forçait. | Seule l'aimantation est retirée : arrivée en haut, 8 tailles, avec et sans cache. |
| 4. En-tête mobile sur le titre | Conséquence du point 2 : au cran, le titre passe sous l'en-tête transparent (identique dans la version stable à cette position). | Corrigé par le point 2. |
| 5. « Your routine… » brutal | Conséquence du point 2 : arrivée en cours de page = mode `vfp-vite` (séquence d'ouverture ramenée à 0,5 s) et titre affiché sans son entrée. L'entrée au défilement est identique à la version stable (mesurée image par image). | Corrigé par le point 2. |
| 3. Retour de la lumière saccadé | Identique dans la version stable : à chaque image, composition des trois faisceaux masqués et agrandis (les masquer double la cadence) et redessin du halo plein écran. | Non corrigé : demande de changer la façon de dessiner la lumière (décision de Loan). |
| 6, 7. Ligne rose, fonds manquants, plantage sur iPhone | Non reproduits (pas de Safari ici). Surface des calques identique dans les trois versions à chaque position (171 Mpx en haut, 349 Mpx dans l'éblouissement, mobile). | Repris le 04/10 : voir « Safari / iPhone ». |

## Safari / iPhone (04/10)

Les captures de Loan, prises sur un vrai iPhone (Safari) et sur Mac (Safari, capture 5), font foi. Chromium simulé n'est qu'un repère.
- Corrections : `scripts/safari.mjs`, mêmes garde-fous que les optimisations.
- Banc local : `scripts/banc.mjs`. Vérification de l'en-tête : `scripts/verif-entete.mjs`.
- Diagnostic temporaire : `optimise/diag.js`, présent **uniquement sur l'adresse de test**.

### Constats sur les captures

| Capture | Défaut | Cause | Statut |
|---|---|---|---|
| 1, 5 | Bande grise en haut ; en-tête sur 3 lignes (iPhone) | `--hauteur-header` vaut 68 px fixes (design system), alors que l'en-tête mesure 134 px sur iPhone et ~96 px dans Safari sur Mac. Son `margin-bottom: -68px` laisse alors un vide au-dessus de la scène, où l'on voit `.vf-nuit`. Reproduit dans Chromium : la scène commence à 66 px | Démontré, corrigé (`entete`) |
| 2 | « VIDEO FEEDBACK » sur la navigation | Même cause : le titre est à 68 + 5svh = 111 px, sous un en-tête de 134 px. « Your routine… » et les cartes de la vitrine passent aussi dessous | Démontré, corrigé (`entete`) |
| 2 | État blanc | État voulu (éblouissement : papier, Loan en contre-jour), sauf le chevauchement ci-dessus | — |
| 2 | Bande sombre en bas | La scène fait 100svh et s'arrête là où commence la barre Safari déployée. Barre repliée, l'écart montre le fond de la page | Hypothèse, à mesurer sur l'iPhone (diagnostic : svh, lvh, dvh, écart) |
| 1 | Ligne magenta rgb(251,3,247), ~6 px physiques | Largeur exacte du bouton « See pricing », 24 px au-dessus = marge du `filter: blur(8px)` de son animation d'entrée. Le site ne contient aucun magenta (tout est gris). Même signature que le bug WebKit 27 des flous logiciels ([vitepress#5462](https://github.com/vuejs/vitepress/pull/5462)) | Fortement étayé ; contournement `will-change: filter` testé en variante (`filtre`) seulement |
| 3 | Page blanche | Blanc pur #FFFFFF, que le site ne peint jamais. Champ d'adresse remis à zéro, barre de progression : Safari recharge une page dont le processus s'est arrêté | Probable, à confirmer par le fil d'Ariane du diagnostic |
| 4 | « A problem repeatedly occurred » (aussi en production) | Arrêt répété du processus. Hypothèse prioritaire, **non démontrée** : mémoire graphique (jetsam) | À établir sur l'iPhone : phase et calques actifs au moment de l'arrêt, comparaison des versions |

### Corrections et candidats (`scripts/safari.mjs`)

| Identifiant | Statut | Effet mesuré (Chromium local) |
|---|---|---|
| `entete` | Retenue (choix de Loan : corriger le calcul, design inchangé) | Bande en haut 66 px → 0 à 375–402 px (31 → 0 à 430). Texte, titre et cartes juste sous l'en-tête au lieu de 40–46 px dessous. « See pricing » entièrement à l'écran. Ordinateur inchangé dans Chromium (en-tête de 68 px) |
| `textures` | **Retenue provisoirement**, à confirmer sur Safari réel | Rendu : écart de pixels au niveau du témoin (actuel contre actuel), écart moyen < 1 niveau sur 255 (ordinateur et mobile, P de 0 à 0,8). Dessin pendant la traversée du projecteur : 10,9–11,2 s → 3,8 s (ordinateur), 9,5 → 3,1 s (mobile). Script par image −30 à −50 %. Surface des calques ±10 % |
| `filtre` (`will-change: filter`) | Variante de test seulement (`?v=filtre`) | Peut ajouter des calques : gardée seulement si la ligne magenta disparaît sur iPhone sans coût mesuré |
| `lvh`, `dvh` | Variantes de test seulement | Choix après les valeurs mesurées sur l'iPhone |
| `nuit` (fond fixe caché sous une scène opaque) | Variante de test seulement | Sans effet sur le dessin dans Chromium (fond animé par le compositeur) ; effet mémoire à mesurer sur l'iPhone |

**Lumière en textures** (`scripts/textures.mjs`) : faisceaux, stries, cœur, rayons, halo, brume, éclat, sol, flaque et ombre sont calculés une fois en PNG (370 Ko au total), à partir des règles CSS de l'export relues telles quelles (interpolation prémultipliée, suréchantillonnage 3×3). La page déplace ces images par `transform` et `opacity`.
- **Avant** : le halo plein écran est redessiné à chaque image (353 fois sur la traversée, 428 en mobile) ; le calque des rayons, de 3 232 px de côté, est redessiné 116 fois (218 en mobile) ; la scène l'est 100 fois (194).
- **Après** : aucun redessin de ces calques. Il reste Loan (photos dont l'opacité change), redessiné ~60 fois.
- Les masques coniques des faisceaux et des rayons disparaissent.
- `construire.mjs` refuse les textures si les règles CSS de l'export ont changé depuis leur calcul.

**Vitrine (« See pricing »)**, ordinateur : le coût vient des cartes, dont les reflets sont redessinés à chaque image pendant que le faisceau pivote (dessin 9,5 → 8,9 s avec les textures). C'est inhérent à l'effet. À reprendre seulement si le banc sur Safari réel le montre lent.

**Écarté (mesuré)** : `fig`, une couche par photo de Loan pour éviter son redessin. Le redessin disparaît, mais le dessin reste à 3,9 s et les images lentes passent de 14 à 29 % (Chromium).

### Adresse de test et banc sur appareil

`npm run publier:essai` construit avec `ESSAI=1` et publie sur `loandrouard-essai`. Une construction normale échoue si le diagnostic ou les pages de comparaison s'y trouvent.
- Pages :
  - `/` : proposition (corrections retenues) ;
  - `actuel.html` : version `c9bb055` ;
  - `textures.html` : actuel + textures seulement.
- Paramètres :
  - `?diag=1` : panneau ;
  - `?auto=1` : parcours 1 (lent, rapide, descente complète, remontée) et parcours 2 (See pricing, cartes, Back to Loan, reprise), deux fois chacun ;
  - `?banc=1` : enchaîne actuel → textures → proposition → proposition+filtre → proposition+nuit, puis affiche un tableau (durée d'images p95 et % > 25 ms par phase, plantage et phase, arrivée en haut, écart en bas) ;
  - `?v=` : variantes ;
  - `?sans=` : retire un groupe de calques, pour isoler une cause.
- Fil d'Ariane (`localStorage`) : après un arrêt brutal du processus, la page suivante affiche la version, la phase, les derniers états et les calques visibles juste avant l'arrêt. Testé dans Chromium par un plantage provoqué (`Page.crash`).

```
ESSAI=1 node scripts/construire.mjs
node scripts/banc.mjs captures bureau|mobile actuel,textures      # équivalence au pixel (témoin actuel/actuel)
node scripts/banc.mjs trace bureau|mobile actuel,textures 2       # dessin, script, redessins par calque (BANC_PEINTS=1)
BANC_GESTE=vitrine node scripts/banc.mjs trace bureau actuel,textures
node scripts/banc.mjs parcours bureau|mobile actuel,textures,proposition
node scripts/banc.mjs calques mobile actuel,textures
node scripts/verif-entete.mjs                                      # en-tête à 375–1440 px
node scripts/verif-serie.mjs                                       # séries bornées et resultats.html (arrêts provoqués)
node scripts/verif-retraits.mjs                                    # retraits ?sans= : géométrie inchangée, éléments retirés
```

### 1er tour sur l'iPhone de Loan (04/10, iOS Safari 27.0, 393×852, DPR 3)

Sources : banc automatique sur 5 versions, captures en manuel, vidéo de 115 s (2 arrêts) examinée image par image. Classement : **démontré**, **fortement étayé**, **plausible**, **non démontré**.

| Constat | Classement |
|---|---|
| Correction `entete` efficace sur l'iPhone : en-tête 134 = jeton 134, plus de bande en haut, titre et texte sous la navigation | Démontré |
| Arrivée en haut à chaque ouverture (arrivée 0) | Démontré |
| Bande sombre du bas = écart de 40 px : hauteur visible 695 (barre déployée) ou 735 (repliée), svh 695, lvh 735, dvh suit la hauteur visible | Démontré |
| Page blanche = rechargement après l'arrêt du processus de la page (blanc pur, « Interruption détectée » au rechargement) | Démontré |
| Arrêts toujours pendant un défilement rapide, 6 sur 7 pendant ou juste après la traversée du projecteur blanc ou de l'étude, souvent à leur jonction | Démontré (constat) |
| Ligne rose : bug de Safari 27 sur le flou de repos de « See pricing » (dessin logiciel). Présente au repos, absente pendant l'animation d'entrée, revient après la vitrine, texte du bouton plus flou à ces moments | Fortement étayé |
| Cause de l'arrêt : mémoire graphique | Plausible (non démontré) |
| Cause de l'arrêt : défaut de Safari 27 | Plausible (non démontré) |
| Textures, `nuit`, `filtre` : effet sur la stabilité | Non démontré (1 passe chacune ; 4 arrêts sur 5) |
| Gain de fluidité des textures sur l'appareil | Non démontré (statistiques perdues à chaque arrêt dans la v1 du diagnostic) |

Autres observations :
- Version `nuit` (seule terminée) :
  - durées d'images : projecteur à 17 ms au p95 (0–4 % d'images au-delà de 25 ms) ;
  - étude 70 ms / 67 %, planche 89 ms / 36 %.
- « ResizeObserver loop » : 9 à 15 fois par session sur l'iPhone, jamais dans Chromium.
- Page sans styles (environ 15 s) après « A problem repeatedly occurred » puis rechargement : à n'examiner que si elle réapparaît ou si des ressources sont en échec.
- Rectification : l'écart de 24 px entre la ligne rose et le bouton ne vient pas du flou de 8 px de l'animation, puisque la ligne apparaît au repos.

### Diagnostic v2 et test d'endurance (phase 2)

**Diagnostic v2** (`optimise/diag.js`). Principe : ne pas fausser la mesure.
- Durées d'images en histogrammes, en mémoire.
- Relevé d'état toutes les 200 ms en mémoire, écrit dans `localStorage` une fois par seconde seulement. Le relevé contient : position, phase, P, parties de la page réellement à l'écran (`H` projecteur, `E` étude, `N` étude noire, `K` planche, `F` pied, `M` paiement), caméras de l'étude en couche séparée (`w`), vitesse, calques actifs du projecteur quand il est à l'écran.
- Statistiques recopiées à chaque écriture, donc conservées après un arrêt.
- « ResizeObserver loop » compté à part ; liste des ressources en échec ; fin de l'écran de chargement (instant, feuilles non appliquées).
- Panneau rafraîchi une fois par seconde.
- `?nodiag=1` désactive tout, pour mesurer le surcoût.
- **Surcoût mesuré** (Chromium, traversée du projecteur en 14 s, sans diagnostic / avec diagnostic / avec diagnostic et panneau) :
  - ordinateur (2 passes alternées) : script 914–1 021 / 943–1 024 / 976–1 136 ms ; images > 25 ms 16–17 / 15–21 / 17 % ; le panneau ajoute 20 à 60 ms de mise en page en 14 s ;
  - mobile (×4 plus lent, 1 passe) : script 4 894 / 4 718 / 4 441 ms ; dessin 3 090 / 2 949 / 3 149 ms ; images > 25 ms 21 / 18 / 14 %.

  Les écarts restent dans le bruit d'une passe à l'autre, sans surcoût systématique. Sur l'iPhone, la passe « sans panneau » du test d'endurance sert de contrôle indicatif.

**Endurance** (`/?stress=1`) :
- 60 s d'allers-retours rapides (3,5 hauteurs d'écran par seconde) entre l'éblouissement (P 0,7) et l'étude.
- Versions : actuel, proposition, proposition+nuit, 3 passes chacune en ordre alterné (carré latin).
- Chaque passe sur une page neuve, partie du haut, après 3 s de pause.
- Une passe « sans panneau », hors comparaison, contrôle l'effet du panneau.
- Les versions aux résultats proches passeront à 5 passes. Les retraits `?sans=` seront choisis d'après les données du diagnostic et de l'iPhone.

### Phase 3 : test de 2 h, protocole borné, lecture des résultats (05/10)

**Ce qui s'est passé sur l'iPhone (démontré, en relisant le code).** Le test d'endurance a tourné environ 2 h sans jamais afficher le tableau final. Ce n'était pas la faute de Loan : `serie()` contenait un bug.
- Quand la **dernière** page de la série (le témoin, sans panneau) s'arrêtait, l'arrêt était compté en mémoire, mais l'élément courant n'était pas recalculé et l'état n'était pas enregistré.
- La même page relançait donc la passe, sans limite de tentatives ni de durée.
- Un seul essai réussi du témoin aurait affiché le tableau final : il n'y en a eu aucun.
- Autre défaut : un rechargement plus de 180 s après un arrêt relançait la passe en silence, sans compter l'arrêt.

Les résultats des 9 premières passes (`ld-diag-serie`) et les 10 derniers arrêts (`ld-diag-incidents`) sont restés dans le navigateur de l'iPhone. Côté Worker, rien n'est conservé : pas de journalisation.

**Protocole borné** (`optimise/diag.js`, séries au format `v: 2`) :
- avant chaque passe, un marqueur « en cours » (indice, heure, identifiant de la page) est enregistré ;
- au chargement suivant, une passe restée « en cours » est comptée **une fois** comme arrêt, **quel que soit le délai**, puis la série passe à la suivante. Elle n'est jamais relancée ;
- le type d'arrêt est tiré du dernier état de cette passe :
  - `brutal` : la page était en cours, donc arrêt du processus ;
  - `arrière-plan` : la page était cachée ;
  - `fermée` : rechargement ou fermeture ordinaire ;
- le délai de rechargement est noté ;
- l'état est enregistré dès le chargement, avant toute autre action ;
- fin garantie :
  - liste épuisée ;
  - 25 min ;
  - plus de 2 chargements par page de la liste ;
  - bouton « Arrêter le test » (en bas à gauche, sur chaque page de série) : il interrompt la passe et affiche le tableau partiel ;
- une série de l'ancien format, comme celle du test de 2 h, n'est ni relancée ni modifiée ;
- `duree=` (en secondes) raccourcit les allers-retours, pour les vérifications locales seulement ;
- inchangé : mesures, variantes, panneau, ordre des passes.

**`resultats.html`** (adresse de test seulement, `optimise/resultats.html`) :
- page autonome, sans le site ni le diagnostic, en **lecture seule** ;
- elle affiche les clés `ld-diag…` **seulement**, jamais les autres clés du site comme celle du paiement : la série, les derniers arrêts et le dernier état ;
- le texte brut se copie d'un toucher (« Copier tout »).

**Vérification locale** (Chromium, `node scripts/verif-serie.mjs`, après `ESSAI=1 node scripts/construire.mjs`). Arrêts brutaux provoqués par `Page.crash`, sur une série courte de 2 pages (`duree=4`). Les 9 cas passent :

| Cas | Résultat |
|---|---|
| a. Sans arrêt | Terminée, 2 passes ok, 2 chargements |
| b. Arrêt sur la **dernière** page (le cas du test de 2 h) | Terminée, arrêt « brutal » compté une fois, passe non relancée, 3 chargements |
| c. Arrêt pendant chaque passe | Terminée, 2 arrêts, 4 chargements (= 2 × N) |
| c2. Arrêt de chaque page 0,7 s après son ouverture | Terminée par la limite de chargements (5) |
| d. Rechargement 4 min après l'arrêt | Arrêt compté (délai 242 s), série poursuivie et terminée |
| e. Bouton « Arrêter le test » | Tableau partiel, plus aucune navigation |
| f. Plus de 25 min | Fin « durée », résultats partiels |
| g. Ancienne série (format du 05/10) | Rien de lancé, série et arrêts intacts |
| h. `resultats.html` | Résumé correct, copie complète, stockage identique avant et après, clé de paiement ni lue ni copiée |
| i. Tri `?stress=sans` | 8 pages (4 versions × 2, ordre alterné), chaque page ouverte porte la variante et les retraits attendus, 8 chargements |

### Résultats du test de 2 h (récupérés le 06/10 avec `resultats.html`)

Le test a démarré le 05/10 à 11:13 (heure de Paris) sur l'iPhone de Loan (iOS Safari 27.0, hauteur visible 695, lvh 735).
- Les **9 passes** se sont toutes arrêtées en 3 minutes.
- Le **témoin** s'est ensuite arrêté en boucle jusqu'à 12:45, soit environ 1 h 30. Il y a eu 10 arrêts rien que dans ses 9 dernières minutes, entre 7 et 45 s chacun.

| Passe | Version | Arrêt après | Étape | Dernier relevé enregistré (y, phase, à l'écran, vitesse) |
|---|---|---|---|---|
| p1 | actuel | 7 s | aller 1 | 3279, blanc, H, +2353 px/s |
| p1 | proposition | 9 s | aller 2 | 3908, blanc, H, +2341 |
| p1 | proposition+nuit | 11 s | retour 1 | 5425, étude, HE, −1951 |
| p2 | proposition | 9 s | aller 2 | 4186, blanc, H, +2353 |
| p2 | proposition+nuit | 16 s | aller 2 | 4385, blanc, H, +2365 |
| p2 | actuel | 6 s | aller 1 | 3764, blanc, H, +2554 |
| p3 | proposition+nuit | 10 s | retour 1 | 5685, étude, E, −1088 |
| p3 | actuel | 4 s | descente | 40, ouverture, H, +197 |
| p3 | proposition | 6 s | aller 1 | 3466, blanc, H, +2353 |

| Constat | Classement |
|---|---|
| Le test d'endurance arrête toutes les versions en quelques secondes : actuel 3 sur 3, proposition 3 sur 3, nuit 3 sur 3, témoin sans un seul essai réussi en 1 h 30 | Démontré |
| Ni les textures ni « nuit » n'empêchent l'arrêt, dans ce test | Démontré |
| L'arrêt existe sans aucune correction Safari (actuel), donc avant nos changements | Démontré |
| Arrêt dès les premiers allers-retours, sur une page neuve chaque fois : pic soudain plutôt qu'usure progressive | Fortement étayé |
| Position exacte de l'arrêt dans la zone blanc ↔ étude | Non démontrée : le dernier relevé est écrit une fois par seconde, soit jusqu'à environ 2 400 px avant l'arrêt |
| Dans 2 des 10 derniers arrêts du témoin, plus aucune image pendant 0,4 à 0,6 s à la jonction (y figé à 4 880) juste avant l'arrêt | Démontré pour ces 2 cas (constat) |
| L'étude est la partie la plus lourde sur l'iPhone : p50 25 à 42 ms, 48 à 88 % d'images au-delà de 25 ms | Démontré |
| Gain de fluidité des textures sur l'iPhone | Non démontré : les passes s'arrêtent trop tôt |
| Nature de l'arrêt (mémoire ou défaut de Safari) | Plausible pour les deux |

Au 1er tour (04/10), deux arrêts ont eu lieu ailleurs : sur la planche des formules, et en remontant dans le texte du projecteur. La jonction n'est donc pas le seul endroit possible.

**Ligne rose** : paire de captures de Loan, même appareil et même moment.
- Version normale : ligne magenta de la largeur exacte du bouton, et « See pricing » beaucoup plus flou que prévu (le flou de repos du design est de 0,35 px).
- Version `filtre` : pas de ligne, et un flou conforme.

Classement : **fortement étayé**. Les vidéos ont été filmées dans le navigateur intégré d'une application (hauteur visible 647, lvh 768). Les tests suivants se font dans Safari.

### Phase 4 : tri des retraits et correctif ciblé de la ligne rose

**Retraits ajoutés au diagnostic** (adresse de test, affichage seulement) :
- `?sans=etude` : les deux caméras de l'étude (`.vfa-cam` : photos, tracés, ombres floues) ;
- `?sans=lumiere` : tous les calques de lumière du projecteur (faisceaux, rayons, halo, brume, éclat, exposition, blanc, rémanence, poussière, sol, flaque, ombre). La figure et les textes restent.

**Même parcours de défilement** (`node scripts/verif-retraits.mjs`, Chromium, formats iPhone 393×852 et ordinateur 1440×900) :
- mesures comparées : position et hauteur de l'étude, hauteur de la page, hauteur de la scène, bornes du test de stress `yA` et `yB`, à la page chargée puis aux 4 bornes d'un parcours de stress raccourci ;
- résultat : **identiques à la référence, à 0 px près**, pour `etude`, `lumiere` et `etude,lumiere` ;
- `.vfa-cam` est en position absolue dans une scène de hauteur fixe, donc hors du flux ; les calques de lumière aussi ;
- captures : `mesures/retraits/`.

**Tri** `?stress=sans` :
- 4 versions × 2 passes, ordre alterné, sans témoin : `proposition`, `-etude`, `-lumiere`, `-etude-lumiere` ;
- protocole borné : 10 min au plus, limite de 25 min.

Ces 2 passes servent de **tri**, pas de démonstration de cause.

| Résultat du tri | Interprétation provisoire |
|---|---|
| `-etude` tient, `-lumiere` s'arrête | Piste prioritaire : les caméras de l'étude |
| `-lumiere` tient, `-etude` s'arrête | Piste prioritaire : les calques de lumière du projecteur |
| Seule `-etude-lumiere` tient | Piste prioritaire : leur présence simultanée |
| Tout s'arrête | Rien ne se distingue ; découpage suivant choisi d'après les résultats |

**Confirmation** : si une variante se distingue nettement, on fait 3 passes de plus de la référence et de cette variante seulement, en ordre alterné (`?stress=1&versions=proposition,proposition-etude&passes=3`). Le résultat n'est dit « fortement étayé » qu'après cette confirmation.

**`?v=affiche`** : `will-change: filter` sur le seul bouton « See pricing », vérifié dans Chromium (aucun autre élément touché).
- Si la ligne disparaît sur l'iPhone, c'est d'abord une **validation visuelle**.
- Avant de garder le correctif dans `scripts/safari.mjs`, il faut vérifier qu'il n'aggrave ni la stabilité ni la charge de composition, car il crée une couche de plus :
  - banc borné et alterné `?banc=1&liste=proposition,proposition+affiche,proposition,proposition+affiche` ;
  - arrêts et durées d'images là où le bouton est à l'écran ;
  - nombre de calques dans Chromium, à titre indicatif.

## Vérifications

- **Au pixel** (`VERIF_REF`, 8 pages × 1440 / 1280 / 390 px × 6 hauteurs, APRÈS sans `aimantation` contre AVANT) : 44 captures sur 144 avec un écart, toutes sous 0,19 % des pixels. Mêmes zones, même ordre de grandeur que le témoin AVANT contre AVANT (35 captures sur 144, jusqu'à 0,21 %) : grains du sable d'or et poussière (tirage aléatoire), annotations de l'étude en mouvement, ton de l'en-tête après un saut hors du projecteur (aléatoire sur la version en ligne, voir ci-dessous). Écarts propres à APRÈS : le logo WUSHU réduit, identique à l'œil ; la ligne « THREE PACKAGES · FROM 49 € » saisie à un autre moment de son fondu (couleur et luminosité identiques, vérifiées en temps réel).
- **Parcours** (ordinateur et mobile, AVANT et APRÈS, résultats identiques) : vitrine des prix, choix d'une carte, paiement (repli vers Stripe, aucun paiement réel), Échap, sommaire → Pricing, verrou du retournement des cartes, liens du pied de page, retour `?session_id=`, `?lang=fr`, changement de langue sur CGV, Privacy et Legal, navigation par l'en-tête ; aucune erreur JavaScript.
- **Ouverture** au même endroit qu'AVANT (cran du projecteur) à 1440, 1280 et 390 px, avec et sans cache.
- **Construction** : `npm run construire` sans erreur ni avertissement ; `node --check` sur les scripts.

Deux problèmes trouvés par ces vérifications et corrigés avant toute mise en ligne :
- sélecteur de langue inactif sur les pages légales : causé par l'essai `refetch`, retiré (voir « Écarté ») ;
- ton de l'en-tête : le design system contient une copie plus ancienne de `header-flottant.js`. En ligne, les deux copies s'exécutent deux fois chacune et la dernière à passer décide, selon le hasard du chargement. Une capture AVANT contre AVANT l'a montré : après un saut hors du projecteur, texte clair sur fond clair. APRÈS, chacune s'exécute une fois, dans un ordre fixe (même décision que la copie du design system en ligne) : même résultat à chaque essai (12 sur 12).

<details>
<summary>Tableau complet (node scripts/mesurer.mjs --comparer avant apres)</summary>

| Profil | Mesure | avant | apres |
|---|---|---|---|
| bureau | vf : page prête (1re visite) | 1340 ms | 1057 ms (-21 %) |
| bureau | vf : page prête (avec cache) | 891 ms | 710 ms (-20 %) |
| bureau | vf : page révélée (1re visite) | 2260 ms | 1955 ms (-13 %) |
| bureau | vf : page révélée (avec cache) | 1829 ms | 1534 ms (-16 %) |
| bureau | vf : FCP | 844 ms | 740 ms (-12 %) |
| bureau | vf : LCP | 844 ms | 1324 ms (+57 %) |
| bureau | vf : CLS | 0.0017 | 0.0006 (-65 %) |
| bureau | vf : blocage (somme > 50 ms) | 315 ms | 128 ms (-59 %) |
| bureau | vf : requêtes | 58 | 50 (-14 %) |
| bureau | vf : poids transféré | 3342.5 Ko | 2209.3 Ko (-34 %) |
| bureau | vf : poids transféré (avec cache) | 97.1 Ko | 98.2 Ko (+1 %) |
| bureau | cgv : page prête (1re visite) | 820 ms | 663 ms (-19 %) |
| bureau | cgv : page prête (avec cache) | 479 ms | 367 ms (-23 %) |
| bureau | cgv : page révélée (1re visite) | 1668 ms | 1517 ms (-9 %) |
| bureau | cgv : page révélée (avec cache) | 1369 ms | 800 ms (-42 %) |
| bureau | cgv : FCP | 536 ms | 480 ms (-10 %) |
| bureau | cgv : LCP | 584 ms | 480 ms (-18 %) |
| bureau | cgv : CLS | 0.0003 | 0 (-100 %) |
| bureau | cgv : blocage (somme > 50 ms) | 74 ms | 0 ms (-100 %) |
| bureau | cgv : requêtes | 45 | 36 (-20 %) |
| bureau | cgv : poids transféré | 894.4 Ko | 496.6 Ko (-44 %) |
| bureau | cgv : poids transféré (avec cache) | 36.2 Ko | 36.5 Ko (+1 %) |
| bureau | privacy : page prête (1re visite) | 772 ms | 588 ms (-24 %) |
| bureau | privacy : page prête (avec cache) | 458 ms | 342 ms (-25 %) |
| bureau | privacy : page révélée (1re visite) | 1651 ms | 944 ms (-43 %) |
| bureau | privacy : page révélée (avec cache) | 1368 ms | 649 ms (-53 %) |
| bureau | privacy : FCP | 440 ms | 360 ms (-18 %) |
| bureau | privacy : LCP | 448 ms | 360 ms (-20 %) |
| bureau | privacy : CLS | 0.15 | 0.1453 (-3 %) |
| bureau | privacy : blocage (somme > 50 ms) | 64 ms | 11 ms (-83 %) |
| bureau | privacy : requêtes | 47 | 36 (-23 %) |
| bureau | privacy : poids transféré | 881.1 Ko | 483.2 Ko (-45 %) |
| bureau | privacy : poids transféré (avec cache) | 22.7 Ko | 23.1 Ko (+2 %) |
| bureau | legal : page prête (1re visite) | 733 ms | 559 ms (-24 %) |
| bureau | legal : page prête (avec cache) | 479 ms | 337 ms (-30 %) |
| bureau | legal : page révélée (1re visite) | 1511 ms | 1508 ms (0 %) |
| bureau | legal : page révélée (avec cache) | 1372 ms | 799 ms (-42 %) |
| bureau | legal : FCP | 428 ms | 344 ms (-20 %) |
| bureau | legal : LCP | 428 ms | 344 ms (-20 %) |
| bureau | legal : CLS | 0.1462 | 0.1439 (-2 %) |
| bureau | legal : blocage (somme > 50 ms) | 47 ms | 13 ms (-72 %) |
| bureau | legal : requêtes | 46 | 37 (-20 %) |
| bureau | legal : poids transféré | 838.9 Ko | 541.7 Ko (-35 %) |
| bureau | legal : poids transféré (avec cache) | 17.9 Ko | 18.3 Ko (+2 %) |
| bureau | défilement normal : durée du parcours (mêmes gestes) | 43.9 s | 33.5 s (-24 %) |
| bureau | défilement normal : image p95 | 116.7 ms | 150 ms (+29 %) |
| bureau | défilement normal : images > 25 ms | 54.1 % | 53.2 % (-2 %) |
| bureau | défilement normal : réaction molette/doigt p95 | 351 ms | 317 ms (-10 %) |
| bureau | défilement normal : fil principal occupé | 8614 ms | 6380 ms (-26 %) |
| bureau | défilement normal : CPU navigateur | 202.5 % | 214.1 % (+6 %) |
| bureau | défilement normal : images apparues en retard | 0 | 0 |
| bureau | défilement rapide : durée du parcours (mêmes gestes) | 20.4 s | 15.5 s (-24 %) |
| bureau | défilement rapide : image p95 | 150 ms | 166.6 ms (+11 %) |
| bureau | défilement rapide : images > 25 ms | 71.1 % | 79.1 % (+11 %) |
| bureau | défilement rapide : réaction molette/doigt p95 | 403 ms | 478 ms (+19 %) |
| bureau | défilement rapide : fil principal occupé | 4527 ms | 3248 ms (-28 %) |
| bureau | défilement rapide : CPU navigateur | 220.3 % | 227.6 % (+3 %) |
| bureau | défilement rapide : images apparues en retard | 0 | 0 |
| bureau | repos (ouverture) : fil principal | 9.4 % | 8.8 % (-6 %) |
| bureau | repos (ouverture) : CPU navigateur | 110.9 % | 110.9 % (0 %) |
| bureau | repos (ouverture) : rappels d'animation / s | 41.6 | 44.8 (+8 %) |
| bureau | repos (etude) : fil principal | 9.1 % | 6.6 % (-27 %) |
| bureau | repos (etude) : CPU navigateur | 134.9 % | 122.3 % (-9 %) |
| bureau | repos (etude) : rappels d'animation / s | 28.9 | 3.8 (-87 %) |
| bureau | repos (pied) : fil principal | 45.1 % | 31.7 % (-30 %) |
| bureau | repos (pied) : CPU navigateur | 131.2 % | 136.4 % (+4 %) |
| bureau | repos (pied) : rappels d'animation / s | 130.8 | 70.8 (-46 %) |
| bureau | interactions : pire (≈ INP) | 288 ms | 208 ms (-28 %) |
| bureau | interactions : p75 | 192 ms | 200 ms (+4 %) |
| bureau | CGV : défilement image p95 | 16.8 ms | 16.8 ms (0 %) |
| bureau | CGV : changement de langue | 64 ms | 72 ms (+13 %) |
| bureau | navigation Video Feedback → CGV | 1561 ms | 1389 ms (-11 %) |
| bureau | calques (haut de page) : Mpx | 17.4 Mpx | 17.4 Mpx (0 %) |
| bureau | calques (25 %) : Mpx | 39.8 Mpx | 39.8 Mpx (0 %) |
| bureau | tas JS après 5 cycles | 4.8 Mo | 4.92 Mo (+3 %) |
| bureau | éclairs au chargement (film) | 0 | 0 |
| mobile | vf : page prête (1re visite) | 3801 ms | 3000 ms (-21 %) |
| mobile | vf : page prête (avec cache) | 3135 ms | 2347 ms (-25 %) |
| mobile | vf : page révélée (1re visite) | 4675 ms | 3806 ms (-19 %) |
| mobile | vf : page révélée (avec cache) | 4032 ms | 3314 ms (-18 %) |
| mobile | vf : FCP | 1980 ms | 1448 ms (-27 %) |
| mobile | vf : LCP | 2712 ms | 1448 ms (-47 %) |
| mobile | vf : CLS | 0.0014 | 0 (-100 %) |
| mobile | vf : blocage (somme > 50 ms) | 2081 ms | 1003 ms (-52 %) |
| mobile | vf : requêtes | 57 | 49 (-14 %) |
| mobile | vf : poids transféré | 3342.5 Ko | 2209.2 Ko (-34 %) |
| mobile | vf : poids transféré (avec cache) | 97.2 Ko | 98.3 Ko (+1 %) |
| mobile | cgv : page prête (1re visite) | 2454 ms | 1794 ms (-27 %) |
| mobile | cgv : page prête (avec cache) | 2037 ms | 1447 ms (-29 %) |
| mobile | cgv : page révélée (1re visite) | 3376 ms | 2730 ms (-19 %) |
| mobile | cgv : page révélée (avec cache) | 2797 ms | 2368 ms (-15 %) |
| mobile | cgv : FCP | 1272 ms | 1104 ms (-13 %) |
| mobile | cgv : LCP | 2108 ms | 1104 ms (-48 %) |
| mobile | cgv : CLS | 0 | 0 |
| mobile | cgv : blocage (somme > 50 ms) | 1301 ms | 554 ms (-57 %) |
| mobile | cgv : requêtes | 46 | 36 (-22 %) |
| mobile | cgv : poids transféré | 894.5 Ko | 496.6 Ko (-44 %) |
| mobile | cgv : poids transféré (avec cache) | 36.2 Ko | 36.6 Ko (+1 %) |
| mobile | privacy : page prête (1re visite) | 2249 ms | 1732 ms (-23 %) |
| mobile | privacy : page prête (avec cache) | 1783 ms | 1380 ms (-23 %) |
| mobile | privacy : page révélée (1re visite) | 3213 ms | 2631 ms (-18 %) |
| mobile | privacy : page révélée (avec cache) | 2650 ms | 2205 ms (-17 %) |
| mobile | privacy : FCP | 1264 ms | 1060 ms (-16 %) |
| mobile | privacy : LCP | 1264 ms | 1060 ms (-16 %) |
| mobile | privacy : CLS | 0 | 0 |
| mobile | privacy : blocage (somme > 50 ms) | 965 ms | 484 ms (-50 %) |
| mobile | privacy : requêtes | 46 | 35 (-24 %) |
| mobile | privacy : poids transféré | 843.8 Ko | 445.9 Ko (-47 %) |
| mobile | privacy : poids transféré (avec cache) | 22.8 Ko | 23.1 Ko (+1 %) |
| mobile | legal : page prête (1re visite) | 2181 ms | 1542 ms (-29 %) |
| mobile | legal : page prête (avec cache) | 1661 ms | 1284 ms (-23 %) |
| mobile | legal : page révélée (1re visite) | 3048 ms | 2307 ms (-24 %) |
| mobile | legal : page révélée (avec cache) | 2663 ms | 2070 ms (-22 %) |
| mobile | legal : FCP | 1188 ms | 960 ms (-19 %) |
| mobile | legal : LCP | 1792 ms | 960 ms (-46 %) |
| mobile | legal : CLS | 0 | 0 |
| mobile | legal : blocage (somme > 50 ms) | 855 ms | 359 ms (-58 %) |
| mobile | legal : requêtes | 46 | 37 (-20 %) |
| mobile | legal : poids transféré | 839 Ko | 541.7 Ko (-35 %) |
| mobile | legal : poids transféré (avec cache) | 17.9 Ko | 18.3 Ko (+2 %) |
| mobile | défilement normal : durée du parcours (mêmes gestes) | 96.7 s | 72.4 s (-25 %) |
| mobile | défilement normal : image p95 | 116.6 ms | 99.9 ms (-14 %) |
| mobile | défilement normal : images > 25 ms | 75.1 % | 63.7 % (-15 %) |
| mobile | défilement normal : réaction molette/doigt p95 | 197 ms | 153 ms (-22 %) |
| mobile | défilement normal : fil principal occupé | 72374 ms | 50557 ms (-30 %) |
| mobile | défilement normal : CPU navigateur | 193.5 % | 196.7 % (+2 %) |
| mobile | défilement normal : images apparues en retard | 0 | 0 |
| mobile | défilement rapide : durée du parcours (mêmes gestes) | 46.2 s | 35.7 s (-23 %) |
| mobile | défilement rapide : image p95 | 100.1 ms | 100 ms (0 %) |
| mobile | défilement rapide : images > 25 ms | 80.6 % | 67 % (-17 %) |
| mobile | défilement rapide : réaction molette/doigt p95 | 186 ms | 166 ms (-11 %) |
| mobile | défilement rapide : fil principal occupé | 35653 ms | 25226 ms (-29 %) |
| mobile | défilement rapide : CPU navigateur | 184.9 % | 188 % (+2 %) |
| mobile | défilement rapide : images apparues en retard | 0 | 0 |
| mobile | repos (ouverture) : fil principal | 22.9 % | 26.1 % (+14 %) |
| mobile | repos (ouverture) : CPU navigateur | 155 % | 139.1 % (-10 %) |
| mobile | repos (ouverture) : rappels d'animation / s | 60 | 58.7 (-2 %) |
| mobile | repos (etude) : fil principal | 31.6 % | 1.8 % (-94 %) |
| mobile | repos (etude) : CPU navigateur | 160 % | 142.4 % (-11 %) |
| mobile | repos (etude) : rappels d'animation / s | 60 | 0 (-100 %) |
| mobile | repos (pied) : fil principal | 99.9 % | 98.3 % (-2 %) |
| mobile | repos (pied) : CPU navigateur | 150.4 % | 149.4 % (-1 %) |
| mobile | repos (pied) : rappels d'animation / s | 61 | 46.2 (-24 %) |
| mobile | interactions : pire (≈ INP) | 96 ms | 96 ms (0 %) |
| mobile | interactions : p75 | 88 ms | 88 ms (0 %) |
| mobile | CGV : défilement image p95 | 50 ms | 33.3 ms (-33 %) |
| mobile | CGV : changement de langue | 208 ms | 176 ms (-15 %) |
| mobile | navigation Video Feedback → CGV | 5107 ms | 4653 ms (-9 %) |
| mobile | calques (haut de page) : Mpx | 10.5 Mpx | 10.6 Mpx (+1 %) |
| mobile | calques (25 %) : Mpx | 25.1 Mpx | 25.1 Mpx (0 %) |
| mobile | tas JS après 5 cycles | 3.54 Mo | 3.64 Mo (+3 %) |
| mobile | éclairs au chargement (film) | 0 | 0 |

</details>
