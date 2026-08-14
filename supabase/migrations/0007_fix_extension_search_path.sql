-- ============================================================================
-- 0007_fix_extension_search_path.sql
--
-- Fixes: "Database error creating new user" on every signup.
--
-- Cause: handle_new_user() is declared `set search_path = public`, but called
-- gen_random_bytes(), which belongs to pgcrypto. Supabase installs pgcrypto
-- into the `extensions` schema, not `public`, so inside that function the name
-- did not resolve. The trigger raised, and because it fires on auth.users the
-- whole INSERT rolled back — signup failed with a generic error.
--
-- Fix: stop depending on pgcrypto for random tokens. gen_random_uuid() has
-- been in Postgres core since 13 and always resolves, whatever the search_path.
-- `extensions` is also added to the search_path as a belt-and-braces measure
-- for anything added later.
-- ============================================================================

-- ------------------------------------------------------- signup trigger ----
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, public_slug)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'avatar_url', ''),
    -- 32 hex chars, core function, no extension dependency.
    replace(gen_random_uuid()::text, '-', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- --------------------------------------------------------- share tokens ----
alter table public.share_cards
  alter column token set default replace(gen_random_uuid()::text, '-', '');

-- ------------------------------- harden the other security definer funcs ---
-- None of these currently call an extension function, but they are all pinned
-- to `search_path = public`, which is the same trap. Widen them once, here.
alter function public.has_premium_access(uuid) set search_path = public, extensions;
alter function public.is_staff(uuid)           set search_path = public, extensions;
alter function public.is_admin(uuid)           set search_path = public, extensions;
alter function public.recompute_readiness(uuid) set search_path = public, extensions;
alter function public.bump_question_stats()     set search_path = public, extensions;

-- ------------------------------------------------------------ backfill -----
-- Any profile created before this fix would have no share slug.
update public.profiles
set public_slug = replace(gen_random_uuid()::text, '-', '')
where public_slug is null;
