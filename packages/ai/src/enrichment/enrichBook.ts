import { searchGoogleBooks, getBookByISBN } from './googleBooks'
import { searchOpenLibrary, getOpenLibraryBook } from './openLibrary'
import { calculateBookDimensions } from './bookDimensions'
import { extractCoverColors } from './coverColor'

export type { BookMetadata } from './googleBooks'
import type { BookMetadata } from './googleBooks'

// In-memory cache: isbn or "title|author" → enriched metadata
const cache = new Map<string, BookMetadata>()

function cacheKey(partial: Partial<BookMetadata>): string {
  if (partial.isbn) return `isbn:${partial.isbn}`
  const title = (partial.title ?? '').toLowerCase().trim()
  const author = (partial.author ?? '').toLowerCase().trim()
  return `q:${title}|${author}`
}

function mergeMetadata(base: BookMetadata, override: BookMetadata): BookMetadata {
  const merged: BookMetadata = { ...base }
  for (const key of Object.keys(override) as Array<keyof BookMetadata>) {
    const val = override[key]
    if (val !== undefined && val !== null && val !== '') {
      // Prefer Google Books data (base), only fill gaps with override
      if (merged[key] === undefined || merged[key] === null || merged[key] === '') {
        // TypeScript needs a cast here since keys are generic
        ;(merged as Record<string, unknown>)[key] = val
      }
    }
  }
  return merged
}

export async function enrichBook(partial: Partial<BookMetadata>): Promise<BookMetadata> {
  const key = cacheKey(partial)
  const cached = cache.get(key)
  if (cached) return cached

  let metadata: BookMetadata = {
    ...(partial.title !== undefined ? { title: partial.title } : {}),
    ...(partial.author !== undefined ? { author: partial.author } : {}),
    ...(partial.isbn !== undefined ? { isbn: partial.isbn } : {}),
    ...(partial.pageCount !== undefined ? { pageCount: partial.pageCount } : {}),
    ...(partial.coverUrl !== undefined ? { coverUrl: partial.coverUrl } : {}),
    ...(partial.publisher !== undefined ? { publisher: partial.publisher } : {}),
    ...(partial.publishedYear !== undefined ? { publishedYear: partial.publishedYear } : {}),
    ...(partial.description !== undefined ? { description: partial.description } : {}),
    ...(partial.genre !== undefined ? { genre: partial.genre } : {}),
    ...(partial.language !== undefined ? { language: partial.language } : {}),
  }

  // Step 1: ISBN-based lookup (most accurate)
  if (partial.isbn) {
    const [googleResult, olResult] = await Promise.all([
      getBookByISBN(partial.isbn),
      getOpenLibraryBook(partial.isbn),
    ])

    if (googleResult) {
      metadata = mergeMetadata(googleResult, metadata)
      // Fill gaps from Open Library
      if (olResult) {
        metadata = mergeMetadata(metadata, olResult)
      }
    } else if (olResult) {
      metadata = mergeMetadata(olResult, metadata)
    }
  } else {
    // Step 2: Title/author search
    const query = [partial.title, partial.author].filter(Boolean).join(' ')

    if (query.trim()) {
      const [googleResults, olResult] = await Promise.all([
        searchGoogleBooks(query),
        searchOpenLibrary(partial.title ?? '', partial.author),
      ])

      const googleTop = googleResults[0]
      if (googleTop) {
        metadata = mergeMetadata(googleTop, metadata)
      }
      if (olResult) {
        metadata = mergeMetadata(metadata, olResult)
      }
    }
  }

  // Step 3: Calculate physical dimensions
  if (metadata.pageCount && metadata.pageCount > 0) {
    const dims = calculateBookDimensions(metadata.pageCount, 'paperback')
    metadata.spineWidthMm = dims.spineWidthMm
    metadata.heightMm = dims.heightMm
    metadata.depthMm = dims.depthMm
  } else {
    // Fallback dimensions for ~300 page book
    const dims = calculateBookDimensions(300, 'paperback')
    metadata.spineWidthMm = dims.spineWidthMm
    metadata.heightMm = dims.heightMm
    metadata.depthMm = dims.depthMm
  }

  // Step 4: Extract spine color from cover
  if (metadata.coverUrl) {
    const palette = await extractCoverColors(metadata.coverUrl)
    metadata.spineColor = palette.dominant
  } else {
    // Genre-based fallback palette
    metadata.spineColor = genreFallbackColor(metadata.genre)
  }

  cache.set(key, metadata)
  return metadata
}

function genreFallbackColor(genre?: string): string {
  if (!genre) return '#8B7355'
  const g = genre.toLowerCase()
  if (g.includes('fiction') || g.includes('novel')) return '#4A6741'
  if (g.includes('science') || g.includes('tech')) return '#2E5B8C'
  if (g.includes('history') || g.includes('biography')) return '#7A4F2D'
  if (g.includes('mystery') || g.includes('thriller')) return '#2D2D3A'
  if (g.includes('romance')) return '#A0394B'
  if (g.includes('fantasy') || g.includes('magic')) return '#5B3E7A'
  return '#8B7355'
}
