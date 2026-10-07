On démarre **Takienta**, un projet open source qui expose la structure
administrative du Bénin. Tout le cadrage est déjà fait, ne le refais pas.

## 1. Lis le cadrage avant toute chose

```
~/Documents/Projets/Elodias/labo/benin-geo/PROMPT-TAKIENTA.md
```

Lis-le **en entier** avant de proposer quoi que ce soit. Il contient le
périmètre, la stack, les invariants, la direction artistique, l'ordre de travail
et surtout l'état réel des sources de données, qui est le vrai problème de ce
projet. Deux autres fichiers l'accompagnent dans le même dossier :

- `poles-2026-09-23.json` — les 77 communes réparties sur les 6 pôles, avec leur
  provenance. Donnée vérifiée et recoupée, à ne pas régénérer.
- `verif-poles.py` — le script de recoupement qui a servi à la valider.

## 2. Range le cadrage dans le projet

Le projet se développe dans `~/Documents/Projets/Elodias/Takienta`, qui est
actuellement **vide**. Déplace `labo/benin-geo/` dedans et organise-le comme tu
juges, en expliquant ton choix. Le fichier JSON est de la donnée de production,
pas de la documentation : il finira dans l'arborescence des données, pas à côté
du prompt.

## 3. Le dépôt

Le dépôt GitHub est **déjà créé**. Il n'y a pas encore de dépôt Git local dans
`Takienta/` : c'est à toi de l'initialiser et de le brancher. L'URL attendue est
de la forme `git@github-perso:Elodias2001/Takienta.git` — demande-moi de
confirmer avant de la poser, je te la donne.

**Avant le moindre commit**, verrouille l'identité. Ce dépôt est personnel et la
configuration Git globale de cette machine porte une identité professionnelle
qui ne doit jamais y apparaître :

```bash
git config --local user.name  "Elodias (Perso)"
git config --local user.email "olouwagnon@gmail.com"
git var GIT_AUTHOR_IDENT      # doit afficher Elodias (Perso)
```

**Tu ne pousses pas et tu ne déploies pas sans que je le demande.** Aucun secret
dans le diff.

## 4. Propose-moi le logo

Je veux voir des propositions de logo. La direction artistique est dans la
section 8 du cadrage : la **takienta**, la maison-tour en banco des Batammariba
de l'Atacora, dont la logique d'emboîtement est littéralement le modèle de
données du projet, pôle contient département contient commune contient
arrondissement contient quartier.

Donne-moi **deux ou trois concepts distincts**, en SVG, pas des variations du
même. Chacun doit tenir à 24 px comme à 400 px, fonctionner en une seule couleur,
et s'appuyer sur la palette du cadrage plutôt que d'en inventer une. Montre-les
côte à côte, aux deux tailles, sur fond clair et sur fond sombre.

Le logo ne dépend d'aucune donnée : tu peux me le proposer tout de suite, en
parallèle du reste.

## 5. Par quoi tu commences vraiment

L'ordre de travail est en section 13 du cadrage. **L'étape 1 est le sourcing des
données, et c'est un point d'arrêt** : tu me montres l'état des sources avant
d'écrire une ligne de code du paquet. Si les sources ne tiennent pas, tout le
reste est du vent.

Le logo et le sourcing peuvent avancer en parallèle. Le code du paquet, non.
