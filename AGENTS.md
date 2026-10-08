# Conventions et garde-fous - Takienta

Lire d'abord `docs/cadrage/PROMPT-TAKIENTA.md` en entier. Ce fichier n'en est pas un
résumé : il fixe ce qu'il ne faut jamais faire sans avoir compris pourquoi.

## Règle mère

**Ne rien manipuler sans en connaître les tenants et les aboutissants.** Avant de
modifier une donnée, un identifiant, un schéma ou un fichier de `data/`, lire :
1. le cadrage (sections 3, 5, 11, 12) ;
2. `data/sources.json`, pour savoir d'où vient la donnée et avec quelle confiance ;
3. ce fichier, pour les décisions déjà figées.

Si l'effet d'un changement n'est pas clair, on s'arrête et on demande.

## Identité Git

Dépôt personnel. Config locale verrouillée : `Elodias (Perso) <olouwagnon@gmail.com>`,
remote `git@github-perso:Elodias2001/Takienta.git`. L'identité professionnelle de la
machine ne doit jamais apparaître. Avant un commit : `git var GIT_AUTHOR_IDENT`.

**Ne jamais pousser ni déployer sans demande explicite.** Aucun secret dans le diff.

## Données : interdits

- **Ne jamais inventer ni compléter une donnée au jugé.** Un trou documenté vaut mieux
  qu'une valeur plausible. Une valeur inventée qui passe les tests est pire qu'une
  erreur qui les casse.
- **Ne jamais ajuster une valeur attendue pour faire passer un test.** Si un compte ne
  tombe pas juste, on cherche pourquoi.
- **Un article de presse n'est pas une source.** Il dit où chercher, jamais quoi écrire.
- **Aucune donnée sans `source`** déclarée dans `data/sources.json`.
- **Ne pas lire de source en ligne dans le build.** Zéro appel réseau, le pipeline se
  rejoue hors ligne depuis `data/sources/`.
- **Tout nom entrant passe un contrôle** contre une liste de référence (les sources
  océrisées confondent O et Q : Quaké pour Ouaké).

## Décisions figées (ne pas rouvrir sans l'accord explicite d'Elodias)

- **Projet Takienta, paquet `benin-geo`.** Le nom est fondé sur une recherche sourcée
  (`docs/cadrage/recherche-nom-takienta.md`, 2026-10-07). Établi : *takienta* (pluriel *sikien*) est le nom
  que l'UNESCO donne à la maison-tour des Batammariba ; « somba » est un nom donné de l'extérieur, en
  langue bariba, repris par l'administration coloniale française (Padenou). **Non établi, donc à ne jamais
  écrire** : que « somba » soit péjoratif, que les Batammariba ne l'emploient pas, que la terrasse « porte la
  vie » ou que les greniers soient « coniques », un pluriel « takienti ». Le Koutammakou est au Bénin **et** au
  Togo. Toute nouvelle affirmation sur ce sujet passe d'abord par la note de recherche, avec sa source.
