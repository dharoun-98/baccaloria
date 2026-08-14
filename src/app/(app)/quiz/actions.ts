'use server'

import { createClient } from '@/lib/supabase/server'

export type QuizQuestion = {
  id: string
  type: string
  stem: { markdown?: string } | null
  choices: { id: string; label: string }[]
  points: number
  est_seconds: number
  hint: { markdown?: string } | null
}

export type StartPayload = {
  attempt_id: string
  title: string
  instructions: string | null
  duration_min: number | null
  pass_threshold: number
  questions: QuizQuestion[]
}

export type QuestionResult = {
  question_id: string
  stem: { markdown?: string } | null
  type: string
  choices: { id: string; label: string; is_correct?: boolean }[]
  answer: { choice?: string; choices?: string[]; value?: number; text?: string } | null
  explanation: { markdown?: string } | null
  response: { choice?: string; choices?: string[]; value?: number; text?: string } | null
  is_correct: boolean
  points_earned: number
  points_max: number
}

export type GradedPayload = {
  attempt_id: string
  score: number
  max_score: number
  percentage: number
  passed: boolean
  duration_sec: number
  time_limit_sec: number | null
  results: QuestionResult[]
}

/**
 * Both actions are thin wrappers over SECURITY DEFINER database functions.
 * All the logic — the draw, the paywall check, the grading — lives in
 * supabase/migrations/0008_quiz_engine.sql, so it cannot be bypassed by
 * calling the API directly instead of using this UI.
 */
export async function startQuiz(
  assessmentId: string,
): Promise<{ data?: StartPayload; error?: string }> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('start_attempt', {
    p_assessment_id: assessmentId,
  })

  if (error) return { error: translate(error.message) }
  return { data: data as StartPayload }
}

export async function submitQuiz(
  attemptId: string,
  answers: { question_id: string; response: unknown; seconds_spent?: number }[],
): Promise<{ data?: GradedPayload; error?: string }> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('submit_attempt', {
    p_attempt_id: attemptId,
    p_answers: answers,
  })

  if (error) return { error: translate(error.message) }
  return { data: data as GradedPayload }
}

function translate(message: string): string {
  if (message.includes('Abonnement requis')) {
    return "Cette évaluation fait partie de l'offre Premium."
  }
  if (message.includes('Aucune question')) {
    return "Aucune question n'est encore disponible pour cette leçon."
  }
  if (message.includes('déjà terminée')) {
    return 'Cette tentative a déjà été corrigée.'
  }
  if (message.includes('tentatives épuisé')) {
    return "Tu as atteint le nombre maximum de tentatives."
  }
  // Database messages are already written in French; anything unexpected gets a
  // neutral fallback rather than leaking Postgres internals to a student.
  return message.startsWith('Non authentifié')
    ? 'Ta session a expiré. Reconnecte-toi.'
    : "Une erreur est survenue. Réessaie dans un instant."
}
