-- ============================================================================
-- 0003_assessments.sql
-- The question bank, the three tiers of assessment, and past national exams.
--
-- Three tiers, one engine:
--   lesson_quiz  -- end of each lesson, short, drawn from a pool
--   milestone    -- unlocked after a group of lessons, "boss fight"
--   exam         -- a real past Examen National, timed, full simulation
--
-- Fixed vs pooled:
--   Past exams use assessment_questions (a fixed, faithful question list).
--   Quizzes and milestones use assessment_pools (a query spec) so every
--   retake shuffles a different draw out of the bank.
-- ============================================================================

create type question_type as enum (
  'mcq_single',    -- one correct choice
  'mcq_multi',     -- several correct choices
  'true_false',
  'numeric',       -- numeric answer with tolerance, for physics/maths
  'short_text',
  'ordering',      -- put the steps in order
  'matching',
  'open'           -- free response; self-graded against a corrigé
);

create type assessment_kind as enum ('lesson_quiz', 'milestone', 'exam');
create type exam_session   as enum ('normale', 'rattrapage');
create type attempt_state  as enum ('in_progress', 'submitted', 'graded', 'abandoned');

-- ------------------------------------------------------------- questions ---
create table public.questions (
  id           uuid primary key default gen_random_uuid(),
  subject_id   uuid not null references public.subjects(id) on delete restrict,
  lesson_id    uuid references public.lessons(id) on delete set null,
  type         question_type not null,

  stem         jsonb not null,                    -- prompt (rich doc, LaTeX ok)
  choices      jsonb not null default '[]'::jsonb,-- [{id,label,is_correct}]
  answer       jsonb not null default '{}'::jsonb,-- type-specific correct answer

  -- Shown after grading. This is the "learn from your mistakes" payload and is
  -- required before publish — a wrong answer with no explanation teaches nothing.
  explanation  jsonb,
  hint         jsonb,

  difficulty   smallint not null default 2 check (difficulty between 1 and 3),
  points       numeric(5,2) not null default 1 check (points > 0),
  est_seconds  int not null default 90,
  tags         text[] not null default '{}',

  -- Provenance: 'original' | 'exam' | 'manuel' | 'imported'
  source       text not null default 'original',
  source_ref   text,                              -- e.g. 'EN-2024-normale-ex2'

  status       content_status not null default 'draft',
  ai_generated boolean not null default false,
  authored_by  uuid references auth.users(id) on delete set null,
  reviewed_by  uuid references auth.users(id) on delete set null,
  reviewed_at  timestamptz,

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint question_published_needs_review
    check (status <> 'published' or reviewed_by is not null),
  constraint question_published_needs_explanation
    check (status <> 'published' or explanation is not null)
);

create trigger questions_updated_at
  before update on public.questions
  for each row execute function public.set_updated_at();

create index on public.questions (lesson_id, status);
create index on public.questions (subject_id, difficulty, status);
create index questions_tags_idx on public.questions using gin (tags);

-- Live difficulty calibration. Updated by trigger on every graded answer, so
-- the bank self-corrects: a question everyone gets right is not "difficult 3".
create table public.question_stats (
  question_id    uuid primary key references public.questions(id) on delete cascade,
  attempts       int not null default 0,
  correct        int not null default 0,
  total_seconds  bigint not null default 0,
  -- p-value (facility) and discrimination, classic item analysis
  facility       numeric(4,3),
  discrimination numeric(4,3),
  updated_at     timestamptz not null default now()
);

-- ----------------------------------------------------------------- exams ---
-- One row per real past national exam paper.
create table public.exams (
  id                 uuid primary key default gen_random_uuid(),
  filiere_subject_id uuid not null references public.filiere_subjects(id) on delete cascade,
  year               int not null check (year between 2000 and 2100),
  session            exam_session not null default 'normale',

  duration_min       int not null default 120,
  total_points       numeric(5,1) not null default 20,

  -- Storage paths (Supabase Storage, bucket 'exams')
  subject_pdf_path   text,
  corrige_pdf_path   text,

  -- Digitisation ladder. We ship 'pdf' on day one (timed PDF + corrigé +
  -- per-exercise self-scoring) and upgrade papers to 'digital' over time.
  --   pdf     -> render the PDF, student self-grades against the corrigé
  --   hybrid  -> some exercises digitised and auto-graded, rest self-graded
  --   digital -> fully digitised, auto-graded end to end
  digitisation       text not null default 'pdf'
                     check (digitisation in ('pdf', 'hybrid', 'digital')),

  instructions_fr    text,
  status             content_status not null default 'draft',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  unique (filiere_subject_id, year, session)
);

