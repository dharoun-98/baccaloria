import { ClipboardCheck, Clock, FileText } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { requireStudent } from '@/lib/student'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Examens nationaux' }

type ExamRow = {
  id: string
  year: number
  session: 'normale' | 'rattrapage'
  duration_min: number
  digitisation: string
  filiere_subjects: { subjects: { name_fr: string; color: string } | null } | null
}

export default async function ExamsPage() {
  const student = await requireStudent()
  const supabase = await createClient()

  const { data: filiereSubjects } = await supabase
    .from('filiere_subjects')
    .select('id')
    .eq('filiere_id', student.filiereId)
    .eq('is_active', true)

  const fsIds = (filiereSubjects ?? []).map((f) => f.id)

  const { data: examRows } = fsIds.length
    ? await supabase
        .from('exams')
        .select(
          `id, year, session, duration_min, digitisation,
           filiere_subjects ( subjects ( name_fr, color ) )`,
        )
        .in('filiere_subject_id', fsIds)
        .eq('status', 'published')
        .order('year', { ascending: false })
    : { data: [] }

  const exams = (examRows ?? []) as unknown as ExamRow[]

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          Examens nationaux
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-foreground-muted">
          Les épreuves des dernières années, chronométrées, dans les conditions réelles.
        </p>
      </header>

      {exams.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="flex flex-col gap-3">
          {exams.map((exam) => {
            const subject = exam.filiere_subjects?.subjects
            return (
              <li key={exam.id}>
                <Link
                  href={`/examens/${exam.id}`}
                  className="flex items-center gap-4 rounded-card border border-border bg-surface p-4 shadow-card transition hover:border-brand-300"
                >
                  <span
                    aria-hidden
                    className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent-100 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300"
                  >
                    <FileText className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display font-semibold">
                      {subject?.name_fr ?? 'Épreuve'} — {exam.year}
                    </span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-foreground-subtle">
                      <span>
                        {exam.session === 'normale'
                          ? 'Session normale'
                          : 'Session de rattrapage'}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3" aria-hidden />
                        {Math.round(exam.duration_min / 60)} h
                      </span>
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

function EmptyState() {
  return (
    <div className="rounded-card border-2 border-dashed border-border bg-surface p-8 text-center">
      <ClipboardCheck className="mx-auto size-8 text-foreground-subtle" aria-hidden />
      <p className="mt-3 font-display font-semibold">
        Les épreuves ne sont pas encore en ligne
      </p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-foreground-muted">
        Ici tu retrouveras les examens nationaux des cinq dernières années de ta
        filière : chronomètre lancé, sujet complet, puis le corrigé détaillé pour
        noter chaque exercice et comprendre où tu as perdu des points.
      </p>
      <Link
        href="/matieres"
        className="mt-5 inline-block text-sm font-semibold text-primary hover:underline"
      >
        En attendant, révise tes leçons
      </Link>
    </div>
  )
}
