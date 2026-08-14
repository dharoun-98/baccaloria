export default {
  slug: 'suites-numeriques',
  unit: { slug: 'analyse', title: 'Analyse', order: 1, lessonOrder: 2 },
  title: 'Suites numériques',
  subtitle:
    'Reconnaître une suite, prouver une propriété par récurrence, et déterminer sa limite.',
  difficulty: 2,
  estMinutes: 24,
  examFrequency: 5,
  accessTier: 'premium',
  objectives: [
    'Reconnaître une suite arithmétique ou géométrique et écrire son terme général',
    'Rédiger une démonstration par récurrence complète',
    'Étudier la monotonie et la convergence d’une suite',
    'Traiter une suite récurrente $u_{n+1}=f(u_n)$',
  ],
  keyTerms: ['récurrence', 'arithmétique', 'géométrique', 'convergence', 'monotonie'],

  blocks: [
    {
      kind: 'resume',
      title: "L'essentiel",
      markdown: String.raw`Une **suite** $(u_n)$ associe un nombre réel à chaque entier $n$. Deux familles
reviennent en permanence.

**Suite arithmétique** — on ajoute toujours la même **raison** $r$ :

$$u_{n+1} = u_n + r \qquad\Longrightarrow\qquad u_n = u_0 + nr$$

**Suite géométrique** — on multiplie toujours par la même **raison** $q$ :

$$u_{n+1} = q\,u_n \qquad\Longrightarrow\qquad u_n = u_0 \times q^{\,n}$$

Le réflexe de reconnaissance : calcule $u_{n+1}-u_n$. Si c'est une constante, la
suite est arithmétique. Sinon calcule $\dfrac{u_{n+1}}{u_n}$ : si c'est une
constante, elle est géométrique.

**Monotonie.** Étudie le signe de $u_{n+1}-u_n$ : positif pour tout $n$ signifie
croissante, négatif signifie décroissante.

**Convergence.** Une suite converge si elle admet une limite finie. Le résultat le
plus utile de tout le chapitre :

> Toute suite **croissante et majorée** converge.
> Toute suite **décroissante et minorée** converge.

Ce théorème donne l'existence de la limite sans la calculer — c'est très souvent
tout ce que l'énoncé demande à cette étape.`,
    },
    {
      kind: 'method',
      title: 'Démonstration par récurrence',
      markdown: String.raw`Pour prouver qu'une propriété $P(n)$ est vraie pour tout $n \geqslant n_0$ :

1. **Initialisation.** Vérifie $P(n_0)$. Une ligne suffit, mais elle est obligatoire.
2. **Hérédité.** Suppose $P(n)$ vraie pour un $n \geqslant n_0$ **fixé**, et démontre
   $P(n+1)$.
3. **Conclusion.** « $P(n_0)$ est vraie et $P$ est héréditaire, donc par récurrence
   $P(n)$ est vraie pour tout $n \geqslant n_0$. »

La phrase de l'hérédité doit être exacte : *« supposons que $P(n)$ soit vraie pour
un certain entier $n$ »*. Écrire « supposons $P(n)$ vraie pour tout $n$ » revient
à supposer ce qu'on cherche à démontrer, et annule la démonstration.`,
    },
    {
      kind: 'example',
      title: 'Récurrence traitée',
      markdown: String.raw`**Soit $u_0 = 1$ et $u_{n+1} = \frac{1}{2}u_n + 3$. Montrer que $u_n \leqslant 6$ pour tout $n$.**

*Initialisation.* $u_0 = 1 \leqslant 6$ ✓

*Hérédité.* Supposons $u_n \leqslant 6$ pour un entier $n$ fixé. Alors

$$u_{n+1} = \tfrac{1}{2}u_n + 3 \leqslant \tfrac{1}{2}\times 6 + 3 = 6$$

donc $u_{n+1} \leqslant 6$.

*Conclusion.* Par récurrence, $u_n \leqslant 6$ pour tout $n \in \mathbb{N}$.

**Suite de l'exercice.** On montre de même que $(u_n)$ est croissante. Croissante
et majorée par $6$, elle **converge**. Sa limite $\ell$ vérifie
$\ell = \frac{1}{2}\ell + 3$, d'où $\ell = 6$.`,
    },
    {
      kind: 'formula',
      title: 'Limite de $q^n$',
      markdown: String.raw`Le comportement d'une suite géométrique dépend entièrement de sa raison :

$$\lim_{n \to +\infty} q^{\,n} =
\begin{cases}
0 & \text{si } -1 < q < 1 \\
1 & \text{si } q = 1 \\
+\infty & \text{si } q > 1 \\
\text{pas de limite} & \text{si } q \leqslant -1
\end{cases}$$

**Somme des termes d'une suite géométrique** ($q \neq 1$) :

$$u_0 + u_1 + \dots + u_n = u_0 \times \frac{1 - q^{\,n+1}}{1-q}$$

**Somme des termes d'une suite arithmétique** :

$$u_0 + u_1 + \dots + u_n = (n+1) \times \frac{u_0 + u_n}{2}$$`,
    },
    {
      kind: 'method',
      title: 'Suite récurrente $u_{n+1} = f(u_n)$',
      markdown: String.raw`C'est le schéma d'exercice le plus fréquent. Il se déroule presque toujours ainsi :

1. **Montrer que la suite est bornée**, par récurrence.
2. **Étudier la monotonie**, en signant $u_{n+1}-u_n$.
3. **Conclure à la convergence** par le théorème de la suite monotone bornée.
4. **Calculer la limite** en résolvant $\ell = f(\ell)$.

L'étape 4 n'est valide **qu'après** avoir prouvé la convergence à l'étape 3.
Résoudre $\ell = f(\ell)$ sur une suite divergente donne un nombre qui ne veut
rien dire.

Astuce fréquente : si l'énoncé introduit $v_n = u_n - \ell$ où $\ell$ est la
solution de $\ell = f(\ell)$, c'est presque toujours que $(v_n)$ est **géométrique**.`,
    },
    {
      kind: 'pitfall',
      markdown: String.raw`**1. Oublier l'initialisation.**
Une récurrence sans initialisation ne démontre rien. C'est le point de barème le
plus facile à perdre.

**2. Mal formuler l'hypothèse de récurrence.**
« Supposons $P(n)$ vraie **pour tout** $n$ » suppose le résultat. Il faut « pour
un certain entier $n$ fixé ».

**3. Confondre croissante et convergente.**
Une suite croissante peut très bien tendre vers $+\infty$. C'est le fait
d'être **majorée** qui force la convergence.

**4. Résoudre $\ell = f(\ell)$ sans avoir prouvé la convergence.**
L'équation admet une solution même quand la suite diverge. L'ordre des étapes
est imposé.

**5. Croire que $u_{n+1} > u_n$ pour quelques valeurs suffit.**
Tester $n=0,1,2$ n'est pas une démonstration. Il faut signer $u_{n+1}-u_n$ pour
un $n$ quelconque, ou faire une récurrence.`,
    },
    {
      kind: 'exam_tip',
      markdown: String.raw`Les suites tombent presque tous les ans, souvent en exercice indépendant de 4 à
5 points — donc rentable et isolé du reste du sujet.

Le scénario type :

1. Calculer $u_1$, $u_2$ (question de mise en route, à ne jamais négliger).
2. Montrer par récurrence un encadrement.
3. Étudier la monotonie.
4. En déduire la convergence.
5. Introduire une suite auxiliaire $v_n$, montrer qu'elle est géométrique.
6. Exprimer $u_n$ en fonction de $n$, puis conclure sur la limite.

**Conseil de copie :** rédige la récurrence avec les trois titres apparents —
*Initialisation*, *Hérédité*, *Conclusion*. Le correcteur cherche ces trois blocs,
et une rédaction claire sécurise les points même si un calcul intermédiaire est
faux.`,
    },
    {
      kind: 'cheatsheet',
      title: 'Fiche mémo',
      markdown: String.raw`| | Arithmétique | Géométrique |
|---|---|---|
| Relation | $u_{n+1}=u_n+r$ | $u_{n+1}=q\,u_n$ |
| Terme général | $u_n=u_0+nr$ | $u_n=u_0q^{\,n}$ |
| Reconnaissance | $u_{n+1}-u_n$ constant | $\frac{u_{n+1}}{u_n}$ constant |
| Somme | $(n+1)\frac{u_0+u_n}{2}$ | $u_0\frac{1-q^{n+1}}{1-q}$ |

**Théorèmes de convergence**

- Croissante et majorée $\Rightarrow$ converge
- Décroissante et minorée $\Rightarrow$ converge
- Croissante non majorée $\Rightarrow$ tend vers $+\infty$

**Depuis un terme quelconque** : $u_n = u_p + (n-p)r$ et $u_n = u_p \times q^{\,n-p}$.`,
    },
  ],

  mindmap: {
    root: {
      label: 'Suites numériques',
      children: [
        {
          label: 'Reconnaître',
          children: [
            { label: 'u(n+1) − u(n) constant → arithmétique' },
            { label: 'u(n+1) / u(n) constant → géométrique' },
          ],
        },
        {
          label: 'Récurrence',
          children: [
            { label: '1. Initialisation (obligatoire)' },
            { label: '2. Hérédité : P(n) fixé ⟹ P(n+1)' },
            { label: '3. Conclusion' },
          ],
        },
        {
          label: 'Monotonie',
          children: [
            { label: 'Signe de u(n+1) − u(n)' },
            { label: 'Croissante ≠ convergente' },
          ],
        },
        {
          label: 'Convergence',
          children: [
            { label: 'Croissante + majorée ⟹ converge' },
            { label: 'Décroissante + minorée ⟹ converge' },
            { label: 'Limite : résoudre ℓ = f(ℓ), APRÈS convergence' },
          ],
        },
        {
          label: 'Limite de qⁿ',
          children: [
            { label: '|q| < 1 → 0' },
            { label: 'q > 1 → +∞' },
            { label: 'q ⩽ −1 → pas de limite' },
          ],
        },
      ],
    },
  },

  questions: [
    {
      stem: String.raw`La suite définie par $u_n = 5 - 3n$ est :`,
      choices: [
        ['a', String.raw`arithmétique de raison $-3$`, true],
        ['b', String.raw`géométrique de raison $-3$`, false],
        ['c', String.raw`arithmétique de raison $5$`, false],
        ['d', 'ni arithmétique ni géométrique', false],
      ],
      explanation: String.raw`On calcule la différence entre deux termes consécutifs :

$$u_{n+1} - u_n = \left(5-3(n+1)\right) - \left(5-3n\right) = -3$$

C'est une constante, donc la suite est **arithmétique de raison $-3$**, avec
$u_0 = 5$.

Le réflexe : différence constante → arithmétique ; quotient constant →
géométrique. Ici la forme $u_n = u_0 + nr$ se lit directement.`,
      difficulty: 1,
    },
    {
      stem: String.raw`Soit $u_n = 2 \times 3^{\,n}$. Que vaut $\displaystyle\lim_{n \to +\infty} u_n$ ?`,
      choices: [
        ['a', String.raw`$+\infty$`, true],
        ['b', String.raw`$0$`, false],
        ['c', String.raw`$2$`, false],
        ['d', String.raw`$3$`, false],
      ],
      explanation: String.raw`La suite est géométrique de raison $q = 3$. Comme $q > 1$, on a
$\lim 3^{\,n} = +\infty$, et le facteur $2 > 0$ ne change pas le signe.

À retenir : le comportement de $q^{\,n}$ dépend entièrement de $|q|$.
$|q| < 1$ donne $0$, $q > 1$ donne $+\infty$, et $q \leqslant -1$ donne une
suite sans limite car elle oscille.`,
      difficulty: 1,
    },
    {
      stem: String.raw`Dans une récurrence, quelle formulation de l'hypothèse est correcte ?`,
      choices: [
        ['a', String.raw`« Supposons $P(n)$ vraie pour un entier $n$ fixé »`, true],
        ['b', String.raw`« Supposons $P(n)$ vraie pour tout entier $n$ »`, false],
        ['c', String.raw`« Supposons $P(n+1)$ vraie »`, false],
        ['d', String.raw`« Supposons $P(n)$ fausse »`, false],
      ],
      explanation: String.raw`L'hérédité consiste à fixer **un** entier $n$ pour lequel la propriété est
supposée vraie, puis à en déduire $P(n+1)$.

Supposer $P(n)$ vraie « pour tout $n$ » revient à supposer exactement ce qu'on
veut démontrer : le raisonnement devient circulaire et ne vaut rien. C'est une
erreur de rédaction fréquente, et lourdement sanctionnée parce qu'elle révèle
une incompréhension du principe.`,
      difficulty: 2,
    },
    {
      stem: String.raw`Une suite croissante et majorée par $10$ :`,
      choices: [
        ['a', 'converge, vers une limite inférieure ou égale à 10', true],
        ['b', String.raw`converge nécessairement vers $10$`, false],
        ['c', String.raw`tend vers $+\infty$`, false],
        ['d', 'peut diverger', false],
      ],
      explanation: String.raw`Le théorème de la suite monotone bornée garantit la **convergence** : toute
suite croissante et majorée converge.

Mais elle ne converge pas forcément vers le majorant. $u_n = 1 - \frac{1}{n}$
est croissante et majorée par $10$, et converge vers $1$.

La limite est le **plus petit** majorant, qui peut être bien inférieur à celui
que l'énoncé donne. C'est justement l'intérêt du théorème : il prouve
l'existence de la limite sans la calculer.`,
      difficulty: 2,
    },
    {
      stem: String.raw`Soit $u_{n+1} = \frac{1}{3}u_n + 4$, convergente de limite $\ell$. Que vaut $\ell$ ?`,
      choices: [
        ['a', String.raw`$6$`, true],
        ['b', String.raw`$4$`, false],
        ['c', String.raw`$12$`, false],
        ['d', String.raw`$3$`, false],
      ],
      explanation: String.raw`Si $(u_n)$ converge vers $\ell$, alors $u_{n+1}$ converge aussi vers $\ell$, et
la relation de récurrence passe à la limite :

$$\ell = \tfrac{1}{3}\ell + 4 \;\Longrightarrow\; \tfrac{2}{3}\ell = 4 \;\Longrightarrow\; \ell = 6$$

Attention à l'ordre : ce calcul n'est légitime **que parce que l'énoncé affirme
la convergence**. Sur une suite divergente, la même équation donnerait un nombre
dépourvu de sens.`,
      difficulty: 2,
    },
    {
      stem: String.raw`Que vaut la somme $1 + 2 + 4 + 8 + \dots + 2^{10}$ ?`,
      choices: [
        ['a', String.raw`$2047$`, true],
        ['b', String.raw`$1024$`, false],
        ['c', String.raw`$2048$`, false],
        ['d', String.raw`$1023$`, false],
      ],
      explanation: String.raw`Somme géométrique de premier terme $u_0=1$, de raison $q=2$, avec $11$ termes
(de $2^0$ à $2^{10}$) :

$$S = 1 \times \frac{1-2^{11}}{1-2} = \frac{1-2048}{-1} = 2047$$

L'erreur classique est de compter $10$ termes au lieu de $11$ : de $2^0$ à
$2^{10}$ il y a bien $11$ valeurs. Vérifie toujours le nombre de termes avant
d'appliquer la formule.`,
      difficulty: 3,
    },
    {
      stem: String.raw`Une suite croissante et **non majorée** :`,
      choices: [
        ['a', String.raw`tend vers $+\infty$`, true],
        ['b', 'converge', false],
        ['c', String.raw`tend vers $-\infty$`, false],
        ['d', "n'a pas de limite", false],
      ],
      explanation: String.raw`C'est le pendant du théorème de convergence monotone : une suite croissante
fait l'une des deux choses seulement — elle converge si elle est majorée, elle
tend vers $+\infty$ sinon.

Une suite croissante ne peut jamais « osciller sans limite » : sa monotonie le
lui interdit. C'est ce qui rend l'étude du sens de variation si utile en début
d'exercice.`,
      difficulty: 2,
    },
    {
      stem: String.raw`Soit $u_{n+1}=\frac{1}{2}u_n+3$ et $v_n = u_n - 6$. La suite $(v_n)$ est :`,
      choices: [
        ['a', String.raw`géométrique de raison $\frac{1}{2}$`, true],
        ['b', String.raw`arithmétique de raison $3$`, false],
        ['c', String.raw`géométrique de raison $3$`, false],
        ['d', 'constante', false],
      ],
      explanation: String.raw`$$v_{n+1} = u_{n+1} - 6 = \tfrac{1}{2}u_n + 3 - 6 = \tfrac{1}{2}u_n - 3 = \tfrac{1}{2}\left(u_n - 6\right) = \tfrac{1}{2}v_n$$

Donc $(v_n)$ est **géométrique de raison $\frac{1}{2}$**.

Le nombre $6$ n'est pas choisi au hasard : c'est la solution de $\ell=\frac{1}{2}\ell+3$.
Retiens le schéma — quand un énoncé pose $v_n = u_n - \ell$ avec $\ell$ le point
fixe, c'est toujours pour faire apparaître une suite géométrique, puis en
déduire $u_n$ en fonction de $n$.`,
      difficulty: 3,
    },
  ],
}
