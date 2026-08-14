export default {
  slug: 'equations-differentielles',
  unit: { slug: 'analyse', title: 'Analyse', order: 1, lessonOrder: 7 },
  title: 'Équations différentielles',
  subtitle:
    "Le chapitre le plus rentable du programme : peu de contenu, un barème quasi automatique, et il tombe aussi en physique.",
  difficulty: 2,
  estMinutes: 16,
  examFrequency: 4,
  accessTier: 'premium',
  objectives: [
    'Résoudre $y\' = ay$ et $y\' = ay + b$',
    'Résoudre $y\'\' + \\omega^{2}y = 0$',
    'Déterminer la solution vérifiant une condition initiale',
    'Faire le lien avec la décroissance radioactive et le circuit RC',
  ],
  keyTerms: ['équation différentielle', 'condition initiale', 'solution générale'],

  blocks: [
    {
      kind: 'resume',
      title: "L'essentiel",
      markdown: String.raw`Une **équation différentielle** est une équation dont l'inconnue est une
*fonction*, et qui fait intervenir ses dérivées. Résoudre, c'est trouver toutes
les fonctions qui la vérifient.

Le programme de PC se limite à trois formes, et elles se traitent par
application directe d'une formule.

**1. $y' = ay$**

$$y(x) = C\,e^{\,ax} \qquad (C \in \mathbb{R})$$

**2. $y' = ay + b$** (avec $a \neq 0$)

$$y(x) = C\,e^{\,ax} - \frac{b}{a}$$

Le terme $-\frac{b}{a}$ est la **solution constante** : c'est la valeur qui
annule $ay+b$. La solution générale est donc « exponentielle + constante
d'équilibre ».

**3. $y'' + \omega^{2}y = 0$**

$$y(x) = A\cos(\omega x) + B\sin(\omega x)$$

que l'on peut aussi écrire $y(x) = A_m\cos(\omega x + \varphi)$ — la forme
qu'utilise la physique pour un oscillateur.

Dans les trois cas, les constantes se déterminent avec les **conditions
initiales** fournies par l'énoncé.`,
    },
    {
      kind: 'method',
      title: 'Utiliser la condition initiale',
      markdown: String.raw`La solution générale contient une ou deux constantes. L'énoncé donne toujours
de quoi les fixer.

1. Écris la solution générale avec sa constante.
2. Remplace $x$ par la valeur donnée.
3. Résous pour trouver $C$.
4. Réécris la solution **particulière**, sans constante indéterminée.

*Exemple.* Résoudre $y' = 3y$ avec $y(0)=5$.

Solution générale : $y(x) = Ce^{3x}$.
Condition : $y(0) = Ce^{0} = C = 5$.
Solution particulière : $y(x) = 5e^{3x}$.

Pour une équation du second ordre il faut **deux** conditions — typiquement
$y(0)$ et $y'(0)$ — puisqu'il y a deux constantes.`,
    },
    {
      kind: 'example',
      title: 'Avec second membre',
      markdown: String.raw`**Résoudre $y' = -2y + 6$ avec $y(0) = 1$.**

Ici $a=-2$ et $b=6$, donc $-\frac{b}{a} = -\frac{6}{-2} = 3$.

Solution générale :

$$y(x) = Ce^{-2x} + 3$$

Condition initiale : $y(0) = C + 3 = 1$, donc $C = -2$.

$$y(x) = -2e^{-2x} + 3$$

*Vérification.* $y'(x) = 4e^{-2x}$, et $-2y+6 = -2(-2e^{-2x}+3)+6 = 4e^{-2x}$. ✓

Remarque que $y(x) \to 3$ quand $x \to +\infty$ : la solution tend vers la
valeur d'équilibre. C'est exactement le comportement d'un condensateur qui se
charge vers sa tension finale.`,
    },
    {
      kind: 'exam_tip',
      markdown: String.raw`C'est **le meilleur rapport effort / points** de tout le programme. Le contenu
tient en trois formules, l'exercice est court, et le barème est mécanique.

Il tombe aussi dans l'épreuve de **physique**, sous un autre vocabulaire :

- **Décroissance radioactive** : $\frac{dN}{dt} = -\lambda N$ donne
  $N(t) = N_0 e^{-\lambda t}$. C'est $y'=ay$.
- **Charge d'un condensateur (RC)** : $\frac{du}{dt} = -\frac{1}{RC}u + \frac{E}{RC}$
  donne $u(t) = E\left(1-e^{-t/RC}\right)$. C'est $y'=ay+b$.
- **Oscillateur harmonique** : $\ddot{x} + \omega_0^{2}x = 0$. C'est la
  troisième forme.

Apprendre ce chapitre une fois te sert donc dans **deux épreuves**. Si tu dois
choisir quoi réviser la veille, c'est celui-là.

**Conseil de copie :** vérifie toujours ta solution en la redérivant. Trois
lignes, et cela transforme une réponse incertaine en réponse sûre.`,
    },
    {
      kind: 'pitfall',
      markdown: String.raw`**1. Oublier la constante $C$.**
Sans elle, tu donnes *une* solution au lieu de **toutes** les solutions. La
question demande presque toujours l'ensemble des solutions.

**2. Se tromper de signe sur $-\frac{b}{a}$.**
Pour $y'=-2y+6$ : $-\frac{6}{-2} = +3$. Une erreur de signe ici fausse tout.

**3. Confondre $y'=ay$ et $y'=ax$.**
La première est différentielle, la seconde est une simple primitive.

**4. N'utiliser qu'une condition pour une équation du second ordre.**
Deux constantes exigent deux conditions.

**5. Écrire $y = e^{ax} + C$.**
La constante **multiplie** l'exponentielle, elle ne s'ajoute pas :
$y = Ce^{ax}$.`,
    },
    {
      kind: 'cheatsheet',
      title: 'Fiche mémo',
      markdown: String.raw`| Équation | Solutions |
|---|---|
| $y'=ay$ | $y=Ce^{\,ax}$ |
| $y'=ay+b$ | $y=Ce^{\,ax}-\frac{b}{a}$ |
| $y''+\omega^{2}y=0$ | $y=A\cos(\omega x)+B\sin(\omega x)$ |

**Marche à suivre**

1. Identifier la forme et les coefficients $a$, $b$ ou $\omega$
2. Écrire la solution générale
3. Appliquer la ou les conditions initiales
4. Vérifier en redérivant

**Correspondances physique**

- $\frac{dN}{dt}=-\lambda N$ → radioactivité
- $\frac{du}{dt}=-\frac{u}{RC}+\frac{E}{RC}$ → circuit RC
- $\ddot{x}+\omega_0^{2}x=0$ → oscillateur harmonique`,
    },
  ],

  mindmap: {
    root: {
      label: 'Équations différentielles',
      children: [
        {
          label: "y' = ay",
          children: [{ label: 'y = C·e^(ax)' }, { label: 'Radioactivité' }],
        },
        {
          label: "y' = ay + b",
          children: [
            { label: 'y = C·e^(ax) − b/a' },
            { label: '−b/a = valeur d’équilibre' },
            { label: 'Circuit RC' },
          ],
        },
        {
          label: "y'' + ω²y = 0",
          children: [
            { label: 'y = A cos(ωx) + B sin(ωx)' },
            { label: 'Oscillateur harmonique' },
            { label: 'Deux conditions nécessaires' },
          ],
        },
        {
          label: 'Méthode',
          children: [
            { label: '1. Identifier la forme' },
            { label: '2. Solution générale avec C' },
            { label: '3. Conditions initiales' },
            { label: '4. Vérifier en redérivant' },
          ],
        },
      ],
    },
  },

  questions: [
    {
      stem: String.raw`Quelles sont les solutions de $y' = 5y$ ?`,
      choices: [
        ['a', String.raw`$y = Ce^{5x}$`, true],
        ['b', String.raw`$y = e^{5x} + C$`, false],
        ['c', String.raw`$y = 5e^{x}$`, false],
        ['d', String.raw`$y = \dfrac{5x^{2}}{2}$`, false],
      ],
      explanation: String.raw`Forme $y'=ay$ avec $a=5$, donc $y = Ce^{5x}$.

L'erreur la plus fréquente est $e^{5x}+C$ : la constante **multiplie**
l'exponentielle, elle ne s'y ajoute pas.

Vérification : $\left(Ce^{5x}\right)' = 5Ce^{5x} = 5y$. ✓ Alors qu'avec
$e^{5x}+C$ on obtiendrait $5e^{5x} \neq 5y$.`,
      difficulty: 1,
    },
    {
      stem: String.raw`Quelle est la solution de $y' = 2y$ vérifiant $y(0) = 7$ ?`,
      choices: [
        ['a', String.raw`$y = 7e^{2x}$`, true],
        ['b', String.raw`$y = 2e^{7x}$`, false],
        ['c', String.raw`$y = e^{2x}+7$`, false],
        ['d', String.raw`$y = 7e^{x}$`, false],
      ],
      explanation: String.raw`Solution générale $y = Ce^{2x}$. La condition donne :

$$y(0) = Ce^{0} = C = 7$$

D'où $y = 7e^{2x}$.

La constante se lit directement quand la condition est donnée en $0$, puisque
$e^{0}=1$. C'est presque toujours le cas dans les énoncés.`,
      difficulty: 1,
    },
    {
      stem: String.raw`Quelles sont les solutions de $y' = -3y + 6$ ?`,
      choices: [
        ['a', String.raw`$y = Ce^{-3x} + 2$`, true],
        ['b', String.raw`$y = Ce^{-3x} - 2$`, false],
        ['c', String.raw`$y = Ce^{-3x} + 6$`, false],
        ['d', String.raw`$y = Ce^{3x} + 2$`, false],
      ],
      explanation: String.raw`Forme $y'=ay+b$ avec $a=-3$ et $b=6$ :

$$-\frac{b}{a} = -\frac{6}{-3} = +2$$

Donc $y = Ce^{-3x} + 2$.

Le double signe négatif est le piège : $-\frac{b}{a}$ avec $a$ négatif donne un
résultat **positif**.

Vérification : $y' = -3Ce^{-3x}$ et $-3y+6 = -3Ce^{-3x}-6+6 = -3Ce^{-3x}$. ✓`,
      difficulty: 2,
    },
    {
      stem: String.raw`Quelles sont les solutions de $y'' + 9y = 0$ ?`,
      choices: [
        ['a', String.raw`$y = A\cos(3x) + B\sin(3x)$`, true],
        ['b', String.raw`$y = A\cos(9x) + B\sin(9x)$`, false],
        ['c', String.raw`$y = Ce^{9x}$`, false],
        ['d', String.raw`$y = Ce^{-9x}$`, false],
      ],
      explanation: String.raw`La forme est $y''+\omega^{2}y=0$ avec $\omega^{2}=9$, donc $\omega = 3$ — pas
$9$.

$$y = A\cos(3x) + B\sin(3x)$$

L'erreur classique est de recopier le coefficient de l'équation dans le cosinus.
Il faut prendre sa **racine carrée**.

En physique, $\omega$ est la pulsation et la période vaut
$T=\frac{2\pi}{\omega}$ : confondre $\omega$ et $\omega^2$ fausse aussi tout le
calcul de période.`,
      difficulty: 2,
    },
    {
      stem: String.raw`En radioactivité, $\frac{dN}{dt} = -\lambda N$ donne :`,
      choices: [
        ['a', String.raw`$N(t) = N_0 e^{-\lambda t}$`, true],
        ['b', String.raw`$N(t) = N_0 e^{\lambda t}$`, false],
        ['c', String.raw`$N(t) = N_0 - \lambda t$`, false],
        ['d', String.raw`$N(t) = \dfrac{N_0}{\lambda t}$`, false],
      ],
      explanation: String.raw`C'est exactement $y'=ay$ avec $a=-\lambda$, donc $N(t)=Ce^{-\lambda t}$. La
condition $N(0)=N_0$ donne $C=N_0$ :

$$N(t) = N_0 e^{-\lambda t}$$

L'exposant est **négatif** : le nombre de noyaux décroît. Un exposant positif
décrirait une population qui explose, ce qui n'a aucun sens physique — c'est un
bon contrôle de cohérence.

Même équation, deux épreuves : réviser ce chapitre te rapporte deux fois.`,
      difficulty: 2,
    },
    {
      stem: String.raw`Combien de conditions initiales faut-il pour déterminer complètement la solution de $y''+\omega^{2}y=0$ ?`,
      choices: [
        ['a', 'Deux', true],
        ['b', 'Une', false],
        ['c', 'Aucune', false],
        ['d', 'Trois', false],
      ],
      explanation: String.raw`La solution générale $y = A\cos(\omega x)+B\sin(\omega x)$ contient **deux**
constantes, il faut donc deux informations pour les fixer — typiquement $y(0)$
et $y'(0)$.

Règle générale : le nombre de conditions nécessaires égale l'**ordre** de
l'équation. Une équation du premier ordre a une constante et demande une
condition ; une du second ordre en demande deux.

En physique, cela correspond à la position initiale et à la vitesse initiale de
l'oscillateur.`,
      difficulty: 2,
    },
  ],
}
