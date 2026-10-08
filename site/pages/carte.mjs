import { site } from "../config.mjs";
import { donnees } from "../donnees.mjs";
import { coquille, esc } from "../layout.mjs";
import { TEINTES, arrondissementsDe, nomDepartement, poleDe, ratioCommunes, sourceCommunes, traces, viewBoxCommunes, commune } from "../communes.mjs";

const { poles, communes, calquePoles } = donnees;
const pluriel = (n, un, plusieurs) => `${n} ${n > 1 ? plusieurs : un}`;
const nomPole = Object.fromEntries(poles.map((p) => [p.id, p.nom]));

const style = `
  .tete{padding:52px 0 36px;border-bottom:4px solid var(--tk-texte)}
  .tete h1{margin-bottom:18px}
  .carte-c{display:grid;grid-template-columns:minmax(0,340px) minmax(0,1fr);gap:36px;align-items:start;padding:44px 0 24px}
  @media (max-width:820px){.carte-c{grid-template-columns:minmax(0,1fr)}}
  .carte-c svg{width:100%;height:auto;display:block;overflow:visible}
  .commune{cursor:pointer;outline:none;stroke:var(--tk-fond);stroke-width:2.4;stroke-linejoin:bevel;fill-rule:evenodd;
    animation:surgit .6s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--i) * 14ms + 150ms);transition:opacity .2s,stroke .2s,stroke-width .2s}
  ${Object.entries(TEINTES).map(([id, t]) => `.p-${id}{fill:${t}}`).join("\n  ")}
  .commune:hover,.commune:focus{stroke:var(--tk-texte);stroke-width:5}
  .lateral{display:grid;gap:22px;align-content:start}
  .infos{border:4px solid var(--tk-texte);padding:16px 18px;min-height:176px;font-size:15px;line-height:1.55;position:relative;background:var(--tk-fond)}
  .info{display:none}
  .info-defaut{display:block}
  .info b{font-family:var(--tk-font-titre);font-weight:400;font-size:24px;display:block;line-height:1.15;margin-bottom:6px}
  .info .id{border:0;padding:0;font-size:13px;white-space:nowrap}
  .carte-c:has(.commune:hover,.commune:focus,.leg:hover,.leg:focus) .info-defaut{display:none}
  .legende-p{list-style:none;margin:0;padding:0;display:grid;gap:8px}
  .leg{display:flex;gap:12px;align-items:center;border:4px solid var(--tk-texte);padding:8px 12px;cursor:pointer;outline:none;font-weight:600;
    transition:transform .15s,box-shadow .15s;background:var(--tk-fond)}
  .leg:hover,.leg:focus{transform:translate(-3px,-3px);box-shadow:6px 6px 0 var(--tk-texte)}
  .leg .puce{flex:none;width:26px;height:26px;border:3px solid var(--tk-texte)}
  .leg small{margin-left:auto;font-weight:500;font-size:13.5px}
  ${Object.entries(TEINTES).map(([id, t]) => `.puce.p-${id}{background:${t}}`).join("\n  ")}
  .carte-c:has(.leg:hover,.leg:focus) .commune{opacity:.22}
  ${poles.map((p) => `.carte-c:has(#l-${p.id}:hover,#l-${p.id}:focus) .p-${p.id}.commune{opacity:1;stroke:var(--tk-texte);stroke-width:3.4}`).join("\n  ")}
  ${poles.map((p) => `.carte-c:has(#l-${p.id}:hover,#l-${p.id}:focus) #ip-${p.id}{display:block}`).join("\n  ")}
  ${communes.map((c) => `.carte-c:has(#${c.id}:hover,#${c.id}:focus) #i-${c.id}{display:block}`).join("\n  ")}
  .note{font-size:14.5px;max-width:46em}
  @keyframes surgit{from{opacity:0;transform:translateY(14px)}}
`;

const chemins = traces
  .map((t, i) => {
    const c = commune[t.id];
    const p = poleDe(t.id);
    const resume = `${c.nom}, département ${nomDepartement[c.parent]}, pôle ${p ? p.nom : "inconnu"}`;
    return `<path id="${t.id}" class="commune p-${p.id}" style="--i:${i}" tabindex="0" role="img" aria-label="${esc(resume)}" d="${t.d}"><title>${esc(c.nom)}</title></path>`;
  })
  .join("\n        ");

const fichesCommunes = communes
  .map((c) => {
    const p = poleDe(c.id);
    const n = arrondissementsDe(c.id).length;
    return `<div class="info" id="i-${c.id}"><b>${esc(c.nom)}</b>${esc(nomDepartement[c.parent])} · ${pluriel(n, "arrondissement", "arrondissements")}<br>Pôle : ${esc(p.nom)} <span class="badge provisoire">provisoire</span><br><code class="id">${c.id}</code></div>`;
  })
  .join("\n        ");

const fichesPoles = poles
  .map((p) => {
    const chef = p.chefLieu ? `Chef-lieu : ${esc(commune[p.chefLieu].nom)}` : "Chef-lieu : non confirmé";
    return `<div class="info" id="ip-${p.id}"><b>${esc(p.nom)}</b>${pluriel(p.communes.length, "commune", "communes")}<br>${chef}<br><code class="id">${p.id}</code></div>`;
  })
  .join("\n        ");

const legende = poles
  .map((p) => `<li class="leg" id="l-${p.id}" tabindex="0"><span class="puce p-${p.id}" aria-hidden="true"></span>${esc(p.nom)}<small>${pluriel(p.communes.length, "commune", "communes")}</small></li>`)
  .join("\n          ");

const corps = `<div class="wrap">
  <section class="tete">
    <p class="kicker">Carte</p>
    <h1>Les ${communes.length} communes, rangées par pôle</h1>
    <p class="chapo">Survolez une commune, ou parcourez-la au clavier avec la touche Tab : elle affiche son département, ses arrondissements et son pôle.
      Survolez un pôle de la légende pour l'isoler.</p>
  </section>

  <section class="carte-c" aria-label="Carte des communes du Bénin colorées par pôle de développement">
    <figure style="margin:0">
      <svg viewBox="${viewBoxCommunes}" width="340" height="${Math.round(340 * ratioCommunes)}" role="group" aria-label="Carte du Bénin découpée en ses ${communes.length} communes">
        <title>Carte du Bénin par communes, colorées par pôle</title>
        ${chemins}
      </svg>
      <figcaption class="note">${esc(sourceCommunes.attribution)} Contours de ${esc(sourceCommunes.anneeRepresentee)}, simplifiés : illustration seulement.</figcaption>
    </figure>
    <div class="lateral">
      <div class="infos">
        <div class="info info-defaut"><b>Survolez la carte</b>Chaque commune affiche son département, son nombre d'arrondissements et son pôle. Les couleurs sont celles des ${poles.length} pôles.</div>
        ${fichesCommunes}
        ${fichesPoles}
      </div>
      <ul class="legende-p" aria-label="Pôles de développement">
          ${legende}
      </ul>
      <p class="note"><span class="badge provisoire">provisoire</span> Les pôles viennent d'un communiqué du 23 septembre 2026 (calque du ${esc(calquePoles.effectifAu)}) : aucun décret n'a été retrouvé.
        La composition est recoupée, mais elle peut changer. Les contours datent de ${esc(sourceCommunes.anneeRepresentee)} et ne servent qu'à illustrer.</p>
      <p><a href="/comparer">Comparer deux communes</a> · <a href="/provenance">Voir la provenance des données</a></p>
    </div>
  </section>
</div>`;

export default coquille({
  titre: `${site.nom} : la carte des communes et des pôles du Bénin`,
  description: `Les ${communes.length} communes du Bénin colorées par pôle de développement, avec leur département, leurs arrondissements et le statut provisoire des pôles.`,
  chemin: "/carte",
  styleEnPlus: style,
  corps,
});
