# /start-phase-3 — Frontend & 3D Bookshelf

Build the React PWA and Three.js bookshelf. Prerequisites: Phase 2 complete, API running.

## Wave 1 — Foundation (parallel)

### @frontend-agent task A — App shell + routing:
"Set up the React app foundation:
- Install deps: react, react-router-dom, zustand, @tanstack/react-query, tailwindcss, three, @types/three, recharts
- Configure Tailwind with custom bookshelf theme colours (warm wood tones)
- Set up React Router with all routes: /, /dashboard, /shelf/:id, /s/:shareId (public), /stats, /notebook, /wishlist, /settings
- Build AppShell with Sidebar (desktop) and BottomNav (mobile)
- Set up Clerk auth provider wrapping the app
- Set up React Query provider
- Set up Zustand stores: shelfStore, uiStore, userStore
- Configure Axios instance with Clerk JWT interceptor
Return DONE when app shell renders with placeholder pages."

### @frontend-agent task B — 3D Renderer (run in parallel via separate subagent):
"Build the Three.js bookshelf renderer in apps/web/src/components/bookshelf/:
- BookshelfRenderer.ts: Three.js scene, PerspectiveCamera, OrbitControls (limited rotation), ambient + directional lighting, shadow maps
- ShelfMesh.ts: wooden shelf planks using BoxGeometry, MeshStandardMaterial with wood texture (use a procedural wood shader if no texture available)
- BookMesh.ts: each book as BoxGeometry sized by spineWidthCm/heightCm/depthCm, spine colour from book.spineColor, spine label (book title truncated to 20 chars) as canvas texture on spine face
- BookshelfScene.tsx: React component wrapping the canvas, uses ResizeObserver for responsive sizing, disposes all geometries/materials on unmount, renders books in rows on shelf planks
- BookTooltip.tsx: HTML overlay showing title, author, % read on hover (use Three.js raycasting)
The shelf must: fit books spine-out, wrap to next shelf plank when full, support click to select book.
Return DONE with working 3D renderer."

## Wave 2 — Feature Pages (after Wave 1 complete)

### @frontend-agent task — All feature pages:
"Build all remaining pages and components:
1. Dashboard.tsx — grid of ShelfCard components, button to add new shelf, ShelfPicker modal for size selection
2. ShelfView.tsx — full 3D BookshelfScene, sidebar with sort controls, ShelfThemePicker, Add Book button
3. BookForm.tsx — modal: search books (autocomplete via API), or add manually. Shows enriched cover + dimensions preview
4. BookProgress.tsx — slider for % read, textarea for notes, date read picker, star rating
5. Stats.tsx — Recharts bar chart, toggle week/month/year, streak badge
6. Notebook.tsx — tabbed: Notes list + Dictionary list, add entry forms
7. Wishlist.tsx — drag-to-reorder list, add book form
8. ShareShelfModal.tsx — copy link, Twitter/WhatsApp share buttons, OG preview card
9. GoodreadsImport.tsx — file upload, shows parsed preview (first 10 books), confirm import
10. PublicShelf.tsx — unauthenticated shelf view (read-only BookshelfScene), follow link to sign up
Return DONE with all pages built."

## Wave 3 — PWA + Polish (after Wave 2)

### @frontend-agent task:
"Add PWA support and polish:
- manifest.json with name 'Virtual Bookshelf', short_name 'Bookshelf', icons at 192px and 512px, theme_color warm brown, display standalone
- Service worker via Workbox: cache app shell, cache API GET responses 5min TTL, cache book cover images 7 days
- Offline banner component shown when navigator.onLine is false
- Add-to-home-screen prompt after 3rd session (localStorage counter)
- Loading skeletons for shelf load and book search
- Smooth transition animations when books are added/removed from shelf (Three.js GSAP tween)
- Mobile: ensure Three.js canvas fills screen on mobile, touch controls work
Return DONE when PWA scores ≥ 85 on Lighthouse."

## Wave 4 — E2E Tests

### @qa-agent task:
"Write Playwright E2E tests for all critical flows listed in your agent instructions.
Run them against the local dev server (API + web both running).
Report pass/fail for each flow."

## Completion
"Phase 3 complete. Full app running. Run /start-phase-4 to build marketing content."
