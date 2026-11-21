# Journal des changements — mode d'emploi

Un fichier par catégorie, avec **uniquement les points clés** : le problème, les pistes essayées, ce qui a marché (✅), pas marché (❌) ou reste à confirmer sur l'appareil de Loan (⏳). Le détail (mesures, preuves) est dans `PERFORMANCE.md`, `MISE-EN-LIGNE.md` et les commentaires de `scripts/*.mjs`.

**Règle (demande de Loan du 21/11)** : avant de chercher la cause d'un problème, lire le fichier de sa catégorie (pour ne pas refaire une piste déjà écartée) ; après chaque changement, y ajouter une entrée courte, en haut de la section « Historique ».

| Fichier | Catégorie |
|---|---|
| `plantages-mobile.md` | Arrêts de la page sur iPhone (« A problem repeatedly occurred », page blanche), mémoire graphique |
| `zoom-loupe.md` | Zoom à deux doigts, loupe, filet |
| `defilement.md` | Défilement : arrêt sur les cartes, freinage, verrou, défilement doux, sommaire |
| `cartes.md` | Cartes des formules : retournement, ouverture / fermeture, traits, inclinaison, vitrine |
| `safari.md` | Différences de Safari (Mac et iPhone) avec Chrome, et comment on les compense |
| `chargement-images.md` | Écran de chargement, images, préchargements, poids |
| `contenu.md` | Textes, prix, pages, décisions de Loan sur le contenu |
| `outils.md` | Outils de contrôle (`scripts/verif-*.mjs`, banc, diagnostic) et leurs limites |

Format d'une entrée :

```
### JJ/MM — titre court (✅ / ❌ / ⏳)
- Problème : …
- Essayé : … → résultat
- Fichiers : …
```
