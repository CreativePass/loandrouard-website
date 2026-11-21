# Zoom à deux doigts, loupe, filet (mobile)

Le zoom de Safari redessine tous les calques à l'échelle du zoom (mémoire × zoom²) : sur la page d'accueil, il fait planter Safari. Pages CGV, Privacy, Legal, Sponsors : légères, zoom de Safari gardé.

## Pistes déjà explorées
| Date | Piste | Résultat |
|---|---|---|
| 09/11 | Zoom bloqué (`pincement`, `touch-action`) | ❌ Loan veut pouvoir zoomer |
| 09/11 | Page dessinée à plat pendant le zoom (`zoomplat`) | ❌ arrêts restants sur les cartes, défilement saccadé |
| 11/11 | À plat dès deux doigts posés, filtres retirés | ❌ arrêts restants |
| 14/11 | **Loupe** : pincement de Safari remplacé par un agrandissement CSS (rien n'est redessiné) | ✅ gardée |
| 14/11 | Filet complet (à plat quand l'élan s'arrête net) | ❌ arrêts en remontant |
| 18/11 | Filet seulement si Safari a vraiment zoomé (`visualViewport.scale` > 1,01) | ✅ |

## Historique

### 18/11 — filet réduit (✅)
- Des doigts posés pendant l'élan ne sont pas transmis : Safari zoome lui-même ; la page passe alors à plat complet. Plus de passage à plat en défilement normal.

### 14/11 — loupe (✅)
- Pincer agrandit l'écran jusqu'à ×4 ; un doigt déplace la vue ; la page ne défile pas pendant la loupe ; scènes en pause.
- Limite : texte agrandi moins net que le zoom de Safari.
