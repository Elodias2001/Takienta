# Identifiants

Un identifiant est stable à vie. Il n'est jamais modifié ni réattribué : une commune renommée garde son identifiant et gagne un alias. C'est ce qui permet de stocker un identifiant dans votre base sans craindre qu'il change de sens.

## Les formats

| Niveau | Format | Exemple |
|---|---|---|
| Département | `BJ-` suivi du code ISO 3166-2:BJ | `BJ-AK` (Atacora) |
| Commune | `BJ-<département>-<lettres du nom>` | `BJ-AL-KAN` (Kandi) |
| Arrondissement | `BJ-<département>-<commune>-<NN>` | `BJ-AL-KAN-04` |

Les départements reprennent la codification ISO, qui existe déjà. Aucune codification officielle des communes n'a été trouvée côté INStaD.

## Les communes

Le code est formé des trois premières lettres du nom, sans accents ni article « Les ». En cas de collision dans un même département, les deux communes passent à quatre lettres : `BJ-CO-SAVA` (Savalou) et `BJ-CO-SAVE` (Savè). Un nom plus court donne un code plus court : `BJ-AQ-ZE` (Zè).

Ces codes ont été fixés une seule fois, dans un instantané versionné. Ils ne sont pas recalculés.

## Les arrondissements

`NN` est la position de l'arrondissement dans sa commune au moment de la figeage : les arrondissements numérotés par la loi (Cotonou, Parakou, Porto-Novo) suivent leur rang légal, les autres l'ordre alphabétique. Le numéro ne change plus jamais.

Un arrondissement créé plus tard prend le numéro suivant. Un arrondissement supprimé laisse un trou, son numéro n'est pas réutilisé.

Le numéro ne dépend pas du nom affiché : un nom se corrige, par exemple pour ajouter un accent vérifié, sans changer l'identifiant.

## Ce qui garantit tout cela

Des tests échouent si un identifiant fige disparaît, change de nom ou de parent, ou est réattribué. L'instantané n'est jamais régénéré : le script qui le produit n'écrit que dans un chemin donné en argument, pour comparer.
