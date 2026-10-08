import { publie, registres, site } from "../config.mjs";
import { donnees } from "../donnees.mjs";
import { carteInteractive, regles, styleCarte } from "../carte.mjs";
import { emboitement, styleEmboitement } from "../emboitement.mjs";
import { coquille, esc } from "../layout.mjs";

const { compte, carte } = donnees;

const style = `
  .hero{display:grid;grid-template-columns:minmax(0,1fr) 310px;gap:44px;align-items:start;padding:56px 0}
  .hero h1{margin-bottom:20px}
  .actions{display:flex;gap:14px 22px;flex-wrap:wrap;align-items:center;margin-top:24px}
  .bouton{display:inline-block;background:var(--tk-texte);color:var(--tk-fond);font-weight:700;padding:12px 22px;
    text-decoration:none;border:4px solid var(--tk-texte)}
  .bouton:hover,.bouton:focus-visible{background:var(--tk-fond);color:var(--tk-texte)}
  figure{margin:0}
  figcaption{font-size:13.5px;margin-top:10px;max-width:310px}
  .chiffre{transition:color .2s}
  @media (max-width:820px){.hero{grid-template-columns:minmax(0,1fr)}.carte{max-width:310px}}
` + styleCarte + styleEmboitement + `
  ${regles}
`;

// Chaque mot du titre monte à son tour : le texte reste celui de l'accroche, mot pour mot.
const titre = site.accroche.split(" ").map((m, i) => `<span class="mot" style="--m:${i}">${esc(m)}</span>`).join(" ");

const installation = [
  publie.npm ? `<pre><code>npm install benin-geo</code></pre>` : "",
  publie.pypi ? `<pre><code>pip install benin-geo</code></pre>` : "",
].join("");

const statutPublication = publie.npm || publie.pypi
  ? `<p>Installation :</p>${installation}<p>Sources : <a href="${esc(publie.npm ? registres.npm : registres.pypi)}" rel="noopener noreferrer">registre officiel</a>.</p>`
  : `<div class="mur">
      <h3>Pré-publication</h3>
      <p>Les paquets ne sont pas encore sur npm ni sur PyPI. Le code est ouvert et la
         <a href="/docs/01-demarrage.html">documentation</a> explique comment les utiliser dès maintenant depuis les sources.</p>
    </div>`;

const corps = `<div class="wrap">
  <section class="section hero">
    <div>
      <p class="kicker">Données administratives du Bénin</p>
      <h1>${titre}</h1>
      <p class="chapo">Départements, communes, arrondissements et pôles de développement. Hors ligne, sans dépendance,
        en JavaScript et en Python, avec les mêmes identifiants et les mêmes résultats. Chaque enregistrement dit d'où il vient,
        à quelle date il a été relevé et avec quelle confiance.</p>
      <div class="actions">
        <a class="bouton" href="/provenance">Voir la provenance</a>
        <a href="/docs/01-demarrage.html">Démarrer</a>
      </div>
    </div>
    <figure class="carte">
      ${carteInteractive()}
      <figcaption>${esc(carte.attribution)} Contours de ${esc(carte.anneeRepresentee)}, simplifiés : illustration seulement.</figcaption>
    </figure>
  </section>

  <section class="section" aria-labelledby="chiffres">
    <h2 id="chiffres">Ce qu'il contient</h2>
    <div class="grille">
      <div class="mur"><span class="chiffre">${compte.departements}</span><span class="legende">départements</span></div>
      <div class="mur"><span class="chiffre">${compte.communes}</span><span class="legende">communes</span></div>
      <div class="mur"><span class="chiffre">${compte.arrondissements}</span><span class="legende">arrondissements</span><br><span class="badge provisoire">provisoire</span></div>
      <div class="mur"><span class="chiffre">${compte.poles}</span><span class="legende">pôles de développement</span><br><span class="badge provisoire">provisoire</span></div>
    </div>
    <p>Les arrondissements décrivent l'état de 2013 et les pôles n'ont pas encore de décret : la page
       <a href="/provenance">Provenance</a> dit ce que l'on sait et ce que l'on ne sait pas.</p>
  </section>

  <section class="section" aria-labelledby="emboitement">
    <h2 id="emboitement">L'emboîtement</h2>
    ${emboitement()}
  </section>

  <section class="section" aria-labelledby="angles">
    <h2 id="angles">Trois choses qui comptent</h2>
    <div class="grille">
      <div class="mur"><h3>Les pôles</h3>
        <p>Les six pôles de développement présentés le 23 septembre 2026 sont dans les données, versionnés et datés à part.
           Ils restent marqués provisoires tant qu'aucun décret ne les fixe.</p></div>
      <div class="mur"><h3>La provenance</h3>
        <p>Chaque enregistrement porte sa source. Les documents qui fondent les données sont archivés dans le dépôt, avec leur
           empreinte, et le build ne rappelle jamais un site officiel.</p></div>
      <div class="mur"><h3>Le poids</h3>
        <p>L'import par défaut reste sous 150 Ko, et un test échoue s'il les dépasse. Des points d'entrée par niveau
           permettent de ne charger que ce que l'on utilise.</p></div>
    </div>
  </section>

  <section class="section" aria-labelledby="apercu">
    <h2 id="apercu">Un aperçu</h2>
    ${statutPublication}
    <h3>JavaScript</h3>
    <pre><code>import { chercher, communesDe, hierarchie } from "benin-geo";

chercher("abomey calavi")[0].id;   // "BJ-AQ-ABO"
communesDe("BJ-BO").length;        // 8
hierarchie("BJ-AL-KAN-04").pole.nom;  // "Nord-Est"</code></pre>
    <h3>Python</h3>
    <pre><code>from benin_geo import chercher, communes_de, hierarchie

chercher("abomey calavi")[0].id    # "BJ-AQ-ABO"
len(communes_de("BJ-BO"))          # 8
hierarchie("BJ-AL-KAN-04").pole.nom   # "Nord-Est"</code></pre>
  </section>

  <section class="section" aria-labelledby="limites">
    <h2 id="limites">Ce qu'il ne fait pas</h2>
    <ul>
      <li>Aucun appel réseau, ni à l'installation ni à l'exécution, et aucune dépendance.</li>
      <li>Aucune géométrie dans le paquet : les contours ont leur propre licence.</li>
      <li>Rien sous l'arrondissement : les villages et quartiers de ville ne font pas partie de la première version.</li>
      <li>Aucune valeur devinée : un trou documenté vaut mieux qu'un chiffre inventé.</li>
    </ul>
  </section>
</div>`;

export default coquille({
  titre: `${site.nom} : la structure administrative du Bénin, avec sa source`,
  description: `Départements, communes, arrondissements et pôles du Bénin, hors ligne, en JavaScript et en Python. Chaque enregistrement porte sa source, sa date et sa confiance.`,
  chemin: "/",
  styleEnPlus: style,
  corps,
});
