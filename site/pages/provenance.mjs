import { site } from "../config.mjs";
import { donnees } from "../donnees.mjs";
import { coquille, esc } from "../layout.mjs";

const { compte, confiance, sources, exemple, nombre } = donnees;

const NATURES = {
  loi: "Loi",
  decret: "Décret",
  "publication-officielle": "Publication officielle",
  "fichier-institutionnel": "Fichier institutionnel",
  ouvrage: "Ouvrage",
  "communique-presse": "Communiqué de presse",
  norme: "Norme",
  transcription: "Transcription d'un texte officiel",
};

const style = `
  .tete{padding:52px 0 36px;border-bottom:4px solid var(--tk-texte)}
  .tete h1{margin-bottom:18px}
  dl{margin:0 0 4px;display:grid;grid-template-columns:max-content minmax(0,1fr);gap:6px 18px;font-size:15px}
  dt{font-weight:700}
  dd{margin:0;overflow-wrap:anywhere}
  .source h3{margin:0 0 10px}
  .source .badge{margin-bottom:14px}
  dd code,.mur code{white-space:normal;overflow-wrap:anywhere}
  .hash{font-size:13px;border:0;padding:0}
  .inconnu li{margin-bottom:10px}
  .pile{display:grid;grid-template-columns:minmax(0,300px) minmax(0,1fr);gap:44px;padding-top:6px}
  .tour{display:flex;flex-direction:column-reverse;align-items:center;align-self:start}
  .assise{border:4px solid var(--tk-texte);background:var(--tk-fond);padding:12px 14px;margin-top:-4px;text-align:center;min-height:84px;
    display:flex;flex-direction:column;justify-content:center;gap:4px;transition:background .25s,color .25s}
  .assise:first-child{width:100%;background:var(--tk-texte);color:var(--tk-fond)}
  .assise:nth-child(2){width:88%}
  .assise:nth-child(3){width:76%}
  .assise:nth-child(4){width:64%;border-color:var(--tk-accent);box-shadow:8px 8px 0 var(--tk-texte)}
  .assise b{font-family:var(--tk-font-titre);font-weight:400;font-size:21px;line-height:1.1}
  .assise small{font-size:13.5px;font-weight:600}
  .etapes{display:grid;gap:22px}
  .etape h3{margin:0 0 8px}
  .etape .badge{margin-bottom:12px}
  .etape .src{font-size:14.5px}
  .pile-note{font-size:14.5px;max-width:46em}
  @media (max-width:820px){.pile{grid-template-columns:minmax(0,1fr)}.tour{max-width:360px;width:100%;margin:0 auto}}
  @media (min-width:821px){
    .tour{position:sticky;top:96px}
    .etapes{gap:0}
    .etape{min-height:56vh;padding-top:8px}
    .etape:last-child{min-height:0}
  }
  @media (min-width:821px){
    @supports (animation-timeline:view()){
      .pile{timeline-scope:--st1,--st2,--st3,--st4}
      .etape:nth-child(1){view-timeline:--st1 block}
      .etape:nth-child(2){view-timeline:--st2 block}
      .etape:nth-child(3){view-timeline:--st3 block}
      .etape:nth-child(4){view-timeline:--st4 block}
      .assise{animation:pose linear both;animation-range:entry 30% entry 90%}
      .assise:nth-child(1){animation-timeline:--st1}
      .assise:nth-child(2){animation-timeline:--st2}
      .assise:nth-child(3){animation-timeline:--st3}
      .assise:nth-child(4){animation-timeline:--st4}
    }
  }
  @keyframes pose{from{opacity:0;transform:translateY(-90px)}to{opacity:1;transform:none}}
`;

const badge = (c) => `<span class="badge ${esc(c)}">${esc(c === "derivee" ? "dérivée" : c)}</span>`;

const niveaux = [
  { niveau: "Départements", n: compte.departements, conf: confiance.departements, source: "loi-97-028",
    statut: "Fixés par la loi n°97-028 du 15 janvier 1999, article 6. Leurs codes sont ceux de la norme ISO 3166-2:BJ." },
  { niveau: "Communes", n: compte.communes, conf: confiance.communes, source: "loi-2013-05",
    statut: "L'annexe de la loi n°2013-05 nomme les 77 communes, rangées par département. Elle imprime les noms sans accents : le nom usuel suit la liste des pôles, et les libellés de la loi qui en diffèrent sont gardés comme alias." },
  { niveau: "Arrondissements", n: compte.arrondissements, conf: confiance.arrondissements, source: "loi-2013-05", provisoire: donnees.arrondissementsProvisoires,
    statut: "Annexe de la loi n°2013-05, état de 2013. Les modifications ultérieures n'ont pas été recherchées, d'où le statut provisoire." },
  { niveau: "Pôles", n: compte.poles, conf: confiance.poles, source: "communique-marina-2026-09-23", provisoire: donnees.calquePoles.provisoire,
    statut: `Présentés le 23 septembre 2026. Aucun décret retrouvé. La composition est recoupée : 77 communes, aucun doublon, aucun orphelin. Calque daté du ${esc(donnees.calquePoles.effectifAu)}.` },
];

