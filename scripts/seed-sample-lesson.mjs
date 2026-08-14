/**
 * Seeds one complete sample lesson: Nombres complexes (Maths, filière PC).
 *
 *     node --env-file=.env.local scripts/seed-sample-lesson.mjs
 *
 * Purpose is twofold: give the lesson reader something real to render, and give
 * whoever writes the rest of the content a concrete template for what "one
 * finished lesson" means — blocks, mind map, quiz bank, explanations.
 *
 * ⚠️ The mathematics here is standard 2 Bac material, but this content has NOT
 * been reviewed by a teacher. `reviewed_by` is filled with a placeholder so the
 * database's publish constraint is satisfied. Before real students see it, a
 * subject teacher must read it and re-publish under their own account.
 *
 * Re-runnable: deletes the previous sample first.
 */
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key || key === 'PASTE_ME') {
  console.error('Run with: node --env-file=.env.local scripts/seed-sample-lesson.mjs')
  process.exit(1)
}

const db = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const LESSON_SLUG = 'nombres-complexes-forme-algebrique'
const UNIT_SLUG = 'nombres-complexes'

// ---------------------------------------------------------------- content ---
const BLOCKS = [
  {
    kind: 'resume',
    title_fr: "L'essentiel",
    markdown: String.raw`Certaines équations n'ont pas de solution dans $\mathbb{R}$. La plus simple :
$x^2 = -1$. Aucun réel au carré ne donne un nombre négatif.

On introduit donc un nouveau nombre, noté $i$, défini par $i^2 = -1$. À partir
de lui on construit l'ensemble des **nombres complexes** $\mathbb{C}$, qui
contient $\mathbb{R}$ et dans lequel *toute* équation du second degré admet des
solutions.

Un nombre complexe s'écrit sous **forme algébrique** :

$$z = a + ib \quad \text{avec } a \in \mathbb{R},\ b \in \mathbb{R}$$

- $a$ est la **partie réelle**, notée $\operatorname{Re}(z)$
- $b$ est la **partie imaginaire**, notée $\operatorname{Im}(z)$

Attention : la partie imaginaire est le réel $b$, **pas** $ib$.

Deux complexes sont égaux si et seulement si leurs parties réelles sont égales
*et* leurs parties imaginaires sont égales. C'est ce qui permet, en pratique,
de transformer une équation complexe en un système de deux équations réelles.`,
  },
  {
    kind: 'definition',
    title_fr: 'Conjugué',
    markdown: String.raw`Le **conjugué** de $z = a + ib$ est :

$$\bar{z} = a - ib$$

Géométriquement, c'est le symétrique de $z$ par rapport à l'axe des abscisses.

Propriété centrale, utilisée en permanence :

$$z\bar{z} = a^2 + b^2 \in \mathbb{R}_+$$

C'est elle qui permet de **rendre un dénominateur réel** : pour simplifier
$\dfrac{1}{z}$, on multiplie haut et bas par $\bar{z}$.`,
  },
  {
    kind: 'formula',
    title_fr: 'Module',
    markdown: String.raw`$$|z| = \sqrt{a^2 + b^2} \qquad \text{et} \qquad |z|^2 = z\bar{z}$$

Le module est la distance de l'origine au point d'affixe $z$. Il est toujours
**réel et positif**.

Règles à connaître par cœur :

$$|z_1 z_2| = |z_1| \cdot |z_2| \qquad
\left|\frac{z_1}{z_2}\right| = \frac{|z_1|}{|z_2|} \qquad
|z^n| = |z|^n$$

$$|\bar{z}| = |z| \qquad |-z| = |z|$$

En revanche, $|z_1 + z_2| \neq |z_1| + |z_2|$ en général : on a seulement
l'inégalité triangulaire $|z_1 + z_2| \leqslant |z_1| + |z_2|$.`,
  },
  {
    kind: 'method',
    title_fr: 'Résoudre $az^2 + bz + c = 0$ dans $\\mathbb{C}$',
    markdown: String.raw`Avec $a, b, c$ réels et $a \neq 0$ :

1. Calculer le discriminant $\Delta = b^2 - 4ac$.
2. Si $\Delta > 0$ : deux solutions réelles $z = \dfrac{-b \pm \sqrt{\Delta}}{2a}$.
3. Si $\Delta = 0$ : une solution double $z = \dfrac{-b}{2a}$.
4. **Si $\Delta < 0$** : deux solutions complexes conjuguées

$$z_1 = \frac{-b + i\sqrt{-\Delta}}{2a}
\qquad
z_2 = \frac{-b - i\sqrt{-\Delta}}{2a} = \bar{z_1}$$

Note bien le $-\Delta$ sous la racine : comme $\Delta < 0$, $-\Delta$ est
positif, donc $\sqrt{-\Delta}$ existe bien dans $\mathbb{R}$.`,
  },
  {
    kind: 'example',
    title_fr: 'Exemple traité',
    markdown: String.raw`**Résoudre $z^2 - 4z + 13 = 0$.**

$\Delta = (-4)^2 - 4 \times 1 \times 13 = 16 - 52 = -36 < 0$

Donc $\sqrt{-\Delta} = \sqrt{36} = 6$, et :

$$z_1 = \frac{4 + 6i}{2} = 2 + 3i
\qquad
z_2 = \frac{4 - 6i}{2} = 2 - 3i$$

**Vérification du module :** $|z_1| = \sqrt{2^2 + 3^2} = \sqrt{13}$.

Cohérent : le produit des racines vaut $\dfrac{c}{a} = 13$, et
$z_1 z_2 = z_1\bar{z_1} = |z_1|^2 = 13$. ✓`,
  },
  {
    kind: 'pitfall',
    title_fr: null,
    markdown: String.raw`**1. Écrire $\sqrt{-9} = 3i$.**
La notation $\sqrt{\ }$ n'est pas définie pour les négatifs. Écris
$\sqrt{-\Delta}$ avec $-\Delta > 0$, jamais la racine d'un nombre négatif.

**2. Confondre partie imaginaire et $ib$.**
Pour $z = 5 - 2i$, $\operatorname{Im}(z) = -2$, pas $-2i$ ni $2$.

**3. Oublier $i^2 = -1$ en développant.**
$(a + ib)^2 = a^2 + 2iab + i^2b^2 = a^2 - b^2 + 2iab$.
Le carré de la partie imaginaire **change de signe**.

**4. Croire que $|z_1 + z_2| = |z_1| + |z_2|$.**
Faux en général. Avec $z_1 = 1$ et $z_2 = -1$ : $|z_1 + z_2| = 0$ mais
$|z_1| + |z_2| = 2$.

**5. Dire qu'un module peut être négatif.**
$|z| \geqslant 0$ toujours. Un module négatif dans une copie signale une erreur
de calcul en amont.`,
  },
  {
    kind: 'exam_tip',
    title_fr: null,
    markdown: String.raw`L'exercice sur les complexes est **quasi systématique** à l'Examen National de
la filière PC, et il est l'un des plus rentables : le barème est mécanique et
les questions s'enchaînent toujours dans le même ordre.

Le schéma classique :

1. Résoudre une équation du second degré à $\Delta < 0$.
2. Calculer un module et un argument.
3. Passer en forme trigonométrique ou exponentielle.
4. Interpréter géométriquement (nature d'un triangle, alignement, rotation).

**Conseil de copie :** commence toujours par écrire $\Delta$ explicitement, même
si le calcul est évident. C'est souvent un point de barème à lui seul.`,
  },
  {
    kind: 'cheatsheet',
    title_fr: 'Fiche mémo',
    markdown: String.raw`| Notion | Formule |
|---|---|
| Unité imaginaire | $i^2 = -1$ |
| Forme algébrique | $z = a + ib$ |
| Conjugué | $\bar{z} = a - ib$ |
| Module | $\lvert z \rvert = \sqrt{a^2+b^2}$ |
| Lien clé | $z\bar{z} = \lvert z \rvert^2$ |
| Produit | $\lvert z_1z_2 \rvert = \lvert z_1 \rvert \lvert z_2 \rvert$ |
| Quotient | $\left\lvert \frac{z_1}{z_2} \right\rvert = \frac{\lvert z_1 \rvert}{\lvert z_2 \rvert}$ |
| $\Delta < 0$ | $z = \frac{-b \pm i\sqrt{-\Delta}}{2a}$ |

**Puissances de $i$** — cycle de période 4 :

$$i^0 = 1 \quad i^1 = i \quad i^2 = -1 \quad i^3 = -i \quad i^4 = 1$$

Pour $i^n$, prends le reste de $n$ dans la division par $4$.`,
  },
]

