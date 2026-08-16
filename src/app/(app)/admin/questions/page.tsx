import { ArrowLeft, HelpCircle } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { QuestionList, type QuestionRow } from './question-list'

import { requireStudent } from '@/lib/student'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Questions', robots: { index: false } }

export default async function AdminQuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ lecon?: string; statut?: string }>
}) {
  const staff = await requireStudent()
  if (!staff.isStaff) redirect('/accueil')

  const { lecon, statut } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('questions')
    .select('id, stem, choices, explanation, difficulty, status, lesson_id, subject_id')
    .order('lesson_id')

  if (lecon) query = query.eq('lesson_id', lecon)
  if (statut) query = query.eq('status', statut)

  const [{ data: rows }, { data: lessons }, { data: subjects }] = await Promise.all([
    query,
    supabase.from('lessons').select('id, title_fr, status').order('title_fr'),
    supabase.from('subjects').select('id, name_fr'),
  ])

  const lessonById = new Map((lessons ?? []).map((l) => [l.id, l.title_fr]))
  const subjectById = new Map((subjects ?? []).map((s) => [s.id, s.name_fr]))

  const questions: QuestionRow[] = (rows ?? []).map((q) => ({
    id: q.id,
    stem: (q.stem as { markdown?: string } | null)?.markdown ?? '',
    explanation: (q.explanation as { markdown?: string } | null)?.markdown ?? '',
    difficulty: q.difficulty,
    status: q.status,
    lessonTitle: q.lesson_id ? (lessonById.get(q.lesson_id) ?? '—') : 'Sans leçon',
    subjectName: subjectById.get(q.subject_id) ?? '',
    choices: (q.choices ?? []) as QuestionRow['choices'],
  }))

  const drafts = questions.filter((q) => q.status !== 'published').length

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <Link
        href="/admin"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-foreground-muted hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Administration
      </Link>

      <header className="mb-5">
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          Banque de questions
        </h1>
        <p className="mt-1.5 text-sm text-foreground-muted">
          {questions.length} question(s)
          {drafts > 0 && ` · ${drafts} en brouillon`}
        </p>
      </header>

      {/* Plain links rather than a client filter: two filters do not justify
          the extra machinery, and these URLs stay shareable. */}
      <div className="mb-5 flex flex-wrap gap-2">
        {[
          { label: 'Toutes', href: '/admin/questions' },
          { label: 'Publiées', href: '/admin/questions?statut=published' },
          { label: 'Brouillons', href: '/admin/questions?statut=draft' },
        ].map((f) => (
          <Link
            key={f.href}
            href={f.href}
            className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm font-medium transition hover:border-brand-300"
          >
            {f.label}
          </Link>
        ))}

        <form className="flex gap-2">
          <select
            name="lecon"
            defaultValue={lecon ?? ''}
            className="h-9 rounded-full border border-border bg-surface px-3 text-sm"
            aria-label="Filtrer par leçon"
          >
            <option value="">Toutes les leçons</option>
            {(lessons ?? []).map((l) => (
              <option key={l.id} value={l.id}>
                {l.title_fr}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm font-medium transition hover:border-brand-300"
          >
            Filtrer
          </button>
        </form>
      </div>

      {questions.length === 0 ? (
        <div className="rounded-card border border-border bg-surface p-8 text-center">
          <HelpCircle className="mx-auto size-8 text-foreground-subtle" aria-hidden />
          <p className="mt-3 font-display font-semibold">Aucune question</p>
          <p className="mt-1.5 text-sm text-foreground-muted">
            Les questions arrivent avec les leçons. Publier une leçon publie aussi
            son quiz.
          </p>
        </div>
      ) : (
        <QuestionList questions={questions} />
      )}
    </div>
  )
}
