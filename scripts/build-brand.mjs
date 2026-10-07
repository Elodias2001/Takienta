// Génère les assets de marque depuis brand/tokens.json et scripts/emblem.mjs. Hors ligne, déterministe.
// Les PNG et l'ICO sont rendus à part (scripts/rendre-marque.mjs, Chrome) puis commités.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PETIT, PLEIN, svg } from "./emblem.mjs";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const tokens = JSON.parse(readFileSync(join(racine, "brand", "tokens.json"), "utf8"));
const hex = { ...Object.fromEntries(Object.entries(tokens.couleurs).map(([k, v]) => [k, v.hex])), ...Object.fromEntries(Object.entries(tokens.derivees).map(([k, v]) => [k, v.hex])) };
const dossierSvg = join(racine, "brand", "svg");
mkdirSync(dossierSvg, { recursive: true });
// --verifier : ne réécrit rien, échoue si un fichier commité diffère de la sortie du générateur.
const verifier = process.argv.includes("--verifier");
let ecarts = 0;
const ecrire = (nom, contenu) => {
  const chemin = join(racine, "brand", nom);
  if (!verifier) return writeFileSync(chemin, contenu);
  if (!existsSync(chemin) || readFileSync(chemin, "utf8") !== contenu) {
    console.error("écart :", nom);
    ecarts += 1;
  }
};

function luminance(h) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export const contraste = (a, b) => {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

// SVG
const fixe = (formes, couleur, titre, extra = {}) => svg(formes, { couleur: hex[couleur], titre, ...extra });
ecrire("svg/emblem.svg", svg(PLEIN, { titre: "Takienta" }));
ecrire("svg/emblem-encre.svg", fixe(PLEIN, "encre", "Takienta"));
ecrire("svg/emblem-banco.svg", fixe(PLEIN, "banco", "Takienta"));
ecrire("svg/emblem-laterite.svg", fixe(PLEIN, "laterite", "Takienta"));
const themes = `<style>svg{color:${hex.encre}}@media (prefers-color-scheme:dark){svg{color:${hex.banco}}}</style>`;
ecrire("svg/favicon.svg", svg(PETIT, { titre: "Takienta", style: themes }));
const centre = (formes, echelle) => [`<g transform="translate(${+((100 - 100 * echelle) / 2).toFixed(2)} ${+((100 - 100 * echelle) / 2).toFixed(2)}) scale(${echelle})">${formes.join("")}</g>`];
ecrire("svg/favicon-opaque.svg", fixe(centre(PETIT, 0.84), "encre", "Takienta", { fond: hex.banco }));
ecrire("svg/apple-touch-icon.svg", fixe(centre(PLEIN, 0.64), "encre", "Takienta", { fond: hex.banco }));

// Jetons CSS
const variables = (portee) => Object.entries(portee).map(([role, nom]) => `  --tk-${role}: var(--tk-${nom});`).join("\n");
ecrire("palette.css", `/* Généré par scripts/build-brand.mjs depuis brand/tokens.json. Ne pas modifier. */
:root {
${Object.entries(hex).map(([nom, h]) => `  --tk-${nom}: ${h};`).join("\n")}
${variables(tokens.roles.clair)}
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
${variables(tokens.roles.sombre).replaceAll("\n  --", "\n    --").replace(/^  --/, "    --")}
  }
}

:root[data-theme="dark"] {
${variables(tokens.roles.sombre)}
}
`);

// Polices : @font-face limités au sous-ensemble latin embarqué, et variables de rôle.
const ty = tokens.typographie;
const face = (p) => `@font-face {
  font-family: '${p.famille}';
  font-style: normal;
  font-display: swap;
  font-weight: ${p.graisse};
  src: url("${p.fichier}") format('${p.format}');
  unicode-range: ${ty.plage};
}`;
const pile = (r) => [r.police ? `'${ty.polices[r.police].famille}'` : null, r.secours].filter(Boolean).join(", ");
ecrire("fonts.css", `/* Généré par scripts/build-brand.mjs depuis brand/tokens.json. Ne pas modifier. */
${Object.values(ty.polices).map(face).join("\n\n")}

:root {
  --tk-font-titre: ${pile(ty.roles.titre)};
  --tk-font-texte: ${pile(ty.roles.texte)};
  --tk-font-mono: ${pile(ty.roles.mono)};
}
`);

// README de la marque : les chiffres sont calculés, pas écrits à la main.
const ligne = (c) => {
  const r = contraste(hex[c.texte], hex[c.fond]);
  return `| \`${c.texte}\` sur \`${c.fond}\` | ${r.toFixed(2).replace(".", ",")} | ${c.niveau === "AA" ? "AA, texte courant" : "graphique et grand texte"} | ${c.usage} |`;
};
ecrire("README.md", `# Marque Takienta

Fichier généré par \`scripts/build-brand.mjs\` depuis \`tokens.json\`. Ne pas modifier à la main.

L'emblème est le plan d'une takienta : quatre enveloppes chanfreinées emboîtées, murs épais, une seule
ouverture dans le mur extérieur. Elles disent la hiérarchie des données : pôle, département, commune,
arrondissement. Les angles sont chanfreinés, jamais arrondis. Aucune image bitmap n'est utilisée par le site :
les PNG ne servent qu'aux favicons et à l'icône d'écran d'accueil.

## Palette

| Jeton | Valeur | Rôle | Référence |
|---|---|---|---|
${Object.entries(tokens.couleurs).map(([k, v]) => `| \`--tk-${k}\` | \`${v.hex}\` | ${v.role} | ${v.reference} |`).join("\n")}

