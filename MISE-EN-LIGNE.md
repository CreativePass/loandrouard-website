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
- L'ancien site (Worker `loandrouard-website-web`, 4 Custom Domains : apex + www, .com et .fr) reste intact jusqu'à la bascule validée par Loan. Retour arrière possible à tout moment en lui rendant ses domaines.

## Redirections (www et .fr)

Worker `loandrouard-redirection` (`wrangler.redirection.jsonc`, `worker/redirection.js`) : `www.loandrouard.com`, `loandrouard.fr` et `www.loandrouard.fr` renvoient une redirection 301 vers `https://loandrouard.com`, en gardant le chemin et les paramètres. Déploiement : `npm run publier:redirection`. Les domaines ne lui sont rattachés qu'à la bascule.

## Worker API `loan-api`

- Code de référence : `cloudflare/api-worker.js`. Déploiement : `npm run publier:api` (après accord de Loan uniquement).
- `cloudflare/wrangler.toml` : même date de compatibilité et mêmes journaux que la version créée dans le tableau de bord ; `SITE_ORIGIN` y est écrit en clair (`[vars]`) ; `keep_vars = true` ; les secrets ne sont jamais touchés.
- E-mail de confirmation, option A : pour Single et Pack, la session crée une facture dont le mémo contient le lien WhatsApp (même message que la page) et le lien de retour `Video%20Feedback.dc.html#formules`. Pour l'abonnement, c'est le mémo par défaut des factures du compte Stripe (réglage du tableau de bord).

## Constats du 01/10/2026 (lecture seule)

- Cloudflare : zones `loandrouard.com` et `loandrouard.fr` actives (achetées chez OVH, DNS chez Cloudflare). Les 4 adresses (apex + www, .com et .fr) sont des « Custom Domains » du Worker `loandrouard-website-web` (ancien site). E-mail : MX OVH, inchangés. « Always Use HTTPS » désactivé sur les deux zones.
- `loan-api` en ligne = ancienne version du 24/09 : pas de `/places`, prix écrits dans le code, programme en paiement unique, ni case CGV ni téléphone. Le fichier du dépôt est la référence ; il faut le déployer.
- Stripe : prix et liens de paiement conformes au § 4 ; portail client actif (résiliation en fin de période, lien de connexion correct) ; domaine de paiement : seul `buy.stripe.com` est enregistré.
- Stripe, à corriger dans le tableau de bord : site web = soundcloud.com/hyneos ; description d'activité = « Vente de musiques » ; libellé bancaire = « CIRCADIAN RHYTHM » (préfixe « HYNEOS ») ; e-mail et téléphone support corrects.

## État au 01/10/2026

- [x] Script de construction, configuration Cloudflare, script de vérification
- [x] Accès Cloudflare (jeton d'API) et réseau de l'environnement
- [ ] Déploiement de prévisualisation (`loandrouard-site.loandrouard-website.workers.dev`), puis vérifications du § 8
- [ ] Worker `loan-api` : déployer le code de référence (+ option A) avec `SITE_ORIGIN` = domaine + adresse de prévisualisation
- [ ] Stripe : URL des CGV et de Privacy, portail client, domaine de paiement, e-mail de confirmation (option A)
- [ ] Bascule du domaine : loandrouard.com → `loandrouard-site` ; www et .fr → `loandrouard-redirection` ; « Always Use HTTPS »
- [ ] Achat test réel Single 49 € puis remboursement ; abonnement puis résiliation et remboursement
- [ ] Convention MED CONSO DEV (https://www.medconsodev.eu/demande-adhesion-pro.php)
