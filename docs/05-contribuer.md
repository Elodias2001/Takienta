# Contribuer

Une contribution qui viole l'un des cinq invariants du produit est refusée, quel que soit son intérêt.

## Les invariants

1. **Zéro dépendance d'exécution**, sur npm comme sur PyPI.
2. **Zéro appel réseau**, à l'exécution comme à la construction.
3. **Aucune donnée sans source** : un enregistrement dont la source n'est pas dans le registre ne passe pas les tests.
4. **Les identifiants sont stables à vie**, jamais réattribués.
5. **Une seule source de vérité** : les données vivent dans `data/`, et les deux paquets en sont générés. Aucune donnée n'est saisie deux fois.

## Corriger ou compléter une donnée

Une correction doit s'appuyer sur un texte : une loi, un décret, une publication officielle. Un article de presse dit où chercher, jamais quoi écrire. Ajoutez le document dans `data/sources/` avec son empreinte, déclarez-le dans `data/sources.json`, puis reconstruisez.

Ne complétez jamais un trou au jugé, et n'ajustez jamais une valeur attendue pour qu'un test passe : si un compte ne tombe pas juste, on cherche pourquoi.

## Reconstruire et tester

```bash
python3 scripts/construire-donnees.py
node scripts/build-data.mjs
pnpm --filter benin-geo test
python3 -m pytest
```

Le pipeline se rejoue entièrement hors ligne depuis `data/sources/`.

## Ce qui est refusé

- Une recherche floue ou phonétique : elle rendrait des résultats plausibles mais faux.
- La géométrie dans le paquet principal, pour des raisons de licence.
- Les villages et quartiers de ville dans la première version.
- Une base de données, un backend, un compte, de la télémétrie.

Les commits suivent la convention `feat(data):`, `fix(core):`, `docs:`, `chore:`, en français.
