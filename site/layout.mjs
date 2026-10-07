/**
 * Coquille commune à toutes les pages du site : en-tête, navigation, pied de
 * page et feuille de style. Une seule définition, donc une seule vérité.
 *
 * Charte Takienta : murs épais (bordures de 4 à 6 px, jamais un filet de 1 px),
 * angles chanfreinés ou droits, jamais arrondis. Aucune couleur n'est écrite
 * ici : tout passe par les variables de brand/palette.css, qui portent déjà le
 * thème sombre et les variantes de texte conformes AA.
 *
 * Règle éditoriale : aucun tiret cadratin dans les textes visibles. C'est testé.
 */
import { PETIT } from "../scripts/emblem.mjs";
import { annee, auteur, pagesLegales, publie, registres, site } from "./config.mjs";
import { VIGNETTES, urlVignette } from "./og.mjs";

export const esc = (v) =>
  String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const EMBLEME = (taille = 34) =>
  `<svg viewBox="0 0 100 100" width="${taille}" height="${taille}" aria-hidden="true" focusable="false">${PETIT.join("")}</svg>`;

const STYLE = `
  *{box-sizing:border-box}
  html{scroll-behavior:smooth}
  body{margin:0;background:var(--tk-fond);color:var(--tk-texte);font-family:var(--tk-font-texte);
    font-size:17px;line-height:1.65;-webkit-font-smoothing:antialiased}
  h1,h2,h3{font-family:var(--tk-font-titre);font-weight:400;line-height:1.12;margin:0}
  h1{font-size:clamp(36px,6vw,58px)}
  h2{font-size:clamp(26px,3.6vw,34px)}
  h3{font-size:22px}
  h4{font-size:17px;font-weight:700;margin:0}
  p{margin:0 0 14px}
  a{color:var(--tk-accent-texte);text-underline-offset:3px;text-decoration-thickness:2px}
  a:focus-visible,button:focus-visible{outline:4px solid var(--tk-texte);outline-offset:3px}
  code,pre{font-family:var(--tk-font-mono)}
  code{font-size:.92em}
  .id{white-space:nowrap}
  img{max-width:100%;height:auto}
  .wrap{max-width:980px;margin:0 auto;padding:0 24px}
  .saut{position:absolute;left:-9999px;top:0;background:var(--tk-texte);color:var(--tk-fond);padding:10px 16px;font-weight:700;z-index:10}
  .saut:focus{left:8px;top:8px}

  header{border-bottom:6px solid var(--tk-texte)}
  .bar{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:12px 0;flex-wrap:wrap}
  .brand{display:flex;align-items:center;gap:12px;font-family:var(--tk-font-titre);font-size:26px;
    color:var(--tk-texte);text-decoration:none;min-height:44px}
  .bar nav{display:flex;gap:4px;flex-wrap:wrap}
  .bar nav a{color:var(--tk-texte);font-weight:600;font-size:15.5px;padding:10px 12px;min-height:44px;
    display:inline-flex;align-items:center;text-decoration:none;border-bottom:4px solid transparent}
  .bar nav a:hover,.bar nav a:focus-visible,.bar nav a[aria-current]{border-bottom-color:var(--tk-texte)}

  .kicker{font-size:13px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;
    color:var(--tk-accent-texte);margin:0 0 14px}
  .chapo{font-size:19px;max-width:38em}
  .section{padding:52px 0;border-bottom:4px solid var(--tk-texte)}
  .section:last-of-type{border-bottom:0}
  .section h2{margin-bottom:18px}

  .mur{border:4px solid var(--tk-texte);padding:22px 24px;margin:0 0 22px}
  .mur>:last-child{margin-bottom:0}
  .grille{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:22px}
  .chiffre{font-family:var(--tk-font-titre);font-size:48px;line-height:1;display:block}
  .legende{font-size:14.5px;font-weight:600}

  .badge{display:inline-block;border:3px solid currentColor;padding:0 9px;font-weight:700;font-size:12.5px;
    letter-spacing:.06em;text-transform:uppercase;line-height:1.6}
  .badge.officielle{color:var(--tk-signal-texte)}
  .badge.derivee{color:var(--tk-texte)}
  .badge.provisoire{color:var(--tk-accent-texte)}

  .table{overflow-x:auto;margin:0 0 22px;border:4px solid var(--tk-texte)}
  table{border-collapse:collapse;width:100%;font-size:15px}
  th,td{text-align:left;vertical-align:top;padding:10px 12px;border-bottom:2px solid var(--tk-texte)}
  tbody tr:last-child>*{border-bottom:0}
  thead th{background:var(--tk-texte);color:var(--tk-fond);font-size:13px;letter-spacing:.06em;text-transform:uppercase}
  tbody th{font-weight:700}

  pre{background:var(--tk-texte);color:var(--tk-fond);padding:18px 20px;border:4px solid var(--tk-texte);
    overflow-x:auto;font-size:14.5px;line-height:1.55;margin:0 0 22px}
  pre code{font-size:inherit}
  :not(pre)>code{border:2px solid var(--tk-texte);padding:0 5px;white-space:nowrap}

  footer{background:var(--tk-texte);color:var(--tk-fond);padding:40px 0;font-size:15px;margin-top:0}
  footer a{color:var(--tk-fond)}
  footer .liens{display:flex;gap:6px 22px;flex-wrap:wrap;margin-bottom:18px}
  footer .liens a{padding:9px 0;min-height:44px;display:inline-flex;align-items:center}
  footer .credit{margin:0}

  @media (prefers-reduced-motion:reduce){ html{scroll-behavior:auto} *{animation:none!important;transition:none!important} }
`;

