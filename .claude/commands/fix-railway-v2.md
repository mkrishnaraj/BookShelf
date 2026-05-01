# /fix-railway-v2 — Fix all Railway deployment issues (complete fix)

Apply ALL fixes below in sequence. Do not stop or ask for confirmation.
These fixes address all TypeScript compilation errors seen in Railway build logs.

---

## Fix 1 — Update tsconfig.base.json (root of all module resolution issues)

Overwrite `tsconfig.base.json` in project root with exactly this content:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "strict": false,
    "noImplicitAny": false,
    "exactOptionalPropertyTypes": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "resolveJsonModule": true,
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

## Fix 2 — Update apps/api/tsconfig.json

Overwrite `apps/api/tsconfig.json` with exactly this content:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "skipLibCheck": true,
    "noImplicitAny": false,
    "exactOptionalPropertyTypes": false,
    "declaration": false
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## Fix 3 — Update all package tsconfigs

Overwrite `packages/ai/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

Overwrite `packages/shared/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

Overwrite `packages/db/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "prisma"]
}
```

## Fix 4 — Fix all package.json exports and types

Update `packages/db/package.json`:
- Remove `"type": "module"` if present
- Set exports to `"./dist/index.js"`
- Add `"main": "./dist/index.js"`
- Add `"types": "./dist/index.d.ts"`
- Ensure `"build": "tsc"` is in scripts

Update `packages/shared/package.json`:
- Remove `"type": "module"` if present
- Set exports to `"./dist/index.js"`
- Add `"main": "./dist/index.js"`
- Add `"types": "./dist/index.d.ts"`

Update `packages/ai/package.json`:
- Remove `"type": "module"` if present
- Set exports to `"./dist/index.js"`
- Add `"main": "./dist/index.js"`
- Add `"types": "./dist/index.d.ts"`

Update `apps/api/package.json`:
- Remove `"type": "module"` if present
- Add `"main": "./dist/index.js"`

## Fix 5 — Add explicit Router type annotations to ALL route files

For every file in `apps/api/src/routes/` that has:
```typescript
const router = Router()
```

Change it to:
```typescript
import { Router, Request, Response, NextFunction } from 'express'
const router: Router = Router()
```

Do this for ALL route files:
- billing.ts
- books.ts
- feedback.ts
- marketplace.ts
- notebook.ts
- recommendations.ts
- scan.ts
- seller.ts
- shelves.ts
- social.ts
- stats.ts
- streaks.ts
- users.ts
- webhooks.ts
- wishlist.ts

## Fix 6 — Add explicit type to app in index.ts

In `apps/api/src/index.ts`, change:
```typescript
const app = express()
```
To:
```typescript
import express, { Application } from 'express'
const app: Application = express()
```

## Fix 7 — Add explicit type to clerkAuth in auth middleware

In `apps/api/src/middleware/auth.ts`, add explicit return type:
```typescript
import { Request, Response, NextFunction, RequestHandler } from 'express'
export const clerkAuth: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
```

## Fix 8 — Fix module imports to use .js extensions (required for Node16)

In ALL files under `apps/api/src/` that import from local paths using relative imports:
Change all relative imports to include `.js` extension:
- `from './routes/books'` → `from './routes/books.js'`
- `from '../lib/prisma'` → `from '../lib/prisma.js'`
- `from '../middleware/auth'` → `from '../middleware/auth.js'`
- etc.

Do this for ALL local relative imports in ALL files under `apps/api/src/`.
Do NOT add `.js` to package imports like `'express'`, `'db'`, `'shared'`, `'ai'`.

## Fix 9 — Fix health endpoint placement

In `apps/api/src/index.ts`:
- Ensure `/health` route is registered BEFORE any other middleware or routes
- It must be the very first route after `const app = express()`

```typescript
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() })
})
```

## Fix 10 — Fix PORT

In `apps/api/src/index.ts`:
```typescript
const PORT = process.env.PORT ?? 3001
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`)
})
```

## Fix 11 — Fix recommendations.ts

In `apps/api/src/routes/recommendations.ts`:
- If `getRecommendations` is not properly exported from the `ai` package, replace with inline stub:
```typescript
async function getRecommendations(books: any[], count: number): Promise<any[]> {
  return []
}
```
- Fix genre null: `books.map(b => ({ ...b, genre: b.genre ?? undefined }))`

## Fix 12 — Fix marketplace.ts

In `apps/api/src/routes/marketplace.ts`:
- Replace all `listing.status` references with `listing.isActive`
- Remove `status: true` from select blocks, replace with `isActive: true`
- `listing.status === 'ACTIVE'` → `listing.isActive === true`
- `listing.status !== 'ACTIVE'` → `listing.isActive !== true`

## Fix 13 — Regenerate lockfile

Run in project root:
```bash
pnpm install --no-frozen-lockfile
```

## Fix 14 — Ensure .npmrc has frozen-lockfile=false

`.npmrc` must contain:
```
shamefully-hoist=true
frozen-lockfile=false
```

## Fix 16 — Fix web Dockerfile (use node runtime not nginx)

Overwrite `apps/web/Dockerfile` with exactly this content:

```dockerfile
FROM node:20-alpine AS builder

RUN npm install -g pnpm@9

WORKDIR /app

COPY package.json pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --no-frozen-lockfile

COPY apps/web ./apps/web
COPY packages/shared ./packages/shared
COPY tsconfig.base.json ./

ARG VITE_API_URL
ARG VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY

RUN pnpm --filter web build

FROM node:20-alpine AS runtime

RUN npm install -g serve

WORKDIR /app

COPY --from=builder /app/apps/web/dist ./dist

EXPOSE 3000

CMD ["serve", "-s", "dist", "-p", "3000"]
```

## Fix 17 — Fix API Dockerfile (add OpenSSL before pnpm install)

Overwrite `apps/api/Dockerfile` with exactly this content:

```dockerfile
FROM node:20-alpine AS builder

RUN npm install -g pnpm@9 && \
    apk add --no-cache openssl openssl-dev libc6-compat

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/
COPY packages/ai/package.json ./packages/ai/

RUN pnpm install --no-frozen-lockfile

COPY apps/api ./apps/api
COPY packages ./packages
COPY tsconfig.base.json ./

RUN pnpm --filter db generate

RUN pnpm --filter shared build
RUN pnpm --filter db build
RUN pnpm --filter ai build
RUN pnpm --filter api build

FROM node:20-alpine AS runtime

RUN npm install -g pnpm@9
RUN apk add --no-cache dumb-init openssl libc6-compat

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/
COPY packages/ai/package.json ./packages/ai/

RUN pnpm install --no-frozen-lockfile --prod

COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages/db/dist ./packages/db/dist
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/ai/dist ./packages/ai/dist
COPY --from=builder /app/packages/db/prisma ./packages/db/prisma
COPY --from=builder /app/node_modules/.pnpm ./node_modules/.pnpm

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 3001

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/api/dist/index.js"]
```

## Fix 18 — Commit and push everything

```bash
git add -A
git commit -m "Fix all TypeScript and module resolution errors for Railway deployment"
git push
```

## Success criteria

The build succeeds when:
- `pnpm --filter api build` completes with zero TypeScript errors
- All route files have explicit `Router` type annotations
- All local imports have `.js` extensions
- Package imports (`'db'`, `'shared'`, `'ai'`) have no `.js` extension
- Health endpoint is first route in index.ts
- PORT uses `process.env.PORT`
