import { describe, it, expect } from 'vitest'
import { calculateBookDimensions } from '../enrichment/bookDimensions.js'

describe('calculateBookDimensions', () => {
  // Constants mirrored from the source for clarity
  const PAGES_PER_MM = 3.5
  const MIN_SPINE_MM = 5
  const PAPERBACK_HEIGHT = 203
  const PAPERBACK_DEPTH = 130
  const HARDCOVER_BONUS = 3
  const POCKET_HEIGHT = 178
  const POCKET_DEPTH = 107

  describe('paperback (default format)', () => {
    it('200-page book gives spine ≈ 57mm', () => {
      const dims = calculateBookDimensions(200)
      // 200 / 3.5 ≈ 57.14 — raw; since > MIN_SPINE, spine = 57.14...
      expect(dims.spineWidthMm).toBeCloseTo(200 / PAGES_PER_MM, 1)
      expect(dims.spineWidthMm).toBeGreaterThan(56)
      expect(dims.spineWidthMm).toBeLessThan(58)
    })

    it('200-page book height is 203mm and depth is 130mm', () => {
      const dims = calculateBookDimensions(200)
      expect(dims.heightMm).toBe(PAPERBACK_HEIGHT)
      expect(dims.depthMm).toBe(PAPERBACK_DEPTH)
    })

    it('50-page book hits the minimum floor (~14mm)', () => {
      // 50 / 3.5 ≈ 14.28 — above MIN_SPINE of 5, so spine ≈ 14.28
      const dims = calculateBookDimensions(50)
      expect(dims.spineWidthMm).toBeCloseTo(50 / PAGES_PER_MM, 1)
      expect(dims.spineWidthMm).toBeGreaterThanOrEqual(14)
      expect(dims.spineWidthMm).toBeLessThan(15)
    })

    it('very thin book (1 page) uses MIN_SPINE floor of 5mm', () => {
      // 1 / 3.5 ≈ 0.29 — below MIN_SPINE
      const dims = calculateBookDimensions(1)
      expect(dims.spineWidthMm).toBe(MIN_SPINE_MM)
    })

    it('0-page book is clamped to 1 page before calculation', () => {
      // clampedPages = max(1, 0) = 1 → spine = max(5, 1/3.5) = 5
      const dims = calculateBookDimensions(0)
      expect(dims.spineWidthMm).toBe(MIN_SPINE_MM)
    })

    it('1000-page book gives spine ≈ 286mm', () => {
      const dims = calculateBookDimensions(1000)
      // 1000 / 3.5 ≈ 285.71
      expect(dims.spineWidthMm).toBeCloseTo(1000 / PAGES_PER_MM, 1)
      expect(dims.spineWidthMm).toBeGreaterThan(285)
      expect(dims.spineWidthMm).toBeLessThan(287)
    })

    it('widthMm equals spineWidthMm for paperback', () => {
      const dims = calculateBookDimensions(300)
      expect(dims.widthMm).toBe(dims.spineWidthMm)
    })
  })

  describe('hardcover format', () => {
    it('adds 3mm to all dimensions', () => {
      const paperback = calculateBookDimensions(200, 'paperback')
      const hardcover = calculateBookDimensions(200, 'hardcover')

      expect(hardcover.spineWidthMm).toBeCloseTo(paperback.spineWidthMm + HARDCOVER_BONUS, 5)
      expect(hardcover.heightMm).toBe(paperback.heightMm + HARDCOVER_BONUS)
      expect(hardcover.depthMm).toBe(paperback.depthMm + HARDCOVER_BONUS)
      expect(hardcover.widthMm).toBeCloseTo(paperback.widthMm + HARDCOVER_BONUS, 5)
    })

    it('hardcover height is 206mm (203 + 3)', () => {
      const dims = calculateBookDimensions(200, 'hardcover')
      expect(dims.heightMm).toBe(PAPERBACK_HEIGHT + HARDCOVER_BONUS)
    })

    it('hardcover depth is 133mm (130 + 3)', () => {
      const dims = calculateBookDimensions(200, 'hardcover')
      expect(dims.depthMm).toBe(PAPERBACK_DEPTH + HARDCOVER_BONUS)
    })

    it('1000-page hardcover spine ≈ 286 + 3 = 289mm', () => {
      const dims = calculateBookDimensions(1000, 'hardcover')
      expect(dims.spineWidthMm).toBeCloseTo(1000 / PAGES_PER_MM + HARDCOVER_BONUS, 1)
    })
  })

  describe('pocket format', () => {
    it('returns smaller height of 178mm', () => {
      const dims = calculateBookDimensions(200, 'pocket')
      expect(dims.heightMm).toBe(POCKET_HEIGHT)
    })

    it('returns smaller depth of 107mm', () => {
      const dims = calculateBookDimensions(200, 'pocket')
      expect(dims.depthMm).toBe(POCKET_DEPTH)
    })

    it('pocket height is less than paperback height', () => {
      const pocket = calculateBookDimensions(200, 'pocket')
      const paperback = calculateBookDimensions(200, 'paperback')
      expect(pocket.heightMm).toBeLessThan(paperback.heightMm)
    })

    it('pocket depth is less than paperback depth', () => {
      const pocket = calculateBookDimensions(200, 'pocket')
      const paperback = calculateBookDimensions(200, 'paperback')
      expect(pocket.depthMm).toBeLessThan(paperback.depthMm)
    })

    it('pocket spineWidthMm equals paperback spineWidthMm (no bonus)', () => {
      const pocket = calculateBookDimensions(200, 'pocket')
      const paperback = calculateBookDimensions(200, 'paperback')
      expect(pocket.spineWidthMm).toBe(paperback.spineWidthMm)
    })
  })
})
