import { cn } from '@/lib/utils'
import type { ReadinessBand } from '@/lib/utils'

const BAND_STROKE: Record<ReadinessBand, string> = {
  0: 'var(--band-0)',
  1: 'var(--band-1)',
  2: 'var(--band-2)',
  3: 'var(--band-3)',
  4: 'var(--band-4)',
}

type Props = {
  /** 0–100 */
  value: number
  band: ReadinessBand
  size?: number
  strokeWidth?: number
  label?: string
  className?: string
}

/**
 * Circular readiness gauge.
 *
 * Rendered as a real <svg> rather than a conic-gradient so the arc stays crisp
 * at any size and the colour can come from a band token. The numeric value is
 * always present as text — colour alone must never be the only signal.
 */
export function ReadinessRing({
  value,
  band,
  size = 168,
  strokeWidth = 12,
  label,
  className,
}: Props) {
  const clamped = Math.min(100, Math.max(0, value))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - clamped / 100)

  return (
    <div
      className={cn('relative inline-grid place-items-center', className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`Niveau de préparation : ${Math.round(clamped)} %`}
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--surface-sunken)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={BAND_STROKE[band]}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-1000 ease-out motion-reduce:transition-none"
        />
      </svg>

      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="font-display text-4xl font-bold tabular-nums tracking-tight">
            {Math.round(clamped)}
            <span className="text-xl text-foreground-muted">%</span>
          </div>
          {label && (
            <div className="mt-0.5 text-xs font-medium text-foreground-muted">
              {label}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
