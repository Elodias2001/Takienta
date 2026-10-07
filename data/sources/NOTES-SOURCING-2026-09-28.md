# Sourcing — état constaté le 28/09/2026

Ce fichier documente la provenance des archives présentes dans ce dossier.
Il ne remplace pas le futur `data/sources.json` (étape 2), c'est une note de
travail pour l'étape 1 (sourcing), point d'arrêt du prompt de cadrage.

## Fichiers archivés

### `loi-97-028.pdf`

- URL d'origine : `https://sgg.gouv.bj/doc/loi-97-028/download`
- Page de renvoi : `https://sgg.gouv.bj/doc/loi-97-028/`
- Éditeur : Secrétariat général du Gouvernement du Bénin (portail officiel)
- Récupéré le : 2026-09-28
- SHA-256 : `7380362e3f8abe679f26bbeda9bee193ceceb9f5a7617ccff7bb3919ebc520f1`
- Type : PDF, 15 pages, 630 213 octets
- Contenu vérifié : Loi n°97-028 du 15 janvier 1999 portant organisation de
  l'administration territoriale de la République du Bénin. L'article 6
  confirme littéralement le découpage en douze départements et les nomme
  (Alibori, Atacora, Atlantique, Borgou, Collines, Couffo, Donga, Littoral,
  Mono, Ouémé, Plateau, Zou). C'est un texte de loi authentique, pas un
  article de presse.
- Limite : ce texte fixe les départements. Il ne contient pas, dans les pages
  consultées, la liste nominative des 545 arrondissements (ce niveau est fixé
  par des textes réglementaires ultérieurs, non retrouvés à ce jour).

### `decoupage-territorial-benin_goldy98-1.1.0_reference-tiers.json`

- URL d'origine : `https://cdn.jsdelivr.net/npm/decoupage-territorial-benin@1.1.0/decoupage_territorial_benin.json`
- Éditeur : paquet npm `decoupage-territorial-benin` (Goldy98 / SAGBO Aimé),
  données reprises du dépôt `leplutonien/decoupage_territorial_benin`.
- Récupéré le : 2026-09-28
- SHA-256 : `e65cf9e8719220700a04c578889c5adf9998f72bbd05c54ac7c0dde43414da36`
- **Statut : source tierce, non officielle.** Archivée uniquement à titre de
  comparaison (le cadrage demande de créditer si une donnée concurrente est
  meilleure sur un point précis). Aucune source primaire n'est citée dans le
  dépôt d'origine (README réduit à une ligne, licence GPL-3.0 sur le dépôt
  amont, MIT sur le paquet npm).
- Constat notable : ce fichier compte **546 arrondissements**, pas 545. Écart
  non résolu, à traiter avant de figer le test d'invariant "545" (voir
  section "Écarts non résolus" ci-dessous).

## URL testées le 28/09/2026 (réponse HTTP réelle, `curl -I -L`, UA desktop)

