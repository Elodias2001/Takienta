# -*- coding: utf-8 -*-
"""Analyse du texte de l'annexe de la loi 2013-05 (liste des unités administratives locales).

Fonctionne sur le texte brut d'un PDF (pdftotext), propre ou océrisé. Ne produit que la structure :
département, commune, arrondissement et nombre de villages ou quartiers annoncé dans chaque en-tête.
Aucune valeur n'est corrigée ici : ce qui ne se lit pas est signalé, pas deviné."""
import re

ENTETE_ARR = re.compile(r"^\W{0,4}(?:Arrondissement|\d+\s*[^\W\d_]{0,3}\s+Arrondissement)", re.I)


def _dernier_entier(s):
    m = re.search(r"(\d+)\D*$", s)
    return int(m.group(1)) if m else None


VILLAGE = re.compile(r"^(\d+)\s*[.)]\s*(.+?)\s*$")


def analyser(lignes):
    deps, coms, arrs, anomalies = [], [], [], []
    for i, brut in enumerate(lignes):
        l = brut.strip()
        if not l:
            continue
        if re.match(r"^D[ÉE]PARTEMENT\b", l, re.I):
            m = re.match(r"^D[ÉE]PARTEMENT\s+(?:DE LA |DE L[’'] ?|DES |DU |DE )?(.+?)\s*:\s*(\d+)?", l, re.I)
            deps.append({"nom": m.group(1).strip() if m else l, "n": int(m.group(2)) if m and m.group(2) else None, "ligne": i})
        elif re.match(r"^COMMUNE\b", l, re.I):
            m = re.match(r"^COMMUNE\s+(?:DES |DE |DU |D[’'] ?)?(.+?)\s*:\s*(\d+)", l, re.I)
            if not m:
                anomalies.append((i, l)); continue
            coms.append({"nom": m.group(1).strip(), "n": int(m.group(2)), "dep": deps[-1]["nom"] if deps else None, "ligne": i})
        elif ENTETE_ARR.match(l):
            sep = list(re.finditer(r"\s*:\s*(\d+)", l))
            if sep:
                tete, n = l[:sep[-1].start()], int(sep[-1].group(1))
            else:
                m = re.match(r"^(.*?)\s+(\d+)\s+\S*$", l)
                if not m:
                    anomalies.append((i, l)); continue
                tete, n = m.group(1), int(m.group(2))
            num = re.match(r"^(\d+)\s*[^\W\d_]{0,3}\s+Arrondissement$", tete.strip(), re.I)
            if num:
                nom = None; rang = int(num.group(1))
            else:
                nom = re.sub(r"^\W*Arrondissement\s*(?:DE |DU |DES |D[’'] ?)?", "", tete.strip(), flags=re.I).strip()
                rang = None
            arrs.append({"nom": nom, "rang": rang, "n": n, "commune": coms[-1]["nom"] if coms else None,
                         "dep": deps[-1]["nom"] if deps else None, "ligne": i, "villages": []})
        elif arrs and VILLAGE.match(l):
            arrs[-1]["villages"].append(VILLAGE.match(l).group(2))
    return deps, coms, arrs, anomalies
