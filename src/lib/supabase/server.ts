import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import type { Database } from './database.types'

/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 * Still the anon key + the user's session, so RLS applies normally.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options)
            }
          } catch {
            // Called from a Server Component, where cookies are read-only.
            // Middleware refreshes the session, so this is safe to ignore.
          }
        },
      },
    },
  )
}

/**
 * Service-role client. Bypasses RLS entirely.
 *
 * Use ONLY in server-side admin paths that have already checked the caller is
 * an admin (approving a payment, backfilling content). Never import this into
 * anything that can reach a Client Component — the key must never ship to the
 * browser, and a leak here defeats every policy in the database.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set. It is required for admin operations.',
    )
  }

  return createServerClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    cookies: { getAll: () => [], setAll: () => {} },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
