/**
 * Concatenates every migration plus seed.sql into ONE file that can be pasted
 * straight into the Supabase dashboard SQL Editor.
 *
 *     node scripts/bundle-sql.mjs
 *
 * Why this exists: `supabase db push` needs the CLI, a browser login and a
 * working PATH. The SQL Editor needs none of those. For a first-time setup —
 * or any machine where the CLI is awkward — pasting one file is faster and has
 * fewer moving parts.
 *
 * The bundle is a DERIVED artifact and is gitignored. supabase/migrations/
 * remains the source of truth; regenerate rather than editing the bundle.
 */
import { readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const MIGRATIONS_DIR = path.join(ROOT, 'supabase', 'migrations')
const SEED_FILE = path.join(ROOT, 'supabase', 'seed.sql')
const OUT_FILE = path.join(ROOT, 'supabase', '_bundle.generated.sql')

const HEADER = `-- ===========================================================================
-- BACCALORIA — COMPLETE DATABASE SETUP
--
-- Generated file. Do not edit: change supabase/migrations/ and regenerate with
--     node scripts/bundle-sql.mjs
--
-- HOW TO USE
--   1. Open your Supabase project dashboard.
--   2. Left sidebar -> SQL Editor -> New query.
--   3. Paste this entire file.
--   4. Press Run.
--
-- Run this ONCE on a fresh project. It creates types and tables, so running it
-- a second time will fail with "type already exists" — that error is harmless
-- and just means the schema is already in place.
-- ===========================================================================

`

function banner(title) {
  const line = '='.repeat(75)
  return `\n\n-- ${line}\n-- FILE: ${title}\n-- ${line}\n\n`
}

async function main() {
  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('.sql')).sort()

  let out = HEADER

  for (const file of files) {
    out += banner(file)
    out += await readFile(path.join(MIGRATIONS_DIR, file), 'utf8')
  }

  out += banner('seed.sql')
  out += await readFile(SEED_FILE, 'utf8')

  out += `\n\n-- ===========================================================================
-- Done. Verify with:
--     select code, name_fr from public.filieres where is_active;
-- You should see 3 rows: PC, SE, SGC.
-- ===========================================================================
`

  // Explicit UTF-8, no BOM. The SQL Editor is fine with UTF-8, but a BOM can
  // show up as a stray character before the first statement.
  await writeFile(OUT_FILE, out, 'utf8')

  const lines = out.split('\n').length
  console.log(`Wrote ${path.relative(ROOT, OUT_FILE)}`)
  console.log(`  ${files.length} migrations + seed`)
  console.log(`  ${lines} lines, ${(Buffer.byteLength(out) / 1024).toFixed(1)} KB`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
