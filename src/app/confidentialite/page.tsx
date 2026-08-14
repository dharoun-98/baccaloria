import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  robots: { index: false },
}

export default function PrivacyPage() {
  return (
    <div className="min-h-dvh bg-background">
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground-muted hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Accueil
        </Link>

        <h1 className="mt-6 font-display text-3xl font-bold tracking-tight">
          Politique de confidentialité
        </h1>

        <div className="mt-4 rounded-card border-2 border-accent-300 bg-accent-50 p-4 text-sm leading-relaxed dark:border-accent-800 dark:bg-accent-900/25">
          <p className="font-semibold">Document en cours de rédaction.</p>
          <p className="mt-1.5 text-foreground-muted">
            La version définitive sera publiée avant l&apos;ouverture au public. En
            attendant, voici factuellement les données que la plateforme traite
            aujourd&apos;hui.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-6 text-[15px] leading-relaxed">
          <section>
            <h2 className="font-display text-lg font-bold">Données collectées</h2>
            <ul className="mt-2 list-disc pl-5 text-foreground-muted [&>li]:mt-1.5">
              <li>
                <strong className="text-foreground">Compte</strong> : nom, adresse
                e-mail, mot de passe (stocké sous forme chiffrée, jamais en clair).
              </li>
              <li>
                <strong className="text-foreground">Scolarité</strong> : filière choisie,
                et si tu les renseignes, établissement et ville.
              </li>
              <li>
                <strong className="text-foreground">Activité</strong> : leçons
                consultées et terminées, réponses aux quiz, scores, temps passé. Ces
                données servent à calculer ta progression.
              </li>
              <li>
                <strong className="text-foreground">Paiement</strong> : en cas
                d&apos;abonnement, le montant, le mode de paiement et le reçu que tu
                transmets. Aucune donnée bancaire n&apos;est saisie sur la plateforme.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold">Hébergement</h2>
            <p className="mt-2 text-foreground-muted">
              Les données sont hébergées par Supabase, sur des serveurs situés dans
              l&apos;Union européenne (Francfort, Allemagne). L&apos;application est
              servie par Vercel.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold">Partage</h2>
            <p className="mt-2 text-foreground-muted">
              Tes données ne sont ni vendues ni transmises à des tiers à des fins
              publicitaires. Ta progression n&apos;est visible par personne d&apos;autre,
              sauf si tu choisis explicitement de la partager.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold">Utilisateurs mineurs</h2>
            <p className="mt-2 text-foreground-muted">
              La plateforme s&apos;adresse à des lycéens, dont une partie est mineure.
              Les modalités de recueil du consentement parental et la déclaration
              auprès de la CNDP (loi 09-08) seront précisées dans la version définitive
              de ce document.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold">Tes droits</h2>
            <p className="mt-2 text-foreground-muted">
              Tu peux demander l&apos;accès, la rectification ou la suppression de tes
              données. La procédure et le contact dédié seront indiqués ici.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
