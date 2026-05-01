import type { ParsedBook } from './goodreadsParser'

interface PlayBooksVolumeInfo {
  title?: string
  authors?: string[]
  pageCount?: number
  industryIdentifiers?: Array<{ type: string; identifier: string }>
}

interface PlayBooksItem {
  volume?: {
    volumeInfo?: PlayBooksVolumeInfo
  }
}

interface PlayBooksExport {
  items?: PlayBooksItem[]
}

// Format B: individual metadata JSON file per book
interface PlayBooksMetadataFile {
  title?: string
  authors?: string[] | string
  pageCount?: number
  isbn?: string
  industryIdentifiers?: Array<{ type: string; identifier: string }>
}

function extractIsbn(identifiers?: Array<{ type: string; identifier: string }>): string | undefined {
  if (!identifiers) return undefined
  return (
    identifiers.find((id) => id.type === 'ISBN_13')?.identifier ??
    identifiers.find((id) => id.type === 'ISBN_10')?.identifier
  )
}

/**
 * Parse a Google Play Books export from Google Takeout.
 *
 * Supports two formats:
 *   A) purchased_books.json  — { items: [{ volume: { volumeInfo: {...} } }] }
 *   B) Individual book metadata .json files from the Metadata/ folder
 */
export function parseGooglePlayExport(jsonContent: string): ParsedBook[] {
  let data: unknown
  try {
    data = JSON.parse(jsonContent)
  } catch {
    return []
  }

  if (!data || typeof data !== 'object') return []

  // Format A: purchased_books.json
  const maybeExport = data as PlayBooksExport
  if (Array.isArray(maybeExport.items)) {
    const books: ParsedBook[] = []
    for (const item of maybeExport.items) {
      const info = item.volume?.volumeInfo
      if (!info?.title) continue
      const isbn = extractIsbn(info.industryIdentifiers)
      const pageCount = info.pageCount && info.pageCount > 0 ? info.pageCount : undefined
      books.push({
        title: info.title.trim(),
        author: info.authors?.join(', ') ?? 'Unknown',
        status: 'WANT_TO_READ',
        ...(isbn !== undefined ? { isbn } : {}),
        ...(pageCount !== undefined ? { pageCount } : {}),
      })
    }
    return books
  }

  // Format B: individual metadata file
  const meta = data as PlayBooksMetadataFile
  if (meta.title) {
    const authors = Array.isArray(meta.authors)
      ? meta.authors.join(', ')
      : typeof meta.authors === 'string'
        ? meta.authors
        : 'Unknown'

    const isbn = meta.isbn ?? extractIsbn(meta.industryIdentifiers)
    const pageCount = meta.pageCount && meta.pageCount > 0 ? meta.pageCount : undefined
    return [
      {
        title: meta.title.trim(),
        author: authors,
        status: 'WANT_TO_READ',
        ...(isbn !== undefined ? { isbn } : {}),
        ...(pageCount !== undefined ? { pageCount } : {}),
      },
    ]
  }

  return []
}
