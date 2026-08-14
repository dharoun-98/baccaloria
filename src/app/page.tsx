import {
  ArrowRight,
  BrainCircuit,
  CalendarClock,
  ClipboardCheck,
  FileText,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react'
import Link from 'next/link'

import { daysUntil } from '@/lib/utils'

/**
 * Placeholder until exam_calendar is seeded and queried. The real countdown
 * reads the confirmed MEN date for the student's own filière.
 */
const PROVISIONAL_EXAM_DATE = '2027-06-07'

const PILLARS = [
  {
    icon: BrainCircuit,
    title: 'Apprendre',
    body: "Chaque leçon réduite à l'essentiel : un résumé clair, une fiche mémo, une carte mentale et les erreurs qui coûtent des points. Pas le manuel — tu l'as déjà.",
  },
  {
    icon: Target,
    title: "S'entraîner",
    body: "Un quiz à la fin de chaque leçon, puis des tests de palier quand tu franchis une étape. Les questions changent à chaque tentative, tirées d'une large banque d'exercices.",
  },
  {
    icon: ClipboardCheck,
    title: 'Simuler',
    body: "Les examens nationaux des 5 dernières années, chronométrés, dans les conditions réelles. Corrigé détaillé après coup, pour apprendre de chaque erreur.",
  },
]

const FILIERES = [
  {
    code: 'PC',
    name: 'Sciences Physiques',
    subjects: 'Maths · Physique-Chimie · SVT · Philosophie · Anglais',
  },
  {
    code: 'SE',
    name: 'Sciences Économiques',
    subjects: 'Économie & Statistiques · Comptabilité · Maths · Philosophie · Anglais',
  },
  {
    code: 'SGC',
    name: 'Sciences de Gestion Comptable',
    subjects: 'Comptabilité & Maths financières · Économie · Maths · Philosophie · Anglais',
  },
]

export default function LandingPage() {
  const days = daysUntil(PROVISIONAL_EXAM_DATE)

  return (
    <div className="min-h-dvh bg-background">
      {/* ------------------------------------------------------------ nav -- */}
      <header className="sticky top-0 z-50 border-b border-border/80 bg-surface/80 backdrop-blur-md">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-primary font-display text-sm font-bold text-primary-foreground">
              B
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">
              Baccaloria
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/connexion"
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-foreground-muted transition hover:bg-surface-sunken hover:text-foreground"
            >
              Se connecter
            </Link>
            <Link
              href="/inscription"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary-hover"
            >
              Commencer
            </Link>
          </div>
        </nav>
      </header>

      {/* ---------------------------------------------------------- hero -- */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-40 h-80 bg-gradient-to-b from-brand-100/60 to-transparent blur-3xl dark:from-brand-950/40"
        />

        <div className="relative mx-auto max-w-6xl px-4 pt-16 pb-20 sm:px-6 sm:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-medium text-foreground-muted shadow-sm">
              <CalendarClock className="size-3.5 text-accent-600" aria-hidden />
              Examen National dans {days} jours
            </span>

            <h1 className="mt-6 font-display text-4xl leading-[1.08] font-bold tracking-tight text-balance sm:text-6xl">
              Pas tout le programme.
              <span className="block text-primary">Juste ce qui compte.</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-pretty text-foreground-muted">
              Des leçons résumées, des fiches mémo, des cartes mentales et les examens
              nationaux corrigés — organisés par filière, pour que tu arrives au Bac
              préparé, chronomètre en main et sans mauvaise surprise.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/inscription"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 font-semibold text-primary-foreground shadow-card transition hover:bg-primary-hover sm:w-auto"
              >
                Créer mon compte gratuit
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
              <Link
                href="#filieres"
                className="inline-flex w-full items-center justify-center rounded-xl border border-border bg-surface px-6 py-3.5 font-semibold transition hover:bg-surface-sunken sm:w-auto"
              >
                Voir les filières
              </Link>
            </div>

            <p className="mt-4 text-sm text-foreground-subtle">
              Gratuit pour démarrer — aucune carte bancaire demandée.
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- pillars -- */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {PILLARS.map(({ icon: Icon, title, body }) => (
            <article
              key={title}
              className="rounded-card border border-border bg-surface p-6 shadow-card"
            >
              <span className="grid size-11 place-items-center rounded-xl bg-primary-subtle text-primary">
                <Icon className="size-5" aria-hidden />
              </span>
              <h2 className="mt-4 font-display text-lg font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-foreground-muted">{body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------- progression -- */}
      <section className="border-y border-border bg-surface-sunken/60">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-accent-600">
              <TrendingUp className="size-4" aria-hidden />
              Ta progression, visible
            </span>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              Un score qui te dit la vérité
            </h2>
            <p className="mt-4 leading-relaxed text-foreground-muted">
              Ton niveau de préparation est calculé à partir de ce que tu as réellement
              fait : les leçons couvertes, tes résultats aux quiz, tes examens blancs, ta
              gestion du temps et ce que tu as gardé en mémoire.
            </p>
            <p className="mt-4 leading-relaxed text-foreground-muted">
              Le tout <strong className="font-semibold text-foreground">pondéré par les
              coefficients</strong> — parce qu&apos;un point gagné en Maths ne vaut pas un
              point gagné en Anglais. Tu sais donc toujours où travailler pour gagner le
              plus.
            </p>
          </div>

          <div className="rounded-card border border-border bg-surface p-6 shadow-card">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium text-foreground-muted">
                Niveau de préparation
              </span>
              <span className="font-display text-2xl font-bold text-band-3">72%</span>
            </div>

            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-surface-sunken">
              <div
                className="h-full rounded-full bg-band-3 transition-[width] duration-700"
                style={{ width: '72%' }}
              />
            </div>
            <p className="mt-3 text-sm font-medium">Tu y es presque !</p>

            <dl className="mt-6 space-y-3 border-t border-border pt-5">
              {[
                ['Couverture du programme', 81],
                ['Maîtrise (quiz & tests)', 74],
                ['Examens blancs', 65],
                ['Gestion du temps', 58],
              ].map(([label, value]) => (
                <div key={label as string} className="flex items-center gap-3">
                  <dt className="w-44 shrink-0 text-xs text-foreground-muted">{label}</dt>
                  <dd className="flex flex-1 items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-sunken">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${value}%` }}
                      />
                    </div>
                    <span className="w-9 text-right font-mono text-xs tabular-nums text-foreground-muted">
                      {value}%
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ filieres -- */}
      <section id="filieres" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Chaque filière, son programme
          </h2>
          <p className="mt-3 leading-relaxed text-foreground-muted">
            Une même matière ne se travaille pas de la même façon selon la filière. Tu ne
            vois que ton programme, avec les coefficients qui sont vraiment les tiens.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {FILIERES.map((f) => (
            <article
              key={f.code}
              className="group rounded-card border border-border bg-surface p-6 shadow-card transition hover:border-brand-300"
            >
              <span className="inline-flex rounded-lg bg-primary-subtle px-2.5 py-1 font-mono text-xs font-bold text-primary">
                {f.code}
              </span>
              <h3 className="mt-3 font-display text-lg font-semibold">{f.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
                {f.subjects}
              </p>
            </article>
          ))}
        </div>

        <p className="mt-6 flex items-center gap-2 text-sm text-foreground-subtle">
          <Sparkles className="size-4 shrink-0 text-accent-500" aria-hidden />
          SVT, Sciences Maths et les filières Techniques arrivent ensuite.
        </p>
      </section>

      {/* ----------------------------------------------------------- cta -- */}
      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="rounded-card border border-brand-200 bg-primary-subtle p-10 text-center dark:border-brand-800">
          <FileText className="mx-auto size-8 text-primary" aria-hidden />
          <h2 className="mt-4 font-display text-2xl font-bold tracking-tight text-balance sm:text-3xl">
            Prêt·e à relever le défi ?
          </h2>
          <p className="mx-auto mt-3 max-w-xl leading-relaxed text-pretty text-foreground-muted">
            Commence gratuitement, découvre tes premières leçons, et vois où tu en es
            vraiment.
          </p>
          <Link
            href="/inscription"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 font-semibold text-primary-foreground shadow-card transition hover:bg-primary-hover"
          >
            Je commence maintenant
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </section>

      {/* -------------------------------------------------------- footer -- */}
      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-foreground-subtle sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} Baccaloria — Fait au Maroc.</p>
          <nav className="flex gap-5">
            <Link href="/tarifs" className="transition hover:text-foreground">
              Tarifs
            </Link>
            <Link href="/conditions" className="transition hover:text-foreground">
              Conditions
            </Link>
            <Link href="/confidentialite" className="transition hover:text-foreground">
              Confidentialité
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
