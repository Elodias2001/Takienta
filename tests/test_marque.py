# -*- coding: utf-8 -*-
"""Marque : les contrastes sont calculés, pas estimés, et les fichiers générés restent à jour."""
import hashlib, json, os, re, struct, subprocess, unittest
import xml.etree.ElementTree as ET

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BRAND = os.path.join(RACINE, "brand")
TOKENS = json.load(open(os.path.join(BRAND, "tokens.json"), encoding="utf-8"))
HEX = {**{k: v["hex"] for k, v in TOKENS["couleurs"].items()}, **{k: v["hex"] for k, v in TOKENS["derivees"].items()}}


def luminance(h):
    r, g, b = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    f = lambda c: c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)


def contraste(a, b):
    x, y = sorted((luminance(a), luminance(b)), reverse=True)
    return (x + 0.05) / (y + 0.05)


class Palette(unittest.TestCase):
    def test_la_palette_du_cadrage_est_inchangee(self):
        self.assertEqual({k: v["hex"] for k, v in TOKENS["couleurs"].items()},
                         {"banco": "#E8DCC8", "encre": "#2A211A", "laterite": "#B5532A", "chaume": "#D9A441", "plaine": "#5C7A4A"})

    def test_chaque_couple_declare_tient_son_niveau(self):
        for c in TOKENS["couples"]:
            r = contraste(HEX[c["texte"]], HEX[c["fond"]])
            self.assertGreaterEqual(r, TOKENS["niveaux"][c["niveau"]], "%s sur %s : %.2f" % (c["texte"], c["fond"], r))

    def test_les_couples_interdits_le_sont_vraiment(self):
        for c in TOKENS["interdits"]:
            self.assertLess(contraste(HEX[c["texte"]], HEX[c["fond"]]), TOKENS["niveaux"]["graphique"])

    def test_aucune_couleur_d_origine_ne_sert_de_texte_courant_si_elle_echoue(self):
        """Une couleur d'origine sous 4,5 ne peut être déclarée AA : sa variante dérivée doit exister."""
        for c in TOKENS["couples"]:
            if c["niveau"] == "AA":
                self.assertGreaterEqual(contraste(HEX[c["texte"]], HEX[c["fond"]]), 4.5)
        for nom, d in TOKENS["derivees"].items():
            self.assertIn(d["de"], TOKENS["couleurs"], nom)

    def test_les_roles_des_deux_themes_sont_couverts_en_aa(self):
        for theme, roles in TOKENS["roles"].items():
            for role in ("texte", "accent-texte", "signal-texte"):
                self.assertGreaterEqual(contraste(HEX[roles[role]], HEX[roles["fond"]]), 4.5, "%s %s" % (theme, role))