Variantes pour le texte, ajoutées parce que la couleur d'origine ne passe pas AA :

| Jeton | Valeur | Pour | Pourquoi |
|---|---|---|---|
${Object.entries(tokens.derivees).map(([k, v]) => `| \`--tk-${k}\` | \`${v.hex}\` | ${v.pour} | ${v.note} |`).join("\n")}

## Contrastes (calculés, WCAG 2.x)

| Couple | Rapport | Niveau tenu | Usage |
|---|---|---|---|
${tokens.couples.map(ligne).join("\n")}

À ne jamais faire :

${tokens.interdits.map((c) => `- \`${c.texte}\` sur \`${c.fond}\` : ${c.raison}.`).join("\n")}

## Typographie

${ty.origine}

| Rôle | Police | Fichier | Licence |
|---|---|---|---|
${Object.entries(ty.roles).filter(([, r]) => r.police).map(([role, r]) => { const p = ty.polices[r.police]; return `| ${role} | ${p.famille}, graisse ${p.graisse} | \`${p.fichier}\` | ${p.licence}, voir \`${p.licenceFichier}\` |`; }).join("\n")}

${ty.regles.map((r) => "- " + r).join("\n")}

Les textes de licence OFL accompagnent les fichiers et doivent rester avec eux si les polices sont redistribuées.

## Fichiers

| Fichier | Usage |
|---|---|
| \`palette.css\` | Variables CSS, thème clair et sombre (\`prefers-color-scheme\` ou \`data-theme\`). |
| \`fonts.css\`, \`fonts/\` | Caprasimo et Figtree Variable (sous-ensemble latin), licences OFL, variables \`--tk-font-*\`. |
| \`svg/emblem.svg\` | Emblème complet en \`currentColor\`, à inliner. |
| \`svg/emblem-encre.svg\`, \`emblem-banco.svg\`, \`emblem-laterite.svg\` | Emblème complet en une couleur fixe, pour \`<img>\`. |
| \`svg/favicon.svg\` | Variante à trois niveaux, traits épaissis, pour 16 à 32 px. Suit le thème du navigateur. |
| \`svg/favicon-opaque.svg\`, \`svg/apple-touch-icon.svg\` | Sources des PNG et de l'ICO, sur fond banco. |
| \`png/\`, \`favicon.ico\` | Rendus de ces sources (\`scripts/rendre-marque.mjs\`), commités. |
`);
if (verifier) process.exit(ecarts ? 1 : 0);
console.log("marque générée :", Object.keys(hex).length, "couleurs");
