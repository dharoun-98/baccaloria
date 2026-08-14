import { cn } from '@/lib/utils'

export type MindmapNode = {
  label: string
  children?: MindmapNode[]
}

export type MindmapData = {
  root?: MindmapNode
}

/**
 * Mind map as an indented, colour-coded tree rather than a radial graph.
 *
 * A radial layout looks impressive on a laptop and is unreadable on a 375px
 * phone, which is where most of these students are. A branching tree keeps the
 * hierarchy obvious at any width, stays selectable and searchable as text, and
 * prints cleanly for revision.
 */
const BRANCH_COLORS = [
  'border-brand-400 bg-brand-50 dark:bg-brand-950/40',
  'border-accent-400 bg-accent-50 dark:bg-accent-900/25',
  'border-info/50 bg-info/8',
  'border-success/50 bg-success/8',
  'border-warning/50 bg-warning/10',
  'border-danger/40 bg-danger/6',
]

export function Mindmap({ data }: { data: MindmapData }) {
  const root = data?.root
  if (!root) return null

  return (
    <div className="overflow-x-auto">
      <div className="min-w-fit">
        <div className="inline-block rounded-xl bg-primary px-4 py-2.5 font-display font-bold text-primary-foreground">
          {root.label}
        </div>

        <ul className="mt-3 space-y-3">
          {(root.children ?? []).map((branch, index) => (
            <li
              key={`${branch.label}-${index}`}
              className={cn(
                'rounded-card border-l-3 py-2.5 pr-3 pl-3.5',
                BRANCH_COLORS[index % BRANCH_COLORS.length],
              )}
            >
              <p className="font-display text-sm font-semibold">{branch.label}</p>

              {branch.children && branch.children.length > 0 && (
                <ul className="mt-2 space-y-1.5">
                  {branch.children.map((leaf, leafIndex) => (
                    <li
                      key={`${leaf.label}-${leafIndex}`}
                      className="flex gap-2 text-sm text-foreground-muted"
                    >
                      <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-current opacity-50" />
                      <span>{leaf.label}</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
