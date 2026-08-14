import type { Metadata, Viewport } from 'next'
import { Inter, Outfit } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { Toaster } from 'sonner'

import { RTL_LOCALES, type Locale } from '@/i18n/request'

import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Baccaloria — Prépare ton Baccalauréat marocain',
    template: '%s · Baccaloria',
  },
  description:
    "Cours résumés, fiches mémo, cartes mentales, quiz et examens nationaux corrigés. Prépare le Bac marocain efficacement, et suis ta progression jour après jour.",
  applicationName: 'Baccaloria',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Baccaloria',
    statusBarStyle: 'default',
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: 'website',
    locale: 'fr_MA',
    siteName: 'Baccaloria',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f0f0e' },
  ],
  width: 'device-width',
  initialScale: 1,
  // Zooming stays enabled on purpose: pinch-zoom is how students read dense
  // formulas and scanned exam PDFs on a small screen. Disabling it would be
  // an accessibility regression, app-like feel or not.
  maximumScale: 5,
  viewportFit: 'cover',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = (await getLocale()) as Locale
  const messages = await getMessages()
  const dir = RTL_LOCALES.has(locale) ? 'rtl' : 'ltr'

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body className={`${inter.variable} ${outfit.variable} antialiased`}>
        <NextIntlClientProvider messages={messages}>
          {children}
          <Toaster position="top-center" richColors closeButton />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
