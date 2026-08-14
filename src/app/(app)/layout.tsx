import { redirect } from 'next/navigation'

import { BottomNav } from '@/components/app-shell/bottom-nav'
import { Sidebar } from '@/components/app-shell/sidebar'
import { createClient } from '@/lib/supabase/server'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/connexion')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, filiere_id, filieres ( code )')
    .eq('id', user.id)
    .single()

  // No filière yet means onboarding never finished. /bienvenue deliberately
  // lives outside this layout, so this redirect cannot loop.
  if (profile && !profile.filiere_id) redirect('/bienvenue')

  const filiereCode =
    (profile?.filieres as { code: string } | null | undefined)?.code ?? null
  const isStaff = ['admin', 'editor', 'teacher'].includes(profile?.role ?? '')

  return (
    <div className="min-h-dvh bg-background">
      <Sidebar
        fullName={profile?.full_name ?? null}
        filiereCode={filiereCode}
        isStaff={isStaff}
      />

      <div className="md:pl-60">
        <main className="pb-tabbar md:pb-10">{children}</main>
      </div>

      <BottomNav />
    </div>
  )
}
