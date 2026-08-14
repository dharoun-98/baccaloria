'use client'

import Link from 'next/link'
import { useActionState } from 'react'

import { signIn, type AuthState } from '../actions'

import { Button } from '@/components/ui/button'
import { Field, FormError, Input } from '@/components/ui/field'

const initialState: AuthState = {}

export function SignInForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(signIn, initialState)

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {next && <input type="hidden" name="next" value={next} />}

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

      <Field
        label="Mot de passe"
        htmlFor="password"
        error={state.fieldErrors?.password}
      >
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={Boolean(state.fieldErrors?.password) || undefined}
        />
      </Field>

      <div className="-mt-1 text-right">
        <Link
          href="/mot-de-passe-oublie"
          className="text-sm font-medium text-primary hover:underline"
        >
          Mot de passe oublié ?
        </Link>
      </div>

      <Button type="submit" size="lg" block loading={pending} className="mt-1">
        Se connecter
      </Button>
    </form>
  )
}