class Fichiers(unittest.TestCase):
    def test_generation_a_jour(self):
        r = subprocess.run(["node", "scripts/build-brand.mjs", "--verifier"], cwd=RACINE, capture_output=True, text=True)
        self.assertEqual(r.returncode, 0, r.stderr)

    def test_palette_css_contient_chaque_jeton_et_les_deux_themes(self):
        css = open(os.path.join(BRAND, "palette.css"), encoding="utf-8").read()
        for nom, h in HEX.items():
            self.assertIn("--tk-%s: %s;" % (nom, h), css)
        self.assertIn("prefers-color-scheme: dark", css)
        self.assertIn('[data-theme="dark"]', css)

    def test_svg_sains_et_limites_a_la_palette(self):
        autorisees = {h.lower() for h in HEX.values()} | {"currentcolor", "none"}
        dossier = os.path.join(BRAND, "svg")
        for nom in os.listdir(dossier):
            texte = open(os.path.join(dossier, nom), encoding="utf-8").read()
            racine = ET.fromstring(texte)
            self.assertEqual(racine.get("viewBox"), "0 0 100 100", nom)
            self.assertNotIn("<script", texte.lower(), nom)
            self.assertNotIn("href=", texte.lower(), nom)
            self.assertTrue(racine.find("{http://www.w3.org/2000/svg}title") is not None, nom)
            for valeur in re.findall(r'(?:fill|stroke)="([^"]+)"', texte):
                self.assertIn(valeur.lower(), autorisees, "%s : %s" % (nom, valeur))
            for valeur in re.findall(r"#[0-9A-Fa-f]{6}", texte):
                self.assertIn(valeur.lower(), autorisees, "%s : %s" % (nom, valeur))

    def test_aucun_angle_arrondi_dans_l_emblème(self):
        for nom in ("emblem.svg", "favicon.svg"):
            texte = open(os.path.join(BRAND, "svg", nom), encoding="utf-8").read()
            self.assertNotIn("<circle", texte)
            self.assertNotIn("rx=", texte)
            for chemin in re.findall(r' d="([^"]+)"', texte):
                self.assertIsNone(re.search(r"[CcSsQqAa]", chemin), "%s : courbe dans %s" % (nom, chemin))

    def test_favicon_suit_le_theme_du_navigateur(self):
        texte = open(os.path.join(BRAND, "svg", "favicon.svg"), encoding="utf-8").read()
        self.assertIn("prefers-color-scheme:dark", texte)
        self.assertIn(HEX["encre"], texte)
        self.assertIn(HEX["banco"], texte)

    def test_png_aux_bonnes_dimensions(self):
        attendu = {"favicon-16.png": 16, "favicon-32.png": 32, "favicon-48.png": 48, "apple-touch-icon.png": 180}
        for nom, t in attendu.items():
            octets = open(os.path.join(BRAND, "png", nom), "rb").read()
            self.assertEqual(octets[:8], b"\x89PNG\r\n\x1a\n", nom)
            self.assertEqual(struct.unpack(">II", octets[16:24]), (t, t), nom)

    def test_ico_contient_16_32_48(self):
        octets = open(os.path.join(BRAND, "favicon.ico"), "rb").read()
        self.assertEqual(struct.unpack("<HHH", octets[:6]), (0, 1, 3))
        self.assertEqual([octets[6 + 16 * i] for i in range(3)], [16, 32, 48])

    def test_aucun_tiret_cadratin_dans_les_textes_de_marque(self):
        for nom in ("README.md", "tokens.json", "palette.css", "fonts.css"):
            self.assertNotIn("—", open(os.path.join(BRAND, nom), encoding="utf-8").read(), nom)


class Typographie(unittest.TestCase):
    TY = TOKENS["typographie"]

    def plage(self):
        for morceau in self.TY["plage"].replace("U+", "").split(","):
            a, _, b = morceau.partition("-")
            yield int(a, 16), int(b or a, 16)

    def test_fichiers_presents_et_empreintes_exactes(self):
        total = 0
        for nom, p in self.TY["polices"].items():
            octets = open(os.path.join(BRAND, p["fichier"]), "rb").read()
            total += len(octets)
            self.assertEqual(hashlib.sha256(octets).hexdigest(), p["sha256"], nom)
            self.assertEqual(octets[:4], b"wOF2", nom)
        self.assertLess(total, 50 * 1024, "les deux polices doivent rester sous 50 Ko")

    def test_licences_ofl_livrees_avec_les_polices(self):
        for nom, p in self.TY["polices"].items():
            texte = open(os.path.join(BRAND, p["licenceFichier"]), encoding="utf-8").read()
            self.assertEqual(p["licence"], "OFL-1.1")
            self.assertIn("SIL Open Font License", texte, nom)
            self.assertIn(p["copyright"].split(" (")[0], texte, nom)

    def test_polices_hebergees_sans_requete_externe(self):
        css = open(os.path.join(BRAND, "fonts.css"), encoding="utf-8").read()
        self.assertNotIn("http", css)
        self.assertEqual(css.count("font-display: swap"), 2)
        for p in self.TY["polices"].values():
            self.assertIn("'%s'" % p["famille"], css)
            self.assertIn('url("%s")' % p["fichier"], css)
        for role in ("titre", "texte", "mono"):
            self.assertIn("--tk-font-%s:" % role, css)

    def test_tous_les_caracteres_de_nos_donnees_sont_dans_la_plage_embarquee(self):
        plages = list(self.plage())
        hors = set()
        for niveau in ("departements", "communes", "arrondissements"):
            for e in json.load(open(os.path.join(RACINE, "data", niveau + ".json"), encoding="utf-8")):
                for texte in [e["nom"], *e.get("alias", [])]:
                    hors |= {c for c in texte if not any(a <= ord(c) <= b for a, b in plages)}
        self.assertEqual(hors, set(), "caractères hors du sous-ensemble latin : ajouter le sous-ensemble étendu")

    def test_les_titres_n_utilisent_qu_une_graisse(self):
        self.assertEqual(self.TY["polices"]["caprasimo"]["graisse"], "400")


if __name__ == "__main__":
    unittest.main()
