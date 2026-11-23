# Site léger sur iPhone — méthode et règles (22/11/2026)

Demande de Loan (23/11) : garder cette méthode pour tous les prochains changements du site, sur cette page ou une autre, et rendre
les éléments plus légers et optimisés dès le départ. Ce fichier n'est pas publié sur le site. Détail des mesures : `PERFORMANCE.md`
(« Retour de Loan du 22/11 (soir) ») ; historique : `journal/plantages-mobile.md`.

## Pourquoi
- L'iPhone ferme la page (« A problem repeatedly occurred », page blanche) quand la mémoire de ses images de dessin (calques)
  dépasse sa limite. Tous les iPhone et iPad, et tous leurs navigateurs (même moteur que Safari) ; pas Android ni l'ordinateur.
- Le danger n'est pas l'état au repos mais le **pic pendant un mouvement** (défilement rapide, descente « See full details ») : de
  grands calques apparaissent ou se redessinent vite, et Safari libère les anciens avec retard. Le pic varie avec la vitesse et
  l'état de l'iPhone (juste après un rechargement, moins de marge) : les plantages semblent aléatoires.

## Comment Safari compte (à garder en tête)
- **Calque séparé** : 3D (`translate3d`, `rotateX/Y`, `preserve-3d`), `will-change` (transform, opacity, filter), filtre CSS,
  `position: fixed / sticky`, animation CSS de transform / opacity / filter, `<canvas>`, et tout ce qui passe par-dessus un calque.
- **Son poids** = taille CSS × 3 × 3 × 4 octets : un plein écran d'iPhone (393 × 852) ≈ 12 Mo.
- Une **réduction par `transform` ne réduit pas** ce poids (toujours la taille CSS) ; un agrandissement par `transform` n'est
  jamais redessiné (on peut donc dessiner petit et agrandir).
- Un **conteneur sans fond ni contenu propre ne coûte rien** ; ce qu'il contient compte.
- Un calque qui **se redessine** garde 2 (voire 3) images ; un `drop-shadow` combiné à d'autres filtres est calculé par le
  processeur, avec des images intermédiaires de même taille.
- Le zoom à deux doigts de Safari redessine tout à l'échelle du zoom : d'où la loupe du site.

## La méthode (celle qui a marché)
1. **Mesurer toute la page et les gestes**, pas seulement l'endroit du dernier plantage : `node scripts/verif-memoire.mjs`
   (budget de 130 Mo). Chercher le plus gros calque et ce qui se redessine pendant le mouvement.
2. **Dessiner chaque calque à la finesse que l'écran affiche, pas plus** :
   - flou, dégradé, lueur, halo, lumière : cadre 3 à 5 fois plus petit, agrandi par `transform` (`compact`, `lueur`, `nuitcompacte`) ;
   - contenu montré réduit (caméra, `scale`) : taille CSS posée au niveau de réduction, jamais agrandi après coup (`finesse` ;
     niveaux espacés de ≈ 10 %, sinon les petits textes s'adoucissent) ;
   - images : fichier à la taille affichée × 3 au plus (au-delà : poids à télécharger et mémoire pour rien).
3. **Ne pas dessiner ce qui ne se voit pas** : sous un aplat opaque, hors de l'écran (avec une marge), à opacité 0 →
   `visibility: hidden` (`sousplanche`, `sousnoir`, `eteints`).
4. **Pas de grand redessin pendant un mouvement rapide** (feuille de l'étude au plus 0,8 en défilement rapide, épaisseur des traits
   par paliers) ; ne jamais mettre toute la page « à plat » pendant un défilement (essayé le 14/11 : arrêts, retiré le 18/11).
5. **Vérifier que l'image ne change pas** : captures avant / après en ×3, comparaison de la forme (images floutées), puis
   `verif-memoire.mjs`, puis adresse de test sur l'iPhone de Loan, puis seulement loandrouard.com.

## Repères (modèle de `verif-memoire.mjs`, 22/11)
- Page d'accueil : 103 Mo au plus au repos (entrée de l'étude), 101 Mo au plus pendant les gestes ; budget 130 Mo.
- **Plus gros élément avant le 22/11** : la feuille de l'étude (dessin du saut, 1200 × 800) et ses 3 calques (caméra noire,
  négatif, corrections en or) : 4 × 33 Mo, dessinés jusqu'à 9 fois plus grands que l'écran ne les montre, redessinés ≈ 40 fois
  pendant « See full details ». Aujourd'hui 4 × 5 à 10 Mo dans la plus grande partie de l'étude.
