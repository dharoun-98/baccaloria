'use client'

import { Check, CircleCheck, Pencil, Save, Trash2, Undo2, X } from 'lucide-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { deleteQuestion, saveQuestion, setQuestionStatus } from './actions'

import { RichText } from '@/components/lesson/rich-text'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/field'
import { cn } from '@/lib/utils'

export type QuestionRow = {
  id: string
  stem: string
  explanation: string
  difficulty: number
  status: string
  lessonTitle: string
  subjectName: string
  choices: { id: string; label: string; is_correct: boolean }[]
}

const textareaClass =
  'w-full rounded-xl border border-border bg-surface-sunken p-3 font-mono text-[13px] leading-relaxed focus-visible:border-brand-400 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ring)]'

export function QuestionList({ questions }: { questions: QuestionRow[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [pending, startTransition] = useTransition()

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function bulk(publish: boolean) {
    startTransition(async () => {
      const result = await setQuestionStatus([...selected], publish)
      if (result.error) toast.error(result.error)
      else {
        toast.success(`${result.changed} question(s) ${publish ? 'publiée(s)' : 'retirée(s)'}.`)
        setSelected(new Set())
      }
    })
  }

  return (
    <>
      <ul className="flex flex-col gap-3 pb-24">
        {questions.map((question) => (
          <QuestionCard
            key={question.id}
            question={question}
            selected={selected.has(question.id)}
            onToggle={() => toggle(question.id)}
          />
        ))}
      </ul>

      {selected.size > 0 && (
        <div
          className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/97 p-3 shadow-pop backdrop-blur-md md:left-60"
          style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
        >
          <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold">
              {selected.size} question(s) sélectionnée(s)
            </p>
            <div className="flex gap-2">
              <Button size="sm" loading={pending} onClick={() => bulk(true)}>
                <CircleCheck className="size-3.5" aria-hidden />
                Publier
              </Button>
              <Button
                size="sm"
                variant="secondary"
                loading={pending}
                onClick={() => bulk(false)}
              >
                <Undo2 className="size-3.5" aria-hidden />
                Retirer
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
                <X className="size-3.5" aria-hidden />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function QuestionCard({
  question,
  selected,
  onToggle,
}: {
  question: QuestionRow
  selected: boolean
  onToggle: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [pending, startTransition] = useTransition()
  const [correct, setCorrect] = useState(
    question.choices.find((c) => c.is_correct)?.id ?? 'a',
  )

  return (
    <li
      className={cn(
        'rounded-card border bg-surface',
        selected ? 'border-primary' : 'border-border',
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <button
            type="button"
            onClick={onToggle}
            aria-pressed={selected}
            aria-label="Sélectionner cette question"
            className={cn(
              'grid size-4 shrink-0 place-items-center rounded border-2 transition',
              selected
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border-strong text-transparent hover:border-brand-400',
            )}
          >
            <Check className="size-2.5" strokeWidth={4} aria-hidden />
          </button>
          <span className="min-w-0 truncate text-xs text-foreground-muted">
            {question.subjectName} · {question.lessonTitle}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-[11px] font-medium',
              question.status === 'published'
                ? 'bg-success/12 text-success'
                : 'bg-surface-sunken text-foreground-muted',
            )}
          >
            {question.status === 'published' ? 'publiée' : 'brouillon'}
          </span>
          <button
            type="button"
            onClick={() => setEditing((e) => !e)}
            className="rounded-lg p-1.5 text-foreground-subtle transition hover:bg-surface-sunken hover:text-foreground"
            aria-label="Modifier"
          >
            <Pencil className="size-3.5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() =>
              startTransition(async () => {
                const r = await deleteQuestion(question.id)
                if (r.error) toast.error(r.error)
                else toast.success('Question supprimée.')
              })
            }
            disabled={pending}
            className="rounded-lg p-1.5 text-foreground-subtle transition hover:bg-danger/10 hover:text-danger"
            aria-label="Supprimer"
          >
            <Trash2 className="size-3.5" aria-hidden />
          </button>
        </div>
      </div>

      {editing ? (
        <form
          action={(formData) =>
            startTransition(async () => {
              const r = await saveQuestion(question.id, formData)
              if (r.error) toast.error(r.error)
              else {
                toast.success('Question enregistrée.')
                setEditing(false)
              }
            })
          }
          className="flex flex-col gap-3 p-4"
        >
          <input type="hidden" name="correct" value={correct} />

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`stem-${question.id}`}>Question</Label>
            <textarea
              id={`stem-${question.id}`}
              name="stem"
              defaultValue={question.stem}
              rows={3}
              className={textareaClass}
            />
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium">
              Réponses — coche la bonne
            </legend>
            {['a', 'b', 'c', 'd'].map((id, i) => (
              <div key={id} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCorrect(id)}
                  aria-label={`Marquer la réponse ${id.toUpperCase()} comme correcte`}
                  className={cn(
                    'grid size-6 shrink-0 place-items-center rounded-full border-2 text-xs font-bold transition',
                    correct === id
                      ? 'border-success bg-success text-white'
                      : 'border-border-strong text-foreground-subtle hover:border-success',
                  )}
                >
                  {id.toUpperCase()}
                </button>
                <Input
                  name={`choice_${i}`}
                  defaultValue={question.choices[i]?.label ?? ''}
                  placeholder={i < 2 ? 'Obligatoire' : 'Optionnel'}
                  className="h-10 text-sm"
                />
              </div>
            ))}
          </fieldset>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`explanation-${question.id}`}>
              Explication <span className="text-danger">*</span>
            </Label>
            <textarea
              id={`explanation-${question.id}`}
              name="explanation"
              defaultValue={question.explanation}
              rows={6}
              className={textareaClass}
            />
            <p className="text-xs text-foreground-subtle">
              Obligatoire. C&apos;est ce que l&apos;élève lit après s&apos;être trompé —
              la partie qui fait progresser.
            </p>
          </div>

          <div className="flex items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`difficulty-${question.id}`}>Difficulté</Label>
              <select
                id={`difficulty-${question.id}`}
                name="difficulty"
                defaultValue={String(question.difficulty)}
                className="h-10 rounded-lg border border-border bg-surface px-2.5 text-sm"
              >
                <option value="1">Accessible</option>
                <option value="2">Intermédiaire</option>
                <option value="3">Exigeant</option>
              </select>
            </div>
            <Button type="submit" loading={pending} size="sm">
              <Save className="size-3.5" aria-hidden />
              Enregistrer
            </Button>
          </div>
        </form>
      ) : (
        <div className="p-4">
          <RichText markdown={question.stem} />
          <ul className="mt-3 flex flex-col gap-1">
            {question.choices.map((c) => (
              <li
                key={c.id}
                className={cn(
                  'flex items-start gap-2 rounded-lg px-2.5 py-1.5 text-sm',
                  c.is_correct ? 'bg-success/8 text-success' : 'text-foreground-muted',
                )}
              >
                <span className="mt-0.5 shrink-0" aria-hidden>
                  {c.is_correct ? <Check className="size-3.5" strokeWidth={3} /> : <span className="block size-3.5" />}
                </span>
                <RichText markdown={c.label} inline />
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  )
}
