import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { auteur, pagesLegales, publie, site } from "./config.mjs";
import { donnees } from "./donnees.mjs";
import { fiches } from "./docs.mjs";
import { VIGNETTES, fichierDocs } from "./og.mjs";

/**
 * Le site est bâti par `scripts/build-site.mjs` à partir de modules. On teste le
 * HTML tel qu'il est produit, sans navigateur. Ce qui se casse en silence est
 * verrouillé ici : les chiffres publiés, les promesses d'installation, l'attribution
 * de la carte, l'absence de ressource tierce et de tiret cadratin.
 */

const RACINE = join(dirname(fileURLToPath(import.meta.url)), "..");
const documents = await fiches();

const pages = {
  accueil: (await import("./pages/index.mjs")).default,
  provenance: (await import("./pages/provenance.mjs")).default,
  apropos: (await import("./pages/a-propos.mjs")).default,
  mentions: (await import("./pages/mentions-legales.mjs")).default,
  confidentialite: (await import("./pages/confidentialite.mjs")).default,
};
const fichesHtml = Object.fromEntries(documents.map((d) => [`docs/${d.out}`, d.html]));
const toutes = [...Object.entries(pages), ...Object.entries(fichesHtml)];

/** Retire les balises pour ne garder que ce qu'un visiteur lit réellement. */
const visible = (html) => html.replace(/<style[\s\S]*?<\/style>/g, "").replace(/<[^>]*>/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const nombre = donnees.nombre;

describe("pied de page", () => {
  it.each(toutes)("%s porte le crédit et pointe vers À propos", (_, html) => {
    expect(html).toContain("Conçu &amp; développé par");
    expect(html).toContain(`<a href="/a-propos">${auteur.nom}</a>`);
  });

  it.each(toutes)("%s liste les pages légales", (_, html) => {
    for (const p of pagesLegales) expect(html).toContain(`href="${p.href}"`);
  });

  it("affiche l'année courante", () => {
    expect(pages.accueil).toContain(`© ${new Date().getFullYear()} ${site.nom}`);
  });
});

describe("identité de l'éditeur", () => {
  it("publie l'adresse du site, pas l'identité Git du dépôt", () => {
    expect(auteur.email).toBe("nounagnonadimou@gmail.com");
    expect(pages.apropos).toContain("mailto:nounagnonadimou@gmail.com");
    for (const [, html] of toutes) expect(html).not.toContain("olouwagnon");
  });

  it("ne publie ni numéro de téléphone, ni identifiant fiscal", () => {
    for (const [, html] of toutes) {
      expect(html).not.toMatch(/wa\.me|whatsapp/i);
      expect(html).not.toMatch(/Identifiant Fiscal|\bIFU\b/);
    }
  });

  it("ouvre les liens externes sans exposer la fenêtre d'origine", () => {
    for (const [, html] of toutes) {
      for (const a of html.match(/<a [^>]*href="https?:\/\/[^"]+"[^>]*>/g) ?? []) {
        if (a.includes(site.url)) continue;
        expect(a, a).toContain('rel="noopener noreferrer"');
      }
    }
  });
});

describe("accessibilité et référencement", () => {
  it.each(toutes)("%s n'a qu'un seul h1", (_, html) => {
    expect(html.match(/<h1[\s>]/g) ?? []).toHaveLength(1);
  });

  it.each(toutes)("%s déclare une URL canonique et une description", (_, html) => {
    expect(html).toContain(`<link rel="canonical" href="${site.url}`);
    expect(html).toMatch(/<meta name="description" content="[^"]{30,}"/);
  });

  it.each(toutes)("%s porte les repères sémantiques et la langue", (_, html) => {
    expect(html).toContain('<html lang="fr">');
    for (const t of ["<header", "<nav", "<main", "<footer"]) expect(html).toContain(t);
  });

  it.each(toutes)("%s n'a aucune image sans alt, et toutes sont dimensionnées", (_, html) => {
    for (const img of html.match(/<img[^>]*>/g) ?? []) {
      expect(img).toMatch(/\salt="[^"]+"/);
      expect(img).toMatch(/\swidth="\d+"/);
      expect(img).toMatch(/\sheight="\d+"/);
    }
  });

  it.each(toutes)("%s n'a pas de tableau sans en-têtes", (_, html) => {
    for (const t of html.match(/<table>[\s\S]*?<\/table>/g) ?? []) expect(t).toContain("<th");
  });

  it("les identifiants de ligne de code ne se coupent pas au tiret", () => {
    expect(pages.accueil).toMatch(/:not\(pre\)>code\{[^}]*white-space:nowrap/);
  });
});

describe("règle éditoriale", () => {
  it.each(toutes)("%s n'emploie aucun tiret cadratin visible", (_, html) => {
    expect(visible(html)).not.toMatch(/[—–]/);
  });

  it("les sources Markdown n'en contiennent pas non plus", () => {
    for (const f of readdirSync(join(RACINE, "docs")).filter((f) => f.endsWith(".md"))) {
      expect(readFileSync(join(RACINE, "docs", f), "utf8"), f).not.toMatch(/[—–]/);
    }
  });
});

describe("charte : tout passe par les jetons de la marque", () => {
  it.each(toutes)("%s n'écrit aucune couleur en dur dans ses styles", (_, html) => {
    for (const bloc of html.match(/<style>[\s\S]*?<\/style>/g) ?? []) expect(bloc).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  it.each(toutes)("%s charge les jetons et les polices du site", (_, html) => {
    expect(html).toContain('<link rel="stylesheet" href="/palette.css">');
    expect(html).toContain('<link rel="stylesheet" href="/fonts.css">');
  });

  it("aucune colonne de grille ne s'écrit 1fr seul : son minimum est la largeur du contenu et fait déborder un écran étroit", () => {
    for (const [nom, html] of toutes) {
      for (const bloc of html.match(/<style>[\s\S]*?<\/style>/g) ?? []) {
        for (const regle of bloc.match(/grid-template-columns:[^;}]*/g) ?? []) {
          const sansSurs = regle.replace(/minmax\(0,\s*1fr\)/g, "").replace(/repeat\(auto-fit,minmax\([^)]*\)\)/g, "");
          expect(sansSurs, `${nom} : ${regle}`).not.toMatch(/\b1fr\b/);
        }
      }
    }
  });

  it("aucun trait fin de 1 px dans les styles", () => {
    for (const [, html] of toutes) for (const bloc of html.match(/<style>[\s\S]*?<\/style>/g) ?? []) expect(bloc).not.toMatch(/(?:border|outline)[a-z-]*:\s*1px/);
  });
});

describe("cohérence des faits publiés", () => {
  it("la politique de confidentialité nie les cookies, et le site n'en pose aucun", () => {
    expect(pages.confidentialite).toContain("Aucun <b>cookie</b> n'est déposé");
    for (const [, html] of toutes) {
      expect(html).not.toMatch(/document\.cookie|localStorage|sessionStorage/);
      expect(html).not.toMatch(/<script/i);
      expect(html).not.toMatch(/\son[a-z]+=/i);
    }
  });

  it("aucune page ne charge de ressource tierce", () => {
    for (const [nom, html] of toutes) {
      for (const lien of html.match(/<link [^>]*>/g) ?? []) {
        const href = /href="([^"]+)"/.exec(lien)?.[1] ?? "";
        if (/^https?:\/\//.test(href)) expect(href.startsWith(site.url), `${nom} : ${lien}`).toBe(true);
      }
      for (const src of html.match(/\ssrc="[^"]+"/g) ?? []) expect(src, nom).not.toMatch(/src="https?:\/\/(?!takienta\.sabar\.app)/);
      expect(html, nom).not.toMatch(/fonts\.googleapis|fonts\.gstatic|cdn\./);
    }
  });

  it("les chiffres de l'accueil et de la provenance sont ceux de data/", () => {
    const { compte } = donnees;
    expect([compte.departements, compte.communes, compte.arrondissements, compte.poles]).toEqual([12, 77, 546, 6]);
    for (const n of [compte.departements, compte.communes, compte.arrondissements, compte.poles]) {
      expect(pages.accueil).toContain(`<span class="chiffre">${n}</span>`);
      expect(pages.provenance).toContain(`<td>${nombre(n)}</td>`);
    }
    expect(visible(pages.provenance)).toContain(`${compte.graphiesDeduites} noms d'arrondissement sur ${compte.arrondissements}`);
    expect(pages.provenance).toContain(`Les ${compte.sources} sources`);
  });

  it("tout nombre d'unités cité dans la documentation égale le compte réel", () => {
    const reels = { départements: 12, communes: 77, arrondissements: 546, pôles: 6 };
    for (const f of readdirSync(join(RACINE, "docs")).filter((f) => f.endsWith(".md"))) {
      const texte = readFileSync(join(RACINE, "docs", f), "utf8");
      for (const [, n, unite] of texte.matchAll(/\b(\d+) (départements|communes|arrondissements|pôles)\b/g)) {
        expect(Number(n), `${f} : « ${n} ${unite} »`).toBe(reels[unite]);
      }
    }
  });

  it("les niveaux de confiance affichés sont ceux des données", () => {
    for (const [id, s] of Object.entries(donnees.sources)) {
      const bloc = pages.provenance.match(new RegExp(`<article class="mur source" id="${id}">[\\s\\S]*?</article>`))?.[0];
      expect(bloc, `source ${id} absente de la page`).toBeDefined();
      expect(bloc).toContain(`badge ${s.confiance}`);
      if (s.sha256) expect(bloc).toContain(s.sha256);
    }
  });

  it("dit ce qui est provisoire et ce que l'on ignore", () => {
    const texte = visible(pages.provenance);
    for (const m of ["provisoire", "après 2013", "Grand-Nokoué", "décret", "517 villages"]) expect(texte).toContain(m);
    expect(donnees.arrondissementsProvisoires).toBe(true);
    expect(donnees.calquePoles.provisoire).toBe(true);
  });

  it("l'empreinte attendue de la loi est celle du fichier archivé", () => {
    const attendue = donnees.sources["loi-2013-05"].sha256;
    const calculee = execFileSync("shasum", ["-a", "256", join(RACINE, "data/sources/loi-2013-05.pdf")], { encoding: "utf8" }).split(" ")[0];
    expect(calculee).toBe(attendue);
    expect(pages.provenance).toContain(`# attendu : ${attendue}`);
  });
});

