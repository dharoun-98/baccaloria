/**
 * Exercise breakdown and corrigés for the 2024 Maths PC paper (session normale).
 *
 *     node --env-file=.env.local scripts/seed-corrige-2024.mjs
 *
 * Written from the actual subject, extracted with scripts/read-exam-pdf.mjs and
 * solved question by question.
 *
 * ⚠️ THREE of the five exercises carry a corrigé. Exercice 3 (complexes) and the
 * Problème are left EMPTY on purpose.
 *
 * The PDF text layer mangles mathematical notation — radicals and fractions lose
 * their structure. For exercises 1, 2 and 4 the statement survived intact and
 * every result was verified against the values the subject itself announces
 * ("Montrer que p(A) = 1/3", "Vérifier que d(Ω,P) = 3", …), which is a strong
 * check: an incorrect solution would not land on the printed answer.
 *
 * For exercise 3 the affixes did not reconcile — the checks the subject states
 * came out inconsistent, meaning the statement was misread. Writing a corrigé on
 * a misread statement is the single worst thing this product can ship, so it is
 * left for a human who can see the page.
 *
 * The Problème is legible but is a full 8-point function study; it deserves
 * writing with the page in view rather than from a mangled text layer.
 *
 * The exam therefore stays UNPUBLISHABLE until those two are filled in, which is
 * exactly what publishExam() enforces.
 */
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key || key === 'PASTE_ME') {
  console.error('Run with: node --env-file=.env.local scripts/seed-corrige-2024.mjs')
  process.exit(1)
}

