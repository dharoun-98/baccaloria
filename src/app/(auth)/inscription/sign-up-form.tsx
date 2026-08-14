'use client'

import { useActionState } from 'react'

import { signUp, type AuthState } from '../actions'

import { Button } from '@/components/ui/button'
import { Field, FormError, Input } from '@/components/ui/field'

const initialState: AuthState = {}

export function SignUpForm() {
  const [state, formAction, pending] = useActionState(signUp, initialState)

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FormError>{state.error}</FormError>

      <Field label="Nom complet" htmlFor="fullName" error={state.fieldErrors?.fullName}>
        <Input
          id="fullName"
          name="fullName"
          type="text"
          autoComplete="name"
          placeholder="Ton prénom et ton nom"
          required
          aria-invalid={Boolean(state.fieldErrors?.fullName) || undefined}
        />
      </Field>

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

      <Field
        label="Mot de passe"
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
          aria-invalid={Boolean(state.fieldErrors?.password) || undefined}
        />
      </Field>

      <Button type="submit" size="lg" block loading={pending} className="mt-1">
        Créer mon compte
      </Button>

      <p className="text-center text-xs leading-relaxed text-foreground-subtle">
        En créant un compte, tu acceptes nos{' '}
        <a href="/conditions" className="underline hover:text-foreground-muted">
          conditions d&apos;utilisation
        </a>{' '}
        et notre{' '}
        <a href="/confidentialite" className="underline hover:text-foreground-muted">
          politique de confidentialité
        </a>
        .
      </p>
    </form>
  )
}
