/**
 * Verifies that every internal link in the source resolves to a real page.
 *
 *     node scripts/check-routes.mjs
 *
 * Exists because the bottom tab bar shipped pointing at /tests, /examens and
 * /profil before those pages were written: three of five tabs returned 404 in
 * production. Nothing in the type system catches a `href` string that has no
 * page behind it, so check it explicitly.
 */
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const APP_DIR = path.join(ROOT, 'src', 'app')
const SRC_DIR = path.join(ROOT, 'src')

const GREEN = '\x1b[32m'
const RED = '\x1b[31m'
const YELLOW = '\x1b[33m'
const DIM = '\x1b[2m'
const RESET = '\x1b[0m'

/** Walks a directory, yielding every file path. */
async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue
      yield* walk(full)
    } else {
      yield full
    }
  }
}

/** Collects the route patterns the App Router actually serves. */
async function collectRoutes() {
  const routes = []

  for await (const file of walk(APP_DIR)) {
    const base = path.basename(file)
    if (base !== 'page.tsx' && base !== 'route.ts') continue

    const rel = path.relative(APP_DIR, path.dirname(file)).split(path.sep)
    const segments = rel
      // Route groups like (app) do not appear in the URL.
      .filter((s) => s && !(s.startsWith('(') && s.endsWith(')')))

    routes.push('/' + segments.join('/'))
  }

  return routes.map((r) => (r === '/' ? '/' : r.replace(/\/$/, '')))
}

/** Does `href` match a route pattern, treating [param] as a wildcard? */
function matches(href, pattern) {
  const h = href.split('/').filter(Boolean)
  const p = pattern.split('/').filter(Boolean)

  // Catch-all segments swallow the rest.
  const catchAll = p.findIndex((s) => s.startsWith('[...'))
  if (catchAll !== -1) return h.length >= catchAll

  if (h.length !== p.length) return false

  return p.every((seg, i) =>
    seg.startsWith('[') && seg.endsWith(']') ? true : seg === h[i],
  )
}

async function main() {
  const routes = await collectRoutes()

  const links = new Map() // href -> Set of files

  for await (const file of walk(SRC_DIR)) {
    if (!/\.(tsx|ts)$/.test(file)) continue
    const source = await readFile(file, 'utf8')

    // Plain string hrefs: href="/matieres"
    for (const m of source.matchAll(/href="(\/[^"]*)"/g)) {
      record(m[1], file)
    }

    // Paths built in server code, which no href scan would ever see. This is
    // how /auth/nouveau-mot-de-passe reached production as a 404: it existed
    // only inside a resetPasswordForEmail redirectTo, never as a link.
    //   redirectTo: `${origin}/auth/confirmer?next=/x`
    //   redirect('/accueil')   ·   url.pathname = '/connexion'
    const serverPatterns = [
      /(?:redirectTo|emailRedirectTo)\s*:\s*[`'"]\$\{[^}]*\}(\/[^`'"]*)[`'"]/g,
      /(?:redirectTo|emailRedirectTo)\s*:\s*[`'"](\/[^`'"]*)[`'"]/g,
      /\bredirect\(\s*[`'"](\/[^`'"$]*)[`'"]/g,
      /\bpathname\s*=\s*[`'"](\/[^`'"$]*)[`'"]/g,
    ]

    for (const pattern of serverPatterns) {
      for (const m of source.matchAll(pattern)) {
        const raw = m[1]
        record(raw.split('?')[0], file)

        // A `next=` / `suivant=` parameter is itself a route that must exist.
        const query = raw.includes('?') ? raw.slice(raw.indexOf('?') + 1) : ''
        for (const q of query.split('&')) {
          const [k, v] = q.split('=')
          if ((k === 'next' || k === 'suivant') && v?.startsWith('/')) {
            record(v, file)
          }
        }
      }
    }

    // Template literals: href={`/quiz/${id}`}. Only the static prefix before
    // the first interpolation is checkable, so it is matched as a prefix —
    // otherwise every dynamic link reads as broken.
    for (const m of source.matchAll(/href=\{`(\/[^`]*)`\}/g)) {
      const raw = m[1]
      const interpolated = raw.includes('${')
      const value = interpolated ? raw.slice(0, raw.indexOf('${')) : raw
      record(value, file, interpolated)
    }

    function record(raw, sourceFile, isPrefix = false) {
      const href = raw.split('#')[0].split('?')[0]
      if (!href.startsWith('/')) return
      const key = isPrefix ? `${href}*` : href
      const rel = path.relative(ROOT, sourceFile)
      if (!links.has(key)) links.set(key, new Set())
      links.get(key).add(rel)
    }
  }

  console.log(`${DIM}${routes.length} routes, ${links.size} distinct internal links${RESET}\n`)

  const broken = []
  for (const [key, files] of [...links].sort()) {
    const isPrefix = key.endsWith('*')
    const href = isPrefix ? key.slice(0, -1) : key

    const ok = isPrefix
      ? // A dynamic link only needs SOME route beginning with its static part.
        routes.some((r) => r.startsWith(href.replace(/\/$/, '')))
      : routes.some((r) => matches(href, r))

    if (!ok) broken.push([key, [...files]])
  }

  if (broken.length === 0) {
    console.log(`${GREEN}✓ tous les liens internes pointent vers une page existante${RESET}`)
    return
  }

  console.log(`${RED}✗ ${broken.length} lien(s) sans page correspondante:${RESET}\n`)
  for (const [href, files] of broken) {
    console.log(`  ${YELLOW}${href}${RESET}`)
    for (const f of files) console.log(`      ${DIM}${f}${RESET}`)
  }
  process.exit(1)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
