/**
 * Offline schema validation.
 *
 * Runs every file in supabase/migrations/ (then seed.sql) against Postgres 17
 * compiled to WASM, so DDL errors surface here instead of halfway through a
 * `supabase db push` against the real project.
 *
 *     node scripts/validate-schema.mjs
 *
 * Caveat: PGlite is plain Postgres. It has no Supabase platform schemas, so we
 * stub the parts our migrations touch — auth.users, auth.uid(), storage.buckets
 * and storage.objects. Behaviour of those stubs is NOT verified here, only that
 * our own DDL is valid and internally consistent.
 */
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { PGlite } from '@electric-sql/pglite'
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto'
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const MIGRATIONS_DIR = path.join(ROOT, 'supabase', 'migrations')
const SEED_FILE = path.join(ROOT, 'supabase', 'seed.sql')

/** Minimal stand-ins for the Supabase-managed schemas. */
const SUPABASE_STUBS = /* sql */ `
  create schema if not exists auth;
  create schema if not exists storage;

  -- Supabase ships these roles; plain Postgres does not. Needed so GRANTs in
  -- the migrations resolve.
  do $$ begin
    if not exists (select 1 from pg_roles where rolname = 'anon') then
      create role anon nologin;
    end if;
    if not exists (select 1 from pg_roles where rolname = 'authenticated') then
      create role authenticated nologin;
    end if;
    if not exists (select 1 from pg_roles where rolname = 'service_role') then
      create role service_role nologin;
    end if;
  end $$;

  -- Mirror Supabase's real layout: pgcrypto lives in \`extensions\`, NOT in
  -- \`public\`. This matters. A security-definer function pinned to
  -- \`set search_path = public\` cannot see gen_random_bytes() here, exactly as
  -- on a real project — which is how "Database error creating new user" got
  -- shipped once already. Installing it here first makes the migrations'
  -- \`create extension if not exists pgcrypto\` a no-op, preserving the trap.
  create schema if not exists extensions;
  create extension if not exists pgcrypto with schema extensions;
  set search_path = public, extensions;

  create table if not exists auth.users (
    id uuid primary key default gen_random_uuid(),
    email text,
    raw_user_meta_data jsonb default '{}'::jsonb,
    created_at timestamptz not null default now()
  );

  -- In production this reads the JWT claim. Here it reads a session setting so
  -- tests can impersonate a user: select set_config('test.user_id', '<uuid>', false)
  create or replace function auth.uid() returns uuid
    language sql stable as $$
      select nullif(current_setting('test.user_id', true), '')::uuid
    $$;

  create or replace function auth.role() returns text
    language sql stable as $$ select 'authenticated'::text $$;

  create table if not exists storage.buckets (
    id text primary key,
    name text not null,
    public boolean not null default false,
    created_at timestamptz not null default now()
  );

  create table if not exists storage.objects (
    id uuid primary key default gen_random_uuid(),
    bucket_id text references storage.buckets(id),
    name text,
    owner uuid,
    created_at timestamptz not null default now()
  );

  alter table storage.objects enable row level security;
`

const GREEN = '\x1b[32m'
const RED = '\x1b[31m'
const DIM = '\x1b[2m'
const RESET = '\x1b[0m'

