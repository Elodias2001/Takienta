# -*- coding: utf-8 -*-
"""Aucun terme privé dans les fichiers suivis. La liste est locale (hors dépôt) : sans elle, le test est ignoré
et le dit. L'historique se vérifie à part, avant un push : python3 scripts/verifier-termes-prives.py --historique"""
import os, subprocess, sys, unittest

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LISTE = os.path.join(RACINE, "local-secrets", "termes-prives.txt")


class TermesPrives(unittest.TestCase):
    @unittest.skipUnless(os.path.isfile(LISTE), "local-secrets/termes-prives.txt absent : liste privée non disponible")
    def test_aucun_fichier_suivi_ne_contient_un_terme_prive(self):
        r = subprocess.run([sys.executable, "scripts/verifier-termes-prives.py"], cwd=RACINE, capture_output=True, text=True)
        self.assertEqual(r.returncode, 0, r.stdout)


if __name__ == "__main__":
    unittest.main()
