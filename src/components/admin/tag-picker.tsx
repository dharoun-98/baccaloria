'use client'

import { Check, Plus, Search, Tag as TagIcon, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

export type CatalogueTag = {
  slug: string
  label: string
  category: string
  description: string | null
}

const CATEGORY_LABEL: Record<string, string> = {
  relecture: 'Relecture',
  pedagogie: 'Pédagogie',
  examen: 'Examen',
  adaptation: 'Adaptation filière',
  autre: 'Autre',
}

const CATEGORY_STYLE: Record<string, string> = {
  relecture: 'bg-accent-100 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300',
  pedagogie: 'bg-info/12 text-info',
  examen: 'bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300',
  adaptation: 'bg-surface-sunken text-foreground-muted',
  autre: 'bg-surface-sunken text-foreground-muted',
}

/**
 * Tag picker over a curated catalogue.
 *
 * Selected tags are written to a hidden input as a comma-separated list, so the
 * surrounding <form> keeps working without any client-side submit handling.
 *
 * Free typing still allows a new tag, but only behind an explicit "create"
 * action — the point of the catalogue is that a typo cannot silently become a
 * fourth spelling of "démonstration".
 */
export function TagPicker({
  name = 'tags',
  catalogue,
  initial = [],
}: {
  name?: string
  catalogue: CatalogueTag[]
  initial?: string[]
}) {
  const [selected, setSelected] = useState<string[]>(initial)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string>('')
  const panelRef = useRef<HTMLDivElement>(null)

  const bySlug = useMemo(
    () => new Map(catalogue.map((t) => [t.slug, t])),
    [catalogue],
  )

  const categories = useMemo(
    () => [...new Set(catalogue.map((t) => t.category))],
    [catalogue],
  )

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    return catalogue.filter((t) => {
      if (category && t.category !== category) return false
      if (!q) return true
      return (
        t.label.toLowerCase().includes(q) ||
        t.slug.includes(q) ||
        (t.description ?? '').toLowerCase().includes(q)
      )
    })
  }, [catalogue, query, category])

  // Close on outside click and on Escape — a picker that traps you is worse
  // than no picker.
  useEffect(() => {
    if (!open) return

    function onClick(event: MouseEvent) {
      if (!panelRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function toggle(slug: string) {
    setSelected((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    )
  }

  const trimmed = query.trim().toLowerCase().replace(/\s+/g, '-')
  const canCreate =
    trimmed.length > 1 && !bySlug.has(trimmed) && !selected.includes(trimmed)

  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name={name} value={selected.join(',')} />

      {/* -------------------------------------------------- selected pills */}
      <div className="flex flex-wrap items-center gap-1.5">
        {selected.length === 0 && (
          <span className="text-sm text-foreground-subtle">Aucun tag</span>
        )}

        {selected.map((slug) => {
          const tag = bySlug.get(slug)
          return (
            <span
              key={slug}
              className={cn(
                'inline-flex items-center gap-1 rounded-full py-1 pr-1 pl-2.5 text-xs font-medium',
                CATEGORY_STYLE[tag?.category ?? 'autre'],
              )}
            >
              {tag?.label ?? slug}
              <button
                type="button"
                onClick={() => toggle(slug)}
                className="rounded-full p-0.5 transition hover:bg-black/10 dark:hover:bg-white/10"
                aria-label={`Retirer ${tag?.label ?? slug}`}
              >
                <X className="size-3" aria-hidden />
              </button>
            </span>
          )
        })}

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-border-strong px-2.5 py-1 text-xs font-medium text-foreground-muted transition hover:border-brand-400 hover:text-foreground"
        >
          <Plus className="size-3" aria-hidden />
          Ajouter
        </button>
      </div>

      {/* -------------------------------------------------------- the panel */}
      {open && (
        <div
          ref={panelRef}
          className="rounded-card border border-border bg-surface p-3 shadow-pop"
        >
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-foreground-subtle"
              aria-hidden
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Chercher un tag…"
              aria-label="Chercher un tag"
              autoFocus
              className="h-9 w-full rounded-lg border border-border bg-surface-sunken pr-2.5 pl-8 text-sm focus-visible:border-brand-400 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ring)]"
            />
          </div>

          <div className="mt-2 flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => setCategory('')}
              className={cn(
                'rounded-full px-2.5 py-1 text-xs font-medium transition',
                category === ''
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-surface-sunken text-foreground-muted hover:text-foreground',
              )}
            >
              Tous
            </button>
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(category === c ? '' : c)}
                className={cn(
                  'rounded-full px-2.5 py-1 text-xs font-medium transition',
                  category === c
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-surface-sunken text-foreground-muted hover:text-foreground',
                )}
              >
                {CATEGORY_LABEL[c] ?? c}
              </button>
            ))}
          </div>

          {/* Scrolls rather than growing: the catalogue will only get longer. */}
          <div className="mt-2 max-h-64 overflow-y-auto">
            {matches.length === 0 && !canCreate && (
              <p className="px-1 py-3 text-center text-sm text-foreground-subtle">
                Aucun tag ne correspond.
              </p>
            )}

            <ul className="flex flex-col">
              {matches.map((tag) => {
                const active = selected.includes(tag.slug)
                return (
                  <li key={tag.slug}>
                    <button
                      type="button"
                      onClick={() => toggle(tag.slug)}
                      className={cn(
                        'flex w-full items-start gap-2.5 rounded-lg px-2 py-2 text-left transition',
                        active ? 'bg-primary-subtle' : 'hover:bg-surface-sunken',
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          'mt-0.5 grid size-4 shrink-0 place-items-center rounded border-2 transition',
                          active
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border-strong text-transparent',
                        )}
                      >
                        <Check className="size-2.5" strokeWidth={4} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="text-sm font-medium">{tag.label}</span>
                          <span
                            className={cn(
                              'rounded px-1.5 py-0.5 text-[10px] font-medium',
                              CATEGORY_STYLE[tag.category],
                            )}
                          >
                            {CATEGORY_LABEL[tag.category] ?? tag.category}
                          </span>
                        </span>
                        {tag.description && (
                          <span className="mt-0.5 block text-xs leading-snug text-foreground-muted">
                            {tag.description}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>

            {canCreate && (
              <button
                type="button"
                onClick={() => {
                  toggle(trimmed)
                  setQuery('')
                }}
                className="mt-1 flex w-full items-center gap-2 rounded-lg border border-dashed border-border-strong px-2 py-2 text-left text-sm transition hover:border-brand-400"
              >
                <TagIcon className="size-3.5 shrink-0 text-foreground-subtle" aria-hidden />
                <span>
                  Créer le tag{' '}
                  <strong className="font-semibold">« {trimmed} »</strong>
                </span>
              </button>
            )}
          </div>

          <p className="mt-2 border-t border-border pt-2 text-xs leading-relaxed text-foreground-subtle">
            Les tags servent à toi et à ton équipe. Les élèves ne les voient jamais.
          </p>
        </div>
      )}
    </div>
  )
}
