/**
 * Carte interactive des départements, sans une ligne de JavaScript.
 *
 * Les tracés viennent de assets/carte/benin-departements.svg (voir son attribution), les chiffres de data/.
 * Le survol et le focus clavier d'un département allument son tracé et affichent sa fiche : tout se joue
 * dans le CSS (sélecteur :has), donc aucun script, aucun cookie, et la politique de sécurité reste stricte.
 * Les départements apparaissent en cascade du nord au sud.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { donnees } from "./donnees.mjs";
import { esc } from "./layout.mjs";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const svg = readFileSync(join(racine, "assets", "carte", "benin-departements.svg"), "utf8");
const viewBox = /viewBox="([^"]+)"/.exec(svg)[1];
const [, , largeur, hauteur] = viewBox.split(" ").map(Number);

const tracés = [...svg.matchAll(/<path id="([^"]+)" class="departement" d="([^"]+)">/g)].map(([, id, d]) => {
  const nombres = d.match(/-?\d+(?:\.\d+)?/g).map(Number);
  const ys = nombres.filter((_, i) => i % 2 === 1);
  return { id, d, nord: ys.reduce((a, b) => a + b, 0) / ys.length };
});
tracés.sort((a, b) => a.nord - b.nord);

const { departements, communes, arrondissements, poles } = donnees;
const polesDe = (dep) => poles.filter((p) => p.communes.some((c) => c.startsWith(dep + "-"))).map((p) => p.nom);
const fiches = new Map(
  departements.map((d) => [d.id, {
    nom: d.nom,
    communes: communes.filter((c) => c.parent === d.id).length,
    arrondissements: arrondissements.filter((a) => a.id.startsWith(d.id + "-")).length,
    poles: polesDe(d.id),
  }]),
);
const pluriel = (n, un, plusieurs) => `${n} ${n > 1 ? plusieurs : un}`;

export const styleCarte = `
  .carte-i{display:grid;gap:18px;justify-items:center}
  .carte-svg{width:100%;max-width:300px;height:auto;display:block;overflow:visible}
  .dept{cursor:pointer;outline:none;animation:surgit .7s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--i) * 85ms + 250ms);
    transform-box:fill-box;transform-origin:center}
  .dept path{fill:var(--tk-secondaire);stroke:var(--tk-texte);stroke-width:4.2;stroke-linejoin:bevel;fill-rule:evenodd;
    transition:fill .25s,stroke-width .25s}
  .dept:hover path,.dept:focus path{fill:var(--tk-accent);stroke-width:7}
  .dept:hover,.dept:focus{transform:translateY(-5px);transition:transform .25s cubic-bezier(.2,.8,.2,1)}
  .infos{width:100%;min-height:118px;border:4px solid var(--tk-texte);padding:14px 16px;font-size:15px;line-height:1.5;position:relative}
  .info{display:none}
  .info-defaut{display:block}
  .info b{font-family:var(--tk-font-titre);font-weight:400;font-size:22px;display:block;line-height:1.15;margin-bottom:4px}
  .info .id{border:0;padding:0;font-size:13px}
  .carte-i:has(.dept:hover,.dept:focus) .info-defaut{display:none}
  @keyframes surgit{from{opacity:0;transform:translateY(22px) scale(.94)}to{opacity:1;transform:none}}
`;

/** Une règle par département : sa fiche s'affiche quand son tracé est survolé ou focalisé. */
export const regles = [...fiches.keys()]
  .map((id) => `.carte-i:has(#${id}:hover,#${id}:focus) #i-${id}{display:block}`)
  .join("\n  ");

export function carteInteractive() {
  const paths = tracés
    .map((t, i) => {
      const f = fiches.get(t.id);
      const resume = `${f.nom} : ${pluriel(f.communes, "commune", "communes")}, ${pluriel(f.arrondissements, "arrondissement", "arrondissements")}`;
      return `<g class="dept" id="${t.id}" style="--i:${i}" tabindex="0" role="img" aria-label="${esc(resume)}"><title>${esc(f.nom)}</title><path d="${t.d}"/></g>`;
    })
    .join("\n      ");
  const blocs = [...fiches.entries()]
    .map(([id, f]) => `<div class="info" id="i-${id}"><b>${esc(f.nom)}</b>${pluriel(f.communes, "commune", "communes")} · ${pluriel(f.arrondissements, "arrondissement", "arrondissements")}<br>${f.poles.length > 1 ? "Pôles" : "Pôle"} : ${esc(f.poles.join(", "))}<br><code class="id">${id}</code></div>`)
    .join("\n      ");
  return `<div class="carte-i">
    <svg class="carte-svg" viewBox="${viewBox}" width="300" height="${Math.round((300 * hauteur) / largeur)}" role="group" aria-label="Carte du Bénin découpée en ses douze départements">
      <title>Carte du Bénin par départements</title>
      ${paths}
    </svg>
    <div class="infos">
      <div class="info info-defaut"><b>Survolez la carte</b>Ou parcourez-la au clavier avec la touche Tab : chaque département affiche ses communes, ses arrondissements et son pôle.</div>
      ${blocs}
    </div>
  </div>`;
}
