import * as React from 'react'

import { cn } from '@/lib/utils'

export function Input({ className, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      className={cn(
        // 16px font size is deliberate: anything smaller makes iOS Safari zoom
        // the viewport on focus, which feels broken in an installed PWA.
        'h-12 w-full rounded-xl border border-border bg-surface px-3.5 text-base',
        'placeholder:text-foreground-subtle',
        'focus-visible:border-brand-400 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ring)]',
        'disabled:opacity-55',
        'aria-invalid:border-danger',
        className,
      )}
      {...props}
    />
  )
}

export function Label({ className, ...props }: React.ComponentProps<'label'>) {
  return (
    <label
      className={cn('text-sm font-medium text-foreground', className)}
      {...props}
    />
  )
}

type FieldProps = {
  label: string
  htmlFor: string
  error?: string
  hint?: string
  children: React.ReactNode
}

export function Field({ label, htmlFor, error, hint, children }: FieldProps) {
  const errorId = `${htmlFor}-error`
  const hintId = `${htmlFor}-hint`

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && !error && (
        <p id={hintId} className="text-xs text-foreground-subtle">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

/** Form-level error banner, for things that aren't tied to one input. */
export function FormError({ children }: { children?: string }) {
  if (!children) return null
  return (
    <div
      role="alert"
      className="rounded-xl border border-danger/30 bg-danger/8 px-4 py-3 text-sm font-medium text-danger"
    >
      {children}
    </div>
  )
}
