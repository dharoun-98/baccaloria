import 'katex/dist/katex.min.css'

import Markdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'

import { cn } from '@/lib/utils'

/**
 * Puts every display-math delimiter on its own line.
 *
 * remark-math only produces a *block* math node when `$$` sits alone on a line.
 * Written any other way it degrades silently, in two different ways:
 *
 *   $$a = b \qquad        →  raw LaTeX printed as text; the formula is
 *   c = d$$                  simply wrong on screen, with no error anywhere
 *
 *   $$a = b$$             →  parsed as *inline* math: small, left-aligned,
 *                            not the centred display formula intended
 *
 * Both are silent, and neither is obvious when skim-checking a page. Lessons
 * are written by teachers and drafted by a model, so normalising here is far
 * more reliable than a formatting rule nobody will remember.
 *
 * `$$` unambiguously means display math, so splitting the surrounding paragraph
 * is the correct result even mid-sentence. Inline maths uses single `$`, which
 * this deliberately does not touch.
 */
function normalizeDisplayMath(markdown: string): string {
  return markdown.replace(
    /\$\$([\s\S]*?)\$\$/g,
    (_match, inner: string) => `\n\n$$\n${inner.trim()}\n$$\n\n`,
  )
}

/**
 * Renders a lesson block's Markdown + LaTeX.
 *
 * Content is author-supplied and passes through the editorial review workflow,
 * so no raw HTML is enabled — react-markdown ignores HTML unless rehype-raw is
 * added, and it deliberately is not.
 */
export function RichText({
  markdown,
  className,
  inline = false,
}: {
  markdown: string
  className?: string
  /** Drops the block wrapper and paragraph, for use inside a heading. */
  inline?: boolean
}) {
  if (inline) {
    return (
      <span className={className}>
        <Markdown
          remarkPlugins={[remarkMath, remarkGfm]}
          rehypePlugins={[rehypeKatex]}
          components={{ p: ({ children }) => <>{children}</> }}
        >
          {markdown}
        </Markdown>
      </span>
    )
  }

  return (
    <div
      className={cn(
        'text-[15px] leading-[1.75] text-foreground',
        // Spacing between children rather than margins on each, so blocks
        // compose predictably wherever they are used.
        '[&>*+*]:mt-3.5',
        '[&_strong]:font-semibold',
        '[&_em]:italic',
        '[&_ul]:list-disc [&_ul]:pl-5 [&_ul>li]:mt-1.5',
        '[&_ol]:list-decimal [&_ol]:pl-5 [&_ol>li]:mt-1.5',
        '[&_code]:rounded [&_code]:bg-surface-sunken [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.9em]',
        '[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2',
        '[&_h3]:font-display [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-5',
        '[&_h4]:font-display [&_h4]:text-[15px] [&_h4]:font-semibold [&_h4]:mt-4',
        // Tables scroll inside themselves; the page never scrolls sideways.
        '[&_table]:w-full [&_table]:text-sm [&_table]:border-collapse',
        '[&_th]:border [&_th]:border-border [&_th]:bg-surface-sunken [&_th]:px-2.5 [&_th]:py-1.5 [&_th]:text-left',
        '[&_td]:border [&_td]:border-border [&_td]:px-2.5 [&_td]:py-1.5',
        className,
      )}
    >
      <Markdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Wrap tables so a wide one scrolls in place.
          table: ({ children }) => (
            <div className="-mx-1 overflow-x-auto px-1">
              <table>{children}</table>
            </div>
          ),
        }}
      >
        {normalizeDisplayMath(markdown)}
      </Markdown>
    </div>
  )
}
