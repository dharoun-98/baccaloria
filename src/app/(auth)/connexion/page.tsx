import { AlertCircle } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { SignInForm } from './sign-in-form'

export const metadata: Metadata = {
  title: 'Connexion',
}

/**
 * Messages for the `erreur` parameter that /auth/confirmer redirects with.
 * Without these the user is bounced to a bare login form with no explanation,
 * which reads as "my account was refused" — the single most confusing thing
 * that can happen right after signing up.
 */
const ERRORS: Record<string, { title: string; body: string }> = {
  'lien-expire': {
    title: 'Ce lien a expiré',
    body: "Les liens de confirmation ne sont valables que quelques heures. Connecte-toi ci-dessous : si ton compte est déjà activé, ça fonctionnera. Sinon, demande un nouveau lien.",
  },
  'lien-invalide': {
    title: 'Ce lien n’a pas pu être utilisé',
    body: "Il a peut-être déjà servi — c'est fréquent, certaines messageries ouvrent les liens automatiquement. Ton compte est probablement déjà activé : essaie simplement de te connecter.",
  },
  configuration: {
    title: 'Service momentanément indisponible',
    body: 'Un problème de configuration empêche la connexion. Réessaie dans quelques minutes.',
  },
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ suivant?: string; erreur?: string }>
}) {
  const { suivant, erreur } = await searchParams
  const notice = erreur ? ERRORS[erreur] : undefined

  return (
    <div className="rounded-card border border-border bg-surface p-6 shadow-card sm:p-8">
      <h1 className="font-display text-2xl font-bold tracking-tight">
        Content de te revoir
      </h1>
      <p className="mt-1.5 mb-6 text-sm text-foreground-muted">
        Reprends ta préparation là où tu l&apos;as laissée.
      </p>

      {notice && (
        <div
          role="status"
          className="mb-5 flex gap-3 rounded-xl border border-accent-300 bg-accent-50 p-4 dark:border-accent-800 dark:bg-accent-900/25"
        >
          <AlertCircle
            className="mt-0.5 size-4 shrink-0 text-accent-600"
            aria-hidden
          />
          <div>
            <p className="text-sm font-semibold">{notice.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-foreground-muted">
              {notice.body}
            </p>
          </div>
        </div>
      )}

      <SignInForm next={suivant} />

      <p className="mt-6 border-t border-border pt-5 text-center text-sm text-foreground-muted">
        Pas encore de compte ?{' '}
        <Link
          href="/inscription"
          className="font-semibold text-primary hover:underline"
        >
          Créer un compte
        </Link>
      </p>
    </div>
  )
}
