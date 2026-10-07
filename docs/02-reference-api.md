# Référence de l'API

Les deux paquets exposent les mêmes données et les mêmes fonctions, avec les mêmes identifiants et les mêmes résultats. Seule la casse des noms change : `camelCase` en JavaScript, `snake_case` en Python. Un test croisé compare les deux sorties sur plus de trois mille requêtes.

## Données

| JavaScript | Python | Contenu |
|---|---|---|
| `departements` | `departements` | Les 12 départements |
| `communes` | `communes` | Les 77 communes |
| `arrondissements` | `arrondissements` | Les 546 arrondissements |
| `poles` | `poles` | Les 6 pôles de développement |
| `calquePoles` | `calque_poles` | Date et statut du calque des pôles |
| `sources` | `sources` | Le registre des sources, par identifiant |

Chaque enregistrement porte sa propre provenance : voir le [modèle de données](03-modele-de-donnees.html).

## Fonctions

| JavaScript | Python | Rôle |
|---|---|---|
| `parId(id)` | `par_id(id)` | Un enregistrement, quel que soit son niveau, ou rien |
| `communesDe(departementId)` | `communes_de(departement_id)` | Les communes d'un département, triées |
| `arrondissementsDe(communeId)` | `arrondissements_de(commune_id)` | Les arrondissements d'une commune, dans l'ordre des identifiants |
| `polesDe(id)` | `poles_de(id)` | Les pôles d'un département, d'une commune ou d'un arrondissement |
| `hierarchie(id)` | `hierarchie(id)` | Pôle, département, commune et arrondissement d'un identifiant |
| `chercher(requete, options)` | `chercher(requete, niveau=, dans=)` | Recherche par nom |

Un identifiant inconnu ne lève pas d'erreur : `parId` et `hierarchie` rendent rien, les autres rendent une liste vide.

### hierarchie

Pour une commune ou un arrondissement, `hierarchie` donne le pôle. Pour un département, le pôle vaut `null` : l'Atlantique et l'Ouémé sont répartis sur deux pôles chacun, il n'y en a donc pas un seul à désigner. Utilisez `polesDe` pour les obtenir tous.

## La recherche

`chercher` ignore les accents, la casse, les tirets et les apostrophes. Elle cherche dans le nom et dans les variantes d'orthographe relevées dans les sources (les alias).

| Saisie | Résultat |
|---|---|
| `abomey calavi`, `Abomey-Calavi`, `abomeycalavi` | Abomey-Calavi |
| `sèmè`, `seme`, `Sèmè-Kpodji` | Sèmè-Kpodji |
| `seme podji` | Sèmè-Kpodji, parce que « SEME-PODJI » est une variante relevée dans les sources |
| `ndali`, `N'Dali` | N'Dali |
| `seme pdji` | rien |

Elle n'est ni floue ni phonétique, par choix : une faute de frappe ne trouve rien, plutôt qu'un résultat plausible mais faux. Un nouvel alias ne s'ajoute que s'il est relevé dans une source.

Le classement va de l'égalité parfaite au simple contenu : égalité, début du nom, début d'un mot, contenu, puis contenu une fois les espaces retirées. À rang égal, l'ordre est celui du champ `tri`.

### Options

- `niveau` : `"departement"`, `"commune"` ou `"arrondissement"`. Par défaut, la recherche porte sur les départements et les communes. Les arrondissements ne sont cherchés que sur demande, pour ne pas noyer les résultats.
- `dans` : l'identifiant d'un département ou d'une commune, pour ne garder que ce qui s'y trouve. Les arrondissements numérotés de Cotonou, Parakou et Porto-Novo portent le même nom d'une ville à l'autre (« 1er Arrondissement ») : `dans` désigne la commune.

```js
chercher("1er arrondissement", { niveau: "arrondissement", dans: "BJ-LI-COT" });
```

```python
chercher("1er arrondissement", niveau="arrondissement", dans="BJ-LI-COT")
```

## Points d'entrée par niveau (JavaScript)

Pour ne charger que ce que vous utilisez :

| Import | Exporte |
|---|---|
| `benin-geo` | tout, y compris les fonctions |
| `benin-geo/departements` | `departements` |
| `benin-geo/communes` | `communes` |
| `benin-geo/arrondissements` | `arrondissements` |
| `benin-geo/poles` | `poles`, `calquePoles` |

L'import par défaut reste sous 150 Ko, et un test échoue s'il les dépasse. Le paquet est livré en ESM et en CommonJS, avec ses types.
