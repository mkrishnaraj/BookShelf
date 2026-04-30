import 'dotenv/config'
import { initSentry } from './lib/sentry.js'
initSentry()
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import { clerkMiddleware } from '@clerk/express'

// Routers
import shelvesRouter from './routes/shelves.js'
import booksRouter from './routes/books.js'
import usersRouter from './routes/users.js'
import statsRouter from './routes/stats.js'
import streaksRouter from './routes/streaks.js'
import wishlistRouter from './routes/wishlist.js'
import notebookRouter from './routes/notebook.js'
import socialRouter from './routes/social.js'
import billingRouter from './routes/billing.js'
import sellerRouter from './routes/seller.js'
import marketplaceRouter from './routes/marketplace.js'
import scanRouter from './routes/scan.js'
import webhooksRouter from './routes/webhooks.js'
import recommendationsRouter from './routes/recommendations.js'
import feedbackRouter from './routes/feedback.js'

// Auth middleware
import { requireAuth } from './middleware/auth.js'

const app = express()
const PORT = process.env['PORT'] ?? 3001

// ─── Security & Logging ───────────────────────────────────────────────────────

app.use(helmet())
app.use(cors({ origin: process.env['WEB_URL'] ?? 'http://localhost:5173', credentials: true }))
app.use(morgan('dev'))

// ─── Stripe Webhook — must use raw body BEFORE express.json() ─────────────────

app.use(
  '/api/webhooks',
  express.raw({ type: 'application/json' }),
  webhooksRouter
)

// ─── Body Parsing ─────────────────────────────────────────────────────────────

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// ─── Rate Limiting (global fallback) ─────────────────────────────────────────

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  })
)

// ─── Clerk Auth Middleware ────────────────────────────────────────────────────

// Parses + verifies Clerk JWT on every request; does NOT block unauthenticated
// requests here — individual route guards call requireAuth themselves.
app.use(clerkMiddleware())

// ─── Health Check (no auth) ───────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    version: process.env['npm_package_version'] ?? '1.0.0',
    timestamp: new Date().toISOString(),
  })
})

// ─── Public Routes (no auth) ──────────────────────────────────────────────────

app.use('/api/public', socialRouter)

// ─── Protected API Routes ─────────────────────────────────────────────────────

// Shelves
app.use('/api/v1/shelves', requireAuth, shelvesRouter)

// Books — router handles both /books/... and /shelves/:shelfId/books paths
app.use('/api/v1', requireAuth, booksRouter)

// Users
app.use('/api/v1/users', requireAuth, usersRouter)

// Stats
app.use('/api/v1/stats', requireAuth, statsRouter)

// Streaks
app.use('/api/v1/streaks', requireAuth, streaksRouter)

// Wishlist
app.use('/api/v1/wishlist', requireAuth, wishlistRouter)

// Notebook
app.use('/api/v1/notebook', requireAuth, notebookRouter)

// Billing
app.use('/api/v1/billing', requireAuth, billingRouter)

// Seller onboarding & dashboard
app.use('/api/v1/seller', requireAuth, sellerRouter)

// Marketplace (listings, orders)
app.use('/api/v1/marketplace', requireAuth, marketplaceRouter)

// Camera scan
app.use('/api/v1/scan', requireAuth, scanRouter)

// Recommendations
app.use('/api/v1/recommendations', requireAuth, recommendationsRouter)

// Feedback — no requireAuth, anonymous submissions accepted
app.use('/api/v1/feedback', feedbackRouter)

// ─── 404 Handler ──────────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found.' } })
})

// ─── Global Error Handler ─────────────────────────────────────────────────────

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Unhandled Error]', err)
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } })
})

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`)
})

export default app
