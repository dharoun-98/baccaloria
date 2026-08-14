import { Award, Flame, LogOut, Shield, Target, TrendingUp, Zap } from 'lucide-react'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

import { signOut } from '@/app/(auth)/actions'
import { ReadinessRing } from '@/components/progress/readiness-ring'
import { requireStudent } from '@/lib/student'
import { createClient } from '@/lib/supabase/server'
import { bandFromScore, cn, initials, type ReadinessBand } from '@/lib/utils'

export const metadata: Metadata = { title: 'Mon profil' }

const ROLE_LABEL: Record<string, string> = {
  student: 'Élève',
  teacher: 'Enseignant',
  editor: 'Éditeur',
  admin: 'Administrateur',
}

const ROLE_STYLE: Record<string, string> = {
  student: 'bg-surface-sunken text-foreground-muted',
  teacher: 'bg-info/12 text-info',
  editor: 'bg-info/12 text-info',
  admin: 'bg-accent-100 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300',
}

type SubjectScore = {
  filiere_subject_id: string
  readiness: number
  coverage_pct: number
  mastery_pct: number
  exam_pct: number
  name: string
  color: string
  coefficient: number
}

export default async function ProfilePage() {
  const student = await requireStudent()
  const supabase = await createClient()
  const t = await getTranslations()

  const [{ data: profile }, { data: scores }, { data: attempts }, { data: subscription }] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('full_name, xp, streak_days, longest_streak, school, city, role')
        .eq('id', student.userId)
        .single(),
      supabase
        .from('readiness_scores')
        .select(
          'scope, filiere_subject_id, readiness, band, coverage_pct, mastery_pct, exam_pct, timing_pct, retention_pct',
        )
        .eq('user_id', student.userId),
      supabase
        .from('attempts')
        .select('id, percentage, submitted_at, assessment_id')
        .eq('user_id', student.userId)
        .eq('state', 'graded')
        .order('submitted_at', { ascending: false })
        .limit(5),
      supabase
        .from('subscriptions')
        .select('status, ends_at')
        .eq('user_id', student.userId)
        .eq('status', 'active')
        .maybeSingle(),
    ])

  const overall = (scores ?? []).find((s) => s.scope === 'overall')
  const perSubject = (scores ?? []).filter((s) => s.scope === 'subject')

  // Join the per-subject scores to their subject names and coefficients.
  const { data: fsRows } = await supabase
    .from('filiere_subjects')
    .select('id, coefficient, subjects ( name_fr, color )')
    .eq('filiere_id', student.filiereId)
    .eq('is_active', true)
    .order('sort_order')

  const fsMap = new Map(
    ((fsRows ?? []) as unknown as {
      id: string
      coefficient: number
      subjects: { name_fr: string; color: string } | null
    }[]).map((r) => [r.id, r]),
  )

  const subjectScores: SubjectScore[] = perSubject
    .map((s) => {
      const fs = fsMap.get(s.filiere_subject_id as string)
      if (!fs?.subjects) return null
      return {
        filiere_subject_id: s.filiere_subject_id as string,
        readiness: Number(s.readiness),
        coverage_pct: Number(s.coverage_pct),
        mastery_pct: Number(s.mastery_pct),
        exam_pct: Number(s.exam_pct),
        name: fs.subjects.name_fr,
        color: fs.subjects.color,
        coefficient: Number(fs.coefficient),
      }
    })
    .filter((s): s is SubjectScore => s !== null)

  // Where the marks actually are: a weak subject with a high coefficient is
  // worth far more than a weak one with a low coefficient. This is the whole
  // "revise this first" promise, made arithmetic.
  const priority = [...subjectScores].sort(
    (a, b) =>
      b.coefficient * (100 - b.readiness) - a.coefficient * (100 - a.readiness),
  )[0]

  const strongest = [...subjectScores].sort((a, b) => b.readiness - a.readiness)[0]

  const score = Number(overall?.readiness ?? 0)
  const band = (overall?.band ?? bandFromScore(score)) as ReadinessBand
  const streak = profile?.streak_days ?? 0

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      {/* --------------------------------------------------------- header */}
      <header className="mb-6 flex items-center gap-4">
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-primary-subtle font-display text-lg font-bold text-primary">
          {initials(profile?.full_name)}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-xl font-bold tracking-tight sm:text-2xl">
            {profile?.full_name ?? 'Mon profil'}
          </h1>

          {/* The account type is stated plainly on every profile, so it can be
              checked on someone else's screen rather than taken on trust. */}
          <p className="mt-1 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-semibold',
                ROLE_STYLE[profile?.role ?? 'student'] ?? ROLE_STYLE.student,
              )}
            >
              {ROLE_LABEL[profile?.role ?? 'student'] ?? 'Élève'}
            </span>
          </p>

          <p className="mt-1.5 flex flex-wrap items-center gap-x-3 text-sm text-foreground-muted">
            <span className="inline-flex items-center gap-1.5">
              <Zap className="size-3.5 text-accent-600" aria-hidden />
              {profile?.xp ?? 0} XP
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Flame className="size-3.5 text-accent-600" aria-hidden />
              {t('profile.streak', { days: streak })}
            </span>
          </p>
        </div>
      </header>

      {/* Staff-only. The bottom tab bar has no room for a sixth item, so on a
          phone this is the only route into the admin area — and it is simply
          absent for students rather than shown-and-blocked. */}
      {student.isStaff && (
        <Link
          href="/admin"
          className="mb-4 flex items-center gap-3 rounded-card border-2 border-accent-300 bg-accent-50 p-4 transition hover:border-accent-400 dark:border-accent-800 dark:bg-accent-900/25"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-100 text-accent-700 dark:bg-accent-900/50 dark:text-accent-300">
            <Shield className="size-5" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display font-semibold">Administration</span>
            <span className="block text-sm text-foreground-muted">
              Paiements, contenu et statistiques
            </span>
          </span>
        </Link>
      )}

      {/* ------------------------------------------------------ readiness */}
      <section className="mb-4 rounded-card border border-border bg-surface p-6 text-center shadow-card">
        <ReadinessRing value={score} band={band} />
        <p className="mt-4 font-display text-lg font-bold tracking-tight">
          {t(`readiness.band${band}Title`)}
        </p>
        <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-foreground-muted">
          {t(`readiness.band${band}Body`)}
        </p>

        {overall && (
          <dl className="mt-6 space-y-2.5 border-t border-border pt-5 text-left">
            {(
              [
                ['readiness.coverage', overall.coverage_pct],
                ['readiness.mastery', overall.mastery_pct],
                ['readiness.exam', overall.exam_pct],
                ['readiness.timing', overall.timing_pct],
                ['readiness.retention', overall.retention_pct],
              ] as const
            ).map(([key, value]) => (
              <div key={key} className="flex items-center gap-3">
                <dt className="w-40 shrink-0 text-xs text-foreground-muted">{t(key)}</dt>
                <dd className="flex flex-1 items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-sunken">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.round(Number(value))}%` }}
                    />
                  </div>
                  <span className="w-9 text-right font-mono text-xs text-foreground-muted tabular-nums">
                    {Math.round(Number(value))}%
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      {/* -------------------------------------------------------- insight */}
      {priority && (
        <section className="mb-4 rounded-card border border-accent-300 bg-accent-50 p-5 dark:border-accent-800 dark:bg-accent-900/25">
          <h2 className="flex items-center gap-2 font-display text-sm font-semibold tracking-wide text-accent-700 uppercase dark:text-accent-300">
            <Target className="size-4" aria-hidden />
            À travailler en priorité
          </h2>
          <p className="mt-2 font-display text-lg font-bold">{priority.name}</p>
          <p className="mt-1 text-sm leading-relaxed text-foreground-muted">
            Coefficient {priority.coefficient} et {Math.round(priority.readiness)} % de
            préparation. C&apos;est ici que tu peux gagner le plus de points au total —
            pas forcément la matière où tu es le plus faible, mais celle où l&apos;effort
            rapporte le plus.
          </p>
          {strongest && strongest.name !== priority.name && (
            <p className="mt-3 border-t border-accent-200 pt-3 text-sm text-foreground-muted dark:border-accent-800">
              Ton point fort :{' '}
              <strong className="font-semibold text-foreground">{strongest.name}</strong> (
              {Math.round(strongest.readiness)} %)
            </p>
          )}
        </section>
      )}

      {/* ------------------------------------------------- per-subject */}
      {subjectScores.length > 0 && (
        <section className="mb-4 rounded-card border border-border bg-surface p-5 shadow-card">
          <h2 className="mb-4 flex items-center gap-2 font-display text-sm font-semibold tracking-wide text-foreground-muted uppercase">
            <TrendingUp className="size-4" aria-hidden />
            Par matière
          </h2>
          <ul className="flex flex-col gap-3.5">
            {subjectScores.map((s) => (
              <li key={s.filiere_subject_id}>
                <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                  <span className="truncate font-medium">{s.name}</span>
                  <span className="shrink-0 font-mono text-xs text-foreground-muted tabular-nums">
                    coef {s.coefficient} · {Math.round(s.readiness)}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-sunken">
                  <div
                    className="h-full rounded-full transition-[width] duration-700"
                    style={{
                      width: `${Math.max(2, Math.round(s.readiness))}%`,
                      backgroundColor: s.color,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ------------------------------------------------------- attempts */}
      {attempts && attempts.length > 0 && (
        <section className="mb-4 rounded-card border border-border bg-surface p-5 shadow-card">
          <h2 className="mb-3 font-display text-sm font-semibold tracking-wide text-foreground-muted uppercase">
            Derniers quiz
          </h2>
          <ul className="flex flex-col divide-y divide-border">
            {attempts.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="text-sm text-foreground-muted">
                  {a.submitted_at
                    ? new Date(a.submitted_at).toLocaleDateString('fr-MA', {
                        day: 'numeric',
                        month: 'short',
                      })
                    : '—'}
                </span>
                <span
                  className={cn(
                    'font-mono text-sm font-bold tabular-nums',
                    Number(a.percentage) >= 60 ? 'text-success' : 'text-danger',
                  )}
                >
                  {Math.round(Number(a.percentage))}%
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* --------------------------------------------------- subscription */}
      <section className="mb-4 rounded-card border border-border bg-surface p-5 shadow-card">
        <h2 className="mb-2 flex items-center gap-2 font-display text-sm font-semibold tracking-wide text-foreground-muted uppercase">
          <Award className="size-4" aria-hidden />
          Mon abonnement
        </h2>
        {subscription ? (
          <p className="text-sm">
            <span className="font-semibold text-success">Premium actif</span>
            {subscription.ends_at && (
              <span className="text-foreground-muted">
                {' '}
                — valable jusqu&apos;au{' '}
                {new Date(subscription.ends_at).toLocaleDateString('fr-MA')}
              </span>
            )}
          </p>
        ) : (
          <p className="text-sm text-foreground-muted">
            Tu utilises la version gratuite. Les leçons offertes et leurs quiz restent
            accessibles sans limite.
          </p>
        )}
      </section>

      <form action={signOut}>
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface px-5 py-3 text-sm font-semibold text-foreground-muted transition hover:bg-surface-sunken hover:text-foreground"
        >
          <LogOut className="size-4" aria-hidden />
          Se déconnecter
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-foreground-subtle">
        <Link href="/matieres" className="hover:text-foreground-muted">
          Retour aux matières
        </Link>
      </p>
    </div>
  )
}
