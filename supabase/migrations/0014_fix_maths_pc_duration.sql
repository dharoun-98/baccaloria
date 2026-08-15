-- ============================================================================
-- 0014_fix_maths_pc_duration.sql
--
-- The Maths PC paper lasts 3 hours, not 4.
--
-- The seeded value was an estimate. The actual papers state it explicitly —
-- « مدة الإنجاز 3h » on the 2023 and 2024 subjects, both checked directly.
--
-- This is not cosmetic. The exam simulator counts down from this figure and
-- reports whether the student finished in time. An extra hour makes
-- "dans les temps" meaningless, and time management is one of the five signals
-- feeding the readiness score — so the dashboard would have been flattering
-- students on exactly the skill the real exam punishes hardest.
-- ============================================================================

update public.filiere_subjects fs
set exam_duration_min = 180
from public.filieres f, public.subjects s
where fs.filiere_id = f.id
  and fs.subject_id = s.id
  and f.code = 'PC'
  and s.slug = 'mathematiques';

-- Papers already imported carry a copy of the duration.
update public.exams e
set duration_min = 180
from public.filiere_subjects fs, public.filieres f, public.subjects s
where e.filiere_subject_id = fs.id
  and fs.filiere_id = f.id
  and fs.subject_id = s.id
  and f.code = 'PC'
  and s.slug = 'mathematiques';

-- Attempts already taken keep the limit they were run under: rewriting history
-- would retroactively mark a student late on an exam they finished in time.

-- Verified against the papers, so the flag can be set for this row.
update public.filiere_subjects fs
set coefficient_verified = true
from public.filieres f, public.subjects s
where fs.filiere_id = f.id
  and fs.subject_id = s.id
  and f.code = 'PC'
  and s.slug = 'mathematiques';
