export interface BookDimensions {
  widthMm: number
  heightMm: number
  depthMm: number
  spineWidthMm: number
}

const MIN_SPINE_MM = 5
const PAGES_PER_MM = 3.5

// Standard trade paperback baseline dimensions (mm)
const PAPERBACK_HEIGHT = 203
const PAPERBACK_DEPTH = 130

// Hardcover adds this to each dimension
const HARDCOVER_BONUS_MM = 3

// Pocket paperback is slightly smaller
const POCKET_HEIGHT = 178
const POCKET_DEPTH = 107

export function calculateBookDimensions(
  pageCount: number,
  format: 'paperback' | 'hardcover' | 'pocket' = 'paperback',
): BookDimensions {
  const clampedPages = Math.max(1, pageCount)
  const rawSpine = clampedPages / PAGES_PER_MM
  const spineWidthMm = Math.max(MIN_SPINE_MM, rawSpine)

  switch (format) {
    case 'hardcover': {
      const bonus = HARDCOVER_BONUS_MM
      return {
        widthMm: spineWidthMm + bonus,
        heightMm: PAPERBACK_HEIGHT + bonus,
        depthMm: PAPERBACK_DEPTH + bonus,
        spineWidthMm: spineWidthMm + bonus,
      }
    }
    case 'pocket': {
      return {
        widthMm: spineWidthMm,
        heightMm: POCKET_HEIGHT,
        depthMm: POCKET_DEPTH,
        spineWidthMm,
      }
    }
    default: {
      // paperback
      return {
        widthMm: spineWidthMm,
        heightMm: PAPERBACK_HEIGHT,
        depthMm: PAPERBACK_DEPTH,
        spineWidthMm,
      }
    }
  }
}
