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
| 21/11 | Rien de caché sous la planche des cartes (`sousplanche`) | ⏳ voir ci-dessous |

## Historique

### 21/11 — arrêt en arrivant sur les cartes (⏳ à confirmer sur l'iPhone)
- Problème : « tout va bien jusqu'à l'arrivée sur les cartes, puis le site crash » (descente, iPhone).
- Trouvé (Chromium, format iPhone) : en arrivant, l'étude s'efface (opacité 1 → 0,1) ; la règle « ce qui est recouvert n'est pas dessiné » ne comptait plus sur elle → le **projecteur** (le plus lourd, à 17 000 px au-dessus) et le fond « nuit » étaient **redessinés d'un coup**, pendant le retournement 3D des cartes. À l'arrêt, sous le papier opaque, restaient aussi les 2 caméras de l'étude, son négatif et ses corrections dorées (≈ 4 × 33 Mo).
- Pourquoi c'est revenu : du 15 au 18/11, le filet mettait la page à plat à chaque coup de doigt, ce qui allégeait aussi ce moment ; retiré le 18/11.
- Fait : projecteur entièrement hors de l'écran (marge comprise) jamais dessiné ; sur mobile, caméras de l'étude et fond « nuit » cachés quand le papier opaque recouvre la figure (marge comprise).
- Mesuré : à l'arrêt 180 → 45 Mo estimés (393 × 852), projecteur plus jamais redessiné à l'arrivée ; 0 pixel de différence de l'arrêt à 400 px plus haut, 6 tailles d'écran (`scripts/verif-sousplanche.mjs`). Sur très grand écran (430 × 932, iPad portrait), la règle des caméras ne se déclenche pas (marge de sécurité gardée) ; le projecteur reste caché partout.
- Fichiers : `scripts/safari.mjs` (`sousplanche`).
- Adresse de test : version `4bcac6bf` (21/11) ; pas encore sur loandrouard.com.
- Reste lourd : l'approche (≈ 205 Mo estimés dans les 250 derniers px : étude visible + fond « nuit » + cartes en 3D). Pistes si ça plante encore : caméra de l'étude blanche cachée sous l'étude noire ; retournement des cartes sans 3D sur mobile ; `will-change` du fond de la planche (17 Mo) sur mobile.

### 18/11 — arrêts en remontant la page (✅ « ça marche »)
- Cause probable : le filet (page à plat à chaque coup de doigt) redessinait projecteur et étude à chaque image, puis recréait tous les calques en haut de page.
- Fait : filet seulement quand Safari a vraiment zoomé. Voir `zoom-loupe.md`.

### 08/10 — arrêts en défilement rapide (✅)
- Mesure dans l'inspecteur de Safari : textures des lumières dessinées à 3 000 × 3 000 px (45 Mo chacune) → `compact` : 490 → 215 Mo, 0 arrêt sur 3 au test d'endurance.
