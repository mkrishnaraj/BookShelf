import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { getUserId } from '../middleware/auth'
import { validateBody, validateParams } from '../middleware/validate'

const router = Router()

// ─── Schemas ──────────────────────────────────────────────────────────────────

const idParam = z.object({ id: z.string().min(1) })

const createWishlistBody = z.object({
  title: z.string().min(1).max(500),
  author: z.string().max(300).optional(),
  isbn: z.string().optional(),
  coverUrl: z.string().url().optional(),
  notes: z.string().max(1000).optional(),
  priority: z.number().int().min(0).default(0),
})

const updateWishlistBody = z.object({
  title: z.string().min(1).max(500).optional(),
  author: z.string().max(300).optional(),
  isbn: z.string().optional(),
  coverUrl: z.string().url().optional(),
  notes: z.string().max(1000).optional(),
  priority: z.number().int().min(0).optional(),
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function resolveUserId(clerkId: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) throw new Error('USER_NOT_FOUND')
  return user.id
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET /api/v1/wishlist
router.get('/', async (req, res) => {
  try {
    const clerkId = getUserId(req)
    const userId = await resolveUserId(clerkId)

    const items = await prisma.wishlistItem.findMany({
      where: { userId },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    })

    res.json({ data: items })
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg === 'USER_NOT_FOUND') {
      res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found.' } })
      return
    }
    console.error('[GET /wishlist]', { err })
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch wishlist.' } })
  }
})

// POST /api/v1/wishlist
router.post('/', validateBody(createWishlistBody), async (req, res) => {
  try {
    const clerkId = getUserId(req)
    const userId = await resolveUserId(clerkId)
    const body = req.body as z.infer<typeof createWishlistBody>

    const item = await prisma.wishlistItem.create({
      data: { userId, ...body },
    })

    res.status(201).json({ data: item })
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg === 'USER_NOT_FOUND') {
      res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found.' } })
      return
    }
    console.error('[POST /wishlist]', { err })
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to add wishlist item.' } })
  }
})

// PATCH /api/v1/wishlist/:id
router.patch(
  '/:id',
  validateParams(idParam),
  validateBody(updateWishlistBody),
  async (req, res) => {
    try {
      const clerkId = getUserId(req)
      const userId = await resolveUserId(clerkId)

      const existing = await prisma.wishlistItem.findFirst({
        where: { id: req.params['id'], userId },
        select: { id: true },
      })
      if (!existing) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Wishlist item not found.' } })
        return
      }

      const body = req.body as z.infer<typeof updateWishlistBody>
      const item = await prisma.wishlistItem.update({
        where: { id: req.params['id'] },
        data: body,
      })

      res.json({ data: item })
    } catch (err) {
      console.error('[PATCH /wishlist/:id]', { err })
      res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to update wishlist item.' } })
    }
  }
)

// DELETE /api/v1/wishlist/:id
router.delete('/:id', validateParams(idParam), async (req, res) => {
  try {
    const clerkId = getUserId(req)
    const userId = await resolveUserId(clerkId)

    const existing = await prisma.wishlistItem.findFirst({
      where: { id: req.params['id'], userId },
      select: { id: true },
    })
    if (!existing) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Wishlist item not found.' } })
      return
    }

    await prisma.wishlistItem.delete({ where: { id: req.params['id'] } })

    res.json({ data: { deleted: true } })
  } catch (err) {
    console.error('[DELETE /wishlist/:id]', { err })
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to delete wishlist item.' } })
  }
})

export default router
