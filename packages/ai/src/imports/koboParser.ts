import type { ParsedBook } from './goodreadsParser'

/**
 * Minimal CSV parser for Kobo CSV exports (no external dependencies).
 * Kobo CSV columns: Title, Author, ISBN, Series, Reading Status, Percent Read, Date Added
 */
function parseCSVLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  fields.push(current.trim())
  return fields
}

function mapReadingStatus(raw: string | undefined): ParsedBook['status'] {
  const s = (raw ?? '').toLowerCase().trim()
  if (s === 'finished' || s === 'read' || s === 'completed') return 'READ'
  if (s === 'in progress' || s === 'reading' || s === 'started') return 'READING'
  return 'WANT_TO_READ'
}

/**
 * Parse a Kobo CSV export (from kobo.com account → My Books → Export).
 *
 * Expected columns:
 * Title, Author, ISBN, Series, Reading Status, Percent Read, Date Added
 */
export function parseKoboCSV(csvContent: string): ParsedBook[] {
  const lines = csvContent.split('\n')
  if (lines.length < 2) return []

  const header = parseCSVLine(lines[0] ?? '').map((h) => h.toLowerCase())
  const idx = (name: string): number => header.indexOf(name.toLowerCase())

  const titleIdx = idx('title')
  const authorIdx = idx('author')
  const isbnIdx = idx('isbn')
  const statusIdx = idx('reading status')
  const percentIdx = idx('percent read')
  const dateAddedIdx = idx('date added')

  const books: ParsedBook[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]?.trim()
    if (!line) continue

    const cols = parseCSVLine(line)
    const title = titleIdx >= 0 ? cols[titleIdx]?.trim() : undefined
    const author = authorIdx >= 0 ? cols[authorIdx]?.trim() : undefined
    if (!title) continue

    const rawIsbn = isbnIdx >= 0 ? cols[isbnIdx]?.replace(/-/g, '').trim() : undefined
    const isbn = rawIsbn && rawIsbn.length >= 10 ? rawIsbn : undefined

    const status = mapReadingStatus(statusIdx >= 0 ? cols[statusIdx] : undefined)

    const percentRaw = percentIdx >= 0 ? parseInt(cols[percentIdx] ?? '0', 10) : 0
    const percent = isNaN(percentRaw) ? 0 : percentRaw

    // If percent is 100 but status doesn't say READ, reconcile
    const effectiveStatus: ParsedBook['status'] =
      percent >= 100 ? 'READ' : percent > 0 ? 'READING' : status

    const dateAddedRaw = dateAddedIdx >= 0 ? cols[dateAddedIdx]?.trim() : undefined
    const dateAdded = dateAddedRaw ? new Date(dateAddedRaw) : undefined

    const dateRead = effectiveStatus === 'READ' && dateAdded ? dateAdded : undefined
    books.push({
      title,
      author: author ?? 'Unknown',
      status: effectiveStatus,
      ...(isbn !== undefined ? { isbn } : {}),
      ...(dateRead !== undefined ? { dateRead } : {}),
    })
  }

  return books
}
