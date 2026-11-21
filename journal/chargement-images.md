# Chargement et images

## Pistes déjà explorées
| Date | Piste | Résultat |
|---|---|---|
| 02/10 | Images lointaines en chargement différé (yin-yang, revers des cartes, logo) | ✅ −0,8 Mo au premier chargement |
| 02/10 | Images de l'étude en chargement différé | ❌ arrivaient en retard en défilement rapide |
| 02/10 | `fetchpriority="low"` sur les images | ❌ aucun gain |
| 02/10 | Supprimer le second téléchargement de la page par le moteur | ❌ casse le sélecteur de langue |
| 03/10 | Ressource en échec comptée comme arrivée (écran à 96 %) | ✅ |
| 28/10 | Scripts d'extension du navigateur ignorés (écran à 96 % sur ordinateur) | ✅ |
| 21/11 | Images de l'étude préchargées + image en échec redemandée après 0,4 s | ❌ le préchargement déplace l'échec vers d'autres images (halo, yin-yang), réparées tard |
| 21/11 | Images tenues pendant leur téléchargement (objets Image), échec caché et redemandé aussitôt | ⏳ voir `safari.md` |
| 21/11 | Écran de chargement : une image redemandée n'est pas « arrivée » (avant : une image en échec comptait comme arrivée) | ⏳ voir `safari.md` |

## Ce que l'écran de chargement attend
Rendu de la page, polices, feuilles, scripts, et les images / vidéos **du premier écran** (jusqu'à 1,1 hauteur d'écran), sauf les images différées. Une ressource en échec ne le bloque pas (limite de 20 s) ; depuis le 21/11, une image en train d'être redemandée, si.

## Images encore lourdes (à réexporter si possible)
Voir `PERFORMANCE.md`, section « Images » (enduit noir, étude, projecteur, revers des cartes).
