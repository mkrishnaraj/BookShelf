import Anthropic from '@anthropic-ai/sdk'

export interface BookRecommendation {
  title: string
  author: string
  reason: string
  coverUrl?: string
  isbn?: string
}

interface InputBook {
  title: string
  author: string
  genre?: string
}

const SYSTEM_PROMPT = `You are an expert book recommendation engine with deep knowledge of literature across all genres.
Given a reader's current book collection, suggest books they are likely to enjoy based on their taste patterns.
Always return valid JSON only, with no additional commentary.`

export async function getRecommendations(
  userBooks: InputBook[],
  limit = 6,
): Promise<BookRecommendation[]> {
  const apiKey = process.env['ANTHROPIC_API_KEY']
  if (!apiKey) {
    return []
  }

  if (userBooks.length === 0) {
    return []
  }

  // Use top 10 books to keep the prompt concise
  const sampleBooks = userBooks.slice(0, 10)
  const bookList = sampleBooks
    .map((b) => `- "${b.title}" by ${b.author}${b.genre ? ` (${b.genre})` : ''}`)
    .join('\n')

  const userPrompt = `Here are books from my collection:\n${bookList}\n\nSuggest ${limit} books I haven't read yet that I would enjoy based on this collection. Return a JSON array of objects with these fields: title (string), author (string), reason (1 sentence string), isbn (string, optional).`

  try {
    const client = new Anthropic({ apiKey })
    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const raw = response.content[0]?.type === 'text' ? response.content[0].text : ''
    const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()

    let parsed: unknown
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      return []
    }

    if (!Array.isArray(parsed)) return []

    return parsed
      .filter(
        (item): item is BookRecommendation =>
          typeof item === 'object' &&
          item !== null &&
          typeof (item as Record<string, unknown>)['title'] === 'string' &&
          typeof (item as Record<string, unknown>)['author'] === 'string',
      )
      .slice(0, limit)
      .map((item) => {
        const isbn = typeof item.isbn === 'string' ? item.isbn : undefined
        const coverUrl = typeof item.coverUrl === 'string' ? item.coverUrl : undefined
        return {
          title: item.title,
          author: item.author,
          reason: typeof item.reason === 'string' ? item.reason : '',
          ...(isbn !== undefined ? { isbn } : {}),
          ...(coverUrl !== undefined ? { coverUrl } : {}),
        } satisfies BookRecommendation
      })
  } catch {
    return []
  }
}
