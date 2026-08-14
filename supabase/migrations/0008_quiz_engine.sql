-- ============================================================================
-- 0008_quiz_engine.sql
-- Server-side question draw and grading.
--
-- Students have NO select privilege on public.questions (see 0006_rls.sql),
-- because that table holds `answer` and `explanation` — one REST call would
-- otherwise dump the entire answer key. These two functions are the only way
-- in, and they are the whole security model of the assessment system:
--
--   start_attempt()   returns questions with the answer key STRIPPED
--   submit_attempt()  grades in the database and only then reveals corrections
--
-- Grading never happens in the browser. A score computed client-side is a
-- score the client can choose, and the readiness figure we sell would be
-- fiction.
-- ============================================================================

-- ---------------------------------------------------------- sanitisation ---
-- Removes is_correct from a choices array, optionally shuffling.
create or replace function public.strip_choice_answers(
  choices jsonb,
  shuffle boolean default false
)
returns jsonb
language sql
immutable
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object('id', c->>'id', 'label', c->>'label')
      order by case when shuffle then random() else 0 end
    ),
    '[]'::jsonb
  )
  from jsonb_array_elements(coalesce(choices, '[]'::jsonb)) c;
$$;

comment on function public.strip_choice_answers is
  'Drops is_correct so the answer key never reaches the browser before submission.';

