# Modèle de contenu

Comment une leçon est stockée, et ce qu'un rédacteur doit produire.

---

## Une leçon = des blocs ordonnés

Une leçon (`lessons`) porte les métadonnées : titre, difficulté, durée estimée,
fréquence aux examens, palier d'accès. Le contenu vit dans `lesson_blocks`,
une liste ordonnée de blocs typés.

Chaque bloc a un `kind` qui détermine son rendu :

| `kind` | Usage | Rendu |
|---|---|---|
| `resume` | L'explication essentielle | Prose |
| `definition` | Une définition à retenir | Encadré neutre |
| `formula` | Une formule clé | Encadré, fond teinté |
| `theorem` | Théorème / propriété | Encadré, fond teinté |
| `method` | Étapes pour résoudre un type d'exercice | Liste numérotée |
| `example` | Exemple traité | Encadré discret |
| `pitfall` | Erreur fréquente | Encadré rouge |
| `exam_tip` | « Ça tombe à l'examen » | Encadré ambre |
| `cheatsheet` | Récapitulatif dense, imprimable | Encadré vert |
| `callout` | Remarque libre | Encadré neutre |

---

## Le format : Markdown + LaTeX

`lesson_blocks.content` est du JSON de forme :

```json
{ "markdown": "Le texte du bloc, en **Markdown**, avec du LaTeX : $z = a + ib$." }
```

Markdown plutôt qu'un format d'éditeur riche, pour trois raisons :

1. Les maths s'écrivent naturellement en LaTeX, rendu par KaTeX.
2. C'est ce qu'un modèle de langage produit le plus fiablement — le pipeline
   « brouillon IA puis validation enseignant » n'a rien à convertir.
3. Un correcteur peut relire une leçon entière sans ouvrir l'application.

### LaTeX

- En ligne : `$z = a + ib$` — petit, dans le fil du texte
- En bloc : `$$|z| = \sqrt{a^2 + b^2}$$` — grand, centré, sur sa propre ligne

**Tu n'as pas à te soucier du placement des `$$`.** Écris-les comme tu veux :
sur une ligne, sur plusieurs, collés au texte. L'application normalise avant le
rendu.

C'est délibéré. La bibliothèque de rendu exige que les `$$` soient seuls sur
leur ligne, sinon elle échoue **en silence** — soit le LaTeX brut s'affiche tel
quel, soit la formule est rendue en petit au milieu du paragraphe au lieu d'être
centrée. Deux erreurs invisibles à la relecture rapide. Le pré-traitement
supprime le problème plutôt que d'imposer une règle que personne ne retiendra.

Les formules trop larges défilent horizontalement dans leur propre bloc, elles
n'élargissent jamais la page — indispensable sur téléphone.

---

## Les cartes mentales

Stockées à part (`mindmaps`), parce qu'une carte est un graphe, pas un document.

```json
{
  "root": {
    "label": "Nombres complexes",
    "children": [
      { "label": "Forme algébrique", "children": [{ "label": "z = a + ib" }] },
      { "label": "Module", "children": [{ "label": "|z| = √(a²+b²)" }] }
    ]
  }
}
```

Deux niveaux d'enfants suffisent : au-delà, la carte devient illisible sur
téléphone et ce n'est plus un aide-mémoire.

---

## Deux garde-fous appliqués par la base

Ce ne sont pas des conventions, la base **refuse** l'écriture :

1. **Une leçon ne peut pas être publiée sans relecteur.** `reviewed_by` doit être
   renseigné. C'est tout l'intérêt du pipeline : un humain reste responsable de
   ce que lisent les élèves.
2. **Une question ne peut pas être publiée sans explication.** Une mauvaise
   réponse sans correction n'apprend rien.

---

## Ce qu'un rédacteur produit, par leçon

- 1 bloc `resume` — l'essentiel, 300 à 600 mots
- 2 à 5 blocs `formula` / `theorem` / `definition`
- 1 à 2 blocs `method` — la marche à suivre type
- 1 à 2 blocs `example`
- 1 à 2 blocs `pitfall` — **le bloc à plus forte valeur**, celui qui fait gagner
  des points
- 1 bloc `exam_tip`
- 1 bloc `cheatsheet`
- 1 carte mentale
- 10 à 15 questions de quiz, chacune **avec son explication**

Compter deux à trois heures par leçon pour un enseignant de la matière.
