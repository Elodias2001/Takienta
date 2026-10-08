/**
 * Le schéma de l'emboîtement : les quatre niveaux de données comme les quatre murs de l'emblème,
 * et l'anatomie d'un identifiant. Sans JavaScript : le survol d'un niveau allume son segment d'identifiant, et réciproquement.
 */
import { donnees } from "./donnees.mjs";
import { esc } from "./layout.mjs";

const C = 220;
const cadre = (h, c) => {
  const a = C - h, b = C + h;
  return [[a + c, a], [b - c, a], [b, a + c], [b, b - c], [b - c, b], [a + c, b], [a, b - c], [a, a + c]].map((p) => p.join(",")).join(" ");
};

const { compte, exemple, departements, communes, arrondissements } = donnees;
const [, depCode, comCode, numero] = /^BJ-([A-Z]{2})-([A-Z]{2,4})-(\d{2})$/.exec(exemple.id);
const dep = departements.find((d) => d.id === `BJ-${depCode}`);
const com = communes.find((c) => c.id === `BJ-${depCode}-${comCode}`);

const niveaux = [
  { cle: "pole", h: 205, c: 44, trait: 10, n: compte.poles, mot: "pôles", y: 52 },
  { cle: "dep", h: 148, c: 34, trait: 9, n: compte.departements, mot: "départements", y: 107 },
  { cle: "com", h: 96, c: 24, trait: 8, n: compte.communes, mot: "communes", y: 159 },
];

export const styleEmboitement = `
  .emb{display:grid;grid-template-columns:minmax(0,420px) minmax(0,1fr);gap:44px;align-items:center}
  .emb-svg{width:100%;height:auto;display:block}
  .niv{cursor:pointer;outline:none}
  .niv polygon{fill:none;stroke:var(--tk-texte);stroke-linejoin:miter;transition:stroke .25s,stroke-width .25s}
  .niv .noyau{fill:var(--tk-texte);stroke:none;transition:fill .25s}
  .niv text{fill:var(--tk-texte);font-family:var(--tk-font-texte);font-weight:700;font-size:15px;text-anchor:middle;pointer-events:none}
  .niv .nb{font-family:var(--tk-font-titre);font-weight:400;font-size:26px}
  .niv:hover polygon,.niv:focus polygon{stroke:var(--tk-accent)}
  .niv:hover .noyau,.niv:focus .noyau{fill:var(--tk-accent)}
  .anatomie{font-size:clamp(22px,4.4vw,34px);margin:6px 0 18px}
  .anatomie .id{border:0;padding:0;font-size:inherit}
  .seg{display:inline-block;border-bottom:6px solid var(--tk-texte);padding:0 2px;transition:background .25s,color .25s}
  .s-dep{border-bottom-color:var(--tk-accent)}
  .s-com{border-bottom-color:var(--tk-signal)}
  .legende-id{list-style:none;padding:0;margin:0 0 16px;display:grid;gap:8px;font-size:15.5px}
  .legende-id li{padding-left:14px;border-left:6px solid var(--tk-texte)}
  .legende-id .l-dep{border-left-color:var(--tk-accent)}
  .legende-id .l-com{border-left-color:var(--tk-signal)}
  .emb:has(#n-pole:hover,#n-pole:focus) .note-pole{background:var(--tk-texte);color:var(--tk-fond)}
  .emb:has(#n-dep:hover,#n-dep:focus) .s-dep,.emb:has(#n-com:hover,#n-com:focus) .s-com,.emb:has(#n-arr:hover,#n-arr:focus) .s-arr{background:var(--tk-texte);color:var(--tk-fond)}
  .emb:has(.s-dep:hover) #n-dep polygon{stroke:var(--tk-accent)}
  .emb:has(.s-com:hover) #n-com polygon{stroke:var(--tk-accent)}
  .emb:has(.s-arr:hover) #n-arr .noyau{fill:var(--tk-accent)}
  .note-pole{border:3px solid var(--tk-texte);padding:8px 12px;font-size:14.5px;transition:background .25s,color .25s}
  @media (max-width:820px){.emb{grid-template-columns:minmax(0,1fr);gap:26px}.emb-svg{max-width:380px;margin:0 auto}}
  @supports (animation-timeline:view()){
    .niv polygon:not(.noyau){stroke-dasharray:1;animation:trace linear both;animation-timeline:view();animation-range:entry 5% entry 70%}
    .niv .noyau{animation:noyau linear both;animation-timeline:view();animation-range:entry 40% entry 90%;transform-box:fill-box;transform-origin:center}
    #n-dep polygon{animation-range:entry 12% entry 76%}
    #n-com polygon{animation-range:entry 20% entry 82%}
  }
  @keyframes trace{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
  @keyframes noyau{from{opacity:0;transform:scale(.2)}to{opacity:1;transform:none}}
`;

export function emboitement() {
  const cadres = niveaux
    .map((n) => `<g class="niv" id="n-${n.cle}" tabindex="0" role="img" aria-label="${n.n} ${n.mot}">
        <polygon pathLength="1" points="${cadre(n.h, n.c)}" stroke-width="${n.trait}"/>
        <text x="${C}" y="${n.y}"><tspan class="nb">${n.n}</tspan> <tspan>${n.mot}</tspan></text>
      </g>`)
    .join("\n      ");
  return `<div class="emb">
    <svg class="emb-svg" viewBox="0 0 440 440" role="group" aria-label="Les quatre niveaux emboîtés : pôles, départements, communes, arrondissements">
      <title>Pôles, départements, communes et arrondissements, emboîtés</title>
      ${cadres}
      <g class="niv" id="n-arr" tabindex="0" role="img" aria-label="${compte.arrondissements} arrondissements">
        <polygon class="noyau" points="${cadre(44, 12)}"/>
        <text x="${C}" y="${C - 2}" style="fill:var(--tk-fond)"><tspan class="nb" style="fill:var(--tk-fond)">${compte.arrondissements}</tspan></text>
        <text x="${C}" y="${C + 20}" style="fill:var(--tk-fond);font-size:11px">arrond.</text>
      </g>
    </svg>
    <div>
      <p>Un pôle contient des départements, qui contiennent des communes, qui contiennent des arrondissements : c'est le plan d'une takienta, et celui du modèle de données. L'identifiant d'un arrondissement le dit tout seul.</p>
      <p class="anatomie"><code class="id"><span class="seg">BJ</span>-<span class="seg s-dep">${esc(depCode)}</span>-<span class="seg s-com">${esc(comCode)}</span>-<span class="seg s-arr">${esc(numero)}</span></code></p>
      <ul class="legende-id">
        <li>Le Bénin.</li>
        <li class="l-dep"><b>${esc(depCode)}</b> : ${esc(dep.nom)}, code de la norme ISO 3166-2.</li>
        <li class="l-com"><b>${esc(comCode)}</b> : ${esc(com.nom)}, les trois premières lettres de son nom.</li>
        <li><b>${esc(numero)}</b> : ${esc(exemple.nom)}, son numéro dans la commune. Il ne change jamais.</li>
      </ul>
      <p class="note-pole">Le pôle n'entre jamais dans l'identifiant : le calque des pôles est provisoire, et l'Atlantique comme l'Ouémé sont répartis sur deux pôles.</p>
    </div>
  </div>`;
}