const db = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const EXERCISES = [
  {
    position: 1,
    label: 'Exercice 1 — Suites numériques',
    points: 3,
    corrige: String.raw`On considère $u_0 = 4$ et $u_{n+1} = \dfrac{4u_n - 2}{1 + u_n}$.

### 1) a) Vérifier que $u_{n+1} = 4 - \dfrac{6}{1+u_n}$

On met au même dénominateur :

$$4 - \frac{6}{1+u_n} = \frac{4(1+u_n) - 6}{1+u_n} = \frac{4 + 4u_n - 6}{1+u_n} = \frac{4u_n - 2}{1+u_n} = u_{n+1}$$

### 1) b) Montrer par récurrence que $2 \leqslant u_n \leqslant 4$

**Initialisation.** $u_0 = 4$, donc $2 \leqslant u_0 \leqslant 4$. ✓

**Hérédité.** Supposons $2 \leqslant u_n \leqslant 4$ pour un entier $n$ fixé. Alors

$$3 \leqslant 1+u_n \leqslant 5
\quad\Longrightarrow\quad
\frac{6}{5} \leqslant \frac{6}{1+u_n} \leqslant 2$$

(la fonction $x \mapsto \frac{6}{x}$ est décroissante sur $]0;+\infty[$, d'où
l'inversion des inégalités). En reportant :

$$4 - 2 \leqslant u_{n+1} \leqslant 4 - \frac{6}{5}
\quad\text{soit}\quad
2 \leqslant u_{n+1} \leqslant \frac{14}{5} \leqslant 4$$

**Conclusion.** Pour tout $n \in \mathbb{N}$, $2 \leqslant u_n \leqslant 4$.

### 2) a) Montrer que $u_{n+1} - u_n = \dfrac{(u_n-1)(2-u_n)}{1+u_n}$

$$u_{n+1} - u_n = \frac{4u_n-2}{1+u_n} - u_n = \frac{4u_n - 2 - u_n(1+u_n)}{1+u_n}
= \frac{-u_n^2 + 3u_n - 2}{1+u_n}$$

Le trinôme $u_n^2 - 3u_n + 2$ a pour racines $1$ et $2$, donc
$-u_n^2+3u_n-2 = -(u_n-1)(u_n-2) = (u_n-1)(2-u_n)$, d'où le résultat.

### 2) b) Sens de variation et convergence

D'après 1)b), $2 \leqslant u_n \leqslant 4$. Signe de chaque facteur :

- $u_n - 1 \geqslant 1 > 0$
- $2 - u_n \leqslant 0$
- $1 + u_n \geqslant 3 > 0$

Donc $u_{n+1} - u_n \leqslant 0$ : la suite $(u_n)$ est **décroissante**.

Décroissante et **minorée par 2**, elle **converge**.

> Le théorème donne l'existence de la limite, pas sa valeur. On l'obtient à la
> question 3)c).

### 3) a) $(v_n)$ est géométrique de raison $\dfrac{2}{3}$

Avec $v_n = \dfrac{2-u_n}{1-u_n}$ :

$$2 - u_{n+1} = \frac{2(1+u_n) - (4u_n-2)}{1+u_n} = \frac{4-2u_n}{1+u_n} = \frac{2(2-u_n)}{1+u_n}$$

$$1 - u_{n+1} = \frac{(1+u_n) - (4u_n-2)}{1+u_n} = \frac{3-3u_n}{1+u_n} = \frac{3(1-u_n)}{1+u_n}$$

En divisant, les dénominateurs $1+u_n$ se simplifient :

$$v_{n+1} = \frac{2(2-u_n)}{3(1-u_n)} = \frac{2}{3}\,v_n$$

$(v_n)$ est donc géométrique de raison $\frac{2}{3}$, de premier terme
$v_0 = \frac{2-4}{1-4} = \frac{-2}{-3} = \frac{2}{3}$.

D'où $v_n = \frac{2}{3}\times\left(\frac{2}{3}\right)^n = \left(\frac{2}{3}\right)^{n+1}$.

### 3) b) Expression de $u_n$

On résout $v_n = \dfrac{2-u_n}{1-u_n}$ en $u_n$ :

$$v_n(1-u_n) = 2-u_n \;\Longrightarrow\; v_n - v_nu_n = 2 - u_n
\;\Longrightarrow\; u_n(1 - v_n) = 2 - v_n$$

$$u_n = \frac{2-v_n}{1-v_n} = \frac{(1-v_n)+1}{1-v_n} = 1 + \frac{1}{1-v_n}$$

$$\boxed{\,u_n = 1 + \dfrac{1}{1 - \left(\frac{2}{3}\right)^{n+1}}\,}$$

### 3) c) Limite

Comme $\left|\frac{2}{3}\right| < 1$, on a $\left(\frac{2}{3}\right)^{n+1} \to 0$, donc

$$\lim_{n\to+\infty} u_n = 1 + \frac{1}{1-0} = 2$$

**Cohérence.** La suite est décroissante et minorée par $2$ : une limite de $2$
était le seul candidat possible. ✓`,
  },

  {
    position: 2,
    label: 'Exercice 2 — Géométrie dans l’espace',
    points: 3,
    corrige: String.raw`$A(-1,0,-1)$, $B(1,2,-1)$, plan $(P)$ passant par $A$ de vecteur normal
$\vec n(2,-2,1)$, sphère $(S)$ de centre $\Omega(2,-1,0)$ et de rayon $5$.

### 1) Équation cartésienne de $(P)$

Le vecteur normal donne les coefficients : $(P) : 2x - 2y + z + d = 0$.

Le plan passe par $A(-1,0,-1)$ :

$$2(-1) - 2(0) + (-1) + d = 0 \;\Longrightarrow\; -3 + d = 0 \;\Longrightarrow\; d = 3$$

$$(P) : 2x - 2y + z + 3 = 0$$

### 2) Équation de la sphère $(S)$

$$(S) : (x-2)^2 + (y+1)^2 + z^2 = 25$$

> Le membre de droite est $R^2$, pas $R$.

### 3) a) Distance de $\Omega$ au plan

$$d(\Omega,(P)) = \frac{|2(2) - 2(-1) + 0 + 3|}{\sqrt{2^2+(-2)^2+1^2}}
= \frac{|4+2+3|}{\sqrt{9}} = \frac{9}{3} = 3$$

### 3) b) Intersection plan / sphère

$$d(\Omega,(P)) = 3 < 5 = R$$

Le plan **coupe** la sphère suivant un cercle $(\Gamma)$. Son rayon se lit sur
le théorème de Pythagore dans le triangle rectangle formé par $\Omega$, le
centre du cercle et un point du cercle :

$$r = \sqrt{R^2 - d^2} = \sqrt{25-9} = \sqrt{16} = 4$$

### 4) a) Représentation paramétrique de $(\Delta)$

$(\Delta)$ passe par $\Omega(2,-1,0)$ et est perpendiculaire à $(P)$ : elle a
donc $\vec n(2,-2,1)$ pour vecteur directeur.

$$(\Delta) : \begin{cases} x = 2 + 2t \\ y = -1 - 2t \\ z = t \end{cases} \qquad t \in \mathbb{R}$$

### 4) b) $H(0,1,-1)$ est le centre de $(\Gamma)$

Le centre du cercle est le **projeté orthogonal** de $\Omega$ sur $(P)$,
c'est-à-dire le point d'intersection de $(\Delta)$ et de $(P)$.

*$H$ appartient à $(\Delta)$ :* la première équation donne $2+2t = 0$, soit
$t = -1$. On vérifie alors $y = -1-2(-1) = 1$ ✓ et $z = -1$ ✓.

*$H$ appartient à $(P)$ :*

$$2(0) - 2(1) + (-1) + 3 = -2 - 1 + 3 = 0 \ \checkmark$$

$H$ est donc bien le projeté orthogonal de $\Omega$ sur $(P)$, donc le centre
de $(\Gamma)$.

### 4) c) $(\Delta)$ est la médiatrice de $[AB]$

Deux choses à établir : $(\Delta)$ est orthogonale à $(AB)$, et elle passe par
son milieu.

*Orthogonalité.* $\overrightarrow{AB}(2,2,0)$ et $\vec n(2,-2,1)$ :

$$\overrightarrow{AB}\cdot\vec n = 2\times2 + 2\times(-2) + 0\times1 = 4 - 4 = 0$$

*Milieu.* Le milieu $I$ de $[AB]$ a pour coordonnées

$$I\left(\frac{-1+1}{2},\ \frac{0+2}{2},\ \frac{-1-1}{2}\right) = (0,1,-1) = H$$

$H$ appartient à $(\Delta)$ d'après 4)b). Donc $(\Delta)$ passe par le milieu de
$[AB]$ et lui est orthogonale : c'est la **médiatrice** de $[AB]$.

> Joli résultat : le centre du cercle d'intersection est exactement le milieu de
> $[AB]$. Ce n'est pas un hasard — $A$ et $B$ appartiennent tous deux au cercle.`,
  },

  {
    position: 3,
    label: 'Exercice 3 — Nombres complexes',
    points: 4,
    corrige: null,
  },

  {
    position: 4,
    label: 'Exercice 4 — Calcul des probabilités',
    points: 2,
    corrige: String.raw`Une urne contient sept boules : **quatre** portant le numéro $1$, **deux** le
numéro $2$, **une** le numéro $3$. On tire **simultanément** deux boules.

Tirage simultané : l'ordre ne compte pas, on dénombre avec des **combinaisons**.

$$\text{card}(\Omega) = \binom{7}{2} = \frac{7\times6}{2} = 21$$

### 1) $p(A) = \dfrac{1}{3}$, où $A$ : « les deux boules portent le même numéro »

On répartit selon le numéro commun :

- deux boules « $1$ » parmi $4$ : $\dbinom{4}{2} = 6$
- deux boules « $2$ » parmi $2$ : $\dbinom{2}{2} = 1$
- deux boules « $3$ » parmi $1$ : impossible, $\dbinom{1}{2} = 0$

$$\text{card}(A) = 6+1+0 = 7
\qquad
p(A) = \frac{7}{21} = \frac{1}{3}$$

### 2) $p(B) = \dfrac{5}{21}$, où $B$ : « la somme des numéros vaut $4$ »

Les couples de numéros dont la somme fait $4$ sont $\{1;3\}$ et $\{2;2\}$.

- une boule « $1$ » et une boule « $3$ » : $4 \times 1 = 4$ tirages
- deux boules « $2$ » : $\dbinom{2}{2} = 1$ tirage

$$\text{card}(B) = 4+1 = 5
\qquad
p(B) = \frac{5}{21}$$

### 3) Calcul de $p(A \cap B)$

$A \cap B$ : les deux boules portent le même numéro **et** leur somme vaut $4$.
Le seul cas possible est deux boules « $2$ » — les deux « $1$ » donnent $2$, et
deux « $3$ » n'existent pas.

$$\text{card}(A\cap B) = \binom{2}{2} = 1
\qquad
p(A\cap B) = \frac{1}{21}$$

### 4) $A$ et $B$ sont-ils indépendants ?

On compare $p(A\cap B)$ et $p(A)\times p(B)$ :

$$p(A)\times p(B) = \frac{1}{3}\times\frac{5}{21} = \frac{5}{63}
\qquad
p(A\cap B) = \frac{1}{21} = \frac{3}{63}$$

$$\frac{5}{63} \neq \frac{3}{63}$$

Les événements $A$ et $B$ ne sont **pas indépendants**.

> Rédige la comparaison explicitement, avec le même dénominateur. Répondre
> « non » sans le calcul ne vaut pas le point.`,
  },

  {
    position: 5,
    label: 'Problème — Étude de fonctions et calcul intégral',
    points: 8,
    corrige: null,
  },
]

