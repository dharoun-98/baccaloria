import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import * as React from 'react'

import { cn } from '@/lib/utils'

const button = cva(
  // Min height 44px on the primary sizes: that is the smallest reliable touch
  // target, and most of our users are on a phone.
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:pointer-events-none disabled:opacity-55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm',
        secondary: 'border border-border bg-surface hover:bg-surface-sunken',
        ghost: 'hover:bg-surface-sunken',
        danger: 'bg-danger text-white hover:opacity-90',
        accent: 'bg-accent-600 text-white hover:bg-accent-700 shadow-sm',
      },
      size: {
        sm: 'h-9 px-3.5 text-sm',
        md: 'h-11 px-5 text-[15px]',
        lg: 'h-13 px-6 text-base',
        icon: 'size-11',
      },
      block: {
        true: 'w-full',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof button> & {
    loading?: boolean
  }

export function Button({
  className,
  variant,
  size,
  block,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(button({ variant, size, block }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  )
}

export { button as buttonVariants }
