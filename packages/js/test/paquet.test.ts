import { readdirSync, readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";

const paquet = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(paquet, "dist");
const pkg = JSON.parse(readFileSync(join(paquet, "package.json"), "utf8"));
const SEUIL_OCTETS = 150 * 1024;

const jsEsm = () => readdirSync(dist).filter((f) => f.endsWith(".js"));

describe("poids", () => {
  it("l'import par défaut reste sous 150 Ko (seuil du cadrage)", () => {
    const total = jsEsm().reduce((n, f) => n + statSync(join(dist, f)).size, 0);
    expect(total).toBeLessThan(SEUIL_OCTETS);
  });

  it("le poids compressé de l'import par défaut est inférieur au brut", () => {
    const brut = readFileSync(join(dist, "index.js"));
    expect(gzipSync(brut).length).toBeLessThan(brut.length);
  });

  it("un point d'entrée par niveau reste plus léger que l'import complet", () => {
    const taille = (f: string) => statSync(join(dist, f)).size;
    const importe = (f: string) => [...new Set([...readFileSync(join(dist, f), "utf8").matchAll(/from\s*['"]\.\/(chunk-[^'"]+\.js)['"]/g)].map((m) => m[1] as string))];
    const charge = (f: string) => taille(f) + importe(f).reduce((n, c) => n + taille(c), 0);
    expect(importe("communes.js").length).toBeGreaterThan(0);
    for (const niveau of ["departements.js", "communes.js", "arrondissements.js", "poles.js"]) expect(charge(niveau), niveau).toBeLessThan(charge("index.js"));
    expect(charge("departements.js")).toBeLessThan(charge("communes.js"));
  });
});

describe("contrat du paquet", () => {
  it("zéro dépendance d'exécution (invariant 1)", () => {
    expect(pkg.dependencies ?? {}).toEqual({});
    expect(pkg.peerDependencies ?? {}).toEqual({});
  });

  it("zéro appel réseau (invariant 2)", () => {
    for (const f of jsEsm()) {
      const code = readFileSync(join(dist, f), "utf8");
      for (const interdit of ["fetch(", "XMLHttpRequest", "node:http", "node:net", "WebSocket", "sendBeacon"]) expect(code, f).not.toContain(interdit);
    }
  });

  it("ESM et CJS exposent la même API", async () => {
    const esm = await import(pathToFileURL(join(dist, "index.js")).href);
    const cjs = createRequire(import.meta.url)(join(dist, "index.cjs"));
    expect(Object.keys(cjs).sort()).toEqual(Object.keys(esm).sort());
    expect(cjs.communes).toHaveLength(77);
    expect(cjs.chercher("abomey calavi")[0].id).toBe(esm.chercher("abomey calavi")[0].id);
  });

  it("chaque point d'entrée déclaré existe et se charge", async () => {
    for (const [cle, cible] of Object.entries(pkg.exports as Record<string, unknown>)) {
      if (cle === "./package.json") continue;
      const c = cible as { import: { default: string }; require: { default: string } };
      const m = await import(pathToFileURL(join(paquet, c.import.default)).href);
      expect(Object.keys(m).length, cle).toBeGreaterThan(0);
      expect(Object.keys(createRequire(import.meta.url)(join(paquet, c.require.default))).length, cle).toBeGreaterThan(0);
    }
  });

  it("les points d'entrée par niveau exposent leurs données", async () => {
    expect((await import(pathToFileURL(join(dist, "departements.js")).href)).departements).toHaveLength(12);
    expect((await import(pathToFileURL(join(dist, "communes.js")).href)).communes).toHaveLength(77);
    expect((await import(pathToFileURL(join(dist, "arrondissements.js")).href)).arrondissements).toHaveLength(546);
    expect((await import(pathToFileURL(join(dist, "poles.js")).href)).poles).toHaveLength(6);
  });
});
