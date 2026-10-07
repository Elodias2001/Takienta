# -*- coding: utf-8 -*-
"""Pipeline hors ligne : sources archivées vers data/departements.json, communes.json, poles.json.

Entrées (toutes dans le dépôt, aucun appel réseau) :
  data/identifiants.snapshot.json    identifiants figés, noms et parents
  data/rapprochement-communes.json   les six libellés de la loi qui diffèrent du nom usuel
  data/poles/poles-2026-09-23.json   calque des pôles et liste de référence des noms
  data/sources/loi-2013-05-arrondissements.json   annexe de la loi 2013-05 (arrondissements et villages)
  data/identifiants-arrondissements.snapshot.json identifiants d'arrondissement
  data/sources.json                  registre des sources

Sorties : data/departements.json, communes.json, arrondissements.json, poles.json.

Usage : python3 scripts/construire-donnees.py [--verifier]
--verifier ne réécrit rien et échoue si les fichiers committés diffèrent de la sortie."""
import json, os, sys, unicodedata

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from arrondissements_donnees import lister
from libelles_arrondissements import cle

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

SOURCE_DEPARTEMENTS = "loi-97-028"
SOURCE_COMMUNES = "loi-2013-05"
SOURCE_POLES = "communique-marina-2026-09-23"
SOURCE_ARRONDISSEMENTS = "loi-2013-05"
CHEF_LIEU_NON_CONFIRME = {"Grand-Nokoué"}  # le cadrage met « - », le fichier source met Abomey-Calavi : on ne tranche pas

def lire(*chemin):
    with open(os.path.join(RACINE, *chemin), encoding="utf-8") as f:
        return json.load(f)

def sans_accents(s):
    return unicodedata.normalize("NFD", s).encode("ascii", "ignore").decode()

def tri(nom):
    s = sans_accents(nom).lower()
    return s[4:] if s.startswith("les ") else s

def id_pole(nom):
    parties = nom.replace("-", " ").split()
    lettres = "".join(p[0] for p in parties) if len(parties) > 1 else parties[0][:2]
    return "PO-" + sans_accents(lettres).upper()

