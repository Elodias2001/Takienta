#!/usr/bin/env node
// Rend les PNG et l'ICO de la marque depuis brand/svg. À lancer à la main, jamais dans le build :
// il faut un Chrome et macOS (sips). Les fichiers produits sont commités, comme pour Récade.
//
//   node scripts/rendre-marque.mjs
//
// Chrome ne rend pas la main après --screenshot : on attend l'écriture du fichier, puis on tue.
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { capturer, trouverChrome } from "./chrome.mjs";

const racine = fileURLToPath(new URL("..", import.meta.url));
const SOURCE = 4096;

async function rendreGrand(chrome, fichierSvg, sortie, dossier) {
  const svg = await readFile(fichierSvg, "utf8");
  const page = join(dossier, "page.html");
  await writeFile(page, `<!doctype html><meta charset="utf-8"><body style="margin:0">${svg.replace("<svg ", `<svg width="${SOURCE}" height="${SOURCE}" style="display:block" `)}</body>`);
  await capturer(chrome, page, sortie, SOURCE, SOURCE);
}

/** ICO contenant des PNG : un en-tête, une entrée par image, puis les données. */
function ico(images) {
  const entete = Buffer.alloc(6);
  entete.writeUInt16LE(1, 2);
  entete.writeUInt16LE(images.length, 4);
  let decalage = 6 + 16 * images.length;
  const entrees = images.map(({ taille, png }) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(taille === 256 ? 0 : taille, 0);
    e.writeUInt8(taille === 256 ? 0 : taille, 1);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(png.length, 8);
    e.writeUInt32LE(decalage, 12);
    decalage += png.length;
    return e;
  });
  return Buffer.concat([entete, ...entrees, ...images.map((i) => i.png)]);
}

const chrome = await trouverChrome();
const dossier = await mkdtemp(join(tmpdir(), "takienta-marque-"));
const sortieDossier = join(racine, "brand", "png");
await mkdir(sortieDossier, { recursive: true });
try {
  const cibles = [
    { svg: "favicon-opaque.svg", tailles: { "favicon-16.png": 16, "favicon-32.png": 32, "favicon-48.png": 48 } },
    { svg: "apple-touch-icon.svg", tailles: { "apple-touch-icon.png": 180 } },
  ];
  for (const { svg, tailles } of cibles) {
    const grand = join(dossier, svg.replace(".svg", ".png"));
    await rendreGrand(chrome, join(racine, "brand", "svg", svg), grand, dossier);
    for (const [nom, t] of Object.entries(tailles)) {
      execFileSync("sips", ["-z", String(t), String(t), grand, "--out", join(sortieDossier, nom)], { stdio: "ignore" });
      console.log(nom, t + " px");
    }
  }
  const png = async (t) => ({ taille: t, png: await readFile(join(sortieDossier, `favicon-${t}.png`)) });
  await writeFile(join(racine, "brand", "favicon.ico"), ico([await png(16), await png(32), await png(48)]));
  console.log("favicon.ico 16, 32, 48 px");
} finally {
  await rm(dossier, { recursive: true, force: true });
}
