# Virtual Bookshelf — Manual Test Guide
**For human testers. No coding required.**
**Version 1.0**

---

## Before You Begin

### What you need
- The app running at http://localhost (or the production URL)
- A browser (Chrome or Safari recommended)
- A mobile phone for camera tests
- Test accounts for at least 2 users (to test buyer/seller flows)
- Stripe test card: `4242 4242 4242 4242`, any future expiry, any CVC

### Test accounts to create
| Account | Email | Plan | Purpose |
|---------|-------|------|---------|
| Tester A | tester.a@example.com | Collector | Main test account |
| Tester B | tester.b@example.com | Reader | Buyer/seller tests |
| Tester C | tester.c@example.com | Free | Plan limit tests |

### Test data to prepare
Before starting, prepare these files on your computer. Each one tests a different import source.

| File | How to get it | Used in test |
|------|--------------|--------------|
| `goodreads_export.csv` | Goodreads → Account → Import/Export → Export Library | TC-04 |
| `kindle_export.zip` | amazon.com → Account → Request My Data → Digital Content (takes 2-3 days) | TC-05 |
| `google_play_export.zip` | takeout.google.com → Google Play Books | TC-06 |
| `kobo_export.csv` | kobo.com → My Books → Export | TC-07 |
| `ibooks_export.csv` | Download from app (Settings → Download CSV Template) | TC-08 |
| A single .epub file | Any DRM-free epub from Project Gutenberg (gutenberg.org) | TC-09 |
| A ZIP of .epub files | Zip 3-5 epub files together | TC-10 |
| A .pdf ebook | Any PDF with a title (e.g. a free ebook from your library) | TC-11 |
| A photo of a book cover | Take one yourself | TC-15 |
| A photo of a bookshelf | Take one yourself (at least 5 books visible) | TC-16 |

---

## Test Cases

---

### TC-01 — Sign Up and First Shelf
**Goal:** New user can sign up and see their first shelf.

| Step | Action | Expected result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Open http://localhost | Landing page loads with hero section | | |
| 2 | Click "Get started free" | Redirected to Clerk sign-up page | | |
| 3 | Sign up with email or Google | Account created, redirected to Dashboard | | |
| 4 | Check Dashboard | One shelf visible: "My Shelf" (Small, Dark Wood) | | |
| 5 | Click the shelf | 3D bookshelf renderer loads — empty shelf visible | | |
| 6 | Hover over the shelf planks | Shelf appears solid, no console errors | | |

---

### TC-02 — Add a Book Manually
**Goal:** User can add a book by typing title and author.

| Step | Action | Expected result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Open a shelf → click "Add books" | Dropdown appears with import options | | |
| 2 | Click "Add manually" | BookForm modal opens | | |
| 3 | Type "The Name of the Wind" in title | Search suggestions appear | | |
| 4 | Select the suggestion from Patrick Rothfuss | Form fills: author, cover art, page count, genre | | |
| 5 | Click "Add to shelf" | Modal closes | | |
| 6 | Check the 3D shelf | Book spine appears on shelf — spine width reflects ~662 pages | | |
| 7 | Hover over the book | Tooltip shows: "The Name of the Wind — Patrick Rothfuss — 0% read" | | |
| 8 | Click the book | Book detail panel opens with title, author, cover | | |

---

### TC-03 — Add a Book by ISBN
**Goal:** User can add a book by scanning or typing an ISBN.

| Step | Action | Expected result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Add books → "Add manually" | BookForm opens | | |
| 2 | Click the ISBN tab | ISBN input field appears | | |
| 3 | Type `9780441013593` (Dune) | Book auto-identified: "Dune" by Frank Herbert | | |
| 4 | Confirm the details are correct | Title, author, page count (896), cover art all populated | | |
| 5 | Add to shelf | Book appears — wide spine (thick book) | | |

---

### TC-04 — Import from Goodreads
**Goal:** User can import their full Goodreads library.
**Prerequisite:** `goodreads_export.csv` file prepared.

