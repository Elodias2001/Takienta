#!/usr/bin/env node
/**
 * Construit le site statique dans `dist-site/`.
 *
 * Chaque page est un module qui exporte son HTML complet, bâti sur la coquille
 * commune (`site/layout.mjs`) et sur la source unique d'identité
 * (`site/config.mjs`). Les chiffres viennent de data/ (`site/donnees.mjs`).
 * Ajouter une page, c'est déposer un fichier dans `site/pages/` et l'inscrire
 * dans ROUTES ci-dessous.
 *
 * Les URL sont sans extension (`/provenance`) : nginx les résout via
 * `try_files $uri $uri.html`. Hors ligne, aucun appel réseau.
 */
import { access, cp, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { site } from "../site/config.mjs";
import { fiches } from "../site/docs.mjs";
import { VIGNETTES, fichierDocs } from "../site/og.mjs";

const RACINE = fileURLToPath(new URL("..", import.meta.url));
const SORTIE = join(RACINE, "dist-site");

/** Fichier de page vers chemin publié. Sert aussi à construire le sitemap. */
const ROUTES = [
  { module: "index.mjs", fichier: "index.html", url: "/", priorite: "1.0" },
  { module: "provenance.mjs", fichier: "provenance.html", url: "/provenance", priorite: "0.9" },
  { module: "a-propos.mjs", fichier: "a-propos.html", url: "/a-propos", priorite: "0.6" },
  { module: "mentions-legales.mjs", fichier: "mentions-legales.html", url: "/mentions-legales", priorite: "0.3" },
  { module: "confidentialite.mjs", fichier: "confidentialite.html", url: "/confidentialite", priorite: "0.3" },
];

await rm(SORTIE, { recursive: true, force: true });
await mkdir(join(SORTIE, "docs"), { recursive: true });

const existe = async (chemin) => access(chemin).then(() => true, () => false);

// --- vignettes : une page sans image de partage ne part pas en production ---
const documents = await fiches();
const attendues = [...Object.values(VIGNETTES).map((v) => v.fichier), ...documents.map((d) => fichierDocs(d.out))];
for (const f of attendues) {
  if (!(await existe(join(RACINE, "site", "img", "og", f)))) throw new Error(`Vignette absente : ${f}. Lancez pnpm build:og.`);
}

// --- pages ---
for (const route of ROUTES) {
  const { default: html } = await import(join(RACINE, "site", "pages", route.module));
  await writeFile(join(SORTIE, route.fichier), html, "utf8");
  console.log(`  ✓ ${route.fichier.padEnd(26)} ${route.url}`);
}

// --- documentation ---
for (const d of documents) {
  await writeFile(join(SORTIE, "docs", d.out), d.html, "utf8");
  console.log(`  ✓ docs/${d.out.padEnd(21)} ${d.chemin}`);
}

// --- fichiers statiques : tout site/ sauf le code de construction ---
// On filtre par nature, pas par liste : un `.test.mjs` oublié s'était retrouvé servi en production sur un autre projet.
const estCode = (nom) => nom === "pages" || nom.endsWith(".mjs") || nom.endsWith(".ts") || nom.endsWith(".map");
for (const entree of await readdir(join(RACINE, "site"), { withFileTypes: true })) {
  if (estCode(entree.name)) continue;
  await cp(join(RACINE, "site", entree.name), join(SORTIE, entree.name), { recursive: true });
}

// --- marque : jetons, polices, icônes ---
const depuisMarque = [
  ["palette.css", "palette.css"], ["fonts.css", "fonts.css"], ["fonts", "fonts"],
  ["svg/favicon.svg", "favicon.svg"], ["png/favicon-32.png", "favicon-32.png"],
  ["favicon.ico", "favicon.ico"], ["png/apple-touch-icon.png", "apple-touch-icon.png"],
];
for (const [src, dst] of depuisMarque) await cp(join(RACINE, "brand", src), join(SORTIE, dst), { recursive: true });

// --- carte : asset du site, avec son attribution dans la page qui l'affiche ---
await mkdir(join(SORTIE, "img"), { recursive: true });
await cp(join(RACINE, "assets", "carte", "benin-departements.svg"), join(SORTIE, "img", "benin-departements.svg"));

// --- robots.txt ---
await writeFile(join(SORTIE, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap.xml\n`, "utf8");

// --- sitemap.xml ---
const aujourdhui = new Date().toISOString().slice(0, 10);
const urls = [...ROUTES, ...documents.map((d) => ({ url: d.chemin, priorite: "0.6" }))]
  .map((r) => `  <url>\n    <loc>${site.url}${r.url}</loc>\n    <lastmod>${aujourdhui}</lastmod>\n    <priority>${r.priorite}</priority>\n  </url>`)
  .join("\n");
await writeFile(join(SORTIE, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, "utf8");

console.log(`  ✓ robots.txt · sitemap.xml (${ROUTES.length + documents.length} URL)`);
console.log("\n  site construit dans dist-site/");
