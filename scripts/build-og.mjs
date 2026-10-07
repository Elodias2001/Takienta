#!/usr/bin/env node
/**
 * Rend les vignettes de partage en PNG 1200x630 dans `site/img/og/`.
 *
 * Ces PNG sont **commités** et ce script n'est pas appelé par `build:site` :
 * il faut un Chrome, que l'image Docker n'embarque pas. On fige à la main et
 * on relance quand un titre change.
 *
 *   pnpm build:og
 */
import { mkdir, mkdtemp, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { VIGNETTES, VIGNETTE_DOCS, fichierDocs, svgVignette } from "../site/og.mjs";
import { capturer, trouverChrome } from "./chrome.mjs";

const RACINE = fileURLToPath(new URL("..", import.meta.url));
const SORTIE = join(RACINE, "site", "img", "og");
const POIDS_MAX = 300 * 1024;
const police = (fichier) => pathToFileURL(join(RACINE, "brand", "fonts", fichier)).href;

const FACES = `@font-face{font-family:'Caprasimo';font-weight:400;src:url(${police("caprasimo-latin-400-normal.woff2")}) format('woff2')}
@font-face{font-family:'Figtree Variable';font-weight:300 900;src:url(${police("figtree-latin-wght-normal.woff2")}) format('woff2-variations')}`;

// Les titres des fiches viennent de leur premier « # » : une seule source.
const docs = [];
for (const f of (await readdir(join(RACINE, "docs"))).filter((f) => f.endsWith(".md")).sort()) {
  const titre = /^#\s+(.+)$/m.exec(await readFile(join(RACINE, "docs", f), "utf8"))?.[1]?.trim() ?? basename(f, ".md");
  docs.push({ fichier: fichierDocs(f.replace(/\.md$/, ".html")), surtitre: VIGNETTE_DOCS.surtitre, lignes: coupe(titre) });
}

/** Coupe un titre en deux lignes au plus, sur une espace, pour tenir dans le cadre. */
function coupe(titre) {
  if (titre.length <= 22) return [titre];
  const milieu = titre.length / 2;
  const espaces = [...titre.matchAll(/ /g)].map((m) => m.index);
  const i = espaces.reduce((a, b) => (Math.abs(b - milieu) < Math.abs(a - milieu) ? b : a), espaces[0] ?? titre.length);
  return [titre.slice(0, i), titre.slice(i + 1)];
}

const chrome = await trouverChrome();
const dossier = await mkdtemp(join(tmpdir(), "takienta-og-"));
await mkdir(SORTIE, { recursive: true });
try {
  for (const v of [...Object.values(VIGNETTES), ...docs]) {
    const page = join(dossier, "page.html");
    await writeFile(page, `<!doctype html><meta charset="utf-8"><style>${FACES}body{margin:0}</style><body>${svgVignette(v)}</body>`);
    const sortie = join(SORTIE, v.fichier);
    await capturer(chrome, page, sortie, 1200, 630, { attentePolices: true });
    const { size } = await stat(sortie);
    if (size > POIDS_MAX) throw new Error(`${v.fichier} pèse ${size} octets, au-delà de ${POIDS_MAX}`);
    console.log(`  ✓ ${v.fichier.padEnd(34)} ${(size / 1024).toFixed(0)} Ko`);
  }
} finally {
  await rm(dossier, { recursive: true, force: true });
}
