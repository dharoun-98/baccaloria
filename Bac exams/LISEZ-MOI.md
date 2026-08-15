# Sujets d'examen national

## Où déposer les fichiers

```
Bac exams/
  <FILIÈRE>/<Matière>/<Normal|Ratt>/examen-<année>-<session>.pdf
```

Exemple : `PC/Math/Normal/examen-2024-normale.pdf`

Les dossiers sont déjà créés pour les trois filières et leurs matières
d'examen national. Il n'y a qu'à déposer les PDF.

| Filière | Matières |
|---|---|
| PC | Math · Physique-Chimie · SVT · Philosophie · Anglais |
| SE | Math · Economie · Comptabilite · Philosophie · Anglais |
| SGC | Math · Comptabilite · Economie · Philosophie · Anglais |

## Nommage

- Session normale : `examen-2024-normale.pdf`
- Session de rattrapage : `examen-2024-rattrapage.pdf`

Le script d'import lit l'année et la session **dans le nom du fichier**. Un
fichier mal nommé est ignoré, avec un message — il n'est jamais importé au
mauvais endroit.

Pas d'accents ni d'espaces dans les noms de dossiers : les chemins accentués
ont déjà posé des problèmes d'encodage sur ce projet.

## Ce dossier n'est pas versionné

Il est dans `.gitignore`. Les PDF sont volumineux et n'ont rien à faire dans
l'historique Git. Une fois importés, ils vivent dans Supabase Storage, qui
devient la référence.

Garde une copie de ce dossier ailleurs tant que l'import n'est pas fait.

## Les corrigés

Ils ne se déposent pas ici. Ils s'écrivent dans l'application, exercice par
exercice, depuis l'administration — c'est ce qui permet à l'élève de noter
chaque exercice séparément et de voir où il perd des points.