async function main() {
  const { data: exam } = await db
    .from('exams')
    .select('id, year, session, total_points, filiere_subjects!inner ( subject_id )')
    .eq('year', 2024)
    .eq('session', 'normale')
    .maybeSingle()

  if (!exam) {
    console.error('Examen 2024 session normale introuvable. Lance d’abord import-exams.mjs.')
    process.exit(1)
  }

  await db.from('exam_exercises').delete().eq('exam_id', exam.id)

  const { error } = await db.from('exam_exercises').insert(
    EXERCISES.map((e) => ({
      exam_id: exam.id,
      position: e.position,
      label_fr: e.label,
      points: e.points,
      corrige: e.corrige ? { markdown: e.corrige } : null,
    })),
  )

  if (error) {
    console.error('✗', error.message)
    process.exit(1)
  }

  const total = EXERCISES.reduce((s, e) => s + e.points, 0)
  const written = EXERCISES.filter((e) => e.corrige).length

  console.log(`✓ Examen 2024 — session normale`)
  for (const e of EXERCISES) {
    console.log(
      `  ${e.corrige ? '✓' : '·'} ${e.label.padEnd(46)} ${e.points} pts${e.corrige ? '' : '  (corrigé à rédiger)'}`,
    )
  }
  console.log(`\n  barème total : ${total}/${Number(exam.total_points)}`)
  console.log(`  corrigés rédigés : ${written}/${EXERCISES.length}`)
  console.log(
    `\n  L'examen reste en brouillon : la publication exige un corrigé pour chaque exercice.`,
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
