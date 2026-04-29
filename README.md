# Virtual Bookshelf — Claude Code Setup

## What's in this repo
This is the complete multi-agent project scaffold for Virtual Bookshelf.
Run each phase by typing the slash command in your Claude Code terminal.

## Prerequisites
- Claude Code CLI installed (`npm install -g @anthropic-ai/claude-code`)
- Node.js 20+
- pnpm (`npm install -g pnpm`)
- PostgreSQL running locally (or a Railway/Supabase connection string)
- A Clerk account (free tier is fine to start)
- A Stripe account (test mode)

## Directory Structure
```
virtual-bookshelf/
├── CLAUDE.md                        ← orchestrator brain (read first)
├── .claude/
│   ├── agents/
│   │   ├── backend-agent.md         ← Express API builder
│   │   ├── frontend-agent.md        ← React + Three.js builder
│   │   ├── db-agent.md              ← Prisma schema + migrations
│   │   ├── ai-agent.md              ← Book enrichment + recommendations
│   │   ├── qa-agent.md              ← Tests + security audit
│   │   └── marketing-agent.md       ← Copy + SEO + emails
│   └── commands/
│       ├── start-phase-1.md         ← /start-phase-1
│       ├── start-phase-2.md         ← /start-phase-2
│       ├── start-phase-3.md         ← /start-phase-3
│       ├── start-phase-4.md         ← /start-phase-4
│       └── start-phase-5.md         ← /start-phase-5
└── docs/
    └── PRD.md                       ← Full product requirements
```

## How to Run

### Option A — Fully autonomous (recommended)
Type one command and Claude runs everything:
```
/build-all
```
Claude will run all 5 phases in sequence, fix any soft errors automatically, and only stop if it hits a hard blocker (missing API key, unresolvable dependency). Progress is written to `docs/BUILD_STATUS.md` after each phase.

If your session ends mid-build (usage limit hit), start a new session and type:
```
/resume-build
```
Claude reads `docs/BUILD_STATUS.md` and picks up exactly where it left off.

### Option B — Phase by phase (manual control)
Each phase is a slash command. Type it in the Claude Code terminal:

```
/start-phase-1    # scaffold + database (~1 session)
/start-phase-2    # backend API (~1 session)
/start-phase-3    # frontend + 3D shelf (~1-2 sessions)
/start-phase-4    # marketing content (run anytime)
/start-phase-5    # deploy to production
```

Between phases, fill in your `.env` file with the API keys listed below — that's the only manual step required.

---

## Environment Variables
Before running Phase 1, copy `.env.example` to `.env` and fill in:

| Variable | Where to get it |
|----------|----------------|
| `DATABASE_URL` | Local PostgreSQL or Railway |
| `REDIS_URL` | Local Redis or Railway Redis addon |
| `CLERK_SECRET_KEY` | clerk.com → API Keys |
| `STRIPE_SECRET_KEY` | dashboard.stripe.com → API Keys |
| `GOOGLE_BOOKS_API_KEY` | console.cloud.google.com → Books API |
| `ANTHROPIC_API_KEY` | console.anthropic.com |
| `CLOUDINARY_*` | cloudinary.com → Dashboard |
| `MARKETPLACE_FEE_READER` | Set to `15` (15% commission) |
| `MARKETPLACE_FEE_COLLECTOR` | Set to `12` |
| `MARKETPLACE_FEE_BIBLIOPHILE` | Set to `10` |
| `STRIPE_CONNECT_WEBHOOK_SECRET` | From `stripe listen --forward-connect-to ...` |

You can skip Cloudinary for Phase 1–3 and add it before Phase 5 (it's only needed for shelf share image generation).

---

## Pro Plan Tips

Claude Code and Claude.ai share the same usage pool on Pro (~44k tokens per 5-hour window).

**For `/build-all` (autonomous mode):**
- Start it at the beginning of a session with a full token budget
- Claude will write `docs/BUILD_STATUS.md` before the session ends
- When the limit hits, start a new session and run `/resume-build` — it picks up automatically
- Expect 2–3 sessions to complete the full build on Pro

**For manual phase-by-phase:**
- One phase per session
- Use `/compact` if context gets heavy (Claude will suggest this)
- Morning sessions have more headroom than peak US evening hours

**If you hit limits consistently:** upgrade to Max 5x ($100/mo) — the full autonomous build will complete in one overnight session without any intervention.

---

## What the agents build

| Agent | Builds |
|-------|--------|
| `@db-agent` | PostgreSQL schema: Users, Shelves, Books, Notes, Notebook, Dictionary, Wishlist, Streaks |
| `@backend-agent` | 25+ API routes, Clerk auth, Stripe webhooks, plan limits, rate limiting |
| `@ai-agent` | Book enrichment (Google Books + Open Library), dimension calculator, Goodreads CSV parser, Claude-powered recommendations |
| `@frontend-agent` | Three.js 3D renderer, all React pages, PWA, social sharing, stats charts |
| `@qa-agent` | Vitest unit + integration tests, Playwright E2E, security audit, a11y check |
| `@marketing-agent` | Landing page, 5-email onboarding sequence, SEO meta tags, social launch content, Product Hunt copy |

---

## After Launch
The feedback loop is built in. Once live:
- Users submit feedback via the in-app widget
- A weekly cron reads new feedback
- @feedback-agent summarises and opens GitHub issues

This means your product roadmap is continuously updated by real user input — automatically.
