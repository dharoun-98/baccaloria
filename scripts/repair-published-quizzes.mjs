/**
 * Publishes the questions and quiz of every already-published lesson.
 *
 *     node --env-file=.env.local scripts/repair-published-quizzes.mjs
 *
 * Fixes content published before publishLesson() learned to cascade. Those
 * lessons went live with their questions and quiz still in draft, so students
 * saw no "Teste-toi" button at all — a missing button reads as a design choice,
 * not a fault, which is why it went unnoticed.
 *
 * The reviewer stamped on the questions is the one who reviewed the lesson,
 * since that is who actually vetted them. Questions with no explanation are
 * skipped: the database refuses to publish those, and rightly so.
 */
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key || key === 'PASTE_ME') {
  console.error('Run with: node --env-file=.env.local scripts/repair-published-quizzes.mjs')
  process.exit(1)
}

const db = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const { data: lessons } = await db
  .from('lessons')
  .select('id, slug, reviewed_by, reviewed_at')
  .eq('status', 'published')

if (!lessons?.length) {
  console.log('Aucune leçon publiée.')
  process.exit(0)
}

let fixedQuestions = 0
let fixedQuizzes = 0
let skipped = 0

for (const lesson of lessons) {
  const { data: questions } = await db
    .from('questions')
    .select('id, status, explanation')
    .eq('lesson_id', lesson.id)

  const pending = (questions ?? []).filter(
    (q) => q.status !== 'published' && q.explanation?.markdown?.trim(),
  )
  const noExplanation = (questions ?? []).filter((q) => !q.explanation?.markdown?.trim())

  if (pending.length > 0) {
    const { error } = await db
      .from('questions')
      .update({
        status: 'published',
        reviewed_by: lesson.reviewed_by,
        reviewed_at: lesson.reviewed_at ?? new Date().toISOString(),
      })
      .in(
        'id',
        pending.map((q) => q.id),
      )

    if (error) {
      console.log(`✗ ${lesson.slug} — ${error.message}`)
      continue
    }
    fixedQuestions += pending.length
  }

  skipped += noExplanation.length

  const { data: quiz } = await db
    .from('assessments')
    .select('id, status')
    .eq('lesson_id', lesson.id)
    .eq('kind', 'lesson_quiz')
    .maybeSingle()

  if (quiz && quiz.status !== 'published') {
    await db.from('assessments').update({ status: 'published' }).eq('id', quiz.id)
    fixedQuizzes++
  }

  console.log(
    `✓ ${lesson.slug.padEnd(42)} ${pending.length} question(s), quiz ${quiz ? (quiz.status !== 'published' ? 'publié' : 'déjà ok') : 'absent'}`,
  )
}

console.log(`\n${fixedQuestions} question(s) publiée(s), ${fixedQuizzes} quiz publié(s).`)
if (skipped > 0) {
  console.log(`${skipped} question(s) ignorée(s) : pas d'explication.`)
}
