'use client'

import { Check, CircleCheck } from 'lucide-react'
import { useTransition } from 'react'
import { toast } from 'sonner'

import { setLessonDone } from '../../actions'

import { Button } from '@/components/ui/button'

export function DoneButton({
  lessonId,
  initialDone,
}: {
  lessonId: string
  initialDone: boolean
}) {
  const [pending, startTransition] = useTransition()

  function toggle() {
    startTransition(async () => {
      const next = !initialDone
      const result = await setLessonDone(lessonId, next)

      if (result?.error) {
        toast.error(result.error)
        return
      }

      toast.success(
        next ? 'Leçon terminée — ta progression a été mise à jour.' : 'Leçon rouverte.',
      )
    })
  }

  return (
    <Button
      onClick={toggle}
      loading={pending}
      block
      size="lg"
      variant={initialDone ? 'secondary' : 'primary'}
    >
      {initialDone ? (
        <>
          <CircleCheck className="size-4" aria-hidden />
          Terminée
        </>
      ) : (
        <>
          <Check className="size-4" aria-hidden />
          Marquer comme terminée
        </>
      )}
    </Button>
  )
}
