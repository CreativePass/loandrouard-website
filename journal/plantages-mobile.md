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
| 22/11 (soir) | Mesure de toute la page et des gestes ; feuille de l'étude à la finesse de l'écran (`finesse`), lueurs « nuit » compactes (`nuitcompacte`), budget de mémoire vérifié avant chaque mise en ligne (`verif-memoire.mjs`) | ✅ (Loan, 23/11 : aucun plantage trouvé) ; en ligne le 23/11 |

## Pourquoi « aléatoire » (22/11)
- Au repos, aucun endroit de la page ne dépasse : les arrêts viennent des **mouvements** (défilement rapide, descente « See full details »), quand de grands calques apparaissent ou se redessinent vite (Safari garde une 2e image pendant un redessin et libère les anciennes avec un temps de retard).
- La hauteur du pic dépend de la vitesse, de ce qui reste en mémoire (juste après un rechargement : plus de mémoire déjà prise) et de l'état de l'iPhone : même geste, résultat différent.
- Tous les iPhone / iPad sont concernés, et tous les navigateurs de l'iPhone (même moteur que Safari) ; pas Android ni l'ordinateur.

## Historique

### 23/11 — mise en ligne (✅)
- Loan, après essai sur l'adresse de test (`0356e231`) : « pas réussi à trouver de bug ». En ligne sur loandrouard.com (`loandrouard-site` version `750bdb46`, retour arrière `40d79d21`). Méthode gardée pour la suite : `LEGERETE.md`.

### 22/11 (soir) — plantages « aléatoires » : feuille de l'étude à la finesse de l'écran (✅)
- Problème (Loan, loandrouard.com `40d79d21`) : arrêts imprévisibles sur iPhone, au défilement rapide, en remontant, et 3 fois de suite sur « See pricing » → « See full details » juste après le chargement ; parfois tout marche. Demande : une solution stable, pas un bug à la fois.
- Méthode : mesure de toute la page (un endroit tous les demi-écrans) et des gestes, en ne comptant que les calques qui dessinent vraiment (conteneurs vides à 0, comme mesuré dans Safari le 08/10). Projecteur 47–85 Mo ; **étude jusqu'à 114 Mo sur 19 écrans, dont 4 × 33 Mo pour la feuille** et ses 3 calques (caméra noire, négatif, or), dessinés 3 fois plus grands que l'écran ne peut les montrer (caméra à ×0,33–0,5) et redessinés ≈ 40 fois pendant la descente « See full details ». Ils sont dans tous les arrêts relevés depuis le 21/11.
- Fait : `finesse` (iPhone / iPad : feuille posée au plus petit niveau aussi fin que l'écran, mécanisme du 27/10 ; jamais agrandie après coup ; ≤ 0,8 pendant un défilement rapide ; loupe : 1) ; `nuitcompacte` (3 lueurs du fond « nuit » dessinées 3 fois plus petites).
- Mesuré (`verif-memoire.mjs`, avant → après) : maximum au repos 150 → 103 Mo ; étude 47–115 → 24–50 Mo ; « See full details » 149 → 101 Mo ; descente éclair jusqu'aux cartes 163 → 94 Mo ; remontée des cartes vers l'étude 115 → 53 Mo (l'ancienne version dépassait le budget de 130 Mo dans 3 cas sur 5). Surface redessinée de la feuille pendant la descente ÷ 2 à 3. Image : même forme partout (4 formats d'iPhone) ; seuls les traits fins diffèrent d'anticrénelage (≤ 0,2 % des pixels sur 393 × 852 et 375 × 667, ≤ 1,5 % sur 430 × 932), à l'œil identiques ; ordinateur et Android inchangés.
- ❌ Écarté le même jour : niveaux espacés (0,4 / 0,55 / 0,75 / 1) : petits textes visiblement adoucis par endroits.
- Garde-fou : `scripts/verif-memoire.mjs` (budget de 130 Mo, toute la page et les gestes à risque), à lancer avant chaque mise en ligne.
- Si ça plante encore : relevé du diagnostic (adresse de test, `resultats.html`) ; rapport « JetsamEvent » de l'iPhone (Réglages → Confidentialité et sécurité → Analyse et améliorations → Données d'analyse ; seulement si le partage des analyses est activé) : preuve directe d'un arrêt pour mémoire.
- Fichiers : `scripts/safari.mjs` (`finesse`, `nuitcompacte`), `scripts/verif-finesse.mjs`, `scripts/verif-memoire.mjs`, `optimise/diag.js` (niveau `b…` noté).
- Adresse de test : version `0356e231` (22/11) ; en ligne le 23/11 (`750bdb46`).

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
