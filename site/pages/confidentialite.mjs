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
    <p class="kicker">Données personnelles</p>
    <h1>Politique de confidentialité</h1>
    <p class="chapo">Ce que ce site enregistre, ce qu'il n'enregistre pas, et ce que vous pouvez exiger.</p>
  </section>

  <div class="texte">
    <p class="maj">Dernière mise à jour : ${esc(legal.miseAJour)}</p>

    <div class="mur">
      <p><b>Ce site ne vous demande rien.</b> Aucun formulaire, aucun compte, aucun cookie, aucune mesure d'audience. Seuls les journaux
         techniques du serveur enregistrent votre adresse IP, comme le fait tout serveur web. Rien d'autre.</p>
    </div>

    <h2>Qui est responsable</h2>
    <p>${esc(auteur.nom)}, ${esc(auteur.ville)}, ${esc(auteur.pays)}. Contact : <a href="mailto:${esc(auteur.email)}">${esc(auteur.email)}</a>.</p>

    <h2>Ce qui est enregistré</h2>
    <div class="table"><table>
      <thead><tr><th scope="col">Donnée</th><th scope="col">Par quoi</th><th scope="col">Pourquoi</th><th scope="col">Durée</th></tr></thead>
      <tbody>
        <tr>
          <td>Adresse IP, date, page demandée, navigateur</td>
          <td>Journaux du serveur web et du routeur (nginx, Traefik)</td>
          <td>Faire fonctionner le site et repérer les abus</td>
          <td>${esc(hebergement.journaux)}</td>
        </tr>
      </tbody>
    </table></div>
    <p>Ces journaux ne sont ni consultés au quotidien, ni recoupés, ni exportés, ni transmis à qui que ce soit. Ils tournent
       automatiquement et s'effacent au fil de l'écriture.</p>
    <p>La base de ce traitement est l'<b>intérêt légitime</b> à maintenir un service en ligne fonctionnel et sûr.</p>

    <h2>Ce qui n'est pas fait</h2>
    <ul>
      <li>Aucun <b>cookie</b> n'est déposé, d'aucune sorte.</li>
      <li>Aucun <b>stockage local</b> dans votre navigateur.</li>
      <li>Aucune <b>mesure d'audience</b>, aucun pixel, aucune publicité.</li>
      <li>Aucune <b>police</b>, aucun script ni aucune image chargés depuis un tiers : tout est servi par ce site.</li>
      <li>Aucun <b>compte</b>, donc aucun mot de passe et aucun profil.</li>
      <li>Aucun <b>paiement</b>, aucune donnée bancaire.</li>
    </ul>
    <p>C'est aussi pourquoi vous ne verrez pas de bandeau de consentement : il n'y a rien à consentir.</p>

    <h2>Les paquets ${esc(site.paquet)}, eux, ne transmettent rien</h2>
    <p>Les paquets JavaScript et Python fonctionnent entièrement sur votre machine, hors ligne. Ils n'effectuent <b>aucun appel réseau</b>, ni à
       l'installation ni à l'exécution : ni télémétrie, ni vérification de version. C'est vérifiable : des tests du dépôt échouent si du code réseau
       y apparaît.</p>

    <h2>Qui d'autre intervient</h2>
    <ul>
      <li><b>${esc(hebergement.fournisseur)}</b>, hébergeur du serveur, situé à ${esc(hebergement.localisation)}. Il traite les journaux techniques pour le compte de l'éditeur.</li>
      <li><b>Cloudflare</b>, uniquement pour la résolution du nom de domaine, en mode « DNS only ». Le trafic du site ne transite pas par ses serveurs.</li>
    </ul>
    <p>Les liens vers GitHub ou vers l'adresse électronique de l'éditeur sont de simples liens : aucune donnée ne leur est transmise tant que vous
       ne cliquez pas. Une fois chez eux, ce sont leurs propres politiques qui s'appliquent.</p>

    <h2>Vos droits</h2>
    <p>Vous pouvez demander l'accès, la rectification, l'effacement ou la limitation des données vous concernant, et vous opposer à leur
       traitement. En pratique, la seule donnée existante est une adresse IP dans un journal technique : dans la plupart des cas elle aura déjà
       disparu par rotation.</p>
    <p>Écrivez à <a href="mailto:${esc(auteur.email)}">${esc(auteur.email)}</a>. Je réponds personnellement, sous trente jours au plus.</p>
    <p>En cas de désaccord, vous pouvez saisir l'autorité compétente : <b>${esc(legal.autorite.nom)}</b> au ${esc(legal.autorite.pays)}
       (<a href="${esc(legal.autorite.site)}" rel="noopener noreferrer">${esc(legal.autorite.site)}</a>). Le serveur étant situé en France, les
       personnes résidant dans l'Union européenne peuvent également saisir l'autorité de leur pays.</p>

    <h2>Mineurs</h2>
    <p>Ce site s'adresse à des développeurs et ne vise pas les mineurs. Comme rien n'est collecté, aucune donnée de mineur ne peut l'être davantage.</p>

    <h2>Sécurité</h2>
    <p>Le site est servi exclusivement en HTTPS, avec un certificat renouvelé automatiquement. Il ne contient aucune base de données et n'exécute
       aucun code côté serveur : c'est un ensemble de fichiers statiques.</p>

    <h2>Modification</h2>
    <p>Toute évolution du site qui introduirait une collecte, un cookie ou un prestataire entraînera la mise à jour de cette page et de sa date.
       La règle est inscrite dans les conventions du projet pour ne pas être oubliée.</p>
  </div>
</div>`;

export default coquille({
  titre: `Politique de confidentialité | ${site.nom}`,
  description: `Ce site ne dépose aucun cookie et ne collecte aucune donnée saisie. Seuls les journaux techniques du serveur enregistrent une adresse IP.`,
  chemin: "/confidentialite",
  styleEnPlus: style,
  corps,
});
