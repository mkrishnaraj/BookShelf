import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { getUserId } from '../middleware/auth.js'
import { validateBody } from '../middleware/validate.js'

const router = Router()

// ─── Schemas ──────────────────────────────────────────────────────────────────

const checkinBody = z.object({
  bookId: z.string().min(1),
  pagesRead: z.number().int().min(1).optional(),
  notes: z.string().max(1000).optional(),
  startedAt: z.string().datetime().optional(),
  endedAt: z.string().datetime().optional(),
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function isYesterday(date: Date, reference: Date): boolean {
  const yesterday = new Date(reference)
  yesterday.setDate(yesterday.getDate() - 1)
  return isSameDay(date, yesterday)
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET /api/v1/streaks — current streak + history
router.get('/', async (req, res) => {
  try {
    const clerkId = getUserId(req)
    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
    if (!user) {
      res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found.' } })
      return
    }

    const streak = await prisma.readingStreak.findUnique({
      where: { userId: user.id },
    })

    // Last 30 session dates for calendar heatmap
    const recentSessions = await prisma.readingSession.findMany({
      where: {
        userId: user.id,
        startedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      select: { startedAt: true, pagesRead: true },
      orderBy: { startedAt: 'desc' },
    })

    res.json({
      data: {
        currentStreak: streak?.currentStreak ?? 0,
        longestStreak: streak?.longestStreak ?? 0,
        lastReadDate: streak?.lastReadDate ?? null,
        totalDaysRead: streak?.totalDaysRead ?? 0,
        recentSessions,
      },
    })
  } catch (err) {
    console.error('[GET /streaks]', { err })
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch streak.' } })
  }
})

// POST /api/v1/streaks/checkin — record a reading session, update streak
router.post('/checkin', validateBody(checkinBody), async (req, res) => {
  try {
    const clerkId = getUserId(req)
    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
    if (!user) {
      res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found.' } })
      return
    }

    const body = req.body as z.infer<typeof checkinBody>

    // Verify the book belongs to this user
    const book = await prisma.book.findFirst({
      where: { id: body.bookId, userId: user.id },
      select: { id: true },
    })
    if (!book) {
      res.status(404).json({ error: { code: 'BOOK_NOT_FOUND', message: 'Book not found.' } })
      return
    }

    const now = new Date()
    const sessionStart = body.startedAt ? new Date(body.startedAt) : now
    const sessionEnd = body.endedAt ? new Date(body.endedAt) : now

    // Create the reading session
    const session = await prisma.readingSession.create({
      data: {
        userId: user.id,
        bookId: body.bookId,
        startedAt: sessionStart,
        endedAt: sessionEnd,
        pagesRead: body.pagesRead,
        notes: body.notes,
      },
    })

    // Update streak
    const existingStreak = await prisma.readingStreak.findUnique({
      where: { userId: user.id },
    })

    const today = new Date()
    let newCurrentStreak = 1
    let newTotalDaysRead = (existingStreak?.totalDaysRead ?? 0) + 1

    if (existingStreak?.lastReadDate) {
      const lastRead = existingStreak.lastReadDate

      if (isSameDay(lastRead, today)) {
        // Already read today — streak unchanged, don't double-count total
        newCurrentStreak = existingStreak.currentStreak
        newTotalDaysRead = existingStreak.totalDaysRead
      } else if (isYesterday(lastRead, today)) {
        // Consecutive day — extend streak
        newCurrentStreak = existingStreak.currentStreak + 1
      } else {
        // Streak broken — reset
        newCurrentStreak = 1
      }
    }

    const newLongest = Math.max(
      existingStreak?.longestStreak ?? 0,
      newCurrentStreak
    )

    const streak = await prisma.readingStreak.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        currentStreak: newCurrentStreak,
        longestStreak: newLongest,
        lastReadDate: today,
        totalDaysRead: newTotalDaysRead,
      },
      update: {
        currentStreak: newCurrentStreak,
        longestStreak: newLongest,
        lastReadDate: isSameDay(existingStreak?.lastReadDate ?? new Date(0), today)
          ? existingStreak!.lastReadDate
          : today,
        totalDaysRead: newTotalDaysRead,
      },
    })

    res.status(201).json({ data: { session, streak } })
  } catch (err) {
    console.error('[POST /streaks/checkin]', { err })
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to record check-in.' } })
  }
})

export default router
