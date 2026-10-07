# -*- coding: utf-8 -*-
"""Carte des départements : asset du site avec sa propre attribution, jamais dans les données ni les paquets."""
import hashlib, json, os, re, subprocess, unittest
import xml.etree.ElementTree as ET

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CARTE = os.path.join(RACINE, "assets", "carte")
SOURCE = json.load(open(os.path.join(CARTE, "source.json"), encoding="utf-8"))
SVG = open(os.path.join(CARTE, "benin-departements.svg"), encoding="utf-8").read()
DEPARTEMENTS = json.load(open(os.path.join(RACINE, "data", "departements.json"), encoding="utf-8"))
NS = {"s": "http://www.w3.org/2000/svg"}


class Source(unittest.TestCase):
    def test_contours_archives_conformes_a_la_source_declaree(self):
        octets = open(os.path.join(CARTE, SOURCE["fichier"]), "rb").read()
        self.assertEqual(len(octets), SOURCE["octets"])
        self.assertEqual(hashlib.sha256(octets).hexdigest(), SOURCE["sha256"])

    def test_la_licence_declaree_est_celle_des_metadonnees_archivees(self):
        meta = json.load(open(os.path.join(RACINE, SOURCE["metadonnees"]), encoding="utf-8"))
        meta = meta[0] if isinstance(meta, list) else meta
        self.assertEqual(meta["boundaryLicense"], SOURCE["licenceDeclaree"])
        self.assertEqual(meta["boundaryID"], SOURCE["boundaryID"])
        self.assertEqual(int(meta["admUnitCount"]), 12)
        self.assertEqual(int(meta["boundaryYearRepresented"]), SOURCE["anneeRepresentee"])

    def test_l_url_pointe_un_commit_fige(self):
        self.assertIn("/raw/" + SOURCE["commit"] + "/", SOURCE["url"])


class Svg(unittest.TestCase):
    def test_douze_departements_identiques_a_data(self):
        chemins = ET.fromstring(SVG).findall(".//s:path", NS)
        self.assertEqual(sorted(p.get("id") for p in chemins), sorted(d["id"] for d in DEPARTEMENTS))
        noms = {d["id"]: d["nom"] for d in DEPARTEMENTS}
        for p in chemins:
            self.assertEqual(p.find("s:title", NS).text, noms[p.get("id")])

    def test_attribution_dans_le_fichier(self):
        desc = ET.fromstring(SVG).find("s:desc", NS).text
        self.assertIn("geoBoundaries", desc)
        self.assertIn(str(SOURCE["anneeRepresentee"]), desc)

    def test_svg_sain_palette_et_murs_epais(self):
        palette = {"#d9a441", "#2a211a"}
        self.assertNotIn("<script", SVG.lower())
        self.assertNotIn("href=", SVG.lower())
        for couleur in re.findall(r"#[0-9A-Fa-f]{6}", SVG):
            self.assertIn(couleur.lower(), palette)
        largeur = float(re.search(r"stroke-width:([\d.]+)", SVG).group(1))
        self.assertGreaterEqual(largeur, 3.5, "bordures lourdes, jamais des filets")

    def test_poids_raisonnable(self):
        self.assertLess(len(SVG.encode("utf-8")), 40 * 1024)

    def test_generation_a_jour(self):
        r = subprocess.run(["node", "scripts/build-carte.mjs", "--verifier"], cwd=RACINE, capture_output=True, text=True)
        self.assertEqual(r.returncode, 0, r.stderr)

    def test_readme_attribue_et_signale_ce_qui_n_est_pas_verifie(self):
        texte = open(os.path.join(CARTE, "README.md"), encoding="utf-8").read()
        self.assertIn(SOURCE["attribution"], texte)
        self.assertIn(SOURCE["sha256"], texte)
        self.assertIn("Public Domain", texte)
        self.assertIn("pas pu vérifier", texte)
        self.assertNotIn("—", texte)


class AucuneGeometrieDansLesDonnees(unittest.TestCase):
    """Contours = licences à part : jamais dans data/ ni dans les paquets (cadrage, section 9)."""
    EXCLUS = {"node_modules", ".venv", "dist", "__pycache__", ".git"}

    def parcourir(self, *dossiers):
        for d in dossiers:
            for racine, sous, fichiers in os.walk(os.path.join(RACINE, d)):
                sous[:] = [s for s in sous if s not in self.EXCLUS]
                for f in fichiers:
                    yield os.path.join(racine, f)

    def test_aucun_fichier_de_geometrie(self):
        for chemin in self.parcourir("data", "packages"):
            self.assertFalse(re.search(r"\.(geojson|topojson|shp|kml|gpkg)$", chemin, re.I), chemin)

    def test_aucune_coordonnee_dans_les_donnees_ni_les_paquets(self):
        for chemin in self.parcourir("data", "packages"):
            if chemin.endswith((".json", ".ts", ".py", ".mjs")) and "decoupage-territorial-benin_goldy98" not in chemin:
                self.assertNotIn('"coordinates"', open(chemin, encoding="utf-8", errors="ignore").read(), chemin)


if __name__ == "__main__":
    unittest.main()
