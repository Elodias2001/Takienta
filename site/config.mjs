/**
 * Source unique de l'identité du site.
 *
 * Toute coordonnée, tout lien et toute date légale vit ici. Les pages et le
 * pied de page l'importent : une adresse ne doit jamais être écrite deux fois,
 * sinon l'une des deux finit par mentir.
 */

export const site = {
  nom: "Takienta",
  paquet: "benin-geo",
  url: "https://takienta.sabar.app",
  accroche: "La structure administrative du Bénin, avec la source de chaque enregistrement.",
  depot: "https://github.com/Elodias2001/Takienta",
  licence: "MIT",
  // Sert à og:locale. Format Open Graph (souligné), pas BCP 47 (tiret).
  locale: "fr_FR",
};

/**
 * Ce qui est réellement publié. Tant qu'une valeur est `false`, aucune page ne
 * doit annoncer une installation depuis ce registre : un test le verrouille.
 * Passer à `true` le jour de la publication, pas avant.
 */
export const publie = { npm: true, pypi: false };

export const registres = {
  npm: "https://www.npmjs.com/package/benin-geo",
  pypi: "https://pypi.org/project/benin-geo/",
};

export const auteur = {
  nom: "Elodias ADIMOU",
  role: "Développeur web fullstack",
  ville: "Cotonou",
  pays: "Bénin",
  // Adresse publiée sur le site. Elle diffère de l'identité Git du dépôt
  // (olouwagnon@gmail.com), qui n'a pas à apparaître ici.
  email: "nounagnonadimou@gmail.com",
};

/**
 * Hébergement : même VPS Hostinger que Récade, derrière Traefik, DNS Cloudflare
 * en mode « DNS only ». Localisation relevée sur la machine le 24/09/2026. À
 * revérifier au premier déploiement et en cas de migration : les mentions
 * légales deviendraient fausses.
 */
export const hebergement = {
  fournisseur: "Hostinger International Ltd.",
  adresse: "61 Lordou Vironos Street, 6023 Larnaca, Chypre",
  site: "https://www.hostinger.fr",
  localisation: "Paris, France",
  dns: "Cloudflare, en mode « DNS only » : le trafic ne transite pas par Cloudflare.",
  // Journaux Docker : json-file, 10 Mo par fichier, 3 fichiers conservés.
  journaux: "rotation automatique à 30 Mo cumulés, sans durée fixe",
};

/** Date de dernière révision des textes légaux. À mettre à jour à chaque retouche. */
export const legal = {
  miseAJour: "7 octobre 2026",
  droitApplicable: "béninois",
  autorite: {
    nom: "Autorité de Protection des Données Personnelles (APDP)",
    pays: "Bénin",
    site: "https://apdp.bj",
  },
};

export const annee = new Date().getFullYear();

/** Pages légales réellement publiées. Le pied de page se construit d'ici. */
export const pagesLegales = [
  { href: "/mentions-legales", libelle: "Mentions légales" },
  { href: "/confidentialite", libelle: "Confidentialité" },
];