const MINDMAP = {
  root: {
    label: 'Nombres complexes',
    children: [
      {
        label: 'Forme algébrique',
        children: [
          { label: 'z = a + ib, avec i² = −1' },
          { label: 'Re(z) = a, Im(z) = b (un réel)' },
          { label: 'Égalité ⟺ mêmes parties réelle et imaginaire' },
        ],
      },
      {
        label: 'Conjugué',
        children: [
          { label: 'z̄ = a − ib' },
          { label: 'z·z̄ = a² + b² = |z|²' },
          { label: 'Sert à rendre un dénominateur réel' },
        ],
      },
      {
        label: 'Module',
        children: [
          { label: '|z| = √(a² + b²), toujours ⩾ 0' },
          { label: 'Multiplicatif : |z₁z₂| = |z₁||z₂|' },
          { label: 'Somme : seulement |z₁+z₂| ⩽ |z₁|+|z₂|' },
        ],
      },
      {
        label: 'Équation du 2nd degré',
        children: [
          { label: 'Δ = b² − 4ac' },
          { label: 'Δ < 0 → z = (−b ± i√(−Δ)) / 2a' },
          { label: 'Les deux racines sont conjuguées' },
        ],
      },
      {
        label: 'Puissances de i',
        children: [{ label: 'Cycle de période 4 : 1, i, −1, −i' }],
      },
    ],
  },
}

