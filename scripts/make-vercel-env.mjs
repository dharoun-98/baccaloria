/**
 * Produces .env.vercel.local — a file whose KEY NAMES are guaranteed to match
 * what the code actually reads, with values copied from .env.local and
 * NEXT_PUBLIC_SITE_URL rewritten to the production URL.
 *
 *     node scripts/make-vercel-env.mjs https://baccaloria.vercel.app
 *
 * Import the result with Vercel's "Import .env" button so the names cannot be
 * mistyped. Values are never printed to the terminal — only key names and
 * whether each one was found.
 *
 * The output is gitignored via the .env*.local rule.
 */
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/** The exact names read by the application. Source of truth. */
const REQUIRED = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_SITE_URL',
  'NEXT_PUBLIC_WHATSAPP_NUMBER',
  'NEXT_PUBLIC_BANK_NAME',
  'NEXT_PUBLIC_BANK_ACCOUNT_HOLDER',
  'NEXT_PUBLIC_BANK_RIB',
  'NEXT_PUBLIC_CASHPLUS_NUMBER',
]

const siteUrl = (process.argv[2] ?? '').replace(/\/+$/, '')
if (!siteUrl.startsWith('http')) {
  console.error('Usage: node scripts/make-vercel-env.mjs https://your-app.vercel.app')
  process.exit(1)
}

const raw = await readFile(path.join(ROOT, '.env.local'), 'utf8')

const values = new Map()
for (const line of raw.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eq = trimmed.indexOf('=')
  if (eq === -1) continue
  values.set(trimmed.slice(0, eq).trim(), trimmed.slice(eq + 1).trim())
}

const lines = []
const missing = []

for (const key of REQUIRED) {
  const value = key === 'NEXT_PUBLIC_SITE_URL' ? siteUrl : (values.get(key) ?? '')
  if (!value && key !== 'NEXT_PUBLIC_SITE_URL') missing.push(key)
  lines.push(`${key}=${value}`)
}

const out = path.join(ROOT, '.env.vercel.local')
await writeFile(out, lines.join('\n') + '\n', 'utf8')

console.log(`Wrote ${path.relative(ROOT, out)}\n`)
for (const key of REQUIRED) {
  const value = key === 'NEXT_PUBLIC_SITE_URL' ? siteUrl : values.get(key)
  const status = value ? `ok (${key === 'NEXT_PUBLIC_SITE_URL' ? siteUrl : `${value.length} chars`})` : 'EMPTY'
  console.log(`  ${value ? '✓' : '·'} ${key.padEnd(32)} ${status}`)
}

if (missing.length) {
  console.log(`\n⚠ empty in .env.local: ${missing.join(', ')}`)
}
console.log('\nImport this file in Vercel: Environment Variables → Import .env')
