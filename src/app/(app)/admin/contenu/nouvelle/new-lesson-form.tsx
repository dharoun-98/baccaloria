'use client'

import { Plus } from 'lucide-react'
import { useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'

import { createLesson } from '../lesson-actions'

import { Button } from '@/components/ui/button'
import { Field, FormError, Input, Label } from '@/components/ui/field'
import { cn } from '@/lib/utils'

export type Catalogue = {
  filieres: {
    id: string
    code: string
    name: string
    subjects: {
      filiereSubjectId: string
      subjectId: string
      name: string
      units: { id: string; title: string }[]
    }[]
  }[]
}

const selectClass =
  'h-12 w-full rounded-xl border border-border bg-surface px-3 text-base focus-visible:border-brand-400 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ring)]'

export function NewLessonForm({ catalogue }: { catalogue: Catalogue }) {
  const [filiereId, setFiliereId] = useState(catalogue.filieres[0]?.id ?? '')
  const [subjectKey, setSubjectKey] = useState('')
  const [unitId, setUnitId] = useState('')
  const [newUnit, setNewUnit] = useState('')
  const [error, setError] = useState<string | undefined>()
  const [pending, startTransition] = useTransition()

  const filiere = useMemo(
    () => catalogue.filieres.find((f) => f.id === filiereId),
    [catalogue.filieres, filiereId],
  )

  const subject = useMemo(
    () => filiere?.subjects.find((s) => s.filiereSubjectId === subjectKey),
    [filiere, subjectKey],
  )

  function submit(formData: FormData) {
    setError(undefined)
    startTransition(async () => {
      const result = await createLesson(formData)
      // A successful create redirects, so only failures return here.
      if (result?.error) {
        setError(result.error)
        toast.error(result.error)
      }
    })
  }

  return (
    <form action={submit} className="flex flex-col gap-5">
      <FormError>{error}</FormError>

      <Field label="Titre de la leçon" htmlFor="title">
        <Input
          id="title"
          name="title"
          required
          minLength={3}
          placeholder="ex. Les nombres complexes"
          autoFocus
        />
      </Field>

      <Field
        label="Sous-titre"
        htmlFor="subtitle"
        hint="Une phrase qui dit à quoi sert la leçon. Facultatif."
      >
        <Input id="subtitle" name="subtitle" placeholder="ex. Forme algébrique et module" />
      </Field>

      {/* ------------------------------------------------------- placement */}
      <fieldset className="rounded-card border border-border bg-surface-sunken p-4">
        <legend className="px-1 text-sm font-semibold">Où doit-elle apparaître ?</legend>

        <div className="mt-2 flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="filiere">Filière</Label>
            <select
              id="filiere"
              className={selectClass}
              value={filiereId}
              onChange={(e) => {
                setFiliereId(e.target.value)
                setSubjectKey('')
                setUnitId('')
              }}
            >
              {catalogue.filieres.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.code})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="filiereSubjectId">Matière</Label>
            <select
              id="filiereSubjectId"
              name="filiereSubjectId"
              className={selectClass}
              value={subjectKey}
              onChange={(e) => {
                setSubjectKey(e.target.value)
                setUnitId('')
              }}
              required
            >
              <option value="">Choisir…</option>
              {(filiere?.subjects ?? []).map((s) => (
                <option key={s.filiereSubjectId} value={s.filiereSubjectId}>
                  {s.name}
                </option>
              ))}
            </select>
            {/* The lesson belongs to the subject; placement is separate. */}
            <input type="hidden" name="subjectId" value={subject?.subjectId ?? ''} />
          </div>

          {subject && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="unitId">Chapitre</Label>
              <select
                id="unitId"
                name="unitId"
                className={selectClass}
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
              >
                <option value="">— Nouveau chapitre —</option>
                {subject.units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.title}
                  </option>
                ))}
              </select>

              {!unitId && (
                <Input
                  name="newUnitTitle"
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value)}
                  placeholder="Nom du nouveau chapitre, ex. Analyse"
                  className="mt-1.5"
                  aria-label="Nom du nouveau chapitre"
                />
              )}
            </div>
          )}
        </div>

        <p className="mt-3 text-xs leading-relaxed text-foreground-muted">
          Tu pourras ensuite ajouter cette même leçon à d&apos;autres filières sans la
          recopier — utile pour Philosophie ou Anglais, identiques partout.
        </p>
      </fieldset>

      {/* -------------------------------------------------------- metadata */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="difficulty">Difficulté</Label>
          <select id="difficulty" name="difficulty" className={selectClass} defaultValue="2">
            <option value="1">Accessible</option>
            <option value="2">Intermédiaire</option>
            <option value="3">Exigeant</option>
          </select>
        </div>

        <Field label="Durée estimée (min)" htmlFor="estMinutes">
          <Input id="estMinutes" name="estMinutes" type="number" min={1} max={180} defaultValue={15} />
        </Field>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="examFrequency">Fréquence aux examens</Label>
          <select id="examFrequency" name="examFrequency" className={selectClass} defaultValue="3">
            <option value="5">Tombe chaque année (5/5)</option>
            <option value="4">Très fréquent (4/5)</option>
            <option value="3">Fréquent (3/5)</option>
            <option value="2">Occasionnel (2/5)</option>
            <option value="1">Rare (1/5)</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="accessTier">Accès</Label>
          <select id="accessTier" name="accessTier" className={selectClass} defaultValue="premium">
            <option value="premium">Premium</option>
            <option value="free">Gratuite (vitrine)</option>
          </select>
        </div>
      </div>

      <Field
        label="Tags"
        htmlFor="tags"
        hint="Séparés par des virgules. Pour toi, pas pour les élèves — ex. démonstration, à relire, adapté de PC."
      >
        <Input id="tags" name="tags" placeholder="analyse, démonstration" />
      </Field>

      <Button type="submit" size="lg" loading={pending} block className={cn('mt-1')}>
        <Plus className="size-4" aria-hidden />
        Créer la leçon
      </Button>

      <p className="text-center text-xs text-foreground-subtle">
        Elle sera créée en brouillon. Tu ajouteras le contenu juste après.
      </p>
    </form>
  )
}
