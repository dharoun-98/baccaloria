'use server'

import { createClient } from '@/lib/supabase/server'

export type ExamExercise = {
  id: string
  position: number
  label: string
  points: number
}

export type ExamSession = {
  attempt_id: string
  exam_id: string
  year: number
  session: string
  duration_min: number
  total_points: number
  instructions: string | null
  exercises: ExamExercise[]
}

export type ExamResult = {
  attempt_id: string
  score: number
  max_score: number
  percentage: number
  duration_sec: number
  time_limit_sec: number | null
  within_time: boolean
  breakdown: {
    exercise_id: string
    label: string
    points_earned: number
    points_max: number
  }[]
}

export async function startExam(
  examId: string,
): Promise<{ data?: ExamSession; error?: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('start_exam_attempt', { p_exam_id: examId })

  if (error) return { error: translate(error.message) }
  return { data: data as ExamSession }
}

export async function submitExam(
  attemptId: string,
  scores: { exercise_id: string; points: number }[],
): Promise<{ data?: ExamResult; error?: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('submit_exam_attempt', {
    p_attempt_id: attemptId,
    p_scores: scores,
  })

  if (error) return { error: translate(error.message) }
  return { data: data as ExamResult }
}

/**
 * Time-limited link to the exam PDF.
 *
 * Created through the STUDENT's session, not the service key, so the storage
 * policy decides — a student without a subscription gets nothing, and the link
 * expires rather than becoming a permanently shareable copy of the paper.
 */
export async function getExamPdfUrl(
  examId: string,
): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient()

  const { data: exam } = await supabase
    .from('exams')
    .select('subject_pdf_path, status')
    .eq('id', examId)
    .maybeSingle()

  if (!exam?.subject_pdf_path) {
    return { error: "Le sujet n'est pas encore disponible." }
  }

  const { data, error } = await supabase.storage
    .from('exams')
    .createSignedUrl(exam.subject_pdf_path, 60 * 60 * 5)

  if (error || !data) {
    return { error: "Impossible d'ouvrir le sujet. Vérifie ton abonnement." }
  }

  return { url: data.signedUrl }
}

function translate(message: string): string {
  if (message.includes('Abonnement requis')) {
    return 'Les examens nationaux font partie de l’offre Premium.'
  }
  if (message.includes('déjà terminée')) {
    return 'Cette session est déjà terminée.'
  }
  if (message.includes('Examen introuvable')) {
    return "Cet examen n'est pas disponible."
  }
  return message.startsWith('Non authentifié')
    ? 'Ta session a expiré. Reconnecte-toi.'
    : 'Une erreur est survenue. Réessaie.'
}
