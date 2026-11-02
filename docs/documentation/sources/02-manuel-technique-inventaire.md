# Inventaire pour 02 · Manuel technique : Takienta

Base relevée : dépôt `Takienta`, branche `publication` (publiée comme `main`), commit `15748a8`, 08/10/2026. Relevé en lecture seule le 26/10/2026. Commandes de test et de vérification lancées pour obtenir les comptes (aucune écriture constatée : `git status` propre après).

## 1. Prérequis

| Outil | Version | Rôle | Source |
|---|---|---|---|
| Node | `>=20` (racine) ; `>=18` à l'exécution du paquet JS ; CI 22 | build du site, tests, paquet JS | `package.json`, `packages/js/package.json`, `verify.yml` |
| pnpm | 10.28.2 | gestionnaire de paquets (`corepack enable` dans le `Dockerfile`) | `package.json` |
| Python | `>=3.9` ; CI 3.9 et 3.13 | pipeline de données, paquet Python, tests | `pyproject.toml`, `verify.yml` |
| Paquets Python de développement | `jsonschema>=4.20`, `pytest>=8`, `build>=1.2`, `mypy>=1.10` | tests, build, typage | `requirements-dev.txt` |
| Docker (et buildx) | non épinglé | image du site | `Dockerfile`, `verify.yml` |
| `pdftotext` (poppler) | non épinglé | `extraire-annexe-2013-05.py` seulement, à la main | `scripts/extraire-annexe-2013-05.py` |
| Chrome ou Chromium | non épinglé ; `TAKIENTA_CHROME` pour imposer le chemin | rendu des PNG (`build:og`, `rendre-marque.mjs`) | `scripts/chrome.mjs` |
| `sips` (macOS) | livré avec macOS | ICO de la marque | `scripts/rendre-marque.mjs` |
| `shasum` | livré avec macOS et Linux | un test compare l'empreinte de la loi archivée | `site/site.test.mjs` |

Création de l'environnement Python local (`.venv/`) : la commande n'est écrite nulle part dans le dépôt ; `AGENTS.md` dit « dépendances de développement dans `requirements-dev.txt` et `.venv/` ». À confirmer.

## 2. Mise en route locale

Parcours relevé (README, `docs/01-demarrage.md`) :

```bash
git clone https://github.com/Elodias2001/Takienta.git
cd Takienta
pnpm install
pnpm --filter benin-geo build
```

Site : `pnpm build:site` écrit `dist-site/` ; `pnpm test:site` lance vitest. Image : `docker compose up --build`, puis `docker compose port takienta-site 8080` (commentaire de `docker-compose.yml`).

Pas de compte administrateur, pas de seed, pas de formulaire de premier accès (aucune base, aucun backend).

## 3. Variables d'environnement

Aucun fichier `.env` dans le dépôt, aucun `.env.example`. Variables lues :

| Variable | Où | Rôle | Obligatoire |
|---|---|---|---|
| `TAKIENTA_CHROME` | `scripts/chrome.mjs` | chemin de Chrome pour les rendus PNG | non (candidats par défaut macOS et Linux) |
| `SITE_HOST` | `docker-compose.prod.yml` (labels Traefik) | nom d'hôte du site, posé dans le `.env` du serveur, jamais dans le dépôt | oui en production |
| `COMPOSE_PROJECT_NAME` | `docker-compose.yml`, `.prod.yml` | préfixe du conteneur et des routeurs Traefik | non (défaut `takienta`) |
| `GHCR_OWNER` | `docker-compose.prod.yml` | propriétaire de l'image | non (défaut `elodias2001`) |
| `IMAGE_TAG` | `docker-compose.prod.yml` | étiquette de l'image | non (défaut `main`) |
| `PYTHONPATH` | `site/site.test.mjs` (passé aux tests) | accès au paquet Python depuis les tests du site | interne au test |

Variables lues au build : aucune. Variables publiques inlinées : aucune (pas de framework). Déclarée mais jamais lue : aucune relevée. `local-secrets/` (ignoré par Git) contient des fichiers locaux ; leur contenu n'est pas lu pour la documentation.

## 4. Scripts pnpm

Racine (`package.json`) :

| Script | Commande | Rôle |
|---|---|---|
| `data` | `node scripts/build-data.mjs` | écrit les modules générés des deux paquets |
| `build` | `pnpm -r build` | build de tous les paquets |
| `test` | `pnpm -r test` | tests des paquets (le paquet JS reconstruit avant) |
| `type-check` | `pnpm -r type-check` | types |
| `build:brand` | `node scripts/build-brand.mjs` | SVG de marque, `palette.css`, `brand/README.md` |
| `build:carte` | `node scripts/build-carte.mjs` | SVG des cartes |
| `build:og` | `node scripts/build-og.mjs` | vignettes de partage (Chrome) |
| `build:site` | `node scripts/build-site.mjs` | site dans `dist-site/` |
| `test:site` | `vitest run` | tests du site (`vitest.config.mjs`, `site/**/*.test.mjs`) |

