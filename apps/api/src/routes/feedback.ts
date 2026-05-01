import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { validateBody } from '../middleware/validate'

const router = Router()

const feedbackBody = z.object({
  rating: z.number().int().min(1).max(5),
  message: z.string().max(1000),
  page: z.string().max(200).optional(),
})

// POST /api/v1/feedback — public, no auth required (anonymous feedback OK)
router.post('/', validateBody(feedbackBody), async (req, res) => {
  try {
    const body = req.body as z.infer<typeof feedbackBody>

    // Try to get userId if authenticated, but don't require it
    let userId: string | undefined
    try {
      const { getAuth } = await import('@clerk/express')
      const auth = getAuth(req)
      userId = auth.userId ?? undefined
    } catch { /* anonymous */ }

    await prisma.feedback.create({
      data: {
        rating: body.rating,
        message: body.message,
        page: body.page,
        userAgent: req.headers['user-agent'],
        userId,
      }
    })

    res.status(201).json({ data: { success: true } })
  } catch (err) {
    console.error('[POST /feedback]', err)
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to save feedback.' } })
  }
})

export default router
