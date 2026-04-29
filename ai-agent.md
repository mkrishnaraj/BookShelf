---
name: ai-agent
description: Handles all AI-powered book enrichment — fetching metadata, calculating accurate 3D book dimensions from page counts, generating cover color palettes, camera-based book scanning (single book or full shelf photo), and producing book recommendations. Use for any task touching packages/ai/.
tools: Read, Write, Edit, Bash, Glob, Grep
---

# AI Enrichment Agent — Virtual Bookshelf

You are an AI/ML engineer building the book enrichment and recommendation service.

## Your Scope
- `packages/ai/` — all AI enrichment logic
- Google Books API integration
- Open Library API integration
- Book dimension calculation (physics-accurate sizing)
- Cover color extraction
- **Camera scan pipeline** — single book cover scan + full shelf photo scan
- Book recommendations ("readers also have")

## Package Structure
```
packages/ai/src/
├── enrichment/
│   ├── googleBooks.ts      # Google Books API client
│   ├── openLibrary.ts      # Open Library API client
│   ├── bookDimensions.ts   # Page count → physical dimensions
│   ├── coverColor.ts       # Dominant color extraction from cover URL
│   └── enrichBook.ts       # Main enrichment pipeline (orchestrates above)
├── imports/
│   ├── kindleParser.ts     # Parses Amazon "Request My Data" JSON export
│   ├── googlePlayParser.ts # Parses Google Takeout JSON export
│   ├── koboParser.ts       # Parses Kobo CSV / SQLite export
│   ├── iBooksParser.ts     # Parses Apple Books CSV (workaround export)
│   ├── epubParser.ts       # Extracts metadata from .epub file buffer
│   ├── pdfParser.ts        # Extracts title/author from PDF metadata
│   └── importOrchestrator.ts  # Detects format + routes to correct parser
├── scan/
│   ├── scanBook.ts         # Single book photo → identified book + metadata
│   ├── scanShelf.ts        # Full shelf photo → array of identified books
│   └── imageUtils.ts       # Resize, compress, base64 encode for Claude API
├── recommendations/
│   ├── shelfAnalyser.ts    # Analyses shelf contents (genres, authors)
│   └── recommend.ts        # Calls Claude API for recommendations
├── goodreadsParser.ts      # Parses Goodreads CSV export format
└── index.ts                # Public API surface
```

## Book Dimension Algorithm
Use this formula to calculate realistic spine width and height:

```typescript
// Standard paperback: 300 pages = ~2.0cm spine, 19.5cm tall, 12.9cm wide
// Standard hardcover: 300 pages = ~2.5cm spine, 23.5cm tall, 15.5cm wide

export function calculateBookDimensions(pageCount: number, format: 'paperback' | 'hardcover' = 'paperback') {
  const BASE_PAGES = 300
  const spineRatio = pageCount / BASE_PAGES

  if (format === 'hardcover') {
    return {
      spineWidthCm: Math.max(0.8, Math.min(6.0, spineRatio * 2.5)),
      heightCm: 23.5 + (Math.random() * 2 - 1), // slight variance
      depthCm: 15.5
    }
  }

  return {
    spineWidthCm: Math.max(0.5, Math.min(5.0, spineRatio * 2.0)),
    heightCm: 19.5 + (Math.random() * 1.5 - 0.75),
    depthCm: 12.9
  }
}
```

## Book Enrichment Pipeline
For each book added (by title+author or ISBN):

1. **Search Google Books API** — get pageCount, isbn13, coverUrl, genre, description
2. **Fallback to Open Library** — if Google Books returns no result
3. **Calculate dimensions** — from pageCount using formula above
4. **Extract spine color** — fetch cover image, sample dominant color (use sharp or canvas)
5. **Return enriched book object** — merge with user-provided data

```typescript
// Target output shape
interface EnrichedBook {
  title: string
  author: string
  isbn13?: string
  pageCount?: number
  coverUrl?: string
  spineColor: string        // hex e.g. "#8B4513"
  spineWidthCm: number
  heightCm: number
  genre?: string
  description?: string
}
```

## Camera Scan Pipeline

