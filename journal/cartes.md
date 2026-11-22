# Cartes des formules (planche II, vitrine « See the options »)

## Pistes déjà explorées
| Date | Piste | Résultat |
|---|---|---|
| 15/10 | Retournement en défilement très rapide : remise à zéro dès qu'une carte sort d'un pixel | ❌ rembobinage visible → remise à zéro loin sous l'écran, cascade enchaînée ✅ |
| 15/10 | Fermeture de la carte ouverte en glissé | ❌ saccadé → fondu ✅ |
| 15/10 | Traits de crayon redessinés seulement si la taille change | ❌ traits décalés → place des cartes surveillée ✅ |
| 28/10 | Inclinaison au survol un peu plus marquée (9° d'un bord à l'autre) | ✅ |
| 01/11 | Effet loupe des puces façon Dock | ✅ (loupe continue, sans tremblement) |
| 21/11 | Inclinaison par transition CSS relancée à chaque mouvement de souris | ❌ sur Safari : faible et tremblante |
| 21/11 | Inclinaison calculée par la page, image par image (`inclinaison`) | ✅ (Loan, 22/11) |

## Historique

### 22/11 — mise en ligne (✅)
- Loan, après essai sur l'iPhone et le Mac (adresse de test `c6e30b51`) : « tout à l'air de marcher ». Corrections du 21 et 22/11 en ligne sur loandrouard.com (`loandrouard-site` version `40d79d21`).

### 21/11 — inclinaison faible et tremblante sur Safari Mac (✅)
- Cause : chaque mouvement de souris relançait une transition CSS de 0,18 s ; Safari reprend une transition relancée depuis une valeur en retard sur l'écran → la carte tremble et n'atteint pas son angle.
- Fait : la page calcule l'inclinaison à chaque image (mêmes angles, même soulèvement de 5 px, même reflet doré, ≈ 0,18 s pour suivre, 0,6 s pour revenir), identique dans tous les navigateurs. Concerne les cartes de la vitrine, de la planche et les rectangles de la fenêtre « How we'll work together ».
- Contrôle : `scripts/verif-navigation.mjs` (angle atteint, aucun aller-retour, retour à plat).
- Fichiers : `scripts/safari.mjs` (`inclinaison`).
- Adresse de test : version `4bcac6bf` (21/11) ; en ligne le 22/11 (`40d79d21`).

### 21/11 — plantage à l'arrivée sur les cartes (mobile)
- Voir `plantages-mobile.md`.