| URL | Résultat observé |
|---|---|
| `https://ign.bj` | 200 |
| `https://ign.bj/webmap/village.php` | 200 (page HTML de carte, 8 472 octets, Leaflet + couches ; pas d'export de données brut identifié depuis la page seule) |
| `https://instad.bj` | 503, retesté 3 fois à quelques secondes d'intervalle, stable |
| `https://instad.bj/images/docs/insae-statistiques/.../Plaquette-Littoral-final.pdf` | 503 (le site entier est indisponible, pas seulement la racine) |
| `https://rgph5.instad.bj` | 403, retesté 3 fois, stable |
| `https://rgph5.instad.bj/wp-content/uploads/2023/03/LITTORAL.pdf` | **404**, alors que cette URL exacte est indexée par un moteur de recherche (donc probablement valide dans le passé, mais le fichier n'existe plus à ce chemin aujourd'hui) |
| `https://data.gouv.bj` | Échec DNS (`Could not resolve host`), confirmé aussi en `http://` et avec `www.` — pire que "injoignable" au sens d'un serveur qui ne répond pas : le nom de domaine n'existe pas, ou plus |
| `https://sgg.gouv.bj/doc/loi-97-028/` | 200, texte de loi réel obtenu (voir ci-dessus) |

Web Archive (`web.archive.org/cdx`) interrogé pour vérifier si une copie du
PDF `rgph5.instad.bj/wp-content/uploads/2023/03/*.pdf` existe dans le passé :
seules des images de thème (`bg-footer.jpg`, `team-*.jpg`) du dossier
`uploads/2015/12/` sont archivées. **Aucune trace archivée d'un PDF de cahier
départemental sous `uploads/2023/03/`.** Soit ces PDF n'ont jamais été
crawlés par Internet Archive, soit ils n'ont jamais été publiés à ce chemin.

## Écarts non résolus

1. **545 vs 546 arrondissements.** Le cadrage tient 545 pour "sûr". La seule
   source concrète trouvée à ce jour (le JSON du concurrent, lui-même non
   sourcé officiellement) en compte 546. Aucun texte officiel consulté ne
   donne un total explicite d'arrondissements. **Ne pas figer le test
   d'invariant sur 545 sans avoir résolu cet écart** : soit en retrouvant un
   texte qui tranche, soit en recomptant nommément les deux listes pour
   trouver où elles divergent.
2. **Liste nominative des 545 (ou 546) arrondissements.** Aucun texte
   officiel (décret, loi, publication INStaD) listant les arrondissements
   n'a été localisé et vérifié. Le "Cahier des villages et quartiers de
   ville" du RGPH, cité dans le cadrage comme document de référence, reste
   inaccessible (403 sur le sous-domaine, chemins de PDF connus en 404).
3. **Codification officielle des communes/départements par l'INStaD.**
   Aucune publication INStaD de ce type n'a été localisée. Voir recommandation
   dans le rapport principal.
4. **Texte officiel sur les six pôles de développement.** Aucun décret ni
   publication de compte-rendu du Conseil des ministres ne mentionne les
   pôles à la date de cette recherche (comptes rendus consultés jusqu'à
   juin 2026, soit avant l'annonce du 23/09/2026 ; aucun compte rendu de
   Conseil des ministres postérieur au 23/09/2026 trouvé mentionnant les
   pôles). Seule la presse en parle. Statut `provisoire: true` dans
   `poles-2026-09-23.json` confirmé justifié.

## Mise à jour du 2026-10-07 : le texte officiel des arrondissements existe

La loi n°2013-05 du 27 mai 2013 (`loi-2013-05.pdf`, 193 pages, scan) annexe à son article 14 la
liste des arrondissements avec leur commune et les villages ou quartiers qui les composent.
Copie identique octet pour octet au téléchargement sur `sgg.gouv.bj/doc/loi-2013-05/download`
(SHA-256 `4a894836aaa60045e39711faaadb55c8555874ad0258950b416392ac75c2eb00`).

Lecture : le scan est océrisé avec des erreurs de chiffres (Kaobagou lu « 08 » au lieu de « 03 »).
Les libellés et nombres viennent d'une transcription numérique de l'annexe (document tiers, non
archivé), recoupée avec le scan.

Résultat : **12 départements, 76 communes avec en-tête plus Cotonou (77), 546 arrondissements,
5 290 villages et quartiers**, soit le total du titre de la loi. Chaque commune se referme sur son
nombre annoncé. Deux écarts sont dans le texte de la loi lui-même : le département de l'Atacora
annonce 517 alors que ses communes totalisent 519, et l'Atlantique n'a pas de nombre imprimé
(le total général 5 290 tient malgré tout).

Recoupement avec le scan : 12 départements sur 12 concordants, 64 communes sur 68 lisibles
concordantes (les 4 autres ont un nom abîmé par l'OCR), aucun écart de nombre, Kandi et Kaobagou
vérifiés sur l'image.

Corrections de ce qui précède :
- 546 n'est plus une hypothèse convergente (livre de 2013, paquet tiers, recomptage) : c'est
  le décompte de l'annexe d'une loi. Le livre d'Avocevou reprend très probablement ce même total.
- Kandi 1, 2 et 3, Djougou I, II et III sont des arrondissements légaux (la loi les nomme ainsi).
  En revanche des découpages en « ZONE 1 » et « ZONE 2 » ne figurent pas dans la loi : ils relèvent
  d'autres usages et ne sont pas le découpage légal.

Limite : ce texte décrit l'état de 2013. Une loi ultérieure a pu modifier des arrondissements
(article 16) ; ce n'a pas été recherché.
