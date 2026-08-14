import { MailCheck } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Vérifie ta boîte mail',
}

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>
}) {
  const { reset } = await searchParams
  const isReset = reset === '1'

  return (
    <div className="rounded-card border border-border bg-surface p-8 text-center shadow-card">
      <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary-subtle text-primary">
        <MailCheck className="size-7" aria-hidden />
      </span>

      <h1 className="mt-5 font-display text-2xl font-bold tracking-tight">
        Vérifie ta boîte mail
      </h1>

      <p className="mt-3 text-sm leading-relaxed text-foreground-muted">
        {isReset
          ? "Si un compte existe avec cette adresse, tu recevras un lien pour choisir un nouveau mot de passe."
          : "Nous t'avons envoyé un lien de confirmation. Clique dessus pour activer ton compte et commencer."}
      </p>

      <p className="mt-4 text-xs leading-relaxed text-foreground-subtle">
        Rien reçu après quelques minutes ? Regarde dans tes spams — c&apos;est
        souvent là qu&apos;il atterrit.
      </p>

      <Link
        href="/connexion"
        className="mt-6 inline-block text-sm font-semibold text-primary hover:underline"
      >
        Retour à la connexion
      </Link>
    </div>
  )
}
