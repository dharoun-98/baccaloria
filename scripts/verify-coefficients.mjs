/**
 * Marks a filière's coefficients as checked against the official MEN arrêté.
 *
 *     node --env-file=.env.local scripts/verify-coefficients.mjs PC
 *     node --env-file=.env.local scripts/verify-coefficients.mjs PC --list
 *
 * `coefficient_verified` is not decoration. Coefficients drive the readiness
 * score AND the "revise this first" ranking, so an unverified one means the
 * product is confidently advising a student from a guess. The admin dashboard
 * counts whatever is still false.
 *
 * Only flip this after someone has actually compared the numbers to the
 * official document for the current school year.
 */
import { createClient } from '@supabase/supabase-js'

const code = process.argv[2]?.toUpperCase()
const listOnly = process.argv.includes('--list')

if (!code) {
  console.error('Usage: node --env-file=.env.local scripts/verify-coefficients.mjs <CODE> [--list]')
  console.error('  CODE: PC, SE, SGC, ...')
  process.exit(1)
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key || key === 'PASTE_ME') {
  console.error('Missing Supabase credentials. Run with --env-file=.env.local')
  process.exit(1)
}

const db = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const { data: filiere } = await db
  .from('filieres')
  .select('id, code, name_fr')
  .eq('code', code)
  .maybeSingle()

if (!filiere) {
  console.error(`✗ Filière "${code}" introuvable.`)
  process.exit(1)
}

const { data: rows, error } = await db
  .from('filiere_subjects')
  .select('id, coefficient, exam_duration_min, coefficient_verified, subjects ( name_fr )')
  .eq('filiere_id', filiere.id)
  .order('sort_order')

if (error) {
  console.error('✗', error.message)
  process.exit(1)
}

console.log(`\n${filiere.name_fr} (${filiere.code})\n`)
for (const row of rows) {
  const mark = row.coefficient_verified ? '✓' : '·'
  console.log(
    `  ${mark} ${(row.subjects?.name_fr ?? '?').padEnd(38)} coef ${String(row.coefficient).padStart(4)}   ${Math.round(row.exam_duration_min / 60)} h`,
  )
}

if (listOnly) {
  console.log('\n(--list : rien modifié)')
  process.exit(0)
}

const { error: updateError } = await db
  .from('filiere_subjects')
  .update({ coefficient_verified: true })
  .eq('filiere_id', filiere.id)

if (updateError) {
  console.error('\n✗', updateError.message)
  process.exit(1)
}

const { count } = await db
  .from('filiere_subjects')
  .select('*', { count: 'exact', head: true })
  .eq('coefficient_verified', false)

console.log(`\n✓ ${rows.length} coefficient(s) marqués comme vérifiés pour ${filiere.code}`)
console.log(`  Reste ${count} non vérifié(s) sur l'ensemble des filières.`)
