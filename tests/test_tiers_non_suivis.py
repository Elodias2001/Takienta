# -*- coding: utf-8 -*-
"""Le paquet tiers de comparaison (licence amont GPL-3.0) reste sur le disque, jamais dans Git :
sa licence est incompatible avec la promesse MIT du projet."""
import os, subprocess, unittest

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class TiersNonSuivis(unittest.TestCase):
    def test_aucun_fichier_du_paquet_tiers_n_est_suivi(self):
        suivis = subprocess.run(["git", "ls-files"], cwd=RACINE, capture_output=True, text=True, check=True).stdout.split("\n")
        self.assertEqual([f for f in suivis if "goldy98" in f.lower()], [])

    def test_le_fichier_est_ignore_par_git(self):
        r = subprocess.run(["git", "check-ignore", "-q", "data/sources/decoupage-territorial-benin_goldy98-1.1.0_reference-tiers.json"], cwd=RACINE)
        self.assertEqual(r.returncode, 0)


if __name__ == "__main__":
    unittest.main()
