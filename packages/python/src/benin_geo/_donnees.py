"""Construit les objets publics depuis les données générées (voir scripts/build-data.mjs)."""
from __future__ import annotations

import json
from typing import Any, Dict, Tuple

from . import _generated
from ._types import Arrondissement, CalquePoles, Commune, Departement, Pole, Source


def _departement(d: Dict[str, Any]) -> Departement:
    return Departement(id=d["id"], nom=d["nom"], tri=d["tri"], source=d["source"], releve_le=d["releveLe"],
                       confiance=d["confiance"], alias=tuple(d.get("alias", ())))


def _commune(d: Dict[str, Any]) -> Commune:
    return Commune(id=d["id"], nom=d["nom"], tri=d["tri"], parent=d["parent"], source=d["source"],
                   releve_le=d["releveLe"], confiance=d["confiance"], alias=tuple(d.get("alias", ())))


def _pole(d: Dict[str, Any]) -> Pole:
    return Pole(id=d["id"], nom=d["nom"], chef_lieu=d["chefLieu"], communes=tuple(d["communes"]),
                source=d["source"], confiance=d["confiance"])


def _source(d: Dict[str, Any]) -> Source:
    return Source(intitule=d["intitule"], editeur=d["editeur"], nature=d["nature"],
                  date_publication=d["datePublication"], url=d["url"], date_releve=d["dateReleve"],
                  sha256=d["sha256"], archive=d["archive"], confiance=d["confiance"], note=d["note"],
                  auteur=d.get("auteur"), urls_complementaires=tuple(d.get("urlsComplementaires", ())),
                  extrait=d.get("extrait"))


def _arrondissements(compact: Dict[str, Any]) -> Tuple[Arrondissement, ...]:
    c = compact["commun"]
    return tuple(
        Arrondissement(id="%s-%02d" % (parent, numero), nom=nom, tri=tri, parent=parent, source=c["source"],
                       releve_le=c["releveLe"], confiance=c["confiance"], provisoire=c["provisoire"],
                       graphie="attestee" if attestee == 1 else "deduite-du-libelle", libelle_loi=libelle)
        for parent, lignes in compact["groupes"]
        for numero, nom, tri, attestee, libelle in lignes
    )


DEPARTEMENTS: Tuple[Departement, ...] = tuple(_departement(d) for d in json.loads(_generated.DEPARTEMENTS))
COMMUNES: Tuple[Commune, ...] = tuple(_commune(d) for d in json.loads(_generated.COMMUNES))
ARRONDISSEMENTS: Tuple[Arrondissement, ...] = _arrondissements(json.loads(_generated.ARRONDISSEMENTS))
POLES: Tuple[Pole, ...] = tuple(_pole(d) for d in json.loads(_generated.POLES))
CALQUE_POLES = CalquePoles(effectif_au=json.loads(_generated.CALQUE_POLES)["effectifAu"],
                           provisoire=json.loads(_generated.CALQUE_POLES)["provisoire"])
SOURCES: Dict[str, Source] = {k: _source(v) for k, v in json.loads(_generated.SOURCES).items()}
