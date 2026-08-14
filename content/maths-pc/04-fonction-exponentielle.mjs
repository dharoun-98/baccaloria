export default {
  slug: 'fonction-exponentielle',
  unit: { slug: 'analyse', title: 'Analyse', order: 1, lessonOrder: 4 },
  title: 'Fonction exponentielle',
  subtitle:
    "La fonction qui est sa propre dérivée — et celle qui écrase toutes les autres à l'infini.",
  difficulty: 2,
  estMinutes: 20,
  examFrequency: 5,
  accessTier: 'premium',
  objectives: [
    'Connaître le domaine, les limites et les variations de $\\exp$',
    'Utiliser les propriétés algébriques de l’exponentielle',
    'Résoudre équations et inéquations avec $e^x$',
    'Dériver une fonction composée du type $e^{u}$',
  ],
  keyTerms: ['exponentielle', 'réciproque', 'croissance comparée', 'strictement positive'],

  blocks: [
    {
      kind: 'resume',
      title: "L'essentiel",
      markdown: String.raw`La fonction **exponentielle** $x \mapsto e^x$ est définie sur $\mathbb{R}$ tout
entier, et c'est la réciproque du logarithme :

$$\ln(e^x) = x \ \ (x \in \mathbb{R}) \qquad\qquad e^{\ln x} = x \ \ (x > 0)$$

Sa propriété la plus importante, et ce qui la rend omniprésente en physique :

$$\left(e^x\right)' = e^x$$

Elle est **sa propre dérivée**. C'est la seule fonction (à un facteur près) qui
vérifie cela, ce qui explique son rôle central dans les équations différentielles.

**Signe.** $e^x > 0$ pour tout réel $x$. Sans exception, sans discussion. Cette
remarque sert en permanence : dans une étude de signe, un facteur $e^{\text{quelque chose}}$
peut toujours être ignoré, puisqu'il est positif.

**Variations.** Comme $e^x > 0$, la dérivée est strictement positive : $\exp$ est
**strictement croissante** sur $\mathbb{R}$.

**Limites.**

$$\lim_{x \to -\infty} e^x = 0^+ \qquad\qquad \lim_{x \to +\infty} e^x = +\infty$$

La première donne une **asymptote horizontale** d'équation $y = 0$ en $-\infty$.

Valeurs de référence : $e^0 = 1$ et $e^1 = e \approx 2{,}718$.`,
    },
    {
      kind: 'formula',
      title: 'Propriétés algébriques',
      markdown: String.raw`$$e^{a+b} = e^a \times e^b
\qquad
e^{a-b} = \frac{e^a}{e^b}
\qquad
\left(e^a\right)^{n} = e^{\,na}
\qquad
e^{-a} = \frac{1}{e^a}$$

Symétriquement au logarithme : **l'exponentielle transforme une somme en
produit**. C'est la même relation, lue dans l'autre sens.

⚠️ Aucune formule pour $e^{a} + e^{b}$, tout comme il n'y en a aucune pour
$\ln(a+b)$.`,
    },
    {
      kind: 'formula',
      title: 'Croissances comparées',
      markdown: String.raw`$$\lim_{x \to +\infty} \frac{e^x}{x} = +\infty
\qquad
\lim_{x \to +\infty} \frac{e^x}{x^{\,n}} = +\infty
\qquad
\lim_{x \to -\infty} x\,e^x = 0$$

**L'exponentielle écrase toutes les puissances.** Même $\frac{e^x}{x^{100}}$ tend
vers $+\infty$.

La hiérarchie complète à retenir, en $+\infty$ :

$$\ln x \ \ll \ x^{\,n} \ \ll \ e^x$$`,
    },
    {
      kind: 'method',
      title: 'Dériver $e^{u}$ et résoudre',
      markdown: String.raw`**Dérivation.**

$$\left(e^{u}\right)' = u' \, e^{u}$$

Par exemple $\left(e^{3x+1}\right)' = 3e^{3x+1}$ et $\left(e^{x^2}\right)' = 2x\,e^{x^2}$.

**Équations et inéquations.** Puisque $\exp$ est strictement croissante et
bijective de $\mathbb{R}$ vers $]0\,;+\infty[$ :

$$e^{A} = e^{B} \iff A = B
\qquad\qquad
e^{A} < e^{B} \iff A < B$$

Le sens de l'inégalité est **conservé**, la fonction étant croissante.

Contrairement au logarithme, il n'y a **pas de contrainte de domaine** : $e^x$
existe pour tout réel. En revanche, une équation comme $e^x = -3$ n'a jamais de
solution, puisque l'exponentielle est strictement positive.`,
    },
    {
      kind: 'example',
      title: 'Exemple traité',
      markdown: String.raw`**Résoudre $e^{2x} - 3e^{x} + 2 = 0$.**

On pose $X = e^{x}$, avec la contrainte $X > 0$. Comme $e^{2x} = \left(e^{x}\right)^2 = X^2$ :

$$X^2 - 3X + 2 = 0$$

$\Delta = 9 - 8 = 1$, donc $X = 2$ ou $X = 1$. Les deux sont bien positifs.

On revient à $x$ :

$$e^{x} = 2 \Rightarrow x = \ln 2
\qquad\qquad
e^{x} = 1 \Rightarrow x = 0$$

$$S = \{0\,;\ \ln 2\}$$

Le changement de variable $X = e^x$ est le réflexe attendu dès qu'apparaissent
$e^{2x}$ et $e^{x}$ dans la même équation. Pense à écarter les racines négatives :
elles ne correspondent à aucun $x$.`,
    },
    {
      kind: 'pitfall',
      markdown: String.raw`**1. Chercher un domaine de définition.**
$e^x$ existe pour **tout** réel. Restreindre le domaine sans raison fait perdre
du temps et parfois des points.

**2. Oublier que $e^x > 0$.**
Dans une étude de signe de $f'(x) = (2x-1)e^{x}$, seul $2x-1$ compte : le facteur
exponentiel est toujours positif. Beaucoup d'élèves construisent un tableau de
signes inutile.

**3. Écrire $e^{a+b} = e^a + e^b$.**
Faux. C'est $e^{a+b} = e^a \times e^b$.

**4. Confondre $e^{2x}$ et $2e^{x}$.**
$e^{2x} = \left(e^x\right)^2$, ce qui est très différent de $2e^x$.

**5. Résoudre $e^x = -5$.**
Aucune solution : l'exponentielle ne prend jamais de valeur négative ou nulle.
Répondre $S=\emptyset$ vaut le point.`,
    },
    {
      kind: 'exam_tip',
      markdown: String.raw`L'exponentielle est partout dans l'épreuve de PC : en maths dans l'étude de
fonction et les équations différentielles, en physique dans la décroissance
radioactive et la charge d'un condensateur. La même fonction, deux épreuves.

Les fonctions typiques étudiées : $f(x)=xe^{x}$, $f(x)=\frac{e^x}{x}$,
$f(x)=(x+1)e^{-x}$.

**Conseil de copie :** dans un tableau de signes faisant intervenir
$e^{\text{quelque chose}}$, écris explicitement « $e^{u} > 0$ pour tout $x$, donc le
signe de $f'(x)$ est celui de $u'$ ». C'est une ligne, et elle est très souvent
notée.

Pense aussi à vérifier la cohérence : si tu trouves une exponentielle négative
quelque part, il y a une erreur en amont.`,
    },
    {
      kind: 'cheatsheet',
      title: 'Fiche mémo',
      markdown: String.raw`| Élément | Valeur |
|---|---|
| Domaine | $\mathbb{R}$ |
| Signe | $e^x > 0$ toujours |
| Dérivée | $e^x$ (elle-même) |
| Variations | strictement croissante |
| $e^0$ | $1$ |
| $\lim_{-\infty}$ | $0^+$ (asymptote $y=0$) |
| $\lim_{+\infty}$ | $+\infty$ |

**Algèbre** : $e^{a+b}=e^ae^b$ · $e^{a-b}=\frac{e^a}{e^b}$ · $e^{-a}=\frac{1}{e^a}$

**Composée** : $\left(e^{u}\right)' = u'e^{u}$

**Croissances comparées** : $\frac{e^x}{x^n}\to+\infty$ · $xe^{x}\to 0$ en $-\infty$

**Lien avec $\ln$** : $e^{\ln x}=x$ pour $x>0$, $\ln(e^x)=x$ pour tout $x$`,
    },
  ],

  mindmap: {
    root: {
      label: 'Exponentielle',
      children: [
        {
          label: 'Définition',
          children: [
            { label: 'Domaine ℝ entier' },
            { label: 'Réciproque de ln' },
            { label: 'e⁰ = 1' },
          ],
        },
        {
          label: 'Propriété clé',
          children: [
            { label: "(eˣ)' = eˣ — sa propre dérivée" },
            { label: 'eˣ > 0 toujours' },
          ],
        },
        {
          label: 'Algèbre',
          children: [
            { label: 'e^(a+b) = eᵃ · eᵇ' },
            { label: 'e^(−a) = 1/eᵃ' },
            { label: 'Rien pour eᵃ + eᵇ' },
          ],
        },
        {
          label: 'Limites',
          children: [
            { label: 'En −∞ → 0⁺, asymptote y = 0' },
            { label: 'En +∞ → +∞ très vite' },
            { label: 'eˣ écrase toute puissance' },
          ],
        },
        {
          label: 'Équations',
          children: [
            { label: 'Poser X = eˣ, avec X > 0' },
            { label: 'eᴬ = eᴮ ⟺ A = B' },
            { label: 'eˣ = négatif → aucune solution' },
          ],
        },
      ],
    },
  },

  questions: [
    {
      stem: String.raw`Quel est le domaine de définition de $f(x) = e^{x}$ ?`,
      choices: [
        ['a', String.raw`$\mathbb{R}$`, true],
        ['b', String.raw`$]0\,;+\infty[$`, false],
        ['c', String.raw`$[0\,;+\infty[$`, false],
        ['d', String.raw`$\mathbb{R}^*$`, false],
      ],
      explanation: String.raw`L'exponentielle est définie sur $\mathbb{R}$ tout entier.

C'est son **ensemble d'arrivée** qui vaut $]0\,;+\infty[$ : elle prend n'importe
quel réel en entrée, et rend toujours un résultat strictement positif.

La confusion avec le logarithme est fréquente, et les deux fonctions sont
exactement inverses l'une de l'autre sur ce point.`,
      difficulty: 1,
    },
    {
      stem: String.raw`Que vaut $e^{5} \times e^{-2}$ ?`,
      choices: [
        ['a', String.raw`$e^{3}$`, true],
        ['b', String.raw`$e^{-10}$`, false],
        ['c', String.raw`$e^{7}$`, false],
        ['d', String.raw`$2e^{3}$`, false],
      ],
      explanation: String.raw`Un produit d'exponentielles est l'exponentielle de la somme des exposants :

$$e^{5} \times e^{-2} = e^{5+(-2)} = e^{3}$$

C'est la relation miroir du logarithme : $\ln$ transforme un produit en somme,
$\exp$ transforme une somme en produit.`,
      difficulty: 1,
    },
    {
      stem: String.raw`Quel est le signe de $f'(x) = (3x - 6)e^{x}$ ?`,
      choices: [
        ['a', String.raw`Négatif si $x<2$, positif si $x>2$`, true],
        ['b', 'Toujours positif', false],
        ['c', 'Toujours négatif', false],
        ['d', String.raw`Dépend du signe de $e^{x}$`, false],
      ],
      explanation: String.raw`$e^{x} > 0$ pour tout réel, donc le signe de $f'(x)$ est **exactement** celui de
$3x-6$.

$$3x - 6 > 0 \iff x > 2$$

D'où : $f' < 0$ sur $]-\infty\,;2[$ et $f' > 0$ sur $]2\,;+\infty[$. La fonction
admet donc un minimum en $x=2$.

Le réflexe à acquérir : dans un tableau de signes, un facteur exponentiel se
neutralise immédiatement. Écris-le, c'est un point de barème.`,
      difficulty: 2,
    },
    {
      stem: String.raw`Quelle est la dérivée de $f(x) = e^{-2x}$ ?`,
      choices: [
        ['a', String.raw`$-2e^{-2x}$`, true],
        ['b', String.raw`$e^{-2x}$`, false],
        ['c', String.raw`$-2x\,e^{-2x}$`, false],
        ['d', String.raw`$2e^{-2x}$`, false],
      ],
      explanation: String.raw`On applique $\left(e^{u}\right)' = u'e^{u}$ avec $u=-2x$ et $u'=-2$ :

$$f'(x) = -2e^{-2x}$$

Deux erreurs classiques : oublier le facteur $u'$, ou écrire $u$ au lieu de $u'$.
Ici $u' = -2$, une constante, pas $-2x$.

Remarque que $f' < 0$ partout : $f$ est strictement décroissante, ce qui
correspond à la décroissance exponentielle rencontrée en physique.`,
      difficulty: 2,
    },
    {
      stem: String.raw`Combien de solutions a l'équation $e^{x} = -4$ ?`,
      choices: [
        ['a', 'Aucune', true],
        ['b', 'Une', false],
        ['c', 'Deux', false],
        ['d', String.raw`Une, $x = \ln(-4)$`, false],
      ],
      explanation: String.raw`L'exponentielle est **strictement positive** pour tout réel : elle ne peut
jamais valoir $-4$. Donc $S = \emptyset$.

La réponse « $x=\ln(-4)$ » est doublement fausse : le logarithme d'un nombre
négatif n'existe pas non plus.

Avant de te lancer dans un calcul, vérifie toujours le signe du second membre.
C'est une question à un point que beaucoup perdent en cherchant compliqué.`,
      difficulty: 2,
    },
    {
      stem: String.raw`Résoudre $e^{2x} - 5e^{x} + 4 = 0$.`,
      choices: [
        ['a', String.raw`$x=0$ ou $x=\ln 4$`, true],
        ['b', String.raw`$x=1$ ou $x=4$`, false],
        ['c', String.raw`$x=\ln 5$`, false],
        ['d', 'Aucune solution', false],
      ],
      explanation: String.raw`On pose $X=e^{x}$ avec $X>0$. Comme $e^{2x}=X^2$ :

$$X^2-5X+4=0 \quad\Longrightarrow\quad \Delta=9,\ X=4 \text{ ou } X=1$$

Les deux racines sont positives, donc toutes deux exploitables :

$$e^{x}=4 \Rightarrow x=\ln 4 \qquad e^{x}=1 \Rightarrow x=0$$

Le piège serait de s'arrêter à $X=4$ et $X=1$ en croyant avoir trouvé $x$. Le
changement de variable doit **toujours** être défait à la fin.`,
      difficulty: 3,
    },
    {
      stem: String.raw`Que vaut $\displaystyle\lim_{x \to +\infty} \frac{e^{x}}{x^{3}}$ ?`,
      choices: [
        ['a', String.raw`$+\infty$`, true],
        ['b', String.raw`$0$`, false],
        ['c', String.raw`$1$`, false],
        ['d', String.raw`$3$`, false],
      ],
      explanation: String.raw`Croissance comparée : **l'exponentielle l'emporte sur toute puissance de $x$**,
quel que soit l'exposant.

$$\lim_{x \to +\infty} \frac{e^{x}}{x^{\,n}} = +\infty \quad \text{pour tout } n$$

Même avec $x^{100}$ au dénominateur, la limite resterait $+\infty$. La
hiérarchie à mémoriser : $\ln x \ll x^{\,n} \ll e^{x}$.`,
      difficulty: 2,
    },
  ],
}
