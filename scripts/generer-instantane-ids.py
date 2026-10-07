# -*- coding: utf-8 -*-
"""Génère les identifiants (départements et communes) dans le fichier donné en argument.
L'instantané figé data/identifiants.snapshot.json ne se régénère jamais : ce script sert
au test de garde-fou, qui compare sa sortie à l'instantané. Entrée : la liste des pôles
(noms des communes et leur département), recoupée avec la loi 2013-05."""
import collections, json, sys, unicodedata

# Codes ISO 3166-2:BJ des 12 départements.
ISO = {"Alibori": "AL", "Atacora": "AK", "Atlantique": "AQ", "Borgou": "BO", "Collines": "CO", "Couffo": "KO",
       "Donga": "DO", "Littoral": "LI", "Mono": "MO", "Ouémé": "OU", "Plateau": "PL", "Zou": "ZO"}

def base(nom):
    s = unicodedata.normalize("NFD", nom).encode("ascii", "ignore").decode().upper()
    if s.startswith("LES "):
        s = s[4:]
    return "".join(c for c in s if c.isalpha())

poles = json.load(open("data/poles/poles-2026-09-23.json", encoding="utf-8"))
par_dep = collections.defaultdict(list)
for p in poles["poles"]:
    for dep, v in p["departements"].items():
        par_dep[ISO[dep]].extend(v["communes"])

ids = [{"id": "BJ-" + code, "type": "departement", "nom": nom, "parent": None} for nom, code in sorted(ISO.items(), key=lambda t: base(t[0]))]
for dep, noms in sorted(par_dep.items()):
    comptes = collections.Counter(base(n)[:3] for n in noms)
    for n in sorted(noms, key=base):
        k = 4 if comptes[base(n)[:3]] > 1 else 3
        ids.append({"id": "BJ-%s-%s" % (dep, base(n)[:k]), "type": "commune", "nom": n, "parent": "BJ-" + dep})

assert len({i["id"] for i in ids}) == len(ids), "identifiant en double"
out = {"schemaVersion": 1, "figeLe": None, "regles": {
    "departement": "BJ-<code ISO 3166-2:BJ>",
    "commune": "BJ-<dep>-<3 premières lettres du nom sans accents ni article 'Les', 4 en cas de collision dans le département, moins si le nom est plus court>",
    "arrondissement": "BJ-<dep>-<com>-<NN> numéro séquentiel par commune, ordre alphabétique à la figeage, jamais renuméroté ni réattribué"},
    "identifiants": ids}
json.dump(out, open(sys.argv[1], "w", encoding="utf-8"), ensure_ascii=False, indent=2)
print(len(ids), "identifiants")
