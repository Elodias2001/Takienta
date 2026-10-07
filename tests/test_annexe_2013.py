# -*- coding: utf-8 -*-
"""L'extrait de l'annexe de la loi 2013-05 se referme sur ses propres totaux.
Les valeurs attendues viennent de la loi (titre : 5290 villages et quartiers) et du cadrage : on ne les ajuste pas."""
import hashlib, json, os, unittest
from collections import Counter

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
E = json.load(open(os.path.join(RACINE, "data", "sources", "loi-2013-05-arrondissements.json"), encoding="utf-8"))
A, C, D = E["arrondissements"], E["communes"], E["departements"]


class Annexe(unittest.TestCase):
    def test_la_loi_archivee_est_celle_qui_est_citee(self):
        chemin = os.path.join(RACINE, E["source"]["loi"]["archive"])
        self.assertEqual(hashlib.sha256(open(chemin, "rb").read()).hexdigest(), E["source"]["loi"]["sha256"])

    def test_546_arrondissements_et_5290_villages(self):
        self.assertEqual(len(A), 546)
        self.assertEqual(sum(a["villagesAnnonces"] for a in A), 5290)

    def test_12_departements_76_en_tetes_de_commune_et_cotonou(self):
        self.assertEqual(len(D), 12)
        self.assertEqual(len(C), 76)
        self.assertEqual({a["departement"] for a in A if a["commune"] is None}, {"LITTORAL"})
        self.assertEqual(sum(1 for a in A if a["departement"] == "LITTORAL"), 13)

    def test_chaque_commune_se_referme(self):
        for c in C:
            somme = sum(a["villagesAnnonces"] for a in A if a["commune"] == c["libelle"] and a["departement"] == c["departement"])
            self.assertEqual(somme, c["villagesAnnonces"], c["libelle"])

    def test_departements_ecart_connu_de_la_loi_elle_meme(self):
        """Atacora : 517 imprimé, 519 en additionnant ses communes. Atlantique : aucun nombre imprimé.
        Le total général 5290 tient malgré tout. Cet écart est dans le texte de la loi, pas dans notre lecture."""
        for d in D:
            somme = sum(a["villagesAnnonces"] for a in A if a["departement"] == d["libelle"])
            if d["libelle"] == "ATACORA":
                self.assertEqual((d["villagesAnnonces"], somme), (517, 519))
            elif d["libelle"] == "ATLANTIQUE":
                self.assertIsNone(d["villagesAnnonces"])
                self.assertEqual(somme, 718)
            else:
                self.assertEqual(somme, d["villagesAnnonces"], d["libelle"])

    def test_aucun_arrondissement_en_double(self):
        cles = [(a["departement"], a["commune"], a["libelle"], a["rang"]) for a in A]
        self.assertEqual(len(cles), len(set(cles)))

    def test_arrondissements_numerotes_des_grandes_villes(self):
        n = Counter(a["commune"] or "COTONOU" for a in A if a["rang"])
        self.assertEqual((n["COTONOU"], n["PARAKOU"], n["PORTO-NOVO"]), (13, 3, 5))
        self.assertTrue(all(a["libelle"] is None for a in A if a["rang"]))

    def test_kandi_a_trois_arrondissements_numerotes_dans_la_loi(self):
        kandi = [a["libelle"] for a in A if a["commune"] == "KANDI"]
        self.assertTrue({"KANDI 1", "KANDI 2", "KANDI 3"} <= set(kandi))


if __name__ == "__main__":
    unittest.main()
