/**
 * HTTP-based smoke tests for Virtual Bookshelf frontend.
 * Validates routes, static assets, and page content without a real browser.
 * Run with: node e2e/smoke-http.mjs
 */
import http from 'http'
import https from 'https'

const BASE = 'http://localhost:4173'

let passed = 0
let failed = 0
const failures = []

async function get(url) {
  return new Promise((resolve, reject) => {
    const fullUrl = url.startsWith('http') ? url : BASE + url
    const lib = fullUrl.startsWith('https') ? https : http
    const req = lib.get(fullUrl, { timeout: 10000 }, (res) => {
      let body = ''
      res.on('data', chunk => body += chunk)
      res.on('end', () => resolve({ status: res.statusCode, body, headers: res.headers }))
    })
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')) })
  })
}

function assert(name, condition, detail = '') {
  if (condition) {
    console.log(`  PASS  ${name}`)
    passed++
  } else {
    console.log(`  FAIL  ${name}${detail ? ': ' + detail : ''}`)
    failed++
    failures.push({ name, detail })
  }
}

async function run() {
  console.log('\n=== Virtual Bookshelf Smoke Tests (HTTP) ===\n')

  // ── PWA Assets ─────────────────────────────────────────────────────────────
  console.log('PWA Assets:')
  try {
    const r = await get('/manifest.json')
    assert('manifest.json returns 200', r.status === 200, `got ${r.status}`)
    let manifest
    try { manifest = JSON.parse(r.body) } catch { manifest = null }
    assert('manifest.json is valid JSON', manifest !== null)
    if (manifest) {
      assert('manifest.name = "Virtual Bookshelf"', manifest.name === 'Virtual Bookshelf', `got "${manifest.name}"`)
      assert('manifest.short_name = "Bookshelf"', manifest.short_name === 'Bookshelf', `got "${manifest.short_name}"`)
      assert('manifest.display = "standalone"', manifest.display === 'standalone', `got "${manifest.display}"`)
      assert('manifest.start_url = "/"', manifest.start_url === '/', `got "${manifest.start_url}"`)
      assert('manifest.theme_color is set', !!manifest.theme_color, `got "${manifest.theme_color}"`)
      assert('manifest.background_color is set', !!manifest.background_color, `got "${manifest.background_color}"`)
      assert('manifest.icons is an array', Array.isArray(manifest.icons), `got ${typeof manifest.icons}`)
      assert('manifest.icons has at least 1 entry', manifest.icons.length > 0, `got ${manifest.icons.length}`)
    }
  } catch (e) { assert('manifest.json fetch', false, e.message) }

  try {
    const r = await get('/favicon.svg')
    assert('favicon.svg returns 200', r.status === 200, `got ${r.status}`)
  } catch (e) { assert('favicon.svg fetch', false, e.message) }

  try {
    const r = await get('/icon-192.png')
    assert('icon-192.png returns 200', r.status === 200, `got ${r.status}`)
  } catch (e) { assert('icon-192.png fetch', false, e.message) }

  try {
    const r = await get('/icon-512.png')
    assert('icon-512.png returns 200', r.status === 200, `got ${r.status}`)
  } catch (e) { assert('icon-512.png fetch', false, e.message) }

  try {
    const r = await get('/registerSW.js')
    assert('registerSW.js returns 200', r.status === 200, `got ${r.status}`)
  } catch (e) { assert('registerSW.js fetch', false, e.message) }

  try {
    const r = await get('/sw.js')
    assert('sw.js returns 200', r.status === 200, `got ${r.status}`)
  } catch (e) { assert('sw.js fetch', false, e.message) }

  // ── index.html ──────────────────────────────────────────────────────────────
  console.log('\nindex.html / SPA Shell:')
  let indexHtml = ''
  try {
    const r = await get('/')
    assert('/ returns 200', r.status === 200, `got ${r.status}`)
    indexHtml = r.body
    assert('/ has DOCTYPE html', indexHtml.includes('<!DOCTYPE html'), 'missing DOCTYPE')
    assert('/ title = "Virtual Bookshelf"', indexHtml.includes('<title>Virtual Bookshelf</title>'), 'title not found')
    assert('/ has viewport meta tag', indexHtml.includes('name="viewport"'), 'viewport meta missing')
    assert('/ has theme-color #1a1a2e', indexHtml.includes('content="#1a1a2e"'), 'theme-color not found')
    assert('/ has id="root" div', indexHtml.includes('id="root"'), 'root div missing')
    assert('/ references main JS bundle', indexHtml.includes('/assets/') && indexHtml.includes('.js'), 'JS bundle reference missing')
    assert('/ references CSS bundle', indexHtml.includes('/assets/') && indexHtml.includes('.css'), 'CSS bundle reference missing')
    assert('/ has registerSW.js script', indexHtml.includes('/registerSW.js'), 'PWA registerSW.js missing')
  } catch (e) { assert('/ fetch', false, e.message) }

  // ── SPA routes return index.html (HTML5 history fallback) ──────────────────
  console.log('\nSPA Route Fallback (HTML5 history):')
  const spaRoutes = [
    '/pricing',
    '/sign-in',
    '/sign-up',
    '/dashboard',
    '/stats',
    '/notebook',
    '/wishlist',
    '/settings',
    '/store',
    '/seller',
    '/s/test-shelf',
    '/s/example',
    '/totally-nonexistent-page-12345',
  ]
  for (const route of spaRoutes) {
    try {
      const r = await get(route)
      // Vite preview serves index.html for all non-asset routes (SPA fallback)
      // Status is 200 and body is HTML
      assert(
        `${route} returns 200 (SPA fallback)`,
        r.status === 200,
        `got ${r.status}`
      )
      if (r.status === 200) {
        assert(
          `${route} body is HTML`,
          r.body.includes('<!DOCTYPE html'),
          'not HTML'
        )
      }
    } catch (e) { assert(`${route} fetch`, false, e.message) }
  }

  // ── Static JS bundle ────────────────────────────────────────────────────────
  console.log('\nStatic JS Bundle:')
  try {
    const indexPage = await get('/')
    const jsBundleMatch = indexPage.body.match(/src="(\/assets\/index-[^"]+\.js)"/)
    if (jsBundleMatch) {
      const bundleUrl = jsBundleMatch[1]
      const r = await get(bundleUrl)
      assert(`${bundleUrl} returns 200`, r.status === 200, `got ${r.status}`)
      assert('JS bundle is non-empty', r.body.length > 100000, `size: ${r.body.length} bytes`)
      // Check that key library code is in the bundle
      assert('Bundle contains React', r.body.includes('React') || r.body.includes('createElement'), 'React not found')
      assert('Bundle contains react-router', r.body.includes('useNavigate') || r.body.includes('BrowserRouter'), 'react-router not found')
      assert('Bundle contains Clerk', r.body.includes('ClerkProvider') || r.body.includes('clerk'), 'Clerk not found')
    } else {
      assert('JS bundle URL found in index.html', false, 'Could not find bundle URL')
    }
  } catch (e) { assert('JS bundle fetch', false, e.message) }

  // ── CSS bundle ──────────────────────────────────────────────────────────────
  console.log('\nCSS Bundle:')
  try {
    const indexPage = await get('/')
    const cssBundleMatch = indexPage.body.match(/href="(\/assets\/index-[^"]+\.css)"/)
    if (cssBundleMatch) {
      const cssUrl = cssBundleMatch[1]
      const r = await get(cssUrl)
      assert(`${cssUrl} returns 200`, r.status === 200, `got ${r.status}`)
      assert('CSS bundle is non-empty', r.body.length > 1000, `size: ${r.body.length} bytes`)
      // Tailwind compiled CSS contains media queries and color variables
      assert('CSS bundle contains Tailwind utilities', r.body.includes('@media') || r.body.includes('flex'), 'Tailwind not found')
    } else {
      assert('CSS bundle URL found in index.html', false, 'Could not find bundle URL')
    }
  } catch (e) { assert('CSS bundle fetch', false, e.message) }

  // ── 404 for unknown static assets ──────────────────────────────────────────
  // NOTE: Vite Preview serves index.html (SPA fallback) for all unknown paths
  // including those under /assets/ — this is by-design in dev/preview mode.
  // In production with nginx/CDN, /assets/nonexistent.js would 404.
  // We verify that the response is either 404 OR contains the SPA shell HTML.
  console.log('\nUnknown Static Assets:')
  try {
    const r = await get('/assets/nonexistent-file.js')
    const isExpected = r.status === 404 || (r.status === 200 && r.body.includes('<!DOCTYPE html'))
    assert(
      '/assets/nonexistent.js returns 404 or SPA fallback',
      isExpected,
      `got ${r.status}, body starts with: ${r.body.substring(0, 50)}`
    )
  } catch (e) { assert('/assets/nonexistent.js fetch', false, e.message) }

  // ── Bundle content analysis ──────────────────────────────────────────────────
  console.log('\nBundle Content Analysis (routing and components):')
  try {
    const indexPage = await get('/')
    const jsBundleMatch = indexPage.body.match(/src="(\/assets\/index-[^"]+\.js)"/)
    if (jsBundleMatch) {
      const r = await get(jsBundleMatch[1])
      const bundle = r.body

      // Route paths baked into the React Router config
      assert('Bundle contains /pricing route', bundle.includes('/pricing'), '/pricing route not found')
      assert('Bundle contains /dashboard route', bundle.includes('/dashboard'), '/dashboard route not found')
      assert('Bundle contains /sign-in route', bundle.includes('/sign-in'), '/sign-in route not found')
      assert('Bundle contains /sign-up route', bundle.includes('/sign-up'), '/sign-up route not found')
      assert('Bundle contains /s/:slug route', bundle.includes('/s/'), '/s/:slug route not found')
      assert('Bundle contains /settings route', bundle.includes('/settings'), '/settings route not found')
      assert('Bundle contains /stats route', bundle.includes('/stats'), '/stats route not found')
      assert('Bundle contains /seller route', bundle.includes('/seller'), '/seller route not found')

      // UI copy strings
      assert('Bundle contains "Virtual Bookshelf" brand name', bundle.includes('Virtual Bookshelf'), 'brand name not found')
      assert('Bundle contains hero headline text', bundle.includes('Your library deserves'), 'hero headline not found')
      assert('Bundle contains pricing section heading', bundle.includes('Pick the shelf that fits'), 'pricing heading not found')
      assert('Bundle contains FAQ section heading', bundle.includes('Questions readers ask'), 'FAQ heading not found')
      assert('Bundle contains social proof text', bundle.includes('10,000+ readers'), 'social proof not found')
      assert('Bundle contains camera scan section', bundle.includes('Add a book in three seconds'), 'camera scan section not found')
      assert('Bundle contains Goodreads CSV source', bundle.includes('Goodreads CSV'), 'Goodreads source not found')
      assert('Bundle contains Kindle source', bundle.includes('Kindle'), 'Kindle source not found')
      assert('Bundle contains "Camera scan" source', bundle.includes('Camera scan'), 'Camera scan source not found')

      // Plan names
      assert('Bundle contains Free plan', bundle.includes('"Free"') || bundle.includes("'Free'") || bundle.includes('>Free<') || bundle.includes('Free plan'), 'Free plan not found')
      assert('Bundle contains Reader plan', bundle.includes('Reader'), 'Reader plan not found')
      assert('Bundle contains Collector plan', bundle.includes('Collector'), 'Collector plan not found')
      assert('Bundle contains Bibliophile plan', bundle.includes('Bibliophile'), 'Bibliophile plan not found')

      // Pricing amounts
      assert('Bundle contains $3.99 pricing', bundle.includes('3.99'), 'Reader price not found')
      assert('Bundle contains $7.99 pricing', bundle.includes('7.99'), 'Collector price not found')
      assert('Bundle contains $12.99 pricing', bundle.includes('12.99'), 'Bibliophile price not found')

      // Footer links
      assert('Bundle contains /privacy link', bundle.includes('/privacy'), '/privacy link not found')
      assert('Bundle contains /terms link', bundle.includes('/terms'), '/terms link not found')
      assert('Bundle contains /store link', bundle.includes('/store'), '/store link not found')

      // Pricing page FAQ text
      assert('Bundle contains "Can I cancel anytime"', bundle.includes('Can I cancel anytime'), 'Pricing FAQ not found')
      assert('Bundle contains "Cancel from Settings"', bundle.includes('Cancel from Settings'), 'Pricing FAQ answer not found')

      // Public shelf elements
      assert('Bundle contains "Create your own shelf"', bundle.includes('Create your own shelf'), 'PublicShelf CTA not found')
      assert('Bundle contains "Return home" link text', bundle.includes('Return home'), 'PublicShelf error state not found')

      // ProtectedRoute — checks that ProtectedRoute is in the bundle
      assert('Bundle contains ProtectedRoute logic', bundle.includes('isSignedIn') || bundle.includes('ProtectedRoute'), 'ProtectedRoute not found')

      // Pricing page toggle
      assert('Bundle contains annual toggle (aria-checked)', bundle.includes('aria-checked'), 'annual toggle not found')

      // Feature comparison table
      assert('Bundle contains Feature comparison table', bundle.includes('Feature comparison'), 'feature table not found')

      // Footer copyright
      assert('Bundle contains footer copyright 2026', bundle.includes('2026 Virtual Bookshelf'), 'footer copyright not found')

      // See an example shelf CTA
      assert('Bundle contains /s/example link', bundle.includes('/s/example'), 'example shelf link not found')
    } else {
      assert('Bundle available for content analysis', false, 'Bundle URL not found')
    }
  } catch (e) { assert('Bundle content analysis', false, e.message) }

  // ── Summary ─────────────────────────────────────────────────────────────────
  const total = passed + failed
  console.log(`\n${'='.repeat(50)}`)
  console.log(`Results: ${passed} passed, ${failed} failed out of ${total} tests`)
  if (failures.length > 0) {
    console.log('\nFailed tests:')
    for (const f of failures) {
      console.log(`  - ${f.name}${f.detail ? ' (' + f.detail + ')' : ''}`)
    }
  }
  console.log('='.repeat(50))
  process.exit(failed > 0 ? 1 : 0)
}

run().catch(e => {
  console.error('Smoke test runner error:', e.message)
  process.exit(1)
})
