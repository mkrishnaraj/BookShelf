import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { getUserId } from '../middleware/auth.js'
import { validateBody, validateParams } from '../middleware/validate.js'

const router: Router = Router()

// ─── Schemas ──────────────────────────────────────────────────────────────────

const idParam = z.object({ id: z.string().min(1) })

const addEntryBody = z.object({
  content: z.string().min(1).max(5000),
  bookId: z.string().optional(),
})

const addWordBody = z.object({
  word: z.string().min(1).max(200),
  definition: z.string().min(1).max(2000),
  bookId: z.string().optional(),
  pageNumber: z.number().int().min(1).optional(),
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getOrCreateNotebook(userId: string): Promise<{ id: string }> {
  const existing = await prisma.notebook.findUnique({
    where: { userId },
    select: { id: true },
  })
  if (existing) return existing

  return prisma.notebook.create({
    data: { userId },
    select: { id: true },
  })
}

async function resolveUserId(clerkId: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) throw new Error('USER_NOT_FOUND')
  return user.id
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET /api/v1/notebook — get notebook with recent entries
router.get('/', async (req, res) => {
  try {
    const clerkId = getUserId(req)
    const userId = await resolveUserId(clerkId)
    const notebook = await getOrCreateNotebook(userId)

    const [entries, wordCount] = await Promise.all([
      prisma.notebookEntry.findMany({
        where: { notebookId: notebook.id },
        include: { book: { select: { id: true, title: true, author: true } } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.dictionaryWord.count({ where: { notebookId: notebook.id } }),
    ])

    res.json({ data: { id: notebook.id, entries, wordCount } })
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg === 'USER_NOT_FOUND') {
      res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found.' } })
      return
    }
    console.error('[GET /notebook]', { err })
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch notebook.' } })
  }
})

// POST /api/v1/notebook/entries — add entry
router.post('/entries', validateBody(addEntryBody), async (req, res) => {
  try {
    const clerkId = getUserId(req)
    const userId = await resolveUserId(clerkId)
    const notebook = await getOrCreateNotebook(userId)
    const body = req.body as z.infer<typeof addEntryBody>

    // If bookId provided, verify it belongs to user
    if (body.bookId) {
      const book = await prisma.book.findFirst({
        where: { id: body.bookId, userId },
        select: { id: true },
      })
      if (!book) {
        res.status(404).json({ error: { code: 'BOOK_NOT_FOUND', message: 'Book not found.' } })
        return
      }
    }

    const entry = await prisma.notebookEntry.create({
      data: {
        notebookId: notebook.id,
        content: body.content,
        bookId: body.bookId,
      },
      include: { book: { select: { id: true, title: true, author: true } } },
    })

    res.status(201).json({ data: entry })
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg === 'USER_NOT_FOUND') {
      res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found.' } })
      return
    }
    console.error('[POST /notebook/entries]', { err })
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to add notebook entry.' } })
  }
})

// DELETE /api/v1/notebook/entries/:id
router.delete('/entries/:id', validateParams(idParam), async (req, res) => {
  try {
    const clerkId = getUserId(req)
    const userId = await resolveUserId(clerkId)
    const notebook = await getOrCreateNotebook(userId)

    const entry = await prisma.notebookEntry.findFirst({
      where: { id: req.params['id'], notebookId: notebook.id },
      select: { id: true },
    })
    if (!entry) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Entry not found.' } })
      return
    }

    await prisma.notebookEntry.delete({ where: { id: req.params['id'] } })
    res.json({ data: { deleted: true } })
  } catch (err) {
    console.error('[DELETE /notebook/entries/:id]', { err })
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to delete entry.' } })
  }
})

// GET /api/v1/notebook/dictionary — get dictionary words (paginated)
router.get('/dictionary', async (req, res) => {
  try {
    const clerkId = getUserId(req)
    const userId = await resolveUserId(clerkId)
    const notebook = await getOrCreateNotebook(userId)

    const page = Math.max(1, parseInt(String(req.query['page'] ?? '1'), 10))
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query['limit'] ?? '50'), 10)))
    const search = req.query['search'] as string | undefined

    const where: Record<string, unknown> = { notebookId: notebook.id }
    if (search) {
      where['OR'] = [
        { word: { contains: search, mode: 'insensitive' } },
        { definition: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [words, total] = await Promise.all([
      prisma.dictionaryWord.findMany({
        where,
        include: { book: { select: { id: true, title: true } } },
        orderBy: { word: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.dictionaryWord.count({ where }),
    ])

    res.json({ data: { words, total, page, limit } })
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg === 'USER_NOT_FOUND') {
      res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found.' } })
      return
    }
    console.error('[GET /notebook/dictionary]', { err })
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch dictionary.' } })
  }
})

// POST /api/v1/notebook/dictionary — add word
router.post('/dictionary', validateBody(addWordBody), async (req, res) => {
  try {
    const clerkId = getUserId(req)
    const userId = await resolveUserId(clerkId)
    const notebook = await getOrCreateNotebook(userId)
    const body = req.body as z.infer<typeof addWordBody>

    // If bookId provided, verify ownership
    if (body.bookId) {
      const book = await prisma.book.findFirst({
        where: { id: body.bookId, userId },
        select: { id: true },
      })
      if (!book) {
        res.status(404).json({ error: { code: 'BOOK_NOT_FOUND', message: 'Book not found.' } })
        return
      }
    }

    const word = await prisma.dictionaryWord.create({
      data: {
        notebookId: notebook.id,
        word: body.word,
        definition: body.definition,
        bookId: body.bookId,
        pageNumber: body.pageNumber,
      },
    })

    res.status(201).json({ data: word })
  } catch (err) {
    // Unique constraint: word already exists in notebook
    if (
      err instanceof Error &&
      err.message.includes('Unique constraint') &&
      err.message.includes('notebookId_word')
    ) {
      res.status(409).json({
        error: { code: 'WORD_EXISTS', message: 'This word is already in your dictionary.' },
      })
      return
    }
    const msg = err instanceof Error ? err.message : ''
    if (msg === 'USER_NOT_FOUND') {
      res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found.' } })
      return
    }
    console.error('[POST /notebook/dictionary]', { err })
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to add word.' } })
  }
})

// DELETE /api/v1/notebook/dictionary/:id
router.delete('/dictionary/:id', validateParams(idParam), async (req, res) => {
  try {
    const clerkId = getUserId(req)
    const userId = await resolveUserId(clerkId)
    const notebook = await getOrCreateNotebook(userId)

    const word = await prisma.dictionaryWord.findFirst({
      where: { id: req.params['id'], notebookId: notebook.id },
      select: { id: true },
    })
    if (!word) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Word not found.' } })
      return
    }

    await prisma.dictionaryWord.delete({ where: { id: req.params['id'] } })
    res.json({ data: { deleted: true } })
  } catch (err) {
    console.error('[DELETE /notebook/dictionary/:id]', { err })
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to delete word.' } })
  }
})

export default router
