# Outils de contrôle

Tous dans `scripts/`, lancés après `npm run construire`. Chromium seulement (pas de Safari ici) : ils vérifient ce qui se vérifie hors de l'iPhone.

| Outil | Ce qu'il vérifie |
|---|---|
| `verifier.mjs` | Site en ligne : parcours, paiement (sans payer), fichiers servis |
| `verif-calques-webkit.mjs` | Mémoire graphique estimée selon les règles de WebKit (calques, zoom) |
| `verif-sousplanche.mjs` | Autour des cartes (mobile) : ce qui est caché est invisible (captures avec / sans), mémoire estimée — 21/11 |
| `verif-sousnoir.mjs` | Fin de l'étude et passage aux cartes : ce qui n'est plus dessiné est invisible (captures avec / sans, 7 écrans, `IOS=1` pour l'iPhone), mémoire estimée — 22/11 |
| `verif-navigation.mjs` | Défilement doux (courbe de Chrome), inclinaison des cartes, image redemandée — 21/11 |
| `verif-memoire.mjs` | **Budget de mémoire** (130 Mo) sur toute la page au repos et pendant les gestes à risque (vitrine → See full details, descente éclair, remontée rapide) ; seuls les calques qui dessinent comptent. À lancer avant chaque mise en ligne — 22/11 |
| `verif-finesse.mjs` | Feuille de l'étude à la finesse de l'écran (iPhone) : même image qu'avant (×3, `SAFARI=1` : rendu façon Safari), niveaux, défilement rapide, loupe ; ordinateur et Android inchangés — 22/11 |
| `verif-pincement.mjs` | Loupe, filet, vitrine, captures avant / après sur toute la page |
| `verif-retraits.mjs`, `verif-serie.mjs`, `banc.mjs` | Diagnostic de l'adresse de test (séries, retraits `?sans=`) |
| `verif-chargement.mjs` | Écran de chargement (extensions) |
| Diagnostic de l'adresse de test (`optimise/diag.js`) | Après un arrêt, la page rouverte envoie le dernier état (position, partie à l'écran, zoom, parties cachées p/e/n/c) : `npx wrangler tail --config wrangler.essai.jsonc` pendant l'essai, ou `resultats.html` sur l'iPhone |
| `mesurer.mjs` | Performance avant / après (long) |

## Limites connues
- Pas de carte graphique : images espacées de 17 à 170 ms, durées mesurées à ± une image.
- Les captures « avant / après » doivent tenir compte des animations : comparer à un témoin (deux captures sans rien changer).
- Mémoire : estimation selon le modèle de WebKit, pas une mesure de Safari. La mesure réelle se fait dans l'inspecteur web du Mac, iPhone branché (onglet Calques).
- Écoute du diagnostic (`wrangler tail`) : 2 h au plus par lancement, et la connexion se coupe à chaque nouvelle publication de l'adresse de test. Si Loan essaie plus tard : le relevé reste dans l'iPhone (10 derniers arrêts), à lire avec `resultats.html` → « Copier tout » → coller dans la conversation.
- Captures de l'étude : attendre ≈ 2,5 s après chaque défilement (la caméra se redessine nette 220 ms après son dernier mouvement ; avant, faux écarts). Chrome dessine le négatif différemment selon que les corrections en or sont dessinées ou non : comparer ce calque seul.