const QUESTIONS = [
  {
    stem: String.raw`Quelle est la partie imaginaire de $z = 7 - 3i$ ?`,
    choices: [
      ['a', '$-3$', true],
      ['b', '$-3i$', false],
      ['c', '$3$', false],
      ['d', '$7$', false],
    ],
    explanation: String.raw`La partie imaginaire est le **coefficient réel** de $i$, ici $-3$.
C'est un réel, pas un imaginaire : $\operatorname{Im}(z) = -3$ et non $-3i$.
Le signe compte aussi — l'écriture $7 - 3i$ signifie $7 + (-3)i$.`,
    difficulty: 1,
  },
  {
    stem: String.raw`Que vaut $i^{23}$ ?`,
    choices: [
      ['a', '$-i$', true],
      ['b', '$i$', false],
      ['c', '$-1$', false],
      ['d', '$1$', false],
    ],
    explanation: String.raw`Les puissances de $i$ ont une période de $4$. On divise l'exposant par $4$ :
$23 = 4 \times 5 + 3$, donc $i^{23} = i^3 = -i$.
Méthode générale : ne garder que le **reste** de la division de $n$ par $4$.`,
    difficulty: 2,
  },
  {
    stem: String.raw`Quel est le module de $z = -3 + 4i$ ?`,
    choices: [
      ['a', '$5$', true],
      ['b', '$1$', false],
      ['c', '$\\sqrt{7}$', false],
      ['d', '$-5$', false],
    ],
    explanation: String.raw`$|z| = \sqrt{(-3)^2 + 4^2} = \sqrt{9 + 16} = \sqrt{25} = 5$.

Les deux erreurs classiques : additionner $a + b = -3 + 4 = 1$, et répondre
un module négatif. **Un module est toujours positif ou nul.**`,
    difficulty: 1,
  },
  {
    stem: String.raw`Quelles sont les solutions de $z^2 - 2z + 5 = 0$ dans $\mathbb{C}$ ?`,
    choices: [
      ['a', '$1 + 2i$ et $1 - 2i$', true],
      ['b', '$2 + i$ et $2 - i$', false],
      ['c', '$-1 + 2i$ et $-1 - 2i$', false],
      ['d', "Pas de solution", false],
    ],
    explanation: String.raw`$\Delta = (-2)^2 - 4(1)(5) = 4 - 20 = -16 < 0$, donc $\sqrt{-\Delta} = 4$.

$$z = \frac{2 \pm 4i}{2} = 1 \pm 2i$$

Vérification rapide : le produit des racines doit valoir $\frac{c}{a} = 5$, et
$(1+2i)(1-2i) = 1 + 4 = 5$. ✓

Dans $\mathbb{C}$, une équation du second degré a **toujours** des solutions.`,
    difficulty: 2,
  },
  {
    stem: String.raw`Que vaut $(2 + 3i)^2$ ?`,
    choices: [
      ['a', '$-5 + 12i$', true],
      ['b', '$13 + 12i$', false],
      ['c', '$4 + 9i$', false],
      ['d', '$-5 + 6i$', false],
    ],
    explanation: String.raw`$$(2+3i)^2 = 4 + 12i + 9i^2 = 4 + 12i - 9 = -5 + 12i$$

L'erreur la plus fréquente est d'écrire $9i^2 = +9$ en oubliant que
$i^2 = -1$. La partie réelle **diminue** de $9$, elle n'augmente pas.`,
    difficulty: 2,
  },
  {
    stem: String.raw`Si $|z_1| = 3$ et $|z_2| = 4$, que vaut $|z_1 z_2|$ ?`,
    choices: [
      ['a', '$12$', true],
      ['b', '$7$', false],
      ['c', '$5$', false],
      ['d', 'On ne peut pas savoir', false],
    ],
    explanation: String.raw`Le module est **multiplicatif** : $|z_1 z_2| = |z_1| \cdot |z_2| = 3 \times 4 = 12$.

Cette propriété ne dépend pas des arguments, donc l'information est suffisante.
Attention : pour une **somme**, on ne pourrait rien conclure —
$|z_1 + z_2|$ peut valoir n'importe quoi entre $1$ et $7$.`,
    difficulty: 2,
  },
  {
    stem: String.raw`Sous forme algébrique, que vaut $\dfrac{1}{2 - i}$ ?`,
    choices: [
      ['a', '$\\dfrac{2}{5} + \\dfrac{1}{5}i$', true],
      ['b', '$\\dfrac{2}{3} + \\dfrac{1}{3}i$', false],
      ['c', '$2 + i$', false],
      ['d', '$\\dfrac{1}{2} - i$', false],
    ],
    explanation: String.raw`On multiplie par le conjugué du dénominateur :

$$\frac{1}{2-i} = \frac{1}{2-i} \times \frac{2+i}{2+i} = \frac{2+i}{(2)^2 + (-1)^2} = \frac{2+i}{5}$$

Soit $\frac{2}{5} + \frac{1}{5}i$.

Le dénominateur devient $z\bar{z} = a^2 + b^2 = 4 + 1 = 5$ — un **réel**.
C'est tout l'intérêt du conjugué.`,
    difficulty: 3,
  },
  {
    stem: String.raw`Si $z$ est solution de $az^2+bz+c=0$ avec $a,b,c$ réels et $\Delta<0$, que peut-on dire de $\bar{z}$ ?`,
    choices: [
      ['a', "C'est l'autre solution de l'équation", true],
      ['b', "Ce n'est pas une solution", false],
      ['c', "C'est la même solution que $z$", false],
      ['d', 'Cela dépend du signe de $b$', false],
    ],
    explanation: String.raw`Quand les coefficients sont **réels** et $\Delta < 0$, les deux racines sont
conjuguées l'une de l'autre :

$$z_1 = \frac{-b + i\sqrt{-\Delta}}{2a}, \qquad z_2 = \frac{-b - i\sqrt{-\Delta}}{2a} = \bar{z_1}$$

Conséquence pratique très utile à l'examen : **une racine trouvée en donne
deux.** Attention, cela suppose $a$, $b$, $c$ réels — c'est faux si un
coefficient est lui-même complexe.`,
    difficulty: 3,
  },
]