async function main() {
  const db = new PGlite({ extensions: { pgcrypto, pg_trgm } })
  await db.waitReady

  console.log(`${DIM}Postgres (PGlite) ready${RESET}\n`)

  let failures = 0

  try {
    await db.exec(SUPABASE_STUBS)
    console.log(`${GREEN}✓${RESET} supabase platform stubs`)
  } catch (error) {
    console.error(`${RED}✗ stubs failed${RESET}\n  ${error.message}`)
    process.exit(1)
  }

  const files = (await readdir(MIGRATIONS_DIR))
    .filter((f) => f.endsWith('.sql'))
    .sort()

  for (const file of files) {
    const sql = await readFile(path.join(MIGRATIONS_DIR, file), 'utf8')
    try {
      await db.exec(sql)
      console.log(`${GREEN}✓${RESET} ${file}`)
    } catch (error) {
      failures++
      console.error(`${RED}✗ ${file}${RESET}\n  ${error.message}\n`)
    }
  }

  try {
    const seed = await readFile(SEED_FILE, 'utf8')
    await db.exec(seed)
    console.log(`${GREEN}✓${RESET} seed.sql`)
  } catch (error) {
    failures++
    console.error(`${RED}✗ seed.sql${RESET}\n  ${error.message}\n`)
  }

  // Sanity checks on what the seed actually produced.
  if (failures === 0) {
    const checks = [
      ['filières actives', `select count(*)::int as n from public.filieres where is_active`, 3],
      ['matières', `select count(*)::int as n from public.subjects`, 7],
      ['filiere_subjects', `select count(*)::int as n from public.filiere_subjects`, 15],
      ['dates examen', `select count(*)::int as n from public.exam_calendar`, 15],
      ['formules', `select count(*)::int as n from public.plans`, 3],
      ['badges', `select count(*)::int as n from public.badges`, 10],
    ]

    console.log(`\n${DIM}Seed contents:${RESET}`)
    for (const [label, sql, expected] of checks) {
      const { rows } = await db.query(sql)
      const n = rows[0].n
      const ok = n === expected
      if (!ok) failures++
      console.log(
        `  ${ok ? GREEN + '✓' : RED + '✗'}${RESET} ${label}: ${n}${
          ok ? '' : ` ${RED}(attendu ${expected})${RESET}`
        }`,
      )
    }

    // Every table holding user data must have RLS on. This is the check that
    // catches "I added a table and forgot the policy" six months from now.
    const { rows: unprotected } = await db.query(`
      select c.relname
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relkind = 'r'
        and not c.relrowsecurity
      order by c.relname
    `)

    console.log(`\n${DIM}RLS coverage:${RESET}`)
    if (unprotected.length === 0) {
      console.log(`  ${GREEN}✓${RESET} toutes les tables publiques ont RLS activé`)
    } else {
      failures++
      console.log(`  ${RED}✗ sans RLS: ${unprotected.map((r) => r.relname).join(', ')}${RESET}`)
    }
  }

  // ---------------------------------------------------- functional smoke --
  // recompute_readiness() is the most intricate SQL in the schema (nested
  // CTEs, a lateral join, window functions, partial-index upserts). Creating
  // schema objects proves nothing about whether it RUNS, so run it.
  if (failures === 0) {
    console.log(`\n${DIM}Smoke test — recompute_readiness():${RESET}`)
    try {
      await db.exec(`
        insert into auth.users (id, email)
        values ('11111111-1111-1111-1111-111111111111', 'eleve@test.ma');

        update public.profiles
        set filiere_id = (select id from public.filieres where code = 'PC')
        where id = '11111111-1111-1111-1111-111111111111';

        select public.recompute_readiness('11111111-1111-1111-1111-111111111111');
      `)

      // handle_new_user() should have auto-created the profile.
      const { rows: profileRows } = await db.query(
        `select count(*)::int as n from public.profiles
         where id = '11111111-1111-1111-1111-111111111111'`,
      )
      const hasProfile = profileRows[0].n === 1
      if (!hasProfile) failures++
      console.log(
        `  ${hasProfile ? GREEN + '✓' : RED + '✗'}${RESET} trigger handle_new_user crée le profil`,
      )

      // PC has 5 subjects, so we expect 5 subject rows + 1 overall row.
      const { rows: subjectRows } = await db.query(
        `select count(*)::int as n from public.readiness_scores where scope = 'subject'`,
      )
      const { rows: overallRows } = await db.query(
        `select count(*)::int as n from public.readiness_scores where scope = 'overall'`,
      )

      const okSubject = subjectRows[0].n === 5
      const okOverall = overallRows[0].n === 1
      if (!okSubject) failures++
      if (!okOverall) failures++

      console.log(
        `  ${okSubject ? GREEN + '✓' : RED + '✗'}${RESET} scores par matière: ${subjectRows[0].n}${
          okSubject ? '' : ` ${RED}(attendu 5)${RESET}`
        }`,
      )
      console.log(
        `  ${okOverall ? GREEN + '✓' : RED + '✗'}${RESET} score global: ${overallRows[0].n}${
          okOverall ? '' : ` ${RED}(attendu 1)${RESET}`
        }`,
      )

      // Idempotence: running twice must upsert, not duplicate or throw.
      await db.exec(
        `select public.recompute_readiness('11111111-1111-1111-1111-111111111111')`,
      )
      const { rows: afterRerun } = await db.query(
        `select count(*)::int as n from public.readiness_scores`,
      )
      const okIdempotent = afterRerun[0].n === 6
      if (!okIdempotent) failures++
      console.log(
        `  ${okIdempotent ? GREEN + '✓' : RED + '✗'}${RESET} idempotent au 2e appel: ${afterRerun[0].n} lignes${
          okIdempotent ? '' : ` ${RED}(attendu 6)${RESET}`
        }`,
      )
    } catch (error) {
      failures++
      console.error(`  ${RED}✗ ${error.message}${RESET}`)
    }
  }

  // ------------------------------------------------- quiz engine smoke ----
  // The security claim of the whole assessment system is that the answer key
  // never reaches the browser before submission, and that scores are computed
  // in the database. Assert both, rather than trusting the code reads right.
  if (failures === 0) {
    console.log(`\n${DIM}Smoke test — moteur de quiz:${RESET}`)
    const USER = '11111111-1111-1111-1111-111111111111'

    const check = (ok, label, extra = '') => {
      if (!ok) failures++
      console.log(`  ${ok ? GREEN + '✓' : RED + '✗'}${RESET} ${label}${extra}`)
    }

    try {
      // Minimal published lesson + two questions + a pooled quiz.
      await db.exec(`
        select set_config('test.user_id', '${USER}', false);

        insert into public.lessons (id, subject_id, slug, title_fr, status, reviewed_by)
        values ('22222222-2222-2222-2222-222222222222',
                (select id from public.subjects where slug = 'mathematiques'),
                'quiz-smoke', 'Quiz smoke', 'published', '${USER}');

        insert into public.questions (id, subject_id, lesson_id, type, stem, choices, answer, explanation, points, status, reviewed_by)
        values
          ('33333333-3333-3333-3333-333333333331',
           (select id from public.subjects where slug='mathematiques'),
           '22222222-2222-2222-2222-222222222222', 'mcq_single',
           '{"markdown":"Q1"}'::jsonb,
           '[{"id":"a","label":"bon","is_correct":true},{"id":"b","label":"mauvais","is_correct":false}]'::jsonb,
           '{"choice":"a"}'::jsonb, '{"markdown":"parce que"}'::jsonb, 1, 'published', '${USER}'),
          ('33333333-3333-3333-3333-333333333332',
           (select id from public.subjects where slug='mathematiques'),
           '22222222-2222-2222-2222-222222222222', 'mcq_single',
           '{"markdown":"Q2"}'::jsonb,
           '[{"id":"a","label":"mauvais","is_correct":false},{"id":"b","label":"bon","is_correct":true}]'::jsonb,
           '{"choice":"b"}'::jsonb, '{"markdown":"parce que"}'::jsonb, 1, 'published', '${USER}');

        insert into public.assessments (id, kind, lesson_id, title_fr, question_count, status, access_tier)
        values ('44444444-4444-4444-4444-444444444444', 'lesson_quiz',
                '22222222-2222-2222-2222-222222222222', 'Quiz smoke', 2, 'published', 'free');

        insert into public.assessment_pools (assessment_id, filter, draw_count)
        values ('44444444-4444-4444-4444-444444444444',
                '{"lesson_ids":["22222222-2222-2222-2222-222222222222"]}'::jsonb, 2);
      `)

      const { rows: startRows } = await db.query(
        `select public.start_attempt('44444444-4444-4444-4444-444444444444') as payload`,
      )
      const started = startRows[0].payload

      check(started.questions?.length === 2, 'tirage de 2 questions')

      // The critical assertion: no answer key in the payload.
      const serialised = JSON.stringify(started)
      check(!serialised.includes('is_correct'), "aucun 'is_correct' dans le tirage")
      check(!serialised.includes('"answer"'), "aucune réponse dans le tirage")
      check(!serialised.includes('parce que'), "aucune explication dans le tirage")

      // Answer the first question correctly, the second wrongly.
      const [q1, q2] = started.questions
      const answers = [
        { question_id: q1.id, response: { choice: q1.id.endsWith('1') ? 'a' : 'b' } },
        { question_id: q2.id, response: { choice: q2.id.endsWith('1') ? 'b' : 'a' } },
      ]

      const { rows: submitRows } = await db.query(
        `select public.submit_attempt('${started.attempt_id}', $1::jsonb) as payload`,
        [JSON.stringify(answers)],
      )
      const graded = submitRows[0].payload

      check(Number(graded.max_score) === 2, 'barème total = 2', ` (${graded.max_score})`)
      check(
        Number(graded.score) === 1 && Number(graded.percentage) === 50,
        'note calculée côté serveur = 1/2 (50%)',
        ` (${graded.score}/${graded.max_score}, ${graded.percentage}%)`,
      )
      check(
        JSON.stringify(graded).includes('parce que'),
        'explications révélées APRÈS correction',
      )

      // Submitting twice must not be possible.
      let rejected = false
      try {
        await db.query(
          `select public.submit_attempt('${started.attempt_id}', '[]'::jsonb)`,
        )
      } catch {
        rejected = true
      }
      check(rejected, 'double soumission refusée')

      // Another user must not be able to read this attempt.
      await db.exec(
        `select set_config('test.user_id', '99999999-9999-9999-9999-999999999999', false)`,
      )
      let blocked = false
      try {
        await db.query(`select public.get_attempt_results('${started.attempt_id}')`)
      } catch {
        blocked = true
      }
      check(blocked, "tentative d'un autre élève inaccessible")

      await db.exec(`select set_config('test.user_id', '${USER}', false)`)
    } catch (error) {
      failures++
      console.error(`  ${RED}✗ ${error.message}${RESET}`)
    }
  }

  // ------------------------------------------------- payment approval ------
  // This is the only path from "claims to have paid" to "has access", so the
  // guarantees are asserted rather than assumed: only admins may approve, an
  // approval actually grants access, and clicking twice does not grant twice.
  if (failures === 0) {
    console.log(`\n${DIM}Smoke test — validation de paiement:${RESET}`)
    const STUDENT = '11111111-1111-1111-1111-111111111111'
    const ADMIN = '55555555-5555-5555-5555-555555555555'

    const check = (ok, label, extra = '') => {
      if (!ok) failures++
      console.log(`  ${ok ? GREEN + '✓' : RED + '✗'}${RESET} ${label}${extra}`)
    }

    try {
      await db.exec(`
        insert into auth.users (id, email) values ('${ADMIN}', 'admin@test.ma');
        update public.profiles set role = 'admin' where id = '${ADMIN}';

        insert into public.payment_requests (id, user_id, plan_id, amount_mad, method, status)
        values ('66666666-6666-6666-6666-666666666666', '${STUDENT}',
                (select id from public.plans where slug = 'trimestre'),
                299, 'cashplus', 'pending');
      `)

      // Before approval the student must not have premium.
      await db.exec(`select set_config('test.user_id', '${STUDENT}', false)`)
      const { rows: before } = await db.query(
        `select public.has_premium_access('${STUDENT}') as premium`,
      )
      check(before[0].premium === false, 'pas d’accès premium avant validation')

      // A student must not be able to approve their own payment.
      let refused = false
      try {
        await db.query(
          `select public.approve_payment('66666666-6666-6666-6666-666666666666', null)`,
        )
      } catch {
        refused = true
      }
      check(refused, 'un élève ne peut pas valider son propre paiement')

      // Admin approves.
      await db.exec(`select set_config('test.user_id', '${ADMIN}', false)`)
      await db.query(
        `select public.approve_payment('66666666-6666-6666-6666-666666666666', 'reçu vérifié')`,
      )

      const { rows: after } = await db.query(
        `select public.has_premium_access('${STUDENT}') as premium`,
      )
      check(after[0].premium === true, 'accès premium accordé après validation')

      const { rows: subs } = await db.query(
        `select count(*)::int as n, max(granted_by::text) as by
         from public.subscriptions where user_id = '${STUDENT}' and status = 'active'`,
      )
      check(subs[0].n === 1, 'exactement 1 abonnement actif', ` (${subs[0].n})`)
      check(subs[0].by === ADMIN, 'validateur enregistré (piste d’audit)')

      // Approving again must fail rather than stack a second window.
      let doubled = false
      try {
        await db.query(
          `select public.approve_payment('66666666-6666-6666-6666-666666666666', null)`,
        )
      } catch {
        doubled = true
      }
      check(doubled, 'double validation refusée')

      // Rejection requires a reason.
      await db.exec(`
        insert into public.payment_requests (id, user_id, plan_id, amount_mad, method, status)
        values ('77777777-7777-7777-7777-777777777777', '${STUDENT}',
                (select id from public.plans where slug = 'trimestre'),
                299, 'virement', 'pending');
      `)
      let needsReason = false
      try {
        await db.query(
          `select public.reject_payment('77777777-7777-7777-7777-777777777777', '')`,
        )
      } catch {
        needsReason = true
      }
      check(needsReason, 'refus sans motif rejeté')
    } catch (error) {
      failures++
      console.error(`  ${RED}✗ ${error.message}${RESET}`)
    }
  }

  await db.close()

  console.log()
  if (failures > 0) {
    console.error(`${RED}${failures} problème(s) détecté(s).${RESET}`)
    process.exit(1)
  }
  console.log(`${GREEN}Schéma valide.${RESET}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
