> **Ce zip est déjà trié** : il ne contient que les fichiers à publier (+ `cloudflare/` et ce fichier, à ne pas publier). `index.html` est déjà la copie de Video Feedback. Publie le contenu tel quel, sans `cloudflare/` ni ce fichier.

# Passation Claude Code — site Loan Drouard (mise en ligne à l'identique)

> Lis ce fichier en entier avant d'agir. Travaille étape par étape, en français, et **demande mon accord avant toute action sur Stripe, Cloudflare ou les DNS** (je ne suis pas développeur : explique chaque manipulation simplement, un clic à la fois).

---

## 0. Mission (à lire en premier)

Le dossier que je t'ouvre est l'export complet de mon projet de design. Les pages sont **déjà finales et fonctionnelles telles quelles dans un navigateur**. Ta mission :

1. **Publier ces fichiers tels quels** sur mon nom de domaine — **pour l'instant UNIQUEMENT la page Video Feedback** (+ les pages légales obligatoires). Home, The Journey et Press / Contact ne sont **pas** publiées : dans les en-têtes, ces trois entrées sont volontairement grisées et non cliquables (`<span aria-disabled="true">`, opacité .28). Ne les réactive pas et ne publie pas `Home.dc.html` ni `Press.dc.html`. Elles seront publiées plus tard sur ma demande.
   Le site en ligne doit être **identique au pixel près** à ce que je vois dans mon outil de design.
2. **Brancher et vérifier** tout ce qui touche au paiement (Stripe), au Worker API Cloudflare et à l'accès WhatsApp après paiement.
3. Me laisser une **commande unique pour republier** quand je t'apporterai une nouvelle version.

### Règles absolues

- **NE RIEN RÉÉCRIRE.** Pas de conversion en React / Next / Astro / Vue, pas de « nettoyage », pas de reformatage, pas de minification, pas d'optimisation d'images, pas de renommage de fichiers. Chaque page `*.dc.html` s'exécute seule dans le navigateur grâce à `support.js` (runtime qui l'interprète au chargement). Toute réécriture créerait des différences.
- Les seules modifications de fichiers autorisées sont celles **listées explicitement** dans ce document (§ 6), et toujours **après mon accord**.
- Ne travaille jamais sur les originaux : construis un dossier de publication `public/` par **copie** (script). Ne modifie jamais `assets/`, `uploads/`, `_ds/`.
- Ne me demande **jamais** de coller la clé secrète Stripe (`sk_live_…`) dans la conversation : fais-moi lancer moi-même la commande qui la saisit.
- N'ajoute ni analytics, ni cookies, ni traceurs, ni bannière, ni CSP sans me le demander (cela changerait le site et la politique de confidentialité).

---

## 0bis. L'ancien site

Un ancien site existe (monorepo bun / biome / lingui), il est **remplacé** par celui-ci. Tu travailles dans le dépôt GitHub `CreativePass/loandrouard-website`, qui ne contient **que** le nouveau site : ne recrée pas l'ancienne structure, ne convertis rien vers un framework.
- Pour retrouver la configuration existante (projet Cloudflare Pages / Worker, domaine, DNS, variables), **demande-moi** : je te la donnerai ou te montrerai mon tableau de bord Cloudflare. Fais-moi un résumé avant d'agir.
- Si l'ancien site est déjà en ligne sur le domaine, propose-moi comment basculer le domaine vers le nouveau site sans coupure, et garde l'ancien déploiement intact tant que je n'ai pas validé le nouveau en ligne.

---

## 1. Ce qu'il faut publier (liste blanche exacte)

Copie dans `public/` **en conservant exactement les mêmes chemins relatifs et noms (espaces compris)** :

**Pages** (racine)
- `Video Feedback.dc.html` — page de vente, **seule page publique pour l'instant** (le nom contient une espace : à garder)
- `CGV.dc.html`, `Privacy.dc.html`, `Legal.dc.html` — pages légales (EN par défaut, FR via `?lang=fr`, la version FR fait foi)
- `Sponsors.dc.html` — **pas une page** : bloc « Powered by » + pied de page importé par toutes les pages (`<dc-import name="Sponsors">` → il est chargé par `fetch` relatif). Indispensable.

