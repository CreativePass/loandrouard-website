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
| `aimantation` | aimantation au cran retirée, ouverture au même endroit (**validé par Loan le 02/10, à reporter dans Claude Design**) | molette lente : 20 crans → +2 000 px (avant : bloquée) |
| `defilement` | molette et glissé bloquants seulement pendant le verrou du retournement | réaction molette −26 %, glissé −16 % |
| `sable` | `--flux` posé sur le nom seul | style au pied de page −82 %, fil principal −23 % |
| `poussiere` | poussière du projecteur arrêtée hors écran | mobile, étude : fil principal 29 % → 2,5 % |
| `parallaxe` | parallaxe ignorée hors écran | souris dans l'étude : −37 % |
| `chargement` | feuille de l'écran de chargement laissée en place (inerte) | gel à l'apparition supprimé (0,1 s / 0,5 s) |
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
