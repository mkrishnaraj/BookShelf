# /start-phase-1 — Scaffold & Database

Kick off Phase 1 of Virtual Bookshelf: monorepo scaffold + database schema.

Run these steps in order:

## Step 1 — Monorepo scaffold
Create the following directory structure and config files:

```
virtual-bookshelf/
├── package.json          (workspace root, pnpm workspaces)
├── pnpm-workspace.yaml
├── tsconfig.base.json    (strict mode, shared)
├── .env.example          (all required env vars)
├── .gitignore
├── apps/
│   ├── web/              (Vite + React + TypeScript)
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   └── src/main.tsx
│   └── api/              (Express + TypeScript)
│       ├── package.json
│       ├── tsconfig.json
│       └── src/index.ts
└── packages/
    ├── db/               (Prisma)
    │   ├── package.json
    │   └── prisma/schema.prisma
    ├── shared/           (shared types)
    │   ├── package.json
    │   └── src/index.ts
    └── ai/               (enrichment)
        ├── package.json
        └── src/index.ts
```

Root `package.json` scripts:
```json
{
  "scripts": {
    "dev": "concurrently \"pnpm --filter api dev\" \"pnpm --filter web dev\"",
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "db:migrate": "pnpm --filter db migrate",
    "db:seed": "pnpm --filter db seed",
    "db:studio": "pnpm --filter db studio"
  }
}
```

`.env.example`:
```
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/virtual_bookshelf

# Auth
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_FREE_PRICE_ID=
STRIPE_READER_PRICE_ID=
STRIPE_READER_ANNUAL_PRICE_ID=
STRIPE_COLLECTOR_PRICE_ID=
STRIPE_COLLECTOR_ANNUAL_PRICE_ID=
STRIPE_BIBLIOPHILE_PRICE_ID=
STRIPE_BIBLIOPHILE_ANNUAL_PRICE_ID=

# External APIs
GOOGLE_BOOKS_API_KEY=
ANTHROPIC_API_KEY=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# App
API_URL=http://localhost:3001
WEB_URL=http://localhost:5173
NODE_ENV=development
```

## Step 2 — Delegate to @db-agent
Once scaffold is created, delegate to @db-agent with this task:

"Implement the full Prisma schema as defined in your agent instructions.
Create packages/db/prisma/schema.prisma, run prisma generate, and create
a seed file at packages/db/prisma/seed.ts with 1 demo user, 2 shelves,
and 20 books. Return DONE when migrations are ready to run."

## Step 3 — Confirm completion
When @db-agent returns DONE, confirm:
- [ ] Schema file exists at packages/db/prisma/schema.prisma
- [ ] All models present: User, Shelf, Book, BookNote, Notebook, NotebookEntry, DictionaryWord, WishlistItem, ReadingStreak, ReadingSession
- [ ] Seed file exists
- [ ] `pnpm db:migrate` command documented in README

Then report: "Phase 1 complete. Run `pnpm db:migrate && pnpm db:seed` to initialise the database. Then run /start-phase-2 to begin backend development."
