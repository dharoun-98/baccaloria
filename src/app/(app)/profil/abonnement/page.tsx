import { Check, Clock, MessageCircle } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { RequestAccessButton } from './request-access-button'

import { requireStudent } from '@/lib/student'
import { createClient } from '@/lib/supabase/server'
import { cn, formatMAD } from '@/lib/utils'

export const metadata: Metadata = { title: 'Mon abonnement' }

type Plan = {
  id: string
  slug: string
  name_fr: string
  description_fr: string | null
  price_mad: number
  duration_days: number | null
  valid_until_exam: boolean
  features: string[]
}

export default async function SubscriptionPage() {
  const student = await requireStudent()
  const supabase = await createClient()

  const [{ data: planRows }, { data: subscription }, { data: pending }] =
    await Promise.all([
      supabase
        .from('plans')
        .select(
          'id, slug, name_fr, description_fr, price_mad, duration_days, valid_until_exam, features',
        )
        .eq('is_active', true)
        .order('sort_order'),
      supabase
        .from('subscriptions')
        .select('status, ends_at')
        .eq('user_id', student.userId)
        .eq('status', 'active')
        .maybeSingle(),
      supabase
        .from('payment_requests')
        .select('reference_code, status, amount_mad, created_at')
        .eq('user_id', student.userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .maybeSingle(),
    ])

  const plans = ((planRows ?? []) as unknown as Plan[]).filter(
    (p) => Number(p.price_mad) > 0,
  )

  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
        Mon abonnement
      </h1>

      {subscription ? (
        <p className="mt-3 rounded-card border border-success/30 bg-success/8 p-4 text-sm">
          <span className="font-semibold text-success">Premium actif.</span>{' '}
          {subscription.ends_at
            ? `Valable jusqu'au ${new Date(subscription.ends_at).toLocaleDateString('fr-MA')}.`
            : "Valable jusqu'à ton examen."}
        </p>
      ) : (
        <p className="mt-1.5 text-sm leading-relaxed text-foreground-muted">
          Tu utilises la version gratuite. Débloque tout le programme, les tests de
          palier et les examens corrigés.
        </p>
      )}

      {/* ------------------------------------------------ pending request */}
      {pending && (
        <section className="mt-5 rounded-card border-2 border-accent-300 bg-accent-50 p-5 dark:border-accent-800 dark:bg-accent-900/25">
          <h2 className="flex items-center gap-2 font-display font-semibold">
            <Clock className="size-4 text-accent-600" aria-hidden />
            Paiement en attente de vérification
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
            Nous avons bien enregistré ta demande. Envoie-nous le reçu sur WhatsApp
            avec ton code de référence si ce n&apos;est pas déjà fait — ton accès est
            activé sous 24 h.
          </p>
          <p className="mt-3 text-xs font-medium text-foreground-muted uppercase">
            Ton code de référence
          </p>
          <p className="mt-1 font-mono text-2xl font-bold tracking-wider">
            {pending.reference_code}
          </p>
        </section>
      )}

      {/* ------------------------------------------------------- how it works */}
      {!subscription && (
        <section className="mt-6 rounded-card border border-border bg-surface p-5 shadow-card">
          <h2 className="font-display font-semibold">Comment ça marche</h2>
          <ol className="mt-3 flex flex-col gap-3 text-sm">
            {[
              'Choisis ta formule ci-dessous — tu reçois un code de référence.',
              'Paie par virement bancaire, CashPlus, Wafacash ou Barid Cash.',
              'Envoie-nous le reçu sur WhatsApp en indiquant ton code.',
              'Ton accès Premium est activé sous 24 h.',
            ].map((step, i) => (
              <li key={step} className="flex gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary-subtle font-mono text-xs font-bold text-primary">
                  {i + 1}
                </span>
                <span className="text-foreground-muted">{step}</span>
              </li>
            ))}
          </ol>

          {whatsapp && (
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              <MessageCircle className="size-4" aria-hidden />
              Nous écrire sur WhatsApp
            </a>
          )}
        </section>
      )}

      {/* -------------------------------------------------------------- plans */}
      {!subscription && plans.length > 0 && (
        <section className="mt-6 flex flex-col gap-4">
          {plans.map((plan, index) => {
            const features = Array.isArray(plan.features) ? plan.features : []
            const highlight = index === 0

            return (
              <article
                key={plan.id}
                className={cn(
                  'rounded-card border-2 bg-surface p-5 shadow-card',
                  highlight ? 'border-primary' : 'border-border',
                )}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="font-display text-lg font-bold">{plan.name_fr}</h2>
                  <p className="shrink-0 font-display text-xl font-bold tabular-nums">
                    {formatMAD(Number(plan.price_mad))}
                  </p>
                </div>

                {plan.description_fr && (
                  <p className="mt-1 text-sm text-foreground-muted">
                    {plan.description_fr}
                  </p>
                )}

                <ul className="mt-4 flex flex-col gap-1.5">
                  {features.map((feature) => (
                    <li key={feature} className="flex gap-2 text-sm">
                      <Check
                        className="mt-0.5 size-4 shrink-0 text-primary"
                        strokeWidth={2.5}
                        aria-hidden
                      />
                      <span className="text-foreground-muted">{feature}</span>
                    </li>
                  ))}
                </ul>

                {!pending && (
                  <RequestAccessButton
                    planId={plan.id}
                    planName={plan.name_fr}
                    highlight={highlight}
                  />
                )}
              </article>
            )
          })}
        </section>
      )}

      <p className="mt-8 text-center text-xs text-foreground-subtle">
        <Link href="/profil" className="hover:text-foreground-muted">
          Retour à mon profil
        </Link>
      </p>
    </div>
  )
}
