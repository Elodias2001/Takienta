/** Minuscules, sans diacritiques, séparateurs (tirets, apostrophes, points) ramenés à une espace. */
export function normaliser(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[-'’_.,/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