**Scripts** (racine)
- `support.js` (runtime — ne pas toucher)
- `chargement.js` (écran de chargement, chargé dans le `<head>` avant `support.js`)
- `header-flottant.js`, `poussiere-or.js`, `blueprint.js`

**Dossiers**
- `_ds/` en entier (design system : CSS, polices woff2, `_ds_bundle.js`, textures, sceau). Le nom du sous-dossier `loan-drouard-design-system-06a79c98-aed9-4ca8-8b81-69bb72fcc98a` doit rester **exactement** celui-ci.
- `assets/` en entier **sauf `assets/photos/press-hd/`** (photos HD de la page Press, pas encore publique).

**Plus :** `index.html` = **copie octet pour octet** de `Video Feedback.dc.html` (pour que `https://domaine/` ouvre directement la page Video Feedback).

**À NE PAS publier (pour l'instant) :** `Home.dc.html`, `Press.dc.html`, `image-slot.js`, `zip-photos.js`, `uploads/` (aucun fichier), `assets/photos/press-hd/`, `archive/`, `scratch/`, `screenshots/`, `Export HTML/` (anciens exports, périmés), `cloudflare/` (code du Worker, déployé à part), `CLAUDE.md`, ce fichier, les `.png` de la racine (captures de travail).

**Contrôle :** après construction, vérifie qu'aucun fichier publié ne contient de lien vers `Home.dc.html` ou `Press.dc.html` (seuls des `<span>` grisés doivent rester) et qu'aucune requête ne part vers un fichier non publié.

Écris ce tri sous forme de script (`scripts/construire.sh` ou `.mjs`) pour qu'il soit rejouable.

---

## 2. Dépendances externes (ne pas les casser)

Le site charge en ligne, depuis le navigateur :
- `https://unpkg.com/react@18.3.1` et `react-dom@18.3.1` (chargés par `support.js`, avec SRI).
- Google Fonts : Long Cang et Ma Shan Zheng (`@import` dans `_ds/…/tokens/fonts.css`). Les autres polices (Cinzel, Cormorant, Cormorant SC) sont auto-hébergées dans `_ds/…/assets/fonts/`.
- `https://js.stripe.com/v3/` (paiement intégré), `https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js` (QR WhatsApp après paiement).
- Le Worker API : `https://loan-api.loandrouard-website.workers.dev`.
- Liens sortants : `buy.stripe.com`, `billing.stripe.com`, `wa.me`, `wushuperformance.com`, `medconsodev.eu`, `cnil.fr`, `stripe.com`, `whatsapp.com`, `cloudflare.com`.

Si tu ajoutes des en-têtes HTTP, aucun ne doit bloquer ces domaines (donc **pas de CSP**).

---

## 3. Hébergement recommandé : Cloudflare (déjà utilisé pour le Worker)

- Cloudflare Pages (ou Workers Static Assets si tu le juges plus fiable) servant `public/`.
- **Attention aux « pretty URLs »** : Pages redirige `X.html` → `X`. Vérifie que ça ne casse ni les liens (`href="Video Feedback.dc.html"`), ni les `fetch` relatifs de `support.js` (`Sponsors.dc.html`), ni les paramètres (`?lang=fr`, `?session_id=…`) qui doivent être **conservés** après redirection. Si un seul de ces points pose problème, choisis une configuration qui sert les fichiers tels quels (ex. Workers Static Assets avec `html_handling = "none"`).
- Cache : HTML revalidé à chaque visite ; scripts versionnés par `?v=` (cache long OK) ; images non versionnées → cache modéré (≈ 1 jour).
- Domaine : **demande-moi lequel** (voir § 7, point 1). Brancher apex + `www` (redirection 301 de l'un vers l'autre), HTTPS forcé.
- Prévois `npm run publier` (ou équivalent) = construire `public/` + déployer. Propose-moi un dépôt Git privé pour l'historique.

---

## 4. Paiement Stripe — état exact au 01/10/2026

**Compte Stripe LIVE** : `acct_1OFxSSEAanq7mbbH`.

### Formules (prix gérés chez Stripe, jamais dans le navigateur)

| Clé | Nom affiché | Prix | Mode Stripe | Price ID | Délai de retour |
|---|---|---|---|---|---|
| `single` | Single feedback | 49 € | payment | `price_1UGFgoEAanq7mbbHqvWu58xR` | 4 à 6 jours |
| `pack` | 3× feedback pack | 129 € | payment | `price_1UGFgpEAanq7mbbHusj9753Q` | 3 à 5 jours |
| `prog` | Quarterly program | 499 € **tous les 3 mois** | **subscription** | `price_1UGFgrEAanq7mbbHWFKnOkTv` | 2 à 3 jours |

Règles commerciales (déjà dans les CGV et le Worker) : pack valable 6 mois depuis la 1re vidéo ; semaine de programme reportable dans le trimestre ; vidéos supprimées 3 mois après le dernier retour ; programme résiliable à tout moment, effet en fin de période.

### Comment la page paie (dans `Video Feedback.dc.html`, ne pas modifier)

- Constantes en tête du script : `API = "https://loan-api.loandrouard-website.workers.dev"`, `STRIPE_PK = "pk_live_51OFxSS…"` (clé publique, normale dans la page), `PLACES = { pack: 6, prog: 2 }`.
- Clic « payer » → **Stripe Embedded Checkout** dans une fenêtre par-dessus la page : `POST {API}/checkout-session` `{ formule }` → `clientSecret` → `stripe.initEmbeddedCheckout(…)`. `redirect_on_completion: "never"` : à la fin, la page appelle `GET {API}/whatsapp?session_id=…`.
- **Repli** si le Worker ne répond pas : ouverture du lien de paiement Stripe dans un nouvel onglet :
  - single → `https://buy.stripe.com/bJe6oHfcR7M5d5N2bJ4ko01`
  - pack → `https://buy.stripe.com/aFabJ1fcR5DXc1J4jR4ko02`
  - prog → `https://buy.stripe.com/aFa8wPfcReatc1J8A74ko03`
  Ces liens ont déjà : case CGV + renonciation au droit de rétractation, collecte du téléphone, page de confirmation affichant le WhatsApp +33 7 72 04 12 66.
- Places restantes : `GET {API}/places` → `{ pack, prog }` affichées sur les cartes (6 et 2 tant que l'API ne répond pas).
- Les identifiants `BUY_BTN` présents dans le fichier sont **inutilisés** (gardés pour plus tard) : ne rien en faire.

### Accès WhatsApp après paiement (Planche II, section `#formules`)

- Une fois la session vérifiée payée, la carte achetée **remplace sa face** par le bloc « accès WhatsApp » (`.vf-deverrou`) : bouton vers `https://wa.me/<numéro>?text=…` + **QR code** du même lien (généré dans le navigateur), et la mention « Reply in <délai> · Link also in your confirmation email ».
- Message pré-rempli : `Hi Loan, I just purchased the <Nom formule>. Here's my video for the analysis.`
- Sur la carte `prog` payée : lien de gestion / résiliation → `https://billing.stripe.com/p/login/7sYbJ12q5c2l0j1bMj4ko00`.
- **Le numéro n'est pas écrit dans la page** : seul le Worker le renvoie, et seulement pour une session payée (+ abonnement encore actif pour `prog`, + achat de moins de 180 jours pour single/pack).
- Persistance : `localStorage["ld-vf-session"]` garde l'id de session → la carte reste débloquée au rechargement. La page lit aussi `?session_id=cs_…` dans l'URL (puis l'efface de la barre d'adresse) : un lien `…/Video%20Feedback.dc.html?session_id={CHECKOUT_SESSION_ID}` rouvre l'accès sur n'importe quel appareil.
- Prop d'aperçu `apercuPaye` (data-props du fichier) : défaut `"none"` — **doit rester `"none"` en ligne** (sinon un faux numéro s'affiche). Vérifie-le dans le fichier publié.

---

## 5. Worker API Cloudflare — `cloudflare/api-worker.js`

Déjà déployé via le tableau de bord sous le nom **`loan-api`** (sous-domaine de compte `loandrouard-website`). Le code du fichier est la référence (aligné le 01/10).

- Mets-le sous `wrangler` (`wrangler.toml`, `name = "loan-api"`, même compte : vérifie avec `npx wrangler whoami`) pour que l'URL **reste** `https://loan-api.loandrouard-website.workers.dev` (elle est écrite dans la page ; si elle devait changer, il faudrait modifier `API` dans `Video Feedback.dc.html` — à éviter).
- Avant tout `wrangler deploy` : déclare `SITE_ORIGIN` dans `[vars]` (ou `keep_vars = true`), sinon wrangler efface les variables saisies dans le tableau de bord. Les **secrets** existants sont conservés.
- Secrets : `STRIPE_SECRET_KEY` (sk_live — c'est **moi** qui le saisis via `npx wrangler secret put STRIPE_SECRET_KEY` si besoin), `WHATSAPP_NUMBER = 33772041266`.
- Variable `SITE_ORIGIN` : origines exactes séparées par des virgules, `https://`, sans `/` final — le domaine final (apex + www) **et** l'URL de prévisualisation `*.pages.dev` pendant les tests. Sans cela : erreur CORS, places et paiement intégré KO (repli sur les liens).
- Routes : `GET /places`, `POST /checkout-session`, `GET /whatsapp?session_id=`. Places : pack = 6 achats sur 180 jours glissants ; prog = 2 abonnements actifs (`active`, `trialing`, `past_due`). Session : `ui_mode embedded`, téléphone obligatoire, case CGV obligatoire avec texte de renonciation (art. L221-25 et L221-28 1° C. conso), texte de prélèvement récurrent pour `prog`. En-tête `Stripe-Version: 2025-03-31.basil`.

---

## 6. Ce qu'il reste à faire / vérifier côté Stripe (avec moi, pas à pas)

1. **URL des CGV** dans Stripe → Settings → Business → *Public details* → « Terms of service URL » = `https://<domaine>/CGV.dc.html?lang=fr` (ou l'URL finale exacte après tes tests de pretty URLs). **Sans elle, la création de session échoue.** Renseigner aussi Privacy policy (`Privacy.dc.html?lang=fr`), site web, e-mail et téléphone support (+33 7 72 04 12 66).
2. **Portail client** (Settings → Billing → Customer portal) : actif en LIVE, résiliation autorisée **en fin de période**, et vérifier que le lien `billing.stripe.com/p/login/7sYbJ12q5c2l0j1bMj4ko00` fonctionne.
3. **Domaine de paiement** (Settings → Payment methods → Payment method domains) : enregistrer le domaine final si nécessaire pour Apple Pay / Google Pay dans le checkout intégré.
4. **E-mail de confirmation** — la carte payée annonce « Link also in your confirmation email » : il faut que l'e-mail contienne **le lien WhatsApp** (`https://wa.me/33772041266?text=…`) **et un lien de retour vers le site**. Activer d'abord Settings → Customer emails → « Successful payments ». Puis propose-moi les deux options, avec leurs coûts éventuels :
   - **A (simple)** : texte ajouté par Stripe — `invoice_creation` + pied/description de facture sur les sessions `payment` (Worker + liens de paiement), pied de facture par défaut pour l'abonnement. Lien de retour générique vers `Video Feedback.dc.html#formules`.
   - **B (personnalisé)** : webhook `checkout.session.completed` sur le Worker + envoi d'un e-mail (service type Resend/Brevo, DNS SPF/DKIM) contenant le lien de retour `…?session_id=cs_…` qui rouvre la carte débloquée sur n'importe quel appareil.
   Je choisirai.
5. (Option) Liens de paiement de repli : régler « après paiement → rediriger vers le site » avec `https://<domaine>/Video%20Feedback.dc.html?session_id={CHECKOUT_SESSION_ID}` pour débloquer aussi la carte sur le site. Demande-moi avant ; la page de confirmation actuelle avec WhatsApp convient sinon.

### Modifications de fichiers autorisées (après mon accord uniquement)

- `index.html` (copie de Video Feedback) — § 1.
- Les champs listés au § 7 si je te donne les textes.

---

## 7. Questions à me poser AVANT la mise en ligne (ne rien inventer)

1. **Nom de domaine** : `loandrouard.fr` ou `loandrouard.com` ? Où est-il acheté (OVHcloud ?) et est-il déjà acheté ? Les pages légales publiées affichent `contact@loandrouard.com` : cette adresse doit fonctionner le jour de la mise en ligne. (Pour plus tard, lors de la publication de Home et Press : la Home affiche `contact@loandrouard.com`, la page Press `contact@loandrouard.fr` — à harmoniser.)
3. **Mentions légales** : 2 champs `[À COMPLÉTER : photographes]` (crédits photo, `.lg-todo` dans `Legal.dc.html`).
4. **Médiateur** (CGV § 15) : MED CONSO DEV — convention signée ? (obligatoire avant d'encaisser des consommateurs).
6. **Test de paiement** : propose-moi la méthode (ex. vrai achat Single 49 € avec ma carte puis remboursement depuis Stripe ; pour l'abonnement, souscription puis résiliation + remboursement, ou test en mode Test sur un Worker de prévisualisation avec clés/prix de test).
7. Option e-mail A ou B (§ 6.4).

---

## 8. Vérifications obligatoires (preuves à me montrer)

**Fidélité visuelle**
- Sers le dossier source brut en local (`npx serve` / `python3 -m http.server` à la racine) = **référence**. Compare avec la version déployée : captures Playwright de chaque page à 1440, 1280 et 390 px de large, en haut de page et à plusieurs hauteurs de défilement. Aucune différence attendue (hors animations en cours).
- Console navigateur sans erreur sur chaque page ; aucune requête 404 (hors `.image-slots.state.json` s'il n'existe pas).

**Par page**
- Écran de chargement (blanc, mots « Wushu… », trait doré) puis page.
- En-tête de chaque page : Home, The Journey, Press / Contact grisés, **non cliquables** (ni souris, ni clavier/Tab) ; Video Feedback actif.
- Bloc Sponsors « Powered by » + pied de page (réseaux, liens Terms of sale / Privacy / Legal notice) en bas de chaque page.
- Video Feedback : hero « projecteur », étude 42 frames au défilement + bascule yin-yang, Planche II (gabarits au crayon, lumière qui fait le tour, retournement des 3 cartes), sommaire en haut à droite (I à V), places restantes chargées depuis `/places` (onglet Réseau : 200, pas d'erreur CORS).
- Paiement : la fenêtre Stripe intégrée s'ouvre pour chaque formule, se ferme (croix, fond, Échap), et le repli `buy.stripe.com` fonctionne si l'API est coupée.
- Après un vrai paiement test : la carte se retourne sur l'accès WhatsApp (bouton + QR + message pré-rempli + délai), reste débloquée après rechargement, se rouvre via `?session_id=` ; lien portail sur `prog`.
- `https://domaine/` et `https://domaine/index.html` affichent Video Feedback ; `Home.dc.html` et `Press.dc.html` renvoient 404 (non publiées).
- CGV / Privacy / Legal : EN par défaut, FR avec `?lang=fr`.

---

## 9. Pour plus tard (ne pas faire sans me demander)

- **Publication de Home et Press** : quand je le demanderai, je te redonnerai un export où les liens seront réactivés ; il faudra alors ajouter `Home.dc.html`, `Press.dc.html`, `image-slot.js`, `zip-photos.js`, `assets/photos/press-hd/`, `uploads/hero-full-10mb-a8edee74.mp4` (vidéo du hero), `.image-slots.state.json` s'il existe (QR code de contact de la Home), repasser `index.html` sur Home, et régler : e-mail .fr/.com, notes provisoires de Press (prop `notesProvisoires`), QR code de la Home.

- Auto-héberger React/ReactDOM (aujourd'hui sur unpkg) pour ne plus dépendre de ce CDN — implique de toucher `support.js`, donc seulement si je valide.
- URLs plus courtes (`/video-feedback`) via redirections/réécritures, sans renommer les fichiers.
- `<title>`, favicon, balises de partage (Open Graph) — invisibles dans la page mais à valider avec moi.

## 10. Mises à jour futures

Je continuerai à modifier le design dans mon outil, je te redonnerai un nouvel export complet : tu relances `npm run publier` (même liste blanche), tu refais les vérifications du § 8, et tu me signales tout nouveau fichier référencé par les pages qui ne serait pas dans la liste blanche.
