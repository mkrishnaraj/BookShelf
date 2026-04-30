import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { getUserId } from '../middleware/auth.js'
import { getRecommendations } from 'ai'

const router = Router()

// GET /api/v1/recommendations
// Returns up to 10 book recommendations based on the user's top-rated shelf books.
router.get('/', async (req, res) => {
  try {
    const clerkId = getUserId(req)
    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
    if (!user) {
      res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found.' } })
      return
    }

    // Fetch top 20 books ordered by rating DESC then most recently added.
    // These are the strongest signals for taste-based recommendations.
    const books = await prisma.book.findMany({
      where: { userId: user.id },
      orderBy: [{ rating: 'desc' }, { createdAt: 'desc' }],
      take: 20,
      select: { title: true, author: true, genre: true },
    })

    const recommendations = await getRecommendations(
              books.map(b => ({ ...b, genre: b.genre ?? undefined })),10)

    res.json({ data: { recommendations } })
  } catch (err) {
    console.error('[GET /recommendations]', { err })
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to get recommendations.' } })
  }
})

export default router
