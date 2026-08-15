import { ArrowLeft, FileText } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { requireStudent } from '@/lib/student'
import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Examens', robots: { index: false } }

export default async function AdminExamsPage() {
  const staff = await requireStudent()
  if (!staff.isStaff) redirect('/accueil')

  const supabase = await createClient()

  const { data: exams } = await supabase
    .from('exams')
    .select('id, year, session, status, duration_min, total_points, filiere_subject_id')
    .order('year', { ascending: false })
    .order('session')

  const rows = exams ?? []

  // Exercise counts and corrigé completeness, resolved in one pass.
  const { data: exercises } = await supabase
    .from('exam_exercises')
    .select('exam_id, points, corrige')

  const stats = new Map<string, { count: number; done: number; points: number }>()
  for (const ex of exercises ?? []) {
    const entry = stats.get(ex.exam_id) ?? { count: 0, done: 0, points: 0 }
    entry.count++
    entry.points += Number(ex.points)
    if ((ex.corrige as { markdown?: string } | null)?.markdown?.trim()) entry.done++
    stats.set(ex.exam_id, entry)
  }

  const { data: fsRows } = await supabase
    .from('filiere_subjects')
    .select('id, subject_id, filiere_id')

  const subjectIds = [...new Set((fsRows ?? []).map((f) => f.subject_id))]
  const [{ data: subjects }, { data: filieres }] = await Promise.all([
    subjectIds.length
      ? supabase.from('subjects').select('id, name_fr').in('id', subjectIds)
      : Promise.resolve({ data: [] }),
    supabase.from('filieres').select('id, code'),
  ])

  const subjectById = new Map((subjects ?? []).map((s) => [s.id, s.name_fr]))
  const filiereById = new Map((filieres ?? []).map((f) => [f.id, f.code]))
  const fsById = new Map(
    (fsRows ?? []).map((f) => [
      f.id,
      `${filiereById.get(f.filiere_id) ?? '?'} · ${subjectById.get(f.subject_id) ?? '?'}`,
    ]),
  )

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <Link
        href="/admin"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-foreground-muted hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Administration
      </Link>

      <header className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          Examens nationaux
        </h1>
        <p className="mt-1.5 text-sm text-foreground-muted">
          {rows.length} sujet(s) importé(s) ·{' '}
          {rows.filter((r) => r.status === 'published').length} publié(s)
        </p>
      </header>

      {rows.length === 0 ? (
        <div className="rounded-card border border-border bg-surface p-8 text-center">
          <FileText className="mx-auto size-8 text-foreground-subtle" aria-hidden />
          <p className="mt-3 font-display font-semibold">Aucun sujet importé</p>
          <p className="mt-1.5 text-sm text-foreground-muted">
            Dépose les PDF dans « Bac exams » puis lance{' '}
            <code className="rounded bg-surface-sunken px-1.5 py-0.5 font-mono text-xs">
              scripts/import-exams.mjs
            </code>
            .
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((exam) => {
            const stat = stats.get(exam.id) ?? { count: 0, done: 0, points: 0 }
            const complete = stat.count > 0 && stat.done === stat.count
            const balanced = Math.abs(stat.points - Number(exam.total_points)) < 0.01

            return (
              <li key={exam.id}>
                <Link
                  href={`/admin/examens/${exam.id}`}
                  className="flex items-center gap-3 rounded-card border border-border bg-surface p-4 shadow-card transition hover:border-brand-300"
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-display font-semibold">
                        {exam.year} —{' '}
                        {exam.session === 'normale' ? 'normale' : 'rattrapage'}
                      </span>
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-medium',
                          exam.status === 'published'
                            ? 'bg-success/12 text-success'
                            : 'bg-surface-sunken text-foreground-muted',
                        )}
                      >
                        {exam.status === 'published' ? 'publié' : 'brouillon'}
                      </span>
                    </span>

                    <span className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-foreground-muted">
                      <span>{fsById.get(exam.filiere_subject_id) ?? ''}</span>
                      <span>{Math.round(exam.duration_min / 60)} h</span>
                      {stat.count === 0 ? (
                        <span className="font-medium text-accent-600">
                          pas encore découpé en exercices
                        </span>
                      ) : (
                        <span
                          className={cn(
                            'font-medium',
                            complete ? 'text-success' : 'text-accent-600',
                          )}
                        >
                          corrigé {stat.done}/{stat.count}
                          {!balanced && ` · barème ${stat.points}/${Number(exam.total_points)}`}
                        </span>
                      )}
                    </span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
