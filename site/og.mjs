/**
 * Vignettes de partage (Open Graph).
 *
 * Une entrée par page publiée. Le SVG est rendu en PNG 1200x630 par
 * `scripts/build-og.mjs`, et le PNG est **commité** : le rendu exige un Chrome
 * que l'image Docker n'embarque pas. Générer à la volée produirait une vignette
 * différente de celle validée. On fige à la main, on relance quand un titre change.
 *
 * Mêmes règles que la marque : palette de brand/tokens.json, murs épais (cadre
 * de 14 px aux angles chanfreinés), aucun dégradé, aucune ombre, aucun filet fin.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PLEIN } from "../scripts/emblem.mjs";
import { site } from "./config.mjs";

const tokens = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "brand", "tokens.json"), "utf8"));
const c = (nom) => tokens.couleurs[nom]?.hex ?? tokens.derivees[nom].hex;
const BANCO = c("banco"), ENCRE = c("encre"), LATERITE = c("laterite"), LATERITE_TEXTE = c("laterite-texte");

const TITRE = "'Caprasimo', Georgia, serif";
const TEXTE = "'Figtree Variable', system-ui, sans-serif";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Les vignettes, indexées par chemin publié. `alt` n'est pas décoratif : c'est
 * ce que lisent les personnes qui reçoivent le lien avec un lecteur d'écran.
 *
 * @type {Record<string, {fichier:string, surtitre:string, lignes:string[], accent?:number, mono?:string, alt:string}>}
 */
export const VIGNETTES = {
  "/": {
    fichier: "og-accueil.png",
    surtitre: "Données administratives",
    lignes: ["Le Bénin, avec la", "source de chaque", "donnée."],
    accent: 2,
    mono: "Hors ligne · sans dépendance · MIT",
    alt: "Vignette Takienta : l'emblème en cadres emboîtés et le titre « Le Bénin, avec la source de chaque donnée ».",
  },
  "/provenance": {
    fichier: "og-provenance.png",
    surtitre: "Provenance",
    lignes: ["D'où vient", "chaque donnée."],
    accent: 1,
    mono: "Source, date de relevé, niveau de confiance",
    alt: "Vignette Takienta : la page de provenance, d'où vient chaque donnée, avec sa source, sa date et son niveau de confiance.",
  },
  "/carte": {
    fichier: "og-carte.png",
    surtitre: "Carte",
    lignes: ["Les 77 communes,", "rangées par pôle."],
    accent: 1,
    mono: "Contours publics · pôles provisoires",
    alt: "Vignette Takienta : la carte des 77 communes du Bénin rangées par pôle de développement.",
  },
  "/comparer": {
    fichier: "og-comparer.png",
    surtitre: "Comparer",
    lignes: ["Deux communes,", "côte à côte."],
    accent: 1,
    mono: "Sans un seul script",
    alt: "Vignette Takienta : comparer deux communes du Bénin côte à côte.",
  },
  "/a-propos": {
    fichier: "og-a-propos.png",
    surtitre: "À propos",
    lignes: ["Elodias ADIMOU", "conçoit et développe", "Takienta."],
    accent: 2,
    mono: "Développeur web fullstack · Cotonou, Bénin",
    alt: "Vignette Takienta : « Elodias ADIMOU conçoit et développe Takienta », développeur web fullstack à Cotonou.",
  },
  "/mentions-legales": {
    fichier: "og-mentions-legales.png",
    surtitre: "Mentions légales",
    lignes: ["Éditeur, publication,", "hébergement."],
    alt: "Vignette Takienta : mentions légales du site, éditeur, directeur de la publication et hébergeur.",
  },
  "/confidentialite": {
    fichier: "og-confidentialite.png",
    surtitre: "Confidentialité",
    lignes: ["Aucun cookie.", "Aucune collecte."],
    accent: 0,
    mono: "Seuls les journaux du serveur gardent une adresse IP",
    alt: "Vignette Takienta : politique de confidentialité, aucun cookie déposé et aucune donnée collectée.",
  },
};

/** Les fiches de documentation. Le titre vient du Markdown, pas d'ici. */
export const VIGNETTE_DOCS = {
  surtitre: "Documentation",
  alt: (titre) => `Vignette Takienta : la fiche de documentation « ${titre} ».`,
};

/** Chemin publié d'une fiche de doc vers son fichier de vignette. */
export const fichierDocs = (nomHtml) => `og-docs-${nomHtml.replace(/\.html$/, "")}.png`;

/** Le SVG d'une vignette, en 1200x630 exactement. Aucun `<image>`, aucune police distante. */
export function svgVignette({ surtitre, lignes, accent, mono }) {
  const taille = lignes.length >= 3 ? 64 : 76;
  const hauteurLigne = Math.round(taille * 1.2);
  const departY = 330 - ((lignes.length - 1) * hauteurLigne) / 2 + taille * 0.15;
  const titre = lignes
    .map((l, i) => `  <text x="64" y="${Math.round(departY + i * hauteurLigne)}" font-family="${TITRE}" font-size="${taille}" fill="${i === accent ? LATERITE : ENCRE}">${esc(l)}</text>`)
    .join("\n");
  const ligneMono = mono
    ? `\n  <rect x="64" y="470" width="64" height="6" fill="${LATERITE}"/>\n  <text x="64" y="520" font-family="${TEXTE}" font-size="27" font-weight="500" fill="${ENCRE}">${esc(mono)}</text>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${BANCO}"/>
  <polygon points="52,16 1148,16 1184,52 1184,578 1148,614 52,614 16,578 16,52" fill="none" stroke="${ENCRE}" stroke-width="14" stroke-linejoin="miter"/>
  <g transform="translate(64 50) scale(0.72)" color="${ENCRE}">${PLEIN.join("")}</g>
  <text x="150" y="102" font-family="${TITRE}" font-size="38" letter-spacing="2" fill="${ENCRE}">Takienta</text>
  <text x="1136" y="96" text-anchor="end" font-family="${TEXTE}" font-size="22" font-weight="700" letter-spacing="3" fill="${LATERITE_TEXTE}">${esc(surtitre.toUpperCase())}</text>
  <rect x="64" y="146" width="1072" height="6" fill="${ENCRE}"/>
${titre}${ligneMono}
  <text x="64" y="578" font-family="${TEXTE}" font-size="24" font-weight="700" fill="${ENCRE}">${esc(site.url.replace(/^https?:\/\//, ""))}</text>
  <text x="1136" y="578" text-anchor="end" font-family="${TEXTE}" font-size="22" fill="${ENCRE}">Chaque donnée dit d'où elle vient</text>
</svg>`;
}

/** URL absolue d'une vignette. Les moissonneurs ne résolvent pas le relatif. */
export const urlVignette = (fichier) => `${site.url}/img/og/${fichier}`;
