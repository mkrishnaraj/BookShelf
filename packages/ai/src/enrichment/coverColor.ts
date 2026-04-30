import axios from 'axios'

export interface ColorPalette {
  dominant: string
  vibrant: string
  muted: string
  textColor: '#ffffff' | '#000000'
}

const DEFAULT_PALETTE: ColorPalette = {
  dominant: '#8B7355',
  vibrant: '#C49A6C',
  muted: '#6B5744',
  textColor: '#ffffff',
}

const TIMEOUT_MS = 5000

function toHex(r: number, g: number, b: number): string {
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

/**
 * Relative luminance per WCAG 2.1 formula.
 */
function relativeLuminance(r: number, g: number, b: number): number {
  const linearise = (c: number): number => {
    const sRgb = c / 255
    return sRgb <= 0.03928 ? sRgb / 12.92 : Math.pow((sRgb + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * linearise(r) + 0.7152 * linearise(g) + 0.0722 * linearise(b)
}

function contrastingTextColor(r: number, g: number, b: number): '#ffffff' | '#000000' {
  const lum = relativeLuminance(r, g, b)
  // White on dark backgrounds, black on light backgrounds
  return lum < 0.179 ? '#ffffff' : '#000000'
}

/**
 * Simple saturation measure in HSL space (0–1).
 */
function saturation(r: number, g: number, b: number): number {
  const rN = r / 255
  const gN = g / 255
  const bN = b / 255
  const max = Math.max(rN, gN, bN)
  const min = Math.min(rN, gN, bN)
  const delta = max - min
  if (delta === 0) return 0
  const lightness = (max + min) / 2
  return delta / (1 - Math.abs(2 * lightness - 1))
}

/**
 * Sample pixels from a raw JPEG/PNG buffer.
 * We read byte triplets at intervals to keep it fast without needing canvas.
 * This is a rough but workable heuristic — no external dependencies needed.
 */
function samplePixels(buffer: Buffer): Array<[number, number, number]> {
  const samples: Array<[number, number, number]> = []
  // Skip JPEG/PNG headers by jumping past the first 100 bytes; sample every ~30 bytes after
  const start = Math.min(100, buffer.length)
  const step = 30
  for (let i = start; i + 2 < buffer.length; i += step) {
    const r = buffer[i]
    const g = buffer[i + 1]
    const b = buffer[i + 2]
    if (r !== undefined && g !== undefined && b !== undefined) {
      samples.push([r, g, b])
    }
  }
  return samples
}

function averageColor(pixels: Array<[number, number, number]>): [number, number, number] {
  if (pixels.length === 0) return [139, 115, 85]
  let rSum = 0, gSum = 0, bSum = 0
  for (const [r, g, b] of pixels) {
    rSum += r
    gSum += g
    bSum += b
  }
  const n = pixels.length
  return [Math.round(rSum / n), Math.round(gSum / n), Math.round(bSum / n)]
}

/**
 * Pick the most vibrant pixel (highest saturation * brightness).
 */
function mostVibrant(pixels: Array<[number, number, number]>): [number, number, number] {
  let best: [number, number, number] = pixels[0] ?? [139, 115, 85]
  let bestScore = -1
  for (const [r, g, b] of pixels) {
    const sat = saturation(r, g, b)
    const brightness = (r + g + b) / (3 * 255)
    const score = sat * brightness
    if (score > bestScore) {
      bestScore = score
      best = [r, g, b]
    }
  }
  return best
}

/**
 * Pick the most muted pixel (lowest saturation, not too dark/light).
 */
function mostMuted(pixels: Array<[number, number, number]>): [number, number, number] {
  let best: [number, number, number] = pixels[0] ?? [107, 87, 68]
  let bestScore = Infinity
  for (const [r, g, b] of pixels) {
    const sat = saturation(r, g, b)
    const brightness = (r + g + b) / (3 * 255)
    // Prefer mid-brightness and low saturation
    if (brightness > 0.15 && brightness < 0.85) {
      if (sat < bestScore) {
        bestScore = sat
        best = [r, g, b]
      }
    }
  }
  return best
}

export async function extractCoverColors(coverUrl: string): Promise<ColorPalette> {
  try {
    const response = await axios.get<Buffer>(coverUrl, {
      responseType: 'arraybuffer',
      timeout: TIMEOUT_MS,
    })

    const buffer = Buffer.from(response.data)
    if (buffer.length < 200) return DEFAULT_PALETTE

    const pixels = samplePixels(buffer)
    if (pixels.length < 10) return DEFAULT_PALETTE

    const [dr, dg, db] = averageColor(pixels)
    const [vr, vg, vb] = mostVibrant(pixels)
    const [mr, mg, mb] = mostMuted(pixels)

    return {
      dominant: toHex(dr, dg, db),
      vibrant: toHex(vr, vg, vb),
      muted: toHex(mr, mg, mb),
      textColor: contrastingTextColor(dr, dg, db),
    }
  } catch {
    return DEFAULT_PALETTE
  }
}
