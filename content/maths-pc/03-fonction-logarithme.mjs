export default {
  slug: 'fonction-logarithme-neperien',
  unit: { slug: 'analyse', title: 'Analyse', order: 1, lessonOrder: 3 },
  title: 'Fonction logarithme népérien',
  subtitle: 'La fonction qui transforme les produits en sommes — et son étude complète.',
  difficulty: 2,
  estMinutes: 20,
  examFrequency: 5,
  accessTier: 'premium',
  objectives: [
    'Connaître le domaine, les limites et les variations de $\\ln$',
    'Utiliser les propriétés algébriques du logarithme',
    'Résoudre équations et inéquations avec $\\ln$ en gérant le domaine',
    'Dériver une fonction composée du type $\\ln(u)$',
  ],
  keyTerms: ['logarithme népérien', 'domaine', 'croissance comparée', 'asymptote'],

  blocks: [
    {
      kind: 'resume',
      title: "L'essentiel",
      markdown: String.raw`Le **logarithme népérien** $\ln$ est défini sur $]0\,;+\infty[$ uniquement : on ne
peut jamais prendre le logarithme d'un nombre négatif ou nul.

C'est la fonction réciproque de l'exponentielle :

$$\ln(e^x) = x \quad \text{pour tout } x \in \mathbb{R}
\qquad\qquad
e^{\ln x} = x \quad \text{pour tout } x > 0$$

Deux valeurs à connaître par cœur : $\ln 1 = 0$ et $\ln e = 1$.

**Dérivée et variations.**

$$\left(\ln x\right)' = \frac{1}{x} > 0 \text{ sur } ]0\,;+\infty[$$

La dérivée est strictement positive, donc $\ln$ est **strictement croissante** sur
tout son domaine. Elle est donc bijective, ce qui autorise à « passer au $\ln$ »
dans une équation ou une inéquation sans changer le sens.

**Limites aux bornes.**

$$\lim_{x \to 0^+} \ln x = -\infty \qquad\qquad \lim_{x \to +\infty} \ln x = +\infty$$

La première donne une **asymptote verticale** d'équation $x = 0$. La seconde est à
nuancer : $\ln$ tend vers l'infini, mais très lentement — c'est tout le sens des
croissances comparées.`,
    },
    {
      kind: 'formula',
      title: 'Propriétés algébriques',
      markdown: String.raw`Pour tous réels $a > 0$ et $b > 0$ :

$$\ln(ab) = \ln a + \ln b
\qquad
\ln\!\left(\frac{a}{b}\right) = \ln a - \ln b$$

$$\ln\!\left(a^{\,n}\right) = n\ln a
\qquad
\ln\!\left(\sqrt{a}\right) = \tfrac{1}{2}\ln a
\qquad
\ln\!\left(\frac{1}{a}\right) = -\ln a$$

C'est la propriété fondatrice : **le logarithme transforme un produit en somme**.
C'est précisément ce qui le rend utile, en mathématiques comme en physique.

⚠️ Il n'existe **aucune** formule pour $\ln(a+b)$. C'est l'erreur la plus
fréquente du chapitre.`,
    },
    {
      kind: 'formula',
      title: 'Croissances comparées',
      markdown: String.raw`$$\lim_{x \to +\infty} \frac{\ln x}{x} = 0
\qquad
\lim_{x \to +\infty} \frac{\ln x}{x^{\,n}} = 0
\qquad
\lim_{x \to 0^+} x\ln x = 0$$

En clair : **toute puissance de $x$ l'emporte sur $\ln x$**, aussi petite
soit-elle. Ces trois limites lèvent la quasi-totalité des indéterminations du
chapitre et tombent presque chaque année.`,
    },
    {
      kind: 'method',
      title: 'Résoudre une équation ou une inéquation',
      markdown: String.raw`1. **Domaine d'abord.** Chaque expression sous un $\ln$ doit être strictement
   positive. Résous ces conditions et note l'ensemble obtenu — c'est la première
   ligne de la copie.
2. **Regroupe** les logarithmes en un seul, avec les propriétés algébriques.
3. **Élimine le $\ln$** : puisque $\ln$ est strictement croissante et bijective,

   $$\ln A = \ln B \iff A = B \qquad\text{et}\qquad \ln A < \ln B \iff A < B$$

   (à condition que $A>0$ et $B>0$, déjà assuré par l'étape 1).
4. **Vérifie** que chaque solution appartient bien au domaine, et écarte les autres.

L'étape 4 n'est pas décorative : les manipulations algébriques créent
régulièrement des solutions parasites, hors domaine.`,
    },
    {
      kind: 'example',
      title: 'Exemple traité',
      markdown: String.raw`**Résoudre $\ln(x) + \ln(x-2) = \ln 3$.**

*Domaine.* Il faut $x>0$ **et** $x-2>0$, donc $x > 2$.

*Regroupement.* $\ln\!\left(x(x-2)\right) = \ln 3$

*Élimination.* $x(x-2) = 3$, soit $x^2 - 2x - 3 = 0$.

$\Delta = 4 + 12 = 16$, d'où $x = 3$ ou $x = -1$.

*Vérification.* $-1 \notin \,]2\,;+\infty[$ : on l'écarte. $3 > 2$ : on le garde.

$$S = \{3\}$$

La racine $-1$ est parfaitement correcte pour l'équation du second degré, et
totalement fausse pour l'équation initiale. D'où l'étape 4.`,
    },
    {
      kind: 'method',
      title: 'Dériver $\\ln(u)$',
      markdown: String.raw`$$\left(\ln u\right)' = \frac{u'}{u}$$

Cette formule n'est valable que là où $u(x) > 0$.

Exemples :

$$\left(\ln(3x+1)\right)' = \frac{3}{3x+1}
\qquad
\left(\ln(x^2+1)\right)' = \frac{2x}{x^2+1}$$

Réciproquement — et c'est ce qui servira au chapitre des primitives — toute
expression de la forme $\dfrac{u'}{u}$ a pour primitive $\ln|u|$.`,
    },
    {
      kind: 'pitfall',
      markdown: String.raw`**1. Inventer $\ln(a+b) = \ln a + \ln b$.**
Totalement faux. La bonne formule est $\ln(ab) = \ln a + \ln b$. Il n'existe rien
pour une somme.

**2. Oublier le domaine.**
Résoudre $\ln(x-3)=\ln(1-x)$ sans domaine mène à une « solution » qui n'existe
pas : les deux conditions $x>3$ et $x<1$ sont incompatibles, donc $S=\emptyset$.

**3. Écrire $\ln(-2)$.**
Le logarithme d'un négatif n'existe pas dans $\mathbb{R}$.

**4. Confondre $\ln(x^2)$ et $(\ln x)^2$.**
$\ln(x^2) = 2\ln x$ pour $x>0$, alors que $(\ln x)^2$ est le carré du logarithme.
Deux fonctions différentes.

**5. Diviser une inéquation par $\ln x$ sans discuter son signe.**
$\ln x$ est négatif sur $]0\,;1[$ et positif sur $]1\,;+\infty[$. Diviser par une
quantité négative inverse le sens de l'inégalité.`,
    },
    {
      kind: 'exam_tip',
      markdown: String.raw`Le logarithme apparaît quasi systématiquement dans l'étude de fonction, souvent
combiné à l'exponentielle. Les fonctions typiques sont
$f(x) = x - \ln x$, $f(x) = \frac{\ln x}{x}$ ou $f(x) = x\ln x$.

Points de barème récurrents :

- Le **domaine de définition**, presque toujours la première question.
- La limite en $0^+$, qui donne l'asymptote verticale.
- La limite en $+\infty$, qui exige une croissance comparée.
- Le tableau de variations complet, bornes comprises.

**Conseil de copie :** quand tu écris le domaine, justifie-le en une ligne
(« il faut $x>0$ car… »). Une réponse posée sans justification perd souvent la
moitié des points de la question.`,
    },
    {
      kind: 'cheatsheet',
      title: 'Fiche mémo',
      markdown: String.raw`| Élément | Valeur |
|---|---|
| Domaine | $]0\,;+\infty[$ |
| Dérivée | $\frac{1}{x}$ |
| Variations | strictement croissante |
| $\ln 1$ | $0$ |
| $\ln e$ | $1$ |
| $\lim_{0^+}$ | $-\infty$ (asymptote $x=0$) |
| $\lim_{+\infty}$ | $+\infty$ |

**Algèbre** : $\ln(ab)=\ln a+\ln b$ · $\ln\frac{a}{b}=\ln a-\ln b$ · $\ln a^n=n\ln a$

**Composée** : $(\ln u)' = \frac{u'}{u}$

**Croissances comparées** : $\frac{\ln x}{x^n} \to 0$ et $x\ln x \to 0$ en $0^+$

**Signe** : $\ln x < 0$ sur $]0\,;1[$, $\ln x > 0$ sur $]1\,;+\infty[$`,
    },
  ],

  mindmap: {
    root: {
      label: 'Logarithme népérien',
      children: [
        {
          label: 'Définition',
          children: [
            { label: 'Domaine ]0 ; +∞[ strictement' },
            { label: 'Réciproque de exp' },
            { label: 'ln 1 = 0, ln e = 1' },
          ],
        },
        {
          label: 'Algèbre',
          children: [
            { label: 'ln(ab) = ln a + ln b' },
            { label: 'ln(a/b) = ln a − ln b' },
            { label: 'ln(aⁿ) = n ln a' },
            { label: 'Rien pour ln(a+b)' },
          ],
        },
        {
          label: 'Étude',
          children: [
            { label: "Dérivée 1/x > 0 → croissante" },
            { label: 'lim en 0⁺ = −∞ → asymptote x = 0' },
            { label: 'lim en +∞ = +∞ (lentement)' },
          ],
        },
        {
          label: 'Équations',
          children: [
            { label: '1. Domaine' },
            { label: '2. Regrouper' },
            { label: '3. Supprimer ln' },
            { label: '4. Vérifier le domaine' },
          ],
        },
        {
          label: 'Croissances comparées',
          children: [{ label: 'ln x / xⁿ → 0 · x ln x → 0' }],
        },
      ],
    },
  },

  questions: [
    {
      stem: String.raw`Quel est le domaine de définition de $f(x) = \ln(x-3)$ ?`,
      choices: [
        ['a', String.raw`$]3\,;+\infty[$`, true],
        ['b', String.raw`$[3\,;+\infty[$`, false],
        ['c', String.raw`$\mathbb{R}$`, false],
        ['d', String.raw`$]-\infty\,;3[$`, false],
      ],
      explanation: String.raw`Le logarithme n'accepte que des arguments **strictement positifs** :
$x - 3 > 0$, soit $x > 3$.

La borne est exclue : $\ln(0)$ n'existe pas, donc $3$ ne fait pas partie du
domaine. Écrire $[3\,;+\infty[$ est une erreur classique de crochet.`,
      difficulty: 1,
    },
    {
      stem: String.raw`Que vaut $\ln 12 - \ln 4$ ?`,
      choices: [
        ['a', String.raw`$\ln 3$`, true],
        ['b', String.raw`$\ln 8$`, false],
        ['c', String.raw`$3$`, false],
        ['d', String.raw`$\dfrac{\ln 12}{\ln 4}$`, false],
      ],
      explanation: String.raw`Une différence de logarithmes est le logarithme d'un quotient :

$$\ln 12 - \ln 4 = \ln\!\left(\frac{12}{4}\right) = \ln 3$$

Attention à ne pas confondre avec $\frac{\ln 12}{\ln 4}$, qui est un quotient de
logarithmes et n'a aucune raison d'être égal à $\ln 3$.`,
      difficulty: 1,
    },
    {
      stem: String.raw`Laquelle de ces égalités est **fausse** ?`,
      choices: [
        ['a', String.raw`$\ln(a+b) = \ln a + \ln b$`, true],
        ['b', String.raw`$\ln(ab) = \ln a + \ln b$`, false],
        ['c', String.raw`$\ln(a^3) = 3\ln a$`, false],
        ['d', String.raw`$\ln\!\left(\frac{1}{a}\right) = -\ln a$`, false],
      ],
      explanation: String.raw`Il n'existe **aucune** formule pour le logarithme d'une somme.

Contre-exemple immédiat : $\ln(1+1) = \ln 2 \approx 0{,}69$, alors que
$\ln 1 + \ln 1 = 0$.

Le logarithme transforme les **produits** en sommes, pas les sommes en sommes.
C'est l'erreur numéro un du chapitre, et elle invalide tout l'exercice où elle
apparaît.`,
      difficulty: 2,
    },
    {
      stem: String.raw`Quelle est la dérivée de $f(x) = \ln(x^2 + 1)$ ?`,
      choices: [
        ['a', String.raw`$\dfrac{2x}{x^2+1}$`, true],
        ['b', String.raw`$\dfrac{1}{x^2+1}$`, false],
        ['c', String.raw`$2x\ln(x^2+1)$`, false],
        ['d', String.raw`$\dfrac{1}{2x}$`, false],
      ],
      explanation: String.raw`On applique $(\ln u)' = \dfrac{u'}{u}$ avec $u = x^2+1$ et $u' = 2x$ :

$$f'(x) = \frac{2x}{x^2+1}$$

L'oubli du $u'$ au numérateur est l'erreur la plus fréquente. Remarque au
passage que $x^2+1 > 0$ pour tout réel, donc $f$ est définie et dérivable sur
$\mathbb{R}$ entier.`,
      difficulty: 2,
    },
    {
      stem: String.raw`Que vaut $\displaystyle\lim_{x \to 0^+} x\ln x$ ?`,
      choices: [
        ['a', String.raw`$0$`, true],
        ['b', String.raw`$-\infty$`, false],
        ['c', String.raw`$1$`, false],
        ['d', String.raw`$+\infty$`, false],
      ],
      explanation: String.raw`C'est une forme indéterminée $0 \times (-\infty)$, résolue par une croissance
comparée : **$x$ l'emporte sur $\ln x$**, donc le produit tend vers $0$.

Intuition : $\ln x$ part bien vers $-\infty$, mais si lentement que le facteur
$x$, qui tend vers $0$, gagne largement.

Cette limite est indispensable pour l'étude de $f(x) = x\ln x$, un grand
classique de l'examen.`,
      difficulty: 3,
    },
    {
      stem: String.raw`Combien de solutions a l'équation $\ln(x) + \ln(x-1) = \ln 6$ ?`,
      choices: [
        ['a', 'Une seule', true],
        ['b', 'Deux', false],
        ['c', 'Aucune', false],
        ['d', 'Une infinité', false],
      ],
      explanation: String.raw`*Domaine.* $x>0$ et $x-1>0$, donc $x>1$.

*Résolution.* $\ln\!\left(x(x-1)\right)=\ln 6$ donne $x^2-x-6=0$, soit
$\Delta=25$ et $x=3$ ou $x=-2$.

*Vérification.* $-2 \notin\, ]1\,;+\infty[$ : écartée. Seul $x=3$ convient.

L'équation du second degré a deux racines, l'équation logarithmique n'en a
**qu'une**. C'est exactement pour cela que la vérification du domaine est une
étape obligatoire et non un raffinement.`,
      difficulty: 3,
    },
  ],
}