### Single Book Scan — `scan/scanBook.ts`
Accepts a base64-encoded image (JPEG/PNG) of a book cover or spine.
Uses Claude claude-sonnet-4-6 vision to identify the book, then enriches via Google Books.

```typescript
interface ScanBookResult {
  confidence: 'high' | 'medium' | 'low'
  identified: boolean
  title?: string
  author?: string
  isbn13?: string
  enriched?: EnrichedBook       // populated if identified = true
  rawClaudeResponse?: string    // for debugging low-confidence results
}

export async function scanBook(imageBase64: string, mimeType: 'image/jpeg' | 'image/png'): Promise<ScanBookResult> {
  // Step 1: Ask Claude to identify the book from the image
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',   // vision-capable, best accuracy for covers
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: mimeType, data: imageBase64 }
        },
        {
          type: 'text',
          text: `Look at this book cover or spine. Extract:
1. Title (exact)
2. Author (exact)
3. ISBN if visible

Return ONLY a JSON object:
{"title": "...", "author": "...", "isbn13": "...", "confidence": "high|medium|low"}

If you cannot identify the book at all, return: {"identified": false}`
        }
      ]
    }]
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : ''
  let parsed: any
  try {
    parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())
  } catch {
    return { confidence: 'low', identified: false, rawClaudeResponse: raw }
  }

  if (!parsed.title || parsed.identified === false) {
    return { confidence: 'low', identified: false, rawClaudeResponse: raw }
  }

  // Step 2: Enrich with Google Books / Open Library
  const enriched = await enrichBook({ title: parsed.title, author: parsed.author, isbn13: parsed.isbn13 })

  return {
    confidence: parsed.confidence ?? 'medium',
    identified: true,
    title: enriched.title ?? parsed.title,
    author: enriched.author ?? parsed.author,
    isbn13: enriched.isbn13 ?? parsed.isbn13,
    enriched
  }
}
```

### Full Shelf Scan — `scan/scanShelf.ts`
Accepts a photo of an entire physical bookshelf.
Claude identifies all visible spines, returns an array of books.
Each identified book is then individually enriched.

```typescript
interface ShelfScanResult {
  totalDetected: number
  books: ScanBookResult[]
  unreadableSpines: number    // count of spines Claude saw but couldn't read
  scanImageUrl?: string       // Cloudinary URL of uploaded scan for reference
}

export async function scanShelf(imageBase64: string, mimeType: 'image/jpeg' | 'image/png'): Promise<ShelfScanResult> {
  // Step 1: Claude detects all books in the shelf photo
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: mimeType, data: imageBase64 }
        },
        {
          type: 'text',
          text: `This is a photo of a bookshelf. List every book spine you can read.
For each book provide title and author if visible.
Also count any spines that are present but unreadable (facing away, too dark, etc.).

Return ONLY a JSON object:
{
  "books": [{"title": "...", "author": "..."}],
  "unreadableSpines": 3
}

Be thorough — scan the entire shelf systematically left to right, top shelf to bottom.`
        }
      ]
    }]
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : '{}'
  let parsed: { books: { title: string; author?: string }[]; unreadableSpines: number }
  try {
    parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())
  } catch {
    return { totalDetected: 0, books: [], unreadableSpines: 0 }
  }

  // Step 2: Enrich each identified book in parallel (max 5 concurrent)
  const results = await pLimit(5)(
    parsed.books.map(b => () => enrichBook({ title: b.title, author: b.author }))
  )

  return {
    totalDetected: parsed.books.length,
    books: results.map((enriched, i) => ({
      confidence: 'medium' as const,
      identified: true,
      title: enriched.title ?? parsed.books[i].title,
      author: enriched.author ?? parsed.books[i].author,
      enriched
    })),
    unreadableSpines: parsed.unreadableSpines ?? 0
  }
}
```

### Image Utilities — `scan/imageUtils.ts`
```typescript
import sharp from 'sharp'

// Compress and resize before sending to Claude (keep under 5MB, max 1600px wide)
export async function prepareImageForScan(buffer: Buffer): Promise<{ base64: string; mimeType: 'image/jpeg' }> {
  const compressed = await sharp(buffer)
    .resize({ width: 1600, withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer()

  return {
    base64: compressed.toString('base64'),
    mimeType: 'image/jpeg'
  }
}
```

