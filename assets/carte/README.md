# Carte du Bénin par départements

Fichiers générés par `scripts/build-carte.mjs`, sauf `source.json` et les contours d'origine. Ne pas modifier à la main.

**C'est un asset du site, pas un fichier du paquet.** Les paquets `benin-geo` ne contiennent aucune géométrie : un test le garde.

## Attribution (à reproduire partout où la carte est publiée)

> Contours : geoBoundaries (William & Mary geoLab), jeu BEN-ADM1, d'après Wikimedia Commons.

## Source

| | |
|---|---|
| Fichier | `geoBoundaries-BEN-ADM1_simplified.geojson`, 56979 octets |
| SHA-256 | `455c45033f206f9afdd0f051b1e71f2554738931d8e387a7ced574b239ec2da2` |
| Origine | https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/BEN/ADM1/geoBoundaries-BEN-ADM1_simplified.geojson |
| Jeu | BEN-ADM1-11314189, producteur geoBoundaries, William & Mary geoLab, année représentée 2012 |
| Source originale | Wikimedia Commons (les métadonnées ne nomment pas le fichier précis) |
| Téléchargé le | 2026-10-07 |

## Licence

- Licence déclarée par geoBoundaries pour ce jeu précis : **Public Domain** (champ `boundaryLicense` des métadonnées archivées).
- Licence de la base : CC BY 4.0 pour les œuvres dérivées du projet geoBoundaries (fichier LICENSE du dépôt). Nous attribuons dans tous les cas.
- Le cadrage supposait une licence CC BY pour geoBoundaries. Pour ce jeu, la métadonnée dit domaine public, mais elle renvoie vers Wikimedia Commons sans nommer le fichier : nous n'avons pas pu vérifier cette mention à la source primaire.
- La carte ne sert qu'à l'illustration. Elle représente l'état de 2012, avec des contours simplifiés.

## Écarts connus du fichier d'origine

- Le fichier écrit « Kouffo », « Atlanique », « Atakora » et « Oueme » : les noms ne servent pas au rattachement.
- Le code ISO du département du Couffo est absent du fichier : celui-là est rattaché par son nom.
