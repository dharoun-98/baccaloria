import { createBrowserClient } from '@supabase/ssr'

import type { Database } from './database.types'

/**
 * Supabase client for Client Components.
 *
 * Only ever carries the anon key, so every query it makes is subject to RLS.
 * That is the point: the browser is untrusted, and the policies in
 * supabase/migrations/0006_rls.sql are what actually protect the paywall.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