| Step | Action | Expected result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Add books → "Import from your libraries" | UniversalImport modal opens | | |
| 2 | Select "Goodreads" | ImportInstructions shows 3-step guide | | |
| 3 | Click "Choose file" and upload your `goodreads_export.csv` | File uploads, progress spinner shows | | |
| 4 | Wait for parsing | ImportPreview appears: checklist of all your books | | |
| 5 | Check the detected source label | Shows "Detected: Goodreads export — X books found" | | |
| 6 | Scroll through the list | Books show title, author, and source chip "Goodreads" | | |
| 7 | Uncheck 2–3 books you don't want | Those rows become unchecked | | |
| 8 | Select a target shelf from the dropdown | Correct shelf selected | | |
| 9 | Click "Import selected (X)" | ImportProgress bar appears | | |
| 10 | Watch progress | "Enriching book 3 of 47..." updates as it goes | | |
| 11 | Wait for completion | "47 books added to your shelf!" toast appears | | |
| 12 | Open the shelf | Books appear with cover art and varying spine widths | | |
| 13 | Check a book that was marked "read" in Goodreads | % read should show 100% | | |
| 14 | Check a book that had a star rating | Rating should match | | |

---

### TC-05 — Import from Kindle
**Goal:** User can import their Kindle library from Amazon's data export.
**Prerequisite:** `kindle_export.zip` received from Amazon (takes 2–3 days to arrive by email).
**Note:** If you don't have this yet, mark this test as DEFERRED and come back to it.

| Step | Action | Expected result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Add books → Import → "Kindle" | ImportInstructions explains Amazon data request | | |
| 2 | Upload `kindle_export.zip` | Parsing begins | | |
| 3 | Check ImportPreview | Source label: "Detected: Kindle export — X books found" | | |
| 4 | Verify book data | Title and author populated; note that page count may be missing (normal for Kindle) | | |
| 5 | Import selected books | Books appear on shelf | | |
| 6 | Check a book's detail | Source chip shows "Kindle" | | |
| 7 | Note: Kindle does not export reading progress | % read = 0% is expected | | |

---

### TC-06 — Import from Google Play Books
**Goal:** User can import Google Play Books library via Google Takeout.
**Prerequisite:** `google_play_export.zip` downloaded from takeout.google.com.

| Step | Action | Expected result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Add books → Import → "Google Play Books" | Instructions shown: takeout.google.com steps | | |
| 2 | Upload `google_play_export.zip` | Parsing begins | | |
| 3 | Check ImportPreview | Source label: "Detected: Google Play Books — X books found" | | |
| 4 | Verify book data | Title, author, page count, ISBN visible for most books | | |
| 5 | Import | Books appear on shelf with source chip "Google Play" | | |

---

### TC-07 — Import from Kobo
**Goal:** User can import Kobo reading library via CSV export.
**Prerequisite:** `kobo_export.csv` from kobo.com.

| Step | Action | Expected result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Add books → Import → "Kobo" | Instructions shown | | |
| 2 | Upload `kobo_export.csv` | Parsing begins | | |
| 3 | Check ImportPreview | Source: "Detected: Kobo export — X books found" | | |
| 4 | Check a "Finished" book from Kobo | % read = 100% | | |
| 5 | Check an "In Progress" book | % read reflects Kobo's percentage | | |
| 6 | Import | Books appear with source chip "Kobo" | | |

---

### TC-08 — Import from Apple Books / iBooks
**Goal:** User can import Apple Books library via CSV.
**Prerequisite:** `ibooks_export.csv` either from the "Books Exporter" Mac app or our template.

| Step | Action | Expected result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Add books → Import → "Apple Books" | Instructions shown, including link to Books Exporter | | |
| 2 | If no Mac: click "Download CSV template" | Template CSV downloads | | |
| 3 | Open template, fill in 5 books with real data, save | File ready | | |
| 4 | Upload the CSV | Parsing begins | | |
| 5 | Check ImportPreview | Books listed with source "Apple Books" | | |
| 6 | Import | Books appear on shelf | | |

---

