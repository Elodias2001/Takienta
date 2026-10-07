import re
import unicodedata

_SEPARATEURS = re.compile(r"[-'’_.,/]+")
_ESPACES = re.compile(r"\s+")


def normaliser(texte: str) -> str:
    """Minuscules, sans diacritiques, séparateurs (tirets, apostrophes, points) ramenés à une espace."""
    s = unicodedata.normalize("NFD", texte)
    s = "".join(c for c in s if not unicodedata.category(c).startswith("M"))
    s = _SEPARATEURS.sub(" ", s.lower())
    return _ESPACES.sub(" ", s).strip()
