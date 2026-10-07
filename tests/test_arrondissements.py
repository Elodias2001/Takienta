# -*- coding: utf-8 -*-
"""Arrondissements issus de l'annexe de la loi 2013-05. Les comptes viennent de la loi : on ne les ajuste pas."""
import json, os, re, subprocess, sys, tempfile, unittest
from jsonschema import Draft202012Validator

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RACINE, "scripts"))
import libelles_arrondissements as L  # noqa: E402


def lire(*chemin):
    with open(os.path.join(RACINE, *chemin), encoding="utf-8") as f:
        return json.load(f)


ARR = lire("data", "arrondissements.json")
COMMUNES = lire("data", "communes.json")
EXTRAIT = lire("data", "sources", "loi-2013-05-arrondissements.json")
REGISTRE = lire("data", "sources.json")["sources"]


class Comptes(unittest.TestCase):
    def test_546_arrondissements_dans_77_communes(self):
        self.assertEqual(len(ARR), 546)
        self.assertEqual({a["parent"] for a in ARR}, {c["id"] for c in COMMUNES})

    def test_effectif_par_departement_selon_la_loi(self):
        attendu = {"BJ-AL": 41, "BJ-AK": 47, "BJ-AQ": 74, "BJ-BO": 43, "BJ-CO": 60, "BJ-KO": 50,
                   "BJ-DO": 26, "BJ-LI": 13, "BJ-MO": 35, "BJ-OU": 52, "BJ-PL": 29, "BJ-ZO": 76}
        reel = {}
        for a in ARR:
            reel[a["parent"][:5]] = reel.get(a["parent"][:5], 0) + 1
        self.assertEqual(reel, attendu)

    def test_villes_a_arrondissements_numerotes(self):
        n = {c: sum(1 for a in ARR if a["parent"] == c) for c in ("BJ-LI-COT", "BJ-BO-PAR", "BJ-OU-POR")}
        self.assertEqual(n, {"BJ-LI-COT": 13, "BJ-BO-PAR": 3, "BJ-OU-POR": 5})
        self.assertEqual([a["nom"] for a in ARR if a["parent"] == "BJ-LI-COT"][:3], ["1er Arrondissement", "2ème Arrondissement", "3ème Arrondissement"])

    def test_kandi_et_djougou_gardent_leurs_arrondissements_numerotes(self):
        noms = {a["nom"] for a in ARR}
        self.assertTrue({"Kandi 1", "Kandi 2", "Kandi 3", "Djougou I", "Djougou II", "Djougou III"} <= noms)


class Integrite(unittest.TestCase):
    def test_schema_source_et_statut(self):
        v = Draft202012Validator(lire("data", "schema", "entite.schema.json"))
        for a in ARR:
            self.assertEqual([e.message for e in v.iter_errors(a)], [], a["id"])
            self.assertEqual(a["source"], "loi-2013-05")
            self.assertEqual(a["confiance"], REGISTRE["loi-2013-05"]["confiance"])
            self.assertIs(a["provisoire"], True)

    def test_identifiants_uniques_et_sequentiels_par_commune(self):
        self.assertEqual(len({a["id"] for a in ARR}), len(ARR))
        for c in COMMUNES:
            numeros = [int(a["id"][-2:]) for a in ARR if a["parent"] == c["id"]]
            self.assertEqual(numeros, list(range(1, len(numeros) + 1)), c["id"])
            self.assertTrue(all(a["id"].startswith(c["id"] + "-") for a in ARR if a["parent"] == c["id"]))

    def test_ordre_alphabetique_dans_la_commune(self):
        for c in COMMUNES:
            tris = [a["tri"] for a in ARR if a["parent"] == c["id"]]
            self.assertEqual(tris, sorted(tris), c["id"])

    def test_aucun_nom_en_double_dans_une_commune(self):
        cles = [(a["parent"], a["nom"]) for a in ARR]
        self.assertEqual(len(cles), len(set(cles)))

    def test_villages_annonces_correspondent_a_la_liste_lue(self):
        for a in EXTRAIT["arrondissements"]:
            self.assertEqual(len(a["villages"]), a["villagesAnnonces"], (a["commune"], a["libelle"], a["rang"]))