### TC-09 — Upload a Single EPUB File
**Goal:** User can upload a DRM-free EPUB and have it parsed.
**Prerequisite:** A `.epub` file (try Project Gutenberg: gutenberg.org/ebooks/11 — Alice in Wonderland).

| Step | Action | Expected result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Add books → Import → "Upload files (EPUB, PDF, ZIP)" | ImportDropzone appears | | |
| 2 | Drag and drop your `.epub` file onto the zone | File accepted, upload starts | | |
| 3 | Check ImportPreview | 1 book shown: title and author extracted from EPUB metadata | | |
| 4 | Note: page count may be approximate | Expected behaviour — EPUB reflowable format | | |
| 5 | Add to shelf | Book appears | | |

---

### TC-10 — Upload a ZIP of Multiple EPUBs
**Goal:** User can upload a ZIP containing several EPUB files.
**Prerequisite:** ZIP file containing 3–5 `.epub` files.

| Step | Action | Expected result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Add books → Import → Upload files | ImportDropzone appears | | |
| 2 | Upload the ZIP | File accepted | | |
| 3 | Check ImportPreview | All EPUBs inside the ZIP listed as individual books | | |
| 4 | Source label shows: "Detected: EPUB bundle — X books found" | | | |
| 5 | Import all | All books appear on shelf | | |

---

### TC-11 — Upload a PDF Ebook
**Goal:** User can upload a PDF and have title/author extracted from metadata.
**Prerequisite:** A PDF ebook with metadata (most published PDFs have this).

| Step | Action | Expected result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Add books → Import → Upload files | ImportDropzone appears | | |
| 2 | Upload the `.pdf` file | File accepted | | |
| 3 | Check ImportPreview | Book listed with title and author from PDF metadata | | |
| 4 | Note: if PDF has no metadata, title will be the filename | Expected behaviour | | |
| 5 | Page count populates from actual PDF page count | Verify it looks right | | |
| 6 | Add to shelf | Book appears | | |

---

### TC-12 — Reading Tracker
**Goal:** User can mark a book as partially or fully read and add notes.

| Step | Action | Expected result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Click a book on the shelf | Book detail panel opens | | |
| 2 | Drag the % read slider to 45 | Slider moves to 45% | | |
| 3 | Click Save | Panel updates, no error | | |
| 4 | Hover over the book on the shelf | Tooltip shows "45% read" | | |
| 5 | Open book detail again | % read still shows 45% (persisted) | | |
| 6 | Click "Add note" | Text area appears | | |
| 7 | Type "Really enjoyed the first act" and save | Note saved with timestamp | | |
| 8 | Set star rating to 4 | 4 stars highlighted | | |
| 9 | Set date finished to today | Date saved | | |
| 10 | Drag % read to 100 | Slider shows 100% | | |
| 11 | Save | Book marked as read | | |
| 12 | Check Reading Stats page | Book appears in "Read this month" count | | |

---

### TC-13 — Notebook and Dictionary
**Goal:** Collector user can use the notebook and dictionary features.
**Prerequisite:** Signed in as Tester A (Collector plan).

| Step | Action | Expected result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Click "Notebook" in sidebar | Notebook page opens with two tabs: Notes and Dictionary | | |
| 2 | Click "Add note" | Text editor appears | | |
| 3 | Type a title and some body text | Note saved | | |
| 4 | Switch to Dictionary tab | Dictionary list shown (empty) | | |
| 5 | Click "Add word" | Form appears: word, definition, example | | |
| 6 | Enter: word="ephemeral", definition="lasting for a very short time", example="The ephemeral nature of fame" | | | |
| 7 | Save | Word appears in dictionary list | | |
| 8 | Search for "ephemeral" in search box | Word appears in results | | |
| 9 | Sign in as Tester C (Free plan) and visit /notebook | Should redirect with upgrade prompt | | |

---

### TC-14 — Sorting and Shelf Organisation
**Goal:** User can sort and reorder books on their shelf.

