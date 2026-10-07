// Exécute un jeu de requêtes sur le paquet JS construit (dist) et imprime les identifiants obtenus.
// Sert au test croisé JS/Python : stdin = { chercher: [[requete, niveau|null, dans|null], ...], ids: [...], departements: [...], communes: [...] }.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const b = await import(pathToFileURL(join(racine, "packages", "js", "dist", "index.js")).href);
const entree = JSON.parse(readFileSync(0, "utf8"));
const idsDe = (liste) => liste.map((e) => e.id);

console.log(JSON.stringify({
  chercher: entree.chercher.map(([q, niveau, dans]) => idsDe(b.chercher(q, { ...(niveau ? { niveau } : {}), ...(dans ? { dans } : {}) }))),
  par_id: entree.ids.map((i) => b.parId(i)?.id ?? null),
  hierarchie: entree.ids.map((i) => {
    const h = b.hierarchie(i);
    return h ? [h.pole?.id ?? null, h.departement.id, h.commune?.id ?? null, h.arrondissement?.id ?? null] : null;
  }),
  poles_de: entree.ids.map((i) => idsDe(b.polesDe(i))),
  communes_de: entree.departements.map((d) => idsDe(b.communesDe(d))),
  arrondissements_de: entree.communes.map((c) => idsDe(b.arrondissementsDe(c))),
  version: b.default?.version ?? null,
}));
