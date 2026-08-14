import { ArrowRight, BookOpen, CalendarClock, ClipboardCheck, Flame } from 'lucide-react'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { ReadinessRing } from '@/components/progress/readiness-ring'
import { createClient } from '@/lib/supabase/server'
import { bandFromScore, daysUntil, type ReadinessBand } from '@/lib/utils'

export const metadata: Metadata = { title: 'Accueil' }

export default async function HomePage() {
  const supabase = await createClient()
  const t = await getTranslations()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/connexion')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, streak_days, xp, filiere_id')
    .eq('id', user.id)
    .single()

  const { data: readiness } = await supabase
    .from('readiness_scores')
    .select('readiness, band, coverage_pct, mastery_pct, exam_pct')
    .eq('user_id', user.id)
    .eq('scope', 'overall')
    .maybeSingle()

  // Earliest upcoming exam for this filière drives the countdown.
  const { data: nextExam } = await supabase
    .from('exam_calendar')
    .select('exam_date, is_confirmed, filiere_subjects!inner ( filiere_id )')
    .eq('filiere_subjects.filiere_id', profile?.filiere_id ?? '')
    .gte('exam_date', new Date().toISOString().slice(0, 10))
    .order('exam_date')
    .limit(1)
    .maybeSingle()

  const score = Number(readiness?.readiness ?? 0)
  const band = (readiness?.band ?? bandFromScore(score)) as ReadinessBand
  const firstName = profile?.full_name?.split(' ')[0] ?? null
  const streak = profile?.streak_days ?? 0

  const days = nextExam?.exam_date ? daysUntil(nextExam.exam_date) : null

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      {/* --------------------------------------------------------- greeting */}
      <header className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          {firstName ? `Salut ${firstName} 👋` : 'Salut 👋'}
        </h1>
        {streak > 0 && (
          <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-medium text-accent-600">
            <Flame className="size-4" aria-hidden />
            {t('profile.streak', { days: streak })}
          </p>
        )}
      </header>

      {/* -------------------------------------------------------- countdown */}
      {days !== null && (
        <Link
          href="/examens"
          className="mb-4 flex items-center gap-3 rounded-card border border-border bg-surface p-4 shadow-card transition hover:border-brand-300"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent-100 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300">
            <CalendarClock className="size-5" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-lg font-bold tabular-nums">
              {t('countdown.daysLeft', { days })}
            </span>
            <span className="block text-xs text-foreground-subtle">
              {nextExam?.is_confirmed
                ? t('countdown.confirmed')
                : t('countdown.estimated')}
            </span>
          </span>
          <ArrowRight className="size-4 shrink-0 text-foreground-subtle" aria-hidden />
        </Link>
      )}

      {/* -------------------------------------------------------- readiness */}
      <section className="mb-4 rounded-card border border-border bg-surface p-6 text-center shadow-card">
        <h2 className="mb-4 font-display text-sm font-semibold tracking-wide text-foreground-muted uppercase">
          {t('readiness.title')}
        </h2>

        <ReadinessRing value={score} band={band} />

        <p className="mt-4 font-display text-xl font-bold tracking-tight text-balance">
          {t(`readiness.band${band}Title`)}
        </p>
        <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-pretty text-foreground-muted">
          {t(`readiness.band${band}Body`)}
        </p>

        <Link
          href="/profil"
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          {t('profile.details')}
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </section>

      {/* ---------------------------------------------------- quick actions */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/matieres"
          className="group flex items-center gap-3 rounded-card border border-border bg-surface p-5 shadow-card transition hover:border-brand-300"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-subtle text-primary">
            <BookOpen className="size-5" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display font-semibold">Continuer à apprendre</span>
            <span className="block text-sm text-foreground-muted">
              Reprends là où tu t&apos;es arrêté
            </span>
          </span>
          <ArrowRight
            className="size-4 shrink-0 text-foreground-subtle transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </Link>

        <Link
          href="/examens"
          className="group flex items-center gap-3 rounded-card border border-border bg-surface p-5 shadow-card transition hover:border-brand-300"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent-100 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300">
            <ClipboardCheck className="size-5" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display font-semibold">Passer un examen blanc</span>
            <span className="block text-sm text-foreground-muted">
              Dans les conditions réelles
            </span>
          </span>
          <ArrowRight
            className="size-4 shrink-0 text-foreground-subtle transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </Link>
      </div>
    </div>
  )
}
