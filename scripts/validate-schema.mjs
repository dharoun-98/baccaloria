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

  -- In production this reads the JWT claim. Here it just has to exist and
  -- return uuid so policies referencing it compile.
  create or replace function auth.uid() returns uuid
    language sql stable as $$ select null::uuid $$;

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
