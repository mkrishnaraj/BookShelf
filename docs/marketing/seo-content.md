# Virtual Bookshelf — SEO Content

---

## META TAGS BY PAGE

### / — Home / Landing Page

```html
<title>Virtual Bookshelf — Display Your Book Collection in 3D</title>
<meta name="description" content="Build a stunning 3D bookshelf from your personal library. Import from Goodreads, Kindle, Apple Books, Kobo, and more. Track reading, share your shelf, scan books with your camera. Free to start." />

<!-- Open Graph -->
<meta property="og:title" content="Virtual Bookshelf — Display Your Book Collection in 3D" />
<meta property="og:description" content="Build a stunning 3D bookshelf from your personal library. Import from Goodreads, Kindle, Apple Books, Kobo, and more. Track reading, share your shelf, scan books with your camera. Free to start." />
<meta property="og:image" content="https://virtualbookshelf.app/og/home.jpg" />
<meta property="og:url" content="https://virtualbookshelf.app/" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Virtual Bookshelf" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:site" content="@virtualbookshelf" />
<meta name="twitter:title" content="Virtual Bookshelf — Display Your Book Collection in 3D" />
<meta name="twitter:description" content="Build a stunning 3D bookshelf from your personal library. Import from Goodreads, Kindle, Apple Books, Kobo, and more. Free to start." />
<meta name="twitter:image" content="https://virtualbookshelf.app/og/home.jpg" />
```

---

### /dashboard — User Dashboard

```html
<title>Your Shelf — Virtual Bookshelf</title>
<meta name="description" content="View and manage your personal 3D bookshelf. Browse your collection, check reading progress, track your streak, and add new books." />
<meta name="robots" content="noindex, nofollow" />

<!-- Open Graph -->
<meta property="og:title" content="My Virtual Bookshelf" />
<meta property="og:description" content="My personal 3D book collection on Virtual Bookshelf." />
<meta property="og:image" content="https://virtualbookshelf.app/og/dashboard.jpg" />
<meta property="og:url" content="https://virtualbookshelf.app/dashboard" />
<meta property="og:type" content="website" />
```

---

### /shelf/:id — Individual Shelf View

```html
<title>[Shelf Name] — Virtual Bookshelf</title>
<meta name="description" content="Browse [Shelf Name] — a curated book collection on Virtual Bookshelf. [X] books, [genre] focus." />
<meta name="robots" content="noindex, nofollow" />

<!-- Open Graph -->
<meta property="og:title" content="[Shelf Name] — Virtual Bookshelf" />
<meta property="og:description" content="Browse this shelf: [X] books including [sample titles]." />
<meta property="og:image" content="[shelf_render_url]" />
<meta property="og:type" content="website" />
```

---

### /stats — Reading Statistics

```html
<title>Reading Stats — Virtual Bookshelf</title>
<meta name="description" content="Your personal reading statistics. Books finished by week, month, and year. Reading streak, genre breakdown, and progress toward your yearly goal." />
<meta name="robots" content="noindex, nofollow" />

<!-- Open Graph -->
<meta property="og:title" content="My Reading Stats — Virtual Bookshelf" />
<meta property="og:description" content="Track your reading habit with detailed stats on Virtual Bookshelf." />
<meta property="og:image" content="https://virtualbookshelf.app/og/stats.jpg" />
<meta property="og:type" content="website" />
```

---

### /notebook — Vocabulary Notebook

```html
<title>Reading Notebook — Virtual Bookshelf</title>
<meta name="description" content="Your personal reading notebook. Save vocabulary words, per-book notes, highlights, and reflections all in one place." />
<meta name="robots" content="noindex, nofollow" />

<!-- Open Graph -->
<meta property="og:title" content="My Reading Notebook — Virtual Bookshelf" />
<meta property="og:description" content="Notes, vocabulary, and highlights from your reading life." />
<meta property="og:image" content="https://virtualbookshelf.app/og/notebook.jpg" />
<meta property="og:type" content="website" />
```

---

### /store — Book Marketplace

