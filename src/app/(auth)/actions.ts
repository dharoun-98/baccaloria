'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { createClient } from '@/lib/supabase/server'

export type AuthState = {
  error?: string
  fieldErrors?: Record<string, string>
}

const emailSchema = z
  .string()
  .trim()
  .min(1, 'Renseigne ton adresse e-mail.')
  .email('Cette adresse e-mail ne semble pas valide.')

const signUpSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Indique ton nom complet.')
    .max(80, 'Ce nom est trop long.'),
  email: emailSchema,
  password: z
    .string()
    .min(8, 'Ton mot de passe doit faire au moins 8 caractères.')
    .max(72, 'Ton mot de passe est trop long.'),
})

const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Renseigne ton mot de passe.'),
})

/** Zod issues -> { field: firstMessage }, stable across zod versions. */
function toFieldErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? '')
    if (key && !fieldErrors[key]) fieldErrors[key] = issue.message
  }
  return fieldErrors
}

/**
 * Supabase returns English auth errors. Translate the ones students will
 * actually hit, and fall back to something honest rather than leaking a raw
 * English string into a French UI.
 */
function translateAuthError(message: string): string {
  const m = message.toLowerCase()

  if (m.includes('invalid login credentials')) {
    return 'E-mail ou mot de passe incorrect.'
  }
  if (m.includes('email not confirmed')) {
    return "Ton adresse e-mail n'est pas encore confirmée. Vérifie ta boîte mail."
  }
  if (m.includes('user already registered') || m.includes('already been registered')) {
    return 'Un compte existe déjà avec cette adresse. Connecte-toi.'
  }
  if (m.includes('password should be at least')) {
    return 'Ton mot de passe est trop court.'
  }
  // Hit while testing the reset flow. Without this the student is told
  // "an error occurred" and has no idea their new password was simply the
  // same as the old one.
  if (m.includes('should be different from the old password')) {
    return "Choisis un mot de passe différent de l'ancien."
  }
  if (m.includes('weak password') || m.includes('password is too weak')) {
    return 'Ce mot de passe est trop simple. Ajoute des chiffres ou des majuscules.'
  }
  if (m.includes('same password')) {
    return "Choisis un mot de passe différent de l'ancien."
  }
  if (m.includes('rate limit') || m.includes('too many requests')) {
    return 'Trop de tentatives. Patiente quelques minutes puis réessaie.'
  }
  if (m.includes('failed to fetch') || m.includes('fetch failed')) {
    return 'Connexion au serveur impossible. Vérifie ta connexion internet.'
  }
  return "Une erreur est survenue. Réessaie dans un instant."
}

// -------------------------------------------------------------- sign up ----
export async function signUp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = signUpSchema.safeParse({
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { fieldErrors: toFieldErrors(parsed.error) }
  }

  const supabase = await createClient()
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      // Read by the handle_new_user trigger to populate profiles.full_name.
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${origin}/auth/confirmer`,
    },
  })

  if (error) {
    return { error: translateAuthError(error.message) }
  }

  // Whether a session comes back depends on the project's "Confirm email"
  // setting, which is an operator toggle rather than something this code can
  // assume. With confirmation off the user is already signed in, and sending
  // them to "check your inbox" would strand them waiting for an e-mail that is
  // never sent. Branch on what actually came back.
  if (data.session) {
    revalidatePath('/', 'layout')
    redirect('/bienvenue')
  }

  redirect('/verifier-email')
}

// -------------------------------------------------------------- sign in ----
export async function signIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = signInSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { fieldErrors: toFieldErrors(parsed.error) }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    return { error: translateAuthError(error.message) }
  }

  // Only follow same-origin relative paths. A raw redirect param is an open
  // redirect waiting to happen.
  const next = formData.get('next')
  const target =
    typeof next === 'string' && next.startsWith('/') && !next.startsWith('//')
      ? next
      : '/accueil'

  revalidatePath('/', 'layout')
  redirect(target)
}

// ------------------------------------------------------------- sign out ----
export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/connexion')
}

// ------------------------------------------------------ password reset -----
export async function requestPasswordReset(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = emailSchema.safeParse(formData.get('email'))

  if (!parsed.success) {
    return { fieldErrors: { email: parsed.error.issues[0]?.message ?? 'Adresse invalide.' } }
  }

  const supabase = await createClient()
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  // Routed through /auth/confirmer so the PKCE code is exchanged for a session
  // by the one handler that knows how. Pointing straight at the form would
  // land the user there with no session, unable to set anything.
  await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${origin}/auth/confirmer?next=/nouveau-mot-de-passe`,
  })

  // Always redirect to the same confirmation, whether or not the address
  // exists. Telling the caller "no such account" hands an attacker a way to
  // enumerate who is registered.
  redirect('/verifier-email?reset=1')
}

// -------------------------------------------------- set a new password -----
const newPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Ton mot de passe doit faire au moins 8 caractères.')
      .max(72, 'Ton mot de passe est trop long.'),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    path: ['confirm'],
    message: 'Les deux mots de passe ne sont pas identiques.',
  })

export async function setNewPassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = newPasswordSchema.safeParse({
    password: formData.get('password'),
    confirm: formData.get('confirm'),
  })

  if (!parsed.success) {
    return { fieldErrors: toFieldErrors(parsed.error) }
  }

  const supabase = await createClient()

  // Reaching this page means /auth/confirmer already exchanged the recovery
  // code for a session. Without one, updateUser has nobody to update.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      error:
        "Ton lien de réinitialisation a expiré. Demande-en un nouveau depuis « Mot de passe oublié ».",
    }
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })

  if (error) {
    return { error: translateAuthError(error.message) }
  }

  revalidatePath('/', 'layout')
  redirect('/accueil')
}

// -------------------------------------------------- choose your filière -----
export async function chooseFiliere(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const filiereId = formData.get('filiereId')

  if (typeof filiereId !== 'string' || filiereId.length === 0) {
    return { error: 'Choisis ta filière pour continuer.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/connexion')

  const { error } = await supabase
    .from('profiles')
    .update({ filiere_id: filiereId, onboarded_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) {
    return { error: "Impossible d'enregistrer ta filière. Réessaie." }
  }

  revalidatePath('/', 'layout')
  redirect('/accueil')
}
