import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: "Conditions d'utilisation",
  robots: { index: false },
}

export default function TermsPage() {
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
          Conditions d&apos;utilisation
        </h1>

        <div className="mt-4 rounded-card border-2 border-accent-300 bg-accent-50 p-4 text-sm leading-relaxed dark:border-accent-800 dark:bg-accent-900/25">
          <p className="font-semibold">Document en cours de rédaction.</p>
          <p className="mt-1.5 text-foreground-muted">
            Les conditions générales d&apos;utilisation et de vente définitives seront
            publiées avant l&apos;ouverture au public. Voici les règles qui
            s&apos;appliquent dès aujourd&apos;hui.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-6 text-[15px] leading-relaxed">
          <section>
            <h2 className="font-display text-lg font-bold">Objet</h2>
            <p className="mt-2 text-foreground-muted">
              Baccaloria est une plateforme d&apos;aide à la révision du Baccalauréat
              marocain. Elle ne se substitue ni aux cours, ni aux enseignants, ni aux
              documents officiels du Ministère de l&apos;Éducation Nationale.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold">Compte</h2>
            <p className="mt-2 text-foreground-muted">
              Ton compte est personnel. Le partage d&apos;identifiants n&apos;est pas
              autorisé et le nombre d&apos;appareils connectés simultanément peut être
              limité.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold">Contenu pédagogique</h2>
            <p className="mt-2 text-foreground-muted">
              Les résumés, fiches et exercices sont fournis à titre d&apos;aide à la
              révision. Malgré le soin apporté à leur relecture, ils peuvent comporter
              des erreurs : en cas de doute, la référence reste le programme officiel et
              ton enseignant. Signale-nous toute erreur repérée.
            </p>
            <p className="mt-2 text-foreground-muted">
              Les sujets d&apos;examen reproduits sont des documents publics publiés par
              le Ministère. Les corrigés, résumés et exercices originaux sont la
              propriété de Baccaloria et ne peuvent être redistribués.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold">Score de préparation</h2>
            <p className="mt-2 text-foreground-muted">
              L&apos;indicateur de préparation est une estimation calculée à partir de
              ton activité sur la plateforme. Il ne constitue en aucun cas une prédiction
              de ta note à l&apos;examen.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold">Abonnement</h2>
            <p className="mt-2 text-foreground-muted">
              Une partie du contenu est accessible gratuitement, sans limite de durée.
              L&apos;accès Premium est activé manuellement après vérification du
              paiement. Les modalités de remboursement seront précisées dans la version
              définitive.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
