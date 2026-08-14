import { ArrowLeft, FileText, Sparkles } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { requireStudent } from '@/lib/student'
import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Contenu', robots: { index: false } }

const STATUS_LABEL: Record<string, string> = {
  draft: 'Brouillon',
  in_review: 'À relire',
  changes_requested: 'À corriger',
  published: 'Publiée',
  archived: 'Archivée',
}

const STATUS_STYLE: Record<string, string> = {
  draft: 'bg-surface-sunken text-foreground-muted',
  in_review: 'bg-accent-100 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300',
  changes_requested: 'bg-danger/12 text-danger',
  published: 'bg-success/12 text-success',
  archived: 'bg-surface-sunken text-foreground-subtle',
}

export default async function ContentPage() {
  const staff = await requireStudent()
  if (!staff.isStaff) redirect('/accueil')

  const supabase = await createClient()

  const { data: lessons } = await supabase
    .from('lessons')
    .select(
      'id, title_fr, subtitle_fr, status, ai_generated, reviewed_by, exam_frequency, access_tier, subject_id, updated_at',
    )
    .order('status')
    .order('updated_at', { ascending: false })

  const subjectIds = [...new Set((lessons ?? []).map((l) => l.subject_id))]
  const { data: subjects } = subjectIds.length
    ? await supabase.from('subjects').select('id, name_fr, color').in('id', subjectIds)
    : { data: [] }

  const subjectMap = new Map((subjects ?? []).map((s) => [s.id, s]))

  const rows = lessons ?? []
  const awaitingReview = rows.filter(
    (l) => l.status !== 'published' || (l.ai_generated && !l.reviewed_by),
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
          Contenu
        </h1>
        <p className="mt-1.5 text-sm text-foreground-muted">
          {rows.length} leçon(s) · {awaitingReview.length} en attente de relecture
        </p>
      </header>

      {rows.length === 0 ? (
        <div className="rounded-card border border-border bg-surface p-8 text-center">
          <FileText className="mx-auto size-8 text-foreground-subtle" aria-hidden />
          <p className="mt-3 font-display font-semibold">Aucune leçon</p>
          <p className="mt-1.5 text-sm text-foreground-muted">
            Les brouillons générés apparaîtront ici pour relecture.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {rows.map((lesson) => {
            const subject = subjectMap.get(lesson.subject_id)
            return (
              <li key={lesson.id}>
                <Link
                  href={`/admin/contenu/${lesson.id}`}
                  className="flex items-start gap-3 rounded-card border border-border bg-surface p-4 shadow-card transition hover:border-brand-300"
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-display font-semibold">
                        {lesson.title_fr}
                      </span>
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-medium',
                          STATUS_STYLE[lesson.status] ?? STATUS_STYLE.draft,
                        )}
                      >
                        {STATUS_LABEL[lesson.status] ?? lesson.status}
                      </span>
                      {lesson.ai_generated && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-info/12 px-2 py-0.5 text-xs font-medium text-info">
                          <Sparkles className="size-3" aria-hidden />
                          brouillon IA
                        </span>
                      )}
                    </span>

                    {subject && (
                      <span
                        className="mt-1 block text-xs font-medium"
                        style={{ color: subject.color }}
                      >
                        {subject.name_fr}
                      </span>
                    )}

                    {lesson.subtitle_fr && (
                      <span className="mt-1 block text-sm text-foreground-muted">
                        {lesson.subtitle_fr}
                      </span>
                    )}
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
