'use client'

import { CircleCheck, Eye, Pencil, Plus, Save, Trash2, Undo2 } from 'lucide-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import {
  addExercise,
  deleteExercise,
  publishExam,
  saveExercise,
  unpublishExam,
} from '../actions'

import { RichText } from '@/components/lesson/rich-text'
import { Button } from '@/components/ui/button'
import { Field, Input, Label } from '@/components/ui/field'
import { cn } from '@/lib/utils'

export type Exercise = {
  id: string
  position: number
  label: string
  points: number
  corrige: string | null
}

export function ExerciseEditor({
  examId,
  exercises,
  status,
  totalPoints,
}: {
  examId: string
  exercises: Exercise[]
  status: string
  totalPoints: number
}) {
  const [pending, startTransition] = useTransition()
  const [adding, setAdding] = useState(false)

  const sum = exercises.reduce((s, e) => s + Number(e.points), 0)
  const balanced = Math.abs(sum - totalPoints) < 0.01
  const complete = exercises.length > 0 && exercises.every((e) => e.corrige?.trim())
  const published = status === 'published'

  return (
    <div className="flex flex-col gap-5">
      {/* ------------------------------------------------------- publish */}
      <section className="rounded-card border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display font-semibold">
              {published ? 'Publié' : 'Brouillon'}
            </h2>
            <p className="mt-1 text-sm text-foreground-muted tabular-nums">
              {exercises.length} exercice(s) · barème {sum}/{totalPoints}
              {!balanced && ' ⚠'}
            </p>
          </div>

          {published ? (
            <Button
              variant="secondary"
              loading={pending}
              onClick={() =>
                startTransition(async () => {
                  const r = await unpublishExam(examId)
                  if (r.error) toast.error(r.error)
                  else toast.success('Examen retiré. Les élèves ne le voient plus.')
                })
              }
            >
              <Undo2 className="size-4" aria-hidden />
              Dépublier
            </Button>
          ) : (
            <Button
              loading={pending}
              disabled={!complete || !balanced}
              onClick={() =>
                startTransition(async () => {
                  const r = await publishExam(examId)
                  if (r.error) toast.error(r.error)
                  else toast.success('Examen publié — les élèves peuvent le passer.')
                })
              }
            >
              <CircleCheck className="size-4" aria-hidden />
              Publier
            </Button>
          )}
        </div>

        {!published && (!complete || !balanced) && (
          <p className="mt-3 rounded-lg border border-accent-300 bg-accent-50 p-3 text-sm leading-relaxed dark:border-accent-800 dark:bg-accent-900/25">
            {exercises.length === 0
              ? 'Découpe le sujet en exercices avant de publier.'
              : !complete
                ? 'Chaque exercice doit avoir son corrigé : sans lui, l’élève passe trois heures sans pouvoir se noter.'
                : `Le barème fait ${sum} points au lieu de ${totalPoints}. La note de l’élève serait fausse.`}
          </p>
        )}
      </section>

      {/* ----------------------------------------------------- exercises */}
      {exercises.map((exercise) => (
        <ExerciseCard key={exercise.id} exercise={exercise} examId={examId} />
      ))}

      {/* ----------------------------------------------------------- add */}
      {adding ? (
        <form
          action={(formData) =>
            startTransition(async () => {
              const r = await addExercise(examId, formData)
              if (r.error) toast.error(r.error)
              else {
                toast.success('Exercice ajouté.')
                setAdding(false)
              }
            })
          }
          className="rounded-card border-2 border-dashed border-border p-5"
        >
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <Field label="Intitulé" htmlFor="label">
              <Input
                id="label"
                name="label"
                placeholder="ex. Exercice 1 — Suites numériques"
                required
                autoFocus
              />
            </Field>
            <Field label="Points" htmlFor="points">
              <Input
                id="points"
                name="points"
                type="number"
                min={0.25}
                step="0.25"
                defaultValue={3}
                className="w-24"
                required
              />
            </Field>
            <Field label="Position" htmlFor="position">
              <Input
                id="position"
                name="position"
                type="number"
                min={1}
                defaultValue={exercises.length + 1}
                className="w-24"
                required
              />
            </Field>
          </div>
          <div className="mt-3 flex gap-2">
            <Button type="submit" loading={pending} size="sm">
              Ajouter
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setAdding(false)}>
              Annuler
            </Button>
          </div>
        </form>
      ) : (
        <Button variant="secondary" onClick={() => setAdding(true)} block>
          <Plus className="size-4" aria-hidden />
          Ajouter un exercice
        </Button>
      )}
    </div>
  )
}

