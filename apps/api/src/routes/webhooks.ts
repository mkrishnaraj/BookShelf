import { Router, Request, Response, NextFunction } from 'express'
import type { Request, Response } from 'express'
import { constructWebhookEvent, handleWebhookEvent, constructConnectWebhookEvent, handleConnectWebhookEvent } from '../services/stripeService.js'

const router: Router = Router()

// POST /api/webhooks/stripe — subscription lifecycle events
// express.raw() applied at mount point in index.ts (before express.json)
router.post('/stripe', async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature']
  if (!signature || typeof signature !== 'string') {
    res.status(400).json({ error: { code: 'MISSING_SIGNATURE', message: 'Missing stripe-signature header.' } })
    return
  }
  let event
  try {
    event = constructWebhookEvent(req.body as Buffer, signature)
  } catch (err) {
    console.error('[Stripe Webhook] Signature verification failed:', err instanceof Error ? err.message : err)
    res.status(400).json({ error: { code: 'INVALID_SIGNATURE', message: 'Webhook signature verification failed.' } })
    return
  }
  try {
    await handleWebhookEvent(event)
    res.json({ received: true })
  } catch (err) {
    console.error('[Stripe Webhook] Handler error:', { eventType: event.type, err })
    res.json({ received: true, warning: 'Handler error — logged for investigation.' })
  }
})

// POST /api/webhooks/stripe-connect — Stripe Connect account events (seller onboarding)
// Uses a separate signing secret (STRIPE_CONNECT_WEBHOOK_SECRET) issued by Stripe for Connect webhooks
router.post('/stripe-connect', async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature']
  if (!signature || typeof signature !== 'string') {
    res.status(400).json({ error: { code: 'MISSING_SIGNATURE', message: 'Missing stripe-signature header.' } })
    return
  }
  let event
  try {
    event = constructConnectWebhookEvent(req.body as Buffer, signature)
  } catch (err) {
    console.error('[Stripe Connect Webhook] Signature verification failed:', err instanceof Error ? err.message : err)
    res.status(400).json({ error: { code: 'INVALID_SIGNATURE', message: 'Connect webhook signature verification failed.' } })
    return
  }
  try {
    await handleConnectWebhookEvent(event)
    res.json({ received: true })
  } catch (err) {
    console.error('[Stripe Connect Webhook] Handler error:', { eventType: event.type, err })
    res.json({ received: true, warning: 'Handler error — logged for investigation.' })
  }
})

export default router
