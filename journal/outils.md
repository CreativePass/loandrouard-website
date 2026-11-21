# Outils de contrôle

Tous dans `scripts/`, lancés après `npm run construire`. Chromium seulement (pas de Safari ici) : ils vérifient ce qui se vérifie hors de l'iPhone.

| Outil | Ce qu'il vérifie |
|---|---|
| `verifier.mjs` | Site en ligne : parcours, paiement (sans payer), fichiers servis |
| `verif-calques-webkit.mjs` | Mémoire graphique estimée selon les règles de WebKit (calques, zoom) |
| `verif-sousplanche.mjs` | Autour des cartes (mobile) : ce qui est caché est invisible (captures avec / sans), mémoire estimée — 21/11 |
| `verif-navigation.mjs` | Défilement doux (courbe de Chrome), inclinaison des cartes, image redemandée — 21/11 |
| `verif-pincement.mjs` | Loupe, filet, vitrine, captures avant / après sur toute la page |
| `verif-retraits.mjs`, `verif-serie.mjs`, `banc.mjs` | Diagnostic de l'adresse de test (séries, retraits `?sans=`) |
| `verif-chargement.mjs` | Écran de chargement (extensions) |
| Diagnostic de l'adresse de test (`optimise/diag.js`) | Après un arrêt, la page rouverte envoie le dernier état (position, partie à l'écran, zoom, parties cachées p/e/n/c) : `npx wrangler tail --config wrangler.essai.jsonc` pendant l'essai, ou `resultats.html` sur l'iPhone |
| `mesurer.mjs` | Performance avant / après (long) |

## Limites connues
- Pas de carte graphique : images espacées de 17 à 170 ms, durées mesurées à ± une image.
- Les captures « avant / après » doivent tenir compte des animations : comparer à un témoin (deux captures sans rien changer).
- Mémoire : estimation selon le modèle de WebKit, pas une mesure de Safari. La mesure réelle se fait dans l'inspecteur web du Mac, iPhone branché (onglet Calques).
