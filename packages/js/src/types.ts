export type Confiance = "officielle" | "derivee" | "provisoire";

export type Niveau = "departement" | "commune" | "arrondissement";

/** Ce que chaque enregistrement dit de lui-même : d'où vient la donnée et avec quelle confiance. */
export interface Provenance {
  /** Identifiant d'une entrée de `sources`. */
  readonly source: string;
  /** Date du relevé, AAAA-MM-JJ. */
  readonly releveLe: string;
  readonly confiance: Confiance;
}

export interface Departement extends Provenance {
  readonly id: string;
  readonly type: "departement";
  readonly nom: string;
  /** Clé de tri : sans accents, minuscules, sans article initial « Les ». */
  readonly tri: string;
  readonly parent: null;
  readonly alias?: readonly string[];
}

export interface Commune extends Provenance {
  readonly id: string;
  readonly type: "commune";
  readonly nom: string;
  readonly tri: string;
  /** Identifiant du département. */
  readonly parent: string;
  /** Variantes d'orthographe relevées dans les sources, telles quelles. */
  readonly alias?: readonly string[];
}

/**
 * Arrondissement selon l'annexe de la loi n°2013-05 (état de 2013). Le niveau est provisoire tant que les
 * modifications postérieures n'ont pas été recherchées.
 */
export interface Arrondissement extends Provenance {
  /** `BJ-<dép>-<com>-<NN>` : NN est stable, il ne change jamais et n'est jamais réattribué. */
  readonly id: string;
  readonly type: "arrondissement";
  /** Nom affiché. Voir `graphie` pour savoir si les accents sont vérifiés. */
  readonly nom: string;
  readonly tri: string;
  /** Identifiant de la commune. */
  readonly parent: string;
  readonly provisoire: boolean;
  /**
   * `attestee` : écrit ainsi par la loi (arrondissement numéroté) ou attesté par un village homonyme du même
   * arrondissement. `deduite-du-libelle` : majuscules de la loi remises en casse de titre, accents non vérifiables.
   */
  readonly graphie: "attestee" | "deduite-du-libelle";
  /** Libellé imprimé dans la loi (majuscules sans accents). Absent pour les arrondissements numérotés. */
  readonly libelleLoi?: string;
}

/** Forme compacte embarquée dans le paquet, pour ne pas répéter les champs communs 546 fois. */
export interface ArrondissementsCompacts {
  readonly commun: { readonly source: string; readonly releveLe: string; readonly confiance: Confiance; readonly provisoire: boolean };
  readonly groupes: readonly (readonly [string, readonly (readonly [number, string, string, 0 | 1, string | null])[]])[];
}

export interface Pole {
  readonly id: string;
  readonly nom: string;
  /** Null quand aucun chef-lieu n'est confirmé (Grand-Nokoué). */
  readonly chefLieu: string | null;
  /** Identifiants de communes : chef-lieu en tête, puis ordre du champ `tri`. */
  readonly communes: readonly string[];
  readonly source: string;
  readonly confiance: Confiance;
}

/** Le calque des pôles est daté et versionné à part des autres niveaux. */
export interface CalquePoles {
  readonly effectifAu: string;
  readonly provisoire: boolean;
}

export interface Source {
  readonly intitule: string;
  readonly editeur: string;
  readonly auteur?: string;
  readonly nature: string;
  readonly datePublication: string | null;
  readonly url: string | null;
  readonly urlsComplementaires?: readonly string[];
  readonly dateReleve: string;
  readonly sha256: string | null;
  readonly archive: string | null;
  readonly extrait?: string;
  readonly confiance: Confiance;
  readonly note: string;
}

export interface Hierarchie {
  /** Pôle de la commune. Null pour un département : Atlantique et Ouémé sont répartis sur deux pôles. */
  readonly pole: Pole | null;
  readonly departement: Departement;
  readonly commune: Commune | null;
  readonly arrondissement: Arrondissement | null;
}
