import axios from 'axios'
import type { BookMetadata } from './googleBooks'

const BASE_URL = 'https://openlibrary.org'
const TIMEOUT_MS = 5000

function coverUrl(coverId: number | undefined, size: 'S' | 'M' | 'L' = 'L'): string | undefined {
  if (!coverId) return undefined
  return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`
}

function extractIsbn(record: Record<string, unknown>): string | undefined {
  const isbns13 = record['isbn_13'] as string[] | undefined
  const isbns10 = record['isbn_10'] as string[] | undefined
  return isbns13?.[0] ?? isbns10?.[0]
}

export async function searchOpenLibrary(title: string, author?: string): Promise<BookMetadata | null> {
  try {
    const query = author ? `${title} ${author}` : title
    const response = await axios.get<Record<string, unknown>>(`${BASE_URL}/search.json`, {
      params: { q: query, limit: 1 },
      timeout: TIMEOUT_MS,
    })

    const docs = response.data['docs'] as Array<Record<string, unknown>> | undefined
    if (!docs || docs.length === 0) return null

    const doc = docs[0]!
    const authorNames = doc['author_name'] as string[] | undefined
    const coverIdRaw = doc['cover_i'] as number | undefined

    const publishYear = doc['first_publish_year'] as number | undefined

    const docTitle = (doc['title'] as string | undefined)?.trim()
    const docAuthor = authorNames?.join(', ')
    const isbn = extractIsbn(doc)
    const pageCount = doc['number_of_pages_median'] as number | undefined
    const cover = coverUrl(coverIdRaw)
    const publisher = (doc['publisher'] as string[] | undefined)?.[0]
    const genre = (doc['subject'] as string[] | undefined)?.[0]
    const language = (doc['language'] as string[] | undefined)?.[0]

    return {
      ...(docTitle !== undefined ? { title: docTitle } : {}),
      ...(docAuthor !== undefined ? { author: docAuthor } : {}),
      ...(isbn !== undefined ? { isbn } : {}),
      ...(pageCount !== undefined ? { pageCount } : {}),
      ...(cover !== undefined ? { coverUrl: cover } : {}),
      ...(publisher !== undefined ? { publisher } : {}),
      ...(publishYear !== undefined ? { publishedYear: publishYear } : {}),
      ...(genre !== undefined ? { genre } : {}),
      ...(language !== undefined ? { language } : {}),
    }
  } catch {
    return null
  }
}

export async function getOpenLibraryBook(isbn: string): Promise<BookMetadata | null> {
  try {
    const url = `${BASE_URL}/api/books`
    const bibkey = `ISBN:${isbn}`
    const response = await axios.get<Record<string, unknown>>(url, {
      params: { bibkeys: bibkey, format: 'json', jscmd: 'data' },
      timeout: TIMEOUT_MS,
    })

    const entry = response.data[bibkey] as Record<string, unknown> | undefined
    if (!entry) return null

    const authorsRaw = entry['authors'] as Array<Record<string, string>> | undefined
    const author = authorsRaw?.map((a) => a['name']).filter(Boolean).join(', ')

    const publishers = entry['publishers'] as Array<Record<string, string>> | undefined
    const publisher = publishers?.[0]?.['name']

    const coverId = (entry['cover'] as Record<string, string> | undefined)?.['large']
      ?? (entry['cover'] as Record<string, string> | undefined)?.['medium']

    const identifiers = entry['identifiers'] as Record<string, string[]> | undefined
    const isbn13 = identifiers?.['isbn_13']?.[0] ?? identifiers?.['isbn_10']?.[0] ?? isbn

    const publishDateRaw = entry['publish_date'] as string | undefined
    const yearMatch = publishDateRaw?.match(/\d{4}/)
    const publishedYear = yearMatch ? parseInt(yearMatch[0]!, 10) : undefined

    const title = (entry['title'] as string | undefined)?.trim()
    const pageCount = entry['number_of_pages'] as number | undefined
    const description = (entry['excerpts'] as Array<Record<string, string>> | undefined)?.[0]?.['text']

    return {
      ...(title !== undefined ? { title } : {}),
      ...(author !== undefined ? { author } : {}),
      isbn: isbn13,
      ...(pageCount !== undefined ? { pageCount } : {}),
      ...(coverId !== undefined ? { coverUrl: coverId } : {}),
      ...(publisher !== undefined ? { publisher } : {}),
      ...(publishedYear !== undefined ? { publishedYear } : {}),
      ...(description !== undefined ? { description } : {}),
    }
  } catch {
    return null
  }
}
