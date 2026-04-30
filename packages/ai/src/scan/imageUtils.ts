import axios from 'axios'

const TIMEOUT_MS = 10000

/**
 * Download an image from a URL and return its raw buffer.
 */
export async function downloadImage(url: string): Promise<Buffer> {
  const response = await axios.get<Buffer>(url, {
    responseType: 'arraybuffer',
    timeout: TIMEOUT_MS,
  })
  return Buffer.from(response.data)
}

/**
 * Convert an image buffer to a base64 string (no data URI prefix).
 */
export function imageToBase64(buffer: Buffer): string {
  return buffer.toString('base64')
}

/**
 * Alias for imageToBase64 — provided for clarity at call sites.
 */
export function bufferToBase64(buffer: Buffer): string {
  return buffer.toString('base64')
}
