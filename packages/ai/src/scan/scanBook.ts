import Anthropic from '@anthropic-ai/sdk'
import { bufferToBase64 } from './imageUtils.js'

export interface ScannedBook {
  title: string
  author: string
  isbn?: string
  confidence: number
}

const FALLBACK_RESULT: ScannedBook = {
  title: 'Unknown',
  author: 'Unknown',
  confidence: 0,
}

/**
 * Analyse a book cover or spine image and extract bibliographic data.
 *
 * Uses Claude claude-haiku-4-5 vision. If ANTHROPIC_API_KEY is not set or the
 * API call fails, returns a zero-confidence fallback result — never throws.
 */
export async function scanBook(imageBuffer: Buffer): Promise<ScannedBook> {
  const apiKey = process.env['ANTHROPIC_API_KEY']
  if (!apiKey) {
    return FALLBACK_RESULT
  }

  try {
    const client = new Anthropic({ apiKey })
    const base64 = bufferToBase64(imageBuffer)

    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 300,
      system:
        'You are a book identification assistant. Extract book title and author from book cover or spine images. Always return valid JSON only.',
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
              text: `Extract book title and author from this book cover or spine image.
Return ONLY a JSON object with this shape:
{"title": "...", "author": "...", "isbn": "...", "confidence": 0.0}

- title: exact title as shown (required)
- author: author name as shown (required)
- isbn: ISBN number if visible (optional, omit if not visible)
- confidence: your confidence level 0.0 to 1.0

If you cannot identify the book at all, return:
{"title": "Unknown", "author": "Unknown", "confidence": 0}`,
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
      return FALLBACK_RESULT
    }

    if (!parsed || typeof parsed !== 'object') return FALLBACK_RESULT

    const obj = parsed as Record<string, unknown>
    const title =
      typeof obj['title'] === 'string' && obj['title'].trim()
        ? obj['title'].trim()
        : 'Unknown'
    const author =
      typeof obj['author'] === 'string' && obj['author'].trim()
        ? obj['author'].trim()
        : 'Unknown'
    const isbn =
      typeof obj['isbn'] === 'string' && obj['isbn'].trim()
        ? obj['isbn'].trim()
        : undefined
    const confidenceRaw =
      typeof obj['confidence'] === 'number' ? obj['confidence'] : 0
    const confidence = Math.max(0, Math.min(1, confidenceRaw))

    return {
      title,
      author,
      confidence,
      ...(isbn !== undefined ? { isbn } : {}),
    }
  } catch {
    return FALLBACK_RESULT
  }
}
