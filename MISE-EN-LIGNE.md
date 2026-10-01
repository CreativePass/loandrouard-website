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
- Domaine : `loandrouard.com` (Custom Domain, déclaré dans `wrangler.jsonc`). « Always Use HTTPS » activé sur les zones .com et .fr.
- L'ancien site (Worker `loandrouard-website-web`) est conservé, sans domaine. **Retour arrière** : Cloudflare → Workers → `loandrouard-website-web` → Settings → Domains & Routes → ajouter `loandrouard.com`, `www.loandrouard.com`, `loandrouard.fr`, `www.loandrouard.fr` (accepter de les reprendre aux autres Workers).

## Redirections (www et .fr)

Worker `loandrouard-redirection` (`wrangler.redirection.jsonc`, `worker/redirection.js`) : `www.loandrouard.com`, `loandrouard.fr` et `www.loandrouard.fr` renvoient une redirection 301 vers `https://loandrouard.com`, en gardant le chemin et les paramètres. Déploiement : `npm run publier:redirection`.

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
- [x] Déploiement de prévisualisation (`loandrouard-site.loandrouard-website.workers.dev`) — 01/10
- [x] Vérifications du § 8 sur la prévisualisation — 01/10 :
  - les 118 fichiers servis sont identiques octet pour octet à `public/` ; `public/` ne diffère de l'export que par l'e-mail provisoire (CGV, Privacy, Legal) et les crédits photo (Legal) ;
  - `/` et `/index.html` = Video Feedback octet pour octet ; `Home.dc.html`, `Press.dc.html`, fichiers de travail : 404 ; `?lang=` et `?session_id=` conservés, aucune redirection ;
  - captures 1440 / 1280 / 390 px : écarts uniquement sur l'e-mail et les crédits (et le texte qu'ils décalent sur mobile), plus quelques pixels d'animations saisies à un instant différent sur Video Feedback ;
  - en-têtes Home / The Journey / Press grisés et hors tabulation, bloc « Powered by » présent, aucune erreur JS ni 404 (hors `/places`, voir plus bas).
- [x] Worker `loan-api` : code de référence (+ option A) déployé, `SITE_ORIGIN` = domaine + adresse de prévisualisation — 01/10
- [x] `loan-api` : `/places` en erreur (clé restreinte sans « Abonnements : lecture ») — droit ajouté par Loan le 01/10, `/places` = `{"pack":6,"prog":2}`.
- [x] Stripe (API, accord du 01/10) : liens de repli Single et Pack → facture avec mémo WhatsApp (option A). Lien HYNEOS laissé tel quel. Pas de redirection après paiement (§ 6.5) : la page de confirmation actuelle est gardée.
- [x] Stripe (tableau de bord, Loan, 01/10) : site web `https://loandrouard.com`, description d'activité, URL des CGV et de Privacy renseignées, e-mails « Paiements réussis » activés.
- [ ] Stripe (tableau de bord, Loan) : mémo par défaut à saisir dans **Facturation → Factures** (il a été saisi par erreur dans « Devis ») ; vérifier les adresses exactes des CGV et de Privacy ; libellé bancaire encore « CIRCADIAN RHYTHM » (conseillé : « LOAN DROUARD »).
- [x] Stripe (API, accordé) : domaine de paiement `loandrouard.com` enregistré, Apple Pay / Google Pay actifs — 01/10
- [x] Bascule du domaine (accord du 01/10) : loandrouard.com → `loandrouard-site` (118 fichiers servis identiques à `public/`) ; www et .fr → `loandrouard-redirection` (301, chemin et paramètres conservés) ; « Always Use HTTPS » ; MX OVH inchangés
- [ ] Achat test réel Single 49 € puis remboursement ; abonnement puis résiliation et remboursement
- [ ] Convention MED CONSO DEV (https://www.medconsodev.eu/demande-adhesion-pro.php)
