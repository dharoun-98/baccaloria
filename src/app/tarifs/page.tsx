import { ArrowLeft, Check } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { createClient } from '@/lib/supabase/server'
import { cn, formatMAD } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Tarifs',
  description:
    "Commence gratuitement. Débloque tout le programme de ta filière, les tests et les examens nationaux corrigés.",
}

type Plan = {
  id: string
  name_fr: string
  description_fr: string | null
  price_mad: number
  valid_until_exam: boolean
  duration_days: number | null
  features: string[]
}

export default async function PricingPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('plans')
    .select(
      'id, name_fr, description_fr, price_mad, valid_until_exam, duration_days, features',
    )
    .eq('is_active', true)
    .order('sort_order')

  const plans = (data ?? []) as unknown as Plan[]

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-primary font-display text-sm font-bold text-primary-foreground">
              B
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">
              Baccaloria
            </span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            Commence gratuitement
          </h1>
          <p className="mx-auto mt-3 max-w-xl leading-relaxed text-pretty text-foreground-muted">
            Des leçons offertes pour te faire une idée, sans carte bancaire. Passe au
            Premium quand tu es convaincu.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {plans.map((plan, index) => {
            const features = Array.isArray(plan.features) ? plan.features : []
            const free = Number(plan.price_mad) === 0
            const highlight = plan.valid_until_exam

            return (
              <article
                key={plan.id}
                className={cn(
                  'flex flex-col rounded-card border-2 bg-surface p-6 shadow-card',
                  highlight ? 'border-primary' : 'border-border',
                )}
              >
                {highlight && (
                  <span className="mb-3 self-start rounded-full bg-primary-subtle px-2.5 py-1 text-xs font-semibold text-primary">
                    Le plus choisi
                  </span>
                )}

                <h2 className="font-display text-lg font-bold">{plan.name_fr}</h2>

                <p className="mt-2 font-display text-3xl font-bold tabular-nums">
                  {free ? 'Gratuit' : formatMAD(Number(plan.price_mad))}
                </p>
                {!free && (
                  <p className="mt-1 text-xs text-foreground-subtle">
                    {plan.valid_until_exam
                      ? "paiement unique, valable jusqu'à l'examen"
                      : `pour ${plan.duration_days} jours`}
                  </p>
                )}

                {plan.description_fr && (
                  <p className="mt-3 text-sm leading-relaxed text-foreground-muted">
                    {plan.description_fr}
                  </p>
                )}

                <ul className="mt-5 flex flex-1 flex-col gap-2">
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

                <Link
                  href="/inscription"
                  className={cn(
                    'mt-6 inline-flex h-11 items-center justify-center rounded-xl px-5 text-[15px] font-semibold transition',
                    index === 0 || !highlight
                      ? 'border border-border bg-surface hover:bg-surface-sunken'
                      : 'bg-primary text-primary-foreground hover:bg-primary-hover',
                  )}
                >
                  {free ? 'Créer mon compte' : 'Commencer'}
                </Link>
              </article>
            )
          })}
        </div>

        <section className="mx-auto mt-12 max-w-2xl rounded-card border border-border bg-surface p-6">
          <h2 className="font-display font-semibold">Le paiement, concrètement</h2>
          <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
            Pas besoin de carte bancaire. Tu paies par virement, CashPlus, Wafacash ou
            Barid Cash, tu nous envoies le reçu sur WhatsApp avec ton code de référence,
            et ton accès est activé sous 24 h.
          </p>
        </section>

        <p className="mt-10 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground-muted hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Retour à l&apos;accueil
          </Link>
        </p>
      </main>
    </div>
  )
}
