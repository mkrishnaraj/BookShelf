import type { ParsedBook } from './goodreadsParser'

interface KindleItem {
  title?: string
  authors?: string
  asin?: string
  acquiredDate?: string
  lastPageRead?: number
  numberOfPages?: number
  percentRead?: number
  mangaOrComicAsin?: boolean
}

/**
 * Parse an Amazon "Request My Data" Kindle library export (JSON array).
 * File: Kindle.Libraries.json (inside the downloaded ZIP).
 */
export function parseKindleExport(jsonContent: string): ParsedBook[] {
  let items: unknown
  try {
    items = JSON.parse(jsonContent)
  } catch {
    return []
  }

  if (!Array.isArray(items)) return []

  const books: ParsedBook[] = []

  for (const raw of items) {
    const item = raw as KindleItem
    // Skip manga / comics
    if (item.mangaOrComicAsin) continue

    const title = item.title?.trim()
    const author = item.authors?.trim()
    if (!title) continue

    let status: ParsedBook['status'] = 'WANT_TO_READ'
    let percentRead: number | undefined

    if (typeof item.percentRead === 'number' && item.percentRead > 0) {
      percentRead = item.percentRead
    } else if (
      typeof item.lastPageRead === 'number' &&
      typeof item.numberOfPages === 'number' &&
      item.numberOfPages > 0
    ) {
      percentRead = Math.round((item.lastPageRead / item.numberOfPages) * 100)
    }

    if (percentRead !== undefined) {
      if (percentRead >= 95) {
        status = 'READ'
      } else if (percentRead > 0) {
        status = 'READING'
      }
    }

    const pageCount = item.numberOfPages && item.numberOfPages > 0 ? item.numberOfPages : undefined
    const dateRead = status === 'READ' && item.acquiredDate ? new Date(item.acquiredDate) : undefined

    books.push({
      title,
      author: author ?? 'Unknown',
      status,
      ...(pageCount !== undefined ? { pageCount } : {}),
      ...(dateRead !== undefined ? { dateRead } : {}),
    })
  }

  return books
}
