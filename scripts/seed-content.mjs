/**
 * Imports every lesson module in a content pack into the database as DRAFTS.
 *
 *     node --env-file=.env.local scripts/seed-content.mjs maths-pc
 *
 * Idempotent: re-running updates existing lessons in place (matched on slug)
 * rather than duplicating them. Blocks, mind map and questions are replaced
 * wholesale, because partial merging of hand-edited content would silently
 * resurrect text a reviewer had deleted.
 *
 * ⚠️ Nothing is published. Everything lands as `status: draft`, flagged
 * `ai_generated`, and reaches students only after a human reviews and
 * publishes it from /admin/contenu. A wrong formula does not crash anything —
 * it just teaches something false, which is worse.
 *
 * Re-seeding a lesson a reviewer has already published RESETS it to draft and
 * discards their edits. The script refuses to do that unless --force is given.
 */
import { readdir } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL, fileURLToPath } from 'node:url'

import { createClient } from '@supabase/supabase-js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const pack = process.argv[2]
const force = process.argv.includes('--force')

if (!pack) {
  console.error('Usage: node --env-file=.env.local scripts/seed-content.mjs <pack> [--force]')
  console.error('  pack: nom d’un dossier dans content/, ex. maths-pc')
  process.exit(1)
}

/** Which subject and filière a content pack targets. */
const PACKS = {
  'maths-pc': { subject: 'mathematiques', filiere: 'PC' },
  'pc-pc': { subject: 'physique-chimie', filiere: 'PC' },
  'svt-pc': { subject: 'svt', filiere: 'PC' },
}

const target = PACKS[pack]
if (!target) {
  console.error(`Pack inconnu: ${pack}. Connus: ${Object.keys(PACKS).join(', ')}`)
  process.exit(1)
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key || key === 'PASTE_ME') {
  console.error('Missing Supabase credentials. Run with --env-file=.env.local')
  process.exit(1)
}

const db = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const RED = '\x1b[31m'
const DIM = '\x1b[2m'
const RESET = '\x1b[0m'

