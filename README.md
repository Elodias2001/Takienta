# Takienta

La structure administrative du Bénin, avec la source de chaque enregistrement.

Départements, communes, arrondissements et pôles de développement, hors ligne, sans dépendance, en JavaScript et en Python. Chaque enregistrement dit d'où il vient, à quelle date il a été relevé et avec quelle confiance. Le paquet s'appelle `benin-geo`.

## Ce qu'il contient

| Niveau | Nombre | Source | Statut |
|---|---|---|---|
| Départements | 12 | Loi n°97-028 du 15 janvier 1999, article 6 | officielle |
| Communes | 77 | Annexe de la loi n°2013-05 | officielle |
| Arrondissements | 546 | Annexe de la loi n°2013-05, état de 2013 | officielle, niveau provisoire |
| Pôles de développement | 6 | Communiqué du 23 septembre 2026, aucun décret retrouvé | provisoire |

Les arrondissements décrivent l'état de 2013 : les lois postérieures n'ont pas été recherchées. Les pôles n'ont pas encore de décret. La page de provenance du site et la fiche [Modèle de données](docs/03-modele-de-donnees.md) disent ce que l'on sait, ce que l'on ne sait pas encore et comment le vérifier. Les documents qui fondent les données sont archivés dans `data/sources/`, avec leur empreinte SHA-256, et la construction ne rappelle jamais le réseau.

## Statut

Le paquet JavaScript est publié sur npm : `npm install benin-geo`. Le paquet Python n'est pas encore sur PyPI ; le code est ouvert, et on peut l'utiliser dès maintenant depuis les sources.

## Démarrer depuis les sources

JavaScript, avec Node 20 ou plus et pnpm :

```bash
git clone https://github.com/Elodias2001/Takienta.git
cd Takienta
pnpm install
pnpm --filter benin-geo build
npm install /chemin/vers/Takienta/packages/js
```

Python, version 3.9 ou plus :

```bash
node scripts/build-data.mjs
pip install ./packages/python
```

## Aperçu

```js
import { chercher, communesDe, hierarchie } from "benin-geo";

chercher("abomey calavi")[0].id;   // "BJ-AQ-ABO"
communesDe("BJ-BO").length;        // 8
hierarchie("BJ-AL-KAN-04").pole.nom;  // "Nord-Est"
```

```python
from benin_geo import chercher, communes_de, hierarchie

chercher("abomey calavi")[0].id    # "BJ-AQ-ABO"
len(communes_de("BJ-BO"))          # 8
hierarchie("BJ-AL-KAN-04").pole.nom   # "Nord-Est"
```

La documentation complète est dans [docs/](docs/index.md) : démarrage, référence de l'API, modèle de données, identifiants et contribution.

## Ce qu'il ne fait pas

- Aucun appel réseau, ni à l'installation ni à l'exécution, et aucune dépendance.
- Aucune géométrie dans le paquet : les contours ont leur propre licence.
- Rien sous l'arrondissement : les villages et quartiers de ville ne font pas partie de la première version.
- Aucune valeur devinée : un trou documenté vaut mieux qu'un chiffre inventé.

## Le nom

*Takienta* est le nom que l'UNESCO donne à la maison-tour en terre crue des Batammariba, dans le nord-ouest du Bénin et le nord-est du Togo. Le pluriel est *sikien*, et l'orthographe varie selon les auteurs. D'après l'UNESCO, *Batammariba* se traduit par « ceux qui façonnent la terre » en ditammari. Le rez-de-chaussée abrite les animaux, les greniers sont sur la terrasse, et la maison est aussi un temple dédié aux ancêtres. Le paysage du Koutammakou est inscrit au patrimoine mondial depuis 2004, au Bénin et au Togo.

Cette maison est faite d'espaces qui s'emboîtent. Le projet y lit l'image de son modèle de données : un pôle contient des départements, qui contiennent des communes, qui contiennent des arrondissements. C'est une lecture du projet, pas une affirmation ethnographique.

En français, la maison est souvent appelée « tata somba ». Selon un article universitaire, « somba » est un nom donné de l'extérieur, en langue bariba, repris par l'administration coloniale française. Le projet emploie *takienta*. Le paquet s'appelle `benin-geo` parce qu'un paquet de données se cherche plus qu'il ne se raconte.

Sources : [UNESCO, Koutammakou, the Land of the Batammariba](https://whc.unesco.org/en/list/1140/) ; Guy-Hermann Mawussé Padenou, [« La construction de l'identité chez les Betammaribé du Togo »](https://revues.acaref.net/wp-content/uploads/sites/3/2024/01/8-Guy-Hermann-Mawusse-PADENOU.pdf). Le détail de la recherche, de ce qui est établi et de ce qui ne l'est pas, est dans [docs/cadrage/recherche-nom-takienta.md](docs/cadrage/recherche-nom-takienta.md).

## Contribuer

Une contribution qui viole l'un des cinq invariants du produit est refusée : zéro dépendance d'exécution, zéro appel réseau, aucune donnée sans source, identifiants stables à vie, une seule source de vérité. Voir [Contribuer](docs/05-contribuer.md).

## Licence

MIT, voir [LICENSE](LICENSE). Les polices Caprasimo et Figtree sont sous licence SIL Open Font License 1.1, dont les textes accompagnent les fichiers dans `brand/fonts/`. Les contours de la carte du site viennent de geoBoundaries (William & Mary geoLab), d'après Wikimedia Commons : voir [assets/carte/README.md](assets/carte/README.md). Ils ne font pas partie des paquets.
