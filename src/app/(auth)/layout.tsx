import Link from 'next/link'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="px-4 py-5 sm:px-6">
        <Link href="/" className="inline-flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-primary font-display text-sm font-bold text-primary-foreground">
            B
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">
            Baccaloria
          </span>
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 pb-16 sm:px-6">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  )
}