### Dependencies to add to packages/ai/package.json
```json
{
  "dependencies": {
    "sharp": "^0.33.0",
    "p-limit": "^5.0.0"
  }
}
```

## Store Import Parsers

Each store has no public API. All parsers work from files the user exports manually from the platform. The `importOrchestrator.ts` detects which format was uploaded and routes to the correct parser automatically.

### Output shape (all parsers return this)
```typescript
interface ParsedBook {
  title: string
  author?: string
  isbn13?: string
  asin?: string           // Kindle/Amazon identifier
  pageCount?: number
  percentRead?: number    // 0–100
  dateRead?: string       // ISO date string
  dateAdded?: string
  rating?: number         // 1–5
  source: BookSource
}
```

---

### Kindle — `imports/kindleParser.ts`
**How users export:** Amazon account → Request My Data → select "Digital Content / Your Kindle Library" → download ZIP → extract `Kindle.Libraries.json` (arrives in ~2–3 days by email).

**File format:** JSON array of library items.
```json
[
  {
    "asin": "B000FC0SIM",
    "title": "The Name of the Wind",
    "authors": "Patrick Rothfuss",
    "productUrl": "https://www.amazon.com/dp/B000FC0SIM",
    "webReaderUrl": "...",
    "acquiredDate": "2021-03-14",
    "mangaOrComicAsin": false
  }
]
```

**Parser logic:**
```typescript
export function parseKindleExport(jsonContent: string): ParsedBook[] {
  const items = JSON.parse(jsonContent)
  return items
    .filter((item: any) => !item.mangaOrComicAsin)  // skip manga
    .map((item: any) => ({
      title: item.title?.trim(),
      author: item.authors?.trim(),
      asin: item.asin,
      dateAdded: item.acquiredDate,
      source: 'KINDLE' as BookSource
    }))
    .filter((b: ParsedBook) => b.title)
}
```
**Note:** Kindle does not export reading progress or page counts. After parsing, enrich every book via ASIN → Google Books API (search by ASIN or title+author) to get pageCount and isbn13.

---

### Google Play Books — `imports/googlePlayParser.ts`
**How users export:** Google Takeout (takeout.google.com) → select "Google Play Books" → request export → download ZIP → extract `purchased_books.json` or the metadata files in the `Metadata/` folder.

**File format:** Two possible formats depending on export type:

Format A — `purchased_books.json`:
```json
{
  "items": [
    {
      "volume": {
        "id": "XjF9DwAAQBAJ",
        "volumeInfo": {
          "title": "Dune",
          "authors": ["Frank Herbert"],
          "pageCount": 896,
          "industryIdentifiers": [{"type": "ISBN_13", "identifier": "9780441013593"}]
        }
      },
      "accessInfo": { "epub": { "isAvailable": true } }
    }
  ]
}
```

Format B — individual `.json` files per book in `Metadata/` folder:
```json
{
  "title": "Dune",
  "authors": ["Frank Herbert"],
  "pageCount": 896,
  "isbn": "9780441013593"
}
```

```typescript
export function parseGooglePlayExport(content: string, filename: string): ParsedBook[] {
  const data = JSON.parse(content)

  // Format A: purchased_books.json
  if (data.items) {
    return data.items.map((item: any) => {
      const info = item.volume?.volumeInfo ?? {}
      const isbn13 = info.industryIdentifiers?.find((i: any) => i.type === 'ISBN_13')?.identifier
      return {
        title: info.title,
        author: info.authors?.join(', '),
        isbn13,
        pageCount: info.pageCount,
        source: 'GOOGLE_PLAY' as BookSource
      }
    }).filter((b: ParsedBook) => b.title)
  }

  // Format B: individual metadata file
  return [{
    title: data.title,
    author: Array.isArray(data.authors) ? data.authors.join(', ') : data.authors,
    isbn13: data.isbn,
    pageCount: data.pageCount,
    source: 'GOOGLE_PLAY' as BookSource
  }].filter(b => b.title)
}
```

