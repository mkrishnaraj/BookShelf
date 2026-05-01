import 'dotenv/config'
import { initSentry } from './lib/sentry'
initSentry()
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import { clerkMiddleware } from '@clerk/express'

// Routers
import shelvesRouter from './routes/shelves'
import booksRouter from './routes/books'
import usersRouter from './routes/users'
import statsRouter from './routes/stats'
import streaksRouter from './routes/streaks'
import wishlistRouter from './routes/wishlist'
import notebookRouter from './routes/notebook'
import socialRouter from './routes/social'
import billingRouter from './routes/billing'
import sellerRouter from './routes/seller'
import marketplaceRouter from './routes/marketplace'
import scanRouter from './routes/scan'
import webhooksRouter from './routes/webhooks'
import recommendationsRouter from './routes/recommendations'
import feedbackRouter from './routes/feedback'

// Auth middleware
import { requireAuth } from './middleware/auth'

const app = express()
const PORT = process.env.PORT ?? 3001

// ─── Health Check — MUST be first, before all middleware ─────────────────────

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() })
})

// ─── Security & Logging ───────────────────────────────────────────────────────

app.use(helmet())
app.use(cors({ origin: process.env.WEB_URL ?? 'http://localhost:5173', credentials: true }))
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

app.use(clerkMiddleware())

// ─── Public Routes (no auth) ──────────────────────────────────────────────────

app.use('/api/public', socialRouter)

// ─── Protected API Routes ─────────────────────────────────────────────────────

app.use('/api/v1/shelves', requireAuth, shelvesRouter)
app.use('/api/v1', requireAuth, booksRouter)
app.use('/api/v1/users', requireAuth, usersRouter)
app.use('/api/v1/stats', requireAuth, statsRouter)
app.use('/api/v1/streaks', requireAuth, streaksRouter)
app.use('/api/v1/wishlist', requireAuth, wishlistRouter)
app.use('/api/v1/notebook', requireAuth, notebookRouter)
app.use('/api/v1/billing', requireAuth, billingRouter)
app.use('/api/v1/seller', requireAuth, sellerRouter)
app.use('/api/v1/marketplace', requireAuth, marketplaceRouter)
app.use('/api/v1/scan', requireAuth, scanRouter)
app.use('/api/v1/recommendations', requireAuth, recommendationsRouter)
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
  console.log('API running on port ' + PORT)
})

export default app
