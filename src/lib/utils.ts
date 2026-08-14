import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Readiness bands, mirroring readiness_scores.band in the database. */
export const READINESS_BANDS = [0, 1, 2, 3, 4] as const
export type ReadinessBand = (typeof READINESS_BANDS)[number]

export function bandFromScore(score: number): ReadinessBand {
  if (score >= 85) return 4
  if (score >= 70) return 3
  if (score >= 50) return 2
  if (score >= 25) return 1
  return 0
}

/** Whole days between now and the exam, floored at 0. */
export function daysUntil(date: Date | string): number {
  const target = typeof date === 'string' ? new Date(date) : date
  const ms = target.getTime() - Date.now()
  return Math.max(0, Math.ceil(ms / 86_400_000))
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}`
  if (m > 0) return `${m}:${String(s).padStart(2, '0')}`
  return `${s}s`
}

/** 1 234,50 DH — Moroccan dirham, French formatting. */
export function formatMAD(amount: number): string {
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    maximumFractionDigits: 2,
  }).format(amount)
}
