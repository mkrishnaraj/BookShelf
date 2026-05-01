import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { validateParams } from '../middleware/validate'

const router = Router()

// ─── Schemas ──────────────────────────────────────────────────────────────────

const slugParam = z.object({ slug: z.string().min(1).max(20) })

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * GET /api/public/shelf/:slug
 * Public shelf view — no authentication required.
 * Only returns shelves that have isPublic = true.
 */
router.get('/shelf/:slug', validateParams(slugParam), async (req, res) => {
  try {
    const shelf = await prisma.shelf.findFirst({
      where: {
        publicSlug: req.params['slug'],
        isPublic: true,
      },
      include: {
        books: {
          select: {
            id: true,
            title: true,
            author: true,
            isbn: true,
            pageCount: true,
            coverUrl: true,
            publisher: true,
            publishedYear: true,
            genre: true,
            status: true,
            rating: true,
            percentRead: true,
            spineColor: true,
            spineWidthMm: true,
            heightMm: true,
            positionOnShelf: true,
          },
          orderBy: [{ positionOnShelf: 'asc' }, { createdAt: 'asc' }],
        },
        user: {
          select: {
            name: true,
            avatarUrl: true,
          },
        },
      },
    })

    if (!shelf) {
      res.status(404).json({ error: { code: 'SHELF_NOT_FOUND', message: 'Public shelf not found.' } })
      return
    }

    res.json({
      data: {
        id: shelf.id,
        name: shelf.name,
        slug: shelf.publicSlug,
        theme: shelf.theme,
        size: shelf.size,
        owner: shelf.user,
        books: shelf.books,
        bookCount: shelf.books.length,
        createdAt: shelf.createdAt,
      },
    })
  } catch (err) {
    console.error('[GET /public/shelf/:slug]', { err })
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch public shelf.' } })
  }
})

export default router