describe("promesses d'installation", () => {
  const sourcesDoc = () => readdirSync(join(RACINE, "docs")).filter((f) => f.endsWith(".md")).map((f) => readFileSync(join(RACINE, "docs", f), "utf8")).join("\n") + readFileSync(join(RACINE, "README.md"), "utf8");
  const html = () => toutes.map(([, h]) => h).join("\n");
  const npm = /npm (?:install|i) benin-geo|npmjs\.com\/package\/benin-geo/;
  const pip = /pip install benin-geo|pypi\.org\/project\/benin-geo/;

  // Les pages se règlent seules sur `publie`, mais la documentation Markdown est écrite à la main :
  // passer l'indicateur à true sans la mettre à jour doit faire échouer ces tests.
  it("npm : annoncé nulle part tant que non publié, et dans la documentation dès qu'il l'est", () => {
    expect(npm.test(html())).toBe(publie.npm);
    expect(npm.test(sourcesDoc())).toBe(publie.npm);
  });

  it("PyPI : annoncé nulle part tant que non publié, et dans la documentation dès qu'il l'est", () => {
    expect(pip.test(html())).toBe(publie.pypi);
    expect(pip.test(sourcesDoc())).toBe(publie.pypi);
  });

  it("tant que rien n'est publié, l'accueil dit « pré-publication » et la documentation parle des sources", () => {
    if (publie.npm || publie.pypi) return;
    expect(pages.accueil).toContain("Pré-publication");
    expect(sourcesDoc()).toContain("pas encore publiés");
  });
});

