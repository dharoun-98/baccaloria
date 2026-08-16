'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'

type Result = { ok?: true; error?: string }

/** Every action re-checks staff rather than trusting the page that called it. */
async function requireStaff() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { supabase, user: null, staff: false }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return {
    supabase,
    user,
    staff: ['admin', 'editor', 'teacher'].includes(profile?.role ?? ''),
  }
}

export async function saveBlock(
  blockId: string,
  markdown: string,
  titleFr: string | null,
): Promise<Result> {
  const { supabase, staff } = await requireStaff()
  if (!staff) return { error: 'Réservé à l’équipe.' }

  const { data: block } = await supabase
    .from('lesson_blocks')
    .select('lesson_id')
    .eq('id', blockId)
    .maybeSingle()

  const { error } = await supabase
    .from('lesson_blocks')
    .update({
      content: { markdown },
      title_fr: titleFr?.trim() ? titleFr.trim() : null,
    })
    .eq('id', blockId)

  if (error) return { error: 'Enregistrement impossible.' }

  revalidatePath('/admin/contenu')
  if (block?.lesson_id) revalidatePath(`/admin/contenu/${block.lesson_id}`)
  return { ok: true }
}

export async function deleteBlock(blockId: string, lessonId: string): Promise<Result> {
  const { supabase, staff } = await requireStaff()
  if (!staff) return { error: 'Réservé à l’équipe.' }

  const { error } = await supabase.from('lesson_blocks').delete().eq('id', blockId)
  if (error) return { error: 'Suppression impossible.' }

  revalidatePath(`/admin/contenu/${lessonId}`)
  return { ok: true }
}

export async function addBlock(
  lessonId: string,
  kind: string,
  position: number,
): Promise<Result> {
  const { supabase, staff } = await requireStaff()
  if (!staff) return { error: 'Réservé à l’équipe.' }

  const { error } = await supabase.from('lesson_blocks').insert({
    lesson_id: lessonId,
    kind,
    content: { markdown: '' },
    position,
  })

  if (error) return { error: 'Ajout impossible.' }

  revalidatePath(`/admin/contenu/${lessonId}`)
  return { ok: true }
}

/**
 * Publishing stamps the reviewer. The database refuses a published lesson with
 * a null reviewed_by, so this is the only way content legitimately reaches
 * students — and it always carries a name.
 */
export async function publishLesson(lessonId: string): Promise<Result> {
  const { supabase, user, staff } = await requireStaff()
  if (!staff || !user) return { error: 'Réservé à l’équipe.' }

  const { data: blocks } = await supabase
    .from('lesson_blocks')
    .select('id, content')
    .eq('lesson_id', lessonId)

  const empty = (blocks ?? []).filter(
    (b) => !(b.content as { markdown?: string } | null)?.markdown?.trim(),
  )

  if ((blocks ?? []).length === 0) {
    return { error: 'Cette leçon n’a aucun contenu.' }
  }
  if (empty.length > 0) {
    return {
      error: `${empty.length} bloc(s) sont vides. Complète-les ou supprime-les avant de publier.`,
    }
  }

  const now = new Date().toISOString()

  const { error } = await supabase
    .from('lessons')
    .update({
      status: 'published',
      reviewed_by: user.id,
      reviewed_at: now,
      published_at: now,
    })
    .eq('id', lessonId)

  if (error) return { error: 'Publication impossible.' }

  // Publishing the lesson must publish its quiz too. Otherwise the lesson goes
  // live with no "Teste-toi" button and nobody notices, because a missing
  // button looks like a design choice rather than a fault. Reviewing a lesson
  // means reviewing its questions, so the same reviewer is stamped on both —
  // which is also what the database's publish constraint requires.
  await supabase
    .from('questions')
    .update({ status: 'published', reviewed_by: user.id, reviewed_at: now })
    .eq('lesson_id', lessonId)
    .not('explanation', 'is', null)

  await supabase
    .from('assessments')
    .update({ status: 'published' })
    .eq('lesson_id', lessonId)
    .eq('kind', 'lesson_quiz')

  revalidatePath('/admin/contenu')
  revalidatePath(`/admin/contenu/${lessonId}`)
  revalidatePath('/matieres', 'layout')
  return { ok: true }
}

export async function unpublishLesson(lessonId: string): Promise<Result> {
  const { supabase, staff } = await requireStaff()
  if (!staff) return { error: 'Réservé à l’équipe.' }

  const { error } = await supabase
    .from('lessons')
    .update({ status: 'draft' })
    .eq('id', lessonId)

  if (error) return { error: 'Retrait impossible.' }

  // Withdraw the quiz with it: a quiz still live on a hidden lesson is
  // reachable by anyone holding the URL.
  await supabase
    .from('assessments')
    .update({ status: 'draft' })
    .eq('lesson_id', lessonId)
    .eq('kind', 'lesson_quiz')

  revalidatePath('/admin/contenu')
  revalidatePath(`/admin/contenu/${lessonId}`)
  revalidatePath('/matieres', 'layout')
  return { ok: true }
}
