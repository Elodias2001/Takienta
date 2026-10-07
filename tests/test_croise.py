# -*- coding: utf-8 -*-
"""Test croisé : les paquets JS et Python renvoient les mêmes résultats sur le même jeu de requêtes.
Prérequis : `pnpm test` ou `pnpm build` dans packages/js (le test lit packages/js/dist)."""
import json
import os
import re
import subprocess
import sys
import unittest
import unicodedata

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RACINE, "packages", "python", "src"))
import benin_geo as py  # noqa: E402


def sans_accents(s):
    return "".join(c for c in unicodedata.normalize("NFD", s) if not unicodedata.category(c).startswith("M"))


def jeu_de_requetes():
    chercher = [["", None], ["  - ", None], ["zzzz", None], ["seme podji", None], ["seme pdji", None],
                ["a", None], ["o", "commune"], ["zou", "departement"], ["littoral", "commune"], ["N'Dali", None],
                ["Sèmè-Kpodji", None], ["abomey", None], ["calavi", None], ["kpodji", None]]
    for e in [*py.departements, *py.communes]:
        for forme in (e.nom, *e.alias):
            plat = sans_accents(forme)
            for q in (forme, plat, plat.lower(), plat.upper(), re.sub(r"[-']", " ", plat), re.sub(r"[-' ]", "", plat), plat[:3], plat[:4]):
                chercher.append([q, None])
    # arrondissements : chaque nom sous plusieurs formes, seul, restreint à sa commune, à son département
    for a in py.arrondissements:
        plat = sans_accents(a.nom)
        for q in (a.nom, plat.lower(), re.sub(r"[-' ]", "", plat), plat[:3]):
            chercher.append([q, "arrondissement", None])
            chercher.append([q, "arrondissement", a.parent])
            chercher.append([q, "arrondissement", a.parent[:5]])
    for c in py.communes:
        chercher += [["a", "arrondissement", c.id], ["a", None, c.id], ["e", "commune", c.parent]]
    chercher += [["1er arrondissement", "arrondissement", None], ["1er arrondissement", "arrondissement", "BJ-LI-COT"],
                 ["arrondissement", "arrondissement", "BJ-OU-POR"], ["kandi", None, None], ["kandi", "arrondissement", None]]
    ids = [e.id for e in (*py.departements, *py.communes, *py.arrondissements, *py.poles)] + ["inconnu", "", "BJ-XX", "BJ-AL-KAN-99"]
    return {"chercher": [(x + [None, None])[:3] for x in chercher], "ids": ids,
            "departements": [d.id for d in py.departements] + ["BJ-XX"], "communes": [c.id for c in py.communes] + ["BJ-XX-XXX"]}


def resultat_python(jeu):
    ident = lambda liste: [e.id for e in liste]
    def hier(i):
        h = py.hierarchie(i)
        return [h.pole.id if h.pole else None, h.departement.id, h.commune.id if h.commune else None,
                h.arrondissement.id if h.arrondissement else None] if h else None
    return {
        "chercher": [ident(py.chercher(q, niveau=n, dans=d)) for q, n, d in jeu["chercher"]],
        "par_id": [(py.par_id(i).id if py.par_id(i) else None) for i in jeu["ids"]],
        "hierarchie": [hier(i) for i in jeu["ids"]],
        "poles_de": [ident(py.poles_de(i)) for i in jeu["ids"]],
        "communes_de": [ident(py.communes_de(d)) for d in jeu["departements"]],
        "arrondissements_de": [ident(py.arrondissements_de(c)) for c in jeu["communes"]],
    }


class Croise(unittest.TestCase):
    def test_js_et_python_donnent_les_memes_resultats(self):
        dist = os.path.join(RACINE, "packages", "js", "dist", "index.js")
        self.assertTrue(os.path.isfile(dist), "construire d'abord le paquet JS : pnpm build dans packages/js")
        jeu = jeu_de_requetes()
        js = json.loads(subprocess.run(["node", os.path.join(RACINE, "scripts", "executer-requetes.mjs")],
                                       input=json.dumps(jeu), capture_output=True, text=True, check=True).stdout)
        js.pop("version")
        attendu = resultat_python(jeu)
        for cle in attendu:
            for i, (a, b) in enumerate(zip(js[cle], attendu[cle])):
                self.assertEqual(a, b, "%s #%d : JS %r, Python %r" % (cle, i, a, b))
            self.assertEqual(len(js[cle]), len(attendu[cle]), cle)
        self.assertGreater(len(jeu["chercher"]), 3000)

    def test_versions_identiques(self):
        js = json.load(open(os.path.join(RACINE, "packages", "js", "package.json"), encoding="utf-8"))["version"]
        toml = open(os.path.join(RACINE, "packages", "python", "pyproject.toml"), encoding="utf-8").read()
        self.assertEqual(re.search(r'^version = "([^"]+)"', toml, re.M).group(1), js)
        self.assertEqual(py.__version__, js)


if __name__ == "__main__":
    unittest.main()
