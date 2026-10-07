import { auteur, hebergement, legal, site } from "../config.mjs";
import { coquille, esc } from "../layout.mjs";

const style = `
  .tete{padding:52px 0 36px;border-bottom:4px solid var(--tk-texte)}
  .tete h1{margin-bottom:18px}
  .texte{padding:44px 0 64px;max-width:44em}
  .texte h2{font-size:26px;margin:38px 0 12px}
  .texte h2:first-of-type{margin-top:0}
  .texte ul{margin:0 0 16px;padding-left:22px}
  .texte li{margin-bottom:7px}
  .maj{display:inline-block;border:3px solid var(--tk-texte);padding:5px 12px;font-size:14px;font-weight:600}
`;

const corps = `<div class="wrap">
  <section class="tete">
    <p class="kicker">Informations légales</p>
    <h1>Mentions légales</h1>
    <p class="chapo">Qui édite ce site, qui l'héberge, et comment me joindre.</p>
  </section>

  <div class="texte">
    <p class="maj">Dernière mise à jour : ${esc(legal.miseAJour)}</p>

    <h2>Éditeur du site</h2>
    <ul>
      <li><b>${esc(auteur.nom)}</b>, personne physique</li>
      <li>${esc(auteur.role)}, ${esc(auteur.ville)}, ${esc(auteur.pays)}</li>
      <li>Contact : <a href="mailto:${esc(auteur.email)}">${esc(auteur.email)}</a></li>
    </ul>
    <p>Ce site est édité à titre personnel. Il ne vend rien, ne propose aucun abonnement et n'exerce aucune activité commerciale :
       c'est la vitrine et la documentation d'un logiciel libre.</p>

    <h2>Directeur de la publication</h2>
    <p>${esc(auteur.nom)}.</p>

    <h2>Hébergement</h2>
    <ul>
      <li><b>${esc(hebergement.fournisseur)}</b></li>
      <li>${esc(hebergement.adresse)}</li>
      <li><a href="${esc(hebergement.site)}" rel="noopener noreferrer">${esc(hebergement.site)}</a></li>
      <li>Serveur physiquement situé à <b>${esc(hebergement.localisation)}</b></li>
    </ul>
    <p>La résolution des noms de domaine passe par Cloudflare en mode « DNS only » : le trafic du site ne transite pas par Cloudflare,
       seules les requêtes DNS y sont traitées.</p>

    <h2>Propriété intellectuelle</h2>
    <p>Le logiciel ${esc(site.nom)} est publié sous <b>licence ${esc(site.licence)}</b>. Son code source est consultable et réutilisable
       dans les conditions de cette licence : <a href="${esc(site.depot)}" rel="noopener noreferrer">${esc(site.depot)}</a>.</p>
    <p>Les textes, la documentation et l'identité visuelle de ce site restent la propriété de leur auteur. Les polices Caprasimo et
       Figtree sont distribuées sous licence SIL Open Font License 1.1, dont les textes accompagnent les fichiers dans le dépôt.</p>
    <p>La carte des départements utilise des contours issus de geoBoundaries (William &amp; Mary geoLab), d'après Wikimedia Commons.
       Elle est fournie à titre d'illustration et ne fait pas partie du paquet.</p>

    <h2>Responsabilité</h2>
    <p>${esc(site.nom)} est fourni « en l'état », sans garantie, conformément aux termes de la licence ${esc(site.licence)}. Les données
       sont accompagnées de leur source et de leur niveau de confiance : certaines sont provisoires, et la page
       <a href="/provenance">Provenance</a> dit lesquelles. Elles ne se substituent à aucun texte officiel ni à aucune vérification humaine.</p>
    <p>Les liens sortants (dépôt de code, sites tiers) ne relèvent pas de la responsabilité de l'éditeur.</p>

    <h2>Données personnelles</h2>
    <p>Ce site ne collecte aucune donnée saisie et ne dépose aucun cookie. Le détail se trouve dans la
       <a href="/confidentialite">politique de confidentialité</a>.</p>

    <h2>Contact</h2>
    <p>Pour toute question relative à ce site ou au logiciel : <a href="mailto:${esc(auteur.email)}">${esc(auteur.email)}</a>.</p>
  </div>
</div>`;

export default coquille({
  titre: `Mentions légales | ${site.nom}`,
  description: `Éditeur, directeur de la publication et hébergeur du site ${site.nom}.`,
  chemin: "/mentions-legales",
  styleEnPlus: style,
  corps,
});