const lignesNiveaux = niveaux
  .map((l) => `<tr>
        <th scope="row">${esc(l.niveau)}</th>
        <td>${nombre(l.n)}</td>
        <td>${[...new Set([...l.conf, ...(l.provisoire ? ["provisoire"] : [])])].map(badge).join(" ")}</td>
        <td>${l.statut}</td>
      </tr>`)
  .join("\n      ");

const lien = (url) => (url ? `<a href="${esc(url)}" rel="noopener noreferrer">${esc(url)}</a>` : "pas d'adresse publique");

const carteSource = (id, s) => {
  const archive = s.archive
    ? `<code>${esc(s.archive)}</code>, dans le dépôt`
    : s.extrait
      ? `non archivée. Extrait utilisé : <code>${esc(s.extrait)}</code>`
      : "non archivée dans le dépôt";
  return `<article class="mur source" id="${esc(id)}">
      <h3>${esc(s.intitule)}</h3>
      ${badge(s.confiance)}
      <dl>
        <dt>Éditeur</dt><dd>${esc(s.editeur)}</dd>
        ${s.auteur ? `<dt>Auteur</dt><dd>${esc(s.auteur)}</dd>` : ""}
        <dt>Nature</dt><dd>${esc(NATURES[s.nature] ?? s.nature)}</dd>
        <dt>Publication</dt><dd>${esc(s.datePublication ?? "date inconnue")}</dd>
        <dt>Relevé le</dt><dd>${esc(s.dateReleve)}</dd>
        <dt>Adresse</dt><dd>${lien(s.url)}</dd>
        <dt>Archive</dt><dd>${archive}</dd>
        ${s.sha256 ? `<dt>SHA-256</dt><dd><code class="hash">${esc(s.sha256)}</code></dd>` : ""}
        <dt>Note</dt><dd>${esc(s.note)}</dd>
      </dl>
    </article>`;
};

const loi2013 = sources["loi-2013-05"];

