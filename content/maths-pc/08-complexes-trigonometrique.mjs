export default {
  slug: 'nombres-complexes-forme-trigonometrique',
  unit: { slug: 'nombres-complexes', title: 'Nombres complexes', order: 2, lessonOrder: 2 },
  title: 'Forme trigonométrique et applications géométriques',
  subtitle:
    "La deuxième moitié du chapitre : passer à l'écriture polaire, et s'en servir pour faire de la géométrie.",
  difficulty: 3,
  estMinutes: 24,
  examFrequency: 5,
  accessTier: 'premium',
  objectives: [
    'Écrire un complexe sous forme trigonométrique et exponentielle',
    'Calculer un module et un argument, et exploiter leurs propriétés',
    'Appliquer la formule de Moivre et les formules d’Euler',
    'Interpréter un quotient de complexes pour déterminer la nature d’un triangle',
  ],
  keyTerms: ['argument', 'forme exponentielle', 'Moivre', 'rotation', 'affixe'],

  blocks: [
    {
      kind: 'resume',
      title: "L'essentiel",
      markdown: String.raw`Tout complexe non nul s'écrit à partir de deux informations géométriques : sa
**distance à l'origine** et l'**angle** qu'il fait avec l'axe des réels.

$$z = r\left(\cos\theta + i\sin\theta\right) = r\,e^{\,i\theta}$$

- $r = |z|$ est le **module**, toujours strictement positif ici
- $\theta = \arg(z)$ est l'**argument**, défini **modulo $2\pi$**

Le passage depuis la forme algébrique $z = a+ib$ :

$$r = \sqrt{a^2+b^2}
\qquad
\cos\theta = \frac{a}{r}
\qquad
\sin\theta = \frac{b}{r}$$

Il faut les **deux** lignes trigonométriques pour placer $\theta$ : le cosinus
seul laisse deux angles possibles. C'est le sinus qui tranche entre les deux.

**Pourquoi cette écriture change tout.** En forme algébrique, multiplier deux
complexes est pénible. En forme exponentielle, c'est immédiat :

$$z_1 z_2 = r_1 r_2\, e^{\,i(\theta_1+\theta_2)}
\qquad
\frac{z_1}{z_2} = \frac{r_1}{r_2}\, e^{\,i(\theta_1-\theta_2)}$$

**Les modules se multiplient, les arguments s'additionnent.** Multiplier par un
complexe, c'est donc composer une homothétie et une rotation — d'où toute la
partie géométrique du chapitre.`,
    },
    {
      kind: 'formula',
      title: 'Moivre et Euler',
      markdown: String.raw`**Formule de Moivre** — pour élever à une puissance :

$$\left(\cos\theta + i\sin\theta\right)^{n} = \cos(n\theta) + i\sin(n\theta)
\qquad\text{soit}\qquad
\left(re^{\,i\theta}\right)^{n} = r^{\,n}e^{\,in\theta}$$

**Formules d'Euler** — pour repasser aux fonctions trigonométriques :

$$\cos\theta = \frac{e^{\,i\theta}+e^{-i\theta}}{2}
\qquad
\sin\theta = \frac{e^{\,i\theta}-e^{-i\theta}}{2i}$$

Calculer $(1+i)^{12}$ en développant serait absurde. En passant par
$1+i = \sqrt{2}\,e^{\,i\pi/4}$ :

$$(1+i)^{12} = \left(\sqrt{2}\right)^{12} e^{\,i\,12\pi/4} = 64\,e^{\,3i\pi} = -64$$

Trois lignes au lieu d'un binôme de Newton.`,
    },
    {
      kind: 'method',
      title: 'Géométrie avec les complexes',
      markdown: String.raw`À tout point $M$ du plan on associe son **affixe** $z_M$. Les distances et les
angles se lisent alors sur des complexes.

$$AB = |z_B - z_A|
\qquad\qquad
\left(\overrightarrow{AB},\overrightarrow{AC}\right) = \arg\!\left(\frac{z_C-z_A}{z_B-z_A}\right)$$

Le quotient $\dfrac{z_C-z_A}{z_B-z_A}$ est **la** question type de l'examen. Son
module et son argument donnent la nature du triangle $ABC$ :

| Le quotient vaut | Le triangle $ABC$ est |
|---|---|
| un réel | $A$, $B$, $C$ alignés |
| un imaginaire pur | rectangle en $A$ |
| de module $1$ | isocèle en $A$ |
| $e^{\,i\pi/3}$ ou $e^{-i\pi/3}$ | équilatéral |
| $\pm i$ | rectangle **et** isocèle en $A$ |

**Rotation** de centre $\Omega$ (affixe $\omega$) et d'angle $\alpha$ :

$$z' - \omega = e^{\,i\alpha}\left(z-\omega\right)$$`,
    },
    {
      kind: 'example',
      title: 'Exemple traité',
      markdown: String.raw`**Écrire $z = 1 + i\sqrt{3}$ sous forme exponentielle.**

*Module.* $r = \sqrt{1^2 + (\sqrt{3})^2} = \sqrt{4} = 2$

*Argument.* $\cos\theta = \dfrac{1}{2}$ et $\sin\theta = \dfrac{\sqrt{3}}{2}$.

Le cosinus seul autoriserait $\theta = \pm\frac{\pi}{3}$. Le sinus étant
**positif**, on retient $\theta = \dfrac{\pi}{3}$.

$$z = 2\,e^{\,i\pi/3}$$

*Application.* $z^{6} = 2^{6}e^{\,i\,6\pi/3} = 64\,e^{\,2i\pi} = 64$.

Le résultat est réel : cohérent, puisque $6\theta$ est un multiple de $2\pi$.`,
    },
    {
      kind: 'pitfall',
      markdown: String.raw`**1. Déterminer $\theta$ avec le seul cosinus.**
$\cos\theta = \frac12$ donne $\theta = \frac{\pi}{3}$ **ou** $-\frac{\pi}{3}$.
Sans le signe du sinus, tu as une chance sur deux.

**2. Oublier « modulo $2\pi$ ».**
Un argument n'est pas un nombre unique. L'écrire sans le modulo est compté
comme faux dans une rédaction rigoureuse.

**3. Chercher l'argument de $0$.**
$z=0$ a un module nul et **aucun argument**. Toute division par $z_B - z_A$
suppose $A \neq B$ : la vérification est attendue.

**4. Confondre $\arg(z_1 z_2)$ et $\arg(z_1)\arg(z_2)$.**
Les arguments s'**additionnent**, ils ne se multiplient pas.

**5. Inverser le quotient géométrique.**
Pour l'angle en $A$, c'est $\dfrac{z_C-z_A}{z_B-z_A}$ : le sommet de l'angle est
au dénominateur **et** au numérateur, en position de soustrait.

**6. Écrire $r$ négatif.**
Un module est positif. Si un calcul donne $-2e^{i\theta}$, il faut absorber le
signe : $-1 = e^{\,i\pi}$, donc $-2e^{i\theta} = 2e^{\,i(\theta+\pi)}$.`,
    },
    {
      kind: 'exam_tip',
      markdown: String.raw`L'exercice de complexes vaut **3 à 4 points** et suit un scénario très stable :

1. Résoudre une équation du second degré (partie algébrique, déjà vue).
2. Écrire les solutions sous forme trigonométrique ou exponentielle.
3. Calculer une puissance avec Moivre.
4. Interpréter géométriquement : nature d'un triangle, ou image par une rotation.

La question 4 est celle qui départage. Elle se traite presque toujours en
calculant $\dfrac{z_C-z_A}{z_B-z_A}$ puis en lisant module et argument.

**Conseil de copie :** fais une figure, même approximative. Elle ne rapporte pas
de points directement, mais elle t'évite de conclure « équilatéral » quand le
calcul dit « rectangle isocèle ». Et quand tu conclus, cite le critère :
« le quotient est un imaginaire pur, donc le triangle est rectangle en $A$ ».`,
    },
    {
      kind: 'cheatsheet',
      title: 'Fiche mémo',
      markdown: String.raw`**Conversions**

$$r=\sqrt{a^2+b^2}
\qquad \cos\theta=\frac{a}{r} \qquad \sin\theta=\frac{b}{r}$$

$$a = r\cos\theta \qquad b = r\sin\theta$$

**Opérations** (modules × , arguments +)

$$|z_1z_2|=|z_1||z_2| \qquad \arg(z_1z_2)=\arg z_1+\arg z_2 \ [2\pi]$$

$$\left(re^{i\theta}\right)^n = r^n e^{in\theta} \qquad \overline{re^{i\theta}} = re^{-i\theta}$$

**Angles usuels**

| $\theta$ | $0$ | $\frac{\pi}{6}$ | $\frac{\pi}{4}$ | $\frac{\pi}{3}$ | $\frac{\pi}{2}$ |
|---|---|---|---|---|---|
| $\cos$ | $1$ | $\frac{\sqrt3}{2}$ | $\frac{\sqrt2}{2}$ | $\frac12$ | $0$ |
| $\sin$ | $0$ | $\frac12$ | $\frac{\sqrt2}{2}$ | $\frac{\sqrt3}{2}$ | $1$ |

**Géométrie** : $AB=|z_B-z_A|$ · rotation $z'-\omega=e^{i\alpha}(z-\omega)$`,
    },
  ],

  mindmap: {
    root: {
      label: 'Forme trigonométrique',
      children: [
        {
          label: 'Écriture',
          children: [
            { label: 'z = r(cos θ + i sin θ) = r·e^(iθ)' },
            { label: 'r = |z|, θ = arg(z) modulo 2π' },
            { label: 'cos ET sin pour fixer θ' },
          ],
        },
        {
          label: 'Opérations',
          children: [
            { label: 'Modules ×, arguments +' },
            { label: 'Moivre : (re^iθ)ⁿ = rⁿ e^(inθ)' },
            { label: 'Euler : cos θ = (e^iθ + e^−iθ)/2' },
          ],
        },
        {
          label: 'Géométrie',
          children: [
            { label: 'AB = |z_B − z_A|' },
            { label: 'Angle en A = arg((z_C−z_A)/(z_B−z_A))' },
            { label: 'Rotation : z′ − ω = e^(iα)(z − ω)' },
          ],
        },
        {
          label: 'Nature du triangle',
          children: [
            { label: 'Réel → alignés' },
            { label: 'Imaginaire pur → rectangle en A' },
            { label: 'Module 1 → isocèle en A' },
            { label: '±i → rectangle isocèle' },
          ],
        },
      ],
    },
  },

  questions: [
    {
      stem: String.raw`Quel est le module de $z = 3e^{\,i\pi/4}$ ?`,
      choices: [
        ['a', String.raw`$3$`, true],
        ['b', String.raw`$\dfrac{\pi}{4}$`, false],
        ['c', String.raw`$3\pi/4$`, false],
        ['d', String.raw`$1$`, false],
      ],
      explanation: String.raw`En écriture $z = re^{\,i\theta}$, le facteur devant l'exponentielle **est** le
module : $r = 3$. L'exposant donne l'argument, ici $\frac{\pi}{4}$.

C'est tout l'intérêt de cette forme : module et argument se lisent
directement, sans aucun calcul.`,
      difficulty: 1,
    },
    {
      stem: String.raw`Si $|z_1|=2$, $|z_2|=5$, $\arg z_1=\frac{\pi}{6}$ et $\arg z_2=\frac{\pi}{3}$, que vaut $z_1z_2$ ?`,
      choices: [
        ['a', String.raw`$10\,e^{\,i\pi/2}$`, true],
        ['b', String.raw`$7\,e^{\,i\pi/2}$`, false],
        ['c', String.raw`$10\,e^{\,i\pi^2/18}$`, false],
        ['d', String.raw`$2{,}5\,e^{\,i\pi/6}$`, false],
      ],
      explanation: String.raw`Les modules se **multiplient**, les arguments s'**additionnent** :

$$|z_1z_2| = 2\times 5 = 10
\qquad
\arg(z_1z_2) = \frac{\pi}{6}+\frac{\pi}{3} = \frac{\pi}{2}$$

D'où $z_1z_2 = 10\,e^{\,i\pi/2} = 10i$.

Les deux erreurs classiques : additionner les modules ($7$), ou multiplier les
arguments.`,
      difficulty: 2,
    },
    {
      stem: String.raw`Quelle est la forme exponentielle de $z = -1$ ?`,
      choices: [
        ['a', String.raw`$e^{\,i\pi}$`, true],
        ['b', String.raw`$-e^{\,i\pi}$`, false],
        ['c', String.raw`$e^{-i\pi/2}$`, false],
        ['d', String.raw`$1$`, false],
      ],
      explanation: String.raw`$|-1| = 1$, et le point d'affixe $-1$ est sur l'axe des réels du côté négatif,
donc $\arg(-1) = \pi$.

$$-1 = e^{\,i\pi}$$

C'est la célèbre identité d'Euler $e^{\,i\pi}+1=0$.

Un module ne peut jamais être négatif : la réponse $-e^{i\pi}$ est mal écrite,
même si elle vaut numériquement $-(-1)=1$.`,
      difficulty: 2,
    },
    {
      stem: String.raw`Que vaut $\left(2e^{\,i\pi/6}\right)^{3}$ ?`,
      choices: [
        ['a', String.raw`$8\,e^{\,i\pi/2}$`, true],
        ['b', String.raw`$6\,e^{\,i\pi/2}$`, false],
        ['c', String.raw`$8\,e^{\,i\pi/18}$`, false],
        ['d', String.raw`$2\,e^{\,i\pi/2}$`, false],
      ],
      explanation: String.raw`Formule de Moivre : le module est élevé à la puissance, l'argument est
**multiplié** par l'exposant.

$$\left(2e^{\,i\pi/6}\right)^{3} = 2^{3}\,e^{\,i\times 3\pi/6} = 8\,e^{\,i\pi/2} = 8i$$

Erreurs à éviter : multiplier le module par $3$ au lieu de l'élever au cube, ou
diviser l'argument par $3$.`,
      difficulty: 2,
    },
    {
      stem: String.raw`Si $\dfrac{z_C-z_A}{z_B-z_A}$ est un **imaginaire pur**, que peut-on dire du triangle $ABC$ ?`,
      choices: [
        ['a', String.raw`Il est rectangle en $A$`, true],
        ['b', String.raw`Il est isocèle en $A$`, false],
        ['c', String.raw`Il est équilatéral`, false],
        ['d', String.raw`$A$, $B$, $C$ sont alignés`, false],
      ],
      explanation: String.raw`L'argument de ce quotient est l'angle $\left(\overrightarrow{AB},\overrightarrow{AC}\right)$.

Un imaginaire pur a pour argument $\pm\frac{\pi}{2}$ : l'angle en $A$ est droit,
donc le triangle est **rectangle en $A$**.

À distinguer du module, qui donne les longueurs : $\left|\frac{z_C-z_A}{z_B-z_A}\right| = \frac{AC}{AB}$,
et vaut $1$ pour un triangle isocèle en $A$.

Si le quotient vaut exactement $\pm i$, on a les deux : rectangle **et** isocèle.`,
      difficulty: 3,
    },
    {
      stem: String.raw`Pour $z = 1+i\sqrt{3}$, on a $\cos\theta=\frac12$. Pourquoi ne suffit-il pas à conclure $\theta=\frac{\pi}{3}$ ?`,
      choices: [
        ['a', String.raw`Parce que $\cos\left(-\frac{\pi}{3}\right)$ vaut aussi $\frac12$`, true],
        ['b', String.raw`Parce que le module n'est pas encore calculé`, false],
        ['c', String.raw`Parce que $\frac{\pi}{3}$ n'est pas un angle usuel`, false],
        ['d', "Il suffit, en réalité", false],
      ],
      explanation: String.raw`Le cosinus ne distingue pas un angle de son opposé :
$\cos\frac{\pi}{3} = \cos\left(-\frac{\pi}{3}\right) = \frac12$.

C'est le **sinus** qui tranche. Ici $\sin\theta = \frac{\sqrt3}{2} > 0$, donc
$\theta = \frac{\pi}{3}$ et non $-\frac{\pi}{3}$.

Dans une copie, écris toujours les deux lignes. N'en donner qu'une laisse
l'argument indéterminé au signe près, et le correcteur le sanctionne.`,
      difficulty: 3,
    },
  ],
}
