import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Hoisted mock vars ────────────────────────────────────────────────────────
const {
  mockSessionCreate,
  mockPortalCreate,
  mockWebhooksConstructEvent,
  mockPrismaUser,
  mockPrismaSellerAccount,
} = vi.hoisted(() => ({
  mockSessionCreate:          vi.fn(),
  mockPortalCreate:           vi.fn(),
  mockWebhooksConstructEvent: vi.fn(),
  mockPrismaUser:             { findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
  mockPrismaSellerAccount:    { findUnique: vi.fn(), update: vi.fn() },
}))

// ─── Mock Stripe ──────────────────────────────────────────────────────────────
vi.mock('stripe', () => {
  const StripeClass = vi.fn().mockImplementation(() => ({
    checkout: {
      sessions: { create: mockSessionCreate },
    },
    billingPortal: {
      sessions: { create: mockPortalCreate },
    },
    webhooks: {
      constructEvent: mockWebhooksConstructEvent,
    },
  }))
  return { default: StripeClass }
})

// ─── Mock Prisma ──────────────────────────────────────────────────────────────
vi.mock('../lib/prisma.js', () => ({
  prisma: {
    user:          mockPrismaUser,
    sellerAccount: mockPrismaSellerAccount,
  },
}))

// ─── Import after mocks ───────────────────────────────────────────────────────
import {
  COMMISSION_RATES,
  createCheckoutSession,
  createPortalSession,
  constructWebhookEvent,
} from '../services/stripeService.js'

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('COMMISSION_RATES', () => {
  it('FREE rate is 0 (FREE plan cannot sell)', () => {
    expect(COMMISSION_RATES.FREE).toBe(0)
  })

  it('READER commission rate is 15% (0.15)', () => {
    expect(COMMISSION_RATES.READER).toBe(0.15)
  })

  it('COLLECTOR commission rate is 12% (0.12)', () => {
    expect(COMMISSION_RATES.COLLECTOR).toBe(0.12)
  })

  it('BIBLIOPHILE commission rate is 10% (0.10)', () => {
    expect(COMMISSION_RATES.BIBLIOPHILE).toBe(0.10)
  })

  it('BIBLIOPHILE has the lowest commission rate', () => {
    const rates = Object.values(COMMISSION_RATES).filter((r) => r > 0)
    expect(Math.min(...rates)).toBe(COMMISSION_RATES.BIBLIOPHILE)
  })

  it('READER has the highest commission rate', () => {
    const rates = Object.values(COMMISSION_RATES).filter((r) => r > 0)
    expect(Math.max(...rates)).toBe(COMMISSION_RATES.READER)
  })
})

describe('createCheckoutSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls stripe.checkout.sessions.create with mode = subscription', async () => {
    mockPrismaUser.findUnique.mockResolvedValue({ stripeCustomerId: null, email: 'user@test.com' })
    const fakeSession = { id: 'cs_test_123', url: 'https://checkout.stripe.com/test' }
    mockSessionCreate.mockResolvedValue(fakeSession)

    const result = await createCheckoutSession('user_1', 'clerk_1', 'price_abc', 'READER')

    expect(mockSessionCreate).toHaveBeenCalledTimes(1)
    const callArgs = mockSessionCreate.mock.calls[0]?.[0]
    expect(callArgs).toMatchObject({
      mode: 'subscription',
      payment_method_types: ['card'],
    })
    expect(result).toEqual(fakeSession)
  })

  it('passes the correct price line item', async () => {
    mockPrismaUser.findUnique.mockResolvedValue({ stripeCustomerId: null, email: 'user@test.com' })
    mockSessionCreate.mockResolvedValue({ id: 'cs_test_456' })

    await createCheckoutSession('user_1', 'clerk_1', 'price_reader_monthly', 'READER')

    const callArgs = mockSessionCreate.mock.calls[0]?.[0]
    expect(callArgs.line_items).toEqual([{ price: 'price_reader_monthly', quantity: 1 }])
  })

  it('sets metadata with userId, clerkId, planName', async () => {
    mockPrismaUser.findUnique.mockResolvedValue({ stripeCustomerId: null, email: 'user@test.com' })
    mockSessionCreate.mockResolvedValue({ id: 'cs_test_789' })

    await createCheckoutSession('user_abc', 'clerk_xyz', 'price_xyz', 'COLLECTOR')

    const callArgs = mockSessionCreate.mock.calls[0]?.[0]
    expect(callArgs.metadata).toMatchObject({
      userId: 'user_abc',
      clerkId: 'clerk_xyz',
      planName: 'COLLECTOR',
    })
  })

  it('uses existing stripeCustomerId when user already has one', async () => {
    mockPrismaUser.findUnique.mockResolvedValue({
      stripeCustomerId: 'cus_existing_123',
      email: 'user@test.com',
    })
    mockSessionCreate.mockResolvedValue({ id: 'cs_test_cus' })

    await createCheckoutSession('user_1', 'clerk_1', 'price_abc', 'READER')

    const callArgs = mockSessionCreate.mock.calls[0]?.[0]
    expect(callArgs.customer).toBe('cus_existing_123')
    // customer_email should NOT be set when customer ID is provided
    expect(callArgs.customer_email).toBeUndefined()
  })

  it('sets customer_email and no customer when user has no stripeCustomerId', async () => {
    mockPrismaUser.findUnique.mockResolvedValue({
      stripeCustomerId: null,
      email: 'newuser@test.com',
    })
    mockSessionCreate.mockResolvedValue({ id: 'cs_test_new' })

    await createCheckoutSession('user_2', 'clerk_2', 'price_abc', 'READER')

    const callArgs = mockSessionCreate.mock.calls[0]?.[0]
    expect(callArgs.customer).toBeUndefined()
    expect(callArgs.customer_email).toBe('newuser@test.com')
  })

  it('includes subscription_data.metadata with userId, clerkId, planName', async () => {
    mockPrismaUser.findUnique.mockResolvedValue({ stripeCustomerId: null, email: 'u@t.com' })
    mockSessionCreate.mockResolvedValue({ id: 'cs_test_sub' })

    await createCheckoutSession('u1', 'c1', 'price_bib', 'BIBLIOPHILE')

    const callArgs = mockSessionCreate.mock.calls[0]?.[0]
    expect(callArgs.subscription_data?.metadata).toMatchObject({
      userId: 'u1',
      clerkId: 'c1',
      planName: 'BIBLIOPHILE',
    })
  })
})

