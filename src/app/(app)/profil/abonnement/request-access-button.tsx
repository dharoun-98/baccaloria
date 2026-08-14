'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'

import { requestAccess } from './actions'

import { Button } from '@/components/ui/button'

export function RequestAccessButton({
  planId,
  planName,
  highlight,
}: {
  planId: string
  planName: string
  highlight: boolean
}) {
  const [pending, startTransition] = useTransition()

  function submit() {
    startTransition(async () => {
      const result = await requestAccess(planId)

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success(`Demande enregistrée pour « ${planName} ».`, {
        description: `Ton code de référence : ${result.reference}`,
        duration: 10_000,
      })
    })
  }

  return (
    <Button
      onClick={submit}
      loading={pending}
      block
      size="lg"
      variant={highlight ? 'primary' : 'secondary'}
      className="mt-5"
    >
      Choisir cette formule
    </Button>
  )
}
