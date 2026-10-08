# benin-geo

La structure administrative du Bénin, avec la source de chaque enregistrement.

12 départements, 77 communes, 546 arrondissements et 6 pôles de développement. Hors ligne, sans aucune dépendance, typé (`py.typed`), Python 3.9 ou plus. Le même paquet existe en JavaScript (`npm install benin-geo`) : mêmes identifiants, mêmes résultats.

```bash
pip install benin-geo
```

```python
from benin_geo import chercher, communes_de, hierarchie

chercher("abomey calavi")[0].id        # "BJ-AQ-ABO"
len(communes_de("BJ-BO"))              # 8

h = hierarchie("BJ-AL-KAN-04")
h.pole.nom                             # "Nord-Est"
h.commune.nom                          # "Kandi"
h.arrondissement.nom                   # "Kandi 1"
```

## Ce que contient chaque enregistrement

Un enregistrement porte sa source, la date du relevé et un niveau de confiance (`officielle`, `derivee` ou `provisoire`). Les départements viennent de la loi n°97-028, les communes et les arrondissements de l'annexe de la loi n°2013-05 (état de 2013), les pôles d'un communiqué du 23 septembre 2026 qu'aucun décret ne confirme encore. Les arrondissements et les pôles sont marqués provisoires. La page [Provenance](https://takienta.sabar.app/provenance) dit ce que l'on sait, ce que l'on ne sait pas encore et comment le vérifier.

## Fonctions

`par_id`, `communes_de`, `arrondissements_de`, `poles_de`, `hierarchie` et `chercher`. La recherche ignore les accents, la casse, les tirets et les apostrophes. Elle n'est ni floue ni phonétique, par choix : une faute de frappe ne trouve rien plutôt qu'un résultat plausible mais faux. `chercher(requete, niveau="arrondissement", dans="BJ-LI-COT")` cherche les arrondissements d'une commune. Référence complète : <https://takienta.sabar.app/docs/02-reference-api.html>.

## Ce qu'il ne fait pas

Aucun appel réseau, ni à l'installation ni à l'exécution. Aucune géométrie. Rien sous l'arrondissement. Aucune valeur devinée.

## Licence

MIT. Projet Takienta, <https://takienta.sabar.app>, code source : <https://github.com/Elodias2001/Takienta>.