const corps = `<div class="wrap">
  <section class="tete">
    <p class="kicker">Provenance des données</p>
    <h1>D'où vient chaque donnée</h1>
    <p class="chapo">Chaque enregistrement de <code>benin-geo</code> porte sa source, la date du relevé et un niveau de confiance. Cette page
      dit ce que l'on sait, ce que l'on ne sait pas encore, et comment le vérifier soi-même.</p>
  </section>

  <section class="section" aria-labelledby="pile">
    <h2 id="pile">Quatre niveaux, quatre sources qui s'empilent</h2>
    <p>Chaque niveau repose sur le précédent, comme les murs d'une maison s'élèvent les uns sur les autres. Descendez la page : la tour se construit au rythme des sources.
      C'est une image du projet, pas une affirmation sur la maison dont il emprunte le nom.</p>
    <div class="pile">
      <div class="tour" role="img" aria-label="Une tour de quatre assises : départements, communes, arrondissements, pôles">
        ${niveaux.map((l) => `<div class="assise"><b>${esc(l.niveau)}</b><small>${nombre(l.n)}</small></div>`).join("\n        ")}
      </div>
      <div class="etapes">
        ${niveaux.map((l, i) => `<article class="etape" id="etape-${i + 1}">
          <p class="kicker">Assise ${i + 1} sur ${niveaux.length}</p>
          <h3>${esc(l.niveau)} : ${nombre(l.n)}</h3>
          ${[...new Set([...l.conf, ...(l.provisoire ? ["provisoire"] : [])])].map(badge).join(" ")}
          <p>${l.statut}</p>
          <p class="src">Source : <a href="#${esc(l.source)}">${esc(sources[l.source].intitule.split(",")[0])}</a></p>
        </article>`).join("\n        ")}
      </div>
    </div>
  </section>

  <section class="section" aria-labelledby="confiance">
    <h2 id="confiance">Trois niveaux de confiance</h2>
    <div class="table"><table>
      <thead><tr><th scope="col">Niveau</th><th scope="col">Ce que cela veut dire</th></tr></thead>
      <tbody>
        <tr><th scope="row">${badge("officielle")}</th><td>La source est un texte de loi ou un décret, archivé dans le dépôt avec son empreinte SHA-256.</td></tr>
        <tr><th scope="row">${badge("derivee")}</th><td>La source est un document institutionnel ou un ouvrage qui n'est pas un texte légal. La donnée est recoupée, pas établie par la loi.</td></tr>
        <tr><th scope="row">${badge("provisoire")}</th><td>La source est un communiqué de presse, ou un état que rien ne confirme encore. Un article de presse n'est jamais une source : il dit où chercher, pas quoi écrire.</td></tr>
      </tbody>
    </table></div>
  </section>

  <section class="section" aria-labelledby="niveaux">
    <h2 id="niveaux">Ce que contient chaque niveau</h2>
    <div class="table"><table>
      <thead><tr><th scope="col">Niveau</th><th scope="col">Nombre</th><th scope="col">Confiance</th><th scope="col">Ce que l'on sait</th></tr></thead>
      <tbody>
      ${lignesNiveaux}
      </tbody>
    </table></div>
  </section>

  <section class="section" aria-labelledby="exemple">
    <h2 id="exemple">Un enregistrement, en entier</h2>
    <p>Voici l'arrondissement Kandi 1, tel qu'il est dans les données. La source, la date et la confiance sont des champs de la donnée, pas une ligne de README.</p>
    <pre><code>${esc(JSON.stringify(exemple, null, 2))}</code></pre>
    <p>Le champ <code>graphie</code> dit si l'orthographe affichée est vérifiée. <code>deduite-du-libelle</code> signifie que la loi imprime
      le nom en majuscules sans accents, et qu'aucun accent n'a été ajouté de mémoire.</p>
  </section>

  <section class="section" aria-labelledby="sources">
    <h2 id="sources">Les ${compte.sources} sources</h2>
    <p>Les portails officiels tombent. Les documents qui fondent des données sont donc archivés dans le dépôt, avec leur empreinte, et la
      construction se rejoue entièrement hors ligne.</p>
    ${Object.entries(sources).map(([id, s]) => carteSource(id, s)).join("\n    ")}
  </section>

  <section class="section inconnu" aria-labelledby="inconnu">
    <h2 id="inconnu">Ce que nous ne savons pas encore</h2>
    <ul>
      <li><b>Les arrondissements après 2013.</b> L'article 16 de la loi n°2013-05 prévoit que tout changement se fait par la loi. Aucune loi postérieure n'a été recherchée.</li>
      <li><b>L'orthographe de ${compte.graphiesDeduites} noms d'arrondissement sur ${compte.arrondissements}.</b> La loi les imprime sans accents et rien dans ses pages ne les atteste : ils sont marqués <code>deduite-du-libelle</code>.</li>
      <li><b>Les pôles.</b> Ils ont été présentés par communiqué le 23 septembre 2026. Aucun décret ni publication de l'INStaD ne les confirme à ce jour.</li>
      <li><b>${donnees.grandNokoueSansChefLieu ? "Le chef-lieu du Grand-Nokoué." : "Aucun point."}</b>${donnees.grandNokoueSansChefLieu ? " La liste de presse en donne un, aucun texte officiel ne le désigne : la valeur est laissée vide." : ""}</li>
      <li><b>Un écart dans la loi elle-même.</b> L'annexe de la loi n°2013-05 annonce 517 villages pour l'Atacora, alors que ses communes en totalisent 519. L'écart est dans le texte, il ne touche pas le nombre d'arrondissements.</li>
      <li><b>Les portails officiels.</b> Le 28 septembre 2026, <code>instad.bj</code> répondait 503, <code>rgph5.instad.bj</code> répondait 403 et <code>data.gouv.bj</code> n'existait plus dans le DNS.</li>
    </ul>
  </section>

  <section class="section" aria-labelledby="verifier">
    <h2 id="verifier">Le vérifier soi-même</h2>
    <p>Le dépôt contient les sources et les tests. Pour recalculer l'empreinte de la loi qui fonde les arrondissements et la comparer à celle de cette page :</p>
    <pre><code>git clone ${esc(site.depot)}.git
cd Takienta
shasum -a 256 data/sources/loi-2013-05.pdf
# attendu : ${esc(loi2013.sha256)}
python3 -m pytest</code></pre>
    <p>Les tests échouent si un enregistrement n'a pas de source déclarée, si un compte ne tombe pas juste (12, 77, 546, 6) ou si un identifiant figé change.</p>
  </section>
</div>`;

export default coquille({
  titre: `Provenance des données | ${site.nom}`,
  description: `D'où vient chaque donnée de ${site.paquet} : ${compte.sources} sources, leur niveau de confiance, ce qui est provisoire et comment le vérifier.`,
  chemin: "/provenance",
  styleEnPlus: style,
  corps,
});
