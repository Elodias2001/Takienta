# -*- coding: utf-8 -*-
"""Rattache les arrondissements de l'annexe de la loi 2013-05 aux 77 communes et fixe leur ordre.

Ordre dans une commune : arrondissements numérotés par rang légal (1er, 2ème...), les autres par clé de tri du nom.
Le numéro d'un identifiant est la position dans cet ordre au moment de la figeage, puis il ne bouge plus."""
import collections

from libelles_arrondissements import cle, graphie, tri

COMMUNE_DU_LITTORAL = "COTONOU"


def rattacher(extrait, communes):
    """Associe chaque libellé de commune de l'annexe à un identifiant de commune (nom ou alias relevé)."""
    par_cle = {}
    for c in communes:
        for forme in (c["nom"], *c.get("alias", ())):
            par_cle.setdefault(cle(forme), c["id"])
    table = {}
    for c in extrait["communes"]:
        k = cle(c["libelle"])
        if k not in par_cle:
            raise SystemExit("commune de l'annexe sans correspondance : " + c["libelle"])
        table[(c["departement"], c["libelle"])] = par_cle[k]
    cotonou = par_cle[cle(COMMUNE_DU_LITTORAL)]
    if len(set(table.values())) != len(table) or cotonou in table.values():
        raise SystemExit("rattachement de communes non biunivoque")
    if len(table) + 1 != len(communes):
        raise SystemExit("77 communes attendues, %d rattachées" % (len(table) + 1))
    return table, cotonou


def lister(extrait, communes):
    """Liste ordonnée des arrondissements : commune_id, cle, nom, tri, graphie, libelleLoi, rang."""
    table, cotonou = rattacher(extrait, communes)
    par_commune = collections.defaultdict(list)
    for a in extrait["arrondissements"]:
        cid = cotonou if a["commune"] is None else table[(a["departement"], a["commune"])]
        nom, g = graphie(a)
        par_commune[cid].append({"commune_id": cid, "cle": "rang:%d" % a["rang"] if a["rang"] else a["libelle"],
                                 "nom": nom, "tri": ("%02d arrondissement" % a["rang"]) if a["rang"] else tri(nom),
                                 "graphie": g, "libelleLoi": a["libelle"], "rang": a["rang"]})
    sortie = []
    for c in communes:
        liste = par_commune[c["id"]]
        if len({x["rang"] is not None for x in liste}) > 1:
            raise SystemExit("arrondissements numérotés et nommés mélangés dans " + c["id"])
        liste.sort(key=lambda x: (x["rang"] or 0, x["tri"], x["cle"]))
        if len({x["cle"] for x in liste}) != len(liste):
            raise SystemExit("libellé en double dans " + c["id"])
        for n, x in enumerate(liste, 1):
            x["id"] = "%s-%02d" % (c["id"], n)
            sortie.append(x)
    return sortie
