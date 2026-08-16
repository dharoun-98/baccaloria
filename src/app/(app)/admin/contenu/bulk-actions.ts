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

/**
 * Publishes or withdraws a selection of lessons.
 *
 * Publishing cascades to each lesson's questions and quiz, exactly as the
 * single-lesson action does — a lesson live without its quiz is the bug this
 * mirrors.
 *
 * Lessons that cannot legitimately go live are SKIPPED rather than failing the
 * whole batch: selecting twelve and having one empty draft abort the lot would
 * be worse than reporting "10 published, 2 skipped".
 */
export async function bulkPublish(
  lessonIds: string[],
  publish: boolean,
): Promise<BulkResult & { skipped?: number }> {
  const { supabase, staff } = await requireStaff()
  if (!staff) return { error: 'Réservé à l’équipe.' }
  if (lessonIds.length === 0) return { error: 'Aucune leçon sélectionnée.' }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expirée.' }

  const now = new Date().toISOString()
  let changed = 0
  let skipped = 0

  if (!publish) {
    const { error } = await supabase
      .from('lessons')
      .update({ status: 'draft' })
      .in('id', lessonIds)

    if (error) return { error: 'Retrait impossible.' }

    await supabase
      .from('assessments')
      .update({ status: 'draft' })
      .in('lesson_id', lessonIds)
      .eq('kind', 'lesson_quiz')

    revalidatePath('/admin/contenu')
    revalidatePath('/matieres', 'layout')
    return { ok: true, changed: lessonIds.length }
  }

  // Same guard as the single-lesson path: no content, or a block left empty,
  // means the lesson is not ready to be read by a student.
  const { data: blocks } = await supabase
    .from('lesson_blocks')
    .select('lesson_id, content')
    .in('lesson_id', lessonIds)

  const byLesson = new Map<string, { total: number; empty: number }>()
  for (const b of blocks ?? []) {
    const entry = byLesson.get(b.lesson_id) ?? { total: 0, empty: 0 }
    entry.total++
    if (!(b.content as { markdown?: string } | null)?.markdown?.trim()) entry.empty++
    byLesson.set(b.lesson_id, entry)
  }

  const ready = lessonIds.filter((id) => {
    const entry = byLesson.get(id)
    return entry && entry.total > 0 && entry.empty === 0
  })
  skipped = lessonIds.length - ready.length

  if (ready.length > 0) {
    const { error } = await supabase
      .from('lessons')
      .update({
        status: 'published',
        reviewed_by: user.id,
        reviewed_at: now,
        published_at: now,
      })
      .in('id', ready)

    if (error) return { error: 'Publication impossible.' }

    await supabase
      .from('questions')
      .update({ status: 'published', reviewed_by: user.id, reviewed_at: now })
      .in('lesson_id', ready)
      .not('explanation', 'is', null)

    await supabase
      .from('assessments')
      .update({ status: 'published' })
      .in('lesson_id', ready)
      .eq('kind', 'lesson_quiz')

    changed = ready.length
  }

  revalidatePath('/admin/contenu')
  revalidatePath('/matieres', 'layout')
  return { ok: true, changed, skipped }
}

/** Switches a selection between the free tier and premium. */
export async function bulkAccessTier(
  lessonIds: string[],
  tier: 'free' | 'premium',
): Promise<BulkResult> {
  const { supabase, staff } = await requireStaff()
  if (!staff) return { error: 'Réservé à l’équipe.' }
  if (lessonIds.length === 0) return { error: 'Aucune leçon sélectionnée.' }

  const { error } = await supabase
    .from('lessons')
    .update({ access_tier: tier })
    .in('id', lessonIds)

  if (error) return { error: 'Modification impossible.' }

  // The lesson's quiz follows its lesson: a free lesson whose quiz is locked
  // is a worse experience than either option chosen deliberately.
  await supabase
    .from('assessments')
    .update({ access_tier: tier })
    .in('lesson_id', lessonIds)
    .eq('kind', 'lesson_quiz')

  revalidatePath('/admin/contenu')
  revalidatePath('/matieres', 'layout')
  return { ok: true, changed: lessonIds.length }
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