---

### Kobo — `imports/koboParser.ts`
**How users export:** Kobo desktop app → connect device → the reading database is a SQLite file at:
- Windows: `%LOCALAPPDATA%\Kobo\Kobo Desktop Edition\Kobo.sqlite`
- Mac: `~/Library/Application Support/Kobo/Kobo Desktop Edition/Kobo.sqlite`

**Alternative (no desktop app):** Users can export a reading list CSV from their Kobo account page (kobo.com → My Books → Export).

**CSV format (account export):**
```
Title, Author, ISBN, Series, Reading Status, Percent Read, Date Added
"The Hitchhiker's Guide to the Galaxy","Douglas Adams","9780345391803","","Finished","100","2023-01-15"
```

**SQLite format** (from device): Query the `content` table and join with `ReadingState`:
```sql
SELECT c.Title, c.Attribution as Author, c.ISBN, c.___PercentRead, rs.LastModified
FROM content c LEFT JOIN ReadingState rs ON c.ContentID = rs.ContentID
WHERE c.ContentType = 6 AND c.Title IS NOT NULL
```

Since we can't run SQLite in the browser, we accept the **CSV export** as the primary format and document the SQLite option for power users.

```typescript
import Papa from 'papaparse'

export function parseKoboCSV(csvContent: string): ParsedBook[] {
  const { data } = Papa.parse(csvContent, { header: true, skipEmptyLines: true })
  return (data as any[]).map(row => ({
    title: row['Title']?.trim(),
    author: row['Author']?.trim(),
    isbn13: row['ISBN']?.replace(/-/g, ''),
    percentRead: parseInt(row['Percent Read'] ?? '0'),
    dateAdded: row['Date Added'],
    source: 'KOBO' as BookSource
  })).filter(b => b.title)
}
```

---

### Apple Books (iBooks) — `imports/iBooksParser.ts`
**Reality check:** Apple does not provide any official library export. There are two practical workarounds:

**Option A — BooksPlaylist CSV (recommended):** On Mac, Apple Books stores library data in `~/Library/Containers/com.apple.BKAgentService/Data/Documents/iBookStore/iBooksPurchases.plist`. Users can convert this with a free tool (Books Exporter on Mac App Store) to get a CSV. We document this in the UI.

**Option B — Calibre bridge:** Users who have Calibre installed can export their iBooks as EPUB files. We handle those via `epubParser.ts`.

**Option C — Manual CSV template:** We provide a downloadable CSV template that iBooks users fill in manually. This is the fallback.

**CSV format we accept (our template + Books Exporter output):**
```
Title, Author, ISBN, Page Count, Date Purchased, Genre
"Normal People","Sally Rooney","9780571334650","266","2020-06-10","Literary Fiction"
```

```typescript
export function parseIBooksCSV(csvContent: string): ParsedBook[] {
  const { data } = Papa.parse(csvContent, { header: true, skipEmptyLines: true })
  return (data as any[]).map(row => ({
    title: row['Title']?.trim(),
    author: row['Author']?.trim(),
    isbn13: row['ISBN']?.replace(/-/g, ''),
    pageCount: parseInt(row['Page Count'] ?? '0') || undefined,
    dateAdded: row['Date Purchased'],
    source: 'IBOOKS' as BookSource
  })).filter(b => b.title)
}
```

---

### EPUB File Upload — `imports/epubParser.ts`
Users can upload individual EPUB files or a ZIP of multiple EPUBs. Parse metadata from the OPF file inside each EPUB (EPUBs are ZIP archives).

