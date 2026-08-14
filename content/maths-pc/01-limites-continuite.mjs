export default {
  slug: 'limites-et-continuite',
  unit: { slug: 'analyse', title: 'Analyse', order: 1, lessonOrder: 1 },
  title: 'Limites et continuité',
  subtitle:
    "Le point de départ de toute étude de fonction : savoir ce que devient f(x) aux bords du domaine.",
  difficulty: 2,
  estMinutes: 22,
  examFrequency: 5,
  accessTier: 'free',
  objectives: [
    'Calculer une limite finie ou infinie, y compris dans les cas indéterminés',
    'Lever une indétermination par factorisation, conjugué ou terme dominant',
    'Reconnaître une fonction continue et exploiter le théorème des valeurs intermédiaires',
    'Justifier l’existence d’une solution de $f(x)=0$ sur un intervalle',
  ],
  keyTerms: ['limite', 'indétermination', 'continuité', 'TVI', 'asymptote'],

  blocks: [
    {
      kind: 'resume',
      title: "L'essentiel",
      markdown: String.raw`Une **limite** décrit vers quoi tend $f(x)$ quand $x$ s'approche d'une valeur
$a$ ou part vers l'infini. C'est ce qui permet de décrire le comportement d'une
courbe là où on ne peut pas simplement calculer.

Trois situations reviennent tout le temps :

- $\displaystyle\lim_{x \to a} f(x) = \ell$ : la courbe s'approche d'une valeur finie.
- $\displaystyle\lim_{x \to a} f(x) = \pm\infty$ : **asymptote verticale** d'équation $x = a$.
- $\displaystyle\lim_{x \to \pm\infty} f(x) = \ell$ : **asymptote horizontale** d'équation $y = \ell$.

La **continuité** est le fait que la courbe ne se coupe pas. Formellement, $f$ est
continue en $a$ si :

$$\lim_{x \to a} f(x) = f(a)$$

Il faut donc trois choses à la fois : que $f(a)$ existe, que la limite existe, et
qu'elles soient égales.

Toutes les fonctions usuelles — polynômes, rationnelles, racines, $\ln$, $\exp$,
$\cos$, $\sin$ — sont continues sur tout intervalle de leur domaine de définition.
En pratique, la continuité ne se discute vraiment qu'aux **points de raccordement**
d'une fonction définie par morceaux.`,
    },
    {
      kind: 'method',
      title: 'Lever une indétermination',
      markdown: String.raw`Les quatre formes indéterminées sont $\dfrac{0}{0}$, $\dfrac{\infty}{\infty}$,
$\infty - \infty$ et $0 \times \infty$. Une forme indéterminée **n'est pas une
réponse** : elle signale qu'il faut transformer l'expression.

1. **Quotient de polynômes en $\pm\infty$** — garde les termes de plus haut degré :

$$\lim_{x \to +\infty} \frac{3x^2 - x + 1}{2x^2 + 5} = \lim_{x \to +\infty} \frac{3x^2}{2x^2} = \frac{3}{2}$$

2. **Forme $\frac{0}{0}$ en un point $a$** — factorise : $(x-a)$ se met en facteur
   en haut et en bas, puis se simplifie.

3. **Présence d'une racine** — multiplie par la quantité conjuguée.

4. **$\infty - \infty$** — factorise par le terme dominant, ou passe par le conjugué
   s'il y a une racine.`,
    },
    {
      kind: 'example',
      title: 'Trois indéterminations traitées',
      markdown: String.raw`**Factorisation.** $\displaystyle\lim_{x \to 2} \frac{x^2 - 4}{x - 2}$ est de la forme $\frac{0}{0}$.

$$\frac{x^2-4}{x-2} = \frac{(x-2)(x+2)}{x-2} = x+2 \quad\Longrightarrow\quad \lim_{x \to 2} = 4$$

**Conjugué.** $\displaystyle\lim_{x \to 0} \frac{\sqrt{x+1}-1}{x}$, encore $\frac{0}{0}$.

$$\frac{\sqrt{x+1}-1}{x} \times \frac{\sqrt{x+1}+1}{\sqrt{x+1}+1}
= \frac{x}{x\left(\sqrt{x+1}+1\right)} = \frac{1}{\sqrt{x+1}+1}$$

La limite vaut donc $\dfrac{1}{2}$.

**Terme dominant.** $\displaystyle\lim_{x \to +\infty} \left(\sqrt{x^2+x} - x\right)$, forme $\infty-\infty$.

$$\sqrt{x^2+x}-x = \frac{x}{\sqrt{x^2+x}+x} = \frac{1}{\sqrt{1+\frac{1}{x}}+1} \xrightarrow[x \to +\infty]{} \frac{1}{2}$$`,
    },
    {
      kind: 'theorem',
      title: 'Théorème des valeurs intermédiaires (TVI)',
      markdown: String.raw`Si $f$ est **continue** sur $[a,b]$ et si $k$ est compris entre $f(a)$ et $f(b)$,
alors il existe au moins un $c \in [a,b]$ tel que $f(c) = k$.

Cas le plus utilisé à l'examen, avec $k=0$ :

> Si $f$ est continue sur $[a,b]$ et si $f(a) \times f(b) < 0$, alors l'équation
> $f(x)=0$ admet **au moins une** solution dans $]a,b[$.

Si de plus $f$ est **strictement monotone** sur $[a,b]$, cette solution est
**unique**. C'est la monotonie qui donne l'unicité, jamais la continuité seule.`,
    },
    {
      kind: 'pitfall',
      markdown: String.raw`**1. Traiter une forme indéterminée comme un résultat.**
Écrire « $\frac{0}{0} = 0$ » ou « $\frac{\infty}{\infty} = 1$ » coûte tout
l'exercice. Il faut transformer l'expression.

**2. Oublier les limites à gauche et à droite.**
Pour $f(x) = \frac{1}{x}$ en $0$ : $\lim_{x \to 0^-} = -\infty$ et
$\lim_{x \to 0^+} = +\infty$. La limite en $0$ **n'existe pas**.

**3. Confondre continuité et dérivabilité.**
$x \mapsto |x|$ est continue en $0$ mais **pas dérivable** en $0$. Dérivable
implique continue ; l'inverse est faux.

**4. Conclure à l'unicité avec le seul TVI.**
Le TVI donne l'**existence**. L'unicité exige la stricte monotonie, à justifier
par le signe de $f'$.

**5. Simplifier avant de vérifier la valeur interdite.**
$\frac{(x-2)(x+2)}{x-2} = x+2$ **uniquement pour $x \neq 2$**. La fonction n'est
pas définie en $2$, même si la limite y vaut $4$.`,
    },
    {
      kind: 'exam_tip',
      markdown: String.raw`L'étude de fonction est **l'exercice le plus lourd** de l'épreuve de maths PC, et
les limites en sont la première question — donc des points quasi garantis si la
méthode est propre.

L'enchaînement attendu est presque toujours le même :

1. Domaine de définition.
2. Limites aux bornes du domaine.
3. Asymptotes déduites de ces limites.
4. Dérivée, signe, tableau de variations.
5. Tracé.

**Conseil de copie :** pour une question « montrer que l'équation $f(x)=0$ admet
une unique solution $\alpha$ », le correcteur attend explicitement trois éléments :
continuité, stricte monotonie, et changement de signe. Cite les trois, même si
c'est évident — chacun vaut un point.`,
    },
    {
      kind: 'cheatsheet',
      title: 'Fiche mémo',
      markdown: String.raw`**Limites de référence en $+\infty$**

| Fonction | Limite |
|---|---|
| $\frac{1}{x}$, $\frac{1}{x^2}$, $\frac{1}{\sqrt{x}}$ | $0$ |
| $\ln x$ | $+\infty$ |
| $e^x$ | $+\infty$ |
| $\frac{\ln x}{x}$ | $0$ |
| $\frac{e^x}{x}$ | $+\infty$ |

**Croissances comparées** — l'exponentielle écrase la puissance, qui écrase le
logarithme :

$$\lim_{x \to +\infty} \frac{e^x}{x^n} = +\infty \qquad \lim_{x \to +\infty} \frac{\ln x}{x^n} = 0 \qquad \lim_{x \to 0^+} x\ln x = 0$$

**Asymptotes**

- $\lim_{x \to a} f = \pm\infty$ → verticale $x=a$
- $\lim_{x \to \pm\infty} f = \ell$ → horizontale $y=\ell$
- $\lim_{x \to \pm\infty} \left(f(x)-(ax+b)\right)=0$ → oblique $y=ax+b$`,
    },
  ],

  mindmap: {
    root: {
      label: 'Limites et continuité',
      children: [
        {
          label: 'Calculer une limite',
          children: [
            { label: 'Fonctions usuelles : par substitution' },
            { label: 'En ±∞ : garder le terme dominant' },
            { label: '4 formes indéterminées à lever' },
          ],
        },
        {
          label: 'Lever une indétermination',
          children: [
            { label: '0/0 → factoriser par (x − a)' },
            { label: 'Racine → quantité conjuguée' },
            { label: '∞ − ∞ → factoriser ou conjuguer' },
          ],
        },
        {
          label: 'Asymptotes',
          children: [
            { label: 'Verticale : limite infinie en a' },
            { label: 'Horizontale : limite finie en ±∞' },
            { label: 'Oblique : f(x) − (ax+b) → 0' },
          ],
        },
        {
          label: 'Continuité',
          children: [
            { label: 'lim f(x) = f(a) en a' },
            { label: 'Dérivable ⟹ continue (pas l’inverse)' },
          ],
        },
        {
          label: 'TVI',
          children: [
            { label: 'Continue + f(a)·f(b) < 0 ⟹ une solution' },
            { label: '+ strictement monotone ⟹ unique' },
          ],
        },
      ],
    },
  },

  questions: [
    {
      stem: String.raw`Que vaut $\displaystyle\lim_{x \to +\infty} \frac{5x^2 - 3x}{2x^2 + 7}$ ?`,
      choices: [
        ['a', String.raw`$\dfrac{5}{2}$`, true],
        ['b', String.raw`$0$`, false],
        ['c', String.raw`$+\infty$`, false],
        ['d', String.raw`$-\dfrac{3}{7}$`, false],
      ],
      explanation: String.raw`En $\pm\infty$, un quotient de polynômes se comporte comme le quotient de ses
termes de plus haut degré :

$$\frac{5x^2-3x}{2x^2+7} \sim \frac{5x^2}{2x^2} = \frac{5}{2}$$

Les degrés étant égaux, la limite est le rapport des coefficients dominants.
Si le degré du numérateur était plus grand, la limite serait infinie ; plus
petit, elle serait nulle.`,
      difficulty: 1,
    },
    {
      stem: String.raw`Que vaut $\displaystyle\lim_{x \to 3} \frac{x^2 - 9}{x - 3}$ ?`,
      choices: [
        ['a', String.raw`$6$`, true],
        ['b', String.raw`$0$`, false],
        ['c', String.raw`$1$`, false],
        ['d', "La limite n'existe pas", false],
      ],
      explanation: String.raw`C'est une forme $\frac{0}{0}$ : il faut factoriser, pas conclure.

$$\frac{x^2-9}{x-3} = \frac{(x-3)(x+3)}{x-3} = x+3 \quad (x \neq 3)$$

Donc la limite vaut $3+3 = 6$.

Note bien que $f$ n'est **pas définie** en $3$ : la simplification n'est valable
que pour $x \neq 3$. La limite existe malgré tout, c'est justement l'intérêt de
la notion.`,
      difficulty: 2,
    },
    {
      stem: String.raw`La fonction $f(x) = \dfrac{1}{x}$ admet-elle une limite en $0$ ?`,
      choices: [
        ['a', "Non : les limites à gauche et à droite diffèrent", true],
        ['b', String.raw`Oui, elle vaut $+\infty$`, false],
        ['c', String.raw`Oui, elle vaut $0$`, false],
        ['d', String.raw`Oui, elle vaut $-\infty$`, false],
      ],
      explanation: String.raw`$$\lim_{x \to 0^-} \frac{1}{x} = -\infty \qquad \lim_{x \to 0^+} \frac{1}{x} = +\infty$$

Les deux limites latérales étant différentes, la limite en $0$ **n'existe pas**.

La courbe admet tout de même une asymptote verticale d'équation $x = 0$ : il
suffit qu'**une** limite latérale soit infinie.`,
      difficulty: 2,
    },
    {
      stem: String.raw`$f$ est continue sur $[0,4]$, avec $f(0) = -3$ et $f(4) = 5$. Que peut-on affirmer ?`,
      choices: [
        ['a', String.raw`$f(x)=0$ admet au moins une solution dans $]0,4[$`, true],
        ['b', String.raw`$f(x)=0$ admet exactement une solution`, false],
        ['c', String.raw`$f$ est croissante sur $[0,4]$`, false],
        ['d', 'On ne peut rien affirmer', false],
      ],
      explanation: String.raw`$f$ est continue et $f(0) \times f(4) = -15 < 0$ : le TVI garantit **au moins
une** solution.

« Exactement une » serait faux : sans hypothèse de monotonie, la courbe peut
traverser l'axe trois fois, cinq fois… L'unicité exige que $f$ soit
**strictement monotone**, ce qui se justifie par le signe de $f'$.

Rien n'impose non plus que $f$ soit croissante — seulement qu'elle passe d'une
valeur négative à une valeur positive.`,
      difficulty: 2,
    },
    {
      stem: String.raw`Que vaut $\displaystyle\lim_{x \to +\infty} \frac{\ln x}{x}$ ?`,
      choices: [
        ['a', String.raw`$0$`, true],
        ['b', String.raw`$+\infty$`, false],
        ['c', String.raw`$1$`, false],
        ['d', String.raw`$e$`, false],
      ],
      explanation: String.raw`C'est une **croissance comparée**, à connaître par cœur : $x$ l'emporte
largement sur $\ln x$, donc le quotient tend vers $0$.

La hiérarchie à retenir en $+\infty$ :

$$\ln x \ \ll \ x^n \ \ll \ e^x$$

Le logarithme est écrasé par toute puissance, et toute puissance est écrasée par
l'exponentielle. Ces limites tombent presque chaque année.`,
      difficulty: 2,
    },
    {
      stem: String.raw`La fonction $x \mapsto |x|$ est-elle continue et dérivable en $0$ ?`,
      choices: [
        ['a', 'Continue mais pas dérivable', true],
        ['b', 'Ni continue ni dérivable', false],
        ['c', 'Continue et dérivable', false],
        ['d', 'Dérivable mais pas continue', false],
      ],
      explanation: String.raw`$\lim_{x \to 0} |x| = 0 = |0|$, donc la fonction est bien **continue** en $0$.

En revanche les taux d'accroissement à gauche et à droite valent $-1$ et $+1$ :
ils diffèrent, donc $f$ n'est **pas dérivable** en $0$. Graphiquement, la courbe
présente un point anguleux.

Retiens le sens de l'implication : dérivable $\Rightarrow$ continue, mais jamais
l'inverse.`,
      difficulty: 3,
    },
    {
      stem: String.raw`Que vaut $\displaystyle\lim_{x \to 0} \frac{\sqrt{x+4}-2}{x}$ ?`,
      choices: [
        ['a', String.raw`$\dfrac{1}{4}$`, true],
        ['b', String.raw`$0$`, false],
        ['c', String.raw`$\dfrac{1}{2}$`, false],
        ['d', String.raw`$+\infty$`, false],
      ],
      explanation: String.raw`Forme $\frac{0}{0}$ avec une racine : on multiplie par la quantité conjuguée.

$$\frac{\sqrt{x+4}-2}{x} \times \frac{\sqrt{x+4}+2}{\sqrt{x+4}+2}
= \frac{(x+4)-4}{x\left(\sqrt{x+4}+2\right)} = \frac{1}{\sqrt{x+4}+2}$$

En $0$ cela donne $\dfrac{1}{2+2} = \dfrac{1}{4}$.

Le réflexe : dès qu'une racine crée l'indétermination, le conjugué la fait
disparaître en utilisant $(a-b)(a+b)=a^2-b^2$.`,
      difficulty: 3,
    },
    {
      stem: String.raw`Si $\displaystyle\lim_{x \to +\infty}\left(f(x) - (2x+1)\right) = 0$, que peut-on dire de la courbe de $f$ ?`,
      choices: [
        ['a', String.raw`Elle admet l'asymptote oblique $y = 2x+1$ en $+\infty$`, true],
        ['b', String.raw`Elle admet l'asymptote horizontale $y = 1$`, false],
        ['c', String.raw`Elle admet l'asymptote verticale $x = 2$`, false],
        ['d', String.raw`$f$ est une fonction affine`, false],
      ],
      explanation: String.raw`Par définition, la droite $y = ax+b$ est **asymptote oblique** à la courbe en
$+\infty$ lorsque

$$\lim_{x \to +\infty}\left(f(x)-(ax+b)\right) = 0$$

Ici $a=2$ et $b=1$ : l'asymptote est $y = 2x+1$.

Cela ne signifie pas que $f$ soit affine — seulement que sa courbe se colle à
cette droite quand $x$ devient grand. L'écart tend vers zéro sans forcément
s'annuler.`,
      difficulty: 3,
    },
  ],
}