| Step | Action | Expected result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Open a shelf with at least 10 books | Shelf renders | | |
| 2 | Click sort controls → "Sort by Author" | Books rearrange alphabetically by author | | |
| 3 | Switch to "Sort by Page Count" | Thinnest books on left, thickest on right | | |
| 4 | Verify spine widths match page count order | Visually confirm proportional sizing | | |
| 5 | Drag a book to a new position | Book moves | | |
| 6 | Refresh the page | Manual ordering preserved | | |
| 7 | Open Shelf Settings → set "Default sort" to "Author" | Saved | | |
| 8 | Refresh | Shelf still sorted by author | | |

---

### TC-15 — Camera Scan: Single Book Cover
**Goal:** Mobile user can photograph a book and have it identified.
**Device:** Use your mobile phone for this test.

| Step | Action | Expected result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Open http://localhost on your mobile phone | App loads, mobile layout | | |
| 2 | Open a shelf → Add books → "Scan a book cover" | Camera button appears | | |
| 3 | Tap the camera button | Device rear camera opens directly (no permission dialog on iOS) | | |
| 4 | Point camera at a book cover with clear title and author | | | |
| 5 | Take photo | Photo preview shown with "Scan this book" button | | |
| 6 | Tap "Scan this book" | Scanning spinner: "Identifying your book..." | | |
| 7 | Wait for result (~3–5 seconds) | ScanConfirm screen shows identified book | | |
| 8 | Check confidence badge | Should be "High confidence" for a clear photo | | |
| 9 | Verify title and author are correct | Compare with actual book | | |
| 10 | Tap "Add to shelf" | Book added, appears on shelf | | |
| 11 | Repeat with a blurry/angled photo | Should show "Low confidence — please verify" or error | | |

---

### TC-16 — Camera Scan: Full Physical Shelf
**Goal:** Mobile user can photograph an entire bookshelf and bulk import.
**Device:** Mobile phone. Prepare a shelf with at least 8 books visible.

| Step | Action | Expected result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Open app on mobile → Add books → "Scan my physical shelf" | Camera opens | | |
| 2 | Take a clear photo of a bookshelf (good lighting) | Photo preview shown | | |
| 3 | Tap "Scan this shelf" | Scanning spinner: "Identifying your books..." (takes 5–10s) | | |
| 4 | Wait for results | ShelfScanReview shows checklist of identified books | | |
| 5 | Check summary line | "Found X books — Y spines unreadable" | | |
| 6 | Scroll through the list | Each book has title, author, confidence chip | | |
| 7 | Uncheck any incorrectly identified books | Row unchecks | | |
| 8 | Tap "Add selected (X) to shelf" | Progress bar appears | | |
| 9 | Verify completion | All selected books added to virtual shelf | | |
| 10 | Trigger rate limit: repeat 5 more times in under an hour | 6th attempt: "Try again in X minutes" message shown | | |

---

### TC-17 — Reading Streaks
**Goal:** User earns and maintains a reading streak.

| Step | Action | Expected result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Open Stats page | Streak section shows "Current streak: 0 days" | | |
| 2 | Click "Log reading session" | Form: book selector + minutes read | | |
| 3 | Select a book, enter 30 minutes, submit | Streak updates to "1 day" | | |
| 4 | Check streak badge in sidebar | "🔥 1" visible | | |
| 5 | Log another session for today | Streak stays at 1 (already logged today) | | |
| 6 | (Next day) Log another session | Streak becomes 2 | | |
| 7 | Check Stats page | Streak history chart shows 2 consecutive days | | |

---

### TC-18 — Social Shelf Sharing
**Goal:** Collector user can share a public shelf link.
**Prerequisite:** Tester A (Collector plan) with books on a shelf.

| Step | Action | Expected result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Open a shelf as Tester A | 3D shelf renders | | |
| 2 | Click "Share shelf" button | ShareShelfModal opens | | |
| 3 | Click "Make shelf public" toggle | Toggle activates | | |
| 4 | Copy the public URL shown | URL in clipboard | | |
| 5 | Open an incognito window (no login) | | | |
| 6 | Paste and visit the public URL | Public 3D shelf loads — no login prompt | | |
| 7 | Verify read-only: no "Add book" buttons | Correct — viewer cannot edit | | |
| 8 | Check page title | Shows "[Name]'s Bookshelf" | | |
| 9 | Check "Create my shelf" CTA | Button visible at bottom | | |
| 10 | Click the CTA | Redirects to sign-up page | | |
| 11 | Sign in as Tester C (Free plan) and try sharing | Share button blocked — upgrade prompt shown | | |

