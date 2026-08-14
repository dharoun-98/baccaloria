import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { FilierePicker, type FiliereOption } from './filiere-picker'

import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Choisis ta filière',
}

type FiliereRow = {
  id: string
  code: string
  name_fr: string
  description_fr: string | null
  filiere_subjects: { subjects: { name_fr: string } | null }[] | null
}

export default async function WelcomePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/connexion')

  // Already onboarded? Don't make them pick again.
  const { data: profile } = await supabase
    .from('profiles')
    .select('filiere_id')
    .eq('id', user.id)
    .single()

  if (profile?.filiere_id) redirect('/accueil')

  const { data, error } = await supabase
    .from('filieres')
    .select(
      `id, code, name_fr, description_fr,
       filiere_subjects ( subjects ( name_fr ) )`,
    )
    .eq('is_active', true)
    .order('sort_order')

  const rows = (data ?? []) as unknown as FiliereRow[]

  const filieres: FiliereOption[] = rows.map((row) => ({
    id: row.id,
    code: row.code,
    name_fr: row.name_fr,
    description_fr: row.description_fr,
    subjects: (row.filiere_subjects ?? [])
      .map((fs) => fs.subjects?.name_fr)
      .filter((name): name is string => Boolean(name)),
  }))

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold tracking-tight text-balance">
        Quelle est ta filière ?
      </h1>
      <p className="mt-2 mb-7 leading-relaxed text-foreground-muted">
        Tout ce que tu verras ensuite — leçons, coefficients, examens — sera adapté
        à ton programme.
      </p>

      {filieres.length > 0 ? (
        <FilierePicker filieres={filieres} />
      ) : (
        <div className="rounded-card border border-border bg-surface p-6 text-sm leading-relaxed text-foreground-muted">
          <p className="font-medium text-foreground">Aucune filière disponible.</p>
          <p className="mt-2">
            La base de données n&apos;est pas encore initialisée. Lance{' '}
            <code className="rounded bg-surface-sunken px-1.5 py-0.5 font-mono text-xs">
              pnpm db:push
            </code>{' '}
            pour créer le schéma et les données de départ.
          </p>
          {error && (
            <p className="mt-3 font-mono text-xs text-foreground-subtle">
              {error.message}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
