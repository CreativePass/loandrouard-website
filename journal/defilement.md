# Défilement

## Pistes déjà explorées
| Date | Piste | Résultat |
|---|---|---|
| 02/10 | Aimantation au cran du projecteur (`scroll-snap`) | ❌ molette bloquée → retirée (validé par Loan) |
| 02/10 | Molette et glissé non bloquants hors du verrou des cartes | ✅ |
| 15/10 | Arrêt sur les cartes : page ramenée par script | ❌ se bat contre l'élan de Safari (secousses) |
| 17/10 | Arrêt par aimantation native | ❌ élan raccourci partout, saut si on touche l'écran pendant l'élan |
| 17/10 | Arrêt par **fin de page provisoire** sous les cartes (`vfk-borne`) | ✅ gardé |
| 18/10 | Freinage avant les cartes, iPhone/iPad (`vfk-frein`, glissade courte de Safari) | ✅ gardé |
| 18/10 | Glissade aimantée de Chrome (Android) | ❌ bond d'une image |
| 27–28/10 | « See full details » : descente à vitesse régulière (7 écrans/s, ≈ 4 s) | ✅ |
| 21/11 | Défilement doux de Safari (`scroll-behavior: smooth`) | ❌ trop rapide : ressemble à un saut |
| 21/11 | Défilement doux calculé par la page, courbe de Chrome (`glisse`) | ✅ (Loan, 22/11) |

## Historique

### 22/11 — mise en ligne (✅)
- Loan, après essai sur l'iPhone et le Mac (adresse de test `c6e30b51`) : « tout à l'air de marcher ». Corrections du 21 et 22/11 en ligne sur loandrouard.com (`loandrouard-site` version `40d79d21`).

### 21/11 — sommaire qui saute sur Safari (✅)
- Problème : sur Safari (Mac), un lien du sommaire arrive instantanément ; sur Chrome, il glisse.
- Cause : la page demande un défilement « doux » au navigateur ; Safari l'anime en un temps très court quelle que soit la distance.
- Mesuré dans Chrome (défilement natif) : durée √(distance) / 60 s, **1,5 s au plus**, courbe `cubic-bezier(.42, 0, 0, 1)` (départ doux, long freinage ; écart moyen 0,4 %).
- Fait : tous les défilements doux de la page (sommaire, liens internes, frise de l'étude, retour au paiement, remontée de « See full details ») sont calculés par la page avec cette courbe, dans tous les navigateurs. Un geste (molette, doigt, touche de défilement) l'arrête, comme dans Chrome. Mouvement réduit : arrivée directe.
- Contrôle : `scripts/verif-navigation.mjs` (courbe suivie à 1–2 % près, même durée que Chrome natif).
- Fichiers : `scripts/safari.mjs` (`glisse`).
- Adresse de test : version `4bcac6bf` (21/11) ; en ligne le 22/11 (`40d79d21`).

### 17–18/10 — arrêt sur les cartes (✅)
- Fin de page provisoire juste sous les cartes tant qu'elles n'ont pas été vues, retirée après leur retournement ; freinage iPhone dans les écrans qui précèdent.
