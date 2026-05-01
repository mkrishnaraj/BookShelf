/**
 * Integration tests for GET /api/v1/stats
 */
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest'
import { createServer } from 'node:http'
import type { Server } from 'node:http'

// ─── Hoisted mock vars ────────────────────────────────────────────────────────
const {
  mockPrismaUser,
  mockPrismaBook,
  mockPrismaReadingSession,
} = vi.hoisted(() => ({
  mockPrismaUser: {
    findUnique: vi.fn(),
    create:     vi.fn(),
    update:     vi.fn(),
    updateMany: vi.fn(),
  },
  mockPrismaBook: {
    count:    vi.fn(),
    findMany: vi.fn(),
    groupBy:  vi.fn(),
  },
  mockPrismaReadingSession: {
    findMany: vi.fn(),
  },
}))

// ─── Mock Clerk ───────────────────────────────────────────────────────────────
vi.mock('@clerk/express', () => ({
  getAuth: vi.fn(() => ({ userId: 'test_user_1' })),
  clerkMiddleware: vi.fn(() => (_req: unknown, _res: unknown, next: () => void) => next()),
}))

// ─── Mock shared ─────────────────────────────────────────────────────────────
vi.mock('shared', () => ({
  PLAN_LIMITS: {
    FREE:        { shelves: 1,  maxShelfSize: 'S',  themes: false, goodreadsImport: false },
    READER:      { shelves: 3,  maxShelfSize: 'L',  themes: false, goodreadsImport: true  },
    COLLECTOR:   { shelves: -1, maxShelfSize: 'XL', themes: true,  goodreadsImport: true  },
    BIBLIOPHILE: { shelves: -1, maxShelfSize: 'XL', themes: true,  goodreadsImport: true  },
  },
  SHELF_CAPACITY: { S: 50, M: 150, L: 300, XL: 500 },
}))

// ─── Mock Prisma ──────────────────────────────────────────────────────────────
vi.mock('../lib/prisma.js', () => ({
  prisma: {
    user:           mockPrismaUser,
    shelf:          { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), count: vi.fn() },
    book:           mockPrismaBook,
    sellerAccount:  { findUnique: vi.fn(), update: vi.fn() },
    readingSession: mockPrismaReadingSession,
  },
}))

// ─── Mock Stripe ──────────────────────────────────────────────────────────────
vi.mock('stripe', () => {
  const S = vi.fn().mockImplementation(() => ({
    checkout:      { sessions: { create: vi.fn() } },
    billingPortal: { sessions: { create: vi.fn() } },
    webhooks:      { constructEvent: vi.fn() },
  }))
  return { default: S }
})

vi.mock('ai', () => ({}))
vi.mock('cloudinary', () => ({ v2: { config: vi.fn(), uploader: { upload: vi.fn() } } }))

// ─── Build test app ───────────────────────────────────────────────────────────
import express from 'express'
import statsRouter from '../routes/stats'
import { requireAuth } from '../middleware/auth'

function buildTestApp() {
  const app = express()
  app.use(express.json())
  app.use('/api/v1/stats', requireAuth, statsRouter)
  return app
}

let server: Server
let baseUrl: string

beforeAll(async () => {
  const app = buildTestApp()
  server = createServer(app)
  await new Promise<void>((resolve) => server.listen(0, resolve))
  const addr = server.address() as { port: number }
  baseUrl = `http://127.0.0.1:${addr.port}`
})

afterAll(async () => {
  await new Promise<void>((resolve, reject) =>
    server.close((err) => (err ? reject(err) : resolve()))
  )
})

beforeEach(() => {
  vi.clearAllMocks()

  // Default user
  mockPrismaUser.findUnique.mockResolvedValue({ id: 'db_user_1', clerkId: 'test_user_1' })

  // Default: no books read, no sessions
  mockPrismaBook.count.mockResolvedValue(0)
  mockPrismaBook.findMany.mockResolvedValue([])
  mockPrismaBook.groupBy.mockResolvedValue([])
  mockPrismaReadingSession.findMany.mockResolvedValue([])
})