describe('createPortalSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls stripe.billingPortal.sessions.create with the customerId', async () => {
    mockPortalCreate.mockResolvedValue({ id: 'bps_test_123', url: 'https://billing.stripe.com/p/test' })

    await createPortalSession('cus_abc123')

    expect(mockPortalCreate).toHaveBeenCalledTimes(1)
    const callArgs = mockPortalCreate.mock.calls[0]?.[0]
    expect(callArgs.customer).toBe('cus_abc123')
  })

  it('returns the billing portal session', async () => {
    const fakePortal = { id: 'bps_test_456', url: 'https://billing.stripe.com/p/test456' }
    mockPortalCreate.mockResolvedValue(fakePortal)

    const result = await createPortalSession('cus_xyz')

    expect(result).toEqual(fakePortal)
  })
})

describe('constructWebhookEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('delegates to stripe.webhooks.constructEvent with raw body and signature', () => {
    const fakeEvent = { id: 'evt_test', type: 'checkout.session.completed' }
    mockWebhooksConstructEvent.mockReturnValue(fakeEvent)

    const rawBody = Buffer.from('{}')
    const sig = 'whsec_test_sig'

    const result = constructWebhookEvent(rawBody, sig)

    expect(mockWebhooksConstructEvent).toHaveBeenCalledWith(rawBody, sig, expect.any(String))
    expect(result).toEqual(fakeEvent)
  })

  it('propagates error thrown by stripe.webhooks.constructEvent (invalid signature)', () => {
    mockWebhooksConstructEvent.mockImplementation(() => {
      throw new Error('No signatures found matching the expected signature for payload')
    })

    expect(() => constructWebhookEvent(Buffer.from('{}'), 'bad_sig')).toThrow(
      'No signatures found matching the expected signature for payload'
    )
  })
})
