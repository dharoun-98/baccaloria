'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'

/**
 * Both actions call database functions that check is_admin() themselves. The
 * session is passed straight through, so an ordinary student calling this
 * endpoint directly is rejected by Postgres, not by this file.
 */
export async function approvePayment(
  requestId: string,
  note?: string,
): Promise<{ ok?: true; message?: string; error?: string }> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('approve_payment', {
    p_request_id: requestId,
    p_note: note?.trim() || null,
  })

  if (error) return { error: friendly(error.message) }

  // Without this the approved request stays on screen and can be clicked
  // again, which the database rejects but which looks broken to the operator.
  revalidatePath('/admin/paiements')
  revalidatePath('/admin')

  const payload = data as { reference: string; plan: string; ends_at: string }
  const until = new Date(payload.ends_at).toLocaleDateString('fr-MA')

  return {
    ok: true,
    message: `${payload.reference} validé — ${payload.plan}, accès jusqu'au ${until}.`,
  }
}

export async function rejectPayment(
  requestId: string,
  reason: string,
): Promise<{ ok?: true; message?: string; error?: string }> {
  if (!reason.trim()) {
    return { error: 'Indique un motif : il sera visible par l’élève.' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase.rpc('reject_payment', {
    p_request_id: requestId,
    p_reason: reason.trim(),
  })

  if (error) return { error: friendly(error.message) }

  revalidatePath('/admin/paiements')
  revalidatePath('/admin')

  const payload = data as { reference: string }
  return { ok: true, message: `${payload.reference} refusé.` }
}

function friendly(message: string): string {
  if (message.includes('Réservé aux administrateurs')) {
    return "Tu n'as pas les droits pour cette action."
  }
  if (message.includes('déjà été traitée')) {
    return 'Cette demande a déjà été traitée — actualise la page.'
  }
  if (message.includes('motif de refus')) {
    return 'Un motif de refus est obligatoire.'
  }
  return 'Une erreur est survenue. Réessaie.'
}
