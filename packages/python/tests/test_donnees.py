# -*- coding: utf-8 -*-
"""Mêmes assertions que packages/js/test : les deux paquets tiennent le même contrat."""
import ast
import json
import os
import re

import pytest

import benin_geo as b

RACINE = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
PAQUET = os.path.join(RACINE, "packages", "python")
SRC = os.path.join(PAQUET, "src", "benin_geo")


def lire(*chemin):
    with open(os.path.join(RACINE, *chemin), encoding="utf-8") as f:
        return json.load(f)


def ids(requete, **kw):
    return [e.id for e in b.chercher(requete, **kw)]


class TestComptes:
    def test_12_departements_77_communes(self):
        assert len(b.departements) == 12
        assert len(b.communes) == 77

    def test_effectif_par_departement(self):
        attendu = {"BJ-AL": 6, "BJ-AK": 9, "BJ-AQ": 8, "BJ-BO": 8, "BJ-CO": 6, "BJ-KO": 6, "BJ-DO": 4,
                   "BJ-LI": 1, "BJ-MO": 6, "BJ-OU": 9, "BJ-PL": 5, "BJ-ZO": 9}
        reel = {}
        for c in b.communes:
            reel[c.parent] = reel.get(c.parent, 0) + 1
        assert reel == attendu


class TestIntegrite:
    def test_aucun_doublon_aucun_orphelin(self):
        tous = [e.id for e in (*b.departements, *b.communes, *b.poles)]
        assert len(set(tous)) == len(tous)
        deps = {d.id for d in b.departements}
        assert all(c.parent in deps for c in b.communes)

    def test_chaque_enregistrement_porte_une_source_declaree(self):
        for e in (*b.departements, *b.communes, *b.poles):
            assert e.source in b.sources, e.id
            assert e.confiance in ("officielle", "derivee", "provisoire")

    def test_identique_a_data(self):
        def vers_json(e):
            d = {"id": e.id, "type": e.type, "nom": e.nom, "tri": e.tri, "parent": e.parent,
                 "source": e.source, "releveLe": e.releve_le, "confiance": e.confiance}
            if e.alias:
                d["alias"] = list(e.alias)
            return d
        assert [vers_json(d) for d in b.departements] == lire("data", "departements.json")
        assert [vers_json(c) for c in b.communes] == lire("data", "communes.json")
        assert set(b.sources) == set(lire("data", "sources.json")["sources"])

    def test_aucun_identifiant_fige_ne_disparait_ni_ne_change(self):
        reel = {e.id: (e.nom, e.parent) for e in (*b.departements, *b.communes)}
        for i in lire("data", "identifiants.snapshot.json")["identifiants"]:
            assert reel.get(i["id"]) == (i["nom"], i["parent"]), i["id"]


