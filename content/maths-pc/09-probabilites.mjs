export default {
  slug: 'probabilites',
  unit: { slug: 'probabilites', title: 'Probabilités', order: 3, lessonOrder: 1 },
  title: 'Probabilités',
  subtitle:
    "Un exercice indépendant du reste du sujet : on peut le réussir même si l'analyse s'est mal passée.",
  difficulty: 2,
  estMinutes: 22,
  examFrequency: 4,
  accessTier: 'premium',
  objectives: [
    'Dénombrer avec les arrangements et les combinaisons',
    'Calculer une probabilité conditionnelle et reconnaître l’indépendance',
    'Utiliser un arbre pondéré et la formule des probabilités totales',
    'Reconnaître et exploiter une loi binomiale',
  ],
  keyTerms: ['combinaison', 'probabilité conditionnelle', 'indépendance', 'loi binomiale', 'espérance'],

  blocks: [
    {
      kind: 'resume',
      title: "L'essentiel",
      markdown: String.raw`Dans une situation d'**équiprobabilité**, la probabilité d'un événement est le
rapport le plus simple qui soit :

$$P(A) = \frac{\text{nombre de cas favorables}}{\text{nombre de cas possibles}}$$

Toute la difficulté est donc de **compter** correctement, et la question à se
poser en premier est toujours la même :

> **L'ordre compte-t-il ?**

- **Oui** → arrangements : $A_n^{\,k} = \dfrac{n!}{(n-k)!}$
- **Non** → combinaisons : $\dbinom{n}{k} = \dfrac{n!}{k!\,(n-k)!}$

Tirer 3 cartes d'un jeu « au hasard » ne dépend pas de l'ordre : c'est une
combinaison. Attribuer 3 places distinctes (1er, 2e, 3e) en dépend : c'est un
arrangement. Se tromper ici fausse tout l'exercice, quelle que soit la suite.

**Opérations sur les événements**

$$P(\bar{A}) = 1 - P(A)
\qquad
P(A\cup B) = P(A)+P(B)-P(A\cap B)$$

Passer par l'événement contraire est souvent bien plus rapide. « Au moins un »
se traite presque toujours en calculant « aucun » puis en soustrayant.`,
    },
    {
      kind: 'formula',
      title: 'Conditionnement et indépendance',
      markdown: String.raw`**Probabilité conditionnelle** — la probabilité de $B$ sachant que $A$ est
réalisé :

$$P_A(B) = \frac{P(A\cap B)}{P(A)}
\qquad\text{d'où}\qquad
P(A\cap B) = P(A)\times P_A(B)$$

**Indépendance** — $A$ et $B$ sont indépendants lorsque :

$$P(A\cap B) = P(A)\times P(B)
\qquad\text{soit}\qquad
P_A(B) = P(B)$$

Autrement dit : savoir que $A$ s'est produit ne change rien à la probabilité de
$B$.

**Probabilités totales** — si $A_1, \dots, A_n$ forment une partition :

$$P(B) = P(A_1\cap B) + \dots + P(A_n\cap B)
= P(A_1)P_{A_1}(B) + \dots + P(A_n)P_{A_n}(B)$$

C'est la lecture d'un **arbre pondéré** : on multiplie le long des branches, on
additionne les branches qui aboutissent à $B$.`,
    },
    {
      kind: 'formula',
      title: 'Loi binomiale',
      markdown: String.raw`On répète $n$ fois **la même** expérience, de façon **indépendante**, avec deux
issues seulement : succès (probabilité $p$) ou échec. Le nombre $X$ de succès
suit alors la **loi binomiale** $\mathcal{B}(n,p)$.

$$P(X=k) = \binom{n}{k}\,p^{\,k}\,(1-p)^{\,n-k}$$

$$E(X) = np \qquad V(X) = np(1-p) \qquad \sigma(X)=\sqrt{np(1-p)}$$

Les trois conditions sont à **vérifier explicitement** avant d'appliquer la
formule : répétition à l'identique, indépendance, deux issues. C'est souvent un
point de barème à part entière.

Le coefficient $\binom{n}{k}$ compte les positions possibles des $k$ succès
parmi les $n$ essais — c'est lui qu'on oublie le plus souvent.`,
    },
    {
      kind: 'example',
      title: 'Exemple traité',
      markdown: String.raw`**Une urne contient 5 boules rouges et 3 boules vertes. On tire 3 boules
simultanément. Probabilité d'obtenir exactement 2 rouges ?**

*Tirage simultané → l'ordre ne compte pas → combinaisons.*

Cas possibles : $\dbinom{8}{3} = \dfrac{8\times7\times6}{3\times2\times1} = 56$

Cas favorables : choisir 2 rouges parmi 5 **et** 1 verte parmi 3 :

$$\binom{5}{2}\times\binom{3}{1} = 10 \times 3 = 30$$

$$P = \frac{30}{56} = \frac{15}{28} \approx 0{,}536$$

**Variante.** Si l'on tirait 3 boules **avec remise**, chaque tirage serait
indépendant avec $p=\frac58$ : $X$ suivrait $\mathcal{B}\left(3,\frac58\right)$ et

$$P(X=2)=\binom{3}{2}\left(\tfrac58\right)^{2}\left(\tfrac38\right) \approx 0{,}44$$

Même énoncé à un mot près, deux modèles différents. Le mot « simultanément » ou
« avec remise » décide de tout : souligne-le en lisant.`,
    },
    {
      kind: 'pitfall',
      markdown: String.raw`**1. Confondre arrangement et combinaison.**
« Simultanément », « au hasard », « une poignée » → combinaisons.
« Successivement sans remise », « un classement », « un podium » → arrangements.

**2. Oublier $\binom{n}{k}$ dans la loi binomiale.**
$p^k(1-p)^{n-k}$ est la probabilité d'**une** séquence précise. Il faut
multiplier par le nombre de séquences possibles.

**3. Confondre indépendance et incompatibilité.**
Incompatibles : $A\cap B=\emptyset$. Indépendants : $P(A\cap B)=P(A)P(B)$.
Deux événements incompatibles de probabilité non nulle ne sont **jamais**
indépendants — si l'un se produit, l'autre devient impossible.

**4. Inverser le conditionnement.**
$P_A(B)$ et $P_B(A)$ sont deux nombres différents. Lis bien « sachant que ».

**5. Traiter « au moins un » de front.**
Passe par le contraire : $P(\text{au moins un}) = 1 - P(\text{aucun})$.

**6. Donner une probabilité hors de $[0,1]$.**
Un résultat négatif ou supérieur à $1$ signale une erreur en amont. Vérifie
toujours.`,
    },
    {
      kind: 'exam_tip',
      markdown: String.raw`Les probabilités forment un exercice **indépendant du reste du sujet**, souvent
noté 3 points. C'est stratégiquement précieux : même si l'étude de fonction
s'est mal passée, celui-ci reste entièrement accessible.

Structure habituelle :

1. Un dénombrement simple (combinaisons).
2. Une ou deux probabilités conditionnelles, parfois via un arbre.
3. Une variable aléatoire : loi, espérance.

**Conseil de copie :** dessine l'arbre pondéré dès qu'il y a du
conditionnement, même si l'énoncé ne le demande pas. Il structure le
raisonnement, et les probabilités des branches sont souvent des points de
barème directs.

Justifie aussi la loi : « il s'agit de $n$ répétitions indépendantes de la même
épreuve à deux issues, donc $X$ suit $\mathcal{B}(n,p)$ ». Une phrase, un point.`,
    },
    {
      kind: 'cheatsheet',
      title: 'Fiche mémo',
      markdown: String.raw`**Compter**

$$\binom{n}{k}=\frac{n!}{k!(n-k)!} \quad(\text{ordre indifférent})
\qquad
A_n^{\,k}=\frac{n!}{(n-k)!} \quad(\text{ordre important})$$

$$\binom{n}{0}=\binom{n}{n}=1 \qquad \binom{n}{1}=n \qquad \binom{n}{k}=\binom{n}{n-k}$$

**Probabilités**

$$P(\bar A)=1-P(A) \qquad P(A\cup B)=P(A)+P(B)-P(A\cap B)$$

$$P_A(B)=\frac{P(A\cap B)}{P(A)} \qquad \text{indépendants : } P(A\cap B)=P(A)P(B)$$

**Loi binomiale $\mathcal{B}(n,p)$**

$$P(X=k)=\binom{n}{k}p^k(1-p)^{n-k} \qquad E(X)=np \qquad V(X)=np(1-p)$$

**Réflexe** : « au moins un » → passer par le contraire.`,
    },
  ],

  mindmap: {
    root: {
      label: 'Probabilités',
      children: [
        {
          label: 'Dénombrer',
          children: [
            { label: "Question 1 : l'ordre compte-t-il ?" },
            { label: 'Non → combinaisons C(n,k)' },
            { label: 'Oui → arrangements A(n,k)' },
          ],
        },
        {
          label: 'Événements',
          children: [
            { label: 'P(Ā) = 1 − P(A)' },
            { label: 'P(A∪B) = P(A)+P(B)−P(A∩B)' },
            { label: '« au moins un » → passer au contraire' },
          ],
        },
        {
          label: 'Conditionnel',
          children: [
            { label: 'P_A(B) = P(A∩B)/P(A)' },
            { label: 'Arbre : × le long, + entre branches' },
            { label: 'Indépendants ≠ incompatibles' },
          ],
        },
        {
          label: 'Loi binomiale',
          children: [
            { label: 'n répétitions, indépendantes, 2 issues' },
            { label: 'P(X=k) = C(n,k) pᵏ (1−p)ⁿ⁻ᵏ' },
            { label: 'E(X) = np, V(X) = np(1−p)' },
          ],
        },
      ],
    },
  },

  questions: [
    {
      stem: String.raw`On tire 2 cartes simultanément d'un jeu de 32. Combien de tirages possibles ?`,
      choices: [
        ['a', String.raw`$\dbinom{32}{2} = 496$`, true],
        ['b', String.raw`$A_{32}^{2} = 992$`, false],
        ['c', String.raw`$32\times 32 = 1024$`, false],
        ['d', String.raw`$32$`, false],
      ],
      explanation: String.raw`« Simultanément » signifie que l'ordre n'a aucun sens : tirer as-roi ou roi-as
est le même tirage. C'est donc une **combinaison**.

$$\binom{32}{2} = \frac{32\times31}{2} = 496$$

L'arrangement $A_{32}^{2}=992$ compte chaque paire deux fois, une fois dans
chaque ordre — exactement le double, ce qui est un bon contrôle.`,
      difficulty: 1,
    },
    {
      stem: String.raw`$P(A)=0{,}4$, $P(B)=0{,}5$, $P(A\cap B)=0{,}2$. $A$ et $B$ sont-ils indépendants ?`,
      choices: [
        ['a', String.raw`Oui, car $0{,}4\times0{,}5=0{,}2$`, true],
        ['b', "Non, car ils peuvent se produire ensemble", false],
        ['c', String.raw`Non, car $P(A)\neq P(B)$`, false],
        ['d', 'On ne peut pas savoir', false],
      ],
      explanation: String.raw`Le critère est une égalité à vérifier, rien de plus :

$$P(A)\times P(B) = 0{,}4\times0{,}5 = 0{,}2 = P(A\cap B) \ \checkmark$$

Donc $A$ et $B$ sont **indépendants**.

Le fait qu'ils puissent se produire ensemble ne contredit rien — au contraire.
Des événements **incompatibles** ($P(A\cap B)=0$) de probabilité non nulle ne
sont jamais indépendants, ce qui est l'inverse de l'intuition courante.`,
      difficulty: 2,
    },
    {
      stem: String.raw`$X$ suit $\mathcal{B}(10\,;0{,}3)$. Que vaut $E(X)$ ?`,
      choices: [
        ['a', String.raw`$3$`, true],
        ['b', String.raw`$0{,}3$`, false],
        ['c', String.raw`$2{,}1$`, false],
        ['d', String.raw`$10$`, false],
      ],
      explanation: String.raw`Pour une loi binomiale, $E(X) = np = 10 \times 0{,}3 = 3$.

Interprétation : sur 10 essais avec 30 % de réussite, on attend 3 succès en
moyenne. Le résultat doit toujours être cohérent avec cette lecture.

Attention à ne pas confondre avec la **variance**
$V(X)=np(1-p)=10\times0{,}3\times0{,}7=2{,}1$ — c'est la réponse c), proposée
précisément pour cette confusion.`,
      difficulty: 2,
    },
    {
      stem: String.raw`On lance 4 fois une pièce équilibrée. Probabilité d'obtenir exactement 2 piles ?`,
      choices: [
        ['a', String.raw`$\dfrac{6}{16} = 0{,}375$`, true],
        ['b', String.raw`$\dfrac{1}{16}$`, false],
        ['c', String.raw`$\dfrac{2}{4} = 0{,}5$`, false],
        ['d', String.raw`$\dfrac{4}{16}$`, false],
      ],
      explanation: String.raw`$X$ suit $\mathcal{B}\left(4\,;\frac12\right)$ :

$$P(X=2)=\binom{4}{2}\left(\tfrac12\right)^{2}\left(\tfrac12\right)^{2}
= 6 \times \frac{1}{16} = \frac{6}{16} = 0{,}375$$

Le $\binom{4}{2}=6$ compte les positions possibles des deux piles : PPFF, PFPF,
PFFP, FPPF, FPFP, FFPP.

Sans ce coefficient on obtient $\frac{1}{16}$, qui est la probabilité d'**une**
séquence précise — l'erreur la plus fréquente du chapitre.`,
      difficulty: 2,
    },
    {
      stem: String.raw`Dans une urne, $P(\text{rouge})=0{,}6$. On tire 3 boules avec remise. Probabilité d'obtenir au moins une rouge ?`,
      choices: [
        ['a', String.raw`$1-0{,}4^{3}=0{,}936$`, true],
        ['b', String.raw`$0{,}6^{3}=0{,}216$`, false],
        ['c', String.raw`$3\times0{,}6=1{,}8$`, false],
        ['d', String.raw`$0{,}6$`, false],
      ],
      explanation: String.raw`« Au moins une » se traite par l'événement contraire : « aucune rouge »,
c'est-à-dire trois non-rouges de suite.

$$P(\text{aucune}) = 0{,}4^{3} = 0{,}064
\qquad
P(\text{au moins une}) = 1 - 0{,}064 = 0{,}936$$

Traiter le problème de front obligerait à additionner les cas $X=1$, $X=2$ et
$X=3$ — trois fois plus de travail pour le même résultat.

Note que la réponse c) donne $1{,}8$ : une probabilité supérieure à $1$ est
impossible, et ce seul contrôle l'élimine.`,
      difficulty: 3,
    },
    {
      stem: String.raw`Deux événements incompatibles $A$ et $B$, avec $P(A)>0$ et $P(B)>0$, sont-ils indépendants ?`,
      choices: [
        ['a', String.raw`Non, jamais`, true],
        ['b', 'Oui, toujours', false],
        ['c', String.raw`Oui si $P(A)=P(B)$`, false],
        ['d', 'Cela dépend', false],
      ],
      explanation: String.raw`Incompatibles signifie $A\cap B=\emptyset$, donc $P(A\cap B)=0$.

Or l'indépendance exigerait $P(A\cap B)=P(A)\times P(B)$, un produit de deux
nombres **strictement positifs**, donc strictement positif. Les deux conditions
sont contradictoires.

Intuitivement : si $A$ et $B$ ne peuvent pas coexister, apprendre que $A$ s'est
produit t'informe énormément sur $B$ — il est devenu impossible. C'est le
contraire de l'indépendance.

Ces deux notions sont constamment confondues ; retiens qu'elles s'excluent
plutôt qu'elles ne se rejoignent.`,
      difficulty: 3,
    },
  ],
}
