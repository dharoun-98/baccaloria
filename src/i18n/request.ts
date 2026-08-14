import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'

export const LOCALES = ['fr', 'ar'] as const
export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'fr'
export const LOCALE_COOKIE = 'baccaloria-locale'

export const RTL_LOCALES = new Set<Locale>(['ar'])

/**
 * v1 runs next-intl WITHOUT locale routing: French only, clean URLs
 * (/matieres/maths, not /fr/matieres/maths). All copy still lives in
 * messages/*.json, so adding Arabic later is a routing change plus a
 * translation pass — not a rewrite of every component.
 */
export default getRequestConfig(async () => {
  const store = await cookies()
  const cookieLocale = store.get(LOCALE_COOKIE)?.value

  const locale: Locale = LOCALES.includes(cookieLocale as Locale)
    ? (cookieLocale as Locale)
    : DEFAULT_LOCALE

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
