'use client'

import Link from 'next/link'
import { useActionState } from 'react'

import { requestPasswordReset, type AuthState } from '../actions'

import { Button } from '@/components/ui/button'
import { Field, FormError, Input } from '@/components/ui/field'

const initialState: AuthState = {}

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(
    requestPasswordReset,
    initialState,
  )

  return (
    <div className="rounded-card border border-border bg-surface p-6 shadow-card sm:p-8">
      <h1 className="font-display text-2xl font-bold tracking-tight">
        Mot de passe oublié
      </h1>
      <p className="mt-1.5 mb-6 text-sm text-foreground-muted">
        Indique ton adresse e-mail et nous t&apos;enverrons un lien pour en choisir
        un nouveau.
      </p>

      <form action={formAction} className="flex flex-col gap-4">
        <FormError>{state.error}</FormError>

        <Field label="Adresse e-mail" htmlFor="email" error={state.fieldErrors?.email}>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            autoCapitalize="none"
            placeholder="prenom@exemple.com"
            required
            aria-invalid={Boolean(state.fieldErrors?.email) || undefined}
          />
        </Field>

        <Button type="submit" size="lg" block loading={pending}>
          Envoyer le lien
        </Button>
      </form>

      <p className="mt-6 border-t border-border pt-5 text-center text-sm text-foreground-muted">
        <Link href="/connexion" className="font-semibold text-primary hover:underline">
          Retour à la connexion
        </Link>
      </p>
    </div>
  )
}
