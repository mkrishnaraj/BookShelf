import * as THREE from 'three'

/**
 * Returns a perceived luminance value (0–1) for a hex color string.
 * Uses the standard relative luminance formula.
 */
function hexLuminance(hex: string): number {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.substring(0, 2), 16) / 255
  const g = parseInt(clean.substring(2, 4), 16) / 255
  const b = parseInt(clean.substring(4, 6), 16) / 255

  const linearize = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)

  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b)
}

/**
 * Truncates a string to maxLen characters and appends "…" if needed.
 */
function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  return text.substring(0, maxLen - 1) + '…'
}

/**
 * Creates a THREE.CanvasTexture containing the book spine label.
 * The canvas is oriented vertically (tall): text is rendered rotated 90°
 * so it reads bottom-to-top when the book stands upright.
 *
 * @param title      - Book title (truncated to 18 chars)
 * @param author     - Author name (truncated to 16 chars)
 * @param spineColor - Hex color for the spine background
 * @param widthPx    - Canvas width in pixels (maps to spine width)
 * @param heightPx   - Canvas height in pixels (maps to book height)
 */
export function createSpineTexture(
  title: string,
  author: string,
  spineColor: string,
  widthPx: number,
  heightPx: number,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = widthPx
  canvas.height = heightPx

  const ctx = canvas.getContext('2d')!

  // Background fill
  ctx.fillStyle = spineColor
  ctx.fillRect(0, 0, widthPx, heightPx)

  // Determine contrasting text color based on luminance
  const luminance = hexLuminance(spineColor)
  const textColor = luminance > 0.35 ? '#1a1a1a' : '#ffffff'
  const mutedTextColor = luminance > 0.35 ? '#444444' : '#cccccc'

  // Truncate text
  const displayTitle = truncate(title, 18)
  const displayAuthor = truncate(author, 16)

  // Rotate canvas 90° counter-clockwise so text reads bottom-to-top
  ctx.save()
  ctx.translate(widthPx / 2, heightPx / 2)
  ctx.rotate(-Math.PI / 2)

  // After rotation, the drawable area is heightPx wide and widthPx tall
  const drawWidth = heightPx
  const drawHeight = widthPx

  // Title — bold, sized to fit spine width
  const titleFontSize = Math.max(10, Math.min(drawHeight * 0.38, 22))
  ctx.font = `bold ${titleFontSize}px 'Georgia', serif`
  ctx.fillStyle = textColor
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // If there is enough vertical room show title + author, otherwise just title
  if (drawHeight > 40) {
    const titleY = -drawHeight * 0.1
    ctx.fillText(displayTitle, 0, titleY, drawWidth * 0.88)

    const authorFontSize = Math.max(8, Math.min(drawHeight * 0.24, 14))
    ctx.font = `${authorFontSize}px 'Georgia', serif`
    ctx.fillStyle = mutedTextColor
    const authorY = drawHeight * 0.2
    ctx.fillText(displayAuthor, 0, authorY, drawWidth * 0.85)
  } else {
    ctx.fillText(displayTitle, 0, 0, drawWidth * 0.88)
  }

  ctx.restore()

  // Thin top and bottom edge highlight for a "bevel" effect
  const edgeColor = luminance > 0.35 ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.12)'
  ctx.fillStyle = edgeColor
  ctx.fillRect(0, 0, widthPx, 2)
  ctx.fillRect(0, heightPx - 2, widthPx, 2)

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}
