import type { Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { getUserId } from './auth'
import type { Plan, ShelfSize } from 'shared'
import { PLAN_LIMITS, SHELF_CAPACITY } from 'shared'

// Ordered list for comparison — index = tier level
const PLAN_ORDER: Plan[] = ['FREE', 'READER', 'COLLECTOR', 'BIBLIOPHILE']

function planLevel(plan: Plan): number {
  return PLAN_ORDER.indexOf(plan)
}

/**
 * Require the authenticated user to be on at least `minPlan`.
 * Returns 403 when their current plan is below the required tier.
 */
export function requirePlan(minPlan: Plan) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const clerkId = getUserId(req)
    try {
      const user = await prisma.user.findUnique({
        where: { clerkId },
        select: { plan: true },
      })
      const userPlan = (user?.plan ?? 'FREE') as Plan
      if (planLevel(userPlan) < planLevel(minPlan)) {
        res.status(403).json({
          error: {
            code: 'PLAN_REQUIRED',
            message: `This feature requires the ${minPlan} plan or higher.`,
            requiredPlan: minPlan,
            currentPlan: userPlan,
          },
        })
        return
      }
      next()
    } catch (err) {
      console.error('[requirePlan]', { clerkId, err })
      res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Plan check failed.' } })
    }
  }
}

/**
 * Middleware that enforces the shelf count limit for the user's plan.
 * Attach to POST /shelves BEFORE the create handler.
 */
export async function checkShelfLimit(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const clerkId = getUserId(req)
  try {
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true, plan: true },
    })
    if (!user) {
      res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found.' } })
      return
    }

    const plan = (user.plan ?? 'FREE') as Plan
    const limit = PLAN_LIMITS[plan].shelves

    if (limit !== -1) {
      const shelfCount = await prisma.shelf.count({ where: { userId: user.id } })
      if (shelfCount >= limit) {
        res.status(403).json({
          error: {
            code: 'SHELF_LIMIT_REACHED',
            message: `Your ${plan} plan allows up to ${limit} shelf${limit === 1 ? '' : 's'}. Upgrade to add more.`,
            limit,
            current: shelfCount,
          },
        })
        return
      }
    }

    next()
  } catch (err) {
    console.error('[checkShelfLimit]', { clerkId, err })
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Shelf limit check failed.' } })
  }
}

/**
 * Middleware that enforces the book count limit for a shelf.
 * Reads :shelfId from req.params.
 * Attach to POST /shelves/:shelfId/books BEFORE the create handler.
 */
export async function checkBookLimit(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const shelfId = req.params['shelfId']
  if (!shelfId) {
    res.status(400).json({ error: { code: 'MISSING_SHELF_ID', message: 'shelfId param required.' } })
    return
  }

  try {
    const shelf = await prisma.shelf.findUnique({
      where: { id: shelfId },
      select: { size: true, userId: true },
    })
    if (!shelf) {
      res.status(404).json({ error: { code: 'SHELF_NOT_FOUND', message: 'Shelf not found.' } })
      return
    }

    const capacity = SHELF_CAPACITY[shelf.size as ShelfSize]
    const bookCount = await prisma.book.count({ where: { shelfId } })

    if (bookCount >= capacity) {
      res.status(403).json({
        error: {
          code: 'BOOK_LIMIT_REACHED',
          message: `This shelf is full (${capacity} books max for size ${shelf.size}).`,
          limit: capacity,
          current: bookCount,
        },
      })
      return
    }

    next()
  } catch (err) {
    console.error('[checkBookLimit]', { shelfId, err })
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Book limit check failed.' } })
  }
}
