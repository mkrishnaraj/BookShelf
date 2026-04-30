import type { Request, Response, NextFunction } from 'express'
import { ZodSchema, ZodError } from 'zod'

/**
 * Middleware factory that validates req.body against a Zod schema.
 * On failure returns 422 with a structured error listing all field issues.
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      res.status(422).json(formatZodError(result.error))
      return
    }
    req.body = result.data
    next()
  }
}

/**
 * Middleware factory that validates req.query against a Zod schema.
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query)
    if (!result.success) {
      res.status(422).json(formatZodError(result.error))
      return
    }
    ;(req as Request & { validatedQuery: T }).validatedQuery = result.data
    next()
  }
}

/**
 * Middleware factory that validates req.params against a Zod schema.
 */
export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params)
    if (!result.success) {
      res.status(422).json(formatZodError(result.error))
      return
    }
    next()
  }
}

function formatZodError(error: ZodError) {
  return {
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed.',
      fields: error.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    },
  }
}
