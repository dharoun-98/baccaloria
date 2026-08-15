/**
 * Imports exam PDFs from "Bac exams/" into Supabase Storage and the exams table.
 *
 *     node --env-file=.env.local scripts/import-exams.mjs           # dry run
 *     node --env-file=.env.local scripts/import-exams.mjs --apply
 *
 * Reads the folder layout:
 *     Bac exams/<FILIERE>/<Matiere>/<Normal|Ratt>/examen-<year>-<session>.pdf
 *
 * Dry run by default. Uploading 18 PDFs to the wrong subject because a folder
 * was misspelled is tedious to undo, so the default is to print the plan and
 * change nothing.
 *
 * Idempotent: re-running updates the existing exam row and overwrites the
 * stored file rather than creating duplicates.
 *
 * Exams land as status 'draft'. They become visible to students only once a
 * corrigé exists and someone publishes them — a timed paper with no correction
 * teaches nothing.
 */
import { readFile, readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { createClient } from '@supabase/supabase-js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const EXAM_DIR = path.join(ROOT, 'Bac exams')
const apply = process.argv.includes('--apply')

/** Folder name -> subject slug in the database. */
const SUBJECT_BY_FOLDER = {
  Math: 'mathematiques',
  'Physique-Chimie': 'physique-chimie',
  SVT: 'svt',
  Philosophie: 'philosophie',
  Anglais: 'anglais',
  Economie: 'economie-statistiques',
  Comptabilite: 'comptabilite',
}

const SESSION_BY_FOLDER = { Normal: 'normale', Ratt: 'rattrapage' }

const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const RED = '\x1b[31m'
const DIM = '\x1b[2m'
const RESET = '\x1b[0m'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key || key === 'PASTE_ME') {
  console.error('Run with: node --env-file=.env.local scripts/import-exams.mjs')
  process.exit(1)
}

const db = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
})

/** Pulls year and session out of the filename, which is the source of truth. */
function parseFilename(name) {
  const match = name.match(/examen-(\d{4})-(normale|rattrapage)\.pdf$/i)
  if (!match) return null
  return { year: Number(match[1]), session: match[2].toLowerCase() }
}

async function collect() {
  const found = []
  const problems = []

  let filieres
  try {
    filieres = await readdir(EXAM_DIR, { withFileTypes: true })
  } catch {
    console.error(`Dossier introuvable : ${EXAM_DIR}`)
    process.exit(1)
  }

  for (const filiereEntry of filieres) {
    if (!filiereEntry.isDirectory()) continue
    const filiereCode = filiereEntry.name
    const filierePath = path.join(EXAM_DIR, filiereCode)

    for (const subjectEntry of await readdir(filierePath, { withFileTypes: true })) {
      if (!subjectEntry.isDirectory()) continue

      const subjectSlug = SUBJECT_BY_FOLDER[subjectEntry.name]
      if (!subjectSlug) {
        problems.push(`${filiereCode}/${subjectEntry.name} — matière inconnue, ignorée`)
        continue
      }

      const subjectPath = path.join(filierePath, subjectEntry.name)

      for (const sessionEntry of await readdir(subjectPath, { withFileTypes: true })) {
        if (!sessionEntry.isDirectory()) continue

        const session = SESSION_BY_FOLDER[sessionEntry.name]
        if (!session) {
          problems.push(
            `${filiereCode}/${subjectEntry.name}/${sessionEntry.name} — dossier de session inconnu`,
          )
          continue
        }

        const sessionPath = path.join(subjectPath, sessionEntry.name)

        for (const file of await readdir(sessionPath)) {
          if (!file.toLowerCase().endsWith('.pdf')) continue

          const parsed = parseFilename(file)
          if (!parsed) {
            problems.push(`${filiereCode}/${subjectEntry.name}/${sessionEntry.name}/${file} — nom non reconnu`)
            continue
          }

          // The folder says one session, the filename says another. Trust
          // neither silently: a paper filed under the wrong session would be
          // served to students as the wrong exam.
          if (parsed.session !== session) {
            problems.push(
              `${file} est dans le dossier ${sessionEntry.name} mais son nom dit « ${parsed.session} »`,
            )
            continue
          }

          const full = path.join(sessionPath, file)
          const { size } = await stat(full)

          found.push({
            filiereCode,
            subjectSlug,
            subjectFolder: subjectEntry.name,
            session,
            year: parsed.year,
            file: full,
            sizeKB: Math.round(size / 1024),
          })
        }
      }
    }
  }

  return { found, problems }
}

