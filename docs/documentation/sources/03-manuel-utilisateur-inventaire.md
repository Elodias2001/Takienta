# Inventaire pour 03 · Manuel utilisateur : Takienta

Base relevée : dépôt `Takienta`, branche `publication` (publiée comme `main`), commit `15748a8`, 08/10/2026. Relevé en lecture seule le 26/10/2026, sur le site construit localement (`dist-site/`, mêmes pages que la production au 09/10/2026).

## 0. Ce qu'il y a à documenter

Takienta n'a **pas de back-office, pas de compte, pas de rôle, pas de formulaire** (page À propos : « ni serveur, ni compte, ni télémétrie »). L'interface existante est le **site public** `https://takienta.sabar.app`, plus l'**usage du paquet** `benin-geo` par des développeurs. Deux publics possibles :
- les visiteurs du site (consulter, comparer, vérifier une source) ;
- les développeurs qui installent le paquet (voir `docs/01..05` du site, déjà écrites).

Format candidat : **guide de référence** (sans capture, un chapitre par page du site). Décision à confirmer avec Elodias (questions).

## 1. Adresses

| Environnement | Adresse | Source |
|---|---|---|
| Production | `https://takienta.sabar.app` | `site/config.mjs` |
| Dépôt | `https://github.com/Elodias2001/Takienta` | idem |
| npm | `https://www.npmjs.com/package/benin-geo` | idem (`registres`) |
| PyPI | `https://pypi.org/project/benin-geo/` | idem |
| Local | image Docker, port 8080 (`docker compose port takienta-site 8080`) | `docker-compose.yml` |

Aucun environnement de recette n'est relevé.

## 2. Navigation (en-tête, commune à toutes les pages)

Marque « Takienta » (retour à l'accueil), puis **Provenance**, **Carte**, **Comparer**, **Documentation**, **GitHub**, **npm**, **PyPI**. Pied de page : Accueil, Provenance, Carte, Comparer, Documentation, À propos, Mentions légales, Confidentialité, GitHub, crédit « Conçu & développé par Elodias ADIMOU ». Lien « Aller au contenu » en tête de page. Le thème clair ou sombre suit le navigateur (`prefers-color-scheme`). Le mouvement est coupé si le système demande moins d'animations.

## 3. Pages et ce qu'on y fait

| Page | Adresse | Titre (`h1`) | Contenu relevé |
|---|---|---|---|
| Accueil | `/` | La structure administrative du Bénin, avec la source de chaque enregistrement. | boutons **Voir la provenance** et **Démarrer** ; carte des 12 départements (survol ou Tab : fiche du département : communes, arrondissements, pôles, identifiant) ; chiffres (12, 77, 546, 6) ; schéma de l'emboîtement et anatomie d'un identifiant ; installation (`npm install benin-geo`, `pip install benin-geo`) ; aperçu de code ; ce qu'il ne fait pas |
| Provenance | `/provenance` | D'où vient chaque donnée | tour de quatre assises qui se construit au défilement ; trois niveaux de confiance ; contenu de chaque niveau ; un enregistrement en entier ; les 7 sources ; ce que nous ne savons pas ; comment vérifier soi-même (clone, `shasum`, `pytest`) |
| Carte | `/carte` | Les 77 communes, rangées par pôle | survol ou Tab d'une commune : département, arrondissements, pôle (badge provisoire), identifiant ; légende des 6 pôles : survol ou Tab isole le pôle (nombre de communes, chef-lieu) ; liens vers Comparer et Provenance ; attribution des contours |
| Comparer | `/comparer` | Deux communes, côte à côte | deux listes de choix (Commune A, Commune B), à la souris ou au clavier (flèches) ; mini-carte où les deux communes s'allument ; tableau : commune, département, pôle, nombre d'arrondissements, leurs noms, autres graphies, source, confiance, date de relevé, identifiant. Par défaut : Natitingou et Cotonou |
| Documentation | `/docs/` | Documentation | index et 5 fiches : Démarrer, Référence de l'API, Modèle de données, Identifiants, Contribuer |
| À propos | `/a-propos` | Elodias ADIMOU conçoit et développe Takienta | le projet, ce qui le distingue, le nom, contact |
| Mentions légales | `/mentions-legales` | Mentions légales | éditeur, directeur de la publication, hébergement, propriété intellectuelle, responsabilité, données personnelles, contact |
| Confidentialité | `/confidentialite` | Politique de confidentialité | ce qui est enregistré (journaux du serveur), ce qui n'est pas fait, paquets sans transmission, droits, mineurs, sécurité, modification |

Mots de l'écran à reprendre tels quels : **Voir la provenance**, **Démarrer**, **Commune A**, **Commune B**, **Survolez la carte**, **provisoire**, **officielle**, **dérivée**.

## 4. Vocabulaire à définir (chapitre « se repérer »)

Département, commune, arrondissement, pôle de développement, identifiant (`BJ-AL-KAN-04`), niveau de confiance (`officielle`, `dérivée`, `provisoire`), provenance, graphie (`attestée`, `déduite du libellé`), alias, calque des pôles.

Sources de chaque définition : `docs/03-modele-de-donnees.md`, `docs/04-identifiants.md`, page Provenance.

## 5. Parcours à décrire

1. Trouver une commune et voir à quel pôle elle appartient (accueil ou carte).
2. Comparer deux communes.
3. Savoir d'où vient une donnée et la vérifier (Provenance, `shasum`).
4. Installer le paquet et faire un premier appel (`docs/01-demarrage.md`).
5. Comprendre un identifiant.
6. Signaler une erreur ou contacter l'éditrice : adresse affichée sur la page À propos (`nounagnonadimou@gmail.com`) ; le dépôt a une page d'issues (`bugs.url` du paquet).

## 6. Rôles et droits

Aucun. Un seul type de visiteur, anonyme. Pas de connexion.

## 7. Captures

Format guide de référence : aucune capture. Si un manuel complet était demandé : captures à prendre par Elodias (liste à établir : accueil, carte avec une commune survolée, légende avec un pôle isolé, comparer avec deux communes, provenance au niveau de la tour). Rien n'est inventé.

## 8. Que faire si

À établir à partir de situations réelles ; relevé dans le dépôt : une commune introuvable parce que la recherche n'est ni floue ni phonétique (`docs/02-reference-api.md`) ; un arrondissement du niveau provisoire ; un pôle pour un département coupé (`hierarchie` rend `null` pour un département).

## 9. Assistance

Pas de canal écrit hors l'adresse e-mail de la page À propos et les issues GitHub. Délai de réponse : non déterminé.

## 10. Points à demander

Voir l'annexe du PDF correspondant.
