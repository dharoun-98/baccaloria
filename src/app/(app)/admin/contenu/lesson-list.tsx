'use client'

import { Check, Layers, Sparkles, Tag, X } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'

import { bulkAddPlacement, bulkTag } from './bulk-actions'

import type { CatalogueTag } from '@/components/admin/tag-picker'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type LessonRow = {
  id: string
  title: string
  subtitle: string | null
  status: string
  aiGenerated: boolean
  accessTier: string
  tags: string[]
  subjectId: string
  subjectName: string
  subjectColor: string
  filiereCodes: string[]
  blockCount: number
}

export type UnitOption = {
  id: string
  subjectId: string
  label: string
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'Brouillon',
  in_review: 'À relire',
  changes_requested: 'À corriger',
  published: 'Publiée',
  archived: 'Archivée',
}

const STATUS_STYLE: Record<string, string> = {
  draft: 'bg-surface-sunken text-foreground-muted',
  in_review: 'bg-accent-100 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300',
  changes_requested: 'bg-danger/12 text-danger',
  published: 'bg-success/12 text-success',
  archived: 'bg-surface-sunken text-foreground-subtle',
}

const selectClass =
  'h-10 min-w-0 flex-1 rounded-lg border border-border bg-surface px-2.5 text-sm focus-visible:border-brand-400 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ring)]'

export function LessonList({
  lessons,
  units,
  tags,
}: {
  lessons: LessonRow[]
  units: UnitOption[]
  tags: CatalogueTag[]
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [unitId, setUnitId] = useState('')
  const [tagSlug, setTagSlug] = useState('')
  const [pending, startTransition] = useTransition()

  const chosen = useMemo(
    () => lessons.filter((l) => selected.has(l.id)),
    [lessons, selected],
  )

  // A unit belongs to exactly one subject, so a mixed-subject selection has no
  // valid placement target. Say so rather than offering a choice that fails.
  const subjectIds = useMemo(
    () => [...new Set(chosen.map((l) => l.subjectId))],
    [chosen],
  )
  const sameSubject = subjectIds.length === 1
  const availableUnits = sameSubject
    ? units.filter((u) => u.subjectId === subjectIds[0])
    : []

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function run(fn: () => Promise<{ error?: string; changed?: number }>, verb: string) {
    startTransition(async () => {
      const result = await fn()
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success(
        result.changed === 0
          ? 'Rien à faire — déjà à jour.'
          : `${result.changed} leçon(s) ${verb}.`,
      )
      setSelected(new Set())
    })
  }

  const ids = [...selected]

  return (
    <>
      <ul className="flex flex-col gap-2.5 pb-28">
        {lessons.map((lesson) => {
          const active = selected.has(lesson.id)
          return (
            <li
              key={lesson.id}
              className={cn(
                'flex gap-3 rounded-card border bg-surface p-4 shadow-card transition',
                active ? 'border-primary bg-primary-subtle' : 'border-border',
              )}
            >
              <button
                type="button"
                onClick={() => toggle(lesson.id)}
                aria-pressed={active}
                aria-label={`Sélectionner ${lesson.title}`}
                className={cn(
                  'mt-0.5 grid size-5 shrink-0 place-items-center self-start rounded border-2 transition',
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border-strong text-transparent hover:border-brand-400',
                )}
              >
                <Check className="size-3" strokeWidth={3.5} aria-hidden />
              </button>

              <Link href={`/admin/contenu/${lesson.id}`} className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-display font-semibold">{lesson.title}</span>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-medium',
                      STATUS_STYLE[lesson.status] ?? STATUS_STYLE.draft,
                    )}
                  >
                    {STATUS_LABEL[lesson.status] ?? lesson.status}
                  </span>
                  {lesson.aiGenerated && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-info/12 px-2 py-0.5 text-xs font-medium text-info">
                      <Sparkles className="size-3" aria-hidden />
                      IA
                    </span>
                  )}
                  {lesson.accessTier === 'free' && (
                    <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                      gratuite
                    </span>
                  )}
                </span>

                <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                  <span className="font-medium" style={{ color: lesson.subjectColor }}>
                    {lesson.subjectName}
                  </span>
                  {lesson.filiereCodes.length > 0 ? (
                    <span className="font-mono text-foreground-muted">
                      {lesson.filiereCodes.join(' · ')}
                    </span>
                  ) : (
                    <span className="font-medium text-accent-600">
                      non placée — invisible pour les élèves
                    </span>
                  )}
                  <span className="text-foreground-subtle">
                    {lesson.blockCount} bloc(s)
                  </span>
                </span>

                {lesson.tags.length > 0 && (
                  <span className="mt-2 flex flex-wrap gap-1.5">
                    {lesson.tags.map((slug) => (
                      <span
                        key={slug}
                        className="rounded bg-surface-sunken px-1.5 py-0.5 text-[11px] text-foreground-muted"
                      >
                        {tags.find((t) => t.slug === slug)?.label ?? slug}
                      </span>
                    ))}
                  </span>
                )}
              </Link>
            </li>
          )
        })}
      </ul>

      {/* ------------------------------------------------------- bulk bar */}
      {selected.size > 0 && (
        <div
          className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/97 p-3 shadow-pop backdrop-blur-md md:left-60"
          style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
        >
          <div className="mx-auto flex max-w-3xl flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">
                {selected.size} leçon(s) sélectionnée(s)
              </p>
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="inline-flex items-center gap-1 text-sm text-foreground-muted hover:text-foreground"
              >
                <X className="size-3.5" aria-hidden />
                Désélectionner
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <select
                className={selectClass}
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
                disabled={!sameSubject}
                aria-label="Chapitre de destination"
              >
                <option value="">
                  {sameSubject
                    ? 'Ajouter à une filière…'
                    : 'Sélection de matières différentes'}
                </option>
                {availableUnits.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.label}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                disabled={!unitId}
                loading={pending}
                onClick={() => run(() => bulkAddPlacement(ids, unitId), 'placée(s)')}
              >
                <Layers className="size-3.5" aria-hidden />
                Placer
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <select
                className={selectClass}
                value={tagSlug}
                onChange={(e) => setTagSlug(e.target.value)}
                aria-label="Tag à appliquer"
              >
                <option value="">Appliquer un tag…</option>
                {tags.map((t) => (
                  <option key={t.slug} value={t.slug}>
                    {t.label}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                variant="secondary"
                disabled={!tagSlug}
                loading={pending}
                onClick={() => run(() => bulkTag(ids, tagSlug, 'add'), 'taguée(s)')}
              >
                <Tag className="size-3.5" aria-hidden />
                Ajouter
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={!tagSlug}
                loading={pending}
                onClick={() => run(() => bulkTag(ids, tagSlug, 'remove'), 'modifiée(s)')}
              >
                Retirer
              </Button>
            </div>

            {!sameSubject && (
              <p className="text-xs leading-relaxed text-foreground-subtle">
                Un chapitre appartient à une seule matière. Sélectionne des leçons
                d&apos;une même matière pour les placer ensemble.
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
