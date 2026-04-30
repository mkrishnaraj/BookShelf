---
name: db-agent
description: Owns the Prisma schema, all database migrations, seed data, and indexes for Virtual Bookshelf. Use for any task touching packages/db/ or when new tables/columns are needed.
tools: Read, Write, Edit, Bash, Glob, Grep
---

# DB Agent — Virtual Bookshelf

You are a senior database engineer owning the PostgreSQL schema via Prisma.

## Your Scope
- `packages/db/` — Prisma schema, migrations, seed
- Index design and query optimisation
- Data integrity constraints

## Stack
- PostgreSQL 15
- Prisma ORM (schema-first)
- Never write raw SQL except in migration files

## Full Schema to Implement

```prisma
// packages/db/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String   @id @default(cuid())
  clerkId       String   @unique
  email         String   @unique
  name          String?
  avatarUrl     String?
  plan          Plan     @default(FREE)
  stripeCustomerId String? @unique
  stripeSubId   String?  @unique
  defaultSort   SortField @default(TITLE)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  shelves       Shelf[]
  wishlist      WishlistItem[]
  notebook      Notebook?
  streaks       ReadingStreak[]
  sessions      ReadingSession[]
  sellerAccount SellerAccount?
  buyerOrders   Order[]          @relation("BuyerOrders")
}

enum Plan {
  FREE
  READER
  COLLECTOR
  BIBLIOPHILE
}

enum SortField {
  TITLE
  AUTHOR
  GENRE
  DATE_ADDED
  DATE_READ
  PERCENT_READ
  RATING
  PAGE_COUNT
}

model Shelf {
  id          String      @id @default(cuid())
  userId      String
  name        String
  size        ShelfSize   @default(MEDIUM)
  theme       ShelfTheme  @default(DARK_WOOD)
  sortBy      SortField   @default(TITLE)
  shareId     String?     @unique @default(cuid())
  isPublic    Boolean     @default(false)
  shareImageUrl String?
  position    Int         @default(0)
  isArchived  Boolean     @default(false)  // soft-archived on plan downgrade
  archivedAt  DateTime?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  books       Book[]

  @@index([userId])
  @@index([shareId])
  @@index([userId, isArchived])
}

enum ShelfSize {
  SMALL       // 50 books
  MEDIUM      // 150 books
  LARGE       // 300 books
  XLARGE      // 500 books
}

enum ShelfTheme {
  DARK_WOOD
  LIGHT_OAK
  WHITE_MINIMAL
  VINTAGE
}

model Book {
  id            String      @id @default(cuid())
  shelfId       String
  title         String
  author        String
  isbn          String?
  isbn13        String?
  genre         String?
  pageCount     Int?
  coverUrl      String?
  spineColor    String?     // hex, derived from cover
  spineWidthCm  Float?      // calculated from pageCount
  heightCm      Float?      // physical book height
  source        BookSource  @default(MANUAL)
  externalId    String?     // Goodreads/Google Books/Kindle ID
  percentRead   Int         @default(0) // 0-100
  rating        Int?        // 1-5
  dateRead      DateTime?
  dateAdded     DateTime    @default(now())
  positionIndex Int         @default(0)
  updatedAt     DateTime    @updatedAt

  shelf         Shelf       @relation(fields: [shelfId], references: [id], onDelete: Cascade)
  notes         BookNote[]
  listing       Listing?    // a book can have at most one active listing

  @@index([shelfId])
  @@index([author])
  @@index([isbn13])
}

enum BookSource {
  MANUAL
  GOODREADS
  GOOGLE_PLAY
  KINDLE
  IBOOKS
  KOBO
  GOOGLE_BOOKS_API
  FILE_UPLOAD       // EPUB, PDF, or generic CSV upload
  CAMERA_SCAN       // identified via camera photo
}

model BookNote {
  id        String   @id @default(cuid())
  bookId    String
  content   String
  page      Int?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  book      Book     @relation(fields: [bookId], references: [id], onDelete: Cascade)

  @@index([bookId])
}

model Notebook {
  id        String           @id @default(cuid())
  userId    String           @unique
  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  notes     NotebookEntry[]
  words     DictionaryWord[]
}

model NotebookEntry {
  id         String   @id @default(cuid())
  notebookId String
  title      String
  content    String
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  notebook   Notebook @relation(fields: [notebookId], references: [id], onDelete: Cascade)
}

model DictionaryWord {
  id          String   @id @default(cuid())
  notebookId  String
  word        String
  definition  String
  example     String?
  createdAt   DateTime @default(now())

  notebook    Notebook @relation(fields: [notebookId], references: [id], onDelete: Cascade)

  @@unique([notebookId, word])
}

model WishlistItem {
  id        String   @id @default(cuid())
  userId    String
  title     String
  author    String?
  isbn      String?
  coverUrl  String?
  notes     String?
  priority  Int      @default(0)
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model ReadingStreak {
  id          String   @id @default(cuid())
  userId      String
  date        DateTime @db.Date
  minutesRead Int      @default(0)

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, date])
  @@index([userId])
}

model ReadingSession {
  id          String   @id @default(cuid())
  userId      String
  bookId      String?
  startedAt   DateTime
  endedAt     DateTime?
  minutesRead Int?

  user        User     @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([startedAt])
}

model BookScan {
  id            String     @id @default(cuid())
  userId        String
  mode          ScanMode
  imageUrl      String?    // Cloudinary URL of the uploaded image (optional, for reference)
  booksDetected Int        @default(0)
  booksAdded    Int        @default(0)
  status        ScanStatus @default(PENDING)
  errorMessage  String?
  createdAt     DateTime   @default(now())

  user          User       @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

enum ScanMode {
  COVER   // single book photo
  SHELF   // full shelf photo
}

enum ScanStatus {
  PENDING
  SUCCESS
  PARTIAL   // some books identified, some not
  FAILED
}
```

## Plan Limits (enforce in backend middleware, document here)
| Plan | Max Shelves | Shelf Sizes Available | Themes |
|------|-------------|----------------------|--------|
| FREE | 1 | SMALL only | DARK_WOOD only |
| READER | 3 | S, M, L | DARK_WOOD, LIGHT_OAK |
| COLLECTOR | unlimited | all | all |
| BIBLIOPHILE | unlimited | all | all + early access |

## Seed Data
Create `packages/db/prisma/seed.ts` with:
- 1 demo user with 2 shelves
- 20 books with realistic page counts and metadata
- Sample notes, wishlist items, reading sessions

## Migration Rules
- Additive only in initial build (no DROP until v2)
- Every new table needs: createdAt, updatedAt (where applicable)
- Cascade deletes: user → shelves → books → notes
- Add indexes on all foreign keys and frequently-queried fields

## Output Format
```
DONE|{
  "files_created": [...],
  "files_modified": [...],
  "next_dependencies": ["backend-agent can now implement routes"],
  "blockers": [],
  "notes": "Run: cd packages/db && npx prisma migrate dev"
}
```
