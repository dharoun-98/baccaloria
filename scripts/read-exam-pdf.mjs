/**
 * Extracts the text of an exam PDF, so a corrigé can be written from the real
 * paper rather than from memory.
 *
 *     node scripts/read-exam-pdf.mjs "Bac exams/PC/Math/Normal/examen-2024-normale.pdf"
 *
 * Prints page by page. If a paper comes out empty it is a scan (an image, not
 * text) and would need OCR — which is worth knowing immediately rather than
 * guessing at its contents.
 */
import { readFile } from 'node:fs/promises'
import path from 'node:path'

const file = process.argv[2]

if (!file) {
  console.error('Usage: node scripts/read-exam-pdf.mjs <chemin/vers/fichier.pdf>')
  process.exit(1)
}

const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs')

const data = new Uint8Array(await readFile(path.resolve(file)))
const pdf = await getDocument({ data, useSystemFonts: true }).promise

console.log(`${path.basename(file)} — ${pdf.numPages} page(s)\n`)

let totalChars = 0

for (let n = 1; n <= pdf.numPages; n++) {
  const page = await pdf.getPage(n)
  const content = await page.getTextContent()

  // Group items into lines by their vertical position, otherwise the output is
  // a stream of fragments with no structure.
  const lines = new Map()
  for (const item of content.items) {
    if (!('str' in item)) continue
    const y = Math.round(item.transform[5])
    if (!lines.has(y)) lines.set(y, [])
    lines.get(y).push({ x: item.transform[4], str: item.str })
  }

  const text = [...lines.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([, parts]) =>
      parts
        .sort((a, b) => a.x - b.x)
        .map((p) => p.str)
        .join('')
        .trim(),
    )
    .filter(Boolean)
    .join('\n')

  totalChars += text.length

  console.log(`${'='.repeat(70)}\nPAGE ${n}\n${'='.repeat(70)}`)
  console.log(text || '(aucun texte — page probablement scannée)')
  console.log()
}

if (totalChars < 200) {
  console.error(
    '\n⚠ Très peu de texte extrait : ce PDF est probablement un scan. Une OCR serait nécessaire.',
  )
}