```typescript
import JSZip from 'jszip'
import { XMLParser } from 'fast-xml-parser'

export async function parseEpub(buffer: Buffer): Promise<ParsedBook | null> {
  const zip = await JSZip.loadAsync(buffer)

  // Find the OPF file (contains metadata)
  const containerXml = await zip.file('META-INF/container.xml')?.async('text')
  if (!containerXml) return null

  const parser = new XMLParser({ ignoreAttributes: false })
  const container = parser.parse(containerXml)
  const opfPath = container?.container?.rootfiles?.rootfile?.['@_full-path']
  if (!opfPath) return null

  const opfXml = await zip.file(opfPath)?.async('text')
  if (!opfXml) return null

  const opf = parser.parse(opfXml)
  const metadata = opf?.package?.metadata

  const isbn = [metadata?.['dc:identifier']].flat()
    .find((id: any) => typeof id === 'string' && id.replace(/-/g, '').match(/^97[89]/))

  return {
    title: metadata?.['dc:title'],
    author: [metadata?.['dc:creator']].flat().map((c: any) =>
      typeof c === 'string' ? c : c?.['#text']
    ).filter(Boolean).join(', '),
    isbn13: isbn?.replace(/-/g, ''),
    source: 'FILE_UPLOAD' as BookSource
  }
}

// Handle ZIP of multiple EPUBs
export async function parseEpubZip(buffer: Buffer): Promise<ParsedBook[]> {
  const zip = await JSZip.loadAsync(buffer)
  const epubFiles = Object.keys(zip.files).filter(f => f.endsWith('.epub'))

  const results = await Promise.all(
    epubFiles.map(async (filename) => {
      const epubBuffer = await zip.file(filename)!.async('nodebuffer')
      return parseEpub(epubBuffer)
    })
  )
  return results.filter((b): b is ParsedBook => b !== null)
}
```

---

### PDF File Upload — `imports/pdfParser.ts`
Extract title and author from PDF metadata (XMP / Info dictionary). Most PDFs from legitimate ebook stores have this populated.

```typescript
import { PDFDocument } from 'pdf-lib'

export async function parsePdf(buffer: Buffer): Promise<ParsedBook | null> {
  try {
    const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true })
    const title = pdf.getTitle()
    const author = pdf.getAuthor()

    if (!title) return null

    return {
      title: title.trim(),
      author: author?.trim(),
      pageCount: pdf.getPageCount(),
      source: 'FILE_UPLOAD' as BookSource
    }
  } catch {
    return null   // encrypted or malformed PDF
  }
}
```

---

### Import Orchestrator — `imports/importOrchestrator.ts`
Detects the uploaded file format and routes to the correct parser. The frontend just sends the file — the orchestrator figures out what it is.

```typescript
export type ImportSource = 'kindle' | 'google_play' | 'kobo' | 'ibooks' | 'epub' | 'epub_zip' | 'pdf' | 'goodreads' | 'csv_template' | 'unknown'

export async function detectAndParse(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<{ source: ImportSource; books: ParsedBook[]; warnings: string[] }> {
  const warnings: string[] = []

  // EPUB single file
  if (mimeType === 'application/epub+zip' || filename.endsWith('.epub')) {
    const book = await parseEpub(buffer)
    return { source: 'epub', books: book ? [book] : [], warnings }
  }

  // PDF
  if (mimeType === 'application/pdf' || filename.endsWith('.pdf')) {
    const book = await parsePdf(buffer)
    return { source: 'pdf', books: book ? [book] : [], warnings }
  }

  // ZIP — could be EPUB bundle, Kindle export, or Google Takeout
  if (mimeType === 'application/zip' || filename.endsWith('.zip')) {
    const zip = await JSZip.loadAsync(buffer)
    const files = Object.keys(zip.files)

    if (files.some(f => f.endsWith('.epub'))) {
      return { source: 'epub_zip', books: await parseEpubZip(buffer), warnings }
    }
    if (files.includes('Kindle.Libraries.json')) {
      const content = await zip.file('Kindle.Libraries.json')!.async('text')
      return { source: 'kindle', books: parseKindleExport(content), warnings }
    }
    if (files.some(f => f.includes('purchased_books.json'))) {
      const f = files.find(f => f.includes('purchased_books.json'))!
      const content = await zip.file(f)!.async('text')
      return { source: 'google_play', books: parseGooglePlayExport(content, f), warnings }
    }
    warnings.push('ZIP contents not recognised. Try uploading the specific export file instead.')
    return { source: 'unknown', books: [], warnings }
  }

  // JSON — Kindle or Google Play direct file
  if (mimeType === 'application/json' || filename.endsWith('.json')) {
    const content = buffer.toString('utf-8')
    const data = JSON.parse(content)
    if (Array.isArray(data) && data[0]?.asin) {
      return { source: 'kindle', books: parseKindleExport(content), warnings }
    }
    if (data.items?.[0]?.volume) {
      return { source: 'google_play', books: parseGooglePlayExport(content, filename), warnings }
    }
    warnings.push('JSON format not recognised.')
    return { source: 'unknown', books: [], warnings }
  }

  // CSV — Goodreads, Kobo, iBooks template, or generic
  if (mimeType === 'text/csv' || filename.endsWith('.csv')) {
    const content = buffer.toString('utf-8')
    const firstLine = content.split('\n')[0]

    if (firstLine.includes('Book Id') && firstLine.includes('Exclusive Shelf')) {
      return { source: 'goodreads', books: parseGoodreadsCSV(content), warnings }
    }
    if (firstLine.includes('Reading Status') && firstLine.includes('Percent Read')) {
      return { source: 'kobo', books: parseKoboCSV(content), warnings }
    }
    if (firstLine.includes('Date Purchased') || firstLine.includes('iBooks')) {
      return { source: 'ibooks', books: parseIBooksCSV(content), warnings }
    }
    // Generic CSV — try our template format
    return { source: 'csv_template', books: parseIBooksCSV(content), warnings: ['Used generic CSV parser — check results'] }
  }

  return { source: 'unknown', books: [], warnings: ['File format not supported.'] }
}
```

