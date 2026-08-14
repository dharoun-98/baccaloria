'use client'

import { Copy, Plus, X } from 'lucide-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { addPlacement, duplicateLesson, removePlacement } from '../lesson-actions'

import { Button } from '@/components/ui/button'

export type Placement = {
  unitId: string
  unitTitle: string
  filiereCode: string
  filiereName: string
  subjectName: string
}

export type AvailableUnit = {
  id: string
  label: string
}

export function Placements({
  lessonId,
  placements,
  available,
}: {
  lessonId: string
  placements: Placement[]
  available: AvailableUnit[]
}) {
  const [pending, startTransition] = useTransition()
  const [selected, setSelected] = useState('')

  function add() {
    if (!selected) return
    startTransition(async () => {
      const result = await addPlacement(lessonId, selected)
      if (result.error) toast.error(result.error)
      else {
        toast.success('Leçon ajoutée à cette filière.')
        setSelected('')
      }
    })
  }

  function remove(unitId: string) {
    startTransition(async () => {
      const result = await removePlacement(lessonId, unitId)
      if (result.error) toast.error(result.error)
      else toast.success('Retirée de cette filière.')
    })
  }

  function duplicate() {
    startTransition(async () => {
      const result = await duplicateLesson(lessonId)
      if (result?.error) toast.error(result.error)
    })
  }

  return (
    <section className="rounded-card border border-border bg-surface p-5">
      <h2 className="font-display font-semibold">Où cette leçon apparaît</h2>
      <p className="mt-1 text-sm leading-relaxed text-foreground-muted">
        La même leçon peut servir plusieurs filières sans être recopiée — c&apos;est le
        cas de Philosophie ou d&apos;Anglais. Si le programme diffère vraiment,
        duplique-la plutôt et adapte le contenu.
      </p>

      {placements.length === 0 ? (
        <p className="mt-4 rounded-lg border border-accent-300 bg-accent-50 p-3 text-sm dark:border-accent-800 dark:bg-accent-900/25">
          Cette leçon n&apos;est placée nulle part : aucun élève ne peut la voir, même
          publiée.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {placements.map((p) => (
            <li
              key={p.unitId}
              className="flex items-center gap-3 rounded-lg border border-border bg-surface-sunken px-3 py-2.5"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">
                  <span className="font-mono">{p.filiereCode}</span> · {p.subjectName}
                </span>
                <span className="block text-xs text-foreground-subtle">
                  Chapitre : {p.unitTitle}
                </span>
              </span>
              <button
                type="button"
                onClick={() => remove(p.unitId)}
                disabled={pending}
                className="rounded-lg p-1.5 text-foreground-subtle transition hover:bg-danger/10 hover:text-danger"
                aria-label={`Retirer de ${p.filiereCode}`}
              >
                <X className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      {available.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            aria-label="Ajouter à un chapitre"
            className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-surface px-3 text-sm focus-visible:border-brand-400 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ring)]"
          >
            <option value="">Ajouter à une autre filière…</option>
            {available.map((u) => (
              <option key={u.id} value={u.id}>
                {u.label}
              </option>
            ))}
          </select>
          <Button onClick={add} loading={pending} disabled={!selected} variant="secondary">
            <Plus className="size-4" aria-hidden />
            Ajouter
          </Button>
        </div>
      )}

      <div className="mt-4 border-t border-border pt-4">
        <Button onClick={duplicate} loading={pending} variant="ghost" size="sm">
          <Copy className="size-4" aria-hidden />
          Dupliquer pour adapter à une autre filière
        </Button>
        <p className="mt-1.5 text-xs leading-relaxed text-foreground-subtle">
          Crée un brouillon indépendant avec le même contenu. À utiliser quand le
          programme diffère — Maths SE/SGC par rapport à Maths PC, par exemple.
        </p>
      </div>
    </section>
  )
}