async function main() {
  const dir = path.join(ROOT, 'content', pack)
  const files = (await readdir(dir)).filter((f) => f.endsWith('.mjs')).sort()

  if (files.length === 0) {
    console.error(`Aucun fichier .mjs dans content/${pack}/`)
    process.exit(1)
  }

  // A reviewer is required by the publish constraint. Drafts do not need one,
  // but we record an author so the audit trail is not empty.
  const { data: users } = await db.auth.admin.listUsers({ perPage: 1 })
  const author = users?.users[0]?.id ?? null

  const { data: subject } = await db
    .from('subjects')
    .select('id')
    .eq('slug', target.subject)
    .single()

  const { data: filiere } = await db
    .from('filieres')
    .select('id')
    .eq('code', target.filiere)
    .single()

  const { data: filiereSubject } = await db
    .from('filiere_subjects')
    .select('id')
    .eq('filiere_id', filiere.id)
    .eq('subject_id', subject.id)
    .single()

  console.log(`${DIM}${pack} → ${target.filiere} / ${target.subject}${RESET}\n`)

  const unitCache = new Map()
  let created = 0
  let updated = 0
  let skipped = 0

  for (const file of files) {
    const mod = (await import(pathToFileURL(path.join(dir, file)).href)).default

    // ------------------------------------------------------------ unit ---
    let unitId = unitCache.get(mod.unit.slug)
    if (!unitId) {
      const { data: existingUnit } = await db
        .from('units')
        .select('id')
        .eq('filiere_subject_id', filiereSubject.id)
        .eq('slug', mod.unit.slug)
        .maybeSingle()

      if (existingUnit) {
        unitId = existingUnit.id
      } else {
        const { data: newUnit, error } = await db
          .from('units')
          .insert({
            filiere_subject_id: filiereSubject.id,
            slug: mod.unit.slug,
            title_fr: mod.unit.title,
            sort_order: mod.unit.order ?? 0,
          })
          .select('id')
          .single()
        if (error) throw new Error(`unit ${mod.unit.slug}: ${error.message}`)
        unitId = newUnit.id
      }
      unitCache.set(mod.unit.slug, unitId)
    }

    // ---------------------------------------------------------- lesson ---
    const { data: existing } = await db
      .from('lessons')
      .select('id, status')
      .eq('subject_id', subject.id)
      .eq('slug', mod.slug)
      .maybeSingle()

    if (existing?.status === 'published' && !force) {
      console.log(
        `${YELLOW}·${RESET} ${mod.slug} ${DIM}— déjà publiée, ignorée (--force pour écraser)${RESET}`,
      )
      skipped++
      continue
    }

    const payload = {
      subject_id: subject.id,
      slug: mod.slug,
      title_fr: mod.title,
      subtitle_fr: mod.subtitle ?? null,
      difficulty: mod.difficulty ?? 2,
      est_minutes: mod.estMinutes ?? 15,
      exam_frequency: mod.examFrequency ?? 3,
      access_tier: mod.accessTier ?? 'premium',
      objectives: mod.objectives ?? [],
      key_terms: mod.keyTerms ?? [],
      status: 'draft',
      ai_generated: true,
      authored_by: author,
      reviewed_by: null,
      reviewed_at: null,
      published_at: null,
      review_notes:
        'Brouillon généré. Relecture par un enseignant de la matière requise avant publication.',
    }

    let lessonId
    if (existing) {
      const { error } = await db.from('lessons').update(payload).eq('id', existing.id)
      if (error) throw new Error(`${mod.slug}: ${error.message}`)
      lessonId = existing.id
      updated++
    } else {
      const { data, error } = await db.from('lessons').insert(payload).select('id').single()
      if (error) throw new Error(`${mod.slug}: ${error.message}`)
      lessonId = data.id
      created++
    }

    // Replace children wholesale — see header note on partial merges.
    await db.from('lesson_blocks').delete().eq('lesson_id', lessonId)
    await db.from('mindmaps').delete().eq('lesson_id', lessonId)
    await db.from('questions').delete().eq('lesson_id', lessonId)

    await db.from('lesson_placements').upsert(
      { lesson_id: lessonId, unit_id: unitId, sort_order: mod.unit.lessonOrder ?? 0 },
      { onConflict: 'lesson_id,unit_id' },
    )

    const { error: blockError } = await db.from('lesson_blocks').insert(
      mod.blocks.map((b, i) => ({
        lesson_id: lessonId,
        kind: b.kind,
        title_fr: b.title ?? null,
        content: { markdown: b.markdown },
        position: i,
      })),
    )
    if (blockError) throw new Error(`${mod.slug} blocks: ${blockError.message}`)

    if (mod.mindmap) {
      await db.from('mindmaps').insert({
        lesson_id: lessonId,
        title_fr: `Carte mentale — ${mod.title}`,
        data: mod.mindmap,
        status: 'published',
      })
    }

    if (mod.questions?.length) {
      const { error: qError } = await db.from('questions').insert(
        mod.questions.map((q) => ({
          subject_id: subject.id,
          lesson_id: lessonId,
          type: 'mcq_single',
          stem: { markdown: q.stem },
          choices: q.choices.map(([id, label, correct]) => ({
            id,
            label,
            is_correct: Boolean(correct),
          })),
          answer: { choice: q.choices.find(([, , c]) => c)[0] },
          explanation: { markdown: q.explanation },
          difficulty: q.difficulty ?? 2,
          points: 1,
          tags: [mod.slug],
          status: 'draft',
          ai_generated: true,
          authored_by: author,
        })),
      )
      if (qError) throw new Error(`${mod.slug} questions: ${qError.message}`)

      // One quiz per lesson, drawing from that lesson's own bank.
      // Updated in place rather than deleted and recreated: deleting an
      // assessment cascades to attempts, which would erase students' history.
      const draw = Math.min(5, mod.questions.length)
      const quizFields = {
        title_fr: `Quiz — ${mod.title}`,
        instructions_fr:
          'Questions tirées au hasard. Tu peux recommencer autant de fois que tu veux.',
        question_count: draw,
        pass_threshold: 60,
        access_tier: mod.accessTier ?? 'premium',
      }

      const { data: existingQuiz } = await db
        .from('assessments')
        .select('id')
        .eq('lesson_id', lessonId)
        .eq('kind', 'lesson_quiz')
        .maybeSingle()

      let assessment = existingQuiz
      if (existingQuiz) {
        await db.from('assessments').update(quizFields).eq('id', existingQuiz.id)
      } else {
        const { data: newQuiz, error: quizError } = await db
          .from('assessments')
          .insert({
            kind: 'lesson_quiz',
            lesson_id: lessonId,
            status: 'draft',
            ...quizFields,
          })
          .select('id')
          .single()
        if (quizError) throw new Error(`${mod.slug} quiz: ${quizError.message}`)
        assessment = newQuiz
      }

      if (assessment) {
        await db.from('assessment_pools').delete().eq('assessment_id', assessment.id)
        await db.from('assessment_pools').insert({
          assessment_id: assessment.id,
          filter: { lesson_ids: [lessonId] },
          draw_count: draw,
          position: 0,
        })
      }
    }

    console.log(
      `${GREEN}✓${RESET} ${mod.slug.padEnd(34)} ${DIM}${mod.blocks.length} blocs · ${mod.questions?.length ?? 0} questions${RESET}`,
    )
  }

  console.log(
    `\n${created} créée(s), ${updated} mise(s) à jour, ${skipped} ignorée(s).`,
  )
  console.log(
    `\n${YELLOW}Tout est en brouillon.${RESET} Relis et publie depuis /admin/contenu.`,
  )
}

main().catch((error) => {
  console.error(`\n${RED}✗ ${error.message}${RESET}`)
  process.exit(1)
})
