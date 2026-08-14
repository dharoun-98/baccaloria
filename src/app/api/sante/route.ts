import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Health check: /api/sante
 *
 * Reports whether the app can actually reach its database, and which
 * configuration values the RUNNING deployment has. Exists because a missing
 * env var produces a bare 500 with no clue as to which one.
 *
 * Deliberately reports presence and length only — never a value. The Supabase
 * host is the one exception: it already ships inside the client bundle, so it
 * is not a secret.
 */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY
  const site = process.env.NEXT_PUBLIC_SITE_URL

  const env = {
    NEXT_PUBLIC_SUPABASE_URL: url ? new URL(url).host : null,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: anon ? `present (${anon.length} chars)` : null,
    SUPABASE_SERVICE_ROLE_KEY: service ? `present (${service.length} chars)` : null,
    NEXT_PUBLIC_SITE_URL: site ?? null,
  }

  const missing = Object.entries(env)
    .filter(([, v]) => v === null)
    .map(([k]) => k)

  // Can we actually read from the database with the anon key?
  let database: string
  if (!url || !anon) {
    database = 'not tested — configuration incomplete'
  } else {
    try {
      const res = await fetch(
        `${url}/rest/v1/filieres?select=code&is_active=eq.true&limit=5`,
        {
          headers: { apikey: anon, Authorization: `Bearer ${anon}` },
          cache: 'no-store',
        },
      )
      if (res.ok) {
        const rows = (await res.json()) as { code: string }[]
        database = `ok — ${rows.length} filière(s): ${rows.map((r) => r.code).join(', ')}`
      } else {
        database = `unreachable — HTTP ${res.status}`
      }
    } catch (error) {
      database = `unreachable — ${error instanceof Error ? error.message : 'unknown'}`
    }
  }

  const healthy = missing.length === 0 && database.startsWith('ok')

  return NextResponse.json(
    {
      healthy,
      env,
      missing,
      database,
      hint: missing.length
        ? 'NEXT_PUBLIC_* values are baked in at build time. Add them in the hosting project, then REDEPLOY — restarting is not enough.'
        : undefined,
    },
    { status: healthy ? 200 : 503 },
  )
}
