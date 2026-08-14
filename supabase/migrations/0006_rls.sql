-- ============================================================================
-- 0006_rls.sql
-- Row Level Security. The freemium paywall and the answer-key secrecy are
-- enforced HERE, in the database — not in the UI, and not in the API layer.
-- Anything enforced only in React is enforced nowhere.
--
-- Two rules carry most of the weight:
--   1. A premium lesson is unreadable without an active subscription.
--   2. Students have NO direct select on public.questions, ever. If they did,
--      one REST call would dump every answer key and explanation in the bank.
--      They reach questions only through the SECURITY DEFINER RPCs in 0007,
--      which strip `answer` and `explanation` until the attempt is submitted.
-- ============================================================================

alter table public.filieres            enable row level security;
alter table public.subjects            enable row level security;
alter table public.filiere_subjects    enable row level security;
alter table public.exam_calendar       enable row level security;
alter table public.units               enable row level security;
alter table public.lessons             enable row level security;
alter table public.lesson_placements   enable row level security;
alter table public.lesson_blocks       enable row level security;
alter table public.mindmaps            enable row level security;
alter table public.lesson_revisions    enable row level security;
alter table public.questions           enable row level security;
alter table public.question_stats      enable row level security;
alter table public.exams               enable row level security;
alter table public.exam_exercises      enable row level security;
alter table public.milestones          enable row level security;
alter table public.assessments         enable row level security;
alter table public.assessment_questions enable row level security;
alter table public.assessment_pools    enable row level security;
alter table public.profiles            enable row level security;
alter table public.plans               enable row level security;
alter table public.subscriptions       enable row level security;
alter table public.payment_requests    enable row level security;
alter table public.user_devices        enable row level security;
alter table public.attempts            enable row level security;
alter table public.attempt_answers     enable row level security;
alter table public.lesson_progress     enable row level security;
alter table public.readiness_scores    enable row level security;
alter table public.activity_days       enable row level security;
alter table public.badges              enable row level security;
alter table public.user_badges         enable row level security;
alter table public.share_cards         enable row level security;

-- =============================== taxonomy ===================================
-- Curriculum structure is public: it is the marketing surface. A visitor
-- should see "PC · Maths · 12 chapitres" before signing up.

create policy "taxonomy readable by everyone" on public.filieres
  for select using (is_active or public.is_staff());

create policy "subjects readable by everyone" on public.subjects
  for select using (true);

create policy "filiere_subjects readable by everyone" on public.filiere_subjects
  for select using (is_active or public.is_staff());

create policy "units readable by everyone" on public.units
  for select using (true);

create policy "exam calendar readable by everyone" on public.exam_calendar
  for select using (true);

create policy "staff manage filieres" on public.filieres
  for all using (public.is_admin()) with check (public.is_admin());
create policy "staff manage subjects" on public.subjects
  for all using (public.is_admin()) with check (public.is_admin());
create policy "staff manage filiere_subjects" on public.filiere_subjects
  for all using (public.is_admin()) with check (public.is_admin());
create policy "staff manage exam_calendar" on public.exam_calendar
  for all using (public.is_admin()) with check (public.is_admin());
create policy "staff manage units" on public.units
  for all using (public.is_staff()) with check (public.is_staff());

-- ================================ lessons ===================================
-- Titles and metadata of every published lesson are visible to all, so the
-- catalogue looks complete and locked lessons can advertise themselves.
-- The BODY (lesson_blocks, mindmaps) is what the paywall actually protects.

create policy "published lessons are listable" on public.lessons
  for select using (status = 'published' or public.is_staff());

create policy "staff manage lessons" on public.lessons
  for all using (public.is_staff()) with check (public.is_staff());

create policy "placements readable" on public.lesson_placements
  for select using (true);
create policy "staff manage placements" on public.lesson_placements
  for all using (public.is_staff()) with check (public.is_staff());

-- The paywall.
create policy "lesson body gated by tier" on public.lesson_blocks
  for select using (
    public.is_staff()
    or exists (
      select 1 from public.lessons l
      where l.id = lesson_blocks.lesson_id
        and l.status = 'published'
        and (l.access_tier = 'free' or public.has_premium_access())
    )
  );

create policy "staff manage lesson blocks" on public.lesson_blocks
  for all using (public.is_staff()) with check (public.is_staff());

create policy "mindmaps gated by tier" on public.mindmaps
  for select using (
    public.is_staff()
    or (
      status = 'published'
      and (
        lesson_id is null
        or exists (
          select 1 from public.lessons l
          where l.id = mindmaps.lesson_id
            and l.status = 'published'
            and (l.access_tier = 'free' or public.has_premium_access())
        )
      )
    )
  );

create policy "staff manage mindmaps" on public.mindmaps
  for all using (public.is_staff()) with check (public.is_staff());

create policy "staff read revisions" on public.lesson_revisions
  for select using (public.is_staff());
create policy "staff write revisions" on public.lesson_revisions
  for insert with check (public.is_staff());

-- ============================== question bank ===============================
-- NO student-facing select policy. This is deliberate — see the header.
create policy "staff manage questions" on public.questions
  for all using (public.is_staff()) with check (public.is_staff());

