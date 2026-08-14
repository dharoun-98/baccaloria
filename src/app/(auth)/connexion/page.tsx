import type { Metadata } from 'next'
import Link from 'next/link'

import { SignInForm } from './sign-in-form'

export const metadata: Metadata = {
  title: 'Connexion',
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ suivant?: string }>
}) {
  const { suivant } = await searchParams

  return (
    <div className="rounded-card border border-border bg-surface p-6 shadow-card sm:p-8">
      <h1 className="font-display text-2xl font-bold tracking-tight">
        Content de te revoir
      </h1>
      <p className="mt-1.5 mb-6 text-sm text-foreground-muted">
        Reprends ta préparation là où tu l&apos;as laissée.
      </p>

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
