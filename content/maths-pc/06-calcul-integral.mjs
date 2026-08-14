export default {
  slug: 'primitives-et-calcul-integral',
  unit: { slug: 'analyse', title: 'Analyse', order: 1, lessonOrder: 6 },
  title: 'Primitives et calcul intégral',
  subtitle: "Remonter d'une dérivée à la fonction, et mesurer une aire sous une courbe.",
  difficulty: 3,
  estMinutes: 24,
  examFrequency: 5,
  accessTier: 'premium',
  objectives: [
    'Reconnaître et calculer une primitive usuelle ou composée',
    'Calculer une intégrale définie et l’interpréter comme une aire',
    'Appliquer l’intégration par parties',
    'Utiliser la linéarité et la relation de Chasles',
  ],
  keyTerms: ['primitive', 'intégrale', 'aire', 'intégration par parties', 'Chasles'],

  blocks: [
    {
      kind: 'resume',
      title: "L'essentiel",
      markdown: String.raw`Une **primitive** de $f$ sur un intervalle $I$ est une fonction $F$ telle que
$F' = f$. C'est la dérivation lue à l'envers.

Deux primitives d'une même fonction diffèrent d'une constante : si $F$ convient,
alors $F + k$ convient aussi. C'est pourquoi on parle **des** primitives, et
pourquoi une condition du type $F(0)=2$ est nécessaire pour en fixer une seule.

L'**intégrale** de $a$ à $b$ se calcule à partir de n'importe quelle primitive :

$$\int_a^b f(x)\,dx = \Big[F(x)\Big]_a^b = F(b) - F(a)$$

La constante disparaît dans la soustraction — d'où l'inutilité de la traîner
dans un calcul d'intégrale définie.

**Interprétation géométrique.** Si $f \geqslant 0$ sur $[a,b]$, l'intégrale est
l'**aire** entre la courbe et l'axe des abscisses, en unités d'aire.

Si $f$ change de signe, l'intégrale compte négativement les parties sous l'axe.
Pour une aire géométrique, il faut alors découper l'intervalle selon le signe de
$f$ et sommer les valeurs absolues.`,
    },
    {
      kind: 'formula',
      title: 'Primitives usuelles',
      markdown: String.raw`| $f(x)$ | Une primitive $F(x)$ |
|---|---|
| $k$ | $kx$ |
| $x^{\,n}$ ($n \neq -1$) | $\frac{x^{\,n+1}}{n+1}$ |
| $\frac{1}{x}$ | $\ln\lvert x\rvert$ |
| $e^{x}$ | $e^{x}$ |
| $\cos x$ | $\sin x$ |
| $\sin x$ | $-\cos x$ |
| $\frac{1}{\sqrt{x}}$ | $2\sqrt{x}$ |

**Formes composées** — celles qui font gagner le plus de temps :

$$\int u'\,u^{\,n} = \frac{u^{\,n+1}}{n+1}
\qquad
\int \frac{u'}{u} = \ln\lvert u\rvert
\qquad
\int u'e^{u} = e^{u}$$

Le réflexe : dès qu'une expression ressemble à « quelque chose $\times$ la
dérivée de ce quelque chose », c'est une forme composée.`,
    },
    {
      kind: 'formula',
      title: 'Propriétés de l’intégrale',
      markdown: String.raw`**Linéarité**

$$\int_a^b \left(\alpha f + \beta g\right) = \alpha\int_a^b f + \beta\int_a^b g$$

**Relation de Chasles**

$$\int_a^b f + \int_b^c f = \int_a^c f$$

**Inversion des bornes**

$$\int_a^b f = -\int_b^a f
\qquad\qquad
\int_a^a f = 0$$

**Positivité** — si $f \geqslant 0$ sur $[a,b]$ avec $a \leqslant b$, alors
$\int_a^b f \geqslant 0$. Et si $f \leqslant g$, alors $\int_a^b f \leqslant \int_a^b g$.

Cette dernière propriété sert à **encadrer** une intégrale qu'on ne sait pas
calculer — une question fréquente en fin d'exercice.`,
    },
    {
      kind: 'method',
      title: 'Intégration par parties',
      markdown: String.raw`$$\int_a^b u'v = \Big[uv\Big]_a^b - \int_a^b uv'$$

À utiliser quand l'intégrande est un **produit** dont un facteur se simplifie en
dérivant : typiquement $x\ln x$, $xe^{x}$, $x\cos x$.

Le choix décide de tout. Prends pour $v$ le facteur qui **se simplifie** quand on
le dérive :

- $\ln x$ devient $\frac{1}{x}$ → prends $v = \ln x$
- $x^{\,n}$ devient $x^{\,n-1}$ → prends $v = x^{\,n}$

et pour $u'$ celui qui **s'intègre facilement** ($e^{x}$, $\cos x$, une puissance).

Si après application l'intégrale restante est plus compliquée qu'au départ, tu
as inversé les rôles : recommence en échangeant.`,
    },
    {
      kind: 'example',
      title: 'Deux exemples traités',
      markdown: String.raw`**Forme composée.** $\displaystyle\int_0^1 \frac{2x}{x^2+1}\,dx$

On reconnaît $\frac{u'}{u}$ avec $u = x^2+1$ et $u' = 2x$ :

$$\int_0^1 \frac{2x}{x^2+1}\,dx = \Big[\ln(x^2+1)\Big]_0^1 = \ln 2 - \ln 1 = \ln 2$$

**Intégration par parties.** $\displaystyle\int_0^1 x e^{x}\,dx$

On pose $v = x$ (qui se simplifie : $v'=1$) et $u' = e^{x}$ (donc $u = e^{x}$) :

$$\int_0^1 xe^{x}\,dx = \Big[xe^{x}\Big]_0^1 - \int_0^1 e^{x}\,dx
= e - \Big[e^{x}\Big]_0^1 = e - (e-1) = 1$$

Remarque que l'intégrale restante, $\int e^{x}$, est plus simple que celle de
départ. C'est le signe que le choix de $u'$ et $v$ était le bon.`,
    },
    {
      kind: 'pitfall',
      markdown: String.raw`**1. Oublier la valeur absolue dans $\ln\lvert u\rvert$.**
La primitive de $\frac{1}{x}$ est $\ln\lvert x\rvert$, pas $\ln x$. Sur un
intervalle où $u>0$ la distinction ne change rien, mais elle est attendue.

**2. Confondre intégrale et aire quand $f$ change de signe.**
$\int_{-1}^{1} x\,dx = 0$, alors que l'aire géométrique vaut $1$. Si l'énoncé
demande une **aire**, découpe selon le signe.

**3. Inverser les rôles dans l'intégration par parties.**
Si l'intégrale restante est pire, le choix était mauvais. Ce n'est pas une
fatalité : recommence.

**4. Oublier le signe moins de l'IPP.**
La formule est $[uv] - \int uv'$. Le moins saute très souvent.

**5. Croire que $\int fg = \int f \times \int g$.**
Totalement faux. La linéarité vaut pour la **somme**, jamais pour le produit.

**6. Appliquer $\frac{x^{n+1}}{n+1}$ avec $n=-1$.**
Cela donnerait une division par zéro. Le cas $\frac{1}{x}$ est justement celui
qui donne $\ln$.`,
    },
    {
      kind: 'exam_tip',
      markdown: String.raw`Le calcul intégral clôt presque toujours l'exercice d'analyse, souvent en
enchaînement : on étudie $f$, puis on calcule l'aire sous sa courbe.

Schéma récurrent :

1. Montrer qu'une fonction $F$ donnée est une primitive de $f$ — il suffit de
   **dériver $F$** et de retrouver $f$. Question à un point, souvent négligée.
2. En déduire une intégrale.
3. Interpréter le résultat comme une aire, en unités d'aire.
4. Parfois : intégration par parties, ou encadrement.

**Conseil de copie :** pour la question 1, ne cherche pas à calculer la
primitive — dérive celle qu'on te donne. C'est plus rapide et sans risque.

Pense aussi à vérifier la cohérence : si $f \geqslant 0$ sur $[a,b]$ et que ton
intégrale sort négative, il y a une erreur de signe.`,
    },
    {
      kind: 'cheatsheet',
      title: 'Fiche mémo',
      markdown: String.raw`**Composées à reconnaître au premier coup d'œil**

$$\int \frac{u'}{u} = \ln\lvert u\rvert
\qquad
\int u'e^{u} = e^{u}
\qquad
\int u'u^{\,n} = \frac{u^{\,n+1}}{n+1}$$

**IPP** : $\displaystyle\int_a^b u'v = \Big[uv\Big]_a^b - \int_a^b uv'$
— prends pour $v$ ce qui se simplifie en dérivant.

**Aire entre deux courbes** ($f \geqslant g$ sur $[a,b]$) :

$$\mathcal{A} = \int_a^b \left(f(x)-g(x)\right)dx$$

**Valeur moyenne** de $f$ sur $[a,b]$ :

$$\mu = \frac{1}{b-a}\int_a^b f(x)\,dx$$`,
    },
  ],

  mindmap: {
    root: {
      label: 'Primitives et intégrales',
      children: [
        {
          label: 'Primitive',
          children: [
            { label: "F' = f, définie à une constante près" },
            { label: 'Vérifier : dériver F et retrouver f' },
          ],
        },
        {
          label: 'Composées',
          children: [
            { label: "u'/u → ln|u|" },
            { label: "u'eᵘ → eᵘ" },
            { label: "u'uⁿ → uⁿ⁺¹/(n+1)" },
          ],
        },
        {
          label: 'Intégrale',
          children: [
            { label: 'F(b) − F(a)' },
            { label: 'Linéarité et Chasles' },
            { label: 'Bornes inversées → signe opposé' },
          ],
        },
        {
          label: 'Aire',
          children: [
            { label: 'f ⩾ 0 : aire = intégrale' },
            { label: 'f change de signe : découper' },
            { label: 'Entre 2 courbes : ∫(f − g)' },
          ],
        },
        {
          label: 'IPP',
          children: [
            { label: '∫u′v = [uv] − ∫uv′' },
            { label: 'v = ce qui se simplifie en dérivant' },
            { label: 'Ne pas oublier le signe moins' },
          ],
        },
      ],
    },
  },

  questions: [
    {
      stem: String.raw`Quelle est une primitive de $f(x) = 3x^{2}$ ?`,
      choices: [
        ['a', String.raw`$x^{3}$`, true],
        ['b', String.raw`$6x$`, false],
        ['c', String.raw`$x^{3}+3$ uniquement`, false],
        ['d', String.raw`$\dfrac{3x^{3}}{3}+x$`, false],
      ],
      explanation: String.raw`On remonte la dérivation : $\left(x^{3}\right)' = 3x^{2}$, donc $x^{3}$
convient.

$6x$ est la **dérivée** de $3x^2$, pas sa primitive — c'est l'erreur de sens la
plus fréquente.

Note que $x^3+3$ est aussi une primitive valable : toutes les primitives
diffèrent d'une constante, d'où le « une primitive » de l'énoncé.`,
      difficulty: 1,
    },
    {
      stem: String.raw`Que vaut $\displaystyle\int_1^3 2x\,dx$ ?`,
      choices: [
        ['a', String.raw`$8$`, true],
        ['b', String.raw`$4$`, false],
        ['c', String.raw`$9$`, false],
        ['d', String.raw`$6$`, false],
      ],
      explanation: String.raw`Une primitive de $2x$ est $x^2$ :

$$\int_1^3 2x\,dx = \Big[x^{2}\Big]_1^3 = 9 - 1 = 8$$

L'erreur habituelle est d'oublier de soustraire la valeur en la borne
inférieure et de répondre $9$.

Vérification de cohérence : $2x \geqslant 0$ sur $[1,3]$, donc l'intégrale doit
être positive. ✓`,
      difficulty: 1,
    },
    {
      stem: String.raw`Quelle est une primitive de $f(x) = \dfrac{1}{x}$ sur $]0\,;+\infty[$ ?`,
      choices: [
        ['a', String.raw`$\ln x$`, true],
        ['b', String.raw`$-\dfrac{1}{x^{2}}$`, false],
        ['c', String.raw`$\dfrac{x^{0}}{0}$`, false],
        ['d', String.raw`$\dfrac{1}{2x^{2}}$`, false],
      ],
      explanation: String.raw`$\left(\ln x\right)' = \frac{1}{x}$, donc $\ln x$ est bien une primitive sur
$]0\,;+\infty[$.

C'est l'exception de la formule $\int x^{n} = \frac{x^{n+1}}{n+1}$ : avec
$n=-1$, le dénominateur $n+1$ serait nul. Ce cas particulier est précisément
celui qui produit le logarithme.

Sur un intervalle contenant des valeurs négatives, on écrirait $\ln\lvert x\rvert$.`,
      difficulty: 2,
    },
    {
      stem: String.raw`Que vaut $\displaystyle\int_0^1 \frac{3x^{2}}{x^{3}+1}\,dx$ ?`,
      choices: [
        ['a', String.raw`$\ln 2$`, true],
        ['b', String.raw`$\ln 3$`, false],
        ['c', String.raw`$\dfrac{1}{2}$`, false],
        ['d', String.raw`$1$`, false],
      ],
      explanation: String.raw`On reconnaît la forme $\frac{u'}{u}$ avec $u = x^{3}+1$ et $u' = 3x^{2}$ :

$$\int_0^1 \frac{3x^{2}}{x^{3}+1}\,dx = \Big[\ln\lvert x^{3}+1\rvert\Big]_0^1 = \ln 2 - \ln 1 = \ln 2$$

Le réflexe qui fait gagner du temps : avant de te lancer dans un calcul,
regarde si le numérateur est la dérivée du dénominateur. Ici $3x^2$ est
exactement $(x^3+1)'$.`,
      difficulty: 3,
    },
    {
      stem: String.raw`Dans $\displaystyle\int_1^{e} x\ln x\,dx$ par parties, que faut-il choisir pour $v$ ?`,
      choices: [
        ['a', String.raw`$v = \ln x$`, true],
        ['b', String.raw`$v = x$`, false],
        ['c', String.raw`$v = x\ln x$`, false],
        ['d', String.raw`$v = \dfrac{1}{x}$`, false],
      ],
      explanation: String.raw`On prend pour $v$ le facteur qui **se simplifie en dérivant**. Ici
$\left(\ln x\right)' = \frac{1}{x}$ : le logarithme disparaît, ce qui est
exactement l'effet recherché.

Donc $v=\ln x$ et $u'=x$, d'où $u=\frac{x^2}{2}$ :

$$\int_1^e x\ln x\,dx = \left[\frac{x^{2}}{2}\ln x\right]_1^e - \int_1^e \frac{x}{2}\,dx$$

L'intégrale restante est un simple polynôme. Avec le choix inverse, tu
obtiendrais une intégrale contenant encore un $\ln$ — signe que les rôles
étaient inversés.`,
      difficulty: 3,
    },
    {
      stem: String.raw`Si $f$ change de signe sur $[a,b]$, l'intégrale $\int_a^b f$ représente-t-elle l'aire ?`,
      choices: [
        ['a', 'Non : les parties sous l’axe comptent négativement', true],
        ['b', 'Oui, toujours', false],
        ['c', "Oui, si $f$ est continue", false],
        ['d', 'Non : l’intégrale n’existe pas', false],
      ],
      explanation: String.raw`L'intégrale est une **aire algébrique** : ce qui est au-dessus de l'axe compte
positivement, ce qui est en dessous négativement.

Exemple : $\int_{-1}^{1} x\,dx = 0$, alors que l'aire géométrique vaut $1$ —
les deux moitiés se compensent exactement.

Pour une aire au sens géométrique, découpe $[a,b]$ selon le signe de $f$ et
additionne les valeurs absolues. L'énoncé distingue toujours « calculer
l'intégrale » et « calculer l'aire » : lis la question attentivement.`,
      difficulty: 2,
    },
    {
      stem: String.raw`Que vaut $\displaystyle\int_2^2 f(x)\,dx$ pour toute fonction $f$ continue ?`,
      choices: [
        ['a', String.raw`$0$`, true],
        ['b', String.raw`$f(2)$`, false],
        ['c', String.raw`$2f(2)$`, false],
        ['d', 'On ne peut pas savoir', false],
      ],
      explanation: String.raw`Bornes identiques : $\int_a^a f = F(a)-F(a) = 0$, quelle que soit $f$.

Géométriquement, c'est l'aire d'une région de largeur nulle.

Cette propriété paraît anecdotique mais sert régulièrement, notamment avec la
relation de Chasles pour simplifier une somme d'intégrales.`,
      difficulty: 1,
    },
  ],
}