async function main() {
  const { found, problems } = await collect()

  console.log(`${DIM}${apply ? 'IMPORT' : 'SIMULATION (ajoute --apply pour importer)'}${RESET}\n`)

  if (problems.length > 0) {
    console.log(`${YELLOW}À vérifier :${RESET}`)
    for (const p of problems) console.log(`  · ${p}`)
    console.log()
  }

  if (found.length === 0) {
    console.log('Aucun PDF exploitable trouvé.')
    return
  }

  // Group for a readable plan.
  const grouped = new Map()
  for (const item of found) {
    const key = `${item.filiereCode} / ${item.subjectFolder}`
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key).push(item)
  }

  for (const [group, items] of grouped) {
    const years = items.map((i) => `${i.year}${i.session === 'normale' ? 'N' : 'R'}`).sort()
    console.log(`${group.padEnd(24)} ${items.length} fichier(s)  ${DIM}${years.join(' ')}${RESET}`)
  }
  console.log()

  if (!apply) {
    console.log(`${found.length} examen(s) seraient importés.`)
    return
  }

  let ok = 0
  let failed = 0

  for (const item of found) {
    const label = `${item.filiereCode}/${item.subjectFolder}/${item.year}-${item.session}`

    const { data: filiere } = await db
      .from('filieres')
      .select('id')
      .eq('code', item.filiereCode)
      .maybeSingle()

    const { data: subject } = await db
      .from('subjects')
      .select('id')
      .eq('slug', item.subjectSlug)
      .maybeSingle()

    if (!filiere || !subject) {
      console.log(`${RED}✗${RESET} ${label} — filière ou matière absente de la base`)
      failed++
      continue
    }

    const { data: filiereSubject } = await db
      .from('filiere_subjects')
      .select('id, exam_duration_min')
      .eq('filiere_id', filiere.id)
      .eq('subject_id', subject.id)
      .maybeSingle()

    if (!filiereSubject) {
      console.log(`${RED}✗${RESET} ${label} — cette matière n'est pas au programme de cette filière`)
      failed++
      continue
    }

    const storagePath = `${item.filiereCode}/${item.subjectSlug}/${item.year}-${item.session}.pdf`
    const body = await readFile(item.file)

    const { error: uploadError } = await db.storage
      .from('exams')
      .upload(storagePath, body, { contentType: 'application/pdf', upsert: true })

    if (uploadError) {
      console.log(`${RED}✗${RESET} ${label} — upload: ${uploadError.message}`)
      failed++
      continue
    }

    const { data: existing } = await db
      .from('exams')
      .select('id, status')
      .eq('filiere_subject_id', filiereSubject.id)
      .eq('year', item.year)
      .eq('session', item.session)
      .maybeSingle()

    const payload = {
      filiere_subject_id: filiereSubject.id,
      year: item.year,
      session: item.session,
      duration_min: filiereSubject.exam_duration_min,
      subject_pdf_path: storagePath,
      digitisation: 'pdf',
    }

    if (existing) {
      // Never demote a published exam back to draft on a re-import.
      const { error } = await db.from('exams').update(payload).eq('id', existing.id)
      if (error) {
        console.log(`${RED}✗${RESET} ${label} — ${error.message}`)
        failed++
        continue
      }
      console.log(`${GREEN}✓${RESET} ${label} ${DIM}mis à jour (${item.sizeKB} KB)${RESET}`)
    } else {
      const { error } = await db.from('exams').insert({ ...payload, status: 'draft' })
      if (error) {
        console.log(`${RED}✗${RESET} ${label} — ${error.message}`)
        failed++
        continue
      }
      console.log(`${GREEN}✓${RESET} ${label} ${DIM}importé (${item.sizeKB} KB)${RESET}`)
    }

    ok++
  }

  console.log(`\n${ok} importé(s), ${failed} en échec.`)
  console.log(
    `\n${YELLOW}Tous en brouillon.${RESET} Un examen n'apparaît pour les élèves qu'une fois son corrigé écrit et publié.`,
  )
}

main().catch((error) => {
  console.error(`\n${RED}✗ ${error.message}${RESET}`)
  process.exit(1)
})
