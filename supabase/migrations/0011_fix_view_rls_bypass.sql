-- ============================================================================
-- 0011_fix_view_rls_bypass.sql
--
-- SECURITY FIX. lesson_admin_overview (added in 0010) exposed every draft
-- lesson to any signed-in student.
--
-- Cause: a Postgres view executes with the privileges of the role that CREATED
-- it, not the role querying it. The view was created by `postgres`, so it read
-- public.lessons with RLS bypassed and happily returned rows the caller had no
-- right to see. Granting SELECT to `authenticated` then made that reachable by
-- every logged-in user.
--
-- This is the trap with views over RLS-protected tables: the underlying policy
-- looks correct and is simply not consulted. Verified by signing in as an
-- ordinary student and reading 5 unpublished lessons.
--
-- Fix: security_invoker makes the view run as the CALLER, so the policies on
-- public.lessons apply normally — staff see everything, students see only
-- published rows.
-- ============================================================================

alter view public.lesson_admin_overview set (security_invoker = on);

comment on view public.lesson_admin_overview is
  'Admin listing: one row per lesson with subject, filière codes and block count. security_invoker = on, so it inherits RLS from public.lessons — a plain view would BYPASS those policies and leak drafts.';

-- Any future view over an RLS-protected table needs the same setting.
-- Report anything in public that does not have it.
do $$
declare
  offending text;
begin
  select string_agg(c.relname, ', ')
  into offending
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind = 'v'
    and coalesce(
          (select option_value
           from pg_options_to_table(c.reloptions)
           where option_name = 'security_invoker'),
          'false'
        ) not in ('true', 'on');

  if offending is not null then
    raise warning 'Vues sans security_invoker (risque de contournement RLS): %', offending;
  end if;
end $$;
