import { parseGoodreadsCSV, type ParsedBook } from './goodreadsParser'
import { parseKindleExport } from './kindleParser'
import { parseGooglePlayExport } from './googlePlayParser'
import { parseKoboCSV } from './koboParser'
import { parseIBooksCSV } from './iBooksParser'
import { parseEpub } from './epubParser'
import { parsePDF } from './pdfParser'

export type ImportFormat =
  | 'goodreads'
  | 'kindle'
  | 'google-play'
  | 'kobo'
  | 'ibooks'
  | 'epub'
  | 'pdf'

export type { ParsedBook }

/**
 * Detect import format by filename extension and content sniffing.
 */
export async function detectFormat(filename: string, content: Buffer): Promise<ImportFormat> {
  const name = filename.toLowerCase()

  // Extension-based detection first
  if (name.endsWith('.epub')) return 'epub'
  if (name.endsWith('.pdf')) return 'pdf'

  // CSV files — sniff headers
  if (name.endsWith('.csv') || name.endsWith('.txt')) {
    return detectCSVFormat(content)
  }

  // JSON files
  if (name.endsWith('.json')) {
    return detectJSONFormat(content)
  }

  // No extension match — try content sniffing
  const header = content.slice(0, 8)

  // EPUB magic bytes: PK (ZIP header)
  if (header[0] === 0x50 && header[1] === 0x4b) {
    // Could be EPUB or any ZIP — check for epub mimetype signature
    const preview = content.slice(0, 256).toString('ascii')
    if (preview.includes('epub')) return 'epub'
    return 'epub'
  }

  // PDF magic bytes: %PDF
  if (header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44 && header[3] === 0x46) {
    return 'pdf'
  }

  // Try JSON
  const text = content.toString('utf-8').trimStart()
  if (text.startsWith('{') || text.startsWith('[')) {
    return detectJSONFormat(content)
  }

  // Assume CSV as last resort
  return detectCSVFormat(content)
}

function detectCSVFormat(content: Buffer): ImportFormat {
  const text = content.toString('utf-8')
  const firstLine = text.split('\n')[0]?.toLowerCase() ?? ''

  // Goodreads: has "book id" and "exclusive shelf" columns
  if (firstLine.includes('book id') && firstLine.includes('exclusive shelf')) {
    return 'goodreads'
  }

  // Kobo: has "reading status" and "percent read" columns
  if (firstLine.includes('reading status') && firstLine.includes('percent read')) {
    return 'kobo'
  }

  // iBooks: has "date purchased" or explicit ibooks marker
  if (firstLine.includes('date purchased') || firstLine.includes('ibooks')) {
    return 'ibooks'
  }

  // Goodreads fallback: "my rating" is fairly unique
  if (firstLine.includes('my rating') && firstLine.includes('bookshelves')) {
    return 'goodreads'
  }

  // Default to iBooks template (our generic CSV format)
  return 'ibooks'
}

function detectJSONFormat(content: Buffer): ImportFormat {
  const text = content.toString('utf-8').trimStart()

  try {
    const data = JSON.parse(text) as unknown

    // Kindle export: JSON array with asin fields
    if (Array.isArray(data)) {
      const first = data[0] as Record<string, unknown> | undefined
      if (first && ('asin' in first || 'ASIN' in first)) {
        return 'kindle'
      }
    }

    // Google Play: { items: [...] } with volume objects
    if (
      data !== null &&
      typeof data === 'object' &&
      !Array.isArray(data) &&
      'items' in (data as Record<string, unknown>)
    ) {
      return 'google-play'
    }

    // Google Play individual metadata file
    if (
      data !== null &&
      typeof data === 'object' &&
      !Array.isArray(data) &&
      'title' in (data as Record<string, unknown>)
    ) {
      return 'google-play'
    }
  } catch {
    // Not valid JSON
  }

  return 'kindle'
}

/**
 * Parse the content using the detected (or specified) format.
 * Always returns an array — never throws.
 */
export async function parseImport(format: ImportFormat, content: Buffer): Promise<ParsedBook[]> {
  try {
    switch (format) {
      case 'goodreads':
        return parseGoodreadsCSV(content.toString('utf-8'))

      case 'kindle':
        return parseKindleExport(content.toString('utf-8'))

      case 'google-play':
        return parseGooglePlayExport(content.toString('utf-8'))

      case 'kobo':
        return parseKoboCSV(content.toString('utf-8'))

      case 'ibooks':
        return parseIBooksCSV(content.toString('utf-8'))

      case 'epub': {
        const book = await parseEpub(content)
        return book ? [book] : []
      }

      case 'pdf': {
        const book = await parsePDF(content)
        return book ? [book] : []
      }

      default:
        return []
    }
  } catch {
    return []
  }
}