- **Identifiants** (`data/identifiants.snapshot.json`, figé le 2026-10-06) :
  - département : `BJ-` + code ISO 3166-2:BJ (`BJ-AK` pour l'Atacora, `BJ-AQ`, `BJ-KO`...) ;
  - commune : `BJ-<dép>-<3 lettres du nom>`, 4 en cas de collision (`BJ-CO-SAVA`,
    `BJ-CO-SAVE`, `BJ-OU-ADJA`, `BJ-OU-ADJO`), moins si le nom est plus court (`BJ-AQ-ZE`) ;
  - arrondissement : `BJ-<dép>-<com>-<NN>`, numéro séquentiel par commune, jamais
    renuméroté, jamais réattribué (instantané `data/identifiants-arrondissements.snapshot.json`, figé le 2026-10-07) ;
  - **un identifiant n'est jamais modifié ni réutilisé.** Une commune renommée garde
    son identifiant et gagne un alias. `tests/test_instantane.py` le garde.
  - ne pas régénérer l'instantané. Le script n'écrit que dans un chemin donné en argument.
- **Les pôles ne sont jamais dans l'identifiant d'une commune.** Atlantique et Ouémé
  sont coupés entre plusieurs pôles et le calque est provisoire. Il est versionné et
  daté séparément.
- **Pôles** : réunion de départements entiers, sauf le Grand-Nokoué (Abomey-Calavi et
  Ouidah pris dans l'Atlantique, Porto-Novo et Sèmè-Kpodji dans l'Ouémé). Le total de
  77 doit tomber juste : c'est un test, pas une remarque. Statut `provisoire` tant
  qu'aucun décret n'existe.
- **Arrondissements : 546, d'après l'annexe de la loi n°2013-05** (`data/sources/loi-2013-05.pdf`,
  article 14), état de 2013. Les modifications ultérieures n'ont pas été recherchées : le
  niveau reste à marquer `provisoire` tant que ce n'est pas fait. La liste extraite est
  `data/sources/loi-2013-05-arrondissements.json` (tests : `tests/test_annexe_2013.py`).
  Kandi 1, 2 et 3 sont des arrondissements légaux (la loi les nomme ainsi). Tout autre découpage
  « ZONE 1 », « ZONE 2 » n'est pas dans la loi : ne pas l'utiliser.
  Ne jamais lire les libellés ni les nombres sur le scan océrisé : il confond des chiffres.
- **Libellés d'arrondissement** : la loi les imprime en majuscules sans accents. Un accent n'est
  retenu que si un village du même arrondissement, de même nom, l'atteste (`graphie: attestee`),
  sinon le libellé est seulement remis en casse de titre (`graphie: deduite-du-libelle`, accents
  non vérifiables). **Ne jamais ajouter un accent de mémoire.** Les identifiants étant numérotés
  et non dérivés du nom, un nom se corrige sans changer l'identifiant.
  Code : `scripts/libelles_arrondissements.py`, `scripts/arrondissements_donnees.py`.
- **Identifiants d'arrondissement** : `data/identifiants-arrondissements.snapshot.json`, **figé le
  2026-10-07**. La clé d'un arrondissement est son libellé imprimé dans la loi (ou `rang:N` pour
  Cotonou, Parakou et Porto-Novo), pas son nom affiché : un nom se corrige, jamais un identifiant.
  Mêmes règles que pour les communes : jamais renuméroté ni réattribué. Un arrondissement créé
  plus tard s'ajoute en fin de liste de sa commune, une suppression laisse un trou. Ne pas
  régénérer l'instantané ; `tests/test_arrondissements.py` le garde.
- **Aucune géométrie dans le paquet** (licences : GADM interdit, OSM contaminant).

## Sources : seulement du public

**Ne citer dans le dépôt, le site, la documentation ou les paquets que des sources publiques.** Une
donnée dont la source n'est pas publique et citable n'entre pas dans `data/`, et son nom ne figure
nulle part : ni dans le registre, ni dans une note, ni dans un test, ni dans un commit. Les
communes sont fondées sur l'annexe de la loi n°2013-05, avec `data/rapprochement-communes.json` pour
les six libellés de la loi qui diffèrent du nom usuel. Tout ce qui ne relève pas du public se règle avec
Elodias, hors du dépôt.

## Paquet JS (packages/js)

- **Les données ne s'écrivent jamais à la main dans le paquet.** `scripts/build-data.mjs`
  génère `packages/js/src/generated/` (ignoré par Git) depuis `data/*.json`. Corriger une
  donnée, c'est corriger `data/` puis relancer le pipeline Python et le build, jamais le
  fichier généré.
- Chaîne : `python3 scripts/construire-donnees.py` (sources vers `data/*.json`), puis
  `pnpm test` dans `packages/js` (génère, construit, teste).
- **Zéro dépendance d'exécution, zéro appel réseau, import par défaut sous 150 Ko** : ce sont
  des tests (`test/paquet.test.ts`), pas des intentions. Ne pas les assouplir.
- TypeScript est épinglé en 5.x : tsup ne produit pas les types avec TypeScript 7.
- Les arrondissements sont embarqués sous forme compacte (champs communs écrits une fois,
  généré par `scripts/build-data.mjs`) : 546 enregistrements complets feraient exploser le
  seuil de poids. Le test d'égalité avec `data/arrondissements.json` garantit qu'aucune
  information ne se perd. Ne pas « simplifier » en remettant les objets complets.
- Par défaut `chercher` ne cherche que départements et communes ; les arrondissements sur
  demande (`niveau: "arrondissement"`). Les arrondissements numérotés de Cotonou, Parakou et
  Porto-Novo portent le même nom d'une ville à l'autre : l'option `dans` désigne la commune.
- `chercher` n'est ni floue ni phonétique. « seme podji » marche parce que Sème-Podji est un
  alias relevé dans les sources. Tout nouvel alias doit venir d'une source, pas d'une intuition.
- Le nom `benin-geo` a été vérifié libre sur npm et par `npm publish --dry-run`, mais le
  filtre de ressemblance de npm ne s'exerce qu'à la vraie publication. Repli prévu :
  `@elodias/benin-geo`. Ne pas publier sans demande.

## Paquet Python (packages/python)

- Même règle que le JS : `_generated.py` est produit par `scripts/build-data.mjs` (un seul
  script écrit les deux paquets) et ignoré par Git. Ne jamais l'éditer. `pyproject.toml`
  l'ajoute explicitement au wheel (`artifacts`), car Git l'ignore.
