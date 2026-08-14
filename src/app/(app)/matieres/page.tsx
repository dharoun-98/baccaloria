import { ArrowRight, BookOpen } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { requireStudent } from '@/lib/student'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Matières' }

type Row = {
  id: string
  coefficient: number
  exam_duration_min: number
  subjects: { slug: string; name_fr: string; short_name: string | null; color: string } | null
  units: { id: string }[] | null
}

export default async function SubjectsPage() {
  const student = await requireStudent()
  const supabase = await createClient()

  const { data } = await supabase
    .from('filiere_subjects')
    .select(
      `id, coefficient, exam_duration_min,
       subjects ( slug, name_fr, short_name, color ),
       units ( id )`,
    )
    .eq('filiere_id', student.filiereId)
    .eq('is_active', true)
    .order('sort_order')

  const rows = (data ?? []) as unknown as Row[]
  const maxCoef = Math.max(1, ...rows.map((r) => Number(r.coefficient)))

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          Mes matières
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-foreground-muted">
          Les barres montrent le poids de chaque matière à l&apos;examen. C&apos;est
          là que se gagnent — ou se perdent — les points.
        </p>
      </header>

      {rows.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((row) => {
            const subject = row.subjects
            if (!subject) return null

            const unitCount = row.units?.length ?? 0
            const weight = (Number(row.coefficient) / maxCoef) * 100

            return (
              <li key={row.id}>
                <Link
                  href={`/matieres/${subject.slug}`}
                  className="group flex items-center gap-4 rounded-card border border-border bg-surface p-4 shadow-card transition hover:border-brand-300"
                >
                  <span
                    aria-hidden
                    className="grid size-12 shrink-0 place-items-center rounded-xl font-display text-sm font-bold text-white"
                    style={{ backgroundColor: subject.color }}
                  >
                    {subject.short_name ?? subject.name_fr.slice(0, 3)}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="truncate font-display font-semibold">
                        {subject.name_fr}
                      </span>
                      <span className="shrink-0 font-mono text-xs font-bold text-foreground-muted tabular-nums">
                        coef {Number(row.coefficient)}
                      </span>
                    </span>

                    <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-surface-sunken">
                      <span
                        className="block h-full rounded-full transition-[width] duration-700"
                        style={{ width: `${weight}%`, backgroundColor: subject.color }}
                      />
                    </span>

                    <span className="mt-1.5 block text-xs text-foreground-subtle">
                      {unitCount > 0
                        ? `${unitCount} chapitre${unitCount > 1 ? 's' : ''}`
                        : 'Contenu en préparation'}
                      {' · '}
                      épreuve {Math.round(row.exam_duration_min / 60)} h
                    </span>
                  </span>

                  <ArrowRight
                    className="size-4 shrink-0 text-foreground-subtle transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-card border border-border bg-surface p-8 text-center">
      <BookOpen className="mx-auto size-8 text-foreground-subtle" aria-hidden />
      <p className="mt-3 font-display font-semibold">Aucune matière pour l&apos;instant</p>
      <p className="mt-1.5 text-sm text-foreground-muted">
        Le programme de ta filière n&apos;est pas encore configuré.
      </p>
    </div>
  )
}
