'use client'

import { ArrowLeft, ArrowRight, Check, RotateCcw, X } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useRef, useState } from 'react'
import { toast } from 'sonner'

import {
  startQuiz,
  submitQuiz,
  type GradedPayload,
  type StartPayload,
} from '../actions'

import { RichText } from '@/components/lesson/rich-text'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Phase = 'idle' | 'running' | 'graded'

export function QuizRunner({
  assessmentId,
  title,
  instructions,
  backHref,
}: {
  assessmentId: string
  title: string
  instructions: string | null
  backHref: string
}) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [pending, setPending] = useState(false)
  const [quiz, setQuiz] = useState<StartPayload | null>(null)
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [graded, setGraded] = useState<GradedPayload | null>(null)

  // Per-question timing, used to surface "you rushed this one" later.
  // Seeded at 0 rather than Date.now(): reading the clock during render is
  // impure and unstable across re-renders. begin() stamps it when the quiz
  // actually starts, which is the only moment the value means anything.
  const questionOpenedAt = useRef<number>(0)
  const seconds = useRef<Record<string, number>>({})

  const begin = useCallback(async () => {
    setPending(true)
    const { data, error } = await startQuiz(assessmentId)
    setPending(false)

    if (error || !data) {
      toast.error(error ?? 'Impossible de démarrer le quiz.')
      return
    }

    setQuiz(data)
    setAnswers({})
    setIndex(0)
    setGraded(null)
    questionOpenedAt.current = Date.now()
    seconds.current = {}
    setPhase('running')
  }, [assessmentId])

  function recordTime(questionId: string) {
    const elapsed = Math.round((Date.now() - questionOpenedAt.current) / 1000)
    seconds.current[questionId] = (seconds.current[questionId] ?? 0) + elapsed
    questionOpenedAt.current = Date.now()
  }

  async function finish() {
    if (!quiz) return
    const current = quiz.questions[index]
    if (current) recordTime(current.id)

    setPending(true)
    const payload = quiz.questions.map((q) => ({
      question_id: q.id,
      response: answers[q.id] ? { choice: answers[q.id] } : null,
      seconds_spent: seconds.current[q.id] ?? 0,
    }))

    const { data, error } = await submitQuiz(quiz.attempt_id, payload)
    setPending(false)

    if (error || !data) {
      toast.error(error ?? 'Impossible de corriger le quiz.')
      return
    }

    setGraded(data)
    setPhase('graded')
    window.scrollTo({ top: 0 })
  }

  // ------------------------------------------------------------- idle ----
  if (phase === 'idle') {
    return (
      <div className="rounded-card border border-border bg-surface p-6 text-center shadow-card sm:p-8">
        <h1 className="font-display text-xl font-bold tracking-tight text-balance sm:text-2xl">
          {title}
        </h1>
        {instructions && (
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-foreground-muted">
            {instructions}
          </p>
        )}
        <Button onClick={begin} loading={pending} size="lg" className="mt-6" block>
          Commencer
        </Button>
        <Link
          href={backHref}
          className="mt-4 inline-block text-sm font-medium text-foreground-muted hover:text-foreground"
        >
          Retour à la leçon
        </Link>
      </div>
    )
  }

  // ------------------------------------------------------------ graded ---
  if (phase === 'graded' && graded) {
    return <Results graded={graded} onRetry={begin} retrying={pending} backHref={backHref} />
  }

  // ----------------------------------------------------------- running ---
  if (!quiz) return null

  const question = quiz.questions[index]
  if (!question) return null

  const isLast = index === quiz.questions.length - 1
  const selected = answers[question.id]
  const answeredCount = Object.keys(answers).length

  return (
    <div>
      <div className="mb-5">
        <div className="mb-2 flex items-baseline justify-between text-sm">
          <span className="font-medium text-foreground-muted">
            Question {index + 1} sur {quiz.questions.length}
          </span>
          <span className="font-mono text-xs text-foreground-subtle tabular-nums">
            {answeredCount}/{quiz.questions.length} répondues
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-surface-sunken">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300"
            style={{ width: `${((index + 1) / quiz.questions.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="rounded-card border border-border bg-surface p-5 shadow-card sm:p-6">
        {question.stem?.markdown && <RichText markdown={question.stem.markdown} />}

        <fieldset className="mt-5 flex flex-col gap-2.5">
          <legend className="sr-only">Choisis une réponse</legend>

          {question.choices.map((choice) => {
            const active = selected === choice.id
            return (
              <label
                key={choice.id}
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3.5 transition',
                  active
                    ? 'border-primary bg-primary-subtle'
                    : 'border-border hover:border-brand-300',
                )}
              >
                <input
                  type="radio"
                  name={question.id}
                  value={choice.id}
                  checked={active}
                  onChange={() =>
                    setAnswers((prev) => ({ ...prev, [question.id]: choice.id }))
                  }
                  className="sr-only"
                />
                <span
                  aria-hidden
                  className={cn(
                    'mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 text-xs font-bold transition',
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border-strong text-transparent',
                  )}
                >
                  <Check className="size-3" strokeWidth={3.5} />
                </span>
                <span className="min-w-0 flex-1">
                  <RichText markdown={choice.label} inline />
                </span>
              </label>
            )
          })}
        </fieldset>
      </div>

      <div className="mt-5 flex gap-3">
        {index > 0 && (
          <Button
            variant="secondary"
            size="lg"
            onClick={() => {
              recordTime(question.id)
              setIndex((i) => i - 1)
            }}
          >
            <ArrowLeft className="size-4" aria-hidden />
            Précédent
          </Button>
        )}

        {isLast ? (
          <Button onClick={finish} loading={pending} size="lg" block>
            Voir mon score
          </Button>
        ) : (
          <Button
            size="lg"
            block
            onClick={() => {
              recordTime(question.id)
              setIndex((i) => i + 1)
            }}
          >
            Suivant
            <ArrowRight className="size-4" aria-hidden />
          </Button>
        )}
      </div>

      <p className="mt-3 text-center text-xs text-foreground-subtle">
        Tu peux revenir en arrière. La correction s&apos;affiche à la fin.
      </p>
    </div>
  )
}

// ================================================================ results ===
function Results({
  graded,
  onRetry,
  retrying,
  backHref,
}: {
  graded: GradedPayload
  onRetry: () => void
  retrying: boolean
  backHref: string
}) {
  const pct = Math.round(Number(graded.percentage))

  const tone =
    pct >= 80
      ? { label: 'Excellent', color: 'text-band-4' }
      : pct >= 60
        ? { label: 'Bien', color: 'text-band-3' }
        : pct >= 40
          ? { label: 'À consolider', color: 'text-band-2' }
          : { label: 'À retravailler', color: 'text-band-1' }

  const wrong = graded.results.filter((r) => !r.is_correct)

  return (
    <div>
      <div className="rounded-card border border-border bg-surface p-6 text-center shadow-card">
        <p className="font-display text-sm font-semibold tracking-wide text-foreground-muted uppercase">
          Ton score
        </p>
        <p className={cn('mt-2 font-display text-5xl font-bold tabular-nums', tone.color)}>
          {pct}%
        </p>
        <p className="mt-1 text-sm text-foreground-muted tabular-nums">
          {Number(graded.score)} / {Number(graded.max_score)} points · {tone.label}
        </p>

        {wrong.length > 0 && (
          <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-foreground-muted">
            {wrong.length === 1
              ? 'Une seule erreur. Lis la correction ci-dessous — c’est là que tu gagnes des points.'
              : `${wrong.length} erreurs. Les corrections sont en dessous : c’est la partie qui fait progresser.`}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
          <Button onClick={onRetry} loading={retrying} block variant="secondary">
            <RotateCcw className="size-4" aria-hidden />
            Refaire (nouvelles questions)
          </Button>
          <Link
            href={backHref}
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary px-5 text-[15px] font-semibold text-primary-foreground transition hover:bg-primary-hover"
          >
            Retour à la leçon
          </Link>
        </div>
      </div>

      <h2 className="mt-8 mb-3 font-display text-sm font-semibold tracking-wide text-foreground-muted uppercase">
        Corrections
      </h2>

      <ol className="flex flex-col gap-4">
        {graded.results.map((result, i) => (
          <li
            key={result.question_id}
            className={cn(
              'rounded-card border-2 bg-surface p-5',
              result.is_correct
                ? 'border-success/30'
                : 'border-danger/35',
            )}
          >
            <div className="mb-3 flex items-center gap-2">
              <span
                className={cn(
                  'grid size-6 shrink-0 place-items-center rounded-full text-white',
                  result.is_correct ? 'bg-success' : 'bg-danger',
                )}
                aria-hidden
              >
                {result.is_correct ? (
                  <Check className="size-3.5" strokeWidth={3} />
                ) : (
                  <X className="size-3.5" strokeWidth={3} />
                )}
              </span>
              <span className="font-display text-sm font-semibold">
                Question {i + 1} —{' '}
                <span className={result.is_correct ? 'text-success' : 'text-danger'}>
                  {result.is_correct ? 'bonne réponse' : 'réponse incorrecte'}
                </span>
              </span>
            </div>

            {result.stem?.markdown && <RichText markdown={result.stem.markdown} />}

            <ul className="mt-4 flex flex-col gap-1.5">
              {result.choices.map((choice) => {
                const chosen = result.response?.choice === choice.id
                const correct = Boolean(choice.is_correct)

                return (
                  <li
                    key={choice.id}
                    className={cn(
                      'flex items-start gap-2.5 rounded-lg border px-3 py-2 text-sm',
                      correct
                        ? 'border-success/40 bg-success/8'
                        : chosen
                          ? 'border-danger/40 bg-danger/8'
                          : 'border-border',
                    )}
                  >
                    <span className="mt-0.5 shrink-0" aria-hidden>
                      {correct ? (
                        <Check className="size-4 text-success" strokeWidth={3} />
                      ) : chosen ? (
                        <X className="size-4 text-danger" strokeWidth={3} />
                      ) : (
                        <span className="block size-4" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <RichText markdown={choice.label} inline />
                      {chosen && (
                        <span className="ml-1.5 text-xs text-foreground-subtle">
                          (ta réponse)
                        </span>
                      )}
                    </span>
                  </li>
                )
              })}
            </ul>

            {result.explanation?.markdown && (
              <div className="mt-4 rounded-xl border border-border bg-surface-sunken p-4">
                <p className="mb-2 font-display text-xs font-semibold tracking-wide text-foreground-muted uppercase">
                  Explication
                </p>
                <RichText markdown={result.explanation.markdown} />
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}
