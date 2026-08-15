-- ============================================================================
-- 0013_exam_sessions.sql
-- Sitting a real past paper under exam conditions.
--
-- Different from a quiz on purpose. A maths paper cannot be auto-graded from a
-- multiple-choice answer: the student writes on paper, then scores themselves
-- exercise by exercise against the corrigé. That per-exercise breakdown is the
-- point — "you always lose marks on the complex numbers exercise" is far more
-- useful than a single mark out of 20.
--
-- Self-reported scores are honest-by-design: the student is preparing, not
-- being examined. What matters is that the breakdown feeds the readiness score
-- so the dashboard reflects reality rather than optimism.
-- ============================================================================

-- --------------------------------------------------------------- start -----
create or replace function public.start_exam_attempt(p_exam_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user       uuid := auth.uid();
  v_exam       record;
  v_assessment record;
  v_attempt_id uuid;
  v_exercises  jsonb;
  v_total      numeric;
begin
  if v_user is null then
    raise exception 'Non authentifié.' using errcode = '28000';
  end if;

  select * into v_exam from public.exams e where e.id = p_exam_id;

  if not found or v_exam.status <> 'published' then
    raise exception 'Examen introuvable.' using errcode = 'P0002';
  end if;

  -- Past papers are the paid product. Checked here, not trusted from the UI.
  if not public.has_premium_access(v_user) then
    raise exception 'Abonnement requis.' using errcode = '42501';
  end if;

  -- One assessment per exam, created on first use rather than by the importer,
  -- so importing a paper never creates something students could stumble into.
  select * into v_assessment
  from public.assessments a
  where a.exam_id = p_exam_id and a.kind = 'exam';

  if not found then
    insert into public.assessments (
      kind, exam_id, title_fr, duration_min, question_count,
      pass_threshold, access_tier, status
    )
    values (
      'exam', p_exam_id,
      'Examen national ' || v_exam.year || ' — ' ||
        case when v_exam.session = 'normale' then 'session normale'
             else 'session de rattrapage' end,
      v_exam.duration_min, 0, 50, 'premium', 'published'
    )
    returning * into v_assessment;
  end if;

  -- Abandon anything left hanging, so closing the tab does not lock the
  -- student out of retrying.
  update public.attempts
  set state = 'abandoned'
  where user_id = v_user
    and assessment_id = v_assessment.id
    and state = 'in_progress';

  select coalesce(sum(points), v_exam.total_points) into v_total
  from public.exam_exercises where exam_id = p_exam_id;

  insert into public.attempts (
    user_id, assessment_id, state, time_limit_sec, max_score
  )
  values (
    v_user, v_assessment.id, 'in_progress', v_exam.duration_min * 60, v_total
  )
  returning id into v_attempt_id;

  select jsonb_agg(
    jsonb_build_object('id', x.id, 'position', x.position, 'label', x.label_fr, 'points', x.points)
    order by x.position
  )
  into v_exercises
  from public.exam_exercises x
  where x.exam_id = p_exam_id;

  return jsonb_build_object(
    'attempt_id', v_attempt_id,
    'exam_id', p_exam_id,
    'year', v_exam.year,
    'session', v_exam.session,
    'duration_min', v_exam.duration_min,
    'total_points', v_total,
    'instructions', v_exam.instructions_fr,
    'exercises', coalesce(v_exercises, '[]'::jsonb)
  );
end;
$$;

-- -------------------------------------------------------------- submit -----
-- p_scores: [{ "exercise_id": uuid, "points": numeric }]
create or replace function public.submit_exam_attempt(
  p_attempt_id uuid,
  p_scores jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user     uuid := auth.uid();
  v_attempt  record;
  v_exam_id  uuid;
  v_score    numeric := 0;
  v_max      numeric := 0;
  v_pct      numeric;
  v_duration int;
  v_clean    jsonb := '[]'::jsonb;
  v_row      record;
begin
  if v_user is null then
    raise exception 'Non authentifié.' using errcode = '28000';
  end if;

  select * into v_attempt from public.attempts a where a.id = p_attempt_id;

  if not found then
    raise exception 'Tentative introuvable.' using errcode = 'P0002';
  end if;

  if v_attempt.user_id <> v_user then
    raise exception 'Cette tentative ne t''appartient pas.' using errcode = '42501';
  end if;

  if v_attempt.state <> 'in_progress' then
    raise exception 'Cette tentative est déjà terminée.' using errcode = '22023';
  end if;

  select e.exam_id into v_exam_id
  from public.assessments e where e.id = v_attempt.assessment_id;

  v_duration := greatest(0, extract(epoch from (now() - v_attempt.started_at))::int);

  -- Score only against exercises that actually belong to this paper, and clamp
  -- each to its maximum. A student mis-typing 40 into a 4-point exercise should
  -- not end up "ready" on the dashboard.
  for v_row in
    select x.id, x.position, x.label_fr, x.points
    from public.exam_exercises x
    where x.exam_id = v_exam_id
    order by x.position
  loop
    declare
      v_given numeric;
    begin
      select least(greatest(coalesce((s->>'points')::numeric, 0), 0), v_row.points)
      into v_given
      from jsonb_array_elements(coalesce(p_scores, '[]'::jsonb)) s
      where (s->>'exercise_id')::uuid = v_row.id
      limit 1;

      v_given := coalesce(v_given, 0);
      v_score := v_score + v_given;
      v_max := v_max + v_row.points;

      v_clean := v_clean || jsonb_build_object(
        'exercise_id', v_row.id,
        'label', v_row.label_fr,
        'points_earned', v_given,
        'points_max', v_row.points
      );
    end;
  end loop;

  v_pct := case when v_max > 0 then round(100.0 * v_score / v_max, 2) else 0 end;

  update public.attempts
  set state        = 'graded',
      submitted_at = now(),
      duration_sec = v_duration,
      score        = v_score,
      max_score    = v_max,
      percentage   = v_pct,
      passed       = v_pct >= 50,
      self_scores  = v_clean
  where id = p_attempt_id;

  perform public.recompute_readiness(v_user);

  return jsonb_build_object(
    'attempt_id', p_attempt_id,
    'score', v_score,
    'max_score', v_max,
    'percentage', v_pct,
    'duration_sec', v_duration,
    'time_limit_sec', v_attempt.time_limit_sec,
    'within_time', v_duration <= coalesce(v_attempt.time_limit_sec, 2147483647),
    'breakdown', v_clean
  );
end;
$$;

-- --------------------------------------------------------------- grants ----
revoke all on function public.start_exam_attempt(uuid) from public;
revoke all on function public.submit_exam_attempt(uuid, jsonb) from public;

grant execute on function public.start_exam_attempt(uuid) to authenticated;
grant execute on function public.submit_exam_attempt(uuid, jsonb) to authenticated;
