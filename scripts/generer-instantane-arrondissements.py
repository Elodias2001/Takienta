# -*- coding: utf-8 -*-
"""Génère les identifiants d'arrondissement dans le fichier donné en argument.
L'instantané figé data/identifiants-arrondissements.snapshot.json ne se régénère jamais : ce script sert au test de garde-fou."""
import json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from arrondissements_donnees import lister

racine = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
lire = lambda *c: json.load(open(os.path.join(racine, *c), encoding="utf-8"))
liste = lister(lire("data", "sources", "loi-2013-05-arrondissements.json"), lire("data", "communes.json"))
out = {"schemaVersion": 1, "figeLe": None,
       "regle": "BJ-<dép>-<com>-<NN> : numéro = position dans la commune au moment de la figeage (numérotés par rang légal, les autres par ordre alphabétique du nom), jamais renuméroté ni réattribué. La clé est le libellé imprimé dans la loi, ou 'rang:N' pour les arrondissements numérotés ; le nom affiché peut être corrigé, pas l'identifiant.",
       "identifiants": [{"id": x["id"], "type": "arrondissement", "parent": x["commune_id"], "cle": x["cle"]} for x in liste]}
with open(sys.argv[1], "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=1)
    f.write("\n")
print(len(liste), "identifiants")
