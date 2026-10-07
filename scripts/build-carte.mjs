// Génère assets/carte/benin-departements.svg depuis les contours geoBoundaries archivés. Hors ligne, déterministe.
// La géométrie reste un asset du site : elle n'entre jamais dans data/ ni dans les paquets (licences, cadrage section 9).
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const lire = (...c) => JSON.parse(readFileSync(join(racine, ...c), "utf8"));
const source = lire("assets", "carte", "source.json");
const geo = lire("assets", "carte", source.fichier);
const departements = lire("data", "departements.json");
const palette = lire("brand", "tokens.json").couleurs;
const verifier = process.argv.includes("--verifier");

// Rattachement : code ISO du fichier, sauf le Couffo (code absent) rattaché par son nom.
const PAR_NOM = { Kouffo: "BJ-KO" };
const ids = new Map();
for (const f of geo.features) {
  const { shapeISO, shapeName } = f.properties;
  const id = shapeISO ?? PAR_NOM[shapeName];
  if (!id) throw new Error(`entité sans rattachement : ${shapeName}`);
  if (ids.has(id)) throw new Error(`identifiant en double : ${id}`);
  ids.set(id, f);
}
const attendus = departements.map((d) => d.id).sort();
if (JSON.stringify([...ids.keys()].sort()) !== JSON.stringify(attendus)) throw new Error("les contours ne couvrent pas exactement les 12 départements de data/");

// Projection équirectangulaire corrigée de la latitude moyenne, ramenée à une largeur de 400.
const anneaux = (f) => (f.geometry.type === "MultiPolygon" ? f.geometry.coordinates.flat() : f.geometry.coordinates);
const tous = [...ids.values()].flatMap(anneaux).flat();
const [lon0, lon1] = [Math.min(...tous.map((p) => p[0])), Math.max(...tous.map((p) => p[0]))];
const [lat0, lat1] = [Math.min(...tous.map((p) => p[1])), Math.max(...tous.map((p) => p[1]))];
const k = Math.cos(((lat0 + lat1) / 2) * (Math.PI / 180));
const L = 400, echelle = L / ((lon1 - lon0) * k), marge = 4;
const H = Math.ceil((lat1 - lat0) * echelle);
const proj = ([lon, lat]) => [((lon - lon0) * k * echelle + marge).toFixed(1), ((lat1 - lat) * echelle + marge).toFixed(1)];
const chemin = (f) => anneaux(f).map((a) => "M" + a.slice(0, -1).map((p) => proj(p).join(" ")).join("L") + "Z").join("");

const xml = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const noms = Object.fromEntries(departements.map((d) => [d.id, d.nom]));
const trait = 4.2;
const corps = [...ids.entries()].sort(([a], [b]) => (a < b ? -1 : 1))
  .map(([id, f]) => `<path id="${id}" class="departement" d="${chemin(f)}"><title>${xml(noms[id])}</title></path>`).join("\n");
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${L + 2 * marge} ${H + 2 * marge}" role="img">
<title>Carte du Bénin par départements</title>
<desc>Douze départements, contours simplifiés et illustratifs, état de ${source.anneeRepresentee}, sans valeur cartographique. ${xml(source.attribution)}</desc>
<style>.departement{fill:${palette.chaume.hex};stroke:${palette.encre.hex};stroke-width:${trait};stroke-linejoin:bevel;fill-rule:evenodd}</style>
${corps}
</svg>
`;

const sortie = join(racine, "assets", "carte", "benin-departements.svg");
const readme = `# Carte du Bénin par départements

Fichiers générés par \`scripts/build-carte.mjs\`, sauf \`source.json\` et les contours d'origine. Ne pas modifier à la main.

**C'est un asset du site, pas un fichier du paquet.** Les paquets \`benin-geo\` ne contiennent aucune géométrie : un test le garde.

## Attribution (à reproduire partout où la carte est publiée)

> ${source.attribution}

## Source

| | |
|---|---|
| Fichier | \`${source.fichier}\`, ${source.octets} octets |
| SHA-256 | \`${source.sha256}\` |
| Origine | ${source.url} |
| Jeu | ${source.boundaryID}, producteur ${source.producteur}, année représentée ${source.anneeRepresentee} |
| Source originale | ${source.sourceOriginale} |
| Téléchargé le | ${source.dateTelechargement} |

## Licence

- Licence déclarée par geoBoundaries pour ce jeu précis : **${source.licenceDeclaree}** (champ \`boundaryLicense\` des métadonnées archivées).
- Licence de la base : ${source.licenceBase}. Nous attribuons dans tous les cas.
- Le cadrage supposait une licence CC BY pour geoBoundaries. Pour ce jeu, la métadonnée dit domaine public, mais elle renvoie vers Wikimedia Commons sans nommer le fichier : nous n'avons pas pu vérifier cette mention à la source primaire.
- La carte ne sert qu'à l'illustration. Elle représente l'état de ${source.anneeRepresentee}, avec des contours simplifiés.

## Écarts connus du fichier d'origine

${source.ecartsConnus.map((e) => "- " + e).join("\n")}
`;
const sorties = { [sortie]: svg, [join(racine, "assets", "carte", "README.md")]: readme };
let ecarts = 0;
for (const [chem, contenu] of Object.entries(sorties)) {
  if (verifier) {
    if (!existsSync(chem) || readFileSync(chem, "utf8") !== contenu) { console.error("écart :", chem); ecarts += 1; }
  } else writeFileSync(chem, contenu);
}
if (verifier) process.exit(ecarts ? 1 : 0);
console.log(`carte générée : ${ids.size} départements, ${(svg.length / 1024).toFixed(1)} Ko, ${L + 2 * marge} x ${H + 2 * marge}`);
