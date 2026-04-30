# /start-phase-2 — Backend API

Build the full Express API. Prerequisites: Phase 1 complete, DB migrated.

## Parallel Wave 1 — Core API + AI Enrichment
Spawn @backend-agent and @ai-agent simultaneously:

### @backend-agent task:
"Build the complete Express API as defined in your agent instructions.
Implement all routes for: shelves, books, stats, streaks, wishlist, notebook, social sharing, and Stripe webhooks.
Include auth middleware (Clerk JWT), plan limit middleware, Zod validation on all routes, and rate limiting.
Use the Prisma client from packages/db.
Write to apps/api/src/.
Return DONE with file list when all routes are implemented."

### @ai-agent task:
"Implement the full book enrichment pipeline as defined in your agent instructions.
Build: googleBooks.ts, openLibrary.ts, bookDimensions.ts, coverColor.ts, enrichBook.ts, goodreadsParser.ts, recommend.ts.
Export a clean public API from packages/ai/src/index.ts.
Return DONE with file list when complete."

## Wave 2 — Integration (after both Wave 1 agents return DONE)
Delegate to @backend-agent:
"Integrate packages/ai enrichment into the books routes.
When a book is added (POST /api/v1/shelves/:id/books), call enrichBook() and merge results before saving.
When POST /api/v1/books/import/goodreads is called, use goodreadsParser() then enrich each book.
Add GET /api/v1/recommendations that calls recommend() with the user's shelf contents."

## Wave 3 — Unit Tests (after Wave 2 complete)
Delegate to @qa-agent:
"Write unit tests for: bookDimensions, goodreadsParser, planLimits middleware, stripeService.
Write integration tests for: shelves CRUD, books CRUD, stats endpoint, Stripe webhook handler.
Use Vitest. Mock Prisma with prisma-mock. Mock external APIs with msw.
Run tests and report results."

## Completion Check
All routes respond correctly, tests pass, then report:
"Phase 2 complete. API is running. Run /start-phase-3 to build the frontend."
