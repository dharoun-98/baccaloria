'use client'

import { Loader2 } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useRef, useState } from 'react'

import { createClient } from '@/lib/supabase/client'

/**
 * Landing page for every Supabase auth e-mail link.
 *
 * This MUST be a client page, not a route handler. Supabase's /auth/v1/verify
 * endpoint returns the session in the URL **fragment**:
 *
 *     /auth/confirmer?next=/x#access_token=…&refresh_token=…&type=recovery
 *
 * A fragment is never transmitted to the server, so a route handler sees an
 * empty query, concludes the link is invalid, and bounces the user to the
 * login page — which is precisely how a confirmed account ended up unable to
 * sign in. Only the browser can read it.
 *
 * Three shapes are handled, because which one arrives depends on how the link
 * was generated and on the e-mail template:
 *
 *   #access_token=…      implicit flow — the stock template and any
 *                        admin-generated link
 *   ?code=…              PKCE, when the flow began in this browser
 *   ?token_hash=…&type=  a customised template using {{ .TokenHash }}
 */
function Confirming() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  // React 18+ runs effects twice in development. Consuming a one-time token
  // twice makes the second attempt fail, so guard it.
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    const rawNext = searchParams.get('next')
    const next =
      rawNext && rawNext.startsWith('/') && !rawNext.startsWith('//')
        ? rawNext
        : '/bienvenue'

    async function run() {
      const supabase = createClient()

      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
      const hashError = hash.get('error_description') ?? hash.get('error')
      const queryError =
        searchParams.get('error_description') ?? searchParams.get('error')
      const anyError = hashError ?? queryError

      if (anyError) {
        setError(
          anyError.toLowerCase().includes('expired') ? 'lien-expire' : 'lien-invalide',
        )
        return
      }

      const accessToken = hash.get('access_token')
      const refreshToken = hash.get('refresh_token')
      const code = searchParams.get('code')
      const tokenHash = searchParams.get('token_hash')
      const type = searchParams.get('type')

      let failed = false

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        failed = Boolean(error)
      } else if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        failed = Boolean(error)
      } else if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({
          type: type as 'signup' | 'recovery' | 'email_change' | 'magiclink',
          token_hash: tokenHash,
        })
        failed = Boolean(error)
      } else {
        failed = true
      }

      if (failed) {
        setError('lien-invalide')
        return
      }

      // Strip the tokens from the address bar before moving on, so they do not
      // sit in history or get shared in a copied URL.
      window.history.replaceState(null, '', window.location.pathname)

      // A full navigation, not a client-side push: the session lives in cookies
      // and the server needs to re-read them to render the next page as signed in.
      window.location.replace(next)
    }

    run()
  }, [router, searchParams])

  useEffect(() => {
    if (error) router.replace(`/connexion?erreur=${error}`)
  }, [error, router])

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-4">
      <Loader2 className="size-6 animate-spin text-primary" aria-hidden />
      <p className="text-sm text-foreground-muted">Connexion en cours…</p>
    </div>
  )
}

export default function ConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center">
          <Loader2 className="size-6 animate-spin text-primary" aria-hidden />
        </div>
      }
    >
      <Confirming />
    </Suspense>
  )
}