-- ============================================================ start ========
create or replace function public.start_attempt(p_assessment_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user       uuid := auth.uid();
  v_assessment record;
  v_attempt_id uuid;
  v_question_ids uuid[];
  v_attempt_count int;
  v_questions  jsonb;
begin
  if v_user is null then
    raise exception 'Non authentifié.' using errcode = '28000';
  end if;

  select * into v_assessment
  from public.assessments a
  where a.id = p_assessment_id and a.status = 'published';

  if not found then
    raise exception 'Évaluation introuvable.' using errcode = 'P0002';
  end if;

  -- Paywall, enforced here rather than trusted from the UI.
  if v_assessment.access_tier = 'premium' and not public.has_premium_access(v_user) then
    raise exception 'Abonnement requis.' using errcode = '42501';
  end if;

  if v_assessment.max_attempts is not null then
    select count(*) into v_attempt_count
    from public.attempts att
    where att.user_id = v_user
      and att.assessment_id = p_assessment_id
      and att.state in ('submitted', 'graded');

    if v_attempt_count >= v_assessment.max_attempts then
      raise exception 'Nombre de tentatives épuisé.' using errcode = '42501';
    end if;
  end if;

  -- Abandon any attempt left hanging on this assessment, so a student who
  -- closed the tab is not blocked and history stays truthful.
  update public.attempts
  set state = 'abandoned'
  where user_id = v_user
    and assessment_id = p_assessment_id
    and state = 'in_progress';

  -- Fixed list (faithful past-exam reproductions) takes precedence over pools.
  select array_agg(aq.question_id order by aq.position)
  into v_question_ids
  from public.assessment_questions aq
  join public.questions q on q.id = aq.question_id and q.status = 'published'
  where aq.assessment_id = p_assessment_id;

  -- Otherwise draw at random from the bank, so every retake differs.
  if v_question_ids is null or cardinality(v_question_ids) = 0 then
    select array_agg(picked.id)
    into v_question_ids
    from (
      select q.id
      from public.assessment_pools p
      cross join lateral (
        select q2.*
        from public.questions q2
        where q2.status = 'published'
          and (
            p.filter->'lesson_ids' is null
            or q2.lesson_id in (
              select (value #>> '{}')::uuid
              from jsonb_array_elements(p.filter->'lesson_ids')
            )
          )
          and (
            p.filter->'subject_id' is null
            or q2.subject_id = (p.filter->>'subject_id')::uuid
          )
          and (
            p.filter->'tags' is null
            or q2.tags && (
              select array_agg(value #>> '{}')
              from jsonb_array_elements(p.filter->'tags')
            )
          )
        order by random()
        limit p.draw_count
      ) q
      where p.assessment_id = p_assessment_id
    ) picked;
  end if;

  if v_question_ids is null or cardinality(v_question_ids) = 0 then
    raise exception 'Aucune question disponible pour cette évaluation.'
      using errcode = 'P0002';
  end if;

  insert into public.attempts (
    user_id, assessment_id, state, question_ids, time_limit_sec, max_score
  )
  values (
    v_user,
    p_assessment_id,
    'in_progress',
    v_question_ids,
    case when v_assessment.duration_min is not null
         then v_assessment.duration_min * 60 end,
    (select sum(q.points) from public.questions q where q.id = any(v_question_ids))
  )
  returning id into v_attempt_id;

  -- Answer key stripped. `explanation` is deliberately not selected at all.
  select jsonb_agg(
    jsonb_build_object(
      'id', q.id,
      'type', q.type,
      'stem', q.stem,
      'choices', public.strip_choice_answers(q.choices, v_assessment.shuffle_choices),
      'points', q.points,
      'est_seconds', q.est_seconds,
      'hint', q.hint
    )
    order by array_position(v_question_ids, q.id)
  )
  into v_questions
  from public.questions q
  where q.id = any(v_question_ids);

  return jsonb_build_object(
    'attempt_id', v_attempt_id,
    'title', v_assessment.title_fr,
    'instructions', v_assessment.instructions_fr,
    'duration_min', v_assessment.duration_min,
    'pass_threshold', v_assessment.pass_threshold,
    'questions', v_questions
  );
end;
$$;

-- =========================================================== submit ========
-- p_answers: [{ "question_id": uuid, "response": {...}, "seconds_spent": int }]
create or replace function public.submit_attempt(
  p_attempt_id uuid,
  p_answers jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user     uuid := auth.uid();
  v_attempt  record;
  v_assessment record;
  v_qid      uuid;
  v_question record;
  v_answer   jsonb;
  v_response jsonb;
  v_correct  boolean;
  v_earned   numeric;
  v_score    numeric := 0;
  v_max      numeric := 0;
  v_pct      numeric;
  v_duration int;
  v_results  jsonb;
  v_given    text[];
  v_expected text[];
begin
  if v_user is null then
    raise exception 'Non authentifié.' using errcode = '28000';
  end if;

  select * into v_attempt
  from public.attempts a
  where a.id = p_attempt_id;

  if not found then
    raise exception 'Tentative introuvable.' using errcode = 'P0002';
  end if;

  -- Ownership check. Without this, any authenticated user could submit
  -- answers into somebody else's attempt.
  if v_attempt.user_id <> v_user then
    raise exception 'Cette tentative ne t''appartient pas.' using errcode = '42501';
  end if;

  if v_attempt.state <> 'in_progress' then
    raise exception 'Cette tentative est déjà terminée.' using errcode = '22023';
  end if;

  select * into v_assessment
  from public.assessments where id = v_attempt.assessment_id;

  v_duration := greatest(0, extract(epoch from (now() - v_attempt.started_at))::int);

  -- Grade only the questions actually drawn for this attempt. Anything else in
  -- the payload is ignored, so a client cannot inject easy questions.
  foreach v_qid in array v_attempt.question_ids loop
    select * into v_question from public.questions q where q.id = v_qid;
    continue when not found;

    select a->'response'
    into v_response
    from jsonb_array_elements(coalesce(p_answers, '[]'::jsonb)) a
    where (a->>'question_id')::uuid = v_qid
    limit 1;

    v_correct := false;

    if v_response is not null then
      case v_question.type
        when 'mcq_single', 'true_false' then
          v_correct := (v_response->>'choice') is not null
                    and (v_response->>'choice') = (v_question.answer->>'choice');

        when 'mcq_multi' then
          select coalesce(array_agg(value #>> '{}' order by value #>> '{}'), '{}')
          into v_given
          from jsonb_array_elements(coalesce(v_response->'choices', '[]'::jsonb));

          select coalesce(array_agg(value #>> '{}' order by value #>> '{}'), '{}')
          into v_expected
          from jsonb_array_elements(coalesce(v_question.answer->'choices', '[]'::jsonb));

          v_correct := v_given = v_expected;

        when 'numeric' then
          v_correct := (v_response->>'value') is not null
                    and abs(
                          (v_response->>'value')::numeric
                          - (v_question.answer->>'value')::numeric
                        ) <= coalesce((v_question.answer->>'tolerance')::numeric, 0.001);

        when 'short_text' then
          v_correct := lower(trim(coalesce(v_response->>'text', '')))
                     = lower(trim(coalesce(v_question.answer->>'text', '')));

        else
          -- 'open' and anything else is not auto-gradable; it scores zero here
          -- and is surfaced for self-assessment against the corrigé.
          v_correct := false;
      end case;
    end if;

    v_earned := case when v_correct then v_question.points else 0 end;
    v_score := v_score + v_earned;
    v_max := v_max + v_question.points;

    insert into public.attempt_answers (
      attempt_id, question_id, response, is_correct, points_earned, points_max,
      seconds_spent
    )
    values (
      p_attempt_id, v_qid, v_response, v_correct, v_earned, v_question.points,
      (
        select (a->>'seconds_spent')::int
        from jsonb_array_elements(coalesce(p_answers, '[]'::jsonb)) a
        where (a->>'question_id')::uuid = v_qid
        limit 1
      )
    )
    on conflict (attempt_id, question_id) do update set
      response      = excluded.response,
      is_correct    = excluded.is_correct,
      points_earned = excluded.points_earned;
  end loop;

  v_pct := case when v_max > 0 then round(100.0 * v_score / v_max, 2) else 0 end;

  update public.attempts
  set state        = 'graded',
      submitted_at = now(),
      duration_sec = v_duration,
      score        = v_score,
      max_score    = v_max,
      percentage   = v_pct,
      passed       = v_pct >= coalesce(v_assessment.pass_threshold, 60)
  where id = p_attempt_id;

  -- Keep the best quiz score per lesson, for the subject progress view.
  if v_assessment.kind = 'lesson_quiz' and v_assessment.lesson_id is not null then
    insert into public.lesson_progress (user_id, lesson_id, state, best_quiz_pct, last_seen_at)
    values (v_user, v_assessment.lesson_id, 'in_progress', v_pct, now())
    on conflict (user_id, lesson_id) do update set
      best_quiz_pct = greatest(coalesce(lesson_progress.best_quiz_pct, 0), v_pct),
      last_seen_at  = now();
  end if;

  perform public.recompute_readiness(v_user);

  -- NOW the corrections are revealed — after grading, never before.
  select jsonb_agg(
    jsonb_build_object(
      'question_id', q.id,
      'stem', q.stem,
      'type', q.type,
      'choices', q.choices,
      'answer', q.answer,
      'explanation', q.explanation,
      'response', aa.response,
      'is_correct', aa.is_correct,
      'points_earned', aa.points_earned,
      'points_max', aa.points_max
    )
    order by array_position(v_attempt.question_ids, q.id)
  )
  into v_results
  from public.attempt_answers aa
  join public.questions q on q.id = aa.question_id
  where aa.attempt_id = p_attempt_id;

  return jsonb_build_object(
    'attempt_id', p_attempt_id,
    'score', v_score,
    'max_score', v_max,
    'percentage', v_pct,
    'passed', v_pct >= coalesce(v_assessment.pass_threshold, 60),
    'duration_sec', v_duration,
    'time_limit_sec', v_attempt.time_limit_sec,
    'results', coalesce(v_results, '[]'::jsonb)
  );
end;
$$;

-- ------------------------------------------------------------ review ------
-- Re-read a finished attempt (revision, or a refreshed results page).
create or replace function public.get_attempt_results(p_attempt_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user    uuid := auth.uid();
  v_attempt record;
  v_results jsonb;
begin
  select * into v_attempt from public.attempts a where a.id = p_attempt_id;

  if not found then
    raise exception 'Tentative introuvable.' using errcode = 'P0002';
  end if;

  if v_attempt.user_id <> v_user and not public.is_staff(v_user) then
    raise exception 'Accès refusé.' using errcode = '42501';
  end if;

  -- Corrections stay hidden while the attempt is still open.
  if v_attempt.state = 'in_progress' then
    raise exception 'Tentative encore en cours.' using errcode = '22023';
  end if;

  select jsonb_agg(
    jsonb_build_object(
      'question_id', q.id,
      'stem', q.stem,
      'type', q.type,
      'choices', q.choices,
      'answer', q.answer,
      'explanation', q.explanation,
      'response', aa.response,
      'is_correct', aa.is_correct,
      'points_earned', aa.points_earned,
      'points_max', aa.points_max
    )
    order by array_position(v_attempt.question_ids, q.id)
  )
  into v_results
  from public.attempt_answers aa
  join public.questions q on q.id = aa.question_id
  where aa.attempt_id = p_attempt_id;

  return jsonb_build_object(
    'attempt_id', p_attempt_id,
    'score', v_attempt.score,
    'max_score', v_attempt.max_score,
    'percentage', v_attempt.percentage,
    'passed', v_attempt.passed,
    'duration_sec', v_attempt.duration_sec,
    'time_limit_sec', v_attempt.time_limit_sec,
    'results', coalesce(v_results, '[]'::jsonb)
  );
end;
$$;

-- --------------------------------------------------------------- grants ---
revoke all on function public.start_attempt(uuid) from public;
revoke all on function public.submit_attempt(uuid, jsonb) from public;
revoke all on function public.get_attempt_results(uuid) from public;

grant execute on function public.start_attempt(uuid) to authenticated;
grant execute on function public.submit_attempt(uuid, jsonb) to authenticated;
grant execute on function public.get_attempt_results(uuid) to authenticated;
