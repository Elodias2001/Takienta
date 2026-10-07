// Génère les paquets depuis data/ (source unique de vérité). Hors ligne, déterministe.
// Aucune donnée n'est saisie ici : tout vient de data/*.json.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const lire = (nom) => JSON.parse(readFileSync(join(racine, "data", nom), "utf8"));

// Les 546 arrondissements partagent source, date, confiance et statut : on ne les répète pas, pour tenir sous le seuil de poids.
// Ligne : [numéro dans la commune, nom, tri, 1 si graphie attestée sinon 0, libellé de la loi ou null]. Le test d'égalité avec data/ garantit l'absence de perte.
function compacterArrondissements() {
  const liste = lire("arrondissements.json");
  const commun = (({ source, releveLe, confiance, provisoire }) => ({ source, releveLe, confiance, provisoire }))(liste[0]);
  const groupes = [];
  for (const a of liste) {
    for (const [cle, valeur] of Object.entries(commun)) {
      if (a[cle] !== valeur) throw new Error(`${a.id} : ${cle} diffère du reste des arrondissements`);
    }
    if (!/^BJ-[A-Z]{2}-[A-Z]{2,4}-\d{2}$/.test(a.id) || a.id !== `${a.parent}-${a.id.slice(-2)}`) throw new Error(`${a.id} : identifiant incohérent avec son parent`);
    if (a.graphie !== "attestee" && a.graphie !== "deduite-du-libelle") throw new Error(`${a.id} : graphie inconnue`);
    let groupe = groupes.at(-1);
    if (groupe?.[0] !== a.parent) groupes.push((groupe = [a.parent, []]));
    groupe[1].push([Number(a.id.slice(-2)), a.nom, a.tri, a.graphie === "attestee" ? 1 : 0, a.libelleLoi ?? null]);
  }
  return { commun, groupes };
}

const EN_TETE = "// Fichier généré par scripts/build-data.mjs depuis data/. Ne pas modifier.\n";

function ecrireJs() {
  const dossier = join(racine, "packages", "js", "src", "generated");
  mkdirSync(dossier, { recursive: true });
  const ecrire = (fichier, importTypes, declaration) =>
    writeFileSync(join(dossier, fichier), `${EN_TETE}import type { ${importTypes} } from "../types";\n\n${declaration}\n`);

  ecrire("departements.ts", "Departement", `export const departements: readonly Departement[] = ${JSON.stringify(lire("departements.json"))};`);
  ecrire("communes.ts", "Commune", `export const communes: readonly Commune[] = ${JSON.stringify(lire("communes.json"))};`);

  ecrire("arrondissements.ts", "ArrondissementsCompacts", `export const arrondissementsCompacts: ArrondissementsCompacts = ${JSON.stringify(compacterArrondissements())};`);

  const calque = lire("poles.json");
  const { poles, ...meta } = calque;
  ecrire("poles.ts", "CalquePoles, Pole",
    `export const poles: readonly Pole[] = ${JSON.stringify(poles)};\n\nexport const calquePoles: CalquePoles = ${JSON.stringify({ effectifAu: meta.effectifAu, provisoire: meta.provisoire })};`);

  ecrire("sources.ts", "Source", `export const sources: Readonly<Record<string, Source>> = ${JSON.stringify(lire("sources.json").sources)};`);
}

function ecrirePython() {
  const dossier = join(racine, "packages", "python", "src", "benin_geo");
  mkdirSync(dossier, { recursive: true });
  const calque = lire("poles.json");
  const { poles, ...meta } = calque;
  // Chaque jeu de données est embarqué comme une chaîne JSON, relue à l'import : pas de traduction null/true/false.
  const chaine = (doc) => JSON.stringify(JSON.stringify(doc));
  const corps = [
    ["DEPARTEMENTS", lire("departements.json")],
    ["COMMUNES", lire("communes.json")],
    ["ARRONDISSEMENTS", compacterArrondissements()],
    ["POLES", poles],
    ["CALQUE_POLES", { effectifAu: meta.effectifAu, provisoire: meta.provisoire }],
    ["SOURCES", lire("sources.json").sources],
  ].map(([nom, doc]) => `${nom} = ${chaine(doc)}\n`).join("\n");
  writeFileSync(join(dossier, "_generated.py"), "# Fichier généré par scripts/build-data.mjs depuis data/. Ne pas modifier.\n\n" + corps);
}

ecrireJs();
ecrirePython();
