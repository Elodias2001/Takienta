import { describe, expect, it } from "vitest";
import { arrondissementsDe, chercher, communes, communesDe, hierarchie, parId, polesDe } from "../src/index";

describe("communesDe, parId, hierarchie, polesDe", () => {
  it("liste les communes du Borgou, triées", () => {
    const noms = communesDe("BJ-BO").map((c) => c.nom);
    expect(noms).toEqual(["Bembèrèkè", "Kalalé", "N'Dali", "Nikki", "Parakou", "Pèrèrè", "Sinendé", "Tchaourou"]);
    expect(communesDe("BJ-XX")).toEqual([]);
  });

  it("parId trouve un enregistrement de chaque niveau", () => {
    expect(parId("BJ-AL-KAN")?.id).toBe("BJ-AL-KAN");
    expect(parId("BJ-AL")?.id).toBe("BJ-AL");
    expect(parId("PO-GN")?.id).toBe("PO-GN");
    expect(parId("inconnu")).toBeUndefined();
  });

  it("hierarchie d'une commune : pôle, département, commune", () => {
    const h = hierarchie("BJ-AQ-ABO");
    expect(h?.pole?.id).toBe("PO-GN");
    expect(h?.departement.id).toBe("BJ-AQ");
    expect(h?.commune?.nom).toBe("Abomey-Calavi");
    expect(hierarchie("BJ-AQ-ALL")?.pole?.id).toBe("PO-SO");
  });

  it("hierarchie d'un département n'invente pas de pôle unique", () => {
    expect(hierarchie("BJ-AQ")).toMatchObject({ pole: null, commune: null });
    expect(hierarchie("PO-GN")).toBeUndefined();
  });

  it("arrondissementsDe liste ceux d'une commune dans l'ordre des identifiants", () => {
    const noms = arrondissementsDe("BJ-AL-KAN").map((a) => a.nom);
    expect(noms).toEqual(["Angaradébou", "Bensékou", "Donwari", "Kandi 1", "Kandi 2", "Kandi 3", "Kassakou", "Saah", "Sam", "Sonsoro"]);
    expect(arrondissementsDe("BJ-XX")).toEqual([]);
  });

  it("parId trouve un arrondissement, hierarchie remonte jusqu'au pôle", () => {
    expect(parId("BJ-AL-KAN-04")).toMatchObject({ type: "arrondissement", nom: "Kandi 1", parent: "BJ-AL-KAN" });
    const h = hierarchie("BJ-AL-KAN-04");
    expect([h?.pole?.id, h?.departement.id, h?.commune?.id, h?.arrondissement?.id]).toEqual(["PO-NE", "BJ-AL", "BJ-AL-KAN", "BJ-AL-KAN-04"]);
    expect(hierarchie("BJ-AL-KAN")?.arrondissement).toBeNull();
    expect(hierarchie("BJ-LI-COT-13")?.pole?.id).toBe("PO-GN");
  });

  it("polesDe d'un arrondissement : le pôle de sa commune", () => {
    expect(polesDe("BJ-AQ-ABO-01").map((p) => p.id)).toEqual(["PO-GN"]);
    expect(polesDe("BJ-AQ-ALL-01").map((p) => p.id)).toEqual(["PO-SO"]);
  });

  it("polesDe : deux pôles pour l'Atlantique et l'Ouémé, un seul ailleurs", () => {
    expect(polesDe("BJ-AQ").map((p) => p.id)).toEqual(["PO-SO", "PO-GN"]);
    expect(polesDe("BJ-OU").map((p) => p.id)).toEqual(["PO-SE", "PO-GN"]);
    expect(polesDe("BJ-AL").map((p) => p.id)).toEqual(["PO-NE"]);
    expect(polesDe("BJ-AL-KAN").map((p) => p.id)).toEqual(["PO-NE"]);
  });
});

describe("chercher", () => {
  const ids = (q: string, o?: Parameters<typeof chercher>[1]) => chercher(q, o).map((e) => e.id);

  it("« abomey calavi » sans accent ni tiret, comme la saisie réelle", () => {
    expect(ids("abomey calavi")).toEqual(["BJ-AQ-ABO"]);
    expect(ids("Abomey-Calavi")).toEqual(["BJ-AQ-ABO"]);
    expect(ids("ABOMEY CALAVI")).toEqual(["BJ-AQ-ABO"]);
    expect(ids("abomeycalavi")).toEqual(["BJ-AQ-ABO"]);
  });

  it("l'égalité passe avant le préfixe : « abomey » met Abomey avant Abomey-Calavi", () => {
    expect(ids("abomey")).toEqual(["BJ-ZO-ABO", "BJ-AQ-ABO"]);
  });

  it("Sèmè, seme et Sèmè-Kpodji fonctionnent", () => {
    for (const q of ["sèmè", "seme", "Sèmè-Kpodji", "seme kpodji"]) expect(ids(q)).toEqual(["BJ-OU-SEM"]);
  });

  it("« seme podji » fonctionne parce que Sème-Podji est un alias relevé, pas par approximation", () => {
    expect(ids("seme podji")).toEqual(["BJ-OU-SEM"]);
    expect(ids("seme pdji")).toEqual([]);
  });

  it("apostrophe : N'Dali, ndali, n dali", () => {
    for (const q of ["N'Dali", "ndali", "n dali"]) expect(ids(q)).toEqual(["BJ-BO-NDA"]);
  });

  it("retrouve chaque nom depuis sa forme sans accent et sans tiret", () => {
    for (const e of [...communes]) {
      const sansAccent = e.nom.normalize("NFD").replace(/\p{M}/gu, "").replace(/[-']/g, " ").toLowerCase();
      expect(ids(sansAccent)[0], e.nom).toBe(e.id);
    }
  });

  it("les arrondissements ne sont cherchés que sur demande", () => {
    expect(chercher("kandi").every((e) => e.type !== "arrondissement")).toBe(true);
    expect(ids("kandi 1", { niveau: "arrondissement" })).toEqual(["BJ-AL-KAN-04"]);
    expect(ids("angaradebou", { niveau: "arrondissement" })).toEqual(["BJ-AL-KAN-01"]);
  });

  it("« 1er arrondissement » est ambigu sans commune, précis avec `dans`", () => {
    expect(ids("1er arrondissement", { niveau: "arrondissement" })).toHaveLength(3);
    expect(ids("1er arrondissement", { niveau: "arrondissement", dans: "BJ-LI-COT" })).toEqual(["BJ-LI-COT-01"]);
    expect(ids("1er arrondissement", { niveau: "arrondissement", dans: "BJ-OU-POR" })).toEqual(["BJ-OU-POR-01"]);
  });

  it("`dans` restreint à un département ou une commune, sans confondre Savalou et Savè", () => {
    expect(ids("savalou", { niveau: "commune", dans: "BJ-CO" })).toEqual(["BJ-CO-SAVA"]);
    const dansSavalou = chercher("a", { niveau: "arrondissement", dans: "BJ-CO-SAVA" });
    expect(dansSavalou.length).toBeGreaterThan(0);
    expect(dansSavalou.every((e) => e.id.startsWith("BJ-CO-SAVA-"))).toBe(true);
  });

  it("requête vide ou inconnue : liste vide", () => {
    expect(chercher("")).toEqual([]);
    expect(chercher("  - ")).toEqual([]);
    expect(chercher("zzzzzz")).toEqual([]);
  });

  it("filtre par niveau", () => {
    expect(ids("zou", { niveau: "departement" })).toEqual(["BJ-ZO"]);
    expect(ids("littoral", { niveau: "commune" })).toEqual([]);
  });
});