def construire():
    snap = lire("data", "identifiants.snapshot.json")
    annexe = lire("data", "sources", "loi-2013-05-arrondissements.json")
    rapprochements = lire("data", "rapprochement-communes.json")["communes"]
    entree_poles = lire("data", "poles", "poles-2026-09-23.json")
    registre = lire("data", "sources.json")["sources"]
    for s in (SOURCE_DEPARTEMENTS, SOURCE_COMMUNES, SOURCE_POLES):
        if s not in registre:
            raise SystemExit("source absente du registre : " + s)

    # Contrôle des noms entrants contre la liste de référence (le calque des pôles, recoupé le 27/09/2026).
    ref_deps, ref_communes = set(), {}
    for p in entree_poles["poles"]:
        for dep, v in p["departements"].items():
            ref_deps.add(dep)
            for c in v["communes"]:
                ref_communes[c] = dep
    ids_deps = {i["nom"]: i["id"] for i in snap["identifiants"] if i["type"] == "departement"}
    if set(ids_deps) != ref_deps:
        raise SystemExit("départements différents de la référence : %s" % sorted(set(ids_deps) ^ ref_deps))
    noms_figes = {i["nom"] for i in snap["identifiants"] if i["type"] == "commune"}
    if noms_figes != set(ref_communes):
        raise SystemExit("communes différentes entre l'instantané et la référence : %s" % sorted(noms_figes ^ set(ref_communes)))

    ids_communes = {i["nom"]: i for i in snap["identifiants"] if i["type"] == "commune"}
    ids_par_id = {i["id"]: i for i in snap["identifiants"] if i["type"] == "commune"}
    ids_deps_par_cle = {cle(nom): ident for nom, ident in ids_deps.items()}
    for nom, dep in ref_communes.items():
        if ids_communes[nom]["parent"] != ids_deps[dep]:
            raise SystemExit("département incohérent pour " + nom)

    # Les 77 communes sont nommées par l'annexe de la loi 2013-05, rangées par département. On rapproche chaque libellé
    # imprimé du nom usuel (seul, ou par le fichier de rapprochement), on vérifie le département, et on garde comme
    # alias le libellé de la loi quand il diffère du nom usuel.
    par_cle = {cle(i["nom"]): i for i in snap["identifiants"] if i["type"] == "commune"}
    inverse = {}
    for cid, libelle in rapprochements.items():
        if libelle in inverse:
            raise SystemExit("libellé rapproché deux fois : " + libelle)
        inverse[libelle] = cid
    appariees, alias_loi = {}, {}
    for c in annexe["communes"]:
        libelle = c["libelle"]
        cible = ids_par_id[inverse[libelle]] if libelle in inverse else par_cle.get(cle(libelle))
        if cible is None:
            raise SystemExit("libellé de la loi sans commune : " + libelle)
        if ids_deps_par_cle.get(cle(c["departement"])) != cible["parent"]:
            raise SystemExit("département de la loi incohérent pour " + libelle)
        if cible["id"] in appariees:
            raise SystemExit("commune appariée deux fois : " + cible["nom"])
        appariees[cible["id"]] = libelle
        if cle(libelle) != cle(cible["nom"]):
            alias_loi[cible["id"]] = libelle
    if set(alias_loi) != set(rapprochements):
        raise SystemExit("rapprochement inutile ou manquant : %s" % sorted(set(alias_loi) ^ set(rapprochements)))
    manquantes = [i["nom"] for i in snap["identifiants"] if i["type"] == "commune" and i["id"] not in appariees]
    if manquantes != ["Cotonou"]:
        raise SystemExit("seule Cotonou peut ne pas avoir d'en-tête de commune dans l'annexe : %s" % manquantes)

    def entite(i, source, confiance, releve, alias=None):
        e = {"id": i["id"], "type": i["type"], "nom": i["nom"], "tri": tri(i["nom"]),
             "parent": i["parent"], "source": source, "releveLe": releve, "confiance": confiance}
        if alias:
            e["alias"] = [alias]
        return e

    releve_loi = registre[SOURCE_DEPARTEMENTS]["dateReleve"]
    releve_communes = registre[SOURCE_COMMUNES]["dateReleve"]
    departements = sorted((entite(i, SOURCE_DEPARTEMENTS, "officielle", releve_loi)
                           for i in snap["identifiants"] if i["type"] == "departement"), key=lambda e: e["tri"])
    communes = sorted((entite(i, SOURCE_COMMUNES, registre[SOURCE_COMMUNES]["confiance"], releve_communes, alias_loi.get(i["id"]))
                       for i in snap["identifiants"] if i["type"] == "commune"), key=lambda e: (e["parent"], e["tri"]))

    # Arrondissements : la liste de l'annexe de la loi 2013-05, avec les identifiants de l'instantané.
    if SOURCE_ARRONDISSEMENTS not in registre:
        raise SystemExit("source absente du registre : " + SOURCE_ARRONDISSEMENTS)
    annexe = lire("data", "sources", "loi-2013-05-arrondissements.json")
    figes = {(i["parent"], i["cle"]): i["id"] for i in lire("data", "identifiants-arrondissements.snapshot.json")["identifiants"]}
    liste = lister(annexe, communes)
    if {(x["commune_id"], x["cle"]) for x in liste} != set(figes) or len(liste) != len(figes):
        raise SystemExit("les arrondissements de l'annexe ne correspondent pas à l'instantané des identifiants")
    arrondissements = []
    for x in liste:
        ident = figes[(x["commune_id"], x["cle"])]
        e = {"id": ident, "type": "arrondissement", "nom": x["nom"], "tri": x["tri"], "parent": x["commune_id"],
             "source": SOURCE_ARRONDISSEMENTS, "releveLe": registre[SOURCE_ARRONDISSEMENTS]["dateReleve"],
             "confiance": registre[SOURCE_ARRONDISSEMENTS]["confiance"], "provisoire": True,
             "graphie": x["graphie"]}
        if x["rang"] is None:
            e["libelleLoi"] = x["libelleLoi"]
        arrondissements.append(e)
    arrondissements.sort(key=lambda e: e["id"])

    # Pôles : chef-lieu en tête, puis ordre du champ tri.
    poles = []
    for p in entree_poles["poles"]:
        noms = [c for v in p["departements"].values() for c in v["communes"]]
        chef = None if p["nom"] in CHEF_LIEU_NON_CONFIRME else p["chefLieu"]
        noms.sort(key=lambda n: (n != chef, tri(n)))
        poles.append({"id": id_pole(p["nom"]), "nom": p["nom"],
                      "chefLieu": ids_communes[chef]["id"] if chef else None,
                      "communes": [ids_communes[n]["id"] for n in noms],
                      "source": p["source"], "confiance": p["confiance"]})
    if any(q["source"] != SOURCE_POLES for q in entree_poles["poles"]):
        raise SystemExit("source de pôle inattendue")
    calque = {"schemaVersion": 1, "calque": "poles", "effectifAu": entree_poles["effectifAu"],
              "provisoire": entree_poles["provisoire"], "poles": poles}
    return {"departements.json": departements, "communes.json": communes, "arrondissements.json": arrondissements, "poles.json": calque}

def serialiser(doc):
    return json.dumps(doc, ensure_ascii=False, indent=2) + "\n"

if __name__ == "__main__":
    sorties = construire()
    ecart = False
    for nom, doc in sorties.items():
        chemin = os.path.join(RACINE, "data", nom)
        if "--verifier" in sys.argv:
            actuel = open(chemin, encoding="utf-8").read() if os.path.exists(chemin) else None
            if actuel != serialiser(doc):
                print("écart :", nom); ecart = True
        else:
            with open(chemin, "w", encoding="utf-8") as f:
                f.write(serialiser(doc))
            print("écrit :", nom)
    sys.exit(1 if ecart else 0)
