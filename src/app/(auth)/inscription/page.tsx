import type { Metadata } from 'next'
import Link from 'next/link'

import { SignUpForm } from './sign-up-form'

export const metadata: Metadata = {
  title: 'Créer un compte',
}

export default function SignUpPage() {
  return (
    <div className="rounded-card border border-border bg-surface p-6 shadow-card sm:p-8">
      <h1 className="font-display text-2xl font-bold tracking-tight">
        Commence ta préparation
      </h1>
      <p className="mt-1.5 mb-6 text-sm text-foreground-muted">
        Gratuit pour démarrer. Tu choisiras ta filière juste après.
      </p>

      <SignUpForm />

      <p className="mt-6 border-t border-border pt-5 text-center text-sm text-foreground-muted">
        Tu as déjà un compte ?{' '}
        <Link href="/connexion" className="font-semibold text-primary hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  )
}
