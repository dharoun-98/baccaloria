-- ============================================================================
-- 0001_foundations.sql
-- Extensions, enums, shared helpers and the curriculum taxonomy.
--
-- Taxonomy model, in plain terms:
--   filiere            -- 2 Bac PC, 2 Bac SE, 2 Bac SGC, ...
--   subject            -- Mathématiques, Physique-Chimie, Comptabilité, ...
--   filiere_subject    -- the JOIN is the real unit of study. It carries the
--                         coefficient and exam duration, because the same
--                         subject counts very differently per filière
--                         (Maths is coef 7 in PC but 3 in SGC).
-- Everything downstream (units, lessons, exams, progress) hangs off
-- filiere_subject, never off subject alone.
-- ============================================================================

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- ---------------------------------------------------------------- enums ----
create type filiere_pole as enum ('sciences', 'economie', 'techniques', 'lettres');

create type content_status as enum (
  'draft',              -- being written (AI draft lands here)
  'in_review',          -- submitted to a teacher for validation
  'changes_requested',  -- reviewer bounced it back
  'published',
  'archived'
);

create type access_tier as enum ('free', 'premium');

create type user_role as enum ('student', 'teacher', 'editor', 'admin');

-- ------------------------------------------------------------- helpers ----
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at is
  'Generic updated_at trigger. Attach with: create trigger ... execute function public.set_updated_at()';

-- Slug guard: lowercase, digits, hyphens. Used as a CHECK across the schema.
create or replace function public.is_slug(v text)
returns boolean
language sql
immutable
as $$
  select v ~ '^[a-z0-9]+(-[a-z0-9]+)*$';
$$;

-- --------------------------------------------------------------- filiere ---
create table public.filieres (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (public.is_slug(slug)),
  code        text not null unique,              -- 'PC', 'SE', 'SGC'
  name_fr     text not null,
  name_ar     text,
  pole        filiere_pole not null,
  description_fr text,
  -- Visual identity per filière, so the app can theme itself on selection.
  color       text not null default '#0F766E',
  icon        text,
  sort_order  int not null default 0,
  is_active   boolean not null default false,    -- v1 ships PC, SE, SGC only
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger filieres_updated_at
  before update on public.filieres
  for each row execute function public.set_updated_at();

comment on table public.filieres is
  '2ème année Baccalauréat streams. is_active gates which ones appear in the app.';

-- --------------------------------------------------------------- subject ---
create table public.subjects (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (public.is_slug(slug)),
  name_fr     text not null,
  name_ar     text,
  short_name  text,                              -- 'PC', 'SVT', 'Compta'
  color       text not null default '#334155',
  icon        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger subjects_updated_at
  before update on public.subjects
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------- filiere_subject ---
-- The pivot that carries exam weight. This is the spine of the whole app.
create table public.filiere_subjects (
  id             uuid primary key default gen_random_uuid(),
  filiere_id     uuid not null references public.filieres(id) on delete cascade,
  subject_id     uuid not null references public.subjects(id) on delete restrict,

  -- Exam mechanics. Coefficients differ per filière and are set each year by
  -- the Ministère de l'Éducation Nationale, so they are DATA, never constants.
  coefficient       numeric(4,1) not null check (coefficient > 0),
  exam_duration_min int          not null default 120 check (exam_duration_min between 30 and 300),
  exam_total_points numeric(5,1) not null default 20,

  -- 'national' = Examen National (2 Bac, 50% of the final grade)
  -- 'regional' = Examen Régional (1 Bac, 25%)
  exam_scope     text not null default 'national'
                 check (exam_scope in ('national', 'regional')),

  -- Set true once a teacher has verified the coefficient against the official
  -- arrêté for the current school year. Surfaced in the admin panel.
  coefficient_verified boolean not null default false,

  sort_order     int not null default 0,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  unique (filiere_id, subject_id)
);

create trigger filiere_subjects_updated_at
  before update on public.filiere_subjects
  for each row execute function public.set_updated_at();

create index on public.filiere_subjects (filiere_id, sort_order);

comment on column public.filiere_subjects.coefficient is
  'Exam coefficient for this subject in this filière. Drives coefficient-weighted progress and the readiness score. MUST be verified against the official MEN arrêté each year.';

-- ------------------------------------------------------------ exam dates ---
-- Countdown target. Per filiere_subject because subjects sit on different days.
create table public.exam_calendar (
  id                 uuid primary key default gen_random_uuid(),
  filiere_subject_id uuid not null references public.filiere_subjects(id) on delete cascade,
  exam_year          int  not null,              -- 2027 = session of June 2027
  session            text not null default 'normale'
                     check (session in ('normale', 'rattrapage')),
  exam_date          date not null,
  starts_at          time,
  is_confirmed       boolean not null default false,  -- MEN published the official date
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  unique (filiere_subject_id, exam_year, session)
);

create trigger exam_calendar_updated_at
  before update on public.exam_calendar
  for each row execute function public.set_updated_at();

create index on public.exam_calendar (exam_year, exam_date);

comment on table public.exam_calendar is
  'Drives the countdown. Dates are estimates until MEN publishes them (is_confirmed).';

-- ------------------------------------------------------------------ units --
-- A unit is a chapter/partie inside a filiere_subject. Lessons live under it.
create table public.units (
  id                 uuid primary key default gen_random_uuid(),
  filiere_subject_id uuid not null references public.filiere_subjects(id) on delete cascade,
  slug               text not null check (public.is_slug(slug)),
  title_fr           text not null,
  title_ar           text,
  description_fr     text,
  sort_order         int not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  unique (filiere_subject_id, slug)
);

create trigger units_updated_at
  before update on public.units
  for each row execute function public.set_updated_at();

create index on public.units (filiere_subject_id, sort_order);
