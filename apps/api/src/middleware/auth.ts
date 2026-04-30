import { clerkMiddleware, getAuth } from '@clerk/express'
import type { Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma.js'

// Clerk middleware that parses + validates JWT on every request
export const clerkAuth = clerkMiddleware()

/**
 * Strict auth guard — must come AFTER clerkMiddleware().
 * Returns 401 when no valid Clerk session is present.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const auth = getAuth(req)
  if (!auth.userId) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } })
    return
  }
  next()
}

/**
 * Extract Clerk userId from a verified request.
 * Call only inside routes protected by requireAuth.
 */
export function getUserId(req: Request): string {
  const auth = getAuth(req)
  if (!auth.userId) {
    throw new Error('getUserId called on unauthenticated request')
  }
  return auth.userId
}

/**
 * Resolve or lazily create the DB user row for the authenticated Clerk user.
 * Attaches `req.dbUser` so downstream handlers can skip the extra query.
 */
export async function resolveDbUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const auth = getAuth(req)
  if (!auth.userId) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } })
    return
  }

  try {
    let user = await prisma.user.findUnique({ where: { clerkId: auth.userId } })
    if (!user) {
      // First-time login — create the user row with data from the Clerk token
      const email =
        (auth as unknown as { sessionClaims?: { email?: string } }).sessionClaims?.email ??
        `${auth.userId}@placeholder.local`
      user = await prisma.user.create({
        data: {
          clerkId: auth.userId,
          email,
        },
      })
    }
    // Attach to request for downstream handlers
    ;(req as Request & { dbUser: typeof user }).dbUser = user
    next()
  } catch (err) {
    console.error('[resolveDbUser]', { userId: auth.userId, err })
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to resolve user.' } })
  }
}
