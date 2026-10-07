# -*- coding: utf-8 -*-
"""Valide le registre des sources, les schémas et la cohérence des archives."""
import hashlib, json, os, unicodedata, unittest
from jsonschema import Draft202012Validator

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def charger(*chemin):
    return json.load(open(os.path.join(RACINE, *chemin), encoding="utf-8"))

def validateur(nom):
    schema = charger("data", "schema", nom)
    Draft202012Validator.check_schema(schema)
    return Draft202012Validator(schema)

def tri(nom):
    s = unicodedata.normalize("NFD", nom).encode("ascii", "ignore").decode().lower()
    return s[4:] if s.startswith("les ") else s

def erreurs(validator, doc):
    return [e.message for e in validator.iter_errors(doc)]

class Registre(unittest.TestCase):
    def test_sources_conformes_au_schema(self):
        self.assertEqual(erreurs(validateur("sources.schema.json"), charger("data", "sources.json")), [])

    def test_archives_presentes_et_empreintes_exactes(self):
        for ident, s in charger("data", "sources.json")["sources"].items():
            if s["archive"]:
                chemin = os.path.join(RACINE, s["archive"])
                self.assertTrue(os.path.isfile(chemin), ident + " : archive absente")
                self.assertEqual(hashlib.sha256(open(chemin, "rb").read()).hexdigest(), s["sha256"], ident + " : empreinte différente")
            if "extrait" in s:
                self.assertTrue(os.path.isfile(os.path.join(RACINE, s["extrait"])), ident + " : extrait absent")

    def test_source_officielle_exige_un_texte_archive(self):
        faux = charger("data", "sources.json")
        faux["sources"]["loi-97-028"]["archive"] = None
        self.assertTrue(erreurs(validateur("sources.schema.json"), faux))

class Entites(unittest.TestCase):
    def entite(self, i, **plus):
        e = {"id": i["id"], "type": i["type"], "nom": i["nom"], "tri": tri(i["nom"]), "parent": i["parent"],
             "source": "loi-97-028" if i["type"] == "departement" else "loi-2013-05",
             "releveLe": "2026-10-06", "confiance": "derivee"}
        e.update(plus)
        return e

    def test_tous_les_identifiants_figes_sont_des_entites_valides(self):
        v = validateur("entite.schema.json")
        registre = charger("data", "sources.json")["sources"]
        for i in charger("data", "identifiants.snapshot.json")["identifiants"]:
            e = self.entite(i)
            self.assertEqual(erreurs(v, e), [], i["id"])
            self.assertIn(e["source"], registre)

    def test_refus_des_enregistrements_invalides(self):
        v = validateur("entite.schema.json")
        base = self.entite({"id": "BJ-AL-KAN", "type": "commune", "nom": "Kandi", "parent": "BJ-AL"})
        self.assertEqual(erreurs(v, base), [])
        sans_source = dict(base); del sans_source["source"]
        self.assertTrue(erreurs(v, sans_source))
        self.assertTrue(erreurs(v, dict(base, id="BJ-AL-KAN-01")))
        self.assertTrue(erreurs(v, dict(base, confiance="certaine")))
        self.assertTrue(erreurs(v, dict(base, parent=None)))

    def test_conventions_de_tri(self):
        self.assertEqual(tri("Les Aguégués"), "aguegues")
        self.assertLess(tri("Za-Kpota"), tri("Zagnanado"))

class Poles(unittest.TestCase):
    def test_refus_d_un_pole_sans_commune(self):
        v = validateur("poles.schema.json")
        ok = {"schemaVersion": 1, "calque": "poles", "effectifAu": "2026-09-23", "provisoire": True,
              "poles": [{"id": "PO-GN", "nom": "Grand-Nokoué", "chefLieu": None,
                         "communes": ["BJ-LI-COT"], "source": "communique-marina-2026-09-23", "confiance": "provisoire"}]}
        self.assertEqual(erreurs(v, ok), [])
        ok["poles"][0]["communes"] = []
        self.assertTrue(erreurs(v, ok))

if __name__ == "__main__":
    unittest.main()
