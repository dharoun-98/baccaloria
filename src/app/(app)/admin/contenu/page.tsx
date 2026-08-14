import { ArrowLeft, FileText, Plus } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { FilterBar, type FilterOptions } from './filter-bar'
import { LessonList, type UnitOption } from './lesson-list'

import { buttonVariants } from '@/components/ui/button'
import { requireStudent } from '@/lib/student'
import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Contenu', robots: { index: false } }

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

  const [
    { data: lessonRows },
    { data: subjects },
    { data: filieres },
    { data: tagRows },
    { data: unitRows },
  ] = await Promise.all([
    query,
    supabase.from('subjects').select('id, name_fr').order('name_fr'),
    supabase
      .from('filieres')
      .select('code, name_fr')
      .eq('is_active', true)
      .order('sort_order'),
    supabase
      .from('tag_catalogue')
      .select('slug, label_fr, category, description_fr')
      .eq('is_active', true)
      .order('category')
      .order('sort_order'),
    supabase
      .from('units')
      .select(
        `id, title_fr,
         filiere_subjects!inner ( subject_id, filieres ( code ), subjects ( name_fr ) )`,
      ),
  ])

  const lessons = (lessonRows ?? []) as unknown as Overview[]

  const catalogueTags = (tagRows ?? []).map((t) => ({
    slug: t.slug,
    label: t.label_fr,
    category: t.category,
    description: t.description_fr,
  }))

  const units: UnitOption[] = ((unitRows ?? []) as unknown as {
    id: string
    title_fr: string
    filiere_subjects: {
      subject_id: string
      filieres: { code: string } | null
      subjects: { name_fr: string } | null
    } | null
  }[]).map((u) => ({
    id: u.id,
    subjectId: u.filiere_subjects?.subject_id ?? '',
    label: `${u.filiere_subjects?.filieres?.code ?? '?'} · ${u.filiere_subjects?.subjects?.name_fr ?? ''} — ${u.title_fr}`,
  }))

  const options: FilterOptions = {
    subjects: (subjects ?? []).map((s) => ({ id: s.id, name: s.name_fr })),
    filieres: (filieres ?? []).map((f) => ({ code: f.code, name: f.name_fr })),
    tags: catalogueTags.map((t) => t.slug),
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
        <LessonList
          lessons={lessons.map((l) => ({
            id: l.id,
            title: l.title_fr,
            subtitle: l.subtitle_fr,
            status: l.status,
            aiGenerated: l.ai_generated,
            accessTier: l.access_tier,
            tags: l.tags ?? [],
            subjectId: l.subject_id,
            subjectName: l.subject_name,
            subjectColor: l.subject_color,
            filiereCodes: l.filiere_codes ?? [],
            blockCount: Number(l.block_count),
          }))}
          units={units}
          tags={catalogueTags}
        />
      )}
    </div>
  )
}
