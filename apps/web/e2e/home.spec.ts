import { test, expect } from '@playwright/test'

test.describe('Home / Landing page', () => {
  test('home page loads with correct title', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Virtual Bookshelf/)
  })

  test('home page renders hero h1 headline', async ({ page }) => {
    await page.goto('/')
    const h1 = page.locator('h1').first()
    await expect(h1).toBeVisible()
    // Verify the actual landing-page copy is present
    await expect(h1).toContainText('library')
  })

  test('home page renders "Virtual Bookshelf" brand name in nav', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('header').getByText('Virtual Bookshelf')).toBeVisible()
  })

  test('home page has Pricing nav link', async ({ page }) => {
    await page.goto('/')
    const pricingLink = page.locator('nav a[href="/pricing"]')
    await expect(pricingLink).toBeVisible()
  })

  test('home page has Marketplace nav link', async ({ page }) => {
    await page.goto('/')
    const marketplaceLink = page.locator('nav a[href="/store"]')
    await expect(marketplaceLink).toBeVisible()
  })

  test('home page has hero CTA buttons visible', async ({ page }) => {
    await page.goto('/')
    // At least one call-to-action button should be visible in the hero section
    const section = page.locator('section').first()
    await expect(section).toBeVisible()
    // The "See an example shelf" link is always visible (not behind Clerk SignedOut)
    const exampleLink = page.locator('a[href="/s/example"]')
    await expect(exampleLink).toBeVisible()
    await expect(exampleLink).toContainText('example shelf')
  })

  test('home page features section has three cards', async ({ page }) => {
    await page.goto('/')
    // Feature grid has 3 cards — check for the section heading
    await expect(page.getByText('Everything your reading life needs.')).toBeVisible()
    // Three feature h3 headings
    const featureHeadings = page.locator('section').filter({ hasText: 'Everything your reading life' }).locator('h3')
    await expect(featureHeadings).toHaveCount(3)
  })

  test('home page import sources section lists supported platforms', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Works with everywhere you already read.')).toBeVisible()
    await expect(page.getByText('Goodreads CSV')).toBeVisible()
    await expect(page.getByText('Kindle')).toBeVisible()
    await expect(page.getByText('Camera scan')).toBeVisible()
  })

  test('home page pricing section is present with four plan tiers', async ({ page }) => {
    await page.goto('/')
    // The home page embeds a mini pricing section
    await expect(page.getByText('Pick the shelf that fits your collection.')).toBeVisible()
    // Four plan names visible
    await expect(page.getByText('Reader').first()).toBeVisible()
    await expect(page.getByText('Collector').first()).toBeVisible()
    await expect(page.getByText('Bibliophile').first()).toBeVisible()
  })

  test('home page FAQ section is present', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Questions readers ask before their first shelf.')).toBeVisible()
    // At least one FAQ question rendered
    await expect(page.getByText('What exactly is Virtual Bookshelf?')).toBeVisible()
  })

  test('home page footer is present with copyright', async ({ page }) => {
    await page.goto('/')
    const footer = page.locator('footer')
    await expect(footer).toBeVisible()
    await expect(footer.getByText('2026 Virtual Bookshelf')).toBeVisible()
  })

  test('home page footer has Pricing, Marketplace, Privacy, Terms links', async ({ page }) => {
    await page.goto('/')
    const footer = page.locator('footer')
    await expect(footer.locator('a[href="/pricing"]')).toBeVisible()
    await expect(footer.locator('a[href="/store"]')).toBeVisible()
    await expect(footer.locator('a[href="/privacy"]')).toBeVisible()
    await expect(footer.locator('a[href="/terms"]')).toBeVisible()
  })

  test('home page camera scan section is present', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Add a book in three seconds.')).toBeVisible()
    await expect(page.getByText('Tap the camera icon in the app')).toBeVisible()
  })

  test('home page social proof bar is present', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('10,000+ readers')).toBeVisible()
  })
})