class TestArrondissements:
    def test_546_dans_les_77_communes_effectif_selon_la_loi(self):
        assert len(b.arrondissements) == 546
        assert {a.parent for a in b.arrondissements} == {c.id for c in b.communes}
        attendu = {"BJ-AL": 41, "BJ-AK": 47, "BJ-AQ": 74, "BJ-BO": 43, "BJ-CO": 60, "BJ-KO": 50,
                   "BJ-DO": 26, "BJ-LI": 13, "BJ-MO": 35, "BJ-OU": 52, "BJ-PL": 29, "BJ-ZO": 76}
        reel = {}
        for a in b.arrondissements:
            reel[a.parent[:5]] = reel.get(a.parent[:5], 0) + 1
        assert reel == attendu

    def test_identifiants_sequentiels_source_declaree_niveau_provisoire(self):
        assert len({a.id for a in b.arrondissements}) == 546
        for c in b.communes:
            numeros = [int(a.id[-2:]) for a in b.arrondissements_de(c.id)]
            assert numeros == list(range(1, len(numeros) + 1)), c.id
        assert all(a.source in b.sources and a.provisoire is True for a in b.arrondissements)

    def test_identique_a_data(self):
        def vers_json(a):
            d = {"id": a.id, "type": a.type, "nom": a.nom, "tri": a.tri, "parent": a.parent, "source": a.source,
                 "releveLe": a.releve_le, "confiance": a.confiance, "provisoire": a.provisoire, "graphie": a.graphie}
            if a.libelle_loi is not None:
                d["libelleLoi"] = a.libelle_loi
            return d
        assert [vers_json(a) for a in b.arrondissements] == lire("data", "arrondissements.json")

    def test_aucun_identifiant_fige_ne_disparait_ni_ne_change_de_commune(self):
        reel = {a.id: a.parent for a in b.arrondissements}
        for i in lire("data", "identifiants-arrondissements.snapshot.json")["identifiants"]:
            assert reel.get(i["id"]) == i["parent"], i["id"]

    def test_aucun_accent_invente(self):
        for a in b.arrondissements:
            if a.graphie == "deduite-du-libelle":
                assert a.nom.upper() == a.libelle_loi, a.id

    def test_villes_numerotees(self):
        noms = lambda c: [a.nom for a in b.arrondissements_de(c)]
        assert (len(noms("BJ-LI-COT")), len(noms("BJ-BO-PAR")), len(noms("BJ-OU-POR"))) == (13, 3, 5)
        assert noms("BJ-LI-COT")[:3] == ["1er Arrondissement", "2ème Arrondissement", "3ème Arrondissement"]
        assert {"Djougou I", "Djougou II", "Djougou III"} <= set(noms("BJ-DO-DJO"))

    def test_arrondissements_de_kandi(self):
        assert [a.nom for a in b.arrondissements_de("BJ-AL-KAN")] == ["Angaradébou", "Bensékou", "Donwari", "Kandi 1", "Kandi 2", "Kandi 3", "Kassakou", "Saah", "Sam", "Sonsoro"]
        assert b.arrondissements_de("BJ-XX") == ()

    def test_par_id_hierarchie_et_poles(self):
        assert b.par_id("BJ-AL-KAN-04").nom == "Kandi 1"
        h = b.hierarchie("BJ-AL-KAN-04")
        assert (h.pole.id, h.departement.id, h.commune.id, h.arrondissement.id) == ("PO-NE", "BJ-AL", "BJ-AL-KAN", "BJ-AL-KAN-04")
        assert b.hierarchie("BJ-AL-KAN").arrondissement is None
        assert [p.id for p in b.poles_de("BJ-AQ-ABO-01")] == ["PO-GN"]
        assert [p.id for p in b.poles_de("BJ-AQ-ALL-01")] == ["PO-SO"]

    def test_chercher_sur_demande_et_dans(self):
        assert all(e.type != "arrondissement" for e in b.chercher("kandi"))
        assert ids("kandi 1", niveau="arrondissement") == ["BJ-AL-KAN-04"]
        assert len(ids("1er arrondissement", niveau="arrondissement")) == 3
        assert ids("1er arrondissement", niveau="arrondissement", dans="BJ-LI-COT") == ["BJ-LI-COT-01"]
        assert ids("savalou", niveau="commune", dans="BJ-CO") == ["BJ-CO-SAVA"]
        assert all(i.startswith("BJ-CO-SAVA-") for i in ids("a", niveau="arrondissement", dans="BJ-CO-SAVA"))


class TestPoles:
    def test_77_communes_reparties_effectifs(self):
        assert {p.id: len(p.communes) for p in b.poles} == {"PO-NO": 13, "PO-NE": 14, "PO-CE": 15, "PO-SO": 18, "PO-SE": 12, "PO-GN": 5}
        toutes = [c for p in b.poles for c in p.communes]
        assert len(toutes) == 77 and set(toutes) == {c.id for c in b.communes}

    def test_chef_lieu_en_tete_grand_nokoue_sans_chef_lieu(self):
        for p in b.poles:
            if p.id == "PO-GN":
                assert p.chef_lieu is None
            else:
                assert p.communes[0] == p.chef_lieu

    def test_calque_provisoire_et_date(self):
        assert b.calque_poles.effectif_au == "2026-09-23" and b.calque_poles.provisoire is True
        assert all(p.confiance == "provisoire" for p in b.poles)


