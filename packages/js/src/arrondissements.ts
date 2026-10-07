import { arrondissementsCompacts as c } from "./generated/arrondissements";
import type { Arrondissement } from "./types";

export type { Arrondissement } from "./types";

/** Les 546 arrondissements de l'annexe de la loi n°2013-05, dans l'ordre des identifiants. */
export const arrondissements: readonly Arrondissement[] = c.groupes.flatMap(([parent, lignes]) =>
  lignes.map(
    ([numero, nom, tri, attestee, libelleLoi]): Arrondissement => ({
      id: `${parent}-${String(numero).padStart(2, "0")}`,
      type: "arrondissement",
      nom,
      tri,
      parent,
      source: c.commun.source,
      releveLe: c.commun.releveLe,
      confiance: c.commun.confiance,
      provisoire: c.commun.provisoire,
      graphie: attestee === 1 ? "attestee" : "deduite-du-libelle",
      ...(libelleLoi === null ? {} : { libelleLoi }),
    }),
  ),
);
