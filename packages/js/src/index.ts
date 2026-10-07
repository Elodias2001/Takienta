import { arrondissements } from "./arrondissements";
import { communes } from "./generated/communes";
import { departements } from "./generated/departements";
import { poles } from "./generated/poles";
import { normaliser } from "./normaliser";
import type { Arrondissement, Commune, Departement, Hierarchie, Niveau, Pole } from "./types";

export { arrondissements } from "./arrondissements";
export { communes } from "./generated/communes";
export { departements } from "./generated/departements";
export { calquePoles, poles } from "./generated/poles";
export { sources } from "./generated/sources";
export type * from "./types";

const departementParId = new Map<string, Departement>(departements.map((d) => [d.id, d]));
const communeParId = new Map<string, Commune>(communes.map((c) => [c.id, c]));
const arrondissementParId = new Map<string, Arrondissement>(arrondissements.map((a) => [a.id, a]));
const poleParId = new Map<string, Pole>(poles.map((p) => [p.id, p]));
const poleParCommune = new Map<string, Pole>(poles.flatMap((p) => p.communes.map((c) => [c, p] as const)));

/** Un enregistrement, quel que soit son niveau (département, commune, arrondissement ou pôle). */
export function parId(id: string): Departement | Commune | Arrondissement | Pole | undefined {
  return departementParId.get(id) ?? communeParId.get(id) ?? arrondissementParId.get(id) ?? poleParId.get(id);
}

/** Les communes d'un département, triées. Liste vide si l'identifiant est inconnu. */
export function communesDe(departementId: string): readonly Commune[] {
  return communes.filter((c) => c.parent === departementId);
}

/** Les arrondissements d'une commune, dans l'ordre des identifiants. Liste vide si l'identifiant est inconnu. */
export function arrondissementsDe(communeId: string): readonly Arrondissement[] {
  return arrondissements.filter((a) => a.parent === communeId);
}

/** Les pôles d'un département, d'une commune ou d'un arrondissement. Un département peut en avoir deux. */
export function polesDe(id: string): readonly Pole[] {
  const arrondissement = arrondissementParId.get(id);
  if (arrondissement) return polesDe(arrondissement.parent);
  const commune = communeParId.get(id);
  if (commune) return [poleParCommune.get(commune.id)].filter((p): p is Pole => p !== undefined);
  if (departementParId.has(id)) {
    const concernes = new Set(communesDe(id).flatMap((c) => poleParCommune.get(c.id) ?? []));
    return poles.filter((p) => concernes.has(p));
  }
  return [];
}

/** Pôle, département, commune et arrondissement. Undefined si l'identifiant n'est pas de l'un de ces trois niveaux. */
export function hierarchie(id: string): Hierarchie | undefined {
  const arrondissement = arrondissementParId.get(id) ?? null;
  const commune = arrondissement ? communeParId.get(arrondissement.parent) : communeParId.get(id);
  if (commune) {
    const departement = departementParId.get(commune.parent);
    if (!departement) return undefined;
    return { pole: poleParCommune.get(commune.id) ?? null, departement, commune, arrondissement };
  }
  const departement = departementParId.get(id);
  return departement ? { pole: null, departement, commune: null, arrondissement: null } : undefined;
}

export interface OptionsRecherche {
  /** Par défaut : départements et communes. Les arrondissements ne sont cherchés que sur demande. */
  readonly niveau?: Niveau;
  /** Identifiant d'un département ou d'une commune : ne garde que ce qui s'y trouve. Utile pour « 1er arrondissement ». */
  readonly dans?: string;
}

const appartient = (e: Departement | Commune | Arrondissement, ancetre: string): boolean =>
  e.id === ancetre || e.id.startsWith(ancetre + "-");

/**
 * Recherche insensible aux accents, à la casse, aux tirets et aux apostrophes.
 * Le nom et les alias relevés dans les sources sont tous cherchés. Pas de recherche floue ni phonétique :
 * « seme podji » trouve Sèmè-Kpodji parce que « Sème-Podji » est une variante relevée (alias), pas par approximation.
 * Classement : égalité, début, début de mot, contenu, puis contenu une fois les espaces retirées (« ndali », « abomeycalavi »).
 * À rang égal, ordre du champ `tri`. Les arrondissements numérotés portent le même nom d'une ville à l'autre
 * (« 1er Arrondissement ») : passer `dans` pour désigner la commune.
 */
export function chercher(requete: string, options: OptionsRecherche = {}): readonly (Departement | Commune | Arrondissement)[] {
  const q = normaliser(requete);
  if (q === "") return [];
  const compact = q.replace(/ /g, "");
  const candidats: readonly (Departement | Commune | Arrondissement)[] =
    options.niveau === "departement" ? departements
    : options.niveau === "commune" ? communes
    : options.niveau === "arrondissement" ? arrondissements
    : [...departements, ...communes];
  const trouves: { rang: number; e: Departement | Commune | Arrondissement }[] = [];
  for (const e of candidats) {
    if (options.dans !== undefined && !appartient(e, options.dans)) continue;
    let meilleur = Infinity;
    const formes = e.type === "arrondissement" ? [e.nom] : [e.nom, ...(e.alias ?? [])];
    for (const forme of formes) {
      const n = normaliser(forme);
      const rang = n === q ? 0 : n.startsWith(q) ? 1 : n.split(" ").some((mot) => mot.startsWith(q)) ? 2 : n.includes(q) ? 3 : n.replace(/ /g, "").includes(compact) ? 4 : Infinity;
      if (rang < meilleur) meilleur = rang;
    }
    if (meilleur !== Infinity) trouves.push({ rang: meilleur, e });
  }
  return trouves.sort((a, b) => a.rang - b.rang || (a.e.tri < b.e.tri ? -1 : a.e.tri > b.e.tri ? 1 : 0)).map((t) => t.e);
}