// ─── HTTP helper ──────────────────────────────────────────────────────────────
async function getStats(query = '') {
  return fetch(`${baseUrl}/api/v1/stats${query}`, {
    headers: { Authorization: 'Bearer fake_token' },
  })
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('GET /api/v1/stats', () => {
  it('returns 200 with booksRead, pagesRead, byPeriod when period=week', async () => {
    mockPrismaBook.count.mockResolvedValue(2)
    mockPrismaReadingSession.findMany.mockResolvedValue([
      { startedAt: new Date('2026-04-22T10:00:00Z'), pagesRead: 50 },
      { startedAt: new Date('2026-04-23T10:00:00Z'), pagesRead: 30 },
    ])

    const res = await getStats('?period=week')
    expect(res.status).toBe(200)

    const json = await res.json() as {
      data: {
        period: string
        booksRead: number
        pagesRead: number
        byPeriod: unknown[]
      }
    }

    expect(json.data.period).toBe('week')
    expect(typeof json.data.booksRead).toBe('number')
    expect(typeof json.data.pagesRead).toBe('number')
    expect(Array.isArray(json.data.byPeriod)).toBe(true)
  })

  it('returns correct booksRead count from prisma', async () => {
    mockPrismaBook.count.mockResolvedValue(7)
    mockPrismaReadingSession.findMany.mockResolvedValue([])

    const res = await getStats('?period=week')
    const json = await res.json() as { data: { booksRead: number } }

    expect(json.data.booksRead).toBe(7)
  })

  it('returns correct pagesRead sum from reading sessions', async () => {
    mockPrismaReadingSession.findMany.mockResolvedValue([
      { startedAt: new Date(), pagesRead: 100 },
      { startedAt: new Date(), pagesRead: 75 },
      { startedAt: new Date(), pagesRead: 25 },
    ])

    const res = await getStats('?period=month')
    const json = await res.json() as { data: { pagesRead: number } }

    expect(json.data.pagesRead).toBe(200)
  })

  it('defaults to period=month when no period param is given', async () => {
    const res = await getStats('')
    expect(res.status).toBe(200)

    const json = await res.json() as { data: { period: string } }
    // The Zod schema defaults to 'month'
    expect(json.data.period).toBe('month')
  })

  it('returns byPeriod as empty array when there are no sessions', async () => {
    mockPrismaReadingSession.findMany.mockResolvedValue([])

    const res = await getStats('?period=week')
    const json = await res.json() as { data: { byPeriod: unknown[] } }

    expect(json.data.byPeriod).toEqual([])
  })

  it('returns period=month when period=month is specified', async () => {
    const res = await getStats('?period=month')
    expect(res.status).toBe(200)

    const json = await res.json() as { data: { period: string } }
    expect(json.data.period).toBe('month')
  })

  it('returns period=year when period=year is specified', async () => {
    const res = await getStats('?period=year')
    expect(res.status).toBe(200)

    const json = await res.json() as { data: { period: string } }
    expect(json.data.period).toBe('year')
  })

  it('returns 422 for invalid period value', async () => {
    const res = await getStats('?period=decade')
    expect(res.status).toBe(422)

    const json = await res.json() as { error: { code: string } }
    expect(json.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 404 when user row does not exist', async () => {
    mockPrismaUser.findUnique.mockResolvedValue(null)

    const res = await getStats('?period=week')
    expect(res.status).toBe(404)

    const json = await res.json() as { error: { code: string } }
    expect(json.error.code).toBe('USER_NOT_FOUND')
  })

  it('includes avgRating as null when no rated books in period', async () => {
    mockPrismaBook.findMany.mockResolvedValue([])

    const res = await getStats('?period=week')
    const json = await res.json() as { data: { avgRating: null } }

    expect(json.data.avgRating).toBeNull()
  })

  it('includes avgRating when rated books exist', async () => {
    mockPrismaBook.findMany.mockResolvedValue([
      { rating: 4 },
      { rating: 5 },
    ])
    mockPrismaBook.count.mockResolvedValue(2)

    const res = await getStats('?period=week')
    const json = await res.json() as { data: { avgRating: number } }

    expect(json.data.avgRating).toBe(4.5)
  })

  it('returns pagesRead=0 when sessions have null pagesRead fields', async () => {
    mockPrismaReadingSession.findMany.mockResolvedValue([
      { startedAt: new Date(), pagesRead: null },
      { startedAt: new Date(), pagesRead: null },
    ])

    const res = await getStats('?period=week')
    const json = await res.json() as { data: { pagesRead: number } }

    expect(json.data.pagesRead).toBe(0)
  })

  it('includes totalByStatus from prisma groupBy result', async () => {
    mockPrismaBook.groupBy.mockResolvedValue([
      { status: 'READ', _count: 10 },
      { status: 'READING', _count: 2 },
      { status: 'WANT_TO_READ', _count: 5 },
    ])

    const res = await getStats('?period=week')
    const json = await res.json() as { data: { totalByStatus: Record<string, number> } }

    expect(json.data.totalByStatus).toMatchObject({
      READ: 10,
      READING: 2,
      WANT_TO_READ: 5,
    })
  })

  it('groups sessions by day for week period', async () => {
    mockPrismaReadingSession.findMany.mockResolvedValue([
      { startedAt: new Date('2026-04-22T08:00:00Z'), pagesRead: 20 },
      { startedAt: new Date('2026-04-22T14:00:00Z'), pagesRead: 30 },
      { startedAt: new Date('2026-04-23T10:00:00Z'), pagesRead: 40 },
    ])

    const res = await getStats('?period=week')
    const json = await res.json() as {
      data: { byPeriod: Array<{ label: string; pagesRead: number; sessions: number }> }
    }

    // Two distinct days → two groups
    expect(json.data.byPeriod).toHaveLength(2)

    const day22 = json.data.byPeriod.find((g) => g.label === '2026-04-22')
    expect(day22?.pagesRead).toBe(50)   // 20 + 30
    expect(day22?.sessions).toBe(2)

    const day23 = json.data.byPeriod.find((g) => g.label === '2026-04-23')
    expect(day23?.pagesRead).toBe(40)
    expect(day23?.sessions).toBe(1)
  })
})
