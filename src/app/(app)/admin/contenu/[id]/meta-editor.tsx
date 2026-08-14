'use client'

import { Save, Settings2 } from 'lucide-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { updateLessonMeta } from '../lesson-actions'

import { TagPicker, type CatalogueTag } from '@/components/admin/tag-picker'
import { Button } from '@/components/ui/button'
import { Field, Input, Label } from '@/components/ui/field'

const selectClass =
  'h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm focus-visible:border-brand-400 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ring)]'

export type LessonMeta = {
  id: string
  title: string
  subtitle: string | null
  difficulty: number
  estMinutes: number
  examFrequency: number
  accessTier: string
  tags: string[]
}

export function MetaEditor({
  lesson,
  catalogue,
}: {
  lesson: LessonMeta
  catalogue: CatalogueTag[]
}) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await updateLessonMeta(lesson.id, formData)
      if (result.error) toast.error(result.error)
      else {
        toast.success('Fiche mise à jour.')
        setOpen(false)
      }
    })
  }

  if (!open) {
    return (
      <section className="rounded-card border border-border bg-surface p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-display font-semibold">Fiche de la leçon</h2>
            <p className="mt-1 text-sm text-foreground-muted">
              {lesson.estMinutes} min · difficulté {lesson.difficulty}/3 · tombe{' '}
              {lesson.examFrequency}/5 ·{' '}
              {lesson.accessTier === 'free' ? 'gratuite' : 'premium'}
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
            <Settings2 className="size-3.5" aria-hidden />
            Modifier
          </Button>
        </div>

        {lesson.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {lesson.tags.map((slug) => {
              const tag = catalogue.find((t) => t.slug === slug)
              return (
                <span
                  key={slug}
                  className="rounded-full bg-surface-sunken px-2.5 py-1 text-xs font-medium text-foreground-muted"
                >
                  {tag?.label ?? slug}
                </span>
              )
            })}
          </div>
        )}
      </section>
    )
  }

  return (
    <form action={submit} className="rounded-card border border-border bg-surface p-5">
      <h2 className="mb-4 font-display font-semibold">Fiche de la leçon</h2>

      <div className="flex flex-col gap-4">
        <Field label="Titre" htmlFor="title">
          <Input id="title" name="title" defaultValue={lesson.title} required />
        </Field>

        <Field label="Sous-titre" htmlFor="subtitle">
          <Input id="subtitle" name="subtitle" defaultValue={lesson.subtitle ?? ''} />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="difficulty">Difficulté</Label>
            <select
              id="difficulty"
              name="difficulty"
              className={selectClass}
              defaultValue={String(lesson.difficulty)}
            >
              <option value="1">Accessible</option>
              <option value="2">Intermédiaire</option>
              <option value="3">Exigeant</option>
            </select>
          </div>

          <Field label="Durée (min)" htmlFor="estMinutes">
            <Input
              id="estMinutes"
              name="estMinutes"
              type="number"
              min={1}
              max={180}
              defaultValue={lesson.estMinutes}
            />
          </Field>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="examFrequency">Fréquence aux examens</Label>
            <select
              id="examFrequency"
              name="examFrequency"
              className={selectClass}
              defaultValue={String(lesson.examFrequency)}
            >
              <option value="5">Chaque année (5/5)</option>
              <option value="4">Très fréquent (4/5)</option>
              <option value="3">Fréquent (3/5)</option>
              <option value="2">Occasionnel (2/5)</option>
              <option value="1">Rare (1/5)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="accessTier">Accès</Label>
            <select
              id="accessTier"
              name="accessTier"
              className={selectClass}
              defaultValue={lesson.accessTier}
            >
              <option value="premium">Premium</option>
              <option value="free">Gratuite</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tags">Tags</Label>
          <TagPicker catalogue={catalogue} initial={lesson.tags} />
        </div>

        <div className="flex gap-2">
          <Button type="submit" loading={pending}>
            <Save className="size-4" aria-hidden />
            Enregistrer
          </Button>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Annuler
          </Button>
        </div>
      </div>
    </form>
  )
}
