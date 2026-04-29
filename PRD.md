# Virtual Bookshelf — Product Requirements Document
Version 2.0 — Updated to reflect all confirmed features

---

## Overview
A web app where readers rent virtual 3D bookshelves to display and manage their entire book collection — physical books, ebooks, Kindle, Google Play Books, iBooks, and Kobo — in a single beautiful place. Includes a community marketplace where paid users can buy and sell physical books.

## Problem
Readers with large, multi-format collections have no beautiful, unified way to manage and display them. Goodreads is clunky and Amazon-owned. Spreadsheets are ugly. Physical shelves only show physical books. And there's no elegant way to sell books you've already read.

## Solution
A 3D virtual bookshelf that mirrors your real reading life. Books are sized accurately by page count. The shelf is yours to arrange, theme, and share. A built-in marketplace lets you sell books directly to other readers.

## Users
- Avid readers with 50–500+ books across multiple formats
- Book collectors who take pride in their libraries
- Readers who track reading progress and stats
- People who want to share their shelf on social media
- Readers who want to buy or sell used books within a community they trust

---

## Core Features

### 1. 3D Bookshelf Renderer
- Three.js-based, spine-facing view (books face user, same as a real shelf)
- Books sized by page count: spine width = (pageCount / 300) x 2.0cm, clamped 0.5-5cm
- Cover art dominant colour extracted and used for spine colour
- Book title printed on spine (truncated to fit)
- Hover over a book: tooltip shows title, author, % read
- Click a book: opens book detail / edit panel
- Multiple shelf sizes: S (50 books), M (150), L (300), XL (500)
- Users can rent multiple shelves per account (plan-dependent)
- Shelf planks wrap automatically when full

### 2. Book Sources — All via unified import flow
All sources feed into a single UniversalImport modal. Format is auto-detected from the uploaded file.

| Source | How user exports | File format |
|--------|-----------------|-------------|
| Manual entry | Type title + author in search | N/A |
| Search | Search Google Books / Open Library by title or author | N/A |
| Physical book | Scan ISBN barcode or type title | N/A |
| Goodreads | Account -> Export Library | CSV |
| Kindle | Amazon -> Request My Data -> Digital Content | JSON in ZIP (arrives 2-3 days) |
| Google Play Books | Google Takeout -> select Play Books | JSON in ZIP (~15 min) |
| Kobo | kobo.com -> My Books -> Export | CSV |
| Apple Books / iBooks | "Books Exporter" Mac app (free) OR our CSV template | CSV |
| EPUB files | Upload directly (single or ZIP of multiple) | .epub or .zip |
| PDF files | Upload directly | .pdf (metadata extracted) |
| Camera — single book | Photograph book cover or spine on mobile | Claude vision identifies book |
| Camera — full shelf | Photograph entire physical shelf on mobile | Claude identifies all visible spines |

### 3. Book Import Flow
1. User opens "Add books" -> "Import from your libraries"
2. ImportSourcePicker shows all sources with difficulty badges
3. ImportInstructions shows step-by-step export guide per source
4. User uploads file -> ImportDropzone (drag-and-drop desktop, file picker mobile)
5. Backend auto-detects format via importOrchestrator
6. ImportPreview shows parsed books as a checklist (all checked by default)
7. User deselects unwanted books, selects target shelf
8. ImportProgress shows live enrichment progress via SSE stream
9. Books appear on shelf with cover art, accurate sizing, and metadata

### 4. Camera Scan
Single book mode:
- User taps "Scan a book cover" -> device rear camera opens
- Photo sent to API -> Claude Sonnet vision identifies title, author, ISBN
- ScanConfirm shows result with confidence badge (High / Medium / Low)
- User can edit any field before confirming
- Book enriched and added to shelf

Full shelf mode:
- User photographs entire physical bookshelf
- Claude identifies all visible spines, returns list
- ShelfScanReview shows checklist: user checks/unchecks books
- Bulk enrichment + import
- Rate limit: 5 full-shelf scans per hour per user

### 5. Book Organisation
- Sort by: title, author, genre, date added, date read, % read, rating, page count
- Default sort configurable per shelf
- Drag books to manually reorder (overrides auto-sort)

### 6. Reading Tracker
- % read slider (0-100) per book
- Date started, date finished
- Star rating (1-5)
- Per-book timestamped notes

### 7. Notebook (Collector plan and above)
- Per-book notes accessible from book detail
- Global free-form notebook
- Dictionary notebook: word + definition + example sentence
- Search across all notes and dictionary entries

### 8. Reading Statistics
- Books read per week / month / year (bar charts)
- Total pages read, average book length
- Favourite genres breakdown
- All-time totals