---

### TC-19 — Wishlist (Buy-Next List)
**Goal:** User can manage a list of books to buy next.

| Step | Action | Expected result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Click "Wishlist" in sidebar | Wishlist page opens (empty) | | |
| 2 | Click "Add book" | Search field appears | | |
| 3 | Search for "Project Hail Mary" | Book found with cover | | |
| 4 | Add it | Appears in wishlist | | |
| 5 | Add 2 more books | 3 items in list | | |
| 6 | Drag to reorder | Items reorder, order persists on refresh | | |
| 7 | Add a note to one item: "Recommend by Sarah" | Note saved and visible | | |
| 8 | Click "Add to shelf" on one item | Book moved to shelf, removed from wishlist | | |

---

### TC-20 — Plan Limits (Free Plan)
**Goal:** Free plan user is correctly limited and shown upgrade prompts.
**Sign in as:** Tester C (Free plan).

| Step | Action | Expected result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Check Dashboard | 1 shelf visible (Small shelf) | | |
| 2 | Click "Add new shelf" | UpgradeModal appears: "Upgrade to Reader for more shelves" | | |
| 3 | Try to access Notebook in sidebar | Upgrade prompt: "Notebook requires Collector plan" | | |
| 4 | Try to share a shelf | Upgrade prompt: "Sharing requires Collector plan" | | |
| 5 | Add 50 books to the shelf | 50th book adds successfully | | |
| 6 | Try to add the 51st book | Error: "Shelf is full for your plan" | | |
| 7 | Try to apply "Light Oak" theme | Upgrade prompt shown | | |
| 8 | Visit /store and click a listing | "Buy" works — Free users can buy | | |
| 9 | Click "Start selling" | Upgrade prompt: "Selling requires Reader plan or above" | | |

---

### TC-21 — Upgrade via Stripe Checkout
**Goal:** User can upgrade their plan and new limits take effect immediately.
**Sign in as:** Tester C (Free plan).

| Step | Action | Expected result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Click "Upgrade" in sidebar or any upgrade prompt | Pricing page / modal opens | | |
| 2 | View pricing table | 4 plans shown with correct prices | | |
| 3 | Toggle Annual/Monthly | Prices update, annual shows savings amount | | |
| 4 | Click "Upgrade to Collector" (monthly) | Redirected to Stripe Checkout | | |
| 5 | Enter test card: `4242 4242 4242 4242`, 12/26, 123 | Card accepted | | |
| 6 | Enter any name and billing address | Form complete | | |
| 7 | Click "Start trial" | Checkout completes | | |
| 8 | Redirected back to /settings/billing | "Welcome to Collector! Your trial has started." toast | | |
| 9 | Check plan badge in sidebar | Shows "Collector" | | |
| 10 | Try adding a 2nd shelf | Now allowed — no upgrade prompt | | |
| 11 | Try accessing Notebook | Now accessible | | |
| 12 | Check Settings → Billing | Shows "14-day trial active — X days remaining" | | |

---

### TC-22 — Marketplace: Seller Onboarding
**Goal:** Reader user can become a seller via Stripe Connect.
**Sign in as:** Tester B (Reader plan).

| Step | Action | Expected result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Click "Sell books" in navigation | SellerOnboarding component shown | | |
| 2 | View the status stepper | Step 1 "Create account" shown as active | | |
| 3 | Click "Start selling" | Redirected to Stripe Connect onboarding (Stripe-hosted) | | |
| 4 | Fill in test identity details (SSN: 000-00-0000 in test mode) | Stripe accepts | | |
| 5 | Add test bank account (routing: 110000000, account: 000123456789) | Bank added | | |
| 6 | Complete Stripe onboarding | Redirected back to app at /seller/onboarding/complete | | |
| 7 | Check seller status page | "You're verified! Create your first listing" | | |
| 8 | Stepper shows all steps complete | | | |

