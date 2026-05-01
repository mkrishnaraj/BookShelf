import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { getUserId } from '../middleware/auth.js'
import { validateBody } from '../middleware/validate.js'

const router: Router = Router()

// ─── Schemas ──────────────────────────────────────────────────────────────────

const updateProfileBody = z.object({
  name: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().url().optional(),
})

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET /api/v1/users/me — return current user + plan info
router.get('/me', async (req, res) => {
  try {
    const clerkId = getUserId(req)

    let user = await prisma.user.findUnique({
      where: { clerkId },
      select: {
        id: true,
        clerkId: true,
        email: true,
        name: true,
        avatarUrl: true,
        plan: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        createdAt: true,
        _count: { select: { shelves: true, books: true } },
      },
    })

    if (!user) {
      // Auto-provision user on first login
      const sessionClaims = (req as typeof req & { auth?: { sessionClaims?: Record<string, unknown> } }).auth?.sessionClaims
      const email = (sessionClaims?.['email'] as string | undefined) ?? `${clerkId}@placeholder.local`
      user = await prisma.user.create({
        data: { clerkId, email },
        select: {
          id: true,
          clerkId: true,
          email: true,
          name: true,
          avatarUrl: true,
          plan: true,
          subscriptionStatus: true,
          trialEndsAt: true,
          createdAt: true,
          _count: { select: { shelves: true, books: true } },
        },
      })
    }

    res.json({ data: user })
  } catch (err) {
    console.error('[GET /users/me]', { err })
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch profile.' } })
  }
})

// PATCH /api/v1/users/me — update profile
router.patch('/me', validateBody(updateProfileBody), async (req, res) => {
  try {
    const clerkId = getUserId(req)
    const body = req.body as z.infer<typeof updateProfileBody>

    const user = await prisma.user.update({
      where: { clerkId },
      data: body,
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        plan: true,
        updatedAt: true,
      },
    })

    res.json({ data: user })
  } catch (err) {
    console.error('[PATCH /users/me]', { err })
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to update profile.' } })
  }
})

// GET /api/v1/users/me/plan — return plan details and limits
router.get('/me/plan', async (req, res) => {
  try {
    const clerkId = getUserId(req)

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { plan: true, subscriptionStatus: true, trialEndsAt: true, stripeCustomerId: true },
    })

    if (!user) {
      res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found.' } })
      return
    }

    const { PLAN_LIMITS } = await import('shared')
    const plan = user.plan as keyof typeof PLAN_LIMITS
    const limits = PLAN_LIMITS[plan]

    res.json({
      data: {
        plan: user.plan,
        subscriptionStatus: user.subscriptionStatus,
        trialEndsAt: user.trialEndsAt,
        limits,
      },
    })
  } catch (err) {
    console.error('[GET /users/me/plan]', { err })
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch plan info.' } })
  }
})

export default router
