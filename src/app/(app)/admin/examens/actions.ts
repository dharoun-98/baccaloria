'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'

type Result = { ok?: true; error?: string }

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

export async function addExercise(examId: string, formData: FormData): Promise<Result> {
  const { supabase, staff } = await requireStaff()
  if (!staff) return { error: 'Réservé à l’équipe.' }

  const label = String(formData.get('label') ?? '').trim()
  const points = Number(formData.get('points') ?? 0)
  const position = Number(formData.get('position') ?? 1)

  if (!label) return { error: 'Donne un intitulé à l’exercice.' }
  if (!(points > 0)) return { error: 'Le barème doit être supérieur à zéro.' }

  const { error } = await supabase.from('exam_exercises').insert({
    exam_id: examId,
    position,
    label_fr: label,
    points,
  })

  if (error) {
    return {
      error:
        error.code === '23505'
          ? 'Un exercice occupe déjà cette position.'
          : 'Ajout impossible.',
    }
  }

  revalidatePath(`/admin/examens/${examId}`)
  return { ok: true }
}

export async function saveExercise(
  exerciseId: string,
  examId: string,
  formData: FormData,
): Promise<Result> {
  const { supabase, staff } = await requireStaff()
  if (!staff) return { error: 'Réservé à l’équipe.' }

  const markdown = String(formData.get('corrige') ?? '')

  const { error } = await supabase
    .from('exam_exercises')
    .update({
      label_fr: String(formData.get('label') ?? '').trim(),
      points: Number(formData.get('points') ?? 0),
      corrige: markdown.trim() ? { markdown } : null,
    })
    .eq('id', exerciseId)

  if (error) return { error: 'Enregistrement impossible.' }

  revalidatePath(`/admin/examens/${examId}`)
  return { ok: true }
}

export async function deleteExercise(
  exerciseId: string,
  examId: string,
): Promise<Result> {
  const { supabase, staff } = await requireStaff()
  if (!staff) return { error: 'Réservé à l’équipe.' }

  const { error } = await supabase.from('exam_exercises').delete().eq('id', exerciseId)
  if (error) return { error: 'Suppression impossible.' }

  revalidatePath(`/admin/examens/${examId}`)
  return { ok: true }
}

/**
 * Publishing an exam requires a complete corrigé.
 *
 * A timed paper with no correction is worse than no paper: the student spends
 * three hours, cannot score themselves, and the attempt contributes nothing to
 * their readiness. The barème must also total the paper's mark, or the
 * self-scoring arithmetic is wrong from the start.
 */
export async function publishExam(examId: string): Promise<Result> {
  const { supabase, staff } = await requireStaff()
  if (!staff) return { error: 'Réservé à l’équipe.' }

  const [{ data: exam }, { data: exercises }] = await Promise.all([
    supabase.from('exams').select('total_points, subject_pdf_path').eq('id', examId).single(),
    supabase.from('exam_exercises').select('label_fr, points, corrige').eq('exam_id', examId),
  ])

  if (!exam?.subject_pdf_path) {
    return { error: 'Le sujet PDF n’a pas encore été importé.' }
  }
  if (!exercises || exercises.length === 0) {
    return { error: 'Découpe d’abord le sujet en exercices.' }
  }

  const missing = exercises.filter(
    (e) => !(e.corrige as { markdown?: string } | null)?.markdown?.trim(),
  )
  if (missing.length > 0) {
    return { error: `${missing.length} exercice(s) sans corrigé. Complète-les avant de publier.` }
  }

  const total = exercises.reduce((sum, e) => sum + Number(e.points), 0)
  if (Math.abs(total - Number(exam.total_points)) > 0.01) {
    return {
      error: `Le barème total fait ${total} points au lieu de ${Number(exam.total_points)}. Corrige les points avant de publier.`,
    }
  }

  const { error } = await supabase
    .from('exams')
    .update({ status: 'published' })
    .eq('id', examId)

  if (error) return { error: 'Publication impossible.' }

  revalidatePath('/admin/examens')
  revalidatePath(`/admin/examens/${examId}`)
  revalidatePath('/examens')
  return { ok: true }
}

export async function unpublishExam(examId: string): Promise<Result> {
  const { supabase, staff } = await requireStaff()
  if (!staff) return { error: 'Réservé à l’équipe.' }

  const { error } = await supabase
    .from('exams')
    .update({ status: 'draft' })
    .eq('id', examId)

  if (error) return { error: 'Retrait impossible.' }

  revalidatePath('/admin/examens')
  revalidatePath(`/admin/examens/${examId}`)
  revalidatePath('/examens')
  return { ok: true }
}
