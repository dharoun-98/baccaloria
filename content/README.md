# Contenu

Une leçon = un fichier. Pour en ajouter une, copie un fichier existant, modifie-le,
relance le seeder. Rien d'autre à toucher.

```
content/
  maths-pc/
    01-limites-continuite.mjs
    02-suites-numeriques.mjs
    ...
```

## Format

```js
export default {
  slug: 'limites-continuite',          // unique dans la matière, en kebab-case
  unit: { slug: 'analyse', title: 'Analyse', order: 1 },
  title: 'Limites et continuité',
  subtitle: 'Une phrase qui dit à quoi ça sert.',

  difficulty: 2,        // 1 accessible · 2 intermédiaire · 3 exigeant
  estMinutes: 20,
  examFrequency: 5,     // sur combien des 5 derniers examens le chapitre tombe
  accessTier: 'premium',// 'free' pour les leçons vitrines

  objectives: ['...'],  // affichés en tête de leçon
  keyTerms: ['...'],

  blocks: [
    { kind: 'resume', title: "L'essentiel", markdown: '...' },
    { kind: 'pitfall', markdown: '...' },
  ],

  mindmap: { root: { label: '...', children: [...] } },

  questions: [
    {
      stem: 'Question en Markdown, LaTeX autorisé.',
      choices: [['a', 'Réponse A', true], ['b', 'Réponse B', false]],
      explanation: 'Pourquoi. **Obligatoire** — la base refuse de publier sans.',
      difficulty: 2,
    },
  ],
}
```

Les `kind` disponibles sont documentés dans [docs/MODELE-CONTENU.md](../docs/MODELE-CONTENU.md).

## Seeder

```bash
node --env-file=.env.local scripts/seed-content.mjs maths-pc
```

- **Idempotent** : relancer met à jour, ne duplique pas.
- **Rien n'est publié automatiquement.** Tout arrive en `draft`, marqué
  `ai_generated`, et n'apparaît pour les élèves qu'après relecture et
  publication depuis `/admin/contenu`.

C'est volontaire : la base refuse une leçon publiée sans relecteur nommé. Une
formule fausse ne casse rien — elle enseigne simplement quelque chose de faux,
et c'est bien pire.

Une leçon déjà publiée est **ignorée** par le seeder, pour ne pas écraser les
corrections d'un relecteur. `--force` passe outre, et efface ces corrections.

## Reste à consolider

`scripts/seed-sample-lesson.mjs` contient la leçon « Nombres complexes », écrite
avant ce pipeline et publiée directement. Elle fonctionne, mais elle vit en
dehors du système décrit ici. À porter en `content/maths-pc/` quand l'occasion
se présente, pour n'avoir qu'un seul mécanisme.
