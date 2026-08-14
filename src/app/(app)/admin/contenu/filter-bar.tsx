'use client'

import { Search, X } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'

import { cn } from '@/lib/utils'

const selectClass =
  'h-10 rounded-lg border border-border bg-surface px-2.5 text-sm focus-visible:border-brand-400 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ring)]'

export type FilterOptions = {
  subjects: { id: string; name: string }[]
  filieres: { code: string; name: string }[]
  tags: string[]
}

export function FilterBar({ options }: { options: FilterOptions }) {
  const router = useRouter()
  const params = useSearchParams()
  const [pending, startTransition] = useTransition()

  // Filters live in the URL rather than in component state: a filtered view is
  // then shareable, survives a refresh, and the back button behaves.
  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString())
    if (value) next.set(key, value)
    else next.delete(key)
    startTransition(() => router.replace(`/admin/contenu?${next.toString()}`))
  }

  const active =
    params.get('q') ||
    params.get('matiere') ||
    params.get('filiere') ||
    params.get('statut') ||
    params.get('tag')

  return (
    <div className={cn('flex flex-col gap-2', pending && 'opacity-60')}>
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-foreground-subtle"
          aria-hidden
        />
        <input
          type="search"
          defaultValue={params.get('q') ?? ''}
          onChange={(e) => setParam('q', e.target.value)}
          placeholder="Rechercher un titre…"
          aria-label="Rechercher une leçon"
          className="h-10 w-full rounded-lg border border-border bg-surface pr-3 pl-9 text-sm focus-visible:border-brand-400 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ring)]"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          className={selectClass}
          value={params.get('filiere') ?? ''}
          onChange={(e) => setParam('filiere', e.target.value)}
          aria-label="Filtrer par filière"
        >
          <option value="">Toutes les filières</option>
          {options.filieres.map((f) => (
            <option key={f.code} value={f.code}>
              {f.code} — {f.name}
            </option>
          ))}
        </select>

        <select
          className={selectClass}
          value={params.get('matiere') ?? ''}
          onChange={(e) => setParam('matiere', e.target.value)}
          aria-label="Filtrer par matière"
        >
          <option value="">Toutes les matières</option>
          {options.subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <select
          className={selectClass}
          value={params.get('statut') ?? ''}
          onChange={(e) => setParam('statut', e.target.value)}
          aria-label="Filtrer par statut"
        >
          <option value="">Tous les statuts</option>
          <option value="draft">Brouillon</option>
          <option value="in_review">À relire</option>
          <option value="published">Publiée</option>
          <option value="archived">Archivée</option>
        </select>

        {options.tags.length > 0 && (
          <select
            className={selectClass}
            value={params.get('tag') ?? ''}
            onChange={(e) => setParam('tag', e.target.value)}
            aria-label="Filtrer par tag"
          >
            <option value="">Tous les tags</option>
            {options.tags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        )}

        {active && (
          <button
            type="button"
            onClick={() => startTransition(() => router.replace('/admin/contenu'))}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-foreground-muted transition hover:bg-surface-sunken hover:text-foreground"
          >
            <X className="size-3.5" aria-hidden />
            Réinitialiser
          </button>
        )}
      </div>
    </div>
  )
}
