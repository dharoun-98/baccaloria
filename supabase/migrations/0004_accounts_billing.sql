-- ============================================================================
-- 0004_accounts_billing.sql
-- Profiles, freemium access, and the manual (WhatsApp + bank/cash) payment flow.
--
-- Why manual billing gets a real schema instead of a spreadsheet:
--   Every payment is a human decision (someone reads a receipt photo and
--   clicks approve). That decision must be auditable — who approved, when,
--   for how much, against which receipt. Otherwise disputes are unwinnable
--   and revenue reporting is guesswork.
-- ============================================================================

create type subscription_status as enum (
  'none', 'pending', 'active', 'expired', 'cancelled'
);

create type payment_method as enum (
  'virement',    -- bank transfer
  'cashplus',    -- agent network — how students without a bank account pay
  'wafacash',
  'baridbank',   -- Barid Cash / Al Barid Bank
  'especes',     -- cash handed over in person
  'autre'
);

create type payment_status as enum ('pending', 'approved', 'rejected', 'refunded');

-- -------------------------------------------------------------- profiles ---
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text,
  avatar_url    text,
  phone         text,
  phone_verified boolean not null default false,

  filiere_id    uuid references public.filieres(id) on delete set null,
  exam_year     int not null default extract(year from now())::int + 1,
  school        text,
  city          text,

  role          user_role not null default 'student',

  -- Gamification
  xp            int not null default 0,
  streak_days   int not null default 0,
  longest_streak int not null default 0,
  last_active_on date,

  -- Public sharing. Opt-in, and the slug is unguessable so a shared card
  -- never exposes anything the student did not deliberately publish.
  public_slug   text unique,
  share_opt_in  boolean not null default false,

  locale        text not null default 'fr' check (locale in ('fr', 'ar')),
  onboarded_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create index on public.profiles (filiere_id);
create index on public.profiles (role) where role <> 'student';

-- Auto-create a profile whenever someone signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, public_slug)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'avatar_url', ''),
    encode(gen_random_bytes(9), 'hex')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------- plans ---
create table public.plans (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique check (public.is_slug(slug)),
  name_fr       text not null,
  description_fr text,
  price_mad     numeric(8,2) not null check (price_mad >= 0),

  -- Either a fixed window, or "valid until the exam". Prefer the latter:
  -- with manual payments every renewal costs a human WhatsApp round-trip,
  -- so one payment covering the whole year is dramatically cheaper to run.
  duration_days     int,
  valid_until_exam  boolean not null default false,

  features      jsonb not null default '[]'::jsonb,
  is_active     boolean not null default true,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint plan_has_a_duration
    check (valid_until_exam or duration_days is not null)
);

create trigger plans_updated_at
  before update on public.plans
  for each row execute function public.set_updated_at();

-- --------------------------------------------------------- subscriptions ---
create table public.subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  plan_id     uuid references public.plans(id) on delete set null,
  status      subscription_status not null default 'pending',
  starts_at   timestamptz,
  ends_at     timestamptz,
  granted_by  uuid references auth.users(id) on delete set null,
  note        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

create index on public.subscriptions (user_id, status);
-- At most one active subscription per user.
create unique index subscriptions_one_active
  on public.subscriptions (user_id) where status = 'active';

-- ------------------------------------------------------ payment requests ---
create table public.payment_requests (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  plan_id        uuid references public.plans(id) on delete set null,

  -- Short human code the student quotes on WhatsApp and writes on the transfer
  -- slip. This is what ties a bank line item back to an account.
  reference_code text not null unique,

  amount_mad     numeric(8,2) not null check (amount_mad >= 0),
  method         payment_method not null,
  payer_name     text,
  paid_at        date,

  receipt_path   text,             -- Supabase Storage, bucket 'receipts' (private)
  whatsapp_phone text,

  status         payment_status not null default 'pending',
  reviewed_by    uuid references auth.users(id) on delete set null,
  reviewed_at    timestamptz,
  admin_note     text,
  rejection_reason text,

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger payment_requests_updated_at
  before update on public.payment_requests
  for each row execute function public.set_updated_at();

create index on public.payment_requests (status, created_at desc);
create index on public.payment_requests (user_id, created_at desc);

comment on column public.payment_requests.reference_code is
  'Quoted by the student on WhatsApp and written on the transfer slip. The only reliable link between a bank statement line and a user account.';

-- Generate a readable reference: BAC-4F2K9D
create or replace function public.generate_payment_reference()
returns text
language plpgsql
as $$
declare
  alphabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';  -- no I/L/O/0/1
  candidate text;
  i int;
begin
  loop
    candidate := 'BAC-';
    for i in 1..6 loop
      candidate := candidate || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (
      select 1 from public.payment_requests where reference_code = candidate
    );
  end loop;
  return candidate;
end;
$$;

alter table public.payment_requests
  alter column reference_code set default public.generate_payment_reference();

-- ---------------------------------------------------------------- devices --
-- Account sharing is the main revenue leak when there is no card on file.
-- We cap concurrent devices rather than blocking outright.
create table public.user_devices (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  device_hash  text not null,
  label        text,
  user_agent   text,
  last_seen_at timestamptz not null default now(),
  created_at   timestamptz not null default now(),

  unique (user_id, device_hash)
);

create index on public.user_devices (user_id, last_seen_at desc);

-- ------------------------------------------------------- access resolver ---
-- Single source of truth for "can this user see premium content?".
-- Used by RLS policies and by the app. Freemium: no subscription still
-- grants access to everything tagged 'free'.
create or replace function public.has_premium_access(uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.subscriptions s
    where s.user_id = uid
      and s.status = 'active'
      and (s.ends_at is null or s.ends_at > now())
  );
$$;

create or replace function public.is_staff(uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = uid and p.role in ('admin', 'editor', 'teacher')
  );
$$;

create or replace function public.is_admin(uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = uid and p.role = 'admin'
  );
$$;
