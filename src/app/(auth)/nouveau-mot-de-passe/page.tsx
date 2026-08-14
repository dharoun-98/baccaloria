'use client'

import Link from 'next/link'
import { useActionState } from 'react'

import { setNewPassword, type AuthState } from '../actions'

import { Button } from '@/components/ui/button'
import { Field, FormError, Input } from '@/components/ui/field'

const initialState: AuthState = {}

export default function NewPasswordPage() {
  const [state, formAction, pending] = useActionState(setNewPassword, initialState)

  return (
    <div className="rounded-card border border-border bg-surface p-6 shadow-card sm:p-8">
      <h1 className="font-display text-2xl font-bold tracking-tight">
        Choisis un nouveau mot de passe
      </h1>
      <p className="mt-1.5 mb-6 text-sm text-foreground-muted">
        Tu seras connecté·e directement après.
      </p>

      <form action={formAction} className="flex flex-col gap-4">
        <FormError>{state.error}</FormError>

        <Field
          label="Nouveau mot de passe"
          htmlFor="password"
          hint="8 caractères minimum."
          error={state.fieldErrors?.password}
        >
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            autoFocus
            aria-invalid={Boolean(state.fieldErrors?.password) || undefined}
          />
        </Field>

        <Field
          label="Confirme le mot de passe"
          htmlFor="confirm"
          error={state.fieldErrors?.confirm}
        >
          <Input
            id="confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            aria-invalid={Boolean(state.fieldErrors?.confirm) || undefined}
          />
        </Field>

        <Button type="submit" size="lg" block loading={pending} className="mt-1">
          Enregistrer et me connecter
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
