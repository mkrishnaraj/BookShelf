import { Router, Request, Response, NextFunction } from 'express'
import multer from 'multer'
import { z } from 'zod'
import rateLimit from 'express-rate-limit'
import { prisma } from '../lib/prisma.js'
import { getUserId } from '../middleware/auth.js'
import { checkBookLimit } from '../middleware/planLimits.js'
import { validateBody, validateParams, validateQuery } from '../middleware/validate.js'
import {
  enrichBook,
  calculateBookDimensions,
  parseGoodreadsCSV,
  detectFormat,
  parseImport,
  type BookMetadata,
  type ParsedBook,
} from 'ai'

const router: Router = Router()

const searchRateLimit = rateLimit({ windowMs: 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false, message: { error: { code: 'RATE_LIMITED', message: 'Too many search requests. Please wait a minute.' } } })
const importRateLimit = rateLimit({ windowMs: 60 * 1000, max: 3, standardHeaders: true, legacyHeaders: false, message: { error: { code: 'RATE_LIMITED', message: 'Too many import requests. Please wait a minute.' } } })

// ─── Multer ───────────────────────────────────────────────────────────────────

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/json',
      'application/zip',
      'application/epub+zip',
      'application/pdf',
      'text/csv',
      'text/plain',
      'application/octet-stream',
      'image/jpeg',
      'image/png',
      'image/heic',
      'image/webp',
    ]
    if (allowed.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`))
    }
  },
})

// ─── Schemas ──────────────────────────────────────────────────────────────────

const shelfIdParam = z.object({ shelfId: z.string().min(1) })
const bookIdParam = z.object({ id: z.string().min(1) })

const addBookBody = z.object({
  title: z.string().min(1).max(500),
  author: z.string().min(1).max(300),
  isbn: z.string().optional(),
  pageCount: z.number().int().positive().optional(),
  coverUrl: z.string().url().optional(),
  publisher: z.string().optional(),
  publishedYear: z.number().int().optional(),
  description: z.string().max(2000).optional(),
  genre: z.string().optional(),
  language: z.string().default('en'),
  source: z
    .enum(['MANUAL', 'GOODREADS', 'GOOGLE_BOOKS', 'KINDLE', 'GOOGLE_PLAY', 'KOBO', 'IBOOKS', 'EPUB', 'PDF', 'CAMERA_SCAN'])
    .default('MANUAL'),
  positionOnShelf: z.number().int().optional(),
  spineColor: z.string().optional(),
  spineWidthMm: z.number().optional(),
  heightMm: z.number().optional(),
})

const updateBookBody = z.object({
  title: z.string().min(1).max(500).optional(),
  author: z.string().min(1).max(300).optional(),
  isbn: z.string().optional(),
  pageCount: z.number().int().positive().optional(),
  coverUrl: z.string().url().optional(),
  publisher: z.string().optional(),
  publishedYear: z.number().int().optional(),
  description: z.string().max(2000).optional(),
  genre: z.string().optional(),
  language: z.string().optional(),
  status: z.enum(['WANT_TO_READ', 'READING', 'READ', 'DID_NOT_FINISH']).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  positionOnShelf: z.number().int().optional(),
  shelfId: z.string().optional(),
  spineColor: z.string().optional(),
  spineWidthMm: z.number().optional(),
  heightMm: z.number().optional(),
})

const progressBody = z.object({
  percentRead: z.number().int().min(0).max(100).optional(),
  status: z.enum(['WANT_TO_READ', 'READING', 'READ', 'DID_NOT_FINISH']).optional(),
  startedAt: z.string().datetime().optional(),
  finishedAt: z.string().datetime().optional(),
  rating: z.number().int().min(1).max(5).optional(),
})

const listBooksQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  status: z.enum(['WANT_TO_READ', 'READING', 'READ', 'DID_NOT_FINISH']).optional(),
  search: z.string().optional(),
})

const searchQuery = z.object({
  q: z.string().min(1),
  source: z.enum(['google', 'openlibrary', 'all']).default('all'),
  limit: z.coerce.number().int().min(1).max(20).default(10),
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function resolveUserId(clerkId: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) throw new Error('USER_NOT_FOUND')
  return user.id
}

async function assertShelfOwnership(shelfId: string, userId: string): Promise<void> {
  const shelf = await prisma.shelf.findFirst({
    where: { id: shelfId, userId },
    select: { id: true },
  })
  if (!shelf) throw new Error('SHELF_NOT_FOUND')
}

async function assertBookOwnership(bookId: string, userId: string): Promise<void> {
  const book = await prisma.book.findFirst({
    where: { id: bookId, userId },
    select: { id: true },
  })
  if (!book) throw new Error('BOOK_NOT_FOUND')
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET /api/v1/shelves/:shelfId/books
router.get(
  '/shelves/:shelfId/books',
  validateParams(shelfIdParam),
  validateQuery(listBooksQuery),
  async (req, res) => {
    try {
      const clerkId = getUserId(req)
      const userId = await resolveUserId(clerkId)
      await assertShelfOwnership(req.params['shelfId']!, userId)

      const query = (req as typeof req & { validatedQuery: z.infer<typeof listBooksQuery> }).validatedQuery

      const where: Record<string, unknown> = { shelfId: req.params['shelfId'] }
      if (query.status) where['status'] = query.status
      if (query.search) {
        where['OR'] = [
          { title: { contains: query.search, mode: 'insensitive' } },
          { author: { contains: query.search, mode: 'insensitive' } },
        ]
      }

      const [books, total] = await Promise.all([
        prisma.book.findMany({
          where,
          skip: (query.page - 1) * query.limit,
          take: query.limit,
          orderBy: [{ positionOnShelf: 'asc' }, { createdAt: 'asc' }],
        }),
        prisma.book.count({ where }),
      ])

      res.json({ data: { books, total, page: query.page, limit: query.limit } })
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      if (msg === 'USER_NOT_FOUND') {
        res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found.' } })
        return
      }
      if (msg === 'SHELF_NOT_FOUND') {
        res.status(404).json({ error: { code: 'SHELF_NOT_FOUND', message: 'Shelf not found.' } })
        return
      }
      console.error('[GET /shelves/:shelfId/books]', { err })
      res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to list books.' } })
    }
  }
)

// POST /api/v1/shelves/:shelfId/books — add book
router.post(
  '/shelves/:shelfId/books',
  validateParams(shelfIdParam),
  checkBookLimit,
  validateBody(addBookBody),
  async (req, res) => {
    try {
      const clerkId = getUserId(req)
      const userId = await resolveUserId(clerkId)
      await assertShelfOwnership(req.params['shelfId']!, userId)

      const body = req.body as z.infer<typeof addBookBody>

      // Enrich the book with metadata from Google Books / Open Library.
      // Always succeeds — failures return an empty object so the save still works.
      // Conditional spread avoids passing `undefined` for exactOptionalPropertyTypes.
      const enriched = await enrichBook({
        title: body.title,
        author: body.author,
        ...(body.isbn !== undefined ? { isbn: body.isbn } : {}),
        ...(body.pageCount !== undefined ? { pageCount: body.pageCount } : {}),
      }).catch(() => ({}) as BookMetadata)

      // Calculate physical dimensions using enriched or original page count.
      const dims = calculateBookDimensions(enriched.pageCount ?? body.pageCount ?? 250)

      const book = await prisma.book.create({
        data: {
          userId,
          shelfId: req.params['shelfId'],
          // Start with manually supplied values, then overwrite with enriched data
          // so that API-sourced metadata fills any gaps the user left blank.
          title: enriched.title ?? body.title,
          author: enriched.author ?? body.author,
          isbn: enriched.isbn ?? body.isbn,
          pageCount: enriched.pageCount ?? body.pageCount,
          coverUrl: enriched.coverUrl ?? body.coverUrl,
          publisher: enriched.publisher ?? body.publisher,
          publishedYear: enriched.publishedYear ?? body.publishedYear,
          description: enriched.description ?? body.description,
          genre: enriched.genre ?? body.genre,
          language: enriched.language ?? body.language,
          source: body.source,
          positionOnShelf: body.positionOnShelf,
          spineColor: enriched.spineColor ?? body.spineColor,
          spineWidthMm: dims.spineWidthMm ?? body.spineWidthMm,
          heightMm: dims.heightMm ?? body.heightMm,
          depthMm: dims.depthMm,
        },
      })

      res.status(201).json({ data: book })
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      if (msg === 'USER_NOT_FOUND') {
        res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found.' } })
        return
      }
      if (msg === 'SHELF_NOT_FOUND') {
        res.status(404).json({ error: { code: 'SHELF_NOT_FOUND', message: 'Shelf not found.' } })
        return
      }
      console.error('[POST /shelves/:shelfId/books]', { err })
      res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to add book.' } })
    }
  }
)

// PATCH /api/v1/books/:id — update book
router.patch(
  '/books/:id',
  validateParams(bookIdParam),
  validateBody(updateBookBody),
  async (req, res) => {
    try {
      const clerkId = getUserId(req)
      const userId = await resolveUserId(clerkId)
      await assertBookOwnership(req.params['id']!, userId)

      const body = req.body as z.infer<typeof updateBookBody>

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const book = await prisma.book.update({
        where: { id: req.params['id'] },
        data: body as any,
      })

      res.json({ data: book })
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      if (msg === 'BOOK_NOT_FOUND') {
        res.status(404).json({ error: { code: 'BOOK_NOT_FOUND', message: 'Book not found.' } })
        return
      }
      console.error('[PATCH /books/:id]', { err })
      res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to update book.' } })
    }
  }
)

// PATCH /api/v1/books/:id/progress — update reading progress
router.patch(
  '/books/:id/progress',
  validateParams(bookIdParam),
  validateBody(progressBody),
  async (req, res) => {
    try {
      const clerkId = getUserId(req)
      const userId = await resolveUserId(clerkId)
      await assertBookOwnership(req.params['id']!, userId)

      const body = req.body as z.infer<typeof progressBody>

      const updateData: Record<string, unknown> = {}
      if (body.percentRead !== undefined) updateData['percentRead'] = body.percentRead
      if (body.status !== undefined) updateData['status'] = body.status
      if (body.startedAt !== undefined) updateData['startedAt'] = new Date(body.startedAt)
      if (body.finishedAt !== undefined) updateData['finishedAt'] = new Date(body.finishedAt)
      if (body.rating !== undefined) updateData['rating'] = body.rating

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const book = await prisma.book.update({
        where: { id: req.params['id'] },
        data: updateData as any,
      })

      res.json({ data: book })
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      if (msg === 'BOOK_NOT_FOUND') {
        res.status(404).json({ error: { code: 'BOOK_NOT_FOUND', message: 'Book not found.' } })
        return
      }
      console.error('[PATCH /books/:id/progress]', { err })
      res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to update progress.' } })
    }
  }
)

// DELETE /api/v1/books/:id — remove book
router.delete('/books/:id', validateParams(bookIdParam), async (req, res) => {
  try {
    const clerkId = getUserId(req)
    const userId = await resolveUserId(clerkId)
    await assertBookOwnership(req.params['id']!, userId)

    await prisma.book.delete({ where: { id: req.params['id'] } })

    res.json({ data: { deleted: true } })
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg === 'BOOK_NOT_FOUND') {
      res.status(404).json({ error: { code: 'BOOK_NOT_FOUND', message: 'Book not found.' } })
      return
    }
    console.error('[DELETE /books/:id]', { err })
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to delete book.' } })
  }
})

// GET /api/v1/books/search — 10 req/min per IP
router.get('/books/search', searchRateLimit, validateQuery(searchQuery), async (req, res) => {
  try {
    const query = (req as typeof req & { validatedQuery: z.infer<typeof searchQuery> }).validatedQuery

    const results: BookMetadata[] = []

    // Attempt Google Books via enrichBook pipeline
    if (query.source === 'google' || query.source === 'all') {
      try {
        const enriched = await enrichBook({ title: query.q })
        if (enriched.title && enriched.title !== query.q) {
          results.push(enriched)
        }
      } catch {
        // enrichment not available — return empty for this source
      }
    }

    // Attempt Open Library search via enrichBook with author hint
    if ((query.source === 'openlibrary' || query.source === 'all') && results.length < query.limit) {
      try {
        const enriched = await enrichBook({ title: query.q })
        if (enriched.title && !results.some((r) => r.title === enriched.title)) {
          results.push(enriched)
        }
      } catch {
        // enrichment not available — return empty for this source
      }
    }

    res.json({ data: results.slice(0, query.limit) })
  } catch (err) {
    console.error('[GET /books/search]', { err })
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Search failed.' } })
  }
})

// ─── Import Helpers ───────────────────────────────────────────────────────────

/**
 * Enrich an array of ParsedBooks in parallel, batching by CONCURRENCY to
 * avoid hammering downstream APIs. Failures per-book are swallowed so the
 * overall import never fails due to enrichment errors.
 */
const ENRICH_CONCURRENCY = 3

async function enrichBatch(books: ParsedBook[]): Promise<BookMetadata[]> {
  const results: BookMetadata[] = []

  for (let i = 0; i < books.length; i += ENRICH_CONCURRENCY) {
    const chunk = books.slice(i, i + ENRICH_CONCURRENCY)
    const enriched = await Promise.all(
      chunk.map((b) =>
        enrichBook({
          title: b.title,
          author: b.author,
          ...(b.isbn !== undefined ? { isbn: b.isbn } : {}),
          ...(b.pageCount !== undefined ? { pageCount: b.pageCount } : {}),
        }).catch(
          () =>
            ({
              title: b.title,
              author: b.author,
              ...(b.isbn !== undefined ? { isbn: b.isbn } : {}),
              ...(b.pageCount !== undefined ? { pageCount: b.pageCount } : {}),
            }) as BookMetadata,
        ),
      ),
    )
    results.push(...enriched)
  }

  return results
}

/**
 * Map a ParsedBook + enriched BookMetadata into a Prisma Book create-data
 * object, merging user-supplied values with API-enriched metadata.
 */
function buildBookData(
  parsed: ParsedBook,
  enriched: BookMetadata,
  userId: string,
  shelfId: string | undefined,
  source: string,
  positionIndex: number,
): Record<string, unknown> {
  const dims = calculateBookDimensions(enriched.pageCount ?? parsed.pageCount ?? 250)

  // Map string status from ParsedBook to Prisma ReadingStatus enum values
  const statusMap: Record<string, string> = {
    READ: 'READ',
    READING: 'READING',
    WANT_TO_READ: 'WANT_TO_READ',
  }

  // Map import source string to Prisma BookSource enum
  const sourceMap: Record<string, string> = {
    goodreads: 'GOODREADS',
    kindle: 'KINDLE',
    'google-play': 'GOOGLE_PLAY',
    kobo: 'KOBO',
    ibooks: 'IBOOKS',
    epub: 'EPUB',
    pdf: 'PDF',
  }

  return {
    userId,
    shelfId: shelfId ?? null,
    title: enriched.title ?? parsed.title,
    author: enriched.author ?? parsed.author,
    isbn: enriched.isbn ?? parsed.isbn,
    pageCount: enriched.pageCount ?? parsed.pageCount,
    coverUrl: enriched.coverUrl,
    publisher: enriched.publisher,
    publishedYear: enriched.publishedYear,
    description: enriched.description,
    genre: enriched.genre,
    language: enriched.language ?? 'en',
    source: sourceMap[source] ?? 'MANUAL',
    status: statusMap[parsed.status] ?? 'WANT_TO_READ',
    rating: parsed.rating ?? null,
    finishedAt: parsed.dateRead ? new Date(parsed.dateRead) : null,
    spineColor: enriched.spineColor ?? null,
    spineWidthMm: dims.spineWidthMm,
    heightMm: dims.heightMm,
    depthMm: dims.depthMm,
    positionOnShelf: positionIndex,
  }
}

// ─── Import Endpoints (3 req/min per IP) ──────────────────────────────────────

// POST /api/v1/books/import/goodreads
router.post('/books/import/goodreads', importRateLimit, upload.single('file'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: { code: 'MISSING_FILE', message: 'No file uploaded.' } })
    return
  }

  try {
    const clerkId = getUserId(req)
    const userId = await resolveUserId(clerkId)
    const shelfId = typeof req.body['shelfId'] === 'string' ? req.body['shelfId'] : undefined

    const parsed = parseGoodreadsCSV(req.file.buffer.toString('utf-8'))

    if (parsed.length === 0) {
      res.status(422).json({ error: { code: 'PARSE_EMPTY', message: 'No books found in Goodreads export.' } })
      return
    }

    const enrichedAll = await enrichBatch(parsed)

    const data = parsed.map((p, i) => buildBookData(p, enrichedAll[i]!, userId, shelfId, 'goodreads', i))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await prisma.book.createMany({ data: data as any[], skipDuplicates: true })

    res.json({ data: { imported: data.length, source: 'goodreads' } })
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg === 'USER_NOT_FOUND') {
      res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found.' } })
      return
    }
    console.error('[POST /books/import/goodreads]', { err })
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Goodreads import failed.' } })
  }
})

// POST /api/v1/books/import/kindle
router.post('/books/import/kindle', importRateLimit, upload.single('file'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: { code: 'MISSING_FILE', message: 'No file uploaded.' } })
    return
  }

  try {
    const clerkId = getUserId(req)
    const userId = await resolveUserId(clerkId)
    const shelfId = typeof req.body['shelfId'] === 'string' ? req.body['shelfId'] : undefined

    const parsed = await parseImport('kindle', req.file.buffer)

    if (parsed.length === 0) {
      res.status(422).json({ error: { code: 'PARSE_EMPTY', message: 'No books found in Kindle export.' } })
      return
    }

    const enrichedAll = await enrichBatch(parsed)
    const data = parsed.map((p, i) => buildBookData(p, enrichedAll[i]!, userId, shelfId, 'kindle', i))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await prisma.book.createMany({ data: data as any[], skipDuplicates: true })

    res.json({ data: { imported: data.length, source: 'kindle' } })
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg === 'USER_NOT_FOUND') {
      res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found.' } })
      return
    }
    console.error('[POST /books/import/kindle]', { err })
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Kindle import failed.' } })
  }
})

// POST /api/v1/books/import/google-play
router.post('/books/import/google-play', importRateLimit, upload.single('file'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: { code: 'MISSING_FILE', message: 'No file uploaded.' } })
    return
  }

  try {
    const clerkId = getUserId(req)
    const userId = await resolveUserId(clerkId)
    const shelfId = typeof req.body['shelfId'] === 'string' ? req.body['shelfId'] : undefined

    const parsed = await parseImport('google-play', req.file.buffer)

    if (parsed.length === 0) {
      res.status(422).json({ error: { code: 'PARSE_EMPTY', message: 'No books found in Google Play export.' } })
      return
    }

    const enrichedAll = await enrichBatch(parsed)
    const data = parsed.map((p, i) => buildBookData(p, enrichedAll[i]!, userId, shelfId, 'google-play', i))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await prisma.book.createMany({ data: data as any[], skipDuplicates: true })

    res.json({ data: { imported: data.length, source: 'google-play' } })
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg === 'USER_NOT_FOUND') {
      res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found.' } })
      return
    }
    console.error('[POST /books/import/google-play]', { err })
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Google Play import failed.' } })
  }
})

// POST /api/v1/books/import/kobo
router.post('/books/import/kobo', importRateLimit, upload.single('file'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: { code: 'MISSING_FILE', message: 'No file uploaded.' } })
    return
  }

  try {
    const clerkId = getUserId(req)
    const userId = await resolveUserId(clerkId)
    const shelfId = typeof req.body['shelfId'] === 'string' ? req.body['shelfId'] : undefined

    const parsed = await parseImport('kobo', req.file.buffer)

    if (parsed.length === 0) {
      res.status(422).json({ error: { code: 'PARSE_EMPTY', message: 'No books found in Kobo export.' } })
      return
    }

    const enrichedAll = await enrichBatch(parsed)
    const data = parsed.map((p, i) => buildBookData(p, enrichedAll[i]!, userId, shelfId, 'kobo', i))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await prisma.book.createMany({ data: data as any[], skipDuplicates: true })

    res.json({ data: { imported: data.length, source: 'kobo' } })
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg === 'USER_NOT_FOUND') {
      res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found.' } })
      return
    }
    console.error('[POST /books/import/kobo]', { err })
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Kobo import failed.' } })
  }
})

// POST /api/v1/books/import/ibooks
router.post('/books/import/ibooks', importRateLimit, upload.single('file'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: { code: 'MISSING_FILE', message: 'No file uploaded.' } })
    return
  }

  try {
    const clerkId = getUserId(req)
    const userId = await resolveUserId(clerkId)
    const shelfId = typeof req.body['shelfId'] === 'string' ? req.body['shelfId'] : undefined

    const parsed = await parseImport('ibooks', req.file.buffer)

    if (parsed.length === 0) {
      res.status(422).json({ error: { code: 'PARSE_EMPTY', message: 'No books found in iBooks export.' } })
      return
    }

    const enrichedAll = await enrichBatch(parsed)
    const data = parsed.map((p, i) => buildBookData(p, enrichedAll[i]!, userId, shelfId, 'ibooks', i))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await prisma.book.createMany({ data: data as any[], skipDuplicates: true })

    res.json({ data: { imported: data.length, source: 'ibooks' } })
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg === 'USER_NOT_FOUND') {
      res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found.' } })
      return
    }
    console.error('[POST /books/import/ibooks]', { err })
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'iBooks import failed.' } })
  }
})

// POST /api/v1/books/import/epub
router.post('/books/import/epub', importRateLimit, upload.single('file'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: { code: 'MISSING_FILE', message: 'No file uploaded.' } })
    return
  }

  try {
    const clerkId = getUserId(req)
    const userId = await resolveUserId(clerkId)
    const shelfId = typeof req.body['shelfId'] === 'string' ? req.body['shelfId'] : undefined

    const parsed = await parseImport('epub', req.file.buffer)

    if (parsed.length === 0) {
      res.status(422).json({ error: { code: 'PARSE_EMPTY', message: 'No book metadata found in EPUB.' } })
      return
    }

    const enrichedAll = await enrichBatch(parsed)
    const data = parsed.map((p, i) => buildBookData(p, enrichedAll[i]!, userId, shelfId, 'epub', i))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await prisma.book.createMany({ data: data as any[], skipDuplicates: true })

    res.json({ data: { imported: data.length, source: 'epub' } })
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg === 'USER_NOT_FOUND') {
      res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found.' } })
      return
    }
    console.error('[POST /books/import/epub]', { err })
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'EPUB import failed.' } })
  }
})

// POST /api/v1/books/import/pdf
router.post('/books/import/pdf', importRateLimit, upload.single('file'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: { code: 'MISSING_FILE', message: 'No file uploaded.' } })
    return
  }

  try {
    const clerkId = getUserId(req)
    const userId = await resolveUserId(clerkId)
    const shelfId = typeof req.body['shelfId'] === 'string' ? req.body['shelfId'] : undefined

    const parsed = await parseImport('pdf', req.file.buffer)

    if (parsed.length === 0) {
      res.status(422).json({ error: { code: 'PARSE_EMPTY', message: 'No book metadata found in PDF.' } })
      return
    }

    const enrichedAll = await enrichBatch(parsed)
    const data = parsed.map((p, i) => buildBookData(p, enrichedAll[i]!, userId, shelfId, 'pdf', i))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await prisma.book.createMany({ data: data as any[], skipDuplicates: true })

    res.json({ data: { imported: data.length, source: 'pdf' } })
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg === 'USER_NOT_FOUND') {
      res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found.' } })
      return
    }
    console.error('[POST /books/import/pdf]', { err })
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'PDF import failed.' } })
  }
})

// POST /api/v1/books/import/file — universal auto-detect import
router.post('/books/import/file', importRateLimit, upload.single('file'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: { code: 'MISSING_FILE', message: 'No file uploaded.' } })
    return
  }

  try {
    const clerkId = getUserId(req)
    const userId = await resolveUserId(clerkId)
    const shelfId = typeof req.body['shelfId'] === 'string' ? req.body['shelfId'] : undefined

    // Step 1: detect format from filename + content
    const format = await detectFormat(req.file.originalname, req.file.buffer)

    // Step 2: parse
    const parsed = await parseImport(format, req.file.buffer)

    if (parsed.length === 0) {
      res.status(422).json({
        error: { code: 'PARSE_EMPTY', message: 'No books found in this file.' },
        source: format,
      })
      return
    }

    // Step 3: enrich all books in batches of ENRICH_CONCURRENCY
    const enrichedAll = await enrichBatch(parsed)

    // Step 4: bulk insert
    const data = parsed.map((p, i) => buildBookData(p, enrichedAll[i]!, userId, shelfId, format, i))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await prisma.book.createMany({ data: data as any[], skipDuplicates: true })

    res.json({
      data: {
        source: format,
        totalFound: parsed.length,
        imported: data.length,
        preview: parsed.slice(0, 5),
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg === 'USER_NOT_FOUND') {
      res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found.' } })
      return
    }
    console.error('[POST /books/import/file]', { err })
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'File import failed.' } })
  }
})

// GET /api/v1/books/import/template — CSV template download
router.get('/books/import/template', (_req, res) => {
  const template =
    `Title,Author,ISBN,Page Count,Date Purchased,Genre,Percent Read,Rating\n` +
    `"Example: The Great Gatsby","F. Scott Fitzgerald","9780743273565","180","2024-01-15","Classic Fiction","100","5"\n`
  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', 'attachment; filename="virtual-bookshelf-import-template.csv"')
  res.send(template)
})

export default router
