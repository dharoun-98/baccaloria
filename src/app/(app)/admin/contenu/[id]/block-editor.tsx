'use client'

import { Eye, Pencil, Save, Trash2 } from 'lucide-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { deleteBlock, saveBlock } from '../actions'

import { LessonBlock, type Block } from '@/components/lesson/lesson-block'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/field'
import { cn } from '@/lib/utils'

export function BlockEditor({
  block,
  lessonId,
}: {
  block: Block
  lessonId: string
}) {
  const [editing, setEditing] = useState(false)
  const [markdown, setMarkdown] = useState(block.content?.markdown ?? '')
  const [title, setTitle] = useState(block.title_fr ?? '')
  const [pending, startTransition] = useTransition()

  const dirty =
    markdown !== (block.content?.markdown ?? '') || title !== (block.title_fr ?? '')

  function save() {
    startTransition(async () => {
      const result = await saveBlock(block.id, markdown, title || null)
      if (result.error) toast.error(result.error)
      else {
        toast.success('Bloc enregistré.')
        setEditing(false)
      }
    })
  }

  function remove() {
    startTransition(async () => {
      const result = await deleteBlock(block.id, lessonId)
      if (result.error) toast.error(result.error)
      else toast.success('Bloc supprimé.')
    })
  }

  return (
    <div className="rounded-card border border-border bg-surface">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5">
        <span className="font-mono text-xs font-semibold tracking-wide text-foreground-muted uppercase">
          {block.kind}
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setEditing((e) => !e)}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-foreground-muted transition hover:bg-surface-sunken hover:text-foreground"
          >
            {editing ? (
              <>
                <Eye className="size-3.5" aria-hidden />
                Aperçu
              </>
            ) : (
              <>
                <Pencil className="size-3.5" aria-hidden />
                Modifier
              </>
            )}
          </button>

          <button
            type="button"
            onClick={remove}
            disabled={pending}
            className="rounded-lg p-1.5 text-foreground-subtle transition hover:bg-danger/10 hover:text-danger"
            aria-label="Supprimer ce bloc"
          >
            <Trash2 className="size-3.5" aria-hidden />
          </button>
        </div>
      </div>

      {editing ? (
        <div className="flex flex-col gap-3 p-4">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titre du bloc (optionnel)"
            aria-label="Titre du bloc"
          />

          <textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            rows={Math.min(24, Math.max(6, markdown.split('\n').length + 2))}
            spellCheck
            className={cn(
              'w-full rounded-xl border border-border bg-surface-sunken p-3.5',
              'font-mono text-[13px] leading-relaxed',
              'focus-visible:border-brand-400 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ring)]',
            )}
            aria-label="Contenu du bloc en Markdown"
          />

          <p className="text-xs leading-relaxed text-foreground-subtle">
            Markdown + LaTeX. <code className="font-mono">$x$</code> pour une formule
            dans le texte, <code className="font-mono">$$x$$</code> pour une formule
            centrée. Le placement des <code className="font-mono">$$</code> est
            normalisé automatiquement.
          </p>

          <div className="flex gap-2">
            <Button onClick={save} loading={pending} disabled={!dirty} size="sm">
              <Save className="size-3.5" aria-hidden />
              Enregistrer
            </Button>
            {dirty && (
              <span className="self-center text-xs text-accent-600">
                Modifications non enregistrées
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="p-4">
          {/* Rendered exactly as a student sees it — the only preview worth having. */}
          <LessonBlock
            block={{ ...block, title_fr: title || null, content: { markdown } }}
          />
        </div>
      )}
    </div>
  )
}
