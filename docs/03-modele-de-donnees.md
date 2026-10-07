# Modèle de données

Ce que porte un enregistrement, et comment lire les niveaux de confiance. La règle de fond : aucune donnée sans source, et la source est dans la donnée elle-même.

## Un enregistrement

```json
{
  "id": "BJ-AL-KAN-04",
  "type": "arrondissement",
  "nom": "Kandi 1",
  "tri": "kandi 1",
  "parent": "BJ-AL-KAN",
  "source": "loi-2013-05",
  "releveLe": "2026-10-07",
  "confiance": "officielle",
  "provisoire": true,
  "graphie": "deduite-du-libelle",
  "libelleLoi": "KANDI 1"
}
```

| Champ | Sens |
|---|---|
| `id` | Identifiant stable à vie, voir les [identifiants](04-identifiants.html) |
| `type` | `departement`, `commune` ou `arrondissement` |
| `nom` | Nom affiché |
| `tri` | Clé de tri : sans accents, en minuscules, sans l'article « Les », tirets conservés |
| `parent` | Identifiant du niveau supérieur, absent pour un département |
| `alias` | Variantes d'orthographe relevées dans les sources, telles quelles |
| `source` | Identifiant d'une entrée du registre `sources` |
| `releveLe` | Date du relevé, au format AAAA-MM-JJ |
| `confiance` | `officielle`, `derivee` ou `provisoire` |

## Les trois niveaux de confiance

- **`officielle`** : la source est un texte de loi ou un décret, archivé dans le dépôt avec son empreinte SHA-256.
- **`derivee`** : la source est un document institutionnel ou un ouvrage qui n'est pas un texte légal. La donnée est recoupée mais pas établie par la loi.
- **`provisoire`** : la source est un communiqué de presse, ou un état que rien ne confirme encore.

Un article de presse n'est jamais une source : il dit où chercher, pas quoi écrire.

## Les arrondissements

Leur liste vient de l'annexe de la loi n°2013-05, donc de l'état de 2013. Les lois postérieures n'ont pas été recherchées : le niveau est marqué `provisoire: true`.

La loi imprime les noms d'arrondissement en majuscules sans accents. Le champ `graphie` dit ce que vaut l'orthographe affichée :

- `attestee` : la loi l'écrit ainsi (arrondissements numérotés), ou un village du même arrondissement, de même nom, l'atteste.
- `deduite-du-libelle` : le libellé de la loi a seulement été remis en casse de titre. Les accents ne sont pas vérifiables, aucun n'a été ajouté de mémoire.

Le champ `libelleLoi` garde le libellé tel qu'imprimé.

## Les pôles

Les six pôles de développement ont été présentés le 23 septembre 2026. Aucun décret ne les fixe à ce jour : le calque est `provisoire`, daté et versionné à part des autres niveaux. Chaque pôle réunit des départements entiers, sauf le Grand-Nokoué, formé de cinq communes : Cotonou (le Littoral entier), Abomey-Calavi et Ouidah (Atlantique), Porto-Novo et Sèmè-Kpodji (Ouémé). L'Atlantique et l'Ouémé sont donc répartis entre deux pôles chacun. Le Grand-Nokoué n'a pas de chef-lieu confirmé : la valeur est laissée vide plutôt que devinée.

Un pôle n'apparaît jamais dans l'identifiant d'une commune.

## Le registre des sources

Chaque entrée de `sources` décrit un document : intitulé, éditeur, nature, date de publication, adresse, date du relevé, empreinte SHA-256, chemin de l'archive et niveau de confiance. Les portails officiels étant parfois indisponibles, les documents qui fondent des données sont archivés dans le dépôt, et le build ne rappelle jamais le réseau.

## Ce que le modèle ne contient pas

Pas de géométrie, pas de codes postaux ni téléphoniques, pas de villages ni de quartiers de ville. Un trou documenté vaut mieux qu'une valeur inventée.
