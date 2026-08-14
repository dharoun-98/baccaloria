'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

type Result = { ok?: true; error?: string }

async function requireStaff() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { supabase, user: null, staff: false }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return {
    supabase,
    user,
    staff: ['admin', 'editor', 'teacher'].includes(profile?.role ?? ''),
  }
}

/** "Les nombres complexes" -> "les-nombres-complexes" */
export async function slugify(input: string): Promise<string> {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

/**
 * Creates an empty lesson and, optionally, places it in a unit.
 *
 * A lesson belongs to a SUBJECT, not a filière — placement is what makes it
 * appear for a given stream. That indirection is the whole point: Philosophie
 * is genuinely the same lesson for PC, SE and SGC and should be authored once,
 * while Maths differs enough that those are separate lessons sharing a subject.
 */
export async function createLesson(formData: FormData): Promise<Result> {
  const { supabase, user, staff } = await requireStaff()
  if (!staff || !user) return { error: 'Réservé à l’équipe.' }

  const title = String(formData.get('title') ?? '').trim()
  const subjectId = String(formData.get('subjectId') ?? '')
  const unitId = String(formData.get('unitId') ?? '')
  const newUnitTitle = String(formData.get('newUnitTitle') ?? '').trim()
  const filiereSubjectId = String(formData.get('filiereSubjectId') ?? '')
  const tags = String(formData.get('tags') ?? '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)

  if (title.length < 3) return { error: 'Donne un titre à la leçon.' }
  if (!subjectId) return { error: 'Choisis une matière.' }

  const slug = await slugify(title)
  if (!slug) return { error: 'Ce titre ne produit pas d’identifiant valide.' }

  const { data: clash } = await supabase
    .from('lessons')
    .select('id')
    .eq('subject_id', subjectId)
    .eq('slug', slug)
    .maybeSingle()

  if (clash) {
    return {
      error: `Une leçon avec l’identifiant « ${slug} » existe déjà dans cette matière.`,
    }
  }

  const { data: lesson, error } = await supabase
    .from('lessons')
    .insert({
      subject_id: subjectId,
      slug,
      title_fr: title,
      subtitle_fr: String(formData.get('subtitle') ?? '').trim() || null,
      difficulty: Number(formData.get('difficulty') ?? 2),
      est_minutes: Number(formData.get('estMinutes') ?? 15),
      exam_frequency: Number(formData.get('examFrequency') ?? 3),
      access_tier: String(formData.get('accessTier') ?? 'premium'),
      tags,
      status: 'draft',
      ai_generated: false,
      authored_by: user.id,
    })
    .select('id')
    .single()

  if (error) return { error: `Création impossible : ${error.message}` }

  // Resolve the placement target: an existing unit, or a new one.
  let targetUnitId = unitId

  if (!targetUnitId && newUnitTitle && filiereSubjectId) {
    const unitSlug = await slugify(newUnitTitle)
    const { data: existing } = await supabase
      .from('units')
      .select('id')
      .eq('filiere_subject_id', filiereSubjectId)
      .eq('slug', unitSlug)
      .maybeSingle()

    if (existing) {
      targetUnitId = existing.id
    } else {
      const { data: created } = await supabase
        .from('units')
        .insert({
          filiere_subject_id: filiereSubjectId,
          slug: unitSlug,
          title_fr: newUnitTitle,
          sort_order: 99,
        })
        .select('id')
        .single()
      targetUnitId = created?.id ?? ''
    }
  }

  if (targetUnitId) {
    await supabase
      .from('lesson_placements')
      .insert({ lesson_id: lesson.id, unit_id: targetUnitId, sort_order: 99 })
  }

  revalidatePath('/admin/contenu')
  redirect(`/admin/contenu/${lesson.id}`)
}

/** Adds this lesson to another filière's unit, without copying it. */
export async function addPlacement(
  lessonId: string,
  unitId: string,
): Promise<Result> {
  const { supabase, staff } = await requireStaff()
  if (!staff) return { error: 'Réservé à l’équipe.' }

  const { error } = await supabase
    .from('lesson_placements')
    .insert({ lesson_id: lessonId, unit_id: unitId, sort_order: 99 })

  if (error) {
    return {
      error: error.code === '23505'
        ? 'Cette leçon est déjà placée dans ce chapitre.'
        : 'Ajout impossible.',
    }
  }

  revalidatePath(`/admin/contenu/${lessonId}`)
  revalidatePath('/matieres', 'layout')
  return { ok: true }
}

export async function removePlacement(
  lessonId: string,
  unitId: string,
): Promise<Result> {
  const { supabase, staff } = await requireStaff()
  if (!staff) return { error: 'Réservé à l’équipe.' }

  const { error } = await supabase
    .from('lesson_placements')
    .delete()
    .eq('lesson_id', lessonId)
    .eq('unit_id', unitId)

  if (error) return { error: 'Retrait impossible.' }

  revalidatePath(`/admin/contenu/${lessonId}`)
  revalidatePath('/matieres', 'layout')
  return { ok: true }
}

/**
 * Duplicates a lesson, content included, as a fresh draft.
 *
 * For the case the owner described: SE maths covers some of the same ground as
 * PC but treats it differently. Copying then rewriting beats starting from a
 * blank page, and beats sharing one lesson that then has to satisfy two
 * programmes at once.
 */
export async function duplicateLesson(lessonId: string): Promise<Result> {
  const { supabase, user, staff } = await requireStaff()
  if (!staff || !user) return { error: 'Réservé à l’équipe.' }

  const { data: source } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', lessonId)
    .single()

  if (!source) return { error: 'Leçon introuvable.' }

  let slug = `${source.slug}-copie`
  for (let i = 2; i < 20; i++) {
    const { data: taken } = await supabase
      .from('lessons')
      .select('id')
      .eq('subject_id', source.subject_id)
      .eq('slug', slug)
      .maybeSingle()
    if (!taken) break
    slug = `${source.slug}-copie-${i}`
  }

  const { data: copy, error } = await supabase
    .from('lessons')
    .insert({
      subject_id: source.subject_id,
      slug,
      title_fr: `${source.title_fr} (copie)`,
      subtitle_fr: source.subtitle_fr,
      difficulty: source.difficulty,
      est_minutes: source.est_minutes,
      exam_frequency: source.exam_frequency,
      access_tier: source.access_tier,
      objectives: source.objectives,
      key_terms: source.key_terms,
      tags: source.tags,
      status: 'draft',
      ai_generated: source.ai_generated,
      authored_by: user.id,
      review_notes: `Copiée depuis « ${source.title_fr} ». À adapter au programme de la filière visée.`,
    })
    .select('id')
    .single()

  if (error) return { error: `Duplication impossible : ${error.message}` }

  const { data: blocks } = await supabase
    .from('lesson_blocks')
    .select('kind, title_fr, content, position')
    .eq('lesson_id', lessonId)
    .order('position')

  if (blocks?.length) {
    await supabase
      .from('lesson_blocks')
      .insert(blocks.map((b) => ({ ...b, lesson_id: copy.id })))
  }

  revalidatePath('/admin/contenu')
  redirect(`/admin/contenu/${copy.id}`)
}

export async function updateLessonMeta(
  lessonId: string,
  formData: FormData,
): Promise<Result> {
  const { supabase, staff } = await requireStaff()
  if (!staff) return { error: 'Réservé à l’équipe.' }

  const tags = String(formData.get('tags') ?? '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)

  const { error } = await supabase
    .from('lessons')
    .update({
      title_fr: String(formData.get('title') ?? '').trim(),
      subtitle_fr: String(formData.get('subtitle') ?? '').trim() || null,
      difficulty: Number(formData.get('difficulty') ?? 2),
      est_minutes: Number(formData.get('estMinutes') ?? 15),
      exam_frequency: Number(formData.get('examFrequency') ?? 3),
      access_tier: String(formData.get('accessTier') ?? 'premium'),
      tags,
    })
    .eq('id', lessonId)

  if (error) return { error: 'Enregistrement impossible.' }

  revalidatePath(`/admin/contenu/${lessonId}`)
  revalidatePath('/admin/contenu')
  return { ok: true }
}
