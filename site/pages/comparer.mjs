import { site } from "../config.mjs";
import { donnees } from "../donnees.mjs";
import { coquille, esc } from "../layout.mjs";
import { arrondissementsDe, commune, intituleSource, nomDepartement, parNom, poleDe, ratioCommunes, sourceCommunes, traces, viewBoxCommunes } from "../communes.mjs";

const { communes } = donnees;
const DEFAUT = { a: "BJ-AK-NAT", b: "BJ-LI-COT" };
const COTES = [
  { k: "a", libelle: "Commune A", jeton: "--tk-accent" },
  { k: "b", libelle: "Commune B", jeton: "--tk-signal" },
];

const style = `
  .tete{padding:52px 0 36px;border-bottom:4px solid var(--tk-texte)}
  .tete h1{margin-bottom:18px}
  .comp{padding:40px 0 24px;display:grid;gap:32px}
  .choix{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:22px}
  @media (max-width:700px){.choix{grid-template-columns:minmax(0,1fr)}}
  fieldset{margin:0;padding:0;border:4px solid var(--tk-texte);min-width:0}
  legend{margin-left:14px;padding:0 10px;font-family:var(--tk-font-titre);font-size:22px}
  .liste{max-height:250px;overflow-y:auto;display:grid;padding:6px}
  .liste label{position:relative;display:block;padding:7px 12px;cursor:pointer;font-weight:600;font-size:15px;border:3px solid transparent}
  .liste input{position:absolute;width:1px;height:1px;clip-path:inset(50%);pointer-events:none}
  .liste label:hover{border-color:var(--tk-texte)}
  .liste label:has(input:focus-visible){outline:3px solid var(--tk-texte);outline-offset:3px}
  .a-liste label:has(input:checked){background:var(--tk-accent);color:var(--tk-fond)}
  .b-liste label:has(input:checked){background:var(--tk-signal);color:var(--tk-fond)}
  .liste small{font-weight:500;opacity:.8;margin-left:6px}
  .resultat{display:grid;grid-template-columns:minmax(0,280px) minmax(0,1fr);gap:28px;align-items:start}
  @media (max-width:820px){.resultat{grid-template-columns:minmax(0,1fr)}}
  .mini svg{width:100%;height:auto;display:block}
  .mini .commune{fill:var(--tk-secondaire);opacity:.55;stroke:var(--tk-fond);stroke-width:2.4;stroke-linejoin:bevel;fill-rule:evenodd;transition:fill .25s,opacity .25s}
  ${communes.map((c) => `.comp:has(#a-${c.id}:checked) #m-${c.id}{fill:var(--tk-accent);opacity:1}`).join("\n  ")}
  ${communes.map((c) => `.comp:has(#b-${c.id}:checked) #m-${c.id}{fill:var(--tk-signal);opacity:1}`).join("\n  ")}
  .vs td{overflow-wrap:anywhere}
  .vs thead th.a{background:var(--tk-accent);color:var(--tk-fond)}
  .vs thead th.b{background:var(--tk-signal);color:var(--tk-fond)}
  .vs tbody th{width:11.5em;font-size:14px;overflow-wrap:normal}
  .v{display:none}
  ${communes.map((c) => `.comp:has(#a-${c.id}:checked) .va-${c.id},.comp:has(#b-${c.id}:checked) .vb-${c.id}{display:inline}`).join("\n  ")}
  .vs code{white-space:normal;overflow-wrap:anywhere;border:0;padding:0}
  .vs td{animation:glisse .35s cubic-bezier(.2,.8,.2,1)}
  .note{font-size:14.5px;max-width:46em}
  @keyframes glisse{from{opacity:.2;transform:translateY(5px)}to{opacity:1;transform:none}}
`;

const liste = (k) => `<fieldset class="${k}-liste"><legend>${k === "a" ? "Commune A" : "Commune B"}</legend><div class="liste">
${parNom.map((c) => `      <label><input type="radio" name="${k}" id="${k}-${c.id}" value="${c.id}"${c.id === DEFAUT[k] ? " checked" : ""}>${esc(c.nom)}<small>${esc(nomDepartement[c.parent])}</small></label>`).join("\n")}
    </div></fieldset>`;

const lignes = [
  ["Commune", (c) => `<b>${esc(c.nom)}</b>`],
  ["Département", (c) => esc(nomDepartement[c.parent])],
  ["Pôle", (c) => `${esc(poleDe(c.id).nom)} <span class="badge provisoire">provisoire</span>`],
  ["Arrondissements", (c) => String(arrondissementsDe(c.id).length)],
  ["Leurs noms", (c) => esc(arrondissementsDe(c.id).map((x) => x.nom).join(", "))],
  ["Autres graphies", (c) => (c.alias?.length ? esc(c.alias.join(", ")) : "aucune")],
  ["Source", (c) => esc(c.source) + ", " + esc(intituleSource(c.source).split(",")[0])],
  ["Confiance", (c) => `<span class="badge ${esc(c.confiance)}">${esc(c.confiance === "derivee" ? "dérivée" : c.confiance)}</span>`],
  ["Relevé le", (c) => esc(c.releveLe)],
  ["Identifiant", (c) => `<code>${esc(c.id)}</code>`],
];
const cellule = (k, f) => communes.map((c) => `<span class="v v${k}-${c.id}">${f(c)}</span>`).join("");
const corpsTableau = lignes.map(([titre, f]) => `<tr><th scope="row">${esc(titre)}</th><td>${cellule("a", f)}</td><td>${cellule("b", f)}</td></tr>`).join("\n        ");

const mini = traces.map((t) => `<path id="m-${t.id}" class="commune" d="${t.d}"><title>${esc(commune[t.id].nom)}</title></path>`).join("\n        ");

const corps = `<div class="wrap">
  <section class="tete">
    <p class="kicker">Comparer</p>
    <h1>Deux communes, côte à côte</h1>
    <p class="chapo">Choisissez une commune dans chaque liste, à la souris ou au clavier (flèches haut et bas). La carte et le tableau suivent votre choix, sans un seul script.</p>
  </section>

  <section class="comp" aria-label="Comparaison de deux communes">
    <div class="choix">
      ${liste("a")}
      ${liste("b")}
    </div>
    <div class="resultat">
      <figure class="mini" style="margin:0">
        <svg viewBox="${viewBoxCommunes}" width="280" height="${Math.round(280 * ratioCommunes)}" role="img" aria-label="Carte du Bénin où les deux communes choisies sont colorées">
        ${mini}
        </svg>
        <figcaption class="note">${esc(sourceCommunes.attribution)} Contours de ${esc(sourceCommunes.anneeRepresentee)}, simplifiés : illustration seulement.</figcaption>
      </figure>
      <div class="table">
        <table class="vs">
          <thead><tr><th scope="col"></th><th scope="col" class="a">Commune A</th><th scope="col" class="b">Commune B</th></tr></thead>
          <tbody>
        ${corpsTableau}
          </tbody>
        </table>
      </div>
    </div>
    <p class="note">Les arrondissements sont ceux de l'annexe de la loi n°2013-05, état de 2013, et les pôles sont provisoires.
      <a href="/carte">Voir la carte des pôles</a> · <a href="/provenance">Provenance</a></p>
  </section>
</div>`;

export default coquille({
  titre: `${site.nom} : comparer deux communes du Bénin`,
  description: `Comparez deux communes du Bénin côte à côte : département, pôle, arrondissements, source et niveau de confiance de chaque donnée.`,
  chemin: "/comparer",
  styleEnPlus: style,
  corps,
});