function ExerciseCard({ exercise, examId }: { exercise: Exercise; examId: string }) {
  const [editing, setEditing] = useState(!exercise.corrige)
  const [corrige, setCorrige] = useState(exercise.corrige ?? '')
  const [pending, startTransition] = useTransition()

  return (
    <section
      className={cn(
        'rounded-card border bg-surface',
        exercise.corrige?.trim() ? 'border-border' : 'border-accent-300 dark:border-accent-800',
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5">
        <span className="min-w-0 truncate text-sm font-semibold">
          {exercise.label}{' '}
          <span className="font-mono font-normal text-foreground-muted">
            ({Number(exercise.points)} pts)
          </span>
        </span>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setEditing((e) => !e)}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-foreground-muted transition hover:bg-surface-sunken hover:text-foreground"
          >
            {editing ? (
              <>
                <Eye className="size-3.5" aria-hidden />
                Aperçu
              </>
            ) : (
              <>
                <Pencil className="size-3.5" aria-hidden />
                Modifier
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() =>
              startTransition(async () => {
                const r = await deleteExercise(exercise.id, examId)
                if (r.error) toast.error(r.error)
                else toast.success('Exercice supprimé.')
              })
            }
            disabled={pending}
            className="rounded-lg p-1.5 text-foreground-subtle transition hover:bg-danger/10 hover:text-danger"
            aria-label="Supprimer cet exercice"
          >
            <Trash2 className="size-3.5" aria-hidden />
          </button>
        </div>
      </div>

      {editing ? (
        <form
          action={(formData) =>
            startTransition(async () => {
              const r = await saveExercise(exercise.id, examId, formData)
              if (r.error) toast.error(r.error)
              else {
                toast.success('Corrigé enregistré.')
                setEditing(false)
              }
            })
          }
          className="flex flex-col gap-3 p-4"
        >
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <Field label="Intitulé" htmlFor={`label-${exercise.id}`}>
              <Input
                id={`label-${exercise.id}`}
                name="label"
                defaultValue={exercise.label}
                required
              />
            </Field>
            <Field label="Points" htmlFor={`points-${exercise.id}`}>
              <Input
                id={`points-${exercise.id}`}
                name="points"
                type="number"
                min={0.25}
                step="0.25"
                defaultValue={Number(exercise.points)}
                className="w-24"
                required
              />
            </Field>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`corrige-${exercise.id}`}>Corrigé</Label>
            <textarea
              id={`corrige-${exercise.id}`}
              name="corrige"
              value={corrige}
              onChange={(e) => setCorrige(e.target.value)}
              rows={Math.min(30, Math.max(8, corrige.split('\n').length + 2))}
              spellCheck
              className="w-full rounded-xl border border-border bg-surface-sunken p-3.5 font-mono text-[13px] leading-relaxed focus-visible:border-brand-400 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ring)]"
            />
            <p className="text-xs leading-relaxed text-foreground-subtle">
              Markdown + LaTeX, comme les leçons. Détaille les étapes : l&apos;élève
              s&apos;en sert pour comprendre où il a perdu des points, pas seulement
              pour vérifier son résultat.
            </p>
          </div>

          <Button type="submit" loading={pending} size="sm" className="self-start">
            <Save className="size-3.5" aria-hidden />
            Enregistrer
          </Button>
        </form>
      ) : (
        <div className="p-4">
          {corrige.trim() ? (
            <RichText markdown={corrige} />
          ) : (
            <p className="text-sm text-accent-600">Corrigé à rédiger.</p>
          )}
        </div>
      )}
    </section>
  )
}