---

### TC-23 — Marketplace: Create a Listing
**Goal:** Verified seller can create a book listing.
**Prerequisite:** TC-22 complete. Sign in as Tester B.

| Step | Action | Expected result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Go to Seller Dashboard → click "New listing" | CreateListingForm step 1 opens | | |
| 2 | Search for a book or select from shelf | Book details pre-filled | | |
| 3 | Click "Next: Condition & Price" | Step 2 opens | | |
| 4 | Select condition: "Good" | Condition selected | | |
| 5 | Add condition note: "Minor crease on spine" | Note saved | | |
| 6 | Set price: $12.00 | Price field shows $12.00 | | |
| 7 | Check commission breakdown widget | Shows: "You'll receive $10.20 after our 15% fee" | | |
| 8 | Add ships-from: "San Jose, CA" | Saved | | |
| 9 | Click "Next: Photos & Description" | Step 3 opens | | |
| 10 | Upload at least 1 photo of the book | Photo preview appears | | |
| 11 | Add description: "Great condition, read once" | Description saved | | |
| 12 | Click "Publish listing" | Listing created, redirect to Seller Dashboard | | |
| 13 | Check /store | New listing visible in the store | | |

---

### TC-24 — Marketplace: Buy a Book
**Goal:** Buyer can purchase a listing using Stripe.
**Sign in as:** Tester A (Collector plan, acting as buyer).
**Prerequisite:** TC-23 complete — listing exists in the store.

| Step | Action | Expected result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Visit /store | Listing from TC-23 visible | | |
| 2 | Click the listing | ListingDetail page opens | | |
| 3 | Check listing details | Condition, price, seller name, description, photo all visible | | |
| 4 | Click "Buy — $12.00" | CheckoutDrawer opens | | |
| 5 | View price breakdown | Item price: $12.00 (no buyer fee in v1) | | |
| 6 | Enter shipping address | Form fields complete | | |
| 7 | Enter test card: `4242 4242 4242 4242` | Card field accepts | | |
| 8 | Click "Complete purchase" | Payment processes | | |
| 9 | OrderConfirmation shown | "Order confirmed! Tester B will ship your book." | | |
| 10 | Check Tester A's order history | Order appears as "Paid" | | |
| 11 | Switch to Tester B (seller) | Seller Dashboard shows new order | | |
| 12 | Check Tester B's earnings | Shows $10.20 earned | | |
| 13 | Check listing status | Listing now shows "Sold" — no longer in /store | | |

---

### TC-25 — Marketplace: Ship an Order
**Goal:** Seller can mark an order as shipped with tracking.
**Prerequisite:** TC-24 complete.

| Step | Action | Expected result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Sign in as Tester B → Seller Dashboard → Orders | Order shows status "Paid" | | |
| 2 | Click "Mark as shipped" | Tracking form appears | | |
| 3 | Enter tracking number: `1Z999AA10123456784` | | | |
| 4 | Select carrier: "UPS" | | | |
| 5 | Click "Confirm shipment" | Order status changes to "Shipped" | | |
| 6 | Check buyer email inbox (Tester A) | Shipping confirmation email received with tracking number | | |

---

### TC-26 — Declined Payment
**Goal:** Payment with a declined card is handled gracefully.
**Sign in as:** Tester A (buyer).

| Step | Action | Expected result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Find an active listing in /store | | | |
| 2 | Click Buy → fill shipping → enter declined card: `4000 0000 0000 0002` | | | |
| 3 | Click "Complete purchase" | Payment fails — error message shown in drawer | | |
| 4 | Check listing status | Still "Active" — not locked | | |
| 5 | Check order history | No order created | | |
| 6 | Re-enter valid card: `4242 4242 4242 4242` | Payment succeeds | | |

---

### TC-27 — PWA Install (Mobile)
**Goal:** App can be installed to mobile home screen.
**Device:** iPhone (Safari) or Android (Chrome).

