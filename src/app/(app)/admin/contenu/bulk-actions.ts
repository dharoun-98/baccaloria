'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'

type BulkResult = { ok?: true; changed?: number; error?: string }

async function requireStaff() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { supabase, staff: false }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return {
    supabase,
    staff: ['admin', 'editor', 'teacher'].includes(profile?.role ?? ''),
  }
}

/**
 * Places several lessons into one unit at once.
 *
 * The main use is Philosophie and Anglais, which are identical across PC, SE
 * and SGC: every one of those lessons goes to all three filières, and doing it
 * one at a time is the sort of chore that gets skipped.
 *
 * Existing placements are skipped rather than treated as errors — re-running a
 * batch after adding a lesson must not fail on the ones already done.
 */
export async function bulkAddPlacement(
  lessonIds: string[],
  unitId: string,
): Promise<BulkResult> {
  const { supabase, staff } = await requireStaff()
  if (!staff) return { error: 'Réservé à l’équipe.' }
  if (lessonIds.length === 0) return { error: 'Aucune leçon sélectionnée.' }
  if (!unitId) return { error: 'Choisis un chapitre.' }

  // Guard against nonsense: the unit belongs to one subject, and a lesson can
  // only sit in a unit of its own subject.
  const { data: unit } = await supabase
    .from('units')
    .select('id, filiere_subjects!inner ( subject_id )')
    .eq('id', unitId)
    .maybeSingle()

  const unitSubject = (
    unit?.filiere_subjects as { subject_id: string } | null | undefined
  )?.subject_id

  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, subject_id')
    .in('id', lessonIds)

  const wrongSubject = (lessons ?? []).filter((l) => l.subject_id !== unitSubject)
  if (wrongSubject.length > 0) {
    return {
      error: `${wrongSubject.length} leçon(s) n'appartiennent pas à la matière de ce chapitre.`,
    }
  }

  const { data: already } = await supabase
    .from('lesson_placements')
    .select('lesson_id')
    .eq('unit_id', unitId)
    .in('lesson_id', lessonIds)

  const existing = new Set((already ?? []).map((p) => p.lesson_id))
  const toInsert = lessonIds.filter((id) => !existing.has(id))

  if (toInsert.length === 0) {
    return { ok: true, changed: 0 }
  }

  const { error } = await supabase
    .from('lesson_placements')
    .insert(toInsert.map((id) => ({ lesson_id: id, unit_id: unitId, sort_order: 99 })))

  if (error) return { error: 'Placement impossible.' }

  revalidatePath('/admin/contenu')
  revalidatePath('/matieres', 'layout')
  return { ok: true, changed: toInsert.length }
}

/** Adds or removes one tag across a selection. */
export async function bulkTag(
  lessonIds: string[],
  tag: string,
  mode: 'add' | 'remove',
): Promise<BulkResult> {
  const { supabase, staff } = await requireStaff()
  if (!staff) return { error: 'Réservé à l’équipe.' }
  if (lessonIds.length === 0) return { error: 'Aucune leçon sélectionnée.' }
  if (!tag) return { error: 'Choisis un tag.' }

  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, tags')
    .in('id', lessonIds)

  let changed = 0

  // Read-modify-write per row rather than a clever array operator: the number
  // of lessons touched in one batch is small, and this keeps the intent
  // obvious to whoever reads it next.
  for (const lesson of lessons ?? []) {
    const current: string[] = lesson.tags ?? []
    const has = current.includes(tag)

    if (mode === 'add' && has) continue
    if (mode === 'remove' && !has) continue

    const next = mode === 'add' ? [...current, tag] : current.filter((t) => t !== tag)

    const { error } = await supabase
      .from('lessons')
      .update({ tags: next })
      .eq('id', lesson.id)

    if (!error) changed++
  }

  revalidatePath('/admin/contenu')
  return { ok: true, changed }
}
