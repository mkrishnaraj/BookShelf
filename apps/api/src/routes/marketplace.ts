import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { getUserId } from '../middleware/auth'
import { requirePlan } from '../middleware/planLimits'
import { validateBody, validateParams, validateQuery } from '../middleware/validate'
import { createMarketplaceCheckout } from '../services/connectService'
import { COMMISSION_RATES } from '../services/stripeService'
import type { Plan } from 'shared'

const router = Router()

// ─── Schemas ──────────────────────────────────────────────────────────────────

const idParam = z.object({ id: z.string().min(1) })

const createListingBody = z.object({
  bookTitle: z.string().min(1).max(500),
  bookAuthor: z.string().min(1).max(300),
  isbn: z.string().optional(),
  condition: z.enum(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR']),
  price: z.number().positive().multipleOf(0.01),
  coverUrl: z.string().url().optional(),
  description: z.string().max(2000).optional(),
})

const updateListingBody = z.object({
  bookTitle: z.string().min(1).max(500).optional(),
  bookAuthor: z.string().min(1).max(300).optional(),
  condition: z.enum(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR']).optional(),
  price: z.number().positive().multipleOf(0.01).optional(),
  coverUrl: z.string().url().optional(),
  description: z.string().max(2000).optional(),
  isActive: z.boolean().optional(),
})

const buyBody = z.object({
  shippingAddress: z.object({
    name: z.string().min(1),
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    postalCode: z.string().min(1),
    country: z.string().min(2).max(2),
  }),
})

const listingsQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  condition: z.enum(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR']).optional(),
  search: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function resolveUserId(clerkId: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) throw new Error('USER_NOT_FOUND')
  return user.id
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET /api/v1/marketplace/listings — public listings feed (no auth required upstream, but auth middleware wraps it)
router.get('/listings', validateQuery(listingsQuery), async (req, res) => {
  try {
    const query = (req as typeof req & { validatedQuery: z.infer<typeof listingsQuery> }).validatedQuery

    const where: Record<string, unknown> = { isActive: true }
    if (query.condition) where['condition'] = query.condition
    if (query.search) {
      where['OR'] = [
        { bookTitle: { contains: query.search, mode: 'insensitive' } },
        { bookAuthor: { contains: query.search, mode: 'insensitive' } },
      ]
    }
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      const priceFilter: Record<string, number> = {}
      if (query.minPrice !== undefined) priceFilter['gte'] = query.minPrice
      if (query.maxPrice !== undefined) priceFilter['lte'] = query.maxPrice
      where['price'] = priceFilter
    }

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          seller: {
            include: {
              user: { select: { name: true, avatarUrl: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.listing.count({ where }),
    ])

    res.json({ data: { listings, total, page: query.page, limit: query.limit } })
  } catch (err) {
    console.error('[GET /marketplace/listings]', { err })
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch listings.' } })
  }
})

// POST /api/v1/marketplace/listings — create listing (READER plan required)
router.post(
  '/listings',
  requirePlan('READER'),
  validateBody(createListingBody),
  async (req, res) => {
    try {
      const clerkId = getUserId(req)
      const userId = await resolveUserId(clerkId)

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { sellerAccount: true },
      })

      if (!user?.sellerAccount) {
        res.status(400).json({
          error: {
            code: 'SELLER_NOT_ONBOARDED',
            message: 'Complete seller onboarding before creating listings.',
          },
        })
        return
      }

      if (!user.sellerAccount.onboardingComplete) {
        res.status(400).json({
          error: {
            code: 'SELLER_ONBOARDING_INCOMPLETE',
            message: 'Finish Stripe onboarding before listing books.',
          },
        })
        return
      }

      // READER plan capped at 5 active listings
      const plan = (await prisma.user.findUnique({ where: { id: userId }, select: { plan: true } }))?.plan ?? 'FREE'
      if (plan === 'READER') {
        const activeCount = await prisma.listing.count({ where: { sellerId: user.sellerAccount.id, isActive: true } })
        if (activeCount >= 5) {
          res.status(403).json({ error: { code: 'LISTING_LIMIT_REACHED', message: 'Reader plan allows a maximum of 5 active listings. Upgrade to list more.' } })
          return
        }
      }

      const body = req.body as z.infer<typeof createListingBody>

      const listing = await prisma.listing.create({
        data: {
          sellerId: user.sellerAccount.id,
          bookTitle: body.bookTitle,
          bookAuthor: body.bookAuthor,
          isbn: body.isbn,
          condition: body.condition,
          price: body.price,
          coverUrl: body.coverUrl,
          description: body.description,
        },
      })

      res.status(201).json({ data: listing })
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      if (msg === 'USER_NOT_FOUND') {
        res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found.' } })
        return
      }
      console.error('[POST /marketplace/listings]', { err })
      res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to create listing.' } })
    }
  }
)

// PATCH /api/v1/marketplace/listings/:id
router.patch(
  '/listings/:id',
  validateParams(idParam),
  validateBody(updateListingBody),
  async (req, res) => {
    try {
      const clerkId = getUserId(req)
      const userId = await resolveUserId(clerkId)

      const listing = await prisma.listing.findFirst({
        where: {
          id: req.params['id'],
          seller: { userId },
        },
        select: { id: true, isActive: true },
      })

      if (!listing) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Listing not found.' } })
        return
      }

      const body = req.body as z.infer<typeof updateListingBody>

      // Price cannot be changed once a listing is reserved or sold
      if (body.price !== undefined && !listing.isActive) {
          res.status(409).json({ error: { code: 'LISTING_NOT_EDITABLE', message: 'Price cannot be changed after a listing is reserved or sold.' } })
        return
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updated = await prisma.listing.update({
        where: { id: req.params['id'] },
        data: body as any,
      })

      res.json({ data: updated })
    } catch (err) {
      console.error('[PATCH /marketplace/listings/:id]', { err })
      res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to update listing.' } })
    }
  }
)

// DELETE /api/v1/marketplace/listings/:id
router.delete('/listings/:id', validateParams(idParam), async (req, res) => {
  try {
    const clerkId = getUserId(req)
    const userId = await resolveUserId(clerkId)

    const listing = await prisma.listing.findFirst({
      where: { id: req.params['id'], seller: { userId } },
      select: { id: true },
    })

    if (!listing) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Listing not found.' } })
      return
    }

    await prisma.listing.delete({ where: { id: req.params['id'] } })

    res.json({ data: { deleted: true } })
  } catch (err) {
    console.error('[DELETE /marketplace/listings/:id]', { err })
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to delete listing.' } })
  }
})

// POST /api/v1/marketplace/listings/:id/buy — buyer initiates purchase
router.post(
  '/listings/:id/buy',
  validateParams(idParam),
  validateBody(buyBody),
  async (req, res) => {
    try {
      const clerkId = getUserId(req)

      const buyer = await prisma.user.findUnique({
        where: { clerkId },
        select: { id: true, plan: true },
      })

      if (!buyer) {
        res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found.' } })
        return
      }

      const listing = await prisma.listing.findFirst({
        where: { id: req.params['id'], isActive: true },
        include: {
          seller: {
            include: { user: { select: { id: true } } },
          },
        },
      })

      if (!listing) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Listing not found or no longer available.' } })
        return
      }

      // Buyer cannot buy their own listing
      if (listing.seller.userId === buyer.id) {
        res.status(400).json({ error: { code: 'CANNOT_BUY_OWN', message: 'You cannot buy your own listing.' } })
        return
      }

      if (!listing.seller.onboardingComplete) {
        res.status(400).json({ error: { code: 'SELLER_NOT_READY', message: 'Seller is not accepting payments yet.' } })
        return
      }

      // Calculate platform fee based on seller's plan
      const sellerUser = await prisma.user.findUnique({
        where: { id: listing.seller.userId },
        select: { plan: true },
      })
      const sellerPlan = (sellerUser?.plan ?? 'FREE') as Plan
      const commissionRate = COMMISSION_RATES[sellerPlan]

      const amountCents = Math.round(Number(listing.price) * 100)
      const platformFeeCents = Math.round(amountCents * commissionRate)

      const body = req.body as z.infer<typeof buyBody>

      // Build shipping address as Record<string, string> — filter out undefined values
      const shippingAddr: Record<string, string> = {}
      for (const [k, v] of Object.entries(body.shippingAddress)) {
        if (v !== undefined) shippingAddr[k] = v
      }

      const session = await createMarketplaceCheckout({
        listingId: listing.id,
        buyerUserId: buyer.id,
        sellerConnectId: listing.seller.stripeConnectId,
        amountCents,
        platformFeeCents,
        bookTitle: listing.bookTitle,
        shippingAddress: shippingAddr,
      })

      res.json({ data: { url: session.url, sessionId: session.id } })
    } catch (err) {
      console.error('[POST /marketplace/listings/:id/buy]', { err })
      res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to initiate purchase.' } })
    }
  }
)

