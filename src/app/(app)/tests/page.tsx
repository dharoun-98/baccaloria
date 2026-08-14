import { Flag, Lock, Target } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { requireStudent } from '@/lib/student'
import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Tests de palier' }

type MilestoneRow = {
  id: string
  title_fr: string
  description_fr: string | null
  lesson_ids: string[]
  unlock_threshold: number
  filiere_subjects: { subjects: { name_fr: string; color: string } | null } | null
}

export default async function TestsPage() {
  const student = await requireStudent()
  const supabase = await createClient()

  const { data: filiereSubjects } = await supabase
    .from('filiere_subjects')
    .select('id')
    .eq('filiere_id', student.filiereId)
    .eq('is_active', true)

  const fsIds = (filiereSubjects ?? []).map((f) => f.id)

  const { data: milestoneRows } = fsIds.length
    ? await supabase
        .from('milestones')
        .select(
          `id, title_fr, description_fr, lesson_ids, unlock_threshold,
           filiere_subjects ( subjects ( name_fr, color ) )`,
        )
        .in('filiere_subject_id', fsIds)
        .order('sort_order')
    : { data: [] }

  const milestones = (milestoneRows ?? []) as unknown as MilestoneRow[]

  // Which lessons has the student finished? Drives the unlock state.
  const { data: progressRows } = await supabase
    .from('lesson_progress')
    .select('lesson_id, state')
    .eq('user_id', student.userId)

  const done = new Set(
    (progressRows ?? []).filter((p) => p.state === 'completed').map((p) => p.lesson_id),
  )

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          Tests de palier
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-foreground-muted">
          Un palier regroupe plusieurs leçons. Termine-les, puis prouve que tu les
          maîtrises vraiment.
        </p>
      </header>

      {milestones.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="flex flex-col gap-3">
          {milestones.map((milestone) => {
            const total = milestone.lesson_ids.length
            const finished = milestone.lesson_ids.filter((id) => done.has(id)).length
            const pct = total > 0 ? (finished / total) * 100 : 0
            const unlocked = pct >= milestone.unlock_threshold
            const subject = milestone.filiere_subjects?.subjects

            return (
              <li key={milestone.id}>
                <div
                  className={cn(
                    'rounded-card border bg-surface p-5 shadow-card',
                    unlocked ? 'border-border' : 'border-border opacity-75',
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span
                      aria-hidden
                      className={cn(
                        'grid size-10 shrink-0 place-items-center rounded-xl',
                        unlocked
                          ? 'bg-primary-subtle text-primary'
                          : 'bg-surface-sunken text-foreground-subtle',
                      )}
                    >
                      {unlocked ? (
                        <Flag className="size-5" />
                      ) : (
                        <Lock className="size-5" />
                      )}
                    </span>

                    <div className="min-w-0 flex-1">
                      {subject && (
                        <p className="text-xs font-medium" style={{ color: subject.color }}>
                          {subject.name_fr}
                        </p>
                      )}
                      <h2 className="font-display font-semibold">{milestone.title_fr}</h2>
                      {milestone.description_fr && (
                        <p className="mt-1 text-sm text-foreground-muted">
                          {milestone.description_fr}
                        </p>
                      )}

                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-sunken">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            unlocked ? 'bg-primary' : 'bg-border-strong',
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="mt-1.5 text-xs text-foreground-subtle tabular-nums">
                        {finished} / {total} leçons terminées
                        {!unlocked && ` — atteins ${milestone.unlock_threshold}% pour débloquer`}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-card border border-border bg-surface p-8 text-center">
      <Target className="mx-auto size-8 text-foreground-subtle" aria-hidden />
      <p className="mt-3 font-display font-semibold">Aucun palier pour l&apos;instant</p>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-foreground-muted">
        Les tests de palier arrivent au fur et à mesure que le programme se remplit.
        En attendant, tu peux déjà te tester à la fin de chaque leçon.
      </p>
      <Link
        href="/matieres"
        className="mt-5 inline-block text-sm font-semibold text-primary hover:underline"
      >
        Voir mes matières
      </Link>
    </div>
  )
}
