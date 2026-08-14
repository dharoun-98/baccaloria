'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'

/**
 * Marks a lesson finished (or un-finishes it).
 *
 * Writes go through the student's own session, so the RLS policy
 * "manage own lesson progress" is what actually prevents one student from
 * writing progress rows for another.
 */
export async function setLessonDone(lessonId: string, done: boolean) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Non connecté.' }

  const now = new Date().toISOString()

  const { error } = await supabase.from('lesson_progress').upsert(
    {
      user_id: user.id,
      lesson_id: lessonId,
      state: done ? 'completed' : 'in_progress',
      scroll_pct: done ? 100 : 0,
      completed_at: done ? now : null,
      last_seen_at: now,
    },
    { onConflict: 'user_id,lesson_id' },
  )

  if (error) return { error: "Impossible d'enregistrer ta progression." }

  // Coverage feeds the readiness score, so recompute it now rather than
  // waiting for a nightly job — the student expects the dial to move.
  await supabase.rpc('recompute_readiness', { target_user: user.id })

  revalidatePath('/matieres', 'layout')
  revalidatePath('/accueil')

  return { ok: true }
}

/** Records that a lesson was opened, without claiming it is finished. */
export async function touchLesson(lessonId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return

  const now = new Date().toISOString()

  // Never downgrade a completed lesson back to in_progress just because it was
  // reopened for revision.
  const { data: existing } = await supabase
    .from('lesson_progress')
    .select('state')
    .eq('user_id', user.id)
    .eq('lesson_id', lessonId)
    .maybeSingle()

  await supabase.from('lesson_progress').upsert(
    {
      user_id: user.id,
      lesson_id: lessonId,
      state: existing?.state === 'completed' ? 'completed' : 'in_progress',
      last_seen_at: now,
    },
    { onConflict: 'user_id,lesson_id' },
  )
}
