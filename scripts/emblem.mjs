// Géométrie de l'emblème Takienta : cadres chanfreinés emboîtés (pôle, département, commune, arrondissement).
// Une seule source : le build écrit tous les SVG depuis ces formes. Murs épais, angles chanfreinés (jamais arrondis),
// une seule ouverture, petite, dans le mur extérieur.

const C = 50;

/** Cadre carré chanfreiné centré, demi-côté `h`, chanfrein `c`. Points dans le sens horaire depuis le coin haut gauche. */
function cadre(h, c) {
  const a = C - h, b = C + h;
  return [[a + c, a], [b - c, a], [b, a + c], [b, b - c], [b - c, b], [a + c, b], [a, b - c], [a, a + c]];
}

const pts = (liste) => liste.map(([x, y]) => `${+x.toFixed(2)},${+y.toFixed(2)}`).join(" ");

/** Cadre fermé : un polygone au trait. */
function fermé(h, c, trait) {
  return `<polygon points="${pts(cadre(h, c))}" fill="none" stroke="currentColor" stroke-width="${trait}" stroke-linejoin="miter"/>`;
}

/** Cadre ouvert en bas : la porte, centrée, de largeur `porte`. */
function avecPorte(h, c, trait, porte) {
  const a = C - h, b = C + h, g = C - porte / 2, d = C + porte / 2;
  const chemin = `M${d} ${b}H${b - c}L${b} ${b - c}V${a + c}L${b - c} ${a}H${a + c}L${a} ${a + c}V${b - c}L${a + c} ${b}H${g}`;
  return `<path d="${chemin}" fill="none" stroke="currentColor" stroke-width="${trait}" stroke-linejoin="miter" stroke-linecap="butt"/>`;
}

function noyau(h, c) {
  return `<polygon points="${pts(cadre(h, c))}" fill="currentColor"/>`;
}

/** Emblème complet : quatre niveaux. */
export const PLEIN = [avecPorte(42, 11, 8, 16), fermé(28, 7, 7), fermé(16, 4, 6), noyau(6.5, 2)];

/** Variante optique pour 16 à 32 px : trois niveaux, traits plus épais, mêmes proportions générales. */
export const PETIT = [avecPorte(41, 11, 11, 18), fermé(23, 6, 10), noyau(8.5, 2.5)];

export function svg(formes, { couleur = "currentColor", titre = "Takienta", fond = null, style = "" } = {}) {
  const corps = formes.join("").replaceAll("currentColor", couleur);
  const rect = fond ? `<rect width="100" height="100" fill="${fond}"/>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img"><title>${titre}</title>${style}${rect}${corps}</svg>\n`;
}
