"""La structure administrative du Bénin, avec la source de chaque enregistrement.

Hors ligne, sans dépendance. Mêmes identifiants et mêmes résultats que le paquet npm ``benin-geo``.
"""
from __future__ import annotations

from typing import Dict, List, Optional, Tuple, Union

from ._donnees import CALQUE_POLES as calque_poles
from ._donnees import ARRONDISSEMENTS as arrondissements
from ._donnees import COMMUNES as communes
from ._donnees import DEPARTEMENTS as departements
from ._donnees import POLES as poles
from ._donnees import SOURCES as sources
from ._normaliser import normaliser
from ._types import Arrondissement, CalquePoles, Commune, Departement, Hierarchie, Pole, Source

__version__ = "0.1.0"

__all__ = [
    "Arrondissement", "CalquePoles", "Commune", "Departement", "Hierarchie", "Pole", "Source",
    "arrondissements", "arrondissements_de", "calque_poles", "chercher", "communes", "communes_de", "departements", "hierarchie",
    "par_id", "poles", "poles_de", "sources",
]

_departement_par_id: Dict[str, Departement] = {d.id: d for d in departements}
_commune_par_id: Dict[str, Commune] = {c.id: c for c in communes}
_arrondissement_par_id: Dict[str, Arrondissement] = {a.id: a for a in arrondissements}
_pole_par_id: Dict[str, Pole] = {p.id: p for p in poles}
_pole_par_commune: Dict[str, Pole] = {c: p for p in poles for c in p.communes}


def par_id(id: str) -> Optional[Union[Departement, Commune, Arrondissement, Pole]]:
    """Un enregistrement, quel que soit son niveau (département, commune, arrondissement ou pôle)."""
    return (_departement_par_id.get(id) or _commune_par_id.get(id)
            or _arrondissement_par_id.get(id) or _pole_par_id.get(id))


def communes_de(departement_id: str) -> Tuple[Commune, ...]:
    """Les communes d'un département, triées. Tuple vide si l'identifiant est inconnu."""
    return tuple(c for c in communes if c.parent == departement_id)


def arrondissements_de(commune_id: str) -> Tuple[Arrondissement, ...]:
    """Les arrondissements d'une commune, dans l'ordre des identifiants. Tuple vide si l'identifiant est inconnu."""
    return tuple(a for a in arrondissements if a.parent == commune_id)


def poles_de(id: str) -> Tuple[Pole, ...]:
    """Les pôles d'un département, d'une commune ou d'un arrondissement. Un département peut en avoir deux."""
    arrondissement = _arrondissement_par_id.get(id)
    if arrondissement is not None:
        return poles_de(arrondissement.parent)
    commune = _commune_par_id.get(id)
    if commune is not None:
        pole = _pole_par_commune.get(commune.id)
        return (pole,) if pole is not None else ()
    if id in _departement_par_id:
        concernes = {_pole_par_commune[c.id].id for c in communes_de(id) if c.id in _pole_par_commune}
        return tuple(p for p in poles if p.id in concernes)
    return ()


def hierarchie(id: str) -> Optional[Hierarchie]:
    """Pôle, département, commune et arrondissement. None si l'identifiant n'est pas de l'un de ces trois niveaux."""
    arrondissement = _arrondissement_par_id.get(id)
    commune = _commune_par_id.get(arrondissement.parent if arrondissement else id)
    if commune is not None:
        departement = _departement_par_id.get(commune.parent)
        if departement is None:
            return None
        return Hierarchie(pole=_pole_par_commune.get(commune.id), departement=departement, commune=commune,
                          arrondissement=arrondissement)
    departement = _departement_par_id.get(id)
    return Hierarchie(pole=None, departement=departement, commune=None, arrondissement=None) if departement else None


def _appartient(e: Union[Departement, Commune, Arrondissement], ancetre: str) -> bool:
    return e.id == ancetre or e.id.startswith(ancetre + "-")


def chercher(requete: str, *, niveau: Optional[str] = None,
             dans: Optional[str] = None) -> Tuple[Union[Departement, Commune, Arrondissement], ...]:
    """Recherche insensible aux accents, à la casse, aux tirets et aux apostrophes.

    Le nom et les alias relevés dans les sources sont tous cherchés. Pas de recherche floue ni phonétique :
    « seme podji » trouve Sèmè-Kpodji parce que « Sème-Podji » est une variante relevée (alias), pas par approximation.
    Classement : égalité, début, début de mot, contenu, puis contenu une fois les espaces retirées
    (« ndali », « abomeycalavi »). À rang égal, ordre du champ ``tri``.

    Par défaut : départements et communes. Les arrondissements ne sont cherchés que sur demande
    (``niveau="arrondissement"``). Ceux des grandes villes portent le même nom d'une ville à l'autre
    (« 1er Arrondissement ») : ``dans`` (identifiant d'un département ou d'une commune) désigne la commune.
    """
    q = normaliser(requete)
    if q == "":
        return ()
    compact = q.replace(" ", "")
    candidats: List[Union[Departement, Commune, Arrondissement]] = []
    if niveau == "arrondissement":
        candidats.extend(arrondissements)
    else:
        if niveau != "commune":
            candidats.extend(departements)
        if niveau != "departement":
            candidats.extend(communes)
    trouves: List[Tuple[int, Union[Departement, Commune, Arrondissement]]] = []
    for e in candidats:
        if dans is not None and not _appartient(e, dans):
            continue
        meilleur = None
        formes = (e.nom,) if isinstance(e, Arrondissement) else (e.nom, *e.alias)
        for forme in formes:
            n = normaliser(forme)
            if n == q:
                rang = 0
            elif n.startswith(q):
                rang = 1
            elif any(mot.startswith(q) for mot in n.split(" ")):
                rang = 2
            elif q in n:
                rang = 3
            elif compact in n.replace(" ", ""):
                rang = 4
            else:
                continue
            if meilleur is None or rang < meilleur:
                meilleur = rang
        if meilleur is not None:
            trouves.append((meilleur, e))
    trouves.sort(key=lambda t: (t[0], t[1].tri))
    return tuple(e for _, e in trouves)
