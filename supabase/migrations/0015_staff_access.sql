-- ============================================================================
-- 0015_staff_access.sql
--
-- Staff were hitting the paywall on their own platform.
--
-- has_premium_access() only looked at the subscriptions table, so an
-- administrator with no subscription was refused by start_exam_attempt() and
-- by any premium quiz — "Les examens nationaux font partie de l'offre Premium",
-- shown to the person who wrote them.
--
-- The RLS policy on lesson bodies already got this right by OR-ing is_staff()
-- separately; the function did not, so every caller that relied on it alone
-- was wrong. Fixing it in the function rather than at each call site means the
-- next thing that gates on premium inherits the correct behaviour.
-- ============================================================================

create or replace function public.has_premium_access(uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    -- Staff always have full access: they need to read what they publish.
    exists (
      select 1 from public.profiles p
      where p.id = uid and p.role in ('admin', 'editor', 'teacher')
    )
    or exists (
      select 1
      from public.subscriptions s
      where s.user_id = uid
        and s.status = 'active'
        and (s.ends_at is null or s.ends_at > now())
    );
$$;

comment on function public.has_premium_access is
  'True for an active subscriber OR any staff member. Staff must be able to open the content they publish; gating them out of their own platform is never intended.';
