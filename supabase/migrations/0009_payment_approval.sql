-- ============================================================================
-- 0009_payment_approval.sql
-- Turning a verified receipt into an active subscription.
--
-- This is the only path from "a student says they paid" to "a student has
-- access", so it is written as one atomic database function rather than a
-- sequence of client calls. Half-applied approvals — payment marked approved
-- but no subscription created — are exactly the failure that generates angry
-- WhatsApp messages and unwinnable disputes.
--
-- Every approval records who approved it and when. With manual billing that
-- audit trail is the only evidence that exists.
-- ============================================================================

-- ---------------------------------------------------------------- approve --
create or replace function public.approve_payment(
  p_request_id uuid,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_admin    uuid := auth.uid();
  v_request  record;
  v_plan     record;
  v_profile  record;
  v_existing record;
  v_starts   timestamptz;
  v_ends     timestamptz;
  v_exam     date;
begin
  if not public.is_admin(v_admin) then
    raise exception 'Réservé aux administrateurs.' using errcode = '42501';
  end if;

  select * into v_request
  from public.payment_requests where id = p_request_id
  for update;

  if not found then
    raise exception 'Demande introuvable.' using errcode = 'P0002';
  end if;

  -- Idempotence guard: double-clicking Approve must not grant two windows.
  if v_request.status <> 'pending' then
    raise exception 'Cette demande a déjà été traitée (%).', v_request.status
      using errcode = '22023';
  end if;

  select * into v_plan from public.plans where id = v_request.plan_id;
  if not found then
    raise exception 'Formule introuvable.' using errcode = 'P0002';
  end if;

  select * into v_profile from public.profiles where id = v_request.user_id;

  select * into v_existing
  from public.subscriptions
  where user_id = v_request.user_id and status = 'active';

  -- Extend from the current expiry when one exists, so a student who renews
  -- early is not silently robbed of the remaining days.
  v_starts := now();
  if found and v_existing.ends_at is not null and v_existing.ends_at > now() then
    v_starts := v_existing.ends_at;
  end if;

  if v_plan.valid_until_exam then
    -- "Until the exam" means the last paper of their filière, plus a few days
    -- so access does not vanish mid-session.
    select max(ec.exam_date) into v_exam
    from public.exam_calendar ec
    join public.filiere_subjects fs on fs.id = ec.filiere_subject_id
    where fs.filiere_id = v_profile.filiere_id
      and ec.exam_year = coalesce(v_profile.exam_year, extract(year from now())::int + 1);

    v_ends := coalesce(
      (v_exam + 7)::timestamptz,
      now() + interval '365 days'   -- calendar not published yet
    );
  else
    v_ends := v_starts + make_interval(days => coalesce(v_plan.duration_days, 90));
  end if;

  if v_existing.id is not null then
    update public.subscriptions
    set plan_id    = v_plan.id,
        ends_at    = v_ends,
        granted_by = v_admin,
        note       = coalesce(p_note, note)
    where id = v_existing.id;
  else
    insert into public.subscriptions (
      user_id, plan_id, status, starts_at, ends_at, granted_by, note
    )
    values (
      v_request.user_id, v_plan.id, 'active', now(), v_ends, v_admin, p_note
    );
  end if;

  update public.payment_requests
  set status      = 'approved',
      reviewed_by = v_admin,
      reviewed_at = now(),
      admin_note  = coalesce(p_note, admin_note)
  where id = p_request_id;

  return jsonb_build_object(
    'ok', true,
    'reference', v_request.reference_code,
    'user_id', v_request.user_id,
    'plan', v_plan.name_fr,
    'ends_at', v_ends
  );
end;
$$;

-- ----------------------------------------------------------------- reject --
create or replace function public.reject_payment(
  p_request_id uuid,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_admin   uuid := auth.uid();
  v_request record;
begin
  if not public.is_admin(v_admin) then
    raise exception 'Réservé aux administrateurs.' using errcode = '42501';
  end if;

  if coalesce(trim(p_reason), '') = '' then
    raise exception 'Un motif de refus est obligatoire.' using errcode = '22023';
  end if;

  select * into v_request
  from public.payment_requests where id = p_request_id
  for update;

  if not found then
    raise exception 'Demande introuvable.' using errcode = 'P0002';
  end if;

  if v_request.status <> 'pending' then
    raise exception 'Cette demande a déjà été traitée (%).', v_request.status
      using errcode = '22023';
  end if;

  update public.payment_requests
  set status           = 'rejected',
      rejection_reason = p_reason,
      reviewed_by      = v_admin,
      reviewed_at      = now()
  where id = p_request_id;

  return jsonb_build_object('ok', true, 'reference', v_request.reference_code);
end;
$$;

-- --------------------------------------------------------- revoke access --
-- For refunds, chargebacks, or an approval made in error.
create or replace function public.revoke_subscription(
  p_user_id uuid,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_admin uuid := auth.uid();
begin
  if not public.is_admin(v_admin) then
    raise exception 'Réservé aux administrateurs.' using errcode = '42501';
  end if;

  update public.subscriptions
  set status = 'cancelled',
      note   = coalesce(note || ' | ', '') || 'Révoqué: ' || coalesce(p_reason, '')
  where user_id = p_user_id and status = 'active';

  return jsonb_build_object('ok', true);
end;
$$;

-- --------------------------------------------------------------- grants ---
revoke all on function public.approve_payment(uuid, text) from public;
revoke all on function public.reject_payment(uuid, text) from public;
revoke all on function public.revoke_subscription(uuid, text) from public;

grant execute on function public.approve_payment(uuid, text) to authenticated;
grant execute on function public.reject_payment(uuid, text) to authenticated;
grant execute on function public.revoke_subscription(uuid, text) to authenticated;

-- The functions themselves check is_admin(); the grant only lets an
-- authenticated session attempt the call.
