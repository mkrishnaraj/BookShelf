# /fix-railway — Fix all Railway deployment issues in one shot

Fix all known issues preventing the app from deploying on Railway.
Apply ALL fixes below in sequence without stopping. Do not ask for confirmation.

## Fix 1 — Switch API to CommonJS (fixes ESM module resolution crash)

Update `apps/api/package.json`:
- Remove `"type": "module"` line entirely

Update `apps/api/tsconfig.json` compilerOptions:
- Change `"module": "NodeNext"` to `"module": "CommonJS"`
- Change `"moduleResolution": "NodeNext"` to `"moduleResolution": "Node"`
- Ensure `"skipLibCheck": true` is present
- Ensure `"noImplicitAny": false` is present
- Ensure `"exactOptionalPropertyTypes": false` is present

## Fix 2 — Switch all packages to CommonJS

Update `packages/ai/package.json`:
- Remove `"type": "module"` if present
- Change exports from `"./dist/index.ts"` or `"./src/index.ts"` to `"./dist/index.js"`

Update `packages/shared/package.json`:
- Remove `"type": "module"` if present  
- Change exports to `"./dist/index.js"`

Update `packages/db/package.json`:
- Remove `"type": "module"` if present
- Change exports to `"./dist/index.js"`
- Ensure `"build": "tsc"` exists in scripts

Update `packages/ai/tsconfig.json` compilerOptions:
- Set `"module": "CommonJS"`
- Set `"moduleResolution": "Node"`
- Set `"declaration": true`
- Set `"skipLibCheck": true`

Update `packages/shared/tsconfig.json` compilerOptions:
- Set `"module": "CommonJS"`
- Set `"moduleResolution": "Node"`
- Set `"declaration": true`
- Set `"skipLibCheck": true`

Update `packages/db/tsconfig.json` compilerOptions:
- Set `"module": "CommonJS"`
- Set `"moduleResolution": "Node"`
- Set `"declaration": true`
- Set `"skipLibCheck": true`

## Fix 3 — Fix health endpoint (must be before all middleware and auth)

In `apps/api/src/index.ts`:
- Move the `/health` route to be the FIRST route registered, before any middleware
- Ensure it looks exactly like this:
```typescript
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() })
})
```
- Ensure PORT uses: `const PORT = process.env.PORT ?? 3001`
- Ensure listen uses: `app.listen(PORT, () => { console.log('API running on port ' + PORT) })`

## Fix 4 — Fix all import paths for CommonJS compatibility

In all files under `apps/api/src/`:
- Remove `.js` extensions from all local imports (CommonJS doesn't need them)
- Ensure all package imports use exact package names: `'db'`, `'shared'`, `'ai'`

## Fix 5 — Fix recommendations.ts import

In `apps/api/src/routes/recommendations.ts`:
- Change `import { getRecommendations } from 'ai'` to import from the correct local path
- Check what is actually exported from `packages/ai/src/index.ts`
- If `getRecommendations` is not exported, add a stub implementation inline:
```typescript
async function getRecommendations(books: any[], count: number) {
  return []
}
```

## Fix 6 — Fix marketplace.ts status field

In `apps/api/src/routes/marketplace.ts`:
- Replace all `listing.status === 'ACTIVE'` with `listing.isActive === true`
- Replace all `listing.status === 'RESERVED'` or `listing.status === 'SOLD'` with `!listing.isActive`
- Remove `status: true` from any Prisma select blocks
- Replace with `isActive: true`

## Fix 7 — Fix genre null type in recommendations

In `apps/api/src/routes/recommendations.ts` around line 28:
- Map books before passing to getRecommendations:
```typescript
const mappedBooks = books.map(b => ({ ...b, genre: b.genre ?? undefined }))
```

## Fix 8 — Regenerate pnpm lockfile

After all code fixes are applied:
- Run `pnpm install --no-frozen-lockfile` in the project root
- This regenerates `pnpm-lock.yaml` with all current dependencies

## Fix 9 — Update .npmrc

Ensure `.npmrc` in project root contains:
```
shamefully-hoist=true
frozen-lockfile=false
```

## Fix 10 — Update nixpacks.toml and railpack.toml

Create/update `nixpacks.toml` in project root:
```toml
[phases.install]
cmds = ["pnpm install --no-frozen-lockfile"]

[phases.build]
cmds = ["pnpm --filter db generate && pnpm --filter shared build && pnpm --filter db build && pnpm --filter ai build && pnpm --filter api build"]

[start]
cmd = "node apps/api/dist/index.js"
```

Create/update `railpack.toml` in project root:
```toml
[phases.install]
cmds = ["pnpm install --no-frozen-lockfile"]

[phases.build]
cmds = ["pnpm --filter db generate && pnpm --filter shared build && pnpm --filter db build && pnpm --filter ai build && pnpm --filter api build"]

[start]
cmd = "node apps/api/dist/index.js"
```

## Fix 11 — Verify tsconfig.base.json

Ensure `tsconfig.base.json` in project root has:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "moduleResolution": "Node",
    "strict": false,
    "noImplicitAny": false,
    "exactOptionalPropertyTypes": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "resolveJsonModule": true
  }
}
```

## Fix 12 — Commit and push all changes

After ALL fixes are applied and pnpm install completes:

```bash
git add -A
git commit -m "Fix all Railway deployment issues - CommonJS, health endpoint, lockfile"
git push
```

## Verification before pushing

Before committing, verify:
- `apps/api/src/index.ts` has `/health` as first route
- `apps/api/package.json` has NO `"type": "module"`
- `apps/api/tsconfig.json` has `"module": "CommonJS"`
- `pnpm-lock.yaml` exists and has content
- `.npmrc` has `frozen-lockfile=false`

Report each fix as it's applied so progress is visible.
When done report: "All fixes applied and pushed. Railway will now redeploy."
