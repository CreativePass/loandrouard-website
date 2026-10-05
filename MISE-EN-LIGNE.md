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
- Corrections appliquées sur la copie (liste complète : `CORRECTIONS` dans `scripts/construire.mjs`), validées par Loan :
  - 01/10 : crédits photo de `Legal.dc.html` → « David GROUARD » (l'e-mail provisoire Gmail a été retiré le 02/10 : `contact@loandrouard.com` est redirigé vers Gmail chez OVH) ;
  - 02/10, cartes des formules de Video Feedback : prix « one full analysis / 3 full analyses / weekly coaching », puce « Written or voice feedback », délai de réponse sorti de la liste et affiché sous chaque carte, « Valid 6 months from your first video » dans le pack, « Also included » (blanc) et « In the program » (or) dans le programme, lien « Terms of sale » cliquable, page maintenue sur la planche jusqu'à la fin du retournement des cartes, fond noir au-dessus de la page (rebond du trackpad).

  À reporter aussi dans Claude Design. Chaque correction attend un nombre précis d'occurrences : si l'export contient déjà le texte corrigé, elle ne fait rien ; si le passage d'origine a changé, la construction s'arrête (à revoir). La construction vérifie aussi que les balises restent équilibrées.
- Applique ensuite les **optimisations de performance** (`scripts/optimisations.mjs`, détail et mesures dans `PERFORMANCE.md`), sur la copie aussi et avec les mêmes garde-fous. Elles ne changent ni le contenu ni le rendu, sauf l'**aimantation au cran du projecteur, retirée** (validé par Loan le 02/10, à reporter dans Claude Design) : la page s'ouvre toujours au même endroit, mais la molette n'y est plus ramenée.
- Ajoute ou remplace quelques fichiers, après contrôle : React (`vendor/react-18.3.1/`, copié de `node_modules`, empreinte identique à celle qu'exige `support.js`, qui le charge désormais depuis le site au lieu d'unpkg.com) et le logo sponsor allégé (`optimise/`, utilisé seulement si l'image de l'export n'a pas changé).
- Écrit `public/_headers` (cache).
- Contrôles :
  - aucune mention de `Home.dc.html` ni de `Press.dc.html` ;
  - en-têtes Home, The Journey et Press non cliquables ;
  - `apercuPaye` vaut `"none"` ;
  - plus de « À COMPLÉTER » ;
  - aucun fichier référencé n'est absent ;
  - une page qui ne charge plus `blueprint.js` ne s'en sert pas.

## Hébergement : Cloudflare Workers Static Assets

- Worker `loandrouard-site` (`wrangler.jsonc`, `worker/site.js`). Il sert `public/` tel quel, avec `html_handling = "none"` : pas de « pretty URLs », `?lang=` et `?session_id=` sont conservés.
- `/` affiche `index.html`. Toute adresse inconnue (`Home.dc.html`, `Press.dc.html`…) renvoie 404.
- Cache : HTML, CSS, `support.js` et `_ds_bundle.js` sont revalidés à chaque visite (réglage par défaut de Cloudflare). Les scripts versionnés par `?v=` et React (`/vendor/`) ont un cache d'1 an : un script modifié par une optimisation reçoit un nouveau `?v=` (ex. `chargement.js?v=7o`). Images et polices : 1 jour.
- Domaine : `loandrouard.com` (Custom Domain, déclaré dans `wrangler.jsonc`). « Always Use HTTPS » activé sur les zones .com et .fr.
- L'ancien site (Worker `loandrouard-website-web`) est conservé, sans domaine. **Retour arrière** : Cloudflare → Workers → `loandrouard-website-web` → Settings → Domains & Routes → ajouter `loandrouard.com`, `www.loandrouard.com`, `loandrouard.fr`, `www.loandrouard.fr` (accepter de les reprendre aux autres Workers).

## Adresse de test (essais sur appareil)

- `https://loandrouard-essai.loandrouard-website.workers.dev`, Worker `loandrouard-essai` (`wrangler.essai.jsonc`, `worker/essai.js`). Il n'a **aucun domaine** : loandrouard.com n'est jamais touché.
- `npm run publier:essai` (avec l'accord de Loan) construit avec `ESSAI=1` : diagnostic temporaire `diag.js` et pages de comparaison `actuel.html` et `textures.html`. Voir « Safari / iPhone » dans `PERFORMANCE.md`.
- `npm run publier` construit toujours sans `ESSAI` ; la construction échoue si le diagnostic s'y trouve.
- Journal du diagnostic, pendant un test seulement (rien n'est conservé ensuite) : `npx wrangler tail --config wrangler.essai.jsonc`.
- Résultats gardés dans le navigateur du téléphone : `https://loandrouard-essai.loandrouard-website.workers.dev/resultats.html`. Page en lecture seule, sans le site ni le diagnostic, avec un bouton « Copier tout ». Construite seulement avec `ESSAI=1`, refusée dans une construction normale.

## Redirections (www et .fr)

Worker `loandrouard-redirection` (`wrangler.redirection.jsonc`, `worker/redirection.js`) : `www.loandrouard.com`, `loandrouard.fr` et `www.loandrouard.fr` renvoient une redirection 301 vers `https://loandrouard.com`, en gardant le chemin et les paramètres. Déploiement : `npm run publier:redirection`.

## Worker API `loan-api`

- Code de référence : `cloudflare/api-worker.js`. Déploiement : `npm run publier:api` (après accord de Loan uniquement).
- `cloudflare/wrangler.toml` : même date de compatibilité et mêmes journaux que la version créée dans le tableau de bord ; `SITE_ORIGIN` y est écrit en clair (`[vars]`) ; `keep_vars = true` ; les secrets ne sont jamais touchés.
- Langue du paiement : textes de la case CGV et du bouton d'abonnement en français si le navigateur du client est en français (`Accept-Language`), en anglais sinon. Liens de secours : anglais + français.
- E-mail de confirmation, option A : pour Single et Pack, la session crée une facture dont le mémo (dans la langue du client) contient un lien personnel `https://loandrouard.com/acces/<jeton>` : le site (`worker/site.js`, liaison de service `API`) demande à `loan-api` (`GET /acces?jeton=`) la session qui porte ce jeton, puis redirige vers `/?session_id=…`, qui rouvre la carte payée (bouton WhatsApp + QR code) sur n'importe quel appareil. Liens de secours : mémo bilingue court avec `https://wa.me/33772041266`. Abonnement : mémo par défaut des factures du compte Stripe (tableau de bord).
- Remboursement total d'un achat unique : `/whatsapp` renvoie 402, la carte se referme (nécessite le droit « PaymentIntents : lecture » de la clé ; sans lui, le contrôle est ignoré).

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
- [x] Stripe (tableau de bord, Loan, 01/10) : mémo par défaut des factures (programme) saisi dans Facturation → Factures ; libellé bancaire « LOAN DROUARD », version courte « LOAN » (vérifié par l'API).
- [x] Stripe : adresses des CGV et de Privacy vérifiées par Loan (01/10).
- [x] Stripe (API, accordé) : domaine de paiement `loandrouard.com` enregistré, Apple Pay / Google Pay actifs — 01/10
- [x] Bascule du domaine (accord du 01/10) : loandrouard.com → `loandrouard-site` (118 fichiers servis identiques à `public/`) ; www et .fr → `loandrouard-redirection` (301, chemin et paramètres conservés) ; « Always Use HTTPS » ; MX OVH inchangés
- [x] Achat test réel Single 49 € (01/10, paiement intégré) : payé, facture avec mémo, libellé « LOAN DROUARD », `/whatsapp` → accès débloqué
- [x] Remboursement de l'achat test (01/10) : `/whatsapp` → 402 « remboursée », la carte se referme (droit « PaymentIntents : lecture » présent)
- [ ] Achat test de l'abonnement, puis résiliation et remboursement
- [x] Demande d'adhésion MED CONSO DEV envoyée (01/10) — convention à signer à réception
- [ ] Convention MED CONSO DEV signée (https://www.medconsodev.eu/demande-adhesion-pro.php)
- [x] `contact@loandrouard.com` : redirection OVH vers `loandrouard@gmail.com` (offre « redirect », sans boîte) ; adresse remise sur CGV, Privacy et Legal et republiée le 02/10
- [x] Produits Stripe renommés en anglais (02/10) : « Loan Drouard — Single feedback / 3× feedback pack / Quarterly program », descriptions en anglais (affichées au paiement et sur les factures)
- [x] Corrections des cartes du 02/10 : appliquées par `construire.mjs`, vérifiées en local (captures 1440 / 390 px, clic sur « Terms of sale », maintien du défilement) et publiées le 02/10 avec l’accord de Loan ; pages en ligne identiques à `public/`
- [ ] Reporter les corrections du 02/10 dans Claude Design
- [x] Optimisations de performance (`PERFORMANCE.md`) : publiées le 03/10 avec l'accord de Loan, **puis retirées le 03/10** (retour à `19d3f7be`, accord de Loan) après son test sur iPhone : arrivée au projecteur, en-tête sur le titre, écran de chargement à 96 %, plantage mobile. Corrections en cours sur la branche, voir « Retour de Loan » dans `PERFORMANCE.md`. Avant le retrait (version Cloudflare `204d0c93`, la précédente `19d3f7be-0a56-4401-aec6-f68df406c1fd` reste disponible pour un retour arrière). Vérifiées en production :
  - 120 fichiers servis identiques à `public/` ;
  - `npm run verifier -- https://loandrouard.com` : mêmes écarts que l'aperçu local (66 captures, corrections de contenu et animations) ;
  - parcours ordinateur et mobile identiques à la version précédente (vitrine, paiement jusqu'au formulaire Stripe sans créer de session, sommaire, retournement des cartes, langues, navigation, retour `?session_id=`) ;
  - molette libre au cran du projecteur, poussière arrêtée hors écran.
- [ ] Reporter dans Claude Design : aimantation au cran du projecteur retirée (03/10)
- [ ] Safari / iPhone (04/10) : corrections `entete` (retenue) et `textures` (provisoire) sur la branche, publiées sur l'adresse de test seulement. En attente du banc sur l'iPhone et le Mac de Loan (`PERFORMANCE.md`, « Safari / iPhone »). À reporter dans Claude Design une fois validées : hauteur réelle de l'en-tête.
- [ ] Cloudflare Web Analytics est actif sur loandrouard.com et .fr depuis le 06/09 (installation automatique : Cloudflare ajoute sa balise aux pages). À confirmer ou désactiver par Loan ; la page Privacy n'en parle pas.
