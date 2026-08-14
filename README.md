# Baccaloria

Plateforme de préparation au **Baccalauréat marocain**. Leçons résumées, fiches
mémo, cartes mentales, quiz, tests de palier et examens nationaux corrigés —
avec un suivi de progression pondéré par les coefficients.

**v1 couvre trois filières :** Sciences Physiques (PC), Sciences Économiques (SE),
Sciences de Gestion Comptable (SGC).

---

## Stack

| Couche | Choix |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) + React 19 |
| Langage | TypeScript 7 |
| Styles | Tailwind CSS 4 (tokens CSS dans `src/app/globals.css`) |
| Base de données | Supabase — Postgres 17, Auth, Storage, RLS |
| i18n | next-intl — français d'abord, arabe prévu |
| Maths | KaTeX |
| Graphiques | Recharts |
| Hébergement | Vercel |

---

## Démarrage

### 1. Dépendances

```bash
pnpm install
```

### 2. Variables d'environnement

```bash
cp .env.example .env.local
```

Renseigne `.env.local` depuis **Supabase Dashboard → Project Settings → API**.

> `SUPABASE_SERVICE_ROLE_KEY` contourne toutes les policies RLS. Elle ne doit
> jamais être préfixée `NEXT_PUBLIC_`, ni importée dans un Client Component.

### 3. Base de données

Lier le projet Supabase, puis pousser le schéma et les données de départ :

```bash
pnpm exec supabase login
```

```bash
pnpm exec supabase link --project-ref TON_PROJECT_REF
```

```bash
pnpm db:push
```

Puis générer les types TypeScript à partir du schéma réel :

```bash
pnpm db:types
```

> `src/lib/supabase/database.types.ts` est un **placeholder permissif** tant que
> cette commande n'a pas tourné. Le typage des requêtes reste faible jusque-là.

### 4. Lancer

```bash
pnpm dev
```

---

## Vérifier le schéma sans Docker

`supabase db start` exige Docker. En son absence, les migrations sont rejouées
contre un Postgres 17 compilé en WebAssembly :

```bash
pnpm db:validate
```

Le script exécute chaque migration puis `seed.sql`, vérifie que **toutes** les
tables publiques ont RLS activé, et exécute `recompute_readiness()` de bout en
bout. Il attrape les erreurs DDL avant un `db push` à moitié appliqué.

---

## Architecture de la base

Le pivot central est **`filiere_subjects`**, pas `subjects`. Une même matière ne
pèse pas pareil selon la filière (Maths : coef 7 en PC, 4 en SGC), et le
programme lui-même diffère. Tout ce qui suit — unités, leçons, examens,
progression, score de préparation — s'accroche à `filiere_subjects`.

```
filieres ──┐
           ├── filiere_subjects (coefficient, durée d'épreuve)
subjects ──┘         │
                     ├── units ── lesson_placements ── lessons ── lesson_blocks
                     │                                    │        mindmaps
                     ├── milestones                       └── questions
                     └── exams ── exam_exercises
```

**Réutilisation des leçons.** Une leçon appartient à une *matière*, puis est
*placée* dans une ou plusieurs unités. SE et SGC partagent l'essentiel de
« Économie générale et statistiques » : on rédige une fois, on place deux fois.
Là où le programme diverge réellement, on crée deux leçons distinctes.

### Migrations

| Fichier | Contenu |
|---|---|
| `0001_foundations.sql` | Extensions, enums, taxonomie, calendrier d'examen |
| `0002_content.sql` | Leçons, blocs, cartes mentales, workflow éditorial |
| `0003_assessments.sql` | Banque de questions, quiz / paliers / examens |
| `0004_accounts_billing.sql` | Profils, abonnements, paiements manuels |
| `0005_progress_readiness.sql` | Tentatives, progression, score de préparation |
| `0006_rls.sql` | Row Level Security + buckets Storage |

---

## Deux règles de sécurité à ne pas casser

**1. Le paywall vit dans la base, pas dans React.** Les policies de
`0006_rls.sql` sont la seule application réelle du freemium. Une leçon `premium`
est illisible sans abonnement actif, quelle que soit la requête.

**2. Les élèves n'ont aucun `select` direct sur `public.questions`.** Cette table
contient `answer` et `explanation` : un seul appel REST suffirait à vider tout le
corrigé de la banque. Les élèves y accèdent uniquement via des fonctions
`security definer`, qui masquent la correction tant que la tentative n'est pas
soumise. **La correction se fait côté serveur** — un score calculé dans le
navigateur est un score falsifiable.

---

## Score de préparation

`recompute_readiness(user_id)` mélange cinq signaux, chacun pondéré par le
coefficient de la matière :

| Signal | Poids | Mesure |
|---|---|---|
| Couverture | 25 % | Leçons terminées, pondérées par leur fréquence aux examens |
| Maîtrise | 30 % | Résultats aux quiz et tests de palier |
| Examens blancs | 30 % | Moyenne pondérée par récence (les 3 derniers comptent le plus) |
| Gestion du temps | 5 % | Épreuves terminées dans le temps imparti |
| Mémorisation | 10 % | Décroissance au-delà de 30 jours sans révision |

Résultat sur 100, rangé en 5 paliers (`band` 0–4), du « Pas encore là » au
« Tu es prêt·e ». Les libellés sont dans `messages/fr.json`.

Les poids sont volontairement regroupés en tête de la fonction — c'est un
réglage produit, à ajuster quand les vrais résultats arriveront.

---

## ⚠️ À vérifier avant le lancement

- [ ] **Coefficients et durées d'épreuve.** Tous les `filiere_subjects` sont
      insérés avec `coefficient_verified = false`. Les valeurs de `seed.sql`
      sont des estimations. Il faut les confronter à l'arrêté officiel du
      Ministère pour l'année en cours, puis passer le flag à `true`. Un
      coefficient faux fausse le score de préparation **et** le conseil
      « travaille ça en priorité » — c'est-à-dire le cœur du produit.
- [ ] **Dates d'examen.** `exam_calendar` contient des estimations
      (`is_confirmed = false`) pour juin 2027. À corriger dès publication par
      le MEN.
- [ ] **Tarifs.** Les prix de `seed.sql` sont des placeholders.
- [ ] **Mentions légales.** CGU/CGV, politique de confidentialité, et
      déclaration CNDP (loi 09-08) — le public est majoritairement mineur.
- [ ] **Droits sur les contenus.** Les sujets d'examen national sont publics,
      mais les corrigés et résumés doivent être originaux.

---

## Scripts

| Commande | Effet |
|---|---|
| `pnpm dev` | Serveur de développement |
| `pnpm build` | Build de production |
| `pnpm typecheck` | Vérification des types |
| `pnpm lint` | ESLint |
| `pnpm db:validate` | Rejoue les migrations sur Postgres WASM |
| `pnpm db:push` | Applique les migrations au projet lié |
| `pnpm db:types` | Régénère `database.types.ts` |