- API en snake_case, mêmes identifiants et mêmes résultats que le JS : `par_id`,
  `communes_de`, `poles_de`, `hierarchie`, `chercher`. Pas de sous-modules par niveau
  (`benin_geo.communes` écraserait la liste `communes`) : les points d'entrée par niveau
  servent le tree-shaking JS, pas Python.
- **`tests/test_croise.py` est le garde-fou de la parité JS/Python** : ~770 requêtes
  `chercher` plus `par_id`, `hierarchie`, `poles_de`, `communes_de`, comparées une à une, et
  les versions des deux paquets. Modifier `chercher` d'un côté sans l'autre le fait échouer.
  Il lit `packages/js/dist` : construire le JS d'abord.
- Python >= 3.9 (le minimum est celui testé), zéro dépendance d'exécution, `mypy --strict`
  propre. Dépendances de développement dans `requirements-dev.txt` et `.venv/`.
- Commandes : `pnpm build` dans `packages/js`, puis `python -m pytest` à la racine et dans
  `packages/python`.

## Marque (brand/)

- **Emblème : concept B, plan emboîté, choisi par Elodias.** Quatre cadres chanfreinés (pôle,
  département, commune, arrondissement), murs épais, une seule porte dans le mur extérieur.
  Angles chanfreinés, jamais arrondis. Sa géométrie est dans `scripts/emblem.mjs`, source unique.
- `brand/tokens.json` est la source des couleurs. `node scripts/build-brand.mjs` écrit les SVG,
  `palette.css` et `brand/README.md` : **ne jamais les modifier à la main**
  (`--verifier` échoue si un fichier diffère, et un test le lance).
- **Palette du cadrage inchangée** (`#E8DCC8`, `#2A211A`, `#B5532A`, `#D9A441`, `#5C7A4A`), plus
  quatre variantes pour le texte, car la latérite (3,66 sur banco) et la plaine (3,57) ne passent pas
  AA. Pour du texte courant, utiliser `--tk-accent-texte` et `--tk-signal-texte`, jamais
  `--tk-accent` ni `--tk-signal`. **Chaume sur banco est interdit** (1,66). Les contrastes sont
  calculés par `tests/test_marque.py`, pas estimés.
- Deux variantes d'emblème : complète (4 niveaux) et petite (3 niveaux, traits épaissis) pour 16 à
  32 px. Le favicon SVG suit le thème du navigateur (vérifié en clair et en sombre).
- **Typographie : Caprasimo (titres) et Figtree Variable (texte), la paire du site Kpanlingan,
  choisie par Elodias.** Fichiers `brand/fonts/` copiés depuis le projet Kpanlingan (paquets
  Fontsource 5.3.0, identiques à ceux que son site sert), licence OFL-1.1 avec leurs textes. Seul le
  sous-ensemble latin est embarqué (41 Ko). Les polices sont hébergées, **aucune requête vers un
  service de polices externe**. Caprasimo : titres seulement, une graisse (400), jamais en texte courant
  ni sous 20 px. Un identifiant (`BJ-AL-KAN-04`) se met en mono avec `white-space: nowrap`, sinon il se
  coupe au tiret. `tests/test_marque.py` échoue si un nom de `data/` sort de la plage embarquée : il
  faudrait alors ajouter le sous-ensemble étendu, pas retirer le test.
- Les PNG et l'ICO sont rendus par `node scripts/rendre-marque.mjs` (Chrome et `sips`, macOS) puis
  commités : jamais dans le build. Aucune image bitmap sur le site, hors favicons et icône d'écran.
- **Carte** (`assets/carte/`) : 12 départements en SVG, générée par `node scripts/build-carte.mjs` depuis
  les contours geoBoundaries archivés (téléchargés le 2026-10-07 avec l'accord d'Elodias, commit
  figé, empreinte dans `source.json`). C'est un asset du site, **jamais** dans `data/` ni dans un
  paquet : `tests/test_carte.py` échoue s'il y a un fichier de géométrie ou des coordonnées.
  Licence : le cadrage supposait CC BY, mais les métadonnées de ce jeu disent « Public Domain »
  (source Wikimedia Commons, fichier non nommé, impossible à vérifier). **L'attribution à geoBoundaries
  est obligatoire partout où la carte est publiée** (texte dans `source.json`). Contours de 2012,
  simplifiés : illustration seulement. Ne rien télécharger d'autre sans l'accord d'Elodias.
- L'accueil intègre la carte en ligne (`site/carte.mjs`) : le fichier SVG autonome reste dans `assets/carte/`.

## Site et documentation (site/, docs/)

