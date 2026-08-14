-- ============================================================================
-- seed.sql — curriculum taxonomy for v1 (PC, SE, SGC) + plans + badges.
--
-- ⚠️  COEFFICIENTS ARE UNVERIFIED PLACEHOLDERS.
--     Every filiere_subjects row below is inserted with
--     coefficient_verified = false on purpose.
--
--     Coefficients and exam durations are fixed each year by the Ministère de
--     l'Éducation Nationale. They drive the readiness score, the "where you
--     gain the most points" advice, and the whole revision strategy we sell —
--     so a wrong number here is not cosmetic, it actively misleads students.
--
--     Before launch: check each one against the official arrêté / the Cadre de
--     Référence for the current school year, correct it, and flip
--     coefficient_verified to true. The admin panel lists everything still
--     unverified.
-- ============================================================================

-- ------------------------------------------------------------- filieres ----
insert into public.filieres (slug, code, name_fr, name_ar, pole, color, icon, sort_order, is_active)
values
  ('sciences-physiques', 'PC',  'Sciences Physiques',            'العلوم الفيزيائية',        'sciences',   '#0F766E', 'atom',       1, true),
  ('sciences-economiques','SE', 'Sciences Économiques',          'العلوم الاقتصادية',        'economie',   '#B45309', 'trending-up',2, true),
  ('sciences-gestion',   'SGC', 'Sciences de Gestion Comptable', 'علوم التدبير المحاسباتي',  'economie',   '#7C2D12', 'calculator', 3, true),

  -- Roadmap: structure exists so the catalogue can advertise them, but
  -- is_active = false keeps them out of the app until content is ready.
  ('sciences-vie-terre', 'SVT', 'Sciences de la Vie et de la Terre', 'علوم الحياة والأرض',  'sciences',   '#15803D', 'leaf',       4, false),
  ('sciences-maths-a',   'SMA', 'Sciences Mathématiques A',      'العلوم الرياضية أ',        'sciences',   '#1D4ED8', 'sigma',      5, false),
  ('sciences-maths-b',   'SMB', 'Sciences Mathématiques B',      'العلوم الرياضية ب',        'sciences',   '#4338CA', 'sigma',      6, false),
  ('techniques-electriques','STE','Sciences et Technologies Électriques', 'العلوم والتكنولوجيات الكهربائية', 'techniques', '#0E7490', 'zap', 7, false),
  ('techniques-mecaniques','STM','Sciences et Technologies Mécaniques',   'العلوم والتكنولوجيات الميكانيكية','techniques', '#475569', 'cog', 8, false)
on conflict (slug) do nothing;

-- ------------------------------------------------------------- subjects ----
insert into public.subjects (slug, name_fr, name_ar, short_name, color, icon)
values
  ('mathematiques',        'Mathématiques',                      'الرياضيات',              'Maths',   '#1D4ED8', 'sigma'),
  ('physique-chimie',      'Physique-Chimie',                    'الفيزياء والكيمياء',     'PC',      '#0F766E', 'atom'),
  ('svt',                  'Sciences de la Vie et de la Terre',  'علوم الحياة والأرض',     'SVT',     '#15803D', 'leaf'),
  ('philosophie',          'Philosophie',                        'الفلسفة',                'Philo',   '#7C3AED', 'brain'),
  ('anglais',              'Anglais',                            'الإنجليزية',             'Anglais', '#DB2777', 'languages'),
  ('economie-statistiques','Économie Générale et Statistiques',  'الاقتصاد العام والإحصاء','Éco',     '#B45309', 'trending-up'),
  ('comptabilite',         'Comptabilité et Mathématiques Financières', 'المحاسبة والرياضيات المالية', 'Compta', '#7C2D12', 'calculator')
on conflict (slug) do nothing;

-- ------------------------------------------------------ filiere_subjects ---
-- PC — Sciences Physiques
insert into public.filiere_subjects
  (filiere_id, subject_id, coefficient, exam_duration_min, sort_order, coefficient_verified)
select f.id, s.id, v.coef, v.mins, v.ord, false
from public.filieres f
join (values
  ('mathematiques',   7.0, 240, 1),
  ('physique-chimie', 7.0, 180, 2),
  ('svt',             5.0, 120, 3),
  ('philosophie',     2.0, 120, 4),
  ('anglais',         2.0, 120, 5)
) as v(subject_slug, coef, mins, ord) on true
join public.subjects s on s.slug = v.subject_slug
where f.code = 'PC'
on conflict (filiere_id, subject_id) do nothing;

-- SE — Sciences Économiques
insert into public.filiere_subjects
  (filiere_id, subject_id, coefficient, exam_duration_min, sort_order, coefficient_verified)
select f.id, s.id, v.coef, v.mins, v.ord, false
from public.filieres f
join (values
  ('economie-statistiques', 6.0, 180, 1),
  ('comptabilite',          4.0, 180, 2),
  ('mathematiques',         4.0, 180, 3),
  ('philosophie',           2.0, 120, 4),
  ('anglais',               2.0, 120, 5)
) as v(subject_slug, coef, mins, ord) on true
join public.subjects s on s.slug = v.subject_slug
where f.code = 'SE'
on conflict (filiere_id, subject_id) do nothing;

