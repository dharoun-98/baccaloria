import type { EmailOtpType } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

import { createClient } from '@/lib/supabase/server'

/**
 * Landing point for the link in Supabase auth e-mails.
 *
 * Supabase can arrive here in two different shapes, and the app must accept
 * both — getting this wrong confirms the account but never signs the user in,
 * which looks to them exactly like "my login is refused":
 *
 *  1. `?code=…`  — PKCE, which is what @supabase/ssr uses by default and what
 *     the STOCK e-mail template produces. The code must be exchanged for a
 *     session; verifying alone leaves the user without one.
 *
 *  2. `?token_hash=…&type=…` — produced by a customised template using
 *     {{ .TokenHash }}. Verified with verifyOtp.
 *
 * Supabase may also redirect here with `error` / `error_description` when a
 * link has expired or was already used, which is common because mail clients
 * pre-fetch links.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const errorCode = searchParams.get('error') ?? searchParams.get('error_code')

  // Only same-origin relative paths, so a crafted link cannot bounce a freshly
  // authenticated user to an attacker's page.
  const rawNext = searchParams.get('next')
  const next =
    rawNext && rawNext.startsWith('/') && !rawNext.startsWith('//')
      ? rawNext
      : '/bienvenue'

  const fail = (reason: string) =>
    NextResponse.redirect(new URL(`/connexion?erreur=${reason}`, request.url))

  if (errorCode) {
    return fail(errorCode.includes('expired') ? 'lien-expire' : 'lien-invalide')
  }

  const supabase = await createClient()

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return fail(
        error.message.toLowerCase().includes('expired') ? 'lien-expire' : 'lien-invalide',
      )
    }
    return NextResponse.redirect(new URL(next, request.url))
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    if (error) {
      return fail(
        error.message.toLowerCase().includes('expired') ? 'lien-expire' : 'lien-invalide',
      )
    }
    return NextResponse.redirect(new URL(next, request.url))
  }

  return fail('lien-invalide')
}
