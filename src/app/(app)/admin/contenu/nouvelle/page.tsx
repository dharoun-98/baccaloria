import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { NewLessonForm, type Catalogue } from './new-lesson-form'

import { requireStudent } from '@/lib/student'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Nouvelle leçon', robots: { index: false } }

type Row = {
  id: string
  filiere_id: string
  subject_id: string
  sort_order: number
  filieres: { code: string; name_fr: string } | null
  subjects: { name_fr: string } | null
  units: { id: string; title_fr: string; sort_order: number }[] | null
}

export default async function NewLessonPage() {
  const staff = await requireStudent()
  if (!staff.isStaff) redirect('/accueil')

  const supabase = await createClient()

  const { data } = await supabase
    .from('filiere_subjects')
    .select(
      `id, filiere_id, subject_id, sort_order,
       filieres ( code, name_fr ),
       subjects ( name_fr ),
       units ( id, title_fr, sort_order )`,
    )
    .eq('is_active', true)
    .order('sort_order')

  const rows = (data ?? []) as unknown as Row[]

  // Group by filière so the form can cascade filière → matière → chapitre.
  const byFiliere = new Map<string, Catalogue['filieres'][number]>()

  for (const row of rows) {
    if (!row.filieres || !row.subjects) continue

    if (!byFiliere.has(row.filiere_id)) {
      byFiliere.set(row.filiere_id, {
        id: row.filiere_id,
        code: row.filieres.code,
        name: row.filieres.name_fr,
        subjects: [],
      })
    }

    byFiliere.get(row.filiere_id)!.subjects.push({
      filiereSubjectId: row.id,
      subjectId: row.subject_id,
      name: row.subjects.name_fr,
      units: (row.units ?? [])
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((u) => ({ id: u.id, title: u.title_fr })),
    })
  }

  const catalogue: Catalogue = { filieres: [...byFiliere.values()] }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
      <Link
        href="/admin/contenu"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-foreground-muted hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Contenu
      </Link>

      <h1 className="mb-6 font-display text-2xl font-bold tracking-tight sm:text-3xl">
        Nouvelle leçon
      </h1>

      {catalogue.filieres.length === 0 ? (
        <p className="rounded-card border border-border bg-surface p-6 text-sm text-foreground-muted">
          Aucune filière active. Active une filière avant de créer du contenu.
        </p>
      ) : (
        <NewLessonForm catalogue={catalogue} />
      )}
    </div>
  )
}
