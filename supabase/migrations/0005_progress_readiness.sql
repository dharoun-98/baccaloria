-- ============================================================================
-- 0005_progress_readiness.sql
-- Attempts, lesson progress, gamification, and the readiness score.
--
-- The readiness score is the product's central claim: "the data says you are
-- ready". It must therefore be honest. It blends five signals, weighted by
-- exam coefficient, so a student who has mastered Anglais (coef 2) but not
-- Maths (coef 7) is correctly told they are NOT ready.
-- ============================================================================

create type lesson_state as enum ('not_started', 'in_progress', 'completed');

-- --------------------------------------------------------------- attempts --
create table public.attempts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  assessment_id uuid not null references public.assessments(id) on delete cascade,

  state         attempt_state not null default 'in_progress',
  started_at    timestamptz not null default now(),
  submitted_at  timestamptz,
  duration_sec  int,
  time_limit_sec int,                    -- snapshot, so later config changes don't rewrite history

  score         numeric(7,2),
  max_score     numeric(7,2),
  percentage    numeric(5,2),
  passed        boolean,

  -- The exact draw this attempt saw, so a retake can avoid repeats and a
  -- review screen can replay the attempt faithfully.
  question_ids  uuid[] not null default '{}',

  -- For 'pdf' exams the student self-scores exercise by exercise:
  -- [{exercise_id, points_earned, points_max}]
  self_scores   jsonb,

  created_at    timestamptz not null default now()
);

create index on public.attempts (user_id, assessment_id, started_at desc);
create index on public.attempts (user_id, state);
create index on public.attempts (assessment_id) where state = 'graded';

-- --------------------------------------------------------- attempt answers -
create table public.attempt_answers (
  id            uuid primary key default gen_random_uuid(),
  attempt_id    uuid not null references public.attempts(id) on delete cascade,
  question_id   uuid not null references public.questions(id) on delete cascade,
  response      jsonb,
  is_correct    boolean,
  points_earned numeric(5,2) not null default 0,
  points_max    numeric(5,2) not null default 1,
  seconds_spent int,
  -- Did the student open the explanation? Feeds "you rushed past 6 corrections".
  reviewed      boolean not null default false,
  created_at    timestamptz not null default now(),

  unique (attempt_id, question_id)
);

create index on public.attempt_answers (question_id, is_correct);

-- -------------------------------------------------------- lesson progress --
create table public.lesson_progress (
  user_id       uuid not null references auth.users(id) on delete cascade,
  lesson_id     uuid not null references public.lessons(id) on delete cascade,
  state         lesson_state not null default 'not_started',
  scroll_pct    smallint not null default 0 check (scroll_pct between 0 and 100),
  seconds_spent int not null default 0,
  -- Best quiz percentage achieved on this lesson.
  best_quiz_pct numeric(5,2),
  first_seen_at timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),
  completed_at  timestamptz,

  primary key (user_id, lesson_id)
);

create index on public.lesson_progress (user_id, state);
create index on public.lesson_progress (user_id, last_seen_at desc);

-- ------------------------------------------------------- readiness score ---
create table public.readiness_scores (
  -- Surrogate key on purpose. A composite PK over (user_id, scope,
  -- filiere_subject_id) would implicitly force filiere_subject_id NOT NULL,
  -- and the 'overall' row must carry NULL there. Uniqueness is enforced by
  -- the two partial indexes below instead.
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  filiere_subject_id uuid references public.filiere_subjects(id) on delete cascade,

  -- null filiere_subject_id = the overall, coefficient-weighted score
  scope              text not null default 'subject'
                     check (scope in ('subject', 'overall')),

  coverage_pct   numeric(5,2) not null default 0,  -- lessons done, weighted by exam_frequency
  mastery_pct    numeric(5,2) not null default 0,  -- rolling quiz/milestone accuracy
  exam_pct       numeric(5,2) not null default 0,  -- past-exam simulation average
  timing_pct     numeric(5,2) not null default 0,  -- finished within the time limit
  retention_pct  numeric(5,2) not null default 0,  -- resistance to forgetting

  readiness      numeric(5,2) not null default 0,  -- the blended 0-100 headline
  band           smallint not null default 0 check (band between 0 and 4),

  computed_at    timestamptz not null default now(),

  -- Keep scope and the FK consistent with each other.
  constraint readiness_scope_matches_target check (
    (scope = 'subject' and filiere_subject_id is not null) or
    (scope = 'overall' and filiere_subject_id is null)
  )
);

create unique index readiness_subject_unique
  on public.readiness_scores (user_id, filiere_subject_id)
  where scope = 'subject';

create unique index readiness_overall_unique
  on public.readiness_scores (user_id)
  where scope = 'overall';

