# /build-all — Autonomous Full Build

Run all 5 phases of Virtual Bookshelf autonomously, in sequence.
Do NOT stop between phases unless a hard blocker is encountered.
Do NOT ask for confirmation between phases — proceed automatically.

---

## Execution Rules

1. **Run phases strictly in order**: 1 → 2 → 3 → 4 → 5
2. **Phase 4 (marketing) runs in parallel with Phase 3** — spawn @marketing-agent while @frontend-agent is building
3. **After each phase, verify completion** using the checklist below before starting the next
4. **On a soft blocker** (missing env var, test failure, lint error): fix it yourself using available tools, then continue
5. **On a hard blocker** (missing external credential you cannot generate, unresolvable dependency conflict, security vulnerability): STOP, write a clear summary to `docs/BUILD_STATUS.md`, and wait for human input
6. **Write progress to `docs/BUILD_STATUS.md`** after each phase so if a session ends mid-build, the next session can resume from where it left off by running `/resume-build`

---

## Phase Completion Checklists

### Phase 1 complete when:
- [ ] All directories exist: `apps/web/`, `apps/api/`, `packages/db/`, `packages/shared/`, `packages/ai/`
- [ ] `packages/db/prisma/schema.prisma` exists with all models: User, Shelf, Book, BookNote, Notebook, NotebookEntry, DictionaryWord, WishlistItem, ReadingStreak, ReadingSession, BookScan, SellerAccount, Listing, Order
- [ ] `pnpm install` runs without errors
- [ ] `pnpm db:migrate` succeeds (or is documented as ready to run with correct DATABASE_URL)
- [ ] Seed file exists at `packages/db/prisma/seed.ts`

### Phase 2 complete when:
- [ ] All API routes exist in `apps/api/src/routes/`: shelves, books, users, stats, streaks, wishlist, notebook, social, billing, seller, marketplace, webhooks
- [ ] All services exist: bookEnrichment, stripeService, connectService, universalImport, scanService, shelfRenderer
- [ ] `planLimits.ts` middleware exists with PLAN_LIMITS matrix
- [ ] All import parsers exist in `packages/ai/src/imports/`: kindleParser, googlePlayParser, koboParser, iBooksParser, epubParser, pdfParser, importOrchestrator
- [ ] All scan functions exist in `packages/ai/src/scan/`: scanBook, scanShelf, imageUtils
- [ ] Unit tests pass: `pnpm test` in `apps/api/` returns no failures
- [ ] API starts without errors: `pnpm dev` in `apps/api/`

### Phase 3 complete when:
- [ ] React app runs: `pnpm dev` in `apps/web/` loads in browser
- [ ] All pages exist: Home, Dashboard, ShelfView, PublicShelf, Stats, Notebook, Wishlist, Settings, Store, SellerDashboard, Pricing
- [ ] Three.js bookshelf renders at least one book in ShelfView
- [ ] PWA manifest exists at `apps/web/public/manifest.json`
- [ ] All import components exist: UniversalImport, ImportSourcePicker, ImportInstructions, ImportDropzone, ImportPreview, ImportProgress
- [ ] All marketplace components exist: ListingCard, ListingGrid, CheckoutDrawer, SellerOnboarding, CreateListingForm
- [ ] All billing components exist: PricingTable, UpgradeModal, TrialBanner, BillingStatus
- [ ] All camera components exist: CameraCapture, ScanConfirm, ShelfScanReview
- [ ] E2E smoke test passes: app loads, can navigate to /store without errors

### Phase 4 complete when:
- [ ] `docs/marketing/landing-page-copy.md` exists and has all sections
- [ ] `docs/marketing/email-sequences.md` exists with 5 onboarding emails
- [ ] `docs/marketing/seo-content.md` exists with meta tags for all pages
- [ ] `docs/marketing/social-media.md` exists with Twitter thread + Product Hunt copy
- [ ] `apps/web/src/pages/Home.tsx` updated with real copy (no placeholder text)

### Phase 5 complete when:
- [ ] `railway.toml` exists with correct build + start commands
- [ ] `vercel.json` exists with SPA routing config
- [ ] Security audit passed (all checks green from @qa-agent)
- [ ] `docs/BUILD_STATUS.md` updated to: "COMPLETE — deployed to production"
- [ ] README updated with production URLs

---

## Blocker Classification Guide

**Fix and continue (soft blockers):**
- TypeScript type errors → fix types
- ESLint errors → fix or add eslint-disable with comment explaining why
- Missing npm package → install it
- Test failure due to wrong mock → fix the mock
- File already exists with different content → reconcile and proceed
- ENV var with a safe default → use the default, document in `.env.example`

**Stop and report (hard blockers):**
- `DATABASE_URL` not set and no local PostgreSQL available
- `STRIPE_SECRET_KEY` not set (cannot create Checkout sessions without it)
- `ANTHROPIC_API_KEY` not set (cannot run scan or enrichment without it)
- `CLERK_SECRET_KEY` not set (cannot verify auth without it)
- Unresolvable npm dependency conflict after 3 attempts
- Security vulnerability with no known fix (CVSS score ≥ 7)

---

## Progress Logging

After each phase completes or a hard blocker is hit, write to `docs/BUILD_STATUS.md`:

```markdown
# Virtual Bookshelf — Build Status

Last updated: {ISO timestamp}
Current status: {IN_PROGRESS | BLOCKED | COMPLETE}

## Phase History
- Phase 1: ✅ Complete ({timestamp})
- Phase 2: ✅ Complete ({timestamp})
- Phase 3: 🔄 In progress...
- Phase 4: ⏳ Pending
- Phase 5: ⏳ Pending

## Blockers
{None | description of blocker + what's needed to unblock}

## Notes
{Any decisions made, workarounds applied, or things to review}
```

---

## Resume Instructions (if session ends mid-build)

If this session ends before all phases complete, the next session should run:

```
/resume-build
```

That command reads `docs/BUILD_STATUS.md` and continues from the last completed phase.

---

## Begin

Start Phase 1 now. Do not wait for confirmation.
When Phase 1 is complete and verified, immediately start Phase 2.
When Phase 2 is complete and verified, immediately start Phase 3 (and spawn @marketing-agent for Phase 4 in parallel).
When Phase 3 and 4 are both complete, immediately start Phase 5.