| Step | Action | Expected result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Open app in Safari (iOS) or Chrome (Android) | App loads | | |
| 2 | Visit 3 different pages (simulate 3 sessions) | | | |
| 3 | On 3rd session: check for install prompt | "Add Virtual Bookshelf to Home Screen?" prompt appears | | |
| 4 | iOS: tap Share → "Add to Home Screen" | App icon appears on home screen | | |
| 5 | Open from home screen | App opens full screen — no browser UI | | |
| 6 | Turn on Airplane mode | | | |
| 7 | Navigate to a shelf you've visited | Cached shelf renders (offline mode) | | |
| 8 | Banner shown | "You're offline — showing cached shelf" | | |

---

### TC-28 — Docker Local Run
**Goal:** App runs correctly from Docker containers.
**Prerequisite:** Docker Desktop installed, `.env.docker` filled in.

| Step | Action | Expected result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Run `make setup` in terminal | `.env.docker` created from template | | |
| 2 | Fill in required keys in `.env.docker` | | | |
| 3 | Run `make up` | Docker builds images and starts all 5 containers | | |
| 4 | Run `make logs` | Logs show "nginx started", "API running on port 3001" | | |
| 5 | Open http://localhost | App loads correctly | | |
| 6 | Open http://localhost:3001/health | Returns `{"status":"ok","version":"1.0.0"}` | | |
| 7 | Run `make psql` | psql shell opens, connected to virtual_bookshelf DB | | |
| 8 | Type `\dt` in psql | All tables visible (users, shelves, books, etc.) | | |
| 9 | Type `\q` to exit psql | Exits cleanly | | |
| 10 | Run `make down` | All containers stop, data preserved | | |
| 11 | Run `make up` again | App restarts, previous data still present | | |
| 12 | Run `make reset` | All containers and volumes deleted | | |
| 13 | Run `make up` | Fresh start — app works with empty DB | | |

---

## Bug Report Template

When you find an issue, record it like this:

```
Test Case: TC-XX
Step: X
Severity: Critical / High / Medium / Low
Browser: Chrome 124 / Safari 17 / Firefox 125
Device: Desktop / iPhone 15 / Android
Description: [What happened]
Expected: [What should have happened]
Reproducible: Always / Sometimes / Once
Screenshot: [attach if possible]
```

**Severity definitions:**
- **Critical** — app crashes, data lost, payment taken but not recorded
- **High** — feature completely broken, no workaround
- **Medium** — feature partially broken, workaround exists
- **Low** — cosmetic issue, minor annoyance

---

## Test Sign-Off Checklist

Complete this before marking any release as ready:

### Core Reading Features
- [ ] TC-01 Sign up and first shelf
- [ ] TC-02 Manual book add
- [ ] TC-03 ISBN lookup
- [ ] TC-12 Reading tracker
- [ ] TC-13 Notebook and dictionary
- [ ] TC-14 Sorting and organisation
- [ ] TC-17 Reading streaks
- [ ] TC-19 Wishlist

### Book Imports
- [ ] TC-04 Goodreads import
- [ ] TC-05 Kindle import (defer if export not yet received)
- [ ] TC-06 Google Play Books import
- [ ] TC-07 Kobo import
- [ ] TC-08 Apple Books import
- [ ] TC-09 Single EPUB upload
- [ ] TC-10 EPUB ZIP upload
- [ ] TC-11 PDF upload

### Camera
- [ ] TC-15 Single book scan
- [ ] TC-16 Full shelf scan

### Social & Sharing
- [ ] TC-18 Shelf sharing

### Payments & Plans
- [ ] TC-20 Free plan limits
- [ ] TC-21 Upgrade via Stripe Checkout

### Marketplace
- [ ] TC-22 Seller onboarding
- [ ] TC-23 Create listing
- [ ] TC-24 Buy a book
- [ ] TC-25 Ship an order
- [ ] TC-26 Declined payment

### PWA & Infrastructure
- [ ] TC-27 PWA install
- [ ] TC-28 Docker local run

**Tester name:** ___________________
**Test date:** ___________________
**Build version:** ___________________
**Overall result:** PASS / FAIL
**Critical issues found:** ___________________
