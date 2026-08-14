-- ============================================================================
-- 0002_content.sql
-- Lessons, content blocks, mind maps, and the editorial review workflow.
--
-- Reuse model:
--   A lesson belongs to a SUBJECT, not to a filière. It is then *placed* into
--   one or more units via lesson_placements. This matters a lot for v1:
--   SE and SGC share most of "Économie générale et statistiques" and
--   "Comptabilité", so we author once and place twice. Where a programme
--   genuinely differs (Maths in PC vs Maths in SGC), we author separate
--   lessons — placement is cheap, wrong content is not.
-- ============================================================================

create type block_kind as enum (
  'resume',        -- the core summarised explanation
  'definition',
  'formula',       -- LaTeX, rendered with KaTeX
  'theorem',
  'method',        -- "méthode": numbered steps to solve a type of problem
  'example',       -- worked example
  'pitfall',       -- "erreur fréquente" — high value, students lose marks here
  'exam_tip',      -- "ce qui tombe à l'examen"
  'cheatsheet',    -- dense recap card, printable
  'callout',
  'table',
  'image',
  'video'
);

-- ---------------------------------------------------------------- lessons --
create table public.lessons (
  id           uuid primary key default gen_random_uuid(),
  subject_id   uuid not null references public.subjects(id) on delete restrict,
  slug         text not null check (public.is_slug(slug)),
  title_fr     text not null,
  title_ar     text,
  subtitle_fr  text,

  -- Learner-facing metadata that makes the "efficient prep" promise concrete.
  difficulty      smallint not null default 2 check (difficulty between 1 and 3),
  est_minutes     int      not null default 15 check (est_minutes > 0),

  -- How often this lesson has actually shown up in the last ~5 national exams.
  -- 5 = appears every year. This is what lets us tell a student
  -- "revise this first" instead of "revise everything".
  exam_frequency  smallint not null default 3 check (exam_frequency between 1 and 5),

  -- Freemium gate. A deliberate slice of lessons stays 'free' forever.
  access_tier     access_tier not null default 'premium',

  -- Learning objectives, shown as a checklist at the top of the lesson.
  objectives      jsonb not null default '[]'::jsonb,
  key_terms       jsonb not null default '[]'::jsonb,
  prerequisites   uuid[] not null default '{}',   -- other lesson ids

  -- Editorial workflow
  status          content_status not null default 'draft',
  version         int not null default 1,
  authored_by     uuid references auth.users(id) on delete set null,
  reviewed_by     uuid references auth.users(id) on delete set null,
  reviewed_at     timestamptz,
  published_at    timestamptz,
  -- Set when the draft came from the AI pipeline rather than a human author.
  -- Never publish an ai_generated lesson without reviewed_by. Enforced below.
  ai_generated    boolean not null default false,
  review_notes    text,

  search_text     text,   -- maintained by trigger, feeds trigram search

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  unique (subject_id, slug),

  -- Editorial safety rail: nothing reaches students unreviewed.
  constraint lesson_published_needs_review
    check (status <> 'published' or reviewed_by is not null)
);

create trigger lessons_updated_at
  before update on public.lessons
  for each row execute function public.set_updated_at();

create index on public.lessons (subject_id, status);
create index on public.lessons (status) where status = 'in_review';
create index lessons_search_idx on public.lessons using gin (search_text gin_trgm_ops);

comment on constraint lesson_published_needs_review on public.lessons is
  'A lesson cannot be published without a named reviewer. This is the whole point of the AI-draft pipeline: a human is always accountable for what students read.';

-- ------------------------------------------------------- lesson placement --
create table public.lesson_placements (
  id          uuid primary key default gen_random_uuid(),
  lesson_id   uuid not null references public.lessons(id) on delete cascade,
  unit_id     uuid not null references public.units(id) on delete cascade,
  sort_order  int not null default 0,
  -- Optional per-placement note, e.g. "hors programme SGC: partie 3 seulement"
  scope_note  text,
  created_at  timestamptz not null default now(),

  unique (lesson_id, unit_id)
);

create index on public.lesson_placements (unit_id, sort_order);

-- --------------------------------------------------------- lesson blocks ---
-- Rich content stored as ordered blocks. `content` is a TipTap/ProseMirror doc
-- for prose kinds, or a kind-specific shape (see docs/content-model.md).
create table public.lesson_blocks (
  id          uuid primary key default gen_random_uuid(),
  lesson_id   uuid not null references public.lessons(id) on delete cascade,
  kind        block_kind not null,
  title_fr    text,
  content     jsonb not null default '{}'::jsonb,
  position    int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger lesson_blocks_updated_at
  before update on public.lesson_blocks
  for each row execute function public.set_updated_at();

create index on public.lesson_blocks (lesson_id, position);

-- --------------------------------------------------------------- mindmaps --
-- Kept separate from blocks: a mind map is a graph, not a document, and the
-- builder UI and the renderer both want it whole.
create table public.mindmaps (
  id          uuid primary key default gen_random_uuid(),
  lesson_id   uuid references public.lessons(id) on delete cascade,
  unit_id     uuid references public.units(id) on delete cascade,
  title_fr    text not null,
  -- { "root": { "id","label","children":[...] }, "layout": "radial"|"tree" }
  data        jsonb not null default '{}'::jsonb,
  status      content_status not null default 'draft',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  -- A mind map summarises exactly one thing: a lesson OR a whole unit.
  constraint mindmap_target_exactly_one
    check ((lesson_id is not null)::int + (unit_id is not null)::int = 1)
);

create trigger mindmaps_updated_at
  before update on public.mindmaps
  for each row execute function public.set_updated_at();

create index on public.mindmaps (lesson_id);
create index on public.mindmaps (unit_id);

-- ------------------------------------------------------- content revisions -
-- Every publish snapshots the lesson so an editor can diff and roll back.
create table public.lesson_revisions (
  id          uuid primary key default gen_random_uuid(),
  lesson_id   uuid not null references public.lessons(id) on delete cascade,
  version     int not null,
  snapshot    jsonb not null,        -- { lesson, blocks, mindmaps }
  created_by  uuid references auth.users(id) on delete set null,
  note        text,
  created_at  timestamptz not null default now(),

  unique (lesson_id, version)
);

create index on public.lesson_revisions (lesson_id, version desc);

-- ------------------------------------------------ search_text maintenance --
create or replace function public.lessons_refresh_search_text()
returns trigger
language plpgsql
as $$
begin
  new.search_text :=
    coalesce(new.title_fr, '') || ' ' ||
    coalesce(new.subtitle_fr, '') || ' ' ||
    coalesce(array_to_string(
      array(select jsonb_array_elements_text(new.key_terms)), ' '), '');
  return new;
end;
$$;

create trigger lessons_search_text
  before insert or update of title_fr, subtitle_fr, key_terms on public.lessons
  for each row execute function public.lessons_refresh_search_text();
