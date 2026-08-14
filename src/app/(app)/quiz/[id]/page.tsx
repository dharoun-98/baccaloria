import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { QuizRunner } from './quiz-runner'

import { requireStudent } from '@/lib/student'
import { createClient } from '@/lib/supabase/server'

type Params = { id: string }

export const metadata: Metadata = { title: 'Quiz' }

export default async function QuizPage({ params }: { params: Promise<Params> }) {
  const { id } = await params
  await requireStudent()
  const supabase = await createClient()

  const { data: assessment } = await supabase
    .from('assessments')
    .select('id, title_fr, instructions_fr, kind, lesson_id')
    .eq('id', id)
    .eq('status', 'published')
    .maybeSingle()

  if (!assessment) notFound()

  // Resolved separately rather than as a nested select: `assessments` has four
  // nullable foreign keys, so the relation to `lessons` is ambiguous to infer.
  let backHref = '/matieres'

  if (assessment.lesson_id) {
    const { data: lesson } = await supabase
      .from('lessons')
      .select('slug, subject_id')
      .eq('id', assessment.lesson_id)
      .maybeSingle()

    if (lesson) {
      const { data: subject } = await supabase
        .from('subjects')
        .select('slug')
        .eq('id', lesson.subject_id)
        .maybeSingle()

      if (subject) backHref = `/matieres/${subject.slug}/${lesson.slug}`
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
      <QuizRunner
        assessmentId={assessment.id}
        title={assessment.title_fr}
        instructions={assessment.instructions_fr}
        backHref={backHref}
      />
    </div>
  )
}
