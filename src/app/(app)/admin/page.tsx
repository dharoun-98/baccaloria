import { AlertTriangle, BookOpen, CreditCard, Users } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { requireStudent } from '@/lib/student'
import { createClient } from '@/lib/supabase/server'
import { formatMAD } from '@/lib/utils'

export const metadata: Metadata = { title: 'Administration', robots: { index: false } }

export default async function AdminPage() {
  const student = await requireStudent()

  // The proxy already blocks non-staff, and RLS blocks the data regardless.
  // This is the third layer, and the cheapest one to reason about.
  if (!student.isStaff) redirect('/accueil')

  const supabase = await createClient()

  const [
    { count: pendingPayments },
    { count: activeSubs },
    { count: students },
    { count: publishedLessons },
    { count: inReview },
    { count: unverifiedCoefficients },
  ] = await Promise.all([
    supabase
      .from('payment_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active'),
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'student'),
    supabase
      .from('lessons')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published'),
    supabase
      .from('lessons')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'in_review'),
    supabase
      .from('filiere_subjects')
      .select('*', { count: 'exact', head: true })
      .eq('coefficient_verified', false),
  ])

  const { data: pendingRows } = await supabase
    .from('payment_requests')
    .select('id, reference_code, amount_mad, method, created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
        Administration
      </h1>
      <p className="mt-1.5 text-sm text-foreground-muted">
        Vue d&apos;ensemble de la plateforme.
      </p>

      {/* ------------------------------------------------------- warnings */}
      {(unverifiedCoefficients ?? 0) > 0 && (
        <div className="mt-5 rounded-card border-2 border-accent-300 bg-accent-50 p-4 dark:border-accent-800 dark:bg-accent-900/25">
          <h2 className="flex items-center gap-2 font-display font-semibold">
            <AlertTriangle className="size-4 text-accent-600" aria-hidden />
            {unverifiedCoefficients} coefficient(s) non vérifié(s)
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-foreground-muted">
            Les coefficients pilotent le score de préparation <em>et</em> le conseil
            « travaille ça en priorité ». Tant qu&apos;ils ne sont pas confrontés à
            l&apos;arrêté officiel du Ministère, ces deux fonctions peuvent induire les
            élèves en erreur.
          </p>
        </div>
      )}

      {/* ---------------------------------------------------------- stats */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Paiements en attente', value: pendingPayments ?? 0, icon: CreditCard },
          { label: 'Abonnements actifs', value: activeSubs ?? 0, icon: CreditCard },
          { label: 'Élèves inscrits', value: students ?? 0, icon: Users },
          { label: 'Leçons publiées', value: publishedLessons ?? 0, icon: BookOpen },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-card border border-border bg-surface p-4 shadow-card"
          >
            <Icon className="size-4 text-foreground-subtle" aria-hidden />
            <p className="mt-2 font-display text-2xl font-bold tabular-nums">{value}</p>
            <p className="mt-0.5 text-xs leading-snug text-foreground-muted">{label}</p>
          </div>
        ))}
      </div>

      {/* -------------------------------------------------- payment queue */}
      <section className="mt-6 rounded-card border border-border bg-surface p-5 shadow-card">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display font-semibold">File des paiements</h2>
          <Link
            href="/admin/paiements"
            className="text-sm font-semibold text-primary hover:underline"
          >
            Traiter la file
          </Link>
        </div>

        {pendingRows && pendingRows.length > 0 ? (
          <ul className="mt-3 flex flex-col divide-y divide-border">
            {pendingRows.map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="font-mono text-sm font-bold">{row.reference_code}</p>
                  <p className="text-xs text-foreground-subtle">
                    {row.method} ·{' '}
                    {new Date(row.created_at).toLocaleDateString('fr-MA', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                </div>
                <p className="shrink-0 font-mono text-sm tabular-nums">
                  {formatMAD(Number(row.amount_mad))}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-foreground-muted">
            Aucun paiement en attente.
          </p>
        )}
      </section>

      {/* --------------------------------------------------------- to do */}
      <section className="mt-6 rounded-card border border-border bg-surface p-5 shadow-card">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display font-semibold">Contenu</h2>
          <Link
            href="/admin/contenu"
            className="text-sm font-semibold text-primary hover:underline"
          >
            Relire et publier
          </Link>
        </div>
        <p className="mt-1.5 text-sm text-foreground-muted">
          {publishedLessons ?? 0} leçon(s) publiée(s)
          {(inReview ?? 0) > 0 && ` · ${inReview} en attente de relecture`}
        </p>
      </section>

      <section className="mt-4 rounded-card border border-border bg-surface p-5 shadow-card">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display font-semibold">Examens nationaux</h2>
          <Link
            href="/admin/examens"
            className="text-sm font-semibold text-primary hover:underline"
          >
            Rédiger les corrigés
          </Link>
        </div>
        <p className="mt-1.5 text-sm text-foreground-muted">
          Découper les sujets en exercices, écrire les corrigés, publier.
        </p>
      </section>

      <section className="mt-4 rounded-card border-2 border-dashed border-border bg-surface p-5">
        <h2 className="font-display font-semibold">Pas encore construit</h2>
        <ul className="mt-2.5 list-disc pl-5 text-sm text-foreground-muted [&>li]:mt-1">
          <li>Éditeur de la banque de questions</li>
          <li>Statistiques d&apos;usage et de revenus</li>
        </ul>
      </section>
    </div>
  )
}
