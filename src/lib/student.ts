import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

export type StudentContext = {
  userId: string
  fullName: string | null
  filiereId: string
  role: string
  isStaff: boolean
  hasPremium: boolean
}

/**
 * Resolves the signed-in student and their filière, or redirects.
 *
 * `hasPremium` comes from the same has_premium_access() function the RLS
 * policies use, so the UI and the database can never disagree about who has
 * paid. The UI only decides what to *show*; the database decides what can
 * actually be read.
 */
export async function requireStudent(): Promise<StudentContext> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/connexion')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, filiere_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.filiere_id) redirect('/bienvenue')

  const { data: premium } = await supabase.rpc('has_premium_access', { uid: user.id })

  return {
    userId: user.id,
    fullName: profile.full_name ?? null,
    filiereId: profile.filiere_id,
    role: profile.role ?? 'student',
    isStaff: ['admin', 'editor', 'teacher'].includes(profile.role ?? ''),
    hasPremium: Boolean(premium),
  }
}

export const DIFFICULTY_LABEL: Record<number, string> = {
  1: 'Accessible',
  2: 'Intermédiaire',
  3: 'Exigeant',
}
