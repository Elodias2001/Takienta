# -*- coding: utf-8 -*-
"""Libellés d'arrondissement : l'annexe de la loi 2013-05 imprime les arrondissements en majuscules sans accents.
On ne rajoute jamais d'accent au jugé : une graphie accentuée n'est retenue que si elle est attestée par un village
de la même annexe, situé dans le même arrondissement et portant le même nom."""
import re
import unicodedata


def cle(texte):
    """Lettres et chiffres seulement, sans accents, en majuscules."""
    s = unicodedata.normalize("NFD", texte).encode("ascii", "ignore").decode().upper()
    return re.sub(r"[^A-Z0-9]", "", s)


def tri(nom):
    s = unicodedata.normalize("NFD", nom).encode("ascii", "ignore").decode().lower()
    return s[4:] if s.startswith("les ") else s


CHIFFRE_ROMAIN = re.compile(r"^(?:I{1,3}|IV|VI{0,3}|IX|X{1,3})$")


def titre(libelle):
    """Majuscule initiale à chaque mot, sans toucher aux lettres : « SOUGOU-KPAN-TROSSI » devient « Sougou-Kpan-Trossi ».
    Un chiffre romain placé après le premier mot reste en majuscules : « DJOUGOU III » devient « Djougou III »."""
    def mot(m):
        t = m.group(0)
        if m.start() > 0 and CHIFFRE_ROMAIN.match(t):
            return t
        return t[0].upper() + t[1:].lower()
    return re.sub(r"[^\W_]+", mot, libelle)


def rang_en_lettres(rang):
    return "1er Arrondissement" if rang == 1 else "%dème Arrondissement" % rang


def graphie(arrondissement):
    """(nom affiché, graphie) : « attestee » si la loi l'écrit ainsi ou si un village homonyme l'atteste,
    « deduite-du-libelle » sinon (accents non vérifiables)."""
    if arrondissement["rang"]:
        return rang_en_lettres(arrondissement["rang"]), "attestee"
    libelle = arrondissement["libelle"]
    graphies = {v for v in arrondissement["villages"] if cle(v) == cle(libelle)}
    if len(graphies) == 1:
        return next(iter(graphies)), "attestee"
    return titre(libelle), "deduite-du-libelle"
