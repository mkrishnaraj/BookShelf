/**
 * Integration tests for GET/POST /api/v1/shelves
 *
 * Strategy: import the Express app after mocking Prisma and Clerk so that no
 * real database or authentication service is needed.  HTTP calls are made with
 * Node 18's built-in `fetch` against a real `http.Server` instance.
 */
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest'
import { createServer } from 'node:http'
import type { Server } from 'node:http'

// ─── Hoisted mock vars ────────────────────────────────────────────────────────
const {
  mockPrismaUser,
  mockPrismaShelf,
  mockPrismaBook,
} = vi.hoisted(() => ({
  mockPrismaUser: {
    findUnique: vi.fn(),
    create:     vi.fn(),
    update:     vi.fn(),
    updateMany: vi.fn(),
  },
  mockPrismaShelf: {
    findMany:   vi.fn(),
    findFirst:  vi.fn(),
    findUnique: vi.fn(),
    create:     vi.fn(),
    update:     vi.fn(),
    delete:     vi.fn(),
    count:      vi.fn(),
  },
  mockPrismaBook: {
    count: vi.fn(),
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
    shelf:          mockPrismaShelf,
    book:           mockPrismaBook,
    sellerAccount:  { findUnique: vi.fn(), update: vi.fn() },
    readingSession: { findMany: vi.fn() },
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

// ─── Mock packages not needed for this router ─────────────────────────────────
vi.mock('ai', () => ({}))
vi.mock('cloudinary', () => ({
  v2: { config: vi.fn(), uploader: { upload: vi.fn() } },
}))

// ─── Build a minimal test app ─────────────────────────────────────────────────
import express from 'express'
import shelvesRouter from '../routes/shelves'
import { requireAuth } from '../middleware/auth'

function buildTestApp() {
  const app = express()
  app.use(express.json())
  app.use('/api/v1/shelves', requireAuth, shelvesRouter)
  return app
}

// ─── Server lifecycle ─────────────────────────────────────────────────────────
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
  // Default: user exists with COLLECTOR plan (unlimited shelves)
  mockPrismaUser.findUnique.mockResolvedValue({
    id: 'db_user_1',
    clerkId: 'test_user_1',
    plan: 'COLLECTOR',
    email: 'test@example.com',
  })
})

// ─── HTTP helpers ─────────────────────────────────────────────────────────────
async function get(path: string) {
  return fetch(`${baseUrl}${path}`, {
    headers: { Authorization: 'Bearer fake_token' },
  })
}

async function post(path: string, body: unknown) {
  return fetch(`${baseUrl}${path}`, {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization:  'Bearer fake_token',
    },
    body: JSON.stringify(body),
  })
}

// ─── GET /api/v1/shelves ──────────────────────────────────────────────────────

describe('GET /api/v1/shelves', () => {
  it('returns 200 with an array in data', async () => {
    const fakeShelf = {
      id: 'shelf_1',
      name: 'My Shelf',
      size: 'S',
      theme: 'DARK_WOOD',
      sortOrder: 0,
      isPublic: false,
      publicSlug: null,
      userId: 'db_user_1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _count: { books: 3 },
    }
    mockPrismaShelf.findMany.mockResolvedValue([fakeShelf])

    const res = await get('/api/v1/shelves')
    expect(res.status).toBe(200)

    const json = await res.json() as { data: unknown[] }
    expect(Array.isArray(json.data)).toBe(true)
    expect(json.data).toHaveLength(1)
  })

  it('returns empty array when user has no shelves', async () => {
    mockPrismaShelf.findMany.mockResolvedValue([])

    const res = await get('/api/v1/shelves')
    expect(res.status).toBe(200)

    const json = await res.json() as { data: unknown[] }
    expect(json.data).toEqual([])
  })

  it('returns 404 when user row does not exist', async () => {
    // findUnique returns null for both user lookups (auth resolve + shelf query)
    mockPrismaUser.findUnique.mockResolvedValue(null)

    const res = await get('/api/v1/shelves')
    expect(res.status).toBe(404)

    const json = await res.json() as { error: { code: string } }
    expect(json.error.code).toBe('USER_NOT_FOUND')
  })
})

// ─── POST /api/v1/shelves ─────────────────────────────────────────────────────

describe('POST /api/v1/shelves', () => {
  beforeEach(() => {
    mockPrismaShelf.count.mockResolvedValue(0)
  })

  it('returns 201 with the created shelf on valid body', async () => {
    const fakeShelf = {
      id: 'shelf_new',
      name: 'Fantasy',
      size: 'M',
      theme: 'DARK_WOOD',
      sortOrder: 0,
      isPublic: false,
      publicSlug: null,
      userId: 'db_user_1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    mockPrismaShelf.create.mockResolvedValue(fakeShelf)

    const res = await post('/api/v1/shelves', { name: 'Fantasy', size: 'M' })
    expect(res.status).toBe(201)

    const json = await res.json() as { data: { name: string; size: string } }
    expect(json.data.name).toBe('Fantasy')
    expect(json.data.size).toBe('M')
  })

  it('returns 422 when title/name is missing', async () => {
    const res = await post('/api/v1/shelves', { size: 'S' })
    expect(res.status).toBe(422)

    const json = await res.json() as { error: { code: string } }
    expect(json.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 422 when name is an empty string', async () => {
    const res = await post('/api/v1/shelves', { name: '', size: 'S' })
    expect(res.status).toBe(422)

    const json = await res.json() as { error: { code: string } }
    expect(json.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 422 when size is an invalid value', async () => {
    const res = await post('/api/v1/shelves', { name: 'My Shelf', size: 'HUGE' })
    expect(res.status).toBe(422)
  })

  it('returns 403 when FREE plan user already has 1 shelf', async () => {
    mockPrismaUser.findUnique.mockResolvedValue({
      id: 'db_user_free',
      clerkId: 'test_user_1',
      plan: 'FREE',
      email: 'free@example.com',
    })
    mockPrismaShelf.count.mockResolvedValue(1)

    const res = await post('/api/v1/shelves', { name: 'Second Shelf', size: 'S' })
    expect(res.status).toBe(403)

    const json = await res.json() as { error: { code: string } }
    expect(json.error.code).toBe('SHELF_LIMIT_REACHED')
  })

  it('uses default size S and theme DARK_WOOD when omitted', async () => {
    const fakeShelf = {
      id: 'shelf_default',
      name: 'Sci-Fi',
      size: 'S',
      theme: 'DARK_WOOD',
      sortOrder: 0,
      isPublic: false,
      publicSlug: null,
      userId: 'db_user_1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    mockPrismaShelf.create.mockResolvedValue(fakeShelf)

    const res = await post('/api/v1/shelves', { name: 'Sci-Fi' })
    expect(res.status).toBe(201)

    expect(mockPrismaShelf.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ size: 'S', theme: 'DARK_WOOD' }),
      })
    )
  })
})
