import { Router } from 'express'
import multer from 'multer'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { getUserId } from '../middleware/auth.js'
import { validateParams } from '../middleware/validate.js'
import { identifyBookFromImage, identifyShelfFromImage } from '../services/scanService.js'
import { enrichBook } from 'ai'

const router = Router()

// ─── Multer ───────────────────────────────────────────────────────────────────

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/heic', 'image/webp']
    if (allowed.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Only JPEG, PNG, HEIC, and WebP images are accepted'))
    }
  },
})

// ─── Rate Limits ──────────────────────────────────────────────────────────────

// Cover scan: 20 req/hour per user
const coverScanRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => {
    try {
      return getUserId(req)
    } catch {
      return req.ip ?? 'unknown'
    }
  },
  message: { error: { code: 'RATE_LIMIT', message: 'Too many scan requests. Limit: 20 per hour.' } },
  standardHeaders: true,
  legacyHeaders: false,
})

// Shelf scan: 5 req/hour per user (expensive Claude Vision call)
const shelfScanRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => {
    try {
      return getUserId(req)
    } catch {
      return req.ip ?? 'unknown'
    }
  },
  message: { error: { code: 'RATE_LIMIT', message: 'Too many shelf scan requests. Limit: 5 per hour.' } },
  standardHeaders: true,
  legacyHeaders: false,
})

// ─── Schemas ──────────────────────────────────────────────────────────────────

const scanIdParam = z.object({ id: z.string().min(1) })

// ─── Routes ───────────────────────────────────────────────────────────────────

// POST /api/v1/scan/cover — single book cover/spine scan
router.post(
  '/cover',
  coverScanRateLimit,
  imageUpload.single('image'),
  async (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: { code: 'MISSING_IMAGE', message: 'No image uploaded.' } })
      return
    }

    try {
      const clerkId = getUserId(req)
      const user = await prisma.user.findUnique({
        where: { clerkId },
        select: { id: true },
      })
      if (!user) {
        res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found.' } })
        return
      }

      const scanned = await identifyBookFromImage(req.file.buffer)

      // ScannedBook has title, author, isbn?, confidence
      if (scanned.confidence < 0.3 || scanned.title === 'Unknown') {
        res.status(422).json({
          error: {
            code: 'SCAN_FAILED',
            message: 'Could not identify book from this image. Try better lighting or a clearer angle.',
          },
          confidence: scanned.confidence,
        })
        return
      }

      // Enrich the identified book with full metadata (cover, dimensions, description).
      // Failure is silent — we always return at least the scanned title/author.
      const enriched = await enrichBook({
        title: scanned.title,
        author: scanned.author,
        ...(scanned.isbn !== undefined ? { isbn: scanned.isbn } : {}),
      }).catch(() => ({
        title: scanned.title,
        author: scanned.author,
        ...(scanned.isbn !== undefined ? { isbn: scanned.isbn } : {}),
      }))

      res.json({
        data: {
          book: { ...enriched, confidence: scanned.confidence },
          confidence: scanned.confidence,
        },
      })
    } catch (err) {
      console.error('[POST /scan/cover]', { err })
      res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Scan failed.' } })
    }
  }
)

// POST /api/v1/scan/shelf — full shelf photo scan
router.post(
  '/shelf',
  shelfScanRateLimit,
  imageUpload.single('image'),
  async (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: { code: 'MISSING_IMAGE', message: 'No image uploaded.' } })
      return
    }

    try {
      const clerkId = getUserId(req)
      const user = await prisma.user.findUnique({
        where: { clerkId },
        select: { id: true },
      })
      if (!user) {
        res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found.' } })
        return
      }

      const result = await identifyShelfFromImage(req.file.buffer)
      // ShelfScanResult has { detectedBooks: [...], totalDetected: number }

      // Persist a BookScan record for the review UI
      const scan = await prisma.bookScan.create({
        data: {
          userId: user.id,
          imageUrl: '', // set after Cloudinary upload in Wave 2
          detectedBooks: result.detectedBooks as unknown as object,
          status: 'COMPLETE',
        },
      })

      res.json({
        data: {
          scanId: scan.id,
          totalDetected: result.totalDetected,
          books: result.detectedBooks,
        },
      })
    } catch (err) {
      console.error('[POST /scan/shelf]', { err })
      res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Shelf scan failed.' } })
    }
  }
)

// GET /api/v1/scan/:id — get a past scan record
router.get('/:id', validateParams(scanIdParam), async (req, res) => {
  try {
    const clerkId = getUserId(req)
    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
    if (!user) {
      res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found.' } })
      return
    }

    const scan = await prisma.bookScan.findFirst({
      where: { id: req.params['id'], userId: user.id },
    })

    if (!scan) {
      res.status(404).json({ error: { code: 'SCAN_NOT_FOUND', message: 'Scan not found.' } })
      return
    }

    res.json({ data: scan })
  } catch (err) {
    console.error('[GET /scan/:id]', { err })
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch scan.' } })
  }
})

export default router
