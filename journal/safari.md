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
| Image remplacée pendant son téléchargement : « ? » au 1er chargement | `images` : préchargement + nouvel essai | 21/11 ⏳ |
| Zoom : tout est redessiné à l'échelle du zoom | `loupe` | 14/11 ✅ |

## Historique

### 21/11 — image de l'étude absente au premier chargement (⏳ à confirmer sur le Mac de Loan)
- Symptôme : à la place du dessin du saut, le « ? » de Safari et le texte de remplacement (« …study of a jump, read frame by frame ») ; l'image s'affiche au rechargement.
- Cause probable (non reproduite ici) : le moteur de la page (`support.js`) remplace toute la page par sa version React pendant que les images se téléchargent ; les deux images de l'étude (2400 × 1600, les plus lourdes) arrivent en dernier.
- Fait : préchargement des deux images dans l'en-tête (aucun octet en plus, vérifié : 2 téléchargements) ; toute image en échec est redemandée (2 fois au plus).
- Contrôle : `scripts/verif-navigation.mjs` (premier téléchargement refusé exprès → image affichée).
- Fichiers : `scripts/safari.mjs` (`images`).
- Adresse de test : version `4bcac6bf` (21/11) ; pas encore sur loandrouard.com.

### 21/11 — sommaire qui saute, inclinaison qui tremble
- Voir `defilement.md` et `cartes.md`.