### 9. Reading Streaks
- Daily check-in: log a reading session (book + minutes read)
- Current streak counter (consecutive days)
- Longest streak badge
- Weekly summary email (opt-in)

### 10. Buy-Next Wishlist
- Drag-to-reorder priority list
- Add by search (enriched with cover art)
- Notes per item
- "Add to shelf" when purchased

### 11. Social Sharing
- Each shelf has a unique public URL: /s/:shareId
- Public view: read-only 3D shelf, no auth required
- OG image for link previews
- Share: copy link, Twitter, WhatsApp
- Public viewer sees "Create my shelf" CTA

### 12. Shelf Themes
- Dark wood (default, all plans)
- Light oak (Reader and above)
- White minimalist (Collector and above)
- Vintage (Collector and above)

### 13. Book Discovery
- "Readers with similar shelves also have..." recommendations
- Claude Haiku analyses shelf genre/author composition
- Shows 6 recommendations with title, author, one-sentence reason

### 14. PWA
- Installable to home screen on iOS and Android
- Offline view of cached shelf
- Add-to-home-screen prompt after 3rd session
- Service worker caches: app shell, API GET responses (5 min), covers (7 days)

### 15. Book Marketplace
Available to Reader plan and above only.

Sellers:
- Onboard via Stripe Connect Express (Stripe handles KYC, not us)
- List physical books: condition, price, photos (up to 5), description
- Can list books directly from their virtual shelf (metadata pre-filled)
- Listing limits: Reader = 5 active, Collector = 20, Bibliophile = unlimited
- Payouts every Friday via Stripe Express to bank account
- Commission: Reader 15%, Collector 12%, Bibliophile 10%

Buyers:
- Browse store at /store — no account required to browse
- Pay with card, Apple Pay, Google Pay
- Provide shipping address at checkout
- Order confirmation + shipping notification emails
- All plans including Free can buy

Platform:
- Commission covers Stripe fees + hosting margin
- Money flows directly from buyer to seller via Stripe Connect
- Stripe handles KYC, identity, and 1099-K tax forms for sellers

---

## Pricing

| Plan | Monthly | Annual | Shelves | Max Books | Themes | Sell commission | Key features |
|------|---------|--------|---------|-----------|--------|-----------------|--------------|
| Free | $0 | $0 | 1 (S) | 50 | Dark wood | Buy only | Manual entry, basic sort |
| Reader | $3.99 | $39.99 | 3 (S/M/L) | 450 | +Light oak | 15% (5 listings) | All imports, stats, streaks, camera |
| Collector | $7.99 | $79.99 | Unlimited | Unlimited | All 4 | 12% (20 listings) | Notebook, sharing, themes |
| Bibliophile | $12.99 | $129.99 | Unlimited | Unlimited | All 4 | 10% (unlimited) | Priority AI, CSV export |

- Annual billing = 2 months free (~17% discount)
- 14-day free trial on first paid subscription (no card required)
- Downgrade: excess shelves soft-archived, restored on resubscription

---

## Technical Requirements
- Web app, mobile-responsive, PWA-installable
- Tested on: Chrome 120+, Safari 16+, Firefox 120+ (desktop and mobile)
- 3D scene loads < 2s on average broadband
- Supports 500 books per shelf without frame rate degradation
- File imports: up to 50MB ZIPs, 10MB images
- WCAG 2.1 AA accessibility compliance
- API p95 < 200ms (local), < 500ms (production)
- Goodreads import of 500 books < 30s

## Infrastructure
- Frontend: React + TypeScript + Three.js + Tailwind CSS (nginx)
- Backend: Node.js + Express + TypeScript
- Database: PostgreSQL 16 (Prisma ORM)
- Cache: Redis 7
- Auth: Clerk (Google + Apple OAuth)
- Payments: Stripe subscriptions + Stripe Connect Express (marketplace)
- AI: Claude Sonnet (camera scan), Claude Haiku (recommendations)
- Storage: Cloudinary (covers, shelf renders)
- Local dev: Docker Compose
- Production: Vercel (frontend) + Railway (backend + DB + Redis)

## Non-Goals (v1)
- Native iOS/Android app (PWA covers this)
- Social following / feed
- Reading challenges / goals
- Group shelves / book clubs
- Third-party API
- Audiobook support
- Ebook reading inside the app

## Success Metrics (6 months post-launch)
- 1,000 active shelves created
- 10% free-to-paid conversion
- 60-day retention >= 40%
- NPS >= 50
- Average shelf has >= 25 books
- 50+ marketplace listings in first month
- Marketplace GMV >= $1,000 in first 3 months