create trigger exams_updated_at
  before update on public.exams
  for each row execute function public.set_updated_at();

create index on public.exams (filiere_subject_id, year desc);

-- Exercises within a paper, so a student can self-score exercise by exercise
-- and we can still tell them "you always lose points on the chemistry part".
create table public.exam_exercises (
  id          uuid primary key default gen_random_uuid(),
  exam_id     uuid not null references public.exams(id) on delete cascade,
  position    int not null,
  label_fr    text not null,                      -- 'Exercice 1 — Mécanique'
  points      numeric(5,2) not null,
  lesson_ids  uuid[] not null default '{}',       -- what it actually tests
  corrige     jsonb,                              -- structured correction
  created_at  timestamptz not null default now(),

  unique (exam_id, position)
);

-- ----------------------------------------------------------- milestones ----
-- A milestone is the "boss fight" after a group of lessons.
create table public.milestones (
  id                 uuid primary key default gen_random_uuid(),
  filiere_subject_id uuid not null references public.filiere_subjects(id) on delete cascade,
  slug               text not null check (public.is_slug(slug)),
  title_fr           text not null,
  description_fr     text,
  lesson_ids         uuid[] not null default '{}',
  sort_order         int not null default 0,
  -- Percentage on the covering lessons' quizzes before this unlocks.
  unlock_threshold   smallint not null default 60 check (unlock_threshold between 0 and 100),
  badge_slug         text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  unique (filiere_subject_id, slug)
);

create trigger milestones_updated_at
  before update on public.milestones
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------- assessments ----
create table public.assessments (
  id                 uuid primary key default gen_random_uuid(),
  kind               assessment_kind not null,

  filiere_subject_id uuid references public.filiere_subjects(id) on delete cascade,
  lesson_id          uuid references public.lessons(id) on delete cascade,
  milestone_id       uuid references public.milestones(id) on delete cascade,
  exam_id            uuid references public.exams(id) on delete cascade,

  title_fr           text not null,
  instructions_fr    text,
  duration_min       int,                          -- null = untimed
  question_count     int not null default 10,
  pass_threshold     smallint not null default 60 check (pass_threshold between 0 and 100),
  shuffle_questions  boolean not null default true,
  shuffle_choices    boolean not null default true,
  access_tier        access_tier not null default 'premium',
  max_attempts       int,                          -- null = unlimited retakes

  status             content_status not null default 'draft',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  -- Each kind must point at exactly the right parent.
  constraint assessment_target_matches_kind check (
    (kind = 'lesson_quiz' and lesson_id    is not null and exam_id is null and milestone_id is null) or
    (kind = 'milestone'   and milestone_id is not null and exam_id is null and lesson_id    is null) or
    (kind = 'exam'        and exam_id      is not null and lesson_id is null and milestone_id is null)
  )
);

create trigger assessments_updated_at
  before update on public.assessments
  for each row execute function public.set_updated_at();

create index on public.assessments (kind, status);
create index on public.assessments (lesson_id);
create index on public.assessments (exam_id);

-- Fixed question list — used by faithful exam reproductions.
create table public.assessment_questions (
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  question_id   uuid not null references public.questions(id) on delete cascade,
  position      int not null default 0,
  points        numeric(5,2),                     -- overrides question.points
  primary key (assessment_id, question_id)
);

-- Pooled draw — used by quizzes and milestones so every retake differs.
-- `filter` shape: { lesson_ids: [], tags: [], difficulty: {min,max}, exclude_seen: true }
create table public.assessment_pools (
  id            uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  filter        jsonb not null default '{}'::jsonb,
  draw_count    int not null default 10 check (draw_count > 0),
  position      int not null default 0
);

create index on public.assessment_pools (assessment_id, position);