class TestApi:
    def test_communes_du_borgou_triees(self):
        assert [c.nom for c in b.communes_de("BJ-BO")] == ["Bembèrèkè", "Kalalé", "N'Dali", "Nikki", "Parakou", "Pèrèrè", "Sinendé", "Tchaourou"]
        assert b.communes_de("BJ-XX") == ()

    def test_par_id_chaque_niveau(self):
        assert b.par_id("BJ-AL-KAN").id == "BJ-AL-KAN"
        assert b.par_id("BJ-AL").id == "BJ-AL"
        assert b.par_id("PO-GN").id == "PO-GN"
        assert b.par_id("inconnu") is None

    def test_hierarchie(self):
        h = b.hierarchie("BJ-AQ-ABO")
        assert h.pole.id == "PO-GN" and h.departement.id == "BJ-AQ" and h.commune.nom == "Abomey-Calavi"
        assert b.hierarchie("BJ-AQ-ALL").pole.id == "PO-SO"
        dep = b.hierarchie("BJ-AQ")
        assert dep.pole is None and dep.commune is None
        assert b.hierarchie("PO-GN") is None

    def test_poles_de(self):
        assert [p.id for p in b.poles_de("BJ-AQ")] == ["PO-SO", "PO-GN"]
        assert [p.id for p in b.poles_de("BJ-OU")] == ["PO-SE", "PO-GN"]
        assert [p.id for p in b.poles_de("BJ-AL")] == ["PO-NE"]
        assert [p.id for p in b.poles_de("BJ-AL-KAN")] == ["PO-NE"]


class TestChercher:
    def test_saisie_reelle_sans_accent_ni_tiret(self):
        for q in ("abomey calavi", "Abomey-Calavi", "ABOMEY CALAVI", "abomeycalavi"):
            assert ids(q) == ["BJ-AQ-ABO"], q

    def test_egalite_avant_prefixe(self):
        assert ids("abomey") == ["BJ-ZO-ABO", "BJ-AQ-ABO"]

    def test_seme(self):
        for q in ("sèmè", "seme", "Sèmè-Kpodji", "seme kpodji"):
            assert ids(q) == ["BJ-OU-SEM"], q

    def test_seme_podji_par_alias_pas_par_approximation(self):
        assert ids("seme podji") == ["BJ-OU-SEM"]
        assert ids("seme pdji") == []

    def test_apostrophe(self):
        for q in ("N'Dali", "ndali", "n dali"):
            assert ids(q) == ["BJ-BO-NDA"], q

    def test_retrouve_chaque_nom_sans_accent_ni_tiret(self):
        import unicodedata
        for c in b.communes:
            s = "".join(ch for ch in unicodedata.normalize("NFD", c.nom) if not unicodedata.category(ch).startswith("M"))
            s = re.sub(r"[-']", " ", s).lower()
            assert ids(s)[0] == c.id, c.nom

    def test_vide_ou_inconnu(self):
        assert b.chercher("") == () and b.chercher("  - ") == () and b.chercher("zzzzzz") == ()

    def test_niveau(self):
        assert ids("zou", niveau="departement") == ["BJ-ZO"]
        assert ids("littoral", niveau="commune") == []


class TestContrat:
    def test_zero_dependance_d_execution(self):
        texte = open(os.path.join(PAQUET, "pyproject.toml"), encoding="utf-8").read()
        assert re.search(r"^dependencies = \[\]$", texte, re.M)

    def test_python_minimum_3_9(self):
        assert 'requires-python = ">=3.9"' in open(os.path.join(PAQUET, "pyproject.toml"), encoding="utf-8").read()

    def test_zero_appel_reseau(self):
        interdits = {"urllib", "http", "socket", "requests", "ftplib", "ssl", "smtplib", "xmlrpc"}
        for nom in os.listdir(SRC):
            if not nom.endswith(".py"):
                continue
            arbre = ast.parse(open(os.path.join(SRC, nom), encoding="utf-8").read())
            for n in ast.walk(arbre):
                modules = [a.name for a in n.names] if isinstance(n, ast.Import) else [n.module or ""] if isinstance(n, ast.ImportFrom) and n.level == 0 else []
                for m in modules:
                    assert m.split(".")[0] not in interdits, "%s importe %s" % (nom, m)

    def test_type_marker_et_poids(self):
        assert os.path.isfile(os.path.join(SRC, "py.typed"))
        total = sum(os.path.getsize(os.path.join(SRC, f)) for f in os.listdir(SRC) if f.endswith(".py"))
        assert total < 150 * 1024