- Plus gros restants : scènes épinglées (≈ 11,5 Mo chacune), photos de Loan au projecteur (3 × 10 Mo), fond « nuit » (11,5 Mo),
  fond de la planche des cartes (17 Mo). Images : la feuille de l'étude est en 2400 × 1600 pour 1200 × 800 affichés (déjà la
  bonne finesse) ; `enduit-noir.jpg` et les photos du projecteur peuvent être réexportées plus légères (`PERFORMANCE.md`, « Images »).

## Selon le navigateur (recherche du 23/11)
| Navigateurs | Moteur | Ce qui compte | Corrections du site |
|---|---|---|---|
| Safari (iPhone, iPad, Mac) et tous les navigateurs de l'iPhone (Chrome, Firefox, appli Google, navigateurs intégrés) | WebKit : seul moteur publié sur iOS fin 2026, même dans l'UE ([MacRumors, juin 2026](https://www.macrumors.com/2026/06/17/webkit-rule-costs-ios-users-browser-performance)) | Couche dessinée à sa taille CSS × échelle de l'écran, même réduite ; jamais redessinée quand on l'agrandit ; page fermée si la mémoire déborde (iPhone) | `finesse` et `nuitcompacte` : tout navigateur au moteur de Safari (`navigator.vendor` « Apple Computer, Inc. », classe `vf-webkit`), Mac compris depuis le 23/11 |
| Chrome, Edge, Opera, Samsung Internet (ordinateur, Android) | Blink | Redessine une couche à la taille affichée quand son échelle change (Chrome 53), sauf pendant un `will-change: transform` : elle garde sa finesse de départ, floue si on l'agrandit ([Chrome](https://developer.chrome.com/blog/re-rastering-composite)) ; mémoire graphique bornée : en cas de manque, zones vides un instant plutôt qu'un arrêt | Rien à faire : le navigateur fait déjà ce que fait `finesse` ; corrections non appliquées (image identique, vérifié) |
| Firefox (ordinateur, Android) | Gecko | Ignore tous les `will-change` de la page s'ils couvrent plus de 3 fois la surface du document (avertissement dans la console) ([Bugzilla 1288216](https://bugzilla.mozilla.org/show_bug.cgi?id=1288216), [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/will-change)) | Rien de propre ; règle générale : peu de `will-change`, petits, seulement pendant l'animation |

Règles valables partout : images à la bonne taille, peu de couches plein écran, rien de dessiné sous un aplat ou hors de l'écran,
pas de grand redessin pendant un mouvement. Firefox et WebKit ne se téléchargent pas ici (réseau) : Chrome est simulé, Safari est
jugé par le modèle et par l'iPhone ou le Mac de Loan. Pages sources non ouvrables d'ici le 23/11 (réseau) : faits tirés des
résultats de recherche.

## Pour une nouvelle page (Home, Press) ou un nouvel effet
- Compter les calques plein écran superposés (chacun ≈ 12 Mo sur iPhone) : en viser au plus 6 à 8 à la fois.
- Images au format WebP, à la taille affichée × 3 au plus ; pas d'image de 2400 px pour 400 px affichés.
- Lueurs, halos et dégradés animés : dessinés petits puis agrandis.
- Pas de filtre (`blur`, `drop-shadow`) ni de 3D sur un grand élément qui bouge ; une ombre seule plutôt que plusieurs filtres.
- Une seule scène lourde à l'écran à la fois ; ce qui est recouvert ou hors de l'écran est caché.
- `verif-memoire.mjs` ne mesure aujourd'hui que la page d'accueil : l'étendre à la nouvelle page (endroits et gestes) avant sa
  mise en ligne. Les mêmes consignes, côté design, sont dans `CLAUDE-DESIGN.md` (§ 1).