- **Chaîne** : `pnpm build:site` écrit `dist-site/` (hors ligne, rien n'est commité) ; `pnpm test:site`
  (vitest) construit le site et le teste. `pnpm build:og` rend les vignettes de partage avec Chrome :
  à lancer à la main quand un titre change, les PNG de `site/img/og/` sont commités. Les fiches
  `docs/*.md` sont la source ; `docs/cadrage/` n'est pas publié.
- **Aucun chiffre écrit à la main dans une page** : tout vient de `data/` via `site/donnees.mjs`. Les
  tests comparent chaque nombre cité (pages et Markdown) aux comptes réels, et exécutent les exemples
  de la documentation contre les vrais paquets JS et Python.
- **`publie` dans `site/config.mjs`** : tant que npm et PyPI sont à `false`, aucune page n'annonce
  `npm install benin-geo` ni `pip install benin-geo`. Le jour de la publication, passer l'indicateur à
  `true` **et** écrire la ligne d'installation dans `docs/01-demarrage.md` : un test échoue sinon.
- **Identité publiée** : l'e-mail du site est `nounagnonadimou@gmail.com`. L'identité Git du dépôt
  (`olouwagnon@gmail.com`) ne doit apparaître dans aucune page (testé). Ni WhatsApp, ni identifiant
  fiscal : ne les ajouter qu'à la demande d'Elodias.
- **Mentions légales** : les faits d'hébergement (Hostinger, Paris, Cloudflare en DNS seul) sont ceux de
  Récade, relevés le 2026-09-24. À revérifier au premier déploiement.
- **Promesse de la page confidentialité** : « toute évolution du site qui introduirait une collecte, un
  cookie ou un prestataire entraîne la mise à jour de cette page et de sa date ». Cette règle est la
  condition pour que la page dise vrai : la respecter. Le site n'a aucun script, aucune ressource
  tierce, aucune police externe (CSP `default-src 'none'`).
- **Page À propos** : minimale. L'explication du nom *takienta* (sens, pluriel, exonyme « somba ») ne
  sera publiée qu'avec des sources vérifiées, comme l'exige le cadrage. Pas d'affirmation
  ethnographique sans source.
- **Mouvement : uniquement du CSS, jamais de JavaScript.** Transitions de page (`@view-transition`), barre de
  progression et révélations au défilement (`animation-timeline`), tracé de l'emblème, cascade et survol de
  la carte, schéma de l'emboîtement (`site/carte.mjs`, `site/emboitement.mjs`). Le survol passe par `:has()`.
  Règles verrouillées par des tests : tout est coupé sous `prefers-reduced-motion`, l'état de départ
  « caché » n'existe que dans des `@keyframes` (rien n'est invisible sans le support), les ombres sont
  pleines (`8px 8px 0`), jamais diffuses. Ajouter un script casserait la promesse de confidentialité et la CSP :
  ne pas le faire sans l'accord d'Elodias, et mettre à jour la page confidentialité si c'est décidé.
- **Carte de l'accueil** : ne jamais la montrer sans son attribution (testé sur la carte intégrée). Une carte au
  niveau des communes n'est possible qu'avec des contours publics et vérifiés à leur source ; des tracés dont
  l'origine est inconnue ne se publient pas.
- **Charte** : aucune couleur écrite en dur dans le CSS (variables `--tk-*`), jamais de trait de 1 px,
  Caprasimo pour les titres seulement. Une grille à une colonne s'écrit `minmax(0,1fr)`, jamais `1fr`
  (sinon un bloc de code fait déborder un écran de 375 px, c'est arrivé).
- **Déploiement** : `Dockerfile`, `nginx*.conf` et `docker-compose.prod.yml` sont éprouvés (image servie
  localement, en-têtes vérifiés dans chaque bloc, CSP sans violation). Elodias a autorisé le
  déploiement sur le VPS partagé le 2026-10-07 ; la procédure (accès, ordre DNS puis démarrage, image
  `linux/amd64`) est dans la mémoire privée, pas dans ce dépôt. Le DNS doit exister **avant** de démarrer
  le conteneur. Il n'y a **volontairement aucun workflow de déploiement GitHub** : le créer sur demande,
  et il ne doit jamais se déclencher seul sur un push. Ne pas pousser sans demande.

## Tiers

La copie du paquet Goldy98 (`data/sources/decoupage-territorial-benin_goldy98-*.json`)
n'est pas commitée : licence amont GPL-3.0, incompatible avec une promesse MIT. Elle
sert de repère de comparaison, rien de plus.

## Conventions

Français partout (commentaires, docs, commits, site), identifiants de code en anglais
quand c'est plus lisible, noms de domaine en français. Commits conventionnels en
français : `feat(data):`, `fix(core):`, `docs:`, `chore:`. Aucun tiret cadratin dans les
textes publiés.

Si tu affirmes qu'une commande marche, c'est que tu l'as lancée.
