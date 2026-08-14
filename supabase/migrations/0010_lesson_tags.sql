-- ============================================================================
-- 0010_lesson_tags.sql
-- Free-form tags on lessons, for finding content across subjects and filières.
--
-- Why a separate column from key_terms: key_terms are shown to the STUDENT as
-- the vocabulary of the lesson. Tags are an EDITORIAL tool — "à relire",
-- "démonstration", "tombe souvent", "adapté de PC" — and the two lists diverge
-- immediately if forced into one field.
--
-- Reminder on the sharing model this supports (unchanged since 0002):
--   A lesson belongs to a SUBJECT and is *placed* into one or more units via
--   lesson_placements. Philosophie and Anglais are genuinely identical across
--   PC, SE and SGC — author once, place three times. Maths is not: SE and SGC
--   omit whole chapters and treat others differently, so those are separate
--   lessons that happen to share a subject. The schema allows both without
--   forcing either.
-- ============================================================================

alter table public.lessons
  add column if not exists tags text[] not null default '{}';

create index if not exists lessons_tags_idx
  on public.lessons using gin (tags);

comment on column public.lessons.tags is
  'Editorial tags for filtering in the admin panel. Not shown to students — use key_terms for that.';

-- Tags also help find a lesson to reuse. Placement counts per lesson make
-- "which filières already show this?" answerable in one query.
create or replace view public.lesson_admin_overview as
select
  l.id,
  l.slug,
  l.title_fr,
  l.subtitle_fr,
  l.status,
  l.ai_generated,
  l.reviewed_by,
  l.access_tier,
  l.exam_frequency,
  l.difficulty,
  l.tags,
  l.updated_at,
  l.subject_id,
  s.name_fr  as subject_name,
  s.color    as subject_color,
  coalesce(
    array_agg(distinct f.code) filter (where f.code is not null),
    '{}'
  ) as filiere_codes,
  count(distinct lp.unit_id) as placement_count,
  count(distinct lb.id)      as block_count
from public.lessons l
join public.subjects s on s.id = l.subject_id
left join public.lesson_placements lp on lp.lesson_id = l.id
left join public.units u on u.id = lp.unit_id
left join public.filiere_subjects fs on fs.id = u.filiere_subject_id
left join public.filieres f on f.id = fs.filiere_id
left join public.lesson_blocks lb on lb.lesson_id = l.id
group by l.id, s.name_fr, s.color;

comment on view public.lesson_admin_overview is
  'Admin listing: one row per lesson with its subject, the filière codes it is placed in, and block count. Inherits RLS from lessons (staff see everything).';

grant select on public.lesson_admin_overview to authenticated;