describe("le nom : seulement ce qui est sourcé", () => {
  const readme = readFileSync(join(RACINE, "README.md"), "utf8");
  const note = readFileSync(join(RACINE, "docs/cadrage/recherche-nom-takienta.md"), "utf8");
  const publics = [["page À propos", visible(pages.apropos)], ["README", readme]];

  it("cite l'UNESCO et l'article universitaire, avec leurs adresses exactes", () => {
    for (const url of ["https://whc.unesco.org/en/list/1140/", "https://revues.acaref.net/wp-content/uploads/sites/3/2024/01/8-Guy-Hermann-Mawusse-PADENOU.pdf"]) {
      expect(pages.apropos).toContain(`href="${url}"`);
      expect(readme).toContain(url);
      expect(note, "la note de recherche doit citer la même adresse").toContain(url);
    }
  });

  it.each(publics)("%s : donne le pluriel établi et signale que l'orthographe varie", (_, texte) => {
    expect(texte).toContain("sikien");
    expect(texte).toMatch(/orthographe varie/);
  });

  it.each(publics)("%s : n'affirme pas ce que la recherche n'a pas établi", (_, texte) => {
    expect(texte).not.toMatch(/péjorati/i);
    expect(texte).not.toMatch(/n'emploient pas|n'utilisent pas|rejettent/i);
    expect(texte).not.toMatch(/tourelles? coniques?/i);
    expect(texte).not.toMatch(/takienti/i);
  });

  it.each(publics)("%s : décrit « somba » comme un nom donné de l'extérieur, sans plus", (_, texte) => {
    expect(texte).toMatch(/nom donné de l'extérieur/);
    expect(texte).toMatch(/bariba/);
    expect(texte).toMatch(/administration coloniale française/);
  });

  it("le README donne les mêmes comptes que les données", () => {
    const { compte } = donnees;
    const ligne = (niveau) => Number(new RegExp(`\\| ${niveau} \\| (\\d+) \\|`).exec(readme)?.[1]);
    expect([ligne("Départements"), ligne("Communes"), ligne("Arrondissements"), ligne("Pôles de développement")]).toEqual([compte.departements, compte.communes, compte.arrondissements, compte.poles]);
    expect(readme).not.toMatch(/[—–]/);
  });

  it("le README ne parle ni de la source privée, ni d'une installation non publiée", () => {
    expect(readme).toContain("Pré-publication");
    expect(readme).not.toMatch(/npm install benin-geo|pip install benin-geo/);
  });
});

describe("carte des départements", () => {
  const aLaCarte = (html) => html.includes('class="carte-svg"') || html.includes("benin-departements.svg");

  it.each(toutes)("%s n'affiche jamais la carte sans son attribution", (_, html) => {
    if (!aLaCarte(html)) return;
    expect(visible(html)).toContain(donnees.carte.attribution);
    expect(visible(html)).toContain("illustration seulement");
  });

  it("l'accueil affiche la carte intégrée, avec son attribution (le test ci-dessus ne serait pas vide)", () => {
    expect(aLaCarte(pages.accueil)).toBe(true);
    expect(visible(pages.accueil)).toContain(donnees.carte.attribution);
  });

  it("les douze départements de la carte sont ceux des données, chacun avec sa fiche et son étiquette", () => {
    const ids = [...pages.accueil.matchAll(/<g class="dept" id="([^"]+)"/g)].map((m) => m[1]).sort();
    expect(ids).toEqual(donnees.departements.map((d) => d.id).sort());
    for (const d of donnees.departements) {
      const communes = donnees.communes.filter((c) => c.parent === d.id).length;
      const arr = donnees.arrondissements.filter((a) => a.id.startsWith(d.id + "-")).length;
      expect(pages.accueil).toContain(`id="i-${d.id}"`);
      expect(pages.accueil).toContain(`aria-label="${d.nom} : ${communes} ${communes > 1 ? "communes" : "commune"}, ${arr} arrondissements"`);
      expect(pages.accueil).toContain(`#${d.id}:hover,#${d.id}:focus) #i-${d.id}{display:block}`);
    }
  });

  it("chaque département se parcourt au clavier", () => {
    expect((pages.accueil.match(/<g class="dept"[^>]*tabindex="0"/g) ?? []).length).toBe(12);
  });

  it("le fichier SVG autonome existe toujours, avec son attribution dans sa description", () => {
    expect(readFileSync(join(RACINE, "assets/carte/benin-departements.svg"), "utf8")).toContain("geoBoundaries");
  });
});

describe("mouvement : sans JavaScript, et sans imposer le mouvement", () => {
  const toutesLesFeuilles = (html) => (html.match(/<style>[\s\S]*?<\/style>/g) ?? []).join("\n");

  it.each(toutes)("%s : toute animation est coupée pour les personnes qui le demandent", (_, html) => {
    const css = toutesLesFeuilles(html);
    expect(css).toMatch(/@media \(prefers-reduced-motion:reduce\)[\s\S]*\*,\*::before,\*::after\{animation:none!important;transition:none!important\}/);
    expect(css).toMatch(/@view-transition\{navigation:none\}/);
  });

  it.each(toutes)("%s : transitions de page et barre de progression au défilement", (_, html) => {
    const css = toutesLesFeuilles(html);
    expect(css).toContain("@view-transition{navigation:auto}");
    expect(css).toMatch(/@supports \(animation-timeline:scroll\(\)\)/);
  });

  it.each(toutes)("%s : les révélations au défilement ne cachent rien aux navigateurs qui ne les gèrent pas", (_, html) => {
    const css = toutesLesFeuilles(html);
    // L'état de départ (opacity:0) ne doit exister que dans des @keyframes, jamais dans une règle de base.
    const sansKeyframes = css.replace(/@keyframes [\w-]+\{(?:[^{}]|\{[^{}]*\})*\}/g, "");
    expect(sansKeyframes).not.toMatch(/opacity:\s*0\b(?!\.)/);
  });

  it.each(toutes)("%s : les ombres sont pleines, jamais diffuses (murs épais)", (_, html) => {
    for (const m of toutesLesFeuilles(html).matchAll(/box-shadow:([^;}]+)/g)) {
      expect(m[1].trim(), m[0]).toMatch(/^-?\d+px -?\d+px 0 var\(--tk-[a-z-]+\)$/);
    }
  });

  it("le titre de l'accueil garde exactement l'accroche, mot pour mot, malgré l'animation", () => {
    const h1 = /<h1>([\s\S]*?)<\/h1>/.exec(pages.accueil)[1];
    const texte = [...h1.matchAll(/<span class="mot" style="--m:\d+">([^<]*)<\/span>/g)].map((m) => m[1]).join(" ");
    expect(texte.replace(/&#39;/g, "'").replace(/&amp;/g, "&")).toBe(site.accroche);
  });

  it("l'emblème de l'en-tête se trace au chargement", () => {
    expect(pages.accueil).toContain('class="emb-mini"');
    expect(pages.accueil).toMatch(/\.emb-mini \[pathLength\]\{[^}]*stroke-dashoffset:1;animation:trace/);
  });
});

describe("l'emboîtement : un schéma piloté par les données", () => {
  it("les quatre niveaux affichent les vrais comptes", () => {
    const { compte } = donnees;
    for (const [id, n] of [["pole", compte.poles], ["dep", compte.departements], ["com", compte.communes], ["arr", compte.arrondissements]]) {
      expect(pages.accueil).toContain(`id="n-${id}"`);
      expect(pages.accueil).toContain(`aria-label="${n} `);
    }
  });

  it("l'identifiant d'exemple est celui d'un vrai arrondissement, découpé sans rien perdre", () => {
    const [, dep, com, num] = /BJ-([A-Z]{2})-([A-Z]{2,4})-(\d{2})/.exec(donnees.exemple.id);
    const anatomie = /<p class="anatomie">([\s\S]*?)<\/p>/.exec(pages.accueil)[1].replace(/<[^>]+>/g, "");
    expect(anatomie).toBe(`BJ-${dep}-${com}-${num}`);
    expect(anatomie).toBe(donnees.exemple.id);
    expect(donnees.arrondissements.some((a) => a.id === anatomie)).toBe(true);
  });

  it("dit que le pôle n'entre pas dans l'identifiant", () => {
    expect(visible(pages.accueil)).toContain("Le pôle n'entre jamais dans l'identifiant");
  });
});

describe("exemples de la documentation : exécutés contre les vrais paquets", () => {
  const dist = join(RACINE, "packages/js/dist/index.js");
  const faits = [
    ['chercher("abomey calavi")[0].id', "BJ-AQ-ABO"],
    ['communesDe("BJ-BO").length', 8],
    ['hierarchie("BJ-AL-KAN-04").pole.nom', "Nord-Est"],
    ['hierarchie("BJ-AL-KAN-04").departement.nom', "Alibori"],
    ['hierarchie("BJ-AL-KAN-04").commune.nom', "Kandi"],
    ['hierarchie("BJ-AL-KAN-04").arrondissement.nom', "Kandi 1"],
    ['chercher("seme podji").map((e) => e.id)', ["BJ-OU-SEM"]],
    ['chercher("seme pdji").length', 0],
    ['chercher("ndali").map((e) => e.id)', ["BJ-BO-NDA"]],
    ['chercher("abomeycalavi").map((e) => e.id)', ["BJ-AQ-ABO"]],
    ['chercher("1er arrondissement", { niveau: "arrondissement", dans: "BJ-LI-COT" }).map((e) => e.id)', ["BJ-LI-COT-01"]],
  ];

  it("le paquet JavaScript est construit", () => {
    expect(existsSync(dist), "construire d'abord le paquet : pnpm --filter benin-geo build").toBe(true);
  });

  it.each(faits)("JavaScript : %s", async (expression, attendu) => {
    const b = await import(dist);
    const evalue = new Function(...Object.keys(b), `return (${expression});`);
    expect(evalue(...Object.values(b))).toEqual(attendu);
  });

  it("Python donne les mêmes résultats que ceux affichés", () => {
    const script = `
import json, benin_geo as b
h = b.hierarchie("BJ-AL-KAN-04")
print(json.dumps([b.chercher("abomey calavi")[0].id, len(b.communes_de("BJ-BO")), h.pole.nom, h.departement.nom, h.commune.nom, h.arrondissement.nom,
  [e.id for e in b.chercher("seme podji")], len(b.chercher("seme pdji")), [e.id for e in b.chercher("1er arrondissement", niveau="arrondissement", dans="BJ-LI-COT")]]))`;
    const sortie = JSON.parse(execFileSync("python3", ["-c", script], { env: { ...process.env, PYTHONPATH: join(RACINE, "packages/python/src") }, encoding: "utf8" }));
    expect(sortie).toEqual(["BJ-AQ-ABO", 8, "Nord-Est", "Alibori", "Kandi", "Kandi 1", ["BJ-OU-SEM"], 0, ["BJ-LI-COT-01"]]);
  });

  it("la documentation et l'accueil affichent ces mêmes valeurs", () => {
    const demarrage = visible(fichesHtml["docs/01-demarrage.html"]);
    const accueil = visible(pages.accueil);
    for (const v of ['"BJ-AQ-ABO"', '"Nord-Est"']) {
      expect(demarrage).toContain(v);
      expect(accueil).toContain(v);
    }
    for (const v of ['"Alibori"', '"Kandi"', '"Kandi 1"']) expect(demarrage).toContain(v);
    // La valeur écrite en commentaire est celle que l'expression produit réellement.
    for (const [, attendu] of faits.slice(0, 6)) {
      expect(demarrage, `// ${JSON.stringify(attendu)}`).toContain(`// ${JSON.stringify(attendu)}`);
      expect(demarrage, `# ${JSON.stringify(attendu)}`).toContain(`# ${JSON.stringify(attendu)}`);
    }
    expect(fichesHtml["docs/02-reference-api.html"]).toContain("BJ-LI-COT");
  });

  it("toute fonction citée dans la documentation existe dans les deux paquets", () => {
    const jsSrc = readFileSync(join(RACINE, "packages/js/src/index.ts"), "utf8");
    const pySrc = readFileSync(join(RACINE, "packages/python/src/benin_geo/__init__.py"), "utf8");
    for (const f of ["parId", "communesDe", "arrondissementsDe", "polesDe", "hierarchie", "chercher"]) expect(jsSrc).toContain(`function ${f}(`);
    for (const f of ["par_id", "communes_de", "arrondissements_de", "poles_de", "hierarchie", "chercher"]) expect(pySrc).toContain(`def ${f}(`);
  });
});

describe("liens internes", () => {
  const routes = new Set(["/", "/provenance", "/a-propos", "/mentions-legales", "/confidentialite", ...documents.map((d) => d.chemin)]);
  const statiques = new Set(["/favicon.svg", "/favicon-32.png", "/apple-touch-icon.png", "/palette.css", "/fonts.css", "/img/benin-departements.svg"]);
  const ids = (html) => new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  const pageDe = (chemin) => toutes.find(([nom]) => (nom.startsWith("docs/") ? `/docs/${nom.slice(5)}` === chemin || (nom === "docs/index.html" && chemin === "/docs/") : false))?.[1]
    ?? { "/": pages.accueil, "/provenance": pages.provenance, "/a-propos": pages.apropos, "/mentions-legales": pages.mentions, "/confidentialite": pages.confidentialite }[chemin];

  it.each(toutes)("%s : chaque lien interne mène quelque part", (nom, html) => {
    const courant = nom.startsWith("docs/") ? (nom === "docs/index.html" ? "/docs/" : `/${nom}`) : nom === "accueil" ? "/" : `/${{ provenance: "provenance", apropos: "a-propos", mentions: "mentions-legales", confidentialite: "confidentialite" }[nom]}`;
    for (const [, href] of html.matchAll(/<a [^>]*href="([^"]+)"/g)) {
      if (/^(https?:|mailto:)/.test(href)) continue;
      const [chemin, ancre] = href.split("#");
      const absolu = chemin === "" ? courant : chemin.startsWith("/") ? chemin : `/docs/${chemin}`;
      expect(routes.has(absolu) || statiques.has(absolu), `${nom} : ${href}`).toBe(true);
      if (ancre) expect(ids(pageDe(absolu) ?? "").has(ancre), `${nom} : ancre ${href}`).toBe(true);
    }
  });
});

describe("vignettes de partage", () => {
  const meta = (html, cle) => html.match(new RegExp(`<meta (?:property|name)="${cle}" content="([^"]*)"`))?.[1] ?? null;

  it.each(toutes)("%s déclare une image absolue en https, dimensionnée et décrite", (_, html) => {
    const img = meta(html, "og:image");
    expect(img).toMatch(/^https:\/\//);
    expect(img).toContain(site.url);
    expect(meta(html, "og:image:width")).toBe("1200");
    expect(meta(html, "og:image:height")).toBe("630");
    expect(meta(html, "og:image:type")).toBe("image/png");
    expect(meta(html, "og:image:alt")?.length ?? 0).toBeGreaterThan(30);
  });

  it.each(toutes)("%s porte la carte Twitter en grand format", (_, html) => {
    expect(meta(html, "twitter:card")).toBe("summary_large_image");
    expect(meta(html, "twitter:title")).toBe(meta(html, "og:title"));
    expect(meta(html, "twitter:image")).toBe(meta(html, "og:image"));
    expect(meta(html, "og:site_name")).toBe(site.nom);
    expect(meta(html, "og:locale")).toBe("fr_FR");
  });

  it.each(toutes)("%s propose une icône aux clients qui l'affichent", (_, html) => {
    expect(html).toContain('<link rel="apple-touch-icon" href="/apple-touch-icon.png">');
    expect(html).toContain('<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">');
  });

  it("chaque page a SA vignette, aucune n'est partagée", () => {
    const images = toutes.map(([, html]) => meta(html, "og:image"));
    expect(new Set(images).size).toBe(images.length);
  });

  it("chaque vignette existe sur le disque, en 1200x630, sous 300 Ko", () => {
    const fichiers = [...Object.values(VIGNETTES).map((v) => v.fichier), ...documents.map((d) => fichierDocs(d.out))];
    for (const f of fichiers) {
      const png = readFileSync(join(RACINE, "site/img/og", f));
      expect(png.subarray(1, 4).toString(), f).toBe("PNG");
      expect(png.readUInt32BE(16), f).toBe(1200);
      expect(png.readUInt32BE(20), f).toBe(630);
      expect(png.length, f).toBeLessThan(300 * 1024);
    }
  });

  it("couvre exactement les pages publiées", () => {
    expect(Object.keys(VIGNETTES).sort()).toEqual(["/", "/a-propos", "/confidentialite", "/mentions-legales", "/provenance"]);
  });
});

describe("construction", () => {
  const sortie = join(RACINE, "dist-site");
  const parcourir = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? parcourir(join(d, e.name)) : [join(d, e.name)]));

  it("produit le site, sans copier le moindre code de construction", () => {
    execFileSync("node", [join(RACINE, "scripts/build-site.mjs")], { stdio: "ignore" });
    const fichiers = parcourir(sortie).map((f) => f.slice(sortie.length + 1));
    for (const f of fichiers) expect(f, f).not.toMatch(/\.(mjs|ts|map|md|json)$|\.test\./);
    for (const attendu of ["index.html", "provenance.html", "a-propos.html", "docs/index.html", "palette.css", "fonts.css", "favicon.svg", "favicon.ico", "robots.txt", "sitemap.xml",
      "fonts/caprasimo-latin-400-normal.woff2", "fonts/figtree-latin-wght-normal.woff2", "fonts/LICENSE-caprasimo.txt", "fonts/LICENSE-figtree.txt", "img/benin-departements.svg"]) {
      expect(fichiers, attendu).toContain(attendu);
    }
  });

  it("le sitemap liste toutes les pages et les fiches, avec l'URL canonique du site", () => {
    const sitemap = readFileSync(join(sortie, "sitemap.xml"), "utf8");
    for (const u of ["/", "/provenance", "/a-propos", "/docs/", "/docs/01-demarrage.html"]) expect(sitemap).toContain(`<loc>${site.url}${u}</loc>`);
    expect(readFileSync(join(sortie, "robots.txt"), "utf8")).toContain(`Sitemap: ${site.url}/sitemap.xml`);
  });

  it("le site entier reste léger", () => {
    const total = parcourir(sortie).reduce((n, f) => n + statSync(f).size, 0);
    expect(total).toBeLessThan(2 * 1024 * 1024);
  });
});
