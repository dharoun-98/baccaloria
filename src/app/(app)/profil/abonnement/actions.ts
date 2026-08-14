'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'

/**
 * Opens a payment request and returns the reference code the student quotes on
 * WhatsApp and writes on the transfer slip.
 *
 * The amount is read from the plan server-side, never taken from the client —
 * otherwise anyone could claim they paid 1 MAD. The row is created through the
 * student's own session, so the RLS policy (own user_id, status must start
 * 'pending') is what actually constrains it. Approval is a separate, admin-only
 * action.
 */
export async function requestAccess(
  planId: string,
): Promise<{ reference?: string; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Ta session a expiré. Reconnecte-toi.' }

  const { data: plan } = await supabase
    .from('plans')
    .select('id, price_mad, is_active')
    .eq('id', planId)
    .maybeSingle()

  if (!plan || !plan.is_active) {
    return { error: "Cette formule n'est plus disponible." }
  }

  // One open request at a time, so the admin queue does not fill with
  // duplicates from a student clicking twice.
  const { data: existing } = await supabase
    .from('payment_requests')
    .select('reference_code')
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .maybeSingle()

  if (existing) {
    return { reference: existing.reference_code }
  }

  const { data, error } = await supabase
    .from('payment_requests')
    .insert({
      user_id: user.id,
      plan_id: plan.id,
      amount_mad: plan.price_mad,
      method: 'virement',
      status: 'pending',
    })
    .select('reference_code')
    .single()

  if (error) {
    return { error: "Impossible de créer ta demande. Réessaie dans un instant." }
  }

  revalidatePath('/profil/abonnement')
  return { reference: data.reference_code }
}