Paquet JS (`packages/js/package.json`) : `data` (`node ../../scripts/build-data.mjs`), `build` (`build-data.mjs && tsup`), `type-check` (`build-data.mjs && tsc --noEmit`), `test` (`pnpm build && vitest run`).

Pas de Makefile.

## 5. Cibles Makefile

Aucune (pas de `Makefile`). À dire explicitement.

## 6. Structure du code

Racine : `AGENTS.md`, `README.md`, `LICENSE` (MIT), `Dockerfile`, `.dockerignore`, `docker-compose.yml`, `docker-compose.prod.yml`, `nginx.conf`, `nginx-securite.conf`, `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `requirements-dev.txt`, `tsconfig.base.json`, `vitest.config.mjs`.

Dossiers : `assets/carte/` (cartes SVG, contours archivés, `source*.json`), `brand/` (tokens, SVG, PNG, polices), `data/` (données canoniques, schémas, sources archivées, calque des pôles), `docs/` (5 fiches + index publiés sur le site ; `cadrage/` non publié), `packages/js`, `packages/python`, `scripts/`, `site/` (générateur, pages, tests), `tests/` (pytest racine), `.github/workflows/`.

Fichiers générés, à ne jamais éditer : `packages/js/src/generated/` et `packages/python/src/benin_geo/_generated.py` (ignorés par Git, produits par `build-data.mjs`) ; `dist-site/` ; `packages/*/dist` ; `brand/svg/*`, `brand/palette.css`, `brand/README.md` (produits par `build-brand.mjs`, `--verifier` échoue si un fichier diffère) ; `assets/carte/benin-*.svg` et `assets/carte/README.md` (`build-carte.mjs --verifier`) ; `data/departements.json`, `communes.json`, `arrondissements.json`, `poles.json` (produits par `construire-donnees.py`). Commités mais rendus à la main : PNG et ICO de la marque, 11 vignettes `site/img/og/*.png`.

## 7. Conventions

- Langue : français partout (commentaires, docs, commits, site) ; identifiants de code en anglais si plus lisible ; noms de domaine en français (`AGENTS.md`).
- Commits conventionnels en français : `feat(data):`, `fix(core):`, `docs:`, `chore:` ; exemples réels : `feat(site): …`, `chore(infra): …`.
- Aucun tiret cadratin dans les textes publiés (`AGENTS.md`).
- TypeScript : `tsconfig.base.json` (`strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `verbatimModuleSyntax`, cible ES2022). Python : `mypy --strict` propre.
- Pas d'ESLint, de Prettier, de commitlint, de hook Git, de `CODEOWNERS`, de modèle de PR : aucun fichier correspondant (relevé par `ls -a`).
- Git : identité locale `Elodias (Perso)` ; vérifier `git var GIT_AUTHOR_IDENT` avant un commit ; ne pas pousser sans demande ; remote `git@github-perso:Elodias2001/Takienta.git`. Branche publiée : `main` (la branche locale de travail est `publication`, poussée par `git push origin publication:main`).
- Garde-fou de confidentialité : `python3 scripts/verifier-termes-prives.py` (option `--historique`, `--ref <branche>`) lit une liste locale hors dépôt ; exit 2 si la liste manque.
- Règles de charte du site (testées) : aucune couleur en dur (variables `--tk-*`), aucun trait de 1 px, ombres pleines, Caprasimo pour les titres seulement, grille à une colonne en `minmax(0,1fr)`.
- Règles de données : aucune donnée sans source ; jamais d'ajustement d'une valeur attendue pour faire passer un test ; un article de presse n'est pas une source ; tout nom entrant est contrôlé contre une liste de référence ; identifiants jamais modifiés ni réutilisés.

## 8. Ajouter une entité

Pas de « collection ». Équivalent relevé : ajouter ou corriger une donnée (`docs/05-contribuer.md`) :
1. S'appuyer sur un texte (loi, décret, publication officielle).
2. Ajouter le document dans `data/sources/` avec son empreinte, le déclarer dans `data/sources.json`.
3. `python3 scripts/construire-donnees.py` puis `node scripts/build-data.mjs`.
4. Un nouvel arrondissement s'ajoute en fin de liste de sa commune ; une suppression laisse un trou (`AGENTS.md`).
5. Ne pas régénérer les instantanés figés.

## 9. Autres briques

- Ajouter une page du site : déposer un module dans `site/pages/`, l'inscrire dans `ROUTES` de `scripts/build-site.mjs`, ajouter sa vignette dans `site/og.mjs` puis `pnpm build:og` (le build échoue sans vignette), ajouter la page au tableau `pages` de `site/site.test.mjs`.
- Ajouter une fiche de documentation : déposer `docs/NN-nom.md` ; l'ordre vient du préfixe ; vignette `og-docs-*.png` requise (`pnpm build:og`).
- Ajouter un alias de commune : uniquement s'il est relevé dans une source (`data/rapprochement-communes.json`).
- Modifier `chercher` : dans les deux paquets, sinon `tests/test_croise.py` échoue.
- Mettre à jour l'emblème : `scripts/emblem.mjs` (source unique), puis `build:brand`, puis `rendre-marque.mjs`.

## 10. Migrations

Aucune base, aucune migration. Évolution des données : pipeline ci-dessus.

## 11. Opérations propres au projet

| Opération | Commande | Quand | Précaution |
|---|---|---|---|
| Rejouer le pipeline | `python3 scripts/construire-donnees.py` | après un changement de source | `--verifier` pour contrôler sans écrire |
| Régénérer les modules des paquets | `node scripts/build-data.mjs` | après un changement dans `data/` | |
| Régénérer les cartes | `node scripts/build-carte.mjs` (`--verifier`) | contours ou données changés | |
| Régénérer la marque | `node scripts/build-brand.mjs` (`--verifier`) | `tokens.json` ou `emblem.mjs` changés | |
| Rendre les vignettes | `pnpm build:og` | un titre de page a changé | Chrome requis ; PNG à commiter |
| Rendre les PNG de marque | `node scripts/rendre-marque.mjs` | emblème changé | Chrome et `sips` ; macOS |
| Extraire l'annexe de la loi | `python3 scripts/extraire-annexe-2013-05.py <transcription.pdf> <loi-2013-05.pdf> <sortie.json>` | une seule fois, à la main | utilise `pdftotext` ; jamais dans le build |
| Générer les instantanés | `generer-instantane-*.py <chemin>` | test de garde-fou seulement | ne jamais écraser l'instantané figé |
| Vérifier les termes privés | `python3 scripts/verifier-termes-prives.py --historique --ref <branche>` | avant tout push | liste locale requise |

Procédure de publication d'un paquet (observée dans la conversation, pas écrite dans le dépôt) : npm `npm publish --access public` depuis `packages/js` ; PyPI `python -m build` puis `twine upload` depuis `packages/python`. Voir questions.

## 12. Tests (comptes rapportés par les outils, 26/10/2026, commit `15748a8`)

| Suite | Commande | Résultat |
|---|---|---|
| Site (vitest) | `pnpm test:site` | 1 fichier, 315 tests passés |
| Paquet JS (vitest) | `pnpm test` dans `packages/js` (reconstruit d'abord) ; relevé avec `vitest run` | 3 fichiers, 42 tests passés |
| Pytest racine | `python -m pytest tests` | 87 passés |
| Pytest paquet Python | `python -m pytest packages/python` (CI) | 34 passés |
| Types Python | `python -m mypy --strict packages/python/src/benin_geo` | « no issues found in 5 source files » |
| Données | `python3 scripts/construire-donnees.py --verifier` | code de sortie 0 |

Répartition pytest racine (collecte) : `test_marque` 18, `test_carte` 17, `test_arrondissements` 16, `test_donnees` 14, `test_annexe_2013` 8, `test_schemas` 7, `test_tiers_non_suivis` 2, `test_instantane` 2, `test_croise` 2, `test_termes_prives` 1.

Particularités : `tests/test_croise.py` lit `packages/js/dist` (construire le JS d'abord). Les tests du site lancent `shasum`, `python3` et `node scripts/build-carte.mjs --verifier`. `test_termes_prives` est ignoré sans liste locale. Pas de test e2e navigateur, pas de test de charge. Couverture de code : non mesurée.

CI : voir inventaire 01, section 4.

## 13. Build et déploiement

- Build local du site : `pnpm build:site`. Image : `docker build` (CI) ou `docker buildx build --platform linux/amd64 -t ghcr.io/elodias2001/takienta-site:main --load .` (relevé dans la conversation du 07/10/2026 ; non écrit dans le dépôt).
- Déploiement : manuel. Le dépôt ne contient aucun workflow de déploiement. Les étapes réelles (`docker save | gzip | ssh … 'gunzip | docker load'`, puis `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d`) figurent dans la mémoire privée d'Elodias, pas dans le dépôt : voir questions.
- Retour arrière : aucun mécanisme écrit. Une image précédente n'est pas conservée sous étiquette dans le dépôt. À demander.
- Vérifications après déploiement : `docker inspect` (mémoire, état healthy), codes HTTP 200 sur `/`, `/carte`, `/comparer`, `/provenance` (relevé de la conversation du 08/10/2026).
- Le DNS doit exister avant le démarrage du conteneur (Let's Encrypt) : `AGENTS.md`.

## 14. Observabilité opérationnelle

Journaux : ceux de Docker (`docker logs takienta-site`). Healthcheck : voir inventaire 01. Pas d'alerte, pas de métrique. Rotation des journaux : `site/config.mjs` affirme `json-file`, 10 Mo × 3 fichiers ; le compose ne le configure pas (réglage du démon Docker de l'hôte probable) : à confirmer.

## 15. Sécurité opérationnelle

- Aucun secret dans le dépôt. `local-secrets/` ignoré par Git.
- En-têtes HTTP : voir inventaire 01. Pas de `server_tokens off` relevé dans `nginx.conf` : à vérifier par `curl -sI`.
- Audit de dépendances (`pnpm audit`, `pip-audit`) : aucune commande ni job CI.
- Jetons de publication npm et PyPI : conservés hors dépôt (fichier local ignoré) ; à faire tourner par l'utilisatrice.

## 16. Procédures courantes (relevées)

| Besoin | Comment |
|---|---|
| Contrôler que `data/` est à jour | `python3 scripts/construire-donnees.py --verifier` |
| Contrôler marque et cartes | `node scripts/build-brand.mjs --verifier` ; `node scripts/build-carte.mjs --verifier` |
| Recalculer l'empreinte de la loi 2013-05 | `shasum -a 256 data/sources/loi-2013-05.pdf` (valeur attendue : voir page Provenance, `data/sources.json`) |
| Reconstruire tout | `python3 scripts/construire-donnees.py`, `node scripts/build-data.mjs`, `pnpm --filter benin-geo test`, `python3 -m pytest` (`docs/05-contribuer.md`) |

Le dernier bloc cite `python3 -m pytest` ; voir `…-corrections-depot.md`.

## 17. Dépannage (sources écrites seulement)

| Symptôme | Cause | Action | Source |
|---|---|---|---|
| `Aucun Chromium trouvé` | aucun Chrome aux emplacements prévus | `TAKIENTA_CHROME=/chemin/vers/chrome` | `scripts/chrome.mjs` |
| Le build du site échoue avec « Vignette absente » | page ou fiche sans PNG de partage | `pnpm build:og`, commiter le PNG | `scripts/build-site.mjs` |
| `construire-donnees.py` s'arrête (« source absente du registre », « commune appariée deux fois »…) | donnée sans source ou rapprochement incohérent | corriger `data/sources.json` ou `data/rapprochement-communes.json` | messages de `construire-donnees.py` |
| `build-carte.mjs` échoue (« commune non rattachée de façon unique ») | nom de contour sans commune | ajouter un rapprochement écrit dans `assets/carte/source-communes.json` | `scripts/build-carte.mjs` |
| `test_croise` échoue | `chercher` modifié d'un seul côté, ou `dist` JS absent | aligner les deux paquets ; `pnpm build` d'abord | `AGENTS.md` |
| `verifier-termes-prives.py` sort avec le code 2 | liste locale absente | recréer `local-secrets/termes-prives.txt` | docstring du script |
| Une grille déborde à 375 px | `1fr` au lieu de `minmax(0,1fr)` | corriger la grille | `AGENTS.md` |
| Certificat TLS non émis au premier démarrage | DNS absent au démarrage du conteneur | créer le DNS avant | `AGENTS.md` |

## 18. Mise à niveau

Versions épinglées par `pnpm-lock.yaml` (`--frozen-lockfile` en CI et dans le `Dockerfile`) ; TypeScript maintenu en 5.x. Pratique de mise à jour des dépendances : non écrite. Montée de version des paquets : `version` dans `packages/js/package.json` et `packages/python/pyproject.toml`, `__version__` dans `__init__.py`, vérifiées identiques par `test_croise.py`.

## 19. Ressources

`README.md` ; `docs/01..05-*.md` (démarrage, référence API, modèle de données, identifiants, contribuer) ; `docs/cadrage/PROMPT-TAKIENTA.md` (cadrage) ; `docs/cadrage/recherche-nom-takienta.md` ; `AGENTS.md` ; `brand/README.md` ; `assets/carte/README.md` ; `data/sources/NOTES-SOURCING-2026-09-28.md` ; READMEs des deux paquets. Externes : UNESCO, bien n°1140 ; loi n°97-028 ; loi n°2013-05 ; ISO 3166-2:BJ.

## 20. Contacts internes

Pas de `CODEOWNERS`. Seule personne identifiée : Elodias Adimou (mainteneuse, projet personnel). Canal d'astreinte : aucun écrit.

## 21. Points à demander

Voir l'annexe du PDF correspondant.
