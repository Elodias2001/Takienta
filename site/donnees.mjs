/**
 * Les chiffres et les faits publiés sur le site viennent d'ici, lus dans data/
 * au moment de la construction. Aucun nombre n'est écrit à la main dans une
 * page : un compte qui change dans les données change partout, ou un test échoue.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const lire = (...c) => JSON.parse(readFileSync(join(racine, ...c), "utf8"));

const departements = lire("data", "departements.json");
const communes = lire("data", "communes.json");
const arrondissements = lire("data", "arrondissements.json");
const calque = lire("data", "poles.json");
const registre = lire("data", "sources.json").sources;
const carte = lire("assets", "carte", "source.json");

const distinct = (liste, champ) => [...new Set(liste.map((e) => e[champ]))].sort();
const nombre = (n) => n.toLocaleString("fr-FR").replace(/ | /g, " ");

export const donnees = {
  departements,
  communes,
  arrondissements,
  poles: calque.poles,
  calquePoles: { effectifAu: calque.effectifAu, provisoire: calque.provisoire },
  sources: registre,
  carte,
  compte: {
    departements: departements.length,
    communes: communes.length,
    arrondissements: arrondissements.length,
    poles: calque.poles.length,
    sources: Object.keys(registre).length,
    // Noms d'arrondissement dont les accents ne sont pas vérifiables.
    graphiesDeduites: arrondissements.filter((a) => a.graphie === "deduite-du-libelle").length,
  },
  confiance: {
    departements: distinct(departements, "confiance"),
    communes: distinct(communes, "confiance"),
    arrondissements: distinct(arrondissements, "confiance"),
    poles: distinct(calque.poles, "confiance"),
  },
  arrondissementsProvisoires: arrondissements.every((a) => a.provisoire === true),
  grandNokoueSansChefLieu: calque.poles.find((p) => p.id === "PO-GN")?.chefLieu === null,
  exemple: arrondissements.find((a) => a.id === "BJ-AL-KAN-04"),
  nombre,
};
