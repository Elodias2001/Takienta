# -*- coding: utf-8 -*-
"""Garde-fou de l'invariant 4 : un identifiant figé ne disparaît ni ne change jamais."""
import json, os, subprocess, sys, tempfile, unittest

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FIGE = os.path.join(RACINE, "data", "identifiants.snapshot.json")

def charger(chemin):
    return json.load(open(chemin, encoding="utf-8"))

class Instantane(unittest.TestCase):
    def test_fige_et_complet(self):
        d = charger(FIGE)
        ids = d["identifiants"]
        self.assertTrue(d["figeLe"])
        self.assertEqual(len({i["id"] for i in ids}), len(ids))
        self.assertEqual(sum(i["type"] == "departement" for i in ids), 12)
        self.assertEqual(sum(i["type"] == "commune" for i in ids), 77)
        deps = {i["id"] for i in ids if i["type"] == "departement"}
        for i in ids:
            if i["type"] == "commune":
                self.assertIn(i["parent"], deps)

    def test_aucun_identifiant_ne_change(self):
        with tempfile.TemporaryDirectory() as t:
            sortie = os.path.join(t, "regenere.json")
            subprocess.run([sys.executable, "scripts/generer-instantane-ids.py", sortie], cwd=RACINE, check=True)
            figes = {i["id"]: i["nom"] for i in charger(FIGE)["identifiants"]}
            neufs = {i["id"]: i["nom"] for i in charger(sortie)["identifiants"]}
        for ident, nom in figes.items():
            self.assertIn(ident, neufs, "identifiant disparu : " + ident)
            self.assertEqual(neufs[ident], nom, "identifiant réattribué : " + ident)

if __name__ == "__main__":
    unittest.main()
