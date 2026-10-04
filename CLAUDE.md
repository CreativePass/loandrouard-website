# Site loandrouard.com — consignes pour Claude Code

Loan n'est pas développeur : réponses en français, simples, une manipulation à la fois.

## Règles
- **Demander l'accord de Loan avant toute action sur Stripe, Cloudflare ou les DNS**, y compris chaque mise en ligne (`npm run publier`, `publier:api`, `publier:redirection`). Les lectures sont libres.
- Ne jamais demander la clé secrète Stripe dans la conversation.
- Les pages `*.dc.html` viennent de l'outil de design : ne rien réécrire, reformater ni convertir. Seules les corrections listées dans `scripts/construire.mjs` (contenu) et `scripts/optimisations.mjs` (performance) sont appliquées, sur la copie `public/`.
- Pas d'analytics, cookies, traceurs, bannière ni CSP sans demande de Loan.
- **Terminer chaque réponse par un résumé** : réponses aux questions posées, puis liste de ce que Loan doit faire.

## Où trouver quoi
- `PASSATION-CLAUDE-CODE.md` : cahier des charges d'origine (liste blanche, paiement, vérifications § 8, plus tard § 9).
- `MISE-EN-LIGNE.md` : fonctionnement actuel (hébergement, redirections, Worker API, e-mails Stripe), commandes, état et retour arrière.
- `PERFORMANCE.md` : optimisations de performance (mesures avant/après, ce qui reste possible) et comment re-mesurer (`scripts/mesurer.mjs`).

## Republier
1. Remplacer les fichiers de l'export à la racine.
2. `npm install` (une fois), `npm run construire` (contrôles), puis, avec l'accord de Loan, `npm run publier`.
3. Vérifier : `npm run verifier -- https://loandrouard.com` et comparer les fichiers servis à `public/`.

Adresse de test (jamais loandrouard.com) : `npm run publier:essai`, avec l'accord de Loan (voir MISE-EN-LIGNE.md).

Le jeton Cloudflare est dans l'environnement (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`).
Une seule conversation à la fois doit mettre le site en ligne : la dernière publication remplace la précédente.

## Branches
Chaque conversation part de `main` (la version en ligne). Après une mise en ligne, fusionner le travail dans `main` (demande de fusion GitHub, avec l'accord de Loan), pour que la conversation suivante reparte de la bonne version.
