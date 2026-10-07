# Marque Takienta

Fichier généré par `scripts/build-brand.mjs` depuis `tokens.json`. Ne pas modifier à la main.

L'emblème est le plan d'une takienta : quatre enveloppes chanfreinées emboîtées, murs épais, une seule
ouverture dans le mur extérieur. Elles disent la hiérarchie des données : pôle, département, commune,
arrondissement. Les angles sont chanfreinés, jamais arrondis. Aucune image bitmap n'est utilisée par le site :
les PNG ne servent qu'aux favicons et à l'icône d'écran d'accueil.

## Palette

| Jeton | Valeur | Rôle | Référence |
|---|---|---|---|
| `--tk-banco` | `#E8DCC8` | fond | banco, terre crue |
| `--tk-encre` | `#2A211A` | encre | ombre des murs épais |
| `--tk-laterite` | `#B5532A` | accent | latérite de l'Atacora |
| `--tk-chaume` | `#D9A441` | secondaire | chaume des greniers |
| `--tk-plaine` | `#5C7A4A` | signal | plaine cultivée |

Variantes pour le texte, ajoutées parce que la couleur d'origine ne passe pas AA :

| Jeton | Valeur | Pour | Pourquoi |
|---|---|---|---|
| `--tk-laterite-texte` | `#9C4824` | texte sur banco | latérite assombrie : la couleur d'origine n'atteint que 3,66 sur banco |
| `--tk-laterite-sur-encre` | `#D46F44` | texte sur encre | latérite éclaircie : la couleur d'origine n'atteint que 3,18 sur encre |
| `--tk-plaine-texte` | `#4E673E` | texte sur banco | plaine assombrie : la couleur d'origine n'atteint que 3,57 sur banco |
| `--tk-plaine-sur-encre` | `#70955A` | texte sur encre | plaine éclaircie : la couleur d'origine n'atteint que 3,26 sur encre |

## Contrastes (calculés, WCAG 2.x)

| Couple | Rapport | Niveau tenu | Usage |
|---|---|---|---|
| `encre` sur `banco` | 11,65 | AA, texte courant | texte courant |
| `banco` sur `encre` | 11,65 | AA, texte courant | texte courant en thème sombre |
| `laterite-texte` sur `banco` | 4,61 | AA, texte courant | liens et mots accentués |
| `laterite-sur-encre` sur `encre` | 4,63 | AA, texte courant | liens et mots accentués en thème sombre |
| `plaine-texte` sur `banco` | 4,65 | AA, texte courant | statut positif en texte |
| `plaine-sur-encre` sur `encre` | 4,61 | AA, texte courant | statut positif en texte, thème sombre |
| `chaume` sur `encre` | 7,02 | AA, texte courant | mise en valeur sur fond sombre |
| `encre` sur `chaume` | 7,02 | AA, texte courant | texte sur aplat chaume |
| `laterite` sur `banco` | 3,66 | graphique et grand texte | emblème, filets épais, grands aplats, texte de 24 px et plus |
| `plaine` sur `banco` | 3,57 | graphique et grand texte | pastilles et indicateurs, jamais du texte courant |
| `banco` sur `laterite` | 3,66 | graphique et grand texte | texte de 24 px et plus sur aplat latérite |

À ne jamais faire :

- `chaume` sur `banco` : contraste de 1,66 : illisible, même en grand.

## Typographie

Fichiers copiés depuis le projet Kpanlingan (paquets Fontsource installés dans son node_modules), identiques octet pour octet à ceux que https://kpanlingan.sabar.app/ sert.

| Rôle | Police | Fichier | Licence |
|---|---|---|---|
| titre | Caprasimo, graisse 400 | `fonts/caprasimo-latin-400-normal.woff2` | OFL-1.1, voir `fonts/LICENSE-caprasimo.txt` |
| texte | Figtree Variable, graisse 300 900 | `fonts/figtree-latin-wght-normal.woff2` | OFL-1.1, voir `fonts/LICENSE-figtree.txt` |

- Caprasimo sert aux titres seulement : une seule graisse (400), jamais en texte courant ni sous 20 px.
- Figtree Variable sert au texte courant, de 300 à 900. Les titres de niveau 4 et moins peuvent aussi y passer.
- Seul le sous-ensemble latin est embarqué (environ 41 Ko). Un caractère hors de cette plage, par exemple les lettres ɛ ou ɔ, tombe sur la police de secours.

Les textes de licence OFL accompagnent les fichiers et doivent rester avec eux si les polices sont redistribuées.

## Fichiers

| Fichier | Usage |
|---|---|
| `palette.css` | Variables CSS, thème clair et sombre (`prefers-color-scheme` ou `data-theme`). |
| `fonts.css`, `fonts/` | Caprasimo et Figtree Variable (sous-ensemble latin), licences OFL, variables `--tk-font-*`. |
| `svg/emblem.svg` | Emblème complet en `currentColor`, à inliner. |
| `svg/emblem-encre.svg`, `emblem-banco.svg`, `emblem-laterite.svg` | Emblème complet en une couleur fixe, pour `<img>`. |
| `svg/favicon.svg` | Variante à trois niveaux, traits épaissis, pour 16 à 32 px. Suit le thème du navigateur. |
| `svg/favicon-opaque.svg`, `svg/apple-touch-icon.svg` | Sources des PNG et de l'ICO, sur fond banco. |
| `png/`, `favicon.ico` | Rendus de ces sources (`scripts/rendre-marque.mjs`), commités. |