-- SGC — Sciences de Gestion Comptable
insert into public.filiere_subjects
  (filiere_id, subject_id, coefficient, exam_duration_min, sort_order, coefficient_verified)
select f.id, s.id, v.coef, v.mins, v.ord, false
from public.filieres f
join (values
  ('comptabilite',          6.0, 240, 1),
  ('economie-statistiques', 4.0, 180, 2),
  ('mathematiques',         4.0, 180, 3),
  ('philosophie',           2.0, 120, 4),
  ('anglais',               2.0, 120, 5)
) as v(subject_slug, coef, mins, ord) on true
join public.subjects s on s.slug = v.subject_slug
where f.code = 'SGC'
on conflict (filiere_id, subject_id) do nothing;

-- --------------------------------------------------------- exam calendar ---
-- Estimated: the Examen National (session normale) usually falls in the first
-- half of June. is_confirmed stays false until MEN publishes the real dates,
-- and the UI labels the countdown "date estimée" while that is the case.
insert into public.exam_calendar (filiere_subject_id, exam_year, session, exam_date, is_confirmed)
select fs.id, 2027, 'normale', date '2027-06-07' + (fs.sort_order - 1), false
from public.filiere_subjects fs
join public.filieres f on f.id = fs.filiere_id
where f.is_active
on conflict (filiere_subject_id, exam_year, session) do nothing;

-- ----------------------------------------------------------------- plans ---
-- ⚠️ Placeholder pricing — set the real numbers before launch.
insert into public.plans (slug, name_fr, description_fr, price_mad, duration_days, valid_until_exam, features, sort_order, is_active)
values
  (
    'gratuit', 'Gratuit',
    'Découvre la plateforme et travaille les leçons offertes.',
    0, 3650, false,
    '["Leçons essentielles offertes","Quiz de ces leçons","Suivi de progression de base"]'::jsonb,
    1, true
  ),
  (
    'annee-examen', 'Premium — jusqu''à l''examen',
    'Tout le programme de ta filière, jusqu''au jour de l''Examen National.',
    699, null, true,
    '["Tout le programme résumé","Fiches mémo et cartes mentales","Banque d''exercices complète","Tests de palier","Examens nationaux corrigés","Tableau de bord complet","Partage de progression"]'::jsonb,
    2, true
  ),
  (
    'trimestre', 'Premium — 3 mois',
    'Accès complet pendant 90 jours.',
    299, 90, false,
    '["Tout le programme résumé","Fiches mémo et cartes mentales","Banque d''exercices complète","Tests de palier","Examens nationaux corrigés","Tableau de bord complet"]'::jsonb,
    3, true
  )
on conflict (slug) do nothing;

-- ---------------------------------------------------------------- badges ---
insert into public.badges (slug, name_fr, description_fr, icon, tier, criteria, xp_reward, sort_order)
values
  ('premier-pas',      'Premier pas',        'Tu as terminé ta première leçon.',                     'footprints', 1, '{"lessons_completed":1}'::jsonb,   25, 1),
  ('serie-7',          'Une semaine pleine', 'Sept jours de travail d''affilée.',                    'flame',      1, '{"streak_days":7}'::jsonb,         50, 2),
  ('serie-30',         'Régularité',         'Trente jours d''affilée. C''est ça qui fait la différence.', 'flame', 2, '{"streak_days":30}'::jsonb,      200, 3),
  ('quiz-parfait',     'Sans faute',         'Un quiz réussi à 100%.',                               'target',     1, '{"perfect_quiz":1}'::jsonb,        40, 4),
  ('palier-1',         'Premier palier',     'Ton premier test de palier validé.',                   'flag',       1, '{"milestones_passed":1}'::jsonb,   75, 5),
  ('premier-examen',   'Baptême du feu',     'Tu as passé ton premier examen national blanc.',       'clipboard-check', 2, '{"exams_attempted":1}'::jsonb, 100, 6),
  ('dans-les-temps',   'Dans les temps',     'Un examen blanc terminé avant la fin du chronomètre.', 'timer',      2, '{"exam_within_time":1}'::jsonb,   100, 7),
  ('mention-bien',     'Mention Bien',       'Plus de 14/20 à un examen blanc.',                     'award',      3, '{"exam_score_gte":70}'::jsonb,    250, 8),
  ('mention-tres-bien','Mention Très Bien',  'Plus de 16/20 à un examen blanc.',                     'trophy',     3, '{"exam_score_gte":80}'::jsonb,    400, 9),
  ('pret',             'Prêt pour le Bac',   'Ton score de préparation a dépassé 85%.',              'rocket',     3, '{"readiness_gte":85}'::jsonb,     500, 10)
on conflict (slug) do nothing;
