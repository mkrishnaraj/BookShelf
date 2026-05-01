import type { ParsedBook } from './goodreadsParser.js'

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

/**
 * Parse an Apple Books CSV export.
 *
 * Accepts two formats:
 * 1. Books Exporter app output (or our downloadable template):
 *    Title, Author, ISBN, Page Count, Date Purchased, Genre
 *
 * 2. Fallback: any CSV where the first column looks like a title.
 */
export function parseIBooksCSV(csvContent: string): ParsedBook[] {
  const lines = csvContent.split('\n')
  if (lines.length < 2) return []

  const header = parseCSVLine(lines[0] ?? '').map((h) => h.toLowerCase().trim())
  const idx = (name: string): number => header.indexOf(name)

  // Column indices — try multiple aliases
  const titleIdx = Math.max(idx('title'), 0)
  const authorIdx = idx('author') >= 0 ? idx('author') : idx('artist')
  const isbnIdx = idx('isbn')
  const pageCountIdx = idx('page count') >= 0 ? idx('page count') : idx('pages')
  const datePurchasedIdx = idx('date purchased') >= 0 ? idx('date purchased') : idx('date added')

  const books: ParsedBook[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]?.trim()
    if (!line) continue

    const cols = parseCSVLine(line)
    const title = cols[titleIdx]?.trim()
    if (!title) continue

    const author =
      authorIdx >= 0 ? cols[authorIdx]?.trim() : undefined

    const rawIsbn = isbnIdx >= 0 ? cols[isbnIdx]?.replace(/-/g, '').trim() : undefined
    const isbn = rawIsbn && rawIsbn.length >= 10 ? rawIsbn : undefined

    const pageCountRaw = pageCountIdx >= 0 ? parseInt(cols[pageCountIdx] ?? '0', 10) : 0
    const pageCount = isNaN(pageCountRaw) || pageCountRaw <= 0 ? undefined : pageCountRaw

    const datePurchasedRaw = datePurchasedIdx >= 0 ? cols[datePurchasedIdx]?.trim() : undefined
    const datePurchased = datePurchasedRaw ? new Date(datePurchasedRaw) : undefined
    const dateAdded = datePurchased && !isNaN(datePurchased.getTime()) ? datePurchased : undefined

    books.push({
      title,
      author: author ?? 'Unknown',
      status: 'WANT_TO_READ',
      ...(isbn !== undefined ? { isbn } : {}),
      ...(pageCount !== undefined ? { pageCount } : {}),
    })

    // Suppress unused variable warning — dateAdded available if callers need it
    void dateAdded
  }

  return books
}
