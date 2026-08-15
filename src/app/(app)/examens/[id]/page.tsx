import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ExamRunner } from './exam-runner'

import { requireStudent } from '@/lib/student'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Examen national' }

export default async function ExamPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  await requireStudent()
  const supabase = await createClient()

  const { data: exam } = await supabase
    .from('exams')
    .select('id, year, session, duration_min, status, filiere_subject_id')
    .eq('id', id)
    .eq('status', 'published')
    .maybeSingle()

  if (!exam) notFound()

  // Resolved in two steps rather than as a nested select: filiere_subjects has
  // several foreign keys and the relation is ambiguous to infer.
  const [{ data: filiereSubject }, { count: exerciseCount }] = await Promise.all([
    supabase
      .from('filiere_subjects')
      .select('subject_id')
      .eq('id', exam.filiere_subject_id)
      .maybeSingle(),
    supabase
      .from('exam_exercises')
      .select('*', { count: 'exact', head: true })
      .eq('exam_id', exam.id),
  ])

  const { data: subject } = filiereSubject?.subject_id
    ? await supabase
        .from('subjects')
        .select('name_fr')
        .eq('id', filiereSubject.subject_id)
        .maybeSingle()
    : { data: null }

  const subjectName = subject?.name_fr ?? 'Épreuve'

  const title = `${subjectName} — ${exam.year}, ${
    exam.session === 'normale' ? 'session normale' : 'session de rattrapage'
  }`

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
      <Link
        href="/examens"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-foreground-muted hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Examens
      </Link>

      <ExamRunner
        examId={exam.id}
        title={title}
        durationMin={exam.duration_min}
        hasCorrige={(exerciseCount ?? 0) > 0}
      />
    </div>
  )
}
