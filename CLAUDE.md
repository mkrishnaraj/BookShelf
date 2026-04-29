# Virtual Bookshelf — Orchestrator Instructions

## Product Vision
A web app where users rent virtual 3D bookshelves to display and manage their personal book collections. Bookshelves are photorealistic 3D models with books sized accurately by page count. Users can connect physical books, Kindle, Google Play Books, iBooks, and Kobo libraries.

## Tech Stack
- **Frontend**: React + TypeScript + Three.js (3D renderer) + Tailwind CSS — PWA-enabled
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL (via Prisma ORM)
- **Auth**: Clerk (supports Google, Apple OAuth for iBooks/Google Play Books)
- **AI enrichment**: OpenAI API + Google Books API + Open Library API
- **Payments**: Stripe (subscription billing)
- **Hosting**: Vercel (frontend) + Railway (backend + DB)
- **Storage**: Cloudinary (book covers, shelf renders)
- **Testing**: Vitest + Playwright

## Monorepo Structure
```
virtual-bookshelf/
├── CLAUDE.md                  ← you are here
├── .claude/
│   ├── agents/                ← subagent definitions
│   └── commands/              ← slash commands
├── apps/
│   ├── web/                   ← React PWA frontend
│   └── api/                   ← Express backend
├── packages/
│   ├── db/                    ← Prisma schema + migrations
│   ├── shared/                ← shared types, utils
│   └── ai/                    ← AI enrichment service
└── docs/
    ├── PRD.md
    ├── SCHEMA.md
    └── PRICING.md
```

## Core Features (build all of these)
1. **3D Bookshelf renderer** — Three.js, books sized by page count, spine-facing view
2. **Multiple shelf sizes** — S (50 books), M (150 books), L (300 books), XL (500 books)
3. **Multiple shelves per user** — users can rent as many shelves as their plan allows
4. **Book sources** — manual entry, Goodreads CSV, Google Books API search, Kindle (Amazon Data Export JSON/ZIP), Google Play Books (Google Takeout JSON/ZIP), Kobo (CSV), Apple Books/iBooks (CSV via Books Exporter app or our template), EPUB file upload (single or ZIP bundle), PDF file upload — all via one unified import flow with auto-format detection
5. **Book sizing AI** — use page count + known dimensions to render accurate spine widths
6. **Sorting** — by title, author, genre, date added, date read, rating (configurable default)
7. **Reading tracker** — % read, notes, highlights per book
8. **Notebook** — per-book notes + a global dictionary notebook for new words
9. **Reading stats** — books read by week / month / year with charts
10. **Buy-next list** — wishlist of books to buy next
11. **Social sharing** — shareable public shelf URL with a beautiful render (key growth loop)
12. **Shelf themes** — dark wood, light oak, white minimalist, vintage (cosmetic upsell)
13. **Book discovery** — "readers also have" recommendations based on shelf contents
14. **Reading streaks** — consecutive days read, drives daily active usage
15. **Goodreads CSV import** — one-click import to reduce onboarding friction
16. **PWA** — installable to home screen, offline shelf view
17. **Camera scan (single book)** — user photographs a book cover or spine on mobile; Claude vision identifies title/author/ISBN, auto-enriches and adds to shelf with a confirmation step
18. **Camera scan (full shelf)** — user photographs their entire physical bookshelf; Claude detects all visible spines, returns a checklist of identified books for bulk import
19. **Book marketplace** — paid users can list physical books for sale; buyers pay via Stripe; platform takes a commission (15% Reader / 12% Collector / 10% Bibliophile) covering Stripe fees + hosting; sellers onboard via Stripe Connect Express and receive direct weekly payouts

## Pricing Tiers (implement in Stripe)
| Plan | Price | Shelves | Features |
|------|-------|---------|----------|
| Free | $0 | 1 small (50 books) | Basic sorting, manual entry |
| Reader | $3.99/mo or $39.99/yr | 3 shelves | All book sources, stats |
| Collector | $7.99/mo or $79.99/yr | Unlimited | Themes, Goodreads import, notebook |
| Bibliophile | $12.99/mo or $129.99/yr | Unlimited | Priority AI enrichment, CSV export, early features |

## Domain Parallel Patterns
When implementing features across domains, spawn parallel subagents:
- **@backend-agent**: API routes, auth middleware, DB queries, Stripe webhooks
- **@frontend-agent**: React components, Three.js renderer, PWA config, UI state
- **@db-agent**: Prisma schema, migrations, seed data, indexes
- **@ai-agent**: Book metadata enrichment, size calculation, recommendations
- **@payments-agent**: Stripe Checkout, webhooks, billing portal, plan enforcement, trial logic
- **@marketplace-agent**: Stripe Connect, book listings, buyer checkout, seller onboarding, commission, orders
- **@marketing-agent**: Landing page copy, SEO, email sequences, social content
- **@qa-agent**: Test suites, security scan, accessibility audit

## Subagent Invocation Protocol
Every Task tool dispatch must include:
1. **Role**: which agent and why
2. **Context**: relevant files/state from parent
3. **Task**: specific deliverable with acceptance criteria
4. **Constraints**: tools allowed, files in scope
5. **Output format**: what to return (file paths, not full content)

## Coding Standards
- TypeScript strict mode everywhere
- ESLint + Prettier (run before every commit)
- All API routes have Zod validation
- All DB queries go through Prisma (no raw SQL unless migration)
- Components use Tailwind only (no inline styles)
- Three.js objects must be disposed on unmount (prevent memory leaks)
- Every public API endpoint needs auth middleware
- Secrets via environment variables only — never hardcoded

## Agent Routing Rules
- Tasks touching `apps/web/` → @frontend-agent
- Tasks touching `apps/api/` → @backend-agent
- Tasks touching `packages/db/` → @db-agent
- Tasks touching `packages/ai/` → @ai-agent
- Camera scan routes (`/scan/cover`, `/scan/shelf`) → @backend-agent for the route, @ai-agent for the vision pipeline, @frontend-agent for CameraCapture/ScanConfirm/ShelfScanReview components
- Tasks touching `docs/` or marketing → @marketing-agent
- Test writing, security, audits → @qa-agent
- Billing, subscriptions, Stripe, plan limits, upgrade flows → @payments-agent
- Book store, listings, seller onboarding, orders, commission → @marketplace-agent
- Cross-domain tasks → orchestrator breaks into sub-tasks first

## Reversibility Policy
Always prefer reversible actions:
- New DB columns → additive migrations only (no DROP in first pass)
- File writes → create new files before deleting old ones
- API changes → version routes (/api/v1/) before deprecating old ones
- Stripe config → test mode first, production only after QA approval

## Context Handoff Protocol
When a subagent completes, it returns:
```
DONE|{
  "files_created": [...],
  "files_modified": [...],
  "next_dependencies": [...],
  "blockers": [...],
  "notes": "..."
}
```
Orchestrator reads this and unblocks downstream agents.
