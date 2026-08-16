'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'

type Result = { ok?: true; error?: string; changed?: number }

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

export async function saveQuestion(
  questionId: string,
  formData: FormData,
): Promise<Result> {
  const { supabase, staff } = await requireStaff()
  if (!staff) return { error: 'Réservé à l’équipe.' }

  const stem = String(formData.get('stem') ?? '').trim()
  const explanation = String(formData.get('explanation') ?? '').trim()
  const difficulty = Number(formData.get('difficulty') ?? 2)
  const correct = String(formData.get('correct') ?? '')

  if (!stem) return { error: 'La question ne peut pas être vide.' }

  // The database refuses to publish a question with no explanation, and it is
  // right to: a wrong answer with no correction teaches nothing. Say so here
  // rather than letting the constraint surface as a cryptic error later.
  if (!explanation) {
    return { error: "L'explication est obligatoire : c'est elle qui fait apprendre." }
  }

  const labels: string[] = []
  for (let i = 0; i < 6; i++) {
    const label = String(formData.get(`choice_${i}`) ?? '').trim()
    if (label) labels.push(label)
  }

  if (labels.length < 2) return { error: 'Il faut au moins deux réponses possibles.' }

  const ids = ['a', 'b', 'c', 'd', 'e', 'f']
  const choices = labels.map((label, i) => ({
    id: ids[i],
    label,
    is_correct: ids[i] === correct,
  }))

  if (!choices.some((c) => c.is_correct)) {
    return { error: 'Coche la bonne réponse.' }
  }

  const { error } = await supabase
    .from('questions')
    .update({
      stem: { markdown: stem },
      choices,
      answer: { choice: correct },
      explanation: { markdown: explanation },
      difficulty,
    })
    .eq('id', questionId)

  if (error) return { error: 'Enregistrement impossible.' }

  revalidatePath('/admin/questions')
  return { ok: true }
}

export async function setQuestionStatus(
  questionIds: string[],
  publish: boolean,
): Promise<Result> {
  const { supabase, user, staff } = await requireStaff()
  if (!staff || !user) return { error: 'Réservé à l’équipe.' }
  if (questionIds.length === 0) return { error: 'Aucune question sélectionnée.' }

  if (!publish) {
    const { error } = await supabase
      .from('questions')
      .update({ status: 'draft' })
      .in('id', questionIds)

    if (error) return { error: 'Retrait impossible.' }
    revalidatePath('/admin/questions')
    return { ok: true, changed: questionIds.length }
  }

  const { data: rows } = await supabase
    .from('questions')
    .select('id, explanation')
    .in('id', questionIds)

  const publishable = (rows ?? [])
    .filter((q) => (q.explanation as { markdown?: string } | null)?.markdown?.trim())
    .map((q) => q.id)

  if (publishable.length === 0) {
    return { error: 'Aucune de ces questions n’a d’explication.' }
  }

  const { error } = await supabase
    .from('questions')
    .update({
      status: 'published',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .in('id', publishable)

  if (error) return { error: 'Publication impossible.' }

  revalidatePath('/admin/questions')
  return { ok: true, changed: publishable.length }
}

export async function deleteQuestion(questionId: string): Promise<Result> {
  const { supabase, staff } = await requireStaff()
  if (!staff) return { error: 'Réservé à l’équipe.' }

  const { error } = await supabase.from('questions').delete().eq('id', questionId)
  if (error) return { error: 'Suppression impossible.' }

  revalidatePath('/admin/questions')
  return { ok: true }
}
