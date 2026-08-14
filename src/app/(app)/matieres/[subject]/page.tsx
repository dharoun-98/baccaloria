import { ArrowLeft, CheckCircle2, Circle, Flame, Lock } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { requireStudent } from '@/lib/student'
import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'

type Params = { subject: string }

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { subject } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('subjects')
    .select('name_fr')
    .eq('slug', subject)
    .maybeSingle()

  return { title: data?.name_fr ?? 'Matière' }
}

type LessonRow = {
  id: string
  slug: string
  title_fr: string
  subtitle_fr: string | null
  est_minutes: number
  difficulty: number
  exam_frequency: number
  access_tier: 'free' | 'premium'
}

export default async function SubjectPage({ params }: { params: Promise<Params> }) {
  const { subject: subjectSlug } = await params
  const student = await requireStudent()
  const supabase = await createClient()

  const { data: subject } = await supabase
    .from('subjects')
    .select('id, name_fr, color')
    .eq('slug', subjectSlug)
    .maybeSingle()

  if (!subject) notFound()

  const { data: filiereSubject } = await supabase
    .from('filiere_subjects')
    .select('id, coefficient')
    .eq('filiere_id', student.filiereId)
    .eq('subject_id', subject.id)
    .maybeSingle()

  if (!filiereSubject) notFound()

  const { data: unitRows } = await supabase
    .from('units')
    .select(
      `id, title_fr, sort_order,
       lesson_placements (
         sort_order,
         lessons ( id, slug, title_fr, subtitle_fr, est_minutes, difficulty, exam_frequency, access_tier )
       )`,
    )
    .eq('filiere_subject_id', filiereSubject.id)
    .order('sort_order')

  const { data: progressRows } = await supabase
    .from('lesson_progress')
    .select('lesson_id, state')
    .eq('user_id', student.userId)

  const doneIds = new Set(
    (progressRows ?? []).filter((p) => p.state === 'completed').map((p) => p.lesson_id),
  )

  const units = (unitRows ?? []) as unknown as {
    id: string
    title_fr: string
    lesson_placements: { sort_order: number; lessons: LessonRow | null }[] | null
  }[]

  const totalLessons = units.reduce(
    (n, u) => n + (u.lesson_placements?.filter((p) => p.lessons).length ?? 0),
    0,
  )
  const doneCount = units.reduce(
    (n, u) =>
      n + (u.lesson_placements?.filter((p) => p.lessons && doneIds.has(p.lessons.id)).length ?? 0),
    0,
  )

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <Link
        href="/matieres"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-foreground-muted transition hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Mes matières
      </Link>

      <header className="mb-6">
        <div className="flex items-baseline justify-between gap-3">
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            {subject.name_fr}
          </h1>
          <span className="shrink-0 font-mono text-sm font-bold text-foreground-muted">
            coef {Number(filiereSubject.coefficient)}
          </span>
        </div>

        {totalLessons > 0 && (
          <>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-sunken">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-700"
                style={{ width: `${(doneCount / totalLessons) * 100}%` }}
              />
            </div>
            <p className="mt-1.5 text-sm text-foreground-muted tabular-nums">
              {doneCount} / {totalLessons} leçons terminées
            </p>
          </>
        )}
      </header>

      {units.length === 0 ? (
        <div className="rounded-card border border-border bg-surface p-8 text-center">
          <p className="font-display font-semibold">Contenu en préparation</p>
          <p className="mt-1.5 text-sm text-foreground-muted">
            Les leçons de cette matière arrivent bientôt.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-7">
          {units.map((unit) => {
            const lessons = (unit.lesson_placements ?? [])
              .filter((p) => p.lessons)
              .sort((a, b) => a.sort_order - b.sort_order)

            if (lessons.length === 0) return null

            return (
              <section key={unit.id}>
                <h2 className="mb-2.5 font-display text-sm font-semibold tracking-wide text-foreground-muted uppercase">
                  {unit.title_fr}
                </h2>

                <ul className="flex flex-col gap-2">
                  {lessons.map(({ lessons: lesson }) => {
                    if (!lesson) return null
                    const done = doneIds.has(lesson.id)
                    const locked = lesson.access_tier === 'premium' && !student.hasPremium

                    return (
                      <li key={lesson.id}>
                        <Link
                          href={`/matieres/${subjectSlug}/${lesson.slug}`}
                          className={cn(
                            'flex items-start gap-3 rounded-card border bg-surface p-3.5 transition',
                            done
                              ? 'border-brand-200 dark:border-brand-800'
                              : 'border-border hover:border-brand-300',
                          )}
                        >
                          <span className="mt-0.5 shrink-0" aria-hidden>
                            {done ? (
                              <CheckCircle2 className="size-5 text-primary" />
                            ) : locked ? (
                              <Lock className="size-5 text-foreground-subtle" />
                            ) : (
                              <Circle className="size-5 text-border-strong" />
                            )}
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="block font-medium">{lesson.title_fr}</span>
                            {lesson.subtitle_fr && (
                              <span className="mt-0.5 block text-sm text-foreground-muted">
                                {lesson.subtitle_fr}
                              </span>
                            )}

                            <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-foreground-subtle">
                              <span>{lesson.est_minutes} min</span>
                              {lesson.exam_frequency >= 4 && (
                                <span className="inline-flex items-center gap-1 font-medium text-accent-600">
                                  <Flame className="size-3" aria-hidden />
                                  Tombe {lesson.exam_frequency} fois sur 5
                                </span>
                              )}
                              {locked && (
                                <span className="font-medium text-accent-600">Premium</span>
                              )}
                            </span>
                          </span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
