# Safari (Mac et iPhone) : différences avec Chrome

Le site doit être identique dans tous les navigateurs (Loan, 21/11). Safari ne peut pas être lancé ici (WebKit refusé par le réseau ; WebKitGTK essayé le 11/11 : inutilisable) : on lit le code de WebKit, on mesure dans Chromium, et Loan confirme sur ses appareils.

## Différences connues et parades
| Différence de Safari | Parade | Date |
|---|---|---|
| Hauteur réelle de l'en-tête plus grande que le jeton du design (bande grise, titre caché) | `entete` : hauteur mesurée | 04/10 ✅ |
| Flou logiciel de « See pricing » : ligne rose | `affiche` : `will-change: filter` | 08/10 ✅ |
| Barre d'adresse : `svh` ≠ `lvh` (bande noire en bas) | `lvh` | 08/10 ✅ |
| Safari 16–18.3 : `container-type` rend « Close » mobile | carte ouverte sans `container-type` | 19/10 ✅ |
| Extensions de Safari / Cloudflare bloqué : chargement figé à 96 % | `chargement.js` n'attend plus ces scripts | 03/10, 28/10 ✅ |
| Défilement doux trop rapide (ressemble à un saut) | `glisse` : courbe de Chrome calculée par la page | 21/11 ⏳ |
| Transitions CSS relancées en continu : tremblement | `inclinaison` : animation calculée par la page | 21/11 ⏳ |
| Image remplacée pendant son téléchargement : « ? » au 1er chargement | ❌ préchargement de l'étude (déplaçait le problème) → ✅⏳ images tenues pendant leur téléchargement + nouvel essai caché | 21/11 |
| Zoom : tout est redessiné à l'échelle du zoom | `loupe` | 14/11 ✅ |

## Historique

### 21/11 (3e retour) — « l'écran de chargement sert justement à ça » (⏳ à confirmer)
- Pourquoi l'écran laissait passer l'image ratée : il attend les images **du premier écran** seulement (pas l'étude ni le yin-yang, plus bas : choix de départ, sinon l'attente serait bien plus longue), et une image en échec y comptait comme « arrivée » (une image cassée est « terminée » pour le navigateur ; réglage du 03/10 pour ne plus rester bloqué à 96 %).
- Fait : une image en train d'être redemandée ne compte plus comme arrivée ; après 4 échecs, elle reste cachée et l'écran s'en va (jamais bloqué). `chargement.js` version `7r`.
- Contrôle : Safari simulé (l'image reste en échec tant qu'on ne la redemande pas) : avant, écran retiré à 3,5 s avec le halo en échec ; après, écran retiré avec le halo arrivé ; sans échec, toujours ≈ 3,9 s.
- Limite : une image qui échoue peut rester affichée en échec pendant une image (≈ 16 ms) avant d'être cachée.
- Adresse de test : version `5d767e46`.

### 21/11 (2e retour) — halo de Loan (cadre gris + « ? ») et yin-yang absents puis apparus (⏳ à confirmer)
- Cause : mon premier correctif. Le préchargement des 2 images de l'étude les faisait passer devant ; d'autres images (halo du projecteur, yin-yang) se retrouvaient à leur tour en cours de téléchargement quand le moteur de la page recrée la page → échec, puis réparées par le nouvel essai au bout de 0,4 s + téléchargement (« au bout d'un certain temps »).
- Fait : préchargement retiré (ordre d'origine) ; chaque image encore en téléchargement au démarrage du moteur est tenue par un objet Image jusqu'à son arrivée (aucun téléchargement en plus) ; une image en échec est cachée (ni « ? » ni cadre) et redemandée aussitôt, 4 fois au plus.
- Contrôle : `scripts/verif-navigation.mjs` (premier téléchargement raté exprès pour l'étude, le halo et le yin-yang : jamais visible en échec, affichée ensuite ; 31 images, aucune en double).
- Adresse de test : version `9bfae735`.

### 21/11 — image de l'étude absente au premier chargement (⏳ à confirmer sur le Mac de Loan)
- Symptôme : à la place du dessin du saut, le « ? » de Safari et le texte de remplacement (« …study of a jump, read frame by frame ») ; l'image s'affiche au rechargement.
- Cause probable (non reproduite ici) : le moteur de la page (`support.js`) remplace toute la page par sa version React pendant que les images se téléchargent ; les deux images de l'étude (2400 × 1600, les plus lourdes) arrivent en dernier.
- Fait : préchargement des deux images dans l'en-tête ; toute image en échec redemandée (2 fois au plus). ❌ Remplacé le jour même (voir l'entrée au-dessus).
- Contrôle : `scripts/verif-navigation.mjs` (premier téléchargement refusé exprès → image affichée).
- Fichiers : `scripts/safari.mjs` (`images`).
- Adresse de test : version `4bcac6bf` (21/11) ; pas encore sur loandrouard.com.

### 21/11 — sommaire qui saute, inclinaison qui tremble
- Voir `defilement.md` et `cartes.md`.
