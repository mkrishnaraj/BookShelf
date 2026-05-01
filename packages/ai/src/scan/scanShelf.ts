import Anthropic from '@anthropic-ai/sdk'
import { bufferToBase64 } from './imageUtils'

export interface ShelfScanResult {
  detectedBooks: Array<{
    title: string
    author: string
    isbn?: string
    confidence: number
    boundingBox?: { x: number; y: number; width: number; height: number }
  }>
  totalDetected: number
}

const EMPTY_RESULT: ShelfScanResult = { detectedBooks: [], totalDetected: 0 }

/**
 * Scan a bookshelf photograph and identify all visible book spines.
 *
 * Uses Claude claude-haiku-4-5 vision with a high-detail prompt that asks Claude to
 * scan the entire shelf systematically. Returns an array of detected books.
 * If ANTHROPIC_API_KEY is not set or the API call fails, returns empty — never throws.
 */
export async function scanShelf(imageBuffer: Buffer): Promise<ShelfScanResult> {
  const apiKey = process.env['ANTHROPIC_API_KEY']
  if (!apiKey) {
    return EMPTY_RESULT
  }

  try {
    const client = new Anthropic({ apiKey })
    const base64 = bufferToBase64(imageBuffer)

    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 2000,
      system:
        'You are a bookshelf scanning assistant. Identify every book spine visible in bookshelf photographs. Always return valid JSON only.',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: base64,
              },
            },
            {
              type: 'text',
              text: `Identify all book spines visible in this bookshelf photograph. Scan systematically left to right, top shelf to bottom shelf.

For each book, extract:
- title: book title as printed on the spine
- author: author name if visible
- isbn: ISBN if visible (optional)
- confidence: your confidence 0.0 to 1.0

Return ONLY a JSON object with this shape:
{
  "books": [
    {"title": "...", "author": "...", "isbn": "...", "confidence": 0.9},
    {"title": "...", "author": "...", "confidence": 0.7}
  ]
}

Include every book spine you can read, even partially. Omit isbn if not visible. If there are no readable spines, return {"books": []}.`,
            },
          ],
        },
      ],
    })

    const raw =
      response.content[0]?.type === 'text' ? response.content[0].text : ''

    const cleaned = raw
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim()

    let parsed: unknown
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      return EMPTY_RESULT
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return EMPTY_RESULT
    }

    const obj = parsed as Record<string, unknown>
    const rawBooks = obj['books']
    if (!Array.isArray(rawBooks)) return EMPTY_RESULT

    const detectedBooks = rawBooks
      .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
      .map((item) => {
        const title =
          typeof item['title'] === 'string' && item['title'].trim()
            ? item['title'].trim()
            : 'Unknown'
        const author =
          typeof item['author'] === 'string' && item['author'].trim()
            ? item['author'].trim()
            : 'Unknown'
        const isbn =
          typeof item['isbn'] === 'string' && item['isbn'].trim()
            ? item['isbn'].trim()
            : undefined
        const confidenceRaw =
          typeof item['confidence'] === 'number' ? item['confidence'] : 0.5
        const confidence = Math.max(0, Math.min(1, confidenceRaw))

        // Bounding box is optional — Claude may not always provide it
        let boundingBox: { x: number; y: number; width: number; height: number } | undefined
        const bb = item['boundingBox']
        if (
          bb &&
          typeof bb === 'object' &&
          !Array.isArray(bb) &&
          typeof (bb as Record<string, unknown>)['x'] === 'number'
        ) {
          const bbObj = bb as Record<string, unknown>
          boundingBox = {
            x: bbObj['x'] as number,
            y: bbObj['y'] as number,
            width: bbObj['width'] as number,
            height: bbObj['height'] as number,
          }
        }

        return {
          title,
          author,
          confidence,
          ...(isbn !== undefined ? { isbn } : {}),
          ...(boundingBox !== undefined ? { boundingBox } : {}),
        }
      })

    return {
      detectedBooks,
      totalDetected: detectedBooks.length,
    }
  } catch {
    return EMPTY_RESULT
  }
}
