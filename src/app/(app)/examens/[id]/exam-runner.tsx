'use client'

import {
  AlertTriangle,
  Clock,
  ExternalLink,
  FileText,
  Flag,
  RotateCcw,
} from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import {
  getExamPdfUrl,
  startExam,
  submitExam,
  type ExamResult,
  type ExamSession,
} from '../actions'

import { Button } from '@/components/ui/button'
import { cn, formatDuration } from '@/lib/utils'

type Phase = 'brief' | 'running' | 'scoring' | 'done'

export function ExamRunner({
  examId,
  title,
  durationMin,
  hasCorrige,
}: {
  examId: string
  title: string
  durationMin: number
  hasCorrige: boolean
}) {
  const [phase, setPhase] = useState<Phase>('brief')
  const [pending, setPending] = useState(false)
  const [session, setSession] = useState<ExamSession | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [scores, setScores] = useState<Record<string, string>>({})
  const [result, setResult] = useState<ExamResult | null>(null)

  const startedAt = useRef<number>(0)

  // The clock is driven by a timestamp, not by counting ticks. A backgrounded
  // tab throttles timers, and an exam that pauses when you switch apps is not
  // an exam.
  useEffect(() => {
    if (phase !== 'running') return
    const tick = () => setElapsed(Math.floor((Date.now() - startedAt.current) / 1000))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [phase])

  const limit = durationMin * 60
  const remaining = Math.max(0, limit - elapsed)
  const overtime = elapsed > limit

  const begin = useCallback(async () => {
    setPending(true)
    const [{ data, error }, pdf] = await Promise.all([
      startExam(examId),
      getExamPdfUrl(examId),
    ])
    setPending(false)

    if (error || !data) {
      toast.error(error ?? 'Impossible de démarrer.')
      return
    }
    if (pdf.error) toast.error(pdf.error)

    setSession(data)
    setPdfUrl(pdf.url ?? null)
    startedAt.current = Date.now()
    setElapsed(0)
    setPhase('running')
  }, [examId])

  async function finish() {
    if (!session) return
    setPending(true)

    const payload = session.exercises.map((ex) => ({
      exercise_id: ex.id,
      points: Number(scores[ex.id] ?? 0),
    }))

    const { data, error } = await submitExam(session.attempt_id, payload)
    setPending(false)

    if (error || !data) {
      toast.error(error ?? 'Impossible d’enregistrer.')
      return
    }

    setResult(data)
    setPhase('done')
    window.scrollTo({ top: 0 })
  }

  // ------------------------------------------------------------- brief ----
  if (phase === 'brief') {
    return (
      <div className="rounded-card border border-border bg-surface p-6 shadow-card sm:p-8">
        <h1 className="font-display text-xl font-bold tracking-tight text-balance sm:text-2xl">
          {title}
        </h1>

        <p className="mt-4 font-display text-sm font-semibold tracking-wide text-foreground-muted uppercase">
          Avant de commencer
        </p>
        <ul className="mt-2.5 flex flex-col gap-2.5 text-sm leading-relaxed">
          {[
            'Installe-toi comme le jour J : au calme, sans téléphone, sans notes.',
            `Le chronomètre démarre dès que tu cliques et ne s'arrête pas. Tu as ${Math.round(durationMin / 60)} h.`,
            'Prépare des feuilles et un stylo. Rédige comme à l’examen, pas dans ta tête.',
            'À la fin, tu compares avec le corrigé et tu notes chaque exercice toi-même.',
          ].map((line, i) => (
            <li key={line} className="flex gap-2.5">
              <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary-subtle font-mono text-[11px] font-bold text-primary">
                {i + 1}
              </span>
              <span className="text-foreground-muted">{line}</span>
            </li>
          ))}
        </ul>

        {!hasCorrige && (
          <p className="mt-4 flex gap-2.5 rounded-xl border border-accent-300 bg-accent-50 p-3 text-sm dark:border-accent-800 dark:bg-accent-900/25">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-accent-600" aria-hidden />
            <span className="text-foreground-muted">
              Le corrigé détaillé de cet examen n&apos;est pas encore en ligne. Tu peux
              le passer en conditions réelles, mais tu ne pourras pas te noter.
            </span>
          </p>
        )}

        <Button onClick={begin} loading={pending} size="lg" block className="mt-6">
          <Flag className="size-4" aria-hidden />
          Je commence
        </Button>

        <p className="mt-3 text-center text-xs text-foreground-subtle">
          Tu peux repasser cet examen autant de fois que tu veux.
        </p>
      </div>
    )
  }

  // ----------------------------------------------------------- results ----
  if (phase === 'done' && result) {
    const pct = Math.round(Number(result.percentage))
    const outOf20 = ((Number(result.score) / Number(result.max_score)) * 20).toFixed(1)

    return (
      <div>
        <div className="rounded-card border border-border bg-surface p-6 text-center shadow-card">
          <p className="font-display text-sm font-semibold tracking-wide text-foreground-muted uppercase">
            Ta note
          </p>
          <p className="mt-2 font-display text-5xl font-bold tabular-nums">
            {outOf20}
            <span className="text-2xl text-foreground-muted">/20</span>
          </p>
          <p className="mt-1 text-sm text-foreground-muted tabular-nums">
            {Number(result.score)} / {Number(result.max_score)} points · {pct}%
          </p>

          <p
            className={cn(
              'mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium',
              result.within_time
                ? 'bg-success/12 text-success'
                : 'bg-danger/12 text-danger',
            )}
          >
            <Clock className="size-3.5" aria-hidden />
            {formatDuration(result.duration_sec)}
            {result.within_time ? ' — dans les temps' : ' — hors délai'}
          </p>

          {!result.within_time && (
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-foreground-muted">
              Le jour J, la copie est ramassée à l&apos;heure. Repasse-le en te
              tenant strictement au temps imparti.
            </p>
          )}
        </div>

        <h2 className="mt-8 mb-3 font-display text-sm font-semibold tracking-wide text-foreground-muted uppercase">
          Par exercice
        </h2>
        <ul className="flex flex-col gap-2">
          {result.breakdown.map((row) => {
            const ratio = Number(row.points_max)
              ? Number(row.points_earned) / Number(row.points_max)
              : 0
            return (
              <li
                key={row.exercise_id}
                className="rounded-card border border-border bg-surface p-4"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-medium">{row.label}</span>
                  <span className="shrink-0 font-mono text-sm tabular-nums">
                    {Number(row.points_earned)} / {Number(row.points_max)}
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-sunken">
                  <div
                    className={cn(
                      'h-full rounded-full',
                      ratio >= 0.7 ? 'bg-success' : ratio >= 0.4 ? 'bg-warning' : 'bg-danger',
                    )}
                    style={{ width: `${Math.max(2, ratio * 100)}%` }}
                  />
                </div>
              </li>
            )
          })}
        </ul>

        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
          <Button
            variant="secondary"
            block
            onClick={() => {
              setPhase('brief')
              setResult(null)
              setScores({})
            }}
          >
            <RotateCcw className="size-4" aria-hidden />
            Repasser cet examen
          </Button>
          <Link
            href="/examens"
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary px-5 text-[15px] font-semibold text-primary-foreground transition hover:bg-primary-hover"
          >
            Autres examens
          </Link>
        </div>
      </div>
    )
  }

  if (!session) return null

  // -------------------------------------------------- running / scoring ---
  return (
    <div>
      {/* Sticky clock: the single most important thing on screen. */}
      <div
        className={cn(
          'sticky top-0 z-30 -mx-4 mb-5 flex items-center justify-between gap-3 border-b px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6',
          overtime
            ? 'border-danger/30 bg-danger/8'
            : remaining < 600
              ? 'border-accent-300 bg-accent-50 dark:border-accent-800 dark:bg-accent-900/25'
              : 'border-border bg-surface/95',
        )}
      >
        <span className="text-sm font-medium text-foreground-muted">
          {phase === 'running' ? 'Temps restant' : 'Temps utilisé'}
        </span>
        <span
          className={cn(
            'font-display text-xl font-bold tabular-nums',
            overtime && 'text-danger',
          )}
        >
          {phase === 'running'
            ? overtime
              ? `+${formatDuration(elapsed - limit)}`
              : formatDuration(remaining)
            : formatDuration(elapsed)}
        </span>
      </div>

      {phase === 'running' ? (
        <>
          <div className="rounded-card border border-border bg-surface p-5 text-center shadow-card">
            <FileText className="mx-auto size-8 text-primary" aria-hidden />
            <h2 className="mt-3 font-display font-semibold">Le sujet</h2>
            <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-foreground-muted">
              Ouvre-le, compose sur tes feuilles, et reviens ici quand tu as terminé.
            </p>

            {pdfUrl ? (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 font-semibold text-primary-foreground transition hover:bg-primary-hover"
              >
                <ExternalLink className="size-4" aria-hidden />
                Ouvrir le sujet
              </a>
            ) : (
              <p className="mt-4 text-sm text-danger">Sujet indisponible.</p>
            )}
          </div>

          {/* Inline on a big screen; on a phone the button above is the way in,
              since mobile browsers handle embedded PDFs badly. */}
          {pdfUrl && (
            <div className="mt-4 hidden overflow-hidden rounded-card border border-border md:block">
              <iframe
                src={pdfUrl}
                title="Sujet d'examen"
                className="h-[75vh] w-full"
              />
            </div>
          )}

          <Button
            onClick={() => setPhase('scoring')}
            size="lg"
            block
            className="mt-5"
            variant={overtime ? 'danger' : 'primary'}
          >
            J&apos;ai terminé — passer à la correction
          </Button>
        </>
      ) : (
        <>
          <div className="rounded-card border border-border bg-surface p-5 shadow-card">
            <h2 className="font-display font-semibold">Note-toi, exercice par exercice</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-foreground-muted">
              Compare ta copie au corrigé et attribue-toi les points. Sois honnête :
              c&apos;est ce chiffre qui alimente ton niveau de préparation, et te
              surnoter ne trompe que toi.
            </p>

            {pdfUrl && (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              >
                <ExternalLink className="size-3.5" aria-hidden />
                Revoir le sujet
              </a>
            )}
          </div>

          {session.exercises.length === 0 ? (
            <p className="mt-4 rounded-card border border-accent-300 bg-accent-50 p-4 text-sm dark:border-accent-800 dark:bg-accent-900/25">
              Le corrigé de cet examen n&apos;est pas encore découpé en exercices. Ta
              tentative sera enregistrée sans note.
            </p>
          ) : (
            <ul className="mt-4 flex flex-col gap-2">
              {session.exercises.map((ex) => (
                <li
                  key={ex.id}
                  className="flex items-center gap-3 rounded-card border border-border bg-surface p-4"
                >
                  <span className="min-w-0 flex-1 text-sm font-medium">{ex.label}</span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      max={ex.points}
                      step="0.25"
                      value={scores[ex.id] ?? ''}
                      onChange={(e) =>
                        setScores((prev) => ({ ...prev, [ex.id]: e.target.value }))
                      }
                      placeholder="0"
                      aria-label={`Points obtenus pour ${ex.label}`}
                      className="h-11 w-20 rounded-xl border border-border bg-surface px-2.5 text-center text-base tabular-nums focus-visible:border-brand-400 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ring)]"
                    />
                    <span className="font-mono text-sm text-foreground-muted">
                      / {Number(ex.points)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}

          <Button onClick={finish} loading={pending} size="lg" block className="mt-5">
            Voir ma note
          </Button>
        </>
      )}
    </div>
  )
}
