/**
 * Confirms an account and grants it the admin role.
 *
 *     node --env-file=.env.local scripts/promote-admin.mjs ton@email.com
 *
 * Two jobs, both needed for the first real account:
 *
 *  1. Marks the e-mail confirmed, so you are not blocked by Supabase's default
 *     shared mail service — it is rate-limited and often filed as spam.
 *  2. Sets profiles.role = 'admin', which is what the admin area and the
 *     is_admin() RLS policies check.
 *
 * Never touches the password: sign up normally at /inscription first, choose
 * your own password, then run this.
 */
import { createClient } from '@supabase/supabase-js'

const email = process.argv[2]?.trim().toLowerCase()

if (!email || !email.includes('@')) {
  console.error('Usage: node --env-file=.env.local scripts/promote-admin.mjs ton@email.com')
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

const { data: list, error: listError } = await db.auth.admin.listUsers({ perPage: 1000 })
if (listError) {
  console.error('✗', listError.message)
  process.exit(1)
}

const user = list.users.find((u) => u.email?.toLowerCase() === email)

if (!user) {
  console.error(`✗ No account found for ${email}.`)
  console.error('  Sign up at /inscription first, then run this again.')
  process.exit(1)
}

if (!user.email_confirmed_at) {
  const { error } = await db.auth.admin.updateUserById(user.id, { email_confirm: true })
  if (error) {
    console.error('✗ could not confirm e-mail:', error.message)
    process.exit(1)
  }
  console.log('✓ e-mail confirmed')
} else {
  console.log('· e-mail was already confirmed')
}

const { error: roleError } = await db
  .from('profiles')
  .update({ role: 'admin' })
  .eq('id', user.id)

if (roleError) {
  console.error('✗ could not set role:', roleError.message)
  process.exit(1)
}

console.log('✓ role set to admin')

const { data: profile } = await db
  .from('profiles')
  .select('full_name, role, filiere_id')
  .eq('id', user.id)
  .single()

console.log(`\n  ${email}`)
console.log(`  name:    ${profile?.full_name ?? '(not set)'}`)
console.log(`  role:    ${profile?.role}`)
console.log(`  filière: ${profile?.filiere_id ? 'chosen' : 'not chosen yet'}`)
console.log('\nSign in normally — you now have staff access.')
