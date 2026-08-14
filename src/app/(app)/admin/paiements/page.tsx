import { ArrowLeft, Inbox } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { PaymentCard, type PendingPayment } from './payment-card'

import { requireStudent } from '@/lib/student'
import { createClient } from '@/lib/supabase/server'
import { cn, formatMAD } from '@/lib/utils'

export const metadata: Metadata = { title: 'Paiements', robots: { index: false } }

export default async function PaymentsPage() {
  const staff = await requireStudent()
  if (!staff.isStaff) redirect('/accueil')

  const supabase = await createClient()

  const [{ data: pendingRows }, { data: recentRows }] = await Promise.all([
    supabase
      .from('payment_requests')
      .select(
        'id, reference_code, amount_mad, method, created_at, payer_name, user_id, plan_id',
      )
      .eq('status', 'pending')
      .order('created_at', { ascending: true }),
    supabase
      .from('payment_requests')
      .select('id, reference_code, amount_mad, status, reviewed_at, rejection_reason')
      .in('status', ['approved', 'rejected'])
      .order('reviewed_at', { ascending: false })
      .limit(15),
  ])

  const pending = pendingRows ?? []

  // Resolve the student and plan names in one round trip each, rather than a
  // nested select — `payment_requests` has several nullable foreign keys and
  // the relation is ambiguous to infer.
  const userIds = [...new Set(pending.map((p) => p.user_id))]
  const planIds = [...new Set(pending.map((p) => p.plan_id).filter(Boolean))]

  const [{ data: profiles }, { data: plans }] = await Promise.all([
    userIds.length
      ? supabase.from('profiles').select('id, full_name, phone').in('id', userIds)
      : Promise.resolve({ data: [] }),
    planIds.length
      ? supabase.from('plans').select('id, name_fr').in('id', planIds)
      : Promise.resolve({ data: [] }),
  ])

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))
  const planMap = new Map((plans ?? []).map((p) => [p.id, p]))

  const payments: PendingPayment[] = pending.map((p) => ({
    id: p.id,
    reference_code: p.reference_code,
    amount_mad: Number(p.amount_mad),
    method: p.method,
    created_at: p.created_at,
    payer_name: p.payer_name,
    student_name: profileMap.get(p.user_id)?.full_name ?? null,
    student_phone: profileMap.get(p.user_id)?.phone ?? null,
    plan_name: p.plan_id ? (planMap.get(p.plan_id)?.name_fr ?? null) : null,
  }))

  const total = payments.reduce((sum, p) => sum + p.amount_mad, 0)

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
      <Link
        href="/admin"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-foreground-muted hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Administration
      </Link>

      <header className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          Paiements
        </h1>
        <p className="mt-1.5 text-sm text-foreground-muted">
          {payments.length === 0
            ? 'Aucune demande en attente.'
            : `${payments.length} demande(s) en attente · ${formatMAD(total)}`}
        </p>
      </header>

      {payments.length === 0 ? (
        <div className="rounded-card border border-border bg-surface p-8 text-center">
          <Inbox className="mx-auto size-8 text-foreground-subtle" aria-hidden />
          <p className="mt-3 font-display font-semibold">File vide</p>
          <p className="mt-1.5 text-sm text-foreground-muted">
            Les nouvelles demandes d&apos;abonnement apparaîtront ici.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {payments.map((payment) => (
            <PaymentCard key={payment.id} payment={payment} />
          ))}
        </ul>
      )}

      {recentRows && recentRows.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 font-display text-sm font-semibold tracking-wide text-foreground-muted uppercase">
            Historique récent
          </h2>
          <ul className="divide-y divide-border rounded-card border border-border bg-surface px-4">
            {recentRows.map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="font-mono text-sm">{row.reference_code}</p>
                  {row.rejection_reason && (
                    <p className="truncate text-xs text-foreground-subtle">
                      {row.rejection_reason}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="font-mono text-sm tabular-nums text-foreground-muted">
                    {formatMAD(Number(row.amount_mad))}
                  </span>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-medium',
                      row.status === 'approved'
                        ? 'bg-success/12 text-success'
                        : 'bg-danger/12 text-danger',
                    )}
                  >
                    {row.status === 'approved' ? 'validé' : 'refusé'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