comment on column public.readiness_scores.band is
  '0 = pas encore la, 1 = ca avance, 2 = bonne progression, 3 = presque, 4 = pret. User-facing wording lives in messages/fr.json.';

-- ------------------------------------------------------------- streaks -----
create table public.activity_days (
  user_id  uuid not null references auth.users(id) on delete cascade,
  day      date not null,
  minutes  int not null default 0,
  xp       int not null default 0,
  primary key (user_id, day)
);

create index on public.activity_days (user_id, day desc);

-- -------------------------------------------------------------- badges -----
create table public.badges (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique check (public.is_slug(slug)),
  name_fr      text not null,
  description_fr text not null,
  icon         text not null default 'award',
  tier         smallint not null default 1 check (tier between 1 and 3),
  criteria     jsonb not null default '{}'::jsonb,
  xp_reward    int not null default 50,
  sort_order   int not null default 0
);

create table public.user_badges (
  user_id   uuid not null references auth.users(id) on delete cascade,
  badge_id  uuid not null references public.badges(id) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

-- --------------------------------------------------------- share cards -----
-- A student-published snapshot. Immutable by design: the shared page renders
-- the snapshot, never a live query, so sharing can never leak later activity.
create table public.share_cards (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  token      text not null unique default encode(gen_random_bytes(12), 'hex'),
  snapshot   jsonb not null,
  revoked    boolean not null default false,
  view_count int not null default 0,
  created_at timestamptz not null default now()
);

create index on public.share_cards (user_id, created_at desc);

-- ================================ recompute =================================
-- Recomputes every readiness row for one user. Called after an attempt is
-- graded and by a nightly cron. Weights live here, in one place, on purpose.
create or replace function public.recompute_readiness(target_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  -- Named `subj`, not `fs`: the overall query below aliases
  -- filiere_subjects, and a matching name makes every `.id` ambiguous.
  subj record;
  w_coverage  constant numeric := 0.25;
  w_mastery   constant numeric := 0.30;
  w_exam      constant numeric := 0.30;
  w_timing    constant numeric := 0.05;
  w_retention constant numeric := 0.10;
  v_filiere uuid;
begin
  select filiere_id into v_filiere from public.profiles where id = target_user;
  if v_filiere is null then
    return;
  end if;

  for subj in
    select id, coefficient
    from public.filiere_subjects
    where filiere_id = v_filiere and is_active
  loop
    with
    -- Lessons in this filiere_subject, via placements -> units.
    scope_lessons as (
      select distinct l.id, l.exam_frequency
      from public.lessons l
      join public.lesson_placements lp on lp.lesson_id = l.id
      join public.units u on u.id = lp.unit_id
      where u.filiere_subject_id = subj.id
        and l.status = 'published'
    ),
    coverage as (
      select coalesce(
        100.0 * sum(case when p.state = 'completed' then sl.exam_frequency else 0 end)
              / nullif(sum(sl.exam_frequency), 0),
      0) as pct
      from scope_lessons sl
      left join public.lesson_progress p
        on p.lesson_id = sl.id and p.user_id = target_user
    ),
    mastery as (
      select coalesce(avg(a.percentage), 0) as pct
      from public.attempts a
      join public.assessments s on s.id = a.assessment_id
      left join public.lessons l on l.id = s.lesson_id
      where a.user_id = target_user
        and a.state = 'graded'
        and s.kind in ('lesson_quiz', 'milestone')
        and (
          s.filiere_subject_id = subj.id
          or l.id in (select id from scope_lessons)
          or s.milestone_id in (
            select m.id from public.milestones m where m.filiere_subject_id = subj.id
          )
        )
    ),
    exam_perf as (
      -- Recency-weighted: the last three simulations matter most.
      select coalesce(
        sum(a.percentage * wt) / nullif(sum(wt), 0), 0) as pct,
        coalesce(100.0 * sum(case when a.duration_sec <= coalesce(a.time_limit_sec, 2147483647)
                                  then wt else 0 end) / nullif(sum(wt), 0), 0) as timing
      from (
        select a.*, power(0.75, (row_number() over (order by a.submitted_at desc)) - 1) as wt
        from public.attempts a
        join public.assessments s on s.id = a.assessment_id
        join public.exams e on e.id = s.exam_id
        where a.user_id = target_user
          and a.state = 'graded'
          and s.kind = 'exam'
          and e.filiere_subject_id = subj.id
      ) a
    ),
    retention as (
      -- Completed lessons decay if untouched for more than 30 days.
      select coalesce(avg(
        greatest(0, 100 - 1.5 * greatest(0, extract(day from now() - p.last_seen_at)::numeric - 30))
      ), 0) as pct
      from public.lesson_progress p
      where p.user_id = target_user
        and p.state = 'completed'
        and p.lesson_id in (select id from scope_lessons)
    )
    insert into public.readiness_scores (
      user_id, filiere_subject_id, scope,
      coverage_pct, mastery_pct, exam_pct, timing_pct, retention_pct,
      readiness, band, computed_at
    )
    select
      target_user, subj.id, 'subject',
      round(c.pct, 2), round(m.pct, 2), round(e.pct, 2),
      round(e.timing, 2), round(r.pct, 2),
      round(blend, 2),
      case
        when blend >= 85 then 4
        when blend >= 70 then 3
        when blend >= 50 then 2
        when blend >= 25 then 1
        else 0
      end,
      now()
    from coverage c, mastery m, exam_perf e, retention r,
    lateral (
      select least(100, greatest(0,
          w_coverage  * c.pct
        + w_mastery   * m.pct
        + w_exam      * e.pct
        + w_timing    * e.timing
        + w_retention * r.pct
      )) as blend
    ) b
    -- Targets the partial index readiness_subject_unique.
    on conflict (user_id, filiere_subject_id) where scope = 'subject' do update set
      coverage_pct  = excluded.coverage_pct,
      mastery_pct   = excluded.mastery_pct,
      exam_pct      = excluded.exam_pct,
      timing_pct    = excluded.timing_pct,
      retention_pct = excluded.retention_pct,
      readiness     = excluded.readiness,
      band          = excluded.band,
      computed_at   = excluded.computed_at;
  end loop;

  -- Overall = coefficient-weighted mean of the per-subject scores.
  insert into public.readiness_scores (
    user_id, filiere_subject_id, scope,
    coverage_pct, mastery_pct, exam_pct, timing_pct, retention_pct,
    readiness, band, computed_at
  )
  select
    target_user, null, 'overall',
    round(sum(rs.coverage_pct  * fs.coefficient) / nullif(sum(fs.coefficient), 0), 2),
    round(sum(rs.mastery_pct   * fs.coefficient) / nullif(sum(fs.coefficient), 0), 2),
    round(sum(rs.exam_pct      * fs.coefficient) / nullif(sum(fs.coefficient), 0), 2),
    round(sum(rs.timing_pct    * fs.coefficient) / nullif(sum(fs.coefficient), 0), 2),
    round(sum(rs.retention_pct * fs.coefficient) / nullif(sum(fs.coefficient), 0), 2),
    round(sum(rs.readiness     * fs.coefficient) / nullif(sum(fs.coefficient), 0), 2),
    case
      when sum(rs.readiness * fs.coefficient) / nullif(sum(fs.coefficient), 0) >= 85 then 4
      when sum(rs.readiness * fs.coefficient) / nullif(sum(fs.coefficient), 0) >= 70 then 3
      when sum(rs.readiness * fs.coefficient) / nullif(sum(fs.coefficient), 0) >= 50 then 2
      when sum(rs.readiness * fs.coefficient) / nullif(sum(fs.coefficient), 0) >= 25 then 1
      else 0
    end,
    now()
  from public.readiness_scores rs
  join public.filiere_subjects fs on fs.id = rs.filiere_subject_id
  where rs.user_id = target_user and rs.scope = 'subject'
  having sum(fs.coefficient) > 0
  -- Targets the partial index readiness_overall_unique.
  on conflict (user_id) where scope = 'overall' do update set
    coverage_pct  = excluded.coverage_pct,
    mastery_pct   = excluded.mastery_pct,
    exam_pct      = excluded.exam_pct,
    timing_pct    = excluded.timing_pct,
    retention_pct = excluded.retention_pct,
    readiness     = excluded.readiness,
    band          = excluded.band,
    computed_at   = excluded.computed_at;
end;
$$;

-- Keep item statistics honest on every graded answer.
create or replace function public.bump_question_stats()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.question_stats (question_id, attempts, correct, total_seconds, facility, updated_at)
  values (
    new.question_id, 1,
    case when new.is_correct then 1 else 0 end,
    coalesce(new.seconds_spent, 0),
    case when new.is_correct then 1 else 0 end,
    now()
  )
  on conflict (question_id) do update set
    attempts      = question_stats.attempts + 1,
    correct       = question_stats.correct + case when new.is_correct then 1 else 0 end,
    total_seconds = question_stats.total_seconds + coalesce(new.seconds_spent, 0),
    facility      = round(
                      (question_stats.correct + case when new.is_correct then 1 else 0 end)::numeric
                      / (question_stats.attempts + 1), 3),
    updated_at    = now();
  return new;
end;
$$;

create trigger attempt_answers_bump_stats
  after insert on public.attempt_answers
  for each row
  when (new.is_correct is not null)
  execute function public.bump_question_stats();
