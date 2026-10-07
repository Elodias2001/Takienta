# -*- coding: utf-8 -*-
"""Tests de données. Les valeurs attendues sont celles du cadrage : on ne les ajuste jamais
pour faire passer un test, on cherche pourquoi le compte ne tombe pas juste."""
import ast, importlib.util, json, os, unittest
from jsonschema import Draft202012Validator

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def lire(*chemin):
    with open(os.path.join(RACINE, *chemin), encoding="utf-8") as f:
        return json.load(f)

def schema(nom):
    return Draft202012Validator(lire("data", "schema", nom))

def charger_pipeline():
    spec = importlib.util.spec_from_file_location("pipeline", os.path.join(RACINE, "scripts", "construire-donnees.py"))
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m

DEPS = lire("data", "departements.json")
COMMUNES = lire("data", "communes.json")
POLES = lire("data", "poles.json")
REGISTRE = lire("data", "sources.json")["sources"]
FIGES = lire("data", "identifiants.snapshot.json")["identifiants"]

class Comptes(unittest.TestCase):
    def test_12_departements_77_communes(self):
        self.assertEqual(len(DEPS), 12)
        self.assertEqual(len(COMMUNES), 77)

    def test_effectif_par_departement(self):
        attendu = {"BJ-AL": 6, "BJ-AK": 9, "BJ-AQ": 8, "BJ-BO": 8, "BJ-CO": 6, "BJ-KO": 6,
                   "BJ-DO": 4, "BJ-LI": 1, "BJ-MO": 6, "BJ-OU": 9, "BJ-PL": 5, "BJ-ZO": 9}
        reel = {}
        for c in COMMUNES:
            reel[c["parent"]] = reel.get(c["parent"], 0) + 1
        self.assertEqual(reel, attendu)

class Integrite(unittest.TestCase):
    def test_aucun_doublon_ni_orphelin(self):
        ids = [e["id"] for e in DEPS + COMMUNES]
        self.assertEqual(len(ids), len(set(ids)))
        deps = {d["id"] for d in DEPS}
        self.assertTrue(all(c["parent"] in deps for c in COMMUNES))
        self.assertTrue(all(d["parent"] is None for d in DEPS))

    def test_schema_et_source_valide_pour_chaque_enregistrement(self):
        v = schema("entite.schema.json")
        for e in DEPS + COMMUNES:
            self.assertEqual([x.message for x in v.iter_errors(e)], [], e["id"])
            self.assertIn(e["source"], REGISTRE, e["id"] + " : source inconnue")
            self.assertEqual(e["confiance"], REGISTRE[e["source"]]["confiance"] if e["type"] == "commune" else "officielle")

    def test_aucun_identifiant_fige_ne_disparait_ni_ne_change(self):
        reel = {e["id"]: (e["nom"], e["parent"]) for e in DEPS + COMMUNES}
        for i in FIGES:
            self.assertEqual(reel.get(i["id"]), (i["nom"], i["parent"]), i["id"])

    def test_tri_stable(self):
        for liste in (DEPS, [c for c in COMMUNES if c["parent"] == "BJ-ZO"]):
            self.assertEqual([e["tri"] for e in liste], sorted(e["tri"] for e in liste))

class Poles(unittest.TestCase):
    def test_schema(self):
        self.assertEqual([x.message for x in schema("poles.schema.json").iter_errors(POLES)], [])

    def test_regle_de_composition_departements_entiers(self):
        """Chaque pôle réunit des départements entiers, sauf le prélèvement du Grand-Nokoué."""
        par_dep = {}
        for c in COMMUNES:
            par_dep.setdefault(c["parent"], set()).add(c["id"])
        gn = {"BJ-AQ-ABO", "BJ-AQ-OUI", "BJ-OU-POR", "BJ-OU-SEM", "BJ-LI-COT"}
        entiers = {"PO-NO": ["BJ-AK", "BJ-DO"], "PO-NE": ["BJ-AL", "BJ-BO"], "PO-CE": ["BJ-ZO", "BJ-CO"],
                   "PO-SO": ["BJ-MO", "BJ-KO", "BJ-AQ"], "PO-SE": ["BJ-PL", "BJ-OU"]}
        attendu = {"PO-GN": gn}
        for pole, deps in entiers.items():
            attendu[pole] = set().union(*(par_dep[d] for d in deps)) - gn
        reel = {p["id"]: set(p["communes"]) for p in POLES["poles"]}
        self.assertEqual(reel, attendu)

    def test_total_77_sans_doublon_ni_orphelin(self):
        effectifs = {p["id"]: len(p["communes"]) for p in POLES["poles"]}
        self.assertEqual(effectifs, {"PO-NO": 13, "PO-NE": 14, "PO-CE": 15, "PO-SO": 18, "PO-SE": 12, "PO-GN": 5})
        toutes = [c for p in POLES["poles"] for c in p["communes"]]
        self.assertEqual(len(toutes), 77)
        self.assertEqual(set(toutes), {c["id"] for c in COMMUNES})

    def test_ordre_identique_a_la_liste_recoupee(self):
        """Chef-lieu en tête, reste alphabétique, Les Aguégués à A, Za-Kpota avant Zagnanado."""
        arbre = ast.parse(open(os.path.join(RACINE, "scripts", "verif-poles.py"), encoding="utf-8").read())
        liste = next(ast.literal_eval(n.value) for n in arbre.body
                     if isinstance(n, ast.Assign) and n.targets[0].id == "POLES")
        noms = {c["id"]: c["nom"] for c in COMMUNES}
        for p in POLES["poles"]:
            nom_pole = {"PO-NO": "Nord-Ouest", "PO-NE": "Nord-Est", "PO-CE": "Centre", "PO-SO": "Sud-Ouest", "PO-SE": "Sud-Est", "PO-GN": "Grand-Nokoué"}[p["id"]]
            self.assertEqual([noms[c] for c in p["communes"]], liste[nom_pole], p["id"])

    def test_chef_lieu_en_tete_et_grand_nokoue_sans_chef_lieu(self):
        for p in POLES["poles"]:
            if p["id"] == "PO-GN":
                self.assertIsNone(p["chefLieu"])
            else:
                self.assertEqual(p["communes"][0], p["chefLieu"])

    def test_calque_provisoire_tant_qu_aucun_decret(self):
        self.assertTrue(POLES["provisoire"])
        self.assertTrue(all(p["confiance"] == "provisoire" for p in POLES["poles"]))

class Pipeline(unittest.TestCase):
    def test_sortie_reproductible(self):
        m = charger_pipeline()
        for nom, doc in m.construire().items():
            with open(os.path.join(RACINE, "data", nom), encoding="utf-8") as f:
                self.assertEqual(f.read(), m.serialiser(doc), nom + " diffère de la sortie du pipeline")

    def test_aucun_appel_reseau(self):
        code = open(os.path.join(RACINE, "scripts", "construire-donnees.py"), encoding="utf-8").read()
        for interdit in ("urllib", "requests", "socket", "http.client", "ftplib"):
            self.assertNotIn(interdit, code)

if __name__ == "__main__":
    unittest.main()