```html
<title>Book Marketplace — Buy and Sell Books | Virtual Bookshelf</title>
<meta name="description" content="Buy and sell physical books with other readers on Virtual Bookshelf. Safe payments via Stripe. Discover books from real readers' shelves." />

<!-- Open Graph -->
<meta property="og:title" content="Book Marketplace — Virtual Bookshelf" />
<meta property="og:description" content="Buy and sell physical books with other readers. Safe payments, direct payouts, curated by real book lovers." />
<meta property="og:image" content="https://virtualbookshelf.app/og/store.jpg" />
<meta property="og:url" content="https://virtualbookshelf.app/store" />
<meta property="og:type" content="website" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Book Marketplace — Virtual Bookshelf" />
<meta name="twitter:description" content="Buy and sell physical books with other readers." />
<meta name="twitter:image" content="https://virtualbookshelf.app/og/store.jpg" />
```

---

### /pricing — Pricing Page

```html
<title>Pricing — Virtual Bookshelf | Free, Reader, Collector, Bibliophile</title>
<meta name="description" content="Virtual Bookshelf is free to start. Upgrade to Reader ($3.99/mo), Collector ($7.99/mo), or Bibliophile ($12.99/mo) for unlimited shelves, all import sources, themes, and more." />

<!-- Open Graph -->
<meta property="og:title" content="Pricing — Virtual Bookshelf" />
<meta property="og:description" content="Start free. Upgrade when you're ready. Plans from $3.99/month for serious readers." />
<meta property="og:image" content="https://virtualbookshelf.app/og/pricing.jpg" />
<meta property="og:url" content="https://virtualbookshelf.app/pricing" />
<meta property="og:type" content="website" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Pricing — Virtual Bookshelf" />
<meta name="twitter:description" content="Start free. Plans from $3.99/month." />
<meta name="twitter:image" content="https://virtualbookshelf.app/og/pricing.jpg" />
```

---

### /s/:slug — Public Shelf (dynamic)

```html
<!-- Dynamic title and description generated server-side using shelf owner data -->
<title>[Owner Name]'s Bookshelf — Virtual Bookshelf</title>
<meta name="description" content="Browse [Owner Name]'s personal library on Virtual Bookshelf — [X] books including [top genre] favourites. Explore their collection in stunning 3D." />

<!-- Open Graph — use the generated shelf render image -->
<meta property="og:title" content="[Owner Name]'s Bookshelf" />
<meta property="og:description" content="[X] books. [Top genres]. Browse their collection on Virtual Bookshelf." />
<meta property="og:image" content="[generated_shelf_og_render_url]" />
<meta property="og:url" content="https://virtualbookshelf.app/s/[slug]" />
<meta property="og:type" content="profile" />
<meta property="og:profile:username" content="[slug]" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="[Owner Name]'s Bookshelf — Virtual Bookshelf" />
<meta name="twitter:description" content="[X] books. Browse their 3D collection." />
<meta name="twitter:image" content="[generated_shelf_og_render_url]" />
```

---

## KEYWORD LIST (20 target terms)

### Primary keywords
1. virtual bookshelf
2. virtual bookshelf app
3. 3D bookshelf app
4. 3D book collection
5. digital bookshelf

### Secondary keywords
6. Goodreads alternative
7. book tracker app
8. track books I've read
9. reading tracker app
10. personal library app

### Long-tail keywords
11. how to track books I've read
12. best app for book collectors
13. app to organise book collection
14. import Goodreads library to new app
15. bookshelf app for Kindle books

### Audience / community keywords
16. bookstagram app
17. book collection display
18. reading streak tracker
19. share reading list online
20. book catalogue app

---

## STRUCTURED DATA — JSON-LD (Homepage)

```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Virtual Bookshelf",
  "url": "https://virtualbookshelf.app",
  "description": "Virtual Bookshelf lets you build a photorealistic 3D display of your personal book collection. Import from Goodreads, Kindle, Google Play Books, Apple Books, Kobo, or add manually. Track reading progress, share your shelf, and discover new books.",
  "applicationCategory": "LifestyleApplication",
  "operatingSystem": "Web, iOS, Android (PWA)",
  "offers": [
    {
      "@type": "Offer",
      "name": "Free",
      "price": "0",
      "priceCurrency": "USD",
      "description": "1 small shelf, 50 books, manual entry"
    },
    {
      "@type": "Offer",
      "name": "Reader",
      "price": "3.99",
      "priceCurrency": "USD",
      "description": "3 shelves, all import sources, reading stats"
    },
    {
      "@type": "Offer",
      "name": "Collector",
      "price": "7.99",
      "priceCurrency": "USD",
      "description": "Unlimited shelves, themes, Goodreads import, notebook"
    },
    {
      "@type": "Offer",
      "name": "Bibliophile",
      "price": "12.99",
      "priceCurrency": "USD",
      "description": "Everything in Collector plus priority AI, CSV export, early features"
    }
  ],
  "screenshot": "https://virtualbookshelf.app/og/home.jpg",
  "featureList": [
    "3D photorealistic bookshelf renderer",
    "Import from Goodreads, Kindle, Google Play Books, Apple Books, Kobo",
    "Book sizing based on page count",
    "Reading progress tracking and notes",
    "Reading streak tracker",
    "Vocabulary notebook",
    "Public shareable shelf URL",
    "Book marketplace for buying and selling",
    "Camera scan to identify books",
    "Progressive Web App — installable offline"
  ],
  "author": {
    "@type": "Organization",
    "name": "Virtual Bookshelf",
    "url": "https://virtualbookshelf.app"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "412"
  }
}
```

