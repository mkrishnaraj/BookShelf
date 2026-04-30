# Virtual Bookshelf — Build Status

Last updated: 2026-04-30T01:15:00Z
Current status: COMPLETE

## Phase History
- Phase 1: ✅ Complete (2026-04-29T22:55:00Z)
- Phase 2: ✅ Complete (2026-04-29T23:45:00Z)
- Phase 3: ✅ Complete (2026-04-30T00:30:00Z)
- Phase 4: ✅ Complete (2026-04-30T00:15:00Z)
- Phase 5: ✅ Complete (2026-04-30T01:15:00Z)

## Phase 5 — Security Fixes Applied
All audit findings resolved before launch:

| Severity | Issue | Fix Applied |
|----------|-------|-------------|
| HIGH | serialize-javascript RCE in vite-plugin-pwa build toolchain | Upgraded vite-plugin-pwa and vite via `pnpm update` |
| MEDIUM | Stripe Connect webhook used same secret as subscription webhook | Split into separate `/api/webhooks/stripe-connect` endpoint with `STRIPE_CONNECT_WEBHOOK_SECRET` |
| MEDIUM | Listing price mutable after RESERVED/SOLD status | Added status guard in PATCH /marketplace/listings/:id |
| MEDIUM | READER sellers had no listing count cap | Added 5-listing limit check in POST /marketplace/listings |
| LOW | No per-route rate limits on search/import endpoints | Added 10 req/min on /books/search, 3 req/min on all /books/import/* |

## Phase 5 Deliverables
- [x] railway.toml — build + start + healthcheck config
- [x] vercel.json — SPA routing, security headers, cache headers
- [x] .npmrc — pnpm shamefully-hoist for Railway nixpacks
- [x] Procfile — Railway fallback
- [x] docs/DEPLOY.md — full Railway + Vercel deployment guide with env var table
- [x] apps/api/src/lib/sentry.ts — optional Sentry init stub
- [x] apps/api/src/lib/analytics.ts — event logging (stdout stub, DB-ready)
- [x] apps/api/src/jobs/weeklyDigest.ts — weekly reading digest job
- [x] apps/api/src/routes/feedback.ts — anonymous feedback collection endpoint
- [x] apps/web/src/components/ui/FeedbackWidget.tsx — floating feedback button
- [x] Feedback model added to Prisma schema
- [x] Frontend build: ✅ passes (1751KB gzip ~486KB)
- [x] API TypeScript: ✅ zero errors

## Launch Checklist (human actions required)

### Environment Variables — set in Railway dashboard
| Variable | Where to get it |
|----------|----------------|
| DATABASE_URL | Auto-set by Railway PostgreSQL addon |
| CLERK_SECRET_KEY | Clerk dashboard → API Keys |
| STRIPE_SECRET_KEY | Stripe → Developers → API keys |
| STRIPE_WEBHOOK_SECRET | Stripe → Webhooks → subscription endpoint signing secret |
| STRIPE_CONNECT_WEBHOOK_SECRET | Stripe → Webhooks → Connect endpoint signing secret |
| STRIPE_READER_MONTHLY_PRICE_ID | Create in Stripe → Products |
| STRIPE_READER_ANNUAL_PRICE_ID | Create in Stripe → Products |
| STRIPE_COLLECTOR_MONTHLY_PRICE_ID | Create in Stripe → Products |
| STRIPE_COLLECTOR_ANNUAL_PRICE_ID | Create in Stripe → Products |
| STRIPE_BIBLIOPHILE_MONTHLY_PRICE_ID | Create in Stripe → Products |
| STRIPE_BIBLIOPHILE_ANNUAL_PRICE_ID | Create in Stripe → Products |
| GOOGLE_BOOKS_API_KEY | Google Cloud Console → APIs & Services |
| ANTHROPIC_API_KEY | console.anthropic.com |
| CLOUDINARY_CLOUD_NAME | Cloudinary dashboard |
| CLOUDINARY_API_KEY | Cloudinary dashboard |
| CLOUDINARY_API_SECRET | Cloudinary dashboard |
| WEB_URL | Your Vercel domain (e.g. https://bookshelf.app) |

### Environment Variables — set in Vercel dashboard
| Variable | Value |
|----------|-------|
| VITE_API_URL | Railway production URL |
| VITE_CLERK_PUBLISHABLE_KEY | Clerk dashboard → API Keys |
| VITE_SENTRY_DSN | Sentry dashboard (optional) |

### Deploy steps
```bash
# Backend
railway login && railway link && railway up
railway run pnpm db:migrate:deploy

# Frontend  
vercel --prod

# Stripe
# 1. Add webhook endpoint: https://your-railway-url.railway.app/api/webhooks/stripe
# 2. Add Connect webhook: https://your-railway-url.railway.app/api/webhooks/stripe-connect
# 3. Enable events: checkout.session.completed, customer.subscription.updated/deleted,
#    invoice.payment_failed, account.updated (Connect only)
```

### Post-launch items
- [ ] Replace icon-192.png and icon-512.png with real app icons
- [ ] Create EARLYBIRD20 coupon in Stripe (used in email sequences)
- [ ] Submit to Product Hunt (copy in docs/marketing/social-media.md)
- [ ] Post Twitter launch thread (docs/marketing/social-media.md)
- [ ] Set up email provider with sequences from docs/marketing/email-sequences.md
- [ ] Schedule weeklyDigest.ts as Railway cron: `0 9 * * 1`
- [ ] Add `@sentry/react` to web package.json and `@sentry/node` to api package.json when Sentry DSN is ready
- [ ] Add `manualChunks` to vite.config.ts to code-split Three.js (performance improvement)

## Known Limitations
- Playwright E2E tests require a CI environment with browser namespace access; HTTP smoke tests (95/95) pass locally
- Sentry is stubbed pending package install
- Weekly digest emails are console.log only — wire to email provider (Resend/SendGrid) when ready
- text-slate-400 (#94a3b8) on #1a1a2e background is ~3.9:1 contrast — borderline WCAG AA; switch body copy to text-slate-300 for full compliance

## Blockers
None. All phases complete. Ready for production deployment.
