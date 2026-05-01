import { prisma } from './prisma'

type EventName = 'user.signup' | 'shelf.created' | 'book.added' | 'book.imported' | 'shelf.shared' | 'subscription.started'

export async function logEvent(userId: string, event: EventName, meta?: Record<string, unknown>) {
  try {
    // Log to console in dev, to DB analytics table in prod
    // For now, just console.log — analytics table can be added in a follow-up migration
    console.log(JSON.stringify({ ts: new Date().toISOString(), userId, event, ...meta }))
  } catch {
    // never throw from analytics
  }
}
