# Inventaire pour 01 · Architecture : Takienta

Base relevée : dépôt `Takienta`, branche `publication` (publiée comme `main` sur `origin`), commit `15748a8`, 08/10/2026. Relevé en lecture seule le 26/10/2026. Arbre de travail propre au relevé.

## 1. Vue d'ensemble

- Monorepo pnpm (`pnpm-workspace.yaml` : `packages/*`). Racine : `package.json` (`takienta-monorepo`, `private`, `packageManager: pnpm@10.28.2`, `engines.node >=20`).
- Ce que le dépôt produit :
  - données canoniques `data/*.json` (12 départements, 77 communes, 546 arrondissements, 6 pôles, registre de 7 sources), générées par `scripts/construire-donnees.py` ;
  - un paquet JavaScript `packages/js` (`benin-geo` 0.1.0, ESM + CJS + types, publié sur npm le 09/10/2026 d'après la conversation) ;
  - un paquet Python `packages/python` (`benin-geo` 0.1.0, publié sur PyPI) ;
  - un site statique (`site/`, `scripts/build-site.mjs`) servi par nginx depuis une image Docker.
- Pas de serveur applicatif, pas de base de données, pas de compte (`docs/05-contribuer.md`, section « Ce qui est refusé »).
- Surfaces : site `https://takienta.sabar.app` (`site/config.mjs`), paquets npm et PyPI, dépôt GitHub `Elodias2001/Takienta`.

### Stack (versions relevées)

| Brique | Version | Source |
|---|---|---|
| Node | engines `>=20` (racine), `>=18` (paquet JS) ; image de build `node:22-alpine` ; CI Node 22 ; poste de travail relevé : v26.7.0 | `package.json`, `Dockerfile`, `.github/workflows/verify.yml` |
| pnpm | 10.28.2 | `package.json` (`packageManager`) |
| Python | `requires-python >=3.9` ; CI 3.9 et 3.13 ; poste : 3.9.6 | `packages/python/pyproject.toml`, `verify.yml` |
| TypeScript | `^5.9.3` (épinglé 5.x, tsup ne produit pas les types avec TS 7, `AGENTS.md`) | `packages/js/package.json` |
| tsup | `^8.5.1` | idem |
| vitest | `^5.0.1` (racine et paquet JS) | `package.json` |
| marked | `^18.0.14` (rendu des fiches Markdown du site) | `package.json` |
| hatchling | `>=1.27` (build Python) | `pyproject.toml` |
| mypy | `>=1.10`, `--strict` | `requirements-dev.txt`, `verify.yml` |
| pytest | `>=8` ; jsonschema `>=4.20` ; build `>=1.2` | `requirements-dev.txt` |
| nginx | `nginx:1.27-alpine` | `Dockerfile` |

### Schéma de la chaîne (à dessiner)

```
data/sources/*.pdf, *.json (archives)     data/identifiants*.snapshot.json (figés)
data/poles/poles-2026-09-23.json          data/rapprochement-communes.json
                    \                      /
                     scripts/construire-donnees.py  --> data/{departements,communes,arrondissements,poles}.json
                                                          |
                                      scripts/build-data.mjs
                                       /                    \
        packages/js/src/generated/ (ignoré)      packages/python/src/benin_geo/_generated.py (ignoré)
                 tsup -> dist (ESM, CJS, .d.ts)           hatchling -> wheel + sdist
                                                          
data/*.json + assets/carte/* + brand/* + docs/*.md --> scripts/build-site.mjs --> dist-site/ (ignoré)
                                                          |
                                                 Dockerfile (nginx) --> image takienta-site
```

### Chemin d'une requête (site)

nginx (`nginx.conf`, port 8080) : `try_files $uri $uri/ $uri.html =404` ; `/health` répond `200 ok` ; en-têtes de sécurité via `include nginx-securite.conf` dans chaque bloc `location`. Traefik (réseau `gcw-public`) termine TLS, d'après `docker-compose.prod.yml` (labels). Pas de script côté navigateur : CSP `default-src 'none'`.

## 2. Couches logicielles

### Données (`data/`)
- `schema/entite.schema.json`, `poles.schema.json`, `sources.schema.json` (JSON Schema 2020-12 ; tests `tests/test_schemas.py`, 7 tests).
- Enregistrement : `id, type, nom, tri, parent, source, releveLe, confiance`, plus `alias` (communes), `provisoire`, `graphie`, `libelleLoi` (arrondissements). `confiance` : `officielle | derivee | provisoire`.
- Identifiants : `BJ-<ISO>` (départements), `BJ-<dép>-<3-4 lettres>` (communes), `BJ-<dép>-<com>-<NN>` (arrondissements), `PO-<lettres>` (pôles). Instantanés figés : `identifiants.snapshot.json` (06/10/2026), `identifiants-arrondissements.snapshot.json` (07/10/2026) ; test `tests/test_instantane.py` (2 tests) et `tests/test_arrondissements.py` (16).
- Sources : `data/sources.json`, 7 entrées : `loi-97-028`, `loi-2013-05`, `annexe-loi-2013-05-transcription`, `decret-2009-202`, `avocevou-2013`, `communique-marina-2026-09-23`, `iso-3166-2-bj`. Archives : `data/sources/loi-97-028.pdf`, `loi-2013-05.pdf`, `decret-2009-202.pdf`, `loi-2013-05-arrondissements.json`, `NOTES-SOURCING-2026-09-28.md`. Copie tierce `decoupage-territorial-benin_goldy98-*.json` : ignorée par Git (licence amont GPL-3.0), test `tests/test_tiers_non_suivis.py`.
- Pôles : calque daté `data/poles.json` (`effectifAu` 2026-09-23, `provisoire: true`), 6 pôles : PO-NO 13, PO-NE 14, PO-CE 15, PO-SO 18, PO-SE 12, PO-GN 5 communes (somme 77). Chef-lieu du Grand-Nokoué `null` (`CHEF_LIEU_NON_CONFIRME` dans `construire-donnees.py`).

### Pipeline (`scripts/`)
- `construire-donnees.py` : lit les instantanés, la liste de pôles, l'annexe extraite de la loi 2013-05, le registre ; contrôle les noms contre la liste de référence ; écrit les 4 fichiers. `--verifier` échoue si un fichier diffère. Zéro réseau.
- Modules : `annexe_loi_2013_05.py`, `arrondissements_donnees.py`, `libelles_arrondissements.py` (graphie `attestee` ou `deduite-du-libelle`).
- `extraire-annexe-2013-05.py` : à lancer à la main (utilise `pdftotext`), jamais dans le build.
- `generer-instantane-ids.py`, `generer-instantane-arrondissements.py` : n'écrivent que dans un chemin donné ; l'instantané figé ne se régénère jamais.
- `verif-poles.py` : recoupement du communiqué des pôles ; lu par `tests/test_donnees.py` (analyse syntaxique, ligne 92).
- `build-data.mjs` : écrit `packages/js/src/generated/` et `_generated.py` depuis `data/` ; encode les arrondissements sous forme compacte (champs communs écrits une fois).

### Paquet JavaScript (`packages/js`)
- `src/index.ts` : `parId, communesDe, arrondissementsDe, polesDe, hierarchie, chercher` ; exports `departements, communes, arrondissements, poles, calquePoles, sources`. Points d'entrée `departements`, `communes`, `arrondissements`, `poles`. `src/normaliser.ts`, `src/types.ts`.
- `chercher` : normalisation sans accents, casse, tirets, apostrophes ; rangs 0 à 4 (égalité, début, début de mot, contenu, contenu sans espaces) ; ni floue ni phonétique ; options `niveau`, `dans`.
- Build : `tsup.config.ts` (ESM + CJS, dts, `minify`, `splitting`, `treeshake`, cible ES2022). Tests : `test/api.test.ts`, `donnees.test.ts`, `paquet.test.ts` (poids, zéro dépendance, zéro réseau, parité ESM/CJS).

### Paquet Python (`packages/python`)
- `src/benin_geo/` : `__init__.py` (API snake_case, `__version__ = "0.1.0"`), `_donnees.py`, `_generated.py` (généré, ignoré par Git, ajouté au wheel via `artifacts`), `_normaliser.py`, `_types.py`, `py.typed`. Zéro dépendance (`dependencies = []`).
- Tests : `packages/python/tests/test_donnees.py` (34 tests).

### Parité JS/Python
- `tests/test_croise.py` : plus de 3000 requêtes via `scripts/executer-requetes.mjs` (lit `packages/js/dist/index.js`), plus les versions. 2 tests.

### Site (`site/`)
- Générateur Node sans framework : `scripts/build-site.mjs` importe un module par page (`site/pages/*.mjs`), la coquille `site/layout.mjs`, `site/config.mjs` (identité, `publie`, hébergement, dates légales), `site/donnees.mjs` (lit `data/` ; aucun nombre écrit à la main), `site/docs.mjs` (Markdown `docs/*.md` vers HTML via `marked`), `site/og.mjs` (vignettes), `site/carte.mjs`, `site/communes.mjs`, `site/emboitement.mjs`.
- Routes : `/`, `/provenance`, `/carte`, `/comparer`, `/a-propos`, `/mentions-legales`, `/confidentialite`, `/docs/` et 5 fiches `/docs/0N-*.html` ; `robots.txt` ; `sitemap.xml` (13 URL au build du 08/10/2026).
- Mouvement : CSS seul (`@view-transition`, `animation-timeline`, `:has()`), aucune ligne de JavaScript ; coupé sous `prefers-reduced-motion`.
- Marque : `brand/tokens.json` (source des couleurs) ; `scripts/build-brand.mjs` écrit SVG, `palette.css`, `brand/README.md` ; PNG et ICO rendus par `scripts/rendre-marque.mjs` (Chrome et `sips`) puis commités. Polices hébergées `brand/fonts/` (Caprasimo, Figtree Variable, licence OFL-1.1).
- Cartes : `scripts/build-carte.mjs` génère `assets/carte/benin-departements.svg` (12) et `benin-communes.svg` (77) depuis des contours geoBoundaries archivés ; asset du site, jamais dans `data/` ni dans un paquet (`tests/test_carte.py`, 17 tests).
- Vignettes de partage : `scripts/build-og.mjs` (Chrome), 11 PNG commités dans `site/img/og/` ; le build du site échoue si une vignette manque.
- Tests : `site/site.test.mjs` (vitest, 315 tests rapportés le 26/10/2026), `tests/test_marque.py` (18), `tests/test_termes_prives.py` (1, ignoré sans liste locale).

### Observabilité
- Healthcheck : `GET /health` (nginx, `access_log off`) ; healthcheck compose `wget -qO- http://127.0.0.1:8080/health`, intervalle 30 s, délai 5 s, 3 essais, démarrage 10 s (`docker-compose.yml`). Il vérifie que nginx répond, pas le contenu des pages.
- Pas d'analytics, pas de cookie, pas de script (page confidentialité) ; journaux du serveur seuls (adresse IP).

## 3. Flux de données clés (à rédiger en pseudo-code)

1. Données : sources archivées + instantanés → `construire-donnees.py` → `data/*.json` → `build-data.mjs` → paquets.
2. Site : `data/*.json` + `docs/*.md` + `assets/carte/` + `brand/` → `build-site.mjs` → `dist-site/` → image.
3. Recherche (`chercher`) : normalisation, filtrage par niveau et `dans`, rang, tri par `tri`.
4. Carte des communes : contours ADM2 → rattachement par nom normalisé et alias plus 2 rapprochements écrits (`assets/carte/source-communes.json`) → `benin-communes.svg` → pages `/carte` et `/comparer` (sélection par `:has(:checked)` en CSS).
5. Flux externes à l'exécution : aucun (zéro réseau). À la construction : aucun. Hors build, à la main : `extraire-annexe-2013-05.py` (pdftotext), rendu Chrome des PNG.

## 4. Infrastructure et déploiement (relevé dans le dépôt)

- Environnements : local (`docker compose up --build`), production (`docker-compose.prod.yml`). Pas de staging dans le dépôt.
- `Dockerfile` : étage `node:22-alpine` (corepack, `pnpm install --frozen-lockfile --filter .`, `pnpm build:site`), étage `nginx:1.27-alpine` (copie `nginx.conf`, `nginx-securite.conf`, `dist-site`), port 8080. `.dockerignore` exclut `packages/python`, `data/sources`, contours bruts, `docs/cadrage`.
- `docker-compose.yml` : service `takienta-site`, `container_name ${COMPOSE_PROJECT_NAME:-takienta}-site`, `restart: unless-stopped`, healthcheck.
- `docker-compose.prod.yml` : `build: !reset null`, image `ghcr.io/${GHCR_OWNER:-elodias2001}/takienta-site:${IMAGE_TAG:-main}`, réseau `gcw-public` (externe), `mem_limit: 128m`, `memswap_limit: 192m` (commit `15748a8`), labels Traefik (routeur `websecure`, TLS, `certresolver=letsencrypt`, port 8080), `SITE_HOST` lue dans le `.env` du serveur.
- CI (`.github/workflows/ci.yml` appelle `verify.yml`) : sur PR et push vers `main`, et `workflow_dispatch`. Job `verify` (matrice Python 3.9 et 3.13) : `pnpm install --frozen-lockfile`, `pip install -r requirements-dev.txt`, `construire-donnees.py --verifier`, `pnpm type-check`, `pnpm --filter benin-geo test`, `mypy --strict`, `pytest packages/python`, `pytest tests`, `pnpm test:site`, `pnpm build:site`, `python -m build packages/python`. Job `image` : `docker build -t takienta-site:ci .` (ne pousse rien).
- **Aucun workflow de déploiement** (volontaire, commentaire de `verify.yml` et `AGENTS.md`). Aucun workflow de publication npm ou PyPI.
- En-têtes HTTP (`nginx-securite.conf`) : `X-Content-Type-Options nosniff`, `X-Frame-Options SAMEORIGIN`, `Referrer-Policy strict-origin-when-cross-origin`, `Permissions-Policy` (caméra, micro, géolocalisation, cohort), CSP `default-src 'none'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; font-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'self'`.
- Cache (`nginx.conf`) : pages 300 s ; `/img/og/` 1 an `immutable` avec CORS ouvert ; `/img/` et `/fonts/` 7 jours ; icônes 7 jours. gzip actif (min 512 octets).
- Variables : voir inventaire 02 (section 3). Aucun secret dans le dépôt ; `local-secrets/` ignoré par Git.
- Hébergement : `site/config.mjs` dit VPS Hostinger (Paris), DNS Cloudflare en « DNS only », relevé de Récade le 24/09/2026, à revérifier au premier déploiement.
- Topologie déployée constatée le 26/10/2026 : à faire par `curl -sI https://takienta.sabar.app/` (voir questions).
- Sauvegardes : aucune base. Le dépôt GitHub contient tout ; la copie tierce GPL est locale seulement.

## 5. Choix techniques (justifications écrites)

| Décision | Ce que dit le code ou la doc | Source |
|---|---|---|
| Données hors ligne, zéro réseau | invariant 2 ; pipeline rejouable depuis `data/sources/` ; sources archivées avec SHA-256 car les portails officiels tombent | `docs/05-contribuer.md`, page Provenance |
| Zéro dépendance d'exécution | invariant 1 ; test `paquet.test.ts` | idem |
| Identifiants figés, jamais réattribués | instantanés + tests | `AGENTS.md`, `docs/04-identifiants.md` |
| Pas de géométrie dans les paquets | licences (GADM interdit, OSM contaminant) | `AGENTS.md` |
| Arrondissements compacts dans le paquet | 546 objets complets dépasseraient le seuil de 150 Ko | `AGENTS.md`, `build-data.mjs` |
| Pas de recherche floue | un résultat plausible mais faux est pire qu'aucun résultat | `docs/02-reference-api.md` |
| CSS seul pour le mouvement | promesse de la page confidentialité et CSP stricte | `AGENTS.md`, `layout.mjs` |
| En-têtes de sécurité dans un fichier `include` | un `add_header` dans un bloc enfant annule ceux du parent | commentaire de `nginx-securite.conf` |
| Aucun workflow de déploiement | décision d'Elodias ; à créer sur demande | `verify.yml`, `AGENTS.md` |
| Pas de génération des PNG dans le build | il faut un Chrome, absent de l'image | `build-og.mjs`, `rendre-marque.mjs` |
| TypeScript 5.x | tsup ne produit pas les types avec TypeScript 7 | `AGENTS.md` |

Compromis (« gagne… perd… ») : seulement ce qui est écrit ; sinon « Non déterminé à date ».

## 6. Dépendances externes

| Service | Rôle | Variables | Où |
|---|---|---|---|
| npm (`benin-geo`) | distribution JS | aucune dans le dépôt (jeton local à la machine) | publication manuelle |
| PyPI (`benin-geo`) | distribution Python | idem | publication manuelle (twine) |
| GitHub | dépôt, CI | aucun secret déclaré | `.github/workflows/` |
| GHCR (`ghcr.io/elodias2001/takienta-site`) | nom d'image | `GHCR_OWNER`, `IMAGE_TAG` | `docker-compose.prod.yml` ; pas de push au registre dans le dépôt |
| Traefik, Let's Encrypt | routage, TLS | `SITE_HOST`, `COMPOSE_PROJECT_NAME` | labels du compose prod |
| Cloudflare (DNS) | enregistrement DNS | aucune | `site/config.mjs` |
| geoBoundaries (contours) | fonds de carte archivés | aucune (fichiers locaux) | `assets/carte/source*.json` |
| Chrome / Chromium | rendu manuel de PNG | `TAKIENTA_CHROME` | `scripts/chrome.mjs` |

Variable déclarée mais jamais lue : aucune relevée.

## 7. Limites connues

- Arrondissements : état de 2013 ; lois postérieures non recherchées ; niveau `provisoire` (`site/pages/provenance.mjs`, `AGENTS.md`).
- Pôles : communiqué du 23/09/2026, aucun décret ; `provisoire`.
- Chef-lieu du Grand-Nokoué non confirmé.
- Écart dans la loi : annexe annonce 517 villages pour l'Atacora, ses communes en totalisent 519 (page Provenance).
- 281 noms d'arrondissement sur 546 en `graphie: deduite-du-libelle` (accents non vérifiables).
- Contours de cartes : 2012 (départements) et 2007 (communes), simplifiés, illustration seulement ; 2 noms de communes rapprochés à la main (Kobli = Cobly, Akpo-Misserete = Akpro-Missérété).
- Niveau sous l'arrondissement (villages, quartiers) : hors périmètre v0.1.0.
- Couverture de code : non mesurée (aucune configuration `coverage`).
- Pas de test de rendu dans un navigateur (les tests analysent le HTML produit).
- Pas de workflow de publication ni de déploiement.
- Frontières : hébergement partagé (VPS), DNS, registres npm et PyPI relèvent d'Elodias ; la loi est la source, pas le dépôt.

## 8. Points à demander

Réponses d'Elodias du 26/10/2026 : « je suis ta reco pour tout ». Suites données : publication et déploiement décrits sans adresse ni accès ; points restés sans réponse portés en annexe « Non déterminé à date ». Questions d'origine :
1. Déploiement : décrire la procédure manuelle (image amd64, transfert, `up -d`) sans IP ni clé ?
2. Topologie déployée : proxy Cloudflare ou DNS seul, vérifier par `curl -sI` ?
3. Journalisation Docker (10 Mo × 3) : écrite dans `site/config.mjs`, absente du compose.
4. Évolution prévue d'infrastructure (workflow de déploiement) ?
