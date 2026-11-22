# Plantages sur mobile (iPhone, Safari)

Symptôme : « A problem repeatedly occurred », ou page blanche puis rechargement. Cause la plus probable, jamais démontrée directement : Safari ferme la page quand la **mémoire graphique** (calques) dépasse sa limite (aucun rapport de plantage laissé sur l'iPhone, 06/10). Pas de Safari ici : on mesure dans Chromium avec les règles de WebKit (`scripts/verif-calques-webkit.mjs`), et seul l'iPhone de Loan tranche.

## Ce qu'on sait de Safari (iPhone)
- Chaque calque séparé (3D, `will-change`, filtre, fixe, animation, toile) a sa propre image en mémoire ; une image dans un grand cadre est dessinée à la taille du cadre (×3 pixels sur iPhone).
- Une transformation CSS n'est jamais redessinée ; le zoom de Safari, lui, redessine **tous** les calques à la nouvelle échelle.
- Un filtre CSS donne toujours un calque.
- Des doigts posés pendant l'élan d'un défilement ne sont pas transmis à la page.
- Recréer d'un coup beaucoup de calques (ce qui était caché redevient visible) est un moment à risque.

## Pistes déjà explorées
| Date | Piste | Résultat |
|---|---|---|
| 04–07/10 | Lumières du projecteur en textures (`textures`) | ✅ fluidité ; ❌ n'empêche pas les arrêts |
| 04–07/10 | Fond « nuit » caché sous la scène (`nuit`) | ❌ sans effet |
| 06–07/10 | Retirer des familles de calques (`?sans=`) | ✅ diagnostic : sans les lumières mobiles, plus d'arrêt |
| 08/10 | Lumière cachée sous le blanc (`sousblanc`) | ❌ réfuté (3 arrêts sur 3) |
| 08/10 | Textures dans de petits cadres agrandis (`compact`) | ✅ 490 → 215 Mo mesurés dans Safari ; arrêts 3/3 → 0/3 |
| 09/11 | Calques invisibles libérés (`eteints`, `lueur`) | ✅ gardés (mémoire) |
| 14/11 | Page à plat quand l'élan s'arrête net (`filet` complet) | ❌ arrêts en remontant la page (18/11) |
| 18/11 | Filet réduit au vrai zoom de Safari | ✅ remontée réparée (« ça marche ») |
| 21/11 | Rien de caché sous la planche des cartes (`sousplanche`) | ✅ descente ; arrêt en remontant vite réglé par `sousnoir` (22/11) |
| 22/11 | Rien de dessiné sous le fond noir de l'étude, ni photo / négatif / or invisibles (`sousnoir`) | ✅ (Loan, 22/11) |

## Historique

### 22/11 — mise en ligne (✅)
- Loan, après essai sur l'iPhone et le Mac (adresse de test `c6e30b51`) : « tout à l'air de marcher ». Corrections du 21 et 22/11 en ligne sur loandrouard.com (`loandrouard-site` version `40d79d21`).

### 22/11 — arrêt en remontant vite des cartes vers l'étude (✅)
- Relevé du diagnostic (iPhone de Loan, copié depuis `resultats.html`) : descente éclair jusqu'au pied de page, remontée rapide à travers les cartes, arrêt juste quand l'étude redevient dessinée d'un coup (classes e, n, c retirées), cartes encore à l'écran. Même trajet que l'arrêt du 21/11 à 15 h 18. Loan croyait être en haut : le relevé dit le bas.
- Reproduit (Chromium) : 42 → 196 Mo estimés d'une image à la suivante ; à cet endroit, 3 grands calques ne montrent rien (caméra blanche sous le fond noir opaque, photo à opacité 0, corrections en or effacées).
- Fait : `sousnoir`, ils ne sont plus dessinés tant qu'ils sont invisibles (or : iPhone / iPad seulement, voir `PERFORMANCE.md`).
- Mesuré : 0 pixel de différence (7 écrans) ; endroit de l'arrêt 194 → 127 Mo ; fin de l'étude 143 → 77 Mo ; à la remontée, ≈ 90 Mo redessinés d'un coup au lieu de ≈ 155.
- ❌ Écarté : cacher l'or effacé partout (Chrome dessine alors le négatif autrement).
- Pistes si ça plante encore au même endroit : réapparition de l'étude étalée sur plusieurs images ; `will-change` du fond de la planche (17 Mo) sur mobile ; retournement des cartes sans 3D sur mobile.
- Fichiers : `scripts/safari.mjs` (`sousnoir`), `scripts/verif-sousnoir.mjs`.
- Adresse de test : version `c6e30b51` (22/11) ; en ligne le 22/11 (`40d79d21`).

### 21/11 (soir) — « quand je scrolle super vite, la page crash » (enquête → 22/11)
- Retour de Loan sur l'iPhone après `sousplanche` (adresse de test) : arrêt en défilement très rapide, endroit inconnu.
- Pas de correction à l'aveugle : relevé du diagnostic demandé (dernier état avant l'arrêt, avec les parties cachées p/e/n/c). L'écoute en direct (`wrangler tail`) s'est arrêtée avant l'essai ; le relevé est venu de `resultats.html`.