const NAV = [
  { href: "/provenance", libelle: "Provenance" },
  { href: "/docs/", libelle: "Documentation" },
  { href: site.depot, libelle: "GitHub", externe: true },
  ...(publie.npm ? [{ href: registres.npm, libelle: "npm", externe: true }] : []),
  ...(publie.pypi ? [{ href: registres.pypi, libelle: "PyPI", externe: true }] : []),
];

/**
 * @param {{titre:string, description:string, chemin:string, corps:string, enTete?:string, styleEnPlus?:string, imageOg?:{fichier:string, alt:string}}} page
 */
export function coquille(page) {
  const canonical = `${site.url}${page.chemin}`;

  // Une page sans vignette ne doit pas partir en production : elle se
  // partagerait sans image. On échoue à la construction plutôt qu'en silence.
  const vignette = page.imageOg ?? VIGNETTES[page.chemin];
  if (!vignette) {
    throw new Error(`Aucune vignette de partage pour « ${page.chemin} ». Ajoutez-la dans site/og.mjs, puis relancez pnpm build:og.`);
  }
  const imageOg = urlVignette(vignette.fichier);
  const nav = NAV.map((l) => {
    const courant = !l.externe && page.chemin.startsWith(l.href.replace(/\/$/, "")) ? ' aria-current="page"' : "";
    return `<a href="${esc(l.href)}"${l.externe ? ' rel="noopener noreferrer"' : ""}${courant}>${esc(l.libelle)}</a>`;
  }).join("\n        ");
  const liensLegaux = pagesLegales.map((l) => `<a href="${esc(l.href)}">${esc(l.libelle)}</a>`).join("\n      ");

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(page.titre)}</title>
<meta name="description" content="${esc(page.description)}">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:site_name" content="${esc(site.nom)}">
<meta property="og:locale" content="${esc(site.locale)}">
<meta property="og:title" content="${esc(page.titre)}">
<meta property="og:description" content="${esc(page.description)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${esc(imageOg)}">
<meta property="og:image:secure_url" content="${esc(imageOg)}">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(vignette.alt)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(page.titre)}">
<meta name="twitter:description" content="${esc(page.description)}">
<meta name="twitter:image" content="${esc(imageOg)}">
<meta name="twitter:image:alt" content="${esc(vignette.alt)}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="stylesheet" href="/palette.css">
<link rel="stylesheet" href="/fonts.css">
<style>${STYLE}${page.styleEnPlus ?? ""}</style>
</head>
<body>
<a class="saut" href="#contenu">Aller au contenu</a>

<header>
  <div class="wrap">
    <div class="bar">
      <a class="brand" href="/">${EMBLEME()}${esc(site.nom)}</a>
      <nav aria-label="Navigation principale">
        ${nav}
      </nav>
    </div>
  </div>
</header>

<main id="contenu">
${page.corps}
</main>

<footer>
  <div class="wrap">
    <div class="liens">
      <a href="/">Accueil</a>
      <a href="/provenance">Provenance</a>
      <a href="/docs/">Documentation</a>
      <a href="/a-propos">À propos</a>
      ${liensLegaux}
      <a href="${esc(site.depot)}" rel="noopener noreferrer">GitHub</a>
    </div>
    <p class="credit">© ${annee} ${esc(site.nom)} · Licence ${esc(site.licence)} · Conçu &amp; développé par <a href="/a-propos">${esc(auteur.nom)}</a></p>
  </div>
</footer>

</body>
</html>
`;
}
