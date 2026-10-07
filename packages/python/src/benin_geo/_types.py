"""Types publics. Les noms de champs suivent ceux de data/ en snake_case."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional, Tuple

Confiance = str  # "officielle" | "derivee" | "provisoire"
Niveau = str  # "departement" | "commune" | "arrondissement"


@dataclass(frozen=True)
class Departement:
    id: str
    nom: str
    #: Clé de tri : sans accents, minuscules, sans article initial « Les ».
    tri: str
    #: D'où vient la donnée : identifiant d'une entrée de ``sources``.
    source: str
    #: Date du relevé, AAAA-MM-JJ.
    releve_le: str
    confiance: Confiance
    alias: Tuple[str, ...] = ()
    type: str = "departement"
    parent: None = None


@dataclass(frozen=True)
class Commune:
    id: str
    nom: str
    tri: str
    #: Identifiant du département.
    parent: str
    source: str
    releve_le: str
    confiance: Confiance
    #: Variantes d'orthographe relevées dans les sources, telles quelles.
    alias: Tuple[str, ...] = ()
    type: str = "commune"


@dataclass(frozen=True)
class Arrondissement:
    """Arrondissement selon l'annexe de la loi n°2013-05 (état de 2013), niveau provisoire."""
    #: ``BJ-<dép>-<com>-<NN>`` : NN est stable, il ne change jamais et n'est jamais réattribué.
    id: str
    #: Nom affiché. Voir ``graphie`` pour savoir si les accents sont vérifiés.
    nom: str
    tri: str
    #: Identifiant de la commune.
    parent: str
    source: str
    releve_le: str
    confiance: Confiance
    provisoire: bool
    #: ``attestee`` : écrit ainsi par la loi (arrondissement numéroté) ou attesté par un village homonyme du même
    #: arrondissement. ``deduite-du-libelle`` : majuscules de la loi remises en casse de titre, accents non vérifiables.
    graphie: str
    #: Libellé imprimé dans la loi (majuscules sans accents). None pour les arrondissements numérotés.
    libelle_loi: Optional[str] = None
    type: str = "arrondissement"


@dataclass(frozen=True)
class Pole:
    id: str
    nom: str
    #: None quand aucun chef-lieu n'est confirmé (Grand-Nokoué).
    chef_lieu: Optional[str]
    #: Identifiants de communes : chef-lieu en tête, puis ordre du champ ``tri``.
    communes: Tuple[str, ...]
    source: str
    confiance: Confiance


@dataclass(frozen=True)
class CalquePoles:
    """Le calque des pôles est daté et versionné à part des autres niveaux."""
    effectif_au: str
    provisoire: bool


@dataclass(frozen=True)
class Source:
    intitule: str
    editeur: str
    nature: str
    date_publication: Optional[str]
    url: Optional[str]
    date_releve: str
    sha256: Optional[str]
    archive: Optional[str]
    confiance: Confiance
    note: str
    auteur: Optional[str] = None
    urls_complementaires: Tuple[str, ...] = ()
    extrait: Optional[str] = None


@dataclass(frozen=True)
class Hierarchie:
    #: Pôle de la commune. None pour un département : Atlantique et Ouémé sont répartis sur deux pôles.
    pole: Optional[Pole]
    departement: Departement
    commune: Optional[Commune]
    arrondissement: Optional[Arrondissement]