class Graphie(unittest.TestCase):
    def test_titre_sans_toucher_aux_lettres(self):
        self.assertEqual(L.titre("SOUGOU-KPAN-TROSSI"), "Sougou-Kpan-Trossi")
        self.assertEqual(L.titre("N'DALI"), "N'Dali")
        self.assertEqual(L.titre("KANDI 1"), "Kandi 1")
        self.assertEqual(L.titre("DJOUGOU III"), "Djougou III")
        self.assertEqual(L.titre("OUIDAH IV"), "Ouidah IV")
        self.assertEqual(L.titre("IFANGNI"), "Ifangni")

    def test_accent_retenu_seulement_si_un_village_homonyme_l_atteste(self):
        a = {"rang": None, "libelle": "ANGARADEBOU", "villages": ["Alfakoara", "Angaradébou"]}
        self.assertEqual(L.graphie(a), ("Angaradébou", "attestee"))
        sans = {"rang": None, "libelle": "GUENE", "villages": ["Guinagourou"]}
        self.assertEqual(L.graphie(sans), ("Guene", "deduite-du-libelle"))

    def test_graphies_contradictoires_ne_sont_pas_departagees(self):
        a = {"rang": None, "libelle": "BORI", "villages": ["Bori", "Bôri"]}
        self.assertEqual(L.graphie(a), ("Bori", "deduite-du-libelle"))

    def test_aucun_accent_invente_dans_les_donnees(self):
        for a in ARR:
            if a["graphie"] == "deduite-du-libelle":
                self.assertEqual(a["nom"].upper(), a["libelleLoi"], a["id"])
            elif "libelleLoi" in a:
                self.assertEqual(L.cle(a["nom"]), L.cle(a["libelleLoi"]), a["id"])
                village = next(v for e in EXTRAIT["arrondissements"] if e["libelle"] == a["libelleLoi"] for v in e["villages"] if v == a["nom"])
                self.assertEqual(village, a["nom"])


class Instantane(unittest.TestCase):
    def test_fige_et_complet(self):
        d = lire("data", "identifiants-arrondissements.snapshot.json")
        self.assertTrue(d["figeLe"])
        self.assertEqual(len(d["identifiants"]), 546)
        self.assertEqual(len({i["id"] for i in d["identifiants"]}), 546)
        self.assertEqual({(i["id"], i["parent"], i["cle"]) for i in d["identifiants"]},
                         {(a["id"], a["parent"], a["cle"] if "libelleLoi" not in a else a["libelleLoi"]) for a in ARR_AVEC_CLE})

    def test_aucun_identifiant_fige_ne_disparait_ni_ne_change_de_parent(self):
        reel = {a["id"]: a["parent"] for a in ARR}
        for i in lire("data", "identifiants-arrondissements.snapshot.json")["identifiants"]:
            self.assertEqual(reel.get(i["id"]), i["parent"], i["id"])

    def test_regeneration_identique(self):
        with tempfile.TemporaryDirectory() as t:
            sortie = os.path.join(t, "regenere.json")
            subprocess.run([sys.executable, "scripts/generer-instantane-arrondissements.py", sortie], cwd=RACINE, check=True, capture_output=True)
            neuf = {(i["id"], i["parent"], i["cle"]) for i in lire_abs(sortie)["identifiants"]}
        fige = {(i["id"], i["parent"], i["cle"]) for i in lire("data", "identifiants-arrondissements.snapshot.json")["identifiants"]}
        self.assertEqual(neuf, fige)


ARR_AVEC_CLE = [dict(a, cle="rang:%d" % int(a["id"][-2:])) if "libelleLoi" not in a else a for a in ARR]


def lire_abs(chemin):
    with open(chemin, encoding="utf-8") as f:
        return json.load(f)


if __name__ == "__main__":
    unittest.main()
