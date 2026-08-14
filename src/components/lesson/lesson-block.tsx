import {
  AlertTriangle,
  BookMarked,
  FlaskConical,
  Info,
  ListOrdered,
  Sigma,
  Sparkles,
  Target,
  type LucideIcon,
} from 'lucide-react'

import { RichText } from './rich-text'

import { cn } from '@/lib/utils'

export type BlockKind =
  | 'resume'
  | 'definition'
  | 'formula'
  | 'theorem'
  | 'method'
  | 'example'
  | 'pitfall'
  | 'exam_tip'
  | 'cheatsheet'
  | 'callout'
  | 'table'
  | 'image'
  | 'video'

export type Block = {
  id: string
  kind: BlockKind
  title_fr: string | null
  content: { markdown?: string } | null
}

type Style = {
  icon: LucideIcon | null
  label: string | null
  shell: string
  accent: string
}

/**
 * Each block kind gets a distinct visual weight, so a student scanning a lesson
 * on a phone can find "the formula" or "the mistake everyone makes" without
 * reading. `pitfall` and `exam_tip` are deliberately the loudest — they are the
 * two that translate directly into marks.
 */
const STYLES: Record<BlockKind, Style> = {
  resume: { icon: null, label: null, shell: '', accent: '' },
  definition: {
    icon: BookMarked,
    label: 'Définition',
    shell: 'border border-border bg-surface',
    accent: 'text-foreground-muted',
  },
  formula: {
    icon: Sigma,
    label: 'Formule',
    shell: 'border border-brand-200 bg-primary-subtle dark:border-brand-800',
    accent: 'text-primary',
  },
  theorem: {
    icon: Sigma,
    label: 'Théorème',
    shell: 'border border-brand-200 bg-primary-subtle dark:border-brand-800',
    accent: 'text-primary',
  },
  method: {
    icon: ListOrdered,
    label: 'Méthode',
    shell: 'border border-border bg-surface-sunken',
    accent: 'text-foreground-muted',
  },
  example: {
    icon: FlaskConical,
    label: 'Exemple',
    shell: 'border border-border bg-surface',
    accent: 'text-foreground-muted',
  },
  pitfall: {
    icon: AlertTriangle,
    label: 'Erreur fréquente',
    shell: 'border border-danger/25 bg-danger/6',
    accent: 'text-danger',
  },
  exam_tip: {
    icon: Target,
    label: "Ça tombe à l'examen",
    shell: 'border border-accent-300 bg-accent-50 dark:border-accent-800 dark:bg-accent-900/25',
    accent: 'text-accent-700 dark:text-accent-300',
  },
  cheatsheet: {
    icon: Sparkles,
    label: 'Fiche mémo',
    shell: 'border-2 border-brand-300 bg-surface dark:border-brand-700',
    accent: 'text-primary',
  },
  callout: {
    icon: Info,
    label: null,
    shell: 'border border-border bg-surface',
    accent: 'text-foreground-muted',
  },
  table: { icon: null, label: null, shell: '', accent: '' },
  image: { icon: null, label: null, shell: '', accent: '' },
  video: { icon: null, label: null, shell: '', accent: '' },
}

export function LessonBlock({ block }: { block: Block }) {
  const markdown = block.content?.markdown
  if (!markdown) return null

  const style = STYLES[block.kind] ?? STYLES.callout

  // `resume` is the body text of the lesson — no chrome, just prose.
  if (block.kind === 'resume') {
    return (
      <section className="mb-6">
        {block.title_fr && (
          <h2 className="mb-3 font-display text-xl font-bold tracking-tight">
            {block.title_fr}
          </h2>
        )}
        <RichText markdown={markdown} />
      </section>
    )
  }

  const Icon = style.icon

  // Two heading registers. The kind's own label is a system chip — small,
  // uppercase, always plain text. An author-supplied title is a real heading in
  // sentence case, rendered as inline Markdown so a method can be titled with
  // the equation it solves. Uppercasing LaTeX would look broken.
  const customTitle = block.title_fr
  const label = style.label

  return (
    <section className={cn('mb-4 rounded-card p-4 sm:p-5', style.shell)}>
      {(customTitle || label) && (
        <h3
          className={cn(
            'mb-2.5 flex items-center gap-2 font-display font-semibold',
            customTitle
              ? 'text-[15px] tracking-tight'
              : 'text-sm tracking-wide uppercase',
            style.accent,
          )}
        >
          {Icon && <Icon className="size-4 shrink-0" aria-hidden />}
          {customTitle ? (
            <RichText markdown={customTitle} inline />
          ) : (
            label
          )}
        </h3>
      )}
      <RichText markdown={markdown} />
    </section>
  )
}
