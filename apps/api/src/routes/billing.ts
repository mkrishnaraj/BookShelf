import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { getUserId } from '../middleware/auth.js'
import { validateBody } from '../middleware/validate.js'
import { createCheckoutSession, createPortalSession } from '../services/stripeService.js'

const router: Router = Router()

// ─── Server-side price ID map — never trust price IDs from the client ─────────
const PRICE_ID_MAP: Record<string, string | undefined> = {
  READER_MONTHLY:      process.env['STRIPE_READER_MONTHLY_PRICE_ID'],
  READER_ANNUAL:       process.env['STRIPE_READER_ANNUAL_PRICE_ID'],
  COLLECTOR_MONTHLY:   process.env['STRIPE_COLLECTOR_MONTHLY_PRICE_ID'],
  COLLECTOR_ANNUAL:    process.env['STRIPE_COLLECTOR_ANNUAL_PRICE_ID'],
  BIBLIOPHILE_MONTHLY: process.env['STRIPE_BIBLIOPHILE_MONTHLY_PRICE_ID'],
  BIBLIOPHILE_ANNUAL:  process.env['STRIPE_BIBLIOPHILE_ANNUAL_PRICE_ID'],
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

const checkoutBody = z.object({
  plan: z.enum(['READER', 'COLLECTOR', 'BIBLIOPHILE']),
  annual: z.boolean().default(false),
})

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET /api/v1/billing/status — current plan + subscription info
router.get('/status', async (req, res) => {
  try {
    const clerkId = getUserId(req)

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: {
        plan: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
      },
    })

    if (!user) {
      res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found.' } })
      return
    }

    res.json({ data: user })
  } catch (err) {
    console.error('[GET /billing/status]', { err })
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch billing status.' } })
  }
})

// POST /api/v1/billing/checkout — create Stripe Checkout session
router.post('/checkout', validateBody(checkoutBody), async (req, res) => {
  try {
    const clerkId = getUserId(req)
    const body = req.body as { plan: 'READER' | 'COLLECTOR' | 'BIBLIOPHILE'; annual: boolean }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    })

    if (!user) {
      res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found.' } })
      return
    }

    const interval = body.annual ? 'ANNUAL' : 'MONTHLY'
    const key = `${body.plan}_${interval}`
    const priceId = PRICE_ID_MAP[key]

    if (!priceId) {
      res.status(503).json({ error: { code: 'PRICE_NOT_CONFIGURED', message: 'This plan is not available for purchase yet.' } })
      return
    }

    const session = await createCheckoutSession(
      user.id,
      clerkId,
      priceId,
      body.plan
    )

    res.json({ data: { url: session.url, sessionId: session.id } })
  } catch (err) {
    console.error('[POST /billing/checkout]', { err })
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to create checkout session.' } })
  }
})

// POST /api/v1/billing/portal — create Stripe Billing Portal session
router.post('/portal', async (req, res) => {
  try {
    const clerkId = getUserId(req)

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { stripeCustomerId: true },
    })

    if (!user?.stripeCustomerId) {
      res.status(400).json({
        error: {
          code: 'NO_STRIPE_CUSTOMER',
          message: 'No billing account found. Please subscribe first.',
        },
      })
      return
    }

    const session = await createPortalSession(user.stripeCustomerId)

    res.json({ data: { url: session.url } })
  } catch (err) {
    console.error('[POST /billing/portal]', { err })
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to create portal session.' } })
  }
})

export default router
