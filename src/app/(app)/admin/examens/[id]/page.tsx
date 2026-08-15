import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { ExerciseEditor, type Exercise } from './exercise-editor'

import { requireStudent } from '@/lib/student'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Corrigé', robots: { index: false } }

export default async function AdminExamPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const staff = await requireStudent()
  if (!staff.isStaff) redirect('/accueil')

  const supabase = await createClient()

  const { data: exam } = await supabase
    .from('exams')
    .select('id, year, session, status, duration_min, total_points, subject_pdf_path')
    .eq('id', id)
    .maybeSingle()

  if (!exam) notFound()

  const { data: rows } = await supabase
    .from('exam_exercises')
    .select('id, position, label_fr, points, corrige')
    .eq('exam_id', id)
    .order('position')

  const exercises: Exercise[] = (rows ?? []).map((r) => ({
    id: r.id,
    position: r.position,
    label: r.label_fr,
    points: Number(r.points),
    corrige: (r.corrige as { markdown?: string } | null)?.markdown ?? null,
  }))

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
      <Link
        href="/admin/examens"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-foreground-muted hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Examens
      </Link>

      <header className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Examen {exam.year} —{' '}
          {exam.session === 'normale' ? 'session normale' : 'session de rattrapage'}
        </h1>
        <p className="mt-1.5 text-sm text-foreground-muted">
          {Math.round(exam.duration_min / 60)} h · {Number(exam.total_points)} points
        </p>
      </header>

      <ExerciseEditor
        examId={exam.id}
        exercises={exercises}
        status={exam.status}
        totalPoints={Number(exam.total_points)}
      />
    </div>
  )
}
