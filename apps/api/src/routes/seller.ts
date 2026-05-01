import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { getUserId } from '../middleware/auth'
import { requirePlan } from '../middleware/planLimits'
import {
  createConnectAccount,
  createAccountLink,
  getConnectAccount,
} from '../services/connectService'

const router = Router()

// ─── Routes ───────────────────────────────────────────────────────────────────

// POST /api/v1/seller/onboard — start Stripe Connect Express onboarding
// Requires at least READER plan to sell books
router.post('/onboard', requirePlan('READER'), async (req, res) => {
  try {
    const clerkId = getUserId(req)

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true, email: true, sellerAccount: true },
    })

    if (!user) {
      res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found.' } })
      return
    }

    // If already onboarded, return existing account status
    if (user.sellerAccount) {
      const account = await getConnectAccount(user.sellerAccount.stripeConnectId)
      const onboardingComplete =
        account.details_submitted === true && account.charges_enabled === true

      if (onboardingComplete && user.sellerAccount.onboardingComplete) {
        res.json({
          data: {
            status: 'already_onboarded',
            onboardingComplete: true,
            stripeConnectId: user.sellerAccount.stripeConnectId,
          },
        })
        return
      }

      // Regenerate account link if onboarding incomplete
      const webUrl = process.env['WEB_URL'] ?? 'http://localhost:5173'
      const accountLinkUrl = await createAccountLink(
        user.sellerAccount.stripeConnectId,
        `${webUrl}/seller/onboard/return`,
        `${webUrl}/seller/onboard/refresh`
      )

      res.json({ data: { url: accountLinkUrl, status: 'onboarding_required' } })
      return
    }

    // Create a new Connect Express account
    const email = user.email ?? `${clerkId}@placeholder.local`
    const stripeConnectId = await createConnectAccount(user.id, email)

    await prisma.sellerAccount.create({
      data: {
        userId: user.id,
        stripeConnectId,
      },
    })

    const webUrl = process.env['WEB_URL'] ?? 'http://localhost:5173'
    const accountLinkUrl = await createAccountLink(
      stripeConnectId,
      `${webUrl}/seller/onboard/return`,
      `${webUrl}/seller/onboard/refresh`
    )

    res.status(201).json({ data: { url: accountLinkUrl, status: 'onboarding_started' } })
  } catch (err) {
    console.error('[POST /seller/onboard]', { err })
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to start seller onboarding.' } })
  }
})

// GET /api/v1/seller/onboard/callback — called when user returns from Stripe onboarding
router.get('/onboard/callback', async (req, res) => {
  try {
    const clerkId = getUserId(req)

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { sellerAccount: true },
    })

    if (!user?.sellerAccount) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Seller account not found.' } })
      return
    }

    const account = await getConnectAccount(user.sellerAccount.stripeConnectId)
    const onboardingComplete =
      account.details_submitted === true && account.charges_enabled === true

    await prisma.sellerAccount.update({
      where: { id: user.sellerAccount.id },
      data: { onboardingComplete },
    })

    res.json({ data: { onboardingComplete, status: onboardingComplete ? 'complete' : 'incomplete' } })
  } catch (err) {
    console.error('[GET /seller/onboard/callback]', { err })
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to verify onboarding.' } })
  }
})

// GET /api/v1/seller/dashboard — seller stats
router.get('/dashboard', async (req, res) => {
  try {
    const clerkId = getUserId(req)

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true, sellerAccount: true },
    })

    if (!user?.sellerAccount) {
      res.status(404).json({
        error: { code: 'NOT_SELLER', message: 'No seller account found. Complete onboarding first.' },
      })
      return
    }

    const [activeListings, totalOrders, recentOrders] = await Promise.all([
      prisma.listing.count({
        where: { sellerId: user.sellerAccount.id, isActive: true },
      }),
      prisma.order.count({
        where: { sellerId: user.sellerAccount.id },
      }),
      prisma.order.findMany({
        where: { sellerId: user.sellerAccount.id },
        include: { listing: { select: { bookTitle: true, bookAuthor: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ])

    res.json({
      data: {
        onboardingComplete: user.sellerAccount.onboardingComplete,
        stripeConnectId: user.sellerAccount.stripeConnectId,
        totalEarnings: user.sellerAccount.totalEarnings,
        activeListings,
        totalOrders,
        recentOrders,
      },
    })
  } catch (err) {
    console.error('[GET /seller/dashboard]', { err })
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch seller dashboard.' } })
  }
})

export default router
