# Démarrer

Cette fiche montre comment installer `benin-geo` et quels appels faire en premier. Le paquet JavaScript est publié sur npm et le paquet Python sur PyPI.

## Depuis npm

```bash
npm install benin-geo
```

Python, version 3.9 ou plus :

```bash
pip install benin-geo
```

## Depuis les sources

JavaScript, avec Node 20 ou plus et pnpm :

```bash
git clone https://github.com/Elodias2001/Takienta.git
cd Takienta
pnpm install
pnpm --filter benin-geo build
```

Puis, dans votre projet, installez le dossier construit :

```bash
npm install /chemin/vers/Takienta/packages/js
```

Python, version 3.9 ou plus :

```bash
node scripts/build-data.mjs
pip install ./packages/python
```

Le script `build-data.mjs` écrit le module de données des deux paquets depuis le dossier `data/`, qui est la seule source de vérité. Il ne fait aucun appel réseau.

## Premiers appels en JavaScript

```js
import { chercher, communesDe, hierarchie } from "benin-geo";

chercher("abomey calavi")[0].id;        // "BJ-AQ-ABO"
communesDe("BJ-BO").length;             // 8

const h = hierarchie("BJ-AL-KAN-04");
h.pole.nom;                             // "Nord-Est"
h.departement.nom;                      // "Alibori"
h.commune.nom;                          // "Kandi"
h.arrondissement.nom;                   // "Kandi 1"
```

## Premiers appels en Python

```python
from benin_geo import chercher, communes_de, hierarchie

chercher("abomey calavi")[0].id         # "BJ-AQ-ABO"
len(communes_de("BJ-BO"))               # 8

h = hierarchie("BJ-AL-KAN-04")
h.pole.nom                              # "Nord-Est"
h.departement.nom                       # "Alibori"
h.commune.nom                           # "Kandi"
h.arrondissement.nom                    # "Kandi 1"
```

## Remplir un formulaire en cascade

Un département, puis ses communes, puis leurs arrondissements. Les listes sont déjà triées.

```js
import { arrondissementsDe, communesDe, departements } from "benin-geo";

const options = (liste) => liste.map((e) => new Option(e.nom, e.id));

selectDepartement.replaceChildren(...options(departements));
selectDepartement.onchange = () => selectCommune.replaceChildren(...options(communesDe(selectDepartement.value)));
selectCommune.onchange = () => selectArrondissement.replaceChildren(...options(arrondissementsDe(selectCommune.value)));
```

## Ce que le paquet ne fait pas

- Il n'appelle jamais le réseau, ni à l'installation, ni à l'exécution, et n'a aucune dépendance.
- Il ne contient aucune géométrie. Les contours ont leur propre licence et ne sont pas dans le paquet.
- Il ne descend pas au-dessous de l'arrondissement : les villages et quartiers de ville ne font pas partie de la première version.