create policy "staff read question stats" on public.question_stats
  for select using (public.is_staff());

-- ================================= exams ====================================
create policy "published exams are listable" on public.exams
  for select using (status = 'published' or public.is_staff());

create policy "staff manage exams" on public.exams
  for all using (public.is_staff()) with check (public.is_staff());

-- Exercise corrigés are premium: the correction IS the product.
create policy "exam exercises gated" on public.exam_exercises
  for select using (
    public.is_staff()
    or exists (
      select 1 from public.exams e
      where e.id = exam_exercises.exam_id
        and e.status = 'published'
        and public.has_premium_access()
    )
  );

create policy "staff manage exam exercises" on public.exam_exercises
  for all using (public.is_staff()) with check (public.is_staff());

create policy "milestones readable" on public.milestones
  for select using (true);
create policy "staff manage milestones" on public.milestones
  for all using (public.is_staff()) with check (public.is_staff());

create policy "published assessments listable" on public.assessments
  for select using (status = 'published' or public.is_staff());
create policy "staff manage assessments" on public.assessments
  for all using (public.is_staff()) with check (public.is_staff());

-- Mapping tables would leak which questions belong to which exam. Staff only.
create policy "staff read assessment questions" on public.assessment_questions
  for all using (public.is_staff()) with check (public.is_staff());
create policy "staff read assessment pools" on public.assessment_pools
  for all using (public.is_staff()) with check (public.is_staff());

-- ================================ accounts ==================================
create policy "read own profile" on public.profiles
  for select using (id = auth.uid() or public.is_staff());

create policy "update own profile" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

create policy "staff manage profiles" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

create policy "active plans are public" on public.plans
  for select using (is_active or public.is_staff());
create policy "admins manage plans" on public.plans
  for all using (public.is_admin()) with check (public.is_admin());

create policy "read own subscription" on public.subscriptions
  for select using (user_id = auth.uid() or public.is_staff());
-- Students never write subscriptions. Only an admin approving a payment does.
create policy "admins manage subscriptions" on public.subscriptions
  for all using (public.is_admin()) with check (public.is_admin());

create policy "read own payment requests" on public.payment_requests
  for select using (user_id = auth.uid() or public.is_staff());

create policy "create own payment request" on public.payment_requests
  for insert with check (
    user_id = auth.uid() and status = 'pending'
  );

create policy "admins manage payment requests" on public.payment_requests
  for all using (public.is_admin()) with check (public.is_admin());

create policy "manage own devices" on public.user_devices
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- ================================ progress ==================================
create policy "read own attempts" on public.attempts
  for select using (user_id = auth.uid() or public.is_staff());
-- Writes go through RPCs so scores cannot be forged client-side.
create policy "staff manage attempts" on public.attempts
  for all using (public.is_admin()) with check (public.is_admin());

create policy "read own attempt answers" on public.attempt_answers
  for select using (
    public.is_staff()
    or exists (
      select 1 from public.attempts a
      where a.id = attempt_answers.attempt_id and a.user_id = auth.uid()
    )
  );

create policy "manage own lesson progress" on public.lesson_progress
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "staff read lesson progress" on public.lesson_progress
  for select using (public.is_staff());

create policy "read own readiness" on public.readiness_scores
  for select using (user_id = auth.uid() or public.is_staff());

create policy "manage own activity" on public.activity_days
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "staff read activity" on public.activity_days
  for select using (public.is_staff());

create policy "badges are public" on public.badges
  for select using (true);
create policy "admins manage badges" on public.badges
  for all using (public.is_admin()) with check (public.is_admin());

create policy "read own badges" on public.user_badges
  for select using (user_id = auth.uid() or public.is_staff());

-- Share cards: the owner manages them; the public page reads by token via an
-- RPC, so a scraper cannot enumerate every student's progress.
create policy "manage own share cards" on public.share_cards
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- =============================== storage ====================================
insert into storage.buckets (id, name, public)
values
  ('exams',    'exams',    false),
  ('lesson-media', 'lesson-media', true),
  ('receipts', 'receipts', false),
  ('avatars',  'avatars',  true)
on conflict (id) do nothing;

-- Exam PDFs: premium only.
create policy "premium reads exam files" on storage.objects
  for select using (
    bucket_id = 'exams' and (public.has_premium_access() or public.is_staff())
  );

create policy "staff writes exam files" on storage.objects
  for insert with check (bucket_id = 'exams' and public.is_staff());

-- Receipts contain bank details and names: owner + admin only, never public.
create policy "read own receipts" on storage.objects
  for select using (
    bucket_id = 'receipts'
    and (owner = auth.uid() or public.is_admin())
  );

create policy "upload own receipt" on storage.objects
  for insert with check (
    bucket_id = 'receipts' and owner = auth.uid()
  );

create policy "public reads lesson media" on storage.objects
  for select using (bucket_id in ('lesson-media', 'avatars'));

create policy "staff writes lesson media" on storage.objects
  for insert with check (bucket_id = 'lesson-media' and public.is_staff());

create policy "upload own avatar" on storage.objects
  for insert with check (bucket_id = 'avatars' and owner = auth.uid());
