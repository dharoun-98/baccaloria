/**
 * Creates (or resets) a pre-confirmed test student, so the app can be exercised
 * without waiting on a confirmation e-mail.
 *
 *     node --env-file=.env.local scripts/create-test-user.mjs
 *
 * Reads SUPABASE_SERVICE_ROLE_KEY from the environment and never prints it.
 * Development only — do not run this against a production project you care
 * about, and delete the account before launch.
 */
import { createClient } from '@supabase/supabase-js'

const TEST_EMAIL = 'test.eleve@baccaloria.local'
const TEST_PASSWORD = 'BaccaloriaTest2027!'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey || serviceKey === 'PASTE_ME') {
  console.error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n' +
      'Run with: node --env-file=.env.local scripts/create-test-user.mjs',
  )
  process.exit(1)
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// Remove any previous run's account so this script is re-runnable.
const { data: existing } = await admin.auth.admin.listUsers({ perPage: 1000 })
const previous = existing?.users.find((u) => u.email === TEST_EMAIL)
if (previous) {
  await admin.auth.admin.deleteUser(previous.id)
  console.log('· removed previous test account')
}

const { data, error } = await admin.auth.admin.createUser({
  email: TEST_EMAIL,
  password: TEST_PASSWORD,
  email_confirm: true,
  user_metadata: { full_name: 'Élève Test' },
})

if (error) {
  console.error('✗ could not create user:', error.message)
  process.exit(1)
}

console.log('✓ test account ready')
console.log(`  email:    ${TEST_EMAIL}`)
console.log(`  password: ${TEST_PASSWORD}`)

// The handle_new_user trigger should have created the profile row.
const { data: profile, error: profileError } = await admin
  .from('profiles')
  .select('id, full_name, role, filiere_id, public_slug')
  .eq('id', data.user.id)
  .single()

if (profileError) {
  console.error('✗ profile row missing:', profileError.message)
  process.exit(1)
}

console.log('✓ profile auto-created by trigger')
console.log(`  full_name:   ${profile.full_name}`)
console.log(`  role:        ${profile.role}`)
console.log(`  filiere_id:  ${profile.filiere_id ?? '(none yet — onboarding)'}`)
console.log(`  public_slug: ${profile.public_slug ? 'generated' : 'MISSING'}`)
