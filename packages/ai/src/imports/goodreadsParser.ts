export interface ParsedBook {
  title: string
  author: string
  isbn?: string
  rating?: number
  status: 'READ' | 'READING' | 'WANT_TO_READ'
  dateRead?: Date
  pageCount?: number
}

function mapShelfToStatus(shelf: string): ParsedBook['status'] {
  const s = shelf.toLowerCase().trim()
  if (s === 'read') return 'READ'
  if (s === 'currently-reading') return 'READING'
  return 'WANT_TO_READ'
}

function parseIsbn(raw: string | undefined): string | undefined {
  if (!raw) return undefined
  // Goodreads wraps ISBNs in ="..." format
  const cleaned = raw.replace(/^="?|"?=$/g, '').replace(/"/g, '').replace(/-/g, '').trim()
  return cleaned.length >= 10 ? cleaned : undefined
}

function parseDate(raw: string | undefined): Date | undefined {
  if (!raw || raw.trim() === '') return undefined
  const d = new Date(raw.trim())
  return isNaN(d.getTime()) ? undefined : d
}

function parsePageCount(raw: string | undefined): number | undefined {
  if (!raw) return undefined
  const n = parseInt(raw.trim(), 10)
  return isNaN(n) || n <= 0 ? undefined : n
}

/**
 * Parse a Goodreads CSV export into ParsedBook[].
 *
 * Expected columns (Goodreads standard export):
 * Book Id, Title, Author, Author l-f, Additional Authors, ISBN, ISBN13,
 * My Rating, Average Rating, Publisher, Binding, Number of Pages,
 * Year Published, Original Publication Year, Date Read, Date Added,
 * Bookshelves, Bookshelves with positions, Exclusive Shelf,
 * My Review, Spoiler, Private Notes, Read Count, Owned Copies
 */
export function parseGoodreadsCSV(csvContent: string): ParsedBook[] {
  const lines = csvContent.split('\n')
  if (lines.length < 2) return []

  // Parse header
  const header = parseCSVLine(lines[0] ?? '')
  const col = (name: string): number => header.findIndex((h) => h.trim().toLowerCase() === name.toLowerCase())

  const titleIdx = col('Title')
  const authorIdx = col('Author')
  const isbnIdx = col('ISBN')
  const isbn13Idx = col('ISBN13')
  const ratingIdx = col('My Rating')
  const pagesIdx = col('Number of Pages')
  const dateReadIdx = col('Date Read')
  const shelfIdx = col('Exclusive Shelf')

  const books: ParsedBook[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]?.trim()
    if (!line) continue

    const cols = parseCSVLine(line)
    const title = cols[titleIdx]?.trim()
    const author = cols[authorIdx]?.trim()
    if (!title || !author) continue

    const isbn = parseIsbn(cols[isbn13Idx]) ?? parseIsbn(cols[isbnIdx])
    const ratingRaw = parseInt(cols[ratingIdx] ?? '0', 10)
    const rating = ratingRaw > 0 ? ratingRaw : undefined
    const pageCount = parsePageCount(cols[pagesIdx])
    const dateRead = parseDate(cols[dateReadIdx])
    const shelf = cols[shelfIdx] ?? 'to-read'
    const status = mapShelfToStatus(shelf)

    books.push({
      title,
      author,
      status,
      ...(isbn !== undefined ? { isbn } : {}),
      ...(rating !== undefined ? { rating } : {}),
      ...(dateRead !== undefined ? { dateRead } : {}),
      ...(pageCount !== undefined ? { pageCount } : {}),
    })
  }

  return books
}

/**
 * Minimal CSV line parser that handles quoted fields (including embedded commas and quotes).
 */
function parseCSVLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  fields.push(current)
  return fields
}