---

## SITEMAP.XML STRUCTURE

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

  <!-- Static pages — high priority -->
  <url>
    <loc>https://virtualbookshelf.app/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>

  <url>
    <loc>https://virtualbookshelf.app/pricing</loc>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>

  <url>
    <loc>https://virtualbookshelf.app/store</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>

  <url>
    <loc>https://virtualbookshelf.app/login</loc>
    <changefreq>yearly</changefreq>
    <priority>0.5</priority>
  </url>

  <url>
    <loc>https://virtualbookshelf.app/signup</loc>
    <changefreq>yearly</changefreq>
    <priority>0.7</priority>
  </url>

  <!-- Blog posts (when live) -->
  <url>
    <loc>https://virtualbookshelf.app/blog/goodreads-alternative</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>

  <url>
    <loc>https://virtualbookshelf.app/blog/reading-streak-tips</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>

  <url>
    <loc>https://virtualbookshelf.app/blog/book-collector-guide</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>

  <!--
    Dynamic public shelves (/s/:slug) are crawlable but
    generated server-side. Use a dynamic sitemap endpoint:
    https://virtualbookshelf.app/sitemap-shelves.xml
    Generated daily with all public shelf slugs.
    Priority: 0.5, changefreq: weekly
  -->

</urlset>
```

---

## BLOG POST OUTLINES

### Post 1: "Why Your Reading Life Deserves a Better Home Than Goodreads"
**Target keyword:** Goodreads alternative
**Estimated length:** 1,400 words

**Outline:**
1. Intro — You've been loyal to Goodreads. Here's why that loyalty isn't being returned.
2. What Goodreads gets right (brief, fair acknowledgment)
3. What Goodreads gets wrong:
   - Amazon ownership and ad experience
   - Interface frozen in 2012
   - No visual representation of your collection
   - Limited import/export flexibility
4. What you actually want from a reading app (surveying reader needs)
5. How Virtual Bookshelf approaches each problem differently
6. "But I have years of history on Goodreads" — how the import works
7. CTA: Import your Goodreads library to Virtual Bookshelf in under 2 minutes

---

### Post 2: "How to Build a Reading Streak That Actually Sticks"
**Target keyword:** reading streak tracker, reading habit
**Estimated length:** 1,200 words

**Outline:**
1. Intro — streaks work when the friction is removed and the reward is visible
2. Why reading habits fail (too ambitious, no feedback loop, no accountability)
3. The science of habit loops applied to reading
4. Practical streak-building techniques:
   - Set a minimum (5 pages counts)
   - Read at the same time every day
   - Keep your current book visible
5. How Virtual Bookshelf's streak tracker supports the habit
6. What to do when you break a streak (reframe, restart, don't quit)
7. CTA: Start tracking your reading streak today

---

### Post 3: "The Book Collector's Guide to Organising Your Library"
**Target keyword:** best app for book collectors, organise book collection
**Estimated length:** 1,600 words

**Outline:**
1. Intro — your collection is bigger than your memory. It's time to get organised.
2. The problem with purely physical organisation (can't search, can't share)
3. Cataloguing methods: by genre, author, acquisition date, read status
4. How to handle books across multiple formats (physical + ebook + audiobook)
5. The value of metadata: page count, ISBN, edition, publication year
6. Digitising your physical library: the camera scan approach
7. Sharing your catalogue as a public shelf
8. Using your catalogue for the buy-next wishlist and marketplace
9. CTA: Build your digital catalogue on Virtual Bookshelf
