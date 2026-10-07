import { auteur, site } from "../config.mjs";
import { coquille, esc } from "../layout.mjs";

const style = `
  .tete{padding:52px 0 36px;border-bottom:4px solid var(--tk-texte)}
  .tete h1{margin-bottom:18px}
  .texte{padding:44px 0 64px;max-width:44em}
  .texte h2{margin:40px 0 14px}
  .texte h2:first-child{margin-top:0}
  .acces{display:flex;gap:14px 22px;flex-wrap:wrap;margin-top:8px}
`;

const corps = `<div class="wrap">
  <section class="tete">
    <p class="kicker">À propos</p>
    <h1>${esc(auteur.nom)} conçoit et développe ${esc(site.nom)}</h1>
    <p class="chapo">${esc(auteur.role)}, ${esc(auteur.ville)}, ${esc(auteur.pays)}.</p>
  </section>

  <div class="texte">
    <h2>Le projet</h2>
    <p>${esc(site.nom)} est un projet open source qui expose la structure administrative du Bénin : départements, communes,
       arrondissements et pôles de développement. Le paquet s'appelle <code>${esc(site.paquet)}</code>, en JavaScript et en Python.</p>
    <p>Il est pensé pour une utilisation concrète : formulaires d'inscription, adresses de livraison, ciblage de campagnes, tableaux de bord
       sectoriels, applications administratives, jeux de données de recherche. Il n'est pas un service : il n'a ni serveur, ni compte,
       ni télémétrie, et il fonctionne hors ligne.</p>
    <p>Il n'a aucune vocation commerciale. Il est publié sous licence ${esc(site.licence)}.</p>

    <h2>Ce qui le distingue</h2>
    <p>Chaque enregistrement dit d'où il vient. C'est le sujet de la page <a href="/provenance">Provenance</a> : les sources, ce qui est
       établi, ce qui reste provisoire et ce que l'on ne sait pas encore. Les chiffres sont réfutables : les documents qui les fondent sont
       archivés dans le dépôt, avec leur empreinte, et les tests échouent si un compte ne tombe pas juste.</p>

    <h2>Le nom</h2>
    <p><em>Takienta</em> est le nom que l'UNESCO donne à la maison-tour en terre crue des Batammariba, dans le nord-ouest du Bénin et le
       nord-est du Togo. Le pluriel est <em>sikien</em>, et l'orthographe varie selon les auteurs. D'après l'UNESCO, <em>Batammariba</em> se traduit
       par « ceux qui façonnent la terre » en ditammari. Le rez-de-chaussée abrite les animaux, les greniers sont sur la terrasse, et la maison
       est aussi un temple dédié aux ancêtres. Le paysage du Koutammakou est inscrit au patrimoine mondial depuis 2004, au Bénin et au Togo.</p>
    <p>Cette maison est faite d'espaces qui s'emboîtent. Le projet y lit l'image de son modèle de données : un pôle contient des départements,
       qui contiennent des communes, qui contiennent des arrondissements. C'est une lecture du projet, pas une affirmation ethnographique.</p>
    <p>En français, la maison est souvent appelée « tata somba ». Selon un article universitaire, « somba » est un nom donné de l'extérieur, en
       langue bariba, repris par l'administration coloniale française. Le projet emploie <em>takienta</em>. Le paquet s'appelle
       <code>${esc(site.paquet)}</code> parce qu'un paquet de données se cherche plus qu'il ne se raconte.</p>
    <p>Sources :
       <a href="https://whc.unesco.org/en/list/1140/" rel="noopener noreferrer">UNESCO, Koutammakou, the Land of the Batammariba</a> ;
       Guy-Hermann Mawussé Padenou,
       <a href="https://revues.acaref.net/wp-content/uploads/sites/3/2024/01/8-Guy-Hermann-Mawusse-PADENOU.pdf" rel="noopener noreferrer">« La construction de l'identité chez les Betammaribé du Togo »</a>.</p>

    <h2>Contact</h2>
    <p>Pour toute question ou correction, avec la source qui l'appuie :</p>
    <div class="acces">
      <a href="mailto:${esc(auteur.email)}">${esc(auteur.email)}</a>
      <a href="${esc(site.depot)}" rel="noopener noreferrer">Le dépôt sur GitHub</a>
    </div>
  </div>
</div>`;

export default coquille({
  titre: `À propos | ${site.nom}`,
  description: `${auteur.nom}, ${auteur.role.toLowerCase()} à ${auteur.ville}, conçoit et développe ${site.nom} : la structure administrative du Bénin, avec la source de chaque enregistrement.`,
  chemin: "/a-propos",
  styleEnPlus: style,
  corps,
});
