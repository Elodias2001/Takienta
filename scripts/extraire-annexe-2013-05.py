# -*- coding: utf-8 -*-
"""Extrait de l'annexe de la loi 2013-05 : départements, communes, arrondissements, nombre de
villages ou quartiers annoncé dans chaque en-tête. À lancer à la main (utilise pdftotext), jamais dans le build.

Usage : python3 scripts/extraire-annexe-2013-05.py <transcription.pdf> <loi-2013-05.pdf> <sortie.json>

Le texte lu est la transcription numérique de l'annexe (document tiers, non archivé : droits incertains),
car le scan de la loi, océrisé, confond des chiffres (« 08 » lu pour « 03 »). La loi archivée reste la source :
les totaux de départements et de communes lus sur son scan sont recoupés par le test de données."""
import hashlib, json, subprocess, sys, os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from annexe_loi_2013_05 import analyser

transcription, loi, sortie = sys.argv[1:4]
sha = lambda chemin: hashlib.sha256(open(chemin, "rb").read()).hexdigest()
texte = subprocess.run(["pdftotext", "-layout", transcription, "-"], capture_output=True, text=True, check=True).stdout
deps, coms, arrs, anomalies = analyser(texte.splitlines())
if anomalies:
    sys.exit("lignes non lues : %r" % anomalies[:5])
ecarts = [(a["commune"], a["nom"] or a["rang"]) for a in arrs if len(a["villages"]) != a["n"]]
if ecarts:
    sys.exit("liste de villages différente du nombre annoncé : %r" % ecarts[:5])

out = {
    "schemaVersion": 1,
    "source": {
        "loi": {"fichier": os.path.basename(loi), "sha256": sha(loi), "archive": "data/sources/loi-2013-05.pdf"},
        "transcription": {"fichier": os.path.basename(transcription), "sha256": sha(transcription), "archive": None},
    },
    "note": "Libellés d'arrondissement tels qu'imprimés dans l'annexe (majuscules sans accents), noms de villages avec leur graphie. Aucune correction. Chaque liste de villages compte le nombre annoncé dans son en-tête.",
    "departements": [{"libelle": d["nom"], "villagesAnnonces": d["n"]} for d in deps],
    "communes": [{"departement": c["dep"], "libelle": c["nom"], "villagesAnnonces": c["n"]} for c in coms],
    "arrondissements": [
        {"departement": a["dep"], "commune": a["commune"] if a["dep"] != "LITTORAL" else None,
         "libelle": a["nom"], "rang": a["rang"], "villagesAnnonces": a["n"], "villages": a["villages"]} for a in arrs],
}
with open(sortie, "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=1)
    f.write("\n")
print(len(deps), "départements,", len(coms), "communes,", len(arrs), "arrondissements,", sum(a["n"] for a in arrs), "villages")
