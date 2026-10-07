# -*- coding: utf-8 -*-
"""Vérifie qu'aucun terme privé n'apparaît dans les fichiers suivis, ni (avec --historique) dans l'historique.

La liste des termes vit dans local-secrets/termes-prives.txt (un par ligne, ignoré par Git) : elle ne doit pas être
publique elle-même. Sans ce fichier, le script le dit et s'arrête avec le code 2.
À lancer avant tout push, avec --historique, et --ref <branche> pour ne vérifier que la branche qu'on va pousser
(sans --ref, toutes les branches locales sont vérifiées, y compris celles qu'on ne poussera pas)."""
import os, re, subprocess, sys

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LISTE = os.path.join(RACINE, "local-secrets", "termes-prives.txt")

def git(*args):
    return subprocess.run(["git", *args], cwd=RACINE, capture_output=True, text=True, errors="replace", check=True).stdout

def main():
    if not os.path.isfile(LISTE):
        print("liste absente : %s" % LISTE)
        return 2
    termes = [t.strip() for t in open(LISTE, encoding="utf-8") if t.strip()]
    motif = re.compile("|".join(re.escape(t) for t in termes), re.I)
    trouves = []
    for fichier in git("ls-files", "-z").split("\0"):
        if not fichier or fichier.endswith((".png", ".ico", ".woff2", ".pdf")):
            continue
        chemin = os.path.join(RACINE, fichier)
        if os.path.isfile(chemin):
            if motif.search(fichier) or motif.search(open(chemin, encoding="utf-8", errors="replace").read()):
                trouves.append("fichier suivi : " + fichier)
    if "--historique" in sys.argv:
        cible = sys.argv[sys.argv.index("--ref") + 1] if "--ref" in sys.argv else "--all"
        for commit in git("rev-list", cible).split():
            if motif.search(git("show", "-s", "--format=%B", commit)):
                trouves.append("message du commit " + commit[:8])
            if motif.search(git("show", "--format=", "--name-only", commit)):
                trouves.append("chemin dans le commit " + commit[:8])
            if motif.search(git("show", "--format=", "-p", commit)):
                trouves.append("contenu du commit " + commit[:8])
    for t in trouves:
        print(t)
    print("%d occurrence(s)" % len(trouves))
    return 1 if trouves else 0

if __name__ == "__main__":
    sys.exit(main())