### 21/11 — arrêt en arrivant sur les cartes (✅)
- Problème : « tout va bien jusqu'à l'arrivée sur les cartes, puis le site crash » (descente, iPhone).
- Trouvé (Chromium, format iPhone) : en arrivant, l'étude s'efface (opacité 1 → 0,1) ; la règle « ce qui est recouvert n'est pas dessiné » ne comptait plus sur elle → le **projecteur** (le plus lourd, à 17 000 px au-dessus) et le fond « nuit » étaient **redessinés d'un coup**, pendant le retournement 3D des cartes. À l'arrêt, sous le papier opaque, restaient aussi les 2 caméras de l'étude, son négatif et ses corrections dorées (≈ 4 × 33 Mo).
- Pourquoi c'est revenu : du 15 au 18/11, le filet mettait la page à plat à chaque coup de doigt, ce qui allégeait aussi ce moment ; retiré le 18/11.
- Fait : projecteur entièrement hors de l'écran (marge comprise) jamais dessiné ; sur mobile, caméras de l'étude et fond « nuit » cachés quand le papier opaque recouvre la figure (marge comprise).
- Mesuré : à l'arrêt 180 → 45 Mo estimés (393 × 852), projecteur plus jamais redessiné à l'arrivée ; 0 pixel de différence de l'arrêt à 400 px plus haut, 6 tailles d'écran (`scripts/verif-sousplanche.mjs`). Sur très grand écran (430 × 932, iPad portrait), la règle des caméras ne se déclenche pas (marge de sécurité gardée) ; le projecteur reste caché partout.
- Fichiers : `scripts/safari.mjs` (`sousplanche`).
- Adresse de test : version `4bcac6bf` (21/11) ; en ligne le 22/11 (`40d79d21`).
- Reste lourd : l'approche (≈ 205 Mo estimés dans les 250 derniers px : étude visible + fond « nuit » + cartes en 3D). Pistes si ça plante encore : caméra de l'étude blanche cachée sous l'étude noire (faite le 22/11, `sousnoir`) ; retournement des cartes sans 3D sur mobile ; `will-change` du fond de la planche (17 Mo) sur mobile.

### 18/11 — arrêts en remontant la page (✅ « ça marche »)
- Cause probable : le filet (page à plat à chaque coup de doigt) redessinait projecteur et étude à chaque image, puis recréait tous les calques en haut de page.
- Fait : filet seulement quand Safari a vraiment zoomé. Voir `zoom-loupe.md`.

### 08/10 — arrêts en défilement rapide (✅)
- Mesure dans l'inspecteur de Safari : textures des lumières dessinées à 3 000 × 3 000 px (45 Mo chacune) → `compact` : 490 → 215 Mo, 0 arrêt sur 3 au test d'endurance.
