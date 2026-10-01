# Mise en ligne — loandrouard.com

Suivi de PASSATION-CLAUDE-CODE.md. Ce fichier n'est pas publié.

## Republier après un nouvel export

1. Remplacer les fichiers de l'export à la racine du dépôt (pages `*.dc.html`, scripts, `_ds/`, `assets/`, `cloudflare/api-worker.js`).
2. `npm install` (la première fois seulement)
3. `npm run publier` : construit `public/` puis le met en ligne. Il faut la variable `CLOUDFLARE_API_TOKEN`, ou bien `npx wrangler login` sur votre ordinateur.
4. `npm run verifier -- https://loandrouard.com` : compare le site en ligne à l'export, pixel par pixel. Résultats dans `verification/`.

`npm run construire` construit `public/` sans rien mettre en ligne. `npm run apercu` affiche le site sur http://localhost:8788.

## Ce que fait `npm run construire` (scripts/construire.mjs)

- Copie uniquement la liste blanche du § 1. Les originaux ne sont jamais modifiés.
- `index.html` est une copie exacte de `Video Feedback.dc.html`.
- Corrections appliquées sur la copie, validées par Loan le 01/10/2026 :
  - `contact@loandrouard.com` → `loandrouard@gmail.com` (CGV, Privacy, Legal), adresse provisoire ;
  - crédits photo de `Legal.dc.html` → « David GROUARD ».

  À reporter aussi dans l'outil de design. Si un futur export contient déjà ces textes, la correction ne fait rien.
- Écrit `public/_headers` (cache).
- Contrôles :
  - aucune mention de `Home.dc.html` ni de `Press.dc.html` ;
  - en-têtes Home, The Journey et Press non cliquables ;
  - `apercuPaye` vaut `"none"` ;
  - plus de « À COMPLÉTER » ;
  - aucun fichier référencé n'est absent.

## Hébergement : Cloudflare Workers Static Assets

- Worker `loandrouard-site` (`wrangler.jsonc`, `worker/site.js`). Il sert `public/` tel quel, avec `html_handling = "none"` : pas de « pretty URLs », `?lang=` et `?session_id=` sont conservés.
- `/` affiche `index.html`. Toute adresse inconnue (`Home.dc.html`, `Press.dc.html`…) renvoie 404.
- Cache : HTML, CSS, `support.js` et `_ds_bundle.js` sont revalidés à chaque visite (réglage par défaut de Cloudflare). Les scripts versionnés par `?v=` ont un cache d'1 an. Images et polices : 1 jour.
- L'ancien site (Worker `loandrouard-website-web`, routes loandrouard.com + 4 autres) reste intact jusqu'à la bascule validée par Loan.

## Worker API `loan-api`

`cloudflare/wrangler.toml` contient `keep_vars = true` : un déploiement ne touche ni `SITE_ORIGIN` ni les secrets. Avant tout déploiement, comparer avec la version en ligne (code et date de compatibilité). Rien n'est déployé sans l'accord de Loan.

## État au 01/10/2026

- [x] Script de construction, configuration Cloudflare, script de vérification
- [ ] Accès Cloudflare (jeton d'API) et réseau de l'environnement
- [ ] Déploiement de prévisualisation (`loandrouard-site.loandrouard-website.workers.dev`), puis vérifications du § 8
- [ ] `SITE_ORIGIN` du Worker `loan-api` : ajouter l'adresse de prévisualisation, puis le domaine
- [ ] Stripe : URL des CGV et de Privacy, portail client, domaine de paiement, e-mail de confirmation (option A)
- [ ] Bascule du domaine (apex + www, et loandrouard.fr → loandrouard.com)
- [ ] Achat test réel Single 49 € puis remboursement ; abonnement puis résiliation et remboursement
- [ ] Convention MED CONSO DEV (https://www.medconsodev.eu/demande-adhesion-pro.php)
