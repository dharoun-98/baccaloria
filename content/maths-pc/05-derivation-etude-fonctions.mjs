export default {
  slug: 'derivation-et-etude-de-fonctions',
  unit: { slug: 'analyse', title: 'Analyse', order: 1, lessonOrder: 5 },
  title: 'Dérivation et étude de fonctions',
  subtitle: "L'exercice le plus long de l'épreuve, et le plus mécanique une fois la méthode acquise.",
  difficulty: 2,
  estMinutes: 25,
  examFrequency: 5,
  accessTier: 'premium',
  objectives: [
    'Calculer une dérivée, y compris pour un produit, un quotient ou une composée',
    'Déduire le sens de variation du signe de la dérivée',
    'Construire un tableau de variations complet',
    'Déterminer une équation de tangente et étudier la position de la courbe',
  ],
  keyTerms: ['dérivée', 'tableau de variations', 'tangente', 'extremum', 'point d’inflexion'],

  blocks: [
    {
      kind: 'resume',
      title: "L'essentiel",
      markdown: String.raw`Le nombre dérivé $f'(a)$ est le **coefficient directeur de la tangente** à la
courbe au point d'abscisse $a$. C'est la traduction géométrique de tout le
chapitre : la dérivée mesure la pente.

De là découle la propriété qui structure toute étude de fonction :

$$f' > 0 \text{ sur } I \iff f \text{ est croissante sur } I$$
$$f' < 0 \text{ sur } I \iff f \text{ est décroissante sur } I$$

Un **extremum local** apparaît là où $f'$ s'annule **en changeant de signe**. Le
changement de signe est essentiel : $f(x)=x^3$ vérifie $f'(0)=0$ sans présenter
d'extremum, la dérivée restant positive de part et d'autre.

**Équation de la tangente** au point d'abscisse $a$ :

$$y = f'(a)\,(x-a) + f(a)$$

Cette formule se retrouve toujours : c'est la droite qui passe par le point
$\left(a, f(a)\right)$ avec la pente $f'(a)$.`,
    },
    {
      kind: 'formula',
      title: 'Dérivées usuelles',
      markdown: String.raw`| $f(x)$ | $f'(x)$ |
|---|---|
| $k$ (constante) | $0$ |
| $x^{\,n}$ | $n\,x^{\,n-1}$ |
| $\frac{1}{x}$ | $-\frac{1}{x^2}$ |
| $\sqrt{x}$ | $\frac{1}{2\sqrt{x}}$ |
| $\ln x$ | $\frac{1}{x}$ |
| $e^{x}$ | $e^{x}$ |
| $\cos x$ | $-\sin x$ |
| $\sin x$ | $\cos x$ |`,
    },
    {
      kind: 'formula',
      title: 'Opérations',
      markdown: String.raw`$$(u+v)' = u' + v'
\qquad
(ku)' = k\,u'$$

$$(uv)' = u'v + uv'
\qquad
\left(\frac{u}{v}\right)' = \frac{u'v - uv'}{v^2}$$

$$\left(u^{\,n}\right)' = n\,u'\,u^{\,n-1}
\qquad
\left(\sqrt{u}\right)' = \frac{u'}{2\sqrt{u}}$$

$$\left(\ln u\right)' = \frac{u'}{u}
\qquad
\left(e^{u}\right)' = u'\,e^{u}$$

Pour le quotient, l'ordre au numérateur n'est pas symétrique : c'est
$u'v - uv'$, jamais $uv' - u'v$. Une inversion change tous les signes du tableau
de variations.`,
    },
    {
      kind: 'method',
      title: 'Étude complète, dans l’ordre',
      markdown: String.raw`1. **Domaine de définition** $D_f$, avec justification.
2. **Limites** aux bornes de $D_f$, et asymptotes qui en découlent.
3. **Dérivée** $f'(x)$, sous forme factorisée si possible.
4. **Signe de $f'$** — c'est ici que se joue l'exercice.
5. **Tableau de variations** : $x$, signe de $f'$, variations de $f$, et les
   valeurs aux bornes.
6. **Points remarquables** : tangentes, extrema, intersections avec les axes.
7. **Tracé**.

L'étape 3 mérite un effort de mise en forme : une dérivée laissée sous forme
développée rend l'étude de signe pénible, alors qu'une forme factorisée la rend
immédiate. Cherche systématiquement à factoriser.`,
    },
    {
      kind: 'example',
      title: 'Exemple traité',
      markdown: String.raw`**Étudier les variations de $f(x) = x e^{-x}$ sur $\mathbb{R}$.**

*Dérivée.* Produit $u = x$, $v = e^{-x}$, donc $u' = 1$ et $v' = -e^{-x}$ :

$$f'(x) = 1 \cdot e^{-x} + x \cdot (-e^{-x}) = e^{-x}(1-x)$$

*Signe.* $e^{-x} > 0$ pour tout réel, donc $f'$ a le signe de $1-x$ :

$$f'(x) > 0 \iff x < 1$$

*Variations.* $f$ croît sur $]-\infty\,;1]$, décroît sur $[1\,;+\infty[$, et
présente un **maximum** en $x=1$ valant $f(1)=\frac{1}{e}$.

*Limites.* $\lim_{x\to-\infty} xe^{-x} = -\infty$ et
$\lim_{x\to+\infty} xe^{-x} = 0^{+}$ par croissance comparée — d'où une
asymptote horizontale $y=0$ en $+\infty$.

Remarque comme la factorisation $e^{-x}(1-x)$ rend l'étude de signe triviale.
Développée, la même dérivée serait bien plus pénible à signer.`,
    },
    {
      kind: 'pitfall',
      markdown: String.raw`**1. Inverser le numérateur du quotient.**
C'est $\dfrac{u'v-uv'}{v^2}$. L'ordre inversé retourne tout le tableau de
variations.

**2. Oublier $u'$ dans une composée.**
$\left(e^{3x}\right)' = 3e^{3x}$, pas $e^{3x}$. Idem pour $\ln u$ et $\sqrt{u}$.

**3. Conclure à un extremum dès que $f'(a)=0$.**
Il faut un **changement de signe**. $f(x)=x^3$ a $f'(0)=0$ et aucun extremum.

**4. Ne pas factoriser la dérivée.**
Ce n'est pas de l'élégance : sur une forme développée, l'étude de signe devient
un second exercice, souvent raté.

**5. Oublier de restreindre au domaine.**
Une dérivée peut exister là où $f$ n'est pas définie. Le tableau de variations
ne porte que sur $D_f$.

**6. Confondre $f'$ et $f$ dans le tableau.**
La ligne du signe est celle de $f'$ ; la ligne des flèches est celle de $f$.
L'inversion est fréquente sous stress et coûte l'ensemble de la question.`,
    },
    {
      kind: 'exam_tip',
      markdown: String.raw`L'étude de fonction représente à elle seule **6 à 8 points** de l'épreuve de
maths PC. C'est l'exercice le plus long, mais aussi le plus prévisible : la
structure ne change pas d'une année sur l'autre.

Les fonctions retenues combinent presque toujours exponentielle ou logarithme
avec un polynôme : $xe^{-x}$, $\frac{\ln x}{x}$, $(x^2-1)e^{x}$.

**Conseil de copie :** soigne le tableau de variations. Trace-le à la règle,
place les bornes du domaine, les valeurs des limites et les extrema. Un tableau
complet et lisible rapporte des points même quand une limite plus haut est
fausse, parce que le correcteur voit que la méthode est maîtrisée.

Si le calcul de $f'$ te donne une expression impossible à signer, c'est
généralement le signe d'une erreur de dérivation : reprends-la plutôt que de
t'acharner.`,
    },
    {
      kind: 'cheatsheet',
      title: 'Fiche mémo',
      markdown: String.raw`**Tangente en $a$** : $y = f'(a)(x-a) + f(a)$

**Lecture du signe**

| $f'$ | $f$ |
|---|---|
| $> 0$ | croissante |
| $< 0$ | décroissante |
| $=0$ avec changement de signe | extremum |
| $=0$ sans changement | palier, pas d'extremum |

**Réflexes de factorisation**

- $e^{u}$ en facteur : toujours positif, se sort du signe
- Trinôme : discriminant, puis signe classique
- $\ln$ : penser au domaine avant tout

**Position courbe / tangente** : étudier le signe de $f(x) - \left(f'(a)(x-a)+f(a)\right)$.`,
    },
  ],

  mindmap: {
    root: {
      label: 'Dérivation',
      children: [
        {
          label: 'Sens',
          children: [
            { label: "f'(a) = pente de la tangente en a" },
            { label: 'y = f′(a)(x − a) + f(a)' },
          ],
        },
        {
          label: 'Opérations',
          children: [
            { label: "(uv)' = u'v + uv'" },
            { label: "(u/v)' = (u'v − uv') / v²" },
            { label: "(eᵘ)' = u'eᵘ · (ln u)' = u'/u" },
          ],
        },
        {
          label: 'Variations',
          children: [
            { label: "f' > 0 → croissante" },
            { label: "f' < 0 → décroissante" },
            { label: 'Extremum = annulation AVEC changement de signe' },
          ],
        },
        {
          label: 'Méthode',
          children: [
            { label: '1. Domaine  2. Limites  3. Dérivée' },
            { label: '4. Signe  5. Tableau  6. Tracé' },
            { label: 'Toujours factoriser f′' },
          ],
        },
      ],
    },
  },

  questions: [
    {
      stem: String.raw`Quelle est la dérivée de $f(x) = x^{3} - 4x + 7$ ?`,
      choices: [
        ['a', String.raw`$3x^{2} - 4$`, true],
        ['b', String.raw`$3x^{2} - 4x$`, false],
        ['c', String.raw`$x^{2} - 4$`, false],
        ['d', String.raw`$3x^{2} - 4 + 7$`, false],
      ],
      explanation: String.raw`Terme à terme : $\left(x^3\right)'=3x^2$, $(-4x)'=-4$, et la dérivée de la
constante $7$ est $0$.

$$f'(x) = 3x^{2} - 4$$

L'erreur classique est de conserver la constante. Une constante a une pente
nulle : elle disparaît toujours à la dérivation.`,
      difficulty: 1,
    },
    {
      stem: String.raw`Quelle est la dérivée de $f(x) = x^{2}e^{x}$ ?`,
      choices: [
        ['a', String.raw`$(2x + x^{2})e^{x}$`, true],
        ['b', String.raw`$2xe^{x}$`, false],
        ['c', String.raw`$2x e^{x} + x^2$`, false],
        ['d', String.raw`$x^{2}e^{x}$`, false],
      ],
      explanation: String.raw`Formule du produit, avec $u=x^2$ et $v=e^{x}$ :

$$f'(x) = 2x\,e^{x} + x^{2}e^{x} = \left(2x + x^{2}\right)e^{x} = x(x+2)e^{x}$$

Dériver chaque facteur séparément — la réponse $2xe^x$ — est l'erreur la plus
répandue du chapitre.

Note la forme factorisée finale : elle rend le signe immédiat, puisque
$e^{x}>0$ et qu'il ne reste qu'à signer $x(x+2)$.`,
      difficulty: 2,
    },
    {
      stem: String.raw`Si $f'(x) < 0$ sur un intervalle $I$, alors sur $I$ la fonction $f$ est :`,
      choices: [
        ['a', 'décroissante', true],
        ['b', 'croissante', false],
        ['c', 'constante', false],
        ['d', 'négative', false],
      ],
      explanation: String.raw`Une dérivée strictement négative signifie une pente négative en tout point :
la fonction **décroît**.

Attention à ne pas confondre le signe de $f'$ et celui de $f$ : $f$ peut très
bien être décroissante tout en restant positive. Par exemple $f(x)=\frac{1}{x}$
sur $]0\,;+\infty[$ est décroissante et strictement positive.`,
      difficulty: 1,
    },
    {
      stem: String.raw`Quelle est l'équation de la tangente à $f(x)=x^{2}$ au point d'abscisse $a=3$ ?`,
      choices: [
        ['a', String.raw`$y = 6x - 9$`, true],
        ['b', String.raw`$y = 6x + 9$`, false],
        ['c', String.raw`$y = 9x - 6$`, false],
        ['d', String.raw`$y = 2x + 3$`, false],
      ],
      explanation: String.raw`$f'(x)=2x$ donc $f'(3)=6$, et $f(3)=9$. On applique la formule :

$$y = f'(a)(x-a)+f(a) = 6(x-3)+9 = 6x-18+9 = 6x-9$$

Vérification utile : la tangente doit passer par le point de contact. Pour
$x=3$, on obtient $y=6\times3-9=9=f(3)$. ✓

Ce contrôle en une ligne détecte immédiatement une erreur de signe.`,
      difficulty: 2,
    },
    {
      stem: String.raw`Quelle est la dérivée de $f(x)=\dfrac{x}{x+1}$ ?`,
      choices: [
        ['a', String.raw`$\dfrac{1}{(x+1)^{2}}$`, true],
        ['b', String.raw`$\dfrac{-1}{(x+1)^{2}}$`, false],
        ['c', String.raw`$\dfrac{2x+1}{(x+1)^{2}}$`, false],
        ['d', String.raw`$1$`, false],
      ],
      explanation: String.raw`Formule du quotient avec $u=x$, $v=x+1$, $u'=1$, $v'=1$ :

$$f'(x)=\frac{u'v-uv'}{v^{2}}=\frac{1\cdot(x+1)-x\cdot 1}{(x+1)^{2}}=\frac{1}{(x+1)^{2}}$$

Le résultat est strictement positif : $f$ est croissante sur chacun de ses
intervalles de définition.

Si tu as trouvé $\frac{-1}{(x+1)^2}$, tu as inversé le numérateur en écrivant
$uv'-u'v$. L'ordre correct est $u'v-uv'$.`,
      difficulty: 3,
    },
    {
      stem: String.raw`Soit $f'(x)=e^{-x}(2-x)$. En quel point $f$ admet-elle un maximum ?`,
      choices: [
        ['a', String.raw`En $x=2$`, true],
        ['b', String.raw`En $x=0$`, false],
        ['c', String.raw`En $x=-2$`, false],
        ['d', "Elle n'a pas de maximum", false],
      ],
      explanation: String.raw`$e^{-x}>0$ pour tout réel, donc $f'$ a le signe de $2-x$ :

- $f'(x)>0$ pour $x<2$ : $f$ croît
- $f'(x)<0$ pour $x>2$ : $f$ décroît

La dérivée s'annule en $2$ **en changeant de signe**, du positif vers le
négatif : c'est bien un **maximum**.

Le réflexe à garder : un facteur exponentiel se neutralise, et seul le reste
détermine le signe.`,
      difficulty: 2,
    },
    {
      stem: String.raw`Si $f'(a)=0$, peut-on conclure que $f$ admet un extremum en $a$ ?`,
      choices: [
        ['a', String.raw`Non, il faut aussi un changement de signe de $f'$`, true],
        ['b', 'Oui, toujours', false],
        ['c', String.raw`Oui, si $f$ est continue`, false],
        ['d', String.raw`Oui, si $a$ appartient au domaine`, false],
      ],
      explanation: String.raw`L'annulation de la dérivée est nécessaire, pas suffisante.

Contre-exemple de référence : $f(x)=x^{3}$ vérifie $f'(x)=3x^{2}$, donc
$f'(0)=0$. Pourtant $f'$ reste **positive** de part et d'autre de $0$ : la
fonction est croissante partout et n'a aucun extremum. Le point $0$ est un
point d'inflexion à tangente horizontale.

Dans une copie, écris toujours « $f'$ s'annule **en changeant de signe** » —
c'est cette formulation que le barème attend.`,
      difficulty: 3,
    },
  ],
}
