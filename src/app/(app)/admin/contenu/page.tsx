import { ArrowLeft, FileText, Plus, Sparkles } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { FilterBar, type FilterOptions } from './filter-bar'

import { buttonVariants } from '@/components/ui/button'
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

type Overview = {
  id: string
  slug: string
  title_fr: string
  subtitle_fr: string | null
  status: string
  ai_generated: boolean
  access_tier: string
  tags: string[]
  subject_id: string
  subject_name: string
  subject_color: string
  filiere_codes: string[]
  block_count: number
}

export default async function ContentPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string
    matiere?: string
    filiere?: string
    statut?: string
    tag?: string
  }>
}) {
  const staff = await requireStudent()
  if (!staff.isStaff) redirect('/accueil')

  const { q, matiere, filiere, statut, tag } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('lesson_admin_overview')
    .select('*')
    .order('subject_name')
    .order('title_fr')

  if (matiere) query = query.eq('subject_id', matiere)
  if (statut) query = query.eq('status', statut)
  if (filiere) query = query.contains('filiere_codes', [filiere])
  if (tag) query = query.contains('tags', [tag])
  if (q) query = query.ilike('title_fr', `%${q}%`)

  const [{ data: lessonRows }, { data: subjects }, { data: filieres }, { data: allTags }] =
    await Promise.all([
      query,
      supabase.from('subjects').select('id, name_fr').order('name_fr'),
      supabase
        .from('filieres')
        .select('code, name_fr')
        .eq('is_active', true)
        .order('sort_order'),
      supabase.from('lessons').select('tags'),
    ])

  const lessons = (lessonRows ?? []) as unknown as Overview[]

  const options: FilterOptions = {
    subjects: (subjects ?? []).map((s) => ({ id: s.id, name: s.name_fr })),
    filieres: (filieres ?? []).map((f) => ({ code: f.code, name: f.name_fr })),
    tags: [
      ...new Set(
        ((allTags ?? []) as { tags: string[] | null }[]).flatMap((l) => l.tags ?? []),
      ),
    ].sort(),
  }

  const filtered = Boolean(q || matiere || filiere || statut || tag)

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <Link
        href="/admin"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-foreground-muted hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Administration
      </Link>

      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Contenu
          </h1>
          <p className="mt-1 text-sm text-foreground-muted">
            {lessons.length} leçon(s){filtered && ' correspondant aux filtres'}
          </p>
        </div>

        <Link
          href="/admin/contenu/nouvelle"
          className={cn(buttonVariants({ size: 'md' }), 'shrink-0')}
        >
          <Plus className="size-4" aria-hidden />
          Nouvelle leçon
        </Link>
      </header>

      <div className="mb-5">
        <FilterBar options={options} />
      </div>

      {lessons.length === 0 ? (
        <div className="rounded-card border border-border bg-surface p-8 text-center">
          <FileText className="mx-auto size-8 text-foreground-subtle" aria-hidden />
          <p className="mt-3 font-display font-semibold">
            {filtered ? 'Aucun résultat' : 'Aucune leçon'}
          </p>
          <p className="mt-1.5 text-sm text-foreground-muted">
            {filtered
              ? 'Essaie d’élargir les filtres.'
              : 'Crée ta première leçon pour commencer.'}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {lessons.map((lesson) => (
            <li key={lesson.id}>
              <Link
                href={`/admin/contenu/${lesson.id}`}
                className="block rounded-card border border-border bg-surface p-4 shadow-card transition hover:border-brand-300"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-display font-semibold">{lesson.title_fr}</span>
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
                      IA
                    </span>
                  )}
                  {lesson.access_tier === 'free' && (
                    <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                      gratuite
                    </span>
                  )}
                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                  <span className="font-medium" style={{ color: lesson.subject_color }}>
                    {lesson.subject_name}
                  </span>

                  {lesson.filiere_codes.length > 0 ? (
                    <span className="font-mono text-foreground-muted">
                      {lesson.filiere_codes.join(' · ')}
                    </span>
                  ) : (
                    <span className="font-medium text-accent-600">
                      non placée — invisible pour les élèves
                    </span>
                  )}

                  <span className="text-foreground-subtle">
                    {lesson.block_count} bloc(s)
                  </span>
                </div>

                {lesson.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {lesson.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded bg-surface-sunken px-1.5 py-0.5 text-[11px] text-foreground-muted"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
