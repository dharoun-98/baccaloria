export default {
  slug: 'geometrie-dans-l-espace',
  unit: { slug: 'geometrie', title: 'Géométrie dans l’espace', order: 4, lessonOrder: 1 },
  title: 'Géométrie dans l’espace',
  subtitle:
    'Produit scalaire, produit vectoriel, plans et sphères : un exercice très calculatoire, donc très sûr.',
  difficulty: 2,
  estMinutes: 22,
  examFrequency: 4,
  accessTier: 'premium',
  objectives: [
    'Calculer un produit scalaire et un produit vectoriel, et savoir à quoi ils servent',
    'Écrire l’équation cartésienne d’un plan et d’une sphère',
    'Calculer la distance d’un point à un plan',
    'Étudier la position relative d’un plan et d’une sphère',
  ],
  keyTerms: ['produit scalaire', 'produit vectoriel', 'vecteur normal', 'équation de plan', 'sphère'],

  blocks: [
    {
      kind: 'resume',
      title: "L'essentiel",
      markdown: String.raw`Dans un repère orthonormé, tout se calcule à partir des coordonnées. Deux
opérations structurent le chapitre, et elles ne servent pas à la même chose.

**Produit scalaire** — donne un **nombre**, et sert aux angles et à
l'orthogonalité :

$$\vec{u}\cdot\vec{v} = xx' + yy' + zz'
\qquad
\vec{u}\perp\vec{v} \iff \vec{u}\cdot\vec{v}=0$$

**Produit vectoriel** — donne un **vecteur**, orthogonal aux deux autres :

$$\vec{u}\wedge\vec{v} =
\begin{pmatrix} yz'-zy' \\ zx'-xz' \\ xy'-yx' \end{pmatrix}$$

C'est l'outil pour fabriquer un **vecteur normal** à un plan quand on connaît
deux vecteurs de ce plan. Il donne aussi l'aire :

$$\text{aire}(ABC) = \tfrac12\left\|\overrightarrow{AB}\wedge\overrightarrow{AC}\right\|$$

**Équation d'un plan.** Si $\vec{n}(a,b,c)$ est normal au plan $\mathcal{P}$ :

$$\mathcal{P} : ax+by+cz+d = 0$$

Les coefficients $a$, $b$, $c$ **sont** les coordonnées du vecteur normal — on
lit le vecteur directement dans l'équation, et réciproquement. Le $d$ se trouve
en injectant les coordonnées d'un point connu.`,
    },
    {
      kind: 'formula',
      title: 'Distances et sphères',
      markdown: String.raw`**Distance d'un point à un plan** — la formule la plus utilisée du chapitre :

$$d(A,\mathcal{P}) = \frac{\left|ax_A+by_A+cz_A+d\right|}{\sqrt{a^2+b^2+c^2}}$$

La valeur absolue au numérateur n'est pas décorative : une distance est
positive.

**Sphère** de centre $\Omega(x_0,y_0,z_0)$ et de rayon $R$ :

$$(x-x_0)^2+(y-y_0)^2+(z-z_0)^2 = R^2$$

**Position d'un plan par rapport à une sphère** — on compare la distance du
centre au plan avec le rayon :

| Situation | Intersection |
|---|---|
| $d(\Omega,\mathcal{P}) > R$ | vide |
| $d(\Omega,\mathcal{P}) = R$ | un point (plan tangent) |
| $d(\Omega,\mathcal{P}) < R$ | un cercle |

Dans le dernier cas, le rayon du cercle vaut $r=\sqrt{R^2-d^2}$ par Pythagore,
et son centre est le projeté orthogonal de $\Omega$ sur le plan.`,
    },
    {
      kind: 'method',
      title: 'Trouver l’équation d’un plan',
      markdown: String.raw`**Cas 1 — on connaît un point $A$ et un vecteur normal $\vec{n}(a,b,c)$.**

L'équation est $ax+by+cz+d=0$ ; on trouve $d$ en remplaçant $x$, $y$, $z$ par
les coordonnées de $A$.

**Cas 2 — on connaît trois points $A$, $B$, $C$.**

1. Calculer $\overrightarrow{AB}$ et $\overrightarrow{AC}$.
2. Poser $\vec{n} = \overrightarrow{AB}\wedge\overrightarrow{AC}$.
3. Revenir au cas 1 avec le point $A$.

**Vérification systématique.** Une fois l'équation trouvée, remplace les
coordonnées de $B$ et de $C$ : tu dois obtenir $0$. Deux lignes, et elles
attrapent toute erreur de signe dans le produit vectoriel — qui en produit
beaucoup.`,
    },
    {
      kind: 'example',
      title: 'Exemple traité',
      markdown: String.raw`**Plan passant par $A(1,0,2)$, $B(2,1,0)$ et $C(0,1,1)$.**

$$\overrightarrow{AB}\begin{pmatrix}1\\1\\-2\end{pmatrix}
\qquad
\overrightarrow{AC}\begin{pmatrix}-1\\1\\-1\end{pmatrix}$$

$$\vec{n}=\overrightarrow{AB}\wedge\overrightarrow{AC}
=\begin{pmatrix}1\times(-1)-(-2)\times1\\ (-2)\times(-1)-1\times(-1)\\ 1\times1-1\times(-1)\end{pmatrix}
=\begin{pmatrix}1\\3\\2\end{pmatrix}$$

L'équation est donc $x+3y+2z+d=0$. Avec $A(1,0,2)$ :

$$1+0+4+d=0 \Longrightarrow d=-5$$

$$\mathcal{P}: x+3y+2z-5=0$$

*Vérification.* $B$ : $2+3+0-5=0$ ✓ — $C$ : $0+3+2-5=0$ ✓

*Distance de l'origine.*

$$d(O,\mathcal{P})=\frac{|-5|}{\sqrt{1+9+4}}=\frac{5}{\sqrt{14}}\approx 1{,}34$$`,
    },
    {
      kind: 'pitfall',
      markdown: String.raw`**1. Confondre les deux produits.**
Scalaire → un **nombre**, pour les angles. Vectoriel → un **vecteur**, pour les
normales. Un produit vectoriel qui donne un nombre est une erreur de méthode.

**2. Se tromper de signe dans le produit vectoriel.**
La deuxième coordonnée est $zx'-xz'$, pas $xz'-zx'$. C'est l'erreur la plus
fréquente. D'où la vérification systématique.

**3. Oublier la valeur absolue dans la distance.**
Une distance négative signale une formule mal recopiée.

**4. Croire que $\vec u \wedge \vec v = \vec v \wedge \vec u$.**
Le produit vectoriel est **anticommutatif** : $\vec v\wedge\vec u = -\vec u\wedge\vec v$.
Le plan reste le même, mais la normale change de sens.

**5. Confondre $R$ et $R^2$ dans l'équation de la sphère.**
Le membre de droite est $R^2$. Une sphère de rayon $3$ donne $\dots = 9$.

**6. Oublier que le repère doit être orthonormé.**
Toutes ces formules le supposent. L'énoncé le précise toujours — c'est une
hypothèse, pas une décoration.`,
    },
    {
      kind: 'exam_tip',
      markdown: String.raw`La géométrie dans l'espace vaut en général **3 points**, et c'est l'exercice le
plus **mécanique** de l'épreuve : presque aucun piège de raisonnement, que du
calcul soigneux. Pour un élève qui s'entraîne, c'est du barème quasi garanti.

Enchaînement classique :

1. Calculer $\overrightarrow{AB}\wedge\overrightarrow{AC}$.
2. En déduire l'équation du plan $(ABC)$.
3. Calculer une distance, ou l'aire du triangle.
4. Étudier l'intersection avec une sphère donnée.

**Conseil de copie :** vérifie ton équation de plan en y injectant les autres
points. Cela prend deux lignes et sauve l'exercice entier, puisque toutes les
questions suivantes en dépendent. Une erreur de signe non détectée à la
question 2 fait perdre les questions 3 et 4 aussi.

Soigne aussi la présentation des vecteurs en colonne : les correcteurs suivent
le calcul, et un produit vectoriel écrit en ligne devient illisible.`,
    },
    {
      kind: 'cheatsheet',
      title: 'Fiche mémo',
      markdown: String.raw`**Produits**

$$\vec u\cdot\vec v = xx'+yy'+zz' \qquad \vec u\perp\vec v \iff \vec u\cdot\vec v=0$$

$$\vec u\wedge\vec v=\begin{pmatrix}yz'-zy'\\ zx'-xz'\\ xy'-yx'\end{pmatrix}
\qquad \vec u\wedge\vec v \perp \vec u \text{ et } \vec v$$

**Plan** : $ax+by+cz+d=0$, de vecteur normal $\vec n(a,b,c)$

$$d(A,\mathcal P)=\frac{|ax_A+by_A+cz_A+d|}{\sqrt{a^2+b^2+c^2}}$$

**Sphère** : $(x-x_0)^2+(y-y_0)^2+(z-z_0)^2=R^2$

**Aire** : $\mathcal A_{ABC}=\frac12\left\|\overrightarrow{AB}\wedge\overrightarrow{AC}\right\|$

**Plan ∩ sphère** : comparer $d(\Omega,\mathcal P)$ et $R$ · si $d<R$, cercle de
rayon $\sqrt{R^2-d^2}$`,
    },
  ],

  mindmap: {
    root: {
      label: 'Géométrie dans l’espace',
      children: [
        {
          label: 'Produit scalaire',
          children: [
            { label: 'u·v = xx′ + yy′ + zz′ → un NOMBRE' },
            { label: 'Nul ⟺ vecteurs orthogonaux' },
          ],
        },
        {
          label: 'Produit vectoriel',
          children: [
            { label: 'Donne un VECTEUR normal aux deux' },
            { label: 'Anticommutatif : v∧u = −u∧v' },
            { label: 'Aire ABC = ½‖AB ∧ AC‖' },
          ],
        },
        {
          label: 'Plan',
          children: [
            { label: 'ax + by + cz + d = 0' },
            { label: 'n(a, b, c) se lit dans l’équation' },
            { label: '3 points → produit vectoriel → n' },
            { label: 'Toujours vérifier avec B et C' },
          ],
        },
        {
          label: 'Distances et sphère',
          children: [
            { label: 'd = |ax+by+cz+d| / √(a²+b²+c²)' },
            { label: 'Sphère : (x−x₀)² + … = R²' },
            { label: 'd > R vide · d = R tangent · d < R cercle' },
          ],
        },
      ],
    },
  },

  questions: [
    {
      stem: String.raw`Que vaut $\vec{u}(1,2,3)\cdot\vec{v}(4,-1,2)$ ?`,
      choices: [
        ['a', String.raw`$8$`, true],
        ['b', String.raw`$(4,-2,6)$`, false],
        ['c', String.raw`$0$`, false],
        ['d', String.raw`$14$`, false],
      ],
      explanation: String.raw`$$\vec u\cdot\vec v = 1\times4 + 2\times(-1) + 3\times2 = 4-2+6 = 8$$

Le produit scalaire donne un **nombre**, jamais un vecteur : la réponse b) est
le produit coordonnée par coordonnée, qui n'est pas une opération du programme.

Le résultat n'étant pas nul, les deux vecteurs ne sont pas orthogonaux.`,
      difficulty: 1,
    },
    {
      stem: String.raw`Quel est un vecteur normal au plan $2x-3y+z-7=0$ ?`,
      choices: [
        ['a', String.raw`$\vec{n}(2,-3,1)$`, true],
        ['b', String.raw`$\vec{n}(2,-3,-7)$`, false],
        ['c', String.raw`$\vec{n}(-7,2,-3)$`, false],
        ['d', String.raw`$\vec{n}(2,3,1)$`, false],
      ],
      explanation: String.raw`Dans $ax+by+cz+d=0$, les coefficients $a$, $b$, $c$ **sont** les coordonnées
du vecteur normal : ici $\vec n(2,-3,1)$.

Le terme constant $d=-7$ n'en fait pas partie — il positionne le plan dans
l'espace, il ne donne pas sa direction. Deux plans parallèles ont le même
$\vec n$ et des $d$ différents.

Attention aussi au signe : $-3$, pas $3$.`,
      difficulty: 1,
    },
    {
      stem: String.raw`Quelle est la distance du point $A(1,1,1)$ au plan $x+y+z-6=0$ ?`,
      choices: [
        ['a', String.raw`$\sqrt{3}$`, true],
        ['b', String.raw`$3$`, false],
        ['c', String.raw`$-\sqrt{3}$`, false],
        ['d', String.raw`$\dfrac{1}{\sqrt3}$`, false],
      ],
      explanation: String.raw`$$d=\frac{|1+1+1-6|}{\sqrt{1^2+1^2+1^2}}=\frac{|-3|}{\sqrt3}=\frac{3}{\sqrt3}=\sqrt3$$

Deux points de vigilance : la valeur absolue au numérateur (sans elle on
obtiendrait $-\sqrt3$, ce qui n'a aucun sens pour une distance), et la
simplification $\frac{3}{\sqrt3}=\sqrt3$.

Répondre $3$ revient à oublier le dénominateur, c'est-à-dire à supposer le
vecteur normal unitaire.`,
      difficulty: 2,
    },
    {
      stem: String.raw`Une sphère a pour centre $\Omega(0,0,0)$ et rayon $5$. Un plan est à distance $5$ du centre. Leur intersection est :`,
      choices: [
        ['a', 'un point — le plan est tangent', true],
        ['b', 'un cercle de rayon 5', false],
        ['c', 'vide', false],
        ['d', 'la sphère entière', false],
      ],
      explanation: String.raw`On compare $d(\Omega,\mathcal P)$ et $R$. Ici $d = R = 5$ : le plan **effleure**
la sphère en un seul point. Il est **tangent**.

Les trois cas à connaître :

- $d>R$ : le plan passe à côté, intersection vide
- $d=R$ : tangent, un point
- $d<R$ : le plan coupe la sphère selon un cercle de rayon $\sqrt{R^2-d^2}$

Vérifie la cohérence avec la dernière formule : pour $d=R$, on obtient un
cercle de rayon $\sqrt{R^2-R^2}=0$, c'est-à-dire un point. ✓`,
      difficulty: 2,
    },
    {
      stem: String.raw`Que vaut $\vec{u}(1,0,0)\wedge\vec{v}(0,1,0)$ ?`,
      choices: [
        ['a', String.raw`$(0,0,1)$`, true],
        ['b', String.raw`$(0,0,-1)$`, false],
        ['c', String.raw`$0$`, false],
        ['d', String.raw`$(1,1,0)$`, false],
      ],
      explanation: String.raw`Avec la formule, $\vec u\wedge\vec v = (0\times0-0\times1,\ 0\times0-1\times0,\ 1\times1-0\times0) = (0,0,1)$.

Ce sont les vecteurs $\vec\imath$ et $\vec\jmath$ du repère : leur produit
vectoriel est $\vec k$. Le résultat est bien orthogonal aux deux, comme attendu.

Note que $\vec v\wedge\vec u$ donnerait $(0,0,-1)$ : le produit vectoriel est
**anticommutatif**, l'ordre change le sens du vecteur obtenu.`,
      difficulty: 2,
    },
    {
      stem: String.raw`Pour trouver l'équation du plan passant par trois points $A$, $B$, $C$, quelle est la première étape ?`,
      choices: [
        ['a', String.raw`Calculer $\overrightarrow{AB}\wedge\overrightarrow{AC}$`, true],
        ['b', String.raw`Calculer $\overrightarrow{AB}\cdot\overrightarrow{AC}$`, false],
        ['c', 'Calculer la distance $AB$', false],
        ['d', 'Résoudre un système de trois équations', false],
      ],
      explanation: String.raw`Il faut un **vecteur normal**, et le produit vectoriel de deux vecteurs du plan
en fournit un directement : $\vec n = \overrightarrow{AB}\wedge\overrightarrow{AC}$
est orthogonal aux deux, donc au plan entier.

Le produit **scalaire** donnerait un nombre, inutilisable comme normale.

Le système de trois équations fonctionne aussi mais demande trois fois plus de
calculs pour le même résultat — et davantage d'occasions de se tromper.

Ensuite : injecter les coordonnées de $A$ pour trouver $d$, puis vérifier avec
$B$ et $C$.`,
      difficulty: 2,
    },
  ],
}
