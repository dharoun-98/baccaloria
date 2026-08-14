'use client'

import { LogOut, Shield } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { NAV_ITEMS } from './nav-items'

import { signOut } from '@/app/(auth)/actions'
import { cn, initials } from '@/lib/utils'

type SidebarProps = {
  fullName: string | null
  filiereCode: string | null
  isStaff: boolean
}

export function Sidebar({ fullName, filiereCode, isStaff }: SidebarProps) {
  const pathname = usePathname()
  const t = useTranslations('nav')

  return (
    <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-border bg-surface md:flex">
      <Link href="/accueil" className="flex items-center gap-2.5 px-5 py-5">
        <span className="grid size-8 place-items-center rounded-lg bg-primary font-display text-sm font-bold text-primary-foreground">
          B
        </span>
        <span className="font-display text-lg font-semibold tracking-tight">
          Baccaloria
        </span>
      </Link>

      <nav aria-label="Navigation principale" className="flex-1 px-3">
        <ul className="flex flex-col gap-0.5">
          {NAV_ITEMS.map(({ href, labelKey, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`)

            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    active
                      ? 'bg-primary-subtle text-primary'
                      : 'text-foreground-muted hover:bg-surface-sunken hover:text-foreground',
                  )}
                >
                  <Icon className="size-[18px]" strokeWidth={active ? 2.3 : 1.9} aria-hidden />
                  {t(labelKey)}
                </Link>
              </li>
            )
          })}

          {isStaff && (
            <li className="mt-2 border-t border-border pt-2">
              <Link
                href="/admin"
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  pathname.startsWith('/admin')
                    ? 'bg-accent-100 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300'
                    : 'text-foreground-muted hover:bg-surface-sunken hover:text-foreground',
                )}
              >
                <Shield className="size-[18px]" strokeWidth={1.9} aria-hidden />
                {t('admin')}
              </Link>
            </li>
          )}
        </ul>
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-sunken text-xs font-bold text-foreground-muted">
            {initials(fullName)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">
              {fullName ?? 'Mon compte'}
            </span>
            {filiereCode && (
              <span className="block font-mono text-[11px] text-foreground-subtle">
                {filiereCode}
              </span>
            )}
          </span>
        </div>

        <form action={signOut}>
          <button
            type="submit"
            className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground-muted transition-colors hover:bg-surface-sunken hover:text-foreground"
          >
            <LogOut className="size-[18px]" strokeWidth={1.9} aria-hidden />
            Se déconnecter
          </button>
        </form>
      </div>
    </aside>
  )
}
