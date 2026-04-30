import axios from 'axios'

export interface BookMetadata {
  title?: string
  author?: string
  isbn?: string
  pageCount?: number
  coverUrl?: string
  publisher?: string
  publishedYear?: number
  description?: string
  genre?: string
  language?: string
  spineWidthMm?: number
  heightMm?: number
  depthMm?: number
  spineColor?: string
}

const BASE_URL = 'https://www.googleapis.com/books/v1/volumes'
const TIMEOUT_MS = 5000

function mapVolumeToMetadata(volume: Record<string, unknown>): BookMetadata {
  const info = (volume['volumeInfo'] ?? {}) as Record<string, unknown>
  const imageLinks = (info['imageLinks'] ?? {}) as Record<string, string>

  const identifiers = (info['industryIdentifiers'] as Array<Record<string, string>> | undefined) ?? []
  const isbn13 = identifiers.find((id) => id['type'] === 'ISBN_13')?.['identifier']
  const isbn10 = identifiers.find((id) => id['type'] === 'ISBN_10')?.['identifier']
  const isbn = isbn13 ?? isbn10

  const authors = info['authors'] as string[] | undefined
  const author = authors?.join(', ')

  const categories = info['categories'] as string[] | undefined
  const genre = categories?.[0]

  const publishedDate = info['publishedDate'] as string | undefined
  const publishedYear = publishedDate ? parseInt(publishedDate.slice(0, 4), 10) : undefined

  const coverUrl =
    imageLinks['extraLarge'] ??
    imageLinks['large'] ??
    imageLinks['medium'] ??
    imageLinks['thumbnail'] ??
    imageLinks['smallThumbnail']

  const title = (info['title'] as string | undefined)?.trim()
  const publisher = (info['publisher'] as string | undefined)?.trim()
  const description = (info['description'] as string | undefined)?.slice(0, 1000)
  const language = info['language'] as string | undefined
  const pageCount = info['pageCount'] as number | undefined
  const validPublishedYear = Number.isNaN(publishedYear ?? NaN) ? undefined : publishedYear

  return {
    ...(title !== undefined ? { title } : {}),
    ...(author !== undefined ? { author } : {}),
    ...(isbn !== undefined ? { isbn } : {}),
    ...(pageCount !== undefined ? { pageCount } : {}),
    ...(coverUrl !== undefined ? { coverUrl } : {}),
    ...(publisher !== undefined ? { publisher } : {}),
    ...(validPublishedYear !== undefined ? { publishedYear: validPublishedYear } : {}),
    ...(description !== undefined ? { description } : {}),
    ...(genre !== undefined ? { genre } : {}),
    ...(language !== undefined ? { language } : {}),
  }
}

export async function searchGoogleBooks(query: string): Promise<BookMetadata[]> {
  const apiKey = process.env['GOOGLE_BOOKS_API_KEY']
  if (!apiKey) {
    return []
  }

  try {
    const response = await axios.get<Record<string, unknown>>(BASE_URL, {
      params: { q: query, key: apiKey, maxResults: 5 },
      timeout: TIMEOUT_MS,
    })

    const items = response.data['items'] as Array<Record<string, unknown>> | undefined
    if (!items || items.length === 0) {
      return []
    }

    return items.map(mapVolumeToMetadata).filter((b) => Boolean(b.title))
  } catch {
    return []
  }
}

export async function getBookByISBN(isbn: string): Promise<BookMetadata | null> {
  const apiKey = process.env['GOOGLE_BOOKS_API_KEY']
  if (!apiKey) {
    return null
  }

  try {
    const response = await axios.get<Record<string, unknown>>(BASE_URL, {
      params: { q: `isbn:${isbn}`, key: apiKey, maxResults: 1 },
      timeout: TIMEOUT_MS,
    })

    const items = response.data['items'] as Array<Record<string, unknown>> | undefined
    if (!items || items.length === 0) {
      return null
    }

    const result = mapVolumeToMetadata(items[0]!)
    return result.title ? result : null
  } catch {
    return null
  }
}
