import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Request, Response, NextFunction } from 'express'

// ─── Hoisted mock vars (must use vi.hoisted so they're available in vi.mock factories) ──
const { mockPrismaUser, mockPrismaShelf, mockPrismaBook } = vi.hoisted(() => ({
  mockPrismaUser: {
    findUnique: vi.fn(),
  },
  mockPrismaShelf: {
    count: vi.fn(),
    findUnique: vi.fn(),
  },
  mockPrismaBook: {
    count: vi.fn(),
  },
}))

// ─── Mock 'shared' ────────────────────────────────────────────────────────────
vi.mock('shared', () => ({
  PLAN_LIMITS: {
    FREE:        { shelves: 1,  maxShelfSize: 'S',  themes: false, goodreadsImport: false },
    READER:      { shelves: 3,  maxShelfSize: 'L',  themes: false, goodreadsImport: true  },
    COLLECTOR:   { shelves: -1, maxShelfSize: 'XL', themes: true,  goodreadsImport: true  },
    BIBLIOPHILE: { shelves: -1, maxShelfSize: 'XL', themes: true,  goodreadsImport: true  },
  },
  SHELF_CAPACITY: { S: 50, M: 150, L: 300, XL: 500 },
}))

// ─── Mock '@clerk/express' ────────────────────────────────────────────────────
vi.mock('@clerk/express', () => ({
  getAuth: vi.fn(() => ({ userId: 'clerk_test_user' })),
  clerkMiddleware: vi.fn(() => (_req: Request, _res: Response, next: NextFunction) => next()),
}))

// ─── Mock prisma ──────────────────────────────────────────────────────────────
vi.mock('../lib/prisma.js', () => ({
  prisma: {
    user:  mockPrismaUser,
    shelf: mockPrismaShelf,
    book:  mockPrismaBook,
  },
}))

// ─── Import after mocks ───────────────────────────────────────────────────────
import { checkShelfLimit, requirePlan } from '../middleware/planLimits.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeReqResNext() {
  const req = {} as Request
  const res = {
    status: vi.fn().mockReturnThis(),
    json:   vi.fn().mockReturnThis(),
  } as unknown as Response
  const next = vi.fn() as unknown as NextFunction
  return { req, res, next }
}

// ─── checkShelfLimit ──────────────────────────────────────────────────────────

describe('checkShelfLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 403 when FREE user already has 1 shelf (limit = 1)', async () => {
    mockPrismaUser.findUnique.mockResolvedValue({ id: 'user_1', plan: 'FREE' })
    mockPrismaShelf.count.mockResolvedValue(1)

    const { req, res, next } = makeReqResNext()
    await checkShelfLimit(req, res, next)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'SHELF_LIMIT_REACHED' }),
      })
    )
    expect(next).not.toHaveBeenCalled()
  })

  it('calls next() when FREE user has 0 shelves (limit = 1)', async () => {
    mockPrismaUser.findUnique.mockResolvedValue({ id: 'user_1', plan: 'FREE' })
    mockPrismaShelf.count.mockResolvedValue(0)

    const { req, res, next } = makeReqResNext()
    await checkShelfLimit(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
  })

  it('calls next() when READER user has 2 shelves (limit = 3)', async () => {
    mockPrismaUser.findUnique.mockResolvedValue({ id: 'user_2', plan: 'READER' })
    mockPrismaShelf.count.mockResolvedValue(2)

    const { req, res, next } = makeReqResNext()
    await checkShelfLimit(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
  })

  it('returns 403 when READER user already has 3 shelves (limit = 3)', async () => {
    mockPrismaUser.findUnique.mockResolvedValue({ id: 'user_2', plan: 'READER' })
    mockPrismaShelf.count.mockResolvedValue(3)

    const { req, res, next } = makeReqResNext()
    await checkShelfLimit(req, res, next)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'SHELF_LIMIT_REACHED' }),
      })
    )
  })

  it('calls next() for COLLECTOR user regardless of shelf count (limit = -1)', async () => {
    mockPrismaUser.findUnique.mockResolvedValue({ id: 'user_3', plan: 'COLLECTOR' })

    const { req, res, next } = makeReqResNext()
    await checkShelfLimit(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(mockPrismaShelf.count).not.toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
  })

  it('calls next() for BIBLIOPHILE user regardless of shelf count (limit = -1)', async () => {
    mockPrismaUser.findUnique.mockResolvedValue({ id: 'user_4', plan: 'BIBLIOPHILE' })

    const { req, res, next } = makeReqResNext()
    await checkShelfLimit(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(mockPrismaShelf.count).not.toHaveBeenCalled()
  })

  it('returns 404 when user row does not exist', async () => {
    mockPrismaUser.findUnique.mockResolvedValue(null)

    const { req, res, next } = makeReqResNext()
    await checkShelfLimit(req, res, next)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'USER_NOT_FOUND' }),
      })
    )
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 500 on prisma error', async () => {
    mockPrismaUser.findUnique.mockRejectedValue(new Error('DB connection failed'))

    const { req, res, next } = makeReqResNext()
    await checkShelfLimit(req, res, next)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'INTERNAL_ERROR' }),
      })
    )
  })
})

