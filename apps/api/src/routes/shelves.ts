import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { randomBytes } from 'crypto'
import { prisma } from '../lib/prisma.js'
import { getUserId } from '../middleware/auth.js'
import { checkShelfLimit } from '../middleware/planLimits.js'
import { validateBody, validateParams } from '../middleware/validate.js'
import { generateShelfShareUrl } from '../services/shelfRenderer.js'

function generateSlug(len = 10): string {
  return randomBytes(Math.ceil(len * 3 / 4))
    .toString('base64url')
    .slice(0, len)
}

const router: Router = Router()

// ─── Schemas ──────────────────────────────────────────────────────────────────

const idParam = z.object({ id: z.string().min(1) })

const createShelfBody = z.object({
  name: z.string().min(1).max(100),
  size: z.enum(['S', 'M', 'L', 'XL']).default('S'),
  theme: z.enum(['DARK_WOOD', 'LIGHT_OAK', 'WHITE_MINIMALIST', 'VINTAGE']).default('DARK_WOOD'),
  sortOrder: z.number().int().default(0),
})

const updateShelfBody = z.object({
  name: z.string().min(1).max(100).optional(),
  size: z.enum(['S', 'M', 'L', 'XL']).optional(),
  theme: z.enum(['DARK_WOOD', 'LIGHT_OAK', 'WHITE_MINIMALIST', 'VINTAGE']).optional(),
  sortOrder: z.number().int().optional(),
  isPublic: z.boolean().optional(),
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function resolveUserId(clerkId: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) throw new Error('USER_NOT_FOUND')
  return user.id
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET /api/v1/shelves — list user's shelves
router.get('/', async (req, res) => {
  try {
    const clerkId = getUserId(req)
    const userId = await resolveUserId(clerkId)

    const shelves = await prisma.shelf.findMany({
      where: { userId },
      include: { _count: { select: { books: true } } },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    })

    res.json({ data: shelves })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    if (msg === 'USER_NOT_FOUND') {
      res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found.' } })
      return
    }
    console.error('[GET /shelves]', { err })
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to list shelves.' } })
  }
})

// POST /api/v1/shelves — create shelf (plan limit enforced)
router.post(
  '/',
  checkShelfLimit,
  validateBody(createShelfBody),
  async (req, res) => {
    try {
      const clerkId = getUserId(req)
      const userId = await resolveUserId(clerkId)

      const shelf = await prisma.shelf.create({
        data: {
          userId,
          name: req.body.name as string,
          size: req.body.size as 'S' | 'M' | 'L' | 'XL',
          theme: req.body.theme as 'DARK_WOOD' | 'LIGHT_OAK' | 'WHITE_MINIMALIST' | 'VINTAGE',
          sortOrder: req.body.sortOrder as number,
        },
      })

      res.status(201).json({ data: shelf })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      if (msg === 'USER_NOT_FOUND') {
        res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found.' } })
        return
      }
      console.error('[POST /shelves]', { err })
      res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to create shelf.' } })
    }
  }
)

// GET /api/v1/shelves/:id — get shelf with books
router.get('/:id', validateParams(idParam), async (req, res) => {
  try {
    const clerkId = getUserId(req)
    const userId = await resolveUserId(clerkId)

    const shelf = await prisma.shelf.findFirst({
      where: { id: req.params['id'], userId },
      include: {
        books: {
          orderBy: [{ positionOnShelf: 'asc' }, { createdAt: 'asc' }],
        },
      },
    })

    if (!shelf) {
      res.status(404).json({ error: { code: 'SHELF_NOT_FOUND', message: 'Shelf not found.' } })
      return
    }

    res.json({ data: shelf })
  } catch (err) {
    console.error('[GET /shelves/:id]', { err })
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to get shelf.' } })
  }
})

// PATCH /api/v1/shelves/:id — update name/theme/sortOrder
router.patch(
  '/:id',
  validateParams(idParam),
  validateBody(updateShelfBody),
  async (req, res) => {
    try {
      const clerkId = getUserId(req)
      const userId = await resolveUserId(clerkId)

      const existing = await prisma.shelf.findFirst({
        where: { id: req.params['id'], userId },
        select: { id: true },
      })
      if (!existing) {
        res.status(404).json({ error: { code: 'SHELF_NOT_FOUND', message: 'Shelf not found.' } })
        return
      }

      const shelf = await prisma.shelf.update({
        where: { id: req.params['id'] },
        data: req.body as {
          name?: string
          size?: 'S' | 'M' | 'L' | 'XL'
          theme?: 'DARK_WOOD' | 'LIGHT_OAK' | 'WHITE_MINIMALIST' | 'VINTAGE'
          sortOrder?: number
          isPublic?: boolean
        },
      })

      res.json({ data: shelf })
    } catch (err) {
      console.error('[PATCH /shelves/:id]', { err })
      res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to update shelf.' } })
    }
  }
)

// DELETE /api/v1/shelves/:id — hard-delete shelf
router.delete('/:id', validateParams(idParam), async (req, res) => {
  try {
    const clerkId = getUserId(req)
    const userId = await resolveUserId(clerkId)

    const existing = await prisma.shelf.findFirst({
      where: { id: req.params['id'], userId },
      select: { id: true },
    })
    if (!existing) {
      res.status(404).json({ error: { code: 'SHELF_NOT_FOUND', message: 'Shelf not found.' } })
      return
    }

    await prisma.shelf.delete({ where: { id: req.params['id'] } })

    res.json({ data: { deleted: true } })
  } catch (err) {
    console.error('[DELETE /shelves/:id]', { err })
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to delete shelf.' } })
  }
})

// GET /api/v1/shelves/:id/share — generate / return public share URL
router.get('/:id/share', validateParams(idParam), async (req, res) => {
  try {
    const clerkId = getUserId(req)
    const userId = await resolveUserId(clerkId)

    let shelf = await prisma.shelf.findFirst({
      where: { id: req.params['id'], userId },
      include: {
        books: {
          select: {
            title: true,
            author: true,
            spineColor: true,
            spineWidthMm: true,
            coverUrl: true,
          },
          orderBy: { positionOnShelf: 'asc' },
        },
      },
    })
    if (!shelf) {
      res.status(404).json({ error: { code: 'SHELF_NOT_FOUND', message: 'Shelf not found.' } })
      return
    }

    // Ensure shelf has a public slug
    if (!shelf.publicSlug) {
      shelf = await prisma.shelf.update({
        where: { id: shelf.id },
        data: { isPublic: true, publicSlug: generateSlug(10) },
        include: {
          books: {
            select: {
              title: true,
              author: true,
              spineColor: true,
              spineWidthMm: true,
              coverUrl: true,
            },
            orderBy: { positionOnShelf: 'asc' },
          },
        },
      })
    }

    const imageUrl = generateShelfShareUrl({
      shelfId: shelf.id,
      publicSlug: shelf.publicSlug ?? '',
      books: shelf.books,
    })

    const shareUrl = `${process.env['WEB_URL'] ?? 'http://localhost:5173'}/shelf/${shelf.publicSlug}`

    res.json({ data: { slug: shelf.publicSlug, shareUrl, imageUrl } })
  } catch (err) {
    console.error('[GET /shelves/:id/share]', { err })
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to generate share link.' } })
  }
})

export default router
