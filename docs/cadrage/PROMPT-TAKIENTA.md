# Takienta — prompt de démarrage

> À coller tel quel dans une nouvelle conversation Claude Code, ouverte à la
> racine `~/Documents/Projets/Elodias/`. Tout ce qui suit a été établi en amont :
> ne le re-découvre pas, vérifie-le.

---

## 0. La mission

Construire **Takienta** : le projet open source de référence qui expose la
structure administrative du Bénin **à jour**, distribué sur **npm** et **PyPI**,
avec un site de documentation statique.

Le projet s'appelle Takienta. **Le paquet, lui, s'appelle `benin-geo`.** Ce
n'est pas une hésitation, c'est une décision : un paquet de données se cherche
plus qu'il ne se raconte, et un développeur béninois tape « benin communes npm »,
pas « takienta ». Le nom de marque vit sur le site, le dépôt et l'identité
visuelle ; le nom technique vit sur les registres. Voir la section 7.

Il existe déjà deux paquets. Aucun des deux n'est à jour, et aucun des deux ne
dit d'où viennent ses données. C'est exactement là qu'on se place.

**Ne commence pas par écrire du code.** Commence par la section 3 : le problème
de ce projet est un problème de sourcing de données, pas d'ingénierie.

---

## 1. Qui je suis, et le standard attendu

Elodias ADIMOU, développeur web fullstack en full remote, basé à Cotonou.
Le projet précédent qu'on a livré ensemble est **Récade** (`~/Documents/Projets/Elodias/recade`,
publié sur `@elodias/recade`, site sur `recade.sabar.app`). **Va le lire avant
de proposer quoi que ce soit** : il définit le niveau attendu, et on va en
réutiliser des morceaux.

Ce que Récade établit et qu'on reconduit ici :

| Élément | Où regarder |
|---|---|
| Générateur de site statique piloté par config | `recade/site/config.mjs`, `layout.mjs`, `scripts/build-site.mjs` |
| Tests du site (pas de `<script`, un seul `h1`, alt obligatoire, pas de tiret cadratin) | `recade/site/site.test.mjs` |
| Docs Markdown → HTML | `recade/scripts/build-docs.mjs`, `recade/docs/*.md` |
| Déploiement VPS Docker + Traefik + GitHub Actions | `recade/Dockerfile`, `docker-compose.prod.yml`, `.github/workflows/` |
| Conventions de code et de contribution | `recade/AGENTS.md`, `recade/docs/01-demarrage.md` |

**Règles de travail, non négociables :**

- **Français partout** : code commentaires, docs, commits, site. Les
  identifiants de code restent en anglais si c'est plus lisible, mais les noms
  de domaine métier sont en français (`commune`, `arrondissement`, `departement`).
- **Commits conventionnels en français** : `feat(data):`, `fix(core):`, `docs:`, `chore:`.
- **Pas de tiret cadratin** dans les textes publiés. C'est testé sur Récade,
  ce sera testé ici.
