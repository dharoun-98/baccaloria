'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { NAV_ITEMS } from './nav-items'

import { cn } from '@/lib/utils'

export function BottomNav() {
  const pathname = usePathname()
  const t = useTranslations('nav')

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="flex">
        {NAV_ITEMS.map(({ href, labelKey, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`)

          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors',
                  active
                    ? 'text-primary'
                    : 'text-foreground-subtle hover:text-foreground-muted',
                )}
              >
                <Icon
                  className="size-[22px]"
                  strokeWidth={active ? 2.4 : 1.9}
                  aria-hidden
                />
                {t(labelKey)}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
