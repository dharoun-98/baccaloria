import { AlertTriangle, ArrowLeft, ExternalLink, Sparkles } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { BlockEditor } from './block-editor'
import { PublishControls } from './publish-controls'

import type { Block } from '@/components/lesson/lesson-block'
import { requireStudent } from '@/lib/student'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Éditer une leçon', robots: { index: false } }

export default async function EditLessonPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const staff = await requireStudent()
  if (!staff.isStaff) redirect('/accueil')

  const supabase = await createClient()

  const { data: lesson } = await supabase
    .from('lessons')
    .select(
      'id, slug, title_fr, subtitle_fr, status, ai_generated, reviewed_by, review_notes, exam_frequency, difficulty, est_minutes, access_tier, subject_id',
    )
    .eq('id', id)
    .maybeSingle()

  if (!lesson) notFound()

  const [{ data: blockRows }, { data: subject }] = await Promise.all([
    supabase
      .from('lesson_blocks')
      .select('id, kind, title_fr, content, position')
      .eq('lesson_id', id)
      .order('position'),
    supabase.from('subjects').select('slug, name_fr').eq('id', lesson.subject_id).maybeSingle(),
  ])

  const blocks = (blockRows ?? []) as unknown as Block[]
  const needsReview = lesson.ai_generated

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
      <Link
        href="/admin/contenu"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-foreground-muted hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Contenu
      </Link>

      <header className="mb-5">
        <h1 className="font-display text-2xl font-bold tracking-tight text-balance">
          {lesson.title_fr}
        </h1>
        <p className="mt-1 text-sm text-foreground-muted">
          {subject?.name_fr} · {blocks.length} bloc(s) ·{' '}
          {lesson.status === 'published' ? 'publiée' : 'non publiée'}
        </p>

        {lesson.status === 'published' && subject && (
          <Link
            href={`/matieres/${subject.slug}/${lesson.slug}`}
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <ExternalLink className="size-3.5" aria-hidden />
            Voir comme un élève
          </Link>
        )}
      </header>

      {needsReview && (
        <div className="mb-5 rounded-card border-2 border-accent-300 bg-accent-50 p-4 dark:border-accent-800 dark:bg-accent-900/25">
          <h2 className="flex items-center gap-2 font-display text-sm font-semibold">
            <Sparkles className="size-4 text-accent-600" aria-hidden />
            Brouillon généré automatiquement
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-foreground-muted">
            Relis chaque bloc avant publication : formules, notations et cohérence avec
            le programme officiel. Publier appose ton nom comme relecteur.
          </p>
          {lesson.review_notes && (
            <p className="mt-2 border-t border-accent-200 pt-2 text-xs text-foreground-muted dark:border-accent-800">
              {lesson.review_notes}
            </p>
          )}
        </div>
      )}

      <div className="mb-6">
        <PublishControls
          lessonId={lesson.id}
          status={lesson.status}
          blockCount={blocks.length}
        />
      </div>

      {blocks.length === 0 ? (
        <div className="rounded-card border-2 border-dashed border-border p-8 text-center">
          <AlertTriangle className="mx-auto size-7 text-foreground-subtle" aria-hidden />
          <p className="mt-3 font-display font-semibold">Aucun bloc</p>
          <p className="mt-1.5 text-sm text-foreground-muted">
            Ajoute un bloc pour commencer à rédiger.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {blocks.map((block) => (
            <BlockEditor key={block.id} block={block} lessonId={lesson.id} />
          ))}
        </div>
      )}
    </div>
  )
}
