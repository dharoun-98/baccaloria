'use client'

import { Check, MessageCircle, X } from 'lucide-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { approvePayment, rejectPayment } from './actions'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/field'
import { formatMAD } from '@/lib/utils'

export type PendingPayment = {
  id: string
  reference_code: string
  amount_mad: number
  method: string
  created_at: string
  payer_name: string | null
  student_name: string | null
  student_phone: string | null
  plan_name: string | null
}

export function PaymentCard({ payment }: { payment: PendingPayment }) {
  const [pending, startTransition] = useTransition()
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')

  function approve() {
    startTransition(async () => {
      const result = await approvePayment(payment.id)
      if (result.error) toast.error(result.error)
      else toast.success(result.message ?? 'Paiement validé.')
    })
  }

  function reject() {
    startTransition(async () => {
      const result = await rejectPayment(payment.id, reason)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success(result.message ?? 'Paiement refusé.')
      setRejecting(false)
      setReason('')
    })
  }

  const whatsappHref = payment.student_phone
    ? `https://wa.me/${payment.student_phone.replace(/[^0-9]/g, '')}`
    : null

  return (
    <li className="rounded-card border border-border bg-surface p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-lg font-bold tracking-wider">
            {payment.reference_code}
          </p>
          <p className="mt-0.5 text-sm text-foreground-muted">
            {payment.student_name ?? 'Élève'}
            {payment.plan_name && ` · ${payment.plan_name}`}
          </p>
          <p className="mt-0.5 text-xs text-foreground-subtle">
            {payment.method} ·{' '}
            {new Date(payment.created_at).toLocaleDateString('fr-MA', {
              day: 'numeric',
              month: 'long',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>

        <p className="shrink-0 font-display text-xl font-bold tabular-nums">
          {formatMAD(Number(payment.amount_mad))}
        </p>
      </div>

      {whatsappHref && (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <MessageCircle className="size-4" aria-hidden />
          Contacter sur WhatsApp
        </a>
      )}

      {rejecting ? (
        <div className="mt-4 flex flex-col gap-2.5 border-t border-border pt-4">
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Motif du refus (visible par l'élève)"
            aria-label="Motif du refus"
          />
          <div className="flex gap-2.5">
            <Button
              variant="danger"
              onClick={reject}
              loading={pending}
              disabled={!reason.trim()}
              block
            >
              Confirmer le refus
            </Button>
            <Button variant="ghost" onClick={() => setRejecting(false)}>
              Annuler
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex gap-2.5 border-t border-border pt-4">
          <Button onClick={approve} loading={pending} block>
            <Check className="size-4" aria-hidden />
            Valider et activer
          </Button>
          <Button variant="secondary" onClick={() => setRejecting(true)}>
            <X className="size-4" aria-hidden />
            Refuser
          </Button>
        </div>
      )}

      <p className="mt-3 text-xs leading-relaxed text-foreground-subtle">
        Vérifie que le reçu correspond bien au montant et au code de référence avant
        de valider.
      </p>
    </li>
  )
}