// ------------------------------------------------------------------ seed ---
async function main() {
  // A reviewer is required to publish. Use any existing account as a
  // placeholder — a real teacher must re-review before launch.
  const { data: users } = await db.auth.admin.listUsers({ perPage: 1 })
  const reviewer = users?.users[0]
  if (!reviewer) {
    console.error('No user exists yet. Create an account first.')
    process.exit(1)
  }

  const { data: subject } = await db
    .from('subjects')
    .select('id')
    .eq('slug', 'mathematiques')
    .single()

  const { data: filiere } = await db
    .from('filieres')
    .select('id')
    .eq('code', 'PC')
    .single()

  const { data: filiereSubject } = await db
    .from('filiere_subjects')
    .select('id')
    .eq('filiere_id', filiere.id)
    .eq('subject_id', subject.id)
    .single()

  // Idempotent: drop the previous sample. Cascades clear blocks and mindmaps.
  await db.from('lessons').delete().eq('slug', LESSON_SLUG).eq('subject_id', subject.id)
  await db.from('units').delete().eq('slug', UNIT_SLUG).eq('filiere_subject_id', filiereSubject.id)

  const { data: unit, error: unitError } = await db
    .from('units')
    .insert({
      filiere_subject_id: filiereSubject.id,
      slug: UNIT_SLUG,
      title_fr: 'Nombres complexes',
      description_fr: "Un exercice quasi systématique à l'Examen National.",
      sort_order: 1,
    })
    .select('id')
    .single()

  if (unitError) throw unitError

  const { data: lesson, error: lessonError } = await db
    .from('lessons')
    .insert({
      subject_id: subject.id,
      slug: LESSON_SLUG,
      title_fr: 'Forme algébrique et module',
      subtitle_fr: 'Le socle de tout le chapitre : savoir écrire, conjuguer et mesurer un complexe.',
      difficulty: 2,
      est_minutes: 18,
      exam_frequency: 5,
      access_tier: 'free',
      objectives: [
        "Écrire un nombre complexe sous forme algébrique et identifier ses parties réelle et imaginaire",
        'Calculer un conjugué et un module, et connaître leurs propriétés',
        'Résoudre une équation du second degré à discriminant négatif',
        'Mettre un quotient sous forme algébrique en utilisant le conjugué',
      ],
      key_terms: ['forme algébrique', 'conjugué', 'module', 'discriminant', 'unité imaginaire'],
      status: 'published',
      ai_generated: true,
      reviewed_by: reviewer.id,
      reviewed_at: new Date().toISOString(),
      published_at: new Date().toISOString(),
      review_notes:
        'BROUILLON GÉNÉRÉ — relecture par un enseignant de mathématiques requise avant ouverture aux élèves.',
    })
    .select('id')
    .single()

  if (lessonError) throw lessonError

  await db.from('lesson_placements').insert({
    lesson_id: lesson.id,
    unit_id: unit.id,
    sort_order: 1,
  })

  const { error: blocksError } = await db.from('lesson_blocks').insert(
    BLOCKS.map((block, index) => ({
      lesson_id: lesson.id,
      kind: block.kind,
      title_fr: block.title_fr,
      content: { markdown: block.markdown },
      position: index,
    })),
  )
  if (blocksError) throw blocksError

  await db.from('mindmaps').insert({
    lesson_id: lesson.id,
    title_fr: 'Carte mentale — Nombres complexes',
    data: MINDMAP,
    status: 'published',
  })

  const { data: inserted, error: questionsError } = await db
    .from('questions')
    .insert(
      QUESTIONS.map((q) => ({
        subject_id: subject.id,
        lesson_id: lesson.id,
        type: 'mcq_single',
        stem: { markdown: q.stem },
        choices: q.choices.map(([id, label, is_correct]) => ({ id, label, is_correct })),
        answer: { choice: q.choices.find(([, , correct]) => correct)[0] },
        explanation: { markdown: q.explanation },
        difficulty: q.difficulty,
        points: 1,
        tags: ['nombres-complexes'],
        status: 'published',
        ai_generated: true,
        reviewed_by: reviewer.id,
        reviewed_at: new Date().toISOString(),
      })),
    )
    .select('id')

  if (questionsError) throw questionsError

  const { data: assessment, error: assessmentError } = await db
    .from('assessments')
    .insert({
      kind: 'lesson_quiz',
      lesson_id: lesson.id,
      title_fr: 'Quiz — Forme algébrique et module',
      instructions_fr: 'Cinq questions tirées au hasard. Tu peux recommencer autant de fois que tu veux.',
      question_count: 5,
      pass_threshold: 60,
      shuffle_questions: true,
      shuffle_choices: true,
      access_tier: 'free',
      status: 'published',
    })
    .select('id')
    .single()

  if (assessmentError) throw assessmentError

  await db.from('assessment_pools').insert({
    assessment_id: assessment.id,
    filter: { lesson_ids: [lesson.id], status: 'published' },
    draw_count: 5,
    position: 0,
  })

  console.log('✓ sample lesson seeded')
  console.log(`  unit:      Nombres complexes`)
  console.log(`  lesson:    Forme algébrique et module (${BLOCKS.length} blocs, 1 carte mentale)`)
  console.log(`  questions: ${inserted.length}`)
  console.log(`  quiz:      5 questions tirées au hasard`)
  console.log('\n  /matieres/mathematiques/' + LESSON_SLUG)
  console.log('\n⚠ Contenu non relu par un enseignant. reviewed_by est un placeholder.')
}

main().catch((error) => {
  console.error('✗', error.message ?? error)
  process.exit(1)
})