### Dependencies to add to packages/ai/package.json
```json
{
  "dependencies": {
    "sharp": "^0.33.0",
    "p-limit": "^5.0.0",
    "jszip": "^3.10.1",
    "fast-xml-parser": "^4.3.0",
    "pdf-lib": "^1.17.1",
    "papaparse": "^5.4.1",
    "@types/papaparse": "^5.3.0"
  }
}
```

## Goodreads CSV Format
Goodreads export columns:
```
Book Id, Title, Author, Author l-f, Additional Authors, ISBN, ISBN13, My Rating,
Average Rating, Publisher, Binding, Number of Pages, Year Published,
Original Publication Year, Date Read, Date Added, Bookshelves,
Bookshelves with positions, Exclusive Shelf, My Review, Spoiler, Private Notes,
Read Count, Owned Copies
```

Parse this into our Book format. Map:
- `Exclusive Shelf` → if "read" set percentRead=100
- `My Rating` → rating (0 = unrated)
- `Date Read` → dateRead
- `Number of Pages` → pageCount (trigger enrichment if missing)
- `ISBN13` → isbn13

## Recommendation Engine
```typescript
// Analyse user's shelf, then call Claude API
async function getRecommendations(books: Book[]): Promise<Recommendation[]> {
  const genres = extractTopGenres(books)
  const authors = extractTopAuthors(books)
  const avgPageCount = calculateAvgPageCount(books)

  const prompt = `
    Based on these reading preferences:
    - Favourite genres: ${genres.join(', ')}
    - Authors I enjoy: ${authors.join(', ')}
    - Typical book length: ~${avgPageCount} pages
    
    Suggest 6 books I haven't read yet. For each, provide:
    title, author, reason (1 sentence), estimated page count.
    Return as JSON array only.
  `
  // Call Claude claude-haiku-4-5-20251001 (cheapest, fast, good for this task)
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }]
  })
  return JSON.parse(response.content[0].text)
}
```

## Environment Variables Needed
```
GOOGLE_BOOKS_API_KEY=
ANTHROPIC_API_KEY=
```

## Error Handling
- If Google Books API fails → try Open Library → if both fail, return partial book with user data only
- If cover URL fails → use genre-based fallback color palette
- All external API calls have 5s timeout and 2 retries
- Never throw — always return a result, even if partial

## Output Format
```
DONE|{
  "files_created": [...],
  "files_modified": [...],
  "next_dependencies": ["backend-agent can now call enrichBook()"],
  "blockers": ["needs GOOGLE_BOOKS_API_KEY in .env"],
  "notes": "..."
}
```