// ─── requirePlan ──────────────────────────────────────────────────────────────

describe('requirePlan', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('requirePlan("FREE"): any plan (including FREE) passes', async () => {
    mockPrismaUser.findUnique.mockResolvedValue({ plan: 'FREE' })
    const { req, res, next } = makeReqResNext()
    await requirePlan('FREE')(req, res, next)
    expect(next).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
  })

  it('requirePlan("FREE"): READER plan also passes', async () => {
    mockPrismaUser.findUnique.mockResolvedValue({ plan: 'READER' })
    const { req, res, next } = makeReqResNext()
    await requirePlan('FREE')(req, res, next)
    expect(next).toHaveBeenCalled()
  })

  it('requirePlan("READER"): FREE plan → 403', async () => {
    mockPrismaUser.findUnique.mockResolvedValue({ plan: 'FREE' })
    const { req, res, next } = makeReqResNext()
    await requirePlan('READER')(req, res, next)
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: 'PLAN_REQUIRED',
          requiredPlan: 'READER',
          currentPlan: 'FREE',
        }),
      })
    )
    expect(next).not.toHaveBeenCalled()
  })

  it('requirePlan("READER"): READER plan passes', async () => {
    mockPrismaUser.findUnique.mockResolvedValue({ plan: 'READER' })
    const { req, res, next } = makeReqResNext()
    await requirePlan('READER')(req, res, next)
    expect(next).toHaveBeenCalled()
  })

  it('requirePlan("READER"): COLLECTOR plan passes (higher tier)', async () => {
    mockPrismaUser.findUnique.mockResolvedValue({ plan: 'COLLECTOR' })
    const { req, res, next } = makeReqResNext()
    await requirePlan('READER')(req, res, next)
    expect(next).toHaveBeenCalled()
  })

  it('requirePlan("COLLECTOR"): READER plan → 403', async () => {
    mockPrismaUser.findUnique.mockResolvedValue({ plan: 'READER' })
    const { req, res, next } = makeReqResNext()
    await requirePlan('COLLECTOR')(req, res, next)
    expect(res.status).toHaveBeenCalledWith(403)
    expect(next).not.toHaveBeenCalled()
  })

  it('requirePlan("BIBLIOPHILE"): COLLECTOR plan → 403', async () => {
    mockPrismaUser.findUnique.mockResolvedValue({ plan: 'COLLECTOR' })
    const { req, res, next } = makeReqResNext()
    await requirePlan('BIBLIOPHILE')(req, res, next)
    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('requirePlan("BIBLIOPHILE"): BIBLIOPHILE plan passes', async () => {
    mockPrismaUser.findUnique.mockResolvedValue({ plan: 'BIBLIOPHILE' })
    const { req, res, next } = makeReqResNext()
    await requirePlan('BIBLIOPHILE')(req, res, next)
    expect(next).toHaveBeenCalled()
  })

  it('treats missing user (null) as FREE plan', async () => {
    mockPrismaUser.findUnique.mockResolvedValue(null)
    const { req, res, next } = makeReqResNext()
    // FREE → FREE is allowed
    await requirePlan('FREE')(req, res, next)
    expect(next).toHaveBeenCalled()
  })

  it('treats missing user (null) as FREE plan → READER required → 403', async () => {
    mockPrismaUser.findUnique.mockResolvedValue(null)
    const { req, res, next } = makeReqResNext()
    await requirePlan('READER')(req, res, next)
    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('returns 500 on prisma error', async () => {
    mockPrismaUser.findUnique.mockRejectedValue(new Error('Timeout'))
    const { req, res, next } = makeReqResNext()
    await requirePlan('READER')(req, res, next)
    expect(res.status).toHaveBeenCalledWith(500)
  })
})
