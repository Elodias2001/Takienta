import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { arrondissements, calquePoles, communes, departements, poles, sources } from "../src/index";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const lire = (nom: string) => JSON.parse(readFileSync(join(racine, "data", nom), "utf8"));

describe("comptes", () => {
  it("12 départements et 77 communes", () => {
    expect(departements).toHaveLength(12);
    expect(communes).toHaveLength(77);
  });

  it("effectif par département", () => {
    const attendu = { "BJ-AL": 6, "BJ-AK": 9, "BJ-AQ": 8, "BJ-BO": 8, "BJ-CO": 6, "BJ-KO": 6, "BJ-DO": 4, "BJ-LI": 1, "BJ-MO": 6, "BJ-OU": 9, "BJ-PL": 5, "BJ-ZO": 9 };
    const reel: Record<string, number> = {};
    for (const c of communes) reel[c.parent] = (reel[c.parent] ?? 0) + 1;
    expect(reel).toEqual(attendu);
  });
});

describe("intégrité", () => {
  it("aucun doublon, aucun orphelin", () => {
    const ids = [...departements, ...communes, ...poles].map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    const deps = new Set(departements.map((d) => d.id));
    expect(communes.every((c) => deps.has(c.parent))).toBe(true);
  });

  it("chaque enregistrement porte une source déclarée dans le registre", () => {
    for (const e of [...departements, ...communes, ...poles]) {
      expect(sources[e.source], e.id).toBeDefined();
      expect(["officielle", "derivee", "provisoire"]).toContain(e.confiance);
    }
  });

  it("le paquet est identique à data/ (source unique de vérité)", () => {
    expect(JSON.parse(JSON.stringify(departements))).toEqual(lire("departements.json"));
    expect(JSON.parse(JSON.stringify(communes))).toEqual(lire("communes.json"));
    expect(JSON.parse(JSON.stringify(sources))).toEqual(lire("sources.json").sources);
  });

  it("aucun identifiant figé ne disparaît ni ne change (invariant 4)", () => {
    const reel = new Map([...departements, ...communes].map((e) => [e.id, [e.nom, e.parent]]));
    for (const i of lire("identifiants.snapshot.json").identifiants) {
      expect(reel.get(i.id), i.id).toEqual([i.nom, i.parent]);
    }
  });
});

describe("arrondissements", () => {
  it("546 arrondissements dans les 77 communes, effectif par département selon la loi", () => {
    expect(arrondissements).toHaveLength(546);
    expect(new Set(arrondissements.map((a) => a.parent))).toEqual(new Set(communes.map((c) => c.id)));
    const attendu = { "BJ-AL": 41, "BJ-AK": 47, "BJ-AQ": 74, "BJ-BO": 43, "BJ-CO": 60, "BJ-KO": 50, "BJ-DO": 26, "BJ-LI": 13, "BJ-MO": 35, "BJ-OU": 52, "BJ-PL": 29, "BJ-ZO": 76 };
    const reel: Record<string, number> = {};
    for (const a of arrondissements) reel[a.parent.slice(0, 5)] = (reel[a.parent.slice(0, 5)] ?? 0) + 1;
    expect(reel).toEqual(attendu);
  });

  it("identifiants uniques, séquentiels par commune, source déclarée, niveau provisoire", () => {
    expect(new Set(arrondissements.map((a) => a.id)).size).toBe(546);
    for (const c of communes) {
      const numeros = arrondissements.filter((a) => a.parent === c.id).map((a) => Number(a.id.slice(-2)));
      expect(numeros, c.id).toEqual(numeros.map((_, i) => i + 1));
    }
    for (const a of arrondissements) {
      expect(sources[a.source], a.id).toBeDefined();
      expect(a.provisoire).toBe(true);
    }
  });

  it("identique à data/arrondissements.json (le compactage ne perd rien)", () => {
    expect(JSON.parse(JSON.stringify(arrondissements))).toEqual(lire("arrondissements.json"));
  });

  it("aucun identifiant d'arrondissement figé ne disparaît ni ne change de commune", () => {
    const reel = new Map(arrondissements.map((a) => [a.id, a.parent]));
    for (const i of lire("identifiants-arrondissements.snapshot.json").identifiants) expect(reel.get(i.id), i.id).toBe(i.parent);
  });

  it("aucun accent inventé : une graphie déduite ne diffère du libellé de la loi que par la casse", () => {
    for (const a of arrondissements) {
      if (a.graphie === "deduite-du-libelle") expect(a.nom.toUpperCase(), a.id).toBe(a.libelleLoi);
    }
  });

  it("villes à arrondissements numérotés", () => {
    const noms = (c: string) => arrondissements.filter((a) => a.parent === c).map((a) => a.nom);
    expect(noms("BJ-LI-COT")).toHaveLength(13);
    expect(noms("BJ-BO-PAR")).toHaveLength(3);
    expect(noms("BJ-OU-POR")).toHaveLength(5);
    expect(noms("BJ-LI-COT").slice(0, 3)).toEqual(["1er Arrondissement", "2ème Arrondissement", "3ème Arrondissement"]);
    expect(noms("BJ-DO-DJO")).toEqual(expect.arrayContaining(["Djougou I", "Djougou II", "Djougou III"]));
  });
});

describe("pôles", () => {
  it("77 communes réparties sans doublon ni orphelin, effectifs 13 14 15 18 12 5", () => {
    expect(Object.fromEntries(poles.map((p) => [p.id, p.communes.length]))).toEqual({ "PO-NO": 13, "PO-NE": 14, "PO-CE": 15, "PO-SO": 18, "PO-SE": 12, "PO-GN": 5 });
    const toutes = poles.flatMap((p) => p.communes);
    expect(new Set(toutes)).toEqual(new Set(communes.map((c) => c.id)));
    expect(toutes).toHaveLength(77);
  });

  it("chef-lieu en tête, Grand-Nokoué sans chef-lieu confirmé", () => {
    for (const p of poles) {
      if (p.id === "PO-GN") expect(p.chefLieu).toBeNull();
      else expect(p.communes[0]).toBe(p.chefLieu);
    }
  });

  it("le calque est provisoire et daté", () => {
    expect(calquePoles).toEqual({ effectifAu: "2026-09-23", provisoire: true });
    expect(poles.every((p) => p.confiance === "provisoire")).toBe(true);
  });
});
