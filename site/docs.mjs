/**
 * Fiches de documentation : docs/*.md vers pages HTML dans la coquille du site.
 *
 * Le Markdown reste la source de vérité : il se lit tel quel sur GitHub. Le HTML
 * n'est jamais édité à la main et n'est pas commité : ajouter une fiche, c'est
 * déposer un `.md` dans docs/. Les sous-dossiers (docs/cadrage/) ne sont pas publiés.
 * L'ordre du sommaire vient du préfixe numérique, `index.md` venant toujours en tête.
 */
import { readdir, readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Marked } from "marked";
import { site } from "./config.mjs";
import { coquille, esc } from "./layout.mjs";
import { VIGNETTE_DOCS, fichierDocs } from "./og.mjs";

const DOCS = fileURLToPath(new URL("../docs", import.meta.url));

const slug = (t) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Description de partage : le premier vrai paragraphe, débarrassé du Markdown. */
function resume(source) {
  const para = source.split(/\n{2,}/).map((b) => b.trim()).find((b) => b && !/^[#>|\-=`]/.test(b) && !/^!\[/.test(b));
  if (!para) return `Documentation de ${site.nom}.`;
  const texte = para.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/[*_`]/g, "").replace(/\s+/g, " ").trim();
  return texte.length > 160 ? texte.slice(0, 157).replace(/\s+\S*$/, "") + "..." : texte;
}

const rendu = new Marked({
  renderer: {
    heading({ tokens, depth }) {
      const texte = this.parser.parseInline(tokens);
      const id = slug(texte.replace(/<[^>]+>/g, ""));
      const ancre = depth === 2 || depth === 3 ? ` <a class="ancre" href="#${id}" aria-label="Lien vers cette section">#</a>` : "";
      return `<h${depth} id="${id}">${texte}${ancre}</h${depth}>\n`;
    },
  },
});

const STYLE_DOCS = `
  .doc{display:grid;grid-template-columns:230px minmax(0,1fr);gap:44px;padding:44px 0 64px}
  .sommaire{align-self:start;position:sticky;top:16px;border:4px solid var(--tk-texte);padding:14px 0}
  .sommaire a{display:block;color:var(--tk-texte);font-weight:600;font-size:15px;padding:9px 16px;text-decoration:none;border-left:6px solid transparent}
  .sommaire a:hover,.sommaire a:focus-visible,.sommaire a[aria-current]{border-left-color:var(--tk-texte);text-decoration:underline}
  article h1{margin-bottom:22px}
  article h2{margin:42px 0 14px}
  article h3{margin:28px 0 10px}
  article ul,article ol{padding-left:22px;margin:0 0 16px}
  article li{margin-bottom:7px}
  .ancre{font-family:var(--tk-font-texte);font-size:.6em;font-weight:700;text-decoration:none;margin-left:6px}
  article{min-width:0}
  @media (max-width:820px){.doc{grid-template-columns:minmax(0,1fr);gap:24px}.sommaire{position:static}}
`;

/** Les fiches, prêtes à écrire : { fichier, out, chemin, titre, description, html }. */
export async function fiches() {
  const fichiers = (await readdir(DOCS, { withFileTypes: true }))
    .filter((e) => e.isFile() && e.name.endsWith(".md"))
    .map((e) => e.name)
    .sort((a, b) => (a === "index.md" ? -1 : b === "index.md" ? 1 : a.localeCompare(b, "fr")));

  const lues = await Promise.all(
    fichiers.map(async (fichier) => {
      const source = await readFile(join(DOCS, fichier), "utf8");
      const titre = /^#\s+(.+)$/m.exec(source)?.[1]?.trim() ?? basename(fichier, ".md");
      return { fichier, out: `${basename(fichier, ".md")}.html`, titre, description: resume(source), source };
    }),
  );

  return lues.map((p) => {
    const chemin = p.out === "index.html" ? "/docs/" : `/docs/${p.out}`;
    const sommaire = lues
      .map((q) => {
        const href = q.out === "index.html" ? "/docs/" : `/docs/${q.out}`;
        return `<a href="${href}"${q.out === p.out ? ' aria-current="page"' : ""}>${esc(q.titre)}</a>`;
      })
      .join("\n      ");
    const html = rendu.parse(p.source).replace(/<table>/g, '<div class="table"><table>').replace(/<\/table>/g, "</table></div>");
    return {
      fichier: p.fichier,
      out: p.out,
      chemin,
      titre: p.titre,
      description: p.description,
      html: coquille({
        titre: `${p.titre} | ${site.nom}`,
        description: p.description,
        chemin,
        imageOg: { fichier: fichierDocs(p.out), alt: VIGNETTE_DOCS.alt(p.titre) },
        styleEnPlus: STYLE_DOCS,
        corps: `<div class="wrap doc">
  <nav class="sommaire" aria-label="Fiches de documentation">
      ${sommaire}
  </nav>
  <article>
${html}
  </article>
</div>`,
      }),
    };
  });
}
