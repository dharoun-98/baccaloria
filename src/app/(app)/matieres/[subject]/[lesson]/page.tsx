import { ArrowLeft, Brain, Clock, Flame, Lock, Target } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { DoneButton } from './done-button'

import { LessonBlock, type Block } from '@/components/lesson/lesson-block'
import { Mindmap, type MindmapData } from '@/components/lesson/mindmap'
import { buttonVariants } from '@/components/ui/button'
import { DIFFICULTY_LABEL, requireStudent } from '@/lib/student'
import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'

type Params = { subject: string; lesson: string }

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { lesson } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('lessons')
    .select('title_fr')
    .eq('slug', lesson)
    .maybeSingle()

  return { title: data?.title_fr ?? 'Leçon' }
}

export default async function LessonPage({ params }: { params: Promise<Params> }) {
  const { subject: subjectSlug, lesson: lessonSlug } = await params
  const student = await requireStudent()
  const supabase = await createClient()

  const { data: subject } = await supabase
    .from('subjects')
    .select('id, name_fr')
    .eq('slug', subjectSlug)
    .maybeSingle()

  if (!subject) notFound()

  const { data: lesson } = await supabase
    .from('lessons')
    .select(
      'id, title_fr, subtitle_fr, est_minutes, difficulty, exam_frequency, access_tier, objectives',
    )
    .eq('slug', lessonSlug)
    .eq('subject_id', subject.id)
    .eq('status', 'published')
    .maybeSingle()

  if (!lesson) notFound()

  const locked = lesson.access_tier === 'premium' && !student.hasPremium

  // The blocks query is subject to the "lesson body gated by tier" policy, so
  // a locked lesson returns nothing here even if this check were removed. The
  // paywall is enforced by the database, not by this component.
  const [{ data: blockRows }, { data: mindmapRows }, { data: progress }] =
    await Promise.all([
      supabase
        .from('lesson_blocks')
        .select('id, kind, title_fr, content, position')
        .eq('lesson_id', lesson.id)
        .order('position'),
      supabase
        .from('mindmaps')
        .select('id, title_fr, data')
        .eq('lesson_id', lesson.id)
        .eq('status', 'published'),
      supabase
        .from('lesson_progress')
        .select('state')
        .eq('user_id', student.userId)
        .eq('lesson_id', lesson.id)
        .maybeSingle(),
    ])

  const blocks = (blockRows ?? []) as unknown as Block[]
  const mindmaps = (mindmapRows ?? []) as unknown as {
    id: string
    title_fr: string
    data: MindmapData
  }[]

  const objectives = Array.isArray(lesson.objectives)
    ? (lesson.objectives as string[])
    : []

  return (
    <article className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
      <Link
        href={`/matieres/${subjectSlug}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-foreground-muted transition hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {subject.name_fr}
      </Link>

      <header className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight text-balance sm:text-3xl">
          {lesson.title_fr}
        </h1>
        {lesson.subtitle_fr && (
          <p className="mt-1.5 leading-relaxed text-foreground-muted">
            {lesson.subtitle_fr}
          </p>
        )}

        <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-foreground-subtle">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-3.5" aria-hidden />
            {lesson.est_minutes} min
          </span>
          <span>{DIFFICULTY_LABEL[lesson.difficulty] ?? 'Intermédiaire'}</span>
          {lesson.exam_frequency >= 4 && (
            <span className="inline-flex items-center gap-1.5 font-medium text-accent-600">
              <Flame className="size-3.5" aria-hidden />
              Tombe {lesson.exam_frequency} fois sur 5 aux examens
            </span>
          )}
        </div>
      </header>

      {objectives.length > 0 && !locked && (
        <section className="mb-6 rounded-card border border-border bg-surface-sunken p-4 sm:p-5">
          <h2 className="mb-2.5 flex items-center gap-2 font-display text-sm font-semibold tracking-wide text-foreground-muted uppercase">
            <Target className="size-4" aria-hidden />
            À la fin de cette leçon, tu sauras
          </h2>
          <ul className="flex flex-col gap-1.5">
            {objectives.map((objective) => (
              <li key={objective} className="flex gap-2 text-sm">
                <span
                  aria-hidden
                  className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary"
                />
                <span>{objective}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {locked ? (
        <Paywall />
      ) : (
        <>
          {blocks.map((block) => (
            <LessonBlock key={block.id} block={block} />
          ))}

          {mindmaps.map((mindmap) => (
            <section key={mindmap.id} className="mb-6">
              <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold tracking-wide text-foreground-muted uppercase">
                <Brain className="size-4" aria-hidden />
                {mindmap.title_fr}
              </h2>
              <Mindmap data={mindmap.data} />
            </section>
          ))}

          {blocks.length === 0 && (
            <p className="rounded-card border border-border bg-surface p-6 text-center text-sm text-foreground-muted">
              Le contenu de cette leçon est en cours de rédaction.
            </p>
          )}

          <div className="mt-8 border-t border-border pt-6">
            <DoneButton
              lessonId={lesson.id}
              initialDone={progress?.state === 'completed'}
            />
          </div>
        </>
      )}
    </article>
  )
}

function Paywall() {
  return (
    <div className="rounded-card border-2 border-accent-300 bg-accent-50 p-6 text-center dark:border-accent-800 dark:bg-accent-900/25">
      <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-accent-100 text-accent-700 dark:bg-accent-900/50 dark:text-accent-300">
        <Lock className="size-6" aria-hidden />
      </span>
      <h2 className="mt-4 font-display text-lg font-bold">Leçon Premium</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-foreground-muted">
        Débloque tout le programme de ta filière, les tests de palier et les
        examens nationaux corrigés.
      </p>
      <Link
        href="/profil/abonnement"
        className={cn(buttonVariants({ size: 'lg', variant: 'accent' }), 'mt-5')}
      >
        Voir les formules
      </Link>
    </div>
  )
}
