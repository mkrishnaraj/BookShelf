import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { getUserId } from '../middleware/auth.js'
import { validateQuery } from '../middleware/validate.js'

const router = Router()

// ─── Schemas ──────────────────────────────────────────────────────────────────

const statsQuery = z.object({
  period: z.enum(['week', 'month', 'year']).default('month'),
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPeriodStart(period: 'week' | 'month' | 'year'): Date {
  const now = new Date()
  switch (period) {
    case 'week':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
    case 'month':
      return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
    case 'year':
      return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
  }
}

function groupByPeriod(
  sessions: Array<{ startedAt: Date; pagesRead: number | null }>,
  period: 'week' | 'month' | 'year'
): Array<{ label: string; pagesRead: number; sessions: number }> {
  const groups = new Map<string, { pagesRead: number; sessions: number }>()

  for (const session of sessions) {
    const d = session.startedAt
    let label: string
    if (period === 'week') {
      label = d.toISOString().slice(0, 10) // YYYY-MM-DD
    } else if (period === 'month') {
      label = d.toISOString().slice(0, 10) // daily breakdown for month
    } else {
      label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` // YYYY-MM for year
    }

    const existing = groups.get(label) ?? { pagesRead: 0, sessions: 0 }
    groups.set(label, {
      pagesRead: existing.pagesRead + (session.pagesRead ?? 0),
      sessions: existing.sessions + 1,
    })
  }

  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, data]) => ({ label, ...data }))
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET /api/v1/stats?period=week|month|year
router.get('/', validateQuery(statsQuery), async (req, res) => {
  try {
    const clerkId = getUserId(req)
    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
    if (!user) {
      res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found.' } })
      return
    }

    const query = (req as typeof req & { validatedQuery: z.infer<typeof statsQuery> }).validatedQuery
    const periodStart = getPeriodStart(query.period)

    // Books finished in period
    const booksRead = await prisma.book.count({
      where: {
        userId: user.id,
        status: 'READ',
        finishedAt: { gte: periodStart },
      },
    })

    // Reading sessions in period
    const sessions = await prisma.readingSession.findMany({
      where: {
        userId: user.id,
        startedAt: { gte: periodStart },
      },
      select: { startedAt: true, pagesRead: true },
      orderBy: { startedAt: 'asc' },
    })

    const pagesRead = sessions.reduce(
      (sum: number, s: { startedAt: Date; pagesRead: number | null }) => sum + (s.pagesRead ?? 0),
      0
    )

    // Average rating of books finished in period
    const ratedBooks = await prisma.book.findMany({
      where: {
        userId: user.id,
        status: 'READ',
        finishedAt: { gte: periodStart },
        rating: { not: null },
      },
      select: { rating: true },
    })
    const avgRating =
      ratedBooks.length > 0
        ? ratedBooks.reduce(
            (sum: number, b: { rating: number | null }) => sum + (b.rating ?? 0),
            0
          ) / ratedBooks.length
        : null

    // Total books per status (all time)
    const totalByStatus = await prisma.book.groupBy({
      by: ['status'],
      where: { userId: user.id },
      _count: true,
    })

    const byPeriod = groupByPeriod(sessions, query.period)

    res.json({
      data: {
        period: query.period,
        periodStart,
        booksRead,
        pagesRead,
        avgRating: avgRating !== null ? Math.round(avgRating * 10) / 10 : null,
        totalByStatus: Object.fromEntries(
          totalByStatus.map((s: { status: string; _count: number }) => [s.status, s._count])
        ),
        byPeriod,
      },
    })
  } catch (err) {
    console.error('[GET /stats]', { err })
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch stats.' } })
  }
})

export default router
