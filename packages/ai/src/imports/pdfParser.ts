import type { ParsedBook } from './goodreadsParser'

interface PdfInfo {
  Title?: string
  Author?: string
  numpages?: number
  [key: string]: unknown
}

interface PdfParseResult {
  info: PdfInfo
  numpages: number
  text: string
}

/**
 * Parse metadata from a PDF buffer.
 *
 * Uses pdf-parse to extract the PDF Info dictionary (Title, Author)
 * and page count. Falls back to reading the first line of text if
 * the Title metadata field is not populated.
 */
export async function parsePDF(buffer: Buffer): Promise<ParsedBook | null> {
  try {
    // Dynamically import pdf-parse (CJS module)
    const pdfParse = (await import('pdf-parse')).default as (
      buffer: Buffer,
      options?: Record<string, unknown>,
    ) => Promise<PdfParseResult>

    const data = await pdfParse(buffer, { max: 3 })

    const info = data.info ?? {}
    let title = typeof info.Title === 'string' ? info.Title.trim() : undefined
    const author = typeof info.Author === 'string' ? info.Author.trim() : undefined

    // Fall back to first non-empty line of extracted text
    if (!title && data.text) {
      const firstLine = data.text
        .split('\n')
        .map((l: string) => l.trim())
        .find((l: string) => l.length > 3 && l.length < 200)
      title = firstLine
    }

    if (!title) return null

    const pageCount = data.numpages > 0 ? data.numpages : undefined

    return {
      title,
      author: author ?? 'Unknown',
      status: 'WANT_TO_READ',
      ...(pageCount !== undefined ? { pageCount } : {}),
    }
  } catch {
    return null
  }
}
