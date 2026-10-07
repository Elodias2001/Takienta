// Capture d'écran par Chrome, partagée par les scripts qui figent des images (marque, vignettes de partage).
// Chrome ne rend pas la main après --screenshot : on attend que le fichier soit écrit et stable, puis on tue.
import { spawn } from "node:child_process";
import { access, stat } from "node:fs/promises";

const CANDIDATS = [process.env.TAKIENTA_CHROME, "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/Applications/Chromium.app/Contents/MacOS/Chromium", "/usr/bin/google-chrome", "/usr/bin/chromium"].filter(Boolean);

export async function trouverChrome() {
  for (const c of CANDIDATS) {
    try { await access(c); return c; } catch {}
  }
  throw new Error("Aucun Chromium trouvé. Donnez TAKIENTA_CHROME=/chemin/vers/chrome.");
}

const attendre = (ms) => new Promise((r) => setTimeout(r, ms));

/** Capture `page` (chemin d'un fichier HTML) dans `sortie`, à la taille de fenêtre donnée. */
export async function capturer(chrome, page, sortie, largeur, hauteur, { attentePolices = false } = {}) {
  // --virtual-time-budget laisse à Chrome le temps de charger les polices avant la capture.
  const extra = attentePolices ? ["--virtual-time-budget=3000"] : [];
  const proc = spawn(chrome, [...extra, "--headless=new", "--disable-gpu", "--allow-file-access-from-files", "--hide-scrollbars", "--force-device-scale-factor=1", `--window-size=${largeur},${hauteur}`, `--screenshot=${sortie}`, `file://${page}`], { stdio: "ignore" });
  const limite = Date.now() + 60000;
  let derniere = -1;
  while (Date.now() < limite) {
    await attendre(500);
    try {
      const { size } = await stat(sortie);
      if (size > 0 && size === derniere) break;
      derniere = size;
    } catch {}
  }
  proc.kill("SIGKILL");
  if (derniere <= 0) throw new Error("Chrome n'a pas écrit " + sortie);
}
