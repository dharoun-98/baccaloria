'use client'

import { Check } from 'lucide-react'
import { useActionState, useState } from 'react'

import { chooseFiliere, type AuthState } from '@/app/(auth)/actions'
import { Button } from '@/components/ui/button'
import { FormError } from '@/components/ui/field'
import { cn } from '@/lib/utils'

export type FiliereOption = {
  id: string
  code: string
  name_fr: string
  description_fr: string | null
  subjects: string[]
}

const initialState: AuthState = {}

export function FilierePicker({ filieres }: { filieres: FiliereOption[] }) {
  const [selected, setSelected] = useState<string | null>(null)
  const [state, formAction, pending] = useActionState(chooseFiliere, initialState)

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <FormError>{state.error}</FormError>

      <input type="hidden" name="filiereId" value={selected ?? ''} />

      <fieldset className="flex flex-col gap-3">
        <legend className="sr-only">Choisis ta filière</legend>

        {filieres.map((filiere) => {
          const isSelected = selected === filiere.id
          return (
            <label
              key={filiere.id}
              className={cn(
                'relative flex cursor-pointer gap-3 rounded-card border-2 bg-surface p-4 transition',
                isSelected
                  ? 'border-primary bg-primary-subtle'
                  : 'border-border hover:border-brand-300',
              )}
            >
              <input
                type="radio"
                name="filiereChoice"
                value={filiere.id}
                checked={isSelected}
                onChange={() => setSelected(filiere.id)}
                className="sr-only"
              />

              <span
                aria-hidden
                className={cn(
                  'mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 transition',
                  isSelected
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border-strong',
                )}
              >
                {isSelected && <Check className="size-3" strokeWidth={3.5} />}
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-2">
                  <span className="font-display font-semibold">{filiere.name_fr}</span>
                  <span className="font-mono text-xs font-bold text-foreground-subtle">
                    {filiere.code}
                  </span>
                </span>
                {filiere.subjects.length > 0 && (
                  <span className="mt-1 block text-sm leading-relaxed text-foreground-muted">
                    {filiere.subjects.join(' · ')}
                  </span>
                )}
              </span>
            </label>
          )
        })}
      </fieldset>

      <Button type="submit" size="lg" block loading={pending} disabled={!selected}>
        Continuer
      </Button>

      <p className="text-center text-xs text-foreground-subtle">
        Tu pourras changer de filière plus tard depuis ton profil.
      </p>
    </form>
  )
}
