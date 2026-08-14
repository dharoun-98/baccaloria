'use client'

import { CircleCheck, Plus, Undo2 } from 'lucide-react'
import { useTransition } from 'react'
import { toast } from 'sonner'

import { addBlock, publishLesson, unpublishLesson } from '../actions'

import { Button } from '@/components/ui/button'

const KINDS = [
  ['resume', "L'essentiel"],
  ['definition', 'Définition'],
  ['formula', 'Formule'],
  ['theorem', 'Théorème'],
  ['method', 'Méthode'],
  ['example', 'Exemple'],
  ['pitfall', 'Erreur fréquente'],
  ['exam_tip', "Ça tombe à l'examen"],
  ['cheatsheet', 'Fiche mémo'],
  ['callout', 'Remarque'],
] as const

export function PublishControls({
  lessonId,
  status,
  blockCount,
}: {
  lessonId: string
  status: string
  blockCount: number
}) {
  const [pending, startTransition] = useTransition()
  const published = status === 'published'

  function publish() {
    startTransition(async () => {
      const result = await publishLesson(lessonId)
      if (result.error) toast.error(result.error)
      else toast.success('Leçon publiée — elle est visible par les élèves.')
    })
  }

  function unpublish() {
    startTransition(async () => {
      const result = await unpublishLesson(lessonId)
      if (result.error) toast.error(result.error)
      else toast.success('Leçon retirée. Les élèves ne la voient plus.')
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {published ? (
        <Button variant="secondary" onClick={unpublish} loading={pending}>
          <Undo2 className="size-4" aria-hidden />
          Dépublier
        </Button>
      ) : (
        <Button onClick={publish} loading={pending}>
          <CircleCheck className="size-4" aria-hidden />
          Valider et publier
        </Button>
      )}

      <details className="relative">
        <summary className="inline-flex h-11 cursor-pointer list-none items-center gap-2 rounded-xl border border-border bg-surface px-4 text-[15px] font-semibold transition hover:bg-surface-sunken">
          <Plus className="size-4" aria-hidden />
          Ajouter un bloc
        </summary>
        <div className="absolute z-20 mt-1 w-56 rounded-xl border border-border bg-surface p-1 shadow-pop">
          {KINDS.map(([kind, label]) => (
            <button
              key={kind}
              type="button"
              onClick={() =>
                startTransition(async () => {
                  const result = await addBlock(lessonId, kind, blockCount)
                  if (result.error) toast.error(result.error)
                  else toast.success(`Bloc « ${label} » ajouté.`)
                })
              }
              className="block w-full rounded-lg px-3 py-2 text-left text-sm transition hover:bg-surface-sunken"
            >
              {label}
            </button>
          ))}
        </div>
      </details>
    </div>
  )
}