// GET /api/v1/marketplace/orders — buyer's orders
router.get('/orders', async (req, res) => {
  try {
    const clerkId = getUserId(req)
    const userId = await resolveUserId(clerkId)

    const orders = await prisma.order.findMany({
      where: { buyerId: userId },
      include: {
        listing: { select: { bookTitle: true, bookAuthor: true, isbn: true, coverUrl: true } },
        seller: { include: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json({ data: orders })
  } catch (err) {
    console.error('[GET /marketplace/orders]', { err })
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch orders.' } })
  }
})

// GET /api/v1/marketplace/seller/orders — seller's received orders
router.get('/seller/orders', async (req, res) => {
  try {
    const clerkId = getUserId(req)
    const userId = await resolveUserId(clerkId)

    const sellerAccount = await prisma.sellerAccount.findUnique({
      where: { userId },
      select: { id: true },
    })

    if (!sellerAccount) {
      res.status(404).json({ error: { code: 'NOT_SELLER', message: 'No seller account found.' } })
      return
    }

    const orders = await prisma.order.findMany({
      where: { sellerId: sellerAccount.id },
      include: {
        listing: { select: { bookTitle: true, bookAuthor: true } },
        buyer: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json({ data: orders })
  } catch (err) {
    console.error('[GET /marketplace/seller/orders]', { err })
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch seller orders.' } })
  }
})

export default router
