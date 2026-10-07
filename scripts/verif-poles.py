# -*- coding: utf-8 -*-
"""Recoupement du communiqué du 23/09/2026 avec le découpage en 12 départements.
On ne fait pas confiance au total annoncé : on recompte, et on croise."""

POLES = {
 "Nord-Ouest": ["Natitingou","Bassila","Boukombé","Cobly","Copargo","Djougou","Kérou",
                "Kouandé","Matéri","Ouaké","Péhunco","Tanguiéta","Toucountouna"],
 "Nord-Est":   ["Parakou","Banikoara","Bembèrèkè","Gogounou","Kalalé","Kandi","Karimama",
                "Malanville","N'Dali","Nikki","Pèrèrè","Ségbana","Sinendé","Tchaourou"],
 "Centre":     ["Abomey","Agbangnizoun","Bantè","Bohicon","Covè","Dassa-Zoumè","Djidja",
                "Glazoué","Ouèssè","Ouinhi","Savalou","Savè","Za-Kpota","Zagnanado","Zogbodomey"],
 "Sud-Ouest":  ["Lokossa","Allada","Aplahoué","Athiémé","Bopa","Comè","Djakotomey","Dogbo",
                "Grand-Popo","Houéyogbé","Klouékanmè","Kpomassè","Lalo","Sô-Ava","Toffo",
                "Tori-Bossito","Toviklin","Zè"],
 "Sud-Est":    ["Pobè","Adja-Ouèrè","Adjarra","Adjohoun","Les Aguégués","Akpro-Missérété",
                "Avrankou","Bonou","Dangbo","Ifangni","Kétou","Sakété"],
 "Grand-Nokoué":["Abomey-Calavi","Cotonou","Ouidah","Porto-Novo","Sèmè-Kpodji"],
}

# Les 12 départements (loi 97-028, effectifs depuis 1999). Connaissance générale,
# à confirmer sur publication INStaD avant d'entrer dans le paquet.
DEPTS = {
 "Alibori":   ["Banikoara","Gogounou","Kandi","Karimama","Malanville","Ségbana"],
 "Atacora":   ["Boukombé","Cobly","Kérou","Kouandé","Matéri","Natitingou","Péhunco",
               "Tanguiéta","Toucountouna"],
 "Atlantique":["Abomey-Calavi","Allada","Kpomassè","Ouidah","Sô-Ava","Toffo","Tori-Bossito","Zè"],
 "Borgou":    ["Bembèrèkè","Kalalé","N'Dali","Nikki","Parakou","Pèrèrè","Sinendé","Tchaourou"],
 "Collines":  ["Bantè","Dassa-Zoumè","Glazoué","Ouèssè","Savalou","Savè"],
 "Couffo":    ["Aplahoué","Djakotomey","Dogbo","Klouékanmè","Lalo","Toviklin"],
 "Donga":     ["Bassila","Copargo","Djougou","Ouaké"],
 "Littoral":  ["Cotonou"],
 "Mono":      ["Athiémé","Bopa","Comè","Grand-Popo","Houéyogbé","Lokossa"],
 "Ouémé":     ["Adjarra","Adjohoun","Akpro-Missérété","Avrankou","Bonou","Dangbo",
               "Les Aguégués","Porto-Novo","Sèmè-Kpodji"],
 "Plateau":   ["Adja-Ouèrè","Ifangni","Kétou","Pobè","Sakété"],
 "Zou":       ["Abomey","Agbangnizoun","Bohicon","Covè","Djidja","Ouinhi","Za-Kpota",
               "Zagnanado","Zogbodomey"],
}

pol = [c for v in POLES.values() for c in v]
dep = [c for v in DEPTS.values() for c in v]

print("PÔLES");  [print("  %-14s %2d" % (k, len(v))) for k, v in POLES.items()]
print("  %-14s %2d  (doublons : %d)" % ("TOTAL", len(pol), len(pol) - len(set(pol))))
print("\nDÉPARTEMENTS"); [print("  %-12s %2d" % (k, len(v))) for k, v in sorted(DEPTS.items())]
print("  %-12s %2d  (doublons : %d)" % ("TOTAL", len(dep), len(dep) - len(set(dep))))

print("\nCROISEMENT")
print("  dans les pôles, absent des départements :", sorted(set(pol) - set(dep)) or "aucun")
print("  dans les départements, absent des pôles :", sorted(set(dep) - set(pol)) or "aucun")

print("\nCOMPOSITION DE CHAQUE PÔLE PAR DÉPARTEMENT")
for p, communes in POLES.items():
    part = {}
    for c in communes:
        d = next((d for d, l in DEPTS.items() if c in l), "?")
        part[d] = part.get(d, 0) + 1
    detail = " + ".join("%s %d/%d" % (d, n, len(DEPTS[d])) for d, n in sorted(part.items()))
    print("  %-14s %s" % (p, detail))

print("\nORDRE DE LA LISTE (1er = chef-lieu ?)")
for p, c in POLES.items():
    reste = c[1:]
    print("  %-14s tête %-14s reste alphabétique : %s" % (p, c[0], "oui" if reste == sorted(reste) else "NON"))