- **Identité Git — l'étape à ne jamais sauter.** Ce dépôt est personnel. La
  config Git globale de cette machine porte une identité professionnelle
  (l'identité professionnelle) qui **ne doit jamais** apparaître dans un dépôt perso.
  Avant le premier commit :
  ```bash
  git config --local user.name  "Elodias (Perso)"
  git config --local user.email "olouwagnon@gmail.com"
  git var GIT_AUTHOR_IDENT     # doit afficher Elodias (Perso)
  ```
  Le remote perso passe par l'alias SSH `github-perso` :
  `git@github-perso:Elodias2001/Takienta.git`
- **Tu ne pousses pas et tu ne déploies pas sans que je le demande.**
  Aucun secret dans le diff. Les secrets vivent dans `local-secrets/`, gitignoré.

---

## 2. Le produit

Une bibliothèque, pas un service. Tu réponds à ces questions, hors ligne, en
quelques microsecondes :

- Quels sont les 12 départements ? Les 77 communes ? Les 545 arrondissements ?
- À quelle commune appartient l'arrondissement de Sègbèya ? À quel département ?
  À quel pôle ?
- Donne-moi la liste des communes du Borgou, triée.
- L'utilisateur a tapé « abomey calavi » sans accent ni tiret : trouve.
- Remplis-moi un `<select>` en cascade département → commune → arrondissement.

**Cas d'usage réels** qui justifient l'existence du paquet : formulaires
d'inscription, adresses de livraison, ciblage de campagnes, tableaux de bord
sectoriels, applications administratives, jeux de données de recherche. Tout
développeur béninois recode ce tableau à la main, mal, et avec des données de
2016.

**Périmètre v1 : le paquet seulement.** Pas d'API HTTP. Les données sont
statiques et tiennent en quelques centaines de kilooctets : un serveur pour ça
serait une dette, pas une fonctionnalité. Si une API HTTP devient nécessaire,
ce sera du JSON statique servi par le nginx du VPS, en v2. **Défends ce choix
ou conteste-le, mais ne l'élargis pas en silence.**

---

## 3. L'état des données — lis ceci avant tout

C'est la partie difficile du projet. Prends-la au sérieux.

### Ce qui est établi

| Niveau | Nombre | Statut |
|---|---|---|
| Départements | 12 | Stable depuis 1999, très sûr |
| Communes | 77 | Stable, très sûr |
| Arrondissements | 545 | Sûr, mais c'est le niveau où les sources divergent |
| Villages / quartiers de ville | ~5 300 | **Hors périmètre v1** |
| **Pôles de développement** | **6** | **Nouveau, présenté le 23 septembre 2026** |

### Les six pôles — le vrai différenciateur, et le vrai risque

Les pôles ont été présentés au **Palais de la Marina le 23 septembre 2026**,
soit quatre jours avant l'écriture de ce prompt. **Aucun paquet existant ne
peut les contenir.** C'est notre fenêtre.

Composition relevée dans la presse :

La liste nominative complète a été obtenue et **recoupée le 27/09/2026** :
elle est dans `poles-2026-09-23.json`, à côté de ce prompt. 77 communes, zéro
doublon, zéro orphelin dans les deux sens face aux 12 départements.

**La règle de composition, et c'est elle qui compte :** chaque pôle est une
réunion de départements **entiers**, sauf le prélèvement qui forme le
Grand-Nokoué.

| Pôle | Chef-lieu | Composition | Communes |
|---|---|---|---|
| Nord-Ouest | Natitingou | Atacora (9/9) + Donga (4/4) | 13 |
| Nord-Est | Parakou | Alibori (6/6) + Borgou (8/8) | 14 |
| Centre | Abomey | Zou (9/9) + Collines (6/6) | 15 |
| Sud-Ouest | Lokossa | Mono (6/6) + Couffo (6/6) + Atlantique (6/8) | 18 |
| Sud-Est | Pobè | Plateau (5/5) + Ouémé (7/9) | 12 |
| Grand-Nokoué | — | Littoral (1/1) + Atlantique (2/8) + Ouémé (2/9) | 5 |

Les seules coupes dans un département sont Atlantique (Abomey-Calavi et Ouidah
partent au Grand-Nokoué) et Ouémé (Porto-Novo et Sèmè-Kpodji de même).

**Cette règle est un test, pas une remarque.** Elle rend le total déterministe :
un pôle dont les départements sont entiers ne peut pas avoir un autre compte que
la somme de leurs communes. C'est ce qui a permis de détecter qu'une première
source de presse annonçait 14 communes pour le Centre au lieu de 15, et donc 76
au total. Écris ce contrôle dans la suite de tests avant d'écrire le paquet.

**Conventions de tri relevées sur la liste officielle**, à modéliser dès le
schéma : le chef-lieu est placé en tête, le reste est alphabétique, « Les
Aguégués » se range à **A** et non à L, et « Za-Kpota » précède « Zagnanado »
(le trait d'union trie avant les lettres). Il faut donc un champ de tri distinct
du nom d'affichage.

**Attention aux sources océrisées.** La liste reçue venait d'une image et
confondait O et Q : « Quaké » pour **Ouaké**, « Adja-Quèrè » pour
**Adja-Ouèrè**, plus « Klouékanmė » pour **Klouékanmè** et « So-Ava » pour
**Sô-Ava**. Tout nom entrant doit passer un contrôle contre une liste de
référence avant d'entrer dans les données.

**Règle absolue : un article de presse n'est pas une source.** Il peut te dire
où chercher, jamais ce qu'il faut écrire dans les données. La source d'un
découpage administratif est un **décret, une loi ou une publication de l'INStaD**.
Tant que tu n'as pas le texte, le champ `source` du pôle vaut
`"presse, non confirmé par un texte officiel"` et le niveau est marqué
`provisoire: true`. C'est plus honnête et c'est plus vendeur qu'une fausse
certitude : c'est exactement la logique de Récade, qui laisse réfuter au lieu
d'affirmer.

La réforme se déploie encore (délégués généraux attendus à partir du T4 2026).
**Le calque « pôles » est donc versionné séparément des autres niveaux, et daté.**

### Les sources, et leur état réel au 27 septembre 2026

J'ai testé les portails. Voilà ce qui répond :

| Source | État constaté | Utilité |
|---|---|---|
| `ign.bj` (IGN-Bénin, base spatiale) | **HTTP 200** | La plus prometteuse, notamment `ign.bj/webmap/village.php` |
| `instad.bj` (Institut national de la statistique) | **HTTP 503** | Autorité de référence, mais indisponible |
| `rgph5.instad.bj` (recensement, cahiers des villages et quartiers) | **HTTP 403** | Contient le référentiel complet, accès bloqué |
| `data.gouv.bj` | **injoignable** | — |

Le « Cahier des villages et quartiers de ville » du RGPH, publié par département,
est le document de référence. **Les URL que renvoient les moteurs de recherche
pour ces PDF sont mortes** : j'ai testé le motif
`rgph5.instad.bj/wp-content/uploads/2023/03/<DEPARTEMENT>.pdf` sur quatre
départements, les quatre renvoient 404 avec une page d'erreur de 236 octets.
**Ne perds pas de temps à deviner des URL. Trouve les vraies, ou trouve une
autre voie.**

**Conséquence d'architecture, non négociable** : les portails officiels tombent.
Un paquet dont la chaîne de construction dépend d'un site en 503 est un paquet
qui ne se reconstruit pas. Donc :

1. **Les sources brutes sont archivées dans le dépôt** (`data/sources/`), avec
   pour chacune : le fichier tel qu'obtenu, son URL d'origine, sa date de
   récupération et son **empreinte SHA-256**.
2. **Le pipeline se rejoue hors ligne** depuis ces archives. Zéro appel réseau
   dans le build.
3. Un script séparé, lancé à la main, va rechercher les sources et signale les
   empreintes qui ont changé. Il ne tourne jamais dans la CI de build.

### Le différenciateur : la provenance par enregistrement

**Chaque enregistrement porte sa source.** Pas une ligne dans le README : un
champ dans la donnée.

```json
{
  "id": "BJ-AL-KAN",
  "nom": "Kandi",
  "departement": "BJ-AL",
  "type": "commune",
  "source": "rgph4-cahier-alibori",
  "releveLe": "2026-09-27",
  "confiance": "officielle"
}
```

Avec un registre `data/sources.json` qui décrit chaque identifiant de source :
intitulé du document, éditeur, date de publication, URL, empreinte du fichier
archivé. `confiance` prend `officielle` | `derivee` | `provisoire`.

C'est la chose que ni `location_data_bj` ni `decoupage-territorial-benin` ne
font, et c'est ce qui rend le paquet utilisable dans un contexte administratif
ou de recherche, là où « d'où sort ce chiffre ? » est une question qu'on pose
vraiment. **C'est le même geste que Récade : ne pas demander qu'on te croie.**

---

## 4. La concurrence, mesurée

| Paquet | Version | Dernière publication | Licence | Poids | Téléchargements/mois |
|---|---|---|---|---|---|
| `location_data_bj` (Dahkenangnon) | 2.1.0 | 11/05/2026 | Apache-2.0 | **4 727 Ko** | ~61 |
| `decoupage-territorial-benin` (Goldy98) | 1.1.0 | 14/02/2023 | MIT | 641 Ko | ~120 |

Marché combiné : **~180 téléchargements par mois.** Petit. Assume-le : ce projet
est une pièce de portfolio et un bien commun, pas une source de revenu. Ça ne
change rien au niveau d'exigence, ça change ce qu'on ne fait pas (pas de
monétisation, pas de compte, pas de backend).

Nos trois angles d'attaque, dans l'ordre :

1. **Les pôles.** Aucun des deux ne les a. Ils datent de quatre jours.
2. **La provenance.** Aucun des deux ne dit d'où viennent ses chiffres.
3. **Le poids.** 4,7 Mo pour une liste de 545 lignes est indéfendable. On vise
   **moins de 150 Ko** pour l'import par défaut, avec des points d'entrée par
   niveau pour ne charger que ce qu'on utilise.

Lis leurs dépôts avant de commencer. Pas pour copier : pour savoir précisément
ce qu'on fait mieux, et pour pouvoir l'écrire dans le README sans mentir.
**Et si l'un des deux a une donnée meilleure que la nôtre, on la crédite.**

---

## 5. Les invariants du produit

À écrire dans le document technique. Une contribution qui en viole un est
refusée, quel que soit son intérêt.

1. **Zéro dépendance d'exécution.** Ni sur npm, ni sur PyPI.
2. **Zéro appel réseau.** À l'exécution comme à la construction.
3. **Aucune donnée sans source.** Un enregistrement sans `source` ne compile pas.
4. **Les identifiants sont stables à vie.** Une commune renommée garde son
   identifiant et gagne un alias. Un identifiant n'est jamais réattribué.
5. **Une seule source de vérité pour les données**, dans `data/`. Les paquets
   JS et Python sont tous les deux **générés** depuis elle. Aucune donnée n'est
   saisie deux fois.

---

## 6. Stack

À challenger, pas à appliquer aveuglément. Justifie chaque écart.

| Couche | Proposition |
|---|---|
| Monorepo | pnpm workspaces, comme Récade |
| Source de vérité | JSON dans `data/`, validé par un schéma |
| Validation | `zod` (outillage seulement, jamais expédié au runtime) |
| Paquet JS | TypeScript strict, `tsup`, **ESM + CJS**, types générés |
| Points d'entrée | `benin-geo`, `benin-geo/departements`, `benin-geo/communes`, `benin-geo/arrondissements`, `benin-geo/poles` |
| Paquet Python | `hatchling`, typé (`py.typed`), Python ≥ 3.9 |
| Génération | un script Node unique `scripts/build-data.mjs` qui écrit les deux paquets |
| Tests JS | Vitest |
| Tests Python | pytest |
| Tests de données | les mêmes assertions rejouées dans les deux langages |
| Site | même chaîne que Récade : `config.mjs` + `layout.mjs` + `build-site.mjs` |
| CI | GitHub Actions : typecheck, tests JS, tests Python, build, vérification du poids |

**Le contrôle de poids est un test, pas une bonne intention** : la CI échoue si
l'import par défaut dépasse le seuil.

### Esquisse d'API — à critiquer

```ts
import { departements, communes, arrondissements, poles } from "benin-geo";
import { communesDe, chercher, parId, hierarchie } from "benin-geo";

communesDe("BJ-BO");             // les communes du Borgou
parId("BJ-AL-KAN");              // un enregistrement, n'importe quel niveau
chercher("abomey calavi");       // insensible aux accents, à la casse, aux tirets
hierarchie("BJ-AL-KAN-SON");     // pôle → département → commune → arrondissement
```

`chercher` normalise en NFD et retire les diacritiques combinantes des deux
côtés. Les Béninois tapent « sèmè », « seme », « Sèmè-Kpodji » et « seme podji ».
**Les trois premiers doivent marcher. Le quatrième mérite une décision explicite
et documentée.**

Côté Python, la même chose en `snake_case`, mêmes identifiants, mêmes résultats.
**Un test croisé compare les sorties des deux paquets** et échoue si elles
divergent.

### Les identifiants

Cherche d'abord si l'INStaD publie une codification officielle des communes.
**Si elle existe, on l'utilise, point.** Sinon, tu conçois un schéma
déterministe, tu le documentes, et il devient immuable. La proposition
`BJ-<DEP>-<COM>-<ARR>` ci-dessus est un point de départ, pas une décision.
Ce choix est irréversible : prends-le lentement.

---

## 7. Le nom

**Le projet s'appelle Takienta. Le paquet s'appelle `benin-geo`.**

La *takienta* est la maison-tour en banco des Batammariba, dans l'Atacora. Sa
logique est l'emboîtement : le bétail au rez-de-chaussée, la vie sur la terrasse,
les greniers en tourelles. C'est littéralement le modèle de données du projet,
pôle contient département contient commune contient arrondissement contient
quartier.

**Le mot compte.** *Takienta* est le terme des Batammariba eux-mêmes, en
ditammari. Le français dit « tata somba », mais *somba* est un exonyme de
l'époque coloniale que les intéressés n'emploient pas. Un projet qui se réclame
d'une culture ne la nomme pas avec le mot des autres. Cette distinction est à
expliquer dans le README, elle fait partie du propos.

**À vérifier avant publication**, selon la règle du projet : confirmer sur une
source sérieuse que *takienta* est bien la forme correcte en ditammari, et son
pluriel. Pas d'affirmation ethnographique non sourcée dans ce README.

### Disponibilité relevée le 28 septembre 2026

| Nom | npm | PyPI |
|---|---|---|
| `takienta` | libre | libre |
| `benin-geo` | libre | libre |

Également libres sur npm : `benin-locations`, `benin-communes`, `benin-data`,
`bj-geo`, `benin-administrative`, `benin-arrondissements`.

**Attention, vécu.** Le paquet `benin` existe, et npm refuse les noms jugés trop
proches d'un paquet existant. Récade s'est fait refuser `recade` pour
ressemblance avec `recast` et `read`, ce qui a coûté une republication complète
et 29 corrections dans la documentation.

**Donc : vérifie par un `npm publish --dry-run` avant d'écrire le nom dans le
moindre fichier.** Repli prévu : `@elodias/benin-geo` avec
`publishConfig.access: "public"`, un paquet scopé échappant au filtre de
ressemblance. Sur PyPI, `benin-geo` s'importe en `benin_geo`.

Réserve `takienta` sur les deux registres même sans l'utiliser tout de suite :
il pointera vers `benin-geo`, et personne ne te le prendra.

## 8. Direction artistique — la takienta

Récade puise dans **Abomey** : le sud, la cour royale, le métal fondu, le laiton
sur noir de forge. Takienta puise dans l'**Atacora** : le nord, l'architecture
vernaculaire, la terre crue. **C'est délibéré.** Trois de mes projets portent
déjà une référence au royaume du Dahomey ; le Bénin ne s'y réduit pas, et un
paquet qui prétend représenter tout le territoire ne peut pas être branché sur
un seul de ses pôles culturels.

### Le principe : l'emboîtement

La **takienta** est la maison-forteresse en banco des Batammariba, dans
l'Atacora, prolongée au Togo par le paysage **Koutammakou** inscrit à l'UNESCO.
C'est le nom que lui donnent ceux qui la construisent ; « tata somba » est la
désignation venue de l'extérieur.
Sa logique est l'emboîtement : le rez-de-chaussée abrite le bétail, la terrasse
porte la vie quotidienne, les greniers s'élèvent en tourelles coniques. Une
enveloppe contient la suivante.

C'est littéralement notre modèle de données : **pôle contient département
contient commune contient arrondissement.** Le logo est cette imbrication.

**Vérifie ces affirmations culturelles avant de les publier.** Les mêmes règles
que pour les données : pas d'approximation ethnographique dans un README qui
porte mon nom. Si un point n'est pas confirmé par une source sérieuse, il ne
s'écrit pas.

### Palette proposée

| Rôle | Référence | Suggestion |
|---|---|---|
| Fond | banco, terre crue | `#E8DCC8` |
| Encre | ombre des murs épais | `#2A211A` |
| Accent | latérite de l'Atacora | `#B5532A` |
| Secondaire | chaume des greniers | `#D9A441` |
| Signal | plaine cultivée | `#5C7A4A` |

Contraste AA obligatoire sur tous les couples texte/fond. **Teste-le, ne
l'estime pas.**

### Formes

Cylindres et cônes. Murs épais : des bordures lourdes, jamais des filets de
1 px. Ouvertures rares et petites. Angles adoucis, pas arrondis.
**Aucune image bitmap sur le site** : Récade tient sa promesse de légèreté, on
tient la même. Tout en SVG inline.

---

## 9. Assets à produire

- Emblème SVG, principe d'emboîtement, lisible à 24 px comme à 400 px.
- Jeu de favicons + `apple-touch-icon` + `og:image` (SVG converti, une seule fois).
- Jetons de palette en variables CSS, partagés entre le site et le README.
- **Une carte SVG du Bénin par départements**, comme illustration du site et
  comme asset réutilisable.

### Piège de licence sur la carte — lis avant de coder

Les contours administratifs ne sont pas libres par défaut :

- **GADM** interdit l'usage commercial. Inutilisable ici.
- **geoBoundaries** est en CC-BY. Utilisable, attribution obligatoire.
- **OpenStreetMap** est en ODbL. Utilisable, mais l'ODbL est contaminante pour
  une base dérivée : incompatible avec une promesse MIT si on expédie la
  géométrie dans le paquet.

**Décision recommandée : le paquet v1 ne contient aucune géométrie.** Des noms,
des identifiants, une hiérarchie, une provenance : ça reste MIT proprement. La
carte SVG est un **asset du site**, avec sa propre attribution, pas un fichier
du paquet. Si la géométrie est demandée plus tard, elle part dans un paquet
séparé `benin-geo-geometrie` sous sa propre licence.

Si tu proposes autre chose, **argumente sur la licence, pas sur la commodité.**

---

## 10. Site de documentation

Réutilise la chaîne de Récade sans la réinventer : `config.mjs` comme source
unique des coordonnées, `layout.mjs` pour la coquille, `build-site.mjs` pour la
génération, `site.test.mjs` adapté.

Pages : accueil, démarrage, référence de l'API, **provenance des données**
(page de premier rang, c'est notre argument), à propos, mentions légales,
confidentialité.

Deux détails coûteux appris sur Récade :

- **nginx** : `add_header` dans un bloc `location` **annule** les en-têtes
  hérités. Il faut les répéter dans chaque bloc. Récade a servi zéro en-tête de
  sécurité pendant un temps à cause de ça.
- **Le filtre de copie des fichiers statiques doit exclure par nature**
  (`.mjs`, `.ts`, `.map`), pas par liste nommée. Un `site.test.mjs` s'est
  retrouvé servi en production.

Sous-domaine visé : `takienta.sabar.app`, même VPS, même Traefik, même réseau
`gcw-public`. **Ne déploie rien sans me le demander.**

---

## 11. Tests

Les tests de données comptent plus que les tests de code.

- Les comptes tiennent : 12 départements, 77 communes, 545 arrondissements.
  **Si un compte ne tombe pas juste, le test échoue et on cherche pourquoi.
  On n'ajuste jamais la valeur attendue pour faire passer le test.**
- Chaque commune référence un département existant ; chaque arrondissement une
  commune existante. Aucun orphelin.
- Aucun identifiant en double.
- **Aucun enregistrement sans `source` valide** dans `sources.json`.
- Un instantané des identifiants, versionné : toute disparition ou tout
  renumérotage fait échouer la CI. C'est le garde-fou de l'invariant 4.
- `chercher` retrouve chaque nom depuis sa forme sans accent et sans tiret.
- Le paquet JS et le paquet Python renvoient les mêmes résultats sur le même
  jeu de requêtes.
- Poids de l'import par défaut sous le seuil.
- Site : pas de `<script`, un seul `h1` par page, `alt` sur toute image,
  canonique présent, aucun tiret cadratin.

---

## 12. Anti-objectifs

À refuser, même si c'est tentant :

- Une base de données, un backend, un compte utilisateur.
- De la télémétrie.
- Les villages et quartiers de ville en v1 (~5 300 entrées : c'est la v2, et
  c'est ce qui ferait exploser le poids).
- La géométrie dans le paquet principal (voir la licence, section 9).
- Des données codes postaux ou téléphoniques : hors sujet, et mal sourçables.
- Un gros paquet unique qui charge tout. C'est le défaut du concurrent à 4,7 Mo.
- **Compléter une donnée manquante au jugé.** Un trou documenté vaut mieux
  qu'une valeur inventée. C'est le cœur du projet.

---

## 13. Ordre de travail attendu

Fais-le dans cet ordre, et **arrête-toi au bout de l'étape 1 pour me montrer ce
que tu as trouvé.** Si les sources ne tiennent pas, tout le reste est du vent.

1. **Sourcing.** Trouve les vraies URL INStaD/IGN. Récupère et archive dans
   `data/sources/` avec empreintes. Résous l'écart 76/77 sur les pôles, ou
   documente-le. **Point d'arrêt : tu me montres l'état des sources avant
   d'écrire une ligne de code.**
2. **Schéma et identifiants.** Le contrat de données, le registre de sources, la
   décision sur la codification. Immuable après ça.
3. **Pipeline.** Sources archivées → `data/*.json` canoniques, validées.
4. **Paquet JS.** API, types, points d'entrée par niveau, tests, contrôle de poids.
5. **Paquet Python.** Généré depuis les mêmes données, tests croisés.
6. **Identité visuelle.** Emblème, palette, carte.
7. **Site et documentation.** Avec la page provenance en premier rang.
8. **Publication.** `--dry-run` d'abord, sur les deux registres. Sur demande.
9. **Déploiement.** Sur demande.

---

## 14. Comment je veux que tu travailles

- **Contredis-moi quand j'ai tort.** Ce prompt contient des propositions, pas
  des ordres : la palette, le schéma d'identifiants, le nom, la stack. Si tu as
  mieux, dis-le et argumente.
- **Ne devine pas une donnée.** Sur ce projet précisément, une valeur inventée
  qui passe les tests est pire qu'une erreur qui les casse.
- **Explique-moi ce que tu fais quand c'est nouveau pour moi**, notamment côté
  Python et packaging PyPI, où j'ai moins d'habitudes.
- **Vérifie avant d'affirmer.** Si tu me dis qu'une commande marche, c'est que
  tu l'as lancée.
