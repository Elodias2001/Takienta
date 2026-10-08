/**
 * Données et tracés partagés par la carte des pôles et par le mode « comparer ».
 *
 * Les tracés viennent de assets/carte/benin-communes.svg (voir son attribution), les chiffres de data/.
 * Aucun nombre n'est écrit ici : tout est lu dans data/ à la construction.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { donnees } from "./donnees.mjs";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
export const svgCommunes = readFileSync(join(racine, "assets", "carte", "benin-communes.svg"), "utf8");
export const sourceCommunes = JSON.parse(readFileSync(join(racine, "assets", "carte", "source-communes.json"), "utf8"));
export const viewBoxCommunes = /viewBox="([^"]+)"/.exec(svgCommunes)[1];
const [, , largeur, hauteur] = viewBoxCommunes.split(" ").map(Number);
export const ratioCommunes = hauteur / largeur;

/** [{ id, d, nord }] triés du nord au sud, pour la cascade d'apparition. */
export const traces = [...svgCommunes.matchAll(/<path id="([^"]+)" class="commune" d="([^"]+)">/g)]
  .map(([, id, d]) => {
    const ys = d.match(/-?\d+(?:\.\d+)?/g).map(Number).filter((_, i) => i % 2 === 1);
    return { id, d, nord: ys.reduce((a, b) => a + b, 0) / ys.length };
  })
  .sort((a, b) => a.nord - b.nord);

const { departements, communes, arrondissements, poles, sources } = donnees;
export const nomDepartement = Object.fromEntries(departements.map((d) => [d.id, d.nom]));
export const poleDe = (idCommune) => poles.find((p) => p.communes.includes(idCommune));
export const arrondissementsDe = (idCommune) => arrondissements.filter((a) => a.parent === idCommune);
export const intituleSource = (id) => sources[id]?.intitule ?? id;
export const parNom = [...communes].sort((a, b) => a.tri.localeCompare(b.tri, "fr"));
export const commune = Object.fromEntries(communes.map((c) => [c.id, c]));

/** Six teintes de la charte, sans couleur en dur : jetons et mélanges de jetons. */
export const TEINTES = {
  "PO-NO": "var(--tk-accent)",
  "PO-NE": "var(--tk-secondaire)",
  "PO-CE": "var(--tk-signal)",
  "PO-SO": "color-mix(in srgb,var(--tk-accent) 42%,var(--tk-fond))",
  "PO-SE": "color-mix(in srgb,var(--tk-signal) 42%,var(--tk-fond))",
  "PO-GN": "var(--tk-texte)",
};
